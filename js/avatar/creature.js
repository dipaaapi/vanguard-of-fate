import { Pix, shade, whiteOf } from "./avatar.js";

// ==================== CREATURES (non-human) ====================
// Same style as the modular Avatar: pixel buffer, selective outline, shade/highlight from the base
// colour, and a cached canvas per frame. Every creature has directions (down / side / up)
// and animations that match how it moves:
//   Slime  — idle (breathing), walk (hop: squash → stretch → airborne → land), attack (squash → pounce)
//   Wolf   — idle (breathing + tail wag), walk (four legs, alternating), attack (crouch → leap)
//   Falcon — fly (wing beats), dive (folded wings), taunt (spread wings + cry)

export class CreatureSprite {
  // anchor (ax, ay) = point on the ground (or the body centre for flyers)
  constructor(w, h, ax, ay, frames) {
    this.w = w;
    this.h = h;
    this.ax = ax;
    this.ay = ay;
    this.frames = frames;
    this.cache = new Map();
  }

  frame(dir, anim, i) {
    const n = this.frames[anim] || 1;
    const idx = ((i % n) + n) % n;
    const key = `${dir}|${anim}|${idx}`;
    if (!this.cache.has(key)) {
      const p = new Pix(this.w, this.h);
      this.render(p, dir, anim, idx);
      p.outline();
      this.cache.set(key, p.toCanvas());
    }
    return this.cache.get(key);
  }

  flashFrame(dir, anim, i) {
    const key = `w|${dir}|${anim}|${i}`;
    if (!this.cache.has(key)) this.cache.set(key, whiteOf(this.frame(dir, anim, i)));
    return this.cache.get(key);
  }

  // flip = facing left (side only); rot = rotation (e.g. the falcon's dive)
  draw(ctx, x, y, dir, anim, i, flip = false, flash = false, scale = 1, rot = 0) {
    const img = flash ? this.flashFrame(dir, anim, i) : this.frame(dir, anim, i);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (rot) ctx.rotate(rot);
    if (flip && dir === "side") ctx.scale(-1, 1);
    ctx.drawImage(img, -this.ax * scale, -this.ay * scale, this.w * scale, this.h * scale);
    ctx.restore();
  }
}

// Fill an ellipse; fn(nx, ny) → colour (nx, ny = -1..1 from the centre)
export function ellipse(p, cx, cy, rx, ry, fn) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
      if (nx * nx + ny * ny <= 1) p.set(x, y, fn(nx, ny));
    }
  }
}

// ==================== SLIME ====================
const SLIME = { base: "#70e000", dark: "#38b000", deep: "#007200", light: "#ccff33", core: "#9ef01a", eye: "#10240a" };

export class SlimeSprite extends CreatureSprite {
  constructor(colors = {}) {
    super(24, 18, 12, 16, { idle: 2, walk: 4, attack: 2 });
    this.c = { ...SLIME, ...colors };
  }

  render(p, dir, anim, i) {
    const c = this.c;
    const pose = {
      idle: [[8, 6, 0, 0], [8.6, 5.5, 0, 0]],
      walk: [[9.2, 5, 0, 0], [7, 7, 1, 0], [7.5, 6.5, 3, 1], [9.6, 4.6, 0, 1]],
      attack: [[10, 4.2, 0, -1], [7, 7, 2, 3]]
    }[anim] || [[8, 6, 0, 0]];
    const [rx, ry, lift, fwd] = pose[i % pose.length];
    // Forward in the facing direction (side = to the right); down/up only hop
    const cx = 12 + (dir === "side" ? fwd : 0);
    const bottom = 16 - lift;
    const cy = bottom - ry;

    ellipse(p, cx, cy, rx, ry, (nx, ny) => {
      if (-nx * 0.6 - ny * 0.8 > 0.62) return c.light;
      if (ny > 0.55) return c.deep;
      if (nx > 0.55 || ny > 0.3) return c.dark;
      return c.base;
    });
    // glowing core inside
    ellipse(p, cx + 1, cy + 1, rx * 0.32, ry * 0.32, () => c.core);

    const ey = Math.round(cy - ry * 0.15);
    if (dir === "down") {
      [Math.round(cx - 3), Math.round(cx + 2)].forEach((x) => {
        p.set(x, ey, "#ffffff"); p.set(x, ey + 1, c.eye);
      });
      if (anim === "attack") { p.set(Math.round(cx) - 1, ey + 3, c.eye); p.set(Math.round(cx), ey + 3, c.eye); }
    } else if (dir === "side") {
      const x = Math.round(cx + rx - 4);
      p.set(x, ey, "#ffffff"); p.set(x, ey + 1, c.eye);
      p.set(x - 3, ey, "#ffffff"); p.set(x - 3, ey + 1, c.eye);
      if (anim === "attack") p.set(x + 1, ey + 3, c.eye);
    } else {
      p.set(Math.round(cx - 2), Math.round(cy - ry * 0.5), "#ffffff");   // highlight at the back
    }
  }
}

