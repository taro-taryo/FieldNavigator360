import Encoder from './Encoder.js';
import WebSocketManager from './WebSocketManager.js';
import PointerManager from './PointerManager.js';

class Worker {
    constructor() {
        this.startButton = document.getElementById('startCamera');
        this.video = document.getElementById('camera');
        this.pointer = document.getElementById('pointer');
        this.canvas = null;
        this.encoder = null;
        this.wsManager = null;
        this.pointerManager = null;

        this.init();
    }

    init() {
        this.wsManager = this.setupWebSocket(); // WebSocketの初期化を先行
        this.startButton.addEventListener('click', () => this.startCamera());
    }

    async startCamera() {
        try {
            const stream = await this.initializeCameraStream();
            this.setupCanvas(stream);
            this.encoder = this.setupEncoder();
            this.pointerManager = new PointerManager(this.video, this.pointer);

            this.startProcessingFrames();
        } catch (error) {
            console.error('Error initializing camera:', error);
            alert(`Camera access denied: ${error.message}`);
        }
    }

    async initializeCameraStream() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false,
        });

        this.video.srcObject = stream;
        this.video.style.display = 'block';
        this.startButton.style.display = 'none';
        return stream;
    }

    setupCanvas(stream) {
        this.canvas = document.createElement('canvas');
        const [track] = stream.getVideoTracks();
        const settings = track.getSettings();

        this.canvas.width = settings.width || 640;
        this.canvas.height = settings.height || 480;
        console.log('Canvas initialized:', this.canvas.width, this.canvas.height);
    }

    setupWebSocket() {
        return new WebSocketManager(`wss://${location.host}`, 'worker', (data) => {
            if (data.type === 'pointer') {
                this.pointerManager.updatePointer(data.x, data.y);
            }
        });
    }

    setupEncoder() {
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
                    console.warn('WebSocket not ready. Frame dropped.');
                }
            });

            requestAnimationFrame(process);
        };
        process();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Worker();
});
