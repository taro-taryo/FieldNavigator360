const clients = new Map();

function handleWebSocket(ws) {
    console.log('WebSocket connection established');

    ws.on('message', (message, isBinary) => {
        try {
            if (isBinary) {
                const operator = clients.get('operator');
                if (operator) {
                    operator.send(message);
                    console.log('Binary message relayed to operator');
                }
            } else {
                const data = JSON.parse(message.toString());

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
                        console.log('Pointer message relayed to worker:', data);
                    }
                }
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error.message);
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
