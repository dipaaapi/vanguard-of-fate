// ============================================================
// LAYOUTS: seeded terrain grids for js/world/terrain.js (0 liquid, 1 ground, 2 path).
// One generator per kind of map, so any platform can ask for the shape it needs:
//   islands   chunky floating blocks in open water (the sample look)
//   coast     a mainland along one side, ragged shoreline, offshore islets
//   lakes     open ground with ponds and pools
//   river     ground cut by a winding river with fords
//   atoll     a ring of land around a lagoon
//   archipelago  many small round islands
// Every layout gets paths between a few points of interest on its biggest landmass.
//
//   const { cells, cols, rows } = makeLayout("coast", 60, 40, 1234);
// ============================================================
import { mulberry32 } from "./tileset.js";

function h2(x, y, s) {
  let n = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1103515245);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, cell, s) {
  const gx = Math.floor(x / cell), gy = Math.floor(y / cell), fx = x / cell - gx, fy = y / cell - gy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = h2(gx, gy, s), b = h2(gx + 1, gy, s), c = h2(gx, gy + 1, s), d = h2(gx + 1, gy + 1, s);
  return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
}
const fbm = (x, y, cell, s) => noise(x, y, cell, s) * 0.6 + noise(x, y, cell / 2, s + 1) * 0.28 + noise(x, y, cell / 4, s + 2) * 0.12;

const GENERATORS = {
  islands(cols, rows, s) {
    // blocks of 3×3 cells kept or dropped, then grown by noise: square-ish islands with notches
    const B = 3, out = new Uint8Array(cols * rows);
    for (let y = 1; y < rows - 1; y++) for (let x = 1; x < cols - 1; x++) {
      const bx = Math.floor(x / B), by = Math.floor(y / B);
      const edge = Math.min(x, y, cols - 1 - x, rows - 1 - y);
      let v = h2(bx, by, s) * 0.75 + fbm(x, y, 6, s + 3) * 0.45;
      if (edge < 3) v -= (3 - edge) * 0.25;
      out[y * cols + x] = v > 0.62 ? 1 : 0;
    }
    return out;
  },
  coast(cols, rows, s) {
    const out = new Uint8Array(cols * rows), side = (s >>> 3) % 4;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const t = [x / cols, 1 - x / cols, y / rows, 1 - y / rows][side];   // 0 at the land side
      const v = 1.15 - t * 1.6 + (fbm(x, y, 10, s) - 0.5) * 0.9 + (fbm(x, y, 3, s + 5) - 0.5) * 0.25;
      out[y * cols + x] = v > 0.35 || (v > 0.05 && fbm(x, y, 4, s + 9) > 0.78) ? 1 : 0;
    }
    return out;
  },
  lakes(cols, rows, s) {
    const out = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const edge = Math.min(x, y, cols - 1 - x, rows - 1 - y);
      const v = fbm(x, y, 9, s);
      out[y * cols + x] = edge < 1 ? 0 : v < 0.37 + (edge < 3 ? 0.08 * (3 - edge) : 0) ? 0 : 1;
    }
    return out;
  },
  river(cols, rows, s) {
    const out = new Uint8Array(cols * rows).fill(1), rnd = mulberry32(s);
    const horizontal = cols >= rows;
    const len = horizontal ? cols : rows, across = horizontal ? rows : cols;
    let c = across * (0.3 + rnd() * 0.4), w = 2;
    for (let i = 0; i < len; i++) {
      c += (noise(i, 0, 7, s) - 0.5) * 1.6;
      c = Math.max(4, Math.min(across - 5, c));
      w = 1.6 + noise(i, 3, 9, s + 1) * 1.8;
      for (let k = Math.floor(c - w); k <= Math.ceil(c + w); k++) {
        const ford = noise(i, 9, 5, s + 2) > 0.8 && w < 2.2;   // shallow crossing
        if (!ford) out[horizontal ? k * cols + i : i * cols + k] = 0;
      }
    }
    // a few ponds along the banks
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (fbm(x, y, 6, s + 4) < 0.22) out[y * cols + x] = 0;
    return out;
  },
  atoll(cols, rows, s) {
    const out = new Uint8Array(cols * rows), cx = cols / 2, cy = rows / 2;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - cx) / (cols / 2), (y - cy) / (rows / 2)) + (fbm(x, y, 6, s) - 0.5) * 0.35;
      out[y * cols + x] = d > 0.42 && d < 0.82 ? 1 : 0;
    }
    return out;
  },
  archipelago(cols, rows, s) {
    const out = new Uint8Array(cols * rows), rnd = mulberry32(s);
    const n = Math.round((cols * rows) / 90);
    for (let i = 0; i < n; i++) {
      const ix = 2 + rnd() * (cols - 4), iy = 2 + rnd() * (rows - 4), r = 1.2 + rnd() * 3.2;
      for (let y = Math.floor(iy - r - 2); y <= iy + r + 2; y++) for (let x = Math.floor(ix - r - 2); x <= ix + r + 2; x++) {
        if (x < 1 || y < 1 || x >= cols - 1 || y >= rows - 1) continue;
        if (Math.hypot(x - ix, (y - iy) * 1.15) + (noise(x, y, 3, s + i) - 0.5) * 1.6 < r) out[y * cols + x] = 1;
      }
    }
    return out;
  }
};
export const LAYOUT_KINDS = Object.keys(GENERATORS);

