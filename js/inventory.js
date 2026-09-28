import { getLang } from "./i18n.js";
import { describe, canEquip, upgradeCost, refineChance, SLOTS, slotName, MAX_PLUS, statText, RARITY, GRADE_NAMES, slotsFor } from "./items/itemdb.js";
import { iconURL } from "./items/icons.js";
import { BAG_SIZE } from "./items/bag.js";
import { DUR_MAX, LOW_DUR, durOf, isBroken, repairCost, repair } from "./items/durability.js";

// ==================== INVENTORY (I) ====================
// Kaliwa: itsura ng bayani, suot na kagamitan (5 slot) at stats.
// Kanan: bag (30 slot) at detalye ng napiling item na may mga aksyon:
//   Isuot / Hubarin (equip)   Gamitin (consume)   I-upgrade (sa sanctuary lang: Barracks o kampo)
//   Ibenta (sa sanctuary)     Itapon (hindi puwede ang quest item)
// Ang 2H na sandata ay nagla-lock ng offhand slot (LORE Act V). Naka-pause ang laro habang bukas.

const TEXT = {
  en: {
    title: "Inventory", equip: "Equipment", stats: "Stats", bag: "Bag", buffs: "Active effects", none: "Empty",
    hp: "HP", def: "DEF", spd: "SPD", atk: "ATK", crit: "CRIT", cdr: "CDR", points: "Stat pts", gold: "Gold",
    doEquip: "Equip", doUnequip: "Unequip", doUse: "Use", doUpgrade: "Refine", sortStack: "Sort & Stack", sellAll: "Sell all", doSell: "Sell", doDrop: "Drop", confirm: "Confirm drop?",
    locked: "Locked by 2H weapon", wrongClass: "Not for your class", needSanctuary: "Sell in a sanctuary (Barracks or camp)",
    maxed: "Maximum upgrade", noShards: "Not enough Monster Shards", noCrystals: "Not enough Void Crystals", noGold: "Not enough gold",
    upgraded: "Refine succeeded!", failed: "Refine failed... the materials crumbled (your item is safe).", cost: "Cost",
    type: { equip: "Equipment", consume: "Consumable", material: "Refine material", quest: "Quest item", card: "Card" },
    grade: "Grade", sockets: "Sockets", insert: "Insert into", noSocket: "No equipped item has a free socket.", chance: "success",
    twoHand: "Two-handed", select: "Select an item.",
    belt: "Quick slots: select a consumable, then assign it to 1–4.",
    slot: "Quick slot", autoTitle: "Auto-potion", autoHp: "HP below", off: "Off", autoCure: "Auto-cure blights", autoSt: "Auto-tonic when exhausted",
    close: "I / Esc — close",
    buff: { damage: "Power Boost", atkSpeed: "Rapid Attack", moveSpeed: "High Sprint", invis: "Ghost Stealth" },
    tabs: { equip: "Weapons & Gear", use: "Consumables & Upgrades", quest: "Quest Items" },
    sortBy: "Sort", sorts: { recent: "Recent", rarity: "Rarity", price: "Price" }, stack: "Stack",
    rec: "Recommended", recAll: "Equip recommended", recNote: (slot, d) => `▲ Better than your current ${slot} (+${d} power)`,
    drag: "Drag an item onto your hero or a slot to equip it · drag worn gear back to the bag to unequip.",
    emptyTab: "Nothing here yet.",
    needSmith: "Refining is done by a smith: Captain Ronald (up to +4) or the dwarf smith in Ashfall.",
    smithLimit: (n) => `This smith can only refine up to +${n}.`,
    svcRefine: (who) => `Refine at ${who}`, svcRepair: (who) => `Repair at ${who}`,
    durability: "Durability", broken: "BROKEN — no stats until repaired",
    doRepair: "Repair", repairAll: "Repair all", repaired: "Repaired!", nothingToRepair: "Nothing needs repair."
  },
  fil: {
    title: "Imbentaryo", equip: "Kagamitan", stats: "Katangian", bag: "Bag", buffs: "Aktibong epekto", none: "Wala",
    hp: "HP", def: "DEP", spd: "BLS", atk: "ATK", crit: "CRIT", cdr: "CDR", points: "Stat pts", gold: "Ginto",
    doEquip: "Isuot", doUnequip: "Hubarin", doUse: "Gamitin", doUpgrade: "I-refine", sortStack: "Ayusin at Pagsamahin", sellAll: "Ibenta lahat", doSell: "Ibenta", doDrop: "Itapon", confirm: "Sigurado?",
    locked: "Naka-lock dahil sa 2H", wrongClass: "Hindi para sa iyong class", needSanctuary: "Magbenta sa sanctuary (Barracks o kampo)",
    maxed: "Pinakamataas na upgrade", noShards: "Kulang ang Monster Shard", noCrystals: "Kulang ang Void Crystal", noGold: "Kulang ang ginto",
    upgraded: "Tagumpay ang refine!", failed: "Pumalya ang refine... gumuho ang materyales (ligtas ang item).", cost: "Halaga",
    type: { equip: "Kagamitan", consume: "Nagagamit", material: "Pang-refine", quest: "Quest item", card: "Card" },
    grade: "Grado", sockets: "Socket", insert: "Isingit sa", noSocket: "Walang suot na may bakanteng socket.", chance: "tsansa",
    twoHand: "Dalawang kamay", select: "Pumili ng item.",
    belt: "Mabilisang gamit: pumili ng nagagamit na item at italaga sa 1–4.",
    slot: "Quick slot", autoTitle: "Auto-potion", autoHp: "HP mas mababa sa", off: "Off", autoCure: "Kusang lunas sa sumpa", autoSt: "Kusang tonic kapag pagod",
    close: "I / Esc — isara",
    buff: { damage: "Power Boost", atkSpeed: "Rapid Attack", moveSpeed: "High Sprint", invis: "Ghost Stealth" },
    tabs: { equip: "Sandata at Kagamitan", use: "Gamit at Pang-upgrade", quest: "Quest Item" },
    sortBy: "Ayos", sorts: { recent: "Bago", rarity: "Rarity", price: "Presyo" }, stack: "Pagsamahin",
    rec: "Inirerekomenda", recAll: "Isuot ang inirerekomenda", recNote: (slot, d) => `▲ Mas mahusay kaysa suot mong ${slot} (+${d} lakas)`,
    drag: "I-drag ang item sa bayani o sa slot para isuot · i-drag pabalik sa bag para hubarin.",
    emptyTab: "Wala pang laman.",
    needSmith: "Ang panday ang nagre-refine: si Kapitan Ronald (hanggang +4) o ang dwarf na panday sa Ashfall.",
    smithLimit: (n) => `Hanggang +${n} lang ang kaya ng panday na ito.`,
    svcRefine: (who) => `Mag-refine kay ${who}`, svcRepair: (who) => `Magpaayos kay ${who}`,
    durability: "Tibay", broken: "SIRA — walang stats hangga't hindi naaayos",
    doRepair: "Ayusin", repairAll: "Ayusin lahat", repaired: "Naayos na!", nothingToRepair: "Walang kailangang ayusin."
  }
};

