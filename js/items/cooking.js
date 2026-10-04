// ==================== FISHING & COOKING (tables) ====================
// Ingredients: fish from fishing spots (js/world/fishing.js), Beast Meat and Wild Spice from monsters
// (js/items/craftsets.js rollMaterials), Rock Salt from ore veins (js/world/mining.js).
// Dishes are cooked at a safe zone (js/workshop.js) and eaten from the bag. One meal is active at a time
// (a new one replaces it); it adds stats and a skill boost until it wears off.
// 15 dishes: five per path (STR / DEX / INT), each step stronger and needing later-Act ingredients.
//
// Pure data plus small helpers: no imports, so js/items/itemdb.js and js/items/bag.js can import it.

const N = (en, fil = en) => ({ en, fil });

// ---------- Fish (by the kind of water: see FISH_POOLS) ----------
const FISH = {
  tilapia:  { tint: "#94a3b8", price: 6,  name: N("Tilapia", "Tilapia"), where: N("Swamp and coast water", "Tubig ng latian at baybayin") },
  mudcarp:  { tint: "#a16207", price: 8,  name: N("Mudfin Carp", "Karpang Putik"), where: N("Swamp water of the Canopy", "Latian ng Canopy") },
  mackerel: { tint: "#38bdf8", price: 12, name: N("Silver Mackerel", "Pilak na Alumahan"), where: N("The Cerulean Abyss and the Frostfang shore", "Cerulean Abyss at baybay ng Frostfang") },
  squid:    { tint: "#f0abfc", price: 18, name: N("Abyss Squid", "Pusit ng Kailaliman"), where: N("Deep sea and void water", "Malalim na dagat at tubig ng void") },
  trout:    { tint: "#bfe9ff", price: 16, name: N("Frost Trout", "Trout ng Yelo"), where: N("Ice pools of the Frostfang", "Mga lawang yelo ng Frostfang") },
  eel:      { tint: "#f97316", price: 24, name: N("Magma Eel", "Igat ng Magma"), where: N("Lava pools of the Ashfall", "Lawa ng lava sa Ashfall") },
  angler:   { tint: "#a855f7", price: 32, name: N("Void Angler", "Angler ng Void"), where: N("The void water of the Maw", "Tubig ng void sa Maw") },
  bangus:   { tint: "#fde047", price: 60, name: N("Golden Bangus", "Gintong Bangus"), where: N("Rare in any water", "Bihira sa anumang tubig") }
};
// Fish caught per platform theme (weights); a theme not listed has no fishing water
export const FISH_POOLS = {
  canopy: [["tilapia", 50], ["mudcarp", 45], ["bangus", 5]],
  coast: [["mackerel", 55], ["squid", 30], ["tilapia", 10], ["bangus", 5]],
  frost: [["trout", 75], ["mackerel", 20], ["bangus", 5]],
  ash: [["eel", 95], ["bangus", 5]],
  maw: [["angler", 75], ["squid", 20], ["bangus", 5]],
  hub: [["tilapia", 80], ["mudcarp", 15], ["bangus", 5]]
};

export const FOOD_ITEMS = {};
Object.entries(FISH).forEach(([id, f]) => {
  FOOD_ITEMS[id] = { type: "material", icon: "fish", tint: f.tint, price: f.price, name: f.name,
    desc: N(`A cooking ingredient. Caught in: ${f.where.en}.`, `Sangkap sa pagluluto. Nahuhuli sa: ${f.where.fil}.`) };
});
FOOD_ITEMS.beastMeat = { type: "material", icon: "meat", tint: "#b45309", price: 5, name: N("Beast Meat", "Karne ng Halimaw"),
  desc: N("A cooking ingredient. Beasts, brutes and dragons drop it.", "Sangkap sa pagluluto. Hulog ng mga hayop, brute at dragon.") };
FOOD_ITEMS.wildSpice = { type: "material", icon: "spice", tint: "#65a30d", price: 4, name: N("Wild Spice", "Ligaw na Pampalasa"),
  desc: N("Ginger, lemongrass and chili gathered from plant and insect monsters. A cooking ingredient.", "Luya, tanglad at sili mula sa halimaw na halaman at insekto. Sangkap sa pagluluto.") };
