import { Sound } from "./audio.js";

export class TitleScene {
  constructor(onStartGame, onContinueGame, onExportSave, onImportSave, config) {
    this.onStartGame = onStartGame;
    this.onContinueGame = onContinueGame;
    this.onExportSave = onExportSave;
    this.onImportSave = onImportSave;
    this.config = config;

    this.menuIndex = 0;
    this.animTick = 0;
    this.hasSaveFile = Boolean(localStorage.getItem("vanguard_savegame"));

    this.inSettings = false;
    this.settingsIndex = 0;

    this.updateMenuItems();

    this.settingsOptions = [
      { id: "music",   label: "BGM MUSIC", key: "music" },
      { id: "sfx",     label: "COMBAT SFX", key: "sfx" },
      { id: "blood",   label: "BLOOD SPLATTER", key: "blood" },
      { id: "weather", label: "ATMOSPHERE RAIN", key: "weather" },
      { id: "back",    label: "RETURN TO TITLE" }
    ];

    this.stars = [];
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.random() * 426,
        y: Math.random() * 140,
        size: Math.random() < 0.25 ? 2 : 1,
        twinkleSpeed: 0.03 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  updateMenuItems() {
    this.hasSaveFile = Boolean(localStorage.getItem("vanguard_savegame"));
    this.menuItems = [
      { id: "START",    label: "NEW EXPEDITION", enabled: true },
      { id: "CONTINUE", label: "CONTINUE EXPEDITION", enabled: this.hasSaveFile },
      { id: "EXPORT",   label: "EXPORT SAVE (.JSON)", enabled: this.hasSaveFile },
      { id: "IMPORT",   label: "IMPORT SAVE (.JSON)", enabled: true },
      { id: "SETTINGS", label: "EXPEDITION CONFIG", enabled: true }
    ];
  }

  refreshSaveStatus() {
    this.updateMenuItems();
  }

  handleInput(e) {
    if (this.inSettings) {
      if (e.code === "ArrowUp" || e.code === "KeyW") {
        this.settingsIndex = (this.settingsIndex - 1 + this.settingsOptions.length) % this.settingsOptions.length;
        if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      }
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        this.settingsIndex = (this.settingsIndex + 1) % this.settingsOptions.length;
        if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      }
      if (e.code === "Enter" || e.code === "Space" || e.code === "KeyJ") {
        const cur = this.settingsOptions[this.settingsIndex];
        if (cur.id === "back") {
          this.inSettings = false;
          if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
        } else {
          this.config[cur.key] = !this.config[cur.key];
          if (Sound && Sound.playSelectMove) Sound.playSelectMove();
          if (cur.key === "music") {
            if (this.config.music) {
              if (Sound && Sound.startTitleBGM) Sound.startTitleBGM();
            } else {
              if (Sound && Sound.stopTitleBGM) Sound.stopTitleBGM();
            }
          }
        }
      }
      return;
    }

    if (e.code === "ArrowUp" || e.code === "KeyW") {
      this.menuIndex = (this.menuIndex - 1 + this.menuItems.length) % this.menuItems.length;
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
    }
    if (e.code === "ArrowDown" || e.code === "KeyS") {
      this.menuIndex = (this.menuIndex + 1) % this.menuItems.length;
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
    }
    if (e.code === "Enter" || e.code === "Space" || e.code === "KeyJ") {
      const selected = this.menuItems[this.menuIndex];
      if (!selected.enabled) {
        if (Sound && Sound.playSelectMove) Sound.playSelectMove();
        return;
      }

      if (selected.id === "START") {
        if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
        this.onStartGame();
      } else if (selected.id === "CONTINUE") {
        if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
        this.onContinueGame();
      } else if (selected.id === "EXPORT") {
        if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
        this.onExportSave();
      } else if (selected.id === "IMPORT") {
        if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
        this.onImportSave();
      } else if (selected.id === "SETTINGS") {
        this.inSettings = true;
        this.settingsIndex = 0;
        if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
      }
    }
  }

