import { getLang } from "./i18n.js";
import { npcName } from "./dialogue.js";
import { NPC_DEFS } from "./npc/roster.js";
import { MONSTERS, BOSSES, NIGHT_KINDS } from "./bestiary.js";
import { HUB_KINDS } from "./enemy.js";
import { PLATFORMS, PLATFORM_ORDER } from "./world/platforms.js";
import { codexItems, getItem, statText, slotName, SETS, SET_THRESHOLDS, RARITY } from "./items/itemdb.js";
import { iconURL } from "./items/icons.js";
import { elementName, raceName, sizeName, ELEMENTS } from "./elements.js";
import { statusName } from "./status.js";
import { Avatar } from "./avatar/avatar.js";

// ==================== CODEX (N) ====================
// An in-game encyclopedia: NPCs · Monsters & MVPs · Weapons · Equipment · Accessories · Others
// (consumables, upgrade materials, cards, quest items). NPCs are revealed once met and monsters once
// defeated (the rest show as "???", so later Acts are not spoiled); the item lists are a full reference.
// Progress (kills per monster, NPCs met) is saved with the game. The game is paused while it is open.

const L = () => (getLang() === "fil" ? "fil" : "en");
const TEXT = {
  en: {
    title: "Codex", unknown: "???", undiscovered: "Not yet discovered.", kills: "Defeated", habitat: "Habitat",
    element: "Element", race: "Race", size: "Size", hp: "HP", dmg: "Damage", blight: "Inflicts", drop: "Drops", arena: "Lair",
    night: "Night only", role: "Role", where: "Found at", classes: "Classes", any: "Any class", hands2: "Two-handed",
    stats: "Base stats", grows: "Stats grow with grade (Aethelgard → Sovereign) and refining.", price: "Value", setBonus: "Set bonuses",
    pieces: "Pieces: weapon, head, armor, gloves, boots (built for your class)", mvp: "MVP", close: "N / Esc — close · ←/→ tabs · ↑/↓ entries",
    tabs: { npc: "NPCs", monsters: "Monsters & MVP", weapons: "Weapons", equipment: "Equipment", accessories: "Accessories", others: "Others" },
    groups: { consume: "Consumables", material: "Upgrade Materials", card: "Cards", quest: "Quest Items", unique: "Unique", set: "Set", mvp: "MVP Bosses", monsters: "Monsters" }
  },
  fil: {
    title: "Codex", unknown: "???", undiscovered: "Hindi pa natutuklasan.", kills: "Natalo", habitat: "Tirahan",
    element: "Elemento", race: "Lahi", size: "Laki", hp: "HP", dmg: "Pinsala", blight: "Nagdudulot", drop: "Nahuhulog", arena: "Pugad",
    night: "Gabi lamang", role: "Tungkulin", where: "Matatagpuan sa", classes: "Mga class", any: "Kahit anong class", hands2: "Dalawang kamay",
    stats: "Batayang stats", grows: "Lumalaki ang stats ayon sa grado (Aethelgard → Sovereign) at pag-refine.", price: "Halaga", setBonus: "Bonus ng set",
    pieces: "Piyesa: sandata, ulo, baluti, guwantes, bota (ginawa para sa iyong class)", mvp: "MVP", close: "N / Esc — isara · ←/→ tab · ↑/↓ entry",
    tabs: { npc: "Mga NPC", monsters: "Halimaw at MVP", weapons: "Sandata", equipment: "Kagamitan", accessories: "Aksesorya", others: "Iba pa" },
    groups: { consume: "Nagagamit", material: "Pang-upgrade", card: "Card", quest: "Quest Item", unique: "Unique", set: "Set", mvp: "MVP Boss", monsters: "Halimaw" }
  }
};
const tx = () => TEXT[L()];

