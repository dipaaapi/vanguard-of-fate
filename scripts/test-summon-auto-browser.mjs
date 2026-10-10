import assert from "node:assert/strict";
import { startGame, runSteps, FLOWS } from "./gamebrowser.mjs";
const g = await startGame({ debug: true, waitUntil: "domcontentloaded" });
try {
  await runSteps(g, FLOWS.newgame.replace(/,?shot:[\w-]+/g, ""));
  await g.page.evaluate(() => {
    const v = window.__vof; v.dialog.close(); v.actIntro.close(); v.awaken(v.ROSTER.find(h => h.id === "knight"));
    v.dialog.close(); v.actIntro.close(); v.quest.step = 7; v.player.x = 250; v.player.y = 200; v.player.skillLevels.petpal = 1;
    v.enemyManager.enemies = []; v.enemyManager.maxAlive = 0; v.lootManager.items = [];
    // Keep the hero still so only the summoned pet can reach the test drop.
    v.autoAdventure.choose = () => ({ status: "waiting" });
    v.lootManager.drop({ x: 355, y: 220 }, { id: "herb", qty: 2 }, false, v.stage);
    window.ownerStart = { x: v.player.x, y: v.player.y }; window.herbsBefore = v.player.bag.count("herb");
  });
  await g.page.keyboard.press("z");
  await g.page.waitForFunction(() => window.__vof.player.bag.count("herb") === window.herbsBefore + 2, null, { timeout: 15000 });
  assert.deepEqual(await g.page.evaluate(() => ({ x: window.__vof.player.x, y: window.__vof.player.y })), await g.page.evaluate(() => window.ownerStart));
  await g.page.keyboard.press("z");
  await g.page.evaluate(() => { const v = window.__vof; v.player.familiar.place(v.player); v.lootManager.drop({ x: 355, y: 220 }, { id: "salve" }, false, v.stage); window.salvesBefore = v.player.bag.count("salve"); });
  await g.page.waitForTimeout(500); assert.equal(await g.page.evaluate(() => window.__vof.player.bag.count("salve") - window.salvesBefore), 0);
  await g.page.keyboard.press("z");
  await g.page.waitForFunction(() => window.__vof.player.bag.count("salve") === window.salvesBefore + 1, null, { timeout: 15000 });
  await g.page.evaluate(() => {
    const v = window.__vof; v.awaken(v.ROSTER.find(h => h.id === "archer")); v.dialog.close(); v.actIntro.close();
    v.player.x = 250; v.player.y = 200; v.player.skillCooldownTimer = 0;
    v.enemyManager.enemies = []; v.enemyManager.spawn("slime", v.player.level, 280, 200, null, "normal");
    v.autoAdventure.choose = () => { const e=v.enemyManager.enemies.find(e=>e.isAlive); return e ? {status:'fight',point:{x:e.x+10,y:e.y+20},radius:40,enemy:e} : {status:'waiting'}; };
  });
  await g.page.waitForFunction(() => window.__vof.player.falconCompanion.state === "ATTACKING" || window.__vof.player.falconCompanion.damageDealt);
  await g.page.evaluate(() => {
    const v = window.__vof; v.awaken(v.ROSTER.find(h => h.id === "priest")); v.dialog.close(); v.actIntro.close();
    v.player.x = 250; v.player.y = 200; v.player.skillCooldownTimer = 0;
    v.enemyManager.enemies = []; v.enemyManager.spawn("slime", v.player.level, 280, 200, null, "normal");
  });
  await g.page.waitForFunction(() => window.__vof.player.angelCompanions?.some(a => a.isAlive));
  assert.deepEqual(g.logs.errors, []); assert.deepEqual(g.logs.failed, []);
  console.log("Browser Z: stationary-owner pet loot, toggle-off pause/resume, automatic falcon defence and guardian summoning passed");
} finally { await g.close(); }
