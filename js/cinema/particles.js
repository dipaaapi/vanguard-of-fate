// ==================== CINEMA PARTICLES ====================
// HD particles for js/cinema/engine.js. Every particle lives in the art's native coordinates at a
// depth z, so it drifts with the camera's parallax, and it is blurred into soft bokeh when it is
// far from the focus depth. Ambient fields wrap round their area; bursts live once and fade.
//   field types: embers, sparks, motes, dust, spores, snow, blizzard, rain, ash, miasma, petals, stars
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Soft round sprite per colour: white-hot core → colour → transparent
const sprites = new Map();
function sprite(color, hard = false) {
  const key = color + (hard ? "h" : "");
  if (!sprites.has(key)) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (hard) {
      rg.addColorStop(0, color); rg.addColorStop(0.55, color); rg.addColorStop(0.8, color + "55"); rg.addColorStop(1, color + "00");
    } else {
      rg.addColorStop(0, "#ffffff"); rg.addColorStop(0.18, color); rg.addColorStop(0.45, color + "66"); rg.addColorStop(1, color + "00");
    }
    g.fillStyle = rg;
    g.fillRect(0, 0, 64, 64);
    sprites.set(key, c);
  }
  return sprites.get(key);
}

// type → behaviour defaults
const TYPES = {
  embers:  { add: true,  size: [0.8, 2.2], vx: [-0.15, 0.15], vy: [-0.7, -0.25], wob: 0.25, colors: ["#ffb347", "#ff7a1a", "#ffe08a"], flicker: 0.5 },
  sparks:  { add: true,  size: [0.6, 1.4], vx: [-0.6, 0.6], vy: [-1.4, -0.5], wob: 0.1, colors: ["#fff1c4", "#ffb347"], flicker: 0.7 },
  motes:   { add: true,  size: [0.7, 1.8], vx: [-0.08, 0.08], vy: [-0.25, -0.06], wob: 0.35, colors: ["#fde68a", "#ffffff"], flicker: 0.4 },
  dust:    { add: true,  size: [0.5, 1.2], vx: [-0.05, 0.08], vy: [-0.04, 0.05], wob: 0.2, colors: ["#fff3c4"], flicker: 0.3, alpha: 0.6 },
  spores:  { add: true,  size: [0.8, 2], vx: [-0.12, 0.12], vy: [-0.18, 0.05], wob: 0.5, colors: ["#d9f99d", "#86efac", "#22d3ee"], flicker: 0.5 },
  stars:   { add: true,  size: [0.4, 1.1], vx: [0, 0], vy: [0, 0], wob: 0, colors: ["#ffffff", "#c7d2fe"], flicker: 0.8 },
  snow:    { add: false, size: [0.7, 1.8], vx: [-0.3, 0.1], vy: [0.35, 0.9], wob: 0.4, colors: ["#ffffff", "#e8f0fa"], alpha: 0.9 },
  blizzard:{ add: false, size: [0.6, 1.6], vx: [1.6, 3.2], vy: [0.6, 1.4], wob: 0.3, colors: ["#ffffff", "#e8f0fa"], alpha: 0.85, streak: 0.6 },
  rain:    { add: false, size: [0.5, 0.8], vx: [-1.1, -0.8], vy: [5, 7.5], wob: 0, colors: ["#9fb8d8", "#c8d8ee"], alpha: 0.42, streak: 1 },
  ash:     { add: false, size: [0.6, 1.5], vx: [-0.25, 0.1], vy: [0.12, 0.45], wob: 0.5, colors: ["#5a4a48", "#7a6a66", "#3a2e2e"], alpha: 0.75 },
  petals:  { add: false, size: [0.9, 1.6], vx: [0.2, 0.6], vy: [0.15, 0.4], wob: 0.8, colors: ["#fbcfe8", "#fde68a", "#ffffff"], alpha: 0.9, hard: true },
  miasma:  { add: false, size: [8, 18], vx: [-0.12, 0.12], vy: [-0.35, -0.12], wob: 0.3, colors: ["#5b2a86", "#3b0f5c", "#7e22ce"], alpha: 0.16 }
};

export class Particles {
  constructor() { this.list = []; this.fields = []; }

  clear() { this.list.length = 0; this.fields.length = 0; }

  /** Ambient field: { type, n, x0, x1, y0, y1, z: [near, far] | number, colors, wind } */
  add(def) {
    const T = TYPES[def.type] || TYPES.motes;
    const f = { ...T, ...def, T };
    f.x0 ??= -30; f.x1 ??= 510; f.y0 ??= -20; f.y1 ??= 290;
    this.fields.push(f);
    for (let i = 0; i < (def.n ?? 60); i++) this.list.push(this.spawn(f, true));
  }

