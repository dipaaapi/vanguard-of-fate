import assert from 'node:assert/strict';
import {startGame,runSteps,FLOWS} from './gamebrowser.mjs';
const g=await startGame({debug:true,waitUntil:'domcontentloaded',outDir:'.codex/terrain-check'});
try{
 await g.page.evaluate(async()=>{const {Sound}=await import('./js/audio.js');Sound.isMuted=true;Sound.musicEnabled=false;Sound.sfxEnabled=false;});
 await runSteps(g,FLOWS.newgame.replace(/,?shot:[\w-]+/g,''));
 const result=await g.page.evaluate(async()=>{
  const v=window.__vof;v.dialog.close();v.actIntro.close();v.codexScene.close();
  const {loadTerrainSheet,TILE_THEMES}=await import('./js/world/terrain.js');
  const sheets=await Promise.all(TILE_THEMES.map(async id=>({id,frames:(await loadTerrainSheet(id)).frames.length})));
  await v.stage.tilemap.terrainReady;
  if(!v.stage.tilemap.terrainDetail)throw Error(v.stage.tilemap.terrainError||'Hub terrain not applied');
  const {Platform}=await import('./js/world/platform.js');
  const {PLATFORMS}=await import('./js/world/platforms.js');
  const {FRONTIERS}=await import('./js/world/frontiers.js');
  const checked=[];
  for(const id of Object.keys({...PLATFORMS,...FRONTIERS})){
   const stage=new Platform(id),map=stage.tilemap;
   const collision=Array.from(map.solid),liquid=Array.from(map.liquid),reach=Array.from(map.reach);
   await map.terrainReady;
   if(!map.terrainDetail)throw Error(`${id}: ${map.terrainError}`);
   if(JSON.stringify(collision)!==JSON.stringify(Array.from(map.solid))||JSON.stringify(liquid)!==JSON.stringify(Array.from(map.liquid))||JSON.stringify(reach)!==JSON.stringify(Array.from(map.reach)))throw Error(`${id}: gameplay grid changed`);
   const c=document.createElement('canvas');c.width=480;c.height=270;const ctx=c.getContext('2d');
   ctx.translate(-stage.safeZone.x+40,-stage.safeZone.y+40);map.drawGround(ctx);
   checked.push({id,theme:map.terrain.theme,frames:map.terrain.sheet.frames.length});stage.destroy();
  }
  return {sheets,checked};
 });
 assert.equal(result.sheets.length,15);assert.ok(result.sheets.every(x=>x.frames===8));assert.ok(result.checked.length>9);
 await g.page.screenshot({path:'.codex/terrain-check/hub.png'});
 await g.page.evaluate(async()=>{const v=window.__vof;v.travelTo('coast');v.dialog.close();v.actIntro.close();await v.stage.tilemap.terrainReady;});
 await g.page.screenshot({path:'.codex/terrain-check/coast.png'});
 assert.deepEqual(g.logs.errors,[]);assert.deepEqual(g.logs.failed,[]);
 console.log('PASS: all 15 animated tilesets load, hub, campaign and frontier maps use new terrain, collision/water/reachability grids unchanged, draw and teardown succeed, no browser errors');
}finally{await g.close();}
