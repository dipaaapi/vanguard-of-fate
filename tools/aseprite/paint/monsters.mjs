#!/usr/bin/env node
/**
 * monsters — paint every monster (and code-drawn boss) in the terrain tile sets' style as
 * aseprite/monster/<key>.aseprite (aseprite/boss/<key>.aseprite), one family painter per code sprite class
 * (tools/aseprite/paint/monsters/*.mjs). Humanoids (Avatars) and one-off bosses are seeded from their code
 * frames, which the game already draws in the tile style (js/avatar/tilestyle.js).
 *
 *   node tools/aseprite/paint/monsters.mjs                    # every monster
 *   node tools/aseprite/paint/monsters.mjs wolf yeti          # only these keys
 *   node tools/aseprite/paint/monsters.mjs --family Brute     # one family
 *   node tools/aseprite/paint/monsters.mjs yeti --preview     # contact sheet PNG instead (no files written)
 *   node tools/aseprite/paint/monsters.mjs yeti imp --preview --compact   # one frame per animation, side by side
 *
 * Overwrites the files it paints (hand edits included), so run it on keys you haven't edited by hand.
 * Then export: node tools/aseprite/export.mjs  (or export.mjs monster/<key> …)
 */
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, writePng, readPng, codeSprite } from "../lib.mjs";
import { build, fromGame } from "./kit.mjs";
import { FRAMES, DURATIONS, VIEWS, look } from "./monsterkit.mjs";

const FAMILIES = {
  BruteSprite: "brute", DrakeSprite: "drake", CrabSprite: "crab", SerpentSprite: "serpent",
  ImpSprite: "imp", SpecterSprite: "specter", WolfSprite: "wolf", SlimeSprite: "slime"
};
const DIRS = VIEWS;
// how each family turns to the diagonals (monsterkit look): upright bodies turn the front/back view,
// low ones tilt the side view
const LOW = new Set(["wolf", "crab", "serpent", "drake"]);
/** Face for a frame: a blink at the end of the idle, a scowl while chasing and fighting. */
const exprOf = (anim, i) => (anim === "idle" && i === FRAMES.idle - 1 ? "blink" : anim === "run" || anim === "attack" || anim === "skill" ? "angry" : null);

const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf("--" + n); return i >= 0 ? argv[i + 1] : null; };
const keys = argv.filter((a, i) => !a.startsWith("--") && !["--family", "--out", "--scale", "--theme"].includes(argv[i - 1]));
const family = opt("family"), preview = argv.includes("--preview");

const { load } = await import(pathToFileURL(path.join(ROOT, "scripts/headless.mjs")).href);
const { MONSTERS, BOSSES } = await load("js/bestiary.js");
const painters = {};
async function painter(cls) {
  const name = FAMILIES[cls];
  if (!name) return null;
  if (!painters[name]) painters[name] = await import(pathToFileURL(path.join(ROOT, `tools/aseprite/paint/monsters/${name}.mjs`)).href);
  return painters[name];
}

// every monster, and the bosses still drawn from code (bosses with a painted sheet of their own,
// SheetBossSprite, keep it)
const all = [...Object.entries(MONSTERS).map(([k, d]) => ["monster", k, d]),
  ...Object.entries(BOSSES).filter(([, d]) => d.sprite.constructor.name !== "SheetBossSprite").map(([k, d]) => ["boss", k, d])];
