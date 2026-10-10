// ==================== ACT INTRO SHOTS ====================
// One HD camera move per Act for js/actintro.js, over the Act's layered set (assets/cinema/act-N,
// the same painting as assets/banner/act-N.png split into depth layers by tools/art). Each entry:
// camera path, horizon line (anchorY), focus (a number or a rack over p), grade, lights, god rays,
// fog, particles, an accent colour for the title, and optional live effects (lightning).
import { span, ease } from "./engine.js";
import * as fx from "./fx.js";

const rack = (from, to, a = 0.15, b = 0.75) => (p) => from + (to - from) * ease.inout(span(p, a, b));
const L = (x, y, z, r, color, a = 1, more = {}) => ({ x, y, z, r, color, a, ...more });
const fire = (x, y, z, r = 46, color = "#ff9a3d") => L(x, y, z, r, color, 0.75, { flicker: 0.35 });

// Lightning every `every` frames from (x, 0) down toward (x2, y2)
const storm = (x, x2, y2, every = 150, color = "#c7d8ff") => (cine, t) => {
  const k = t % every;
  if (k === 6) { cine.flash = 0.45; cine.flashColor = color; }
  const a = Math.max(0, 1 - Math.abs(k - 10) / 6);
  if (a > 0) { cine.at(0.05); fx.bolt(cine.ctx, x, -10, x2, y2, 11 + Math.floor(t / every), a, color); }
};

