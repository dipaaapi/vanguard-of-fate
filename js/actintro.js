// ==================== ACT INTRO ====================
// A short cinematic when the story reaches a new Act: the Act's banner (assets/banner/act-N.png)
// slowly pushes in behind letterbox bars, motes drift in the Act's colour and a light sweeps
// across, then the Act number, its title and the banner's caption (data/art_manifest.json)
// fade in. About six seconds; Enter / Esc / Space / J skip it. The game waits while it plays.
import { getLang } from "./i18n.js";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const LENGTH = 390;            // frames (6.5 s)
const FADE_OUT = 36;
// Mote colours per Act (follow each banner's light)
const MOTES = {
  1: ["#c084fc", "#e9d5ff"], 2: ["#5ee7ff", "#e0f2fe"], 3: ["#fde68a", "#c084fc"], 4: ["#fde68a", "#ffffff"],
  5: ["#5ee7ff", "#fde68a"], 6: ["#e0e7ff", "#a5b4fc"], 7: ["#86efac", "#c084fc"], 8: ["#7dd3fc", "#e0f2fe"],
  9: ["#ffffff", "#bae6fd"], 10: ["#fb923c", "#fde047"], 11: ["#f87171", "#fb923c"], 12: ["#c084fc", "#f0abfc"]
};
const SKIP = new Set(["Enter", "Escape", "Space", "KeyJ", "NumpadEnter"]);

let captions = null;
fetch("data/art_manifest.json").then((r) => r.json()).then((m) => { captions = m.files || {}; }).catch(() => { captions = {}; });

function wrap(ctx, text, maxW) {
  const out = [];
  let line = "";
  for (const w of text.split(" ")) {
    if (line && ctx.measureText(`${line} ${w}`).width > maxW) { out.push(line); line = w; } else line = line ? `${line} ${w}` : w;
  }
  if (line) out.push(line);
  return out;
}

export class ActIntro {
  constructor() {
    this.open = false;
    this.t = 0;
    this.img = null;
    this.motes = [];
  }

  // act: number; title: "The Earthbound Summoning" (already in the player's language)
  start(act, title) {
    this.act = act;
    this.title = title || "";
    this.t = 0;
    this.open = true;
    this.img = new Image();
    this.img.src = `assets/banner/act-${act}.png`;
    const cols = MOTES[act] || MOTES[1];
    this.motes = Array.from({ length: 46 }, () => ({
      x: Math.random() * 480, y: 40 + Math.random() * 230, v: 0.12 + Math.random() * 0.35,
      s: Math.random() < 0.25 ? 2 : 1, c: cols[Math.random() < 0.7 ? 0 : 1], ph: Math.random() * 6.28
    }));
  }

  close() { this.open = false; }

  // true when the key was used (skip)
  handleInput(e) {
    if (!this.open || !SKIP.has(e.code)) return false;
    if (this.t < LENGTH - FADE_OUT) this.t = LENGTH - FADE_OUT;   // fade out from here
    e.preventDefault();
    return true;
  }

  draw(ctx, W, H) {
    if (!this.open) return;
    const t = ++this.t;
    if (t >= LENGTH) { this.open = false; return; }
    const ease = (x) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;
    const fadeIn = ease(t / 40);
    const out = t > LENGTH - FADE_OUT ? (t - (LENGTH - FADE_OUT)) / FADE_OUT : 0;
    const A = 1 - ease(out);              // the whole card fades away, back into the game
    ctx.save();
    ctx.globalAlpha = A;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // The banner pushes in slowly; odd Acts drift right, even Acts drift left
    const img = this.img;
    if (img && img.complete && img.naturalWidth) {
      const p = t / LENGTH;
      const zoom = 1.14 - 0.12 * ease(p * 1.2);
      const dir = this.act % 2 ? 1 : -1;
      const w = W * zoom, h = H * zoom;
      ctx.globalAlpha = A * (fadeIn);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, (W - w) / 2 + dir * (p - 0.5) * 18, (H - h) / 2, w, h);
      ctx.globalAlpha = A;
    }