FOOD_ITEMS.rockSalt = { type: "material", icon: "salt", tint: "#f1f5f9", price: 3, name: N("Rock Salt", "Asin-Bato"),
  desc: N("Chipped from ore veins while mining. A cooking ingredient.", "Natipyas mula sa ugat ng mineral habang nagmimina. Sangkap sa pagluluto.") };

// ---------- Dishes ----------
// stats = while the meal lasts (same keys as gear) · skill = added to the skill-tree bonuses
// (dmg %, kcd / lcd = K / L cooldown −%, heal %, dmgReduce %, aspd %, crit %, move %, regen HP per 3 s)
// time = frames (60 = 1 s) · level = needed to cook it
const MIN = 3600;
export const DISHES = {
  // ----- Might (STR) -----
  skewer:   { path: "str", step: 1, level: 1,  time: 5 * MIN, tint: "#b45309", price: 20, ing: { beastMeat: 2, wildSpice: 1 },
    stats: { str: 3, hp: 40 }, skill: { dmg: 4 }, name: N("Beast Meat Skewer", "Inihaw na Karne ng Halimaw") },
  tilapiaGrill: { path: "str", step: 2, level: 10, time: 6 * MIN, tint: "#94a3b8", price: 40, ing: { tilapia: 1, beastMeat: 1, rockSalt: 1 },
    stats: { str: 5, atk: 8, hp: 80 }, skill: { dmg: 6, kcd: 5 }, name: N("Grilled Tilapia", "Inihaw na Tilapia") },
  sinigang: { path: "str", step: 3, level: 18, time: 7 * MIN, tint: "#facc15", price: 70, ing: { mackerel: 1, beastMeat: 1, wildSpice: 1, rockSalt: 1 },
    stats: { str: 8, vit: 5, hp: 140 }, skill: { dmg: 8, dmgReduce: 6 }, name: N("Hearty Sinigang", "Sinigang na Alumahan") },
  eelAdobo: { path: "str", step: 4, level: 28, time: 8 * MIN, tint: "#7c2d12", price: 110, ing: { eel: 1, beastMeat: 2, wildSpice: 1, rockSalt: 1 },
    stats: { str: 11, atk: 18, hp: 200 }, skill: { dmg: 11, kcd: 8, dmgReduce: 6 }, name: N("Magma Eel Adobo", "Adobong Igat ng Magma") },
  lechon:   { path: "str", step: 5, level: 38, time: 10 * MIN, tint: "#ea580c", price: 200, ing: { beastMeat: 4, rockSalt: 2, wildSpice: 2, bangus: 1 },
    stats: { str: 15, vit: 8, atk: 25, hp: 320 }, skill: { dmg: 15, kcd: 10, dmgReduce: 10 }, name: N("Warlord's Lechon", "Lechon ng Warlord") },
  // ----- Swift (DEX) -----
  tapa:     { path: "dex", step: 1, level: 1,  time: 5 * MIN, tint: "#9a3412", price: 20, ing: { beastMeat: 1, wildSpice: 2 },
    stats: { dex: 3, crit: 2 }, skill: { aspd: 4 }, name: N("Hunter's Tapa", "Tapang Mangangaso") },
  daing:    { path: "dex", step: 2, level: 10, time: 6 * MIN, tint: "#a16207", price: 40, ing: { mudcarp: 1, rockSalt: 1 },
    stats: { dex: 5, crit: 3, aspd: 3 }, skill: { aspd: 5, lcd: 5 }, name: N("Salted Daing", "Daing na Karpa") },
  pusit:    { path: "dex", step: 3, level: 18, time: 7 * MIN, tint: "#f0abfc", price: 70, ing: { squid: 1, wildSpice: 1, rockSalt: 1 },
    stats: { dex: 8, agi: 4, crit: 4 }, skill: { dmg: 6, crit: 4, move: 5 }, name: N("Grilled Abyss Squid", "Inihaw na Pusit") },
  tinapa:   { path: "dex", step: 4, level: 28, time: 8 * MIN, tint: "#bfe9ff", price: 110, ing: { trout: 2, rockSalt: 2 },
    stats: { dex: 11, agi: 6, crit: 6, aspd: 5 }, skill: { dmg: 9, lcd: 8, aspd: 6 }, name: N("Smoked Frost Trout", "Tinapang Trout ng Yelo") },
  bangusFeast: { path: "dex", step: 5, level: 38, time: 10 * MIN, tint: "#fde047", price: 200, ing: { bangus: 1, squid: 1, wildSpice: 2 },
    stats: { dex: 15, agi: 8, crit: 8, spd: 0.08 }, skill: { dmg: 12, aspd: 10, crit: 6, lcd: 10 }, name: N("Golden Bangus Feast", "Piging ng Gintong Bangus") },
  // ----- Arcane (INT) -----
  salabat:  { path: "int", step: 1, level: 1,  time: 5 * MIN, tint: "#fbbf24", price: 20, ing: { wildSpice: 3 },
    stats: { int: 3, cdr: 2 }, skill: { heal: 6 }, name: N("Salabat", "Salabat") },
  tinola:   { path: "int", step: 2, level: 10, time: 6 * MIN, tint: "#bef264", price: 40, ing: { tilapia: 1, wildSpice: 1, rockSalt: 1 },
    stats: { int: 5, cdr: 3, hp: 50 }, skill: { heal: 10, regen: 4 }, name: N("Tilapia Tinola", "Tinolang Tilapia") },
  paksiw:   { path: "int", step: 3, level: 18, time: 7 * MIN, tint: "#a3a3a3", price: 70, ing: { mackerel: 1, rockSalt: 1, wildSpice: 2 },
    stats: { int: 8, luk: 4, cdr: 4 }, skill: { dmg: 6, kcd: 6, lcd: 6 }, name: N("Mackerel Paksiw", "Paksiw na Alumahan") },
  nilaga:   { path: "int", step: 4, level: 28, time: 8 * MIN, tint: "#a855f7", price: 110, ing: { angler: 1, wildSpice: 1, rockSalt: 1 },
    stats: { int: 11, luk: 6, cdr: 5, hp: 120 }, skill: { dmg: 9, kcd: 8, heal: 14 }, name: N("Void Angler Nilaga", "Nilagang Angler ng Void") },
  pancit:   { path: "int", step: 5, level: 38, time: 10 * MIN, tint: "#fcd34d", price: 200, ing: { bangus: 1, angler: 1, wildSpice: 2, rockSalt: 1 },
    stats: { int: 15, luk: 8, cdr: 6, hp: 180 }, skill: { dmg: 12, kcd: 10, lcd: 10, heal: 18 }, name: N("Sovereign's Pancit", "Pancit ng Soberano") }
};

