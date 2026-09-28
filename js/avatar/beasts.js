import { shade } from "./avatar.js";
import { CreatureSprite, ellipse } from "./creature.js";

// ==================== MGA HALIMAW NG MGA ACT (LORE Acts VII–XII at mga banner) ====================
// Parehong estilo ng Avatar at ng slime/lobo: pixel buffer + selective outline + naka-cache na frame.
// Lahat ay may idle (2), walk (4) at attack (2: handa → tama) at direksyon down / side / up
// (ang side ay nakaharap pakanan; ini-flip ng draw() para pakaliwa).

const FR = { idle: 2, walk: 4, attack: 2 };

// Karaniwang galaw bawat frame
function motion(anim, i) {
  const walk = anim === "walk";
  const atk = anim === "attack" ? i + 1 : 0;
  return {
    walk, atk,
    bob: anim === "idle" ? i : walk ? i % 2 : atk === 1 ? 1 : 0,
    liftA: walk && i === 1 ? 1 : 0,
    liftB: walk && i === 3 ? 1 : 0,
    swing: walk ? [1, 0, -1, 0][i] : 0
  };
}

// Kulay mula sa normal (nx, ny): liwanag sa itaas-kaliwa, anino sa ibaba-kanan
const shaded = (c, cD, cL) => (nx, ny) => (-nx * 0.5 - ny * 0.8 > 0.55 ? cL : nx * 0.6 + ny * 0.6 > 0.5 ? cD : c);

// Linya ng pixel (para sa sanga, buntot, sungay)
function line(p, x0, y0, x1, y1, col, w = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let k = 0; k <= n; k++) {
    const x = Math.round(x0 + ((x1 - x0) * k) / n), y = Math.round(y0 + ((y1 - y0) * k) / n);
    for (let a = 0; a < w; a++) p.set(x + a, y, col);
  }
}

// ==================== SPORELING (Act VII) ====================
export class SporelingSprite extends CreatureSprite {
  constructor(c = {}) {
    super(24, 22, 12, 21, FR);
    this.c = { cap: "#8e3fbf", capD: "#5a189a", capL: "#c77dff", spot: "#e0aaff", stem: "#e9e1d0", stemD: "#b5a88f", eye: "#7fffd4", spore: "#b8f2e6", ...c };
  }

  render(p, dir, anim, i) {
    const c = this.c, m = motion(anim, i);
    const sq = m.atk === 1 ? 1 : 0, st = m.atk === 2 ? -1 : 0;
    const sx = dir === "side" ? 1 : 0;
    p.rect(9, 18 - m.liftA, 2, 3, c.stemD);
    p.rect(13, 18 - m.liftB, 2, 3, c.stemD);
    ellipse(p, 12, 15 + m.bob + sq, 4.5, 3.8, shaded(c.stem, c.stemD, "#fffaf0"));
    ellipse(p, 12 - sx, 8 + m.bob + sq * 2 + st * 2, 9 + sq, 5.5 - sq, shaded(c.cap, c.capD, c.capL));
    const cy = 8 + m.bob + sq * 2 + st * 2;
    [[8, -2], [13, -3], [16, 0], [10, 1]].forEach(([x, dy], k) => { if (dir === "up" || k < 3) p.set(x - sx, cy + dy, c.spot); });
    const ey = 14 + m.bob + sq;
    if (dir === "down") {
      p.set(10, ey, c.eye); p.set(14, ey, c.eye);
      p.rows([[ey + 2, 11, 13]], c.stemD);
    } else if (dir === "side") {
      p.set(14, ey, c.eye); p.set(16, ey, c.eye); p.set(16, ey + 2, c.stemD);
    }
    if (m.atk === 2) [[3, 4], [20, 3], [5, 12], [19, 11], [12, 1], [2, 8], [22, 7]].forEach(([x, y]) => p.set(x, y, c.spore));
  }
}

// ==================== DRAKE / WYVERN (Acts VII, IX, X) ====================
export class DrakeSprite extends CreatureSprite {
  constructor(c = {}, flying = false) {
    super(36, 30, 18, 28, FR);
    this.flying = flying;
    this.c = { body: "#3d2d5c", bodyD: "#261a3d", bodyL: "#5a4585", belly: "#8a7aa8", wing: "#2a1f40", wingD: "#171026",
      eye: "#ff3b6b", horn: "#d8d0c0", fire: null, ...c };
  }

  wingRows(up) {
    return up
      ? [[1, 13, 15], [2, 12, 17], [3, 12, 19], [4, 13, 20], [5, 14, 20], [6, 14, 19], [7, 15, 18]]
      : [[13, 13, 19], [14, 12, 19], [15, 11, 18], [16, 11, 16], [17, 12, 14]];
  }

