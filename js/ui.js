import { getLang } from "./i18n.js";
import { getItem } from "./items/itemdb.js";
import { STATUS, STATUS_KEYS } from "./status.js";

// Paninda ni Edgar the Apothecary (pumapasok sa bag)
const SHOP = ["salve", "panacea", "tonic", "elixir"];

export class UIManager {
  constructor() {
    this.buttons = {
      pause: { x: 406, y: 7, w: 14, h: 14 }
    };
  }

  drawHUD(ctx, player, enemyManager, lootManager, stage, screenWidth, isPaused, timeOfDay, weatherType, isInBarracks) {
    if (!player) return;

    // Ang profile ng player, estado ng field at mga button (Quest/Pause) ay nasa
    // bottom bar na (js/hudbar.js). Ang minimap na lang ang nasa loob ng screen.

    // ========================================================
    // 3. RIGHT PANEL: LIVE MINI-MAP (UPPER RIGHT CORNER)
    // ========================================================
    const mapW = 58;
    const mapH = 44;
    const mapX = screenWidth - mapW - 6;
    const mapY = 7;

    ctx.fillStyle = "rgba(8, 12, 20, 0.92)";
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    if (stage) {
      const scaleX = mapW / stage.width;
      const scaleY = mapH / stage.height;

      // Safe Zone Outline (Barracks + audience dais ng Citadel)
      ctx.fillStyle = "rgba(255, 209, 102, 0.22)";
      (stage.safeZones || (stage.safeZone ? [stage.safeZone] : [])).forEach((z) => {
        ctx.fillRect(mapX + z.x * scaleX, mapY + z.y * scaleY, z.w * scaleX, z.h * scaleY);
      });

      // Enemies (Red Dots)
      if (enemyManager) {
        ctx.fillStyle = "#ef4444";
        enemyManager.enemies.forEach((e) => {
          if (e.isAlive) ctx.fillRect(mapX + e.x * scaleX, mapY + e.y * scaleY, 1.5, 1.5);
        });
      }

      // Loots (Green Dots)
      if (lootManager && lootManager.items) {
        ctx.fillStyle = "#22c55e";
        lootManager.items.forEach((item) => {
          ctx.fillRect(mapX + item.x * scaleX, mapY + item.y * scaleY, 1.2, 1.2);
        });
      }

      // Player Blip (Cyan Point)
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(mapX + player.x * scaleX - 0.5, mapY + player.y * scaleY - 0.5, 2.5, 2.5);
    }
  }

