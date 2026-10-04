import { Sound } from "./audio.js";
import { describe, rollDrop } from "./items/itemdb.js";
import { iconCanvas } from "./items/icons.js";

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

// Finds the nearest safe spot the player can stand on
function findNearestWalkableSpot(startX, startY, stage) {
  if (!isObstacle(startX, startY, stage)) {
    return { x: startX, y: startY };
  }

  // Radial spiral search outward
  for (let r = 8; r <= 220; r += 8) {
    const angles = [
      Math.PI / 2,          // Down (South)
      Math.PI / 2 + 0.45,
      Math.PI / 2 - 0.45,
      Math.PI / 2 + 0.9,
      Math.PI / 2 - 0.9,
      0,                    // Right (East)
      Math.PI,              // Left (West)
      -Math.PI / 2,         // Up (North)
      Math.PI / 4,
      (3 * Math.PI) / 4,
      -Math.PI / 4,
      -(3 * Math.PI) / 4
    ];

    for (const ang of angles) {
      const tx = startX + Math.cos(ang) * r;
      const ty = startY + Math.sin(ang) * r;
      if (!isObstacle(tx, ty, stage)) {
        return { x: tx, y: ty };
      }
    }
  }
  return { x: startX, y: startY + 40 };
}

export class LootManager {
  constructor() {
    this.items = [];
    this.onQuestItem = null;   // (id) => void — a quest item was picked up
    this.onCollect = null;     // ({ gold } | { id, name, qty, color }) => void — for the bottom tray log
    this.fullWarn = 0;
  }

  clear() {
    this.items = [];
  }

  // info: { tier, level, cls, boss, drop }
  spawnLoot(x, y, info = {}, stage = null) {
    const level = info.level || 1;
    const scatter = () => {
      const sx = x + (Math.random() * 16 - 8);
      const sy = y + (Math.random() * 12 - 6);
      if (stage && isObstacle(sx, sy, stage)) {
        const safe = findNearestWalkableSpot(sx, sy, stage);
        return { x: sx, y: sy, targetSlideX: safe.x, targetSlideY: safe.y };
      }
      return { x: sx, y: sy };
    };

    // gold
    const GOLD_MULT = { normal: 1, champion: 2, elite: 4, mvp: 12 };
    const gold = Math.round((2 + level * 0.8) * (0.7 + Math.random() * 0.6) * (GOLD_MULT[info.tier] || (info.boss ? 12 : 1)));
    this.items.push({ ...scatter(), type: "gold", amount: gold, color: "#ffd166", bobTimer: Math.random() * 6 });

    // item
    const grade = info.grade ?? info.tierGrade ?? 0;
    rollDrop(grade, info.cls || "novice", { key: info.key, tier: info.tier, boss: info.boss, diff: info.diff, extra: info.extra })
      .forEach((inst) => this.drop(scatter(), inst));
    if (info.drop) this.drop({ x, y }, { id: info.drop, qty: 1 }, true, stage);
  }

  // inst = { id, qty, ... } (see js/items/itemdb.js)
  drop(pos, inst, quest = false, stage = null) {
    const it = describe(inst);
    if (!it) return;
    let finalPos = pos;
    if (stage && isObstacle(pos.x, pos.y, stage)) {
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
            delete item.targetSlideX;
            delete item.targetSlideY;
          }
        } else if (isObstacle(item.x, item.y, stage)) {
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
        const pullSpeed = Math.min(6.5, 2.5 + (1 - dist / pickupMagnetRadius) * 5.0);
        item.x += (dx / dist) * pullSpeed;
        item.y += (dy / dist) * pullSpeed;
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

      ctx.fillStyle = "rgba(10, 14, 20, 0.35)";
      ctx.beginPath();
      ctx.ellipse(item.x, item.y + 6, 4, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

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
