// Act VI — The Royal Covenant & The Vanguard Campaign
// Night on the Citadel's high observatory: the champion and the Crown Heir look out over the
// sleeping lowlands and the Vanguard's campfires, under a sky the eclipse has finally left.
export function paint(P, { R, K, S }) {
  const { hex, sky, stars, moon, clouds, ridgeFn, ridge, fogBand, stand, rimLight, brazier, pillar, sparks } = K;

  sky(P, [[0, hex("#070b1e")], [0.5, hex("#142456")], [0.85, hex("#2f3f7a")], [1, hex("#5a5f9a")]], 0, 170, 3);
  stars(P, R, 260, { y1: 150, big: 0.08 });
  // the milky band of Astraea
  for (let i = 0; i < 900; i++) { const t = R(); const x = t * P.w, y = 20 + t * 70 + R.range(-14, 14) * K.fbm1(t * 9, 3) * 2; P.set(x, y, hex(R.pick(["#c7d2fe", "#e0e7ff", "#a5b4fc"])), R.range(0.2, 0.7)); }
  moon(P, 400, 44, 13, { shadow: 0.5 });
  clouds(P, { y0: 110, y1: 160, cover: 0.62, seed: 21, colors: ["#1c2550", "#2c3a72", "#4c5a98"], stretch: 6 });

  // lowlands with town lights and the Vanguard's camp
  const far = ridgeFn({ base: 158, amp: 26, freq: 0.012, seed: 9, sharp: 0.4 });
  ridge(P, far, "#1d2550", { light: "#2f3b78", snow: "#7e8ac4", snowLine: 140 });
  fogBand(P, 160, 6, "#3c4a86", 0.5, 4);
  const low = ridgeFn({ base: 176, amp: 10, freq: 0.01, seed: 4 });
  ridge(P, low, (x, y, top) => (y - top < 1 ? hex("#2c3866") : K.noise2(x * 0.08, y * 0.2, 3) > 0.55 ? hex("#141c3c") : hex("#18214a")));
  for (let i = 0; i < 70; i++) { const x = R.range(20, 460), y = R.range(low(x) + 2, 196); P.set(x, y, hex(R.pick(["#ffcf7a", "#ffb347", "#fff1c4"]))); if (R.chance(0.3)) P.glow(x, y, 4, hex("#ffb347"), 0.4, 2); }
  for (const [x, y] of [[90, 188], [120, 192], [150, 186]]) { P.glow(x, y, 8, hex("#ff8a3d"), 0.7, 1.8); P.set(x, y, hex("#fff1c4")); }

  // observatory balcony: floor, balustrade, columns, a brass telescope
  P.rect(0, 200, P.w, 70, hex("#3a3550"));
  P.rectF(0, 200, P.w, 70, (x, y) => ((y - 200) % 10 === 0 || (x + Math.floor((y - 200) / 10) * 9) % 24 === 0 ? hex("#2a2640") : K.noise2(x * 0.1, y * 0.1, 2) > 0.7 ? hex("#454062") : null));
  P.rect(0, 196, P.w, 6, hex("#8a86a8")); P.hline(0, P.w, 196, hex("#c6c2de"));
  for (let x = 4; x < P.w; x += 12) { P.rect(x, 202, 5, 14, hex("#6f6a92")); P.vline(x, 202, 215, hex("#a29ec2")); }
  P.rect(0, 216, P.w, 4, hex("#8a86a8"));
  pillar(P, 6, 0, 196, 16, { c: "#5d5880", dark: "#3a3550", lit: "#8a86a8" });
  pillar(P, 458, 0, 196, 16, { c: "#5d5880", dark: "#3a3550", lit: "#8a86a8" });
  // telescope on a tripod
  P.line(360, 252, 372, 222, hex("#5a3a1a")); P.line(384, 252, 372, 222, hex("#5a3a1a")); P.line(372, 254, 372, 222, hex("#5a3a1a"));
  P.thick(358, 226, 392, 206, 4, hex("#c9963a")); P.thick(392, 206, 398, 202, 5, hex("#e5b85a"));
  P.set(394, 204, hex("#fff1c4"));

  // the pair at the balustrade, seen from behind, lit by the moon
  const hero = S.hero("knight", "up"), heir = S.npc("aurelia", "up");
  let [l, t] = stand(P, hero, 226, 236);
  rimLight(P, hero, l, t, "#c7d2fe", 1);
  [l, t] = stand(P, heir, 246, 236);
  rimLight(P, heir, l, t, "#c7d2fe", 1);
  brazier(P, 40, 262, {}); brazier(P, 440, 262, {});
  sparks(P, R, 30, { y0: 170, y1: 260, colors: ["#fde68a", "#c7d2fe"], glowK: 0.15 });
  P.vignette([2, 2, 10], 0.55, 0.62);
}
