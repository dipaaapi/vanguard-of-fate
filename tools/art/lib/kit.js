// ==================== SCENE KIT ====================
// Reusable landscape and prop painters built on px.js: skies, celestial bodies, clouds, ridges,
// water, castles, trees, rune circles, light beams, particles and sprite placement.
// Scenes in tools/art/scenes/ compose these; keep new shared pieces here, not in a scene.
import { Px, hex, mixC, shadeC, clamp, lerp, smooth, dith, bayer, rng, noise1, noise2, fbm, fbm1, rampAt } from "./px.js";

export { Px, hex, mixC, shadeC, clamp, lerp, smooth, dith, bayer, rng, noise1, noise2, fbm, fbm1, rampAt };

// ── Sky ──────────────────────────────────────────────────────────────────────

export function sky(P, stops, y0 = 0, y1 = P.h, steps = 2) {
  P.vgrad(0, y0, P.w, y1 - y0, stops, steps);
}

export function stars(P, r, n, { x0 = 0, y0 = 0, x1 = P.w, y1 = P.h * 0.6, colors = ["#ffffff", "#c7d2fe", "#fde68a"], big = 0.06 } = {}) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r.range(x0, x1)), y = Math.floor(r.range(y0, y1));
    const c = hex(r.pick(colors));
    const k = r.range(0.35, 1);
    P.set(x, y, c, k);
    if (r.chance(big)) { P.set(x - 1, y, c, k * 0.5); P.set(x + 1, y, c, k * 0.5); P.set(x, y - 1, c, k * 0.5); P.set(x, y + 1, c, k * 0.5); }
  }
}

/** Black sun with a burning corona (the Eclipse of the Abyss) */
export function eclipse(P, cx, cy, r, { corona = "#c084fc", rim = "#fde68a", core = "#05030a", k = 1 } = {}) {
  P.glow(cx, cy, r * 4.2, hex(corona), 0.55 * k, 1.6);
  P.glow(cx, cy, r * 2.0, hex(rim), 0.6 * k, 2.2);
  // corona streamers
  const R = rng(Math.round(cx * 7 + cy));
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + R.range(-0.1, 0.1);
    const len = r * R.range(1.25, 2.1);
    for (let d = r; d < len; d += 0.5) {
      const t = (d - r) / (len - r);
      P.add(cx + Math.cos(a) * d, cy + Math.sin(a) * d, hex(rim), (1 - t) * 0.45 * k);
    }
  }
  P.disc(cx, cy, r + 1, mixC(hex(rim), [255, 255, 255], 0.5));
  P.disc(cx, cy, r, hex(core));
  // diamond-ring glint
  P.glow(cx + r * 0.68, cy - r * 0.72, r * 0.9, [255, 255, 255], 0.9 * k, 2.5);
}

export function moon(P, cx, cy, r, { c = "#f1f5f9", shadow = 0.55, glowC = "#93c5fd" } = {}) {
  P.glow(cx, cy, r * 3.5, hex(glowC), 0.35, 1.8);
  const base = hex(c);
  P.disc(cx, cy, r, base);
  // crescent: cut with a dark offset disc of the sky colour behind
  for (let y = Math.floor(cy - r); y <= cy + r; y++)
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d > r) continue;
      const crater = noise2(x * 0.35, y * 0.35, 9) > 0.62;
      if (crater) P.set(x, y, shadeC(base, -0.12));
      const ds = Math.hypot(x + 0.5 - (cx - r * shadow), y + 0.5 - (cy - r * 0.15));
      if (ds < r * 0.95) P.set(x, y, shadeC(base, -0.55), 0.85);
    }
}

export function sun(P, cx, cy, r, { c = "#fff7d6", glowC = "#fbbf24", k = 1 } = {}) {
  P.glow(cx, cy, r * 6, hex(glowC), 0.7 * k, 1.4);
  P.glow(cx, cy, r * 2.4, hex(c), 0.9 * k, 2);
  P.disc(cx, cy, r, hex(c));
}

/** Banded fbm clouds; colors = [shadow, mid, lit] */
export function clouds(P, { y0 = 0, y1 = P.h * 0.5, scale = 0.018, cover = 0.52, seed = 1, colors = ["#3b2a5a", "#5b3f86", "#8b6cc2"], stretch = 3, alpha = 1, light = -1 } = {}) {
  const C = colors.map(hex);
  for (let y = Math.floor(y0); y < y1; y++)
    for (let x = 0; x < P.w; x++) {
      const v = fbm(x * scale, y * scale * stretch, seed, 5);
      const edge = clamp((y - y0) / 12) * clamp((y1 - y) / 12);
      const t = (v - cover) * 4 * edge;
      if (t <= 0 || !dith(x, y, clamp(t * 3))) continue;
      // light from above: compare with the density a few pixels up
      const vu = fbm(x * scale, (y + light * 3) * scale * stretch, seed, 5);
      const lit = vu < v - 0.012 ? 2 : vu < v + 0.01 ? 1 : 0;
      P.set(x, y, C[Math.min(C.length - 1, lit)], alpha);
    }
}

// ── Terrain ──────────────────────────────────────────────────────────────────

