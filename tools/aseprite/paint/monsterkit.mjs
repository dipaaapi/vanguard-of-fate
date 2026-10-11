// Monster painting kit: the shared pieces of the family painters (tools/aseprite/paint/monsters/*.mjs)
// that redraw every monster in the terrain tile sets' style (js/avatar/tilestyle.js): tile colour ramps,
// a common pose table, canvas sizes that keep the code sprite's feet, and finish() which adds the tiles'
// grain and hue-shifted outline. Each family painter turns one code sprite (its colours and options from
// js/bestiary.js) into the frames of aseprite/monster/<key>.aseprite.
import { Canvas } from "./kit.mjs";
import { tileGrade, tileShade, hexRgb, rgbHex, tileStyle, toHsl, fromHsl } from "../../../js/avatar/tilestyle.js";

export { Canvas };
export const TAU = Math.PI * 2;
export const FRAMES = { idle: 4, walk: 6, run: 6, attack: 4, skill: 6 };
export const DURATIONS = { idle: 0.2, walk: 0.1, run: 0.07, attack: 0.09, skill: 0.08 };

const A = (c) => [c[0], c[1], c[2], 255];
/** A colour (hex) as the kit's rgba. */
export const rgb = (h) => A(hexRgb(h));
/** Tile shade of a hex colour as rgba. */
export const sh = (h, k) => A(tileShade(hexRgb(h), k));
/** Graded base colour (vivid like the tiles) as hex. */
export const grade = (h) => rgbHex(tileGrade(hexRgb(h)));
/** Five-step ramp dark → light around a base colour, the way the tile painter builds its ramps. */
export function ramp(h, { graded = true, lift = 0 } = {}) {
  const b = graded ? grade(h) : h;
  return [-0.56, -0.3, 0 + lift, 0.2 + lift, 0.4 + lift].map((k, j) => (j === 2 && !lift ? rgb(b) : sh(b, k)));
}
/** Mix two hex colours. */
export const mixHex = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * t)); };
/** Lightness of a hex colour (0..1). */
export const lightness = (h) => toHsl(hexRgb(h))[2];
/** The same colour with another lightness. */
export const withL = (h, l) => { const [hh, s] = toHsl(hexRgb(h)); return rgbHex(fromHsl([hh, s, l])); };

/**
 * Canvas size and anchor for a painted sheet that replaces a code sprite (w×h, feet at ax, ay):
 * W×H is at least the code size (W − w even), the feet stay put (CreatureSprite.draw), so in the
 * painted canvas they sit at (ax + (W − w) / 2, ay + (H − h)).
 */
export function frame(sprite, W, H) {
  const fx = sprite.ax + (W - sprite.w) / 2, fy = sprite.ay + (H - sprite.h);
  return { W, H, fx, fy };
}

/** Pose values shared by the families: bob, gait phase, attack stage, skill charge. */
export function motion(anim, i, n = FRAMES[anim] || 1) {
  const ph = (i / n) * TAU;
  const m = { anim, i, n, ph, bob: 0, swing: 0, lift: 0, atk: 0, charge: 0, strike: false, lunge: 0, flap: Math.sin(ph) };
  if (anim === "idle") { m.bob = [0, 0, 1, 1][i % 4]; m.flap = Math.sin(ph); }
  else if (anim === "walk") { m.bob = Math.round(Math.abs(Math.sin(ph)) * 1); m.swing = Math.sin(ph); m.lift = Math.max(0, Math.cos(ph)); }
  else if (anim === "run") { m.bob = [1, 0, -1, -1, 0, 1][i % 6]; m.swing = Math.sin(ph) * 1.5; m.lift = Math.max(0, Math.cos(ph)) * 1.5; m.lunge = 1; }
  else if (anim === "attack") { m.atk = [1, 2, 2, 3][i % 4]; m.lunge = [-1, 2, 3, 1][i % 4]; m.bob = [1, 0, 0, 0][i % 4]; m.strike = i === 1 || i === 2; }
  else if (anim === "skill") { m.charge = [1, 2, 3, 4, 0, 0][i % 6]; m.atk = [1, 1, 1, 1, 2, 3][i % 6]; m.lunge = [-1, -1, -2, -2, 3, 1][i % 6]; m.strike = i === 4; m.bob = [1, 1, 2, 2, 0, 0][i % 6]; }
  return m;
}

