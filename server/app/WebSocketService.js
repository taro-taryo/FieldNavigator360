class WebSocketService {
    constructor() {
        this.clients = new Map();
    }

    handleConnection(ws) {
        console.log('[WebSocket] New connection established');

        ws.on('message', (message, isBinary) => this.handleMessage(ws, message, isBinary));
        ws.on('close', () => this.handleDisconnection(ws));
    }

    handleMessage(ws, message, isBinary) {
        try {
            isBinary ? this.forwardBinaryMessage(message) : this.processTextMessage(ws, message);
        } catch (error) {
            console.error('[WebSocket] Error handling message:', error.message);
        }
    }

    forwardBinaryMessage(message) {
        const operator = this.clients.get('operator');
        if (operator) {
            operator.send(message);
            console.log('[WebSocket] Binary message relayed to operator');
        } else {
            console.warn('[WebSocket] Operator not connected');
        }
    }

    processTextMessage(ws, message) {
        const data = JSON.parse(message.toString());
        console.log('[WebSocket] Received message:', data);

        switch (data.type) {
            case 'register':
                this.registerClient(data.role, ws);
                break;
            case 'pointer':
                this.forwardPointerMessage(data);
                break;
            default:
                console.warn('[WebSocket] Unknown message type:', data.type);
        }
    }

    registerClient(role, ws) {
        this.clients.set(role, ws);
        console.log(`[WebSocket] ${role} registered`);
    }

    forwardPointerMessage(data) {
        const worker = this.clients.get('worker');
        if (worker) {
            worker.send(JSON.stringify({ type: 'pointer', x: data.x, y: data.y }));
            console.log('[WebSocket] Pointer message relayed to worker:', data);
        } else {
            console.warn('[WebSocket] Worker not connected');
        }
    }

    handleDisconnection(ws) {
        for (const [role, client] of this.clients.entries()) {
            if (client === ws) {
                this.clients.delete(role);
                console.log(`[WebSocket] ${role} disconnected`);
            }
        }
    }
}

module.exports = WebSocketService;
