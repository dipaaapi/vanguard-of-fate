// Scenery kit for the safe-zone painters (tools/aseprite/paint/zones.mjs): an RGBA canvas with
// alpha blending, and the shared pieces of the sanctuaries (flagstones, shingles, timber walls,
// tents, braziers, banners, crates, barrels, smoke). Light comes from the top left, like the sprites.
// Every piece takes the animation frame `f` (0..FRAMES-1) so loops (fire, cloth, smoke) close.

import { tileGrade, tileShade, toHsl, fromHsl } from "../../../js/avatar/tilestyle.js";

export const FRAMES = 6;
const TAU = Math.PI * 2;
export const ph = (f, k = 1) => (f / FRAMES) * TAU * k;   // phase of frame f in a loop

export const rgb = (h, a = 255) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a];
export const mix = (a, b, t) => [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t)).concat(a[3] ?? 255);
export const withA = (c, a) => [c[0], c[1], c[2], a];
/** Darker (k < 0, towards a cool shadow) or lighter (k > 0, towards a warm light) colour. */
export const shade = (c, k) => (k < 0 ? mix(c, [18, 14, 32, c[3] ?? 255], -k) : mix(c, [255, 246, 222, c[3] ?? 255], k));
export const ramp = (...hexes) => hexes.map((h) => rgb(h));
/** Colour from a dark → light ramp for v in 0..1; near a step it is ordered-dithered (amount 0..1). */
export const pick = (r, v, x = 0, y = 0, amount = 0.4) => r[Math.max(0, Math.min(r.length - 1, Math.floor(v * r.length + (dither(x, y) - 0.5) * amount)))];

export function hash(x, y, s = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** Smooth value noise (bilinear between hashed lattice points), 0..1. */
export function vnoise(x, y, s = 0) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const sm = (t) => t * t * (3 - 2 * t), u = sm(fx), v = sm(fy);
  const a = hash(x0, y0, s), b = hash(x0 + 1, y0, s), c = hash(x0, y0 + 1, s), d = hash(x0 + 1, y0 + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
export const dither = (x, y) => { x = Math.floor(x); y = Math.floor(y); return (BAYER4[((y % 4) + 4) % 4][((x % 4) + 4) % 4] + 0.5) / 16; };

export class Img {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  /** Replace a pixel. */
  put(x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d.set([c[0], c[1], c[2], c[3] ?? 255], (y * this.w + x) * 4);
  }
  /** Blend a pixel over what is there. */
  dot(x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const a = (c[3] ?? 255) / 255;
    if (a >= 1) return this.put(x, y, c);
    if (a <= 0) return;
    const j = (y * this.w + x) * 4, da = this.d[j + 3] / 255, oa = a + da * (1 - a);
    for (let k = 0; k < 3; k++) this.d[j + k] = Math.round((c[k] * a + this.d[j + k] * da * (1 - a)) / oa);
    this.d[j + 3] = Math.round(oa * 255);
  }
  get(x, y) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    const j = (y * this.w + x) * 4;
    return this.d[j + 3] ? [this.d[j], this.d[j + 1], this.d[j + 2], this.d[j + 3]] : null;
  }
  /** Colour c may be a function (x, y) → colour | null. */
  at(c, x, y) { return typeof c === "function" ? c(x, y) : c; }
  rect(x, y, w, h, c) {
    for (let j = Math.floor(y); j < Math.floor(y) + h; j++) for (let i = Math.floor(x); i < Math.floor(x) + w; i++) this.dot(i, j, this.at(c, i, j));
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
      if (nx * nx + ny * ny <= 1) this.dot(x, y, this.at(c, x, y));
    }
  }
  poly(pts, c) {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const xs = [];
      pts.forEach((a, i) => {
        const b = pts[(i + 1) % pts.length];
        if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) xs.push(a[0] + (y + 0.5 - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      });
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) this.dot(x, y, this.at(c, x, y));
    }
  }
  line(x0, y0, x1, y1, c, w = 1) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
      for (let k = 0; k < w; k++) this.put(x + (k % 2 ? 0 : 0), y + k, this.at(c, x, y));
    }
  }
  /** Draw another Img over this one at (dx, dy). */
  draw(src, dx = 0, dy = 0) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const j = (y * src.w + x) * 4;
      if (src.d[j + 3]) this.dot(dx + x, dy + y, [src.d[j], src.d[j + 1], src.d[j + 2], src.d[j + 3]]);
    }
  }
  /** Dark outline around every opaque (alpha ≥ 200) shape, outside it. */
  outline(c) {
    const add = [];
    const solid = (x, y) => { const p = this.get(x, y); return p && p[3] >= 200; };
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (solid(x, y)) continue;
      if (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1)) add.push([x, y]);
    }
    add.forEach(([x, y]) => this.put(x, y, c));
  }
  /** Bring every opaque colour into the tile sets' range (js/avatar/tilestyle.js tileGrade); colours in `keep` stay. */
  grade(keep = null) {
    const memo = new Map();
    for (let j = 0; j < this.d.length; j += 4) {
      if (!this.d[j + 3]) continue;
      const k = (this.d[j] << 16) | (this.d[j + 1] << 8) | this.d[j + 2];
      if (keep && keep.has(k)) continue;
      let c = memo.get(k);
      if (!c) memo.set(k, c = tileGrade([this.d[j], this.d[j + 1], this.d[j + 2]]));
      this.d[j] = c[0]; this.d[j + 1] = c[1]; this.d[j + 2] = c[2];
    }
  }
  /**
   * The tile sets' outline: every empty pixel next to the figure takes a deep, hue-shifted shade of the
   * colour it touches (deeper under the figure, like the tiles' cliff lips), never one flat ink.
   */
  tileOutline() {
    const add = [];
    const solid = (x, y) => { const p = this.get(x, y); return p && p[3] >= 200 ? p : null; };
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (solid(x, y)) continue;
      const up = solid(x, y - 1), n = up || solid(x - 1, y) || solid(x + 1, y) || solid(x, y + 1);
      if (n) add.push([x, y, tileInk(n, up && !solid(x, y + 1) ? -0.8 : -0.68)]);
    }
    add.forEach(([x, y, c]) => this.put(x, y, c));
  }
}

