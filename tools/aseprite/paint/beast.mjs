// Detailed four-legged familiar (40×28, feet at 20,26 = the WolfSprite's 17,22 on a bigger canvas):
// idle 4, walk 6, run 6 (gallop), attack 4 (crouch, lunge, bite, recover), skill 6 per direction.
// Kinds: War Hound (steel-grey, collar and shoulder plate, "Stunning Bash" skill)
//        Spirit Fox (orange, bushy white-tipped tail, "Foxfire" skill)
import { Canvas, hex, mixc } from "./kit.mjs";

export const W = 40, H = 28;
const GX = 20, G = 25;    // centre column, ground row (feet)
export const FRAMES = { idle: 4, walk: 6, run: 6, attack: 4, skill: 6 };
export const DURATIONS = { idle: 0.22, walk: 0.1, run: 0.07, attack: 0.09, skill: 0.08 };

export const KINDS = {
  hound: {
    fur: "#64748b", furD: "#475569", furDD: "#1e293b", furL: "#94a3b8", hi: "#cbd5e1", belly: "#e2e8f0", bellyD: "#a8b5c6",
    eye: "#38bdf8", nose: "#0b1220", fang: "#ffffff", outline: "#0b1220", mouth: "#3b0a12",
    collar: "#b45309", stud: "#fde047", plate: "#94a3b8", plateL: "#e2e8f0", plateD: "#334155",
    aura: "#7dd3fc", spark: "#e0f2fe", ears: "pointy", tail: "short"
  },
  fox: {
    fur: "#f97316", furD: "#c2410c", furDD: "#7c2d12", furL: "#fdba74", hi: "#fed7aa", belly: "#fff7ed", bellyD: "#f5d0b0",
    eye: "#fde047", nose: "#1c0a03", fang: "#ffffff", outline: "#431407", mouth: "#4a0d05",
    earTip: "#431407", tip: "#fff7ed", flame: "#fde047", flameM: "#fb923c", flameD: "#ea580c",
    aura: "#fb923c", spark: "#fef3c7", ears: "big", tail: "bushy"
  }
};

const TAU = Math.PI * 2;

/** Pose for one frame: body offsets, head offsets, leg phases, flags. */
function pose(anim, i, n) {
  const p = { bx: 0, by: 0, hx: 0, hy: 0, stretch: 0, legs: null, stride: 0, lift: 0, open: 0, wag: 0, ear: 0, aura: 0, fx: null };
  const ph = (i / n) * TAU;
  if (anim === "idle") {
    p.by = [0, 0, 1, 0][i]; p.hy = p.by; p.wag = [0, 1, 2, 1][i]; p.ear = i === 2 ? 1 : 0;
    p.legs = [0, 0, 0, 0]; p.stride = 0;
  } else if (anim === "walk") {
    p.by = Math.round(Math.abs(Math.sin(ph * 2)) * 0.6); p.hy = p.by; p.wag = Math.round(Math.sin(ph) * 1.5) + 1;
    p.legs = [ph, ph + Math.PI / 2, ph + Math.PI, ph + 1.5 * Math.PI]; p.stride = 3.2; p.lift = 2;
  } else if (anim === "run") {
    // gallop: hind pair, then front pair; body stretches when the legs reach out
    p.by = [1, 0, -1, -2, -1, 0][i]; p.hy = p.by + [1, 0, 0, -1, 0, 1][i];
    p.stretch = [-1, 0, 1, 2, 1, 0][i]; p.wag = 3;
    p.legs = [ph, ph + 0.5, ph + Math.PI, ph + Math.PI + 0.5]; p.stride = 4; p.lift = 3;
    p.lean = [0.1, 0, -0.05, -0.1, 0, 0.05][i];
    p.fx = "dust";
  } else if (anim === "attack") {
    p.bx = [-1, 2, 3, 1][i]; p.by = [1, 0, 0, 0][i]; p.hx = [-1, 3, 4, 1][i]; p.hy = [2, 0, 0, 0][i];
    p.open = [0, 2, 0, 0][i]; p.legs = [0, 0, 0, 0]; p.reach = [0, 3, 2, 0][i]; p.ear = i === 0 ? -1 : 0;
    p.fx = i === 2 ? "bite" : null;
  } else {   // skill: charge (0-2), leap (3), strike (4), recover (5)
    p.bx = [-1, -1, -2, 2, 4, 1][i]; p.by = [1, 1, 2, -1, 0, 0][i]; p.hx = [-1, -1, -1, 3, 5, 1][i]; p.hy = [2, 2, 3, -1, 0, 0][i];
    p.open = [0, 0, 1, 2, 0, 0][i]; p.legs = [0, 0, 0, 0]; p.reach = [0, 0, 0, 3, 3, 0][i];
    p.aura = [1, 2, 3, 3, 4, 1][i]; p.wag = [1, 2, 3, 3, 0, 1][i];
    p.fx = i === 4 ? "skillHit" : i === 5 ? "skillAfter" : "charge";
  }
  return p;
}

