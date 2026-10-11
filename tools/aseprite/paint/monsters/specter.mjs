// Spirit family (SpecterSprite: specters, wraiths, banshees, drowned and shackled souls, the sorrow wisp):
// a hooded robe that tapers into a tattered, rippling hem, a dark face with glowing eyes and long clawed
// sleeves; wisps are a floating soul-flame instead. Everything floats and bobs. Colours from the code
// sprite: robe/robeD/robeL (or body/bodyD/bodyL), eye, claw.
// Code sprite 26×32 (feet 13,30) → painted 30×36 (feet 15,34).
import { Canvas, ramp, rgb, sh, motion, skillFx, finish, taper, curve, frame, overlay, eyeCol } from "../monsterkit.mjs";

export const SIZE = { W: 30, H: 36 };

export function paint(sprite, def, dir, anim, i) {
  const { W, H } = SIZE, { fx: cx, fy } = frame(sprite, W, H), gy = fy - 1;
  const c = sprite.c, m = motion(anim, i);
  const robe = c.body || c.robe, robeD = c.bodyD || c.robeD, robeL = c.bodyL || c.robeL;
  const R = ramp(robe), RD = ramp(robeD, { lift: -0.05 }), RL = ramp(robeL), CL = ramp(c.claw || robeL);
  const eye = eyeCol(rgb(c.eye || "#c77dff")), eyeL = eyeCol(sh(c.eye || "#c77dff", 0.55)), void_ = rgb("#07050d");
  let f = new Canvas(W, H);
  const part = (fn) => { const b = f; f = new Canvas(W, H); const r = fn(); const t = f; f = b; overlay(f, t); return r; };
  const side = dir === "side", back = dir === "up";
  const float = [0, -1, -1, 0, 1, 1][(m.i + (anim === "idle" ? 0 : 2)) % 6];
  const lx = side ? (m.lunge || 0) : 0, bx = cx + lx;
  const top = gy - 27 + float + m.bob;

  if (/wisp/i.test(def.key)) {        // soul-flame: a glowing core with licking tongues of flame
    const F = ramp(robeL, { lift: 0.05 }), cy = gy - 12 + float;
    const flick = [0, 1, -1, 1, 0, -1][m.i % 6];
    for (let k = 0; k < 5; k++) {
      const dx = (k - 2) * 2 + (k % 2 ? flick : -flick), hgt = 9 - Math.abs(k - 2) * 2 + (k === 2 ? 3 : 0) + (m.charge ? 2 : 0);
      f.poly([[bx + dx - 3, cy + 2], [bx + dx + flick * 0.5, cy - hgt - 1], [bx + dx + 3, cy + 2]], (x, y) => (y < cy - hgt * 0.6 ? F[4] : y < cy - hgt * 0.2 ? F[3] : F[2]));
    }
    f.blob(bx, cy + 1, 5.5, 5, R, { rim: F[3] });
    f.blob(bx, cy + 1, 2.6, 2.4, [RL[3], RL[4], sh(robeL, 0.6), sh(robeL, 0.7), rgb("#ffffff")]);
    if (!back) { f.set(bx - 2, cy, void_); f.set(bx + 2, cy, void_); f.set(bx - 2, cy - 1, eye); f.set(bx + 2, cy - 1, eye); }
    for (let k = 0; k < 3; k++) f.spark(bx - 4 + ((m.i + k * 3) % 9), cy + 7 + ((m.i + k) % 3), k % 2 ? RL[4] : F[3]);   // embers
    skillFx(f, m, cx, cy, gy, c.eye || robeL, m.strike ? [bx, cy + 2] : null);
    return finish(f);
  }

  // robe: widening downward, the hem rippling in tatters
  const hemY = gy - 4 + float;
  const robeAt = (y) => 3.2 + (y - top - 7) * 0.33;
  for (let y = top + 6; y <= hemY + 2; y++) {
    const w = robeAt(y), sway = Math.sin((y - top) / 4 + m.ph) * (y > top + 14 ? 1 : 0.3) + (side ? -(y - top) * 0.08 * (m.lunge > 0 ? 1 : 0.4) : 0);
    for (let x = Math.floor(bx - w + sway); x <= Math.ceil(bx + w + sway); x++) {
      if (y > hemY - 3) {                                  // tatters: ragged strips
        const strip = Math.floor((x - bx + 20) / 2);
        if ((strip + m.i) % 3 === 0 && y > hemY - 1) continue;
        if ((strip * 7 + m.i) % 5 === 0 && y > hemY - 3) continue;
      }
      const t = (x - (bx - w + sway)) / (2 * w);
      f.set(x, y, t < 0.22 ? R[3] : t > 0.78 ? R[1] : (x + y) % 7 === 0 ? R[1] : R[2]);
    }
  }
  // folds
  for (let y = top + 10; y < hemY - 1; y += 1) { f.over(bx - 1 + Math.sin(y / 3) * 0.6, y, R[1]); if (!side) f.over(bx + 3, y + 1, RD[2]); }
  // arms: long sleeves ending in claws (raised in the windup, thrust on the strike)
  const arm = (s, near) => {
    const sx = bx + s * 3.5, sy = top + 10;
    const hx = side ? bx + (m.strike ? 11 : m.atk === 1 ? 5 : 6) : bx + s * (m.strike ? 6 : m.atk === 1 ? 7 : 7);
    const hy = m.atk === 1 ? top + 2 : m.strike ? top + 11 : top + 17;
    taper(f, sx, sy, 2, hx, hy, 1.6, near ? R : RD);
    [-1, 0, 1].forEach((k) => taper(f, hx + (side ? 1 : s), hy + k, 0.6, hx + (side ? 3 : s * 2.5), hy + k * 1.6 + 1, 0.4, CL));
  };
  if (!side) { part(() => arm(-1, true)); part(() => arm(1, true)); }
  else arm(1, false);
  // hood
  const hx = bx + (side ? 1 : 0), hy = top + 5;
  part(() => {
    f.blob(hx, hy, 5.2, 5.4, R, { rim: R[4] });
    curve(f, [hx - (side ? 3 : 0), hy - 4], [hx - (side ? 5 : 0), hy - 7], [hx - (side ? 7 : 0), hy - 6 + (back ? 0 : -1)], 1.4, 0.5, R);   // hood tip
    if (!back) {
      const fx = hx + (side ? 2 : 0);
      f.blob(fx, hy + 1, side ? 2.6 : 3.2, 3, [void_, void_, void_, sh("#07050d", 0.1), sh("#07050d", 0.15)]);
      if (side) { f.set(fx + 1, hy + 0.5, eye); f.set(fx + 1, hy - 0.5, eyeL); }
      else { f.set(fx - 1.2, hy + 0.5, eye); f.set(fx + 1.2, hy + 0.5, eye); f.set(fx - 1.2, hy - 0.5, eyeL); f.set(fx + 1.2, hy - 0.5, eyeL); }
      if (m.strike || m.charge > 2) for (let x = -1; x <= 1; x++) f.set(fx + x + (side ? 1 : 0), hy + 2.5, eyeL);   // wail
    }
  });
  if (/shackle|chain/i.test(def.key)) {     // chains round the wrists
    const steel = ramp("#71717a");
    for (let k = 0; k < 5; k++) f.set(bx - 4 + k * 2 + (side ? 2 : 0), top + 16 + (k % 2), steel[3 + (k % 2)]);
  }
  if (side) part(() => arm(1, true));
  skillFx(f, m, cx, top + 10, gy, c.eye || "#c77dff", m.strike ? [side ? bx + 14 : bx, top + 12] : null);
  return finish(f);
}
