import { normalizeConfig } from "./options.js";
import { sheetCount, sheetFrame, sheetsVersion } from "./sheets.js";

// ==================== MODULAR AVATAR RENDERER ====================
// A character is built from separate parts (layers):
//   cape → back hair → legs → feet → body/outfit → arms/hands → held item
//   → head → face → beard/glasses → front hair → headgear
// Each part has its own style and colour; shade/highlight come from the base colour,
// and the outline is added automatically (selective outline). Each frame is rendered once
// and cached as a canvas — cheap to drawImage in the game.
//
// Frame: 32x36 (about 2 tiles tall at 16px). Anchor = middle of the feet (16, 34).
// Directions: down (front), up (back), side (facing right; flip for left).
//
// Extra parts for NPCs, jobs, mercenaries and summons (not in the Character Creator):
//   outfit: gown | armor | coat      headgear: crown | tiara | helmet | headband | hat | hood | halo
//   cape: cape colour                beard / glasses / quiver: true      ears: "elf"
//   shield: tower | buckler          wings: wing colour                 face: "skull"   hairStyle: "none"
//   weapon: novice | staff | lance | scepter | bow | sword | flask | book | axe | greatsword
//           | crossbow | wand | none
// The "attack" animation depends on what is held: frame 0 = windup, frame 1 = strike.

export const FRAME_W = 32;
export const FRAME_H = 36;
const ANCHOR_X = 16;
const ANCHOR_Y = 34;
export const DIRS = ["down", "side", "up"];
const FRAMES = { idle: 2, walk: 4, run: 4, attack: 2 };
const SKILL_FRAMES = 6;   // "skill": the attack's ready pose with a growing aura (built from the attack frames)

// ---------- COLOURS ----------
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
// Shade: toward a cool violet; highlight: toward a warm cream (hue shift, livelier)
export function shade(hex, amt) {
  return amt < 0 ? mix(hex, "#1a1030", -amt) : mix(hex, "#fff4d6", amt);
}
const SHADES = new Map();
function shadeCached(hex, amt) {
  const k = hex + amt;
  let v = SHADES.get(k);
  if (!v) { v = shade(hex, amt); SHADES.set(k, v); }
  return v;
}

const FIXED = {
  shirt: "#e8e2d0",
  belt: "#3a2616",
  buckle: "#e0b44c",
  metal: "#dbe4ee",
  metalD: "#8a99ab",
  wood: "#8a5a2b",
  woodD: "#5e3b1a",
  gold: "#e0b44c",
  goldD: "#a8782a",
  tie: "#d94f4f",
  white: "#ffffff",
  blush: "#ff8a9a",
  steel: "#b5c4d4",
  steelD: "#7d8c9e",
  steelL: "#e3ebf3",
  crystal: "#5ee7ff",
  crystalD: "#2a9fd0",
  gem: "#e63946",
  plume: "#c62f3a",
  frame: "#2b2b33",
  glass: "#7fdc8f",
  glassD: "#3f9a55",
  book: "#6b2b2b"
};

function palette(cfg) {
  const glove = cfg.gloves === "leather" ? "#6b4a2b" : cfg.gloves === "wraps" ? "#e8e2d0" : cfg.skin;
  const c = {
    ...FIXED,
    skin: cfg.skin, skinD: shade(cfg.skin, -0.22), skinDD: shade(cfg.skin, -0.4),
    hair: cfg.hairColor, hairD: shade(cfg.hairColor, -0.32), hairL: shade(cfg.hairColor, 0.3),
    eye: cfg.eyes, eyeD: shade(cfg.eyes, -0.35), lash: "#1b1b2f",
    cloth: cfg.outfitColor, clothD: shade(cfg.outfitColor, -0.28), clothL: shade(cfg.outfitColor, 0.22),
    legs: cfg.legColor, legsD: shade(cfg.legColor, -0.28), legsDD: shade(cfg.legColor, -0.45), legsL: shade(cfg.legColor, 0.22),
    boot: cfg.bootColor, bootD: shade(cfg.bootColor, -0.35), bootL: shade(cfg.bootColor, 0.25),
    glove, gloveD: shade(glove, -0.25),
    shirtD: shade(FIXED.shirt, -0.2),
    cape: cfg.cape || "#8a2c2c", capeD: shade(cfg.cape || "#8a2c2c", -0.3), capeL: shade(cfg.cape || "#8a2c2c", 0.18),
    wing: cfg.wings || "#ffffff", wingD: shade(cfg.wings || "#ffffff", -0.2), wingDD: shade(cfg.wings || "#ffffff", -0.38),
    tabard: cfg.outfitColor
  };
  // Armor: steel body and sleeves; outfitColor becomes a tabard down the middle
  if (cfg.outfit === "armor") {
    c.cloth = FIXED.steel;
    c.clothD = FIXED.steelD;
    c.clothL = FIXED.steelL;
  }
  return c;
}

// ---------- PIXEL BUFFER ----------
// Also used by js/avatar/creature.js (slime, wolf, falcon) so the style matches.
export class Pix {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Array(w * h).fill(null);
  }
  set(x, y, c) {
    if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c;
  }
  get(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.d[y * this.w + x] : null;
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  // Row: [y, x0, x1] (x1 included)
  rows(list, c, dy = 0) {
    list.forEach(([y, x0, x1]) => { for (let x = x0; x <= x1; x++) this.set(x, y + dy, c); });
  }
  // Light from the upper left: edge pixels facing the sky catch a highlight, edge pixels facing the
  // ground fall into shade, so every figure reads as round on any terrain (runs before the outline)
  light() {
    const src = this.d.slice();
    const at = (x, y) => (x >= 0 && y >= 0 && x < this.w && y < this.h ? src[y * this.w + x] : null);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = src[y * this.w + x];
        if (!c) continue;
        const up = !at(x, y - 1), left = !at(x - 1, y), down = !at(x, y + 1), right = !at(x + 1, y);
        if (up && !down) this.d[y * this.w + x] = shade(c, left ? 0.2 : 0.12);
        else if (left && !right && !up) this.d[y * this.w + x] = shade(c, 0.07);
        else if (down && !up) this.d[y * this.w + x] = shade(c, -0.12);
        else if (right && !left) this.d[y * this.w + x] = shade(c, -0.07);
      }
    }
  }
  // Volume and texture inside the figure (runs before light/outline): each pixel's depth is its distance
  // from the silhouette edge; the slope of that depth, lit from the upper left, lightens the near-top-left
  // and shades the lower-right in dithered steps, so bodies, heads and limbs read as round. A sparse
  // hash pattern adds fur/cloth texture to large flat areas. Single-pixel details (eyes, studs) keep
  // their colour.
  detail() {
    const { w, h } = this, src = this.d.slice();
    const dist = new Int8Array(w * h).fill(-1);
    const q = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!src[i]) continue;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !src[i - 1] || !src[i + 1] || !src[i - w] || !src[i + w]) { dist[i] = 1; q.push(i); }
    }
    for (let k = 0; k < q.length; k++) {
      const i = q[k], x = i % w, y = (i - x) / w, d = dist[i];
      if (d >= 5) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, j = ny * w + nx;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || !src[j] || dist[j] !== -1) continue;
        dist[j] = d + 1; q.push(j);
      }
    }
    const D = (x, y) => (x < 0 || y < 0 || x >= w || y >= h || dist[y * w + x] < 0 ? 0 : dist[y * w + x]);
    const count = new Map();
    src.forEach((c) => { if (c) count.set(c, (count.get(c) || 0) + 1); });
    const B = [[0, 2], [3, 1]];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, c = src[i];
      if (!c || dist[i] < 2 || count.get(c) < 4) continue;
      // outward normal = minus the depth gradient; light comes from the upper left
      const gx = D(x + 1, y) - D(x - 1, y), gy = D(x, y + 1) - D(x, y - 1);
      const lum = (gx * 0.6 + gy * 0.8) * -1 / 2;          // > 0 = slope facing the light
      const t = (B[y & 1][x & 1] + 0.5) / 4 * 0.5;
      if (lum > 0.25 + t) this.d[i] = shadeCached(c, 0.13);
      else if (lum < -0.25 - t) this.d[i] = shadeCached(c, -0.15);
      else if (dist[i] >= 3 && ((x * 7 + y * 13 + ((x * y) & 3)) % 11 === 0)) this.d[i] = shadeCached(c, -0.07);   // texture
    }
  }
  // Move everything by (dx, dy); rows above `pivot` lean forward by `lean` pixels (running, side view)
  shift(dx, dy, lean = 0, pivot = this.h) {
    const src = this.d.slice();
    this.d.fill(null);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = src[y * this.w + x];
      if (c) this.set(x + dx + (y < pivot ? lean : 0), y + dy, c);
    }
  }
  // Glow around the silhouette (after the outline) for charge level 1–4: sparse and close at first,
  // denser and two pixels deep at the top, dithered by the level so it shimmers between frames
  aura(col, level, t = level) {
    const rings = level >= 3 ? 2 : 1, step = [4, 4, 3, 3, 2][Math.min(4, level)];
    const src = this.d.slice(), { w, h } = this;
    const near = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h && src[Y * w + X]) return true; } return false; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (src[y * w + x]) continue;
      if (near(x, y, 1)) { if ((x + y * 2 + t) % step === 0) this.d[y * w + x] = col; }
      else if (rings > 1 && near(x, y, 2) && (x * 3 + y + t) % (step * 2) === 0) this.d[y * w + x] = col;
    }
  }
  // Sparkles in empty space, placed by a hash of `seed` (skill charge, dust)
  motes(col, n, seed, y0 = 0, y1 = this.h) {
    for (let k = 0; k < n; k++) {
      const x = (seed * 7 + k * 13 + ((k * k * 5) % 7)) % this.w, y = y0 + ((seed * 3 + k * 11) % Math.max(1, y1 - y0));
      if (!this.get(x, y)) this.set(x, y, col);
    }
  }
  // Selective outline: every empty pixel next to a colour becomes a darker version of it
  // (darker under the figure so it sits on the ground)
  outline() {
    this.light();
    const src = this.d.slice();
    const at = (x, y) => (x >= 0 && y >= 0 && x < this.w && y < this.h ? src[y * this.w + x] : null);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (src[y * this.w + x]) continue;
        const above = at(x, y - 1);
        const n = above || at(x, y + 1) || at(x - 1, y) || at(x + 1, y);
        if (n) this.d[y * this.w + x] = shade(n, above && !at(x, y + 1) ? -0.72 : -0.62);
      }
    }
  }
  toCanvas() {
    const c = document.createElement("canvas");
    c.width = this.w;
    c.height = this.h;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(this.w, this.h);
    this.d.forEach((col, i) => {
      if (!col) return;
      const [r, g, b] = hexToRgb(col);
      img.data.set([r, g, b, 255], i * 4);
    });
    ctx.putImageData(img, 0, 0);
    return c;
  }
}

