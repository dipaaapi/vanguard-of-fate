import { getLang } from "./i18n.js";
import { describe, canEquip, upgradeCost, refineChance, SLOTS, slotName, MAX_PLUS, statText, RARITY, GRADE_NAMES } from "./items/itemdb.js";
import { iconURL } from "./items/icons.js";
import { BAG_SIZE } from "./items/bag.js";

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
    locked: "Locked by 2H weapon", wrongClass: "Not for your class", needSanctuary: "Upgrade and sell in a sanctuary (Barracks or camp)",
    maxed: "Maximum upgrade", noShards: "Not enough Monster Shards", noCrystals: "Not enough Void Crystals", noGold: "Not enough gold",
    upgraded: "Refine succeeded!", failed: "Refine failed... the materials crumbled (your item is safe).", cost: "Cost",
    type: { equip: "Equipment", consume: "Consumable", material: "Refine material", quest: "Quest item", card: "Card" },
    grade: "Grade", sockets: "Sockets", insert: "Insert into", noSocket: "No equipped item has a free socket.", chance: "success",
    twoHand: "Two-handed", select: "Select an item.",
    belt: "Quick slots: select a consumable, then assign it to 1–4.",
    slot: "Quick slot", autoTitle: "Auto-potion", autoHp: "HP below", off: "Off", autoCure: "Auto-cure blights", autoSt: "Auto-tonic when exhausted",
    close: "I / Esc — close",
    buff: { damage: "Power Boost", atkSpeed: "Rapid Attack", moveSpeed: "High Sprint", invis: "Ghost Stealth" }
  },
  fil: {
    title: "Imbentaryo", equip: "Kagamitan", stats: "Katangian", bag: "Bag", buffs: "Aktibong epekto", none: "Wala",
    hp: "HP", def: "DEP", spd: "BLS", atk: "ATK", crit: "CRIT", cdr: "CDR", points: "Stat pts", gold: "Ginto",
    doEquip: "Isuot", doUnequip: "Hubarin", doUse: "Gamitin", doUpgrade: "I-refine", sortStack: "Ayusin at Pagsamahin", sellAll: "Ibenta lahat", doSell: "Ibenta", doDrop: "Itapon", confirm: "Sigurado?",
    locked: "Naka-lock dahil sa 2H", wrongClass: "Hindi para sa iyong class", needSanctuary: "Mag-upgrade at magbenta sa sanctuary (Barracks o kampo)",
    maxed: "Pinakamataas na upgrade", noShards: "Kulang ang Monster Shard", noCrystals: "Kulang ang Void Crystal", noGold: "Kulang ang ginto",
    upgraded: "Tagumpay ang refine!", failed: "Pumalya ang refine... gumuho ang materyales (ligtas ang item).", cost: "Halaga",
    type: { equip: "Kagamitan", consume: "Nagagamit", material: "Pang-refine", quest: "Quest item", card: "Card" },
    grade: "Grado", sockets: "Socket", insert: "Isingit sa", noSocket: "Walang suot na may bakanteng socket.", chance: "tsansa",
    twoHand: "Dalawang kamay", select: "Pumili ng item.",
    belt: "Mabilisang gamit: pumili ng nagagamit na item at italaga sa 1–4.",
    slot: "Quick slot", autoTitle: "Auto-potion", autoHp: "HP mas mababa sa", off: "Off", autoCure: "Kusang lunas sa sumpa", autoSt: "Kusang tonic kapag pagod",
    close: "I / Esc — isara",
    buff: { damage: "Power Boost", atkSpeed: "Rapid Attack", moveSpeed: "High Sprint", invis: "Ghost Stealth" }
  }
};
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
      if (!sanctuary) this.msg = T.needSanctuary;
      else {
        const where = this.sel.kind === "slot" ? { slot: this.sel.slot } : { index: this.sel.index };
        const r = bag.upgrade(where, p);
        this.msg = r.ok ? (r.success ? T.upgraded : T.failed) : { max: T.maxed, shards: T.noShards, crystals: T.noCrystals, gold: T.noGold }[r.reason] || "";
        if (r.ok && this.ctx.fx && this.ctx.fx.spawnHitSparks) this.ctx.fx.spawnHitSparks(p.x + 10, p.y + 6, r.success ? "#ffd166" : "#64748b", 16);
      }
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
        () => it && this.select({ kind: "slot", slot }));
      const ic = add(b, "span", "inv-eq-icon", it ? "" : locked ? "🔒" : "·");
      if (it) { const img = add(ic, "img"); img.src = iconURL(it); img.alt = ""; }
      const txt = add(b, "span", "inv-eq-text");
      add(txt, "small", "", slotName(slot));
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
    const sortBtn = button(bagHead, "inv-act", () => { bag.compact(); this.sel = null; this.render(); });
    sortBtn.textContent = `⇅ ${T.sortStack}`;
    const cells = add(right, "div", "inv-bag");
    for (let i = 0; i < BAG_SIZE; i++) {
      const s = bag.slots[i];
      const it = s && describe(s);
      const b = button(cells, "inv-cell" + (this.sel && this.sel.kind === "bag" && this.sel.index === i ? " sel" : "") + (it ? "" : " empty"),
        () => it && this.select({ kind: "bag", index: i }));
      if (!it) continue;
      b.style.borderColor = it.color;
      b.title = it.name;
      const img = add(b, "img", "inv-ico");
      img.src = iconURL(it);
      img.alt = "";
      if (s.qty > 1) add(b, "span", "inv-qty", String(s.qty));
      if (s.plus) add(b, "span", "inv-plus", `+${s.plus}`);
      if (it.type === "equip" && !canEquip(it, cls)) b.classList.add("unusable");
    }

    // Detalye ng napili
    const det = add(right, "div", "inv-detail");
    const it = this.selected();
    if (!it) add(det, "div", "inv-dim", T.select);
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
        if (it.plus < MAX_PLUS) {
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
