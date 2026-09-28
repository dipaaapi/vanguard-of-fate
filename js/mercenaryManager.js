import { AxeMercenary } from "./mercenary/axe.js";
import { WandMercenary } from "./mercenary/wand.js";
import { CrossbowMercenary } from "./mercenary/crossbow.js";
import { GreatswordMercenary } from "./mercenary/greatsword.js";
import { Sound } from "./audio.js";
import { Avatar } from "./avatar/avatar.js";
import { facingFrom } from "./avatar/creature.js";

// Isang Avatar bawat uri ng mercenary (naka-cache ang mga frame)
const AVATARS = {};
const avatarOf = (data) => AVATARS[data.type] || (AVATARS[data.type] = new Avatar(data.look));

const MERC_CLASSES = {
  axe: AxeMercenary,
  wand: WandMercenary,
  crossbow: CrossbowMercenary,
  greatsword: GreatswordMercenary
};

export class MercenaryManager {
  constructor() {
    this.mercenaries = [];
  }

  // Bayad sa kontrata: tumataas kasabay ng level (mas malakas din ang mercenary)
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
    // Lakas ayon sa level ng bayani: HP at pinsala
    const power = (1 + (player.level - 1) * 0.06) * (mercData.powerBonus || 1);
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
      cds: {},          // cooldown ng bawat skill (tingnan ang mercenary/*.js)
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
      attackAnim: 0,    // ipinapakita ang atake (windup → tama)
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

      // 1. Kapag ubos na ang buhay o kontrata, mawawala at hindi na babalik
      if (m.lifespan <= 0 || m.hp <= 0) {
        m.isAlive = false;
        if (fx && fx.spawnHitSparks) fx.spawnHitSparks(m.x + 8, m.y + 8, "#999999", 14);
        if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(m.x + 8, m.y - 6, m.hp <= 0 ? `${m.data.name} FELL!` : "CONTRACT EXPIRED!", false);
        this.mercenaries.splice(i, 1);
        continue;
      }

      // Guardian Aura ng Vanguard Knight
      if (m.data.guardAura && Math.hypot(pX - m.x, pY - m.y) < 80) player.mercGuard = 0.85;

      // Mga skill ng mercenary (hindi sa loob ng sanctuary)
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

  // Direksyon at animation batay sa aktwal na galaw (o sa tinututukan kapag umaatake)
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

  // Ang pinsala ng mercenary ay pinalalaki ng lakas nito (power, batay sa level ng bayani)
  scaled(m, enemyManager) {
    return { damage: (e, amount, ...rest) => enemyManager.damage(e, Math.round(amount * (m.power || 1)), ...rest) };
  }

  // Ang palaso/bola ng mercenary ay may sariling lakas (hindi ginagamit ang stats ng bayani)
  ownShots(m, spawnProj) {
    return (q) => spawnProj && spawnProj({ ...q, merc: true, power: m.power || 1 });
  }

  // AI ng isang mercenary bawat frame (sumunod, pulutin ang loot, lumaban)
  step(m, pX, pY, enemyManager, lootManager, fx, spawnProj, stage) {
      const distToPlayer = Math.hypot(pX - m.x, pY - m.y);

      // SPRINT CHECK: Kapag lumalayo ang player, mag-sprint para makasabay
      m.isSprinting = distToPlayer > 60;
      const baseSpeed = m.data.speed * (m.isSprinting ? 1.75 : 1.0);

      // ========================================================
      // LEASH RULE: Kapag lumagpas sa 80px ang Player, PRIORIDAD ANG PANGHAHABOL
      // ========================================================
      if (distToPlayer > 80) {
        const dx = pX - m.x;
        const dy = pY - m.y;
        m.x += (dx / distToPlayer) * baseSpeed;
        m.y += (dy / distToPlayer) * baseSpeed;
        m.facing = dx >= 0 ? "right" : "left";
        return; // Ipagpaliban muna ang loot at combat para hindi maiwan
      }

      // 2. AUTOLOOT: Pupulutin ang Herbs at Shards (HINDI Coins) kung malapit lang sa Player
      let targetLoot = null;
      if (lootManager && lootManager.items) {
        for (const item of lootManager.items) {
          if (item.type !== "gold") {
            const d = Math.hypot(item.x - m.x, item.y - m.y);
            const dFromPlayer = Math.hypot(item.x - pX, item.y - pY);
            // Kukunin lang kung hindi lalayo nang higit 70px sa Player
            if (d < 50 && dFromPlayer < 75) {
              targetLoot = item;
              break;
            }
          }
        }
      }

      // 3. COMBAT: Labanan ang pinakamalapit na kalaban na malapit sa Player
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
        // Kunin ang loot item
        const dx = targetLoot.x - m.x;
        const dy = targetLoot.y - m.y;
        const d = Math.hypot(dx, dy);
        if (d > 4) {
          m.x += (dx / d) * baseSpeed;
          m.y += (dy / d) * baseSpeed;
        }
      } else if (closestEnemy && !(stage && stage.isInsideSafeZone(m.x, m.y))) {
        // Labanan ang kalaban
        const dx = closestEnemy.x - m.x;
        const dy = closestEnemy.y - m.y;
        m.facing = dx >= 0 ? "right" : "left";
        m.aimAngle = Math.atan2(dy, dx);

        if (closestDist > m.data.attackRange) {
          m.x += (dx / closestDist) * baseSpeed;
          m.y += (dy / closestDist) * baseSpeed;
        } else {
          // Normal Attack Trigger
          if (m.attackCooldown <= 0) {
            m.attackCooldown = m.data.attackCooldownMax;
            m.attackAnim = 16;
            m.data.onAttack(m, closestEnemy, this.scaled(m, enemyManager), fx, this.ownShots(m, spawnProj));
          }
          // Special Skill Trigger
          if (m.skillCooldown <= 0) {
            m.skillCooldown = m.data.skillCooldownMax;
            m.data.onSkill(m, enemies, this.scaled(m, enemyManager), fx, this.ownShots(m, spawnProj));
          }
        }
      } else {
        // NATURAL FLANKING: Sumunod at tumayo sa tabi ng Player (24 - 32px allowance)
        if (distToPlayer > 30) {
          const dx = pX - m.x;
          const dy = pY - m.y;
          m.x += (dx / distToPlayer) * baseSpeed;
          m.y += (dy / distToPlayer) * baseSpeed;
          m.facing = dx >= 0 ? "right" : "left";
        }
      }
  }

  draw(ctx) {
    this.mercenaries.forEach((m) => {
      if (!m.isAlive) return;

      // Contact Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.beginPath();
      ctx.ellipse(m.x + 8, m.y + 14, 7, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Modular Avatar: ang paa ay nasa (x + 8, y + 15)
      avatarOf(m.data).draw(ctx, m.x + 8, m.y + 15, m.dir, m.anim, this.frameOf(m), m.flip, m.hitTimer > 0);

      // HP Bar (sa itaas ng ulo)
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