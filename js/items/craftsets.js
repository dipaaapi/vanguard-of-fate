// ==================== CRAFTED SETS (tables) ====================
// Equipment no longer drops from monsters. Monsters drop crafting materials instead, and the hero
// crafts gear at any safe zone (Barracks, the Citadel dais, a platform camp) — see js/items/crafting.js.
//
// Five set tiers (Lv 10 / 25 / 50 / 75 / 100), each in three paths that match the stat paths:
//   STR (Might) · DEX (Swift) · INT (Arcane)
// Every piece is the class's own base item at the tier's grade plus the path's per-piece bonus.
// Wearing pieces of one set adds its bonuses at 2, 4 and 6 pieces, and from 4 pieces a skill boost
// (skill damage, K/L cooldowns, healing, damage taken), which player.recalc adds to the skill-tree bonuses.
//
// Pure data plus the material drop roll: this module imports nothing, so js/items/itemdb.js can merge
// CRAFT_ITEMS into its item table and CRAFT_SETS into SETS without an import cycle.

const N = (en, fil = en) => ({ en, fil });

export const PATHS = {
  str: { stat: "str", essence: "furyEssence", color: "#ef4444", name: N("Might (STR)", "Lakas (STR)") },
  dex: { stat: "dex", essence: "galeEssence", color: "#22c55e", name: N("Swift (DEX)", "Liksi (DEX)") },
  int: { stat: "int", essence: "arcaneEssence", color: "#60a5fa", name: N("Arcane (INT)", "Arkano (INT)") }
};
export const PATH_ORDER = ["str", "dex", "int"];

// level = required to wear it · grade = item grade of the pieces (js/items/itemdb.js GRADE_NAMES)
// ore / core = the tier's materials · minMonster = lowest monster level that drops them
export const CRAFT_TIERS = [
  { tier: 1, level: 10, grade: 2, ore: "ironOre", core: "beastCore", minMonster: 1 },
  { tier: 2, level: 25, grade: 4, ore: "silverOre", core: "spiritCore", minMonster: 18 },
  { tier: 3, level: 50, grade: 7, ore: "runeOre", core: "abyssCore", minMonster: 33 },
  { tier: 4, level: 75, grade: 10, ore: "demonOre", core: "infernalCore", minMonster: 50 },
  { tier: 5, level: 100, grade: 12, ore: "divineOre", core: "sovereignCore", minMonster: 75 }
];
export const tierOfLevel = (lvl) => CRAFT_TIERS.reduce((t, c) => (lvl >= c.minMonster ? c.tier : t), 1);

// ---------- Materials ----------
const ORE_TINT = ["#a8a29e", "#cbd5e1", "#a78bfa", "#f43f5e", "#fde68a"];
const ORE_NAMES = [
  N("Iron Ore", "Bakal na Mineral"), N("Moonsilver Ore", "Pilak-Buwan na Mineral"), N("Runic Ore", "Runikong Mineral"),
  N("Demonite Ore", "Demonite na Mineral"), N("Divinium Ore", "Divinium na Mineral")
];
const CORE_NAMES = [
  N("Beast Core", "Core ng Halimaw"), N("Spirit Core", "Core ng Espiritu"), N("Abyss Core", "Core ng Kailaliman"),
  N("Infernal Core", "Core ng Impiyerno"), N("Sovereign Core", "Core ng Soberano")
];
const ORE_PRICE = [6, 15, 35, 80, 180];
const CORE_PRICE = [40, 100, 250, 600, 1500];