  render(p, dir, anim, i) {
    const c = this.c, m = motion(anim, i);
    const lift = this.flying ? 7 + (i % 2) : 0;
    const flapUp = this.flying ? i % 2 === 0 : false;
    if (dir === "side") return this.side(p, c, m, lift, flapUp);
    return this.front(p, c, m, lift, flapUp, dir === "up");
  }

  side(p, c, m, lift, flapUp) {
    const sh = m.atk === 1 ? -1 : m.atk === 2 ? 3 : 0;
    const by = 15 - lift + m.bob;
    // malayong pakpak
    if (this.flying) this.wingRows(!flapUp).forEach(([y, a, b]) => { for (let x = a; x <= b; x++) p.set(x + sh - 2, y - lift + 2, c.wingD); });
    // buntot
    line(p, 9 + sh, by, 5 + sh, by - 2, c.bodyD, 2);
    line(p, 5 + sh, by - 2, 1 + sh, by - 5 + m.bob, c.bodyD);
    // mga paa
    if (!this.flying) {
      const g = 23;
      [[10, m.liftB, c.bodyD], [19, m.liftA, c.bodyD], [12, m.liftA, c.body], [21, m.liftB, c.body]].forEach(([x, l, col], k) => {
        const s = k % 2 ? m.swing : -m.swing;
        for (let y = by + 3; y <= g - l; y++) { p.set(x + sh + s, y, col); p.set(x + sh + s + 1, y, shade(col, -0.2)); }
        p.set(x + sh + s + 2, g - l, c.horn);
      });
    } else {
      p.rect(12 + sh, by + 4, 2, 2, c.bodyD); p.rect(18 + sh, by + 4, 2, 2, c.bodyD);
    }
    ellipse(p, 15 + sh, by, 8, 4.5, (nx, ny) => (ny > 0.45 ? c.belly : ny < -0.4 ? c.bodyL : nx > 0.6 ? c.bodyD : c.body));
    // leeg at ulo (nakayuko sa windup)
    const hy = by - 7 + (m.atk === 1 ? 2 : 0);
    p.rect(21 + sh, hy + 3, 3, 5, c.body);
    p.rect(23 + sh, hy, 6, 4, c.body);
    p.rows([[hy, 23 + sh, 28 + sh]], c.bodyL);
    p.rect(29 + sh, hy + 1, 3, 2, c.body);
    p.set(24 + sh, hy - 1, c.horn); p.set(23 + sh, hy - 2, c.horn);
    p.set(26 + sh, hy + 1, c.eye);
    if (m.atk === 2) {
      p.rows([[hy + 4, 27 + sh, 31 + sh]], c.bodyD);
      p.set(30 + sh, hy + 3, "#ffffff");
      if (c.fire) [[33, 0], [34, 1], [35, 0], [34, -1]].forEach(([x, dy]) => p.set(Math.min(35, x + sh - 2), hy + 3 + dy, c.fire));
    }
    // malapit na pakpak
    if (this.flying) this.wingRows(flapUp).forEach(([y, a, b]) => { for (let x = a; x <= b; x++) p.set(x + sh, y - lift + 2, x === a || y % 3 === 0 ? c.wingD : c.wing); });
    else p.rows([[by - 4, 11 + sh, 18 + sh], [by - 3, 10 + sh, 17 + sh]], c.wing);
  }