/** Glow particles and a ground ring while a skill charges, a burst on the strike (not outlined). */
export function skillFx(f, m, cx, cy, gy, col, hit = null) {
  const c = rgb(col), w = rgb("#ffffff");
  if (m.charge) {
    const n = 2 + m.charge * 2;
    for (let j = 0; j < n; j++) {
      const a = (j / n) * TAU + m.i * 0.7, r = 12 - m.charge;
      const x = cx + Math.cos(a) * r, y = cy - ((j * 5 + m.i * 3) % 14);
      if (!f.get(x, y)) f.spark(x, y, j % 2 ? c : w);
    }
    for (let a = 0; a < TAU; a += TAU / 18) { const x = cx + Math.cos(a) * (11 - m.charge), y = gy + Math.sin(a) * 1.5; if (!f.get(x, y)) f.spark(x, y, c); }
  }
  if (m.strike && hit) {
    const [hx, hy] = hit;
    for (let a = 0; a < TAU; a += TAU / 10) f.spark(hx + Math.cos(a) * 3.5, hy + Math.sin(a) * 3, a % 2 < 1 ? w : c);
    f.spark(hx, hy, w, true);
  }
}

/** Dust puffs behind running feet. */
export function dust(f, x, y, i) {
  if (i % 3) return;
  f.spark(x, y, rgb("#d6d3d1")); f.spark(x - 2, y - 1, rgb("#a8a29e")); f.spark(x + 1, y - 2, rgb("#e7e5e4"));
}

/**
 * Finish a painted frame in the tile style: tile grain on large areas and the hue-shifted outline
 * (js/avatar/tilestyle.js), leaving glow particles (Canvas.fx) unoutlined on top.
 */
export function finish(f, { grain = true } = {}) {
  const d = f.px.map((c, j) => (c && !f.fx.has(j) ? rgbHex(c) : null));
  const pix = { w: f.w, h: f.h, d };
  tileStyle(pix, { grade: false, light: false, grain });
  const out = new Canvas(f.w, f.h);
  pix.d.forEach((c, j) => { if (c) out.px[j] = rgb(c); });
  f.px.forEach((c, j) => { if (c && f.fx.has(j)) { out.px[j] = c; out.fx.add(j); } });
  return out;
}

/** Lit ellipse filled from a ramp (dark → light), light from the upper left, tile-style hard steps. */
export function body(f, cx, cy, rx, ry, R, o = {}) { f.blob(cx, cy, rx, ry, R, o); }

/** Tapered limb / tail: a chain of blobs from (x0,y0, r0) to (x1,y1, r1). */
export function taper(f, x0, y0, r0, x1, y1, r1, R, steps = null, o = {}) {
  const n = steps || Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 1.2));
  for (let k = 0; k <= n; k++) {
    const t = k / n, r = r0 + (r1 - r0) * t;
    f.blob(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, Math.max(0.6, r), Math.max(0.6, r * (o.squash || 1)), R, o);
  }
}

/** Quadratic curve as a tapered tube (tails, necks, tentacles). */
export function curve(f, p0, p1, p2, r0, r1, R, o = {}) {
  const n = Math.max(4, Math.ceil((Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + Math.hypot(p2[0] - p1[0], p2[1] - p1[1])) / 1.1));
  for (let k = 0; k <= n; k++) {
    const t = k / n, u = 1 - t;
    const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
    const r = r0 + (r1 - r0) * t;
    f.blob(x, y, Math.max(0.6, r), Math.max(0.6, r * (o.squash || 1)), R, o);
  }
}

/**
 * Paint a part (an arm, a head) on its own canvas, then lay it over `f` with a dark contour where it
 * crosses what is already there, so overlapping limbs read apart like the tiles' outlined rocks.
 */
export function overlay(f, part, k = -0.5) {
  const ring = [];
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const j = y * f.w + x;
    if (!part.px[j]) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy, q = Y * f.w + X;
      if (X < 0 || Y < 0 || X >= f.w || Y >= f.h || part.px[q] || !f.px[q] || f.fx.has(q)) continue;
      ring.push([X, Y]);
    }
  }
  ring.forEach(([x, y]) => { const c = f.get(x, y); f.set(x, y, A(tileShade(c, k))); });
  f.blit(part, 0, 0);
}
