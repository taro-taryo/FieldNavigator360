const fs = require('fs');
const https = require('https');
const path = require('path');
const WebSocket = require('ws');
const WebSocketService = require('./WebSocketService');

const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, '../ssl/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../ssl/cert.pem')),
};

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
};

const webSocketService = new WebSocketService();

const server = https.createServer(sslOptions, (req, res) => {
    const filePath = path.join(__dirname, '../../public', req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

const wss = new WebSocket.Server({ server });
wss.on('connection', (ws) => webSocketService.handleConnection(ws));

const PORT = 8443;
server.listen(PORT, () => console.log(`Server running at https://localhost:${PORT}`));
