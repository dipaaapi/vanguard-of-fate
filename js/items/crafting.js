import { describe, canEquip } from "./itemdb.js";
import { CRAFT_TIERS, CRAFT_SETS, CRAFT_SLOTS, PATHS, PATH_ORDER, recipeFor } from "./craftsets.js";

// ==================== SAFE-ZONE CRAFTING ====================
// Gear comes from here now (monsters drop materials, not equipment; tables in js/items/craftsets.js).
//   craftPiece  — one piece of a set for the hero's class, paid with ore, cores, path essence and gold
//   autoCraft   — with a target set and auto-craft on, the next missing piece is crafted by itself
//                 whenever the hero stands in a safe zone with the materials (js/workshop.js calls it)
//   transmute   — trade lower-tier materials up (5 ore → 1, 3 cores → 1) or swap essences (3 → 1)
// The recommended path follows how the hero has been built: the highest of STR, DEX and INT.

// Base item per class, slot and path (the first one the class may use)
const WEAPON = {
  novice: { str: "cutter", dex: "cutter", int: "cutter" },
  knight: { str: "claymore", dex: "pike", int: "broadsword" },
  mage: { str: "greatstaff", dex: "rod", int: "greatstaff" },
  priest: { str: "mace", dex: "rod", int: "scepter" },
  archer: { str: "longbow", dex: "composite", int: "crossbow" },
  fighter: { str: "claws", dex: "claws", int: "knuckle" }
};
const OFFHAND = { novice: "guard", knight: "tower", mage: "grimoire", priest: "grimoire", archer: "traps", fighter: "talisman" };
const BY_PATH = {
  head: { str: ["helm", "wizhat"], dex: ["circlet"], int: ["wizhat", "circlet"] },
  armor: { str: ["plate", "mail", "robe", "tunic"], dex: ["mail", "robe", "tunic"], int: ["robe", "mail", "tunic"] },
  garment: { str: ["manteau"], dex: ["hood"], int: ["muffler"] },
  gloves: { str: ["gauntlets", "leatherglove"], dex: ["leatherglove"], int: ["leatherglove"] },
  boots: { str: ["greaves", "boots"], dex: ["boots"], int: ["boots"] },
  amulet: { str: ["clip"], dex: ["brooch"], int: ["pendant"] },
  ring: { str: ["ring"], dex: ["rosary"], int: ["earring"] }
};

export function baseFor(cls, slot, path) {
  if (slot === "weapon") return (WEAPON[cls] || WEAPON.novice)[path];
  if (slot === "offhand") return OFFHAND[cls] || null;
  return (BY_PATH[slot][path] || []).find((b) => canEquip(describe({ id: `${b}@0` }), cls)) || null;
}

// The slots this class can craft for a set (the off-hand only when the class has one)
export const craftSlots = (cls) => CRAFT_SLOTS.filter((slot) => baseFor(cls, slot, "str"));

// The instance a craft makes (not yet in the bag)
export function pieceFor(cls, setId, slot) {
  const set = CRAFT_SETS[setId], base = set && baseFor(cls, slot, set.path);
  if (!base) return null;
  const e = describe({ id: `${base}@${set.grade}` });
  return { id: `${base}@${set.grade}`, qty: 1, plus: 0, rarity: "normal", affixes: [], set: setId, cards: [],
    sockets: Math.min(e.sockets || 0, 1 + (set.tier >= 3 ? 1 : 0)) };
}

// "" when it can be crafted now, else "gold" | "materials" | "slot"
export function craftCheck(player, setId, slot) {
  const r = recipeFor(setId, slot);
  if (!r || !pieceFor(player.heroData.id, setId, slot)) return "slot";
  if (player.gold < r.gold) return "gold";
  return Object.entries(r).every(([id, n]) => id === "gold" || player.bag.count(id) >= n) ? "" : "materials";
}

// Crafts one piece into the bag. Returns "" or the reason ("gold" | "materials" | "slot" | "full")
export function craftPiece(player, setId, slot) {
  const err = craftCheck(player, setId, slot);
  if (err) return err;
  const r = recipeFor(setId, slot);
  if (!player.bag.add(pieceFor(player.heroData.id, setId, slot))) return "full";
  player.gold -= r.gold;
  Object.entries(r).forEach(([id, n]) => { if (id !== "gold") player.bag.take(id, n); });
  return "";
}

// Pieces of the set the hero already owns (worn or in the bag), by craft slot (rings count up to 2)
export function ownedPieces(player, setId) {
  const n = {};
  const note = (inst) => {
    const it = inst && inst.set === setId && describe(inst);
    if (it) n[it.slot] = (n[it.slot] || 0) + (inst.qty || 1);
  };
  Object.values(player.bag.equip).forEach(note);
  player.bag.slots.forEach(note);
  return n;
}

// The next piece auto-craft would make: the first craft slot the hero has none of (two rings)
export function nextPiece(player, setId) {
  const have = ownedPieces(player, setId);
  return craftSlots(player.heroData.id).find((slot) => (have[slot] || 0) < (slot === "ring" ? 2 : 1)) || null;
}

// Auto-craft: one piece per call when the target set has a missing piece the hero can pay for.
// Returns { setId, slot, item } for the crafted piece, or null
export function autoCraft(player) {
  const c = player.craft;
  if (!c || !c.auto || !CRAFT_SETS[c.target]) return null;
  const slot = nextPiece(player, c.target);
  if (!slot || craftPiece(player, c.target, slot)) return null;
  return { setId: c.target, slot, item: describe(pieceFor(player.heroData.id, c.target, slot)) };
}

// The path the hero's build leans to: the highest base STR / DEX / INT (ties: the class's own)
const CLASS_PATH = { novice: "str", knight: "str", fighter: "str", archer: "dex", mage: "int", priest: "int" };
export function recommendedPath(player) {
  if (player.path && PATHS[player.path]) return player.path;    // a chosen skill path, when there is one
  const s = player.stats || {};
  const own = CLASS_PATH[player.heroData.id] || "str";
  return PATH_ORDER.reduce((best, p) => ((s[p] || 0) > (s[best] || 0) ? p : best), own);
}

// The best tier the hero may wear now (Lv 10 sets from Lv 10, …); 0 before Lv 10
export const tierForLevel = (level) => CRAFT_TIERS.reduce((t, c) => (level >= c.level ? c.tier : t), 0);
export const setIdFor = (path, tier) => (tier ? `${path}${CRAFT_TIERS[tier - 1].level}` : null);

// ---------- Transmuting ----------
// Each rule: from (id, qty) → to (id, 1) + gold
export const TRANSMUTES = [
  ...CRAFT_TIERS.slice(0, -1).flatMap((c, i) => [
    { from: c.ore, qty: 5, to: CRAFT_TIERS[i + 1].ore, gold: 40 * (i + 1) },
    { from: c.core, qty: 3, to: CRAFT_TIERS[i + 1].core, gold: 120 * (i + 1) }
  ]),
  ...PATH_ORDER.flatMap((a) => PATH_ORDER.filter((b) => b !== a).map((b) => ({ from: PATHS[a].essence, qty: 3, to: PATHS[b].essence, gold: 10 })))
];

// "" or "gold" | "materials" | "full"
export function transmute(player, rule) {
  if (player.gold < rule.gold) return "gold";
  if (player.bag.count(rule.from) < rule.qty) return "materials";
  if (!player.bag.add(rule.to, 1)) return "full";
  player.gold -= rule.gold;
  player.bag.take(rule.from, rule.qty);
  return "";
}

