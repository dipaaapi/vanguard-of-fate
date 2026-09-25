export class OceanSystem {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.seaWidth = 440;
    this.seaHeight = 320;
    this.animTick = 0;

    // Specular sunlight sparkle glints
    this.sparkles = [];
    for (let i = 0; i < 40; i++) {
      this.sparkles.push({
        x: Math.random() * this.seaWidth,
        y: Math.random() * this.seaHeight,
        speed: 0.03 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
        size: Math.random() < 0.3 ? 2 : 1
      });
    }

    // Coastal Mist Particles
    this.mistParticles = [];
    for (let i = 0; i < 20; i++) {
      this.mistParticles.push({
        x: Math.random() * 280,
        y: Math.random() * 200,
        vx: 0.1 + Math.random() * 0.25,
        radius: 12 + Math.random() * 18,
        alpha: 0.1 + Math.random() * 0.15
      });
    }
  }

  update() {
    this.animTick += 0.04;
    for (const m of this.mistParticles) {
      m.x += m.vx;
      if (m.x > 320) m.x = -20;
    }
  }

  draw(ctx) {
    ctx.save();
    const seaY = this.worldHeight - this.seaHeight;
    const t = this.animTick;

    // 1. BUHANGINAN / COASTAL SHORELINE (Warm Golden Dry Sand & Deep Wet Sand)
    ctx.fillStyle = "#d4a373"; // Dry Coastal Sand
    ctx.beginPath();
    ctx.moveTo(0, seaY - 24);
    ctx.bezierCurveTo(140, seaY - 14, 280, seaY + 70, this.seaWidth + 50, this.worldHeight);
    ctx.lineTo(0, this.worldHeight);
    ctx.closePath();
    ctx.fill();

    // Wet Shoreline Sand with Water Sheen
    ctx.fillStyle = "#a97142";
    ctx.beginPath();
    ctx.moveTo(0, seaY - 2);
    ctx.bezierCurveTo(125, seaY + 6, 250, seaY + 88, this.seaWidth + 20, this.worldHeight);
    ctx.lineTo(0, this.worldHeight);
    ctx.closePath();
    ctx.fill();

    // 2. MULTI-STOP TROPICAL AZURE TO ABYSS GRADIENT
    const oceanGrad = ctx.createLinearGradient(0, seaY + 16, this.seaWidth, this.worldHeight);
    oceanGrad.addColorStop(0, "#48cae4");    // Luminous Shallow Turquoise
    oceanGrad.addColorStop(0.2, "#00b4d8"); // Vibrant Azure
    oceanGrad.addColorStop(0.45, "#0077b6"); // Deep Cobalt
    oceanGrad.addColorStop(0.75, "#023e8a"); // Abyssal Royal Navy
    oceanGrad.addColorStop(1, "#03045e");    // Midnight Trench
    ctx.fillStyle = oceanGrad;

    ctx.beginPath();
    ctx.moveTo(0, seaY + 18);
    ctx.bezierCurveTo(115, seaY + 26, 230, seaY + 102, this.seaWidth, this.worldHeight);
    ctx.lineTo(0, this.worldHeight);
    ctx.closePath();
    ctx.fill();

    // 3. ANIMATED SHORELINE TIDE EBB & FLOW SURF (3-Layered Froth)
    const wavePush = Math.sin(t * 1.2) * 12;
    const waveSub = Math.cos(t * 0.9) * 6;

    // Layer A: Deep Translucent Emerald Under-surge
    ctx.fillStyle = "rgba(72, 202, 228, 0.45)";
    ctx.beginPath();
    ctx.moveTo(0, seaY + 10 + wavePush);
    ctx.bezierCurveTo(120, seaY + 18 + wavePush, 240, seaY + 94 + wavePush, this.seaWidth + 10, this.worldHeight);
    ctx.lineTo(this.seaWidth, this.worldHeight);
    ctx.bezierCurveTo(220, seaY + 104, 110, seaY + 30, 0, seaY + 22);
    ctx.closePath();
    ctx.fill();

    // Layer B: Frothing White Surf Crest
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.beginPath();
    ctx.moveTo(0, seaY + 14 + wavePush);
    ctx.bezierCurveTo(115 + wavePush * 0.3, seaY + 22 + wavePush, 225 + wavePush * 0.2, seaY + 98 + wavePush, this.seaWidth, this.worldHeight);
    ctx.lineTo(this.seaWidth, this.worldHeight);
    ctx.bezierCurveTo(215, seaY + 108, 105, seaY + 32, 0, seaY + 26);
    ctx.closePath();
    ctx.fill();

    // Layer C: Receding Sea Foam Trace
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.beginPath();
    ctx.moveTo(0, seaY + 6 + waveSub);
    ctx.bezierCurveTo(110, seaY + 14 + waveSub, 220, seaY + 90 + waveSub, this.seaWidth, this.worldHeight);
    ctx.lineTo(this.seaWidth, this.worldHeight);
    ctx.bezierCurveTo(210, seaY + 98, 100, seaY + 24, 0, seaY + 18);
    ctx.closePath();
    ctx.fill();

    // 4. ANIMATED CAUSTIC WAVE RIPPLES & SPECULAR GLINTS
    for (let i = 0; i < 8; i++) {
      const swell = Math.sin(t * 1.5 + i * 1.2) * 8;
      const wy = seaY + 54 + i * 34 + swell;
      ctx.strokeStyle = "rgba(144, 224, 239, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, wy);
      ctx.quadraticCurveTo(140 + Math.sin(t + i) * 16, wy + 10, this.seaWidth - 20, wy + 30);
      ctx.stroke();
    }

    // 5. SUNLIGHT / MOONLIGHT DIAMOND SPARKLES
    for (const sp of this.sparkles) {
      const sx = sp.x + Math.sin(t * 2 + sp.phase) * 6;
      const sy = seaY + 30 + sp.y;
      if (sx < this.seaWidth && sy < this.worldHeight) {
        const bright = (Math.sin(t * 3 + sp.phase) + 1) / 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${bright * 0.85})`;
        ctx.fillRect(Math.floor(sx), Math.floor(sy), sp.size, sp.size);
      }
    }

    // 6. COASTAL MIST ATMOSPHERE
    for (const m of this.mistParticles) {
      const my = seaY + 40 + m.y;
      if (my < this.worldHeight) {
        const mistGrad = ctx.createRadialGradient(m.x, my, 2, m.x, my, m.radius);
        mistGrad.addColorStop(0, "rgba(224, 242, 254, 0.15)");
        mistGrad.addColorStop(1, "rgba(224, 242, 254, 0)");
        ctx.fillStyle = mistGrad;
        ctx.beginPath();
        ctx.arc(m.x, my, m.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
