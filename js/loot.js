import { Sound } from "./audio.js";
import { describe, rollDrop } from "./items/itemdb.js";
import { iconCanvas } from "./items/icons.js";
import { TILE } from "./world/tileset.js";
import { GFX } from "./settings.js";

// ==================== SAMSAM (LOOT) ====================
// Every slain monster drops gold and sometimes an item (potion, shard, material,
// equipment). Items go into the bag; when the bag is full they stay on the ground.
// A boss drops its Act's quest item (e.g. Blighted Heartstone).

// Whether a position is on an obstacle, a Citadel wall, a tree, or an unreachable spot
function isObstacle(x, y, stage) {
  if (!stage) return false;

  // 1. Map bounds
  if (stage.bounds) {
    if (x < stage.bounds.minX || x > stage.bounds.maxX || y < stage.bounds.minY || y > stage.bounds.maxY) {
      return true;
    }
  }

  // 2. The Citadel castle's walls, towers and keep
  if (stage.castle && Array.isArray(stage.castle.solidColliders)) {
    for (const box of stage.castle.solidColliders) {
      if (
        x >= box.x - 6 &&
        x <= box.x + box.w + 6 &&
        y >= box.y - 6 &&
        y <= box.y + box.h + 6
      ) {
        return true;
      }
    }
  }

  // 3. Tilemap solids (trees, rocks, cliffs), liquids (lava, deep sea, void) and unreachable zones
  if (stage.tilemap) {
    if (stage.tilemap.isSolidAt && stage.tilemap.isSolidAt(x, y)) return true;
    if (stage.tilemap.isLiquidAt && stage.tilemap.isLiquidAt(x, y)) return true;
    if (stage.tilemap.isReachable && !stage.tilemap.isReachable(x, y)) return true;
  }

  return false;
}

// A spot is walkable when it and a small margin around it are clear, so an item never ends up
// half inside a wall, a tree or the shoreline where the hero can't reach it
const MARGIN = 5;
function clearAround(x, y, stage) {
  return !isObstacle(x, y, stage) &&
    !isObstacle(x - MARGIN, y, stage) && !isObstacle(x + MARGIN, y, stage) &&
    !isObstacle(x, y - MARGIN, stage) && !isObstacle(x, y + MARGIN, stage);
}

// Nearest walkable spot to (x, y): a breadth-first search over the tile grid outward from the drop
// point (through walls, water and cliffs) that stops at the first ring holding a clear, reachable tile
// and takes the closest one. Every blocked drop (monster loot, a dropped item, a full-bag bounce,
// a boss's quest item) lands where the hero can walk to it.
export function findNearestWalkableSpot(startX, startY, stage) {
  if (!stage || clearAround(startX, startY, stage)) return { x: startX, y: startY };
  const tm = stage.tilemap;
  if (tm && tm.cols && tm.rows) {
    const cols = tm.cols, rows = tm.rows;
    const sx = Math.max(0, Math.min(cols - 1, Math.floor(startX / TILE)));
    const sy = Math.max(0, Math.min(rows - 1, Math.floor(startY / TILE)));
    const seen = new Uint8Array(cols * rows);
    let ring = [[sx, sy]];
    seen[sy * cols + sx] = 1;
    while (ring.length) {
      let best = null, bestD = Infinity;
      const next = [];
      for (const [tx, ty] of ring) {
        const cx = tx * TILE + TILE / 2, cy = ty * TILE + TILE / 2;
        if (clearAround(cx, cy, stage)) {
          const d = (cx - startX) ** 2 + (cy - startY) ** 2;
          if (d < bestD) { bestD = d; best = { x: cx, y: cy }; }
        }
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = tx + dx, ny = ty + dy;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || seen[ny * cols + nx]) continue;
            seen[ny * cols + nx] = 1;
            next.push([nx, ny]);
          }
        }
      }
      if (best) return best;
      ring = next;
    }
  }
  // No tile grid (or nothing clear on it): the nearest safe zone's centre is always walkable
  const z = stage.safeZone || (stage.safeZones && stage.safeZones[0]);
  if (z) return { x: z.x + z.w / 2, y: z.y + z.h / 2 };
  return { x: startX, y: startY };
}

