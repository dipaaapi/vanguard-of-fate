// ==================== HD CINEMA ENGINE ====================
// Renders the story cinematics (prologue shots, Act intros) in HD instead of the game's 480×270
// pixel buffer. A shot is a layered pixel-art set (assets/cinema/<id>/, painted by tools/art with
// P.layer(name, z) markers) rebuilt at screen resolution:
//   · a camera (pan / dolly / tilt keyframes) with parallax: every layer moves by its depth z
//     (0 = sky, 1 = the focal plane, > 1 = foreground) and zooms round the horizon line
//   · depth of field: layers away from the focus depth are blurred, the focus can rack
//   · the layer light maps added in smooth HD, plus live lights, god rays, drifting fog
//   · HD particles with depth (embers, snow, rain, ash, spores, motes, dust) and bokeh up close
//   · post: bloom, colour grade, vignette, film grain, letterbox, flash, shake and fades
// Coordinates in shots are the art's native 480×270 pixels; `k` maps them to the HD canvas.
// Pixel layers are cached upscaled by a whole factor and drawn smoothed (sharp-bilinear), so the
// pixel art stays crisp while the camera moves by sub-pixel amounts.
import { Particles } from "./particles.js";

export const NW = 480;
export const NH = 270;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const ease = {
  linear: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - (1 - t) ** 3,
  inout: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  smooth: (t) => t * t * (3 - 2 * t)
};
/** Part [a, b] of the progress p, 0..1 */
export const span = (p, a, b) => clamp01((p - a) / (b - a));

export function rgba(hex, a = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// ---------- Layered art sets (assets/cinema/manifest.json) ----------
let manifest = null;
const sets = new Map();
const ROOT = new URL("../../", import.meta.url);      // the game's root, wherever the page is
const CINE = new URL("assets/cinema/", ROOT);
function loadManifest() {
  if (!manifest) manifest = fetch(new URL("manifest.json", CINE)).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return manifest;
}
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
/** Loads (once) the layers of a set: [{ name, z, img, light }]; a missing set → null */
export function loadSet(id, fallback = null) {
  if (!id) return Promise.resolve(null);
  if (!sets.has(id)) {
    sets.set(id, loadManifest().then(async (m) => {
      const entry = m[id];
      if (!entry) {
        // no layered set: the flat image (an Act banner) as a single mid-depth layer
        const img = fallback ? await loadImage(new URL(fallback, ROOT).href) : null;
        return img ? [{ name: "flat", z: 0.5, img, light: null }] : null;
      }
      return Promise.all(entry.layers.map(async (L) => ({
        name: L.name, z: L.z,
        img: L.img ? await loadImage(new URL(`${id}/${L.img}`, CINE).href) : null,
        light: L.light ? await loadImage(new URL(`${id}/${L.light}`, CINE).href) : null
      })));
    }));
  }
  return sets.get(id);
}

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

// Soft blur by shrinking and enlarging (works in every browser, unlike ctx.filter)
function softBlur(src, amount) {
  const f = Math.max(1.5, amount);
  const a = canvas(src.width / f, src.height / f);
  const ga = a.getContext("2d");
  ga.imageSmoothingEnabled = true;
  ga.imageSmoothingQuality = "low";
  ga.drawImage(src, 0, 0, a.width, a.height);
  // a second, half-size pass smooths the blocky look of one big step
  const b = canvas(a.width / 1.6, a.height / 1.6);
  const gb = b.getContext("2d");
  gb.imageSmoothingEnabled = true;
  gb.drawImage(a, 0, 0, b.width, b.height);
  ga.clearRect(0, 0, a.width, a.height);
  ga.drawImage(b, 0, 0, a.width, a.height);
  return a;
}

// Fog texture: soft fbm-like noise in white alpha, tiles horizontally
let fogTex = null;
function fogTexture() {
  if (fogTex) return fogTex;
  const w = 256, h = 64, c = canvas(w, h), g = c.getContext("2d");
  const img = g.createImageData(w, h);
  const r = (x, y, s) => {
    const n = Math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453;
    return n - Math.floor(n);
  };
  const noise = (x, y, s) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
    const wrap = (v, p) => ((v % p) + p) % p;
    const P = 16;
    const a = r(wrap(xi, P), yi, s), b = r(wrap(xi + 1, P), yi, s), cc = r(wrap(xi, P), yi + 1, s), d = r(wrap(xi + 1, P), yi + 1, s);
    return (a + (b - a) * sx) * (1 - sy) + (cc + (d - cc) * sx) * sy;
  };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0, amp = 0.5, f = 1;
      for (let o = 0; o < 4; o++) { v += noise((x / w) * 16 * f, (y / h) * 4 * f, o) * amp; amp *= 0.5; f *= 2; }
      const edge = Math.sin((y / (h - 1)) * Math.PI);
      const a = clamp01((v - 0.35) * 2.2) * edge;
      const i = (y * w + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = a * 255;
    }
  g.putImageData(img, 0, 0);
  fogTex = c;
  return c;
}
const tinted = new Map();
function tintedFog(color) {
  if (!tinted.has(color)) {
    const src = fogTexture(), c = canvas(src.width, src.height), g = c.getContext("2d");
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    tinted.set(color, c);
  }
  return tinted.get(color);
}

