// Small flyer family (ImpSprite): imps (horns, bat wings, barbed tail, claws), bats (big ears, membrane
// wings), crows (feathers, beak), moths (furry body, wide patterned wings, antennae) and hornets (striped
// abdomen, glassy wings, stinger). All hover with a quick wing beat. Colours from the code sprite: skin/
// skinD/skinL (or body/bodyD/bodyL, which some monsters set instead), horn, eye, wing/wingD.
// Code sprite 24×26 (feet 12,24) → painted 30×30 (feet 15,28).
import { Canvas, ramp, rgb, sh, motion, skillFx, finish, taper, curve, frame, overlay } from "../monsterkit.mjs";

export const SIZE = { W: 30, H: 30 };

export function kindOf(key) {
  if (/bat/i.test(key)) return "bat";
  if (/crow/i.test(key)) return "crow";
  if (/moth/i.test(key)) return "moth";
  if (/hornet|hive/i.test(key)) return "hornet";
  return "imp";
}

export function paint(sprite, def, dir, anim, i) {
  const { W, H } = SIZE, { fx: cx, fy } = frame(sprite, W, H), gy = fy - 1;
  const c = sprite.c, m = motion(anim, i), kind = kindOf(def.key);
  const base = c.body || c.skin, dark = c.bodyD || c.skinD, light = c.bodyL || c.skinL;
  const B = ramp(base), BD = ramp(dark), BL = ramp(light), WG = ramp(c.wing || dark), WD = ramp(c.wingD || c.wing || dark, { lift: -0.12 });
  const HORN = ramp(c.horn || "#2b2b33"), eye = rgb(c.eye || "#ffd166"), eyeL = sh(c.eye || "#ffd166", 0.5);
  let f = new Canvas(W, H);
  const part = (fn) => { const base2 = f; f = new Canvas(W, H); const r = fn(); const t = f; f = base2; overlay(f, t); return r; };
  const side = dir === "side", back = dir === "up";
  const beat = m.atk ? [1, -1, -1, 0][i % 4] : Math.sin(m.ph * (anim === "idle" ? 2 : 3));
  const lx = side ? (m.lunge || 0) : 0, bx = cx + lx;
  const by = gy - 11 + Math.round(-beat) + (m.atk === 2 ? 2 : 0);

  // ---------- wings ----------
  const wing = (rx, ry, s, near, spread) => {
    const R = near ? WG : WD, up = beat > 0.3, down = beat < -0.3;
    const tx = rx + s * spread, ty = up ? ry - 9 : down ? ry + 4 : ry - 3;
    if (kind === "moth") {
      const P = ramp(c.wing || base, { lift: 0.05 });
      f.blob((rx + tx) / 2, (ry + ty) / 2 - 1, Math.abs(tx - rx) / 2 + 1, 4.5, near ? P : WD);
      f.blob(rx + s * spread * 0.35, ry + 4, 3, 2.6, near ? WD : ramp(c.wing || base, { lift: -0.25 }));
      f.set((rx + tx) / 2, (ry + ty) / 2 - 1, eye); f.set((rx + tx) / 2 + s, (ry + ty) / 2 - 1, eyeL);   // eye spot
      return;
    }
    if (kind === "hornet") {
      const glass = [sh("#e0f2fe", -0.3), sh("#e0f2fe", -0.12), rgb("#e0f2fe"), sh("#ffffff", 0), rgb("#ffffff")];
      f.blob((rx + tx) / 2, (ry + ty) / 2 - 1, Math.abs(tx - rx) / 2 + 0.5, 2.2, glass);
      taper(f, rx, ry, 0.5, tx, ty - 1, 0.4, [glass[0], glass[0], glass[1], glass[1], glass[2]]);
      return;
    }
    if (kind === "crow") {
      f.poly([[rx, ry - 1], [tx, ty], [tx - s * 2, ty + 3], [rx, ry + 3]], R[2]);
      for (let k = 0; k < 3; k++) taper(f, tx - s * k * 1.5, ty + k, 0.8, tx - s * (k * 1.5 + 1), ty + k + 3, 0.4, R);
      return;
    }
    // membrane (imp, bat): bones from the shoulder, scalloped edge
    const wx = (rx + tx) / 2, wy = Math.min(ry, ty) - 1;
    f.poly([[rx, ry], [wx, wy], [tx, ty], [tx - s * 2, ty + 4], [wx - s * 0.5, (ry + ty) / 2 + 2.5], [rx + s * 2, ry + 4]], (x, y) => (y < wy + 2 ? R[3] : R[2]));
    taper(f, rx, ry, 0.8, wx, wy, 0.6, WD); taper(f, wx, wy, 0.6, tx, ty, 0.4, WD);
    taper(f, wx, wy, 0.5, tx - s * 2, ty + 4, 0.4, WD);
    if (kind === "imp") f.set(wx, wy - 1, HORN[3]);
  };

  // ---------- head ----------
  const head = (hx, hy, view) => {
    const grin = m.strike || m.charge > 2;
    if (kind === "crow") {
      f.blob(hx, hy, 3, 2.8, B, { rim: B[4] });
      if (view === "side") { f.poly([[hx + 2, hy - 0.5], [hx + 6, hy + 0.5], [hx + 2, hy + 1.5]], HORN[3]); f.set(hx + 1, hy - 1, eye); }
      else if (view === "front") { f.poly([[hx - 1, hy], [hx + 1, hy], [hx, hy + 3]], HORN[3]); f.set(hx - 1.5, hy - 1, eye); f.set(hx + 1.5, hy - 1, eye); }
      return;
    }
    if (kind === "moth" || kind === "hornet") {
      f.blob(hx, hy, 2.6, 2.4, kind === "moth" ? BL : B, { rim: B[4] });
      const ant = view === "side" ? [[hx, hy - 2, hx - 1, hy - 6], [hx + 1, hy - 2, hx + 2, hy - 6]] : [[hx - 1, hy - 2, hx - 3, hy - 6], [hx + 1, hy - 2, hx + 3, hy - 6]];
      ant.forEach(([x0, y0, x1, y1]) => { taper(f, x0, y0, 0.4, x1, y1, 0.4, BD); f.set(x1, y1, kind === "moth" ? BL[3] : BD[0]); });
      if (view === "side") { f.set(hx + 1, hy, eye); f.set(hx + 2, hy, eye); }
      else if (view === "front") { f.set(hx - 1.5, hy, eye); f.set(hx + 1.5, hy, eye); f.set(hx - 1.5, hy - 1, eyeL); f.set(hx + 1.5, hy - 1, eyeL); }
      return;
    }
    f.blob(hx, hy, kind === "bat" ? 3.4 : 3.8, 3.4, B, { rim: B[4] });
    if (kind === "bat") {   // tall ears
      const ears = view === "side" ? [[hx - 1, -0.3]] : [[hx - 2.5, -1], [hx + 2.5, 1]];
      ears.forEach(([x, s]) => f.poly([[x - 1.2, hy - 2], [x + s * 1.5, hy - 7], [x + 1.4, hy - 2]], (px) => (px < x ? B[3] : B[2])));
    } else {                // horns
      const horns = view === "side" ? [[hx - 1, -1]] : [[hx - 2.5, -1], [hx + 2.5, 1]];
      horns.forEach(([x, s]) => curve(f, [x, hy - 2.5], [x + s * 1.5, hy - 4.5], [x + s * 0.5, hy - 7], 0.9, 0.4, HORN));
    }
    if (view === "side") {
      f.blob(hx + 2.5, hy + 0.8, 1.6, 1.3, kind === "bat" ? BL : B);
      f.set(hx + 1, hy - 0.5, eye); f.set(hx + 2, hy - 0.5, eyeL);
      f.set(hx + 2, hy + 2, grin ? rgb("#ffffff") : BD[1]); f.set(hx + 3, hy + 2, BD[0]);
    } else if (view === "front") {
      f.set(hx - 1.5, hy - 0.5, eye); f.set(hx + 1.5, hy - 0.5, eye); f.set(hx - 1.5, hy - 1.5, eyeL);
      for (let x = -1; x <= 1; x++) f.set(hx + x, hy + 1.5, BD[0]);
      if (grin) { f.set(hx - 1, hy + 2, rgb("#ffffff")); f.set(hx + 1, hy + 2, rgb("#ffffff")); }
      else if (kind === "bat") { f.set(hx - 1, hy + 2, rgb("#ffffff")); f.set(hx + 1, hy + 2, rgb("#ffffff")); }
    }
  };

  const torso = (view) => {
    if (kind === "hornet") {
      const ax = view === "side" ? bx - 4 : bx, ay = view === "side" ? by + 2 : by + 4;
      f.blob(ax, ay, view === "side" ? 4 : 3, view === "side" ? 2.6 : 3.4, ramp(c.horn && c.horn !== "#2b2b33" ? c.horn : "#facc15"));
      for (let k = -2; k <= 2; k += 2) for (let d = -3; d <= 3; d++) view === "side" ? f.over(ax + k, ay + d, BD[0]) : f.over(ax + d, ay + k, BD[0]);   // stripes
      taper(f, view === "side" ? ax - 4 : ax, view === "side" ? ay + 1 : ay + 3, 0.6, view === "side" ? ax - 6 : ax, view === "side" ? ay + 2 : ay + 5, 0.3, BD);
      f.blob(bx + (view === "side" ? 1 : 0), by, 2.4, 2.2, B, { rim: B[4] });
      return;
    }
    if (kind === "moth") { f.blob(bx + (view === "side" ? -1 : 0), by + 1, view === "side" ? 3.4 : 2.6, 3.6, BL, { rim: BL[4] }); for (let y = -1; y <= 3; y += 2) f.over(bx, by + y, BD[2]); return; }
    f.blob(bx, by + 1, kind === "crow" ? 3.8 : 3.4, 3.6, B, { rim: B[4], belly: kind === "imp" ? { c: [BL[1], BL[2]], from: 0.3 } : null });
  };
  const limbs = (view) => {
    if (kind !== "imp") { if (kind !== "moth") [-1, 1].forEach((k) => { f.set(bx + k, by + 5, HORN[2]); f.set(bx + k, by + 6, HORN[1]); }); return; }
    const reach = m.strike ? 4 : m.atk === 1 ? -1 : 2;
    [-1, 1].forEach((k) => taper(f, bx + k * 1.5, by + 4, 0.9, bx + k * 1.5 + (view === "side" ? 0 : 0), by + 8, 0.7, BD));   // dangling legs
    const ax = view === "side" ? bx + 3 + reach : bx + 4, ay = m.atk === 1 ? by - 4 : by + 2;
    taper(f, bx + 2, by, 0.9, ax, ay, 0.7, B);
    f.set(ax + 1, ay - 1, rgb("#f1f5f9")); f.set(ax + 1, ay + 1, rgb("#f1f5f9"));
    if (view !== "side") { taper(f, bx - 2, by, 0.9, bx - 4, ay, 0.7, B); f.set(bx - 5, ay - 1, rgb("#f1f5f9")); }
  };
  const tail = (view) => {
    if (kind !== "imp") return;
    const sw = Math.sin(m.ph) * 1.5;
    if (view === "side") curve(f, [bx - 2, by + 3], [bx - 6, by + 5], [bx - 8, by + 1 + sw], 0.8, 0.5, BD);
    else curve(f, [bx + 1, by + 3], [bx + 5, by + 5], [bx + 7 + sw, by + 1], 0.8, 0.5, BD);
    const tx = view === "side" ? bx - 8 : bx + 7 + sw, ty = by + (view === "side" ? 1 + sw : 1);
    f.poly([[tx - 1.5, ty], [tx, ty - 2.5], [tx + 1.5, ty]], HORN[2]);
  };

  const spread = kind === "moth" ? 11 : kind === "hornet" ? 8 : kind === "crow" ? 10 : 11;
  if (side) {
    wing(bx - 1, by - 1, -1, false, spread - 3);
    tail("side");
    torso("side");
    limbs("side");
    part(() => head(bx + (kind === "hornet" ? 4 : 1), by - (kind === "hornet" ? 1 : 4), "side"));
    part(() => wing(bx - 1, by, -1, true, spread - 2));
  } else {
    if (back) { part(() => head(bx, by - 4, "back")); }
    if (!back) tail("front");
    if (!back) { wing(bx - 2, by, -1, true, spread); wing(bx + 2, by, 1, true, spread); }
    torso("front");
    limbs("front");
    if (!back) part(() => head(bx, by - 4 + (kind === "hornet" ? 1 : 0), "front"));
    if (back) { tail("front"); part(() => { wing(bx - 2, by, -1, true, spread); wing(bx + 2, by, 1, true, spread); }); }
  }
  skillFx(f, m, cx, by, gy, c.eye || "#ffd166", m.strike ? [side ? bx + 9 : bx, side ? by : by + 6] : null);
  return finish(f);
}
