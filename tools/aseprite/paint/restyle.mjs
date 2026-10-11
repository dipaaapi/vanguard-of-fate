#!/usr/bin/env node
/**
 * restyle — give hand-made single-frame art (aseprite/<key>.aseprite, e.g. ui/guild_plate) the terrain tile
 * sets' look in place: the old flat dark outline is lifted off, colours are graded into the tiles' range
 * (js/avatar/tilestyle.js tileGrade) and a hue-shifted outline is drawn back (scenery.mjs tileOutline).
 * The drawing itself (shapes, faces, props) is kept as it was.
 *
 *   node tools/aseprite/paint/restyle.mjs ui/guild_plate ui/guild_guildMaster …
 *   node tools/aseprite/export.mjs ui/guild_plate …
 *
 * Run it once per file: a second pass grades the colours again.
 */
import path from "node:path";
import { readAse, writeAse } from "../asefile.mjs";
import { SRC_DIR } from "../lib.mjs";
import { Img } from "./scenery.mjs";
import { toHsl } from "../../../js/avatar/tilestyle.js";

export function restyle(key) {
  const file = path.join(SRC_DIR, `${key}.aseprite`), ase = readAse(file);
  if (ase.frames.length !== 1) throw new Error(`${key}: ${ase.frames.length} frames (restyle takes single-frame art)`);
  const img = new Img(ase.w, ase.h);
  img.d.set(ase.frames[0].rgba);
  // lift the old ink: near-black opaque pixels on the silhouette's edge
  const clear = [];
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const p = img.get(x, y);
    if (!p || p[3] < 200 || toHsl(p)[2] > 0.16) continue;
    if (!img.get(x + 1, y) || !img.get(x - 1, y) || !img.get(x, y + 1) || !img.get(x, y - 1)) clear.push((y * img.w + x) * 4 + 3);
  }
  clear.forEach((j) => { img.d[j] = 0; });
  img.grade();
  img.tileOutline();
  writeAse(file, { w: ase.w, h: ase.h, layer: ase.layers[0] || "art", frames: [{ rgba: img.d, duration: ase.frames[0].duration || 0.12 }] });
  console.log(`aseprite/${key}.aseprite  restyled (${ase.w}×${ase.h})`);
}

for (const k of process.argv.slice(2)) restyle(k);
