const _ = 0;
// 64-BIT MULTI-TONE MAGE PALETTE
const K  = "#090a0f"; // Dark Outline
const R1 = "#1e1338"; // Deep Robe Shadow
const R2 = "#3a206b"; // Robe Core Midtone
const R3 = "#5a379e"; // Robe Highlight
const R4 = "#7e52c7"; // Robe Bright Velvet
const G1 = "#d4af37"; // Gold Embroidered Trim
const G2 = "#ffd166"; // Gold Glint
const S1 = "#f8d5b8"; // Fair Skin Tone
const S2 = "#e09f67"; // Skin Shadow
const W1 = "#3a2312"; // Staff Wood Dark
const W2 = "#6f4520"; // Staff Wood Mid
const C1 = "#0077b6"; // Mana Crystal Core
const C2 = "#00f0ff"; // Mana Crystal Bright
const C3 = "#ffffff"; // Specular Glint

// IDLE ANIMATION (4-Frame Fluid Shading & Staff Floating)
const mageIdle = [
  // Frame 1
  [
    [_,_,_,_,_,_,_,R3,R4,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,R2,R3,R3,R4,_,_,_,_,_,_],
    [_,_,_,_,_,R1,R2,R3,R3,R4,_,_,_,C3,C2,_],
    [_,_,_,_,R1,R1,R2,R3,R3,R4,_,_,C2,C1,C2,_],
    [_,_,_,R1,G1,G2,G1,G1,G1,R4,_,_,_,C2,C3,_],
    [_,_,R1,R2,R2,R2,R2,R2,R2,R3,R4,_,_,W1,_,_],
    [_,_,_,_,K,S1,S1,S1,K,_,_,_,_,W2,_,_],
    [_,_,_,_,K,S2,S1,S2,K,_,_,_,W1,W2,_,_],
    [_,_,_,R1,G1,R2,R2,G1,R1,_,_,_,_,W2,_,_],
    [_,_,R1,R2,R3,R2,R2,R3,R2,R1,_,_,W1,W2,_,_],
    [_,R1,R2,R3,R4,R3,R3,R4,R3,R2,R1,_,_,W2,_,_],
    [_,R1,R2,R2,G1,R3,R3,G1,R2,R2,R1,_,W1,W2,_,_],
    [_,R1,R1,R2,R2,R2,R2,R2,R2,R1,R1,_,_,W2,_,_],
    [_,_,R1,R1,R2,R2,R2,R2,R1,R1,_,_,W1,W2,_,_],
    [_,_,_,K,R1,R1,R1,R1,R1,K,_,_,_,_,W2,_,_],
    [_,_,_,K,K,_,_,_,K,K,_,_,_,_,W1,_,_]
  ],
  // Frame 2 (Breathing & Staff Glow Pulse)
  [
    [_,_,_,_,_,_,_,R3,R4,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,R2,R3,R3,R4,_,_,_,_,_,_],
    [_,_,_,_,_,R1,R2,R3,R3,R4,_,_,_,C2,C3,_],
    [_,_,_,_,R1,R1,R2,R3,R3,R4,_,_,C3,C2,C1,_],
    [_,_,_,R1,G1,G2,G1,G1,G1,R4,_,_,_,C2,C2,_],
    [_,_,R1,R2,R2,R2,R2,R2,R2,R3,R4,_,_,W1,_,_],
    [_,_,_,_,K,S1,S1,S1,K,_,_,_,_,W2,_,_],
    [_,_,_,_,K,S2,S1,S2,K,_,_,_,W1,W2,_,_],
    [_,_,_,R1,G1,R2,R2,G1,R1,_,_,_,_,W2,_,_],
    [_,_,R1,R2,R3,R2,R2,R3,R2,R1,_,_,W1,W2,_,_],
    [_,R1,R2,R3,R4,R3,R3,R4,R3,R2,R1,_,_,W2,_,_],
    [_,R1,R2,R2,G1,R3,R3,G1,R2,R2,R1,_,W1,W2,_,_],
    [_,R1,R1,R2,R2,R2,R2,R2,R2,R1,R1,_,_,W2,_,_],
    [_,_,R1,R1,R2,R2,R2,R2,R1,R1,_,_,W1,W2,_,_],
    [_,_,_,K,R1,R1,R1,R1,R1,K,_,_,_,_,W2,_,_],
    [_,_,_,K,K,_,_,_,K,K,_,_,_,_,W1,_,_]
  ]
];

// CASTING STANCE (Itataas ang staff at magliliwanag ang orb)
const mageCast = [
  [
    [_,_,_,_,_,_,_,R3,R4,_,_,_,_,C3,C2,_],
    [_,_,_,_,_,_,R2,R3,R3,R4,_,C2,C1,C2,C3],
    [_,_,_,_,_,R1,R2,R3,R3,R4,_,_,C2,C3,_],
    [_,_,_,_,R1,R1,R2,R3,R3,R4,_,_,W1,W2,_],
    [_,_,_,R1,G1,G2,G1,G1,G1,R4,_,_,_,W2,_],
    [_,_,R1,R2,R2,R2,R2,R2,R2,R3,R4,_,W1,W2,_],
    [_,_,_,_,K,S1,S1,S1,K,_,_,_,_,W2,_],
    [_,_,_,_,K,S2,S1,S2,K,_,_,_,W1,W2,_],
    [_,_,_,R1,G1,R2,R2,G1,R1,_,_,_,W2,_],
    [_,_,R1,R2,R3,R2,R2,R3,R2,R1,_,W1,W2,_],
    [_,R1,R2,R3,R4,R3,R3,R4,R3,R2,R1,_,W2,_],
    [_,R1,R2,R2,G1,R3,R3,G1,R2,R2,R1,W1,W2,_],
    [_,R1,R1,R2,R2,R2,R2,R2,R2,R1,R1,_,W2,_],
    [_,_,R1,R1,R2,R2,R2,R2,R1,R1,_,W1,W2,_],
    [_,_,_,K,R1,R1,R1,R1,R1,K,_,_,_,W2,_],
    [_,_,_,K,K,_,_,_,K,K,_,_,_,_,W1,_]
  ],
  mageIdle[0]
];

export const MageClass = {
  id: "mage",
  name: "Mage",
  title: "Arcane Sage",
  maxHp: 85,
  speed: 1.3,
  attackCooldown: 100, // Meteor cooldown
  cooldown: 340,       // Thunderstorm cooldown
  sprites: {
    idle: mageIdle,
    run: mageIdle,
    slash: mageCast,
    bash: mageCast
  },

  onAttack(player, target, spawnSpell) {
    const targetX = target && target.isAlive ? target.x + 10 : player.x + (player.facing === "right" ? 85 : -85);
    const targetY = target && target.isAlive ? target.y + 10 : player.y;

    spawnSpell({
      type: "meteor",
      targetX: targetX,
      targetY: targetY,
      x: targetX - 60,
      y: -50,
      speedX: 2.8,
      speedY: 4.8,
      exploded: false,
      explosionRadius: 2,
      maxExplosionRadius: 42,
      damageDealt: false
    });
    return true;
  },

  onSkill(player, target, spawnSpell) {
    const stormCenterX = target && target.isAlive ? target.x + 10 : player.x + (player.facing === "right" ? 50 : -50);
    const stormCenterY = target && target.isAlive ? target.y + 10 : player.y;

    spawnSpell({
      type: "thunderstorm",
      centerX: stormCenterX,
      centerY: stormCenterY,
      radius: 60,
      duration: 320,
      strikeInterval: 14,
      strikeTimer: 0,
      activeBolts: []
    });
    return true;
  }
};