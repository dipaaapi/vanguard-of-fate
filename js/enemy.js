import { Sound } from "./audio.js";

const _ = 0;

// ========================================================
// 64-BIT HIGH-FIDELITY ENEMY SPRITES (DETAILED MATRICES)
// ========================================================

// 1. ANCIENT SLIME (May inner glowing core at translucent jelly shading)
const slimeFrames = [
  [
    [_,_,_,_,_,_,_,1,1,1,1,1,_,_,_,_,_,_],
    [_,_,_,_,_,1,1,"#9ef01a","#9ef01a","#9ef01a","#9ef01a",1,1,_,_,_,_,_],
    [_,_,_,1,1,"#70e000","#70e000","#ccff33","#ccff33","#70e000","#70e000",1,1,_,_,_],
    [_,_,1,"#70e000","#70e000","#ffffff","#70e000","#70e000","#ffffff","#70e000","#70e000",1,_,_],
    [_,_,1,"#70e000","#38b000",1,"#70e000","#70e000",1,"#38b000","#70e000",1,_,_],
    [_,1,"#70e000","#38b000","#38b000","#007200","#007200","#38b000","#38b000","#70e000","#70e000",1,_],
    [_,1,"#38b000","#38b000","#007200","#004b23","#004b23","#007200","#38b000","#38b000","#38b000",1,_],
    [1,"#38b000","#38b000","#38b000","#007200","#007200","#38b000","#38b000","#38b000","#004b23",1,_],
    [1,"#004b23","#004b23","#004b23","#004b23","#004b23","#004b23","#004b23","#004b23","#004b23",1,_],
    [_,1,1,1,1,1,1,1,1,1,1,1,_,_,_,_]
  ],
  [
    [_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,1,1,1,1,1,1,_,_,_,_,_,_],
    [_,_,_,1,1,"#9ef01a","#9ef01a","#9ef01a","#9ef01a","#9ef01a",1,1,_,_,_,_],
    [_,_,1,"#70e000","#ccff33","#ffffff","#70e000","#ffffff","#ccff33","#70e000",1,_,_,_],
    [_,1,"#70e000","#70e000",1,"#70e000","#70e000",1,"#70e000","#70e000",1,_,_],
    [1,"#70e000","#38b000","#38b000","#007200","#007200","#38b000","#38b000","#70e000",1,_,_],
    [1,"#38b000","#38b000","#007200","#004b23","#004b23","#007200","#38b000","#38b000",1,_,_],
    [1,"#004b23","#004b23","#004b23","#004b23","#004b23","#004b23","#004b23","#004b23",1,_,_],
    [_,1,1,1,1,1,1,1,1,1,1,_,_,_,_,_]
  ]
];

// 2. SHADOW DIRE WOLF (May muscular frame, crimson eyes, at pangil)
const wolfFrames = [
  [
    [_,_,_,_,_,1,1,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,1,1,"#495057",1,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,1,"#adb5bd","#6c757d",1,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,1,"#6c757d","#ced4da","#adb5bd",1,1,1,1,1,1,_,_,_,_,_,_,_],
    [1,"#ff0055","#adb5bd","#6c757d","#495057","#343a40","#495057","#495057","#343a40",1,_,_,_,_,_,_],
    [1,"#ffffff","#495057","#343a40","#343a40","#212529","#212529","#343a40","#495057","#495057",1,_,_,_,_],
    [_,1,1,"#343a40","#212529","#212529","#212529","#212529","#212529","#343a40","#495057",1,_,_,_],
    [_,_,1,"#212529","#212529","#212529","#212529","#212529","#212529","#212529","#343a40","#212529",1,_],
    [_,_,1,"#343a40",1,"#212529",1,_,_,1,"#343a40",1,"#212529",1,_],
    [_,_,1,1,_,1,1,_,_,1,1,_,1,1,_,_]
  ],
  [
    [_,_,_,_,_,1,1,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,_,1,1,"#495057",1,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,_,1,"#adb5bd","#6c757d",1,_,_,_,_,_,_,_,_,_,_,_,_],
    [_,1,"#6c757d","#ced4da","#adb5bd",1,1,1,1,1,1,_,_,_,_,_,_,_],
    [1,"#ff0055","#adb5bd","#6c757d","#495057","#343a40","#495057","#495057","#343a40",1,_,_,_,_,_,_],
    [1,"#ffffff","#495057","#343a40","#343a40","#212529","#212529","#343a40","#495057","#495057",1,_,_,_,_],
    [_,1,1,"#343a40","#212529","#212529","#212529","#212529","#212529","#343a40","#495057",1,_,_,_],
    [_,_,1,"#212529","#212529","#212529","#212529","#212529","#212529","#212529","#343a40","#212529",1,_],
    [_,_,_,1,"#343a40",1,"#212529",_,_,_,1,"#343a40",1,"#212529",_],
    [_,_,_,1,1,_,1,1,_,_,_,1,1,_,1,1]
  ]
];

