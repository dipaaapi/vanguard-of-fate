import { Sound } from "./audio.js";
import { loadImage, drawCover } from "./background.js";

// Ang TitleScene ay canvas animation lang (summoning orb).
// Ang menu ay HTML sa ibaba ng canvas (menuEl), hindi na dini-draw sa loob ng game screen.
export class TitleScene {
  constructor(onStartGame, onContinueGame, onExportSave, onImportSave, config, menuEl = null) {
    this.onStartGame = onStartGame;
    this.onContinueGame = onContinueGame;
    this.onExportSave = onExportSave;
    this.onImportSave = onImportSave;
    this.config = config;
    this.menuEl = menuEl;

    this.menuIndex = 0;
    this.animTick = 0;
    this.inSettings = false;
    this.settingsIndex = 0;

    this.settingsOptions = [
      { id: "music",   label: "BGM MUSIC", key: "music" },
      { id: "sfx",     label: "COMBAT SFX", key: "sfx" },
      { id: "blood",   label: "BLOOD SPLATTER", key: "blood" },
      { id: "weather", label: "ATMOSPHERE RAIN", key: "weather" },
      { id: "back",    label: "RETURN TO TITLE" }
    ];

    this.bg = loadImage("assets/bg/title_bg.jpg");
    this.particles = [];

    this.updateMenuItems();
  }

  // ---------- MENU DATA ----------
  updateMenuItems() {
    this.hasSaveFile = Boolean(localStorage.getItem("vanguard_savegame"));
    this.menuItems = [
      { id: "START",    label: "NEW EXPEDITION", enabled: true },
      { id: "CONTINUE", label: "CONTINUE EXPEDITION", enabled: this.hasSaveFile },
      { id: "EXPORT",   label: "EXPORT SAVE (.JSON)", enabled: this.hasSaveFile },
      { id: "IMPORT",   label: "IMPORT SAVE (.JSON)", enabled: true },
      { id: "SETTINGS", label: "EXPEDITION CONFIG", enabled: true }
    ];
    this.renderDom();
  }

  refreshSaveStatus() {
    this.updateMenuItems();
  }

  // ---------- HTML MENU ----------
  renderDom() {
    if (!this.menuEl) return;
    const list = this.inSettings ? this.settingsOptions : this.menuItems;
    this.menuEl.innerHTML = "";
    this.menuEl.classList.toggle("settings", this.inSettings);

    list.forEach((item, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "menu-btn";
      if (item.enabled === false) btn.classList.add("disabled");

      const label = document.createElement("span");
      label.textContent = item.label;
      btn.appendChild(label);

      if (item.key) {
        const state = document.createElement("span");
        const on = Boolean(this.config[item.key]);
        state.className = "state " + (on ? "on" : "off");
        state.textContent = on ? "ON" : "OFF";
        btn.appendChild(state);
      }

      // Iwas focus para hindi mag-double trigger ang Space/Enter
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("mouseenter", () => this.setIndex(i, false));
      btn.addEventListener("click", () => {
        Sound.init();
        this.setIndex(i, false);
        this.confirm();
      });

      this.menuEl.appendChild(btn);
    });

    this.syncSelection();
  }

  syncSelection() {
    if (!this.menuEl) return;
    const sel = this.inSettings ? this.settingsIndex : this.menuIndex;
    Array.from(this.menuEl.children).forEach((el, i) => el.classList.toggle("selected", i === sel));
  }

  setIndex(i, playSound = true) {
    const prev = this.inSettings ? this.settingsIndex : this.menuIndex;
    if (this.inSettings) this.settingsIndex = i; else this.menuIndex = i;
    if (i !== prev && playSound && Sound && Sound.playSelectMove) Sound.playSelectMove();
    this.syncSelection();
  }

  // ---------- ACTIONS ----------
  confirm() {
    if (this.inSettings) {
      const cur = this.settingsOptions[this.settingsIndex];
      if (cur.id === "back") {
        this.inSettings = false;
        if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
        this.renderDom();
        return;
      }
      this.config[cur.key] = !this.config[cur.key];
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      if (cur.key === "music") {
        if (this.config.music) {
          if (Sound && Sound.startTitleBGM) Sound.startTitleBGM();
        } else if (Sound && Sound.stopTitleBGM) {
          Sound.stopTitleBGM();
        }
      }
      this.renderDom();
      return;
    }

    const selected = this.menuItems[this.menuIndex];
    if (!selected.enabled) {
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      return;
    }

    if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
    if (selected.id === "START") this.onStartGame();
    else if (selected.id === "CONTINUE") this.onContinueGame();
    else if (selected.id === "EXPORT") this.onExportSave();
    else if (selected.id === "IMPORT") this.onImportSave();
    else if (selected.id === "SETTINGS") {
      this.inSettings = true;
      this.settingsIndex = 0;
      this.renderDom();
    }
  }

