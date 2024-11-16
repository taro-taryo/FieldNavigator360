const clients = new Map();

function handleWebSocket(ws) {
    console.log('WebSocket connection established');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'register') {
            clients.set(data.role, ws);
            console.log(`${data.role} registered`);
        }

        if (data.type === 'pointer' && data.role === 'operator') {
            const worker = clients.get('worker');
            if (worker) {
                worker.send(JSON.stringify({
                    type: 'pointer',
                    x: data.x,
                    y: data.y,
                }));
            }
        }
    });

    ws.on('close', () => {
        for (const [role, client] of clients.entries()) {
            if (client === ws) {
                clients.delete(role);
                console.log(`${role} disconnected`);
            }
        }
    });
}

module.exports = { handleWebSocket };
