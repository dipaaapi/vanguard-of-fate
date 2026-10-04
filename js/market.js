import { getItem } from "./items/itemdb.js";
import { iconURL } from "./items/icons.js";
import { getLang } from "./i18n.js";

// ==================== SAFE-ZONE MARKET (B) ====================
// Buy and sell from anywhere inside a sanctuary (Barracks, Citadel dais, platform camps) without
// walking to a shop NPC. Stock, buy quantities and wording: data/market.json. Selling pays half the
// item's price, like the inventory's Sell; quest items never show up. HTML overlay in #viewport.

let DATA = { stock: ["salve", "elixir", "tonic", "panacea"], bulk: [1, 5, 10], text: {} };
const ready = fetch("data/market.json").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) DATA = d; }).catch(() => {});

function tx(key, vars = {}) {
  const e = DATA.text[key];
  const s = e ? (e[getLang()] || e.en) : key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
}

export const sellPrice = (it) => Math.max(1, Math.floor((it.price || 0) / 2));

// Pricing and extra tabs are pluggable so an economy module can own them (ctx in the constructor):
//   stock() → [ids] · buyPrice(id, item) → gold for one · sellQuote(item, qty) → gold paid for qty
//   onSold(item, qty) → after a sale (e.g. market saturation) · tabs: [{ id, label() , open() }] extra
//   tab buttons that hand over to another safe-zone panel (e.g. the Workshop)
// Without them: data/market.json stock, the item's price to buy, half of it to sell.
const isJunk = (s, it) => it.type === "equip" && it.rarity === "normal" && !(s.plus > 0) && !(s.cards && s.cards.length);

export class Market {
  // ctx: { onTrade(text), onFail(text), stock, buyPrice, sellQuote, onSold, tabs } (see above)
  constructor(root, ctx = {}) {
    this.root = root;
    this.ctx = ctx;
    this.open = false;
    this.player = null;
    this.tab = "buy";
    this.index = 0;
    this.rows = [];
    ready.then(() => { if (this.open) this.render(); });
  }

  show(player) {
    this.player = player;
    this.open = true;
    this.index = 0;
    this.root.classList.add("open");
    this.render();
  }

  close() {
    this.open = false;
    this.root.classList.remove("open");
  }

  // ---------- PRICES ----------
  stock() { return this.ctx.stock ? this.ctx.stock() : DATA.stock; }
  priceOf(id, it) { return this.ctx.buyPrice ? this.ctx.buyPrice(id, it) : it.price; }
  quote(it, n) { return this.ctx.sellQuote ? this.ctx.sellQuote(it, n) : sellPrice(it) * n; }
  sold(it, n) { if (this.ctx.onSold) this.ctx.onSold(it, n); }

  // ---------- TRADES ----------
  buy(id, n) {
    const p = this.player, it = getItem(id);
    if (!p || !it) return;
    const cost = this.priceOf(id, it) * n;
    if (p.gold < cost) { this.fail(tx("poor")); return; }
    if (!p.bag.add(id, n)) { this.fail(tx("full")); return; }
    p.gold -= cost;
    this.trade(tx("bought", { name: it.name, n, g: cost }));
  }

  sell(index, all) {
    const p = this.player, s = p && p.bag.slots[index];
    if (!s) return;
    const it = p.bag.itemAt(index);
    if (!it || it.type === "quest") return;
    const n = all ? s.qty : 1, g = this.quote(it, n);
    p.bag.removeAt(index, n);
    p.gold += g;
    this.sold(it, n);
    this.trade(tx("sold", { name: it.name, n, g }));
  }

  sellJunk() {
    const p = this.player;
    if (!p) return;
    let n = 0, g = 0;
    for (let i = p.bag.slots.length - 1; i >= 0; i--) {
      const s = p.bag.slots[i], it = p.bag.itemAt(i);
      if (!it || !isJunk(s, it)) continue;
      n += s.qty;
      g += this.quote(it, s.qty);
      this.sold(it, s.qty);
      p.bag.removeAt(i, s.qty);
    }
    if (!n) return;
    p.gold += g;
    this.trade(tx("soldJunk", { n, g }));
  }

  trade(text) {
    if (this.player && this.player.recalc) this.player.recalc();
    if (this.ctx.onTrade) this.ctx.onTrade(text);
    this.render();
  }

  fail(text) {
    if (this.ctx.onFail) this.ctx.onFail(text);
    this.render(text);
  }

  // ---------- DRAWING ----------
  sellable() {
    const p = this.player;
    return p ? p.bag.slots.map((s, i) => ({ s, i, it: p.bag.itemAt(i) })).filter((r) => r.it && r.it.type !== "quest") : [];
  }

