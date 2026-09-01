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
  '.xml': 'application/xml; charset=utf-8'
};

const STATIC_EXTENSIONS = new Set([
  '.css', '.js', '.mjs', '.png', '.jpg', '.jpeg', '.svg',
  '.webp', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf',
  '.eot', '.mp4', '.webm', '.mp3', '.wav', '.pdf'
]);

function handler(req, res) {
  const method = req.method ? req.method.toUpperCase() : 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
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
  urlPath = urlPath.replace(/\0/g, '');

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
  if (fs.existsSync(resolvedPath)) {
    try {
      const stat = fs.statSync(resolvedPath);
      if (stat.isDirectory()) {
        const indexFile = path.join(resolvedPath, 'index.html');
        if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) {
          resolvedPath = indexFile;
        }
      }
    } catch (e) {
      // Ignore stat errors
    }
  }

  // Check for clean URLs (e.g. /nutrinance-demo -> /nutrinance-demo.html)
  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
    if (fs.existsSync(resolvedPath + '.html') && fs.statSync(resolvedPath + '.html').isFile()) {
      resolvedPath = resolvedPath + '.html';
    } else if (fs.existsSync(path.join(rootDir, 'public', urlPath)) && fs.statSync(path.join(rootDir, 'public', urlPath)).isFile()) {
      resolvedPath = path.join(rootDir, 'public', urlPath);
    } else if (fs.existsSync(path.join(rootDir, 'dist', urlPath)) && fs.statSync(path.join(rootDir, 'dist', urlPath)).isFile()) {
      resolvedPath = path.join(rootDir, 'dist', urlPath);
    }
  }

  // If still not found, return 404
  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(`404 Not Found: ${urlPath}`);
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const isHtml = ext === '.html';
  const isStatic = STATIC_EXTENSIONS.has(ext);

  const headers = {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*'
  };

  if (isHtml) {
    headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
  } else if (isStatic) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  } else {
    headers['Cache-Control'] = 'public, max-age=3600';
  }

  try {
    const fileStat = fs.statSync(resolvedPath);
    headers['Content-Length'] = fileStat.size;

    if (method === 'HEAD') {
      res.writeHead(200, headers);
      return res.end();
    }

    res.writeHead(200, headers);
    const stream = fs.createReadStream(resolvedPath);
    stream.on('error', (err) => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      res.end('Internal Server Error');
    });
    stream.pipe(res);
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end('Internal Server Error');
  }
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