const todo = all.filter(([, k, d]) => (!keys.length || keys.includes(k)) && (!family || d.sprite.constructor.name.startsWith(family)));
const sheets = [];
for (const [kind, key, def] of todo) {
  const cls = def.sprite.constructor.name, P = await painter(cls);
  if (!P) {
    // humanoids and one-offs: their code frames, already in the tile style (js/avatar/tilestyle.js)
    const s = await codeSprite(`${kind}/${key}`);
    const avatar = !!s.config;      // Avatars draw every view and face; other one-offs keep their three views
    const frames = avatar ? { ...s.frames, idle: 8 } : s.frames;
    const paint = (dir, anim, i) => fromGame(avatar && anim === "idle"
      ? s.frame(dir, "idle", (i >> 1) % 2, i === 7 ? "blink" : null)       // two slow breaths, then a blink
      : s.frame(dir, anim, i));
    const dirs = avatar ? DIRS : ["down", "side", "up"];
    if (preview) sheets.push({ key, W: s.w, H: s.h, paint, frames, dirs });
    else build(`${kind}/${key}`, s.w, s.h, Object.fromEntries(dirs.map((d) => [d, frames])), paint, DURATIONS);
    continue;
  }
  const { W, H } = P.SIZE;
  const low = LOW.has(FAMILIES[cls]);
  const paint = (dir, anim, i) => {
    const diag = dir === "dside" || dir === "uside";
    Object.assign(look, { view: diag ? dir : null, body: low ? "low" : "upright", expr: exprOf(anim, i) });
    look.eyes.clear();
    const base = !diag ? dir : low ? "side" : dir === "dside" ? "down" : "up";
    try { return P.paint(def.sprite, { ...def, key }, base, anim, i); } finally { look.view = null; look.expr = null; }
  };
  if (preview) sheets.push({ key, W, H, paint, frames: FRAMES });
  else build(`${kind}/${key}`, W, H, Object.fromEntries(DIRS.map((d) => [d, FRAMES])), paint, DURATIONS);
}

if (preview && sheets.length) {
  // rows = views (down, dside, side, uside, up), columns = frames: every frame, or with --compact one of
  // each (idle, blink, walk, run, attack strike, skill burst) with the monsters side by side; on tiles
  const tiles = readPng(path.join(ROOT, "assets/sprites/tiles", `${opt("theme") || "meadow"}.png`));
  const compact = argv.includes("--compact"), PAD = 2;
  const pick = (s) => compact
    ? [["idle", 0], ["idle", s.frames.idle - 1], ["walk", 2], ["run", 2], ["attack", 1], ["skill", 4]].filter(([a, i]) => s.frames[a] > i)
    : Object.entries(s.frames).flatMap(([a, n]) => Array.from({ length: n }, (_, i) => [a, i]));
  const cw = Math.max(...sheets.map((s) => s.W)) + PAD, ch = Math.max(...sheets.map((s) => s.H)) + PAD;
  const per = Math.max(...sheets.map((s) => pick(s).length)), perRow = compact ? Math.min(sheets.length, Math.max(1, Math.floor(1100 / (per * cw)))) : 1;
  const blocks = sheets.map((s) => ({ s, dirs: s.dirs || DIRS }));
  const rowsOf = (b) => b.dirs.length;
  const bands = []; for (let k = 0; k < blocks.length; k += perRow) bands.push(blocks.slice(k, k + perRow));
  const W = perRow * per * cw + (perRow - 1) * 6, Hh = bands.reduce((n, band) => n + Math.max(...band.map(rowsOf)) * ch + 6, 0), S = +(opt("scale") || 3);
  const img = new Uint8ClampedArray(W * Hh * 4);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const v = ((x >> 4) * 7 + (y >> 4) * 3) % 8, q = ((64 + (y & 15)) * tiles.w + v * 16 + (x & 15)) * 4;
    img.set(tiles.rgba.subarray(q, q + 4), (y * W + x) * 4);
  }
  let by = 0;
  for (const band of bands) {
    band.forEach(({ s, dirs }, bi) => {
      dirs.forEach((dir, r) => pick(s).forEach(([anim, i], col) => {
        const c = s.paint(dir, anim, i), ox = bi * (per * cw + 6) + col * cw + ((cw - s.W) >> 1), oy = by + r * ch + (ch - s.H);
        c.px.forEach((p, j) => { if (p) img.set(p, ((oy + Math.floor(j / s.W)) * W + ox + (j % s.W)) * 4); });
      }));
    });
    by += Math.max(...band.map(rowsOf)) * ch + 6;
  }
  const big = new Uint8ClampedArray(W * S * Hh * S * 4);
  for (let y = 0; y < Hh * S; y++) for (let x = 0; x < W * S; x++) { const q = (Math.floor(y / S) * W + Math.floor(x / S)) * 4; big.set(img.subarray(q, q + 4), (y * W * S + x) * 4); }
  const out = opt("out") || path.join(os.tmpdir(), "vof-monsters", `${keys.join("_") || family || "all"}.png`);
  writePng(out, W * S, Hh * S, big);
  console.log(`${out}  (${W * S}×${Hh * S})`);
}
