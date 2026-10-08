import { Sound } from "../audio.js";
import { t, onLangChange, getLang } from "../i18n.js";
import { Avatar } from "../avatar/avatar.js";
import { FIELDS, DEFAULT_CONFIG, randomConfig, randomName } from "../avatar/options.js";
import { equipJob } from "../classes/job.js";
import { getNovice } from "../classes/novice.js";
import { NPC_DEFS } from "../npc/roster.js";
import { MONSTERS, BOSSES } from "../bestiary.js";
import { FAMILIARS } from "../summons/familiar.js";
import { SPRITE as FALCON } from "../summons/falcon.js";
import { ANGEL } from "../summons/angel.js";
import { TREES } from "../skills.js";
import { iconCanvas } from "../items/icons.js";
import { ITEM_TABS } from "../codex.js";
import { loadLore, parseChapters } from "../lore.js";
import { TurntablePedestal, HEADINGS } from "../ui/turntablePedestal.js";
import { LoreTicker } from "../ui/loreTicker.js";
import { toggleFullscreen } from "../settings.js";

// ==================== CODEX SCENE ====================
// One entity viewer for three jobs:
//   "create" — the Character Creator (Heroes → Your Novice is the customizer; New Expedition begins)
//   "awaken" — the Job Awakening at Lv 10 (Heroes lists the five callings; Awaken confirms)
//   "codex"  — the in-game Codex (N): Heroes, Enemies, Summons, NPCs and Items, read-only
// The entity stands on a turntable (js/ui/turntablePedestal.js) with Idle / Walk / Action stances;
// vertical category tabs sit between the stage and the side panel (list, dossier, lore ticker);
// a control deck runs along the bottom. Earth dossiers and companion text: data/codex_entries.json.

const STANCES = [
  { key: "idle", label: "cxsIdle", ticks: 22, anims: ["idle", "fly"] },
  { key: "walk", label: "cxsWalk", ticks: 7, anims: ["walk", "run", "fly", "idle"] },
  { key: "action", label: "cxsAction", ticks: 6, anims: ["attack", "skill", "taunt", "slash"] }
];
const TABS = {
  create: ["heroes", "enemies", "summons", "npcs"],
  awaken: ["heroes"],
  codex: ["heroes", "enemies", "summons", "npcs", "items"]
};
const TAB_LABEL = { heroes: "cxsTabHeroes", enemies: "cxsTabEnemies", summons: "cxsTabSummons", npcs: "cxsTabNpcs", items: "cxsTabItems" };
const SUMMON_KEYS = ["slime", "hound", "owl", "fox", "falcon", "angel"];

let DATA = { heroes: {}, summons: {} };
fetch("data/codex_entries.json").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) DATA = d; }).catch(() => {});

const lang = () => (getLang() === "fil" ? "fil" : "en");
const tr = (v) => (v && typeof v === "object" ? v[lang()] || v.en : v || "");

export class CodexScene {
  // deps: { codex, roster, getPlayer, getAct, hasSave, onBegin(config, name), onContinue, onSaves,
  //         onSettings, onBack, onAwaken(classDef), onClose }
  constructor(root, deps) {
    this.root = root;
    this.deps = deps;
    this.open = false;
    this.mode = "create";
    this.tab = "heroes";
    this.sel = {};              // tab → entry index
    this.row = 0;               // customizer row
    this.config = { ...DEFAULT_CONFIG };
    this.stance = 0;            // base stance (idle / walk)
    this.action = -1;           // frames into a playing Action, or -1
    this.tick = 0;
    this.clean = false;
    this.sprites = new Map();
    this.chapters = null;
    this.build();
    onLangChange(() => { if (this.open) this.render(); this.chapters = null; });
  }

