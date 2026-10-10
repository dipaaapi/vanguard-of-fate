import { Keybinds } from "./keybinds.js";
import { Sound } from "./audio.js";
import { t, getLang, setLang, toggleLang, onLangChange } from "./i18n.js";
import { SETTINGS, settingLabel, settingValue, stepSetting, toggleFullscreen } from "./settings.js";

// Title screen (full window). The logo, menu and credits are HTML/CSS;
// the canvas (#titleFx) animates the painting: stars, eclipse, sea, a passing ship, the sword and embers.
//
// Steps (data-step on #title):
//   press      → "Press any key" (music also starts here, since browsers need user input)
//   menu       → Continue / New Expedition / Options / Credits
//   options    → settings, controls, language and save data
//   controls   → keyboard and controller reference

const SAVE_KEY = "vanguard_savegame";
const BG_SRC = "assets/bg/title_bg.png";
const SWORD = { x: 0.5, y: 0.42 };   // position of the sword in the picture (0–1)
const FX_PIXEL = 3;                  // size of one ember "pixel" on screen

export class TitleScene {
  constructor(onStartGame, onContinueGame, onExportSave, onImportSave, config, rootEl) {
    this.onStartGame = onStartGame;
    this.onContinueGame = onContinueGame;
    this.onExportSave = onExportSave;
    this.onImportSave = onImportSave;
    this.config = config;

    this.root = rootEl;
    this.menuEl = rootEl.querySelector("#titleMenu");
    this.hintEl = rootEl.querySelector("#titleHint");
    this.langBtn = rootEl.querySelector("#langToggle");
    this.controlsBody = rootEl.querySelector("#controlsBody");

    this.step = "press";
    this.index = 0;
    this.items = [];
    this.padPrev = new Set();
    this.padNavAt = 0;

    this.fx = rootEl.querySelector("#titleFx");
    this.fxCtx = this.fx.getContext("2d");
    this.bg = new Image();
    this.bg.src = BG_SRC;
    this.particles = [];
    this.tick = 0;

    this.bindDom();
    onLangChange(() => this.render());
    this.render();
  }

  // ---------- SAVE INFO ----------
  readSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  // "Lv 7 Knight · 2h ago"
  saveSummary(save) {
    const hero = save.heroId ? save.heroId[0].toUpperCase() + save.heroId.slice(1) : "";
    const parts = [`Lv ${save.level || 1} ${hero}`.trim()];
    const when = Date.parse(save.savedAt);
    if (!Number.isNaN(when)) {
      const mins = Math.max(0, Math.floor((Date.now() - when) / 60000));
      if (mins < 1) parts.push(t("justNow"));
      else if (mins < 60) parts.push(t("minutesAgo", mins));
      else if (mins < 60 * 24) parts.push(t("hoursAgo", Math.floor(mins / 60)));
      else parts.push(t("daysAgo", Math.floor(mins / 1440)));
    }
    return parts.join(" · ");
  }

  refreshSaveStatus() {
    if (this.step === "menu" || this.step === "options") this.render();
  }

  // ---------- MENU DATA ----------
  buildItems() {
    const save = this.readSave();

    if (this.step === "options") {
      // Settings come from js/settings.js (shared with the in-game Settings panel, O)
      return [
        ...SETTINGS.map((s) => ({ id: s.id, label: settingLabel(s.id), [s.toggle ? "toggle" : "choice"]: s.id })),
        { id: "controls", label: t("controlsTitle"), section: t("controlsSection") },
        { id: "lang",    label: t("language"), lang: true },
        { id: "export",  label: t("exportSave"), disabled: !save, section: t("saveData") },
        { id: "import",  label: t("importSave") },
        { id: "back",    label: t("back"), gap: true }
      ];
    }

    // No save → Continue is hidden (not greyed out)
    const items = [];
    if (save) items.push({ id: "continue", label: t("continue"), sub: this.saveSummary(save) });
    items.push(
      { id: "new",        label: t("newGame") },
      { id: "options",    label: t("options") },
      { id: "credits",    label: t("credits") }
    );
    return items;
  }

