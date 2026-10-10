import { footBlocked } from "./world/nav.js";
import { TILE } from "./world/tileset.js";
import { PLATFORMS } from "./world/platforms.js";
import { BAG_SIZE } from "./items/bag.js";
import { FRONTIERS } from "./world/frontiers.js";

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const length = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const at = (o, x = 10, y = 20) => ({ x: o.x + x, y: o.y + y });

export function matchesObjective(enemy, objective) {
  if (!enemy.isAlive || enemy.boss || enemy.minionOf === "summon") return false;
  if (!objective) return !enemy.elite && !enemy.champion;
  if (["hunt", "trophy"].includes(objective.t)) return enemy.key === objective.k;
  if (objective.t === "elite") return enemy.key === objective.k && Boolean(enemy.elite);
  if (objective.t === "champion") return Boolean(enemy.champion || enemy.elite);
  if (objective.t === "sky") return Boolean(enemy.kind?.flying);
  return objective.t === "cull";
}

// Own field, separate from the enemy flow field; recomputed at most four times per second.
// It uses the same foot clearance and castle obstacles as the real collision system.
export class AdventureNavigator {
  constructor() { this.stage = null; this.start = -1; this.builtAt = -Infinity; }

  blocked(fx, fy) {
    if (footBlocked(this.stage, fx, fy)) return true;
    const boxes = [...(this.stage.barracks?.solids || []), ...(this.stage.campSolids || []), ...(this.stage.guildSolids || [])];
    return boxes.some(b => fx + 7 > b.x && fx - 7 < b.x + b.w && fy + 5 > b.y && fy - 9 < b.y + b.h);
  }

  clear(feet, point) {
    const n = Math.max(1, Math.ceil(length(feet, point) / 4));
    for (let k = 1; k <= n; k++)
      if (this.blocked(feet.x + (point.x - feet.x) * k / n, feet.y + (point.y - feet.y) * k / n)) return false;
    return true;
  }

  build(stage, player, now) {
    const tm = stage.tilemap;
    if (!tm?.solid) { this.stage = stage; this.dist = null; return; }
    const sx = Math.floor((player.x + 10) / TILE), sy = Math.floor((player.y + 20) / TILE);
    const start = sy * tm.cols + sx;
    const heading = player.inBoat ? stage.boatSystem.heading : null;
    if (this.stage === stage && this.revision === stage.navRevision && this.boat === Boolean(player.inBoat) && this.heading === heading && now - this.builtAt < 250) return;
    if (this.stage !== stage || this.revision !== stage.navRevision || this.boat !== Boolean(player.inBoat) || this.heading !== heading) {
      this.stage = stage;
      this.block = new Uint8Array(tm.cols * tm.rows);
      const b = stage.bounds || {};
      for (let y = 0; y < tm.rows; y++) for (let x = 0; x < tm.cols; x++) {
        const fx = x * TILE + TILE / 2, fy = y * TILE + TILE / 2;
        this.block[y * tm.cols + x] = player.inBoat
          ? !stage.boatSystem.hullWet(fx, fy + 1, heading)
          : this.blocked(fx, fy) || fx - 10 < (b.minX ?? 0) || fx - 10 > (b.maxX ?? Infinity) ||
            fy - 20 < (b.minY ?? 0) || fy - 20 > (b.maxY ?? Infinity);
      }
    }
    this.stage = stage; this.boat = Boolean(player.inBoat); this.heading = heading; this.start = start; this.builtAt = now;
    this.revision = stage.navRevision;
    this.dist = new Int32Array(tm.cols * tm.rows).fill(-1);
    this.prev = new Int32Array(tm.cols * tm.rows).fill(-1);
    if (sx < 0 || sy < 0 || sx >= tm.cols || sy >= tm.rows) return;
    const queue = new Int32Array(this.dist.length);
    let head = 0, tail = 1; queue[0] = start; this.dist[start] = 0;
    while (head < tail) {
      const i = queue[head++], x = i % tm.cols, y = Math.floor(i / tm.cols);
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, j = ny * tm.cols + nx;
        if (nx < 0 || ny < 0 || nx >= tm.cols || ny >= tm.rows || this.block[j] || this.dist[j] >= 0) continue;
        if (dx && dy && (this.block[y * tm.cols + nx] || this.block[ny * tm.cols + x])) continue;
        this.dist[j] = this.dist[i] + 1; this.prev[j] = i; queue[tail++] = j;
      }
    }
  }

  endpoint(point, radius = 0) {
    if (!this.dist) return { distance: 0, index: -1 };
    const { cols, rows } = this.stage.tilemap;
    const tx = Math.floor(point.x / TILE), ty = Math.floor(point.y / TILE);
    const r = Math.ceil(radius / TILE);
    let best = null;
    for (let y = Math.max(0, ty - r); y <= Math.min(rows - 1, ty + r); y++)
      for (let x = Math.max(0, tx - r); x <= Math.min(cols - 1, tx + r); x++) {
        const index = y * cols + x, d = this.dist[index];
        if (d < 0 || this.block[index]) continue;
        const gap = Math.hypot(x * TILE + TILE / 2 - point.x, y * TILE + TILE / 2 - point.y);
        if (radius && gap > radius) continue;
        const score = d * TILE + gap * 0.1;
        if (!best || score < best.score) best = { index, distance: d * TILE, score };
      }
    return best;
  }

  direction(player, point, radius = 0) {
    const feet = at(player);
    if (length(feet, point) <= radius) return [0, 0];
    if (!this.dist || (!player.inBoat && this.clear(feet, point))) {
      const d = length(feet, point) || 1;
      return [(point.x - feet.x) / d, (point.y - feet.y) / d];
    }
    const end = this.endpoint(point, radius);
    if (!end) return null;
    const route = [];
    let i = end.index;
    while (i !== this.start && i >= 0) { route.push(i); i = this.prev[i]; }
    // Follow the nearest still-ahead waypoint of the cached route.
    let nearest = route.length - 1, distance = Infinity;
    for (let j = 0; j < route.length; j++) {
      const x = route[j] % this.stage.tilemap.cols * TILE + TILE / 2;
      const y = Math.floor(route[j] / this.stage.tilemap.cols) * TILE + TILE / 2;
      const d = Math.hypot(x - feet.x, y - feet.y);
      if (d < distance) { distance = d; nearest = j; }
    }
    const next = route[Math.max(0, nearest - (distance < 5 ? 1 : 0))];
    if (next === undefined) return [0, 0];
    const x = next % this.stage.tilemap.cols * TILE + TILE / 2;
    const y = Math.floor(next / this.stage.tilemap.cols) * TILE + TILE / 2;
    const d = Math.hypot(x - feet.x, y - feet.y) || 1;
    return [(x - feet.x) / d, (y - feet.y) / d];
  }
}

