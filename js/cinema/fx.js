// ==================== CINEMA EFFECTS ====================
// HD effects for the cinematics, drawn with the canvas transform of a depth (cine.at(z)), so the
// coordinates are the art's native 480×270 pixels but every stroke is smooth at screen resolution:
// rune circles, light beams, the eclipse, lightning, the sky rift, the warp tunnel, glowing cracks.
import { rgba } from "./engine.js";

const TAU = Math.PI * 2;

function seeded(seed) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

/** Soft additive light at a native point (in the current transform) */
export function glow(ctx, x, y, r, color, a = 1) {
  if (a <= 0.003 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, 0.6 * a));
  g.addColorStop(0.3, rgba(color, 0.25 * a));
  g.addColorStop(1, rgba(color, 0));
  const op = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.globalCompositeOperation = op;
}

// A stroke drawn twice: a wide faint halo and a thin bright core (reads as light in HD)
function lit(ctx, path, color, a, w = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = rgba(color, 0.18 * a);
  ctx.lineWidth = w * 4;
  path(); ctx.stroke();
  ctx.strokeStyle = rgba(color, 0.9 * a);
  ctx.lineWidth = w;
  path(); ctx.stroke();
  ctx.strokeStyle = rgba("#ffffff", 0.5 * a);
  ctx.lineWidth = w * 0.4;
  path(); ctx.stroke();
  ctx.restore();
}

/** Rotating rune circle on the floor (ellipse rx × ry), with an optional pentagram */
export function runeCircle(ctx, cx, cy, rx, ry, t, a, { color = "#67e8f9", star = false, points = null, spin = 1 } = {}) {
  if (a <= 0.01) return;
  const ell = (k) => () => { ctx.beginPath(); ctx.ellipse(cx, cy, rx * k, ry * k, 0, 0, TAU); };
  lit(ctx, ell(1), color, a, 0.7);
  lit(ctx, ell(0.9), color, a * 0.7, 0.45);
  // runes: short dashes and dots marching round the ring
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const n = Math.max(12, Math.round(rx / 4));
  for (let i = 0; i < n; i++) {
    const q = (t / 240) * spin + (i / n) * TAU;
    const x = cx + Math.cos(q) * rx * 0.95, y = cy + Math.sin(q) * ry * 0.95;
    ctx.fillStyle = rgba(i % 3 ? color : "#ffffff", a * (0.55 + 0.45 * Math.sin(t / 9 + i)));
    const w = i % 4 === 0 ? 2.4 : 1.1;
    ctx.fillRect(x - w / 2, y - 0.4, w, 0.8);
  }
  ctx.restore();
  if (star) {
    const pts = [];
    for (let i = 0; i < 5; i++) { const q = -Math.PI / 2 + (i * TAU) / 5 + (t / 900) * spin; pts.push([cx + Math.cos(q) * rx * 0.86, cy + Math.sin(q) * ry * 0.86]); }
    lit(ctx, () => { ctx.beginPath(); for (let i = 0; i <= 5; i++) { const p = pts[(i * 2) % 5]; if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); } }, color, a * 0.8, 0.5);
    if (points) pts.forEach((p, i) => glow(ctx, p[0], p[1], 10, points[i % points.length], a));
  }
  glow(ctx, cx, cy, rx * 0.9, color, a * 0.22);
}

/** Vertical beam of light from top to bottom, with a flickering core */
export function beam(ctx, x, top, bottom, w, color, a, t = 0) {
  if (a <= 0.01) return;
  const ww = w * (1 + Math.sin(t / 2.3) * 0.12);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createLinearGradient(x - ww * 2, 0, x + ww * 2, 0);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(0.5, rgba(color, 0.45 * a));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - ww * 2, top, ww * 4, bottom - top);
  const c = ctx.createLinearGradient(x - ww / 2, 0, x + ww / 2, 0);
  c.addColorStop(0, rgba("#ffffff", 0));
  c.addColorStop(0.5, rgba("#ffffff", 0.9 * a));
  c.addColorStop(1, rgba("#ffffff", 0));
  ctx.fillStyle = c;
  ctx.fillRect(x - ww / 2, top, ww, bottom - top);
  ctx.restore();
  glow(ctx, x, bottom - 6, ww * 6, color, a * 0.8);
}