export function paintBeast(kind, dir, anim, i) {
  const k = KINDS[kind];
  const C = Object.fromEntries(Object.entries(k).filter(([, v]) => typeof v === "string" && v.startsWith("#")).map(([n, v]) => [n, hex(v)]));
  const f = new Canvas(W, H);
  const p = pose(anim, i, FRAMES[anim]);
  const ramp = [C.furDD, C.furD, C.fur, C.furL, C.hi];
  const rampD = [C.furDD, C.furDD, C.furD, C.fur, C.furL];
  const belly = { c: [C.bellyD, C.belly], from: 0.35 };
  if (dir === "side") side(f, k, C, p, ramp, rampD, belly, anim, i);
  else if (dir === "down") front(f, k, C, p, ramp, rampD, belly, anim, i);
  else back(f, k, C, p, ramp, rampD, anim, i);
  effects(f, k, C, p, dir, anim, i);
  return f;
}

// Leg from hip (x, y) to the ground with a knee; t = gait phase or null (planted)
function leg(f, hx, hy, ph, stride, lift, near, hind, C, reach = 0) {
  const sw = ph == null ? 0 : Math.sin(ph);
  const up = ph == null ? 0 : Math.max(0, Math.cos(ph)) * lift;
  const fx = hx + sw * stride + (hind ? -reach : reach), fy = G - up;
  const kx = (hx + fx) / 2 + (hind ? -1.5 : 0.8), ky = (hy + fy) / 2 - (up ? 0.5 : 0);
  const col = near ? (t) => (t < 0.3 ? C.fur : C.furD) : (t) => (t < 0.3 ? C.furD : C.furDD);
  f.line(hx, hy, kx, ky, 3, col);
  f.line(kx, ky, fx, fy - 1, 2, near ? C.furD : C.furDD);
  // paw
  f.set(fx, fy, near ? C.furD : C.furDD); f.set(fx + 1, fy, near ? C.fur : C.furD);
  if (near) f.set(fx + 1, fy - 1, C.furL);
}

function tailSide(f, k, C, x, y, wag, lean = 0) {
  if (k.tail === "bushy") {
    const pts = [[0, 0, 1.6], [-2, -1 - wag * 0.3, 2.2], [-4, -2.5 - wag * 0.5, 2.8], [-6, -4.5 - wag * 0.7, 3], [-7.5, -7 - wag * 0.8, 2.6], [-8, -9.5 - wag, 1.8]];
    pts.forEach(([dx, dy, r], j) => f.blob(x + dx, y + dy + lean * 2, r, r * 0.9, j >= 4 ? [C.bellyD, C.tip, C.tip, C.tip] : [C.furDD, C.furD, C.fur, C.furL, C.hi]));
  } else {
    const pts = [[0, 0, 1.5], [-1.8, -1, 1.4], [-3.2, -2.3 - wag * 0.4, 1.3], [-4.4, -3.5 - wag * 0.6, 1.2], [-5.3, -4.8 - wag * 0.8, 1]];
    pts.forEach(([dx, dy, r], j) => f.blob(x + dx, y + dy, r, r, j > 2 ? [C.furD, C.fur, C.furL] : [C.furDD, C.furD, C.fur]));
  }
}

