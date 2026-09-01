const http = require('http');
const assert = require('assert');
const path = require('path');
const handler = require('../index');

async function testServerEntrypoint() {
  console.log('Testing index.js serverless and static entrypoint...');

  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  function rawRequest(reqPath, options = {}) {
    return new Promise((resolve, reject) => {
      const opts = {
        hostname: '127.0.0.1',
        port: port,
        path: reqPath,
        method: options.method || 'GET',
        headers: options.headers || {}
      };
      const req = http.request(opts, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks)
          });
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  let passed = 0;
  let total = 0;
  const failures = [];

  async function check(name, fn) {
    total++;
    try {
      await fn();
      passed++;
    } catch (err) {
      failures.push({
        suiteName: 'Server Entrypoint & Vercel Compatibility',
        testName: name,
        error: err.message,
        stack: err.stack
      });
    }
  }

  try {
    // 1. Root route / -> index.html
    await check('GET / serves index.html with 200 and text/html', async () => {
      const res = await rawRequest('/');
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('text/html'));
      assert(res.headers['cache-control'].includes('must-revalidate') || res.headers['cache-control'].includes('max-age=0'));
      assert(res.body.toString().includes('Nutrinance') || res.body.toString().includes('<!DOCTYPE html>'));
    });

    // 2. CSS route
    await check('GET /styles.css serves styles.css with 200 and text/css', async () => {
      const res = await rawRequest('/styles.css');
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('text/css'));
      assert(res.headers['cache-control'].includes('immutable') || res.headers['cache-control'].includes('max-age'));
      assert(res.headers['etag']);
      assert(res.headers['last-modified']);
      assert(res.body.length > 100);
    });

    // 3. JavaScript route
    await check('GET /script.js serves script.js with 200 and text/javascript', async () => {
      const res = await rawRequest('/script.js');
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('text/javascript') || res.headers['content-type'].includes('application/javascript'));
      assert(res.body.length > 100);
    });

    // 4. Logo PNG asset
    await check('GET /assets/logo.png serves logo image with 200 and image/png', async () => {
      const res = await rawRequest('/assets/logo.png');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers['content-type'], 'image/png');
      assert(res.body.length > 0);
    });

    // 5. Logo SVG asset
    await check('GET /assets/logo.svg serves SVG with 200 and image/svg+xml', async () => {
      const res = await rawRequest('/assets/logo.svg');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers['content-type'], 'image/svg+xml');
      assert(res.body.length > 0);
    });

    // 6. Recipe SVG asset in subfolder
    await check('GET /assets/recipes/breakfast-1.svg serves SVG with 200', async () => {
      const res = await rawRequest('/assets/recipes/breakfast-1.svg');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers['content-type'], 'image/svg+xml');
      assert(res.body.length > 0);
    });

    // 7. Clean URL: /nutrinance-demo
    await check('GET /nutrinance-demo resolves clean URL to nutrinance-demo.html', async () => {
      const res = await rawRequest('/nutrinance-demo');
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('text/html'));
      assert(res.body.length > 0);
    });

    // 8. Clean URL with trailing slash: /nutrinance-demo/
    await check('GET /nutrinance-demo/ resolves clean URL with trailing slash to nutrinance-demo.html', async () => {
      const res = await rawRequest('/nutrinance-demo/');
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('text/html'));
      assert(res.body.length > 0);
    });

    // 9. Query parameter handling
    await check('GET /styles.css?v=test1234 resolves correctly with query params', async () => {
      const res = await rawRequest('/styles.css?v=test1234');
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('text/css'));
    });

    // 10. HEAD request
    await check('HEAD / serves headers without body', async () => {
      const res = await rawRequest('/', { method: 'HEAD' });
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('text/html'));
      assert.strictEqual(res.body.length, 0);
    });

    // 11. CORS Preflight OPTIONS request
    await check('OPTIONS / returns 204 with CORS and Allow headers', async () => {
      const res = await rawRequest('/', { method: 'OPTIONS' });
      assert.strictEqual(res.statusCode, 204);
      assert.strictEqual(res.headers['access-control-allow-origin'], '*');
      assert(res.headers['access-control-allow-methods'].includes('GET'));
      assert(res.headers['access-control-allow-methods'].includes('OPTIONS'));
      assert.strictEqual(res.body.length, 0);
    });

    // 12. Security: Hidden / Dotfile Protection
    await check('GET /.git/config returns 403 Forbidden', async () => {
      const res = await rawRequest('/.git/config');
      assert.strictEqual(res.statusCode, 403);
    });

    // 13. Security: Path Traversal Protection
    await check('GET /../../windows/win.ini returns 403 Forbidden', async () => {
      const res = await rawRequest('/%2e%2e/%2e%2e/windows/win.ini');
      assert.strictEqual(res.statusCode, 403);
    });

    // 14. 404 Not Found for non-existent routes
    await check('GET /non-existent-route-404.html returns 404', async () => {
      const res = await rawRequest('/non-existent-route-404.html');
      assert.strictEqual(res.statusCode, 404);
    });

    // 15. Directory route without index.html returns 404
    await check('GET /assets returns 404 when directory lacks index.html', async () => {
      const res = await rawRequest('/assets');
      assert.strictEqual(res.statusCode, 404);
    });

    // 16. 405 Method Not Allowed for POST/PUT with Allow header
    await check('POST / returns 405 with Allow header', async () => {
      const res = await rawRequest('/', { method: 'POST' });
      assert.strictEqual(res.statusCode, 405);
      assert(res.headers['allow'].includes('GET'));
      assert(res.headers['allow'].includes('OPTIONS'));
    });

    // 17. Security header X-Content-Type-Options & CORS
    await check('Responses include X-Content-Type-Options: nosniff and Access-Control-Allow-Origin: *', async () => {
      const res = await rawRequest('/styles.css');
      assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
      assert.strictEqual(res.headers['access-control-allow-origin'], '*');
      assert.strictEqual(res.headers['accept-ranges'], 'bytes');
    });

    // 18. HTTP 206 Partial Content (Byte Range Request start-end)
    await check('GET /styles.css with Range: bytes=0-49 returns 206 Partial Content', async () => {
      const res = await rawRequest('/styles.css', { headers: { 'Range': 'bytes=0-49' } });
      assert.strictEqual(res.statusCode, 206);
      assert.strictEqual(res.body.length, 50);
      assert(res.headers['content-range'].startsWith('bytes 0-49/'));
      assert.strictEqual(res.headers['content-length'], '50');
    });

    // 19. HTTP 206 Partial Content (Byte Range Request suffix)
    await check('GET /styles.css with Range: bytes=-50 returns 206 with last 50 bytes', async () => {
      const res = await rawRequest('/styles.css', { headers: { 'Range': 'bytes=-50' } });
      assert.strictEqual(res.statusCode, 206);
      assert.strictEqual(res.body.length, 50);
      assert(res.headers['content-range'].includes('/'));
    });

    // 20. HTTP 416 Range Not Satisfiable
    await check('GET /styles.css with unsatisfiable range returns 416', async () => {
      const res = await rawRequest('/styles.css', { headers: { 'Range': 'bytes=9999999-9999999' } });
      assert.strictEqual(res.statusCode, 416);
      assert(res.headers['content-range'].startsWith('bytes */'));
    });

    // 21. HTTP 304 Conditional Request (If-None-Match)
    await check('GET /styles.css with matching If-None-Match returns 304 Not Modified', async () => {
      const initRes = await rawRequest('/styles.css');
      const etag = initRes.headers['etag'];
      assert(etag);
      const condRes = await rawRequest('/styles.css', { headers: { 'If-None-Match': etag } });
      assert.strictEqual(condRes.statusCode, 304);
      assert.strictEqual(condRes.body.length, 0);
    });

    // 22. HTTP 304 Conditional Request (If-Modified-Since)
    await check('GET /styles.css with fresh If-Modified-Since returns 304 Not Modified', async () => {
      const futureDate = new Date(Date.now() + 86400000).toUTCString();
      const condRes = await rawRequest('/styles.css', { headers: { 'If-Modified-Since': futureDate } });
      assert.strictEqual(condRes.statusCode, 304);
      assert.strictEqual(condRes.body.length, 0);
    });

    // 23. Malformed URI handling
    await check('GET /% malformed URL returns 400 Bad Request', async () => {
      const res = await rawRequest('/%');
      assert.strictEqual(res.statusCode, 400);
    });

    // 24. Suffix range exceeding file size (RFC 7233 §2.1)
    await check('GET /styles.css with suffix range exceeding file size returns 206 full representation', async () => {
      const res = await rawRequest('/styles.css', { headers: { 'Range': 'bytes=-999999' } });
      assert.strictEqual(res.statusCode, 206);
      assert(res.headers['content-range'].startsWith('bytes 0-'));
      assert(res.body.length > 100);
    });

    // 25. Exact Last-Modified timestamp in If-Modified-Since (ms truncation test)
    await check('GET /styles.css with exact Last-Modified header returns 304 Not Modified', async () => {
      const initRes = await rawRequest('/styles.css');
      const lastMod = initRes.headers['last-modified'];
      assert(lastMod);
      const condRes = await rawRequest('/styles.css', { headers: { 'If-Modified-Since': lastMod } });
      assert.strictEqual(condRes.statusCode, 304);
      assert.strictEqual(condRes.body.length, 0);
    });

    // 26. Comma-separated If-None-Match with weak ETag matching
    await check('GET /styles.css with comma-separated If-None-Match list returns 304', async () => {
      const initRes = await rawRequest('/styles.css');
      const etag = initRes.headers['etag'];
      assert(etag);
      const condRes = await rawRequest('/styles.css', { headers: { 'If-None-Match': `"dummy-etag", ${etag}` } });
      assert.strictEqual(condRes.statusCode, 304);
      assert.strictEqual(condRes.body.length, 0);
    });

    // 27. RFC 7233 If-Range header handling
    await check('GET /styles.css with If-Range validator matching returns 206, mismatching returns 200', async () => {
      const initRes = await rawRequest('/styles.css');
      const etag = initRes.headers['etag'];
      // Matching If-Range -> 206
      const matchRes = await rawRequest('/styles.css', {
        headers: { 'Range': 'bytes=0-49', 'If-Range': etag }
      });
      assert.strictEqual(matchRes.statusCode, 206);
      assert.strictEqual(matchRes.body.length, 50);

      // Mismatching If-Range -> 200
      const mismatchRes = await rawRequest('/styles.css', {
        headers: { 'Range': 'bytes=0-49', 'If-Range': '"stale-etag-value"' }
      });
      assert.strictEqual(mismatchRes.statusCode, 200);
      assert(mismatchRes.body.length > 50);
    });

    // 28. RFC 7232 If-Match Precondition
    await check('GET /styles.css with mismatching If-Match returns 412 Precondition Failed', async () => {
      const res = await rawRequest('/styles.css', { headers: { 'If-Match': '"wrong-etag-val"' } });
      assert.strictEqual(res.statusCode, 412);
    });

    // 29. RFC 7232 If-Unmodified-Since Precondition
    await check('GET /styles.css with past date If-Unmodified-Since returns 412 Precondition Failed', async () => {
      const pastDate = new Date('2020-01-01T00:00:00Z').toUTCString();
      const res = await rawRequest('/styles.css', { headers: { 'If-Unmodified-Since': pastDate } });
      assert.strictEqual(res.statusCode, 412);
    });

    // 30. Backslash path normalization
    await check('GET /assets\\logo.png normalizes backslash to forward slash and returns 200', async () => {
      const res = await rawRequest('/assets\\logo.png');
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers['content-type'], 'image/png');
      assert(res.body.length > 0);
    });

    // 31. Unquoted ETag in If-None-Match
    await check('GET /styles.css with unquoted If-None-Match returns 304 Not Modified', async () => {
      const initRes = await rawRequest('/styles.css');
      const etag = initRes.headers['etag'];
      const rawTag = etag.replace(/^W\//, '').replace(/^"|"$/g, '');
      const condRes = await rawRequest('/styles.css', { headers: { 'If-None-Match': rawTag } });
      assert.strictEqual(condRes.statusCode, 304);
      assert.strictEqual(condRes.body.length, 0);
    });

    // 32. Wildcard If-Match: *
    await check('GET /styles.css with If-Match: * returns 200 OK', async () => {
      const res = await rawRequest('/styles.css', { headers: { 'If-Match': '*' } });
      assert.strictEqual(res.statusCode, 200);
    });

    // 33. RFC 7232 §3.4 If-Match precedence over If-Unmodified-Since
    await check('GET /styles.css with valid If-Match and past If-Unmodified-Since returns 200 OK', async () => {
      const initRes = await rawRequest('/styles.css');
      const etag = initRes.headers['etag'];
      const pastDate = new Date('2020-01-01T00:00:00Z').toUTCString();
      const res = await rawRequest('/styles.css', {
        headers: { 'If-Match': etag, 'If-Unmodified-Since': pastDate }
      });
      assert.strictEqual(res.statusCode, 200);
    });

    // 34. If-Range with HTTP Date format matching Last-Modified
    await check('GET /styles.css with If-Range Date matching returns 206, stale returns 200', async () => {
      const initRes = await rawRequest('/styles.css');
      const lastMod = initRes.headers['last-modified'];
      const matchRes = await rawRequest('/styles.css', {
        headers: { 'Range': 'bytes=0-49', 'If-Range': lastMod }
      });
      assert.strictEqual(matchRes.statusCode, 206);
      assert.strictEqual(matchRes.body.length, 50);

      const pastDate = new Date('2020-01-01T00:00:00Z').toUTCString();
      const staleRes = await rawRequest('/styles.css', {
        headers: { 'Range': 'bytes=0-49', 'If-Range': pastDate }
      });
      assert.strictEqual(staleRes.statusCode, 200);
    });

    // 35. Absolute URL in request line (RFC 7230 §5.3.2)
    await check('GET http://localhost/styles.css absolute URL returns 200 with text/css', async () => {
      const res = await rawRequest('http://localhost/styles.css');
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('text/css'));
    });

    // 36. Byte range with internal whitespace and 1-byte range (0-0)
    await check('GET /styles.css with Range: bytes= 0 - 0 returns 206 with 1 byte', async () => {
      const res = await rawRequest('/styles.css', { headers: { 'Range': 'bytes= 0 - 0 ' } });
      assert.strictEqual(res.statusCode, 206);
      assert.strictEqual(res.body.length, 1);
      assert.strictEqual(res.headers['content-length'], '1');
    });

    // 37. Inverted range and non-numeric range return 416
    await check('GET /styles.css with inverted or invalid range returns 416', async () => {
      const invRes = await rawRequest('/styles.css', { headers: { 'Range': 'bytes=100-50' } });
      assert.strictEqual(invRes.statusCode, 416);
      assert(invRes.headers['content-range'].startsWith('bytes */'));

      const nanRes = await rawRequest('/styles.css', { headers: { 'Range': 'bytes=abc-def' } });
      assert.strictEqual(nanRes.statusCode, 416);
    });

    return { total, passed, failed: failures.length, failures };
  } finally {
    server.close();
  }
}

if (require.main === module) {
  testServerEntrypoint().then(result => {
    if (result.failed > 0) {
      console.error(`✖ ${result.failed}/${result.total} server entrypoint tests failed.`);
      process.exit(1);
    } else {
      console.log(`✔ All ${result.passed}/${result.total} server entrypoint tests passed!`);
      process.exit(0);
    }
  }).catch(err => {
    console.error('Server entrypoint tests failed:', err);
    process.exit(1);
  });
}

module.exports = { run: testServerEntrypoint, testServerEntrypoint };
