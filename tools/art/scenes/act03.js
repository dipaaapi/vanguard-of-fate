// Act III — The Five Disciplines & Earthbound Profiles
// The Barracks Sanctuary at dusk: each of the five Earthbound veterans stands on the point of the
// Pentagram that glows in their discipline's colour, and the Novice waits at the star's heart.
export function paint(P, { R, K, S }) {
  const { hex, sky, clouds, stars, eclipse, ridgeFn, ridge, flagstones, runeCircle, brazier, stand, rimLight, POINT_COLORS, castle, sparks } = K;

  P.layer("sky", 0);
  sky(P, [[0, hex("#1b1440")], [0.45, hex("#5b3a7a")], [0.8, hex("#c26a6a")], [1, hex("#f2b36b")]], 0, 120, 3);
  stars(P, R, 50, { y1: 50 });
  eclipse(P, 92, 36, 9, { corona: "#a855f7", rim: "#fde68a", k: 0.8 });
  clouds(P, { y0: 30, y1: 90, cover: 0.58, seed: 14, colors: ["#3d2a5e", "#7a4a78", "#e39a7a"], stretch: 5 });
  P.layer("citadel", 0.15);
  // the Citadel far behind the walls
  const far = ridgeFn({ base: 104, amp: 10, freq: 0.01, seed: 2 });
  ridge(P, far, "#3a2b52");
  castle(P, 380, 104, { scale: 0.42, style: "imperial", seed: 4, glow: true });

  P.layer("walls", 0.4);
  // Barracks walls and timber buildings
  P.rect(0, 92, P.w, 40, hex("#4a3f52"));
  for (let x = 0; x < P.w; x += 6) P.rect(x, 88, 4, 4, hex("#4a3f52"));
  P.rectF(0, 92, P.w, 40, (x, y) => ((y - 92) % 7 === 6 || (x + Math.floor((y - 92) / 7) * 5) % 12 === 0 ? hex("#2f2836") : null));
  for (const [bx, bw] of [[10, 90], [380, 92]]) {
    P.rect(bx, 104, bw, 34, hex("#7a5a3c"));
    for (let i = 0; i < bw; i += 10) P.rect(bx + i, 104, 2, 34, hex("#4a3322"));
    P.rect(bx, 118, bw, 2, hex("#4a3322"));
    P.poly([[bx - 6, 106], [bx + bw / 2, 84], [bx + bw + 6, 106]], hex("#7a2c2c"));
    P.poly([[bx - 6, 106], [bx + bw / 2, 84], [bx + bw / 2, 106]], hex("#93403a"));
    for (let i = 0; i < 3; i++) { P.rect(bx + 14 + i * 28, 122, 6, 6, hex("#ffcf7a")); P.glow(bx + 17 + i * 28, 125, 10, hex("#ffb347"), 0.5, 2); }
  }
  P.layer("court", 0.8);
  // courtyard floor
  flagstones(P, 132, P.h, { c: "#4a4458", lit: "#5a5468", dark: "#3a3546", seam: "#272331", vx: 240 });

  // the star
  const pts = runeCircle(P, 240, 204, 170, 50, { c: "#fde68a", pointColors: POINT_COLORS, rings: 2, pillars: 30, glowK: 0.6 });
  // four perpetual braziers
  brazier(P, 40, 150, {}); brazier(P, 440, 150, {});
  brazier(P, 20, 262, {}); brazier(P, 460, 262, {});

  // veterans on their points: Shield, Bow, Prayer, Star, Fist (clockwise from the top)
  const who = ["arthur", "lyra", "julian", "sam", "renzo"];
  const order = pts.map((p, i) => [p, i]).sort((a, b) => a[0][1] - b[0][1]);
  const heroFrame = S.hero("novice", "up");
  let heroDrawn = false;
  for (const [[x, y], i] of order) {
    if (!heroDrawn && y > 204) { stand(P, heroFrame, 240, 210); heroDrawn = true; }
    const f = S.npc(who[i], "down");
    const [l, t] = stand(P, f, x, y + 2);
    rimLight(P, f, l, t, POINT_COLORS[i], x < 240 ? -1 : 1);
  }
  if (!heroDrawn) stand(P, heroFrame, 240, 210);
  P.glow(240, 196, 22, hex("#fff7d6"), 0.5, 2);
  P.layer("weather", 1.2, { skip: true });   // live HD particles replace the baked ones
  sparks(P, R, 60, { y0: 140, y1: 250, colors: ["#fde68a", "#ffffff"], glowK: 0.2 });
  P.vignette([8, 4, 14], 0.5, 0.62);
}