// A route chooses actual gates/trails. It never teleports or changes quest progress.
export function routeExit(stage, destination, quest, hub) {
  const graph = {};
  graph.hub = hub.portals.portals.filter(p => quest.unlocked(p.dest)).map(p => ({ ...p }));
  for (const [id, d] of Object.entries({ ...PLATFORMS, ...FRONTIERS })) {
    graph[id] = [{ ...d.gate, id: "RETURN", dest: d.from || "hub" },
      ...(d.trail ? [{ ...d.trail }] : []), ...(d.exits || []),
      ...(d.rift && quest.unlocked(d.rift.dest) ? [{ ...d.rift }] : [])]
      .filter(g => g.dest === "hub" || quest.unlocked(g.dest));
  }
  // The Monolith is the physical route to the first Dark Continent camp.
  if (quest.unlocked("strand")) graph.coast.push({ boat: true, dest: "strand" });
  const queue = [{ area: stage.id, first: null }], seen = new Set([stage.id]);
  for (let head = 0; head < queue.length; head++) {
    const { area, first } = queue[head];
    for (const exit of graph[area] || []) {
      const choice = first || exit;
      if (exit.dest === destination) return choice;
      if (!seen.has(exit.dest)) { seen.add(exit.dest); queue.push({ area: exit.dest, first: choice }); }
    }
  }
  return null;
}

export class AutoAdventure {
  constructor() { this.navigator = new AdventureNavigator(); this.reset(); }
  reset() { this.target = null; this.status = "off"; this.goal = null; this.recovering = false; this.dialogOwned = false; this.dialogAt = 0; this.lastTalk = 0; this.blockedSince = null; }

  travel(ctx, destination) {
    const exit = routeExit(ctx.stage, destination, ctx.quest, ctx.hub);
    if (!exit) return { status: "routeBlocked" };
    if (!exit.boat) {
      const b = ctx.stage.bounds;
      return { status: "travel", point: { x: Math.max(b.minX + 10, Math.min(b.maxX + 10, exit.x)),
        y: Math.max(b.minY + 20, Math.min(b.maxY + 20, exit.y + 2)) }, radius: 0 };
    }
    const boat = ctx.stage.boatSystem;
    if (!boat) return { status: "routeBlocked" };
    if (!ctx.player.inBoat) return { status: "travel", point: boat.pier, radius: 30, action: "board" };
    if (!ctx.quest.monolith) return { status: "travel", point: boat.monolith, radius: 48, action: "monolith" };
    return { status: "travel", point: boat.seaPortal, radius: 0 };
  }

