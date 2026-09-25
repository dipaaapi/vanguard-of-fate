import { parseSprite } from "../sprite.js";
import { Sound } from "../audio.js";

// ==================== PALETTE SYMBOLS ====================
// H = Steel Armor, h = Dark Steel, S = Skin, O = Visor Glow, 1 = Outline
// R = Red Plume, 4 = Silver Lance Shaft, 5 = Lance Tip, B = Tower Shield Gold Trim, G = Tower Shield Plate

const knightIdle = [
  parseSprite([
    "..........1111..........",
    "........11RRRR11........", // Crimson Helm Plume
    ".......1HHHHHHHH1.......",
    ".......1H111111H1.......",
    ".......111SOOS111...5...", // Long Pointed Lance Tip (5)
    "........11SOOS11...555..",
    "........11111111...545..",
    "......11HHHHHHHH11..4...",
    ".....1BBGGGGGGGG11..4...", // Heavy Gold-Trimmed Tower Shield (B, G)
    ".....1BBGGGGGGGG11..4...",
    ".....1BBGGGGGGGG11..4...",
    ".....1BBGGGGGGGG11..4...",
    "......1BBGGGGGG11...4...",
    ".......11HHHH11.....4...",
    "........1HHHH1......4...",
    "........1hhhh1......4...",
    "........1hhhh1......4...",
    "........1hhhh1......1...",
    ".......111..111.........",
    ".......1H1..1H1.........",
    ".......111..111.........",
    "........................",
    "........................",
    "........................"
  ]),
  parseSprite([
    "..........1111..........",
    "........11RRRR11........",
    ".......1HHHHHHHH1.......",
    ".......1H111111H1.......",
    ".......111SOOS111...5...",
    "........11SOOS11...555..",
    "........11111111...545..",
    "......11HHHHHHHH11..4...",
    ".....1BBGGGGGGGG11..4...",
    ".....1BBGGGGGGGG11..4...",
    ".....1BBGGGGGGGG11..4...",
    ".....1BBGGGGGGGG11..4...",
    "......1BBGGGGGG11...4...",
    ".......11HHHH11.....4...",
    "........1HHHH1......4...",
    "........1hhhh1......4...",
    "........1hhhh1......4...",
    "........1hhhh1......1...",
    ".......111..111.........",
    ".......1H1..1H1.........",
    "........11...11.........",
    "........................",
    "........................",
    "........................"
  ])
];

// RUNNING WITH LANCE
const knightRun = [
  parseSprite([
    "..........1111..........",
    "........11RRRR11........",
    ".......1HHHHHHHH1.......",
    ".......1H111111H1...5...",
    ".......111SOOS111..555..",
    "........11SOOS11...545..",
    "........11111111....4...",
    ".....11HHHHHHHHHH11.4...",
    "....1BBGGGGGGGGGG11.4...",
    "....1BBGGGGGGGGGG11.4...",
    "....1BBGGGGGGGGGG11.4...",
    ".....1BBGGGGGGGG11..4...",
    "......111HHHH1111...4...",
    "........1hhhh1......4...",
    ".......11hhhh11.....1...",
    "......11H1..1H11........",
    "......111....111........",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ]),
  knightIdle[0]
];

// HOLD SHIELD STANCE (Aegis Bastion Stance)
const knightShieldStance = [
  parseSprite([
    "........................",
    "..........1111..........",
    "........11RRRR11........",
    ".......1HHHHHHHH1.......",
    "....111BBGGGGGGG1111....", // Locked Tower Shield Paharap
    "...1BBGGGGGGGGGGGGGB1...",
    "...1BBGGGGGGGGGGGGGB1...",
    "...1BBGGGGGGGGGGGGGB1.5.",
    "...1BBGGGGGGGGGGGGGB1555", // Nakaipit ang Lance sa gilid
    "...1BBGGGGGGGGGGGGGB1.4.",
    "...1BBGGGGGGGGGGGGGB1.4.",
    "....111BBGGGGGGG1111..4.",
    ".......1HHHHHHHH1.....4.",
    "........1hhhhhh1......4.",
    ".......11hhhhhh11.....1.",
    ".......111....111.......",
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

// PIERCING LANCE CHARGE POSE (Nakasulong paharap ang Lance)
const knightChargeStance = [
  parseSprite([
    "........................",
    "..........1111..........",
    "........11RRRR11........",
    ".......1HHHHHHHH1.......",
    ".......111SOOS111.......",
    "........11111111.4444455", // Forward Thrusting Lance
    ".....11HHHHHHHH1.4444555",
    "....1BBGGGGGGGG1.4444455",
    "....1BBGGGGGGGG1........",
    ".....1111HHHH111........",
    "........1hhhh1..........",
    ".......11hhhh11.........",
    "......11H1..1H11........",
    "......111....111........",
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

export const KnightClass = {
  id: "knight",
  name: "Knight",
  title: "Aegis Lancer",
  speed: 1.35,
  maxHp: 130,
  attackCooldown: 15,
  cooldown: 180, // Cooldown sa charge kapag binitawan
  sprites: {
    idle: knightIdle,
    run: knightRun,
    slash: knightShieldStance,
    bash: knightChargeStance
  },

  // KEY J (Hold): Bastion Forcefield State
  onAttack(player) {
    if (!player.isShieldGuarding) {
      player.isShieldGuarding = true;
      player.shieldAuraRadius = 32;
      player.shieldShockTimer = 0;
    }
  },

  // KEY SPACE: Piercing Lance Charge
  onSkill(player) {
    if (player.isChargingLance || player.isShieldGuarding) return;

    player.isChargingLance = true;
    player.chargeDuration = 28; // ~0.45s sustained blitz charge
    player.piercedEnemies = new Set(); // Para isang beses lang matamaan bawat kalaban habang tumatagos

    // Tukuyin ang direksyon ng charge
    let angle = player.aimAngle;
    if (player.facing === "right" && Math.abs(angle) > Math.PI / 2) angle = 0;
    if (player.facing === "left" && Math.abs(angle) < Math.PI / 2) angle = Math.PI;

    player.chargeVx = Math.cos(angle) * 5.8;
    player.chargeVy = Math.sin(angle) * 5.8;

    Sound.playSlash();
  },

  onSkillUpdate() {}
};