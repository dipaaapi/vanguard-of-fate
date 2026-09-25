import { parseSprite } from "../sprite.js";
import { Sound } from "../audio.js";

// ========================================================
// 48x48 HIGH-FIDELITY KNIGHT PALETTE (Depth Shading & Armor)
// ========================================================
// H = Steel Plate Highlight (#dee2e6), h = Steel Plate Midtone (#adb5bd), 1 = Outline (#11141a)
// R = Crimson Crest (#e63946), r = Crest Shadow (#9e0018), O = Visor Glow (#ffd166)
// B = Gold Trim (#e0a926), G = Tower Shield Steel (#6c757d), S = Skin Tone (#f8d5b8)
// 4 = Lance Steel Shaft (#ced4da), 5 = Lance Glowing Tip (#ffffff)

const knightIdle = [
  parseSprite([
    "............1111............",
    "..........11RRRR11..........",
    ".........11rrrrRR11.........",
    "........1HHHHHHHHHH1........",
    "........1H11111111H1........",
    "........1111SOOS1111....5...",
    ".........111SOOS111....555..",
    ".........1111111111....545..",
    ".......11HHHHHHHHHH11...4...",
    "......1BBGGGGGGGGGG11...4...",
    "......1BBGGGGGGGGGG11...4...",
    "......1BBGGGGGGGGGG11...4...",
    "......1BBGGGGGGGGGG11...4...",
    ".......1BBGGGGGGGG11....4...",
    "........11HHHHHHHH1.....4...",
    ".........1HHHHHHHH1.....4...",
    ".........1hhhhhhhh1.....4...",
    ".........1hhhhhhhh1.....4...",
    ".........1hhhhhhhh1.....1...",
    "........1111....1111........",
    "........1HH1....1HH1........",
    "........1111....1111........",
    "............................",
    "............................"
  ]),
  parseSprite([
    "............1111............",
    "..........11RRRR11..........",
    ".........11rrrrRR11.........",
    "........1HHHHHHHHHH1........",
    "........1H11111111H1........",
    "........1111SOOS1111....5...",
    ".........111SOOS111....555..",
    ".........1111111111....545..",
    ".......11HHHHHHHHHH11...4...",
    "......1BBGGGGGGGGGG11...4...",
    "......1BBGGGGGGGGGG11...4...",
    "......1BBGGGGGGGGGG11...4...",
    "......1BBGGGGGGGGGG11...4...",
    ".......1BBGGGGGGGG11....4...",
    "........11HHHHHHHH1.....4...",
    ".........1HHHHHHHH1.....4...",
    ".........1hhhhhhhh1.....4...",
    ".........1hhhhhhhh1.....4...",
    ".........1hhhhhhhh1.....1...",
    "........1111....1111........",
    "........1HH1....1HH1........",
    ".........11......11.........",
    "............................",
    "............................"
  ])
];

// RUNNING WITH TOWER SHIELD & LANCE
const knightRun = [
  parseSprite([
    "............1111............",
    "..........11RRRR11..........",
    ".........11rrrrRR11.........",
    "........1HHHHHHHHHH1....5...",
    "........1H11111111H1...555..",
    "........1111SOOS1111...545..",
    ".........111SOOS111.....4...",
    "......11HHHHHHHHHHHH11..4...",
    ".....1BBGGGGGGGGGGGG11..4...",
    ".....1BBGGGGGGGGGGGG11..4...",
    ".....1BBGGGGGGGGGGGG11..4...",
    "......1BBGGGGGGGGGG11...4...",
    ".......111HHHHHHHH111...4...",
    ".........1hhhhhhhh1.....4...",
    "........11hhhhhhhh11....1...",
    ".......11H1......1H11.......",
    ".......1111......1111.......",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................"
  ]),
  knightIdle[0]
];

// SHIELD BASTION POSE
const knightShieldStance = [
  parseSprite([
    "............................",
    "............1111............",
    "..........11RRRR11..........",
    ".........11rrrrRR11.........",
    ".....1111BBGGGGGGGG1111.....",
    "....1BBGGGGGGGGGGGGGGGGB1...",
    "....1BBGGGGGGGGGGGGGGGGB1...",
    "....1BBGGGGGGGGGGGGGGGGB1.5.",
    "....1BBGGGGGGGGGGGGGGGGB1555",
    "....1BBGGGGGGGGGGGGGGGGB1.4.",
    "....1BBGGGGGGGGGGGGGGGGB1.4.",
    ".....1111BBGGGGGGGG1111...4.",
    "........1HHHHHHHHHH1......4.",
    ".........1hhhhhhhh1.......4.",
    "........11hhhhhhhh11......1.",
    "........1111....1111........",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................"
  ])
];

// PIERCING BLITZ CHARGE POSE
const knightChargeStance = [
  parseSprite([
    "............................",
    "............1111............",
    "..........11RRRR11..........",
    ".........11rrrrRR11.........",
    "........1HHHHHHHHHH1........",
    "........1111SOOS111144444455",
    "......11HHHHHHHHHH1.44444555",
    ".....1BBGGGGGGGGGG1.44444455",
    ".....1BBGGGGGGGGGG1.........",
    "......1111HHHHHH111.........",
    ".........1hhhhhh1...........",
    "........11hhhhhh11..........",
    ".......11H1....1H11.........",
    ".......1111....1111.........",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................",
    "............................"
  ])
];