  handleInput(e) {
    const list = this.inSettings ? this.settingsOptions : this.menuItems;
    const cur = this.inSettings ? this.settingsIndex : this.menuIndex;

    if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "ArrowLeft" || e.code === "KeyA") {
      this.setIndex((cur - 1 + list.length) % list.length);
    } else if (e.code === "ArrowDown" || e.code === "KeyS" || e.code === "ArrowRight" || e.code === "KeyD") {
      this.setIndex((cur + 1) % list.length);
    } else if (e.code === "Enter" || e.code === "Space" || e.code === "KeyJ") {
      e.preventDefault();
      this.confirm();
    }
  }

  // ---------- CANVAS ANIMATION ----------
  spawnEmber(cx, cy) {
    const colors = ["#ffb347", "#ff8a3d", "#ffd166", "#38bdf8", "#a5f3fc"];
    this.particles.push({
      x: cx + (Math.random() - 0.5) * 22,
      y: cy + Math.random() * 60,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(0.2 + Math.random() * 0.45),
      life: 80 + Math.random() * 70,
      max: 150,
      size: Math.random() < 0.3 ? 2 : 1,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  draw(ctx, width, height) {
    this.animTick++;

    // Background: assets/bg/title_bg.jpg (may fallback kung hindi pa loaded)
    if (!drawCover(ctx, this.bg, width, height)) {
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#030611");
      sky.addColorStop(1, "#182038");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);
    }

    // Pulsing glow sa espada (nasa gitna ng larawan)
    const sx = width * 0.5;
    const sy = height * 0.42;
    const pulse = 1 + Math.sin(this.animTick / 16) * 0.12;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, 60 * pulse);
    glow.addColorStop(0, "rgba(255, 170, 70, 0.30)");
    glow.addColorStop(0.5, "rgba(56, 160, 248, 0.10)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(sx - 70, sy - 70, 140, 140);
    ctx.restore();

    // Lumilipad na baga
    if (this.animTick % 3 === 0) this.spawnEmber(sx, sy);
    this.particles = this.particles.filter((p) => p.life > 0);
    this.particles.forEach((p) => {
      p.x += p.vx + Math.sin((p.y + this.animTick) / 14) * 0.08;
      p.y += p.vy;
      p.life--;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // Dilim sa taas at baba para mabasa ang text
    const top = ctx.createLinearGradient(0, 0, 0, 62);
    top.addColorStop(0, "rgba(3, 6, 17, 0.75)");
    top.addColorStop(1, "rgba(3, 6, 17, 0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, width, 62);

    const bottom = ctx.createLinearGradient(0, height - 26, 0, height);
    bottom.addColorStop(0, "rgba(3, 6, 17, 0)");
    bottom.addColorStop(1, "rgba(3, 6, 17, 0.8)");
    ctx.fillStyle = bottom;
    ctx.fillRect(0, height - 26, width, 26);

    // Title
    const logoY = 22 + Math.sin(this.animTick / 22) * 1.5;
    ctx.textAlign = "center";
    ctx.font = "900 18px monospace";
    ctx.fillStyle = "#000000";
    ctx.fillText("VANGUARD OF FATE", width / 2 + 1, logoY + 1);
    ctx.fillStyle = "#ffd166";
    ctx.fillText("VANGUARD OF FATE", width / 2, logoY);

    ctx.font = "bold 6.5px monospace";
    ctx.fillStyle = "#000000";
    ctx.fillText("— ISEKAI REBIRTH : CHRONICLES OF AETHELGARD —", width / 2 + 0.5, logoY + 11.5);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("— ISEKAI REBIRTH : CHRONICLES OF AETHELGARD —", width / 2, logoY + 11);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "6px monospace";
    ctx.fillText("SUMMONED FROM EARTH • FIVE SOULS BOUND BY PROPHECY", width / 2, height - 7);
  }
}