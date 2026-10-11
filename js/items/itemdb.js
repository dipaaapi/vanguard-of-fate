import { getLang } from "../i18n.js";
import { CRAFT_ITEMS, CRAFT_SETS, rollMaterials } from "./craftsets.js";
import { FOOD_ITEMS } from "./cooking.js";

// ==================== ITEM DATABASE ====================
// Inspired by Ragnarok Online and Diablo II, with an isekai twist (LORE Acts IV–V: Dual Equipment Matrix).
//
// TYPES: equip | consume | material | card | quest
// EQUIPMENT SLOTS (10): weapon, offhand, head, armor, garment, gloves, boots, amulet, ring1, ring2
//   A 2H weapon locks the off-hand (LORE Act V).
// RARITY (Diablo II): normal (white) · magic (blue, 1–2 affixes) · rare (yellow, 3–4 affixes) · unique (gold) · set (green)
// SOCKETS and CARDS (Ragnarok): equipment has 0–3 sockets; monster cards are inserted into them.
// REFINE (Ragnarok): +1 to +10. Safe up to +4; from +5 it may fail
//   (the materials are lost but not the item — an isekai mercy).
// GRADE (tier 0–12): how strong the base is; stats grow with every grade. Crafted sets use grades 3–12.
// DROPS: monsters no longer drop equipment. They drop crafting materials, and gear is crafted at a
//   safe zone (js/items/craftsets.js, js/items/crafting.js).
//
// An item in the bag or worn is an "instance": { id, qty, plus, rarity, affixes: [{k, v}], sockets, cards: [] }
// Equipment ids are "base@grade" (e.g. "lance@3"); uniques are "u:key".

export const MAX_PLUS = 15;
const SAFE_PLUS = 4;
export const SLOTS = ["weapon", "offhand", "head", "armor", "garment", "gloves", "boots", "amulet", "ring1", "ring2"];
export const RARITY = {
  normal: { color: "#e2e8f0", en: "Normal", fil: "Karaniwan" },
  magic: { color: "#60a5fa", en: "Magic", fil: "Mahiwaga" },
  rare: { color: "#facc15", en: "Rare", fil: "Bihira" },
  unique: { color: "#f59e0b", en: "Unique", fil: "Natatangi" },
  epic: { color: "#c084fc", en: "Epic", fil: "Epiko" },
  legendary: { color: "#fb923c", en: "Legendary", fil: "Maalamat" },
  mythical: { color: "#f472b6", en: "Mythical", fil: "Mitikal" },
  set: { color: "#22c55e", en: "Set", fil: "Set" }
};

// ---------- MINERAL SETS (forged by Brakka in Emberhold from mined minerals) ----------
// Every piece is a class-appropriate base item at a high grade plus a per-piece bonus; wearing several
// pieces of the same set adds the bonuses at 2, 4 and 5 pieces (5 = the set's named passive).
// The crafted sets (Lv 10–100, js/items/craftsets.js) are merged in below; they count 2 / 4 / 6 pieces.
export const SETS = {
  meridian: { grade: 1, color: "#4dd7bb", name: { en: "Meridian Covenant", fil: "Kasunduan ng Meridian" },
    piece: { def: 2, hp: 10 }, bonus: { 2: { hp: 30 }, 3: { atk: 6 }, 4: { def: 6, cdr: 4 } } },
  ember: {
    mineral: true, grade: 5, color: "#f97316", name: { en: "Emberforged", fil: "Emberforged" },
    piece: { def: 3, hp: 12 },
    bonus: { 2: { def: 12 }, 4: { hp: 120, atk: 10 }, 5: { crit: 8, aspd: 8 } },
    passive: { en: "Forge Heart", fil: "Puso ng Pandayan" }
  },
  mythril: {
    mineral: true, grade: 6, color: "#93c5fd", name: { en: "Aethersilver Vanguard", fil: "Aethersilver Vanguard" },
    piece: { def: 4, cdr: 1 },
    bonus: { 2: { cdr: 6 }, 4: { def: 20, hp: 150 }, 5: { atk: 25, spd: 0.1 } },
    passive: { en: "Unbroken Line", fil: "Hindi Nasisirang Hanay" }
  },
  star: {
    mineral: true, grade: 7, color: "#fde68a", name: { en: "Starforged", fil: "Starforged" },
    piece: { atk: 4, crit: 1 },
    bonus: { 2: { crit: 6, luk: 6 }, 4: { atk: 30, aspd: 10 }, 5: { str: 8, agi: 8, vit: 8, int: 8, dex: 8, luk: 8, cdr: 10 } },
    passive: { en: "Sovereign Star", fil: "Soberanong Bituin" }
  }
};
Object.assign(SETS, CRAFT_SETS);
export const SET_THRESHOLDS = [2, 4, 5];   // mineral sets; use setThresholds(set) for any set
export const setThresholds = (set) => Object.keys((set && set.bonus) || {}).map(Number).sort((a, b) => a - b);
export const GRADE_NAMES = ["Aethelgard", "Iron", "Sylvan", "Tidal", "Frostforged", "Hellforged", "Imperial", "Sovereign",
  "Runic", "Abyssal", "Demonforged", "Celestial", "Divine"];
const MAX_GRADE = GRADE_NAMES.length - 1;

const lang = () => (getLang() === "fil" ? "fil" : "en");
const N = (en, fil = en) => ({ en, fil });

