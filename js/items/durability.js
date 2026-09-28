import { describe } from "./itemdb.js";

// ==================== EQUIPMENT DURABILITY ====================
// Worn gear wears down in combat: the weapon with every hit the hero lands, armor pieces with every
// hit the hero takes (accessories never wear). At 0 an item is Broken and grants no stats until it is
// repaired. Durability lives on the item instance as `dur` (missing = brand new, DUR_MAX).

export const DUR_MAX = 100;
export const WEAR_WEAPON = 0.12;      // per hit landed  (~830 hits from new to broken)
export const WEAR_ARMOR = 0.2;        // per hit taken, for each worn armor piece (~500 hits)
export const LOW_DUR = 20;            // warn the player below this
export const ARMOR_SLOTS = ["offhand", "head", "armor", "garment", "gloves", "boots"];

export const durOf = (inst) => (inst && inst.dur !== undefined ? inst.dur : DUR_MAX);
export const isBroken = (inst) => Boolean(inst && inst.dur !== undefined && inst.dur <= 0);

// Lowers durability. Returns "broken" or "low" the moment a threshold is crossed, otherwise null.
export function wear(inst, amount) {
  if (!inst || isBroken(inst)) return null;
  const before = durOf(inst);
  inst.dur = Math.max(0, +(before - amount).toFixed(2));
  if (inst.dur <= 0) return "broken";
  if (before > LOW_DUR && inst.dur <= LOW_DUR) return "low";
  return null;
}

// Gold to restore an item to full durability. mult > 1 for field repairs away from the dwarf smiths.
export function repairCost(inst, mult = 1) {
  const missing = DUR_MAX - durOf(inst);
  if (missing <= 0.01) return 0;
  const it = describe(inst);
  const base = Math.max(1, (it ? it.price : 10) * 0.6 * (missing / DUR_MAX));
  return Math.ceil(base * mult * (isBroken(inst) ? 1.5 : 1));   // a broken item costs extra to mend
}

export function repair(inst) {
  if (inst) delete inst.dur;
}