// NPCs shown in the Codex: role and where to find them
const NPCS = {
  aurelia: { en: ["Crown Princess · your summoner", "Barracks Sanctuary, and at the camp of every campaign platform"], fil: ["Prinsesang Tagapagmana · iyong tagapagtawag", "Barracks Sanctuary, at sa kampo ng bawat platform"] },
  kenneth: { en: ["Crown Prince · your summoner", "Barracks Sanctuary, and at the camp of every campaign platform"], fil: ["Prinsipeng Tagapagmana · iyong tagapagtawag", "Barracks Sanctuary, at sa kampo ng bawat platform"] },
  king: { en: ["King of Aethelgard", "Audience dais of the Imperial Citadel"], fil: ["Hari ng Aethelgard", "Audience dais ng Imperial Citadel"] },
  royalGuard: { en: ["Guards the King", "Audience dais of the Imperial Citadel"], fil: ["Bantay ng Hari", "Audience dais ng Imperial Citadel"] },
  ronald: { en: ["Mercenary Commander · hires mercenaries, refines to +4, field repairs", "Barracks Sanctuary"], fil: ["Kumander ng Mercenary · umuupa ng mercenary, nagre-refine hanggang +4, field repair", "Barracks Sanctuary"] },
  edgar: { en: ["Apothecary · potions and cures", "Barracks Sanctuary"], fil: ["Apothecary · mga potion at lunas", "Barracks Sanctuary"] },
  arthur: { en: ["Earthbound soul · Knight mentor", "Barracks Sanctuary"], fil: ["Kaluluwang taga-Daigdig · mentor ng Knight", "Barracks Sanctuary"] },
  lyra: { en: ["Earthbound soul · Archer mentor", "Barracks Sanctuary"], fil: ["Kaluluwang taga-Daigdig · mentor ng Archer", "Barracks Sanctuary"] },
  julian: { en: ["Earthbound soul · Priest mentor", "Barracks Sanctuary"], fil: ["Kaluluwang taga-Daigdig · mentor ng Priest", "Barracks Sanctuary"] },
  sam: { en: ["Earthbound soul · Mage mentor", "Barracks Sanctuary"], fil: ["Kaluluwang taga-Daigdig · mentor ng Mage", "Barracks Sanctuary"] },
  renzo: { en: ["Earthbound soul · Fighter mentor", "Barracks Sanctuary"], fil: ["Kaluluwang taga-Daigdig · mentor ng Fighter", "Barracks Sanctuary"] },
  brakka: { en: ["Master smith · refines to +10, forges mineral sets, tempers gear", "Emberhold, Ashfall Wastelands"], fil: ["Punong panday · refine hanggang +10, forge ng set, pagpapatibay", "Emberhold, Ashfall Wastelands"] },
  hilde: { en: ["Repairs weapons and armor", "Emberhold, Ashfall Wastelands"], fil: ["Nag-aayos ng sandata at baluti", "Emberhold, Ashfall Wastelands"] },
  durgrim: { en: ["Thane of Emberhold · grants the right to mine", "Emberhold, Ashfall Wastelands"], fil: ["Thane ng Emberhold · nagbibigay ng karapatang magmina", "Emberhold, Ashfall Wastelands"] },
  pip: { en: ["Shopkeeper · materials and potions", "Emberhold, Ashfall Wastelands"], fil: ["Tindero · mga materyales at potion", "Emberhold, Ashfall Wastelands"] }
};

const WEAPON_SLOTS = ["weapon"];
const EQUIP_SLOTS = ["offhand", "head", "armor", "garment", "gloves", "boots"];
const ACC_SLOTS = ["amulet", "ring"];
const TAB_KEYS = ["npc", "monsters", "weapons", "equipment", "accessories", "others"];

export class Codex {
  constructor(root) {
    this.el = root;
    this.open = false;
    this.tab = "npc";
    this.index = 0;
    this.reset();
    this.avatars = {};
  }

  // ---------- progress (saved with the game) ----------
  reset() {
    this.kills = {};             // monster/boss key → times defeated
    this.met = new Set();        // NPC ids met
  }

  serialize() {
    return { k: { ...this.kills }, n: [...this.met] };
  }

  load(data) {
    this.reset();
    if (!data) return;
    Object.entries(data.k || {}).forEach(([k, v]) => { if (MONSTERS[k] || BOSSES[k]) this.kills[k] = v | 0; });
    (data.n || []).forEach((id) => { if (NPCS[id]) this.met.add(id); });
  }

  recordKill(key) { this.kills[key] = (this.kills[key] || 0) + 1; }
  meet(id) { if (NPCS[id]) this.met.add(id); }

  // ---------- entries per tab ----------
  entries() {
    const T = tx(), out = [];
    const head = (label) => out.push({ header: label });
    if (this.tab === "npc") {
      Object.keys(NPCS).forEach((id) => out.push({ kind: "npc", id, known: this.met.has(id), name: npcName(id) }));
    } else if (this.tab === "monsters") {
      head(T.groups.mvp);
      Object.keys(BOSSES).forEach((id) => out.push({ kind: "boss", id, known: Boolean(this.kills[id]), name: BOSSES[id].name[L()] }));
      head(T.groups.monsters);
      Object.keys(MONSTERS).forEach((id) => out.push({ kind: "monster", id, known: Boolean(this.kills[id]), name: MONSTERS[id].name[L()] }));
    } else {
      const items = codexItems();
      const slots = { weapons: WEAPON_SLOTS, equipment: EQUIP_SLOTS, accessories: ACC_SLOTS }[this.tab];
      if (slots) {
        slots.forEach((slot) => {
          const list = items.equip.filter((it) => it.slot === slot);
          if (!list.length) return;
          head(slotName(slot));
          list.forEach((it) => out.push({ kind: "item", item: it, known: true, name: it.name }));
        });
        const uniq = items.uniques.filter((it) => slots.includes(it.slot));
        if (uniq.length) { head(T.groups.unique); uniq.forEach((it) => out.push({ kind: "item", item: it, known: true, name: it.name })); }
        if (this.tab !== "accessories") { head(T.groups.set); items.sets.forEach((id) => out.push({ kind: "set", id, known: true, name: SETS[id].name[L()] })); }
      } else {
        ["consume", "material", "quest"].forEach((type) => {
          head(T.groups[type]);
          items.other.filter((it) => it.type === type).forEach((it) => out.push({ kind: "item", item: it, known: true, name: it.name }));
          if (type === "material") { head(T.groups.card); items.cards.forEach((it) => out.push({ kind: "item", item: it, known: true, name: it.name })); }
        });
      }
    }
    return out;
  }

