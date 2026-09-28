import { getLang } from "../i18n.js";

// ==================== ITEM DATABASE ====================
// Hango sa Ragnarok Online at Diablo II, may isekai na timpla (LORE Acts IV–V: Dual Equipment Matrix).
//
// URI: equip | consume | material | card | quest
// SLOT NG KAGAMITAN (10): weapon, offhand, head, armor, garment, gloves, boots, amulet, ring1, ring2
//   Ang 2H na sandata ay nagla-lock ng offhand (LORE Act V).
// RARITY (Diablo II): normal (puti) · magic (asul, 1–2 affix) · rare (dilaw, 3–4 affix) · unique (ginto)
// SOCKET at CARD (Ragnarok): may 0–3 socket ang kagamitan; ang card ng halimaw ay isinisingit dito.
// REFINE (Ragnarok): +1 hanggang +10. Ligtas hanggang +4; mula +5 may tsansang pumalya
//   (nawawala ang materyales pero hindi ang item — awa ng isekai).
// GRADE (tier 0–7): kung saang lugar nahulog; lumalaki ang stats bawat grade.
//
// Ang isang item sa bag o suot ay "instance": { id, qty, plus, rarity, affixes: [{k, v}], sockets, cards: [] }
// Ang id ng kagamitan ay "base@grade" (hal. "lance@3"); ang unique ay "u:susi".

export const MAX_PLUS = 10;
export const SAFE_PLUS = 4;
export const SLOTS = ["weapon", "offhand", "head", "armor", "garment", "gloves", "boots", "amulet", "ring1", "ring2"];
export const STAT_NAMES = ["str", "agi", "vit", "int", "dex", "luk"];

export const RARITY = {
  normal: { color: "#e2e8f0", en: "Normal", fil: "Karaniwan" },
  magic: { color: "#60a5fa", en: "Magic", fil: "Mahiwaga" },
  rare: { color: "#facc15", en: "Rare", fil: "Bihira" },
  unique: { color: "#f59e0b", en: "Unique", fil: "Natatangi" }
};
export const GRADE_NAMES = ["Aethelgard", "Iron", "Sylvan", "Tidal", "Frostforged", "Hellforged", "Imperial", "Sovereign"];

const lang = () => (getLang() === "fil" ? "fil" : "en");
const N = (en, fil = en) => ({ en, fil });