// ---------- EQUIPMENT BASES ----------
// icon = pixel icon kind (js/items/icons.js). look = Avatar part (weapon/offhand only).
// stats at grade 0; they grow ×(1 + grade × 0.6). sockets = the most sockets it can have.
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
  // ---- Head (Ragnarok headgear) ----
  bandana:    { slot: "head", icon: "bandana", stats: { def: 1, agi: 1 }, sockets: 1, name: N("Bandana", "Bandana") },
  helm:       { slot: "head", cls: ["knight", "fighter", "archer", "novice"], icon: "helm", stats: { def: 4, hp: 10 }, sockets: 1, name: N("Helm", "Helmet") },
  wizhat:     { slot: "head", cls: ["mage", "priest"], icon: "hat", stats: { def: 1, int: 2 }, sockets: 1, name: N("Wizard Hat", "Sombrero ng Salamangkero") },
  circlet:    { slot: "head", icon: "circlet", stats: { crit: 2, cdr: 2 }, sockets: 1, name: N("Astral Circlet", "Astral na Korona") },
  bunny:      { slot: "head", icon: "bunny", stats: { luk: 3, def: 1 }, sockets: 1, name: N("Rabbit-Ear Band", "Banda ng Tainga ng Kuneho") },
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

// ---------- UNIQUES (isekai legends) ----------
const UNIQUES = {
  craneline:  { base: "lance", name: N("Crane-Line Breaker", "Pambasag ng Crane-Line"), stats: { atk: 20, str: 5, def: 4 } },
  verdict:    { base: "broadsword", name: N("Astraea's Verdict", "Hatol ni Astraea"), stats: { atk: 14, luk: 5, crit: 5 } },
  recurve:    { base: "longbow", name: N("Olympic Recurve", "Olympic Recurve"), stats: { atk: 12, dex: 7, crit: 8 } },
  scalpel:    { base: "mace", name: N("Scalpel of Triage", "Scalpel ng Triage"), stats: { int: 6, cdr: 10, hp: 20 } },
  atacama:    { base: "greatstaff", name: N("Atacama Array Rod", "Tungkod ng Atacama Array"), stats: { atk: 14, int: 8 } },
  streetking: { base: "knuckle", name: N("Street King's Wraps", "Balot ng Hari ng Lansangan"), stats: { atk: 10, str: 6, crit: 6 } },
  headlight:  { base: "circlet", name: N("Night-Shift Headlamp", "Headlamp ng Night Shift"), stats: { luk: 10, spd: 0.1 } },
  necktie:    { base: "clip", name: N("Salaryman's Last Necktie", "Huling Kurbata ng Salaryman"), stats: { vit: 6, hp: 40 } },
  eclipse:    { base: "ring", name: N("Eclipse Band", "Singsing ng Eklipse"), stats: { str: 2, agi: 2, vit: 2, int: 2, dex: 2, luk: 2 } },
  pentagram:  { base: "manteau", name: N("Pentagram Seal Manteau", "Manteau ng Pentagram Seal"), stats: { def: 6, agi: 5 } },
  promise:    { base: "rosary", name: N("Summoner's Promise", "Pangako ng Tagapagtawag"), stats: { hp: 30, cdr: 5, luk: 4 } }
};

// ---------- AFFIX (Diablo II) ----------
// Magic and rare pieces from older saves keep their affixes (with their names) on the instance;
// new gear is crafted, so no affixes are rolled any more.

