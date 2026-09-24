export class Stage {
    constructor(width = 768, height = 720) {
        this.width = width;
        this.height = height;
        this.bounds = { minX: 8, maxX: this.width - 32, minY: 8, maxY: this.height - 32 };
    }

    draw(ctx) {
        ctx.fillStyle = "#2d6330";
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = "#5c432d";
        ctx.fillRect(80, 0, 96, this.height);
        ctx.fillRect(80, 320, 500, 80);
        ctx.fillRect(500, 320, 80, 400);

        ctx.fillStyle = "#735438";
        ctx.fillRect(86, 0, 84, this.height);
        ctx.fillRect(86, 326, 488, 68);
        ctx.fillRect(506, 326, 68, 394);

        ctx.fillStyle = "#1e4420";
        for (let tx = 30; tx < this.width; tx += 90) {
            for (let ty = 40; ty < this.height; ty += 110) {
                if (Math.abs(tx - 120) > 60 && Math.abs(ty - 360) > 60) {
                    ctx.fillStyle = "#4a2e18";
                    ctx.fillRect(tx + 4, ty + 12, 4, 6);
                    ctx.fillStyle = "#1e4420";
                    ctx.fillRect(tx, ty + 6, 12, 6);
                    ctx.fillRect(tx + 2, ty + 2, 8, 4);
                    ctx.fillRect(tx + 4, ty - 2, 4, 4);
                }
            }
        }
    }
}