function earSide(f, k, C, x, y, twitch) {
  if (k.ears === "big") {
    f.poly([[x - 2, y + 1], [x + 0.5 - twitch, y - 5.5], [x + 3, y + 1]], (px, py) => (py < y - 3.5 ? C.earTip : px < x ? C.furL : C.fur));
    f.over(x + 0.5, y - 1, C.mouth);
  } else {
    f.poly([[x - 1.5, y + 1], [x - twitch, y - 3.5], [x + 2.5, y + 1]], (px, py) => (py < y - 2 ? C.furD : C.fur));
    f.over(x, y - 0.5, C.furDD);
  }
}

function side(f, k, C, p, ramp, rampD, belly, anim, i) {
  const bx = 18 + p.bx, by = 15 + p.by, hx = 28.5 + p.hx + p.stretch, hy = 9.5 + p.hy;
  const legs = p.legs || [0, 0, 0, 0];
  const moving = anim === "walk" || anim === "run";
  const L = (j) => (moving ? legs[j] : null);
  const reach = p.reach || 0;
  // far legs (darker)
  leg(f, bx - 5 - p.stretch, by + 2, L(2), p.stride, p.lift, false, true, C, reach);
  leg(f, bx + 6 + p.stretch, by + 2, L(3), p.stride, p.lift, false, false, C, reach);
  // tail
  tailSide(f, k, C, bx - 7.5 - p.stretch, by - 2, p.wag);
  // body + chest
  f.blob(bx, by, 8.5 + p.stretch * 0.6, 4.3, ramp, { belly, rim: C.hi, lean: p.lean || 0 });
  f.blob(bx + 6 + p.stretch, by - 0.5, 4, 4.6, ramp, { belly, rim: C.hi });
  // fur tufts along the back
  for (let x = -6; x <= 5; x += 2) f.over(bx + x, by - 4 + (x % 4 === 0 ? 0 : 1), C.furD);
  if (k.plate) {   // War Hound shoulder plate
    f.blob(bx + 5 + p.stretch, by - 2.5, 3.2, 2.4, [hex(k.plateD), hex(k.plate), hex(k.plate), hex(k.plateL)]);
    f.set(bx + 4 + p.stretch, by - 3, hex(k.plateL));
  }
  if (k.tip) for (let y = 0; y < 4; y++) f.over(bx + 8 + p.stretch, by + y, C.belly);   // fox chest fluff
  // near legs, the hind one from a muscular haunch
  f.blob(bx - 5.5 - p.stretch, by + 0.5, 3, 3.3, ramp, { rim: C.hi });
  leg(f, bx - 6 - p.stretch, by + 2, L(0), p.stride, p.lift, true, true, C, reach);
  leg(f, bx + 5 + p.stretch, by + 2.5, L(1), p.stride, p.lift, true, false, C, reach);
  // neck
  f.line(bx + 7 + p.stretch, by - 2, hx - 1, hy + 1.5, 4, C.fur);
  // collar
  if (k.collar) {
    f.line(hx - 3.5, hy + 0.5, hx - 1.5, hy + 4.5, 2, hex(k.collar));
    f.set(hx - 2.5, hy + 3, hex(k.stud));
  }
  // head, snout, jaw
  f.blob(hx, hy, 3.4, 3, ramp, { rim: C.hi });
  const snoutL = k.ears === "big" ? 3.4 : 3.2;
  f.blob(hx + 3.2, hy + 1.4, snoutL, 1.5, [C.furD, C.fur, C.furL, C.hi]);
  f.set(hx + 3.2 + snoutL, hy + 0.8, C.nose); f.set(hx + 2.6 + snoutL, hy + 0.8, C.nose);
  const jawY = hy + 2.8 + p.open;
  f.line(hx + 1, hy + 2.6, hx + 2 + snoutL, jawY, 2, (t) => (t < 0.5 ? C.furD : C.bellyD));
  if (p.open) {
    for (let x = hx + 1.5; x < hx + 2 + snoutL; x++) for (let y = hy + 2.5; y < jawY; y++) f.set(x, y, C.mouth);
    f.set(hx + 1.5 + snoutL, hy + 2.5, C.fang); f.set(hx + 1 + snoutL, jawY - 0.5, C.fang);
  }
  earSide(f, k, C, hx - 1, hy - 2.5, p.ear);
  // eye with glint (glows while charging)
  const glow = p.aura >= 2;
  f.set(hx + 1, hy - 0.5, glow ? hex(k.spark) : C.eye); f.set(hx + 2, hy - 0.5, C.nose);
  f.set(hx + 1, hy + 0.5, C.nose);
  f.outline(C.outline);
}

