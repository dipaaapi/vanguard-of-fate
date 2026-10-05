// Detailed bosses of the Dark Continent (aseprite/boss/<key>.aseprite). Each replaces a 2×-scaled code
// sprite, so the canvas is twice the code sprite's size and the feet sit where the game anchors them:
//   dolora   64×72,  feet 32,68 — Dolora, the Weeping Matron: a floating veiled wraith with a tear lantern
//   morgrave 96×104, feet 48,100 — Morgrave, the Ossuary Warlord: armoured skeleton general, bone greatsword
//   vorgath  112×112, feet 56,108 — Vorgath, the Chained Warden: hunched demon jailer with broken chains
// idle 4, walk 6, run 6, attack 4 (ready, then the strike), skill 6 (charge with a growing aura, release)
// for down, side (faces right) and up. Bodies are lit volumes with dithering, a rim light and a dark
// outline; effect pixels (glows, motes, tears, dust) are not outlined.
import { Canvas, hex, mixc } from "./kit.mjs";

export const FRAMES = { idle: 4, walk: 6, run: 6, attack: 4, skill: 6 };
const TAU = Math.PI * 2;
const H = (s) => hex(s);
const ramp = (...cs) => cs.map(H);
const LIGHT = (() => { const l = [-0.45, -0.75, 0.5], n = Math.hypot(...l); return l.map((v) => v / n); })();
const BAYER = [[0, 2], [3, 1]];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dith = (x, y, t) => (BAYER[y & 1][x & 1] + 0.5) / 4 < t;
// Stable per-pixel noise in [0, 1)
const noise = (x, y, s = 0) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };

/** Colour from a dark → light ramp for a surface normal, with a 2×2 ordered dither. */
function tone(r, nx, ny, nz, x, y, bias = 0) {
  const li = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2] + bias;
  const v = (li + 0.35) * (r.length / 2) + (BAYER[y & 1][x & 1] / 4 - 0.375) * 0.9;
  return r[clamp(Math.floor(v), 0, r.length - 1)];
}

/** Lit capsule from a to b, radius r0 → r1 (limbs, bones, poles, horns). o: bias, rim, fx, skip(x, y). */
function capsule(f, x0, y0, x1, y1, r0, r1, rp, o = {}) {
  const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, R = Math.max(r0, r1);
  for (let y = Math.floor(Math.min(y0, y1) - R - 1); y <= Math.ceil(Math.max(y0, y1) + R + 1); y++) {
    for (let x = Math.floor(Math.min(x0, x1) - R - 1); x <= Math.ceil(Math.max(x0, x1) + R + 1); x++) {
      const px = x + 0.5, py = y + 0.5;
      const t = clamp(((px - x0) * dx + (py - y0) * dy) / L2, 0, 1);
      const cx = x0 + dx * t, cy = y0 + dy * t, r = r0 + (r1 - r0) * t;
      const ex = px - cx, ey = py - cy, d = Math.hypot(ex, ey);
      if (d > r || (o.skip && o.skip(x, y))) continue;
      const nx = ex / r, ny = ey / r, nz = Math.sqrt(Math.max(0, 1 - (d * d) / (r * r)));
      let c = tone(rp, nx, ny, nz, x, y, o.bias || 0);
      if (o.rim && d / r > 0.62 && nx < -0.15 && ny < 0.2) c = o.rim;
      f.set(x, y, c, !!o.fx);
    }
  }
}

/** Lit ellipse (wrapper over Canvas.blob with a few extras). */
function ell(f, cx, cy, rx, ry, rp, o = {}) { f.blob(cx, cy, rx, ry, rp, o); }

/** Paint `draw` on its own layer, outline it with `col` (inner lines), then lay it on f. */
function part(f, col, draw) {
  const t = new Canvas(f.w, f.h);
  draw(t);
  if (col) t.outline(col);
  f.blit(t, 0, 0);
  return t;
}

/** Shift rows (lean, sway) and move the whole figure by (ox, oy). */
function warp(f, shift, ox = 0, oy = 0) {
  const g = new Canvas(f.w, f.h);
  for (let y = 0; y < f.h; y++) {
    const dx = Math.round(shift(y)) + ox;
    for (let x = 0; x < f.w; x++) { const j = y * f.w + x, c = f.px[j]; if (c) g.set(x + dx, y + oy, c, f.fx.has(j)); }
  }
  return g;
}

/** Tint painted (non-effect) pixels toward `col` near (cx, cy): bounce light from a glow. */
function glowLight(f, cx, cy, r, col, k = 0.45) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    const c = f.get(x, y), d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
    if (!c || d > 1 || f.fx.has(y * f.w + x)) continue;
    f.set(x, y, mixc(c, col, (1 - d) * k));
  }
}

/** Radial glow of fx pixels: ramp[0] at the centre; only on empty pixels unless `over`. */
function halo(f, cx, cy, r, rp, density = 1, over = false, squash = 1) {
  for (let y = Math.floor(cy - r * squash); y <= cy + r * squash; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    const d = Math.hypot(x + 0.5 - cx, (y + 0.5 - cy) / squash) / r;
    if (d > 1 || (!over && f.get(x, y))) continue;
    if (!dith(x, y, (1 - d) * density * 1.4)) continue;
    f.set(x, y, rp[clamp(Math.floor(d * rp.length), 0, rp.length - 1)], true);
  }
}

/** Dotted ellipse ring of fx pixels (ground auras, shock rings). */
function ringFx(f, cx, cy, rx, ry, rp, step = 1, phase = 0) {
  const n = Math.ceil(TAU * Math.max(rx, ry) / step);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + phase, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    if (f.get(x, y) && !f.fx.has(Math.round(y) * f.w + Math.round(x))) continue;
    f.set(x, y, rp[k % rp.length], true);
  }
}

/** A chain of alternating links along a polyline. pts = [[x, y], …]. */
function chain(f, pts, C, o = {}) {
  const step = o.step || 3;
  let k = 0, acc = 0;
  for (let s = 0; s + 1 < pts.length; s++) {
    const [ax, ay] = pts[s], [bx, by] = pts[s + 1], len = Math.hypot(bx - ax, by - ay);
    for (let d = acc; d < len; d += step, k++) {
      const x = ax + (bx - ax) * d / len, y = ay + (by - ay) * d / len;
      const ux = (bx - ax) / len, uy = (by - ay) / len;
      if (k % 2 === 0) {   // link seen flat: a small ring
        for (let a = 0; a < TAU; a += TAU / 10) {
          const px = x + Math.cos(a) * 1.6 * ux - Math.sin(a) * 1.1 * uy, py = y + Math.cos(a) * 1.6 * uy + Math.sin(a) * 1.1 * ux;
          f.set(px, py, Math.sin(a) < -0.3 ? C.hi : Math.sin(a) > 0.4 ? C.dark : C.mid, !!o.fx);
        }
      } else {             // link seen edge-on: a short bar
        f.set(x - ux, y - uy, C.mid, !!o.fx); f.set(x, y, C.light, !!o.fx); f.set(x + ux, y + uy, C.mid, !!o.fx);
      }
    }
    acc = 0;
  }
}

/** Points along a hanging, swinging chain: from (x, y), length len, swing (radians), sag curl. */
function hang(x, y, len, swing, curl = 0, n = 8) {
  const pts = [[x, y]];
  let a = Math.PI / 2 + swing, px = x, py = y;
  for (let k = 1; k <= n; k++) { a += curl / n; px += Math.cos(a) * len / n; py += Math.sin(a) * len / n; pts.push([px, py]); }
  return pts;
}

// ======================================================================
// DOLORA, the Weeping Matron (64×72, feet 32,68)
// ======================================================================
const DO = {
  veil: ramp("#283042", "#465269", "#6f7c93", "#9eabc0", "#c9d2df", "#eef2f7", "#ffffff"),
  gown: ramp("#121722", "#1f2737", "#2f3a50", "#44526d", "#62728f", "#8796b2"),
  skin: ramp("#7d8798", "#a9b3c2", "#d3dae4", "#eef2f7", "#ffffff"),
  iron: ramp("#0c0f16", "#1d2330", "#353e50", "#5a6478"),
  thorn: ramp("#07080c", "#151821", "#262b38", "#3d4455"),
  sash: ramp("#1e2a44", "#2f4366", "#46608d", "#6683b3"),
  outline: H("#0b0e16"), inner: H("#1a2030"),
  tear: H("#030407"), tearD: H("#11151f"), glint: H("#7df3ff"),
  cyan: ramp("#ffffff", "#d9fbff", "#7df3ff", "#22d3ee", "#0e7490", "#164e63"),
  wisp: ramp("#e2e8f0", "#b8c3d3", "#8b98ad", "#64708a")
};

function doloraPose(anim, i, n) {
  const ph = (i / n) * TAU;
  const p = { bob: 0, lean: 0, sway: 0, trail: 0, claw: null, lantern: null, glow: 1, flutter: ph, tears: 0, arc: null, burst: 0, open: 0 };
  if (anim === "idle") { p.bob = [0, -1, -1, 0][i]; p.sway = [0.3, 0, -0.3, 0][i]; p.trail = 0.2; }
  else if (anim === "walk") { p.bob = Math.round(Math.sin(ph) * 1.2); p.sway = Math.sin(ph) * 1; p.trail = 0.8; p.lean = 0.6; }
  else if (anim === "run") { p.bob = Math.round(Math.sin(ph) * 1.5) - 1; p.sway = Math.sin(ph) * 1.4; p.trail = 1.8; p.lean = 2.2; p.streak = true; }
  else if (anim === "attack") {
    // ready (claw raised back) → sweep → follow-through → recover
    p.claw = [[-18, -26], [-4, -6], [16, -2], [8, -8]][i];
    p.reach = [0, 2, 4, 1][i];
    p.arc = [null, 0.55, 1, 0.5][i];
    p.lean = [-1, 0.5, 1.5, 0.5][i]; p.trail = 0.6; p.open = [0, 1, 1, 0][i];
  } else {
    // skill: raise the lantern (0-2), tears spiral in (2-4), release (5)
    p.lantern = [[11, -6], [9, -16], [7, -26], [7, -28], [7, -29], [7, -27]][i];
    p.glow = [1.4, 2, 2.6, 3.2, 3.8, 4.6][i]; p.tears = i; p.burst = i === 5 ? 1 : 0; p.bob = [0, -1, -2, -2, -2, -1][i];
    p.trail = 0.4; p.open = i >= 3 ? 1 : 0;
  }
  return p;
}

