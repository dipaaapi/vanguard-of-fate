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

// Own field, separate from the enemy flow field; rebuilt on tile changes at most ten times per second.
// It uses the same foot clearance and castle obstacles as the real collision system.
export class AdventureNavigator {
  constructor() { this.stage = null; this.start = -1; this.builtAt = -Infinity; }

  blocked(fx, fy) {
    if (footBlocked(this.stage, fx, fy) || footBlocked(this.stage, fx - 1, fy - 1) ||
        footBlocked(this.stage, fx + 1, fy + 1)) return true;
    const boxes = this.boxes || [];
    return boxes.some(b => fx + 7 > b.x && fx - 7 < b.x + b.w && fy + 5 > b.y && fy - 9 < b.y + b.h);
  }

  clear(feet, point) {
    const n = Math.max(1, Math.ceil(length(feet, point) / 2));
    for (let k = 1; k <= n; k++)
      if (this.blocked(feet.x + (point.x - feet.x) * k / n, feet.y + (point.y - feet.y) * k / n)) return false;
    return true;
  }

  build(stage, player, now) {
    if (this.stage !== stage || this.revision !== stage.navRevision)
      this.boxes = [...(stage.barracks?.solids || []), ...(stage.campSolids || []), ...(stage.guildSolids || [])];
    const tm = stage.tilemap;
    if (!tm?.solid) { this.stage = stage; this.dist = null; return; }
    const sx = Math.floor((player.x + 10) / TILE), sy = Math.floor((player.y + 20) / TILE);
    const start = sy * tm.cols + sx;
    const heading = player.inBoat ? stage.boatSystem.heading : null;
    if (this.stage === stage && this.revision === stage.navRevision && this.boat === Boolean(player.inBoat) && this.heading === heading && (start === this.start || now - this.builtAt < 100)) return;
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
    this.dist = this.dist?.length === tm.cols * tm.rows ? this.dist : new Int32Array(tm.cols * tm.rows);
    this.prev = this.prev?.length === tm.cols * tm.rows ? this.prev : new Int32Array(tm.cols * tm.rows);
    this.dist.fill(-1); this.prev.fill(-1);
    if (sx < 0 || sy < 0 || sx >= tm.cols || sy >= tm.rows) return;
    const queue = this.queue?.length === this.dist.length ? this.queue : (this.queue = new Int32Array(this.dist.length));
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
    // Small pickup/melee radii can fall between all tile centres.
    const searchRadius = radius ? Math.max(radius, TILE * 0.75) : 0;
    const r = Math.ceil(searchRadius / TILE);
    let best = null;
    for (let y = Math.max(0, ty - r); y <= Math.min(rows - 1, ty + r); y++)
      for (let x = Math.max(0, tx - r); x <= Math.min(cols - 1, tx + r); x++) {
        const index = y * cols + x, d = this.dist[index];
        if (d < 0 || this.block[index]) continue;
        const gap = Math.hypot(x * TILE + TILE / 2 - point.x, y * TILE + TILE / 2 - point.y);
        if (radius && gap > searchRadius) continue;
        const score = d * TILE + gap * 0.1;
        if (!best || score < best.score) best = { index, distance: d * TILE, score };
      }
    return best;
  }

  boatClear(feet, point) {
    const n = Math.max(1, Math.ceil(length(feet, point) / 2));
    for (let k = 1; k <= n; k++)
      if (!this.stage.boatSystem.hullWet(feet.x + (point.x - feet.x) * k / n, feet.y + (point.y - feet.y) * k / n + 1, this.heading)) return false;
    return true;
  }