/** Outline colour for c (same rule as js/avatar/tilestyle.js inkHex): pale greys go cool instead of rust. */
export function tileInk(c, k) {
  const [, s, l] = toHsl(c);
  return tileShade(s < 0.3 && l > 0.55 ? fromHsl([228, 0.18, l]) : [c[0], c[1], c[2]], k);
}

// ---------- surfaces ----------

/** Flagstone paving in (x, y, w, h). pal = { mortar, stone: [dark → light ramp] }; opts.moss colour. */
export function flagstones(img, x0, y0, w, h, pal, seed, opts = {}) {
  const rowH = opts.rowH || 9;
  for (let r = 0, y = y0; y < y0 + h; r++, y += rowH) {
    let x = x0 - Math.floor(hash(r, 7, seed) * 10);
    for (let k = 0; x < x0 + w; k++) {
      const sw = (opts.minW || 10) + Math.floor(hash(k, r, seed + 1) * (opts.varW || 7));
      const tone = 0.32 + hash(k, r, seed + 2) * 0.36;
      const cracked = hash(k, r, seed + 3) < 0.12;
      for (let j = 0; j < rowH; j++) for (let i = 0; i < sw; i++) {
        const px = x + i, py = y + j;
        if (px < x0 || px >= x0 + w || py >= y0 + h) continue;
        if (opts.mask && !opts.mask(px, py)) continue;
        let c;
        if (i === sw - 1 || j === rowH - 1) c = pal.mortar;
        else {
          let v = tone + (hash(px, py, seed + 4) - 0.5) * 0.18;
          if (j === 0 || i === 0) v += 0.22;                 // lit top-left bevel
          if (j === rowH - 2 || i === sw - 2) v -= 0.18;      // shaded bottom-right bevel
          if (cracked && Math.abs(i - sw / 2 - (j - rowH / 2) * 0.8) < 0.6 && j > 1 && j < rowH - 2) v = 0.02;
          c = pick(pal.stone, v, px, py);
          if (opts.moss && (j === rowH - 2 || i === sw - 2) && hash(px, py, seed + 5) < 0.25) c = opts.moss;
        }
        img.put(px, py, c);
      }
      x += sw;
    }
  }
}

