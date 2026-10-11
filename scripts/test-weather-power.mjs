import assert from 'node:assert/strict';
import {load,seedRandom} from './headless.mjs';
const {regression}=await load('js/regression.js');
const {combatWeather,weatherPower,WEATHER_POWER}=await load('js/world/weather.js');
const {EnemyManager}=await load('js/enemy.js');
assert.equal(combatWeather({id:'hub',weather:{weatherType:'FOG'}},{weatherType:'STORM'}),'FOG');
assert.equal(combatWeather({def:{ambient:'blizzard'}}),'BLIZZARD');
const manager=new EnemyManager();manager.maxAlive=0;manager.respawnElites=()=>{};manager.updateMonster=()=>{};manager.regen=()=>{};manager.tickElement=()=>{};
const stage={id:'hub',weather:{weatherType:'RAIN'},isInsideSafeZone:()=>false};
const player={x:0,y:0,level:10,hp:10000,maxHp:10000,takeDamage(n){this.hp-=n;},inflictDebuff(type){this.effect=type;return true;}};
regression.level=0;seedRandom(42);const e=manager.spawn('reefCrab',10,40,40,null,'normal',10);e.element='water';e.engaged=true;e.sinceHit=121;e.hp=e.maxHp/2;
const base={hp:e.maxHp,damage:e.damage,speed:e.speed};
manager.update(player,null,null,stage);assert.ok(e.hp>base.hp/2);assert.ok(e.weatherPower.damage>1);
const first=e.weatherPower.damage;for(let i=0;i<50;i++)manager.update(player,null,null,stage);
assert.equal(e.weatherPower.damage,first);assert.equal(e.damage,base.damage);assert.equal(e.speed,base.speed);assert.equal(e.maxHp,base.hp);
stage.weather.weatherType='CLEAR';manager.update(player,null,null,stage);assert.equal(e.weatherPower.damage,1);assert.equal(e.weatherPower.armor,0);
const original=Math.random;Math.random=()=>.99;
player.hp=10000;manager.hitTarget(e,player,player,null,100);const clear=10000-player.hp;
e.weatherPower=weatherPower('STORM',e);player.hp=10000;manager.hitTarget(e,player,player,null,100);assert.ok(10000-player.hp>clear);
let draws=0;Math.random=()=>++draws<=2?.99:0;manager.hitTarget(e,player,player,null,100);assert.equal(player.effect,'electrified');
Math.random=()=>.99;e.hp=base.hp;e.weatherPower=weatherPower('BLIZZARD',e);manager.damage(e,100,0,false,null,null,0);assert.ok(base.hp-e.hp<100);
Math.random=original;
for(const type of Object.keys(WEATHER_POWER)){
 regression.level=0;const easy=weatherPower(type,e);regression.level=5;const hard=weatherPower(type,e);
 assert.ok(hard.damage>=easy.damage);assert.ok(hard.armor<=.4);assert.ok(hard.chance<=.2);
}
regression.level=0;assert.ok(weatherPower('STORM',{element:'water'}).damage>weatherPower('STORM',{element:'neutral'}).damage);
regression.level=0;
console.log('PASS: weather source, recovery, damage, resistance, electrical proc, element affinity, difficulty scaling, clear reset and no stat compounding');