const PATH_WORD = { str: N("Might", "Lakas"), dex: N("Swift", "Liksi"), int: N("Arcane", "Arkano") };
Object.entries(DISHES).forEach(([id, d]) => {
  const mins = Math.round(d.time / MIN);
  FOOD_ITEMS[id] = {
    type: "consume", icon: "dish", tint: d.tint, price: d.price, effect: { meal: id }, name: d.name,
    desc: N(`${PATH_WORD[d.path].en} meal for ${mins} min. Replaces the meal you are under.`,
      `Pagkaing ${PATH_WORD[d.path].fil} sa loob ng ${mins} minuto. Papalitan ang kasalukuyang pagkain.`)
  };
});

export const DISH_ORDER = ["str", "dex", "int"].flatMap((p) => Object.keys(DISHES).filter((id) => DISHES[id].path === p));

// Can the hero cook it? Returns "" or "level" | "ingredients"
export function cookCheck(bag, level, id) {
  const d = DISHES[id];
  if (!d) return "ingredients";
  if (level < d.level) return "level";
  return Object.entries(d.ing).every(([k, n]) => bag.count(k) >= n) ? "" : "ingredients";
}

// Cooks one dish into the bag. Returns "" or the reason ("level" | "ingredients" | "full")
export function cook(bag, level, id) {
  const err = cookCheck(bag, level, id);
  if (err) return err;
  if (!bag.add(id, 1)) return "full";
  Object.entries(DISHES[id].ing).forEach(([k, n]) => bag.take(k, n));
  return "";
}

// The active meal's bonuses: { stats, skill } (empty when none). meal = { id, t }
export function mealBonus(meal) {
  const d = meal && meal.t > 0 && DISHES[meal.id];
  return d ? { stats: d.stats, skill: d.skill } : { stats: {}, skill: {} };
}

// Eats a dish: the new meal replaces the old one
export function startMeal(player, id) {
  const d = DISHES[id];
  if (!d) return false;
  player.meal = { id, t: d.time };
  if (player.recalc) player.recalc();
  return true;
}