// Largest 4-connected landmass, as a list of cell indices
function biggestLand(cells, cols, rows) {
  const seen = new Uint8Array(cells.length);
  let best = [];
  for (let i = 0; i < cells.length; i++) {
    if (!cells[i] || seen[i]) continue;
    const comp = [i];
    seen[i] = 1;
    for (let k = 0; k < comp.length; k++) {
      const j = comp[k], x = j % cols, y = (j / cols) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy, n = Y * cols + X;
        if (X < 0 || Y < 0 || X >= cols || Y >= rows || seen[n] || !cells[n]) continue;
        seen[n] = 1; comp.push(n);
      }
    }
    if (comp.length > best.length) best = comp;
  }
  return best;
}

// Paths: ground routes from a hub to a few points of interest on the biggest landmass. The route search
// charges for turns and for cells next to the shore, so roads run in long straight stretches inland;
// the first two roads are two cells wide.
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
export function addPaths(cells, cols, rows, seed, count = 4) {
  const land = biggestLand(cells, cols, rows);
  if (land.length < 30) return cells;
  const rnd = mulberry32(seed + 77);
  const ground = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && cells[y * cols + x] > 0;
  const inland = (x, y, r = 1) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (!ground(x + dx, y + dy)) return false;
    return true;
  };
  const spots = land.filter((j) => inland(j % cols, (j / cols) | 0, 2));
  if (spots.length < 10) return cells;
  const hub = spots[(rnd() * spots.length) | 0];
  const goals = [];
  for (let p = 0; p < count; p++) {
    // spread the goals out: best of a few random picks by distance to the hub and earlier goals
    let best = -1, bestD = -1;
    for (let k = 0; k < 8; k++) {
      const j = spots[(rnd() * spots.length) | 0], x = j % cols, y = (j / cols) | 0;
      const d = Math.min(...[hub, ...goals].map((g) => Math.abs(g % cols - x) + Math.abs(((g / cols) | 0) - y)));
      if (d > bestD) { bestD = d; best = j; }
    }
    goals.push(best);
  }
  goals.forEach((goal, p) => {
    // Dijkstra over (cell, heading)
    const N = cells.length, cost = new Float64Array(N * 4).fill(Infinity), from = new Int32Array(N * 4).fill(-1);
    const heap = [];
    const push = (c, st) => {
      heap.push([c, st]);
      for (let i = heap.length - 1; i > 0;) { const pa = (i - 1) >> 1; if (heap[pa][0] <= heap[i][0]) break; [heap[pa], heap[i]] = [heap[i], heap[pa]]; i = pa; }
    };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        for (let i = 0; ;) { const l = 2 * i + 1, r = l + 1; let m = i;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; }
      }
      return top;
    };
    for (let d = 0; d < 4; d++) { cost[hub * 4 + d] = 0; push(0, hub * 4 + d); }
    let end = -1;
    while (heap.length) {
      const [c, st] = pop();
      if (c > cost[st]) continue;
      const j = st >> 2, dir = st & 3, x = j % cols, y = (j / cols) | 0;
      if (j === goal) { end = st; break; }
      for (let nd = 0; nd < 4; nd++) {
        if (nd === ((dir + 2) & 3)) continue;
        const X = x + DIRS[nd][0], Y = y + DIRS[nd][1];
        if (!ground(X, Y)) continue;
        const n = Y * cols + X, ns = n * 4 + nd;
        const step = 1 + (nd !== dir ? 4 : 0) + (inland(X, Y, 2) ? 0 : inland(X, Y, 1) ? 3 : 40) + (cells[n] === 2 ? -0.6 : 0);
        if (c + step < cost[ns]) { cost[ns] = c + step; from[ns] = st; push(c + step, ns); }
      }
    }
    if (end < 0) return;
    for (let st = end; st >= 0; st = from[st]) {
      const j = st >> 2, x = j % cols, y = (j / cols) | 0;
      if (inland(x, y)) cells[j] = 2;
      if (p < 2) {   // main roads: widen sideways to the heading
        const [hx, hy] = DIRS[st & 3];
        const X = x + (hy ? 1 : 0), Y = y + (hx ? 1 : 0);
        if (inland(X, Y)) cells[Y * cols + X] = 2;
      }
    }
  });
  return cells;
}

/** A seeded grid of the given kind (see LAYOUT_KINDS), with paths. */
export function makeLayout(kind, cols, rows, seed = 1, { paths = 4 } = {}) {
  const gen = GENERATORS[kind] || GENERATORS.islands;
  const cells = gen(cols, rows, seed >>> 0);
  if (paths) addPaths(cells, cols, rows, seed, paths);
  return { cells, cols, rows };
}
