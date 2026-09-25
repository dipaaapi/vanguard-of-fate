import { Sound } from "./audio.js";
import { drawSpriteMatrix } from "./sprite.js";

const _ = 0;
const K = "#11141a"; // Dark Outline

// 1. ANCIENT EMERALD SLIME (Translucent jelly, lime highlights, and glowing magic nucleus)
const slimeFrames = [
  [
    [_,_,_,_,_,_,K,K,K,K,K,K,_,_,_,_,_,_],
    [_,_,_,_,K,K,"#9ef01a","#d8f3dc","#d8f3dc","#9ef01a",K,K,_,_,_,_,_],
    [_,_,_,K,"#70e000","#9ef01a","#ffffff","#d8f3dc","#9ef01a","#70e000",K,_,_,_,_],
    [_,_,K,"#70e000","#70e000","#9ef01a","#9ef01a","#70e000","#70e000","#38b000",K,_,_,_],
    [_,K,"#70e000","#38b000","#ffffff","#007200","#007200","#ffffff","#38b000","#70e000",K,_],
    [_,K,"#70e000","#38b000","#007200","#00f0ff","#00f0ff","#007200","#38b000","#70e000",K,_], // Glowing Cyan Nucleus
    [K,"#38b000","#38b000","#004b23","#00f0ff","#ffffff","#00f0ff","#004b23","#38b000","#38b000",K],
    [K,"#38b000","#004b23","#004b23","#007200","#007200","#007200","#004b23","#004b23","#38b000",K],
    [K,"#004b23","#004b23","#004b23","#004b23","#004b23","#004b23","#004b23","#004b23","#004b23",K],
    [_,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_,_]
  ],
  [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,K,K,K,K,K,K,K,_,_,_,_,_,_],
    [_,_,_,K,K,"#9ef01a","#d8f3dc","#9ef01a","#9ef01a","#9ef01a",K,K,_,_,_,_],
    [_,_,K,"#70e000","#d8f3dc","#ffffff","#9ef01a","#ffffff","#d8f3dc","#70e000",K,_,_],
    [_,K,"#70e000","#70e000","#007200","#70e000","#70e000","#007200","#70e000","#70e000",K,_],
    [K,"#70e000","#38b000","#007200","#00f0ff","#00f0ff","#007200","#38b000","#70e000",K,_],
    [K,"#38b000","#38b000","#004b23","#00f0ff","#ffffff","#004b23","#38b000","#38b000",K,_],
    [K,"#004b23","#004b23","#004b23","#007200","#007200","#004b23","#004b23","#004b23",K,_],
    [_,K,K,K,K,K,K,K,K,K,K,K,K,_,_,_,_,_]
  ]
];

// 2. SHADOW DIRE WOLF (Ferocious crimson eyes, razor fangs, and layered fur coat)
const wolfFrames = [
  [
    [_,_,_,_,_,K,K,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,K,K,"#495057",K,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,K,"#adb5bd","#6c757d",K,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,K,"#6c757d","#dee2e6","#adb5bd",K,K,K,K,K,K,_,_,_,_,_,_,_],
    [K,"#ff0055","#adb5bd","#6c757d","#495057","#343a40","#495057","#495057","#343a40",K,_,_,_,_,_,_],
    [K,"#ffffff","#495057","#343a40","#343a40","#212529","#212529","#343a40","#495057","#495057",K,_,_,_,_],
    [_,K,K,"#343a40","#212529","#212529","#212529","#212529","#212529","#343a40","#495057",K,_,_,_],
    [_,_,K,"#212529","#212529","#212529","#212529","#212529","#212529","#212529","#343a40","#212529",K,_],
    [_,_,K,"#343a40",K,"#212529",K,_,_,K,"#343a40",K,"#212529",K,_],
    [_,_,K,K,_,K,K,_,_,K,K,_,K,K,_,_]
  ],
  [
    [_,_,_,_,_,K,K,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,K,K,"#495057",K,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,K,"#adb5bd","#6c757d",K,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,K,"#6c757d","#dee2e6","#adb5bd",K,K,K,K,K,K,_,_,_,_,_,_,_],
    [K,"#ff0055","#adb5bd","#6c757d","#495057","#343a40","#495057","#495057","#343a40",K,_,_,_,_,_,_],
    [K,"#ffffff","#495057","#343a40","#343a40","#212529","#212529","#343a40","#495057","#495057",K,_,_,_,_],
    [_,K,K,"#343a40","#212529","#212529","#212529","#212529","#212529","#343a40","#495057",K,_,_,_],
    [_,_,K,"#212529","#212529","#212529","#212529","#212529","#212529","#212529","#343a40","#212529",K,_],
    [_,_,_,K,"#343a40",K,"#212529",_,_,_,K,"#343a40",K,"#212529",_],
    [_,_,_,K,K,_,K,K,_,_,_,K,K,_,K,K]
  ]
];

