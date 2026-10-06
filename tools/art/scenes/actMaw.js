// Act XV — The Heart of the Abyss & The Sovereign Dawn (was Act XII before Book I grew to 15 Acts)
// The Maw of Damnation: on the floating obsidian platform the champion and the Sovereign stand as
// Satan's colossal form crumbles into ash, the Lantern Knight's light rises out of the vortex, and
// the five points of the Pentagram Seal blaze across the sky.
export function paint(P, { R, K, S }) {
  const { hex, mixC, sky, vortex, demonColossus, stand, rimLight, sparks, rays, POINT_COLORS, starShape } = K;

  sky(P, [[0, hex("#06020c")], [0.5, hex("#1e0a34")], [1, hex("#3b0f5c")]], 0, P.h, 3);
  // dawn breaking at the top edge: gold rays through a tear in the dark
  rays(P, 240, -20, 14, "#ffe9a8", { start: Math.PI * 0.12, spread: Math.PI * 0.76, len: 220, k: 0.16, width: 0.03, seed: 4 });
  vortex(P, 240, 238, 300, 60, { colors: ["#0a0214", "#2a0a48", "#5b1a8c", "#a855f7", "#f5d0fe"], arms: 5, twist: 2.6, seed: 9 });

  P.wash(240, 120, 230, 120, hex("#6b2aa0"), 0.75);
  // Satan's true form, coming apart
  demonColossus(P, 240, 110, 1.15, { dissolve: 0.55, seed: 3 });
  // the pentagram in the sky
  const pts = [];
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * Math.PI * 2) / 5; pts.push([240 + Math.cos(a) * 92, 92 + Math.sin(a) * 70]); }
  for (let i = 0; i < 5; i++) { const a = pts[i], b = pts[(i + 2) % 5]; P.line(a[0], a[1], b[0], b[1], hex("#fff3c4"), 0.55); }
  pts.forEach(([x, y], i) => { P.glow(x, y, 18, hex(POINT_COLORS[i]), 0.95, 1.6); starShape(P, x, y, 4, hex("#ffffff")); });

  // the lantern rising from where the heart was
  P.glow(240, 132, 44, hex("#ffd27a"), 0.9, 1.5);
  P.rect(237, 125, 6, 9, hex("#fff7d6")); P.rect(236, 124, 8, 2, hex("#c9963a")); P.rect(236, 134, 8, 2, hex("#c9963a"));
  P.vline(240, 120, 124, hex("#c9963a")); P.set(239, 119, hex("#c9963a")); P.set(241, 119, hex("#c9963a"));
  K.beam(P, 240, 136, 214, 3, "#ffd27a", 0.55);

  // the floating platform of shattered obsidian
  P.poly([[150, 214], [330, 214], [314, 226], [270, 246], [214, 248], [168, 228]], (x, y) => (y < 217 ? hex("#5a4a6a") : K.noise2(x * 0.2, y * 0.3, 2) > 0.62 ? hex("#2a2036") : hex("#1a1424")));
  P.ellipse(240, 214, 90, 6, hex("#3a2e4a"));
  for (let i = 0; i < 12; i++) { const x = R.range(110, 370), y = R.range(222, 262); P.poly([[x, y], [x + 6, y - 2], [x + 9, y + 3], [x + 2, y + 6]], hex("#1a1424")); P.hline(x, x + 5, y, hex("#5a4a6a")); }
  P.ring(240, 214, 70, 5, hex("#a855f7"));
  const hero = S.hero("knight", "up"), sov = S.npc("aurelia", "up", "attack", 1);
  let [l, t] = stand(P, hero, 232, 216); rimLight(P, hero, l, t, "#ffd27a", 1); rimLight(P, hero, l, t, "#ffd27a", -1);
  [l, t] = stand(P, sov, 254, 216); rimLight(P, sov, l, t, "#ffd27a", 1);
  sparks(P, R, 200, { colors: ["#f5d0fe", "#ffd27a", "#ffffff"], glowK: 0.2 });
  P.vignette([4, 0, 8], 0.5, 0.6);
}
