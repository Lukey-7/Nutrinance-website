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
  '.cur': 'image/x-icon',
  '.bmp': 'image/bmp',
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
  '.ogv': 'video/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.manifest': 'application/manifest+json; charset=utf-8'
};

const STATIC_EXTENSIONS = new Set([
  '.css', '.js', '.mjs', '.png', '.jpg', '.jpeg', '.svg',
  '.webp', '.avif', '.gif', '.ico', '.cur', '.bmp', '.woff', '.woff2', '.ttf', '.otf',
  '.eot', '.mp4', '.webm', '.ogv', '.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.pdf', '.wasm'
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

function matchesETag(headerValue, currentETag) {
  if (!headerValue || typeof headerValue !== 'string') return false;
  const trimmed = headerValue.trim();
  if (trimmed === '*') return true;
  const normalize = (t) => t.trim().replace(/^W\//i, '').replace(/^"|"$/g, '');
  const currentNormalized = normalize(currentETag);
  const tags = trimmed.split(',').map(normalize);
  return tags.includes(currentNormalized);
}

function isPathInside(filePath, parentDir) {
  const normalizedFile = path.resolve(filePath).toLowerCase();
  const normalizedParent = path.resolve(parentDir).toLowerCase();
  const parentWithSep = normalizedParent.endsWith(path.sep) ? normalizedParent : normalizedParent + path.sep;
  return normalizedFile === normalizedParent || normalizedFile.startsWith(parentWithSep);
}

function handler(req, res) {
  const method = req.method ? req.method.toUpperCase() : 'GET';
  const reqHeaders = req.headers || {};

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
    const rawUrl = req.url || '/';
    let pathname = rawUrl;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      pathname = new URL(rawUrl).pathname;
    } else {
      pathname = rawUrl.split('?')[0].split('#')[0];
    }
    urlPath = decodeURIComponent(pathname);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Bad Request');
  }

  // Remove null bytes and normalize slashes
  urlPath = urlPath.replace(/\0/g, '').replace(/\\/g, '/') || '/';

  // Disallow hidden files/directories (e.g. .git, .env, .agents)
  const segments = urlPath.split('/');
  if (segments.some(s => s.startsWith('.') && s !== '.' && s !== '..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  const rootDir = path.resolve(__dirname);
  let resolvedPath = path.normalize(path.join(rootDir, urlPath));

  // Security guard against directory traversal
  if (!isPathInside(resolvedPath, rootDir)) {
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
    const candidates = [
      path.normalize(path.join(rootDir, cleanRelative + '.html')),
      path.join(rootDir, 'public', urlPath),
      path.join(rootDir, 'public', cleanRelative + '.html'),
      path.join(rootDir, 'dist', urlPath),
      path.join(rootDir, 'dist', cleanRelative + '.html'),
      path.join(rootDir, 'out', urlPath),
      path.join(rootDir, 'out', cleanRelative + '.html')
    ];
    for (const cand of candidates) {
      if (isPathInside(cand, rootDir) && safeIsFile(cand)) {
        resolvedPath = cand;
        break;
      }
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

  // RFC 7232 Precondition Checks: If-Match & If-Unmodified-Since
  const ifMatch = reqHeaders['if-match'];
  const ifUnmodifiedSince = reqHeaders['if-unmodified-since'];

  if (ifMatch) {
    if (!matchesETag(ifMatch, etag)) {
      res.writeHead(412, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Precondition Failed');
    }
    // Per RFC 7232 §3.4: If If-Match is present, If-Unmodified-Since MUST be ignored
  } else if (ifUnmodifiedSince) {
    const unmodDate = new Date(ifUnmodifiedSince);
    if (!isNaN(unmodDate.getTime())) {
      const fileSec = Math.floor(fileStat.mtime.getTime() / 1000);
      const unmodSec = Math.floor(unmodDate.getTime() / 1000);
      if (fileSec > unmodSec) {
        res.writeHead(412, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Precondition Failed');
      }
    }
  }

  // RFC 7232 Conditional Request Handling: If-None-Match & If-Modified-Since
  const ifNoneMatch = reqHeaders['if-none-match'];
  const ifModifiedSince = reqHeaders['if-modified-since'];

  if (ifNoneMatch) {
    if (matchesETag(ifNoneMatch, etag)) {
      res.writeHead(304, headers);
      return res.end();
    }
  } else if (ifModifiedSince) {
    const ifModifiedDate = new Date(ifModifiedSince);
    if (!isNaN(ifModifiedDate.getTime())) {
      const fileSec = Math.floor(fileStat.mtime.getTime() / 1000);
      const ifModSec = Math.floor(ifModifiedDate.getTime() / 1000);
      if (fileSec <= ifModSec) {
        res.writeHead(304, headers);
        return res.end();
      }
    }
  }

  // RFC 7233 Range Request Handling
  const rangeHeader = reqHeaders.range;
  let processRange = false;

  if (rangeHeader && method === 'GET' && rangeHeader.startsWith('bytes=')) {
    const ifRange = reqHeaders['if-range'];
    if (!ifRange) {
      processRange = true;
    } else if (matchesETag(ifRange, etag)) {
      processRange = true;
    } else {
      const ifRangeDate = new Date(ifRange);
      if (!isNaN(ifRangeDate.getTime())) {
        const fileSec = Math.floor(fileStat.mtime.getTime() / 1000);
        const ifRangeSec = Math.floor(ifRangeDate.getTime() / 1000);
        if (fileSec === ifRangeSec) {
          processRange = true;
        }
      }
    }
  }

  if (processRange) {
    const rangeSpec = rangeHeader.slice(6).trim();
    // If multipart range (contains comma), fall back to full 200 representation per RFC 7233 §4.3
    if (!rangeSpec.includes(',')) {
      const parts = rangeSpec.split('-');
      if (parts.length === 2) {
        let start = parts[0].trim() !== '' ? parseInt(parts[0].trim(), 10) : NaN;
        let end = parts[1].trim() !== '' ? parseInt(parts[1].trim(), 10) : NaN;

        if (isNaN(start) && !isNaN(end)) {
          // Suffix byte range: bytes=-500 (last 500 bytes, clamped to file bounds per RFC 7233 §2.1)
          start = Math.max(0, fileStat.size - end);
          end = fileStat.size - 1;
        } else if (!isNaN(start) && isNaN(end)) {
          // Open byte range: bytes=500-
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
    }
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