export const CRAFT_ITEMS = {};
CRAFT_TIERS.forEach((c, i) => {
  // the Lv 75 materials also come from Elites of the tier below (NEXT_FROM_TIER) and every boss drops the next tier's
  const also = i === 3 ? N(" Elites of Lv 33+ drop it too.", " Hulog din ng Elite na Lv 33+.") : { en: "", fil: "" };
  CRAFT_ITEMS[c.ore] = {
    type: "material", icon: "ore", tint: ORE_TINT[i], price: ORE_PRICE[i], name: ORE_NAMES[i],
    desc: N(`Crafting ore for the Lv ${c.level} sets. Dropped by monsters of Lv ${c.minMonster}+ and found in ore veins.${also.en}`,
      `Mineral sa paggawa ng mga set na Lv ${c.level}. Hulog ng halimaw na Lv ${c.minMonster}+ at nasa mga ugat ng mineral.${also.fil}`)
  };
  CRAFT_ITEMS[c.core] = {
    type: "material", icon: "core", tint: ORE_TINT[i], price: CORE_PRICE[i], name: CORE_NAMES[i],
    desc: N(`Rare heart of a Lv ${c.minMonster}+ monster. Champions, Elites and bosses drop it far more often. Lv ${c.level} weapons, armor and helms need it.${also.en}`,
      `Bihirang puso ng halimaw na Lv ${c.minMonster}+. Mas madalas ihulog ng Champion, Elite at boss. Kailangan sa sandata, baluti at helmet na Lv ${c.level}.${also.fil}`)
  };
});
CRAFT_ITEMS.furyEssence = { type: "material", icon: "essence", tint: "#ef4444", price: 12, name: N("Fury Essence", "Diwa ng Poot"),
  desc: N("Drops from fire, earth and undead monsters. Crafts Might (STR) sets.", "Hulog ng halimaw na apoy, lupa at undead. Pang-craft ng Lakas (STR) na set.") };
CRAFT_ITEMS.galeEssence = { type: "material", icon: "essence", tint: "#22c55e", price: 12, name: N("Gale Essence", "Diwa ng Unos"),
  desc: N("Drops from wind, water and poison monsters. Crafts Swift (DEX) sets.", "Hulog ng halimaw na hangin, tubig at lason. Pang-craft ng Liksi (DEX) na set.") };
CRAFT_ITEMS.arcaneEssence = { type: "material", icon: "essence", tint: "#60a5fa", price: 12, name: N("Arcane Essence", "Diwa ng Arkano"),
  desc: N("Drops from holy, shadow and ghost monsters. Crafts Arcane (INT) sets.", "Hulog ng halimaw na banal, anino at multo. Pang-craft ng Arkano (INT) na set.") };

const ESSENCE_OF = {
  fire: "furyEssence", earth: "furyEssence", undead: "furyEssence",
  wind: "galeEssence", water: "galeEssence", poison: "galeEssence",
  holy: "arcaneEssence", shadow: "arcaneEssence", ghost: "arcaneEssence"
};

// ---------- Sets ----------
const SET_NAMES = {
  str: [N("Ironhide", "Balat-Bakal"), N("Bulwark", "Muog"), N("Warlord", "Panginoon ng Digmaan"), N("Titanbreaker", "Pambasag ng Titan"), N("Godslayer", "Mamamatay-Diyos")],
  dex: [N("Fleetfoot", "Mabilis na Paa"), N("Galestrider", "Lakad-Unos"), N("Stormhunter", "Mangangaso ng Bagyo"), N("Phantom Wing", "Pakpak ng Multo"), N("Skyreaver", "Mandarambong ng Langit")],
  int: [N("Novice Sage", "Baguhang Pantas"), N("Runeweaver", "Manghahabi ng Rune"), N("Astral Magus", "Astral na Mago"), N("Eclipse Oracle", "Orakulo ng Eklipse"), N("Sovereign Mind", "Soberanong Isip")]
};
const PASSIVES = {
  str: [N("Iron Will", "Bakal na Loob"), N("Bulwark Oath", "Panata ng Muog"), N("Warlord's Roar", "Atungal ng Panginoon"), N("Titan's Grip", "Hawak ng Titan"), N("Godslayer's Wrath", "Poot ng Mamamatay-Diyos")],
  dex: [N("Fleet Step", "Mabilis na Hakbang"), N("Gale Dance", "Sayaw ng Unos"), N("Storm Volley", "Ulan ng Bagyo"), N("Phantom Edge", "Talim ng Multo"), N("Sky Reaver", "Mandarambong ng Langit")],
  int: [N("Spark of Insight", "Kislap ng Unawa"), N("Rune Chorus", "Koro ng Rune"), N("Astral Tide", "Astral na Alon"), N("Eclipse Sight", "Tanaw ng Eklipse"), N("Sovereign Mind", "Soberanong Isip")]
};
const SET_COLORS = {
  str: ["#f87171", "#ef4444", "#dc2626", "#fb7185", "#ff4d6d"],
  dex: ["#4ade80", "#22c55e", "#2dd4bf", "#a3e635", "#34d399"],
  int: ["#93c5fd", "#60a5fa", "#a78bfa", "#c084fc", "#e9d5ff"]
};

