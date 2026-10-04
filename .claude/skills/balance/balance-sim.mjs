#!/usr/bin/env node
/**
 * balance-sim — measures Vanguard of Fate's combat balance headless, with the game's own code.
 *
 *   node .claude/skills/balance/balance-sim.mjs                 # summary: every class × every area
 *   node .claude/skills/balance/balance-sim.mjs --area frost    # one area, one row per monster
 *   node .claude/skills/balance/balance-sim.mjs --level +2      # heroes 2 levels above the default
 *   node .claude/skills/balance/balance-sim.mjs --gear kit      # kit weapon + starter clothes only
 *   node .claude/skills/balance/balance-sim.mjs --gear best     # best normal piece per slot at the Act's grade (the old drop gear)
 *                                                               # default: craft = the crafted set of the hero's tier and class path
 *   node .claude/skills/balance/balance-sim.mjs --economy       # + gold and crafting materials per kill, kills per crafted set, upkeep
 *   node .claude/skills/balance/balance-sim.mjs --units         # + mercenaries and the Archer's/Priest's companions against the band
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
 * Elite ×3.5 HP ×1.35 dmg), the Archer's quiver reload is spread over its shots and its K is the real falcon dive; the Priest's two Guardian Angels
 * (real GuardianAngelCompanion AI) count in its DPS and its J heal in its survival (monsters hitting the angels first is not),
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
const GEAR = opt("--gear", "craft");
const OUT = opt("--out", null);
const BUILD = opt("--build", null);
const FAMILIAR_LV = parseInt(opt("--familiar", "0"), 10) || 0;
const TRIALS = 12;
const ECON = args.includes("--economy");
const UNITS = args.includes("--units");

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
const { craftSlots, pieceFor, tierForLevel, setIdFor } = await load("js/items/crafting.js");
const { GuardianAngelCompanion } = await load("js/summons/angel.js");
const { LootManager } = await load("js/loot.js");
const { rollTier } = await load("js/monsterTiers.js");
const { CRAFT_TIERS, recipeFor, PATHS } = await load("js/items/craftsets.js");
const { buyPrice, baseSellPrice } = await load("js/items/economy.js");
const { WEAR_WEAPON, WEAR_ARMOR, ARMOR_SLOTS } = await load("js/items/durability.js");
const { MercenaryManager, MERC_CLASSES } = await load("js/mercenaryManager.js");
const { FalconCompanion } = await load("js/summons/falcon.js");
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
const CLASS_PATH = { novice: "str", knight: "str", fighter: "str", archer: "dex", mage: "int", priest: "int" };
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
  if (GEAR === "craft" && tierForLevel(level)) {
    // The crafted set of the hero's tier in the class's own path (Lv 10 / 25 / 50 …), every piece worn
    const setId = setIdFor(CLASS_PATH[cls], tierForLevel(level));
    for (const slot of craftSlots(cls)) {
      const inst = pieceFor(cls, setId, slot);
      if (slot === "ring") { p.bag.equip.ring1 = { ...inst }; p.bag.equip.ring2 = { ...inst }; } else p.bag.equip[slot] = inst;
    }
    if (describe(p.bag.equip.weapon).hands === 2) p.bag.equip.offhand = null;
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

// Archer: every maxArrows shots the quiver reloads (reloadDuration frames), spread over the shots
const quiver = (hero) => (hero.maxArrows ? (hero.heroData.reloadDuration || 0) / hero.maxArrows : 0);
const frames = (hero) => ({
  J: Math.round((hero.heroData.attackCooldown || 22) * (1 - hero.aspd) * (1 - hero.cdr * 0.5) + quiver(hero)),
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

/** Archer K: main.js sends the FalconCompanion to dive the nearest foe. Damage of one dive. */
function falconDive(hero, em, makeTarget) {
  let total = 0;
  for (let t = 0; t < TRIALS; t++) {
    const target = makeTarget();
    target.hp = target.maxHp = 1e9;
    em.enemies = [target];
    em.player = hero;
    const f = new FalconCompanion(hero.x, hero.y);
    f.triggerStrike(target, target.x, target.y);
    for (let k = 0; k < 120 && !f.damageDealt; k++) { f.update(hero, em, noop, noop); target.x = 30; target.y = 0; }
    total += 1e9 - target.hp;
  }
  return total / TRIALS;
}

