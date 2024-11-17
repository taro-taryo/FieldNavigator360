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
            codec: 'avc1.42E01E',
            width,
            height,
            bitrate,
            framerate,
            avc: { format: 'annexb' },
        });
        console.log('[Encoder] Configured:', { width, height, bitrate, framerate });
    }

    processFrame() {
        if (!this.encoder) return [];

        try {
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
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
        const units = this.splitNALUnits(data);
        units.forEach((unit) => {
            const nalType = unit[0] & 0x1f;

            if (nalType === 7) {
                this.sps = unit;
            } else if (nalType === 8) {
                this.pps = unit;
            } else if (nalType === 5) {
                this.storeEncodedFrame(this.concatNALUnits([this.sps, this.pps, unit]));
            } else if (nalType === 1) {
                this.storeEncodedFrame(unit);
            }
        });
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