  // ---------- DOM skeleton (built once) ----------
  build() {
    const r = this.root;
    r.innerHTML = `
      <div class="cxs-bg" aria-hidden="true"></div>
      <div class="cxs-main">
        <div class="cxs-stage">
          <div class="cxs-stances" role="radiogroup"></div>
          <canvas class="cxs-pedestal" aria-label="Turntable" role="img"></canvas>
          <div class="cxs-facing"></div>
        </div>
        <nav class="cxs-tabs" role="tablist"></nav>
        <div class="cxs-side">
          <div class="cxs-list"></div>
          <div class="cxs-dossier"></div>
          <div class="cxs-ticker" aria-label="Chronicle"></div>
        </div>
      </div>
      <p class="cxs-hint"></p>
      <footer class="cxs-deck"></footer>`;
    const $ = (s) => r.querySelector(s);
    this.el = {
      stances: $(".cxs-stances"), canvas: $(".cxs-pedestal"), facing: $(".cxs-facing"), tabs: $(".cxs-tabs"),
      list: $(".cxs-list"), dossier: $(".cxs-dossier"), ticker: $(".cxs-ticker"), hint: $(".cxs-hint"), deck: $(".cxs-deck")
    };
    this.pedestal = new TurntablePedestal(this.el.canvas, { onTurn: () => this.renderFacing() });
    this.ticker = new LoreTicker(this.el.ticker);
    document.addEventListener("fullscreenchange", () => { if (this.open) this.renderDeck(); });
  }

  // ---------- open / close ----------
  // opts: { player } for "awaken" (the classes wear the hero's look)
  show(mode, opts = {}) {
    this.mode = mode;
    this.opts = opts;
    this.open = true;
    this.clean = false;
    this.tab = TABS[mode][0];
    this.sel = {};
    this.action = -1;
    this.sprites.clear();
    if (mode === "create") {
      this.config = { ...DEFAULT_CONFIG };
      this.row = 0;
      this.nameValue = "";
    }
    this.pedestal.setHeading(0);
    this.root.classList.add("open");
    this.root.dataset.mode = mode;
    this.render();
  }

  close() {
    this.open = false;
    this.root.classList.remove("open");
  }

  // ---------- entries per tab ----------
  heroLook() {
    if (this.mode === "create") return this.config;
    const p = this.deps.getPlayer();
    return (p && p.avatarConfig) || DEFAULT_CONFIG;
  }

  entries(tab = this.tab) {
    const codex = this.deps.codex, out = [];
    if (tab === "heroes") {
      const p = this.deps.getPlayer();
      if (this.mode === "create") out.push({ kind: "custom", id: "novice", known: true, name: t("cxsYourNovice") });
      if (this.mode === "codex" && p) out.push({ kind: "player", id: p.heroData.id, known: true, name: p.heroName || p.heroData.name });
      const jc = this.mode === "awaken" && this.opts.jobChange ? this.opts : null;
      this.deps.roster.forEach((def) => {
        // Scroll of Callings: ✓ learned, + can be learned now, 🔒 needs a harder difficulty cleared
        const tag = !jc ? "" : def.id === jc.current ? " ★" : jc.owned.includes(def.id) ? " ✓" : jc.owned.length < jc.allowance ? " +" : " 🔒";
        out.push({ kind: "class", id: def.id, def, known: true, name: def.name + tag });
      });
    } else if (tab === "enemies") {
      out.push(...codex.entries("monsters"));
    } else if (tab === "npcs") {
      out.push(...codex.entries("npc"));
    } else if (tab === "summons") {
      SUMMON_KEYS.forEach((k) => out.push({ kind: "summon", id: k, known: true, name: this.summonName(k) }));
    } else if (tab === "items") {
      ITEM_TABS.forEach((k) => out.push(...codex.entries(k)));
    }
    return out;
  }

  selectable(list) { return list.map((e, i) => (e.header ? -1 : i)).filter((i) => i >= 0); }

  current() {
    const list = this.entries();
    const sel = this.selectable(list);
    let i = this.sel[this.tab];
    if (!sel.includes(i)) i = this.sel[this.tab] = sel[0] ?? 0;
    return list[i];
  }