/** Priest K: main.js keeps up to two Guardian Angels (K every 3 s, 12 s life); both fight the target. DPS of the pair. */
function angelDps(hero, em, makeTarget) {
  const FR = 600, N = 4;
  let total = 0;
  for (let t = 0; t < N; t++) {
    const target = makeTarget();
    target.hp = target.maxHp = 1e9;
    em.enemies = [target];
    em.player = hero;
    const hp = Math.round(hero.maxHp * 0.5);
    const angels = [new GuardianAngelCompanion(hero.x - 30, hero.y - 16, hp), new GuardianAngelCompanion(hero.x + 30, hero.y - 16, hp)];
    for (let f = 0; f < FR; f++) {
      angels.forEach((a, i) => a.update(hero, em, noop, noop, i, false));
      target.x = 30; target.y = 0; target.hitTimer = 0; target.stunTimer = 0;
    }
    total += 1e9 - target.hp;
  }
  return total / N / (FR / 60);
}

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
  const priest = hero.heroData.id === "priest";
  if (priest) dmg.K = 0;                   // the kit's K only books the angels; main.js spawns the real ones (below)
  if (hero.heroData.id === "archer") dmg.K = falconDive(hero, em, spawn);
  let dps = 60 * (dmg.J / fr.J + dmg.K / fr.K + dmg.L / fr.L) + (priest ? angelDps(hero, em, spawn) : 0);
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
  // Priest J = Priority Heal (10% max HP): survival is the HP pool over intake minus healing
  const healPerSec = priest ? (0.1 * hero.maxHp * (hero.healMult || 1) * 60) / fr.J : 0;
  const intakePerSec = (taken * 60) / MONSTER_CYCLE;
  const ttd = priest ? (intakePerSec > healPerSec ? hero.maxHp / (intakePerSec - healPerSec) : Infinity) : (hitsToDie * MONSTER_CYCLE) / 60;
  return { key, level, hp, dmgJ: dmg.J, dps, ttk, monDmg: sample.damage, taken, hitsToDie, ttd, ratio: ttd / ttk, element: sample.element };
}

// ── Run ──────────────────────────────────────────────────────────────────────

const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : "∞");
const f0 = (x) => (Number.isFinite(x) ? String(Math.round(x)) : "∞");
const out = [];
const say = (s = "") => { out.push(s); };

say(`# Balance report (${new Date().toISOString().slice(0, 10)})`);
say("");
say(`Generated by \`node .claude/skills/balance/balance-sim.mjs${args.length ? " " + args.join(" ") : ""}\`. 1 v 1, target in range, every action on cooldown, gear: ${GEAR === "best" ? "best normal piece per slot at the Act's grade" : GEAR === "craft" ? "the crafted set of the hero's tier in the class's path (kit below Lv 10)" : "class kit + starter clothes"}, stats: ${BUILD ? `auto path ${BUILD}` : "main stat + VIT 2:1"}, ${FAMILIAR_LV ? `familiar skill Lv ${FAMILIAR_LV}` : "no skill-tree points"}, day time.`);
say("**Fights per life** = seconds the hero survives one same-band normal monster ÷ seconds to kill it. Above ~3 feels safe; below 1 the hero loses a straight 1 v 1. **Kills/Lv** = same-level normal kills for the next level.");
say("");

const studies = [];
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
  const samples = [];
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
    if (cls !== "novice") samples.push({ cls, hero, ttk: avg("ttk"), intake: (avg("taken") * 60) / MONSTER_CYCLE, priest: cls === "priest", frJ: frames(hero).J });
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
  if (area.id !== "hub" || !AREA) studies.push({ area, em, floor, cap, samples });
  const valid = ratios.filter(([, r]) => Number.isFinite(r) && r > 0);
  if (valid.length > 1) {
    const hi = valid.reduce((a, b) => (b[1] > a[1] ? b : a)), lo = valid.reduce((a, b) => (b[1] < a[1] ? b : a));
    say("");
    say(`Class spread: ${hi[0]} ${f1(hi[1])} vs ${lo[0]} ${f1(lo[1])} fights per life (×${f1(hi[1] / lo[1])}).`);
  }
  say("");
}

if (ECON) economyReport();
if (UNITS) unitsReport();

