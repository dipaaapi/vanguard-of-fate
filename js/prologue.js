import { getLang } from "./i18n.js";
import { Sound } from "./audio.js";
import { Avatar } from "./avatar/avatar.js";
import { WolfSprite } from "./avatar/creature.js";
import { NPC_DEFS, summonerIdFor } from "./npc/roster.js";
import { npcName } from "./dialogue.js";
import { Cinema, loadSet } from "./cinema/engine.js";
import { buildShots } from "./cinema/prologueShots.js";

// ==================== ACT I PROLOGUE CUTSCENE ====================
// An HD cinematic explaining how the hero reached Aethelgard: the golden age → the Eclipse and
// Satan → the Seven Blights → the King and the summoner decide (the Lantern Knight, the Pentagram
// Prophecy) → Earth (2026), swallowed by the rift → the crossing → the ritual beneath the Citadel
// → waking in the Barracks Sanctuary with the summoner → a distant omen.
// Shots are layered pixel-art sets with a moving camera, depth of field, lights and particles
// (js/cinema/); the text is in data/prologue.json. The hero is the one made in the Character
// Creator; the summoner is Aurelia or Kenneth.
// Enter/Space/E/click: finish the line or continue · Backspace: skip everything.

let TEXT = null;
const textReady = fetch("data/prologue.json").then((r) => r.json()).then((d) => { TEXT = d; }).catch(() => { TEXT = { shots: {}, panel: { en: [], fil: [] } }; });

const FADE_IN = 30;      // frames of fade from black at the start of a shot
const FADE_OUT = 18;     // frames of fade to black before the next shot

export class PrologueScene {
  constructor(root, onComplete) {
    this.root = root;
    this.onComplete = onComplete;
    this.open = false;
    this.canvas = root.querySelector("#prologueCanvas");
    this.cine = new Cinema(this.canvas);
    this.stageEl = root.querySelector("#proStage");
    this.cardEl = root.querySelector("#proCard");
    this.subEl = root.querySelector("#proSub");
    this.speakerEl = root.querySelector("#proSpeaker");
    this.lineEl = root.querySelector("#proLine");
    this.hintEl = root.querySelector("#proHint");
    this.maxWidth = () => 1920;     // main.js: follows Options → Quality

    this.stageEl.addEventListener("pointerdown", () => this.next());
    window.addEventListener("resize", () => { if (this.open) this.fit(); });
    this.loop = this.loop.bind(this);
  }

  start(heroName = "", avatarConfig = null) {
    const lang = getLang() === "fil" ? "fil" : "en";
    this.heroName = heroName || (lang === "fil" ? "Bayani" : "Champion");
    const sid = summonerIdFor(avatarConfig);
    this.summonerId = sid;
    this.cast = {
      hero: new Avatar(avatarConfig || {}),
      summoner: new Avatar(NPC_DEFS[sid].look),
      king: new Avatar(NPC_DEFS.king.look),
      ronald: new Avatar(NPC_DEFS.ronald.look),
      edgar: new Avatar(NPC_DEFS.edgar.look),
      wolf: new WolfSprite({ body: "#1c1222", bodyD: "#0a0610", bodyL: "#3a2442", eye: "#ff3b3b" }),
      streaks: Array.from({ length: 160 }, () => ({ q: Math.random() * Math.PI * 2, d: Math.random(), v: 0.6 + Math.random() * 1.4, a: 0.4 + Math.random() * 0.6 })),
      flags: {},
      panel: []
    };
    this.shots = buildShots(this.cast);
    // start loading every backdrop now; each shot waits only for its own
    this.sets = this.shots.map((s) => loadSet(s.set).then((layers) => { s.layers = layers || []; s.ready = true; }));

    this.open = true;
    this.root.classList.add("active");
    this.root.focus();
    Sound.init();
    this.hintEl.innerHTML = lang === "fil"
      ? "<b>Enter</b> Susunod &nbsp;·&nbsp; <b>Backspace</b> Laktawan"
      : "<b>Enter</b> Next &nbsp;·&nbsp; <b>Backspace</b> Skip";
    this.lineEl.textContent = "";
    this.speakerEl.textContent = "";
    this.cine.reset();
    this.fit();
    this.index = -1;
    this.waiting = true;
    textReady.then(() => { if (this.open) { this.cast.panel = (TEXT.panel && TEXT.panel[lang]) || []; this.goTo(0); } });
    this.last = performance.now();
    requestAnimationFrame(this.loop);
  }

  // The 16:9 HD canvas fills the screen; --s (CSS px per art pixel) sizes the HTML text
  fit() {
    const s = this.cine.resize(window.innerWidth, window.innerHeight, this.maxWidth());
    this.stageEl.style.setProperty("--s", s.toFixed(3));
    this.scale = s;
  }

