// ==================== TURNTABLE PEDESTAL ====================
// A 2.5D chiselled stone turntable for the Codex scene (js/scenes/codexScene.js): obsidian base with a
// floor shadow, a glowing azure rune ring that turns with the heading, and a pip at the current 8-way
// heading (S, SW, W, NW, N, NE, E, SE). Drag across it (mouse or touch) to turn the entity, or call
// step(±1) for 45° turns (A / D, ← / →). The heading eases toward its target (inertia).
// The art has front, side and back views, so view() snaps a heading to the nearest of them:
// S → front, N → back, the six others → side (flipped on the west half).

export const HEADINGS = ["S", "SW", "W", "NW", "N", "NE", "E", "SE"];
export const W = 220, H = 170;            // internal pixels (CSS scales it, pixelated)
const CX = 110, CY = 126, RX = 74, RY = 22, DEPTH = 24;
const RUNES = 24;
const DRAG_PX = 26;                       // CSS pixels of drag per 45°

export class TurntablePedestal {
  constructor(canvas, { onTurn } = {}) {
    this.canvas = canvas;
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.target = 0;                      // heading in 45° steps (float while dragging)
    this.current = 0;
    this.onTurn = onTurn || null;
    this.lastIndex = 0;
    this.tick = 0;
    this.bindDrag();
  }

  get index() { return ((Math.round(this.current) % 8) + 8) % 8; }
  get label() { return HEADINGS[this.index]; }

  step(d) {
    this.target = Math.round(this.target) + d;
  }

  setHeading(i) {
    this.target = this.current = i;
  }

  // [dir, flip] for Avatar / CreatureSprite draw calls
  view() {
    const i = this.index;
    if (i === 0) return ["down", false];
    if (i === 4) return ["up", false];
    return ["side", i < 4];               // SW, W, NW face left
  }

  bindDrag() {
    const cv = this.canvas;
    let startX = 0, startT = 0, dragging = false;
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startT = Math.round(this.target);
      cv.setPointerCapture(e.pointerId);
      cv.classList.add("dragging");
    });
    cv.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      // Dragging right carries the front of the table to the right: S → SE → E
      this.target = startT - (e.clientX - startX) / DRAG_PX;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      this.target = Math.round(this.target);
      cv.classList.remove("dragging");
    };
    cv.addEventListener("pointerup", end);
    cv.addEventListener("pointercancel", end);
    cv.addEventListener("wheel", (e) => { e.preventDefault(); this.step(e.deltaY > 0 ? 1 : -1); }, { passive: false });
  }

  // drawEntity(ctx, footX, footY, dir, flip): the entity standing on the table
  draw(drawEntity) {
    this.tick++;
    this.current += (this.target - this.current) * 0.2;
    if (Math.abs(this.target - this.current) < 0.002) this.current = this.target;
    if (this.index !== this.lastIndex) {
      this.lastIndex = this.index;
      if (this.onTurn) this.onTurn(this.index);
    }

    const c = this.ctx;
    c.clearRect(0, 0, W, H);

    // Floor shadow
    c.fillStyle = "rgba(0, 0, 0, 0.45)";
    c.beginPath(); c.ellipse(CX, CY + DEPTH + 6, RX + 14, RY + 6, 0, 0, Math.PI * 2); c.fill();

    // Side band (granite), with chiselled block seams that turn with the table
    c.fillStyle = "#1c2433";
    c.beginPath(); c.ellipse(CX, CY + DEPTH, RX, RY, 0, 0, Math.PI); c.fill();
    c.fillRect(CX - RX, CY, RX * 2, DEPTH);
    c.fillStyle = "#273246";
    c.fillRect(CX - RX, CY, RX * 2, 3);
    c.strokeStyle = "#111827";
    c.lineWidth = 1;
    const rot = (this.current * Math.PI) / 4;
    for (let i = 0; i < 12; i++) {
      const th = rot + (i * Math.PI * 2) / 12;
      if (Math.sin(th) <= 0.05) continue;   // seams on the front half only
      const x = Math.round(CX + RX * Math.cos(th)) + 0.5, y = CY + RY * Math.sin(th);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + DEPTH); c.stroke();
    }
    c.strokeStyle = "#0b1020";
    c.beginPath(); c.ellipse(CX, CY + DEPTH, RX, RY, 0, 0, Math.PI); c.stroke();

    // Top face: obsidian with a lighter bevel
    c.fillStyle = "#3a465c";
    c.beginPath(); c.ellipse(CX, CY, RX, RY, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#222c3d";
    c.beginPath(); c.ellipse(CX, CY + 1, RX - 5, RY - 3, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#2b3649";
    c.beginPath(); c.ellipse(CX, CY + 1, RX - 22, RY - 8, 0, 0, Math.PI * 2); c.fill();

    // Azure core glow
    const pulse = 0.35 + 0.1 * Math.sin(this.tick / 30);
    const g = c.createRadialGradient(CX, CY, 2, CX, CY, RX - 10);
    g.addColorStop(0, `rgba(56, 189, 248, ${pulse})`);
    g.addColorStop(1, "rgba(56, 189, 248, 0)");
    c.fillStyle = g;
    c.beginPath(); c.ellipse(CX, CY, RX - 6, RY - 3, 0, 0, Math.PI * 2); c.fill();

    this.drawRing(c, rot, false);          // back half, behind the entity
    if (drawEntity) {
      const [dir, flip] = this.view();
      drawEntity(c, CX, CY + 2, dir, flip);
    }
    this.drawRing(c, rot, true);           // front half and the heading pip, over the feet
  }

  drawRing(c, rot, front) {
    const rx = RX - 12, ry = RY - 5;
    c.lineWidth = 1;
    c.strokeStyle = front ? "rgba(125, 211, 252, 0.85)" : "rgba(56, 189, 248, 0.4)";
    c.beginPath(); c.ellipse(CX, CY, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); c.stroke();
    for (let i = 0; i < RUNES; i++) {
      const th = rot + (i * Math.PI * 2) / RUNES;
      const s = Math.sin(th);
      if ((s > 0) !== front) continue;
      const x = Math.round(CX + rx * Math.cos(th)), y = Math.round(CY + ry * s);
      c.fillStyle = front ? (i % 3 ? "#7dd3fc" : "#e0f2fe") : "#0e7490";
      // little carved glyphs: a bar, a cross or a hook
      if (i % 3 === 0) { c.fillRect(x - 1, y - 2, 1, 4); c.fillRect(x, y - 2, 2, 1); }
      else if (i % 3 === 1) { c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3); }
      else { c.fillRect(x - 1, y - 1, 1, 3); c.fillRect(x, y + 1, 2, 1); }
    }
    if (!front) return;
    // Heading pip: the table's front (S) is at the bottom of the ellipse; W at the left
    const th = Math.PI / 2 + (this.current * Math.PI) / 4;
    const px = Math.round(CX + (RX - 2) * Math.cos(th)), py = Math.round(CY + (RY - 1) * Math.sin(th));
    c.fillStyle = "#fde68a";
    c.fillRect(px - 2, py - 1, 5, 3);
    c.fillRect(px - 1, py - 2, 3, 5);
    c.fillStyle = "#fff";
    c.fillRect(px, py, 1, 1);
  }
}
