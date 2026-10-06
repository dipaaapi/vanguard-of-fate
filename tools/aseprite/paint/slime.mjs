// Detailed slime (32×24, feet at 16,22): idle 4, walk 6, run 6, attack 4, skill 6 per direction.
// Glossy jelly with a core, rising bubbles, drips, splash and charge sparkles.
// `pocket` adds the Novice familiar's sprout and blush so it reads as a friendly pet.
import { Canvas, hex } from "./kit.mjs";

export const W = 32, H = 24;
const GX = 16, GY = 22;
const BAYER = [[0, 2], [3, 1]];

export const FOREST = {
  outline: "#123d0c", deep: "#1f6b10", dark: "#38a800", mid: "#5cc800", base: "#70e000", light: "#9ef01a", hi: "#ccff33",
  spec: "#f4ffd6", core: "#b8ff4a", coreD: "#86d81a", eye: "#10240a", mouth: "#0f2a08", tongue: "#2f7a18", glow: "#eaffb0",
  spark: "#fbffe0", blush: "#4fbf00"
};

// [rx, ry, lift, fwd, lean]
const POSES = {
  idle: [[9.0, 6.6, 0, 0, 0], [9.3, 6.3, 0, 0, 0], [9.7, 6.0, 0, 0, 0], [9.3, 6.3, 0, 0, 0]],
  walk: [[10.2, 5.5, 0, 0, 0.05], [8.2, 7.4, 0, 1, 0.15], [8.5, 7.0, 3, 2, 0.12], [8.9, 6.6, 4, 2, 0.05], [9.6, 5.9, 1, 1, 0], [10.4, 5.3, 0, 0, 0]],
  run: [[10.8, 5.0, 0, 0, 0.1], [8.0, 7.6, 1, 2, 0.3], [8.3, 7.0, 4, 3, 0.35], [8.7, 6.6, 5, 3, 0.3], [9.3, 6.1, 2, 2, 0.2], [11.0, 4.8, 0, 1, 0.1]],
  attack: [[11.0, 4.8, 0, -2, -0.15], [11.0, 5.4, 2, 2, 0.35], [11.8, 4.3, 0, 3, 0.15], [9.6, 6.1, 0, 1, 0]],
  skill: [[9.2, 6.4, 0, 0, 0], [9.8, 6.0, 0, 0, 0], [10.2, 6.8, 0, 0, 0], [10.8, 7.3, 1, 0, 0], [11.0, 7.5, 1, 0, 0], [9.0, 7.0, 0, 0, 0]]
};
export const FRAMES = Object.fromEntries(Object.entries(POSES).map(([a, p]) => [a, p.length]));
export const DURATIONS = { idle: 0.2, walk: 0.1, run: 0.08, attack: 0.1, skill: 0.08 };