  direction(player, point, radius = 0) {
    const feet = at(player);
    if (length(feet, point) <= radius) return [0, 0];
    // A companion can spawn with its footprint overlapping sanctuary art.
    // Walk out by the shortest clear escape instead of leaving it stuck forever.
    if (!player.inBoat && this.blocked(feet.x, feet.y)) {
      for (let r = 2; r <= 48; r += 2) for (let k = 0; k < 16; k++) {
        const angle = k * Math.PI / 8;
        const escape = { x: feet.x + Math.cos(angle) * r, y: feet.y + Math.sin(angle) * r };
        if (this.blocked(escape.x, escape.y)) continue;
        // Once outside the initial overlap, don't enter a second obstacle.
        let outside = false, clear = true;
        for (let step = 1; step <= r; step++) {
          const blocked = this.blocked(feet.x + Math.cos(angle) * step, feet.y + Math.sin(angle) * step);
          if (outside && blocked) { clear = false; break; }
          if (!blocked) outside = true;
        }
        if (clear) return [Math.cos(angle), Math.sin(angle)];
      }
      return null;
    }
    if (!this.dist || (!player.inBoat && this.clear(feet, point))) {
      const d = length(feet, point) || 1;
      return [(point.x - feet.x) / d, (point.y - feet.y) / d];
    }
    const end = this.endpoint(point, radius);
    if (!end) return null;
    if (this.routeBuiltAt !== this.builtAt || this.routeEnd !== end.index) {
      this.route = [];
      let i = end.index;
      while (i !== this.start && i >= 0) { this.route.push(i); i = this.prev[i]; }
      this.routeBuiltAt = this.builtAt; this.routeEnd = end.index;
    }
    const route = this.route;
    // Look ahead along the route: never steer back to a waypoint already passed.
    // Checking full foot clearance keeps smoothing from cutting obstacle corners.
    let next = null;
    for (const index of route) {
      const point = { x: index % this.stage.tilemap.cols * TILE + TILE / 2,
        y: Math.floor(index / this.stage.tilemap.cols) * TILE + TILE / 2 };
      if (length(feet, point) > 64) continue;
      if (player.inBoat ? this.boatClear(feet, point) : this.clear(feet, point)) { next = point; break; }
    }
    if (!next && this.start >= 0) {
      const center = { x: this.start % this.stage.tilemap.cols * TILE + TILE / 2,
        y: Math.floor(this.start / this.stage.tilemap.cols) * TILE + TILE / 2 };
      if (player.inBoat ? this.boatClear(feet, center) : this.clear(feet, center)) next = center;
    }
    if (!next) return null;
    const d = length(feet, next) || 1;
    return [(next.x - feet.x) / d, (next.y - feet.y) / d];
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
  reset() { this.target = null; this.status = "off"; this.goal = null; this.recovering = false; this.dialogOwned = false; this.dialogAt = 0; this.lastTalk = 0; this.blockedSince = null; this.patrol = null; this.patrolVisited = []; }

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
    if (ctx.guildGoal) {
      if(ctx.guildGoal.destination)return this.travel(ctx,ctx.guildGoal.destination);
      if(ctx.guildGoal.status==="search")return this.search(ctx,ctx.guildGoal.objective);
      return ctx.guildGoal;
    }
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
    // Act XI needs all four seals before the boat can open the Monolith route.
    // Recover a missed seal in its cleared arena instead of repeatedly trying activation.
    const campaignDestination = q.currentPlatform();
    if (PLATFORMS[campaignDestination]?.dark && !q.monolith) {
      const missing = Object.values(PLATFORMS).find(d => d.seal && !p.bag.has(d.seal) && q.cleared?.(d.id));
      if (missing && missing.id !== stage.id) return this.travel(ctx,missing.id);
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
      return boss ? this.combat(p, boss, stage) : { status: "waiting" };
    }
    return this.hunt(ctx, null); // Level-10 objective: earn EXP through normal fights.
  }

  combat(player, enemy, stage) {
    const reach = stage?.isInsideSafeZone?.(player.x,player.y) ? 0 : Math.min(player.kit.range || 60, ["mage", "archer", "priest"].includes(player.kit.id) ? 160 : 40);
    return { status: "fight", point: at(enemy), radius: reach, enemy };
  }

