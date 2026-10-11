import assert from 'node:assert/strict';
import {startGame,runSteps,FLOWS} from './gamebrowser.mjs';
import {refineGlow} from '../js/items/refineglow.js';
assert.equal(refineGlow({type:'equip',plus:0}),null);
assert.equal(refineGlow({type:'material',plus:10}),null);
assert.ok(refineGlow({type:'equip',plus:10}).blur>refineGlow({type:'equip',plus:1}).blur);
const g=await startGame({debug:true,outDir:'.codex/refine-glow-check'});
try {
 await runSteps(g,FLOWS.newgame.replace(/,?shot:[\w-]+/g,''));
 await g.page.evaluate(()=>{const v=window.__vof;v.dialog.close();v.actIntro.close();v.codexScene.close();});
 assert.equal(await g.page.evaluate(()=>window.__vof.state),'PLAYING');
 await g.page.keyboard.press('Backspace');
 assert.equal(await g.page.evaluate(()=>window.__vof.state),'PLAYING');
 await g.page.keyboard.press('Backspace');
 assert.equal(await g.page.evaluate(()=>window.__vof.state),'PAUSED');
 await g.page.keyboard.press('Backspace');
 assert.equal(await g.page.evaluate(()=>window.__vof.state),'PLAYING');
 for(const [key,panel] of [['i','inventory'],['c','charPanel'],['o','settingsPanel'],['n','codexScene']]) {
  await g.page.keyboard.press(key);
  assert.equal(await g.page.evaluate(p=>window.__vof[p].open,panel),true,panel);
  await g.page.keyboard.press('Backspace');
  assert.equal(await g.page.evaluate(p=>window.__vof[p].open,panel),false,panel);
  assert.equal(await g.page.evaluate(()=>window.__vof.state),'PLAYING');
 }
 await g.page.evaluate(()=>window.__vof.regressionModal.show());
 await g.page.keyboard.press('Backspace');
 assert.equal(await g.page.evaluate(()=>window.__vof.regressionModal.open),false);
 await g.page.keyboard.press('Backspace');
 await g.page.keyboard.press('Backspace');
 assert.equal(await g.page.evaluate(()=>window.__vof.state),'PLAYING');
 await g.page.evaluate(()=>{const p=window.__vof.player;for(const it of Object.values(p.bag.equip))if(it)it.plus=10;p.recalc();});
 await g.page.waitForTimeout(250);
 await g.page.screenshot({path:'.codex/refine-glow-check/equipped.png'});
 await g.page.keyboard.press('i');
 assert.ok(await g.page.locator('#inventory img').evaluateAll(imgs=>imgs.some(i=>i.style.filter.includes('drop-shadow'))));
 await g.page.screenshot({path:'.codex/refine-glow-check/inventory.png'});
 assert.deepEqual(g.logs.errors,[]);
 console.log('PASS: refinement tiers, equipped rendering, inventory glows, Escape panel dismissal, Backspace pause/resume, no browser errors');
} finally {await g.close();}
