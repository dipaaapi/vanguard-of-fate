// ============================================================
// ISLANDS: tile-based floating-island maps in open water.
// A map is a grid of land / water cells (16x16 game pixels each). Every
// edge is worked out from the neighbours (autotiling), so any island shape
// gets the right look: a grass top with flowers, a rim of dark blades,
// rounded outer corners and filled inner corners, a brown cliff face under
// every south edge, a white foam line hugging land and cliff, and animated
// water with drifting caustic cells.
//
//   const map = IslandMap.fromRows(["..##..", ".####.", "......"], { seed: 7 });
//   map.draw(ctx, camX, camY, viewW, viewH, tick);   // tick = frames (60/s)
//
// Static parts are baked once (land + cliffs in one canvas, foam in four
// frames); water is one 64x64 tile with 16 frames, so a frame costs a few
// pattern fills and drawImage calls.
// ============================================================
import { TILE, mulberry32 } from "./tileset.js";

export const CLIFF_H = 12;     // cliff face height under a south edge (game px)
const WATER_TILE = 64;         // water texture repeats every 64 px
const WATER_FRAMES = 16;
const WATER_STEP = 8;          // ticks per water frame
const FOAM_FRAMES = 4;
const FOAM_STEP = 14;          // ticks per foam frame

export const ISLAND_PALETTE = {
  grass: ["#3cab33", "#45b838", "#37a02e", "#4fc23d"],
  blade: "#257a28", bladeLight: "#6ed24e", bladeTip: "#8fe05c",
  rim: "#1d5c22", lip: "#174a1c",
  flowers: [["#f8e25a", "#fff7b0"], ["#ffffff", "#dde9ff"], ["#ff8fa8", "#ffd1dc"]],
  speck: ["#4a3320", "#6e4c2c"],
  cliff: ["#8a5a34", "#7b4e2c", "#966640", "#6d4427"],
  cliffLight: "#b07c4a", cliffDark: "#4f3119", cliffTop: "#2e1c0f", cliffCrack: "#5a381d",
  foam: "#f6fbff", foam2: "#a9dcff", foamWave: "#d4eeff", shade: "#16489e",
  water: { base: "#2671da", deep: "#1a52b4", mid: "#3a8cea", line: "#5cb4f8", glint: "#8fd2ff" }
};

// Integer hash -> [0,1)
function h2(x, y, s) {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1103515245);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function rgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

