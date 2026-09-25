import { Sound } from "../audio.js";
import { FalconCompanion } from "../summons/falcon.js";

// ========================================================
// 48x48 HIGH-FIDELITY PALETTE (Depth Shading & Highlights)
// ========================================================
const P = {
  ".": 0,
  1: "#14171d", // Crisp Dark Outline
  // Elven Hair (Golden Silk)
  Y1: "#fff5a5", // Glint
  Y2: "#e5be38", // Base Gold
  Y3: "#9c7014", // Deep Crease
  // Elven Skin & Pointed Ears
  S1: "#fff0e0", // Cheek highlight
  S2: "#f6cca6", // Fair tone
  S3: "#cf966c", // Jawline / Neck shadow
  // Forest Cloak / Tunic
  G1: "#5cb85c", // Highlight rim
  G2: "#3b803a", // Forest Midtone
  G3: "#1b4332", // Folds & Shadow
  // Leather Harness, Quiver, & Boots
  B1: "#b56f3e", // Light leather
  B2: "#7a431d", // Hard leather / Belt
  B3: "#4a240c", // Deep shadow / Soles
  // Bow Wood & Feathers
  W1: "#e0a96d", // Polished ash
  W2: "#8c532b", // Heavy bow body
  W3: "#ffffff", // Bowstring / Glint
  O1: "#fcd168"  // Brass buckle
};

function parse48(rows) {
  return rows.map(r => {
    const tokens = r.match(/([A-Z][0-9]|\.|\d)/g) || [];
    return tokens.map(t => (t === "." ? 0 : P[t] || "#ffffff"));
  });
}

// ========================================================
// 48x48 ELVEN ARCHER SPRITES (IDLE, RUN, ATTACK)
// ========================================================

// 1. IDLE ANIMATION: Breathing & Wind-Sway (2-Frame Cycle)
const archerIdle = [
  // Frame 1: Normal Inhale
  parse48([
    "................................................",
    "....................G2G2G1G1....................",
    "..................G3G2G1G1G1G1..................",
    ".................G3G2G1G1G1G1G1.................",
    "................G3G2Y2Y1Y1Y1Y2G2................",
    "................G3Y3Y2Y1Y1Y1Y2Y3................",
    "...............G3Y3Y2Y2Y2Y2Y2Y2Y3...............",
    "...........S2S1G3Y3Y2S2S1S1S2Y2Y3S1S2...W2W1....", // Matutulis na Elven Ears sa gilid
    "............S3S2.Y3S3S111S111S2Y3.S2S3.W2W1.....", // Mukha na may mga mata
    "..............S3..S3S2S1S1S2S3..S3....W2W1......",
    ".............Y3Y2..S3S2S2S2S3..Y2Y3..W2W1.......", // Shaded Blonde Hair
    "............Y3Y2Y2..G2G1G1G2..Y2Y2Y3W2W1........", // Green Cowl
    "............Y3Y2Y2G3G2G1G1G2G3Y2Y2Y3W2.W3.......", // Recurve Longbow Frame
    "............Y3Y2Y2G3B2B1B1B2G3Y2Y2Y3W2..W3......", // Leather Chestguard
    ".............Y3Y2.B2B2O1O1B2B2.Y2Y3.W2...W3.....", // Belt & Brass Buckle
    "...............Y3.G2G1G1G1G1G2..Y3..W2....W3....", // Skirt
    "..................G3G2G1G1G2G3.....W2.....W3....",
    "..................G3G2G2G2G2G3.....W2.....W3....",
    "...................G3G3..G3G3......W2.....W3....",
    "...................S3S2..S2S3......W2.....W3....", // Hiwalay na mga Binti
    "...................S3S2..S2S3......W2....W3.....",
    "...................S3S2..S2S3.......W2..W3......",
    "...................B2B1..B1B2........W2W3.......", // High Hunter Boots
    "...................B2B1..B1B2.........W2W1......",
    "...................B3B2..B2B3...................",
    "..................1B3B2..B2B31..................",
    "..................11111..11111..................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................"
  ]),
  // Frame 2: Gentle Exhale / Hair Wind Sway
  parse48([
    "................................................",
    "....................G2G2G1G1....................",
    "..................G3G2G1G1G1G1..................",
    ".................G3G2G1G1G1G1G1.................",
    "................G3G2Y2Y1Y1Y1Y2G2................",
    "................G3Y3Y2Y1Y1Y1Y2Y3................",
    "...............G3Y3Y2Y2Y2Y2Y2Y2Y3...............",
    "...........S2S1G3Y3Y2S2S1S1S2Y2Y3S1S2...W2W1....",
    "............S3S2.Y3S3S111S111S2Y3.S2S3.W2W1.....",
    "..............S3..S3S2S1S1S2S3..S3....W2W1......",
    "............Y3Y2Y2.S3S2S2S2S3..Y2Y3..W2W1.......", // Umiindayog na buhok
    "...........Y3Y2Y2Y2.G2G1G1G2..Y2Y2Y3W2W1........",
    "...........Y3Y2Y2Y2G3G2G1G1G2G3Y2Y2Y3W2.W3.......",
    "............Y3Y2Y2G3B2B1B1B2G3Y2Y2Y3W2..W3......",
    ".............Y3Y2.B2B2O1O1B2B2.Y2Y3.W2...W3.....",
    "...............Y3.G2G1G1G1G1G2..Y3..W2....W3....",
    "..................G3G2G1G1G2G3.....W2.....W3....",
    "...................G3G3..G3G3......W2.....W3....",
    "...................S3S2..S2S3......W2.....W3....",
    "...................S3S2..S2S3......W2.....W3....",
    "...................S3S2..S2S3......W2....W3.....",
    "...................B2B1..B1B2.......W2..W3......",
    "...................B2B1..B1B2........W2W3.......",
    "...................B3B2..B2B3.........W2W1......",
    "..................1B3B2..B2B31..................",
    "..................11111..11111..................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................",
    "................................................"
  ])
];

