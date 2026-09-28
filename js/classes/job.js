import { Avatar } from "../avatar/avatar.js";

// ==================== JOB LOOK (after the Job Awakening) ====================
// The hero keeps the same body, skin, eyes and hair from the Character Creator;
// only the class changes the outfit and weapon (built the same way as the Novice and NPCs).

// Frame count per state (for Player.update animation timing)
export const FRAME_COUNTS = { idle: 8, run: 4, slash: 2, bash: 2 };
const placeholderSprites = () =>
  Object.fromEntries(Object.entries(FRAME_COUNTS).map(([k, n]) => [k, new Array(n).fill(null)]));

// Gear per class (see the mentors in js/npc/roster.js for inspiration)
const JOB_GEAR = {
  knight: { outfit: "armor", outfitColor: "#2c4f8a", legColor: "#7d8c9e", bootColor: "#2b2b33", gloves: "leather",
    cape: "#8a2c2c", weapon: "lance", shield: "tower" },
  archer: { outfit: "vest", outfitColor: "#2f6b3f", legColor: "#4a3a28", bootColor: "#5e3b1a", gloves: "leather",
    weapon: "bow", quiver: true },
  priest: { outfit: "robe", outfitColor: "#f2ecf8", legColor: "#c9a063", bootColor: "#c9a063", cape: "#c9a063",
    weapon: "scepter" },
  mage: { outfit: "robe", outfitColor: "#5a3d91", legColor: "#2b2b33", bootColor: "#2b2b33", headgear: "hat",
    weapon: "staff" },
  fighter: { outfit: "vest", outfitColor: "#c73e3a", legColor: "#2b2b33", legs: "pants", bootColor: "#2b2b33",
    gloves: "wraps", headgear: "headband", weapon: "none" }
};

// Which Avatar animation each player state uses (K is the "cast/strike" pose)
const ANIM_MAP = { bash: "attack" };

// Look = body from the Character Creator + class outfit + held gear (bag)
function lookFor(classId, baseConfig, gearLook = {}) {
  return { ...(baseConfig || {}), ...(JOB_GEAR[classId] || {}), ...gearLook };
}

// Replaces the player's Avatar when the worn gear changes (called by Bag.onChange)
export function refreshLook(player) {
  const hd = player.heroData;
  if (!hd) return;
  const avatar = new Avatar(lookFor(hd.id, player.avatarConfig || hd.avatarConfig, player.bag.look()));
  hd.avatar = avatar;
  hd.avatarConfig = avatar.config;
}

// Returns the class with its own Avatar built from the player's look
export function equipJob(classDef, baseConfig) {
  const look = lookFor(classDef.id, baseConfig);
  const avatar = new Avatar(look);
  return {
    ...classDef,
    sprites: placeholderSprites(),
    animMap: ANIM_MAP,
    avatar,
    avatarConfig: avatar.config
  };
}
