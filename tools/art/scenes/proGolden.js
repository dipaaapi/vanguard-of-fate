// Prologue cinema · The Golden Age (layered set for js/cinema/, no flat banner)
// Golden-hour Aethelgard: snowy peaks, the white Imperial Citadel on its hill, the four Celestial
// Gateways on the plains and a flowering meadow framed by oaks. The gateway beams, birds and
// pollen are animated by the shot (js/cinema/prologueShots.js).
export async function paint(P, { R, K, S }) {
  const { hex, sky, sun, clouds, ridgeFn, ridge, fogBand, oak, groundTex, crystal, rock } = K;

  P.layer("sky", 0);
  sky(P, [[0, hex("#2f4f9a")], [0.4, hex("#6d8fd0")], [0.72, hex("#e9a983")], [1, hex("#ffe0aa")]], 0, 180, 3);
  sun(P, 356, 112, 12, { c: "#fff7d6", glowC: "#ffb36b", k: 0.9 });
  clouds(P, { y0: 8, y1: 74, cover: 0.55, seed: 3, colors: ["#7a74a8", "#d2a2b4", "#ffe2c8"], stretch: 5 });
  clouds(P, { y0: 82, y1: 132, cover: 0.6, seed: 9, colors: ["#b8828e", "#f0ae8e", "#fff1d6"], stretch: 7 });

  P.layer("peaks", 0.12);
  const far = ridgeFn({ base: 152, amp: 54, freq: 0.012, seed: 4, sharp: 0.6 });
  ridge(P, far, "#7684bc", { light: "#aab6e4", snow: "#f6f4ff", snowLine: 118 });
  fogBand(P, 152, 8, "#f2c6b2", 0.55, 2);

  P.layer("citadel", 0.32);
  const hill = ridgeFn({ base: 174, amp: 14, freq: 0.008, seed: 21 });
  const crown = (x) => hill(x) - Math.max(0, 20 - Math.abs(x - 240) * 0.22);
  ridge(P, crown, groundTex(["#c6e08a", "#94c06a", "#76a456", "#5c8a48", "#4a7440"], { seed: 3, depth: 40, strokes: false }));
  P.blit(await S.zone("castle", 0, 210), 240 - 58, Math.round(crown(240)) + 3 - 76, { scale: 0.36 });
  fogBand(P, 178, 5, "#f6dcc0", 0.35, 7);

  P.layer("plains", 0.6);
  const plain = (x) => 196 + K.fbm1(x * 0.015, 6) * 6;
  ridge(P, plain, groundTex(["#cfe692", "#a6cc70", "#86b45a", "#6a9a4c", "#557e40"], { seed: 5, depth: 60 }));
  // the four Celestial Gateways: twin stone posts, a lintel and a sky crystal
  for (const [x, s] of [[62, 1], [150, 0.8], [330, 0.8], [418, 1]]) {
    const g = Math.round(plain(x)) + 2, h = Math.round(22 * s), w = Math.round(9 * s);
    for (const dx of [-w, w - 3]) { P.rect(x + dx, g - h, 3, h, hex("#c8c2b4")); P.vline(x + dx, g - h, g, hex("#eae4d6")); }
    P.rect(x - w - 2, g - h - 3, w * 2 + 5, 3, hex("#e2dccd")); P.hline(x - w - 2, x + w + 2, g - h - 1, hex("#9c9585"));
    crystal(P, x, g - h - 4, Math.round(10 * s), { c: "#67e8f9", lit: "#e0fbff", dark: "#0e7490", glowK: 0.5 });
    P.ellipse(x, g, w + 4, 2, hex("#5c8a48"), 0.6);
  }
  // a winding road toward the Citadel
  for (let y = 198; y < 270; y++) { const cx = 240 + Math.sin(y * 0.05) * 18 * (y - 196) / 74, half = 2 + (y - 198) * 0.22; for (let x = cx - half; x <= cx + half; x++) P.set(x, y, hex(K.noise2(x * 0.4, y * 0.4, 2) > 0.6 ? "#d8c08a" : "#c4a874"), y < 206 ? 0.7 : 1); }

  P.layer("meadow", 1);
  const near = (x) => 236 + Math.sin(x * 0.01) * 5 + K.fbm1(x * 0.04, 2) * 5;
  ridge(P, near, groundTex(["#d6ec96", "#9fcf68", "#7cb456", "#629a48", "#4c7c3c"], { seed: 8, depth: 34 }));
  for (let i = 0; i < 260; i++) { const x = R.range(0, P.w), y = near(x) + R.range(0, 30); P.vline(x, y - R.int(1, 4), y, hex(R.pick(["#4f8a3a", "#6fa452", "#9fcf68"]))); }
  for (let i = 0; i < 90; i++) { const x = R.range(0, P.w), y = near(x) + R.range(2, 32); P.set(x, y, hex(R.pick(["#fde68a", "#ffffff", "#f9a8d4", "#c4b5fd"]))); }
  rock(P, 300, 262, 18, 9, { c: "#8a8478", lit: "#b4ae9e", dark: "#4a463e" });

  P.layer("frame", 1.55);
  oak(P, 20, 282, 38, { seed: 3, leaves: ["#1f4a2a", "#2e6b36", "#5a9a44"], trunk: "#3a2618" });
  oak(P, 466, 286, 32, { seed: 8, leaves: ["#1f4a2a", "#2e6b36", "#5a9a44"], trunk: "#3a2618" });
  for (let i = 0; i < 70; i++) { const x = R.chance(0.5) ? R.range(0, 120) : R.range(360, 480), y = R.range(256, 272); P.thick(x, y + 6, x + R.range(-3, 3), y - R.range(4, 12), 1, hex(R.pick(["#2e5a2a", "#3e7036", "#5a8e44"]))); }
}
