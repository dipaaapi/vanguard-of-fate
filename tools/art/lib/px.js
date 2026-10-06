// ==================== PIXEL PAINTER ====================
// Small pixel-art painting toolkit for the procedural scene art in tools/art/scenes/.
// Everything is drawn into one RGBA buffer at native game resolution (480×270 for scenes),
// then written to a canvas and upscaled with nearest-neighbour by the renderer.
//
// Colours are [r, g, b] arrays (use hex("#rrggbb")). Transitions use a 4×4 Bayer matrix so
// gradients, glows and fog read as hand-dithered pixel art instead of smooth airbrush.

export const hex = (h) => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mixC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const shadeC = (c, k) => (k >= 0 ? mixC(c, [255, 255, 255], k) : mixC(c, [0, 0, 0], -k));
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (x, y) => BAYER[((y & 3) << 2) | (x & 3)];
/** true when the dithered pixel at (x, y) should take the "after" colour for coverage t (0–1) */
export const dith = (x, y, t) => t > bayer(x, y);

// ── Seeded randomness and noise ───────────────────────────────────────────────

export function rng(seed) {
  let a = seed >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (a, b) => a + r() * (b - a);
  r.int = (a, b) => Math.floor(a + r() * (b - a + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  return r;
}

function hash2(x, y, s) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function noise2(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = smooth(x - xi), yf = smooth(y - yi);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return lerp(lerp(a, b, xf), lerp(c, d, xf), yf);
}
export function fbm(x, y, s = 0, oct = 4) {
  let v = 0, amp = 0.5, f = 1, tot = 0;
  for (let i = 0; i < oct; i++) { v += noise2(x * f, y * f, s + i * 17) * amp; tot += amp; amp *= 0.5; f *= 2; }
  return v / tot;
}
export const noise1 = (x, s = 0) => noise2(x, 0.5, s);
export const fbm1 = (x, s = 0, oct = 4) => fbm(x, 0.5, s, oct);

// ── The canvas buffer ─────────────────────────────────────────────────────────

export class Px {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
  }

  inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }

  get(x, y) {
    x |= 0; y |= 0;
    if (!this.inside(x, y)) return [0, 0, 0];
    const i = (y * this.w + x) * 4;
    return [this.d[i], this.d[i + 1], this.d[i + 2]];
  }
  alpha(x, y) { x |= 0; y |= 0; return this.inside(x, y) ? this.d[(y * this.w + x) * 4 + 3] : 0; }

  /** Plot one pixel; a < 1 blends over what is there */
  set(x, y, c, a = 1) {
    x |= 0; y |= 0;
    if (!this.inside(x, y) || a <= 0) return;
    const i = (y * this.w + x) * 4, d = this.d;
    if (a >= 1) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; return; }
    d[i] += (c[0] - d[i]) * a; d[i + 1] += (c[1] - d[i + 1]) * a; d[i + 2] += (c[2] - d[i + 2]) * a;
    d[i + 3] = Math.max(d[i + 3], a * 255);
  }
  /** Plot with dithered coverage instead of blending (keeps a hard pixel palette) */
  dset(x, y, c, t) { if (dith(x | 0, y | 0, t)) this.set(x, y, c); }
  add(x, y, c, k) {
    x |= 0; y |= 0;
    if (!this.inside(x, y) || k <= 0) return;
    const i = (y * this.w + x) * 4, d = this.d;
    d[i] += c[0] * k; d[i + 1] += c[1] * k; d[i + 2] += c[2] * k; d[i + 3] = 255;
  }

  fill(c) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.set(x, y, c); }
  rect(x, y, w, h, c, a = 1) {
    for (let j = Math.max(0, y | 0); j < Math.min(this.h, (y + h) | 0); j++)
      for (let i = Math.max(0, x | 0); i < Math.min(this.w, (x + w) | 0); i++) this.set(i, j, c, a);
  }
  /** Rect with a per-pixel colour function f(x, y) → colour | null */
  rectF(x, y, w, h, f) {
    for (let j = Math.max(0, y | 0); j < Math.min(this.h, (y + h) | 0); j++)
      for (let i = Math.max(0, x | 0); i < Math.min(this.w, (x + w) | 0); i++) { const c = f(i, j); if (c) this.set(i, j, c); }
  }
  hline(x0, x1, y, c) { for (let x = Math.min(x0, x1) | 0; x <= Math.max(x0, x1); x++) this.set(x, y, c); }
  vline(x, y0, y1, c) { for (let y = Math.min(y0, y1) | 0; y <= Math.max(y0, y1); y++) this.set(x, y, c); }

  line(x0, y0, x1, y1, c, a = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c, a);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  thick(x0, y0, x1, y1, w, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.disc(lerp(x0, x1, i / n), lerp(y0, y1, i / n), w / 2, c);
  }

  disc(cx, cy, r, c, a = 1) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) this.set(x, y, c, a);
      }
  }
  ellipse(cx, cy, rx, ry, c, a = 1) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c, a);
      }
  }
  ring(cx, cy, rx, ry, c, th = 1) {
    const steps = Math.ceil(Math.max(rx, ry) * 8);
    for (let k = 0; k < th; k++)
      for (let i = 0; i < steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        this.set(Math.round(cx + Math.cos(t) * (rx - k)), Math.round(cy + Math.sin(t) * (ry - k * (ry / rx))), c);
      }
  }

  /** Filled polygon (even-odd); c may be a colour or f(x, y) → colour | null */
  poly(pts, c) {
    let minY = Infinity, maxY = -Infinity;
    for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(this.h - 1, Math.ceil(maxY)); y++) {
      const xs = [];
      const yc = y + 0.5;
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
        if ((y0 <= yc && y1 > yc) || (y1 <= yc && y0 > yc)) xs.push(x0 + ((yc - y0) / (y1 - y0)) * (x1 - x0));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.max(0, Math.round(xs[k])); x < Math.min(this.w, Math.round(xs[k + 1])); x++) {
          const col = typeof c === "function" ? c(x, y) : c;
          if (col) this.set(x, y, col);
        }
    }
  }

  /** Vertical gradient through colour stops [[t, colour], …], dithered between neighbouring stops */
  vgrad(x, y, w, h, stops, steps = 2) {
    for (let j = 0; j < h; j++) {
      const t = h <= 1 ? 0 : j / (h - 1);
      for (let i = 0; i < w; i++) this.set(x + i, y + j, rampAt(stops, t, x + i, y + j, steps));
    }
  }

  /** Additive dithered glow: bright core fading out with dithering */
  glow(cx, cy, r, c, k = 1, falloff = 2) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
        if (d >= 1) continue;
        const t = Math.pow(1 - d, falloff) * k;
        // quantise into bands so the glow stays crisp, dither the band edges
        const band = Math.floor(t * 4 + bayer(x, y)) / 4;
        if (band > 0) this.add(x, y, c, band * 0.8);
      }
  }
  /** Soft tinted wash over an ellipse (used for fog, light pools) */
  wash(cx, cy, rx, ry, c, k = 0.5) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        const d = dx * dx + dy * dy;
        if (d >= 1) continue;
        const t = (1 - d) * k;
        const band = Math.floor(t * 5 + bayer(x, y)) / 5;
        if (band > 0) this.set(x, y, c, Math.min(1, band));
      }
  }

  /** Draw another Px or canvas-like {width,height,getContext} at (x, y); flip mirrors horizontally */
  blit(src, x, y, { flip = false, tint = null, tintK = 0, alpha = 1, scale = 1 } = {}) {
    const sw = src.w ?? src.width, sh = src.h ?? src.height;
    const sd = src.d ?? src.getContext("2d").getImageData(0, 0, sw, sh).data;
    for (let j = 0; j < sh * scale; j++)
      for (let i = 0; i < sw * scale; i++) {
        const sx = Math.floor(i / scale), sy = Math.floor(j / scale);
        const si = (sy * sw + (flip ? sw - 1 - sx : sx)) * 4;
        if (sd[si + 3] < 128) continue;
        let c = [sd[si], sd[si + 1], sd[si + 2]];
        if (tint) c = mixC(c, tint, tintK);
        this.set(x + i, y + j, c, alpha);
      }
  }

  /** Silhouette of a sprite in one colour (for shadows, backlit figures) */
  silhouette(src, x, y, c, { flip = false, scale = 1 } = {}) {
    const sw = src.w ?? src.width, sh = src.h ?? src.height;
    const sd = src.d ?? src.getContext("2d").getImageData(0, 0, sw, sh).data;
    for (let j = 0; j < sh * scale; j++)
      for (let i = 0; i < sw * scale; i++) {
        const sx = Math.floor(i / scale), sy = Math.floor(j / scale);
        if (sd[(sy * sw + (flip ? sw - 1 - sx : sx)) * 4 + 3] >= 128) this.set(x + i, y + j, c);
      }
  }

  /** Multiply every pixel in a rect by a colour (lighting pass) */
  tint(x, y, w, h, c, k) {
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) {
        const o = (j * this.w + i) * 4, d = this.d;
        d[o] = lerp(d[o], (d[o] * c[0]) / 255, k); d[o + 1] = lerp(d[o + 1], (d[o + 1] * c[1]) / 255, k); d[o + 2] = lerp(d[o + 2], (d[o + 2] * c[2]) / 255, k);
      }
  }

  /** Dark frame round the edges, dithered */
  vignette(c = [4, 4, 10], k = 0.55, inner = 0.55) {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const dx = (x / this.w - 0.5) * 2, dy = (y / this.h - 0.5) * 2;
        const d = Math.sqrt(dx * dx * 0.8 + dy * dy);
        const t = clamp((d - inner) / (1.42 - inner)) * k;
        const band = Math.floor(t * 4 + bayer(x, y)) / 4;
        if (band > 0) this.set(x, y, c, band);
      }
  }

  /** Snap every pixel to the nearest colour of a palette (keeps scenes coherent) */
  quantize(pal) {
    const d = this.d;
    for (let i = 0; i < d.length; i += 4) {
      let best = 0, bd = Infinity;
      for (let k = 0; k < pal.length; k++) {
        const p = pal[k];
        const dr = d[i] - p[0], dg = d[i + 1] - p[1], db = d[i + 2] - p[2];
        const dist = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
        if (dist < bd) { bd = dist; best = k; }
      }
      d[i] = pal[best][0]; d[i + 1] = pal[best][1]; d[i + 2] = pal[best][2];
    }
  }

  toCanvas(scale = 1) {
    const c = document.createElement("canvas");
    c.width = this.w; c.height = this.h;
    const img = new ImageData(new Uint8ClampedArray(this.d), this.w, this.h);
    c.getContext("2d").putImageData(img, 0, 0);
    if (scale === 1) return c;
    const big = document.createElement("canvas");
    big.width = this.w * scale; big.height = this.h * scale;
    const g = big.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(c, 0, 0, big.width, big.height);
    return big;
  }
}

/** Colour of a stop ramp at t, dithered between the two neighbouring stops */
export function rampAt(stops, t, x, y, steps = 2) {
  t = clamp(t);
  for (let k = 0; k < stops.length - 1; k++) {
    const [t0, c0] = stops[k], [t1, c1] = stops[k + 1];
    if (t <= t1) {
      const f = (t - t0) / Math.max(1e-6, t1 - t0);
      // Bands of flat colour (steps in-between shades per stop pair); only the seam between
      // two bands is dithered, like hand-made pixel-art gradients
      const s = f * (steps + 1);
      const b = Math.floor(s);
      const frac = clamp((s - b - 0.5) * 2.2 + 0.5);
      const band = Math.min(steps + 1, b + (dith(x, y, frac) ? 1 : 0));
      return mixC(c0, c1, band / (steps + 1));
    }
  }
  return stops[stops.length - 1][1];
}
