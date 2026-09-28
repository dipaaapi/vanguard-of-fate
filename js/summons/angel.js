import { Sound } from "../audio.js";
import { Avatar } from "../avatar/avatar.js";
import { facingFrom } from "../avatar/creature.js";

// Angel: modular Avatar with wings, halo, white gown and a sword
const ANGEL = new Avatar({
  body: "female", skin: "#ffe8d6", eyes: "#2f6db5", hairStyle: "long", hairColor: "#ece0b8",
  outfit: "gown", outfitColor: "#ffffff", legColor: "#ffffff", gloves: "none", legs: "pants",
  boots: "sandals", bootColor: "#e0b44c", headgear: "halo", wings: "#ffffff", weapon: "sword"
});

export class GuardianAngelCompanion {
  constructor(x, y, maxHp) {
    this.id = Math.random();
    this.x = x;
    this.y = y;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.lifespan = 720;     // 12s standard lifespan
    this.maxLifespan = 1080; // Can be extended with Heal (J)
    this.damage = 18;

    this.state = "HOVERING"; // HOVERING, ATTACKING, TAUNTING
    this.stateTimer = 0;
    this.tauntCooldown = 380 + Math.floor(Math.random() * 260);

    this.attackCooldown = 0;
    this.animTimer = 0;
    this.isAlive = true;

    // Direction/animation (from the actual movement or the foe being struck)
    this.dir = "down";
    this.flip = false;
    this.moving = false;
    this.aimX = 0;
    this.aimY = 0;
  }

  update(player, enemyManager, fx, lootManager, idx, isInBarracks) {
    const ox = this.x, oy = this.y;
    this.step(player, enemyManager, fx, lootManager, idx, isInBarracks);
    const dx = this.x - ox, dy = this.y - oy;
    this.moving = Math.hypot(dx, dy) > 0.3;
    const f = this.state === "ATTACKING" ? facingFrom(this.aimX, this.aimY, this)
      : this.moving ? facingFrom(dx, dy, this) : this;
    this.dir = f.dir;
    this.flip = f.flip;
  }

  step(player, enemyManager, fx, lootManager, idx, isInBarracks) {
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
        this.aimX = tdx;
        this.aimY = tdy;

        if (Sound && Sound.playSlash) Sound.playSlash(this.x, this.y);
        enemyManager.damage(enemyTarget, this.damage, Math.atan2(tdy, tdx), false, fx, lootManager, 12, false, player, "holy");
        if (fx && fx.spawnHitSparks) fx.spawnHitSparks(enemyTarget.x + 10, enemyTarget.y + 10, "#ffd166", 14);
      }
    } else {
      // Back beside the Priest
      this.x += (flankX - this.x) * 0.1;
      this.y += (flankY - this.y) * 0.1;

      // Random taunt check while standing still
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

  draw(ctx) {
    ctx.save();
    const ax = Math.floor(this.x);
    const ay = Math.floor(this.y);

    // Holy Mist Contact Shadow
    ctx.fillStyle = "rgba(0, 240, 255, 0.25)";
    ctx.beginPath();
    ctx.ellipse(ax + 16, ay + 36, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Floating: the feet hover above the shadow, bobbing slightly
    const hover = Math.round(Math.sin(this.animTimer / 12) * 1.5);
    let anim = "idle", frame = Math.floor(this.animTimer / 10);   // idle: slow wing beats
    if (this.state === "ATTACKING") { anim = "attack"; frame = this.stateTimer < 6 ? 0 : 1; }
    else if (this.state === "TAUNTING") { anim = "attack"; frame = 0; }          // sword raised
    else if (this.moving) { anim = "walk"; frame = Math.floor(this.animTimer / 5); }
    ANGEL.draw(ctx, ax + 16, ay + 29 + hover, this.dir, anim, frame, this.flip);

    // HP and LIFESPAN BARS (above the halo)
    const barW = 24;
    const hpRatio = Math.max(0, Math.min(1, this.hp / this.maxHp));
    const lifeRatio = Math.max(0, Math.min(1, this.lifespan / this.maxLifespan));

    ctx.fillStyle = "#111111";
    ctx.fillRect(ax + 4, ay - 14, barW, 3.5);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(ax + 4, ay - 14, Math.round(hpRatio * barW), 3.5);

    ctx.fillStyle = "#111111";
    ctx.fillRect(ax + 4, ay - 9.5, barW, 2);
    ctx.fillStyle = "#00f0ff";
    ctx.fillRect(ax + 4, ay - 9.5, Math.round(lifeRatio * barW), 2);

    ctx.restore();
  }
}