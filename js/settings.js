import { t, getLang, toggleLang } from "./i18n.js";

// ==================== SETTINGS (vanguard_config) ====================
// One list of settings shared by the title screen's Options and the in-game Settings panel (O).
// Each entry: toggle (ON/OFF) or choice (← → cycles through values). main.js applies the side effects
// (volume, canvas brightness, drawing scale) in applyConfig whenever one changes.

export const CONFIG_KEY = "vanguard_config";
const PCT = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const SETTINGS = [
  { id: "music",      toggle: true,  def: true,  group: "audio" },
  { id: "musicVol",   values: PCT,   def: 100,    group: "audio", pct: true },
  { id: "sfx",        toggle: true,  def: true,  group: "audio" },
  { id: "sfxVol",     values: PCT,   def: 100,    group: "audio", pct: true },
  { id: "quality",    values: ["sharp", "balanced", "fast"], def: "balanced", group: "video" },
  { id: "fpsCap",     values: [30, 60, 120, 0], def: 0, group: "video" },
  { id: "fps",        toggle: true,  def: false, group: "video" },
  { id: "brightness", values: [60, 70, 80, 90, 100, 110, 120, 130, 140], def: 100, group: "video", pct: true },
  { id: "shadows",    toggle: true,  def: true,  group: "video" },
  { id: "glow",       toggle: true,  def: true,  group: "video" },
  { id: "blood",      toggle: true,  def: true,  group: "game" },
  { id: "weather",    toggle: true,  def: true,  group: "game" }
];
const BY_ID = Object.fromEntries(SETTINGS.map((s) => [s.id, s]));

// Label and current value text of a setting (EN/FIL through t())
export function settingLabel(id) {
  return t(`set_${id}`);
}
export function settingValue(id, config) {
  const s = BY_ID[id], v = config[id];
  if (!s) return "";
  if (s.toggle) return v ? "ON" : "OFF";
  if (id === "quality") return t(`quality${v[0].toUpperCase()}${v.slice(1)}`);
  if (id === "fpsCap") return v ? `${v} FPS` : t("set_fpsMax");
  return s.pct ? `${v}%` : String(v);
}

// A config with every setting present and valid (old saves, hand-edited storage)
export function normalizeConfig(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = {};
  SETTINGS.forEach((s) => {
    const v = src[s.id];
    if (s.toggle) out[s.id] = v === undefined ? s.def : Boolean(v);
    else out[s.id] = s.values.includes(v) ? v : s.def;
  });
  return out;
}

export function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return normalizeConfig(JSON.parse(raw));
  } catch (_) { /* fall back to the defaults */ }
  return normalizeConfig(null);
}

export function saveConfig(config) {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); } catch (_) { /* not saved; that is fine */ }
}

// Toggle a setting, or step a choice by dir (±1). Percent settings (volume, brightness) stop at their
// ends when stepped with ← →; wrap = true (a click on the row) cycles round. Returns true when it changed.
export function stepSetting(config, id, dir = 1, wrap = false) {
  const s = BY_ID[id];
  if (!s) return false;
  if (s.toggle) config[id] = !config[id];
  else {
    const n = s.values.length, i = s.values.indexOf(config[id]) + (dir < 0 ? -1 : 1);
    const j = s.pct && !wrap ? Math.max(0, Math.min(n - 1, i)) : (i + n) % n;
    if (s.values[j] === config[id]) return false;
    config[id] = s.values[j];
  }
  saveConfig(config);
  return true;
}

// Drawing flags read by the world code every frame (Options → Shadows / Glow)
export const GFX = { shadows: true, glow: true };

// Soft additive light around a spell or light source (Options → Glow & Light). The halo is a
// cached sprite per colour and radius, so a glow costs one drawImage.
const halos = new Map();
export function glowAt(ctx, x, y, r, color, alpha = 0.5) {
  if (!GFX.glow || typeof document === "undefined") return;
  r = Math.max(2, Math.round(r));
  const key = `${color}|${r}`;
  let c = halos.get(key);
  if (!c) {
    c = document.createElement("canvas");
    c.width = c.height = r * 2;
    const g = c.getContext("2d");
    if (!g || !g.createRadialGradient) return;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, r * 2, r * 2);
    halos.set(key, c);
  }
  const op = ctx.globalCompositeOperation, a = ctx.globalAlpha;
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = a * alpha;
  ctx.drawImage(c, x - r, y - r);
  ctx.globalCompositeOperation = op;
  ctx.globalAlpha = a;
}

// Full screen on/off (F in game, the Codex scene's deck and the title's language menu)
export function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
}

