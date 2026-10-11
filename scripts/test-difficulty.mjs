import assert from 'node:assert/strict';
import {load,seedRandom} from './headless.mjs';
const {regression,DIFFICULTIES,enemyHpMult,enemyDamageMult,COMBAT,combat}=await load('js/regression.js');
const levelBonus=Object.fromEntries(Object.entries(COMBAT).map(([k,v])=>[k,v.levelBonus]));
for(const c of Object.values(COMBAT))c.levelBonus=0;   // HP/damage multipliers first, level bonus checked below
const {EnemyManager}=await load('js/enemy.js');
const {MONSTERS,BOSSES}=await load('js/bestiary.js');
const {MercenaryManager}=await load('js/mercenaryManager.js');
const base=new Map();let checked=0;
for(let level=0;level<DIFFICULTIES.length;level++){
 regression.level=level;
 for(const [kind,defs] of [['monster',MONSTERS],['boss',BOSSES]])for(const key of Object.keys(defs)){
  seedRandom(42);const manager=new EnemyManager();
  const e=kind==='boss'?manager.spawnBoss(key,100,100,10):manager.spawn(key,10,100,100,null,'normal',10);
  assert.ok(e,key);const id=kind+key;
  if(!level)base.set(id,{hp:e.maxHp,damage:e.damage});
  else{const b=base.get(id);assert.ok(Math.abs(e.maxHp-b.hp*enemyHpMult())<=Math.ceil(enemyHpMult())+1,id+' HP (per-bar rounding)');assert.equal(e.damage,Math.round(b.damage*enemyDamageMult()),id+' damage');}
  checked++;
 }
 const merc=new MercenaryManager(),p={x:100,y:100,level:10,gold:100000};
 assert.equal(MercenaryManager.cost(10),40*(level+1));
 assert.ok(merc.hire('axe',p));const gold=p.gold;
 if(level){
  assert.equal(merc.hire('wand',p),false);assert.equal(p.gold,gold);
  merc.mercenaries[0].hp=0;merc.mercenaries[0].isAlive=false;
  assert.equal(merc.hire('wand',p),false,'downed mercenary still occupies contract');
  merc.mercenaries[0].lifespan=0;assert.ok(merc.hire('wand',p),'expired contract permits new hire');
 }else assert.ok(merc.hire('wand',p),'Easy retains multiple mercenaries');
}
for(const [k,v] of Object.entries(levelBonus))COMBAT[k].levelBonus=v;
// Escalation: never easier on a harder difficulty
const ids=DIFFICULTIES.map(d=>d.id);
for(let i=1;i<ids.length;i++){const a=COMBAT[ids[i-1]],b=COMBAT[ids[i]];
 for(const k of ['levelBonus','spawnRate','extraAlive','crit','splash','counter','callRadius','callCount'])assert.ok(b[k]>=a[k],ids[i]+' '+k);
 assert.ok(b.miss<=a.miss,ids[i]+' miss');assert.ok(DIFFICULTIES[i].expMultiplier>DIFFICULTIES[i-1].expMultiplier);}
// Level bonus, miss and gang-up on Mythical
regression.level=ids.indexOf('mythical');
{const m=new EnemyManager();const e=m.spawn(Object.keys(MONSTERS)[0],10,100,100,null,'normal',10);assert.equal(e.level,10+combat().levelBonus);
 const pals=[1,2,3,4,5,6,7].map(i=>m.spawn(Object.keys(MONSTERS)[0],10,100+i*8,100,null,'normal',10));m.rally(e);
 assert.equal(pals.filter(p=>p.provoked).length,combat().callCount,'a struck foe rallies callCount kin');
 const hero={x:100,y:100,hp:1e6,takeDamage(d){this.hp-=d;},inflictDebuff(){}};let misses=0;seedRandom(3);
 for(let i=0;i<4000;i++){const h=hero.hp;m.hitTarget(e,hero,hero,null,10,false);if(hero.hp===h)misses++;}
 assert.ok(Math.abs(misses/4000-combat().miss)<0.015,'miss rate '+misses/4000);}
regression.level=0;
console.log('PASS:',checked,'monster/boss difficulty cases; hire prices, caps, KO and expired contracts; escalation table, level bonus, miss rate and gang-up rally');
