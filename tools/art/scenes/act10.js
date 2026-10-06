// Act X — The Ashfall Wastelands & The Hellforge
// Under a soot-black sky, rivers of brimstone feed the Hellforge's crucible; Ignis the Iron Lord
// raises his hammer on the basalt platform as the Vanguard crosses the chained bridge.
export function paint(P, { R, K, S }) {
  const { hex, sky, clouds, ridgeFn, ridge, lavaFlow, stand, rimLight, sparks, groundTex, rock } = K;

  sky(P, [[0, hex("#0d0606")], [0.5, hex("#2a0e0a")], [0.85, hex("#6a1e10")], [1, hex("#c2441a")]], 0, 170, 3);
  clouds(P, { y0: 0, y1: 100, cover: 0.42, seed: 51, colors: ["#120808", "#2a1410", "#5a2a1a"], stretch: 3 });
  // erupting volcano
  const vol = (x) => 150 - Math.max(0, 70 - Math.abs(x - 90) * 0.9) + K.fbm1(x * 0.05, 3) * 6;
  ridge(P, vol, "#2a1414", { light: "#4a2018" });
  P.glow(90, 82, 40, hex("#ff7a1a"), 0.7, 1.6);
  lavaFlow(P, [[88, 84], [84, 110], [92, 132], [86, 150]], 2);
  for (let i = 0; i < 60; i++) { const a = R.range(-2.6, -0.5), d = R.range(10, 60); P.set(90 + Math.cos(a) * d, 80 + Math.sin(a) * d, hex(R.pick(["#ffb347", "#ff5a1a"]))); }
  const far = ridgeFn({ base: 160, amp: 24, freq: 0.02, seed: 7, sharp: 0.6 });
  ridge(P, (x) => (x > 150 ? far(x) : 400), "#2a1212", { light: "#3e1a14" });

  // the Hellforge: black citadel of furnaces
  for (const [x, w, h] of [[300, 40, 70], [344, 26, 96], [374, 34, 60], [410, 22, 80]]) {
    P.rect(x, 170 - h, w, h, hex("#1a0e0e"));
    P.rect(x, 170 - h, 3, h, hex("#2e1814"));
    for (let i = 0; i < 4; i++) P.rect(x + 6 + (i * 9) % (w - 8), 176 - h + i * 12, 3, 4, hex("#ff7a1a"));
    P.poly([[x - 2, 170 - h], [x + w / 2, 170 - h - w * 0.8], [x + w + 2, 170 - h]], (px) => (px < x + w / 2 ? hex("#2e1814") : hex("#120808")));
    for (let k = 0; k < w; k += 5) P.poly([[x + k, 170 - h + 2], [x + k + 2, 170 - h + 8], [x + k + 4, 170 - h + 2]], hex("#120808"));
    for (let s = 0; s < 30; s++) P.set(x + w / 2 + R.range(-4, 4) + s * 0.3, 160 - h - w * 0.8 - s * 2, hex("#3a2a2a"), 0.6);
  }
  // the great furnace mouth
  P.rect(330, 120, 50, 52, hex("#1a0e0e"));
  P.disc(355, 140, 16, hex("#ff7a1a")); P.rect(339, 140, 32, 32, hex("#ff7a1a"));
  P.disc(355, 142, 11, hex("#ffe08a")); P.rect(344, 142, 22, 30, hex("#ffe08a"));
  for (let k = 0; k < 5; k++) P.vline(343 + k * 6, 126, 172, hex("#2a1410"));
  P.glow(355, 150, 70, hex("#ff5a1a"), 0.5, 1.4);
  // lava lake
  P.rectF(0, 172, P.w, 98, (x, y) => {
    const v = K.fbm(x * 0.04, y * 0.1, 5, 4);
    const vein = Math.abs(K.fbm(x * 0.03, y * 0.08, 9, 3) - 0.5) < 0.025;
    if (vein || v > 0.68) return hex("#ffe08a");
    if (v > 0.6) return hex("#ff8a1a");
    if (v > 0.54) return hex("#c2301a");
    return K.noise2(x * 0.3, y * 0.5, 3) > 0.7 ? hex("#3a1410") : hex("#240c0a");
  });
  // basalt platforms
  const plat = (x0, x1, y) => { for (let x = x0; x < x1; x++) { const top = y + K.fbm1(x * 0.1, x0) * 3; for (let j = top; j < y + 16; j++) P.set(x, j, j - top < 1 ? hex("#5a3a32") : K.noise2(x * 0.3, j * 0.3, 2) > 0.6 ? hex("#2a1a18") : hex("#1c1210")); } };
  plat(250, 400, 198);
  plat(0, 170, 236);
  // chained bridge between
  for (let x = 170; x < 252; x += 3) { const y = Math.round(238 - (x - 170) * 0.46 + Math.sin(((x - 170) / 82) * Math.PI) * 4); P.rect(x, y, 2, 2, hex("#4a2e22")); }
  P.line(170, 228, 252, 190, hex("#6b6b72")); P.line(170, 240, 252, 202, hex("#6b6b72"));

  // Ignis the Iron Lord
  P.glow(326, 180, 34, hex("#ff7a1a"), 0.5, 1.6);
  stand(P, S.boss("ignis", "down", "attack", 0), 326, 202);
  stand(P, S.monster("demonKnight", "down"), 286, 204); stand(P, S.monster("obsidianGolem", "down"), 372, 206);
  stand(P, S.monster("magmaDrake", "side"), 430, 120, { shadow: false, flip: true });
  // the Vanguard
  const party = [[S.hero("knight", "side"), 120], [S.npc("renzo", "side"), 92], [S.npc("aurelia", "side"), 66]];
  for (const [f, x] of party) { const [l, t] = stand(P, f, x, 240); rimLight(P, f, l, t, "#ffb347", 1); }
  rock(P, 20, 270, 40, 26, { c: "#1c1210", lit: "#3a2420", dark: "#0a0606" });
  rock(P, 452, 272, 60, 40, { c: "#1c1210", lit: "#3a2420", dark: "#0a0606" });
  // falling embers and ash
  sparks(P, R, 160, { colors: ["#ffb347", "#ff7a1a", "#ffe08a"], glowK: 0.3 });
  for (let i = 0; i < 300; i++) P.set(R.range(0, P.w), R.range(0, P.h), hex("#5a4a48"), 0.6);
  P.vignette([8, 2, 2], 0.6, 0.58);
}
