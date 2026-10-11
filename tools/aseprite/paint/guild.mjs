// Meridian Adventurers' Guild art (js/world/guildhall.js, js/guildfield.js, js/guildceremony.js), drawn in the
// terrain tile sets' style like the safe zones (tools/aseprite/paint/zones.mjs): the hall is painted with the
// scenery kit (slate roofs, timber walls, flagstones, banners, braziers), graded colours and hue-shifted
// outlines, and saved as the single-frame aseprite/ui/guild_hall.aseprite (static-image pipeline).
//   node tools/aseprite/paint/guild.mjs && node tools/aseprite/export.mjs ui/guild_hall
import { Canvas } from "./kit.mjs";
import { writeAse } from "../asefile.mjs";
import { SRC_DIR, ROOT, writePng } from "../lib.mjs";
import * as K from "./scenery.mjs";
import path from "node:path";
import fs from "node:fs";
const { Img, rgb, ramp, shade, pick, hash, shingles, timberWall, windowLit, shadow, flagstones, hangingBanner, brazier, barrel, crate, glow } = K;

// guild colours: teal slate and gold, on the hub's cream plaster and oak
const TEAL = ramp("#0f2429", "#163840", "#1f4d55", "#2a666c", "#398584", "#55a8a0");
const PLASTER = ramp("#a89a80", "#c4b698", "#dbcfb2", "#ece3cb");
const WOOD = ramp("#3b2414", "#5e3b1a", "#7a5230", "#9c6b3c", "#b8864f");
const STONE = ramp("#3d3a40", "#57535a", "#77727a", "#98939a", "#b8b3b8");
const COURT = { mortar: rgb("#2c2830"), stone: ramp("#5c5660", "#6f6973", "#847d86", "#999199", "#aea6ad") };
const GOLD = ramp("#8a6a1a", "#c9a227", "#f2d16b");
const CLOTH = ramp("#123a3a", "#1d5552", "#2b766e", "#3f9a8c");

/** Stone block wall (light from the left, bevelled courses). */
function ashlar(img, x0, y0, w, h, seed, rows = 7, bw = 12) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const r = Math.floor((y - y0) / rows), j = (y - y0) % rows, k = Math.floor((x - x0 + (r % 2) * (bw / 2)) / bw), i = (x - x0 + (r % 2) * (bw / 2)) % bw;
    let v = 0.45 + (hash(k, r, seed) - 0.5) * 0.3 - (x - x0) / w * 0.18;
    if (j === 0 || i === 0) v += 0.2;
    if (j === rows - 1 || i === bw - 1) v = 0.04;
    img.put(x, y, pick(STONE, v, x, y));
  }
}

