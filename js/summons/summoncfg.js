// ==================== SUMMON SETTINGS (Summon panel, F6) ====================
// Kept in player.premium.summon, so they are saved and survive Regression. Every value is clamped on load.
//   attack  "aggressive" any foe in range · "defensive" only foes attacking the party · "passive" never
//   range   how far from the hero a summon will go after a foe (px)
//   sell    which rarities Auto Sell may sell, and whether it waits until the bag is nearly full
//   stock   potions Auto Buy keeps in the bag · spend = share of the purse one errand may use
//   every   seconds between errands

export const ATTACK_MODES = ["aggressive", "defensive", "passive"];
export const RANGES = [120, 200, 280];
export const SPEND = [0.1, 0.25, 0.5];
export const EVERY = [5, 10, 30];
export const STOCK_ITEMS = ["salve", "elixir", "tonic", "panacea"];
export const STOCK_MAX = 30;

export const defaultSummonCfg = () => ({
  attack: "aggressive", range: 200,
  sell: { normal: true, magic: false, magicWhenFull: true, onlyWhenFull: false },
  stock: { salve: 10, elixir: 0, tonic: 0, panacea: 2 }, spend: 0.25, every: 10
});

const pick = (v, list, d) => (list.includes(v) ? v : d);
export function normalizeSummonCfg(c) {
  const d = defaultSummonCfg();
  if (!c || typeof c !== "object") return d;
  const sell = c.sell && typeof c.sell === "object" ? c.sell : {};
  const stock = c.stock && typeof c.stock === "object" ? c.stock : {};
  return {
    attack: pick(c.attack, ATTACK_MODES, d.attack), range: pick(c.range, RANGES, d.range),
    sell: Object.fromEntries(Object.keys(d.sell).map((k) => [k, typeof sell[k] === "boolean" ? sell[k] : d.sell[k]])),
    stock: Object.fromEntries(STOCK_ITEMS.map((k) => [k, Number.isFinite(stock[k]) ? Math.max(0, Math.min(STOCK_MAX, Math.floor(stock[k]))) : d.stock[k]])),
    spend: pick(c.spend, SPEND, d.spend), every: pick(c.every, EVERY, d.every)
  };
}

export const summonCfg = (p) => (p && p.premium ? (p.premium.summon ||= defaultSummonCfg()) : defaultSummonCfg());