// ---------- GAIT ----------
function gait(anim, i) {
  if (anim === "walk") {
    return [
      { bob: 0, lLift: 0, rLift: 1, lArm: 1, rArm: -1, stride: 1 },
      { bob: 1, lLift: 0, rLift: 0, lArm: 0, rArm: 0, stride: 0 },
      { bob: 0, lLift: 1, rLift: 0, lArm: -1, rArm: 1, stride: -1 },
      { bob: 1, lLift: 0, rLift: 0, lArm: 0, rArm: 0, stride: 0 }
    ][i % 4];
  }
  // Running: feet lift higher and the arms swing wider
  if (anim === "run") {
    return [
      { bob: 0, lLift: 0, rLift: 2, lArm: 2, rArm: -2, stride: 1 },
      { bob: 1, lLift: 0, rLift: 1, lArm: 1, rArm: -1, stride: 0 },
      { bob: 0, lLift: 2, rLift: 0, lArm: -2, rArm: 2, stride: -1 },
      { bob: 1, lLift: 1, rLift: 0, lArm: -1, rArm: 1, stride: 0 }
    ][i % 4];
  }
  const base = { bob: 0, lLift: 0, rLift: 0, lArm: 0, rArm: 0, stride: 0 };
  if (anim === "idle") return { ...base, bob: i % 2 };
  if (anim === "attack") return { ...base, attack: (i % 2) + 1 };
  return base;
}

// ==================== PARTS ====================

// ---- FEET and LEGS ----
function footHeight(style) {
  return style === "boots" ? 5 : style === "sneakers" ? 3 : 2;
}

function drawFoot(p, c, cfg, x, bottom, w, dark) {
  const h = footHeight(cfg.boots);
  const top = bottom - h + 1;
  if (cfg.boots === "sandals") {
    p.rect(x, top, w, h, dark ? c.skinD : c.skin);
    p.rect(x, top, w, 1, dark ? c.bootD : c.boot);        // strap
    p.rect(x, bottom, w, 1, c.bootD);                       // sole
    return top;
  }
  if (cfg.boots === "sneakers") {
    // Earth trainers: coloured upper, white rubber sole
    p.rect(x, top, w, h - 1, dark ? c.bootD : c.boot);
    p.set(x + 1, top, dark ? c.boot : c.bootL);              // laces
    p.rect(x, bottom, w, 1, dark ? "#cbd5e1" : "#f8fafc");
    return top;
  }
  p.rect(x, top, w, h, dark ? c.bootD : c.boot);
  if (h > 2) p.rect(x, top, w, 1, dark ? c.boot : c.bootL); // boot cuff
  p.rect(x, bottom, w, 1, dark ? shade(c.boot, -0.5) : c.bootD);
  return top;
}

// Leg colour for one row (trousers / shorts / skin)
function legColorAt(c, cfg, y, dark) {
  if (cfg.legs === "pants" || cfg.legs === "jeans") return dark ? c.legsD : c.legs;
  if (cfg.legs === "shorts" && y <= 27) return dark ? c.legsD : c.legs;
  return dark ? c.skinD : c.skin;
}

function drawLegFront(p, c, cfg, x0, lift) {
  const bottom = 34 - lift;
  const footTop = bottom - footHeight(cfg.boots) + 1;
  for (let y = 24; y < footTop; y++) {
    p.set(x0, y, legColorAt(c, cfg, y, false));
    p.set(x0 + 1, y, legColorAt(c, cfg, y, false));
    p.set(x0 + 2, y, legColorAt(c, cfg, y, true));
  }
  if (cfg.legs === "jeans") p.rect(x0, footTop - 1, 3, 1, c.legsL);   // rolled cuff
  drawFoot(p, c, cfg, x0 - (x0 < 16 ? 1 : 0), bottom, 4, false);
}

function drawLegSide(p, c, cfg, x0, lift, dark) {
  const bottom = 34 - lift;
  const footTop = bottom - footHeight(cfg.boots) + 1;
  for (let y = 24; y < footTop; y++) {
    p.set(x0, y, legColorAt(c, cfg, y, true));
    p.set(x0 + 1, y, legColorAt(c, cfg, y, dark));
    p.set(x0 + 2, y, legColorAt(c, cfg, y, dark));
  }
  if (cfg.legs === "jeans") p.rect(x0, footTop - 1, 3, 1, dark ? c.legs : c.legsL);
  drawFoot(p, c, cfg, x0, bottom, 5, dark);  // the foot reaches further forward
}

// ---- SKIRT / ROBE / GOWN / COAT (lower part of the outfit) ----
function drawSkirt(p, c, cfg, dy, side) {
  const col = c.legs, colD = c.legsD;
  const rows = side
    ? [[24, 11, 20], [25, 11, 20], [26, 10, 21], [27, 10, 21], [28, 10, 21]]
    : [[24, 11, 20], [25, 10, 21], [26, 10, 21], [27, 9, 22], [28, 9, 22]];
  rows.forEach(([y, x0, x1]) => {
    for (let x = x0; x <= x1; x++) p.set(x, y + dy, (x - x0) % 3 === 2 ? colD : col); // folds
  });
}

function drawRobeSkirt(p, c, dy, side, trim) {
  const rows = side
    ? [[24, 11, 20], [25, 11, 20], [26, 10, 20], [27, 10, 21], [28, 10, 21], [29, 10, 21]]
    : [[24, 11, 20], [25, 10, 21], [26, 10, 21], [27, 10, 21], [28, 9, 22], [29, 9, 22]];
  rows.forEach(([y, x0, x1]) => {
    for (let x = x0; x <= x1; x++) p.set(x, y + dy, x >= x1 - 1 ? c.clothD : c.cloth);
  });
  if (trim) for (let y = 24; y <= 29; y++) { p.set(15, y + dy, c.clothL); p.set(16, y + dy, c.clothL); }
  rows.forEach(([y, x0, x1]) => { if (y === 29) for (let x = x0; x <= x1; x++) p.set(x, y + dy, c.clothD); });
}

// A long gown down to the feet, with a golden hem
function drawGownSkirt(p, c, dy, side) {
  const rows = side
    ? [[24, 11, 20], [25, 11, 20], [26, 10, 21], [27, 10, 21], [28, 10, 22], [29, 9, 22], [30, 9, 22], [31, 9, 23], [32, 9, 23], [33, 9, 23]]
    : [[24, 11, 20], [25, 10, 21], [26, 10, 21], [27, 9, 22], [28, 9, 22], [29, 8, 23], [30, 8, 23], [31, 8, 23], [32, 7, 24], [33, 7, 24]];
  rows.forEach(([y, x0, x1]) => {
    for (let x = x0; x <= x1; x++) {
      let col = (x - x0) % 4 === 3 ? c.clothD : c.cloth;          // folds
      if (x >= x1 - 1) col = c.clothD;
      if (x === x0 + 1 && y > 25) col = c.clothL;
      p.set(x, y + (y >= 33 ? 0 : dy), col);
    }
  });
  const hem = rows[rows.length - 1];
  for (let x = hem[1]; x <= hem[2]; x++) p.set(x, hem[0], x % 2 ? c.gold : c.goldD);
}

// Coat tails (split in the middle, the legs show)
function drawCoatTails(p, c, dy, side) {
  if (side) {
    for (let y = 24; y <= 29; y++) for (let x = 10; x <= 14 - (y > 27 ? 1 : 0); x++) p.set(x, y + dy, x <= 11 ? c.clothD : c.cloth);
    return;
  }
  for (let y = 24; y <= 29; y++) {
    for (let x = 10; x <= 13; x++) p.set(x, y + dy, x === 10 ? c.clothL : c.cloth);
    for (let x = 18; x <= 21; x++) p.set(x, y + dy, x >= 20 ? c.clothD : c.cloth);
    p.set(14, y + dy, c.gold); p.set(17, y + dy, c.gold);
  }
  for (let x = 10; x <= 21; x++) if (x < 14 || x > 17) p.set(x, 29 + dy, c.gold);
}