  choose(ctx) {
    const { player: p, stage, quest: q, npcs, enemies, loot } = ctx;
    if (q.step >= ctx.finalStep && !ctx.guildGoal) return { status: "complete", done: true };
    if (p.hp < p.maxHp * 0.25) this.recovering = true;
    if (this.recovering && p.hp >= p.maxHp * 0.85) this.recovering = false;
    if (this.recovering) {
      const healer = npcs.find(npcs.summonerId);
      if (healer && stage.isInsideSafeZone(healer.x, healer.y))
        return { status: "recover", point: at(healer), radius: 30 };
      const z = stage.safeZone;
      if (z) return { status: "recover", point: { x: z.x + z.w / 2, y: z.y + z.h / 2 }, radius: 20 };
    }
    if (ctx.guildGoal) return ctx.guildGoal.destination ? this.travel(ctx, ctx.guildGoal.destination) : ctx.guildGoal;
    // Boss/Seal Stone loot takes priority over another fight.
    const dropped = loot.items.filter(i => i.quest).sort((a, b) => length(a, p) - length(b, p))[0];
    if (dropped) {
      if (p.bag.slots.length >= BAG_SIZE && !p.bag.has(dropped.inst.id)) return { status: "bagFull" };
      return { status: "collect", point: dropped, radius: 3 };
    }
    if (q.gated()) {
      const side = q.side.current();
      if (side.area !== stage.id) return this.travel(ctx, side.area);
      if (side.t === "scout") return { status: "scout", point: q.side.site(side), radius: 14 };
      return this.hunt(ctx, side);
    }
    const npcId = q.targetNpc(npcs.summonerId, p.heroData.id);
    if (npcId) {
      const area = q.currentPlatform() || "hub";
      if (stage.id !== area) return this.travel(ctx, area);
      const npc = npcs.find(npcId);
      return npc ? { status: "talk", point: at(npc), radius: 24, npc } : { status: "waiting" };
    }
    const destination = q.currentPlatform();
    if (destination && destination !== stage.id) return this.travel(ctx, destination);
    if (destination && q.wantsBoss(destination)) {
      const boss = enemies.find(e => e.boss && e.isAlive);
      return boss ? this.combat(p, boss) : { status: "waiting" };
    }
    return this.hunt(ctx, null); // Level-10 objective: earn EXP through normal fights.
  }

  combat(player, enemy) {
    const reach = Math.min(player.kit.range || 60, ["mage", "archer", "priest"].includes(player.kit.id) ? 160 : 40);
    return { status: "fight", point: at(enemy), radius: reach, enemy };
  }

  hunt(ctx, objective) {
    const p = ctx.player;
    let best = null, bestScore = Infinity;
    for (const e of ctx.enemies) {
      if (!matchesObjective(e, objective)) continue;
      const endpoint = this.navigator.endpoint(at(e), e.kind?.flying ? (p.kit.range || 60) : 24);
      if (!endpoint) continue;
      const score = endpoint.distance + length(e, p) * 0.1;
      if (score < bestScore) { best = e; bestScore = score; }
    }
    if (best) return this.combat(p, best);
    // Spawned enemies appear throughout the map; move toward a legal hunting site rather than idle in camp.
    const sites = ctx.stage.def?.sites || [];
    const point = sites.length ? sites[Math.floor((ctx.now / 12000) % sites.length)]
      : { x: ctx.stage.width * 0.5, y: ctx.stage.height * 0.6 };
    return { status: "search", point, radius: 16 };
  }

  update(ctx, now = Date.now()) {
    this.navigator.build(ctx.stage, ctx.player, now);
    this.goal = this.choose({ ...ctx, now });
    this.status = this.goal.status;
    this.target = this.goal.enemy || null;
    const keys = new Set();
    if (this.goal.point) {
      const dir = this.navigator.direction(ctx.player, this.goal.point, this.goal.radius);
      if (!dir) this.status = "routeBlocked";
      else {
        if (dir[0] < -0.2) keys.add("KeyA"); if (dir[0] > 0.2) keys.add("KeyD");
        if (dir[1] < -0.2) keys.add("KeyW"); if (dir[1] > 0.2) keys.add("KeyS");
      }
      if (this.target && length(at(ctx.player), this.goal.point) <= (ctx.player.kit.range || 60)) {
        keys.add("KeyJ"); keys.add("KeyK"); keys.add("KeyL");
      }
    }
    if (this.status === "routeBlocked") this.blockedSince ??= now;
    else this.blockedSince = null;
    return { ...this.goal, status: this.status, keys, halted: this.blockedSince !== null && now - this.blockedSince >= 10000 };
  }
}
