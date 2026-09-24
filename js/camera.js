export class Camera {
    constructor(viewWidth, viewHeight, worldWidth, worldHeight) {
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.x = 0;
        this.y = 0;
    }

    update(targetX, targetY) {
        this.x = targetX - this.viewWidth / 2;
        this.y = targetY - this.viewHeight / 2;

        this.x = Math.max(0, Math.min(this.worldWidth - this.viewWidth, this.x));
        this.y = Math.max(0, Math.min(this.worldHeight - this.viewHeight, this.y));
    }
}