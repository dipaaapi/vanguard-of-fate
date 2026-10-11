import { formatCoins, renderCoinWallet } from "./items/economy.js";
import { getItem, describe } from "./items/itemdb.js";
import { iconURL } from "./items/icons.js";
import { getLang } from "./i18n.js";
import { ErrandPack, errandConfig, errandText, errandReady, errandBuyPrice, runnerFor, runnerName, dispatch, secondsLeft } from "./errand.js";

// ==================== SAFE-ZONE MARKET (B) ====================
// Buy and sell from anywhere inside a sanctuary (Barracks, Citadel dais, platform camps) without
// walking to a shop NPC. Every row has a quantity slider (drag it, or ← → on the chosen row) and one
// button that trades that many. Stock and wording: data/market.json. Quest items never show up.
// Outside a safe zone the same panel is a summon errand order (js/errand.js): the sliders pack items
// into the summon's 9-slot pack, and Send dispatches it. HTML overlay in #viewport.

let DATA = { stock: ["salve", "elixir", "tonic", "panacea"], text: {} };
const ready = fetch("data/market.json").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) DATA = d; }).catch(() => {});

function tx(key, vars = {}) {
  const e = DATA.text[key];
  const s = e ? (e[getLang()] || e.en) : key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
}

export const sellPrice = (it) => Math.max(1, Math.floor((it.price || 0) / 2));
const MAX_BUY = 99;   // the buy slider's top end (also capped by gold)

// Pricing and extra tabs are pluggable so an economy module can own them (ctx in the constructor):
//   stock() → [ids] · buyPrice(id, item) → gold for one · sellQuote(item, qty) → gold paid for qty
//   onSold(item, qty) → after a sale (e.g. market saturation) · tabs: [{ id, label() , open() }] extra
//   tab buttons that hand over to another safe-zone panel (e.g. the Workshop)
// Without them: data/market.json stock, the item's price to buy, half of it to sell.
export class Market {
  // ctx: { onTrade(text), onFail(text), onErrand(text), stock, buyPrice, sellQuote, onSold, tabs } (see above)
  constructor(root, ctx = {}) {
    this.root = root;
    this.ctx = ctx;
    this.open = false;
    this.player = null;
    this.mode = "shop";       // "shop" in a safe zone, "errand" outside one
    this.tab = "buy";
    this.index = 0;
    this.rows = [];
    this.qty = {};            // row key → slider value
    this.pack = new ErrandPack();
    ready.then(() => { if (this.open) this.render(); });
    errandReady.then(() => { if (this.open) this.render(); });
  }

  // mode: "shop" (default) or "errand"
  show(player, mode = "shop") {
    this.player = player;
    this.mode = mode;
    this.open = true;
    this.tab = "buy";
    this.index = 0;
    this.qty = {};
    this.pack = new ErrandPack();
    this.root.classList.add("open");
    this.render();
  }

  close() {
    this.open = false;
    this.root.classList.remove("open");
  }

  // ---------- PRICES ----------
  stock() { return this.mode === "errand" ? errandConfig().buy : this.ctx.stock ? this.ctx.stock() : DATA.stock; }
  priceOf(id, it) { return this.mode === "errand" ? errandBuyPrice(id) : this.ctx.buyPrice ? this.ctx.buyPrice(id, it) : it.price; }
  quote(it, n) { return this.ctx.sellQuote ? this.ctx.sellQuote(it, n) : sellPrice(it) * n; }
  sold(it, n) { if (this.ctx.onSold) this.ctx.onSold(it, n); }

  // ---------- TRADES ----------
  buy(id, n) {
    const p = this.player, it = getItem(id);
    if (!p || !it || n < 1) return;
    const price = this.priceOf(id, it);
    if (p.gold < price * n) { this.fail(tx("poor")); return; }
    // Pay only for what fits in the bag
    const before = p.bag.count(id);
    const fit = p.bag.add(id, n);
    const got = p.bag.count(id) - before;
    if (!got) { this.fail(tx("full")); return; }
    p.gold -= price * got;
    this.trade(tx("bought", { name: it.name, n: got, g: formatCoins(price * got) }) + (fit ? "" : ` · ${tx("full")}`));
  }

