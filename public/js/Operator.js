import WebSocketManager from './WebSocketManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('camera');
    const ctx = canvas.getContext('2d');

    let decoder;

    // WebCodecs 用のデコーダを初期化
    function initializeDecoder() {
        decoder = new VideoDecoder({
            output: (frame) => {
                // Canvas にフレームを描画
                ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
                frame.close();
            },
            error: (err) => console.error('Decoder error:', err),
        });

        decoder.configure({
            codec: 'avc1.42E01E', // H.264
        });

        console.log('Decoder initialized.');
    }

    // WebSocketManager インスタンスを初期化
    const wsManager = new WebSocketManager(`wss://${location.host}`, 'operator', (data) => {
        if (data instanceof Uint8Array) {
            handleBinaryData(data);
        } else {
            console.log('Message received by operator:', data);
        }
    });

    function handleBinaryData(data) {
        if (!decoder || decoder.state !== 'configured') {
            console.warn('Decoder not ready. Discarding frame.');
            return;
        }

        try {
            const chunkType = isKeyFrame(data) ? 'key' : 'delta';

            decoder.decode(
                new EncodedVideoChunk({
                    type: chunkType,
                    timestamp: performance.now(), // 適切なタイムスタンプを提供
                    data,
                })
            );
        } catch (error) {
            console.error('Error decoding video chunk:', error);
        }
    }

    function isKeyFrame(data) {
        const nalType = data[4] & 0x1f;
        return nalType === 5; // IDR フレームかどうかを確認
    }

    // 初期化
    initializeDecoder();

    console.log('Operator initialized');
});
