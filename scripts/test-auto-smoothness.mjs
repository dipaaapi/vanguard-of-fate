import assert from 'node:assert/strict';
import {load} from './headless.mjs';
const {Player}=await load('js/player.js');
const {AutoAdventure}=await load('js/autoadventure.js');
const {autoSummonLoot,summonThreat}=await load('js/summons/automation.js');
const {LootManager}=await load('js/loot.js');
const {GuardianAngelCompanion:Angel}=await load('js/summons/angel.js');
const {PriestClass}=await load('js/classes/priest.js');
const stage={bounds:{minX:0,minY:0,maxX:400,maxY:400},isInsideSafeZone:()=>false};
const p=new Player(40,40,{id:'knight'});p.toggleAutoAttack();
const auto=new AutoAdventure();const goal={x:201.3,y:95.7};
auto.choose=()=>({status:'scout',point:goal,radius:0});
let previous=Math.hypot(goal.x-p.x-10,goal.y-p.y-20),changes=0,last;
for(let frame=0;frame<200;frame++){
 const a=auto.update({player:p,stage},frame*17);
 p.update({autoMovement:a.movement,isDown:k=>a.keys.has(k)},stage.bounds,()=>{},null,false);
 const distance=Math.hypot(goal.x-p.x-10,goal.y-p.y-20);
 assert.ok(distance<=previous+1e-8,'arrival must never overshoot or reverse');
 if(distance>1e-6){const heading=Math.atan2(a.movement.y,a.movement.x);if(last!==undefined&&Math.abs(heading-last)>.01)changes++;last=heading;}
 previous=distance;
}
assert.ok(previous<1e-7);assert.equal(changes,0,'straight autonomous walking keeps a steady heading');
const owner=new Player(40,40,{id:'knight'});owner.toggleAutoAttack();
const passive={x:155,y:40,isAlive:true};const attacker={x:70,y:40,isAlive:true,engaged:true};owner.target=passive;
assert.equal(summonThreat(owner,[passive,attacker]),attacker);
const manager={enemies:[passive],stage,damage(e){e.hit=true;}};
const loot=new LootManager();loot.drop({x:170,y:80},{id:'herb'},false,stage);loot.drop({x:165,y:90},{id:'salve'},false,stage);
const first={x:40,y:40},second={x:40,y:40};
assert.equal(autoSummonLoot(first,owner,manager,loot,null,stage,{fly:true}),true,'passive enemies must not starve collection');
assert.equal(autoSummonLoot(second,owner,manager,loot,null,stage,{fly:true}),true);
assert.notEqual(first.autoLootTarget,second.autoLootTarget,'collectors divide the drops');
manager.enemies.push(attacker);
assert.equal(autoSummonLoot(first,owner,manager,loot,null,stage,{fly:true}),false);
assert.equal(first.autoLootTarget,null,'attacks interrupt collection immediately');
const priest=new Player(40,40,{id:'priest'});const guardian=new Angel(65,40,100);guardian.hp=5;guardian.state='TAUNTING';guardian.stateTimer=1;
priest.angelCompanions=[guardian];manager.enemies=[attacker];
guardian.update(priest,manager,null,loot,0,false);
assert.equal(guardian.state,'ATTACKING');assert.ok(attacker.hit,'taunt must yield to defending the hero');
const hp=guardian.hp,life=guardian.lifespan;PriestClass.onAttack(priest,null,()=>{});
assert.ok(guardian.hp>hp);assert.ok(guardian.lifespan>life,'healing reaches the rendered guardian');
console.log('PASS: steady steering, precise arrival, attacker priority, passive-enemy loot, coordinated collectors, instant taunt interruption, real guardian healing');

// A selected target is retained when another opponent becomes a little nearer.
const locked=new AutoAdventure();const e1={x:120,y:60,isAlive:true,key:'wolf',kind:{}},e2={x:121,y:60,isAlive:true,key:'wolf',kind:{}};
locked.navigator.build(stage,owner,0);locked.target=e1;e2.x=110;
assert.equal(locked.hunt({player:owner,enemies:[e1,e2],stage,now:0},null).enemy,e1);
e1.isAlive=false;assert.equal(locked.hunt({player:owner,enemies:[e1,e2],stage,now:0},null).enemy,e2);
// Autonomous knight dashes stop short of the foe; a manual dash keeps its original travel.
const {KnightClass}=await load('js/classes/knight.js');
const charger=new Player(40,40,{id:'knight'});charger.active=KnightClass;charger.chargeTimer=18;charger.chargeVx=5.2;charger.chargeVy=0;
const foe={x:80,y:40,isAlive:true};
for(let i=0;i<18;i++)charger.update({autoMovement:{x:0,y:0,distance:0},isDown:()=>false},stage.bounds,()=>{},foe,false);
assert.ok(charger.x<=56+1e-8);assert.equal(charger.chargeTimer,0);
charger.x=40;charger.chargeTimer=18;charger.chargeVx=5.2;
for(let i=0;i<18;i++)charger.update({isDown:()=>false},stage.bounds,()=>{},foe,false);
assert.ok(charger.x>100,'manual charge distance is preserved');
console.log('PASS: stable combat selection and autonomous charge stopping with manual controls preserved');

