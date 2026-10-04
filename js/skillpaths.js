import { Sound } from "./audio.js";

// ==================== SKILL PATHS: MIGHT (STR) · FINESSE (DEX) · ARCANA (INT) ====================
// Three trees every hero can learn from with the same skill points as the class trees (js/skills.js
// merges them into TREES). Each path mixes passives (always on) and actives (cast from the skill
// slots U / O / P).
//
// Play style: how you fight feeds a running affinity per path (player.style):
//   Might   — hits landed up close, blows taken while standing your ground, Might actives
//   Finesse — hits landed from range, critical hits, dodge rolls, Finesse actives
//   Arcana  — K / L skills, spells and heals, Arcana actives
// Older actions fade (×DECAY per action), so the style follows how you play now.
// The leading path (≥ 40% share) "resonates": its passives are 20% stronger, its capstone can be
// learned, and the "My style" stat auto-path follows it.
//
// For the hotbar: activeSkillsOf(player) lists the learned actives, player.skillSlots holds the ids in
// SLOT_KEYS order, assignSlot(player, i, id) changes one, and a drag carries the id as SKILL_DRAG_TYPE.

const N = (en, fil) => ({ en, fil: fil || en });

export const PATH_IDS = ["str", "dex", "int"];
export const PATHS = {
  str: { tree: "might", icon: "⚔️", color: "#f87171", name: N("Might", "Lakas"), stat: "str" },
  dex: { tree: "finesse", icon: "🎯", color: "#4ade80", name: N("Finesse", "Liksi"), stat: "dex" },
  int: { tree: "arcana", icon: "🔮", color: "#a78bfa", name: N("Arcana", "Hiwaga"), stat: "int" }
};
export const RESONANCE = 0.2;             // +20% to the resonant path's passives
export const SLOT_KEYS = ["KeyU", "KeyO", "KeyP"];
export const SKILL_DRAG_TYPE = "text/vof-skill";
const DECAY = 0.998;
const MIN_STYLE = 25;                      // affinity needed before a style shows
const MIN_SHARE = 0.4;

const st = (p, k) => (typeof p.totalStat === "function" ? p.totalStat(k) : (p.stats && p.stats[k]) || 1);

// A short effect on the hero: damage-taken reduction for `t` frames (ticked in tickActives)
function ward(p, pct, t) {
  p.wardPct = Math.max(p.wardPct || 0, pct);
  p.wardT = Math.max(p.wardT || 0, t);
}

