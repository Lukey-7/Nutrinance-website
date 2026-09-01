const http = require('http');
const handler = require('../index');

const port = parseInt(process.env.PORT, 10) || 5599;
http.createServer(handler).listen(port, () => {
  console.log(`nutrinance local dev server on http://localhost:${port}`);
});