// ---------- CONSUMABLES, MATERIALS, QUEST ITEMS ----------
const OTHER = {
  guildPlate: { type: "quest", icon: "card", tint: "#4dd7bb", price: 0, name: N("Meridian Guild Plate", "Plaka ng Meridian Guild"),
    desc: N("Proof of guild membership. A lost plate costs double its last issue price to replace at the Guild Representative.", "Patunay ng pagiging miyembro. Doble ng huling presyo ang kapalit na plaka sa Kinatawan ng Guild.") },
  // Minerals: mined in the Ashfall Wastelands (emberite, obsidian) and the Siege (mythril, starsteel)
  emberite:    { type: "material", icon: "ore", tint: "#f97316", price: 30, name: N("Emberite", "Emberite"), desc: N("Ore still warm from the Hellforge. Forges Emberforged gear and tempers weapons.", "Mineral na mainit pa mula sa Hellforge. Pang-forge ng Emberforged at pampatibay ng sandata.") },
  obsidianOre: { type: "material", icon: "crystal", tint: "#818cf8", price: 40, name: N("Obsidian Ore", "Obsidian Ore"), desc: N("Glassy volcanic ore. Used in set forging and to temper armor.", "Makinang na bulkanikong mineral. Pang-forge ng set at pampatibay ng baluti.") },
  mythril:     { type: "material", icon: "ore", tint: "#93c5fd", price: 80, name: N("Aethersilver", "Aethersilver"), desc: N("Light, unbreakable silver from the Obsidian Citadel's buried veins. Forges Aethersilver Vanguard and tempers accessories.", "Magaan at matibay na pilak mula sa ilalim ng Obsidian Citadel. Pang-forge ng Aethersilver Vanguard at pampatibay ng aksesorya.") },
  starsteel:   { type: "material", icon: "crystal", tint: "#fde68a", price: 200, name: N("Starsteel", "Starsteel"), desc: N("A rare fallen-star alloy. Needed for Starforged gear.", "Bihirang haluang metal mula sa bumagsak na bituin. Kailangan sa Starforged.") },
  dwarvenPickaxe: { type: "quest", icon: "ore", tint: "#a8a29e", name: N("Dwarven Pickaxe", "Piko ng Dwarf"), desc: N("Thane Durgrim's gift. Lets you mine ore veins in the Ashfall Wastelands and the Siege.", "Regalo ni Thane Durgrim. Nagbibigay-daan sa pagmimina sa Ashfall Wastelands at sa Siege.") },
  // healPct: potions keep up with the hero — they restore the HP or that share of max HP, whichever is more
  refineSafetyStone: { type: "material", icon: "crystal", tint: "#ffdc80", price: 0, name: N("Refine Safety Stone", "Bato ng Ligtas na Refine"), desc: N("Premium stone: guarantees one refinement through +15. Materials and gold are still required.", "Premium na bato: garantisadong isang refine hanggang +15. Kailangan pa rin ng materyales at ginto.") },
  soulstone: { type: "consume", icon: "crystal", tint: "#a78bfa", price: 8000, effect: { autoAttackMs: 10 * 60 * 1000 }, name: N("Soulstone", "Bato ng Kaluluwa"), desc: N("Adds 10 real-world minutes of autonomous quest movement, combat and NPC conversations. Sold at the Premium Shop for ₱1; exchange pesos and platinum there (₱1 = 100 platinum).", "Nagdaragdag ng 10 minuto ng totoong oras para sa kusang paglakad, laban at pakikipag-usap sa quest. Mabibili sa Premium Shop sa halagang ₱1; doon din ang palitan ng piso at platino (₱1 = 100 platino).") },
  salve:    { type: "consume", icon: "potion", tint: "#ef4444", price: 10, effect: { heal: 40, healPct: 0.06 }, name: N("Red Potion", "Pulang Potion"), desc: N("Restores 40 HP or 6% of max HP, whichever is more.", "Nagbabalik ng 40 HP o 6% ng max HP, alinman ang mas marami.") },
  elixir:   { type: "consume", icon: "potion", tint: "#f8fafc", price: 30, effect: { heal: 150, healPct: 0.2 }, name: N("White Potion", "Puting Potion"), desc: N("Restores 150 HP or 20% of max HP, whichever is more.", "Nagbabalik ng 150 HP o 20% ng max HP, alinman ang mas marami.") },
  tonic:    { type: "consume", icon: "potion", tint: "#facc15", price: 12, effect: { stamina: 100, fresh: 600 }, name: N("Stamina Tonic", "Tonic ng Lakas"), desc: N("Refills stamina; no fatigue for 10s.", "Puno ang stamina; walang pagod sa 10s.") },
  panacea:  { type: "consume", icon: "potion", tint: "#4ade80", price: 15, effect: { cure: true }, name: N("Edgar's Panacea", "Panacea ni Edgar"), desc: N("Purges all seven miasmic blights.", "Inaalis ang pitong sumpa ng miasma.") },
  // Rare respec item: drops very seldom, sometimes sold by Pip in Emberhold at a steep price
  mushroom: { type: "consume", icon: "herb", tint: "#c026d3", price: 1200, effect: { respec: true }, name: N("Oblivion Mushroom", "Kabuti ng Paglimot"), desc: N("Forget every stat and skill: all points are refunded to spend again. Cannot be undone.", "Kalimutan ang lahat ng stat at skill: ibinabalik ang lahat ng puntos para gastusin muli. Hindi na maibabalik.") },
  herb:     { type: "consume", icon: "herb", price: 25, effect: { heal: 30, resetSkill: true }, name: N("Astraea's Leaf", "Dahon ni Astraea"), desc: N("+30 HP and resets your skill cooldown (not during boss fights).", "+30 HP at nire-reset ang cooldown ng skill (hindi sa laban sa boss).") },
  shardPower: { type: "consume", icon: "shard", tint: "#ef4444", price: 8, effect: { buff: "damage", time: 420 }, name: N("Power Shard", "Shard ng Lakas"), desc: N("+50% damage for 7s.", "+50% pinsala sa 7s.") },
  shardRapid: { type: "consume", icon: "shard", tint: "#facc15", price: 8, effect: { buff: "atkSpeed", time: 420 }, name: N("Rapid Shard", "Shard ng Bilis ng Atake"), desc: N("Double attack speed for 7s.", "Dobleng bilis ng atake sa 7s.") },
  shardSwift: { type: "consume", icon: "shard", tint: "#38bdf8", price: 8, effect: { buff: "moveSpeed", time: 420 }, name: N("Swift Shard", "Shard ng Takbo"), desc: N("+50% move speed for 7s.", "+50% bilis ng lakad sa 7s.") },
  shardGhost: { type: "consume", icon: "shard", tint: "#a855f7", price: 8, effect: { buff: "invis", time: 360 }, name: N("Ghost Shard", "Shard ng Multo"), desc: N("Near-invisible for 6s.", "Halos di-makita sa 6s.") },
  monsterShard: { type: "material", icon: "ore", tint: "#94a3b8", price: 4, name: N("Monster Shard", "Monster Shard"), desc: N("Refine material (+1 to +5).", "Pang-refine (+1 hanggang +5).") },
  voidCrystal:  { type: "material", icon: "crystal", tint: "#a855f7", price: 20, name: N("Void Crystal", "Kristal ng Void"), desc: N("Purified miasma ore. Needed from +6 to +10.", "Nilinis na mineral ng miasma. Kailangan mula +6 hanggang +10.") },
  heartstone:   { type: "quest", icon: "heart", tint: "#ef4444", name: N("Blighted Heartstone", "Bulok na Heartstone"), desc: N("Malakor's shattered heart. Bring it to your summoner.", "Ang basag na puso ni Malakor. Dalhin sa tagapagtawag.") },
  abyssHelm:    { type: "quest", icon: "shell", tint: "#38bdf8", name: N("Abyssal Helm Shard", "Piraso ng Abyssal Helm"), desc: N("Broken from the Leviathan Regent's crown.", "Nabasag mula sa korona ng Leviathan Regent.") },
  cryoCore:     { type: "quest", icon: "crystal", tint: "#bfe9ff", name: N("Cryonix Core", "Core ni Cryonix"), desc: N("The fractured heart of the Frost Empress.", "Ang basag na puso ng Frost Empress.") },
  // Seal Stones: one from each boss of Acts VII–X; all four awaken the Celestial Monolith in the Cerulean Abyss
  sylvanSeal:   { type: "quest", icon: "crystal", tint: "#c77dff", name: N("Sylvan Seal Stone", "Sylvan Seal Stone"), desc: N("One of four Seal Stones. Place all four on the Celestial Monolith in the Cerulean Abyss.", "Isa sa apat na Seal Stone. Ilagay ang lahat ng apat sa Celestial Monolith sa Cerulean Abyss.") },
  tideSeal:     { type: "quest", icon: "crystal", tint: "#38bdf8", name: N("Tide Seal Stone", "Tide Seal Stone"), desc: N("One of four Seal Stones. Place all four on the Celestial Monolith in the Cerulean Abyss.", "Isa sa apat na Seal Stone. Ilagay ang lahat ng apat sa Celestial Monolith sa Cerulean Abyss.") },
  frostSeal:    { type: "quest", icon: "crystal", tint: "#e0f2fe", name: N("Frost Seal Stone", "Frost Seal Stone"), desc: N("One of four Seal Stones. Place all four on the Celestial Monolith in the Cerulean Abyss.", "Isa sa apat na Seal Stone. Ilagay ang lahat ng apat sa Celestial Monolith sa Cerulean Abyss.") },
  emberSeal:    { type: "quest", icon: "crystal", tint: "#ff7a1a", name: N("Ember Seal Stone", "Ember Seal Stone"), desc: N("One of four Seal Stones. Place all four on the Celestial Monolith in the Cerulean Abyss.", "Isa sa apat na Seal Stone. Ilagay ang lahat ng apat sa Celestial Monolith sa Cerulean Abyss.") },
  forgeCore:    { type: "quest", icon: "heart", tint: "#ff7a1a", name: N("Hellforge Reactor Core", "Reactor Core ng Hellforge"), desc: N("Torn from Ignis the Iron Lord.", "Hinugot mula kay Ignis the Iron Lord.") },
  imperialCrest:{ type: "quest", icon: "crest", tint: "#ffd166", name: N("Imperial Crest", "Imperial Crest"), desc: N("The King's last gift, for the new Sovereign.", "Huling handog ng Hari para sa bagong Sovereign.") },
  tearUrn:      { type: "quest", icon: "urn", tint: "#334155", name: N("Urn of Black Tears", "Urna ng Itim na Luha"), desc: N("Dolora's urn, heavy with the grief of the dead. It hums like a voice far away.", "Ang urna ni Dolora, mabigat sa dalamhati ng mga patay. Umuugong ito na parang tinig mula sa malayo.") },
  lanternVisor: { type: "quest", icon: "helm", tint: "#ffd166", name: N("Lantern Knight's Visor", "Visor ng Lantern Knight"), desc: N("Morgrave's trophy. The Knight's last words are still bound in the steel.", "Tropeo ni Morgrave. Nakatali pa sa bakal ang huling salita ng Knight.") },
  wardensKey:   { type: "quest", icon: "key", tint: "#f43f5e", name: N("Warden's Key", "Susi ng Bantay"), desc: N("Vorgath's key to the last gate of the Maw. Every chain on the spire answers to it.", "Ang susi ni Vorgath sa huling tarangkahan ng Maw. Sumusunod dito ang bawat kadena sa tore.") },
  // Regression (js/regression.js): granted once a difficulty is cleared; never used up, never sold
  jobScroll:    { type: "quest", icon: "book", tint: "#c084fc", effect: { jobScroll: true }, name: N("Scroll of Callings", "Balumbon ng mga Tungkulin"), desc: N("A memory from a world that folded back. After the Job Awakening, use it to change your calling at any time; each difficulty you clear lets you learn one more job.", "Alaala mula sa mundong tumiklop pabalik. Pagkatapos ng Job Awakening, gamitin ito upang palitan ang iyong tungkulin kahit kailan; bawat hirap na natapos ay nagbibigay ng isa pang trabaho.") },
  astralAsh:    { type: "quest", icon: "ash", tint: "#fde68a", name: N("Astral Ash of Satan", "Astral na Abo ni Satan"), desc: N("All that remains of the Demon Lord.", "Ang natira sa Demon Lord.") }
};
// Crafting materials (ores, cores, essences) and cooking (fish, ingredients, the 15 dishes)
Object.assign(OTHER, CRAFT_ITEMS, FOOD_ITEMS);

