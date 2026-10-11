// Brute family (BruteSprite: yeti, bears, trolls, golems, colossi, behemoths): a hunched giant with a
// barrel chest, long arms and heavy fists. Fur kinds get shaggy fringes, stone kinds ("formless" race,
// golems and colossi) get cracked plates like the tile sets' stone. Options from the code sprite:
// horns, wings, hammer, cracks (glowing seams), crystals (shoulder spikes).
// Code sprite 44×48 (feet 22,46) → painted 52×56 (feet 26,54).
import { Canvas, ramp, rgb, sh, motion, skillFx, dust, finish, taper, curve, frame, overlay, TAU } from "../monsterkit.mjs";

export const SIZE = { W: 52, H: 56 };

function seams(f, cx, cy, rx, ry, col, seed, mask, lit) {
  // cracked stone plates: dark seams where two cells meet (cells fixed to the body, so they move with it)
  const pts = [], seam = [];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU + seed, r = (k % 2 ? 0.55 : 0.2) + ((seed * 7 + k * 13) % 5) / 20;
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    if (!mask(x, y)) continue;
    let d1 = 99, d2 = 99;
    for (const [px, py] of pts) { const d = Math.hypot(x + 0.5 - px, y + 0.5 - py); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    if (d2 - d1 < 0.8) seam.push([x, y]);
  }
  const on = new Set(seam.map(([x, y]) => y * 999 + x));
  seam.forEach(([x, y]) => { f.over(x, y, col); if (lit && !on.has((y + 1) * 999 + x + 1)) f.over(x + 1, y + 1, lit); });
}

