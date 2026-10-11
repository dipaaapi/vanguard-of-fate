import assert from "node:assert/strict";
import { load } from "./headless.mjs";
const { AdventureNavigator, AutoAdventure, matchesObjective, routeExit } = await load("js/autoadventure.js");
const { footBlocked } = await load("js/world/nav.js");
const cols = 20, rows = 20, solid = new Uint8Array(cols * rows);
// Wall with an opening far from the direct line to the goal.
for (let y = 0; y < 15; y++) solid[y * cols + 9] = 1;
const stage = { id: "hub", width: 320, height: 320, tilemap: { cols, rows, solid,
  inBounds: (x, y) => x >= 0 && y >= 0 && x < cols && y < rows, idx: (x, y) => y * cols + x },
  bounds: { minX: 0, minY: 0, maxX: 290, maxY: 290 } };
const nav = new AdventureNavigator(), p = { x: 46, y: 44 };
const goal = { x: 248, y: 64 };
let visitedOpening = false;
for (let frame = 0; frame < 1500 && Math.hypot(p.x + 10 - goal.x, p.y + 20 - goal.y) > 8; frame++) {
  nav.build(stage, p, frame * 17);
  const dir = nav.direction(p, goal, 8);
  assert.ok(dir, `goal must remain reachable at ${frame}: ${p.x},${p.y}, start ${nav.start}`);
  p.x += dir[0] * 2; p.y += dir[1] * 2;
  assert.equal(footBlocked(stage, p.x + 10, p.y + 20), false, `route must preserve foot clearance at frame ${frame}, ${p.x},${p.y}; dir ${dir}`);
  if (p.y + 20 > 240) visitedOpening = true;
}
assert.ok(visitedOpening);
assert.ok(Math.hypot(p.x + 10 - goal.x, p.y + 20 - goal.y) <= 8);
// Zone art has a larger foot collision than trees. Route around that too.
stage.barracks = { solids: [{ x: 70, y: 30, w: 40, h: 65 }] };
const zoneNav = new AdventureNavigator(); zoneNav.build(stage, { x: 40, y: 40 }, 0);
assert.equal(zoneNav.clear({ x: 50, y: 60 }, { x: 130, y: 60 }), false);
const e = { isAlive: true, key: "wolf", kind: {} };
assert.equal(matchesObjective(e, { t: "hunt", k: "wolf" }), true);
assert.equal(matchesObjective(e, { t: "elite", k: "wolf" }), false);
assert.equal(matchesObjective({ ...e, elite: true }, { t: "elite", k: "wolf" }), true);
assert.equal(matchesObjective({ ...e, boss: true }, { t: "cull" }), false);
assert.equal(matchesObjective({ ...e, minionOf: "summon" }, { t: "cull" }), false);
assert.equal(matchesObjective({ ...e, kind: { flying: true } }, { t: "sky" }), true);
const hub = { portals: { portals: [{ dest: "rocky", x: 220, y: 914 }] } };
const quest = { unlocked: id => id === "rocky" };
assert.equal(routeExit(stage, "rocky", quest, hub).dest, "rocky");
assert.equal(routeExit(stage, "maw", quest, hub), null, "locked Acts must stay locked");
const auto = new AutoAdventure();
const ctx = { stage, player: { ...p, hp: 100, maxHp: 100, heroData: { id: "novice" }, kit: { range: 60 }, bag: { slots: [], has: () => false } },
  quest: { step: 1, unlocked: quest.unlocked, gated: () => true, side: { current: () => ({ t: "scout", area: "hub" }), site: () => goal } },
  npcs: { find: () => null }, enemies: [], loot: { items: [] }, hub, finalStep: 34 };