// ==================== LOBO (Dire Wolf) ====================
const WOLF = { fur: "#495057", furD: "#343a40", furDD: "#212529", furL: "#6c757d", belly: "#adb5bd", eye: "#ff0055", fang: "#ffffff", nose: "#101014" };

export class WolfSprite extends CreatureSprite {
  constructor(colors = {}) {
    super(34, 24, 17, 22, { idle: 2, walk: 4, attack: 2 });
    this.c = { ...WOLF, ...colors };
  }

  // One leg: 2px wide, from the body down to the ground (bottom)
  leg(p, x, top, bottom, col, colD) {
    for (let y = top; y <= bottom; y++) { p.set(x, y, col); p.set(x + 1, y, colD); }
    p.set(x + 2, bottom, colD);   // paa
  }

  render(p, dir, anim, i) {
    if (dir === "side") this.renderSide(p, anim, i);
    else if (dir === "down") this.renderFront(p, anim, i);
    else this.renderBack(p, anim, i);
  }

  renderSide(p, anim, i) {
    const c = this.c;
    const walk = anim === "walk";
    const atk = anim === "attack" ? i + 1 : 0;       // 1 = yuko, 2 = lundag
    const bob = anim === "idle" ? i : walk ? i % 2 : atk === 1 ? 1 : 0;
    const shift = atk === 1 ? -1 : atk === 2 ? 3 : 0;
    const swing = walk ? [2, 0, -2, 0][i] : 0;
    const liftA = walk && i === 1 ? 1 : 0, liftB = walk && i === 3 ? 1 : 0;
    const spread = atk === 2 ? 2 : 0;
    const ground = 21;

    // Far legs (dark)
    this.leg(p, 10 + shift - swing - spread, 14 + bob, ground - liftB, c.furD, c.furDD);
    this.leg(p, 20 + shift + swing + spread, 14 + bob, ground - liftA, c.furD, c.furDD);

    // Tail (wags while idle / running)
    const wag = anim === "idle" ? i : walk ? i % 2 : 0;
    [[6, 10], [5, 9], [4, 8 - wag], [3, 7 - wag]].forEach(([x, y]) => {
      p.set(x + shift, y + bob, c.furD); p.set(x + shift, y + 1 + bob, c.fur);
    });

    // Katawan
    ellipse(p, 15 + shift, 11 + bob, 9, 4.5, (nx, ny) => (ny > 0.45 ? c.belly : ny < -0.4 ? c.furL : nx > 0.6 ? c.furD : c.fur));
    // Fur on the nape
    p.rows([[7 + bob, 18 + shift, 21 + shift], [8 + bob, 17 + shift, 21 + shift]], c.furD);

    // Near legs
    this.leg(p, 8 + shift + swing - spread, 14 + bob, ground - liftA, c.fur, c.furD);
    this.leg(p, 18 + shift - swing + spread, 14 + bob, ground - liftB, c.fur, c.furD);

    // Head (lowered during the windup)
    const hx = 22 + shift, hy = 5 + bob + (atk === 1 ? 2 : 0);
    for (let y = hy + 1; y <= hy + 5; y++) for (let x = hx; x <= hx + 5; x++) p.set(x, y, y === hy + 1 ? c.furL : c.fur);
    // tainga
    p.set(hx + 1, hy - 1, c.furD); p.set(hx + 1, hy, c.fur); p.set(hx + 2, hy, c.fur);
    // muzzle (jaw open when attacking)
    const open = atk === 2 ? 1 : 0;
    for (let x = hx + 6; x <= hx + 8; x++) { p.set(x, hy + 3, c.furL); p.set(x, hy + 4, c.fur); p.set(x, hy + 5 + open, c.furD); }
    p.set(hx + 8, hy + 3, c.nose);
    if (open) { p.set(hx + 7, hy + 5, c.fang); p.set(hx + 8, hy + 4, c.fang); }
    p.set(hx + 4, hy + 2, c.eye);
  }