// Bag tabs: which item types each tab shows
const TABS = { equip: ["equip"], use: ["consume", "material", "card"], quest: ["quest"] };
const RARITY_RANK = { normal: 0, magic: 1, rare: 2, unique: 3 };
// How much each stat point is worth when judging whether a piece of gear is an upgrade
const STAT_WEIGHT = { atk: 3, def: 2.5, hp: 0.3, aspd: 2, crit: 2, cdr: 2, spd: 30, str: 2, agi: 2, vit: 2, int: 2, dex: 2, luk: 1.5 };
const power = (it) => (it ? Object.entries(it.stats || {}).reduce((sum, [k, v]) => sum + (STAT_WEIGHT[k] || 1) * v, 0) : 0);
const tx = () => TEXT[getLang()] || TEXT.en;
const BUFF_COLORS = { damage: "#ff3333", atkSpeed: "#ffd166", moveSpeed: "#00f0ff", invis: "#9d4edd" };
const STAT_KEYS = ["atk", "def", "hp", "aspd", "crit", "cdr", "spd", "str", "agi", "vit", "int", "dex", "luk"];

export class InventoryPanel {
  constructor(root) {
    this.el = root;
    this.open = false;
    this.tick = 0;
    this.player = null;
    this.sel = null;          // { kind: "bag", index } | { kind: "slot", slot }
    this.dirty = false;
    this.confirmDrop = false;
    this.msg = "";
    this.ctx = {};            // { inSanctuary(), fx, onDrop(id, qty) }
    this.tab = "equip";       // equip | use | quest
    this.sort = "recent";     // recent | rarity | price
    this.drag = null;         // pointer drag in progress: { from: {kind, index|slot}, x, y, ghost }
    this.suppressClick = false;
    document.addEventListener("pointermove", (e) => this.dragMove(e));
    document.addEventListener("pointerup", (e) => this.dragEnd(e));
  }

