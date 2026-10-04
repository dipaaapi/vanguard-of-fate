// Vista — The Emberhold Forge
// The dwarven smithy where gear is mended and tempered: a roaring forge, a channel of molten metal,
// tools on the walls and Brakka at the anvil with the hero waiting for a blade.
export function paint(P, { R, K, S }) {
  const { hex, flagstones, lavaFlow, stand, sparks, rimLight } = K;
  P.rectF(0, 0, P.w, 180, (x, y) => {
    const course = Math.floor(y / 14), off = (course % 2) * 12;
    if (y % 14 === 13 || (x + off) % 24 === 0) return hex("#1a120e");
    return K.noise2(Math.floor((x + off) / 24) * 2, course * 3, 2) > 0.55 ? hex("#4a3226") : hex("#3a271e");
  });
  // forge: stone hood with fire
  P.poly([[150, 30], [330, 30], [300, 110], [180, 110]], hex("#2a1e18"));
  P.rect(180, 110, 120, 60, hex("#2a1e18"));
  P.rect(196, 124, 88, 40, hex("#120a06"));
  for (let y = 124; y < 164; y++) for (let x = 196; x < 284; x++) { const v = K.fbm(x * 0.08, y * 0.12 - 0, 4, 3) + (y - 124) / 80; if (v > 0.8) P.set(x, y, v > 1.05 ? hex("#ffe08a") : v > 0.92 ? hex("#ff8a1a") : hex("#c2301a")); }
  P.glow(240, 150, 110, hex("#ff7a1a"), 0.55, 1.4);
  // tools on the wall
  for (let i = 0; i < 6; i++) { const x = 30 + i * 18; P.vline(x, 40, 70, hex("#5a3a1a")); P.rect(x - 3, 36, 7, 5, hex("#8a8a96")); }
  for (let i = 0; i < 5; i++) { const x = 360 + i * 20; P.vline(x, 40, 76, hex("#5a3a1a")); P.poly([[x - 4, 40], [x + 4, 40], [x, 48]], hex("#9aa0aa")); }
  flagstones(P, 180, P.h, { c: "#3a2a22", lit: "#4a362c", dark: "#2c1f19", seam: "#160e0a", vx: 240 });
  lavaFlow(P, [[0, 200], [120, 206], [240, 212], [360, 206], [480, 200]], 3);
  // anvil and Brakka
  P.rect(300, 222, 34, 8, hex("#4a4a56")); P.rect(306, 230, 22, 6, hex("#2a2a34")); P.rect(312, 236, 10, 14, hex("#2a2a34")); P.hline(300, 333, 222, hex("#8a8a9a"));
  P.rect(306, 219, 18, 3, hex("#ffb347"));
  const br = S.npc("brakka", "side", "attack", 0);
  let [l, t] = stand(P, br, 348, 252, { flip: true }); rimLight(P, br, l, t, "#ffb347", -1);
  const h = S.hero("knight", "side");
  [l, t] = stand(P, h, 250, 256); rimLight(P, h, l, t, "#ffb347", 1);
  sparks(P, R, 90, { x0: 290, x1: 350, y0: 180, y1: 230, colors: ["#ffe08a", "#ffb347"], glowK: 0.4 });
  sparks(P, R, 60, { x0: 180, x1: 300, y0: 20, y1: 130, colors: ["#ffb347", "#ff7a1a"], glowK: 0.3 });
  P.vignette([6, 2, 0], 0.55, 0.6);
}
