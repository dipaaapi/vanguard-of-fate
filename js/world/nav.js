import { TILE } from "./tileset.js";

// ==================== GROUND MOVEMENT (monsters, mercenaries, walking pets) ====================
// Trees, rocks, water, lava, cliffs, the Citadel's walls and the barrier at the map's edge block
// everyone who walks; only flyers cross them. A walker that runs into one slides along it, and one
// heading for the hero follows a flow field around obstacles instead of pressing against them.
// The field is a breadth-first search over the tile grid from the hero's tile, rebuilt when the hero
// changes tile (at most every REBUILD frames). Feet: (x + footX, y + footY), 10 / 20 for monsters.

const REBUILD = 8;
const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

// The walkable grid of a place (tile obstacles + the Citadel's colliders), built once and cached
function gridOf(stage) {
  if (stage.navGrid) return stage.navGrid;
  const tm = stage.tilemap;
  if (!tm || !tm.solid) return null;
  const block = Uint8Array.from(tm.solid);
  const boxes = (stage.castle && stage.castle.solidColliders) || [];
  boxes.forEach((b) => {
    for (let ty = Math.floor(b.y / TILE); ty <= Math.floor((b.y + b.h - 1) / TILE); ty++) {
      for (let tx = Math.floor(b.x / TILE); tx <= Math.floor((b.x + b.w - 1) / TILE); tx++) {
        if (tm.inBounds(tx, ty)) block[tm.idx(tx, ty)] = 1;
      }
    }
  });
  stage.navGrid = { tm, block, dist: new Int32Array(tm.cols * tm.rows), goal: -1, age: REBUILD };
  return stage.navGrid;
}

// Whether a point is inside an obstacle (or off the map)
export function blockedAt(stage, px, py) {
  const g = stage && gridOf(stage);
  if (!g) return false;
  const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
  if (!g.tm.inBounds(tx, ty)) return true;
  return g.block[g.tm.idx(tx, ty)] === 1;
}

// A walker's feet: a small box, so it can't squeeze half into a tree
export function footBlocked(stage, fx, fy) {
  return blockedAt(stage, fx - 4, fy - 2) || blockedAt(stage, fx + 4, fy - 2) || blockedAt(stage, fx - 4, fy + 2) || blockedAt(stage, fx + 4, fy + 2);
}

// Nothing in the way along a straight line
export function clearLine(stage, x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 6);
  for (let k = 1; k < n; k++) {
    if (blockedAt(stage, x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n)) return false;
  }
  return true;
}

// Every frame: the hero's feet as the goal of the flow field
export function trackGoal(stage, gx, gy) {
  const g = stage && gridOf(stage);
  if (!g) return;
  g.age++;
  const tx = Math.floor(gx / TILE), ty = Math.floor(gy / TILE);
  if (!g.tm.inBounds(tx, ty)) return;
  const goal = g.tm.idx(tx, ty);
  if (goal === g.goal || g.age < REBUILD) return;
  g.goal = goal;
  g.age = 0;
  const { cols, rows } = g.tm, dist = g.dist, block = g.block;
  dist.fill(-1);
  dist[goal] = 0;
  const q = new Int32Array(cols * rows);
  let head = 0, tail = 0;
  q[tail++] = goal;
  while (head < tail) {
    const i = q[head++], x = i % cols, y = (i - x) / cols, d = dist[i] + 1;
    for (const [dx, dy] of STEPS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const j = ny * cols + nx;
      if (dist[j] !== -1 || block[j]) continue;
      // no cutting a corner between two obstacles
      if (dx && dy && (block[y * cols + nx] || block[ny * cols + x])) continue;
      dist[j] = d;
      q[tail++] = j;
    }
  }
}

// Unit direction from (px, py) toward the hero around obstacles, or null (no field, or cut off)
export function towardGoal(stage, px, py) {
  const g = stage && gridOf(stage);
  if (!g || g.goal < 0) return null;
  const { cols, rows } = g.tm;
  const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
  if (tx < 0 || ty < 0 || tx >= cols || ty >= rows) return null;
  const here = g.dist[ty * cols + tx];
  let best = here >= 0 ? here : Infinity, bx = -1, by = -1;
  for (const [dx, dy] of STEPS) {
    const nx = tx + dx, ny = ty + dy;
    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
    const d = g.dist[ny * cols + nx];
    if (d >= 0 && d < best) { best = d; bx = nx; by = ny; }
  }
  if (bx < 0) return null;
  const vx = bx * TILE + TILE / 2 - px, vy = by * TILE + TILE / 2 - py, len = Math.hypot(vx, vy) || 1;
  return [vx / len, vy / len];
}

// The way to walk toward (gx, gy): straight when nothing is in the way, else around obstacles
// (only toward the hero, the goal of the field). Returns a unit vector.
export function steer(stage, px, py, gx, gy, towardHero) {
  const dx = gx - px, dy = gy - py, d = Math.hypot(dx, dy) || 1;
  if (!stage || !towardHero || clearLine(stage, px, py, gx, gy)) return [dx / d, dy / d];
  return towardGoal(stage, px, py) || [dx / d, dy / d];
}

// After a walker has moved (or been knocked back): keep it inside the map's bounds and out of every
// obstacle, sliding along it. e.navX / e.navY remember its last clear spot. Flyers only keep to the bounds.
export function confine(stage, e, ox = 10, oy = 20, flying = false) {
  if (!stage) return;
  const b = stage.bounds;
  if (b) {
    e.x = Math.max(b.minX, Math.min(b.maxX, e.x));
    e.y = Math.max(b.minY, Math.min(b.maxY, e.y));
  }
  if (flying) return;
  const hit = (x, y) => footBlocked(stage, x + ox, y + oy);
  if (!hit(e.x, e.y)) { e.navX = e.x; e.navY = e.y; return; }
  if (e.navX === undefined || hit(e.navX, e.navY)) {
    // No clear spot known (spawned or dropped inside an obstacle): step out to the nearest open ground
    for (let r = 8; r <= 48; r += 8) {
      for (let k = 0; k < 8; k++) {
        const x = e.x + Math.round(Math.cos((k * Math.PI) / 4) * r), y = e.y + Math.round(Math.sin((k * Math.PI) / 4) * r);
        if (!hit(x, y)) { e.x = e.navX = x; e.y = e.navY = y; return; }
      }
    }
    return;
  }
  if (!hit(e.x, e.navY)) e.y = e.navY;
  else if (!hit(e.navX, e.y)) e.x = e.navX;
  else { e.x = e.navX; e.y = e.navY; }
}