// ---------- BASE NG KAGAMITAN ----------
// icon = uri ng pixel icon (js/items/icons.js). look = piyesa ng Avatar (weapon/offhand lang).
// stats sa grade 0; lumalaki ng ×(1 + grade × 0.6). sockets = pinakamaraming socket.
const EQUIP = {
  // ---- Novice (Act IV) ----
  knife:      { slot: "weapon", hands: 1, cls: ["novice"], icon: "dagger", stats: { atk: 3 }, look: { weapon: "novice" }, sockets: 1, name: N("Knife", "Kutsilyo") },
  cutter:     { slot: "weapon", hands: 1, cls: ["novice"], icon: "dagger", stats: { atk: 5, crit: 2 }, look: { weapon: "novice" }, sockets: 1, name: N("Cutter", "Cutter") },
  guard:      { slot: "offhand", cls: ["novice"], icon: "buckler", stats: { def: 2 }, sockets: 1, name: N("Guard", "Panangga") },
  // ---- Knight ----
  lance:      { slot: "weapon", hands: 2, cls: ["knight"], icon: "lance", stats: { atk: 14 }, look: { weapon: "lance", shield: null }, sockets: 2, name: N("Heavy Lance", "Mabigat na Lance") },
  pike:       { slot: "weapon", hands: 2, cls: ["knight"], icon: "lance", stats: { atk: 12, crit: 3 }, look: { weapon: "lance", shield: null }, sockets: 3, name: N("Pike", "Pike") },
  claymore:   { slot: "weapon", hands: 2, cls: ["knight"], icon: "greatsword", stats: { atk: 16 }, look: { weapon: "greatsword", shield: null }, sockets: 2, name: N("Claymore", "Claymore") },
  broadsword: { slot: "weapon", hands: 1, cls: ["knight"], icon: "sword", stats: { atk: 9 }, look: { weapon: "sword" }, sockets: 2, name: N("Broadsword", "Broadsword") },
  tower:      { slot: "offhand", cls: ["knight"], icon: "tower", stats: { def: 6, hp: 20 }, look: { shield: "tower" }, sockets: 1, name: N("Tower Shield", "Tower Shield") },
  // ---- Mage ----
  greatstaff: { slot: "weapon", hands: 2, cls: ["mage"], icon: "staff", stats: { atk: 15 }, look: { weapon: "staff" }, sockets: 2, name: N("Great Staff", "Dakilang Tungkod") },
  rod:        { slot: "weapon", hands: 1, cls: ["mage", "priest"], icon: "wand", stats: { atk: 8, cdr: 4 }, look: { weapon: "wand" }, sockets: 2, name: N("Arc Wand", "Arc Wand") },
  grimoire:   { slot: "offhand", cls: ["mage", "priest"], icon: "book", stats: { cdr: 8, def: 2 }, look: { shield: null }, sockets: 1, name: N("Arcane Grimoire", "Arcane Grimoire") },
  // ---- Priest ----
  scepter:    { slot: "weapon", hands: 2, cls: ["priest"], icon: "scepter", stats: { atk: 12, hp: 15 }, look: { weapon: "scepter" }, sockets: 2, name: N("Grand Scepter", "Dakilang Setro") },
  mace:       { slot: "weapon", hands: 1, cls: ["priest"], icon: "mace", stats: { atk: 9, def: 2 }, look: { weapon: "scepter" }, sockets: 2, name: N("Morning Star", "Morning Star") },
  // ---- Archer ----
  longbow:    { slot: "weapon", hands: 2, cls: ["archer"], icon: "bow", stats: { atk: 13, crit: 4 }, look: { weapon: "bow", quiver: true }, sockets: 2, name: N("Recurve Longbow", "Recurve Longbow") },
  composite:  { slot: "weapon", hands: 2, cls: ["archer"], icon: "bow", stats: { atk: 11, aspd: 6 }, look: { weapon: "bow", quiver: true }, sockets: 3, name: N("Composite Bow", "Composite Bow") },
  crossbow:   { slot: "weapon", hands: 1, cls: ["archer"], icon: "crossbow", stats: { atk: 9, spd: 0.05 }, look: { weapon: "crossbow", quiver: false }, sockets: 2, name: N("Automatic Crossbow", "Automatic Crossbow") },
  traps:      { slot: "offhand", cls: ["archer"], icon: "traps", stats: { crit: 5, def: 2 }, sockets: 1, name: N("Trapper Tools", "Gamit ng Mangangaso") },
  // ---- Fighter ----
  claws:      { slot: "weapon", hands: 2, cls: ["fighter"], icon: "claws", stats: { atk: 13, crit: 5 }, look: { gloves: "leather" }, sockets: 2, name: N("Dual Katar", "Dalawang Katar") },
  knuckle:    { slot: "weapon", hands: 1, cls: ["fighter"], icon: "knuckle", stats: { atk: 9, def: 2 }, look: { gloves: "wraps" }, sockets: 2, name: N("Brawler Knuckle", "Knuckle ng Brawler") },
  talisman:   { slot: "offhand", cls: ["fighter"], icon: "talisman", stats: { cdr: 6, crit: 3 }, sockets: 1, name: N("Qi Talisman", "Qi Talisman") },
  // ---- Ulo (Ragnarok headgear) ----
  bandana:    { slot: "head", icon: "bandana", stats: { def: 1, agi: 1 }, sockets: 1, name: N("Bandana", "Bandana") },
  helm:       { slot: "head", cls: ["knight", "fighter", "archer", "novice"], icon: "helm", stats: { def: 4, hp: 10 }, sockets: 1, name: N("Helm", "Helmet") },
  wizhat:     { slot: "head", cls: ["mage", "priest"], icon: "hat", stats: { def: 1, int: 2 }, sockets: 1, name: N("Wizard Hat", "Sombrero ng Salamangkero") },
  circlet:    { slot: "head", icon: "circlet", stats: { crit: 2, cdr: 2 }, sockets: 1, name: N("Astral Circlet", "Astral na Korona") },
  bunny:      { slot: "head", icon: "bunny", stats: { luk: 3, def: 1 }, sockets: 1, name: N("Bunny Band", "Bunny Band") },
  // ---- Baluti ----
  tunic:      { slot: "armor", icon: "tunic", stats: { def: 2, hp: 10 }, sockets: 1, name: N("Adventurer's Suit", "Kasuotan ng Adventurer") },
  mail:       { slot: "armor", cls: ["knight", "fighter", "archer"], icon: "mail", stats: { def: 5, hp: 20 }, sockets: 1, name: N("Chain Mail", "Chain Mail") },
  plate:      { slot: "armor", cls: ["knight"], icon: "plate", stats: { def: 9, hp: 30, spd: -0.05 }, sockets: 1, name: N("Full Plate", "Full Plate") },
  robe:       { slot: "armor", cls: ["mage", "priest"], icon: "robe", stats: { def: 3, hp: 12, cdr: 3 }, sockets: 1, name: N("Silk Robe", "Robang Seda") },
  // ---- Garment (Ragnarok) ----
  hood:       { slot: "garment", icon: "cloak", stats: { def: 1, agi: 1 }, sockets: 1, name: N("Hood", "Talukbong") },
  muffler:    { slot: "garment", icon: "cloak", stats: { def: 2, hp: 10 }, sockets: 1, name: N("Muffler", "Muffler") },
  manteau:    { slot: "garment", icon: "cloak", stats: { def: 3 }, sockets: 1, name: N("Manteau", "Manteau") },
  // ---- Guwantes at bota (Diablo II) ----
  leatherglove:{ slot: "gloves", icon: "gloves", stats: { def: 1, aspd: 3 }, sockets: 0, name: N("Leather Gloves", "Guwantes na Katad") },
  gauntlets:  { slot: "gloves", cls: ["knight", "fighter"], icon: "gauntlet", stats: { def: 3, str: 1 }, sockets: 0, name: N("Gauntlets", "Gauntlets") },
  sandals:    { slot: "boots", icon: "boots", stats: { spd: 0.05 }, sockets: 1, name: N("Sandals", "Sandalyas") },
  boots:      { slot: "boots", icon: "boots", stats: { def: 2, spd: 0.04 }, sockets: 1, name: N("Boots", "Bota") },
  greaves:    { slot: "boots", cls: ["knight", "fighter"], icon: "greaves", stats: { def: 4 }, sockets: 1, name: N("Greaves", "Greaves") },
  // ---- Accessory: amulet at singsing ----
  clip:       { slot: "amulet", icon: "amulet", stats: { hp: 15 }, sockets: 1, name: N("Clip", "Clip") },
  brooch:     { slot: "amulet", icon: "brooch", stats: { agi: 2, def: 1 }, sockets: 1, name: N("Brooch", "Brooch") },
  pendant:    { slot: "amulet", icon: "amulet", stats: { int: 2, cdr: 2 }, sockets: 1, name: N("Pendant", "Palawit") },
  ring:       { slot: "ring", icon: "ring", stats: { str: 2 }, sockets: 1, name: N("Ring", "Singsing") },
  earring:    { slot: "ring", icon: "earring", stats: { int: 2 }, sockets: 1, name: N("Earring", "Hikaw") },
  rosary:     { slot: "ring", icon: "rosary", stats: { luk: 2, hp: 10 }, sockets: 1, name: N("Rosary", "Rosaryo") }
};

