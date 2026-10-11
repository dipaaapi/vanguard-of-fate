// ==================== TILE STYLE ====================
// The look of the terrain tile sets (aseprite/tiles/<theme>.aseprite, tools/aseprite/paint/tiles.mjs),
// shared by everything that stands on them: monsters, mercenaries, summons and the safe-zone / guild art.
//
//   - colour ramps in HSL: shadows drift toward blue-violet and gain saturation, highlights drift toward
//     warm yellow and lose a little (tileShade, the same formula the tile painter uses)
//   - a crisp 1 px outline that is a deep, hue-shifted version of the colour it wraps (never black),
//     deepest under the figure so it sits on the ground like the tiles' cliff lips
//   - light from the upper left: a lit rim on edges facing the sky, a shaded band on the lower right,
//     a darker foot row (contact shade)
//   - a soft value-noise grain on large areas (the tiles' grass/stone texture), anchored to each colour
//     region so it moves with the body instead of swimming between frames
//
// Pure functions on colours and on a Pix buffer (js/avatar/avatar.js), no DOM, so the Node tools
// (tools/aseprite/*) use the very same code as the game.

const HEX = new Map();
export const hexRgb = (h) => {
  let v = HEX.get(h);
  if (!v) { v = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; HEX.set(h, v); }
  return v;
};
export const rgbHex = ([r, g, b]) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

export function toHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
export function fromHsl([h, s, l]) {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
/** Shade an [r,g,b] colour like the tile sets: k < 0 darker (toward blue-violet, more saturated), k > 0 lighter (toward warm yellow). */
export function tileShade(c, k) {
  const [h, s, l] = toHsl(c);
  const toward = k < 0 ? 245 : 55, dh = ((toward - h + 540) % 360) - 180;
  return fromHsl([h + dh * Math.min(0.35, Math.abs(k) * 0.5), s * (k < 0 ? 1 + 0.25 * -k : 1 - 0.15 * k), l + k * (k < 0 ? l : 1 - l) * 0.9]);
}
/**
 * Bring a colour into the tile sets' range: richer saturation on dull mid-tones (the code art leans grey,
 * the tiles are vivid), a touch more contrast, near-greys kept neutral-cool so bone, steel and stone
 * still read as such.
 */
export function tileGrade(c) {
  const [h, s, l] = toHsl(c);
  const s2 = s < 0.05 ? s + 0.04 : Math.min(1, s * 1.22 + 0.06 * (1 - s));
  const l2 = 0.5 + (l - 0.5) * 1.1;
  return fromHsl([s < 0.05 ? 225 : h, s2, l2]);
}

const memo = new Map();
const cached = (key, fn) => { let v = memo.get(key); if (v === undefined) { v = fn(); memo.set(key, v); } return v; };
/** Hex versions, cached (frames reuse a handful of colours). */
export const gradeHex = (hex) => cached("g" + hex, () => rgbHex(tileGrade(hexRgb(hex))));
export const shadeHex = (hex, k) => cached(hex + k, () => rgbHex(tileShade(hexRgb(hex), k)));
/** Outline colour for a colour: its deep tile shade; pale low-saturation colours (bone, steel, cloth) go cool, not rust. */
export const inkHex = (hex, k) => cached("i" + hex + k, () => {
  const c = hexRgb(hex), [, s, l] = toHsl(c);
  return rgbHex(tileShade(s < 0.3 && l > 0.55 ? fromHsl([228, 0.18, l]) : c, k));
});

// value noise (same hash as the tile painter)
function h2(x, y, s) {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1103515245);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y, cell, s) {
  const gx = Math.floor(x / cell), gy = Math.floor(y / cell), fx = x / cell - gx, fy = y / cell - gy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return (h2(gx, gy, s) * (1 - sx) + h2(gx + 1, gy, s) * sx) * (1 - sy) + (h2(gx, gy + 1, s) * (1 - sx) + h2(gx + 1, gy + 1, s) * sx) * sy;
}

/**
 * Restyle a flat-coloured Pix (after the parts are drawn, instead of detail() + outline()):
 * grade → volume and texture → lit rim → hue-shifted outline. `opts.outline = false` skips the outline
 * (art that already has one), `opts.grade = false` keeps the colours as drawn, `opts.light = false` keeps
 * the shading as drawn (painted art), `opts.grain = false` leaves flat areas flat.
 */
