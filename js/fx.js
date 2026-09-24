export class FXManager {
    constructor() {
        this.screenShake = 0;
        this.damagePopups = [];
        this.hitParticles = [];
    }

    addScreenShake(amount) {
        this.screenShake = Math.max(this.screenShake, amount);
    }

    spawnDamagePopup(x, y, text, isCrit = false) {
        this.damagePopups.push({
            x: x + (Math.random() * 8 - 4),
            y: y - 4,
            text: text,
            color: isCrit ? "#ffea00" : "#ffffff",
            alpha: 1.0,
            vy: isCrit ? -1.4 : -0.9,
            isCrit: isCrit
        });
    }

    spawnHitSparks(x, y, color = "#ffdd00", count = 6) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.2 + Math.random() * 2.2;
            this.hitParticles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                life: 14 + Math.floor(Math.random() * 8),
                size: Math.random() > 0.5 ? 2 : 1
            });
        }
    }

    getShakeOffsets() {
        let offsetX = 0, offsetY = 0;
        if (this.screenShake > 0) {
            offsetX = (Math.random() - 0.5) * this.screenShake;
            offsetY = (Math.random() - 0.5) * this.screenShake;
            this.screenShake *= 0.82;
            if (this.screenShake < 0.3) this.screenShake = 0;
        }
        return { offsetX: Math.round(offsetX), offsetY: Math.round(offsetY) };
    }

    updateAndDraw(ctx) {
        // 1. Draw Sparks
        for (let s = this.hitParticles.length - 1; s >= 0; s--) {
            const pt = this.hitParticles[s];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.life--;
            ctx.fillStyle = pt.color;
            ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
            if (pt.life <= 0) this.hitParticles.splice(s, 1);
        }

        // 2. Draw Floating Numbers
        for (let d = this.damagePopups.length - 1; d >= 0; d--) {
            const pop = this.damagePopups[d];
            pop.y += pop.vy;
            pop.alpha -= 0.025;

            ctx.save();
            ctx.globalAlpha = Math.max(0, pop.alpha);
            ctx.font = pop.isCrit ? "bold 9px monospace" : "bold 7px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = "#000000";
            ctx.fillText(pop.text, pop.x + 1, pop.y + 1);
            ctx.fillText(pop.text, pop.x - 1, pop.y - 1);
            ctx.fillStyle = pop.color;
            ctx.fillText(pop.text, pop.x, pop.y);
            ctx.restore();

            if (pop.alpha <= 0) this.damagePopups.splice(d, 1);
        }
    }

    drawVignette(ctx, width, height) {
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 80,
            width / 2, height / 2, 150
        );
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, "rgba(5, 7, 10, 0.45)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    reset() {
        this.screenShake = 0;
        this.damagePopups = [];
        this.hitParticles = [];
    }
}