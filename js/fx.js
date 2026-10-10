import { drawFx, fxFrames } from "./fxsprites.js";

export class FXManager {
  constructor() {
    this.screenShake = 0;
    this.hitStopFrames = 0;   // simulation frames still frozen (hit-stop)
    this.hitStopRest = 0;     // frames of free play before another hit-stop may start
    this.rings = [];          // shockwave rings
    this.damagePopups = [];
    this.hitParticles = [];
    this.bloodSplats = [];
    this.burnFlames = [];
    this.freezeShards = [];
    this.sprites = [];        // one-shot effect animations (js/fxsprites.js): bites, claws, slashes
    this.droplets = [];       // water splashes: rising, fading droplets
    this.ripples = [];        // water splashes: contact rings spreading on the surface

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

  // Hit-stop: freeze the fight for a few frames so heavy blows land with weight.
  // A short rest between stops keeps rapid multi-hits (AoE, burn ticks) from stuttering.
  hitStop(frames) {
    if (this.hitStopRest > 0 || frames <= this.hitStopFrames) return;
    this.hitStopFrames = frames;
  }

  // Called once per simulation step; true = skip this step
  consumeHitStop() {
    if (this.hitStopFrames > 0) {
      this.hitStopFrames--;
      if (this.hitStopFrames === 0) this.hitStopRest = 8;
      return true;
    }
    if (this.hitStopRest > 0) this.hitStopRest--;
    return false;
  }

  spawnDamagePopup(x, y, text, isCrit = false, color = null) {
    this.damagePopups.push({
      x: x + (Math.random() * 8 - 4),
      y: y - 4,
      text: text,
      color: color || (isCrit ? "#ff9f1c" : "#ffffff"),
      label: isCrit && typeof text === "number" ? "CRIT!" : null,
      alpha: 1.0,
      vy: isCrit ? -1.3 : -0.85,
      scale: isCrit ? 1.8 : 1.25,  // pops in big, then settles
      isCrit: isCrit
    });
  }

  // A death burst: a ring shockwave plus debris flung outward and falling
  spawnDeathBurst(x, y, color = "#ffffff", size = 1) {
    this.rings.push({ x, y, r: 3 * size, max: 16 * size, color, life: 14, maxLife: 14 });
    const n = Math.round(10 * size);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (1 + Math.random() * 2.2) * Math.min(1.6, size);
      this.hitParticles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2, g: 0.12, color: i % 3 ? color : "#ffffff", life: 18 + Math.floor(Math.random() * 12), size: Math.random() > 0.4 ? 2 : 1 });
    }
  }

  // One-shot effect animation at (x, y); o = { tint, rot, scale, every (frames per step) }.
  // Returns false when that effect's sheet isn't loaded (the caller's sparks still show).
  spawnSprite(name, x, y, o = {}) {
    if (!fxFrames(name)) return false;
    this.sprites.push({ name, x, y, t: 0, every: o.every || 3, n: fxFrames(name), o });
    return true;
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

  // 1. KNIGHT BLEED EFFECT (blood dripping from the weapon and the foe)
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

  // 2. MAGE METEOR BURN EFFECT (glowing fire and smoke)
  // Water splash where a foot or a projectile meets the sea or the wet shore: 4–6 droplets that
  // rise and fall back fading (#e0f7fa) and two contact ripples that spread on the surface.
  // small: a footstep in the shallows (3 droplets, one small ring)
  spawnWaterSplash(x, y, small = false) {
    if (this.droplets.length > 140) return;
    const n = small ? 3 : 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const life = (small ? 14 : 20) + Math.floor(Math.random() * 8);
      this.droplets.push({
        x: x + (Math.random() - 0.5) * 4, y, floor: y + 1,
        vx: (Math.random() - 0.5) * (small ? 0.8 : 1.3),
        vy: -(small ? 0.8 : 1.3) - Math.random() * (small ? 0.6 : 1.2),
        life, maxLife: life, size: Math.random() < 0.3 ? 2 : 1
      });
    }
    this.ripples.push({ x, y, r: 1, max: small ? 6 : 10, life: small ? 18 : 26, maxLife: small ? 18 : 26 });
    if (!small) this.ripples.push({ x, y, r: 0, max: 15, life: 34, maxLife: 34, delay: 6 });
  }

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

    // 1b. Water splashes: ripples on the surface, then the droplets above them
    for (let r = this.ripples.length - 1; r >= 0; r--) {
      const rp = this.ripples[r];
      if (rp.delay > 0) { rp.delay--; continue; }
      rp.life--;
      const k = 1 - rp.life / rp.maxLife;
      const rad = rp.r + (rp.max - rp.r) * k;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - k) * 0.75;
      ctx.strokeStyle = "#e0f7fa";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rad, rad * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      if (rp.life <= 0) this.ripples.splice(r, 1);
    }
    for (let d = this.droplets.length - 1; d >= 0; d--) {
      const dr = this.droplets[d];
      dr.x += dr.vx;
      dr.y += dr.vy;
      dr.vy += 0.13;
      dr.life--;
      ctx.globalAlpha = Math.max(0, dr.life / dr.maxLife);
      ctx.fillStyle = "#e0f7fa";
      ctx.fillRect(Math.round(dr.x), Math.round(Math.min(dr.y, dr.floor)), dr.size, dr.size);
      ctx.globalAlpha = 1;
      if (dr.life <= 0 || (dr.vy > 0 && dr.y >= dr.floor)) this.droplets.splice(d, 1);
    }

    // 2. Draw Sparks
    for (let s = this.hitParticles.length - 1; s >= 0; s--) {
      const pt = this.hitParticles[s];
      pt.x += pt.vx;
      pt.y += pt.vy;
      if (pt.g) { pt.vy += pt.g; pt.vx *= 0.96; }
      pt.life--;
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
      if (pt.life <= 0) this.hitParticles.splice(s, 1);
    }

    // 2a. Effect animations (bites, claws, slashes)
    for (let k = this.sprites.length - 1; k >= 0; k--) {
      const sp = this.sprites[k];
      drawFx(ctx, sp.name, Math.floor(sp.t / sp.every), sp.x, sp.y, { ...sp.o, once: true });
      if (++sp.t >= sp.n * sp.every) this.sprites.splice(k, 1);
    }

    // 2b. Shockwave rings (deaths, heavy blows)
    for (let r = this.rings.length - 1; r >= 0; r--) {
      const ring = this.rings[r];
      ring.life--;
      const k = 1 - ring.life / ring.maxLife;
      const rad = ring.r + (ring.max - ring.r) * k;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - k) * 0.8;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = Math.max(0.5, 2 * (1 - k));
      ctx.beginPath();
      ctx.ellipse(ring.x, ring.y, rad, rad * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      if (ring.life <= 0) this.rings.splice(r, 1);
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
      pop.vy *= 0.97;
      pop.alpha -= 0.025;
      if (pop.scale > 1) pop.scale = Math.max(1, pop.scale - 0.12);

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, pop.alpha * 1.6));
      ctx.translate(pop.x, pop.y);
      ctx.scale(pop.scale || 1, pop.scale || 1);
      ctx.translate(-pop.x, -pop.y);
      ctx.font = pop.isCrit ? "bold 9px monospace" : "bold 7px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#000000";
      ctx.fillText(pop.text, pop.x + 1, pop.y + 1);
      ctx.fillText(pop.text, pop.x - 1, pop.y - 1);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, pop.x, pop.y);
      if (pop.label) {
        ctx.font = "bold 6px monospace";
        ctx.fillStyle = "#000000";
        ctx.fillText(pop.label, pop.x + 1, pop.y - 8);
        ctx.fillStyle = "#ffea00";
        ctx.fillText(pop.label, pop.x, pop.y - 9);
      }
      ctx.restore();

      if (pop.alpha <= 0) this.damagePopups.splice(d, 1);
    }
  }

  // Visual overlays on enemies (Target Lock, Freeze, Stun)
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

    // B. STUN EFFECT (dizzy stars halo over the head)
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

    // C. FREEZE AURA (frozen ground at the feet)
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
    this.hitStopFrames = 0;
    this.hitStopRest = 0;
    this.rings = [];
    this.damagePopups = [];
    this.hitParticles = [];
    this.bloodSplats = [];
    this.burnFlames = [];
    this.freezeShards = [];
    this.sprites = [];
    this.droplets = [];
    this.ripples = [];
  }
}