// 3. UNDEAD SKELETON LANCER (Ancient bone texture, spectral blue soul flame, iron pike)
const skeletonFrames = [
  [
    [_,_,_,_,_,_,K,K,K,K,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,K,"#f8f9fa","#dee2e6","#adb5bd",K,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,K,"#00f0ff",K,"#00f0ff",K,_,_,_,_,_,_,_,_], // Spectral Cyan Soul Eyes
    [_,_,_,_,_,_,K,"#dee2e6",K,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,K,"#f8f9fa","#dee2e6",K,_,_,_,_,_,_,_,_],
    [_,_,K,K,K,K,"#adb5bd","#6c757d",K,K,K,K,K,K,K,K,K,_], // Polished Iron Pike
    [_,_,_,_,_,K,"#dee2e6","#adb5bd",K,_,_,_,_,_,_,_,_],
    [_,_,_,_,K,"#dee2e6",_,K,"#adb5bd",K,_,_,_,_,_,_,_],
    [_,_,_,_,K,K,_,_,K,K,_,_,_,_,_,_,_]
  ],
  [
    [_,_,_,_,_,_,K,K,K,K,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,K,"#f8f9fa","#dee2e6","#adb5bd",K,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,K,"#00f0ff",K,"#00f0ff",K,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,K,"#dee2e6",K,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,K,"#f8f9fa","#dee2e6",K,_,_,_,_,_,_,_,_],
    [_,_,K,K,K,K,"#dee2e6","#adb5bd",K,K,K,K,K,K,K,K,K,_],
    [_,_,_,_,_,K,"#dee2e6","#adb5bd",K,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,K,"#dee2e6",K,"#adb5bd",_,_,_,_,_,_,_,_],
    [_,_,_,_,_,K,K,_,K,K,_,_,_,_,_,_,_]
  ]
];

export class EnemyManager {
  constructor(worldW, worldH) {
    this.worldW = worldW;
    this.worldH = worldH;
    this.enemies = [];
    this.spawnTimer = 0;
  }

  init(playerLevel = 1, arcIndex = 0) {
    this.enemies = [];
    for (let i = 0; i < 6; i++) {
      this.spawnRandomEnemy(playerLevel, arcIndex);
    }
  }

