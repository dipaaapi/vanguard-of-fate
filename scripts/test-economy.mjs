import assert from 'node:assert/strict';
import {load} from './headless.mjs';
const {regression,DIFFICULTIES,economyProfile}=await load('js/regression.js');
const {SHOPS,buyPrice,baseSellPrice,Market}=await load('js/items/economy.js');
const {getItem}=await load('js/items/itemdb.js');
const {recipeCost,temperInfo}=await load('js/items/forge.js');
const {rollCoinReward}=await load('js/loot.js');
let checked=0,previous=0;
for(let i=0;i<DIFFICULTIES.length;i++){
 regression.level=i;
 for(const [shopId,shop] of Object.entries(SHOPS))for(const id of shop.stock){
  const item=getItem(id);assert.ok(item,id);
  assert.ok(baseSellPrice(item)<buyPrice(shopId,id,item),`${shopId}/${id} resale profit`);checked++;
 }
 assert.equal(buyPrice('safezone','soulstone',getItem('soulstone')),10000);
 assert.equal(baseSellPrice({type:'quest',price:99999}),0);
 const payout=rollCoinReward({level:10,tier:'normal',diff:0},()=>.5);
 assert.ok(payout>previous);previous=payout;
 assert.ok(rollCoinReward({level:10,tier:'normal',diff:-10},()=>.5)<payout*.16);
 assert.equal(recipeCost('ember','armor').gold,400*economyProfile().coins);
 assert.ok(temperInfo({id:'cutter',temper:1}).gold>temperInfo({id:'cutter'}).gold);
 const market=new Market(),item=getItem('salve');
 const initial=market.quote(item);market.record(item,20);assert.ok(market.quote(item)<=initial);
}
regression.level=0;
console.log(`PASS: ${checked} shop resale checks, six difficulty payouts, gray-farm penalties, forge/temper sinks, saturation and Soulstone face value`);
