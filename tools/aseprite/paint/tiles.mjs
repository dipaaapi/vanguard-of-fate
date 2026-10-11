// Tile set painter: aseprite/tiles/<theme>.aseprite, one per map theme, read by js/world/terrain.js.
//
// Sheet (256×96, 16 px grid, 8 frames; layout in TILESHEET):
//   (0,0)   64×64 liquid texture, seamless, animated          layer "liquid"
//   (64,0)  16 ground tiles by corner mask (TL1 TR2 BL4 BR8)   layer "ground"
//   (128,0) 16 path tiles by the same masks                    layer "path"
//   (192,0) 16 shore tiles: foam line, waves, shallows, shadow  layer "foam"
//   (0,64)  8 full-ground variants · (128,64) 4 full-path variants
//   (0,80)  16 decorations: 0-5 small, 6-11 large, 12-15 theme specials   layer "decor"
// Only the liquid and foam layers change between frames, so hand edits to ground, paths and
// decorations stay put in every frame (linked cels).
//
// Each corner tile is painted by laying its four cells out as a 32×32 patch and cropping the middle
// 16×16, so neighbouring tiles always meet seamlessly: textures follow the pixel position, edges follow
// the cells (rounded outer corners, filled inner corners, a cliff face in the lower half of a ground cell
// over liquid, foam up to 4 px out).
import path from "node:path";
import { writeAse } from "../asefile.mjs";
import { SRC_DIR } from "../lib.mjs";
import { THEMES } from "../../../js/world/tileset.js";
import { TILESHEET as S, CLIFF_H, TILE_THEMES } from "../../../js/world/terrain.js";

const T = 16, R = 4, FOAM = 4, FRAMES = S.frames;
const LAYERS = ["liquid", "foam", "ground", "path", "decor"];

// ---------- colour ----------
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function toHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function fromHsl([h, s, l]) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
// Shade a colour: k < 0 darker (hue drifts toward blue-violet, more saturated), k > 0 lighter (toward warm yellow)
function shade(c, k) {
  const [h, s, l] = toHsl(c);
  const toward = k < 0 ? 245 : 55, dh = ((toward - h + 540) % 360) - 180;
  return fromHsl([h + dh * Math.min(0.35, Math.abs(k) * 0.5), s * (k < 0 ? 1 + 0.25 * -k : 1 - 0.15 * k), l + k * (k < 0 ? l : 1 - l) * 0.9]);
}
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const A = (c, a = 255) => [c[0], c[1], c[2], a];

// ---------- noise ----------
function h2(x, y, s) {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1103515245);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
// smooth value noise with period p (so 16-px tiles and the 64-px liquid wrap)
function vnoise(x, y, cell, p, s) {
  const gx = Math.floor(x / cell), gy = Math.floor(y / cell), fx = x / cell - gx, fy = y / cell - gy, n = p / cell;
  const v = (i, j) => h2(((gx + i) % n + n) % n, ((gy + j) % n + n) % n, s);
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return (v(0, 0) * (1 - sx) + v(1, 0) * sx) * (1 - sy) + (v(0, 1) * (1 - sx) + v(1, 1) * sx) * sy;
}