// Per-piece bonus, set bonuses at 2 / 4 / 6 pieces and the skill boost at 4 / 6 pieces (t = tier 1–5)
const PIECE = {
  str: (t) => ({ hp: 5 * t }),
  dex: (t) => ({ crit: 1 }),
  int: (t) => ({ hp: 4 * t })
};
const BONUS = {
  str: (t) => ({ 2: { str: t + 1, def: 3 * t }, 4: { atk: 2 * t, hp: 20 * t }, 6: { str: 2 * t + 1, vit: 2 * t } }),
  dex: (t) => ({ 2: { dex: t + 1, atk: 3 * t, def: 2 * t }, 4: { atk: 2 * t, crit: 2 + t, hp: 15 * t }, 6: { dex: 2 * t + 1, agi: 2 * t, spd: 0.05 } }),
  int: (t) => ({ 2: { int: t + 1, cdr: 1 + t, def: 2 * t }, 4: { atk: 2 * t, hp: 15 * t }, 6: { int: 2 * t + 1, luk: 2 * t } })
};
const SKILL = {
  str: (t) => ({ 4: { dmg: 1 + t }, 6: { dmg: 2 + 2 * t, dmgReduce: 3 + t, kcd: 4 + t } }),
  dex: (t) => ({ 4: { dmg: 1 + t }, 6: { dmg: 2 + 2 * t, dmgReduce: 3 + t, lcd: 4 + t } }),
  int: (t) => ({ 4: { dmg: 1 + t }, 6: { dmg: 2 + 2 * t, heal: 8 + 3 * t, kcd: 2 + t, lcd: 2 + t } })
};

// Set id: "<path><level>", e.g. "str10", "int50"
export const CRAFT_SETS = {};
CRAFT_TIERS.forEach((c, i) => PATH_ORDER.forEach((path) => {
  CRAFT_SETS[`${path}${c.level}`] = {
    crafted: true, tier: c.tier, level: c.level, path, grade: c.grade, color: SET_COLORS[path][i],
    name: SET_NAMES[path][i], passive: PASSIVES[path][i],
    piece: PIECE[path](c.tier), bonus: BONUS[path](c.tier), skill: SKILL[path](c.tier)
  };
}));

// ---------- Material drops ----------
// Per kill, by monster tier. ore = [chance, min, max] · essence / core = chance (core: × the count at mvp)
// Night and level difference scale the chances like the rest of the loot (dm from rollDrop).
const DROPS = {
  normal:   { ore: [0.35, 1, 2], essence: 0.35, core: 0.03, food: 0.08 },
  champion: { ore: [0.7, 2, 3], essence: 0.5, core: 0.12, food: 0.15, essenceQty: 2 },
  elite:    { ore: [1, 3, 4], essence: 1, core: 0.5, food: 0.3, essenceQty: 2, nextOre: [0.2, 1, 2], nextCore: 0.06 },
  mvp:      { ore: [1, 8, 10], essence: 1, core: 1, food: 1, coreQty: 3, essenceQty: 3, nextOre: [1, 2, 4], nextCore: 0.35 }
};
// next*: the next tier's materials. Elites roll them only from the Lv 50 tier up (Siege and Maw elites), so the
// Lv 75 set can be started in Book I without a Lv 50 monster; the Lv 100 set still needs transmuting or later Books.
const NEXT_FROM_TIER = { elite: 3, mvp: 1 };
const MEAT_RACES = ["brute", "dragon", "fish", "demihuman"];
const SPICE_RACES = ["plant", "insect", "formless"];