  // ---------- DOM ----------
  bindDom() {
    // Clicking anywhere on the "press" step → continue to the menu
    this.root.addEventListener("pointerdown", (e) => {
      Sound.init();
      if (this.step === "press" && !e.target.closest(".t-lang")) this.advance();
    });

    // Dropdown: EN / TL at Full Screen ↔ Normal Screen
    const btn = this.langBtn.querySelector("#langBtn");
    const setMenu = (open) => {
      this.langBtn.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    };
    this.langBtn.addEventListener("mousedown", (e) => e.preventDefault());
    btn.addEventListener("click", () => {
      Sound.init();
      setMenu(!this.langBtn.classList.contains("open"));
      if (Sound.playSelectMove) Sound.playSelectMove();
    });
    this.langBtn.querySelectorAll("[data-lang]").forEach((el) => {
      el.addEventListener("click", () => {
        setLang(el.dataset.lang);
        setMenu(false);
        if (Sound.playSelectMove) Sound.playSelectMove();
      });
    });
    this.langBtn.querySelector("#screenItem").addEventListener("click", () => {
      toggleFullscreen();
      setMenu(false);
      if (Sound.playSelectMove) Sound.playSelectMove();
    });
    document.addEventListener("pointerdown", (e) => { if (!e.target.closest(".t-lang")) setMenu(false); });
    document.addEventListener("fullscreenchange", () => this.renderLang());

    const credClose = this.root.querySelector("#credClose");
    if (credClose) credClose.addEventListener("click", () => this.closeCredits());
    const controlsClose = this.root.querySelector("#controlsClose");
    if (controlsClose) controlsClose.addEventListener("click", () => this.closeControls());
  }

  render() {
    this.root.dataset.step = this.step;

    this.root.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    this.renderLang();

    const hintKey = { press: "", menu: "titleHint", options: "optionsHint", controls: "controlsHint", credits: "creditsHint" }[this.step];
    this.hintEl.innerHTML = hintKey ? t(hintKey) : "";

    if (this.step === "menu" || this.step === "options") this.renderMenu();
    if (this.step === "controls") this.renderControls();
    if (this.step === "credits") this.renderCredits();
  }

  // Dropdown label: current language (EN / TL) and Full Screen ↔ Normal Screen
  renderLang() {
    const cur = getLang();
    this.langBtn.querySelector("#langCur").textContent = cur === "fil" ? "TL" : "EN";
    this.langBtn.querySelectorAll("[data-lang]").forEach((el) => {
      el.classList.toggle("on", el.dataset.lang === cur);
      el.setAttribute("aria-checked", String(el.dataset.lang === cur));
    });
    const full = Boolean(document.fullscreenElement);
    this.langBtn.querySelector("#screenItem").textContent = full
      ? (cur === "fil" ? "⛶ Normal na Screen" : "⛶ Normal Screen")
      : (cur === "fil" ? "⛶ Full Screen" : "⛶ Full Screen");
  }