function paintDolora(dir, anim, i) {
  const n = FRAMES[anim], p = doloraPose(anim, i, n);
  let f = new Canvas(64, 72);
  const CX = 32;
  const side = dir === "side", back = dir === "up";
  // ----- figure (neutral position; lean / sway / bob applied by warp) -----
  // lantern hand and claw hand (relative to the shoulders)
  const shL = side ? [33, 26] : back ? [24, 26] : [39, 26];      // lantern arm shoulder
  const shC = side ? [30, 26] : back ? [40, 26] : [25, 26];      // claw arm shoulder
  const lanHand = p.lantern ? [shL[0] + (back ? -p.lantern[0] : p.lantern[0]), shL[1] + p.lantern[1] + 16]
    : side ? [40, 41] : back ? [20, 41] : [44, 41];
  if (anim === "attack" && !p.lantern) { lanHand[0] += side ? -2 : 0; }
  const clawHand = p.claw ? [shC[0] + (back ? -p.claw[0] : p.claw[0]) * (side ? 1.1 : 1), shC[1] + p.claw[1] + 16]
    : side ? [27, 42] : back ? [44, 42] : [20, 42];
  if (p.claw && !side && !back) clawHand[0] = shC[0] + p.claw[0] * -1 + (p.claw[0] > 0 ? 2 * p.claw[0] + 2 : 0);
  // the claw sweeps from her right (image left) across to the image right in the front view
  if (p.claw && dir === "down") clawHand[0] = [10, 22, 42, 36][i];
  if (p.claw && dir === "up") clawHand[0] = [54, 42, 22, 28][i];
  if (p.claw && side) clawHand[0] = [16, 34, 50, 42][i];

  // back veil drape (behind everything; over the back in the up view): widens to pointed, tattered strips
  const drape = () => part(f, DO.inner, (g) => {
    const trailX = side ? -7 - p.trail * 4 : 0;
    const top = 11, bot = back ? 60 : side ? 56 : 54;
    for (let y = top; y <= bot + 4; y++) {
      const u = (y - top) / (bot - top);
      const w = (side ? 5 : 8) + Math.min(1, u) * (side ? 8 : 11) + Math.sin(y * 0.7 + p.flutter) * 0.6;
      const cx = (side ? 30 : CX) + trailX * u * u + Math.sin(p.flutter + u * 3) * p.trail * u;
      for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
        const nx = (x + 0.5 - cx) / w;
        if (Math.abs(nx) > 1) continue;
        // pointed strips at the bottom
        const strip = (x - cx + 40 + Math.sin(p.flutter) * 0.8) % 5 / 5;
        const tip = bot - 8 + Math.abs(strip - 0.5) * 2 * -10 + 10 + noise(Math.floor((x - cx + 40) / 5), 9) * 4;
        if (y > tip) continue;
        const fold = Math.sin(nx * 7 + u * 2) * 0.35;
        const c = tone(DO.veil, clamp(nx + fold, -1, 1), -0.1, Math.sqrt(Math.max(0, 1 - nx * nx)) * 0.8, x, y, back ? 0.12 : 0.02);
        if (y > tip - 3 && !dith(x, y, 0.6)) continue;
        g.set(x, y, c);
      }
    }
  });
  if (!back) drape();

  // gown skirt (bell) fading into wisps
  const skirtTop = 33, hem = 57;
  part(f, DO.inner, (g) => {
    for (let y = skirtTop; y <= hem + 1; y++) {
      const u = (y - skirtTop) / (hem - skirtTop);
      const w = side ? 4.5 + u * 8 : 6 + u * 10.5;
      const cx = (side ? 31 - p.trail * u * u * 3 : CX);
      for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
        const nx = (x + 0.5 - cx) / w;
        if (Math.abs(nx) > 1) continue;
        if (y > hem - 3 && noise(x, 7) * 5 < y - (hem - 3)) continue;
        const fold = Math.sin(nx * (side ? 6 : 9) + p.flutter * 0.5) * 0.4 * u;
        g.set(x, y, tone(DO.gown, clamp(nx + fold, -1, 1), -0.2, Math.sqrt(Math.max(0, 1 - nx * nx)), x, y, 0.05));
      }
    }
    // lace trim at the hem
    for (let x = 10; x < 54; x++) for (let y = hem - 4; y <= hem + 1; y++) if (g.get(x, y) && !g.get(x, y + 1) && (x + y) % 2 === 0) g.set(x, y, DO.veil[4]);
  });
  // wisps: soft strands below the hem, no outline
  const wispTop = hem - 1;
  for (let s = 0; s < (side ? 9 : 12); s++) {
    const bx = (side ? 22 : 17) + s * (side ? 2.2 : 2.6) + noise(s, 1) * 1.5;
    const len = 5 + noise(s, 2) * 6 + p.trail * 1.5;
    for (let k = 0; k < len; k++) {
      const y = wispTop + k, x = bx + Math.sin(k * 0.6 + p.flutter + s) * (0.6 + k * 0.12) - (side ? p.trail * k * 0.5 : 0);
      if (y > 64) break;
      const t = k / len;
      if (!dith(Math.round(x), y, 1 - t * 0.9)) continue;
      f.set(x, y, DO.wisp[clamp(Math.floor(t * 4), 0, 3)], true);
    }
  }

  // bodice and sash
  part(f, DO.inner, (g) => {
    ell(g, side ? 31.5 : CX, 29.5, side ? 4 : 5, 6.5, DO.gown, { rim: DO.gown[5] });
    for (let x = 22; x <= 42; x++) for (let y = 33; y <= 34; y++) g.over(x, y, tone(DO.sash, (x - CX) / 7, 0, 0.6, x, y));
    if (!back) {
      // lace collar and a black mourning brooch
      for (let x = 27; x <= 37; x++) g.over(x, 23 + (Math.abs(x - CX) > 3 ? 1 : 0), (x % 2) ? DO.veil[5] : DO.veil[4]);
      g.over(side ? 34 : CX, 25, DO.tear); g.over(side ? 34 : CX, 26, DO.iron[2]);
    }
  });

  if (back) drape();

  // arms: sleeve capsule widening to a bell cuff, ragged cuff strands, long pale fingers
  const sleeve = (g, sh, hand, dark) => {
    const r = dark ? DO.gown.slice(0, 4) : DO.gown;
    capsule(g, sh[0], sh[1], hand[0], hand[1] - 1, 1.8, 3.4, r, { rim: dark ? null : DO.gown[5] });
    // ragged bell cuff
    for (let k = -2; k <= 2; k++) for (let j = 0; j < 2 + ((k + 7) % 3); j++) g.set(hand[0] + k, hand[1] + j, dark ? DO.gown[1] : DO.gown[1 + ((j + k) % 2)]);
  };
  const fingers = (g, hand, dx, dy, long) => {
    const y0 = hand[1] + (dy > 0 ? 2 : -1);
    g.set(hand[0], y0, DO.skin[3]); g.set(hand[0] - 1, y0, DO.skin[2]); g.set(hand[0] + 1, y0, DO.skin[1]);
    for (let k = -1; k <= 1; k++) {
      const L = (long ? 5 : 3) + (k === 0 ? 1 : 0);
      for (let j = 1; j <= L; j++) g.set(hand[0] + k * (1 + j * 0.15) + dx * j * 0.4, y0 + j * dy, j === L ? DO.tearD : DO.skin[j < 2 ? 2 : 1]);
    }
  };
  const drawLantern = (g, x, y) => {
    // ring, pointed roof, a frame of corner posts (the glowing panes are effects painted later), base
    g.set(x, y - 7, DO.iron[2]); g.set(x - 1, y - 6, DO.iron[2]); g.set(x + 1, y - 6, DO.iron[1]);
    g.set(x, y - 5, DO.iron[3]);
    for (let k = -1; k <= 1; k++) g.set(x + k, y - 4, DO.iron[k < 0 ? 3 : 2]);
    for (let k = -2; k <= 2; k++) g.set(x + k, y - 3, DO.iron[k < 0 ? 3 : 1]);
    for (let yy = y - 2; yy <= y + 2; yy++) { g.set(x - 2, yy, DO.iron[2]); g.set(x + 2, yy, DO.iron[1]); }
    for (let k = -2; k <= 2; k++) g.set(x + k, y + 3, DO.iron[k < 0 ? 2 : 0]);
    g.set(x, y + 4, DO.iron[1]);
  };
  const lanternPos = p.lantern ? [lanHand[0], lanHand[1] - 6] : [lanHand[0], lanHand[1] + 10];
  const clawFront = p.claw && (dir === "down" ? i >= 1 : side ? i >= 1 : false);
  const lanternFront = !back;

  // far / behind arms first
  if (!clawFront) part(f, DO.inner, (g) => { sleeve(g, shC, clawHand, side); fingers(g, clawHand, p.claw ? (dir === "up" ? -1 : 1) * (p.reach || 0) * 0.5 : 0, 1, !!p.claw); });
  if (!lanternFront) part(f, DO.inner, (g) => { sleeve(g, shL, lanHand, false); fingers(g, lanHand, 0, p.lantern ? -1 : 1, false); drawLantern(g, ...lanternPos); });

  // head: hood with a shadowed opening, pale face from the eyes down, black tears; a shawl over the shoulders
  const hx = side ? 33 : CX, hy = 15;
  part(f, DO.inner, (g) => {
    // shawl: the veil falling over both shoulders
    if (back) return;
    if (side) ell(g, 31, 25, 6, 6.5, DO.veil, { rim: DO.veil[6], bias: -0.05 });
    else { ell(g, CX - 5, 25, 5.5, 5, DO.veil, { rim: DO.veil[6] }); ell(g, CX + 5, 25, 5.5, 5, DO.veil, { bias: -0.05 }); }
    for (let x = 20; x < 46; x++) for (let y = 27; y <= 31; y++) if (g.get(x, y) && !g.get(x, y + 1) && (x % 2)) g.set(x, y + 1, DO.veil[2]);
  });
  part(f, DO.inner, (g) => {
    ell(g, hx + (side ? -1 : 0), hy, side ? 6.5 : 7, 8, DO.veil, { rim: DO.veil[6] });
    if (back) {
      for (let y = hy - 4; y <= hy + 7; y++) g.over(hx + (y % 3 === 0 ? 1 : 0), y, DO.veil[2]);
      return;
    }
    const fx = side ? hx + 2.5 : hx, fw = side ? 3 : 4;
    // shadow inside the hood
    ell(g, fx + (side ? 1 : 0), hy + 2.5, fw + 1.2, 6, [DO.gown[0], DO.gown[0], DO.gown[1]]);
    // the face, lit from the lantern side
    ell(g, fx + (side ? 1.2 : 0), hy + 3.5, fw, 5, DO.skin, { bias: -0.05 });
    for (let x = Math.floor(fx - fw - 1); x <= fx + fw + 2; x++) {   // the hood's lace edge over the brow
      g.over(x, hy - 1, DO.veil[x % 2 ? 4 : 5]);
      if (x % 2 === 0) g.over(x, hy, DO.veil[3]);
    }
    if (side) { g.set(fx + 4, hy + 3, DO.skin[2]); g.set(fx + 4, hy + 4, DO.skin[1]); }   // nose
    // hollow eyes and long black tear streaks
    const eyes = side ? [fx + 2] : [fx - 2, fx + 1];
    eyes.forEach((ex, k) => {
      // sunken socket: shadow above, black eye, a cold pinpoint when the lantern flares
      g.set(ex, hy + 1, DO.skin[0]); g.set(ex + 1, hy + 1, DO.skin[0]);
      g.set(ex, hy + 2, DO.tear); g.set(ex + 1, hy + 2, DO.tear);
      if (p.glow > 2.5) g.set(ex + (k ? 0 : 1), hy + 2, DO.glint);
      // the tear runs from the inner corner, thinning to a grey drip
      const tx = ex + (side ? 0 : k ? 0 : 1), len = 3 + ((k + i) % 2) + (anim === "skill" ? 1 : 0);
      for (let j = 0; j < len; j++) g.set(tx, hy + 3 + j, j < len - 1 ? DO.tear : DO.skin[0]);
    });
    // mouth: a thin dark line, open in a wail
    const mx = side ? fx + 3 : fx;
    g.set(mx, hy + 6, DO.skin[0]); if (!side) g.set(mx - 1, hy + 6, DO.skin[0]);
    if (p.open) { g.set(mx, hy + 6, DO.tear); g.set(mx, hy + 7, DO.tearD); if (!side) { g.set(mx - 1, hy + 6, DO.tear); g.set(mx - 1, hy + 7, DO.tearD); } }
  });
  // crown of thorns
  part(f, null, (g) => {
    const cx = hx + (side ? -1 : 0);
    for (let x = cx - 6; x <= cx + 6; x++) {
      const y = hy - 6 + Math.round(Math.abs(x - cx) * 0.25);
      g.set(x, y, DO.thorn[(x + 1) % 3 === 0 ? 2 : 1]);
      if ((x - cx) % 2 === 0) {
        const h = 2 + ((x * 7) % 3) + (Math.abs(x - cx) < 3 ? 1 : 0);
        for (let k = 1; k <= h; k++) g.set(x + (k === h ? Math.sign(x - cx) : 0), y - k, DO.thorn[k === 1 ? 2 : 3 - Math.min(2, k - 1)]);
      }
    }
  });

  // front arms
  if (clawFront) part(f, DO.inner, (g) => { sleeve(g, shC, clawHand, false); fingers(g, clawHand, (dir === "up" ? -1 : 1) * (p.reach || 0) * 0.6, 1, true); });
  if (lanternFront) part(f, DO.inner, (g) => { sleeve(g, shL, lanHand, false); fingers(g, lanHand, 0, p.lantern ? -1 : 1, false); drawLantern(g, ...lanternPos); });

  // ----- motion: sway the skirt, lean the body, bob -----
  const shift = (y) => {
    const u = clamp((y - 33) / 31, 0, 1);
    return p.sway * u * u * 3 + p.lean * (1 - y / 64) * 2 - (side ? 0 : 0);
  };
  f = warp(f, side ? (y) => p.lean * (1 - y / 64) * 2 + (y > 33 ? -p.trail * ((y - 33) / 31) ** 2 * 1.5 : 0) : shift, 0, p.bob);
  f.outline(DO.outline);
  // bounce light from the lantern on the veil
  const lp = [lanternPos[0] + Math.round(side ? p.lean * (1 - lanternPos[1] / 64) * 2 : shift(lanternPos[1])), lanternPos[1] + p.bob];
  glowLight(f, lp[0], lp[1], 6 + p.glow * 2, DO.cyan[2], 0.3 + p.glow * 0.04);

  // ----- effects -----
  // lantern flame (cold blue) and its halo
  const [lx, ly] = lp;
  if (!back || anim === "skill") {
    const fl = [[0, 0], [0, 1], [-1, 1], [1, 1], [0, 2], [0, -1]];
    fl.forEach(([dx, dy], k) => f.set(lx + dx + (k === 5 ? (i % 2) : 0), ly + dy, DO.cyan[k === 0 ? 0 : k < 4 ? 2 : 1], true));
    f.set(lx - 1, ly + 2, DO.cyan[3], true); f.set(lx + 1, ly + 2, DO.cyan[3], true);
  }
  halo(f, lx + 0.5, ly + 1, 3 + p.glow * 1.6, DO.cyan.slice(1), 0.6 + p.glow * 0.08);

  // trailing streaks while gliding fast
  if (p.streak) {
    const rows = side ? [30, 38, 46, 52] : [];
    rows.forEach((y, k) => { const x0 = 8 + ((i * 3 + k * 5) % 6); for (let x = x0; x < x0 + 5 + k; x++) if (!f.get(x, y) && dith(x, y, 0.75)) f.set(x, y, DO.wisp[1 + (k % 2)], true); });
    if (!side) [[12, 40], [52, 40], [10, 50], [54, 50]].forEach(([x, y], k) => { for (let j = 0; j < 4; j++) if (!f.get(x, y + j + (i % 2))) f.set(x, y + j + (i % 2), DO.wisp[2], true); });
  }
  // claw sweep: a pale arc of veil following the hand
  if (p.arc) {
    const start = dir === "up" ? [54, 18] : side ? [16, 18] : [10, 18];
    const end = [clawHand[0], clawHand[1] + 3 + p.bob];
    const ctrl = [dir === "up" ? 30 : 34, 52];
    for (let s = 0; s <= 40; s++) {
      const t = s / 40 * p.arc + (1 - p.arc) * 0.4;
      if (t > 1) break;
      const u = 1 - t, x = u * u * start[0] + 2 * u * t * ctrl[0] + t * t * end[0], y = u * u * start[1] + 2 * u * t * ctrl[1] + t * t * end[1];
      const w = Math.round(1 + t * 2);
      for (let k = 0; k < w; k++) {
        const px = x, py = y - k;
        if (f.get(px, py) && !f.fx.has(Math.round(py) * 64 + Math.round(px))) continue;
        if (i === 3 && !dith(Math.round(px), Math.round(py), 0.5)) continue;
        f.set(px, py, k === 0 ? DO.wisp[0] : DO.wisp[1 + (k > 1 ? 1 : 0)], true);
      }
    }
    if (i === 2) [[0, 0], [2, -2], [-2, 2], [3, 1]].forEach(([dx, dy]) => f.spark(end[0] + 3 + dx, end[1] + dy, DO.cyan[1]));
  }
  // skill: black tears spiralling in around her, then flung out
  if (anim === "skill") {
    const cx = 32, cy = 36 + p.bob;
    const nT = 6 + i * 2;
    for (let k = 0; k < nT; k++) {
      const a = (k / nT) * TAU + i * 0.7;
      const r = p.burst ? 22 + (k % 3) * 3 : 24 - i * 2.5 + (k % 3) * 2;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.75;
      f.set(x, y, DO.tear, true); f.set(x, y + 1, DO.tear, true); f.set(x, y - 1, DO.tearD, true);
      f.set(x + 1, y, DO.glint, true);
      if (p.burst) { f.set(x - Math.cos(a) * 2, y - Math.sin(a) * 1.5, DO.tearD, true); f.set(x - Math.cos(a) * 3, y - Math.sin(a) * 2.2, DO.tearD, true); }
    }
    // cold aura on the ground and a growing ring
    ringFx(f, 32, 64, 10 + i * 2.5, 2.5 + i * 0.5, [DO.cyan[2], DO.cyan[3], DO.cyan[4]], 1.4, i * 0.4);
    if (p.burst) { ringFx(f, 32, 36, 26, 20, [DO.cyan[1], DO.cyan[2]], 1.6); halo(f, lx + 0.5, ly + 1, 9, DO.cyan, 1.2, true); }
  }
  // idle: a single tear drips from her chin
  if (anim === "idle" && !back) {
    const tx = side ? 37 : 30, ty = 24 + i * 2 + p.bob;
    f.set(tx, ty, DO.tear, true); if (i > 0) f.set(tx, ty - 1, DO.tearD, true);
  }
  return f;
}

