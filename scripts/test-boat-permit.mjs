import assert from 'node:assert/strict';
import {load} from './headless.mjs';
const {SideQuests}=await load('js/sidequest.js');
const {regression}=await load('js/regression.js');
const {BoatSystem}=await load('js/world/boat.js');
const routes=[];
for(let level=0;level<6;level++){
 regression.level=level;const side=new SideQuests();side.ensure(8);
 assert.equal(side.boat.permit,false);side.boatTalk();assert.equal(side.boat.permit,false);
 routes.push(JSON.stringify(side.boat.list.map(({t,k,n})=>({t,k,n}))));
 const ordinary=JSON.stringify(side.list);const first=side.boatCurrent();
 if(first.t==='scout'){const site=side.site(first);assert.ok(site);side.onMove('coast',site.x,site.y);}
 else side.onKill({key:'mariner'},'coast');
 const saved=side.serialize(),restored=new SideQuests();restored.load(saved,8);
 assert.deepEqual(restored.boat,side.boat);
 for(const q of side.boat.list){
  let safety=0;
  while(q.have<q.n){assert.ok(++safety<500);if(q.t==='scout'){const site=side.site(q);side.onMove('coast',site.x,site.y);}else side.onKill({key:q.k||'mariner',elite:q.t==='elite',champion:q.t==='champion',kind:{flying:q.t==='sky'}},'coast');}
 }
 assert.ok(side.boatReady());assert.equal(side.boat.permit,false);side.boatTalk();assert.equal(side.boat.permit,true);
 const done=new SideQuests();done.load(side.serialize(),8);assert.equal(done.boat.permit,true);done.ensure(9);assert.equal(done.boat.permit,true);
 done.reset();assert.equal(done.boat.permit,false);
 const ship=new BoatSystem({}, {pier:{x:0,y:0},dockedBoat:{x:0,y:0},monolith:{x:0,y:0},seaPortal:{x:0,y:0}});
 const p={x:0,y:0,inBoat:false};assert.equal(ship.toggleBoard(p),false);assert.equal(p.inBoat,false);
 ship.permitted=true;ship.embark=hero=>hero.inBoat=true;ship.toggleBoard(p);assert.equal(p.inBoat,true);
}
assert.equal(new Set(routes).size,6);regression.level=0;
console.log('PASS: six distinct captain trials, kill/scout/trophy progress, save/load, captain approval, Act persistence, Regression reset and boarding gate');

const {AutoAdventure}=await load('js/autoadventure.js');
const side=new SideQuests(),auto=new AutoAdventure(),captain={id:'isolde',x:100,y:100};
const ctx={player:{x:0,y:0,hp:100,maxHp:100},stage:{id:'coast',boatSystem:{pier:{x:10,y:10}}},quest:{step:20,side,monolith:false,unlocked:()=>true},npcs:{find:id=>id==='isolde'?captain:null},hub:{portals:{portals:[]}},enemies:[],loot:{items:[]},finalStep:99};
assert.equal(auto.travel(ctx,'strand').npc,captain,'Auto requests trial instead of looping at locked boat');
side.boatTalk();assert.equal(auto.choose(ctx).status,'scout');
side.boat.list.forEach(q=>q.have=q.n);assert.equal(auto.choose(ctx).npc,captain,'Auto returns for approval');
side.boatTalk();assert.equal(auto.travel(ctx,'strand').action,'board');
console.log('PASS: Auto requests captain trial, follows objective, returns for approval, then boards');