/** Ridge line y(x) from fbm; returns the height function so props can sit on it */
export function ridgeFn({ base, amp, freq = 0.01, seed = 1, oct = 4, sharp = 0 }) {
  return (x) => {
    let v = clamp((fbm1(x * freq, seed, oct) - 0.28) / 0.44);
    if (sharp) v = lerp(v, 1 - Math.abs(v * 2 - 1), sharp);
    return base - v * amp;
  };
}

/** Fill everything under a ridge; colour may be a function (x, y, top) */
export function ridge(P, fn, color, { light = null, lightSide = 1, snow = null, snowLine = 0, rim = null } = {}) {
  const C = typeof color === "function" ? null : hex(color);
  const L = light && hex(light), S = snow && hex(snow), Rm = rim && hex(rim);
  for (let x = 0; x < P.w; x++) {
    const top = Math.round(fn(x));
    const slope = fn(x + lightSide) - fn(x - lightSide);
    for (let y = Math.max(0, top); y < P.h; y++) {
      let c = C ? C : color(x, y, top);
      if (!c) continue;
      if (L && slope < -0.25 && y - top < 40 && dith(x, y, clamp(-slope * 0.8) * (1 - (y - top) / 40))) c = L;
      if (S && top < snowLine && y < snowLine + (snowLine - top) * 0.15 && y - top < 10 + noise2(x * 0.3, y * 0.3, 3) * 10) c = S;
      P.set(x, y, c);
    }
    if (Rm && top >= 0) P.set(x, top, Rm);
  }
}

/** Thin dithered fog band */
export function fogBand(P, y, h, c, k = 0.5, seed = 3) {
  const C = hex(c);
  for (let j = Math.floor(y - h); j < y + h; j++)
    for (let x = 0; x < P.w; x++) {
      const t = (1 - Math.abs(j - y) / h) * k * (0.6 + fbm(x * 0.02, j * 0.08, seed, 3) * 0.8);
      if (dith(x, j, clamp(t))) P.set(x, j, C);
    }
}

// ── Water and lava ───────────────────────────────────────────────────────────

export function water(P, y0, y1, { deep = "#0b2440", mid = "#14466b", light = "#3b82b8", foam = "#cfe8ff", seed = 5, reflect = null, reflectX = 0, reflectW = 0 } = {}) {
  const D = hex(deep), M = hex(mid), L = hex(light), F = hex(foam);
  const Rf = reflect && hex(reflect);
  for (let y = Math.floor(y0); y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0);   // 0 far → 1 near
    for (let x = 0; x < P.w; x++) {
      const wave = Math.sin(x * (0.18 - t * 0.12) + y * 0.9 + fbm(x * 0.03, y * 0.2, seed, 2) * 6);
      let c = rampAt([[0, D], [0.55, M], [1, M]], t * 0.6 + 0.4 * (wave * 0.5 + 0.5) * t, x, y);
      if (wave > 0.86 - t * 0.08) c = L;
      if (wave > 0.97 && noise2(x * 0.2, y * 0.5, seed) > 0.5) c = F;
      if (Rf && Math.abs(x - reflectX) < reflectW * (0.4 + t) && wave > 0.2 && dith(x, y, 0.7 - t * 0.4)) c = Rf;
      P.set(x, y, c);
    }
  }
}

export function lavaFlow(P, pts, w, { hot = "#fff1a8", mid = "#fb923c", dark = "#b91c1c", crust = "#2a0e0a" } = {}) {
  const H = hex(hot), M = hex(mid), D = hex(dark), C = hex(crust);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let k = 0; k <= n; k++) {
      const x = lerp(x0, x1, k / n), y = lerp(y0, y1, k / n);
      const ww = w * lerp(0.6, 1, (y - pts[0][1]) / Math.max(1, pts[pts.length - 1][1] - pts[0][1]));
      for (let dx = -ww; dx <= ww; dx++) {
        const px = Math.round(x + dx), py = Math.round(y);
        const e = Math.abs(dx) / ww;
        const v = fbm(px * 0.15, py * 0.15, 77, 3);
        const c = e > 0.85 ? C : v > 0.62 ? H : v > 0.42 ? M : D;
        P.set(px, py, c);
      }
    }
  }
}

// ── Architecture ─────────────────────────────────────────────────────────────

/**
 * Castle silhouette with towers, crenellations, lit windows and banners.
 * style: "imperial" (white ashlar, red/gold banners) or "obsidian" (black basalt, red glow)
 */
