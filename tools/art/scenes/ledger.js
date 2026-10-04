// Ledger — The Rules of the Summoned
// The Covenant Ledger unfolds before the hero in the Barracks at night: pale gold panels list the
// six attributes, the skills and the Job line, while the Codex's blank pages wait to be filled.
export function paint(P, { R, K, S }) {
  const { hex, sky, stars, flagstones, ledgerPanel, stand, rimLight, brazier, sparks, mushroom } = K;
  sky(P, [[0, hex("#0a0e22")], [1, hex("#1e2648")]], 0, 140, 3);
  stars(P, R, 120, { y1: 120 });
  P.rect(0, 110, P.w, 40, hex("#2a2638"));
  for (let x = 0; x < P.w; x += 6) P.rect(x, 106, 4, 4, hex("#2a2638"));
  flagstones(P, 150, P.h, { c: "#2e2a40", lit: "#38344c", dark: "#24202f", seam: "#16131f", vx: 240 });

  // main panel: level, six attribute bars, points to spend, Job line
  const px = 150, py = 40, pw = 180, ph = 120;
  P.glow(px + pw / 2, py + ph / 2, 150, hex("#fde68a"), 0.35, 1.4);
  P.rect(px, py, pw, ph, hex("#2a2210"), 0.75);
  const G = hex("#fde68a"), W = hex("#fff7d6");
  for (const [x0, y0, x1, y1] of [[px, py, px + pw - 1, py], [px, py + ph - 1, px + pw - 1, py + ph - 1]]) P.hline(x0, x1, y0, G);
  P.vline(px, py, py + ph - 1, G); P.vline(px + pw - 1, py, py + ph - 1, G);
  P.rect(px + 3, py + 3, pw - 6, 12, hex("#4a3a14"));
  K.starShape(P, px + 11, py + 9, 4, G);
  for (let x = px + 20; x < px + 80; x += 2) P.set(x, py + 9, W);
  // six attributes as icon + bar (STR, AGI, VIT, INT, DEX, LUK)
  const cols = ["#f87171", "#4ade80", "#fb923c", "#60a5fa", "#facc15", "#c084fc"];
  cols.forEach((c, i) => {
    const y = py + 24 + i * 12;
    P.rect(px + 10, y, 6, 6, hex(c));
    P.rect(px + 22, y + 1, 110, 4, hex("#3a2e10"));
    P.rect(px + 22, y + 1, 30 + ((i * 37) % 70), 4, hex(c));
    P.rect(px + 140, y, 10, 6, hex("#4a3a14")); P.hline(px + 142, px + 147, y + 3, W);
    P.rect(px + 156, y, 6, 6, G); P.vline(px + 158, y + 1, y + 4, hex("#2a2210")); P.hline(px + 157, px + 160, y + 3, hex("#2a2210"));
  });
  // the Job line: empty dotted until the Awakening
  const jy = py + ph - 14;
  P.hline(px + 10, px + 30, jy, W);
  for (let x = px + 40; x < px + pw - 12; x += 3) P.set(x, jy, G);
  P.glow(px + pw - 20, jy, 10, hex("#ffffff"), 0.6, 2);

  // side panels: skills and the Codex (blank pages)
  ledgerPanel(P, 50, 64, 80, 70, { glowK: 0.3 });
  ledgerPanel(P, 350, 64, 80, 70, { glowK: 0.3 });
  for (let i = 0; i < 4; i++) { P.rect(360 + (i % 2) * 34, 76 + Math.floor(i / 2) * 26, 26, 20, hex("#fff7d6"), 0.15); P.ring(373 + (i % 2) * 34, 86 + Math.floor(i / 2) * 26, 5, 5, hex("#fde68a")); P.set(373 + (i % 2) * 34, 86 + Math.floor(i / 2) * 26, hex("#fde68a")); }

  // the hero reading it; an Oblivion Mushroom glowing on the floor
  const hero = S.hero("novice", "up");
  const [l, t] = stand(P, hero, 240, 222);
  rimLight(P, hero, l, t, "#fde68a", 1); rimLight(P, hero, l, t, "#fde68a", -1);
  for (let y = 168; y < 190; y++) P.set(240 + Math.sin(y) * 0.5, y, hex("#fde68a"), 0.4);
  mushroom(P, 330, 248, 5, { cap: "#a855f7", stem: "#e9d5ff" });
  brazier(P, 40, 262, {}); brazier(P, 440, 262, {});
  sparks(P, R, 70, { x0: 120, x1: 360, y0: 20, y1: 200, colors: ["#fde68a", "#fff7d6"], glowK: 0.2 });
  P.vignette([2, 2, 10], 0.55, 0.6);
}