// ---------- UNIQUE (isekai na alamat) ----------
const UNIQUES = {
  craneline:  { base: "lance", name: N("Crane-Line Breaker", "Pambasag ng Crane-Line"), stats: { atk: 20, str: 5, def: 4 } },
  verdict:    { base: "broadsword", name: N("Astraea's Verdict", "Hatol ni Astraea"), stats: { atk: 14, luk: 5, crit: 5 } },
  recurve:    { base: "longbow", name: N("Olympic Recurve", "Olympic Recurve"), stats: { atk: 12, dex: 7, crit: 8 } },
  scalpel:    { base: "mace", name: N("Scalpel of Triage", "Scalpel ng Triage"), stats: { int: 6, cdr: 10, hp: 20 } },
  atacama:    { base: "greatstaff", name: N("Atacama Array Rod", "Tungkod ng Atacama Array"), stats: { atk: 14, int: 8 } },
  streetking: { base: "knuckle", name: N("Street King's Wraps", "Balot ng Hari ng Lansangan"), stats: { atk: 10, str: 6, crit: 6 } },
  headlight:  { base: "circlet", name: N("Truck-kun's Headlight", "Headlight ni Truck-kun"), stats: { luk: 10, spd: 0.1 } },
  necktie:    { base: "clip", name: N("Salaryman's Last Necktie", "Huling Kurbata ng Salaryman"), stats: { vit: 6, hp: 40 } },
  eclipse:    { base: "ring", name: N("Eclipse Band", "Singsing ng Eklipse"), stats: { str: 2, agi: 2, vit: 2, int: 2, dex: 2, luk: 2 } },
  pentagram:  { base: "manteau", name: N("Pentagram Seal Manteau", "Manteau ng Pentagram Seal"), stats: { def: 6, agi: 5 } },
  promise:    { base: "rosary", name: N("Summoner's Promise", "Pangako ng Tagapagtawag"), stats: { hp: 30, cdr: 5, luk: 4 } }
};

