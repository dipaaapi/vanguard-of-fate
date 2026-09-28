// ============================================================
// TILESET: procedural 16x16 pixel-art tiles (walang external asset)
// Atlas layout (16 columns x 2 rows, 16px bawat tile):
//   row 0:  0-2 grass A/B/C | 3 tuft | 4-6 bulaklak | 7 pebbles | 8-9 dirt
//   row 1:  16-31 path autotile (16 + mask; N=1 E=2 S=4 W=8 = may kakonektang path)
// Puwede mong palitan ang buong atlas ng sarili mong PNG na may parehong layout
// (tingnan ang TileMap.setAtlas()).
// ============================================================
export const TILE = 16;
export const ATLAS_COLS = 16;

export const T = {
  GRASS_A: 0, GRASS_B: 1, GRASS_C: 2, TUFT: 3,
  FLOWER_W: 4, FLOWER_Y: 5, FLOWER_R: 6, PEBBLES: 7,
  DIRT_A: 8, DIRT_B: 9,
  PATH_BASE: 16
};

const COL = {
  grass: ["#1d4a34", "#1f4f37", "#1a4531"],
  grassLight: "#2b6647",
  grassDark: "#153a29",
  dirt: ["#6b5a41", "#66563d"],
  dirtLight: "#7b6a4e",
  dirtDark: "#544631"
};

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function px(ctx, x, y, color, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function fillCircle(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy) + 0.5);
    ctx.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
  }
}

// ---------------- TILES ----------------
function drawGrass(ctx, x, y, variant, rnd) {
  px(ctx, x, y, COL.grass[variant % 3], TILE, TILE);
  const n = 5 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const sx = x + Math.floor(rnd() * TILE);
    const sy = y + Math.floor(rnd() * TILE);
    px(ctx, sx, sy, rnd() < 0.5 ? COL.grassDark : COL.grassLight);
  }
}

function drawTuft(ctx, x, y, rnd) {
  drawGrass(ctx, x, y, 0, rnd);
  [[4, 9, 3], [8, 6, 5], [11, 9, 2], [6, 11, 2]].forEach(([bx, by, len]) => {
    px(ctx, x + bx, y + by, COL.grassLight, 1, len);
    px(ctx, x + bx, y + by + len, COL.grassDark);
  });
}

function drawFlower(ctx, x, y, petal, rnd) {
  drawGrass(ctx, x, y, 1, rnd);
  const cx = x + 6 + Math.floor(rnd() * 4);
  const cy = y + 5 + Math.floor(rnd() * 4);
  px(ctx, cx, cy + 1, COL.grassDark, 1, 3);           // stem
  px(ctx, cx - 1, cy + 2, COL.grassLight);              // leaf
  px(ctx, cx, cy - 1, petal);
  px(ctx, cx - 1, cy, petal);
  px(ctx, cx + 1, cy, petal);
  px(ctx, cx, cy + 1 - 1 + 1, petal);
  px(ctx, cx, cy, "#ffd166");                           // gitna
}

function drawPebbles(ctx, x, y, rnd) {
  drawGrass(ctx, x, y, 2, rnd);
  [[3, 9, 3, 2], [9, 5, 2, 2], [10, 11, 3, 2]].forEach(([bx, by, w, h]) => {
    px(ctx, x + bx, y + by, "#64748b", w, h);
    px(ctx, x + bx, y + by, "#94a3b8", 1, 1);
    px(ctx, x + bx, y + by + h, "rgba(0,0,0,0.25)", w, 1);
  });
}

function drawDirt(ctx, x, y, variant, rnd) {
  px(ctx, x, y, COL.dirt[variant % 2], TILE, TILE);
  for (let i = 0; i < 9; i++) {
    px(ctx, x + Math.floor(rnd() * TILE), y + Math.floor(rnd() * TILE), rnd() < 0.5 ? COL.dirtDark : COL.dirtLight);
  }
}

// mask bits: N=1, E=2, S=4, W=8 (may kakonektang path sa direksyong iyon)
function drawPathTile(ctx, x, y, mask, rnd) {
  drawDirt(ctx, x, y, 0, rnd);

  const fringe = (side) => {
    for (let i = 0; i < TILE; i++) {
      const d = 2 + Math.floor(rnd() * 3);            // 2-4 px ang kapal, hindi pantay
      for (let k = 0; k < d; k++) {
        const isEdge = k === d - 1;
        const color = isEdge ? COL.grassDark : COL.grass[(i + k) % 3];
        if (side === 0) px(ctx, x + i, y + k, color);
        if (side === 1) px(ctx, x + TILE - 1 - k, y + i, color);
        if (side === 2) px(ctx, x + i, y + TILE - 1 - k, color);
        if (side === 3) px(ctx, x + k, y + i, color);
      }
    }
  };

  if (!(mask & 1)) fringe(0);
  if (!(mask & 2)) fringe(1);
  if (!(mask & 4)) fringe(2);
  if (!(mask & 8)) fringe(3);
}