export function castle(P, cx, ground, { scale = 1, style = "imperial", seed = 3, lightSide = -1, glow = null } = {}) {
  const R = rng(seed);
  const pal = style === "obsidian"
    ? { wall: hex("#1a1420"), lit: hex("#2e2235"), dark: hex("#0b080f"), roof: hex("#120c16"), roofLit: hex("#3a1d2a"), win: hex("#ff4d2e"), banner: hex("#7f1d1d"), trim: hex("#5b1a1a") }
    : { wall: hex("#d9d4c7"), lit: hex("#f4f1e8"), dark: hex("#9c9585"), roof: hex("#3b4f8a"), roofLit: hex("#5a72b8"), win: hex("#ffd27a"), banner: hex("#b91c1c"), trim: hex("#e0b84a") };
  const s = scale;
  const block = (x, y, w, h, roofType) => {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const side = lightSide < 0 ? i < w * 0.35 : i > w * 0.65;
        const brick = ((j % 4 === 3) || ((i + (Math.floor(j / 4) % 2) * 3) % 6 === 0)) && dith(x + i, y + j, 0.5);
        let c = side ? pal.lit : i === (lightSide < 0 ? w - 1 : 0) ? pal.dark : pal.wall;
        if (brick) c = shadeC(c, -0.12);
        P.set(x + i, y + j, c);
      }
    if (roofType === "cren") {
      for (let i = 0; i < w; i += 3) P.rect(x + i, y - 2, 2, 2, pal.wall);
    } else if (roofType === "cone") {
      const rh = Math.round(w * 1.15);
      for (let j = 0; j < rh; j++) {
        const half = (w / 2 + 1) * (j / rh);
        for (let i = -half; i <= half; i++) {
          const c = (lightSide < 0 ? i < 0 : i > 0) ? pal.roofLit : pal.roof;
          P.set(Math.round(x + w / 2 + i - 0.5), y - rh + j, c);
        }
      }
      P.vline(Math.round(x + w / 2 - 0.5), y - rh - 3, y - rh, pal.trim);
      if (R.chance(0.7)) flag(P, Math.round(x + w / 2 - 0.5), y - rh - 3, pal.banner, R);
    }
    // windows
    const rows = Math.max(1, Math.floor(h / (9 * s)));
    for (let k = 0; k < rows; k++) {
      const wy = y + 4 + k * Math.round(9 * s);
      if (wy + 3 > y + h - 2) break;
      const cols = Math.max(1, Math.floor(w / (6 * s)));
      for (let q = 0; q < cols; q++) {
        if (!R.chance(0.65)) continue;
        const wx = Math.round(x + (w / cols) * (q + 0.5)) - 1;
        P.rect(wx, wy, 1, 2, R.chance(0.75) ? pal.win : pal.dark);
        P.set(wx, wy - 1, pal.dark);
        if (glow) P.glow(wx + 0.5, wy + 1, 3, pal.win, 0.25, 2);
      }
    }
  };
  const W = 120 * s;
  const H = 46 * s;
  // curtain wall
  block(cx - W / 2, ground - H * 0.45, W, H * 0.45, "cren");
  // gate
  const gw = 10 * s, gh = 14 * s;
  P.rect(Math.round(cx - gw / 2), Math.round(ground - gh), Math.round(gw), Math.round(gh), pal.dark);
  P.disc(cx, ground - gh, gw / 2, pal.dark);
  // keep + towers
  block(cx - 22 * s, ground - H * 1.05, 44 * s, H * 0.6, "cren");
  block(cx - 9 * s, ground - H * 1.55, 18 * s, H * 0.55, "cone");
  for (const k of [-1, 1]) {
    block(cx + k * 30 * s - 6 * s, ground - H * 0.95, 12 * s, H * 0.95, "cone");
    block(cx + k * 56 * s - 7 * s, ground - H * 0.7, 14 * s, H * 0.7, "cone");
    block(cx + k * 16 * s - 5 * s, ground - H * 1.25, 10 * s, H * 0.25, "cone");
  }
  // long banners on the keep
  for (const k of [-1, 1]) {
    const bx = Math.round(cx + k * 12 * s), by = Math.round(ground - H * 0.98);
    for (let j = 0; j < Math.round(10 * s); j++) P.hline(bx - 1, bx + 1, by + j, j > 10 * s - 3 && j % 2 ? shadeC(pal.banner, -0.3) : pal.banner);
    P.set(bx, by + 2, pal.trim); P.set(bx, by + 3, pal.trim);
  }
  return { w: W, h: H * 1.55 };
}

export function flag(P, x, y, c, R) {
  const len = R ? R.int(3, 5) : 4;
  for (let i = 1; i <= len; i++) {
    const wave = Math.round(Math.sin(i * 1.3) * 0.6);
    P.set(x + i, y + wave, c); P.set(x + i, y + 1 + wave, shadeC(c, -0.25));
  }
}

/** Stone pillar / column, lit from the left */
export function pillar(P, x, top, bottom, w, { c = "#cbd5e1", dark = "#64748b", lit = "#f8fafc", cap = true } = {}) {
  const C = hex(c), D = hex(dark), L = hex(lit);
  for (let y = top; y < bottom; y++)
    for (let i = 0; i < w; i++) {
      const f = i / (w - 1);
      P.set(x + i, y, f < 0.25 ? L : f > 0.75 ? D : (i % 3 === 1 ? shadeC(C, -0.06) : C));
    }
  if (cap) { P.rect(x - 2, top - 3, w + 4, 3, L); P.hline(x - 2, x + w + 1, top - 1, D); P.rect(x - 2, bottom, w + 4, 3, C); P.hline(x - 2, x + w + 1, bottom + 2, D); }
}

