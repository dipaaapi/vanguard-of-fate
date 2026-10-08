import { getLang } from "./i18n.js";

// ==================== MONSTER TIERS: NORMAL · CHAMPION · ELITE · MVP ====================
// Inspired by Diablo II (champion and unique monsters) and Ragnarok Online (MVP).
//   CHAMPION (blue ★, 7%)  — 1 power · HP ×2 · damage ×1.2 · EXP ×2.5 · better loot
//   ELITE    (gold ✦, 2%) — its own name · 2 powers · 2 minions · HP ×3.5 · damage ×1.35 · EXP ×5
//   MVP      (each Act's boss) — see BOSSES in js/bestiary.js
//
// POWERS (modifiers) — with real effects in combat:
//   swift       moves and attacks faster
//   stoneskin   −40% damage taken
//   fire        fire attacks (burn) and explodes on death
//   cold        ice attacks (chill), slows the hero
//   lightning   lightning attacks (stun) and sparks when hit
//   cursed      curses the hero with every hit
//   vampiric    heals from the damage it deals
//   teleporter  suddenly appears beside the hero
//   berserk     +30% damage when its HP is low

const L = () => (getLang() === "fil" ? "fil" : "en");

export const MODS = {
  swift: { color: "#fde047", name: { en: "Swift", fil: "Maliksi" } },
  stoneskin: { color: "#a8a29e", name: { en: "Stoneskin", fil: "Balat-Bato" } },
  fire: { color: "#f97316", name: { en: "Fire Enchanted", fil: "Nag-aapoy" } },
  cold: { color: "#7dd3fc", name: { en: "Cold Enchanted", fil: "Nagyeyelo" } },
  lightning: { color: "#facc15", name: { en: "Lightning Enchanted", fil: "Kumukuryente" } },
  cursed: { color: "#a855f7", name: { en: "Cursed", fil: "Isinumpa" } },
  vampiric: { color: "#dc2626", name: { en: "Vampiric", fil: "Bampira" } },
  teleporter: { color: "#c4b5fd", name: { en: "Teleporter", fil: "Naglalaho" } },
  berserk: { color: "#ef4444", name: { en: "Berserk", fil: "Nagwawala" } }
};
const MOD_KEYS = Object.keys(MODS);
export const modName = (k) => (MODS[k] ? MODS[k].name[L()] : k);

export const TIERS = {
  champion: { chance: 0.07, hp: 2, dmg: 1.2, speed: 1.1, exp: 2.5, mods: 1, color: "#60a5fa", mark: "★", name: { en: "Champion", fil: "Kampeong" } },
  elite: { chance: 0.02, hp: 3.5, dmg: 1.35, speed: 1.05, exp: 5, mods: 2, color: "#f59e0b", mark: "✦", minions: 2, name: { en: "Elite", fil: "Elite" } }
};

// Elite name (like a Diablo II unique monster): "Grimtooth the Cruel"
const FIRST = ["Grim", "Vex", "Mor", "Skar", "Ul", "Dread", "Hollow", "Rot", "Blight", "Ash", "Frost", "Bane"];
const SECOND = ["tooth", "maw", "fang", "claw", "gore", "shade", "skull", "hide", "spine", "howl"];
const TITLE = {
  en: ["the Vile", "the Unbroken", "the Hungry", "the Cruel", "the Eclipsed", "the Wretched", "the Relentless"],
  fil: ["ang Malupit", "ang Di-Mabali", "ang Gutom", "ang Walang-Awa", "ang Nilamon ng Dilim", "ang Kaawa-awa", "ang Di-Tumitigil"]
};

// Decide the tier at spawn. Returns the tier ("normal" | "champion" | "elite")
export function rollTier(rnd = Math.random) {
  const r = rnd();
  if (r < TIERS.elite.chance) return "elite";
  if (r < TIERS.elite.chance + TIERS.champion.chance) return "champion";
  return "normal";
}

