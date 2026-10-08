import { getLang } from "./i18n.js";

// ==================== PORTAL LOADING SCREEN ====================
// Shown while the hero crosses a gateway: the old place is torn down and the new one is built
// (tilemap baking, monsters) behind it, so the hitch never shows. A rotating cyan portal ring,
// "ENTERING <PLACE>...", a lore tip (data/loading_tips.json) and a bar that fills over MIN_MS.
// main.js: start(name, work) → the work runs on the next frame (after this screen is visible);
// update() returns true once the work is done and MIN_MS has passed.

const MIN_MS = 700;
let DATA = { entering: { en: "ENTERING", fil: "PAPASOK SA" }, tips: [] };
fetch("data/loading_tips.json").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) DATA = d; }).catch(() => {});

const lang = () => (getLang() === "fil" ? "fil" : "en");

export class LoadingScreen {
  constructor() {
    this.open = false;
    this.name = "";
    this.tip = null;
    this.work = null;
    this.t0 = 0;
  }

  start(name, work) {
    this.open = true;
    this.name = name;
    this.work = work;
    this.done = false;
    this.t0 = performance.now();
    this.tip = DATA.tips.length ? DATA.tips[Math.floor(Math.random() * DATA.tips.length)] : null;
  }

  // Every frame while open. true = finished (the caller resumes play).
  update() {
    if (!this.open) return false;
    if (this.work && performance.now() - this.t0 > 30) {   // let one frame of this screen show first
      const w = this.work;
      this.work = null;
      w();
    }
    if (!this.work && performance.now() - this.t0 >= MIN_MS) {
      this.open = false;
      return true;
    }
    return false;
  }

  draw(ctx, W, H) {
    const now = performance.now();
    const k = Math.min(1, (now - this.t0) / MIN_MS);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0a0d14";
    ctx.fillRect(0, 0, W, H);

    // Portal ring: two counter-rotating dashed rings and a soft core
    const cx = W / 2, cy = H / 2 - 22, a = now / 600;
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 34);
    g.addColorStop(0, "rgba(125, 211, 252, 0.55)");
    g.addColorStop(1, "rgba(125, 211, 252, 0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const s = a + (i * Math.PI) / 6;
      ctx.strokeStyle = i % 3 ? "#38bdf8" : "#e0f2fe";
      ctx.beginPath(); ctx.arc(cx, cy, 24, s, s + 0.32); ctx.stroke();
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#0ea5e9";
    for (let i = 0; i < 8; i++) {
      const s = -a * 1.6 + (i * Math.PI) / 4;
      ctx.beginPath(); ctx.arc(cx, cy, 16, s, s + 0.45); ctx.stroke();
    }

    // Destination and tip
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = "#e0f2fe";
    const dots = ".".repeat(1 + (Math.floor(now / 300) % 3));
    ctx.fillText(`${DATA.entering[lang()]} ${this.name.toUpperCase()}${dots}`, cx, cy + 44);
    if (this.tip) {
      ctx.font = "7px monospace";
      ctx.fillStyle = "#94a3b8";
      wrap(ctx, this.tip[lang()] || this.tip.en, cx, cy + 62, W - 80, 10);
    }

    // Progress bar
    const bw = 180, bx = cx - bw / 2, by = H - 30;
    ctx.fillStyle = "#111827";
    ctx.fillRect(bx, by, bw, 5);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(bx, by, Math.round(bw * k), 5);
    ctx.strokeStyle = "#1e3a5f";
    ctx.strokeRect(bx - 0.5, by - 0.5, bw + 1, 6);
    ctx.restore();
  }
}

function wrap(ctx, text, x, y, maxW, lh) {
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = word; }
    else line = test;
  }
  if (line) ctx.fillText(line, x, y);
}