// ======================================================================
// MORGRAVE, the Ossuary Warlord (96×104, feet 48,100)
// ======================================================================
const MO = {
  bone: ramp("#4f463c", "#7d7366", "#a89e8d", "#cfc6b4", "#ebe5d6", "#fbf8f0"),
  boneD: ramp("#3a332c", "#5c5348", "#7d7366", "#a89e8d"),
  iron: ramp("#0f1014", "#1e2027", "#323641", "#4b5160", "#6c7383", "#959dac"),
  rust: ramp("#4a2412", "#7a3c1c", "#a65428"),
  cape: ramp("#22060a", "#3e0b12", "#62121c", "#8a1c28", "#b22f3a"),
  horn: ramp("#1c1714", "#3a302a", "#5c4f42", "#85745f", "#b3a083"),
  grip: ramp("#1a0f0a", "#38221a", "#5a3828"),
  glow: ramp("#fff3c4", "#ffd166", "#f97316", "#c2410c", "#7c2d12"),
  outline: H("#09090c"), inner: H("#1a1b21"), socket: H("#050506")
};

function morgravePose(anim, i, n) {
  const ph = (i / n) * TAU;
  const p = { bob: 0, drop: 0, lean: 0, feet: [[0, 0], [0, 0]], sword: "rest", swing: 0, banner: 0, glow: 1, cape: Math.sin(ph) * 0.5, fx: null, sw: 0 };
  if (anim === "idle") { p.bob = [0, 0, 1, 1][i]; p.glow = [1, 1.2, 1, 0.8][i]; p.cape = [0, 0.4, 0.8, 0.4][i]; }
  else if (anim === "walk") {
    // heavy march: each footfall drops the body
    const s = Math.sin(ph);
    p.feet = [[s * 4, Math.max(0, Math.cos(ph)) * 4], [-s * 4, Math.max(0, -Math.cos(ph)) * 4]];
    p.bob = [0, 1, 2, 0, 1, 2][i]; p.sw = s * 0.12; p.cape = s;
  } else if (anim === "run") {
    // lowered-shoulder charge
    const s = Math.sin(ph);
    p.feet = [[s * 7, Math.max(0, Math.cos(ph)) * 6], [-s * 7, Math.max(0, -Math.cos(ph)) * 6]];
    p.bob = [1, 0, 1, 1, 0, 1][i]; p.drop = 5; p.lean = 6; p.sword = "back"; p.cape = 2 + s * 0.5; p.fx = "dust";
  } else if (anim === "attack") {
    // ready (raised overhead) → cleave → impact → recover
    p.sword = "cleave"; p.swing = [0, 1, 2, 3][i];
    p.bob = [-1, 0, 3, 1][i]; p.drop = [0, 1, 4, 1][i]; p.lean = [-2, 2, 4, 1][i];
    p.feet = [[-1, 0], [1, 0]]; p.fx = i === 2 ? "impact" : i === 3 ? "dust" : null; p.glow = [1.5, 1.6, 2, 1.2][i];
  } else {
    // skill: plant the sword (0-1), raise the banner (2-4) as the dead stir, release (5)
    p.sword = "plant"; p.swing = i; p.banner = [0, 0.3, 0.7, 1, 1, 1][i];
    p.bob = [0, 2, 1, 0, 0, 1][i]; p.drop = [0, 2, 0, 0, 0, 1][i]; p.glow = [1.2, 1.5, 2, 2.5, 3, 4][i]; p.fx = "motes";
  }
  return p;
}