  hunt(ctx, objective) {
    const p = ctx.player;
    // Keep a reachable opponent until it dies or leaves the objective.
    if (this.target && ctx.enemies.includes(this.target) && !ctx.stage.isInsideSafeZone?.(this.target.x,this.target.y) && matchesObjective(this.target, objective) &&
        this.navigator.endpoint(at(this.target), this.target.kind?.flying ? (p.kit.range || 60) : 24))
      return this.combat(p, this.target, ctx.stage);
    let best = null, bestScore = Infinity;
    for (const e of ctx.enemies) {
      if (!matchesObjective(e, objective) || ctx.stage.isInsideSafeZone?.(e.x,e.y)) continue;
      const endpoint = this.navigator.endpoint(at(e), e.kind?.flying ? (p.kit.range || 60) : 24);
      if (!endpoint) continue;
      const score = endpoint.distance + length(e, p) * 0.1;
      if (score < bestScore) { best = e; bestScore = score; }
    }
    if (best) return this.combat(p, best, ctx.stage);
    return this.search(ctx, objective);
  }

  search(ctx, objective) {
    const { stage, player } = ctx, feet = at(player);
    const key = JSON.stringify(objective || null);
    const legal = point => !stage.isInsideSafeZone?.(point.x, point.y) &&
      !stage.isInsideSafeZone?.(point.x - 10, point.y - 20) &&
      !this.navigator.blocked(point.x, point.y) && this.navigator.endpoint(point);
    // Keep the destination stable while walking; rotate only after arrival.
    if (this.patrol?.stage === stage && this.patrol.key === key &&
        length(feet, this.patrol.point) > 18 && legal(this.patrol.point))
      return { status: "search", point: this.patrol.point, radius: 16 };
    const previous = this.patrol?.stage === stage ? this.patrol.point : null;
    if (this.patrol?.stage !== stage || this.patrol?.key !== key) this.patrolVisited = [];
    if (previous) this.patrolVisited = [...this.patrolVisited, previous].slice(-12);
    const sites = [...(stage.def?.sites || [])];
    // The hub has no named hunting sites. Sample the actual navigable field,
    // excluding every sanctuary and obstacle rather than aiming at map centre.
    for (let y = 56; y < stage.height - 32; y += 96)
      for (let x = 56; x < stage.width - 32; x += 96) sites.push({ x, y });
    let point = null, score = Infinity;
    for (const site of sites) {
      if (length(feet, site) < 96 || (previous && length(previous, site) < 80)) continue;
      const endpoint = legal(site);
      if (!endpoint) continue;
      const visited = this.patrolVisited.some(p => length(p, site) < 80);
      const candidateScore = endpoint.distance + (visited ? stage.width * stage.height : 0);
      if (candidateScore < score) { point = site; score = candidateScore; }
    }
    if (!point) return { status: "routeBlocked" };
    this.patrol = { stage, key, point };
    return { status: "search", point, radius: 16 };
  }

  update(ctx, now = Date.now()) {
    this.navigator.build(ctx.stage, ctx.player, now);
    this.goal = this.choose({ ...ctx, now });
    // Guild fights use the same sanctuary-aware approach as campaign fights.
    if(this.goal.status === "fight" && this.goal.enemy)this.goal=this.combat(ctx.player,this.goal.enemy,ctx.stage);
    this.status = this.goal.status;
    this.target = this.goal.enemy || null;
    const keys = new Set();
    let movement = { x: 0, y: 0, distance: 0 };
    if (this.goal.point) {
      const dir = this.navigator.direction(ctx.player, this.goal.point, this.goal.radius);
      if (!dir) this.status = "routeBlocked";
      else {
        movement = { x: dir[0], y: dir[1], distance: Math.max(0, length(at(ctx.player), this.goal.point) - this.goal.radius) };
        if (dir[0] < -0.2) keys.add("KeyA"); if (dir[0] > 0.2) keys.add("KeyD");
        if (dir[1] < -0.2) keys.add("KeyW"); if (dir[1] > 0.2) keys.add("KeyS");
      }
      if (this.target && length(at(ctx.player), this.goal.point) <= (ctx.player.kit.range || 60)) {
        keys.add("KeyJ");
        // Summon skills use their actual companions; rolling into foes disrupts novice steering.
        if (!["novice", "archer", "priest"].includes(ctx.player.kit.id)) keys.add("KeyK");
        keys.add("KeyL");
      }
    }
    if (this.status === "routeBlocked") this.blockedSince ??= now;
    else this.blockedSince = null;
    return { ...this.goal, status: this.status, keys, movement, halted: this.blockedSince !== null && now - this.blockedSince >= 10000 };
  }
}