  front(p, c, m, lift, flapUp, back) {
    const by = 16 - lift + m.bob;
    const wing = (mirror) => {
      const rows = this.flying ? (flapUp ? [[by - 9, 3, 6], [by - 7, 2, 9], [by - 5, 3, 11], [by - 3, 5, 12], [by - 1, 8, 12]]
        : [[by - 1, 4, 12], [by + 1, 2, 11], [by + 3, 3, 9], [by + 5, 5, 7]]) : [[by - 3, 7, 11], [by - 1, 6, 11]];
      rows.forEach(([y, a, b]) => {
        for (let x = a; x <= b; x++) for (let d = 0; d < 2; d++) p.set(mirror ? 35 - x : x, y + d, x === a ? c.wingD : c.wing);
      });
    };
    if (!back) { wing(false); wing(true); }
    if (back) line(p, 18, by + 4, 18 + (m.bob ? 1 : -1), by + 12, c.bodyD, 2);   // buntot palayo
    if (!this.flying) {
      [[13, m.liftA], [21, m.liftB]].forEach(([x, l]) => { for (let y = by + 3; y <= 27 - l; y++) { p.set(x, y, c.body); p.set(x + 1, y, c.bodyD); } });
    }
    ellipse(p, 18, by + 1, 6.5, 5, shaded(c.body, c.bodyD, c.bodyL));
    if (!back) {
      ellipse(p, 18, by + 3, 3.5, 3, () => c.belly);
      const hy = by - 6 + (m.atk === 1 ? 2 : 0);
      ellipse(p, 18, hy, 4, 3.5, shaded(c.body, c.bodyD, c.bodyL));
      p.set(16, hy - 1, c.eye); p.set(20, hy - 1, c.eye);
      p.set(15, hy - 4, c.horn); p.set(14, hy - 5, c.horn); p.set(21, hy - 4, c.horn); p.set(22, hy - 5, c.horn);
      p.rows([[hy + 2, 17, 19]], m.atk === 2 ? "#ffffff" : c.bodyD);
      if (m.atk === 2 && c.fire) [[17, hy + 4], [18, hy + 5], [19, hy + 4], [18, hy + 6]].forEach(([x, y]) => p.set(x, y, c.fire));
    } else {
      ellipse(p, 18, by - 5, 3.5, 3, shaded(c.body, c.bodyD, c.bodyL));
      p.set(15, by - 8, c.horn); p.set(21, by - 8, c.horn);
      wing(false); wing(true);
    }
  }
}

// ==================== ALIMANGO / GAGAMBA (Acts VIII, XI) ====================
export class CrabSprite extends CreatureSprite {
  constructor(c = {}, spider = false) {
    super(30, 22, 15, 20, FR);
    this.spider = spider;
    this.c = { shell: "#7b3fa0", shellD: "#4c2266", shellL: "#a86bd0", leg: "#3d1f52", eye: "#ffd166", ...c };
  }

  render(p, dir, anim, i) {
    const c = this.c, m = motion(anim, i);
    const rx = dir === "side" ? 6.5 : 8;
    const by = 12 + m.bob;
    const reach = this.spider ? 3 : 1;
    // mga paa (3 bawat gilid), salitan ang angat habang naglalakad
    for (let k = 0; k < 3; k++) {
      const up = m.walk && (k + i) % 2 === 0 ? 1 : 0;
      const ox = 15 - rx + 1 + k * 2, tx = ox - 4 - reach - (k === 0 ? 1 : 0);
      const ox2 = 15 + rx - 1 - k * 2, tx2 = ox2 + 4 + reach + (k === 0 ? 1 : 0);
      line(p, ox, by + 1, tx, by - 1 - up, c.leg);
      line(p, tx, by - 1 - up, tx - 1, 20 - up, c.leg);
      line(p, ox2, by + 1, tx2, by - 1 - up, c.leg);
      line(p, tx2, by - 1 - up, tx2 + 1, 20 - up, c.leg);
    }
    ellipse(p, 15, by, rx, 5, shaded(c.shell, c.shellD, c.shellL));
    if (!this.spider) {
      // mga sipit: nakataas sa windup, nakasara sa tama
      const cy = m.atk === 1 ? by - 5 : by + 1;
      [[5, -1], [25, 1]].forEach(([x, s]) => {
        if (dir === "up") return;
        ellipse(p, x, cy, 2.5, 2, shaded(c.shell, c.shellD, c.shellL));
        p.set(x + s * 2, cy - 1, m.atk === 2 ? c.shellD : c.shellL);
      });
    }
    if (dir === "up") { p.rows([[by - 2, 12, 18]], c.shellL); return; }
    const ex = dir === "side" ? 3 : 0;
    if (this.spider) {
      [[12, by - 1], [14, by - 2], [16, by - 2], [18, by - 1]].forEach(([x, y]) => p.set(x + ex, y, c.eye));
      p.rows([[by + 3, 14 + ex, 16 + ex]], m.atk === 2 ? "#ffffff" : c.shellD);
    } else {
      [12, 18].forEach((x) => { p.set(x + ex, by - 5, c.leg); p.set(x + ex, by - 6, c.eye); });
    }
  }
}

// ==================== SERPENT NG DAGAT (Act VIII) ====================
export class SerpentSprite extends CreatureSprite {
  constructor(c = {}) {
    super(38, 24, 19, 22, FR);
    this.c = { body: "#1f6f78", bodyD: "#12474d", bodyL: "#3fb0a8", belly: "#a8e6cf", fin: "#e76f51", eye: "#ffd166", ...c };
  }

