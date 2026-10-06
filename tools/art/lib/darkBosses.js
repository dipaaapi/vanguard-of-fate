// ==================== DARK CONTINENT BOSSES (scene art) ====================
// Hand-painted figures for the three Book I bosses added with Acts XI, XII and XIV: Dolora the
// Weeping Matron, Morgrave the Ossuary Warlord and Vorgath the Chained Warden. Used by their
// banners and portraits. Each painter takes (P, cx, ground, s): s = 1 is about 56 px tall.
// They are the art reference for the in-game sprites; the game draws its own (bestiary / Aseprite).
import { hex, shadeC, dith, clamp } from "./px.js";

/** Light a painted layer from the upper left: three dithered bands (lit, base, shadow) */
function lightLayer(L, lx, ly, r) {
  for (let y = 0; y < L.h; y++)
    for (let x = 0; x < L.w; x++) {
      if (!L.alpha(x, y)) continue;
      const t = Math.hypot(x - lx, y - ly) / r;
      const c = L.get(x, y);
      if (t > 0.7 && dith(x, y, clamp((t - 0.7) * 3))) L.set(x, y, shadeC(c, -0.35));
      else if (t < 0.35 && dith(x, y, clamp((0.35 - t) * 4))) L.set(x, y, shadeC(c, 0.14));
    }
}
import { outlined, chain } from "./kit.js";

/** Dolora, the Weeping Matron: floating veiled wraith with a tear lantern; black tears run from her eyes */
export function dolora(P, cx, g, s = 1) {
  const q = (v) => v * s;
  const V = hex("#5a5478"), VL = hex("#8a84a8"), VD = hex("#2e2a44"), Face = hex("#cfcadc"), Tear = hex("#05030a");
  outlined(P, (L) => {
    // trailing veil, torn into wisps at the hem
    const hem = [];
    for (let i = 0; i <= 8; i++) hem.push([cx + q(20) - (i * q(40)) / 8, g - q(i % 2 ? 12 : 4 + (i % 4) * 0.8)]);
    L.poly([[cx - q(7), g - q(50)], [cx + q(7), g - q(50)], [cx + q(13), g - q(36)], [cx + q(17), g - q(20)], ...hem, [cx - q(17), g - q(20)], [cx - q(13), g - q(36)]],
      (x, y) => { const f = (x - cx) / q(18); const fold = Math.sin((x - cx) / q(3.2) + (y - g) * 0.04) > 0.75; return f < -0.45 ? VL : f > 0.4 || fold ? VD : V; });
    // sleeves: left hand raised to the face, right holding the lantern out
    L.thick(cx - q(10), g - q(38), cx - q(15), g - q(28), q(5), V);
    L.thick(cx - q(15), g - q(28), cx - q(6), g - q(37), q(4), VL);
    L.thick(cx + q(10), g - q(38), cx + q(19), g - q(30), q(5), VD);
    L.disc(cx - q(5), g - q(37), q(1.6), Face); L.disc(cx + q(20), g - q(29), q(1.6), Face);
    // hood and pale mask
    L.ellipse(cx, g - q(46), q(9), q(9.5), V);
    L.ellipse(cx - q(2), g - q(49), q(5), q(5), VL);
    L.ellipse(cx, g - q(44), q(5), q(6), Face);
    L.ellipse(cx, g - q(40), q(4), q(2), shadeC(Face, -0.2));
    // eyes and the black tears
    for (const k of [-1, 1]) {
      const ex = cx + k * q(2.2), ey = g - q(45);
      L.rect(ex - q(0.8), ey - q(0.4), Math.max(1, q(1.6)), Math.max(1, q(0.9)), Tear);
      L.vline(Math.round(ex), ey + q(0.6), g - q(k < 0 ? 40.5 : 41.5), hex("#2a2440"));
      L.set(Math.round(ex), g - q(k < 0 ? 39.8 : 40.8), Tear);
    }
    L.hline(cx - q(2), cx + q(2), g - q(40.5), shadeC(Face, -0.45));
    // silver circlet with tear drops
    L.hline(cx - q(7), cx + q(7), g - q(51), hex("#c8cde0"));
    for (const k of [-1, 0, 1]) L.vline(cx + k * q(4), g - q(51), g - q(50) + (k ? 0 : 1), hex("#a5b4fc"));
    // tear lantern on a short chain
    L.vline(cx + q(20), g - q(28), g - q(25), hex("#8a8aa0"));
    L.rect(cx + q(17), g - q(25), q(7), q(9), hex("#3a3654"));
    L.rect(cx + q(18), g - q(24), q(5), q(7), hex("#c7d2fe"));
    L.ellipse(cx + q(20.5), g - q(20), q(1.6), q(2.4), hex("#6366f1"));
    L.hline(cx + q(16), cx + q(24), g - q(25), hex("#8a8aa0")); L.hline(cx + q(16), cx + q(24), g - q(16), hex("#8a8aa0"));
  }, "#0a0812");
  P.glow(cx + q(20.5), g - q(20), q(14), hex("#a5b4fc"), 0.9, 1.7);
  P.glow(cx, g - q(45), q(6), hex("#c7d2fe"), 0.35, 2);
  // falling black tears
  for (let i = 0; i < 6; i++) {
    const x = cx - q(14) + i * q(6), y = g - q(2) + (i % 3) * q(3);
    P.disc(x, y, Math.max(0.7, q(0.9)), Tear); P.set(x, y - 1, hex("#6d5ea8"));
  }
}

