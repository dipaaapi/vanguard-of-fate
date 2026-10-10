// Prologue cinema · The Decision of the King and the Heir (layered set for js/cinema/)
// The Citadel's throne hall at night: a stained-glass window of Astraea above the throne, torchlit
// pillars, the dais and the long red carpet; dark columns frame the foreground. The King and the
// summoner are drawn live; the window's shafts of light and the rune circle are effects.
export function paint(P, { R, K }) {
  const { hex, mixC, pillar, flagstones, starShape } = K;

  P.layer("wall", 0.25);
  P.rectF(0, 0, P.w, 186, (x, y) => {
    const course = Math.floor(y / 9), brick = Math.floor((x + (course % 2) * 9) / 18);
    if (y % 9 === 8 || (x + (course % 2) * 9) % 18 === 0) return hex("#110e18");
    const n = K.noise2(brick * 1.7, course * 2.3, 6);
    return n > 0.66 ? hex("#2a2436") : n < 0.3 ? hex("#18141f") : hex("#211c2b");
  });
  // tall stained-glass window: Astraea's star in rose, gold and blue
  const wx = 240, wt = 18, wb = 128, ww = 34;
  P.rect(wx - ww - 4, wt, ww * 2 + 8, wb - wt + 4, hex("#3a3346"));
  P.disc(wx, wt + 2, ww + 4, hex("#3a3346"));
  for (let y = wt - ww; y < wb; y++)
    for (let x = wx - ww; x <= wx + ww; x++) {
      if (y < wt && Math.hypot(x - wx, y - wt) > ww) continue;
      const lead = (x - wx + 300) % 11 === 0 || (y + 300) % 13 === 0;
      const d = Math.hypot(x - wx, y - 64);
      let c = lead ? hex("#14101c") : d < 9 ? hex("#fff1c4") : d < 22 ? hex("#ffd166") : ((Math.floor(x / 11) + Math.floor(y / 13)) % 3 === 0 ? hex("#2c4f8a") : (Math.floor(x / 11) + Math.floor(y / 13)) % 3 === 1 ? hex("#8a2c3c") : hex("#5a3d91"));
      if (!lead && y > 100) c = mixC(c, [10, 8, 20], 0.25);
      P.set(x, y, c);
    }
  starShape(P, wx, 64, 12, hex("#fff7d6"));
  P.glow(wx, 64, 60, hex("#ffd9a0"), 0.35, 1.6);
  // crimson banners of the crown
  for (const bx of [150, 316]) {
    P.rect(bx, 20, 14, 96, hex("#7e1622"));
    P.rect(bx, 20, 14, 3, hex("#e0b84a"));
    for (let i = 0; i < 7; i++) { P.set(bx + i, 116 + (i % 2), hex("#7e1622")); P.set(bx + 13 - i, 116 + (i % 2), hex("#7e1622")); }
    starShape(P, bx + 7, 50, 5, hex("#e0b84a"));
  }

  P.layer("pillars", 0.5);
  for (const [x, w] of [[40, 22], [104, 18], [358, 18], [418, 22]]) {
    pillar(P, x, 6, 184, w, { c: "#3a3346", dark: "#211c2b", lit: "#5a5070" });
    // torch sconce
    P.rect(x + w / 2 - 2, 96, 4, 6, hex("#2a2016"));
    P.rect(x + w / 2 - 1, 90, 2, 6, hex("#ffb347"));
    P.glow(x + w / 2, 90, 26, hex("#ff9a3d"), 0.6, 1.6);
  }

  P.layer("hall", 0.8);
  flagstones(P, 184, P.h, { c: "#2c2634", lit: "#3a3344", dark: "#221d29", seam: "#141018", vx: 240 });
  // red carpet with gold edges
  for (let y = 184; y < P.h; y++) { const half = 16 + (y - 184) * 0.42; P.hline(240 - half, 240 + half, y, y % 6 === 0 ? hex("#5e121c") : hex("#7a1622")); P.set(240 - half, y, hex("#c9963a")); P.set(240 + half, y, hex("#c9963a")); }
  // dais and the throne
  for (let k = 0; k < 3; k++) { P.rect(176 - k * 10, 180 - k * 5, 128 + k * 20, 5, hex(k % 2 ? "#4a4258" : "#3e374c")); P.hline(176 - k * 10, 303 + k * 10, 180 - k * 5, hex("#6a6080")); }
  P.rect(222, 112, 36, 60, hex("#6a4a1c"));
  P.rect(226, 116, 28, 52, hex("#7a1622"));
  P.rect(222, 112, 36, 3, hex("#e0b84a"));
  P.poly([[222, 112], [240, 94], [258, 112]], hex("#c9963a"));
  starShape(P, 240, 106, 4, hex("#fff1c4"));
  P.rect(214, 150, 10, 24, hex("#6a4a1c")); P.rect(256, 150, 10, 24, hex("#6a4a1c"));
  P.rect(214, 150, 10, 2, hex("#e0b84a")); P.rect(256, 150, 10, 2, hex("#e0b84a"));
  P.rect(224, 158, 32, 6, hex("#5e121c"));

  P.layer("columns", 1.6);
  for (const [x, w] of [[-8, 34], [452, 36]]) pillar(P, x, -4, 300, w, { c: "#0e0b14", dark: "#07050a", lit: "#1c1726", cap: false });
  void R;
}
