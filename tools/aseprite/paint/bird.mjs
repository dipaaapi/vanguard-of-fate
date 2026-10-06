// Detailed birds, side view only (the game only draws birds from the side): 36×28, body centre at
// 18,18 (the FalconSprite's 14,10 on a bigger canvas). fly 6 (wingbeat), dive 4 (tuck → strike),
// taunt 6 (wings raised, cry / spell). Kinds: the Archer's falcon and the Mage's Arcane Owl.
import { Canvas, hex } from "./kit.mjs";

export const W = 36, H = 28;
const CX = 18, CY = 18;
export const FRAMES = { fly: 6, dive: 4, taunt: 6 };
export const DURATIONS = { fly: 0.08, dive: 0.08, taunt: 0.1 };

export const KINDS = {
  falcon: {
    body: "#5c3315", bodyD: "#3d200c", bodyL: "#8a5428", wing: "#7c441b", wingL: "#a8692f", wingD: "#3d200c", tipD: "#22120a",
    breast: "#e8d6b8", breastD: "#c9ab82", speck: "#7c441b", head: "#f1ece2", headD: "#cfc4b0", mask: "#2b170e",
    eye: "#ffd166", pupil: "#1a0f08", beak: "#f59e0b", beakD: "#1e293b", talon: "#f59e0b", tail: "#4a2810", tailTip: "#d9c4a0",
    outline: "#1a0d05", fx: "#fff7e0", fx2: "#fde68a", owl: false
  },
  owl: {
    body: "#4c1d95", bodyD: "#2e1065", bodyL: "#7c3aed", wing: "#6d28d9", wingL: "#8b5cf6", wingD: "#3b0764", tipD: "#1e0638",
    breast: "#c4b5fd", breastD: "#a78bfa", speck: "#6d28d9", head: "#ddd6fe", headD: "#b9a8f5", mask: "#4c1d95",
    eye: "#fde047", pupil: "#1e0638", beak: "#fbbf24", beakD: "#78350f", talon: "#fbbf24", tail: "#3b0764", tailTip: "#ddd6fe",
    outline: "#13052b", fx: "#f5f3ff", fx2: "#c4b5fd", owl: true
  }
};

// Wing tip and elbow per beat phase (relative to the shoulder), up → down → up
const BEAT = [
  { e: [-2, -6], t: [-5, -14] },   // up
  { e: [-3, -4], t: [-10, -9] },
  { e: [-4, -1], t: [-14, -2] },   // spread level
  { e: [-3, 3], t: [-7, 9] },      // down
  { e: [-3, 1], t: [-11, 4] },
  { e: [-3, -3], t: [-12, -6] }
];

function wing(f, C, sx, sy, e, t, dark) {
  const base = dark ? [C.wingD, C.tipD] : [C.wing, C.wingD];
  const ex = sx + e[0], ey = sy + e[1], tx = sx + t[0], ty = sy + t[1];
  // membrane: shoulder → elbow → tip → back along the trailing edge
  // broad wing: leading edge shoulder → elbow → tip, trailing edge swept back toward the tail
  const back = [sx - 7, sy + 2];
  f.poly([[sx + 2, sy - 1], [ex, ey - 1], [tx, ty], [tx - 3, ty + (ty < sy ? 2 : -1)], [ex - 6, ey + (ey < sy ? 2.5 : 0.5)], back], (x, y) => {
    const d = Math.hypot(x - sx, y - sy) / Math.max(4, Math.hypot(tx - sx, ty - sy));
    return d < 0.35 ? (dark ? C.wingD : C.wingL) : d < 0.7 ? base[0] : base[1];
  });
  // primary feathers: separated lines toward the tip
  for (let k = 0; k < 5; k++) {
    const u = 0.2 + k * 0.18;
    const px = ex + (tx - ex) * u, py = ey + (ty - ey) * u;
    f.line(px - 1, py + 0.5, px - 4, py + (py < sy ? 2 : 0), 1, dark ? C.tipD : C.wingD);
  }
  // coverts: a lighter row near the leading edge
  if (!dark) for (let u = 0.15; u < 0.6; u += 0.15) f.over(sx + (ex - sx) * u * 2 - 1, sy + (ey - sy) * u * 2 + 1, C.wingL);
}

