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
  maxHp: 90,
  speed: 1.35,
  attackCooldown: 16,  // Space Normal Attack (Arcane Dart)
  skill1Cooldown: 180, // 3.0s (Magma Meteor)
  skill2Cooldown: 300, // 5.0s (Thunderstorm Tempest)
  skill3Cooldown: 240, // 4.0s (Blizzard Frost Nova)
  sprites: {
    idle: mageIdle,
    run: mageIdle,
    slash: mageCast,
    bash: mageCast
  },

  // 1. NORMAL ATTACK [SPACEBAR]: Rapid Arcane Mana Dart Projectile
  onAttack(player, target, spawnProj, fx, enemyManager) {
    let angle = player.aimAngle;
    if (target && target.isAlive) {
      angle = Math.atan2(target.y - player.y, target.x - player.x);
    }

    if (spawnProj) {
      spawnProj({
        type: "force_sphere",
        x: player.x + 12,
        y: player.y + 12,
        vx: Math.cos(angle) * 5.5,
        vy: Math.sin(angle) * 5.5,
        angle: angle,
        damage: 22 + (player.bonusDamage || 0)
      });
    }
    return true;
  },

  // 2. SKILL 1 [KEY J / 1]: MAGMA METEOR STRIKE (Heavy Area Bombardment)
  onSkill1(player, target, spawnProj, fx, enemyManager, spawnSpell) {
    const targetX = target && target.isAlive ? target.x + 10 : player.x + (player.facing === "right" ? 85 : -85);
    const targetY = target && target.isAlive ? target.y + 10 : player.y;

    if (spawnSpell) {
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
        maxExplosionRadius: 46,
        damageDealt: false
      });
    }
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 10, "METEOR FALL! 🔥", true, "#ff5500");
    return true;
  },

  // 3. SKILL 2 [KEY K / 2]: THUNDERSTORM TEMPEST (Area Lightning Field)
  onSkill2(player, target, spawnProj, fx, enemyManager, spawnSpell) {
    const stormCenterX = target && target.isAlive ? target.x + 10 : player.x + (player.facing === "right" ? 50 : -50);
    const stormCenterY = target && target.isAlive ? target.y + 10 : player.y;

    if (spawnSpell) {
      spawnSpell({
        type: "thunderstorm",
        centerX: stormCenterX,
        centerY: stormCenterY,
        radius: 65,
        duration: 300,
        strikeInterval: 14,
        strikeTimer: 0,
        activeBolts: []
      });
    }
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 10, "THUNDERSTORM! ⚡", true, "#ffd166");
    return true;
  },

  // 4. SKILL 3 [KEY L / 3]: BLIZZARD FROST NOVA (Instant Radial Freeze & Ice Shards)
  onSkill3(player, target, spawnProj, fx, enemyManager) {
    if (fx && fx.spawnFreezeEffect) fx.spawnFreezeEffect(player.x + 12, player.y + 12, 18);
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(player.x + 12, player.y + 12, "#00f0ff", 22);
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 12, player.y - 10, "FROST NOVA! ❄️", true, "#00f0ff");

    if (enemyManager && enemyManager.enemies) {
      enemyManager.enemies.forEach((e) => {
        if (e.isAlive && Math.hypot(e.x - player.x, e.y - player.y) < 68) {
          const ang = Math.atan2(e.y - player.y, e.x - player.x);
          enemyManager.damage(e, 22 + (player.bonusDamage || 0), ang, true, fx, player.lootManager, 12, true, player);
        }
      });
    }
    return true;
  },

  onSkillUpdate() {}
};