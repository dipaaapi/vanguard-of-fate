// Act VIII — The Cerulean Abyss & The Sunken Monoliths
// Storm over the Cerulean Abyss: the Leviathan Regent coils in the maelstrom around the Celestial
// Monolith, the Lantern Knight's gate, while the champion and the Crown Heir hold the sea cliff.
export function paint(P, { R, K, S }) {
  const { hex, mixC, sky, clouds, ridgeFn, ridge, water, vortex, stand, rimLight, sparks, groundTex, rock } = K;

  P.layer("sky", 0);
  sky(P, [[0, hex("#0b1424")], [0.45, hex("#1f3350")], [0.75, hex("#55507a")], [0.92, hex("#e08a6a")], [1, hex("#ffd29a")]], 0, 140, 3);
  clouds(P, { y0: 0, y1: 90, cover: 0.48, seed: 31, colors: ["#0d1626", "#1f2c46", "#3e4f72"], stretch: 3 });
  clouds(P, { y0: 80, y1: 130, cover: 0.56, seed: 8, colors: ["#5a4a6a", "#a3687a", "#f0a07a"], stretch: 6 });
  // lightning
  let lx = 92, ly = 0;
  while (ly < 112) { const nx = lx + R.range(-6, 6), ny = ly + R.range(5, 11); P.line(lx, ly, nx, ny, hex("#f0f9ff")); P.glow(lx, ly, 6, hex("#93c5fd"), 0.3, 2); lx = nx; ly = ny; }
  P.layer("cliffs", 0.2);
  // distant sea cliffs
  const cl = ridgeFn({ base: 136, amp: 40, freq: 0.03, seed: 6, sharp: 0.7 });
  ridge(P, (x) => (x < 110 ? cl(x) : 140), "#283650", { light: "#3c4c6c" });

  P.layer("sea", 0.5);
  // the sea
  water(P, 138, P.h, { deep: "#0a1f36", mid: "#12416a", light: "#3a86b8", foam: "#d9f0ff", seed: 9, reflect: "#f0a07a", reflectX: 330, reflectW: 18 });
  // maelstrom
  vortex(P, 250, 176, 120, 26, { colors: ["#04101e", "#0b2a48", "#15507a", "#3a8ab8", "#cdeeff"], arms: 3, twist: 2.2, seed: 4 });
  // the Celestial Monolith, runes glowing cyan
  P.glow(250, 120, 60, hex("#22d3ee"), 0.45, 1.5);
  P.poly([[238, 172], [242, 70], [250, 62], [258, 70], [262, 172]], (x) => (x < 246 ? hex("#4a6080") : x < 255 ? hex("#2e3f5a") : hex("#1c2a40")));
  for (let y = 78; y < 168; y += 7) { P.hline(246, 253, y, hex("#67e8f9")); if ((y / 7) % 2 < 1) P.set(250, y + 3, hex("#a5f3fc")); }
  for (let k = 0; k < 4; k++) { const y = 92 + k * 20; P.disc(250, y, 2, hex("#0b1424")); P.ring(250, y, 3, 3, hex("#334a66")); }   // four empty stone sockets
  // the Leviathan Regent coiling around it
  stand(P, S.boss("leviathan", "down", "idle", 0), 196, 196, { shadow: false });
  for (let i = 0; i < 6; i++) { const x = 290 + i * 12, y = 188 + Math.sin(i) * 3; P.ellipse(x, y, 6, 3, hex("#1b2a4a")); P.ellipse(x, y - 1, 5, 1.5, hex("#2e4670")); P.set(x, y - 2, hex("#5eead4")); }
  sparks(P, R, 120, { x0: 120, x1: 380, y0: 150, y1: 210, colors: ["#d9f0ff", "#ffffff"], glowK: 0 });

  P.layer("cliff", 1);
  // foreground cliff with the pair
  const fc = (x) => (x > 330 ? 210 - (x - 330) * 0.35 + K.fbm1(x * 0.06, 3) * 8 : 400);
  ridge(P, fc, groundTex(["#7a8a7a", "#4a5560", "#363f4a", "#283039", "#1c222a"], { seed: 3, depth: 50, strokes: false }));
  for (let i = 0; i < 80; i++) { const x = R.range(340, 480), y = fc(x) + R.range(0, 3); P.vline(x, y - R.int(1, 3), y, hex(R.pick(["#3d5a3e", "#5a7a4a"]))); }
  rock(P, 30, 268, 50, 34, { c: "#2c3644", lit: "#46546a", dark: "#151b24" });
  rock(P, 74, 270, 24, 16, { c: "#2c3644", lit: "#46546a", dark: "#151b24" });
  const hero = S.hero("knight", "side"), heir = S.npc("aurelia", "side");
  let [l, t] = stand(P, hero, 392, Math.round(fc(392)) + 1, { flip: true });
  rimLight(P, hero, l, t, "#ffd29a", 1);
  [l, t] = stand(P, heir, 420, Math.round(fc(420)) + 1, { flip: true });
  rimLight(P, heir, l, t, "#ffd29a", 1);
  P.layer("weather", 1.2, { skip: true });   // live HD particles replace the baked ones
  // rain
  for (let i = 0; i < 500; i++) { const x = R.range(0, P.w), y = R.range(0, P.h); P.line(x, y, x - 2, y + 5, hex("#9fb8d8"), 0.35); }
  P.vignette([2, 6, 14], 0.55, 0.6);
}
