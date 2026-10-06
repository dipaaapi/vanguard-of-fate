// Vista — The Elven Sanctuary restored
// The purified heart of the Whispering Canopy at night: bioluminescent trees and tree-houses glow
// again, the elven matriarch waits by the moon pool and Lyra's falcon circles overhead.
export function paint(P, { R, K, S }) {
  const { hex, sky, stars, moon, oak, mushroom, water, stand, sparks, ridge, groundTex, bigTrunk } = K;
  sky(P, [[0, hex("#050b1a")], [1, hex("#14304a")]], 0, P.h, 3);
  stars(P, R, 160, { y1: 140 });
  moon(P, 240, 46, 16, { shadow: -0.1, glowC: "#a7f3d0" });
  for (const [x, r, s] of [[60, 34, 3], [150, 22, 9], [330, 24, 5], [420, 36, 7]]) oak(P, x, 190, r, { seed: s, leaves: ["#0f2a2a", "#17444a", "#22716a"], trunk: "#2a2a3a", glowDots: "#a7f3d0" });
  // tree-houses
  for (const [x, y] of [[60, 120], [420, 116]]) { P.rect(x - 12, y, 24, 14, hex("#4a3a5a")); P.poly([[x - 16, y], [x, y - 10], [x + 16, y]], hex("#2a6a5a")); P.rect(x - 3, y + 5, 5, 6, hex("#fde68a")); P.glow(x, y + 8, 14, hex("#fde68a"), 0.5, 2); }
  const gr = (x) => 190 + K.fbm1(x * 0.03, 2) * 4;
  ridge(P, gr, groundTex(["#3a7a6a", "#1f4a44", "#18403a", "#123230", "#0c2624"], { seed: 3, depth: 60 }));
  // moon pool
  P.ellipse(240, 222, 70, 14, hex("#0c2a3a"));
  P.ellipse(240, 222, 66, 12, hex("#1a4a6a"));
  P.ellipse(240, 220, 20, 3, hex("#dff7ef")); P.glow(240, 220, 30, hex("#a7f3d0"), 0.45, 1.6);
  for (const [x, y, c] of [[150, 240, "#22d3ee"], [170, 250, "#a3e635"], [320, 244, "#22d3ee"], [350, 254, "#e879f9"], [120, 258, "#a7f3d0"]]) mushroom(P, x, y, 4, { cap: c });
  stand(P, S.npc("elvenMatriarch", "down"), 196, 214);
  stand(P, S.npc("lyra", "down"), 290, 214);
  stand(P, S.monster("windFalcon", "side"), 300, 100, { shadow: false });
  bigTrunk(P, 6, 22, { c: "#141a24", lit: "#1e2838", dark: "#0a0e14", seed: 3 });
  bigTrunk(P, 474, 24, { c: "#141a24", lit: "#1e2838", dark: "#0a0e14", seed: 8 });
  sparks(P, R, 140, { y0: 60, y1: 250, colors: ["#a7f3d0", "#fde68a", "#22d3ee"], glowK: 0.35 });
  void water;
  P.vignette([2, 6, 10], 0.5, 0.6);
}
