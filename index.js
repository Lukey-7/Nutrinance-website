const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.manifest': 'application/manifest+json; charset=utf-8'
};

const STATIC_EXTENSIONS = new Set([
  '.css', '.js', '.mjs', '.png', '.jpg', '.jpeg', '.svg',
  '.webp', '.avif', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf',
  '.eot', '.mp4', '.webm', '.mp3', '.wav', '.pdf', '.wasm'
]);

function safeIsFile(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch (e) {
    return false;
  }
}

function safeIsDirectory(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();
  } catch (e) {
    return false;
  }
}

function safeStat(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.statSync(filePath) : null;
  } catch (e) {
    return null;
  }
}

function handler(req, res) {
  const method = req.method ? req.method.toUpperCase() : 'GET';

  // Handle CORS preflight OPTIONS request
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
      'Allow': 'GET, HEAD, OPTIONS',
      'Content-Length': '0'
    });
    return res.end();
  }

  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Allow': 'GET, HEAD, OPTIONS'
    });
    return res.end('Method Not Allowed');
  }

  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Bad Request');
  }

  // Remove null bytes
  urlPath = urlPath.replace(/\0/g, '') || '/';

  // Disallow hidden files/directories (e.g. .git, .env, .agents)
  const segments = urlPath.split(/[/\\]/);
  if (segments.some(s => s.startsWith('.') && s !== '.' && s !== '..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  const rootDir = path.resolve(__dirname);
  const rootDirWithSep = rootDir.endsWith(path.sep) ? rootDir : rootDir + path.sep;
  let resolvedPath = path.normalize(path.join(rootDir, urlPath));

  // Security guard against directory traversal
  const isInsideRoot = resolvedPath === rootDir || resolvedPath.toLowerCase().startsWith(rootDirWithSep.toLowerCase());
  if (!isInsideRoot) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  // Handle directory index
  if (safeIsDirectory(resolvedPath)) {
    const indexFile = path.join(resolvedPath, 'index.html');
    if (safeIsFile(indexFile)) {
      resolvedPath = indexFile;
    }
  }

  // Check for clean URLs (e.g. /nutrinance-demo or /nutrinance-demo/ -> /nutrinance-demo.html)
  if (!safeIsFile(resolvedPath)) {
    const cleanRelative = urlPath.replace(/\/+$/, '');
    const htmlCandidate = path.normalize(path.join(rootDir, cleanRelative + '.html'));
    if (safeIsFile(htmlCandidate)) {
      resolvedPath = htmlCandidate;
    } else if (safeIsFile(path.join(rootDir, 'public', urlPath))) {
      resolvedPath = path.join(rootDir, 'public', urlPath);
    } else if (safeIsFile(path.join(rootDir, 'public', cleanRelative + '.html'))) {
      resolvedPath = path.join(rootDir, 'public', cleanRelative + '.html');
    } else if (safeIsFile(path.join(rootDir, 'dist', urlPath))) {
      resolvedPath = path.join(rootDir, 'dist', urlPath);
    } else if (safeIsFile(path.join(rootDir, 'dist', cleanRelative + '.html'))) {
      resolvedPath = path.join(rootDir, 'dist', cleanRelative + '.html');
    }
  }

  // If still not found, return 404
  if (!safeIsFile(resolvedPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(`404 Not Found: ${urlPath}`);
  }

  const fileStat = safeStat(resolvedPath);
  if (!fileStat) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Internal Server Error');
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const isHtml = ext === '.html';
  const isStatic = STATIC_EXTENSIONS.has(ext);

  const mtimeUTC = fileStat.mtime.toUTCString();
  const etag = `W/"${fileStat.size.toString(16)}-${Math.floor(fileStat.mtimeMs).toString(16)}"`;

  const headers = {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Accept-Ranges': 'bytes',
    'ETag': etag,
    'Last-Modified': mtimeUTC
  };

  if (isHtml) {
    headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
  } else if (isStatic) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  } else {
    headers['Cache-Control'] = 'public, max-age=3600';
  }

  // Conditional request handling (ETag & Last-Modified)
  const ifNoneMatch = req.headers['if-none-match'];
  const ifModifiedSince = req.headers['if-modified-since'];

  if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === '*')) {
    res.writeHead(304, headers);
    return res.end();
  }

  if (ifModifiedSince && !ifNoneMatch) {
    const ifModifiedDate = new Date(ifModifiedSince);
    if (!isNaN(ifModifiedDate.getTime()) && fileStat.mtime <= ifModifiedDate) {
      res.writeHead(304, headers);
      return res.end();
    }
  }

  // Range request handling (RFC 7233)
  const rangeHeader = req.headers.range;
  if (rangeHeader && method === 'GET' && rangeHeader.startsWith('bytes=')) {
    const rangeSpec = rangeHeader.slice(6).trim();
    const parts = rangeSpec.split('-');
    let start = parts[0] ? parseInt(parts[0], 10) : NaN;
    let end = parts[1] ? parseInt(parts[1], 10) : NaN;

    if (isNaN(start) && !isNaN(end)) {
      // Suffix byte range: bytes=-500 (last 500 bytes)
      start = fileStat.size - end;
      end = fileStat.size - 1;
    } else if (!isNaN(start) && isNaN(end)) {
      // Open byte range: bytes=500- (from 500 to end of file)
      end = fileStat.size - 1;
    }

    if (isNaN(start) || isNaN(end) || start < 0 || start > end || start >= fileStat.size) {
      headers['Content-Range'] = `bytes */${fileStat.size}`;
      res.writeHead(416, headers);
      return res.end('Requested Range Not Satisfiable');
    }

    // Clamp end to file bounds
    if (end >= fileStat.size) {
      end = fileStat.size - 1;
    }

    const chunkSize = end - start + 1;
    headers['Content-Range'] = `bytes ${start}-${end}/${fileStat.size}`;
    headers['Content-Length'] = chunkSize;

    res.writeHead(206, headers);
    const rangeStream = fs.createReadStream(resolvedPath, { start, end });
    const cleanup = () => rangeStream.destroy();
    req.on('close', cleanup);
    res.on('close', cleanup);
    rangeStream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      res.end('Internal Server Error');
    });
    return rangeStream.pipe(res);
  }

  // Full file response (GET / HEAD)
  headers['Content-Length'] = fileStat.size;

  if (method === 'HEAD') {
    res.writeHead(200, headers);
    return res.end();
  }

  res.writeHead(200, headers);
  const stream = fs.createReadStream(resolvedPath);
  const cleanup = () => stream.destroy();
  req.on('close', cleanup);
  res.on('close', cleanup);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end('Internal Server Error');
  });
  stream.pipe(res);
}

module.exports = handler;
module.exports.default = handler;

if (require.main === module) {
  const port = parseInt(process.env.PORT, 10) || 5599;
  const server = http.createServer(handler);
  server.listen(port, () => {
    console.log(`Nutrinance server listening on http://localhost:${port}`);
  });
}

