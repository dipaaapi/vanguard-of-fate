#!/usr/bin/env node
/**
 * export — turn every aseprite/<kind>/<key>.aseprite into a sprite sheet the game loads
 * (js/avatar/sheets.js), using Aseprite's own CLI (`aseprite -b`).
 *
 *   node tools/aseprite/export.mjs                  # every file under aseprite/
 *   node tools/aseprite/export.mjs monster/slime    # only these keys
 *
 * Writes assets/sprites/<kind>/<key>.png + .json (Aseprite json-array with tags) and rewrites
 * assets/sprites/manifest.json from what is on disk. Hidden layers are left out, so a hidden
 * reference layer is fine. Checks each sheet against the code sprite it replaces: tag names
 * ("<down|side|up>-<anim>"), animations the game plays, and canvas size (same or larger).
 * Set ASEPRITE to the executable if it isn't on PATH or in the usual install folders.
 */
import { ROOT, SRC_DIR, OUT_DIR, codeSprite, findAseprite } from "./lib.mjs";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const EXTRA_ANIMS = ["run", "skill"];
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const sources = (dir) => fs.existsSync(dir)
  ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? sources(path.join(dir, e.name)) : /\.(aseprite|ase)$/i.test(e.name) ? [path.join(dir, e.name)] : [])
  : [];
const keyOf = (file) => rel(file).replace(/^aseprite\//, "").replace(/\.(aseprite|ase)$/i, "");

const only = process.argv.slice(2);
const files = sources(SRC_DIR).filter((f) => !only.length || only.includes(keyOf(f)));
if (!files.length) {
  console.error(only.length ? `no aseprite/<key>.aseprite for: ${only.join(", ")}` : "nothing to export: aseprite/ has no .aseprite files");
  process.exit(1);
}

const exe = findAseprite();
let problems = 0;
for (const file of files) {
  const key = keyOf(file);
  const png = path.join(OUT_DIR, `${key}.png`), json = path.join(OUT_DIR, `${key}.json`);
  fs.mkdirSync(path.dirname(png), { recursive: true });
  execFileSync(exe, ["-b", rel(file), "--sheet", rel(png), "--data", rel(json), "--format", "json-array",
    "--list-tags", "--sheet-type", "packed"], { cwd: ROOT, stdio: "inherit" });

  const data = JSON.parse(fs.readFileSync(json, "utf8"));
  const warn = (msg) => { problems++; console.warn(`  ! ${key}: ${msg}`); };
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

// Manifest = every exported sheet that still has its source file
const keys = sources(SRC_DIR).map(keyOf).filter((k) => fs.existsSync(path.join(OUT_DIR, `${k}.png`))).sort();
fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify({ sheets: keys }, null, 2) + "\n");
console.log(`${rel(path.join(OUT_DIR, "manifest.json"))}  ${keys.length} sheet(s)${problems ? `, ${problems} warning(s)` : ""}`);