/** Burning brazier on a stand */
export function brazier(P, x, ground, { flame = "#fb923c", hot = "#fde68a", metal = "#3f3a46", glowK = 0.8, spirit = false, size = 1.4 } = {}) {
  const M = hex(metal);
  P.vline(x, ground - 9, ground, M);
  P.hline(x - 2, x + 2, ground, M);
  P.rect(x - 3, ground - 11, 7, 2, M);
  P.hline(x - 4, x + 4, ground - 12, shadeC(M, 0.25));
  const F = hex(flame), Hh = hex(hot);
  P.glow(x + 0.5, ground - 15, 22, F, glowK * 0.7, 1.6);
  const shape = [[0, 7], [-1, 6], [1, 6], [-2, 5], [2, 5], [-3, 4], [-2, 4], [-1, 4], [0, 4], [1, 4], [2, 4], [3, 4]];
  const fh = Math.round(8 * size);
  for (let j = 0; j < fh; j++) {
    const half = Math.round(Math.sin((1 - j / fh) * Math.PI * 0.6) * 3.5 * size);
    const sway = j > fh * 0.5 ? Math.round(Math.sin(j * 0.9 + x) * 1) : 0;
    for (let i = -half; i <= half; i++) P.set(x + i + sway, ground - 13 - j, Math.abs(i) < half - 1 && j < fh * 0.7 ? Hh : F);
  }
  if (spirit) P.glow(x + 0.5, ground - 16, 6, [255, 255, 255], 0.5, 2);
  void shape;
}

// ── Vegetation and props ─────────────────────────────────────────────────────

export function pine(P, x, ground, h, { c = "#1f4d3a", lit = "#2f6b4c", dark = "#123126", trunk = "#3b2a1e", snow = null } = {}) {
  const C = hex(c), L = hex(lit), D = hex(dark), S = snow && hex(snow);
  P.vline(x, ground - 3, ground, hex(trunk));
  const tiers = Math.max(2, Math.round(h / 6));
  for (let k = 0; k < tiers; k++) {
    const ty = ground - 3 - (k * (h - 3)) / tiers;
    const th = (h - 3) / tiers + 3;
    const tw = (1 - k / tiers) * h * 0.38 + 2;
    for (let j = 0; j < th; j++) {
      const half = (j / th) * tw;
      for (let i = -Math.round(half); i <= Math.round(half); i++) {
        let col = i < -half * 0.3 ? L : i > half * 0.5 ? D : C;
        if (S && j < 2 + (k === tiers - 1 ? 2 : 0) && dith(x + i, ty, 0.7)) col = S;
        P.set(x + i, Math.round(ty - th + j), col);
      }
    }
  }
}

/** Round-canopy tree; leaves = [dark, mid, lit] */
export function oak(P, x, ground, r, { leaves = ["#14381f", "#22582f", "#3f8a3e"], trunk = "#4a3222", seed = 1, glowDots = null } = {}) {
  const Lv = leaves.map(hex), T = hex(trunk);
  P.rect(x - 1, ground - r * 1.2, 3, r * 1.2, T);
  P.set(x - 2, ground - 1, T); P.set(x + 2, ground - 1, T);
  const R = rng(seed);
  const blobs = [];
  for (let i = 0; i < 6; i++) blobs.push([x + R.range(-r * 0.7, r * 0.7), ground - r * 1.4 - R.range(-r * 0.3, r * 0.6), r * R.range(0.5, 0.75)]);
  for (const [bx, by, br] of blobs)
    for (let y = Math.floor(by - br); y <= by + br; y++)
      for (let xx = Math.floor(bx - br); xx <= bx + br; xx++) {
        const d = Math.hypot(xx - bx, y - by) / br;
        if (d > 1 || noise2(xx * 0.5, y * 0.5, seed) > 0.85) continue;
        const l = (xx - bx) / br * -0.6 + (y - by) / br * -0.8;
        P.set(xx, y, Lv[l > 0.35 ? 2 : l > -0.3 ? 1 : 0]);
      }
  if (glowDots) for (let i = 0; i < 5; i++) { const gx = x + R.range(-r, r), gy = ground - r * 1.5 + R.range(-r * 0.6, r * 0.6); P.glow(gx, gy, 3, hex(glowDots), 0.6, 2); P.set(gx, gy, hex(glowDots)); }
}

export function deadTree(P, x, ground, h, { c = "#1d1420", seed = 2 } = {}) {
  const C = hex(c), R = rng(seed);
  const branch = (bx, by, ang, len, w) => {
    if (len < 2) return;
    const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
    P.thick(bx, by, ex, ey, w, C);
    branch(ex, ey, ang + R.range(-0.7, -0.2), len * R.range(0.55, 0.75), Math.max(1, w * 0.65));
    if (R.chance(0.75)) branch(ex, ey, ang + R.range(0.2, 0.7), len * R.range(0.5, 0.7), Math.max(1, w * 0.6));
  };
  branch(x, ground, -Math.PI / 2 + R.range(-0.1, 0.1), h * 0.45, Math.max(2, h / 12));
}

