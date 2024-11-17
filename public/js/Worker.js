import Encoder from './Encoder.js';
import WebSocketManager from './WebSocketManager.js';
import PointerManager from './PointerManager.js';

class Worker {
    constructor() {
        this.startButton = document.getElementById('startCamera');
        this.video = document.getElementById('camera');
        this.pointer = document.getElementById('pointer');
        this.canvas = document.createElement('canvas');
        this.encoder = null;
        this.wsManager = null;
        this.pointerManager = null;

        this.orientation = this.getOrientation();
        this.init();
    }

    init() {
        this.wsManager = new WebSocketManager(`wss://${location.host}`, 'worker', (data) => {
            if (data.type === 'pointer') {
                this.pointerManager.updatePointer(data.x, data.y);
            }
        });

        this.startButton.addEventListener('click', () => this.startCamera());
        window.addEventListener('resize', () => this.handleResize());
    }

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false,
            });

            this.video.srcObject = stream;
            this.video.style.display = 'block';
            this.startButton.style.display = 'none';

            this.setupCanvasAndEncoder(stream);
            this.pointerManager = new PointerManager(this.video, this.pointer);

            this.startProcessingFrames();
        } catch (error) {
            console.error('[Worker] Camera initialization error:', error);
        }
    }

    setupCanvasAndEncoder(stream) {
        const { width, height } = this.getStreamResolution(stream);
        this.updateCanvasSize(width, height);
        this.encoder = this.setupEncoder();
    }

    getStreamResolution(stream) {
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        return { width: settings.width, height: settings.height };
    }

    updateCanvasSize(width, height) {
        const isLandscape = this.orientation === 'landscape';
        this.canvas.width = isLandscape ? Math.max(width, height) : Math.min(width, height);
        this.canvas.height = isLandscape ? Math.min(width, height) : Math.max(width, height);

        console.log(`[Worker] Canvas size updated: ${this.canvas.width}x${this.canvas.height}`);
    }

    setupEncoder() {
        if (this.encoder) {
            console.log('[Worker] Resetting encoder...');
            this.encoder = null;
        }

        const encoder = new Encoder(this.canvas, this.video);
        encoder.configure(this.canvas.width, this.canvas.height, 5000000, 30);
        return encoder;
    }

    startProcessingFrames() {
        const process = () => {
            const frames = this.encoder.processFrame();
            frames.forEach((frame) => {
                if (this.wsManager.ws.readyState === WebSocket.OPEN) {
                    this.wsManager.ws.send(frame);
                } else {
                    console.warn('[Worker] WebSocket not ready. Frame dropped.');
                }
            });

            requestAnimationFrame(process);
        };
        process();
    }

    handleResize() {
        const newOrientation = this.getOrientation();
        if (newOrientation !== this.orientation) {
            this.orientation = newOrientation;
            this.setupCanvasAndEncoder(this.video.srcObject);
        }
    }

    getOrientation() {
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Worker();
});