  render(p, dir, anim, i) {
    const c = this.c, m = motion(anim, i);
    const phase = i * (Math.PI / 2);
    if (dir === "side") {
      const lunge = m.atk === 2 ? 3 : m.atk === 1 ? -1 : 0;
      for (let s = 0; s <= 13; s++) {
        const x = 2 + s * 2 + lunge * (s / 13), y = 17 + Math.round(Math.sin(s * 0.8 - phase) * 2);
        const th = s < 3 ? 2 : 3;
        for (let t = 0; t < th; t++) { p.set(Math.round(x), y + t, t === th - 1 ? c.belly : t === 0 ? c.bodyL : c.body); p.set(Math.round(x) + 1, y + t, t === th - 1 ? c.belly : c.body); }
        if (s % 3 === 1 && s > 2) p.set(Math.round(x), y - 1, c.fin);
      }
      // leeg na nakataas at ulo
      const hx = 29 + lunge, hy = 7 + m.bob + (m.atk === 1 ? 2 : 0);
      line(p, 29 + lunge, 16, hx, hy + 4, c.body, 3);
      p.rect(hx, hy, 6, 4, c.body);
      p.rows([[hy, hx, hx + 5]], c.bodyL);
      p.rect(hx + 6, hy + 1, 2, 2, c.body);
      p.set(hx + 3, hy + 1, c.eye);
      p.set(hx + 1, hy - 1, c.fin); p.set(hx + 2, hy - 2, c.fin); p.set(hx, hy - 2, c.fin);
      if (m.atk === 2) { p.rows([[hy + 4, hx + 4, hx + 7]], c.bodyD); p.set(hx + 6, hy + 3, "#ffffff"); }
      return;
    }
    // harap/likod: nakapulupot na may nakataas na ulo
    ellipse(p, 19, 17, 11, 4, (nx, ny) => (Math.abs(ny) < 0.3 && Math.abs(nx) < 0.55 ? null : ny > 0.4 ? c.belly : nx > 0.5 ? c.bodyD : c.body));
    const hy = 5 + m.bob + (m.atk === 1 ? 2 : 0) + (m.atk === 2 ? 2 : 0);
    line(p, 18, 15, 18, hy + 4, c.body, 3);
    ellipse(p, 19, hy + 2, 4, 3, shaded(c.body, c.bodyD, c.bodyL));
    p.set(16, hy - 1, c.fin); p.set(22, hy - 1, c.fin); p.set(19, hy - 2, c.fin);
    if (dir === "down") {
      p.set(17, hy + 1, c.eye); p.set(21, hy + 1, c.eye);
      if (m.atk === 2) { p.rows([[hy + 4, 18, 20]], c.bodyD); p.set(18, hy + 4, "#ffffff"); p.set(20, hy + 4, "#ffffff"); }
    }
  }
}

// ==================== BRUTE: yeti, golem, Ignis, Satan (Acts IX, X, XII) ====================
// opts: horns, wings, hammer, cracks (kulay ng bitak na kumikinang), crystals (tinik sa balikat)
export class BruteSprite extends CreatureSprite {
  constructor(c = {}, opts = {}) {
    super(44, 48, 22, 46, FR);
    this.o = opts;
    this.c = { fur: "#e8eef5", furD: "#a9b8cc", furL: "#ffffff", face: "#7a8fb0", eye: "#38bdf8", horn: "#d8d0c0",
      wing: "#2a1f40", wingD: "#171026", hammer: "#3b3f4a", hammerL: "#8a99ab", crack: "#ff7a1a", crystal: "#bfe9ff", ...c };
  }

