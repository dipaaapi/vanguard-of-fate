#!/usr/bin/env node
/**
 * paint — (re)create the detailed procedural starting points as Aseprite files.
 *
 *   node tools/aseprite/paint/paint.mjs                   # list what can be painted
 *   node tools/aseprite/paint/paint.mjs summon/hound      # → aseprite/summon/hound.aseprite
 *   node tools/aseprite/paint/paint.mjs fx                # every effect (fx/<name>)
 *   node tools/aseprite/paint/paint.mjs zone              # every safe zone (zone/<key>: camps, Barracks, Citadel, Emberhold)
 *   node tools/aseprite/paint/paint.mjs all
 *
 * This overwrites the .aseprite, so don't run it on art that has been edited by hand.
 * Then run tools/aseprite/export.mjs. PAINT_KEEP=<dir> keeps the frame PNGs for a look.
 */
import { build } from "./kit.mjs";
import * as slime from "./slime.mjs";
import * as beast from "./beast.mjs";
import * as bird from "./bird.mjs";
import * as angel from "./angel.mjs";
import { FX } from "./fx.mjs";
import * as boss from "./boss.mjs";
import { zoneSubjects } from "./zones.mjs";

const DIRS = ["down", "side", "up"];
const all = (frames) => Object.fromEntries(DIRS.map((d) => [d, frames]));

export const SUBJECTS = {
  "monster/slime": () => build("monster/slime", slime.W, slime.H, all(slime.FRAMES), (d, a, i) => slime.paintSlime(d, a, i), slime.DURATIONS),
  "summon/slime": () => build("summon/slime", slime.W, slime.H, all(slime.FRAMES), (d, a, i) => slime.paintSlime(d, a, i, slime.FOREST, true), slime.DURATIONS),
  "summon/hound": () => build("summon/hound", beast.W, beast.H, all(beast.FRAMES), (d, a, i) => beast.paintBeast("hound", d, a, i), beast.DURATIONS),
  "summon/fox": () => build("summon/fox", beast.W, beast.H, all(beast.FRAMES), (d, a, i) => beast.paintBeast("fox", d, a, i), beast.DURATIONS),
  "summon/falcon": () => build("summon/falcon", bird.W, bird.H, { side: bird.FRAMES }, (d, a, i) => bird.paintBird("falcon", a, i), bird.DURATIONS),
  "summon/owl": () => build("summon/owl", bird.W, bird.H, { side: bird.FRAMES }, (d, a, i) => bird.paintBird("owl", a, i), bird.DURATIONS),
  "summon/angel": async () => { const a = await angel.prepare(); build("summon/angel", angel.W, angel.H, all(angel.FRAMES), (d, an, i) => a.paint(d, an, i), angel.DURATIONS); }
};

// Bosses (down / side / up, idle walk run attack skill)
for (const [name, b] of Object.entries(boss.BOSSES)) SUBJECTS[`boss/${name}`] = () => build(`boss/${name}`, b.w, b.h, all(boss.FRAMES), (d, a, i) => b.paint(d, a, i), b.durations);

// Effects: one "down-play" tag each (js/fxsprites.js)
for (const [name, e] of Object.entries(FX)) SUBJECTS[`fx/${name}`] = () => build(`fx/${name}`, e.w, e.h, { down: { play: e.n } }, (d, a, i) => e.paint(i), { play: e.dur });

// Safe zones (zones.mjs): written in Node, no Aseprite needed
Object.assign(SUBJECTS, await zoneSubjects());

const [arg] = process.argv.slice(2);
if (!arg) console.log(`paintable: ${Object.keys(SUBJECTS).join(", ")}, all`);
else for (const key of arg === "all" ? Object.keys(SUBJECTS) : arg === "fx" || arg === "zone" ? Object.keys(SUBJECTS).filter((k) => k.startsWith(`${arg}/`)) : arg.split(",")) {
  if (!SUBJECTS[key]) { console.error(`unknown subject "${key}"`); process.exit(1); }
  await SUBJECTS[key]();
}
