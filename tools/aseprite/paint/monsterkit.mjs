// Monster painting kit: the shared pieces of the family painters (tools/aseprite/paint/monsters/*.mjs)
// that redraw every monster in the terrain tile sets' style (js/avatar/tilestyle.js): tile colour ramps,
// a common pose table, canvas sizes that keep the code sprite's feet, and finish() which adds the tiles'
// grain and hue-shifted outline. Each family painter turns one code sprite (its colours and options from
// js/bestiary.js) into the frames of aseprite/monster/<key>.aseprite.
import { Canvas } from "./kit.mjs";
import { tileGrade, tileShade, hexRgb, rgbHex, tileStyle, toHsl, fromHsl } from "../../../js/avatar/tilestyle.js";

export { Canvas };
export const TAU = Math.PI * 2;
export const FRAMES = { idle: 8, walk: 6, run: 6, attack: 4, skill: 6 };   // idle: two breaths, a blink on the last frame
export const DURATIONS = { idle: 0.2, walk: 0.1, run: 0.07, attack: 0.09, skill: 0.08 };
/** Every view a sheet carries (js/avatar/facing.js): front, front three-quarter, side, back three-quarter, back. */
export const VIEWS = ["down", "dside", "side", "uside", "up"];

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
  f = applyLook(f);
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

// ==================== LOOK: three-quarter views and expressions ====================
// The family painters draw three views (down, side, up) and register their eye colours with eyeCol().
// The driver (tools/aseprite/paint/monsters.mjs) sets `look` before each frame; finish() then turns the
// raw frame into a three-quarter view and gives it a face, so every family gets eight directions and
// expressions from the same code:
//   view "dside" / "uside" + body "upright": the front / back view with the head turned two pixels toward
//     the right and the receding half of the body one column narrower
//   view "dside" / "uside" + body "low": the side view foreshortened and tilted along the diagonal (rear
//     up and away for dside, head up and away for uside), feet kept on the ground line
//   expr "blink": eyes shut (lid colour from above the eye, a dark lash line under it)
//   expr "angry": brows knitted down over the eyes toward the face's middle
export const look = { view: null, body: "upright", expr: null, eyes: new Set() };
const keyOf = (c) => (c[0] << 16) | (c[1] << 8) | c[2];
/** Mark a colour (kit rgba) as an eye colour for this frame's expression; returns it. */
export function eyeCol(c) { look.eyes.add(keyOf(c)); return c; }
const dark = (c, k) => A(tileShade(c, k));

function bounds(f) {
  let x0 = f.w, x1 = -1, y0 = f.h, y1 = -1;
  f.px.forEach((c, j) => { if (!c || f.fx.has(j)) return; const x = j % f.w, y = (j / f.w) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
  return x1 < 0 ? null : { x0, x1, y0, y1 };
}

function applyLook(f) {
  if (look.expr && look.eyes.size) face(f, look.expr);
  if (look.view === "dside" || look.view === "uside") f = look.body === "low" ? tilt(f, look.view) : turnUpright(f, look.view === "uside");
  return f;
}

function face(f, expr) {
  const isEye = (x, y) => { const c = f.get(x, y), j = y * f.w + x; return c && !f.fx.has(j) && look.eyes.has(keyOf(c)); };
  const seen = new Set(), clusters = [];
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    if (seen.has(y * f.w + x) || !isEye(x, y)) continue;
    const cl = [], st = [[x, y]]; seen.add(y * f.w + x);
    while (st.length) {
      const [a, b] = st.pop(); cl.push([a, b]);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = a + dx, Y = b + dy, q = Y * f.w + X;
        if (X < 0 || Y < 0 || X >= f.w || Y >= f.h || seen.has(q) || !isEye(X, Y)) continue;
        seen.add(q); st.push([X, Y]);
      }
    }
    if (cl.length <= 12) clusters.push(cl);    // a big glowing patch is a gem or a core, not an eye
  }
  if (!clusters.length) return;
  const all = clusters.flat(), mid = all.reduce((s, [x]) => s + x, 0) / all.length;
  for (const cl of clusters) {
    const ys = cl.map(([, y]) => y), top = Math.min(...ys), bottom = Math.max(...ys);
    if (expr === "blink") {
      for (const [x, y] of cl) {
        let lid = null;
        for (let yy = top - 1; yy >= 0 && !lid; yy--) { const c = f.get(x, yy); if (c && !isEye(x, yy)) lid = c; }
        lid = lid || f.get(x - 1, y) || f.get(x + 1, y);
        if (lid) f.set(x, y, y === bottom ? dark(lid, -0.6) : lid);
      }
    } else if (expr === "angry") {
      const tops = cl.filter(([, y]) => y === top).map(([x]) => x);
      const inner = clusters.length > 1 ? (tops.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a))) : Math.max(...tops);
      const out = clusters.length > 1 ? (inner < mid ? -1 : 1) : -1;
      const brow = (x, y) => { const c = f.get(x, y); if (c && !isEye(x, y)) f.set(x, y, dark(c, -0.65)); };
      brow(inner, top - 1); brow(inner - out, top - 2);
      if (!isEye(inner + out, top - 1)) brow(inner + out, top - 1);
    }
  }
}

