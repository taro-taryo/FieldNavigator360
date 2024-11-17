export default class WebSocketManager {
    constructor(url, role, onMessage) {
        this.ws = new WebSocket(url);
        this.role = role;

        this.ws.addEventListener('open', () => {
            this.send({ type: 'register', role });
            console.log(`WebSocket connected as ${role}`);
        });

        if (onMessage) {
            this.ws.addEventListener('message', async (event) => {
                if (typeof event.data === 'string') {
                    // テキストメッセージの場合
                    const data = this.parseMessage(event.data);
                    if (data) onMessage(data);
                } else if (event.data instanceof Blob) {
                    // バイナリメッセージの場合
                    const buffer = await event.data.arrayBuffer();
                    onMessage(new Uint8Array(buffer));
                } else {
                    console.error('Unsupported WebSocket message type:', event.data);
                }
            });
        }
    }

    send(message) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not open. Message not sent:', message);
        }
    }

    parseMessage(message) {
        try {
            return JSON.parse(message);
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            return null;
        }
    }
}
