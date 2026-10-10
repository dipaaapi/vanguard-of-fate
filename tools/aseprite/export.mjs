#!/usr/bin/env node
/**
 * export — turn every aseprite/<kind>/<key>.aseprite into a sprite sheet the game loads
 * (js/avatar/sheets.js), using Aseprite's own CLI (`aseprite -b`).
 *
 *   node tools/aseprite/export.mjs                  # every file under aseprite/
 *   node tools/aseprite/export.mjs monster/slime    # only these keys
 *
 * Writes assets/sprites/<kind>/<key>.png + .json (ui/<key> → assets/ui/<key>.png, one image for the CSS) (Aseprite json-array with tags) and rewrites
 * assets/sprites/manifest.json from what is on disk. Hidden layers are left out, so a hidden
 * reference layer is fine. Checks each sheet against the code sprite it replaces: tag names
 * ("<down|side|up>-<anim>"), animations the game plays, and canvas size (same or larger).
 * Set ASEPRITE to the executable if it isn't on PATH or in the usual install folders. Without Aseprite
 * (e.g. a cloud session) the files are read by tools/aseprite/asefile.mjs instead (visible layers,
 * Normal blending), which gives the same sheet; --node forces that path.
 */
import { ROOT, SRC_DIR, OUT_DIR, codeSprite, findAseprite, writePng } from "./lib.mjs";
import { readAse } from "./asefile.mjs";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const EXTRA_ANIMS = ["run", "skill"];
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const sources = (dir) => fs.existsSync(dir)
  ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? sources(path.join(dir, e.name)) : /\.(aseprite|ase)$/i.test(e.name) ? [path.join(dir, e.name)] : [])
  : [];
const keyOf = (file) => rel(file).replace(/^aseprite\//, "").replace(/\.(aseprite|ase)$/i, "");

const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith("--"));
const files = sources(SRC_DIR).filter((f) => !only.length || only.includes(keyOf(f)));
if (!files.length) {
  console.error(only.length ? `no aseprite/<key>.aseprite for: ${only.join(", ")}` : "nothing to export: aseprite/ has no .aseprite files");
  process.exit(1);
}

let exe = null;
if (!args.includes("--node")) try { exe = findAseprite(); } catch { console.log("Aseprite not found: reading the files with tools/aseprite/asefile.mjs"); }

