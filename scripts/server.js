const http = require("http"), fs = require("fs"), path = require("path");
const rootDir = path.resolve(__dirname, "..");
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".md": "text/plain"
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(rootDir, p);
  fs.readFile(f, (e, d) => {
    if (e) {
      res.writeHead(404);
      return res.end("not found: " + p);
    }
    res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" });
    res.end(d);
  });
}).listen(5599, () => console.log("nutrinance local dev server on http://localhost:5599"));
