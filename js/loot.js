import { Sound } from "./audio.js";

export class LootManager {
  constructor() {
    this.items = [];
  }

  clear() {
    this.items = [];
  }

  spawnLoot(x, y) {
    this.spawnDrop(x, y);
  }

  dropLoot(x, y) {
    this.spawnDrop(x, y);
  }

  // Random Drop Generator para sa Herb at Monster Shards
  spawnDrop(x, y) {
    const rand = Math.random();
    let dropType = null;
    let color = "#ffffff";

    if (rand < 0.40) {
      dropType = "herb";
      color = "#52b788";
    } else {
      const shardTypes = [
        { type: "shard_damage", color: "#ff3333" }, // Pula: Power Boost
        { type: "shard_atkspd", color: "#ffd166" }, // Dilaw: Rapid Attack
        { type: "shard_speed",  color: "#00f0ff" }, // Asul: High Sprint
        { type: "shard_invis",  color: "#9d4edd" }  // Lila: Ghost Stealth
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
      bobTimer: Math.random() * Math.PI * 2,
      isAttracted: false
    });
  }

  update(player, fx) {
    if (!player || player.hp <= 0) return;

    const pCenterX = player.x + 10;
    const pCenterY = player.y + 10;
    const pickupMagnetRadius = 65; // Magnetic attraction distance
    const collectRadius = 12;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.bobTimer += 0.08;

      const dx = pCenterX - item.x;
      const dy = pCenterY - item.y;
      const dist = Math.hypot(dx, dy);

      // 1. MAGNETIC ATTRACTION (Lulutang at sipsipin papalapit sa Hero)
      if (dist < pickupMagnetRadius) {
        item.isAttracted = true;
        const pullSpeed = Math.min(6.5, 2.5 + (1 - dist / pickupMagnetRadius) * 5.0);
        item.x += (dx / dist) * pullSpeed;
        item.y += (dy / dist) * pullSpeed;
      }

      // 2. LOOT PICKUP & BUFF APPLICATION
      if (dist < collectRadius) {
        if (Sound && Sound.playLootPickup) Sound.playLootPickup();
        this.applyBuff(player, item, fx);
        if (fx && fx.spawnHitSparks) {
          fx.spawnHitSparks(item.x, item.y, item.color, 12);
        }
        this.items.splice(i, 1);
      }
    }
  }

  applyBuff(player, item, fx) {
    const pX = player.x + 10;
    const pY = player.y - 6;

    if (item.type === "herb") {
      player.hp = Math.min(player.maxHp, player.hp + 30);
      player.skillCooldownTimer = 0; // Instant CD Reset
      if (fx && fx.spawnDamagePopup) {
        fx.spawnDamagePopup(pX, pY, "+30 HP & CD RESET!", true, "#52b788");
      }
    } else if (item.type === "shard_damage") {
      player.buffs.damage = 420; // 7 seconds
      if (fx && fx.spawnDamagePopup) {
        fx.spawnDamagePopup(pX, pY, "DAMAGE BOOST!", true, "#ff3333");
      }
    } else if (item.type === "shard_atkspd") {
      player.buffs.atkSpeed = 420;
      if (fx && fx.spawnDamagePopup) {
        fx.spawnDamagePopup(pX, pY, "RAPID ATTACK!", true, "#ffd166");
      }
    } else if (item.type === "shard_speed") {
      player.buffs.moveSpeed = 420;
      if (fx && fx.spawnDamagePopup) {
        fx.spawnDamagePopup(pX, pY, "SPEED UP!", true, "#00f0ff");
      }
    } else if (item.type === "shard_invis") {
      player.buffs.invis = 360; // 6 seconds
      if (fx && fx.spawnDamagePopup) {
        fx.spawnDamagePopup(pX, pY, "GHOST STEALTH!", true, "#9d4edd");
      }
    }
  }

  draw(ctx) {
    this.items.forEach((item) => {
      const hoverY = item.y + Math.sin(item.bobTimer) * 3;

      // Contact Shadow
      ctx.fillStyle = "rgba(10, 14, 20, 0.35)";
      ctx.beginPath();
      ctx.ellipse(item.x, item.y + 6, 4, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ambient Aura
      ctx.fillStyle = item.color;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(item.x, hoverY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Sprite Render
      if (item.type === "herb") {
        ctx.fillStyle = "#2d6a4f";
        ctx.fillRect(item.x - 2, hoverY - 3, 4, 5);
        ctx.fillStyle = "#52b788";
        ctx.fillRect(item.x - 1, hoverY - 4, 3, 5);
        ctx.fillStyle = "#74c69d";
        ctx.fillRect(item.x, hoverY - 2, 1, 2);
      } else {
        ctx.fillStyle = item.color;
        ctx.fillRect(item.x - 1, hoverY - 4, 2, 6);
        ctx.fillRect(item.x - 3, hoverY - 2, 6, 3);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(item.x - 1, hoverY - 1, 2, 2);
      }
    });
  }
}