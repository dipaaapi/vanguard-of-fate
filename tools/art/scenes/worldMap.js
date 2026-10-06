// Vista — Map of the two continents
// A parchment map: Aethelgard (left) and the Dark Continent (right) across the sea, with each Act's
// region where js/continent.js places it. Unlabelled on purpose so it works in English and Filipino.
export function paint(P, { R, K }) {
  const { hex, mixC, shadeC, fbm, pine, crystal, starShape } = K;
  const paper = hex("#e8d6a8"), ink = hex("#4a3420");
  P.rectF(0, 0, P.w, P.h, (x, y) => { const n = fbm(x * 0.03, y * 0.03, 5, 4); const e = Math.min(x, y, P.w - x, P.h - y); return mixC(paper, hex("#a8824a"), Math.max(0, n - 0.45) * 1.2 + Math.max(0, 1 - e / 24) * 0.5); });
  // sea hatching
  for (let y = 6; y < P.h - 6; y += 6) for (let x = 6; x < P.w - 6; x++) if (Math.sin(x * 0.35 + y) > 0.92) P.set(x, y + Math.round(Math.sin(x * 0.2) * 1), hex("#9a8a6a"));
  // landmasses from noise blobs
  const land = (cx, cy, rx, ry, seed) => (x, y) => { const dx = (x - cx) / rx, dy = (y - cy) / ry; return Math.sqrt(dx * dx + dy * dy) + (fbm(x * 0.03, y * 0.03, seed, 4) - 0.5) * 0.7 < 1; };
  const A = land(140, 135, 104, 108, 3), D = land(380, 140, 85, 100, 8);
  for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) {
    const inA = A(x, y), inD = D(x, y);
    if (!inA && !inD) continue;
    const edge = !(inA ? A : D)(x - 1, y) || !(inA ? A : D)(x + 1, y) || !(inA ? A : D)(x, y - 1) || !(inA ? A : D)(x, y + 1);
    P.set(x, y, edge ? ink : inA ? mixC(paper, hex("#c8b47a"), 0.4) : mixC(paper, hex("#7a6a6a"), 0.45));
  }
  // regions (positions from js/continent.js, x/y as fractions of the map)
  const at = (fx, fy) => [Math.round(fx * P.w), Math.round(fy * P.h)];
  const [fx, fy] = at(0.27, 0.16); for (let i = 0; i < 5; i++) { const x = fx - 24 + i * 12; P.poly([[x - 8, fy + 8], [x, fy - 8 - (i % 2) * 4], [x + 8, fy + 8]], shadeC(hex("#8aa0c0"), -0.2)); P.poly([[x - 3, fy - 2], [x, fy - 8 - (i % 2) * 4], [x + 3, fy - 2]], hex("#ffffff")); }
  const [cx, cy] = at(0.40, 0.42); for (let i = 0; i < 9; i++) pine(P, cx - 20 + (i % 5) * 10, cy + 6 + Math.floor(i / 5) * 8, 12, { c: "#4a6a3a", lit: "#6a8a4a", dark: "#2a4a2a", trunk: "#4a3420" });
  const [hx, hy] = at(0.24, 0.50); P.rect(hx - 8, hy - 6, 16, 10, hex("#f4f1e8")); for (const dx of [-8, 6]) { P.rect(hx + dx, hy - 12, 3, 16, hex("#f4f1e8")); P.poly([[hx + dx - 1, hy - 12], [hx + dx + 1.5, hy - 17], [hx + dx + 4, hy - 12]], hex("#3b4f8a")); } P.rect(hx - 2, hy - 1, 4, 5, ink);
  const [sx, sy] = at(0.11, 0.58); for (let i = 0; i < 3; i++) P.line(sx - 10, sy + i * 4, sx + 10, sy + i * 4 - 2, hex("#3a6ab8"));
  const [ax, ay] = at(0.30, 0.74); P.poly([[ax - 16, ay + 8], [ax - 4, ay - 10], [ax + 4, ay - 10], [ax + 16, ay + 8]], hex("#5a3a2a")); P.disc(ax, ay - 12, 3, hex("#ff7a1a")); P.line(ax, ay - 10, ax - 4, ay + 6, hex("#ff7a1a"));
  const [mx, my] = at(0.06, 0.80); crystal(P, mx, my + 8, 16, { c: "#22d3ee", lit: "#a5f3fc", dark: "#0e7490", glowK: 0 });
  const [hbx, hby] = at(0.68, 0.74); P.vline(hbx, hby - 8, hby + 4, ink); P.hline(hbx - 4, hbx + 4, hby - 4, ink); P.line(hbx - 6, hby + 1, hbx, hby + 5, ink); P.line(hbx + 6, hby + 1, hbx, hby + 5, ink);
  const [fox, foy] = at(0.80, 0.36); P.rect(fox - 10, foy - 6, 20, 12, hex("#1a1420")); for (const dx of [-10, -2, 7]) P.poly([[dx + fox - 1, foy - 6], [dx + fox + 1.5, foy - 14], [dx + fox + 4, foy - 6]], hex("#1a1420")); P.rect(fox - 2, foy, 4, 6, hex("#ff4d2e"));
  const [vx, vy] = at(0.84, 0.62); for (let r = 2; r < 12; r += 2) P.ring(vx, vy, r, r * 0.6, r % 4 ? hex("#6a2a8a") : hex("#9d4edd"));
  // sea route from the monolith to the harbor, dashed
  for (let t = 0; t <= 1; t += 0.012) { if (Math.floor(t * 80) % 2) continue; const x = K.lerp(mx, hbx, t), y = K.lerp(my, hby, t) + Math.sin(t * Math.PI) * 26; P.set(x, y, hex("#8a2a1a")); }
  // compass rose and frame
  const [rx, ry] = [440, 236]; starShape(P, rx, ry, 14, hex("#8a6a3a")); starShape(P, rx, ry, 6, ink); P.ring(rx, ry, 10, 10, ink);
  for (let k = 0; k < 2; k++) { P.hline(4 + k * 3, P.w - 5 - k * 3, 4 + k * 3, ink); P.hline(4 + k * 3, P.w - 5 - k * 3, P.h - 5 - k * 3, ink); P.vline(4 + k * 3, 4 + k * 3, P.h - 5 - k * 3, ink); P.vline(P.w - 5 - k * 3, 4 + k * 3, P.h - 5 - k * 3, ink); }
  void R;
}
