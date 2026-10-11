import { GUILD_RANKS, GUILD_LEVELS, GUILD_AREAS, GUILD_NPCS } from "./guilddata.js";
import { areaDef } from "./world/areas.js";
import { CLASS_KIT, describe } from "./items/itemdb.js";
import { Bag } from "./items/bag.js";
import { findSkill } from "./skills.js";

export const GUILD_REGISTRATION = 200; // Gold units: 2 platinum, first plate included.
export const guildState = () => ({ member: false, rank: "G", role: "frontliner", platePrice: GUILD_REGISTRATION, completed: 0, claimed: [], active: null });
export function guildAssessment(p) {
  const skills = Object.entries(p.skillLevels || {});
  const learned = skills.reduce((n, [, lv]) => n + lv, 0);
  const allocated = Object.values(p.stats).reduce((n, v) => n + v - 1, 0);
  const readiness = Math.min(1, (learned + allocated / 3) / Math.max(1, p.level * 2));
  const effectiveLevel = Math.floor(p.level * (.75 + .25 * readiness));
  let index = 0;
  GUILD_LEVELS.forEach((lv, i) => { if (effectiveLevel >= lv) index = i; });
  const cls = p.heroData.id;
  let role = ({ knight: "frontliner", archer: "rear", priest: "support", mage: "dd", fighter: "dd" })[cls] || "frontliner";
  // A developed control/summoning build can specialize independently of its starting class.
  const control = skills.reduce((n, [id, lv]) => n + (/frost|glacial|stun|bind|drain|curse|petpal/.test(id) ? lv : 0), 0);
  if (control >= 8 && (p.stats.int || 1) >= 15) role = "inflictionist";
  return { rank: GUILD_RANKS[index], role, effectiveLevel, readiness };
}
export function guildContracts(cls = "knight") {
  const weapon = CLASS_KIT[cls]?.weapon || "broadsword";
  const caster = ["mage", "priest"].includes(cls);
  return GUILD_RANKS.flatMap((rank, i) => Array.from({ length: 9 }, (_, j) => {
    const grade = Math.min(12, i + 1), area = GUILD_AREAS[i];
    const t = j === 1 ? "champion" : j === 8 ? "mvp" : j >= 3 && j <= 6 ? "gather" : j === 7 ? "escort" : "cull";
    const source = ({ 3: "enemy", 4: "herb", 5: "stone", 6: "npc" })[j];
    const item = ({ 3: "beastCore", 4: "herb", 5: "ironOre", 6: "salve" })[j];
    const reward = j === 0 ? { gold: 50 * (i + 1) ** 2 }
      : j === 1 ? { gold: 30 * (i + 1), items: [{ id: "salve", qty: 3 + i }, { id: "panacea", qty: 1 }] }
      : j === 2 ? { skillPoints: 1 + Math.floor(i / 3) }
      : j === 3 ? { pathPoints: 1 + Math.floor(i / 3) }
      : j === 4 ? { statPoints: 3 + i }
      : j === 5 ? { exp: 200 * (i + 1) ** 2 }
      : j === 6 ? { gold: 40 * (i + 1), items: [weapon, caster ? "robe" : "mail", caster ? "wizhat" : "helm", "boots"].map(base => ({ id: `${base}@${grade}`, qty: 1, set: "meridian" })) }
      : j === 7 ? { gold: 60 * (i + 1), items: [{ id: `ring@${grade}`, qty: 1, rarity: i >= 7 ? "legendary" : "epic" }, { id: `brooch@${grade}`, qty: 1, rarity: "epic" }] }
      : { items: [{ id: `${weapon}@${grade}`, qty: 1, rarity: i >= 8 ? "mythical" : i >= 5 ? "legendary" : "epic" }] };
    return { id: `${rank}:${j}`, rank, area, t, source, item, npc: "guildScout", k: 0, waves: 2 + Math.floor(i / 3), n: ["escort", "mvp"].includes(t) ? 1 : t === "champion" ? 2 + Math.floor(i / 2) : 4 + i * 2 + j, reward };
  }));
}
export class GuildBook {
  constructor() { this.onReady = null; }
  state(p) { return p.guild ||= guildState(); }
  // Opens with Act V: registering is the main quest's first task after the Job Awakening
  available(quest) { return Boolean(quest && (quest.step >= 5 || quest.unlocked("canopy"))); }
  at(p, ctx, npc) {
    const n = GUILD_NPCS[npc];
    return this.available(ctx.quest) && ctx.stage.id === "hub" && Math.hypot(p.x + 10 - n.x, p.y + 10 - n.y) < 60;
  }
  access(p, ctx, npc, member = true) {
    if (!this.available(ctx.quest)) return "locked";
    if (!this.at(p, ctx, npc)) return "nearby";
    if (member && !this.state(p).member) return "notMember";
    if (member && !p.bag.has("guildPlate")) return "noPlate";
    return null;
  }
  register(p, ctx) {
    const error = this.access(p, ctx, "guildMaster", false); if (error) return { error };
    const s = this.state(p); if (s.member) return { error: "busy" };
    if (p.gold < GUILD_REGISTRATION) return { error: "funds" };
    if (!p.bag.add("guildPlate")) return { error: "full" };
    const assessment = guildAssessment(p);
    Object.assign(s, { rank: assessment.rank, role: assessment.role, member: true, platePrice: GUILD_REGISTRATION });
    p.gold = Math.round((p.gold - GUILD_REGISTRATION) * 10000) / 10000;
    return { joined: true, rank: s.rank, role: s.role };
  }
  reassess(p, ctx) {
    const error = this.access(p, ctx, "guildMaster"); if (error) return { error };
    const s = this.state(p), a = guildAssessment(p);
    const index = Math.max(GUILD_RANKS.indexOf(s.rank), Math.min(GUILD_RANKS.indexOf(a.rank), Math.floor(s.completed / 2)));
    s.rank = GUILD_RANKS[index]; s.role = a.role;
    return { rank: s.rank, role: s.role };
  }
  replacementPrice(p) { return Math.min(Number.MAX_SAFE_INTEGER, this.state(p).platePrice * 2); }
  replacePlate(p, ctx) {
    const error = this.access(p, ctx, "guildRepresentative", false); if (error) return { error };
    const s = this.state(p); if (!s.member) return { error: "notMember" };
    if (p.bag.has("guildPlate")) return { error: "busy" };
    const cost = this.replacementPrice(p); if (p.gold < cost) return { error: "funds" };
    if (!p.bag.add("guildPlate")) return { error: "full" };
    p.gold = Math.round((p.gold - cost) * 10000) / 10000; s.platePrice = cost;
    return { cost };
  }
  losePlate(p, ctx) {
    const error = this.access(p, ctx, "guildRepresentative"); if (error) return { error };
    p.bag.take("guildPlate", p.bag.count("guildPlate")); return {};
  }
  resetPrice(p) { return this.state(p).member && this.state(p).active ? 50 : 100; }
  reset(p, ctx, kind) {
    const error = this.access(p, ctx, "guildRepresentative", false); if (error) return { error };
    if (!["stats", "skills", "paths", "all"].includes(kind)) return { error: "unavailable" };
    const spent = Object.values(p.stats).some(v => v > 1) && ["all", "stats"].includes(kind) || Object.entries(p.skillLevels).some(([id, lv]) => lv > 0 && (kind === "all" || kind === (findSkill(id)?.path ? "paths" : "skills")));
    if (!spent) return { error: "noChange" };
    const cost = this.resetPrice(p); if (p.gold < cost) return { error: "funds" };
    p.gold = Math.round((p.gold - cost) * 10000) / 10000;
    if (kind === "stats" || kind === "all") p.resetStats();
    if (kind !== "stats") p.resetSkills(kind === "all" ? "all" : kind);
    return { cost };
  }
  contract(p, id) { return guildContracts(p.heroData.id).find(c => c.id === id); }
  accept(p, ctx, id) {
    const error = this.access(p, ctx, "guildClerk"); if (error) return { error };
    const s = this.state(p), c = this.contract(p, id);
    if (s.active) return { error: "busy" };
    if (!c || s.claimed.includes(id) || GUILD_RANKS.indexOf(c.rank) > GUILD_RANKS.indexOf(s.rank) || c.area !== "hub" && !ctx.quest.unlocked(c.area)) return { error: "unavailable" };
    s.active = { id, have: 0, cls: p.heroData.id, priority: true }; return {};
  }
  abandon(p, ctx) {
    const error = this.access(p, ctx, "guildClerk"); if (error) return { error };
    this.state(p).active = null; return {};
  }
  objective(p) { const a = this.state(p).active; return a && guildContracts(a.cls).find(c => c.id === a.id); }
  progress(p, area, enemy = null, position = null) {
    const a = this.state(p).active, c = this.objective(p); if (!c || c.area !== area || a.have >= c.n) return false;
    let hit = enemy && enemy.minionOf !== "summon" && (c.t === "mvp" ? enemy.boss || enemy.guildMvp : !enemy.boss && !enemy.guildMvp && (c.t === "cull" ? !enemy.elite && !enemy.champion : c.t === "champion" && (enemy.champion || enemy.elite)));
    if (c.t === "scout" && position) {
      const site = areaDef(area)?.sites?.[c.k];
      hit = site && Math.hypot(position.x - site.x, position.y - site.y) < 40;
    }
    if (!hit) return false;
    a.have = Math.min(c.n, a.have + 1);
    if (a.have === c.n && this.onReady) this.onReady();
    return true;
  }
  collect(p, area, item, source, qty = 1) {
    const a = this.state(p).active, c = this.objective(p);
    if (!c || c.t !== "gather" || c.area !== area || c.item !== item || c.source !== source || a.have >= c.n) return false;
    a.have = Math.min(c.n, a.have + qty);
    if (a.have === c.n) this.onReady?.();
    return true;
  }
  claim(p, ctx) {
    const error = this.access(p, ctx, "guildClerk"); if (error) return { error };
    const s = this.state(p), a = s.active, c = this.objective(p);
    if (!c || a.have < c.n) return { error: "unfinished" };
    if (c.t === "gather" && p.bag.count(c.item) < c.n) return { error: "unfinished" };
    // Preflight the complete item bundle against the real stack rules. Rewards are atomic.
    const preview = new Bag(); preview.load(p.bag.serialize());
    if (c.t === "gather") preview.take(c.item, c.n);
    for (const item of c.reward.items || []) if (!describe(item) || !preview.add(item)) return { error: "full" };
    p.bag.slots = preview.slots; p.bag.changed();
    p.gold = Math.round((p.gold + (c.reward.gold || 0)) * 10000) / 10000;
    for (const key of ["statPoints", "skillPoints", "pathPoints"]) p[key] += c.reward[key] || 0;
    if (c.reward.exp) p.addExp(c.reward.exp);
    s.claimed.push(c.id); s.completed++; s.active = null;
    p.allocateAutomatically(); return { reward: c.reward };
  }
  load(p, data) {
    const s = guildState(); p.guild = s;
    if (data?.member !== true) return;
    s.member = true; s.rank = GUILD_RANKS.includes(data.rank) ? data.rank : "G";
    s.role = ["frontliner", "rear", "support", "dd", "inflictionist"].includes(data.role) ? data.role : "frontliner";
    s.platePrice = Number.isFinite(data.platePrice) ? Math.max(GUILD_REGISTRATION, Math.min(Number.MAX_SAFE_INTEGER / 2, data.platePrice)) : GUILD_REGISTRATION;
    const valid = new Set(guildContracts(p.heroData.id).map(c => c.id));
    s.claimed = [...new Set((Array.isArray(data.claimed) ? data.claimed : []).filter(id => valid.has(id)))];
    s.completed = s.claimed.length;
    if (data.active && valid.has(data.active.id) && !s.claimed.includes(data.active.id)) {
      const cls = CLASS_KIT[data.active.cls] ? data.active.cls : p.heroData.id;
      const c = guildContracts(cls).find(c => c.id === data.active.id);
      if (GUILD_RANKS.indexOf(c.rank) <= GUILD_RANKS.indexOf(s.rank)) {
        s.active = { id: c.id, cls, priority: data.active.priority !== false, have: Math.max(0, Math.min(c.n, Math.floor(Number(data.active.have) || 0))) };
        // Only scalar, bounded route state is restored; enemies are recreated by the field system.
        const e = data.active.escort;
        if (c.t === "escort" && e && Number.isFinite(e.hp)) s.active.escort = {
          hp: Math.max(0, Math.min(300 + GUILD_RANKS.indexOf(c.rank) * 120, e.hp)),
          defence: Math.max(0, Math.min(100, Number(e.defence) || 0)),
          leg: Math.max(0, Math.min(2, Math.floor(Number(e.leg) || 0))),
          wave: Math.max(0, Math.min(c.waves, Math.floor(Number(e.wave) || 0))),
          fighting: Boolean(e.fighting), failed: Boolean(e.failed),
          x: Number.isFinite(e.x) ? e.x : null, y: Number.isFinite(e.y) ? e.y : null
        };
      }
    }
  }
}
