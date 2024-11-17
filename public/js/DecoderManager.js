export default class DecoderManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.decoder = null;
        this.videoWidth = 0;
        this.videoHeight = 0;
        this.frameQueue = [];
        this.framesDecoded = 0;
        this.framesReceived = 0;
        this.framesDropped = 0;

        this.initializeDecoder();
    }

    initializeDecoder() {
        this.decoder = new VideoDecoder({
            output: (frame) => this.processDecodedFrame(frame),
            error: (error) => console.error('[DecoderManager] Decoder error:', error),
        });

        this.decoder.configure({ codec: 'avc1.42E01E' });
        console.log('[DecoderManager] Decoder initialized');
    }

    enqueueFrame(data) {
        this.framesReceived++;

        if (this.decoder.decodeQueueSize > 5) {
            this.framesDropped++;
            console.warn('[DecoderManager] Decoder queue is full, dropping frame.');
            return;
        }

        this.frameQueue.push(data);
        this.processFrameQueue();
    }

    processFrameQueue() {
        if (this.frameQueue.length === 0 || this.decoder.decodeQueueSize >= 5) {
            return;
        }

        const data = this.frameQueue.shift();
        const chunkType = this.isKeyFrame(data) ? 'key' : 'delta';

        try {
            this.decoder.decode(
                new EncodedVideoChunk({
                    type: chunkType,
                    timestamp: performance.now(),
                    data,
                })
            );
        } catch (error) {
            console.error('[DecoderManager] Error decoding video chunk:', error);
        }

        setTimeout(() => this.processFrameQueue(), 0);
    }

    processDecodedFrame(frame) {
        this.framesDecoded++;

        if (frame.displayWidth !== this.videoWidth || frame.displayHeight !== this.videoHeight) {
            this.videoWidth = frame.displayWidth;
            this.videoHeight = frame.displayHeight;
            this.updateCanvasSize(this.videoWidth, this.videoHeight);
        }

        const drawStart = performance.now();
        this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
        frame.close();
        console.log(`[DecoderManager] Frame drawn in ${(performance.now() - drawStart).toFixed(2)} ms`);
    }

    updateCanvasSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        console.log(`[DecoderManager] Canvas size updated: ${width}x${height}`);
    }

    isKeyFrame(data) {
        return (data[4] & 0x1f) === 5;
    }

    getStats() {
        return {
            framesReceived: this.framesReceived,
            framesDecoded: this.framesDecoded,
            framesDropped: this.framesDropped,
        };
    }
}
