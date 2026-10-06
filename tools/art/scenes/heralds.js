// Heralds — The Inverted Star
// Satan's answer to the Pentagram: five Heralds stand on the points of an inverted star burned into
// the Maw, each before the corner of the realm it poisoned, with the demon lord at its centre.
export function paint(P, { R, K, S }) {
  const { hex, sky, vortex, stand, sparks, rimLight } = K;
  sky(P, [[0, hex("#0a0206")], [0.6, hex("#2a0812")], [1, hex("#4a0e1a")]], 0, P.h, 3);
  vortex(P, 240, 150, 260, 110, { colors: ["#0a0206", "#2a0812", "#5a1020", "#a3201e", "#ff7a4a"], arms: 5, twist: 1.6, seed: 12 });
  // inverted star
  const cx = 240, cy = 146, rx = 170, ry = 90;
  const pts = [];
  for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + (i * Math.PI * 2) / 5; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  for (let i = 0; i < 5; i++) { const a = pts[i], b = pts[(i + 2) % 5]; P.line(a[0], a[1], b[0], b[1], hex("#ff5a3a")); P.line(a[0], a[1] + 1, b[0], b[1] + 1, hex("#7a1010")); }
  P.ring(cx, cy, rx + 6, ry + 6, hex("#ff5a3a"));
  // the five corners' colours: forest, tide, frost, forge, citadel
  const corner = ["#4a0e1a", "#22c55e", "#38bdf8", "#e0f2fe", "#fb923c"];
  // points (clockwise from the bottom): Commander, Malakor, Leviathan, Cryonix, Ignis
  const who = ["commander", "cryonix", "leviathan", "malakor", "ignis"];
  const glowC = ["#ff3b3b", "#bae6fd", "#22d3ee", "#86efac", "#fb923c"];
  void corner;
  pts.forEach(([x, y], i) => {
    P.glow(x, y - 10, 34, hex(glowC[i]), 0.6, 1.6);
    P.ellipse(x, y + 2, 20, 5, hex("#12040a"));
    const f = S.boss(who[i], "down");
    const [l, t] = stand(P, f, x, y + 4, { shadow: false });
    rimLight(P, f, l, t, glowC[i], x < cx ? -1 : 1);
  });
  // Satan at the heart
  P.glow(cx, cy - 20, 50, hex("#a855f7"), 0.6, 1.5);
  const sat = S.boss("satan", "down");
  const [l, t] = stand(P, sat, cx, cy + 14, { shadow: false });
  rimLight(P, sat, l, t, "#c084fc", 1); rimLight(P, sat, l, t, "#c084fc", -1);
  sparks(P, R, 160, { colors: ["#ff7a4a", "#ffb38a", "#c084fc"], glowK: 0.25 });
  P.vignette([6, 0, 2], 0.6, 0.55);
}
