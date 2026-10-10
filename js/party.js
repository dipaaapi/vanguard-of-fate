import { PLAYABLES, PLAYABLE_IDS, PlayableQuestBook, makePlayableKit } from "./playables.js";
import { NPC_DEFS } from "./npc/roster.js";
import { Avatar } from "./avatar/avatar.js";
import { getLang } from "./i18n.js";

// ==================== PARTY (playable NPCs) ====================
// The hero plus every recruited playable NPC (js/playables.js), up to six. One member is on the
// field at a time, Genshin-style: switching keeps the position, level, stats, gear and bag, and
// swaps the body, name and combat kit (player.active, read by js/player.js), and each member keeps
// their own HP. When the member on the field falls, the next one standing steps in; the game is over
// only when the whole party is down. Off-field members recover inside a sanctuary (the fallen too).
// Recruitment: talk to the NPC to start their trial, then elites / boss / items / repairs in their
// home map (PlayableQuestBook). Text: data/party.json.

export const PARTY_MAX = 6;
const SWITCH_COOLDOWN = 60;     // frames between switches (1 s)
const REST_EVERY = 45;          // off-field recovery tick in a sanctuary
const CONSOLE_REACH = 22;       // Eirene's system consoles: walk up to one to restart it
const CONSOLES = [[540, 180, "habitat"], [980, 250, "lift"], [800, 760, "caretaker"]];   // js/world/frontiers.js (lost)

let TEXT = null;
fetch("data/party.json").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) TEXT = d; }).catch(() => {});

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
export function partyText(key, vars = {}) {
  const e = TEXT && TEXT.ui[key];
  return e ? fill(e[getLang()] || e.en, vars) : fill(key, vars);
}
function recruitLines(id, kind, vars) {
  const e = TEXT && TEXT.recruit[id] && TEXT.recruit[id][kind];
  return e ? (e[getLang()] || e.en).map((s) => fill(s, vars)) : [];
}

export const memberName = (id, heroName) => (id === "hero" ? heroName : (PLAYABLES[id]?.label[getLang() === "fil" ? 1 : 0] || id));

export class Party {
  constructor(saved = null, playables = null) {
    this.book = new PlayableQuestBook(playables && typeof playables === "object" ? playables : {});
    this.kits = {};             // id → combat kit with its Avatar (built once)
    this.avatars = {};
    this.members = ["hero"];
    this.hp = { hero: null };   // null = full (resolved against maxHp)
    this.active = 0;
    this.cooldown = 0;
    this.restTimer = 0;
    this.load(saved);
  }

  load(saved) {
    const recruited = PLAYABLE_IDS.filter((id) => this.book.state[id].recruited);
    const order = Array.isArray(saved?.members) ? saved.members.filter((id) => recruited.includes(id)) : [];
    recruited.forEach((id) => { if (!order.includes(id)) order.push(id); });
    this.members = ["hero", ...order].slice(0, PARTY_MAX);
    this.hp = {};
    this.members.forEach((id) => {
      const v = Number(saved?.hp?.[id]);
      this.hp[id] = Number.isFinite(v) ? Math.max(0, v) : null;
    });
    const a = saved?.active | 0;
    this.active = a >= 0 && a < this.members.length ? a : 0;
  }

  serialize(player) {
    this.store(player);
    return { members: [...this.members], active: this.active, hp: { ...this.hp } };
  }

  get size() { return this.members.length; }
  get activeId() { return this.members[this.active]; }
  recruited(id) { return Boolean(this.book.state[id]?.recruited); }
  hpOf(id, player) {
    if (id === this.activeId) return player.hp;
    const v = this.hp[id];
    return v == null ? player.maxHp : Math.min(player.maxHp, v);
  }

  avatarOf(id, player) {
    if (id === "hero") return player.heroData.avatar;
    if (!this.avatars[id]) {
      const a = new Avatar(NPC_DEFS[id].look);
      if (id !== "nimaFen" && id !== "eirene" && id !== "templar") a.sheetKey = `npc/${id}`;   // same as js/npc/npcs.js
      this.avatars[id] = a;
    }
    return this.avatars[id];
  }
  kitOf(id, player) {
    if (id === "hero") return null;
    // sprites: frame counts only (the Avatar draws); they pace the attack pose like the hero's kit
    if (!this.kits[id]) this.kits[id] = { ...makePlayableKit(id, this.avatarOf(id, player)), sprites: player.heroData.sprites };
    return this.kits[id];
  }

