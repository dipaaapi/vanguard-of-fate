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
import { describe } from "../../../js/items/itemdb.js";
import { iconCanvas } from "../../../js/items/icons.js";

const CLASSES = { knight: KnightClass, mage: MageClass, priest: PriestClass, archer: ArcherClass, fighter: FighterClass };
const cache = new Map();
const zoneCache = new Map();

// Reference looks for Book I NPCs added with Acts XI–XV, used when js/npc/roster.js has no entry
// for them yet (the roster wins once it does). Copy these into NPC_DEFS to keep the art in step.
export const ART_LOOKS = {
  maren: { gloves: "none", legs: "skirt", boots: "shoes", body: "female", skin: "#f1c27d", eyes: "#4a3222", hairStyle: "bob", hairColor: "#c8ccd4", glasses: true,
    outfit: "robe", outfitColor: "#2a4a5a", legColor: "#1e293b", bootColor: "#3a2616", weapon: "book" },
  isolde: { gloves: "leather", legs: "pants", boots: "boots", body: "female", skin: "#c68642", eyes: "#2f6db5", hairStyle: "ponytail", hairColor: "#2b1d14",
    outfit: "coat", outfitColor: "#1e3a6a", legColor: "#e8e2d0", bootColor: "#2b1d14", headgear: "hat", weapon: "sword" },
  veyra: { gloves: "leather", legs: "pants", boots: "boots", body: "female", skin: "#9aa0a8", eyes: "#b3312b", hairStyle: "long", hairColor: "#1f1a24",
    outfit: "vest", outfitColor: "#2b2b33", legColor: "#1f1a24", bootColor: "#141018", headgear: "horns", weapon: "bow", quiver: true },
  aldric: { gloves: "none", legs: "pants", boots: "sandals", body: "male", skin: "#e0ac69", eyes: "#4a3222", hairStyle: "none", hairColor: "#c8ccd4", beard: true,
    outfit: "robe", outfitColor: "#c9963a", legColor: "#8a6a2a", bootColor: "#5e3b1a", weapon: "staff" }
};

/** NPC by roster id (aurelia, kenneth, king, ronald, edgar, brakka, arthur, lyra, julian, sam, renzo, …) */
export function npc(id, dir = "down", anim = "idle", i = 0) {
  const key = `npc:${id}`;
  if (!cache.has(key)) {
    const d = NPC_DEFS[id] || (ART_LOOKS[id] && { look: ART_LOOKS[id] });
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

/** A frame of an exported zone illustration (e.g. the Imperial Citadel). */
export async function zone(key, i = 0, cropHeight = null) {
  const cacheKey = `${key}:${cropHeight || "full"}`;
  if (!zoneCache.has(cacheKey)) {
    zoneCache.set(cacheKey, (async () => {
      const base = new URL(`../../../assets/sprites/zone/${key}`, import.meta.url);
      const response = await fetch(new URL(`${base.href}.json`));
      if (!response.ok) throw new Error(`could not load ${base.href}.json`);
      const data = await response.json();
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`could not load ${base.href}.png`));
        img.src = `${base.href}.png`;
      });
      const frames = Array.isArray(data.frames) ? data.frames : Object.values(data.frames);
      return frames.map(({ frame }) => {
        const canvas = document.createElement("canvas");
        const h = cropHeight ? Math.min(cropHeight, frame.h) : frame.h;
        canvas.width = frame.w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(image, frame.x, frame.y, frame.w, h, 0, 0, frame.w, h);
        return canvas;
      });
    })());
  }
  const frames = await zoneCache.get(cacheKey);
  if (!frames.length) throw new Error(`zone sprite ${key} has no frames`);
  return frames[((i % frames.length) + frames.length) % frames.length];
}
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
