export class Camera {
    constructor(viewWidth, viewHeight, worldWidth, worldHeight) {
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.x = 0;
        this.y = 0;
    }

    // Frustum culling: is a box (world pixels) on screen, with a margin for big sprites and glows?
    isVisible(x, y, w = 48, h = 48, margin = 64) {
        return x + w >= this.x - margin && x <= this.x + this.viewWidth + margin &&
            y + h >= this.y - margin && y <= this.y + this.viewHeight + margin;
    }

    update(targetX, targetY) {
        this.x = targetX - this.viewWidth / 2;
        this.y = targetY - this.viewHeight / 2;

        this.x = Math.max(0, Math.min(this.worldWidth - this.viewWidth, this.x));
        this.y = Math.max(0, Math.min(this.worldHeight - this.viewHeight, this.y));
    }
}