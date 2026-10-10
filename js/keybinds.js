// ==================== KEYBOARD BINDINGS (vanguard_keys) ====================
// The rebindable keyboard controls: switching the party member on the field and full screen.
// A binding is a KeyboardEvent.code, optionally with "Shift+" in front ("Shift+Digit1").
// Edited in Settings (O) → Controls and on the title screen's Controls page; the gamepad's own
// bindings live in js/gamepad.js (vanguard_pad).

const KEYS_KEY = "vanguard_keys";

export const KEY_ACTIONS = [
  { id: "partyNext",  def: "KeyV" },
  { id: "party1",     def: "Shift+Digit1" },
  { id: "party2",     def: "Shift+Digit2" },
  { id: "party3",     def: "Shift+Digit3" },
  { id: "party4",     def: "Shift+Digit4" },
  { id: "party5",     def: "Shift+Digit5" },
  { id: "party6",     def: "Shift+Digit6" },
  { id: "fullscreen", def: "KeyF" }
];
const DEF = Object.fromEntries(KEY_ACTIONS.map((a) => [a.id, a.def]));
// Keys the game already uses for something fixed (movement, skills, menus) can't be taken
const RESERVED = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyJ", "KeyK", "KeyL",
  "KeyE", "KeyQ", "KeyI", "KeyC", "KeyM", "KeyN", "KeyO", "KeyG", "KeyH", "KeyB", "KeyP", "KeyT", "KeyY", "KeyU", "Space", "Escape",
  "KeyZ", "KeyR", "KeyX", "Enter", "Tab", "Digit1", "Digit2", "Digit3", "Digit4", "ShiftLeft", "ShiftRight", "F2", "F3"]);
const VALID = /^(Shift\+)?(Key[A-Z]|Digit[0-9]|F([1-9]|1[0-2])|Numpad[0-9]|Backquote|Minus|Equal|BracketLeft|BracketRight|Semicolon|Quote|Comma|Period|Slash|Backslash)$/;

let binds = load();
const listeners = [];

function load() {
  const out = { ...DEF };
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS_KEY) || "null");
    if (raw && typeof raw === "object") for (const a of KEY_ACTIONS) if (typeof raw[a.id] === "string" && VALID.test(raw[a.id])) out[a.id] = raw[a.id];
  } catch (_) { /* defaults */ }
  return out;
}
function save() {
  try { localStorage.setItem(KEYS_KEY, JSON.stringify(binds)); } catch (_) { /* not saved */ }
  listeners.forEach((fn) => fn());
}

export const Keybinds = {
  get: (id) => binds[id],
  // Does this keydown trigger the action?
  matches(id, e) {
    const b = binds[id];
    if (!b) return false;
    const shift = b.startsWith("Shift+"), code = shift ? b.slice(6) : b;
    return e.code === code && Boolean(e.shiftKey) === shift;
  },
  // Which action (if any) a keydown triggers
  actionOf(e) { return KEY_ACTIONS.find((a) => this.matches(a.id, e))?.id || null; },
  // Bind from a keydown: "ok", "wait" (a lone modifier: keep listening) or "taken" (a key the game
  // already uses for something fixed, or not a key that can be bound; the binding stays)
  bindFrom(id, e) {
    if (!DEF[id]) return "taken";
    if (/^(Shift|Control|Alt|Meta)/.test(e.code)) return "wait";
    const combo = (e.shiftKey ? "Shift+" : "") + e.code;
    if ((!e.shiftKey && RESERVED.has(e.code)) || !VALID.test(combo)) return "taken";
    // A key moves: whatever held it before swaps to this action's old key
    const other = KEY_ACTIONS.find((a) => a.id !== id && binds[a.id] === combo);
    if (other) binds[other.id] = binds[id];
    binds[id] = combo;
    save();
    return "ok";
  },
  reset() { binds = { ...DEF }; save(); },
  onChange(fn) { listeners.push(fn); },
  // "V", "⇧1", "F"
  label(id) {
    const b = binds[id] || "";
    const shift = b.startsWith("Shift+"), code = shift ? b.slice(6) : b;
    const key = code.replace(/^Key|^Digit|^Numpad/, "").replace("Backquote", "`").replace("Minus", "-").replace("Equal", "=")
      .replace("BracketLeft", "[").replace("BracketRight", "]").replace("Semicolon", ";").replace("Quote", "'").replace("Comma", ",")
      .replace("Period", ".").replace("Slash", "/").replace("Backslash", "\\");
    return (shift ? "⇧" : "") + key;
  }
};
