// ============================================================
// TERRAIN: tile maps drawn from the Aseprite tile sets in aseprite/tiles/<theme>.aseprite
// (exported to assets/sprites/tiles/<theme>.png + .json by tools/aseprite/export.mjs).
//
// A map is a grid of cells: 0 = liquid (sea, lava, void…), 1 = ground, 2 = path on ground.
// Tiles use a dual grid: each drawn tile sits on the corner where four cells meet and is
// picked by which of those four are ground (TL 1, TR 2, BL 4, BR 8), so 16 tiles cover
// every shape: coastlines, single cells, diagonals, lakes inside islands. South edges get a
// cliff face, every shore a foam line; paths blend the same way over the ground.
//
//   const map = new TerrainMap(cells, cols, rows, { theme: "coast", seed: 8 });
//   await map.ready;                                    // sheet loaded, ground baked
//   map.draw(ctx, camX, camY, viewW, viewH, tick);      // tick = frames (60/s)
//
// Ground, paths and decorations are baked once; per frame only the liquid texture and the
// foam tiles along the shore are drawn.
// ============================================================
import { TILE } from "./tileset.js";

// Sheet layout (game px), shared with tools/aseprite/paint/tiles.mjs
export const TILESHEET = {
  w: 256, h: 96,
  liquid: { x: 0, y: 0, size: 64 },      // seamless liquid texture, animated
  ground: { x: 64, y: 0 },               // 16 tiles, index = corner mask (4 per row)
  path: { x: 128, y: 0 },                // 16 path-over-ground tiles, same masks
  foam: { x: 192, y: 0 },                // 16 shore tiles (foam, shallows, cliff shadow), animated
  fills: { x: 0, y: 64, n: 8 },          // full-ground variants (mask 15)
  pathFills: { x: 128, y: 64, n: 4 },    // full-path variants
  decor: { x: 0, y: 80, n: 16 },         // decorations: 0-5 small, 6-11 large, 12-15 theme specials
  frames: 8
};
export const CLIFF_H = 10;               // cliff face height under a south edge
export const CELL = { LIQUID: 0, GROUND: 1, PATH: 2 };

// Every tile set the game ships: one per platform theme (js/world/tileset.js THEMES) + the bright meadow
export const TILE_THEMES = ["meadow", "aethelgard", "canopy", "coast", "frost", "ash", "siege", "maw", "strand",
  "ossuary", "chainspire", "rocky", "swamp", "highland", "desert"];

const sheets = new Map();   // theme → Promise<{ frames: HTMLImageElement|canvas[] , durations }>

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`tile sheet ${src} failed to load`));
    img.src = src;
  });
}

/** Load assets/sprites/tiles/<theme> and cut it into one canvas per animation frame. */
export function loadTerrainSheet(theme, base = "assets/sprites/tiles/") {
  if (!sheets.has(theme)) {
    sheets.set(theme, (async () => {
      const [data, img] = await Promise.all([fetch(`${base}${theme}.json`).then((r) => r.json()), loadImage(`${base}${theme}.png`)]);
      const list = Array.isArray(data.frames) ? data.frames : Object.values(data.frames);
      const frames = list.map((f) => {
        const c = document.createElement("canvas");
        c.width = f.frame.w; c.height = f.frame.h;
        c.getContext("2d").drawImage(img, f.frame.x, f.frame.y, f.frame.w, f.frame.h, 0, 0, f.frame.w, f.frame.h);
        return c;
      });
      return { frames, durations: list.map((f) => f.duration || 120) };
    })());
  }
  return sheets.get(theme);
}