// ---------- AFFIX (Diablo II) ----------
// base = halaga sa grade 0 (lumalaki ng ×(1 + grade × 0.5))
const PREFIXES = [
  { k: "atk", base: 4, name: N("Mighty", "Makapangyarihang") },
  { k: "def", base: 3, name: N("Sturdy", "Matibay na") },
  { k: "hp", base: 15, name: N("Vital", "Masiglang") },
  { k: "crit", base: 3, name: N("Keen", "Matalas na") },
  { k: "cdr", base: 3, name: N("Arcane", "Arkanong") },
  { k: "aspd", base: 4, name: N("Swift", "Mabilis na") }
];
const SUFFIXES = [
  { k: "str", base: 2, name: N("of Strength", "ng Lakas") },
  { k: "agi", base: 2, name: N("of Agility", "ng Liksi") },
  { k: "vit", base: 2, name: N("of Vitality", "ng Sigla") },
  { k: "int", base: 2, name: N("of the Mind", "ng Isip") },
  { k: "dex", base: 2, name: N("of Precision", "ng Katumpakan") },
  { k: "luk", base: 2, name: N("of Fortune", "ng Suwerte") },
  { k: "spd", base: 0.04, name: N("of the Wind", "ng Hangin") }
];
const RARE_A = ["Doom", "Storm", "Eclipse", "Grave", "Dawn", "Void", "Ember", "Frost", "Blood", "Star", "Rune", "Ashen"];
const RARE_B = ["Bite", "Song", "Ward", "Fang", "Veil", "Spire", "Mark", "Wreath", "Coil", "Shroud", "Edge", "Heart"];

// ---------- GAMIT, MATERYALES, QUEST ITEM ----------
const OTHER = {
  salve:    { type: "consume", icon: "potion", tint: "#ef4444", price: 10, effect: { heal: 40 }, name: N("Red Potion", "Pulang Potion"), desc: N("Restores 40 HP.", "Nagbabalik ng 40 HP.") },
  elixir:   { type: "consume", icon: "potion", tint: "#f8fafc", price: 30, effect: { heal: 150 }, name: N("White Potion", "Puting Potion"), desc: N("Restores 150 HP.", "Nagbabalik ng 150 HP.") },
  tonic:    { type: "consume", icon: "potion", tint: "#facc15", price: 12, effect: { stamina: 100, fresh: 600 }, name: N("Stamina Tonic", "Tonic ng Lakas"), desc: N("Refills stamina; no fatigue for 10s.", "Puno ang stamina; walang pagod sa 10s.") },
  panacea:  { type: "consume", icon: "potion", tint: "#4ade80", price: 15, effect: { cure: true }, name: N("Edgar's Panacea", "Panacea ni Edgar"), desc: N("Purges all seven miasmic blights.", "Inaalis ang pitong sumpa ng miasma.") },
  herb:     { type: "consume", icon: "herb", price: 6, effect: { heal: 30, resetSkill: true }, name: N("Yggdrasil Leaf", "Dahon ng Yggdrasil"), desc: N("+30 HP and resets your skill cooldown.", "+30 HP at nire-reset ang cooldown ng skill.") },
  shardPower: { type: "consume", icon: "shard", tint: "#ef4444", price: 8, effect: { buff: "damage", time: 420 }, name: N("Power Shard", "Shard ng Lakas"), desc: N("+50% damage for 7s.", "+50% pinsala sa 7s.") },
  shardRapid: { type: "consume", icon: "shard", tint: "#facc15", price: 8, effect: { buff: "atkSpeed", time: 420 }, name: N("Rapid Shard", "Shard ng Bilis ng Atake"), desc: N("Double attack speed for 7s.", "Dobleng bilis ng atake sa 7s.") },
  shardSwift: { type: "consume", icon: "shard", tint: "#38bdf8", price: 8, effect: { buff: "moveSpeed", time: 420 }, name: N("Swift Shard", "Shard ng Takbo"), desc: N("+50% move speed for 7s.", "+50% bilis ng lakad sa 7s.") },
  shardGhost: { type: "consume", icon: "shard", tint: "#a855f7", price: 8, effect: { buff: "invis", time: 360 }, name: N("Ghost Shard", "Shard ng Multo"), desc: N("Near-invisible for 6s.", "Halos di-makita sa 6s.") },
  monsterShard: { type: "material", icon: "ore", tint: "#94a3b8", price: 4, name: N("Phracon Shard", "Phracon Shard"), desc: N("Refine material (+1 to +5).", "Pang-refine (+1 hanggang +5).") },
  voidCrystal:  { type: "material", icon: "crystal", tint: "#a855f7", price: 20, name: N("Void Oridecon", "Void Oridecon"), desc: N("Purified miasma ore. Needed from +6 to +10.", "Nilinis na mineral ng miasma. Kailangan mula +6 hanggang +10.") },
  heartstone:   { type: "quest", icon: "heart", tint: "#ef4444", name: N("Blighted Heartstone", "Bulok na Heartstone"), desc: N("Malakor's shattered heart. Bring it to your summoner.", "Ang basag na puso ni Malakor. Dalhin sa tagapagtawag.") },
  abyssHelm:    { type: "quest", icon: "shell", tint: "#38bdf8", name: N("Abyssal Helm Shard", "Piraso ng Abyssal Helm"), desc: N("Broken from the Leviathan Regent's crown.", "Nabasag mula sa korona ng Leviathan Regent.") },
  cryoCore:     { type: "quest", icon: "crystal", tint: "#bfe9ff", name: N("Cryonix Core", "Core ni Cryonix"), desc: N("The fractured heart of the Frost Empress.", "Ang basag na puso ng Frost Empress.") },
  forgeCore:    { type: "quest", icon: "heart", tint: "#ff7a1a", name: N("Hellforge Reactor Core", "Reactor Core ng Hellforge"), desc: N("Torn from Ignis the Iron Lord.", "Hinugot mula kay Ignis the Iron Lord.") },
  imperialCrest:{ type: "quest", icon: "crest", tint: "#ffd166", name: N("Imperial Crest", "Imperial Crest"), desc: N("The King's last gift, for the new Sovereign.", "Huling handog ng Hari para sa bagong Sovereign.") },
  astralAsh:    { type: "quest", icon: "ash", tint: "#fde68a", name: N("Astral Ash of Satan", "Astral na Abo ni Satan"), desc: N("All that remains of the Demon Lord.", "Ang natira sa Demon Lord.") }
};