    // A band of light sweeps across once
    const sweep = (t - 30) / 120;
    if (sweep > 0 && sweep < 1) {
      const sx = -120 + sweep * (W + 240);
      const g = ctx.createLinearGradient(sx - 60, 0, sx + 60, 0);
      g.addColorStop(0, "rgba(255, 244, 214, 0)");
      g.addColorStop(0.5, "rgba(255, 244, 214, 0.16)");
      g.addColorStop(1, "rgba(255, 244, 214, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // Motes rising in the Act's light
    this.motes.forEach((m) => {
      m.y -= m.v;
      m.x += Math.sin(t / 40 + m.ph) * 0.15;
      if (m.y < 26) { m.y = H - 26; m.x = Math.random() * W; }
      ctx.globalAlpha = A * (fadeIn * (0.45 + Math.sin(t / 12 + m.ph) * 0.35));
      ctx.fillStyle = m.c;
      ctx.fillRect(Math.round(m.x), Math.round(m.y), m.s, m.s);
    });
    ctx.globalAlpha = A;

    // Shade under the text, then letterbox bars that slide in
    const sh = ctx.createLinearGradient(0, H * 0.35, 0, H * 0.8);
    sh.addColorStop(0, "rgba(0, 0, 0, 0)");
    sh.addColorStop(0.5, "rgba(0, 0, 0, 0.55)");
    sh.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = sh;
    ctx.fillRect(0, 0, W, H);
    const bar = Math.round(26 * ease(t / 30));
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, bar);
    ctx.fillRect(0, H - bar, W, bar);

    // "ACT IX": letters appear one by one, spaced wide
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = `ACT ${ROMAN[this.act] || this.act}`;
    const shown = Math.floor(Math.max(0, t - 45) / 5);
    ctx.font = "bold 9px monospace";
    const step = 9;
    const x0 = W / 2 - ((label.length - 1) * step) / 2;
    for (let i = 0; i < Math.min(label.length, shown); i++) {
      ctx.fillStyle = "#000";
      ctx.fillText(label[i], x0 + i * step + 1, H / 2 - 22 + 1);
      ctx.fillStyle = "#fde68a";
      ctx.fillText(label[i], x0 + i * step, H / 2 - 22);
    }
    // title and a gold rule
    const ta = ease((t - 90) / 40);
    if (ta > 0) {
      ctx.globalAlpha = A * (ta);
      ctx.font = "bold 14px Georgia, 'Times New Roman', serif";
      ctx.fillStyle = "#000";
      ctx.fillText(this.title, W / 2 + 1, H / 2 + 1, W - 40);
      ctx.fillStyle = "#fff4d6";
      ctx.fillText(this.title, W / 2, H / 2, W - 40);
      ctx.fillStyle = "#c9a227";
      const rw = 120 * ta;
      ctx.fillRect(W / 2 - rw, H / 2 + 12, rw * 2, 1);
      ctx.globalAlpha = A;
    }
    // caption of the banner in the lower bar
    const ca = ease((t - 140) / 50);
    const cap = captions && captions[`assets/banner/act-${this.act}.png`];
    if (ca > 0 && cap) {
      ctx.globalAlpha = A * (ca);
      ctx.font = "italic 6px Georgia, 'Times New Roman', serif";
      ctx.fillStyle = "#e2e8f0";
      const lines = wrap(ctx, cap.caption[getLang() === "fil" ? "fil" : "en"] || cap.caption.en, W - 120);
      lines.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, W / 2, H / 2 + 26 + i * 9));
      ctx.globalAlpha = A;
    }
    // skip hint
    if (t > 100) {
      ctx.globalAlpha = A * (0.45 + Math.sin(t / 10) * 0.25);
      ctx.font = "bold 5px monospace";
      ctx.textAlign = "right";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("ENTER ▸", W - 10, H - 13);
      ctx.globalAlpha = A;
    }
    ctx.restore();
  }
}