// 2. RUN ANIMATION: 4-Frame Dynamic Stride
const archerRun = [
  parse48([
    "................................................",
    "....................G2G2G1G1....................",
    "..................G3G2G1G1G1G1..................",
    ".................G3G2G1G1G1G1G1.................",
    "................G3G2Y2Y1Y1Y1Y2G2................",
    "................G3Y3Y2Y1Y1Y1Y2Y3................",
    "...........S2S1G3Y3Y2S2S1S1S2Y2Y3S1S2...W2W1....",
    "............S3S2.Y3S3S111S111S2Y3.S2S3.W2W1.....",
    "..............S3..S3S2S1S1S2S3..S3....W2W1......",
    "............Y3Y2Y2.S3S2S2S2S3..Y2Y3..W2W1.......",
    "...........Y3Y2Y2Y2.G2G1G1G2..Y2Y2Y3W2W1........",
    "..........Y3Y2Y2Y2G3G2G1G1G2G3Y2Y2Y3W2.W3.......",
    "...........Y3Y2Y2.B2B1B1B1B2..Y2Y2Y3W2..W3......",
    ".............Y3Y2.G2G1G1G1G2...Y2Y3.W2...W3.....",
    "..................G3G2G1G1G2G3......W2....W3....",
    ".................S3S2....S2S3.......W2.....W3...", // Sulong ang Kanang Paa
    "................S3S2......S2S3......W2.....W3...",
    "...............B2B1........B1B2.....W2....W3....",
    "..............B2B1..........B1B2.....W2..W3.....",
    ".............B3B2............B3B2.....W2W3......",
    "............11111............11111.....W2W1.....",
    "................................................",
    "................................................",
    "................................................"
  ]),
  archerIdle[0],
  parse48([
    "................................................",
    "....................G2G2G1G1....................",
    "..................G3G2G1G1G1G1..................",
    ".................G3G2G1G1G1G1G1.................",
    "................G3G2Y2Y1Y1Y1Y2G2................",
    "................G3Y3Y2Y1Y1Y1Y2Y3................",
    "...........S2S1G3Y3Y2S2S1S1S2Y2Y3S1S2...W2W1....",
    "............S3S2.Y3S3S111S111S2Y3.S2S3.W2W1.....",
    "..............S3..S3S2S1S1S2S3..S3....W2W1......",
    "............Y3Y2..S3S2S2S2S3..Y2Y2Y2.W2W1.......",
    "...........Y3Y2Y2..G2G1G1G2..Y2Y2Y2Y3W2W1........",
    "...........Y3Y2Y2G3G2G1G1G2G3Y2Y2Y2Y3W2.W3.......",
    "............Y3Y2..B2B1B1B1B2...Y2Y2Y3W2..W3......",
    ".............Y3Y2.G2G1G1G1G2...Y2Y3..W2...W3.....",
    "..................G3G2G1G1G2G3.......W2....W3....",
    "..................S2S3....S3S2.......W2.....W3...", // Sulong ang Kaliwang Paa
    ".................S2S3......S3S2......W2.....W3...",
    "................B1B2........B2B1.....W2....W3....",
    "...............B1B2..........B2B1.....W2..W3.....",
    "..............B2B3............B3B2.....W2W3......",
    ".............11111............11111.....W2W1.....",
    "................................................",
    "................................................",
    "................................................"
  ]),
  archerIdle[1]
];

