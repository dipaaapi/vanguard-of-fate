import { Sound } from "../audio.js";

// ========================================================
// PRIEST CLASS MECHANICS (HEAL & GUARDIAN ANGEL SUMMON)
// ========================================================
// The look is the player's Avatar with a white robe and scepter (js/classes/job.js).
export const PriestClass = {
  id: "priest",
  name: "Priest",
  title: "Holy Shepherd",
  speed: 1.4,
  maxHp: 110,
  attackCooldown: 120,
  cooldown: 180, // Cooldown of K (Summon)
  range: 200,

  // KEY J: PRIORITY HEAL, once every 2 s (Priest: 8% HP | Angel: +5 HP at +180 ticks Lifespan)
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

    // Pick the lowest HP percentage
    candidates.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
    const chosen = candidates[0];

    const healAmount = Math.round((chosen.isAngel ? 5 : player.maxHp * 0.08) * (player.healMult || 1) * ((player.timeMods && player.timeMods.heal) || 1));
    chosen.entity.hp = Math.min(chosen.maxHp, chosen.entity.hp + healAmount);

    if (chosen.isAngel) {
      chosen.entity.lifespan = Math.min(chosen.entity.maxLifespan, chosen.entity.lifespan + 180);
    }

    if (Sound && Sound.playHeal) Sound.playHeal();

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

  // KEY L: Holy Light — a striking holy light (strong against Undead and Demons)
  cooldown2: 80,
  onSkill2(player, target, spawnSpell) {
    const a = player.aimAngle;
    spawnSpell({ type: "bolt", x: player.x + 10, y: player.y + 8, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, damage: 28, elem: "holy", color: "#fde68a", size: 3, range: 200 });
    if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();
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
      maxLifespan: 1080,  // Can be extended with Heal (J)
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