// info: { level (monster), tier, boss, element, race } · dm = drop multiplier · returns instances
export function rollMaterials(info = {}, dm = 1, rnd = Math.random) {
  const D = DROPS[info.tier] || (info.boss ? DROPS.mvp : DROPS.normal);
  const c = CRAFT_TIERS[tierOfLevel(info.level || 1) - 1];
  const out = [];
  const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  if (rnd() < D.ore[0] * dm) out.push({ id: c.ore, qty: between(D.ore[1], D.ore[2]) });
  if (rnd() < D.essence * dm) {
    // the element decides half the time, so every Act still yields all three essences (transmute evens out the rest)
    const random = PATHS[["str", "dex", "int"][Math.floor(rnd() * 3)]].essence;
    const pick = ESSENCE_OF[info.element] && rnd() < 0.5 ? ESSENCE_OF[info.element] : random;
    out.push({ id: pick, qty: D.essenceQty || 1 });
  }
  if (rnd() < D.core * dm) out.push({ id: c.core, qty: D.coreQty || 1 });
  const kind = DROPS[info.tier] ? info.tier : info.boss ? "mvp" : "normal";
  if (c.tier < CRAFT_TIERS.length && c.tier >= (NEXT_FROM_TIER[kind] || Infinity)) {
    const n = CRAFT_TIERS[c.tier];
    if (D.nextOre && rnd() < D.nextOre[0]) out.push({ id: n.ore, qty: between(D.nextOre[1], D.nextOre[2]) });
    if (D.nextCore && rnd() < D.nextCore) out.push({ id: n.core, qty: 1 });
  }
  // Cooking ingredients (js/items/cooking.js): beasts drop meat, plants and insects drop spice
  if (rnd() < D.food * dm) {
    const meat = MEAT_RACES.includes(info.race), spice = SPICE_RACES.includes(info.race);
    const id = meat && !spice ? "beastMeat" : spice && !meat ? "wildSpice" : rnd() < 0.5 ? "beastMeat" : "wildSpice";
    out.push({ id, qty: info.boss ? 4 : 1 });
  }
  return out;
}

// ---------- Recipes ----------
// Pieces a set can have (rings fit either ring slot, so up to 9 can be worn at once; 6 complete the set).
// The off-hand is offered only to classes that have one.
export const CRAFT_SLOTS = ["weapon", "offhand", "head", "armor", "garment", "gloves", "boots", "amulet", "ring"];
// Sized with balance-sim --economy so a full set takes about as many kills as the levels it is worn for
const ORE_QTY = [6, 8, 10, 12, 15];
const CORE_QTY = [1, 1, 2, 2, 3];          // weapon +1; only the weapon, armor and head need cores
const ESS_QTY = [2, 2, 3, 4, 5];
const GOLD = [60, 220, 700, 1800, 4500];

// Materials + gold for one piece: { [itemId]: qty, gold }
export function recipeFor(setId, slot) {
  const s = CRAFT_SETS[setId];
  if (!s) return null;
  const c = CRAFT_TIERS[s.tier - 1], i = s.tier - 1;
  const k = slot === "weapon" ? 1.5 : slot === "amulet" || slot === "ring" ? 0.6 : 1;
  const cores = slot === "weapon" ? CORE_QTY[i] + 1 : slot === "armor" || slot === "head" ? CORE_QTY[i] : 0;
  return {
    [c.ore]: Math.ceil(ORE_QTY[i] * k),
    ...(cores ? { [c.core]: cores } : {}),
    [PATHS[s.path].essence]: Math.ceil(ESS_QTY[i] * k),
    gold: Math.round(GOLD[i] * k)
  };
}

// What a crafted piece is worth (gold + materials at their base price); shops buy it back at a fraction
export function craftValue(setId, slot) {
  const r = recipeFor(setId, slot);
  if (!r) return 0;
  return Object.entries(r).reduce((v, [id, n]) => v + (id === "gold" ? n : n * (CRAFT_ITEMS[id] ? CRAFT_ITEMS[id].price : 0)), 0);
}

// ---------- Ore veins ----------
// Every Act platform has veins of its tier's crafting ore (no pickaxe needed); the Ashfall and the Siege
// keep their dwarven minerals (def.ore), which still need Thane Durgrim's pickaxe. Breaking a vein may
// also chip off Rock Salt for cooking.
export const FREE_ORES = CRAFT_TIERS.map((c) => c.ore);
export const SALT_CHANCE = 0.4;
export function veinsFor(def) {
  const ore = CRAFT_TIERS[tierOfLevel((def.tier >= 2 ? def.tier * 5 : 1) + 3) - 1].ore;
  if (!def.ore) return { count: 8, kinds: [[ore, 1]] };
  return { count: def.ore.count + 4, kinds: [...def.ore.kinds.map(([id, w]) => [id, w * 0.6]), [ore, 0.4]] };
}
