import { getLang } from "./i18n.js";
import { STATS, PRIMARY, STAT_INFO, statCost, STAT_MAX, TREES, treesFor, canLearn, skillText, findSkill } from "./skills.js";

// ==================== CHARACTER (C): STAT BUILDER + SKILL TREE ====================
// Parang Ragnarok Online: dalawang tab.
//   Stats  — STR/AGI/VIT/INT/DEX/LUK na may [+] (tumataas ang gastos), at ang mga resultang katangian.
//   Skills — puno ng Novice at ng job; bawat node ay may level, kinakailangang skill at [+].
// Naka-pause ang laro habang bukas.

const TEXT = {
  en: {
    title: "Character", stats: "Stats", skills: "Skills", points: "Stat points", spoints: "Skill points",
    cost: "cost", derived: "Battle stats", atk: "ATK", def: "DEF", hp: "Max HP", aspd: "Attack speed", crit: "Crit",
    cdr: "Cooldown −", move: "Move", stamina: "Stamina", dmg: "Skill damage", reduce: "Damage taken −",
    primary: "main stat", gear: "from gear & skills", req: "Requires", max: "MAX", learn: "Learn", locked: "Locked",
    novice: "Novice", jobTree: "Job", awaken: "Your job tree unlocks at the Royal Job Awakening (Lv 10).",
    close: "C / Esc — close", pick: "Select a skill."
  },
  fil: {
    title: "Karakter", stats: "Katangian", skills: "Skill", points: "Stat point", spoints: "Skill point",
    cost: "halaga", derived: "Katangian sa laban", atk: "ATK", def: "DEF", hp: "Max HP", aspd: "Bilis ng atake", crit: "Crit",
    cdr: "Cooldown −", move: "Lakad", stamina: "Stamina", dmg: "Pinsala ng skill", reduce: "Natatanggap na pinsala −",
    primary: "pangunahing stat", gear: "mula sa kagamitan at skill", req: "Kailangan", max: "MAX", learn: "Matuto", locked: "Nakakandado",
    novice: "Novice", jobTree: "Job", awaken: "Mabubuksan ang puno ng job sa Royal Job Awakening (Lv 10).",
    close: "C / Esc — isara", pick: "Pumili ng skill."
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
    [["stats", `${T.stats} (${p.statPoints})`], ["skills", `${T.skills} (${p.skillPoints})`]].forEach(([id, label]) => {
      button(tabs, "ch-tab" + (this.tab === id ? " on" : ""), label, () => { this.tab = id; this.render(); });
    });

    if (this.tab === "stats") this.renderStats(el, add, button);
    else this.renderSkills(el, add, button);
    add(el, "div", "ql-foot", T.close);
  }

  renderStats(el, add, button) {
    const p = this.player, T = tx();
    const grid = add(el, "div", "ch-grid");
    const left = add(grid, "div", "ch-col");
    add(left, "div", "inv-head", `${T.points}: ${p.statPoints}`);
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
      TREES[tid].forEach((s) => {
        const lv = p.skillLevels[s.id] || 0;
        const reqOk = Object.entries(s.req || {}).every(([id, need]) => (p.skillLevels[id] || 0) >= need);
        const node = button(grid, "ch-node" + (lv ? " learned" : "") + (reqOk ? "" : " locked") + (this.sel === s.id ? " sel" : ""), "", () => { this.sel = s.id; this.render(); });
        node.style.gridRow = String(s.row + 1);
        node.style.gridColumn = String(s.col + 1);
        add(node, "span", "ch-icon", s.icon);
        add(node, "span", "ch-name", skillText(s).name);
        add(node, "span", "ch-lv", lv >= s.max ? T.max : `${lv}/${s.max}`);
      });
    });

    // Detalye ng napiling skill
    const det = add(el, "div", "inv-detail");
    const s = this.sel && findSkill(this.sel);
    if (!s) { add(det, "div", "inv-dim", T.pick); return; }
    const txt = skillText(s);
    add(det, "div", "inv-name", `${s.icon} ${txt.name}  (${p.skillLevels[s.id] || 0}/${s.max})`);
    add(det, "div", "inv-desc", txt.desc);
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
  }
}