export function paintSlime(dir, anim, i, palette = FOREST, pocket = false) {
  const C = Object.fromEntries(Object.entries(palette).map(([k, v]) => [k, hex(v)]));
  C.white = hex("#ffffff");
  const f = new Canvas(W, H);
  const [rx0, ry0, lift, fwd, lean0] = POSES[anim][i];
  const side = dir === "side";
  const lean = side ? lean0 : 0;
  const grow = !side && anim === "attack" && i === 1 ? 0.6 : 0;
  const rx = rx0 + grow, ry = ry0 + grow;
  const cx = GX + (side ? fwd : 0), bottom = GY - lift, cy = bottom - ry;
  const glow = anim === "skill" ? Math.min(4, i) : 0;

  // Body: flatter, wider base; lit from the top-left; dithered bands; glossy rim
  const L = [-0.45, -0.75, 0.5], ll = Math.hypot(...L);
  const ramp = [C.deep, C.dark, C.mid, C.base, C.light, C.hi];
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(bottom); y++) {
    for (let x = Math.floor(cx - rx - 4); x <= Math.ceil(cx + rx + 4); x++) {
      const sx = x + 0.5 - (cx + lean * (bottom - (y + 0.5)));
      const nx = sx / rx, ny = (y + 0.5 - cy) / ry;
      const k = ny > 0 ? nx * nx * (1 - 0.18 * ny) + ny * ny * 1.15 : nx * nx + ny * ny;
      if (k > 1 || y + 0.5 > bottom) continue;
      const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, nx * nx + ny * ny)));
      let li = (nx * L[0] + ny * L[1] + nz * L[2]) / ll + 0.08 * glow;
      if (ny > 0.62 && k > 0.55) li += 0.25;                         // light through the jelly at the base
      const v = (li + 0.35) * 3.0 + (BAYER[y & 1][x & 1] / 4 - 0.375) * 0.9;
      const rim = k > 0.72 && nx < -0.15 && ny < -0.1;
      f.set(x, y, rim ? C.hi : ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(v)))]);
    }
  }
  // Core
  const ccx = cx + (side ? 1.5 : 0.8) + lean * ry * 0.6, ccy = cy + ry * 0.25;
  const cr = Math.max(2, rx * 0.3), crr = Math.max(1.6, ry * 0.3);
  for (let y = Math.floor(ccy - crr); y <= Math.ceil(ccy + crr); y++)
    for (let x = Math.floor(ccx - cr); x <= Math.ceil(ccx + cr); x++) {
      const d = ((x + 0.5 - ccx) / cr) ** 2 + ((y + 0.5 - ccy) / crr) ** 2;
      if (d <= 1) f.over(x, y, d < 0.35 + glow * 0.12 ? (glow >= 3 ? C.glow : C.core) : C.coreD);
    }
  // Specular highlight
  const hx = cx - rx * 0.45 + lean * ry, hy = cy - ry * 0.55;
  [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [-1, 1], [0, 2]].forEach(([dx, dy], j) => f.over(hx + dx, hy + dy, j < 4 ? C.spec : C.hi));
  f.over(hx + 3, hy - 1, C.hi);
  // Bubbles rising inside
  [[-0.35, 0.6, 0], [0.4, 0.75, 2]].forEach(([ox, oy, ph]) => {
    const y = cy + ry * oy - ((i + ph) % 4) * (ry * 0.28), x = cx + rx * ox;
    if (f.get(x, y) && f.get(x, y) !== C.spec) f.set(x, y, C.hi);
  });

  // Face
  const mood = anim === "attack" ? "attack" : anim === "skill" && i >= 2 ? "charge" : "calm";
  if (dir === "up") {
    f.over(cx - 1, cy - ry * 0.2, C.light);
    f.over(cx, cy - ry * 0.3, C.light);
  } else {
    const ey = Math.round(cy - ry * 0.12);
    const eyeAt = (x) => {
      const dark = mood === "charge" ? C.deep : C.eye;
      f.set(x, ey - 1, dark); f.set(x + 1, ey - 1, dark);
      f.set(x, ey, mood === "charge" ? C.spark : C.white); f.set(x + 1, ey, dark);
      f.set(x, ey + 1, dark); f.set(x + 1, ey + 1, dark);
      if (mood === "attack" && !pocket) { f.set(x - 1, ey - 2, C.outline); f.set(x, ey - 2, C.outline); }
    };
    let mx;
    if (dir === "down") {
      const lx = Math.round(cx - 4), rx2 = Math.round(cx + 2);
      eyeAt(lx); eyeAt(rx2);
      f.set(lx - 1, ey + 2, C.blush); f.set(rx2 + 2, ey + 2, C.blush);
      if (pocket) { f.set(lx - 2, ey + 2, C.blush); f.set(rx2 + 3, ey + 2, C.blush); }
      mx = Math.round(cx);
    } else {
      const x = Math.round(cx + rx - 5 + lean * 3);
      eyeAt(x); eyeAt(x - 4);
      if (pocket) f.set(x + 2, ey + 2, C.blush);
      mx = x - 1;
    }
    const my = ey + 3;
    if (mood === "attack") [[-1, 0, C.mouth], [0, 0, C.mouth], [1, 0, C.mouth], [0, 1, C.tongue], [-1, 1, C.mouth], [1, 1, C.mouth]].forEach(([dx, dy, c]) => f.set(mx + dx, my + dy, c));
    else if (mood === "charge") { f.set(mx, my, C.mouth); f.set(mx + 1, my, C.mouth); }
    else if (pocket) { f.set(mx - 1, my, C.mouth); f.set(mx, my + 1, C.mouth); f.set(mx + 1, my, C.mouth); }   // smile
    else { f.set(mx - 1, my, C.mouth); f.set(mx, my, C.mouth); f.set(mx + 1, my, C.mouth); }
  }

  // Pocket Slime's sprout: a stem and two leaves that sway with the body
  if (pocket) {
    const tx = Math.round(cx + lean * ry * 2 + (side ? -1 : 0)), ty = Math.round(cy - ry);
    const sway = anim === "run" || anim === "walk" ? (i % 2 ? 1 : -1) : i % 2;
    f.set(tx, ty, C.deep); f.set(tx, ty - 1, C.dark); f.set(tx + sway * 0.5, ty - 2, C.dark);
    const lx = tx + sway * 0.5;
    [[-1, -3], [-2, -3], [-3, -4], [-2, -4]].forEach(([dx, dy]) => f.set(lx + dx, ty + dy, C.light));
    [[1, -3], [2, -4], [3, -4], [2, -5]].forEach(([dx, dy]) => f.set(lx + dx, ty + dy, C.mid));
    f.set(lx - 2, ty - 4, C.hi);
  }

  // Particles
  const drop = (x, y) => { f.set(x, y, C.light); f.set(x, y + 1, C.mid); };
  if (anim === "run" && lift > 0) {
    if (side) { drop(cx - rx - 2, bottom - 2); drop(cx - rx - 5 + (i % 2), bottom - 1 + (i % 2)); }
    else { f.set(cx - rx - 2, GY - 1, C.mid); f.set(cx + rx + 2, GY - 1, C.mid); f.set(cx - rx - 4, GY - 2, C.light); f.set(cx + rx + 4, GY - 2, C.light); }
  }
  if (anim === "walk" && i === 0) { f.set(cx - rx - 1, GY - 1, C.mid); f.set(cx + rx + 1, GY - 1, C.mid); }
  if (anim === "attack" && i === 2) {
    const sx = side ? cx + rx - 2 : cx;
    (side ? [[0, -9], [3, -11], [-4, -12], [-8, -9]] : [[-6, -12], [-2, -14], [3, -13], [7, -11]]).forEach(([dx, dy]) => drop(sx + dx, GY + dy));
  }
  f.outline(C.outline);
  if (anim === "skill") {
    const n = i === 5 ? 8 : i + 1;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + i * 0.7, r = i === 5 ? 13 : 11 - i * 0.6;
      const x = GX + Math.cos(a) * r, y = GY - 7 + Math.sin(a) * r * 0.6;
      if (!f.get(x, y)) { f.spark(x, y, k % 2 ? C.hi : C.spark); if (i >= 3 && !f.get(x + 1, y)) f.spark(x + 1, y, C.light); }
    }
  }
  return f;
}