  selectable(list) { return list.map((e, i) => (e.header ? -1 : i)).filter((i) => i >= 0); }

  // ---------- open / input ----------
  toggle() { if (this.open) this.close(); else this.show(); }
  show() { this.open = true; this.el.classList.add("open"); this.index = 0; this.render(); }
  close() { this.open = false; this.el.classList.remove("open"); }

  setTab(tab) { this.tab = tab; this.index = 0; this.render(); }

  handleInput(e) {
    const c = e.code;
    e.preventDefault();
    if (c === "Escape" || c === "KeyN") this.close();
    else if (c === "ArrowLeft" || c === "ArrowRight") {
      const k = TAB_KEYS.indexOf(this.tab) + (c === "ArrowLeft" ? -1 : 1);
      this.setTab(TAB_KEYS[(k + TAB_KEYS.length) % TAB_KEYS.length]);
    } else if (c === "ArrowUp" || c === "ArrowDown" || c === "KeyW" || c === "KeyS") {
      const sel = this.selectable(this.entries()), pos = Math.max(0, sel.indexOf(this.index));
      const next = sel[Math.max(0, Math.min(sel.length - 1, pos + (c === "ArrowUp" || c === "KeyW" ? -1 : 1)))];
      if (next !== undefined) { this.index = next; this.render(); }
    }
  }

  // ---------- render ----------
  render() {
    const T = tx(), el = this.el;
    el.innerHTML = "";
    const add = (parent, tag, cls, text) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      parent.appendChild(n);
      return n;
    };
    add(el, "h3", "", T.title);
    const tabs = add(el, "div", "cx-tabs");
    TAB_KEYS.forEach((k) => {
      const b = add(tabs, "button", "cx-tab" + (this.tab === k ? " on" : ""), T.tabs[k]);
      b.type = "button";
      b.tabIndex = -1;
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("click", () => this.setTab(k));
    });

    const list = this.entries();
    const sel = this.selectable(list);
    if (!sel.includes(this.index)) this.index = sel[0] ?? 0;
    const known = list.filter((e) => !e.header && e.known).length, total = list.filter((e) => !e.header).length;

