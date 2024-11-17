const clients = new Map();

function handleWebSocket(ws) {
    console.log('[WebSocket] New connection established');

    ws.on('message', (message, isBinary) => {
        try {
            if (isBinary) {
                const operator = clients.get('operator');
                if (operator) {
                    operator.send(message);
                    console.log('[WebSocket] Binary message relayed to operator');
                } else {
                    console.log('[WebSocket] Operator is not connected');
                }
            } else {
                const data = JSON.parse(message.toString());
                console.log('[WebSocket] Received message:', data);

                if (data.type === 'register') {
                    clients.set(data.role, ws);
                    console.log(`[WebSocket] ${data.role} registered`);
                }

                if (data.type === 'pointer' && data.role === 'operator') {
                    const worker = clients.get('worker');
                    if (worker) {
                        worker.send(JSON.stringify({
                            type: 'pointer',
                            x: data.x,
                            y: data.y,
                        }));
                        console.log('[WebSocket] Pointer message relayed to worker:', data);
                    } else {
                        console.log('[WebSocket] Worker is not connected');
                    }
                }
            }
        } catch (error) {
            console.error('[WebSocket] Error handling message:', error.message);
        }
    });

    ws.on('close', () => {
        for (const [role, client] of clients.entries()) {
            if (client === ws) {
                clients.delete(role);
                console.log(`[WebSocket] ${role} disconnected`);
            }
        }
    });
}

module.exports = { handleWebSocket };
