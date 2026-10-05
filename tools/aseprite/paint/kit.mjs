// Painting kit for the procedural Aseprite starting points (tools/aseprite/paint/*.mjs):
// a pixel buffer with lit, dithered shapes, outlines and particles, plus build() which turns
// painted frames into aseprite/<key>.aseprite through seed.lua (or asefile.mjs without Aseprite). The .aseprite is the source of
// truth afterwards; these painters only give hand edits a detailed first pass.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SRC_DIR, tryAseprite, writePng } from "../lib.mjs";
import { writeAse } from "../asefile.mjs";

export const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
export const mixc = (a, b, t) => [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t)).concat(255);
const BAYER = [[0, 2], [3, 1]];
const LIGHT = (() => { const l = [-0.45, -0.75, 0.5], n = Math.hypot(...l); return l.map((v) => v / n); })();

export class Canvas {
  constructor(w, h) { this.w = w; this.h = h; this.px = new Array(w * h).fill(null); this.fx = new Set(); }
  set(x, y, c, fx = false) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    this.px[y * this.w + x] = c;
    if (fx) this.fx.add(y * this.w + x); else this.fx.delete(y * this.w + x);
  }
  get(x, y) { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y * this.w + x] : null; }
  // Set only where something is already painted (details on a body)
  over(x, y, c) { if (this.get(x, y)) this.set(x, y, c); }

  /**
   * Lit ellipse. ramp = colours dark → light. opts: lean (shear per row above `base`), bias (brightness),
   * rim (colour for the lit top-left edge), belly ({ c, from }) lower part colour, flat (cut below y).
   */
  blob(cx, cy, rx, ry, ramp, o = {}) {
    const base = o.base ?? cy + ry, lean = o.lean || 0, bias = o.bias || 0;
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      for (let x = Math.floor(cx - rx - 6); x <= Math.ceil(cx + rx + 6); x++) {
        const sx = x + 0.5 - (cx + lean * (base - (y + 0.5)));
        const nx = sx / rx, ny = (y + 0.5 - cy) / ry, k = nx * nx + ny * ny;
        if (k > 1 || (o.flat != null && y + 0.5 > o.flat)) continue;
        const nz = Math.sqrt(Math.max(0, 1 - k));
        let li = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2] + bias;
        let v = (li + 0.35) * (ramp.length / 2) + (BAYER[y & 1][x & 1] / 4 - 0.375) * 0.9;
        let col = ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(v)))];
        if (o.belly && ny > o.belly.from) col = o.belly.c[Math.max(0, Math.min(o.belly.c.length - 1, Math.floor((li + 0.5) * o.belly.c.length / 1.5)))];
        if (o.rim && k > 0.7 && nx < -0.1 && ny < -0.15) col = o.rim;
        this.set(x, y, col);
      }
    }
  }
  /** Thick line (limb, tail segment) from a to b, width w, colour by position t (0..1) or fixed. */
  line(x0, y0, x1, y1, w, col) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      const c = typeof col === "function" ? col(t) : col;
      for (let dy = 0; dy < w; dy++) for (let dx = 0; dx < w; dx++) this.set(x - (w - 1) / 2 + dx, y - (w - 1) / 2 + dy, c);
    }
  }
  /** Filled polygon (ears, feathers, blades). */
  poly(pts, col) {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const xs = [];
      pts.forEach((a, i) => {
        const b = pts[(i + 1) % pts.length];
        if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) xs.push(a[0] + (y + 0.5 - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      });
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) this.set(x, y, typeof col === "function" ? col(x, y) : col);
    }
  }
  /** Outline every painted pixel (except effects) with `col`. */
  outline(col) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const j = (y + dy) * this.w + x + dx; return this.get(x + dx, y + dy) && !this.fx.has(j); })) add.push([x, y]);
    }
    add.forEach(([x, y]) => this.set(x, y, col));
  }
  /** Draw another canvas onto this one at (dx, dy). */
  blit(src, dx, dy) { src.px.forEach((c, j) => { if (c) this.set(dx + (j % src.w), dy + Math.floor(j / src.w), c, src.fx.has(j)); }); }
  /** Sparkle / glow particle (not outlined). */
  spark(x, y, col, big = false) {
    this.set(x, y, col, true);
    if (big) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { if (!this.get(x + dx, y + dy)) this.set(x + dx, y + dy, col, true); });
  }
  rgba() { const out = new Uint8ClampedArray(this.w * this.h * 4); this.px.forEach((c, j) => { if (c) out.set(c, j * 4); }); return out; }
}

/** Pixels of a game canvas (headless, canvas._rgba) as a Canvas. */
export function fromGame(c) {
  const k = new Canvas(c.width, c.height), d = c._rgba;
  if (d) for (let j = 0; j < c.width * c.height; j++) if (d[j * 4 + 3]) k.px[j] = [d[j * 4], d[j * 4 + 1], d[j * 4 + 2], 255];
  return k;
}

/**
 * Paint every frame and save aseprite/<key>.aseprite. frames = { dir: { anim: count } };
 * paint(dir, anim, i, count) returns a Canvas. Frame durations (seconds) per animation are optional.
 */
export function build(key, w, h, frames, paint, durations = {}) {
  const exe = tryAseprite();
  if (!exe) return buildNode(key, w, h, frames, paint, durations);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vof-paint-"));
  const tags = [];
  let n = 0;
  const dur = [];
  for (const [dir, anims] of Object.entries(frames)) for (const [anim, count] of Object.entries(anims)) {
    const from = n;
    for (let i = 0; i < count; i++) {
      const c = paint(dir, anim, i, count);
      writePng(path.join(tmp, `f${n++}.png`), w, h, c.rgba());
      dur.push(durations[anim] || 0.12);
    }
    tags.push(`${dir}-${anim}:${from}:${n - 1}`);
  }
  const out = path.join(SRC_DIR, `${key}.aseprite`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const params = { dir: tmp, n, w, h, tags: tags.join(";"), durations: dur.join(","), out };
  execFileSync(exe, ["-b", ...Object.entries(params).flatMap(([k, v]) => ["--script-param", `${k}=${v}`]),
    "--script", fileURLToPath(new URL("../seed.lua", import.meta.url))], { stdio: "inherit" });
  // keep the frames for a contact sheet when asked
  if (process.env.PAINT_KEEP) fs.cpSync(tmp, path.join(process.env.PAINT_KEEP, key.replace(/\//g, "_")), { recursive: true });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`aseprite/${key}.aseprite  ${w}×${h}, ${n} frames, ${tags.length} tags`);
}

// The same file without Aseprite: one visible layer "art", tags "<dir>-<anim>", durations.
function buildNode(key, w, h, frames, paint, durations) {
  const list = [], tags = [];
  for (const [dir, anims] of Object.entries(frames)) for (const [anim, count] of Object.entries(anims)) {
    const from = list.length;
    for (let i = 0; i < count; i++) list.push({ rgba: paint(dir, anim, i, count).rgba(), duration: durations[anim] || 0.12 });
    tags.push({ name: `${dir}-${anim}`, from, to: list.length - 1 });
  }
  if (process.env.PAINT_KEEP) {
    const keep = path.join(process.env.PAINT_KEEP, key.replace(/\//g, "_"));
    list.forEach((f, n) => writePng(path.join(keep, `f${n}.png`), w, h, f.rgba));
  }
  writeAse(path.join(SRC_DIR, `${key}.aseprite`), { w, h, frames: list, tags });
  console.log(`aseprite/${key}.aseprite  ${w}×${h}, ${list.length} frames, ${tags.length} tags (Node writer)`);
}