  renderFront(p, anim, i) {
    const c = this.c;
    const walk = anim === "walk";
    const atk = anim === "attack" ? i + 1 : 0;
    const bob = anim === "idle" ? i : walk ? i % 2 : atk === 1 ? 1 : 0;
    const dy = atk === 2 ? 1 : 0;
    const liftA = walk && i === 1 ? 2 : 0, liftB = walk && i === 3 ? 2 : 0;

    // Body behind the head + back legs
    this.leg(p, 10, 13 + bob, 20 - liftB, c.furD, c.furDD);
    this.leg(p, 21, 13 + bob, 20 - liftA, c.furD, c.furDD);
    ellipse(p, 17, 12 + bob + dy, 7.5, 4.5, (nx, ny) => (ny < -0.3 ? c.furL : nx > 0.5 ? c.furD : c.fur));

    // Front legs
    this.leg(p, 13, 14 + bob + dy, 21 - liftA, c.fur, c.furD);
    this.leg(p, 18, 14 + bob + dy, 21 - liftB, c.fur, c.furD);

    // Ulo
    const hy = 3 + bob + dy + (atk === 1 ? 2 : 0);
    for (let y = hy + 2; y <= hy + 8; y++) for (let x = 12; x <= 21; x++) {
      if ((y === hy + 8) && (x === 12 || x === 21)) continue;
      p.set(x, y, x >= 20 ? c.furD : y === hy + 2 ? c.furL : c.fur);
    }
    // tainga
    p.rows([[hy, 12, 13], [hy + 1, 12, 14]], c.furD);
    p.rows([[hy, 20, 21], [hy + 1, 19, 21]], c.furDD);
    // mata
    p.set(14, hy + 5, c.eye); p.set(19, hy + 5, c.eye);
    // nguso
    for (let y = hy + 7; y <= hy + 10; y++) for (let x = 14; x <= 19; x++) p.set(x, y, y === hy + 7 ? c.belly : c.furL);
    p.set(16, hy + 7, c.nose); p.set(17, hy + 7, c.nose);
    if (atk === 2) {
      p.rows([[hy + 9, 15, 18]], c.furDD);
      p.set(15, hy + 10, c.fang); p.set(18, hy + 10, c.fang);
    }
  }

  renderBack(p, anim, i) {
    const c = this.c;
    const walk = anim === "walk";
    const atk = anim === "attack" ? i + 1 : 0;
    const bob = anim === "idle" ? i : walk ? i % 2 : atk === 1 ? 1 : 0;
    const liftA = walk && i === 1 ? 2 : 0, liftB = walk && i === 3 ? 2 : 0;

    // Head far away (top), ears
    for (let y = 3 + bob; y <= 7 + bob; y++) for (let x = 13; x <= 20; x++) p.set(x, y, x >= 19 ? c.furD : c.fur);
    p.rows([[1 + bob, 13, 14], [2 + bob, 13, 14]], c.furD);
    p.rows([[1 + bob, 19, 20], [2 + bob, 19, 20]], c.furDD);
    // Front legs (far)
    this.leg(p, 12, 12 + bob, 20 - liftA, c.furD, c.furDD);
    this.leg(p, 19, 12 + bob, 20 - liftB, c.furD, c.furDD);
    // Katawan (likod)
    ellipse(p, 17, 12 + bob, 7, 5.5, (nx, ny) => (Math.abs(nx) < 0.18 ? c.furD : nx > 0.5 ? c.furD : ny < -0.4 ? c.furL : c.fur));
    // Hulihang paa
    this.leg(p, 10, 15 + bob, 21 - liftB, c.fur, c.furD);
    this.leg(p, 21, 15 + bob, 21 - liftA, c.fur, c.furD);
    // Buntot (kumakawag)
    const wag = anim === "idle" ? i : walk ? (i % 2) * 2 - 1 : 0;
    for (let k = 0; k < 5; k++) { p.set(16 + (k > 2 ? wag : 0), 15 + k + bob, c.fur); p.set(17 + (k > 2 ? wag : 0), 15 + k + bob, c.furD); }
  }
}