export const KnightClass = {
  id: "knight",
  name: "Knight",
  title: "Aegis Lancer",
  speed: 1.4,
  maxHp: 140,
  defense: 4,
  attackCooldown: 18,
  skill1Cooldown: 180, // 3.0s (Bastion Shield Guard)
  skill2Cooldown: 240, // 4.0s (Piercing Blitz Charge)
  skill3Cooldown: 360, // 6.0s (Judgement Whirlwind Blade)
  sprites: {
    idle: knightIdle,
    run: knightRun,
    slash: knightShieldStance,
    bash: knightChargeStance
  },

  // 1. NORMAL ATTACK [SPACEBAR]: Rapid Lance Thrust with Knockback
  onAttack(player, target, spawnProj, fx, enemyManager) {
    let angle = player.aimAngle;
    if (!target) angle = player.facing === "right" ? 0 : Math.PI;

    const reach = 32;
    const hitX = player.x + 12 + Math.cos(angle) * reach;
    const hitY = player.y + 12 + Math.sin(angle) * reach;

    if (Sound && Sound.playSlash) Sound.playSlash();
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(hitX, hitY, "#ffd166", 8);

    if (enemyManager && enemyManager.enemies) {
      enemyManager.enemies.forEach((e) => {
        if (e.isAlive && Math.hypot(e.x + 10 - hitX, e.y + 10 - hitY) < 26) {
          enemyManager.damage(e, 13 + (player.bonusDamage || 0) + Math.floor((player.level - 1) * 1.5), angle, false, fx, player.lootManager, 10, false, player);
        }
      });
    }
    return true;
  },

  // 2. SKILL 1 [KEY J / 1]: BASTION SHIELD FORTRESS (80% Damage Cut Barrier & Radial Shock)
  onSkill1(player, target, spawnProj, fx, enemyManager) {
    player.isShieldGuarding = true;
    player.shieldGuardTimer = 90; // 1.5 seconds protective barrier
    player.bonusDefense = (player.bonusDefense || 0) + 12;

    if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(player.x + 12, player.y + 12, "#ffd166", 18);
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 10, "AEGIS FORTRESS!", true, "#ffd166");

    // Radial Concussion Shockwave
    if (enemyManager && enemyManager.enemies) {
      enemyManager.enemies.forEach((e) => {
        if (e.isAlive && Math.hypot(e.x - player.x, e.y - player.y) < 54) {
          const ang = Math.atan2(e.y - player.y, e.x - player.x);
          enemyManager.damage(e, 14 + (player.bonusDamage || 0), ang, false, fx, player.lootManager, 14, true, player);
        }
      });
    }
    return true;
  },

  // 3. SKILL 2 [KEY K / 2]: PIERCING LANCE BLITZ CHARGE (Forward Blitz Through All Enemies)
  onSkill2(player, target, spawnProj, fx, enemyManager) {
    if (player.isChargingLance) return false;

    player.isChargingLance = true;
    player.chargeDuration = 24;
    player.piercedEnemies = new Set();

    let angle = player.aimAngle;
    if (player.facing === "right" && Math.abs(angle) > Math.PI / 2) angle = 0;
    if (player.facing === "left" && Math.abs(angle) < Math.PI / 2) angle = Math.PI;

    player.chargeVx = Math.cos(angle) * 6.5;
    player.chargeVy = Math.sin(angle) * 6.5;

    if (Sound && Sound.playSlash) Sound.playSlash();
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 10, "LANCE BLITZ! ⚔️", true, "#38bdf8");
    return true;
  },

  // 4. SKILL 3 [KEY L / 3]: JUDGEMENT WHIRLWIND (360° Radiant Spin & Knockback)
  onSkill3(player, target, spawnProj, fx, enemyManager) {
    if (Sound && Sound.playSlash) Sound.playSlash();
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(player.x + 12, player.y + 12, "#ffd166", 24);
    if (fx && fx.addScreenShake) fx.addScreenShake(3);
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 12, "JUDGEMENT VORTEX! ⚡", true, "#ffd166");

    if (enemyManager && enemyManager.enemies) {
      enemyManager.enemies.forEach((e) => {
        if (e.isAlive && Math.hypot(e.x - player.x, e.y - player.y) < 68) {
          const ang = Math.atan2(e.y - player.y, e.x - player.x);
          enemyManager.damage(e, 32 + (player.bonusDamage || 0), ang, true, fx, player.lootManager, 18, true, player);
        }
      });
    }
    return true;
  },

  onSkillUpdate(player, target, onImpact, enemyManager, fx) {
    // Bastion Guard countdown
    if (player.isShieldGuarding) {
      player.shieldGuardTimer--;
      if (player.shieldGuardTimer <= 0) {
        player.isShieldGuarding = false;
        player.bonusDefense = Math.max(0, (player.bonusDefense || 0) - 12);
      }
    }

    // Lance Blitz Motion & Piercing collision
    if (player.isChargingLance) {
      player.x += player.chargeVx;
      player.y += player.chargeVy;
      player.chargeDuration--;

      if (enemyManager && enemyManager.enemies) {
        enemyManager.enemies.forEach((e) => {
          if (e.isAlive && !player.piercedEnemies.has(e.id) && Math.hypot(e.x - player.x, e.y - player.y) < 32) {
            player.piercedEnemies.add(e.id);
            const ang = Math.atan2(e.y - player.y, e.x - player.x);
            enemyManager.damage(e, 22 + (player.bonusDamage || 0), ang, true, fx, player.lootManager, 14, true, player);
          }
        });
      }

      if (player.chargeDuration <= 0) {
        player.isChargingLance = false;
        player.state = "idle";
      }
    }
  }
};