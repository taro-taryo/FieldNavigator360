import WebSocketManager from './WebSocketManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('camera');

    // WebSocketManager インスタンスを初期化
    const wsManager = new WebSocketManager(`wss://${location.host}`, 'operator', (data) => {
        console.log('Message received by operator:', data);
    });

    // video 要素にクリックイベントを追加
    video.addEventListener('click', (event) => {
        const rect = video.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width; // 正規化 x 座標
        const y = (event.clientY - rect.top) / rect.height; // 正規化 y 座標

        // pointer メッセージを WebSocket 経由で送信
        wsManager.send({
            type: 'pointer',
            role: 'operator',
            x,
            y,
        });

        console.log(`Pointer sent: x=${x}, y=${y}`);
    });

    console.log('Operator initialized');
});
