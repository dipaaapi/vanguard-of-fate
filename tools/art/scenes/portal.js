// Portal — The Pentagram Gate
// The summoning gate in the ruined sanctum above the sea: a ring of carved stone holding the
// Pentagram Seal, its five points lit, swirling with the light that carries souls across the veil.
// Used behind the Character Creator and the hero select / Job Awakening screens.
export function paint(P, { R, K }) {
  const { hex, sky, stars, moon, clouds, water, ridgeFn, ridge, vortex, runeCircle, POINT_COLORS, pillar, brazier, sparks, groundTex } = K;
  sky(P, [[0, hex("#050816")], [0.6, hex("#14204a")], [1, hex("#2a3a72")]], 0, 170, 3);
  stars(P, R, 200, { y1: 150 });
  moon(P, 400, 46, 14, { shadow: 0.55 });
  clouds(P, { y0: 100, y1: 160, cover: 0.6, seed: 81, colors: ["#111a3a", "#22305e", "#3e508a"], stretch: 6 });
  water(P, 156, 200, { deep: "#060c22", mid: "#0f1c44", light: "#2a3f78", foam: "#9fb6e8", seed: 6, reflect: "#dbeafe", reflectX: 400, reflectW: 10 });
  const far = ridgeFn({ base: 160, amp: 28, freq: 0.03, seed: 2, sharp: 0.6 });
  ridge(P, (x) => (x < 90 ? far(x) : 400), "#121a38");
  // ruined columns
  for (const [x, top] of [[40, 60], [100, 96], [362, 100], [420, 70]]) pillar(P, x, top, 210, 14, { c: "#4a5274", dark: "#2a3050", lit: "#7a84b0" });
  // floor
  const floor = (x) => 206 + K.fbm1(x * 0.05, 3) * 2;
  ridge(P, floor, groundTex(["#6a7298", "#3a4062", "#323858", "#282d48", "#1e2238"], { seed: 4, depth: 60, strokes: false }));
  for (let k = 0; k < 3; k++) { const w = 150 - k * 30, y = 214 + k * 0; P.rect(240 - w / 2, 204 - k * 5, w, 5, hex(k % 2 ? "#3a4062" : "#4a5274")); P.hline(240 - w / 2, 240 + w / 2 - 1, 204 - k * 5, hex("#8a94c0")); void y; }
  // the stone ring gate
  const cx = 240, cy = 118, r = 62;
  vortex(P, cx, cy, r - 6, r - 6, { colors: ["#06102a", "#123a6a", "#1e6a9a", "#67e8f9", "#e0f2fe"], arms: 3, twist: 1.8, seed: 3 });
  for (let k = 0; k < 9; k++) P.ring(cx, cy, r + 3 - k, r + 3 - k, hex(k < 2 || k > 6 ? "#2a3050" : k === 3 ? "#8a94c0" : "#5a6288"));
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; P.glow(cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1), 3, hex("#67e8f9"), 0.7, 2); }
  runeCircle(P, cx, cy, r - 10, r - 10, { c: "#a5f3fc", pointColors: POINT_COLORS, rings: 1, runes: false, glowK: 0.4 });
  P.glow(cx, cy, r * 1.6, hex("#38bdf8"), 0.3, 1.4);
  brazier(P, 150, 200, { flame: "#38bdf8", hot: "#e0f2fe" }); brazier(P, 330, 200, { flame: "#38bdf8", hot: "#e0f2fe" });
  sparks(P, R, 120, { x0: 150, x1: 330, y0: 40, y1: 200, colors: ["#a5f3fc", "#ffffff", "#67e8f9"], glowK: 0.25 });
  P.vignette([2, 2, 10], 0.55, 0.6);
}