export class LootManager {
  constructor() {
    this.items = [];
    this.onQuestItem = null;   // (id) => void — a quest item was picked up
    this.onCollect = null;     // ({ gold } | { id, name, qty, color }) => void — for the bottom tray log
    this.fullWarn = 0;
    this.stage = null;         // current place (set by update), used when a caller passes none
  }

  clear() {
    this.items = [];
  }

  // info: { tier, level, cls, boss, drop }
  spawnLoot(x, y, info = {}, stage = null) {
    stage = stage || this.stage;
    const level = info.level || 1;
    const scatter = () => {
      const sx = x + (Math.random() * 16 - 8);
      const sy = y + (Math.random() * 12 - 6);
      if (stage && !clearAround(sx, sy, stage)) {
        const safe = findNearestWalkableSpot(sx, sy, stage);
        return { x: sx, y: sy, targetSlideX: safe.x, targetSlideY: safe.y };
      }
      return { x: sx, y: sy };
    };

    // gold
    const GOLD_MULT = { normal: 1, champion: 2, elite: 4, mvp: 12 };
    // economy pass: was 2 + level × 0.8 — late Acts could not pay for their own potions (balance-sim --economy)
    const gold = Math.round((3 + level * 1.1) * (0.7 + Math.random() * 0.6) * (GOLD_MULT[info.tier] || (info.boss ? 12 : 1)));
    this.items.push({ ...scatter(), type: "gold", amount: gold, color: "#ffd166", bobTimer: Math.random() * 6 });

    // item
    const grade = info.grade ?? info.tierGrade ?? 0;
    rollDrop(grade, info.cls || "novice", { key: info.key, tier: info.tier, boss: info.boss, diff: info.diff, extra: info.extra, level, element: info.element, race: info.race })
      .forEach((inst) => this.drop(scatter(), inst));
    if (info.drop) this.drop({ x, y }, { id: info.drop, qty: 1 }, true, stage);
  }

  // inst = { id, qty, ... } (see js/items/itemdb.js)
  drop(pos, inst, quest = false, stage = null) {
    stage = stage || this.stage;
    const it = describe(inst);
    if (!it) return;
    let finalPos = pos;
    if (stage && !clearAround(pos.x, pos.y, stage)) {
      const safe = findNearestWalkableSpot(pos.x, pos.y, stage);
      finalPos = { ...pos, targetSlideX: safe.x, targetSlideY: safe.y };
    }
    this.items.push({ ...finalPos, type: "item", id: inst.id, inst: { qty: 1, ...inst }, color: it.color, quest, bobTimer: Math.random() * 6 });
  }

  // Old entry point (e.g. from another system)
  dropLoot(x, y, stage = null) {
    this.spawnLoot(x, y, {}, stage);
  }

