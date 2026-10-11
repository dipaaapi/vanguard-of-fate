import assert from 'node:assert/strict';
import {startGame,runSteps,FLOWS} from './gamebrowser.mjs';
const g=await startGame({debug:true,waitUntil:'domcontentloaded',outDir:'.codex/modal-check'});
try {
 await g.page.evaluate(async()=>{const {Sound}=await import('./js/audio.js');Sound.musicEnabled=false;Sound.sfxEnabled=false;Sound.isMuted=true;});
 await runSteps(g,FLOWS.newgame.replace(/,?shot:[\w-]+/g,''));
 await g.page.evaluate(async()=>{
  const v=window.__vof;v.dialog.close();v.actIntro.close();v.codexScene.close();
  const {demoTopUp,buyPremium}=await import('./js/premium.js');
  demoTopUp(v.player,3000);buyPremium(v.player,v.party,'recruit:vaelThorn');
 });
 await g.page.waitForTimeout(150);
 assert.ok(await g.page.locator('#heroHud').isVisible());
 assert.ok(await g.page.locator('#partyHud').isVisible());
 for(const [name,key] of [['map','m'],['inventory','i'],['character','c'],['quests','q'],['settings','o'],['premium','F4']]){
  await g.page.keyboard.press(key);
  await g.page.waitForTimeout(150);
  assert.ok(await g.page.locator('#viewport').evaluate(e=>e.classList.contains('panel-open')),name+' opens');
  for(const selector of ['#heroHud','#partyHud','.premium-hud','.guild-tracker']){
   const el=g.page.locator(selector);
   if(await el.count())assert.equal(await el.isVisible(),false,name+' suppresses '+selector);
  }
  await g.page.screenshot({path:'.codex/modal-check/'+name+'.png'});
  await g.page.keyboard.press('Escape');await g.page.waitForTimeout(100);
  assert.ok(await g.page.locator('#viewport').evaluate(e=>e.classList.contains('panel-open')),name+' remains open after Escape');
  await g.page.keyboard.press('Backspace');await g.page.waitForTimeout(150);
  assert.equal(await g.page.locator('#viewport').evaluate(e=>e.classList.contains('panel-open')),false,name+' closes');
  assert.ok(await g.page.locator('#heroHud').isVisible(),name+' restores hero HUD');
  assert.ok(await g.page.locator('#partyHud').isVisible(),name+' restores party HUD');
 }
 await g.page.keyboard.press('Backspace');await g.page.waitForTimeout(100);
 assert.equal(await g.page.evaluate(()=>window.__vof.state),'PAUSED');
 await g.page.keyboard.press('Escape');await g.page.waitForTimeout(100);
 assert.equal(await g.page.evaluate(()=>window.__vof.state),'PAUSED','Escape never resumes gameplay');
 await g.page.keyboard.press('Backspace');await g.page.waitForTimeout(100);
 assert.equal(await g.page.evaluate(()=>window.__vof.state),'PLAYING');
 await g.page.keyboard.press('F4');
 await g.page.locator('.premium-modal').getByRole('button',{name:'Pesos & Exchange',exact:true}).click();
 const amount=g.page.locator('.premium-modal').getByRole('spinbutton');
 await amount.fill('123');await amount.press('End');await amount.press('Backspace');
 assert.equal(await amount.inputValue(),'12','Backspace edits focused input');
 assert.ok(await g.page.locator('.premium-modal').isVisible());
 await amount.evaluate(e=>e.blur());await g.page.keyboard.press('Backspace');
 await g.page.keyboard.press('n');
 const items=await g.page.evaluate(async()=>{
  const scene=window.__vof.codexScene;scene.setTab('items');
  const {iconCanvas}=await import('./js/items/icons.js');
  const list=scene.entries();let count=0;const images=new Set();
  for(let i=0;i<list.length;i++){
   const e=list[i];if(e.kind!=='item')continue;
   scene.select(i);const preview=scene.spriteOf(scene.current());
   if(preview.icon!==iconCanvas(e.item))throw Error('Wrong preview for '+e.name+' id '+e.item.id);
   images.add(preview.icon);count++;
  }
  const lance=list.findIndex(e=>e.item?.icon==='lance');scene.select(lance);
  scene.setStance(2);
  return {count,images:images.size,action:scene.action};
 });
 assert.ok(items.count>20&&items.images>10,JSON.stringify(items));assert.equal(items.action,-1);
 assert.equal(await g.page.locator('.cxs-stances').isVisible(),false);
 await g.page.screenshot({path:'.codex/modal-check/item-preview.png'});
 await g.page.evaluate(()=>window.__vof.codexScene.setTab('heroes'));
 assert.ok(await g.page.locator('.cxs-stances').isVisible());
 console.log('PASS: every item preview matches its own icon; item stance controls hidden; actor controls restored',items);
 assert.deepEqual(g.logs.errors,[]);
 console.log('PASS: map, inventory, character, quests, settings and premium panels hide field overlays and restore HUD on close');
} finally {await g.close();}
