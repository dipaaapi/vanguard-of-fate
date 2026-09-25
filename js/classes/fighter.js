import { parseSprite } from "../sprite.js";
import { Sound } from "../audio.js";

// ========================================================
// 48x48 HIGH-FIDELITY FIGHTER PALETTE (Depth Shading & Martial Gi)
// ========================================================
// P = Crimson Headband / Gi Trim (#e63946), p = Deep Crimson Shadow (#9e0018)
// Q = Black Martial Gi (#212529), q = Gi Highlight (#343a40), R = Belt Gold (#ffd166)
// S = Skin Tone (#f8d5b8), s = Muscle Shadow (#cf966c), 1 = Crisp Outline (#11141a)
// 2 = Steel Boot Plating (#adb5bd), 5 = Fist Wraps / Hit Glow (#ffffff), O = Focused Eye Glow (#38bdf8)

const fighterIdle = [
  parseSprite([
    "..........1111..........",
    "........11PPPPPP11......",
    ".......11PPPPPPpp11.P...", // Flowing Crimson Headband
    "........1111111111..PP..",
    "........1SOOOS1.....p...",
    "........1sssss1.........",
    "........111111..........",
    ".......1QQQQQQ1.........",
    "......1QqQQQQqQ1........",
    ".....1SQqQQQQqQS1.......", // Muscular Shoulders
    ".....1SS111111SS1.......",
    "......11RRRRRR11........", // Gold Belt
    ".......1RRRRRR1.........",
    ".......1QQQQQQ1.........",
    ".......1QqQQqQ1.........",
    ".......1QqQQqQ1.........",
    ".......121..121.........",
    "......1S1....1S1........",
    "......11......11........",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ]),
  parseSprite([
    "..........1111..........",
    "........11PPPPPP11......",
    ".......11PPPPPPpp11.PP..",
    "........1111111111...P..",
    "........1SOOOS1.........",
    "........1sssss1.........",
    "........111111..........",
    ".......1QQQQQQ1.........",
    "......1QqQQQQqQ1........",
    ".....1SQqQQQQqQS1.......",
    ".....1SS111111SS1.......",
    "......11RRRRRR11........",
    ".......1RRRRRR1.........",
    ".......1QQQQQQ1.........",
    ".......1QqQQqQ1.........",
    ".......1QqQQqQ1.........",
    ".......121..121.........",
    "......1S1....1S1........",
    "......11......11........",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ])
];

const fighterPunch = [
  parseSprite([
    "..........1111..........",
    "........11PPPPPP11......",
    ".......11PPPPPPpp11.....",
    "........1111111111......",
    "........1SOOOS1.........",
    "........1sssss1.........",
    ".......11111111.........",
    "......1SSQQQQQ1.........",
    ".....1SSSqQQQQ1.........",
    ".....1SSSqQQQQ1.........",
    "......111RRRRRR1........",
    ".......1RRRRRR1.........",
    ".......1QQQQQQ1.........",
    ".......1QqQQqQ1.........",
    "......121..121..........",
    ".....1S1....1S1.........",
    ".....11......11.........",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ]),
  parseSprite([
    "..........1111..........",
    "........11PPPPPP11......",
    ".......11PPPPPPpp11.....",
    "........1111111111......",
    "........1SOOOS1...555...", // Glowing Taped Fist
    "........1sssss1..55555..",
    "........111111...555....",
    ".......1QQQQQQ11SSSS1...",
    "......1QqQQQQQ11SSSS1...",
    ".....1SQqQQQQQ1.1111....",
    "......11RRRRRR1.........",
    ".......1RRRRRR1.........",
    ".......1QQQQQQ1.........",
    "......121...121.........",
    ".....1S1.....1S1........",
    ".....11.......11........",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ])
];

const fighterKick = [
  parseSprite([
    "........................",
    "..........1111..........",
    "........11PPPPPP11......",
    ".......11PPPPPPpp11.....",
    "........1111111111......",
    "........1SOOOS1.........",
    "........1sssss1.........",
    ".......1QQQQQQ1.........",
    "......1SQqQQqQS1........",
    "......1SSRRRRSS1........",
    ".......11QQQQ11.........",
    "......1211..1121........",
    ".....1S1......1S1.......",
    ".....11........11.......",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ]),
  parseSprite([
    "........................",
    "........................",
    ".....11PPPPPP11.........",
    "....11PPPPPPpp11........",
    ".....1111111111.........",
    ".....1SOOOS1QQQQQ1......",
    ".....1sssss1QqQQQ112221.",
    "....1111111QqQQQ11223321", // Forward Flying Kick Extension
    "...1SSQQQQQ1111111SSSS15",
    "...1SSQQQQQ1.....11111.5",
    "....11RRRR1.............",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ])
];

