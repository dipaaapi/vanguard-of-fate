// Act XI — The Lamenting Strand
// Dusk on the black-sand shore of the Dark Continent. The wreck of the Dawnstar, the Lantern Knight's
// flagship, lies broken in the shallows; the tide pools are black tears; Dolora, the Weeping Matron,
// hovers over the water with her tear lantern while the Vanguard's boats land on the beach.
import { dolora } from "../lib/darkBosses.js";

export function paint(P, { R, K, S }) {
  const { hex, shadeC, sky, clouds, sun, ridgeFn, ridge, water, fogBand, stand, rimLight, sparks, groundTex, rock } = K;
  const HOR = 128;

  sky(P, [[0, hex("#0c0818")], [0.35, hex("#2a1640")], [0.65, hex("#6a2e52")], [0.86, hex("#c8603e")], [1, hex("#ffb870")]], 0, HOR, 3);
  sun(P, 150, HOR + 2, 13, { c: "#ffe2b0", glowC: "#ff7a3a", k: 0.9 });
  clouds(P, { y0: 0, y1: 70, cover: 0.5, seed: 71, colors: ["#120a1e", "#2a1838", "#4a2440"], stretch: 4 });
  clouds(P, { y0: 70, y1: 118, cover: 0.58, seed: 12, colors: ["#4a2440", "#a04a4a", "#f08a5a"], stretch: 7 });
  // the Dark Continent's crags to the east, the Obsidian Harbor's glow far off
  const far = ridgeFn({ base: HOR, amp: 34, freq: 0.03, seed: 41, sharp: 0.8 });
  ridge(P, (x) => (x > 300 ? far(x) - (x - 300) * 0.12 : HOR + 1), "#160c1c", { light: "#2a1428" });
  P.glow(452, HOR - 4, 16, hex("#ff3b3b"), 0.45, 1.6);
  fogBand(P, HOR - 2, 6, "#8a4a5a", 0.4, 5);

  // the sea, the setting sun's road on it
  water(P, HOR, 214, { deep: "#140a1e", mid: "#2a1636", light: "#6a3456", foam: "#f0b08a", seed: 7, reflect: "#ffa060", reflectX: 150, reflectW: 10 });
  // the fleet riding at anchor on the horizon
  for (const [x, s] of [[236, 0.5], [262, 0.4], [286, 0.55]]) {
    P.rect(x - 8 * s, HOR - 1, 16 * s, 2, hex("#0e0812"));
    P.vline(x, HOR - 18 * s, HOR - 1, hex("#0e0812")); P.poly([[x + 1, HOR - 17 * s], [x + 8 * s, HOR - 10 * s], [x + 1, HOR - 4 * s]], hex("#2a1426"));
  }

  // the wreck of the Dawnstar, keel-up in the shallows on the left
  P.poly([[-6, 186], [118, 168], [150, 176], [138, 196], [8, 206]], (x, y) => (((x * 3 + y * 7) % 23) < 2 ? hex("#3a2a22") : y < 178 ? hex("#3e2c22") : hex("#22160f")));
  for (let x = 10; x < 140; x += 9) P.line(x, 184 - x * 0.12, x + 4, 202 - x * 0.08, hex("#1a100a"));
  // exposed ribs of the stern
  for (let i = 0; i < 6; i++) { const x = 118 + i * 6; for (let k = 0; k <= 10; k++) { const q = (k / 10) * Math.PI; P.set(Math.round(x + Math.cos(q) * 3), Math.round(176 - Math.sin(q) * (16 - i * 2)), hex(k < 5 ? "#4a3428" : "#2a1c14")); } }
  // snapped mainmast and the torn sun-sail
  P.thick(70, 176, 106, 92, 3, hex("#2e2018")); P.line(70, 176, 106, 92, hex("#4e3a2a"));
  P.thick(84, 144, 122, 150, 2, hex("#2e2018"));
  P.poly([[92, 122], [126, 132], [130, 150], [116, 158], [104, 152], [96, 160], [88, 146]], (x, y) => ((x + y) % 11 === 0 ? hex("#a89c80") : hex("#d8cfb0")));
  P.disc(110, 140, 6, hex("#d4a73a")); P.disc(110, 140, 4, hex("#e8c870"));
  for (let a = 0; a < 8; a++) { const q = (a / 8) * Math.PI * 2; P.line(110 + Math.cos(q) * 7, 140 + Math.sin(q) * 7, 110 + Math.cos(q) * 9, 140 + Math.sin(q) * 9, hex("#d4a73a")); }
  P.poly([[104, 152], [116, 158], [112, 166], [100, 162]], hex("#1a100a"));   // the tear in the sail
  P.glow(110, 140, 16, hex("#ffd27a"), 0.25, 2);
  // the figurehead: a knight holding up a lantern, half sunk
  P.thick(150, 176, 160, 160, 3, hex("#5a4a3a")); P.disc(161, 158, 2, hex("#7a6a52"));
  P.rect(162, 152, 3, 4, hex("#ffe9a8")); P.glow(163, 154, 6, hex("#ffd27a"), 0.6, 2);

  // black sand beach, sloping up toward the camera
  const shore = (x) => 206 - x * 0.03 + K.fbm1(x * 0.02, 4) * 8;
  ridge(P, shore, groundTex(["#5a5268", "#2e2a38", "#221e2a", "#18141e", "#0e0b12"], { seed: 9, depth: 50 }));
  for (let x = 0; x < P.w; x++) { const y = Math.round(shore(x)); P.set(x, y - 1, hex("#f0c8a8"), 0.7); if (x % 3) P.set(x, y - 2, hex("#c8a090"), 0.35); }
  // pools of black tears
  for (const [x, y, rx, ry] of [[196, 236, 22, 5], [300, 226, 16, 4], [404, 244, 26, 6], [82, 252, 20, 5], [258, 258, 14, 4]]) {
    P.ellipse(x, y, rx + 1, ry + 1, hex("#3a2a5a"));
    P.ellipse(x, y, rx, ry, hex("#05030a"));
    P.hline(x - rx * 0.5, x + rx * 0.1, y - ry * 0.4, hex("#4a3a7a"));
    P.set(x + rx * 0.4, y, hex("#a5b4fc"));
    P.wash(x, y - 2, rx * 1.2, ry * 2.2, hex("#6366f1"), 0.18);
  }
  // wreck debris and stones
  for (let i = 0; i < 10; i++) rock(P, R.range(20, 470), R.range(222, 268), R.int(4, 9), R.int(2, 5), { c: "#24202c", lit: "#3a3446", dark: "#0e0b12", seed: i + 3 });
  for (let i = 0; i < 6; i++) { const x = R.range(160, 460), y = R.range(220, 262); P.line(x, y, x + R.range(6, 12), y - R.range(0, 3), hex("#3a2a1e")); }

  // Dolora over the water, her reflection in the tears
  P.wash(356, 176, 50, 34, hex("#3a2a6a"), 0.35);
  P.ellipse(354, 204, 20, 2, hex("#a5b4fc"), 0.25);
  dolora(P, 354, 196, 1.45);
  fogBand(P, 200, 5, "#6a5a8a", 0.35, 11);

  // the landing: a beached longboat and the Vanguard on the sand, facing the wraith
  P.poly([[178, 216], [232, 214], [226, 222], [184, 224]], hex("#3a2216")); P.hline(178, 232, 215, hex("#6a4426"));
  P.thick(204, 214, 214, 196, 1, hex("#2a1a10"));
  const party = [[S.hero("knight", "side", "attack", 0), 262, 238], [S.npc("isolde", "side"), 236, 244], [S.npc("veyra", "side", "attack", 0), 288, 246], [S.npc("arthur", "side"), 214, 252], [S.npc("lyra", "side"), 190, 258]];
  for (const [f, x, y] of party) { const [l, t] = stand(P, f, x, y); rimLight(P, f, l, t, "#ff9a5a", -1); rimLight(P, f, l, t, "#a5b4fc", 1); }
  P.glow(268, 226, 10, hex("#67e8f9"), 0.45, 2);

  sparks(P, R, 70, { y0: 150, y1: 260, colors: ["#a5b4fc", "#c7d2fe", "#6d5ea8"], glowK: 0.15 });
  P.vignette([6, 2, 10], 0.6, 0.58);
  void shadeC;
}