// ---- CAPE (behind the body in front/side views; over the back when facing away) ----
function drawCape(p, c, dy, view) {
  if (view === "down") {
    for (let y = 15; y <= 30; y++) {
      const spread = y > 24 ? 1 : 0;
      for (let x = 9 - spread; x <= 22 + spread; x++) p.set(x, y + dy, x >= 20 ? c.capeD : c.cape);
    }
  } else if (view === "side") {
    for (let y = 15; y <= 30; y++) {
      const back = y > 22 ? 2 : y > 18 ? 1 : 0;
      for (let x = 10 - back; x <= 13; x++) p.set(x, y + dy, x <= 10 - back + 1 ? c.capeD : c.cape);
    }
  } else {
    for (let y = 15; y <= 31; y++) {
      const spread = y > 24 ? 1 : 0;
      for (let x = 9 - spread; x <= 22 + spread; x++) {
        let col = x >= 20 ? c.capeD : c.cape;
        if ((x === 12 || x === 18) && y > 18) col = c.capeD;  // folds
        if (x === 10 && y < 26) col = c.capeL;
        p.set(x, y + dy, col);
      }
    }
    p.rows([[15, 10, 21]], c.capeD, dy);
  }
}

// ---- BODY (torso) ----
function torsoRows(cfg, side) {
  const female = cfg.body === "female";
  if (side) {
    return female
      ? [[15, 12, 19], [16, 12, 19], [17, 12, 20], [18, 12, 20], [19, 12, 19], [20, 12, 19], [21, 12, 19], [22, 12, 19], [23, 12, 19]]
      : [[15, 12, 19], [16, 12, 19], [17, 12, 19], [18, 12, 19], [19, 12, 19], [20, 12, 19], [21, 12, 19], [22, 12, 19], [23, 12, 19]];
  }
  return female
    ? [[15, 11, 20], [16, 11, 20], [17, 11, 20], [18, 11, 20], [19, 12, 19], [20, 12, 19], [21, 11, 20], [22, 11, 20], [23, 11, 20]]
    : [[15, 10, 21], [16, 10, 21], [17, 11, 20], [18, 11, 20], [19, 11, 20], [20, 11, 20], [21, 11, 20], [22, 11, 20], [23, 11, 20]];
}

function drawTorso(p, c, cfg, dy, view) {
  const side = view === "side";
  const back = view === "up";
  const rows = torsoRows(cfg, side);

  rows.forEach(([y, x0, x1]) => {
    for (let x = x0; x <= x1; x++) {
      let col = c.cloth;
      if ((cfg.outfit === "vest" || cfg.outfit === "jacket") && !back) {
        // Open vest: a shirt in the middle (front) or on the front side (side view)
        const open = side ? x >= x1 - 2 : x >= 14 && x <= 17;
        if (open) col = x === (side ? x1 : 17) ? c.shirtD : c.shirt;
      }
      if (x >= x1 - 1 && col === c.cloth) col = c.clothD;       // shade on the right
      if (x === x0 && col === c.cloth && y >= 16 && y <= 19) col = c.clothL;
      p.set(x, y + dy, col);
    }
  });

  // Armor: pauldrons on the shoulders and a tabard in the middle
  if (cfg.outfit === "armor") {
    if (!side) {
      p.rows([[15, rows[0][1] - 1, rows[0][1] + 2], [16, rows[0][1] - 1, rows[0][1] + 2]], c.steelL, dy);
      p.rows([[15, rows[0][2] - 2, rows[0][2] + 1], [16, rows[0][2] - 2, rows[0][2] + 1]], c.steelD, dy);
      if (!back) for (let y = 17; y <= 23; y++) for (let x = 14; x <= 17; x++) p.set(x, y + dy, x === 17 ? shade(c.tabard, -0.3) : c.tabard);
    } else {
      p.rows([[15, 13, 17], [16, 13, 17]], c.steelL, dy);
      for (let y = 17; y <= 23; y++) { p.set(18, y + dy, c.tabard); p.set(19, y + dy, shade(c.tabard, -0.3)); }
    }
  }

  // Earth clothes (Character Creator): hoodie, T-shirt, collared shirt, open jacket
  if (cfg.outfit === "hoodie") {
    if (back) p.rows([[14, 13, 18], [15, 12, 19], [16, 13, 18]], c.clothD, dy);          // hood down the back
    else if (side) p.rows([[14, 12, 13], [15, 11, 13], [16, 12, 13]], c.clothD, dy);
    else {
      p.rows([[15, 13, 18]], c.clothD, dy);                                               // hood around the neck
      p.set(15, 15 + dy, c.skin); p.set(16, 15 + dy, c.skin);
      for (let y = 16; y <= 18; y++) { p.set(14, y + dy, c.shirt); p.set(17, y + dy, c.shirt); }   // drawstrings
      p.rows([[20, 13, 18]], c.clothD, dy);                                               // kangaroo pocket
      p.set(13, 21 + dy, c.clothD); p.set(18, 21 + dy, c.clothD);
    }
  } else if (cfg.outfit === "tee" && view === "down") {
    p.rows([[15, 15, 16]], c.skin, dy);
    p.set(14, 15 + dy, c.clothD); p.set(17, 15 + dy, c.clothD);                         // crew neck
    p.rows([[18, 13, 14], [19, 13, 14]], c.clothL, dy);                                   // chest print
  } else if (cfg.outfit === "shirt" && !back) {
    if (side) p.rows([[15, 16, 18]], c.shirt, dy);
    else {
      p.rows([[15, 14, 17]], c.shirt, dy);                                                // white collar
      p.set(15, 16 + dy, c.skin); p.set(16, 16 + dy, c.skin);
      for (let y = 17; y <= 23; y++) p.set(15, y + dy, y % 2 ? c.shirt : c.clothD);       // buttons
    }
  } else if (cfg.outfit === "jacket" && view === "down") {
    p.rows([[15, 15, 16]], c.skin, dy);
    for (let y = 16; y <= 23; y++) { p.set(13, y + dy, c.clothD); p.set(18, y + dy, c.clothD); }   // open zip edges
  }

  // Neck + neckline (front only)
  if (view === "down") {
    if (cfg.outfit === "tunic") {
      p.rows([[15, 14, 17], [16, 15, 16]], c.skin, dy);
    } else if (cfg.outfit === "robe") {
      p.rows([[15, 15, 16]], c.skin, dy);
      for (let y = 16; y <= 23; y++) { p.set(15, y + dy, c.clothL); p.set(16, y + dy, c.clothL); }
    } else if (cfg.outfit === "gown") {
      p.rows([[15, 13, 18], [16, 14, 17]], c.skin, dy);
      p.rows([[17, 13, 18]], c.gold, dy);
    } else if (cfg.outfit === "coat") {
      p.rows([[15, 14, 17]], c.shirt, dy);
      for (let y = 15; y <= 23; y++) { p.set(15, y + dy, c.gold); p.set(16, y + dy, y % 2 ? c.gold : c.goldD); }
    }
  }

  // Belt
  const beltY = 21 + dy;
  const plainBelt = cfg.outfit === "robe" || cfg.outfit === "gown";
  const untucked = cfg.outfit === "hoodie" || cfg.outfit === "tee" || cfg.outfit === "jacket";   // no belt showing
  rows.forEach(([y, x0, x1]) => {
    if (untucked || y + dy !== beltY) return;
    for (let x = x0; x <= x1; x++) p.set(x, beltY, cfg.outfit === "gown" ? c.gold : plainBelt ? c.clothD : c.belt);
    if (view === "down" && !plainBelt) { p.set(15, beltY, c.buckle); p.set(16, beltY, c.buckle); }
    if (side && !plainBelt) p.set(x1 - 1, beltY, c.buckle);
  });

  // Hem of the tunic/armor (covers the top of the legs)
  if (cfg.outfit === "tunic" || cfg.outfit === "armor" || untucked) {
    const hem = side ? [[24, 12, 19]] : [[24, 11, 20]];
    hem.forEach(([y, x0, x1]) => { for (let x = x0; x <= x1; x++) p.set(x, y + dy, x >= x1 - 1 ? c.clothD : c.cloth); });
  }
}

// Hips (joining the two legs)
function drawPelvis(p, c, cfg, side) {
  if (cfg.legs === "skirt") return;
  const [x0, x1] = side ? [13, 18] : [12, 19];
  for (let x = x0; x <= x1; x++) p.set(x, 24, x >= x1 - 1 ? c.legsD : c.legs);
}

// ---- ARMS and HANDS ----
function sleeveColor(c, cfg, rowFromShoulder, dark) {
  if (cfg.outfit === "robe" || cfg.outfit === "gown" || cfg.outfit === "coat" || cfg.outfit === "armor") {
    if (cfg.outfit === "coat" && rowFromShoulder >= 5) return c.gold;          // golden cuffs
    return dark ? c.clothD : c.cloth;
  }
  if (cfg.outfit === "vest") return dark ? c.shirtD : c.shirt;
  if (cfg.outfit === "hoodie" || cfg.outfit === "jacket") return rowFromShoulder >= 6 ? c.clothD : dark ? c.clothD : c.cloth;   // long sleeves, cuffs
  if (cfg.outfit === "shirt") return rowFromShoulder >= 6 ? c.shirt : dark ? c.clothD : c.cloth;      // long sleeves, white cuffs
  if (rowFromShoulder <= 2) return dark ? c.clothD : c.cloth;   // short tunic sleeves
  return dark ? c.skinD : c.skin;
}

