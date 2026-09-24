export class UIManager {
  constructor() {
    this.portraits = {
      knight: ["#14171d", "#7d8c9e", "#b5c4d4", "#942c2c"],
      mage:   ["#14171d", "#5a3d91", "#38b6ff", "#ffe3b3"],
      priest: ["#14171d", "#d9e2ec", "#ffd166", "#ffe3b3"],
      archer: ["#14171d", "#c98a4c", "#2d5a27", "#ffe3b3"],
      fighter:["#14171d", "#c73e3a", "#f0f2f5", "#e09f67"]
    };
  }

  draw(ctx, player, enemyCount, canvasWidth) {
    if (!player) return;

    ctx.save();

    // 1. TOP-LEFT HUD PANEL CONTAINER (Classic 32-bit RPG Plate)
    const panelX = 8;
    const panelY = 8;
    const panelW = 104;
    const panelH = 30;

    // Panel Shadow & Background
    ctx.fillStyle = "rgba(10, 14, 20, 0.85)";
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = "#4a5568";
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Golden Inset Border
    ctx.strokeStyle = "#fcd168";
    ctx.strokeRect(panelX + 1, panelY + 1, panelW - 2, panelH - 2);

    // 2. HERO FACE PORTRAIT BOX (18x18 Frame)
    const portX = panelX + 4;
    const portY = panelY + 4;
    const portSize = 22;

    ctx.fillStyle = "#161b22";
    ctx.fillRect(portX, portY, portSize, portSize);
    ctx.strokeStyle = "#8a9aa8";
    ctx.strokeRect(portX, portY, portSize, portSize);

    // Render Mini Character Face mula sa napiling class
    this.drawHeroFace(ctx, player.heroData.id, portX + 2, portY + 2);

    // 3. HERO NAME & LEVEL TAG
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "left";
    ctx.fillText(player.heroData.name.toUpperCase(), panelX + 32, panelY + 11);

    // 4. HP BAR CONTAINER
    const barX = panelX + 32;
    const barY = panelY + 14;
    const barW = 64;
    const barH = 6;

    // HP Background
    ctx.fillStyle = "#2d1215";
    ctx.fillRect(barX, barY, barW, barH);

    // Dynamic HP Fill (Green to Red transition)
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    const currentBarW = Math.round(barW * hpRatio);

    ctx.fillStyle = hpRatio > 0.5 ? "#38b000" : (hpRatio > 0.25 ? "#ffb703" : "#e63946");
    ctx.fillRect(barX, barY, currentBarW, barH);

    // HP Top Gloss Line (32-bit visual sheen)
    if (currentBarW > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(barX, barY, currentBarW, 1);
    }

    // Border ng HP Bar
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    // HP Digits / Numbers
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.ceil(player.hp)}/${player.maxHp}`, barX + barW / 2, barY + 5.5);

    // 5. SKILL COOLDOWN ICON / STATUS
    const skillReady = player.skillCooldownTimer === 0;
    ctx.fillStyle = skillReady ? "#00f0ff" : "#555";
    ctx.fillRect(panelX + 32, panelY + 23, 4, 4);

    ctx.fillStyle = skillReady ? "#a0aec0" : "#777";
    ctx.font = "6px monospace";
    ctx.textAlign = "left";
    ctx.fillText(skillReady ? "SPACE: READY" : `CD: ${(player.skillCooldownTimer / 60).toFixed(1)}s`, panelX + 39, panelY + 27);

    // 6. TOP-RIGHT RADAR / ENEMY COUNTER
    ctx.fillStyle = "rgba(10, 14, 20, 0.75)";
    ctx.fillRect(canvasWidth - 76, 8, 68, 14);
    ctx.strokeStyle = "#fcd168";
    ctx.strokeRect(canvasWidth - 76, 8, 68, 14);

    ctx.fillStyle = "#e63946";
    ctx.fillRect(canvasWidth - 72, 12, 4, 6);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`FOES: ${enemyCount}`, canvasWidth - 64, 18);

    ctx.restore();
  }

  // Mini Pixel Portraits para sa bawat hero type
  drawHeroFace(ctx, heroId, x, y) {
    if (heroId === "knight") {
      ctx.fillStyle = "#7d8c9e"; ctx.fillRect(x + 2, y + 2, 14, 14); // Helm
      ctx.fillStyle = "#14171d"; ctx.fillRect(x + 4, y + 7, 10, 3);  // Visor Slit
      ctx.fillStyle = "#942c2c"; ctx.fillRect(x + 6, y, 6, 3);       // Plume
      ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 6, y + 8, 2, 1);   // Eye glint
    } else if (heroId === "mage") {
      ctx.fillStyle = "#2c1c4d"; ctx.fillRect(x + 3, y + 1, 12, 6);  // Hat Cone
      ctx.fillStyle = "#5a3d91"; ctx.fillRect(x + 1, y + 6, 16, 3);  // Hat Rim
      ctx.fillStyle = "#ffe3b3"; ctx.fillRect(x + 4, y + 9, 10, 7);  // Face
      ctx.fillStyle = "#14171d"; ctx.fillRect(x + 6, y + 11, 2, 2);  // Eyes
      ctx.fillStyle = "#14171d"; ctx.fillRect(x + 10, y + 11, 2, 2);
    } else if (heroId === "priest") {
      ctx.fillStyle = "#d9e2ec"; ctx.fillRect(x + 2, y + 2, 14, 6);  // Mitre
      ctx.fillStyle = "#ffd166"; ctx.fillRect(x + 7, y + 3, 4, 4);   // Gold Cross
      ctx.fillStyle = "#ffe3b3"; ctx.fillRect(x + 4, y + 8, 10, 8);  // Face
      ctx.fillStyle = "#14171d"; ctx.fillRect(x + 6, y + 11, 2, 2);
      ctx.fillStyle = "#14171d"; ctx.fillRect(x + 10, y + 11, 2, 2);
    } else if (heroId === "archer") {
      ctx.fillStyle = "#fcd168"; ctx.fillRect(x + 2, y + 2, 14, 6);  // Blonde Hair
      ctx.fillStyle = "#ffe3b3"; ctx.fillRect(x + 4, y + 7, 10, 8);  // Face
      ctx.fillStyle = "#ffe3b3"; ctx.fillRect(x, y + 7, 4, 3);       // Elf Ears Left
      ctx.fillStyle = "#ffe3b3"; ctx.fillRect(x + 14, y + 7, 4, 3);  // Elf Ears Right
      ctx.fillStyle = "#2d5a27"; ctx.fillRect(x + 6, y + 10, 2, 2);  // Green Eyes
      ctx.fillStyle = "#2d5a27"; ctx.fillRect(x + 10, y + 10, 2, 2);
    } else if (heroId === "fighter") {
      ctx.fillStyle = "#c73e3a"; ctx.fillRect(x + 2, y + 3, 14, 4);  // Red Bandana
      ctx.fillStyle = "#c73e3a"; ctx.fillRect(x + 14, y + 6, 3, 5);  // Knot tail
      ctx.fillStyle = "#e09f67"; ctx.fillRect(x + 3, y + 7, 12, 9);  // Face
      ctx.fillStyle = "#14171d"; ctx.fillRect(x + 5, y + 10, 2, 2);  // Eyes
      ctx.fillStyle = "#14171d"; ctx.fillRect(x + 10, y + 10, 2, 2);
    }
  }

  drawGameOver(ctx, canvasWidth, canvasHeight) {
    ctx.save();
    ctx.fillStyle = "rgba(18, 5, 8, 0.85)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = "#e63946";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("YOU HAVE FALLEN", canvasWidth / 2, canvasHeight / 2 - 10);

    ctx.fillStyle = "#fcd168";
    ctx.font = "bold 8px monospace";
    ctx.fillText("Press ENTER to Resurrect", canvasWidth / 2, canvasHeight / 2 + 10);
    ctx.restore();
  }
}