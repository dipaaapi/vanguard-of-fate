// Skill and hit effects as pixel-art animations (aseprite/fx/<name>.aseprite, one "down-play" tag).
// Heading effects (meteor, slash, bolt, arrow) point right (+x); the game rotates them.
// "Tint" effects are painted in greys and coloured by the game (js/fxsprites.js), so one sheet serves
// every element: slash, wave, bolt, bite.
import { Canvas, hex, mixc } from "./kit.mjs";

const TAU = Math.PI * 2;
const H = (s) => hex(s);
const FIRE = ["#ffffff", "#fff3b0", "#ffd166", "#ff9f1c", "#f3722c", "#c1121f", "#5c1a1a"].map(H);
const GREY = ["#ffffff", "#e8e8e8", "#c8c8c8", "#a0a0a0", "#787878"].map(H);
const GOLD = ["#ffffff", "#fff6d5", "#ffe08a", "#ffd166", "#e0a63a"].map(H);
const CYAN = ["#ffffff", "#d9fbff", "#7df3ff", "#22d3ee", "#0e7490"].map(H);
const VIOLET = ["#ffffff", "#ede9fe", "#c4b5fd", "#8b5cf6", "#5b21b6"].map(H);
const BAYER = [[0, 2], [3, 1]];
const dith = (x, y, t) => (BAYER[y & 1][x & 1] + 0.5) / 4 < t;

// Filled radial glow: colour index from the distance (0 = centre)
function orb(f, cx, cy, r, ramp, squash = 1) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) / squash) / r;
    if (d > 1) continue;
    const v = d * (ramp.length - 0.01);
    const k = Math.floor(v), frac = v - k;
    f.set(x, y, ramp[Math.min(ramp.length - 1, k + (dith(x, y, frac) ? 1 : 0))], true);
  }
}
// Ring (ellipse outline) of thickness th with dithered fade toward the inside
function ring(f, cx, cy, rx, ry, th, ramp, broken = 0, seed = 0) {
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
    const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry);
    const e = (1 - d) * Math.min(rx, ry);           // pixels inside the edge
    if (e < 0 || e > th) continue;
    if (broken && ((Math.atan2(y - cy, x - cx) * 8 + seed) % 2 + 2) % 2 < broken) continue;
    const k = Math.min(ramp.length - 1, Math.floor((e / th) * ramp.length));
    if (k > 1 && !dith(x, y, 0.6)) continue;
    f.set(x, y, ramp[k], true);
  }
}

