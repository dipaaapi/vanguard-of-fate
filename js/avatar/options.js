// Mga pagpipilian sa Character Creator. Lahat ng kulay ay base; ang anino at liwanag
// ay awtomatikong kinukuha sa avatar.js.

export const BODIES = ["male", "female"];

export const SKIN = ["#f7d9c4", "#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#5c3a21"];

export const EYES = ["#4a3222", "#2f6db5", "#3a8a4a", "#9a6a2b", "#7a3fb0", "#b3312b", "#5a6270"];

export const HAIR_STYLES = ["short", "spiky", "long", "ponytail", "bob", "twintails", "buzz"];

export const HAIR_COLORS = [
  "#2b1d14", "#4a2f1b", "#7a5230", "#c9a063", "#ece0b8", "#8a3b24",
  "#b8332b", "#3b4a8a", "#6a3fa0", "#dfe6ee", "#2f6b4f", "#d9679b"
];

export const OUTFITS = ["tunic", "vest", "robe"];

export const CLOTH = [
  "#7d5a3c", "#8a2c2c", "#2c4f8a", "#2f6b3f", "#5a3d91",
  "#c9a063", "#3b3f4a", "#e8e2d0", "#2a7a80"
];

export const GLOVES = ["none", "leather", "wraps"];

export const LEGS = ["pants", "shorts", "skirt"];

export const BOOTS = ["boots", "shoes", "sandals"];

export const BOOT_COLORS = ["#3a2616", "#5e3b1a", "#2b2b33", "#7d2b2b", "#c9a063", "#e8e2d0"];

// Pagkakasunod ng mga row sa creator (key → listahan ng pagpipilian)
export const FIELDS = [
  { key: "body",        section: "crBody",   type: "cycle",  options: BODIES },
  { key: "skin",        section: "crBody",   type: "swatch", options: SKIN },
  { key: "eyes",        section: "crBody",   type: "swatch", options: EYES },
  { key: "hairStyle",   section: "crHair",   type: "cycle",  options: HAIR_STYLES },
  { key: "hairColor",   section: "crHair",   type: "swatch", options: HAIR_COLORS },
  { key: "outfit",      section: "crOutfit", type: "cycle",  options: OUTFITS },
  { key: "outfitColor", section: "crOutfit", type: "swatch", options: CLOTH },
  { key: "gloves",      section: "crOutfit", type: "cycle",  options: GLOVES },
  { key: "legs",        section: "crLegs",   type: "cycle",  options: LEGS },
  { key: "legColor",    section: "crLegs",   type: "swatch", options: CLOTH },
  { key: "boots",       section: "crLegs",   type: "cycle",  options: BOOTS },
  { key: "bootColor",   section: "crLegs",   type: "swatch", options: BOOT_COLORS }
];

export const DEFAULT_CONFIG = {
  body: "male",
  skin: SKIN[1],
  eyes: EYES[0],
  hairStyle: "short",
  hairColor: HAIR_COLORS[1],
  outfit: "tunic",
  outfitColor: CLOTH[0],
  gloves: "leather",
  legs: "pants",
  legColor: CLOTH[6],
  boots: "boots",
  bootColor: BOOT_COLORS[0],
  weapon: "novice"
};

// Tinitiyak na tama ang bawat value (hal. galing sa lumang save o .json import)
export function normalizeConfig(cfg = {}) {
  const out = { ...DEFAULT_CONFIG };
  FIELDS.forEach(({ key, options }) => {
    if (options.includes(cfg[key])) out[key] = cfg[key];
  });
  if (typeof cfg.weapon === "string") out.weapon = cfg.weapon;
  return out;
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function randomConfig(keepBody) {
  const cfg = { ...DEFAULT_CONFIG };
  FIELDS.forEach(({ key, options }) => { cfg[key] = pick(options); });
  if (keepBody) cfg.body = keepBody;
  // Hindi pareho ang kulay ng pang-itaas at pang-ibaba para malinaw ang hiwalay na bahagi
  while (cfg.legColor === cfg.outfitColor) cfg.legColor = pick(CLOTH);
  return cfg;
}
