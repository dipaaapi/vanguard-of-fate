// Act V — The Dual Equipment Matrix & Strategic Warfare
// The Barracks armory: two-handed arms on the left wall, one-hand + offhand pairs on the right,
// and the awakened Knight testing a Bastion Forcefield while Captain Ronald looks on.
export function paint(P, { R, K, S }) {
  const { hex, mixC, shadeC, flagstones, stand, rimLight, brazier, rays, sparks, POINT_COLORS } = K;

  P.layer("wall", 0.3);
  // timber wall with a big window of morning light
  P.rectF(0, 0, P.w, 176, (x, y) => {
    const plank = Math.floor(x / 12);
    const n = K.noise2(plank * 2.1, Math.floor(y / 40) * 1.3, 5);
    if (x % 12 === 0) return hex("#3a2616");
    const base = n > 0.6 ? hex("#7a5534") : n < 0.3 ? hex("#5e3f25") : hex("#6b482b");
    return K.noise2(x * 0.7, y * 0.08, 3) > 0.78 ? shadeC(base, -0.15) : base;
  });
  for (const y of [20, 96, 172]) P.rect(0, y, P.w, 5, hex("#3a2616"));
  P.rect(200, 26, 80, 64, hex("#cfe6ff"));
  P.rectF(200, 26, 80, 64, (x, y) => ((x - 200) % 20 === 0 || (y - 26) % 16 === 0 ? hex("#3a2616") : y > 60 ? hex("#a8d0f5") : null));
  rays(P, 240, 20, 6, "#fff3c4", { start: Math.PI * 0.32, spread: Math.PI * 0.36, len: 260, k: 0.14, width: 0.05 });

  // racks: pegs with the real game icons (two-handed left, one-hand + offhand right)
  const rack = (x0, y0, ids, gap) => {
    P.rect(x0 - 4, y0 + 17, ids.length * gap + 4, 3, hex("#2a1a0e"));
    ids.forEach((id, i) => {
      const x = x0 + i * gap;
      P.rect(x + 6, y0 - 2, 4, 2, hex("#2a1a0e"));
      P.blit(S.icon(id), x, y0);
    });
  };
  // a crest above each wall: two hands vs hand + shield, drawn as simple sigils
  rack(16, 40, ["lance", "claymore", "greatstaff", "scepter", "longbow", "claws"], 28);
  rack(16, 116, ["pike", "composite", "lance", "greatstaff", "scepter", "claws"], 28);
  rack(300, 40, ["broadsword", "tower", "rod", "grimoire", "mace", "rosary"], 28);
  rack(300, 116, ["crossbow", "traps", "knuckle", "talisman", "broadsword", "tower"], 28);
  for (const [x, two] of [[90, true], [384, false]]) {
    P.disc(x, 8, 7, hex("#8b1e1e")); P.ring(x, 8, 7, 7, hex("#e0b84a"));
    if (two) { P.rect(x - 4, 6, 3, 5, hex("#fde68a")); P.rect(x + 1, 6, 3, 5, hex("#fde68a")); }
    else { P.rect(x - 4, 6, 3, 5, hex("#fde68a")); P.rect(x + 1, 5, 4, 6, hex("#93c5fd")); }
  }

  P.layer("floor", 0.75);
  // floor and a weapon table
  flagstones(P, 176, P.h, { c: "#5b5160", lit: "#6c6272", dark: "#4a414f", seam: "#2c2630", vx: 240 });
  P.rect(40, 210, 110, 8, hex("#5e3f25")); P.rect(40, 210, 110, 2, hex("#8a6440"));
  P.rect(44, 218, 4, 22, hex("#3a2616")); P.rect(142, 218, 4, 22, hex("#3a2616"));
  P.blit(S.icon("helm"), 52, 196); P.blit(S.icon("gauntlets"), 76, 196); P.blit(S.icon("plate"), 100, 196); P.blit(S.icon("boots"), 124, 196);

  P.layer("actors", 1);
  // the Knight with a Bastion Forcefield, Captain Ronald and recruits
  const kx = 250, kg = 236;
  const knight = S.hero("knight", "side", "attack", 1);
  P.wash(kx, kg - 16, 30, 26, hex("#60a5fa"), 0.5);
  stand(P, knight, kx, kg);
  P.ring(kx, kg - 16, 26, 24, hex("#93c5fd"));
  P.ring(kx, kg - 16, 25, 23, hex("#60a5fa"));
  for (let i = 0; i < 16; i++) { const a = R.range(0, Math.PI * 2); P.line(kx + Math.cos(a) * 18, kg - 16 + Math.sin(a) * 17, kx + Math.cos(a + 0.3) * 25, kg - 16 + Math.sin(a + 0.3) * 23, hex("#dbeafe")); }
  P.glow(kx, kg - 16, 34, hex("#60a5fa"), 0.4, 1.4);
  stand(P, S.npc("ronald", "side"), 340, 232, { flip: true });
  stand(P, S.monster("skeleton", "side"), 180, 236);   // training dummy stand-in: a captured skeleton lancer in chains
  P.line(166, 214, 194, 214, hex("#9ca3af"));
  stand(P, S.npc("royalGuard", "up"), 400, 262);
  brazier(P, 460, 200, {});
  P.layer("weather", 1.2, { skip: true });   // live HD particles replace the baked ones
  sparks(P, R, 40, { x0: 200, x1: 300, y0: 190, y1: 250, colors: ["#dbeafe", "#93c5fd"], glowK: 0.3 });
  P.vignette([12, 6, 4], 0.5, 0.62);
}
