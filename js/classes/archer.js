import { Sound } from "../audio.js";

// ==================== ARCHER (Elven Windstrider) ====================
// Ang itsura ay ang Avatar ng player na may vest, busog at quiver (js/classes/job.js).
export const ArcherClass = {
  id: "archer",
  name: "Archer",
  title: "Elven Windstrider",
  speed: 1.6,
  maxHp: 95,
  attackCooldown: 20,
  cooldown: 220,
  reloadDuration: 75,
  range: 220,          // abot ng palaso

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

  // KEY L: Arrow Shower — tatlong ulan ng palaso sa lugar ng target (elementong hangin)
  cooldown2: 300,
  onSkill2(player, target, spawnProjectile) {
    const a = player.aimAngle;
    const x = target ? target.x + 12 : player.x + 10 + Math.cos(a) * 110;
    const y = target ? target.y + 12 : player.y + 12 + Math.sin(a) * 110;
    spawnProjectile({ type: "rain", x, y, radius: 42, waves: 3, every: 15, timer: 0, damage: 18, elem: "wind", color: "#a3e635" });
    if (Sound && Sound.playArrowShoot) Sound.playArrowShoot();
    return true;
  },

  onSkillUpdate() {}
};