// ---------- materials per theme ----------
// surface: grass | moss | sand | snow | ash | stone | bone | mud ; liquid: water | lava | void | blood | murk
const KIND = {
  meadow: ["grass", "water", "flower"], aethelgard: ["grass", "water", "flower"], canopy: ["moss", "void", "mushroom"],
  coast: ["sand", "water", "shell"], frost: ["snow", "ice", "crystal"], ash: ["ash", "lava", "ember"], siege: ["grass", "blood", "bone"],
  maw: ["stone", "void", "crystal"], strand: ["stone", "water", "shell"], ossuary: ["bone", "murk", "bone"], chainspire: ["stone", "blood", "chain"],
  rocky: ["stone", "murk", "rock"], swamp: ["mud", "murk", "reed"], highland: ["grass", "water", "flower"], desert: ["sand", "murk", "cactus"]
};
const MEADOW = {
  grass: ["#3fae35", "#47b93a", "#38a330"], grassLight: "#79d455", grassDark: "#24822b",
  dirt: ["#8d5a33", "#83532f"], dirtLight: "#b98251", dirtDark: "#5a3720",
  decoColors: ["#ffffff", "#ffe14a", "#ff7fa1"],
  liquid: { base: "#2a72dc", light: "#62bdfa", dark: "#1a4fb2", rim: "#f6fbff" },
  rock: ["#5b6475", "#8390a5", "#b9c3d2"]
};
export function material(theme) {
  const th = theme === "meadow" ? MEADOW : THEMES[theme];
  const [surface, liquid, special] = KIND[theme];
  const g = th.grass.map(hex), gl = hex(th.grassLight), gd = hex(th.grassDark);
  const d = th.dirt.map(hex), dl = hex(th.dirtLight), dd = hex(th.dirtDark);
  const q = th.liquid;
  const bright = toHsl(g[0])[2] > 0.55;           // snow, sand: outlines need more contrast
  return {
    theme, surface, liquid, special,
    // ground ramp: 0 outline … 6 highlight
    g: [shade(gd, bright ? -0.55 : -0.5), shade(gd, -0.2), gd, g[2], g[0], g[1], gl, shade(gl, 0.35)],
    // cliff ramp from the soil
    c: [shade(dd, -0.6), shade(dd, -0.3), dd, d[1], d[0], dl, shade(dl, 0.3)],
    // path ramp: the soil, a step lighter than the cliff
    p: [shade(dd, -0.35), dd, d[0], mix(d[0], dl, 0.45), mix(d[0], dl, 0.8), shade(dl, 0.25)],
    w: { base: hex(q.base), light: hex(q.light), dark: hex(q.dark), rim: hex(q.rim) },
    deco: (th.decoColors || ["#e2e8f0", "#fde047", "#fb7185"]).map(hex),
    rock: (th.rock || ["#475569", "#64748b", "#94a3b8"]).map(hex),
    seed: [...theme].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0
  };
}

// ---------- pixel buffer ----------
class Img {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  set(x, y, c, a = 255) {
    if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    if (a >= 255 || !this.d[i + 3]) { this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = a; return; }
    const t = a / 255;   // blend over what is there
    for (let k = 0; k < 3; k++) this.d[i + k] = Math.round(this.d[i + k] * (1 - t) + c[k] * t);
    this.d[i + 3] = Math.max(this.d[i + 3], a);
  }
  get(x, y) { const i = (y * this.w + x) * 4; return this.d[i + 3] ? [this.d[i], this.d[i + 1], this.d[i + 2]] : null; }
}

// ---------- surface textures (lx, ly = position in the tile, 0..15; v = variant) ----------
function surfacePx(M, x, y, v) {
  const G = M.g, s = M.seed + v * 101;
  const n = vnoise(x, y, 8, 16, s) * 0.55 + vnoise(x, y, 4, 16, s + 1) * 0.45, r = h2(x, y, s + 2);
  switch (M.surface) {
    case "sand": {
      const rip = Math.sin((x * 0.55 + y * 1.25) + vnoise(x, y, 8, 16, s + 3) * 5);
      let c = n < 0.42 ? G[3] : n > 0.62 ? G[5] : G[4];
      if (rip > 0.82) c = G[5]; else if (rip < -0.88) c = G[3];
      if (r < 0.04) c = G[2]; else if (r > 0.975) c = G[6];
      return c;
    }
    case "snow": {
      let c = n < 0.3 ? G[4] : n > 0.66 ? G[6] : G[5];
      if (r < 0.015) c = G[4]; else if (r > 0.99) c = G[7];
      return c;
    }
    case "ash": case "stone": case "bone": {
      // cracked plates: dark seams where two random cells meet
      let f1 = 9, f2 = 9;
      for (let j = -1; j <= 2; j++) for (let i = -1; i <= 2; i++) {
        const px = i * 8 + h2((i + 2) & 1, (j + 2) & 1, s + 4) * 8, py = j * 8 + h2((i + 2) & 1, (j + 2) & 1, s + 5) * 8;
        const dd = Math.hypot(x + 0.5 - px, y + 0.5 - py);
        if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd;
      }
      let c = n < 0.4 ? G[3] : n > 0.62 ? G[5] : G[4];
      if (f2 - f1 < 0.9) c = G[2];
      else if (f2 - f1 < 1.8 && n > 0.5) c = G[5];
      if (r < 0.06) c = G[2]; else if (r > 0.97) c = G[6];
      return c;
    }
    case "mud": {
      let c = n < 0.38 ? G[2] : n > 0.6 ? G[4] : G[3];
      if (vnoise(x, y, 4, 16, s + 6) > 0.72) c = G[2];
      if (r > 0.96) c = G[6];
      return c;
    }
    default: {   // grass, moss
      let c = n < 0.4 ? G[3] : n > 0.63 ? G[5] : G[4];
      if (r < 0.1) c = G[3]; else if (r > 0.93) c = G[5];
      return c;
    }
  }
}
// grass blades: short strokes (dark stem, lit tip) drawn after the base, inside the tile
function blades(M, put, x0, y0, isTop, v) {
  if (M.surface !== "grass" && M.surface !== "moss" && M.surface !== "mud") return;
  const G = M.g, s = M.seed + v * 101 + 9, rate = M.surface === "mud" ? 0.04 : 0.17;
  for (let y = 15; y >= 1; y--) for (let x = 0; x < 16; x++) {
    const r = h2(x, y, s);
    if (r >= rate || !isTop(x0 + x, y0 + y)) continue;
    const len = 2 + ((r * 1000) | 0) % 2;
    for (let k = 0; k < len && y - k >= 0 && isTop(x0 + x, y0 + y - k); k++) put(x0 + x, y0 + y - k, k === 0 ? G[2] : k === len - 1 ? G[6] : G[3]);
  }
}