// Apply the tier to a new monster
export function applyTier(e, tier, rnd = Math.random) {
  e.tier = tier;
  if (tier === "normal") return;
  const t = TIERS[tier];
  e.champion = tier === "champion";
  e.elite = tier === "elite";
  e.maxHp = e.hp = Math.round(e.maxHp * t.hp);
  e.damage = Math.round(e.damage * t.dmg);
  e.speed *= t.speed;
  const mods = [];
  while (mods.length < t.mods) {
    const m = MOD_KEYS[Math.floor(rnd() * MOD_KEYS.length)];
    if (!mods.includes(m)) mods.push(m);
  }
  e.mods = mods;
  if (mods.includes("swift")) e.speed *= 1.25;
  if (tier === "elite") {
    const i = Math.floor(rnd() * TITLE.en.length);
    e.eliteName = { base: FIRST[Math.floor(rnd() * FIRST.length)] + SECOND[Math.floor(rnd() * SECOND.length)], title: i };
  }
}

export function tierName(e) {
  if (e.elite && e.eliteName) return `${e.eliteName.base} ${TITLE[L()][e.eliteName.title]}`;
  if (e.champion) return TIERS.champion.name[L()];
  return "";
}

export const has = (e, m) => Boolean(e.mods && e.mods.includes(m));

// ==================== LIVES: STACKED HP BARS ====================
// A monster's HP is split into lives (stacked bars): break one and the next bar fills in behind it.
// The count grows with level and tier; the total HP stays what the tier already gives (bosses get a
// little more per bar, BOSS_HP_PER_BAR), but HP regeneration only refills the current bar (a broken bar stays broken).
//   normal    1 · 2 from Lv 10 · 3 from Lv 30
//   champion  one more than a normal of its level
//   elite     3 + 1 per 15 levels (+1 for an elite kind), up to 6
//   MVP       4 + 1 per 7 levels, up to 10 (Satan, Lv 44, has all ten)
export const MAX_LIVES = 10;
export function livesFor(e) {
  const lv = e.level || 1;
  if (e.boss) return Math.min(MAX_LIVES, 4 + Math.floor(lv / 7));
  if (e.elite) return Math.min(6, 3 + Math.floor(lv / 15) + (e.kind && e.kind.elite ? 1 : 0));
  const normal = 1 + (lv >= 10 ? 1 : 0) + (lv >= 30 ? 1 : 0);
  return e.champion ? normal + 1 : normal;
}

// MVP bosses get +6% of their HP for every bar past the first (Malakor ×1.3 … Satan ×1.54), so a
// ten-bar boss fight lasts longer than a six-bar one. Other tiers keep the HP their tier gives.
export const BOSS_HP_PER_BAR = 0.06;

// Split the monster's full HP into its lives: maxHp becomes one bar
export function applyLives(e, n = livesFor(e)) {
  const total = e.maxHp * (e.boss ? 1 + BOSS_HP_PER_BAR * (Math.max(1, n) - 1) : 1);
  e.lives = e.livesLeft = Math.max(1, n);
  e.maxHp = e.hp = Math.max(1, Math.ceil(total / e.lives));
}

// HP over every bar (for % rules: enrage, berserk, poison, NPC hits, the balance sim)
export const totalMaxHp = (e) => e.maxHp * (e.lives || 1);
export const totalHp = (e) => Math.max(0, e.hp) + e.maxHp * ((e.livesLeft || 1) - 1);
export const hpFrac = (e) => totalHp(e) / Math.max(1, totalMaxHp(e));

// Pinsalang natatanggap (Stoneskin)
export const damageTakenMult = (e) => (has(e, "stoneskin") ? 0.6 : 1);

// Damage dealt (Berserk when its HP is low)
export const damageDealtMult = (e) => (has(e, "berserk") && hpFrac(e) < 0.5 ? 1.3 : 1);

// Attack speed (Swift: shorter wind-up)
export const windupFor = (e, base) => Math.round(base * (has(e, "swift") ? 0.8 : 1));

// Blight on the hero from its power (when it hits)
export function modBlight(e) {
  if (has(e, "fire")) return { type: "burn", chance: 0.4, time: 200 };
  if (has(e, "cold")) return { type: "freeze", chance: 0.35, time: 140 };
  if (has(e, "lightning")) return { type: "electrified", chance: 0.25, time: 120 };
  if (has(e, "cursed")) return { type: "curse", chance: 0.4, time: 300 };
  return null;
}
