// Act II — The Celestial Rift & The Earthbound Summoning
// The ritual sanctum beneath the Citadel: the Pentagram Seal blazes on the floor, a beam of light
// weaves a soul back into flesh on the pedestal, and the Crown Heir holds the conduit open.
export function paint(P, { R, K, S }) {
  const { hex, mixC, shadeC, pillar, brazier, flagstones, runeCircle, beam, crystal, sparks, stand, rimLight, POINT_COLORS, dith, clamp } = K;

  P.layer("wall", 0.3);
  // Back wall: dark ashlar with a rose window
  P.rectF(0, 0, P.w, 170, (x, y) => {
    const course = Math.floor(y / 9), brick = Math.floor((x + (course % 2) * 8) / 16);
    const n = K.noise2(brick * 1.7, course * 2.3, 4);
    if (y % 9 === 8 || (x + (course % 2) * 8) % 16 === 0) return hex("#141626");
    return n > 0.65 ? hex("#2e3350") : n < 0.3 ? hex("#1c1f33") : hex("#252a43");
  });
  // rose window with an eight-pointed star of glass
  const wx = 240, wy = 58, wr = 40;
  P.disc(wx, wy, wr + 4, hex("#3d425f"));
  P.disc(wx, wy, wr, hex("#0c1630"));
  for (let y = wy - wr; y <= wy + wr; y++)
    for (let x = wx - wr; x <= wx + wr; x++) {
      const dx = x - wx, dy = y - wy, d = Math.hypot(dx, dy);
      if (d > wr) continue;
      const a = Math.atan2(dy, dx);
      const petal = Math.abs(Math.cos(a * 4)) * wr;
      const star = d < petal * 0.85;
      const pane = Math.floor((a + Math.PI) / (Math.PI / 8)) % 2;
      let c = star ? (d < 10 ? hex("#fff7d6") : hex("#fbbf24")) : pane ? hex("#1e3a8a") : hex("#312e81");
      if (Math.abs(d - wr * 0.62) < 0.8 || Math.abs(d - wr * 0.98) < 0.8) c = hex("#3d425f");
      if (!star && Math.abs(Math.sin(a * 8)) < 0.08) c = hex("#3d425f");
      P.set(x, y, c);
    }
  P.glow(wx, wy, 70, hex("#93c5fd"), 0.35, 1.6);
  // banners
  for (const bx of [130, 334]) {
    P.rect(bx, 26, 16, 54, hex("#8b1e1e"));
    P.rect(bx, 26, 16, 3, hex("#e0b84a"));
    for (let i = 0; i < 8; i++) { P.set(bx + i, 80 + (i % 2), hex("#8b1e1e")); P.set(bx + 15 - i, 80 + (i % 2), hex("#8b1e1e")); }
    P.disc(bx + 8, 50, 4, hex("#e0b84a")); P.disc(bx + 8, 50, 2, hex("#8b1e1e"));
  }
  P.layer("pillars", 0.5);
  // pillars
  for (const [x, w] of [[22, 22], [86, 16], [378, 16], [436, 22]]) pillar(P, x, 10, 170, w, { c: "#5b6280", dark: "#2e3350", lit: "#8a93b8" });

  P.layer("floor", 0.8);
  // Floor
  flagstones(P, 170, P.h, { c: "#2a2f48", lit: "#353b5a", dark: "#20243a", seam: "#12142a", vx: 240 });
  // The Pentagram Seal
  const cy = 214;
  runeCircle(P, 240, cy, 150, 42, { c: "#67e8f9", pointColors: POINT_COLORS, rings: 3, pillars: 40 });
  runeCircle(P, 240, cy, 96, 26, { c: "#a5f3fc", rings: 1, runes: false });
  // pedestal
  P.ellipse(240, cy + 3, 26, 8, hex("#1b1f33"));
  P.ellipse(240, cy, 24, 7, hex("#4a5274"));
  P.ellipse(240, cy - 1, 20, 5.5, hex("#6a739a"));
  // the beam and the soul taking form
  beam(P, 240, 0, cy, 9, "#e0f2fe", 1);
  P.glow(240, cy - 18, 46, hex("#bae6fd"), 0.8, 1.5);
  const hero = S.hero("novice", "down");
  const [l, t] = stand(P, hero, 240, cy - 1, { shadow: false, tint: "#e0f2fe", tintK: 0.45 });
  rimLight(P, hero, l, t, "#ffffff", -1);
  sparks(P, R, 140, { x0: 200, x1: 280, y0: 60, y1: cy, colors: ["#ffffff", "#a5f3fc", "#67e8f9"], glowK: 0.25 });
  // levitating mana crystals
  for (const [x, y, h] of [[150, 150, 14], [330, 146, 14], [176, 120, 10], [304, 118, 10]]) crystal(P, x, y, h, { glowK: 0.5 });

  P.layer("court", 1);
  // the Crown Heir holding the conduit, Royal Guards behind
  const heir = S.npc("aurelia", "side", "attack", 1);
  stand(P, heir, 120, 236, { flip: false });
  P.glow(136, 214, 16, hex("#67e8f9"), 0.7, 2);
  stand(P, S.npc("royalGuard", "down"), 386, 226);
  stand(P, S.npc("royalGuard", "down"), 420, 240);
  brazier(P, 52, 262, { flame: "#a855f7", hot: "#f5d0fe" });
  brazier(P, 428, 262, { flame: "#a855f7", hot: "#f5d0fe" });
  P.vignette([4, 4, 14], 0.55, 0.6);
}