export const FighterClass = {
  id: "fighter",
  name: "Fighter",
  title: "Indomitable Brawler",
  speed: 1.6,
  maxHp: 125,
  attackCooldown: 14,
  skill1Cooldown: 120, // 2.0s (Ki Force Blast)
  skill2Cooldown: 180, // 3.0s (Dragon Flying Kick)
  skill3Cooldown: 300, // 5.0s (Hundred-Fist Earth Tremor)
  sprites: {
    idle: fighterIdle,
    run: fighterIdle,
    slash: fighterPunch,
    bash: fighterKick
  },

  // 1. NORMAL ATTACK [SPACEBAR]: Rapid Fist Combo with Sharp Hit Sparks
  onAttack(player, target, spawnProj, fx, enemyManager) {
    let angle = player.aimAngle;
    if (!target) angle = player.facing === "right" ? 0 : Math.PI;

    const reach = 26;
    const hitX = player.x + 12 + Math.cos(angle) * reach;
    const hitY = player.y + 12 + Math.sin(angle) * reach;

    if (Sound && Sound.playSlash) Sound.playSlash();
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(hitX, hitY, "#ff0055", 10);

    if (enemyManager && enemyManager.enemies) {
      enemyManager.enemies.forEach((e) => {
        if (e.isAlive && Math.hypot(e.x + 10 - hitX, e.y + 10 - hitY) < 24) {
          enemyManager.damage(e, 11 + (player.bonusDamage || 0) + Math.floor((player.level - 1) * 1.5), angle, false, fx, player.lootManager, 8, false, player);
        }
      });
    }
    return true;
  },

  // 2. SKILL 1 [KEY J / 1]: KI FORCE BLAST (Accelerating Ki Orb Projectile)
  onSkill1(player, target, spawnProj, fx, enemyManager) {
    const spawnX = player.x + 12;
    const spawnY = player.y + 12;
    const angle = player.aimAngle;

    if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 10, "HADOUKEN! ⚡", true, "#38bdf8");

    if (spawnProj) {
      spawnProj({
        type: "force_sphere",
        x: spawnX,
        y: spawnY,
        vx: Math.cos(angle) * 5.2,
        vy: Math.sin(angle) * 5.2,
        angle: angle,
        damage: 18 + (player.bonusDamage || 0)
      });
    }
    return true;
  },

  // 3. SKILL 2 [KEY K / 2]: DRAGON FLYING KICK (Airborne Blitz & Heavy Stun)
  onSkill2(player, target, spawnProj, fx, enemyManager) {
    player.isHomingKick = true;
    player.kickDuration = 18;

    let angle = player.aimAngle;
    if (target && target.isAlive) {
      angle = Math.atan2(target.y - player.y, target.x - player.x);
    }
    player.kickVx = Math.cos(angle) * 7.5;
    player.kickVy = Math.sin(angle) * 7.5;

    if (Sound && Sound.playSlash) Sound.playSlash();
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 10, "DRAGON KICK! 🐉", true, "#ffd166");
    return true;
  },

  // 4. SKILL 3 [KEY L / 3]: HUNDRED-FIST EARTHSHATTER (Radial 8-Burst Shockwave & 2.5s Stun)
  onSkill3(player, target, spawnProj, fx, enemyManager) {
    if (Sound && Sound.playSlash) Sound.playSlash();
    if (fx && fx.addScreenShake) fx.addScreenShake(5);
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(player.x + 12, player.y + 12, "#ff0055", 26);
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 12, "SONIC TREMOR! 💥", true, "#ff0055");

    if (enemyManager && enemyManager.enemies) {
      enemyManager.enemies.forEach((e) => {
        if (e.isAlive && Math.hypot(e.x - player.x, e.y - player.y) < 65) {
          const ang = Math.atan2(e.y - player.y, e.x - player.x);
          enemyManager.damage(e, 48 + (player.bonusDamage || 0), ang, true, fx, player.lootManager, 20, true, player);
        }
      });
    }
    return true;
  },

  onSkillUpdate(player, target, onImpact, enemyManager, fx) {
    if (player.isHomingKick) {
      player.x += player.kickVx;
      player.y += player.kickVy;
      player.kickDuration--;

      if (enemyManager && enemyManager.enemies) {
        enemyManager.enemies.forEach((e) => {
          if (e.isAlive && Math.hypot(e.x - player.x, e.y - player.y) < 28) {
            const ang = Math.atan2(e.y - player.y, e.x - player.x);
            enemyManager.damage(e, 44 + (player.bonusDamage || 0), ang, true, fx, player.lootManager, 18, true, player);
            player.isHomingKick = false;
            player.state = "idle";
          }
        });
      }

      if (player.kickDuration <= 0) {
        player.isHomingKick = false;
        player.state = "idle";
      }
    }
  }
};