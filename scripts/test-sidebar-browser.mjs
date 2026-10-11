import assert from 'node:assert/strict';
import {startGame,runSteps,FLOWS} from './gamebrowser.mjs';
const g=await startGame({debug:true,waitUntil:'domcontentloaded',outDir:'.codex/sidebar-check'});
try{
 await g.page.evaluate(async()=>{const {Sound}=await import('./js/audio.js');Sound.musicEnabled=false;Sound.sfxEnabled=false;Sound.isMuted=true;});
 await runSteps(g,FLOWS.newgame.replace(/,?shot:[\w-]+/g,''));
 await g.page.evaluate(()=>{const v=window.__vof;v.dialog.close();v.actIntro.close();v.codexScene.close();});
 await g.page.waitForTimeout(200);
 assert.ok(await g.page.locator('#sideOverview').isVisible());
 assert.equal(await g.page.locator('#sideActs').isVisible(),false);
 assert.equal(await g.page.locator('.premium-ad-arrow').count(),0);
 const first=await g.page.locator('#premiumAd').getAttribute('data-theme');
 await g.page.waitForTimeout(6200);
 assert.notEqual(await g.page.locator('#premiumAd').getAttribute('data-theme'),first);
 assert.equal(await g.page.locator('.field-orbit').evaluate(e=>getComputedStyle(e,'::before').animationName),'ad-orbit');
 const map=await g.page.locator('#sideMapBox').boundingBox(),side=await g.page.locator('#lore').boundingBox();
 assert.ok(map.y+map.height<=side.y+side.height+2,'overview map fits sidebar');
 await g.page.screenshot({path:'.codex/sidebar-check/overview.png'});
 await g.page.locator('#sideLogTab').click();
 assert.ok(await g.page.locator('#sideActs').isVisible());assert.ok(await g.page.locator('#chatLog').isVisible());
 assert.equal(await g.page.locator('#sideOverview').isVisible(),false);
 for(const sel of ['#sideActs','#chatLog']){
  const box=await g.page.locator(sel).boundingBox();assert.ok(box.height>=120,JSON.stringify(box));
 }
 await g.page.screenshot({path:'.codex/sidebar-check/journal.png'});
 await g.page.locator('#sideLogTab').press('ArrowLeft');
 assert.ok(await g.page.locator('#premiumAd').isVisible());
 await g.page.locator('#premiumAd').click();assert.ok(await g.page.locator('.premium-modal').isVisible());
 await g.page.keyboard.press('Backspace');
 await g.page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await g.page.locator('.field-orbit').evaluate(e=>getComputedStyle(e,'::before').animationName),'none');
 await g.page.evaluate(async()=>{
  const v=window.__vof,{GUILD_NPCS}=await import('./js/guilddata.js');
  const clerk=GUILD_NPCS.guildClerk;v.player.x=clerk.x-10;v.player.y=clerk.y-10;
  const state=v.guildBook.state(v.player);state.member=true;state.rank='G';v.player.bag.add('guildPlate');
  const result=v.guildBook.accept(v.player,{stage:v.stage,quest:{unlocked:()=>true}},'G:0');
  if(result.error)throw Error(result.error);
 });
 await g.page.locator('#hudBar .guild-active').waitFor({state:'visible'});
 assert.ok(await g.page.locator('#hudBar .guild-active').isVisible(),JSON.stringify(await g.page.evaluate(()=>({state:window.__vof.state,active:window.__vof.player.guild.active,hidden:document.querySelector('.guild-active').hidden,overview:document.querySelector('#sideOverview').hidden,shop:window.__vof.premiumShop.open}))));
 const priority=g.page.locator('.guild-priority input');assert.ok(await priority.isChecked());
 await priority.uncheck();assert.equal(await g.page.evaluate(()=>window.__vof.player.guild.active.priority),false);
 await priority.check();assert.equal(await g.page.evaluate(()=>window.__vof.player.guild.active.priority),true);
 await g.page.screenshot({path:'.codex/sidebar-check/guild-priority.png'});
 console.log('PASS: accepted contract appears in sidebar and priority checkbox updates its persistent state');
 assert.deepEqual(g.logs.errors,[]);
 console.log('PASS: grouped Act/log tab, rotating ad without navigation, shop click, animated field and reduced-motion preference');
}finally{await g.close();}