assert.equal(auto.update(ctx, 0).status, "scout");
ctx.quest.step = 34;
assert.equal(auto.update(ctx, 300).done, true);
ctx.quest.step = 1;
ctx.player.bag.slots = Array(40).fill({ id: "salve" });
ctx.loot.items = [{ x: p.x, y: p.y, quest: true, inst: { id: "heartstone" } }];
assert.equal(auto.update(ctx, 600).status, "bagFull");
ctx.loot.items = [];
ctx.quest.side.current = () => ({ t: "scout", area: "maw" });
assert.equal(auto.update(ctx, 1000).halted, false);
assert.equal(auto.update(ctx, 10999).halted, false);
assert.equal(auto.update(ctx, 11000).halted, true, "unreachable route must stop consuming the allowance");
const { Platform } = await load("js/world/platform.js");
const coast = new Platform("coast"), boat = coast.boatSystem;
const sailor = { x: boat.dockedBoat.x, y: boat.dockedBoat.y };
boat.embark(sailor);
const seaNav = new AdventureNavigator();
let arrived = false;
for (let frame = 0; frame < 2000; frame++) {
  seaNav.build(coast, sailor, frame * 17);
  const dir = seaNav.direction(sailor, boat.monolith, 48);
  assert.ok(dir, "Monolith must be reachable from the real pier");
  const dx = Math.abs(dir[0]) > .2 ? Math.sign(dir[0]) : 0;
  const dy = Math.abs(dir[1]) > .2 ? Math.sign(dir[1]) : 0;
  const n = Math.hypot(dx, dy) || 1;
  sailor.x = Math.max(coast.bounds.minX, Math.min(coast.bounds.maxX, sailor.x + dx / n * 2));
  sailor.y = Math.max(coast.bounds.minY, Math.min(coast.bounds.maxY, sailor.y + dy / n * 2));
  boat.carry(sailor);
  assert.ok(boat.hullWet(sailor.x + 10, sailor.y + 21, boat.heading), "sailing must keep the entire hull afloat");
  if (Math.hypot(sailor.x + 10 - boat.monolith.x, sailor.y + 20 - boat.monolith.y) < 49) { arrived = true; break; }
}
assert.ok(arrived, "autonomous steering must reach the Monolith without running aground");
console.log("Auto-adventure: wall/zone and boat navigation, objective filters, scouting, blocked/full-bag stops and completion passed");

// Empty Aethelgard must patrol outside sanctuaries rather than stop at map centre.
const { Stage } = await load("js/stage.js");
const field = new Stage(), patrol = new AutoAdventure(), z = field.safeZone;
const walker = { x: z.x + z.w / 2 - 10, y: z.y + z.h / 2 - 20, kit: { range: 60 } };
const searchCtx = { stage: field, player: walker, enemies: [], now: 0 };
patrol.navigator.build(field, walker, 0);
const first = patrol.hunt(searchCtx, { t: "hunt", k: "ursath" });
assert.equal(first.status, "search");
assert.equal(field.isInsideSafeZone(first.point.x - 10, first.point.y - 20), false);
assert.equal(patrol.hunt({ ...searchCtx, now: 15000 }, { t: "hunt", k: "ursath" }).point, first.point, "walking goal stays stable");
let arrivedAtFirst = false, leftCamp = false;
for (let frame = 0; frame < 2000; frame++) {
 patrol.navigator.build(field, walker, frame * 17);
 const goal = patrol.hunt({ ...searchCtx, now: frame * 17 }, { t: "hunt", k: "ursath" });
 if (goal.point !== first.point) { arrivedAtFirst = true; break; }
 const dir = patrol.navigator.direction(walker, goal.point, goal.radius);
 assert.ok(dir, "real hub hunting site must be reachable");
 walker.x += dir[0] * 1.5; walker.y += dir[1] * 1.5;
 leftCamp ||= !field.isInsideSafeZone(walker.x, walker.y);
}
assert.ok(leftCamp && arrivedAtFirst, "leave camp and select another patrol destination after arrival");
console.log("PASS: empty Aethelgard patrol leaves sanctuary, keeps stable routes and continues searching");

// Act XI must recover a missed seal instead of trying the Monolith forever.
const recovery=new AutoAdventure(),missingCtx={...ctx,stage,player:{...ctx.player,bag:{slots:[],has:id=>id!=="sylvanSeal"}},
 quest:{step:20,gated:()=>false,currentPlatform:()=>"strand",cleared:()=>true,unlocked:()=>true,monolith:false}};
recovery.travel=(ctx,id)=>({status:"travel",destination:id});
assert.equal(recovery.choose(missingCtx).destination,"canopy");
console.log("PASS: missing Seal Stone recovery takes priority before Monolith travel");