// 3. ATTACK ANIMATION: Full Drawn Arrow with Recurve Bow
const archerAttack = [
  parse48([
    "................................................",
    "....................G2G2G1G1....................",
    "..................G3G2G1G1G1G1..................",
    ".................G3G2G1G1G1G1G1.................",
    "................G3G2Y2Y1Y1Y1Y2G2................",
    "................G3Y3Y2Y1Y1Y1Y2Y3................",
    "...............G3Y3Y2Y2Y2Y2Y2Y2Y3................",
    "...........S2S1G3Y3Y2S2S1S1S2Y2Y3S1S2...W2W1....",
    "............S3S2.Y3S3S111S111S2Y3.S2S3.W2W1.....",
    "..............S3..S3S2S1S1S2S3..S3....W2W1......",
    ".............Y3Y2..S3S2S2S2S3..Y2Y3..W2W1.......",
    "............Y3Y2Y2..G2G1G1G2.S2S1W2..W2W1........",
    "............Y3Y2Y2G3G2G1G1G211111111W3W3W3W3W3W3", // Full-drawn glowing arrow
    "............Y3Y2Y2G3B2B1B1B2...S2S1..W2..W3......",
    ".............Y3Y2.B2B2O1O1B2B2..Y2Y3.W2...W3.....",
    "...............Y3.G2G1G1G1G1G2...Y3..W2....W3....",
    "..................G3G2G1G1G2G3......W2.....W3....",
    "...................G3G3..G3G3.......W2.....W3....",
    "...................S3S2..S2S3.......W2.....W3....",
    "...................S3S2..S2S3.......W2....W3.....",
    "...................B2B1..B1B2........W2..W3......",
    "...................B2B1..B1B2.........W2W3.......",
    "...................B3B2..B2B3..........W2W1......",
    "..................11111..11111..................",
    "................................................",
    "................................................"
  ]),
  archerIdle[0]
];