  renderMenu() {
    this.items = this.buildItems();
    this.index = Math.min(this.index, this.items.length - 1);
    if (this.items[this.index].disabled) this.index = this.nextEnabled(this.index, 1);

    this.menuEl.innerHTML = "";
    this.menuEl.classList.toggle("options", this.step === "options");

    this.items.forEach((item, i) => {
      if (item.section) {
        const sec = document.createElement("div");
        sec.className = "t-section";
        sec.textContent = item.section;
        this.menuEl.appendChild(sec);
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "t-item";
      if (item.disabled) btn.classList.add("disabled");
      if (item.gap) btn.classList.add("gap");

      const label = document.createElement("span");
      label.className = "t-label";
      label.textContent = item.label;
      btn.appendChild(label);

      if (item.sub) {
        const sub = document.createElement("span");
        sub.className = "t-subline";
        sub.textContent = item.sub;
        btn.appendChild(sub);
      }

      if (item.toggle) {
        const on = Boolean(this.config[item.toggle]);
        const v = document.createElement("span");
        v.className = "t-value " + (on ? "on" : "off");
        v.textContent = on ? "ON" : "OFF";
        btn.appendChild(v);
      }

      if (item.choice) {
        // a setting with several values (Quality, volume, FPS limit, brightness): ← → steps it
        const v = document.createElement("span");
        v.className = "t-value on";
        v.textContent = `◀ ${settingValue(item.choice, this.config)} ▶`;
        btn.appendChild(v);
      }

      if (item.lang) {
        const v = document.createElement("span");
        v.className = "t-value";
        v.innerHTML = getLang() === "en" ? "<b>EN</b> / FIL" : "EN / <b>FIL</b>";
        btn.appendChild(v);
      }

      // Avoid focus so Space/Enter don't double-trigger
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("mouseenter", () => { if (!item.disabled) this.setIndex(i, false); });
      btn.addEventListener("click", () => {
        Sound.init();
        if (item.disabled) return;
        this.setIndex(i, false);
        this.confirm();
      });

      this.menuEl.appendChild(btn);
    });

    this.syncSelection();
  }

  syncSelection() {
    this.menuEl.querySelectorAll(".t-item").forEach((el, i) => {
      el.classList.toggle("selected", i === this.index);
      if (i === this.index && this.step === "options" && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    });
  }

  setIndex(i, playSound = true) {
    if (i !== this.index && playSound && Sound.playSelectMove) Sound.playSelectMove();
    this.index = i;
    this.syncSelection();
  }

  nextEnabled(from, dir) {
    const n = this.items.length;
    let i = from;
    for (let k = 0; k < n; k++) {
      i = (i + dir + n) % n;
      if (!this.items[i].disabled) return i;
    }
    return from;
  }

  // ---------- ACTIONS ----------
  advance() {
    this.step = "menu";
    this.index = 0;
    if (Sound.playSelectConfirm) Sound.playSelectConfirm();
    if (this.config.music && Sound.startTitleBGM) Sound.startTitleBGM();
    this.render();
  }

  flash() {
    const el = document.getElementById("flash");
    if (!el) return;
    el.classList.remove("go");
    void el.offsetWidth; // restart the animation
    el.classList.add("go");
  }

  goTo(step, focusId) {
    this.step = step;
    this.items = this.buildItems();
    const i = this.items.findIndex((it) => it.id === focusId);
    this.index = i >= 0 ? i : 0;
    this.render();
  }

  confirm() {
    const item = this.items[this.index];
    if (!item || item.disabled) return;

    if (this.step === "options") {
      if (item.toggle || item.lang || item.choice) {
        this.change(item, 0);
        return;
      }
      if (Sound.playSelectConfirm) Sound.playSelectConfirm();
      if (item.id === "controls") this.goTo("controls", "controls");
      else if (item.id === "export") this.onExportSave();
      else if (item.id === "import") this.onImportSave();
      else if (item.id === "back") this.goTo("menu", "options");
      return;
    }

    if (Sound.playSelectConfirm) Sound.playSelectConfirm();
    if (item.id === "continue") {
      this.flash();
      this.onContinueGame();
    } else if (item.id === "new") {
      this.flash();
      this.onStartGame();
    } else if (item.id === "options") {
      this.goTo("options", "music");
    } else if (item.id === "credits") {
      this.goTo("credits");
    }
  }

  // Toggle a setting or the language (Enter or ← →)
  change(item, dir = 1) {
    if (Sound.playSelectMove) Sound.playSelectMove();
    if (item.lang) {
      toggleLang(); // onLangChange calls render()
      return;
    }
    const key = item.toggle || item.choice;
    stepSetting(this.config, key, dir || 1, !dir);   // Enter / click cycles round; ← → stops at the ends

    if (key === "music") {
      Sound.musicEnabled = Boolean(this.config.music);
      if (this.config.music) Sound.startTitleBGM();
      else Sound.stopTitleBGM();
    } else if (key === "sfx") {
      Sound.sfxEnabled = Boolean(this.config.sfx);
    }
    if (this.onConfigChange) this.onConfigChange(key);
    this.renderMenu();
  }

  // ---------- CREDITS ----------
  // The game's author, the story, the technology and the inspirations
  closeCredits() {
    if (Sound.playSelectMove) Sound.playSelectMove();
    this.goTo("menu", "credits");
  }

  renderCredits() {
    this.root.querySelector("#credTitle").textContent = t("credits");
    const body = this.root.querySelector("#credBody");
    if (!body) return;
    body.innerHTML = "";
    const add = (tag, cls, text) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      body.appendChild(n);
      return n;
    };
    add("div", "cr-game", "Vanguard of Fate");
    add("p", "cr-tag", t("subtitle"));

    add("h4", "", t("credCreator"));
    add("p", "cr-name", "EdMaster28");
    add("p", "cr-role", t("credCreatorRole"));

    add("h4", "", t("credStory"));
    add("p", "cr-name", "EdMaster28");
    add("p", "cr-role", t("credStoryRole"));

    add("h4", "", t("credWorld"));
    add("p", "cr-role", t("credWorldRole"));

    add("h4", "", t("credCharacters"));
    add("p", "cr-role", t("credCharactersRole"));

    add("h4", "", t("credCode"));
    add("p", "cr-name", "EdMaster28 × Claude (Anthropic)");
    add("p", "cr-role", t("credCodeRole"));

    add("h4", "", t("credTech"));
    const tech = add("ul");
    [
      ["HTML5 Canvas 2D", t("credTechCanvas")],
      ["JavaScript ES Modules", t("credTechJs")],
      ["CSS3", t("credTechCss")],
      ["Web Audio API", t("credTechAudio")],
      ["localStorage + JSON", t("credTechSave")],
      ["Google Fonts", "Cinzel · Silkscreen"],
      [t("credTechPixel"), t("credTechPixelSub")],
      ["Aseprite", t("credTechAseprite")],
      ["Claude Code", t("credTechClaude")]
    ].forEach(([name, sub]) => {
      const li = document.createElement("li");
      const b = document.createElement("b");
      b.textContent = name;
      li.append(b, ` · ${sub}`);
      tech.appendChild(li);
    });

    add("h4", "", t("credInspired"));
    const ins = add("ul");
    [t("credMmo"), t("credArpg"), t("credIsekai")].forEach((name) => {
      const li = document.createElement("li");
      li.textContent = name;
      ins.appendChild(li);
    });

    add("p", "cr-role", t("credDisclaimer"));

    add("h4", "", t("credLang"));
    add("p", "cr-role", "English · Filipino");

    add("p", "cr-thanks", t("credThanks"));
  }

  // ---------- CONTROLS REFERENCE ----------
  closeControls() {
    if (Sound.playSelectMove) Sound.playSelectMove();
    this.goTo("options", "controls");
  }

  renderControls() {
    const title = this.root.querySelector("#controlsTitle");
    if (title) title.textContent = t("controlsTitle");
    const body = this.controlsBody;
    if (!body) return;
    body.replaceChildren();
    const groups = [
      [t("controlsKeyboard"), [
        [t("controlsMove"), "WASD / Arrow keys"], [t("controlsMenu"), "↑ / ↓ · Enter · Esc"],
        [t("controlsAttack"), "J · K · L"], [t("controlsSprint"), "Space"],
        [t("controlsInteract"), "E"], [t("controlsSwitch"), `${Keybinds.label("partyNext")} · ${Keybinds.label("party1")}–${Keybinds.label("party6")}`],
        [t("controlsFullscreen"), Keybinds.label("fullscreen")],
        [t("controlsPanels"), "Q · I · C · M · N · O · G"], [t("controlsQuick"), "1–4"],
        [t("controlsUtility"), t("controlsUtilityKeys")], [t("controlsPausedTitle"), "H"]
      ]],
      [t("controlsGamepad"), [
        [t("controlsMove"), t("controlsPadMove")], [t("controlsMenu"), t("controlsPadMenu")],
        [t("controlsAttack"), t("controlsPadAttack")], [t("controlsSprint"), t("controlsPadSprint")],
        [t("controlsInteract"), t("controlsPadInteract")], [t("controlsSwitch"), t("controlsPadSwitch")]
      ]]
    ];
    for (const [heading, rows] of groups) {
      const section = document.createElement("section");
      section.className = "control-group";
      const h = document.createElement("h3"); h.textContent = heading; section.appendChild(h);
      const list = document.createElement("dl");
      for (const [label, keys] of rows) {
        const dt = document.createElement("dt"); dt.textContent = label;
        const dd = document.createElement("dd"); dd.textContent = keys;
        list.append(dt, dd);
      }
      section.appendChild(list); body.appendChild(section);
    }
    const note = document.createElement("p");
    note.className = "control-note"; note.textContent = t("controlsNote"); body.appendChild(note);
  }

  // ---------- INPUT ----------
  handleInput(e) {
    const c = e.code;
    const up = c === "ArrowUp" || c === "KeyW";
    const down = c === "ArrowDown" || c === "KeyS";
    const left = c === "ArrowLeft" || c === "KeyA";
    const right = c === "ArrowRight" || c === "KeyD";
    const ok = c === "Enter" || c === "Space" || c === "KeyJ";
    const back = c === "Escape" || c === "Backspace";

    if (c === "Space" || up || down) e.preventDefault();

    if (c === "KeyL" && !e.repeat) {
      toggleLang();
      if (Sound.playSelectMove) Sound.playSelectMove();
      return;
    }

    if (this.step === "press") {
      if (!e.repeat && !/^(Shift|Control|Alt|Meta|F\d+)/.test(c)) this.advance();
      return;
    }

    if (this.step === "credits") {
      const bodyEl = this.root.querySelector("#credBody");
      if (up && bodyEl) bodyEl.scrollBy({ top: -80, behavior: "smooth" });
      else if (down && bodyEl) bodyEl.scrollBy({ top: 80, behavior: "smooth" });
      else if (back || ok) this.closeCredits();
      return;
    }

    if (this.step === "controls") {
      if (up) this.controlsBody.scrollBy({ top: -70, behavior: "smooth" });
      else if (down) this.controlsBody.scrollBy({ top: 70, behavior: "smooth" });
      else if (back || ok) this.closeControls();
      return;
    }

    if (up) this.setIndex(this.nextEnabled(this.index, -1));
    else if (down) this.setIndex(this.nextEnabled(this.index, 1));
    else if (ok && !e.repeat) this.confirm();
    else if ((left || right) && this.step === "options") {
      const item = this.items[this.index];
      if (item.toggle || item.lang || item.choice) this.change(item, left ? -1 : 1);
    } else if (back && this.step === "options") {
      if (Sound.playSelectMove) Sound.playSelectMove();
      this.goTo("menu", "options");
    } else if (back && this.step === "controls") {
      this.closeControls();
    }
  }

  pollGamepad() {
    const pad = navigator.getGamepads?.() && Array.from(navigator.getGamepads()).find((p) => p?.connected);
    if (!pad) { this.padPrev.clear(); return; }
    const down = new Set();
    pad.buttons.forEach((b, i) => { if (b?.pressed || b?.value > 0.55) down.add(`b${i}`); });
    const x = pad.axes[0] || 0, y = pad.axes[1] || 0;
    if (y < -0.55) down.add("up"); if (y > 0.55) down.add("down");
    if (x < -0.55) down.add("left"); if (x > 0.55) down.add("right");
    const edge = (...keys) => keys.some((key) => down.has(key) && !this.padPrev.has(key));
    if (edge("up", "b12")) {
      if (this.step === "controls") this.controlsBody.scrollBy({ top: -70 });
      else this.setIndex(this.nextEnabled(this.index, -1));
    } else if (edge("down", "b13")) {
      if (this.step === "controls") this.controlsBody.scrollBy({ top: 70 });
      else this.setIndex(this.nextEnabled(this.index, 1));
    }
    else if (edge("left", "b14") && this.step === "options") {
      const item = this.items[this.index]; if (item?.toggle || item?.choice || item?.lang) this.change(item, -1);
    } else if (edge("right", "b15") && this.step === "options") {
      const item = this.items[this.index]; if (item?.toggle || item?.choice || item?.lang) this.change(item, 1);
    }
    if (edge("b0")) {
      if (this.step === "press") this.advance();
      else if (this.step === "controls") this.closeControls();
      else if (this.step !== "credits") this.confirm();
    }
    if (edge("b1")) {
      if (this.step === "controls") this.closeControls();
      else if (this.step === "credits") this.closeCredits();
      else if (this.step === "options") this.goTo("menu", "options");
      else this.goTo("menu");
    }
    if (edge("b9") && this.step === "press") this.advance();
    this.padPrev = down;
  }

  // ---------- LIVING BACKGROUND (canvas) ----------
  // Low-res canvas scaled by FX_PIXEL so the effects are chunky, matching the pixel art. Positions are
  // in the painting's own 480×270 art pixels (tools/art/scenes/title.js) and follow its "cover" fit:
  // twinkling stars, shooting stars, the eclipse's corona, a ship sailing the horizon, moonlight glints
  // on the sea, the pentagram circle pulsing under the sword, the lantern's flicker and the embers.
  draw() {
    this.pollGamepad();
    this.tick++;
    const W = Math.ceil(window.innerWidth / FX_PIXEL);
    const H = Math.ceil(window.innerHeight / FX_PIXEL);
    if (this.fx.width !== W || this.fx.height !== H) {
      this.fx.width = W;
      this.fx.height = H;
    }
    const ctx = this.fxCtx;
    ctx.clearRect(0, 0, W, H);

    // Same "cover" fit as the CSS background
    const iw = this.bg.naturalWidth || 1920;
    const ih = this.bg.naturalHeight || 1080;
    const s = Math.max(W / iw, H / ih);
    const k = (iw * s) / 480;                         // canvas pixels per art pixel
    const ox = (W - iw * s) / 2, oy = (H - ih * s) / 2;
    const A = (ax, ay) => [ox + ax * k, oy + ay * k];
    const t = this.tick;
    const calm = this.reducedMotion;

    if (!this.stars) this.seedScene();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // Twinkling stars: each one flares into a small cross now and then
    this.stars.forEach((st) => {
      const tw = Math.sin(t * st.speed + st.phase);
      if (tw < 0.55) return;
      const [x, y] = A(st.x, st.y);
      const a = (tw - 0.55) / 0.45;
      ctx.fillStyle = `rgba(${st.warm ? "255, 236, 190" : "205, 225, 255"}, ${0.85 * a})`;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      if (a > 0.7 && k > 0.9) {
        ctx.globalAlpha = (a - 0.7) * 2;
        ctx.fillRect(Math.round(x) - 1, Math.round(y), 3, 1);
        ctx.fillRect(Math.round(x), Math.round(y) - 1, 1, 3);
        ctx.globalAlpha = 1;
      }
    });

    // Shooting stars every few seconds
    if (!calm && t >= this.nextMeteor) {
      this.nextMeteor = t + 240 + Math.floor(Math.random() * 360);
      this.meteors.push({ x: 120 + Math.random() * 300, y: 10 + Math.random() * 50, vx: -(1.6 + Math.random()), vy: 0.7 + Math.random() * 0.4, life: 46 });
    }
    this.meteors = this.meteors.filter((m) => m.life > 0);
    this.meteors.forEach((m) => {
      m.x += m.vx; m.y += m.vy; m.life--;
      const fade = Math.min(1, m.life / 20);
      for (let i = 0; i < 9; i++) {
        const [x, y] = A(m.x - m.vx * i * 1.4, m.y - m.vy * i * 1.4);
        ctx.fillStyle = `rgba(220, 235, 255, ${fade * (1 - i / 9) * 0.9})`;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    });

    // Eclipse: a slow violet corona breathing around the dark disc, rays turning
    {
      const [ex, ey] = A(392, 52);
      const pulse = 1 + Math.sin(t / 40) * 0.08;
      const r = 26 * k * pulse;
      const g = ctx.createRadialGradient(ex, ey, 12 * k, ex, ey, r);
      g.addColorStop(0, "rgba(253, 230, 138, 0.22)");
      g.addColorStop(0.35, "rgba(139, 92, 246, 0.16)");
      g.addColorStop(1, "rgba(139, 92, 246, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(ex - r, ey - r, r * 2, r * 2);
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2 + t / 600;
        const len = (15 + ((i * 7) % 5) + Math.sin(t / 30 + i) * 2) * k;
        const [x, y] = [ex + Math.cos(ang) * len, ey + Math.sin(ang) * len];
        ctx.fillStyle = `rgba(253, 230, 138, ${0.25 + 0.2 * Math.sin(t / 25 + i * 1.7)})`;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }

    // Moonlight on the sea: glints dancing in the eclipse's reflection and across the water
    this.glints.forEach((gl) => {
      const life = (t + gl.phase) % gl.period;
      if (life > 30) return;
      const [x, y] = A(gl.x + Math.sin((t + gl.phase) / 20) * 2, gl.y);
      const a = Math.sin((life / 30) * Math.PI);
      ctx.fillStyle = `rgba(196, 181, 253, ${0.7 * a})`;
      ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(gl.w * k)), 1);
    });
    ctx.restore();

    // A ship crossing the horizon, from the east toward the cliff (fades out before it)
    if (!calm) this.drawHorizonShip(ctx, A, k, t);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    // Pentagram circle under the sword: its five points light up one after another
    {
      const [cx, cy] = A(240, 158);
      const colors = ["255, 99, 99", "96, 165, 250", "74, 222, 128", "250, 204, 21", "192, 132, 252"];
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI / 2 + (i / 5) * Math.PI * 2 + t / 900;
        const x = cx + Math.cos(ang) * 30 * k, y = cy + Math.sin(ang) * 7 * k;
        const lit = Math.max(0, Math.sin(t / 22 - i * 1.25));
        const r = (4 + lit * 5) * k;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${colors[i]}, ${0.15 + lit * 0.45})`);
        g.addColorStop(1, `rgba(${colors[i]}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // a ring of light sweeping round the circle
      const sweep = t / 50;
      for (let i = 0; i < 14; i++) {
        const ang = sweep - i * 0.08;
        ctx.fillStyle = `rgba(103, 232, 249, ${0.5 * (1 - i / 14)})`;
        ctx.fillRect(Math.round(cx + Math.cos(ang) * 30 * k), Math.round(cy + Math.sin(ang) * 7 * k), 1, 1);
      }
    }

    // The sword's pulsing glow
    const [sx, sy] = A(SWORD.x * 480, SWORD.y * 270);
    {
      const pulse = 1 + Math.sin(t / 16) * 0.12;
      const r = 60 * k * pulse;
      const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, r);
      glow.addColorStop(0, "rgba(255, 170, 70, 0.30)");
      glow.addColorStop(0.5, "rgba(56, 160, 248, 0.10)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
    }

    // The lantern on the hilt flickers like a real flame
    {
      const [lx, ly] = A(259, 84);
      const f = 0.55 + 0.25 * Math.sin(t / 7) + 0.2 * Math.sin(t / 2.3 + Math.sin(t / 11));
      const r = 22 * k;
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
      g.addColorStop(0, `rgba(255, 214, 130, ${0.28 * f})`);
      g.addColorStop(1, "rgba(255, 214, 130, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
    }
    ctx.restore();

    // Embers rising from the sword and fireflies drifting over the cliff
    if (this.tick % 3 === 0) {
      const colors = ["#ffb347", "#ff8a3d", "#ffd166", "#38bdf8", "#a5f3fc"];
      this.particles.push({
        x: sx + (Math.random() - 0.5) * 22 * k,
        y: sy + Math.random() * 60 * k,
        vx: (Math.random() - 0.5) * 0.25 * k,
        vy: -(0.2 + Math.random() * 0.45) * k,
        life: 80 + Math.random() * 70,
        max: 150,
        size: Math.random() < 0.3 ? 2 : 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    if (this.tick % 20 === 0 && this.particles.length < 160) {
      const [fx0, fy0] = A(150 + Math.random() * 180, 175 + Math.random() * 60);
      this.particles.push({ x: fx0, y: fy0, vx: (Math.random() - 0.5) * 0.2 * k, vy: -0.05 * k, life: 200, max: 200, size: 1, color: "#d9f99d", firefly: true });
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    this.particles.forEach((p) => {
      p.x += p.vx + Math.sin((p.y + this.tick) / 14) * (p.firefly ? 0.15 : 0.08) * k;
      p.y += p.vy;
      p.life--;
      const blink = p.firefly ? Math.max(0, Math.sin(p.life / 9)) : 1;
      ctx.globalAlpha = Math.max(0, p.life / p.max) * blink;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }

  // Fixed star field, sea glints and timers (art pixels), made once
  seedScene() {
    let seed = 1337;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    this.stars = Array.from({ length: 70 }, () => ({
      x: rnd() * 480, y: rnd() * 140, speed: 0.02 + rnd() * 0.05, phase: rnd() * 6.3, warm: rnd() < 0.3
    })).filter((st) => Math.hypot(st.x - 392, st.y - 52) > 22 && Math.hypot(st.x - 240, st.y - 90) > 40);
    this.glints = Array.from({ length: 34 }, (_, i) => {
      const reflect = i < 14;   // the eclipse's column of light on the water
      return {
        x: reflect ? 386 + rnd() * 12 : 330 + rnd() * 150,
        y: reflect ? 152 + rnd() * 40 : 152 + rnd() * 26,
        w: 2 + Math.floor(rnd() * 4),
        period: 70 + Math.floor(rnd() * 120),
        phase: Math.floor(rnd() * 200)
      };
    });
    this.meteors = [];
    this.nextMeteor = 120;
    this.reducedMotion = Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  // A small galleon in silhouette with a lit stern lantern, sailing west along the horizon
  drawHorizonShip(ctx, A, k, t) {
    const span = 3600;                                  // frames for one crossing
    const p = (t % span) / span;
    const ax = 500 - p * 175;                           // from beyond the right edge to x 325
    const fade = Math.min(1, (ax - 330) / 20);
    if (fade <= 0) return;
    const bob = Math.sin(t / 30) * 0.4;
    const [x0, y0] = A(ax, 160 + bob);
    const u = Math.max(1, k * 0.8);
    const R = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x0 + dx * u), Math.round(y0 + dy * u), Math.max(1, Math.round(w * u)), Math.max(1, Math.round(h * u))); };
    ctx.save();
    ctx.globalAlpha = 0.9 * fade;
    R(-9, -1, 20, 2, "#04060d");               // hull
    R(-8, 1, 17, 1, "#0b1024");
    R(8, -4, 4, 3, "#0b1024");                 // raised stern (east: it sails west)
    R(0, -14, 1, 13, "#141a36");               // mast
    R(-5, -12, 9, 5, "#5664a0");               // sails catching the moonlight
    R(-4, -6, 8, 4, "#46528c");
    R(1, -13, 6, 1, "#141a36");
    R(-13, -2, 4, 1, "#141a36");               // bowsprit
    ctx.globalAlpha = fade * (0.6 + 0.4 * Math.sin(t / 9));
    R(11, -5, 1, 1, "#ffd27a");                // stern lantern
    ctx.globalAlpha = 0.35 * fade;
    R(-10, 2, 22, 1, "#8aa0d8");               // its reflection
    ctx.restore();
  }
}
