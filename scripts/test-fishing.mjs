import assert from 'node:assert/strict';
import {load,seedRandom} from './headless.mjs';
const {Fishing}=await load('js/world/fishing.js');
const {FISH,FISH_POOLS,fishPool,DISHES}=await load('js/items/cooking.js');
const {guildContracts,GuildBook}=await load('js/guild.js');
const {areaDef}=await load('js/world/areas.js');
const {Player}=await load('js/player.js');
const {Platform}=await load('js/world/platform.js');
const {AdventureNavigator}=await load('js/autoadventure.js');
const {describe}=await load('js/items/itemdb.js');
seedRandom(99);
for(const pool of Object.values(FISH_POOLS))for(const [id,w] of pool){assert.ok(FISH[id]);assert.ok(describe({id}));assert.ok(w>0);}
for(const [id,fish] of Object.entries(FISH))if(fish.rare && id!=="bangus")assert.ok(Object.values(DISHES).some(d=>d.ing[id]),id+" cooking use");
const contracts=guildContracts().filter(c=>c.source==='fish');assert.equal(contracts.length,20);
for(const c of contracts)assert.ok(fishPool(areaDef(c.area)).some(([id])=>id===c.item),c.id+' reachable fish');
const p=new Player(0,0,{id:'knight'}),stage={id:'coast',theme:'coast'},f=new Fishing();
f.spot=()=>({x:20,y:20,pool:[['mackerel',100]]});let catches=[],misses=0;
f.onCatch=(id,info)=>catches.push({id,...info});f.onMiss=()=>misses++;
assert.equal(f.press(p,stage),true);
while(f.s.phase==='wait')f.update(p,stage);
f.press(p,stage);assert.equal(f.s.phase,'reel');
for(let i=0;i<400&&f.active;i++){if(f.s.phase==='reel'&&Math.abs(f.needle()-f.s.center)<f.s.width*.35)f.press(p,stage);f.update(p,stage);}
assert.equal(catches.length,1);assert.equal(catches[0].qty,2);assert.equal(catches[0].perfect,true);assert.equal(f.streak,1);
for(let i=0;i<100;i++)f.update(p,stage);f.press(p,stage);f.press(p,stage);assert.equal(misses,1);assert.equal(f.streak,0);
for(let i=0;i<100;i++)f.update(p,stage);f.press(p,stage);p.x+=10;f.update(p,stage);assert.equal(f.active,false);
p.x=0;f.press(p,stage);f.update(p,{id:'frost'});assert.equal(f.active,false);
const book=new GuildBook();p.guild={member:true,rank:'G',claimed:[],active:{id:'G:fish0',have:0}};
assert.equal(book.collect(p,'coast','mackerel','fish',2),false);
assert.equal(book.collect(p,'port','mackerel','fish',2),true);assert.equal(p.guild.active.have,2);
assert.equal(book.collect(p,'port','mackerel','enemy',2),false);
for(const id of ['port','canopy','swamp','coast','frost','ash','maw']){
 const world=new Platform(id),nav=new AdventureNavigator(),hero=new Player(world.camp.x,world.camp.y,{id:'knight'}),fisher=new Fishing();
 nav.build(world,hero,performance.now());const bank=fisher.bank(hero,world,nav);assert.ok(bank,id+' reachable bank');
 assert.ok(fisher.spot({x:bank.x-10,y:bank.y-20},world),id+' castable bank');
}
console.log('PASS: fish pools/items, 20 guild contracts, perfect bonus, timing, cancellation, source/biome proof and reachable shorelines in seven maps');

f.s=null;f.spot=()=>({x:20,y:20,pool:[['pearlSnapper',100]]});f.press(p,stage);
while(f.s.phase==='wait')f.update(p,stage);f.press(p,stage);assert.equal(f.s.required,3);
for(let i=0;i<3;i++){f.s.elapsed=18;f.s.center=.25;f.press(p,stage);}
assert.equal(f.s.phase,'miss');assert.equal(misses,2);
f.s=null;f.press(p,stage);while(f.active)f.update(p,stage);assert.equal(f.s.phase,'miss');assert.equal(misses,3);
console.log('PASS: rare catch challenge, tension escape and missed-bite timeout');
