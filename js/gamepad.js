import { t } from "./i18n.js";

// ==================== GAMEPAD (DS4 / DualSense / Joy-Con / Xbox, wired or Bluetooth) ====================
// The pad never talks to the game directly: each button press becomes the keyboard event the game
// already handles (window keydown/keyup with the same e.code), so every scene and menu works unchanged.
// Gameplay uses the player's bindings (vanguard_pad, editable in the Controller guide); menus use a
// fixed layout (stick/D-pad = arrows, south = Enter, east = Esc). The guide opens on the first
// connection, from the corner badge, or with the pad's Select / Share / − button.

const PAD_KEY = "vanguard_pad";
const DEAD = 0.45;            // stick dead zone
const REPEAT_DELAY = 22;      // menu auto-repeat (frames at 60 Hz)
const REPEAT_RATE = 7;

// Gameplay actions → keyboard code they send, with the default button (standard mapping index)
export const PAD_ACTIONS = [
  { id: "attack",    code: "KeyJ",   def: 0 },
  { id: "skill",     code: "KeyK",   def: 2 },
  { id: "skill3",    code: "KeyL",   def: 3 },
  { id: "interact",  code: "KeyE",   def: 1 },
  { id: "sprint",    code: "Space",  def: 5 },
  { id: "inventory", code: "KeyI",   def: 4 },
  { id: "map",       code: "KeyM",   def: 6 },
  { id: "quest",     code: "KeyQ",   def: 7 },
  { id: "character", code: "KeyC",   def: 11 },
  { id: "pause",     code: "Escape", def: 9 },
  { id: "partyNext", code: null,     def: 10 },   // next party member on the field (main.js onPad.partyNext)
  { id: "fullscreen", code: null,    def: 17 },   // full screen (main.js onPad.fullscreen; the browser may refuse it from a pad)
  { id: "guide",     code: null,     def: 8 }
];
const DPAD = { 12: "ArrowUp", 13: "ArrowDown", 14: "ArrowLeft", 15: "ArrowRight" };

// Button names per family (standard mapping indices 0–17)
const NAMES = {
  ps:       ["✕", "○", "□", "△", "L1", "R1", "L2", "R2", "Share", "Options", "L3", "R3", "D-pad ↑", "D-pad ↓", "D-pad ←", "D-pad →", "PS", "Touchpad"],
  nintendo: ["B", "A", "Y", "X", "L", "R", "ZL", "ZR", "−", "+", "L-Stick", "R-Stick", "D-pad ↑", "D-pad ↓", "D-pad ←", "D-pad →", "Home", "Capture"],
  xbox:     ["A", "B", "X", "Y", "LB", "RB", "LT", "RT", "View", "Menu", "LS", "RS", "D-pad ↑", "D-pad ↓", "D-pad ←", "D-pad →", "Guide", "Share"]
};

function family(id) {
  const s = (id || "").toLowerCase();
  if (/054c|dualshock|dualsense|wireless controller|playstation/.test(s)) return "ps";
  if (/057e|joy-con|pro controller|nintendo/.test(s)) return "nintendo";
  return "xbox";
}
function prettyName(id) {
  const f = family(id), s = (id || "").toLowerCase();
  if (f === "ps") return /dualsense|0ce6/.test(s) ? "DualSense" : "DualShock 4";
  if (f === "nintendo") return /pro controller/.test(s) ? "Switch Pro Controller" : "Joy-Con";
  return (id || "Gamepad").replace(/\s*\(.*$/, "").slice(0, 40) || "Gamepad";
}

function defaults() { return Object.fromEntries(PAD_ACTIONS.map((a) => [a.id, a.def])); }
function loadBinds() {
  const out = defaults();
  try {
    const raw = JSON.parse(localStorage.getItem(PAD_KEY) || "null");
    if (raw && raw.binds) for (const a of PAD_ACTIONS) {
      const v = raw.binds[a.id];
      if (Number.isInteger(v) && v >= 0 && v < 32) out[a.id] = v;
    }
    return { binds: out, seen: Boolean(raw && raw.seen) };
  } catch (_) { return { binds: out, seen: false }; }
}

function send(type, code, opts = {}) {
  window.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true, cancelable: true, ...opts }));
}
function tap(code, opts) { send("keydown", code, opts); send("keyup", code, opts); }