  // Put the member on the field into the player (after a load or a recruit)
  apply(player) {
    const id = this.activeId;
    player.active = this.kitOf(id, player);
    player.activeName = id === "hero" ? null : memberName(id);
    const v = this.hp[id];
    if (v != null) player.hp = Math.min(player.maxHp, v);
  }

  store(player) {
    if (player) this.hp[this.activeId] = player.hp;
  }

  // The hero takes the field (Job Awakening, change of calling: a new hero body is built)
  heroOnField(player) {
    this.store(player);
    this.active = 0;
    this.hp.hero = null;
  }

  // Switch to member index i. Returns the new id, or null (same member, fallen, on cooldown)
  switchTo(i, player, force = false) {
    if (i < 0 || i >= this.members.length || i === this.active) return null;
    if (!force && this.cooldown > 0) return null;
    const id = this.members[i], hp = this.hpOf(id, player);
    if (hp <= 0) return null;
    this.store(player);
    this.active = i;
    player.hp = hp;
    this.hp[id] = hp;
    player.active = this.kitOf(id, player);
    player.activeName = id === "hero" ? null : memberName(id);
    // Clean hand-off: no half-finished swing or charge carries over to the new body
    player.state = "idle"; player.atkT = 0; player.chargeTimer = 0; player.animFrame = 0;
    this.cooldown = SWITCH_COOLDOWN;
    return id;
  }
  next(player) {
    for (let k = 1; k < this.members.length; k++) {
      const i = (this.active + k) % this.members.length;
      if (this.hpOf(this.members[i], player) > 0) return this.switchTo(i, player);
    }
    return null;
  }

  // The member on the field fell: the next one standing steps in (null = the whole party is down)
  rescue(player) {
    if (player.hp > 0 || this.members.length < 2) return null;
    const fallen = this.activeId;
    this.hp[fallen] = 0;
    for (let k = 1; k < this.members.length; k++) {
      const i = (this.active + k) % this.members.length;
      if (this.hpOf(this.members[i], player) > 0) {
        const id = this.switchTo(i, player, true);
        player.invulnTimer = Math.max(player.invulnTimer || 0, 60);
        return { fallen, id };
      }
    }
    return null;
  }

  // Each step: switch cooldown, off-field recovery in a sanctuary
  update(player, inSanctuary) {
    if (this.cooldown > 0) this.cooldown--;
    if (!inSanctuary || ++this.restTimer < REST_EVERY) return;
    this.restTimer = 0;
    const step = Math.max(4, Math.round(player.maxHp * 0.08));
    this.members.forEach((id, i) => {
      if (i === this.active || this.hp[id] == null) return;
      const v = Math.min(player.maxHp, this.hp[id] + step);
      this.hp[id] = v >= player.maxHp ? null : v;
    });
  }

  // ---- Recruitment ----
  // Lines when talking to a recruit (offer / progress / join); joined: true when they joined just now
  talk(id, bag) {
    const def = PLAYABLES[id], q = this.book.state[id];
    if (!def || !q || q.recruited) return null;
    if (!q.started) {
      this.book.start(id);
      return { lines: recruitLines(id, "offer", {}), joined: false };
    }
    if (this.book.recruit(id, bag)) {
      if (this.members.length < PARTY_MAX) { this.members.push(id); this.hp[id] = null; }
      return { lines: recruitLines(id, "join", {}), joined: true };
    }
    return { lines: recruitLines(id, "progress", { n: q.progress, req: def.required }), joined: false };
  }

  // Progress from an elite kill / a boss in `area`: the names of the recruits it advanced
  onEliteKill(area) { return this.book.onEliteKill(area); }
  onBossDefeated(area) { return this.book.onBossDefeated(area); }
  progressText(id, bag) {
    const def = PLAYABLES[id], q = this.book.state[id];
    if (this.book.ready(id, bag)) return partyText("ready", { name: memberName(id) });
    return partyText("progress", { name: memberName(id), n: q.progress, req: def.required });
  }

  // Eirene's trial on the Lost Sky Continent: walking up to a dark console restarts it
  checkConsoles(stage, player) {
    if (stage.id !== "lost") return null;
    const q = this.book.state.eirene;
    stage.eireneSystems = q.systems;
    if (!q.started || q.recruited) return null;
    const px = player.x + 10, py = player.y + 18;
    const hit = CONSOLES.find(([x, y, sys]) => !q.systems[sys] && Math.hypot(px - x, py - y) < CONSOLE_REACH);
    if (!hit || !this.book.repairSystem("eirene", hit[2])) return null;
    return partyText("system", { n: q.progress, req: PLAYABLES.eirene.required });
  }
}
