import assert from "node:assert/strict";
import { load } from "./headless.mjs";
const { Player } = await load("js/player.js");
const { GuildBook, guildContracts } = await load("js/guild.js");
const { GuildField } = await load("js/guildfield.js");
const { EnemyManager } = await load("js/enemy.js");
const { GUILD_NPCS } = await load("js/guilddata.js");
const p = new Player(0, 0, { id: "knight" }), book = new GuildBook(), field = new GuildField(book);
book.state(p).member = true; p.bag.add("guildPlate");
const stage = { id: "hub", bounds: { minX: 0, minY: 0, maxX: 1500, maxY: 1000 }, isInsideSafeZone: () => false };
const ctx = { stage, quest: { unlocked: () => true } };
const clerk = () => { p.x = GUILD_NPCS.guildClerk.x - 10; p.y = GUILD_NPCS.guildClerk.y - 10; };
const accept = id => { clerk(); if (p.guild.active) book.abandon(p, ctx); assert.deepEqual(book.accept(p, ctx, id), {}); };
const manager = { enemies: [], kinds: ["slime"], spawn(key, level, x, y) { const e = { key, x, y, isAlive: true, maxHp: 100, hp: 100, damage: 10 }; this.enemies.push(e); return e; } };
const formats = guildContracts().filter(c => c.rank === "G");
assert.deepEqual(new Set(formats.map(c => c.t)), new Set(["cull", "champion", "mvp", "gather", "escort"]));
assert.deepEqual(formats.filter(c => c.t === "gather").map(c => c.source), ["enemy", "herb", "stone", "npc"]);
accept("G:0"); assert.equal(book.progress(p, "hub", { elite: true }), false); assert.equal(book.progress(p, "hub", {}), true);
accept("G:1"); assert.equal(book.progress(p, "hub", {}), false); assert.equal(book.progress(p, "hub", { elite: true }), true);
accept("G:8"); assert.equal(book.progress(p, "hub", { elite: true }), false); field.prepare(p, stage, manager);
const mvp = manager.enemies.find(e => e.guildMvp); assert.ok(mvp); assert.equal(mvp.hp, 300); assert.equal(book.progress(p, "hub", mvp), true);
accept("G:4"); field.prepare(p, stage, manager);
assert.equal(book.collect(p, "hub", "herb", "enemy"), false);
assert.equal(book.collect(p, "canopy", "herb", "herb"), false);
for (const n of field.nodes) { p.x = n.x - 10; p.y = n.y - 20; field.update(p, stage, manager); }
const herbCount = book.objective(p).n; assert.equal(p.guild.active.have, herbCount); assert.equal(p.bag.count("herb"), herbCount);
clerk(); assert.ok(book.claim(p, ctx).reward); assert.equal(p.bag.count("herb"), 0);
accept("G:3"); const loot = { items: [], drop(pos, inst) { this.items.push({ ...pos, ...inst }); } };
field.onKill(p, stage, { x: 10, y: 10 }, loot); assert.equal(loot.items[0].guildSource, "enemy");
assert.equal(book.collect(p, "hub", loot.items[0].id, "enemy"), true);
accept("G:6"); assert.equal(field.supply(p, stage, { id: "guildClerk" }), false);
assert.equal(field.goal(p, stage, manager, { find: id => ({ id, x: 20, y: 30 }) }, { items: [] }).npc.id, "guildScout");
assert.equal(field.supply(p, stage, { id: "guildScout" }), "supplied"); assert.equal(p.guild.active.have, book.objective(p).n);
assert.equal(field.goal(p, stage, manager, { find: id => ({ id, x: 20, y: 30 }) }, { items: [] }).npc.id, "guildClerk");
clerk(); assert.ok(book.claim(p, ctx).reward); assert.equal(p.bag.count("salve"), 0);
accept("G:7"); field.update(p, stage, manager); const s = p.guild.active.escort;
const start = { x: s.x, y: s.y }; p.x = 1400; p.y = 900;
for (let i = 0; i < 20; i++) field.update(p, stage, manager);
assert.deepEqual({ x: s.x, y: s.y }, start, "caravan waits for guide");
p.x = s.x; p.y = s.y; field.update(p, stage, manager); assert.equal(s.fighting, true);
assert.ok(manager.enemies.some(e => e.isAlive && e.guildEscortTarget === s));
// Real enemy damage consumes defence before health, then unprotected damage consumes health.
EnemyManager.prototype.hitTarget.call({ night: 0 }, { st: {}, mods: [] }, s, p, null, 50);
assert.equal(s.defence, 70); assert.equal(s.hp, 280);
const saved = JSON.parse(JSON.stringify(p.guild)), restored = new Player(0, 0, { id: "knight" }); book.load(restored, saved);
assert.equal(restored.guild.active.escort.hp, 280); assert.equal(restored.guild.active.escort.fighting, true);
for (let i = 0; i < 6000 && !p.guild.active.have; i++) {
  for (const e of manager.enemies) if (e.guildContract) e.isAlive = false;
  p.x = s.x; p.y = s.y; field.update(p, stage, manager);
}
assert.equal(p.guild.active.have, 1); assert.equal(s.wave, book.objective(p).waves); assert.equal(s.leg, 2);
clerk(); book.abandon(p, ctx); accept("G:7"); field.update(p, stage, manager);
assert.notEqual(field.wagon, s, "reaccepting resets field state");
field.wagon.hp = 0; field.update(p, stage, manager); assert.equal(field.wagon.failed, true); assert.equal(p.guild.active.have, 0);
console.log("Guild formats: tier-specific hunts/MVP, source-aware gathering/delivery, NPC supplies, escort waves/guide/damage/failure/save/reaccept passed");
const { Stage } = await load("js/stage.js");
const realStage = new Stage(), realField = new GuildField(book);
accept("G:7"); realField.prepare(p, realStage, manager);
const originalBuild = realField.navigator.build.bind(realField.navigator); let frame = 0;
realField.navigator.build = (stage, actor) => originalBuild(stage, actor, frame * 17);
for (; frame < 16000 && !p.guild.active.have; frame++) {
  for (const e of manager.enemies) if (e.guildContract) e.isAlive = false;
  p.x = realField.wagon.x; p.y = realField.wagon.y; realField.update(p, realStage, manager);
}
assert.equal(p.guild.active.have, 1, "caravan completes its physical route through real hub obstacles");
console.log(`Real hub caravan route completed in ${frame} frames`);