// ---------- CARDS (Ragnarok) — one per monster and boss ----------
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
  // Every other monster, by the first map it appears on. One stat from its element (fire ATK, water HP,
  // earth DEF, wind AGI, poison DEX, shadow CRIT, ghost LUK, undead/holy INT, neutral VIT), sized to the
  // map's level band; elite kinds add a second stat from their race.
  // Plains of Aethelgard
  goblinScout: { n: N("Goblin Raider", "Gobling Mananalakay"), stats: { def: 3 } },
  forestBear: { n: N("Plains Ursath", "Ursath ng Kapatagan"), stats: { def: 3 } },
  windFalcon: { n: N("Sky Storm Harrier", "Lawin ng Bagyo"), stats: { agi: 2 } },
  bloodBat: { n: N("Dusk Bat", "Paniki ng Takipsilim"), stats: { crit: 3 } },
  goblinWarchief: { n: N("Goblin Warchief", "Pinunong Goblin"), stats: { def: 3, dex: 2 } },   // elite
  ironpeltAlpha: { n: N("Ironpelt Alpha", "Alphang Bakal-Balahibo"), stats: { def: 3, str: 2 } },   // elite
  thunderRoc: { n: N("Thunderbeak Roc", "Roc ng Kulog"), stats: { agi: 2, str: 2 } },   // elite
  bramblecrownSlime: { n: N("Bramblecrown Slime", "Slime na Koronang-Tinik"), stats: { def: 3, vit: 2 } },   // elite
  // Greyhorn Badlands (rocky)
  skyGargoyle: { n: N("Granite Gargoyle", "Gargoyle na Bato"), stats: { agi: 2 } },
  rubbleCrawler: { n: N("Rubble Crawler", "Gumagapang na Guho"), stats: { def: 4 } },
  badlandBrigand: { n: N("Badland Brigand", "Tulisan ng Kabatuhan"), stats: { vit: 2 } },
  dustJackal: { n: N("Dust Jackal", "Asong-Ligaw ng Alikabok"), stats: { def: 4 } },
  quarryColossus: { n: N("Quarry Colossus", "Higante ng Tibagan"), stats: { def: 4, vit: 2 } },   // elite
  brigandWarlord: { n: N("Brigand Warlord", "Panginoon ng mga Tulisan"), stats: { vit: 2, dex: 2 } },   // elite
  boneMarshal: { n: N("Bone Marshal", "Kalansay na Mariskal"), stats: { int: 2, hp: 25 } },   // elite
  cliffWyvern: { n: N("Cliffcrest Wyvern", "Wyvern ng Bangin"), stats: { agi: 2, str: 2 } },   // elite
  // Whispering Canopy (canopy)
  mossTreant: { n: N("Briar Ancient", "Sinaunang Tinik"), stats: { def: 5 } },
  blightHarpy: { n: N("Blight Harpy", "Harpy ng Salot"), stats: { agi: 3 } },
  sporeHornet: { n: N("Miasma Hornet", "Pukyutan ng Miasma"), stats: { dex: 3 } },
  rotheartDryad: { n: N("Rotheart Dryad", "Dryad na Bulok ang Puso"), stats: { dex: 3, vit: 3 } },   // elite
  beastmanChieftain: { n: N("Beastman Chieftain", "Pinuno ng mga Beastman"), stats: { def: 5, dex: 3 } },   // elite
  thornbackBehemoth: { n: N("Thornback Behemoth", "Behemoth na Tinik ang Likod"), stats: { def: 5, vit: 3 } },   // elite
  miasmaHiveQueen: { n: N("Miasma Hive Queen", "Reyna ng Pugad ng Miasma"), stats: { dex: 3, agi: 3 } },   // elite
  // Gloomwater Fens (swamp)
  bogSerpent: { n: N("Venom Mire Serpent", "Serpent ng Lusak"), stats: { dex: 3 } },
  swampCrab: { n: N("Bog Shell Crab", "Alimango ng Putikan"), stats: { dex: 3 } },
  mireGhoul: { n: N("Mire Ghoul", "Ghoul ng Lusak"), stats: { dex: 3 } },
  peatHulk: { n: N("Peat Hulk", "Halimaw na Pit"), stats: { def: 6 } },
  fenMoth: { n: N("Gloom Moth", "Gamugamo ng Dilim"), stats: { agi: 3 } },
  gloomwaterHag: { n: N("Gloomwater Hag", "Mangkukulam ng Gloomwater"), stats: { crit: 5, dex: 3 } },   // elite
  mireHydra: { n: N("Mire Hydra", "Hydra ng Lusak"), stats: { dex: 3, str: 3 } },   // elite
  bogTitan: { n: N("Bog Titan", "Titan ng Putikan"), stats: { hp: 35, vit: 3 } },   // elite
  plagueMothMatriarch: { n: N("Plague Moth Matriarch", "Inang Gamugamo ng Salot"), stats: { dex: 3, agi: 3 } },   // elite
  // Cerulean Abyss (coast)
  coralGolem: { n: N("Coral Golem", "Golem na Bahura"), stats: { hp: 40 } },
  stormPetrel: { n: N("Thunder Skimmer", "Wyvern ng Bagyo"), stats: { agi: 3 } },
  drownedSpecter: { n: N("Abyssal Banshee", "Banshee ng Kailaliman"), stats: { hp: 40, int: 3 } },   // elite
  siren: { n: N("Tidecaller Siren", "Sirena ng Taob"), stats: { hp: 40, agi: 3 } },   // elite
  drownedCaptain: { n: N("Drowned Captain", "Nalunod na Kapitan"), stats: { hp: 40, int: 3 } },   // elite
  abyssalKraken: { n: N("Abyssal Kraken", "Kraken ng Kailaliman"), stats: { hp: 40, agi: 3 } },   // elite
  // Maw of Damnation (maw)
  deepKraken: { n: N("Kraken Hatchling", "Munting Kraken"), stats: { hp: 65 } },
  voidSerpent: { n: N("Void Serpent", "Serpent ng Void"), stats: { hp: 65 } },
  voidHusk: { n: N("Void Husk", "Hungkag ng Void"), stats: { crit: 7 } },
  fallenSeraph: { n: N("Fallen Seraph", "Nahulog na Seraph"), stats: { int: 6, str: 6 } },   // elite
  abyssBehemoth: { n: N("Abyss Behemoth", "Behemoth ng Kalaliman"), stats: { crit: 7, str: 6 } },   // elite
  abyssWyrm: { n: N("Abyssal Wyrm", "Wyrm ng Kalaliman"), stats: { crit: 7, str: 6 } },   // elite
  wraithLord: { n: N("Wraith Lord", "Panginoon ng mga Wraith"), stats: { luk: 6, int: 6 } },   // elite
  // Frostfang Precipice (frost)
  frostStalker: { n: N("Glacier Wolf", "Lobo ng Glosyer"), stats: { hp: 45 } },
  frostGargoyle: { n: N("Permafrost Gargoyle", "Gargoyle ng Yelo"), stats: { hp: 45, vit: 4 } },   // elite
  frostSerpent: { n: N("Glacial Serpent", "Serpent ng Glosyer"), stats: { hp: 45, agi: 4 } },   // elite
  frozenCrab: { n: N("Icebound Scuttler", "Alimangong Yelo"), stats: { hp: 45 } },
  rimeJotun: { n: N("Rime Jotun", "Jotun ng Hamog-Yelo"), stats: { hp: 45, str: 4 } },   // elite
  glacierWitch: { n: N("Glacier Witch", "Bruha ng Glosyer"), stats: { hp: 45, dex: 4 } },   // elite
  // Stormcrown Highlands (mountain)
  blizzardHawk: { n: N("Ice Griffin", "Griffin ng Niyebe"), stats: { agi: 4 } },
  highlandLynx: { n: N("Highland Lynx", "Lynx ng Kabundukan"), stats: { def: 8 } },
  graniteTroll: { n: N("Granite Troll", "Trolong Granite"), stats: { def: 8 } },
  galeHarpy: { n: N("Gale Harpy", "Harpy ng Unos"), stats: { agi: 4 } },
  highlandRaider: { n: N("Highland Raider", "Mananalakay ng Kabundukan"), stats: { vit: 4 } },
  stormcrownGriffin: { n: N("Stormcrown Griffin", "Griffin ng Stormcrown"), stats: { agi: 4, str: 4 } },   // elite
  avalancheGolem: { n: N("Avalanche Golem", "Golem ng Guho-Niyebe"), stats: { hp: 50, vit: 4 } },   // elite
  peakShaman: { n: N("Peak Shaman", "Shaman ng Tuktok"), stats: { agi: 4, dex: 4 } },   // elite
  elderTroll: { n: N("Elder Troll", "Matandang Trolo"), stats: { def: 8, str: 4 } },   // elite
  // Ashfall Wastelands (ash)
  hellHound: { n: N("Hellforge Hound", "Aso ng Hellforge"), stats: { atk: 12 } },
  fireGargoyle: { n: N("Brimstone Gargoyle", "Gargoyle ng Asupre"), stats: { atk: 12, str: 5 } },   // elite
  lavaSerpent: { n: N("Magma Serpent", "Serpent ng Magma"), stats: { atk: 12, str: 5 } },   // elite
  lavaCrab: { n: N("Cinder Crab", "Alimangong Baga"), stats: { atk: 12 } },
  hellforgeOverseer: { n: N("Hellforge Overseer", "Tagabantay ng Hellforge"), stats: { atk: 12, str: 5 } },   // elite
  cinderBehemoth: { n: N("Cinder Behemoth", "Behemoth ng Baga"), stats: { atk: 12, str: 5 } },   // elite
  // Siege of the Obsidian Citadel (siege)
  abyssalJuggernaut: { n: N("Siege Dreadnought", "Kuta ng Pagkawasak"), stats: { crit: 6, str: 5 } },   // elite
  chaosGargoyle: { n: N("Chaos Gargoyle", "Gargoyle ng Kaguluhan"), stats: { crit: 6 } },
  corruptedCrab: { n: N("Corrupted Moat Crab", "Bulok na Alimango"), stats: { hp: 60 } },
  hellfireWarlock: { n: N("Hellfire Warlock", "Warlock ng Apoy-Impiyerno"), stats: { atk: 14, str: 5 } },   // elite
  obsidianSentinel: { n: N("Obsidian Sentinel", "Bantay na Obsidian"), stats: { crit: 6, str: 5 } },   // elite
  infernalWyvern: { n: N("Infernal Wyvern", "Wyvern ng Impiyerno"), stats: { atk: 14, str: 5 } },   // elite
  // Sunscorch Dunes (desert)
  duneScarab: { n: N("Dune Scarab", "Salagubang ng Buhangin"), stats: { def: 9 } },
  duneHyena: { n: N("Dune Hyena", "Hyena ng Buhangin"), stats: { def: 9 } },
  sunDriedRevenant: { n: N("Sun-Dried Revenant", "Tuyong Revenant"), stats: { int: 5 } },
  sandWyrm: { n: N("Sand Wyrm", "Wyrm ng Buhangin"), stats: { def: 9 } },
  carrionVulture: { n: N("Carrion Vulture", "Buwitre ng Bangkay"), stats: { agi: 5 } },
  scarabMonarch: { n: N("Scarab Monarch", "Haring Salagubang"), stats: { def: 9, agi: 5 } },   // elite
  tombKing: { n: N("Sunken Tomb King", "Hari ng Lubog na Libingan"), stats: { int: 5, hp: 55 } },   // elite
  sandstormWraith: { n: N("Sandstorm Wraith", "Wraith ng Bagyong Buhangin"), stats: { agi: 5, int: 5 } },   // elite
  duneColossus: { n: N("Dune Colossus", "Higante ng Buhangin"), stats: { def: 9, vit: 5 } },   // elite
  // Lamenting Strand (strand)
  tearSlime: { n: N("Black Tear Slime", "Slime ng Itim na Luha"), stats: { hp: 50 } },
  sorrowWisp: { n: N("Sorrow Wisp", "Kaluluwang Nagdadalamhati"), stats: { int: 4 } },
  strandCrab: { n: N("Black-Sand Pincher", "Alimango ng Itim na Buhangin"), stats: { def: 7 } },
  mourningEel: { n: N("Mourning Eel", "Igat ng Pagluluksa"), stats: { agi: 4 } },
  keeningBanshee: { n: N("Keening Banshee", "Banshee na Umaatungal"), stats: { int: 5, cdr: 4 } },   // elite
  hollowPaladin: { n: N("Hollow Paladin of the Dawnstar", "Hungkag na Paladin ng Dawnstar"), stats: { def: 7, vit: 4 } },   // elite
  brinewingDrake: { n: N("Brinewing Drake", "Drake ng Maalat na Pakpak"), stats: { agi: 5, dex: 4 } },   // elite
  weepingColossus: { n: N("Weeping Colossus", "Higanteng Lumuluha"), stats: { hp: 50, vit: 4 } },   // elite
  // Ossuary Fields (ossuary)
  barrowHound: { n: N("Barrow Hound", "Asong-Libingan"), stats: { atk: 12 } },
  cryptGhoul: { n: N("Mass-Grave Ghoul", "Ghoul ng Libingang Pangmaramihan"), stats: { hp: 55 } },
  graveCrow: { n: N("Grave Crow", "Uwak ng Libingan"), stats: { dex: 5 } },
  ossuaryCrawler: { n: N("Ossuary Crawler", "Gumagapang na Buto"), stats: { def: 8 } },
  bannerWraith: { n: N("Banner Wraith", "Wraith ng Bandila"), stats: { luk: 5, int: 5 } },   // elite
  boneColossus: { n: N("Bone Colossus", "Higanteng Buto"), stats: { def: 8, vit: 5 } },   // elite
  lichAdjutant: { n: N("Lich Adjutant", "Lich na Ayudante"), stats: { int: 5, cdr: 5 } },   // elite
  boneDrake: { n: N("Bone Drake", "Drake na Buto"), stats: { str: 5, agi: 5 } },   // elite
  // Chainspire Descent (chainspire)
  shackledSoul: { n: N("Shackled Soul", "Kaluluwang Nakagapos"), stats: { hp: 60 } },
  chainImp: { n: N("Chain Imp", "Imp ng Kadena"), stats: { aspd: 6 } },
  hookCrawler: { n: N("Hook Crawler", "Gumagapang na Kawit"), stats: { crit: 6 } },
  miseryLeech: { n: N("Misery Leech", "Lintang Pighati"), stats: { vit: 6 } },
  tormentGolem: { n: N("Torment Golem", "Golem ng Pahirap"), stats: { def: 9, vit: 6 } },   // elite
  hollowExecutioner: { n: N("Hollow Executioner", "Hungkag na Berdugo"), stats: { str: 6, crit: 6 } },   // elite
  shackleDrake: { n: N("Shackle Drake", "Drake na Nakagapos"), stats: { agi: 6, dex: 6 } },   // elite
  chainWraith: { n: N("Chain Wraith", "Wraith ng Kadena"), stats: { int: 6, luk: 6 } },   // elite
  malakor: { n: N("Malakor", "Malakor"), stats: { vit: 6, hp: 60 }, boss: true },
  leviathan: { n: N("Leviathan Regent", "Leviathan Regent"), stats: { int: 6, cdr: 6 }, boss: true },
  cryonix: { n: N("Cryonix", "Cryonix"), stats: { agi: 6, aspd: 8 }, boss: true },
  ignis: { n: N("Ignis", "Ignis"), stats: { str: 7, atk: 15 }, boss: true },
  commander: { n: N("Demon Commander", "Heneral ng mga Demonyo"), stats: { crit: 10, dex: 5 }, boss: true },
  wreckGhoul: { n: N("Wreck Ghoul", "Ghoul ng Wasak na Barko"), stats: { hp: 60 } },
  boneLegionnaire: { n: N("Bone Legionnaire", "Kalansay na Lehiyonaryo"), stats: { def: 9 } },
  ironGaoler: { n: N("Iron Gaoler", "Bakal na Bantay-Bilangguan"), stats: { atk: 16 } },
  dolora: { n: N("Dolora", "Dolora"), stats: { int: 7, cdr: 8 }, boss: true },
  morgrave: { n: N("Morgrave", "Morgrave"), stats: { str: 7, def: 12 }, boss: true },
  vorgath: { n: N("Vorgath", "Vorgath"), stats: { vit: 8, hp: 90 }, boss: true },
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

