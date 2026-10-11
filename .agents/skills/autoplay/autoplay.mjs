#!/usr/bin/env node
/**
 * autoplay — a bot plays the real game headless and reports what happened: kills/min, EXP/min, lowest HP,
 * deaths, stuck count and console errors. Complements balance-sim (the model) with the actual game loop.
 *
 *   node .claude/skills/autoplay/autoplay.mjs                                  # new Novice, 60 s in the hub
 *   node .claude/skills/autoplay/autoplay.mjs --class mage --level 25 --area ash --seconds 90
 *   node .claude/skills/autoplay/autoplay.mjs --class knight,mage,priest,archer,fighter --level 30 --area frost --immortal
 *   node .claude/skills/autoplay/autoplay.mjs --save my.json --seconds 120 --immortal   # soak test a save
 *
 * --immortal refills HP at 25% and counts it as a death, so a long soak run keeps going. --hunt also goes after
 * elites, bosses and monsters 5+ levels up (skipped unless close by default). --no-skills / --no-potions.
 * --json prints the reports as JSON. Screenshots (start/end of each run) go to <tmp>/vof-autoplay/.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { startGame, runSteps, setupHero, autoplay, FLOWS } from "../../../scripts/gamebrowser.mjs";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const classes = (opt("--class", "") || "").split(",").filter(Boolean);
const level = parseInt(opt("--level", "0"), 10) || 0;
const area = opt("--area", null);
const seconds = parseInt(opt("--seconds", "60"), 10);
const save = opt("--save", null);
const outDir = path.join(os.tmpdir(), "vof-autoplay");

const reports = [];
let failed = false;
for (const cls of classes.length ? classes : [null]) {
  const g = await startGame({ debug: true, save: save ? fs.readFileSync(path.resolve(save), "utf8") : null, outDir });
  try {
    await runSteps(g, save ? FLOWS.continue : FLOWS.newgame);
    const setup = await setupHero(g, { level, cls, area });
    const tag = `${cls || "novice"}-${area || "here"}`;
    await runSteps(g, `wait:600,shot:${tag}-start`);
    const r = await autoplay(g, { seconds, immortal: argv.includes("--immortal"), skills: !argv.includes("--no-skills"), potions: !argv.includes("--no-potions"), hunt: argv.includes("--hunt") });
    await runSteps(g, `shot:${tag}-end`);
    reports.push({ setup, ...r, errors: g.logs.errors.length });
    if (g.logs.errors.length || g.logs.failed.length) failed = true;
  } finally { await g.close(); }
}

if (argv.includes("--json")) console.log(JSON.stringify(reports, null, 2));
else {
  for (const r of reports) {
    console.log(`${r.setup} · ${r.seconds}s`);
    console.log(`  kills ${r.kills} (${r.killsPerMin}/min) · EXP ${r.expFromKills} (${r.expPerMin}/min) · Lv ${r.level} · gold +${r.gold}`);
    console.log(`  lowest HP ${r.lowestHp} · potion taps ${r.potionTaps} · deaths ${r.deaths} · stuck ${r.stuck} · end ${r.endState} in ${r.area} (HP ${r.hp})`);
    if (r.newErrors.length) console.log(`  console errors:\n    ${[...new Set(r.newErrors)].join("\n    ")}`);
  }
  console.log(`screenshots: ${outDir}`);
}
process.exitCode = failed ? 1 : 0;
