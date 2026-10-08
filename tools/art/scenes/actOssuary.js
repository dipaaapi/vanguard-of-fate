// Act XII — The Ossuary Fields
// The First War's battlefield under a pale, sunless sky: bones of every race to the horizon, broken
// banners of the old alliance, the Lantern Knight's Cairn where Brother Aldric keeps vigil, and
// Morgrave, the Ossuary Warlord, raising a line of bone lances toward the Vanguard.
import { morgrave } from "../lib/darkBosses.js";

export function paint(P, { R, K, S }) {
  const { hex, shadeC, sky, clouds, ridgeFn, ridge, fogBand, stand, rimLight, sparks, groundTex, rock, skull, bones, ribcage, tornBanner } = K;
  const HOR = 138;

  sky(P, [[0, hex("#6a6a74")], [0.45, hex("#a8a6a0")], [0.85, hex("#d8d4c6")], [1, hex("#ece6d4")]], 0, HOR, 3);
  P.glow(150, 54, 40, hex("#f4f0e4"), 0.35, 1.4);
  P.disc(150, 54, 9, hex("#e8e4d8"));
  clouds(P, { y0: 0, y1: 100, cover: 0.55, seed: 33, colors: ["#5a5a64", "#80808a", "#b4b0a8"], stretch: 6 });
  // low far hills and the haze of the endless field
  ridge(P, ridgeFn({ base: HOR, amp: 14, freq: 0.02, seed: 8 }), "#8a867e", { light: "#a29e94" });
  ridge(P, ridgeFn({ base: HOR + 6, amp: 8, freq: 0.035, seed: 15 }), "#a09a8c");
  fogBand(P, HOR + 2, 8, "#d8d4c6", 0.6, 4);

  // the field itself, bone-grey, darkening toward the camera
  ridge(P, (x) => HOR + 8 + K.fbm1(x * 0.02, 2) * 3, groundTex(["#cfc8b2", "#a8a08a", "#8a8270", "#6a6456", "#4a4640"], { seed: 6, depth: 120 }));
  const depth = (y) => 0.4 + ((y - HOR) / (P.h - HOR)) * 1.6;
  // distant banners and spears, then bones in rising size
  for (let i = 0; i < 26; i++) { const x = R.range(0, P.w), y = R.range(HOR + 8, HOR + 30); P.line(x, y, x + R.range(-3, 3), y - R.range(4, 9), hex("#5a5248")); }
  bones(P, R, 520, { y0: HOR + 10, y1: P.h, c: "#e2dac4", scaleBy: depth });
  const kinds = ["man", "man", "horned", "beast", "helmed"];
  for (let i = 0; i < 70; i++) {
    const y = R.range(HOR + 14, P.h - 2), x = R.range(0, P.w), d = depth(y);
    skull(P, x, y, Math.max(1, Math.round(1.5 * d)), { kind: R.pick(kinds), flip: R.chance(0.5), helm: R.pick(["#5a5048", "#6a4a2a", "#4a5a6a"]) });
  }
  for (let i = 0; i < 9; i++) { const y = R.range(HOR + 30, P.h - 6); ribcage(P, R.range(0, P.w), y, depth(y) * 0.9); }
  // broken banners of the old alliance: humans, elves, dwarves, beastfolk
  for (const [x, y, h, c, lean] of [[40, 204, 46, "#3b4f8a", 0.12], [196, 176, 30, "#2f6b3f", -0.1], [262, 170, 26, "#8a2c2c", 0.15], [430, 214, 52, "#a16207", -0.14], [360, 168, 24, "#5a3d91", 0.08], [128, 248, 60, "#7f1d1d", 0.2]])
    tornBanner(P, x, y, h, c, { lean, R, w: Math.round(h * 0.28) });
  // spears and swords standing in the ground
  for (let i = 0; i < 14; i++) { const x = R.range(10, 470), y = R.range(HOR + 40, P.h), d = depth(y); P.line(x, y, x + R.range(-4, 4) * d, y - 10 * d, hex("#4a4038")); P.set(x, y - 10 * d, hex("#8a8a92")); }

  // the Lantern Knight's Cairn and its keeper
  const cx = 76, cg = 196;
  for (const [dx, dy, w, h] of [[-14, 0, 16, 9], [12, 0, 18, 10], [0, 0, 22, 12], [-6, -9, 16, 9], [8, -8, 14, 9], [0, -16, 14, 9], [0, -23, 9, 6]])
    rock(P, cx + dx, cg + dy, w, h, { c: "#8a8478", lit: "#b4ae9e", dark: "#4a463e", seed: dx + 40 });
  // the lantern-shaped helm atop the cairn
  P.poly([[cx - 6, cg - 29], [cx - 4, cg - 37], [cx, cg - 40], [cx + 4, cg - 37], [cx + 6, cg - 29]], (x) => (x < cx - 1 ? hex("#e0b84a") : hex("#a07a28")));
  P.rect(cx - 4, cg - 35, 8, 3, hex("#3a2a0a")); P.rect(cx - 3, cg - 34, 2, 1, hex("#ffe9a8")); P.rect(cx + 1, cg - 34, 2, 1, hex("#ffe9a8"));
  P.ring(cx, cg - 42, 1.5, 1.5, hex("#a07a28"));
  P.glow(cx, cg - 34, 22, hex("#ffd27a"), 0.55, 1.6);
  for (let i = 0; i < 5; i++) { P.rect(cx - 16 + i * 8, cg + 2, 1, 2, hex("#fff1c4")); P.glow(cx - 16 + i * 8, cg + 1, 4, hex("#ffb347"), 0.6, 2); }   // vigil candles
  const ald = S.npc("aldric", "side");
  let [l, t] = stand(P, ald, cx + 26, cg + 6); rimLight(P, ald, l, t, "#ffd27a", -1);
  P.glow(cx + 32, cg - 8, 7, hex("#ffd27a"), 0.8, 1.8); P.rect(cx + 31, cg - 10, 3, 4, hex("#fff1c4"));

  // Morgrave and his line of bone lances erupting toward the Vanguard
  P.wash(330, 150, 70, 60, hex("#3a3a2a"), 0.25);
  P.ellipse(330, 214, 36, 5, hex("#2a2620"), 0.6);
  morgrave(P, 330, 214, 2.05);
  for (let i = 0; i < 7; i++) {
    const x = 286 - i * 14, y = 224 + i * 4, h = 16 + (i % 3) * 6 + i;
    for (const o of [-4, 0, 4]) P.poly([[x + o - 3, y], [x + o + 3, y], [x + o + (o * 0.3), y - h + Math.abs(o) * 1.5]], (px) => (px < x + o ? hex("#efe8d4") : hex("#a89e86")));
    P.ellipse(x, y, 7, 1.5, hex("#3a342a"), 0.6);
  }
  // the risen dead of every race shamble at his side
  for (const [x, y, k] of [[400, 222, "man"], [420, 230, "horned"], [266, 206, "beast"]]) {
    P.thick(x, y, x, y - 12, 2, hex("#d8d0b8")); P.line(x - 4, y - 9, x + 4, y - 9, hex("#d8d0b8")); P.line(x, y, x - 3, y + 1, hex("#b8b09a")); P.line(x, y, x + 3, y + 1, hex("#b8b09a"));
    skull(P, x, y - 15, 3, { kind: k });
    P.set(x - 1, y - 15, hex("#bef264")); P.set(x + 1, y - 15, hex("#bef264"));
  }

  // the Vanguard, foreground left, facing the warlord
  for (const [f, x, y] of [[S.hero("knight", "side", "attack", 0), 186, 256], [S.npc("renzo", "side"), 160, 262], [S.npc("veyra", "side"), 210, 264], [S.npc("julian", "side"), 136, 266]]) {
    const [a, b] = stand(P, f, x, y); rimLight(P, f, a, b, "#f4f0e4", -1);
  }
  P.glow(194, 244, 10, hex("#67e8f9"), 0.4, 2);

  sparks(P, R, 90, { y0: 60, y1: 260, colors: ["#f4f0e4", "#d9f99d", "#ffffff"], glowK: 0.1 });
  P.vignette([24, 22, 18], 0.55, 0.6);
  void shadeC;
}
