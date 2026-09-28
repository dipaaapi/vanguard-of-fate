import { Sound } from "./audio.js";
import { t, getLang, toggleLang, onLangChange } from "./i18n.js";
import { loadLore, parseChapters, actNumber, bannerSrc, BANNER_EXTS } from "./lore.js";

// Title screen (buong window). HTML/CSS ang logo, menu at Chronicles;
// ang canvas (#titleFx) ay para lang sa baga at liwanag ng espada.
//
// Mga hakbang (data-step sa #title):
//   press      → "Press any key" (dito rin nagsisimula ang musika, dahil kailangan ng browser ng user input)
//   menu       → Continue / New Expedition / Chronicles / Options
//   options    → settings, wika, save data
//   chronicles → lore, hinati bawat Act

const SAVE_KEY = "vanguard_savegame";
const BG_SRC = "assets/bg/title_bg.jpg";
const SWORD = { x: 0.5, y: 0.42 };   // posisyon ng espada sa larawan (0–1)
const FX_PIXEL = 3;                  // laki ng isang "pixel" ng baga sa screen

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
    this.chronTabs = rootEl.querySelector("#chronTabs");
    this.chronBody = rootEl.querySelector("#chronBody");

    this.step = "press";
    this.index = 0;
    this.items = [];
    this.chapters = null;
    this.chapter = 0;

    this.fx = rootEl.querySelector("#titleFx");
    this.fxCtx = this.fx.getContext("2d");
    this.bg = new Image();
    this.bg.src = BG_SRC;
    this.particles = [];
    this.tick = 0;

    this.bindDom();
    onLangChange(async (lang) => {
      if (this.step === "chronicles") {
        this.chapters = parseChapters(await loadLore(lang));
      }
      this.render();
    });
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
      return [
        { id: "music",   label: t("music"),   toggle: "music" },
        { id: "sfx",     label: t("sfx"),     toggle: "sfx" },
        { id: "blood",   label: t("blood"),   toggle: "blood" },
        { id: "weather", label: t("weather"), toggle: "weather" },
        { id: "lang",    label: t("language"), lang: true },
        { id: "export",  label: t("exportSave"), disabled: !save, section: t("saveData") },
        { id: "import",  label: t("importSave") },
        { id: "back",    label: t("back"), gap: true }
      ];
    }

    // Walang save → nakatago ang Continue (hindi naka-gray)
    const items = [];
    if (save) items.push({ id: "continue", label: t("continue"), sub: this.saveSummary(save) });
    items.push(
      { id: "new",        label: t("newGame") },
      { id: "chronicles", label: t("chronicles") },
      { id: "options",    label: t("options") },
      { id: "credits",    label: t("credits") }
    );
    return items;
  }

  // ---------- DOM ----------
  bindDom() {
    // Pag-click kahit saan sa "press" step → tuloy sa menu
    this.root.addEventListener("pointerdown", (e) => {
      Sound.init();
      if (this.step === "press" && !e.target.closest(".t-lang")) this.advance();
    });

    this.langBtn.addEventListener("mousedown", (e) => e.preventDefault());
    this.langBtn.addEventListener("click", () => {
      Sound.init();
      toggleLang();
      if (Sound.playSelectMove) Sound.playSelectMove();
    });

    const close = this.root.querySelector("#chronClose");
    close.addEventListener("click", () => this.closeChronicles());
    const credClose = this.root.querySelector("#credClose");
    if (credClose) credClose.addEventListener("click", () => this.closeCredits());
  }

  render() {
    this.root.dataset.step = this.step;

    this.root.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    this.langBtn.querySelectorAll("[data-lang]").forEach((el) => {
      el.classList.toggle("on", el.dataset.lang === getLang());
    });

    const hintKey = { press: "", menu: "titleHint", options: "optionsHint", chronicles: "chroniclesHint", credits: "creditsHint" }[this.step];
    this.hintEl.innerHTML = hintKey ? t(hintKey) : "";

    if (this.step === "menu" || this.step === "options") this.renderMenu();
    if (this.step === "chronicles") this.renderChronicles();
    if (this.step === "credits") this.renderCredits();
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

      if (item.lang) {
        const v = document.createElement("span");
        v.className = "t-value";
        v.innerHTML = getLang() === "en" ? "<b>EN</b> / FIL" : "EN / <b>FIL</b>";
        btn.appendChild(v);
      }

      // Iwas focus para hindi mag-double trigger ang Space/Enter
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
    void el.offsetWidth; // i-restart ang animation
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
      if (item.toggle || item.lang) {
        this.change(item);
        return;
      }
      if (Sound.playSelectConfirm) Sound.playSelectConfirm();
      if (item.id === "export") this.onExportSave();
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
    } else if (item.id === "chronicles") {
      this.openChronicles();
    } else if (item.id === "options") {
      this.goTo("options", "music");
    } else if (item.id === "credits") {
      this.goTo("credits");
    }
  }

  // Toggle ng setting o wika (Enter o ← →)
  change(item) {
    if (Sound.playSelectMove) Sound.playSelectMove();
    if (item.lang) {
      toggleLang(); // tinatawag ng onLangChange ang render()
      return;
    }
    const key = item.toggle;
    this.config[key] = !this.config[key];
    try {
      localStorage.setItem("vanguard_config", JSON.stringify(this.config));
    } catch (_) {}

    if (key === "music") {
      Sound.musicEnabled = Boolean(this.config.music);
      if (this.config.music) Sound.startTitleBGM();
      else Sound.stopTitleBGM();
    } else if (key === "sfx") {
      Sound.sfxEnabled = Boolean(this.config.sfx);
    }
    this.renderMenu();
  }

  // ---------- CREDITS ----------
  // Ang gumawa ng laro, ang kuwento, ang teknolohiya at ang mga inspirasyon
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
    ["Ragnarok Online", "Diablo II", t("credIsekai")].forEach((name) => {
      const li = document.createElement("li");
      li.textContent = name;
      ins.appendChild(li);
    });

    add("h4", "", t("credLang"));
    add("p", "cr-role", "English · Filipino");

    add("p", "cr-thanks", t("credThanks"));
  }

  // ---------- CHRONICLES ----------
  async openChronicles() {
    this.step = "chronicles";
    this.render();
    this.chapters = parseChapters(await loadLore(getLang()));
    if (this.step === "chronicles") this.renderChronicles();
  }

  closeChronicles() {
    if (Sound.playSelectMove) Sound.playSelectMove();
    this.goTo("menu", "chronicles");
  }

  setChapter(i) {
    if (!this.chapters || !this.chapters.length) return;
    const n = this.chapters.length;
    const next = (i + n) % n;
    if (next === this.chapter) return;
    this.chapter = next;
    if (Sound.playSelectMove) Sound.playSelectMove();
    this.renderChronicles();
    this.chronBody.scrollTop = 0;
  }

  renderChronicles() {
    this.root.querySelector("#chronTitle").textContent = t("chroniclesTitle");
    this.root.querySelector("#chronNote").textContent = t("loreNote");
    if (!this.chapters) return;

    this.chronTabs.innerHTML = "";
    this.chapters.forEach((ch, i) => {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "c-tab" + (i === this.chapter ? " on" : "");
      tab.textContent = ch.tab;
      tab.addEventListener("mousedown", (e) => e.preventDefault());
      tab.addEventListener("click", () => this.setChapter(i));
      this.chronTabs.appendChild(tab);
    });

    const ch = this.chapters[this.chapter];
    this.chronBody.innerHTML = "";
    if (!ch) return;
    // Larawan ng Act (assets/banner/act-N.*); sinusubukan ang ibang extension, itinatago kapag wala
    const act = actNumber(ch.tab);
    if (act) {
      const fig = document.createElement("figure");
      fig.className = "c-banner";
      const img = document.createElement("img");
      img.alt = ch.title;
      let ext = 0;
      img.addEventListener("error", () => {
        ext++;
        if (ext < BANNER_EXTS.length) img.src = bannerSrc(act, ext);
        else fig.remove();
      });
      img.src = bannerSrc(act, 0);
      fig.appendChild(img);
      this.chronBody.appendChild(fig);
    }
    const h = document.createElement("h3");
    h.textContent = ch.title;
    this.chronBody.appendChild(h);
    ch.paragraphs.forEach((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      this.chronBody.appendChild(p);
    });
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

    if (this.step === "chronicles") {
      if (left) this.setChapter(this.chapter - 1);
      else if (right) this.setChapter(this.chapter + 1);
      else if (up) this.chronBody.scrollBy({ top: -80, behavior: "smooth" });
      else if (down) this.chronBody.scrollBy({ top: 80, behavior: "smooth" });
      else if (back) this.closeChronicles();
      return;
    }

    if (up) this.setIndex(this.nextEnabled(this.index, -1));
    else if (down) this.setIndex(this.nextEnabled(this.index, 1));
    else if (ok && !e.repeat) this.confirm();
    else if ((left || right) && this.step === "options") {
      const item = this.items[this.index];
      if (item.toggle || item.lang) this.change(item);
    } else if (back && this.step === "options") {
      if (Sound.playSelectMove) Sound.playSelectMove();
      this.goTo("menu", "options");
    }
  }

  // ---------- EMBERS (canvas) ----------
  // Low-res canvas na naka-scale ng FX_PIXEL para chunky ang baga, bagay sa pixel art.
  draw() {
    this.tick++;
    const W = Math.ceil(window.innerWidth / FX_PIXEL);
    const H = Math.ceil(window.innerHeight / FX_PIXEL);
    if (this.fx.width !== W || this.fx.height !== H) {
      this.fx.width = W;
      this.fx.height = H;
    }
    const ctx = this.fxCtx;
    ctx.clearRect(0, 0, W, H);

    // Parehong "cover" fit ng CSS background, para tumapat sa espada
    const iw = this.bg.naturalWidth || 1024;
    const ih = this.bg.naturalHeight || 571;
    const s = Math.max(W / iw, H / ih);
    const k = (ih * s) / 270;   // sukat kumpara sa lumang 480x270 na title
    const sx = (W - iw * s) / 2 + iw * s * SWORD.x;
    const sy = (H - ih * s) / 2 + ih * s * SWORD.y;

    // Pumipintig na liwanag
    const pulse = 1 + Math.sin(this.tick / 16) * 0.12;
    const r = 60 * k * pulse;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, r);
    glow.addColorStop(0, "rgba(255, 170, 70, 0.30)");
    glow.addColorStop(0.5, "rgba(56, 160, 248, 0.10)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
    ctx.restore();

    // Lumilipad na baga
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
    this.particles = this.particles.filter((p) => p.life > 0);
    this.particles.forEach((p) => {
      p.x += p.vx + Math.sin((p.y + this.tick) / 14) * 0.08 * k;
      p.y += p.vy;
      p.life--;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }
}
