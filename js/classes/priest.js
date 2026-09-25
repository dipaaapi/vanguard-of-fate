import { Sound } from "../audio.js";

const _ = 0;
const K = "#14171d"; // Dark outline
const W1 = "#ffffff"; // Holy Silk White
const W2 = "#d9e2ec"; // Robe Fold Shadow
const W3 = "#9fb3c8"; // Deep Robe Crease
const G1 = "#ffd166"; // Divine Gold Highlight
const G2 = "#e0a926"; // Liturgical Gold Trim
const S1 = "#ffe8d6"; // Fair Skin Tone
const S2 = "#f3c5a5"; // Skin Shadow
const S3 = "#c78f6c"; // Jaw / Neck shadow
const M1 = "#8d5b32"; // Wooden Crucifix Staff
const B1 = "#4a2810"; // Boots

// ========================================================
// PRIEST 24x24 SPRITES (BALANSE AT KAPAREHO NG ARCHER)
// ========================================================

const priestIdle = [
  [
    [_,_,_,_,_,_,G2,G1,G1,G2,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,G2,G1,W1,W1,G1,G2,_,_,_,_,_,_,_],
    [_,_,_,_,W2,W1,W1,W1,W1,W1,W2,_,_,_,_,_,_,_],
    [_,_,_,W2,W1,S2,S1,S1,S2,W1,W2,_,_,_,_,_,_,_],
    [_,_,_,W2,S3,S2,K,S1,K,S2,S3,W2,_,_,_,_,_,_],
    [_,_,_,_,W2,S3,S1,S1,S1,S3,W2,_,_,_,_,_,M1,_],
    [_,_,_,_,_,W3,S3,S2,S3,W3,_,_,_,_,_,G1,M1,G1],
    [_,_,_,_,W2,W1,G2,G1,G2,W1,W2,_,_,_,_,_,M1,_],
    [_,_,_,W2,W1,W1,G2,G1,G2,W1,W1,W2,_,_,_,_,M1,_],
    [_,_,W2,W1,W1,W1,G2,G1,G2,W1,W1,W1,W2,_,_,_,M1,_],
    [_,_,W2,W1,W1,W1,G2,G1,G2,W1,W1,W1,W2,_,_,_,M1,_],
    [_,_,_,W2,W1,W1,G2,G1,G2,W1,W1,W2,_,_,_,_,M1,_],
    [_,_,_,_,W3,W2,G2,G1,G2,W2,W3,_,_,_,_,_,M1,_],
    [_,_,_,_,W3,W2,W2,W2,W2,W2,W3,_,_,_,_,_,M1,_],
    [_,_,_,_,W3,W3,W3,W3,W3,W3,W3,_,_,_,_,_,_,_],
    [_,_,_,_,_,S2,_,_,_,S2,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,B1,_,_,_,B1,_,_,_,_,_,_,_,_],
    [_,_,_,_,K,B1,_,_,_,B1,K,_,_,_,_,_,_,_]
  ],
  [
    [_,_,_,_,_,_,G2,G1,G1,G2,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,G2,G1,W1,W1,G1,G2,_,_,_,_,_,_,_],
    [_,_,_,_,W2,W1,W1,W1,W1,W1,W2,_,_,_,_,_,_,_],
    [_,_,_,W2,W1,S2,S1,S1,S2,W1,W2,_,_,_,_,_,_,_],
    [_,_,_,W2,S3,S2,K,S1,K,S2,S3,W2,_,_,_,_,_,_],
    [_,_,_,_,W2,S3,S1,S1,S1,S3,W2,_,_,_,_,_,M1,_],
    [_,_,_,_,_,W3,S3,S2,S3,W3,_,_,_,_,_,G1,M1,G1],
    [_,_,_,_,W2,W1,G2,G1,G2,W1,W2,_,_,_,_,_,M1,_],
    [_,_,_,W2,W1,W1,G2,G1,G2,W1,W1,W2,_,_,_,_,M1,_],
    [_,_,W2,W1,W1,W1,G2,G1,G2,W1,W1,W1,W2,_,_,_,M1,_],
    [_,_,W2,W1,W1,W1,G2,G1,G2,W1,W1,W1,W2,_,_,_,M1,_],
    [_,_,_,W2,W1,W1,G2,G1,G2,W1,W1,W2,_,_,_,_,M1,_],
    [_,_,_,_,W3,W2,G2,G1,G2,W2,W3,_,_,_,_,_,M1,_],
    [_,_,_,_,W3,W2,W2,W2,W2,W2,W3,_,_,_,_,_,M1,_],
    [_,_,_,_,W3,W3,W3,W3,W3,W3,W3,_,_,_,_,_,_,_],
    [_,_,_,_,_,S2,_,_,_,S2,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,B1,_,_,_,B1,_,_,_,_,_,_,_,_],
    [_,_,_,_,K,B1,_,_,_,B1,K,_,_,_,_,_,_,_]
  ]
];

