import { Avatar } from "../avatar/avatar.js";

// ==================== JOB LOOK (pagkatapos ng Job Awakening) ====================
// Ang bayani ay pareho pa rin ang katawan, balat, mata at buhok mula sa Character Creator;
// ang class lang ang nagpapalit ng kasuotan at sandata (katulad ng pagbuo sa Novice at NPC).

// Bilang ng frame bawat state (para sa animation timing ng Player.update)
export const FRAME_COUNTS = { idle: 8, run: 4, slash: 2, bash: 2 };
export const placeholderSprites = () =>
  Object.fromEntries(Object.entries(FRAME_COUNTS).map(([k, n]) => [k, new Array(n).fill(null)]));

// Gear bawat class (tingnan ang mga mentor sa js/npc/roster.js para sa inspirasyon)
export const JOB_GEAR = {
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

// Anong Avatar animation ang gagamitin bawat state ng player (ang K ay "cast/strike" pose)
const ANIM_MAP = { bash: "attack" };

// Itsura = katawan mula sa Character Creator + kasuotan ng class + hawak na kagamitan (bag)
export function lookFor(classId, baseConfig, gearLook = {}) {
  return { ...(baseConfig || {}), ...(JOB_GEAR[classId] || {}), ...gearLook };
}

// Pinapalitan ang Avatar ng player kapag nagbago ang suot (tinatawag ng Bag.onChange)
export function refreshLook(player) {
  const hd = player.heroData;
  if (!hd) return;
  const avatar = new Avatar(lookFor(hd.id, player.avatarConfig || hd.avatarConfig, player.bag.look()));
  hd.avatar = avatar;
  hd.avatarConfig = avatar.config;
}

// Ibinabalik ang class na may sariling Avatar batay sa itsura ng player
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