export function rock(P, x, ground, w, h, { c = "#4b5563", lit = "#6b7280", dark = "#1f2937", seed = 4 } = {}) {
  const C = hex(c), L = hex(lit), D = hex(dark);
  for (let j = 0; j < h; j++) {
    const t = j / h;
    const half = (w / 2) * Math.sqrt(t) * (0.85 + noise2(j * 0.4, seed, seed) * 0.3);
    for (let i = -Math.round(half); i <= Math.round(half); i++) {
      const f = i / Math.max(1, half);
      P.set(x + i, ground - h + j, f < -0.35 && t < 0.8 ? L : f > 0.45 || t > 0.85 ? D : C);
    }
  }
}

export function grass(P, r, y0, y1, n, colors = ["#2f6b3a", "#4f9a4a", "#7cc35e"]) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r.range(0, P.w)), y = Math.floor(r.range(y0, y1));
    const c = hex(r.pick(colors));
    P.set(x, y, c); P.set(x, y - 1, c);
    if (r.chance(0.5)) P.set(x + 1, y - 1, c);
    if (r.chance(0.3)) P.set(x - 1, y - 2, c);
  }
}

export function crystal(P, x, ground, h, { c = "#22d3ee", lit = "#a5f3fc", dark = "#0e7490", glowK = 0.6 } = {}) {
  const C = hex(c), L = hex(lit), D = hex(dark);
  const w = Math.max(2, Math.round(h * 0.28));
  P.glow(x, ground - h / 2, h * 1.2, C, glowK, 1.8);
  for (let j = 0; j < h; j++) {
    const t = j / h;
    const half = t < 0.25 ? w * (t / 0.25) : w * (1 - (t - 0.25) * 0.4);
    for (let i = -Math.round(half); i <= Math.round(half); i++) P.set(x + i, ground - h + j, i < 0 ? L : i === 0 ? C : D);
  }
}

// ── Magic ────────────────────────────────────────────────────────────────────

/** Rune circle seen in perspective, with a pentagram and per-point coloured gems */
export function runeCircle(P, cx, cy, rx, ry, { c = "#67e8f9", pointColors = null, inverted = false, glowK = 0.8, rings = 2, runes = true, pillars = 0 } = {}) {
  const C = hex(c);
  P.wash(cx, cy, rx * 1.15, ry * 1.15, C, 0.25 * glowK);
  for (let k = 0; k < rings; k++) P.ring(cx, cy, rx - k * 5, ry - k * 5 * (ry / rx), C);
  // pentagram
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (inverted ? Math.PI : 0) + (i * Math.PI * 2) / 5;
    pts.push([cx + Math.cos(a) * (rx - 6), cy + Math.sin(a) * (ry - 6 * (ry / rx))]);
  }
  for (let i = 0; i < 5; i++) { const [a, b] = [pts[i], pts[(i + 2) % 5]]; P.line(a[0], a[1], b[0], b[1], C); }
  if (runes) {
    const R = rng(Math.round(cx + cy));
    const n = Math.round(rx * 0.9);
    for (let i = 0; i < n; i++) {
      if (!R.chance(0.55)) continue;
      const a = (i / n) * Math.PI * 2;
      const rr = rx - 2.5, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * (ry - 2.5 * (ry / rx));
      P.set(x, y, shadeC(C, 0.4));
      if (R.chance(0.5)) P.set(x + 1, y, C);
    }
  }
  if (pointColors) pts.forEach(([x, y], i) => {
    const pc = hex(pointColors[i]);
    P.wash(x, y, 18, 6, pc, 0.7);
    if (pillars) beam(P, x, y - pillars, y, 2, pointColors[i], 0.7);
    P.glow(x, y, 14, pc, 0.9, 1.6);
    P.ellipse(x, y, 3, 1.5, shadeC(pc, 0.2)); P.set(x, y, shadeC(pc, 0.7));
  });
  P.glow(cx, cy, rx * 0.9, C, 0.25 * glowK, 1.5);
  return pts;
}

/** Vertical beam of light from top to bottom */
export function beam(P, x, top, bottom, w, c = "#e0f2fe", k = 1) {
  const C = hex(c);
  for (let y = Math.floor(top); y < bottom; y++)
    for (let i = -w * 1.8; i <= w * 1.8; i++) {
      const f = Math.abs(i) / w;
      const t = f <= 1 ? 1 - f * 0.4 : (1.8 - f) / 0.8 * 0.5;
      if (t > 0 && dith(Math.round(x + i), y, t * k)) P.add(x + i, y, C, f <= 0.35 ? 0.9 : 0.4);
    }
}

