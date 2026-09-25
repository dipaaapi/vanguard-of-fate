import { Sound } from "./audio.js";
import { MONSTER_LOOT_TABLE } from "./equipment.js";

export class LootManager {
  constructor() {
    this.items = [];
  }

  clear() {
    this.items = [];
  }

  spawnLoot(x, y, enemyLevel = 1) {
    this.spawnDrop(x, y, enemyLevel);
  }

  dropLoot(x, y, enemyLevel = 1) {
    this.spawnDrop(x, y, enemyLevel);
  }

  // Random Drop Generator para sa Herb, Upgrade Stone, Monster Loot at Combat Shards
  spawnDrop(x, y, enemyLevel = 1) {
    const rand = Math.random();
    let dropType = null;
    let color = "#ffffff";
    let lootName = "Loot";

    if (rand < 0.28) {
      dropType = "herb";
      color = "#52b788";
      lootName = "Medicinal Herb";
    } else if (rand < 0.44) {
      dropType = "mat_stone";
      color = "#a855f7";
      lootName = "Upgrade Stone";
    } else if (rand < 0.72) {
      // Monster Material Drops based on enemy level
      const lootTypesByTier = [
        { type: "loot_fang", color: "#facc15" },
        { type: "loot_pelt", color: "#fb923c" },
        { type: "loot_bone", color: "#e2e8f0" },
        { type: "loot_ore", color: "#94a3b8" },
        { type: "loot_venom", color: "#22c55e" },
        { type: "loot_ember", color: "#ef4444" },
        { type: "loot_frost", color: "#38bdf8" },
        { type: "loot_essence", color: "#c084fc" },
        { type: "loot_core", color: "#fef08a" }
      ];
      const maxTier = Math.min(lootTypesByTier.length - 1, Math.floor((enemyLevel - 1) / 10));
      const picked = lootTypesByTier[Math.min(maxTier, Math.floor(Math.random() * (maxTier + 1)))];
      dropType = picked.type;
      color = picked.color;
      const lootTemplate = MONSTER_LOOT_TABLE[dropType];
      lootName = lootTemplate ? lootTemplate.name : "Monster Material";
    } else {
      const shardTypes = [
        { type: "shard_damage", color: "#ff3333" },
        { type: "shard_atkspd", color: "#ffd166" },
        { type: "shard_speed",  color: "#00f0ff" },
        { type: "shard_invis",  color: "#9d4edd" }
      ];
      const picked = shardTypes[Math.floor(Math.random() * shardTypes.length)];
      dropType = picked.type;
      color = picked.color;
    }

    this.items.push({
      id: Math.random(),
      x: x + (Math.random() * 12 - 6),
      y: y + (Math.random() * 12 - 6),
      type: dropType,
      color: color,
      name: lootName,
      bobTimer: Math.random() * Math.PI * 2,
      isAttracted: false
    });
  }

