import { AxeMercenary } from "./mercenary/axe.js";
import { WandMercenary } from "./mercenary/wand.js";
import { CrossbowMercenary } from "./mercenary/crossbow.js";
import { GreatswordMercenary } from "./mercenary/greatsword.js";
import { Sound } from "./audio.js";

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

  hire(type, player, fx) {
    const mercData = MERC_CLASSES[type];
    if (!mercData) return false;

    // 10 Coins ang bayad sa kontrata
    if (player.gold < 10) {
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 8, player.y - 8, "NEED 10 GOLD!", false);
      return false;
    }

    player.gold -= 10;
    if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();

    const merc = {
      id: Math.random(),
      data: mercData,
      x: player.x + (Math.random() * 24 - 12),
      y: player.y + (Math.random() * 24 - 12),
      hp: mercData.maxHp,
      maxHp: mercData.maxHp,
      lifespan: 36000, // 10 Minuto (60 fps * 600s)
      maxLifespan: 36000,
      attackCooldown: 0,
      skillCooldown: 60,
      isSprinting: false,
      facing: "right",
      aimAngle: 0,
      animTimer: 0,
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

    for (let i = this.mercenaries.length - 1; i >= 0; i--) {
      const m = this.mercenaries[i];
      m.lifespan--;

      // 1. Kapag ubos na ang buhay o kontrata, mawawala at hindi na babalik
      if (m.lifespan <= 0 || m.hp <= 0) {
        m.isAlive = false;
        if (fx && fx.spawnHitSparks) fx.spawnHitSparks(m.x + 8, m.y + 8, "#999999", 14);
        if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(m.x + 8, m.y - 6, "CONTRACT EXPIRED!", false);
        this.mercenaries.splice(i, 1);
        continue;
      }

      if (m.attackCooldown > 0) m.attackCooldown--;
      if (m.skillCooldown > 0) m.skillCooldown--;
      m.animTimer++;

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
        continue; // Ipagpaliban muna ang loot at combat para hindi maiwan
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
            m.data.onAttack(m, closestEnemy, enemyManager, fx, spawnProj);
          }
          // Special Skill Trigger
          if (m.skillCooldown <= 0) {
            m.skillCooldown = m.data.skillCooldownMax;
            m.data.onSkill(m, enemies, enemyManager, fx, spawnProj);
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
  }

  draw(ctx, drawMatrixFn) {
    this.mercenaries.forEach((m) => {
      if (!m.isAlive) return;

      // Contact Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.beginPath();
      ctx.ellipse(m.x + 8, m.y + 14, 7, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mercenary Sprite Render
      ctx.save();
      if (m.facing === "left") {
        ctx.translate(Math.floor(m.x) + 14, Math.floor(m.y));
        ctx.scale(-1, 1);
        drawMatrixFn(ctx, 0, 0, m.data.sprites.idle[0]);
      } else {
        drawMatrixFn(ctx, m.x, m.y, m.data.sprites.idle[0]);
      }
      ctx.restore();

      // HP Bar
      const w = 16;
      ctx.fillStyle = "#111";
      ctx.fillRect(m.x, m.y - 7, w, 2.5);
      ctx.fillStyle = m.data.color;
      ctx.fillRect(m.x, m.y - 7, Math.max(0, (m.hp / m.maxHp) * w), 2.5);

      // Cyan Remaining Contract Time Bar (10 Minutes)
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(m.x, m.y - 4, Math.max(0, (m.lifespan / m.maxLifespan) * w), 1.5);
    });
  }
}