// ---------- the 32×32 corner patch ----------
// cells[0..3] = TL, TR, BL, BR; returns per-pixel classes for the 2×2 cell block
function patch(cells) {
  const cell = (cx, cy) => cells[Math.max(0, Math.min(1, cy)) * 2 + Math.max(0, Math.min(1, cx))];
  const cut = (dx, dy) => dx < R && dy < R && (R - dx - 0.5) ** 2 + (R - dy - 0.5) ** 2 > R * R;
  const solid = new Uint8Array(32 * 32), cliff = new Uint8Array(32 * 32);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const cx = x >> 4, cy = y >> 4, lx = x & 15, ly = y & 15, me = cell(cx, cy);
    let v = me;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const dx = sx < 0 ? lx : 15 - lx, dy = sy < 0 ? ly : 15 - ly;
      const nx = cell(cx + sx, cy), ny = cell(cx, cy + sy), nd = cell(cx + sx, cy + sy);
      if (me && !nx && !ny && cut(dx, dy)) v = 0;
      if (!me && nx && ny && nd && sy > 0 && dx + dy <= 2) v = 1;     // inner corner (not under a cliff)
    }
    solid[y * 32 + x] = v;
    // cliff: lower part of a ground cell whose south neighbour is liquid
    if (v && me && !cell(cx, cy + 1) && ly >= 16 - CLIFF_H) cliff[y * 32 + x] = ly - (16 - CLIFF_H) + 1;
  }
  // distance from solid ground over liquid (8-neighbour), capped
  const dist = new Uint8Array(32 * 32).fill(255);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    if (solid[y * 32 + x]) { dist[y * 32 + x] = 0; continue; }
    let best = 255;
    for (let dy = -FOAM - 1; dy <= FOAM + 1; dy++) for (let dx = -FOAM - 1; dx <= FOAM + 1; dx++) {
      const X = x + dx, Y = y + dy;
      if (X < 0 || Y < 0 || X >= 32 || Y >= 32 || !solid[Y * 32 + X]) continue;
      best = Math.min(best, Math.max(Math.abs(dx), Math.abs(dy)));
    }
    dist[y * 32 + x] = best;
  }
  return { solid, cliff, dist, S: (x, y) => x >= 0 && y >= 0 && x < 32 && y < 32 && solid[y * 32 + x] === 1,
    C: (x, y) => x >= 0 && y >= 0 && x < 32 && y < 32 ? cliff[y * 32 + x] : 0 };
}