/** Packed-earth clearing in an ellipse whose rim fades into the map (dithered). */
export function clearing(img, cx, cy, rx, ry, pal, seed) {
  for (let y = Math.floor(cy - ry - 3); y <= cy + ry + 3; y++) for (let x = Math.floor(cx - rx - 3); x <= cx + rx + 3; x++) {
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
    const d = Math.sqrt(nx * nx + ny * ny) + (vnoise(x / 5, y / 5, seed) - 0.5) * 0.14;
    if (d > 1.02) continue;
    if (d > 0.96 && dither(x, y) < (d - 0.96) / 0.06) continue;    // ragged rim, a thin dithered edge
    const n = hash(x, y, seed + 1), blot = vnoise(x / 7, y / 5, seed + 2) * 0.6 + vnoise(x / 17, y / 11, seed + 3) * 0.4;
    let v = 0.42 + (blot - 0.5) * 0.55 + (n < 0.05 ? -0.15 : n > 0.96 ? 0.15 : 0) - Math.max(0, d - 0.8) * 0.9;
    img.put(x, y, pick(pal, v, x, y, 0.25));
    if (n < 0.012 && d < 0.85) { img.put(x, y, pal[pal.length - 1]); img.put(x + 1, y + 1, pal[0]); }   // pebble
  }
}

/** Slate or tile roof face: shingle rows from the ridge (y0) to the eave (y1), trapezoid inset per row. */
export function shingles(img, x0, x1, y0, y1, rmp, seed, opts = {}) {
  const rowH = opts.rowH || 4, inset = opts.inset || 0, sw = opts.sw || 6;
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0), r = Math.floor((y - y0) / rowH), j = (y - y0) % rowH;
    const a = Math.round(x0 + inset * (1 - t)), b = Math.round(x1 - inset * (1 - t));
    for (let x = a; x < b; x++) {
      const k = Math.floor((x - a + (r % 2) * (sw / 2)) / sw), i = (x - a + (r % 2) * (sw / 2)) % sw;
      let v = 0.5 + (hash(k, r, seed) - 0.5) * 0.3 - j * 0.09 + 0.12 - (x - a) / Math.max(1, b - a) * 0.25;
      if (j === rowH - 1) v -= 0.3;                        // shadow under each row
      if (i === 0) v -= 0.18;
      img.put(x, y, pick(rmp, v, x, y));
    }
  }
}

/** Timber-framed plaster wall with posts, a mid beam and corner braces. */
export function timberWall(img, x, y, w, h, plaster, wood, seed) {
  img.rect(x, y, w, h, (px, py) => pick(plaster, 0.55 + (hash(px, py, seed) - 0.5) * 0.25 - (px - x) / w * 0.2, px, py));
  const beam = (bx, by, bw, bh) => img.rect(bx, by, bw, bh, (px, py) => pick(wood, 0.45 + (hash(px, py, seed + 1) - 0.5) * 0.3 + (py === by ? 0.2 : 0), px, py));
  beam(x, y, w, 2);
  beam(x, y + Math.floor(h / 2), w, 2);
  beam(x, y + h - 2, w, 2);
  for (let px = x; px < x + w; px += 18) beam(px, y, 2, h);
  beam(x + w - 2, y, 2, h);
}

