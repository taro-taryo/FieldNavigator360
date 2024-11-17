import WebSocketManager from './WebSocketManager.js';

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

    let decoder;
    let videoWidth = 0;
    let videoHeight = 0;

    let framesDecoded = 0; // デコーダーが処理したフレーム数
    let framesReceived = 0; // WebSocketで受信したフレーム数
    let framesDropped = 0; // デコーダーが処理できなかったフレーム数
    let frameQueue = []; // デコード待ちのフレームキュー

    function initializeDecoder() {
        decoder = new VideoDecoder({
            output: processDecodedFrame,
            error: (error) => console.error('[Operator] Decoder error:', error),
        });

        decoder.configure({ codec: 'avc1.42E01E' });
        console.log('[Operator] Decoder initialized');
    }

    function processDecodedFrame(frame) {
        framesDecoded++;
        const totalStart = performance.now();

        try {
            if (frame.displayWidth !== videoWidth || frame.displayHeight !== videoHeight) {
                videoWidth = frame.displayWidth;
                videoHeight = frame.displayHeight;
                updateCanvasSize(videoWidth, videoHeight);
            }

            const drawStart = performance.now();
            ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
            frame.close();
            console.log(`[Operator] Frame drawn in ${(performance.now() - drawStart).toFixed(2)} ms`);
        } catch (error) {
            console.error('[Operator] Error processing decoded frame:', error);
        }

        const totalDuration = performance.now() - totalStart;
        console.log(`[Operator] Total frame processing time: ${totalDuration.toFixed(2)} ms`);
    }

    function updateCanvasSize(width, height) {
        canvas.width = width;
        canvas.height = height;
        console.log(`[Operator] Canvas size updated: ${width}x${height}`);
    }

    function handleBinaryData(data) {
        framesReceived++;

        if (decoder.decodeQueueSize > 5) {
            framesDropped++;
            console.warn('[Operator] Decoder queue is full, dropping frame.');
            return;
        }

        frameQueue.push(data);
        processFrameQueue();
    }

    function processFrameQueue() {
        if (frameQueue.length === 0 || decoder.decodeQueueSize >= 5) {
            return;
        }

        const data = frameQueue.shift();
        const chunkType = isKeyFrame(data) ? 'key' : 'delta';
        console.log(`[Operator] Decoding ${chunkType} frame.`);

        try {
            decoder.decode(
                new EncodedVideoChunk({
                    type: chunkType,
                    timestamp: performance.now(),
                    data,
                })
            );
        } catch (error) {
            console.error('[Operator] Error decoding video chunk:', error);
        }

        // キューに残りがあれば再帰的に処理
        setTimeout(processFrameQueue, 0);
    }

    function isKeyFrame(data) {
        return (data[4] & 0x1f) === 5;
    }

    function drawPointer(x, y) {
        const rect = canvas.getBoundingClientRect();
        pointerElement.style.left = `${x * rect.width}px`;
        pointerElement.style.top = `${y * rect.height}px`;
        pointerElement.style.display = 'block';

        setTimeout(() => {
            pointerElement.style.display = 'none';
        }, 500);
    }

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
        drawPointer(x, y);
    }

    canvas.addEventListener('mousedown', sendPointer);
    canvas.addEventListener('mousemove', sendPointer);
    const wsManager = new WebSocketManager(`wss://${location.host}`, 'operator', (data) => {
        if (data instanceof Uint8Array) {
            handleBinaryData(data);
        } else {
            console.log('[Operator] Text message received:', data);
        }
    });

    // 定期的に統計情報を表示
    setInterval(() => {
        console.log(
            `[Operator Stats] Frames received: ${framesReceived}, Frames decoded: ${framesDecoded}, Frames dropped: ${framesDropped}`
        );
    }, 5000);

    initializeDecoder();
    console.log('[Operator] Operator initialized');
});
