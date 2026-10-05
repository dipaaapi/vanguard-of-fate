import {
  TILE, ATLAS_COLS, T, THEMES,
  buildTileset, drawTreeSplit, drawRock, drawBush, mulberry32
} from "./tileset.js";
import { markEdges, paintLandEdges, bakeHaze, drawHaze } from "./edges.js";

// ---------- noise ----------
function hash2(x, y, seed) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function smooth(t) { return t * t * (3 - 2 * t); }
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  const u = smooth(xf), v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// Foot hitbox (player/enemy sprites are 24x24)
const FOOT = { ox: 7, oy: 16, w: 10, h: 7 };

export class TileMap {
  // stage: needs width, height, safeZone; optional: castle, barracks, portals
  // For platforms: stage.theme (key in THEMES), stage.terrain(tx, ty, cols, rows, noise)
  // → "liquid" | "wall" | null, stage.pathTargets ([x, y] in pixels), stage.coverageSystems.
  constructor(stage, seed = 20260928) {
    this.theme = THEMES[stage.theme] || THEMES.aethelgard;
    this.tile = TILE;
    this.pxW = stage.width;
    this.pxH = stage.height;
    this.cols = Math.ceil(stage.width / TILE);
    this.rows = Math.ceil(stage.height / TILE);

    this.ids = new Uint8Array(this.cols * this.rows);     // ground tile ids
    this.solid = new Uint8Array(this.cols * this.rows);   // 1 = impassable
    this.keepOut = new Uint8Array(this.cols * this.rows); // debug: area covered by the castle/barracks/etc.
    this.objects = [];                                    // trees, rocks, bushes
    this.debug = false;

    this.liquid = new Uint8Array(this.cols * this.rows);  // sea / lava / void (impassable)
    this.edge = null;                                     // platforms: the barrier band at the map's edge (js/world/edges.js)
    this.seed = seed;
    this.tick = 0;
    this.atlas = buildTileset(this.theme);
    this.generate(stage, seed);
    this.computeReach(stage);
    this.render();
  }