// upright bodies: the front (or back) view wrapped round a cylinder and turned 35° to the right. Each
// pixel sits on the cylinder's near surface; turning moves the middle of the body toward the turn while
// the far edge folds away behind it, so the near arm stands clear and the far one tucks in. Rows are
// redrawn as spans (no holes), nearest surface last; the feet are put back on the anchor.
function turnUpright(f, back) {
  const b = bounds(f);
  if (!b) return f;
  const C = (b.x0 + b.x1) / 2, HW = Math.max(2, (b.x1 - b.x0) / 2 + 0.5);
  const th = 35 * Math.PI / 180, co = Math.cos(th), si = Math.sin(th) * (back ? -1 : 1), D = 0.75;
  const map = (x) => { const u = Math.max(-1, Math.min(1, (x + 0.5 - C) / HW)), z = Math.sqrt(1 - Math.min(u * u, 0.72)) * D; return { x: C + HW * (u * co + z * si) - 0.5, z: z * co - u * Math.sin(th) * (back ? 1 : -1) }; };
  const out = new Canvas(f.w, f.h), depth = new Float32Array(f.w * f.h).fill(-9);
  for (let y = 0; y < f.h; y++) {
    for (let x = 0; x < f.w; x++) {
      const j = y * f.w + x, c = f.px[j];
      if (!c) continue;
      const m0 = map(x), m1 = map(x + 1);
      for (let X = Math.round(Math.min(m0.x, m1.x)); X <= Math.max(Math.round(Math.min(m0.x, m1.x)), Math.round(Math.max(m0.x, m1.x)) - 1); X++) {
        if (X < 0 || X >= f.w) continue;
        const q = y * f.w + X;
        if (m0.z < depth[q]) continue;
        depth[q] = m0.z; out.px[q] = c;
        if (f.fx.has(j)) out.fx.add(q); else out.fx.delete(q);
      }
    }
  }
  // feet back on the anchor: match the bottom rows' middle
  const mid = (cv) => { let s = 0, n = 0; for (let y = b.y1 - 2; y <= b.y1; y++) for (let x = 0; x < cv.w; x++) if (cv.px[y * cv.w + x]) { s += x; n++; } return n ? s / n : 0; };
  const dx = Math.round(mid(f) - mid(out));
  if (!dx) return out;
  const moved = new Canvas(f.w, f.h);
  out.px.forEach((c, j) => { const x = (j % f.w) + dx, y = (j / f.w) | 0; if (c && x >= 0 && x < f.w) { moved.px[y * f.w + x] = c; if (out.fx.has(j)) moved.fx.add(y * f.w + x); } });
  return moved;
}

// low bodies (side view): foreshortened by a fifth and tilted along the diagonal
function tilt(f, view) {
  const b = bounds(f);
  if (!b) return f;
  const keep = (x) => (x - b.x0) % 5 !== 2;                              // drop every fifth column
  const cols = []; for (let x = b.x0; x <= b.x1; x++) if (keep(x)) cols.push(x);
  const nw = cols.length - 1, nx0 = Math.round((b.x0 + b.x1) / 2 - nw / 2);
  // dside: the head (right) comes toward the viewer, so the rear rises; uside: the head goes away and rises
  const k = 0.28, rise = (i) => Math.round((view === "dside" ? nw - i : i) * k);
  let lift = 0;
  for (let i = 0; i <= nw; i++) lift = Math.max(lift, rise(i));
  const room = b.y0;                                                    // keep the top inside the canvas
  const scale = lift > room ? room / lift : 1;
  const out = new Canvas(f.w, f.h);
  cols.forEach((x, i) => {
    const dy = -Math.round(rise(i) * scale);
    for (let y = 0; y < f.h; y++) {
      const j = y * f.w + x, c = f.px[j];
      if (!c) continue;
      const Y = y + dy, X = nx0 + i;
      if (Y < 0 || Y >= f.h || X < 0 || X >= f.w) continue;
      out.px[Y * f.w + X] = c;
      if (f.fx.has(j)) out.fx.add(Y * f.w + X);
    }
  });
  return out;
}

/** Face for a frame: a blink at the end of the idle, a scowl while chasing and fighting. */
export const exprOf = (anim, i, idle = FRAMES.idle) => (anim === "idle" && i === idle - 1 ? "blink" : anim === "run" || anim === "attack" || anim === "skill" ? "angry" : null);

/**
 * Wrap a three-view painter (dir = down | side | up, ending in finish()) so it paints all five views
 * and the faces: body "upright" turns the front/back view, "low" tilts the side view; eyes = the eye
 * colours (kit rgba) when the painter doesn't register them itself; base4 = the painter breathes over
 * four idle frames (the sheet's eight repeat them, blinking on the last).
 */
export function eightWay(paint, { body = "upright", eyes = [], base4 = false } = {}) {
  return (dir, anim, i) => {
    const diag = dir === "dside" || dir === "uside";
    Object.assign(look, { view: diag ? dir : null, body, expr: exprOf(anim, i) });
    look.eyes.clear(); eyes.forEach(eyeCol);
    const base = !diag ? dir : body === "low" ? "side" : dir === "dside" ? "down" : "up";
    try { return paint(base, anim, base4 && anim === "idle" ? i % 4 : i); } finally { look.view = null; look.expr = null; }
  };
}

/** The three-quarter turn on a finished canvas (painted bosses): view "dside" | "uside". */
export function turnFinished(f, view, body = "upright") {
  return body === "low" ? tilt(f, view) : turnUpright(f, view === "uside");
}