// Skill boosts from crafted sets and meals (same keys as the skill-tree bonuses in js/skills.js)
const SKILL_LABEL = {
  en: { dmg: "Skill DMG +{v}%", kcd: "K cooldown −{v}%", lcd: "L cooldown −{v}%", heal: "Healing +{v}%", dmgReduce: "Damage taken −{v}%",
    aspd: "Attack speed +{v}%", crit: "Crit +{v}%", move: "Move speed +{v}%", regen: "Regen +{v} HP / 3s", cdr: "Cooldowns −{v}%" },
  fil: { dmg: "Pinsala ng skill +{v}%", kcd: "Cooldown ng K −{v}%", lcd: "Cooldown ng L −{v}%", heal: "Paggaling +{v}%", dmgReduce: "Natatanggap na pinsala −{v}%",
    aspd: "Bilis ng atake +{v}%", crit: "Crit +{v}%", move: "Bilis ng lakad +{v}%", regen: "Regen +{v} HP / 3s", cdr: "Cooldown −{v}%" }
};
export function skillText(k, v) {
  return (SKILL_LABEL[lang()][k] || `${k} +{v}`).replace("{v}", v);
}

// "lance@3" → { base: "lance", grade: 3 }
function parseId(id) {
  const [base, g] = String(id).split("@");
  return { base, grade: g === undefined ? 0 : Math.max(0, Math.min(MAX_GRADE, parseInt(g, 10) || 0)) };
}

