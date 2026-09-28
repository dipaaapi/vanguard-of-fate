import { Sound } from "./audio.js";
import { t, onLangChange } from "./i18n.js";
import { Avatar, FRAME_W, FRAME_H, DIRS } from "./avatar/avatar.js";
import { FIELDS, DEFAULT_CONFIG, randomConfig, randomName } from "./avatar/options.js";

// ==================== CHARACTER CREATOR ====================
// Dito nililikha ang Novice bago ang summoning: katawan, balat, mata, buhok,
// kasuotan, kamay, binti at paa — bawat isa ay hiwalay na bahagi ng Avatar.
// Ang class (Knight, Mage, …) ay pinipili na lang sa Job Awakening (Lv 10).

const PREVIEW_SCALE = 3;  // internal na resolution ng malaking preview (pinapalaki pa ng CSS)

// Pose ng preview (V / button): tayo → lakad → takbo
const POSES = [
  { anim: "idle", ticks: 32, icon: "◉", key: "crIdle" },
  { anim: "walk", ticks: 9, icon: "🚶", key: "crWalk" },
  { anim: "run", ticks: 5, icon: "🏃", key: "crRun" }
];
const DIR_LABELS = ["crFront", "crRight", "crBackView", "crLeft"];

export class CreatorScene {
  constructor(rootEl, onBegin, onBack) {
    this.root = rootEl;
    this.onBegin = onBegin;
    this.onBack = onBack;

    this.rowsEl = rootEl.querySelector("#crRows");
    this.nameEl = rootEl.querySelector("#crName");
    this.summonerEl = rootEl.querySelector("#crSummoner");
    this.hintEl = rootEl.querySelector("#crHint");

    this.preview = rootEl.querySelector("#crPreview");
    this.preview.width = FRAME_W * PREVIEW_SCALE;
    this.preview.height = FRAME_H * PREVIEW_SCALE;
    this.pctx = this.preview.getContext("2d");
    this.trio = Array.from(rootEl.querySelectorAll(".cr-trio canvas"));
    this.trio.forEach((c) => { c.width = FRAME_W; c.height = FRAME_H; });

    this.config = { ...DEFAULT_CONFIG };
    this.avatar = new Avatar(this.config);
    this.row = 0;
    this.dir = 0;          // 0 harap, 1 kanan, 2 likod, 3 kaliwa
    this.dialDeg = 0;      // naiipong anggulo ng karayom ng dial (para laging maikling ikot)
    this.pose = 1;         // index sa POSES (lakad bilang default)
    this.tick = 0;

    this.bindDom();
    onLangChange(() => this.render());
  }

  // Tinatawag tuwing papasok sa creator (bagong expedition)
  reset() {
    this.config = { ...DEFAULT_CONFIG };
    this.nameEl.value = "";
    this.row = 0;
    this.dir = 0;
    this.dialDeg = 0;
    this.rebuild();
  }

  rebuild() {
    this.avatar = new Avatar(this.config);
    this.render();
  }

