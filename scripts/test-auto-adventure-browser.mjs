import assert from 'node:assert/strict';
import {startGame,runSteps,FLOWS} from '../scripts/gamebrowser.mjs';
const g=await startGame({debug:true,waitUntil:'domcontentloaded',outDir:'.codex/visual-after-coins',viewport:'1280x800'});
const snapshot=()=>g.page.evaluate(()=>{const v=window.__vof;return {step:v.quest.step,area:v.stage.id,status:v.player.autoAdventureStatus,hp:v.player.hp,x:v.player.x,y:v.player.y,goal:v.autoAdventure.goal&&{status:v.autoAdventure.goal.status,point:v.autoAdventure.goal.point},dialog:v.dialog.open,side:v.quest.side.current(),state:v.state};});
try {
 // Movement/AI checks don't require the host's physical audio device.
 await g.page.evaluate(async()=>{const {Sound}=await import('./js/audio.js');Sound.musicEnabled=false;Sound.sfxEnabled=false;Sound.isMuted=true;});
 await runSteps(g,FLOWS.newgame.replace(/,?shot:[\w-]+/g,''));
 await g.page.evaluate(()=>{const v=window.__vof;v.dialog.close();v.actIntro.close();v.codexScene.close();v.quest.step=0;v.player.autoAttack={remainingMs:300000,until:0};});
 await g.page.keyboard.press('z');
 await g.page.waitForFunction(()=>window.__vof.quest.step===1,null,{timeout:30000});
 console.log('summoner',await snapshot());
 await g.page.evaluate(()=>{const v=window.__vof;v.quest.side.list.forEach(q=>q.have=q.n);v.quest.met.ronald=false;v.quest.met.edgar=false;});
 await g.page.waitForFunction(()=>window.__vof.quest.step===2,null,{timeout:45000});
 console.log('services/NPCs',await snapshot());
 await g.page.waitForFunction(()=>!window.__vof.actIntro.open && !window.__vof.dialog.open && window.__vof.player.autoAdventureStatus!=='dialogue',null,{timeout:10000});
 await g.page.keyboard.down('a');await g.page.waitForTimeout(250);
 assert.equal((await snapshot()).status,'manual');await g.page.keyboard.up('a');
 await g.page.keyboard.press('z');
 const before=await snapshot();await g.page.waitForTimeout(250);const after=await snapshot();
 assert.equal(before.x,after.x); assert.equal(before.y,after.y);
 console.log('manual and off passed');
 await g.page.evaluate(()=>{const v=window.__vof;v.dialog.close();v.actIntro.close();v.quest.step=4;v.quest.side.ensure(4);v.quest.side.list=[{t:'scout',area:'rocky',k:0,n:1,have:0}];v.player.x=230;v.player.y=810;v.player.hp=v.player.maxHp;});
 await g.page.keyboard.press('z');
 await g.page.waitForFunction(()=>window.__vof.stage.id==='rocky',null,{timeout:20000});
 console.log('portal travel',await snapshot());
 await g.page.waitForFunction(()=>window.__vof.quest.side.complete(),null,{timeout:45000});
 console.log('scouted',await snapshot());
 await g.page.screenshot({path:'.codex/visual-after-coins/auto-adventure.png'});
 await g.page.keyboard.press('z');
 await g.page.evaluate(()=>{const v=window.__vof;v.travelTo('hub');v.dialog.close();v.actIntro.close();v.player.level=10;v.quest.step=4;v.quest.side.ensure(4);v.quest.side.list.forEach(q=>q.have=q.n);v.npcManager.applyQuest(v.quest,v.player.heroData.id);const n=v.npcManager.find(v.npcManager.summonerId);v.player.x=n.x-100;v.player.y=n.y+40;v.player.hp=v.player.maxHp;});
 await g.page.keyboard.press('z');
 await g.page.waitForFunction(()=>window.__vof.player.heroData.id==='knight',null,{timeout:45000});
 console.log('awakening',await snapshot());
 await g.page.keyboard.press('z');
 await g.page.evaluate(()=>{const v=window.__vof;v.dialog.close();v.actIntro.close();v.player.autoAttack={remainingMs:60,until:Date.now()+60};});
 await g.page.waitForTimeout(250);const expired=await snapshot();await g.page.waitForTimeout(250);const still=await snapshot();assert.equal(expired.x,still.x);assert.equal(expired.y,still.y);
 console.log('expiry passed');
 await g.page.evaluate(()=>{const v=window.__vof;v.quest.step=8;v.quest.side.ensure(7);v.quest.side.list.forEach(q=>q.have=q.n);v.travelTo('canopy');v.dialog.close();v.actIntro.close();const b=v.enemyManager.boss();b.hp=1;b.livesLeft=1;b.lives=1;v.player.x=b.x-130;v.player.y=b.y;v.player.hp=v.player.maxHp;v.player.autoAttack={remainingMs:300000,until:0};});
 await g.page.keyboard.press('z');
 await g.page.waitForFunction(()=>window.__vof.quest.step===9,null,{timeout:30000});
 console.log('boss loot',await snapshot());
 await g.page.waitForFunction(()=>window.__vof.quest.step===10,null,{timeout:45000});
 console.log('quest delivery',await snapshot());
 assert.deepEqual(g.logs.errors,[]);assert.deepEqual(g.logs.failed,[]);
} catch(e) {console.log('FAILED STATE',await snapshot());console.log('ERRORS',g.logs.errors);throw e;} finally {await g.close();}


