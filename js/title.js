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

    this.bgImage = new Image();
    this.bgImage.src = "assets/title_bg.jpg";

    this.embers = [];
    for (let i = 0; i < 35; i++) {
      this.embers.push({
        x: 213 + (Math.random() * 40 - 20),
        y: 80 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.4 - Math.random() * 0.7,
        size: Math.random() < 0.3 ? 2 : 1,
        life: Math.random() * 60,
        maxLife: 60,
        color: Math.random() < 0.5 ? "#ffd166" : (Math.random() < 0.5 ? "#ff5500" : "#38bdf8")
      });
    }

    this.stars = [];
    for (let i = 0; i < 30; i++) {
      this.stars.push({
        x: Math.random() * 426,
        y: Math.random() * 90,
        size: Math.random() < 0.2 ? 2 : 1,
        twinkleSpeed: 0.04 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  updateMenuItems() {
    this.hasSaveFile = Boolean(localStorage.getItem("vanguard_savegame") || localStorage.getItem("vanguard_savegame_backup"));
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

  handlePointerMove(clickX, clickY) {
    if (this.inSettings) {
      for (let i = 0; i < this.settingsOptions.length; i++) {
        const sBoxW = 210;
        const sBoxX = Math.round(480 / 2 - sBoxW / 2);
        const sBoxY = 62;
        const sy = sBoxY + 18 + i * 17;
        if (clickX >= sBoxX + 6 && clickX <= sBoxX + sBoxW - 6 && clickY >= sy - 9 && clickY <= sy + 8) {
          if (this.settingsIndex !== i) {
            this.settingsIndex = i;
            if (Sound && Sound.playSelectHover) Sound.playSelectHover();
          }
          break;
        }
      }
      return;
    }

    const boxW = 196;
    const boxX = Math.round(480 / 2 - boxW / 2);
    const boxY = 62;

    for (let i = 0; i < this.menuItems.length; i++) {
      const iy = boxY + 18 + i * 17;
      if (clickX >= boxX + 6 && clickX <= boxX + boxW - 6 && clickY >= iy - 9 && clickY <= iy + 8) {
        if (this.menuIndex !== i) {
          this.menuIndex = i;
          if (Sound && Sound.playSelectHover) Sound.playSelectHover();
        }
        break;
      }
    }
  }

  handlePointerDown(clickX, clickY) {
    if (this.inSettings) {
      for (let i = 0; i < this.settingsOptions.length; i++) {
        const sBoxW = 210;
        const sBoxX = Math.round(480 / 2 - sBoxW / 2);
        const sBoxY = 62;
        const sy = sBoxY + 18 + i * 17;
        if (clickX >= sBoxX + 6 && clickX <= sBoxX + sBoxW - 6 && clickY >= sy - 9 && clickY <= sy + 8) {
          this.settingsIndex = i;
          const cur = this.settingsOptions[i];
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
          return;
        }
      }
      return;
    }

    const boxW = 196;
    const boxX = Math.round(480 / 2 - boxW / 2);
    const boxY = 62;

    for (let i = 0; i < this.menuItems.length; i++) {
      const iy = boxY + 18 + i * 17;
      if (clickX >= boxX + 6 && clickX <= boxX + boxW - 6 && clickY >= iy - 9 && clickY <= iy + 8) {
        this.menuIndex = i;
        const selected = this.menuItems[i];
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
        return;
      }
    }
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

    // 1. Draw Background Image or Fallback Gradient
    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth !== 0) {
      ctx.drawImage(this.bgImage, 0, 0, width, height);

      // Subtle atmospheric vignette
      const vig = ctx.createRadialGradient(width / 2, height / 2, 70, width / 2, height / 2, 220);
      vig.addColorStop(0, "rgba(0, 0, 0, 0)");
      vig.addColorStop(1, "rgba(3, 6, 17, 0.45)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Celestial Night Sky Fallback
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, "#030611");
      skyGrad.addColorStop(0.5, "#0b152d");
      skyGrad.addColorStop(0.85, "#182038");
      skyGrad.addColorStop(1, "#070c18");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Animated Cosmic Twinkle Stars
    this.stars.forEach((star) => {
      const alpha = 0.25 + (Math.sin(this.animTick * star.twinkleSpeed + star.phase) + 1) * 0.35;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // 3. Animated Flaming Embers rising from the Sword on the Altar
    const swordCenterX = width * 0.505;
    for (let e of this.embers) {
      e.y += e.vy;
      e.x += e.vx;
      e.life++;

      const lifeRatio = 1 - (e.life / e.maxLife);
      ctx.save();
      ctx.globalAlpha = Math.max(0, lifeRatio * 0.85);
      ctx.fillStyle = e.color;
      ctx.fillRect(Math.floor(e.x), Math.floor(e.y), e.size, e.size);
      ctx.restore();

      if (e.life >= e.maxLife || e.y < 30) {
        e.x = swordCenterX + (Math.random() * 32 - 16);
        e.y = 125 + Math.random() * 25;
        e.life = 0;
      }
    }

    // 4. Glowing Sacred Sword Halo Pulse
    const pulse = Math.sin(this.animTick * 0.08) * 4;
    const swordAura = ctx.createRadialGradient(swordCenterX, 95, 8, swordCenterX, 95, 38 + pulse);
    swordAura.addColorStop(0, "rgba(255, 209, 102, 0.25)");
    swordAura.addColorStop(0.5, "rgba(56, 189, 248, 0.15)");
    swordAura.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = swordAura;
    ctx.fillRect(swordCenterX - 50, 45, 100, 100);

    // 5. Floating Vanguard Title Logo
    const logoY = 28 + Math.sin(this.animTick / 22) * 1.5;

    // Outer glow & shadow
    ctx.fillStyle = "#000000";
    ctx.font = "900 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("VANGUARD OF FATE", width / 2 + 1.5, logoY + 1.5);
    ctx.fillText("VANGUARD OF FATE", width / 2 - 1.5, logoY - 1.5);
    ctx.fillText("VANGUARD OF FATE", width / 2 + 1.5, logoY - 1.5);
    ctx.fillText("VANGUARD OF FATE", width / 2 - 1.5, logoY + 1.5);

    ctx.fillStyle = "#ffd166";
    ctx.fillText("VANGUARD OF FATE", width / 2, logoY);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 6.5px monospace";
    ctx.fillText("— ISEKAI REBIRTH : CHRONICLES OF AETHELGARD —", width / 2, logoY + 10);

    // 6. Menu Panels
    if (this.inSettings) {
      this.drawSettings(ctx, width, height);
    } else {
      this.drawMainMenu(ctx, width, height);
    }

    ctx.fillStyle = "#cbd5e1";
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