import { getLang } from "./i18n.js";

// ==================== RACE · ELEMENT · SIZE · TYPE (parang Ragnarok Online) ====================
// Bawat halimaw ay may lahi (race), elemento at laki. Ang atake ng bayani ay may elemento rin
// (hal. Meteor = apoy). Ang talaan ng elemento ang nagpapasya kung malakas o mahina ang tama.
// May mga VARIANT: elemental na bersyon (Blazing, Frozen, …) at CHAMPION (mas malakas, mas maraming samsam).

const L = () => (getLang() === "fil" ? "fil" : "en");

export const ELEMENTS = {
  neutral: { color: "#cbd5e1", icon: "◆", name: { en: "Neutral", fil: "Neutral" } },
  water:   { color: "#38bdf8", icon: "💧", name: { en: "Water", fil: "Tubig" } },
  earth:   { color: "#a16207", icon: "⛰", name: { en: "Earth", fil: "Lupa" } },
  fire:    { color: "#f97316", icon: "🔥", name: { en: "Fire", fil: "Apoy" } },
  wind:    { color: "#a3e635", icon: "🌪", name: { en: "Wind", fil: "Hangin" } },
  poison:  { color: "#4ade80", icon: "☠", name: { en: "Poison", fil: "Lason" } },
  holy:    { color: "#fde68a", icon: "✚", name: { en: "Holy", fil: "Banal" } },
  shadow:  { color: "#7c3aed", icon: "☾", name: { en: "Shadow", fil: "Anino" } },
  ghost:   { color: "#c4b5fd", icon: "👻", name: { en: "Ghost", fil: "Multo" } },
  undead:  { color: "#94a3b8", icon: "💀", name: { en: "Undead", fil: "Undead" } }
};

const RACES = {
  formless: { en: "Formless", fil: "Walang Anyo" }, brute: { en: "Brute", fil: "Hayop" }, plant: { en: "Plant", fil: "Halaman" },
  insect: { en: "Insect", fil: "Insekto" }, fish: { en: "Fish", fil: "Isda" }, dragon: { en: "Dragon", fil: "Dragon" },
  demihuman: { en: "Demi-Human", fil: "Demi-Tao" }, demon: { en: "Demon", fil: "Demonyo" }, undead: { en: "Undead", fil: "Undead" },
  angel: { en: "Angel", fil: "Anghel" }
};
const SIZES = { small: { en: "Small", fil: "Maliit" }, medium: { en: "Medium", fil: "Katamtaman" }, large: { en: "Large", fil: "Malaki" } };

// Talaan ng elemento: [atake][depensa] → multiplier (kung wala sa talaan, 1)
const TABLE = {
  neutral: { ghost: 0.5 },
  water: { fire: 1.5, wind: 0.75, water: 0.5, undead: 1.1 },
  fire: { earth: 1.5, water: 0.75, fire: 0.5, undead: 1.25, plant: 1 },
  earth: { wind: 1.5, fire: 0.75, earth: 0.5 },
  wind: { water: 1.5, earth: 0.75, wind: 0.5 },
  poison: { poison: 0.25, undead: 0.5, ghost: 0.5 },
  holy: { shadow: 1.5, undead: 1.75, holy: 0.25 },
  shadow: { holy: 1.5, shadow: 0.25, undead: 0.5 },
  ghost: { ghost: 1.5, neutral: 0.75 },
  undead: { holy: 1.5, undead: 0.25 }
};
export function elementMult(atk = "neutral", def = "neutral") {
  const row = TABLE[atk] || TABLE.neutral;
  return row[def] ?? 1;
}

// Dagdag na pinsala ng class laban sa ilang lahi (kaalaman mula sa Daigdig at sa pagsasanay)
const RACE_BONUS = {
  priest: { undead: 1.25, demon: 1.25 },     // Banal na liwanag
  knight: { dragon: 1.15, demon: 1.1 },      // Lance laban sa malalaki
  archer: { brute: 1.15, insect: 1.15 },     // Biyologo at mangangaso
  mage: { formless: 1.15, plant: 1.1 },      // Pisika ng materya
  fighter: { demihuman: 1.15, demon: 1.1 },  // Street fighter
  novice: {}
};
export const raceBonus = (cls, race) => (RACE_BONUS[cls] && RACE_BONUS[cls][race]) || 1;

// Laki: epekto ng uri ng sandata (Ragnarok size modifier, pinalambot)
const SIZE_MOD = {
  dagger: { small: 1, medium: 0.9, large: 0.75 },
  sword: { small: 0.9, medium: 1, large: 0.9 },
  greatsword: { small: 0.85, medium: 1, large: 1.15 },
  lance: { small: 0.85, medium: 1, large: 1.15 },
  bow: { small: 1, medium: 1, large: 0.9 },
  crossbow: { small: 1, medium: 1, large: 0.9 },
  claws: { small: 1, medium: 0.95, large: 0.85 },
  knuckle: { small: 1, medium: 1, large: 0.9 }
};
export const sizeMod = (weaponIcon, size) => (SIZE_MOD[weaponIcon] && SIZE_MOD[weaponIcon][size]) || 1;

// Elemental na variant ng halimaw (unlapi sa pangalan)
const VARIANTS = {
  fire: { en: "Blazing", fil: "Nagliliyab na" },
  water: { en: "Frozen", fil: "Nagyelong" },
  wind: { en: "Storm", fil: "Bagyong" },
  earth: { en: "Stone", fil: "Batong" },
  poison: { en: "Venom", fil: "Makamandag na" },
  shadow: { en: "Umbral", fil: "Aninong" },
  holy: { en: "Radiant", fil: "Maningning na" },
  ghost: { en: "Phantom", fil: "Multong" }
};
// Mas madalas ang variant na bagay sa lugar
const PLACE_VARIANTS = {
  hub: ["earth", "wind", "water", "fire", "holy"],
  canopy: ["poison", "earth", "poison", "shadow"],
  coast: ["water", "wind", "water", "ghost"],
  frost: ["water", "water", "wind", "holy"],
  ash: ["fire", "fire", "earth", "shadow"],
  siege: ["shadow", "fire", "holy", "ghost"],
  maw: ["shadow", "ghost", "shadow", "fire"]
};
export function rollVariant(place, rnd = Math.random) {
  if (rnd() > 0.16) return null;
  const list = PLACE_VARIANTS[place] || PLACE_VARIANTS.hub;
  return list[Math.floor(rnd() * list.length)];
}

export const variantPrefix = (el) => (VARIANTS[el] ? VARIANTS[el][L()] : "");
export const elementName = (el) => (ELEMENTS[el] ? ELEMENTS[el].name[L()] : el);
export const raceName = (r) => (RACES[r] ? RACES[r][L()] : r);
export const sizeName = (s) => (SIZES[s] ? SIZES[s][L()] : s);