// Esc closes the game's menus, so in full screen the page claims it (Keyboard Lock API, Chromium):
// a tap of Esc reaches the game and the browser's full screen stays on; holding Esc still exits.
// Other browsers keep their default (Esc leaves full screen).
if (typeof document !== "undefined") {
  document.addEventListener("fullscreenchange", () => {
    const kb = navigator.keyboard;
    if (!kb || !kb.lock) return;
    if (document.fullscreenElement) kb.lock(["Escape"]).catch(() => {});
    else kb.unlock();
  });
}

// ==================== IN-GAME SETTINGS PANEL (O) ====================
// HTML overlay in #viewport; rows grouped Audio / Video / Gameplay, plus language and full screen.
// onChange(id) is main.js's applyConfig.
export class SettingsPanel {
  constructor(root, config, onChange) {
    this.root = root;
    this.config = config;
    this.onChange = onChange;
    this.open = false;
    this.index = 0;
    this.rows = [];
    document.addEventListener("fullscreenchange", () => { if (this.open) this.render(); });
  }

  toggle() { if (this.open) this.close(); else this.show(); }
  show() { this.open = true; this.index = 0; this.root.classList.add("open"); this.render(); }
  close() { this.open = false; this.root.classList.remove("open"); }

  items() {
    const list = [];
    ["audio", "video", "game"].forEach((g) => {
      list.push({ head: t(`set_group_${g}`) });
      SETTINGS.filter((s) => s.group === g).forEach((s) => list.push({ id: s.id }));
    });
    list.push({ id: "lang" }, { id: "fullscreen" });
    return list;
  }

  change(id, dir, wrap = false) {
    if (id === "lang") { toggleLang(); this.render(); return; }
    if (id === "fullscreen") { toggleFullscreen(); return; }
    if (stepSetting(this.config, id, dir, wrap) && this.onChange) this.onChange(id);
    this.render();
  }

  render() {
    const r = this.root;
    r.textContent = "";
    const h = document.createElement("h3");
    h.textContent = t("set_title");
    r.appendChild(h);
    const list = document.createElement("div");
    list.className = "set-list";
    r.appendChild(list);
    this.rows = [];
    this.items().forEach((it) => {
      if (it.head) {
        const g = document.createElement("div");
        g.className = "set-head";
        g.textContent = it.head;
        list.appendChild(g);
        return;
      }
      const i = this.rows.length;
      const row = document.createElement("div");
      row.className = "set-row" + (i === this.index ? " sel" : "");
      const name = document.createElement("span");
      name.className = "set-name";
      const val = document.createElement("span");
      val.className = "set-val";
      if (it.id === "lang") {
        name.textContent = t("language");
        val.textContent = getLang() === "en" ? "English" : "Filipino";
      } else if (it.id === "fullscreen") {
        name.textContent = t("set_fullscreen");
        val.textContent = document.fullscreenElement ? "ON" : "OFF";
      } else {
        name.textContent = settingLabel(it.id);
        val.textContent = settingValue(it.id, this.config);
        if (BY_ID[it.id].toggle) val.classList.add(this.config[it.id] ? "on" : "off");
      }
      const arrow = (txt, dir) => {
        const b = document.createElement("button");
        b.type = "button";
        b.tabIndex = -1;
        b.className = "set-arrow";
        b.textContent = txt;
        b.addEventListener("mousedown", (e) => e.preventDefault());
        b.addEventListener("click", (e) => { e.stopPropagation(); this.index = i; this.change(it.id, dir); });
        return b;
      };
      row.append(name, arrow("◀", -1), val, arrow("▶", 1));
      row.addEventListener("mousedown", (e) => e.preventDefault());
      row.addEventListener("click", () => { this.index = i; this.change(it.id, 1, true); });
      list.appendChild(row);
      this.rows.push(it.id);
    });
    const hint = document.createElement("div");
    hint.className = "set-hint";
    hint.textContent = t("set_hint");
    r.appendChild(hint);
    const sel = list.querySelector(".set-row.sel");
    if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: "nearest" });
  }

  handleInput(e) {
    const n = this.rows.length;
    if (e.code === "KeyO" || e.code === "Escape") this.close();
    else if (e.code === "ArrowDown" || e.code === "KeyS") { this.index = (this.index + 1) % n; this.render(); }
    else if (e.code === "ArrowUp" || e.code === "KeyW") { this.index = (this.index - 1 + n) % n; this.render(); }
    else if (e.code === "ArrowLeft" || e.code === "KeyA") this.change(this.rows[this.index], -1);
    else if (e.code === "ArrowRight" || e.code === "KeyD" || e.code === "Enter" || e.code === "Space") this.change(this.rows[this.index], 1, e.code === "Enter" || e.code === "Space");
    e.preventDefault();
  }
}
