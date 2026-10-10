// Act XIV — The Chainspire Descent
// Behind the Obsidian Throne the rift opens on a vast spire of black chains spiralling down into a
// red-violet abyss. Chained souls of every race glow along it; Vorgath, the Chained Warden, bound to
// the spire by his own oath, bars the bridge as the champion and the new Sovereign descend.
import { vorgath } from "../lib/darkBosses.js";

export function paint(P, { R, K, S }) {
  const { hex, mixC, shadeC, sky, vortex, chain, stand, rimLight, sparks, fogBand } = K;
  const CX = 240;

  P.layer("abyss", 0);
  // the abyss: dark above, burning red-violet below
  sky(P, [[0, hex("#07030c")], [0.35, hex("#1e0820")], [0.7, hex("#5a0e38")], [1, hex("#b02a52")]], 0, P.h, 3);
  vortex(P, CX, 262, 210, 46, { colors: ["#12040e", "#3a0a2a", "#7a1446", "#d0386a", "#ffc0d0"], arms: 5, twist: 2.4, seed: 14 });
  P.glow(CX, 262, 120, hex("#ff3b6a"), 0.5, 1.4);

  P.layer("walls", 0.55);
  // rift walls of black rock on both sides
  for (let y = 0; y < P.h; y++) {
    const wl = 46 + K.fbm1(y * 0.03, 3) * 40 - y * 0.08, wr = P.w - 46 - K.fbm1(y * 0.03, 9) * 40 + y * 0.08;
    for (let x = 0; x < P.w; x++) {
      if (x > wl && x < wr) continue;
      const edge = Math.abs(x - wl) < 2 || Math.abs(x - wr) < 2;
      P.set(x, y, edge ? hex("#5a1a3a") : K.noise2(x * 0.15, y * 0.08, 4) > 0.6 ? hex("#1a0c16") : hex("#0e0610"));
    }
  }

  P.layer("spire", 0.3);
  // the spire: a column of hanging chains narrowing as it plunges into the Maw
  const half = (y) => 34 - y * 0.09;
  for (let i = 0; i < 13; i++) {
    const f = i / 12 - 0.5;
    const top = [CX + f * 2 * half(0) + R.range(-2, 2), -4 - R.range(0, 8)], bot = [CX + f * 2 * half(262) * 0.6 + R.range(-3, 3), 262];
    const k = 1 - Math.abs(f) * 1.2;
    chain(P, top[0], top[1], bot[0], bot[1], { link: R.pick([2, 3, 4]), sag: R.range(-4, 4), c: mixC(hex("#2a2030"), hex("#4a3a50"), k).map(Math.round).reduce((s, v) => s + v.toString(16).padStart(2, "0"), "#"), lit: "#6a5a74", dark: "#08040a" });
  }
  P.wash(CX, 120, 40, 140, hex("#05020a"), 0.35);
  // the spiral bridge winding round the spire (back half dim, front half lit)
  const turns = 3.2;
  for (const front of [false, true]) {
    for (let t = 0; t < turns * Math.PI * 2; t += 0.02) {
      const y = 20 + (t / (turns * Math.PI * 2)) * 236, rx = 150 - y * 0.42, x = CX + Math.cos(t) * rx, z = Math.sin(t);
      if ((z > 0) !== front) continue;
      const w = Math.max(2, 8 - y * 0.025), c = front ? hex("#3a2a3e") : hex("#1a1020");
      P.rect(x - 1, y + z * 10, 2, w, c);
      P.set(x, y + z * 10, front ? hex("#9a6a8a") : hex("#3a2232"));
      if (front && Math.round(t * 50) % 9 === 0) P.vline(x, y + z * 10 - 4, y + z * 10, hex("#5a4a64"));
    }
  }
  // chained souls hanging from the spire and the bridge
  const souls = [S.hero("novice", "down"), S.npc("royalGuard", "down"), S.npc("lyra", "down"), S.npc("brakka", "down"), S.npc("hilde", "down")];
  for (let i = 0; i < 22; i++) {
    const t = R.range(0, turns * Math.PI * 2), y = 20 + (t / (turns * Math.PI * 2)) * 236;
    if (y < 40 || y > 190 || Math.sin(t) < 0.1) continue;
    const rx = 150 - y * 0.42, x = CX + Math.cos(t) * rx, yy = y + Math.sin(t) * 10;
    const sc = y > 150 ? 0.5 : 1;
    const f = R.pick(souls);
    chain(P, x, yy, x, yy + 10 * sc, { link: 2, c: "#4a3a50", lit: "#8a7a94" });
    P.glow(x, yy + 10 * sc + 14, 9, hex("#7dd3fc"), 0.3, 2);
    const left = Math.round(x - f.width / 2), top = Math.round(yy + 10 * sc - 4);
    P.blit(f, left, top, { tint: hex("#9ff3ff"), tintK: 0.75, alpha: 0.75 });
  }
  fogBand(P, 210, 10, "#ff6a8a", 0.35, 7);

  P.layer("vorgath", 0.6);
  // Vorgath on the upper landing, his oath-chains anchored in both walls
  const vx = CX, vg = 150;
  P.poly([[vx - 70, vg], [vx + 70, vg], [vx + 60, vg + 8], [vx - 60, vg + 8]], (x, y) => (y === vg ? hex("#5a3a4a") : hex("#1a0e18")));
  for (const [ax, ay, hx, hy, sag] of [[52, 70, vx - 26, vg - 20, 14], [26, 140, vx - 26, vg - 18, 8], [428, 64, vx + 26, vg - 20, 14], [454, 132, vx + 26, vg - 18, 8], [120, 0, vx - 12, vg - 46, 0], [360, 0, vx + 12, vg - 46, 0]]) {
    chain(P, ax, ay, hx, hy, { link: 4, c: "#4e4658", lit: "#9a90a8", dark: "#0a060c", sag });
    P.disc(ax, ay, 4, hex("#2a1a24")); P.ring(ax, ay, 4, 4, hex("#6a3a4a"));
  }
  P.glow(vx, vg - 50, 70, hex("#e11d48"), 0.35, 1.6);
  vorgath(P, vx, vg, 1.85, { freeChains: false });

  P.layer("ledge", 1);
  // foreground ledge: the champion and the Sovereign descending
  P.poly([[118, 244], [330, 236], [352, 270], [100, 270]], (x, y) => (y < 240 - (x - 118) * 0.04 + 1 ? hex("#6a3a52") : K.noise2(x * 0.2, y * 0.3, 5) > 0.6 ? hex("#1a0c16") : hex("#120812")));
  chain(P, 118, 236, 330, 228, { link: 3, c: "#4e4658", lit: "#9a90a8", sag: 6 });
  for (const x of [118, 224, 330]) P.rect(x - 1, 228 - (x - 118) * 0.04, 3, 12, hex("#2a1a24"));
  const hero = S.hero("knight", "up"), sov = S.npc("aurelia", "up");
  let [l, t] = stand(P, hero, 222, 252); rimLight(P, hero, l, t, "#ff6a8a", 1); rimLight(P, hero, l, t, "#ff6a8a", -1);
  [l, t] = stand(P, sov, 246, 254); rimLight(P, sov, l, t, "#ff6a8a", 1);
  P.glow(228, 236, 10, hex("#67e8f9"), 0.4, 2);

  P.layer("weather", 1.2, { skip: true });   // live HD particles replace the baked ones
  sparks(P, R, 160, { colors: ["#ff6a8a", "#ffc0d0", "#7dd3fc"], glowK: 0.2 });
  P.vignette([6, 0, 6], 0.55, 0.55);
  void shadeC;
}