  update(player, fx, questManager = null, stage = null) {
    if (!player || player.hp <= 0) return;

    const pCenterX = player.x + 10;
    const pCenterY = player.y + 10;
    const pickupMagnetRadius = 65;
    const collectRadius = 12;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.bobTimer += 0.08;

      const dx = pCenterX - item.x;
      const dy = pCenterY - item.y;
      const dist = Math.hypot(dx, dy);

      if (dist < pickupMagnetRadius) {
        item.isAttracted = true;
        const pullSpeed = Math.min(6.5, 2.5 + (1 - dist / pickupMagnetRadius) * 5.0);
        item.x += (dx / dist) * pullSpeed;
        item.y += (dy / dist) * pullSpeed;
      }

      if (dist < collectRadius) {
        if (Sound && Sound.playLootPickup) Sound.playLootPickup();
        this.applyBuff(player, item, fx, questManager);
        if (fx && fx.spawnHitSparks) {
          fx.spawnHitSparks(item.x, item.y, item.color, 12);
        }
        this.items.splice(i, 1);
      }
    }
  }

  applyBuff(player, item, fx, questManager = null) {
    const pX = player.x + 10;
    const pY = player.y - 6;

    if (item.type === "herb") {
      player.hp = Math.min(player.maxHp, player.hp + 30);
      player.skill1CooldownTimer = 0;
      if (fx && fx.spawnDamagePopup) {
        fx.spawnDamagePopup(pX, pY, "+30 HP & CD RESET!", true, "#52b788");
      }
      if (questManager) questManager.onLootPickup("herb", 1, player, fx);
    } else if (item.type === "mat_stone") {
      player.upgradeStones = (player.upgradeStones || 0) + 1;
      if (fx && fx.spawnDamagePopup) {
        fx.spawnDamagePopup(pX, pY, "+1 UPGRADE STONE", true, "#a855f7");
      }
      if (questManager) questManager.onLootPickup("mat_stone", 1, player, fx);
    } else if (item.type.startsWith("loot_")) {
      const template = MONSTER_LOOT_TABLE[item.type];
      if (template && player.inventory) {
        player.inventory.push({
          ...template,
          uid: "loot_" + Math.random().toString(36).substring(2, 9),
          plus: 0
        });
        if (fx && fx.spawnDamagePopup) {
          fx.spawnDamagePopup(pX, pY, `+${template.name}`, true, item.color);
        }
      }
      if (questManager) questManager.onLootPickup(item.type, 1, player, fx);
    } else if (item.type === "shard_damage") {
      player.buffs.damage = 420;
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(pX, pY, "DAMAGE BOOST!", true, "#ff3333");
    } else if (item.type === "shard_atkspd") {
      player.buffs.atkSpeed = 420;
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(pX, pY, "RAPID ATTACK!", true, "#ffd166");
    } else if (item.type === "shard_speed") {
      player.buffs.moveSpeed = 420;
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(pX, pY, "SPEED UP!", true, "#00f0ff");
    } else if (item.type === "shard_invis") {
      player.buffs.invis = 360;
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(pX, pY, "GHOST STEALTH!", true, "#9d4edd");
    }
  }

  draw(ctx) {
    this.items.forEach((item) => {
      const hoverY = item.y + Math.sin(item.bobTimer) * 3.5;

      // 1. Soft Dynamic Contact Shadow
      const shadowScale = Math.max(0.6, 1 - Math.sin(item.bobTimer) * 0.15);
      ctx.fillStyle = "rgba(10, 14, 20, 0.38)";
      ctx.beginPath();
      ctx.ellipse(item.x, item.y + 7, 5 * shadowScale, 2 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. High-Radiance Pulsating Ambient Aura
      const auraGrad = ctx.createRadialGradient(item.x, hoverY, 1, item.x, hoverY, 10);
      auraGrad.addColorStop(0, "rgba(255, 255, 255, 0.6)");
      auraGrad.addColorStop(0.4, item.color);
      auraGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(item.x, hoverY, 10, 0, Math.PI * 2);
      ctx.fill();

      // 3. Faceted Crystalline / Herb Sprite
      if (item.type === "herb") {
        // High-Quality Mystic Herb Sprite with Dewdrop Highlight
        ctx.fillStyle = "#1b4332";
        ctx.fillRect(item.x - 3, hoverY - 4, 6, 8);
        ctx.fillStyle = "#2d6a4f";
        ctx.fillRect(item.x - 2, hoverY - 5, 4, 7);
        ctx.fillStyle = "#52b788";
        ctx.fillRect(item.x - 1, hoverY - 4, 3, 5);
        ctx.fillStyle = "#74c69d";
        ctx.fillRect(item.x, hoverY - 3, 2, 3);
        // Specular Dewdrop Sparkle
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(item.x, hoverY - 2, 1, 1);
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(item.x - 1, hoverY + 1, 1, 1);
      } else {
        // Multifaceted Diamond Gemstone Shard
        // Dark Base Outline
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.moveTo(item.x, hoverY - 6);
        ctx.lineTo(item.x + 5, hoverY - 1);
        ctx.lineTo(item.x, hoverY + 6);
        ctx.lineTo(item.x - 5, hoverY - 1);
        ctx.closePath();
        ctx.fill();

        // Primary Facet Color
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.moveTo(item.x, hoverY - 5);
        ctx.lineTo(item.x + 4, hoverY - 1);
        ctx.lineTo(item.x, hoverY + 5);
        ctx.lineTo(item.x - 4, hoverY - 1);
        ctx.closePath();
        ctx.fill();

        // Top Light Highlight Facet
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.beginPath();
        ctx.moveTo(item.x, hoverY - 5);
        ctx.lineTo(item.x + 4, hoverY - 1);
        ctx.lineTo(item.x, hoverY);
        ctx.lineTo(item.x - 4, hoverY - 1);
        ctx.closePath();
        ctx.fill();

        // Specular Star Glint
        const glint = Math.sin(item.bobTimer * 2) > 0.6;
        if (glint) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(item.x - 1, hoverY - 3, 2, 2);
          ctx.fillRect(item.x - 2, hoverY - 2.5, 4, 1);
        }
      }
    });
  }
}