// ground tile: surface top with rim, lip and the cliff face
function paintGround(M, img, ox, oy, mask, v = 0) {
  const cells = [mask & 1, (mask >> 1) & 1, (mask >> 2) & 1, (mask >> 3) & 1].map(Boolean);
  const P = patch(cells), G = M.g, C = M.c;
  const top = (x, y) => P.S(x, y) && !P.C(x, y);
  const put = (x, y, c) => { if (x >= 8 && y >= 8 && x < 24 && y < 24) img.set(ox + x - 8, oy + y - 8, A(c)); };
  for (let y = 8; y < 24; y++) for (let x = 8; x < 24; x++) if (top(x, y)) put(x, y, surfacePx(M, (x - 8) & 15, (y - 8) & 15, v));
  blades(M, (x, y, c) => put(x, y, c), 8, 8, (x, y) => top(x, y) && top(x, y + 1), v);
  for (let y = 8; y < 24; y++) for (let x = 8; x < 24; x++) {
    if (top(x, y)) {
      // rim: outline toward liquid, a darker lip (with blade tips) over the cliff, a lit edge along north shores
      const openN = !P.S(x, y - 1), open = openN || !P.S(x - 1, y) || !P.S(x + 1, y) || !P.S(x, y + 1);
      if (P.C(x, y + 1)) put(x, y, h2(x - 8, 0, M.seed + 11) < 0.5 ? G[1] : G[2]);
      else if (open) put(x, y, G[0]);
      else if (!P.S(x, y - 2) || !P.S(x - 2, y) || !P.S(x + 2, y)) put(x, y, openN || !P.S(x, y - 2) ? G[6] : G[3]);
      continue;
    }
    const d = P.C(x, y);
    if (!d) continue;
    // cliff face: vertical strata per column (lit / mid / dark), short dark streaks, a soft lit ledge,
    // deep shadow under the lip with blade tips hanging over it, a wet dark foot
    const lx = (x - 8) & 15, col = h2(lx, 0, M.seed + 12), seg = h2(lx, (d + (lx & 1)) >> 2, M.seed + 13);
    let c = col < 0.25 ? C[2] : col < 0.55 ? C[3] : col < 0.88 ? C[4] : C[5];
    if (seg < 0.14) c = C[col < 0.5 ? 1 : 2];
    else if (seg > 0.9) c = C[Math.min(6, C.indexOf(c) + 1)];
    if (d === 6 && h2(lx, 6, M.seed + 14) < 0.5) c = C[5];
    if (d === 1) c = h2(lx, 1, M.seed + 15) < 0.22 ? G[2] : C[0];   // shadow under the lip, a few blade tips
    else if (d === 2) c = C[1];
    else if (d === CLIFF_H) c = C[0];
    else if (d === CLIFF_H - 1) c = h2(lx, d, M.seed + 16) < 0.5 ? C[1] : C[2];
    if (!P.S(x - 1, y) || !P.S(x + 1, y)) c = C[0];
    else if (!P.S(x - 2, y) && d > 2) c = C[5];                     // lit west corner
    else if (!P.S(x + 2, y) && d > 2) c = C[2];
    else if (P.S(x + 1, y) && !P.C(x + 1, y)) c = C[1];          // shade where it meets ground
    else if (P.S(x - 1, y) && !P.C(x - 1, y)) c = C[1];
    put(x, y, c);
  }
}

// path tile: soil over the ground, rounded, with a dark worn border and pebbles
function paintPath(M, img, ox, oy, mask, v = 0) {
  const P = patch([mask & 1, (mask >> 1) & 1, (mask >> 2) & 1, (mask >> 3) & 1].map(Boolean));
  const Pp = M.p, s = M.seed + 200 + v * 31;
  for (let y = 8; y < 24; y++) for (let x = 8; x < 24; x++) {
    if (!P.S(x, y)) continue;
    const lx = (x - 8) & 15, ly = (y - 8) & 15, n = vnoise(lx, ly, 8, 16, s) * 0.6 + vnoise(lx, ly, 4, 16, s + 4) * 0.4, r = h2(lx, ly, s + 1);
    let c = n < 0.38 ? Pp[2] : n > 0.6 ? Pp[4] : Pp[3];
    if (r > 0.96) c = Pp[5]; else if (r < 0.04) c = Pp[1];
    const edge = !P.S(x - 1, y) || !P.S(x + 1, y) || !P.S(x, y - 1) || !P.S(x, y + 1);
    if (edge) c = Pp[1];
    else if (!P.S(x, y - 2) || !P.S(x - 2, y)) c = Pp[2];      // worn shadow on the far side
    else if (!P.S(x, y + 2) || !P.S(x + 2, y)) c = Pp[4];
    img.set(ox + x - 8, oy + y - 8, A(c), edge ? 170 : 255);
  }
  // pebbles
  for (let k = 0; k < 3; k++) {
    const px = 2 + ((h2(k, mask, s + 2) * 12) | 0), py = 2 + ((h2(mask, k, s + 3) * 12) | 0);
    if (P.S(px + 8, py + 8) && P.S(px + 9, py + 9) && P.S(px + 7, py + 7) && P.S(px + 10, py + 8)) {
      img.set(ox + px, oy + py, A(Pp[5])); img.set(ox + px + 1, oy + py, A(Pp[4])); img.set(ox + px, oy + py + 1, A(Pp[1])); img.set(ox + px + 1, oy + py + 1, A(Pp[2]));
    }
  }
}

