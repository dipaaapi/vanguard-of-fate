// Relics and sigils — 32×32 item art for story objects that have no in-game icon yet: the four
// Seal Stones, the Lantern, the Imperial Crest, the Covenant Ledger, the Oblivion Mushroom, the five
// discipline sigils and the Heralds' inverted star. Transparent background, 1-px dark outline.
export function paint(P, { K, arg }) {
  const { hex, shadeC, mixC, outlined, starShape, DISCIPLINE } = K;
  const gem = (L, base, rune) => {
    const C = hex(base), Lt = shadeC(C, 0.45), Dk = shadeC(C, -0.45), W = hex("#ffffff");
    const pts = [[16, 3], [27, 11], [24, 26], [8, 26], [5, 11]];
    L.poly(pts, C);
    L.poly([[16, 3], [16, 15], [5, 11]], Lt); L.poly([[16, 3], [27, 11], [16, 15]], shadeC(C, 0.2));
    L.poly([[5, 11], [16, 15], [8, 26]], shadeC(C, -0.15)); L.poly([[27, 11], [24, 26], [16, 15]], Dk);
    L.poly([[8, 26], [16, 15], [24, 26]], shadeC(C, -0.3));
    rune(L, W); L.set(10, 8, W); L.set(11, 8, W); L.set(10, 9, W);
  };
  const glowAround = () => {};   // relics stay on a clean transparent background
  const medal = (L, c) => { const C = hex(c); L.disc(16, 16, 13, shadeC(C, -0.6)); L.ring(16, 16, 13, 13, hex("#e0b84a")); L.ring(16, 16, 12, 12, shadeC(C, -0.2)); return C; };
  const draws = {
    sylvanStone: () => { glowAround("#4ade80"); outlined(P, (L) => gem(L, "#22a855", (L, W) => { L.vline(16, 12, 22, W); L.line(16, 15, 13, 12, W); L.line(16, 17, 19, 14, W); })); },
    tideStone: () => { glowAround("#22d3ee"); outlined(P, (L) => gem(L, "#1e7ab8", (L, W) => { for (let x = 11; x <= 21; x++) { L.set(x, 16 + Math.round(Math.sin(x * 0.9) * 1.5), W); L.set(x, 20 + Math.round(Math.sin(x * 0.9 + 1) * 1.5), W); } })); },
    frostStone: () => { glowAround("#e0f2fe"); outlined(P, (L) => gem(L, "#7cc4ec", (L, W) => { L.vline(16, 12, 22, W); L.hline(11, 21, 17, W); L.line(12, 13, 20, 21, W); L.line(20, 13, 12, 21, W); })); },
    emberStone: () => { glowAround("#fb923c"); outlined(P, (L) => gem(L, "#d9541a", (L, W) => { L.poly([[16, 11], [20, 18], [18, 22], [14, 22], [12, 18]], hex("#ffe08a")); L.poly([[16, 15], [18, 19], [16, 22], [14, 19]], W); })); },
    lantern: () => { outlined(P, (L) => {
      L.ring(16, 5, 3, 3, hex("#8a6a2a")); L.rect(9, 8, 15, 3, hex("#c9963a")); L.rect(10, 24, 13, 3, hex("#c9963a")); L.rect(12, 27, 9, 2, hex("#8a6a2a"));
      L.rect(10, 11, 13, 13, hex("#fff1c4")); L.vline(10, 11, 23, hex("#8a6a2a")); L.vline(22, 11, 23, hex("#8a6a2a")); L.vline(16, 11, 23, hex("#c9963a"));
      L.poly([[16, 13], [19, 18], [16, 22], [13, 18]], hex("#ffb347")); L.rect(15, 17, 2, 3, hex("#ffffff")); }); },
    imperialCrest: () => outlined(P, (L) => {
      L.poly([[6, 8], [26, 8], [26, 18], [16, 29], [6, 18]], hex("#a11d2a")); L.poly([[6, 8], [16, 8], [16, 29], [6, 18]], hex("#c42838"));
      L.hline(6, 25, 8, hex("#fde68a")); starShape(L, 16, 17, 5, hex("#e0b84a"));
      L.poly([[9, 6], [9, 2], [12, 4], [16, 1], [20, 4], [23, 2], [23, 6]], hex("#e0b84a")); L.set(16, 3, hex("#60a5fa")); }),
    covenantLedger: () => { outlined(P, (L) => {
      L.rect(5, 6, 22, 20, hex("#3a2e10")); L.rect(6, 7, 20, 18, hex("#5a4614"));
      L.hline(5, 26, 6, hex("#fde68a")); L.hline(5, 26, 25, hex("#fde68a")); L.vline(5, 6, 25, hex("#fde68a")); L.vline(26, 6, 25, hex("#fde68a"));
      for (let i = 0; i < 5; i++) { L.hline(8, 13, 10 + i * 3, hex("#fff7d6")); L.hline(16, 16 + ((i * 5) % 7) + 2, 10 + i * 3, hex("#fde68a")); }
      for (let x = 8; x < 24; x += 2) L.set(x, 23, hex("#fde68a")); }); },
    oblivionMushroom: () => { outlined(P, (L) => {
      L.rect(13, 16, 6, 11, hex("#e9d5ff")); L.vline(13, 16, 26, hex("#ffffff")); L.vline(18, 16, 26, hex("#b8a5d8"));
      L.ellipse(16, 14, 12, 7, hex("#7e22ce")); L.ellipse(14, 12, 8, 4, hex("#a855f7"));
      for (const [x, y] of [[10, 12], [16, 9], [21, 13], [13, 15]]) { L.set(x, y, hex("#f5d0fe")); L.set(x + 1, y, hex("#f5d0fe")); }
      L.hline(5, 27, 17, hex("#4a0e7a")); }); },
    sigilShield: () => outlined(P, (L) => { const C = medal(L, DISCIPLINE.shield); L.poly([[10, 9], [22, 9], [22, 17], [16, 24], [10, 17]], C); L.vline(16, 10, 22, hex("#ffffff")); L.hline(11, 21, 13, hex("#ffffff")); }),
    sigilBow: () => outlined(P, (L) => { const C = medal(L, DISCIPLINE.bow); for (let y = -8; y <= 8; y++) L.set(12 + Math.round((1 - (y * y) / 64) * 6), 16 + y, C); L.vline(12, 8, 24, hex("#ffffff")); L.hline(9, 22, 16, hex("#ffffff")); L.line(20, 14, 22, 16, hex("#ffffff")); L.line(20, 18, 22, 16, hex("#ffffff")); }),
    sigilPrayer: () => outlined(P, (L) => { const C = medal(L, DISCIPLINE.prayer); L.rect(14, 7, 4, 18, C); L.rect(9, 12, 14, 4, C); L.vline(15, 8, 23, hex("#ffffff")); }),
    sigilStar: () => outlined(P, (L) => { const C = medal(L, DISCIPLINE.star); starShape(L, 16, 17, 9, C); L.set(16, 16, hex("#ffffff")); L.set(14, 13, hex("#ffffff")); }),
    sigilFist: () => outlined(P, (L) => { const C = medal(L, DISCIPLINE.fist); L.rect(10, 11, 12, 10, C); for (let i = 0; i < 4; i++) L.vline(11 + i * 3, 11, 14, hex("#ffffff")); L.rect(20, 14, 4, 5, C); L.rect(11, 21, 9, 3, shadeC(C, -0.3)); }),
    invertedStar: () => { outlined(P, (L) => {
      L.disc(16, 16, 13, hex("#2a0408")); L.ring(16, 16, 13, 13, hex("#ff3b3b"));
      const pts = []; for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + (i * Math.PI * 2) / 5; pts.push([16 + Math.cos(a) * 11, 16 + Math.sin(a) * 11]); }
      for (let i = 0; i < 5; i++) L.line(pts[i][0], pts[i][1], pts[(i + 2) % 5][0], pts[(i + 2) % 5][1], hex("#ff5a3a"));
      L.disc(16, 16, 2, hex("#c084fc")); }); }
  };
  draws[arg]();
  void mixC;
}
