// Prologue cinema · Earth, 2026 (layered set for js/cinema/)
// A rainy city street at noon gone dark under the total eclipse: a far skyline, nearer towers with
// lit windows and signs, the wet street with lamps and a crosswalk, and a lamp post and barrier in
// the foreground. The eclipse, the rift, rain, the hero and the dissolve are drawn live.
export function paint(P, { R, K }) {
  const { hex, sky, clouds, mixC } = K;

  P.layer("sky", 0);
  sky(P, [[0, hex("#070a14")], [0.5, hex("#1a2036")], [0.8, hex("#4a3a4e")], [1, hex("#a2624a")]], 0, 200, 3);
  clouds(P, { y0: 70, y1: 150, cover: 0.58, seed: 77, colors: ["#141826", "#2a2c40", "#5a4452"], stretch: 6 });

  const towers = (base, minH, maxH, col, lit, win, seed, signs) => {
    const r = K.rng(seed);
    let x = -6;
    while (x < P.w + 6) {
      const w = r.int(16, 40), h = r.int(minH, maxH);
      P.rect(x, base - h, w, h, hex(col));
      P.vline(x, base - h, base, hex(lit));
      if (r.chance(0.35)) { P.vline(x + (w >> 1), base - h - r.int(5, 14), base - h, hex(col)); P.set(x + (w >> 1), base - h - 14, hex("#ff3b3b")); }
      for (let wy = base - h + 4; wy < base - 4; wy += 5) for (let wx = x + 3; wx < x + w - 2; wx += 4) if (r.chance(0.42)) P.rect(wx, wy, 2, 2, hex(r.chance(0.8) ? win : "#a8c8ff"));
      if (signs && r.chance(0.4)) { const sy = base - r.int(18, Math.max(20, h - 10)), sc = r.pick(["#22d3ee", "#f472b6", "#facc15"]); P.rect(x + 4, sy, w - 8, 5, hex("#0a0c14")); P.hline(x + 5, x + w - 6, sy + 2, hex(sc)); P.glow(x + w / 2, sy + 2, 12, hex(sc), 0.35, 2); }
      x += w + r.int(1, 4);
    }
  };
  P.layer("skyline", 0.12);
  towers(196, 50, 120, "#161a2a", "#20263a", "#5a6aa8", 4, false);
  P.layer("towers", 0.4);
  towers(206, 40, 110, "#0e1220", "#1c2236", "#ffcf7a", 7, true);

  P.layer("street", 1);
  P.rect(0, 202, P.w, 22, hex("#2c303a"));                         // sidewalk
  for (let x = 0; x < P.w; x += 18) P.vline(x, 202, 223, hex("#22252e"));
  P.hline(0, P.w, 202, hex("#4a4e5a"));
  P.rect(0, 224, P.w, 3, hex("#5a5e6a"));                           // kerb
  P.rectF(0, 227, P.w, 43, (x, y) => {                              // wet asphalt with reflections
    const n = K.noise2(x * 0.08, y * 0.4, 3);
    let c = n > 0.62 ? hex("#1c1f28") : hex("#16181f");
    const wx = x % 37, refl = (wx < 3 && y < 262) ? 0.18 : 0;
    if (refl) c = mixC(c, hex("#ffcf7a"), refl);
    return c;
  });
  for (let x = 6; x < P.w; x += 44) P.rect(x, 248, 22, 2, hex("#c9b458"));          // lane marks
  for (let x = 196; x < 300; x += 10) P.rect(x, 230, 6, 38, hex("#c8ccd6"), 0.85);   // crosswalk
  // street lamps with warm pools of light
  for (const x of [70, 300, 430]) {
    P.rect(x, 140, 2, 64, hex("#0c0e14")); P.rect(x, 140, 12, 2, hex("#0c0e14"));
    P.rect(x + 9, 142, 5, 2, hex("#fff1c4"));
    P.glow(x + 11, 146, 40, hex("#ffd27a"), 0.45, 1.6);
    P.ellipse(x + 10, 214, 26, 5, hex("#ffd27a"), 0.12);
  }
  // a parked car
  P.rect(352, 214, 46, 10, hex("#2a3a5a")); P.rect(360, 206, 28, 9, hex("#2a3a5a")); P.rect(363, 208, 10, 6, hex("#5a7aa8")); P.rect(375, 208, 10, 6, hex("#5a7aa8"));
  P.disc(362, 225, 4, hex("#0a0a10")); P.disc(388, 225, 4, hex("#0a0a10")); P.rect(396, 216, 3, 2, hex("#ff3b3b"));

  P.layer("frame", 1.6);
  P.rect(18, 60, 5, 220, hex("#07080c")); P.rect(18, 60, 40, 4, hex("#07080c")); P.rect(48, 62, 12, 4, hex("#fff1c4")); P.glow(54, 66, 30, hex("#ffd27a"), 0.5, 1.6);
  for (let x = 380; x < 480; x += 3) P.rect(x, 254 + Math.round(Math.sin(x * 0.4)), 2, 20, hex(((x / 3) | 0) % 4 < 2 ? "#e2a018" : "#0c0c10"));
  P.rect(380, 252, 100, 3, hex("#07080c"));
  void R;
}
