import { Sound } from "../audio.js";

export class GuardianAngelCompanion {
  constructor(x, y, maxHp) {
    this.id = Math.random();
    this.x = x;
    this.y = y;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.lifespan = 720;     // 12s standard lifespan[cite: 14]
    this.maxLifespan = 1080; // Pwedeng ma-extend gamit ang Heal (J)[cite: 14]
    this.damage = 18;

    this.state = "HOVERING"; // HOVERING, ATTACKING, TAUNTING
    this.stateTimer = 0;
    this.tauntCooldown = 380 + Math.floor(Math.random() * 260);

    this.attackCooldown = 0;
    this.animTimer = 0;
    this.isAlive = true;
  }

  update(player, enemyManager, fx, lootManager, idx, isInBarracks) {
    this.animTimer++;
    this.stateTimer++;
    this.lifespan--;

    if (this.lifespan <= 0 || this.hp <= 0) {
      this.isAlive = false;
      if (fx && fx.spawnHitSparks) fx.spawnHitSparks(this.x + 16, this.y + 16, "#ffffff", 18);
      return;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;

    // 1. RANDOM TAUNT ANIMATION (Divine Blade Raise & Prayer Glow)
    if (this.state === "TAUNTING") {
      if (this.stateTimer > 80) {
        this.state = "HOVERING";
        this.tauntCooldown = 420 + Math.floor(Math.random() * 320);
      }
      return;
    }

    // 2. COMBAT TARGETING
    const enemyTarget = enemyManager.enemies
      .filter((e) => e.isAlive)
      .sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y))[0] || null;

    const flankX = player.x + (idx === 0 ? -32 : 32);
    const flankY = player.y - 14 + Math.sin(Date.now() / 220) * 4;

    if (enemyTarget && Math.hypot(enemyTarget.x - this.x, enemyTarget.y - this.y) < 200 && !isInBarracks) {
      const tdx = enemyTarget.x - this.x;
      const tdy = enemyTarget.y - this.y;
      const dist = Math.hypot(tdx, tdy);

      if (dist > 20) {
        this.x += (tdx / dist) * 1.8;
        this.y += (tdy / dist) * 1.8;
        this.state = "HOVERING";
      } else if (this.attackCooldown <= 0) {
        // SWORD ATTACK STRIKE
        this.state = "ATTACKING";
        this.stateTimer = 0;
        this.attackCooldown = 52;

        if (Sound && Sound.playSlash) Sound.playSlash();
        enemyManager.damage(enemyTarget, this.damage, Math.atan2(tdy, tdx), false, fx, lootManager, 12, false, player);
        if (fx && fx.spawnHitSparks) fx.spawnHitSparks(enemyTarget.x + 10, enemyTarget.y + 10, "#ffd166", 14);
      }
    } else {
      // Balik sa tabi ng Priest
      this.x += (flankX - this.x) * 0.1;
      this.y += (flankY - this.y) * 0.1;

      // Random Taunt Check kapag nakatigil
      this.tauntCooldown--;
      if (this.tauntCooldown <= 0 && this.state !== "ATTACKING") {
        this.state = "TAUNTING";
        this.stateTimer = 0;
        if (fx && fx.spawnDamagePopup) {
          fx.spawnDamagePopup(this.x + 14, this.y - 10, "FOR THE LIGHT! ⚔️", false, "#00f0ff");
        }
      }
    }

    if (this.state === "ATTACKING" && this.stateTimer > 20) {
      this.state = "HOVERING";
    }
  }

  // 64x64 HIGH-FIDELITY RENDERER
  draw(ctx) {
    ctx.save();
    const ax = Math.floor(this.x);
    const ay = Math.floor(this.y);

    // Holy Mist Contact Shadow
    ctx.fillStyle = "rgba(0, 240, 255, 0.25)";
    ctx.beginPath();
    ctx.ellipse(ax + 16, ay + 36, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const wingFlap = Math.floor(this.animTimer / 5) % 2 === 0;

    // 1. Golden Glowing Halo with Radial Aura
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(ax + 16, ay + 2, 9, 3.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. 64x64 FLAPPING FEATHERED WINGS
    ctx.fillStyle = "#ffffff";
    if (this.state === "TAUNTING") {
      // High Arch Wings (Taunt Stance)
      ctx.fillRect(ax - 6, ay - 6, 8, 22);
      ctx.fillRect(ax + 26, ay - 6, 8, 22);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(ax - 9, ay - 3, 5, 14);
      ctx.fillRect(ax + 32, ay - 3, 5, 14);
    } else if (wingFlap) {
      // Wings High
      ctx.fillRect(ax - 4, ay - 1, 7, 20);
      ctx.fillRect(ax + 25, ay - 1, 7, 20);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(ax - 7, ay + 3, 5, 13);
      ctx.fillRect(ax + 30, ay + 3, 5, 13);
    } else {
      // Wings Low
      ctx.fillRect(ax - 7, ay + 8, 9, 11);
      ctx.fillRect(ax + 26, ay + 8, 9, 11);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(ax - 10, ay + 11, 5, 9);
      ctx.fillRect(ax + 33, ay + 11, 5, 9);
    }

    // 3. Head & Robes (Seraph Vestments)
    ctx.fillStyle = "#ffe8d6"; // Face
    ctx.fillRect(ax + 13, ay + 6, 7, 7);

    ctx.fillStyle = "#ffffff"; // Silk Gown
    ctx.fillRect(ax + 10, ay + 13, 13, 19);
    ctx.fillStyle = "#d9e2ec"; // Shadow folds
    ctx.fillRect(ax + 11, ay + 26, 11, 6);

    ctx.fillStyle = "#ffd166"; // Gold Scapular Trim
    ctx.fillRect(ax + 14, ay + 13, 5, 18);

    // 4. DIVINE SWORD (ATTACK, TAUNT, o IDLE)
    if (this.state === "ATTACKING") {
      // Slash Swing Pose
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ax + 22, ay + 16, 20, 4);
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(ax + 22, ay + 13, 3, 10);
    } else if (this.state === "TAUNTING") {
      // Upright Raised Holy Sword
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ax + 21, ay - 10, 4, 22);
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(ax + 18, ay + 4, 10, 3);
    } else {
      // Standard Sheathed / Held Stance
      ctx.fillStyle = "#b5c4d4";
      ctx.fillRect(ax + 23, ay + 10, 3, 22);
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(ax + 20, ay + 20, 9, 3);
    }

    // 5. HP at LIFESPAN BARS
    const barW = 24;
    const hpRatio = Math.max(0, Math.min(1, this.hp / this.maxHp));
    const lifeRatio = Math.max(0, Math.min(1, this.lifespan / this.maxLifespan));

    ctx.fillStyle = "#111111";
    ctx.fillRect(ax + 4, ay - 9, barW, 3.5);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(ax + 4, ay - 9, Math.round(hpRatio * barW), 3.5);

    ctx.fillStyle = "#111111";
    ctx.fillRect(ax + 4, ay - 4.5, barW, 2);
    ctx.fillStyle = "#00f0ff";
    ctx.fillRect(ax + 4, ay - 4.5, Math.round(lifeRatio * barW), 2);

    ctx.restore();
  }
}