  render(p, dir, anim, i) {
    const c = this.c, o = this.o, m = motion(anim, i);
    const side = dir === "side", back = dir === "up";
    const cx = side ? 20 : 22;
    const by = m.bob;
    const body = shaded(c.fur, c.furD, c.furL);

    // pakpak (nasa likod; nasa ibabaw kapag nakatalikod)
    const wings = () => {
      const flap = i % 2;
      [-1, 1].forEach((s) => {
        if (side && s < 0) return;
        const root = side ? 12 : cx + s * 8;
        for (let k = 0; k < 16; k++) {
          const x = side ? root - k : root + s * k;
          const top = 4 + Math.round(Math.abs(k - 9) * 0.5) + (flap ? 2 : 0) + by;
          const bot = 16 + Math.round(k * 0.9) - (k > 12 ? (k - 12) * 3 : 0) + by;
          for (let y = top; y <= bot; y++) p.set(x, y, y === top || k % 4 === 0 ? c.wingD : c.wing);
        }
      });
    };
    if (o.wings && !back) wings();

    // mga binti
    const legs = side ? [[16 + m.swing * 2, m.liftA, c.furD], [21 - m.swing * 2, m.liftB, c.fur]] : [[14, m.liftA, c.fur], [25, m.liftB, c.fur]];
    legs.forEach(([x, l, col]) => { p.rect(x, 36 + by, 5, 9 - l - by, col); p.rect(x - 1, 44 - l, 7, 2, shade(col, -0.25)); });

    // katawan
    ellipse(p, cx, 26 + by, side ? 10 : 12, 10.5, body);
    if (!back) ellipse(p, cx + (side ? 3 : 0), 29 + by, side ? 4 : 6, 5, () => c.furL);
    if (o.cracks) [[cx - 4, 22], [cx - 3, 23], [cx - 2, 24], [cx + 3, 27], [cx + 4, 28], [cx + 5, 29], [cx - 1, 31], [cx, 32]].forEach(([x, y]) => p.set(x, y + by, c.crack));
    if (o.crystals) [[cx - 11, 17], [cx - 10, 15], [cx + 10, 17], [cx + 11, 15], [cx - 9, 16], [cx + 9, 16]].forEach(([x, y]) => p.set(x, y + by, c.crystal));

    // ulo
    const hx = side ? cx + 6 : cx, hy = 13 + by + (m.atk === 1 ? 1 : 0);
    ellipse(p, hx, hy, 6, 5.5, body);
    if (o.horns) {
      const hs = side ? [1] : [-1, 1];
      hs.forEach((s) => { line(p, hx + s * 4, hy - 4, hx + s * 7, hy - 9, c.horn, 2); p.set(hx + s * 7, hy - 10, c.horn); });
    }
    if (!back) {
      ellipse(p, hx + (side ? 2 : 0), hy + 2, side ? 3 : 4, 3, () => c.face);
      if (side) p.set(hx + 3, hy + 1, c.eye);
      else { p.set(hx - 2, hy + 1, c.eye); p.set(hx + 2, hy + 1, c.eye); }
      p.rows([[hy + 4, hx - 1 + (side ? 2 : 0), hx + 1 + (side ? 2 : 0)]], m.atk === 2 ? "#ffffff" : shade(c.face, -0.4));
    }

    // mga braso: windup = nakataas, strike = pinalo pababa sa harap
    const arm = (ax, s) => {
      const col = s < 0 || !side ? c.fur : c.furD;
      if (m.atk === 1) {
        p.rect(ax, 2 + by, 4, 20, col);
        p.rect(ax - 1, 0 + by, 6, 4, c.furD);
        return { fx: ax + 2, fy: 1 + by };
      }
      if (m.atk === 2) {
        const fx = side ? 30 : cx + s * 4;
        line(p, ax + 1, 20 + by, fx, 36, col, 4);
        p.rect(fx - 1, 36, 6, 5, c.furD);
        return { fx: fx + 2, fy: 38 };
      }
      const sw = s * m.swing;
      p.rect(ax, 18 + by, 4, 16 + sw, col);
      p.rect(ax - 1, 33 + by + sw, 6, 5, c.furD);
      return { fx: ax + 2, fy: 35 + by + sw };
    };
    let hand;
    if (side) hand = arm(22 - m.swing, 1);
    else { arm(cx - 15, -1); hand = arm(cx + 11, 1); }

    if (o.hammer) {
      const { fx, fy } = hand;
      if (m.atk === 1) { line(p, fx, fy, fx, fy - 2, c.hammer, 2); p.rect(fx - 5, 0, 12, 4, c.hammer); p.rows([[0, fx - 5, fx + 6]], c.hammerL); }
      else if (m.atk === 2) { p.rect(fx - 6, 40, 13, 6, c.hammer); p.rows([[40, fx - 6, fx + 6]], c.hammerL); if (o.cracks) p.rows([[45, fx - 8, fx + 8]], c.crack); }
      else { line(p, fx, fy - 12, fx, fy + 6, c.hammer, 2); p.rect(fx - 4, fy - 17, 10, 6, c.hammer); p.rows([[fy - 17, fx - 4, fx + 5]], c.hammerL); }
    }
    if (o.wings && back) wings();
  }
}

// ==================== IMP (Acts X, XI, XII) ====================
export class ImpSprite extends CreatureSprite {
  constructor(c = {}) {
    super(24, 26, 12, 24, FR);
    this.c = { skin: "#b3312b", skinD: "#7a1f1b", skinL: "#e0544a", horn: "#2b2b33", eye: "#ffd166", wing: "#4a1512", ...c };
  }

