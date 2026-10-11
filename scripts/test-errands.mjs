import assert from 'node:assert/strict';
import {load} from './headless.mjs';
const {Player}=await load('js/player.js');
const {Party}=await load('js/party.js');
const {Bag}=await load('js/items/bag.js');
const {demoTopUp,buyPremium,loadPremium}=await load('js/premium.js');
const {runErrands,tickErrands,ERRAND_EVERY,STOCK}=await load('js/summons/errands.js');
const {syncFamiliar}=await load('js/summons/familiar.js');
const {describe}=await load('js/items/itemdb.js');
const p=new Player(40,40,{id:'knight'}),party=new Party();p.bag=new Bag();p.hp=p.maxHp=100;
const deps={buyPrice:(id,it)=>it.price,sellQuote:(it,n)=>10*n,onSold(){},report(t){deps.last=t;}};
// Without the skills nothing happens
p.familiar={};p.gold=1000;p.bag.add('helm',2);
assert.equal(runErrands(p,deps).length,0);
// Bought at the premium shop as permanent skills, saved and reloaded
demoTopUp(p,3000);assert.ok(buyPremium(p,party,'autoSell').ok);assert.ok(buyPremium(p,party,'autoBuy').ok);
assert.equal(buyPremium(p,party,'autoSell').ok,false,'owned once');
assert.deepEqual(loadPremium(JSON.parse(JSON.stringify(p.premium))).skills,{autoLoot:false,autoDefend:false,autoSell:true,autoBuy:true});
// A summon appears for the errands
p.familiar=null;assert.ok(syncFamiliar(p),'premium errand skill brings a summon');
// Auto Sell: plain gear goes, refined / set / socketed gear stays
p.bag=new Bag();p.bag.add('helm',2);p.bag.add({id:'helm',plus:3});p.bag.add({id:'helm',set:'meridian'});p.bag.add({id:'helm',cards:['x']});
p.premium.enabled.autoBuy=false;const gold=p.gold;runErrands(p,deps);p.premium.enabled.autoBuy=true;
assert.equal(p.bag.slots.filter(s=>s.id==='helm').length,3,'kept refined/set/carded');assert.equal(p.gold-gold>=20,true);
// Auto Buy: stock up within a quarter of the purse
p.gold=100000;runErrands(p,deps);
for(const [id,n] of Object.entries(STOCK))assert.equal(p.bag.count(id),n,id+' stocked');
p.bag.take('salve',STOCK.salve);p.gold=4*describe({id:'salve',qty:1}).price*3;runErrands(p,deps);
assert.equal(p.bag.count('salve'),3,'spends at most 25% of the purse');
// Toggle off in the shop HUD stops it; ticks run every 10 s
p.premium.enabled.autoBuy=false;p.bag.take('salve',3);p.gold=100000;
for(let i=0;i<ERRAND_EVERY;i++)tickErrands(p,deps);assert.equal(p.bag.count('salve'),0);
p.premium.enabled.autoBuy=true;for(let i=0;i<ERRAND_EVERY;i++)tickErrands(p,deps);assert.equal(p.bag.count('salve'),STOCK.salve);
assert.ok(deps.last,'reports to the player');
console.log('PASS: Auto Sell / Auto Buy bought at the premium shop, saved, toggled, keep valuables, respect the gold budget');
// Summon panel settings: clamped on load, saved with the premium state, and obeyed
const {normalizeSummonCfg,defaultSummonCfg}=await load('js/summons/summoncfg.js');
const {summonTarget}=await load('js/summons/automation.js');
assert.deepEqual(normalizeSummonCfg({attack:'x',range:9999,stock:{salve:500,elixir:-3},spend:7,every:1,sell:{magic:'yes'}}),{...defaultSummonCfg(),stock:{salve:30,elixir:0,tonic:0,panacea:2}});
const c=p.premium.summon;c.stock={salve:0,elixir:4,tonic:0,panacea:0};c.spend=0.5;c.every=5;
assert.deepEqual(loadPremium(JSON.parse(JSON.stringify(p.premium))).summon,c,'saved');
p.bag=new Bag();p.gold=100000;for(let i=0;i<300;i++)tickErrands(p,deps);assert.equal(p.bag.count('elixir'),4,'custom stock every 5 s');
c.sell={normal:false,magic:false,magicWhenFull:false,onlyWhenFull:false};p.bag.add('helm');runErrands(p,deps);assert.equal(p.bag.count('helm'),1,'sell rules obeyed');
const foes=[{isAlive:true,x:150,y:40,engaged:false},{isAlive:true,x:90,y:40,engaged:true}];
c.attack='passive';assert.equal(summonTarget(p,foes,200),null);
c.attack='defensive';assert.equal(summonTarget(p,foes,200),foes[1]);
c.attack='aggressive';c.range=120;assert.ok(summonTarget(p,[foes[0]],200),'aggressive picks idle foes in range');
c.range=120;assert.equal(summonTarget(p,[{isAlive:true,x:300,y:40}],200),null,'range respected');
console.log('PASS: Summon panel settings — attack modes, range, stock, spend, interval and sell rules');