/** Window with a warm light (flicker 0..1) and a frame. */
export function windowLit(img, x, y, w, h, frame, flicker = 0) {
  img.rect(x - 1, y - 1, w + 2, h + 2, frame);
  img.rect(x, y, w, h, (px, py) => mix(rgb("#ffb347"), rgb("#fff1b8"), Math.max(0, Math.min(1, 0.35 + flicker * 0.3 - (py - y) / h * 0.4 + (px === x ? 0.2 : 0)))));
  img.rect(x + Math.floor(w / 2), y, 1, h, frame);
  img.rect(x, y + Math.floor(h / 2), w, 1, frame);
}

// ---------- props ----------

/** Drop shadow (semi-transparent) under a prop, offset to the lower right. */
export function shadow(img, cx, cy, rx, ry, a = 80) {
  img.ellipse(cx + 2, cy + 1, rx, ry, (x, y) => [12, 8, 20, dither(x, y) < 0.85 ? a : 0]);
}

/** Flames over a fire bed at (cx, by): w wide, h tall; sparks rise with the frame. */
export function flames(img, cx, by, w, h, f, seed = 0) {
  const core = rgb("#fff4c2"), yel = rgb("#ffd166"), org = rgb("#ff7a1a"), red = rgb("#c2410c");
  const half = w / 2;
  for (let dx = -Math.floor(half); dx <= Math.floor(half); dx++) {
    const u = dx / (half + 0.5);
    const hc = h * (1 - u * u) * (0.72 + 0.28 * Math.sin(ph(f) + dx * 1.7 + seed)) + (hash(dx, f, seed) - 0.5) * 2;
    for (let y = 0; y < hc; y++) {
      const t = y / Math.max(1, hc), edge = Math.abs(u);
      const c = t > 0.82 ? red : t > 0.55 || edge > 0.7 ? org : t < 0.45 && edge < 0.4 ? core : yel;
      img.put(cx + dx, by - y, c);
    }
  }
  for (let k = 0; k < 2; k++) {
    const p = ((f / FRAMES) + k * 0.5 + hash(k, 1, seed) * 0.3) % 1;
    img.put(cx + Math.round(Math.sin(p * 9 + seed + k) * half), by - h - 1 - Math.round(p * 7), p < 0.5 ? yel : org);
  }
}

/** Soft light on the ground (stepped rings), e.g. around a brazier. */
export function glow(img, cx, cy, r, c, strength = 60, squash = 0.55) {
  for (let y = Math.floor(cy - r * squash); y <= cy + r * squash; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    const d = Math.hypot((x + 0.5 - cx) / r, (y + 0.5 - cy) / (r * squash));
    if (d > 1) continue;
    const a = Math.round(strength * (d < 0.4 ? 1 : d < 0.7 ? 0.6 : 0.3));
    img.dot(x, y, withA(c, a));
  }
}

/** Smoke puffs rising from (x, y) through the loop. */
export function smoke(img, x, y, f, rise = 22, seed = 0, col = "#9ca3af") {
  const c = rgb(col);
  for (let k = 0; k < 3; k++) {
    const p = ((f / FRAMES) + k / 3) % 1;
    const sx = x + Math.sin(p * 5 + seed + k) * 2 + p * 4, sy = y - p * rise, r = 1.5 + p * 3.5;
    img.ellipse(sx, sy, r, r * 0.85, (px, py) => withA(shade(c, (py < sy ? 0.25 : -0.1)), Math.round(110 * (1 - p))));
  }
}

/** Iron brazier on three legs with a fire: base at (cx, by). */
export function brazier(layers, cx, by, f, seed = 0, metal = "#3a3346") {
  const m = rgb(metal);
  shadow(layers.ground, cx, by, 5, 2);
  const b = layers.props;
  b.line(cx - 3, by - 4, cx - 4, by, shade(m, -0.3));
  b.line(cx + 3, by - 4, cx + 4, by, shade(m, -0.4));
  b.line(cx, by - 4, cx, by, shade(m, -0.2));
  b.ellipse(cx, by - 6, 5, 2.5, (x, y) => (y < by - 6 ? shade(m, 0.35) : x < cx ? shade(m, 0.1) : shade(m, -0.2)));
  b.rect(cx - 4, by - 7, 9, 1, rgb("#ffb347"));            // embers in the bowl
  flames(layers.fire, cx, by - 8, 7, 8, f, seed);
  glow(layers.fire, cx, by - 2, 16, rgb("#ff9a3c"), 34 + Math.round(8 * Math.sin(ph(f) + seed)));
}

