export class BarracksSystem {
  constructor(worldWidth, worldHeight) {
    this.bounds = {
      x: Math.round(worldWidth / 2 - 160),
      y: Math.round(worldHeight / 2 - 120),
      w: 320,
      h: 240
    };
    this.braziers = [
      [this.bounds.x + 18, this.bounds.y + 18],
      [this.bounds.x + this.bounds.w - 18, this.bounds.y + 18],
      [this.bounds.x + 18, this.bounds.y + this.bounds.h - 18],
      [this.bounds.x + this.bounds.w - 18, this.bounds.y + this.bounds.h - 18]
    ];
    this.animTick = 0;
    this.sparks = [];
    for (let i = 0; i < 20; i++) {
      this.sparks.push({
        x: this.bounds.x + Math.random() * this.bounds.w,
        y: this.bounds.y + Math.random() * this.bounds.h,
        vy: -0.2 - Math.random() * 0.4,
        alpha: Math.random(),
        size: Math.random() < 0.3 ? 2 : 1
      });
    }
  }

  update() {
    this.animTick += 0.05;
    this.sparks.forEach((sp) => {
      sp.y += sp.vy;
      sp.alpha -= 0.008;
      if (sp.alpha <= 0 || sp.y < this.bounds.y) {
        sp.x = this.bounds.x + Math.random() * this.bounds.w;
        sp.y = this.bounds.y + this.bounds.h - 10;
        sp.alpha = 0.8 + Math.random() * 0.2;
      }
    });
  }

  draw(ctx) {
    const s = this.bounds;
    const midX = s.x + s.w / 2;
    const midY = s.y + s.h / 2;

    // 1. Deep Volumetric Foundation Drop Shadow
    ctx.fillStyle = "rgba(2, 6, 16, 0.65)";
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(s.x + 8, s.y + 8, s.w, s.h, 12) : ctx.fillRect(s.x + 8, s.y + 8, s.w, s.h);
    ctx.fill();

    // 2. Chiseled Royal Slate Base Tier
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(s.x - 2, s.y - 2, s.w + 4, s.h + 4, 8) : ctx.fillRect(s.x - 2, s.y - 2, s.w + 4, s.h + 4);
    ctx.fill();

    // 3. Multi-Toned Ornate Flagstone Tiles with Specular Creases
    const tileSize = 24;
    for (let bx = s.x; bx < s.x + s.w; bx += tileSize) {
      for (let by = s.y; by < s.y + s.h; by += tileSize) {
        const isAlt = ((bx / tileSize) + (by / tileSize)) % 2 === 0;
        // Tile body
        ctx.fillStyle = isAlt ? "#1e293b" : "#283548";
        ctx.fillRect(bx + 1, by + 1, tileSize - 2, tileSize - 2);

        // Subtle bevel highlights
        ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
        ctx.fillRect(bx + 1, by + 1, tileSize - 2, 1);
        ctx.fillRect(bx + 1, by + 1, 1, tileSize - 2);

        // Tile shadow crease
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(bx + tileSize - 1, by + 1, 1, tileSize - 2);
        ctx.fillRect(bx + 1, by + tileSize - 1, tileSize - 2, 1);
      }
    }

    // 4. Intricate Gilded Filigree Sanctuary Borders
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(s.x + 6, s.y + 6, s.w - 12, s.h - 12);

    ctx.strokeStyle = "rgba(255, 209, 102, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x + 10, s.y + 10, s.w - 20, s.h - 20);

    // Corner Ornate Fleurons
    const corners = [
      [s.x + 6, s.y + 6],
      [s.x + s.w - 6, s.y + 6],
      [s.x + 6, s.y + s.h - 6],
      [s.x + s.w - 6, s.y + s.h - 6]
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(cx - 3, cy - 3, 6, 6);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
    });

    // 5. Central Grand Sacred Radial Seal
    ctx.save();
    ctx.translate(midX, midY);

    // Outer Glow Ring
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating Runic Star
    ctx.rotate(this.animTick * 0.4);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.2;
    for (let r = 0; r < 4; r++) {
      ctx.strokeRect(-24, -24, 48, 48);
      ctx.rotate(Math.PI / 4);
    }

    // Inner Radiant Core
    ctx.fillStyle = "rgba(0, 240, 255, 0.25)";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 6. Armory Weapon Racks & Banners
    // Left Weapon Rack
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(s.x + 22, s.y + 40, 6, 42);
    ctx.fillStyle = "#b5c4d4";
    ctx.fillRect(s.x + 24, s.y + 44, 2, 34); // Steel Blades
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(s.x + 22, s.y + 48, 6, 2); // Gold Crossguard

    // Right Commander Crest Banner
    ctx.fillStyle = "#991b1b";
    ctx.fillRect(s.x + s.w - 28, s.y + 40, 12, 36);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(s.x + s.w - 26, s.y + 46, 8, 8); // Lion/Shield Motif
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(s.x + s.w - 24, s.y + 48, 4, 4);

    // 7. Dynamic Cast-Light Braziers with Multi-tone Flame Flares
    this.braziers.forEach(([bx, by]) => {
      // Warm Radial Light Aura on the ground
      const lightGrad = ctx.createRadialGradient(bx, by, 2, bx, by, 32);
      lightGrad.addColorStop(0, "rgba(255, 140, 0, 0.35)");
      lightGrad.addColorStop(0.6, "rgba(255, 80, 0, 0.12)");
      lightGrad.addColorStop(1, "rgba(255, 50, 0, 0)");
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.arc(bx, by, 32, 0, Math.PI * 2);
      ctx.fill();

      // Stone Pedestal Stand
      ctx.fillStyle = "#090d16";
      ctx.fillRect(bx - 6, by - 4, 12, 10);
      ctx.fillStyle = "#475569";
      ctx.fillRect(bx - 5, by - 3, 10, 8);
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(bx - 6, by - 5, 12, 2); // Brass rim

      // Multi-layer Animated Pixel Flames
      const f1 = Math.sin(this.animTick * 4 + bx) * 1.5;
      const f2 = Math.cos(this.animTick * 5 + by) * 1.5;

      // Dark Orange Outer Core
      ctx.fillStyle = "#d9381e";
      ctx.fillRect(bx - 4, by - 12 + f1, 8, 8);
      // Bright Yellow Core
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(bx - 3, by - 11 + f2, 6, 6);
      // White Spark Center
      ctx.fillStyle = "#fffbeb";
      ctx.fillRect(bx - 1.5, by - 9 + f1 * 0.5, 3, 4);
      // Specular Star Tip
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(bx - 0.5, by - 13 + f1, 1, 2);
    });

    // 8. Rising Ethereal Sacred Sparkles
    this.sparks.forEach((sp) => {
      ctx.fillStyle = `rgba(0, 240, 255, ${sp.alpha})`;
      ctx.fillRect(Math.floor(sp.x), Math.floor(sp.y), sp.size, sp.size);
    });

    // 9. Sanctuary Protective Forcefield Barrier (Translucent Dome Edge)
    const pulse = Math.sin(this.animTick * 2) * 2;
    ctx.strokeStyle = "rgba(56, 189, 248, 0.22)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(midX, midY, 136 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 209, 102, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(midX, midY, 140 + pulse, 0, Math.PI * 2);
    ctx.stroke();
  }
}