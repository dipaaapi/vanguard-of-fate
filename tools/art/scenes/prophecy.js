// Prophecy — The Pentagram Seal
// The runic foundation of the Citadel: the Lantern Knight's verse is cut around a carved star whose
// five points glow in the disciplines' colours, with a sixth, empty mark at its heart.
export function paint(P, { R, K }) {
  const { hex, mixC, shadeC, POINT_COLORS, brazier, sparks, starShape } = K;
  // foundation stones lit by torchlight
  P.rectF(0, 0, P.w, P.h, (x, y) => {
    const course = Math.floor(y / 18), off = (course % 2) * 22;
    const bx = Math.floor((x + off) / 44);
    if (y % 18 === 17 || (x + off) % 44 === 0) return hex("#15121c");
    const n = K.noise2(bx * 1.9, course * 2.7, 3), g = K.noise2(x * 0.25, y * 0.25, 8);
    const base = n > 0.6 ? hex("#4a4258") : n < 0.3 ? hex("#332d40") : hex("#3e374c");
    return g > 0.72 ? shadeC(base, -0.15) : g < 0.2 ? shadeC(base, 0.06) : base;
  });
  P.glow(40, 150, 120, hex("#ff9a3d"), 0.35, 1.5);
  P.glow(440, 150, 120, hex("#ff9a3d"), 0.35, 1.5);
  // carved circle and star: engraved groove (dark) with lit lower edge, glowing script
  const cx = 240, cy = 132, r = 96;
  const groove = (x0, y0, x1, y1) => { P.line(x0, y0, x1, y1, hex("#0e0b14")); P.line(x0, y0 + 1, x1, y1 + 1, hex("#6a6080")); };
  for (let k = 0; k < 2; k++) { const rr = r - k * 12; P.ring(cx, cy, rr, rr, hex("#0e0b14")); P.ring(cx, cy + 1, rr, rr, hex("#6a6080")); }
  // ring of runes, glowing gold
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2, rr = r - 6;
    const x = Math.round(cx + Math.cos(a) * rr), y = Math.round(cy + Math.sin(a) * rr);
    const g = R.int(0, 3);
    P.set(x, y, hex("#fde68a")); if (g & 1) P.set(x + 1, y, hex("#fde68a")); if (g & 2) P.set(x, y - 1, hex("#fbbf24"));
  }
  P.glow(cx, cy, r + 8, hex("#fbbf24"), 0.18, 1.2);
  const pts = [];
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * Math.PI * 2) / 5; pts.push([cx + Math.cos(a) * (r - 14), cy + Math.sin(a) * (r - 14)]); }
  for (let i = 0; i < 5; i++) groove(...pts[i], ...pts[(i + 2) % 5]);
  pts.forEach(([x, y], i) => { const c = hex(POINT_COLORS[i]); P.glow(x, y, 22, c, 0.9, 1.6); P.disc(x, y, 4, shadeC(c, -0.2)); P.disc(x, y, 2, shadeC(c, 0.6)); });
  // the empty sixth mark at the heart, and a lantern carved above it
  P.ring(cx, cy, 6, 6, hex("#e2e8f0")); P.glow(cx, cy, 14, hex("#e2e8f0"), 0.35, 2);
  // verse lines (glyph rows, not readable text so the image works in every language)
  for (let row = 0; row < 3; row++) {
    const y = 244 + row * 8, w = [220, 260, 180][row];
    for (let x = cx - w / 2; x < cx + w / 2; x++) {
      if (K.noise2(x * 0.6, row * 3, 4) > 0.42) P.set(x, y, hex("#fde68a"));
      if (K.noise2(x * 0.6, row * 3 + 1, 4) > 0.6) P.set(x, y - 1, hex("#fbbf24"));
    }
  }
  // lantern hanging at the top of the star
  const lx = cx, ly = 16;
  P.vline(lx, 0, ly, hex("#3a3020"));
  P.glow(lx, ly + 7, 30, hex("#ffd27a"), 0.8, 1.6);
  P.rect(lx - 3, ly + 2, 7, 10, hex("#fff1c4")); P.rect(lx - 4, ly, 9, 2, hex("#8a6a2a")); P.rect(lx - 4, ly + 12, 9, 2, hex("#8a6a2a"));
  brazier(P, 30, 262, {}); brazier(P, 450, 262, {});
  sparks(P, R, 80, { colors: ["#fde68a", "#ffffff"], glowK: 0.25 });
  P.vignette([4, 2, 8], 0.55, 0.6);
}