  render(p, dir, anim, i) {
    const c = this.c, m = motion(anim, i);
    const side = dir === "side", back = dir === "up";
    const lunge = m.atk === 2 ? (side ? 2 : 0) : 0;
    const by = m.bob + (m.atk === 2 && !side ? 1 : 0);
    const x0 = 12 + lunge;
    // pakpak at buntot
    const wing = (s) => [[10, 4, 6], [11, 3, 7], [12, 3, 8], [13, 5, 8]].forEach(([y, a, b]) => {
      for (let x = a; x <= b; x++) p.set(s > 0 ? 23 - x + lunge : x + lunge, y + by - (i % 2), c.wing);
    });
    if (!back) { wing(-1); if (!side) wing(1); }
    const tx = side ? x0 - 4 : x0 + 3;
    line(p, tx, 18 + by, tx + (side ? -4 : 5), 14 + by, c.skinD);
    p.set(tx + (side ? -5 : 6), 13 + by, c.skinD); p.set(tx + (side ? -4 : 6), 12 + by, c.skinD);
    // binti
    [[x0 - 3, m.liftA], [x0 + 1, m.liftB]].forEach(([x, l]) => { p.rect(x + (side ? m.swing : 0), 18 + by, 2, 5 - l - by, c.skinD); p.rect(x - 1, 23 - l, 3, 1, c.horn); });
    ellipse(p, x0, 15 + by, 4, 4, shaded(c.skin, c.skinD, c.skinL));
    // braso at kuko
    const ay = m.atk === 1 ? 7 : m.atk === 2 ? 13 : 13;
    const ax = m.atk === 2 ? (side ? x0 + 6 : x0 + 5) : x0 + 4;
    line(p, x0 + 3, 13 + by, ax, ay + by, c.skin, 2);
    p.set(ax + 1, ay - 1 + by, "#f1f5f9"); p.set(ax + 2, ay + by, "#f1f5f9");
    if (!side) line(p, x0 - 4, 13 + by, x0 - 6, 17 + by, c.skin, 2);
    // ulo, sungay, tainga, mata, ngisi
    const hx = x0 + (side ? 1 : 0), hy = 8 + by;
    ellipse(p, hx, hy, 5, 4.5, shaded(c.skin, c.skinD, c.skinL));
    const horns = side ? [[hx - 1, -1]] : [[hx - 3, -1], [hx + 3, 1]];
    horns.forEach(([x, s]) => { p.set(x, hy - 4, c.horn); p.set(x + s, hy - 5, c.horn); p.set(x + s, hy - 6, c.horn); });
    if (!side) { p.set(hx - 6, hy, c.skin); p.set(hx + 6, hy, c.skinD); }
    if (!back) {
      if (side) { p.set(hx + 2, hy, c.eye); p.rows([[hy + 2, hx + 1, hx + 3]], c.skinD); p.set(hx + 2, hy + 2, "#ffffff"); }
      else {
        p.set(hx - 2, hy, c.eye); p.set(hx + 2, hy, c.eye);
        p.rows([[hy + 2, hx - 2, hx + 2]], c.skinD); p.set(hx - 1, hy + 2, "#ffffff"); p.set(hx + 1, hy + 2, "#ffffff");
      }
    } else { wing(-1); wing(1); }
  }
}

// ==================== SPECTER (Act XII: spectral horrors) ====================
export class SpecterSprite extends CreatureSprite {
  constructor(c = {}) {
    super(26, 32, 13, 30, FR);
    this.c = { robe: "#4b3f72", robeD: "#2b2244", robeL: "#7a6aa8", eye: "#c77dff", claw: "#d8cff0", ...c };
  }

  render(p, dir, anim, i) {
    const c = this.c, m = motion(anim, i);
    const fl = anim === "idle" ? i : (i % 2);     // lumulutang
    const fwd = m.atk === 2 ? (dir === "side" ? 2 : 0) : 0;
    const top = 2 + fl;
    // kasuotang punit sa laylayan
    for (let y = 10; y <= 25; y++) {
      const w = 4 + Math.floor((y - 10) * 0.4);
      for (let x = 13 - w; x <= 13 + w; x++) {
        if (y > 22 && (x + y + i) % 3 === 0) continue;
        p.set(x + fwd, y + top - 2, x > 13 + w - 2 ? c.robeD : x < 13 - w + 2 ? c.robeL : c.robe);
      }
    }
    // mga braso
    const ay = m.atk === 1 ? 4 : m.atk === 2 ? 11 : 15;
    const reach = m.atk === 2 ? 5 : 2;
    [[-1, 8], [1, 18]].forEach(([s, x]) => {
      if (dir === "side" && s < 0) return;
      const ex = dir === "side" ? 19 + reach : x + s * reach;
      line(p, x + fwd, 12 + top, ex + fwd, ay + top, c.robeD, 2);
      p.set(ex + fwd + s, ay + top - 1, c.claw); p.set(ex + fwd + s, ay + top + 1, c.claw);
    });
    // hood at mukha
    ellipse(p, 13 + fwd, 6 + top, 5.5, 5.5, shaded(c.robe, c.robeD, c.robeL));
    if (dir !== "up") {
      const fx = 13 + fwd + (dir === "side" ? 2 : 0);
      ellipse(p, fx, 7 + top, 3, 3, () => "#07050d");
      if (dir === "side") p.set(fx + 1, 7 + top, c.eye);
      else { p.set(fx - 1, 7 + top, c.eye); p.set(fx + 1, 7 + top, c.eye); }
    }
  }
}