// ---------- CARDS (Ragnarok) — isa bawat halimaw at boss ----------
const CARDS = {
  slime: { n: N("Slime", "Slime"), stats: { hp: 20 } },
  wolf: { n: N("Dire Wolf", "Mabangis na Lobo"), stats: { atk: 6 } },
  skeleton: { n: N("Skeleton Lancer", "Kalansay na Lancer"), stats: { crit: 4 } },
  voidSlime: { n: N("Void Slime", "Slime ng Void"), stats: { def: 3, hp: 10 } },
  sporeling: { n: N("Sporeling", "Sporeling"), stats: { vit: 2 } },
  shadowDrake: { n: N("Shadow Drake", "Drake ng Anino"), stats: { agi: 3 } },
  beastman: { n: N("Beastman", "Beastman"), stats: { str: 3 } },
  tideSlime: { n: N("Brine Slime", "Slime ng Alat"), stats: { hp: 30 } },
  reefCrab: { n: N("Abyssal Crab", "Alimango"), stats: { def: 5 } },
  mariner: { n: N("Drowned Mariner", "Nalunod na Mandaragat"), stats: { int: 3 } },
  tideSerpent: { n: N("Tide Serpent", "Serpent ng Alon"), stats: { dex: 3 } },
  yeti: { n: N("Yeti", "Yeti"), stats: { vit: 4 } },
  iceGolem: { n: N("Ice Golem", "Golem na Yelo"), stats: { def: 8 } },
  wyvern: { n: N("Frost Wyvern", "Wyvern ng Yelo"), stats: { agi: 4 } },
  imp: { n: N("Imp", "Imp"), stats: { atk: 8 } },
  obsidianGolem: { n: N("Obsidian Golem", "Golem na Obsidian"), stats: { hp: 50 } },
  demonKnight: { n: N("Demon Knight", "Kabalyerong Demonyo"), stats: { str: 5 } },
  magmaDrake: { n: N("Magma Drake", "Drake ng Magma"), stats: { atk: 12 } },
  shockTrooper: { n: N("Shock Trooper", "Shock Trooper"), stats: { crit: 6 } },
  voidSpider: { n: N("Miasma Spider", "Gagamba ng Miasma"), stats: { dex: 5 } },
  specter: { n: N("Spectral Horror", "Multong Kakila-kilabot"), stats: { luk: 6 } },
  malakor: { n: N("Malakor", "Malakor"), stats: { vit: 6, hp: 60 }, boss: true },
  leviathan: { n: N("Leviathan Regent", "Leviathan Regent"), stats: { int: 6, cdr: 6 }, boss: true },
  cryonix: { n: N("Cryonix", "Cryonix"), stats: { agi: 6, aspd: 8 }, boss: true },
  ignis: { n: N("Ignis", "Ignis"), stats: { str: 7, atk: 15 }, boss: true },
  commander: { n: N("Demon Commander", "Heneral ng mga Demonyo"), stats: { crit: 10, dex: 5 }, boss: true },
  satan: { n: N("Satan", "Satan"), stats: { str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5 }, boss: true }
};

