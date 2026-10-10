// HD interface painters: the hero card, party list, meters, portrait frame, buttons and side-menu panels.
// Painted at twice the game's pixel density (2 art pixels = 1 game pixel), so the frames read as finer
// pixel art next to the 1× world. Each one is saved as aseprite/ui/<key>.aseprite on three layers
// (fill, frame, gems) with one frame; tools/aseprite/export.mjs writes assets/ui/<key>.png and the CSS
// uses it as a 9-slice border-image (slice sizes in UI_SLICES, mirrored in css/hud.css).
import { writeAse } from "../asefile.mjs";
import { SRC_DIR } from "../lib.mjs";
import path from "node:path";

const LAYERS = ["fill", "frame", "gems"];
const rgb = (h, a = 255) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a];

class Img {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  set(x, y, c) {
    if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d.set(c, (y * this.w + x) * 4);
  }
  rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c); }
  hline(x0, x1, y, c) { for (let x = x0; x <= x1; x++) this.set(x, y, c); }
  vline(x, y0, y1, c) { for (let y = y0; y <= y1; y++) this.set(x, y, c); }
  // One-pixel ring inset by `i` from the edge; top/left get `lit`, bottom/right `dark`, corners cut by `cut`
  ring(i, lit, dark = lit, cut = 0) {
    const { w, h } = this;
    this.hline(i + cut, w - 1 - i - cut, i, lit);
    this.vline(i, i + cut, h - 1 - i - cut, lit);
    this.hline(i + cut, w - 1 - i - cut, h - 1 - i, dark);
    this.vline(w - 1 - i, i + cut, h - 1 - i - cut, dark);
  }
}

// Palette: the Aethelgard gilt of the title frame, navy lacquer, and the cyan of the summoning sigil
const INK = rgb("#070b16"), GOLD_HI = rgb("#fff1b8"), GOLD = rgb("#e9b949"), GOLD_MID = rgb("#c48a2c"), GOLD_LO = rgb("#7c4f17"),
  GOLD_DK = rgb("#3d2408"), GEM_HI = rgb("#ecfeff"), GEM = rgb("#5eead4"), GEM_MID = rgb("#14b8a6"), GEM_LO = rgb("#0f5e63"),
  STEEL_HI = rgb("#9fc3e6"), STEEL = rgb("#4f79a6"), STEEL_LO = rgb("#22395a"), STEEL_DK = rgb("#111d33");

// Navy lacquer with a soft top-lit gradient and a 2×2 Bayer grain (alpha a)
function lacquer(img, x0, y0, x1, y1, top, bottom, a = 235) {
  const B = [[0, 2], [3, 1]], A = rgb(top), Z = rgb(bottom);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const t = (y - y0) / Math.max(1, y1 - y0) + (B[y & 1][x & 1] - 1.5) * 0.05;
    img.set(x, y, [0, 1, 2].map((k) => Math.round(A[k] + (Z[k] - A[k]) * Math.max(0, Math.min(1, t)))).concat(a));
  }
}

// A cut-cornered diamond gem with a glint (5×5 or 7×7), on a gold setting
function gem(img, cx, cy, r, setting = true) {
  if (setting) for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
    const d = Math.abs(x) + Math.abs(y);
    if (d === r + 1) img.set(cx + x, cy + y, x + y < 0 ? GOLD_HI : x + y > 0 ? GOLD_LO : GOLD);
  }
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = Math.abs(x) + Math.abs(y);
    if (d > r) continue;
    img.set(cx + x, cy + y, d === r ? GEM_LO : x + y < 0 ? GEM : GEM_MID);
  }
  img.set(cx - 1, cy - 1, GEM_HI);
  if (r >= 2) img.set(cx - 1, cy - 2 + (r > 2 ? 0 : 1), GEM_HI);
}

// Gilt band: outline, three gold rows lit from the top-left, a dark groove, a thin inner gold line
function gilt(L, o = 0, cut = 3) {
  const f = L.frame;
  f.ring(o, INK, INK, cut);
  f.ring(o + 1, GOLD_HI, GOLD_LO, cut);
  f.ring(o + 2, GOLD, GOLD_MID, cut - 1);
  f.ring(o + 3, GOLD_MID, GOLD_LO, Math.max(0, cut - 2));
  f.ring(o + 4, GOLD_DK, GOLD_DK);
  f.ring(o + 5, GOLD_LO, GOLD_MID);
  // chamfered corners of the outline
  for (let k = 0; k < cut; k++) [[o + k, o + cut - k], [f.w - 1 - o - k, o + cut - k], [o + k, f.h - 1 - o - cut + k], [f.w - 1 - o - k, f.h - 1 - o - cut + k]]
    .forEach(([x, y]) => f.set(x, y, INK));
}