// Arm in front/back view: a vertical 2px column
function drawArmFront(p, c, cfg, x, dy, swing, outerDark) {
  const top = 16 + dy;
  for (let r = 0; r < 7; r++) {
    const y = top + r + (r >= 4 ? swing : 0);
    p.set(x, y, sleeveColor(c, cfg, r, outerDark === 0));
    p.set(x + 1, y, sleeveColor(c, cfg, r, outerDark === 1));
    if ((cfg.outfit === "robe" || cfg.outfit === "gown") && r >= 5) p.set(outerDark === 0 ? x - 1 : x + 2, y, c.clothD); // wide sleeves
  }
  const hy = top + 7 + swing;
  p.rect(x, hy, 2, 2, c.glove);
  p.set(outerDark === 1 ? x + 1 : x, hy + 1, c.gloveD);
  return { hx: x, hy };
}

// Arm in side view: swings forward/back
function drawArmSide(p, c, cfg, dy, swing, dark) {
  const top = 16 + dy;
  const x = 15;
  for (let r = 0; r < 7; r++) {
    const off = r >= 3 ? swing : 0;
    p.set(x + off, top + r, sleeveColor(c, cfg, r, dark));
    p.set(x + 1 + off, top + r, sleeveColor(c, cfg, r, dark));
  }
  const hx = x + swing;
  const hy = top + 7;
  p.rect(hx, hy, 2, 2, dark ? c.gloveD : c.glove);
  return { hx, hy };
}

// ---- HELD ITEMS ----
function drawBuckler(p, c, cx, cy) {
  const mask = [
    "..###..",
    ".#ooo#.",
    "#ooooo#",
    "#oo*oo#",
    "#ooooo#",
    ".#ooo#.",
    "..###.."
  ];
  mask.forEach((row, j) => row.split("").forEach((ch, i) => {
    const x = cx - 3 + i, y = cy - 3 + j;
    if (ch === "#") p.set(x, y, c.gold);
    else if (ch === "o") p.set(x, y, i >= 4 ? c.woodD : c.wood);
    else if (ch === "*") p.set(x, y, c.metal);
  }));
}

// Dagger/sword: dir = "down" | "up" | "right"
function drawBlade(p, c, x, y, dir, len = 4) {
  if (dir === "right") {
    p.set(x, y, c.woodD);
    p.set(x + 1, y - 1, c.gold); p.set(x + 1, y, c.gold); p.set(x + 1, y + 1, c.gold);
    for (let i = 0; i < len; i++) p.set(x + 2 + i, y, i === len - 1 ? c.white : c.metal);
    return;
  }
  const s = dir === "down" ? 1 : -1;
  p.set(x, y, c.woodD);
  p.set(x - 1, y + s, c.gold); p.set(x, y + s, c.gold); p.set(x + 1, y + s, c.gold);
  for (let i = 0; i < len; i++) p.set(x, y + s * (2 + i), i === len - 1 ? c.white : c.metal);
}

// Vertical shaft (staff / lance / scepter) through the hand; never covers the hand
function drawPole(p, c, x, top, bottom, hand, col, colD) {
  for (let y = top; y <= bottom; y++) {
    if (hand && y >= hand.hy && y <= hand.hy + 1) continue;
    p.set(x, y, y % 5 === 0 ? colD : col);
  }
}

// Axe: shaft + blade at the end. dir = "up" | "down" | "right"
function drawAxe(p, c, x, y, dir) {
  if (dir === "right") {
    for (let i = 0; i < 7; i++) p.set(x + i, y, i % 3 === 2 ? c.woodD : c.wood);
    p.rect(x + 5, y + 1, 2, 3, c.metal);
    p.set(x + 5, y - 1, c.metal); p.set(x + 6, y - 1, c.metal);
    p.set(x + 7, y + 1, c.white); p.set(x + 7, y + 2, c.white);
    return;
  }
  const s = dir === "down" ? 1 : -1;
  for (let i = -1; i < 7; i++) p.set(x, y + s * i, i % 3 === 2 ? c.woodD : c.wood);
  const hy = y + s * 5;                     // middle of the blade
  for (let j = -2; j <= 1; j++) { p.set(x + 1, hy + j, c.metal); p.set(x + 2, hy + j, c.metal); }
  p.set(x + 3, hy - 1, c.white); p.set(x + 3, hy, c.white);
  p.set(x - 1, hy, c.metalD);
}

// Magic light at the tip of a staff/scepter while casting
function drawSparkle(p, c, x, y) {
  p.set(x, y - 2, c.white); p.set(x, y + 2, c.white);
  p.set(x - 2, y, c.white); p.set(x + 2, y, c.white);
  p.set(x - 1, y - 1, c.crystal); p.set(x + 1, y + 1, c.crystal);
}

// Upright bow; bend = +1 (curves right) or -1. pull = string draw (0 = relaxed)
function drawBowV(p, c, x, top, bend, pull) {
  const curve = [0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0];
  const mid = (curve.length - 1) / 2;
  curve.forEach((o, j) => {
    p.set(x + bend * o, top + j, j % 6 === 0 ? c.woodD : c.wood);
    const k = 1 - Math.abs(j - mid) / mid;              // V shape of the string when drawn
    p.set(x - bend * Math.round(pull * k), top + j, j === 0 || j === curve.length - 1 ? c.wood : c.shirt);
  });
}

// Crossbow: a horizontal stock + an upright prod in front
function drawCrossbow(p, c, x, y, dir) {
  if (dir === "right") {
    for (let i = 0; i < 8; i++) p.set(x + i, y, i < 3 ? c.woodD : c.wood);
    for (let j = -3; j <= 3; j++) p.set(x + 6, y + j, Math.abs(j) === 3 ? c.metalD : c.metal);
    p.set(x + 8, y, c.white);
    return;
  }
  for (let j = 0; j < 5; j++) p.set(x, y + j, c.wood);
  for (let i = -3; i <= 3; i++) p.set(x + i, y + 3, Math.abs(i) === 3 ? c.metalD : c.metal);
}

// Tower shield: tabard colour, golden rim, a cross in the middle
function drawTowerShield(p, c, x, y, w, h) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const rim = i === 0 || i === w - 1 || j === 0 || j === h - 1;
      p.set(x + i, y + j, rim ? (i === w - 1 ? c.goldD : c.gold) : i >= w - 2 ? shade(c.tabard, -0.3) : c.tabard);
    }
  }
  if (w >= 5) {
    const cx = x + Math.floor(w / 2);
    for (let j = 2; j < h - 2; j++) p.set(cx, y + j, c.gold);
    for (let i = 1; i < w - 1; i++) p.set(x + i, y + 4, c.gold);
  }
}

function drawShield(p, c, cfg, view, shield) {
  if (cfg.shield === "buckler") {
    if (view === "side") drawBuckler(p, c, shield.hx - 2, shield.hy - 4);
    else drawBuckler(p, c, shield.hx + (shield.hx < 16 ? -1 : 2), shield.hy - 3);
  } else if (cfg.shield === "tower") {
    if (view === "side") drawTowerShield(p, c, 19, 14, 4, 13);          // held in front of the body
    else if (view === "down") drawTowerShield(p, c, shield.hx - (shield.hx < 16 ? 4 : 1), shield.hy - 7, 7, 12);
    else for (let y = 16; y <= 27; y++) p.set(shield.hx + (shield.hx < 16 ? -2 : 3), y, c.goldD); // only the rim shows from behind
  }
}