  // ---------- RECOMMENDATIONS ----------
  // For each equipment slot, the bag item that beats what is worn there by the widest margin.
  // A two-handed weapon also counts the off-hand it would force off. Returns { bagIndex: gain }.
  recommendations() {
    const p = this.player, bag = p.bag, cls = p.heroData.id;
    const bySlot = {};
    bag.slots.forEach((s, i) => {
      const it = describe(s);
      if (!it || it.type !== "equip" || !canEquip(it, cls)) return;
      if (it.slot === "offhand" && bag.offhandLocked()) return;
      const wornPower = (sl) => (isBroken(bag.equip[sl]) ? 0 : power(bag.equippedItem(sl)));
      const worn = Math.min(...slotsFor(it).map(wornPower));
      let gain = power(it) - worn;
      if (it.slot === "weapon" && it.hands === 2) gain -= wornPower("offhand");
      if (gain > 0.5 && (!bySlot[it.slot] || gain > bySlot[it.slot].gain)) bySlot[it.slot] = { index: i, gain };
    });
    const best = {};
    Object.values(bySlot).forEach(({ index, gain }) => { best[index] = gain; });
    return best;
  }

  equipRecommended() {
    const p = this.player, bag = p.bag;
    // one piece per round: bag indices shift after each equip, so re-evaluate every time
    for (let round = 0; round < 12; round++) {
      const idx = Object.keys(this.recommendations()).map(Number)[0];
      if (idx === undefined || bag.equipFrom(idx, p.heroData.id)) break;   // non-empty string = refused
    }
    this.sel = null;
    p.recalc();
    this.render();
  }

  // Bag indices for the current tab, in the chosen sort order (the bag itself is not reordered)
  visibleIndices() {
    const bag = this.player.bag, types = TABS[this.tab];
    const list = bag.slots.map((s, i) => ({ i, s, it: describe(s) })).filter((x) => x.it && types.includes(x.it.type));
    const rank = (x) => RARITY_RANK[x.it.rarity] || 0;
    const price = (x) => x.it.price || 0;
    if (this.sort === "recent") list.sort((a, b) => (b.s.at || 0) - (a.s.at || 0) || a.i - b.i);
    else if (this.sort === "rarity") list.sort((a, b) => rank(b) - rank(a) || price(b) - price(a) || a.i - b.i);
    else list.sort((a, b) => price(b) - price(a) || rank(b) - rank(a) || a.i - b.i);
    return list.map((x) => x.i);
  }

  // ---------- REPAIR ----------
  // Every worn or bagged equipment instance that has lost durability
  damagedInsts() {
    const bag = this.player.bag;
    return [...SLOTS.map((sl) => bag.equip[sl]), ...bag.slots].filter((inst) => {
      const it = inst && describe(inst);
      return it && it.type === "equip" && durOf(inst) < DUR_MAX;
    });
  }

  repairItems(list) {
    const p = this.player, T = tx(), mult = this.ctx.repairMult || 1;
    const todo = list.filter((inst) => inst && durOf(inst) < DUR_MAX);
    if (!todo.length) { this.msg = T.nothingToRepair; this.render(); return; }
    const cost = todo.reduce((n, inst) => n + repairCost(inst, mult), 0);
    if (p.gold < cost) { this.msg = T.noGold; this.render(); return; }
    p.gold -= cost;
    todo.forEach(repair);
    p.bag.compact();                 // repaired pieces may now stack with identical ones
    this.sel = null;
    this.msg = `${T.repaired} −${cost}G`;
    if (this.ctx.fx && this.ctx.fx.spawnHitSparks) this.ctx.fx.spawnHitSparks(p.x + 10, p.y + 6, "#94a3b8", 14);
    if (this.ctx.onRepair) this.ctx.onRepair(todo.length, cost);
    p.bag.changed(true);
    p.recalc();
    this.render();
  }

