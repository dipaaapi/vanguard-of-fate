import { getItem, describe } from "./items/itemdb.js";
import { signature } from "./items/bag.js";
import { buyPrice, Market as EconMarket } from "./items/economy.js";
import { getLang } from "./i18n.js";

// ==================== SUMMON ERRANDS ====================
// Outside a safe zone the Market (B) turns into an errand order: the hero's summon or familiar
// (Pocket Slime, War Hound, Arcane Owl, Spirit Fox, the Archer's Falcon or one of the Priest's Guardian
// Angels) carries a 9-slot pack to the market. It sells any non-quest item and buys potions and the
// Yggdrasil Leaf at the safe-zone price. Prices are settled when it leaves (so market saturation is the
// same as selling in person); the gold it earns and the goods it buys arrive when it comes back. While it
// is away it can't fight, strike (Falcon K) or be summoned (one Angel fewer). Tuning and wording:
// data/errand.json. State lives on player.errand (plain data, saved with the game).

let DATA = {
  slots: 9, stack: 10, baseSeconds: 25, perSlotSeconds: 3,
  buy: ["salve", "elixir", "tonic", "panacea", "herb"], runners: {}, text: {}
};
const ready = fetch("data/errand.json").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) DATA = { ...DATA, ...d }; }).catch(() => {});
export const errandReady = ready;
export const errandConfig = () => DATA;

export function errandText(key, vars = {}) {
  const e = DATA.text[key];
  const s = e ? (e[getLang()] || e.en) : key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
}

export function runnerName(kind) {
  const e = DATA.runners[kind];
  return e ? (e[getLang()] || e.en) : kind;
}

const market = (p) => (p.market ||= new EconMarket());
export const errandBuyPrice = (id) => buyPrice("safezone", id, getItem(id));

// Who would run the errand now: { kind, entity } or null (a Priest needs a live Angel)
export function runnerFor(player) {
  if (!player) return null;
  if (player.familiar) return { kind: player.familiar.kind, entity: player.familiar };
  if (player.falconCompanion) return { kind: "falcon", entity: player.falconCompanion };
  const angel = (player.angelCompanions || []).find((a) => a.isAlive);
  if (angel) return { kind: "angel", entity: angel };
  return null;
}

// Whether this hero has any summon that could run errands at all (an Angel only while summoned)
export const hasRunnerKind = (player) => Boolean(player && (player.familiar || player.falconCompanion || player.heroData.id === "priest"));

// The runner kind that is away, or null
export const awayRunner = (player) => (player && player.errand ? player.errand.runner : null);
const FAMILIAR_KINDS = ["slime", "hound", "owl", "fox"];
// kind: "familiar" (any of them: a job change mid-errand doesn't bring it back early), "falcon" or "angel"
export const isAway = (player, kind) => {
  const a = awayRunner(player);
  return Boolean(a) && (kind === "familiar" ? FAMILIAR_KINDS.includes(a) : a === kind);
};
export const secondsLeft = (player) => (player && player.errand ? Math.ceil(player.errand.t / 60) : 0);

// ---------- THE ORDER (built in the Market panel) ----------
// slots: { sell: bag instance with qty } or { buy: id, qty }
export class ErrandPack {
  constructor() { this.slots = []; }
  get max() { return DATA.slots; }
  get used() { return this.slots.length; }

  // Units of this bag stack already packed
  packed(inst) {
    const sig = signature(inst);
    return this.slots.reduce((n, s) => n + (s.sell && signature(s.sell) === sig ? s.sell.qty : 0), 0);
  }

  // Packs n of a bag stack to sell (one slot per stack); returns how many went in
  addSell(inst, n) {
    if (n <= 0) return 0;
    const sig = signature(inst);
    const have = this.slots.find((s) => s.sell && signature(s.sell) === sig);
    if (have) { have.sell.qty += n; return n; }
    if (this.used >= this.max) return 0;
    this.slots.push({ sell: { ...inst, qty: n } });
    return n;
  }

  // Packs n of a shop item: tops up slots of the same item first (up to `stack` each), then new slots
  addBuy(id, n) {
    let left = n;
    this.slots.forEach((s) => {
      if (left > 0 && s.buy === id && s.qty < DATA.stack) { const k = Math.min(left, DATA.stack - s.qty); s.qty += k; left -= k; }
    });
    while (left > 0 && this.used < this.max) {
      const k = Math.min(left, DATA.stack);
      this.slots.push({ buy: id, qty: k });
      left -= k;
    }
    return n - left;
  }

  // Room left for one shop item across slots
  roomFor(id) {
    const topUp = this.slots.reduce((n, s) => n + (s.buy === id ? DATA.stack - s.qty : 0), 0);
    return topUp + (this.max - this.used) * DATA.stack;
  }

  remove(i) { this.slots.splice(i, 1); }

  proceeds(player) {
    return this.slots.reduce((g, s) => g + (s.sell ? market(player).quote(describe(s.sell), s.sell.qty) : 0), 0);
  }

