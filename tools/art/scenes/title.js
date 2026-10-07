// Title — The Lantern Knight's Sword
// Night on the cliff above the Imperial Citadel: the sword the Lantern Knight left behind stands in
// the seal altar, a lantern hanging from its hilt, while the eclipse rises over the sea.
// The sword's glow sits at (0.5, 0.42) of the picture: js/title.js draws its animated glow there.
export async function paint(P, { R, K, S }) {
  const { hex, sky, stars, eclipse, clouds, ridgeFn, ridge, water, fogBand, runeCircle, POINT_COLORS, groundTex, rock, sparks, moon } = K;

  sky(P, [[0, hex("#04060f")], [0.5, hex("#121a3a")], [0.85, hex("#2c2a5a")], [1, hex("#4a3a6a")]], 0, 170, 3);
  stars(P, R, 220, { y1: 150, big: 0.07 });
  eclipse(P, 392, 52, 12, { corona: "#8b5cf6", rim: "#fde68a", k: 0.9 });
  moon(P, 70, 40, 8, { shadow: 0.6 });
  clouds(P, { y0: 90, y1: 150, cover: 0.6, seed: 71, colors: ["#141a3a", "#262c5a", "#4a4a84"], stretch: 6 });
  // the sea and the far shore with the Citadel
  water(P, 150, 210, { deep: "#060a1a", mid: "#0f1a3a", light: "#2a3a6a", foam: "#8aa0d8", seed: 2, reflect: "#c4b5fd", reflectX: 392, reflectW: 10 });
  const shore = ridgeFn({ base: 152, amp: 22, freq: 0.02, seed: 4, sharp: 0.5 });
  ridge(P, (x) => (x < 170 ? shore(x) : 400), "#141838", { light: "#262c58" });
  P.blit(await S.zone("castle", 0, 210), 84 - 45, shore(84) + 4 - 59, { scale: 0.28 });
  fogBand(P, 168, 10, "#2c3466", 0.5, 5);

  // the cliff and the altar steps
  const cliff = (x) => 186 - Math.max(0, 40 - Math.abs(x - 240) * 0.22) + K.fbm1(x * 0.04, 7) * 6;
  ridge(P, cliff, groundTex(["#5a6280", "#2c3048", "#24283c", "#1c2030", "#141724"], { seed: 6, depth: 60 }));
  for (let k = 0; k < 4; k++) { const w = 70 - k * 12, y = 176 - k * 5; P.rect(240 - w / 2, y, w, 5, hex(k % 2 ? "#3a3f5a" : "#4a506e")); P.hline(240 - w / 2, 240 + w / 2 - 1, y, hex("#7a80a8")); }
  runeCircle(P, 240, 158, 30, 7, { c: "#67e8f9", pointColors: POINT_COLORS, rings: 1, runes: true, glowK: 0.5 });
  // the sword in the stone: blade, guard, grip, pommel; lantern on the guard
  const sx = 240, tip = 158, top = 44;
  P.glow(sx, 113, 70, hex("#93c5fd"), 0.35, 1.5);
  K.outlined(P, (L) => {
    L.poly([[sx - 4, top + 26], [sx + 5, top + 26], [sx + 5, tip - 6], [sx + 0.5, tip], [sx - 4, tip - 6]], (x) => (x < sx - 1 ? hex("#f8fafc") : x > sx + 2 ? hex("#64748b") : hex("#cbd5e1")));
    L.vline(sx, top + 30, tip - 8, hex("#93c5fd"));
    L.rect(sx - 18, top + 20, 37, 6, hex("#c9963a")); L.hline(sx - 18, sx + 18, top + 20, hex("#fde68a"));
    L.rect(sx - 20, top + 19, 4, 8, hex("#e0b84a")); L.rect(sx + 17, top + 19, 4, 8, hex("#e0b84a"));
    L.disc(sx, top + 23, 3, hex("#60a5fa"));
    L.rect(sx - 2, top + 4, 5, 16, hex("#5a3a1a")); for (let y = top + 5; y < top + 20; y += 2) L.hline(sx - 2, sx + 2, y, hex("#7a5230"));
    L.disc(sx, top + 2, 4, hex("#e0b84a")); L.set(sx - 1, top + 1, hex("#fde68a"));
  }, "#0a0c18");
  // lantern hanging from the right quillon
  const lx = sx + 19, ly = top + 27;
  P.vline(lx, ly, ly + 6, hex("#5a4a2a"));
  P.glow(lx, ly + 13, 44, hex("#ffd27a"), 0.85, 1.6);
  P.rect(lx - 4, ly + 7, 9, 12, hex("#fff1c4")); P.rect(lx - 5, ly + 6, 11, 2, hex("#8a6a2a")); P.rect(lx - 5, ly + 19, 11, 2, hex("#8a6a2a"));
  P.vline(lx - 4, ly + 8, ly + 18, hex("#8a6a2a")); P.vline(lx + 4, ly + 8, ly + 18, hex("#8a6a2a")); P.rect(lx - 1, ly + 10, 3, 5, hex("#ffffff"));
  rock(P, 40, 272, 90, 50, { c: "#1c2030", lit: "#2c3048", dark: "#0c0e16" });
  rock(P, 450, 274, 80, 60, { c: "#1c2030", lit: "#2c3048", dark: "#0c0e16" });
  sparks(P, R, 50, { x0: 180, x1: 300, y0: 80, y1: 180, colors: ["#ffd27a", "#fde68a"], glowK: 0.3 });
  P.vignette([2, 2, 8], 0.6, 0.6);
}
