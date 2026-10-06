// ==================== LORE TICKER ====================
// A box of story text that scrolls itself slowly upward and loops (Codex scene, bottom right).
// The mouse wheel or a drag scrolls it by hand; it waits a few seconds, then carries on.
// setText(paragraphs) replaces the content (DOM text only, never HTML).

const SPEED = 0.25;          // px per frame
const IDLE_FRAMES = 240;     // pause after a manual scroll

export class LoreTicker {
  constructor(el) {
    this.el = el;
    this.track = document.createElement("div");
    this.track.className = "lt-track";
    el.appendChild(this.track);
    this.pos = 0;
    this.hold = 90;            // a short pause before it starts
    this.bind();
  }

  setText(paragraphs) {
    this.track.textContent = "";
    paragraphs.filter(Boolean).forEach((p) => {
      const n = document.createElement(p.head ? "h4" : "p");
      n.textContent = p.head || p;
      this.track.appendChild(n);
    });
    this.pos = 0;
    this.hold = 90;
    this.el.scrollTop = 0;
  }

  bind() {
    const el = this.el;
    el.addEventListener("wheel", () => { this.hold = IDLE_FRAMES; }, { passive: true });
    let y0 = 0, s0 = 0, drag = false;
    el.addEventListener("pointerdown", (e) => { drag = true; y0 = e.clientY; s0 = el.scrollTop; this.hold = IDLE_FRAMES; el.setPointerCapture(e.pointerId); });
    el.addEventListener("pointermove", (e) => { if (drag) { el.scrollTop = s0 - (e.clientY - y0); this.hold = IDLE_FRAMES; } });
    const end = () => { drag = false; };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  // Every frame while visible
  update() {
    const el = this.el;
    if (this.hold > 0) { this.hold--; this.pos = el.scrollTop; return; }
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return;
    this.pos += SPEED;
    if (this.pos >= max + 40) { this.pos = 0; this.hold = 120; }   // loop back to the top after a beat
    el.scrollTop = Math.min(max, this.pos);
  }
}