// ==================== BOSS: MALAKOR THE BLIGHT HERALD (Act VII) ====================
export class TreantSprite extends CreatureSprite {
  constructor() {
    super(68, 76, 34, 74, FR);
    this.c = { bark: "#5a3d2b", barkD: "#3b2618", barkL: "#7a5a3f", moss: "#3f6b3a", mossL: "#6a9a4a", sap: "#1a1020",
      eye: "#ff2d55", heart: "#ff2d55", heartL: "#ffc2cf", root: "#4a3020" };
  }

  render(p, dir, anim, i) {
    const c = this.c, m = motion(anim, i);
    const sway = anim === "idle" ? (i ? 1 : 0) : 0;
    const back = dir === "up";
    // mga ugat (paa): nagpapalit-palit habang naglalakad
    [[20, m.liftA], [30, 0], [38, m.liftB], [46, 0]].forEach(([x, l], k) => {
      line(p, x, 58, x - 6 + k * 3, 73 - l, c.root, 3);
      line(p, x, 60, x + 4 - k, 73 - l, c.barkD, 2);
    });
    // katawan (puno)
    for (let y = 22; y <= 62; y++) {
      const w = 11 + Math.floor((y - 22) * 0.12) + (y > 55 ? (y - 55) : 0);
      for (let x = 34 - w; x <= 34 + w; x++) {
        let col = (x + (y >> 2)) % 5 === 0 ? c.barkD : c.bark;
        if (x < 34 - w + 3) col = c.barkL;
        if (x > 34 + w - 3) col = c.barkD;
        p.set(x + sway, y, col);
      }
    }
    // lumot at itim na dagta
    [[24, 30], [25, 31], [43, 36], [44, 37], [27, 50], [42, 52]].forEach(([x, y]) => p.set(x + sway, y, c.moss));
    [[30, 44], [30, 45], [30, 46], [39, 47], [39, 48]].forEach(([x, y]) => p.set(x + sway, y, c.sap));
    // koronang sanga
    const branches = [[34, 22, 34, 2], [30, 22, 20, 4], [38, 22, 48, 3], [26, 24, 12, 10], [42, 24, 56, 9], [22, 8, 16, 2], [44, 7, 52, 1]];
    branches.forEach(([x0, y0, x1, y1], k) => line(p, x0 + sway, y0, x1 + sway + (k % 2 ? sway : -sway), y1, k < 3 ? c.bark : c.barkD, k < 5 ? 2 : 1));
    [[18, 6], [50, 5], [14, 11], [54, 12], [34, 3]].forEach(([x, y]) => { p.set(x + sway, y, c.moss); p.set(x + sway + 1, y, c.mossL); });
    if (!back) {
      // mukha: pulang mata at tulis-tulis na bibig
      p.rect(27 + sway, 26, 3, 2, c.eye); p.rect(38 + sway, 26, 3, 2, c.eye);
      line(p, 26 + sway, 24, 30 + sway, 25, c.barkD); line(p, 42 + sway, 24, 38 + sway, 25, c.barkD);
      for (let x = 28; x <= 40; x++) p.set(x + sway, 32 + (x % 2), c.sap);
      if (m.atk === 2) p.rows([[33, 29 + sway, 39 + sway], [34, 30 + sway, 38 + sway]], c.sap);
      // kumikinang na heartstone
      ellipse(p, 34 + sway, 43, 4, 5, (nx, ny) => (nx * nx + ny * ny < 0.25 ? (i % 2 ? "#ffffff" : c.heartL) : c.heart));
    }
    // mga brasong sanga
    const arm = (s) => {
      const sx = 34 + s * 11 + sway;
      if (m.atk === 1) { line(p, sx, 28, sx + s * 6, 4, c.bark, 3); [[-2, -3], [0, -4], [2, -3]].forEach(([dx, dy]) => line(p, sx + s * 6, 4, sx + s * 6 + dx * 2, 4 + dy, c.barkD)); }
      else if (m.atk === 2) { line(p, sx, 30, 34 + s * 8, 66, c.bark, 3); [[-3, 2], [0, 3], [3, 2]].forEach(([dx, dy]) => line(p, 34 + s * 8, 66, 34 + s * 8 + dx, 66 + dy, c.barkD)); }
      else { const sw = s * m.swing * 2; line(p, sx, 28, sx + s * 12, 50 + sw, c.bark, 3); [[-2, 4], [0, 5], [2, 4]].forEach(([dx, dy]) => line(p, sx + s * 12, 50 + sw, sx + s * 12 + dx * s, 50 + sw + dy, c.barkD)); }
    };
    arm(-1); arm(1);
  }
}