// Same output as `aseprite -b --sheet … --format json-array --list-tags`, from the file read in Node
function exportInNode(file, png, json) {
  const ase = readAse(file);
  ase.warnings.forEach((w) => console.warn(`  ! ${keyOf(file)}: ${w}`));
  const cols = Math.max(1, Math.min(ase.frames.length, Math.floor(4096 / ase.w)));
  const rows = Math.ceil(ase.frames.length / cols);
  const W = cols * ase.w, H = rows * ase.h, sheet = new Uint8ClampedArray(W * H * 4);
  const frames = ase.frames.map((f, i) => {
    const x = (i % cols) * ase.w, y = Math.floor(i / cols) * ase.h;
    for (let r = 0; r < ase.h; r++) sheet.set(f.rgba.subarray(r * ase.w * 4, (r + 1) * ase.w * 4), ((y + r) * W + x) * 4);
    return { filename: `${path.basename(file).replace(/\.\w+$/, "")} ${i}.aseprite`, frame: { x, y, w: ase.w, h: ase.h }, rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: ase.w, h: ase.h }, sourceSize: { w: ase.w, h: ase.h }, duration: Math.round(f.duration * 1000) };
  });
  writePng(png, W, H, sheet);
  fs.writeFileSync(json, JSON.stringify({ frames, meta: { app: "tools/aseprite/asefile.mjs", image: path.basename(png), format: "RGBA8888",
    size: { w: W, h: H }, scale: "1", frameTags: ase.tags.map((t) => ({ name: t.name, from: t.from, to: t.to, direction: t.direction, color: "#000000ff" })) } }, null, 1) + "\n");
}
let problems = 0;
for (const file of files) {
  const key = keyOf(file);
  if (key.startsWith("ui/")) {   // interface art: one image, assets/ui/<name>.png, used by the CSS (9-slice border-image)
    const ase = readAse(file);
    const png = path.join(ROOT, "assets", `${key}.png`);
    fs.mkdirSync(path.dirname(png), { recursive: true });
    writePng(png, ase.w, ase.h, ase.frames[0].rgba);
    console.log(`${rel(png)}  ${ase.w}×${ase.h}`);
    continue;
  }
  const png = path.join(OUT_DIR, `${key}.png`), json = path.join(OUT_DIR, `${key}.json`);
  fs.mkdirSync(path.dirname(png), { recursive: true });
  if (exe) execFileSync(exe, ["-b", rel(file), "--sheet", rel(png), "--data", rel(json), "--format", "json-array",
    "--list-tags", "--sheet-type", "packed"], { cwd: ROOT, stdio: "inherit" });
  else exportInNode(file, png, json);

  const data = JSON.parse(fs.readFileSync(json, "utf8"));
  const warn = (msg) => { problems++; console.warn(`  ! ${key}: ${msg}`); };
  if (key.startsWith("fx/")) {   // effects: one "down-play" tag, any size (js/fxsprites.js)
    if (!(data.meta.frameTags || []).some((t) => t.name === "down-play")) warn(`effect needs a "down-play" tag`);
    console.log(`${rel(png)}  ${data.frames[0].frame.w}×${data.frames[0].frame.h}  play×${data.frames.length}`);
    continue;
  }
  if (key.startsWith("tiles/")) {   // terrain tile sets: 256×96 per frame, loaded on demand by js/world/terrain.js
    const { w, h } = data.frames[0].frame;
    if (w !== 256 || h !== 96) warn(`tile set is ${w}×${h}; js/world/terrain.js expects 256×96 (TILESHEET)`);
    console.log(`${rel(png)}  ${w}×${h}  frames×${data.frames.length}`);
    continue;
  }
  if (key.startsWith("zone/")) {   // safe-zone art: one looping "down-idle" tag, placed by js/world/zonesprites.js
    const { w, h } = data.frames[0].frame;
    if (!(data.meta.frameTags || []).some((t) => t.name === "down-idle")) warn(`safe-zone art needs a "down-idle" tag`);
    console.log(`${rel(png)}  ${w}×${h}  idle×${data.frames.length}`);
    continue;
  }
  const sprite = await codeSprite(key);
  if (!sprite) warn(`no creature sprite "${key}" in js/bestiary.js, so the game won't use this sheet`);
  const used = [];
  for (const tag of data.meta.frameTags || []) {
    const m = /^(down|side|up)-(\w+)$/.exec(tag.name);
    if (!m) { warn(`tag "${tag.name}" isn't "<down|side|up>-<anim>", ignored`); continue; }
    const count = tag.to - tag.from + 1;
    used.push(`${tag.name}×${count}`);
    if (!sprite) continue;
    // Monsters play idle / walk / attack, plus run (chasing) and skill (charging) when the sheet has them
    if (!sprite.frames[m[2]] && !EXTRA_ANIMS.includes(m[2])) warn(`tag "${tag.name}": the game never plays "${m[2]}" (${[...Object.keys(sprite.frames), ...EXTRA_ANIMS].join(", ")})`);
  }
  const { w, h } = data.frames[0].frame;
  if (sprite && (w < sprite.w || h < sprite.h)) warn(`canvas is ${w}×${h}, smaller than the code sprite's ${sprite.w}×${sprite.h}; the feet won't line up`);
  else if (sprite && (w - sprite.w) % 2) warn(`canvas is ${w} wide; an even difference from ${sprite.w} keeps the feet centred`);
  if (!used.length) warn("no usable tags, nothing will show in game");
  console.log(`${rel(png)}  ${w}×${h}  ${used.join(" ")}`);
}

// Manifest = every exported sheet that still has its source file (tile sets load on demand, not at boot)
const keys = sources(SRC_DIR).map(keyOf).filter((k) => !k.startsWith("tiles/") && fs.existsSync(path.join(OUT_DIR, `${k}.png`))).sort();
fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify({ sheets: keys }, null, 2) + "\n");
console.log(`${rel(path.join(OUT_DIR, "manifest.json"))}  ${keys.length} sheet(s)${problems ? `, ${problems} warning(s)` : ""}`);
