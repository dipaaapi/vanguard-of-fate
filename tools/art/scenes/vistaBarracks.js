// Vista — The Barracks Sanctuary by day
// The consecrated courtyard: four perpetual braziers, runic cobblestones, Captain Ronald drilling
// recruits, Edgar's apothecary stall and the mentors' training posts.
export function paint(P, { R, K, S }) {
  const { hex, sky, clouds, ridgeFn, ridge, flagstones, brazier, stand, castle, runeCircle, POINT_COLORS } = K;
  sky(P, [[0, hex("#4a8ad8")], [1, hex("#bfe0fa")]], 0, 110, 3);
  clouds(P, { y0: 10, y1: 80, cover: 0.55, seed: 3, colors: ["#9ac0e8", "#d8e8f8", "#ffffff"], stretch: 4 });
  const hills = ridgeFn({ base: 104, amp: 18, freq: 0.012, seed: 2 });
  ridge(P, hills, "#6aa25a", { light: "#8ac46a" });
  castle(P, 380, 102, { scale: 0.45, style: "imperial", seed: 2 });
  // walls with gate
  P.rect(0, 98, P.w, 34, hex("#a89a84"));
  for (let x = 0; x < P.w; x += 6) P.rect(x, 94, 4, 4, hex("#a89a84"));
  P.rectF(0, 98, P.w, 34, (x, y) => ((y - 98) % 7 === 6 || (x + Math.floor((y - 98) / 7) * 5) % 12 === 0 ? hex("#7a6e5c") : null));
  P.rect(220, 104, 40, 28, hex("#3a2a1a")); P.disc(240, 104, 20, hex("#3a2a1a"));
  flagstones(P, 132, P.h, { c: "#9a8e7c", lit: "#b0a490", dark: "#867a6a", seam: "#5a5044", vx: 240 });
  runeCircle(P, 240, 200, 150, 44, { c: "#fde68a", pointColors: POINT_COLORS, rings: 1, glowK: 0.3 });
  for (const [x, y] of [[40, 150], [440, 150], [20, 262], [460, 262]]) brazier(P, x, y, {});
  // Edgar's stall
  P.rect(60, 152, 60, 4, hex("#5e3f25")); P.rect(60, 156, 60, 18, hex("#7a5534"));
  P.poly([[54, 140], [126, 140], [120, 150], [60, 150]], hex("#2f6b3f"));
  for (let i = 0; i < 6; i++) { P.rect(66 + i * 9, 146, 4, 6, hex(["#f87171", "#4ade80", "#60a5fa", "#facc15", "#c084fc", "#fb923c"][i])); }
  stand(P, S.npc("edgar", "down"), 90, 168);
  // Ronald drilling recruits
  stand(P, S.npc("ronald", "side"), 300, 190, { flip: true });
  for (const [x, y] of [[250, 184], [230, 200], [250, 214], [210, 214]]) stand(P, S.npc("royalGuard", "side"), x, y);
  stand(P, S.npc("arthur", "down"), 380, 230); stand(P, S.npc("renzo", "side"), 340, 244, { flip: true });
  stand(P, S.hero("novice", "up"), 200, 256);
  P.vignette([20, 14, 6], 0.35, 0.68);
  void R;
}