// ---------- SLOT / STAT NAMES ----------
const SLOT_NAMES = {
  en: { weapon: "Weapon", offhand: "Off-hand", head: "Head", armor: "Armor", garment: "Garment", gloves: "Gloves", boots: "Boots", amulet: "Amulet", ring1: "Ring", ring2: "Ring", ring: "Ring" },
  fil: { weapon: "Sandata", offhand: "Kabilang kamay", head: "Ulo", armor: "Baluti", garment: "Balabal", gloves: "Guwantes", boots: "Bota", amulet: "Kuwintas", ring1: "Singsing", ring2: "Singsing", ring: "Singsing" }
};
export const slotName = (s) => SLOT_NAMES[lang()][s] || s;

const STAT_LABEL = {
  atk: "ATK", def: "DEF", hp: "HP", crit: "CRIT%", cdr: "CDR%", aspd: "ASPD%", spd: "MOVE",
  str: "STR", agi: "AGI", vit: "VIT", int: "INT", dex: "DEX", luk: "LUK"
};
export function statText(k, v) {
  const sign = v >= 0 ? "+" : "";
  return `${STAT_LABEL[k] || k.toUpperCase()} ${sign}${k === "spd" ? v.toFixed(2) : v}`;
}

// "lance@3" → { base: "lance", grade: 3 }
export function parseId(id) {
  const [base, g] = String(id).split("@");
  return { base, grade: g === undefined ? 0 : Math.max(0, Math.min(7, parseInt(g, 10) || 0)) };
}

const scaleStats = (stats, mult, spdMult) => {
  const out = {};
  Object.entries(stats).forEach(([k, v]) => { out[k] = k === "spd" ? +(v * spdMult).toFixed(2) : Math.round(v * mult); });
  return out;
};
const addStats = (a, b) => { Object.entries(b || {}).forEach(([k, v]) => { a[k] = +((a[k] || 0) + v).toFixed(2); }); return a; };

// ---------- DESCRIBE: buong impormasyon mula sa instance ----------
export function describe(inst) {
  if (!inst) return null;
  const L = lang();
  const id = inst.id;
  const plus = inst.plus || 0;

  // Card
  if (String(id).startsWith("card:")) {
    const key = id.slice(5), c = CARDS[key];
    if (!c) return null;
    return {
      id, type: "card", icon: "card", tint: c.boss ? "#f59e0b" : "#fde68a", stack: true, price: c.boss ? 200 : 40,
      color: c.boss ? "#f59e0b" : "#fde68a", stats: { ...c.stats },
      name: `${c.n[L]} Card`, desc: L === "fil" ? "Isingit sa bakanteng socket ng kagamitan." : "Insert into an empty socket of your equipment."
    };
  }

  // Unique o karaniwang kagamitan
  let unique = null;
  let base, grade;
  if (String(id).startsWith("u:")) {
    const [key, g] = id.slice(2).split("@");
    unique = UNIQUES[key];
    if (!unique) return null;
    base = unique.base;
    grade = g === undefined ? 0 : Math.max(0, Math.min(7, parseInt(g, 10) || 0));
  } else ({ base, grade } = parseId(id));

  const e = EQUIP[base];
  if (e) {
    const mult = (1 + grade * 0.6) * (1 + plus * 0.1);
    const stats = scaleStats(e.stats, mult, (1 + grade * 0.25) * (1 + plus * 0.05));
    if (unique) addStats(stats, scaleStats(unique.stats, 1 + grade * 0.4, 1));
    (inst.affixes || []).forEach((a) => addStats(stats, { [a.k]: a.v }));
    (inst.cards || []).forEach((cid) => { const c = CARDS[cid.slice(5)]; if (c) addStats(stats, c.stats); });

    const rarity = unique ? "unique" : inst.rarity || "normal";
    let name = e.name[L];
    if (unique) name = unique.name[L];
    else if (rarity === "magic") {
      const pre = (inst.affixes || []).find((a) => a.pre);
      const suf = (inst.affixes || []).find((a) => !a.pre);
      if (pre) name = `${pre.name[L]} ${name}`;
      if (suf) name = `${name} ${suf.name[L]}`;
    } else if (rarity === "rare" && inst.rareName) name = inst.rareName;

    const slots = inst.sockets || 0;
    return {
      id, base, grade, plus, type: "equip", slot: e.slot, hands: e.hands || 1, cls: e.cls || null,
      icon: e.icon, look: e.look || null, stats, rarity, color: RARITY[rarity].color,
      baseName: e.name[L], sockets: slots, cards: inst.cards || [],
      price: Math.round(12 * (1 + grade) * (1 + plus * 0.3) * (rarity === "unique" ? 6 : rarity === "rare" ? 3 : rarity === "magic" ? 1.6 : 1)),
      name: `${plus ? `+${plus} ` : ""}${name}${slots ? ` [${slots}]` : ""}`,
      desc: e.hands === 2 ? (L === "fil" ? "Dalawang kamay: ila-lock ang offhand." : "Two-handed: locks the off-hand slot.") : ""
    };
  }

  const o = OTHER[base];
  if (!o) return null;
  return {
    id, base, grade: 0, plus: 0, type: o.type, icon: o.icon, tint: o.tint, effect: o.effect || null,
    price: o.price || 0, stack: true, color: o.type === "quest" ? "#facc15" : o.type === "material" ? "#7dd3fc" : "#e2e8f0",
    name: o.name[L], desc: o.desc[L]
  };
}

