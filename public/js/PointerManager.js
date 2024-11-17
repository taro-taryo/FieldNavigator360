export default class PointerManager {
    constructor(video, pointerElement) {
        this.video = video;
        this.pointerElement = pointerElement;
    }

    updatePointer(x, y) {
        const rect = this.video.getBoundingClientRect();
        this.pointerElement.style.left = `${x * rect.width}px`;
        this.pointerElement.style.top = `${y * rect.height}px`;
        this.pointerElement.style.display = 'block';

        this.hidePointerWithDelay();
    }

    hidePointerWithDelay() {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
            this.pointerElement.style.display = 'none';
        }, 500);
    }
}
