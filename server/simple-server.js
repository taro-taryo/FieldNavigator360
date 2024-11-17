const http = require('http');

const PORT = 8443;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Simple HTTP server is running');
});

server.listen(PORT, () => {
    console.log(`Simple server running at http://localhost:${PORT}`);
});