function drawHeld(p, c, cfg, view, weapon, shield, g) {
  const held = cfg.weapon || "none";
  const up = view === "up";
  const side = view === "side";
  const atk = g.attack || 0;

  if (held === "novice") {
    if (view === "side") {
      if (g.attack === 2) drawBlade(p, c, 23, 18 + g.bob, "right", 5);
      else if (g.attack === 1) drawBlade(p, c, weapon.hx, weapon.hy - 1, "up", 4);
      else drawBlade(p, c, weapon.hx + 1, weapon.hy + 1, "down", 4);
      return;
    }
    if (g.attack === 1) drawBlade(p, c, weapon.hx + 1, weapon.hy - 1, "up", 4);
    else drawBlade(p, c, weapon.hx + 1, weapon.hy + 1, "down", g.attack === 2 ? 6 : 4);
    drawBuckler(p, c, shield.hx + (shield.hx < 16 ? -1 : 2), shield.hy - 3);
    return;
  }

  const x = weapon.hx + (side ? 1 : weapon.hx < 16 ? 0 : 1);
  const hy = weapon.hy;

  // ---- Sword and axe: windup = raised, strike = forward (side) / downward (front) ----
  if (held === "sword" || held === "greatsword") {
    const len = held === "greatsword" ? 10 : 7;
    if (side && atk === 2) drawBlade(p, c, weapon.hx + 2, hy, "right", len - 1);
    else if (atk === 1) drawBlade(p, c, weapon.hx + 1, hy - 1, "up", len);
    else drawBlade(p, c, weapon.hx + 1, hy + 1, "down", Math.min(len, 33 - hy - 3));
    if (held === "greatsword" && !atk && !side) p.set(weapon.hx, hy + 2, c.goldD);
    return;
  }
  if (held === "axe") {
    if (side && atk === 2) drawAxe(p, c, weapon.hx + 2, hy, "right");
    else if (atk === 2) drawAxe(p, c, weapon.hx + 1, hy + 1, "down");
    else drawAxe(p, c, weapon.hx + 1, hy, "up");
    return;
  }

  // ---- Staff: follows the hand; sparkles while casting ----
  if (held === "staff") {
    const sx = side && atk === 2 ? 24 : x;
    const top = Math.max(3, hy - 14);
    drawPole(p, c, sx, top, Math.min(33, hy + 10), sx === x ? weapon : null, c.wood, c.woodD);
    p.rows([[top - 3, sx, sx], [top - 2, sx - 1, sx + 1], [top - 1, sx, sx]], c.crystal);
    p.set(sx, top - 2, c.white);
    p.set(sx + 1, top - 2, c.crystalD);
    if (atk) drawSparkle(p, c, sx, top - 2);
    return;
  }
  if (held === "wand") {
    if (side && atk === 2) {
      for (let i = 0; i < 4; i++) p.set(weapon.hx + 2 + i, hy, c.woodD);
      p.set(weapon.hx + 6, hy, c.crystal);
      drawSparkle(p, c, weapon.hx + 7, hy);
    } else {
      drawPole(p, c, x, hy - 4, hy + 1, weapon, c.woodD, c.wood);
      p.set(x, hy - 5, c.crystal);
      if (atk) drawSparkle(p, c, x, hy - 6);
    }
    return;
  }
  if (held === "lance") {
    if (atk && (side || view === "down")) {
      if (side) {
        // Pointing forward; pulled back in the windup
        const back = atk === 1 ? 4 : 0;
        const y = atk === 2 ? hy : hy - 1;
        for (let i = weapon.hx - 7 - back; i <= 27 - back; i++) if (i < weapon.hx || i > weapon.hx + 1) p.set(i, y, i % 5 === 0 ? c.belt : c.woodD);
        p.rows([[y - 1, 28 - back, 29 - back], [y, 28 - back, 31 - back], [y + 1, 28 - back, 29 - back]], c.metal);
      } else {
        // Facing the viewer: short shaft, the blade below the hand
        drawPole(p, c, x, hy - 6, hy + 7, weapon, c.woodD, c.belt);
        p.rows([[hy + 8, x - 1, x + 1], [hy + 9, x - 1, x + 1], [hy + 10, x, x]], c.metal);
      }
      return;
    }
    drawPole(p, c, x, 4, 33, weapon, c.woodD, c.belt);
    p.rows([[0, x, x], [1, x, x + 1], [2, x - 1, x + 1], [3, x - 1, x + 1]], c.metal);
    p.set(x - 1, 3, c.metalD);
    if (!up) p.rows([[5, x + 1, x + 3], [6, x + 1, x + 2], [7, x + 1, x + 1]], c.plume);   // banner
    return;
  }
  if (held === "scepter") {
    const sx = side && atk === 2 ? 24 : x;
    const sy = side && atk === 2 ? 12 : hy - 6;
    drawPole(p, c, sx, sy, sy + 9, sx === x ? weapon : null, c.gold, c.goldD);
    p.rows([[sy - 2, sx, sx + 1], [sy - 1, sx, sx + 1]], c.gem);
    p.set(sx, sy - 2, c.white);
    if (atk) drawSparkle(p, c, sx, sy - 2);
    return;
  }

  // ---- Bow and arrow ----
  if (held === "bow") {
    if (side) {
      // Held in front; on the strike the arm is raised, string drawn, arrow nocked
      if (atk === 2) {
        drawBowV(p, c, 24, 10, 1, 3);
        for (let i = 18; i <= 27; i++) p.set(i, 18, i === 27 ? c.white : c.woodD);
        p.set(18, 17, c.plume); p.set(18, 19, c.plume);
      } else {
        drawBowV(p, c, weapon.hx + 2, hy - 8, 1, 0);
      }
      return;
    }
    const sx = shield.hx + (shield.hx < 16 ? -1 : 2);
    const dir = shield.hx < 16 ? -1 : 1;
    drawBowV(p, c, sx, 13 + g.bob, dir, atk === 2 ? 2 : 0);
    return;
  }
  if (held === "crossbow") {
    if (side) drawCrossbow(p, c, atk === 2 ? 19 : weapon.hx, atk === 2 ? 18 : hy + 1, "right");
    else drawCrossbow(p, c, x, hy, "down");
    return;
  }

  if (held === "flask") {
    const fx = weapon.hx, fy = weapon.hy + 2;
    p.set(fx, fy, c.wood);
    p.rect(fx - 1, fy + 1, 3, 3, c.glass);
    p.set(fx + 1, fy + 2, c.glassD); p.set(fx + 1, fy + 3, c.glassD);
    p.set(fx - 1, fy + 1, c.white);
  } else if (held === "book") {
    const bx = shield.hx + (shield.hx < 16 ? -3 : 1), by = shield.hy - 3;
    p.rect(bx, by, 4, 5, c.book);
    p.rect(bx, by, 4, 1, c.gold);
    p.set(bx + 3, by + 2, c.gold);
  }
}

// ---- HEAD and FACE ----
const HEAD_FRONT = [[3, 11, 20], [4, 10, 21], [5, 9, 22], [6, 9, 22], [7, 9, 22], [8, 9, 22], [9, 9, 22], [10, 9, 22], [11, 9, 22], [12, 10, 21], [13, 11, 20]];
const HEAD_SIDE = [[3, 12, 19], [4, 11, 20], [5, 10, 21], [6, 10, 21], [7, 10, 21], [8, 10, 21], [9, 10, 21], [10, 10, 21], [11, 10, 21], [12, 11, 20], [13, 12, 19]];

function drawHead(p, c, cfg, dy, view) {
  const rows = view === "side" ? HEAD_SIDE : HEAD_FRONT;
  rows.forEach(([y, x0, x1]) => {
    for (let x = x0; x <= x1; x++) p.set(x, y + dy, x >= x1 - 1 && view !== "side" ? c.skinD : c.skin);
  });
  // neck
  const nx = view === "side" ? 14 : 15;
  p.set(nx, 14 + dy, c.skinD); p.set(nx + 1, 14 + dy, c.skinD);
  // chin (shade)
  if (view !== "side") for (let x = 12; x <= 19; x++) p.set(x, 13 + dy, c.skinD);

  if (cfg.face === "skull") {
    drawSkullFace(p, c, dy, view);
    return;
  }

  if (view === "down") {
    // ears
    p.set(8, 8 + dy, c.skin); p.set(8, 9 + dy, c.skinD);
    p.set(23, 8 + dy, c.skinD); p.set(23, 9 + dy, c.skinDD);
    // eyebrows
    p.rows([[7, 12, 13], [7, 18, 19]], c.hairD, dy);
    // eyes: lashes, iris with a glint, lower shade
    [[12, 13], [18, 19]].forEach(([a, b]) => {
      p.set(a, 8 + dy, c.lash); p.set(b, 8 + dy, c.lash);
      p.set(a, 9 + dy, c.eye); p.set(b, 9 + dy, c.white);
      p.set(a, 10 + dy, c.eyeD); p.set(b, 10 + dy, c.eye);
    });
    if (cfg.body === "female") { p.set(11, 8 + dy, c.lash); p.set(20, 8 + dy, c.lash); }
    // nose and mouth
    p.set(16, 10 + dy, c.skinD);
    const mouth = cfg.body === "female" ? mix(c.skin, "#c2506e", 0.4) : c.skinDD;
    p.set(15, 12 + dy, mouth); p.set(16, 12 + dy, mouth);
    if (cfg.body === "female") {
      p.set(11, 11 + dy, mix(c.skin, c.blush, 0.45));
      p.set(20, 11 + dy, mix(c.skin, c.blush, 0.45));
    }
  } else if (view === "up") {
    p.set(8, 8 + dy, c.skin); p.set(8, 9 + dy, c.skinD);
    p.set(23, 8 + dy, c.skinD); p.set(23, 9 + dy, c.skinDD);
  } else {
    // side: one eye, nose, mouth, ear
    p.rows([[7, 18, 19]], c.hairD, dy);
    p.set(18, 8 + dy, c.lash); p.set(19, 8 + dy, c.lash);
    p.set(18, 9 + dy, c.white); p.set(19, 9 + dy, c.eye);
    p.set(19, 10 + dy, c.eyeD);
    if (cfg.body === "female") p.set(20, 8 + dy, c.lash);
    p.set(22, 9 + dy, c.skin); p.set(22, 10 + dy, c.skinD);          // nose
    p.set(20, 12 + dy, c.skinDD);                                      // bibig
    p.set(14, 8 + dy, c.skinD); p.set(14, 9 + dy, c.skinDD);          // ears
    if (cfg.body === "female") p.set(20, 11 + dy, mix(c.skin, c.blush, 0.45));
  }
}

// Skull (skeleton): hollow eyes with a red glow, nose and teeth
function drawSkullFace(p, c, dy, view) {
  const hole = "#1b1b2f", glow = "#ff3b3b";
  if (view === "down") {
    [[11, 13], [18, 20]].forEach(([a, b]) => {
      for (let y = 8; y <= 10; y++) for (let x = a; x <= b; x++) p.set(x, y + dy, hole);
      p.set(a + 1, 9 + dy, glow);
    });
    p.set(15, 11 + dy, hole); p.set(16, 11 + dy, hole);
    for (let x = 13; x <= 18; x++) p.set(x, 13 + dy, x % 2 ? c.skin : c.skinDD);
  } else if (view === "side") {
    for (let y = 8; y <= 10; y++) for (let x = 17; x <= 19; x++) p.set(x, y + dy, hole);
    p.set(19, 9 + dy, glow);
    p.set(21, 10 + dy, hole);
    for (let x = 17; x <= 21; x++) p.set(x, 12 + dy, x % 2 ? c.skin : c.skinDD);
  }
}