let grainTex = null;
function grainTexture() {
  if (grainTex) return grainTex;
  const c = canvas(160, 160), g = c.getContext("2d"), img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTex = c;
  return c;
}

export class Cinema {
  constructor(el) {
    this.canvas = el;
    this.ctx = el.getContext("2d");
    this.k = 1;
    this.cache = new Map();     // layer image → { sharp, blur, blurAt }
    this.particles = new Particles();
    this.bloomA = null;
    this.bloomB = null;
    this.vignette = null;
    this.cap = Infinity;        // lowered by the frame-time guard below
    this.lite = false;          // no bloom or grain (Quality → Fast, or a slow device)
    this.reset();
  }

  reset() {
    this.flash = 0;
    this.flashColor = "#ffffff";
    this.shake = 0;
    this.fade = 0;
    this.fadeColor = "#000000";
    this.bars = 0;
    this.particles.clear();
  }

  // Backbuffer: the largest 16:9 box in cssW × cssH, drawn at up to maxW device pixels wide
  resize(cssW, cssH, maxW = 1920) {
    this.box = [cssW, cssH, maxW];
    maxW = Math.min(maxW, this.cap);
    this.lite = maxW <= CINEMA_WIDTH.fast;
    const boxW = Math.min(cssW, (cssH * 16) / 9), boxH = (boxW * 9) / 16;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(Math.min(boxW * dpr, maxW)), h = Math.round((w * 9) / 16);
    this.canvas.style.width = `${Math.round(boxW)}px`;
    this.canvas.style.height = `${Math.round(boxH)}px`;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.cache.clear();
      this.bloomA = canvas(w / 6, h / 6);
      this.bloomB = canvas(w / 16, h / 16);
      this.vignette = null;
    }
    this.k = w / NW;
    this.cssScale = boxW / NW;   // CSS px per native px (for HTML overlays)
    return this.cssScale;
  }

  // ---------- Camera ----------
  // keys: [{ at: 0..1, x, y, zoom, ease }] — x/y = native point at the centre, zoom ≥ 1
  static camAt(keys, p) {
    if (!keys || !keys.length) return { x: NW / 2, y: NH / 2, zoom: 1.06 };
    let a = keys[0], b = keys[keys.length - 1];
    for (let i = 0; i < keys.length - 1; i++) if (p >= keys[i].at && p <= keys[i + 1].at) { a = keys[i]; b = keys[i + 1]; break; }
    if (p <= keys[0].at) return { x: a.x ?? NW / 2, y: a.y ?? NH / 2, zoom: a.zoom ?? 1.06 };
    const t = (ease[b.ease || "inout"])(clamp01((p - a.at) / Math.max(1e-6, b.at - a.at)));
    const v = (k, d) => (a[k] ?? d) + ((b[k] ?? a[k] ?? d) - (a[k] ?? d)) * t;
    return { x: v("x", NW / 2), y: v("y", NH / 2), zoom: v("zoom", 1.06) };
  }

  // Scale for depth z: near layers react more to a dolly than far ones
  static zoomAt(cam, z) { return 1 + (cam.zoom - 1) * (0.3 + 0.7 * Math.min(z, 1.6)); }

  // Smallest common overscan so no layer edge ever shows during the shot
  static overscan(keys, depths, anchorY, sway = 0) {
    let need = 1;
    for (let i = 0; i <= 40; i++) {
      const c = Cinema.camAt(keys, i / 40);
      const dy = c.y - NH / 2;
      for (const z of depths) {
        const S = Cinema.zoomAt(c, z), shift = Math.abs((c.x - NW / 2) * z) + sway * Math.max(1, z);
        need = Math.max(need,
          (NW / 2) / Math.max(1, NW / 2 - shift) / S,
          (anchorY + Math.abs(dy) + sway) / anchorY / S,
          (NH - anchorY + Math.abs(dy) + sway) / (NH - anchorY) / S);
      }
    }
    return need * 1.004;
  }

  /** Begin a shot: depths used, anchor line, and the camera path (sets the overscan) */
  begin(shot, layers) {
    this.shot = shot;
    this.layers = layers || [];
    this.anchorY = shot.anchorY ?? 170;
    const depths = [...this.layers.map((L) => L.z), ...(shot.depths || [1])];
    this.ov = Cinema.overscan(shot.cam, depths, this.anchorY, (shot.sway ?? 0.6) + (shot.shakeRoom ?? 0));
    this.particles.clear();
    for (const def of shot.particles || []) this.particles.add(def);
    this.particles.prewarm(140);
  }

  // Native → HD transform for a depth z (sets ctx's matrix so native coordinates can be used)
  matrix(z, cam = this.cam) {
    const S = Cinema.zoomAt(cam, z) * this.ov * this.k;
    const shift = (cam.x - NW / 2) * z;
    const ay = this.anchorY;
    // x' = (x - 240 - shift) * S + 240k ; y' = (y - ay) * S + (ay - dy) k
    const tx = (-NW / 2 - shift) * S + (NW / 2) * this.k + this.sx * this.k;
    const ty = -ay * S + (ay - (cam.y - NH / 2)) * this.k + this.sy * this.k;
    return [S, tx, ty];
  }
  at(z) {
    const [S, tx, ty] = this.matrix(z);
    this.ctx.setTransform(S, 0, 0, S, tx, ty);
    return S;
  }
  /** Native point at depth z → HD canvas point */
  project(x, y, z) {
    const [S, tx, ty] = this.matrix(z);
    return [x * S + tx, y * S + ty, S];
  }
  screen() { this.ctx.setTransform(1, 0, 0, 1, 0, 0); }

  // ---------- Layer caches ----------
  prepared(img, blurPx) {
    let c = this.cache.get(img);
    // a whole-number upscale (nearest) drawn smoothed: crisp pixel edges at a fraction of the cost of
    // a full-resolution copy; 3× is plenty, the bilinear edge is then about one screen pixel wide
    const m = Math.max(1, Math.min(3, Math.ceil((this.k * this.ov) / 2)));
    if (!c || c.m !== m) {
      const sharp = canvas(img.width * m, img.height * m), g = sharp.getContext("2d");
      g.imageSmoothingEnabled = false;
      g.drawImage(img, 0, 0, sharp.width, sharp.height);
      c = { m, sharp, blur: null, blurAt: 0 };
      this.cache.set(img, c);
    }
    if (blurPx > 0.25 && (!c.blur || blurPx > c.blurAt + 0.6)) {   // only ever re-blur upwards; less blur is a mix with the sharp copy
      c.blur = softBlur(c.sharp, blurPx * c.m);
      c.blurAt = blurPx;
    }
    return c;
  }

  drawLayer(L, blur) {
    const ctx = this.ctx;
    this.at(L.z);
    // a shot can move one layer on its own (Satan rising behind the Citadel)
    const off = this.shot.offset && this.shot.offset[L.name];
    if (off) { const o = off(this.p, this.tick); ctx.translate(o.x || 0, o.y || 0); }
    if (L.img) {
      const c = this.prepared(L.img, blur);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "low";
      let mix = c.blur ? clamp01(blur / Math.max(0.01, c.blurAt)) : 0;
      // only cross-fade mid-rack: a near-match is drawn once (half the fill cost per layer)
      if (mix > 0.85) mix = 1; else if (mix < 0.15) mix = 0;
      if (mix < 1) ctx.drawImage(c.sharp, 0, 0, NW, NH);
      if (mix > 0 && c.blur) {
        ctx.globalAlpha = mix;
        ctx.drawImage(c.blur, 0, 0, NW, NH);
        ctx.globalAlpha = 1;
      }
    }
    if (L.light) {
      ctx.globalCompositeOperation = "lighter";
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = this.shot.lightMaps ?? 1;
      ctx.drawImage(L.light, 0, 0, NW, NH);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }

  // ---------- Lights and atmosphere ----------
  light(x, y, z, r, color, a = 1) {
    if (a <= 0.003) return;
    const ctx = this.ctx;
    const [px, py, S] = this.project(x, y, z);
    const R = r * S;
    this.screen();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(px, py, 0, px, py, R);
    g.addColorStop(0, rgba(color, 0.55 * a));
    g.addColorStop(0.25, rgba(color, 0.22 * a));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(px - R, py - R, R * 2, R * 2);
    ctx.globalCompositeOperation = "source-over";
  }

  // God rays fanning down from (x, y)
  rays(def, t) {
    const ctx = this.ctx;
    const { x, y, z = 0.2, color = "#fff3c4", n = 7, start = Math.PI * 0.3, spread = Math.PI * 0.4, len = 320, a = 0.16, width = 0.05 } = def;
    const [px, py, S] = this.project(x, y, z);
    this.screen();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < n; i++) {
      const base = start + (spread * (i + 0.5)) / n + Math.sin(t / 140 + i * 1.7) * 0.02;
      const w = width * (0.6 + ((i * 7) % 5) / 6);
      const flick = 0.65 + 0.35 * Math.sin(t / 50 + i * 2.3);
      const L = len * S;
      const x1 = px + Math.cos(base - w) * L, y1 = py + Math.sin(base - w) * L;
      const x2 = px + Math.cos(base + w) * L, y2 = py + Math.sin(base + w) * L;
      const g = ctx.createLinearGradient(px, py, (x1 + x2) / 2, (y1 + y2) / 2);
      g.addColorStop(0, rgba(color, a * flick));
      g.addColorStop(0.55, rgba(color, a * 0.45 * flick));
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath(); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  fog(def, t) {
    const { y, h = 40, z = 0.6, color = "#a0a8c8", a = 0.3, speed = 0.15 } = def;
    const ctx = this.ctx, tex = tintedFog(color);
    this.at(z);
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = a;
    const tw = 300, off = ((t * speed) % tw + tw) % tw;
    for (let x = -tw - 60 + off; x < NW + 60; x += tw) ctx.drawImage(tex, x, y - h / 2, tw, h);
    ctx.globalAlpha = 1;
  }

  // ---------- Frame ----------
  /**
   * Draws one frame of the current shot. t = frames since the shot began, p = 0..1.
   * The shot may define hooks: back(cine, t, p) before the layers, layer[name](cine, t, p) right
   * after a layer, actors [{ z, after, draw(cine, t, p) }], front(cine, t, p) after the light pass,
   * and ui(cine, t, p) in screen space after the post effects.
   */
  // Frame-time guard: when frames keep arriving late (a weak GPU or a big screen), the backbuffer
  // steps down (×0.75, or ×0.6 when very slow; not below 960) and bloom/grain switch off, rather than the cinematic stuttering
  guard() {
    const now = performance.now(), dt = now - (this.lastAt || now);
    this.lastAt = now;
    if (dt <= 0 || dt > 250) return;            // first frame, or the tab was hidden
    // late time piles up, good frames drain it; about a second of late frames steps down
    this.slow = dt > 28 ? (this.slow || 0) + dt : Math.max(0, (this.slow || 0) - 32);
    if (this.slow > 1000 && this.canvas.width > 960 && this.box) {
      this.slow = 0;
      this.cap = Math.max(960, Math.round(this.canvas.width * (dt > 80 ? 0.6 : 0.75)));
      this.resize(...this.box);
    }
  }

  frame(t, p) {
    this.guard();
    const ctx = this.ctx, shot = this.shot, W = this.canvas.width, H = this.canvas.height;
    this.tick = t;
    this.p = p;
    this.cam = Cinema.camAt(shot.cam, p);
    // handheld sway + shake (native px)
    const sway = shot.sway ?? 0.6;
    this.sx = Math.sin(t / 97) * sway + Math.sin(t / 41) * sway * 0.3;
    this.sy = Math.sin(t / 113) * sway * 0.6;
    if (this.shake > 0.3) { this.sx += (Math.random() - 0.5) * this.shake; this.sy += (Math.random() - 0.5) * this.shake; }
    this.shake *= 0.9;

    this.screen();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = shot.bg || "#000";
    ctx.fillRect(0, 0, W, H);
    if (shot.back) shot.back(this, t, p);

    // Depth of field: focus depth (may rack over the shot) and strength in native px per unit of z
    const focus = typeof shot.focus === "function" ? shot.focus(p) : (shot.focus ?? 1);
    const dof = shot.dof ?? 1.4;
    const actors = (shot.actors || []).slice();
    const flush = (name) => {
      for (let i = 0; i < actors.length; i++) {
        if (actors[i].after !== name) continue;
        const A = actors[i];
        this.at(A.z ?? 1);
        ctx.imageSmoothingEnabled = false;
        A.draw(this, t, p);
        actors.splice(i--, 1);
      }
    };
    flush("start");
    for (const L of this.layers) {
      this.drawLayer(L, Math.min(3.2, Math.abs(L.z - focus) * dof));
      if (shot.layer && shot.layer[L.name]) shot.layer[L.name](this, t, p);
      flush(L.name);
    }
    for (const A of actors) { this.at(A.z ?? 1); ctx.imageSmoothingEnabled = false; A.draw(this, t, p); }

    // Grade: multiply toward the shot's tint (shadows), then the lights add back on top
    this.screen();
    const grade = shot.grade;
    if (grade) {
      ctx.globalCompositeOperation = "multiply";
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, rgba(grade.top || grade.color, grade.k ?? 0.35));
      g.addColorStop(1, rgba(grade.bottom || grade.color, grade.k ?? 0.35));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
    }
    for (const f of shot.fog || []) if (f.under) this.fog(f, t);
    for (const L of shot.lights || []) {
      const fl = L.flicker ? 1 - L.flicker * (0.5 + 0.5 * Math.sin(t / 3.1 + L.x) * Math.sin(t / 7.3 + L.y)) : 1;
      const pulse = L.pulse ? 0.75 + 0.25 * Math.sin(t / L.pulse + L.x) : 1;
      const on = typeof L.on === "function" ? L.on(p, t) : 1;
      this.light(L.x, L.y, L.z ?? 1, L.r, L.color, (L.a ?? 1) * fl * pulse * on);
    }
    for (const r of shot.rays ? [].concat(shot.rays) : []) this.rays(r, t);
    for (const f of shot.fog || []) if (!f.under) this.fog(f, t);
    if (shot.front) shot.front(this, t, p);
    this.particles.update(this, t);
    this.particles.draw(this, focus, dof);
    if (shot.over) shot.over(this, t, p);

    this.post(t, p);
    if (shot.ui) { this.screen(); shot.ui(this, t, p); }
  }

  post(t) {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height, shot = this.shot;
    this.screen();
    // Bloom: bright parts, shrunk, darkened (x³) and blurred, added back
    const bloom = this.lite ? 0 : shot.bloom ?? 0.55;
    if (bloom > 0 && this.bloomA) {
      const a = this.bloomA, ga = a.getContext("2d"), b = this.bloomB, gb = b.getContext("2d");
      ga.globalCompositeOperation = "source-over";
      ga.imageSmoothingEnabled = true;
      ga.drawImage(this.canvas, 0, 0, a.width, a.height);
      ga.globalCompositeOperation = "multiply";
      ga.drawImage(a, 0, 0);
      ga.drawImage(a, 0, 0);
      ga.drawImage(a, 0, 0);
      ga.globalCompositeOperation = "source-over";
      gb.clearRect(0, 0, b.width, b.height);
      gb.imageSmoothingEnabled = true;
      gb.drawImage(a, 0, 0, b.width, b.height);
      ctx.globalCompositeOperation = "lighter";
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = bloom * 0.35;
      ctx.drawImage(a, 0, 0, W, H);
      ctx.globalAlpha = bloom * 0.6;
      ctx.drawImage(b, 0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
    // Vignette
    if (!this.vignette) {
      const v = canvas(W, H), g = v.getContext("2d");
      const rg = g.createRadialGradient(W / 2, H * 0.52, H * 0.3, W / 2, H * 0.52, W * 0.62);
      rg.addColorStop(0, "rgba(0,0,0,0)");
      rg.addColorStop(1, "rgba(0,0,0,1)");
      g.fillStyle = rg;
      g.fillRect(0, 0, W, H);
      this.vignette = v;
    }
    ctx.globalAlpha = shot.vignette ?? 0.6;
    ctx.drawImage(this.vignette, 0, 0);
    ctx.globalAlpha = 1;
    // Flash (lightning, impacts)
    if (this.flash > 0.01) {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = rgba(this.flashColor, this.flash * 0.8);
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
      this.flash *= 0.88;
    }
    // Film grain
    const grain = this.lite ? 0 : shot.grain ?? 0.07;
    if (grain > 0) {
      const pat = ctx.createPattern(grainTexture(), "repeat");
      ctx.save();
      ctx.translate((Math.random() * 160) | 0, (Math.random() * 160) | 0);
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = grain;
      ctx.fillStyle = pat;
      ctx.fillRect(-160, -160, W + 160, H + 160);
      ctx.restore();
    }
    // Fade (to black, or white for the crossing)
    if (this.fade > 0.003) {
      ctx.fillStyle = rgba(this.fadeColor, Math.min(1, this.fade));
      ctx.fillRect(0, 0, W, H);
    }
    // Letterbox bars (2.39:1 at bars = 1)
    const bar = Math.round(((H - W / 2.39) / 2) * this.bars);
    if (bar > 0) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, bar);
      ctx.fillRect(0, H - bar, W, bar);
    }
  }

  /** Free the HD caches (call when a cinematic closes) */
  release() {
    this.lastAt = 0;
    this.cache.clear();
    this.particles.clear();
  }
}

// Options → Quality: widest HD backbuffer for the cinematics (device pixels)
export const CINEMA_WIDTH = { sharp: 2560, balanced: 1920, fast: 1280 };