/** Bone greatsword: grip in the hand at (x, y), blade along angle a (radians, 0 = right), length len. */
function boneSword(g, x, y, a, len, o = {}) {
  const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
  const sq = o.squash || 1;
  // pommel and grip behind the hand
  ell(g, x - ux * 8, y - uy * 8, 2, 2, MO.bone);
  g.set(x - ux * 8 + vx * 0.6, y - uy * 8 + vy * 0.6, MO.socket);
  for (let k = -6; k <= 2; k++) for (let w = -1; w <= 1; w++) g.set(x + ux * k + vx * w * 0.8, y + uy * k + vy * w * 0.8, MO.grip[(k % 2 === 0) ? 2 : w < 0 ? 1 : 0]);
  // blade: serrated on one edge, a dark fuller down the middle
  const bx = x + ux * 4, by = y + uy * 4, L = len * sq;
  const R = 5;
  for (let py = Math.floor(Math.min(by, by + uy * L) - 8); py <= Math.max(by, by + uy * L) + 8; py++) {
    for (let px = Math.floor(Math.min(bx, bx + ux * L) - 8); px <= Math.max(bx, bx + ux * L) + 8; px++) {
      const dx = px + 0.5 - bx, dy = py + 0.5 - by;
      const u = (dx * ux + dy * uy) / sq, v = dx * vx + dy * vy;
      if (u < 0 || u > len || py > (o.ground ?? 999)) continue;
      const taper = u > len - 9 ? (len - u) / 9 : 1;
      const wl = R * taper, wr = (R - 0.5) * taper;
      if (v < -wl || v > wr) continue;
      if (v > wr - 1.6 && Math.floor(u) % 4 < 2 && taper > 0.4) continue;     // serrations
      const t = (v + wl) / (wl + wr);
      let c = MO.bone[clamp(Math.round(4.6 - t * 3.6 + (BAYER[py & 1][px & 1] / 4 - 0.4)), 0, 5)];
      if (Math.abs(v) < 0.8 && u > 3 && u < len - 10) c = MO.bone[1];
      if (Math.abs(v) < 0.8 && Math.floor(u) % 7 === 0 && u > 3 && u < len - 10) c = MO.boneD[0];   // vertebra joints
      g.set(px, py, c);
    }
  }
  // crossguard: a heavy jawbone across the blade, a small skull at its heart
  for (let k = -7; k <= 7; k++) {
    const cx = x + ux * 3 + vx * k, cy = y + uy * 3 + vy * k;
    g.set(cx, cy, MO.bone[k < 0 ? 4 : 2]); g.set(cx + ux, cy + uy, MO.bone[k < 0 ? 3 : 1]);
    if (Math.abs(k) === 7) { g.set(cx - ux, cy - uy, MO.bone[3]); g.set(cx + ux * 2, cy + uy * 2, MO.bone[2]); }
  }
  ell(g, x + ux * 3.5, y + uy * 3.5, 2.2, 2.2, MO.bone);
  g.set(x + ux * 3.5 - 1, y + uy * 3.5, MO.socket); g.set(x + ux * 3.5 + 1, y + uy * 3.5, MO.socket);
}

/** A small skull (banner trophies, crossguard). */
function skull(g, x, y, r = 2.6, facing = 0) {
  ell(g, x, y, r, r * 0.95, MO.bone, { rim: MO.bone[5] });
  g.set(x - 1 + facing, y, MO.socket); g.set(x + 1 + facing, y, MO.socket);
  g.set(x + facing, y + 1.5, MO.boneD[1]);
  for (let k = -1; k <= 1; k++) g.set(x + k + facing, y + r, k % 2 ? MO.bone[3] : MO.boneD[1]);
}