  // ---------- DOM ----------
  bindDom() {
    const btn = (sel, fn) => {
      const el = this.root.querySelector(sel);
      el.addEventListener("mousedown", (e) => e.preventDefault());
      el.addEventListener("click", () => { Sound.init(); fn(); });
    };
    btn("#crHome", () => this.back());
    btn("#crFull", () => this.toggleFullscreen());
    btn("#crRandom", () => this.randomize());
    document.addEventListener("fullscreenchange", () => this.renderUtil());
    this.bindDial();
    btn("#crBegin", () => this.begin());

    // Tray: Tayo / Lakad / Takbo bilang magkakatabing pindutan
    const poses = this.root.querySelector("#crPoses");
    POSES.forEach((pose, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.dataset.pose = String(i);
      b.innerHTML = `<b>${pose.icon}</b><span></span>`;
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("click", () => { Sound.init(); this.setPose(i); });
      poses.appendChild(b);
    });

    // Enter/Esc sa name field: tapusin ang pag-type
    this.nameEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); this.nameEl.blur(); }
      e.stopPropagation();
    });
  }

  render() {
    this.root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    this.nameEl.placeholder = t("crNamePh");
    this.hintEl.innerHTML = t("crHint");
    this.renderUtil();
    this.summonerEl.textContent = t("summonedBy", this.config.body === "female" ? t("prince") : t("princess"));
    this.renderRows();
    this.drawTrio();
  }

  renderRows() {
    this.rowsEl.innerHTML = "";
    let lastSection = "";

    FIELDS.forEach((field, i) => {
      if (field.section !== lastSection) {
        lastSection = field.section;
        const h = document.createElement("div");
        h.className = "cr-section";
        h.textContent = t(field.section);
        this.rowsEl.appendChild(h);
      }

      const row = document.createElement("div");
      row.className = "cr-row" + (i === this.row ? " selected" : "");
      row.addEventListener("mouseenter", () => this.setRow(i, false));

      const label = document.createElement("span");
      label.className = "cr-label";
      label.textContent = t(`cr_${field.key}`);
      row.appendChild(label);

      const value = this.config[field.key];
      if (field.type === "cycle") {
        const ctl = document.createElement("div");
        ctl.className = "cr-cycle";
        const prev = document.createElement("button");
        prev.type = "button";
        prev.textContent = "◀";
        const val = document.createElement("span");
        val.textContent = t(`opt_${value}`);
        const next = document.createElement("button");
        next.type = "button";
        next.textContent = "▶";
        [prev, next].forEach((b, k) => {
          b.addEventListener("mousedown", (e) => e.preventDefault());
          b.addEventListener("click", () => { Sound.init(); this.setRow(i, false); this.change(k ? 1 : -1); });
        });
        ctl.append(prev, val, next);
        row.appendChild(ctl);
      } else {
        const sw = document.createElement("div");
        sw.className = "cr-swatches";
        field.options.forEach((col) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "cr-swatch" + (col === value ? " on" : "");
          b.style.background = col;
          b.title = col;
          b.addEventListener("mousedown", (e) => e.preventDefault());
          b.addEventListener("click", () => { Sound.init(); this.setRow(i, false); this.set(field.key, col); });
          sw.appendChild(b);
        });
        row.appendChild(sw);
      }
      this.rowsEl.appendChild(row);
    });
  }

  setRow(i, playSound = true) {
    if (i === this.row) return;
    this.row = i;
    if (playSound && Sound.playSelectMove) Sound.playSelectMove();
    Array.from(this.rowsEl.querySelectorAll(".cr-row")).forEach((el, k) => el.classList.toggle("selected", k === i));
    const el = this.rowsEl.querySelectorAll(".cr-row")[i];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }

  // ---------- ACTIONS ----------
  set(key, value) {
    if (this.config[key] === value) return;
    this.config = { ...this.config, [key]: value };
    if (Sound.playSelectMove) Sound.playSelectMove();
    this.rebuild();
  }

  change(dir) {
    const field = FIELDS[this.row];
    const opts = field.options;
    const i = opts.indexOf(this.config[field.key]);
    this.set(field.key, opts[(i + dir + opts.length) % opts.length]);
  }

  rotate(d) {
    this.setDir(this.dir + d);   // down → side(kanan) → up → side(kaliwa)
  }

  setDir(i) {
    const next = ((i % 4) + 4) % 4;
    if (next === this.dir) return;
    // Pinakamaikling ikot ng karayom: -1, +1 o 2 hakbang
    let step = next - this.dir;
    if (step > 2) step -= 4;
    if (step < -1) step += 4;
    this.dir = next;
    this.dialDeg -= step * 90;
    if (Sound.playSelectMove) Sound.playSelectMove();
    this.renderUtil();
  }

  setPose(i) {
    this.pose = i;
    this.tick = 0;
    if (Sound.playSelectMove) Sound.playSelectMove();
    this.renderUtil();
  }

  cyclePose() {
    this.setPose((this.pose + 1) % POSES.length);
  }

  toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  }

  // Dial: i-click o i-drag; ang anggulo mula sa gitna ang pumipili ng direksyon
  // (ibaba = harap, kanan = kanan, itaas = likod, kaliwa = kaliwa). Scroll = iikot din.
  bindDial() {
    const dial = this.root.querySelector("#crDial");
    const pick = (e) => {
      const r = dial.getBoundingClientRect();
      const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
      this.setDir(Math.round((90 - a) / 90));
    };
    dial.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      Sound.init();
      dial.setPointerCapture(e.pointerId);
      dial.classList.add("dragging");
      pick(e);
    });
    dial.addEventListener("pointermove", (e) => { if (dial.classList.contains("dragging")) pick(e); });
    ["pointerup", "pointercancel"].forEach((ev) => dial.addEventListener(ev, () => dial.classList.remove("dragging")));
    dial.addEventListener("wheel", (e) => { e.preventDefault(); this.rotate(e.deltaY > 0 ? 1 : -1); }, { passive: false });
  }

  renderUtil() {
    const $ = (id) => this.root.querySelector(id);
    this.root.querySelectorAll("#crPoses [data-pose]").forEach((b) => {
      const i = Number(b.dataset.pose);
      b.querySelector("span").textContent = t(POSES[i].key);
      b.classList.toggle("on", i === this.pose);
      b.setAttribute("aria-checked", String(i === this.pose));
    });
    const full = Boolean(document.fullscreenElement);
    $("#crFullIcon").textContent = full ? "🗗" : "⛶";
    $("#crFullLabel").textContent = full ? t("crRestore") : t("crFull");
    $("#crDialNeedle").style.setProperty("--a", `${this.dialDeg}deg`);
    const dialLabel = t(DIR_LABELS[this.dir]);
    $("#crDialLabel").textContent = dialLabel;
    const dialEl = $("#crDial");
    if (dialEl) {
      dialEl.setAttribute("aria-valuenow", String(this.dir));
      dialEl.setAttribute("aria-valuetext", dialLabel);
    }
  }

  randomize() {
    this.config = randomConfig();
    this.nameEl.value = randomName(this.config.body);
    if (Sound.playSelectConfirm) Sound.playSelectConfirm();
    this.rebuild();
  }

  back() {
    if (Sound.playSelectMove) Sound.playSelectMove();
    this.onBack();
  }

  begin() {
    if (Sound.playSelectConfirm) Sound.playSelectConfirm();
    const name = this.nameEl.value.trim().slice(0, 12);
    this.onBegin({ ...this.config }, name);
  }

  handleInput(e) {
    if (e.target === this.nameEl) return;
    const c = e.code;
    if (c === "ArrowUp" || c === "KeyW") { e.preventDefault(); this.setRow((this.row - 1 + FIELDS.length) % FIELDS.length); }
    else if (c === "ArrowDown" || c === "KeyS") { e.preventDefault(); this.setRow((this.row + 1) % FIELDS.length); }
    else if (c === "ArrowLeft" || c === "KeyA") this.change(-1);
    else if (c === "ArrowRight" || c === "KeyD") this.change(1);
    else if (c === "KeyQ") this.rotate(-1);
    else if (c === "KeyE") this.rotate(1);
    else if (c === "KeyV" && !e.repeat) this.cyclePose();
    else if (c === "KeyF" && !e.repeat) this.toggleFullscreen();
    else if (c === "KeyR" && !e.repeat) this.randomize();
    else if (c === "Enter" && !e.repeat) this.begin();
    else if (c === "Escape") this.back();
  }

  // ---------- PREVIEW ----------
  view() {
    // 0: harap, 1: kanan, 2: likod, 3: kaliwa
    return [["down", false], ["side", false], ["up", false], ["side", true]][this.dir];
  }

  drawTrio() {
    this.trio.forEach((cv, k) => {
      const ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(this.avatar.frame(DIRS[k], "idle", 0), 0, 0);
    });
  }

  // Tinatawag bawat frame ng game loop habang nasa CREATE
  draw() {
    this.tick++;
    const [dir, flip] = this.view();
    const pose = POSES[this.pose];
    const anim = pose.anim;
    const frame = Math.floor(this.tick / pose.ticks);

    const ctx = this.pctx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.preview.width, this.preview.height);
    this.avatar.draw(ctx, 16 * PREVIEW_SCALE, 34 * PREVIEW_SCALE, dir, anim, frame, flip, false, PREVIEW_SCALE);
  }
}
