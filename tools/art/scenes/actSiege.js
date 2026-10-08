// Act XIII — The Siege of the Obsidian Citadel & The Broken Gates (was Act XI before Book I grew to 15 Acts)
// The Dark Continent: Satan's black basalt fortress under a blood-red sky. The Vanguard's ships
// crowd the Obsidian Harbor, the outer gates are breached, and shock troopers pour into the gap.
export function paint(P, { R, K, S }) {
  const { hex, sky, clouds, ridgeFn, ridge, castle, water, stand, rimLight, sparks, groundTex, eclipse, fogBand, flag } = K;

  sky(P, [[0, hex("#12030a")], [0.45, hex("#4a0a14")], [0.8, hex("#a3201e")], [1, hex("#e2582a")]], 0, 180, 3);
  eclipse(P, 240, 30, 10, { corona: "#ff3b3b", rim: "#ffb347", core: "#0a0204", k: 0.9 });
  clouds(P, { y0: 0, y1: 90, cover: 0.46, seed: 61, colors: ["#1a0508", "#3a0c12", "#7a1e1a"], stretch: 3 });
  // miasma-wreathed crags
  const far = ridgeFn({ base: 150, amp: 60, freq: 0.014, seed: 21, sharp: 0.85 });
  ridge(P, far, "#2a0a12", { light: "#4a1218" });
  fogBand(P, 140, 18, "#6a1a3a", 0.5, 8);
  // the Obsidian Citadel
  P.glow(240, 110, 120, hex("#ff3b3b"), 0.25, 1.4);
  castle(P, 240, 168, { scale: 1.45, style: "obsidian", seed: 13, glow: true });
  // the breached gate: fire and rubble
  P.glow(240, 160, 26, hex("#ff7a1a"), 0.8, 1.6);
  for (let i = 0; i < 40; i++) { const x = 240 + R.range(-14, 14), y = 168 - R.range(0, 18) * R(); P.set(x, y, hex(R.pick(["#ffe08a", "#ff7a1a", "#c2301a"]))); }
  for (let i = 0; i < 14; i++) K.rock(P, 222 + R.range(0, 36), 172 + R.range(0, 6), R.int(3, 7), R.int(2, 5), { c: "#2a1a1e", lit: "#4a2a2e", dark: "#120a0c", seed: i });
  // smoke columns
  for (const sx of [160, 300, 352]) for (let s = 0; s < 70; s++) { const y = 150 - s * 1.6, x = sx + Math.sin(s * 0.2) * 4 + s * 0.4; P.disc(x, y, 2 + s * 0.08, hex("#1a1012"), 0.5); }

  // the harbor
  P.rect(0, 172, P.w, 10, hex("#1c1014"));
  water(P, 180, 228, { deep: "#1a0610", mid: "#3a0e18", light: "#8a2a24", foam: "#ffb38a", seed: 3, reflect: "#ff7a1a", reflectX: 240, reflectW: 12 });
  // Vanguard ships with crimson-and-gold sails
  for (const [x, y, s] of [[60, 206, 1], [120, 198, 0.75], [400, 210, 1.1], [446, 196, 0.7]]) {
    const w = 34 * s;
    P.poly([[x - w / 2, y], [x + w / 2, y], [x + w / 2 - 5 * s, y + 7 * s], [x - w / 2 + 5 * s, y + 7 * s]], hex("#3a2216"));
    P.hline(x - w / 2, x + w / 2, y, hex("#6a4426"));
    P.vline(x, y - 26 * s, y, hex("#2a1a10"));
    P.poly([[x + 1, y - 24 * s], [x + 14 * s, y - 16 * s], [x + 1, y - 6 * s]], hex("#b91c1c"));
    P.poly([[x + 1, y - 24 * s], [x + 7 * s, y - 20 * s], [x + 1, y - 14 * s]], hex("#e0b84a"));
    flag(P, x, y - 26 * s, hex("#e0b84a"), R);
  }
  // the shore before the gate
  const shore = (x) => 230 + K.fbm1(x * 0.03, 6) * 6;
  ridge(P, shore, groundTex(["#5a3a3e", "#3a2228", "#2c1a20", "#20121a", "#160c12"], { seed: 4, depth: 40 }));
  // shock troopers vs the Vanguard
  for (const [x, y] of [[300, 238], [324, 246], [350, 236], [372, 250], [396, 240]]) stand(P, S.monster("shockTrooper", "side"), x, y, { flip: true });
  for (const [f, x, y] of [[S.hero("knight", "side", "attack", 1), 250, 248], [S.npc("aurelia", "side", "attack", 1), 222, 256], [S.npc("ronald", "side"), 196, 244], [S.npc("royalGuard", "side"), 172, 254], [S.npc("royalGuard", "side"), 150, 246], [S.npc("arthur", "side"), 128, 258]]) {
    const [l, t] = stand(P, f, x, y); rimLight(P, f, l, t, "#ffb347", 1);
  }
  P.glow(232, 232, 12, hex("#67e8f9"), 0.6, 2);
  sparks(P, R, 140, { colors: ["#ffb347", "#ff3b3b", "#ffe08a"], glowK: 0.25 });
  P.vignette([10, 0, 4], 0.6, 0.58);
}