export function paintBird(kind, anim, i) {
  const k = KINDS[kind];
  const C = Object.fromEntries(Object.entries(k).filter(([, v]) => typeof v === "string").map(([n, v]) => [n, hex(v)]));
  const f = new Canvas(W, H);
  const dive = anim === "dive", taunt = anim === "taunt";
  const bob = anim === "fly" ? [1, 0, 0, -1, 0, 1][i] : 0;
  const cy = CY + bob, sx = CX + 1, sy = cy - 2;
  const beat = dive ? null : taunt ? (i % 2 ? { e: [-2, -7], t: [-4, -15] } : { e: [-1, -7], t: [-2, -16] }) : BEAT[i];
  const farBeat = beat && { e: [beat.e[0] + 2, beat.e[1] - 1], t: [beat.t[0] + 4, beat.t[1] - 1] };

  if (beat) wing(f, C, sx + 2, sy - 1, farBeat.e, farBeat.t, true);
  // tail fan with bars and a pale tip
  const tl = dive ? 4 : 6;
  for (let j = 0; j < tl; j++) for (let w = -1 - j * 0.35; w <= 1 + j * 0.35; w++) {
    const x = CX - 5 - j, y = cy + 0.5 + w + (taunt ? -j * 0.3 : 0);
    f.set(x, y, j === tl - 1 ? C.tailTip : j % 2 ? C.tail : C.bodyD);
  }
  // body
  if (k.owl) f.blob(CX, cy, 5.6, 4.8, [C.bodyD, C.body, C.body, C.bodyL], { rim: C.bodyL });
  else f.blob(CX, cy, dive ? 7 : 6.2, dive ? 2.8 : 3.4, [C.bodyD, C.body, C.body, C.bodyL], { rim: C.bodyL });
  // breast + specks
  const br = k.owl ? [CX + 2, cy + 1, 3.6, 3.6] : [CX + 2.5, cy + 1, 3.6, dive ? 1.8 : 2.4];
  f.blob(br[0], br[1], br[2], br[3], [C.breastD, C.breast, C.breast]);
  for (let j = 0; j < 5; j++) f.over(br[0] - 2 + ((j * 3) % 5), br[1] - 1 + (j % 3), C.speck);
  // head
  const hx = CX + (k.owl ? 4.5 : 6) + (dive ? 1.5 : 0), hy = cy - (k.owl ? 4.5 : 3) + (dive ? 1.5 : 0);
  if (k.owl) {
    f.blob(hx, hy, 4.2, 3.8, [C.bodyD, C.body, C.bodyL]);
    f.blob(hx + 1, hy + 0.5, 3, 3, [C.headD, C.head, C.head]);             // facial disc
    f.poly([[hx - 3, hy - 2.5], [hx - 2.5, hy - 6.5], [hx - 0.5, hy - 3]], C.body);   // ear tufts
    f.poly([[hx + 1, hy - 3], [hx + 2, hy - 7], [hx + 3, hy - 2.5]], C.bodyL);
    // big eye
    f.set(hx + 1, hy - 0.5, C.eye); f.set(hx + 2, hy - 0.5, C.eye); f.set(hx + 1, hy + 0.5, C.eye); f.set(hx + 2, hy + 0.5, C.pupil);
    f.set(hx + 1, hy - 1.5, C.mask);
    f.set(hx + 3.5, hy + 1.5, C.beak); f.set(hx + 3.5, hy + 2.5, C.beakD);
    if (taunt && i % 2) f.set(hx + 4.5, hy + 2, C.beak);
  } else {
    f.blob(hx, hy, 3.2, 2.8, [C.headD, C.head, C.head]);
    // dark cap and moustache stripe
    for (let x = hx - 3; x <= hx + 2; x++) f.over(x, hy - 2.5, C.mask);
    f.over(hx + 0.5, hy + 0.5, C.mask); f.over(hx + 0.5, hy + 1.5, C.mask); f.over(hx + 0.5, hy + 2.5, C.mask);
    // eye with yellow ring
    f.set(hx + 1, hy - 1, C.eye); f.set(hx + 2, hy - 1, C.pupil); f.set(hx + 1.5, hy - 1.8, C.eye);
    // hooked beak (open while crying)
    const open = taunt && i >= 2 && i <= 4 ? 1 : 0;
    f.set(hx + 3, hy - 0.5, C.beak); f.set(hx + 4, hy - 0.5, C.beak); f.set(hx + 4, hy + 0.5, C.beak); f.set(hx + 5, hy + 0.5, C.beakD);
    if (open) { f.set(hx + 3, hy + 1.5, C.beak); f.set(hx + 4, hy + 1.5, C.beakD); }
    else f.set(hx + 3, hy + 0.5, C.beakD);
  }
  // talons: tucked while flying, reaching forward in the dive
  if (dive) {
    const r = [0, 1, 3, 3][i];
    f.line(CX + 3, cy + 2, CX + 6 + r, cy + 3 + r * 0.3, 1, C.talon);
    f.set(CX + 7 + r, cy + 3 + r * 0.3, hex("#ffffff")); f.set(CX + 7 + r, cy + 2 + r * 0.3, C.talon);
  } else {
    f.set(CX + 1, cy + 4, C.talon); f.set(CX + 1, cy + 5, C.talon); f.set(CX + 3, cy + 4, C.talon); f.set(CX + 3, cy + 5, C.talon);
  }
  // near wing: folded along the body in the dive
  if (dive) {
    f.poly([[CX + 4, cy - 2], [CX - 9, cy - 1], [CX - 11, cy + 1], [CX + 2, cy + 1]], (x) => (x > CX - 2 ? C.wingL : x > CX - 7 ? C.wing : C.wingD));
    for (let x = CX - 9; x < CX - 1; x += 2) f.over(x, cy, C.wingD);
  } else wing(f, C, sx, sy, beat.e, beat.t, false);
  f.outline(C.outline);

  // effects
  const fx = C.fx, fx2 = C.fx2;
  if (dive) {
    // speed lines behind, sparks on the strike
    for (let j = 0; j < 3; j++) f.spark(CX - 13 - j * 2 - i, cy - 2 + j * 2, j % 2 ? fx2 : fx);
    if (i === 3) [[0, -2], [2, 0], [0, 2], [3, -2], [3, 2]].forEach(([dx, dy]) => f.spark(CX + 12 + dx, cy + 3 + dy, fx));
  }
  if (anim === "fly" && i === 3) { f.spark(sx - 8, sy + 11, fx2); f.spark(sx - 4, sy + 12, fx); }   // downstroke gust
  if (taunt) {
    if (k.owl) {
      // arcane circle growing in front of the owl
      const r = 1.5 + i * 0.7;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / (4 + i)) { const x = hx + 6 + Math.cos(a) * r * 0.5, y = hy + 2 + Math.sin(a) * r; if (!f.get(x, y)) f.spark(x, y, (a * 3 | 0) % 2 ? fx2 : fx); }
      if (i >= 3) f.spark(hx + 6, hy + 2, fx, true);
    } else {
      // cry rings and loose feathers
      if (i >= 2 && i <= 4) for (let r = 2; r <= 2 + (i - 1) * 2; r += 2) [-0.6, 0, 0.6].forEach((a) => f.spark(hx + 5 + Math.cos(a) * r, hy + 1 + Math.sin(a) * r, r % 4 ? fx2 : fx));
      f.spark(CX - 8 + i, 6 + (i % 3), C.wingL); f.spark(CX - 4 - i, 9 - (i % 2), C.wing);
    }
  }
  if (k.owl) [[CX - 6, 6], [CX - 10, 12], [CX + 1, 3]].forEach(([x, y], j) => { if ((i + j) % 3 === 0 && !f.get(x, y)) f.spark(x, y, fx2); });   // star motes
  return f;
}