function paintMorgrave(dir, anim, i) {
  const p = morgravePose(anim, i, FRAMES[anim]);
  let f = new Canvas(96, 104);
  const side = dir === "side", back = dir === "up";
  const G = 99, CX = side ? 44 : 48;
  const ux = (side ? Math.round(p.lean * 0.4) : 0), uy = p.bob + p.drop;       // upper-body offset
  const hipY = 66 + p.bob, shY = 40 + uy, headY = 25 + uy + (side ? 0 : p.drop * 0.4);
  const swordCol = (g, x, y, a, len, o) => boneSword(g, x, y, a, len, { ...o, ground: G });

  // --- where things are ---
  const feet = side
    ? [[CX - 7 + p.feet[0][0], G - p.feet[0][1]], [CX + 8 + p.feet[1][0], G - p.feet[1][1]]]
    : [[CX - 13 + p.feet[0][0] * 0.2, G - p.feet[0][1]], [CX + 13 + p.feet[1][0] * 0.2, G - p.feet[1][1]]];
  const hips = side ? [[CX - 2, hipY], [CX + 2, hipY]] : [[CX - 7, hipY], [CX + 7, hipY]];
  // sword hand (his right: image left in front, image right from behind, near side in profile)
  const sgn = back ? -1 : 1;
  let swordHand, swordAng, swordLen = 46, squash = 1, offHand;
  const shoulders = side ? [[CX + ux - 1, shY + 1], [CX + ux + 3, shY]] : [[CX - 17 * sgn + ux, shY], [CX + 17 * sgn + ux, shY]];
  if (side) {
    const S = {
      rest: [[CX + 12 + ux, 64 + uy], 1.2], back: [[CX - 4 + ux, 60 + uy], 2.7]
    };
    if (p.sword === "cleave") { swordHand = [[CX, 24 + uy], [CX + 10, 30 + uy], [CX + 16 + ux, 58 + uy], [CX + 12 + ux, 56 + uy]][p.swing]; swordAng = [-2.7, -0.95, 0.95, 1.1][p.swing]; swordLen = [40, 42, 46, 46][p.swing]; }
    else if (p.sword === "plant") { swordHand = [[CX + 12, 60 + uy], [CX + 14, 54 + uy], [CX + 14, 54], [CX + 14, 54], [CX + 14, 54], [CX + 14, 54]][p.swing]; swordAng = Math.PI / 2 - 0.05; swordLen = [46, 40, 40, 40, 40, 40][p.swing]; }
    else { [swordHand, swordAng] = S[p.sword]; swordAng += p.sw; }
    offHand = p.banner ? [CX - 9 + ux, 50 - p.banner * 12 + uy] : [CX + 2 + ux + (p.sword === "cleave" ? 6 : 0), 62 + uy];
  } else {
    const hx = CX - 24 * sgn;
    if (p.sword === "cleave") {
      // seen head-on: overhead, then the blade comes down toward the viewer (foreshortened)
      swordHand = [[CX - 4 * sgn, 18 + uy], [CX - 2 * sgn, 30 + uy], [CX - 2 * sgn, 56 + uy], [CX - 8 * sgn, 54 + uy]][p.swing];
      swordAng = [-Math.PI / 2 - 0.15 * sgn, -Math.PI / 2 - 0.1 * sgn, Math.PI / 2 + 0.1 * sgn, Math.PI / 2 + 0.35 * sgn][p.swing];
      swordLen = [14, 26, 38, 40][p.swing]; squash = 1;
      offHand = [swordHand[0] + 5 * sgn, swordHand[1] + 2];
    } else if (p.sword === "plant") {
      swordHand = [[hx, 62 + uy], [CX - 2 * sgn, 54 + uy], [CX - 2 * sgn, 56], [CX - 2 * sgn, 56], [CX - 2 * sgn, 56], [CX - 2 * sgn, 56]][p.swing];
      swordAng = [Math.PI / 2 + 0.15 * sgn, Math.PI / 2, Math.PI / 2, Math.PI / 2, Math.PI / 2, Math.PI / 2][p.swing];
      swordLen = [46, 38, 36, 36, 36, 36][p.swing];
      offHand = p.banner ? [CX + 22 * sgn + ux, 52 - p.banner * 14 + uy] : [CX + 22 * sgn, 64 + uy];
    } else if (p.sword === "back") { swordHand = [hx + 2 * sgn, 62 + uy]; swordAng = Math.PI / 2 + 0.75 * sgn; offHand = [CX + 22 * sgn, 60 + uy]; }
    else { swordHand = [hx, 62 + uy]; swordAng = Math.PI / 2 + 0.12 * sgn + p.sw * sgn; offHand = [CX + 23 * sgn, 64 + uy]; }
  }
  const swordInFront = !back && (side || p.sword === "cleave" ? p.swing >= 1 || p.sword !== "cleave" : true);

  // --- banner pole of skulls on his back (or in his off hand during the skill) ---
  const bannerX = side ? CX - 8 + ux : CX + 13 * sgn + ux;
  const bannerTop = p.banner ? Math.max(2, offHand[1] - 36) : 4 + uy;
  const bannerBot = p.banner ? offHand[1] + 10 : 54 + uy;
  const bx = p.banner ? offHand[0] : bannerX;
  const banner = (g) => {
    capsule(g, bx, bannerTop, bx, bannerBot, 1.2, 1.2, MO.iron, { rim: MO.iron[5] });
    // crossbar and the tattered flag (blows back from the charge)
    const fl = side ? -1 : sgn * (back ? -1 : 1) * -1;
    capsule(g, bx - 7, bannerTop + 3, bx + 7, bannerTop + 3, 1, 1, MO.iron);
    const flutter = p.cape * 0.8;
    for (let y = bannerTop + 4; y < bannerTop + 22; y++) {
      const u = (y - bannerTop - 4) / 18;
      for (let x = bx - 6; x <= bx + 6; x++) {
        const xx = x + Math.sin(u * 3 + flutter) * 1.2 * u + (side ? -u * 3 * (1 + p.lean / 4) : 0);
        if (y > bannerTop + 18 && noise(x, 21) * 5 < y - bannerTop - 18) continue;
        const nx = (x - bx) / 6;
        g.set(xx, y, tone(MO.cape, nx + Math.sin(u * 5 + x * 0.6) * 0.3, -0.2, 0.8, x, y, 0.05));
      }
    }
    // bone sigil: a skull on the banner
    skull(g, bx + (side ? -2 : 0), bannerTop + 11, 2.2);
    // impaled trophy skulls down the pole
    [0, 1, 2].forEach((k) => skull(g, bx, bannerTop + 26 + k * 7, 2.4 - k * 0.2));
    void fl;
  };

  // --- cape ---
  const cape = (g, full) => {
    const top = shY - 2, bot = G - 6 + (full ? 2 : 0);
    for (let y = top; y <= bot; y++) {
      const u = (y - top) / (bot - top);
      const w = side ? 6 + u * 9 : (full ? 16 : 15) + u * 10;
      const cx = (side ? CX - 6 + ux * (1 - u) - u * u * (4 + p.cape * 3) : CX + ux * (1 - u)) + Math.sin(u * 4 + p.cape) * 1.2 * u;
      for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
        const nx = (x + 0.5 - cx) / w;
        if (Math.abs(nx) > 1) continue;
        const rag = noise(Math.floor(x / 2), 33) * 9;
        if (y > bot - 9 + rag * 0.9 - 2) continue;
        const fold = Math.sin(nx * 9 + u * 2 + p.cape * 0.5) * 0.45;
        g.set(x, y, tone(MO.cape, clamp(nx + fold, -1, 1), -0.1, Math.sqrt(Math.max(0, 1 - nx * nx)), x, y, full ? 0.1 : -0.15));
      }
    }
    // a few holes torn through it
    if (full) [[CX - 6, 74], [CX + 9, 84], [CX - 11, 88]].forEach(([x, y]) => { g.set(x, y + uy, null); g.set(x + 1, y + uy, null); g.set(x, y + 1 + uy, null); });
  };

  // --- legs: bone thigh, iron knee, greave, sabaton ---
  const leg = (g, hip, foot, far) => {
    const knee = side ? [(hip[0] + foot[0]) / 2 + 3, (hip[1] + foot[1]) / 2 - 1] : [(hip[0] + foot[0]) / 2 + (foot[0] < CX ? -2 : 2), (hip[1] + foot[1]) / 2];
    const dk = far ? 0.85 : 1;
    capsule(g, hip[0], hip[1], knee[0], knee[1], 2.4, 2, far ? MO.boneD : MO.bone, { rim: far ? null : MO.bone[5] });
    capsule(g, knee[0], knee[1] + 2, foot[0], foot[1] - 4, 3.6, 3, far ? MO.iron.slice(0, 4) : MO.iron, { rim: far ? null : MO.iron[5] });
    ell(g, knee[0], knee[1], 3.8 * dk, 3.2, far ? MO.iron.slice(0, 4) : MO.iron, { rim: far ? null : MO.iron[5] });
    g.set(knee[0], knee[1] - 3, MO.iron[far ? 2 : 4]);
    ell(g, foot[0] + (side ? 2 : 0), foot[1] - 1.5, side ? 5.5 : 4.2, 2.4, far ? MO.iron.slice(0, 4) : MO.iron, { flat: foot[1] + 0.5 });
    // rust on the greave
    for (let k = 0; k < 4; k++) g.over(knee[0] - 1 + (k % 2) * 2, knee[1] + 5 + k * 2, MO.rust[(k + (far ? 0 : 1)) % 3]);
  };

  // --- torso: ribcage under a rusted breastplate, tassets and loincloth ---
  const torso = (g) => {
    const tx = CX + ux;
    if (back) {
      // the back plate and the spine below it (mostly under the cape)
      ell(g, tx, shY + 8, 14, 10, MO.iron, { rim: MO.iron[5] });
      return;
    }
    if (side) {
      ell(g, tx + 1, shY + 13, 7, 10, [MO.socket, MO.iron[0], MO.iron[1]]);
      for (let k = 0; k < 5; k++) for (let x = -5; x <= 6; x++) g.over(tx + 1 + x, shY + 9 + k * 3 + Math.round(Math.abs(x) * 0.25), x % 3 === 0 ? MO.bone[2] : MO.bone[3 + (x < 0 ? 1 : 0)]);
      for (let y = shY + 6; y < hipY - 2; y += 2) ell(g, tx - 5, y, 1.4, 1, MO.bone);
      // breastplate in profile
      g.poly([[tx - 6, shY - 3], [tx + 8, shY - 2], [tx + 9, shY + 9], [tx - 4, shY + 10]], (x, y) => tone(MO.iron, (x - tx) / 9, (y - shY - 3) / 10, 0.7, x, y, 0.1));
    } else {
      // ribcage: a dark hollow, spine, sternum and curved ribs
      ell(g, tx, shY + 14, 10.5, 9, [MO.socket, MO.iron[0], MO.iron[1]]);
      for (let y = shY + 8; y < hipY - 2; y += 2) ell(g, tx, y, 1.6, 1, MO.bone);
      for (let k = 0; k < 5; k++) {
        const y = shY + 9 + k * 3, w = 10 - k * 0.9;
        for (let s of [-1, 1]) for (let x = 1; x <= w; x++) g.set(tx + s * x, y + Math.round((x / w) ** 2 * 3) - (x < 3 ? 1 : 0), MO.bone[s < 0 ? (x > w - 2 ? 2 : 4) : x > w - 2 ? 1 : 3]);
      }
      capsule(g, tx, shY + 5, tx, shY + 15, 1.3, 1, MO.bone);
      // rusted breastplate with a centre ridge
      g.poly([[tx - 13, shY - 3], [tx + 13, shY - 3], [tx + 11, shY + 8], [tx, shY + 11], [tx - 11, shY + 8]],
        (x, y) => tone(MO.iron, (x - tx) / 13 + (x === Math.round(tx) ? -0.6 : 0), (y - shY - 2) / 9, 0.75, x, y, 0.1));
      for (let y = shY - 2; y < shY + 10; y++) g.over(tx, y, MO.iron[4]);
      [[-8, 1], [6, 4], [-4, 6], [9, 0], [-10, 5]].forEach(([dx, dy], k) => { g.over(tx + dx, shY + dy, MO.rust[k % 3]); g.over(tx + dx + 1, shY + dy, MO.rust[(k + 1) % 3]); });
    }
    // pelvis, tassets, loincloth
    ell(g, tx, hipY - 2, side ? 5 : 7, 3.5, MO.bone);
    const plates = side ? [[tx - 5, 6], [tx + 3, 6]] : [[tx - 11, 7], [tx - 4, 7], [tx + 4, 7], [tx + 11, 7]];
    plates.forEach(([x, w], k) => g.poly([[x - w / 2, hipY - 4], [x + w / 2, hipY - 4], [x + w / 2 - 1, hipY + 6], [x - w / 2 + 1, hipY + 6]],
      (px, py) => tone(MO.iron, (px - x) / w * 1.6, (py - hipY) / 8, 0.7, px, py, k % 2 ? -0.05 : 0.05)));
    if (!side) for (let y = hipY - 2; y < hipY + 16; y++) for (let x = tx - 3; x <= tx + 3; x++) {
      if (y > hipY + 11 && noise(x, 41) * 6 < y - hipY - 11) continue;
      g.set(x + Math.round(Math.sin(y * 0.4 + p.cape) * 0.6 * (y - hipY) / 16), y, tone(MO.cape, (x - tx) / 3.5, 0, 0.7, x, y));
    }
  };

  // --- pauldrons, arms ---
  const pauldron = (g, x, y, s, far) => {
    ell(g, x, y, side ? 8 : 9, 7, far ? MO.iron.slice(0, 4) : MO.iron, { rim: far ? null : MO.iron[5] });
    ell(g, x, y + 3.5, side ? 7.5 : 8.5, 2.6, far ? MO.iron.slice(0, 3) : MO.iron.slice(1), {});
    // spikes
    [[-4, -5], [0, -7], [4, -5]].forEach(([dx, dy], k) => {
      const sx = x + dx * (side ? 0.8 : 1) + s * 1, sy = y + dy + 1;
      g.poly([[sx - 1.5, sy + 2], [sx + 1.5, sy + 2], [sx + s * 1.5 * (k - 1) * 0.5, sy - 5 + (k === 1 ? -1 : 0)]], (px, py) => (px < sx ? MO.bone[4] : MO.bone[2]));
    });
    for (let k = -1; k <= 1; k++) g.over(x + k * 4, y + 4, MO.rust[1]);
  };
  const arm = (g, sh, hand, far) => {
    const el = [(sh[0] + hand[0]) / 2 + (side ? -2 : (hand[0] < CX ? -3 : 3)), (sh[1] + hand[1]) / 2 + 1];
    capsule(g, sh[0], sh[1] + 2, el[0], el[1], 2.2, 1.8, far ? MO.boneD : MO.bone, { rim: far ? null : MO.bone[5] });
    capsule(g, el[0], el[1], hand[0], hand[1], 3.4, 3, far ? MO.iron.slice(0, 4) : MO.iron, { rim: far ? null : MO.iron[5] });
    ell(g, hand[0], hand[1], 3.4, 3, far ? MO.iron.slice(0, 4) : MO.iron, { rim: far ? null : MO.iron[5] });
  };

  // --- head: skull under a horned iron helm ---
  const head = (g) => {
    const hx = (side ? CX + 4 : CX) + ux;
    const hy = headY;
    // horns
    const horn = (s, k) => {
      const pts = side
        ? [[hx - 2, hy - 4], [hx - 8, hy - 8], [hx - 10, hy - 15], [hx - 7, hy - 20]]
        : [[hx + s * 7, hy - 3], [hx + s * 13, hy - 6], [hx + s * 16, hy - 13], [hx + s * 14, hy - 19]];
      for (let j = 0; j + 1 < pts.length; j++) capsule(g, ...pts[j], ...pts[j + 1], 2.8 - j * 0.8, 2.2 - j * 0.7, MO.horn, { rim: k ? null : MO.horn[4] });
    };
    if (side) horn(1, 0);
    else { horn(-1, 0); horn(1, 1); }
    if (back) {
      ell(g, hx, hy, 8.5, 8, MO.iron, { rim: MO.iron[5] });
      for (let y = hy - 6; y <= hy + 6; y++) g.over(hx, y, MO.iron[4]);
      for (let x = hx - 7; x <= hx + 7; x++) g.over(x, hy + 3, MO.iron[1]);
      return;
    }
    if (side) {
      // skull profile: cranium, cheekbone, long jaw, teeth
      ell(g, hx + 2, hy + 3, 6, 6.5, MO.bone, { rim: MO.bone[5] });
      ell(g, hx + 5, hy + 7.5, 3.5, 2.6, MO.bone);
      for (let x = hx + 3; x <= hx + 8; x++) { g.set(x, hy + 7, x % 2 ? MO.bone[5] : MO.boneD[0]); }
      g.set(hx + 7, hy + 4, MO.socket); g.set(hx + 7, hy + 5, MO.boneD[1]);
      ell(g, hx + 5, hy + 1.5, 1.8, 1.8, [MO.socket]);
      ell(g, hx + 0.5, hy - 2.5, 8, 6, MO.iron, { rim: MO.iron[5], flat: hy + 0.5 });
      for (let x = hx - 7; x <= hx + 9; x++) g.over(x, hy, MO.iron[x % 3 ? 3 : 1]);
      return;
    }
    // skull
    ell(g, hx, hy + 3, 7, 7.5, MO.bone, { rim: MO.bone[5] });
    ell(g, hx, hy + 9, 4.8, 2.4, MO.bone);
    // sockets, nose, teeth
    ell(g, hx - 3, hy + 2.5, 2.2, 2.2, [MO.socket]); ell(g, hx + 3, hy + 2.5, 2.2, 2.2, [MO.socket]);
    g.set(hx, hy + 5, MO.socket); g.set(hx - 1, hy + 6, MO.socket); g.set(hx, hy + 6, MO.socket);
    for (let x = hx - 3; x <= hx + 3; x++) { g.set(x, hy + 8, x % 2 ? MO.bone[5] : MO.boneD[0]); g.set(x, hy + 10, x % 2 ? MO.boneD[0] : MO.bone[3]); }
    for (let x = hx - 4; x <= hx + 4; x++) g.over(x, hy + 9, MO.socket);
    // the horned helm with a brow guard and a nasal bar
    ell(g, hx, hy - 2.5, 8.6, 6.5, MO.iron, { rim: MO.iron[5], flat: hy + 0.5 });
    for (let x = hx - 8; x <= hx + 8; x++) { g.over(x, hy, MO.iron[x % 3 ? 3 : 1]); g.over(x, hy - 1, MO.iron[4]); }
    for (let y = hy - 1; y <= hy + 3; y++) g.set(hx, y, MO.iron[y === hy + 3 ? 1 : 3]);
    g.over(hx - 5, hy - 4, MO.rust[2]); g.over(hx + 4, hy - 5, MO.rust[1]);
  };

  // ===== paint, back to front =====
  if (!back) { part(f, MO.inner, (g) => { if (!p.banner) banner(g); }); part(f, MO.inner, (g) => cape(g, false)); }
  if (side) part(f, MO.inner, (g) => { leg(g, hips[0], feet[0], true); });
  if (side && !swordInFront) part(f, MO.inner, (g) => swordCol(g, swordHand[0], swordHand[1], swordAng, swordLen, { squash }));
  if (side) part(f, MO.inner, (g) => { arm(g, shoulders[0], offHand, true); });
  if (!side) part(f, MO.inner, (g) => { leg(g, hips[0], feet[0], false); leg(g, hips[1], feet[1], false); });
  if (back && p.sword !== "cleave") part(f, MO.inner, (g) => swordCol(g, swordHand[0], swordHand[1], swordAng, swordLen, { squash }));
  part(f, MO.inner, torso);
  if (side) part(f, MO.inner, (g) => leg(g, hips[1], feet[1], false));
  if (back) {
    part(f, MO.inner, (g) => cape(g, true));
    part(f, MO.inner, (g) => { arm(g, shoulders[0], swordHand, false); arm(g, shoulders[1], offHand, false); });
    part(f, MO.inner, (g) => { pauldron(g, shoulders[0][0], shoulders[0][1] - 2, -1, false); pauldron(g, shoulders[1][0], shoulders[1][1] - 2, 1, false); });
    part(f, MO.inner, head);
    part(f, MO.inner, banner);
    if (p.sword === "cleave") part(f, MO.inner, (g) => swordCol(g, swordHand[0], swordHand[1], swordAng, swordLen, { squash }));
  } else if (side) {
    part(f, MO.inner, head);
    part(f, MO.inner, (g) => pauldron(g, shoulders[1][0], shoulders[1][1] - 2, 1, false));
    if (p.banner) part(f, MO.inner, banner);
    if (swordInFront) part(f, MO.inner, (g) => swordCol(g, swordHand[0], swordHand[1], swordAng, swordLen, { squash }));
    part(f, MO.inner, (g) => arm(g, shoulders[1], swordHand, false));
  } else {
    part(f, MO.inner, head);
    const cleaveHigh = p.sword === "cleave" && p.swing === 0;
    if (cleaveHigh) part(f, MO.inner, (g) => swordCol(g, swordHand[0], swordHand[1], swordAng, swordLen, { squash }));
    part(f, MO.inner, (g) => { arm(g, shoulders[0], swordHand, false); arm(g, shoulders[1], offHand, false); });
    part(f, MO.inner, (g) => { pauldron(g, shoulders[0][0], shoulders[0][1] - 2, -1, false); pauldron(g, shoulders[1][0], shoulders[1][1] - 2, 1, false); });
    if (p.banner) part(f, MO.inner, banner);
    if (!cleaveHigh) part(f, MO.inner, (g) => swordCol(g, swordHand[0], swordHand[1], swordAng, swordLen, { squash }));
    // gauntlets over the grip
    part(f, MO.inner, (g) => ell(g, swordHand[0], swordHand[1], 3.4, 3, MO.iron, { rim: MO.iron[5] }));
  }
  // lean the upper body into a charge / swing (profile only): rows above the hips shear forward
  if (side && p.lean) f = warp(f, (y) => (y < hipY - 2 ? (hipY - 2 - y) * p.lean * 0.035 : 0));
  f.outline(MO.outline);

  // ===== effects =====
  // eye-lights
  if (!back) {
    const hx = (side ? CX + 4 : CX) + ux, hy = headY;
    const eyes = side ? [[hx + 5, hy + 1.5]] : [[hx - 3, hy + 2.5], [hx + 3, hy + 2.5]];
    eyes.forEach(([x, y]) => {
      f.set(x, y, MO.glow[0], true); f.set(x + 0.6, y, MO.glow[1], true);
      if (p.glow > 1.1) { f.set(x - 1, y, MO.glow[2], true); f.set(x, y + 1, MO.glow[3], true); }
      if (p.glow > 1.8) halo(f, x + 0.5, y + 0.5, 2 + p.glow, MO.glow.slice(1), 0.5);
      if (anim === "run" || p.glow > 2) for (let k = 1; k < 5; k++) if (!f.get(x - k * (side ? 1 : 0.4) - 1, y - k * 0.3)) f.set(x - k * (side ? 1 : 0.4) - 1, y - k * 0.3, MO.glow[2 + (k > 2 ? 1 : 0)], true);
    });
  }
  const tipX = swordHand[0] + Math.cos(swordAng) * (swordLen + 4), tipY = swordHand[1] + Math.sin(swordAng) * (swordLen + 4);
  if (p.fx === "impact") {
    // cracks of orange light and a dust ring where the blade bites the ground
    const gx = side ? Math.min(90, tipX) : swordHand[0], gy = G;
    ringFx(f, gx, gy, 14, 4, [MO.glow[2], MO.glow[3], MO.bone[3]], 1.3);
    for (let k = 0; k < 7; k++) { const a = Math.PI + (k / 6) * Math.PI; f.set(gx + Math.cos(a) * 9, gy - 3 + Math.sin(a) * 6, MO.bone[3 + (k % 2)], true); f.set(gx + Math.cos(a) * 12, gy - 6 + Math.sin(a) * 8, MO.bone[2], true); }
    for (let k = -6; k <= 6; k++) if (!f.get(gx + k, gy)) f.set(gx + k, gy, MO.glow[(Math.abs(k) % 3) + 1], true);
  }
  if (p.fx === "dust") {
    const xs = side ? [feet[0][0] - 6, feet[0][0] - 10, feet[1][0] - 8] : [feet[0][0] - 6, feet[1][0] + 6, feet[0][0] - 9, feet[1][0] + 9];
    xs.forEach((x, k) => { const y = G - 1 - (k % 2) * 2 - (i % 2); halo(f, x, y, 2.2, [MO.bone[3], MO.bone[2], MO.bone[1]], 0.9); });
  }
  if (p.fx === "motes") {
    // ground aura and bone motes rising around him
    const r = 16 + i * 3;
    ringFx(f, CX, G, r, r * 0.28, [MO.glow[2], MO.glow[3], MO.glow[4]], 1.3, i * 0.3);
    const n = 6 + i * 3;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + i * 0.5, rr = (p.banner ? 20 : 14) + (k % 4) * 4 + (i === 5 ? 10 : 0);
      const x = CX + Math.cos(a) * rr, y = G - 8 - ((k * 11 + i * 9) % 60) * (0.5 + p.banner * 0.5);
      if (f.get(x, y) && !f.fx.has(Math.round(y) * 96 + Math.round(x))) continue;
      f.set(x, y, MO.bone[4 + (k % 2)], true);
      if (k % 3 === 0) { f.set(x + 1, y, MO.bone[3], true); f.set(x, y + 1, MO.glow[2], true); }
    }
    if (p.banner) halo(f, bx, bannerTop + 10, 6 + p.glow * 2, MO.glow.slice(1), 0.35 + p.glow * 0.08);
    if (i === 5) { ringFx(f, CX, G, 40, 11, [MO.glow[1], MO.glow[2]], 1.5); ringFx(f, CX, 50, 34, 30, [MO.bone[4], MO.glow[2], MO.bone[3]], 3.2, 0.2); }
    if (i >= 1) for (let k = -3; k <= 3; k++) if (!f.get(tipX + k, G)) f.set(tipX + k, G, MO.glow[1 + (Math.abs(k) % 3)], true);
  }
  void tipY;
  return f;
}
// ======================================================================
// VORGATH, the Chained Warden (112×112, feet 56,108)
// ======================================================================
const VO = {
  hide: ramp("#111114", "#1e1e23", "#2e2e35", "#42424b", "#585862", "#72727e", "#9090a0"),
  hideD: ramp("#09090b", "#121215", "#1d1d22", "#2a2a31"),
  horn: ramp("#151110", "#2e2621", "#4d4239", "#72665a", "#a2937f"),
  iron: ramp("#0d0e12", "#1b1d24", "#2d313b", "#454a57", "#636a7a", "#8a91a1"),
  chain: { dark: H("#3a3f4b"), mid: H("#7a8292"), light: H("#b8bfcc"), hi: H("#e4e8ef") },
  glow: ramp("#fff1c1", "#ffb35c", "#ff5a2a", "#d4232f", "#7a0f19"),
  eye: ramp("#ffe4e6", "#fb7185", "#f43f5e", "#9f1239"),
  claw: ramp("#0b0b0d", "#2a2522", "#58504a"),
  outline: H("#050506"), inner: H("#111115")
};