  spawnRandomEnemy(playerLevel, arcIndex = 0) {
    // Normal, calibrated chase speeds (0.52 to 0.72) with 12-Arc scaling
    const kinds = [
      { name: "Forest Slime", type: "slime", frames: slimeFrames, speed: 0.52, hpMult: 1.0, dmg: 8 },
      { name: "Dire Wolf", type: "wolf", frames: wolfFrames, speed: 0.72, hpMult: 1.25, dmg: 14 },
      { name: "Skeleton Lancer", type: "skeleton", frames: skeletonFrames, speed: 0.58, hpMult: 1.4, dmg: 16 }
    ];

    const pick = kinds[Math.floor(Math.random() * kinds.length)];
    const lvl = Math.max(1, playerLevel + Math.floor(Math.random() * 5) - 2);
    const arcMult = 1 + (arcIndex || 0) * 0.35;
    const arcDmgMult = 1 + (arcIndex || 0) * 0.25;

    const baseHp = Math.round((35 + lvl * 12) * pick.hpMult * arcMult);

    this.enemies.push({
      id: Math.random(),
      name: pick.name,
      type: pick.type,
      frames: pick.frames,
      animFrame: 0,
      animTimer: 0,
      x: 140 + Math.random() * (this.worldW - 280),
      y: 140 + Math.random() * (this.worldH - 280),
      level: lvl,
      maxHp: baseHp,
      hp: baseHp,
      speed: pick.speed,
      damage: Math.round((pick.dmg + lvl * 2) * arcDmgMult),
      expReward: Math.round((25 + lvl * 8) * arcMult),
      isAlive: true,
      facing: "left",
      hitTimer: 0,
      stunTimer: 0,
      windupTimer: 0,
      hpTimer: 0,
      lagHp: baseHp
    });
  }

  update(player, fx, lootManager, stage, arcIndex = 0) {
    this.spawnTimer++;
    if (this.spawnTimer > 200 && this.enemies.filter((e) => e.isAlive).length < 9) {
      this.spawnTimer = 0;
      this.spawnRandomEnemy(player.level, arcIndex);
    }

    this.enemies.forEach((e) => {
      if (!e.isAlive) return;

      if (e.hitTimer > 0) e.hitTimer--;
      if (e.stunTimer > 0) {
        e.stunTimer--;
        return;
      }

      // Safe Zone check
      if (stage && stage.isInsideSafeZone && stage.isInsideSafeZone(e.x, e.y)) {
        e.x += e.x > stage.width / 2 ? 1.5 : -1.5;
        e.y += e.y > stage.height / 2 ? 1.5 : -1.5;
        return;
      }

      // Animation tick
      e.animTimer++;
      if (e.animTimer >= 14) {
        e.animTimer = 0;
        e.animFrame = (e.animFrame + 1) % e.frames.length;
      }

      // Target finding: Unahin ang mga buhay na Angels ng Priest kung mayroon
      let targetEntity = player;
      if (player.angelCompanions && player.angelCompanions.length > 0) {
        const liveAngel = player.angelCompanions.find((a) => a.isAlive);
        if (liveAngel) targetEntity = liveAngel;
      }

      const dx = targetEntity.x - e.x;
      const dy = targetEntity.y - e.y;
      const dist = Math.hypot(dx, dy);

      // Normal Chase
      if (dist > 10 && dist < 280) {
        e.x += (dx / dist) * e.speed;
        e.y += (dy / dist) * e.speed;
        e.facing = dx >= 0 ? "right" : "left";
      }

      // Attack Execution
      if (dist <= 16) {
        e.windupTimer++;
        if (e.windupTimer > 36) {
          e.windupTimer = 0;
          if (targetEntity === player && player.takeDamage) {
            player.takeDamage(e.damage, fx);
          } else if (targetEntity !== player) {
            targetEntity.hp -= e.damage;
            targetEntity.hitTimer = 16;
            if (fx && fx.spawnDamagePopup) {
              fx.spawnDamagePopup(targetEntity.x + 8, targetEntity.y - 6, `-${e.damage}`, false, "#ffd166");
            }
          }
        }
      } else {
        e.windupTimer = 0;
      }
    });
  }

