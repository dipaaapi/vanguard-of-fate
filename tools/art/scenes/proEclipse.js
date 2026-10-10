// Prologue cinema · The Eclipse of the Abyss (layered set for js/cinema/)
// The same land at the moment the sun goes dark: violet dusk, the Citadel in shadow, the plain
// already greying. Satan's colossal form is its own layer so the shot can raise it from the pit;
// the eclipse, the fissure and the miasma are drawn live.
export async function paint(P, { R, K, S }) {
  const { hex, sky, clouds, ridgeFn, ridge, fogBand, groundTex, demonColossus, rock, deadTree } = K;

  P.layer("sky", 0);
  sky(P, [[0, hex("#07040e")], [0.35, hex("#1c0c2e")], [0.7, hex("#4a1a3e")], [1, hex("#8a3a3a")]], 0, 185, 3);
  clouds(P, { y0: 6, y1: 80, cover: 0.5, seed: 13, colors: ["#120818", "#2a1236", "#4a2450"], stretch: 4 });
  clouds(P, { y0: 96, y1: 150, cover: 0.58, seed: 5, colors: ["#3a1630", "#6a2a3e", "#a24a48"], stretch: 7 });

  P.layer("peaks", 0.12);
  ridge(P, ridgeFn({ base: 152, amp: 54, freq: 0.012, seed: 4, sharp: 0.6 }), "#1e1630", { light: "#30244a", snow: "#5a4a72", snowLine: 118 });

  P.layer("satan", 0.22);
  demonColossus(P, 240, 116, 1.05, { c: "#0e0414", rimC: "#c026d3", eyes: "#ff3b3b", seed: 7 });

  P.layer("citadel", 0.32);
  const hill = ridgeFn({ base: 174, amp: 14, freq: 0.008, seed: 21 });
  const crown = (x) => hill(x) - Math.max(0, 20 - Math.abs(x - 240) * 0.22);
  ridge(P, crown, groundTex(["#3a3048", "#2a2238", "#221c2e", "#1a1624", "#14101c"], { seed: 3, depth: 40, strokes: false }));
  P.blit(await S.zone("castle", 0, 210), 240 - 58, Math.round(crown(240)) + 3 - 76, { scale: 0.36, tint: hex("#1a1028"), tintK: 0.62 });
  fogBand(P, 178, 6, "#5a2a5a", 0.45, 7);

  P.layer("plain", 0.65);
  const plain = (x) => 198 + K.fbm1(x * 0.015, 6) * 6;
  ridge(P, plain, groundTex(["#5a4a62", "#3e3248", "#30263a", "#241c2e", "#181220"], { seed: 5, depth: 60 }));
  for (const x of [70, 120, 380, 430]) deadTree(P, x, Math.round(plain(x)) + 2, 26, { c: "#140c1a", seed: x });

  P.layer("ridge", 1.35);
  const fore = (x) => 250 + Math.abs(x - 240) * 0.09 - (x < 90 || x > 390 ? 22 - Math.min(Math.abs(x - 40), Math.abs(x - 440)) * 0.3 : 0) + K.fbm1(x * 0.06, 2) * 4;
  ridge(P, fore, groundTex(["#3a2a3e", "#1c1420", "#160f1a", "#110b14", "#0b070e"], { seed: 12, depth: 20 }));
  rock(P, 30, 262, 44, 26, { c: "#1a1220", lit: "#2e2236", dark: "#0a060c" });
  rock(P, 452, 266, 52, 30, { c: "#1a1220", lit: "#2e2236", dark: "#0a060c" });
  void R;
}
