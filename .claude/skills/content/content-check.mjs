#!/usr/bin/env node
/**
 * content-check — cross-checks Vanguard of Fate's game data headless, using the game's own modules.
 *
 *   node .claude/skills/content/content-check.mjs          # every check; exit code 1 on problems
 *   node .claude/skills/content/content-check.mjs --list   # also print counts of what was checked
 *   node .claude/skills/content/content-check.mjs --strict # content gaps (notes) fail the run too
 *
 * Catches the references a browser only reveals mid-game (an Act whose boss, item or monster key is
 * misspelled, a monster without traits or a card, an NPC without a name, quest text that throws in one
 * language, a chatter line from an unknown speaker, an item whose icon has no drawing).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { load, ROOT } = await import(path.join(HERE, "../../../scripts/headless.mjs"));
const LIST = process.argv.includes("--list");
const STRICT = process.argv.includes("--strict");

const { MONSTERS, BOSSES, NIGHT_KINDS, BLIGHTS } = await load("js/bestiary.js");
const { HUB_KINDS, HUB_ELITES } = await load("js/enemy.js");
const { FRONTIERS, FRONTIER_ORDER } = await load("js/world/frontiers.js");
const { HUB_AREA } = await load("js/world/areas.js");
const { PLATFORMS, PLATFORM_ORDER, SEAL_STONES } = await load("js/world/platforms.js");
const { describe, codexItems, CLASS_KIT, SETS } = await load("js/items/itemdb.js");
const { ELEMENTS } = await load("js/elements.js");
const { STATUS } = await load("js/status.js");
const { NPC_DEFS } = await load("js/npc/roster.js");
const { npcName } = await load("js/dialogue.js");
const { QuestManager, FINAL_STEP, MENTOR_BY_CLASS } = await load("js/quest.js");
const { setLang } = await load("js/i18n.js");
const { Player } = await load("js/player.js");
const { KnightClass } = await load("js/classes/knight.js");

// bad: a broken reference that can throw or show wrong text in game. note: a content gap worth knowing
// (a monster that never spawns, one without a card); notes fail the run only with --strict.
let problems = 0;
const notes = [];
const bad = (m) => { problems++; console.log(m); };
const note = (m) => notes.push(m);
const counts = {};
const count = (k, n = 1) => { counts[k] = (counts[k] || 0) + n; };
const item = (id) => { try { return describe({ id }); } catch { return null; } };
const hasText = (o) => o && typeof o.en === "string" && o.en.trim() && typeof o.fil === "string" && o.fil.trim();

// ── Monsters & bosses ────────────────────────────────────────────────────────
const RACES = new Set(Object.values(MONSTERS).map((m) => m.race).filter(Boolean));
for (const [table, defs] of [["MONSTERS", MONSTERS], ["BOSSES", BOSSES]]) {
  for (const [k, m] of Object.entries(defs)) {
    count(table);
    if (!hasText(m.name)) bad(`${table}.${k}: name needs en and fil`);
    if (!m.sprite) bad(`${table}.${k}: no sprite`);
    if (!m.race || !m.element || !m.size) bad(`${table}.${k}: missing race/element/size (TRAITS in js/bestiary.js)`);
    if (m.element && !ELEMENTS[m.element]) bad(`${table}.${k}: unknown element "${m.element}"`);
    if (m.debuff && m.debuff.type !== "all" && !STATUS[m.debuff.type]) bad(`${table}.${k}: unknown debuff "${m.debuff.type}"`);
    if (!item(`card:${k}`)) note(`${table}.${k}: no card (CARDS in js/items/itemdb.js)`);
    if (m.drop && !item(m.drop)) bad(`${table}.${k}: drop "${m.drop}" is not an item`);
    for (const s of (m.attacks && m.attacks.summon) || []) if (!MONSTERS[s]) bad(`${table}.${k}: summons unknown monster "${s}"`);
  }
}
for (const [name, list] of [["HUB_KINDS", HUB_KINDS], ["HUB_ELITES", HUB_ELITES], ["NIGHT_KINDS", NIGHT_KINDS]]) {
  for (const k of list) if (!MONSTERS[k]) bad(`${name}: unknown monster "${k}"`);
}
for (const b of BLIGHTS) if (!STATUS[b]) bad(`BLIGHTS: "${b}" has no STATUS entry`);

// ── Platforms (Acts VII–XII) ─────────────────────────────────────────────────
const used = new Set([...HUB_KINDS, ...HUB_ELITES, ...NIGHT_KINDS]);
// Every Book I map lists 5 regular kinds and 4 elite kinds (elite: true in MONSTERS) and named sites for scouting quests
function checkKinds(where, a) {
  const regs = a.monsters || [], elites = a.elites || [];
  if (regs.length !== 5) bad(`${where}: ${regs.length} regular kinds (expected 5)`);
  if (elites.length !== 4) bad(`${where}: ${elites.length} elite kinds (expected 4)`);
  for (const k of regs) if (MONSTERS[k] && MONSTERS[k].elite) bad(`${where}: "${k}" is an elite kind in the regular list`);
  for (const k of elites) { used.add(k); if (!MONSTERS[k]) bad(`${where}: unknown elite "${k}"`); else if (!MONSTERS[k].elite) bad(`${where}: elite "${k}" lacks elite: true`); }
  for (const s of a.sites || []) if (!hasText(s.name) || !Number.isFinite(s.x) || !Number.isFinite(s.y)) bad(`${where}: site needs x, y and an en/fil name`);
  if (!(a.sites || []).length) bad(`${where}: no sites`);
}
checkKinds("hub", HUB_AREA);
for (const id of FRONTIER_ORDER) {
  const f = FRONTIERS[id];
  count("frontiers");
  if (!f) { bad(`FRONTIER_ORDER: unknown frontier "${id}"`); continue; }
  if (!hasText(f.name) || !hasText(f.arenaName)) bad(`frontier ${id}: name and arenaName need en and fil`);
  if (!f.text || !f.text.en || !f.text.fil || !f.text.en.arrive || !f.text.fil.arrive) bad(`frontier ${id}: text.en/fil.arrive missing`);
  for (const k of f.monsters || []) { used.add(k); if (!MONSTERS[k]) bad(`frontier ${id}: unknown monster "${k}"`); }
  checkKinds(`frontier ${id}`, f);
}
for (const id of PLATFORM_ORDER) {
  const p = PLATFORMS[id];
  count("platforms");
  if (!p) { bad(`PLATFORM_ORDER: unknown platform "${id}"`); continue; }
  if (!hasText(p.name)) bad(`platform ${id}: name needs en and fil`);
  if (p.arenaName && !hasText(p.arenaName)) bad(`platform ${id}: arenaName needs en and fil`);
  if (!BOSSES[p.boss]) bad(`platform ${id}: unknown boss "${p.boss}"`);
  if (!item(p.item)) bad(`platform ${id}: quest item "${p.item}" is not an item`);
  if (p.seal && !item(p.seal)) bad(`platform ${id}: seal "${p.seal}" is not an item`);
  for (const k of p.monsters || []) { used.add(k); if (!MONSTERS[k]) bad(`platform ${id}: unknown monster "${k}"`); }
  checkKinds(`platform ${id}`, p);
  if (p.text) for (const L of ["en", "fil"]) if (!p.text[L]) bad(`platform ${id}: text.${L} missing`);
  if (p.text && p.text.en && p.text.fil) {
    for (const key of Object.keys(p.text.en)) {
      const a = p.text.en[key], b = p.text.fil[key];
      if (b === undefined) bad(`platform ${id}: text.fil.${key} missing`);
      else if (Array.isArray(a) && Array.isArray(b) && a.length !== b.length) bad(`platform ${id}: text.${key} has ${a.length} en lines vs ${b.length} fil`);
    }
  }
}
for (const s of SEAL_STONES) if (!item(s)) bad(`SEAL_STONES: "${s}" is not an item`);
for (const k of Object.keys(MONSTERS)) {
  const summoned = Object.values(BOSSES).some((b) => ((b.attacks && b.attacks.summon) || []).includes(k));
  if (!used.has(k) && !summoned) note(`MONSTERS.${k}: never spawns (not in HUB_KINDS/HUB_ELITES, NIGHT_KINDS, a map's monsters/elites or a boss summon)`);
}

// ── Items ────────────────────────────────────────────────────────────────────
const iconsSrc = fs.readFileSync(path.join(ROOT, "js/items/icons.js"), "utf8");
const drawBody = iconsSrc.slice(iconsSrc.indexOf("const DRAW = {"));
const DRAWN = new Set([...drawBody.matchAll(/^  ([A-Za-z_$][\w$]*)\s*\(/gm)].map((m) => m[1]));
const all = codexItems();
for (const group of ["equip", "uniques", "other", "cards"]) {
  for (const it of all[group]) {
    count(`items.${group}`);
    if (!it) { bad(`items.${group}: an entry does not describe`); continue; }
    if (it.icon && !DRAWN.has(it.icon)) bad(`item ${it.id}: icon "${it.icon}" has no drawing in js/items/icons.js (falls back to ore)`);
    for (const L of ["en", "fil"]) {
      setLang(L);
      const d = describe({ id: it.id });
      if (!d || !d.name || /undefined|\[object/.test(d.name)) bad(`item ${it.id}: ${L} name is "${d && d.name}"`);
    }
    setLang("en");
  }
}
for (const [cls, kit] of Object.entries(CLASS_KIT)) {
  for (const base of [kit.weapon, kit.offhand, ...kit.extra].filter(Boolean)) if (!item(`${base}@1`)) bad(`CLASS_KIT.${cls}: unknown base "${base}"`);
}
for (const [k, s] of Object.entries(SETS)) { count("sets"); if (s.name && !hasText(s.name) && typeof s.name !== "function") bad(`SETS.${k}: name needs en and fil`); }

// ── NPCs, chatter, quest ─────────────────────────────────────────────────────
for (const id of Object.keys(NPC_DEFS)) {
  count("npcs");
  for (const L of ["en", "fil"]) { setLang(L); if (npcName(id) === id) bad(`NPC ${id}: no ${L} name (NAMES in js/dialogue.js)`); }
}
setLang("en");
// Every NPC is placed somewhere: NPCManager.build (js/npc/npcs.js) or a platform's villagers
const placedSrc = fs.readFileSync(path.join(ROOT, "js/npc/npcs.js"), "utf8");
const villagers = new Set(Object.values(PLATFORMS).flatMap((p) => Object.keys(p.villagers || {})));
for (const id of Object.keys(NPC_DEFS)) {
  if (!villagers.has(id) && !new RegExp(`new NPC\\("${id}"`).test(placedSrc) && !["aurelia", "kenneth"].includes(id)) note(`NPC ${id}: never placed in the world (NPCManager.build or a platform's villagers)`);
}
for (const [cls, id] of Object.entries(MENTOR_BY_CLASS)) if (!NPC_DEFS[id]) bad(`MENTOR_BY_CLASS.${cls}: unknown NPC "${id}"`);

const chatter = JSON.parse(fs.readFileSync(path.join(ROOT, "data/npc_conversations.json"), "utf8"));
for (const [id, lines] of Object.entries(chatter.solo || {})) {
  if (!NPC_DEFS[id]) bad(`npc_conversations.json solo: unknown NPC "${id}"`);
  for (const l of lines) { count("chatter lines"); if (!hasText(l)) bad(`npc_conversations.json solo.${id}: a line needs en and fil`); }
}
(chatter.pairs || []).forEach((pair, i) => {
  for (const id of pair.pair || []) if (!NPC_DEFS[id]) bad(`npc_conversations.json pairs[${i}]: unknown NPC "${id}"`);
  for (const l of pair.lines || []) {
    count("chatter lines");
    if (!NPC_DEFS[l.speaker]) bad(`npc_conversations.json pairs[${i}]: unknown speaker "${l.speaker}"`);
    if (!hasText(l)) bad(`npc_conversations.json pairs[${i}]: a line needs en and fil`);
  }
});

const hero = new Player(0, 0, KnightClass);
for (const L of ["en", "fil"]) {
  setLang(L);
  const q = new QuestManager();
  const thrown = new Map();   // one line per distinct error, listing the steps it hits
  for (let s = 0; s <= FINAL_STEP; s++) {
    q.step = s;
    count("quest steps");
    try {
      const t = q.text(hero, "Aurelia", "Arthur");
      if (!t.act || !t.goal || /undefined|\[object|NaN/.test(t.act + t.goal)) bad(`quest step ${s} (${L}): "${t.act}" / "${t.goal}"`);
    } catch (e) { if (!thrown.has(e.message)) thrown.set(e.message, []); thrown.get(e.message).push(s); }
  }
  for (const [msg, steps] of thrown) bad(`quest (${L}): steps ${steps.length > 3 ? `${steps[0]}–${steps[steps.length - 1]}` : steps.join(", ")} throw "${msg}" (the Quest HUD and log would crash)`);
}
setLang("en");

if (notes.length) {
  console.log(`\n${notes.length} content gap(s)${STRICT ? "" : " (notes; --strict to fail on them)"}:`);
  // Group "X: same message" lines so a long list reads as one line per kind of gap
  const groups = new Map();
  for (const n of notes) { const [who, what] = n.split(/: (.+)/); if (!groups.has(what)) groups.set(what, []); groups.get(what).push(who.replace(/^MONSTERS\.|^BOSSES\./, "")); }
  for (const [what, who] of groups) console.log(`  ${what}: ${who.join(", ")}`);
  if (STRICT) problems += notes.length;
}
if (LIST) console.log(Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(" · "));
console.log(problems ? `${problems} problem(s)` : "content OK: monsters, bosses, platforms, items, NPCs, chatter and quest steps cross-check");
if (problems) process.exitCode = 1;
