#!/usr/bin/env node
/**
 * balance-sim — measures Vanguard of Fate's combat balance headless, with the game's own code.
 *
 *   node .claude/skills/balance/balance-sim.mjs                 # summary: every class × every area
 *   node .claude/skills/balance/balance-sim.mjs --area frost    # one area, one row per monster
 *   node .claude/skills/balance/balance-sim.mjs --level +2      # heroes 2 levels above the default
 *   node .claude/skills/balance/balance-sim.mjs --gear kit      # kit weapon + starter clothes only (default: best normal gear of the Act's grade)
 *   node .claude/skills/balance/balance-sim.mjs --build str      # stats spent by the auto stat path (str | dex | int | class = class's main stat path)
 *   node .claude/skills/balance/balance-sim.mjs --familiar 5     # Knight/Mage/Fighter/Novice add their familiar (skill level 5) to DPS
 *   node .claude/skills/balance/balance-sim.mjs --out reports/balance-report.md
 *
 * Nothing is copied from the game: heroes are real Player objects (js/player.js) with stats spent and gear
 * equipped through the Bag; monsters and bosses come from EnemyManager.spawn / spawnBoss; each class's
 * J / K / L action is fired through its kit, and the projectiles run through the real ProjectileManager
 * against a dummy target until they expire. Monster hits go through EnemyManager.hitTarget → takeDamage.
 * So any change to a formula, a kit, a monster or an item shows up here.
 *
 * Assumptions (state them when you quote numbers): 1 v 1, target stands still in range, every action is used
 * on cooldown, no skill-tree points (except --familiar), no potions, day time, normal-tier monsters (Champion ×2 HP ×1.2 dmg,
 * Elite ×3.5 HP ×1.35 dmg), the Archer's quiver reload and the Priest's angels/heals are not modelled,
 * area-of-effect skills are counted on one target, monster attack interval = windup (36 frames) + 1.
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { load, seedRandom, ROOT } = await import(path.join(HERE, "../../../scripts/headless.mjs"));

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const AREA = opt("--area", null);
const LEVEL_SHIFT = parseInt(opt("--level", "0"), 10) || 0;
const GEAR = opt("--gear", "best");
const OUT = opt("--out", null);
const BUILD = opt("--build", null);
const FAMILIAR_LV = parseInt(opt("--familiar", "0"), 10) || 0;
const TRIALS = 12;

seedRandom(2026);
const { Player, expFor } = await load("js/player.js");
const { EnemyManager, HUB_KINDS } = await load("js/enemy.js");
const { ProjectileManager } = await load("js/projectiles.js");
const { MONSTERS, BOSSES } = await load("js/bestiary.js");
const { PLATFORMS, PLATFORM_ORDER } = await load("js/world/platforms.js");
const { PRIMARY, autoAllocate } = await load("js/skills.js");
const { FAMILIARS, familiarDamage } = await load("js/summons/familiar.js");
const { elementMult } = await load("js/elements.js");
const { damageTakenMult } = await load("js/monsterTiers.js");
const FAMILIAR_OF = { novice: "slime", knight: "hound", mage: "owl", fighter: "fox" };
const { codexItems, describe, canEquip } = await load("js/items/itemdb.js");
const { getNovice } = await load("js/classes/novice.js");
const { DEFAULT_CONFIG } = await load("js/avatar/options.js");
const KITS = {
  novice: getNovice(DEFAULT_CONFIG),
  knight: (await load("js/classes/knight.js")).KnightClass,
  mage: (await load("js/classes/mage.js")).MageClass,
  priest: (await load("js/classes/priest.js")).PriestClass,
  archer: (await load("js/classes/archer.js")).ArcherClass,
  fighter: (await load("js/classes/fighter.js")).FighterClass
};

// FX / loot stand-ins: accept any call
const noop = new Proxy({}, { get: (t, p) => (p === "consumeHitStop" ? () => false : () => {}) });

// ── Areas ────────────────────────────────────────────────────────────────────
// Aethelgard hub (tier 0, Lv 1–8): Novice at Lv 5, classes from the Lv 10 Job Awakening.
// Platforms: hero at the Act's level floor + 3 (middle of the band).
const areas = [{ id: "hub", name: "Aethelgard plains", tier: 0, kinds: HUB_KINDS, boss: null }];
for (const id of PLATFORM_ORDER || Object.keys(PLATFORMS)) {
  const p = PLATFORMS[id];
  if (p) areas.push({ id, name: `Act ${p.act} ${p.name.en}`, tier: p.tier, kinds: p.monsters, boss: p.boss });
}

function band(area) {
  const em = new EnemyManager(1280, 960);
  em.setArea({ id: area.id }, area.kinds, area.tier);
  return { em, floor: em.levelFloor, cap: em.levelCap };
}

// ── Heroes ───────────────────────────────────────────────────────────────────

const ALL_EQUIP = codexItems().equip;
const SLOTS_FILL = ["head", "armor", "garment", "gloves", "boots", "amulet", "ring1", "ring2"];
const score = (it) => { const s = it.stats || {}; return (s.def || 0) * 3 + (s.hp || 0) * 0.5 + (s.atk || 0) * 2 + (s.vit || 0) + (s.str || 0) + (s.int || 0) + (s.dex || 0) + (s.crit || 0); };

function makeHero(cls, level, grade) {
  const kit = KITS[cls];
  const p = new Player(0, 0, kit);
  p.aimAngle = 0;
  // Levels: the same points the game hands out in addExp
  p.level = level;
  for (let l = 2; l <= level; l++) p.statPoints += 3 + Math.floor(l / 5);
  p.skillPoints = level - 1;
  // Spend stats: primary and VIT about 2:1 (a common build); DEX gets every fourth point for ranged classes
  const prim = PRIMARY[cls] || "str";
  if (BUILD) {
    // Auto stat path (js/skills.js autoAllocate), as the game spends it on level-up
    autoAllocate(p, BUILD === "class" ? prim : BUILD);
  } else {
    const order = [prim, prim, "vit"].concat(cls === "archer" || cls === "fighter" ? ["dex"] : []);
    for (let i = 0, fails = 0; fails < order.length; i++) fails = p.raiseStat(order[i % order.length]) ? 0 : fails + 1;
  }
  // Gear: class kit (weapon/offhand) at the Act's grade, then the best normal-rarity piece per slot
  p.bag.giveKit(cls, cls === "novice" ? 0 : Math.max(1, grade));
  if (GEAR === "best") {
    for (const slot of SLOTS_FILL) {
      const want = slot.startsWith("ring") ? "ring" : slot;
      const best = ALL_EQUIP.filter((it) => it.slot === want && canEquip(it, cls))
        .map((it) => describe({ id: `${it.base}@${grade}` }))
        .sort((a, b) => score(b) - score(a))[0];
      if (best) p.bag.equip[slot] = { id: best.id, qty: 1, plus: 0, rarity: "normal", affixes: [], sockets: 0, cards: [] };
    }
  }
  p.bag.changed && p.bag.changed(true);
  p.recalc();
  p.hp = p.maxHp;
  return p;
}

// ── Measurements ─────────────────────────────────────────────────────────────

/** Damage one use of an action does to a standing target (all ticks and hits, averaged over TRIALS). */
function actionDamage(hero, fn, em, makeTarget) {
  if (!hero.heroData[fn]) return 0;
  let total = 0;
  for (let t = 0; t < TRIALS; t++) {
    const pm = new ProjectileManager(1280, 960);
    const target = makeTarget();
    target.hp = target.maxHp = 1e9;
    em.enemies = [target];
    em.player = hero;
    hero.x = 0; hero.y = 0; hero.aimAngle = 0;
    hero.heroData[fn](hero, target, (proj) => pm.add(proj));
    for (let f = 0; f < 240 && pm.projectiles.length; f++) {
      if (hero.heroData.onUpdate) try { hero.heroData.onUpdate(hero); } catch { /* visual-only state */ }
      pm.update(em.enemies, em, noop, noop, hero);
      target.x = 30; target.y = 0;            // stays put in front of the hero
      target.hitTimer = 0; target.stunTimer = 0;
    }
    total += 1e9 - target.hp;
  }
  return total / TRIALS;
}