/** Banner on a pole: Fated Vanguard red with a gold sword, waving to the right. Pole foot at (x, by). */
export function flagPole(layers, x, by, f, opts = {}) {
  const height = opts.height || 32, cloth = opts.cloth || ramp("#5a1620", "#8a2232", "#b8323f", "#d9544f"), gold = rgb(opts.gold || "#ffd166");
  const fw = opts.fw || 14, fh = opts.fh || 10, b = layers.props;
  shadow(layers.ground, x, by, 3, 1.5);
  b.rect(x, by - height, 2, height, (px, py) => (px === x ? rgb("#8a5a2b") : rgb("#5e3b1a")));
  b.rect(x - 1, by - height - 2, 4, 2, gold);
  for (let i = 0; i < fw; i++) {
    const wv = Math.sin(ph(f) - i * 0.55) * (i / fw) * 2;
    const top = by - height + 1 + Math.round(wv), len = fh - (opts.swallow && i > fw - 4 ? Math.abs(fh / 2 - 0) : 0);
    for (let j = 0; j < fh; j++) {
      if (opts.swallow && i >= fw - 3 && Math.abs(j - fh / 2 + 0.5) < (i - (fw - 3)) * 1.2) continue;
      const slope = Math.cos(ph(f) - i * 0.55);
      let c = pick(cloth, 0.55 + slope * 0.28 - j / fh * 0.15, x + i, top + j);
      const ex = i - Math.round(fw / 2) + 1, ey = j - Math.round(fh / 2);
      if (opts.emblem !== false && ((ex === 0 && ey >= -3 && ey <= 3) || (ey === -1 && Math.abs(ex) <= 2) || (ey === 3 && Math.abs(ex) <= 1 && false))) c = gold;
      b.put(x + 2 + i, top + j, c);
    }
    void len;
  }
}

/** Banner hanging from a wall (x, y top), w × h, rippling. Emblem: "crown" | "sword" | "hammer". */
export function hangingBanner(img, x, y, w, h, f, cloth, gold, emblem = "sword") {
  for (let j = 0; j < h; j++) {
    const off = Math.round(Math.sin(ph(f) + j * 0.35) * (j / h) * 1.2);
    for (let i = 0; i < w; i++) {
      if (j >= h - 3 && Math.abs(i - (w - 1) / 2) < (h - 1 - j) * 1.5 - 0.5 + 1 && j > h - 3) continue;   // notched tail
      if (j === h - 1 && Math.abs(i - (w - 1) / 2) < 1.6) continue;
      let c = pick(cloth, 0.6 - i / w * 0.35 + Math.sin(ph(f) + j * 0.35) * 0.1, x + i, y + j);
      if (i === 0 || i === w - 1) c = gold;
      img.put(x + i + off, y + j, c);
    }
  }
  img.rect(x - 1, y - 1, w + 2, 2, rgb("#5e3b1a"));
  const mx = x + Math.floor(w / 2), my = y + Math.floor(h * 0.42);
  const E = {
    crown: [[-2, 0], [-2, -1], [-2, -2], [0, -1], [0, -2], [0, -3], [2, 0], [2, -1], [2, -2], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [-2, 1], [2, 1]],
    sword: [[0, -4], [0, -3], [0, -2], [0, -1], [0, 0], [0, 1], [-2, 1], [-1, 1], [1, 1], [2, 1], [0, 2], [0, 3]],
    hammer: [[-2, -3], [-1, -3], [0, -3], [1, -3], [2, -3], [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2], [0, -1], [0, 0], [0, 1], [0, 2]]
  }[emblem] || [];
  E.forEach(([dx, dy]) => img.put(mx + dx + Math.round(Math.sin(ph(f) + (my + dy - y) * 0.35) * ((my + dy - y) / h) * 1.2), my + dy, gold));
}

