import { SETS, describe } from "./itemdb.js";

// ==================== EMBERHOLD FORGE (Brakka) ====================
// Mined minerals are only used here:
//   Forging   — a piece of a mineral set (weapon, head, armor, gloves, boots), built on the base item
//               that suits the hero's class, at the set's grade.
//   Tempering — a permanent bonus on any non-set equipment or accessory, up to MAX_TEMPER times.

export const SET_SLOTS = ["weapon", "head", "armor", "gloves", "boots"];
export const MAX_TEMPER = 3;

// Minerals (+ gold) per set piece; weapons cost half again as much
export const RECIPES = {
  ember: { emberite: 6, obsidianOre: 2, gold: 400 },
  mythril: { mythril: 6, emberite: 3, gold: 800 },
  star: { starsteel: 3, mythril: 4, obsidianOre: 3, gold: 1500 }
};

// Base item for each class and slot (the class's own weapon; the sturdiest armor it may wear)
const WEAPON = { novice: "cutter", knight: "broadsword", mage: "greatstaff", priest: "scepter", archer: "longbow", fighter: "knuckle" };
const HEAVY = ["knight", "fighter"];
const CASTER = ["mage", "priest"];
function baseFor(slot, cls) {
  if (slot === "weapon") return WEAPON[cls] || "cutter";
  if (slot === "head") return CASTER.includes(cls) ? "wizhat" : "helm";
  if (slot === "armor") return cls === "knight" ? "plate" : CASTER.includes(cls) ? "robe" : cls === "novice" ? "tunic" : "mail";
  if (slot === "gloves") return HEAVY.includes(cls) ? "gauntlets" : "leatherglove";
  return HEAVY.includes(cls) ? "greaves" : "boots";
}

export function recipeCost(setId, slot) {
  const r = RECIPES[setId], k = slot === "weapon" ? 1.5 : 1;
  return Object.fromEntries(Object.entries(r).map(([id, n]) => [id, Math.ceil(n * k)]));
}

// Returns "" on success, or the reason it failed: "gold" | "minerals" | "full"
export function forgePiece(player, setId, slot) {
  const cost = recipeCost(setId, slot), bag = player.bag;
  if (player.gold < cost.gold) return "gold";
  if (Object.entries(cost).some(([id, n]) => id !== "gold" && bag.count(id) < n)) return "minerals";
  const inst = { id: `${baseFor(slot, player.heroData.id)}@${SETS[setId].grade}`, rarity: "normal", set: setId, sockets: 1 };
  if (!bag.add(inst)) return "full";
  player.gold -= cost.gold;
  Object.entries(cost).forEach(([id, n]) => { if (id !== "gold") bag.take(id, n); });
  return "";
}

// ---------- Tempering ----------
// weapon → +ATK with Emberite · armor pieces → +DEF/HP with Obsidian Ore · accessories → +CRIT/CDR with Mythril
const TEMPER = {
  weapon: { mineral: "emberite", qty: 4, gold: 150, add: [["atk", 4]] },
  armor: { mineral: "obsidianOre", qty: 3, gold: 150, add: [["def", 3], ["hp", 15]] },
  accessory: { mineral: "mythril", qty: 2, gold: 250, add: [["crit", 2], ["cdr", 2]] }
};
const kindOf = (slot) => (slot === "weapon" ? "weapon" : ["amulet", "ring"].includes(slot) ? "accessory" : "armor");

export function temperInfo(inst) {
  const it = describe(inst);
  if (!it || it.type !== "equip" || it.set) return null;
  return { ...TEMPER[kindOf(it.slot)], done: inst.temper | 0 };
}

// Returns "" on success, or "set" | "max" | "gold" | "minerals"
export function temper(player, inst) {
  const info = temperInfo(inst);
  if (!info) return "set";
  if (info.done >= MAX_TEMPER) return "max";
  if (player.gold < info.gold) return "gold";
  if (player.bag.count(info.mineral) < info.qty) return "minerals";
  player.gold -= info.gold;
  player.bag.take(info.mineral, info.qty);
  inst.affixes = [...(inst.affixes || []), ...info.add.map(([k, v]) => ({ k, v, temper: true }))];
  inst.temper = info.done + 1;
  return "";
}