export function tileStyle(p, opts = {}) {
  const { w, h } = p, src = p.d.slice();
  const grade = opts.grade !== false, light = opts.light !== false, grain = opts.grain !== false;
  const base = src.map((c) => (c && grade ? gradeHex(c) : c));
  // depth = distance to the silhouette edge (1 = edge), up to 6
  const dist = new Int8Array(w * h).fill(-1), q = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!src[i]) continue;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !src[i - 1] || !src[i + 1] || !src[i - w] || !src[i + w]) { dist[i] = 1; q.push(i); }
  }
  for (let k = 0; k < q.length; k++) {
    const i = q[k], x = i % w, y = (i - x) / w, d = dist[i];
    if (d >= 6) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, j = ny * w + nx;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || !src[j] || dist[j] !== -1) continue;
      dist[j] = d + 1; q.push(j);
    }
  }
  const D = (x, y) => (x < 0 || y < 0 || x >= w || y >= h || dist[y * w + x] < 0 ? 0 : dist[y * w + x]);
  const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? src[y * w + x] : null);
  // per-colour pixel count and top-left corner, so texture follows each region as it moves
  const count = new Map(), corner = new Map();
  let bottom = 0;
  src.forEach((c, i) => {
    if (!c) return;
    count.set(c, (count.get(c) || 0) + 1);
    const x = i % w, y = (i - x) / w, k = corner.get(c);
    if (!k) corner.set(c, [x, y]); else { if (x < k[0]) k[0] = x; }
    if (y > bottom) bottom = y;
  });
  const B = [[0, 2], [3, 1]];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, c0 = src[i];
    if (!c0) continue;
    const c = base[i], n = count.get(c0);
    if (n < 4) { p.d[i] = c; continue; }               // eyes, studs, gems: keep their colour
    const up = !at(x, y - 1), left = !at(x - 1, y), down = !at(x, y + 1), right = !at(x + 1, y);
    let k = 0;
    if (!light) {
      if (grain && n >= 10 && dist[i] >= 2) {
        const [cx, cy] = corner.get(c0), g = vnoise(x - cx, y - cy, 3, n) * 0.7 + h2(x - cx, y - cy, n) * 0.3;
        if (g > 0.78) k = 0.08; else if (g < 0.2) k = -0.1;
      }
    } else if (dist[i] === 1) {
      // lit rim facing the sky / the light, shaded rim facing the ground
      if (up && !down) k = left ? 0.34 : 0.24;
      else if (left && !right && !down) k = 0.14;
      else if (down && !up) k = -0.36;
      else if (right && !left) k = -0.22;
    } else {
      const gx = D(x + 1, y) - D(x - 1, y), gy = D(x, y + 1) - D(x, y - 1);
      const lum = -(gx * 0.6 + gy * 0.8) / 2;           // > 0 = slope facing the upper-left light
      const t = (B[y & 1][x & 1] + 0.5) / 4 * 0.45;
      if (lum > 0.2 + t) k = 0.16;
      else if (lum < -0.2 - t) k = -0.24;
      if (grain && n >= 10 && dist[i] >= 2) {           // grain, like the tiles' surface noise
        const [cx, cy] = corner.get(c0), g = vnoise(x - cx, y - cy, 3, n) * 0.7 + h2(x - cx, y - cy, n) * 0.3;
        if (g > 0.74) k += 0.1; else if (g < 0.24) k -= 0.12;
      }
    }
    if (light && y >= bottom - 1 && !up) k -= 0.14;     // contact shade at the feet
    p.d[i] = k ? shadeHex(c, Math.max(-0.6, Math.min(0.45, k))) : c;
  }
  if (opts.outline === false) return p;
  // outline: a deep hue-shifted version of the colour it wraps (4-neighbour, like the tile edges)
  const lit = p.d.slice();
  const L = (x, y) => (x >= 0 && y >= 0 && x < w && y < h && src[y * w + x] ? base[y * w + x] : null);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (lit[y * w + x]) continue;
    const above = L(x, y - 1), n = above || L(x, y + 1) || L(x - 1, y) || L(x + 1, y);
    if (n) p.d[y * w + x] = inkHex(n, above && !L(x, y + 1) ? -0.8 : -0.68);
  }
  return p;
}
