import assert from "node:assert/strict";
import fs from "node:fs";
import { load, ROOT } from "./headless.mjs";
const { Player } = await load("js/player.js");
const { GuildBook, guildAssessment, guildContracts } = await load("js/guild.js");
const { GUILD_NPCS, GUILD_RANKS, GUILD_ROLES } = await load("js/guilddata.js");
const { describe, RARITY } = await load("js/items/itemdb.js");
const { findSkill } = await load("js/skills.js");
const { NPCManager } = await load("js/npc/npcs.js");
const { Stage } = await load("js/stage.js");
const book = new GuildBook(), p = new Player(0, 0, { id: "knight" });
const quest = { step: 7, unlocked: id => id === "canopy", summonerAtCitadel: () => false, targetNpc: () => null };
const ctx = { quest, stage: { id: "hub" } };
const at = id => { p.x = GUILD_NPCS[id].x - 10; p.y = GUILD_NPCS[id].y - 10; };
p.level = 10; p.gold = 1000;
at("guildMaster"); quest.step = 6; quest.unlocked = () => false;
assert.equal(book.register(p, ctx).error, "locked");
quest.step = 7; quest.unlocked = id => id === "canopy";
p.gold = 199; assert.equal(book.register(p, ctx).error, "funds"); assert.equal(p.bag.has("guildPlate"), false);
p.gold = 1000; assert.equal(book.register(p, ctx).joined, true); assert.equal(p.gold, 800);
assert.equal(p.guild.rank, "G"); assert.equal(p.guild.role, "frontliner"); assert.ok(p.bag.has("guildPlate"));
at("guildRepresentative"); p.statPoints = 30; p.raiseStat("str"); p.autoStat = "str";
assert.equal(book.reset(p, ctx, "stats").cost, 100); assert.equal(p.gold, 700); assert.equal(p.statPoints, 30); assert.equal(p.autoStat, "off");
assert.equal(book.reset(p, ctx, "stats").error, "noChange"); assert.equal(p.gold, 700);
at("guildClerk"); assert.equal(book.accept(p, ctx, "SSS:0").error, "unavailable"); assert.deepEqual(book.accept(p, ctx, "G:2"), {});
assert.equal(book.resetPrice(p), 50); assert.equal(quest.step, 7, "guild acceptance must not advance the main story");
at("guildRepresentative"); p.skillPoints = 4; p.pathPoints = 6; p.learnSkill("adapt"); p.learnSkill("brawn");
p.autoSkill = true; p.autoPath = "str";
assert.equal(book.reset(p, ctx, "skills").cost, 50); assert.equal(p.skillPoints, 4); assert.equal(p.pathPoints, 5); assert.equal(p.skillLevels.brawn, 1); assert.equal(p.autoSkill, false);
assert.equal(book.reset(p, ctx, "paths").cost, 50); assert.equal(p.pathPoints, 6); assert.equal(p.autoPath, "off");
const remaining = p.gold;
assert.deepEqual(book.losePlate(p, ctx), {}); assert.equal(p.guild.member, true); assert.equal(p.guild.active.id, "G:2");
p.gold = 399; assert.equal(book.replacePlate(p, ctx).error, "funds"); assert.equal(p.bag.has("guildPlate"), false);
p.gold = 2000; assert.equal(book.replacePlate(p, ctx).cost, 400); book.losePlate(p, ctx); assert.equal(book.replacementPrice(p), 800);
assert.equal(book.replacePlate(p, ctx).cost, 800); assert.equal(p.gold, 800);
const c = book.objective(p);
assert.equal(book.progress(p, "canopy", {key:"slime"}), false);
assert.equal(book.progress(p, "hub", {boss:true}), false);
for(let i=0;i<c.n;i++) book.progress(p,"hub",{key:"slime"});
assert.equal(p.guild.active.have, c.n); assert.equal(quest.step, 7);
at("guildClerk"); const beforeSkill=p.skillPoints,beforePath=p.pathPoints;
assert.ok(book.claim(p,ctx).reward); assert.equal(p.skillPoints,beforeSkill+1);assert.equal(p.pathPoints,beforePath);assert.equal(book.resetPrice(p),100);
assert.equal(book.claim(p,ctx).error,"unfinished"); assert.equal(book.accept(p,ctx,"G:2").error,"unavailable");
// Full bags cannot cause partial item rewards or consume registration fees.
book.accept(p,ctx,"G:6");p.guild.active.have=book.objective(p).n;
p.bag.slots=Array.from({length:39},(_,i)=>({id:`broadsword@${i%12}`,qty:20,plus:0,rarity:"normal",sockets:0,affixes:[{k:"atk",v:i}],cards:[]}));
p.bag.slots.unshift({id:"guildPlate",qty:1});
p.bag.slots.push({id:"salve",qty:book.objective(p).n+1});
const before=JSON.stringify(p.bag.slots),gold=p.gold;
assert.equal(book.claim(p,ctx).error,"full");assert.equal(p.gold,gold);assert.equal(JSON.stringify(p.bag.slots),before);assert.equal(p.guild.active.id,"G:6");
// Every rank/class reward resolves to usable game equipment and includes all reward categories.
for(const cls of ["knight","mage","priest","archer","fighter"]){
 const contracts=guildContracts(cls);assert.equal(contracts.length,90);
 for(const q of contracts) for(const item of q.reward.items||[]) assert.ok(describe(item),`${cls}/${q.id}/${item.id}`);
}
assert.equal(GUILD_RANKS.join(","),"G,F,E,D,C,B,A,S,SS,SSS"); assert.equal(Object.keys(GUILD_ROLES).length,5);
assert.ok(describe({id:"broadsword@3",rarity:"mythical"}).stats.atk>describe({id:"broadsword@3",rarity:"epic"}).stats.atk);
assert.ok(RARITY.legendary);
// Automatic learning spends each pool only on its own abilities and honors prerequisites.
const a=new Player(0,0,{id:"mage"});a.level=30;a.skillPoints=20;a.pathPoints=15;a.statPoints=40;a.autoSkill=true;a.autoPath="int";a.autoStat="int";
a.allocateAutomatically();assert.ok(a.stats.int>1);assert.ok(a.skillLevels.insight>0);
const classSpent=Object.entries(a.skillLevels).filter(([id])=>!findSkill(id).path).reduce((n,[,lv])=>n+lv,0);
const pathSpent=Object.entries(a.skillLevels).filter(([id])=>findSkill(id).path).reduce((n,[,lv])=>n+lv,0);
assert.equal(a.skillPoints+classSpent,20);assert.equal(a.pathPoints+pathSpent,15);assert.ok(a.pathSlots.some(Boolean));
const stored=JSON.parse(JSON.stringify(p.guild)), restored=new Player(0,0,{id:"knight"});book.load(restored,stored);assert.deepEqual(restored.guild,p.guild);
assert.equal(guildAssessment(new Player(0,0,{id:"priest"})).role,"support");
const control=new Player(0,0,{id:"mage"});control.stats.int=15;control.skillLevels={frostnova:5,petpal:3};
assert.equal(guildAssessment(control).role,"inflictionist");
const promoted=new Player(GUILD_NPCS.guildMaster.x-10,GUILD_NPCS.guildMaster.y-10,{id:"knight"});
promoted.level=200;Object.keys(promoted.stats).forEach(k=>promoted.stats[k]=99);book.state(promoted).member=true;promoted.bag.add("guildPlate");
book.state(promoted).completed=4;
assert.equal(book.reassess(promoted,ctx).rank,"E","promotions require completed contracts as well as ability");
promoted.level=1;assert.equal(book.reassess(promoted,ctx).rank,"E","a reset must not erase an earned rank");
const stage=new Stage(),npcs=new NPCManager(stage);npcs.build("aurelia");npcs.applyQuest(quest,"knight");
const { setGuildHallOpen } = await load("js/world/guildhall.js");
const { AdventureNavigator } = await load("js/autoadventure.js");
setGuildHallOpen(stage,true);
for(const [id,point] of Object.entries(GUILD_NPCS)) {
 const walker={x:630,y:426},nav=new AdventureNavigator();let arrived=false;
 for(let frame=0;frame<1800;frame++) {
  nav.build(stage,walker,frame*17);const direction=nav.direction(walker,point,20);assert.ok(direction,`${id} must have a physical route`);
  const dx=Math.abs(direction[0])>.2?Math.sign(direction[0]):0,dy=Math.abs(direction[1])>.2?Math.sign(direction[1]):0,n=Math.hypot(dx,dy)||1;
  walker.x+=dx/n*2;walker.y+=dy/n*2;stage.resolveTileCollision(walker);
  if(Math.hypot(walker.x+10-point.x,walker.y+20-point.y)<21){arrived=true;break;}
 }
 assert.ok(arrived,`walk to ${id} must not become stuck against the hall`);
}
for(const id of Object.keys(GUILD_NPCS)) assert.ok(npcs.find(id),`${id} must be placed and visible after unlock`);
quest.unlocked=()=>false;npcs.applyQuest(quest,"knight");for(const id of Object.keys(GUILD_NPCS))assert.equal(npcs.find(id),null);
const art=JSON.parse(fs.readFileSync(`${ROOT}/assets/ui/guild.json`));for(const key of art){assert.ok(fs.existsSync(`${ROOT}/aseprite/ui/${key}.aseprite`));assert.ok(fs.existsSync(`${ROOT}/assets/ui/${key}.png`));}
console.log("Guild: unlock, assessment, fees, independent resets, discounts, replacements, isolated contracts, atomic rewards, automatic allocation, saves, NPCs and Aseprite exports passed");
