import { Sound } from "../audio.js";

// ==================== MAGE (Arcane Sage) ====================
// The look is the player's Avatar with a robe, hat and staff (js/classes/job.js).

export const MageClass = {
  id: "mage",
  name: "Mage",
  title: "Arcane Sage",
  maxHp: 85,
  speed: 1.3,
  attackCooldown: 100, // Meteor cooldown
  cooldown: 440,       // Thunderstorm cooldown (fairness pass: was 340, so with CDR the storm never stopped — balance-sim)
  range: 200,          // reach of Meteor and Thunderstorm

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
    if (Sound.playMeteorCast) Sound.playMeteorCast();
    return true;
  },

  // KEY L: Frost Diver — an ice spear that freezes the target (water element)
  cooldown2: 90,
  onSkill2(player, target, spawnSpell) {
    const a = player.aimAngle;
    spawnSpell({ type: "bolt", x: player.x + 10, y: player.y + 8, vx: Math.cos(a) * 4.2, vy: Math.sin(a) * 4.2, damage: 30, elem: "water", color: "#7dd3fc", size: 3, range: 200, freeze: 150 });
    if (Sound.playDarkCast) Sound.playDarkCast();
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
      strikeInterval: 20,
      strikeTimer: 0,
      activeBolts: []
    });
    if (Sound.playThunder) Sound.playThunder();
    return true;
  }
};