// ---------------- WATER (shared by every map) ----------------
// Voronoi cells on a torus so the tile wraps: light lines where two cells
// meet, dark rounded blobs in the middle of big cells. Seeds circle slowly,
// one loop per 16 frames, so the animation loops seamlessly.
let waterFrames = null;
export function buildWaterFrames(pal = ISLAND_PALETTE.water) {
  if (waterFrames) return waterFrames;
  const rnd = mulberry32(0x5eaf00d);
  const seeds = [];
  for (let i = 0; i < 11; i++) {
    seeds.push({ x: rnd() * WATER_TILE, y: rnd() * WATER_TILE, r: 1.5 + rnd() * 2.5, p: rnd() * Math.PI * 2, d: rnd() < 0.5 ? 1 : -1 });
  }
  const C = { base: rgb(pal.base), deep: rgb(pal.deep), line: rgb(pal.line), mid: rgb(pal.mid), glint: rgb(pal.glint) };
  waterFrames = [];
  for (let f = 0; f < WATER_FRAMES; f++) {
    const a = (f / WATER_FRAMES) * Math.PI * 2;
    const pts = seeds.map((s) => [s.x + Math.cos(a * s.d + s.p) * s.r, s.y + Math.sin(a * s.d + s.p) * s.r]);
    const c = makeCanvas(WATER_TILE, WATER_TILE);
    const g = c.getContext("2d");
    const img = g.createImageData(WATER_TILE, WATER_TILE);
    for (let y = 0; y < WATER_TILE; y++) {
      for (let x = 0; x < WATER_TILE; x++) {
        let f1 = 1e9, f2 = 1e9;
        for (const [sx, sy] of pts) {
          let dx = Math.abs(x + 0.5 - sx) % WATER_TILE; if (dx > WATER_TILE / 2) dx = WATER_TILE - dx;
          let dy = Math.abs(y + 0.5 - sy) % WATER_TILE; if (dy > WATER_TILE / 2) dy = WATER_TILE - dy;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
        }
        const e = f2 - f1;
        let col = C.base;
        if (e < 0.9) col = h2(x, y, f) < 0.1 ? C.glint : C.line;
        else if (e < 1.9) col = C.mid;
        else if (e > 4.5) col = C.deep;
        const i = (y * WATER_TILE + x) * 4;
        img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    waterFrames.push(c);
  }
  return waterFrames;
}

// ---------------- MAP ----------------
export class IslandMap {
  // rows: strings, '#' (or any of "#GgX1") = land, anything else = water
  static fromRows(rows, opts = {}) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const cells = new Uint8Array(w * h);
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) cells[y * w + x] = "#GgX1".includes(r[x]) ? 1 : 0; });
    return new IslandMap(w, h, cells, opts);
  }

  constructor(cols, rows, cells, { seed = 1, palette = ISLAND_PALETTE } = {}) {
    this.cols = cols; this.rows = rows;
    this.cells = cells;
    this.seed = seed;
    this.pal = palette;
    this.width = cols * TILE;
    this.height = rows * TILE + CLIFF_H;   // the last row's cliff hangs below the grid
    this.bake();
  }

  isLand(cx, cy) {
    return cx >= 0 && cy >= 0 && cx < this.cols && cy < this.rows && this.cells[cy * this.cols + cx] === 1;
  }
  setLand(cx, cy, on) {
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) return;
    this.cells[cy * this.cols + cx] = on ? 1 : 0;
  }
  // Walkable test in world pixels (the grass top only; cliffs and water are not)
  isWalkable(wx, wy) { return !!this.land && this.land[(wy | 0) * this.width + (wx | 0)] === 1; }

  // ---- autotile: which pixels of the grid are grass ----
  // 8-neighbour mask per cell decides rounded outer corners (both sides open)
  // and filled inner corners (water cell wedged between two land cells).
  buildLandMask() {
    const W = this.width, Hh = this.height, T = TILE;
    const land = new Uint8Array(W * Hh);
    const L = (x, y) => this.isLand(x, y);
    const cut = (dx, dy) => dx < 3 && dy < 3 && (3 - dx) ** 2 + (3 - dy) ** 2 > 9.5;
    for (let cy = 0; cy < this.rows; cy++) {
      for (let cx = 0; cx < this.cols; cx++) {
        const me = L(cx, cy);
        for (let ly = 0; ly < T; ly++) {
          for (let lx = 0; lx < T; lx++) {
            let v = me;
            for (const sx of [-1, 1]) {
              for (const sy of [-1, 1]) {
                const dx = sx < 0 ? lx : T - 1 - lx, dy = sy < 0 ? ly : T - 1 - ly;
                const nx = L(cx + sx, cy), ny = L(cx, cy + sy);
                if (me && !nx && !ny && cut(dx, dy)) v = false;                       // outer corner
                if (!me && nx && ny && dx + dy <= 2 && L(cx + sx, cy + sy)) v = true; // inner corner
              }
            }
            if (v) land[(cy * T + ly) * W + cx * T + lx] = 1;
          }
        }
      }
    }
    return land;
  }

  bake() {
    const W = this.width, Hh = this.height, P = this.pal, S = this.seed;
    const land = (this.land = this.buildLandMask());
    const at = (m, x, y) => (x < 0 || y < 0 || x >= W || y >= Hh ? 0 : m[y * W + x]);

    // cliff depth: pixels below grass, counted down from the south edge
    const cliff = new Uint8Array(W * Hh);
    for (let x = 0; x < W; x++) {
      let run = 0;
      for (let y = 0; y < Hh; y++) {
        if (land[y * W + x]) { run = 0; continue; }
        if (run > 0 || (y > 0 && land[(y - 1) * W + x])) run++;
        if (run > 0 && run <= CLIFF_H) cliff[y * W + x] = run;
        else if (run > CLIFF_H) run = 0;
      }
    }
    const solid = (x, y) => at(land, x, y) || at(cliff, x, y) ? 1 : 0;

    // ---- land + cliff canvas ----
    const c = makeCanvas(W, Hh);
    const g = c.getContext("2d");
    const img = g.createImageData(W, Hh);
    const put = (x, y, col) => {
      const i = (y * W + x) * 4;
      img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255;
    };
    const G = P.grass.map(rgb), blade = rgb(P.blade), bladeL = rgb(P.bladeLight), tip = rgb(P.bladeTip);
    const rim = rgb(P.rim), lip = rgb(P.lip);
    const CL = P.cliff.map(rgb), cLight = rgb(P.cliffLight), cDark = rgb(P.cliffDark), cTop = rgb(P.cliffTop), crack = rgb(P.cliffCrack);

    // grass base: soft patches (cell-sized noise) + per-pixel grain
    for (let y = 0; y < Hh; y++) {
      for (let x = 0; x < W; x++) {
        if (!land[y * W + x]) continue;
        const patch = h2(x >> 3, y >> 3, S) * 0.6 + h2(x >> 2, y >> 2, S + 1) * 0.4;
        const grain = h2(x, y, S + 2);
        put(x, y, grain < 0.12 ? G[2] : grain > 0.9 ? G[3] : patch < 0.5 ? G[0] : G[1]);
      }
    }
    // blades: short vertical strokes, dark stem with a light tip
    for (let y = 1; y < Hh; y++) {
      for (let x = 0; x < W; x++) {
        if (!land[y * W + x]) continue;
        const r = h2(x, y, S + 3);
        if (r < 0.22) {
          const len = 2 + ((r * 100) | 0) % 2;
          for (let k = 0; k < len && at(land, x, y - k); k++) put(x, y - k, k === len - 1 ? bladeL : blade);
        } else if (r > 0.985) put(x, y, tip);
      }
    }
    // rim: the outermost grass pixel is dark; the south lip is a jagged blade fringe
    for (let y = 0; y < Hh; y++) {
      for (let x = 0; x < W; x++) {
        if (!land[y * W + x]) continue;
        const open = !at(land, x - 1, y) || !at(land, x + 1, y) || !at(land, x, y - 1) || !at(land, x, y + 1);
        if (open) put(x, y, at(land, x, y + 1) ? rim : lip);
        else if (!at(land, x, y + 2) && h2(x, y, S + 4) < 0.55) put(x, y, rim);
      }
    }
    // cliff face: vertical strata, a dark shadow under the grass lip, darker toward the water
    for (let y = 0; y < Hh; y++) {
      for (let x = 0; x < W; x++) {
        const d = cliff[y * W + x];
        if (!d) continue;
        const col = h2(x, 0, S + 5), band = h2(x, (y + (x & 1)) >> 2, S + 6);
        let shade = CL[(col * CL.length) | 0];
        if (band > 0.82) shade = cLight;
        if (col > 0.93 || (band < 0.08 && d > 3)) shade = crack;
        if (d >= CLIFF_H - 2) shade = cDark;
        if (d <= 1 || (d === 2 && h2(x, y, S + 7) < 0.5)) shade = cTop;      // overhang shadow
        if (!solid(x - 1, y) || !solid(x + 1, y)) shade = cDark;           // side edges
        put(x, y, shade);
      }
    }
    g.putImageData(img, 0, 0);

    // decorations: flowers in clusters, a few dark stones/stumps
    const rnd = mulberry32(S * 7919 + 13);
    const grassAt = (x, y, r) => {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (!at(land, x + dx, y + dy)) return false;
      return true;
    };
    for (let cy = 0; cy < this.rows; cy++) {
      for (let cx = 0; cx < this.cols; cx++) {
        if (!this.isLand(cx, cy)) continue;
        const n = rnd() < 0.55 ? 1 + ((rnd() * 2) | 0) : 0;
        for (let i = 0; i < n; i++) {
          const x = cx * TILE + 2 + ((rnd() * 12) | 0), y = cy * TILE + 2 + ((rnd() * 12) | 0);
          if (!grassAt(x, y, 2)) continue;
          const [a, b] = P.flowers[(rnd() * P.flowers.length) | 0];
          g.fillStyle = a; g.fillRect(x, y, 1, 1);
          g.fillStyle = b; g.fillRect(x + 1, y - 1, 1, 1);
          if (rnd() < 0.5) { g.fillStyle = a; g.fillRect(x - 2, y + 1, 1, 1); }
        }
        if (rnd() < 0.12) {
          const x = cx * TILE + 4 + ((rnd() * 8) | 0), y = cy * TILE + 4 + ((rnd() * 8) | 0);
          if (grassAt(x, y, 3)) {
            g.fillStyle = P.speck[0]; g.fillRect(x, y, 3, 2);
            g.fillStyle = P.speck[1]; g.fillRect(x, y, 2, 1);
            g.fillStyle = P.blade; g.fillRect(x - 1, y + 2, 5, 1);
          }
        }
      }
    }
    this.ground = c;

    // ---- foam: distance from solid ground over water (8-neighbour, up to 6 px) ----
    const dist = new Uint8Array(W * Hh).fill(255);
    let frontier = [];
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (solid(x, y)) { dist[y * W + x] = 0; frontier.push(x, y); }
    for (let d = 1; d <= 6 && frontier.length; d++) {
      const next = [];
      for (let i = 0; i < frontier.length; i += 2) {
        const fx = frontier[i], fy = frontier[i + 1];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const x = fx + dx, y = fy + dy;
          if (x < 0 || y < 0 || x >= W || y >= Hh || dist[y * W + x] !== 255) continue;
          dist[y * W + x] = d; next.push(x, y);
        }
      }
      frontier = next;
    }
    this.foam = [];
    for (let f = 0; f < FOAM_FRAMES; f++) {
      const fc = makeCanvas(W, Hh);
      const fg = fc.getContext("2d");
      const wave = 3 + (f < 3 ? f : 1);          // a ripple that swells out and back: 3,4,5,4
      for (let y = 0; y < Hh; y++) {
        for (let x = 0; x < W; x++) {
          const d = dist[y * W + x];
          if (d === 0 || d > 6) continue;
          // under a cliff the water sits in shadow
          const under = at(cliff, x, y - d) >= CLIFF_H - 1 || at(cliff, x, y - 1) > 0;
          let col = null;
          if (d === 1) col = P.foam;
          else if (d === 2) col = under ? P.shade : P.foam2;
          else if (d === wave && h2(x >> 1, y >> 1, f + S) < 0.55) col = P.foamWave;
          else if (under && d === 3) col = P.shade;
          if (col) { fg.fillStyle = col; fg.fillRect(x, y, 1, 1); }
        }
      }
      this.foam.push(fc);
    }
    buildWaterFrames();
  }

  // Draw the part of the map seen by a camera at (camX, camY), plus open water around it.
  draw(ctx, camX, camY, viewW, viewH, tick = 0) {
    const wf = buildWaterFrames()[((tick / WATER_STEP) | 0) % WATER_FRAMES];
    const x0 = Math.floor(camX / WATER_TILE) * WATER_TILE, y0 = Math.floor(camY / WATER_TILE) * WATER_TILE;
    for (let y = y0; y < camY + viewH; y += WATER_TILE) {
      for (let x = x0; x < camX + viewW; x += WATER_TILE) ctx.drawImage(wf, Math.round(x - camX), Math.round(y - camY));
    }
    const sx = Math.max(0, Math.floor(camX)), sy = Math.max(0, Math.floor(camY));
    const sw = Math.min(this.width, Math.ceil(camX + viewW)) - sx, sh = Math.min(this.height, Math.ceil(camY + viewH)) - sy;
    if (sw <= 0 || sh <= 0) return;
    const dx = sx - Math.round(camX), dy = sy - Math.round(camY);
    ctx.drawImage(this.foam[((tick / FOAM_STEP) | 0) % FOAM_FRAMES], sx, sy, sw, sh, dx, dy, sw, sh);
    ctx.drawImage(this.ground, sx, sy, sw, sh, dx, dy, sw, sh);
  }
}