  cost() {
    return this.slots.reduce((g, s) => g + (s.buy ? errandBuyPrice(s.buy) * s.qty : 0), 0);
  }

  seconds() { return DATA.baseSeconds + DATA.perSlotSeconds * this.used; }
}

// Sends the runner off. Returns an error text, or "" on success.
export function dispatch(player, pack) {
  const r = runnerFor(player);
  if (!r) return errandText(hasRunnerKind(player) ? "noAngel" : "noRunner");
  if (player.errand) return errandText("busy", { name: runnerName(player.errand.runner) });
  if (!pack.used) return "";
  const proceeds = pack.proceeds(player), cost = pack.cost();
  if (player.gold + proceeds < cost) return errandText("poor");

  // Sell now (records the market saturation), take the goods out of the bag
  let soldN = 0;
  pack.slots.forEach((s) => {
    if (!s.sell) return;
    const sig = signature(s.sell);
    let left = s.sell.qty;
    for (let i = player.bag.slots.length - 1; i >= 0 && left > 0; i--) {
      const b = player.bag.slots[i];
      if (signature(b) !== sig) continue;
      const k = Math.min(left, b.qty);
      player.bag.removeAt(i, k);
      left -= k;
    }
    const n = s.sell.qty - left;
    if (n > 0) market(player).record(describe(s.sell), n);
    soldN += n;
  });
  // Purchases are paid out of the sale first; any shortfall is paid now
  if (cost > proceeds) player.gold -= cost - proceeds;
  player.errand = {
    runner: r.kind,
    t: pack.seconds() * 60,
    soldN,
    sold: proceeds,
    gold: Math.max(0, proceeds - cost),
    buys: pack.slots.filter((s) => s.buy).map((s) => ({ id: s.buy, qty: s.qty }))
  };
  // An Angel is spent on the errand (it reports back and returns to the heavens)
  if (r.kind === "angel") player.angelCompanions = player.angelCompanions.filter((a) => a !== r.entity);
  pack.slots = [];
  if (player.recalc) player.recalc();
  return "";
}

// Every frame while playing. ctx: { log(text), drop(inst), fx, sound }
export function updateErrand(player, ctx = {}) {
  const e = player && player.errand;
  if (!e) return;
  if (--e.t > 0) return;
  player.errand = null;
  player.gold += e.gold;
  let dropped = false;
  e.buys.forEach((b) => {
    const before = player.bag.count(b.id);
    if (player.bag.add(b.id, b.qty)) return;
    // Bag full: whatever didn't fit lands at the hero's feet
    const left = b.qty - (player.bag.count(b.id) - before);
    if (left > 0 && ctx.drop) ctx.drop({ id: b.id, qty: left });
    dropped = true;
  });
  const merged = {};
  e.buys.forEach((b) => { merged[b.id] = (merged[b.id] || 0) + b.qty; });
  const list = Object.entries(merged).map(([id, n]) => `${(getItem(id) || { name: id }).name} ×${n}`).join(", ");
  const sold = e.soldN ? errandText("soldPart", { n: e.soldN, g: e.sold }) : "";
  const bought = list ? errandText("boughtPart", { sep: sold ? " · " : "", list }) : "";
  const r = runnerFor(player);
  if (r && r.entity.place) r.entity.place(player);
  else if (r && r.entity) { r.entity.x = player.x - 22; r.entity.y = player.y - 18; }
  if (ctx.fx && ctx.fx.spawnHitSparks) ctx.fx.spawnHitSparks(player.x - 10, player.y + 10, "#ffd166", 16);
  if (ctx.sound && ctx.sound.playCoin) ctx.sound.playCoin();
  if (ctx.log) ctx.log(errandText("back", { name: runnerName(e.runner), sold, bought }) + (dropped ? ` · ${errandText("dropped")}` : ""));
  if (player.recalc) player.recalc();
}

// ---------- SAVE ----------
export const serializeErrand = (player) => (player && player.errand ? { ...player.errand, buys: player.errand.buys.map((b) => ({ ...b })) } : null);

// Only known runners and shop items, finite non-negative numbers
export function loadErrand(player, data) {
  player.errand = null;
  if (!data || typeof data !== "object") return;
  const num = (v, max) => (Number.isFinite(+v) ? Math.max(0, Math.min(max, Math.floor(+v))) : 0);
  const runner = [...FAMILIAR_KINDS, "falcon", "angel"].includes(data.runner) ? data.runner : null;
  if (!runner) return;
  const buys = (Array.isArray(data.buys) ? data.buys : []).slice(0, DATA.slots)
    .filter((b) => b && DATA.buy.includes(b.id) && getItem(b.id))
    .map((b) => ({ id: b.id, qty: Math.max(1, num(b.qty, DATA.stack)) }));
  player.errand = {
    runner,
    t: Math.max(1, num(data.t, 60 * 600)),
    soldN: num(data.soldN, 1e6),
    sold: num(data.sold, 1e9),
    gold: num(data.gold, 1e9),
    buys
  };
}
