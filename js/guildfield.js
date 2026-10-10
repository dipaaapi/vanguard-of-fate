import { areaDef } from "./world/areas.js";
import { findNearestWalkableSpot } from "./loot.js";
import { AdventureNavigator } from "./autoadventure.js";
import { GUILD_RANKS, guildText as T } from "./guilddata.js";
import { guildImage } from "./world/guildhall.js";
import { MONSTERS } from "./bestiary.js";

// Field objectives belong to the guild ledger, never to the campaign quest state.
export class GuildField {
  constructor(book) { this.book = book; this.navigator = new AdventureNavigator(); }
  clear(manager) {
    for (const e of manager.enemies) if (e.guildContract) e.isAlive = false;
    this.nodes = []; this.wagon = null; this.key = null;
  }
  prepare(p, stage, manager) {
    const c = this.book.objective(p), key = c && `${c.id}:${stage.id}`;
    const active = this.book.state(p).active;
    if (key === this.key && active === this.active) return c;
    this.clear(manager); this.key = key; this.active = active;
    if (!c || c.area !== stage.id) return c;
    const sites = areaDef(stage.id)?.sites || [];
    const start = sites[0] || { x: p.x + 80, y: p.y + 80 };
    this.route = [start, sites[1] || { x: start.x + 180, y: start.y }, sites[2] || { x: start.x + 180, y: start.y + 180 }]
      .map(s => findNearestWalkableSpot(s.x, s.y, stage));
    if (c.t === "gather" && ["herb", "stone"].includes(c.source)) {
      this.nodes = Array.from({ length: c.n }, (_, i) => ({ ...findNearestWalkableSpot(start.x + (i % 4 - 1) * 28, start.y + Math.floor(i / 4) * 28, stage), used: false }));
    }
    if (c.t === "escort") {
      const a = this.book.state(p).active;
      const maxHp = 300 + GUILD_RANKS.indexOf(c.rank) * 120;
      const s = a.escort ||= { hp: maxHp, defence: 100, leg: 0, wave: 0, fighting: false, failed: false, x: this.route[0].x - 10, y: this.route[0].y - 20 };
      if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) { s.x = this.route[0].x - 10; s.y = this.route[0].y - 20; }
      const spot = findNearestWalkableSpot(s.x + 10, s.y + 20, stage); s.x = spot.x - 10; s.y = spot.y - 20;
      this.wagon = s; s.maxHp = maxHp; s.guildCaravan = true;
      // Combat uses the saved wagon object so damage and save state stay in sync.
      if (s.fighting && !s.failed) this.spawnWave(p, stage, manager, c);
    }
    if (c.t === "mvp" && this.book.state(p).active.have < c.n) {
      const key = manager.kinds.find(k => !MONSTERS[k]?.flying && !MONSTERS[k]?.elite) || manager.kinds[0];
      const e = manager.spawn(key, p.level, this.route[0].x, this.route[0].y, null, "elite");
      if (e) { e.guildMvp = true; e.guildContract = c.id; e.maxHp *= 3; e.hp = e.maxHp; e.damage *= 1.5; e.provoked = true; }
    }
    return c;
  }
  spawnWave(p, stage, manager, c) {
    const s = this.wagon;
    for (let i = 0; i < 2 + Math.floor(GUILD_RANKS.indexOf(c.rank) / 3); i++) {
      const spot = findNearestWalkableSpot(s.x + 80 + i * 20, s.y + 40, stage);
      const key = manager.kinds.find(k => !MONSTERS[k]?.flying && !MONSTERS[k]?.elite) || manager.kinds[0];
      const e = manager.spawn(key, p.level, spot.x - 10, spot.y - 20, null, "normal");
      if (e) { e.guildContract = c.id; e.guildEscortTarget = s; e.provoked = true; }
    }
    s.fighting = true;
  }
  onKill(p, stage, enemy, loot) {
    const c = this.book.objective(p);
    if (c?.t === "gather" && c.source === "enemy" && c.area === stage.id && enemy.minionOf !== "summon") {
      loot.drop({ x: enemy.x + 10, y: enemy.y + 20 }, { id: c.item, qty: 1 }, false, stage);
      const drop = loot.items.at(-1); if (drop) drop.guildSource = "enemy";
    }
  }
  supply(p, stage, npc) {
    const c = this.book.objective(p), a = this.book.state(p).active;
    if (c?.t !== "gather" || c.source !== "npc" || npc.id !== c.npc || stage.id !== "hub" || a.have >= c.n) return false;
    // The named guild scout dispatches region-specific supplies only in the required region's unlocked contract.
    const qty = c.n - a.have;
    if (!p.bag.add({ id: c.item, qty })) return "full";
    this.book.collect(p, c.area, c.item, "npc", qty); return "supplied";
  }
  goal(p, stage, manager, npcs, loot) {
    const c = this.prepare(p, stage, manager), a = this.book.state(p).active;
    if (!c) return null;
    if (a.have >= c.n || c.t === "gather" && c.source === "npc") {
      if (stage.id !== "hub") return { destination: "hub" };
      const npc = npcs.find(a.have >= c.n ? "guildClerk" : c.npc);
      return npc ? { status: "talk", point: { x: npc.x, y: npc.y }, radius: 24, npc } : { status: "waiting" };
    }
    if (stage.id !== c.area) return { destination: c.area };
    const drop = loot.items.find(i => i.guildSource === c.source && i.id === c.item);
    if (drop) return { status: p.bag.slots.length >= 40 && !p.bag.has(c.item) ? "bagFull" : "collect", point: drop, radius: 3 };
    const targets = manager.enemies.filter(e => e.isAlive && e.minionOf !== "summon" &&
      (c.t === "escort" ? e.guildContract === c.id : c.t === "mvp" ? e.boss || e.guildMvp : c.t === "champion" ? !e.boss && !e.guildMvp && (e.elite || e.champion) : !e.boss && !e.guildMvp && (c.t !== "cull" || !e.elite && !e.champion)));
    targets.sort((x, y) => Math.hypot(x.x - p.x, x.y - p.y) - Math.hypot(y.x - p.x, y.y - p.y));
    if (c.t === "gather" && ["herb", "stone"].includes(c.source)) {
      if (p.bag.slots.length >= 40 && !p.bag.has(c.item)) return { status: "bagFull" };
      const node = this.nodes.find(n => !n.used); return { status: "collect", point: node, radius: 3 };
    }
    if (targets[0]) return { status: "fight", point: { x: targets[0].x + 10, y: targets[0].y + 20 }, radius: Math.min(p.kit.range || 40, 40), enemy: targets[0] };
    if (this.wagon) return this.wagon.failed ? { status: "routeBlocked" } : { status: "scout", point: { x: this.wagon.x + 10, y: this.wagon.y + 20 }, radius: 30 };
    return { status: "scout", point: this.route[0], radius: 24 };
  }
  update(p, stage, manager) {
    const c = this.prepare(p, stage, manager), a = this.book.state(p).active;
    if (c?.t === "gather") {
      a.have = Math.min(a.have, p.bag.count(c.item));
      if (a.have < c.n && this.nodes.length && this.nodes.every(n => n.used)) this.nodes.forEach(n => { n.used = false; });
    }
    if (!c || stage.id !== c.area || a.have >= c.n) return;
    if (c.t === "gather") for (const node of this.nodes) {
      if (!node.used && Math.hypot(p.x + 10 - node.x, p.y + 20 - node.y) < 20 && p.bag.add(c.item)) {
        node.used = true; this.book.collect(p, stage.id, c.item, c.source);
      }
    }
    const s = this.wagon;
    if (!s || c.t !== "escort" || s.failed) return;
    if (s.hp <= 0) { s.failed = true; s.fighting = false; return; }
    if (s.fighting) {
      if (manager.enemies.some(e => e.isAlive && e.guildContract === c.id)) return;
      s.fighting = false; s.wave++;
    }
    // Waiting for the guide prevents an abandoned caravan from completing by itself.
    if (Math.hypot(p.x - s.x, p.y - s.y) > 110) return;
    if (s.wave < c.waves && s.leg >= Math.floor(s.wave * 2 / c.waves)) { this.spawnWave(p, stage, manager, c); return; }
    const next = this.route[Math.min(2, s.leg + 1)];
    if (Math.hypot(s.x + 10 - next.x, s.y + 20 - next.y) < 12) {
      s.leg++;
      if (s.leg >= 2 && s.wave >= c.waves) { a.have = c.n; this.book.onReady?.(); }
      return;
    }
    this.navigator.build(stage, s, performance.now());
    const dir = this.navigator.direction(s, next, 12);
    if (dir) { s.x += dir[0] * .65; s.y += dir[1] * .65; }
  }
  draw(ctx, p, stage) {
    const c = this.book.objective(p), a = this.book.state(p).active;
    if (!c || stage.id !== c.area || a.have >= c.n) return;
    ctx.save(); ctx.font = "10px sans-serif"; ctx.textAlign = "center";
    if (c.t === "gather") for (const n of this.nodes || []) if (!n.used) {
      const img = guildImage(c.source === "herb" ? "herb" : "stone");
      if (img.complete && img.naturalWidth) ctx.drawImage(img, n.x - 12, n.y - 18);
      ctx.fillStyle = "#ffe0a0"; ctx.fillText(T(c.source), n.x, n.y - 22);
    }
    if (c.t === "mvp") { ctx.fillStyle = "#ffb0d8"; ctx.fillText(T("mvp"), this.route[0].x, this.route[0].y - 30); }
    const s = this.wagon;
    if (s && c.t === "escort") {
      const img = guildImage("caravan"); if (img.complete && img.naturalWidth) ctx.drawImage(img, s.x - 14, s.y - 12);
      ctx.fillStyle = "#ffe0a0"; ctx.fillText(T(s.failed ? "escortFailed" : s.fighting ? "defend" : "guide"), s.x + 10, s.y - 34);
      for (const [i, value, color, label] of [[0, s.hp / s.maxHp, "#e56b6f", "HP"], [1, s.defence / 100, "#6fb8df", T("defence")]]) {
        ctx.fillStyle = "#182936"; ctx.fillRect(s.x - 22, s.y - 27 + i * 10, 64, 8);
        ctx.fillStyle = color; ctx.fillRect(s.x - 21, s.y - 26 + i * 10, 62 * Math.max(0, value), 6);
        ctx.fillStyle = "#fff"; ctx.fillText(label, s.x + 10, s.y - 20 + i * 10);
      }
      const end = this.route[2]; ctx.fillStyle = "#8ce0af"; ctx.fillText(T("destination"), end.x, end.y - 15);
    }
    ctx.restore();
  }
}