/** God rays fanning out from a point */
export function rays(P, cx, cy, n, c, { len = 400, spread = Math.PI * 2, start = 0, k = 0.22, width = 0.05, seed = 8 } = {}) {
  const C = hex(c), R = rng(seed);
  const angs = Array.from({ length: n }, (_, i) => start + (i / n) * spread + R.range(-0.04, 0.04));
  for (let y = 0; y < P.h; y++)
    for (let x = 0; x < P.w; x++) {
      const a = Math.atan2(y - cy, x - cx), d = Math.hypot(x - cx, y - cy);
      if (d > len) continue;
      for (const g of angs) {
        let da = Math.abs(((a - g + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (da < width) { if (dith(x, y, (1 - da / width) * (1 - d / len) * k * 4)) P.add(x, y, C, 0.25); break; }
      }
    }
}

export function sparks(P, r, n, { x0 = 0, y0 = 0, x1 = P.w, y1 = P.h, colors = ["#fde68a", "#fb923c"], glowK = 0.35 } = {}) {
  for (let i = 0; i < n; i++) {
    const x = r.range(x0, x1), y = r.range(y0, y1), c = hex(r.pick(colors));
    P.set(x, y, c);
    if (glowK && r.chance(0.35)) P.glow(x + 0.5, y + 0.5, 3, c, glowK, 2);
  }
}

/** Swirling vortex (Maw of Damnation, portals) */
export function vortex(P, cx, cy, rx, ry, { colors = ["#12051f", "#3b0f5c", "#7e22ce", "#c084fc", "#f5d0fe"], arms = 4, twist = 3.2, seed = 6 } = {}) {
  const C = colors.map(hex);
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) continue;
      const a = Math.atan2(dy, dx);
      const s = Math.sin(a * arms + d * twist * Math.PI * 2 + fbm(x * 0.05, y * 0.05, seed, 2) * 3);
      const v = (s * 0.5 + 0.5) * (1 - d * 0.7) + (1 - d) * 0.4;
      const idx = clamp(v, 0, 0.999) * C.length;
      const lo = Math.floor(idx);
      const c = dith(x, y, idx - lo) && lo + 1 < C.length ? C[lo + 1] : C[lo];
      P.set(x, y, c, d > 0.9 ? 1 - (d - 0.9) * 10 : 1);
    }
}

// ── Characters ───────────────────────────────────────────────────────────────

/** Place a sprite frame standing on (x, ground), with a soft shadow; returns its top-left */
export function stand(P, frame, x, ground, { flip = false, shadow = true, scale = 1, tint = null, tintK = 0, sil = null } = {}) {
  const w = frame.width * scale, h = frame.height * scale;
  const left = Math.round(x - w / 2), top = Math.round(ground - h);
  if (shadow) P.ellipse(x, ground - 1, w * 0.32, 2 * scale, [0, 0, 0], 0.35);
  if (sil) P.silhouette(frame, left, top, hex(sil), { flip, scale });
  else P.blit(frame, left, top, { flip, tint: tint && hex(tint), tintK, scale });
  return [left, top];
}

/** Rim light: lights the outermost sprite pixels on one side (backlit figures) */
export function rimLight(P, frame, left, top, c, side = 1, scale = 1) {
  const C = hex(c);
  const sw = frame.width, sh = frame.height;
  const sd = frame.getContext("2d").getImageData(0, 0, sw, sh).data;
  const on = (x, y) => x >= 0 && y >= 0 && x < sw && y < sh && sd[(y * sw + x) * 4 + 3] >= 128;
  for (let y = 0; y < sh; y++)
    for (let x = 0; x < sw; x++)
      if (on(x, y) && !on(x + side, y)) for (let s = 0; s < scale; s++) for (let t = 0; t < scale; t++) P.set(left + x * scale + s, top + y * scale + t, C, 0.8);
}

// ── Ground textures (return a colour for ridge() fills) ──────────────────────

/**
 * Clustered ground texture: noise patches in 3–4 flat shades with a lit rim at the top edge,
 * darker with depth. pal = [rim, light, mid, dark, deep]. Avoids per-pixel checkerboards.
 */
export function groundTex(pal, { scale = 0.09, seed = 1, depth = 60, strokes = true } = {}) {
  const C = pal.map(hex);
  return (x, y, top) => {
    const d = y - top;
    if (d < 1) return C[0];
    const n = fbm(x * scale, y * scale * 2.2, seed, 3);
    const fall = clamp(d / depth);
    let v = n * 0.9 + 0.35 - fall * 0.75;
    if (strokes && noise2(x * 0.9, y * 0.35, seed + 5) > 0.82) v += 0.18;   // grass blades / grain
    const idx = v > 0.62 ? 1 : v > 0.42 ? 2 : v > 0.2 ? 3 : 4;
    return C[Math.min(C.length - 1, idx)];
  };
}

// Colours of the five points of the Pentagram Seal (LORE: Shield, Bow, Prayer, Star, Fist), clockwise from the top
export const DISCIPLINE = { shield: "#60a5fa", bow: "#4ade80", prayer: "#fde68a", star: "#c084fc", fist: "#f87171" };
export const POINT_COLORS = [DISCIPLINE.shield, DISCIPLINE.bow, DISCIPLINE.prayer, DISCIPLINE.star, DISCIPLINE.fist];

/** Stone floor in perspective: flagstone rows that shrink toward the horizon y0 */
export function flagstones(P, y0, y1, { c = "#3a3f55", lit = "#4a5070", dark = "#252838", seam = "#161826", vx = P.w / 2, seed = 2 } = {}) {
  const C = hex(c), L = hex(lit), D = hex(dark), Sm = hex(seam);
  for (let y = Math.floor(y0); y < y1; y++) {
    const t = (y - y0) / (y1 - y0);            // 0 far → 1 near
    const z = 1 / (0.15 + t);                  // depth
    const row = Math.floor(z * 2.2);
    const rowEdge = Math.floor((1 / (0.15 + (y + 1 - y0) / (y1 - y0))) * 2.2) !== row;
    for (let x = 0; x < P.w; x++) {
      const u = (x - vx) / (P.w * (0.25 + t * 0.75));   // perspective columns
      const col = Math.floor(u * 6 + row * 0.5);
      const colEdge = Math.floor(((x + 1 - vx) / (P.w * (0.25 + t * 0.75))) * 6 + row * 0.5) !== col;
      const n = noise2(col * 3.1, row * 7.7, seed);
      let cc = n > 0.66 ? L : n < 0.3 ? D : C;
      if (rowEdge || colEdge) cc = Sm;
      P.set(x, y, cc);
    }
  }
}

/** Marble statue of the goddess Astraea: robed, wings raised, holding a star */
export function goddessStatue(P, cx, base, h, { c = "#e7e2f2", lit = "#ffffff", dark = "#9a93b3", star = "#fde68a" } = {}) {
  const C = hex(c), L = hex(lit), D = hex(dark);
  const shade = (x, xc, w) => (x < xc - w * 0.3 ? L : x > xc + w * 0.35 ? D : C);
  // wings
  for (const s of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const len = h * (0.55 - k * 0.06);
      const x0 = cx + s * h * 0.1, y0 = base - h * 0.72 + k * 2;
      for (let i = 0; i < len; i++) {
        const x = x0 + s * i, y = y0 - Math.sin((i / len) * Math.PI * 0.9) * h * 0.28 + i * 0.12;
        P.vline(Math.round(x), Math.round(y), Math.round(y + 3 + k * 0.6), k % 2 ? D : C);
      }
    }
  }
  // robe
  const w = h * 0.3;
  for (let y = 0; y < h * 0.62; y++) {
    const t = y / (h * 0.62), half = w * (0.35 + t * 0.65) / 2 + 1;
    for (let x = Math.round(cx - half); x <= cx + half; x++) {
      let col = shade(x, cx, half * 2);
      if ((x - cx + y * 0.15) % 4 === 0 && t > 0.2) col = D;   // folds
      P.set(x, base - h * 0.62 + y, col);
    }
  }
  // torso, head, raised arms with a star
  P.rect(cx - w * 0.22, base - h * 0.8, w * 0.44, h * 0.2, C);
  P.disc(cx, base - h * 0.88, h * 0.075, L);
  P.rect(cx - h * 0.075, base - h * 0.9, h * 0.15, h * 0.05, D);   // hair band
  P.thick(cx - w * 0.2, base - h * 0.78, cx - w * 0.05, base - h * 1.02, 2, C);
  P.thick(cx + w * 0.2, base - h * 0.78, cx + w * 0.05, base - h * 1.02, 2, D);
  starShape(P, cx, base - h * 1.06, h * 0.07, hex(star));
  // plinth
  P.rect(cx - w * 0.75, base, w * 1.5, 6, D);
  P.rect(cx - w * 0.75, base, w * 1.5, 2, C);
}

