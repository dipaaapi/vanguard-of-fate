// Serpent family (SerpentSprite): sea serpents, eels, wyrms, the naga, the hydra (three heads) and the
// leech (a round sucking mouth, no fins). The body undulates in an S with a lighter belly and a finned
// crest; the neck rises and strikes. Colours from the code sprite: body/bodyD/bodyL, belly, fin, eye.
// Code sprite 38×24 (feet 19,22) → painted 44×30 (feet 22,28).
import { Canvas, ramp, rgb, sh, motion, skillFx, finish, curve, taper, frame, overlay, eyeCol } from "../monsterkit.mjs";

export const SIZE = { W: 44, H: 30 };

export function paint(sprite, def, dir, anim, i) {
  const { W, H } = SIZE, { fx: cx, fy } = frame(sprite, W, H), gy = fy - 1;
  const c = sprite.c, m = motion(anim, i);
  const leech = /leech/i.test(def.key), hydra = /hydra/i.test(def.key);
  const B = ramp(c.body), BL = ramp(c.belly || c.bodyL), FIN = ramp(c.fin || c.bodyL), eye = eyeCol(rgb(c.eye || "#ffd166")), eyeL = eyeCol(sh(c.eye || "#ffd166", 0.5));
  let f = new Canvas(W, H);
  const part = (fn) => { const base = f; f = new Canvas(W, H); const r = fn(); const t = f; f = base; overlay(f, t); return r; };
  const side = dir === "side", back = dir === "up";
  const speed = anim === "run" ? 2 : 1, ph = m.ph * speed;
  const rise = m.atk === 1 ? -3 : m.strike ? 3 : m.charge ? -2 : 0;      // neck pulled back, then the lunge

  // one head: side or front, jaw opening on the strike
  const head = (hx, hy, view, s = 1) => {
    const open = m.strike || m.charge > 2 ? 2 : 0;
    if (view === "side") {
      f.blob(hx, hy, 3.6, 2.8, B, { rim: B[4] });
      f.blob(hx + 3, hy + 0.5, 2.8, 1.8, B);
      if (leech) { f.blob(hx + 5, hy + 0.5, 1.6, 2, BL); f.set(hx + 6, hy + 0.5, rgb("#2a0a12")); return; }
      taper(f, hx + 1, hy + 2, 1, hx + 5.5, hy + 2 + open, 0.8, ramp(c.bodyD || c.body));
      if (open) { for (let x = hx + 2; x <= hx + 5; x++) f.set(x, hy + 2, rgb("#2a0a12")); f.set(hx + 5, hy + 1.5, rgb("#ffffff")); f.set(hx + 3, hy + 2.5 + open, rgb("#ffffff")); }
      f.set(hx + 1, hy - 0.5, eye); f.set(hx + 2, hy - 0.5, eyeL);
      [[-2, -2.5], [-1, -3.5], [0, -2.8]].forEach(([dx, dy]) => taper(f, hx + dx, hy - 1.5, 0.8, hx + dx - 1.5, hy + dy - 1, 0.5, FIN));   // head frill
    } else {
      f.blob(hx, hy, 4.2 * s, 3.2, B, { rim: B[4] });
      if (view === "front") {
        if (leech) { f.blob(hx, hy + 1, 1.8, 1.8, BL); f.set(hx, hy + 1, rgb("#2a0a12")); return; }
        f.set(hx - 2, hy - 0.5, eye); f.set(hx + 2, hy - 0.5, eye); f.set(hx - 2, hy - 1.5, eyeL); f.set(hx + 2, hy - 1.5, eyeL);
        f.blob(hx, hy + 2, 1.8, 1, BL);
        if (open) { f.set(hx - 1, hy + 2.5, rgb("#ffffff")); f.set(hx + 1, hy + 2.5, rgb("#ffffff")); f.set(hx, hy + 2.5, rgb("#2a0a12")); }
      }
      [-1, 1].forEach((k) => taper(f, hx + k * 2.2, hy - 2, 0.8, hx + k * 3.5, hy - 5, 0.5, FIN));
    }
  };

  if (side) {
    // S-shaped body along the ground, thinner toward the tail, belly underneath
    const n = 26, lunge = m.lunge || 0;
    for (let k = 0; k <= n; k++) {
      const t = k / n, x = 3 + t * 25 + lunge * t, y = gy - 3 - Math.sin(t * 7 - ph * 2) * 2 * (0.4 + t * 0.6);
      const r = 1.2 + t * 2.2;
      f.blob(x, y, r, r, B, { rim: B[4], belly: { c: [BL[1], BL[2], BL[3]], from: 0.35 } });
      if (!leech && k % 4 === 2 && k > 4) taper(f, x, y - r + 0.5, 0.8, x - 1.2, y - r - 2.5, 0.4, FIN);   // dorsal spines
    }
    // neck rising to the head
    const nx = 28 + lunge, ny = gy - 4 - Math.sin(7 - ph * 2) * 2;
    const hx = 33 + lunge + (m.strike ? 3 : 0), hy = gy - 15 + rise + m.bob;
    part(() => {
      curve(f, [nx, ny], [nx + 4, ny - 4], [hx - 1, hy + 1], 3.2, 2.2, B, { belly: { c: [BL[1], BL[2], BL[3]], from: 0.4 } });
      head(hx, hy, "side");
    });
    if (hydra) part(() => { curve(f, [nx - 2, ny], [nx, ny - 8], [hx - 6, hy - 3], 2.4, 1.8, B); head(hx - 5, hy - 4, "side"); });
    skillFx(f, m, cx, gy - 10, gy, c.eye || "#ffd166", m.strike ? [hx + 8, hy + 1] : null);
    return finish(f);
  }

  // front / back: a coiled ring with the neck and head rising from it
  const bx = cx;
  const coil = (y, rx, ry, k) => {
    for (let a = 0; a <= 32; a++) {
      const t = (a / 32) * Math.PI * 2, x = bx + Math.cos(t + ph * 0.5 + k) * rx, yy = y + Math.sin(t + ph * 0.5 + k) * ry;
      f.blob(x, yy, 2.4 - k * 0.4, 2.2 - k * 0.4, B, { rim: B[4], belly: { c: [BL[1], BL[2], BL[3]], from: 0.5 } });
    }
  };
  coil(gy - 3, 11, 3, 0);
  coil(gy - 6, 7, 2.2, 1);
  const hy = gy - 17 + rise + m.bob + (back ? 1 : 0);
  const heads = hydra ? [[-6, 2], [0, 0], [6, 2]] : [[0, 0]];
  heads.forEach(([dx, dy]) => part(() => {
    curve(f, [bx + dx * 0.3, gy - 7], [bx + dx * 0.8, gy - 10], [bx + dx, hy + dy + 2], 2.6, 1.9, B);
    if (!back) for (let y = hy + dy + 3; y < gy - 7; y++) { f.over(bx + dx * ((gy - y) / 14), y, BL[2]); f.over(bx + dx * ((gy - y) / 14) + 1, y, BL[1]); }
    head(bx + dx, hy + dy, back ? "back" : "front");
  }));
  skillFx(f, m, cx, gy - 10, gy, c.eye || "#ffd166", m.strike ? [bx, hy + 5] : null);
  return finish(f);
}