function front(f, k, C, p, ramp, rampD, belly, anim, i) {
  const moving = anim === "walk" || anim === "run";
  const by = 16 + p.by, hy = 10 + p.hy + (p.hx > 2 ? 1 : 0);
  const grow = p.hx > 2 ? 0.6 : 0;       // lunging toward the viewer reads as bigger
  const lift = (j) => (moving ? Math.max(0, Math.cos((p.legs || [0, 0, 0, 0])[j])) * (p.lift + 1) : 0);
  // hind legs peeking out behind
  [[14.5, 2], [25.5, 0]].forEach(([x, j]) => { f.blob(x, G - 3.5 - lift(j), 1.6, 2.4, [C.furDD, C.furD, C.fur]); f.set(x, G - lift(j), C.furDD); });
  // tail tip wagging behind
  const tw = [-1, 0, 1, 0, -1, 1][i % 6] * (p.wag ? 1 : 0);
  if (k.tail === "bushy") f.blob(27 + tw, by - 4, 2.6, 2.2, [C.furD, C.fur, C.tip, C.tip]);
  else f.blob(26.5 + tw, by - 4, 1.3, 1.6, [C.furD, C.fur, C.furL]);
  // chest/body
  f.blob(GX, by, 5.2 + grow, 4.8 + grow, ramp, { belly: { c: [C.bellyD, C.belly], from: -0.2 }, rim: C.hi });
  // front legs: thin, with paws
  [[17.5, 1], [22.5, 3]].forEach(([x, j]) => {
    f.line(x, by + 2, x, G - 1 - lift(j), 2, (t) => (t < 0.5 ? C.fur : C.furD));
    f.set(x - 1, G - lift(j), C.furD); f.set(x, G - lift(j), C.furL); f.set(x + 1, G - lift(j), C.furD);
  });
  // head
  const hr = 5.6 + grow;
  // ears
  if (k.ears === "big") {
    f.poly([[GX - 5.5, hy - 1], [GX - 5 - p.ear, hy - 8], [GX - 1.5, hy - 3]], (x, y) => (y < hy - 6 ? C.earTip : C.fur));
    f.poly([[GX + 5.5, hy - 1], [GX + 5 + p.ear, hy - 8], [GX + 1.5, hy - 3]], (x, y) => (y < hy - 6 ? C.earTip : C.furD));
    f.over(GX - 4.5, hy - 4, C.mouth); f.over(GX + 4.5, hy - 4, C.mouth);
  } else {
    f.poly([[GX - 5, hy - 1], [GX - 4.5 - p.ear, hy - 6.5], [GX - 1.5, hy - 3]], C.fur);
    f.poly([[GX + 5, hy - 1], [GX + 4.5 + p.ear, hy - 6.5], [GX + 1.5, hy - 3]], C.furD);
    f.over(GX - 4, hy - 3.5, C.furDD); f.over(GX + 4, hy - 3.5, C.furDD);
  }
  f.blob(GX, hy, hr, hr * 0.84, ramp, { rim: C.hi });
  if (k.tip) { f.blob(GX - 3.2, hy + 2, 1.8, 1.2, [C.bellyD, C.belly]); f.blob(GX + 3.2, hy + 2, 1.8, 1.2, [C.bellyD, C.belly]); }  // fox cheeks
  // collar
  if (k.collar) {
    for (let x = GX - 4; x <= GX + 4; x++) f.over(x, hy + 4.5 + Math.abs(x - GX) * -0.15, hex(k.collar));
    f.set(GX, hy + 5, hex(k.stud));
  }
  // snout
  f.blob(GX, hy + 2.2, 2.6, 1.9, [C.bellyD, C.belly, C.belly]);
  f.set(GX - 0.5, hy + 1, C.nose); f.set(GX + 0.5, hy + 1, C.nose); f.set(GX - 0.5, hy + 0.5, C.nose);
  if (p.open) {
    for (let x = GX - 1.5; x <= GX + 1.5; x++) for (let y = hy + 3; y <= hy + 3 + p.open; y++) f.set(x, y, C.mouth);
    f.set(GX - 1.5, hy + 3, C.fang); f.set(GX + 1.5, hy + 3, C.fang);
  } else f.set(GX, hy + 3, C.furD);
  // eyes
  const glow = p.aura >= 2;
  [GX - 3, GX + 2].forEach((x) => {
    f.set(x, hy - 1, C.nose); f.set(x + 1, hy - 1, C.nose);
    f.set(x, hy, glow ? hex(k.spark) : C.eye); f.set(x + 1, hy, C.nose);
  });
  f.outline(C.outline);
}

