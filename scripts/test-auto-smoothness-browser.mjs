import assert from 'node:assert/strict';
import {startGame,runSteps,FLOWS} from './gamebrowser.mjs';
const g=await startGame({debug:true,waitUntil:"domcontentloaded"});
try {
 // Movement/AI checks don't require the host's physical audio device.
 await g.page.evaluate(async()=>{const {Sound}=await import('./js/audio.js');Sound.musicEnabled=false;Sound.sfxEnabled=false;Sound.isMuted=true;});
 await runSteps(g,FLOWS.newgame.replace(/,?shot:[\w-]+/g,''));
 const result=await g.page.evaluate(async()=>{
  const v=window.__vof,p=v.player;
  v.dialog.close();v.actIntro.close();v.codexScene.close();v.enemyManager.enemies=[];v.enemyManager.maxAlive=0;v.lootManager.items=[];
  const {AdventureNavigator}=await import('./js/autoadventure.js');const nav=new AdventureNavigator();nav.build(v.stage,p,performance.now());
  let start,goal;
  for(let y=80;y<v.stage.height-100&&!start;y+=32)for(let x=80;x<v.stage.width-250;x+=32){
   const a={x,y},b={x:x+173.3,y:y+47.7};
   if(!nav.blocked(x,y)&&nav.clear(a,b)){start=a;goal=b;break;}
  }
  if(!start)throw Error('No clear walking segment');
  p.x=start.x-10;p.y=start.y-20;p.autoAttack={remainingMs:300000,until:Date.now()+300000};
  v.autoAdventure.choose=()=>({status:'scout',point:goal,radius:0});
  let reversals=0,headingChanges=0,lastHeading=null,last={x:p.x,y:p.y};
  let previous=Math.hypot(goal.x-p.x-10,goal.y-p.y-20),frames=0,maxFrame=0,lastTime=performance.now(),started=lastTime,lastMotion=lastTime,maxStall=0;
  await new Promise(resolve=>{
   const sample=()=>{
    const now=performance.now();maxFrame=Math.max(maxFrame,now-lastTime);lastTime=now;
    const gap=Math.hypot(goal.x-p.x-10,goal.y-p.y-20),dx=p.x-last.x,dy=p.y-last.y,step=Math.hypot(dx,dy);
    if(gap>previous+0.01)reversals++;
    if(step>0.01&&gap>0.1){const angle=Math.atan2(dy,dx);if(lastHeading!==null&&Math.abs(angle-lastHeading)>.02)headingChanges++;lastHeading=angle;}
    if(step>0.01)lastMotion=now;
    if(gap>2)maxStall=Math.max(maxStall,now-lastMotion);
    previous=gap;last={x:p.x,y:p.y};
    frames++;if(now-started>=6000)resolve();else requestAnimationFrame(sample);
   };requestAnimationFrame(sample);
  });
  return {reversals,headingChanges,gap:previous,frames,maxFrame,maxStall};
 });
 assert.equal(result.reversals,0);assert.equal(result.headingChanges,0);assert.ok(result.maxStall<80,JSON.stringify(result));assert.ok(result.gap<.001);
 const npcResults=await g.page.evaluate(async()=>{
  const v=window.__vof,p=v.player;
  const {PLAYABLE_IDS}=await import('./js/playables.js');const {buyPremium,demoTopUp}=await import('./js/premium.js');
  const {AdventureNavigator}=await import('./js/autoadventure.js');const nav=new AdventureNavigator();nav.build(v.stage,p,performance.now());
  let start,goal;
  for(let y=80;y<v.stage.height-100&&!start;y+=32)for(let x=80;x<v.stage.width-250;x+=32){const a={x,y},b={x:x+120,y:y+30};if(!nav.blocked(x,y)&&nav.clear(a,b)){start=a;goal=b;break;}}
  if(!start)throw Error('No clear NPC travel segment');
  demoTopUp(p,3000);const results=[];
  v.autoAdventure.choose=()=>({status:'scout',point:goal,radius:0});
  for(const id of PLAYABLE_IDS){
   buyPremium(p,v.party,`recruit:${id}`);p.x=start.x-10;p.y=start.y-20;p.hp=p.maxHp;
   p.isReloading=true;p.reloadTimer=120;p.chargeTimer=12;p.kickTimer=8;p.rollTimer=10;
   v.party.switchTo(v.party.members.indexOf(id),p,true);
   const until=p.autoAttack.until;
   await new Promise(resolve=>{const began=performance.now();const sample=()=>{if(Math.hypot(goal.x-p.x-10,goal.y-p.y-20)<.01||performance.now()-began>3000)resolve();else requestAnimationFrame(sample);};requestAnimationFrame(sample);});
   results.push({id,gap:Math.hypot(goal.x-p.x-10,goal.y-p.y-20),reloading:p.isReloading,until:p.autoAttack.until===until,status:p.autoAdventureStatus});
   v.party.switchTo(0,p,true);
  }
  return results;
 });
 for(const r of npcResults){assert.ok(r.gap<.01,JSON.stringify(r));assert.equal(r.reloading,false);assert.ok(r.until);}
 console.log('PASS: all five acquired NPCs move autonomously in live game after class hand-off',npcResults);
 const sanctuaryResult=await g.page.evaluate(async()=>{
  const v=window.__vof;v.awaken(v.ROSTER.find(h=>h.id==='archer'));v.dialog.close();v.actIntro.close();const p=v.player;
  const {AdventureNavigator}=await import('./js/autoadventure.js');const nav=new AdventureNavigator();nav.build(v.stage,p,performance.now());
  let start,goal;
  for(let y=80;y<v.stage.height-100&&!start;y+=32)for(let x=80;x<v.stage.width-250;x+=32){const a={x,y},b={x:x+130,y};if(!nav.blocked(x,y)&&nav.clear(a,b)){start=a;goal=b;break;}}
  if(!start)throw Error('No clear sanctuary regression segment');
  const original=v.stage.isInsideSafeZone;const boundary=start.x+35;
  v.stage.isInsideSafeZone=x=>x<boundary;
  p.x=start.x-10;p.y=start.y-20;p.hp=p.maxHp;p.autoAttack={remainingMs:300000,until:Date.now()+300000};
  const target={x:goal.x-10,y:goal.y-20,isAlive:true};
  v.autoAdventure.choose=ctx=>v.autoAdventure.combat(ctx.player,target,ctx.stage);
  let attacked=false;
  await new Promise(resolve=>{const began=performance.now();const sample=()=>{attacked ||= p.attackCooldownTimer>0;if(attacked||performance.now()-began>3000)resolve();else requestAnimationFrame(sample);};requestAnimationFrame(sample);});
  const result={left:p.x>=boundary,attacked,x:p.x,boundary};v.stage.isInsideSafeZone=original;return result;
 });
 assert.ok(sanctuaryResult.left&&sanctuaryResult.attacked,JSON.stringify(sanctuaryResult));
 console.log('PASS: live Archer exits sanctuary before attacking instead of idling in ranged reach',sanctuaryResult);
 const patrolResult=await g.page.evaluate(async()=>{
  const v=window.__vof,p=v.player,z=v.stage.safeZone;
  const {AdventureNavigator}=await import('./js/autoadventure.js');
  const nav=new AdventureNavigator();nav.build(v.stage,p,performance.now());
  let start;
  for(let y=z.y+z.h-32;y>z.y&&!start;y-=16)for(let x=z.x+32;x<z.x+z.w-32;x+=16)
   if(v.stage.isInsideSafeZone(x-10,y-20)&&!nav.blocked(x,y)){start={x,y};break;}
  if(!start)throw Error('No walkable sanctuary position');
  p.x=start.x-10;p.y=start.y-20;p.hp=p.maxHp;
  v.autoAdventure.reset();p.autoAttack={remainingMs:300000,until:Date.now()+300000};
  v.autoAdventure.choose=ctx=>v.autoAdventure.hunt({...ctx,enemies:[]},{t:'hunt',k:'ursath'});
  await new Promise(resolve=>{const began=performance.now();const sample=()=>{
   if(!v.stage.isInsideSafeZone(p.x,p.y)||performance.now()-began>8000)resolve();else requestAnimationFrame(sample);
  };requestAnimationFrame(sample);});
  return {left:!v.stage.isInsideSafeZone(p.x,p.y),distance:Math.hypot(p.x+10-start.x,p.y+20-start.y),status:p.autoAdventureStatus};
 });
 assert.ok(patrolResult.left,JSON.stringify(patrolResult));
 console.log('PASS: live empty-field Auto leaves actual Aethelgard sanctuary',patrolResult);
 assert.deepEqual(g.logs.errors,[]);
 console.log('PASS: real-game movement',result);
} finally {await g.close();}