// Para sa simpleng id (tindahan, quest, pangalan)
export function getItem(id, plus = 0) {
  return describe({ id, plus });
}

// Aling slot ang puwedeng lagyan ng item (ang singsing ay ring1 o ring2)
export function slotsFor(item) {
  return item.slot === "ring" ? ["ring1", "ring2"] : [item.slot];
}

export function canEquip(item, cls) {
  return Boolean(item && item.type === "equip" && (!item.cls || item.cls.includes(cls)));
}

// ---------- REFINE ----------
export function upgradeCost(item) {
  const next = item.plus + 1;
  return {
    shards: next <= 5 ? next * 2 : 10,
    crystals: next <= 5 ? 0 : Math.ceil((next - 5) / 2),     // +6/+7: 1 · +8/+9: 2 · +10: 3
    gold: 15 * next * (1 + item.grade)
  };
}

// Tsansang magtagumpay (Ragnarok): ligtas hanggang +4
export function refineChance(plus) {
  const next = plus + 1;
  if (next <= SAFE_PLUS) return 1;
  return [0.9, 0.78, 0.65, 0.5, 0.38, 0.28][next - 5] ?? 0.28;
}

// ---------- DROP ----------
const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];

// Gumawa ng kagamitan na may rarity, affix at socket
const RARITY_ORDER = ["normal", "magic", "rare"];

// minRarity: pinakamababang kalidad (hal. ang Elite ay laging magic o mas mataas)
export function makeEquip(grade, cls, rnd = Math.random, forceBase = null, minRarity = "normal") {
  const pool = Object.entries(EQUIP).filter(([, e]) => !e.cls || e.cls.includes(cls)).map(([k]) => k);
  const base = forceBase || pick(pool, rnd);
  const e = EQUIP[base];
  // Rarity (Diablo II): 60% karaniwan · 30% magic · 10% rare
  const r = rnd();
  let rarity = r < 0.6 ? "normal" : r < 0.9 ? "magic" : "rare";
  if (RARITY_ORDER.indexOf(rarity) < RARITY_ORDER.indexOf(minRarity)) rarity = minRarity;
  const affixes = [];
  const roll = (list, pre) => {
    const a = pick(list, rnd);
    if (affixes.some((x) => x.k === a.k)) return;
    const v = a.k === "spd" ? +(a.base * (1 + grade * 0.25) * (0.6 + rnd() * 0.4)).toFixed(2) : Math.max(1, Math.round(a.base * (1 + grade * 0.5) * (0.6 + rnd() * 0.4)));
    affixes.push({ k: a.k, v, pre, name: a.name });
  };
  if (rarity === "magic") {
    if (rnd() < 0.7) roll(PREFIXES, true);
    if (rnd() < 0.7 || !affixes.length) roll(SUFFIXES, false);
  } else if (rarity === "rare") {
    const n = 3 + (rnd() < 0.4 ? 1 : 0);
    for (let k = 0; k < n * 2 && affixes.length < n; k++) roll(rnd() < 0.5 ? PREFIXES : SUFFIXES, false);
  }
  const maxS = e.sockets || 0;
  const sockets = maxS ? Math.floor(rnd() * (maxS + 1) * (rarity === "normal" ? 1 : 0.7)) : 0;
  const inst = { id: `${base}@${grade}`, qty: 1, plus: 0, rarity, affixes, sockets: Math.min(maxS, sockets), cards: [] };
  if (rarity === "rare") inst.rareName = `${pick(RARE_A, rnd)} ${pick(RARE_B, rnd)}`;
  return inst;
}

export function makeUnique(grade, cls, rnd = Math.random) {
  const keys = Object.keys(UNIQUES).filter((k) => { const e = EQUIP[UNIQUES[k].base]; return !e.cls || e.cls.includes(cls); });
  if (!keys.length) return null;
  const key = pick(keys, rnd);
  return { id: `u:${key}@${grade}`, qty: 1, plus: 0, rarity: "unique", affixes: [], sockets: EQUIP[UNIQUES[key].base].sockets || 0, cards: [] };
}