// ---- Actives: cast(player, ctx, lv) → true when cast. ctx = { target, spawn, fx } ----
// cd = cooldown in frames (60 = 1 s); CDR applies as for K / L.
const CAST = {
  slam(p, { spawn, fx }, lv) {
    spawn({ type: "shockwave", x: p.x + 10, y: p.y + 14, r: 6, max: 44 + lv * 2, grow: 3.5, damage: Math.round(18 + 7 * lv + st(p, "str") * 0.8), stun: 24 + 6 * lv, hit: new Set(), color: "#f87171", push: 16, elem: "earth" });
    if (fx && fx.addScreenShake) fx.addScreenShake(4);
    if (Sound.playForcefield) Sound.playForcefield();
    return true;
  },
  warcry(p, { fx }, lv) {
    p.buffs.damage = Math.max(p.buffs.damage, 180 + 60 * lv);
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(p.x + 10, p.y + 6, "#f87171", 18);
    if (Sound.playHolyBurst) Sound.playHolyBurst();
    return true;
  },
  bulwark(p, { fx }, lv) {
    ward(p, 0.3 + 0.04 * lv, 150 + 30 * lv);
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(p.x + 10, p.y + 10, "#e2e8f0", 16);
    if (Sound.playForcefield) Sound.playForcefield();
    return true;
  },
  volley(p, { spawn }, lv) {
    const dmg = Math.round(7 + 3 * lv + st(p, "dex") * 0.35);
    for (let i = -2; i <= 2; i++) {
      const a = p.aimAngle + i * 0.2;
      spawn({ type: "bolt", x: p.x + 10, y: p.y + 10, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5, damage: dmg, elem: "wind", color: "#4ade80", size: 2, range: 170 });
    }
    if (Sound.playSlash) Sound.playSlash();
    return true;
  },
  shadowstep(p, { fx }, lv) {
    p.dashT = 12;
    p.dashVx = Math.cos(p.aimAngle) * 5;
    p.dashVy = Math.sin(p.aimAngle) * 5;
    p.invulnTimer = Math.max(p.invulnTimer || 0, 20);
    p.buffs.moveSpeed = Math.max(p.buffs.moveSpeed, 60 + 30 * lv);
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(p.x + 10, p.y + 12, "#4ade80", 10);
    if (Sound.playDash) Sound.playDash();
    return true;
  },
  pinpoint(p, { spawn }, lv) {
    const a = p.aimAngle;
    spawn({ type: "bolt", x: p.x + 10, y: p.y + 10, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, damage: Math.round(26 + 10 * lv + st(p, "dex") * 1.1), crit: true, elem: "neutral", color: "#fde047", size: 3, range: 240 });
    if (Sound.playSlash) Sound.playSlash();
    return true;
  },
  spark(p, { spawn }, lv) {
    const a = p.aimAngle;
    spawn({ type: "bolt", x: p.x + 10, y: p.y + 10, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, damage: Math.round(13 + 5 * lv + st(p, "int") * 0.7), elem: "wind", color: "#a78bfa", size: 3, range: 200 });
    if (Sound.playHolyBurst) Sound.playHolyBurst();
    return true;
  },
  frostnova(p, { spawn }, lv) {
    spawn({ type: "shockwave", x: p.x + 10, y: p.y + 14, r: 6, max: 50, grow: 4, damage: Math.round(9 + 4 * lv + st(p, "int") * 0.5), stun: 36 + 10 * lv, hit: new Set(), color: "#7dd3fc", push: 6, elem: "water" });
    if (Sound.playForcefield) Sound.playForcefield();
    return true;
  },
  manashield(p, { fx }, lv) {
    ward(p, 0.4 + 0.03 * lv, 150 + 30 * lv);
    p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * (0.04 + 0.01 * lv) * (p.healMult || 1)));
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(p.x + 10, p.y + 10, "#a78bfa", 18);
    if (Sound.playHolyBurst) Sound.playHolyBurst();
    return true;
  }
};

// Node fields as in js/skills.js (id, icon, max, row, col, req, name, desc, fx) plus:
//   path · kind ("active" | "passive") · minLv (hero level) · style (capstone: path must resonate) · cd
const node = (path, o) => ({ path, kind: "passive", fx: () => ({}), ...o });
const active = (path, o) => node(path, { kind: "active", cast: CAST[o.id], ...o });

