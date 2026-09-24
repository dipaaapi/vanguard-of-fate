export class UIManager {
  constructor() { }

  // 1. TOP-LEFT PLAYER HUD & PORTRAITS
  drawHUD(ctx, player, enemyCount, canvasWidth) {
    if (!player) return;

    ctx.save();
    const panelX = 8, panelY = 8, panelW = 104, panelH = 30;

    // Background Panel
    ctx.fillStyle = "rgba(10, 14, 20, 0.85)";
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = "#4a5568";
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.strokeStyle = "#fcd168";
    ctx.strokeRect(panelX + 1, panelY + 1, panelW - 2, panelH - 2);

    // Portrait Box
    const portX = panelX + 4, portY = panelY + 4, portSize = 22;
    ctx.fillStyle = "#161b22";
    ctx.fillRect(portX, portY, portSize, portSize);
    ctx.strokeStyle = "#8a9aa8";
    ctx.strokeRect(portX, portY, portSize, portSize);

    this.drawHeroFace(ctx, player.heroData.id, portX + 2, portY + 2);

    // Hero Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "left";
    ctx.fillText(player.heroData.name.toUpperCase(), panelX + 32, panelY + 11);

    // HP Bar
    const barX = panelX + 32, barY = panelY + 14, barW = 64, barH = 6;
    ctx.fillStyle = "#2d1215";
    ctx.fillRect(barX, barY, barW, barH);

    const hpRatio = Math.max(0, player.hp / player.maxHp);
    const currentBarW = Math.round(barW * hpRatio);
    ctx.fillStyle = hpRatio > 0.5 ? "#38b000" : (hpRatio > 0.25 ? "#ffb703" : "#e63946");
    ctx.fillRect(barX, barY, currentBarW, barH);

    if (currentBarW > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(barX, barY, currentBarW, 1);
    }
    ctx.strokeStyle = "#111";
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.ceil(player.hp)}/${player.maxHp}`, barX + barW / 2, barY + 5.5);

    // Skill Ready Status
    const skillReady = player.skillCooldownTimer === 0;
    ctx.fillStyle = skillReady ? "#00f0ff" : "#555";
    ctx.fillRect(panelX + 32, panelY + 23, 4, 4);

    ctx.fillStyle = skillReady ? "#a0aec0" : "#777";
    ctx.font = "6px monospace";
    ctx.textAlign = "left";
    ctx.fillText(skillReady ? "SPACE: READY" : `CD: ${(player.skillCooldownTimer / 60).toFixed(1)}s`, panelX + 39, panelY + 27);

    // Enemy Count Badge
    ctx.fillStyle = "rgba(10, 14, 20, 0.75)";
    ctx.fillRect(canvasWidth - 76, 8, 68, 14);
    ctx.strokeStyle = "#fcd168";
    ctx.strokeRect(canvasWidth - 76, 8, 68, 14);
    ctx.fillStyle = "#e63946";
    ctx.fillRect(canvasWidth - 72, 12, 4, 6);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 7px monospace";
    ctx.fillText(`FOES: ${enemyCount}`, canvasWidth - 64, 18);

    ctx.restore();
  }

  // 2. OVERHEAD COOLDOWNS & AMMO (In-world UI)
  drawInWorldUI(ctx, player) {
    if (!player) return;

    // Overhead Blue Cooldown Bar (Lahat ng Class)
    if (player.skillCooldownTimer > 0) {
      const barW = 20, barH = 2;
      const progress = (player.skillCooldownTimer / player.skillCooldownMax) * barW;
      ctx.fillStyle = "#111";
      ctx.fillRect(player.x + 2, player.y - 5, barW, barH);
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(player.x + 2, player.y - 5, barW - progress, barH);
    }

    // Archer Ammo Dots at Reload Progress Bar
    if (player.heroData.id === "archer") {
      const startDotX = player.x + 3;
      const dotY = player.y - 8;

      if (player.isReloading) {
        const relProgress = ((player.reloadMax - player.reloadTimer) / player.reloadMax) * 20;
        ctx.fillStyle = "#111";
        ctx.fillRect(player.x + 2, dotY, 20, 3);
        ctx.fillStyle = "#ffb703";
        ctx.fillRect(player.x + 2, dotY, relProgress, 3);
        ctx.font = "bold 6px monospace";
        ctx.textAlign = "center";
        ctx.fillText("RELOADING...", player.x + 12, dotY - 3);
      } else {
        for (let d = 0; d < 5; d++) {
          ctx.fillStyle = d < player.arrowCount ? "#52b788" : "#444";
          ctx.fillRect(startDotX + d * 4, dotY, 2, 3);
        }
        if (player.arrowCount === 0) {
          ctx.fillStyle = "#e63946";
          ctx.font = "bold 6px monospace";
          ctx.textAlign = "center";
          ctx.fillText("J: RELOAD", player.x + 12, dotY - 2);
        }
      }
    }
  }

  // Mini Pixel Portraits
  drawHeroFace(ctx, heroId, x, y) {
    if (heroId === "knight") {
      ctx.fillStyle = "#7d8c9e"; ctx.fillRect(x + 2, y + 2, 14, 14);
      ctx.fillStyle = "#14171d"; ctx.fillRect(x + 4, y + 7, 10, 3);
      ctx.fillStyle = "#942c2c"; ctx.fillRect(x + 6, y, 6, 3);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 6, y + 8, 2, 1);
    } else if (heroId === "mage") {
      ctx.fillStyle = "#2c1c4d"; ctx.fillRect(x + 3, y + 1, 12, 6);
      ctx.fillStyle = "#5a3d91"; ctx.fillRect(x + 1, y + 6, 16, 3);
      ctx.fillStyle = "#ffe3b3"; ctx.fillRect(x + 4, y + 9, 10, 7);
      ctx.fillStyle = "#14171d"; ctx.fillRect(x + 6, y + 11, 2, 2);
      ctx.fillStyle = "#14171d"; ctx.fillRect(x + 10, y + 11, 2, 2);
    } else if (heroId === "priest") {
      ctx.fillStyle = "#d9e2ec"; ctx.fillRect(x + 2, y + 2, 14, 6);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(x + 7, y + 3, 4, 4);
      ctx.fillStyle = "#ffe3b3"; ctx.fillRect(x + 4, y + 8, 10, 8);
      ctx.fillStyle = "#14171d"; ctx.fillRect(x + 6, y + 11, 2, 2);
      ctx.fillStyle = "#14171d"; ctx.fillRect(x + 10, y + 11, 2, 2);
    } else if (heroId === "archer") {
      ctx.fillStyle = "#fcd168"; ctx.fillRect(x + 2, y + 2, 14, 6);
      ctx.fillStyle = "#ffe3b3"; ctx.fillRect(x + 4, y + 7, 10, 8);
      ctx.fillStyle = "#ffe3b3"; ctx.fillRect(x, y + 7, 4, 3);
      ctx.fillStyle = "#ffe3b3"; ctx.fillRect(x + 14, y + 7, 4, 3);
      ctx.fillStyle = "#2d5a27"; ctx.fillRect(x + 6, y + 10, 2, 2);
      ctx.fillStyle = "#2d5a27"; ctx.fillRect(x + 10, y + 10, 2, 2);
    } else if (heroId === "fighter") {
      ctx.fillStyle = "#c73e3a"; ctx.fillRect(x + 2, y + 3, 14, 4);
      ctx.fillStyle = "#c73e3a"; ctx.fillRect(x + 14, y + 6, 3, 5);
      ctx.fillStyle = "#e09f67"; ctx.fillRect(x + 3, y + 7, 12, 9);
      ctx.fillStyle = "#14171d"; ctx.fillRect(x + 5, y + 10, 2, 2);
      ctx.fillStyle = "#14171d"; ctx.fillRect(x + 10, y + 10, 2, 2);
    }
  }

  drawGameOver(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = "rgba(18, 5, 8, 0.85)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#e63946";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("YOU HAVE FALLEN", width / 2, height / 2 - 10);
    ctx.fillStyle = "#fcd168";
    ctx.font = "bold 8px monospace";
    ctx.fillText("Press ENTER to Resurrect", width / 2, height / 2 + 10);
    ctx.restore();
  }

  drawPause(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = "rgba(10, 14, 20, 0.75)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#161b22";
    ctx.fillRect(48, 83, 160, 74);
    ctx.strokeStyle = "#fcd168";
    ctx.strokeRect(48, 83, 160, 74);
    ctx.fillStyle = "#fcd168";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", width / 2, 105);
    ctx.fillStyle = "#a0aec0";
    ctx.font = "8px monospace";
    ctx.fillText("ESC / P : Resume Game", width / 2, 125);
    ctx.fillText("M : Return to Title Screen", width / 2, 139);
    ctx.restore();
  }
}