  draw(ctx, width, height) {
    this.animTick++;

    // Celestial Night Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, "#030611");
    skyGrad.addColorStop(0.5, "#0b152d");
    skyGrad.addColorStop(0.85, "#182038");
    skyGrad.addColorStop(1, "#070c18");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars
    this.stars.forEach((star) => {
      const alpha = 0.3 + (Math.sin(this.animTick * star.twinkleSpeed + star.phase) + 1) * 0.35;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Moon
    const moonX = width - 75;
    const moonY = 38;
    ctx.fillStyle = "rgba(255, 209, 102, 0.12)";
    ctx.beginPath();
    ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(moonX, moonY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0b152d";
    ctx.beginPath();
    ctx.arc(moonX - 5, moonY - 3, 11, 0, Math.PI * 2);
    ctx.fill();

    // Mountains Silhouette
    ctx.fillStyle = "#0c1322";
    ctx.beginPath();
    ctx.moveTo(0, height - 25);
    ctx.lineTo(50, height - 70);
    ctx.lineTo(110, height - 50);
    ctx.lineTo(190, height - 90);
    ctx.lineTo(280, height - 55);
    ctx.lineTo(360, height - 85);
    ctx.lineTo(width, height - 35);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();

    // Floating Vanguard Title Logo
    const logoY = 38 + Math.sin(this.animTick / 22) * 2;

    ctx.fillStyle = "#000000";
    ctx.font = "900 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("VANGUARD OF FATE", width / 2 + 1, logoY + 1);

    ctx.fillStyle = "#ffd166";
    ctx.fillText("VANGUARD OF FATE", width / 2, logoY);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 6.5px monospace";
    ctx.fillText("— ISEKAI REBIRTH : CHRONICLES OF AETHELGARD —", width / 2, logoY + 10);

    // Panels
    if (this.inSettings) {
      this.drawSettings(ctx, width, height);
    } else {
      this.drawMainMenu(ctx, width, height);
    }

    ctx.fillStyle = "#64748b";
    ctx.font = "6px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SUMMONED FROM EARTH • FIVE SOULS BOUND BY PROPHECY", width / 2, height - 6);
  }

  drawMainMenu(ctx, width, height) {
    const boxW = 196;
    const boxH = 112;
    const boxX = Math.round(width / 2 - boxW / 2);
    const boxY = 62;

    ctx.fillStyle = "rgba(7, 12, 22, 0.9)";
    ctx.fillRect(boxX, boxY, boxW, boxH);

    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Corner rivets
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(boxX, boxY, 3, 3);
    ctx.fillRect(boxX + boxW - 3, boxY, 3, 3);
    ctx.fillRect(boxX, boxY + boxH - 3, 3, 3);
    ctx.fillRect(boxX + boxW - 3, boxY + boxH - 3, 3, 3);

    this.menuItems.forEach((item, idx) => {
      const isSelected = idx === this.menuIndex;
      const iy = boxY + 18 + idx * 17;

      if (isSelected) {
        ctx.fillStyle = "rgba(255, 209, 102, 0.15)";
        ctx.fillRect(boxX + 6, iy - 9, boxW - 12, 13);

        const blink = Math.floor(this.animTick / 12) % 2 === 0;
        if (blink) {
          ctx.fillStyle = "#ffd166";
          ctx.font = "bold 8px monospace";
          ctx.textAlign = "right";
          ctx.fillText("▶", boxX + 18, iy + 1);
          ctx.textAlign = "left";
          ctx.fillText("◀", boxX + boxW - 18, iy + 1);
        }
      }

      ctx.textAlign = "center";
      ctx.font = isSelected ? "bold 7.5px monospace" : "7px monospace";
      ctx.fillStyle = !item.enabled ? "#475569" : (isSelected ? "#ffffff" : "#94a3b8");
      ctx.fillText(item.label, width / 2, iy);
    });

    ctx.fillStyle = "#64748b";
    ctx.font = "6px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PRESS [W / S] NAVIGATE • [ENTER / SPACE] CONFIRM", width / 2, boxY + boxH - 5);
  }

  drawSettings(ctx, width, height) {
    const boxW = 210;
    const boxH = 114;
    const boxX = Math.round(width / 2 - boxW / 2);
    const boxY = 62;

    ctx.fillStyle = "rgba(7, 12, 22, 0.94)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("— EXPEDITION CONFIGURATION —", width / 2, boxY + 15);

    this.settingsOptions.forEach((opt, idx) => {
      const isSelected = idx === this.settingsIndex;
      const iy = boxY + 32 + idx * 15;

      if (isSelected) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
        ctx.fillRect(boxX + 6, iy - 9, boxW - 12, 13);
      }

      ctx.textAlign = "left";
      ctx.font = isSelected ? "bold 7.5px monospace" : "7px monospace";
      ctx.fillStyle = isSelected ? "#ffffff" : "#94a3b8";
      ctx.fillText(opt.label, boxX + 14, iy);

      if (opt.key) {
        ctx.textAlign = "right";
        const val = this.config[opt.key];
        ctx.fillStyle = val ? "#4ade80" : "#f87171";
        ctx.fillText(val ? "[ ON ]" : "[ OFF ]", boxX + boxW - 14, iy);
      }
    });

    ctx.fillStyle = "#64748b";
    ctx.font = "6px monospace";
    ctx.textAlign = "center";
    ctx.fillText("ENTER / SPACE TO TOGGLE • RETURN TO APPLY", width / 2, boxY + boxH - 5);
  }
}