  goTo(i) {
    this.index = i;
    this.frame = 0;
    this.lineIdx = 0;
    this.chars = 0;
    this.hold = 0;
    this.leaving = 0;
    this.cast.flags = {};
    const sc = this.shots[i];
    this.waiting = !sc.ready;
    const begin = () => {
      if (!this.open || this.index !== i) return;
      this.waiting = false;
      this.cine.particles.clear();
      this.cine.begin(sc, sc.layers);
      this.cine.fadeColor = sc.fadeFrom || "#000000";
      if (sc.sound === "holy" && Sound.playHolyBurst) Sound.playHolyBurst();
      else if (sc.sound === "thunder" && Sound.playThunder) Sound.playThunder();
      else if (sc.sound === "dark" && Sound.playDarkCast) Sound.playDarkCast();
      else if (sc.sound === "move" && Sound.playSelectMove) Sound.playSelectMove();
      const lang = getLang() === "fil" ? "fil" : "en";
      const card = this.text().card;
      if (card) {
        this.cardEl.innerHTML = `<span class="pro-card-act">${card[lang][0]}</span><span class="pro-card-title">${card[lang][1]}</span>`;
        this.cardEl.classList.remove("show");
        void this.cardEl.offsetWidth;
        this.cardEl.classList.add("show");
      }
      this.showLine();
    };
    if (sc.ready) begin();
    else this.sets[i].then(begin);
  }

  text() { return (TEXT && TEXT.shots[this.shots[this.index].id]) || { lines: [{ en: "", fil: "" }] }; }

  line() { return this.text().lines[this.lineIdx]; }

  lineText() {
    const lang = getLang() === "fil" ? "fil" : "en";
    return (this.line()[lang] || "").replace(/\{h\}/g, this.heroName);
  }

  showLine() {
    const ln = this.line();
    this.chars = 0;
    this.hold = 0;
    const who = ln.speaker === "summoner" ? npcName(this.summonerId) : ln.speaker ? npcName(ln.speaker) : "";
    this.speakerEl.textContent = who;
    this.subEl.classList.toggle("spoken", Boolean(who));
    this.lineEl.textContent = "";
  }

  // Enter / Space / E / click: finish typing → next line → next shot
  next() {
    if (!this.open || this.waiting || this.index < 0 || this.leaving) return;
    const text = this.lineText();
    if (this.chars < text.length) { this.chars = text.length; return; }
    if (this.lineIdx < this.text().lines.length - 1) {
      this.lineIdx++;
      this.showLine();
      if (Sound.playSelectMove) Sound.playSelectMove();
    } else {
      this.leaving = 1;          // fade out, then the next shot (or the end)
    }
  }

  update() {
    if (this.waiting || this.index < 0) return;
    const sc = this.shots[this.index];
    this.frame++;
    if (this.leaving) {
      if (++this.leaving > FADE_OUT) {
        if (this.index < this.shots.length - 1) this.goTo(this.index + 1);
        else this.finish();
      }
      return;
    }
    const text = this.lineText();
    if (this.chars < text.length) {
      this.chars = Math.min(text.length, this.chars + 0.7);
    } else {
      this.hold++;
      // auto-advance: time to read; the last line also waits for the animation
      const last = this.lineIdx === this.text().lines.length - 1;
      const wait = 110 + text.length * 1.2;
      if (this.hold > wait && (!last || this.frame >= sc.dur)) this.next();
    }
    this.lineEl.textContent = text.slice(0, Math.floor(this.chars));
  }

  draw() {
    const cine = this.cine;
    if (this.waiting || this.index < 0) {
      const ctx = cine.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }
    const sc = this.shots[this.index];
    const p = Math.min(1, this.frame / sc.dur);
    // fade in from black (or white after the crossing), fade out before the next shot
    const fadeIn = sc.noFade ? 0 : 1 - Math.min(1, this.frame / FADE_IN);
    if (this.frame < FADE_IN) cine.fadeColor = sc.fadeFrom || "#000000";
    cine.fade = Math.max(fadeIn, this.leaving ? this.leaving / FADE_OUT : 0);
    if (this.leaving && !sc.fadeFrom) cine.fadeColor = sc.id === "crossing" ? "#ffffff" : "#000000";
    cine.bars = Math.min(1, cine.bars + 0.02);
    cine.frame(this.frame, p);
  }

  loop(now) {
    if (!this.open) return;
    let steps = Math.min(4, Math.round((now - this.last) / (1000 / 60)));
    if (steps > 0) this.last = now;
    while (steps-- > 0 && this.open) this.update();
    if (!this.open) return;
    this.draw();
    requestAnimationFrame(this.loop);
  }

  finish() {
    if (!this.open) return;
    this.open = false;
    this.root.classList.remove("active");
    this.cine.release();
    if (Sound.playHolyBurst) Sound.playHolyBurst();
    if (this.onComplete) this.onComplete();
  }

  handleInput(e) {
    if (!this.open) return;
    const c = e.code;
    if (c === "Space" || c === "Enter" || c === "KeyE") {
      e.preventDefault();
      if (!e.repeat) this.next();
    } else if (c === "Backspace") {
      e.preventDefault();
      this.finish();
    }
  }
}