export const PATH_TREES = {
  might: [
    node("str", { id: "brawn", icon: "💪", max: 10, row: 0, col: 1, name: N("Brute Force", "Lakas ng Bisig"),
      desc: N("Passive: +1 STR and +1 ATK per level.", "Passive: +1 STR at +1 ATK bawat level."), fx: (l) => ({ str: l, atk: l }) }),
    active("str", { id: "slam", icon: "🌋", max: 5, row: 1, col: 0, req: { brawn: 1 }, cd: 420, name: N("Earthshaker Slam", "Hampas na Yumayanig"),
      desc: N("Active: slam the ground — an earth shockwave around you that stuns. Scales with STR.", "Active: hampasin ang lupa — alon ng lupa sa paligid mo na nakakatulala. Lumalakas sa STR.") }),
    node("str", { id: "ironhide", icon: "🪨", max: 5, row: 1, col: 2, req: { brawn: 1 }, name: N("Iron Hide", "Balat na Bakal"),
      desc: N("Passive: +2% max HP and −1% damage taken per level.", "Passive: +2% max HP at −1% pinsalang natatanggap bawat level."), fx: (l) => ({ hpPct: 2 * l, dmgReduce: l }) }),
    active("str", { id: "warcry", icon: "📯", max: 5, row: 2, col: 1, req: { slam: 2 }, minLv: 12, cd: 1500, name: N("War Cry", "Sigaw ng Digmaan"),
      desc: N("Active: ×1.5 damage for 4 s, +1 s per level.", "Active: ×1.5 pinsala sa loob ng 4 s, +1 s bawat level.") }),
    node("str", { id: "cleave", icon: "🪓", max: 5, row: 3, col: 0, req: { ironhide: 2 }, minLv: 15, name: N("Cleaving Blows", "Tagang Humahati"),
      desc: N("Passive: +3% damage per level.", "Passive: +3% pinsala bawat level."), fx: (l) => ({ dmg: 3 * l }) }),
    active("str", { id: "bulwark", icon: "🏰", max: 5, row: 3, col: 2, req: { warcry: 1 }, minLv: 20, cd: 1200, name: N("Unbreakable", "Hindi Matitinag"),
      desc: N("Active: take 34% less damage for 3 s (+4% and +0.5 s per level).", "Active: 34% bawas sa pinsalang natatanggap sa loob ng 3 s (+4% at +0.5 s bawat level).") }),
    node("str", { id: "titan", icon: "🗿", max: 1, row: 4, col: 1, req: { cleave: 3, bulwark: 1 }, minLv: 30, style: true, name: N("Path of the Titan", "Landas ng Titan"),
      desc: N("Capstone (Might must be your style): +10 STR, +10% max HP, +5% damage.", "Capstone (Lakas ang iyong istilo): +10 STR, +10% max HP, +5% pinsala."), fx: (l) => ({ str: 10 * l, hpPct: 10 * l, dmg: 5 * l }) })
  ],
  finesse: [
    node("dex", { id: "nimble", icon: "🤹", max: 10, row: 0, col: 1, name: N("Nimble Fingers", "Maliksing Daliri"),
      desc: N("Passive: +1 DEX and +1% attack speed per level.", "Passive: +1 DEX at +1% bilis ng atake bawat level."), fx: (l) => ({ dex: l, aspd: l }) }),
    active("dex", { id: "volley", icon: "🎐", max: 5, row: 1, col: 0, req: { nimble: 1 }, cd: 360, name: N("Fan Volley", "Pamaypay ng Palaso"),
      desc: N("Active: five wind darts in a fan. Scales with DEX.", "Active: limang palaso ng hangin na pabukas. Lumalakas sa DEX.") }),
    node("dex", { id: "keen", icon: "👁️", max: 5, row: 1, col: 2, req: { nimble: 1 }, name: N("Keen Eye", "Matalas na Mata"),
      desc: N("Passive: +2% crit per level.", "Passive: +2% crit bawat level."), fx: (l) => ({ crit: 2 * l }) }),
    active("dex", { id: "shadowstep", icon: "💨", max: 5, row: 2, col: 1, req: { volley: 2 }, minLv: 12, cd: 480, name: N("Shadow Step", "Hakbang ng Anino"),
      desc: N("Active: dash toward your aim, untouchable, then run faster for 1.5 s (+0.5 s per level).", "Active: sumugod sa direksyon ng tutok, hindi tinatamaan, saka mas mabilis sa 1.5 s (+0.5 s bawat level).") }),
    node("dex", { id: "swift", icon: "🐆", max: 5, row: 3, col: 0, req: { keen: 2 }, minLv: 15, name: N("Fleet Foot", "Matuling Paa"),
      desc: N("Passive: +3% move speed and +5 stamina per level.", "Passive: +3% bilis at +5 stamina bawat level."), fx: (l) => ({ move: 3 * l, stamina: 5 * l }) }),
    active("dex", { id: "pinpoint", icon: "🎯", max: 5, row: 3, col: 2, req: { shadowstep: 1 }, minLv: 20, cd: 600, name: N("Pinpoint Shot", "Tiyak na Tira"),
      desc: N("Active: one long-range shot that always crits. Scales with DEX.", "Active: isang malayong tira na laging crit. Lumalakas sa DEX.") }),
    node("dex", { id: "phantom", icon: "🦊", max: 1, row: 4, col: 1, req: { swift: 3, pinpoint: 1 }, minLv: 30, style: true, name: N("Path of the Phantom", "Landas ng Multo"),
      desc: N("Capstone (Finesse must be your style): +10 DEX, +8% crit, +6% attack speed.", "Capstone (Liksi ang iyong istilo): +10 DEX, +8% crit, +6% bilis ng atake."), fx: (l) => ({ dex: 10 * l, crit: 8 * l, aspd: 6 * l }) })
  ],
  arcana: [
    node("int", { id: "insight", icon: "📘", max: 10, row: 0, col: 1, name: N("Arcane Insight", "Kaalamang Arkano"),
      desc: N("Passive: +1 INT and +1% cooldown reduction per level.", "Passive: +1 INT at +1% bawas sa cooldown bawat level."), fx: (l) => ({ int: l, cdr: l }) }),
    active("int", { id: "spark", icon: "⚡", max: 5, row: 1, col: 0, req: { insight: 1 }, cd: 240, name: N("Arcane Spark", "Kislap na Arkano"),
      desc: N("Active: a fast bolt of arcane wind. Scales with INT.", "Active: mabilis na kidlat ng hanging arkano. Lumalakas sa INT.") }),
    node("int", { id: "wellspring", icon: "⛲", max: 5, row: 1, col: 2, req: { insight: 1 }, name: N("Wellspring", "Bukal"),
      desc: N("Passive: +1 HP regen and +3% heal power per level.", "Passive: +1 HP regen at +3% lakas ng heal bawat level."), fx: (l) => ({ regen: l, heal: 3 * l }) }),
    active("int", { id: "frostnova", icon: "❄️", max: 5, row: 2, col: 1, req: { spark: 2 }, minLv: 12, cd: 600, name: N("Frost Nova", "Bugso ng Yelo"),
      desc: N("Active: a ring of frost that freezes foes around you. Scales with INT.", "Active: bilog ng yelo na nagyeyelo sa mga kalaban sa paligid. Lumalakas sa INT.") }),
    node("int", { id: "focus", icon: "🧠", max: 5, row: 3, col: 0, req: { wellspring: 2 }, minLv: 15, name: N("Focused Mind", "Nakatutok na Isip"),
      desc: N("Passive: +2% damage and +1% cooldown reduction per level.", "Passive: +2% pinsala at +1% bawas sa cooldown bawat level."), fx: (l) => ({ dmg: 2 * l, cdr: l }) }),
    active("int", { id: "manashield", icon: "🛡️", max: 5, row: 3, col: 2, req: { frostnova: 1 }, minLv: 20, cd: 1200, name: N("Mana Shield", "Kalasag ng Mana"),
      desc: N("Active: heal 5% HP and take 43% less damage for 3 s (+3% and +0.5 s per level).", "Active: maghilom ng 5% HP at 43% bawas sa pinsala sa loob ng 3 s (+3% at +0.5 s bawat level).") }),
    node("int", { id: "archmage", icon: "🌌", max: 1, row: 4, col: 1, req: { focus: 3, manashield: 1 }, minLv: 30, style: true, name: N("Path of the Sage", "Landas ng Pantas"),
      desc: N("Capstone (Arcana must be your style): +10 INT, +5% cooldown reduction, +6% damage.", "Capstone (Hiwaga ang iyong istilo): +10 INT, +5% bawas sa cooldown, +6% pinsala."), fx: (l) => ({ int: 10 * l, cdr: 5 * l, dmg: 6 * l }) })
  ]
};
export const PATH_TREE_IDS = Object.values(PATHS).map((p) => p.tree);

