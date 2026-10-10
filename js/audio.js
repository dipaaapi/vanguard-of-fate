import { TRACKS, AREA_TRACK, JINGLES, compileTrack, midi, freq } from "./music.js";

// ==================== SOUND ENGINE ====================
// Everything is synthesised with Web Audio at runtime; there are no audio files.
//
//   master ─ compressor ─ speakers
//     ├─ music bus  (sequencer in this file, tracks in js/music.js; crossfades between areas)
//     ├─ sfx bus    (one-shot effects; world sounds fade with distance and are muted off screen)
//     └─ reverb     (generated impulse; music and magic send a little into it)
//
// Public API kept from the old engine: init, setCamera, setListener, startTitleBGM, startGameplayBGM,
// stopTitleBGM, stopGameplayBGM, stopAllBGM, musicEnabled / sfxEnabled / isMuted and the play* effects.
// New: setScene(placeId, night, bossKey) picks the gameplay track; playJingle(name) for fanfares.

const LOOKAHEAD = 0.15;   // seconds of notes scheduled ahead
const TICK_MS = 30;       // scheduler wake-up interval
const FADE = 1.6;         // crossfade between tracks (s)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this._musicEnabled = true;
    this.sfxEnabled = true;
    this.isMuted = false;
    this.musicVol = 1;        // Options → Music / Sound Volume (0–1), applied to the buses
    this.sfxVol = 1;
    this.listenerX = null;
    this.listenerY = null;
    this.camX = null;
    this.camY = null;
    this.camW = 480;
    this.camH = 270;
    this.maxAudibleRange = 250;

    this.compiled = {};          // track name → compiled events
    this.current = null;         // { name, track, gain, nextStep, nextTime }
    this.fading = [];            // tracks fading out
    this.timer = null;
    this.mode = null;            // "title" | "game" | null (what the game asked for)
    this.scene = { place: "hub", night: false, boss: null };
    this.lastPlayed = {};        // effect name → time, to stop a crowd of hits from stacking up
  }

  // ---------- positional helpers (unchanged behaviour) ----------
  setCamera(camX, camY, viewW = 480, viewH = 270) { this.camX = camX; this.camY = camY; this.camW = viewW; this.camH = viewH; }
  setListener(x, y) { this.listenerX = x; this.listenerY = y; }

  isInsideScreen(x, y, margin = 8) {
    if (x === null || x === undefined || y === null || y === undefined) return true;
    if (this.camX === null || this.camY === null) return true;
    return x >= this.camX - margin && x <= this.camX + (this.camW || 480) + margin && y >= this.camY - margin && y <= this.camY + (this.camH || 270) + margin;
  }

  // Volume from distance and the screen bounds (0 when off screen)
  getPositionalVolume(x, y, maxDist = this.maxAudibleRange) {
    if (x === null || x === undefined || y === null || y === undefined) return 1;
    if (!this.isInsideScreen(x, y)) return 0;
    if (this.listenerX === null || this.listenerY === null) return 1;
    const dist = Math.hypot(x - this.listenerX, y - this.listenerY);
    if (dist >= maxDist) return 0;
    return Math.max(0.2, 1 - dist / maxDist);
  }

  // ---------- setup ----------
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      try { this.ctx = new AudioCtx(); } catch (e) { return; }
      this.build();
    }
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }

  build() {
    const c = this.ctx;
    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -14; this.comp.knee.value = 10; this.comp.ratio.value = 4;
    this.comp.attack.value = 0.004; this.comp.release.value = 0.2;
    this.master = c.createGain(); this.master.gain.value = 0.85;
    this.master.connect(this.comp); this.comp.connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.musicLevel(); this.musicBus.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = 0.9 * this.sfxVol; this.sfxBus.connect(this.master);
    // reverb
    this.reverb = c.createConvolver();
    this.reverb.buffer = this.impulse(2.4, 2.6);
    this.reverbOut = c.createGain(); this.reverbOut.gain.value = 0.32;
    this.reverb.connect(this.reverbOut); this.reverbOut.connect(this.master);
    this.musicSend = c.createGain(); this.musicSend.gain.value = 0.35 * this.musicVol; this.musicSend.connect(this.reverb);
    this.sfxSend = c.createGain(); this.sfxSend.gain.value = 0.5 * this.sfxVol; this.sfxSend.connect(this.reverb);
    // shared noise
    const len = c.sampleRate * 2;
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  impulse(seconds, decay) {
    const c = this.ctx, len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  // Music bus level for the chosen volume
  musicLevel() { return 0.5 * this.musicVol; }

  // Options: volumes in percent (0–100); a squared curve so each step sounds even
  setVolumes(musicPct, sfxPct) {
    this.musicVol = Math.max(0, Math.min(1, musicPct / 100)) ** 2;
    this.sfxVol = Math.max(0, Math.min(1, sfxPct / 100)) ** 2;
    if (!this.ctx || !this.musicBus) return;
    const n = this.ctx.currentTime;
    const ramp = (param, v) => { param.cancelScheduledValues(n); param.setValueAtTime(param.value, n); param.linearRampToValueAtTime(v, n + 0.08); };
    ramp(this.musicBus.gain, this.musicLevel());
    ramp(this.musicSend.gain, 0.35 * this.musicVol);
    ramp(this.sfxBus.gain, 0.9 * this.sfxVol);
    ramp(this.sfxSend.gain, 0.5 * this.sfxVol);
  }

  get musicEnabled() { return this._musicEnabled; }
  set musicEnabled(v) {
    this._musicEnabled = Boolean(v);
    if (!this._musicEnabled) this.stopMusic();
    else if (this.mode) this.refreshMusic();
  }
  // Kept for main.js, which checks whether the title music is already running
  get titleBgmInterval() { return this.current && this.current.name === "title" ? 1 : null; }
  get bgmInterval() { return this.current && this.current.name !== "title" ? 1 : null; }

  ready() { if (this.isMuted) return false; this.init(); return Boolean(this.ctx); }

  // ==================== INSTRUMENTS ====================
  // voice(name, time, frequency, duration, velocity, destination, send)

  env(g, t, a, peak, d, sustain, rel, end) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * sustain, t + a, d);
    g.gain.setTargetAtTime(0.0001, end, rel);
  }

  osc(type, f, t, stop, dest, detune = 0) {
    const o = this.ctx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
    o.connect(dest); o.start(t); o.stop(stop);
    return o;
  }

  vibrato(o, t, rate, depth, delay = 0.15) {
    const lfo = this.ctx.createOscillator(), g = this.ctx.createGain();
    lfo.frequency.value = rate; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(depth, t + delay + 0.2);
    lfo.connect(g); g.connect(o.frequency); lfo.start(t);
    o.addEventListener("ended", () => { try { lfo.stop(); } catch (e) { /* stopped */ } });
    return lfo;
  }

  noiseSrc(t, stop, dest, rate = 1) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise; s.playbackRate.value = rate; s.loop = true;
    s.connect(dest); s.start(t, Math.random() * 1.5); s.stop(stop);
    return s;
  }

  filter(type, f, q = 1) { const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; }

  voice(inst, t, f, dur, vel, dest, send) {
    const c = this.ctx;
    const g = c.createGain();
    g.connect(dest);
    if (send) g.connect(send);
    const end = t + dur;
    let stop;
    switch (inst) {
      case "lead": { // soft square lead with delayed vibrato
        const lp = this.filter("lowpass", 2600); lp.connect(g);
        stop = end + 0.4;
        const o = this.osc("square", f, t, stop, lp); this.vibrato(o, t, 5.5, f * 0.012, 0.25);
        this.env(g, t, 0.02, 0.16 * vel, 0.2, 0.7, 0.08, end); break;
      }
      case "pulse": { // two detuned squares, chiptune
        const lp = this.filter("lowpass", 3400); lp.connect(g);
        stop = end + 0.3;
        this.osc("square", f, t, stop, lp, -7); this.osc("square", f, t, stop, lp, 7);
        this.env(g, t, 0.01, 0.1 * vel, 0.12, 0.6, 0.06, end); break;
      }
      case "brass": {
        const lp = this.filter("lowpass", 900, 2); lp.connect(g);
        lp.frequency.setValueAtTime(600, t); lp.frequency.linearRampToValueAtTime(2400, t + 0.08); lp.frequency.setTargetAtTime(1400, t + 0.1, 0.2);
        stop = end + 0.4;
        this.osc("sawtooth", f, t, stop, lp, -5); this.osc("sawtooth", f, t, stop, lp, 5);
        this.env(g, t, 0.04, 0.13 * vel, 0.3, 0.75, 0.1, end); break;
      }
      case "flute": {
        const lp = this.filter("lowpass", 3000); lp.connect(g);
        stop = end + 0.5;
        const o = this.osc("sine", f, t, stop, lp); this.vibrato(o, t, 5, f * 0.01, 0.3);
        const over = c.createGain(); over.gain.value = 0.25; over.connect(lp);
        this.osc("triangle", f * 2, t, stop, over);
        const breath = c.createGain(); breath.gain.value = 0.05; breath.connect(g);
        const bp = this.filter("bandpass", f * 2, 2); bp.connect(breath);
        this.noiseSrc(t, Math.min(stop, t + 0.12), bp);
        this.env(g, t, 0.06, 0.2 * vel, 0.3, 0.8, 0.12, end); break;
      }
      case "bell": { // inharmonic partials, long decay
        stop = t + Math.max(dur, 1.6) + 0.2;
        const g2 = c.createGain(); g2.gain.value = 0.35; g2.connect(g);
        this.osc("sine", f, t, stop, g); this.osc("sine", f * 2.76, t, stop, g2); this.osc("sine", f * 5.4, t, t + 0.3, g2);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.14 * vel, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, stop); break;
      }
      case "anvil": { // metallic clang
        stop = t + 0.9;
        this.osc("square", f, t, stop, g); this.osc("sine", f * 3.17, t, stop, g); this.osc("sine", f * 4.93, t, stop, g);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09 * vel, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, stop); break;
      }
      case "harp":
      case "pluck": {
        const lp = this.filter("lowpass", inst === "harp" ? 2400 : 4000, 3); lp.connect(g);
        lp.frequency.setValueAtTime(inst === "harp" ? 3000 : 5000, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.3);
        stop = t + (inst === "harp" ? 1.2 : 0.5);
        this.osc(inst === "harp" ? "triangle" : "sawtooth", f, t, stop, lp);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime((inst === "harp" ? 0.2 : 0.12) * vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, stop); break;
      }
      case "bass": {
        const lp = this.filter("lowpass", 700, 4); lp.connect(g);
        lp.frequency.setValueAtTime(1400, t); lp.frequency.exponentialRampToValueAtTime(380, t + 0.18);
        stop = end + 0.15;
        this.osc("triangle", f, t, stop, g); this.osc("sawtooth", f, t, stop, lp);
        this.env(g, t, 0.006, 0.22 * vel, 0.15, 0.6, 0.04, end); break;
      }
      case "power": { // distorted fifths for the forge and battles
        const lp = this.filter("lowpass", 1100, 1); lp.connect(g);
        const sh = c.createWaveShaper(); sh.curve = this.distCurve(); sh.connect(lp);
        stop = end + 0.3;
        this.osc("sawtooth", f, t, stop, sh, -8); this.osc("sawtooth", f * 1.5, t, stop, sh, 8);
        this.env(g, t, 0.02, 0.06 * vel, 0.4, 0.7, 0.1, end); break;
      }
      case "strings": {
        const lp = this.filter("lowpass", 1800); lp.connect(g);
        stop = end + 0.8;
        for (const dt of [-9, 0, 9]) { const o = this.osc("sawtooth", f, t, stop, lp, dt); this.vibrato(o, t, 5.2, f * 0.006, 0.3); }
        this.env(g, t, 0.18, 0.07 * vel, 0.4, 0.85, 0.3, end); break;
      }
      case "pad": {
        const lp = this.filter("lowpass", 900); lp.connect(g);
        stop = end + 1.2;
        for (const dt of [-12, 0, 12]) this.osc("sawtooth", f, t, stop, lp, dt);
        this.env(g, t, 0.5, 0.06 * vel, 0.5, 0.9, 0.5, end); break;
      }
      case "choir": { // breathy "ah": detuned triangles through a vowel formant
        const bp = this.filter("bandpass", 800, 1.2); bp.connect(g);
        const lp = this.filter("lowpass", 2400); lp.connect(g);
        stop = end + 1.2;
        for (const dt of [-10, 0, 10]) { const o = this.osc("triangle", f, t, stop, bp, dt); this.vibrato(o, t, 4.6, f * 0.008, 0.4); this.osc("sawtooth", f, t, stop, lp, dt * 1.5); }
        this.env(g, t, 0.45, 0.08 * vel, 0.5, 0.9, 0.5, end); break;
      }
      default: {
        stop = end + 0.2;
        this.osc("square", f, t, stop, g);
        this.env(g, t, 0.01, 0.1 * vel, 0.1, 0.6, 0.05, end);
      }
    }
    return stop;
  }

  distCurve() {
    if (this._curve) return this._curve;
    const n = 1024, k = 6, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i / n) * 2 - 1; curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); }
    return (this._curve = curve);
  }

  drum(kind, t, vel, dest) {
    const c = this.ctx;
    const g = c.createGain(); g.connect(dest);
    if (kind === "k") {
      const o = c.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      o.connect(g); o.start(t); o.stop(t + 0.3);
      g.gain.setValueAtTime(0.55 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    } else if (kind === "s" || kind === "r") {
      const hp = this.filter("bandpass", 1800, 0.8); hp.connect(g);
      this.noiseSrc(t, t + 0.2, hp);
      const o = c.createOscillator(); o.type = "triangle"; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
      o.connect(g); o.start(t); o.stop(t + 0.1);
      const v = kind === "r" ? 0.14 : 0.3;
      g.gain.setValueAtTime(v * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === "r" ? 0.08 : 0.18));
    } else if (kind === "h" || kind === "o") {
      const hp = this.filter("highpass", 7000); hp.connect(g);
      this.noiseSrc(t, t + 0.3, hp);
      const len = kind === "o" ? 0.22 : 0.045;
      g.gain.setValueAtTime(0.16 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    } else if (kind === "t") {
      const o = c.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.25);
      o.connect(g); o.start(t); o.stop(t + 0.5);
      const lp = this.filter("lowpass", 600); lp.connect(g); this.noiseSrc(t, t + 0.06, lp);
      g.gain.setValueAtTime(0.45 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    } else if (kind === "c") {
      const hp = this.filter("highpass", 4000); hp.connect(g);
      this.noiseSrc(t, t + 1.4, hp, 0.8);
      g.gain.setValueAtTime(0.16 * vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    }
  }

  // ==================== MUSIC SEQUENCER ====================

  track(name) {
    if (!this.compiled[name]) this.compiled[name] = compileTrack(TRACKS[name]);
    return this.compiled[name];
  }

  playTrack(name) {
    if (!this._musicEnabled || !this.ready() || !TRACKS[name]) return;
    if (this.current && this.current.name === name) return;
    const now = this.ctx.currentTime;
    if (this.current) this.fadeOut(this.current, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    const level = TRACKS[name].gain || 1;
    gain.gain.linearRampToValueAtTime(level, now + (this.current ? FADE : 0.4));
    gain.connect(this.musicBus);
    gain.connect(this.musicSend);
    // index events by step for fast lookup
    const t = this.track(name);
    const byStep = Array.from({ length: t.length }, () => []);
    t.parts.forEach((p) => p.ev.forEach((e) => byStep[e[0] % t.length].push([p, e])));
    this.current = { name, track: t, byStep, gain, step: 0, time: now + 0.08 };
    if (!this.timer) this.timer = setInterval(() => this.schedule(), TICK_MS);
  }

  fadeOut(tr, now) {
    tr.gain.gain.cancelScheduledValues(now);
    tr.gain.gain.setValueAtTime(tr.gain.gain.value, now);
    tr.gain.gain.linearRampToValueAtTime(0.0001, now + FADE);
    const g = tr.gain;
    setTimeout(() => { try { g.disconnect(); } catch (e) { /* already gone */ } }, (FADE + 3) * 1000);
  }

  // until: schedule up to this time instead of the live lookahead (used by tools/audio for offline renders)
  schedule(until = null) {
    const cur = this.current;
    if (!cur || !this.ctx) return;
    if (until === null && this.ctx.state === "suspended") return;
    const t = cur.track;
    const stepDur = 60 / t.bpm / (t.steps / 4);
    const horizon = until ?? this.ctx.currentTime + LOOKAHEAD;
    if (until === null && cur.time < this.ctx.currentTime - 0.5) cur.time = this.ctx.currentTime + 0.05;   // tab was asleep: resync
    while (cur.time < horizon) {
      for (const [p, e] of cur.byStep[cur.step]) {
        const vol = p.vol * e[3];
        if (p.inst === "drums") this.drum(e[1], cur.time, vol, cur.gain);
        else this.voice(p.inst, cur.time, freq(e[1]), e[2] * stepDur, vol * 2, cur.gain, null);
      }
      cur.step = (cur.step + 1) % t.length;
      cur.time += stepDur;
    }
  }

  stopMusic() {
    if (this.current && this.ctx) this.fadeOut(this.current, this.ctx.currentTime);
    this.current = null;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  // The track that fits the current scene
  sceneTrack() {
    if (this.mode === "title") return "title";
    const s = this.scene;
    if (s.boss) return s.boss === "satan" ? "finale" : "boss";
    if (s.place === "hub" || !AREA_TRACK[s.place]) return s.night ? "night" : "hub";
    return AREA_TRACK[s.place];
  }

  refreshMusic() { if (this.mode && this._musicEnabled) this.playTrack(this.sceneTrack()); }

  /** Called every frame by main.js; switches tracks only when the place, night or boss changes */
  setScene(place, night = false, boss = null) {
    const s = this.scene;
    if (s.place === place && s.night === Boolean(night) && s.boss === (boss || null)) return;
    this.scene = { place, night: Boolean(night), boss: boss || null };
    if (this.mode === "game") this.refreshMusic();
  }

  startTitleBGM() { if (!this._musicEnabled || this.isMuted) return; this.mode = "title"; this.refreshMusic(); }
  stopTitleBGM() { if (this.mode === "title") { this.mode = null; this.stopMusic(); } }
  startGameplayBGM() { if (!this._musicEnabled || this.isMuted) return; this.mode = "game"; this.refreshMusic(); }
  stopGameplayBGM() { if (this.mode === "game") { this.mode = null; this.stopMusic(); } }
  stopAllBGM() { this.mode = null; this.stopMusic(); }

  /** Short fanfare on the SFX bus (levelUp, awakening, victory, gameOver, quest) */
  playJingle(name) {
    if (!this.sfxEnabled || !this.ready()) return;
    const j = JINGLES[name];
    if (!j) return;
    if (this.ctx.currentTime < (this.jingleUntil || 0)) return;   // one fanfare at a time (e.g. victory, then the quest step it unlocks)
    const step = 60 / j.bpm / 4, t0 = this.ctx.currentTime + 0.02;
    this.jingleUntil = t0 + Math.max(...j.notes.map(([s, , len]) => s + len)) * step;
    // duck the music under the jingle
    if (this.musicBus) { const g = this.musicBus.gain, n = this.ctx.currentTime; g.cancelScheduledValues(n); g.setValueAtTime(g.value, n); g.linearRampToValueAtTime(0.36 * this.musicLevel(), n + 0.05); g.setTargetAtTime(this.musicLevel(), n + 1.6, 0.4); }
    j.notes.forEach(([s, note, len]) => this.voice(j.inst, t0 + s * step, freq(midi(note)), len * step, 1.6, this.sfxBus, this.sfxSend));
  }

  // ==================== SOUND EFFECTS ====================

  /** Gain node on the SFX bus for one effect, or null when muted / off screen / too soon after the same effect */
  sfx(x = null, y = null, vol = 1, name = null, minGap = 0.03) {
    if (!this.sfxEnabled || !this.ready()) return null;
    const v = this.getPositionalVolume(x, y) * vol;
    if (v <= 0.02) return null;
    const now = this.ctx.currentTime;
    if (name) { if (now - (this.lastPlayed[name] ?? -Infinity) < minGap) return null; this.lastPlayed[name] = now; }
    const g = this.ctx.createGain();
    g.gain.value = v;
    g.connect(this.sfxBus);
    return g;
  }

  // a pitched blip with an envelope: shape, from → to Hz over dur
  sweep(dest, type, f0, f1, t, dur, peak, send = false) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + Math.min(0.01, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); if (send) g.connect(this.sfxSend);
    o.start(t); o.stop(t + dur + 0.05);
  }

  // filtered noise burst
  burst(dest, t, dur, peak, type, f0, f1 = f0, q = 1, send = false) {
    const f = this.filter(type, f0, q), g = this.ctx.createGain();
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + Math.min(0.01, dur * 0.15)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    f.connect(g); g.connect(dest); if (send) g.connect(this.sfxSend);
    this.noiseSrc(t, t + dur + 0.05, f);
  }

  get now() { return this.ctx.currentTime; }

  // ---- UI ----
  playSelectMove() { const d = this.sfx(null, null, 1, "move", 0.04); if (!d) return; this.sweep(d, "square", 990, 1180, this.now, 0.045, 0.22); }
  playSelectConfirm() {
    const d = this.sfx(null, null, 1, "confirm", 0.08); if (!d) return;
    const t = this.now;
    [659.25, 987.77, 1318.5].forEach((f, i) => this.voice("bell", t + i * 0.06, f, 0.3, 0.5, d, this.sfxSend));
  }
  playUiOpen() { const d = this.sfx(null, null, 1, "ui", 0.05); if (!d) return; this.burst(d, this.now, 0.09, 0.3, "bandpass", 1200, 3000, 2); this.sweep(d, "triangle", 520, 780, this.now, 0.08, 0.22); }
  playUiClose() { const d = this.sfx(null, null, 1, "ui", 0.05); if (!d) return; this.burst(d, this.now, 0.08, 0.28, "bandpass", 2600, 1000, 2); this.sweep(d, "triangle", 700, 460, this.now, 0.08, 0.2); }

  // ---- melee and hits ----
  playSlash(x = null, y = null) {
    const d = this.sfx(x, y, 1, "slash", 0.04); if (!d) return;
    const t = this.now;
    this.burst(d, t, 0.14, 0.9, "bandpass", 3200, 900, 1.4);   // whoosh
    this.sweep(d, "sawtooth", 1400, 500, t, 0.06, 0.1);           // blade ring
  }

  playHitEnemy(isCritical = false, x = null, y = null) {
    if (isCritical) { this.playCriticalHit(x, y); return; }
    const d = this.sfx(x, y, 1, "hit", 0.035); if (!d) return;
    const t = this.now;
    this.sweep(d, "sine", 190, 60, t, 0.12, 0.4);                 // body thud
    this.burst(d, t, 0.06, 0.24, "bandpass", 2400, 1200, 1);       // crack
  }

  playCriticalHit(x = null, y = null) {
    const d = this.sfx(x, y, 1.1, "crit", 0.05); if (!d) return;
    const t = this.now;
    this.sweep(d, "sine", 240, 45, t, 0.22, 0.5);
    this.burst(d, t, 0.1, 0.32, "highpass", 3000, 1500, 1);
    this.sweep(d, "triangle", 1760, 1320, t + 0.02, 0.16, 0.12, true);   // bright ping
  }

  playHitPlayer(x = null, y = null) {
    const d = this.sfx(x, y, 1, "hurt", 0.08); if (!d) return;
    const t = this.now;
    this.sweep(d, "square", 300, 90, t, 0.16, 0.14);
    this.sweep(d, "sine", 140, 50, t, 0.2, 0.4);
    this.burst(d, t, 0.08, 0.18, "lowpass", 1200, 300);
  }
  playPlayerHurt(x = null, y = null) { this.playHitPlayer(x, y); }

  playGuard(x = null, y = null) {
    const d = this.sfx(x, y, 1, "guard", 0.05); if (!d) return;
    const t = this.now;
    this.voice("anvil", t, 520, 0.2, 1.4, d, this.sfxSend);
    this.burst(d, t, 0.05, 0.2, "highpass", 4000);
  }

  playDash(x = null, y = null) {
    const d = this.sfx(x, y, 1, "dash", 0.06); if (!d) return;
    this.burst(d, this.now, 0.22, 0.9, "bandpass", 600, 2600, 1.2);
  }
  playDodge(x = null, y = null) {
    const d = this.sfx(x, y, 0.9, "dodge", 0.08); if (!d) return;
    const t = this.now;
    this.burst(d, t, 0.18, 0.7, "bandpass", 2400, 700, 1.5);
    this.burst(d, t + 0.1, 0.08, 0.3, "lowpass", 500, 200);
  }

  // ---- class skills ----
  playForceSphere(x = null, y = null) {
    const d = this.sfx(x, y, 1, "ki", 0.05); if (!d) return;
    const t = this.now;
    this.sweep(d, "sine", 220, 660, t, 0.18, 0.32, true);
    this.sweep(d, "triangle", 330, 990, t, 0.18, 0.12);
    this.burst(d, t, 0.2, 0.25, "bandpass", 800, 2400, 3);
  }

  playMeteorCast(x = null, y = null) {
    const d = this.sfx(x, y, 1, "meteorCast", 0.2); if (!d) return;
    const t = this.now;
    this.sweep(d, "sine", 2400, 300, t, 0.7, 0.3, true);   // falling whistle
    this.burst(d, t, 0.7, 0.25, "bandpass", 3000, 600, 4);
  }

  playMeteorExplosion(x = null, y = null) {
    const d = this.sfx(x, y, 1.2, "boom", 0.06); if (!d) return;
    const t = this.now;
    this.sweep(d, "sine", 120, 30, t, 0.6, 0.7);
    this.burst(d, t, 0.9, 0.5, "lowpass", 2400, 120, 0.7, true);
    this.burst(d, t + 0.05, 0.5, 0.14, "highpass", 3000, 6000);   // crackle
  }

  playThunder(x = null, y = null) {
    const d = this.sfx(x, y, 1, "thunder", 0.07); if (!d) return;
    const t = this.now;
    this.burst(d, t, 0.06, 0.4, "highpass", 2500);            // crack
    this.burst(d, t + 0.03, 1.1, 0.35, "lowpass", 900, 80, 0.7, true);   // rumble
    this.sweep(d, "sawtooth", 300 + Math.random() * 200, 60, t, 0.12, 0.08);
  }

  playArrowShoot(x = null, y = null) {
    const d = this.sfx(x, y, 1, "arrow", 0.04); if (!d) return;
    const t = this.now;
    this.voice("pluck", t, 196, 0.1, 1.2, d, null);                 // string twang
    this.burst(d, t + 0.01, 0.16, 0.45, "bandpass", 4000, 1500, 2);  // flight
  }

  playFalconScreech(x = null, y = null) {
    const d = this.sfx(x, y, 0.9, "falcon", 0.3); if (!d) return;
    const t = this.now;
    const o = this.ctx.createOscillator(), m = this.ctx.createOscillator(), mg = this.ctx.createGain(), g = this.ctx.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(1900, t); o.frequency.linearRampToValueAtTime(2600, t + 0.08); o.frequency.exponentialRampToValueAtTime(1300, t + 0.35);
    m.frequency.value = 38; mg.gain.value = 260; m.connect(mg); mg.connect(o.frequency);
    const bp = this.filter("bandpass", 2400, 3);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.4, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(bp); bp.connect(g); g.connect(d); g.connect(this.sfxSend);
    o.start(t); m.start(t); o.stop(t + 0.4); m.stop(t + 0.4);
  }

  playHolyBurst(x = null, y = null) {
    const d = this.sfx(x, y, 1, "holy", 0.08); if (!d) return;
    const t = this.now;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.voice("bell", t + i * 0.045, f, 0.6, 0.45, d, this.sfxSend));
    this.burst(d, t, 0.5, 0.05, "highpass", 6000, 9000, 1, true);
  }

  playHeal(x = null, y = null) {
    const d = this.sfx(x, y, 1, "heal", 0.1); if (!d) return;
    const t = this.now;
    [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => this.voice("bell", t + i * 0.07, f, 0.4, 0.4, d, this.sfxSend));
  }

  playForcefield(x = null, y = null) {
    const d = this.sfx(x, y, 1, "field", 0.1); if (!d) return;
    const t = this.now;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(220, t + 0.4);
    lfo.frequency.value = 24; lg.gain.value = 0.05; lfo.connect(lg); lg.connect(g.gain);
    const lp = this.filter("lowpass", 1400, 3);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(lp); lp.connect(g); g.connect(d); g.connect(this.sfxSend);
    o.start(t); lfo.start(t); o.stop(t + 0.65); lfo.stop(t + 0.65);
    for (let i = 0; i < 4; i++) this.burst(d, t + 0.05 + i * 0.09, 0.03, 0.1, "highpass", 5000);   // crackle
  }

  playDarkCast(x = null, y = null) {
    const d = this.sfx(x, y, 1, "dark", 0.15); if (!d) return;
    const t = this.now;
    this.sweep(d, "sawtooth", 220, 55, t, 0.9, 0.12, true);
    this.sweep(d, "sawtooth", 233, 58, t, 0.9, 0.1, true);   // a semitone apart: dissonance
    this.burst(d, t, 0.9, 0.18, "lowpass", 1600, 100, 1, true);
  }

  // ---- monsters ----
  playEnemyDeath(x = null, y = null) {
    const d = this.sfx(x, y, 1, "death", 0.05); if (!d) return;
    const t = this.now;
    this.sweep(d, "square", 520, 80, t, 0.22, 0.16);
    this.burst(d, t + 0.04, 0.3, 0.35, "lowpass", 1800, 200);   // poof
  }

  playBossRoar(x = null, y = null) {
    const d = this.sfx(x, y, 1.2, "roar", 1.5); if (!d) return;
    const t = this.now;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(90, t); o.frequency.linearRampToValueAtTime(140, t + 0.3); o.frequency.exponentialRampToValueAtTime(50, t + 1.4);
    lfo.frequency.value = 30; lg.gain.value = 18; lfo.connect(lg); lg.connect(o.frequency);
    const lp = this.filter("lowpass", 900, 2);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    o.connect(lp); lp.connect(g); g.connect(d); g.connect(this.sfxSend);
    o.start(t); lfo.start(t); o.stop(t + 1.55); lfo.stop(t + 1.55);
    this.burst(d, t, 1.3, 0.2, "bandpass", 500, 200, 1.5, true);
  }

  playBossCast(x = null, y = null) {
    const d = this.sfx(x, y, 1, "bossCast", 0.2); if (!d) return;
    const t = this.now;
    this.sweep(d, "triangle", 110, 440, t, 0.5, 0.4, true);
    this.burst(d, t, 0.5, 0.3, "bandpass", 300, 1800, 4, true);
  }

  playBossDeath(x = null, y = null) {
    const d = this.sfx(x, y, 1.3, "bossDeath", 2); if (!d) return;
    const t = this.now;
    this.sweep(d, "sine", 90, 25, t, 2.2, 0.6);
    this.burst(d, t, 2.4, 0.4, "lowpass", 1800, 60, 0.7, true);
    [293.66, 440, 587.33].forEach((f, i) => this.voice("choir", t + 0.6 + i * 0.1, f, 1.6, 1.2, d, this.sfxSend));
  }

  // ---- loot and world ----
  playLootPickup() {
    const d = this.sfx(null, null, 1, "loot", 0.05); if (!d) return;
    const t = this.now;
    this.voice("bell", t, 1567.98, 0.2, 0.45, d, null);
    this.voice("bell", t + 0.05, 2093, 0.3, 0.45, d, this.sfxSend);
  }
  playCoin() {
    const d = this.sfx(null, null, 1, "coin", 0.05); if (!d) return;
    const t = this.now;
    this.sweep(d, "square", 1975, 1975, t, 0.06, 0.18);
    this.sweep(d, "square", 2637, 2637, t + 0.06, 0.14, 0.18);
  }

  playPortal(x = null, y = null) {
    const d = this.sfx(x, y, 1, "portal", 0.5); if (!d) return;
    const t = this.now;
    this.burst(d, t, 1.0, 0.22, "bandpass", 300, 3000, 3, true);
    this.sweep(d, "sine", 220, 880, t, 0.9, 0.14, true);
    this.sweep(d, "sine", 330, 1320, t + 0.1, 0.8, 0.08, true);
  }

  // ---- fanfares ----
  playLevelUp() { this.playJingle("levelUp"); }
  playAwakening() { this.playJingle("awakening"); }
  playVictory() { this.playJingle("victory"); }
  playGameOver() { this.stopAllBGM(); this.playJingle("gameOver"); }
  playQuest() { this.playJingle("quest"); }

  // Unlock ceremony (level-up, Legendary/Mythic drop, Skill/Job Awakening): a sub-bass drop with a
  // little overdrive, a crystalline C6–E6–G6–C7 arpeggio ringing out over 1.8 s, and a faint
  // 440/880 Hz shimmer underneath. LEVEL is lighter; MYTHIC adds a top E7 and a detuned sparkle.
  playUnlockCeremony(rarity = "LEGENDARY") {
    const d = this.sfx(null, null, 1, "unlock", 0.25); if (!d) return;
    const c = this.ctx, t = this.now;
    const big = rarity !== "LEVEL", mythic = rarity === "MYTHIC";

    // 1. Sub-bass impact: 80 → 35 Hz in 0.25 s through a soft clipper
    const shaper = c.createWaveShaper(); shaper.curve = this.distCurve(); shaper.oversample = "2x";
    const sub = c.createGain();
    sub.gain.setValueAtTime(0.0001, t);
    sub.gain.linearRampToValueAtTime(big ? 0.9 : 0.6, t + 0.008);
    sub.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    const so = c.createOscillator(); so.type = "sine";
    so.frequency.setValueAtTime(80, t); so.frequency.exponentialRampToValueAtTime(35, t + 0.25);
    const pre = c.createGain(); pre.gain.value = 1.6;   // drive into the curve for a bit of grit
    so.connect(pre); pre.connect(shaper); shaper.connect(sub); sub.connect(d);
    so.start(t); so.stop(t + 0.5);

    // 2. Crystalline fanfare: ascending triangle tones with a sine an octave up, long exponential tails
    const notes = [1046.5, 1318.5, 1567.98, 2093.0];
    if (mythic) notes.push(2637.0);
    notes.forEach((f, i) => {
      const at = t + 0.05 + i * 0.085, end = t + 1.8;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime((big ? 0.11 : 0.08) * (1 - i * 0.08), at + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      g.connect(d); g.connect(this.sfxSend);
      this.osc("triangle", f, at, end + 0.05, g);
      const h = c.createGain(); h.gain.value = 0.35; h.connect(g);
      this.osc("sine", f * 2, at, end + 0.05, h, mythic ? 7 : 0);
    });

    // 3. Harmonic shimmer: 440 + 880 Hz with a slow tremolo, fading over 1.5 s
    const hum = c.createGain();
    hum.gain.setValueAtTime(0.0001, t);
    hum.gain.linearRampToValueAtTime(big ? 0.05 : 0.035, t + 0.12);
    hum.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    const trem = c.createGain(); trem.gain.value = 1;
    const lfo = c.createOscillator(), depth = c.createGain();
    lfo.frequency.value = 6; depth.gain.value = 0.35;
    lfo.connect(depth); depth.connect(trem.gain);
    trem.connect(hum); hum.connect(d); hum.connect(this.sfxSend);
    this.osc("sine", 440, t, t + 1.55, trem);
    this.osc("sine", 880, t, t + 1.55, trem, mythic ? -6 : 0);
    lfo.start(t); lfo.stop(t + 1.55);
  }

  // Old helper, kept for any caller that still uses it
  playTone(f, type, duration, startVol = 0.15) {
    const d = this.sfx(); if (!d) return;
    this.sweep(d, type, f, f, this.now, duration, startVol);
  }
}

export const Sound = new SoundEngine();