// Beard (hair colour) and glasses
function drawFaceExtras(p, c, cfg, dy, view) {
  if (cfg.beard && view !== "up") {
    const B = c.hair, D = c.hairD;
    if (view === "down") {
      for (let y = 8; y <= 11; y++) { p.set(9, y + dy, B); p.set(22, y + dy, D); }
      p.rows([[11, 13, 18]], B, dy);                                   // moustache
      p.rows([[12, 10, 14], [12, 17, 21], [13, 11, 20], [14, 13, 18]], B, dy);
      p.set(20, 12 + dy, D); p.set(21, 12 + dy, D); p.set(19, 13 + dy, D); p.set(20, 13 + dy, D);
      p.set(15, 12 + dy, c.skinDD); p.set(16, 12 + dy, c.skinDD);    // bibig
    } else {
      for (let y = 8; y <= 10; y++) p.set(16, y + dy, B);
      p.rows([[11, 16, 21], [12, 16, 19], [13, 16, 20], [14, 17, 19]], B, dy);
      p.set(16, 12 + dy, D); p.set(20, 12 + dy, c.skinDD);
    }
  }
  if (cfg.glasses && view !== "up") {
    const F = c.frame;
    if (view === "down") {
      p.rows([[8, 11, 14], [8, 17, 20], [10, 11, 11], [10, 14, 14], [10, 17, 17], [10, 20, 20]], F, dy);
      p.set(11, 9 + dy, F); p.set(14, 9 + dy, F); p.set(17, 9 + dy, F); p.set(20, 9 + dy, F);
      p.set(15, 9 + dy, F); p.set(16, 9 + dy, F);
    } else {
      p.rows([[8, 17, 20], [10, 17, 20]], F, dy);
      p.set(17, 9 + dy, F); p.set(20, 9 + dy, F);
      p.rows([[9, 14, 16]], F, dy);
    }
  }
}

// Pointed elf ears (poking out of the hair)
function drawElfEars(p, c, dy, view) {
  if (view === "down" || view === "up") {
    p.set(7, 6 + dy, c.skin); p.set(7, 7 + dy, c.skin); p.set(8, 7 + dy, c.skin); p.set(8, 8 + dy, c.skin); p.set(8, 9 + dy, c.skinD);
    p.set(24, 6 + dy, c.skinD); p.set(24, 7 + dy, c.skinD); p.set(23, 7 + dy, c.skinD); p.set(23, 8 + dy, c.skinD); p.set(23, 9 + dy, c.skinDD);
  } else {
    p.set(12, 5 + dy, c.skin); p.set(13, 6 + dy, c.skin); p.set(13, 7 + dy, c.skin); p.set(14, 8 + dy, c.skinD); p.set(14, 9 + dy, c.skinDD);
  }
}

// ---- HAIR ----
// Back layer (behind the body in front/side views)
function drawHairBack(p, c, cfg, dy, view) {
  const H = c.hair, D = c.hairD;
  const st = cfg.hairStyle;
  if (view === "down") {
    if (st === "long") {
      for (let y = 5; y <= 22; y++) for (let x = 8; x <= 23; x++) p.set(x, y + dy, x >= 21 ? D : H);
      p.rows([[23, 10, 21]], D, dy);
    } else if (st === "bob") {
      for (let y = 5; y <= 13; y++) for (let x = 8; x <= 23; x++) p.set(x, y + dy, x >= 21 ? D : H);
    } else if (st === "twintails") {
      drawTail(p, c, 5, 7, dy, false);
      drawTail(p, c, 25, 7, dy, true);
    } else if (st === "ponytail") {
      for (let y = 9; y <= 17; y++) { p.set(23, y + dy, H); p.set(24, y + dy, D); }
    }
  } else if (view === "side") {
    if (st === "long") {
      for (let y = 5; y <= 21; y++) for (let x = 7; x <= 14; x++) p.set(x, y + dy, x <= 8 ? D : H);
    } else if (st === "bob") {
      for (let y = 5; y <= 13; y++) for (let x = 8; x <= 14; x++) p.set(x, y + dy, x <= 9 ? D : H);
    } else if (st === "ponytail") {
      for (let y = 5; y <= 16; y++) {
        const x = 7 + (y > 11 ? -1 : 0);
        p.set(x, y + dy, H); p.set(x + 1, y + dy, H); p.set(x + 2, y + dy, D);
      }
      p.set(10, 5 + dy, c.tie); p.set(10, 6 + dy, c.tie);
    } else if (st === "twintails") {
      drawTail(p, c, 8, 7, dy, false);
    }
  }
}

function drawTail(p, c, cx, top, dy, right) {
  const widths = [2, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1];
  widths.forEach((w, j) => {
    for (let i = 0; i < w; i++) {
      const x = right ? cx - 1 + i : cx - w + 2 + i;
      p.set(x, top + j + dy, i === w - 1 ? c.hairD : c.hair);
    }
  });
  p.set(cx, top - 1 + dy, c.tie);
  p.set(cx + (right ? -1 : 1), top - 1 + dy, c.tie);
}

// Front layer (over the head)
function drawHairFront(p, c, cfg, dy, view) {
  const H = c.hair, D = c.hairD, L = c.hairL;
  const st = cfg.hairStyle;
  if (st === "none") return;

  if (view === "up") {
    // Back of the head: all hair
    if (st === "buzz") {
      HEAD_FRONT.forEach(([y, x0, x1]) => { if (y <= 10) for (let x = x0; x <= x1; x++) p.set(x, y + dy, D); });
    } else {
      HEAD_FRONT.forEach(([y, x0, x1]) => { for (let x = x0; x <= x1; x++) p.set(x, y + dy, x >= x1 - 1 ? D : H); });
      p.rows([[1, 12, 19], [2, 10, 21]], H, dy);
      p.rows([[3, 12, 15]], L, dy);
      if (st === "spiky") [11, 14, 17, 20].forEach((x) => p.set(x, 0 + dy, H));
    }
    if (st === "long") {
      for (let y = 10; y <= 22; y++) for (let x = 9; x <= 22; x++) p.set(x, y + dy, x >= 21 ? D : H);
      p.rows([[23, 11, 20]], D, dy);
    } else if (st === "bob") {
      for (let y = 10; y <= 14; y++) for (let x = 8; x <= 23; x++) p.set(x, y + dy, x >= 21 ? D : H);
    } else if (st === "ponytail") {
      p.set(15, 8 + dy, c.tie); p.set(16, 8 + dy, c.tie);
      for (let y = 9; y <= 19; y++) { p.set(15, y + dy, H); p.set(16, y + dy, y > 16 ? D : H); if (y < 16) p.set(14, y + dy, H); }
    } else if (st === "twintails") {
      drawTail(p, c, 6, 7, dy, false);
      drawTail(p, c, 25, 7, dy, true);
    }
    return;
  }

  if (view === "side") {
    if (st === "buzz") {
      p.rows([[2, 12, 19], [3, 11, 20], [4, 10, 20]], D, dy);
      for (let y = 5; y <= 8; y++) for (let x = 10; x <= 13; x++) p.set(x, y + dy, D);
      return;
    }
    p.rows([[1, 12, 18], [2, 10, 20], [3, 9, 21], [4, 9, 21], [5, 9, 21]], H, dy);
    p.rows([[2, 13, 16], [3, 12, 14]], L, dy);
    for (let y = 6; y <= 10; y++) for (let x = 9; x <= 13; x++) p.set(x, y + dy, x <= 10 ? D : H);
    p.rows([[6, 16, 16], [7, 16, 16], [8, 16, 16]], H, dy);                 // sideburns
    p.rows([[6, 19, 21], [7, 21, 21]], H, dy);                              // front bangs
    p.set(21, 6 + dy, D);
    if (st === "spiky") {
      [11, 14, 17].forEach((x) => p.set(x, 0 + dy, H));
      p.set(8, 3 + dy, H); p.set(8, 6 + dy, D); p.set(22, 5 + dy, H);
    }
    if (st === "long" || st === "bob") for (let y = 6; y <= 12; y++) p.set(15, y + dy, H);
    return;
  }

  // ---- front (down) ----
  if (st === "buzz") {
    p.rows([[2, 12, 19], [3, 10, 21], [4, 9, 22]], D, dy);
    for (let y = 5; y <= 7; y++) { p.set(9, y + dy, D); p.set(22, y + dy, D); }
    return;
  }
  p.rows([[1, 12, 19], [2, 10, 21], [3, 9, 22], [4, 9, 22], [5, 9, 22]], H, dy);
  p.rows([[2, 12, 15], [3, 11, 13]], L, dy);
  for (let y = 3; y <= 5; y++) { p.set(21, y + dy, D); p.set(22, y + dy, D); }
  // shaped bangs
  [9, 10, 12, 13, 16, 19, 21, 22].forEach((x) => p.set(x, 6 + dy, x >= 21 ? D : H));
  [9, 10, 13, 21, 22].forEach((x) => p.set(x, 7 + dy, D));
  // side
  const sideLen = st === "long" || st === "bob" ? 12 : 8;
  for (let y = 6; y <= sideLen; y++) {
    p.set(9, y + dy, H); p.set(22, y + dy, D);
    if (sideLen > 8) { p.set(8, y + dy, H); p.set(23, y + dy, D); }
  }
  if (st === "bob") { p.set(10, 13 + dy, H); p.set(21, 13 + dy, D); }
  if (st === "spiky") {
    [11, 14, 17, 20].forEach((x) => p.set(x, 0 + dy, H));
    p.rows([[1, 10, 21]], H, dy);
    p.set(8, 3 + dy, H); p.set(23, 3 + dy, D);
    [11, 14, 18].forEach((x) => p.set(x, 7 + dy, H));
  }
  if (st === "twintails") { p.set(8, 7 + dy, c.tie); p.set(23, 7 + dy, c.tie); }
}

