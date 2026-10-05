// ============================================================
// TILESET: procedural 16x16 pixel-art tiles (no external assets)
// Atlas layout (16 columns x 4 rows, 16px per tile):
//   row 0:  0-2 ground A/B/C | 3 tuft | 4-6 decoration | 7 pebbles | 8-9 dirt
//   row 1:  16-31 path autotile (16 + mask; N=1 E=2 S=4 W=8 = connected path)
//   row 2:  32-47 liquid autotile (sea / lava / void; mask = connected liquid)
//   row 3:  48-49 wall/cliff
// Each platform has its own THEME (colours, decoration, tree kind). The default
// theme is the plains of Aethelgard (Acts I–VI).
// ============================================================
export const TILE = 16;
export const ATLAS_COLS = 16;

export const T = {
  GRASS_A: 0, GRASS_B: 1, GRASS_C: 2, TUFT: 3,
  FLOWER_W: 4, FLOWER_Y: 5, FLOWER_R: 6, PEBBLES: 7,
  DIRT_A: 8, DIRT_B: 9,
  PATH_BASE: 16,
  LIQUID_BASE: 32,
  WALL_A: 48, WALL_B: 49
};

// ---------- THEMES ----------
// deco: flowers | mushrooms | shells | ice | embers | rubble | void | pebbles | reeds | sand
// tree: oak | weeping | pine | seastack | spire | ruin | pillar | hoodoo | cypress | crag | cactus
export const THEMES = {
  aethelgard: {
    grass: ["#1d4a34", "#1f4f37", "#1a4531"], grassLight: "#2b6647", grassDark: "#153a29",
    dirt: ["#6b5a41", "#66563d"], dirtLight: "#7b6a4e", dirtDark: "#544631",
    deco: "flowers", decoColors: ["#e2e8f0", "#fde047", "#fb7185"],
    liquid: { base: "#1b4f72", light: "#2e7cb0", dark: "#123a55", rim: "#bfe9ff" },
    wall: { base: "#3b4252", light: "#5b6475", dark: "#262b36" },
    tree: "oak", rock: ["#475569", "#64748b", "#94a3b8"], bush: "berry", treeDensity: 0.6
  },
  canopy: {
    grass: ["#1e2a24", "#222f28", "#1a2520"], grassLight: "#3a4d3a", grassDark: "#121a16",
    dirt: ["#3b2f28", "#372b24"], dirtLight: "#4d3e33", dirtDark: "#2a211c",
    deco: "mushrooms", decoColors: ["#7fffd4", "#c77dff", "#5ee7ff"],
    liquid: { base: "#2a1a3a", light: "#4b2f66", dark: "#1a1026", rim: "#9d4edd" },
    wall: { base: "#2b2620", light: "#43392e", dark: "#1a1612" },
    tree: "weeping", rock: ["#2f3a33", "#46554a", "#6a7d6e"], bush: "mushroom", treeDensity: 0.5
  },
  coast: {
    grass: ["#c9b27c", "#c2aa73", "#d1ba86"], grassLight: "#e6d4a3", grassDark: "#a88f5c",
    dirt: ["#6f6a5e", "#676256"], dirtLight: "#8a8577", dirtDark: "#4f4b42",
    deco: "shells", decoColors: ["#f4a3b4", "#ffffff", "#e76f51"],
    liquid: { base: "#135e75", light: "#2a9db8", dark: "#0b3d4f", rim: "#e0f7ff" },
    wall: { base: "#5a4a3a", light: "#7a6650", dark: "#3a2f25" },
    tree: "seastack", rock: ["#2f3e4a", "#46586a", "#6f8499"], bush: "kelp", treeDensity: 0.72
  },
  frost: {
    grass: ["#dbe8f5", "#d2e1f0", "#e6f0fa"], grassLight: "#ffffff", grassDark: "#b7c8dc",
    dirt: ["#8fa3b8", "#889cb0"], dirtLight: "#a9bccf", dirtDark: "#6f8399",
    deco: "ice", decoColors: ["#bfe9ff", "#ffffff", "#8fd3ff"],
    liquid: { base: "#7fb8dc", light: "#bfe0f5", dark: "#5a93b8", rim: "#ffffff" },
    wall: { base: "#44566b", light: "#6b819a", dark: "#2c3a4a" },
    tree: "pine", rock: ["#51677f", "#7189a3", "#b7c8dc"], bush: "snowmound", treeDensity: 0.58
  },
  ash: {
    grass: ["#2e2522", "#332925", "#2a211e"], grassLight: "#4a3a32", grassDark: "#1c1513",
    dirt: ["#3a2c26", "#352822"], dirtLight: "#4f3c33", dirtDark: "#261c18",
    deco: "embers", decoColors: ["#ff7a1a", "#ffd166", "#ff3b3b"],
    liquid: { base: "#e2551b", light: "#ffb347", dark: "#a8310f", rim: "#ffd166" },
    wall: { base: "#241b18", light: "#3a2c26", dark: "#140f0d" },
    tree: "spire", rock: ["#1f1a1a", "#3a2f2c", "#5a4a44"], bush: "emberrock", treeDensity: 0.66
  },
  siege: {
    grass: ["#3a4a2c", "#35442a", "#3f4f30"], grassLight: "#55653f", grassDark: "#27321e",
    dirt: ["#6b5e52", "#665a4e"], dirtLight: "#857668", dirtDark: "#4a4038",
    deco: "rubble", decoColors: ["#d8d4cc", "#8a2c2c", "#ffd166"],
    liquid: { base: "#3a0f16", light: "#6b1a24", dark: "#240a0e", rim: "#c9404e" },
    wall: { base: "#c9c4ba", light: "#ece8df", dark: "#8f8a80" },
    tree: "ruin", rock: ["#8f8a80", "#b5b0a6", "#dcd8cf"], bush: "crate", treeDensity: 0.7
  },
  maw: {
    grass: ["#2a2433", "#2e2838", "#26202e"], grassLight: "#443a52", grassDark: "#1a1622",
    dirt: ["#3a3244", "#362e40"], dirtLight: "#4d4359", dirtDark: "#241e2c",
    deco: "void", decoColors: ["#ff7a1a", "#c77dff", "#9d4edd"],
    liquid: { base: "#2b0f4a", light: "#6a2c9e", dark: "#150726", rim: "#c77dff" },
    wall: { base: "#1f1a26", light: "#322a3d", dark: "#110e16" },
    tree: "pillar", rock: ["#2a2433", "#3f3650", "#5f5270"], bush: "bones", treeDensity: 0.72
  },
  // ---- Dark Continent (Acts XI, XII, XIV) ----
  strand: {
    grass: ["#2a2d33", "#272a30", "#2d3037"], grassLight: "#3f444d", grassDark: "#1b1d22",
    dirt: ["#3a3a3f", "#36363b"], dirtLight: "#4d4d54", dirtDark: "#26262a",
    deco: "shells", decoColors: ["#cbd5e1", "#7dd3fc", "#e2e8f0"],
    liquid: { base: "#0b1220", light: "#1e293b", dark: "#05080f", rim: "#7dd3fc" },
    wall: { base: "#3f3f46", light: "#52525b", dark: "#27272a" },
    tree: "weeping", rock: ["#27272a", "#3f3f46", "#71717a"], bush: "kelp", treeDensity: 0.55
  },
  ossuary: {
    grass: ["#6e6a5c", "#686456", "#747062"], grassLight: "#8a8574", grassDark: "#4f4c42",
    dirt: ["#5a5246", "#554d42"], dirtLight: "#6e6556", dirtDark: "#403a32",
    deco: "pebbles", decoColors: ["#e7e5e4", "#d6d3d1", "#7f1d1d"],
    liquid: { base: "#2b2a24", light: "#45433a", dark: "#1a1915", rim: "#a8a29e" },
    wall: { base: "#d6d3d1", light: "#f5f5f4", dark: "#a8a29e" },
    tree: "ruin", rock: ["#78716c", "#a8a29e", "#e7e5e4"], bush: "bones", treeDensity: 0.62
  },
  chainspire: {
    grass: ["#2b2626", "#2f2929", "#272222"], grassLight: "#463d3d", grassDark: "#1a1616",
    dirt: ["#3a3030", "#362c2c"], dirtLight: "#4d4040", dirtDark: "#241d1d",
    deco: "embers", decoColors: ["#f43f5e", "#fb7185", "#a1a1aa"],
    liquid: { base: "#1a0710", light: "#4c0519", dark: "#0c0306", rim: "#f43f5e" },
    wall: { base: "#27272a", light: "#3f3f46", dark: "#18181b" },
    tree: "pillar", rock: ["#27272a", "#3f3f46", "#71717a"], bush: "bones", treeDensity: 0.7
  },
  // ---- Frontier maps (js/world/frontiers.js) ----
  rocky: {
    grass: ["#8a7357", "#846d52", "#90795c"], grassLight: "#a88f6e", grassDark: "#6b5a41",
    dirt: ["#6b5a41", "#66563d"], dirtLight: "#7b6a4e", dirtDark: "#544631",
    deco: "pebbles", decoColors: ["#a8a29e", "#d6d3d1", "#e7e5e4"],
    liquid: { base: "#4a5a52", light: "#6b7d72", dark: "#2f3a34", rim: "#a8a29e" },
    wall: { base: "#9a6a3a", light: "#c08a52", dark: "#6b4426" },
    tree: "hoodoo", rock: ["#57534e", "#78716c", "#a8a29e"], bush: "boulder", treeDensity: 0.5
  },
  swamp: {
    grass: ["#2f3a26", "#2b3523", "#33402a"], grassLight: "#4d5c3a", grassDark: "#1f2819",
    dirt: ["#3b3322", "#372f1f"], dirtLight: "#4d4330", dirtDark: "#2a2418",
    deco: "reeds", decoColors: ["#bef264", "#a3a35a", "#f0abfc"],
    liquid: { base: "#1f2e26", light: "#3a5a3f", dark: "#121c17", rim: "#84cc16" },
    wall: { base: "#3b3322", light: "#4d4330", dark: "#241f14" },
    tree: "cypress", rock: ["#3f4a3a", "#57634f", "#7b8a6e"], bush: "reeds", treeDensity: 0.68
  },
  highland: {
    grass: ["#4d6b3a", "#486536", "#53723e"], grassLight: "#6f8f52", grassDark: "#36502a",
    dirt: ["#6b6255", "#665d50"], dirtLight: "#827868", dirtDark: "#4f483e",
    deco: "flowers", decoColors: ["#c4b5fd", "#fde047", "#f9fafb"],
    liquid: { base: "#2c5f7a", light: "#4a8db0", dark: "#1c4257", rim: "#e0f2fe" },
    wall: { base: "#5b6370", light: "#7d8694", dark: "#3b414b" },
    tree: "crag", rock: ["#4b5563", "#6b7280", "#9ca3af"], bush: "heather", treeDensity: 0.55
  },
  desert: {
    grass: ["#d9b87a", "#d4b273", "#dfc084"], grassLight: "#ecd5a4", grassDark: "#b8955a",
    dirt: ["#b08a52", "#a8834c"], dirtLight: "#c49e66", dirtDark: "#8a6a3a",
    deco: "sand", decoColors: ["#e7e5e4", "#a16207", "#fef3c7"],
    liquid: { base: "#a88a5a", light: "#c4a676", dark: "#7a6240", rim: "#ecd5a4" },
    wall: { base: "#c08a52", light: "#dca86e", dark: "#8a5a32" },
    tree: "cactus", rock: ["#8a6a3a", "#b08a52", "#d4b273"], bush: "tumbleweed", treeDensity: 0.45
  }
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
function drawGrass(ctx, x, y, variant, rnd, th) {
  px(ctx, x, y, th.grass[variant % 3], TILE, TILE);
  const n = 5 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) {
    const sx = x + Math.floor(rnd() * TILE);
    const sy = y + Math.floor(rnd() * TILE);
    px(ctx, sx, sy, rnd() < 0.5 ? th.grassDark : th.grassLight);
  }
}