/** Morgrave, the Ossuary Warlord: giant armoured skeleton general wearing the Lantern Knight's Visor */
export function morgrave(P, cx, g, s = 1) {
  const q = (v) => v * s;
  const Fe = hex("#34323e"), FeL = hex("#5a5866"), FeD = hex("#16141c"), Bone = hex("#e2dac4"), BoneD = hex("#9a9078"), Gold = hex("#d4a73a"), Eye = hex("#d9f99d");
  outlined(P, (L) => {
    // tattered cape
    const hem = []; for (let i = 0; i <= 8; i++) hem.push([cx + q(18) - (i * q(36)) / 8, g - q(4 + (i % 2) * 6 + (i % 3) * 2)]);
    L.poly([[cx - q(14), g - q(48)], [cx + q(14), g - q(48)], ...hem], (x, y) => ((x + y) % 9 === 0 ? hex("#3a0c0c") : hex("#5a1414")));
    // legs: greaves with bone knees
    for (const k of [-1, 1]) {
      L.poly([[cx + k * q(2), g - q(26)], [cx + k * q(9), g - q(26)], [cx + k * q(10), g - q(3)], [cx + k * q(1), g - q(3)]], k < 0 ? FeL : Fe);
      L.rect(cx + k * q(5.5) - q(4.5), g - q(3), q(9), q(3), FeD);
      L.disc(cx + k * q(5.5), g - q(15), q(2.6), Bone);
    }
    // waist: bone pelvis and faulds
    L.rect(cx - q(9), g - q(28), q(18), q(4), FeD);
    for (let i = 0; i < 4; i++) L.rect(cx - q(9) + i * q(4.6), g - q(25), q(4), q(5), i < 2 ? FeL : Fe);
    // torso: breastplate split open over the ribcage
    L.poly([[cx - q(16), g - q(48)], [cx + q(16), g - q(48)], [cx + q(10), g - q(28)], [cx - q(10), g - q(28)]], (x) => (x < cx - q(6) ? FeL : x > cx + q(6) ? FeD : Fe));
    L.poly([[cx - q(6), g - q(46)], [cx + q(6), g - q(46)], [cx + q(4), g - q(30)], [cx - q(4), g - q(30)]], hex("#0e0c12"));
    L.vline(cx, g - q(46), g - q(30), Bone);
    for (let i = 0; i < 4; i++) { const y = g - q(44) + i * q(3.8); L.hline(cx - q(5 - i * 0.4), cx + q(5 - i * 0.4), y, i % 2 ? BoneD : Bone); }
    L.disc(cx, g - q(37), q(1.6), hex("#a3e635"));
    // pauldrons with spikes
    for (const k of [-1, 1]) {
      L.ellipse(cx + k * q(16), g - q(46), q(7), q(5), k < 0 ? FeL : Fe);
      for (let i = 0; i < 3; i++) L.line(cx + k * q(12 + i * 4), g - q(49), cx + k * q(13 + i * 4.5), g - q(55 - i), Bone);
    }
    // left arm: bone forearm and gauntlet; right arm grips the bone greatsword
    L.thick(cx - q(19), g - q(43), cx - q(22), g - q(30), q(3), Bone);
    L.rect(cx - q(25), g - q(31), q(6), q(6), Fe);
    L.thick(cx + q(19), g - q(43), cx + q(23), g - q(32), q(3), Bone);
    L.rect(cx + q(20), g - q(33), q(6), q(5), Fe);
    // greatsword of fused bone, planted point-down
    L.poly([[cx + q(21), g - q(31)], [cx + q(26), g - q(31)], [cx + q(25.5), g - q(2)], [cx + q(23.5), g + q(1)], [cx + q(21.5), g - q(2)]], (x) => (x < cx + q(23.5) ? Bone : BoneD));
    for (let i = 0; i < 5; i++) L.set(cx + q(26), g - q(26) + i * q(5), hex("#0e0c12"));
    L.rect(cx + q(18), g - q(36), q(11), q(2.5), Gold);
    L.rect(cx + q(22), g - q(44), q(3), q(8), BoneD);
    L.disc(cx + q(23.5), g - q(45), q(2), Bone);
    // skull with curling horns and the golden Visor
    L.disc(cx, g - q(54), q(6.5), Bone);
    L.rect(cx - q(4), g - q(49), q(8), q(3.5), BoneD);
    for (let i = 0; i < 4; i++) L.vline(cx - q(3) + i * q(2), g - q(49), g - q(47), Bone);
    for (const k of [-1, 1]) {
      L.thick(cx + k * q(5), g - q(58), cx + k * q(11), g - q(62), q(2.6), BoneD);
      L.thick(cx + k * q(11), g - q(62), cx + k * q(12), g - q(68), q(1.8), Bone);
    }
    L.rect(cx - q(7), g - q(57), q(14), q(4), Gold);
    L.hline(cx - q(7), cx + q(7), g - q(57), hex("#fde68a"));
    L.rect(cx - q(1), g - q(60), q(2), q(3), Gold);
    // plate edges and rivets
    for (const k of [-1, 1]) { L.line(cx + k * q(16), g - q(48), cx + k * q(10), g - q(28), k < 0 ? hex("#7a7888") : FeD); for (let i = 0; i < 3; i++) L.set(cx + k * q(12), g - q(44) + i * q(5), hex("#8a8898")); }
    lightLayer(L, cx - q(14), g - q(60), q(52));
  }, "#0a0a0c");
  // eyes burn through the Visor's slits
  for (const k of [-1, 1]) { P.rect(cx + k * q(3) - q(1), g - q(55.5), Math.max(1, q(2)), Math.max(1, q(1)), Eye); P.glow(cx + k * q(3), g - q(55), q(5), hex("#bef264"), 0.7, 2); }
  P.glow(cx, g - q(37), q(7), hex("#a3e635"), 0.6, 2);
}