/** Five-pointed star (filled) */
export function starShape(P, cx, cy, r, c, inverted = false) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (inverted ? Math.PI : 0) + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  P.poly(pts, c);
}

/** The Covenant Ledger: a pale gold status panel only the summoned can see */
export function ledgerPanel(P, x, y, w, h, { jobFilled = false, glowK = 0.5 } = {}) {
  const G = hex("#fde68a"), Dk = hex("#3a2e10"), In = hex("#fff7d6");
  P.glow(x + w / 2, y + h / 2, Math.max(w, h) * 0.9, G, glowK, 1.6);
  P.rect(x, y, w, h, Dk, 0.55);
  P.hline(x, x + w - 1, y, G); P.hline(x, x + w - 1, y + h - 1, G); P.vline(x, y, y + h - 1, G); P.vline(x + w - 1, y, y + h - 1, G);
  P.hline(x + 2, x + w - 3, y + 4, G);
  for (let i = 0; i < 6; i++) {
    const ly = y + 7 + i * 3;
    if (ly > y + h - 6) break;
    P.hline(x + 3, x + 3 + Math.round(w * 0.3), ly, In);
    P.hline(x + Math.round(w * 0.55), x + Math.round(w * 0.55) + 2 + ((i * 7) % 5), ly, G);
  }
  const jy = y + h - 4;
  P.hline(x + 3, x + 8, jy, In);
  if (jobFilled) { P.hline(x + 11, x + w - 4, jy, hex("#ffffff")); P.glow(x + w * 0.65, jy, 8, [255, 255, 255], 0.7, 2); }
  else for (let i = x + 11; i < x + w - 4; i += 2) P.set(i, jy, G);
}

/** Paint with fn(layer) into a fresh layer, give it a 1-px outline, then composite onto P */
export function outlined(P, fn, outline = "#120e1c") {
  const L = new Px(P.w, P.h);
  fn(L);
  const O = hex(outline);
  for (let y = 0; y < P.h; y++)
    for (let x = 0; x < P.w; x++) {
      if (L.alpha(x, y)) { const i = (y * P.w + x) * 4; P.set(x, y, [L.d[i], L.d[i + 1], L.d[i + 2]], L.d[i + 3] / 255); continue; }
      if (L.alpha(x - 1, y) > 128 || L.alpha(x + 1, y) > 128 || L.alpha(x, y - 1) > 128 || L.alpha(x, y + 1) > 128) P.set(x, y, O);
    }
}

