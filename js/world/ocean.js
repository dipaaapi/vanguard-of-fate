import { TILE } from "./tileset.js";
import { viewOf, tileSpan, hashTile } from "./layers.js";

// ==================== OCEAN (layers 0 and 4) ====================
// The water of a map: the tile map's liquid tiles, when its theme's liquid is real water.
// Layer 0 (baked once + moving currents): a depth gradient from the shallows by the shore down to
//   the abyss, measured in tiles from the nearest land, with the bedrock floor showing through the
//   shallows. Layer 4 (every frame): foam crests that lap against the wet sand on a sine,
//   offset = A · sin(ω t + φ), and glints on the surface.
// Lava, void, sap, blood, ash, ice and quicksand keep their own tiles: no foam, no splashes.

// shallow → deep: the gradient's ends; foam: crest colour; tint: how strongly the gradient covers
// the theme's water tile; depth: tiles from the shore to the darkest water
// sand / wet: the shoreline band baked on the land beside the water (js/world/grassland.js);
// sand null = the ground is sand already
const STYLES = {
  aethelgard: { shallow: "#00b4d8", deep: "#03045e", foam: "#e0f7fa", floor: "#d8c48f", sand: "#d8c48f", wet: "#a08a58", tint: 0.55, depth: 7 },
  coast:      { shallow: "#00b4d8", deep: "#03045e", foam: "#e0f7fa", floor: "#e6d4a3", sand: null, wet: "#9c8453", tint: 0.55, depth: 7 },
  highland:   { shallow: "#48cae4", deep: "#023e8a", foam: "#e0f7fa", floor: "#a8a29e", sand: "#b8a77a", wet: "#7d6e4c", tint: 0.42, depth: 4 },
  strand:     { shallow: "#0e7490", deep: "#020617", foam: "#bae6fd", floor: "#57534e", sand: "#4a4540", wet: "#2e2a26", tint: 0.45, depth: 7 },
  swamp:      { shallow: "#4d7c0f", deep: "#0b1a12", foam: "#d9f99d", floor: "#3f3a2a", sand: null, wet: "#26261a", tint: 0.3, depth: 4 }
};
export const WATER_THEMES = Object.keys(STYLES);

