// Vista — Earth, 2026: the day of the eclipse
// A modern city at noon gone dark under a total eclipse; a construction crane stands over the
// skyline and rift fissures of light open in the sky, drawing astral motes upward.
export function paint(P, { R, K }) {
  const { hex, sky, eclipse, stars, clouds, sparks, mixC } = K;
  sky(P, [[0, hex("#0a0a1e")], [0.55, hex("#2a2a5a")], [0.85, hex("#c26a4a")], [1, hex("#f2a65a")]], 0, P.h, 3);
  stars(P, R, 60, { y1: 80 });
  eclipse(P, 300, 50, 14, { corona: "#93c5fd", rim: "#fff7d6", k: 1.1 });
  clouds(P, { y0: 120, y1: 190, cover: 0.6, seed: 91, colors: ["#4a3050", "#8a4a5a", "#e08a6a"], stretch: 6 });
  // rift fissures: jagged cracks of white-cyan light in the sky
  for (const [x0, y0, len, ang] of [[110, 40, 60, 1.1], [390, 70, 50, 2.0], [220, 110, 40, 1.5]]) {
    let x = x0, y = y0;
    for (let i = 0; i < len; i++) { x += Math.cos(ang) + R.range(-1.2, 1.2); y += Math.sin(ang) * 0.7 + R.range(-0.8, 0.8); P.set(x, y, hex("#ffffff")); P.set(x + 1, y, hex("#a5f3fc")); P.glow(x, y, 5, hex("#67e8f9"), 0.35, 2); }
  }
  // skyline: three depths of towers with lit windows
  const layer = (base, minH, maxH, col, win, seed) => {
    const r = K.rng(seed);
    let x = -4;
    while (x < P.w) {
      const w = r.int(12, 30), h = r.int(minH, maxH);
      P.rect(x, base - h, w, h, hex(col));
      if (r.chance(0.3)) P.vline(x + (w >> 1), base - h - r.int(4, 12), base - h, hex(col));
      for (let wy = base - h + 3; wy < base - 2; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 3) if (r.chance(0.35)) P.set(wx, wy, hex(win));
      x += w + r.int(0, 3);
    }
  };
  layer(212, 40, 110, "#2a2848", "#6a6aa8", 4);
  layer(226, 30, 90, "#1a1a32", "#ffcf7a", 7);
  // construction crane and girders
  P.vline(380, 70, 240, hex("#e0a020")); P.vline(384, 70, 240, hex("#e0a020"));
  for (let y = 72; y < 240; y += 6) P.line(380, y, 384, y + 6, hex("#b07a10"));
  P.hline(300, 470, 70, hex("#e0a020")); P.hline(300, 470, 74, hex("#e0a020"));
  for (let x = 300; x < 470; x += 6) P.line(x, 70, x + 6, 74, hex("#b07a10"));
  P.vline(330, 74, 150, hex("#8a8a9a")); P.rect(320, 150, 22, 3, hex("#6a6a7a"));
  layer(270, 10, 50, "#0c0c18", "#ffb347", 12);
  // street with frozen people silhouettes looking up, and astral motes rising
  P.rect(0, 250, P.w, 20, hex("#0a0a14"));
  for (let i = 0; i < 18; i++) { const x = R.range(10, 470); P.rect(x, 242, 3, 8, hex("#05050c")); P.disc(x + 1.5, 240, 1.6, hex("#05050c")); }
  sparks(P, R, 180, { y0: 60, y1: 260, colors: ["#a5f3fc", "#ffffff", "#67e8f9"], glowK: 0.3 });
  void mixC;
  P.vignette([2, 2, 8], 0.5, 0.6);
}
