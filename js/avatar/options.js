// Character Creator choices. Every colour is a base; shade and highlight
// are derived automatically in avatar.js.

const BODIES = ["male", "female"];

const SKIN = ["#f7d9c4", "#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#5c3a21"];

const EYES = ["#4a3222", "#2f6db5", "#3a8a4a", "#9a6a2b", "#7a3fb0", "#b3312b", "#5a6270"];

const HAIR_STYLES = ["short", "spiky", "long", "ponytail", "bob", "twintails", "buzz"];

const HAIR_COLORS = [
  "#2b1d14", "#4a2f1b", "#7a5230", "#c9a063", "#ece0b8", "#8a3b24",
  "#b8332b", "#3b4a8a", "#6a3fa0", "#dfe6ee", "#2f6b4f", "#d9679b"
];

const OUTFITS = ["tunic", "vest", "robe"];

const CLOTH = [
  "#7d5a3c", "#8a2c2c", "#2c4f8a", "#2f6b3f", "#5a3d91",
  "#c9a063", "#3b3f4a", "#e8e2d0", "#2a7a80"
];

const GLOVES = ["none", "leather", "wraps"];

const LEGS = ["pants", "shorts", "skirt"];

const BOOTS = ["boots", "shoes", "sandals"];

const BOOT_COLORS = ["#3a2616", "#5e3b1a", "#2b2b33", "#7d2b2b", "#c9a063", "#e8e2d0"];

// Order of the creator rows (key → list of choices)
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

// Parts for NPCs only (not in the Character Creator)
const NPC_OUTFITS = ["gown", "armor", "coat"];
const EXTRA = {
  headgear: ["crown", "tiara", "helmet", "headband", "hat", "hood", "halo", "horns"],
  ears: ["elf"],
  weapon: ["novice", "staff", "lance", "scepter", "bow", "sword", "flask", "book", "axe", "greatsword", "crossbow", "wand", "none"],
  shield: ["tower", "buckler"],
  face: ["skull"]
};
const HEX = /^#[0-9a-f]{6}$/i;

// Makes sure every value is valid (e.g. from an old save or a .json import)
export function normalizeConfig(cfg = {}) {
  const out = { ...DEFAULT_CONFIG };
  FIELDS.forEach(({ key, type, options }) => {
    const v = cfg[key];
    if (options.includes(v)) out[key] = v;
    else if (type === "swatch" && HEX.test(v || "")) out[key] = v;     // NPC: any colour
    else if (key === "outfit" && NPC_OUTFITS.includes(v)) out[key] = v;
  });
  Object.entries(EXTRA).forEach(([key, allowed]) => {
    if (allowed.includes(cfg[key])) out[key] = cfg[key];
  });
  if (HEX.test(cfg.cape || "")) out.cape = cfg.cape;
  if (HEX.test(cfg.wings || "")) out.wings = cfg.wings;
  if (cfg.hairStyle === "none") out.hairStyle = "none";   // bald (e.g. a skeleton)
  if (cfg.beard) out.beard = true;
  if (cfg.glasses) out.glasses = true;
  if (cfg.quiver) out.quiver = true;
  if (cfg.beastkin) out.beastkin = true;
  if (cfg.robot) out.robot = true;
  ["furColor", "earInner", "tailTip", "muzzleColor", "noseColor"].forEach((key) => { if (HEX.test(cfg[key] || "")) out[key] = cfg[key]; });
  return out;
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function randomConfig(keepBody) {
  const cfg = { ...DEFAULT_CONFIG };
  FIELDS.forEach(({ key, options }) => { cfg[key] = pick(options); });
  if (keepBody) cfg.body = keepBody;
  // Top and bottom colours differ so the separate pieces read clearly
  while (cfg.legColor === cfg.outfitColor) cfg.legColor = pick(CLOTH);
  return cfg;
}

// Name of the soul summoned from Earth (2026): a mix of Filipino and international names,
// chosen by body. All are ≤ 12 letters (maxlength of #crName).
const NAMES = {
  male: ["Miguel", "Rafael", "Gabriel", "Andres", "Paolo", "Joaquin", "Marco", "Adrian", "Carlo", "Elias",
    "Diego", "Lucas", "Nathan", "Ethan", "Liam", "Kenji", "Isaac", "Tomas", "Leon", "Julian"],
  female: ["Maria", "Sofia", "Isabel", "Angela", "Camille", "Andrea", "Bea", "Clara", "Mika", "Lara",
    "Elena", "Nina", "Hannah", "Chloe", "Yumi", "Alyssa", "Amara", "Iris", "Leah", "Celine"]
};

export function randomName(body) {
  return pick(NAMES[body] || [...NAMES.male, ...NAMES.female]);
}