const text = out.join("\n");
console.log(text);
if (OUT) { fs.mkdirSync(path.dirname(path.join(ROOT, OUT)), { recursive: true }); fs.writeFileSync(path.join(ROOT, OUT), text + "\n"); console.error(`wrote ${OUT}`); }

// ── Economy (--economy) ──────────────────────────────────────────────────────
// Kills drawn like the game: a random monster of the area at a random band level, its tier from rollTier,
// loot from the real LootManager.spawnLoot (gold + rollDrop). Upkeep per kill from the combat rows above:
// HP lost (TTK × damage taken per second, priests heal themselves) paid in Red Potions, and repairs
// (weapon wear per hit landed, armor wear per hit taken) at the worn set's repair cost.
function economyReport() {
  const KILLS = 3000;
  const salve = describe({ id: "salve" });
  // gold per HP for a hero of that max HP (potions heal heal or healPct × max HP, whichever is more)
  const potionGFor = (maxHp) => buyPrice("apothecary", "salve", salve) / Math.max(salve.effect.heal, Math.round(maxHp * (salve.effect.healPct || 0)));
  const potionG = potionGFor(0);
  say("## Economy — gold and materials per kill");
  say("");
  say(`Generated with \`--economy\`: ${KILLS} kills per area (random kind, band level and tier), loot from the real LootManager; upkeep = HP lost per kill paid in Red Potions (${potionG.toFixed(2)} G/HP at base, less once 6% of max HP beats 40) minus the potions that dropped + repairs of the worn crafted set. Priests heal themselves and are left out of upkeep.`);
  say("");
  say("| Area | Hero Lv | Gold/kill | Loot sold/kill | Ore/kill | Cores/kill | Path essence/kill | Upkeep G/kill | Net G/kill | Set (tier) | Set cost | Kills for the set | Merc hire (kills) |");
  say("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const { area, em, floor, cap, samples } of studies) {
    const level = area.id === "hub" ? 10 : floor + 3;
    const lm = new LootManager();
    const tot = { gold: 0, sold: 0 }, mats = {};
    const kinds = area.kinds.filter((k) => MONSTERS[k]);
    for (let k = 0; k < KILLS; k++) {
      const key = kinds[k % kinds.length], kind = MONSTERS[key];
      const lvl = floor + Math.floor(Math.random() * (cap - floor + 1));
      lm.items = [];
      lm.spawnLoot(0, 0, { grade: area.tier, level: lvl, cls: "knight", key, boss: false, tier: rollTier(), diff: lvl - level, element: kind.element, race: kind.race });
      for (const it of lm.items) {
        if (it.type === "gold") { tot.gold += it.amount; continue; }
        const d = describe(it.inst);
        if (!d) continue;
        mats[d.base] = (mats[d.base] || 0) + (it.inst.qty || 1);
        if (!["ore", "core", "essence", "fish", "meat", "spice", "salt"].includes(d.icon)) tot.sold += baseSellPrice(d) * (it.inst.qty || 1);
      }
    }
    const per = (id) => (mats[id] || 0) / KILLS;
    // the set the area's drops build: the highest tier whose ore actually drops here
    const dropped = CRAFT_TIERS.filter((t) => per(t.ore) > 0);
    const c = dropped.length ? dropped[dropped.length - 1] : CRAFT_TIERS[0];
    const fighters = samples.filter((x) => !x.priest);
    // upkeep: HP lost per kill (TTK × intake) and wear on the worn gear
    const hpCost = fighters.reduce((n, x) => n + x.ttk * x.intake * potionGFor(x.hero.maxHp), 0) / fighters.length;
    const repairs = fighters.reduce((n, x) => {
      const hero = x.hero;
      const price = (slot) => { const it = hero.bag.equippedItem(slot); return it ? it.price * 0.6 / 100 : 0; };
      const hitsLanded = (x.ttk * 60) / x.frJ, hitsTaken = (x.ttk * 60) / MONSTER_CYCLE;
      return n + hitsLanded * WEAR_WEAPON * price("weapon") + hitsTaken * WEAR_ARMOR * ARMOR_SLOTS.reduce((m, sl) => m + price(sl), 0);
    }, 0) / fighters.length;
    const upkeep = Math.max(0, hpCost + repairs - per("salve") * buyPrice("apothecary", "salve", salve));
    // A full set of the tier in one path (knight's pieces: 8 slots + a second ring)
    const setId = `str${c.level}`;
    const slots = craftSlots("knight");
    const need = {};
    slots.forEach((slot) => Object.entries(recipeFor(setId, slot)).forEach(([id, n]) => { need[id] = (need[id] || 0) + n * (slot === "ring" ? 2 : 1); }));
    const essId = PATHS.str.essence;
    const essPer = per(essId);
    const killsFor = Math.max(...Object.entries(need).map(([id, n]) => (id === "gold" ? n / Math.max(0.01, tot.gold / KILLS - upkeep) : n / Math.max(1e-6, per(id)))));
    const merc = MercenaryManager.cost(level);
    say(`| ${area.name} | ${level} | ${f1(tot.gold / KILLS)} | ${f1(tot.sold / KILLS)} | ${per(c.ore).toFixed(2)} | ${per(c.core).toFixed(3)} | ${essPer.toFixed(2)} | ${f1(upkeep)} | ${f1(tot.gold / KILLS - upkeep)} | Lv ${c.level} | ${need[c.ore]} ore · ${need[c.core]} cores · ${need[essId]} essence · ${need.gold}G | ${f0(killsFor)} | ${merc}G (${f1(merc / Math.max(0.01, tot.gold / KILLS - upkeep))}) |`);
  }
  say("");
}

