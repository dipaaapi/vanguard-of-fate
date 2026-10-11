#!/usr/bin/env node
/**
 * lineup.mjs — characters standing on a terrain tile set, to check that monsters, mercenaries, summons
 * and safe-zone art match the tiles (palette, outline, scale). Plain Node, no browser.
 *
 *   node tools/tilemap/lineup.mjs meadow monster:wolf merc:axe summon:hound
 *   node tools/tilemap/lineup.mjs canopy act:canopy --scale 3        # every monster of one map
 *   node tools/tilemap/lineup.mjs coast zone:coast                   # a safe zone on its tiles
 *   node tools/tilemap/lineup.mjs meadow monster:wolf --code         # the code-drawn frames, not the sheet
 *   node tools/tilemap/lineup.mjs meadow monster:wolf --out /tmp/wolf.png --anim walk
 *
 * Subjects: monster:<key>, boss:<key>, merc:<key>, summon:<key>, npc:<id>, act:<platform id> (its monsters),
 * zone:<key> (assets/sprites/zone/<key>.png, frame 0), ui:<key> (assets/ui/<key>.png, e.g. ui:guild_hall).
 * Each character shows down, side and up in its idle pose (or --anim). An exported Aseprite sheet
 * (assets/sprites/<kind>/<key>.png) is used when there is one, as in the game.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, codeSprite, readPng, writePng } from "../aseprite/lib.mjs";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i >= 0 ? argv[i + 1] : d; };
const valued = new Set(["--scale", "--out", "--anim"]);
const pos = argv.filter((a, i) => !a.startsWith("--") && !valued.has(argv[i - 1]));
const [theme = "meadow", ...subjects] = pos;
const scale = +opt("scale", 2), anim = opt("anim", "idle"), codeOnly = argv.includes("--code");
const out = path.resolve(opt("out", path.join(os.tmpdir(), "vof-lineup", `${theme}-${subjects.join("_").replace(/[^\w-]+/g, "-").slice(0, 60) || "all"}.png`)));
if (!subjects.length) { console.error("usage: lineup.mjs <theme> <kind:key>… [--scale n] [--anim a] [--code] [--out file]"); process.exit(1); }

// ---------- images ----------
const img = (w, h) => ({ w, h, rgba: new Uint8ClampedArray(w * h * 4) });
function blit(dst, src, dx, dy, sx = 0, sy = 0, w = src.w, h = src.h) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = dx + x, Y = dy + y;
    if (X < 0 || Y < 0 || X >= dst.w || Y >= dst.h) continue;
    const s = ((sy + y) * src.w + sx + x) * 4, d = (Y * dst.w + X) * 4, a = src.rgba[s + 3] / 255;
    if (!a) continue;
    if (!dst.rgba[d + 3]) { dst.rgba.set(src.rgba.subarray(s, s + 4), d); continue; }    // onto an empty cell: keep the alpha
    for (let k = 0; k < 3; k++) dst.rgba[d + k] = Math.round(dst.rgba[d + k] * (1 - a) + src.rgba[s + k] * a);
    dst.rgba[d + 3] = 255;
  }
}
const sheetPath = (theme) => path.join(ROOT, "assets/sprites/tiles", `${theme}.png`);
if (!fs.existsSync(sheetPath(theme))) { console.error(`no tile set assets/sprites/tiles/${theme}.png`); process.exit(1); }
const tiles = readPng(sheetPath(theme));
// ground: the plain-ground variants, with a path band through the middle
function ground(w, h) {
  const g = img(w, h), band = [Math.floor(h / 16 / 2) * 16];
  for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) {
    const v = ((x >> 4) * 7 + (y >> 4) * 3) % 8;
    if (band.includes(y)) blit(g, tiles, x, y, 128 + (((x >> 4) % 4) * 16), 64, 16, 16);
    else blit(g, tiles, x, y, v * 16, 64, 16, 16);
  }
  return g;
}

// ---------- subjects → frames ----------
const { load } = await import(pathToFileURL(path.join(ROOT, "scripts/headless.mjs")).href);
function sheetFrames(key) {
  const json = path.join(ROOT, "assets/sprites", `${key}.json`), png = path.join(ROOT, "assets/sprites", `${key}.png`);
  if (codeOnly || !fs.existsSync(json)) return null;
  const data = JSON.parse(fs.readFileSync(json, "utf8")), sheet = readPng(png);
  const tags = Object.fromEntries((data.meta.frameTags || []).map((t) => [t.name, t]));
  return (dir, a) => {
    const t = tags[`${dir}-${a}`] || tags[`side-${a}`] || tags[`side-fly`];
    if (!t) return null;
    const r = data.frames[t.from].frame, f = img(r.w, r.h);
    blit(f, sheet, 0, 0, r.x, r.y, r.w, r.h);
    return f;
  };
}
async function character(spec) {
  const [kind, key] = spec.split(":");
  const sheet = sheetFrames(`${kind}/${key}`);
  const code = await codeSprite(`${kind}/${key}`);
  if (!code && !sheet) { console.warn(`  ! ${spec}: no sprite`); return []; }
  return ["down", "side", "up"].map((dir) => {
    const s = sheet && sheet(dir, anim);
    if (s) return s;
    if (!code) return null;
    const c = code.frame(dir, code.frames[anim] ? anim : Object.keys(code.frames)[0], 0);
    return { w: c.width, h: c.height, rgba: c._rgba || new Uint8ClampedArray(c.width * c.height * 4) };
  }).filter(Boolean);
}
const groups = [];
for (const s of subjects) {
  const [kind, key] = s.split(":");
  if (kind === "zone" || kind === "ui") {
    const file = kind === "zone" ? path.join(ROOT, "assets/sprites/zone", `${key}.png`) : path.join(ROOT, "assets/ui", `${key}.png`);
    if (!fs.existsSync(file)) { console.warn(`  ! ${s}: no ${path.relative(ROOT, file)}`); continue; }
    const p = readPng(file);
    let w = p.w, h = p.h;
    const json = file.replace(/\.png$/, ".json");
    if (fs.existsSync(json)) ({ w, h } = JSON.parse(fs.readFileSync(json, "utf8")).frames[0].frame);
    const f = img(w, h); blit(f, p, 0, 0, 0, 0, w, h);
    groups.push([f]);
  } else if (kind === "act") {
    const { PLATFORMS } = await load("js/world/platforms.js");
    const { FRONTIERS } = await load("js/world/frontiers.js");
    const pl = { ...PLATFORMS, ...FRONTIERS }[key];
    if (!pl) { console.warn(`  ! ${s}: no platform`); continue; }
    const keys = [...new Set([...(pl.monsters || []), ...(pl.kinds || []), ...(pl.spawns || []).map((x) => x.kind || x)].filter((k) => typeof k === "string"))];
    for (const k of keys) groups.push(await character(`monster:${k}`));
  } else groups.push(await character(s));
}
const cells = groups.filter((g) => g.length);
if (!cells.length) { console.error("nothing to draw"); process.exit(1); }

// ---------- layout: rows up to ~480 px wide ----------
const PAD = 6, MAXW = Math.max(480, ...cells.map((g) => g.reduce((a, f) => a + f.w + PAD, PAD)));
const rows = [[]];
let rw = PAD;
for (const g of cells) {
  const gw = g.reduce((a, f) => a + f.w + PAD, 0) + PAD;
  if (rw + gw > MAXW && rows.at(-1).length) { rows.push([]); rw = PAD; }
  rows.at(-1).push(g); rw += gw;
}
const rowH = rows.map((r) => Math.max(...r.flat().map((f) => f.h)) + PAD * 2);
const W = Math.ceil(MAXW / 16) * 16, H = Math.ceil(rowH.reduce((a, b) => a + b, 0) / 16) * 16;
const sheet = ground(W, H);
let y = 0;
rows.forEach((r, ri) => {
  let x = PAD;
  for (const g of r) {
    for (const f of g) { blit(sheet, f, x, y + rowH[ri] - PAD - f.h); x += f.w + PAD; }
    x += PAD;
  }
  y += rowH[ri];
});
const big = img(W * scale, H * scale);
for (let j = 0; j < big.h; j++) for (let i = 0; i < big.w; i++) {
  const s = (Math.floor(j / scale) * W + Math.floor(i / scale)) * 4, d = (j * big.w + i) * 4;
  big.rgba.set(sheet.rgba.subarray(s, s + 4), d);
}
writePng(out, big.w, big.h, big.rgba);
console.log(`${out}  (${big.w}×${big.h})`);
