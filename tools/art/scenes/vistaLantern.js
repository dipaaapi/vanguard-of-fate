// Vista — The Lantern Knight, three centuries ago
// The first summoned soul at the bottom of the sealed pit: lantern raised, the four Seal Stones
// circling, the demon lord's shadow pressed down beneath a ring of golden light.
export function paint(P, { R, K, S }) {
  const { hex, sky, runeCircle, stand, rimLight, demonColossus, sparks, beam } = K;
  sky(P, [[0, hex("#0a0806")], [0.6, hex("#1a120a")], [1, hex("#2a1a0a")]], 0, P.h, 3);
  // pit walls
  P.rectF(0, 0, P.w, P.h, (x, y) => { const d = Math.abs(x - 240) / 240; return d > 0.62 + Math.sin(y * 0.05) * 0.04 ? (K.noise2(x * 0.1, y * 0.1, 3) > 0.55 ? hex("#2a1e14") : hex("#1a120c")) : null; });
  // the demon's shadow below, held down
  demonColossus(P, 240, 250, 1.3, { c: "#0a0408", rimC: "#7a1a2a", eyes: "#ff3b3b", seed: 7 });
  P.rect(0, 200, P.w, 70, hex("#0a0806"), 0.55);
  // the seal of light
  beam(P, 240, 0, 190, 22, "#ffe9a8", 0.45);
  runeCircle(P, 240, 196, 120, 24, { c: "#ffd27a", rings: 3, glowK: 0.9 });
  // four Seal Stones orbiting: forest, tide, glacier, forge
  const stones = [["#22a855", 150, 150], ["#1e7ab8", 330, 150], ["#7cc4ec", 190, 110], ["#d9541a", 290, 110]];
  for (const [c, x, y] of stones) { P.glow(x, y, 18, hex(c), 0.9, 1.6); P.poly([[x, y - 6], [x + 5, y - 1], [x + 3, y + 5], [x - 3, y + 5], [x - 5, y - 1]], hex(c)); P.set(x - 1, y - 3, hex("#ffffff")); }
  // the Knight with the lantern
  const kn = S.lanternKnight("down", "attack", 0);
  const [l, t] = stand(P, kn, 240, 196);
  rimLight(P, kn, l, t, "#ffe9a8", 1); rimLight(P, kn, l, t, "#ffe9a8", -1);
  P.glow(252, 168, 40, hex("#ffd27a"), 0.95, 1.5);
  P.rect(250, 163, 5, 7, hex("#fff7d6"));
  sparks(P, R, 160, { colors: ["#ffd27a", "#fff7d6"], glowK: 0.3 });
  P.vignette([4, 2, 0], 0.6, 0.55);
}