// ========================================================
// ARCHER CLASS ENGINE
// ========================================================
export const ArcherClass = {
  id: "archer",
  name: "Archer",
  title: "Elven Windstrider",
  speed: 1.65,
  maxHp: 100,
  attackCooldown: 15,
  skill1Cooldown: 180, // 3.0s (Falcon Strike)
  skill2Cooldown: 220, // 3.6s (Triple Volley)
  skill3Cooldown: 320, // 5.3s (Gale Piercing Snipe)
  reloadDuration: 65,
  sprites: {
    idle: archerIdle,
    run: archerRun,
    slash: archerAttack,
    bash: archerAttack
  },

  onInit(player) {
    player.arrowCount = 6;
    player.maxArrows = 6;
    player.isReloading = false;
    player.reloadTimer = 0;
    if (!player.falconCompanion) {
      player.falconCompanion = new FalconCompanion(player.x, player.y);
    }
  },

  onUpdate(player) {
    if (player.isReloading) {
      player.reloadTimer--;
      if (player.reloadTimer <= 0) {
        player.isReloading = false;
        player.arrowCount = player.maxArrows || 6;
      }
    }
  },

  // 1. NORMAL ATTACK [SPACEBAR]: Rapid Broadhead Arrow Shot
  onAttack(player, target, spawnProjectile, fx, enemyManager) {
    if (player.isReloading) return false;

    if (player.arrowCount <= 0) {
      player.isReloading = true;
      player.reloadTimer = this.reloadDuration || 65;
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 10, "RELOADING...", false, "#ffd166");
      return false;
    }

    player.arrowCount--;
    if (Sound && Sound.playArrowShoot) Sound.playArrowShoot();

    let angle = player.aimAngle;
    if (!target) {
      angle = player.facing === "right" ? 0 : Math.PI;
    }

    const speed = 6.2;
    if (spawnProjectile) {
      spawnProjectile({
        type: "arrow",
        x: player.x + (player.facing === "right" ? 28 : -4),
        y: player.y + 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: angle,
        damage: 12 + (player.bonusDamage || 0) + Math.floor((player.level - 1) * 1.5),
        isHeavyKnockback: Math.random() < 0.35,
        isStun: Math.random() < 0.2
      });
    }
    return true;
  },

  // 2. SKILL 1 [KEY J / 1]: FALCON DIVE STRIKE (Targeted Aerial Raptor Ambush)
  onSkill1(player, target, spawnProjectile, fx, enemyManager) {
    if (!player.falconCompanion || player.falconCompanion.state !== "HOVERING") return false;

    if (Sound && Sound.playFalconScreech) Sound.playFalconScreech();

    const targetX = target && target.isAlive ? target.x + 12 : player.x + (player.facing === "right" ? 180 : -180);
    const targetY = target && target.isAlive ? target.y + 12 : player.y + 12;

    player.falconCompanion.triggerStrike(target, targetX, targetY);
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 10, "FALCON STRIKE! 🦅", true, "#ffd166");
    return true;
  },

  // 3. SKILL 2 [KEY K / 2]: TRIPLE ARROW VOLLEY (3-Way Broadhead Spread)
  onSkill2(player, target, spawnProjectile, fx, enemyManager) {
    if (Sound && Sound.playArrowShoot) Sound.playArrowShoot();

    const baseAngle = player.aimAngle || (player.facing === "right" ? 0 : Math.PI);
    [-0.24, 0, 0.24].forEach((offset) => {
      if (spawnProjectile) {
        spawnProjectile({
          type: "arrow",
          x: player.x + (player.facing === "right" ? 28 : -4),
          y: player.y + 12,
          vx: Math.cos(baseAngle + offset) * 6.8,
          vy: Math.sin(baseAngle + offset) * 6.8,
          angle: baseAngle + offset,
          damage: 14 + (player.bonusDamage || 0),
          isHeavyKnockback: true
        });
      }
    });
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 10, "TRIPLE VOLLEY! 🏹", true, "#52b788");
    return true;
  },

  // 4. SKILL 3 [KEY L / 3]: GALE WINDSTRIDER SNIPE (Penetrating Screen-Crossing Wind Bolt)
  onSkill3(player, target, spawnProjectile, fx, enemyManager) {
    if (Sound && Sound.playArrowShoot) Sound.playArrowShoot();
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(player.x + 12, player.y + 12, "#38bdf8", 20);
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 10, "GALE SNIPER! 🌪️", true, "#38bdf8");

    const angle = player.aimAngle || (player.facing === "right" ? 0 : Math.PI);
    if (spawnProjectile) {
      spawnProjectile({
        type: "arrow",
        x: player.x + (player.facing === "right" ? 30 : -6),
        y: player.y + 12,
        vx: Math.cos(angle) * 9.5,
        vy: Math.sin(angle) * 9.5,
        angle: angle,
        damage: 32 + (player.bonusDamage || 0),
        isHeavyKnockback: true,
        isStun: true
      });
    }
    return true;
  },

  onSkillUpdate() {}
};