// Drop pagkatapos mapatay ang halimaw. info: { key (uri ng halimaw), boss }
// Ibinabalik: listahan ng instance
// ---------- SAMSAM AYON SA URI NG HALIMAW ----------
// rolls      = ilang beses bubunot sa talaan ng gamot/materyales
// equip      = tsansa ng kagamitan · minRarity = pinakamababang kalidad · rareBoost = tsansang gawing rare
// unique/card = tsansa ng unique na kagamitan at ng card ng halimaw
// Sinuri gamit ang simulator (bawat 100 normal na patay sa grade 2): ~5 kagamitan (60/30/10),
// ~0.25 unique, ~0.8 card, ~36 Phracon, ~8 Oridecon, ~30 gamot/shard.
export const LOOT_TIERS = {
  normal:   { rolls: 1, equip: 0.05, minRarity: "normal", rareBoost: 0,    unique: 0.0025, card: 0.008, crystals: 0, shards: 0 },
  champion: { rolls: 2, equip: 0.25, minRarity: "normal", rareBoost: 0.15, unique: 0.01,   card: 0.03,  crystals: 0, shards: 1 },
  elite:    { rolls: 3, equip: 1,    minRarity: "magic",  rareBoost: 0.3,  unique: 0.04,   card: 0.08,  crystals: 1, shards: 2 },
  mvp:      { rolls: 4, equip: 1,    minRarity: "rare",   rareBoost: 1,    unique: 0.25,   card: 0.35,  crystals: 3, shards: 4, bonusEquip: 1 }
};

// Pagkakaiba ng level: mas kaunti mula sa mahihinang halimaw (abo), mas marami mula sa malalakas (pula)
const diffMult = (diff = 0) => (diff <= -3 ? 0.5 : diff < 0 ? 0.85 : diff >= 3 ? 1.2 : 1);

// Isang bunot sa talaan ng gamot at materyales
function rollConsumable(grade, rnd) {
  const r = rnd();
  const crystal = 0.025 * (1 + grade * 0.5);
  if (r < 0.24) return { id: "monsterShard", qty: 1 + Math.floor(rnd() * 2) };
  if (r < 0.32) return { id: "herb", qty: 1 };
  if (r < 0.40) return { id: "salve", qty: 1 };
  if (r < 0.45) return { id: "tonic", qty: 1 };
  if (r < 0.52) return { id: pick(["shardPower", "shardRapid", "shardSwift", "shardGhost"], rnd), qty: 1 };
  if (r < 0.55) return { id: "panacea", qty: 1 };
  if (r < 0.55 + crystal) return { id: "voidCrystal", qty: 1 };
  return null;
}

// info: { key (uri ng halimaw), tier ("normal" | "champion" | "elite" | "mvp"), diff (level ng halimaw − player) }
export function rollDrop(grade, cls, info = {}, rnd = Math.random) {
  const T = LOOT_TIERS[info.tier] || (info.boss ? LOOT_TIERS.mvp : LOOT_TIERS.normal);
  const dm = info.tier === "mvp" ? 1 : diffMult(info.diff);
  const out = [];
  for (let k = 0; k < T.rolls + (info.extra || 0); k++) {
    if (rnd() < dm) { const c = rollConsumable(grade, rnd); if (c) out.push(c); }
  }
  if (T.shards) out.push({ id: "monsterShard", qty: T.shards });
  if (T.crystals) out.push({ id: "voidCrystal", qty: T.crystals });

  const equipCount = (rnd() < T.equip * dm ? 1 : 0) + (T.bonusEquip || 0);
  for (let k = 0; k < equipCount; k++) {
    const g = Math.min(7, grade + (rnd() < 0.2 ? 1 : 0));
    const min = rnd() < T.rareBoost ? "rare" : T.minRarity;
    out.push(makeEquip(g, cls, rnd, null, k === 0 ? min : T.minRarity === "rare" ? "magic" : T.minRarity));
  }
  if (rnd() < T.unique * dm) { const u = makeUnique(grade, cls, rnd); if (u) out.push(u); }
  const cardKey = info.key && CARDS[info.key] ? info.key : null;
  if (cardKey && rnd() < T.card * dm) out.push({ id: `card:${cardKey}`, qty: 1 });
  return out;
}

// Default na set ng bawat class (ibinibigay ng tagapagtawag sa Job Awakening; LORE Act IV)
export const CLASS_KIT = {
  novice: { weapon: "knife", offhand: "guard", extra: [] },
  knight: { weapon: "broadsword", offhand: "tower", extra: ["lance"] },
  mage: { weapon: "greatstaff", offhand: null, extra: ["rod", "grimoire"] },
  priest: { weapon: "scepter", offhand: null, extra: ["mace", "grimoire"] },
  archer: { weapon: "longbow", offhand: null, extra: ["crossbow", "traps"] },
  fighter: { weapon: "knuckle", offhand: "talisman", extra: ["claws"] }
};