// ── Companions (--units) ─────────────────────────────────────────────────────
// Each mercenary hired at the hero's level (MercenaryManager.hire), its attack and skill fired through the
// real kit on cooldown against a same-band normal monster; survival = its HP over that monster's hits.
// Also the Priest's angel pair and one Archer falcon dive, as a share of a same-level monster's HP.
function unitsReport() {
  say("## Companions — mercenaries and summons against the band");
  say("");
  say("| Area | Lv | Unit | HP | DPS | TTK s | Hits to die | Fights/life |");
  say("|---|---|---|---|---|---|---|---|");
  for (const { area, em, floor, cap, samples } of studies) {
    const level = area.id === "hub" ? 10 : floor + 3;
    const kinds = area.kinds.filter((k) => MONSTERS[k]);
    const spawn = (key) => () => { em.enemies = []; const e = em.spawn(key, level, 30, 0, null, "normal", Math.min(cap, Math.max(floor, level))); e.variant = null; e.element = e.kind.element || "neutral"; e.mods = []; return e; };
    for (const type of Object.keys(MERC_CLASSES)) {
      const host = samples[0].hero;
      const mm = new MercenaryManager();
      host.gold = 1e9;
      mm.hire(type, host, noop);
      const m = mm.mercenaries[0], data = m.data;
      let dps = 0, ttk = 0, hits = 0;
      for (const key of kinds) {
        const mk = spawn(key);
        const once = (fn) => {
          let total = 0;
          for (let t = 0; t < 4; t++) {
            const pm = new ProjectileManager(1280, 960);
            const target = mk();
            target.hp = target.maxHp = 1e9;
            em.enemies = [target]; em.player = host;
            m.x = 0; m.y = 0;
            fn(target, (q) => pm.add(q));
            for (let f = 0; f < 240 && pm.projectiles.length; f++) { pm.update(em.enemies, em, noop, noop, host); target.x = 30; target.y = 0; target.hitTimer = 0; target.stunTimer = 0; }
            total += 1e9 - target.hp;
          }
          return total / 4;
        };
        const atk = once((target, sp) => data.onAttack(m, target, mm.scaled(m, em), noop, mm.ownShots(m, sp)));
        const skl = data.onSkill ? once((target, sp) => data.onSkill(m, [target], mm.scaled(m, em), noop, mm.ownShots(m, sp))) : 0;
        const d = 60 * (atk / data.attackCooldownMax + skl / (data.skillCooldownMax || 1e9));
        const sample = mk();
        dps += d; ttk += sample.maxHp / Math.max(1, d); hits += Math.ceil(m.maxHp / Math.max(1, sample.damage));
      }
      const n = kinds.length;
      const ttd = ((hits / n) * MONSTER_CYCLE) / 60;
      say(`| ${area.name} | ${level} | ${data.name} | ${m.maxHp} | ${f1(dps / n)} | ${f1(ttk / n)} | ${f0(hits / n)} | ${f1(ttd / (ttk / n))} |`);
    }
  }
  say("");
}