// ---- HEADGEAR ----
function drawHeadgear(p, c, cfg, dy, view) {
  const hg = cfg.headgear;
  if (!hg) return;
  const side = view === "side";

  if (hg === "crown") {
    const [x0, x1] = side ? [10, 20] : [10, 21];
    p.rows([[2, x0, x1], [3, x0, x1]], c.gold, dy);
    p.rows([[3, x1 - 1, x1]], c.goldD, dy);
    const points = side ? [10, 14, 18] : [10, 13, 18, 21];
    points.forEach((x) => { p.set(x, 1 + dy, c.gold); p.set(x, 0 + dy, c.gold); });
    if (!side) { p.set(15, 2 + dy, c.gem); p.set(16, 2 + dy, c.gem); }
    else p.set(17, 2 + dy, c.gem);
  } else if (hg === "tiara") {
    const [x0, x1] = side ? [13, 20] : [12, 19];
    p.rows([[4, x0, x1]], c.gold, dy);
    if (!side && view !== "up") { p.set(15, 3 + dy, c.crystal); p.set(16, 3 + dy, c.crystal); p.set(15, 2 + dy, c.white); }
    if (side) p.set(19, 3 + dy, c.crystal);
  } else if (hg === "helmet") {
    const S = c.steel, D = c.steelD, L = c.steelL;
    if (view === "up") {
      HEAD_FRONT.forEach(([y, x0, x1]) => { for (let x = x0; x <= x1; x++) p.set(x, y + dy, x >= x1 - 1 ? D : S); });
      p.rows([[1, 11, 20], [2, 10, 21]], S, dy);
    } else if (side) {
      p.rows([[1, 11, 19], [2, 10, 20], [3, 9, 21], [4, 9, 21], [5, 9, 21], [6, 9, 21], [7, 9, 17]], S, dy);
      for (let y = 8; y <= 12; y++) for (let x = 9; x <= 15; x++) p.set(x, y + dy, x <= 10 ? D : S);
      p.rows([[3, 12, 15]], L, dy);
      p.rows([[7, 18, 21]], D, dy);                              // visor rim
    } else {
      p.rows([[1, 11, 20], [2, 10, 21], [3, 9, 22], [4, 9, 22], [5, 9, 22], [6, 9, 22]], S, dy);
      p.rows([[7, 9, 22]], D, dy);                                // visor rim
      for (let y = 8; y <= 11; y++) { p.set(9, y + dy, S); p.set(10, y + dy, S); p.set(21, y + dy, D); p.set(22, y + dy, D); }
      for (let y = 7; y <= 9; y++) { p.set(15, y + dy, S); p.set(16, y + dy, D); } // nose guard
      p.rows([[2, 12, 15], [3, 11, 13]], L, dy);
      for (let y = 2; y <= 6; y++) { p.set(21, y + dy, D); p.set(22, y + dy, D); }
    }
    // red plume
    if (side) p.rows([[0, 10, 15], [1, 8, 10], [2, 7, 9]], c.plume, dy);
    else p.rows([[0, 13, 18]], c.plume, dy);
  } else if (hg === "hat") {
    // Wizard hat: wide brim, golden band, tip bent backwards
    const H = c.cloth, D = c.clothD, L = c.clothL;
    if (side) {
      p.rows([[5, 6, 24]], D, dy);
      p.rows([[4, 9, 20]], c.gold, dy);
      p.rows([[3, 10, 19], [2, 10, 17], [1, 9, 15], [0, 7, 11]], H, dy);
      p.rows([[2, 12, 13], [3, 12, 14]], L, dy);
    } else {
      p.rows([[5, 6, 25]], D, dy);
      p.rows([[4, 10, 21]], c.gold, dy);
      p.rows([[3, 10, 21], [2, 11, 20], [1, 12, 19], [0, 13, 17]], H, dy);
      p.rows([[2, 12, 14], [3, 12, 14]], L, dy);
      p.rows([[1, 18, 19], [2, 19, 20], [3, 20, 21]], D, dy);
      if (view === "down") { p.set(15, 4 + dy, c.crystal); p.set(16, 4 + dy, c.crystal); }
    }
  } else if (hg === "hood") {
    // Hood: covers the hair, the face shows
    const H = c.cloth, D = c.clothD, L = c.clothL;
    if (view === "up") {
      HEAD_FRONT.forEach(([y, x0, x1]) => { for (let x = x0; x <= x1; x++) p.set(x, y + dy, x >= x1 - 1 ? D : H); });
      p.rows([[1, 11, 20], [2, 10, 21]], H, dy);
      p.rows([[14, 10, 21], [15, 11, 20]], D, dy);
    } else if (side) {
      p.rows([[1, 11, 18], [2, 10, 19], [3, 9, 20], [4, 9, 21], [5, 9, 21]], H, dy);
      for (let y = 6; y <= 14; y++) for (let x = 9; x <= 15; x++) p.set(x, y + dy, x <= 10 ? D : H);
      p.rows([[6, 16, 21]], D, dy);
      p.rows([[2, 12, 15]], L, dy);
    } else {
      p.rows([[1, 11, 20], [2, 10, 21], [3, 9, 22], [4, 8, 23], [5, 8, 23]], H, dy);
      p.rows([[6, 10, 21]], D, dy);
      for (let y = 6; y <= 14; y++) { p.set(8, y + dy, H); p.set(9, y + dy, H); p.set(22, y + dy, D); p.set(23, y + dy, D); }
      p.rows([[2, 12, 15]], L, dy);
    }
  } else if (hg === "horns") {
    // Demon horns (curving out and up)
    const H = "#2b2b33", L = "#d8d0c0";
    if (side) {
      p.rows([[3, 11, 12], [2, 10, 11], [1, 9, 10], [0, 9, 9]], H, dy);
      p.set(9, 0 + dy, L);
    } else {
      p.rows([[3, 9, 10], [2, 8, 9], [1, 7, 8], [0, 7, 7]], H, dy);
      p.rows([[3, 21, 22], [2, 22, 23], [1, 23, 24], [0, 24, 24]], H, dy);
      p.set(7, 0 + dy, L); p.set(24, 0 + dy, L);
    }
  } else if (hg === "halo") {
    // Floating golden ring above the head
    p.rows([[0, 12, 19]], c.gold, dy);
    p.set(11, 1 + dy, c.gold); p.set(20, 1 + dy, c.goldD);
    p.rows([[0, 14, 16]], "#fff4b0", dy);
  } else if (hg === "headband") {
    if (side) {
      p.rows([[5, 9, 21]], c.tie, dy);
      p.rows([[5, 7, 8], [6, 6, 8], [7, 7, 7]], c.tie, dy);
    } else {
      p.rows([[5, 9, 22]], c.tie, dy);
      if (view === "up") { for (let y = 6; y <= 9; y++) { p.set(15, y + dy, c.tie); p.set(16, y + dy, y > 7 ? shade(c.tie, -0.3) : c.tie); } }
      else p.rows([[5, 23, 24], [6, 23, 25], [7, 24, 25]], shade(c.tie, -0.2), dy);
    }
  }
}

// ---- WINGS (angel). flap 0 = raised, 1 = lowered ----
const WING_UP = [[8, 3, 5], [9, 2, 7], [10, 2, 8], [11, 2, 9], [12, 3, 10], [13, 3, 11], [14, 4, 11], [15, 4, 11], [16, 5, 11], [17, 5, 10], [18, 6, 10], [19, 7, 9]];
const WING_DOWN = [[14, 6, 11], [15, 4, 11], [16, 3, 11], [17, 2, 10], [18, 2, 10], [19, 2, 9], [20, 3, 9], [21, 3, 8], [22, 4, 7], [23, 5, 6]];

function drawWings(p, c, dy, view, flap) {
  const shape = flap ? WING_DOWN : WING_UP;
  const wing = (mirror, dark, shift) => shape.forEach(([y, x0, x1]) => {
    for (let x = x0; x <= x1; x++) {
      let col = dark ? c.wingD : c.wing;
      if (x === x0 || (y % 3 === 0 && x < x1 - 1)) col = dark ? c.wingDD : c.wingD;   // feathers
      p.set(mirror ? FRAME_W - 1 - x : x + shift, y + dy, col);
    }
  });
  if (view === "side") {
    wing(false, true, 2);     // far wing (darker)
    wing(false, false, 4);
  } else {
    wing(false, false, 0);
    wing(true, true, 0);
  }
}

// ---- QUIVER on the back ----
function drawQuiver(p, c, dy, view) {
  const Q = c.belt, QL = c.wood;
  if (view === "side") {
    for (let y = 14; y <= 23; y++) { p.set(10, y + dy, Q); p.set(11, y + dy, QL); }
    [[9, 12], [10, 11], [11, 12]].forEach(([x, y]) => { p.set(x, y + dy, c.white); p.set(x, y + 1 + dy, c.plume); });
  } else if (view === "up") {
    for (let k = 0; k <= 9; k++) { p.set(13 + Math.floor(k / 2), 15 + k + dy, Q); p.set(14 + Math.floor(k / 2), 15 + k + dy, QL); }
    [[12, 13], [13, 12], [14, 13]].forEach(([x, y]) => { p.set(x, y + dy, c.white); p.set(x, y + 1 + dy, c.plume); });
  } else {
    [[21, 13], [22, 12], [23, 13]].forEach(([x, y]) => { p.set(x, y + dy, c.white); p.set(x, y + 1 + dy, c.plume); });
  }
}