export function crate(img, x, y, s, wood) {
  img.rect(x, y, s, s, (px, py) => pick(wood, 0.55 - (px - x) / s * 0.25 + (hash(px, py, 3) - 0.5) * 0.15, px, py));
  img.rect(x, y, s, 1, shade(wood[wood.length - 1], 0.2));
  img.rect(x, y + s - 1, s, 1, wood[0]);
  img.rect(x, y, 1, s, wood[0]); img.rect(x + s - 1, y, 1, s, wood[0]);
  for (let k = 1; k < s - 1; k++) img.put(x + k, y + k, wood[0]);
}

export function barrel(img, x, y, w, h, wood) {
  for (let i = 0; i < w; i++) {
    const u = (i + 0.5) / w - 0.5, bulge = Math.round((1 - 4 * u * u) * 1);
    for (let j = -bulge; j < h + bulge; j++) {
      let v = 0.7 - Math.abs(u + 0.15) * 1.4 + (i % 3 === 0 ? -0.1 : 0);
      let c = pick(wood, v, x + i, y + j);
      if (j === 1 || j === h - 2 || j === Math.floor(h / 2)) c = rgb("#3f3a44");
      img.put(x + i, y + j, c);
    }
  }
  img.ellipse(x + w / 2, y, w / 2, 1.5, (px) => (px < x + w / 2 ? wood[wood.length - 1] : wood[1]));
}

export function sack(img, x, y, c) {
  img.ellipse(x + 3, y + 4, 3.5, 4, (px, py) => pick(c, 0.75 - (px - x) / 8 - (py - y) / 14, px, py));
  img.rect(x + 2, y - 1, 3, 2, c[0]);
}

/** Weapon rack: a wooden frame holding spears and a sword; base line y. */
export function weaponRack(layers, x, by, wood) {
  const b = layers.props;
  shadow(layers.ground, x + 8, by, 9, 2, 60);
  b.rect(x, by - 12, 2, 12, wood[1]); b.rect(x + 15, by - 12, 2, 12, wood[1]);
  b.rect(x, by - 11, 17, 2, wood[2]); b.rect(x, by - 4, 17, 2, wood[2]);
  const steel = rgb("#cbd5e1");
  [3, 7, 11].forEach((sx, k) => {
    b.rect(x + sx, by - 17 + k, 1, 16 - k, wood[3]);
    b.put(x + sx, by - 18 + k, steel); b.put(x + sx, by - 19 + k, rgb("#f1f5f9"));
  });
  b.rect(x + 14, by - 15, 1, 9, steel); b.rect(x + 13, by - 7, 3, 1, rgb("#ffd166"));
}

/** Straw training dummy on a post; feet at (cx, by). */
export function dummy(layers, cx, by) {
  const b = layers.props, straw = ramp("#7c5a1d", "#a87d2e", "#d4a645", "#ecc76a");
  shadow(layers.ground, cx, by, 4, 1.5, 60);
  b.rect(cx, by - 18, 2, 18, rgb("#5e3b1a"));
  b.rect(cx - 5, by - 14, 12, 2, rgb("#7a5230"));
  b.ellipse(cx + 1, by - 11, 4, 5, (px, py) => pick(straw, 0.8 - (px - cx + 3) / 9 + (hash(px, py, 9) - 0.5) * 0.2, px, py));
  b.ellipse(cx + 1, by - 19, 3, 3, (px, py) => pick(ramp("#8b7355", "#b49a74", "#d6c09a"), 0.8 - (px - cx + 2) / 6, px, py));
  b.rect(cx - 2, by - 11, 6, 1, rgb("#7f1d1d"));
}

/** Bedroll on the ground. */
export function bedroll(img, x, y, cloth) {
  img.rect(x, y, 14, 5, (px, py) => pick(cloth, 0.6 - (py - y) / 8, px, py));
  img.rect(x, y + 1, 4, 3, (px, py) => pick(ramp("#a8a29e", "#d6d3d1"), 0.6, px, py));
  img.rect(x + 13, y, 2, 5, cloth[0]);
}