// shore tile (animated): shallows tint, foam line, a wave that swells out and back, cliff shadow
function paintFoam(M, img, ox, oy, mask, f) {
  if (mask === 0 || mask === 15) return;
  const P = patch([mask & 1, (mask >> 1) & 1, (mask >> 2) & 1, (mask >> 3) & 1].map(Boolean)), W = M.w;
  const hot = M.liquid === "lava", wave = [2, 3, 3, 4, 4, 3, 3, 2][f];
  const foam = hot ? shade(W.rim, 0.2) : W.rim, foam2 = hot ? W.light : mix(W.rim, W.light, 0.55);
  for (let y = 8; y < 24; y++) for (let x = 8; x < 24; x++) {
    const d = P.dist[y * 32 + x];
    if (d === 0 || d > FOAM) continue;
    const X = ox + x - 8, Y = oy + y - 8, lx = (x - 8) & 15, ly = (y - 8) & 15;
    // shadow cast by the cliff on the liquid right under it
    const under = P.C(x, y - 1) === CLIFF_H || P.C(x, y - 2) === CLIFF_H;
    img.set(X, Y, A(hot ? W.light : W.light), Math.round((FOAM + 1 - d) * (hot ? 34 : 20)));
    if (under && d <= 2) img.set(X, Y, A(W.dark), 150);
    if (d === 1) img.set(X, Y, A(foam), under ? 200 : 255);
    else if (d === 2 && !under && h2(lx, ly, f + 300) < 0.45) img.set(X, Y, A(foam2), 200);
    else if (d === wave && h2(lx >> 1, ly >> 1, M.seed + f) < 0.6) img.set(X, Y, A(foam2), d === 4 ? 150 : 210);
  }
}

// liquid texture (animated, wraps at 64): cells drifting on circles, one loop per FRAMES
function paintLiquid(M, img, f) {
  const W = M.w, N = S.liquid.size, a = (f / FRAMES) * Math.PI * 2;
  const seeds = [];
  for (let i = 0; i < 8; i++) {
    const r = 1.5 + h2(i, 1, M.seed) * 2.5, p = h2(i, 2, M.seed) * 6.28, dir = h2(i, 3, M.seed) < 0.5 ? 1 : -1;
    seeds.push([h2(i, 4, M.seed) * N + Math.cos(a * dir + p) * r, h2(i, 5, M.seed) * N + Math.sin(a * dir + p) * r]);
  }
  const mid = mix(W.base, W.light, 0.4), deep = W.dark;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let f1 = 1e9, f2 = 1e9;
    for (const [sx, sy] of seeds) {
      let dx = Math.abs(x + 0.5 - sx) % N; if (dx > N / 2) dx = N - dx;
      let dy = Math.abs(y + 0.5 - sy) % N; if (dy > N / 2) dy = N - dy;
      const d = Math.hypot(dx, dy);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
    }
    const e = f2 - f1, g = h2(x, y, f + M.seed);
    let c;
    switch (M.liquid) {
      case "lava":   // dark crust plates with glowing seams that pulse
        c = e < 1 ? (g < 0.3 ? shade(W.rim, 0.3) : W.light) : e < 2.2 ? W.base : e > 6 ? shade(deep, -0.3) : deep; break;
      case "void":   // deep purple with slow lighter veils and star motes
        c = e < 0.8 ? mid : e > 5 ? shade(deep, -0.2) : W.base;
        if (g > 0.993) c = W.rim; break;
      case "ice":    // icy sea: slow dark-blue water with small pale floes drifting
        c = e > 8 ? mix(W.light, W.rim, 0.5) : e > 7 ? W.light : e < 0.9 ? mix(W.base, W.light, 0.4) : e > 4.5 ? shade(W.dark, -0.3) : shade(W.dark, -0.15); break;
      case "blood": case "murk":   // thick and slow: soft glossy streaks
        c = e < 0.8 ? mix(W.base, mid, 0.6) : e > 5.5 ? mix(W.base, deep, 0.6) : W.base;
        if (g > 0.996) c = W.light; break;
      default:       // water: light caustic lines, mid band, dark pools
        c = e < 0.9 ? (g < 0.1 ? shade(W.light, 0.4) : W.light) : e < 1.9 ? mid : e > 4.5 ? deep : W.base;
    }
    img.set(S.liquid.x + x, S.liquid.y + y, A(c));
  }
}

