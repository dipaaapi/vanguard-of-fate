// Prologue cinema · The Seven Blights (layered set for js/cinema/)
// A blighted forest at night under a blood moon: a village burns on the far ridge, rows of dead
// trees fade into violet fog, and thorns frame the foreground. Eyes, the prowling wolf, embers
// and fog are animated by the shot.
export function paint(P, { R, K }) {
  const { hex, sky, stars, moon, clouds, ridgeFn, ridge, fogBand, deadTree, groundTex, rock } = K;

  P.layer("sky", 0);
  sky(P, [[0, hex("#05030a")], [0.5, hex("#160a20")], [0.85, hex("#3a1424")], [1, hex("#5a1e22")]], 0, 200, 3);
  stars(P, R, 90, { y1: 90, colors: ["#e9d5ff", "#fca5a5"] });
  moon(P, 120, 54, 15, { c: "#f3b2a2", shadow: 0.28, glowC: "#ef4444" });
  clouds(P, { y0: 30, y1: 100, cover: 0.6, seed: 23, colors: ["#120814", "#2a1020", "#4a1a28"], stretch: 6 });

  P.layer("village", 0.15);
  const far = ridgeFn({ base: 178, amp: 16, freq: 0.014, seed: 91 });
  ridge(P, far, "#1a1024");
  // the burning village on the far ridge
  for (const [x, w, h] of [[330, 14, 10], [348, 10, 14], [362, 16, 9], [382, 12, 12], [398, 10, 8]]) {
    const g = Math.round(far(x + w / 2)) + 2;
    P.rect(x, g - h, w, h, hex("#0c0610"));
    P.poly([[x - 2, g - h], [x + w / 2, g - h - 7], [x + w + 2, g - h]], hex("#0c0610"));
    P.rect(x + 3, g - h + 3, 2, 2, hex("#ffb347"));
  }
  P.glow(368, 168, 70, hex("#ff6a1a"), 0.55, 1.4);
  for (let s = 0; s < 90; s++) { const x = 340 + s * 0.6 + Math.sin(s * 0.18) * 6, y = 160 - s * 1.3; P.disc(x, y, 2 + s * 0.06, hex("#1a0e14"), 0.45); }

  P.layer("trees", 0.45);
  const mid = ridgeFn({ base: 206, amp: 10, freq: 0.01, seed: 19 });
  ridge(P, mid, "#140c1c");
  for (let i = 0; i < 16; i++) { const x = R.range(0, P.w); deadTree(P, x, Math.round(mid(x)) + 3, R.range(40, 80), { c: R.pick(["#120a18", "#170e1f"]), seed: i + 3 }); }
  fogBand(P, 204, 10, "#3a1a4a", 0.5, 11);

  P.layer("ground", 0.9);
  const ground = (x) => 236 + K.fbm1(x * 0.02, 7) * 6;
  ridge(P, ground, groundTex(["#3a2a3e", "#24182a", "#1c1222", "#150e1a", "#0e0912"], { seed: 9, depth: 30 }));
  for (let i = 0; i < 180; i++) { const x = R.range(0, P.w), y = ground(x) + R.range(0, 30); P.line(x, y, x + R.range(-2, 2), y - R.range(2, 6), hex(R.pick(["#2a1a26", "#3a2430", "#1e1420"]))); }
  for (let i = 0; i < 6; i++) rock(P, R.range(20, 460), R.range(250, 270), R.int(6, 12), R.int(3, 6), { c: "#1c1420", lit: "#2e2232", dark: "#0a060c", seed: i });

  P.layer("thorns", 1.55);
  deadTree(P, 14, 276, 120, { c: "#07040a", seed: 31 });
  deadTree(P, 470, 280, 104, { c: "#07040a", seed: 17 });
  for (let i = 0; i < 40; i++) { const x = R.chance(0.5) ? R.range(0, 110) : R.range(370, 480), y = R.range(256, 274); P.thick(x, y + 4, x + R.range(-6, 6), y - R.range(6, 16), 1.5, hex("#08050c")); }
}
