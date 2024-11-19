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

        this.pointerPosition = { x: 0, y: 0 }; // ポインタ位置を追跡

        this.orientation = this.getOrientation();
        this.init();
    }

    init() {
        this.wsManager = new WebSocketManager(`wss://${location.host}`, 'worker', (data) => {
            if (data.type === 'pointer') {
                this.pointerManager.updatePointer(data.x, data.y);
                this.pointerPosition = { x: data.x, y: data.y }; // ポインタ位置を更新
            }
        });

        this.startButton.addEventListener('click', () => this.startCamera());
        window.addEventListener('resize', () => this.handleResize());
    }

    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    frameRate: 10,
                },
                audio: false,
            });

            this.video.srcObject = stream;
            this.video.style.display = 'block'; // カメラ映像を表示
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
        if (!this.video || !this.encoder) {
            console.error('[Worker] Video or Encoder is not initialized.');
            return;
        }

        const processFrame = (now, metadata) => {
            const frames = this.encoder.processFrameWithPointer(this.pointerPosition, this.video);
            frames.forEach((frame) => {
                if (this.wsManager.ws.readyState === WebSocket.OPEN) {
                    this.wsManager.ws.send(frame);
                } else {
                    console.warn('[Worker] WebSocket not ready. Frame dropped.');
                }
            });

            // 次のフレーム更新のコールバックを登録
            this.video.requestVideoFrameCallback(processFrame);
        };

        // 初回のコールバック登録
        this.video.requestVideoFrameCallback(processFrame);
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
