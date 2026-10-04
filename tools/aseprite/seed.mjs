#!/usr/bin/env node
/**
 * seed — start an Aseprite file from a creature's current code-drawn frames, so it can be repainted
 * in Aseprite instead of drawn from scratch.
 *
 *   node tools/aseprite/seed.mjs monster/slime          # → aseprite/monster/slime.aseprite
 *   node tools/aseprite/seed.mjs boss/malakor --force   # overwrite an existing file
 *
 * One tag per direction + animation ("down-idle", "side-walk", "up-attack", …), canvas = the code
 * sprite's size. Edit it in Aseprite, then run tools/aseprite/export.mjs.
 */
import { SRC_DIR, codeSprite, findAseprite, writePng } from "./lib.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const [key] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const force = process.argv.includes("--force");
if (!key) {
  console.error("usage: node tools/aseprite/seed.mjs <monster|boss>/<key> [--force]");
  process.exit(1);
}
const sprite = await codeSprite(key);
if (!sprite) {
  console.error(`"${key}" is not a creature sprite (monster/<key> or boss/<key>; humanoids use the Avatar and have no sheet support yet)`);
  process.exit(1);
}
const out = path.join(SRC_DIR, `${key}.aseprite`);
if (fs.existsSync(out) && !force) {
  console.error(`${path.relative(process.cwd(), out)} already exists (--force to overwrite)`);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vof-seed-"));
const tags = [];
let n = 0;
for (const dir of ["down", "side", "up"]) {
  for (const [anim, count] of Object.entries(sprite.frames)) {
    const from = n;
    for (let i = 0; i < count; i++) {
      const c = sprite.frame(dir, anim, i);
      writePng(path.join(tmp, `f${n++}.png`), c.width, c.height, c._rgba || new Uint8ClampedArray(c.width * c.height * 4));
    }
    tags.push(`${dir}-${anim}:${from}:${n - 1}`);
  }
}

fs.mkdirSync(path.dirname(out), { recursive: true });
const params = { dir: tmp, n, w: sprite.w, h: sprite.h, tags: tags.join(";"), out };
execFileSync(findAseprite(), ["-b", ...Object.entries(params).flatMap(([k, v]) => ["--script-param", `${k}=${v}`]),
  "--script", fileURLToPath(new URL("seed.lua", import.meta.url))], { stdio: "inherit" });
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${path.relative(process.cwd(), out)}  (${sprite.w}×${sprite.h}, ${n} frames, ${tags.length} tags)`);