function vorgathPose(anim, i, n) {
  const ph = (i / n) * TAU, s = Math.sin(ph), c = Math.cos(ph);
  const p = { bob: 0, drop: 0, sway: 0, lean: 0, feet: [0, 0], stride: [0, 0], fists: null, swing: Math.sin(ph) * 0.25, heat: 1, fx: null, open: 0 };
  if (anim === "idle") { p.bob = [0, 1, 2, 1][i]; p.swing = [0.15, 0.05, -0.15, -0.05][i]; p.heat = [1, 1.2, 1.4, 1.2][i]; }
  else if (anim === "walk") {
    p.feet = [Math.max(0, c) * 4, Math.max(0, -c) * 4]; p.stride = [s * 5, -s * 5];
    p.bob = [0, 2, 3, 0, 2, 3][i]; p.sway = s * 2; p.swing = -s * 0.35;
    p.fists = { l: [s * 3, -Math.max(0, -c) * 3], r: [-s * 3, -Math.max(0, c) * 3] };
  } else if (anim === "run") {
    // gallop on the fists: fists plant ahead (0-1), legs bound after them (3-4)
    p.drop = 7; p.lean = 8; p.bob = [2, 0, -2, -3, -1, 1][i];
    const reach = [6, 3, -2, -5, -2, 3][i], lift = [0, 0, 3, 5, 3, 1][i];
    p.fists = { l: [reach, -lift], r: [reach + 1, -lift], fwd: [2, 1, 0, -1, 0, 1][i] };
    p.feet = [[0, 2, 4, 1, 0, 0][i], [0, 1, 3, 2, 0, 0][i]]; p.stride = [[-6, -4, 0, 4, 6, 0][i], [-5, -3, 1, 5, 6, 0][i]];
    p.swing = [0.6, 0.8, 0.9, 0.7, 0.5, 0.5][i]; p.fx = i === 0 || i === 1 ? "dust" : null; p.heat = 1.5;
  } else if (anim === "attack") {
    // ready (both fists overhead) → down → slam → recover
    p.fists = { up: [1, 0.55, 0, 0.15][i], slam: true };
    p.bob = [-2, 0, 6, 3][i]; p.drop = [0, 2, 8, 4][i]; p.lean = [-2, 3, 8, 4][i];
    p.swing = [-0.5, 0.2, 0.9, 0.5][i]; p.fx = i === 2 ? "slam" : i === 3 ? "dust" : null; p.heat = [1.6, 1.8, 2.4, 1.5][i]; p.open = i >= 1 ? 1 : 0;
  } else {
    // skill: one arm swings its broken chain round overhead in a widening arc (0-4), release (5)
    p.fists = { whirl: true };
    p.arc = [0, 1.3, 2.6, 3.9, 5.2, 6.4][i];
    p.bob = [0, -1, -1, -2, -2, 2][i]; p.heat = [1.4, 1.8, 2.2, 2.6, 3, 4][i]; p.fx = "aura"; p.open = 1;
  }
  return p;
}

