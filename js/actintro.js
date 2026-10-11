// ==================== ACT INTRO ====================
// An HD cinematic when the story reaches a new Act: the Act's layered set (assets/cinema/act-N)
// is rebuilt at screen resolution by js/cinema/engine.js with its own camera move, parallax,
// depth of field, lights and particles (js/cinema/actShots.js); the letterbox slides in, then the
// Act number, its title and the banner's EN/FIL caption (data/art_manifest.json) are set in HD
// type. About seven and a half seconds; Enter / Backspace / Space / J skip it. The game waits while it
// plays. It draws on its own full-window canvas over the game, so it is not limited to 480×270.
import { getLang } from "./i18n.js";
import { Cinema, loadSet, span, ease, rgba, CINEMA_WIDTH } from "./cinema/engine.js";
import { ACT_SHOTS, storyShot } from "./cinema/actShots.js";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
const LENGTH = 450;            // frames (7.5 s)
const FADE_OUT = 40;
const SKIP = new Set(["Enter", "Backspace", "Space", "KeyJ", "NumpadEnter"]);

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
    this.quality = () => "balanced";   // main.js: Options → Quality
    if (typeof document === "undefined") return;
    this.el = document.createElement("div");
    this.el.className = "act-intro";
    this.el.setAttribute("aria-hidden", "true");
    this.canvas = document.createElement("canvas");
    this.el.append(this.canvas);
    document.body.append(this.el);
    this.cine = new Cinema(this.canvas);
    window.addEventListener("resize", () => { if (this.open) this.fit(); });
  }

  fit() { this.cine.resize(window.innerWidth, window.innerHeight, CINEMA_WIDTH[this.quality()] || CINEMA_WIDTH.balanced); }

  begin(shot, setId, fallback) {
    this.t = 0;
    this.open = true;
    this.shot = shot;
    this.ready = false;
    this.cine.reset();
    if (!this.el) return;
    this.el.classList.add("show");
    this.fit();
    if (!setId && !fallback) { this.cine.begin(shot, []); this.ready = true; return; }
    const token = (this.token = {});
    loadSet(setId, fallback).then((layers) => {
      if (this.token !== token || !this.open) return;
      this.cine.begin(shot, layers || []);
      this.ready = true;
    });
  }

  // act: number; title: "The Earthbound Summoning" (already in the player's language)
  start(act, title) {
    this.act = act;
    this.label = `ACT ${ROMAN[act] || act}`;
    this.title = title || "";
    this.caption = null;
    this.begin(ACT_SHOTS[act] || ACT_SHOTS[1], `act-${act}`, `assets/banner/act-${act}.png`);
  }

  startStory(label, title, caption, color = "#67e8f9") {
    this.act = 0;
    this.label = label;
    this.title = title;
    this.caption = caption;
    this.begin(storyShot(color), null, null);
  }

  close() {
    this.open = false;
    if (this.el) this.el.classList.remove("show");
    if (this.cine) this.cine.release();
  }

  // true when the key was used (skip)
  handleInput(e) {
    if (!this.open || !SKIP.has(e.code)) return false;
    if (this.t < LENGTH - FADE_OUT) this.t = LENGTH - FADE_OUT;   // fade out from here
    e.preventDefault();
    return true;
  }

  // Called once per game frame while open (the game is paused); ctx is the game's, unused here
  draw() {
    if (!this.open) return;
    if (!this.el) { if (++this.t >= LENGTH) this.close(); return; }
    const cine = this.cine, ctx = cine.ctx;
    if (!this.ready) {                       // set still loading: hold on black
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }
    const t = ++this.t;
    if (t >= LENGTH) { this.close(); return; }
    const p = t / LENGTH;
    const out = t > LENGTH - FADE_OUT ? (t - (LENGTH - FADE_OUT)) / FADE_OUT : 0;
    cine.bars = ease.out(span(t, 0, 40));
    cine.fadeColor = "#000000";
    cine.fade = Math.max(1 - ease.out(t / 50), ease.inout(out));
    const shot = this.shot;
    shot.ui = (c) => this.titles(c, t);
    cine.frame(t, p);
    // the overlay itself fades away in the last frames, back into the game
    this.el.style.opacity = String(1 - ease.inout(span(t, LENGTH - 14, LENGTH)));
  }

  // HD type: "ACT IX" letter by letter, the title with a light sweep, a gold rule, the caption
  titles(cine, t) {
    const ctx = cine.ctx, W = this.canvas.width, H = this.canvas.height, k = cine.k;
    const accent = this.shot.accent || "#fde68a";
    const A = 1 - span(t, LENGTH - FADE_OUT, LENGTH - 8);
    if (A <= 0) return;
    const cy = H * 0.47;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // a soft dark band behind the text so it reads on any painting
    const band = ctx.createLinearGradient(0, cy - 40 * k, 0, cy + 50 * k);
    band.addColorStop(0, "rgba(0,0,0,0)");
    band.addColorStop(0.5, `rgba(0,0,0,${0.5 * A * ease.out(span(t, 30, 80))})`);
    band.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, cy - 40 * k, W, 90 * k);

    // "ACT IX": letters appear one by one, widely spaced, gold with a glow
    const label = this.label || `ACT ${ROMAN[this.act] || this.act}`;
    ctx.font = `700 ${Math.round(8.5 * k)}px Cinzel, Georgia, serif`;
    const step = 9.5 * k, x0 = W / 2 - ((label.length - 1) * step) / 2;
    for (let i = 0; i < label.length; i++) {
      const a = ease.out(span(t, 45 + i * 5, 60 + i * 5)) * A;
      if (a <= 0) continue;
      ctx.globalAlpha = a;
      ctx.shadowColor = rgba(accent, 0.9);
      ctx.shadowBlur = 6 * k;
      ctx.fillStyle = "#fde68a";
      ctx.fillText(label[i], x0 + i * step, cy - 22 * k + (1 - a) * 3 * k);
    }
    ctx.shadowBlur = 0;

    // the title: rises into place, then a band of light sweeps across it
    const ta = ease.out(span(t, 90, 130)) * A;
    if (ta > 0 && this.title) {
      const size = Math.round(15 * k);
      ctx.font = `900 ${size}px Cinzel, Georgia, serif`;
      let w = ctx.measureText(this.title).width;
      const maxW = W * 0.86;
      if (w > maxW) { ctx.font = `900 ${Math.round(size * (maxW / w))}px Cinzel, Georgia, serif`; w = maxW; }
      const ty = cy + (1 - ta) * 6 * k;
      ctx.globalAlpha = ta;
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillText(this.title, W / 2 + k * 0.6, ty + k * 0.8);
      const g = ctx.createLinearGradient(0, ty - size / 2, 0, ty + size / 2);
      g.addColorStop(0, "#fffaf0");
      g.addColorStop(0.55, "#fde9b8");
      g.addColorStop(1, "#d9b064");
      ctx.shadowColor = rgba(accent, 0.55);
      ctx.shadowBlur = 10 * k;
      ctx.fillStyle = g;
      ctx.fillText(this.title, W / 2, ty);
      ctx.shadowBlur = 0;
      const sweep = span(t, 130, 210);
      if (sweep > 0 && sweep < 1) {
        const sx = W / 2 - w / 2 - 40 * k + sweep * (w + 80 * k);
        const sg = ctx.createLinearGradient(sx - 30 * k, 0, sx + 30 * k, 0);
        sg.addColorStop(0, "rgba(255,255,255,0)");
        sg.addColorStop(0.5, "rgba(255,255,255,0.85)");
        sg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = sg;
        ctx.save();
        ctx.beginPath();
        ctx.rect(W / 2 - w / 2, ty - size * 0.7, w, size * 1.4);
        ctx.clip();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = ta * 0.9;
        ctx.fillText(this.title, W / 2, ty);
        ctx.restore();
        ctx.globalCompositeOperation = "source-over";
      }
      // gold rule that grows from the centre, with bright ends
      const rw = Math.min(w * 0.55, 130 * k) * ease.out(span(t, 100, 160));
      const rg = ctx.createLinearGradient(W / 2 - rw, 0, W / 2 + rw, 0);
      rg.addColorStop(0, "rgba(201,162,39,0)");
      rg.addColorStop(0.5, "rgba(240,205,110,1)");
      rg.addColorStop(1, "rgba(201,162,39,0)");
      ctx.globalAlpha = ta;
      ctx.fillStyle = rg;
      ctx.fillRect(W / 2 - rw, cy + 13 * k, rw * 2, Math.max(1, 0.6 * k));
    }

    // the banner's caption, two lines at most, in italic
    const ca = ease.out(span(t, 140, 190)) * A;
    const cap = this.caption ? { caption: this.caption } : captions && captions[`assets/banner/act-${this.act}.png`];
    if (ca > 0 && cap) {
      ctx.globalAlpha = ca;
      ctx.font = `italic ${Math.round(6.4 * k)}px Georgia, 'Times New Roman', serif`;
      ctx.fillStyle = "#e7e5e4";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 3 * k;
      const text = typeof cap.caption === "string" ? cap.caption : cap.caption[getLang() === "fil" ? "fil" : "en"] || cap.caption.en;
      wrap(ctx, text, W * 0.72).slice(0, 2).forEach((ln, i) => ctx.fillText(ln, W / 2, cy + 26 * k + i * 9.5 * k));
      ctx.shadowBlur = 0;
    }
    // skip hint in the lower bar
    if (t > 100) {
      ctx.globalAlpha = A * (0.45 + Math.sin(t / 10) * 0.25);
      ctx.font = `700 ${Math.round(5 * k)}px Cinzel, Georgia, serif`;
      ctx.textAlign = "right";
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText("ENTER ▸", W - 12 * k, H - 10 * k);
    }
    ctx.restore();
  }
}