// 3. UNDEAD SKELETON LANCER (May bone structure at bakal na sibat)
const skeletonFrames = [
  [
    [_,_,_,_,_,_,1,1,1,1,_,_,_,_,_,_,_],
    [_,_,_,_,_,1,"#f8f9fa","#e9ecef","#dee2e6",1,_,_,_,_,_,_,_],
    [_,_,_,_,_,1,1,1,1,1,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,1,"#ced4da",1,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,1,"#e9ecef","#dee2e6",1,_,_,_,_,_,_,_],
    [_,_,1,1,1,1,"#6c757d","#495057",1,1,1,1,1,1,1,1,_], // Iron Pike
    [_,_,_,_,_,1,"#dee2e6","#ced4da",1,_,_,_,_,_,_,_],
    [_,_,_,_,1,"#dee2e6",_,1,"#ced4da",1,_,_,_,_,_,_],
    [_,_,_,_,1,1,_,_,1,1,_,_,_,_,_,_]
  ],
  [
    [_,_,_,_,_,_,1,1,1,1,_,_,_,_,_,_,_],
    [_,_,_,_,_,1,"#f8f9fa","#e9ecef","#dee2e6",1,_,_,_,_,_,_,_],
    [_,_,_,_,_,1,1,1,1,1,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,1,"#ced4da",1,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,1,"#e9ecef","#dee2e6",1,_,_,_,_,_,_,_],
    [_,_,1,1,1,1,"#adb5bd","#6c757d",1,1,1,1,1,1,1,1,_],
    [_,_,_,_,_,1,"#dee2e6","#ced4da",1,_,_,_,_,_,_,_],
    [_,_,_,_,_,1,"#dee2e6",1,"#ced4da",_,_,_,_,_,_,_],
    [_,_,_,_,_,1,1,_,1,1,_,_,_,_,_,_]
  ]
];

export class EnemyManager {
  constructor(worldW, worldH) {
    this.worldW = worldW;
    this.worldH = worldH;
    this.enemies = [];
    this.spawnTimer = 0;
  }

  init(playerLevel = 1) {
    this.enemies = [];
    for (let i = 0; i < 6; i++) {
      this.spawnRandomEnemy(playerLevel);
    }
  }

  spawnRandomEnemy(playerLevel) {
    // Normal, calibrated chase speeds (0.55 hanggang 0.78) para hindi mabilis
    const kinds = [
      { name: "Forest Slime", type: "slime", frames: slimeFrames, speed: 0.52, hpMult: 1.0, dmg: 8 },
      { name: "Dire Wolf", type: "wolf", frames: wolfFrames, speed: 0.72, hpMult: 1.25, dmg: 14 },
      { name: "Skeleton Lancer", type: "skeleton", frames: skeletonFrames, speed: 0.58, hpMult: 1.4, dmg: 16 }
    ];

    const pick = kinds[Math.floor(Math.random() * kinds.length)];
    const lvl = Math.max(1, playerLevel + Math.floor(Math.random() * 5) - 2);

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
      maxHp: Math.round((35 + lvl * 12) * pick.hpMult),
      hp: Math.round((35 + lvl * 12) * pick.hpMult),
      speed: pick.speed,
      damage: pick.dmg + lvl * 2,
      isAlive: true,
      facing: "left",
      hitTimer: 0,
      stunTimer: 0,
      windupTimer: 0
    });
  }

  update(player, fx, lootManager, stage) {
    this.spawnTimer++;
    if (this.spawnTimer > 200 && this.enemies.filter((e) => e.isAlive).length < 9) {
      this.spawnTimer = 0;
      this.spawnRandomEnemy(player.level);
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
      if (player.angels && player.angels.length > 0) {
        const liveAngel = player.angels.find((a) => a.isAlive);
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

  damage(enemy, amount, angle, isCrit, fx, lootManager, pushDist = 8, isStun = false, player = null) {
    if (!enemy || !enemy.isAlive) return;

    enemy.hp -= amount;
    enemy.hitTimer = 8;
    enemy.x += Math.cos(angle) * pushDist;
    enemy.y += Math.sin(angle) * pushDist;

    if (isStun) enemy.stunTimer = 65;

    if (fx && fx.spawnDamagePopup) {
      fx.spawnDamagePopup(enemy.x + 8, enemy.y - 6, amount, isCrit);
    }

    if (Sound && Sound.playSlash) Sound.playSlash();

    if (enemy.hp <= 0) {
      enemy.isAlive = false;
      if (lootManager) {
        if (typeof lootManager.spawnLoot === "function") lootManager.spawnLoot(enemy.x, enemy.y);
        else if (typeof lootManager.dropLoot === "function") lootManager.dropLoot(enemy.x, enemy.y);
      }
      if (player && typeof player.addExp === "function") {
        player.addExp(25 + enemy.level * 8);
      }
    }
  }

  draw(ctx, drawMatrixFn) {
    this.enemies.forEach((e) => {
      if (!e.isAlive) return;

      // Contact Shadow
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(e.x + 10, e.y + 16, 9, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Matrix Renderer na may Flip Support
      ctx.save();
      if (e.facing === "left") {
        ctx.translate(Math.floor(e.x) + 20, Math.floor(e.y));
        ctx.scale(-1, 1);
        drawMatrixFn(ctx, 0, 0, e.frames[e.animFrame], e.hitTimer > 0);
      } else {
        drawMatrixFn(ctx, e.x, e.y, e.frames[e.animFrame], e.hitTimer > 0);
      }
      ctx.restore();

      // HP Bar na may Level Badge
      const w = 18;
      ctx.fillStyle = "#111";
      ctx.fillRect(e.x + 1, e.y - 7, w, 2.5);
      ctx.fillStyle = e.type === "wolf" ? "#ff4d6d" : e.type === "skeleton" ? "#00b4d8" : "#70e000";
      ctx.fillRect(e.x + 1, e.y - 7, Math.max(0, (e.hp / e.maxHp) * w), 2.5);
    });
  }
}