function paintVorgath(dir, anim, i) {
  const p = vorgathPose(anim, i, FRAMES[anim]);
  let f = new Canvas(112, 112);
  const side = dir === "side", back = dir === "up";
  const G = 107, CX = side ? 50 : 56;
  const uy = p.bob + p.drop, ux = side ? Math.round(p.lean * 0.6) : Math.round(p.sway);
  const heat = p.heat;
  const sgn = back ? -1 : 1;
  const crackPaths = [];   // [points] in canvas space, painted over the hide after the body

  // ---------- positions ----------
  const hipY = 82 + Math.round(p.bob * 0.5);
  const hips = side ? [[CX - 8, hipY], [CX + 2, hipY + 1]] : [[CX - 13, hipY], [CX + 13, hipY]];
  const st = p.stride;
  const feet = side
    ? [[CX - 10 + st[0], G - p.feet[0]], [CX + 4 + st[1], G - p.feet[1]]]
    : [[CX - 16, G - p.feet[0]], [CX + 16, G - p.feet[1]]];
  const shY = 46 + uy;
  const shoulders = side ? [[CX + 4 + ux, shY - 2], [CX + 9 + ux, shY + 3]] : [[CX - 27 * sgn + ux, shY], [CX + 27 * sgn + ux, shY]];
  // fists
  let fists;
  if (side) {
    const F = p.fists || {};
    if (F.slam) fists = [[CX + 14 + ux + (1 - F.up) * 14, 102 - F.up * 86 + uy * (1 - F.up) - (F.up ? 0 : uy) + (F.up ? 0 : 0)], null];
    else if (F.whirl) fists = [[CX + 10 + ux, 14 + uy], null];
    else fists = [[CX + 22 + ux + (F.l ? F.l[0] : 0) + (F.fwd || 0) * 2, G - 6 + (F.l ? F.l[1] : 0)], null];
    fists[1] = F.whirl ? [CX + 18 + ux, G - 8] : F.slam ? [fists[0][0] - 6, fists[0][1] + 1] : [CX + 14 + ux + (F.r ? F.r[0] : 0), G - 7 + (F.r ? F.r[1] : 0)];
    if (F.slam && F.up === 0) { fists[0] = [CX + 32 + ux, G - 6]; fists[1] = [CX + 26 + ux, G - 7]; }
  } else {
    const F = p.fists || {};
    if (F.slam) {
      const y = 16 + (1 - F.up) * 78, x = 18 + (1 - F.up) * 6;
      fists = [[CX - x * sgn + ux, y], [CX + x * sgn + ux, y]];
      if (F.up === 0) fists = [[CX - 12 * sgn, G - 6], [CX + 12 * sgn, G - 6]];
    } else if (F.whirl) fists = [[CX - 34 * sgn + ux, G - 8], [CX + 26 * sgn + ux, 14 + uy]];
    else fists = [[CX - 34 * sgn + ux + (F.l ? F.l[0] * 0.3 : 0), G - 6 + (F.l ? F.l[1] : 0) + (F.fwd || 0)], [CX + 34 * sgn + ux + (F.r ? -F.r[0] * 0.3 : 0), G - 6 + (F.r ? F.r[1] : 0) + (F.fwd || 0)]];
  }
  const fistR = (fp) => 8.5 + (!side && !back && fp[1] > 90 && p.fists?.fwd ? p.fists.fwd * 0.3 : 0);

  // ---------- body parts ----------
  const leg = (g, hip, foot, far) => {
    const r = far ? VO.hideD : VO.hide;
    const knee = side ? [(hip[0] + foot[0]) / 2 + 5, (hip[1] + foot[1]) / 2 - 2] : [(hip[0] + foot[0]) / 2 + (foot[0] < CX ? -3 : 3), (hip[1] + foot[1]) / 2 - 1];
    capsule(g, hip[0], hip[1], knee[0], knee[1], 8, 6.5, r, { rim: far ? null : VO.hide[6] });
    capsule(g, knee[0], knee[1], foot[0], foot[1] - 3, 6, 5, r, { rim: far ? null : VO.hide[5] });
    ell(g, foot[0] + (side ? 3 : 0), foot[1] - 2, side ? 8 : 7, 3.4, r, { flat: foot[1] + 0.5 });
    for (let k = -1; k <= 1; k++) { const x = side ? foot[0] + 9 : foot[0] + k * 3; g.set(x, foot[1], VO.claw[2]); g.set(x + (side ? 1 : 0), foot[1], VO.claw[1]); }
    if (!far) crackPaths.push([[hip[0] + 2, hip[1] + 2], [knee[0] - 1, knee[1] - 2], [knee[0] + 1, knee[1] + 4]]);
  };
  const arm = (g, sh, fist, far, k) => {
    const r = far ? VO.hideD : VO.hide;
    const out = side ? 1 : fist[0] < CX ? -1 : 1;
    const raised = fist[1] < sh[1];
    const el = raised ? [(sh[0] + fist[0]) / 2 + out * 8, (sh[1] + fist[1]) / 2 + 4] : [(sh[0] + fist[0]) / 2 + out * (side ? -2 : 5), (sh[1] + fist[1]) / 2 - 2];
    capsule(g, sh[0], sh[1], el[0], el[1], 10, 8, r, { rim: far ? null : VO.hide[6] });
    capsule(g, el[0], el[1], fist[0], fist[1], 8, 9.5, r, { rim: far ? null : VO.hide[5] });
    ell(g, fist[0], fist[1], fistR(fist), 7.5, r, { rim: far ? null : VO.hide[6] });
    // knuckles
    for (let j = -2; j <= 2; j++) g.over(fist[0] + j * 3, fist[1] + (raised ? -5 : 4), far ? VO.hideD[3] : VO.hide[5]);
    // manacle at the wrist
    const wx = fist[0] + (el[0] - fist[0]) * 0.32, wy = fist[1] + (el[1] - fist[1]) * 0.32;
    const ang = Math.atan2(fist[1] - el[1], fist[0] - el[0]);
    for (let a = -1; a <= 1; a += 0.5) for (let w = -10; w <= 10; w++) {
      const x = wx + Math.cos(ang + Math.PI / 2) * w + Math.cos(ang) * a * 3, y = wy + Math.sin(ang + Math.PI / 2) * w + Math.sin(ang) * a * 3;
      if (Math.abs(w) > 9.5) continue;
      g.set(x, y, VO.iron[clamp(Math.round(3.5 - w * 0.18 - a * 0.8 + (BAYER[Math.round(y) & 1][Math.round(x) & 1] / 4 - 0.4)), 0, 5)]);
    }
    for (let w = -7; w <= 7; w += 7) g.set(wx + Math.cos(ang + Math.PI / 2) * w, wy + Math.sin(ang + Math.PI / 2) * w, VO.iron[5]);
    if (!far) crackPaths.push([[sh[0] + out * 3, sh[1] + 2], [(sh[0] + el[0]) / 2, (sh[1] + el[1]) / 2 + 1], [el[0] + out, el[1] - 1]]);
    return [wx, wy];
  };
  const torso = (g) => {
    const tx = CX + ux;
    if (side) {
      ell(g, tx - 8, 40 + uy, 20, 16, VO.hide, { rim: VO.hide[6] });       // hump
      ell(g, tx + 2, 62 + uy, 20, 19, VO.hide, { rim: VO.hide[6] });       // chest / gut
      ell(g, tx - 2, 76 + Math.round(uy * 0.6), 15, 11, VO.hide, {});
      // spine ridges over the hump
      for (let k = 0; k < 6; k++) { const x = tx - 22 + k * 5, y = 32 + uy + Math.abs(k - 2.2) * 2.6; g.poly([[x - 2, y + 2], [x + 2, y + 2], [x - 1, y - 3]], VO.horn[2 + (k % 2)]); }
      crackPaths.push([[tx - 16, 36 + uy], [tx - 8, 44 + uy], [tx - 10, 54 + uy], [tx - 2, 62 + uy]], [[tx + 8, 56 + uy], [tx + 4, 66 + uy], [tx + 10, 74 + uy]]);
      return;
    }
    if (back) ell(g, tx, 38 + uy, 26, 14, VO.hide, { rim: VO.hide[6] });     // hump
    ell(g, tx, 62 + uy, 26, 18, VO.hide, { rim: VO.hide[6] });
    ell(g, tx, 78 + Math.round(uy * 0.6), 19, 11, VO.hide, {});
    if (back) {
      // spine ridge plates and shoulder blades
      for (let k = 0; k < 8; k++) { const y = 28 + uy + k * 6.5; g.poly([[tx - 3, y + 3], [tx + 3, y + 3], [tx, y - 3]], VO.horn[2 + (k % 2)]); g.set(tx, y - 2, VO.horn[4]); }
      ell(g, tx - 12, 50 + uy, 8, 6, VO.hide.slice(1), {}); ell(g, tx + 12, 50 + uy, 8, 6, VO.hide.slice(1), {});
      crackPaths.push([[tx - 6, 34 + uy], [tx - 14, 46 + uy], [tx - 10, 62 + uy], [tx - 18, 72 + uy]], [[tx + 7, 40 + uy], [tx + 16, 54 + uy], [tx + 10, 70 + uy]], [[tx - 20, 30 + uy], [tx - 24, 40 + uy]]);
      return;
    }
    // pecs and gut plates
    for (let x = tx - 18; x <= tx + 18; x++) g.over(x, 66 + uy + Math.round(Math.abs(x - tx) * 0.2), VO.hide[1]);
    for (let y = 54 + uy; y < 88; y++) g.over(tx, y, VO.hide[1]);
    for (let k = 0; k < 3; k++) for (let x = tx - 9; x <= tx + 9; x++) if (x !== tx) g.over(x, 72 + uy + k * 5, VO.hide[2]);
    crackPaths.push([[tx - 4, 56 + uy], [tx - 12, 62 + uy], [tx - 10, 70 + uy], [tx - 16, 78 + uy]], [[tx + 6, 58 + uy], [tx + 14, 64 + uy], [tx + 12, 74 + uy]], [[tx + 2, 76 + uy], [tx + 5, 84 + uy]]);
  };
  const shoulder = (g, sh, far) => {
    ell(g, sh[0], sh[1] - 2, side ? 12 : 13, 11, far ? VO.hideD : VO.hide, { rim: far ? null : VO.hide[6] });
    // a pauldron-like spur of horn
    const o = side ? 0 : sh[0] < CX ? -1 : 1;
    g.poly([[sh[0] - 3, sh[1] - 9], [sh[0] + 3, sh[1] - 10], [sh[0] + o * 5, sh[1] - 18]], (x, y) => VO.horn[x < sh[0] ? 3 : 2]);
    if (!far) crackPaths.push([[sh[0] - 6, sh[1] - 6], [sh[0], sh[1] - 1], [sh[0] + 4, sh[1] + 5]]);
  };
  const head = (g) => {
    const hx = (side ? CX + 29 : CX) + ux, hy = (side ? 52 : 46) + uy;
    const horn = (s, k) => {
      const pts = side
        ? [[hx - 4, hy - 6], [hx - 10, hy - 14], [hx - 6, hy - 24], [hx + 2, hy - 28]]
        : [[hx + s * 8, hy - 5], [hx + s * 19, hy - 9], [hx + s * 26, hy - 20], [hx + s * 23, hy - 33]];
      for (let j = 0; j + 1 < pts.length; j++) capsule(g, ...pts[j], ...pts[j + 1], 4.8 - j * 1.3, 3.6 - j * 1.2, VO.horn, { rim: k ? null : VO.horn[4] });
      // ridges round the horn
      for (let j = 1; j < 3; j++) g.over(pts[j][0], pts[j][1], VO.horn[0]);
    };
    if (back) { horn(-1, 0); horn(1, 1); ell(g, hx, hy - 4, 9, 6, VO.hideD.concat([VO.hide[3]]), {}); return; }
    if (side) horn(1, 0); else { horn(-1, 0); horn(1, 1); }
    if (side) {
      ell(g, hx, hy, 10.5, 10, VO.hide, { rim: VO.hide[6], bias: 0.1 });
      ell(g, hx + 8, hy + 4, 6, 4.5, VO.hide, { bias: 0.1 });                    // muzzle
      for (let x = hx - 2; x <= hx + 9; x++) g.over(x, hy - 3, VO.hide[1]);       // brow
      // jaw and fangs
      for (let x = hx + 2; x <= hx + 11; x++) g.over(x, hy + 6 + p.open, VO.hideD[0]);
      g.set(hx + 10, hy + 5, VO.horn[4]); g.set(hx + 10, hy + 4, VO.horn[3]); g.set(hx + 7, hy + 8 + p.open, VO.horn[4]);
      return;
    }
    ell(g, hx, hy, 12, 10.5, VO.hide, { rim: VO.hide[6], bias: 0.1 });
    ell(g, hx, hy + 5.5, 9, 5, VO.hide.slice(1), { bias: 0.1 });                  // jaw
    for (let x = hx - 9; x <= hx + 9; x++) g.over(x, hy - 3 + Math.round(Math.abs(x - hx) * 0.15), VO.hide[1]);   // heavy brow
    for (let x = hx - 9; x <= hx + 9; x++) g.over(x, hy - 4 + Math.round(Math.abs(x - hx) * 0.15), VO.hide[5]);
    // mouth, fangs (tusks jutting up from the jaw)
    for (let x = hx - 5; x <= hx + 5; x++) { g.over(x, hy + 5, VO.hideD[0]); if (p.open) g.over(x, hy + 6, VO.glow[4]); }
    [[-4, 1], [4, 1], [-2, 0], [2, 0]].forEach(([dx, big]) => { g.set(hx + dx, hy + 4, VO.horn[4]); if (big) { g.set(hx + dx, hy + 3, VO.horn[4]); g.set(hx + dx, hy + 2, VO.horn[3]); } });
    g.set(hx - 1, hy + 1, VO.hideD[0]); g.set(hx + 1, hy + 1, VO.hideD[0]);     // nostrils
  };
  const collar = (g) => {
    const hx = (side ? CX + 21 : CX) + ux, y = (side ? 56 : 55) + uy;
    if (side) {
      for (let a = 0; a < TAU; a += 0.05) { const x = hx + Math.cos(a) * 5, yy = y + Math.sin(a) * 11; for (let t = 0; t < 3; t++) g.set(x + t - 1, yy, VO.iron[clamp(Math.round(3 - Math.sin(a) * 1.5 + (t === 0 ? 1 : 0)), 0, 5)]); }
      return;
    }
    // a thick riveted ring, the lock at the front
    for (let x = hx - 16; x <= hx + 16; x++) for (let k = 0; k < 5; k++) {
      const u = (x - hx) / 16, yy = y + Math.round(Math.sqrt(Math.max(0, 1 - u * u)) * 3) + k - 2;
      g.set(x, yy, VO.iron[clamp(Math.round(4 - k * 0.7 - u * 1.2 + (BAYER[yy & 1][x & 1] / 4 - 0.4)), 0, 5)]);
    }
    for (let x = hx - 12; x <= hx + 12; x += 6) g.set(x, y + 2 + (Math.abs(x - hx) < 7 ? 1 : 0), VO.iron[5]);
    if (!back) { ell(g, hx, y + 5, 3.4, 3, VO.iron, { rim: VO.iron[5] }); g.set(hx, y + 5, VO.iron[0]); g.set(hx, y + 6, VO.iron[0]); }
  };

  // ---------- paint, back to front ----------
  const chains = [];   // [startX, startY, len, swing, far]
  if (side) {
    part(f, VO.inner, (g) => leg(g, hips[0], feet[0], true));
    part(f, VO.inner, (g) => { const w = arm(g, [shoulders[0][0] - 2, shoulders[0][1]], fists[1], true); chains.push([...w, 24, p.swing, true]); });
    part(f, VO.inner, torso);
    part(f, VO.inner, (g) => leg(g, hips[1], feet[1], false));
    part(f, VO.inner, collar);
    part(f, VO.inner, (g) => shoulder(g, shoulders[1], false));
    part(f, VO.inner, head);
    part(f, VO.inner, (g) => { const w = arm(g, shoulders[1], fists[0], false); chains.push([...w, 30, p.swing + 0.2, false]); });
  } else {
    if (!back) part(f, VO.inner, (g) => { ell(g, CX + ux, 40 + uy, 24, 12, VO.hideD.concat([VO.hide[3]]), { rim: VO.hide[5] }); });
    part(f, VO.inner, (g) => { leg(g, hips[0], feet[0], false); leg(g, hips[1], feet[1], false); });
    if (back) part(f, VO.inner, head);
    part(f, VO.inner, torso);
    part(f, VO.inner, collar);
    part(f, VO.inner, (g) => { shoulder(g, shoulders[0], false); shoulder(g, shoulders[1], false); });
    if (!back) part(f, VO.inner, head);
    [0, 1].forEach((k) => part(f, VO.inner, (g) => { const w = arm(g, shoulders[k], fists[k], false, k); chains.push([...w, 28 + k * 4, p.swing * (k ? -1 : 1), false]); }));
  }
  // molten cracks over the hide
  const crack = (pts) => {
    for (let s = 0; s + 1 < pts.length; s++) {
      const [ax, ay] = pts[s], [bx, by] = pts[s + 1], n = Math.ceil(Math.hypot(bx - ax, by - ay));
      for (let k = 0; k <= n; k++) {
        const x = ax + (bx - ax) * k / n + Math.sin(k * 1.7 + s) * 0.8, y = ay + (by - ay) * k / n;
        if (!f.get(x, y)) continue;
        const hot = (k + s * 3 + i) % 5;
        f.set(x, y, hot === 0 && heat > 1.2 ? VO.glow[heat > 2 ? 0 : 1] : hot < 3 ? VO.glow[2] : VO.glow[3]);
        if (k % 3 === 0 && f.get(x + 1, y)) f.set(x + 1, y, VO.glow[4]);
      }
    }
  };
  crackPaths.forEach(crack);
  // chains hanging from the manacles (and the collar's broken length)
  const chainParts = [];
  part(f, VO.inner, (g) => {
    if (p.fists?.whirl) {
      // the near/raised arm whirls its chain in a wide arc overhead
      const [wx, wy] = chains[1];
      const cx = side ? CX + 8 : CX, cy = 20 + p.bob, rx = side ? 40 : 46 + (i === 5 ? 6 : 0), ry = 12;
      const a0 = p.arc, len = i === 5 ? 3.2 : 1.6 + i * 0.25;
      const pts = [[wx, wy]];
      for (let k = 0; k <= 12; k++) { const a = a0 - (k / 12) * len; pts.push([cx + Math.cos(a) * rx * Math.min(1, 0.4 + k / 8), cy + Math.sin(a) * ry * Math.min(1, 0.4 + k / 8)]); }
      chainParts.push(pts);
      chain(g, pts, VO.chain, { step: 3 });
      // the other wrist's chain hangs
      const o = chains[0];
      chain(g, hang(o[0], o[1], 14, o[3] * 0.5, 0.6), VO.chain);
      return;
    }
    chains.forEach(([x, y, len, sw, far]) => {
      const pts = hang(x, y + 2, len, sw, sw * -0.8);
      // links pile on the ground instead of passing through it
      const clipped = pts.map(([px, py]) => [px + (py > G - 1 ? (py - G + 1) * Math.sign(sw || 1) : 0), Math.min(py, G - 1)]);
      chain(g, clipped, far ? { dark: VO.iron[0], mid: VO.iron[1], light: VO.iron[2], hi: VO.iron[3] } : VO.chain);
    });
    if (!back) {   // the collar's broken chain
      const hx = (side ? CX + 21 : CX) + ux, y = (side ? 64 : 61) + uy;
      chain(g, hang(hx, y, 10, p.swing * 0.6, 0), VO.chain);
    }
  });
  if (side) f = warp(f, (y) => (y < hipY ? (hipY - y) * p.lean * 0.02 : 0));
  f.outline(VO.outline);

  // ---------- effects ----------
  // eyes
  if (!back) {
    const hx = (side ? CX + 29 : CX) + ux, hy = (side ? 52 : 46) + uy;
    const dx = side ? Math.round((hipY - hy) * p.lean * 0.02) : 0;
    const eyes = side ? [[hx + 4 + dx, hy - 1]] : [[hx - 5, hy - 1], [hx + 3, hy - 1]];
    eyes.forEach(([x, y]) => {
      f.set(x, y, VO.eye[0], true); f.set(x + 1, y, VO.eye[1], true); f.set(x + 2, y, VO.eye[2], true); f.set(x - 1, y + (side ? 0 : 1), VO.eye[3], true);
      if (heat > 1.7) halo(f, x + 1, y + 0.5, 2.5 + heat, VO.eye.slice(1), 0.45);
    });
  }
  // embers drifting off the cracks
  const nE = Math.round(2 + heat * 2);
  for (let k = 0; k < nE; k++) {
    const x = 20 + ((k * 23 + i * 7) % 72), y = 30 + ((k * 17 + i * 11) % 50) - i;
    if (!f.get(x, y)) f.set(x, y, VO.glow[1 + (k % 3)], true);
  }
  if (p.fx === "slam") {
    const gx = side ? fists[0][0] - 2 : CX;
    ringFx(f, gx, G, 26, 6, [VO.glow[2], VO.glow[3], VO.glow[1]], 1.3);
    ringFx(f, gx, G, 18, 4, [VO.horn[3], VO.horn[2]], 2, 0.3);
    for (let k = 0; k < 10; k++) { const a = Math.PI + (k / 9) * Math.PI; const r = 14 + (k % 3) * 4; f.set(gx + Math.cos(a) * r, G - 4 + Math.sin(a) * r * 0.45, VO.horn[2 + (k % 3)], true); f.set(gx + Math.cos(a) * r + 1, G - 4 + Math.sin(a) * r * 0.45, VO.horn[2], true); }
  }
  if (p.fx === "dust") {
    const pts = side ? [[fists[0][0] - 6, G - 2], [fists[0][0] + 7, G - 3], [feet[0][0] - 8, G - 2]] : [[fists[0][0] - 8, G - 2], [fists[1][0] + 8, G - 2], [CX, G - 1]];
    pts.forEach(([x, y], k) => halo(f, x, y - (i % 2), 3 + (k % 2), [VO.horn[3], VO.horn[2], VO.horn[1]], 0.9));
  }
  if (p.fx === "aura") {
    const r = 22 + i * 5;
    ringFx(f, CX, G, r, r * 0.25, [VO.glow[2], VO.glow[3], VO.glow[4]], 1.3, i * 0.3);
    // motion trail behind the whirling chain
    const pts = chainParts[0];
    if (pts) {
      const cx = side ? CX + 8 : CX, cy = 20 + p.bob, rx = side ? 40 : 46 + (i === 5 ? 6 : 0), ry = 12;
      for (let a = p.arc; a < p.arc + 1.4; a += 0.05) {
        const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
        if (!f.get(x, y)) f.set(x, y, a < p.arc + 0.5 ? VO.chain.light : VO.glow[3], true);
      }
    }
    if (heat > 2) halo(f, CX, 60, 40, [VO.glow[4], VO.glow[3]], 0.08 * heat);
    if (i === 5) { ringFx(f, CX, G, 52, 12, [VO.glow[1], VO.glow[2]], 1.4); ringFx(f, CX, 22, 54, 16, [VO.glow[2], VO.chain.light], 2); }
  }
  return f;
}

export const BOSSES = {
  dolora: { w: 64, h: 72, feet: [32, 68], paint: paintDolora, durations: { idle: 0.2, walk: 0.12, run: 0.08, attack: 0.1, skill: 0.1 } },
  morgrave: { w: 96, h: 104, feet: [48, 100], paint: paintMorgrave, durations: { idle: 0.22, walk: 0.13, run: 0.08, attack: 0.11, skill: 0.11 } },
  vorgath: { w: 112, h: 112, feet: [56, 108], paint: paintVorgath, durations: { idle: 0.24, walk: 0.14, run: 0.09, attack: 0.11, skill: 0.09 } }
};