/** Huge gnarled tree trunk framing a scene (forest foreground) */
export function bigTrunk(P, x, w, { c = "#2a1d18", lit = "#45302a", dark = "#140d0b", sap = null, seed = 3, top = 0, bottom = P.h } = {}) {
  const C = hex(c), L = hex(lit), D = hex(dark), Sp = sap && hex(sap);
  for (let y = top; y < bottom; y++) {
    const sway = Math.sin(y * 0.03 + seed) * 4 + (y > bottom - 30 ? (y - (bottom - 30)) * 0.5 : 0);
    const half = w / 2 + (y > bottom - 30 ? (y - (bottom - 30)) * 0.9 : 0);
    for (let i = -half; i <= half; i++) {
      const f = i / half;
      const bark = noise2((x + i) * 0.4, y * 0.05, seed) > 0.62;
      let col = f < -0.55 ? L : f > 0.4 ? D : C;
      if (bark) col = D;
      if (Sp && noise2((x + i) * 0.5, y * 0.02, seed + 9) > 0.8 && f > -0.5) col = Sp;
      P.set(Math.round(x + i + sway), y, col);
    }
  }
}

export function mushroom(P, x, ground, s, { cap = "#22d3ee", stem = "#c7d2fe", glowK = 0.7 } = {}) {
  const Cc = hex(cap);
  P.glow(x, ground - s, s * 3, Cc, glowK, 1.8);
  P.vline(x, ground - s, ground, hex(stem));
  for (let j = 0; j < Math.ceil(s * 0.6); j++) { const half = Math.round(s * 0.8 - j * 0.6); P.hline(x - half, x + half, ground - s - j, j === 0 ? K_shade(Cc, -0.3) : Cc); }
}
const K_shade = (c, k) => shadeC(c, k);

/** Colossal winged demon silhouette (Satan's true form); dissolve 0–1 breaks it into ash from the right */
export function demonColossus(P, cx, cy, s, { c = "#14061e", rimC = "#a855f7", eyes = "#ff3b3b", dissolve = 0, seed = 5 } = {}) {
  const L = new Px(P.w, P.h);
  const C = hex(c);
  // wings
  for (const k of [-1, 1]) {
    const pts = [[cx + k * 14 * s, cy - 10 * s], [cx + k * 60 * s, cy - 52 * s], [cx + k * 92 * s, cy - 40 * s], [cx + k * 110 * s, cy - 6 * s]];
    for (let i = 0; i < 4; i++) pts.push([cx + k * (104 - i * 22) * s, cy + (8 + (i % 2) * 14) * s]);
    pts.push([cx + k * 16 * s, cy + 10 * s]);
    L.poly(pts, C);
    for (let i = 0; i < 4; i++) L.thick(cx + k * 60 * s, cy - 52 * s, cx + k * (104 - i * 22) * s, cy + (8 + (i % 2) * 14) * s, 1.5 * s, shadeC(C, 0.12));
  }
  // body, head, horns, arms
  L.poly([[cx - 22 * s, cy - 18 * s], [cx + 22 * s, cy - 18 * s], [cx + 16 * s, cy + 60 * s], [cx - 16 * s, cy + 60 * s]], C);
  L.disc(cx, cy - 28 * s, 13 * s, C);
  for (const k of [-1, 1]) {
    L.thick(cx + k * 8 * s, cy - 36 * s, cx + k * 20 * s, cy - 52 * s, 4 * s, C);
    L.thick(cx + k * 20 * s, cy - 52 * s, cx + k * 16 * s, cy - 64 * s, 2.5 * s, C);
    L.thick(cx + k * 22 * s, cy - 14 * s, cx + k * 40 * s, cy + 20 * s, 7 * s, C);
    L.thick(cx + k * 40 * s, cy + 20 * s, cx + k * 34 * s, cy + 40 * s, 5 * s, C);
  }
  const R = rng(seed), Rm = hex(rimC);
  for (let y = 0; y < P.h; y++)
    for (let x = 0; x < P.w; x++) {
      if (!L.alpha(x, y)) continue;
      const crumble = dissolve > 0 && fbm(x * 0.06, y * 0.06, seed, 3) + (x - cx) / (220 * s) > 1 - dissolve * 0.9;
      if (crumble) { if (R.chance(0.08)) P.set(x + R.range(4, 30), y - R.range(0, 20), Rm, 0.7); continue; }
      const edge = !L.alpha(x - 1, y) || !L.alpha(x, y - 1);
      P.set(x, y, edge ? Rm : C);
    }
  for (const k of [-1, 1]) { const ex = cx + k * 5 * s, ey = cy - 30 * s; P.glow(ex, ey, 7 * s, hex(eyes), 0.9, 2); P.rect(ex - s, ey - s * 0.5, 2 * s, s, hex("#ffd0a0")); }
}
