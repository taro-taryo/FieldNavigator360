export default class PointerManager {
    constructor(canvas, pointerElement) {
        this.canvas = canvas;
        this.pointerElement = pointerElement;
        this.hideTimeout = null;
    }

    updatePointer(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        this.pointerElement.style.left = `${x * rect.width}px`;
        this.pointerElement.style.top = `${y * rect.height}px`;
        this.pointerElement.style.display = 'block';

        this.hidePointerWithDelay();
    }

    drawPointer(x, y) {
        this.updatePointer(x, y);
    }

    hidePointerWithDelay() {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
            this.pointerElement.style.display = 'none';
        }, 500);
    }
}