// Sanctuary props can overlap the offset footprint of a newly placed familiar.
const {AdventureNavigator}=await load('js/autoadventure.js');
const sanctuary={...stage,barracks:{solids:[{x:220,y:200,w:16,h:40}]}};
const escapeNav=new AdventureNavigator(),spawn={x:228,y:201};
escapeNav.build(sanctuary,spawn,0);assert.equal(escapeNav.blocked(spawn.x+10,spawn.y+20),true);
for(let frame=0;frame<20;frame++){
 escapeNav.build(sanctuary,spawn,frame*17);const dir=escapeNav.direction(spawn,{x:355,y:220},10);
 assert.ok(dir);spawn.x+=dir[0]*1.9;spawn.y+=dir[1]*1.9;
}
assert.equal(escapeNav.blocked(spawn.x+10,spawn.y+20),false);
console.log('PASS: companion walks out of sanctuary footprint overlap');

// Continuous input must also follow obstacle routes at sprint speed.
const {footBlocked}=await load('js/world/nav.js');
const cols=20,rows=20,solid=new Uint8Array(cols*rows);
for(let y=0;y<15;y++)solid[y*cols+9]=1;
const maze={...stage,width:320,height:320,bounds:{minX:0,minY:0,maxX:290,maxY:290},tilemap:{cols,rows,solid,inBounds:(x,y)=>x>=0&&y>=0&&x<cols&&y<rows,idx:(x,y)=>y*cols+x}};
const runner=new Player(46,44,{id:'knight'});runner.speed=2.8;runner.sprintLock=true;
const route=new AutoAdventure();route.choose=()=>({status:'scout',point:{x:248,y:64},radius:1});
let finished=false;
for(let frame=0;frame<1000;frame++){
 const a=route.update({player:runner,stage:maze},frame*17);
 assert.notEqual(a.status,'routeBlocked');
 runner.update({autoMovement:a.movement,isDown:k=>a.keys.has(k)},maze.bounds,()=>{},null,false);
 assert.equal(footBlocked(maze,runner.x+10,runner.y+20),false,`sprint clipped wall at ${frame}`);
 if(Math.hypot(runner.x+10-248,runner.y+20-64)<=1.001){finished=true;break;}
}
assert.ok(finished,'sprinting must finish the route without waypoint oscillation');
console.log('PASS: sprint-speed continuous movement around obstacles');

const {Party}=await load('js/party.js');
const {PLAYABLE_IDS}=await load('js/playables.js');
const {ArcherClass}=await load('js/classes/archer.js');
const {buyPremium,demoTopUp}=await load('js/premium.js');
for(const id of PLAYABLE_IDS){
 const actor=new Player(40,40,ArcherClass),team=new Party(),ai=new AutoAdventure();demoTopUp(actor,3000);actor.toggleAutoAttack();
 assert.ok(buyPremium(actor,team,`recruit:${id}`).ok);
 actor.isReloading=true;actor.reloadTimer=120;actor.rollTimer=10;actor.kickTimer=8;actor.chargeTimer=12;
 assert.equal(team.switchTo(1,actor),id);
 assert.equal(actor.isReloading,false);assert.equal(actor.reloadTimer,0);
 assert.equal(actor.rollTimer+actor.kickTimer+actor.chargeTimer,0);
 assert.ok(actor.autoAttack.until>Date.now(),'switch preserves autonomous mode');
 ai.choose=()=>({status:'scout',point:goal,radius:0});
 for(let n=0;n<200;n++){const a=ai.update({player:actor,stage},n*17);actor.update({autoMovement:a.movement,isDown:k=>a.keys.has(k)},stage.bounds,()=>{},null,false);}
 assert.ok(Math.hypot(goal.x-actor.x-10,goal.y-actor.y-20)<1e-7,`${id} must finish autonomous travel after a reload hand-off`);
 team.cooldown=0;assert.equal(team.switchTo(0,actor),'hero');assert.ok(actor.autoAttack.until>Date.now());
}
console.log('PASS: every acquired NPC continues autonomous travel after Archer reload and class movement hand-off; switching back preserves automation');

const sanctuaryStage={...stage,isInsideSafeZone:(x,y)=>x<100};
const ranger=new Player(40,40,ArcherClass);ranger.toggleAutoAttack();
const target={x:170,y:40,isAlive:true,key:'ursath'};
const sanctuaryAuto=new AutoAdventure();sanctuaryAuto.choose=ctx=>sanctuaryAuto.combat(ctx.player,target,ctx.stage);
let shots=0;
for(let frame=0;frame<120;frame++){
 const a=sanctuaryAuto.update({player:ranger,stage:sanctuaryStage},frame*17);
 ranger.update({autoMovement:a.movement,isDown:k=>a.keys.has(k)},stage.bounds,()=>shots++,target,sanctuaryStage.isInsideSafeZone(ranger.x,ranger.y));
}
assert.ok(ranger.x>=100,'ranged auto must leave sanctuary before stopping in attack range');assert.ok(shots>0,'auto must attack after leaving sanctuary');
const campEnemy={x:60,y:40,isAlive:true,key:'ursath'};
sanctuaryAuto.navigator.build(sanctuaryStage,ranger,10000);
const huntGoal=sanctuaryAuto.hunt({player:ranger,stage:{...sanctuaryStage,width:400,height:400},enemies:[campEnemy,target],now:10000},null);
assert.equal(huntGoal.enemy,target,'skip invulnerable sanctuary targets');
console.log('PASS: ranged auto leaves sanctuary to attack, including guild fights, and excludes sanctuary enemies');
