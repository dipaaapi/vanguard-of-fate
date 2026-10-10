import { TILE, T } from "./tileset.js";
import { viewOf, tileSpan, hashTile } from "./layers.js";

// ==================== GRASSLAND (layer 1) ====================
// The ground's living details on top of the tile map: the sand shoreline beside the water
// (baked once, wet sand next to the foam) and turf blades that sway in the wind on the tufts and
// flowers (drawn every frame, only on screen). Also answers "is this deep flora?" for footsteps.

// Themes whose ground grows grass (turf blades sway and rustle underfoot)
const GRASSY = new Set(["aethelgard", "canopy", "coast", "highland", "swamp", "siege"]);
const FLORA = new Set([T.TUFT, T.FLOWER_W, T.FLOWER_Y, T.FLOWER_R]);

export class GrasslandSystem {
  constructor(tm, themeKey, theme) {
    this.tm = tm;
    this.grassy = GRASSY.has(themeKey);
    this.blade = theme.grassLight;
    this.bladeDark = theme.grassDark;
    this.animTick = 0;
    // Tufts and flowers that get swaying blades (index → phase); bush tiles count as flora too
    this.flora = new Uint8Array(tm.cols * tm.rows);
    for (let i = 0; i < tm.ids.length; i++) if (FLORA.has(tm.ids[i]) && !tm.liquid[i] && !tm.keepOut[i]) this.flora[i] = 1;
    tm.objects.forEach((o) => { if (o.type === "bush" && tm.inBounds(o.tx, o.ty)) this.flora[tm.idx(o.tx, o.ty)] = 2; });
  }

  update() {
    this.animTick++;
  }

  // ---------- baked: sand and wet sand along the water (called by TileMap.render, after the land tiles) ----------
  bakeShore(g, ocean) {
    if (!ocean || !ocean.enabled) return;
    const tm = this.tm, s = ocean.style;
    g.save();
    for (let ty = 0; ty < tm.rows; ty++) {
      for (let tx = 0; tx < tm.cols; tx++) {
        const i = tm.idx(tx, ty);
        if (tm.liquid[i] || (tm.edge && tm.edge[i])) continue;
        const water = (dx, dy) => tm.inBounds(tx + dx, ty + dy) && tm.liquid[tm.idx(tx + dx, ty + dy)] === 1;
        const n = water(0, -1), e = water(1, 0), so = water(0, 1), w = water(-1, 0);
        const ne = water(1, -1), se = water(1, 1), sw = water(-1, 1), nw = water(-1, -1);
        if (!(n || e || so || w || ne || se || sw || nw)) continue;
        const x0 = tx * TILE, y0 = ty * TILE;
        for (let py = 0; py < TILE; py++) {
          for (let px = 0; px < TILE; px++) {
            // distance (pixels) from this pixel to the nearest water edge of the tile
            let d = 99;
            if (n) d = Math.min(d, py);
            if (so) d = Math.min(d, TILE - 1 - py);
            if (w) d = Math.min(d, px);
            if (e) d = Math.min(d, TILE - 1 - px);
            if (nw) d = Math.min(d, Math.max(px, py));
            if (ne) d = Math.min(d, Math.max(TILE - 1 - px, py));
            if (sw) d = Math.min(d, Math.max(px, TILE - 1 - py));
            if (se) d = Math.min(d, Math.max(TILE - 1 - px, TILE - 1 - py));
            const jag = hashTile(x0 + px, y0 + py, 29) < 0.5 ? 1 : 0;   // ragged, not ruled, edges
            if (d < 2 + jag) { g.globalAlpha = 0.8; g.fillStyle = s.wet; }
            else if (s.sand && d < 5 + jag) { g.globalAlpha = 0.85; g.fillStyle = s.sand; }
            else if (!s.sand && d < 4 + jag) { g.globalAlpha = 0.35; g.fillStyle = s.wet; }
            else continue;
            g.fillRect(x0 + px, y0 + py, 1, 1);
          }
        }
      }
    }
    g.restore();
  }

  // ---------- every frame: turf blades swaying in the wind ----------
  draw(ctx) {
    if (!this.grassy) return;
    const tm = this.tm, t = this.animTick;
    const span = tileSpan(viewOf(ctx), TILE, tm.cols, tm.rows);
    const gust = Math.sin(t * 0.013) * 0.6 + 0.4;   // the wind rises and falls across the whole map
    ctx.save();
    for (let ty = span.ty0; ty <= span.ty1; ty++) {
      for (let tx = span.tx0; tx <= span.tx1; tx++) {
        if (this.flora[tm.idx(tx, ty)] !== 1) continue;
        const h = hashTile(tx, ty, 31);
        // the wave of wind travels across the field from west to east
        const sway = Math.round(Math.sin(t * 0.06 - tx * 0.5 + h * 6) * 1.2 * gust);
        const bx = tx * TILE + 3 + Math.floor(h * 8), by = ty * TILE + 9 + Math.floor(h * 4);
        ctx.fillStyle = this.bladeDark;
        ctx.fillRect(bx, by, 1, 3);
        ctx.fillRect(bx + 3, by + 1, 1, 2);
        ctx.fillStyle = this.blade;
        ctx.fillRect(bx + sway, by - 2, 1, 2);
        ctx.fillRect(bx + 3 + sway, by - 1, 1, 2);
        ctx.fillRect(bx + 1 + sway, by - 1, 1, 1);
      }
    }
    ctx.restore();
  }

  // Deep flora underfoot (tufts, flowers, bushes) on grassy ground: the brush cue
  isFloraAt(px, py) {
    if (!this.grassy) return false;
    const tm = this.tm, tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    return tm.inBounds(tx, ty) && this.flora[tm.idx(tx, ty)] > 0;
  }
}