  summonName(k) {
    if (FAMILIARS[k]) {
      const sk = this.skillDef(FAMILIARS[k].skill);
      return sk ? tr(sk.name) : k;
    }
    return tr((DATA.summons[k] || {}).name) || k;
  }

  skillDef(id) {
    for (const tree of Object.values(TREES)) {
      const s = tree.find((x) => x.id === id);
      if (s) return s;
    }
    return null;
  }

  // ---------- the entity's sprite ----------
  spriteOf(e) {
    if (!e || e.header) return null;
    const key = e.kind === "custom" || e.kind === "class" ? `${e.kind}:${e.id}:${JSON.stringify(this.heroLook())}` : `${e.kind}:${e.id}`;
    if (this.sprites.has(key)) return this.sprites.get(key);
    let s = null;
    if (e.kind === "custom") s = { sprite: new Avatar(this.config), scale: 2.6 };
    else if (e.kind === "class") s = { sprite: equipJob(e.def, this.heroLook()).avatar, scale: 2.6 };
    else if (e.kind === "player") {
      const p = this.deps.getPlayer();
      const def = this.deps.roster.find((d) => d.id === p.heroData.id);
      s = { sprite: def ? equipJob(def, p.avatarConfig).avatar : getNovice(p.avatarConfig).avatar, scale: 2.6 };
    } else if (e.kind === "npc") {
      const d = NPC_DEFS[e.id];
      s = d && { sprite: new Avatar(d.look), scale: 2.6, squash: d.dwarf ? 0.8 : 1 };
    } else if (e.kind === "monster" || e.kind === "boss") {
      const k = (e.kind === "boss" ? BOSSES : MONSTERS)[e.id];
      s = k && { sprite: k.sprite, fit: e.kind === "boss" ? 78 : 56 };
    } else if (e.kind === "summon") {
      const f = FAMILIARS[e.id];
      const sprite = f ? f.sprite : e.id === "falcon" ? FALCON : ANGEL;
      s = e.id === "angel" ? { sprite, scale: 2.6 } : { sprite, fit: 44, fly: Boolean((f && f.fly) || e.id === "falcon") };
    } else if (e.kind === "item" && e.item) {
      s = { icon: iconCanvas(e.item) };
    }
    this.sprites.set(key, s);
    return s;
  }

  // ---------- render (DOM) ----------
  render() {
    this.root.classList.toggle("clean", this.clean);
    this.renderStances();
    this.renderTabs();
    this.renderList();
    this.renderDossier();
    this.renderTicker();
    this.renderFacing();
    this.renderDeck();
    this.el.hint.innerHTML = t(this.mode === "create" ? "cxsHintCreate" : this.mode === "awaken" ? "cxsHintAwaken" : "cxsHint");
  }

  button(parent, cls, text, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.tabIndex = -1;
    b.textContent = text;
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", () => { Sound.init(); onClick(); });
    parent.appendChild(b);
    return b;
  }

