export function initializeWebSocket(role, onMessage) {
    const ws = new WebSocket(`wss://${location.host}`);

    ws.addEventListener('open', () => {
        console.log(`WebSocket connected as ${role}`);
        ws.send(JSON.stringify({ type: 'register', role }));
    });

    if (onMessage) {
        ws.addEventListener('message', onMessage);
    }

    return ws;
}
