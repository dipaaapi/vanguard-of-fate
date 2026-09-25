export class PortalSystem {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.animTick = 0;

    // 4-Way Warp Portals sa loob ng active player bounds
    this.portals = [
      {
        id: "NORTH",
        dir: "horizontal",
        x: Math.round(this.worldWidth / 2),
        y: 46,
        w: 58,
        h: 22,
        targetX: Math.round(this.worldWidth / 2),
        targetY: this.worldHeight - 95,
        color: "#00f0ff"
      },
      {
        id: "SOUTH",
        dir: "horizontal",
        x: Math.round(this.worldWidth / 2),
        y: this.worldHeight - 46,
        w: 58,
        h: 22,
        targetX: Math.round(this.worldWidth / 2),
        targetY: 95,
        color: "#00f0ff"
      },
      {
        id: "WEST",
        dir: "vertical",
        x: 48,
        y: Math.round(this.worldHeight / 2),
        w: 22,
        h: 58,
        targetX: this.worldWidth - 95,
        targetY: Math.round(this.worldHeight / 2),
        color: "#c77dff"
      },
      {
        id: "EAST",
        dir: "vertical",
        x: this.worldWidth - 48,
        y: Math.round(this.worldHeight / 2),
        w: 22,
        h: 58,
        targetX: 95,
        targetY: Math.round(this.worldHeight / 2),
        color: "#c77dff"
      }
    ];
  }

  update(player, onWarp) {
    this.animTick += 0.08;

    if (!player || player.portalCooldown > 0) return;

    for (let p of this.portals) {
      const halfW = p.w / 2;
      const halfH = p.h / 2;
      if (
        player.x + 18 >= p.x - halfW &&
        player.x + 4 <= p.x + halfW &&
        player.y + 22 >= p.y - halfH &&
        player.y + 2 <= p.y + halfH
      ) {
        player.x = p.targetX;
        player.y = p.targetY;
        player.portalCooldown = 75; // 1.25s cooldown
        if (onWarp) onWarp(p);
        break;
      }
    }
  }

  draw(ctx) {
    this.portals.forEach((p) => {
      ctx.save();
      const t = this.animTick;
      const pPulse = Math.sin(t * 1.8) * 3;

      if (p.dir === "vertical") {
        // Obsidian Frame Pillars
        ctx.fillStyle = "#090d16";
        ctx.fillRect(p.x - 9, p.y - 30, 18, 60);
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x - 9, p.y - 30, 18, 60);

        // Radial Energy Field
        const grad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 26 + pPulse);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.3, p.color);
        grad.addColorStop(0.8, "rgba(10, 15, 30, 0.7)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 14, 26 + pPulse, 0, 0, Math.PI * 2);
        ctx.fill();

        // Counter-rotating Rune Ring
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 5, 18, t * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#090d16";
        ctx.fillRect(p.x - 30, p.y - 9, 60, 18);
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x - 30, p.y - 9, 60, 18);

        const grad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 26 + pPulse);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.3, p.color);
        grad.addColorStop(0.8, "rgba(10, 15, 30, 0.7)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 26 + pPulse, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 18, 5, t * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });
  }
}