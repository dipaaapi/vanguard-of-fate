import { getLang } from "./i18n.js";

// ==================== URI NG HALIMAW: NORMAL · CHAMPION · ELITE · MVP ====================
// Hango sa Diablo II (champion at unique monster) at Ragnarok Online (MVP).
//   CHAMPION (asul ★, 7%)  — 1 kapangyarihan · HP ×2 · pinsala ×1.2 · EXP ×2.5 · mas magandang samsam
//   ELITE    (ginto ✦, 2%) — may sariling pangalan · 2 kapangyarihan · 2 alagad · HP ×3.5 · pinsala ×1.35 · EXP ×5
//   MVP      (ang boss ng bawat Act) — tingnan ang BOSSES sa js/bestiary.js
//
// KAPANGYARIHAN (modifier) — may tunay na epekto sa laban:
//   swift       mas mabilis gumalaw at umatake
//   stoneskin   −40% pinsalang natatanggap
//   fire        apoy ang atake (paso) at sumasabog kapag namatay
//   cold        yelo ang atake (lamig), pinababagal ang bayani
//   lightning   kidlat ang atake (stun) at naglalabas ng kislap kapag tinamaan
//   cursed      isinusumpa ang bayani sa bawat tama
//   vampiric    gumagaling mula sa pinsalang ibinibigay
//   teleporter  biglang sumusulpot sa tabi ng bayani
//   berserk     +30% pinsala kapag mababa na ang HP

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

// Pangalan ng Elite (parang unique monster ng Diablo II): "Grimtooth ang Malupit"
const FIRST = ["Grim", "Vex", "Mor", "Skar", "Ul", "Dread", "Hollow", "Rot", "Blight", "Ash", "Frost", "Bane"];
const SECOND = ["tooth", "maw", "fang", "claw", "gore", "shade", "skull", "hide", "spine", "howl"];
const TITLE = {
  en: ["the Vile", "the Unbroken", "the Hungry", "the Cruel", "the Eclipsed", "the Wretched", "the Relentless"],
  fil: ["ang Malupit", "ang Di-Mabali", "ang Gutom", "ang Walang-Awa", "ang Nilamon ng Dilim", "ang Kaawa-awa", "ang Di-Tumitigil"]
};

// Magpasya ng uri pagkasilang. Ibinabalik ang uri ("normal" | "champion" | "elite")
export function rollTier(rnd = Math.random) {
  const r = rnd();
  if (r < TIERS.elite.chance) return "elite";
  if (r < TIERS.elite.chance + TIERS.champion.chance) return "champion";
  return "normal";
}

// Ilapat ang uri sa bagong halimaw
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

// Pinsalang natatanggap (Stoneskin)
export const damageTakenMult = (e) => (has(e, "stoneskin") ? 0.6 : 1);

// Pinsalang ibinibigay (Berserk kapag mababa ang HP)
export const damageDealtMult = (e) => (has(e, "berserk") && e.hp < e.maxHp * 0.5 ? 1.3 : 1);

// Bilis ng pag-atake (Swift: mas maikling paghahanda)
export const windupFor = (e, base) => Math.round(base * (has(e, "swift") ? 0.8 : 1));

// Sumpa sa bayani ayon sa kapangyarihan (kapag tumama)
export function modBlight(e) {
  if (has(e, "fire")) return { type: "burn", chance: 0.4, time: 200 };
  if (has(e, "cold")) return { type: "freeze", chance: 0.35, time: 140 };
  if (has(e, "lightning")) return { type: "electrified", chance: 0.25, time: 120 };
  if (has(e, "cursed")) return { type: "curse", chance: 0.4, time: 300 };
  return null;
}