/** Campfire: a ring of stones, crossed logs, flames and smoke; centre (cx, cy). */
export function campfire(layers, cx, cy, f, stone, seed = 0) {
  const g = layers.ground;
  glow(layers.fire, cx, cy, 22, rgb("#ff9a3c"), 30 + Math.round(6 * Math.sin(ph(f))));
  g.ellipse(cx, cy, 6, 3, rgb("#1c1210"));
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * TAU, sx = cx + Math.cos(a) * 6.5, sy = cy + Math.sin(a) * 3.4;
    layers.props.ellipse(sx, sy, 1.6, 1.3, (px, py) => pick(stone, py < sy ? 0.85 : 0.35, px, py));
  }
  layers.props.line(cx - 4, cy + 1, cx + 3, cy - 1, rgb("#5e3b1a"));
  layers.props.line(cx - 3, cy - 1, cx + 4, cy + 1, rgb("#7a5230"));
  flames(layers.fire, cx, cy, 7, 9, f, seed);
  smoke(layers.fire, cx + 1, cy - 12, f, 18, seed, "#a8a29e");
}

/**
 * Pavilion tent (command tent): cloth walls with a scalloped valance and a pointed roof, open door,
 * guy ropes and a pennant. (x = left edge, by = ground line, w, h = total height.)
 */
export function pavilion(layers, x, by, w, h, f, cloth, trim, opts = {}) {
  const b = layers.props, wallH = Math.round(h * 0.42), cx = x + w / 2, roofTop = by - h;
  shadow(layers.ground, cx + 3, by - 1, w / 2 + 3, 4, 90);
  // guy ropes and pegs
  [[x - 4, by + 1, x + 2, by - wallH + 2], [x + w + 3, by + 1, x + w - 2, by - wallH + 2]].forEach(([px, py, qx, qy]) => {
    layers.ground.line(px, py, qx, qy, rgb("#c8b18a")); layers.ground.put(px, py + 1, rgb("#5e3b1a"));
  });
  // walls: vertical folds, lit left, dark right
  b.rect(x, by - wallH, w, wallH, (px, py) => {
    const u = (px - x) / w, fold = Math.sin((px - x) * 0.9) * 0.08;
    return pick(cloth, 0.78 - u * 0.5 + fold - (py > by - 3 ? 0.15 : 0), px, py);
  });
  // door: dark opening with tied-back flaps
  const dw = Math.max(6, Math.round(w * 0.24)), dx = Math.round(cx - dw / 2);
  b.poly([[dx, by], [dx + dw, by], [cx + 0.5, by - wallH - 2]], (px, py) => pick(ramp("#140c10", "#24161c", "#3a2329"), (py - by + wallH) / wallH * 0.5, px, py));
  b.line(dx - 1, by - 1, cx - 1, by - wallH + 1, trim[1]); b.line(dx + dw, by - 1, cx + 1, by - wallH + 1, trim[0]);
  // roof: two faces, lit left; seams to the peak
  const eaveY = by - wallH, ov = 3;
  b.poly([[x - ov, eaveY + 1], [cx + 0.5, roofTop], [cx + 0.5, eaveY + 1]], (px, py) => pick(cloth, 0.95 - (py - roofTop) / (eaveY - roofTop) * 0.25 - (cx - px) * 0.004, px, py));
  b.poly([[cx + 0.5, roofTop], [x + w + ov, eaveY + 1], [cx + 0.5, eaveY + 1]], (px, py) => pick(cloth, 0.38 - (py - roofTop) / (eaveY - roofTop) * 0.12, px, py));
  for (let s = 1; s < 4; s++) {
    b.line(cx, roofTop + 1, x - ov + (w + ov * 2) * s / 4, eaveY, shade(cloth[1], -0.1));
  }
  // valance: scalloped trim along the eave
  for (let px = x - ov; px < x + w + ov; px++) {
    const sc = (px - x + ov) % 5;
    const drop = sc === 0 || sc === 4 ? 2 : 3;
    for (let j = 0; j < drop; j++) b.put(px, eaveY + 1 + j, pick(trim, j === 0 ? 0.9 : 0.5 - (px - x) / w * 0.3, px, j));
  }
  if (opts.stripes) for (let px = x + 2; px < x + w - 2; px += 6) b.rect(px, eaveY + 4, 2, wallH - 5, (qx, qy) => (dx <= qx && qx < dx + dw && qy > by - wallH + (qx - dx) * 0) ? null : pick(trim, 0.55 - (qx - x) / w * 0.4, qx, qy));
  // finial and pennant
  b.rect(Math.round(cx), roofTop - 6, 1, 6, rgb("#5e3b1a"));
  b.put(Math.round(cx), roofTop - 7, rgb("#ffd166"));
  for (let i = 0; i < 6; i++) {
    const wv = Math.round(Math.sin(ph(f) - i * 0.7) * (i / 6) * 1.5);
    const hh = 3 - Math.floor(i / 2.5);
    for (let j = 0; j < hh; j++) b.put(Math.round(cx) + 1 + i, roofTop - 6 + j + wv, opts.pennant ? opts.pennant : trim[2]);
  }
  if (opts.snow) {                                       // snow on the roof
    b.poly([[cx + 0.5, roofTop + 1], [x - 1, eaveY - 1], [x + w * 0.25, eaveY - 3], [cx + 3, roofTop + 6]], (px, py) => (hash(px, py, 4) < 0.85 ? pick(ramp("#c4d4e3", "#e2ecf5", "#ffffff"), 0.8 - (px - x) / w, px, py) : null));
  }
}

