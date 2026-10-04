import { getLang } from "./i18n.js";
import { STATS, PRIMARY, STAT_INFO, statCost, STAT_MAX, TREES, treesFor, canLearn, learnBlock, skillText, findSkill, AUTO_MODES, autoAllocate, autoPathFor } from "./skills.js";
import { PATHS, PATH_IDS, SLOT_KEYS, SKILL_DRAG_TYPE, RESONANCE, styleOf, styleShares, assignSlot, activeCooldown } from "./skillpaths.js";

// ==================== CHARACTER (C): STAT BUILDER + SKILL TREE ====================
// Parang Ragnarok Online: dalawang tab.
//   Stats  — STR/AGI/VIT/INT/DEX/LUK with [+] (costs rise), and the resulting attributes.
//   Skills — the Novice and job trees; each node has a level, a required skill and [+].
//   Paths  — Might (STR) / Finesse (DEX) / Arcana (INT) trees, the play-style meter and the T/Y/U slots.
// Stats also has the auto stat path (spends points on level-up). The game is paused while it is open.

const TEXT = {
  en: {
    title: "Covenant Ledger", stats: "Stats", skills: "Skills", points: "Stat points", spoints: "Skill points",
    cost: "cost", derived: "Battle stats", atk: "ATK", def: "DEF", hp: "Max HP", aspd: "Attack speed", crit: "Crit",
    cdr: "Cooldown −", move: "Move", stamina: "Stamina", dmg: "Skill damage", reduce: "Damage taken −",
    primary: "main stat", gear: "from gear & skills", req: "Requires", max: "MAX", learn: "Learn", locked: "Locked",
    novice: "Novice", jobTree: "Job", awaken: "Your job tree unlocks at the Royal Job Awakening (Lv 10).",
    close: "C / Esc — close", pick: "Select a skill.",
    paths: "Paths", auto: "Auto path", autoModes: { off: "Off", str: "STR", dex: "DEX", int: "INT", style: "My style" },
    autoHint: "Spends stat points on every level-up.", spend: "Spend now", style: "Your style", undecided: "Undecided — keep fighting",
    styleHint: "Up close builds Might, range and crits build Finesse, skills and spells build Arcana. The leading path gets +20% passives and unlocks its capstone.",
    active: "Active", passive: "Passive", summon: "Summon", cd: "Cooldown", slots: "Skill slots", slot: "Set to", clear: "Clear",
    needLv: "Needs Lv", needStyle: "Needs this path as your style", ownSummon: "Your class has its own summon", resonant: "Resonant +20%",
    resetStats: "Reset stats", resetSkills: "Reset skills", confirm: "Click again to confirm"
  },
  fil: {
    title: "Covenant Ledger", stats: "Katangian", skills: "Skill", points: "Stat point", spoints: "Skill point",
    cost: "halaga", derived: "Katangian sa laban", atk: "ATK", def: "DEF", hp: "Max HP", aspd: "Bilis ng atake", crit: "Crit",
    cdr: "Cooldown −", move: "Lakad", stamina: "Stamina", dmg: "Pinsala ng skill", reduce: "Natatanggap na pinsala −",
    primary: "pangunahing stat", gear: "mula sa kagamitan at skill", req: "Kailangan", max: "MAX", learn: "Matuto", locked: "Nakakandado",
    novice: "Novice", jobTree: "Job", awaken: "Mabubuksan ang puno ng job sa Royal Job Awakening (Lv 10).",
    close: "C / Esc — isara", pick: "Pumili ng skill.",
    paths: "Landas", auto: "Auto na landas", autoModes: { off: "Wala", str: "STR", dex: "DEX", int: "INT", style: "Istilo ko" },
    autoHint: "Ginagastos ang stat point sa bawat level-up.", spend: "Gastusin na", style: "Iyong istilo", undecided: "Hindi pa tiyak — lumaban pa",
    styleHint: "Ang malapitang laban ay para sa Lakas, ang malayuan at crit ay sa Liksi, ang skill at spell ay sa Hiwaga. Ang nangungunang landas ay may +20% sa passive at nabubuksan ang capstone.",
    active: "Active", passive: "Passive", summon: "Summon", cd: "Cooldown", slots: "Mga skill slot", slot: "Ilagay sa", clear: "Alisin",
    needLv: "Kailangan ang Lv", needStyle: "Kailangang ito ang iyong istilo", ownSummon: "May sariling summon ang iyong klase", resonant: "Umaalingawngaw +20%",
    resetStats: "I-reset ang stat", resetSkills: "I-reset ang skill", confirm: "I-click ulit para kumpirmahin"
  }
};
const tx = () => TEXT[getLang()] || TEXT.en;
const L = () => (getLang() === "fil" ? "fil" : "en");
const CLASS_NAMES = { knight: "Knight", archer: "Archer", priest: "Priest", mage: "Mage", fighter: "Fighter" };

