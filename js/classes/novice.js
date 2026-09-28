import { Sound } from "../audio.js";
import { Avatar } from "../avatar/avatar.js";

// ==================== NOVICE (panimulang anyo ng tinawag na bayani) ====================
// Walang class pa: punyal at kahoy na buckler lang. Ang itsura ay galing sa Character
// Creator (modular Avatar). Sa Lv 10 (tapos ang Platform 1) magaganap ang Job Awakening.
//
// J = Dagger Jab (maikling saksak sa direksyon ng target)
// K = Dodge Roll (mabilis na gulong, hindi tinatamaan habang gumugulong)

// Bilang ng frame bawat state (ginagamit ng Player.update para sa animation timing).
// Ang idle ay 8 "tick" para mabagal ang paghinga (Avatar: 2 frame × 4).
const FRAME_COUNTS = { idle: 8, run: 4, slash: 2, bash: 4 };

const NOVICE_BASE = {
  id: "novice",
  name: "Novice",
  title: "Summoned Wanderer",
  maxHp: 100,
  speed: 1.4,
  attackCooldown: 18,
  cooldown: 150,
  range: 60,           // punyal: malapitan
  sprites: Object.fromEntries(Object.entries(FRAME_COUNTS).map(([k, n]) => [k, new Array(n).fill(null)])),

  // KEY J: Dagger Jab
  onAttack(player, target, spawnProjectile) {
    const angle = player.aimAngle;
    spawnProjectile({
      type: "dagger_slash",
      x: player.x + 10 + Math.cos(angle) * 14,
      y: player.y + 12 + Math.sin(angle) * 12,
      angle,
      radius: 14,
      life: 8,
      damage: 12,
      hit: new Set()
    });
    if (Sound.playSlash) Sound.playSlash();
    return true;
  },

  // KEY K: Dodge Roll — sa direksyon na hinaharap
  onSkill(player) {
    const d = player.dir || "side";
    const vx = d === "side" ? (player.facing === "right" ? 1 : -1) : 0;
    const vy = d === "down" ? 1 : d === "up" ? -1 : 0;
    player.rollTimer = 14;
    player.rollDuration = 14;    // para sa animation (js/player.js drawRolling)
    player.rollGhosts = [];
    player.rollVx = vx * 4.2;
    player.rollVy = vy * 4.2;
    player.invulnTimer = 18;
    if (Sound.playDash) Sound.playDash();
    return true;
  },

  // KEY L: Throw Stone (klasikong skill ng Novice sa Ragnarok) — batong may elementong lupa
  cooldown2: 60,
  onSkill2(player, target, spawnProjectile) {
    const a = player.aimAngle;
    spawnProjectile({ type: "bolt", x: player.x + 10, y: player.y + 10, vx: Math.cos(a) * 4.5, vy: Math.sin(a) * 4.5, damage: 9, elem: "earth", color: "#a16207", size: 2, range: 160 });
    return true;
  },

  onUpdate(player) {
    if (player.rollTimer > 0) {
      player.rollTimer--;
      player.x += player.rollVx;
      player.y += player.rollVy;
    }
  }
};

// config = galing sa Character Creator; name = pangalan ng bayani (HUD)
export function getNovice(config, name = "") {
  const avatar = new Avatar(config);
  return {
    ...NOVICE_BASE,
    name: name || NOVICE_BASE.name,
    avatar,
    avatarConfig: avatar.config
  };
}