/** Ridge tent seen from its front end, with depth to the right: (x, by) front-left foot, w, h. */
export function ridgeTent(layers, x, by, w, h, f, cloth, opts = {}) {
  const b = layers.props, depth = Math.round(w * 0.45), lift = Math.round(depth * 0.5), apex = [x + w / 2, by - h];
  shadow(layers.ground, x + w / 2 + depth / 2, by - 1, w / 2 + depth / 2, 3, 85);
  // side panel going back (darker)
  b.poly([[apex[0], apex[1]], [apex[0] + depth, apex[1] - lift], [x + w + depth, by - lift], [x + w, by]], (px, py) => pick(cloth, 0.3 + ((px - x) % 4 === 0 ? -0.08 : 0) - (py - apex[1]) / h * 0.1, px, py));
  // front gable (lit)
  b.poly([[x, by], apex, [x + w, by]], (px, py) => pick(cloth, 0.85 - (px - x) / w * 0.25 - (py - apex[1]) / h * 0.15, px, py));
  // doorway with an open flap
  const dh = Math.round(h * 0.65);
  b.poly([[apex[0] - dh * 0.32, by], [apex[0], by - dh], [apex[0] + dh * 0.32, by]], (px, py) => pick(ramp("#140c10", "#2a1a1e"), (py - by + dh) / dh * 0.6, px, py));
  b.poly([[apex[0], by - dh], [apex[0] - dh * 0.32, by], [apex[0] - dh * 0.55, by]], (px, py) => pick(cloth, 0.95, px, py));
  b.line(apex[0], apex[1], apex[0] + depth, apex[1] - lift, shade(cloth[cloth.length - 1], 0.25));
  b.rect(Math.round(apex[0]), apex[1] - 3, 1, 3, rgb("#5e3b1a"));
  if (opts.snow) b.poly([[apex[0], apex[1]], [apex[0] + depth, apex[1] - lift], [apex[0] + depth + 2, apex[1] - lift + 3], [apex[0] + 1, apex[1] + 3]], rgb("#e2ecf5"));
  layers.ground.line(x - 3, by + 1, x + 2, by - h * 0.45, rgb("#c8b18a"));
}