function h2(x, y, s) {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1103515245);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export class TerrainMap {
  /** cells: Uint8Array cols×rows of CELL values (or rows of strings: '#' ground, '=' path, anything else liquid) */
  static fromRows(rows, opts) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const cells = new Uint8Array(w * h);
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) cells[y * w + x] = r[x] === "#" ? 1 : r[x] === "=" ? 2 : 0; });
    return new TerrainMap(cells, w, h, opts);
  }

  constructor(cells, cols, rows, { theme = "meadow", seed = 1, decor = 1, sheetBase } = {}) {
    this.cells = cells; this.cols = cols; this.rows = rows;
    this.theme = theme; this.seed = seed; this.decorDensity = decor;
    this.width = cols * TILE; this.height = rows * TILE;
    this.sheet = null;
    this.ready = loadTerrainSheet(theme, sheetBase).then((s) => { this.sheet = s; this.bake(); return this; });
  }

  cell(cx, cy) {
    // outside the grid: liquid, so the map's border is open sea
    return cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows ? 0 : this.cells[cy * this.cols + cx];
  }
  isGround(cx, cy) { return this.cell(cx, cy) > 0; }
  setCell(cx, cy, v) {
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) return;
    this.cells[cy * this.cols + cx] = v;
  }
  /** Ground under a world point: grass top only (the cliff band and the liquid are not walkable). */
  isWalkable(wx, wy) {
    const cx = Math.floor(wx / TILE), cy = Math.floor(wy / TILE);
    if (!this.isGround(cx, cy)) return false;
    return this.isGround(cx, cy + 1) || wy - cy * TILE < TILE - CLIFF_H;
  }

  // corner mask of the dual-grid tile whose top-left corner sits at cell (tx-1, ty-1)
  mask(tx, ty, test) {
    return (test(tx - 1, ty - 1) ? 1 : 0) | (test(tx, ty - 1) ? 2 : 0) | (test(tx - 1, ty) ? 4 : 0) | (test(tx, ty) ? 8 : 0);
  }

  bake() {
    const S = TILESHEET, T = TILE, img = this.sheet.frames[0];
    const c = document.createElement("canvas");
    c.width = this.width; c.height = this.height;
    const g = c.getContext("2d");
    const ground = (x, y) => this.isGround(x, y), path = (x, y) => this.cell(x, y) === 2;
    this.shore = [];   // dual-grid tiles with both ground and liquid corners: foam drawn per frame
    for (let ty = 0; ty <= this.rows; ty++) {
      for (let tx = 0; tx <= this.cols; tx++) {
        const m = this.mask(tx, ty, ground), dx = tx * T - T / 2, dy = ty * T - T / 2;
        if (m === 0) continue;
        if (m !== 15) this.shore.push(tx, ty, m);
        if (m === 15 && h2(tx, ty, this.seed) < 0.75) {
          const v = (h2(ty, tx, this.seed + 1) * S.fills.n) | 0;
          g.drawImage(img, S.fills.x + v * T, S.fills.y, T, T, dx, dy, T, T);
        } else g.drawImage(img, S.ground.x + (m & 3) * T, S.ground.y + (m >> 2) * T, T, T, dx, dy, T, T);
        const p = this.mask(tx, ty, path);
        if (!p) continue;
        if (p === 15 && h2(tx, ty, this.seed + 2) < 0.6) {
          const v = (h2(ty, tx, this.seed + 3) * S.pathFills.n) | 0;
          g.drawImage(img, S.pathFills.x + v * T, S.pathFills.y, T, T, dx, dy, T, T);
        } else g.drawImage(img, S.path.x + (p & 3) * T, S.path.y + (p >> 2) * T, T, T, dx, dy, T, T);
      }
    }
    // decorations on open ground: small ones often, large ones rarely, never on paths or near edges
    for (let cy = 0; cy < this.rows; cy++) {
      for (let cx = 0; cx < this.cols; cx++) {
        if (this.cell(cx, cy) !== 1 || !this.isGround(cx, cy + 1)) continue;
        const r = h2(cx, cy, this.seed + 4) / this.decorDensity;
        let k = -1;
        if (r < 0.04) k = 6 + ((h2(cx, cy, this.seed + 5) * 6) | 0);
        else if (r < 0.06) k = 12 + ((h2(cx, cy, this.seed + 6) * 4) | 0);
        else if (r < 0.34) k = (h2(cx, cy, this.seed + 7) * 6) | 0;
        if (k < 0) continue;
        if (k >= 6 && (!this.isGround(cx - 1, cy) || !this.isGround(cx + 1, cy) || this.cell(cx, cy + 1) === 2)) continue;
        const ox = ((h2(cx, cy, this.seed + 8) * 5) | 0) - 2, oy = ((h2(cx, cy, this.seed + 9) * 5) | 0) - 2;
        g.drawImage(img, S.decor.x + k * T, S.decor.y, T, T, cx * T + ox, cy * T + oy, T, T);
      }
    }
    this.ground = c;
  }

  frameAt(tick) {
    const d = this.sheet.durations, total = d.reduce((a, b) => a + b, 0);
    let t = ((tick * 1000) / 60) % total;
    for (let i = 0; i < d.length; i++) { if (t < d[i]) return i; t -= d[i]; }
    return 0;
  }

  draw(ctx, camX, camY, viewW, viewH, tick = 0) {
    if (!this.sheet) return;
    const S = TILESHEET, T = TILE, img = this.sheet.frames[this.frameAt(tick)];
    const L = S.liquid.size, ox = Math.round(camX), oy = Math.round(camY);
    // liquid everywhere in view (the ground covers it)
    for (let y = Math.floor(oy / L) * L; y < oy + viewH; y += L) {
      for (let x = Math.floor(ox / L) * L; x < ox + viewW; x += L) ctx.drawImage(img, S.liquid.x, S.liquid.y, L, L, x - ox, y - oy, L, L);
    }
    // foam and shallows on shore tiles in view
    const sh = this.shore;
    for (let i = 0; i < sh.length; i += 3) {
      const dx = sh[i] * T - T / 2 - ox, dy = sh[i + 1] * T - T / 2 - oy, m = sh[i + 2];
      if (dx <= -T || dy <= -T || dx >= viewW || dy >= viewH) continue;
      ctx.drawImage(img, S.foam.x + (m & 3) * T, S.foam.y + (m >> 2) * T, T, T, dx, dy, T, T);
    }
    const sx = Math.max(0, ox), sy = Math.max(0, oy);
    const sw = Math.min(this.width, ox + viewW) - sx, shh = Math.min(this.height, oy + viewH) - sy;
    if (sw > 0 && shh > 0) ctx.drawImage(this.ground, sx, sy, sw, shh, sx - ox, sy - oy, sw, shh);
  }
}