const ACTIVES = Object.fromEntries(Object.values(PATH_TREES).flat().filter((s) => s.kind === "active").map((s) => [s.id, s]));
export const activeSkill = (id) => ACTIVES[id] || null;

// ---- Play style ----
export function noteStyle(p, path, w = 1) {
  if (!p || !PATHS[path]) return;
  const s = p.style || (p.style = { str: 0, dex: 0, int: 0 });
  PATH_IDS.forEach((k) => { s[k] *= DECAY; });
  s[path] += w;
}

// The resonant path ("str" | "dex" | "int") or null while undecided
export function styleOf(p) {
  const s = p && p.style;
  if (!s) return null;
  const total = s.str + s.dex + s.int;
  if (total < MIN_STYLE) return null;
  const top = PATH_IDS.reduce((a, b) => (s[b] > s[a] ? b : a));
  return s[top] / total >= MIN_SHARE ? top : null;
}

// Shares 0..1 per path, for the style meter
export function styleShares(p) {
  const s = (p && p.style) || { str: 0, dex: 0, int: 0 };
  const total = s.str + s.dex + s.int || 1;
  return Object.fromEntries(PATH_IDS.map((k) => [k, s[k] / total]));
}

// ---- Skill slots ----
export function activeSkillsOf(p) {
  return Object.values(ACTIVES).filter((s) => (p.skillLevels[s.id] || 0) > 0);
}

