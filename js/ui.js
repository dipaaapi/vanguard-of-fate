export class UIManager {
  constructor() {
    this.buttons = {
      pause: { x: 406, y: 7, w: 14, h: 14 }
    };
  }

  drawHUD(ctx, player, enemyManager, lootManager, stage, screenWidth, isPaused, timeOfDay, weatherType, isInBarracks) {
    if (!player) return;

    // ========================================================
    // 1. LEFT CARD: PLAYER PROFILE & STATUS (116px width)
    // ========================================================
    const cX = 8;
    const cY = 7;
    const cW = 116;
    const cH = 32;

    ctx.fillStyle = "rgba(10, 14, 23, 0.9)";
    ctx.fillRect(cX, cY, cW, cH);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.strokeRect(cX, cY, cW, cH);

    // Hero Portrait
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(cX + 3, cY + 3, 26, 26);
    ctx.strokeStyle = "#ffd166";
    ctx.strokeRect(cX + 3, cY + 3, 26, 26);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(player.heroData.name[0], cX + 16, cY + 20);

    // Name & Level
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 7px monospace";
    ctx.fillText(player.heroData.name.toUpperCase(), cX + 34, cY + 10);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 6.5px monospace";
    ctx.fillText(`LV.${player.level}`, cX + 86, cY + 10);

    // HP Bar
    const hpBarW = 74;
    const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp));
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(cX + 34, cY + 14, hpBarW, 5);

    ctx.fillStyle = hpRatio > 0.5 ? "#22c55e" : (hpRatio > 0.25 ? "#f59e0b" : "#ef4444");
    ctx.fillRect(cX + 34, cY + 14, Math.round(hpRatio * hpBarW), 5);

    // EXP Bar
    const expRatio = Math.max(0, Math.min(1, player.exp / player.expNext));
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(cX + 34, cY + 21, Math.round(expRatio * hpBarW), 2);

    ctx.fillStyle = "#ffd166";
    ctx.font = "6.5px monospace";
    ctx.fillText(`🪙 ${player.gold}G`, cX + 34, cY + 29);

    // ========================================================
    // 2. CENTER PANEL: FIELD STATS & WEATHER BADGE (110px width)
    // ========================================================
    const fX = Math.round(screenWidth / 2 - 55);
    const fY = 7;
    const fW = 110;
    const fH = 22;

    ctx.fillStyle = "rgba(10, 14, 23, 0.9)";
    ctx.fillRect(fX, fY, fW, fH);
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(fX, fY, fW, fH);

    const foeCount = enemyManager ? enemyManager.enemies.filter((e) => e.isAlive).length : 0;
    const lootCount = lootManager && lootManager.items ? lootManager.items.length : 0;

    ctx.font = "6.5px monospace";
    ctx.fillStyle = "#f87171";
    ctx.fillText(`FOES:${foeCount}`, fX + 6, fY + 10);

    ctx.fillStyle = "#4ade80";
    ctx.fillText(`LOOT:${lootCount}`, fX + 58, fY + 10);

    // In-game weather & zone badge
    const wIcon = weatherType === "STORM" ? "⛈️" : (weatherType === "RAIN" ? "🌧️" : (weatherType === "FOG" ? "🌫️" : "☀️"));
    ctx.fillStyle = weatherType === "CLEAR" ? "#38bdf8" : "#94a3b8";
    ctx.fillText(`${wIcon} ${weatherType}`, fX + 6, fY + 18);

    ctx.fillStyle = isInBarracks ? "#ffd166" : "#64748b";
    ctx.fillText(isInBarracks ? "🛡️ SANCTUARY" : "⚔️ OUTLANDS", fX + 58, fY + 18);

    // ========================================================
    // 3. RIGHT PANEL: LIVE MINI-MAP (UPPER RIGHT CORNER)
    // ========================================================
    const mapW = 58;
    const mapH = 44;
    const mapX = screenWidth - mapW - 22;
    const mapY = 7;

    ctx.fillStyle = "rgba(8, 12, 20, 0.92)";
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    if (stage) {
      const scaleX = mapW / stage.width;
      const scaleY = mapH / stage.height;

      // Safe Zone Outline
      if (stage.safeZone) {
        ctx.fillStyle = "rgba(255, 209, 102, 0.22)";
        ctx.fillRect(
          mapX + stage.safeZone.x * scaleX,
          mapY + stage.safeZone.y * scaleY,
          stage.safeZone.w * scaleX,
          stage.safeZone.h * scaleY
        );
      }

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

    // Pause Button
    const pb = this.buttons.pause;
    ctx.fillStyle = isPaused ? "#ffd166" : "#1e293b";
    ctx.fillRect(pb.x, pb.y, pb.w, pb.h);
    ctx.strokeStyle = "#ffd166";
    ctx.strokeRect(pb.x, pb.y, pb.w, pb.h);

    ctx.fillStyle = isPaused ? "#111111" : "#ffd166";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText(isPaused ? "▶" : "||", pb.x + pb.w / 2, pb.y + 10);
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
    ctx.fillText("[ ESC / P ]   RESUME EXPEDITION", screenWidth / 2, boxY + 44);

    ctx.fillStyle = "#ef4444";
    ctx.fillText("[ M ]   RETURN TO MAIN MENU", screenWidth / 2, boxY + 62);

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

    ctx.fillStyle = "#ffffff";
    ctx.font = "6.5px monospace";
    ctx.fillText("[1] CURE ALL ABNORMAL STATUS (15G)", screenWidth / 2, boxY + 40);
    ctx.fillText("[2] PURCHASE HEALING SALVE (10G)", screenWidth / 2, boxY + 58);
    ctx.fillText("[3] ELIXIR OF RAPID FOCUS (25G)", screenWidth / 2, boxY + 76);
    ctx.fillText("[4] CLOSE APOTHECARY", screenWidth / 2, boxY + 94);

    ctx.fillStyle = "#64748b";
    ctx.fillText("PRESS 1-4 TO BUY • ESC TO EXIT", screenWidth / 2, boxY + 112);
  }

  buyShopItem(index, player, fx) {
    if (!player) return;

    if (index === "1") {
      const hasDebuff = player.hasAnyDebuff ? player.hasAnyDebuff() : false;
      if (!hasDebuff) {
        if (fx && fx.spawnDamagePopup) {
          fx.spawnDamagePopup(player.x + 10, player.y - 6, "NO ABNORMAL STATUS!", false, "#ef4444");
        }
        return;
      }
      if (player.gold >= 15) {
        player.gold -= 15;
        if (player.cureAllDebuffs) player.cureAllDebuffs();
        if (fx && fx.spawnDamagePopup) {
          fx.spawnDamagePopup(player.x + 10, player.y - 6, "DEBUFFS CURED!", true, "#4ade80");
        }
      }
    } else if (index === "2") {
      if (player.gold >= 10) {
        player.gold -= 10;
        player.hp = Math.min(player.maxHp, player.hp + 40);
        if (fx && fx.spawnDamagePopup) {
          fx.spawnDamagePopup(player.x + 10, player.y - 6, "+40 HP", true, "#22c55e");
        }
      }
    } else if (index === "3") {
      if (player.gold >= 25) {
        player.gold -= 25;
        player.skillCooldownTimer = 0;
        if (fx && fx.spawnDamagePopup) {
          fx.spawnDamagePopup(player.x + 10, player.y - 6, "CD RESET!", true, "#00f0ff");
        }
      }
    }
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