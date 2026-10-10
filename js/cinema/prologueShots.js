// ==================== PROLOGUE SHOTS ====================
// The Act I prologue as nine HD cinematic shots for js/cinema/engine.js. Each shot names its
// layered backdrop (assets/cinema/pro-*, painted by tools/art/scenes/pro*.js), a camera path,
// depth of field, grade, lights, fog and particles, and hooks that draw the live parts: the
// eclipse, Satan rising, the wolf, the King and the summoner, the rift, the ritual and the waking.
// Text (lines, cards, the status panel) lives in data/prologue.json under the same ids.
// Hooks get (cine, t, p): t = frames since the shot began, p = 0..1 of its length.
import { Sound } from "../audio.js";
import { span, ease } from "./engine.js";
import * as fx from "./fx.js";

const once = (c, key, fn) => { if (!c.flags[key]) { c.flags[key] = true; fn(); } };
const play = (name) => { if (Sound[name]) Sound[name](); };
const walkFrame = (t, moving, slow = 30) => Math.floor(t / (moving ? 8 : slow));

// cast: { hero, summoner, king, ronald, edgar, wolf, flags, panel: [line, line] }
export function buildShots(c) {
  return [
    // 1. THE GOLDEN AGE — a slow crane across the plains to the Citadel at golden hour
    {
      id: "golden-age", set: "pro-golden-age", dur: 560, sound: "holy",
      cam: [{ at: 0, x: 212, y: 136, zoom: 1.06 }, { at: 1, x: 262, y: 134, zoom: 1.16, ease: "inout" }],
      anchorY: 196, focus: 0.6, dof: 1.4,
      grade: { top: "#8a86c8", bottom: "#d8a080", k: 0.2 }, bloom: 0.45,
      lights: [{ x: 356, y: 112, z: 0, r: 120, color: "#ffcf8a", a: 0.45 }],
      rays: { x: 356, y: 112, z: 0, color: "#ffe2b0", n: 9, start: Math.PI * 0.5, spread: Math.PI * 0.75, len: 420, a: 0.06, width: 0.04 },
      fog: [{ y: 182, h: 26, z: 0.4, color: "#ffe6d0", a: 0.35, speed: 0.12, under: true }],
      particles: [{ type: "motes", n: 46, z: [0.5, 1.9], colors: ["#fde68a", "#ffffff", "#fbcfe8"] }, { type: "petals", n: 18, z: [1, 1.9], y0: 120 }],
      layer: {
        sky: (cine, t) => { cine.at(0.06); fx.birds(cine.ctx, t, { n: 6, y: 52, speed: 0.45, color: "#3a2e48" }); },
        plains: (cine, t) => {
          // the four Celestial Gateways pulse with sky light
          [[62, 174, 1], [150, 180, 0.8], [330, 180, 0.8], [418, 174, 1]].forEach(([x, y, s], k) => {
            const a = 0.45 + Math.sin(t / 22 + k * 1.7) * 0.25;
            fx.beam(cine.ctx, x, -60, y, 1.4 * s, "#67e8f9", a * 0.7, t + k * 9);
            fx.glow(cine.ctx, x, y, 16 * s, "#a5f3fc", a);
          });
        }
      }
    },

    // 2. THE ECLIPSE OF THE ABYSS — the sun goes dark, the earth splits, Satan rises
    {
      id: "eclipse", set: "pro-eclipse", dur: 660, sound: "thunder",
      cam: [{ at: 0, x: 240, y: 126, zoom: 1.08 }, { at: 0.42, x: 240, y: 130, zoom: 1.1 }, { at: 1, x: 240, y: 118, zoom: 1.24, ease: "inout" }],
      anchorY: 200, focus: (p) => 0.3 + span(p, 0.4, 0.7) * -0.05, dof: 1.3, shakeRoom: 4,
      grade: { top: "#6a4a9a", bottom: "#4a2a4a", k: 0.24 }, bloom: 0.75,
      offset: { satan: (p) => ({ y: 170 * (1 - ease.out(span(p, 0.44, 0.86))) }) },
      lights: [
        { x: 240, y: 222, z: 0.65, r: 130, color: "#ff3a1a", a: 0.7, flicker: 0.3, on: (p) => span(p, 0.3, 0.45) },
        { x: 240, y: 84, z: 0.22, r: 60, color: "#ff2a2a", a: 0.7, pulse: 9, on: (p) => span(p, 0.75, 0.9) }
      ],
      fog: [{ y: 196, h: 34, z: 0.5, color: "#5a2a6a", a: 0.4, speed: 0.2 }],
      particles: [{ type: "ash", n: 40, z: [0.6, 1.8] }],
      layer: {
        sky: (cine, t, p) => { cine.at(0); fx.eclipse(cine.ctx, 360, 78, 13, ease.inout(span(p, 0, 0.3)), t, { sky: "#0c0614" }); },
        satan: (cine, t, p) => {
          // the eyes open once he has risen
          const a = span(p, 0.78, 0.9) * (Math.floor(t / 90) % 7 === 0 && t % 90 < 6 ? 0.1 : 1);
          for (const ex of [234.75, 245.25]) fx.glow(cine.ctx, ex, 84.5, 14, "#ff3b3b", a);   // still in the layer's (rising) transform
        },
        plain: (cine, t, p) => {
          const g = span(p, 0.3, 0.45);
          if (g > 0) {
            once(c, "crack", () => { cine.shake = 9; play("playDarkCast"); });
            const pts = [];
            let x = 240;
            for (let y = 202; y <= 246; y += 2) { x += Math.sin(y * 1.7) * 3 + Math.sin(y * 0.4) * 2; pts.push([x, y]); }
            fx.crack(cine.ctx, pts, g, "#ff4a1c", 1);
            fx.crack(cine.ctx, pts.slice(4, 16).map(([px, py], i) => [px - i * 7, py + i * 0.3]), g, "#ff6a2a", 0.8);
            fx.crack(cine.ctx, pts.slice(8, 22).map(([px, py], i) => [px + i * 8, py - i * 0.2]), g, "#ff6a2a", 0.8);
            if (t % 3 === 0) cine.particles.burst({ x: 240, y: 214, z: 0.7, rx: 30, ry: 6, n: 1, add: false, alpha: 0.16, size: [7, 14], speed: 0.3, angle: -Math.PI / 2, spread: 0.5, vy: -0.45, life: 190, colors: ["#5b2a86", "#3b0f5c", "#7e22ce"] });
          }
        }
      },
      front: (cine, t, p) => {
        // lightning once the sky is dark
        if (p > 0.32 && !c.flags.boltT && Math.random() < 0.014) { c.flags.boltT = 10; c.flags.boltSeed = (Math.random() * 999) | 0; c.flags.boltX = 80 + Math.random() * 320; cine.flash = 0.55; cine.flashColor = "#c7d2fe"; play("playThunder"); }
        if (c.flags.boltT) {
          cine.at(0.1);
          fx.bolt(cine.ctx, c.flags.boltX, -10, c.flags.boltX + 30, 150, c.flags.boltSeed, c.flags.boltT / 10);
          c.flags.boltT--;
        }
        if (p > 0.44 && p < 0.86) cine.shake = Math.max(cine.shake, 1.6);
      }
    },

    // 3. THE SEVEN BLIGHTS — a blighted forest by blood-moon; a corrupted wolf prowls past
    {
      id: "blights", set: "pro-blights", dur: 540, sound: "dark",
      cam: [{ at: 0, x: 214, y: 142, zoom: 1.12 }, { at: 1, x: 262, y: 146, zoom: 1.18, ease: "linear" }],
      anchorY: 210, focus: 0.9, dof: 1.6,
      grade: { top: "#4a2a5a", bottom: "#2a1220", k: 0.28 }, bloom: 0.65,
      lights: [
        { x: 368, y: 166, z: 0.15, r: 110, color: "#ff6a1a", a: 0.7, flicker: 0.35 },
        { x: 120, y: 54, z: 0, r: 70, color: "#ef4444", a: 0.4 }
      ],
      fog: [{ y: 206, h: 30, z: 0.45, color: "#4a2a5a", a: 0.45, speed: 0.25, under: true }, { y: 248, h: 26, z: 1.1, color: "#3a1a40", a: 0.35, speed: 0.4 }],
      particles: [{ type: "embers", n: 40, x0: 300, x1: 440, y0: 80, y1: 200, z: [0.15, 0.6] }, { type: "ash", n: 30, z: [0.6, 1.8] }],
      layer: {
        trees: (cine, t, p) => {
          // crimson and violet eyes opening in the dark between the trees
          for (let i = 0; i < 12; i++) {
            const x = 30 + ((i * 137) % 420), y = 176 + ((i * 53) % 46), ph = (i * 71) % 200;
            if ((t + ph) % 200 > 150 || p < i / 16) continue;
            const col = i % 3 ? "#ff3b3b" : "#c084fc";
            fx.glow(cine.ctx, x, y, 5, col, 0.9);
            fx.glow(cine.ctx, x + 5, y, 5, col, 0.9);
          }
        }
      },
      actors: [{
        z: 0.9, after: "ground",
        draw: (cine, t, p) => {
          const wx = -60 + ease.inout(span(p, 0.18, 0.92)) * 620;
          c.wolf.draw(cine.ctx, wx, 252, "side", "walk", Math.floor(t / 6), false, false, 1.6);
          fx.glow(cine.ctx, wx + 14, 236, 6, "#ff3b3b", 0.7);
        }
      }]
    },

    // 4. THE DECISION OF THE KING AND THE HEIR — the throne hall, a slow push toward the dais
    {
      id: "throne", set: "pro-throne", dur: 620, sound: "move",
      cam: [{ at: 0, x: 240, y: 136, zoom: 1.06 }, { at: 1, x: 262, y: 158, zoom: 1.34, ease: "inout" }],
      anchorY: 184, focus: 0.8, dof: 1.7,
      grade: { top: "#3a3260", bottom: "#2a1a2a", k: 0.3 }, bloom: 0.7,
      lights: [51, 113, 367, 429].map((x) => ({ x, y: 90, z: 0.5, r: 46, color: "#ff9a3d", a: 0.75, flicker: 0.35 }))
        .concat([{ x: 240, y: 64, z: 0.25, r: 90, color: "#ffd9a0", a: 0.5 }]),
      rays: { x: 240, y: 70, z: 0.25, color: "#ffd9a0", n: 6, start: Math.PI * 0.36, spread: Math.PI * 0.28, len: 260, a: 0.12, width: 0.05 },
      particles: [{ type: "dust", n: 60, x0: 150, x1: 330, y0: 60, y1: 260, z: [0.5, 1.4] }],
      actors: [{
        z: 0.8, after: "hall",
        draw: (cine, t, p) => {
          c.king.draw(cine.ctx, 240, 178, "down", "idle", Math.floor(t / 30), false, false, 2);
          const walk = ease.inout(span(p, 0, 0.3)), moving = walk > 0 && walk < 1;
          c.summoner.draw(cine.ctx, 400 - walk * 92, 226, "side", moving ? "walk" : "idle", walkFrame(t, moving), true, false, 2);
          const rune = span(p, 0.7, 1);
          if (rune > 0) fx.runeCircle(cine.ctx, 252, 236, 86, 17, t, rune, { color: "#67e8f9", star: true });
        }
      }]
    },

    // 5. EARTH, 2026 — rain in the city under the eclipse; the sky tears open over the hero
    {
      id: "earth", set: "pro-earth", dur: 780, sound: "none",
      cam: [{ at: 0, x: 214, y: 140, zoom: 1.12 }, { at: 0.36, x: 236, y: 140, zoom: 1.14 }, { at: 0.62, x: 238, y: 126, zoom: 1.2 }, { at: 1, x: 240, y: 122, zoom: 1.26, ease: "inout" }],
      anchorY: 204, focus: 1, dof: 1.4, shakeRoom: 3,
      grade: { top: "#2a3a6a", bottom: "#3a2a3a", k: 0.3 }, bloom: 0.8,
      lights: [70, 300, 430].map((x) => ({ x: x + 11, y: 146, z: 1, r: 56, color: "#ffd27a", a: 0.7, flicker: 0.08 }))
        .concat([{ x: 54, y: 66, z: 1.6, r: 60, color: "#ffd27a", a: 0.6 }]),
      particles: [{ type: "rain", n: 150, z: [0.3, 1.9] }],
      layer: {
        sky: (cine, t) => { cine.at(0); fx.eclipse(cine.ctx, 110, 58, 12, 1, t, { sky: "#0a0c16", corona: "#93c5fd" }); },
        skyline: (cine, t, p) => {
          const tear = span(p, 0.4, 0.62);
          if (tear > 0) {
            once(c, "tear", () => { cine.shake = 6; cine.flash = 0.7; cine.flashColor = "#a5f3fc"; play("playThunder"); });
            fx.rift(cine.ctx, 238, 86, 120, ease.out(tear), t);
          }
        }
      },
      actors: [{
        z: 1, after: "street",
        draw: (cine, t, p) => {
          const walkP = span(p, 0, 0.3), hx = 150 + ease.inout(walkP) * 90, hy = 216;
          const tear = span(p, 0.4, 0.62), dissolve = span(p, 0.65, 0.95);
          if (tear > 0) fx.beam(cine.ctx, hx, -20, hy, 6 + tear * 8, "#a5f3fc", 0.35 * tear * (1 - dissolve * 0.5), t);
          if (dissolve < 1) {
            const moving = walkP > 0 && walkP < 1;
            cine.ctx.globalAlpha = 1 - dissolve;
            c.hero.draw(cine.ctx, hx, hy, walkP < 1 ? "side" : "up", moving ? "walk" : "idle", walkFrame(t, moving), false, tear > 0.6 && t % 10 < 5, 1.6);
            cine.ctx.globalAlpha = 1;
          }
          if (dissolve > 0 && dissolve < 1) {
            once(c, "dissolve", () => play("playHolyBurst"));
            cine.particles.burst({ x: hx, y: hy - 28, z: 1, rx: 10, ry: 22, n: 3, colors: ["#a5f3fc", "#ffe08a", "#ffffff"], speed: 0.6, vy: -1.4, life: 110, size: [0.6, 1.5], pull: { x: 238, y: 86, k: 0.0016 } });
          }
        }
      }]
    },

    // 6. THE CROSSING BETWEEN WORLDS — a tunnel of light, ending in white
    {
      id: "crossing", set: null, dur: 340, sound: "holy", bg: "#03020a",
      cam: [{ at: 0, zoom: 1.04 }, { at: 1, zoom: 1.04 }], focus: 1, dof: 0, bloom: 1.1, vignette: 0.75, sway: 0,
      particles: [{ type: "stars", n: 90, z: [0.2, 1] }],
      back: (cine, t, p) => {
        const W = cine.canvas.width, H = cine.canvas.height;
        cine.screen();
        const neb = cine.ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
        neb.addColorStop(0, p < 0.5 ? "rgba(40, 90, 140, 0.55)" : "rgba(140, 100, 40, 0.55)");
        neb.addColorStop(1, "rgba(3, 2, 10, 0)");
        cine.ctx.fillStyle = neb;
        cine.ctx.fillRect(0, 0, W, H);
        fx.warp(cine.ctx, W, H, t * (1 + p * 1.5), c.streaks, p < 0.5 ? "#8cdcff" : "#ffdc96", 1);
      },
      front: (cine, t, p) => {
        cine.at(1);
        fx.glow(cine.ctx, 240, 135, 46 + Math.sin(t / 6) * 6 + p * 60, p < 0.5 ? "#a0f0ff" : "#ffe6aa", 1);
        fx.glow(cine.ctx, 240, 135, 10, "#ffffff", 1);
        if (p > 0.84) { cine.fadeColor = "#ffffff"; cine.fade = Math.max(cine.fade, span(p, 0.84, 1) * 0.95); }
      }
    },

    // 7. THE RITUAL BENEATH THE CITADEL — the summoning; the beam strikes; the hero takes form
    {
      id: "ritual", set: "pro-ritual", dur: 780, sound: "none", fadeFrom: "#ffffff",
      cam: [{ at: 0, x: 240, y: 138, zoom: 1.08 }, { at: 0.4, x: 236, y: 148, zoom: 1.16 }, { at: 1, x: 238, y: 162, zoom: 1.3, ease: "inout" }],
      anchorY: 180, focus: 0.85, dof: 1.6, shakeRoom: 4,
      grade: { top: "#24306a", bottom: "#141a34", k: 0.32 }, bloom: 0.9,
      lights: [{ x: 64, y: 136, z: 0.5, r: 50, color: "#38bdf8", a: 0.8, flicker: 0.2 }, { x: 416, y: 136, z: 0.5, r: 50, color: "#38bdf8", a: 0.8, flicker: 0.2 },
        { x: 240, y: 200, z: 0.85, r: 130, color: "#a5f3fc", a: 0.9, on: (p) => span(p, 0.33, 0.4) * (1 - span(p, 0.62, 0.8) * 0.6) }],
      particles: [{ type: "motes", n: 40, z: [0.5, 1.8], colors: ["#7ee8fa", "#e0fbff"] }],
      actors: [{
        z: 0.85, after: "floor",
        draw: (cine, t, p) => {
          const ctx = cine.ctx, cx = 240, cy = 214;
          const charge = span(p, 0, 0.35), strike = span(p, 0.35, 0.45), form = span(p, 0.45, 0.62);
          fx.runeCircle(ctx, cx, cy, 124, 31, t, 0.45 + charge * 0.55, { color: "#67e8f9", star: true, points: ["#60a5fa", "#4ade80", "#fde68a", "#c084fc", "#f87171"] });
          fx.runeCircle(ctx, cx, cy, 82, 20, t * -1.6, 0.35 + charge * 0.6, { color: "#a5f3fc" });
          fx.runeCircle(ctx, cx, cy, 44, 11, t * 2.4, 0.3 + charge * 0.7, { color: "#e0fbff" });
          for (let k = 0; k < 4; k++) {
            const a = t / 90 + (k * Math.PI) / 2;
            fx.crystal(ctx, cx + Math.cos(a) * 112, 150 + Math.sin(a) * 18 + Math.sin(t / 20 + k) * 4, 6, 0.6 + charge * 0.4);
          }
          const chant = p < 0.62;
          c.summoner.draw(ctx, 112, 224, "side", chant ? "attack" : "idle", Math.floor(t / 14), false, false, 2);
          if (chant) fx.glow(ctx, 142, 190, 16, "#a0f0ff", 0.6 + Math.sin(t / 4) * 0.25);
          if (strike > 0 && form < 1) {
            once(c, "strike", () => { cine.shake = 10; cine.flash = 1; cine.flashColor = "#e0fbff"; play("playHolyBurst"); });
            fx.beam(ctx, cx, -40, cy - 4, 9, "#a5f3fc", 1, t);
            for (let i = 0; i < 2; i++) {
              const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 60;
              cine.particles.burst({ x: cx + Math.cos(a) * d, y: cy - 30 + Math.sin(a) * d * 0.5, z: 0.85, n: 1, speed: 0.1, life: 60, colors: ["#a0f0ff", "#ffe08a"], pull: { x: cx, y: cy - 30, k: 0.006 } });
            }
          }
          if (form > 0) {
            const fall = span(p, 0.8, 0.95);
            const sway = fall > 0 ? Math.sin(t / 5) * 2 * (1 - fall) : 0;
            ctx.save();
            ctx.translate(cx + sway, cy - 4);
            ctx.rotate((Math.PI / 2) * ease.in(fall) * 0.95);
            ctx.globalAlpha = Math.min(1, form * 1.5) * (1 - span(p, 0.93, 1));
            c.hero.draw(ctx, 0, 0, "down", "idle", 0, false, form < 0.7, 2);
            ctx.restore();
          }
          if (p > 0.9) { cine.fadeColor = "#000000"; cine.fade = Math.max(cine.fade, span(p, 0.9, 1)); }
        }
      }]
    },

    // 8. WAKING IN THE BARRACKS SANCTUARY — close on the cot, then the camera pulls back
    {
      id: "sanctuary", set: "pro-sanctuary", dur: 820, sound: "move",
      cam: [{ at: 0, x: 184, y: 166, zoom: 1.42 }, { at: 0.45, x: 196, y: 162, zoom: 1.34 }, { at: 1, x: 236, y: 150, zoom: 1.1, ease: "inout" }],
      anchorY: 150, focus: 0.85, dof: 1.5,
      grade: { top: "#d8e6ff", bottom: "#ffe2c0", k: 0.12 }, bloom: 0.6,
      lights: [{ x: 40, y: 135, z: 0.85, r: 50, color: "#ff9a3d", a: 0.6, flicker: 0.3 }, { x: 440, y: 135, z: 0.85, r: 50, color: "#ff9a3d", a: 0.6, flicker: 0.3 },
        { x: 22, y: 248, z: 1.3, r: 60, color: "#ff9a3d", a: 0.7, flicker: 0.3 }, { x: 458, y: 248, z: 1.3, r: 60, color: "#ff9a3d", a: 0.7, flicker: 0.3 }],
      rays: { x: 60, y: -40, z: 0.2, color: "#fff3c4", n: 6, start: Math.PI * 0.18, spread: Math.PI * 0.3, len: 420, a: 0.1, width: 0.05 },
      particles: [{ type: "dust", n: 50, z: [0.6, 1.8] }, { type: "motes", n: 18, z: [0.7, 1.4], colors: ["#fde68a"] }],
      actors: [{
        z: 0.85, after: "court",
        draw: (cine, t, p) => {
          const ctx = cine.ctx;
          c.ronald.draw(ctx, 96, 150, "down", "idle", Math.floor(t / 30), false, false, 1.2);
          c.edgar.draw(ctx, 384, 150, "down", "idle", Math.floor(t / 34), false, false, 1.2);
          const rise = ease.inout(span(p, 0.22, 0.38));
          ctx.save();
          ctx.translate(212 - rise * 20, 172 + rise * 34);
          ctx.rotate((-Math.PI / 2) * (1 - rise));
          c.hero.draw(ctx, 0, 0, "down", "idle", rise < 1 ? 0 : Math.floor(t / 30), false, false, 2);
          ctx.restore();
          const panel = span(p, 0.36, 0.42) * (1 - span(p, 0.56, 0.62));
          fx.statusPanel(ctx, 214, 128, 96, 24, panel, c.panel);
          const walk = ease.inout(span(p, 0.5, 0.7)), moving = walk > 0 && walk < 1;
          c.summoner.draw(ctx, 520 - walk * 252, 214, "side", moving ? "walk" : "idle", walkFrame(t, moving), true, false, 2);
        }
      }]
    },

    // 9. A DISTANT OMEN — four pillars feed a black stone under the lightning
    {
      id: "omen", set: "pro-omen", dur: 480, sound: "thunder",
      cam: [{ at: 0, x: 240, y: 140, zoom: 1.08 }, { at: 1, x: 244, y: 152, zoom: 1.24, ease: "inout" }],
      anchorY: 190, focus: 0.55, dof: 1.6,
      grade: { top: "#2a2a5a", bottom: "#141026", k: 0.32 }, bloom: 0.8,
      lights: [{ x: 240, y: 200, z: 0.55, r: 110, color: "#7346be", a: 0.6, pulse: 8 }],
      particles: [{ type: "rain", n: 110, z: [0.3, 1.9] }],
      layer: {
        crater: (cine, t, p) => {
          for (let i = 0; i < 4; i++) {
            const a = i * Math.PI / 2 + 0.6, x = 240 + Math.cos(a) * 66, y = 206 + Math.sin(a) * 16;
            fx.glow(cine.ctx, x, y - 24, 22, "#b446d2", Math.max(0.15, 0.8 - p * 0.6));
          }
          // a small exhausted silhouette, carried away into the rain
          const r = ease.inout(span(p, 0.58, 0.94));
          const ctx = cine.ctx;
          ctx.fillStyle = "#07070d";
          ctx.globalAlpha = 1 - span(p, 0.9, 1);
          ctx.fillRect(274 + r * 46, 168 - r * 2, 4, 20);
          ctx.beginPath(); ctx.arc(276 + r * 46, 165 - r * 2, 2.6, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(268 + r * 46, 173 - r * 2, 16, 3);
          ctx.globalAlpha = 1;
        }
      },
      front: (cine, t, p) => {
        const flash = Math.max(0, 1 - Math.abs((t % 96) - 14) / 7);
        if (t % 96 === 8) { cine.flash = 0.5; cine.flashColor = "#b4cdff"; play("playThunder"); }
        if (flash > 0) { cine.at(0.1); fx.bolt(cine.ctx, 362, -10, 330, 110, 7 + Math.floor(t / 96), flash); }
        if (p > 0.92) { cine.fadeColor = "#000000"; cine.fade = Math.max(cine.fade, span(p, 0.92, 1)); }
      }
    }
  ];
}
