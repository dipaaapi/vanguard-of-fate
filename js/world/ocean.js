export class OceanSystem {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.seaWidth = 360;
    this.seaHeight = 270;
    this.animTick = 0;
  }

  update() {
    this.animTick += 0.04;
  }

  draw(ctx) {
    ctx.save();
    const seaY = this.worldHeight - this.seaHeight;
    const t = this.animTick;

    // 1. BUHANGINAN / COASTAL SHORELINE FOUNDATION (DRY & WET SAND)
    ctx.fillStyle = "#d4a373"; // Dry Sand
    ctx.beginPath();
    ctx.moveTo(0, seaY - 15);
    ctx.bezierCurveTo(120, seaY - 10, 240, seaY + 70, this.seaWidth + 30, this.worldHeight);
    ctx.lineTo(0, this.worldHeight);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#bc6c25"; // Wet Dark Sand
    ctx.beginPath();
    ctx.moveTo(0, seaY + 5);
    ctx.bezierCurveTo(110, seaY + 10, 220, seaY + 85, this.seaWidth + 10, this.worldHeight);
    ctx.lineTo(0, this.worldHeight);
    ctx.closePath();
    ctx.fill();

    // 2. DEEP TROPICAL OCEAN WATER GRADIENT (HINDI MUKHANG PALIKPIK)
    const oceanGrad = ctx.createLinearGradient(0, seaY + 20, this.seaWidth, this.worldHeight);
    oceanGrad.addColorStop(0, "#00b4d8");    // Shallow Bright Cyan / Turquoise
    oceanGrad.addColorStop(0.3, "#0077b6");  // Mid Azure Blue
    oceanGrad.addColorStop(0.65, "#023e8a"); // Deep Royal Blue
    oceanGrad.addColorStop(1, "#03045e");    // Abyssal Navy Blue
    ctx.fillStyle = oceanGrad;

    ctx.beginPath();
    ctx.moveTo(0, seaY + 25);
    ctx.bezierCurveTo(100, seaY + 30, 205, seaY + 100, this.seaWidth, this.worldHeight);
    ctx.lineTo(0, this.worldHeight);
    ctx.closePath();
    ctx.fill();

    // 3. ANIMATED SHORELINE FOAM (LAPPING WAVES SUMUSULONG SA BUHANGIN)
    const wavePush = Math.sin(t * 1.2) * 8;
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.beginPath();
    ctx.moveTo(0, seaY + 20 + wavePush);
    ctx.bezierCurveTo(
      100 + wavePush * 0.5,
      seaY + 25 + wavePush,
      205 + wavePush * 0.4,
      seaY + 95 + wavePush,
      this.seaWidth + wavePush * 0.3,
      this.worldHeight
    );
    ctx.lineTo(this.seaWidth, this.worldHeight);
    ctx.bezierCurveTo(205, seaY + 102, 100, seaY + 32, 0, seaY + 27);
    ctx.closePath();
    ctx.fill();

    // 4. MULTI-LAYERED OCEAN SWELLS (ALON SA GITNA NG TUBIG)
    for (let i = 0; i < 6; i++) {
      const swellOffset = Math.sin(t * 1.5 + i * 1.3) * 5;
      const waveY = seaY + 55 + i * 34 + swellOffset;
      const startX = 15;
      const endX = 130 + i * 35;

      ctx.strokeStyle = i % 2 === 0 ? "rgba(144, 224, 239, 0.55)" : "rgba(202, 240, 248, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, waveY);
      ctx.quadraticCurveTo(startX + (endX - startX) * 0.5 + swellOffset, waveY + 8, endX, waveY + 22);
      ctx.stroke();

      // Sparkling Sun Glints sa Alon
      const sparkleX = startX + 25 + ((t * 22 + i * 45) % (endX - startX - 20));
      const sparkleY = waveY + Math.sin(t * 2 + i) * 4;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(Math.round(sparkleX), Math.round(sparkleY), 2, 2);
    }

    // 5. JAGGED COASTAL CLIFF ROCKS (MGA BATO SA BAYBAYIN)
    ctx.fillStyle = "#2b2d42";
    ctx.beginPath();
    ctx.moveTo(0, seaY - 15);
    ctx.lineTo(35, seaY - 8);
    ctx.lineTo(55, seaY + 8);
    ctx.lineTo(30, seaY + 18);
    ctx.lineTo(0, seaY + 14);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#4a4e69"; // Rock highlights
    ctx.fillRect(8, seaY - 10, 14, 4);
    ctx.fillRect(25, seaY - 4, 12, 5);

    ctx.restore();
  }
}