// ==================== BOSS: LEVIATHAN REGENT (Act VIII) ====================
export class LeviathanSprite extends CreatureSprite {
  constructor() {
    super(88, 68, 44, 64, FR);
    this.c = { scale: "#1e2a44", scaleD: "#111827", scaleL: "#3b4f7a", belly: "#2a9d8f", fin: "#2a9d8f", finL: "#7fe0d0",
      eye: "#5ee7ff", helm: "#0b0f1a", gold: "#e0b44c", foam: "#e0f7ff", water: "#1b6f8a" };
  }

  render(p, dir, anim, i) {
    const c = this.c, m = motion(anim, i);
    const sway = anim === "walk" ? [-2, 0, 2, 0][i] : anim === "idle" ? i : 0;
    // tubig at bula sa ilalim
    ellipse(p, 44, 60, 40, 6, (nx, ny) => (Math.abs(ny) > 0.6 ? c.foam : c.water));
    // mga likaw na lumilitaw sa tubig
    [[16, 1], [72, -1]].forEach(([x, s]) => {
      for (let a = 0; a <= 12; a++) {
        const ang = (a / 12) * Math.PI;
        const px = Math.round(x - Math.cos(ang) * 9 * s), py = Math.round(58 - Math.sin(ang) * 12);
        for (let t = 0; t < 4; t++) p.set(px, py + t, t === 0 ? c.scaleL : t === 3 ? c.belly : c.scale);
      }
      p.set(x, 45, c.fin); p.set(x, 44, c.finL);
    });
    // leeg
    const lunge = m.atk === 2 ? 6 : m.atk === 1 ? -3 : 0;
    for (let y = 22; y <= 58; y++) {
      const x = 44 + Math.round(Math.sin((y + i * 6) / 7) * 2) + Math.round(sway * (58 - y) / 36);
      for (let d = -6; d <= 6; d++) p.set(x + d, y + (y < 30 ? lunge : 0), d > 3 ? c.scaleD : d < -3 ? c.scaleL : (y % 4 === 0 ? c.scaleD : c.scale));
      if (y % 6 === 0) p.set(x, y, c.belly);
    }
    const hx = 44 + sway, hy = 17 + lunge;
    // palikpik sa gilid
    [[-1, 30], [1, 58]].forEach(([s, x]) => { for (let k = 0; k < 8; k++) line(p, hx + s * 8, hy - 2 + k, x + sway + s * (k > 4 ? -2 : 0), hy - 6 + k * 2, k % 2 ? c.fin : c.finL); });
    // ulo
    ellipse(p, hx, hy, 12, 9, shaded(c.scale, c.scaleD, c.scaleL));
    // abyssal helm na may gintong tinik
    for (let x = hx - 10; x <= hx + 10; x++) p.set(x, hy - 7, c.helm);
    [-9, -5, 0, 5, 9].forEach((d, k) => line(p, hx + d, hy - 8, hx + d, hy - 13 - (k === 2 ? 3 : 0), k === 2 ? c.gold : c.helm, 2));
    if (dir !== "up") {
      p.rect(hx - 7, hy - 2, 3, 2, c.eye); p.rect(hx + 5, hy - 2, 3, 2, c.eye);
      // panga
      const open = m.atk === 2 ? 3 : 0;
      p.rows([[hy + 4, hx - 6, hx + 6]], c.scaleD);
      if (open) { p.rect(hx - 5, hy + 5, 11, open, "#07050d"); for (let x = hx - 5; x <= hx + 5; x += 2) { p.set(x, hy + 5, "#ffffff"); p.set(x + 1, hy + 4 + open, "#ffffff"); } }
    }
  }
}
