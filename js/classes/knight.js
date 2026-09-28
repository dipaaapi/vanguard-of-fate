import { Sound } from "../audio.js";

// ==================== KNIGHT (Aegis Lancer) ====================
// Ang itsura ay ang Avatar ng player na may baluti, tower shield at lance (js/classes/job.js).
//   J = Bastion Forcefield: pulso ng kuryente sa paligid (tumatama sa lahat ng malapit) at
//       kalahating pinsala sa bayani habang bukas ang panangga.
//   K = Piercing Lance Charge: sumusugod pasulong at tumutusok sa lahat ng madaanan.

export const KnightClass = {
  id: "knight",
  name: "Knight",
  title: "Aegis Lancer",
  speed: 1.35,
  maxHp: 130,
  attackCooldown: 28,
  cooldown: 180,
  range: 60,           // abot ng pagtutok (malapitan)

  // KEY J: Bastion Forcefield
  onAttack(player, target, spawnProjectile) {
    spawnProjectile({ type: "shockwave", x: player.x + 10, y: player.y + 14, r: 6, max: 38, grow: 3, damage: 18, hit: new Set(), color: "#5ee7ff", push: 14, elem: "wind" });
    player.guardTimer = 36;       // −35% pinsala habang aktibo (js/player.js takeDamage)
    if (Sound.playHolyBurst) Sound.playHolyBurst();
    return true;
  },

  // KEY K: Piercing Lance Charge
  onSkill(player, target, spawnProjectile) {
    const angle = player.aimAngle;
    player.chargeTimer = 18;
    player.chargeVx = Math.cos(angle) * 5.2;
    player.chargeVy = Math.sin(angle) * 5.2;
    spawnProjectile({ type: "follow", owner: player, angle, offset: 16, radius: 18, life: 20, damage: 32, hit: new Set(), color: "#ffd166", push: 22 });
    if (Sound.playSlash) Sound.playSlash();
    return true;
  },

  // KEY L: Brandish Spear — malapad na hampas sa harap (malakas, mabagal)
  cooldown2: 240,
  onSkill2(player, target, spawnProjectile) {
    const angle = player.aimAngle;
    spawnProjectile({ type: "follow", owner: player, angle, offset: 22, radius: 28, life: 8, damage: 48, hit: new Set(), color: "#e2e8f0", push: 26 });
    spawnProjectile({ type: "shockwave", x: player.x + 10 + Math.cos(angle) * 22, y: player.y + 12 + Math.sin(angle) * 22, r: 4, max: 26, grow: 4, damage: 0, hit: new Set(), color: "#e2e8f0" });
    if (Sound.playSlash) Sound.playSlash();
    return true;
  },

  onUpdate(player) {
    if (player.guardTimer > 0) player.guardTimer--;
    if (player.chargeTimer > 0) {
      player.chargeTimer--;
      player.x += player.chargeVx;
      player.y += player.chargeVy;
    }
  }
};