    const body = add(el, "div", "cx-body");
    const ul = add(body, "div", "cx-list");
    add(ul, "div", "cx-count", `${known}/${total}`);
    list.forEach((e, i) => {
      if (e.header) { add(ul, "div", "cx-group", e.header); return; }
      const b = add(ul, "button", "cx-entry" + (i === this.index ? " sel" : "") + (e.known ? "" : " unknown"));
      b.type = "button";
      b.tabIndex = -1;
      b.addEventListener("mousedown", (ev) => ev.preventDefault());
      b.addEventListener("click", () => { this.index = i; this.render(); });
      if (e.kind === "item" && e.item) { const img = add(b, "img", "cx-ico"); img.src = iconURL(e.item); img.alt = ""; }
      const nm = add(b, "span", "", e.known ? e.name : T.unknown);
      if (e.kind === "item" && e.item) nm.style.color = e.item.color;
      if (e.kind === "set") nm.style.color = SETS[e.id].color;
    });
    const det = add(body, "div", "cx-detail");
    this.renderDetail(det, list[this.index], add);
    add(el, "div", "ql-foot", T.close);
    const selEl = ul.querySelector(".sel");
    if (selEl) selEl.scrollIntoView({ block: "nearest" });
  }

  portrait(parent, add, draw) {
    const cv = add(parent, "canvas", "cx-portrait");
    cv.width = 72;
    cv.height = 72;
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    draw(c, cv.width, cv.height);
  }

  renderDetail(det, e, add) {
    const T = tx(), Lg = L();
    if (!e || e.header) return;
    const row = (k, v) => { const r = add(det, "div", "cx-row"); add(r, "span", "cx-k", k); add(r, "b", "cx-v", v); };
    if (!e.known) {
      this.portrait(det, add, (c, w, h) => { c.fillStyle = "#1e293b"; c.font = "bold 36px monospace"; c.textAlign = "center"; c.fillText("?", w / 2, h / 2 + 12); });
      add(det, "div", "cx-name", T.unknown);
      add(det, "div", "cx-desc", T.undiscovered);
      return;
    }
    if (e.kind === "npc") {
      const av = this.avatars[e.id] || (this.avatars[e.id] = new Avatar(NPC_DEFS[e.id].look));
      const squash = NPC_DEFS[e.id].dwarf ? 0.8 : 1;
      this.portrait(det, add, (c, w, h) => av.draw(c, w / 2, h - 4, "down", "idle", 0, false, false, 1.8, squash));
      add(det, "div", "cx-name", e.name);
      row(T.role, NPCS[e.id][Lg][0]);
      row(T.where, NPCS[e.id][Lg][1]);
    } else if (e.kind === "monster" || e.kind === "boss") {
      const k = e.kind === "boss" ? BOSSES[e.id] : MONSTERS[e.id];
      this.portrait(det, add, (c, w, h) => k.sprite.draw(c, w / 2, h - 6, "down", "idle", 0, false, false, e.kind === "boss" ? 1 : 1.6));
      add(det, "div", "cx-name" + (e.kind === "boss" ? " mvp" : ""), `${e.kind === "boss" ? `${T.mvp} · ` : ""}${e.name}`);
      const el = k.element || "neutral";
      row(T.element, `${(ELEMENTS[el] || {}).icon || ""} ${elementName(el)}`);
      if (k.race) row(T.race, raceName(k.race));
      if (k.size) row(T.size, sizeName(k.size));
      row(T.hp, `×${e.kind === "boss" ? k.hpBase : k.hpMult}`);
      row(T.dmg, String(k.dmg));
      if (k.debuff) row(T.blight, k.debuff.type === "all" ? "★" : `${statusName(k.debuff.type)} (${Math.round(k.debuff.chance * 100)}%)`);
      if (e.kind === "boss") {
        const plat = PLATFORM_ORDER.map((id) => PLATFORMS[id]).find((p) => p.boss === e.id);
        if (plat) row(T.arena, `Act ${plat.act} · ${plat.arenaName[Lg]}`);
        if (k.drop) row(T.drop, getItem(k.drop).name);
      } else {
        const where = PLATFORM_ORDER.filter((id) => PLATFORMS[id].monsters.includes(e.id)).map((id) => PLATFORMS[id].name[Lg]);
        if (HUB_KINDS.includes(e.id)) where.unshift("Aethelgard");
        if (NIGHT_KINDS.includes(e.id)) where.push(`Aethelgard (${T.night})`);
        row(T.habitat, where.join(" · ") || "—");
      }
      row(T.kills, String(this.kills[e.id] || 0));
    } else if (e.kind === "set") {
      const set = SETS[e.id];
      add(det, "div", "cx-name", set.name[Lg]).style.color = set.color;
      add(det, "div", "cx-desc", T.pieces);
      row(T.stats, Object.entries(set.piece).map(([s, v]) => statText(s, v)).join("  "));
      add(det, "div", "cx-sub", T.setBonus);
      SET_THRESHOLDS.forEach((n) => row(`(${n})`, `${n === 5 ? `${set.passive[Lg]}: ` : ""}${Object.entries(set.bonus[n]).map(([s, v]) => statText(s, v)).join("  ")}`));
    } else {
      const it = e.item;
      this.portrait(det, add, (c, w, h) => { const img = new Image(); img.onload = () => c.drawImage(img, 12, 12, w - 24, h - 24); img.src = iconURL(it); });
      add(det, "div", "cx-name", it.name).style.color = it.color;
      if (it.type === "equip") {
        add(det, "div", "cx-meta", `${RARITY[it.rarity][Lg]} · ${slotName(it.slot)}${it.hands === 2 ? ` · ${T.hands2}` : ""}`);
        row(T.classes, it.cls ? it.cls.map((k) => k[0].toUpperCase() + k.slice(1)).join(", ") : T.any);
        row(T.stats, Object.entries(it.stats).map(([s, v]) => statText(s, v)).join("  "));
        add(det, "div", "cx-desc", T.grows);
      } else {
        if (it.type === "card") row(T.stats, Object.entries(it.stats).map(([s, v]) => statText(s, v)).join("  "));
        if (it.desc) add(det, "div", "cx-desc", it.desc);
      }
      if (it.price) row(T.price, `${it.price}G`);
    }
  }
}