  drawInWorldUI(ctx, player) {
    if (!player) return;

    // Overhead Cooldown Bar
    if (player.skillCooldownTimer > 0 && player.heroData.cooldown) {
      const barW = 16;
      const progress = (player.skillCooldownTimer / player.heroData.cooldown) * barW;
      ctx.fillStyle = "#111";
      ctx.fillRect(player.x + 2, player.y - 7, barW, 2);
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(player.x + 2, player.y - 7, barW - progress, 2);
    }

    // Stamina sa ilalim ng paa (lumalabas lang kapag hindi puno); "PAGOD" kapag naubos
    if (player.stamina < player.maxStamina) {
      const w = 16;
      ctx.fillStyle = "rgba(17, 17, 17, 0.8)";
      ctx.fillRect(player.x + 2, player.y + 25, w, 1.5);
      ctx.fillStyle = player.exhausted ? "#ef4444" : "#facc15";
      ctx.fillRect(player.x + 2, player.y + 25, (player.stamina / player.maxStamina) * w, 1.5);
      if (player.exhausted) {
        ctx.font = "bold 4px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ef4444";
        ctx.fillText(getLang() === "fil" ? "PAGOD" : "EXHAUSTED", player.x + 10, player.y + 31);
      }
    }

    // Kulay na tuldok ng bawat aktibong sumpa sa itaas ng ulo
    const active = STATUS_KEYS.filter((k) => player.debuffs[k] > 0);
    active.forEach((k, i) => {
      ctx.fillStyle = "#030611";
      ctx.fillRect(player.x + 10 - active.length * 2.5 + i * 5 - 0.5, player.y - 17.5, 4, 4);
      ctx.fillStyle = STATUS[k].color;
      ctx.fillRect(player.x + 10 - active.length * 2.5 + i * 5, player.y - 17, 3, 3);
    });
    if (player.paralyzed) {
      ctx.font = "bold 5px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#facc15";
      ctx.fillText("⚡ STUN", player.x + 10, player.y - 20);
    }

    // Archer Arrow Dots
    if (player.heroData.id === "archer" && player.arrowCount !== undefined) {
      const dotY = player.y - 11;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < player.arrowCount ? "#52b788" : "#444";
        ctx.fillRect(player.x + 3 + i * 3, dotY, 2, 2.5);
      }
    }
  }

  drawPause(ctx, screenWidth, screenHeight) {
    ctx.fillStyle = "rgba(3, 7, 18, 0.78)";
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    const boxW = 180;
    const boxH = 92;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("⏸️ EXPEDITION PAUSED", screenWidth / 2, boxY + 22);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 7px monospace";
    ctx.fillText("[ ESC ]   RESUME EXPEDITION", screenWidth / 2, boxY + 44);

    ctx.fillStyle = "#ef4444";
    ctx.fillText("[ H ]   RETURN TO MAIN MENU", screenWidth / 2, boxY + 62);

    ctx.fillStyle = "#64748b";
    ctx.font = "6px monospace";
    ctx.fillText("PROGRESS AUTO-SAVED IN AETHELGARD", screenWidth / 2, boxY + 80);
  }

  drawShopModal(ctx, player, screenWidth, screenHeight) {
    const boxW = 210;
    const boxH = 120;
    const boxX = Math.round(screenWidth / 2 - boxW / 2);
    const boxY = Math.round(screenHeight / 2 - boxH / 2);

    ctx.fillStyle = "rgba(10, 14, 23, 0.95)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("— APOTHECARY & CURING SHOP —", screenWidth / 2, boxY + 16);

    ctx.font = "6.5px monospace";
    SHOP.forEach((id, k) => {
      const it = getItem(id);
      const have = player.bag ? player.bag.count(id) : 0;
      ctx.fillStyle = player.gold >= it.price ? "#ffffff" : "#64748b";
      ctx.fillText(`[${k + 1}] ${it.name.toUpperCase()} (${it.price}G)  ×${have}`, screenWidth / 2, boxY + 34 + k * 16);
    });

    ctx.fillStyle = "#64748b";
    ctx.fillText(getLang() === "fil" ? "1-4 BUMILI (PAPASOK SA BAG) • ESC LUMABAS" : "1-4 BUY (GOES TO YOUR BAG) • ESC EXIT", screenWidth / 2, boxY + 112);
  }

  buyShopItem(index, player, fx) {
    if (!player) return;
    const id = SHOP[Number(index) - 1];
    const it = id && getItem(id);
    if (!it) return;
    const pop = (text, color) => fx && fx.spawnDamagePopup && fx.spawnDamagePopup(player.x + 10, player.y - 6, text, false, color);
    if (player.gold < it.price) { pop(getLang() === "fil" ? "KULANG ANG GINTO!" : "NOT ENOUGH GOLD!", "#ef4444"); return; }
    if (!player.bag.add(id, 1)) { pop("BAG FULL!", "#ef4444"); return; }
    player.gold -= it.price;
    pop(`+ ${it.name}`, "#4ade80");
  }

  drawGameOver(ctx, screenWidth, screenHeight) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.fillText("YOU HAVE FALLEN", screenWidth / 2, screenHeight / 2 - 8);

    ctx.fillStyle = "#ffd166";
    ctx.font = "7.5px monospace";
    ctx.fillText("PRESS ENTER TO RESTART", screenWidth / 2, screenHeight / 2 + 12);
  }
}