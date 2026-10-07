// ==================== PANEL NAVIGATION (arrows / D-pad + Enter) ====================
// Lets mouse-first HTML panels (Inventory, NPC refine / repair / temper, Character sheet) be used with
// the keyboard arrows or a gamepad: arrows move a highlight to the nearest button in that direction,
// Enter clicks it. Panels re-render their DOM on every change, so the cursor is remembered as a
// screen position and re-attached to the nearest button after each render.
//   const nav = new PanelNav();
//   nav.handle(rootEl, e)  → true when the key was used
//   nav.mark(rootEl)       → call every frame while the panel is open (re-attaches the highlight)
//   nav.reset()            → when the panel closes

const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

const center = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

export class PanelNav {
  constructor() { this.root = null; this.pos = null; this.el = null; }

  reset() {
    if (this.el) this.el.classList.remove("pad-focus");
    this.root = null; this.pos = null; this.el = null;
  }

  items(root) {
    return [...root.querySelectorAll("button")].filter((b) =>
      !b.disabled && !b.classList.contains("empty") && b.offsetParent !== null);
  }

  // The button nearest the remembered position (or the first one)
  current(root) {
    const list = this.items(root);
    if (!list.length) return null;
    if (!this.pos) return list[0];
    let best = null, bd = Infinity;
    for (const b of list) {
      const c = center(b), d = Math.hypot(c.x - this.pos.x, c.y - this.pos.y);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }

  focus(el) {
    if (this.el && this.el !== el) this.el.classList.remove("pad-focus");
    this.el = el;
    if (!el) return;
    el.classList.add("pad-focus");
    this.pos = center(el);
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  mark(root) {
    if (!this.pos || root !== this.root) return;
    if (this.el && this.el.isConnected && this.el.classList.contains("pad-focus")) return;
    this.focus(this.current(root));
  }

  handle(root, e) {
    if (root !== this.root) { this.reset(); this.root = root; }
    const dir = DIRS[e.code];
    if (dir) {
      e.preventDefault();
      const cur = this.current(root);
      if (!this.pos || !cur) { this.focus(cur); return true; }
      const from = center(cur);
      let best = null, bs = Infinity;
      for (const b of this.items(root)) {
        if (b === cur) continue;
        const c = center(b), dx = c.x - from.x, dy = c.y - from.y;
        const along = dx * dir[0] + dy * dir[1];
        if (along <= 2) continue;                                   // not in that direction
        const across = Math.abs(dx * dir[1] - dy * dir[0]);
        const score = along + across * 2.5;
        if (score < bs) { bs = score; best = b; }
      }
      if (best) this.focus(best);
      return true;
    }
    if (e.code === "Enter" && !e.repeat) {
      e.preventDefault();
      if (!this.pos) { this.focus(this.current(root)); return true; }   // first press: show the cursor
      const cur = this.current(root);
      if (cur) {
        this.pos = center(cur);
        cur.click();
        if (this.el) this.el.classList.remove("pad-focus");   // the panel re-renders; mark() re-attaches
        this.el = null;
      }
      return true;
    }
    return false;
  }
}
