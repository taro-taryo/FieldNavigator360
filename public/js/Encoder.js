export default class Encoder {
    constructor(canvas, video) {
        this.canvas = canvas;
        this.video = video;
        this.ctx = canvas.getContext('2d');
        this.encoder = this.initializeEncoder();
        this.frameCount = 0;
        this.sps = null;
        this.pps = null;
        this.encodedFrames = [];
    }

    initializeEncoder() {
        if (!('VideoEncoder' in window)) {
            throw new Error('VideoEncoder is not supported in this environment.');
        }

        return new VideoEncoder({
            output: this.handleEncodedChunk.bind(this),
            error: (e) => console.error('[Encoder] Encoding error:', e),
        });
    }

    configure(width, height, bitrate, framerate) {
        this.encoder.configure({
            codec: 'avc1.42E034',
            width,
            height,
            bitrate,
            framerate,
            avc: { format: 'annexb' },
        });
        console.log('[Encoder] Configured:', { width, height, bitrate, framerate });
    }

    processFrameWithPointer(pointerPosition, video) {
        if (!this.encoder) return [];

        try {
            // カメラ映像をキャンバスに描画
            this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

            // ポインタをキャンバスに描画
            if (pointerPosition) {
                const canvasX = pointerPosition.x * this.canvas.width;
                const canvasY = pointerPosition.y * this.canvas.height;

                this.ctx.beginPath();
                this.ctx.arc(canvasX, canvasY, 10, 0, 2 * Math.PI);
                this.ctx.fillStyle = 'red'; // iPhoneで合成したポインタの色は赤
                this.ctx.fill();
            }

            const frame = new VideoFrame(this.canvas, { timestamp: performance.now() });
            const isIDR = this.shouldGenerateIDR();

            this.encoder.encode(frame, { keyFrame: isIDR });
            frame.close();
            this.frameCount++;
        } catch (error) {
            console.error('[Encoder] Error during frame processing:', error);
        }

        return this.retrieveEncodedFrames();
    }

    handleEncodedChunk(chunk) {
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data.buffer);
        this.processNALUnits(data);
    }

    processNALUnits(data) {
        const nalUnits = this.splitNALUnits(data);

        for (const nalUnit of nalUnits) {
            const nalType = nalUnit[0] & 0x1f;

            switch (nalType) {
                case 7: // SPS
                    this.sps = nalUnit;
                    console.log('SPS updated.');
                    break;
                case 8: // PPS
                    this.pps = nalUnit;
                    console.log('PPS updated.');
                    break;
                case 5: // IDR
                    this.storeEncodedFrame(this.concatNALUnits([this.sps, this.pps, nalUnit]));
                    break;
                case 1: // nonIDR
                    if (this.sps && this.pps) {
                        this.storeEncodedFrame(this.concatNALUnits([this.sps, this.pps, nalUnit]));
                    }
                    break;
                default:
                    break;
            }
        }
    }

    splitNALUnits(data) {
        const units = [];
        let offset = 0;

        while (offset < data.length) {
            const startCodeIndex = this.findStartCode(data, offset);
            if (startCodeIndex < 0) break;

            const nextStartCodeIndex = this.findStartCode(data, startCodeIndex + 4);
            units.push(data.subarray(startCodeIndex + 4, nextStartCodeIndex < 0 ? data.length : nextStartCodeIndex));
            offset = nextStartCodeIndex < 0 ? data.length : nextStartCodeIndex;
        }

        return units;
    }

    findStartCode(data, start) {
        for (let i = start; i < data.length - 3; i++) {
            if (data[i] === 0x00 && data[i + 1] === 0x00 && (data[i + 2] === 0x01 || data[i + 3] === 0x01)) {
                return i;
            }
        }
        return -1;
    }

    concatNALUnits(nalUnits) {
        const totalLength = nalUnits.reduce((sum, unit) => sum + unit.length + 4, 0);
        const combined = new Uint8Array(totalLength);

        let offset = 0;
        for (const unit of nalUnits) {
            combined.set([0x00, 0x00, 0x00, 0x01], offset);
            offset += 4;
            combined.set(unit, offset);
            offset += unit.length;
        }

        return combined;
    }

    shouldGenerateIDR() {
        const idrInterval = 30; // Generate IDR every 30 frames
        return this.frameCount % idrInterval === 0;
    }

    storeEncodedFrame(frame) {
        this.encodedFrames.push(frame);
    }

    retrieveEncodedFrames() {
        const frames = this.encodedFrames;
        this.encodedFrames = [];
        return frames;
    }
}
