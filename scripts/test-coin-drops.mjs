import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { load, ROOT } from "./headless.mjs";
import { readAse } from "../tools/aseprite/asefile.mjs";
const { LootManager, rollCoinReward } = await load("js/loot.js");
const { codexItems } = await load("js/items/itemdb.js");
const { coinBreakdown } = await load("js/items/economy.js");
for (const level of [1, 10, 30, 60]) {
  const reward = tier => rollCoinReward({ level, tier }, () => 0.5);
  assert.ok(reward("normal") > 3 * (3 + level * 1.1));
  assert.ok(Math.abs(reward("champion") - reward("normal") * 3) < 0.001);
  assert.ok(Math.abs(reward("elite") - reward("normal") * 6) < 0.001);
  assert.ok(Math.abs(rollCoinReward({ level, boss: true, tier: "normal" }, () => 0.5) - reward("normal") * 20) < 0.001);
}
const random = Math.random;
try {
  Math.random = () => 0.32123;
  const manager = new LootManager();
  manager.spawnLoot(100, 100, { level: 17, tier: "champion" });
  const drops = manager.items.filter(i => i.type === "gold");
  const total = Math.round(drops.reduce((n, i) => n + i.amount, 0) * 10000);
  assert.equal(total, Math.round(rollCoinReward({ level: 17, tier: "champion" }) * 10000));
  const expected = coinBreakdown(total / 10000);
  assert.deepEqual(Object.fromEntries(drops.map(d => [d.coin, d.count])), Object.fromEntries(Object.entries(expected).filter(([, n]) => n)));
  const p = { x: 0, y: 0, gold: 0.0001 };
  drops.forEach(d => assert.equal(manager.collect(p, d), true));
  assert.equal(Math.round(p.gold * 10000), total + 1);
} finally { Math.random = random; }
const ids = [...codexItems().other.filter(i => i.type === "consume").map(i => `item_${i.base}`), ...["bronze", "silver", "gold", "platinum"].map(k => `coin_${k}`), "wallet", "consumable_slot"];
for (const id of ids) {
  const source = path.join(ROOT, "aseprite", "ui", `${id}.aseprite`);
  const png = path.join(ROOT, "assets", "ui", `${id}.png`);
  assert.ok(fs.existsSync(source), source);
  assert.ok(fs.existsSync(png), png);
  const art = readAse(source);
  assert.equal(art.frames.length, 1);
  assert.ok(art.frames[0].rgba.some((v, i) => i % 4 === 3 && v > 0), `empty source ${id}`);
  const bytes = fs.readFileSync(png);
  assert.equal(bytes.readUInt32BE(16), art.w);
  assert.equal(bytes.readUInt32BE(20), art.h);
}
console.log("Reward scaling, denomination totals, collection precision, and all 33 Aseprite exports passed.");
