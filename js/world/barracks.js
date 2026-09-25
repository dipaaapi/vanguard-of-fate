export class BarracksSystem {
  constructor(worldWidth, worldHeight) {
    this.bounds = {
      x: Math.round(worldWidth / 2 - 150),
      y: Math.round(worldHeight / 2 - 110),
      w: 300,
      h: 220
    };
    this.braziers = [
      [this.bounds.x + 14, this.bounds.y + 14],
      [this.bounds.x + this.bounds.w - 14, this.bounds.y + 14],
      [this.bounds.x + 14, this.bounds.y + this.bounds.h - 14],
      [this.bounds.x + this.bounds.w - 14, this.bounds.y + this.bounds.h - 14]
    ];
    this.animTick = 0;
  }

  update() {
    this.animTick += 0.08;
  }

  draw(ctx) {
    const s = this.bounds;

    // Contact Outpost Shadow
    ctx.fillStyle = "rgba(4, 7, 15, 0.55)";
    ctx.fillRect(s.x + 6, s.y + 6, s.w, s.h);

    // Dark Flagstone Foundation
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(s.x, s.y, s.w, s.h);

    // Chiseled Cobblestone Grid
    ctx.fillStyle = "#334155";
    const tileSize = 20;
    for (let bx = s.x + 4; bx < s.x + s.w - 4; bx += tileSize) {
      for (let by = s.y + 4; by < s.y + s.h - 4; by += tileSize) {
        ctx.fillRect(bx, by, tileSize - 2, tileSize - 2);
      }
    }

    // Gilded Sanctuary Outer Trim
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 2;
    ctx.strokeRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4);

    // Center Arcane Sigil
    const midX = s.x + s.w / 2;
    const midY = s.y + s.h / 2;
    ctx.strokeStyle = "rgba(0, 240, 255, 0.45)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(midX, midY, 34, 0, Math.PI * 2);
    ctx.stroke();

    // Braziers with Dancing Pixel Flames
    this.braziers.forEach(([bx, by]) => {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(bx - 5, by - 5, 10, 10);
      ctx.fillStyle = "#334155";
      ctx.strokeRect(bx - 5, by - 5, 10, 10);

      const fShift = Math.sin(this.animTick * 2 + bx) * 2;
      ctx.fillStyle = "#ff5400";
      ctx.fillRect(bx - 3, by - 8 + fShift, 6, 6);
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(bx - 1.5, by - 6 + fShift, 3, 3);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(bx - 0.5, by - 5 + fShift, 1, 1);
    });
  }
}