const frames = (hero) => ({
  J: Math.round((hero.heroData.attackCooldown || 22) * (1 - hero.aspd) * (1 - hero.cdr * 0.5)),
  K: Math.round((hero.heroData.cooldown || 180) * Math.max(0.3, 1 - hero.cdr)),
  L: Math.round((hero.heroData.cooldown2 || 120) * Math.max(0.3, 1 - hero.cdr))
});

/** Net damage a hit from `e` does to the hero, averaged. */
function hitOnHero(em, e, hero) {
  let sum = 0;
  for (let t = 0; t < TRIALS; t++) {
    hero.hp = 1e9; hero.hitFlashTimer = 0; hero.invulnTimer = 0; hero.guardTimer = 0;
    em.hitTarget(e, hero, hero, null, e.damage);
    sum += 1e9 - hero.hp;
  }
  hero.hp = hero.maxHp;
  return sum / TRIALS;
}
const MONSTER_CYCLE = 37;   // frames between monster hits (windupFor(e, 36) + 1)

function fight(hero, area, em, key, level, boss = false) {
  em.night = 0;
  const spawn = () => {
    em.enemies = [];
    const e = boss ? em.spawnBoss(key, 30, 0, hero.level) : em.spawn(key, hero.level, 30, 0, null, "normal", level);
    if (!boss) { e.variant = null; e.element = e.kind.element || "neutral"; e.mods = []; }
    return e;
  };
  const sample = spawn();
  const hp = sample.maxHp;
  const fr = frames(hero);
  const dmg = { J: actionDamage(hero, "onAttack", em, spawn), K: actionDamage(hero, "onSkill", em, spawn), L: actionDamage(hero, "onSkill2", em, spawn) };
  let dps = 60 * (dmg.J / fr.J + dmg.K / fr.K + dmg.L / fr.L);
  // Familiar (js/summons/familiar.js): its bite through EnemyManager.damage, on its own cooldown
  const fam = FAMILIAR_LV && FAMILIAR_OF[hero.heroData.id];
  if (fam) {
    // EnemyManager.damage without a hero: element × tier modifiers only (no RNG, so other rows don't shift)
    const hit = familiarDamage(fam, hero.level, FAMILIAR_LV) * elementMult(FAMILIARS[fam].elem, sample.element || "neutral") * damageTakenMult(sample);
    dps += (60 * hit) / FAMILIARS[fam].cd;
  }
  const taken = hitOnHero(em, sample, hero);
  const ttk = dps > 0 ? hp / dps : Infinity;
  const hitsToDie = Math.ceil(hero.maxHp / Math.max(1, taken));
  const ttd = (hitsToDie * MONSTER_CYCLE) / 60;
  return { key, level, hp, dmgJ: dmg.J, dps, ttk, monDmg: sample.damage, taken, hitsToDie, ttd, ratio: ttd / ttk, element: sample.element };
}

