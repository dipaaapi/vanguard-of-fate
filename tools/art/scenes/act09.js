// Act IX — The Frostfang Precipice & The Shivering Siege
// A blizzard over the Frostfang range: the ice spire of Glacial Crest towers over the pass where
// Frost Empress Cryonix waits, and the Vanguard climbs the ledge past a heat brazier.
export function paint(P, { R, K, S }) {
  const { hex, sky, clouds, ridgeFn, ridge, fogBand, pine, stand, rimLight, brazier, crystal, groundTex, eclipse } = K;

  sky(P, [[0, hex("#1a2438")], [0.5, hex("#3d5272")], [1, hex("#9fb4cc")]], 0, 170, 3);
  P.glow(130, 40, 60, hex("#dbeafe"), 0.35, 1.5);
  clouds(P, { y0: 0, y1: 80, cover: 0.45, seed: 41, colors: ["#2a3650", "#4a5c7c", "#8ea2bf"], stretch: 3 });
  const far = ridgeFn({ base: 150, amp: 80, freq: 0.012, seed: 12, sharp: 0.8 });
  ridge(P, far, "#5a6e8c", { light: "#a8bad2", snow: "#e8f0fa", snowLine: 130 });
  fogBand(P, 140, 14, "#b8c8dc", 0.55, 3);
  // Glacial Crest: the ice spire with its fortress
  P.glow(320, 70, 50, hex("#7dd3fc"), 0.4, 1.5);
  P.poly([[300, 160], [314, 70], [320, 22], [326, 70], [342, 160]], (x, y) => (x < 316 ? hex("#e0f2fe") : x < 324 ? hex("#93c5fd") : hex("#4a7ab0")));
  for (const [x, h] of [[296, 50], [346, 44], [288, 30], [354, 26]]) crystal(P, x, 162, h, { c: "#7dd3fc", lit: "#f0f9ff", dark: "#3b6fa8", glowK: 0.3 });
  const mid = ridgeFn({ base: 176, amp: 30, freq: 0.016, seed: 5, sharp: 0.5 });
  ridge(P, mid, "#7f92ae", { light: "#c9d6e8", snow: "#f1f5fb", snowLine: 175 });
  for (let i = 0; i < 26; i++) { const x = R.range(0, P.w); pine(P, x, mid(x) + 6, R.int(10, 18), { c: "#2c4a52", lit: "#3c5e66", dark: "#1c3238", snow: "#e8f0fa" }); }

  // Cryonix on the pass, guarded by ice golems
  stand(P, S.boss("cryonix", "down"), 300, 196);
  P.glow(300, 176, 26, hex("#bae6fd"), 0.5, 1.8);
  stand(P, S.monster("iceGolem", "down"), 262, 200); stand(P, S.monster("iceGolem", "down"), 340, 202);
  stand(P, S.monster("wyvern", "side"), 120, 90, { shadow: false }); stand(P, S.monster("wyvern", "side"), 160, 70, { shadow: false, flip: true });

  // the ledge in the foreground
  const ledge = (x) => 214 + (x < 200 ? (200 - x) * 0.18 : 0) + K.fbm1(x * 0.05, 9) * 6;
  ridge(P, ledge, groundTex(["#ffffff", "#e8f0fa", "#c9d6e8", "#9fb0c8", "#7a8ca8"], { seed: 9, depth: 50, strokes: false }));
  brazier(P, 80, Math.round(ledge(80)) + 2, {});
  const party = [["knight", 150], ["priestNpc", 178], ["aurelia", 200]];
  for (const [who, x] of party) {
    const f = who === "knight" ? S.hero("knight", "side") : who === "aurelia" ? S.npc("aurelia", "side") : S.npc("julian", "side");
    const [l, t] = stand(P, f, x, Math.round(ledge(x)) + 1);
    rimLight(P, f, l, t, "#ffffff", -1);
  }
  pine(P, 440, 270, 60, { c: "#1c3238", lit: "#2c4a52", dark: "#101e22", snow: "#f1f5fb" });
  pine(P, 470, 276, 44, { c: "#1c3238", lit: "#2c4a52", dark: "#101e22", snow: "#f1f5fb" });
  // blizzard
  for (let i = 0; i < 900; i++) { const x = R.range(0, P.w), y = R.range(0, P.h); const big = R.chance(0.1); P.set(x, y, hex("#ffffff"), R.range(0.4, 0.9)); if (big) { P.set(x + 1, y, hex("#ffffff"), 0.6); P.set(x - 1, y + 1, hex("#ffffff"), 0.4); } }
  for (let i = 0; i < 120; i++) { const x = R.range(0, P.w), y = R.range(0, P.h); P.line(x, y, x + 6, y + 2, hex("#e8f0fa"), 0.4); }
  P.vignette([8, 14, 26], 0.5, 0.62);
}
