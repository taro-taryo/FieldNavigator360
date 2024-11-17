import WebSocketManager from './WebSocketManager.js';
import DecoderManager from './DecoderManager.js';
import PointerManager from './PointerManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('camera');
    const ctx = canvas.getContext('2d');

    const pointerElement = document.createElement('div');
    pointerElement.id = 'pointer';
    pointerElement.style.position = 'absolute';
    pointerElement.style.width = '20px';
    pointerElement.style.height = '20px';
    pointerElement.style.backgroundColor = 'red';
    pointerElement.style.borderRadius = '50%';
    pointerElement.style.pointerEvents = 'none';
    pointerElement.style.display = 'none';
    canvas.parentElement.appendChild(pointerElement);

    const decoderManager = new DecoderManager(canvas, ctx);
    const pointerManager = new PointerManager(canvas, pointerElement);

    const wsManager = new WebSocketManager(`wss://${location.host}`, 'operator', (data) => {
        if (data instanceof Uint8Array) {
            decoderManager.enqueueFrame(data);
        } else if (data.type === 'pointer') {
            pointerManager.updatePointer(data.x, data.y);
        } else {
            console.log('[Operator] Text message received:', data);
        }
    });

    canvas.addEventListener('mousedown', (event) => sendPointer(event));
    canvas.addEventListener('mousemove', (event) => sendPointer(event));

    function sendPointer(event) {
        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        wsManager.send({
            type: 'pointer',
            role: 'operator',
            x,
            y,
        });

        console.log(`[Operator] Pointer sent: x=${x}, y=${y}`);
        pointerManager.drawPointer(x, y);
    }

    // 定期的に統計情報を表示
    setInterval(() => {
        const stats = decoderManager.getStats();
        console.log(`[Operator Stats] ${JSON.stringify(stats)}`);
    }, 5000);

    console.log('[Operator] Operator initialized');
});