// ==================== BUONG FRAME ====================
function renderFrame(cfg, dir, anim, i) {
  if (anim === "skill") {   // charge: ready pose with a growing aura, then the strike with a burst
    const p = renderPix(cfg, dir, "attack", i >= SKILL_FRAMES - 1 ? 1 : 0);
    const e = cfg.eyes ? hexToRgb(cfg.eyes) : [0, 0, 0];
    const col = e[0] + e[1] + e[2] > 300 ? cfg.eyes : "#ffd166";   // glowing eyes tint it, else gold
    if (i > 0) p.aura(col, Math.min(4, i));
    p.motes(i % 2 ? "#ffffff" : col, i >= SKILL_FRAMES - 1 ? 10 : 1 + i, i);
    return p.toCanvas();
  }
  return renderPix(cfg, dir, anim, i).toCanvas();
}

function renderPix(cfg, dir, anim, i) {
  const p = new Pix(FRAME_W, FRAME_H);
  const c = palette(cfg);
  const g = gait(anim, i);
  const dy = g.bob;
  const helmet = cfg.headgear === "helmet" || cfg.headgear === "hood";   // covers the hair
  const flap = i % 2;
  if (cfg.wings && dir !== "up") drawWings(p, c, dy, dir, flap);
  const drawLowerOutfit = (side, trim) => {
    if (cfg.outfit === "robe") drawRobeSkirt(p, c, dy, side, trim);
    else if (cfg.outfit === "coat") drawCoatTails(p, c, dy, side);
  };

  if (dir === "down" || dir === "up") {
    const back = dir === "up";
    const female = cfg.body === "female";
    const lx = female ? 9 : 8, rx = female ? 21 : 22;

    if (cfg.cape && !back) drawCape(p, c, dy, "down");
    if (cfg.quiver && !back) drawQuiver(p, c, dy, "down");
    if (!back && !helmet) drawHairBack(p, c, cfg, dy, "down");
    if (back && cfg.shield === "tower") drawShield(p, c, cfg, "up", { hx: female ? 21 : 22, hy: 23 + dy });

    // Legs and feet
    drawLegFront(p, c, cfg, 12, g.lLift);
    drawLegFront(p, c, cfg, 17, g.rLift);
    drawPelvis(p, c, cfg, false);
    if (cfg.legs === "skirt") drawSkirt(p, c, cfg, 0, false);
    drawLowerOutfit(false, !back);
    if (cfg.outfit === "gown") drawGownSkirt(p, c, dy, false);

    drawTorso(p, c, cfg, dy, dir);

    // Arms: in the back view the hands swap sides (right hand on the screen's right)
    let weaponArm, shieldArm;
    if (g.attack) {
      const wx = back ? lx : rx;
      const sx = back ? rx : lx;
      shieldArm = drawArmFront(p, c, cfg, sx, dy, 0, back ? 1 : 0);
      weaponArm = drawArmFront(p, c, cfg, wx, dy, g.attack === 1 ? -3 : 3, back ? 0 : 1);
    } else {
      const a = drawArmFront(p, c, cfg, lx, dy, g.lArm, 0);
      const b = drawArmFront(p, c, cfg, rx, dy, g.rArm, 1);
      weaponArm = back ? a : b;
      shieldArm = back ? b : a;
    }

    if (cfg.cape && back) drawCape(p, c, dy, "up");
    if (cfg.quiver && back) drawQuiver(p, c, dy, "up");
    if (cfg.wings && back) drawWings(p, c, dy, "up", flap);
    if (!back && cfg.shield) drawShield(p, c, cfg, dir, shieldArm);
    drawHeld(p, c, cfg, dir, weaponArm, shieldArm, g);

    drawHead(p, c, cfg, dy, dir);
    drawFaceExtras(p, c, cfg, dy, dir);
    if (back && !helmet) drawHairFront(p, c, cfg, dy, "up");
    if (!back && !helmet) drawHairFront(p, c, cfg, dy, "down");
    if (cfg.ears === "elf") drawElfEars(p, c, dy, dir);
    drawHeadgear(p, c, cfg, dy, dir);
  } else {
    // ---- SIDE (facing right) ----
    const s = g.stride;
    if (cfg.cape) drawCape(p, c, dy, "side");
    if (cfg.quiver) drawQuiver(p, c, dy, "side");
    if (!helmet) drawHairBack(p, c, cfg, dy, "side");

    // back arm (dark) behind the body
    const farArm = drawArmSide(p, c, cfg, dy, g.attack ? 0 : -s, true);
    if (cfg.weapon === "novice") drawBuckler(p, c, farArm.hx - 2, farArm.hy - 4);
    if (cfg.shield === "buckler") drawShield(p, c, cfg, "side", farArm);

    // legs: far leg first (dark), then the near one
    drawLegSide(p, c, cfg, 14 - 2 * s, s < 0 ? 1 : 0, true);
    drawLegSide(p, c, cfg, 14 + 2 * s, 0, false);
    drawPelvis(p, c, cfg, true);
    if (cfg.legs === "skirt") drawSkirt(p, c, cfg, 0, true);
    drawLowerOutfit(true, false);
    if (cfg.outfit === "gown") drawGownSkirt(p, c, dy, true);

    drawTorso(p, c, cfg, dy, "side");
    if (cfg.shield === "tower") drawShield(p, c, cfg, "side", farArm);   // in front of the body

    let arm;
    if (g.attack === 1) {
      arm = drawArmSide(p, c, cfg, dy, -3, false);
    } else if (g.attack === 2) {
      // horizontal forward thrust
      const y = 18 + dy;
      for (let x = 15; x <= 21; x++) {
        p.set(x, y, sleeveColor(c, cfg, x - 15, false));
        p.set(x, y + 1, sleeveColor(c, cfg, x - 15, true));
      }
      p.rect(22, y, 2, 2, c.glove);
      arm = { hx: 22, hy: y };
    } else {
      arm = drawArmSide(p, c, cfg, dy, s, false);
    }
    drawHeld(p, c, cfg, "side", arm, farArm, g);

    drawHead(p, c, cfg, dy, "side");
    drawFaceExtras(p, c, cfg, dy, "side");
    if (!helmet) drawHairFront(p, c, cfg, dy, "side");
    if (cfg.ears === "elf") drawElfEars(p, c, dy, "side");
    drawHeadgear(p, c, cfg, dy, "side");
  }

  p.detail();
  p.outline();
  return p;
}

// White silhouette (for the hit flash)
export function whiteOf(canvas) {
  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(canvas, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

// ==================== PUBLIC API ====================
export class Avatar {
  constructor(config) {
    this.config = normalizeConfig(config);
    this.cache = new Map();
  }

  // Frames in an animation: the Aseprite sheet's tag when there is one (sheetKey, js/avatar/sheets.js)
  count(dir, anim) {
    return (this.sheetKey && sheetCount(this.sheetKey, dir, anim)) || FRAMES[anim] || (anim === "skill" ? SKILL_FRAMES : 1);
  }

  // Whether this Avatar has the animation: drawn ones, "skill" (built from the attack) or a sheet's
  has(anim, dir = "down") {
    return !!(FRAMES[anim] || anim === "skill" || (this.sheetKey && sheetCount(this.sheetKey, dir, anim)));
  }

  frame(dir, anim, i) {
    const n = this.count(dir, anim);
    const idx = ((i % n) + n) % n;
    const img = this.sheetKey && sheetFrame(this.sheetKey, dir, anim, idx);
    if (img) return img;
    const key = `${dir}|${anim}|${idx}`;
    if (!this.cache.has(key)) this.cache.set(key, renderFrame(this.config, dir, anim, idx));
    return this.cache.get(key);
  }

  flashFrame(dir, anim, i) {
    const key = `w${sheetsVersion()}|${dir}|${anim}|${i}`;
    if (!this.cache.has(key)) this.cache.set(key, whiteOf(this.frame(dir, anim, i)));
    return this.cache.get(key);
  }

  // (x, y) = feet position in the world. flip = facing left (side only)
  // squash < 1 shortens the figure while keeping its width (dwarves)
  draw(ctx, x, y, dir, anim, i, flip = false, flash = false, scale = 1, squash = 1) {
    const img = flash ? this.flashFrame(dir, anim, i) : this.frame(dir, anim, i);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flip && dir === "side") ctx.scale(-1, 1);
    // A larger (sheet) frame keeps the same feet: extra width split left/right, extra height on top
    const ax = ANCHOR_X + Math.floor((img.width - FRAME_W) / 2), ay = ANCHOR_Y + (img.height - FRAME_H);
    ctx.drawImage(img, -ax * scale, -ay * scale * squash, img.width * scale, img.height * scale * squash);
    ctx.restore();
  }

  // Close-up of head and shoulders (for the dialogue portrait)
  drawPortrait(ctx, w, h) {
    const img = this.frame("down", "idle", 0);
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    // region x 4..28, y 0..22 (head down to the chest)
    ctx.drawImage(img, 4, 0, 24, 22, 0, 0, w, h);
  }
}
