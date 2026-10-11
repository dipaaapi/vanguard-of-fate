// Many-legged family (CrabSprite): crabs (shell, two big claws, eye stalks), scarabs (domed wing cases
// and a horn), spiders (abdomen, head, eight jointed legs, eye cluster) and krakens (a mantle on curling
// tentacles). Colours from the code sprite: shell/shellD/shellL, leg, eye.
// Code sprite 30×22 (feet 15,20) → painted 36×26 (feet 18,24).
import { Canvas, ramp, rgb, sh, motion, skillFx, dust, finish, taper, curve, frame, overlay, TAU } from "../monsterkit.mjs";

export const SIZE = { W: 36, H: 26 };

export function kindOf(key, spider) {
  if (/kraken/i.test(key)) return "kraken";
  if (/scarab/i.test(key)) return "scarab";
  return spider ? "spider" : "crab";
}

export function paint(sprite, def, dir, anim, i) {
  const { W, H } = SIZE, { fx: cx, fy } = frame(sprite, W, H), gy = fy - 1;
  const c = sprite.c, m = motion(anim, i), kind = kindOf(def.key, sprite.spider);
  const S = ramp(c.shell), SD = ramp(c.shellD, { lift: -0.05 }), LG = ramp(c.leg || c.shellD), eye = rgb(c.eye || "#ffd166"), eyeL = sh(c.eye || "#ffd166", 0.5);
  let f = new Canvas(W, H);
  const part = (fn) => { const base = f; f = new Canvas(W, H); const r = fn(); const t = f; f = base; overlay(f, t); return r; };
  const side = dir === "side", back = dir === "up";
  const moving = anim === "walk" || anim === "run";
  const lx = side ? (m.lunge || 0) : 0, bx = cx + lx;
  const by = gy - (kind === "kraken" ? 9 : kind === "spider" ? 7 : 6) + m.bob - (m.atk === 1 ? 1 : 0);

  // jointed leg from the body (x0,y0) out to a knee and down to the ground
  const leg = (x0, y0, s, k, near) => {
    const R = near ? LG : ramp(c.leg || c.shellD, { lift: -0.15 });
    const step = moving ? Math.sin(m.ph * (anim === "run" ? 2 : 1) + k * 2.1 + (s > 0 ? Math.PI : 0)) : 0;
    const up = moving ? Math.max(0, step) * 2 : 0;
    const reach = kind === "spider" ? 7 + k * 0.6 : 5;
    const kx = x0 + s * (reach - 1), ky = y0 - (kind === "spider" ? 4 : 2) - up;
    const tx = x0 + s * (reach + 1.5) + step * 1.2, ty = gy - up;
    const w = kind === "spider" ? 0.75 : 1.2;
    taper(f, x0, y0, w, kx, ky, w * 0.85, R);
    taper(f, kx, ky, w * 0.85, tx, ty, 0.5, R);
    f.set(kx, ky - 1, R[3]);
  };

  if (kind === "kraken") {
    const T = ramp(c.leg || c.shellD);
    const n = side ? 4 : 6;
    for (let k = 0; k < n; k++) {                      // tentacles curling on the ground
      const t = side ? k / (n - 1) - 0.5 : k / (n - 1) - 0.5, wav = Math.sin(m.ph * 2 + k * 1.3) * 2;
      const x0 = bx + t * (side ? 10 : 12), x2 = bx + t * (side ? 22 : 30) + wav, y2 = gy - 1 - (k % 2);
      const reach = m.strike && (side ? k >= n - 2 : Math.abs(t) < 0.3) ? 8 : 0;
      curve(f, [x0, by + 3], [x0 + t * 6, gy], [x2 + (side ? reach : 0), y2 - reach * 0.6], 2, 0.6, k % 2 ? T : ramp(c.leg || c.shellD, { lift: -0.12 }));
      for (let s = 1; s < 4; s++) f.over(x0 + (x2 - x0) * s / 4, by + 3 + (y2 - by - 3) * s / 4 + 1, T[3]);   // suckers
    }
    part(() => {
      f.blob(bx, by - 2, side ? 6.5 : 7, 6.5, S, { rim: S[4] });            // mantle
      for (let y = -6; y <= 1; y += 3) f.over(bx - 3 + (y & 1), by + y, S[3]);
      if (!back) {
        const ex = side ? [bx + 4] : [bx - 3, bx + 3];
        ex.forEach((x) => { f.blob(x, by + 1, 1.6, 1.4, [eyeL, eyeL, eye, eye, eyeL]); f.set(x, by + 1, rgb("#0b0a12")); });
      }
    });
    skillFx(f, m, cx, by, gy, c.eye || "#ffd166", m.strike ? [side ? bx + 14 : bx, gy - 4] : null);
    return finish(f);
  }

  if (side) {
    // far legs, body, near legs (spiders: four pairs, crabs: three + claws)
    const pairs = kind === "spider" ? 4 : 3;
    for (let k = 0; k < pairs; k++) leg(bx - 2 + k * 2, by + 1, k < pairs / 2 ? -1 : 1, k, false);
    if (kind === "spider") {
      f.blob(bx - 5, by - 1, 6, 5, S, { rim: S[4] });                       // abdomen
      for (let k = -2; k <= 2; k++) f.over(bx - 5 + k, by - 4 + Math.abs(k), SD[1]);   // markings
      f.over(bx - 5, by - 2, rgb(c.eye || "#ffd166"));
      part(() => {
        f.blob(bx + 3, by + 1, 3.6, 3, S, { rim: S[4] });
        [[bx + 5, by - 0.5], [bx + 6, by + 0.5], [bx + 4, by - 1]].forEach(([x, y], k) => f.set(x, y, k ? eyeL : eye));
        taper(f, bx + 6, by + 2.5, 0.8, bx + 7 + (m.strike ? 2 : 0), by + 4, 0.5, SD);   // fangs
      });
    } else if (kind === "scarab") {
      f.blob(bx - 1, by - 1, 7.5, 5, S, { rim: S[4] });
      for (let x = -6; x <= 5; x++) f.over(bx - 1 + x, by - 1 - Math.round(Math.cos(x / 7) * 3.5), S[4]);
      f.blob(bx + 6, by + 1, 2.8, 2.6, SD);
      curve(f, [bx + 7, by - 1], [bx + 9, by - 4], [bx + 8 + (m.strike ? 3 : 0), by - 7], 1.1, 0.5, ramp(c.shellL || c.shell, { lift: 0.1 }));   // horn
      f.set(bx + 7, by + 1, eye);
    } else {
      f.blob(bx, by, 7, 4.6, S, { rim: S[4], belly: { c: [SD[1], SD[2]], from: 0.4 } });
      for (let x = -5; x <= 4; x += 3) f.over(bx + x, by - 3, S[4]);
      // eye stalks
      taper(f, bx + 3, by - 3, 0.6, bx + 3, by - 6, 0.6, SD); f.set(bx + 3, by - 7, eye); f.set(bx + 4, by - 7, eyeL);
    }
    for (let k = 0; k < pairs; k++) leg(bx + (kind === "spider" ? 2 : 0) + k * 1.5, by + 2, 1, k + 0.5, true);
    if (kind === "crab") part(() => {                                        // the big claw, raised then snapped
      const ax = bx + 5, ay = by + 1;
      const tx = m.atk === 1 ? bx + 9 : m.strike ? bx + 13 : bx + 10, ty = m.atk === 1 ? by - 7 : m.strike ? by : by - 1;
      taper(f, ax, ay, 1.4, tx - 2, ty + 1, 1.2, S);
      f.blob(tx, ty, 3, 2.4, S, { rim: S[4] });
      const open = m.atk === 1 || m.charge ? 2 : 0;
      f.poly([[tx + 1, ty - 1], [tx + 5, ty - 2 - open], [tx + 4, ty]], S[3]);
      f.poly([[tx + 1, ty + 1], [tx + 4, ty + 2 + open], [tx + 4, ty + 1]], SD[2]);
    });
    if (anim === "run") dust(f, bx - 9, gy, i);
    skillFx(f, m, cx, by, gy, c.eye || "#ffd166", m.strike ? [bx + 15, by] : null);
    return finish(f);
  }

  // front / back: legs splayed to both sides
  const pairs = kind === "spider" ? 4 : 3;
  for (let k = 0; k < pairs; k++) [-1, 1].forEach((s) => leg(bx + s * (3 + k * 0.6), by + 1 + k * 0.5, s, k, !back || k > 1));
  if (kind === "spider") {
    if (back) { f.blob(bx, by - 1, 7, 5.5, S, { rim: S[4] }); for (let k = -3; k <= 3; k++) f.over(bx + k, by - 1 + (k % 2), SD[1]); f.over(bx, by - 2, eye); }
    else {
      f.blob(bx, by - 4, 6, 4, SD, {});
      part(() => {
        f.blob(bx, by + 1, 4.2, 3.4, S, { rim: S[4] });
        [[-2, 0], [2, 0], [-1, -1], [1, -1], [-3, 1], [3, 1]].forEach(([dx, dy], k) => f.set(bx + dx, by + dy, k < 2 ? eye : eyeL));
        f.set(bx - 1, by + 3 + (m.strike ? 1 : 0), SD[0]); f.set(bx + 1, by + 3 + (m.strike ? 1 : 0), SD[0]);
      });
    }
  } else if (kind === "scarab") {
    f.blob(bx, by - 1, 7, 5.5, S, { rim: S[4] });
    for (let y = -5; y <= 4; y++) f.over(bx, by + y, SD[0]);                // split wing cases
    f.over(bx - 3, by - 3, S[4]); f.over(bx + 2, by - 3, S[4]);
    if (!back) part(() => { f.blob(bx, by + 4, 3, 2, SD); curve(f, [bx, by + 3], [bx, by], [bx + (m.strike ? 1 : 0), by - 4], 1.1, 0.5, ramp(c.shellL || c.shell, { lift: 0.1 })); f.set(bx - 2, by + 4, eye); f.set(bx + 2, by + 4, eye); });
  } else {
    f.blob(bx, by, 8.5, 4.8, S, { rim: S[4], belly: { c: [SD[1], SD[2]], from: 0.5 } });
    for (let x = -6; x <= 6; x += 3) f.over(bx + x, by - 3, S[4]);
    if (!back) {
      [-2.5, 2.5].forEach((dx) => { taper(f, bx + dx, by - 3, 0.6, bx + dx, by - 6, 0.6, SD); f.set(bx + dx, by - 7, eye); });
      f.set(bx - 1, by + 2, SD[0]); f.set(bx, by + 2, SD[0]); f.set(bx + 1, by + 2, SD[0]);
    }
    [-1, 1].forEach((s) => part(() => {
      const tx = bx + s * (m.atk === 1 ? 11 : m.strike ? 8 : 13), ty = m.atk === 1 ? by - 7 : m.strike ? by + 3 : by - 1;
      taper(f, bx + s * 6, by + 1, 1.3, tx, ty + 1, 1.1, S);
      f.blob(tx, ty, 3.2, 2.8, S, { rim: S[4] });
      const open = m.atk === 1 || m.charge ? 2 : 1;
      f.poly([[tx - 2, ty - 1], [tx - s * 0.5 - 1, ty - 5 - open], [tx, ty - 2]], S[3]);
      f.poly([[tx, ty - 1], [tx + s * 1.5, ty - 4], [tx + 2, ty - 1]], SD[2]);
    }));
  }
  if (anim === "run") { dust(f, bx - 10, gy, i); dust(f, bx + 10, gy, i + 1); }
  skillFx(f, m, cx, by, gy, c.eye || "#ffd166", m.strike ? [bx, by + 4] : null);
  return finish(f);
}

export { TAU };