function back(f, k, C, p, ramp, rampD, anim, i) {
  const moving = anim === "walk" || anim === "run";
  const by = 15 + p.by, hy = 8 + p.hy - (p.hx > 2 ? 1 : 0);
  const lift = (j) => (moving ? Math.max(0, Math.cos((p.legs || [0, 0, 0, 0])[j])) * (p.lift + 1) : 0);
  // head (far), ears
  if (k.ears === "big") {
    f.poly([[GX - 4.5, hy], [GX - 4 - p.ear, hy - 7], [GX - 1, hy - 2]], (x, y) => (y < hy - 5 ? C.earTip : C.furD));
    f.poly([[GX + 4.5, hy], [GX + 4 + p.ear, hy - 7], [GX + 1, hy - 2]], (x, y) => (y < hy - 5 ? C.earTip : C.furD));
  } else {
    f.poly([[GX - 4, hy], [GX - 3.5 - p.ear, hy - 5.5], [GX - 1, hy - 2]], C.furD);
    f.poly([[GX + 4, hy], [GX + 3.5 + p.ear, hy - 5.5], [GX + 1, hy - 2]], C.furDD);
  }
  f.blob(GX, hy, 4.2, 3.6, rampD, { rim: C.furL });
  // front legs (far)
  f.line(16.5, by, 16.5, G - 1 - lift(1), 2, C.furDD);
  f.line(23.5, by, 23.5, G - 1 - lift(3), 2, C.furDD);
  // back
  f.blob(GX, by, 5.4, 5.2, ramp, { rim: C.hi });
  for (let y = -4; y <= 3; y++) f.over(GX, by + y, C.furD);   // spine
  if (k.plate) { f.blob(GX, by - 3, 3, 1.6, [hex(k.plateD), hex(k.plate), hex(k.plateL)]); }
  if (k.collar) for (let x = GX - 3; x <= GX + 3; x++) f.over(x, hy + 3.5, hex(k.collar));
  // hind legs
  [[15.5, 0], [24.5, 2]].forEach(([x, j]) => {
    f.blob(x, by + 2, 2.6, 3.2, ramp, { rim: C.hi });
    f.line(x, by + 4, x, G - 1 - lift(j), 2, (t) => (t < 0.5 ? C.fur : C.furD));
    f.set(x, G - lift(j), C.furD); f.set(x + 1, G - lift(j), C.furD);
  });
  // tail up over the back, wagging
  const tw = [-1, 0, 1, 0, -1, 1][i % 6] * (p.wag ? 1.5 : 0.5);
  if (k.tail === "bushy") {
    [[0, 4, 2], [0.5 * tw, 1, 2.6], [tw, -2, 3], [tw * 1.2, -5, 2.5]].forEach(([dx, dy, r], j) => f.blob(GX + dx, by + dy, r, r, j === 3 ? [C.bellyD, C.tip, C.tip] : [C.furD, C.fur, C.furL]));
  } else {
    [[0, 4], [0.3 * tw, 2.5], [0.7 * tw, 1], [tw, -0.5]].forEach(([dx, dy]) => f.blob(GX + dx, by + dy, 1.3, 1.3, [C.furD, C.fur, C.furL]));
  }
  f.outline(C.outline);
}

