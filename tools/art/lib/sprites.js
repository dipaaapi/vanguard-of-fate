// ==================== GAME SPRITES FOR SCENE ART ====================
// Scene art draws characters with the game's own sprite code, so the banners show the same
// Avatar looks as the game: NPCs from js/npc/roster.js, hero classes from js/classes/job.js,
// monsters and bosses from js/bestiary.js. Frames are canvases (FRAME_W × FRAME_H for humanoids).
import { Avatar } from "../../../js/avatar/avatar.js";
import { DEFAULT_CONFIG } from "../../../js/avatar/options.js";
import { NPC_DEFS } from "../../../js/npc/roster.js";
import { MONSTERS, BOSSES } from "../../../js/bestiary.js";
import { equipJob } from "../../../js/classes/job.js";
import { getNovice } from "../../../js/classes/novice.js";
import { KnightClass } from "../../../js/classes/knight.js";
import { MageClass } from "../../../js/classes/mage.js";
import { PriestClass } from "../../../js/classes/priest.js";
import { ArcherClass } from "../../../js/classes/archer.js";
import { FighterClass } from "../../../js/classes/fighter.js";

const CLASSES = { knight: KnightClass, mage: MageClass, priest: PriestClass, archer: ArcherClass, fighter: FighterClass };
const cache = new Map();

/** NPC by roster id (aurelia, kenneth, king, ronald, edgar, brakka, arthur, lyra, julian, sam, renzo, …) */
export function npc(id, dir = "down", anim = "idle", i = 0) {
  const key = `npc:${id}`;
  if (!cache.has(key)) {
    const d = NPC_DEFS[id];
    if (!d) throw new Error(`unknown NPC ${id}`);
    cache.set(key, new Avatar(d.look));
  }
  return cache.get(key).frame(dir, anim, i);
}

/** Custom Avatar look (e.g. the Lantern Knight, which is not a game NPC) */
export function look(name, lookDef, dir = "down", anim = "idle", i = 0) {
  const key = `look:${name}`;
  if (!cache.has(key)) cache.set(key, new Avatar(lookDef));
  return cache.get(key).frame(dir, anim, i);
}

/** The hero in a class outfit; cls = novice | knight | mage | priest | archer | fighter */
export function hero(cls, dir = "down", anim = "idle", i = 0, config = DEFAULT_CONFIG) {
  const key = `hero:${cls}:${JSON.stringify(config)}`;
  if (!cache.has(key)) {
    const def = cls === "novice" ? getNovice(config) : equipJob(CLASSES[cls], config);
    cache.set(key, def.avatar);
  }
  return cache.get(key).frame(dir, anim, i);
}

export function monster(key, dir = "down", anim = "idle", i = 0) { return MONSTERS[key].sprite.frame(dir, anim, i); }
export function boss(key, dir = "down", anim = "idle", i = 0) { return BOSSES[key].sprite.frame(dir, anim, i); }

export const DEFAULT_LOOK = DEFAULT_CONFIG;

import { describe } from "../../../js/items/itemdb.js";
import { iconCanvas } from "../../../js/items/icons.js";
/** 16×16 item icon by item id (e.g. lance, tower, greatstaff, grimoire, longbow, claws) */
export function icon(id) { return iconCanvas(describe({ id })); }

// The Lantern Knight (LORE: the first summoned soul, three centuries ago). Not a game NPC yet;
// this look is the reference for art and for adding the character to js/npc/roster.js later.
export const LANTERN_KNIGHT_LOOK = {
  body: "male", skin: "#e0ac69", eyes: "#9a6a2b", hairStyle: "short", hairColor: "#4a2f1b", headgear: "helmet",
  outfit: "armor", outfitColor: "#d8dde6", legColor: "#9aa3b2", bootColor: "#5a5f6e", gloves: "leather",
  cape: "#e0b84a", weapon: "sword", shield: null, legs: "pants", boots: "boots"
};
export function lanternKnight(dir = "down", anim = "idle", i = 0) { return look("lanternKnight", LANTERN_KNIGHT_LOOK, dir, anim, i); }