// ---------- decorations ----------
function paintDecor(M, img, k) {
  const ox = S.decor.x + k * 16, oy = S.decor.y, G = M.g, D = M.deco, Rk = M.rock, s = M.seed + 500 + k;
  const px = (x, y, c, a) => img.set(ox + x, oy + y, A(c), a);
  const shadow = (cx, cy, rx) => { for (let x = -rx; x <= rx; x++) px(cx + x, cy, G[1], 150); for (let x = -rx + 1; x < rx; x++) px(cx + x, cy + 1, G[1], 90); };
  const blob = (cx, cy, rx, ry, ramp, outline) => {
    for (let y = -ry - 1; y <= ry + 1; y++) for (let x = -rx - 1; x <= rx + 1; x++) {
      const k2 = (x / (rx + 0.5)) ** 2 + (y / (ry + 0.5)) ** 2;
      if (k2 > 1) continue;
      const lit = -x * 0.5 - y * 0.8 + (h2(x, y, s) - 0.5) * 1.2;
      px(cx + x, cy + y, ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(ramp.length / 2 + lit * 0.9)))]);
    }
    for (let y = -ry - 1; y <= ry + 1; y++) for (let x = -rx - 1; x <= rx + 1; x++) {
      const k2 = (x / (rx + 0.5)) ** 2 + (y / (ry + 0.5)) ** 2;
      if (k2 <= 1) continue;
      const inside = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => ((x + a) / (rx + 0.5)) ** 2 + ((y + b) / (ry + 0.5)) ** 2 <= 1);
      if (inside) px(cx + x, cy + y, outline);
    }
  };
  const flower = (x, y, c) => { px(x, y, shade(c, -0.3)); px(x - 1, y, c); px(x + 1, y, c); px(x, y - 1, c); px(x, y + 1, shade(c, -0.15)); px(x, y, shade(D[1], 0.2)); px(x, y + 2, G[2]); };
  const tuft = (x, y, n) => { for (let i = 0; i < n; i++) { const bx = x + i * 2 - n, h = 2 + ((h2(i, k, s) * 3) | 0); for (let j = 0; j < h; j++) px(bx + (j > 2 ? 1 : 0), y - j, j === h - 1 ? G[6] : j === 0 ? G[1] : G[3]); } };
  const rockR = [shade(Rk[0], -0.4), Rk[0], Rk[1], Rk[2], shade(Rk[2], 0.3)];
  switch (k) {
    case 0: flower(5, 7, D[0]); flower(10, 10, D[0]); flower(4, 12, D[1]); break;
    case 1: flower(7, 6, D[1]); flower(11, 9, D[1]); flower(5, 11, D[2]); break;
    case 2: flower(6, 8, D[2]); flower(10, 6, D[2]); flower(11, 11, D[0]); break;
    case 3: tuft(8, 11, 4); break;
    case 4: tuft(6, 9, 3); tuft(11, 13, 2); break;
    case 5: [[5, 9], [9, 11], [11, 7]].forEach(([x, y]) => { px(x, y, rockR[3]); px(x + 1, y, rockR[2]); px(x, y + 1, rockR[1]); px(x + 1, y + 1, rockR[0]); }); break;
    case 6: shadow(8, 12, 4); blob(8, 9, 3, 2, rockR, rockR[0]); break;                           // rock
    case 7: shadow(8, 13, 6); blob(8, 8, 5, 4, rockR, rockR[0]); px(6, 6, rockR[4]); px(7, 5, rockR[4]); break;   // boulder
    case 8: { shadow(8, 13, 6); const bush = [G[1], G[2], G[3], G[4], G[5], G[6]]; blob(8, 8, 6, 4, bush, G[0]);
      [[5, 6], [10, 7], [8, 10]].forEach(([x, y]) => { px(x, y, D[2]); px(x + 1, y, shade(D[2], -0.3)); }); break; }   // berry bush
    case 9: { shadow(8, 13, 3); for (let y = 9; y < 13; y++) { px(7, y, [236, 226, 206]); px(8, y, [206, 194, 172]); }
      const cap = [shade(D[2], -0.5), shade(D[2], -0.2), D[2], shade(D[2], 0.3)]; blob(8, 8, 4, 2, cap, shade(D[2], -0.6)); px(6, 7, [255, 255, 255]); px(9, 8, [255, 255, 255]); break; }   // mushroom
    case 10: { shadow(8, 13, 5); const wood = M.c; for (let y = 8; y < 13; y++) for (let x = 4; x < 12; x++) px(x, y, x === 4 || x === 11 ? wood[0] : x < 7 ? wood[4] : wood[3]);
      for (let x = 4; x < 12; x++) { px(x, 7, wood[5]); px(x, 6, x === 4 || x === 11 ? wood[0] : wood[5]); } [[6, 7], [7, 6], [8, 7], [9, 6]].forEach(([x, y]) => px(x, y, wood[2])); px(5, 5, wood[0]); for (let x = 5; x < 11; x++) px(x, 5, wood[0]); break; }   // stump
    case 11: shadow(8, 13, 5); blob(5, 10, 2, 2, rockR, rockR[0]); blob(10, 9, 3, 3, rockR, rockR[0]); break;   // rock pair
    default: paintSpecial(M, px, k - 12, shadow, blob, rockR);
  }
}
function paintSpecial(M, px, i, shadow, blob, rockR) {
  const D = M.deco, G = M.g, s = M.seed + i;
  switch (M.special) {
    case "shell": {
      const c = [[255, 214, 196], [244, 170, 150], [214, 120, 104]];
      const cx = 6 + i * 2, cy = 8 + (i % 2) * 3;
      for (let x = -2; x <= 2; x++) for (let y = -1; y <= 1; y++) if (Math.abs(x) + Math.abs(y) < 3) px(cx + x, cy + y, c[(x + 2) % 2 ? 1 : 0]);
      px(cx, cy + 2, c[2]); px(cx - 1, cy + 1, c[2]); px(cx + 1, cy + 1, c[2]); break;
    }
    case "crystal": case "ember": {
      const c = M.special === "ember" ? [[120, 30, 10], [226, 85, 27], [255, 179, 71], [255, 236, 170]] : [shade(D[0], -0.5), shade(D[0], -0.2), D[0], [255, 255, 255]];
      shadow(8, 13, 4);
      const spikes = [[8, 4, 8], [5, 7, 5], [11, 8, 4]];
      spikes.slice(0, 1 + (i % 3)).forEach(([x, top, h]) => { for (let y = 0; y < h; y++) { const w = y < 2 ? 0 : 1; for (let dx = -w; dx <= w; dx++) px(x + dx, top + y, c[dx < 0 ? 2 : dx > 0 ? 0 : 1]); } px(x, top, c[3]); });
      break;
    }
    case "bone": {
      const b = [[90, 84, 72], [200, 194, 176], [236, 232, 220]];
      for (let x = 4; x < 12; x++) px(x, 9 + (i % 2), b[1]);
      [[3, 8], [3, 10], [12, 8], [12, 10]].forEach(([x, y]) => { px(x, y + (i % 2), b[2]); });
      for (let x = 4; x < 12; x++) px(x, 10 + (i % 2), b[0]);
      if (i >= 2) { blob(10, 6, 2, 2, [b[0], b[1], b[2]], b[0]); px(9, 6, [30, 26, 22]); px(11, 6, [30, 26, 22]); }   // skull
      break;
    }
    case "reed": {
      for (let r = 0; r < 4; r++) { const x = 4 + r * 2 + (i % 2), h = 6 + ((h2(r, i, s) * 5) | 0); for (let y = 0; y < h; y++) px(x, 13 - y, y === h - 1 ? [130, 90, 50] : G[y < 2 ? 2 : 4]); if (h > 8) { px(x, 13 - h, [110, 70, 40]); px(x, 14 - h, [90, 56, 30]); } }
      break;
    }
    case "cactus": {
      const c = [[30, 70, 40], [52, 110, 60], [86, 150, 84]];
      shadow(8, 13, 3);
      for (let y = 4; y < 13; y++) { px(7, y, c[2]); px(8, y, c[1]); px(9, y, c[0]); }
      for (let y = 7; y < 10; y++) { px(5, y, c[2]); px(11, y, c[0]); } px(6, 9, c[1]); px(10, 9, c[1]);
      px(8, 3, [255, 140, 170]); break;
    }
    case "chain": {
      const m = [[40, 38, 44], [92, 90, 100], [150, 148, 160]];
      for (let l = 0; l < 3; l++) { const x = 3 + l * 4, y = 9 + (l % 2); px(x, y, m[2]); px(x + 1, y, m[1]); px(x + 2, y, m[1]); px(x, y + 1, m[1]); px(x + 2, y + 1, m[0]); px(x + 1, y + 2, m[0]); }
      break;
    }
    case "mushroom": {
      const cap = [shade(D[0], -0.5), shade(D[0], -0.2), D[0], shade(D[0], 0.3)];
      [[5, 10, 2], [10, 9, 3], [8, 12, 1]].slice(0, 1 + (i % 3)).forEach(([x, y, r]) => { px(x, y + 1, [220, 214, 200]); px(x, y + 2, [200, 192, 176]); blob(x, y, r, Math.max(1, r - 1), cap, cap[0]); });
      break;
    }
    case "rock": shadow(8, 13, 4); blob(7, 9, 3 + (i % 2), 2 + (i % 2), rockR, rockR[0]); break;
    default: {   // flower meadow patch
      [[5, 6], [9, 8], [6, 11], [11, 12]].forEach(([x, y], j) => { const c = D[(i + j) % D.length]; px(x - 1, y, c); px(x + 1, y, c); px(x, y - 1, c); px(x, y, shade(D[1], 0.2)); px(x, y + 1, G[2]); });
    }
  }
}

