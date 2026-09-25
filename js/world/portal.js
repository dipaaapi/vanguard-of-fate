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
        w: 64,
        h: 24,
        targetX: Math.round(this.worldWidth / 2),
        targetY: this.worldHeight - 95,
        color: "#00f0ff"
      },
      {
        id: "SOUTH",
        dir: "horizontal",
        x: Math.round(this.worldWidth / 2),
        y: this.worldHeight - 46,
        w: 64,
        h: 24,
        targetX: Math.round(this.worldWidth / 2),
        targetY: 95,
        color: "#00f0ff"
      },
      {
        id: "WEST",
        dir: "vertical",
        x: 48,
        y: Math.round(this.worldHeight / 2),
        w: 24,
        h: 64,
        targetX: this.worldWidth - 95,
        targetY: Math.round(this.worldHeight / 2),
        color: "#c77dff"
      },
      {
        id: "EAST",
        dir: "vertical",
        x: this.worldWidth - 48,
        y: Math.round(this.worldHeight / 2),
        w: 24,
        h: 64,
        targetX: 95,
        targetY: Math.round(this.worldHeight / 2),
        color: "#c77dff"
      }
    ];

    this.particles = [];
    for (let i = 0; i < 28; i++) {
      this.particles.push({
        portalIdx: i % 4,
        angle: Math.random() * Math.PI * 2,
        dist: 4 + Math.random() * 20,
        speed: 0.04 + Math.random() * 0.04,
        life: Math.random()
      });
    }
  }

  update(player, onWarp) {
    this.animTick += 0.06;

    this.particles.forEach((pt) => {
      pt.angle += pt.speed;
      pt.dist -= 0.15;
      if (pt.dist <= 2) {
        pt.dist = 18 + Math.random() * 8;
        pt.angle = Math.random() * Math.PI * 2;
      }
    });

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
    const t = this.animTick;
    this.portals.forEach((p, pIdx) => {
      ctx.save();
      const pPulse = Math.sin(t * 2 + pIdx) * 3;

      // 1. Drop Ambient Aura on Ground
      const groundGlow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 36);
      groundGlow.addColorStop(0, p.color);
      groundGlow.addColorStop(0.5, "rgba(0,0,0,0.4)");
      groundGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = groundGlow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 36, 0, Math.PI * 2);
      ctx.fill();

      if (p.dir === "vertical") {
        // Obsidian Arch Pedestal
        ctx.fillStyle = "#090d16";
        ctx.fillRect(p.x - 10, p.y - 34, 20, 68);
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 1.8;
        ctx.strokeRect(p.x - 10, p.y - 34, 20, 68);

        // Core Swirling Vortex
        const grad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 28 + pPulse);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.25, p.color);
        grad.addColorStop(0.65, "#0b091a");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 14, 28 + pPulse, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dual Rotating Runic Glyphs
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 6, 20, t * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 8, 24, -t * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Horizontal Arch
        ctx.fillStyle = "#090d16";
        ctx.fillRect(p.x - 34, p.y - 10, 68, 20);
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 1.8;
        ctx.strokeRect(p.x - 34, p.y - 10, 68, 20);

        const grad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 28 + pPulse);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.25, p.color);
        grad.addColorStop(0.65, "#0b091a");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 28 + pPulse, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 20, 6, t * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 24, 8, -t * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Orbiting In-falling Particles
      this.particles.filter(pt => pt.portalIdx === pIdx).forEach(pt => {
        const px = p.x + Math.cos(pt.angle) * pt.dist * (p.dir === "horizontal" ? 1.4 : 0.7);
        const py = p.y + Math.sin(pt.angle) * pt.dist * (p.dir === "horizontal" ? 0.7 : 1.4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(Math.floor(px), Math.floor(py), 1.5, 1.5);
      });

      ctx.restore();
    });
  }
}