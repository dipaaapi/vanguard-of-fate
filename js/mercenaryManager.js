import { AxeMercenary } from "./mercenary/axe.js";
import { around, mix, hitPose, attackPose, breathPose, drawSwing } from "./juice.js";
import { WandMercenary } from "./mercenary/wand.js";
import { CrossbowMercenary } from "./mercenary/crossbow.js";
import { GreatswordMercenary } from "./mercenary/greatsword.js";
import { Sound } from "./audio.js";
import { Avatar } from "./avatar/avatar.js";
import { facingFrom } from "./avatar/creature.js";

// One Avatar per mercenary type (frames are cached)
const AVATARS = {};
const avatarOf = (data) => AVATARS[data.type] || (AVATARS[data.type] = new Avatar(data.look));

// How long a mercenary stays dazed before getting back up (15 seconds at 60 fps)
const KO_TIME = 900;

export const MERC_CLASSES = {
  axe: AxeMercenary,
  wand: WandMercenary,
  crossbow: CrossbowMercenary,
  greatsword: GreatswordMercenary
};

export class MercenaryManager {
  constructor() {
    this.mercenaries = [];
  }

  // Contract fee: rises with level (the mercenary is stronger too)
  static cost(level) {
    return 10 + level * 3;
  }

  hire(type, player, fx) {
    const mercData = MERC_CLASSES[type];
    if (!mercData) return false;

    const cost = MercenaryManager.cost(player.level);
    if (player.gold < cost) {
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 8, player.y - 8, `NEED ${cost} GOLD!`, false);
      return false;
    }

    player.gold -= cost;
    // Strength from the hero's level: HP and damage
    // Scales with same-level monster HP (35 + 12 × level): a basic hit stays ~17% of a foe at every level,
    // so mercenaries neither steal every kill early nor fade out late.
    const power = ((35 + 12 * player.level) / 47) * 0.35 * (mercData.powerBonus || 1);
    const maxHp = Math.round(mercData.maxHp * (1 + (player.level - 1) * 0.1));
    if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();

    const merc = {
      id: Math.random(),
      data: mercData,
      x: player.x + (Math.random() * 24 - 12),
      y: player.y + (Math.random() * 24 - 12),
      hp: maxHp,
      maxHp,
      power,
      cds: {},          // cooldown of each skill (see mercenary/*.js)
      hitTimer: 0,
      lifespan: 36000, // 10 Minuto (60 fps * 600s)
      maxLifespan: 36000,
      attackCooldown: 0,
      skillCooldown: 60,
      isSprinting: false,
      facing: "right",
      aimAngle: 0,
      animTimer: 0,
      anim: "idle",     // idle | walk | run | attack
      dir: "down",
      flip: false,
      attackAnim: 0,    // shows the attack (windup → hit)
      isAlive: true
    };