const scaleStats = (stats, mult, spdMult) => {
  const out = {};
  Object.entries(stats).forEach(([k, v]) => { out[k] = k === "spd" ? +(v * spdMult).toFixed(2) : Math.round(v * mult); });
  return out;
};
const addStats = (a, b) => { Object.entries(b || {}).forEach(([k, v]) => { a[k] = +((a[k] || 0) + v).toFixed(2); }); return a; };

// ---------- DESCRIBE: full information from an instance ----------
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

  // Unique or regular equipment
  let unique = null;
  let base, grade;
  if (String(id).startsWith("u:")) {
    const [key, g] = id.slice(2).split("@");
    unique = UNIQUES[key];
    if (!unique) return null;
    base = unique.base;
    grade = g === undefined ? 0 : Math.max(0, Math.min(MAX_GRADE, parseInt(g, 10) || 0));
  } else ({ base, grade } = parseId(id));

  const e = EQUIP[base];
  if (e) {
    const guildRarity = ({ epic: 1.3, legendary: 1.6, mythical: 2 })[inst.rarity] || 1;
    const mult = (1 + grade * 0.6) * (1 + plus * 0.1) * guildRarity;
    const stats = scaleStats(e.stats, mult, (1 + grade * 0.25) * (1 + plus * 0.05));
    if (unique) addStats(stats, scaleStats(unique.stats, 1 + grade * 0.4, 1));
    const set = inst.set && SETS[inst.set];
    if (set) addStats(stats, set.piece);
    (inst.affixes || []).forEach((a) => addStats(stats, { [a.k]: a.v }));
    (inst.cards || []).forEach((cid) => { const c = CARDS[cid.slice(5)]; if (c) addStats(stats, c.stats); });

    const rarity = set ? "set" : unique ? "unique" : RARITY[inst.rarity] ? inst.rarity : "normal";
    let name = e.name[L];
    if (set) name = `${set.name[L]} ${e.name[L]}`;
    else if (["epic", "legendary", "mythical"].includes(rarity)) name = `${RARITY[rarity][L]} ${e.name[L]}`;
    else if (unique) name = unique.name[L];
    else if (rarity === "magic") {
      const pre = (inst.affixes || []).find((a) => a.pre);
      const suf = (inst.affixes || []).find((a) => !a.pre && a.name);   // tempering affixes have no name
      if (pre) name = `${pre.name[L]} ${name}`;
      if (suf) name = `${name} ${suf.name[L]}`;
    } else if (rarity === "rare" && inst.rareName) name = inst.rareName;

    const slots = inst.sockets || 0;
    return {
      id, base, grade, plus, type: "equip", slot: e.slot, hands: e.hands || 1, cls: e.cls || null,
      icon: e.icon, look: e.look || null, stats, rarity, color: RARITY[rarity].color,
      baseName: e.name[L], sockets: slots, cards: inst.cards || [], set: set ? inst.set : null, temper: inst.temper || 0,
      reqLevel: set && set.level ? set.level : 0,
      // value by grade and rarity (shops pay a share of it, js/items/economy.js; repairs cost a share too)
      price: Math.round(12 * (1 + grade) * (1 + plus * 0.3) * (rarity === "set" ? 8 : rarity === "unique" ? 6 : rarity === "rare" ? 3 : rarity === "magic" ? 1.6 : 1)),
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

// Everything the Codex lists: base equipment, uniques, mineral sets, other items and cards (grade 0 samples)
export function codexItems() {
  return {
    equip: Object.keys(EQUIP).map((id) => describe({ id })),
    uniques: Object.keys(UNIQUES).map((key) => describe({ id: `u:${key}` })),
    sets: Object.keys(SETS),
    other: Object.keys(OTHER).map((id) => describe({ id })),
    cards: Object.keys(CARDS).map((key) => describe({ id: `card:${key}` }))
  };
}

// For a plain id (shop, quest, names)
export function getItem(id, plus = 0) {
  return describe({ id, plus });
}

// Which slots an item can go in (a ring fits ring1 or ring2)
export function slotsFor(item) {
  return item.slot === "ring" ? ["ring1", "ring2"] : [item.slot];
}

// level: the hero's level (crafted sets need their tier's level); omitted = not checked
export function canEquip(item, cls, level = Infinity) {
  return Boolean(item && item.type === "equip" && (!item.cls || item.cls.includes(cls)) && level >= (item.reqLevel || 0));
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

// Success chance (Ragnarok): safe up to +4
export function refineChance(plus) {
  const next = plus + 1;
  if (next <= SAFE_PLUS) return 1;
  return [0.9, 0.78, 0.65, 0.5, 0.38, 0.28][next - 5] ?? 0.28;
}

// ---------- DROP ----------
const pick = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];

// ---------- LOOT BY MONSTER TIER ----------
// rolls = how many draws from the potion/material table · unique/card = chance of the monster's card
// Equipment is no longer dropped (it is crafted at a safe zone): the equipment roll became crafting
// materials (js/items/craftsets.js rollMaterials: ores, cores, path essences, cooking ingredients).
const LOOT_TIERS = {
  normal:   { rolls: 1, card: 0.008, crystals: 0, shards: 0 },
  champion: { rolls: 2, card: 0.03,  crystals: 0, shards: 1 },
  elite:    { rolls: 3, card: 0.08,  crystals: 1, shards: 2 },
  mvp:      { rolls: 4, card: 0.35,  crystals: 3, shards: 4 }
};

// Level difference: less from weak monsters (grey), more from strong ones (red)
const diffMult = (diff = 0) => (diff <= -3 ? 0.5 : diff < 0 ? 0.85 : diff >= 3 ? 1.2 : 1);

// One draw from the potion and material table
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

// Drop after a monster dies; returns a list of instances.
// info: { key (monster kind), tier ("normal" | "champion" | "elite" | "mvp"), boss, diff (monster level − hero level),
//         level (monster level), element, race, extra (night bonus draws) }
export function rollDrop(grade, cls, info = {}, rnd = Math.random) {
  const T = LOOT_TIERS[info.tier] || (info.boss ? LOOT_TIERS.mvp : LOOT_TIERS.normal);
  const dm = info.tier === "mvp" ? 1 : diffMult(info.diff);
  const out = [];
  for (let k = 0; k < T.rolls + (info.extra || 0); k++) {
    if (rnd() < dm) { const c = rollConsumable(grade, rnd); if (c) out.push(c); }
  }
  if (T.shards) out.push({ id: "monsterShard", qty: T.shards });
  if (T.crystals) out.push({ id: "voidCrystal", qty: T.crystals });
  out.push(...rollMaterials({ ...info, tier: info.tier || (info.boss ? "mvp" : "normal") }, dm, rnd));
  // Oblivion Mushroom: a very rare drop (tougher monsters drop it more often)
  const MUSHROOM = { normal: 0.003, champion: 0.008, elite: 0.02, mvp: 0.05 };
  if (rnd() < (MUSHROOM[info.tier] || (info.boss ? MUSHROOM.mvp : MUSHROOM.normal))) out.push({ id: "mushroom", qty: 1 });
  const cardKey = info.key && CARDS[info.key] ? info.key : null;
  if (cardKey && rnd() < T.card * dm) out.push({ id: `card:${cardKey}`, qty: 1 });
  return out;
}

// Each class's default set (given by the summoner at the Job Awakening; LORE Act IV)
export const CLASS_KIT = {
  novice: { weapon: "knife", offhand: "guard", extra: [] },
  knight: { weapon: "broadsword", offhand: "tower", extra: ["lance"] },
  mage: { weapon: "greatstaff", offhand: null, extra: ["rod", "grimoire"] },
  priest: { weapon: "scepter", offhand: null, extra: ["mace", "grimoire"] },
  archer: { weapon: "longbow", offhand: null, extra: ["crossbow", "traps"] },
  fighter: { weapon: "knuckle", offhand: "talisman", extra: ["claws"] }
};
