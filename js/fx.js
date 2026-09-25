export class FXManager {
  constructor() {
    this.screenShake = 0;
    this.damagePopups = [];
    this.hitParticles = [];
    this.bloodSplats = [];
    this.burnFlames = [];
    this.freezeShards = [];

    // Environment & Weather
    this.timeOfDay = "DAY";
    this.dayTick = 0;
    this.weatherType = "CLEAR";
    this.weatherTick = 0;
    this.rainDrops = [];

    for (let i = 0; i < 90; i++) {
      this.rainDrops.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        speed: 7 + Math.random() * 5,
        len: 8 + Math.random() * 6
      });
    }
  }

  addScreenShake(amount) {
    this.screenShake = Math.max(this.screenShake, amount);
  }

  spawnDamagePopup(x, y, text, isCrit = false) {
    this.damagePopups.push({
      x: x + (Math.random() * 8 - 4),
      y: y - 4,
      text: text,
      color: isCrit ? "#ffea00" : "#ffffff",
      alpha: 1.0,
      vy: isCrit ? -1.3 : -0.85,
      isCrit: isCrit
    });
  }

  spawnHitSparks(x, y, color = "#ffdd00", count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.2;
      this.hitParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        life: 14 + Math.floor(Math.random() * 8),
        size: Math.random() > 0.5 ? 2 : 1
      });
    }
  }

  // 1. KNIGHT BLEED EFFECT (Dumadanak na Dugo sa Armas at Kalaban)
  spawnBloodSplatter(x, y, count = 10, isHeavy = false) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isHeavy ? 2.5 : 1.2) + Math.random() * 2.5;
      this.bloodSplats.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 24 + Math.floor(Math.random() * 12),
        color: Math.random() > 0.3 ? "#b00020" : "#e63946",
        size: isHeavy ? (Math.random() > 0.5 ? 3 : 2) : 2
      });
    }
  }

  // 2. MAGE METEOR BURN EFFECT (Nagbabagang Apoy at Usok)
  spawnBurnFlames(x, y, radius = 24, count = 12) {
    for (let i = 0; i < count; i++) {
      const offsetAngle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      this.burnFlames.push({
        x: x + Math.cos(offsetAngle) * dist,
        y: y + Math.sin(offsetAngle) * dist,
        vy: -0.6 - Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 0.4,
        life: 30 + Math.floor(Math.random() * 20),
        maxLife: 50,
        color: Math.random() > 0.4 ? "#ff5500" : "#ffcc00",
        size: 2 + Math.random() * 2
      });
    }
  }

  // 3. FREEZE EFFECT (Cyan Crystal Frost Shards)
  spawnFreezeEffect(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * 14;
      this.freezeShards.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        life: 40 + Math.floor(Math.random() * 20),
        size: 2 + Math.floor(Math.random() * 2)
      });
    }
  }

  getShakeOffsets() {
    let offsetX = 0, offsetY = 0;
    if (this.screenShake > 0) {
      offsetX = (Math.random() - 0.5) * this.screenShake;
      offsetY = (Math.random() - 0.5) * this.screenShake;
      this.screenShake *= 0.82;
      if (this.screenShake < 0.3) this.screenShake = 0;
    }
    return { offsetX: Math.round(offsetX), offsetY: Math.round(offsetY) };
  }

  updateEnvironment(weatherEnabled = true) {
    this.dayTick++;
    if (this.dayTick > 6000) this.dayTick = 0;

    if (this.dayTick < 2200) this.timeOfDay = "DAY";
    else if (this.dayTick < 3000) this.timeOfDay = "DUSK";
    else if (this.dayTick < 5200) this.timeOfDay = "NIGHT";
    else this.timeOfDay = "DAWN";

    if (weatherEnabled) {
      this.weatherTick++;
      if (this.weatherTick > 3600) this.weatherTick = 0;

      if (this.weatherTick < 1600) this.weatherType = "CLEAR";
      else if (this.weatherTick < 2300) this.weatherType = "OVERCAST";
      else if (this.weatherTick < 3200) this.weatherType = "RAIN";
      else this.weatherType = "STORM";
    } else {
      this.weatherType = "CLEAR";
    }
  }

  updateAndDraw(ctx, gameConfig = { blood: true }) {
    // 1. Draw Bleed Blood Splats
    if (gameConfig.blood !== false) {
      for (let b = this.bloodSplats.length - 1; b >= 0; b--) {
        const bl = this.bloodSplats[b];
        bl.x += bl.vx;
        bl.y += bl.vy;
        bl.vx *= 0.9;
        bl.vy *= 0.9;
        bl.life--;
        ctx.fillStyle = bl.color;
        ctx.fillRect(Math.round(bl.x), Math.round(bl.y), bl.size, bl.size);
        if (bl.life <= 0) this.bloodSplats.splice(b, 1);
      }
    }

    // 2. Draw Sparks
    for (let s = this.hitParticles.length - 1; s >= 0; s--) {
      const pt = this.hitParticles[s];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
      if (pt.life <= 0) this.hitParticles.splice(s, 1);
    }

    // 3. Draw Burn Flames
    for (let f = this.burnFlames.length - 1; f >= 0; f--) {
      const fl = this.burnFlames[f];
      fl.x += fl.vx;
      fl.y += fl.vy;
      fl.life--;
      ctx.save();
      ctx.globalAlpha = Math.max(0, fl.life / fl.maxLife);
      ctx.fillStyle = fl.color;
      ctx.fillRect(Math.round(fl.x), Math.round(fl.y), Math.round(fl.size), Math.round(fl.size));
      ctx.restore();
      if (fl.life <= 0) this.burnFlames.splice(f, 1);
    }

    // 4. Draw Freeze Frost Shards
    for (let z = this.freezeShards.length - 1; z >= 0; z--) {
      const fs = this.freezeShards[z];
      fs.life--;
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(Math.round(fs.x), Math.round(fs.y), fs.size, fs.size);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(Math.round(fs.x + 1), Math.round(fs.y), 1, 1);
      if (fs.life <= 0) this.freezeShards.splice(z, 1);
    }

    // 5. Draw Floating Damage Popups
    for (let d = this.damagePopups.length - 1; d >= 0; d--) {
      const pop = this.damagePopups[d];
      pop.y += pop.vy;
      pop.alpha -= 0.025;

      ctx.save();
      ctx.globalAlpha = Math.max(0, pop.alpha);
      ctx.font = pop.isCrit ? "bold 9px monospace" : "bold 7px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#000000";
      ctx.fillText(pop.text, pop.x + 1, pop.y + 1);
      ctx.fillText(pop.text, pop.x - 1, pop.y - 1);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();

      if (pop.alpha <= 0) this.damagePopups.splice(d, 1);
    }
  }

  // Visual Overlays sa mga Kalaban (Target Lock, Freeze, Stun)
  drawEnemyStatusEffects(ctx, enemy, animTick) {
    if (!enemy || !enemy.isAlive) return;

    const cx = enemy.x + 12;
    const cy = enemy.y + 12;

    // A. FIGHTER TARGET / LOCKED RETICLE
    if (enemy.isMarkedCritical) {
      ctx.save();
      const rot = animTick * 0.08;
      ctx.strokeStyle = "#ff0055";
      ctx.lineWidth = 1.5;

      // Rotating Crosshair Ring
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 14, rot, rot + Math.PI * 1.5);
      ctx.stroke();

      // Crosshair Pins
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(cx - 1, cy - 18, 2, 5);
      ctx.fillRect(cx - 1, cy + 10, 2, 5);
      ctx.fillRect(cx - 18, cy - 3, 5, 2);
      ctx.fillRect(cx + 12, cy - 3, 5, 2);

      ctx.fillStyle = "#ff0055";
      ctx.font = "bold 6px monospace";
      ctx.textAlign = "center";
      ctx.fillText("TARGET", cx, cy - 20);
      ctx.restore();
    }

    // B. STUN EFFECT (Dizzy Stars Halo sa ulo)
    if (enemy.isStunned || enemy.stunTimer > 0) {
      ctx.save();
      const starAngle = animTick * 0.12;
      for (let i = 0; i < 3; i++) {
        const sa = starAngle + (i * (Math.PI * 2 / 3));
        const sx = cx + Math.cos(sa) * 11;
        const sy = enemy.y - 7 + Math.sin(sa) * 4;

        ctx.fillStyle = "#ffd166";
        ctx.fillRect(Math.round(sx) - 1, Math.round(sy) - 1, 3, 3);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
      }
      ctx.restore();
    }

    // C. FREEZE AURA (Nagyeyelong Paanan)
    if (enemy.isFrozen || (enemy.debuff && enemy.debuff.freeze > 0)) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 240, 255, 0.4)";
      ctx.beginPath();
      ctx.ellipse(cx, enemy.y + 20, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  // ARCHER RELOAD VISUAL EFFECT (Overhead Spark Ring & Quiver Halo)
  drawArcherReloadEffect(ctx, player, animTick) {
    if (!player || !player.isReloading) return;

    ctx.save();
    const cx = player.x + 12;
    const cy = player.y - 12;

    // Glowing Golden Quiver Pulse Ring
    const pulse = Math.sin(animTick * 0.15) * 3;
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 10 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Floating Arrow Spark Motes
    for (let i = 0; i < 4; i++) {
      const a = animTick * 0.1 + (i * Math.PI / 2);
      const px = cx + Math.cos(a) * (12 + pulse);
      const py = cy + Math.sin(a) * (12 + pulse);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }

    // Reload Progress Bar
    const barW = 24, barH = 3;
    const barX = player.x;
    const barY = player.y - 8;
    const ratio = Math.max(0, 1 - player.reloadTimer / player.reloadMax);

    ctx.fillStyle = "#111";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(barX, barY, Math.round(barW * ratio), barH);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 5px monospace";
    ctx.textAlign = "center";
    ctx.fillText("RELOADING...", cx, barY - 3);

    ctx.restore();
  }

  drawAmbientLighting(ctx, width, height, playerX, playerY) {
    if (this.timeOfDay === "DAY") return;

    let darkAlpha = 0;
    let tintColor = "rgba(10, 15, 30, ";

    if (this.timeOfDay === "DUSK") {
      darkAlpha = 0.28;
      tintColor = "rgba(45, 20, 10, ";
    } else if (this.timeOfDay === "NIGHT") {
      darkAlpha = 0.65;
      tintColor = "rgba(5, 8, 20, ";
    } else if (this.timeOfDay === "DAWN") {
      darkAlpha = 0.22;
      tintColor = "rgba(20, 25, 40, ";
    }

    ctx.save();
    const lightGrad = ctx.createRadialGradient(playerX, playerY, 20, playerX, playerY, 85);
    lightGrad.addColorStop(0, "rgba(0,0,0,0)");
    lightGrad.addColorStop(0.65, `${tintColor}${darkAlpha * 0.5})`);
    lightGrad.addColorStop(1, `${tintColor}${darkAlpha})`);

    ctx.fillStyle = lightGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  drawWeather(ctx, width, height, weatherEnabled = true) {
    if (!weatherEnabled || this.weatherType === "CLEAR" || this.weatherType === "OVERCAST") return;

    ctx.save();
    ctx.strokeStyle = "rgba(180, 215, 255, 0.55)";
    ctx.lineWidth = 1;

    for (let r of this.rainDrops) {
      r.y += r.speed;
      r.x -= 2.2;
      if (r.y > height) { r.y = -10; r.x = Math.random() * (width + 100); }
      if (r.x < -10) { r.x = width + 10; }

      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - 3, r.y + r.len);
      ctx.stroke();
    }

    if (this.weatherType === "STORM" && Math.random() < 0.015) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(0, 0, width, height);
      this.addScreenShake(3);
    }
    ctx.restore();
  }

  drawVignette(ctx, width, height) {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 90, width / 2, height / 2, 220);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(5, 7, 10, 0.45)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  reset() {
    this.screenShake = 0;
    this.damagePopups = [];
    this.hitParticles = [];
    this.bloodSplats = [];
    this.burnFlames = [];
    this.freezeShards = [];
  }
}