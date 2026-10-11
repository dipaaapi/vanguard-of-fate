import { guildText as T, guildRoleName, GUILD_RANKS, GUILD_LEVELS, PILLAR_MEMBERS } from "./guilddata.js";
import { guildAssessment, guildContracts, GUILD_REGISTRATION } from "./guild.js";
import { areaName, areaDef } from "./world/areas.js";
import { npcName } from "./dialogue.js";
import { describe } from "./items/itemdb.js";
import { formatCoins } from "./items/economy.js";
import { getLang, onLangChange } from "./i18n.js";
const add = (parent, tag, cls, text) => {
  const e = document.createElement(tag); e.className = cls || "";
  if (text !== undefined) e.textContent = text; parent.appendChild(e); return e;
};
export class GuildPanel {
  constructor(root, book, changed, joined) {
    this.book = book; this.changed = changed; this.joined = joined;
    this.el = add(root, "section", "guild-panel"); this.el.setAttribute("role", "dialog");
    this.el.setAttribute("aria-modal", "true"); this.open = false; this.armed = null;
    this.activeList = add(document.getElementById("hudBar"), "section", "guild-active");
    this.activeList.hidden = true;
    const label = add(this.activeList, "label", "guild-priority");
    this.priority = add(label, "input"); this.priority.type = "checkbox";
    this.priorityLabel = add(label, "span");
    this.priority.addEventListener("change", () => {
      const active=this.player && this.book.state(this.player).active;
      if(active){active.priority=this.priority.checked;this.changed();}
    });
    this.tracker = add(this.activeList, "button", "guild-quest-info"); this.tracker.type = "button";
    this.tracker.addEventListener("click", () => { if (this.player) this.show("guildClerk", this.player, this.ctx); });
    onLangChange(() => { if (this.open) this.render(); this.lastTrack = ""; });
  }
  button(parent, text, action, disabled = false) {
    const b = add(parent, "button", "guild-button", text); b.type = "button"; b.disabled = disabled;
    b.addEventListener("click", action); return b;
  }
  show(staff, player, ctx) {
    this.staff = staff; this.player = player; this.ctx = ctx; this.rank = this.book.state(player).rank;
    this.open = true; this.armed = null; this.message = ""; this.render(); this.el.classList.add("open");
  }
  close() { this.open = false; this.el.classList.remove("open"); }
  act(action) {
    const result = action(); this.message = T(result.error || (result.joined ? "joined" : "ok")); this.armed = null;
    if (!result.error) { this.changed(); if (result.joined) { this.close(); this.joined(result); return; } }
    this.render();
  }
  confirm(key, label, action) {
    this.button(this.content, this.armed === key ? `${T("confirm")} · ${label}` : label, () => {
      if (this.armed !== key) { this.armed = key; this.render(); } else this.act(action);
    });
  }
  objective(c) {
    const name = T(c.t);
    const site = c.t === "scout" ? areaDef(c.area)?.sites?.[c.k]?.name?.[getLang()] : "";
    return `${c.rank} · ${name} ×${c.n} · ${areaName(c.area, getLang())}${site ? ` · ${site}` : ""}`;
  }
  reward(r) {
    return [r.gold ? formatCoins(r.gold) : "", ...["skillPoints", "pathPoints", "statPoints", "exp"].filter(k => r[k]).map(k => `+${r[k]} ${T(k)}`),
      ...(r.items || []).map(i => `${describe(i)?.name || i.id} ×${i.qty || 1}`)].filter(Boolean).join(" · ");
  }
  details(parent, c) {
    if (c.t === "gather") {
      add(parent, "p", "", T("gatherHint", { count: c.n, item: describe(c.item)?.name || c.item, source: T(c.source) }));
      add(parent, "small", "", T(c.source === "npc" ? "npcHint" : c.source === "enemy" ? "enemyHint" : "resourceHint"));
    } else if (c.t === "escort") add(parent, "p", "", T("escortHint", { waves: c.waves }));
    else if (c.t === "mvp") add(parent, "p", "", T("mvpHint"));
  }
  render() {
    const p = this.player, s = this.book.state(p); this.el.replaceChildren();
    const head = add(this.el, "header", "guild-head"); add(head, "h3", "", T("title")); this.button(head, "×", () => this.close());
    add(this.el, "div", "guild-summary", `${npcName(this.staff)} · ${formatCoins(p.gold)}${s.member ? ` · ${T("rank")} ${s.rank} · ${guildRoleName(s.role)}` : ""}`);
    if (this.message) add(this.el, "p", "guild-message", this.message);
    this.content = add(this.el, "div", "guild-content");
    if (!this.book.available(this.ctx.quest)) { add(this.content, "p", "", T("locked")); return; }
    if (this.staff === "guildMaster") this.master(p, s);
    else if (this.staff === "guildRepresentative") this.representative(p, s);
    else if (this.staff === "guildClerk") this.contracts(p, s);
    else { add(this.content, "p", "", T("abilityTypes")); add(this.content, "p", "", T("contractNote")); }
    add(this.content, "h4", "", T("members"));
    const roster = add(this.content, "div", "guild-roster");
    for (const m of PILLAR_MEMBERS) add(roster, "div", "", `${npcName(m.id)} · ${m.rank} · ${guildRoleName(m.role)}`);
    add(this.el, "footer", "", T("close"));
  }
  master(p, s) {
    const a = guildAssessment(p);
    add(this.content, "p", "", `${T("rank")} ${a.rank} · ${guildRoleName(a.role)} · Lv ${p.level}`);
    if (!s.member) {
      add(this.content, "p", "", `${T("fee")}: ${formatCoins(GUILD_REGISTRATION)}`);
      this.confirm("register", `${T("register")} · ${formatCoins(GUILD_REGISTRATION)}`, () => this.book.register(p, this.ctx));
    } else { add(this.content, "p", "", `${T("completed")}: ${s.completed}`); this.button(this.content, T("assess"), () => this.act(() => this.book.reassess(p, this.ctx))); }
    add(this.content, "p", "", T("assessment")); add(this.content, "p", "", T("abilityTypes"));
    const table = add(this.content, "div", "guild-ranks"); GUILD_RANKS.forEach((rank, i) => add(table, "span", rank === s.rank ? "current" : "", `${rank} · Lv ${GUILD_LEVELS[i]}`));
  }
  representative(p, s) {
    add(this.content, "h4", "", T("reset"));
    const price = formatCoins(this.book.resetPrice(p));
    for (const kind of ["stats", "skills", "paths", "all"]) this.confirm(`reset:${kind}`, `${T(({ stats: "resetStats", skills: "resetSkills", paths: "resetPaths", all: "resetAll" })[kind])} · ${price}`, () => this.book.reset(p, this.ctx, kind));
    add(this.content, "p", "", T("resetHint"));
    add(this.content, "h4", "", T("plate")); add(this.content, "p", "", T("plateRule"));
    if (s.member && p.bag.has("guildPlate")) this.confirm("lost", T("lost"), () => this.book.losePlate(p, this.ctx));
    else if (s.member) this.confirm("replace", `${T("replace")} · ${formatCoins(this.book.replacementPrice(p))}`, () => this.book.replacePlate(p, this.ctx));
  }
  contracts(p, s) {
    const a = s.active, c = this.book.objective(p);
    if (c) {
      add(this.content, "h4", "", T("active")); add(this.content, "p", "", `${this.objective(c)} · ${a.have}/${c.n}`);
      if (a.escort) add(this.content, "p", "guild-escort-condition", `${T(a.escort.failed ? "escortFailed" : "guide")} · HP ${Math.ceil(a.escort.hp)} · ${T("defence")} ${Math.ceil(a.escort.defence)}% · ${T("wave")} ${a.escort.wave}/${c.waves} · ${T("route")} ${a.escort.leg}/2`);
      add(this.content, "p", "guild-reward", this.reward(c.reward));
      this.button(this.content, T("claim"), () => this.act(() => this.book.claim(p, this.ctx)), a.have < c.n);
      this.confirm("abandon", T("abandon"), () => this.book.abandon(p, this.ctx));
      this.details(this.content, c);
    } else add(this.content, "p", "", T("empty"));
    add(this.content, "p", "", T("contractNote"));
    const ranks = add(this.content, "div", "guild-ranks");
    GUILD_RANKS.forEach(rank => this.button(ranks, rank, () => { this.rank = rank; this.render(); }));
    for (const q of guildContracts(p.heroData.id).filter(c => c.rank === this.rank)) {
      const row = add(this.content, "article", `guild-contract guild-contract-${q.t}`); add(row, "b", "", this.objective(q)); this.details(row, q); add(row, "p", "guild-reward", `${T("reward")}: ${this.reward(q.reward)}`);
      const rankLocked = GUILD_RANKS.indexOf(q.rank) > GUILD_RANKS.indexOf(s.rank), regionLocked = q.area !== "hub" && !this.ctx.quest.unlocked(q.area), claimed = s.claimed.includes(q.id);
      if (rankLocked || regionLocked) add(row, "small", "", rankLocked ? `${T("rankGate")} ${q.rank}` : T("areaGate"));
      this.button(row, claimed ? T("claimed") : T("accept"), () => this.act(() => this.book.accept(p, this.ctx, q.id)), !s.member || Boolean(a) || claimed || rankLocked || regionLocked);
    }
  }
  update(player, ctx) {
    this.player = player; this.ctx = ctx;
    const a = player && this.book.state(player).active, c = player && this.book.objective(player);
    const text = c ? `${T("board")} · ${this.objective(c)} · ${a.have}/${c.n}` : "";
    if (text !== this.lastTrack) { this.tracker.textContent = text; this.lastTrack = text; }
    this.activeList.hidden = !text;
    this.priority.checked = a?.priority !== false;
    this.priorityLabel.textContent = getLang()==="fil" ? "Unahin sa Auto · Kontrata ng guild" : "Prioritize in Auto · Guild contract";
  }
}
