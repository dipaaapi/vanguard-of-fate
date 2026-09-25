export class CastleSystem {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Matatagpuan sa Hilagang-Silangan (North-East)
    this.x = this.worldWidth - 360;
    this.y = 20;
    this.width = 320;
    this.height = 230;

    this.animTick = 0;

    // SOLID PHYSICAL HITBOXES (Bawal tapakan o lagusan ng kahit sino)
    this.solidColliders = [
      // Gitnang Citadel Keep at Likod
      { x: this.x + 80, y: this.y + 20, w: 160, h: 110 },
      // Kaliwang Tore (West Tower)
      { x: this.x + 16, y: this.y + 20, w: 64, h: 165 },
      // Kanang Tore (East Tower)
      { x: this.x + 240, y: this.y + 20, w: 64, h: 165 },
      // Harapang Pader (Kaliwa ng Gate)
      { x: this.x + 80, y: this.y + 115, w: 56, h: 70 },
      // Harapang Pader (Kanan ng Gate)
      { x: this.x + 184, y: this.y + 115, w: 56, h: 70 }
    ];

    // Animated Grand Portal sa harapan ng Gate
    this.gatePortal = {
      x: this.x + 160,
      y: this.y + 195,
      radiusX: 24,
      radiusY: 10,
      color: "#38bdf8",
      glowColor: "#818cf8"
    };
  }

  // Pinipigilan ang paglagos ng kahit anong entity (Player, Mercenary, o Enemy)
  resolveCollision(entity) {
    if (!entity) return;
    const footX = entity.x + 10;
    const footY = entity.y + 18; // Paanan ng sprite
    const radius = 8;

    for (const box of this.solidColliders) {
      if (
        footX + radius > box.x &&
        footX - radius < box.x + box.w &&
        footY + radius > box.y &&
        footY - radius < box.y + box.h
      ) {
        // Alamin kung saang gilid pinakamalapit para itulak palabas
        const dLeft = footX + radius - box.x;
        const dRight = box.x + box.w - (footX - radius);
        const dTop = footY + radius - box.y;
        const dBottom = box.y + box.h - (footY - radius);

        const min = Math.min(dLeft, dRight, dTop, dBottom);

        if (min === dLeft) entity.x = box.x - radius - 10;
        else if (min === dRight) entity.x = box.x + box.w + radius - 10;
        else if (min === dTop) entity.y = box.y - radius - 18;
        else if (min === dBottom) entity.y = box.y + box.h + radius - 18;
      }
    }
  }

  update() {
    this.animTick += 0.06;
  }

  draw(ctx) {
    ctx.save();
    const bx = this.x;
    const by = this.y;
    const t = this.animTick;

    // Contact Base Shadow
    ctx.fillStyle = "rgba(4, 7, 15, 0.65)";
    ctx.beginPath();
    ctx.ellipse(bx + 160, by + 185, 152, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. REAR CITADEL KEEP (Pader sa likod)
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(bx + 80, by + 25, 160, 100);

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(bx + 84, by + 29, 152, 92);

    // Stone Masonry Pattern
    ctx.fillStyle = "#334155";
    for (let r = 0; r < 7; r++) {
      const rowY = by + 36 + r * 12;
      const off = (r % 2 === 0) ? 0 : 8;
      for (let c = 0; c < 8; c++) {
        ctx.fillRect(bx + 90 + c * 18 + off, rowY, 14, 1);
      }
    }

    // High Citadel Machicolations / Battlements
    ctx.fillStyle = "#475569";
    for (let c = 0; c < 9; c++) {
      ctx.fillRect(bx + 82 + c * 17, by + 18, 10, 10);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(bx + 82 + c * 17, by + 26, 10, 2);
      ctx.fillStyle = "#475569";
    }

    // Glowing Stained-Glass Rose Window
    const glassPulse = 0.5 + Math.sin(t * 1.5) * 0.3;
    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.arc(bx + 160, by + 68, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(56, 189, 248, ${glassPulse})`;
    ctx.beginPath();
    ctx.arc(bx + 160, by + 68, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Central Citadel Banner
    const bannerWave = Math.sin(t * 1.8) * 3;
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(bx + 159, by + 2, 2, 20);
    ctx.fillStyle = "#e63946";
    ctx.beginPath();
    ctx.moveTo(bx + 161, by + 2);
    ctx.lineTo(bx + 184, by + 8 + bannerWave);
    ctx.lineTo(bx + 161, by + 15);
    ctx.closePath();
    ctx.fill();

    // 2. TWIN DEFENSE TOWERS (KALIWA AT KANAN)
    const towers = [
      { x: bx + 16, y: by + 35, color: "#3b82f6" },
      { x: bx + 240, y: by + 35, color: "#e63946" }
    ];

    towers.forEach((tow, idx) => {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(tow.x, tow.y, 64, 150);

      const grad = ctx.createLinearGradient(tow.x, tow.y, tow.x + 64, tow.y);
      grad.addColorStop(0, "#475569");
      grad.addColorStop(0.35, "#334155");
      grad.addColorStop(1, "#1e293b");
      ctx.fillStyle = grad;
      ctx.fillRect(tow.x + 3, tow.y + 3, 58, 144);

      // Tower Parapets
      ctx.fillStyle = "#64748b";
      for (let p = 0; p < 4; p++) {
        ctx.fillRect(tow.x + 3 + p * 15, tow.y - 8, 9, 10);
      }

      // Arrow Slit Windows
      ctx.fillStyle = "#020617";
      ctx.fillRect(tow.x + 20, tow.y + 40, 4, 12);
      ctx.fillRect(tow.x + 40, tow.y + 40, 4, 12);
      ctx.fillRect(tow.x + 30, tow.y + 75, 4, 12);

      // Tower Pennant Flags
      const twWave = Math.sin(t * 1.8 + idx) * 2.5;
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(tow.x + 31, tow.y - 20, 2, 16);
      ctx.fillStyle = tow.color;
      ctx.beginPath();
      ctx.moveTo(tow.x + 33, tow.y - 20);
      ctx.lineTo(tow.x + 50, tow.y - 15 + twWave);
      ctx.lineTo(tow.x + 33, tow.y - 10);
      ctx.closePath();
      ctx.fill();
    });

    // 3. FRONT CURTAIN WALLS & GRAND PORTCULLIS GATE
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(bx + 80, by + 115, 160, 70);

    ctx.fillStyle = "#334155";
    ctx.fillRect(bx + 80, by + 112, 160, 5);

    // Arched Gate Opening
    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.ellipse(bx + 160, by + 185, 24, 30, 0, Math.PI, 0);
    ctx.fill();

    // Raised Iron Portcullis Grate
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.4;
    for (let gx = -18; gx <= 18; gx += 6) {
      ctx.beginPath();
      ctx.moveTo(bx + 160 + gx, by + 155);
      ctx.lineTo(bx + 160 + gx, by + 183);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(bx + 142, by + 166);
    ctx.lineTo(bx + 178, by + 166);
    ctx.stroke();

    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(bx + 160, by + 185, 25, 32, 0, Math.PI, 0);
    ctx.stroke();

    // 4. ANIMATED CITADEL GATE PORTAL
    const gp = this.gatePortal;
    const pPulse = Math.sin(t * 2.2) * 2.5;

    const portalGrad = ctx.createRadialGradient(gp.x, gp.y, 2, gp.x, gp.y, gp.radiusX + pPulse);
    portalGrad.addColorStop(0, "#ffffff");
    portalGrad.addColorStop(0.35, gp.color);
    portalGrad.addColorStop(0.75, gp.glowColor);
    portalGrad.addColorStop(1, "rgba(2, 6, 23, 0)");

    ctx.fillStyle = portalGrad;
    ctx.beginPath();
    ctx.ellipse(gp.x, gp.y, gp.radiusX + pPulse, gp.radiusY + pPulse * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rotating Rune Ring
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.ellipse(gp.x, gp.y, gp.radiusX * 0.7, gp.radiusY * 0.7, t * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rising Portal Motes
    for (let i = 0; i < 5; i++) {
      const moteY = gp.y - ((t * 18 + i * 9) % 26);
      const moteX = gp.x + Math.sin(t * 1.5 + i * 2) * (gp.radiusX * 0.6);
      const alpha = 1 - (gp.y - moteY) / 26;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(Math.round(moteX), Math.round(moteY), 1.5, 1.5);
    }

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillText("⚔️ CITADEL GATE PORTAL", gp.x, gp.y + 16);

    ctx.restore();
  }
}