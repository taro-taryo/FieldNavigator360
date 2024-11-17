export default class Encoder {
    constructor(canvas, video, ws) {
        this.canvas = canvas;
        this.video = video;
        this.ws = ws;
        this.ctx = canvas.getContext('2d');

        this.encoder = this.initializeEncoder();
    }

    initializeEncoder() {
        if (!('VideoEncoder' in window)) {
            console.error('VideoEncoder is not supported in this browser.');
            throw new Error('VideoEncoder is not supported in this environment.');
        }

        return new VideoEncoder({
            output: this.handleEncodedChunk.bind(this),
            error: (e) => console.error('Encoding error:', e),
        });
    }

    configure(width, height, bitrate, framerate) {
        this.encoder.configure({
            codec: 'avc1.42E01E',
            width,
            height,
            bitrate,
            framerate,
        });
        console.log('VideoEncoder configured:', { width, height, bitrate, framerate });
    }

    processFrame() {
        try {
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            const frame = new VideoFrame(this.canvas, { timestamp: performance.now() });
            this.encoder.encode(frame);
            frame.close();
        } catch (error) {
            console.error('Error during frame processing:', error);
        }
    }

    handleEncodedChunk(chunk) {
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data.buffer);

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        }

        console.log('H.264 data chunk sent:', data);
    }
}