// ── Run ──────────────────────────────────────────────────────────────────────

const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : "∞");
const f0 = (x) => (Number.isFinite(x) ? String(Math.round(x)) : "∞");
const out = [];
const say = (s = "") => { out.push(s); };

say(`# Balance report (${new Date().toISOString().slice(0, 10)})`);
say("");
say(`Generated by \`node .claude/skills/balance/balance-sim.mjs${args.length ? " " + args.join(" ") : ""}\`. 1 v 1, target in range, every action on cooldown, gear: ${GEAR === "best" ? "best normal piece per slot at the Act's grade" : "class kit + starter clothes"}, stats: ${BUILD ? `auto path ${BUILD}` : "main stat + VIT 2:1"}, ${FAMILIAR_LV ? `familiar skill Lv ${FAMILIAR_LV}` : "no skill-tree points"}, day time.`);
say("**Fights per life** = seconds the hero survives one same-band normal monster ÷ seconds to kill it. Above ~3 feels safe; below 1 the hero loses a straight 1 v 1. **Kills/Lv** = same-level normal kills for the next level.");
say("");

const classesFor = (area) => (area.id === "hub" ? ["novice", "knight", "mage", "priest", "archer", "fighter"] : ["knight", "mage", "priest", "archer", "fighter"]);

for (const area of areas.filter((a) => !AREA || a.id === AREA)) {
  const { em, floor, cap } = band(area);
  const mid = Math.round((floor + cap) / 2);
  say(`## ${area.name} — monsters Lv ${floor}–${cap}${area.boss ? `, boss ${BOSSES[area.boss].name.en} Lv ${cap + 2}` : ""}`);
  say("");
  if (!AREA) {
    say("| Class | Lv | HP | DEF | J dmg | DPS | Mon HP | TTK s | Hit taken | Hits to die | Fights/life | Kills/Lv | Boss TTK s | Boss hits to die |");
    say("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  }
  const ratios = [];
  for (const cls of classesFor(area)) {
    const level = Math.max(1, (area.id === "hub" ? (cls === "novice" ? 5 : 10) : floor + 3) + LEVEL_SHIFT);
    const hero = makeHero(cls, level, area.tier);
    const rows = area.kinds.filter((k) => MONSTERS[k]).map((k) => fight(hero, area, em, k, Math.min(cap, Math.max(floor, level))));
    const avg = (f) => rows.reduce((s, r) => s + r[f], 0) / rows.length;
    const ratio = avg("ttd") / avg("ttk");
    ratios.push([cls, ratio]);
    const e = 25 + level * 8;   // EnemyManager.kill at diff 0, normal tier
    const kills = expFor(level) / e;
    let boss = null;
    if (area.boss) boss = fight(hero, area, em, area.boss, cap + 2, true);
    if (AREA) {
      say(`### ${cls} Lv ${level}: HP ${hero.maxHp}, DEF ${hero.defense}, ATK ${hero.attack}, crit ${(hero.crit * 100).toFixed(0)}%, CDR ${(hero.cdr * 100).toFixed(0)}%, ASPD ${(hero.aspd * 100).toFixed(0)}%`);
      say("");
      say("| Monster | Elem | Lv | HP | J dmg | DPS | TTK s | Mon dmg | Hit taken | Hits to die | Fights/life |");
      say("|---|---|---|---|---|---|---|---|---|---|---|");
      for (const r of boss ? [...rows, { ...boss, key: `${boss.key} (boss)` }] : rows) {
        say(`| ${r.key} | ${r.element} | ${r.level ?? cap + 2} | ${r.hp} | ${f0(r.dmgJ)} | ${f1(r.dps)} | ${f1(r.ttk)} | ${r.monDmg} | ${f1(r.taken)} | ${r.hitsToDie} | ${f1(r.ratio)} |`);
      }
      say("");
    } else {
      say(`| ${cls} | ${level} | ${hero.maxHp} | ${hero.defense} | ${f0(avg("dmgJ"))} | ${f1(avg("dps"))} | ${f0(avg("hp"))} | ${f1(avg("ttk"))} | ${f1(avg("taken"))} | ${f0(avg("hitsToDie"))} | ${f1(ratio)} | ${f1(kills)} | ${boss ? f1(boss.ttk) : "—"} | ${boss ? boss.hitsToDie : "—"} |`);
    }
  }
  const valid = ratios.filter(([, r]) => Number.isFinite(r) && r > 0);
  if (valid.length > 1) {
    const hi = valid.reduce((a, b) => (b[1] > a[1] ? b : a)), lo = valid.reduce((a, b) => (b[1] < a[1] ? b : a));
    say("");
    say(`Class spread: ${hi[0]} ${f1(hi[1])} vs ${lo[0]} ${f1(lo[1])} fights per life (×${f1(hi[1] / lo[1])}).`);
  }
  say("");
}

const text = out.join("\n");
console.log(text);
if (OUT) { fs.mkdirSync(path.dirname(path.join(ROOT, OUT)), { recursive: true }); fs.writeFileSync(path.join(ROOT, OUT), text + "\n"); console.error(`wrote ${OUT}`); }
