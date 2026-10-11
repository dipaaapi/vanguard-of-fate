import { getLang } from "../i18n.js";

// ==================== ECONOMY (buy and sell prices) ====================
// One place for what shops charge and what they pay, so prices stay consistent between the inventory,
// Edgar's apothecary, Pip's stall and any safe-zone shop.
//
//   Item value: describe(item).price (js/items/itemdb.js: by grade and rarity for gear, a fixed value otherwise).
//   Buying:  value × the shop's markup (or the shop's fixed price for an item).
//   Selling: value × SELL_RATE[type], then the market saturates: every unit of the same item sold
//            lowers its price by MARKET.step (down to MARKET.floor), and one unit recovers every
//            MARKET.recoverMs. Farming one item for gold pays less and less; selling a variety pays full.
// Checked with `node .claude/skills/balance/balance-sim.mjs --economy` (gold earned vs. spent per Act).

export const SELL_RATE = { equip: 0.25, material: 0.4, consume: 0.3, card: 0.5, quest: 0 };
export const MARKET = { step: 0.04, floor: 0.4, recoverMs: 30000 };

// stock = item ids in display order · markup = × item value · fixed = exact prices
export const SHOPS = {
  // Edgar the Apothecary (hub)
  apothecary: { stock: ["salve", "panacea", "tonic", "elixir"], markup: 1 },
  // Pip's stall in Emberhold (Ashfall): refine materials and potions at a dwarven mark-up
  dwarf: {
    stock: ["monsterShard", "voidCrystal", "elixir", "tonic", "panacea"], markup: 1.5,
    fixed: { monsterShard: 15, voidCrystal: 80, elixir: 45, tonic: 18, panacea: 22, mushroom: 3000 }
  },
  // Any safe zone (Barracks, Citadel, platform camps): basics and cooking staples
  safezone: { stock: [ "salve", "elixir", "tonic", "panacea", "monsterShard", "wildSpice", "rockSalt"], markup: 1.25 }
};

// What a shop charges for one. item = describe(...) of the id
export function buyPrice(shopId, id, item) {
  const shop = SHOPS[shopId] || SHOPS.safezone;
  if (shop.fixed && shop.fixed[id] !== undefined) return shop.fixed[id];
  return Math.max(1, Math.round((item ? item.price : 0) * shop.markup));
}

// What a shop pays for one unit before saturation
export function baseSellPrice(item) {
  if (!item || item.type === "quest") return 0;
  return Math.max(1, Math.floor((item.price || 0) * (SELL_RATE[item.type] ?? 0.3)));
}

// Market saturation (kept per save on the player: player.market = new Market(data))
export class Market {
  constructor(data) {
    this.sold = {};                   // id → { n: units recently sold, at: ms timestamp of the last update }
    if (data && typeof data === "object") {
      Object.entries(data).forEach(([id, s]) => {
        if (s && Number.isFinite(s.n) && Number.isFinite(s.at)) this.sold[id] = { n: Math.max(0, Math.min(50, s.n)), at: s.at };
      });
    }
  }

  // Units still weighing on the price (recovered over time)
  pressure(id, now = Date.now()) {
    const s = this.sold[id];
    if (!s) return 0;
    return Math.max(0, s.n - Math.max(0, now - s.at) / MARKET.recoverMs);
  }

  factor(id, extra = 0, now = Date.now()) {
    return Math.max(MARKET.floor, 1 - MARKET.step * (this.pressure(id, now) + extra));
  }

  // Gold for selling qty units of item (each unit a little cheaper once the market saturates)
  quote(item, qty = 1, now = Date.now()) {
    const base = baseSellPrice(item);
    if (!base) return 0;
    let total = 0;
    for (let k = 0; k < qty; k++) total += Math.max(1, Math.floor(base * this.factor(item.base || item.id, k, now)));
    return total;
  }

  // Records a sale (call after paying out the quote)
  record(item, qty = 1, now = Date.now()) {
    const id = item.base || item.id;
    this.sold[id] = { n: this.pressure(id, now) + qty, at: now };
  }

  serialize() {
    const now = Date.now(), out = {};
    Object.keys(this.sold).forEach((id) => { const n = this.pressure(id, now); if (n > 0.05) out[id] = { n: +n.toFixed(2), at: now }; });
    return out;
  }
}

// Sells qty of the item and pays the player. Returns the gold paid
export function sell(player, item, qty = 1) {
  if (!player.market) player.market = new Market();
  const gold = player.market.quote(item, qty);
  if (!gold) return 0;
  player.gold += gold;
  player.market.record(item, qty);
  return gold;
}

// Save-compatible gold units; 100 bronze = silver, 100 silver = gold, 100 gold = platinum.
export function coinBreakdown(gold) {
  let bronze = Math.max(0, Math.round((Number.isFinite(gold) ? gold : 0) * 10000));
  const coins = {};
  for (const [id, value] of [["platinum", 1000000], ["gold", 10000], ["silver", 100], ["bronze", 1]]) {
    coins[id] = Math.floor(bronze / value);
    bronze %= value;
  }
  return coins;
}

export function formatCoins(gold, compact = true) {
  const coins = coinBreakdown(gold);
  const labels = compact ? { platinum: "P", gold: "G", silver: "S", bronze: "B" }
    : getLang() === "fil" ? { platinum: "platino", gold: "ginto", silver: "pilak", bronze: "tanso" }
    : { platinum: "platinum", gold: "gold", silver: "silver", bronze: "bronze" };
  return Object.entries(coins).filter(([, n]) => n).map(([id, n]) => `${n}${compact ? "" : " "}${labels[id]}`).join(" ") || `0${compact ? "" : " "}${labels.bronze}`;
}

// Persistent four-denomination wallet: only rebuild when the amount or language changes.
export function renderCoinWallet(el, gold) {
  const sig = `${gold}|${getLang()}`;
  if (el.dataset.coins === sig) return;
  el.dataset.coins = sig;
  el.classList.add("coin-wallet");
  el.textContent = "";
  const names = getLang() === "fil"
    ? { platinum: "Platino", gold: "Ginto", silver: "Pilak", bronze: "Tanso" }
    : { platinum: "Platinum", gold: "Gold", silver: "Silver", bronze: "Bronze" };
  const coins = coinBreakdown(gold);
  el.setAttribute("aria-label", formatCoins(gold, false));
  for (const [coin, count] of Object.entries(coins)) {
    const chip = document.createElement("span");
    chip.className = `coin-chip ${coin}`;
    chip.title = `${count} ${names[coin]}`;
    const icon = document.createElement("img");
    icon.src = `assets/ui/coin_${coin}.png`;
    icon.alt = names[coin];
    const amount = document.createElement("b");
    amount.textContent = String(count);
    chip.append(icon, amount);
    el.appendChild(chip);
  }
}
