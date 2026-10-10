// Act I — The Sundered Dominion of Aethelgard
// The King and the Crown Heir watch the Eclipse of the Abyss from a ridge above the plains: the
// white Imperial Citadel still stands, but the valley floor has split and Void Miasma pours out.
export async function paint(P, { R, K, S }) {
  const { hex, eclipse, clouds, ridgeFn, ridge, fogBand, oak, stars, mixC, dith, fbm, clamp, groundTex, stand, rimLight } = K;

  P.layer("sky", 0);
  // Sky: azure on the left giving way to amethyst and black under the eclipse
  const skyStops = [[0, hex("#8cc0ec")], [0.3, hex("#5f7cc8")], [0.55, hex("#5b3e9a")], [0.78, hex("#2c1650")], [1, hex("#0d0618")]];
  for (let y = 0; y < 160; y++)
    for (let x = 0; x < P.w; x++) P.set(x, y, K.rampAt(skyStops, clamp(x / P.w * 0.85 + (1 - y / 160) * 0.3), x, y, 3));
  stars(P, R, 60, { x0: 270, y1: 80, colors: ["#e9d5ff", "#ffffff"] });
  eclipse(P, 360, 44, 14, { corona: "#a855f7", rim: "#fde68a", k: 1.2 });
  K.rays(P, 360, 44, 9, "#c084fc", { len: 260, k: 0.12, width: 0.035, seed: 3 });
  clouds(P, { y0: 6, y1: 66, cover: 0.56, seed: 11, colors: ["#24123f", "#432670", "#7f5bbd"], stretch: 3.5 });
  clouds(P, { y0: 70, y1: 118, cover: 0.6, seed: 4, colors: ["#4a4486", "#7479be", "#c3cdf0"], stretch: 4.5 });

  P.layer("far", 0.2);
  // Far mountains, then rolling hills with the citadel
  const far = ridgeFn({ base: 134, amp: 40, freq: 0.011, seed: 3, sharp: 0.55 });
  ridge(P, far, "#4a4a8c", { light: "#9097d8", snow: "#dfe5fa", snowLine: 110 });
  fogBand(P, 136, 6, "#9aa2d8", 0.5, 2);
  P.layer("hills", 0.45);
  const mid = ridgeFn({ base: 156, amp: 18, freq: 0.008, seed: 21 });
  ridge(P, mid, groundTex(["#9bc46a", "#6fa452", "#5a8f48", "#4a7a40", "#3d6838"], { seed: 3, depth: 40, strokes: false }));
  const hillTop = (x) => mid(x) - Math.max(0, 22 - Math.abs(x - 132) * 0.28);
  ridge(P, hillTop, groundTex(["#a9d074", "#7cb257", "#64994b", "#527f42", "#466f3b"], { seed: 8, depth: 30, strokes: false }));
  P.blit(await S.zone("castle", 0, 210), 132 - 56, hillTop(132) + 2 - 74, { scale: 0.35 });

  P.layer("valley", 0.7);
  // Valley floor: green on the left, blighted to grey-violet toward the eclipse
  const valley = (x) => 166 + K.fbm1(x * 0.02, 8) * 3;
  const green = groundTex(["#a7cc6a", "#7fae4e", "#5f9440", "#4a7a37", "#3a6232"], { seed: 5, depth: 70 });
  const blight = groundTex(["#9b8fa8", "#7b6d86", "#5e5168", "#45394f", "#30263a"], { seed: 5, depth: 70 });
  ridge(P, valley, (x, y, top) => (fbm(x * 0.012, y * 0.03, 9, 3) + (x - 250) / 320 > 0.55 ? blight : green)(x, y, top));

  // The fissure: a jagged split across the valley floor, glowing with miasma
  const crack = [];
  let cx = 236;
  for (let y = 167; y < 230; y++) {
    cx += (K.noise1(y * 0.2, 4) - 0.5) * 3 - 0.9;
    crack.push([cx, y, 0.6 + (y - 167) * 0.13]);
  }
  P.glow(200, 205, 90, hex("#a855f7"), 0.65, 1.4);
  for (const [x0, y, w] of crack)
    for (let x = Math.floor(x0 - w * 2.4); x <= x0 + w * 2.4; x++) {
      const d = Math.abs(x - x0) / w;
      if (d < 0.45) P.set(x, y, hex("#fbe7ff"));
      else if (d < 1) P.set(x, y, hex("#d946ef"));
      else if (d < 1.5) P.set(x, y, hex("#3b0d47"));
      else if (d < 2.4 && dith(x, y, 0.5)) P.set(x, y, hex("#241030"));
    }
  // miasma plumes rising from the crack
  for (let y = 60; y < 230; y++)
    for (let x = 120; x < 330; x++) {
      const along = crack[Math.min(crack.length - 1, Math.max(0, y - 167))];
      const ax = y >= 167 ? along[0] : 222 + (167 - y) * 0.25;
      const spread = 6 + (230 - y) * 0.42;
      const d = Math.abs(x - ax) / spread;
      if (d > 1) continue;
      const v = fbm(x * 0.06, y * 0.018 + x * 0.01, 31, 4) * (1 - d) * clamp((y - 50) / 70) * clamp((232 - y) / 30);
      if (v > 0.33) P.set(x, y, v > 0.45 ? hex("#e879f9") : v > 0.39 ? hex("#a855f7") : hex("#6b21a8"), v > 0.45 ? 0.75 : 0.55);
    }

  // Beasts' eyes along the valley's edge
  for (const [ex, ey, c] of [[300, 186, "#ff3b3b"], [338, 194, "#c084fc"], [392, 182, "#ff3b3b"], [440, 190, "#c084fc"], [96, 192, "#ff3b3b"]]) {
    P.ellipse(ex + 2, ey + 2, 7, 3, hex("#160c1c"));
    P.glow(ex + 2, ey, 7, hex(c), 0.6, 2);
    P.set(ex, ey, hex(c)); P.set(ex + 4, ey, hex(c));
  }

  P.layer("ridge", 1);
  // Foreground ridge (in shadow) with the King and the Crown Heir looking out
  const fore = (x) => 226 + Math.sin(x * 0.012) * 6 - Math.max(0, 16 - Math.abs(x - 300) * 0.12) + K.fbm1(x * 0.05, 2) * 4;
  ridge(P, fore, groundTex(["#5a6a7a", "#2c3a45", "#24303a", "#1b242d", "#141b22"], { seed: 12, depth: 30 }));
  oak(P, 30, 250, 24, { seed: 3, leaves: ["#0f2a1c", "#1a4128", "#2e6236"] });
  oak(P, 74, 258, 16, { seed: 8, leaves: ["#0f2a1c", "#1a4128", "#2e6236"] });
  K.deadTree(P, 452, 246, 58, { c: "#140d1a", seed: 4 });
  for (let i = 0; i < 260; i++) { const x = R.range(0, P.w), y = fore(x) + R.range(0, 4); P.vline(x, y - R.int(1, 4), y, hex(R.pick(["#2e4636", "#3d5a3e", "#1f2f28"]))); }
  const king = S.npc("king", "up"), heir = S.npc("aurelia", "up");
  const g = Math.round(fore(300));
  let [l, t] = stand(P, king, 290, g + 1);
  rimLight(P, king, l, t, "#e9c8ff", 1);
  [l, t] = stand(P, heir, 312, g + 1);
  rimLight(P, heir, l, t, "#e9c8ff", 1);
  P.vignette([6, 3, 14], 0.5, 0.62);
}
