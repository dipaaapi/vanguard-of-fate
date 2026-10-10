// Act IV — The Novice's Path & The Royal Job Awakening
// The audience dais of the Citadel: the Novice stands before Astraea's altar and the celestial font,
// the Crown Heir presides, and the five callings hover in the light as the empty Job line fills.
export function paint(P, { R, K, S }) {
  const { hex, mixC, pillar, flagstones, goddessStatue, ledgerPanel, stand, rimLight, POINT_COLORS, beam, sparks, brazier, rays } = K;

  P.layer("wall", 0.3);
  // Throne-room wall: white ashlar with tall arched windows of daylight
  P.rectF(0, 0, P.w, 180, (x, y) => {
    const course = Math.floor(y / 8);
    if (y % 8 === 7 || (x + (course % 2) * 10) % 20 === 0) return hex("#9f9bb0");
    return K.noise2(Math.floor((x + (course % 2) * 10) / 20) * 1.3, course * 2.1, 7) > 0.6 ? hex("#d8d4e4") : hex("#c6c1d4");
  });
  for (const wx of [60, 140, 340, 420]) {
    P.rect(wx - 12, 26, 24, 90, hex("#8fb6e8"));
    P.disc(wx, 26, 12, hex("#8fb6e8"));
    P.rectF(wx - 12, 14, 24, 102, (x, y) => (y > 70 + (x % 7) && (x + y) % 9 === 0 ? hex("#b9d5f5") : null));
    P.vline(wx, 14, 115, hex("#6c7aa0")); P.hline(wx - 12, wx + 11, 60, hex("#6c7aa0"));
    P.rect(wx - 14, 116, 28, 4, hex("#9f9bb0"));
  }
  rays(P, 240, -30, 7, "#fff7d6", { start: Math.PI * 0.3, spread: Math.PI * 0.4, len: 330, k: 0.1, width: 0.04 });
  for (const [x, w] of [[10, 18], [100, 14], [366, 14], [452, 18]]) pillar(P, x, 6, 180, w, { c: "#e2deee", dark: "#a29db6", lit: "#ffffff" });
  // red banners of the crown
  for (const bx of [176, 296]) {
    P.rect(bx, 10, 14, 70, hex("#a11d2a"));
    P.rect(bx, 10, 14, 3, hex("#e0b84a"));
    K.starShape(P, bx + 7, 40, 5, hex("#e0b84a"));
  }

  // Apse behind the altar: a deep blue niche painted with stars
  P.rect(196, 40, 88, 140, hex("#d8d4e4"));
  P.rectF(200, 44, 80, 136, (x, y) => (y < 84 && Math.hypot(x - 240, y - 84) > 40 ? null : K.rampAt([[0, hex("#1e2a5a")], [1, hex("#3a4a8a")]], (y - 44) / 136, x, y, 3)));
  for (let i = 0; i < 40; i++) { const x = R.range(204, 276), y = R.range(48, 170); if (y > 84 || Math.hypot(x - 240, y - 84) < 38) P.set(x, y, hex(R.pick(["#fde68a", "#ffffff"]))); }
  P.layer("dais", 0.7);
  // Dais steps and floor with the red carpet
  flagstones(P, 180, P.h, { c: "#cfc9da", lit: "#e2ddea", dark: "#b6b0c4", seam: "#8d87a0", vx: 240 });
  for (let y = 180; y < P.h; y++) { const half = 16 + (y - 180) * 0.45; P.hline(240 - half, 240 + half, y, (y % 6 === 0) ? hex("#7e1622") : hex("#9b1c2a")); P.set(240 - half, y, hex("#e0b84a")); P.set(240 + half, y, hex("#e0b84a")); }
  for (let k = 0; k < 3; k++) { P.rect(150 - k * 10, 178 - k * 5, 180 + k * 20, 5, hex(k % 2 ? "#e8e4f0" : "#d4cfe0")); P.hline(150 - k * 10, 330 + k * 10, 178 - k * 5, hex("#ffffff")); }

  P.layer("altar", 0.75);
  // Astraea and the celestial font
  K.outlined(P, (L) => goddessStatue(L, 240, 150, 92, { c: "#d9d3ee", dark: "#8a83ad" }), "#2a2850");
  P.glow(240, 150 - 92 * 1.06, 18, hex("#fde68a"), 0.8, 1.8);
  P.ellipse(240, 170, 24, 6, hex("#8d87a0"));
  P.ellipse(240, 168, 22, 5, hex("#e2ddea"));
  P.ellipse(240, 167, 18, 3.5, hex("#7dd3fc"));
  P.glow(240, 166, 30, hex("#bae6fd"), 0.8, 1.6);
  beam(P, 240, 150, 166, 3, "#fff7d6", 0.5);

  // the five callings hovering in an arc (Shield, Bow, Prayer, Star, Fist)
  const icons = [[150, 104], [176, 66], [240, 26], [304, 66], [330, 104]];
  icons.forEach(([x, y], i) => {
    const c = hex(POINT_COLORS[i]);
    P.glow(x, y, 16, c, 0.8, 1.6);
    P.disc(x, y, 7, mixC(c, [20, 20, 40], 0.65));
    P.ring(x, y, 7, 7, c);
    const W = hex("#ffffff");
    if (i === 0) { P.rect(x - 3, y - 4, 7, 7, c); P.poly([[x - 3, y + 3], [x + 4, y + 3], [x + 0.5, y + 6]], c); P.vline(x, y - 3, y + 4, W); }
    if (i === 1) { for (let a = -3; a <= 3; a++) P.set(x - 2 + Math.round(Math.abs(a) * 0.6), y + a, c); P.vline(x - 2, y - 3, y + 3, W); P.hline(x - 2, x + 4, y, W); }
    if (i === 2) { P.rect(x - 1, y - 5, 2, 10, c); P.rect(x - 4, y - 2, 8, 2, c); P.set(x, y - 1, W); }
    if (i === 3) K.starShape(P, x, y, 5, c);
    if (i === 4) { P.rect(x - 3, y - 2, 6, 5, c); P.hline(x - 3, x + 2, y - 3, W); P.rect(x + 3, y - 1, 2, 3, c); }
  });

  P.layer("court", 1);
  // the Crown Heir on the dais, the Novice before the font with the Ledger open
  stand(P, S.npc("aurelia", "down"), 194, 174);
  stand(P, S.npc("royalGuard", "down"), 120, 190);
  stand(P, S.npc("royalGuard", "down"), 360, 190);
  const hero = S.hero("novice", "up");
  const [l, t] = stand(P, hero, 240, 226);
  rimLight(P, hero, l, t, "#fff7d6", 1);
  ledgerPanel(P, 262, 192, 40, 28, { jobFilled: true });
  P.layer("weather", 1.2, { skip: true });   // live HD particles replace the baked ones
  sparks(P, R, 70, { x0: 140, x1: 340, y0: 40, y1: 200, colors: ["#fff7d6", "#bae6fd"], glowK: 0.25 });
  P.layer("front", 1.1);
  brazier(P, 150, 176, { size: 1.2 }); brazier(P, 330, 176, { size: 1.2 });
  P.vignette([20, 14, 30], 0.45, 0.65);
}
