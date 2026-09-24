import { Sound } from "./audio.js";

export class SelectScene {
    constructor(roster, onHeroSelected, drawMatrixFn) {
        this.roster = roster;
        this.onHeroSelected = onHeroSelected;
        this.drawMatrixFn = drawMatrixFn;
        this.selectedIndex = 0;
        this.animTick = 0;
    }

    handleInput(e) {
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
            this.selectedIndex = (this.selectedIndex - 1 + this.roster.length) % this.roster.length;
            Sound.playSelectMove();
        }
        if (e.code === "ArrowRight" || e.code === "KeyD") {
            this.selectedIndex = (this.selectedIndex + 1) % this.roster.length;
            Sound.playSelectMove();
        }
        if (e.code === "Enter" || e.code === "Space" || e.code === "KeyJ") {
            Sound.playSelectConfirm();
            this.onHeroSelected(this.roster[this.selectedIndex]);
        }
    }

    draw(ctx, width, height) {
        this.animTick++;
        ctx.fillStyle = "#101318";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#fcd168";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillText("VANGUARD OF FATE", width / 2, 34);

        ctx.fillStyle = "#7d8c9e";
        ctx.font = "9px monospace";
        ctx.fillText("SELECT YOUR HERO", width / 2, 48);

        // Cards
        this.roster.forEach((hero, i) => {
            const cardX = 26 + i * 42;
            const cardY = 66;
            const isSelected = i === this.selectedIndex;

            ctx.fillStyle = isSelected ? "#242e3b" : "#161b22";
            ctx.fillRect(cardX, cardY, 36, 42);

            ctx.strokeStyle = isSelected ? "#fcd168" : "#2d3748";
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.strokeRect(cardX, cardY, 36, 42);

            ctx.fillStyle = isSelected ? "#fcd168" : "#5a6878";
            ctx.font = "bold 13px monospace";
            ctx.fillText(hero.name[0], cardX + 18, cardY + 26);
        });

        // Pedestal Platform
        const pedX = width / 2;
        const pedY = 156;

        ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
        ctx.beginPath();
        ctx.ellipse(pedX, pedY, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.ellipse(pedX, pedY, 20, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fcd168";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Sprite preview
        const activeHero = this.roster[this.selectedIndex];
        const previewFrameIdx = Math.floor(this.animTick / 25) % activeHero.sprites.idle.length;
        this.drawMatrixFn(ctx, width / 2 - 12, 134, activeHero.sprites.idle[previewFrameIdx]);

        ctx.fillStyle = "#fcd168";
        ctx.font = "bold 12px monospace";
        ctx.fillText(activeHero.name.toUpperCase(), width / 2, 178);

        ctx.fillStyle = "#8a9aa8";
        ctx.font = "9px monospace";
        ctx.fillText(activeHero.title, width / 2, 192);

        ctx.fillStyle = "#4a5568";
        ctx.font = "8px monospace";
        ctx.fillText("Press ENTER or SPACE to Embark", width / 2, 218);
    }
}