  spawn(f, anywhere) {
    const [zA, zB] = Array.isArray(f.z) ? f.z : [f.z ?? 0.4, f.z ?? 1.6];
    const z = rand(zA, zB);
    const down = f.vy[0] > 0, up = f.vy[1] < 0;
    return {
      f, z,
      x: rand(f.x0, f.x1),
      y: anywhere ? rand(f.y0, f.y1) : down ? f.y0 : up ? f.y1 : rand(f.y0, f.y1),
      vx: rand(f.vx[0], f.vx[1]) + (f.wind || 0), vy: rand(f.vy[0], f.vy[1]),
      size: rand(f.size[0], f.size[1]),
      color: pick(f.colors), ph: Math.random() * TAU, life: Infinity, max: Infinity
    };
  }

  /** One-shot burst: { x, y, z, n, colors, speed, life, gravity, pull: {x, y, k}, size, add } */
  burst(b) {
    for (let i = 0; i < (b.n ?? 20); i++) {
      const a = b.angle != null ? b.angle + rand(-(b.spread ?? 0.4), b.spread ?? 0.4) : rand(0, TAU);
      const sp = rand(0.2, 1) * (b.speed ?? 1.2);
      const life = rand(0.6, 1) * (b.life ?? 70);
      this.list.push({
        f: { add: b.add ?? true, wob: 0, flicker: 0.3, alpha: b.alpha ?? 1, hard: b.hard, streak: b.streak },
        z: b.z ?? 1, x: b.x + rand(-(b.rx ?? 0), b.rx ?? 0), y: b.y + rand(-(b.ry ?? 0), b.ry ?? 0),
        vx: Math.cos(a) * sp + (b.vx ?? 0), vy: Math.sin(a) * sp + (b.vy ?? 0), g: b.gravity ?? 0, pull: b.pull,
        size: rand(...(b.size || [0.6, 1.6])), color: pick(b.colors || ["#ffffff"]), ph: Math.random() * TAU, life, max: life
      });
    }
  }

  prewarm(steps) { for (let i = 0; i < steps; i++) this.step(i); }

  step(t) {
    const L = this.list;
    for (let i = 0; i < L.length; i++) {
      const q = L[i], f = q.f;
      if (q.pull) {
        q.vx += (q.pull.x - q.x) * (q.pull.k ?? 0.002);
        q.vy += (q.pull.y - q.y) * (q.pull.k ?? 0.002);
        q.vx *= 0.96; q.vy *= 0.96;
      }
      if (q.g) q.vy += q.g;
      const depth = 0.55 + q.z * 0.45;          // near particles cross the frame faster
      q.x += (q.vx + Math.sin(t / 40 + q.ph) * (f.wob || 0) * 0.3) * depth;
      q.y += q.vy * depth;
      if (q.life !== Infinity) { if (--q.life <= 0) { L.splice(i--, 1); continue; } }
      else if (q.y < f.y0 - 10 || q.y > f.y1 + 10 || q.x < f.x0 - 20 || q.x > f.x1 + 20) {
        const n = this.spawn(f, false);
        if (q.x < f.x0 - 20) { n.x = f.x1 + 10; n.y = rand(f.y0, f.y1); }
        else if (q.x > f.x1 + 20) { n.x = f.x0 - 10; n.y = rand(f.y0, f.y1); }
        L[i] = n;
      }
    }
  }

  update(cine, t) { this.step(t); }

  draw(cine, focus, dof) {
    const ctx = cine.ctx;
    cine.screen();
    ctx.imageSmoothingEnabled = true;
    for (const q of this.list) {
      const f = q.f;
      const [px, py, S] = cine.project(q.x, q.y, q.z);
      const blur = Math.min(4, Math.abs(q.z - focus) * dof * 1.4);
      const fade = q.life === Infinity ? 1 : Math.min(1, q.life / 24, (q.max - q.life) / 6 + 0.2);
      const fl = f.flicker ? 1 - f.flicker * 0.5 * (1 + Math.sin(cine.tick / 6 + q.ph * 9)) * 0.6 : 1;
      let a = (f.alpha ?? 1) * fade * fl;
      if (a <= 0.01) continue;
      ctx.globalCompositeOperation = f.add ? "lighter" : "source-over";
      if (f.streak) {
        const len = (f.streak * 2.4 + Math.hypot(q.vx, q.vy) * 0.9) * S;
        const ang = Math.atan2(q.vy, q.vx);
        ctx.strokeStyle = q.color;
        ctx.globalAlpha = a * (blur > 1.5 ? 0.5 : 1);
        ctx.lineWidth = Math.max(1, q.size * S * 0.5 + blur * S * 0.3);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - Math.cos(ang) * len, py - Math.sin(ang) * len);
        ctx.stroke();
        continue;
      }
      // bokeh: out of focus → larger and fainter, keeping the same light
      const r = (q.size + blur * 1.2) * S * (f.add ? 2.2 : 1.4);
      a *= Math.min(1, (q.size * q.size) / ((q.size + blur * 0.9) ** 2) * 1.4);
      ctx.globalAlpha = Math.min(1, a);
      ctx.drawImage(sprite(q.color, f.hard || (!f.add && blur < 0.6)), px - r, py - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
}
