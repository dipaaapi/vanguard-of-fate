// Act VII — The Corrupted Sylvan Frontier & The Elven Sanctuary
// Deep in the Whispering Canopy: ironwood trees weep black sap, spore clouds drift between glowing
// mushrooms, and Malakor the Blight Herald rises over the heartwood grove as the Vanguard arrives.
export function paint(P, { R, K, S }) {
  const { hex, mixC, sky, fogBand, ridge, groundTex, bigTrunk, mushroom, oak, stand, rimLight, sparks, deadTree } = K;

  // gloom: purple-green canopy light
  sky(P, [[0, hex("#0d1a14")], [0.4, hex("#1d2e2a")], [0.75, hex("#3a2e4a")], [1, hex("#5b3a6a")]], 0, 190, 3);
  // shafts of sickly light through the canopy
  K.rays(P, 250, -40, 6, "#b8f5a0", { start: Math.PI * 0.35, spread: Math.PI * 0.3, len: 300, k: 0.12, width: 0.03 });
  // back rows of trees, lighter with fog
  for (const [x, w, c, d] of [[40, 14, "#2b3a3a", "#1f2a2c"], [120, 10, "#2b3a3a", "#1f2a2c"], [330, 12, "#2b3a3a", "#1f2a2c"], [420, 16, "#2b3a3a", "#1f2a2c"], [200, 8, "#34424a", "#283238"], [290, 8, "#34424a", "#283238"]])
    bigTrunk(P, x, w, { c, lit: mixC(hex(c), [120, 140, 130], 0.2).map(Math.round).reduce((s, v) => s + v.toString(16).padStart(2, "0"), "#"), dark: d, seed: x, bottom: 180 });
  fogBand(P, 150, 30, "#4a5a5a", 0.45, 7);
  // hanging vines
  for (let i = 0; i < 26; i++) { const x = R.range(0, P.w), len = R.range(20, 90); for (let y = 0; y < len; y++) P.set(x + Math.sin(y * 0.15 + i) * 1.5, y, hex(R.pick(["#1f3a2a", "#2d4f34"]))); }

  // the heartwood grove floor
  const ground = (x) => 178 + K.fbm1(x * 0.02, 4) * 8;
  ridge(P, ground, groundTex(["#5a7a4a", "#3b4f36", "#2e3f2e", "#232f26", "#1a231e"], { seed: 7, depth: 70 }));
  // corruption: black sap pools and violet veins
  for (let i = 0; i < 18; i++) { const x = R.range(60, 420), y = R.range(190, 260); P.ellipse(x, y, R.range(6, 16), R.range(2, 4), hex("#140b18")); P.ellipse(x - 1, y - 1, 3, 1, hex("#3a1a4a")); }

  // Malakor, with its blighted heartstone burning
  P.glow(240, 120, 90, hex("#a855f7"), 0.35, 1.4);
  const mal = S.boss("malakor", "down", "idle", 1);
  stand(P, mal, 240, 184, { shadow: true });
  P.glow(240, 138, 18, hex("#ff3b5c"), 0.8, 1.8);
  // explosive sporelings at its roots
  for (const [x, y] of [[196, 190], [288, 192], [170, 200], [316, 202]]) stand(P, S.monster("sporeling", "down"), x, y);
  // spore cloud
  for (let i = 0; i < 500; i++) { const x = R.range(120, 360), y = R.range(60, 200); if (K.fbm(x * 0.04, y * 0.04, 4, 3) > 0.56) P.set(x, y, hex(R.pick(["#b8f5a0", "#86efac", "#d9f99d"])), 0.5); }

  // glowing mushrooms and foreground trunks
  for (const [x, y, s, c] of [[60, 236, 5, "#22d3ee"], [80, 246, 3, "#22d3ee"], [400, 240, 6, "#a3e635"], [430, 252, 4, "#22d3ee"], [140, 258, 3, "#e879f9"], [350, 262, 4, "#e879f9"]]) mushroom(P, x, y, s, { cap: c });
  bigTrunk(P, 8, 26, { c: "#24170f", lit: "#3a2618", dark: "#0e0906", sap: "#06030a", seed: 1 });
  bigTrunk(P, 470, 30, { c: "#24170f", lit: "#3a2618", dark: "#0e0906", sap: "#06030a", seed: 6 });

  // the Vanguard: hero, the Crown Heir casting cover fire, and Lyra
  const hero = S.hero("knight", "up");
  let [l, t] = stand(P, hero, 236, 252);
  rimLight(P, hero, l, t, "#e9d5ff", 1);
  const heir = S.npc("aurelia", "up", "attack", 1);
  [l, t] = stand(P, heir, 200, 262);
  P.glow(200, 236, 12, hex("#67e8f9"), 0.7, 2);
  stand(P, S.npc("lyra", "up"), 276, 262);
  sparks(P, R, 50, { y0: 40, y1: 250, colors: ["#d9f99d", "#22d3ee"], glowK: 0.3 });
  P.vignette([4, 8, 6], 0.6, 0.55);
}
