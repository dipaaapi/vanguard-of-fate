#!/usr/bin/env node
/**
 * paint — (re)create the detailed procedural starting points as Aseprite files.
 *
 *   node tools/aseprite/paint/paint.mjs                   # list what can be painted
 *   node tools/aseprite/paint/paint.mjs summon/hound      # → aseprite/summon/hound.aseprite
 *   node tools/aseprite/paint/paint.mjs fx                # every effect (fx/<name>)
 *   node tools/aseprite/paint/paint.mjs zone              # every safe zone (zone/<key>: camps, Barracks, Citadel, Emberhold)
 *   node tools/aseprite/paint/paint.mjs tiles             # every terrain tile set (tiles/<theme>, js/world/terrain.js)
 *   node tools/aseprite/paint/paint.mjs ui                # the HD interface frames (ui/<key>: hero card, party list, meters, side menu)
 *   node tools/aseprite/paint/paint.mjs all
 *
 * Monsters (aseprite/monster/<key>, every one in js/bestiary.js) have their own painter: tools/aseprite/paint/monsters.mjs.
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
import { uiSubjects } from "./ui.mjs";
import { tileSubjects } from "./tiles.mjs";
import { finish, grade } from "./monsterkit.mjs";
import { inkHex } from "../../../js/avatar/tilestyle.js";

const DIRS = ["down", "side", "up"];
const all = (frames) => Object.fromEntries(DIRS.map((d) => [d, frames]));

// Summons in the terrain tile style (js/avatar/tilestyle.js): their palettes graded like the tiles and,
// instead of one fixed outline colour, the tiles' hue-shifted outline (monsterkit finish()).
const tiled = (pal) => Object.fromEntries(Object.entries(pal).filter(([k]) => k !== "outline").map(([k, v]) => [k, typeof v === "string" && v.startsWith("#") ? grade(v) : v]));
const FOREST = tiled(slime.FOREST);
for (const k of ["hound", "fox"]) beast.KINDS[`tile:${k}`] = tiled(beast.KINDS[k]);
for (const k of ["falcon", "owl"]) bird.KINDS[`tile:${k}`] = tiled(bird.KINDS[k]);

export const SUBJECTS = {
  "summon/slime": () => build("summon/slime", slime.W, slime.H, all(slime.FRAMES), (d, a, i) => finish(slime.paintSlime(d, a, i, FOREST, true)), slime.DURATIONS),
  "summon/hound": () => build("summon/hound", beast.W, beast.H, all(beast.FRAMES), (d, a, i) => finish(beast.paintBeast("tile:hound", d, a, i)), beast.DURATIONS),
  "summon/fox": () => build("summon/fox", beast.W, beast.H, all(beast.FRAMES), (d, a, i) => finish(beast.paintBeast("tile:fox", d, a, i)), beast.DURATIONS),
  "summon/falcon": () => build("summon/falcon", bird.W, bird.H, { side: bird.FRAMES }, (d, a, i) => finish(bird.paintBird("tile:falcon", a, i)), bird.DURATIONS),
  "summon/owl": () => build("summon/owl", bird.W, bird.H, { side: bird.FRAMES }, (d, a, i) => finish(bird.paintBird("tile:owl", a, i)), bird.DURATIONS),
  "summon/angel": async () => { const a = await angel.prepare(inkHex("#a9bede", -0.68)); build("summon/angel", angel.W, angel.H, all(angel.FRAMES), (d, an, i) => a.paint(d, an, i), angel.DURATIONS); }
};

// Bosses (down / side / up, idle walk run attack skill)
for (const [name, b] of Object.entries(boss.BOSSES)) SUBJECTS[`boss/${name}`] = () => build(`boss/${name}`, b.w, b.h, all(boss.FRAMES), (d, a, i) => b.paint(d, a, i), b.durations);

// Effects: one "down-play" tag each (js/fxsprites.js)
for (const [name, e] of Object.entries(FX)) SUBJECTS[`fx/${name}`] = () => build(`fx/${name}`, e.w, e.h, { down: { play: e.n } }, (d, a, i) => e.paint(i), { play: e.dur });

// Safe zones (zones.mjs): written in Node, no Aseprite needed
Object.assign(SUBJECTS, await zoneSubjects());
// Interface frames (ui.mjs): 2× pixel density, no Aseprite needed
Object.assign(SUBJECTS, uiSubjects());
// Terrain tile sets (tiles.mjs): one per map theme, read by js/world/terrain.js
Object.assign(SUBJECTS, tileSubjects());

const [arg] = process.argv.slice(2);
if (!arg) console.log(`paintable: ${Object.keys(SUBJECTS).join(", ")}, all`);
else for (const key of arg === "all" ? Object.keys(SUBJECTS) : arg === "fx" || arg === "zone" || arg === "ui" || arg === "tiles" ? Object.keys(SUBJECTS).filter((k) => k.startsWith(`${arg}/`)) : arg.split(",")) {
  if (!SUBJECTS[key]) { console.error(`unknown subject "${key}"`); process.exit(1); }
  await SUBJECTS[key]();
}