export class CharacterPanel {
  constructor(root) {
    this.el = root;
    this.open = false;
    this.tab = "stats";
    this.player = null;
    this.sel = null;
  }

  toggle(player) {
    if (this.open) this.close();
    else this.show(player);
  }

  show(player) {
    this.player = player;
    this.open = true;
    this.render();
    this.el.classList.add("open");
  }

  close() {
    this.open = false;
    this.confirmReset = null;
    this.el.classList.remove("open");
  }

  render() {
    const p = this.player;
    if (!p) return;
    const T = tx(), el = this.el;
    el.innerHTML = "";
    const add = (parent, tag, cls, text) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      parent.appendChild(n);
      return n;
    };
    const button = (parent, cls, text, onClick, disabled = false) => {
      const b = add(parent, "button", cls, text);
      b.type = "button";
      b.tabIndex = -1;
      b.disabled = disabled;
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("click", () => { if (!disabled) onClick(); });
      return b;
    };

    add(el, "h3", "", T.title);
    add(el, "div", "ql-sub", `${p.heroName || ""} · ${p.heroData.id === "novice" ? "Novice" : p.heroData.name} · Lv ${p.level}`);
    const tabs = add(el, "div", "ch-tabs");
    [["stats", `${T.stats} (${p.statPoints})`], ["skills", `${T.skills} (${p.skillPoints})`], ["paths", T.paths]].forEach(([id, label]) => {
      button(tabs, "ch-tab" + (this.tab === id ? " on" : ""), label, () => { this.tab = id; this.confirmReset = null; this.render(); });
    });