export class GamepadInput {
  // isGameplay(): true while the hero is free to move (no menu or overlay open), supplied by main.js
  // canInteract(): true while something can be talked to / used (NPC, ore, boat): then A talks instead of attacking
  constructor(isGameplay = () => false, canInteract = () => false) {
    this.isGameplay = isGameplay;
    this.canInteract = canInteract;
    this.locked = new Set();     // buttons held across a menu ↔ gameplay switch: ignored until released
    this.wasGameplay = false;
    this.talkHold = false;       // A is held after it was used to talk (so it doesn't also attack)
    const saved = loadBinds();
    this.binds = saved.binds;
    this.seen = saved.seen;
    this.index = null;          // active pad
    this.prev = [];             // last frame's button states
    this.held = new Map();      // code → true while we hold a synthetic key down
    this.repeat = {};           // menu direction repeat timers
    this.listening = null;      // action id waiting for a button (rebinding)
    this.onPad = {};            // action id → handler for actions that aren't a keyboard key (partyNext, fullscreen)
    this.buildUi();

    window.addEventListener("gamepadconnected", (e) => this.connect(e.gamepad));
    window.addEventListener("gamepaddisconnected", (e) => {
      if (e.gamepad.index !== this.index) return;
      this.releaseAll();
      this.index = null;
      this.toast(t("padLost"), false);
      this.refresh();
    });
    // While the guide is open the pad and keyboard drive only the guide
    window.addEventListener("keydown", (e) => {
      if (!this.open) return;
      e.stopImmediatePropagation();
      if (e.code === "Escape" && !this.listening) this.close();
    }, true);
    const loop = () => { this.poll(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  connect(gp) {
    if (this.index !== null && navigator.getGamepads()[this.index]) return;
    this.index = gp.index;
    this.prev = gp.buttons.map((b) => b.pressed);
    this.toast(`${t("padConnected")}: ${prettyName(gp.id)}`, true);
    if (!this.seen) { this.seen = true; this.save(); this.show(); }
    this.refresh();
  }

  pad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (this.index === null) {   // some browsers only report a pad after a button press
      for (const p of pads) if (p && p.connected) { this.connect(p); break; }
    }
    return this.index === null ? null : pads[this.index];
  }

  name(btn) {
    const gp = this.pad();
    const n = NAMES[family(gp && gp.id)][btn];
    return n || `#${btn}`;
  }

  save() {
    try { localStorage.setItem(PAD_KEY, JSON.stringify({ binds: this.binds, seen: this.seen })); } catch (_) { /* not saved */ }
  }

  press(code) { if (!this.held.get(code)) { this.held.set(code, true); send("keydown", code); } }
  release(code) { if (this.held.get(code)) { this.held.delete(code); send("keyup", code); } }
  releaseAll() { for (const code of [...this.held.keys()]) this.release(code); }

  // Stick (or a single Joy-Con's hat axis) and D-pad as one direction set
  directions(gp, btn) {
    const ax = gp.axes, d = { ArrowUp: btn[12], ArrowDown: btn[13], ArrowLeft: btn[14], ArrowRight: btn[15] };
    const x = ax[0] || 0, y = ax[1] || 0;
    if (y < -DEAD) d.ArrowUp = true;
    if (y > DEAD) d.ArrowDown = true;
    if (x < -DEAD) d.ArrowLeft = true;
    if (x > DEAD) d.ArrowRight = true;
    if (gp.mapping !== "standard" && ax.length > 9 && Math.abs(ax[9]) <= 1) {   // POV hat: −1 up … clockwise
      const h = Math.round((ax[9] + 1) * 3.5);
      if ([7, 0, 1].includes(h)) d.ArrowUp = true;
      if ([1, 2, 3].includes(h)) d.ArrowRight = true;
      if ([3, 4, 5].includes(h)) d.ArrowDown = true;
      if ([5, 6, 7].includes(h)) d.ArrowLeft = true;
    }
    return d;
  }

  poll() {
    const gp = this.pad();
    if (!gp) return;
    const btn = gp.buttons.map((b) => b.pressed || b.value > 0.5);
    const down = (i) => btn[i] && !this.prev[i];
    this.highlight(btn);

    if (this.listening) {           // rebinding: the first new button (not a D-pad) becomes the binding
      const i = btn.findIndex((b, k) => b && !this.prev[k] && !DPAD[k]);
      if (i >= 0) { this.binds[this.listening] = i; this.listening = null; this.save(); this.refresh(); }
      this.prev = btn;
      return;
    }

    if (down(this.binds.guide)) { this.open ? this.close() : this.show(); this.prev = btn; return; }
    if (!this.open && down(this.binds.fullscreen) && this.onPad.fullscreen) { this.onPad.fullscreen(); this.prev = btn; return; }

    if (this.open) {                // guide navigation
      if (down(1) || down(9)) this.close();
      else if (down(0)) this.activate();
      else {
        const d = this.directions(gp, btn);
        if (this.step("up", d.ArrowUp)) this.moveFocus(-1);
        if (this.step("down", d.ArrowDown)) this.moveFocus(1);
      }
      this.prev = btn;
      return;
    }

    const dirs = this.directions(gp, btn);
    const gameplay = this.isGameplay();
    if (gameplay !== this.wasGameplay) {
      // switching between a menu and the field: buttons still held (e.g. the A that closed a dialogue)
      // must be released first, so they don't attack or re-open the NPC
      this.releaseAll();
      this.locked = new Set(btn.map((b, i) => (b ? i : -1)).filter((i) => i >= 0));
      this.wasGameplay = gameplay;
      this.talkHold = false;
    }
    for (const i of [...this.locked]) if (!btn[i]) this.locked.delete(i);
    const on = (i) => btn[i] && !this.locked.has(i);
    const tapDown = (i) => down(i) && !this.locked.has(i);

    if (gameplay) {
      // A (attack) talks / uses instead when an NPC, ore vein or boat is in reach
      const atk = this.binds.attack;
      if (tapDown(atk) && this.canInteract()) { this.talkHold = true; tap("KeyE"); }
      if (!btn[atk]) this.talkHold = false;
      if (tapDown(this.binds.partyNext) && this.onPad.partyNext) this.onPad.partyNext();
      // held keys: directions and every bound action
      for (const [code, v] of Object.entries(dirs)) v ? this.press(code) : this.release(code);
      for (const a of PAD_ACTIONS) {
        if (!a.code) continue;
        const held = on(this.binds[a.id]) && !(a.id === "attack" && this.talkHold);
        held ? this.press(a.code) : this.release(a.code);
      }
    } else {
      // menus: taps with auto-repeat, A = Enter, B = Esc, X = Space, Y = Shift+Enter (max), RB = next tab
      this.releaseAll();
      for (const [code, v] of Object.entries(dirs)) if (this.step(code, v)) tap(code);
      if (tapDown(0)) tap("Enter");
      if (tapDown(1) || tapDown(this.binds.pause)) tap("Escape");
      if (tapDown(2)) tap("Space");
      if (tapDown(3)) tap("Enter", { shiftKey: true });
      if (tapDown(5)) tap("Tab");
      // the same button that opened a panel closes it again
      for (const id of ["inventory", "map", "quest", "character"]) {
        const a = PAD_ACTIONS.find((x) => x.id === id);
        const b = this.binds[id];
        if (tapDown(b) && ![0, 1, 2, 3, 5].includes(b)) tap(a.code);
      }
    }
    this.prev = btn;
  }

  // true on the first frame a direction is held, then every REPEAT_RATE frames after REPEAT_DELAY
  step(key, on) {
    if (!on) { this.repeat[key] = 0; return false; }
    const n = (this.repeat[key] || 0) + 1;
    this.repeat[key] = n;
    return n === 1 || (n > REPEAT_DELAY && (n - REPEAT_DELAY) % REPEAT_RATE === 0);
  }

  // ---------- UI: corner badge, toast, guide modal ----------
  buildUi() {
    const el = (tag, cls, parent) => { const n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; };
    this.badge = el("button", "pad-badge", document.body);
    this.badge.type = "button";
    this.badge.addEventListener("click", () => this.show());
    this.toastEl = el("div", "pad-toast", document.body);

    this.modal = el("div", "pad-modal", document.body);
    this.modal.setAttribute("role", "dialog");
    this.modal.hidden = true;
    const box = el("div", "pad-box", this.modal);
    this.titleEl = el("h2", "", box);
    this.statusEl = el("div", "pad-status", box);
    this.stepsEl = el("ol", "pad-steps", box);
    this.listEl = el("div", "pad-binds", box);
    const foot = el("div", "pad-foot", box);
    this.resetBtn = el("button", "pad-btn", foot);
    this.closeBtn = el("button", "pad-btn primary", foot);
    this.resetBtn.addEventListener("click", () => { this.binds = defaults(); this.listening = null; this.save(); this.refresh(); });
    this.closeBtn.addEventListener("click", () => this.close());
    this.modal.addEventListener("click", (e) => { if (e.target === this.modal) this.close(); });
    this.refresh();
  }

  toast(text, ok) {
    this.toastEl.textContent = text;
    this.toastEl.classList.toggle("bad", !ok);
    this.toastEl.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove("show"), 3200);
  }

  show() { this.releaseAll(); this.open = true; this.modal.hidden = false; this.focus = 0; this.refresh(); }
  close() { this.open = false; this.listening = null; this.modal.hidden = true; }

  focusables() { return [...this.modal.querySelectorAll("button")]; }
  moveFocus(d) {
    const f = this.focusables();
    this.focus = ((this.focus || 0) + d + f.length) % f.length;
    f[this.focus].focus();
  }
  activate() { const f = this.focusables()[this.focus || 0]; if (f) f.click(); }

  highlight(btn) {
    if (!this.open) return;
    for (const row of this.listEl.children) row.classList.toggle("lit", Boolean(btn[Number(row.dataset.btn)]));
  }

  refresh() {
    const gp = this.index === null ? null : (navigator.getGamepads() || [])[this.index];
    this.badge.textContent = gp ? `🎮 ${prettyName(gp.id)}` : "🎮";
    this.badge.classList.toggle("on", Boolean(gp));
    this.badge.title = t("padGuide");
    if (!this.modal) return;
    this.titleEl.textContent = t("padGuide");
    this.statusEl.textContent = gp ? `● ${t("padConnected")}: ${prettyName(gp.id)}` : `○ ${t("padWaiting")}`;
    this.statusEl.classList.toggle("on", Boolean(gp));
    this.stepsEl.replaceChildren(...["padStep1", "padStep2", "padStep3", "padStep4"].map((k) => {
      const li = document.createElement("li"); li.textContent = t(k); return li;
    }));
    this.listEl.replaceChildren(...PAD_ACTIONS.map((a) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "pad-row" + (this.listening === a.id ? " wait" : "");
      row.dataset.btn = this.binds[a.id];
      const l = document.createElement("span"); l.textContent = t(`padAct_${a.id}`);
      const r = document.createElement("b"); r.textContent = this.listening === a.id ? t("padPress") : this.name(this.binds[a.id]);
      row.append(l, r);
      row.addEventListener("click", () => { this.listening = a.id; this.refresh(); });
      return row;
    }));
    this.resetBtn.textContent = t("padReset");
    this.closeBtn.textContent = t("padClose");
  }
}
