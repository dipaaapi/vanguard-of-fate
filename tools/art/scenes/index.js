// ==================== SCENE REGISTRY ====================
// Every procedural art piece: key → output file, native size, upscale and the module that paints it.
// Scene modules export paint(P, ctx) where P is a Px buffer and ctx = { R (seeded rng), S (game sprites), K (kit) }.
// Captions and credits for each file live in data/art_manifest.json; keep both in sync.
import { Px, rng } from "../lib/px.js";
import * as K from "../lib/kit.js";
import * as S from "../lib/sprites.js";

const banner = (n, mod) => ({ out: `assets/banner/act-${n}.png`, w: 480, h: 270, scale: 4, mod });
const chapter = (key, mod) => ({ out: `assets/banner/${key}.png`, w: 480, h: 270, scale: 4, mod });
const vista = (key, mod) => ({ out: `assets/art/vistas/${key}.png`, w: 480, h: 270, scale: 4, mod });
const BOSS_KEYS = ["malakor", "leviathan", "cryonix", "ignis", "commander", "satan"];
const BIG_BOSSES = ["malakor", "leviathan"];
const portrait = (key) => (BOSS_KEYS.includes(key)
  ? { out: `assets/art/portraits/${key}.png`, ...(BIG_BOSSES.includes(key) ? { w: 96, h: 96, scale: 4 } : { w: 64, h: 64, scale: 6 }), mod: "portraits", arg: key }
  : { out: `assets/art/portraits/${key}.png`, w: 40, h: 44, scale: 8, mod: "portraits", arg: key });
const relic = (key) => ({ out: `assets/art/relics/${key}.png`, w: 32, h: 32, scale: 8, mod: "relics", arg: key });

export const SCENES = {
  "act-1": banner(1, "act01"),
  "act-2": banner(2, "act02"),
  "act-3": banner(3, "act03"),
  "act-4": banner(4, "act04"),
  "act-5": banner(5, "act05"),
  "act-6": banner(6, "act06"),
  "act-7": banner(7, "act07"),
  "act-8": banner(8, "act08"),
  "act-9": banner(9, "act09"),
  "act-10": banner(10, "act10"),
  "act-11": banner(11, "act11"),
  "act-12": banner(12, "act12"),
  "prophecy": chapter("prophecy", "prophecy"),
  "ledger": chapter("ledger", "ledger"),
  "heralds": chapter("heralds", "heralds"),
  "title": { out: "assets/bg/title_bg.png", w: 480, h: 270, scale: 6, mod: "title" },
  "portal": { out: "assets/bg/portal_bg.png", w: 480, h: 270, scale: 4, mod: "portal" },
  "vista-earth-2026": vista("earth-2026", "vistaEarth"),
  "vista-lantern-knight": vista("lantern-knight", "vistaLantern"),
  "vista-barracks": vista("barracks-sanctuary", "vistaBarracks"),
  "vista-emberhold": vista("emberhold-forge", "vistaEmberhold"),
  "vista-elven-sanctuary": vista("elven-sanctuary", "vistaElven"),
  "vista-obsidian-harbor": vista("obsidian-harbor", "vistaHarbor"),
  "vista-sovereign-dawn": vista("sovereign-dawn", "vistaDawn"),
  "vista-world-map": vista("world-map", "worldMap")
};

const PORTRAITS = ["aurelia", "kenneth", "king", "lanternKnight", "arthur", "lyra", "julian", "sam", "renzo", "ronald", "edgar", "brakka", "elvenMatriarch",
  "malakor", "leviathan", "cryonix", "ignis", "commander", "satan"];
for (const p of PORTRAITS) SCENES[`portrait-${p}`] = portrait(p);
const RELICS = ["sylvanStone", "tideStone", "frostStone", "emberStone", "lantern", "imperialCrest", "covenantLedger", "oblivionMushroom",
  "sigilShield", "sigilBow", "sigilPrayer", "sigilStar", "sigilFist", "invertedStar"];
for (const r of RELICS) SCENES[`relic-${r}`] = relic(r);

const mods = new Map();
export async function paintScene(key) {
  const s = SCENES[key];
  if (!s) throw new Error(`unknown scene ${key}`);
  if (!mods.has(s.mod)) mods.set(s.mod, await import(`./${s.mod}.js`));
  const P = new Px(s.w, s.h);
  if (s.mod !== "relics") P.fill([0, 0, 0]);   // scenes are opaque; relics keep a transparent background
  const seed = [...key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  await mods.get(s.mod).paint(P, { R: rng(seed), S, K, arg: s.arg });
  return { px: P, canvas: P.toCanvas(s.scale) };
}