function drawTuft(ctx, x, y, rnd, th) {
  drawGrass(ctx, x, y, 0, rnd, th);
  [[4, 9, 3], [8, 6, 5], [11, 9, 2], [6, 11, 2]].forEach(([bx, by, len]) => {
    px(ctx, x + bx, y + by, th.grassLight, 1, len);
    px(ctx, x + bx, y + by + len, th.grassDark);
  });
}

// Ground decoration by theme (flowers, mushrooms, shells, crystals, embers, ruins, cracks)
function drawDeco(ctx, x, y, color, rnd, th) {
  drawGrass(ctx, x, y, 1, rnd, th);
  const cx = x + 6 + Math.floor(rnd() * 4);
  const cy = y + 5 + Math.floor(rnd() * 4);
  switch (th.deco) {
    case "mushrooms":
      px(ctx, cx, cy + 1, "#d8d0c0", 1, 3);
      px(ctx, cx - 1, cy, color, 3, 1); px(ctx, cx, cy - 1, color);
      px(ctx, cx + 3, cy + 3, "#d8d0c0", 1, 2); px(ctx, cx + 2, cy + 2, color, 3, 1);
      break;
    case "shells":
      px(ctx, cx - 1, cy, color, 3, 2); px(ctx, cx, cy - 1, color);
      px(ctx, cx - 1, cy + 1, "rgba(0,0,0,0.2)", 3, 1);
      break;
    case "ice":
      px(ctx, cx, cy - 2, color, 1, 4); px(ctx, cx - 1, cy, color, 3, 1); px(ctx, cx, cy - 2, "#ffffff");
      break;
    case "embers":
      px(ctx, cx - 2, cy, "#140f0d", 5, 1); px(ctx, cx - 1, cy, color, 3, 1); px(ctx, cx, cy - 1, color);
      break;
    case "rubble":
      px(ctx, cx - 2, cy, "#b5b0a6", 3, 2); px(ctx, cx + 1, cy + 1, "#8f8a80", 2, 2);
      if (color === "#8a2c2c") px(ctx, cx - 3, cy - 2, "#5e3b1a", 1, 4);      // arrow
      break;
    case "void":
      px(ctx, cx - 3, cy, "#110e16", 6, 1); px(ctx, cx - 1, cy - 1, "#110e16", 2, 1);
      px(ctx, cx - 2, cy, color, 4, 1);
      break;
    case "pebbles":
      px(ctx, cx - 2, cy, color, 2, 1); px(ctx, cx + 1, cy + 1, color, 2, 2); px(ctx, cx - 1, cy + 3, th.grassDark, 3, 1);
      break;
    case "reeds":
      px(ctx, cx - 1, cy - 2, th.grassLight, 1, 5); px(ctx, cx + 1, cy - 3, th.grassLight, 1, 6); px(ctx, cx + 3, cy - 1, th.grassDark, 1, 4);
      px(ctx, cx + 1, cy - 4, color, 1, 2);
      break;
    case "sand":
      px(ctx, cx - 3, cy + 1, th.grassLight, 6, 1); px(ctx, cx - 1, cy, th.grassLight, 3, 1);
      if (color === "#e7e5e4") { px(ctx, cx - 2, cy - 2, color, 4, 1); px(ctx, cx - 2, cy - 3, color); px(ctx, cx + 1, cy - 1, color); } // a bleached bone
      break;
    default: // flowers
      px(ctx, cx, cy + 1, th.grassDark, 1, 3);
      px(ctx, cx - 1, cy + 2, th.grassLight);
      px(ctx, cx, cy - 1, color);
      px(ctx, cx - 1, cy, color);
      px(ctx, cx + 1, cy, color);
      px(ctx, cx, cy + 1, color);
      px(ctx, cx, cy, "#ffd166");
  }
}