  update(player, fx, stage = null) {
    if (stage) this.stage = stage;
    stage = this.stage;
    if (!player || player.hp <= 0) return;
    if (this.fullWarn > 0) this.fullWarn--;

    const pCenterX = player.x + 10;
    const pCenterY = player.y + 10;
    const pickupMagnetRadius = 65;
    const collectRadius = 12;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.bobTimer += 0.08;

      // ==========================================================
      // AUTONOMOUS OBSTACLE EVASION (Slide out of walls/obstacles)
      // ==========================================================
      if (stage) {
        if (item.targetSlideX !== undefined && item.targetSlideY !== undefined) {
          const tdx = item.targetSlideX - item.x;
          const tdy = item.targetSlideY - item.y;
          const tdist = Math.hypot(tdx, tdy);
          if (tdist > 1.2) {
            const slideSpeed = Math.max(1.6, tdist * 0.12);
            item.x += (tdx / tdist) * slideSpeed;
            item.y += (tdy / tdist) * slideSpeed;
          } else {
            item.x = item.targetSlideX;
            item.y = item.targetSlideY;
            item.settledAt = `${item.x}|${item.y}`;     // searched once from here; don't search again in place
            delete item.targetSlideX;
            delete item.targetSlideY;
          }
        } else if (item.settledAt !== `${item.x}|${item.y}` && isObstacle(item.x, item.y, stage)) {
          const safe = findNearestWalkableSpot(item.x, item.y, stage);
          item.targetSlideX = safe.x;
          item.targetSlideY = safe.y;
        }
      }
      if (item.blocked > 0) { item.blocked--; continue; }

      const dx = pCenterX - item.x;
      const dy = pCenterY - item.y;
      const dist = Math.hypot(dx, dy);

      if (dist < pickupMagnetRadius) {
        // Pulled toward the hero, but never through a tree, a rock, water or a wall: it slides
        // along the obstacle, or waits on its side until the hero walks around
        const pullSpeed = Math.min(6.5, 2.5 + (1 - dist / pickupMagnetRadius) * 5.0);
        const nx = item.x + (dx / dist) * pullSpeed, ny = item.y + (dy / dist) * pullSpeed;
        if (dist < collectRadius + pullSpeed || !isObstacle(nx, ny, stage)) { item.x = nx; item.y = ny; }
        else if (!isObstacle(nx, item.y, stage)) item.x = nx;
        else if (!isObstacle(item.x, ny, stage)) item.y = ny;
      }

      if (dist < collectRadius) {
        if (!this.collect(player, item, fx)) {
          // bag full: leave it on the ground for now
          item.blocked = 90;
          item.x -= (dx / (dist || 1)) * 14;
          item.y -= (dy / (dist || 1)) * 14;
          continue;
        }
        if (Sound) { if (item.type === "gold") { if (Sound.playCoin) Sound.playCoin(); } else if (Sound.playLootPickup) Sound.playLootPickup(); }
        if (fx && fx.spawnHitSparks) fx.spawnHitSparks(item.x, item.y, item.color, item.quest ? 24 : 10);
        this.items.splice(i, 1);
      }
    }
  }

  collect(player, item, fx) {
    const pX = player.x + 10, pY = player.y - 6;
    if (item.type === "gold") {
      player.gold += item.amount;
      if (this.onCollect) this.onCollect({ gold: item.amount });
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(pX, pY, `+${item.amount}G`, false, "#ffd166");
      return true;
    }
    if (!player.bag.add(item.inst)) {
      if (this.fullWarn <= 0 && fx && fx.spawnDamagePopup) fx.spawnDamagePopup(pX, pY, "BAG FULL!", false, "#ef4444");
      this.fullWarn = 120;
      return false;
    }
    const it = describe(item.inst);
    const qty = item.inst.qty || 1;
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(pX, pY, `${it.name}${qty > 1 ? ` x${qty}` : ""}`, item.quest || it.rarity === "unique" || it.type === "card", it.color);
    if (this.onCollect) this.onCollect({ id: it.base || item.id, name: it.name, qty, color: it.color });
    if (item.quest && this.onQuestItem) this.onQuestItem(item.id);
    return true;
  }

  draw(ctx) {
    this.items.forEach((item) => {
      const hoverY = item.y + Math.sin(item.bobTimer) * 3;

      if (GFX.shadows) { ctx.fillStyle = "rgba(10, 14, 20, 0.35)"; ctx.beginPath(); ctx.ellipse(item.x, item.y + 6, 4, 1.5, 0, 0, Math.PI * 2); ctx.fill(); }

      ctx.fillStyle = item.color;
      ctx.globalAlpha = item.quest ? 0.35 + Math.sin(item.bobTimer * 2) * 0.15 : 0.22;
      ctx.beginPath();
      ctx.arc(item.x, hoverY, item.quest ? 11 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      if (item.type === "gold") {
        ctx.fillStyle = "#a8782a";
        ctx.fillRect(item.x - 2, hoverY - 2, 5, 5);
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(item.x - 2, hoverY - 3, 4, 4);
        ctx.fillStyle = "#fff4b0";
        ctx.fillRect(item.x - 1, hoverY - 2, 1, 1);
      } else {
        // Item pixel icon (quest items are bigger)
        const icon = iconCanvas(describe(item.inst));
        const sz = item.quest ? 14 : 10;
        if (icon) ctx.drawImage(icon, Math.round(item.x - sz / 2), Math.round(hoverY - sz / 2), sz, sz);
      }
    });
  }
}