/** The sun at (x, y); cover 0..1 slides the moon across it; at totality the corona flares */
export function eclipse(ctx, x, y, r, cover, t, { sun = "#fff2c9", corona = "#c084fc", sky = "#07040c" } = {}) {
  const total = Math.max(0, (cover - 0.92) / 0.08);
  glow(ctx, x, y, r * 7, "#ffcf8a", (1 - cover) * 0.9);
  if (cover < 0.995) {
    ctx.fillStyle = sun;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  if (total > 0) {
    // corona streamers
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 28; i++) {
      const q = (i / 28) * TAU + Math.sin(t / 90 + i) * 0.04;
      const len = r * (1.6 + 0.9 * Math.abs(Math.sin(i * 2.7 + t / 70)));
      const g = ctx.createLinearGradient(x + Math.cos(q) * r, y + Math.sin(q) * r, x + Math.cos(q) * len, y + Math.sin(q) * len);
      g.addColorStop(0, rgba("#fff6e0", 0.55 * total));
      g.addColorStop(1, rgba(corona, 0));
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(q) * r, y + Math.sin(q) * r); ctx.lineTo(x + Math.cos(q) * len, y + Math.sin(q) * len); ctx.stroke();
    }
    ctx.restore();
    glow(ctx, x, y, r * 5, corona, total * (0.8 + Math.sin(t / 11) * 0.1));
    glow(ctx, x, y, r * 2.2, "#fff6e0", total * 0.8);
    lit(ctx, () => { ctx.beginPath(); ctx.arc(x, y, r + 0.4, 0, TAU); }, "#fff6e0", total, 0.8);
    // diamond ring
    glow(ctx, x + r * 0.7, y - r * 0.7, r * 1.2, "#ffffff", total * 0.9 * (0.6 + 0.4 * Math.sin(t / 7)));
  }
  ctx.fillStyle = sky;
  const mx = x - r * 2.6 * (1 - cover);
  ctx.beginPath(); ctx.arc(mx, y - (1 - cover) * r * 0.4, r * 1.02, 0, TAU); ctx.fill();
}

/** Forked lightning from (x0, y0) toward (x1, y1); a = brightness */
export function bolt(ctx, x0, y0, x1, y1, seed, a = 1, color = "#c7d8ff") {
  if (a <= 0.02) return;
  const r = seeded(seed);
  const path = (sx, sy, ex, ey, steps, jitter) => {
    const pts = [[sx, sy]];
    for (let i = 1; i < steps; i++) {
      const k = i / steps;
      pts.push([sx + (ex - sx) * k + (r() - 0.5) * jitter, sy + (ey - sy) * k + (r() - 0.5) * jitter * 0.3]);
    }
    pts.push([ex, ey]);
    return pts;
  };
  const main = path(x0, y0, x1, y1, 14, 26);
  const draw = (pts, w) => lit(ctx, () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); }, color, a, w);
  draw(main, 1.1);
  for (let b = 0; b < 3; b++) {
    const i = 3 + Math.floor(r() * 8), [sx, sy] = main[i];
    draw(path(sx, sy, sx + (r() - 0.5) * 60, sy + 20 + r() * 40, 6, 14), 0.55);
  }
}