function drawPebbles(ctx, x, y, rnd, th) {
  drawGrass(ctx, x, y, 2, rnd, th);
  [[3, 9, 3, 2], [9, 5, 2, 2], [10, 11, 3, 2]].forEach(([bx, by, w, h]) => {
    px(ctx, x + bx, y + by, th.rock[1], w, h);
    px(ctx, x + bx, y + by, th.rock[2], 1, 1);
    px(ctx, x + bx, y + by + h, "rgba(0,0,0,0.25)", w, 1);
  });
}

function drawDirt(ctx, x, y, variant, rnd, th) {
  px(ctx, x, y, th.dirt[variant % 2], TILE, TILE);
  for (let i = 0; i < 9; i++) {
    px(ctx, x + Math.floor(rnd() * TILE), y + Math.floor(rnd() * TILE), rnd() < 0.5 ? th.dirtDark : th.dirtLight);
  }
}

// mask bits: N=1, E=2, S=4, W=8 (a connected path in that direction)
function drawPathTile(ctx, x, y, mask, rnd, th) {
  drawDirt(ctx, x, y, 0, rnd, th);

  const fringe = (side) => {
    for (let i = 0; i < TILE; i++) {
      const d = 2 + Math.floor(rnd() * 3);            // 2-4 px thick, uneven
      for (let k = 0; k < d; k++) {
        const isEdge = k === d - 1;
        const color = isEdge ? th.grassDark : th.grass[(i + k) % 3];
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

// Sea / lava / void: waves in the middle, shoreline (ground + foam/glow) on unconnected edges
function drawLiquidTile(ctx, x, y, mask, rnd, th) {
  const L = th.liquid;
  px(ctx, x, y, L.base, TILE, TILE);
  for (let i = 0; i < 4; i++) {
    const wx = x + Math.floor(rnd() * 11), wy = y + 2 + Math.floor(rnd() * 12);
    px(ctx, wx, wy, L.light, 3 + Math.floor(rnd() * 3), 1);
    px(ctx, wx + 1, wy + 1, L.dark, 2, 1);
  }
  const shore = (side) => {
    for (let i = 0; i < TILE; i++) {
      const d = 2 + Math.floor(rnd() * 2);
      for (let k = 0; k <= d; k++) {
        const color = k === d ? L.rim : th.grass[(i + k) % 3];
        if (side === 0) px(ctx, x + i, y + k, color);
        if (side === 1) px(ctx, x + TILE - 1 - k, y + i, color);
        if (side === 2) px(ctx, x + i, y + TILE - 1 - k, color);
        if (side === 3) px(ctx, x + k, y + i, color);
      }
    }
  };
  if (!(mask & 1)) shore(0);
  if (!(mask & 2)) shore(1);
  if (!(mask & 4)) shore(2);
  if (!(mask & 8)) shore(3);
}

// Stone wall / cliff
function drawWall(ctx, x, y, variant, rnd, th) {
  const W = th.wall;
  px(ctx, x, y, W.base, TILE, TILE);
  for (let r = 0; r < 4; r++) {
    const off = (r + variant) % 2 ? 0 : 4;
    for (let b = -1; b < 2; b++) px(ctx, x + off + b * 8, y + r * 4, W.dark, 1, 4);
    px(ctx, x, y + r * 4, W.dark, TILE, 1);
    px(ctx, x + off + 2, y + r * 4 + 1, W.light, 3, 1);
  }
  for (let i = 0; i < 4; i++) px(ctx, x + Math.floor(rnd() * TILE), y + Math.floor(rnd() * TILE), W.light);
}

export function buildTileset(th = THEMES.aethelgard) {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_COLS * TILE;
  canvas.height = 4 * TILE;
  const ctx = canvas.getContext("2d");
  const rnd = mulberry32(777);

  const at = (id) => [(id % ATLAS_COLS) * TILE, Math.floor(id / ATLAS_COLS) * TILE];

  for (let v = 0; v < 3; v++) drawGrass(ctx, ...at(T.GRASS_A + v), v, rnd, th);
  drawTuft(ctx, ...at(T.TUFT), rnd, th);
  drawDeco(ctx, ...at(T.FLOWER_W), th.decoColors[0], rnd, th);
  drawDeco(ctx, ...at(T.FLOWER_Y), th.decoColors[1], rnd, th);
  drawDeco(ctx, ...at(T.FLOWER_R), th.decoColors[2], rnd, th);
  drawPebbles(ctx, ...at(T.PEBBLES), rnd, th);
  drawDirt(ctx, ...at(T.DIRT_A), 0, rnd, th);
  drawDirt(ctx, ...at(T.DIRT_B), 1, rnd, th);
  for (let m = 0; m < 16; m++) drawPathTile(ctx, ...at(T.PATH_BASE + m), m, rnd, th);
  for (let m = 0; m < 16; m++) drawLiquidTile(ctx, ...at(T.LIQUID_BASE + m), m, rnd, th);
  drawWall(ctx, ...at(T.WALL_A), 0, rnd, th);
  drawWall(ctx, ...at(T.WALL_B), 1, rnd, th);

  return canvas;
}

// ---------------- OBJECTS ----------------
// Tree/pillar: 32x32. The top 16 rows = overlay (above the characters);
// the bottom 16 rows = ground layer (with collision).
function drawOak(ctx, x, y, rnd) {
  const tint = rnd() < 0.5 ? 0 : 1;
  const dark = tint ? "#0f3a2c" : "#123524";
  const mid  = tint ? "#1d6a45" : "#1f5c3b";
  const lite = tint ? "#33995f" : "#2f8a55";

  px(ctx, x + 13, y + 20, "#5b3a24", 6, 10);
  px(ctx, x + 13, y + 20, "#7a4f30", 2, 10);
  px(ctx, x + 11, y + 29, "#5b3a24", 2, 1);
  px(ctx, x + 19, y + 29, "#5b3a24", 2, 1);

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

// Weeping tree of the Whispering Canopy: hanging vines, black sap, glowing mushrooms
function drawWeeping(ctx, x, y, rnd) {
  px(ctx, x + 12, y + 16, "#3b2618", 8, 14);
  px(ctx, x + 12, y + 16, "#5a3d2b", 2, 14);
  px(ctx, x + 15, y + 20, "#0d0810", 1, 5);                    // black sap
  px(ctx, x + 9, y + 28, "#3b2618", 4, 2); px(ctx, x + 19, y + 28, "#3b2618", 4, 2);
  fillCircle(ctx, x + 16, y + 10, 12, "#16241c");
  fillCircle(ctx, x + 15, y + 9, 9, "#223a2a");
  fillCircle(ctx, x + 12, y + 6, 4, "#2f4d36");
  for (let v = 0; v < 7; v++) {
    const vx = x + 5 + Math.floor(rnd() * 22), len = 6 + Math.floor(rnd() * 10);
    px(ctx, vx, y + 12, rnd() < 0.5 ? "#2f4d36" : "#1c3024", 1, len);
  }
  const glow = rnd() < 0.5 ? "#7fffd4" : "#c77dff";
  px(ctx, x + 8, y + 27, glow); px(ctx, x + 7, y + 26, glow, 3, 1);
  px(ctx, x + 23, y + 26, glow); px(ctx, x + 22, y + 25, glow, 3, 1);
  for (let i = 0; i < 4; i++) px(ctx, x + 4 + Math.floor(rnd() * 24), y + 2 + Math.floor(rnd() * 14), "#c77dff");
}

// Snow-laden pine (Frostfang)
function drawPine(ctx, x, y, rnd) {
  px(ctx, x + 14, y + 24, "#4a3222", 4, 6);
  const layers = [[4, 6], [9, 9], [14, 12], [19, 14]];
  layers.forEach(([ty, hw]) => {
    for (let r = 0; r < 6; r++) {
      const w = Math.round((hw * (r + 1)) / 6);
      px(ctx, x + 16 - w, y + ty + r, r < 2 ? "#e6f0fa" : r % 2 ? "#1d4a3f" : "#23574a", w * 2, 1);
    }
  });
  px(ctx, x + 15, y + 1, "#ffffff", 2, 3);
  for (let i = 0; i < 6; i++) px(ctx, x + 6 + Math.floor(rnd() * 20), y + 6 + Math.floor(rnd() * 18), "#ffffff");
}

// Sea stack with coral and bones (Cerulean Abyss)
function drawSeastack(ctx, x, y, rnd) {
  const B = "#2f3e4a", D = "#1c2730", L = "#46586a";
  for (let r = 0; r < 30; r++) {
    const w = 3 + Math.round(r * 0.35);
    px(ctx, x + 16 - w, y + r, r % 5 === 0 ? D : B, w * 2, 1);
    px(ctx, x + 16 - w, y + r, L, 2, 1);
  }
  [[8, 14], [22, 10], [12, 22]].forEach(([cx, cy]) => {
    px(ctx, x + cx, y + cy, "#e76f51", 1, 4); px(ctx, x + cx - 1, y + cy + 1, "#e76f51"); px(ctx, x + cx + 1, y + cy, "#f4a3b4");
  });
  if (rnd() < 0.5) { px(ctx, x + 18, y + 18, "#e9e4d4", 2, 2); px(ctx, x + 18, y + 18, "#1b1b2f"); }
  px(ctx, x + 6, y + 29, "#e0f7ff", 20, 1);
}

// Obsidian spike with embers (Ashfall)
function drawSpire(ctx, x, y, rnd) {
  for (let r = 0; r < 30; r++) {
    const w = Math.max(1, Math.round(r * 0.3));
    px(ctx, x + 16 - w, y + r, "#15101a", w * 2, 1);
    px(ctx, x + 16 - w, y + r, "#3a2f3f", 1, 1);
  }
  for (let i = 0; i < 5; i++) {
    const cy = 8 + Math.floor(rnd() * 20);
    px(ctx, x + 15 + (i % 2), y + cy, "#ff7a1a"); px(ctx, x + 15 + (i % 2), y + cy + 1, "#ffd166");
  }
}

// Crumbled Citadel wall (Siege)
function drawRuin(ctx, x, y, rnd) {
  const h = 14 + Math.floor(rnd() * 12);
  for (let r = 30 - h; r < 30; r++) {
    px(ctx, x + 6, y + r, r % 4 === 0 ? "#8f8a80" : "#c9c4ba", 20, 1);
    if (r % 4 === 0) continue;
    px(ctx, x + (r % 8 < 4 ? 11 : 17), y + r, "#8f8a80");
  }
  px(ctx, x + 6, y + 30 - h, "#ece8df", 20, 1);
  for (let k = 0; k < 4; k++) px(ctx, x + 8 + k * 5, y + 30 - h - (k % 2 ? 2 : 0), "#c9c4ba", 3, 2);
  if (rnd() < 0.5) { px(ctx, x + 14, y + 30 - h - 6, "#ff7a1a", 3, 4); px(ctx, x + 15, y + 30 - h - 8, "#ffd166", 1, 3); } // fire
}

// Broken pillar (Maw of Damnation)
function drawPillar(ctx, x, y, rnd) {
  const h = 16 + Math.floor(rnd() * 12);
  for (let r = 30 - h; r < 30; r++) {
    px(ctx, x + 11, y + r, "#2a2433", 10, 1);
    px(ctx, x + 11, y + r, "#3f3650", 2, 1);
    px(ctx, x + 19, y + r, "#1a1622", 2, 1);
  }
  px(ctx, x + 9, y + 28, "#2a2433", 14, 2);
  px(ctx, x + 10, y + 30 - h, "#3f3650", 12, 2);
  px(ctx, x + 12, y + 30 - h - 2, "#2a2433", 3, 2);
  px(ctx, x + 15, y + 18, "#ff7a1a", 1, 3);
}

// Sandstone hoodoo (Greyhorn Badlands): stacked, striped rock with a cap stone
function drawHoodoo(ctx, x, y, rnd) {
  const h = 18 + Math.floor(rnd() * 10);
  for (let r = 30 - h; r < 30; r++) {
    const w = 4 + Math.round(Math.sin(r * 0.5) * 1.5) + (r > 24 ? 2 : 0);
    px(ctx, x + 16 - w, y + r, r % 6 < 3 ? "#b0743e" : "#c88a52", w * 2, 1);
    px(ctx, x + 16 - w, y + r, "#d9a46a", 1, 1);
    px(ctx, x + 15 + w, y + r, "#7a4a26", 1, 1);
  }
  px(ctx, x + 10, y + 30 - h - 3, "#78716c", 12, 3);
  px(ctx, x + 10, y + 30 - h - 3, "#a8a29e", 12, 1);
}

// Bald cypress with hanging moss (Gloomwater Fens)
function drawCypress(ctx, x, y, rnd) {
  px(ctx, x + 13, y + 18, "#3b2f22", 6, 12);
  px(ctx, x + 11, y + 27, "#3b2f22", 2, 3); px(ctx, x + 19, y + 27, "#3b2f22", 2, 3);   // knees
  fillCircle(ctx, x + 16, y + 10, 11, "#1f2e1c");
  fillCircle(ctx, x + 14, y + 8, 7, "#2f4426");
  fillCircle(ctx, x + 20, y + 11, 5, "#2f4426");
  for (let k = 0; k < 5; k++) {
    const mx = x + 7 + k * 4 + Math.floor(rnd() * 2);
    px(ctx, mx, y + 14, "#8a9a6a", 1, 4 + Math.floor(rnd() * 6));                  // hanging moss
  }
  if (rnd() < 0.4) px(ctx, x + 18, y + 6, "#bef264");
}

// Wind-bent pine on a crag (Stormcrown Highlands)
function drawCrag(ctx, x, y, rnd) {
  fillCircle(ctx, x + 16, y + 27, 6, "#5b6370");
  px(ctx, x + 11, y + 22, "#7d8694", 6, 2);
  px(ctx, x + 15, y + 12, "#4a3222", 3, 12);
  const lean = rnd() < 0.5 ? -1 : 1;
  [[6, 7], [10, 9], [14, 11]].forEach(([ty, hw], k) => {
    for (let r = 0; r < 4; r++) {
      const w = Math.round((hw * (r + 1)) / 4);
      px(ctx, x + 16 - w + lean * (3 - k), y + ty + r, r % 2 ? "#2d4a2a" : "#3a5f36", w * 2, 1);
    }
  });
  px(ctx, x + 15 + lean * 3, y + 3, "#3a5f36", 2, 3);
}

// Saguaro-style cactus (Sunscorch Dunes)
function drawCactus(ctx, x, y, rnd) {
  const G = "#4d7c3a", D = "#365a28", L = "#6b9a52";
  px(ctx, x + 14, y + 6, G, 5, 24); px(ctx, x + 14, y + 6, L, 1, 24); px(ctx, x + 18, y + 6, D, 1, 24);
  px(ctx, x + 15, y + 4, G, 3, 2);
  const armL = 12 + Math.floor(rnd() * 6), armR = 9 + Math.floor(rnd() * 6);
  px(ctx, x + 9, y + armL, G, 5, 3); px(ctx, x + 9, y + armL - 7, G, 3, 8); px(ctx, x + 9, y + armL - 7, L, 1, 8);
  px(ctx, x + 19, y + armR, G, 5, 3); px(ctx, x + 21, y + armR - 6, G, 3, 7); px(ctx, x + 23, y + armR - 6, D, 1, 7);
  for (let i = 0; i < 6; i++) px(ctx, x + 14 + Math.floor(rnd() * 5), y + 8 + Math.floor(rnd() * 20), "#d9f99d");
  if (rnd() < 0.35) { px(ctx, x + 15, y + 3, "#f472b6", 2, 1); px(ctx, x + 16, y + 2, "#fbcfe8"); }   // flower
}

const TREES = { oak: drawOak, weeping: drawWeeping, pine: drawPine, seastack: drawSeastack, spire: drawSpire, ruin: drawRuin, pillar: drawPillar,
  hoodoo: drawHoodoo, cypress: drawCypress, crag: drawCrag, cactus: drawCactus };

function drawTree(ctx, x, y, seed, kind = "oak") {
  const rnd = mulberry32(seed);
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 29, 12, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  (TREES[kind] || drawOak)(ctx, x, y, rnd);
}

// Splits the tree into two layers
export function drawTreeSplit(groundCtx, overlayCtx, x, y, seed, kind = "oak") {
  groundCtx.save();
  groundCtx.beginPath();
  groundCtx.rect(x, y + TILE, 32, TILE);
  groundCtx.clip();
  drawTree(groundCtx, x, y, seed, kind);
  groundCtx.restore();

  overlayCtx.save();
  overlayCtx.beginPath();
  overlayCtx.rect(x, y, 32, TILE);
  overlayCtx.clip();
  drawTree(overlayCtx, x, y, seed, kind);
  overlayCtx.restore();
}

export function drawRock(ctx, x, y, seed, colors = THEMES.aethelgard.rock) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 13, 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  fillCircle(ctx, x + 8, y + 9, 5, colors[0]);
  fillCircle(ctx, x + 8, y + 8, 4, colors[1]);
  fillCircle(ctx, x + 6, y + 6, 2, colors[2]);
  if (rnd() < 0.5) px(ctx, x + 10, y + 9, "rgba(0,0,0,0.35)", 2, 1);
}

export function drawBush(ctx, x, y, seed, kind = "berry") {
  const rnd = mulberry32(seed);
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(x + 8, y + 13, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  switch (kind) {
    case "mushroom":
      px(ctx, x + 6, y + 8, "#d8d0c0", 2, 5); fillCircle(ctx, x + 7, y + 7, 3, "#8e3fbf"); px(ctx, x + 6, y + 6, "#e0aaff");
      px(ctx, x + 11, y + 10, "#d8d0c0", 1, 3); fillCircle(ctx, x + 11, y + 9, 2, "#2a9d8f"); px(ctx, x + 11, y + 8, "#7fffd4");
      break;
    case "kelp":
      for (let k = 0; k < 3; k++) px(ctx, x + 5 + k * 3, y + 4 + (k % 2) * 2, k % 2 ? "#2f6b3f" : "#3f8a4f", 2, 9 - (k % 2) * 2);
      px(ctx, x + 4, y + 12, "#e9e4d4", 3, 1);
      break;
    case "snowmound":
      fillCircle(ctx, x + 8, y + 10, 5, "#b7c8dc"); fillCircle(ctx, x + 7, y + 9, 4, "#ffffff");
      break;
    case "emberrock":
      fillCircle(ctx, x + 8, y + 9, 5, "#1f1a1a"); px(ctx, x + 6, y + 8, "#ff7a1a", 3, 1); px(ctx, x + 8, y + 10, "#ffd166");
      break;
    case "crate":
      px(ctx, x + 3, y + 5, "#7a5230", 10, 8); px(ctx, x + 3, y + 5, "#9a6a40", 10, 1);
      px(ctx, x + 3, y + 8, "#5e3b1a", 10, 1); px(ctx, x + 7, y + 5, "#5e3b1a", 1, 8);
      break;
    case "boulder":
      fillCircle(ctx, x + 8, y + 9, 5, "#78716c"); fillCircle(ctx, x + 7, y + 8, 3, "#a8a29e"); px(ctx, x + 10, y + 10, "#57534e", 2, 1);
      break;
    case "reeds":
      for (let k = 0; k < 5; k++) px(ctx, x + 4 + k * 2, y + 4 + (k % 2) * 2, k % 2 ? "#5b6b3f" : "#7a8a52", 1, 9 - (k % 2) * 2);
      px(ctx, x + 6, y + 3, "#5e3b1a", 1, 3); px(ctx, x + 10, y + 4, "#5e3b1a", 1, 3);   // cattails
      break;
    case "heather":
      fillCircle(ctx, x + 8, y + 10, 4, "#4d6b3a");
      for (let k = 0; k < 5; k++) px(ctx, x + 5 + Math.floor(rnd() * 7), y + 7 + Math.floor(rnd() * 4), "#c4b5fd");
      break;
    case "tumbleweed":
      ctx.strokeStyle = "#a8834c"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x + 8, y + 9, 4, 0, Math.PI * 2); ctx.stroke();
      px(ctx, x + 6, y + 8, "#8a6a3a", 4, 1); px(ctx, x + 8, y + 6, "#8a6a3a", 1, 5);
      break;
    case "bones":
      px(ctx, x + 3, y + 10, "#e9e4d4", 9, 1); px(ctx, x + 3, y + 9, "#e9e4d4"); px(ctx, x + 11, y + 11, "#e9e4d4");
      fillCircle(ctx, x + 10, y + 7, 2, "#e9e4d4"); px(ctx, x + 9, y + 7, "#1b1b2f"); px(ctx, x + 11, y + 7, "#1b1b2f");
      break;
    default:
      fillCircle(ctx, x + 8, y + 9, 5, "#14402b");
      fillCircle(ctx, x + 6, y + 9, 4, "#1f5c3b");
      fillCircle(ctx, x + 10, y + 9, 4, "#1f5c3b");
      fillCircle(ctx, x + 7, y + 7, 2, "#2f8a55");
      if (rnd() < 0.5) {
        px(ctx, x + 5, y + 9, "#ef4444");
        px(ctx, x + 10, y + 8, "#ef4444");
      }
  }
}
