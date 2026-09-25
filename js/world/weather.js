export class WeatherSystem {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.animTick = 0;

    this.weatherType = "CLEAR"; // CLEAR, RAIN, STORM, FOG
    this.weatherTimer = 0;
    this.weatherDuration = 2400; // ~40 segundo bawat pagpapalit

    // Soft Multi-cluster Cumulus Sky Clouds
    this.skyClouds = [];
    for (let c = 0; c < 7; c++) {
      this.skyClouds.push({
        x: Math.random() * this.worldWidth,
        y: 60 + Math.random() * (this.worldHeight - 200),
        w: 90 + Math.random() * 50,
        h: 28 + Math.random() * 12,
        speed: 0.16 + Math.random() * 0.18,
        opacity: 0.32 + Math.random() * 0.18
      });
    }

    // Dynamic Raindrop Particles
    this.rainDrops = [];
    for (let r = 0; r < 75; r++) {
      this.rainDrops.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        speedY: 7.5 + Math.random() * 4,
        speedX: -1.6,
        len: 8 + Math.random() * 7
      });
    }

    this.lightningFlash = 0;
  }

  update() {
    this.animTick++;

    // 1. Drifting Sky Clouds
    this.skyClouds.forEach((cloud) => {
      cloud.x += cloud.speed;
      if (cloud.x - cloud.w > this.worldWidth) {
        cloud.x = -cloud.w;
        cloud.y = 60 + Math.random() * (this.worldHeight - 200);
      }
    });

    // 2. Weather Engine Cycle
    this.weatherTimer++;
    if (this.weatherTimer >= this.weatherDuration) {
      this.weatherTimer = 0;
      const sequence = ["CLEAR", "CLEAR", "RAIN", "STORM", "FOG"];
      this.weatherType = sequence[Math.floor(Math.random() * sequence.length)];
    }

    // 3. Rain & Storm Physics
    if (this.weatherType === "RAIN" || this.weatherType === "STORM") {
      this.rainDrops.forEach((d) => {
        d.y += d.speedY * (this.weatherType === "STORM" ? 1.45 : 1.0);
        d.x += d.speedX;
        if (d.y > this.worldHeight) {
          d.y = -10;
          d.x = Math.random() * this.worldWidth;
        }
      });

      if (this.weatherType === "STORM" && Math.random() < 0.006) {
        this.lightningFlash = 4;
      }
    }
  }

  // Multi-tier Soft Clouds (Kapag CLEAR SKY)
  drawSkyClouds(ctx) {
    if (this.weatherType !== "CLEAR") return;
    ctx.save();
    this.skyClouds.forEach((c) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;

      // Center Mass
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w * 0.45, c.h * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Left Billow
      ctx.beginPath();
      ctx.ellipse(c.x - c.w * 0.22, c.y + 2, c.w * 0.32, c.h * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();

      // Right Billow
      ctx.beginPath();
      ctx.ellipse(c.x + c.w * 0.24, c.y - 2, c.w * 0.35, c.h * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle Underside Shade
      ctx.fillStyle = `rgba(180, 205, 230, ${c.opacity * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + c.h * 0.2, c.w * 0.4, c.h * 0.2, 0, 0, Math.PI);
      ctx.fill();
    });
    ctx.restore();
  }

  // Weather Screen Overlay
  drawWeatherOverlay(ctx) {
    ctx.save();
    if (this.weatherType === "RAIN" || this.weatherType === "STORM") {
      ctx.strokeStyle = this.weatherType === "STORM" ? "rgba(186, 230, 253, 0.7)" : "rgba(147, 197, 253, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      this.rainDrops.forEach((d) => {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.speedX * 2, d.y + d.len);
      });
      ctx.stroke();

      ctx.fillStyle = this.weatherType === "STORM" ? "rgba(10, 18, 32, 0.38)" : "rgba(15, 23, 42, 0.2)";
      ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

      if (this.lightningFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.12})`;
        ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);
        this.lightningFlash--;
      }
    } else if (this.weatherType === "FOG") {
      ctx.fillStyle = "rgba(203, 213, 225, 0.24)";
      ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);
    }
    ctx.restore();
  }

  // Volumetric Organic Mist Borders (Apat na Gilid ng Mapa)
  drawCloudBorders(ctx) {
    ctx.save();
    const t = this.animTick * 0.02;

    // Top Mist
    for (let x = -20; x <= this.worldWidth + 60; x += 55) {
      const cy = 20 + Math.sin(t + x * 0.05) * 8;
      const grad = ctx.createRadialGradient(x, cy, 10, x, cy, 48);
      grad.addColorStop(0, "rgba(230, 240, 255, 0.7)");
      grad.addColorStop(0.55, "rgba(180, 205, 240, 0.35)");
      grad.addColorStop(1, "rgba(180, 205, 240, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, cy, 48, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bottom Mist
    for (let x = -20; x <= this.worldWidth + 60; x += 55) {
      const cy = this.worldHeight - 20 + Math.cos(t + x * 0.05) * 8;
      const grad = ctx.createRadialGradient(x, cy, 10, x, cy, 48);
      grad.addColorStop(0, "rgba(230, 240, 255, 0.7)");
      grad.addColorStop(0.55, "rgba(180, 205, 240, 0.35)");
      grad.addColorStop(1, "rgba(180, 205, 240, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, cy, 48, 0, Math.PI * 2);
      ctx.fill();
    }

    // Left Mist
    for (let y = -20; y <= this.worldHeight + 60; y += 55) {
      const cx = 20 + Math.sin(t + y * 0.05) * 8;
      const grad = ctx.createRadialGradient(cx, y, 10, cx, y, 48);
      grad.addColorStop(0, "rgba(230, 240, 255, 0.7)");
      grad.addColorStop(0.55, "rgba(180, 205, 240, 0.35)");
      grad.addColorStop(1, "rgba(180, 205, 240, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, y, 48, 0, Math.PI * 2);
      ctx.fill();
    }

    // Right Mist
    for (let y = -20; y <= this.worldHeight + 60; y += 55) {
      const cx = this.worldWidth - 20 + Math.cos(t + y * 0.05) * 8;
      const grad = ctx.createRadialGradient(cx, y, 10, cx, y, 48);
      grad.addColorStop(0, "rgba(230, 240, 255, 0.7)");
      grad.addColorStop(0.55, "rgba(180, 205, 240, 0.35)");
      grad.addColorStop(1, "rgba(180, 205, 240, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, y, 48, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}