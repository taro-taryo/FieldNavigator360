export default class WebSocketManager {
    constructor(url, role, onMessage) {
        this.ws = new WebSocket(url);
        this.role = role;
        this.onMessage = onMessage;

        this.setupWebSocketHandlers();
    }

    setupWebSocketHandlers() {
        this.ws.addEventListener('open', () => {
            this.send({ type: 'register', role: this.role });
            console.log(`[WebSocketManager] Connected as ${this.role}`);
        });

        this.ws.addEventListener('message', async (event) => {
            try {
                const data = await this.parseMessage(event);
                this.onMessage(data);
            } catch (error) {
                console.error('[WebSocketManager] Error processing message:', error);
            }
        });

        this.ws.addEventListener('close', () => console.log(`[WebSocketManager] Connection closed for ${this.role}`));
        this.ws.addEventListener('error', (error) => console.error('[WebSocketManager] Connection error:', error));
    }

    async parseMessage(event) {
        if (typeof event.data === 'string') return JSON.parse(event.data);
        if (event.data instanceof Blob) return new Uint8Array(await event.data.arrayBuffer());
        throw new Error('[WebSocketManager] Unsupported message type');
    }

    send(message) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            console.log('[WebSocketManager] Message sent:', message);
        } else {
            console.warn('[WebSocketManager] WebSocket not ready. Message not sent:', message);
        }
    }
}