function hall() {
  const W = 280, Hh = 180, L = { ground: new Img(W, Hh), buildings: new Img(W, Hh), props: new Img(W, Hh), fire: new Img(W, Hh) };
  const g = L.ground, b = L.buildings, p = L.props, f = 0;
  // forecourt: flagstones with rounded corners, a step up to the door
  const court = (x, y) => { const dx = Math.max(10 - x, x - (W - 11), 0), dy = Math.max(146 - y, y - 163, 0); return Math.hypot(dx, dy) <= 8; };
  flagstones(g, 2, 138, W - 4, 34, COURT, 41, { mask: court, rowH: 8 });
  shadow(g, 70, 150, 58, 5, 90); shadow(g, 210, 150, 58, 5, 90);
  // wings: stone footing, timber-framed plaster walls, lit windows, slate roofs
  for (const [x, w, seed] of [[18, 104, 3], [158, 104, 9]]) {
    ashlar(b, x, 140, w, 10, seed, 5, 10);
    timberWall(b, x, 88, w, 52, PLASTER, WOOD, seed);
    for (const wx of [12, 40, 70]) {
      const lit = Math.sin(seed + wx) * 0.5 + 0.5;
      windowLit(b, x + wx, 100, 10, 12, WOOD[0], lit);
      windowLit(b, x + wx + 1, 120, 8, 9, WOOD[0], 1 - lit);
      b.rect(x + wx - 1, 113, 12, 2, STONE[3]);                         // sill
      glow(L.fire, x + wx + 5, 152, 9, rgb("#ffb347"), 14);
    }
    shingles(b, x - 6, x + w + 6, 44, 89, TEAL, 17 + seed, { inset: 12, rowH: 5, sw: 8 });
    b.rect(x + 6, 42, w - 12, 2, TEAL[5]);                                // ridge cap
    b.rect(x - 6, 88, w + 12, 1, shade(TEAL[0], -0.3));                   // eave shadow
    const chx = x + (seed < 5 ? 18 : w - 26);                             // chimney
    ashlar(b, chx, 30, 8, 18, seed + 1, 4, 5); b.rect(chx - 1, 29, 10, 2, STONE[1]);
  }
  // gatehouse: stone tower with a steep gable, the guild star window and an arched oak door
  ashlar(b, 106, 54, 68, 96, 21);
  shingles(b, 100, 180, 8, 58, TEAL, 33, { inset: 40, rowH: 5, sw: 7 });
  b.rect(98, 57, 84, 2, shade(TEAL[0], -0.3));
  b.rect(139, 2, 2, 8, WOOD[1]); b.rect(136, 4, 8, 2, GOLD[2]);           // finial
  b.ellipse(140, 76, 11, 11, GOLD[0]); b.ellipse(140, 76, 10, 10, GOLD[1]);
  b.ellipse(140, 76, 8, 8, (x, y) => pick(TEAL, 0.75 - (x - 132) / 22 - (y - 68) / 30, x, y));
  const st = (r) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * 0.43 : r; return [140 + Math.cos(a) * d, 76 + Math.sin(a) * d]; });
  b.poly(st(6.5), GOLD[2]);
  b.ellipse(140, 112, 15, 14, STONE[0]); b.rect(125, 112, 30, 38, STONE[0]);   // arch reveal
  b.ellipse(140, 113, 13, 12, (x, y) => pick(WOOD, 0.45 + ((x - 127) % 5 === 0 ? -0.25 : 0) - (x - 127) / 60, x, y));
  b.rect(127, 113, 26, 37, (x, y) => pick(WOOD, 0.45 + ((x - 127) % 5 === 0 ? -0.25 : 0) - (x - 127) / 60 + ((y - 113) % 14 === 0 ? -0.2 : 0), x, y));
  b.rect(139, 104, 2, 46, WOOD[0]);
  b.put(136, 132, GOLD[2]); b.put(143, 132, GOLD[2]);                     // door rings
  ashlar(b, 116, 150, 48, 4, 51, 4, 8); ashlar(b, 112, 154, 56, 4, 52, 4, 8);   // steps
  // banners either side of the door, braziers at the steps
  hangingBanner(b, 110, 66, 9, 32, f, CLOTH, GOLD[2], "sword");
  hangingBanner(b, 161, 66, 9, 32, f, CLOTH, GOLD[2], "sword");
  brazier(L, 100, 160, 1, 0.4, "#2f3a3e"); brazier(L, 180, 160, 4, 1.7, "#2f3a3e");
  // contract board and stores
  b.rect(8, 118, 2, 32, WOOD[1]); b.rect(26, 118, 2, 32, WOOD[1]);
  p.rect(6, 114, 24, 22, (x, y) => pick(WOOD, 0.55 - (y - 114) / 40, x, y));
  for (const [nx, ny, c] of [[8, 117, "#ece2cc"], [16, 116, "#f5e6b8"], [23, 118, "#e2d3b4"], [11, 126, "#efe6d0"], [20, 126, "#ece2cc"]]) {
    p.rect(nx, ny, 6, 7, rgb(c)); p.put(nx + 2, ny, rgb("#b91c1c"));
  }
  barrel(p, 254, 140, 7, 9, WOOD); barrel(p, 262, 142, 6, 8, WOOD); crate(p, 246, 144, 7, WOOD);
  shadow(g, 258, 151, 12, 2);
  // the tile sets' look
  for (const n of ["ground", "buildings", "props"]) L[n].grade();
  b.tileOutline(); p.tileOutline();
  const out = new Img(W, Hh);
  for (const n of ["ground", "buildings", "props", "fire"]) out.draw(L[n]);
  const c = new Canvas(W, Hh);
  for (let j = 0; j < W * Hh; j++) if (out.d[j * 4 + 3]) c.px[j] = [...out.d.subarray(j * 4, j * 4 + 4)];
  return c;
}

// The plate, staff portraits, caravan and field resources are hand-finished Aseprite art (aseprite/ui/guild_*.aseprite);
// tools/aseprite/paint/restyle.mjs gave them the tile style in place, so this painter leaves them alone.
const KEYS = ["hall", "plate", "guildMaster", "guildRepresentative", "guildClerk", "guildScout", "guildInflictionist", "caravan", "herb", "stone"];
const art = { hall: hall() };
for (const [key, c] of Object.entries(art)) writeAse(path.join(SRC_DIR, "ui", `guild_${key}.aseprite`), { w: c.w, h: c.h, layer: "Guild art", frames: [{ rgba: c.rgba(), duration: 0.12 }] });
const preview = new Canvas(art.hall.w, art.hall.h); preview.blit(art.hall, 0, 0);
fs.mkdirSync(path.join(ROOT, ".codex"), { recursive: true }); writePng(path.join(ROOT, ".codex", "guild-art.png"), preview.w, preview.h, preview.rgba());
fs.writeFileSync(path.join(ROOT, "assets", "ui", "guild.json"), JSON.stringify(KEYS.map((k) => `guild_${k}`), null, 2) + "\n");
console.log("Painted aseprite/ui/guild_hall.aseprite");
