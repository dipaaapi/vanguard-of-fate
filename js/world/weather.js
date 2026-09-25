import { Sound } from "../audio.js";

export class WeatherSystem {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.animTick = 0;

    this.weatherType = "CLEAR"; // CLEAR, RAIN, STORM, FOG
    this.weatherTimer = 0;
    this.weatherDuration = 2400; // ~40s per weather shift

    // Soft Multi-cluster Cumulus Sky Clouds
    this.skyClouds = [];
    for (let c = 0; c < 10; c++) {
      this.skyClouds.push({
        x: Math.random() * this.worldWidth,
        y: 40 + Math.random() * (this.worldHeight - 160),
        w: 120 + Math.random() * 80,
        h: 36 + Math.random() * 16,
        speed: 0.14 + Math.random() * 0.16,
        opacity: 0.35 + Math.random() * 0.2
      });
    }

    // Dynamic Raindrop Particles & Ground Splashes
    this.rainDrops = [];
    for (let r = 0; r < 90; r++) {
      this.rainDrops.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        speedY: 8 + Math.random() * 4,
        speedX: -1.8,
        len: 10 + Math.random() * 8
      });
    }

    this.splashes = [];
    this.lightningFlash = 0;
  }

  update() {
    this.animTick++;

    // 1. Drifting Sky Clouds
    this.skyClouds.forEach((cloud) => {
      cloud.x += cloud.speed;
      if (cloud.x - cloud.w > this.worldWidth) {
        cloud.x = -cloud.w;
        cloud.y = 40 + Math.random() * (this.worldHeight - 160);
      }
    });

    // 2. Weather Engine Cycle
    this.weatherTimer++;
    if (this.weatherTimer >= this.weatherDuration) {
      this.weatherTimer = 0;
      const sequence = ["CLEAR", "CLEAR", "RAIN", "STORM", "FOG"];
      this.weatherType = sequence[Math.floor(Math.random() * sequence.length)];
    }

    // 3. Rain & Storm Physics with Ground Splashes
    if (this.weatherType === "RAIN" || this.weatherType === "STORM") {
      this.rainDrops.forEach((d) => {
        d.y += d.speedY * (this.weatherType === "STORM" ? 1.4 : 1.0);
        d.x += d.speedX;
        if (d.y > this.worldHeight - 30) {
          if (this.splashes.length < 35 && Math.random() < 0.4) {
            this.splashes.push({
              x: d.x,
              y: d.y,
              radius: 1,
              maxRadius: 4 + Math.random() * 3,
              alpha: 0.8
            });
          }
          d.y = -10;
          d.x = Math.random() * (this.worldWidth + 200);
        }
      });

      for (let i = this.splashes.length - 1; i >= 0; i--) {
        const sp = this.splashes[i];
        sp.radius += 0.35;
        sp.alpha -= 0.05;
        if (sp.alpha <= 0) {
          this.splashes.splice(i, 1);
        }
      }

      if (this.weatherType === "STORM" && Math.random() < 0.006) {
        this.lightningFlash = 5;
        if (Sound && Sound.playThunder) Sound.playThunder();
      }
    }
  }

  // Multi-tier Soft Volumetric Cumulus Clouds (Kapag CLEAR SKY)
  drawSkyClouds(ctx) {
    if (this.weatherType !== "CLEAR") return;
    ctx.save();
    this.skyClouds.forEach((c) => {
      // 1. Soft Ambient Ground Shadow
      ctx.fillStyle = "rgba(10, 20, 30, 0.09)";
      ctx.beginPath();
      ctx.ellipse(c.x + 35, c.y + 115, c.w * 0.52, c.h * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. High-Fidelity Multi-Cluster Volumetric Cumulus Billows
      // Bottom Base Shadow
      ctx.fillStyle = `rgba(186, 215, 240, ${c.opacity * 0.42})`;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + c.h * 0.2, c.w * 0.46, c.h * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main Cloud Body
      ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w * 0.44, c.h * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();

      // Left High Puff
      ctx.beginPath();
      ctx.ellipse(c.x - c.w * 0.24, c.y + 2, c.w * 0.34, c.h * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();

      // Right High Puff
      ctx.beginPath();
      ctx.ellipse(c.x + c.w * 0.25, c.y - 3, c.w * 0.36, c.h * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();

      // Top Highlight Puff
      ctx.beginPath();
      ctx.ellipse(c.x + 4, c.y - c.h * 0.18, c.w * 0.3, c.h * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sunlight Silver-Lining Specular Rim
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, c.opacity + 0.25)})`;
      ctx.beginPath();
      ctx.ellipse(c.x - 6, c.y - c.h * 0.22, c.w * 0.22, c.h * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Weather Screen Overlay with Ground Ripple Splashes
  drawWeatherOverlay(ctx) {
    ctx.save();
    if (this.weatherType === "RAIN" || this.weatherType === "STORM") {
      ctx.strokeStyle = this.weatherType === "STORM" ? "rgba(186, 230, 253, 0.75)" : "rgba(147, 197, 253, 0.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      this.rainDrops.forEach((d) => {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.speedX * 2, d.y + d.len);
      });
      ctx.stroke();

      // Ground Splash Ripples
      this.splashes.forEach((sp) => {
        ctx.strokeStyle = `rgba(186, 230, 253, ${sp.alpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(sp.x, sp.y, sp.radius * 1.5, sp.radius * 0.75, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.fillStyle = this.weatherType === "STORM" ? "rgba(8, 14, 28, 0.4)" : "rgba(15, 23, 42, 0.22)";
      ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

      if (this.lightningFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.15})`;
        ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);
        this.lightningFlash--;
      }
    } else if (this.weatherType === "FOG") {
      ctx.fillStyle = "rgba(203, 213, 225, 0.28)";
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