  render(msg = "") {
    const p = this.player;
    if (!p) return;
    const r = this.root;
    r.textContent = "";
    const el = (tag, cls, text, parent) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text !== undefined) e.textContent = text;
      (parent || r).appendChild(e);
      return e;
    };
    const btn = (text, fn, parent, cls = "") => {
      const b = el("button", `mk-btn ${cls}`, text, parent);
      b.type = "button";
      b.tabIndex = -1;
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("click", (e) => { e.stopPropagation(); fn(); });
      return b;
    };
    const icon = (it, parent) => {
      const img = el("img", "mk-icon", undefined, parent);
      img.alt = "";
      img.src = iconURL(it);
    };

    const head = el("div", "mk-head");
    el("h3", "", `⚖ ${tx("title")}`, head);
    el("span", "mk-gold", `◆ ${p.gold}G`, head);
    const tabs = el("div", "mk-tabs");
    ["buy", "sell"].forEach((t) => {
      const b = btn(tx(t), () => { this.tab = t; this.index = 0; this.render(); }, tabs, this.tab === t ? "on" : "");
      b.dataset.tab = t;
    });
    (this.ctx.tabs || []).forEach((t) => {
      const b = btn(t.label(), () => { this.close(); t.open(); }, tabs);
      b.dataset.tab = t.id;
    });

    const list = el("div", "mk-list");
    this.rows = [];
    if (this.tab === "buy") {
      this.stock().forEach((id) => {
        const it = getItem(id);
        if (!it) return;
        const price = this.priceOf(id, it);
        const i = this.rows.length;
        const row = el("div", `mk-row${i === this.index ? " sel" : ""}`, undefined, list);
        icon(it, row);
        const info = el("div", "mk-info", undefined, row);
        el("b", "", it.name, info).style.color = it.color || "";
        el("span", "mk-desc", `${it.desc} · ${tx("owned")} ${p.bag.count(id)}`, info);
        el("span", "mk-price", `${price}G`, row);
        const acts = el("div", "mk-acts", undefined, row);
        DATA.bulk.forEach((n) => {
          const b = btn(`×${n}`, () => this.buy(id, n), acts);
          if (p.gold < price * n) b.classList.add("off");
        });
        this.rows.push({ one: () => this.buy(id, 1), all: () => this.buy(id, DATA.bulk[DATA.bulk.length - 1]) });
      });
    } else {
      const items = this.sellable();
      if (!items.length) el("p", "mk-empty", tx("empty"), list);
      items.forEach(({ s, i: slot, it }) => {
        const i = this.rows.length;
        const row = el("div", `mk-row${i === this.index ? " sel" : ""}`, undefined, list);
        icon(it, row);
        const info = el("div", "mk-info", undefined, row);
        el("b", "", `${it.name}${s.qty > 1 ? ` ×${s.qty}` : ""}`, info).style.color = it.color || "";
        el("span", "mk-desc", `${this.quote(it, 1)}G ${tx("each")}`, info);
        el("span", "mk-price", `+${this.quote(it, s.qty)}G`, row);
        const acts = el("div", "mk-acts", undefined, row);
        btn(tx("sellOne"), () => this.sell(slot, false), acts);
        if (s.qty > 1) btn(tx("sellAll"), () => this.sell(slot, true), acts);
        this.rows.push({ one: () => this.sell(slot, false), all: () => this.sell(slot, true) });
      });
      const junk = items.filter(({ s, it }) => isJunk(s, it));
      if (junk.length) {
        const g = junk.reduce((sum, { s, it }) => sum + this.quote(it, s.qty), 0);
        btn(`${tx("junk")} (${junk.reduce((n, { s }) => n + s.qty, 0)} · +${g}G)`, () => this.sellJunk(), r, "wide");
      }
    }
    if (msg) el("div", "mk-msg", msg);
    el("div", "mk-hint", tx("hint"));
    const sel = list.querySelector(".mk-row.sel");
    if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: "nearest" });
  }

  handleInput(e) {
    const n = this.rows.length;
    if (e.code === "KeyB" || e.code === "Escape") this.close();
    else if (e.code === "Tab") {
      // Buy → Sell → any extra tab (e.g. the Workshop) → Buy
      const extra = this.ctx.tabs || [];
      if (this.tab === "buy") this.tab = "sell";
      else if (this.tab === "sell" && extra.length) { this.close(); extra[0].open(); return e.preventDefault(); }
      else this.tab = "buy";
      this.index = 0;
      this.render();
    }
    else if ((e.code === "ArrowDown" || e.code === "KeyS") && n) { this.index = (this.index + 1) % n; this.render(); }
    else if ((e.code === "ArrowUp" || e.code === "KeyW") && n) { this.index = (this.index - 1 + n) % n; this.render(); }
    else if (e.code === "Enter" && this.rows[this.index]) {
      this.rows[this.index][e.shiftKey ? "all" : "one"]();
      this.index = Math.min(this.index, Math.max(0, this.rows.length - 1));
      this.render();
    }
    e.preventDefault();
  }
}

export const marketText = tx;