  // ---------- DRAG & DROP ----------
  dragStart(e, from) {
    if (e.button !== 0) return;
    this.drag = { from, x: e.clientX, y: e.clientY, ghost: null };
  }

  dragMove(e) {
    const d = this.drag;
    if (!d || !this.open) return;
    if (!d.ghost) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5) return;
      const inst = d.from.kind === "bag" ? this.player.bag.slots[d.from.index] : this.player.bag.equip[d.from.slot];
      const it = inst && describe(inst);
      if (!it) { this.drag = null; return; }
      d.ghost = document.createElement("img");
      d.ghost.className = "inv-ghost";
      d.ghost.src = iconURL(it);
      document.body.appendChild(d.ghost);
      // light up where the item may go
      if (d.from.kind === "bag" && it.type === "equip") {
        slotsFor(it).forEach((sl) => { const t = this.el.querySelector(`.inv-eq[data-slot="${sl}"]`); if (t) t.classList.add("drop-ok"); });
        const pt = this.el.querySelector(".inv-portrait");
        if (pt) pt.classList.add("drop-ok");
      } else if (d.from.kind === "slot") {
        const bagEl = this.el.querySelector(".inv-bag");
        if (bagEl) bagEl.classList.add("drop-ok");
      }
    }
    d.ghost.style.left = `${e.clientX}px`;
    d.ghost.style.top = `${e.clientY}px`;
  }

  dragEnd(e) {
    const d = this.drag;
    this.drag = null;
    if (!d || !d.ghost) return;
    d.ghost.remove();
    this.el.querySelectorAll(".drop-ok").forEach((n) => n.classList.remove("drop-ok"));
    this.suppressClick = true;
    setTimeout(() => { this.suppressClick = false; }, 0);
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || !this.open) return;
    const p = this.player, bag = p.bag, T = tx();
    this.msg = "";
    if (d.from.kind === "bag" && target.closest(".inv-eq, .inv-portrait")) {
      const err = bag.equipFrom(d.from.index, p.heroData.id);
      if (err === "class") this.msg = T.wrongClass;
      else if (err === "locked") this.msg = T.locked;
      this.sel = null;
    } else if (d.from.kind === "slot" && target.closest(".inv-right")) {
      if (bag.unequip(d.from.slot)) this.sel = null;
    }
    p.recalc();
    this.render();
  }

  toggle(player, ctx) {
    if (this.open) this.close();
    else this.show(player, ctx);
  }

  show(player, ctx = {}) {
    this.player = player;
    this.ctx = ctx;
    this.open = true;
    this.sel = null;
    this.msg = "";
    this.render();
    this.el.classList.add("open");
  }

  close() {
    this.open = false;
    this.confirmDrop = false;
    this.el.classList.remove("open");
  }

  update() {
    if (!this.open) return;
    this.tick++;
    if (this.dirty) { this.dirty = false; this.render(); }
    else if (this.tick % 30 === 0) this.renderBuffs();
    this.drawPortrait();
  }

  drawPortrait() {
    const cv = this.el.querySelector(".inv-portrait");
    const avatar = this.player && this.player.heroData.avatar;
    if (!cv || !avatar) return;
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, cv.width, cv.height);
    avatar.draw(c, cv.width / 2, cv.height - 4, "down", "idle", Math.floor(this.tick / 30), false, false, 2);
  }

  // ---------- AKSYON ----------
  selected() {
    const bag = this.player.bag;
    if (!this.sel) return null;
    if (this.sel.kind === "bag") return bag.itemAt(this.sel.index);
    return bag.equippedItem(this.sel.slot);
  }

  selectedInst() {
    if (!this.sel) return null;
    return this.sel.kind === "bag" ? this.player.bag.slots[this.sel.index] : this.player.bag.equip[this.sel.slot];
  }

  select(sel) {
    this.sel = sel;
    this.confirmDrop = false;
    this.msg = "";
    this.render();
  }

  act(action) {
    const p = this.player, bag = p.bag, T = tx();
    const sanctuary = this.ctx.inSanctuary ? this.ctx.inSanctuary() : false;
    const it = this.selected();
    if (!it) return;
    this.msg = "";

    if (action === "equip" && this.sel.kind === "bag") {
      const err = bag.equipFrom(this.sel.index, p.heroData.id);
      if (err === "class") this.msg = T.wrongClass;
      else if (err === "locked") this.msg = T.locked;
      else this.sel = { kind: "slot", slot: SLOTS.find((sl) => bag.equip[sl] && bag.equip[sl].id === it.id) || it.slot };
    } else if (action === "unequip" && this.sel.kind === "slot") {
      if (bag.unequip(this.sel.slot)) this.sel = null;
    } else if (action === "use" && this.sel.kind === "bag") {
      bag.use(this.sel.index, p, this.ctx.fx);
      if (!bag.slots[this.sel.index] || bag.slots[this.sel.index].id !== it.id) this.sel = null;
    } else if (action === "upgrade") {
      const cap = this.ctx.maxPlus ?? MAX_PLUS;
      if (this.ctx.service !== "refine") this.msg = T.needSmith;
      else if (it.plus >= cap) this.msg = T.smithLimit(cap);
      else {
        const where = this.sel.kind === "slot" ? { slot: this.sel.slot } : { index: this.sel.index };
        const r = bag.upgrade(where, p);
        this.msg = r.ok ? (r.success ? T.upgraded : T.failed) : { max: T.maxed, shards: T.noShards, crystals: T.noCrystals, gold: T.noGold }[r.reason] || "";
        if (r.ok && this.ctx.fx && this.ctx.fx.spawnHitSparks) this.ctx.fx.spawnHitSparks(p.x + 10, p.y + 6, r.success ? "#ffd166" : "#64748b", 16);
      }
    } else if (action === "repair") {
      this.repairItems([this.selectedInst()]);
    } else if (action.startsWith("belt:")) {
      p.belt[Number(action.slice(5))] = it.base;
    } else if (action.startsWith("insert:") && this.sel.kind === "bag") {
      bag.insertCard(this.sel.index, action.slice(7));
      this.sel = null;
    } else if (action === "sellall" && this.sel.kind === "bag") {
      if (!sanctuary) this.msg = T.needSanctuary;
      else {
        const s = bag.slots[this.sel.index];
        p.gold += Math.max(1, Math.floor(it.price / 2)) * s.qty;
        bag.removeAt(this.sel.index, s.qty);
        this.sel = null;
      }
    } else if (action === "sell" && this.sel.kind === "bag") {
      if (!sanctuary) this.msg = T.needSanctuary;
      else {
        p.gold += Math.max(1, Math.floor(it.price / 2));
        bag.removeAt(this.sel.index, 1);
        if (!bag.slots[this.sel.index] || bag.slots[this.sel.index].id !== it.id) this.sel = null;
      }
    } else if (action === "drop" && this.sel.kind === "bag") {
      if (!this.confirmDrop) { this.confirmDrop = true; this.render(); return; }
      const s = bag.slots[this.sel.index];
      if (this.ctx.onDrop) this.ctx.onDrop({ ...s });
      bag.removeAt(this.sel.index, s.qty);
      this.sel = null;
    }
    this.confirmDrop = false;
    p.recalc();
    this.render();
  }

  // ---------- RENDER ----------
  render() {
    const p = this.player;
    if (!p) return;
    const T = tx(), bag = p.bag, el = this.el;
    const cls = p.heroData.id;
    el.innerHTML = "";

    const add = (parent, tag, cls2, text) => {
      const n = document.createElement(tag);
      if (cls2) n.className = cls2;
      if (text !== undefined) n.textContent = text;
      parent.appendChild(n);
      return n;
    };
    const button = (parent, cls2, onClick) => {
      const b = add(parent, "button", cls2);
      b.type = "button";
      b.tabIndex = -1;
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("click", onClick);
      return b;
    };

    add(el, "h3", "", T.title);
    add(el, "div", "ql-sub", `${p.heroName || ""} · ${cls === "novice" ? "Novice" : p.heroData.name} · Lv ${p.level}`);
    if (this.ctx.service) {
      const who = this.ctx.serviceName || "";
      add(el, "div", "inv-service", this.ctx.service === "refine" ? T.svcRefine(who) : T.svcRepair(who));
    }

    const grid = add(el, "div", "inv-grid");
    const left = add(grid, "div", "inv-left");
    const cv = add(left, "canvas", "inv-portrait");
    cv.width = 72;
    cv.height = 80;

    // Mga slot ng kagamitan
    add(left, "div", "inv-head", T.equip);
    const eqGrid = add(left, "div", "inv-eqgrid");
    SLOTS.forEach((slot) => {
      const it = bag.equippedItem(slot);
      const locked = slot === "offhand" && bag.offhandLocked();
      const b = button(eqGrid, "inv-eq" + (this.sel && this.sel.kind === "slot" && this.sel.slot === slot ? " sel" : "") + (locked ? " locked" : ""),
        () => it && !this.suppressClick && this.select({ kind: "slot", slot }));
      b.dataset.slot = slot;
      if (it) b.addEventListener("pointerdown", (e) => this.dragStart(e, { kind: "slot", slot }));
      const ic = add(b, "span", "inv-eq-icon", it ? "" : locked ? "🔒" : "·");
      if (it) { const img = add(ic, "img"); img.src = iconURL(it); img.alt = ""; }
      const txt = add(b, "span", "inv-eq-text");
      const inst = bag.equip[slot];
      const dur = inst ? Math.ceil(durOf(inst)) : DUR_MAX;
      const lbl = add(txt, "small", "", it && dur < DUR_MAX ? `${slotName(slot)} · ${isBroken(inst) ? "✖" : `${dur}%`}` : slotName(slot));
      if (it && dur <= LOW_DUR) { lbl.classList.add("inv-dur-low"); b.classList.add(isBroken(inst) ? "broken" : "worn"); }
      const nm = add(txt, "b", "", it ? it.name : locked ? T.locked : T.none);
      if (it) nm.style.color = it.color;
    });

    // Stats
    add(left, "div", "inv-head", T.stats);
    const sg = add(left, "div", "inv-stats");
    [[T.hp, `${Math.ceil(p.hp)}/${p.maxHp}`], [T.atk, `+${p.attack}`], [T.def, p.defense], [T.spd, p.speed.toFixed(2)],
      [T.crit, `${Math.round(p.crit * 100)}%`], [T.cdr, `${Math.round(p.cdr * 100)}%`]].forEach(([k, v]) => {
      const row = add(sg, "div", "inv-row");
      add(row, "span", "inv-k", k);
      add(row, "b", "inv-v", String(v));
    });
    add(left, "div", "inv-gold", `◆ ${p.gold} ${T.gold}`);

    // Bag
    const right = add(grid, "div", "inv-right");
    const bagHead = add(right, "div", "inv-head inv-baghead");
    add(bagHead, "span", "", `${T.bag} (${bag.slots.length}/${BAG_SIZE})`);
    const stackBtn = button(bagHead, "inv-act", () => { bag.compact(); this.sel = null; this.render(); });
    stackBtn.textContent = `⇅ ${T.stack}`;

    // Tabs
    const tabs = add(right, "div", "inv-tabs");
    Object.keys(TABS).forEach((key) => {
      const n = bag.slots.filter((s) => { const d = describe(s); return d && TABS[key].includes(d.type); }).length;
      const b = button(tabs, "inv-tab" + (this.tab === key ? " on" : ""), () => { this.tab = key; this.sel = null; this.render(); });
      b.textContent = `${T.tabs[key]} (${n})`;
    });

    // Sort + "Equip recommended"
    const rec = this.recommendations();
    const tools = add(right, "div", "inv-tools");
    add(tools, "span", "inv-k", `${T.sortBy}:`);
    Object.keys(T.sorts).forEach((key) => {
      const b = button(tools, "inv-act" + (this.sort === key ? " on" : ""), () => { this.sort = key; this.render(); });
      b.textContent = T.sorts[key];
    });
    if (this.ctx.service === "repair") {
      const damaged = this.damagedInsts();
      const total = damaged.reduce((n, inst) => n + repairCost(inst, this.ctx.repairMult || 1), 0);
      const b = button(tools, "inv-act inv-rec-all", () => this.repairItems(damaged));
      b.textContent = damaged.length ? `⚒ ${T.repairAll} (${damaged.length}) · ${total}G` : T.nothingToRepair;
      b.disabled = !damaged.length;
    } else if (this.tab === "equip" && Object.keys(rec).length) {
      const b = button(tools, "inv-act inv-rec-all", () => this.equipRecommended());
      b.textContent = `▲ ${T.recAll} (${Object.keys(rec).length})`;
    }

    // Cells: this tab's items in sort order, then the free bag space
    const cells = add(right, "div", "inv-bag");
    const shown = this.visibleIndices();
    shown.forEach((i) => {
      const s = bag.slots[i], it = describe(s);
      const b = button(cells, "inv-cell" + (this.sel && this.sel.kind === "bag" && this.sel.index === i ? " sel" : ""),
        () => !this.suppressClick && this.select({ kind: "bag", index: i }));
      b.addEventListener("pointerdown", (e) => this.dragStart(e, { kind: "bag", index: i }));
      b.style.borderColor = it.color;
      b.title = it.name;
      const img = add(b, "img", "inv-ico");
      img.src = iconURL(it);
      img.alt = "";
      img.draggable = false;
      if (s.qty > 1) add(b, "span", "inv-qty", String(s.qty));
      if (s.plus) add(b, "span", "inv-plus", `+${s.plus}`);
      if (rec[i]) { add(b, "span", "inv-rec", "▲"); b.title = `${it.name} — ${T.rec}`; }
      if (it.type === "equip" && !canEquip(it, cls)) b.classList.add("unusable");
      if (isBroken(s)) b.classList.add("broken");
    });
    const free = BAG_SIZE - bag.slots.length;
    const pad = Math.max(free, (10 - (shown.length % 10)) % 10);
    for (let k = 0; k < Math.min(pad, free); k++) button(cells, "inv-cell empty", () => {});
    if (!shown.length) add(right, "div", "inv-dim inv-empty-tab", T.emptyTab);

    // Detalye ng napili
    const det = add(right, "div", "inv-detail");
    const it = this.selected();
    if (!it) {
      add(det, "div", "inv-dim", T.select);
      if (this.msg) add(det, "div", "inv-msg", this.msg);
    }
    else {
      const head = add(det, "div", "inv-name");
      const hImg = add(head, "img", "inv-name-ico");
      hImg.src = iconURL(it);
      hImg.alt = "";
      add(head, "span", "", it.name).style.color = it.color;
      const Lg = getLang() === "fil" ? "fil" : "en";
      const meta = it.type === "equip"
        ? `${RARITY[it.rarity][Lg]} · ${slotName(it.slot)}${it.hands === 2 ? ` · ${T.twoHand}` : ""} · ${T.grade} ${GRADE_NAMES[it.grade]}`
        : T.type[it.type];
      add(det, "div", "inv-meta", meta);
      if (it.type === "equip" || it.type === "card") {
        add(det, "div", "inv-statline", STAT_KEYS.filter((k) => it.stats[k]).map((k) => statText(k, it.stats[k])).join("  "));
        if (it.type === "equip" && it.sockets) {
          const inst = this.selectedInst();
          const cards = (inst && inst.cards) || [];
          const sock = [];
          for (let k = 0; k < it.sockets; k++) sock.push(cards[k] ? `■ ${describe({ id: cards[k] }).name}` : "□");
          add(det, "div", "inv-meta", `${T.sockets}: ${sock.join("  ")}`);
        }
        if (it.cls && !canEquip(it, cls)) add(det, "div", "inv-warn", T.wrongClass);
        if (this.sel.kind === "bag" && rec[this.sel.index]) add(det, "div", "inv-recnote", T.recNote(slotName(it.slot), Math.round(rec[this.sel.index])));
        if (it.type === "equip") {
          const inst = this.selectedInst();
          if (isBroken(inst)) add(det, "div", "inv-warn", T.broken);
          else add(det, "div", "inv-meta" + (durOf(inst) <= LOW_DUR ? " inv-dur-low" : ""), `${T.durability} ${Math.ceil(durOf(inst))}/${DUR_MAX}`);
        }
      }
      if (it.desc) add(det, "div", "inv-desc", it.desc);

      const acts = add(det, "div", "inv-acts");
      const actBtn = (label, action, disabled = false) => {
        const b = button(acts, "inv-act", () => !disabled && this.act(action));
        b.textContent = label;
        b.disabled = disabled;
      };
      const inBag = this.sel.kind === "bag";
      if (it.type === "equip") {
        if (inBag) actBtn(T.doEquip, "equip", !canEquip(it, cls));
        else actBtn(T.doUnequip, "unequip");
        const inst = this.selectedInst();
        if (this.ctx.service === "repair" && durOf(inst) < DUR_MAX) actBtn(`⚒ ${T.doRepair} (${repairCost(inst, this.ctx.repairMult || 1)}G)`, "repair");
        if (this.ctx.service === "refine" && it.plus >= (this.ctx.maxPlus ?? MAX_PLUS) && it.plus < MAX_PLUS) add(det, "div", "inv-warn", T.smithLimit(this.ctx.maxPlus));
        if (this.ctx.service === "refine" && it.plus < (this.ctx.maxPlus ?? MAX_PLUS)) {
          const c = upgradeCost(it);
          const ch = Math.round(refineChance(it.plus) * 100);
          actBtn(`${T.doUpgrade} +${it.plus + 1} · ${ch}% ${T.chance} (Phracon ${c.shards}${c.crystals ? ` · Oridecon ${c.crystals}` : ""} · ${c.gold}G)`, "upgrade");
        }
      }
      if (it.type === "consume" && inBag) {
        actBtn(T.doUse, "use");
        // Italaga sa quick slot 1–4
        [0, 1, 2, 3].forEach((k) => actBtn(`${T.slot} ${k + 1}${p.belt[k] === it.base ? " ✔" : ""}`, `belt:${k}`));
      }
      if (it.type === "card" && inBag) {
        const open = bag.openSockets();
        if (!open.length) add(det, "div", "inv-warn", T.noSocket);
        open.forEach((slot) => actBtn(`${T.insert} ${bag.equippedItem(slot).name}`, `insert:${slot}`));
      }
      if (inBag && it.type !== "quest") {
        actBtn(`${T.doSell} (${Math.max(1, Math.floor(it.price / 2))}G)`, "sell");
        const stackQty = bag.slots[this.sel.index] ? bag.slots[this.sel.index].qty : 1;
        if (stackQty > 1) actBtn(`${T.sellAll} ×${stackQty} (${Math.max(1, Math.floor(it.price / 2)) * stackQty}G)`, "sellall");
        actBtn(this.confirmDrop ? T.confirm : T.doDrop, "drop");
      }
      if (this.msg) add(det, "div", "inv-msg", this.msg);
    }

    // Auto-potion: HP threshold (Off/30/50/70%), auto-cure at auto-tonic
    const auto = add(el, "div", "inv-auto");
    add(auto, "span", "inv-k", `${T.autoTitle}:`);
    const a = p.autoPot;
    const hpBtn = button(auto, "inv-act" + (a.hp ? " on" : ""), () => {
      const steps = [0, 30, 50, 70];
      a.hp = steps[(steps.indexOf(a.hp) + 1) % steps.length];
      this.render();
    });
    hpBtn.textContent = `${T.autoHp} ${a.hp ? `${a.hp}%` : T.off}`;
    const cureBtn = button(auto, "inv-act" + (a.cure ? " on" : ""), () => { a.cure = !a.cure; this.render(); });
    cureBtn.textContent = `${a.cure ? "✔" : "✖"} ${T.autoCure}`;
    const stBtn = button(auto, "inv-act" + (a.stamina ? " on" : ""), () => { a.stamina = !a.stamina; this.render(); });
    stBtn.textContent = `${a.stamina ? "✔" : "✖"} ${T.autoSt}`;

    this.buffsEl = add(el, "div", "inv-buffs");
    this.renderBuffs();
    add(el, "div", "inv-note", T.drag);
    add(el, "div", "inv-note", T.belt);
    add(el, "div", "ql-foot", T.close);
    this.drawPortrait();
  }

  renderBuffs() {
    if (!this.buffsEl || !this.player) return;
    const T = tx();
    const active = Object.entries(this.player.buffs || {}).filter(([, v]) => v > 0);
    this.buffsEl.innerHTML = "";
    if (!active.length) return;
    const lbl = document.createElement("span");
    lbl.textContent = `${T.buffs}: `;
    this.buffsEl.appendChild(lbl);
    active.forEach(([k, v]) => {
      const s = document.createElement("b");
      s.textContent = `${T.buff[k] || k} ${Math.ceil(v / 60)}s  `;
      s.style.color = BUFF_COLORS[k] || "";
      this.buffsEl.appendChild(s);
    });
  }
}
