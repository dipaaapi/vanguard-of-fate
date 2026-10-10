// Prologue cinema · Waking in the Barracks Sanctuary (layered set for js/cinema/)
// Morning in the consecrated courtyard: blue sky, the Citadel's towers beyond the walls, timber
// longhouses, the runic cobblestones round the Pentagram, four perpetual braziers and the cot where
// the hero wakes. Ronald, Edgar, the hero and the summoner are drawn live.
export function paint(P, { R, K }) {
  const { hex, sky, clouds, ridgeFn, ridge, castle, flagstones, runeCircle, brazier, POINT_COLORS } = K;

  P.layer("sky", 0);
  sky(P, [[0, hex("#3f7fd0")], [1, hex("#c4e2fa")]], 0, 120, 3);
  clouds(P, { y0: 8, y1: 84, cover: 0.55, seed: 3, colors: ["#9ac0e8", "#d8e8f8", "#ffffff"], stretch: 4 });
  P.layer("citadel", 0.15);
  ridge(P, ridgeFn({ base: 104, amp: 16, freq: 0.012, seed: 2 }), "#6aa25a", { light: "#8ac46a" });
  castle(P, 360, 102, { scale: 0.5, style: "imperial", seed: 2 });

  P.layer("walls", 0.45);
  P.rect(0, 94, P.w, 38, hex("#a89a84"));
  for (let x = 0; x < P.w; x += 6) P.rect(x, 90, 4, 4, hex("#a89a84"));
  P.rectF(0, 94, P.w, 38, (x, y) => ((y - 94) % 7 === 6 || (x + Math.floor((y - 94) / 7) * 5) % 12 === 0 ? hex("#7a6e5c") : null));
  for (const [bx, bw] of [[6, 96], [378, 96]]) {
    P.rect(bx, 102, bw, 32, hex("#7a5a3c"));
    for (let i = 0; i < bw; i += 10) P.rect(bx + i, 102, 2, 32, hex("#4a3322"));
    P.rect(bx, 116, bw, 2, hex("#4a3322"));
    P.poly([[bx - 6, 104], [bx + bw / 2, 82], [bx + bw + 6, 104]], hex("#8a3a32"));
    P.poly([[bx - 6, 104], [bx + bw / 2, 82], [bx + bw / 2, 104]], hex("#a24a3e"));
  }
  for (const x of [120, 240, 360]) { P.rect(x - 8, 100, 16, 26, hex("#8a2c2c")); P.rect(x - 2, 108, 4, 4, hex("#ffd166")); }

  P.layer("court", 0.85);
  flagstones(P, 132, P.h, { c: "#9a8e7c", lit: "#b0a490", dark: "#867a6a", seam: "#5a5044", vx: 240 });
  runeCircle(P, 240, 196, 160, 46, { c: "#fde68a", pointColors: POINT_COLORS, rings: 1, glowK: 0.25 });
  for (const [x, y] of [[40, 150], [440, 150]]) brazier(P, x, y, {});
  // the cot
  P.rect(150, 176, 64, 12, hex("#5e3b1a")); P.rect(152, 186, 3, 8, hex("#3a2410")); P.rect(209, 186, 3, 8, hex("#3a2410"));
  P.rect(152, 172, 60, 6, hex("#e8e2d0")); P.rect(198, 168, 13, 6, hex("#d4cbb4"));
  P.rect(152, 176, 40, 4, hex("#6a7aa8"));

  P.layer("braziers", 1.3);
  for (const [x, y] of [[22, 266], [458, 266]]) brazier(P, x, y, { size: 1.6 });
  void R;
}