  renderStances() {
    const el = this.el.stances;
    el.textContent = "";
    STANCES.forEach((s, i) => {
      const on = this.action >= 0 ? i === 2 : i === this.stance;
      const b = this.button(el, "cxs-stance" + (on ? " on" : ""), t(s.label), () => this.setStance(i));
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(on));
      b.title = String(i + 1);
    });
  }

  renderTabs() {
    const el = this.el.tabs;
    el.textContent = "";
    TABS[this.mode].forEach((k) => {
      const b = this.button(el, "cxs-tab" + (k === this.tab ? " on" : ""), t(TAB_LABEL[k]), () => this.setTab(k));
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(k === this.tab));
    });
  }

  renderList() {
    const el = this.el.list;
    el.textContent = "";
    const list = this.entries();
    const cur = this.current();
    list.forEach((e, i) => {
      if (e.header) { const h = document.createElement("div"); h.className = "cxs-group"; h.textContent = e.header; el.appendChild(h); return; }
      const b = this.button(el, "cxs-entry" + (e === cur ? " sel" : "") + (e.known ? "" : " unknown"), e.known ? e.name : "???", () => this.select(i));
      if (e.kind === "item" && e.item) b.style.color = e.item.color;
    });
    const s = el.querySelector(".sel");
    if (s && s.scrollIntoView) s.scrollIntoView({ block: "nearest" });
  }

  renderDossier() {
    const el = this.el.dossier, e = this.current();
    el.textContent = "";
    const add = (parent, tag, cls, text) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      parent.appendChild(n);
      return n;
    };
    const row = (k, v, cls = "") => { const r = add(el, "div", "cx-row"); add(r, "span", "cx-k", k); add(r, "b", "cx-v " + cls, String(v)); };
    const head = (key) => add(el, "h3", "cxs-head", t(key));
    if (!e) return;

    if (e.kind === "custom") {
      head("cxsDossier");
      const nameRow = add(el, "label", "cxs-name");
      add(nameRow, "span", "cx-k", t("cxsName"));
      const input = add(nameRow, "input");
      input.type = "text";
      input.maxLength = 12;
      input.autocomplete = "off";
      input.spellcheck = false;
      input.placeholder = t("crNamePh");
      input.value = this.nameValue || "";
      input.addEventListener("input", () => { this.nameValue = input.value; });
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === "Escape") { ev.preventDefault(); input.blur(); }
        ev.stopPropagation();
      });
      this.nameEl = input;
      row(t("cxsTitle"), getNovice(this.config).title);
      add(el, "p", "cxs-summoner", t("cxsEarthNote"));
      this.renderCustomizer(add(el, "div", "cxs-rows"));
      const acts = add(el, "div", "cxs-actions");
      this.button(acts, "cxs-btn", `🎲 ${t("crRandom")}`, () => this.randomize()).title = "R";
      add(el, "p", "cxs-summoner", t("summonedBy", this.config.body === "female" ? t("prince") : t("princess")));
      return;
    }
    if (e.kind === "class" || e.kind === "player") {
      const p = e.kind === "player" ? this.deps.getPlayer() : null;
      const def = p ? p.heroData : e.def;
      head("cxsDossier");
      add(el, "div", "cx-name", (p ? p.heroName || def.name : def.name).toUpperCase());
      if (this.mode === "awaken" && this.opts.jobChange) add(el, "p", "cxs-summoner", t("cxsJobSlots", this.opts.owned.length, this.opts.allowance));
      if (def.title) add(el, "div", "cx-meta", def.title);
      add(el, "div", "cxs-sub", t("cxsBase"));
      if (p) {
        row(t("cxsLevel"), p.level);
        row("HP", `${Math.ceil(p.hp)} / ${p.maxHp}`, "c-green");
        row(t("cxsAtk"), p.attack);
        row(t("cxsDef"), p.defense);
        row(t("cxsSpd"), p.speed.toFixed(2));
      } else {
        row("HP", def.maxHp, "c-green");
        row(t("cxsSpd"), def.speed);
        if (def.range) row(t("cxsRange"), def.range);
        if (def.attackCooldown) row(t("cxsAtkInt"), `${(def.attackCooldown / 60).toFixed(2)} s`);
      }
      const d = DATA.heroes[def.id];
      if (d) {
        if (this.mode === "awaken") add(el, "div", "cxs-sub cxs-mentor", t("mentorLabel"));
        else add(el, "div", "cxs-sub", t("cxsDossier"));
        if (d.realName) row(t("cxsRealName"), `"${d.realName}"`, "c-white");
        row(t("cxsOccupation"), tr(d.earthRole));
        row(t("cxsOrigin"), tr(d.origin), "c-gold");
        row(t("cxsCatalyst"), tr(d.catalyst), "c-red");
        row(t("cxsAbility"), tr(d.trait).toUpperCase(), "c-sky");
      }
      return;
    }
    if (e.kind === "summon") {
      head("cxsCompanion");
      add(el, "div", "cx-name", e.name);
      const f = FAMILIARS[e.id];
      if (f) {
        const sk = this.skillDef(f.skill);
        if (sk) add(el, "div", "cx-desc", tr(sk.desc));
      } else {
        const d = DATA.summons[e.id] || {};
        const owner = this.deps.roster.find((r) => r.id === d.owner);
        if (owner) row(t("cxsOwner"), owner.name);
        add(el, "div", "cx-desc", tr(d.desc));
      }
      return;
    }
    head(e.kind === "npc" ? "cxsNpcFile" : e.kind === "monster" || e.kind === "boss" ? "cxsBestiary" : "cxsItemFile");
    this.deps.codex.renderDetail(el, e, add, { portrait: false });
  }

  renderCustomizer(box) {
    FIELDS.forEach((field, i) => {
      const row = document.createElement("div");
      row.className = "cxs-row" + (i === this.row ? " selected" : "");
      row.addEventListener("mouseenter", () => this.setRow(i, false));
      const label = document.createElement("span");
      label.className = "cx-k";
      label.textContent = t(`cr_${field.key}`);
      row.appendChild(label);
      const value = this.config[field.key];
      if (field.type === "cycle") {
        const ctl = document.createElement("div");
        ctl.className = "cxs-cycle";
        this.button(ctl, "", "◀", () => { this.setRow(i, false); this.change(-1); });
        const v = document.createElement("span");
        v.textContent = t(`opt_${value}`);
        ctl.appendChild(v);
        this.button(ctl, "", "▶", () => { this.setRow(i, false); this.change(1); });
        row.appendChild(ctl);
      } else {
        const sw = document.createElement("div");
        sw.className = "cxs-swatches";
        field.options.forEach((col) => {
          const b = this.button(sw, "cxs-swatch" + (col === value ? " on" : ""), "", () => { this.setRow(i, false); this.set(field.key, col); });
          b.style.background = col;
          b.title = col;
        });
        row.appendChild(sw);
      }
      box.appendChild(row);
    });
  }

  renderTicker() {
    const e = this.current();
    const paras = [];
    if (e && e.known) {
      if (e.kind === "class" || e.kind === "custom" || e.kind === "player") {
        const d = DATA.heroes[e.kind === "player" ? this.deps.getPlayer().heroData.id : e.id];
        if (d) paras.push(tr(d.lore));
      } else if (e.kind === "summon" && DATA.summons[e.id]) paras.push(tr(DATA.summons[e.id].desc));
    }
    const shown = (chs) => {
      // Acts up to the current one (Act I–II before a game starts), so later Acts are not spoiled
      const upTo = Math.max(2, this.deps.getAct ? this.deps.getAct() : 1);
      const out = [{ head: t("cxsChronicle") }];
      chs.slice(0, upTo).forEach((c) => { out.push({ head: `${c.tab}: ${c.title}` }); if (c.paragraphs[0]) out.push(c.paragraphs[0]); });
      return out;
    };
    if (this.chapters) this.ticker.setText([...paras, ...shown(this.chapters)]);
    else {
      this.ticker.setText(paras);
      loadLore().then((md) => {
        this.chapters = parseChapters(md);
        if (this.open) this.ticker.setText([...paras, ...shown(this.chapters)]);
      }).catch(() => {});
    }
  }

  renderFacing() {
    this.el.facing.textContent = `${t("cxsFacing")} · ${HEADINGS[this.pedestal.index]}`;
  }

  renderDeck() {
    const el = this.el.deck;
    el.textContent = "";
    const add = (label, fn, cls = "") => this.button(el, "cxs-deckbtn " + cls, label, fn);
    add(this.clean ? t("cxsRestore") : t("cxsClean"), () => this.toggleClean()).title = "H";
    if (this.mode === "create") {
      add(t("cxsNew"), () => this.begin(), "primary").title = "Enter";
      const c = add(t("cxsContinue"), () => this.deps.onContinue());
      c.disabled = !this.deps.hasSave();
      add(t("cxsSaves"), () => this.deps.onSaves());
      add(t("cxsSettings"), () => this.deps.onSettings());
    } else if (this.mode === "awaken") {
      add(t(this.opts.jobChange ? "cxsChangeJob" : "cxsAwaken"), () => this.awaken(), "primary").title = "Enter";
    } else {
      add(t("cxsSettings"), () => this.deps.onSettings());
    }
    add(document.fullscreenElement ? t("crRestore") : t("cxsFull"), () => this.toggleFullscreen()).title = "F";
    if (this.mode !== "awaken" || this.opts.jobChange) {
      const b = add(`${t("cxsBack")}`, () => this.back());
      const k = document.createElement("kbd");
      k.textContent = "Esc";
      b.prepend(k);
    }
  }

  // ---------- actions ----------
  setTab(k) {
    if (!TABS[this.mode].includes(k) || k === this.tab) return;
    this.tab = k;
    this.action = -1;
    if (Sound.playSelectMove) Sound.playSelectMove();
    this.render();
  }

  cycleTab(d) {
    const tabs = TABS[this.mode];
    this.setTab(tabs[(tabs.indexOf(this.tab) + d + tabs.length) % tabs.length]);
  }

  select(i) {
    if (this.sel[this.tab] === i) return;
    this.sel[this.tab] = i;
    this.action = -1;
    if (Sound.playSelectMove) Sound.playSelectMove();
    this.renderList();
    this.renderDossier();
    this.renderTicker();
  }

  moveSelection(d) {
    const sel = this.selectable(this.entries());
    const pos = Math.max(0, sel.indexOf(this.sel[this.tab]));
    const next = sel[Math.max(0, Math.min(sel.length - 1, pos + d))];
    if (next !== undefined) this.select(next);
  }

  setStance(i) {
    if (i === 2) { this.action = 0; }
    else { this.stance = i; this.action = -1; }
    this.tick = 0;
    if (Sound.playSelectMove) Sound.playSelectMove();
    this.renderStances();
  }

  setRow(i, sound = true) {
    if (i === this.row) return;
    this.row = i;
    if (sound && Sound.playSelectMove) Sound.playSelectMove();
    this.el.dossier.querySelectorAll(".cxs-row").forEach((el, k) => el.classList.toggle("selected", k === i));
    const r = this.el.dossier.querySelectorAll(".cxs-row")[i];
    if (r && r.scrollIntoView) r.scrollIntoView({ block: "nearest" });
  }

  set(key, value) {
    if (this.config[key] === value) return;
    this.config = { ...this.config, [key]: value };
    if (Sound.playSelectMove) Sound.playSelectMove();
    this.sprites.clear();
    this.renderDossier();
  }

  change(d) {
    const field = FIELDS[this.row];
    const opts = field.options;
    const i = opts.indexOf(this.config[field.key]);
    this.set(field.key, opts[(i + d + opts.length) % opts.length]);
  }

  randomize() {
    this.config = randomConfig();
    this.nameValue = randomName(this.config.body);
    if (Sound.playSelectConfirm) Sound.playSelectConfirm();
    this.sprites.clear();
    this.renderDossier();
  }

  toggleClean() {
    this.clean = !this.clean;
    this.root.classList.toggle("clean", this.clean);
    this.renderDeck();
  }

  toggleFullscreen() {
    toggleFullscreen();   // js/settings.js (keeps Esc for the game while in full screen)
  }

  begin() {
    if (this.mode !== "create") return;
    if (Sound.playSelectConfirm) Sound.playSelectConfirm();
    this.deps.onBegin({ ...this.config }, (this.nameValue || "").trim().slice(0, 12));
  }

  awaken() {
    const e = this.current();
    if (this.mode !== "awaken" || !e || e.kind !== "class") return;
    if (Sound.playSelectConfirm) Sound.playSelectConfirm();
    this.deps.onAwaken(e.def);
  }

  back() {
    if (Sound.playSelectMove) Sound.playSelectMove();
    if (this.mode === "create") this.deps.onBack();
    else if (this.mode === "codex" || this.opts.jobChange) this.deps.onClose();
  }

  handleInput(e) {
    if (this.nameEl && e.target === this.nameEl) return;
    const c = e.code;
    const custom = this.mode === "create" && this.tab === "heroes" && (this.current() || {}).kind === "custom";
    if (c === "Tab") { e.preventDefault(); this.cycleTab(e.shiftKey ? -1 : 1); }
    else if (c === "KeyQ") this.cycleTab(-1);
    else if (c === "KeyE") this.cycleTab(1);
    // A / ← turn the entity toward the west (S → SW → W), D / → toward the east (S → SE → E)
    else if (c === "KeyA") this.pedestal.step(1);
    else if (c === "KeyD") this.pedestal.step(-1);
    else if (c === "ArrowLeft" || c === "ArrowRight") {
      e.preventDefault();
      const d = c === "ArrowLeft" ? -1 : 1;
      if (custom) this.change(d); else this.pedestal.step(-d);
    } else if (c === "ArrowUp" || c === "ArrowDown" || c === "KeyW" || c === "KeyS") {
      e.preventDefault();
      const d = c === "ArrowUp" || c === "KeyW" ? -1 : 1;
      // On the customizer, ↑ / ↓ walk its rows; past the last row they move on to the class list
      if (custom && this.row + d >= 0 && this.row + d < FIELDS.length) this.setRow(this.row + d);
      else this.moveSelection(d);
    } else if (c === "KeyV" && !e.repeat) this.setStance(this.stance === 0 ? 1 : 0);
    else if ((c === "Digit1" || c === "Digit2" || c === "Digit3") && !e.repeat) this.setStance(Number(c.slice(5)) - 1);
    else if (c === "KeyH" && !e.repeat) this.toggleClean();
    else if (c === "KeyF" && !e.repeat) this.toggleFullscreen();
    else if (c === "KeyR" && !e.repeat && this.mode === "create") this.randomize();
    else if ((c === "Enter" || c === "Space") && !e.repeat) {
      e.preventDefault();
      if (this.mode === "create") this.begin();
      else if (this.mode === "awaken") this.awaken();
    } else if (c === "Escape" || (c === "KeyN" && this.mode === "codex")) this.back();
    // ---- gamepad-only codes (see padKeys) ----
    else if (c === "PadConfirm" && !e.repeat) {
      // A: on the customizer it steps the selected look option; elsewhere it confirms
      if (custom) this.change(1);
      else if (this.mode === "awaken") this.awaken();
    } else if (c === "PadBegin" && !e.repeat) {
      if (this.mode === "create") this.begin();
      else if (this.mode === "awaken") this.awaken();
      else this.back();
    } else if (c === "PadName" && !e.repeat && custom) {
      this.nameValue = randomName(this.config.body);
      if (Sound.playSelectMove) Sound.playSelectMove();
      this.renderDossier();
    } else if (c === "PadStance" && !e.repeat) this.setStance(this.action >= 0 ? 0 : (this.stance + 1) % 3);
  }

  // Gamepad layout while this scene is open (pad button index → key code), used by js/gamepad.js.
  // D-pad / stick: ↑↓ rows and list, ←→ change the option (or turn the entity)
  //   A  step the option / confirm      Menu (Start)  New Expedition / Awaken
  //   X  Random look                    Y  Random name
  //   LB / RB  previous / next tab      LT / RT  turn the entity
  //   LS click  cycle Idle / Walk / Action          RS click  Clean view          B  Back
  padKeys() {
    return {
      0: "PadConfirm", 9: "PadBegin", 2: "KeyR", 3: "PadName",
      4: "KeyQ", 5: "KeyE", 6: "KeyA", 7: "KeyD", 10: "PadStance", 11: "KeyH"
    };
  }

  // ---------- every frame while open ----------
  draw() {
    if (!this.open) return;
    this.tick++;
    this.ticker.update();
    const e = this.current();
    const s = this.spriteOf(e);
    const known = e && e.known;
    this.pedestal.draw((ctx, x, y, dir, flip) => {
      if (!s) return;
      if (s.icon) {
        const k = 3, bob = Math.round(Math.sin(this.tick / 20) * 2);
        ctx.drawImage(s.icon, Math.round(x - (s.icon.width * k) / 2), Math.round(y - 20 - s.icon.height * k + bob), s.icon.width * k, s.icon.height * k);
        return;
      }
      const sp = s.sprite;
      const has = (a, d) => (sp.has ? sp.has(a, d) : true);
      // Diagonal headings snap to the side view; creatures without a front / back fall back to the side
      const d0 = [dir, "side", "down"].find((d) => STANCES[0].anims.some((a) => has(a, d))) || dir;
      let stance = STANCES[this.action >= 0 ? 2 : this.stance];
      let anim = stance.anims.find((a) => has(a, d0));
      if (!anim) { stance = STANCES[0]; anim = stance.anims.find((a) => has(a, d0)) || "idle"; }
      const n = Math.max(1, sp.count ? sp.count(d0, anim) : 2);
      let frame;
      if (this.action >= 0) {
        frame = Math.floor(this.action / stance.ticks);
        this.action++;
        if (frame >= n) { this.action = -1; frame = n - 1; this.renderStances(); }   // blend back to the base stance
      } else frame = Math.floor(this.tick / stance.ticks) % n;
      const lift = s.fly ? 18 + Math.round(Math.sin(this.tick / 14) * 2) : 0;
      ctx.save();
      if (!known) { ctx.filter = "brightness(0)"; ctx.globalAlpha = 0.85; }   // undiscovered: a silhouette
      // Creatures are sized by what is actually drawn (an Aseprite sheet can be much bigger than the
      // code sprite); re-measured once a second until the sheet has loaded
      if (!s.scale && (!s.fitScale || this.tick - s.measuredAt > 60)) { s.fitScale = measureScale(sp, d0, s.fit); s.measuredAt = this.tick; }
      const scale = s.scale || s.fitScale;
      // 10th argument: squash for an Avatar, but rotation for a CreatureSprite (never pass it there)
      if (sp instanceof Avatar) sp.draw(ctx, x, y - lift, d0, anim, frame, flip, false, scale, s.squash || 1);
      else sp.draw(ctx, x, y - lift, d0, anim, frame, flip, false, scale);
      ctx.restore();
    });
  }
}

// A scale that makes a creature about `px` internal pixels tall (or 150 wide) on the turntable:
// its idle frame is drawn once at scale 1 on a scratch canvas and the opaque pixels are measured.
const probe = typeof document !== "undefined" ? document.createElement("canvas") : null;
function measureScale(sprite, dir, px) {
  if (!probe) return 1;
  probe.width = probe.height = 400;
  const c = probe.getContext("2d", { willReadFrequently: true });
  c.clearRect(0, 0, 400, 400);
  try { sprite.draw(c, 200, 300, dir, sprite.has && !sprite.has("idle", dir) ? "fly" : "idle", 0, false, false, 1); } catch (e) { return 1; }
  const d = c.getImageData(0, 0, 400, 400).data;
  let top = 400, bottom = -1, left = 400, right = -1;
  for (let y = 0; y < 400; y++) for (let x = 0; x < 400; x++) {
    if (d[(y * 400 + x) * 4 + 3] < 16) continue;
    if (y < top) top = y; if (y > bottom) bottom = y; if (x < left) left = x; if (x > right) right = x;
  }
  if (bottom < 0) return 1;
  return Math.max(0.25, Math.min(3, px / (bottom - top + 1), 120 / (right - left + 1)));
}