/** A tear in the sky: jagged glowing slit, open 0..1 */
export function rift(ctx, x, y, len, open, t, seed = 303) {
  if (open <= 0) return;
  const r = seeded(seed);
  const pts = [];
  const L = len * open;
  for (let i = 0; i <= 24; i++) pts.push([x + (r() - 0.5) * 7 + Math.sin(i * 1.7) * 2, y - L / 2 + (L * i) / 24]);
  const wid = (i) => Math.sin((i / 24) * Math.PI) * (3 + open * 7) * (1 + Math.sin(t / 5 + i) * 0.08);
  glow(ctx, x, y, 40 + L * 0.7, "#67e8f9", 0.55 * open);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const [k, col, al] of [[1.8, "#22d3ee", 0.35], [1, "#a5f3fc", 0.8], [0.4, "#ffffff", 1]]) {
    ctx.fillStyle = rgba(col, al * open);
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px - wid(i) * k, py) : ctx.moveTo(px, py)));
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] + wid(i) * k, pts[i][1]);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Glowing fissure along a polyline of [x, y, width] points, grown to `grow` (0..1) */
export function crack(ctx, pts, grow, color = "#ff4a1c", a = 1) {
  const n = Math.max(2, Math.round(pts.length * grow));
  if (grow <= 0) return;
  const path = () => { ctx.beginPath(); for (let i = 0; i < n; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, pts[i][0], pts[i][1]); };
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(10, 4, 8, 0.9)";
  ctx.lineWidth = 3.2;
  path(); ctx.stroke();
  ctx.restore();
  lit(ctx, path, color, a, 1.2);
}

/** Warp tunnel (screen space): streaks rushing out of the centre */
export function warp(ctx, W, H, t, streaks, color, a = 1) {
  const cx = W / 2, cy = H / 2, R = Math.hypot(W, H) / 2;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const s of streaks) {
    const d = ((s.d + t * s.v * 0.011) % 1);
    const d0 = d * d * R, d1 = Math.min(R, d0 + 8 + d * d * R * 0.25);
    ctx.strokeStyle = rgba(color, Math.min(1, d * 2.2) * a * s.a);
    ctx.lineWidth = 0.6 + d * 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(s.q) * d0, cy + Math.sin(s.q) * d0 * 0.7);
    ctx.lineTo(cx + Math.cos(s.q) * d1, cy + Math.sin(s.q) * d1 * 0.7);
    ctx.stroke();
  }
  ctx.restore();
}

/** Flock of birds (silhouettes with flapping wings) crossing from left to right */
export function birds(ctx, t, { n = 6, y = 50, speed = 0.5, color = "#2a2238", span = 560 } = {}) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.9;
  ctx.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const bx = ((t * (speed + i * 0.04) + i * 87) % span) - 40;
    const by = y + i * 9 + Math.sin(t / 30 + i) * 3;
    const flap = Math.sin(t / 5 + i * 1.3) * 2.2;
    ctx.beginPath();
    ctx.moveTo(bx - 4, by - flap);
    ctx.quadraticCurveTo(bx - 2, by - 1, bx, by);
    ctx.quadraticCurveTo(bx + 2, by - 1, bx + 4, by - flap);
    ctx.stroke();
  }
  ctx.restore();
}

/** Floating mana crystal (diamond) with a light */
export function crystal(ctx, x, y, s, a = 1, color = "#7ee8fa") {
  glow(ctx, x, y, s * 3.2, color, 0.7 * a);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.55, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.55, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#e0fbff";
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x - s * 0.55, y); ctx.lineTo(x, y + s * 0.2); ctx.closePath(); ctx.fill();
  ctx.restore();
}

/** Pale gold status panel ("a page only they could read") */
export function statusPanel(ctx, x, y, w, h, a, lines) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, "rgba(255, 240, 200, 0.22)");
  g.addColorStop(1, "rgba(255, 210, 120, 0.12)");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255, 226, 150, 0.85)";
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = "#fff4d6";
  ctx.font = "bold 6px Georgia, serif";
  ctx.textBaseline = "top";
  lines.forEach((ln, i) => ctx.fillText(ln, x + 5, y + 4 + i * 8, w - 10));
  ctx.restore();
  glow(ctx, x + w / 2, y + h / 2, w * 0.8, "#ffd27a", a * 0.35);
}