const priestRun = [
  [
    [_,_,_,_,_,_,G2,G1,G1,G2,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,G2,G1,W1,W1,G1,G2,_,_,_,_,_,_,_],
    [_,_,_,_,W2,W1,W1,W1,W1,W1,W2,_,_,_,_,_,_,_],
    [_,_,_,W2,W1,S2,S1,S1,S2,W1,W2,_,_,_,_,_,_,_],
    [_,_,_,W2,S3,S2,K,S1,K,S2,S3,W2,_,_,_,_,_,_],
    [_,_,_,_,W2,S3,S1,S1,S1,S3,W2,_,_,_,_,_,M1,_],
    [_,_,_,_,_,W3,S3,S2,S3,W3,_,_,_,_,_,G1,M1,G1],
    [_,_,_,_,W2,W1,G2,G1,G2,W1,W2,_,_,_,_,_,M1,_],
    [_,_,_,W2,W1,W1,G2,G1,G2,W1,W1,W2,_,_,_,_,M1,_],
    [_,_,W2,W1,W1,W1,G2,G1,G2,W1,W1,W1,W2,_,_,_,M1,_],
    [_,_,_,W2,W1,W1,G2,G1,G2,W1,W1,W2,_,_,_,_,M1,_],
    [_,_,_,_,W3,W2,W2,W2,W2,W2,W3,_,_,_,_,_,M1,_],
    [_,_,_,_,_,S2,_,_,_,_,S2,_,_,_,_,_,_,_],
    [_,_,_,_,B1,_,_,_,_,_,_,B1,_,_,_,_,_,_],
    [_,_,_,K,B1,_,_,_,_,_,_,B1,K,_,_,_,_,_]
  ],
  priestIdle[0],
  [
    [_,_,_,_,_,_,G2,G1,G1,G2,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,G2,G1,W1,W1,G1,G2,_,_,_,_,_,_,_],
    [_,_,_,_,W2,W1,W1,W1,W1,W1,W2,_,_,_,_,_,_,_],
    [_,_,_,W2,W1,S2,S1,S1,S2,W1,W2,_,_,_,_,_,_,_],
    [_,_,_,W2,S3,S2,K,S1,K,S2,S3,W2,_,_,_,_,_,_],
    [_,_,_,_,W2,S3,S1,S1,S1,S3,W2,_,_,_,_,_,M1,_],
    [_,_,_,_,_,W3,S3,S2,S3,W3,_,_,_,_,_,G1,M1,G1],
    [_,_,_,_,W2,W1,G2,G1,G2,W1,W2,_,_,_,_,_,M1,_],
    [_,_,_,W2,W1,W1,G2,G1,G2,W1,W1,W2,_,_,_,_,M1,_],
    [_,_,W2,W1,W1,W1,G2,G1,G2,W1,W1,W1,W2,_,_,_,M1,_],
    [_,_,_,W2,W1,W1,G2,G1,G2,W1,W1,W2,_,_,_,_,M1,_],
    [_,_,_,_,W3,W2,W2,W2,W2,W2,W3,_,_,_,_,_,M1,_],
    [_,_,_,_,_,_,S2,_,_,S2,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,_,B1,_,_,B1,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,K,B1,_,_,B1,K,_,_,_,_,_,_,_]
  ],
  priestIdle[1]
];

