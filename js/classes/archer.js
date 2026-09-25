import { Sound } from "../audio.js";

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
  speed: 1.6,
  maxHp: 95,
  attackCooldown: 20,
  cooldown: 220,
  reloadDuration: 75,
  sprites: {
    idle: archerIdle,
    run: archerRun,
    slash: archerAttack,
    bash: archerAttack
  },

  onInit(player) {
    player.arrowCount = 5;
    player.maxArrows = 5;
    player.isReloading = false;
    player.reloadTimer = 0;

    // Falcon Companion
    player.falcon = {
      x: player.x - 18,
      y: player.y - 16,
      targetX: 0,
      targetY: 0,
      state: "HOVERING",
      wingTimer: 0,
      speed: 5.2,
      target: null,
      damageDealt: false
    };
  },

  onUpdate(player) {
    if (player.falcon && player.falcon.state === "HOVERING") {
      player.falcon.wingTimer = (player.falcon.wingTimer + 1) % 16;
      const targetHoverX = player.x + (player.facing === "right" ? -22 : 36);
      const targetHoverY = player.y - 16 + Math.sin(Date.now() / 180) * 3;
      player.falcon.x += (targetHoverX - player.falcon.x) * 0.12;
      player.falcon.y += (targetHoverY - player.falcon.y) * 0.12;
    }

    if (player.isReloading) {
      player.reloadTimer--;
      if (player.reloadTimer <= 0) {
        player.isReloading = false;
        player.arrowCount = player.maxArrows;
      }
    }
  },

  onAttack(player, target, spawnProjectile) {
    if (player.isReloading) return;

    if (player.arrowCount <= 0) {
      player.isReloading = true;
      player.reloadTimer = this.reloadDuration;
      return;
    }

    player.arrowCount--;
    if (Sound && Sound.playArrowShoot) Sound.playArrowShoot();

    let angle = player.aimAngle;
    if (!target) {
      angle = player.facing === "right" ? 0 : Math.PI;
    }

    const speed = 5.8;
    spawnProjectile({
      type: "arrow",
      x: player.x + (player.facing === "right" ? 28 : -4),
      y: player.y + 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle: angle,
      damage: 24,
      isHeavyKnockback: Math.random() < 0.45,
      isStun: Math.random() < 0.25
    });
  },

  onSkill(player, target) {
    if (!player.falcon || player.falcon.state !== "HOVERING") return;

    if (Sound && Sound.playFalconScreech) Sound.playFalconScreech();
    const f = player.falcon;
    f.state = "STRIKING";
    f.damageDealt = false;
    f.target = target && target.isAlive ? target : null;

    if (target && target.isAlive) {
      f.targetX = target.x + 12;
      f.targetY = target.y + 12;
    } else {
      const aimDist = 180;
      const angle = player.facing === "right" ? 0 : Math.PI;
      f.targetX = player.x + 12 + Math.cos(angle) * aimDist;
      f.targetY = player.y + 12 + Math.sin(angle) * aimDist;
    }
  },

  onSkillUpdate() {}
};