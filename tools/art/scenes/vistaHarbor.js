// Vista — Crossing to the Dark Continent
// With all four Seal Stones set, the Celestial Monolith opens over the sea; the Vanguard's fleet
// sails through the ring of light toward the black cliffs and the Obsidian Harbor beyond.
export function paint(P, { R, K }) {
  const { hex, sky, clouds, water, vortex, ridgeFn, ridge, flag, sparks } = K;
  sky(P, [[0, hex("#06081a")], [0.5, hex("#1a1440")], [1, hex("#4a1a3a")]], 0, 170, 3);
  clouds(P, { y0: 20, y1: 120, cover: 0.5, seed: 17, colors: ["#120c2a", "#2a1a4a", "#5a2a5a"], stretch: 4 });
  // black cliffs of the Dark Continent on the right, the harbor's red lights
  const cl = ridgeFn({ base: 172, amp: 70, freq: 0.02, seed: 3, sharp: 0.85 });
  ridge(P, (x) => (x > 300 ? cl(x) + Math.max(0, 340 - x) : 400), "#0e0a14", { light: "#1e1428" });
  for (let i = 0; i < 18; i++) { const x = R.range(330, 480), y = R.range(150, 172); P.set(x, y, hex("#ff4d2e")); P.glow(x, y, 4, hex("#ff4d2e"), 0.4, 2); }
  water(P, 170, P.h, { deep: "#050816", mid: "#0f1a3a", light: "#2a4a7a", foam: "#a5f3fc", seed: 4, reflect: "#67e8f9", reflectX: 170, reflectW: 30 });
  // the monolith and its ring of light
  P.poly([[164, 172], [167, 80], [170, 74], [173, 80], [176, 172]], (x) => (x < 170 ? hex("#4a6080") : hex("#1c2a40")));
  for (const [y, c] of [[96, "#22a855"], [112, "#1e7ab8"], [128, "#7cc4ec"], [144, "#d9541a"]]) { P.disc(170, y, 2, hex(c)); P.glow(170, y, 7, hex(c), 0.8, 2); }
  vortex(P, 170, 124, 64, 60, { colors: ["#04101e", "#0b3a5a", "#1e7aaa", "#67e8f9", "#e0f2fe"], arms: 4, twist: 1.5, seed: 2 });
  P.ring(170, 124, 64, 60, hex("#a5f3fc")); P.ring(170, 124, 66, 62, hex("#67e8f9"));
  P.glow(170, 124, 100, hex("#38bdf8"), 0.35, 1.4);
  // the fleet
  for (const [x, y, s] of [[110, 216, 1.2], [230, 226, 1.4], [300, 204, 0.8], [60, 200, 0.7], [380, 236, 1.6]]) {
    const w = 34 * s;
    P.poly([[x - w / 2, y], [x + w / 2, y], [x + w / 2 - 5 * s, y + 7 * s], [x - w / 2 + 5 * s, y + 7 * s]], hex("#2a1a10"));
    P.vline(x, y - 28 * s, y, hex("#1a120a"));
    P.poly([[x + 1, y - 26 * s], [x + 15 * s, y - 16 * s], [x + 1, y - 6 * s]], hex("#b91c1c"));
    P.poly([[x + 1, y - 26 * s], [x + 7 * s, y - 21 * s], [x + 1, y - 15 * s]], hex("#e0b84a"));
    flag(P, x, y - 28 * s, hex("#e0b84a"), R);
    P.set(x - w / 2 + 3, y - 2, hex("#ffcf7a")); P.glow(x - w / 2 + 3, y - 2, 4, hex("#ffcf7a"), 0.5, 2);
  }
  sparks(P, R, 120, { x0: 100, x1: 240, y0: 60, y1: 190, colors: ["#a5f3fc", "#ffffff"], glowK: 0.3 });
  P.vignette([2, 2, 8], 0.55, 0.6);
}
