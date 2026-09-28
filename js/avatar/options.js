// Mga pagpipilian sa Character Creator. Lahat ng kulay ay base; ang anino at liwanag
// ay awtomatikong kinukuha sa avatar.js.

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

// Mga piyesa na pang-NPC lang (wala sa Character Creator)
const NPC_OUTFITS = ["gown", "armor", "coat"];
const EXTRA = {
  headgear: ["crown", "tiara", "helmet", "headband", "hat", "hood", "halo", "horns"],
  ears: ["elf"],
  weapon: ["novice", "staff", "lance", "scepter", "bow", "sword", "flask", "book", "axe", "greatsword", "crossbow", "wand", "none"],
  shield: ["tower", "buckler"],
  face: ["skull"]
};
const HEX = /^#[0-9a-f]{6}$/i;

// Tinitiyak na tama ang bawat value (hal. galing sa lumang save o .json import)
export function normalizeConfig(cfg = {}) {
  const out = { ...DEFAULT_CONFIG };
  FIELDS.forEach(({ key, type, options }) => {
    const v = cfg[key];
    if (options.includes(v)) out[key] = v;
    else if (type === "swatch" && HEX.test(v || "")) out[key] = v;     // NPC: kahit anong kulay
    else if (key === "outfit" && NPC_OUTFITS.includes(v)) out[key] = v;
  });
  Object.entries(EXTRA).forEach(([key, allowed]) => {
    if (allowed.includes(cfg[key])) out[key] = cfg[key];
  });
  if (HEX.test(cfg.cape || "")) out.cape = cfg.cape;
  if (HEX.test(cfg.wings || "")) out.wings = cfg.wings;
  if (cfg.hairStyle === "none") out.hairStyle = "none";   // kalbo (hal. kalansay)
  if (cfg.beard) out.beard = true;
  if (cfg.glasses) out.glasses = true;
  if (cfg.quiver) out.quiver = true;
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

// Pangalan ng tinawag na kaluluwa mula sa Daigdig (2026): halong Pilipino at pandaigdigang pangalan,
// ayon sa napiling katawan. Lahat ay ≤ 12 titik (maxlength ng #crName).
const NAMES = {
  male: ["Miguel", "Rafael", "Gabriel", "Andres", "Paolo", "Joaquin", "Marco", "Adrian", "Carlo", "Elias",
    "Diego", "Lucas", "Nathan", "Ethan", "Liam", "Kenji", "Isaac", "Tomas", "Leon", "Julian"],
  female: ["Maria", "Sofia", "Isabel", "Angela", "Camille", "Andrea", "Bea", "Clara", "Mika", "Lara",
    "Elena", "Nina", "Hannah", "Chloe", "Yumi", "Alyssa", "Amara", "Iris", "Leah", "Celine"]
};

export function randomName(body) {
  return pick(NAMES[body] || [...NAMES.male, ...NAMES.female]);
}