export const ACT_SHOTS = {
  1: { cam: [{ at: 0, x: 262, y: 134, zoom: 1.1 }, { at: 1, x: 292, y: 146, zoom: 1.24 }], anchorY: 166, focus: rack(0.7, 1), dof: 1.4,
    grade: { top: "#9a7ad8", bottom: "#3a2050", k: 0.25 }, accent: "#c084fc",
    lights: [L(360, 44, 0, 90, "#c084fc", 0.6), L(200, 205, 0.7, 120, "#a855f7", 0.7, { pulse: 14 })],
    rays: { x: 360, y: 44, z: 0, color: "#d8b4fe", n: 8, start: Math.PI * 0.45, spread: Math.PI * 0.8, len: 380, a: 0.08 },
    fog: [{ y: 140, h: 22, z: 0.25, color: "#a8a2e0", a: 0.3, under: true }],
    particles: [{ type: "motes", n: 50, z: [0.6, 1.9], colors: ["#c084fc", "#e9d5ff"] }, { type: "miasma", n: 10, x0: 150, x1: 320, y0: 120, y1: 230, z: [0.6, 0.8] }] },
  2: { cam: [{ at: 0, x: 240, y: 132, zoom: 1.06 }, { at: 1, x: 240, y: 158, zoom: 1.26 }], anchorY: 170, focus: 0.8, dof: 1.5,
    grade: { top: "#2a3a8a", bottom: "#1a1a3a", k: 0.28 }, accent: "#5ee7ff",
    lights: [L(240, 58, 0.3, 90, "#93c5fd", 0.6), L(240, 196, 0.8, 90, "#bae6fd", 0.8, { pulse: 10 }), fire(52, 247, 0.8, 50, "#a855f7"), fire(428, 247, 0.8, 50, "#a855f7")],
    rays: { x: 240, y: 58, z: 0.3, color: "#bfdbfe", n: 7, start: Math.PI * 0.32, spread: Math.PI * 0.36, len: 260, a: 0.11 },
    particles: [{ type: "motes", n: 60, z: [0.5, 1.8], colors: ["#a5f3fc", "#ffffff"] }],
    front: (cine, t) => { cine.at(0.8); fx.beam(cine.ctx, 240, -30, 213, 7, "#e0f2fe", 0.5, t); } },
  3: { cam: [{ at: 0, x: 240, y: 118, zoom: 1.08 }, { at: 1, x: 240, y: 146, zoom: 1.22 }], anchorY: 132, focus: 0.8, dof: 1.3,
    grade: { top: "#5a3a8a", bottom: "#4a3040", k: 0.22 }, accent: "#fde68a",
    lights: [fire(40, 135, 0.8), fire(440, 135, 0.8), fire(20, 247, 0.8), fire(460, 247, 0.8), L(240, 196, 0.8, 70, "#fff7d6", 0.6, { pulse: 12 }), L(92, 36, 0, 50, "#a855f7", 0.5)],
    particles: [{ type: "motes", n: 50, z: [0.6, 1.8], colors: ["#fde68a", "#ffffff"] }, { type: "embers", n: 18, z: [0.8, 1.4], y0: 120 }] },
  4: { cam: [{ at: 0, x: 240, y: 126, zoom: 1.06 }, { at: 1, x: 240, y: 152, zoom: 1.26 }], anchorY: 180, focus: 1, dof: 1.3,
    grade: { top: "#b8b0e0", bottom: "#8a7aa8", k: 0.14 }, accent: "#fde68a",
    lights: [L(240, 54, 0.75, 50, "#fde68a", 0.8, { pulse: 15 }), L(240, 166, 0.75, 60, "#bae6fd", 0.7), fire(150, 161, 1.1, 36), fire(330, 161, 1.1, 36)],
    rays: { x: 240, y: -30, z: 0.3, color: "#fff7d6", n: 7, start: Math.PI * 0.3, spread: Math.PI * 0.4, len: 340, a: 0.14 },
    particles: [{ type: "dust", n: 60, z: [0.5, 1.8] }, { type: "motes", n: 26, x0: 140, x1: 340, y0: 20, y1: 200, z: [0.7, 1], colors: ["#fff7d6", "#bae6fd"] }] },
  5: { cam: [{ at: 0, x: 218, y: 136, zoom: 1.1 }, { at: 1, x: 258, y: 146, zoom: 1.22 }], anchorY: 176, focus: 1, dof: 1.3,
    grade: { top: "#ffd8a8", bottom: "#5a3a2a", k: 0.2 }, accent: "#93c5fd",
    lights: [L(250, 220, 1, 50, "#60a5fa", 0.8, { pulse: 8 }), fire(460, 185, 1)],
    rays: { x: 240, y: 20, z: 0.3, color: "#fff3c4", n: 6, start: Math.PI * 0.32, spread: Math.PI * 0.36, len: 280, a: 0.16 },
    particles: [{ type: "dust", n: 70, z: [0.4, 1.8] }] },
  6: { cam: [{ at: 0, x: 236, y: 140, zoom: 1.06 }, { at: 1, x: 236, y: 150, zoom: 1.22 }], anchorY: 196, focus: 1, dof: 1.6,
    grade: { top: "#3a4a9a", bottom: "#1a1a3a", k: 0.26 }, accent: "#a5b4fc",
    lights: [L(400, 44, 0, 70, "#c7d2fe", 0.5), fire(90, 188, 0.3, 26, "#ff8a3d"), fire(120, 192, 0.3, 26, "#ff8a3d"), fire(150, 186, 0.3, 26, "#ff8a3d"), fire(40, 247, 0.85), fire(440, 247, 0.85)],
    fog: [{ y: 162, h: 20, z: 0.3, color: "#3c4a86", a: 0.4, under: true }],
    particles: [{ type: "stars", n: 40, y0: 0, y1: 140, z: [0.02, 0.05] }, { type: "motes", n: 20, z: [0.8, 1.8], colors: ["#c7d2fe"] }] },
  7: { cam: [{ at: 0, x: 240, y: 152, zoom: 1.08 }, { at: 1, x: 240, y: 138, zoom: 1.26 }], anchorY: 180, focus: rack(1, 0.7, 0.3, 0.8), dof: 1.6,
    grade: { top: "#2a4a3a", bottom: "#3a1a4a", k: 0.28 }, accent: "#86efac",
    lights: [L(240, 138, 0.7, 60, "#ff3b5c", 0.8, { pulse: 9 }), L(240, 120, 0.7, 120, "#a855f7", 0.5), L(60, 230, 1, 30, "#22d3ee", 0.7), L(400, 234, 1, 34, "#a3e635", 0.6), L(200, 236, 1, 24, "#67e8f9", 0.6)],
    rays: { x: 250, y: -40, z: 0.1, color: "#b8f5a0", n: 6, start: Math.PI * 0.35, spread: Math.PI * 0.3, len: 320, a: 0.12 },
    fog: [{ y: 160, h: 36, z: 0.4, color: "#4a5a5a", a: 0.35, under: true }],
    particles: [{ type: "spores", n: 70, z: [0.4, 1.9] }] },
  8: { cam: [{ at: 0, x: 282, y: 130, zoom: 1.1 }, { at: 1, x: 322, y: 140, zoom: 1.22 }], anchorY: 140, focus: rack(1, 0.5, 0.25, 0.8), dof: 1.4, shakeRoom: 1,
    grade: { top: "#2a3a6a", bottom: "#0a1a2a", k: 0.28 }, accent: "#7dd3fc",
    lights: [L(250, 120, 0.5, 90, "#22d3ee", 0.7, { pulse: 11 }), L(330, 140, 0.5, 60, "#f0a07a", 0.35)],
    particles: [{ type: "rain", n: 160, z: [0.3, 1.9] }],
    front: storm(92, 120, 120, 170) },
  9: { cam: [{ at: 0, x: 186, y: 140, zoom: 1.1 }, { at: 1, x: 234, y: 136, zoom: 1.22 }], anchorY: 176, focus: 1, dof: 1.4,
    grade: { top: "#9fb4cc", bottom: "#3a4a6a", k: 0.2 }, accent: "#e0f2fe",
    lights: [L(320, 70, 0.3, 70, "#7dd3fc", 0.6), L(300, 176, 0.6, 40, "#bae6fd", 0.6), fire(80, 204, 1, 44)],
    fog: [{ y: 140, h: 30, z: 0.2, color: "#b8c8dc", a: 0.45, under: true }],
    particles: [{ type: "blizzard", n: 150, z: [0.3, 1.9] }, { type: "snow", n: 60, z: [0.6, 1.9] }] },
  10: { cam: [{ at: 0, x: 200, y: 138, zoom: 1.1 }, { at: 1, x: 262, y: 144, zoom: 1.22 }], anchorY: 190, focus: rack(1, 0.7, 0.3, 0.85), dof: 1.4,
    grade: { top: "#3a1010", bottom: "#6a2a10", k: 0.22 }, accent: "#fb923c",
    lights: [L(355, 150, 0.45, 110, "#ff5a1a", 0.8, { flicker: 0.2 }), L(90, 82, 0.2, 70, "#ff7a1a", 0.7, { flicker: 0.2 }), L(326, 180, 0.7, 50, "#ff7a1a", 0.7, { pulse: 7 }), L(240, 230, 0.7, 180, "#ff6a1a", 0.35)],
    particles: [{ type: "embers", n: 90, z: [0.3, 1.9] }, { type: "ash", n: 40, z: [0.4, 1.8] }] },
  11: { cam: [{ at: 0, x: 222, y: 132, zoom: 1.08 }, { at: 1, x: 268, y: 140, zoom: 1.22 }], anchorY: 128, focus: rack(0.95, 0.6, 0.3, 0.85), dof: 1.4,
    grade: { top: "#4a2a6a", bottom: "#2a1a2a", k: 0.24 }, accent: "#a5b4fc",
    lights: [L(150, 130, 0, 110, "#ff8a4a", 0.7), L(354, 176, 0.6, 70, "#6366f1", 0.6, { pulse: 12 }), L(163, 154, 0.55, 22, "#ffd27a", 0.8, { flicker: 0.2 })],
    fog: [{ y: 200, h: 20, z: 0.6, color: "#6a5a8a", a: 0.35 }],
    particles: [{ type: "motes", n: 50, z: [0.5, 1.8], colors: ["#a5b4fc", "#c7d2fe", "#6d5ea8"] }] },
  12: { cam: [{ at: 0, x: 212, y: 136, zoom: 1.08 }, { at: 1, x: 250, y: 146, zoom: 1.22 }], anchorY: 140, focus: 1, dof: 1.3,
    grade: { top: "#d8d4c6", bottom: "#4a4640", k: 0.18 }, accent: "#e7e5e4",
    lights: [L(150, 54, 0, 80, "#f4f0e4", 0.5), L(76, 162, 0.8, 40, "#ffd27a", 0.8, { flicker: 0.25 }), L(330, 170, 0.8, 70, "#bef264", 0.3, { pulse: 10 })],
    fog: [{ y: 146, h: 26, z: 0.2, color: "#d8d4c6", a: 0.45, under: true }, { y: 250, h: 30, z: 1.2, color: "#a8a08a", a: 0.25 }],
    particles: [{ type: "ash", n: 50, z: [0.4, 1.8], colors: ["#d8d0b8", "#a8a08a"] }, { type: "motes", n: 20, z: [0.6, 1.6], colors: ["#f4f0e4", "#d9f99d"] }] },
  13: { cam: [{ at: 0, x: 240, y: 140, zoom: 1.06 }, { at: 1, x: 240, y: 126, zoom: 1.22 }], anchorY: 172, focus: 1, dof: 1.4,
    grade: { top: "#4a0a14", bottom: "#2a0a0a", k: 0.24 }, accent: "#f87171",
    lights: [L(240, 160, 0.35, 70, "#ff7a1a", 0.9, { flicker: 0.3 }), L(240, 30, 0, 60, "#ff3b3b", 0.6), L(240, 110, 0.35, 160, "#ff3b3b", 0.3)],
    particles: [{ type: "embers", n: 80, z: [0.3, 1.9], colors: ["#ffb347", "#ff3b3b", "#ffe08a"] }, { type: "ash", n: 40, z: [0.4, 1.8] }] },
  14: { cam: [{ at: 0, x: 240, y: 118, zoom: 1.1 }, { at: 1, x: 240, y: 150, zoom: 1.24 }], anchorY: 150, focus: rack(1, 0.6, 0.3, 0.8), dof: 1.5,
    grade: { top: "#2a0a2a", bottom: "#5a0e38", k: 0.22 }, accent: "#f43f5e",
    lights: [L(240, 262, 0, 160, "#ff3b6a", 0.6, { pulse: 13 }), L(240, 100, 0.6, 90, "#e11d48", 0.5, { pulse: 9 })],
    fog: [{ y: 212, h: 26, z: 0.5, color: "#ff6a8a", a: 0.25 }],
    particles: [{ type: "embers", n: 70, z: [0.3, 1.9], colors: ["#ff6a8a", "#ffc0d0", "#7dd3fc"] }] },
  15: { cam: [{ at: 0, x: 240, y: 118, zoom: 1.06 }, { at: 1, x: 240, y: 140, zoom: 1.24 }], anchorY: 214, focus: rack(1, 0.7, 0.35, 0.85), dof: 1.4,
    grade: { top: "#2a0a48", bottom: "#1a0a2a", k: 0.2 }, accent: "#f0abfc",
    lights: [L(240, 132, 0.7, 90, "#ffd27a", 0.9, { pulse: 10 }), L(240, 238, 0, 140, "#a855f7", 0.6)],
    rays: { x: 240, y: -20, z: 0, color: "#ffe9a8", n: 12, start: Math.PI * 0.12, spread: Math.PI * 0.76, len: 260, a: 0.12 },
    particles: [{ type: "motes", n: 70, z: [0.4, 1.9], colors: ["#f5d0fe", "#ffd27a", "#ffffff"] }, { type: "ash", n: 30, z: [0.3, 1.2], colors: ["#3a1a4a", "#5a2a6a"] }] }
};

// A story card with no Act set (startStory): drifting motes in the card's colour over a dark wash
export function storyShot(color) {
  return {
    cam: [{ at: 0, zoom: 1.04 }, { at: 1, zoom: 1.1 }], focus: 1, dof: 0.8, accent: color, bg: "#05060c",
    back: (cine) => {
      const W = cine.canvas.width, H = cine.canvas.height, g = cine.ctx.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, W * 0.6);
      g.addColorStop(0, "rgba(40, 60, 90, 0.6)");
      g.addColorStop(1, "rgba(5, 6, 12, 0)");
      cine.screen();
      cine.ctx.fillStyle = g;
      cine.ctx.fillRect(0, 0, W, H);
    },
    particles: [{ type: "motes", n: 80, z: [0.3, 1.9], colors: [color, "#fff4d6"] }]
  };
}
