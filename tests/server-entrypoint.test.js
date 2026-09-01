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

    // 8. Query parameter handling
    await check('GET /styles.css?v=test1234 resolves correctly with query params', async () => {
      const res = await rawRequest('/styles.css?v=test1234');
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('text/css'));
    });

    // 9. HEAD request
    await check('HEAD / serves headers without body', async () => {
      const res = await rawRequest('/', { method: 'HEAD' });
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('text/html'));
      assert.strictEqual(res.body.length, 0);
    });

    // 10. Security: Hidden / Dotfile Protection
    await check('GET /.git/config returns 403 Forbidden', async () => {
      const res = await rawRequest('/.git/config');
      assert.strictEqual(res.statusCode, 403);
    });

    // 11. Security: Path Traversal Protection
    await check('GET /../../windows/win.ini returns 403 Forbidden', async () => {
      const res = await rawRequest('/%2e%2e/%2e%2e/windows/win.ini');
      assert.strictEqual(res.statusCode, 403);
    });

    // 12. 404 Not Found for non-existent routes
    await check('GET /non-existent-route-404.html returns 404', async () => {
      const res = await rawRequest('/non-existent-route-404.html');
      assert.strictEqual(res.statusCode, 404);
    });

    // 13. 405 Method Not Allowed for POST
    await check('POST / returns 405 Method Not Allowed', async () => {
      const res = await rawRequest('/', { method: 'POST' });
      assert.strictEqual(res.statusCode, 405);
    });

    // 14. Security header X-Content-Type-Options
    await check('Responses include X-Content-Type-Options: nosniff and Access-Control-Allow-Origin: *', async () => {
      const res = await rawRequest('/styles.css');
      assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
      assert.strictEqual(res.headers['access-control-allow-origin'], '*');
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