function effects(f, k, C, p, dir, anim, i) {
  const aura = hex(k.aura), spark = hex(k.spark);
  if (p.fx === "dust" && (i === 0 || i === 5)) {
    const x = dir === "side" ? 9 : GX - 8;
    f.spark(x, G, hex("#a8a29e")); f.spark(x - 2, G - 1, hex("#d6d3d1"));
    if (dir !== "side") { f.spark(GX + 8, G, hex("#a8a29e")); f.spark(GX + 10, G - 1, hex("#d6d3d1")); }
  }
  if (p.fx === "bite") {
    const x = dir === "side" ? 37 : GX, y = dir === "side" ? 11 : 6;
    [[0, -2], [2, 0], [0, 2], [-2, 0], [1.5, -1.5], [-1.5, 1.5]].forEach(([dx, dy]) => f.spark(x + dx, y + dy, spark));
  }
  if (k.flame) {   // Spirit Fox: little flames at the tail tip, bigger while using its skill
    const s = p.aura || 0;
    const tx = dir === "side" ? 18 + p.bx - 7.5 - 8 : dir === "up" ? GX : 27, ty = dir === "side" ? 15 + p.by - 2 - 10.5 - p.wag : dir === "up" ? 15 + p.by - 8 : 16 + p.by - 7;
    const fl = [hex(k.flame), hex(k.flameM), hex(k.flameD)];
    const hgt = 2 + s + (i % 2);
    for (let j = 0; j < hgt; j++) f.spark(tx + ((i + j) % 3 === 0 ? 1 : 0) - (j === hgt - 1 ? 0 : 0), ty - j, fl[Math.min(2, Math.floor(j / Math.max(1, hgt / 3)))]);
    if (s >= 2) { f.spark(tx - 1, ty - 1, fl[1]); f.spark(tx + 1, ty - 2, fl[0]); }
  }
  if (anim !== "skill") return;
  if (p.fx === "charge") {
    // rising motes and a ring on the ground
    const n = 3 + i * 2;
    for (let j = 0; j < n; j++) {
      const a = (j / n) * TAU + i, r = 13 - i;
      const x = GX + Math.cos(a) * r, y = G - 6 - ((j * 3 + i * 2) % 12);
      if (!f.get(x, y)) f.spark(x, y, j % 2 ? aura : spark);
    }
    for (let a = 0; a < TAU; a += TAU / 16) { const x = GX + Math.cos(a) * (10 - i), y = G + Math.sin(a) * 1.5; if (!f.get(x, y)) f.spark(x, y, aura); }
    if (k.flame) for (let j = 0; j < i + 1; j++) {           // foxfire orbs orbiting
      const a = (j / (i + 1)) * TAU + i * 0.9;
      f.spark(GX + Math.cos(a) * 12, 12 + Math.sin(a) * 5, hex(k.flame), true);
    }
  }
  if (p.fx === "skillHit") {
    const x = dir === "side" ? 36 : GX, y = dir === "side" ? 12 : 5;
    for (let a = 0; a < TAU; a += TAU / 10) { f.spark(x + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5, a % 2 < 1 ? spark : aura); }
    f.spark(x, y, spark, true);
    if (k.flame) for (let j = 0; j < 6; j++) f.spark(x - 2 + j, y - 4 + ((j * 7) % 5), hex(k.flameM));
  }
  if (p.fx === "skillAfter") {
    // dizzy stars (hound's stun) or embers (fox)
    const col = k.flame ? hex(k.flameM) : hex("#fde047");
    const x = dir === "side" ? 34 : GX, y = dir === "side" ? 6 : 2;
    [[-3, 0], [0, -1.5], [3, 0]].forEach(([dx, dy]) => f.spark(x + dx, y + dy, col, true));
  }
}

export const mix = mixc;