  // Tiles reachable from the sanctuary (so monsters never spawn in a closed pocket)
  computeReach(stage) {
    this.reach = new Uint8Array(this.cols * this.rows);
    const s = stage.safeZone;
    if (!s) return;
    const sx = Math.floor((s.x + s.w / 2) / TILE), sy = Math.floor((s.y + s.h / 2) / TILE);
    if (!this.inBounds(sx, sy)) return;
    const q = [[sx, sy]];
    this.reach[this.idx(sx, sy)] = 1;
    for (let h = 0; h < q.length; h++) {
      const [x, y] = q[h];
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (!this.inBounds(nx, ny)) return;
        const i = this.idx(nx, ny);
        if (this.solid[i] || this.reach[i]) return;
        this.reach[i] = 1;
        q.push([nx, ny]);
      });
    }
  }

  isReachable(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    return this.inBounds(tx, ty) && this.reach[this.idx(tx, ty)] === 1;
  }

  idx(tx, ty) { return ty * this.cols + tx; }
  inBounds(tx, ty) { return tx >= 0 && ty >= 0 && tx < this.cols && ty < this.rows; }

  // Swap the atlas for your own tileset (Image or Canvas, same layout)
  setAtlas(imageOrCanvas) {
    this.atlas = imageOrCanvas;
    this.render();
  }

  // ---------- WHAT OTHER SYSTEMS HAVE ALREADY DRAWN (castle, barracks, ...) ----------
  computeCoverage(stage) {
    const mask = new Uint8Array(this.cols * this.rows);
    try {
      const cv = document.createElement("canvas");
      cv.width = this.pxW;
      cv.height = this.pxH;
      const c = cv.getContext("2d");
      (stage.coverageSystems || [stage.castle, stage.barracks, stage.portals]).forEach((sys) => {
        // drawCoverage: the footprint to keep clear, independent of whether Aseprite art has loaded yet
        try { if (sys && (sys.drawCoverage || sys.draw)) (sys.drawCoverage || sys.draw).call(sys, c); } catch (_) { /* skip */ }
      });
      const data = c.getImageData(0, 0, this.pxW, this.pxH).data;

      for (let ty = 0; ty < this.rows; ty++) {
        for (let tx = 0; tx < this.cols; tx++) {
          let hits = 0;
          for (let y = 0; y < TILE; y += 2) {
            for (let x = 0; x < TILE; x += 2) {
              const px = tx * TILE + x, py = ty * TILE + y;
              if (px >= this.pxW || py >= this.pxH) continue;
              if (data[(py * this.pxW + px) * 4 + 3] > 24) hits++;
            }
          }
          if (hits >= 3) mask[this.idx(tx, ty)] = 1;
        }
      }
    } catch (_) { /* no coverage info: only the safeZone is used */ }

    // Safe zone + surroundings
    const s = stage.safeZone;
    if (s) {
      const pad = 4;
      const x0 = Math.floor(s.x / TILE) - pad, x1 = Math.floor((s.x + s.w) / TILE) + pad;
      const y0 = Math.floor(s.y / TILE) - pad, y1 = Math.floor((s.y + s.h) / TILE) + pad;
      for (let ty = y0; ty <= y1; ty++)
        for (let tx = x0; tx <= x1; tx++)
          if (this.inBounds(tx, ty)) mask[this.idx(tx, ty)] = 1;
    }
    // Areas that must stay clear (e.g. the Citadel's audience dais)
    this.eachClearTile(stage, (tx, ty) => { mask[this.idx(tx, ty)] = 1; });
    return mask;
  }

  eachClearTile(stage, fn) {
    (stage.clearAreas || []).forEach((a) => {
      const x0 = Math.floor(a.x / TILE), x1 = Math.floor((a.x + a.w) / TILE);
      const y0 = Math.floor(a.y / TILE), y1 = Math.floor((a.y + a.h) / TILE);
      for (let ty = y0; ty <= y1; ty++)
        for (let tx = x0; tx <= x1; tx++)
          if (this.inBounds(tx, ty)) fn(tx, ty);
    });
  }

  dilate(mask, r) {
    const out = new Uint8Array(mask.length);
    for (let ty = 0; ty < this.rows; ty++) {
      for (let tx = 0; tx < this.cols; tx++) {
        if (!mask[this.idx(tx, ty)]) continue;
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++)
            if (this.inBounds(tx + dx, ty + dy)) out[this.idx(tx + dx, ty + dy)] = 1;
      }
    }
    return out;
  }

  // ---------- MAP GENERATION ----------
  carvePath(path, rnd, tx0, ty0, tx1, ty1) {
    let x = tx0, y = ty0;
    const brush = (bx, by) => {
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++)
          if (this.inBounds(bx + dx, by + dy)) path[this.idx(bx + dx, by + dy)] = 1;
    };
    let guard = 0;
    while ((x !== tx1 || y !== ty1) && guard++ < 4000) {
      brush(x, y);
      const dx = tx1 - x, dy = ty1 - y;
      const majorX = Math.abs(dx) >= Math.abs(dy);
      const jog = rnd() < 0.22;
      if ((majorX && !jog && dx !== 0) || (!majorX && jog && dx !== 0)) x += Math.sign(dx);
      else if (dy !== 0) y += Math.sign(dy);
      else x += Math.sign(dx);
    }
    brush(x, y);
  }

  generate(stage, seed) {
    const rnd = mulberry32(seed);
    const { cols, rows } = this;

    const coverage = this.computeCoverage(stage);
    this.keepOut = coverage;
    const keep = this.dilate(coverage, 1);

    // ----- Path (dirt path) -----
    const path = new Uint8Array(cols * rows);
    const sz = stage.safeZone;
    const hubX = sz ? Math.floor((sz.x + sz.w / 2) / TILE) : Math.floor(cols / 2);
    const hubY = sz ? Math.floor((sz.y + sz.h / 2) / TILE) : Math.floor(rows / 2);

    let targets = [
      [Math.floor(cols / 2), 2], [Math.floor(cols / 2), rows - 4],
      [2, Math.floor(rows / 2)], [cols - 4, Math.floor(rows / 2)]
    ];
    if (stage.pathTargets) targets = stage.pathTargets.map(([x, y]) => [Math.floor(x / TILE), Math.floor(y / TILE)]);
    const gate = stage.castle && stage.castle.gatePortal;
    if (gate) targets.push([Math.floor(gate.x / TILE), Math.floor(gate.y / TILE)]);
    targets.forEach(([tx, ty]) => this.carvePath(path, rnd, hubX, hubY, tx, ty));
    this.eachClearTile(stage, (tx, ty) => { path[this.idx(tx, ty)] = 1; });   // plaza
    const pathNear = this.dilate(path, 1);

    // ----- Platform terrain: sea / lava / void and cliffs (paths become bridges) -----
    const wall = new Uint8Array(cols * rows);
    if (stage.terrain) {
      const noise = (x, y, s = 0) => vnoise(x, y, seed + 31 + s);
      for (let ty = 0; ty < rows; ty++) {
        for (let tx = 0; tx < cols; tx++) {
          const i = this.idx(tx, ty);
          if (path[i] || coverage[i]) continue;
          const kind = stage.terrain(tx, ty, cols, rows, noise);
          if (kind === "liquid") { this.liquid[i] = 1; this.solid[i] = 1; }
          else if (kind === "wall") { wall[i] = 1; this.solid[i] = 1; }
        }
      }
    }

    // ----- Barrier along the map's edge (Act platforms and frontier maps) -----
    if (stage.terrain) markEdges(this);

    // ----- Ground tiles -----
    const hasPath = (tx, ty) => this.inBounds(tx, ty) && path[this.idx(tx, ty)] === 1;
    const hasLiquid = (tx, ty) => !this.inBounds(tx, ty) || this.liquid[this.idx(tx, ty)] === 1;
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        const i = this.idx(tx, ty);
        if (this.liquid[i]) {
          const mask = (hasLiquid(tx, ty - 1) ? 1 : 0) | (hasLiquid(tx + 1, ty) ? 2 : 0) |
                       (hasLiquid(tx, ty + 1) ? 4 : 0) | (hasLiquid(tx - 1, ty) ? 8 : 0);
          this.ids[i] = T.LIQUID_BASE + mask;
          continue;
        }
        if (wall[i]) {
          this.ids[i] = (tx + ty) % 3 ? T.WALL_A : T.WALL_B;
          continue;
        }
        if (path[i]) {
          const mask = (hasPath(tx, ty - 1) ? 1 : 0) | (hasPath(tx + 1, ty) ? 2 : 0) |
                       (hasPath(tx, ty + 1) ? 4 : 0) | (hasPath(tx - 1, ty) ? 8 : 0);
          this.ids[i] = T.PATH_BASE + mask;
          continue;
        }
        const h = hash2(tx, ty, seed);
        const meadow = vnoise(tx * 0.08, ty * 0.08, seed + 5);
        let id = h < 0.5 ? T.GRASS_A : (h < 0.8 ? T.GRASS_B : T.GRASS_C);
        if (meadow > 0.62 && h < 0.7) id = T.GRASS_C;
        const r = hash2(tx, ty, seed + 99);
        if (r < 0.06) id = T.TUFT;
        else if (r < 0.075) id = T.FLOWER_W;
        else if (r < 0.09) id = T.FLOWER_Y;
        else if (r < 0.10) id = T.FLOWER_R;
        else if (r < 0.108) id = T.PEBBLES;
        this.ids[i] = id;
      }
    }

    // ----- Objects (trees, rocks, bushes) -----
    const occ = new Uint8Array(cols * rows);
    const M = 3; // margin at the edge of the world
    const free = (tx, ty) => {
      if (tx < M || ty < M + 1 || tx >= cols - M || ty >= rows - M) return false;
      const i = this.idx(tx, ty);
      return !keep[i] && !occ[i] && !pathNear[i] && !this.solid[i];
    };
    const density = this.theme.treeDensity || 0.6;

    for (let ty = M + 1; ty < rows - M; ty++) {
      for (let tx = M; tx < cols - M - 1; tx++) {
        const forest = vnoise(tx * 0.09, ty * 0.09, seed + 11) * 0.7 + vnoise(tx * 0.21, ty * 0.21, seed + 23) * 0.3;
        const wantTree = (forest > density && rnd() < 0.5) || rnd() < 0.004;

        if (wantTree &&
            free(tx, ty) && free(tx + 1, ty) && free(tx, ty - 1) && free(tx + 1, ty - 1)) {
          this.objects.push({ type: "tree", tx, ty, seed: Math.floor(rnd() * 1e6) });
          [[0, 0], [1, 0], [0, -1], [1, -1]].forEach(([dx, dy]) => { occ[this.idx(tx + dx, ty + dy)] = 1; });
          this.solid[this.idx(tx, ty)] = 1;
          this.solid[this.idx(tx + 1, ty)] = 1;
          continue;
        }

        if (free(tx, ty)) {
          const r = rnd();
          if (r < 0.006) {
            this.objects.push({ type: "rock", tx, ty, seed: Math.floor(rnd() * 1e6) });
            occ[this.idx(tx, ty)] = 1;
            this.solid[this.idx(tx, ty)] = 1;
          } else if (r < 0.018) {
            this.objects.push({ type: "bush", tx, ty, seed: Math.floor(rnd() * 1e6) });
            occ[this.idx(tx, ty)] = 1;
          }
        }
      }
    }
  }

  // ---------- RENDER (once) ----------
  render() {
    const mk = () => {
      const c = document.createElement("canvas");
      c.width = this.pxW;
      c.height = this.pxH;
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      return { c, ctx };
    };
    const g = mk();
    const o = mk();
    this.groundCanvas = g.c;
    this.overlayCanvas = o.c;

    for (let ty = 0; ty < this.rows; ty++) {
      for (let tx = 0; tx < this.cols; tx++) {
        const id = this.ids[this.idx(tx, ty)];
        g.ctx.drawImage(
          this.atlas,
          (id % ATLAS_COLS) * TILE, Math.floor(id / ATLAS_COLS) * TILE, TILE, TILE,
          tx * TILE, ty * TILE, TILE, TILE
        );
      }
    }

    // Top to bottom so trees overlap correctly
    const sorted = [...this.objects].sort((a, b) => a.ty - b.ty);
    sorted.forEach((ob) => {
      const th = this.theme;
      if (ob.type === "tree") drawTreeSplit(g.ctx, o.ctx, ob.tx * TILE, (ob.ty - 1) * TILE, ob.seed, th.tree);
      else if (ob.type === "rock") drawRock(g.ctx, ob.tx * TILE, ob.ty * TILE, ob.seed, th.rock);
      else if (ob.type === "bush") drawBush(g.ctx, ob.tx * TILE, ob.ty * TILE, ob.seed, th.bush);
    });
    // The edge barrier: boulders and trees on land, a bank of haze over water
    paintLandEdges(this, g.ctx, o.ctx, this.theme, this.seed);
    this.haze = bakeHaze(this, this.theme, this.seed);
  }

  // ---------- DRAW: only the visible part is shown ----------
  blit(ctx, canvas) {
    const t = ctx.getTransform();
    const x0 = Math.max(0, Math.floor(-t.e / t.a));
    const y0 = Math.max(0, Math.floor(-t.f / t.d));
    const vw = Math.ceil(ctx.canvas.width / t.a) + 2;
    const vh = Math.ceil(ctx.canvas.height / t.d) + 2;
    const sw = Math.min(vw, this.pxW - x0);
    const sh = Math.min(vh, this.pxH - y0);
    if (sw <= 0 || sh <= 0) return;

    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, x0, y0, sw, sh, x0, y0, sw, sh);
    ctx.imageSmoothingEnabled = prev;
  }

  drawGround(ctx) {
    this.blit(ctx, this.groundCanvas);
  }

  // Tree canopy: drawn ABOVE the characters
  drawOverlay(ctx) {
    this.blit(ctx, this.overlayCanvas);
    drawHaze(ctx, this.haze, this, this.tick++);
    if (this.debug) this.drawDebug(ctx);
  }

  drawDebug(ctx) {
    const t = ctx.getTransform();
    const tx0 = Math.max(0, Math.floor(-t.e / t.a / TILE));
    const ty0 = Math.max(0, Math.floor(-t.f / t.d / TILE));
    const tx1 = Math.min(this.cols - 1, tx0 + Math.ceil(ctx.canvas.width / t.a / TILE) + 1);
    const ty1 = Math.min(this.rows - 1, ty0 + Math.ceil(ctx.canvas.height / t.d / TILE) + 1);

    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const i = this.idx(tx, ty);
        if (this.solid[i]) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
          ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        } else if (this.keepOut[i]) {
          ctx.fillStyle = "rgba(56, 189, 248, 0.18)";
          ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.strokeRect(tx * TILE + 0.5, ty * TILE + 0.5, TILE - 1, TILE - 1);
      }
    }
  }

  // ---------- COLLISION ----------
  isSolidAt(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    return this.inBounds(tx, ty) && this.solid[this.idx(tx, ty)] === 1;
  }

  // Pushes an entity (player/enemy) out when it is inside a solid tile
  resolveCollision(e) {
    if (!e || typeof e.x !== "number") return;

    for (let pass = 0; pass < 3; pass++) {
      const bx = e.x + FOOT.ox, by = e.y + FOOT.oy;
      const tx0 = Math.floor(bx / TILE), tx1 = Math.floor((bx + FOOT.w - 1) / TILE);
      const ty0 = Math.floor(by / TILE), ty1 = Math.floor((by + FOOT.h - 1) / TILE);
      let moved = false;

      for (let ty = ty0; ty <= ty1 && !moved; ty++) {
        for (let tx = tx0; tx <= tx1 && !moved; tx++) {
          if (!this.inBounds(tx, ty) || !this.solid[this.idx(tx, ty)]) continue;
          const tl = tx * TILE, tt = ty * TILE;
          const ox = Math.min(bx + FOOT.w, tl + TILE) - Math.max(bx, tl);
          const oy = Math.min(by + FOOT.h, tt + TILE) - Math.max(by, tt);
          if (ox <= 0 || oy <= 0) continue;

          if (ox < oy) e.x += (bx + FOOT.w / 2 < tl + TILE / 2) ? -ox : ox;
          else e.y += (by + FOOT.h / 2 < tt + TILE / 2) ? -oy : oy;
          moved = true;
        }
      }
      if (!moved) break;
    }
  }
}