    this.mercenaries.push(merc);
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(merc.x, merc.y - 10, `${mercData.name} HIRED!`, true, "#ffd166");
    return true;
  }

  update(player, enemyManager, lootManager, fx, spawnProj, stage) {
    if (!player) return;

    const pX = player.x;
    const pY = player.y;
    player.mercGuard = 1;

    for (let i = this.mercenaries.length - 1; i >= 0; i--) {
      const m = this.mercenaries[i];
      m.lifespan--;
      if (m.hitTimer > 0) m.hitTimer--;

      // 1. Contract over: the mercenary leaves for good
      if (m.lifespan <= 0) {
        m.isAlive = false;
        if (fx && fx.spawnHitSparks) fx.spawnHitSparks(m.x + 8, m.y + 8, "#999999", 14);
        if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(m.x + 8, m.y - 6, "CONTRACT EXPIRED!", false);
        this.mercenaries.splice(i, 1);
        continue;
      }

      // 2. Knockout: only dazed (neither attacks nor is attacked) until the cooldown ends,
      //    then gets back up at full HP. isAlive = false makes enemies ignore it.
      if (m.downed > 0) {
        m.downed--;
        m.animTimer++;
        if (m.downed === 0) {
          m.hp = m.maxHp;
          m.isAlive = true;
          if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();
          if (fx && fx.spawnHitSparks) fx.spawnHitSparks(m.x + 8, m.y + 4, "#4ade80", 16);
          if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(m.x + 8, m.y - 10, `${m.data.name} IS BACK!`, true, "#4ade80");
        }
        continue;
      }
      if (m.hp <= 0) {
        m.hp = 0;
        m.isAlive = false;
        m.downed = KO_TIME;
        m.attackAnim = 0;
        m.anim = "idle";
        m.animTimer = 0;
        if (fx && fx.spawnHitSparks) fx.spawnHitSparks(m.x + 8, m.y + 8, "#999999", 14);
        if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(m.x + 8, m.y - 6, `${m.data.name} IS DOWN!`, false, "#ef4444");
        continue;
      }

      // The Vanguard Knight's Guardian Aura
      if (m.data.guardAura && Math.hypot(pX - m.x, pY - m.y) < 80) player.mercGuard = 0.85;

      // Mercenary skills (not inside a sanctuary)
      if (m.data.skills && enemyManager && !(stage && stage.isInsideSafeZone(m.x, m.y))) {
        const foes = enemyManager.enemies.filter((e) => e.isAlive && Math.hypot(e.x - m.x, e.y - m.y) < 150);
        const c = { player, foes, em: this.scaled(m, enemyManager), fx: fx || {}, spawn: spawnProj };
        m.data.skills.forEach((s) => {
          if ((m.cds[s.id] || 0) > 0) { m.cds[s.id]--; return; }
          if (s.ready(m, c)) {
            s.use(m, c);
            m.cds[s.id] = s.cd;
            m.attackAnim = 16;
          }
        });
      }

      if (m.attackCooldown > 0) m.attackCooldown--;
      if (m.skillCooldown > 0) m.skillCooldown--;

      const ox = m.x, oy = m.y;
      this.step(m, pX, pY, enemyManager, lootManager, fx, spawnProj, stage);
      this.animate(m, m.x - ox, m.y - oy);
    }
  }

  // Normal attack and special skill, each on its own cooldown
  strike(m, foe, enemies, enemyManager, fx, spawnProj) {
    if (m.attackCooldown <= 0) {
      m.attackCooldown = m.data.attackCooldownMax;
      m.attackAnim = 16;
      m.data.onAttack(m, foe, this.scaled(m, enemyManager), fx, this.ownShots(m, spawnProj));
    }
    if (m.skillCooldown <= 0) {
      m.skillCooldown = m.data.skillCooldownMax;
      m.data.onSkill(m, enemies, this.scaled(m, enemyManager), fx, this.ownShots(m, spawnProj));
    }
  }

  // Direction and animation from the actual movement (or the target while attacking)
  animate(m, dx, dy) {
    const moved = Math.hypot(dx, dy) > 0.05;
    if (m.attackAnim > 0) {
      m.attackAnim--;
      const f = facingFrom(Math.cos(m.aimAngle), Math.sin(m.aimAngle), m);
      m.dir = f.dir; m.flip = f.flip;
    } else if (moved) {
      const f = facingFrom(dx, dy, m);
      m.dir = f.dir; m.flip = f.flip;
    }
    const anim = m.attackAnim > 0 ? "attack" : moved ? (m.isSprinting ? "run" : "walk") : "idle";
    if (anim !== m.anim) { m.anim = anim; m.animTimer = 0; }
    m.animTimer++;
  }

  frameOf(m) {
    if (m.anim === "attack") return m.attackAnim > 10 ? 0 : 1;
    return Math.floor(m.animTimer / ({ walk: 9, run: 5 }[m.anim] || 30));
  }

  // Mercenary damage is scaled by its power (from the hero's level at hire)
  scaled(m, enemyManager) {
    return { damage: (e, amount, ...rest) => enemyManager.damage(e, Math.round(amount * (m.power || 1)), ...rest) };
  }

  // A mercenary's arrows/bolts carry their own power (the hero's stats are not used)
  ownShots(m, spawnProj) {
    return (q) => spawnProj && spawnProj({ ...q, merc: true, power: m.power || 1 });
  }

  // One mercenary's AI per frame (follow, pick up loot, fight)
  step(m, pX, pY, enemyManager, lootManager, fx, spawnProj, stage) {
      // Aboard the ship: hold the deck post (the ship carries it) and fight what comes in reach
      if (m.aboard) {
        const enemies = enemyManager ? enemyManager.enemies.filter((e) => e.isAlive) : [];
        const foe = enemies.find((e) => Math.hypot(e.x - m.x, e.y - m.y) <= m.data.attackRange);
        if (foe) {
          m.facing = foe.x >= m.x ? "right" : "left";
          m.aimAngle = Math.atan2(foe.y - m.y, foe.x - m.x);
          this.strike(m, foe, enemies, enemyManager, fx, spawnProj);
        }
        return;
      }
      const distToPlayer = Math.hypot(pX - m.x, pY - m.y);

      // SPRINT CHECK: sprint to keep up when the player moves away
      m.isSprinting = distToPlayer > 60;
      const baseSpeed = m.data.speed * (m.isSprinting ? 1.75 : 1.0);

      // ========================================================
      // LEASH RULE: beyond 80px from the player, catching up comes first
      // ========================================================
      if (distToPlayer > 80) {
        const dx = pX - m.x;
        const dy = pY - m.y;
        m.x += (dx / distToPlayer) * baseSpeed;
        m.y += (dy / distToPlayer) * baseSpeed;
        m.facing = dx >= 0 ? "right" : "left";
        return; // Skip loot and combat for now so it isn't left behind
      }

      // 2. AUTOLOOT: picks up herbs and shards (NOT coins) when close to the player
      let targetLoot = null;
      if (lootManager && lootManager.items) {
        for (const item of lootManager.items) {
          if (item.type !== "gold") {
            const d = Math.hypot(item.x - m.x, item.y - m.y);
            const dFromPlayer = Math.hypot(item.x - pX, item.y - pY);
            // Only if it doesn't stray more than 70px from the player
            if (d < 50 && dFromPlayer < 75) {
              targetLoot = item;
              break;
            }
          }
        }
      }

      // 3. COMBAT: fight the nearest foe that is close to the player
      const enemies = enemyManager ? enemyManager.enemies.filter((e) => e.isAlive) : [];
      let closestEnemy = null;
      let closestDist = Infinity;
      for (const e of enemies) {
        const d = Math.hypot(e.x - m.x, e.y - m.y);
        const dFromPlayer = Math.hypot(e.x - pX, e.y - pY);
        if (d < closestDist && dFromPlayer < 120) {
          closestDist = d;
          closestEnemy = e;
        }
      }

      if (targetLoot) {
        // Go for the loot item
        const dx = targetLoot.x - m.x;
        const dy = targetLoot.y - m.y;
        const d = Math.hypot(dx, dy);
        if (d > 4) {
          m.x += (dx / d) * baseSpeed;
          m.y += (dy / d) * baseSpeed;
        }
      } else if (closestEnemy && !(stage && stage.isInsideSafeZone(m.x, m.y))) {
        // Fight the foe
        const dx = closestEnemy.x - m.x;
        const dy = closestEnemy.y - m.y;
        m.facing = dx >= 0 ? "right" : "left";
        m.aimAngle = Math.atan2(dy, dx);

        if (closestDist > m.data.attackRange) {
          m.x += (dx / closestDist) * baseSpeed;
          m.y += (dy / closestDist) * baseSpeed;
        } else {
          this.strike(m, closestEnemy, enemies, enemyManager, fx, spawnProj);
        }
      } else {
        // NATURAL FLANKING: follow and stand beside the player (24–32px allowance)
        if (distToPlayer > 30) {
          const dx = pX - m.x;
          const dy = pY - m.y;
          m.x += (dx / distToPlayer) * baseSpeed;
          m.y += (dy / distToPlayer) * baseSpeed;
          m.facing = dx >= 0 ? "right" : "left";
        }
      }
  }

  // A dazed mercenary: sways, stars circling, and a cooldown ring over the head (red → green)
  drawDowned(ctx, m) {
    const t = m.animTimer;
    const fx = m.x + 8, fy = m.y + 15;
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(fx, m.y + 14, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(Math.sin(t / 14) * 0.18);
    ctx.globalAlpha = 0.85;
    avatarOf(m.data).draw(ctx, 0, 0, "down", "idle", 0, false, false);
    ctx.restore();

    // Stars circling above the head
    const hy = m.y - 16;
    for (let k = 0; k < 3; k++) {
      const a = t / 10 + (k * Math.PI * 2) / 3;
      const sx = Math.round(fx + Math.cos(a) * 7), sy = Math.round(hy + Math.sin(a) * 2.5);
      ctx.fillStyle = k === 0 ? "#fde047" : "#facc15";
      ctx.fillRect(sx, sy - 1, 1, 3);
      ctx.fillRect(sx - 1, sy, 3, 1);
    }

    // Cooldown ring: fills as time passes, red (0°) → green (120°)
    const p = 1 - m.downed / KO_TIME;
    const cy = m.y - 25, r = 5;
    const col = `hsl(${Math.round(p * 120)}, 85%, 55%)`;
    ctx.fillStyle = "rgba(3, 6, 17, 0.85)";
    ctx.beginPath(); ctx.arc(fx, cy, r + 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(fx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = col;
    ctx.beginPath(); ctx.arc(fx, cy, r, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
    ctx.fillStyle = col;
    ctx.font = "bold 5px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(Math.ceil(m.downed / 60)), fx, cy + 0.5);
    ctx.textBaseline = "alphabetic";
  }

  draw(ctx) {
    this.mercenaries.forEach((m) => {
      if (m.downed > 0) { this.drawDowned(ctx, m); return; }
      if (!m.isAlive) return;

      // Contact Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.beginPath();
      ctx.ellipse(m.x + 8, m.y + 14, 7, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Modular Avatar: the feet are at (x + 8, y + 15)
      // Squash & stretch: lean into each swing, recoil when struck, breathe when idle
      const p = m.attackAnim > 0 ? 1 - m.attackAnim / 16 : 0;
      const ax = Math.cos(m.aimAngle || 0), ay = Math.sin(m.aimAngle || 0);
      const pose = mix(
        hitPose(m.hitTimer, 16, m.facing === "right" ? 1 : -1),
        attackPose(p, ax, ay, m.data.attackRange < 60 ? 3 : 1.5),
        m.anim === "idle" ? breathPose(m.animTimer || 0) : null
      );
      around(ctx, m.x + 8, m.y + 15, pose, () =>
        avatarOf(m.data).draw(ctx, m.x + 8, m.y + 15, m.dir, m.anim, this.frameOf(m), m.flip, m.hitTimer > 0));
      if (p && m.data.attackRange < 60) drawSwing(ctx, m.x + 8, m.y + 6, m.aimAngle || 0, 12, (p - 0.3) / 0.7, m.data.color);

      // HP bar (above the head)
      const w = 16;
      const by = m.y - 24;
      ctx.fillStyle = "#111";
      ctx.fillRect(m.x, by, w, 2.5);
      ctx.fillStyle = m.data.color;
      ctx.fillRect(m.x, by, Math.max(0, (m.hp / m.maxHp) * w), 2.5);

      // Cyan Remaining Contract Time Bar (10 Minutes)
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(m.x, by + 3, Math.max(0, (m.lifespan / m.maxLifespan) * w), 1.5);
    });
  }
}