    if (this.tab === "stats") this.renderStats(el, add, button);
    else if (this.tab === "paths") this.renderPaths(el, add, button);
    else this.renderSkills(el, add, button);
    add(el, "div", "ql-foot", T.close);
  }

  // Free reset, any time: the first click arms it, the second refunds every point
  resetButton(parent, button, kind) {
    const p = this.player, T = tx();
    const armed = this.confirmReset === kind;
    const spent = kind === "stats" ? Object.values(p.stats).some((v) => v > 1) : Object.keys(p.skillLevels).length > 0;
    button(parent, "ch-chip ch-reset" + (armed ? " on" : ""), armed ? T.confirm : (kind === "stats" ? T.resetStats : T.resetSkills), () => {
      if (!armed) { this.confirmReset = kind; this.render(); return; }
      this.confirmReset = null;
      if (kind === "stats") p.resetStats(); else p.resetSkills();
      this.render();
    }, !spent);
  }

  renderStats(el, add, button) {
    const p = this.player, T = tx();
    const grid = add(el, "div", "ch-grid");
    const left = add(grid, "div", "ch-col");
    add(left, "div", "inv-head", `${T.points}: ${p.statPoints}`);
    this.resetButton(left, button, "stats");
    const primary = PRIMARY[p.heroData.id] || "str";
    STATS.forEach((k) => {
      const base = p.stats[k];
      const total = p.totalStat(k);
      const extra = total - base;
      const cost = statCost(base);
      const row = add(left, "div", "ch-stat" + (k === primary ? " primary" : ""));
      row.title = STAT_INFO[k][L()];
      add(row, "b", "ch-k", k.toUpperCase());
      const val = add(row, "span", "ch-v", String(base));
      if (extra) add(val, "em", "", ` +${extra}`);
      add(row, "small", "ch-cost", base >= STAT_MAX ? "" : `${T.cost} ${cost}`);
      button(row, "ch-plus", "+", () => { p.raiseStat(k); this.render(); }, base >= STAT_MAX || p.statPoints < cost);
    });
    add(left, "div", "ch-note", `${primary.toUpperCase()} (${T.primary}) · ${T.gear}: +`);

    // Auto stat path: spends points on level-up; "My style" follows the resonant path
    add(left, "div", "inv-head", T.auto);
    const modes = add(left, "div", "ch-auto");
    AUTO_MODES.forEach((m) => {
      button(modes, "ch-chip" + ((p.autoStat || "off") === m ? " on" : ""), T.autoModes[m], () => {
        p.autoStat = m;
        if (autoAllocate(p)) p.recalc();
        this.render();
      });
    });
    const path = autoPathFor(p);
    const hint = add(left, "div", "ch-note", T.autoHint);
    if (path) hint.textContent += ` → ${PATHS[path].name[L()]}`;
    if (p.autoStat === "off") {
      const row = add(left, "div", "ch-auto");
      PATH_IDS.forEach((k) => button(row, "ch-chip", `${T.spend}: ${k.toUpperCase()}`, () => { if (autoAllocate(p, k)) p.recalc(); this.render(); }, p.statPoints < 2));
    }

    const right = add(grid, "div", "ch-col");
    add(right, "div", "inv-head", T.derived);
    const pct = (v) => `${Math.round(v * 100)}%`;
    [[T.atk, `+${p.attack}`], [T.def, p.defense], [T.hp, p.maxHp], [T.aspd, `+${pct(p.aspd)}`], [T.crit, pct(p.crit)],
      [T.cdr, pct(p.cdr)], [T.move, p.speed.toFixed(2)], [T.stamina, p.maxStamina], [T.dmg, `+${Math.round((p.dmgMult - 1) * 100)}%`],
      [T.reduce, pct(p.dmgReduce)]].forEach(([k, v]) => {
      const row = add(right, "div", "inv-row");
      add(row, "span", "inv-k", k);
      add(row, "b", "inv-v", String(v));
    });
  }

  renderSkills(el, add, button) {
    const p = this.player, T = tx();
    add(el, "div", "inv-head", `${T.spoints}: ${p.skillPoints}`);
    this.resetButton(el, button, "skills");
    const wrap = add(el, "div", "ch-trees");
    const cls = p.heroData.id;
    const trees = cls === "novice" ? ["novice", null] : treesFor(cls);
    trees.forEach((tid) => {
      const col = add(wrap, "div", "ch-tree");
      if (!tid) {
        add(col, "div", "ch-tree-title", T.jobTree);
        add(col, "div", "ch-locked", `🔒 ${T.awaken}`);
        return;
      }
      add(col, "div", "ch-tree-title", tid === "novice" ? T.novice : CLASS_NAMES[tid] || tid);
      const grid = add(col, "div", "ch-nodes");
      TREES[tid].forEach((s) => this.node(grid, add, button, s, !learnBlock(p, s)));
    });
    this.renderDetail(el, add, button);
  }

  // One tree node: icon, name, level and a kind badge (active / passive / summon)
  node(grid, add, button, s, open) {
    const p = this.player, T = tx();
    const lv = p.skillLevels[s.id] || 0;
    const kind = s.kind || (/^(J|K|L):/.test(s.desc.en) ? "active" : "passive");
    const node = button(grid, `ch-node k-${kind}` + (lv ? " learned" : "") + (open || lv ? "" : " locked") + (this.sel === s.id ? " sel" : ""), "", () => { this.sel = s.id; this.render(); });
    node.style.gridRow = String(s.row + 1);
    node.style.gridColumn = String(s.col + 1);
    node.title = `${T[kind]} · ${skillText(s).name}`;
    add(node, "span", "ch-icon", s.icon);
    add(node, "span", "ch-name", skillText(s).name);
    add(node, "span", "ch-lv", lv >= s.max ? T.max : `${lv}/${s.max}`);
    // Learned path actives can be dragged onto a skill slot (or a hotbar that accepts SKILL_DRAG_TYPE)
    if (s.kind === "active" && lv) {
      node.draggable = true;
      node.dataset.skill = s.id;        // the hotbar's pointer drag (controls PR) reads these
      node.dataset.group = "path";
      node.addEventListener("dragstart", (e) => { e.dataTransfer.setData(SKILL_DRAG_TYPE, s.id); e.dataTransfer.setData("text/plain", s.id); });
    }
    return node;
  }

  renderPaths(el, add, button) {
    const p = this.player, T = tx();
    add(el, "div", "inv-head", `${T.spoints}: ${p.skillPoints}`);
    this.resetButton(el, button, "skills");

    // Play-style meter
    const style = styleOf(p), shares = styleShares(p);
    const meter = add(el, "div", "ch-style");
    add(meter, "span", "ch-style-k", `${T.style}: ${style ? `${PATHS[style].icon} ${PATHS[style].name[L()]}` : T.undecided}`);
    const bar = add(meter, "div", "ch-style-bar");
    PATH_IDS.forEach((k) => {
      const seg = add(bar, "span", "", "");
      seg.style.width = `${Math.round(shares[k] * 100)}%`;
      seg.style.background = PATHS[k].color;
      seg.title = `${PATHS[k].name[L()]} ${Math.round(shares[k] * 100)}%`;
    });
    meter.title = T.styleHint;

    const wrap = add(el, "div", "ch-trees three");
    PATH_IDS.forEach((k) => {
      const P = PATHS[k];
      const col = add(wrap, "div", "ch-tree");
      const title = add(col, "div", "ch-tree-title", `${P.icon} ${P.name[L()]} · ${k.toUpperCase()}`);
      title.style.color = P.color;
      if (style === k) add(title, "em", "ch-res", ` ${T.resonant}`);
      const grid = add(col, "div", "ch-nodes");
      TREES[P.tree].forEach((s) => this.node(grid, add, button, s, !learnBlock(p, s)));
    });

    // Skill slots (T / Y / U): drop a learned active here, or pick one in the details below
    add(el, "div", "inv-head", T.slots);
    const slots = add(el, "div", "ch-slots");
    SLOT_KEYS.forEach((code, i) => {
      const id = (p.pathSlots || [])[i];
      const s = id && findSkill(id);
      const slot = button(slots, "ch-slot" + (s ? " full" : ""), "", () => { if (s) { this.sel = id; this.render(); } });
      add(slot, "kbd", "", code.replace("Key", ""));
      add(slot, "span", "ch-icon", s ? s.icon : "·");
      add(slot, "span", "ch-name", s ? skillText(s).name : "—");
      slot.addEventListener("dragover", (e) => e.preventDefault());
      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        if (assignSlot(p, i, e.dataTransfer.getData(SKILL_DRAG_TYPE))) this.render();
      });
    });
    this.renderDetail(el, add, button);
  }

  renderDetail(el, add, button) {
    const p = this.player, T = tx();

    // Details of the selected skill
    const det = add(el, "div", "inv-detail");
    const s = this.sel && findSkill(this.sel);
    if (!s) { add(det, "div", "inv-dim", T.pick); return; }
    const txt = skillText(s);
    add(det, "div", "inv-name", `${s.icon} ${txt.name}  (${p.skillLevels[s.id] || 0}/${s.max})`);
    add(det, "div", "inv-desc", txt.desc);
    if (s.kind === "active") add(det, "div", "inv-meta", `${T.active} · ${T.cd} ${(activeCooldown(p, s) / 60).toFixed(1)} s`);
    if (s.path && styleOf(p) === s.path && s.kind === "passive") add(det, "div", "inv-meta", `${T.resonant} (×${1 + RESONANCE})`);
    const block = learnBlock(p, s);
    if (block === "lv") add(det, "div", "inv-meta", `${T.needLv} ${s.minLv}`);
    else if (block === "style") add(det, "div", "inv-meta", `${T.needStyle}: ${PATHS[s.path].name[L()]}`);
    else if (block === "summon") add(det, "div", "inv-meta", T.ownSummon);
    if (s.req) {
      const reqs = Object.entries(s.req).map(([id, need]) => {
        const r = findSkill(id);
        const ok = (p.skillLevels[id] || 0) >= need;
        return `${ok ? "✔" : "✖"} ${r ? skillText(r).name : id} ${need}`;
      });
      add(det, "div", "inv-meta", `${T.req}: ${reqs.join(" · ")}`);
    }
    const acts = add(det, "div", "inv-acts");
    button(acts, "inv-act", T.learn, () => { p.learnSkill(s.id); this.render(); }, !canLearn(p, s));
    if (s.kind === "active" && p.skillLevels[s.id] > 0) {
      SLOT_KEYS.forEach((code, i) => {
        const on = (p.pathSlots || [])[i] === s.id;
        button(acts, "inv-act" + (on ? " on" : ""), on ? `${T.clear} ${code.replace("Key", "")}` : `${T.slot} ${code.replace("Key", "")}`, () => { assignSlot(p, i, on ? null : s.id); this.render(); });
      });
    }
  }
}