// ==================== FALCON ====================
const FALCON = {
  body: "#5c3315", bodyD: "#3d200c", wing: "#7c441b", wingD: "#3d200c", breast: "#d4b895",
  head: "#f1ece2", mask: "#2b170e", eye: "#ffd166", beak: "#f59e0b", beakD: "#1e293b", talon: "#f59e0b"
};
// Wing shape per beat phase: [y, x0, x1]
const FALCON_WING = [
  [[1, 8, 10], [2, 8, 12], [3, 9, 13], [4, 9, 14], [5, 10, 15], [6, 10, 15], [7, 11, 15]],   // taas
  [[7, 5, 16], [8, 4, 16], [9, 6, 15]],                                                     // gitna
  [[11, 10, 15], [12, 9, 15], [13, 9, 14], [14, 8, 13], [15, 8, 12], [16, 8, 10]],           // baba
  [[7, 5, 16], [8, 4, 16], [9, 6, 15]]                                                      // gitna
];

export class FalconSprite extends CreatureSprite {
  constructor() {
    super(28, 20, 14, 10, { fly: 4, dive: 1, taunt: 2 });
    this.c = FALCON;
  }

  wing(p, rows, col, colD, dx = 0) {
    rows.forEach(([y, x0, x1]) => {
      for (let x = x0; x <= x1; x++) p.set(x + dx, y, x === x0 || y % 3 === 0 ? colD : col);
    });
  }

  render(p, dir, anim, i) {
    const c = this.c;
    const dive = anim === "dive";
    const taunt = anim === "taunt";

    // Far wing (dark, behind the body)
    if (taunt) this.wing(p, FALCON_WING[0], c.wingD, shade(c.wingD, -0.3), -3);
    else if (!dive) this.wing(p, FALCON_WING[(i + 2) % 4], c.wingD, shade(c.wingD, -0.3), -2);

    // Tail with a white tip
    for (let y = 9; y <= 11; y++) { for (let x = 4; x <= 8; x++) p.set(x, y, c.bodyD); p.set(3, y, "#ffffff"); }

    // Body + speckled chest
    ellipse(p, 13, 10, 5.5, 3.2, (nx, ny) => (ny > 0.2 && nx > -0.2 ? c.breast : ny < -0.4 ? c.body : c.bodyD));
    p.set(15, 11, c.body); p.set(13, 12, c.body);

    // Ulo, maskara, mata at tukang nakakurba
    p.rect(17, 6, 4, 4, c.head);
    p.rows([[7, 18, 20]], c.mask);
    p.set(19, 7, c.eye);
    p.set(21, 8, c.beak); p.set(22, 8, c.beak); p.set(21, 9, c.beak);
    p.set(22, 9, taunt && i === 1 ? null : c.beakD);
    if (taunt && i === 1) p.set(22, 10, c.beak);   // beak open (cry)

    // Talons: hanging while flying, stretched forward while diving
    if (dive) { p.set(17, 13, c.talon); p.set(18, 13, c.talon); p.set(19, 13, "#ffffff"); }
    else { p.set(12, 13, c.talon); p.set(12, 14, c.talon); p.set(14, 13, c.talon); p.set(14, 14, c.talon); }

    // Near wing
    if (dive) this.wing(p, [[8, 7, 16], [9, 8, 15]], c.wing, c.wingD);
    else if (taunt) this.wing(p, FALCON_WING[0], c.wing, c.wingD, 1);
    else this.wing(p, FALCON_WING[i], c.wing, c.wingD);
  }
}

// ==================== DIRECTION HELPER ====================
// From movement (dx, dy) → { dir, flip } for the Avatar and creatures
export function facingFrom(dx, dy, prev = { dir: "down", flip: false }) {
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return prev;
  if (Math.abs(dx) >= Math.abs(dy) * 0.8) return { dir: "side", flip: dx < 0 };
  return { dir: dy < 0 ? "up" : "down", flip: prev.flip };
}
