// ==================== PLATFORM AMBIENCE ====================
// Particles and sky colour per place (LORE Acts VII–XV):
//   spores   — Whispering Canopy: floating spores, violet-green haze
//   storm    — Cerulean Abyss: slanting rain, lightning, blue-grey sky
//   blizzard — Frostfang: thick snow, white haze
//   embers   — Ashfall: rising embers, falling ash, red heat
//   siege    — Obsidian Citadel: burning sky, falling fireballs
//   void     — Maw of Damnation: swirling violet dust, dark edges
//   dust      — Greyhorn Badlands: drifting dust motes, warm haze
//   fenmist   — Gloomwater Fens: green will-o'-wisps, murky haze
//   gale      — Stormcrown Highlands: fast wind streaks, the odd lightning flash
//   sandstorm — Sunscorch Dunes: blowing sand, golden heat haze
//   lament    — Lamenting Strand: falling black tears, cold slate haze
//   grave     — Ossuary Fields: drifting bone dust and ember motes
//   chains    — Chainspire Descent: rising red sparks, dark edges
// The particles live in screen space (they follow the camera), so they stay cheap on a big map.

const VIEW_W = 480, VIEW_H = 270;

const KINDS = {
  spores:   { n: 46, tint: "rgba(40, 10, 60, 0.22)", colors: ["#7fffd4", "#c77dff", "#b8f2e6"], vy: [-0.25, -0.05], vx: [-0.15, 0.15], size: [1, 2], life: 1 },
  storm:    { n: 90, tint: "rgba(10, 25, 45, 0.28)", colors: ["rgba(186, 230, 253, 0.8)"], vy: [6, 8], vx: [-2, -1.4], size: [1, 1], streak: 7, flash: 0.004 },
  blizzard: { n: 120, tint: "rgba(210, 225, 240, 0.2)", colors: ["#ffffff", "#e6f0fa"], vy: [0.8, 1.8], vx: [-2.4, -1.2], size: [1, 2] },
  embers:   { n: 60, tint: "rgba(90, 20, 5, 0.22)", colors: ["#ff7a1a", "#ffd166", "#ff3b3b", "#6b5a55"], vy: [-0.9, -0.3], vx: [-0.3, 0.3], size: [1, 2] },
  siege:    { n: 50, tint: "rgba(90, 10, 15, 0.2)", colors: ["#ff7a1a", "#ffd166", "#8a8a8a"], vy: [-0.6, -0.2], vx: [-0.4, 0.2], size: [1, 2], meteors: true },
  void:     { n: 70, tint: "rgba(25, 5, 45, 0.3)", colors: ["#c77dff", "#9d4edd", "#ff7a1a"], vy: [-0.3, 0.3], vx: [-0.3, 0.3], size: [1, 2], swirl: true, vignette: true },
  dust:     { n: 40, tint: "rgba(90, 60, 30, 0.12)", colors: ["#d6b88a", "#a8a29e", "#e7d7b0"], vy: [-0.1, 0.15], vx: [0.3, 0.8], size: [1, 1] },
  fenmist:  { n: 36, tint: "rgba(20, 40, 25, 0.24)", colors: ["#bef264", "#ecfccb", "#86efac"], vy: [-0.2, 0.1], vx: [-0.12, 0.12], size: [1, 2], swirl: true },
  gale:     { n: 70, tint: "rgba(40, 60, 80, 0.12)", colors: ["rgba(241, 245, 249, 0.7)"], vy: [0.2, 0.6], vx: [3, 4.5], size: [1, 1], streak: 5, flash: 0.002 },
  lament:   { n: 60, tint: "rgba(10, 18, 32, 0.28)", colors: ["#94a3b8", "#0f172a", "#7dd3fc"], vy: [0.5, 1.1], vx: [-0.15, 0.1], size: [1, 2] },
  grave:    { n: 40, tint: "rgba(60, 55, 45, 0.18)", colors: ["#e7e5e4", "#a8a29e", "#f97316"], vy: [-0.15, 0.1], vx: [0.2, 0.6], size: [1, 1] },
  chains:   { n: 60, tint: "rgba(50, 5, 15, 0.26)", colors: ["#f43f5e", "#a1a1aa", "#fb7185"], vy: [-0.6, -0.2], vx: [-0.2, 0.2], size: [1, 2], vignette: true },
  sandstorm: { n: 110, tint: "rgba(160, 110, 40, 0.2)", colors: ["#e7c98a", "#d4a556", "#f5deb3"], vy: [0.1, 0.5], vx: [2.2, 3.6], size: [1, 2] }
};

