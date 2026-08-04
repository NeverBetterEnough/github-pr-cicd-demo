import { createServer } from 'node:http';

const PORT = process.env.PORT || 3000;

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/hello') {
    const body = JSON.stringify({
      message: 'Hello, World!',
      timestamp: new Date().toISOString(),
    });

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Only start listening if not imported (e.g., for testing)
const isImported = process.argv[1] !== import.meta.filename;
if (!isImported) {
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
}

export default server;