export function paint(sprite, def, dir, anim, i) {
  const { W, H } = SIZE, { fx: cx, fy } = frame(sprite, W, H), gy = fy - 1;
  const c = sprite.c, o = sprite.o || {}, m = motion(anim, i);
  const stone = def.race === "formless" || /golem|colossus|sentinel|juggernaut/i.test(def.key);
  const F = ramp(c.fur), FD = ramp(c.furD, { lift: -0.05 }), L = ramp(c.furL), FACE = ramp(c.face);
  let f = new Canvas(W, H);
  // paint fn() on its own layer, then lay it over the rest with a contour (limbs over the body)
  const part = (fn) => { const base = f; f = new Canvas(W, H); const r = fn(); const t = f; f = base; overlay(f, t); return r; };
  const side = dir === "side", back = dir === "up";
  const run = anim === "run";
  const lean = run ? 2 : m.atk === 3 ? 2 : 0;
  const by = m.bob, lx = side ? (m.lunge || 0) : 0;
  const hips = gy - 15 + by;
  const chestY = gy - 25 + by, headY = gy - 34 + by + (m.atk === 1 ? 1 : 0);

  // ---------- pieces ----------
  const leg = (hx, phase, near, s = 1) => {
    const R = near ? F : FD;
    const sw = side ? Math.sin(phase) * (run ? 4 : 3) : 0, up = side ? Math.max(0, Math.cos(phase)) * (run ? 3 : 2) : (anim === "walk" || run) ? Math.max(0, Math.cos(phase)) * 2 : 0;
    const footX = hx + sw, footY = gy - up;
    taper(f, hx, hips + 1, 4.6, (hx + footX) / 2 + (side ? 1 : 0), (hips + footY) / 2, 3.6, R);
    taper(f, (hx + footX) / 2 + (side ? 1 : 0), (hips + footY) / 2, 3.6, footX, footY - 2, 3, R);
    f.blob(footX + (side ? 1.5 : 0), footY - 1, side ? 4.5 : 3.6, 2, near ? FD : ramp(c.furD, { lift: -0.12 }));
    if (stone) f.set(footX + (side ? 4 : s * 2), footY - 2, R[4]);
    else for (let k = -1; k <= 1; k++) f.set(footX + (side ? 3 + k : k * 2), footY, R[0]);   // claws
  };
  const fist = (x, y, near, r = 3.6) => {
    f.blob(x, y, r, r * 0.9, near ? F : FD, { rim: near ? F[4] : null });
    if (!stone) { f.set(x - 1, y + r - 0.5, F[0]); f.set(x + 1, y + r - 0.5, F[0]); }
  };
  const arm = (sx, sy, hx, hy, near) => {
    const R = near ? F : FD;
    taper(f, sx, sy, 4.6, (sx + hx) / 2, (sy + hy) / 2, 3.6, R);
    taper(f, (sx + hx) / 2, (sy + hy) / 2, 3.6, hx, hy, 3, R);
    fist(hx, hy, near);
    return [hx, hy];
  };
  const fur = (x0, x1, y, step = 2) => {   // shaggy fringe along an edge
    if (stone) return;
    for (let x = x0; x <= x1; x += step) { f.over(x, y, F[1]); f.over(x + 1, y + 1, F[1]); if (!f.get(x, y + 2)) continue; f.over(x, y + 2, F[3]); }
  };
  const horns = (hx, hy, s, view) => {
    if (!o.horns) return;
    const R = ramp(c.horn || "#d8d0c0");
    if (view === "side") curve(f, [hx - 1, hy - 3], [hx - 4, hy - 9], [hx + 1, hy - 12], 1.6, 0.6, R);
    else [-1, 1].forEach((k) => curve(f, [hx + k * 4, hy - 3], [hx + k * 9, hy - 6], [hx + k * 8, hy - 12], 1.7, 0.6, R));
    return s;
  };
  const crystals = (x, y, s) => {
    if (!o.crystals) return;
    const R = ramp(c.crystal || "#bfe9ff", { lift: 0.1 });
    [[0, 0, 7], [3 * s, 2, 5], [-3 * s, 2, 5]].forEach(([dx, dy, hgt], k) => f.poly([[x + dx - 2, y + dy], [x + dx + (k ? s : 0), y + dy - hgt], [x + dx + 2, y + dy]], (px) => (px < x + dx ? R[4] : R[2])));
  };
  const cracks = (x, y, rx, ry) => {
    if (!o.cracks) return;
    const col = rgb(c.crack || "#ff7a1a"), hot = sh(c.crack || "#ff7a1a", 0.45);
    [[-0.6, -0.5, 0.1, 0.1], [0.5, -0.3, 0, 0.4], [-0.2, 0.3, 0.4, 0.7]].forEach(([a, b, a2, b2], k) => {
      const n = 8;
      for (let j = 0; j <= n; j++) {
        const t = j / n, px = x + (a + (a2 - a) * t) * rx + ((j * 3 + k) % 3 === 0 ? 1 : 0), py = y + (b + (b2 - b) * t) * ry;
        f.over(px, py, j % 3 === 1 ? hot : col);
      }
    });
  };
  const wings = (x, y, s, flap) => {
    if (!o.wings) return;
    const R = ramp(c.wing || "#2a1f40"), Rd = ramp(c.wingD || "#171026");
    const tip = [x + s * 20, y - 12 - flap * 3];
    for (let k = 0; k < 4; k++) {
      const fx2 = x + s * (8 + k * 4), fy2 = y + 8 + k * 2 - flap;
      f.poly([[x, y], tip, [fx2, fy2]], k % 2 ? Rd[2] : R[2]);
      curve(f, [x, y], [x + s * 10, y - 8 - flap * 2], tip, 1, 0.5, Rd);
    }
  };
  const hammer = (hx, hy, mode) => {
    if (!o.hammer) return;
    const R = ramp(c.hammer || "#3b3f4a"), H2 = ramp(c.hammerL || "#8a99ab"), wood = ramp("#7a5230");
    if (mode === "up") { taper(f, hx, hy, 1, hx, hy - 8, 1, wood); f.blob(hx, hy - 11, 7, 3.6, R, { rim: H2[3] }); f.set(hx - 6, hy - 13, H2[4]); }
    else if (mode === "slam") { taper(f, hx, hy, 1, hx + 4, hy + 2, 1, wood); f.blob(hx + 8, gy - 3, 4, 6, R, { rim: H2[3] }); }
    else { taper(f, hx, hy - 10, 1, hx, hy + 4, 1, wood); f.blob(hx, hy - 13, 5.5, 3.4, R, { rim: H2[3] }); f.set(hx - 4, hy - 15, H2[4]); }
  };
  const face = (hx, hy, view) => {
    const eye = rgb(c.eye || "#38bdf8"), glow = sh(c.eye || "#38bdf8", 0.5), mouth = sh(c.face, -0.6);
    if (view === "side") {
      f.blob(hx + 3, hy + 1.5, 3.8, 3.2, FACE);
      f.set(hx + 2, hy - 1, F[1]); f.set(hx + 3, hy - 1, F[1]); f.set(hx + 4, hy - 1, F[1]);   // brow
      f.set(hx + 3, hy, eye); f.set(hx + 4, hy, glow);
      if (m.strike || m.charge > 2) { f.set(hx + 4, hy + 3, mouth); f.set(hx + 5, hy + 3, mouth); f.set(hx + 5, hy + 2, rgb("#ffffff")); f.set(hx + 3, hy + 3, rgb("#ffffff")); }
      else { f.set(hx + 4, hy + 3, mouth); f.set(hx + 5, hy + 3, mouth); }
    } else {
      f.blob(hx, hy + 1.5, 4.8, 3.8, FACE);
      for (let x = -3; x <= 3; x++) f.set(hx + x, hy - 1, F[1]);
      f.set(hx - 2, hy, eye); f.set(hx + 2, hy, eye); f.set(hx - 1, hy, glow); f.set(hx + 3, hy, F[0]);
      const open = m.strike || m.charge > 2;
      for (let x = -2; x <= 2; x++) f.set(hx + x, hy + 3, mouth);
      if (open) { f.set(hx - 2, hy + 3, rgb("#ffffff")); f.set(hx + 2, hy + 3, rgb("#ffffff")); for (let x = -1; x <= 1; x++) f.set(hx + x, hy + 4, mouth); }
    }
  };

  // ---------- views ----------
  const flap = Math.round(Math.sin(m.ph) * 2);
  if (side) {
    const bx = cx - 1 + lx + lean;
    const hx = bx + 8 + lean, hy = headY + lean;
    wings(bx - 3, chestY - 6, -1, flap);
    // far arm (behind)
    let farHand;
    if (m.atk === 1) farHand = arm(bx - 1, chestY - 5, bx - 2, chestY - 20, false);
    else if (m.atk === 2) farHand = arm(bx - 1, chestY - 4, bx + 10, gy - 6, false);
    else farHand = arm(bx - 1, chestY - 4, bx - 1 - m.swing * 4, gy - 9 + Math.abs(m.swing), false);
    leg(cx - 3 + lx, m.ph + Math.PI, false);
    // torso: back hump + chest
    f.blob(bx - 2, chestY, 10.5, 10, F, { rim: F[4], lean: lean * 0.08 });
    f.blob(bx + 4, chestY + 2, 7.5, 8, F, { rim: F[4] });
    f.blob(bx + 5, chestY + 4, 4.5, 5.5, stone ? F : L);
    if (stone) seams(f, bx, chestY, 13, 11, F[0], 1.3, (x, y) => f.get(x, y), F[4]);
    fur(bx - 10, bx + 4, chestY - 10, 2);
    cracks(bx + 1, chestY + 1, 9, 8);
    crystals(bx - 4, chestY - 8, -1);
    leg(cx + 3 + lx, m.ph, true);
    // head
    part(() => { f.blob(hx, hy, 6, 5.4, F, { rim: F[4] }); face(hx, hy, "side"); horns(hx, hy, 1, "side"); });
    // near arm
    const hand = part(() => {
      const h = m.atk === 1 ? arm(bx + 3, chestY - 5, bx + 4, chestY - 22, true)
        : m.atk === 2 ? arm(bx + 3, chestY - 4, bx + 16, gy - 5, true)
        : m.atk === 3 ? arm(bx + 3, chestY - 4, bx + 12, gy - 8, true)
        : arm(bx + 3, chestY - 4, bx + 4 + m.swing * 4, gy - 9 + Math.abs(m.swing), true);
      hammer(h[0], h[1], m.atk === 1 ? "up" : m.atk === 2 ? "slam" : "hold");
      return h;
    });
    void hand;
    if (run) dust(f, cx - 12, gy, i);
    skillFx(f, m, cx, chestY, gy, c.eye || "#38bdf8", m.atk === 2 ? [bx + 18, gy - 2] : null);
    return finish(f);
  }

  // front / back
  const bx = cx;
  const hx = bx, hy = headY + (back ? -1 : 1);
  if (!back) wings(bx, chestY - 6, -1, flap), wings(bx, chestY - 6, 1, flap);
  if (back) { f.blob(hx, hy, 5.6, 5, FD); horns(hx, hy, 1, "front"); }
  const walking = anim === "walk" || run;
  leg(bx - 5, walking ? m.ph : 0, true, -1);
  leg(bx + 5, walking ? m.ph + Math.PI : 0, !back, 1);
  f.blob(bx, chestY, 12.5, 10.5, F, { rim: F[4] });
  if (!back) f.blob(bx, chestY + 3, 7, 6, stone ? F : L);
  else for (let y = -8; y <= 7; y++) f.over(bx, chestY + y, F[1]);   // spine
  if (stone) seams(f, bx, chestY, 13, 11, F[0], back ? 2.1 : 0.7, (x, y) => f.get(x, y), F[4]);
  fur(bx - 11, bx + 11, chestY - 10, 3);
  cracks(bx, chestY, 10, 9);
  crystals(bx - 9, chestY - 8, -1); crystals(bx + 9, chestY - 8, 1);
  if (!back) part(() => { f.blob(hx, hy, 6, 5.4, F, { rim: F[4] }); face(hx, hy, "front"); horns(hx, hy, 1, "front"); });
  [-1, 1].forEach((s) => part(() => {
    const sx = bx + s * 11, sy = chestY - 4, sw = walking ? s * m.swing * 2 : 0;
    const h = m.atk === 1 ? arm(sx, sy, bx + s * 7, chestY - 22, true)
      : m.atk === 2 ? arm(sx, sy, bx + s * 6, gy - 4, true)
      : arm(sx, sy, bx + s * 15, gy - 9 + sw, true);
    if (s > 0) hammer(h[0], h[1], m.atk === 1 ? "up" : m.atk === 2 ? "slam" : "hold");
  }));
  if (back) wings(bx, chestY - 6, -1, flap), wings(bx, chestY - 6, 1, flap);
  if (run) { dust(f, bx - 10, gy, i); dust(f, bx + 12, gy, i + 1); }
  skillFx(f, m, cx, chestY, gy, c.eye || "#38bdf8", m.atk === 2 ? [bx, gy - 2] : null);
  return finish(f);
}
