// Prologue cinema · A Distant Omen (layered set for js/cinema/)
// A storm-black wasteland far beyond Aethelgard: broken crags, the crater's dark mouth and the ring
// where four pillars of darkness stand; jagged rocks in the foreground. Lightning, the pillars'
// glow, the dark pulse and the fleeing silhouette are drawn live.
export function paint(P, { R, K }) {
  const { hex, sky, clouds, ridgeFn, ridge, fogBand, groundTex, rock } = K;

  P.layer("sky", 0);
  sky(P, [[0, hex("#04060e")], [0.55, hex("#12102a")], [1, hex("#241a36")]], 0, 190, 3);
  clouds(P, { y0: 0, y1: 120, cover: 0.42, seed: 61, colors: ["#080a16", "#161a30", "#2a2e4e"], stretch: 3 });

  P.layer("crags", 0.15);
  const far = ridgeFn({ base: 172, amp: 40, freq: 0.02, seed: 33, sharp: 0.8 });
  ridge(P, far, "#10121e", { light: "#1c2032" });
  fogBand(P, 170, 8, "#2a2440", 0.5, 4);

  P.layer("crater", 0.55);
  const land = (x) => 184 + K.fbm1(x * 0.02, 5) * 8;
  ridge(P, land, groundTex(["#2e2c3e", "#1e1c2a", "#181622", "#13111b", "#0d0c14"], { seed: 4, depth: 60, strokes: false }));
  P.ellipse(240, 210, 108, 30, hex("#0a0912"));
  P.ellipse(240, 208, 100, 26, hex("#04040a"));
  for (let a = 0; a < Math.PI * 2; a += 0.05) { const x = 240 + Math.cos(a) * 104, y = 209 + Math.sin(a) * 28; if (Math.sin(a) < 0.2) P.set(x, y, hex("#3a3450")); }
  // the four pillars of darkness
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + 0.6, x = Math.round(240 + Math.cos(a) * 66), y = Math.round(206 + Math.sin(a) * 16);
    P.rect(x - 6, y - 40, 12, 40, hex("#1e1a2a")); P.rect(x - 6, y - 40, 3, 40, hex("#2e2840"));
    P.rect(x - 2, y - 32, 4, 16, hex("#6a2a7e"));
  }

  P.layer("rocks", 1.5);
  rock(P, 40, 274, 90, 50, { c: "#0e0d16", lit: "#1c1a28", dark: "#06060a" });
  rock(P, 448, 276, 80, 44, { c: "#0e0d16", lit: "#1c1a28", dark: "#06060a" });
  void R;
}
