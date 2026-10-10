// Prologue cinema · The Ritual beneath the Citadel (layered set for js/cinema/)
// The summoning vault: blue-black ashlar with arches, hanging banners, pillars with cold braziers,
// the flagstone floor and the stone pedestal at the centre; massive columns in the foreground.
// Rune circles, the beam, crystals, the summoner and the hero's forming are drawn live.
export function paint(P, { R, K }) {
  const { hex, pillar, flagstones, brazier, starShape } = K;

  P.layer("vault", 0.25);
  P.rectF(0, 0, P.w, 176, (x, y) => {
    const course = Math.floor(y / 10), brick = Math.floor((x + (course % 2) * 12) / 24);
    if (y % 10 === 9 || (x + (course % 2) * 12) % 24 === 0) return hex("#080b16");
    const n = K.noise2(brick * 1.9, course * 2.7, 8);
    return n > 0.64 ? hex("#1e2540") : n < 0.32 ? hex("#121730") : hex("#181e38");
  });
  // three arches into the dark
  for (const ax of [120, 240, 360]) {
    const w = ax === 240 ? 46 : 34, top = ax === 240 ? 46 : 70;
    P.rect(ax - w / 2, top, w, 176 - top, hex("#05070e"));
    P.disc(ax, top, w / 2, hex("#05070e"));
    P.ring(ax, top, w / 2 + 1, w / 2 + 1, hex("#2a3456"));
  }
  starShape(P, 240, 40, 8, hex("#3a4a7a"));
  for (const bx of [176, 296]) { P.rect(bx, 14, 12, 70, hex("#1e2a5a")); P.rect(bx, 14, 12, 2, hex("#7ee8fa")); starShape(P, bx + 6, 40, 4, hex("#7ee8fa")); }

  P.layer("pillars", 0.5);
  for (const [x, w] of [[54, 20], [406, 20]]) { pillar(P, x, 0, 176, w, { c: "#252c46", dark: "#141a2e", lit: "#3a456c" }); brazier(P, x + w / 2, 150, { flame: "#38bdf8", hot: "#e0f2fe", spirit: true, glowK: 0.6 }); }

  P.layer("floor", 0.85);
  flagstones(P, 176, P.h, { c: "#1a2036", lit: "#232a46", dark: "#141a2c", seam: "#0a0d18", vx: 240 });
  // the pedestal
  P.ellipse(240, 220, 34, 10, hex("#0e1220"));
  P.ellipse(240, 216, 30, 8, hex("#3a4466"));
  P.ellipse(240, 214, 26, 6.5, hex("#4e5a82"));
  P.ellipse(240, 213, 20, 4.5, hex("#5e6c96"));

  P.layer("columns", 1.6);
  for (const [x, w] of [[-10, 38], [450, 40]]) pillar(P, x, -4, 300, w, { c: "#0a0d18", dark: "#05070e", lit: "#141a2c", cap: false });
  void R;
}
