import { Sound } from "../audio.js";
import { around, mix, hitPose, attackPose, drawSwing } from "../juice.js";
import { Avatar } from "../avatar/avatar.js";
import { facingFrom } from "../avatar/creature.js";
import { autoSummonLoot, summonAutoEnabled, summonThreat } from "./automation.js";

// Angel: modular Avatar with wings, halo, white gown and a sword
export const ANGEL = new Avatar({
  body: "female", skin: "#ffe8d6", eyes: "#2f6db5", hairStyle: "long", hairColor: "#ece0b8",
  outfit: "gown", outfitColor: "#ffffff", legColor: "#ffffff", gloves: "none", legs: "pants",
  boots: "sandals", bootColor: "#e0b44c", headgear: "halo", wings: "#ffffff", weapon: "sword"
});
ANGEL.sheetKey = "summon/angel";   // aseprite/summon/angel.aseprite when exported
ANGEL.style = "tile";              // code fallback in the terrain tile style (js/avatar/tilestyle.js)

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
    // Ship crew: hovers over the deck (feet at the post) and can't leave the ship while the crew is aboard
    this.flying = true;
    this.footX = 16;
    this.footY = 29;
    this.aboard = false;
  }

  update(player, enemyManager, fx, lootManager, idx, isInBarracks) {
    const ox = this.x, oy = this.y;
    const hp0 = this.hp;
    this.step(player, enemyManager, fx, lootManager, idx, isInBarracks);
    if (this.hp < hp0) this.hurtT = 12;          // recoil when struck
    else if (this.hurtT > 0) this.hurtT--;
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
    if (autoSummonLoot(this, player, enemyManager, lootManager, fx, enemyManager.stage, { x: 16, y: 29, fly: true, speed: 1.8 })) return;

    // 1. RANDOM TAUNT ANIMATION (Divine Blade Raise & Prayer Glow)
    if (this.state === "TAUNTING") {
      if (this.stateTimer > 80) {
        this.state = "HOVERING";
        this.tauntCooldown = 420 + Math.floor(Math.random() * 320);
      }
      return;
    }

    // 2. COMBAT TARGETING
    const enemyTarget = (summonAutoEnabled(player) ? summonThreat(player, enemyManager.enemies, 200) : null) || enemyManager.enemies
      .filter((e) => e.isAlive)
      .sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y))[0] || null;

    const flankX = player.x + (idx === 0 ? -32 : 32);
    const flankY = player.y - 14 + Math.sin(Date.now() / 220) * 4;

    if (enemyTarget && Math.hypot(enemyTarget.x - this.x, enemyTarget.y - this.y) < 200 && !isInBarracks) {
      const tdx = enemyTarget.x - this.x;
      const tdy = enemyTarget.y - this.y;
      const dist = Math.hypot(tdx, tdy);

      if (this.aboard && dist > 36) {
        // Aboard: holds its post and strikes only what comes alongside
      } else if (dist > 20 && !this.aboard) {
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
        if (fx && fx.spawnSprite) fx.spawnSprite("slash", enemyTarget.x + 10, enemyTarget.y + 10, { tint: "#ffd166", rot: Math.atan2(tdy, tdx), every: 2 });
      }
    } else {
      // Back beside the Priest (aboard, the ship keeps it at its post)
      if (!this.aboard) {
        this.x += (flankX - this.x) * 0.1;
        this.y += (flankY - this.y) * 0.1;
      }

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

    // Holy Mist Contact Shadow (not over the ship's sails)
    if (!this.aboard) {
      ctx.fillStyle = "rgba(0, 240, 255, 0.25)";
      ctx.beginPath();
      ctx.ellipse(ax + 16, ay + 36, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating: the feet hover above the shadow, bobbing slightly
    const hover = Math.round(Math.sin(this.animTimer / 12) * 1.5);
    let anim = "idle", frame = Math.floor(this.animTimer / 10);   // idle: slow wing beats
    if (this.state === "ATTACKING") {
      anim = "attack";
      const n = ANGEL.count(this.dir, "attack");
      frame = n <= 2 ? (this.stateTimer < 6 ? 0 : 1) : Math.min(n - 1, Math.floor(this.stateTimer / 5));
    } else if (this.state === "TAUNTING") {
      // sword raised; a sheet's "skill" plays the prayer glow over the 80-frame taunt
      if (ANGEL.has("skill", this.dir)) { anim = "skill"; frame = Math.min(ANGEL.count(this.dir, "skill") - 1, Math.floor(this.stateTimer / 12)); }
      else { anim = "attack"; frame = 0; }
    }
    else if (this.moving) { anim = "walk"; frame = Math.floor(this.animTimer / 5); }
    // The blow lands on the first frame, so the pose starts at the strike and follows through
    const len = Math.hypot(this.aimX || 0, this.aimY || 0) || 1;
    const adx = (this.aimX || 0) / len, ady = (this.aimY || 0) / len;
    const p = this.state === "ATTACKING" ? 0.35 + 0.65 * Math.min(1, this.stateTimer / 20) : 0;
    const pose = mix(hitPose(this.hurtT || 0, 12, this.flip ? -1 : 1), attackPose(p, adx, ady, 4));
    const fy = ay + 29 + hover;
    around(ctx, ax + 16, fy, pose, () => ANGEL.draw(ctx, ax + 16, fy, this.dir, anim, frame, this.flip));
    if (p) drawSwing(ctx, ax + 16, fy - 12, Math.atan2(ady, adx), 15, (p - 0.35) / 0.65, "#ffd166", 2.4, 3);

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