export function buildTileset() {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_COLS * TILE;
  canvas.height = 2 * TILE;
  const ctx = canvas.getContext("2d");
  const rnd = mulberry32(777);

  const at = (id) => [(id % ATLAS_COLS) * TILE, Math.floor(id / ATLAS_COLS) * TILE];

  for (let v = 0; v < 3; v++) drawGrass(ctx, ...at(T.GRASS_A + v), v, rnd);
  drawTuft(ctx, ...at(T.TUFT), rnd);
  drawFlower(ctx, ...at(T.FLOWER_W), "#e2e8f0", rnd);
  drawFlower(ctx, ...at(T.FLOWER_Y), "#fde047", rnd);
  drawFlower(ctx, ...at(T.FLOWER_R), "#fb7185", rnd);
  drawPebbles(ctx, ...at(T.PEBBLES), rnd);
  drawDirt(ctx, ...at(T.DIRT_A), 0, rnd);
  drawDirt(ctx, ...at(T.DIRT_B), 1, rnd);
  for (let m = 0; m < 16; m++) drawPathTile(ctx, ...at(T.PATH_BASE + m), m, rnd);

  return canvas;
}

// ---------------- OBJECTS ----------------
// Puno: 32x32. Ang itaas na 16 rows = canopy (overlay, nasa ibabaw ng mga karakter);
// ang ibabang 16 rows = puno ng kahoy (ground layer, may collision).
export function drawTree(ctx, x, y, seed) {
  const rnd = mulberry32(seed);
  const tint = rnd() < 0.5 ? 0 : 1;
  const dark = tint ? "#0f3a2c" : "#123524";
  const mid  = tint ? "#1d6a45" : "#1f5c3b";
  const lite = tint ? "#33995f" : "#2f8a55";

  // anino
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 29, 12, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // puno ng kahoy
  px(ctx, x + 13, y + 20, "#5b3a24", 6, 10);
  px(ctx, x + 13, y + 20, "#7a4f30", 2, 10);
  px(ctx, x + 11, y + 29, "#5b3a24", 2, 1);
  px(ctx, x + 19, y + 29, "#5b3a24", 2, 1);

  // canopy
  fillCircle(ctx, x + 16, y + 11, 11, dark);
  fillCircle(ctx, x + 9, y + 15, 8, dark);
  fillCircle(ctx, x + 23, y + 15, 8, dark);
  fillCircle(ctx, x + 15, y + 10, 9, mid);
  fillCircle(ctx, x + 9, y + 14, 6, mid);
  fillCircle(ctx, x + 22, y + 14, 6, mid);
  fillCircle(ctx, x + 13, y + 7, 4, lite);
  fillCircle(ctx, x + 20, y + 11, 3, lite);
  for (let i = 0; i < 10; i++) {
    px(ctx, x + 5 + Math.floor(rnd() * 22), y + 3 + Math.floor(rnd() * 17), rnd() < 0.5 ? "#45a86c" : dark);
  }
}

// Hinahati ang puno sa dalawang layer
export function drawTreeSplit(groundCtx, overlayCtx, x, y, seed) {
  groundCtx.save();
  groundCtx.beginPath();
  groundCtx.rect(x, y + TILE, 32, TILE);
  groundCtx.clip();
  drawTree(groundCtx, x, y, seed);
  groundCtx.restore();

  overlayCtx.save();
  overlayCtx.beginPath();
  overlayCtx.rect(x, y, 32, TILE);
  overlayCtx.clip();
  drawTree(overlayCtx, x, y, seed);
  overlayCtx.restore();
}

export function drawRock(ctx, x, y, seed) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 13, 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  fillCircle(ctx, x + 8, y + 9, 5, "#475569");
  fillCircle(ctx, x + 8, y + 8, 4, "#64748b");
  fillCircle(ctx, x + 6, y + 6, 2, "#94a3b8");
  if (rnd() < 0.5) px(ctx, x + 10, y + 9, "#334155", 2, 1);
}

export function drawBush(ctx, x, y, seed) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 13, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  fillCircle(ctx, x + 8, y + 9, 5, "#14402b");
  fillCircle(ctx, x + 6, y + 9, 4, "#1f5c3b");
  fillCircle(ctx, x + 10, y + 9, 4, "#1f5c3b");
  fillCircle(ctx, x + 7, y + 7, 2, "#2f8a55");
  if (rnd() < 0.5) {
    px(ctx, x + 5, y + 9, "#ef4444");
    px(ctx, x + 10, y + 8, "#ef4444");
  }
}
