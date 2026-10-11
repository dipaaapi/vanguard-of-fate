import { describe } from "../items/itemdb.js";
import { premiumSkill } from "../premium.js";
import { getLang } from "../i18n.js";
import { summonCfg } from "./summoncfg.js";

// ==================== SUMMON ERRANDS (premium Auto Sell / Auto Buy) ====================
// With a summon at the hero's side, it runs to the market on its own (anywhere, even mid-fight). What it sells,
// what it stocks, how much it may spend and how often it goes are chosen in the Summon panel (js/summons/summoncfg.js):
//   Auto Sell — unrefined, unsocketed spare gear of the chosen rarities (never sets, uniques, cards or quest items)
//   Auto Buy  — tops the chosen potions up to their stock, within the chosen share of the purse
// deps = { buyPrice(id, it), sellQuote(it, n), onSold(it, n), report(text) }

export const ERRAND_EVERY = 600;   // default (10 s); the panel picks 5 / 10 / 30 s
export const STOCK = { salve: 10, panacea: 2 };   // default stock
const FULL_AT = 34;   // of 40 bag slots
const TEXT = {
  sold: { en: (n, g) => `Your summon sold ${n} spare item(s) for ${g}.`, fil: (n, g) => `Ibinenta ng iyong summon ang ${n} sobrang gamit sa halagang ${g}.` },
  bought: { en: (n, g) => `Your summon restocked ${n} potion(s) for ${g}.`, fil: (n, g) => `Nag-restock ang iyong summon ng ${n} potion sa halagang ${g}.` }
};
const say = (key, ...a) => (TEXT[key][getLang() === "fil" ? "fil" : "en"])(...a);

export const hasSummon = (p) => Boolean(p && (p.familiar || p.falconCompanion || (p.angelCompanions && p.angelCompanions.length) || p.premium?.summonActive));

// Spare gear the summon may sell: never quest items, cards, sets, uniques, refined or socketed gear
export function sellable(s, it, full, rule = { normal: true, magic: false, magicWhenFull: true, onlyWhenFull: false }) {
  if (!it || it.type !== "equip") return false;
  if ((s.plus | 0) > 0 || (s.cards && s.cards.length) || s.set || s.temper) return false;
  if (rule.onlyWhenFull && !full) return false;
  const r = s.rarity || "normal";
  return (r === "normal" && rule.normal) || (r === "magic" && (rule.magic || (full && rule.magicWhenFull)));
}

export function runErrands(p, deps, fmt = (g) => `${g}G`) {
  if (!p || !p.bag || !hasSummon(p)) return null;
  const out = [], cfg = summonCfg(p);
  if (premiumSkill(p, "autoSell")) {
    const full = p.bag.slots.length >= FULL_AT;
    let n = 0, g = 0;
    for (let i = p.bag.slots.length - 1; i >= 0; i--) {
      const s = p.bag.slots[i], it = describe(s);
      if (!sellable(s, it, full, cfg.sell)) continue;
      const pay = deps.sellQuote(it, s.qty);
      if (!pay) continue;
      p.gold += pay; g += pay; n += s.qty;
      if (deps.onSold) deps.onSold(it, s.qty);
      p.bag.removeAt(i, s.qty);
    }
    if (n) out.push(say("sold", n, fmt(g)));
  }
  if (premiumSkill(p, "autoBuy")) {
    let budget = Math.max(0, p.gold * cfg.spend), n = 0, g = 0;
    for (const [id, want] of Object.entries(cfg.stock)) {
      const it = describe({ id, qty: 1 }), price = it && deps.buyPrice(id, it);
      if (!price) continue;
      const need = Math.min(want - p.bag.count(id), Math.floor(budget / price));
      if (need <= 0) continue;
      const before = p.bag.count(id);
      p.bag.add(id, need);
      const got = p.bag.count(id) - before, cost = got * price;
      p.gold -= cost; budget -= cost; g += cost; n += got;
    }
    if (n) out.push(say("bought", n, fmt(g)));
  }
  if (out.length && deps.report) deps.report(out.join(" "));
  return out;
}

export function tickErrands(p, deps, fmt) {
  if (!p) return;
  p.errandT = (p.errandT || 0) + 1;
  if (p.errandT < summonCfg(p).every * 60) return;
  p.errandT = 0;
  if (p.hp > 0) runErrands(p, deps, fmt);
}
