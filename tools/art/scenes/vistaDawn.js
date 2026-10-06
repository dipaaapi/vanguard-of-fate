// Vista — The Sovereign Dawn
// After the war: a true dawn over the reborn plains, the Citadel shining, and the Celestial Portal
// open home to Earth. The champion and the Sovereign stand hand in hand on the hill and stay.
export function paint(P, { R, K, S }) {
  const { hex, sky, sun, clouds, ridgeFn, ridge, castle, fogBand, oak, stand, rimLight, groundTex, vortex, POINT_COLORS, sparks } = K;
  sky(P, [[0, hex("#3a6ab8")], [0.5, hex("#8ab0e0")], [0.8, hex("#f2c48a")], [1, hex("#ffe9b8")]], 0, 170, 3);
  sun(P, 300, 138, 14, { k: 1.1 });
  K.rays(P, 300, 138, 16, "#fff3c4", { len: 360, k: 0.14, width: 0.03 });
  clouds(P, { y0: 20, y1: 110, cover: 0.58, seed: 7, colors: ["#c08a9a", "#f2c4a8", "#fff3dc"], stretch: 4, light: 1 });
  // faint pentagram fading in the morning sky
  const pts = []; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * Math.PI * 2) / 5; pts.push([240 + Math.cos(a) * 60, 64 + Math.sin(a) * 44]); }
  pts.forEach(([x, y], i) => P.glow(x, y, 10, hex(POINT_COLORS[i]), 0.5, 1.8));
  const far = ridgeFn({ base: 150, amp: 34, freq: 0.012, seed: 9, sharp: 0.5 });
  ridge(P, far, "#8a9ac8", { light: "#c8d0ec", snow: "#ffffff", snowLine: 128 });
  fogBand(P, 152, 8, "#f2d8c4", 0.5, 2);
  const mid = ridgeFn({ base: 172, amp: 16, freq: 0.01, seed: 4 });
  ridge(P, mid, groundTex(["#c8e08a", "#9cc86a", "#86b858", "#72a24c", "#5e8e42"], { seed: 4, depth: 40, strokes: false }));
  castle(P, 150, mid(150) + 3, { scale: 0.6, style: "imperial", seed: 5 });
  // the open portal home on the far hill
  vortex(P, 400, mid(400) - 18, 12, 18, { colors: ["#1e3a6a", "#3a6ab8", "#8ac0f0", "#e0f2fe", "#ffffff"], arms: 3, twist: 1.2, seed: 1 });
  P.ring(400, mid(400) - 18, 13, 19, hex("#e0b84a")); P.glow(400, mid(400) - 18, 26, hex("#bae6fd"), 0.6, 1.6);
  const near = (x) => 222 - Math.max(0, 24 - Math.abs(x - 250) * 0.12);
  ridge(P, near, groundTex(["#d8ee9a", "#a8d06a", "#8cbc58", "#76a84a", "#5e9040"], { seed: 9, depth: 50 }));
  for (let i = 0; i < 70; i++) { const x = R.range(0, P.w), y = R.range(near(x) + 4, 268); P.set(x, y, hex(R.pick(["#fde68a", "#f9a8d4", "#ffffff", "#c4b5fd"]))); }
  oak(P, 40, 262, 26, { seed: 2 }); oak(P, 448, 266, 22, { seed: 6 });
  const hero = S.hero("knight", "down"), sov = S.npc("aurelia", "down");
  let [l, t] = stand(P, hero, 240, Math.round(near(240)) + 1); rimLight(P, hero, l, t, "#fff3c4", 1);
  [l, t] = stand(P, sov, 258, Math.round(near(258)) + 1); rimLight(P, sov, l, t, "#fff3c4", 1);
  P.rect(248, Math.round(near(248)) - 14, 3, 2, hex("#f1c27d"));   // hands joined
  sparks(P, R, 40, { colors: ["#fff3c4", "#ffffff"], glowK: 0.2 });
  P.vignette([40, 24, 10], 0.3, 0.7);
}
