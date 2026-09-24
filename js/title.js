import { Sound } from "./audio.js";

export class TitleScene {
    constructor(onStartGame) {
        this.onStartGame = onStartGame;
        this.menuIndex = 0;
        this.animTick = 0;
        this.menuItems = [
            { id: "START", label: "GAME START", enabled: true },
            { id: "CONTINUE", label: "CONTINUE GAME", enabled: false },
            { id: "SETTINGS", label: "AUDIO: ON", enabled: true }
        ];
    }

    handleInput(e) {
        if (e.code === "ArrowUp" || e.code === "KeyW") {
            this.menuIndex = (this.menuIndex - 1 + this.menuItems.length) % this.menuItems.length;
            Sound.playSelectMove();
        }
        if (e.code === "ArrowDown" || e.code === "KeyS") {
            this.menuIndex = (this.menuIndex + 1) % this.menuItems.length;
            Sound.playSelectMove();
        }
        if (e.code === "Enter" || e.code === "Space" || e.code === "KeyJ") {
            const selected = this.menuItems[this.menuIndex];
            if (!selected.enabled) {
                Sound.playSelectMove();
                return;
            }

            if (selected.id === "START") {
                Sound.playSelectConfirm();
                this.onStartGame();
            } else if (selected.id === "SETTINGS") {
                Sound.isMuted = !Sound.isMuted;
                selected.label = Sound.isMuted ? "AUDIO: MUTED" : "AUDIO: ON";
                if (Sound.isMuted) Sound.stopBGM();
                else Sound.playSelectMove();
            }
        }
    }

    draw(ctx, width, height) {
        this.animTick++;
        ctx.fillStyle = "#0c0e14";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#141923";
        for (let y = 0; y < height; y += 12) {
            ctx.fillRect(0, y, width, 1);
        }

        const glowY = 46 + Math.sin(this.animTick / 20) * 2;
        ctx.fillStyle = "rgba(252, 209, 104, 0.15)";
        ctx.beginPath();
        ctx.ellipse(width / 2, glowY + 2, 85, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#8a9aa8";
        ctx.fillRect(width / 2 - 1, glowY - 18, 2, 12);
        ctx.fillRect(width / 2 - 4, glowY - 14, 8, 2);
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(width / 2 - 1, glowY - 6, 2, 2);

        ctx.fillStyle = "#fcd168";
        ctx.font = "bold 15px monospace";
        ctx.textAlign = "center";
        ctx.fillText("VANGUARD OF FATE", width / 2, glowY);

        ctx.fillStyle = "#7d8c9e";
        ctx.font = "8px monospace";
        ctx.fillText("- 32-BIT ACTION ADVENTURE -", width / 2, glowY + 12);

        const boxX = 54;
        const boxY = 100;
        const boxW = 148;
        const boxH = 82;

        ctx.fillStyle = "rgba(16, 22, 32, 0.85)";
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = "#2d3748";
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.strokeStyle = "#fcd168";
        ctx.strokeRect(boxX + 2, boxY + 2, boxW - 4, boxH - 4);

        this.menuItems.forEach((item, index) => {
            const isSelected = index === this.menuIndex;
            const itemY = boxY + 24 + index * 20;

            if (isSelected) {
                const blink = Math.floor(this.animTick / 16) % 2 === 0;
                if (blink) {
                    ctx.fillStyle = "#fcd168";
                    ctx.font = "bold 9px monospace";
                    ctx.textAlign = "right";
                    ctx.fillText("▶", width / 2 - 42, itemY);
                }
            }

            ctx.font = isSelected ? "bold 9px monospace" : "9px monospace";
            ctx.textAlign = "center";
            ctx.fillStyle = !item.enabled ? "#4a5568" : (isSelected ? "#ffffff" : "#8a9aa8");
            ctx.fillText(item.label, width / 2, itemY);
        });

        ctx.fillStyle = "#4a5568";
        ctx.font = "7px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Press ENTER or SPACE to Select", width / 2, 214);
    }
}