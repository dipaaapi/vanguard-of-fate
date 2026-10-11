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
 *
 * Overwrites the files it paints (hand edits included), so run it on keys you haven't edited by hand.
 * Then export: node tools/aseprite/export.mjs  (or export.mjs monster/<key> …)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, writePng, readPng, codeSprite } from "../lib.mjs";
import { build, Canvas, fromGame } from "./kit.mjs";
import { FRAMES, DURATIONS } from "./monsterkit.mjs";

const FAMILIES = {
  BruteSprite: "brute", DrakeSprite: "drake", CrabSprite: "crab", SerpentSprite: "serpent",
  ImpSprite: "imp", SpecterSprite: "specter", WolfSprite: "wolf", SlimeSprite: "slime"
};
const DIRS = ["down", "side", "up"];

const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf("--" + n); return i >= 0 ? argv[i + 1] : null; };
const keys = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--family" && argv[i - 1] !== "--out");
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
    const paint = (dir, anim, i) => fromGame(s.frame(dir, anim, i));
    if (preview) sheets.push({ key, W: s.w, H: s.h, paint, frames: s.frames });
    else build(`${kind}/${key}`, s.w, s.h, Object.fromEntries(DIRS.map((d) => [d, s.frames])), paint, DURATIONS);
    continue;
  }
  const { W, H } = P.SIZE;
  const paint = (dir, anim, i) => P.paint(def.sprite, { ...def, key }, dir, anim, i);
  if (preview) sheets.push({ key, W, H, paint, frames: FRAMES });
  else build(`${kind}/${key}`, W, H, Object.fromEntries(DIRS.map((d) => [d, FRAMES])), paint, DURATIONS);
}

if (preview && sheets.length) {
  // rows = monster × direction, columns = every frame of idle / walk / run / attack / skill, on meadow grass
  const tiles = readPng(path.join(ROOT, "assets/sprites/tiles", `${opt("theme") || "meadow"}.png`));
  const cols = Object.values(FRAMES).reduce((a, b) => a + b, 0), PAD = 2;
  const cw = Math.max(...sheets.map((s) => s.W)) + PAD, ch = Math.max(...sheets.map((s) => s.H)) + PAD;
  const W = cols * cw, Hh = sheets.length * DIRS.length * ch, S = +(opt("scale") || 3);
  const img = new Uint8ClampedArray(W * Hh * 4);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const v = ((x >> 4) * 7 + (y >> 4) * 3) % 8, s = ((64 + (y & 15)) * tiles.w + v * 16 + (x & 15)) * 4;
    img.set(tiles.rgba.subarray(s, s + 4), (y * W + x) * 4);
  }
  let row = 0;
  for (const s of sheets) for (const dir of DIRS) {
    let col = 0;
    for (const [anim, n] of Object.entries(s.frames)) for (let i = 0; i < n; i++, col++) {
      const c = s.paint(dir, anim, i), ox = col * cw + ((cw - s.W) >> 1), oy = row * ch + (ch - s.H);
      c.px.forEach((p, j) => { if (p) img.set(p, ((oy + Math.floor(j / s.W)) * W + ox + (j % s.W)) * 4); });
    }
    row++;
  }
  const big = new Uint8ClampedArray(W * S * Hh * S * 4);
  for (let y = 0; y < Hh * S; y++) for (let x = 0; x < W * S; x++) { const s = (Math.floor(y / S) * W + Math.floor(x / S)) * 4; big.set(img.subarray(s, s + 4), (y * W * S + x) * 4); }
  const out = opt("out") || path.join(os.tmpdir(), "vof-monsters", `${keys.join("_") || family || "all"}.png`);
  writePng(out, W * S, Hh * S, big);
  console.log(`${out}  (${W * S}×${Hh * S})`);
}
void fs; void Canvas;