  damage(enemy, amount, angle, isCrit, fx, lootManager, pushDist = 8, isStun = false, player = null, questManager = null) {
    if (!enemy || !enemy.isAlive) return;

    enemy.hp -= amount;
    enemy.hitTimer = 8;
    enemy.hpTimer = 220; // Keep HP bar visible for 3.6s
    enemy.x += Math.cos(angle) * pushDist;
    enemy.y += Math.sin(angle) * pushDist;

    if (isStun) enemy.stunTimer = 65;

    if (fx && fx.spawnDamagePopup) {
      fx.spawnDamagePopup(enemy.x + 8, enemy.y - 6, amount, isCrit);
    }

    if (Sound && Sound.playEnemyHurt) Sound.playEnemyHurt();
    else if (Sound && Sound.playSlash) Sound.playSlash();

    if (enemy.hp <= 0) {
      enemy.isAlive = false;
      if (Sound && Sound.playEnemyDeath) Sound.playEnemyDeath();
      if (lootManager) {
        if (typeof lootManager.spawnLoot === "function") lootManager.spawnLoot(enemy.x, enemy.y, enemy.level || 1, questManager);
        else if (typeof lootManager.dropLoot === "function") lootManager.dropLoot(enemy.x, enemy.y, enemy.level || 1, questManager);
      }
      if (player && typeof player.addExp === "function") {
        player.addExp(enemy.expReward || (25 + (enemy.level || 1) * 8), fx);
      }
      if (questManager && typeof questManager.onMonsterKill === "function") {
        questManager.onMonsterKill(enemy.type || "monster", player, fx);
      }
    }
  }

  draw(ctx) {
    this.enemies.forEach((e) => {
      if (!e.isAlive) return;

      // 1. Windup Attack Danger Zone Telegraph (Visual Readability)
      if (e.windupTimer > 0) {
        const pulse = 1 + (e.windupTimer / 25) * 0.4;
        ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(e.x + 10, e.y + 12, 16 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
        ctx.beginPath();
        ctx.arc(e.x + 10, e.y + 12, 16 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing exclamation alert
        ctx.fillStyle = "#ff4d6d";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("!", e.x + 10, e.y - 10);
      }

      // 2. High-Readability Dual-Layer Ground Contact Shadow
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.ellipse(Math.floor(e.x) + 10, Math.floor(e.y) + 16, 11, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.ellipse(Math.floor(e.x) + 10, Math.floor(e.y) + 15.5, 6.5, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. ENEMY FLOATING HEALTH BAR WITH DAMAGE LAG & LEVEL BADGE
      if (e.hpTimer > 0) e.hpTimer--;
      if (e.lagHp === undefined) e.lagHp = e.maxHp;
      if (e.lagHp > e.hp) e.lagHp -= Math.max(0.3, (e.lagHp - e.hp) * 0.08);

      const showHp = e.hp < e.maxHp || e.hpTimer > 0;
      if (showHp) {
        const barW = 28;
        const barH = 3.8;
        const barX = Math.round(e.x + 10 - barW / 2);
        const barY = Math.round(e.y - 7);

        // Dark Obsidian Frame
        ctx.fillStyle = "rgba(4, 7, 15, 0.92)";
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);

        // Red Damage Lag Retention Bar
        const lagRatio = Math.max(0, Math.min(1, e.lagHp / e.maxHp));
        ctx.fillStyle = "#f87171";
        ctx.fillRect(barX, barY, Math.round(barW * lagRatio), barH);

        // Dynamic Health Bar (Green -> Yellow -> Red)
        const hpRatio = Math.max(0, Math.min(1, e.hp / e.maxHp));
        const hpCol = hpRatio > 0.5 ? "#22c55e" : (hpRatio > 0.25 ? "#facc15" : "#ef4444");
        ctx.fillStyle = hpCol;
        ctx.fillRect(barX, barY, Math.round(barW * hpRatio), barH);

        // Level Badge & Name Header
        ctx.fillStyle = "#ffd166";
        ctx.font = "bold 4.5px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`Lv.${e.level} ${e.name.split(' ')[0]}`, barX + barW / 2, barY - 2.5);
      }

      // 4. Sprite Matrix Render
      drawSpriteMatrix(ctx, e.x, e.y, e.frames[e.animFrame], e.hitTimer > 0, e.facing === "left");
    });
  }
}