export function assignSlot(p, i, id) {
  if (!p.skillSlots) p.skillSlots = SLOT_KEYS.map(() => null);
  if (i < 0 || i >= SLOT_KEYS.length) return false;
  if (id && (!ACTIVES[id] || !(p.skillLevels[id] > 0))) return false;
  if (id) p.skillSlots = p.skillSlots.map((x) => (x === id ? null : x));
  p.skillSlots[i] = id || null;
  return true;
}

// A newly learned active goes into the first free slot
export function slotNewActive(p, id) {
  if (!ACTIVES[id]) return;
  if (!p.skillSlots) p.skillSlots = SLOT_KEYS.map(() => null);
  if (p.skillSlots.includes(id)) return;
  const free = p.skillSlots.indexOf(null);
  if (free >= 0) p.skillSlots[free] = id;
}

export const activeCooldown = (p, s) => Math.round(s.cd * Math.max(0.3, 1 - (p.cdr || 0)));

// Cast one active by id (from a slot key or a hotbar). ctx = { target, spawn, fx, safe }
export function castActive(p, id, ctx) {
  const s = ACTIVES[id];
  const lv = s ? p.skillLevels[id] || 0 : 0;
  if (!lv || ctx.safe || p.paralyzed || (p.debuffs && p.debuffs.silence > 0)) return false;
  if (!p.activeCd) p.activeCd = {};
  if ((p.activeCd[id] || 0) > 0) return false;
  if (!s.cast(p, ctx, lv)) return false;
  p.activeCd[id] = activeCooldown(p, s);
  noteStyle(p, s.path, 2);
  if (p.startAttackPose) p.startAttackPose(18);
  return true;
}

// Every frame from Player.update: cooldowns, ward, dash, and the slot keys
export function tickActives(p, isPressed, ctx) {
  if (p.activeCd) for (const k in p.activeCd) if (p.activeCd[k] > 0) p.activeCd[k]--;
  if (p.wardT > 0 && --p.wardT === 0) p.wardPct = 0;
  if (p.dashT > 0) { p.dashT--; p.x += p.dashVx; p.y += p.dashVy; }
  if (!p.skillSlots) return;
  SLOT_KEYS.forEach((code, i) => {
    const id = p.skillSlots[i];
    if (id && isPressed(code)) castActive(p, id, ctx);
  });
}
