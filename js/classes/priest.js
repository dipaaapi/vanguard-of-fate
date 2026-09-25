import { Sound } from "../audio.js";
import { GuardianAngelCompanion } from "../summons/angel.js";

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
  speed: 1.45,
  maxHp: 115,
  attackCooldown: 18,  // Normal Attack (Holy Smite Bolt)
  skill1Cooldown: 150, // 2.5s (Triage Heal)
  skill2Cooldown: 300, // 5.0s (Summon Angel)
  skill3Cooldown: 360, // 6.0s (Celestial Pillar of Retribution)
  sprites: {
    idle: priestIdle,
    run: priestRun,
    slash: priestCast,
    bash: priestCast
  },

  onInit(player) {
    if (!player.angelCompanions) {
      player.angelCompanions = [];
    }
  },

  // 1. NORMAL ATTACK [SPACEBAR]: Holy Wand Radiant Beam
  onAttack(player, target, spawnProjectile, fx, enemyManager) {
    let angle = player.aimAngle;
    if (target && target.isAlive) {
      angle = Math.atan2(target.y - player.y, target.x - player.x);
    }

    if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();

    if (spawnProjectile) {
      spawnProjectile({
        type: "force_sphere",
        x: player.x + 12,
        y: player.y + 10,
        vx: Math.cos(angle) * 5.8,
        vy: Math.sin(angle) * 5.8,
        angle: angle,
        damage: 10 + (player.bonusDamage || 0) + Math.floor((player.level - 1) * 1.5)
      });
    }
    return true;
  },

  // 2. SKILL 1 [KEY J / 1]: PRIORITY TRIAGE HEAL (Heals Most Injured Ally or Self)
  onSkill1(player, target, spawnProjectile, fx, enemyManager, spawnSpell) {
    if (!player.angelCompanions) player.angelCompanions = [];
    player.angelCompanions = player.angelCompanions.filter((a) => a.isAlive);

    const candidates = [
      { entity: player, hp: player.hp, maxHp: player.maxHp, isAngel: false }
    ];

    player.angelCompanions.forEach((a) => {
      if (a.isAlive) {
        candidates.push({ entity: a, hp: a.hp, maxHp: a.maxHp, isAngel: true });
      }
    });

    candidates.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
    const chosen = candidates[0];

    const healAmount = chosen.isAngel ? 35 : Math.round(player.maxHp * 0.22);
    chosen.entity.hp = Math.min(chosen.maxHp, chosen.entity.hp + healAmount);

    if (chosen.isAngel) {
      chosen.entity.lifespan = Math.min(chosen.entity.maxLifespan, chosen.entity.lifespan + 300);
    }

    if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();
    if (fx && fx.spawnDamagePopup) {
      fx.spawnDamagePopup(chosen.entity.x + 10, chosen.entity.y - 10, `+${healAmount} HEAL! ✨`, true, "#4ade80");
    }

    if (spawnSpell) {
      spawnSpell({
        type: "holy_burst",
        x: chosen.entity.x + 10,
        y: chosen.entity.y + 10,
        radius: 4,
        maxRadius: 28,
        color: "#ffd166",
        alpha: 1.0
      });
    }

    return true;
  },

  // 3. SKILL 2 [KEY K / 2]: SUMMON GUARDIAN ANGEL (Maximum of 2 Winged Angels)
  onSkill2(player, target, spawnProjectile, fx, enemyManager, spawnSpell) {
    if (!player.angelCompanions) player.angelCompanions = [];
    player.angelCompanions = player.angelCompanions.filter((a) => a.isAlive);

    if (player.angelCompanions.length >= 2) {
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 10, "MAX ANGELS ACTIVE!", false, "#ffd166");
      return false;
    }

    if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();
    const angelMaxHp = Math.round(player.maxHp * 0.65);

    player.angelCompanions.push(
      new GuardianAngelCompanion(
        player.x + (player.angelCompanions.length === 0 ? -30 : 30),
        player.y - 16,
        angelMaxHp
      )
    );

    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 10, "ANGEL SUMMONED! 👼", true, "#00f0ff");

    if (spawnSpell) {
      spawnSpell({
        type: "holy_burst",
        x: player.x + 10,
        y: player.y - 6,
        radius: 4,
        maxRadius: 32,
        color: "#ffffff",
        alpha: 1.0
      });
    }

    return true;
  },

  // 4. SKILL 3 [KEY L / 3]: CELESTIAL PILLAR OF RETRIBUTION (Holy Wrath AoE & Speed Aura)
  onSkill3(player, target, spawnProjectile, fx, enemyManager, spawnSpell) {
    if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(player.x + 12, player.y + 12, "#ffd166", 26);
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 12, "DIVINE WRATH! ☀️", true, "#ffd166");

    player.buffs.moveSpeed = 180; // 3 seconds haste speed buff

    if (enemyManager && enemyManager.enemies) {
      enemyManager.enemies.forEach((e) => {
        if (e.isAlive && Math.hypot(e.x - player.x, e.y - player.y) < 75) {
          const ang = Math.atan2(e.y - player.y, e.x - player.x);
          enemyManager.damage(e, 46 + (player.bonusDamage || 0), ang, true, fx, player.lootManager, 20, false, player);
        }
      });
    }

    if (spawnSpell) {
      spawnSpell({
        type: "holy_burst",
        x: player.x + 10,
        y: player.y + 10,
        radius: 6,
        maxRadius: 52,
        color: "#ffd166",
        alpha: 1.0
      });
    }
    return true;
  },

  onSkillUpdate() {}
};