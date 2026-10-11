// Winged family (DrakeSprite): drakes and wyverns (bat wings, horns, long tail), gargoyles (stone, horns,
// clawed arms), and birds (hawks, falcons, petrels, rocs, vultures, griffins, harpies: feathered wings,
// beak, tail fan). Flyers hover with a wing beat; walking drakes (flying = false) go on four legs with
// folded wings. Colours from the code sprite: body/bodyD/bodyL, belly, wing/wingD, eye, horn, fire.
// Code sprite 36×30 (feet 18,28) → painted 44×36 (feet 22,34).
import { Canvas, ramp, rgb, sh, motion, skillFx, dust, finish, taper, curve, frame, overlay, eyeCol } from "../monsterkit.mjs";

export const SIZE = { W: 44, H: 36 };

export function kindOf(key) {
  if (/gargoyle/i.test(key)) return "gargoyle";
  if (/falcon|hawk|petrel|roc|vulture|griffin|harpy|crow/i.test(key)) return "bird";
  return "drake";
}

export function paint(sprite, def, dir, anim, i) {
  const { W, H } = SIZE, { fx: cx, fy } = frame(sprite, W, H), gy = fy - 1;
  const c = sprite.c, m = motion(anim, i), kind = kindOf(def.key), fly = sprite.flying;
  const B = ramp(c.body), BD = ramp(c.bodyD, { lift: -0.05 }), BL = ramp(c.belly || c.bodyL), WG = ramp(c.wing || c.bodyD), WD = ramp(c.wingD || c.bodyD, { lift: -0.1 });
  const HORN = ramp(c.horn || "#d8d0c0"), eye = eyeCol(rgb(c.eye || "#ff3b6b")), eyeL = eyeCol(sh(c.eye || "#ff3b6b", 0.5));
  const beakR = ramp(kind === "bird" ? (c.horn && c.horn !== "#d8d0c0" ? c.horn : "#f2b134") : c.horn || "#d8d0c0");
  let f = new Canvas(W, H);
  const part = (fn) => { const base = f; f = new Canvas(W, H); const r = fn(); const t = f; f = base; overlay(f, t); return r; };
  const side = dir === "side", back = dir === "up";
  // wing beat: idle/walk/run slow → fast; attack/skill hold the wings high, then beat down on the strike
  const beat = fly ? (m.atk ? [1, -1, -1, 0][i % 4] ?? 0 : Math.sin(m.ph * (anim === "idle" ? 1 : 2) * (anim === "run" ? 1 : 1))) : 0;
  const flapY = m.charge ? 1 : m.atk === 1 ? 1 : m.strike ? -1 : beat;        // +1 up … −1 down
  const lift = fly ? 9 + Math.round(beat) * -1 + (m.atk === 2 ? 2 : 0) : 0;
  const by = gy - 10 - lift + m.bob, lx = side ? (m.lunge || 0) : 0;

  // ---------- wings ----------
  // membrane wing (drake, gargoyle): arm bone to a wrist, fingers fanning back to the trailing edge
  const batWing = (rx, ry, tipX, tipY, s, near) => {
    const R = near ? WG : WD, bone = near ? WD : ramp(c.wingD || c.bodyD, { lift: -0.2 });
    const wx = (rx + tipX) / 2 + s * 1, wy = Math.min(ry, tipY) - 2;           // wrist
    const fingers = [[tipX, tipY], [tipX - s * 3, tipY + 7], [rx + s * 5, ry + 7], [rx + s * 1, ry + 4]];
    for (let k = 0; k < fingers.length - 1; k++) {
      const [ax, ay] = fingers[k], [bx2, by2] = fingers[k + 1];
      const notch = [(ax + bx2) / 2 - s * 0.5, (ay + by2) / 2 - 1.5];         // scalloped trailing edge
      f.poly([[wx, wy], [ax, ay], notch, [bx2, by2]], (x, y) => ((x + y) % 5 === 0 ? R[1] : y < wy + 3 ? R[3] : R[2]));
    }
    f.poly([[rx, ry], [wx, wy], [rx + s * 1, ry + 4]], R[2]);
    taper(f, rx, ry, 1.4, wx, wy, 1, bone);
    fingers.slice(0, 3).forEach(([x, y]) => taper(f, wx, wy, 0.8, x, y, 0.5, bone));
    f.set(tipX, tipY - 1, HORN[3]);                                          // wrist claw
  };
  // feathered wing (bird): coverts in body colour, primaries darker with gaps at the tips
  const birdWing = (rx, ry, tipX, tipY, s, near) => {
    const R = near ? WG : WD, C = near ? B : BD;
    const midX = (rx + tipX) / 2, midY = (ry + tipY) / 2;
    f.poly([[rx, ry - 1], [midX, Math.min(ry, tipY) - 2], [tipX, tipY], [tipX - s * 2, tipY + 3], [midX, midY + 5], [rx, ry + 4]], R[2]);
    for (let k = 0; k < 5; k++) {                                            // primaries
      const t = k / 4, x0 = midX + (tipX - midX) * t, y0 = midY + (tipY - midY) * t;
      taper(f, x0, y0, 1.1, x0 - s * 1.5, y0 + 5 - t * 2, 0.6, R);
      f.set(x0 - s * 1.5, y0 + 5 - t * 2, R[0]);
    }
    f.poly([[rx, ry - 1], [midX, Math.min(ry, tipY) - 1.5], [midX + s * 1, midY + 1], [rx, ry + 2]], C[3]);   // coverts
    for (let x = Math.min(rx, midX); x <= Math.max(rx, midX); x += 2) f.over(x, (ry + midY) / 2 + 1, C[1]);
  };
  const wing = kind === "bird" ? birdWing : batWing;

  // ---------- heads ----------
  const head = (hx, hy, view, s = 1) => {
    if (kind === "bird") {
      f.blob(hx, hy, 3.6, 3.2, B, { rim: B[4] });
      if (view === "side") {
        f.poly([[hx + 2, hy - 1], [hx + 6.5, hy + 0.5], [hx + 4.5, hy + 2], [hx + 2, hy + 1.5]], beakR[3]);
        f.set(hx + 6, hy + 1, beakR[1]); f.set(hx + 5, hy + 2, beakR[1]);
        f.set(hx + 1, hy - 1, eye); f.set(hx + 2, hy - 1, eyeL);
        f.set(hx, hy - 2, B[1]); f.set(hx + 1, hy - 2, B[1]);                // brow
        if (m.strike || m.charge > 2) f.set(hx + 5, hy + 1, rgb("#2a0a12"));
      } else if (view === "front") {
        f.poly([[hx - 1.5, hy], [hx + 1.5, hy], [hx, hy + 4]], beakR[3]); f.set(hx, hy + 3, beakR[1]);
        f.set(hx - 2, hy - 1, eye); f.set(hx + 2, hy - 1, eye);
        f.set(hx - 3, hy - 2, B[1]); f.set(hx + 3, hy - 2, B[1]);
      }
      if (/griffin|roc|crown/i.test(def.key)) [-1, 0, 1].forEach((k) => f.set(hx + k * 2 - (view === "side" ? 2 : 0), hy - 4 - (k ? 0 : 1), HORN[3]));   // crest
      return;
    }
    // drake / gargoyle: wedge head, jaw, horns swept back
    if (view === "side") {
      f.blob(hx, hy, 3.6, 3, B, { rim: B[4] });
      f.blob(hx + 3.5, hy + 1, 3.2, 1.8, B);
      const open = m.strike || m.charge > 2 ? 2 : 0;
      taper(f, hx + 1, hy + 2.5, 1, hx + 6, hy + 2.5 + open, 0.8, BD);
      if (open) { for (let x = hx + 2; x <= hx + 5; x++) f.set(x, hy + 2.5, rgb("#2a0a12")); f.set(hx + 5, hy + 2, rgb("#ffffff")); }
      f.set(hx + 1, hy - 0.5, eye); f.set(hx + 2, hy - 0.5, eyeL);
      f.set(hx + 6, hy + 0.5, B[0]);                                         // nostril
      curve(f, [hx - 1, hy - 2], [hx - 4, hy - 4], [hx - 6, hy - 3], 1.2, 0.5, HORN);
      if (kind === "gargoyle") curve(f, [hx, hy - 2.5], [hx - 1, hy - 6], [hx - 3, hy - 7], 1.2, 0.5, HORN);
      if (c.fire && (m.strike || m.charge)) {
        const fire = [rgb(c.fire), sh(c.fire, 0.5), rgb("#ffffff")];
        for (let k = 0; k < (m.strike ? 7 : m.charge); k++) f.spark(hx + 8 + k, hy + 2 + ((k * 3) % 3) - 1, fire[k % 3], k > 2);
      }
    } else {
      f.blob(hx, hy, 3.8, 3.4, B, { rim: B[4] });
      if (view === "front") {
        f.blob(hx, hy + 2, 2.4, 1.6, BL);
        f.set(hx - 2, hy - 0.5, eye); f.set(hx + 2, hy - 0.5, eye); f.set(hx - 1, hy - 0.5, eyeL);
        if (m.strike || m.charge > 2) { f.set(hx - 1, hy + 3, rgb("#ffffff")); f.set(hx + 1, hy + 3, rgb("#ffffff")); f.set(hx, hy + 3, rgb("#2a0a12")); }
        if (c.fire && m.strike) { const fc = [rgb(c.fire), sh(c.fire, 0.5)]; for (let k = 0; k < 5; k++) f.spark(hx + (k % 3) - 1, hy + 5 + k, fc[k % 2], k > 1); }
      }
      [-1, 1].forEach((k) => curve(f, [hx + k * 2.5, hy - 2.5], [hx + k * 5, hy - 5], [hx + k * 5.5, hy - 8], 1.2, 0.5, HORN));
    }
  };

  // ---------- body pieces ----------
  const tailSide = (x, y) => {
    if (kind === "bird") {                                                   // tail fan
      f.poly([[x + 1, y - 1], [x - 7, y - 3 + m.bob], [x - 8, y + 1 + m.bob], [x - 6, y + 3], [x + 1, y + 2]], WG[2]);
      for (let k = 0; k < 3; k++) f.set(x - 7 + k, y - 1 + k, WG[0]);
      return;
    }
    const sway = Math.round(Math.sin(m.ph) * 1.5);
    curve(f, [x, y], [x - 7, y + 1 + sway], [x - 13, y - 4 - sway], 2.6, 0.7, kind === "gargoyle" ? BD : B);
    f.poly([[x - 13, y - 6 - sway], [x - 16, y - 4 - sway], [x - 13, y - 2 - sway]], HORN[2]);   // tail spade
  };
  const legSide = (x, y, phase, near) => {
    const R = near ? B : BD, sw = Math.sin(phase) * (anim === "run" ? 3 : 2), up = Math.max(0, Math.cos(phase)) * (anim === "run" ? 2.5 : 1.5);
    taper(f, x, y, 2.4, x + sw * 0.5 + 1, (y + gy) / 2, 1.8, R);
    taper(f, x + sw * 0.5 + 1, (y + gy) / 2, 1.8, x + sw, gy - up - 1, 1.2, R);
    f.set(x + sw + 1, gy - up, HORN[2]); f.set(x + sw + 2, gy - up, HORN[1]);
  };
  const talons = (x, y) => { taper(f, x, y, 1.4, x, y + 4, 0.8, BD); f.set(x - 1, y + 5, beakR[2]); f.set(x + 1, y + 5, beakR[2]); };

  if (side) {
    const bx = cx - 2 + lx;
    const nx = bx + 7, hx = bx + (kind === "bird" ? 6 : 11) + (m.atk === 1 ? -1 : m.strike ? 2 : 0), hy = by - (kind === "bird" ? 4 : 7) + (m.atk === 1 ? 2 : 0);
    const wingUp = flapY > 0.3, wingDown = flapY < -0.3;
    const tip = (near) => fly
      ? (wingUp ? [bx - 6, by - 17 + (near ? 0 : 2)] : wingDown ? [bx - 5, by + 9 - (near ? 0 : 2)] : [bx - 14, by - 4 + (near ? 0 : 1)])
      : [bx - 8, by - 6];
    // far wing
    if (fly) { const [tx, ty] = tip(false); wing(bx + 2, by - 3, tx + 3, ty, -1, false); }
    tailSide(bx - 6, by + 1);
    if (!fly) { legSide(bx - 4, by + 3, m.ph + Math.PI, false); legSide(bx + 5, by + 3, m.ph, false); }
    // body
    f.blob(bx, by, kind === "bird" ? 6.5 : 7.5, kind === "bird" ? 4.6 : 4.4, B, { rim: B[4], belly: { c: [BL[1], BL[2], BL[3]], from: 0.35 } });
    if (kind !== "bird") for (let x = -5; x <= 4; x += 2) f.over(bx + x, by - 4 + (x % 4 ? 1 : 0), HORN[2]);   // spine ridge
    else for (let x = -4; x <= 3; x += 2) f.over(bx + x, by + 1 + (x % 4 ? 1 : 0), BL[1]);                   // breast speckles
    if (kind === "gargoyle") { f.over(bx - 2, by - 1, B[0]); f.over(bx - 1, by, B[0]); f.over(bx + 2, by + 1, B[0]); f.over(bx + 3, by + 2, B[4]); }
    if (!fly) { legSide(bx - 5, by + 3, m.ph, true); legSide(bx + 4, by + 3, m.ph + Math.PI, true); }
    else talons(bx + 1, by + 3);
    // neck + head
    part(() => {
      if (kind !== "bird") curve(f, [bx + 4, by - 1], [nx + 1, by - 3], [hx - 1, hy + 1], 2.6, 2, B);
      head(hx, hy, "side");
    });
    // near wing (folded on walkers)
    part(() => {
      if (fly) { const [tx, ty] = tip(true); wing(bx + 1, by - 2, tx, ty, -1, true); }
      else f.poly([[bx + 4, by - 3], [bx - 7, by - 6], [bx - 6, by - 2], [bx + 2, by]], (x, y) => (y < by - 4 ? WG[3] : WG[2]));
      if (kind === "gargoyle") taper(f, bx + 3, by, 1.4, bx + 7 + (m.strike ? 3 : 0), by + 4 - (m.atk === 1 ? 6 : 0), 1, B);   // clawed arm
    });
    if (anim === "run" && !fly) dust(f, bx - 10, gy, i);
    skillFx(f, m, cx, by, gy, c.fire || c.eye || "#ff3b6b", m.strike ? [hx + 8, hy + 2] : null);
    return finish(f);
  }

  // front / back: wings spread to both sides
  const bx = cx;
  const span = fly ? 18 : 7;
  const wy = by - 3, tipY = fly ? wy - 9 * flapY : wy - 7;
  const wings = (near) => [-1, 1].forEach((s) => wing(bx + s * 3, wy, bx + s * span, tipY - (fly ? 0 : 2), s, near));
  if (!back) {
    wings(true);
    if (!fly) [-1, 1].forEach((s) => { taper(f, bx + s * 4, by + 3, 2.2, bx + s * 5, gy - 1 - (anim === "walk" || anim === "run" ? Math.max(0, Math.cos(m.ph + (s > 0 ? Math.PI : 0))) * 2 : 0), 1.4, B); });
    f.blob(bx, by, fly ? 5.5 : 6.5, 5, B, { rim: B[4], belly: { c: [BL[1], BL[2], BL[3]], from: kind === "bird" ? 0.25 : -0.1 } });
    if (fly) { talons(bx - 2, by + 4); talons(bx + 2, by + 4); }
    part(() => {
      if (kind !== "bird") taper(f, bx, by - 3, 2.6, bx, by - 6 + (m.atk === 1 ? 2 : 0), 2.2, B);
      head(bx, by - 8 + (m.atk === 1 ? 2 : 0) + (kind === "bird" ? 2 : 0), "front");
    });
  } else {
    part(() => head(bx, by - 8 + (kind === "bird" ? 2 : 0), "back"));
    if (!fly) [-1, 1].forEach((s) => taper(f, bx + s * 4, by + 3, 2.2, bx + s * 5, gy - 1, 1.4, BD));
    f.blob(bx, by, 5.5, 5, B, { rim: B[4] });
    if (kind !== "bird") { for (let y = -4; y <= 3; y += 2) f.over(bx, by + y, HORN[2]); curve(f, [bx, by + 4], [bx + 2, by + 8], [bx - 1, gy - 1], 2.2, 0.8, B); }
    else f.poly([[bx - 3, by + 3], [bx + 3, by + 3], [bx + 4, by + 9], [bx - 4, by + 9]], WG[2]);
    part(() => wings(true));
  }
  if (anim === "run" && !fly) { dust(f, bx - 8, gy, i); dust(f, bx + 8, gy, i + 1); }
  skillFx(f, m, cx, by, gy, c.fire || c.eye || "#ff3b6b", m.strike ? [bx, by + 6] : null);
  return finish(f);
}