  sell(index, n) {
    const p = this.player, s = p && p.bag.slots[index];
    if (!s) return;
    const it = p.bag.itemAt(index);
    if (!it || it.type === "quest") return;
    n = Math.max(1, Math.min(s.qty, n));
    const g = this.quote(it, n);
    p.bag.removeAt(index, n);
    p.gold += g;
    this.sold(it, n);
    this.trade(tx("sold", { name: it.name, n, g: formatCoins(g) }));
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

  // ---------- ERRAND ----------
  // Gold the order still leaves to spend: purse + what the packed goods will sell for − packed purchases
  errandBudget() {
    return this.player.gold + this.pack.proceeds(this.player) - this.pack.cost();
  }

  packBuy(id, n) {
    if (this.pack.addBuy(id, n) < n) this.fail(errandText("packFull"));
    else this.render();
  }

  packSell(slot, n) {
    if (!this.pack.addSell(slot, n)) this.fail(errandText("packFull"));
    else this.render();
  }

  send() {
    const p = this.player;
    if (!p || !this.pack.used) return;
    const n = this.pack.used;
    const err = dispatch(p, this.pack);
    if (err) { this.fail(err); return; }
    if (this.ctx.onErrand) this.ctx.onErrand(errandText("sent", { name: runnerName(p.errand.runner), n }));
    this.close();
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
    const errand = this.mode === "errand";
    r.textContent = "";
    r.classList.toggle("errand", errand);
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
    el("h3", "", errand ? `✦ ${errandText("title")}` : `⚖ ${tx("title")}`, head);
    renderCoinWallet(el("span", "mk-gold", undefined, head), p.gold);

    // The summon is already out: just say when it's back
    if (errand && p.errand) {
      el("p", "mk-empty", errandText("away", { name: runnerName(p.errand.runner), s: secondsLeft(p) }));
      el("div", "mk-hint", tx("closeHint"));
      this.rows = [];
      return;
    }

    const tabs = el("div", "mk-tabs");
    ["buy", "sell"].forEach((t) => {
      const b = btn(errand ? errandText(t) : tx(t), () => { this.tab = t; this.index = 0; this.render(); }, tabs, this.tab === t ? "on" : "");
      b.dataset.tab = t;
    });
    if (!errand) {
      (this.ctx.tabs || []).forEach((t) => {
        const b = btn(t.label(), () => { this.close(); t.open(); }, tabs);
        b.dataset.tab = t.id;
      });
    }

    // One row: icon, name, note, price, then the slider (1..max), its amount and the trade button
    const list = el("div", "mk-list");
    this.rows = [];
    const addRow = ({ key, it, name, note, price, max, label, act }) => {
      const i = this.rows.length;
      const q = Math.max(1, Math.min(max, this.qty[key] || 1));
      const row = el("div", `mk-row${i === this.index ? " sel" : ""}`, undefined, list);
      row.addEventListener("mousedown", () => { if (this.index !== i) { this.index = i; row.parentNode.querySelectorAll(".mk-row").forEach((x, k) => x.classList.toggle("sel", k === i)); } });
      icon(it, row);
      const info = el("div", "mk-info", undefined, row);
      el("b", "", name, info).style.color = it.color || "";
      el("span", "mk-desc", note, info);
      el("span", "mk-price", price, row);
      const acts = el("div", "mk-acts", undefined, row);
      const slider = el("input", "mk-slider", undefined, acts);
      slider.type = "range";
      slider.min = "1";
      slider.max = String(Math.max(1, max));
      slider.value = String(q);
      slider.tabIndex = -1;
      slider.disabled = max < 1;
      const go = btn(label(q), () => act(Math.max(1, Math.min(max, this.qty[key] || 1))), acts, max < 1 ? "off" : "");
      go.disabled = max < 1;
      // Live update while dragging (no re-render, so the drag isn't interrupted)
      slider.addEventListener("input", () => { this.qty[key] = +slider.value; go.textContent = label(+slider.value); });
      slider.addEventListener("mousedown", (e) => e.stopPropagation());
      this.rows.push({ key, max, act: (n) => act(Math.max(1, Math.min(max, n))) });
    };

    if (this.tab === "buy") {
      const budget = errand ? this.errandBudget() : p.gold;
      this.stock().forEach((id) => {
        const it = getItem(id);
        if (!it) return;
        const price = this.priceOf(id, it);
        const cap = errand ? Math.min(MAX_BUY, this.pack.roomFor(id)) : MAX_BUY;
        const max = Math.min(cap, Math.floor(budget / Math.max(1, price)));
        addRow({
          key: `b:${id}`, it, name: it.name, note: `${it.desc} · ${tx("owned")} ${p.bag.count(id)}`, price: `${formatCoins(price)}`, max,
          label: (n) => (errand ? errandText("add", { n }) : tx("buyN", { n, g: formatCoins(price * n) })),
          act: (n) => (errand ? this.packBuy(id, n) : this.buy(id, n))
        });
      });
    } else {
      const items = this.sellable();
      if (!items.length) el("p", "mk-empty", tx("empty"), list);
      items.forEach(({ s, i: slot, it }) => {
        const left = errand ? s.qty - this.pack.packed(s) : s.qty;
        if (left <= 0) return;
        const each = this.quote(it, 1);
        addRow({
          key: `s:${slot}`, it, name: `${it.name}${left > 1 ? ` ×${left}` : ""}`, note: `${formatCoins(each)} ${tx("each")}`, price: `+${formatCoins(this.quote(it, left))}`, max: left,
          label: (n) => (errand ? errandText("add", { n }) : tx("sellN", { n, g: formatCoins(this.quote(it, n)) })),
          act: (n) => (errand ? this.packSell(s, n) : this.sell(slot, n))
        });
      });
    }

    if (errand) this.renderPack(el, btn);
    if (msg) el("div", "mk-msg", msg);
    el("div", "mk-hint", errand ? errandText("hint") : tx("hint"));
    const sel = list.querySelector(".mk-row.sel");
    if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: "nearest" });
  }

  // The summon's pack: 9 slots (click one to take it back) and the Send button
  renderPack(el, btn) {
    const p = this.player, pack = this.pack;
    el("div", "mk-sub", errandText("pack", { used: pack.used, max: pack.max }));
    const grid = el("div", "mk-pack");
    for (let i = 0; i < pack.max; i++) {
      const s = pack.slots[i];
      const cell = el("button", `mk-cell${s ? (s.sell ? " sell" : " buy") : ""}`, undefined, grid);
      cell.type = "button";
      cell.tabIndex = -1;
      if (!s) continue;
      const it = s.sell ? describe(s.sell) : getItem(s.buy);
      const img = el("img", "mk-icon", undefined, cell);
      img.alt = "";
      img.src = iconURL(it);
      el("span", "mk-qty", `${s.sell ? s.sell.qty : s.qty}`, cell);
      cell.title = it.name;
      cell.addEventListener("mousedown", (e) => e.preventDefault());
      cell.addEventListener("click", (e) => { e.stopPropagation(); pack.remove(i); this.render(); });
    }
    if (!pack.used) { el("div", "mk-hint", errandText("packHint")); return; }
    const r = runnerFor(p);
    const net = pack.proceeds(p) - pack.cost();
    const b = btn(errandText("send", { name: r ? runnerName(r.kind) : "?", s: pack.seconds(), net: `${net >= 0 ? "+" : ""}${formatCoins(net)}` }), () => this.send(), this.root, "wide");
    if (!r || this.errandBudget() < 0) b.classList.add("off");
  }

  handleInput(e) {
    const n = this.rows.length;
    const row = this.rows[this.index];
    if (e.code === "KeyB" || e.code === "Backspace") this.close();
    else if (e.code === "Tab") {
      // Buy → Sell → any extra tab (e.g. the Workshop) → Buy (errands: Buy ↔ Sell)
      const extra = this.mode === "errand" ? [] : this.ctx.tabs || [];
      if (this.tab === "buy") this.tab = "sell";
      else if (this.tab === "sell" && extra.length) { this.close(); extra[0].open(); return e.preventDefault(); }
      else this.tab = "buy";
      this.index = 0;
      this.render();
    }
    else if ((e.code === "ArrowDown" || e.code === "KeyS") && n) { this.index = (this.index + 1) % n; this.render(); }
    else if ((e.code === "ArrowUp" || e.code === "KeyW") && n) { this.index = (this.index - 1 + n) % n; this.render(); }
    else if ((e.code === "ArrowRight" || e.code === "KeyD" || e.code === "ArrowLeft" || e.code === "KeyA") && row) {
      // Slider of the chosen row: ±1, Shift ±10
      const d = (e.code === "ArrowRight" || e.code === "KeyD" ? 1 : -1) * (e.shiftKey ? 10 : 1);
      this.qty[row.key] = Math.max(1, Math.min(Math.max(1, row.max), (this.qty[row.key] || 1) + d));
      this.render();
    }
    else if (e.code === "Enter" && row && row.max >= 1) {
      row.act(e.shiftKey ? row.max : this.qty[row.key] || 1);   // each trade re-renders (and keeps its message)
      if (this.open && this.index >= this.rows.length && this.rows.length) { this.index = this.rows.length - 1; this.render(); }
    }
    else if (e.code === "Space" && this.mode === "errand") this.send();
    e.preventDefault();
  }
}

export const marketText = tx;