function steel(L, o = 0, cut = 2) {
  const f = L.frame;
  f.ring(o, INK, INK, cut);
  f.ring(o + 1, STEEL_HI, STEEL_LO, cut);
  f.ring(o + 2, STEEL, STEEL_LO, Math.max(0, cut - 1));
  f.ring(o + 3, STEEL_DK, STEEL_DK);
  for (let k = 0; k < cut; k++) [[o + k, o + cut - k], [f.w - 1 - o - k, o + cut - k], [o + k, f.h - 1 - o - cut + k], [f.w - 1 - o - k, f.h - 1 - o - cut + k]]
    .forEach(([x, y]) => f.set(x, y, INK));
}

// Small cyan studs at the middle of each edge (they repeat along the edge with border-image "round")
function studs(L, inset) {
  const g = L.gems, mx = Math.floor(g.w / 2), my = Math.floor(g.h / 2);
  [[mx - 1, inset], [mx - 1, g.h - 1 - inset - 1], [inset, my - 1], [g.w - 1 - inset - 1, my - 1]].forEach(([x, y]) => {
    g.set(x, y, GEM_HI); g.set(x + 1, y, GEM); g.set(x, y + 1, GEM_MID); g.set(x + 1, y + 1, GEM_LO);
  });
}

const PAINTERS = {
  // Hero card (top-right status) and the in-game overlays: gilt band, gem corners, navy lacquer
  hud_panel: { w: 48, h: 48, slice: 14, paint(L) {
    lacquer(L.fill, 5, 5, 42, 42, "#121d36", "#070c19", 222);
    gilt(L, 0, 3);
    studs(L, 2);
    [[5, 5], [42, 5], [5, 42], [42, 42]].forEach(([x, y]) => gem(L.gems, x, y, 2));
  } },
  // Party slot (off-field member): steel band on a translucent lacquer
  party_slot: { w: 32, h: 24, slice: 8, paint(L) {
    lacquer(L.fill, 3, 3, 28, 20, "#101a30", "#060a15", 200);
    steel(L, 0, 2);
  } },
  // Party slot of the member on the field: lit gilt, a gem on the left edge
  party_slot_on: { w: 32, h: 24, slice: 8, paint(L) {
    lacquer(L.fill, 3, 3, 28, 20, "#1f2b47", "#0b1224", 228);
    const f = L.frame;
    f.ring(0, INK, INK, 2);
    f.ring(1, GOLD_HI, GOLD_MID, 2);
    f.ring(2, GOLD, GOLD_LO, 1);
    f.ring(3, GOLD_DK, GOLD_DK);
    gem(L.gems, 3, 11, 2);
  } },
  // Portrait window: ornate square frame with four gems and a teal vignette behind the head
  portrait: { w: 32, h: 32, slice: 8, paint(L) {
    for (let y = 4; y < 28; y++) for (let x = 4; x < 28; x++) {
      const d = Math.hypot(x - 15.5, y - 12) / 18;
      const B = [[0, 2], [3, 1]][y & 1][x & 1] / 4 - 0.4;
      const t = Math.max(0, Math.min(1, d + B * 0.12));
      L.fill.set(x, y, [Math.round(30 - 20 * t), Math.round(64 - 50 * t), Math.round(82 - 56 * t), 255]);
    }
    const f = L.frame;
    f.ring(0, INK, INK, 2);
    f.ring(1, GOLD_HI, GOLD_LO, 2);
    f.ring(2, GOLD, GOLD_MID, 1);
    f.ring(3, GOLD_DK, GOLD_DK);
    [[2, 2], [29, 2], [2, 29], [29, 29]].forEach(([x, y]) => gem(L.gems, x, y, 1, false));
  } },
  // Meter trough: recessed slot with a gold lip (HP, stamina, EXP, party HP)
  bar: { w: 16, h: 12, slice: 4, paint(L) {
    L.fill.rect(3, 3, 10, 6, rgb("#04070f"));
    L.fill.hline(3, 12, 3, rgb("#000000"));
    const f = L.frame;
    f.ring(0, INK, INK, 1);
    f.ring(1, GOLD_LO, GOLD_HI, 1);
    f.ring(2, GOLD_DK, GOLD_MID);
  } },
  // Keycap chip (party switch keys, hotkeys)
  key: { w: 12, h: 12, slice: 4, paint(L) {
    lacquer(L.fill, 2, 2, 9, 8, "#334866", "#1a2740", 255);
    const f = L.frame;
    f.ring(0, INK, INK, 1);
    f.hline(2, 9, 1, STEEL_HI); f.vline(1, 2, 8, STEEL);
    f.vline(10, 2, 8, STEEL_LO); f.hline(2, 9, 9, STEEL_LO);
    f.hline(1, 10, 10, STEEL_DK);
  } },
  // Side-menu sections (map, options, quest, log): steel band with gilt corner caps and cyan studs
  side_panel: { w: 40, h: 40, slice: 10, paint(L) {
    lacquer(L.fill, 3, 3, 36, 36, "#0c1527", "#070c18", 240);
    steel(L, 0, 2);
    studs(L, 1);
    const g = L.gems;
    [[0, 0, 1, 1], [39, 0, -1, 1], [0, 39, 1, -1], [39, 39, -1, -1]].forEach(([x, y, sx, sy]) => {
      for (let k = 0; k < 7; k++) { g.set(x + sx * k, y, k === 0 ? INK : GOLD); g.set(x, y + sy * k, k === 0 ? INK : GOLD); }
      for (let k = 1; k < 6; k++) { g.set(x + sx * k, y + sy, k < 3 ? GOLD_HI : GOLD_MID); g.set(x + sx, y + sy * k, k < 3 ? GOLD_HI : GOLD_MID); }
      g.set(x + sx * 7, y, INK); g.set(x, y + sy * 7, INK);
      g.set(x + sx * 2, y + sy * 2, GEM);
    });
  } },
  // Side-menu buttons: idle and lit (hover / selected / active)
  button: { w: 24, h: 24, slice: 6, paint(L) {
    lacquer(L.fill, 2, 2, 21, 21, "#162540", "#0b1426", 240);
    const f = L.frame;
    f.ring(0, INK, INK, 1);
    f.ring(1, STEEL, STEEL_LO, 1);
    f.ring(2, STEEL_DK, STEEL_DK);
    f.hline(3, 20, 3, rgb("#22355a"));
  } },
  button_on: { w: 24, h: 24, slice: 6, paint(L) {
    lacquer(L.fill, 2, 2, 21, 21, "#3a2d12", "#1d1607", 245);
    const f = L.frame;
    f.ring(0, INK, INK, 1);
    f.ring(1, GOLD_HI, GOLD_LO, 1);
    f.ring(2, GOLD_MID, GOLD_DK);
    f.hline(3, 20, 3, rgb("#5c4718"));
  } }
};