export const FX = {
  // Falling fireball, heading right, with a flickering flame trail
  meteor: { w: 26, h: 18, n: 4, dur: 0.06, paint(i) {
    const f = new Canvas(26, 18);
    for (let k = 0; k < 7; k++) {
      const x = 17 - k * 2.2, y = 9 + Math.sin(k * 1.3 + i * 1.6) * (k * 0.25);
      orb(f, x, y, Math.max(1.2, 4.2 - k * 0.5), FIRE.slice(2 + Math.min(3, Math.floor(k / 2))));
    }
    orb(f, 18, 9, 4.6, FIRE.slice(0, 6));
    [[4, 6], [2, 11], [7, 14], [5, 3]].forEach(([x, y], k) => { if ((k + i) % 2 === 0) f.set(x - (i % 2), y, FIRE[3], true); });
    return f;
  } },
  // Explosion, drawn as wide as the blast radius
  blast: { w: 64, h: 44, n: 6, dur: 0.07, paint(i) {
    const f = new Canvas(64, 44), p = (i + 1) / 6;
    const r = 6 + 24 * p;
    if (i < 4) orb(f, 32, 24, r * (i < 2 ? 1 : 0.85), (i < 2 ? FIRE : FIRE.slice(2)), 0.7);
    ring(f, 32, 24, r + 2, (r + 2) * 0.7, 2 + (i > 2 ? 1 : 0), i < 3 ? FIRE.slice(1, 5) : [FIRE[4], FIRE[5], FIRE[6]]);
    for (let k = 0; k < 10; k++) {   // debris and smoke puffs
      const a = (k / 10) * TAU + i * 0.3, d = r * (0.7 + (k % 3) * 0.15);
      const x = 32 + Math.cos(a) * d, y = 24 + Math.sin(a) * d * 0.7 - i;
      if (i >= 3) orb(f, x, y, 1.6 + (k % 2), [H("#6b5b5b"), H("#4a3f3f"), H("#2e2626")]);
      else f.set(x, y, FIRE[2 + (k % 3)], true);
    }
    return f;
  } },
  // Lightning strike, bottom centre on the target
  lightning: { w: 18, h: 44, n: 4, dur: 0.05, paint(i) {
    const f = new Canvas(18, 44);
    const pts = [[9, 0], [6, 8], [11, 15], [7, 23], [12, 31], [8, 37], [9, 43]];
    const jit = [0, 1, -1, 0][i];
    const main = i === 3 ? CYAN.slice(2) : CYAN;
    for (let k = 0; k + 1 < pts.length; k++) {
      const [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
      f.line(x0 + (k % 2 ? jit : 0), y0, x1 + (k % 2 ? 0 : jit), y1, i === 1 ? 1 : 3, (t) => main[t < 0.5 ? 2 : 3]);
      f.line(x0 + (k % 2 ? jit : 0), y0, x1 + (k % 2 ? 0 : jit), y1, 1, main[0]);
    }
    if (i !== 1) { f.line(11, 15, 16, 20, 1, CYAN[2]); f.line(7, 23, 2, 27, 1, CYAN[2]); }
    if (i >= 2) [[3, 42], [15, 42], [5, 39], [13, 40], [9, 40]].forEach(([x, y]) => f.set(x, y, CYAN[1], true));
    return f;
  } },
  // Holy ring with sparkles that circle it (drawn at the burst radius)
  holy: { w: 48, h: 32, n: 4, dur: 0.08, paint(i) {
    const f = new Canvas(48, 32);
    ring(f, 24, 16, 22, 14, 3, GOLD);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU + i * (TAU / 24);
      const x = 24 + Math.cos(a) * 22, y = 16 + Math.sin(a) * 14;
      f.spark(x, y, GOLD[0], true);
      if (k % 2 === 0) { f.set(x, y - 2, GOLD[1], true); f.set(x, y + 2, GOLD[1], true); f.set(x - 2, y, GOLD[1], true); f.set(x + 2, y, GOLD[1], true); }
    }
    return f;
  } },
  // Fighter's force sphere: a cyan orb with a turning swirl
  sphere: { w: 16, h: 16, n: 4, dur: 0.06, paint(i) {
    const f = new Canvas(16, 16);
    orb(f, 8, 8, 5.5, CYAN);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * TAU + i * (TAU / 12);
      for (let s = 0; s < 4; s++) f.set(8 + Math.cos(a + s * 0.25) * (6.5 - s * 0.3), 8 + Math.sin(a + s * 0.25) * (6.5 - s * 0.3), CYAN[s < 2 ? 1 : 2], true);
    }
    return f;
  } },
  // Weapon slash: a crescent that sweeps in, flashes and fades (tinted by the game)
  slash: { w: 32, h: 32, n: 4, dur: 0.05, tint: true, paint(i) {
    const f = new Canvas(32, 32);
    const span = [1.4, 2.6, 2.8, 2.8][i], th = [3, 6, 5, 3][i], R0 = 14;
    for (let a = -span / 2; a <= span / 2; a += 0.015) {
      const u = a / (span / 2);                          // -1 … 1 along the arc
      const w = Math.max(1, th * Math.cos(u * (Math.PI / 2)) * (u > 0 ? 1 : 0.7));
      for (let r = R0 - w; r <= R0; r += 0.5) {
        const x = 8 + Math.cos(a) * r, y = 16 + Math.sin(a) * r;
        if (i === 3 && !dith(Math.round(x), Math.round(y), 0.5)) continue;
        f.set(x, y, GREY[r > R0 - 0.8 ? 0 : r > R0 - 2.5 ? 1 : 2], true);
      }
    }
    if (i === 1) [[25, 9], [27, 16], [25, 23]].forEach(([x, y]) => f.spark(x, y, GREY[0], true));
    return f;
  } },
  // Ground shockwave ring (tinted; drawn at the wave radius)
  wave: { w: 64, h: 32, n: 4, dur: 0.06, tint: true, paint(i) {
    const f = new Canvas(64, 32);
    ring(f, 32, 16, 30, 14, 3 - (i > 2 ? 1 : 0), GREY, i === 3 ? 1 : 0, i);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + i * 0.4; f.set(32 + Math.cos(a) * 26, 16 + Math.sin(a) * 11 - (i % 2), GREY[1], true); }
    return f;
  } },
  // Magic bolt heading right (tinted by element)
  bolt: { w: 18, h: 10, n: 4, dur: 0.05, tint: true, paint(i) {
    const f = new Canvas(18, 10);
    for (let k = 0; k < 6; k++) f.set(11 - k * 1.6, 5 + Math.sin(k + i * 1.5) * 0.8, GREY[Math.min(4, 1 + Math.floor(k / 2))], true);
    orb(f, 13, 5, 3.4, GREY);
    f.set(13, 5, GREY[0], true);
    [[16, 2], [16, 8], [9, 1], [9, 9]].forEach(([x, y], k) => { if ((k + i) % 2 === 0) f.set(x, y, GREY[0], true); });
    return f;
  } },
  // Arrow heading right
  arrow: { w: 14, h: 5, n: 1, dur: 0.1, paint() {
    const f = new Canvas(14, 5);
    f.line(2, 2, 10, 2, 1, H("#8b5a2b"));
    f.poly([[10, 0], [14, 2.5], [10, 5]], H("#dbe4ee")); f.set(11, 2, H("#ffffff"));
    [[0, 0], [1, 1], [0, 4], [1, 3], [2, 1], [2, 3]].forEach(([x, y]) => f.set(x, y, H("#e2e8f0")));
    return f;
  } },
  // Arrow falling in the Archer's arrow rain (points down)
  arrowfall: { w: 5, h: 12, n: 1, dur: 0.1, paint() {
    const f = new Canvas(5, 12);
    f.line(2, 0, 2, 8, 1, H("#8b5a2b"));
    f.poly([[0, 8], [2.5, 12], [5, 8]], H("#dbe4ee")); f.set(2, 9, H("#ffffff"));
    [[1, 0], [3, 0], [1, 1], [3, 1]].forEach(([x, y]) => f.set(x, y, H("#a3e635")));
    return f;
  } },
  // Familiar's bite: fangs snap shut, then sparks (tinted by the familiar's colour)
  bite: { w: 22, h: 16, n: 4, dur: 0.05, tint: true, paint(i) {
    const f = new Canvas(22, 16);
    const gap = [5, 2, 0, 0][i];
    if (i < 3) for (let k = 0; k < 3; k++) {
      const x = 2 + k * 6;
      f.poly([[x, 2 - gap], [x + 5, 2 - gap], [x + 2.5, 8 - gap]], GREY[1]);
      f.poly([[x + 2, 14 + gap], [x + 7, 14 + gap], [x + 4.5, 8 + gap]], GREY[2]);
      f.set(x + 1, 3 - gap, GREY[0], true);
    }
    if (i >= 2) [[10, 8], [3, 3], [17, 3], [3, 13], [17, 13], [10, 1], [10, 15]].forEach(([x, y], k) => { if (i === 2 || k % 2) f.spark(x, y, GREY[0], k === 0); });
    return f;
  } },
  // Falcon talon marks
  claw: { w: 20, h: 18, n: 4, dur: 0.05, paint(i) {
    const f = new Canvas(20, 18);
    for (let k = 0; k < 3; k++) {
      const len = Math.min(1, (i + 1) / 2);
      const x0 = 4 + k * 5, y0 = 2;
      const col = i === 3 ? GOLD[3] : k === 1 ? GOLD[0] : GOLD[1];
      if (i === 3 && k === 1) continue;
      f.line(x0, y0, x0 + 8 * len, y0 + 14 * len, i === 1 ? 2 : 1, col);
    }
    return f;
  } },
  // Arcane Owl's spell landing: a violet rune star
  arcane: { w: 24, h: 24, n: 4, dur: 0.06, paint(i) {
    const f = new Canvas(24, 24);
    ring(f, 12, 12, 4 + i * 2.5, 4 + i * 2.5, 2, VIOLET, i === 3 ? 1 : 0, i);
    for (let k = 0; k < 4; k++) { const a = (k / 4) * TAU + i * 0.4; f.line(12, 12, 12 + Math.cos(a) * (3 + i * 2), 12 + Math.sin(a) * (3 + i * 2), 1, VIOLET[i < 2 ? 1 : 2]); }
    if (i < 3) orb(f, 12, 12, 3 - i * 0.6, VIOLET);
    return f;
  } }
};

export const mix = mixc;