const A = 2.5;          // foam reach, pixels into the water (and up to 1 px onto the sand)
const OMEGA = 0.045;    // radians per frame: one lap every ~2.3 s at 60 steps per second
const QUANT = 8;        // gradient steps (pixel-art posterisation)

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, k) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(",")})`;

export class OceanSystem {
  constructor(tm, themeKey) {
    this.tm = tm;
    this.style = STYLES[themeKey] || null;
    this.tick = 0;
    this.enabled = Boolean(this.style) && tm.liquid.some((v) => v === 1);
    if (!this.enabled) return;
    tm.liquidSeen = 1;

    const { cols, rows } = tm;
    // Depth in tiles from the nearest land (breadth-first from every shore); 0 = land
    this.depth = new Uint8Array(cols * rows);
    let frontier = [];
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        const i = tm.idx(tx, ty);
        if (!tm.liquid[i]) continue;
        if (this.landAround(tx, ty)) { this.depth[i] = 1; frontier.push(i); }
      }
    }
    for (let d = 2; frontier.length && d < 255; d++) {
      const next = [];
      frontier.forEach((i) => {
        const tx = i % cols, ty = (i / cols) | 0;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const nx = tx + dx, ny = ty + dy;
          if (!tm.inBounds(nx, ny)) return;
          const j = tm.idx(nx, ny);
          if (tm.liquid[j] && !this.depth[j]) { this.depth[j] = d; next.push(j); }
        });
      });
      frontier = next;
    }
    // Water that never meets land (a whole map of sea) is as deep as it gets
    for (let i = 0; i < this.depth.length; i++) if (tm.liquid[i] && !this.depth[i]) this.depth[i] = 255;

    // Shore tiles (water touching land) with the sides that face land: N=1 E=2 S=4 W=8
    this.shore = new Uint8Array(cols * rows);
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        const i = tm.idx(tx, ty);
        if (!tm.liquid[i] || (tm.edge && tm.edge[i])) continue;
        this.shore[i] = (this.isLand(tx, ty - 1) ? 1 : 0) | (this.isLand(tx + 1, ty) ? 2 : 0) |
                        (this.isLand(tx, ty + 1) ? 4 : 0) | (this.isLand(tx - 1, ty) ? 8 : 0);
      }
    }
    const s = this.style;
    this.ramp = [];
    for (let k = 0; k < QUANT; k++) this.ramp.push(mix(hex(s.shallow), hex(s.deep), k / (QUANT - 1)));
  }

  isLand(tx, ty) {
    const tm = this.tm;
    return tm.inBounds(tx, ty) && !tm.liquid[tm.idx(tx, ty)];
  }

  landAround(tx, ty) {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && this.isLand(tx + dx, ty + dy)) return true;
    return false;
  }

  // Depth of a tile as a float 0 (land) … 1 (abyss), for the gradient
  depthK(tx, ty) {
    const tm = this.tm;
    if (!tm.inBounds(tx, ty)) return 1;
    const d = this.depth[tm.idx(tx, ty)];
    if (!d) return 0;
    return Math.min(1, (d - 0.5) / this.style.depth);
  }

  // ---------- LAYER 0, baked: depth gradient + bedrock floor (called by TileMap.render) ----------
  bake(g) {
    if (!this.enabled) return;
    const tm = this.tm, s = this.style, B = 4;   // 4×4-pixel blocks: a smooth gradient that stays pixel art
    g.save();
    for (let ty = 0; ty < tm.rows; ty++) {
      for (let tx = 0; tx < tm.cols; tx++) {
        if (!tm.liquid[tm.idx(tx, ty)]) continue;
        // corner depths, interpolated across the tile
        const c = this.depthK(tx, ty);
        const n = (dx, dy) => (this.depthK(tx + dx, ty + dy) + c) / 2;
        const tl = (n(-1, 0) + n(0, -1)) / 2, tr = (n(1, 0) + n(0, -1)) / 2;
        const bl = (n(-1, 0) + n(0, 1)) / 2, br = (n(1, 0) + n(0, 1)) / 2;
        for (let by = 0; by < TILE; by += B) {
          for (let bx = 0; bx < TILE; bx += B) {
            const u = (bx + B / 2) / TILE, v = (by + B / 2) / TILE;
            const top = tl + (tr - tl) * u, bot = bl + (br - bl) * u;
            const k = Math.max(c * 0.6, top + (bot - top) * v);     // never shallower than the tile's own depth allows
            const dither = hashTile(tx * 4 + bx, ty * 4 + by, 3) < 0.5 ? 0 : 0.5 / QUANT;
            const q = Math.min(QUANT - 1, Math.floor((k + dither) * QUANT));
            g.globalAlpha = s.tint;
            g.fillStyle = this.ramp[q];
            g.fillRect(tx * TILE + bx, ty * TILE + by, B, B);
            // bedrock floor: pebbles and sand ripples seen through the shallows
            if (k < 0.3 && hashTile(tx * 4 + bx, ty * 4 + by, 11) < 0.22) {
              g.globalAlpha = 0.35 * (1 - k / 0.3);
              g.fillStyle = s.floor;
              g.fillRect(tx * TILE + bx + 1, ty * TILE + by + 2, 2, 1);
            }
          }
        }
      }
    }
    g.restore();
  }

  // ---------- LAYER 0, moving: sea currents (only on water tiles) ----------
  drawCurrents(ctx) {
    if (!this.enabled) return;
    this.tick++;
    if (!(this.tm.liquidSeen > 0)) return;
    const tm = this.tm, t = this.tick, s = this.style;
    const v = viewOf(ctx), span = tileSpan(v, TILE, tm.cols, tm.rows);
    ctx.save();
    ctx.fillStyle = s.shallow;
    for (let ty = span.ty0; ty <= span.ty1; ty++) {
      for (let tx = span.tx0; tx <= span.tx1; tx++) {
        const i = tm.idx(tx, ty), d = this.depth[i];
        if (d < 2 || tm.edge && tm.edge[i]) continue;
        const h = hashTile(tx, ty, 5);
        if (h > 0.4) continue;
        // a streak drifting east, wrapping inside its own tile
        const len = 3 + Math.floor(h * 10);
        const x = Math.floor((t * (0.15 + h * 0.2) + h * 97) % (TILE - len));
        const y = 3 + Math.floor(h * 25) % (TILE - 6);
        ctx.globalAlpha = 0.18 + 0.12 * Math.sin(t * 0.03 + h * 20);
        ctx.fillRect(tx * TILE + x, ty * TILE + y, len, 1);
      }
    }
    ctx.restore();
  }

  // ---------- LAYER 4: foam crests and glints ----------
  drawSurface(ctx) {
    if (!this.enabled) return;
    const tm = this.tm, t = this.tick, s = this.style;
    const v = viewOf(ctx), span = tileSpan(v, TILE, tm.cols, tm.rows);
    let seen = 0;
    ctx.save();
    ctx.fillStyle = s.foam;
    for (let ty = span.ty0; ty <= span.ty1; ty++) {
      for (let tx = span.tx0; tx <= span.tx1; tx++) {
        const i = tm.idx(tx, ty);
        if (!tm.liquid[i]) continue;
        seen++;
        const sides = this.shore[i];
        const x0 = tx * TILE, y0 = ty * TILE;
        if (sides) {
          // A·sin(ωt + φ): the crest rolls in onto the sand (−1 px) and back out (+A px)
          const ph = hashTile(tx, ty, 9) * 1.2 + (tx + ty) * 0.35;
          const wave = Math.sin(t * OMEGA + ph);
          const off = Math.round(A * (wave + 1) / 2) - 1;       // −1 … A−1+1
          const reach = 1 - (wave + 1) / 2;                       // the crest is brightest when it reaches the sand
          for (let k = 0; k < 4; k++) {
            if (!(sides & (1 << k))) continue;
            ctx.globalAlpha = 0.55 + 0.35 * reach;
            this.crest(ctx, k, x0, y0, off, tx, ty, t);
            ctx.globalAlpha = 0.25 * reach;
            this.crest(ctx, k, x0, y0, off + 2, tx, ty, t + 40);   // the trailing wash
          }
        } else if (this.depth[i] >= 2 && hashTile(tx, ty, 13) < 0.12) {
          // a glint on open water
          const k = Math.sin(t * 0.05 + hashTile(tx, ty, 17) * 40);
          if (k > 0.86) {
            ctx.globalAlpha = (k - 0.86) * 6;
            const gx = x0 + 3 + Math.floor(hashTile(tx, ty, 19) * 10), gy = y0 + 3 + Math.floor(hashTile(tx, ty, 23) * 10);
            ctx.fillRect(gx, gy, 2, 1);
            ctx.fillRect(gx + 1, gy - 1, 1, 1);
          }
        }
      }
    }
    ctx.restore();
    tm.liquidSeen = seen;   // currents and splashes skip the work when no water is on screen
  }

  // One foam line along side k (0 N, 1 E, 2 S, 3 W) of a shore tile, broken into dashes that drift
  crest(ctx, k, x0, y0, off, tx, ty, t) {
    const along = (p) => ((p * 7 + tx * 13 + ty * 5 + Math.floor(t / 24)) % 9) < 6;   // dash pattern
    for (let p = 0; p < TILE; p += 2) {
      if (!along(p)) continue;
      if (k === 0) ctx.fillRect(x0 + p, y0 + off, 2, 1);
      else if (k === 2) ctx.fillRect(x0 + p, y0 + TILE - 1 - off, 2, 1);
      else if (k === 1) ctx.fillRect(x0 + TILE - 1 - off, y0 + p, 1, 2);
      else ctx.fillRect(x0 + off, y0 + p, 1, 2);
    }
  }

  // ---------- QUERIES (splashes, footsteps) ----------
  isWaterAt(px, py) {
    if (!this.enabled) return false;
    const tm = this.tm, tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    return tm.inBounds(tx, ty) && tm.liquid[tm.idx(tx, ty)] === 1;
  }

  // Wet ground: within a few pixels of the water's edge, where the foam reaches
  isShoreAt(px, py, reach = 5) {
    if (!this.enabled) return false;
    return this.isWaterAt(px, py) || this.isWaterAt(px + reach, py) || this.isWaterAt(px - reach, py) ||
      this.isWaterAt(px, py + reach) || this.isWaterAt(px, py - reach);
  }
}