const priestCast = [
  [
    [_,_,_,_,_,_,G2,G1,G1,G2,_,_,_,_,_,G1,G1,G1],
    [_,_,_,_,_,G2,G1,W1,W1,G1,G2,_,_,_,G1,M1,G1],
    [_,_,_,_,W2,W1,W1,W1,W1,W1,W2,_,_,_,_,M1,_],
    [_,_,_,W2,W1,S2,S1,S1,S2,W1,W2,_,_,_,_,M1,_],
    [_,_,_,W2,S3,S2,K,S1,K,S2,S3,W2,_,_,_,M1,_],
    [_,_,_,_,W2,S3,S1,S1,S1,S3,W2,_,_,_,_,M1,_],
    [_,_,_,_,_,W3,S3,S2,S3,W3,_,_,_,_,_,M1,_],
    [_,_,_,_,W2,W1,G2,G1,G2,W1,W2,_,_,_,M1,_],
    [_,_,_,W2,W1,W1,G2,G1,G2,W1,W1,W2,_,M1,_],
    [_,_,W2,W1,W1,W1,G2,G1,G2,W1,W1,W1,W2,M1,_],
    [_,_,_,W2,W1,W1,G2,G1,G2,W1,W1,W2,_,M1,_],
    [_,_,_,_,W3,W2,W2,W2,W2,W2,W3,_,_,M1,_],
    [_,_,_,_,_,S2,_,_,_,S2,_,_,_,_,_,_,_,_],
    [_,_,_,_,_,B1,_,_,_,B1,_,_,_,_,_,_,_,_],
    [_,_,_,_,K,B1,_,_,_,B1,K,_,_,_,_,_,_,_]
  ],
  priestIdle[0]
];

// ========================================================
// PRIEST CLASS MECHANICS (HEAL & GUARDIAN ANGEL SUMMON)
// ========================================================
export const PriestClass = {
  id: "priest",
  name: "Priest",
  title: "Holy Shepherd",
  speed: 1.4,
  maxHp: 110,
  attackCooldown: 25,
  cooldown: 180, // Cooldown ng K (Summon)
  sprites: {
    idle: priestIdle,
    run: priestRun,
    slash: priestCast,
    bash: priestCast
  },

  // KEY J: PRIORITY HEAL (Priest: 10% HP | Angel: +5 HP at +180 ticks Lifespan)
  onAttack(player, target, spawnSpell) {
    if (!player.angels) player.angels = [];

    const candidates = [
      { entity: player, hp: player.hp, maxHp: player.maxHp, isAngel: false }
    ];

    player.angels.forEach((a) => {
      if (a.isAlive) {
        candidates.push({ entity: a, hp: a.hp, maxHp: a.maxHp, isAngel: true });
      }
    });

    // Piliin ang may pinakamababang porsyento ng HP
    candidates.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
    const chosen = candidates[0];

    const healAmount = chosen.isAngel ? 5 : Math.round(player.maxHp * 0.10);
    chosen.entity.hp = Math.min(chosen.maxHp, chosen.entity.hp + healAmount);

    if (chosen.isAngel) {
      chosen.entity.lifespan = Math.min(chosen.entity.maxLifespan, chosen.entity.lifespan + 180);
    }

    if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();

    if (spawnSpell) {
      spawnSpell({
        type: "holy_burst",
        x: chosen.entity.x + 10,
        y: chosen.entity.y + 10,
        radius: 4,
        maxRadius: 24,
        color: "#ffd166",
        alpha: 1.0
      });
    }

    return true;
  },

  // KEY K: SUMMON GUARDIAN ANGEL (Maximum of 2 Angels)
  onSkill(player, target, spawnSpell) {
    if (!player.angels) player.angels = [];
    player.angels = player.angels.filter((a) => a.isAlive);

    if (player.angels.length >= 2) return false;

    if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();
    const angelMaxHp = Math.round(player.maxHp * 0.5);

    player.angels.push({
      id: Math.random(),
      x: player.x + (player.angels.length === 0 ? -24 : 24),
      y: player.y - 12,
      maxHp: angelMaxHp,
      hp: angelMaxHp,
      damage: 18,
      lifespan: 720,      // 12s standard lifespan
      maxLifespan: 1080,  // Kayang palawigin sa tulong ng Heal (J)
      attackCooldown: 0,
      isAttacking: false,
      attackTimer: 0,
      isAlive: true,
      animTimer: 0,
      hitTimer: 0
    });

    if (spawnSpell) {
      spawnSpell({
        type: "holy_burst",
        x: player.x + 10,
        y: player.y - 6,
        radius: 4,
        maxRadius: 28,
        color: "#ffffff",
        alpha: 1.0
      });
    }

    return true;
  }
};