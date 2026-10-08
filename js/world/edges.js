import { TILE, drawTreeSplit, drawRock, mulberry32 } from "./tileset.js";

// ==================== MAP EDGE BARRIER (Act platforms and frontier maps) ====================
// A band of tiles along every edge of the map is a barrier nobody crosses: monsters, the hero, allies,
// loot and the ship. On land it is a wall of the theme's boulders with a line of its trees (oaks,
// sea stacks, pines, ruins, cacti...); over water it is a bank of the theme's haze (THEMES[*].edge in
// js/world/tileset.js): sea fog on the coast, a blizzard in the north, volcanic smoke over the lava,
// spore haze in the Canopy, poison gas over the fens, void miasma in the Maw. The band is wider than
// the player's bounds margin, so the hero walks right up to it.

export const EDGE_TILES = 3;
const HAZE_REACH = 2;   // the haze drifts this many tiles inward past the band

// Marks the band as solid; tm.edge = 1 on its tiles (liquid ones stay liquid underneath the haze)
export function markEdges(tm) {
  const { cols, rows } = tm, B = EDGE_TILES;
  tm.edge = new Uint8Array(cols * rows);
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      if (tx >= B && ty >= B && tx < cols - B && ty < rows - B) continue;
      const i = tm.idx(tx, ty);
      tm.edge[i] = 1;
      tm.solid[i] = 1;
    }
  }
}

// Land part of the band: boulders over every tile, then the theme's trees along it (baked once into
// the ground canvas, tree tops into the overlay so they stand over the characters like any tree)
export function paintLandEdges(tm, ground, overlay, theme, seed) {
  if (!tm.edge) return;
  const rnd = mulberry32(seed + 4049);
  const { cols, rows } = tm, B = EDGE_TILES;
  const dry = (tx, ty) => tm.inBounds(tx, ty) && tm.edge[tm.idx(tx, ty)] && !tm.liquid[tm.idx(tx, ty)];

  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      if (!dry(tx, ty)) continue;
      for (let k = 0; k < 3; k++) {
        drawRock(ground, tx * TILE - 4 + Math.floor(rnd() * 9), ty * TILE - 5 + Math.floor(rnd() * 8), Math.floor(rnd() * 1e6), theme.rock);
      }
    }
  }

  // Trees (two tiles wide, standing on their lower tile) every two tiles along each side of the band
  const trees = [];
  const plant = (tx, ty) => {
    if (dry(tx, ty) && dry(tx + 1, ty) && dry(tx, ty - 1) && dry(tx + 1, ty - 1) && rnd() < 0.85) trees.push([tx, ty]);
  };
  for (let tx = 1; tx < cols - 2; tx += 2) { plant(tx, 2); plant(tx, rows - 1); }
  for (let ty = B + 1; ty < rows - B; ty += 2) { plant(0, ty); plant(cols - 2, ty); }
  trees.sort((a, b) => a[1] - b[1]).forEach(([tx, ty]) => {
    drawTreeSplit(ground, overlay, tx * TILE, (ty - 1) * TILE, Math.floor(rnd() * 1e6), theme.tree);
  });
}

// Water part of the band: a canvas of haze, thick at the map's rim and thinning inward, drawn over
// everything by drawHaze. null when no edge tile is water.
export function bakeHaze(tm, theme, seed) {
  if (!tm.edge || !theme.edge) return null;
  const { cols, rows } = tm, B = EDGE_TILES;
  const wet = [];
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const i = tm.idx(tx, ty);
      if (tm.edge[i] && tm.liquid[i]) wet.push([tx, ty, Math.min(tx, ty, cols - 1 - tx, rows - 1 - ty)]);
    }
  }
  if (!wet.length) return null;
  const c = document.createElement("canvas");
  c.width = tm.pxW;
  c.height = tm.pxH;
  const ctx = c.getContext("2d");
  const [light, mid, dark] = theme.edge.haze;
  const rnd = mulberry32(seed + 911);

  // 1. A solid wall at the rim, thinner toward the play area
  wet.forEach(([tx, ty, depth]) => {
    ctx.globalAlpha = [0.95, 0.8, 0.55][depth] || 0.4;
    ctx.fillStyle = depth === 0 ? dark : mid;
    ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
  });
  // 2. Billowing puffs over it, some drifting inward past the band
  const puff = (x, y, r, alpha) => {
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    g.addColorStop(0, light);
    g.addColorStop(0.55, mid);
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  wet.forEach(([tx, ty, depth]) => {
    const x = tx * TILE + TILE / 2, y = ty * TILE + TILE / 2;
    puff(x - 4 + rnd() * 8, y - 4 + rnd() * 8, 12 + rnd() * 8, 0.55);
    if (depth === B - 1) {
      // inward from the band's inner side
      const ix = tx < B ? 1 : tx >= cols - B ? -1 : 0, iy = ty < B ? 1 : ty >= rows - B ? -1 : 0;
      for (let k = 1; k <= HAZE_REACH; k++) puff(x + ix * k * TILE + rnd() * 6 - 3, y + iy * k * TILE + rnd() * 6 - 3, 10 + rnd() * 6, 0.32 / k);
    }
  });
  ctx.globalAlpha = 1;
  return { canvas: c, glow: theme.edge.glow || null, wet };
}

// Each frame: the visible part of the haze, twice with a slow drift so it rolls; embers or sparks in
// it for the themes that have a glow. Only the strips along the edges are drawn.
export function drawHaze(ctx, haze, tm, tick) {
  if (!haze) return;
  const t = ctx.getTransform();
  const vx = -t.e / t.a, vy = -t.f / t.d, vw = ctx.canvas.width / t.a, vh = ctx.canvas.height / t.d;
  const band = (EDGE_TILES + HAZE_REACH + 1) * TILE, W = tm.pxW, H = tm.pxH;
  const strips = [[0, 0, W, band], [0, H - band, W, band], [0, band, band, H - band * 2], [W - band, band, band, H - band * 2]];
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  const drift = [[Math.sin(tick * 0.011) * 3, Math.cos(tick * 0.009) * 2, 0.75], [Math.cos(tick * 0.008) * -4, Math.sin(tick * 0.012) * 3, 0.45]];
  ctx.save();
  for (const [sx, sy, sw, sh] of strips) {
    const x0 = Math.max(sx, Math.floor(vx) - 4), y0 = Math.max(sy, Math.floor(vy) - 4);
    const x1 = Math.min(sx + sw, Math.ceil(vx + vw) + 4), y1 = Math.min(sy + sh, Math.ceil(vy + vh) + 4);
    if (x1 <= x0 || y1 <= y0) continue;
    for (const [dx, dy, a] of drift) {
      ctx.globalAlpha = a;
      ctx.drawImage(haze.canvas, x0, y0, x1 - x0, y1 - y0, Math.round(x0 + dx), Math.round(y0 + dy), x1 - x0, y1 - y0);
    }
  }
  ctx.restore();
  ctx.imageSmoothingEnabled = prev;

  if (!haze.glow) return;
  ctx.fillStyle = haze.glow;
  for (let k = 0; k < haze.wet.length; k += 3) {
    const [tx, ty] = haze.wet[k];
    const x = tx * TILE, y = ty * TILE;
    if (x + TILE < vx || x > vx + vw || y + TILE < vy || y > vy + vh) continue;
    const ph = (tick + k * 37) % 120;
    if (ph > 50) continue;
    ctx.globalAlpha = Math.sin((ph / 50) * Math.PI) * 0.8;
    ctx.fillRect(x + ((k * 7) % 13), y + 12 - ph * 0.2, 1, 1);
  }
  ctx.globalAlpha = 1;
}