// Meter fills: a 2×12 strip (repeat-x, stretched to the trough height) lit from the top
const FILLS = { hp: ["#bbf7d0", "#4ade80", "#16a34a", "#0f6b31"], hp_mid: ["#fde68a", "#f59e0b", "#c2710c", "#7c3f06"],
  hp_low: ["#fecaca", "#ef4444", "#b91c1c", "#6b1010"], st: ["#fef9c3", "#facc15", "#ca8a04", "#713f12"],
  xp: ["#e0f2fe", "#38bdf8", "#0284c7", "#0c4a6e"], shield: ["#f5f3ff", "#a78bfa", "#7c3aed", "#3b1a78"] };
for (const [k, [hi, mid, lo, dk]] of Object.entries(FILLS)) PAINTERS[`fill_${k}`] = { w: 2, h: 12, paint(L) {
  const rows = [hi, hi, mid, mid, mid, mid, lo, mid, lo, lo, lo, dk];
  rows.forEach((c, y) => L.fill.hline(0, 1, y, rgb(c)));
  L.frame.set(0, 2, rgb(hi, 160));   // a glint every other pixel on the highlight row
} };

export const UI_KEYS = Object.keys(PAINTERS);
export const UI_SLICES = Object.fromEntries(Object.entries(PAINTERS).map(([k, p]) => [k, p.slice || 0]));

/** Paint aseprite/ui/<key>.aseprite (one frame, layers fill / frame / gems). */
export function paintUi(key) {
  const p = PAINTERS[key];
  if (!p) throw new Error(`unknown ui key "${key}"`);
  const L = Object.fromEntries(LAYERS.map((n) => [n, new Img(p.w, p.h)]));
  p.paint(L);
  const out = path.join(SRC_DIR, "ui", `${key}.aseprite`);
  writeAse(out, { w: p.w, h: p.h, layers: LAYERS, frames: [{ duration: 0.1, cels: Object.fromEntries(LAYERS.map((n) => [n, L[n].d])) }] });
  console.log(`aseprite/ui/${key}.aseprite  ${p.w}×${p.h}${p.slice ? `, slice ${p.slice}` : ""}`);
}

export function uiSubjects() {
  return Object.fromEntries(UI_KEYS.map((k) => [`ui/${k}`, () => paintUi(k)]));
}