const rand = ([a, b]) => a + Math.random() * (b - a);

export class Ambient {
  constructor(kind) {
    this.k = KINDS[kind] || null;
    this.parts = [];
    this.meteors = [];
    this.flash = 0;
    this.tick = 0;
    if (this.k) for (let i = 0; i < this.k.n; i++) this.parts.push(this.spawn(true));
  }

  spawn(anywhere) {
    const k = this.k;
    return {
      x: Math.random() * VIEW_W,
      y: anywhere ? Math.random() * VIEW_H : (k.vy[0] > 0 ? -4 : VIEW_H + 4),
      vx: rand(k.vx), vy: rand(k.vy),
      s: Math.round(rand(k.size)),
      c: k.colors[Math.floor(Math.random() * k.colors.length)],
      ph: Math.random() * Math.PI * 2
    };
  }

  update() {
    if (!this.k) return;
    const k = this.k;
    this.tick++;
    this.parts.forEach((p, i) => {
      p.ph += 0.05;
      p.x += p.vx + (k.swirl ? Math.cos(p.ph) * 0.4 : 0);
      p.y += p.vy + (k.swirl ? Math.sin(p.ph) * 0.3 : 0);
      if (p.y < -6 || p.y > VIEW_H + 6 || p.x < -10 || p.x > VIEW_W + 10) {
        this.parts[i] = this.spawn(false);
        if (p.x < -10) this.parts[i].x = VIEW_W + 5;
      }
    });
    if (k.flash && Math.random() < k.flash) this.flash = 5;
    if (k.meteors && Math.random() < 0.012) {
      this.meteors.push({ x: Math.random() * VIEW_W + 60, y: -10, vx: -2.2, vy: 3.2, life: 90 });
    }
    this.meteors.forEach((m) => { m.x += m.vx; m.y += m.vy; m.life--; });
    this.meteors = this.meteors.filter((m) => m.life > 0);
  }

  // Called inside the camera transform (above the characters)
  draw(ctx) {
    if (!this.k) return;
    const t = ctx.getTransform();
    const x0 = -t.e / t.a, y0 = -t.f / t.d;
    const k = this.k;
    ctx.save();
    ctx.fillStyle = k.tint;
    ctx.fillRect(x0, y0, VIEW_W, VIEW_H);

    if (k.streak) {
      ctx.strokeStyle = k.colors[0];
      ctx.lineWidth = 1;
      ctx.beginPath();
      this.parts.forEach((p) => {
        ctx.moveTo(x0 + p.x, y0 + p.y);
        ctx.lineTo(x0 + p.x + p.vx * 1.2, y0 + p.y + k.streak);
      });
      ctx.stroke();
    } else {
      this.parts.forEach((p) => {
        ctx.globalAlpha = k.swirl || k.vy[0] < 0 ? 0.55 + Math.sin(p.ph) * 0.35 : 0.85;
        ctx.fillStyle = p.c;
        ctx.fillRect(Math.round(x0 + p.x), Math.round(y0 + p.y), p.s, p.s);
      });
      ctx.globalAlpha = 1;
    }

    this.meteors.forEach((m) => {
      ctx.strokeStyle = "rgba(255, 122, 26, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0 + m.x, y0 + m.y);
      ctx.lineTo(x0 + m.x - m.vx * 5, y0 + m.y - m.vy * 5);
      ctx.stroke();
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(Math.round(x0 + m.x - 1), Math.round(y0 + m.y - 1), 3, 3);
    });

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flash * 0.1})`;
      ctx.fillRect(x0, y0, VIEW_W, VIEW_H);
      this.flash--;
    }

    if (k.vignette) {
      const g = ctx.createRadialGradient(x0 + VIEW_W / 2, y0 + VIEW_H / 2, 80, x0 + VIEW_W / 2, y0 + VIEW_H / 2, 280);
      g.addColorStop(0, "rgba(0, 0, 0, 0)");
      g.addColorStop(1, "rgba(10, 0, 20, 0.7)");
      ctx.fillStyle = g;
      ctx.fillRect(x0, y0, VIEW_W, VIEW_H);
    }
    ctx.restore();
  }
}