/** Paint aseprite/tiles/<theme>.aseprite */
export function paintTiles(theme) {
  const M = material(theme);
  const L = Object.fromEntries(LAYERS.map((n) => [n, new Img(S.w, S.h)]));
  for (let m = 0; m < 16; m++) {
    paintGround(M, L.ground, S.ground.x + (m & 3) * T, S.ground.y + (m >> 2) * T, m);
    paintPath(M, L.path, S.path.x + (m & 3) * T, S.path.y + (m >> 2) * T, m);
  }
  for (let v = 0; v < S.fills.n; v++) paintGround(M, L.ground, S.fills.x + v * T, S.fills.y, 15, v + 1);
  for (let v = 0; v < S.pathFills.n; v++) paintPath(M, L.path, S.pathFills.x + v * T, S.pathFills.y, 15, v + 1);
  for (let k = 0; k < S.decor.n; k++) paintDecor(M, L.decor, k);
  const frames = [];
  for (let f = 0; f < FRAMES; f++) {
    const liquid = new Img(S.w, S.h), foam = new Img(S.w, S.h);
    paintLiquid(M, liquid, f);
    for (let m = 0; m < 16; m++) paintFoam(M, foam, S.foam.x + (m & 3) * T, S.foam.y + (m >> 2) * T, m, f);
    frames.push({ duration: M.liquid === "lava" || M.liquid === "murk" || M.liquid === "blood" ? 0.18 : 0.13,
      cels: { liquid: liquid.d, foam: foam.d, ground: L.ground.d, path: L.path.d, decor: L.decor.d } });
  }
  const out = path.join(SRC_DIR, "tiles", `${theme}.aseprite`);
  writeAse(out, { w: S.w, h: S.h, layers: LAYERS, frames, tags: [{ name: "down-idle", from: 0, to: FRAMES - 1 }] });
  console.log(`aseprite/tiles/${theme}.aseprite  ${S.w}×${S.h}, ${FRAMES} frames (${M.surface} / ${M.liquid})`);
}

export function tileSubjects() {
  return Object.fromEntries(TILE_THEMES.map((t) => [`tiles/${t}`, () => paintTiles(t)]));
}