/** Vorgath, the Chained Warden: hunched iron colossus bound to the spire by his own chains */
export function vorgath(P, cx, g, s = 1, { freeChains = true } = {}) {
  const q = (v) => v * s;
  const Fe = hex("#2e2a36"), FeL = hex("#4e4858"), FeD = hex("#141118"), Rust = hex("#6a3a2a"), Glow = hex("#ff3b5c");
  outlined(P, (L) => {
    // stubby armoured legs
    for (const k of [-1, 1]) { L.rect(cx + k * q(8) - q(6), g - q(18), q(12), q(16), k < 0 ? FeL : Fe); L.rect(cx + k * q(8) - q(7), g - q(3), q(14), q(3), FeD); }
    // massive barrel body
    L.ellipse(cx, g - q(32), q(21), q(17), Fe);
    L.ellipse(cx - q(7), g - q(37), q(10), q(9), FeL);
    for (let i = 0; i < 4; i++) L.hline(cx - q(18 - i * 2), cx + q(18 - i * 2), g - q(26) + i * q(4), FeD);
    // belt with a ring of keys
    L.rect(cx - q(19), g - q(20), q(38), q(4), Rust);
    L.ring(cx + q(9), g - q(14), q(3.5), q(3.5), hex("#c08a3a"), 1);
    for (let i = 0; i < 3; i++) L.rect(cx + q(7) + i * q(2), g - q(12), 1, q(4 + i), hex("#c08a3a"));
    // shoulders and the low iron mask
    for (const k of [-1, 1]) L.ellipse(cx + k * q(20), g - q(44), q(10), q(7), k < 0 ? FeL : Fe);
    for (const k of [-1, 1]) L.thick(cx + k * q(5), g - q(52), cx + k * q(8), g - q(59), q(2.4), FeL);
    L.ellipse(cx, g - q(49), q(7.5), q(7), FeD);
    L.ellipse(cx - q(1), g - q(50), q(6), q(5.5), Fe);
    L.rect(cx - q(5), g - q(46), q(10), q(3), FeD);
    for (let i = 0; i < 4; i++) L.vline(cx - q(3.5) + i * q(2.3), g - q(46), g - q(44), FeL);
    L.hline(cx - q(5), cx + q(5), g - q(50), Glow);
    L.vline(cx, g - q(56), g - q(51), FeL);
    // heavy arms hanging to the knees, iron manacles
    for (const k of [-1, 1]) {
      L.thick(cx + k * q(24), g - q(42), cx + k * q(28), g - q(18), q(8), k < 0 ? FeL : Fe);
      L.rect(cx + k * q(28) - q(5), g - q(22), q(10), q(4), Rust);
      L.disc(cx + k * q(28), g - q(14), q(5), FeD);
    }
    // riveted plate seams on the barrel and pauldrons
    for (let i = -3; i <= 3; i++) { L.set(cx + i * q(5), g - q(41) + Math.abs(i) * q(1.2), hex("#8a8098")); L.set(cx + i * q(5), g - q(27), hex("#6a6078")); }
    for (const k of [-1, 1]) { L.hline(cx + k * q(14), cx + k * q(28), g - q(40), FeD); L.set(cx + k * q(20), g - q(48), hex("#9a90a8")); }
    lightLayer(L, cx - q(18), g - q(54), q(50));
  }, "#08060a");
  // chains wrapped across the chest
  chain(P, cx - q(20), g - q(44), cx + q(18), g - q(22), { link: Math.max(2, q(2.6)), c: "#6b6470", lit: "#a8a0b4" });
  chain(P, cx + q(20), g - q(44), cx - q(18), g - q(22), { link: Math.max(2, q(2.6)), c: "#6b6470", lit: "#a8a0b4" });
  // broken chain ends dangling from the manacles
  if (freeChains) for (const k of [-1, 1]) chain(P, cx + k * q(28), g - q(20), cx + k * q(34), g - q(4), { link: Math.max(2, q(2.4)), sag: q(3) });
  // furnace-red cracks and the mask slit
  P.glow(cx, g - q(50), q(9), Glow, 0.8, 2);
  P.hline(cx - q(5), cx + q(5), g - q(50), hex("#ffb3c1"));
  for (const [x0, y0, x1, y1] of [[-8, -34, -3, -28], [6, -38, 11, -31], [-1, -24, 3, -20]]) P.line(cx + q(x0), g + q(y0), cx + q(x1), g + q(y1), hex("#ff6b6b"));
  P.glow(cx, g - q(30), q(16), hex("#e11d48"), 0.25, 2);
}
