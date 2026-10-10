import { Avatar } from "../avatar/avatar.js";
import { summonedGarb } from "../avatar/options.js";

// ==================== JOB LOOK (after the Job Awakening) ====================
// The hero keeps the same body, skin, eyes and hair from the Character Creator;
// only the class changes the outfit and weapon (built the same way as the Novice and NPCs).

// Frame count per state (for Player.update animation timing)
export const FRAME_COUNTS = { idle: 8, run: 4, slash: 2, bash: 2 };
const placeholderSprites = () =>
  Object.fromEntries(Object.entries(FRAME_COUNTS).map(([k, n]) => [k, new Array(n).fill(null)]));

// Gear per class (see the mentors in js/npc/roster.js for inspiration); `job` adds the class's
// signature details from its splash art (js/avatar/jobmarks.js)
const JOB_GEAR = {
  knight: { job: "knight", outfit: "armor", outfitColor: "#2c4f8a", legColor: "#7d8c9e", bootColor: "#5d6b7e", gloves: "leather",
    cape: "#1f3b70", weapon: "lance", shield: "tower" },
  archer: { job: "archer", outfit: "vest", outfitColor: "#2f6b3f", legColor: "#4a3a28", bootColor: "#5e3b1a", gloves: "leather",
    weapon: "bow", quiver: true },
  priest: { job: "priest", outfit: "robe", outfitColor: "#f4f0fa", legColor: "#c9a063", bootColor: "#c9a063", cape: "#e9dfc4",
    weapon: "scepter" },
  mage: { job: "mage", outfit: "robe", outfitColor: "#4b3388", legColor: "#2b2b33", bootColor: "#2b2b33", headgear: "hat",
    cape: "#1d1a44", weapon: "staff" },
  fighter: { job: "fighter", outfit: "vest", outfitColor: "#b8322f", legColor: "#24202c", legs: "pants", bootColor: "#2b2b33",
    gloves: "wraps", headgear: "headband", weapon: "none" }
};

// Which Avatar animation each player state uses (K is the "cast/strike" pose)
const ANIM_MAP = { bash: "attack" };

// Look = body from the Character Creator + class outfit + held gear (bag)
function lookFor(classId, baseConfig, gearLook = {}) {
  // Earth clothes (a Character Creator preview) are first turned into Aethelgard garb
  return { ...summonedGarb(baseConfig || {}), ...(JOB_GEAR[classId] || {}), ...gearLook };
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
