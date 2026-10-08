// Portrait cards — one per lore character, drawn with the character's in-game sprite on a backdrop
// in their colour, so dialogue boxes, the Codex or a future gallery can use them as-is.
// Humanoids: 40×44 at ×8. Malakor and the Leviathan: 96×96 at ×4; the other Heralds, Satan and the Dark
// Continent bosses (Dolora, Morgrave, Vorgath): 64×64 at ×6. The last three are painted by lib/darkBosses.js.
import * as DB from "../lib/darkBosses.js";
export const BOSSES = ["malakor", "leviathan", "cryonix", "ignis", "commander", "satan", "dolora", "morgrave", "vorgath"];
const PAINTED = { dolora: [DB.dolora, 0.95, 4], morgrave: [DB.morgrave, 0.8, 0], vorgath: [DB.vorgath, 0.92, 0] };

// backdrop colour per character (discipline colours for the five Earthbound veterans)
const THEME = {
  aurelia: ["#1e3a8a", "#93c5fd"], kenneth: ["#1e3a8a", "#93c5fd"], king: ["#7f1d1d", "#fde68a"], lanternKnight: ["#3a2a0a", "#ffd27a"],
  arthur: ["#1e3a6a", "#60a5fa"], lyra: ["#14532d", "#4ade80"], julian: ["#5a4a10", "#fde68a"], sam: ["#3b1a6a", "#c084fc"], renzo: ["#6a1414", "#f87171"],
  ronald: ["#3a2a1a", "#d6a46a"], edgar: ["#1a3a2a", "#86efac"], brakka: ["#4a1a0a", "#fb923c"], elvenMatriarch: ["#1a3a3a", "#a7f3d0"],
  malakor: ["#14240e", "#86efac"], leviathan: ["#061a2e", "#22d3ee"], cryonix: ["#1a2a40", "#e0f2fe"], ignis: ["#2a0a04", "#fb923c"], commander: ["#2a0408", "#ff3b3b"], satan: ["#12041e", "#c084fc"],
  maren: ["#1e2a3a", "#fde68a"], isolde: ["#0c2a4a", "#7dd3fc"], veyra: ["#2a0a10", "#f87171"], aldric: ["#3a2a0a", "#ffd27a"],
  dolora: ["#140f24", "#a5b4fc"], morgrave: ["#1a1a14", "#d9f99d"], vorgath: ["#1a0614", "#e11d48"]
};

export function paint(P, { K, S, arg }) {
  const { hex, mixC, shadeC, stand, rimLight } = K;
  const [bg, glow] = THEME[arg].map(hex);
  // backdrop: dark-to-colour radial with a dithered halo behind the head
  P.rectF(0, 0, P.w, P.h, (x, y) => K.rampAt([[0, mixC(bg, [255, 255, 255], 0.08)], [0.6, bg], [1, shadeC(bg, -0.6)]], Math.hypot(x - P.w / 2, y - P.h * 0.4) / (P.w * 0.75), x, y, 3));
  P.glow(P.w / 2, P.h * 0.38, P.w * 0.45, glow, 0.5, 1.6);
  const boss = BOSSES.includes(arg);
  if (PAINTED[arg]) {
    const [fn, sc, lift] = PAINTED[arg];
    P.ellipse(P.w / 2, P.h - 7, 16, 2, shadeC(bg, -0.7));
    fn(P, P.w / 2, P.h - 6 - lift, sc);
    border(P, bg, glow, hex, mixC, shadeC);
    return;
  }
  const frame = boss ? S.boss(arg, "down") : arg === "lanternKnight" ? S.lanternKnight("down") : S.npc(arg, "down");
  const ground = boss ? P.h - 6 : P.h - 2;
  P.ellipse(P.w / 2, ground - 1, frame.width * 0.35, 2, shadeC(bg, -0.7));
  const [l, t] = stand(P, frame, P.w / 2, ground, { shadow: false });
  rimLight(P, frame, l, t, mixC(glow, [255, 255, 255], 0.3).map(Math.round).reduce((s, v) => s + v.toString(16).padStart(2, "0"), "#"), 1);
  if (arg === "aldric") { P.glow(P.w / 2 - 9, ground - 14, 9, hex("#ffd27a"), 0.9, 1.8); P.rect(P.w / 2 - 11, ground - 17, 4, 5, hex("#fff1c4")); P.hline(P.w / 2 - 11, P.w / 2 - 8, ground - 18, hex("#8a6a2a")); P.hline(P.w / 2 - 11, P.w / 2 - 8, ground - 12, hex("#8a6a2a")); }
  if (arg === "lanternKnight") { P.glow(P.w / 2 + 9, ground - 16, 10, hex("#ffd27a"), 0.9, 1.8); P.rect(P.w / 2 + 7, ground - 19, 4, 6, hex("#fff1c4")); P.hline(P.w / 2 + 7, P.w / 2 + 10, ground - 20, hex("#8a6a2a")); }
  border(P, bg, glow, hex, mixC, shadeC);
}

// frame: two-tone border with gold corners
function border(P, bg, glow, hex, mixC, shadeC) {
  const Fd = shadeC(bg, -0.75), Fl = mixC(glow, [255, 255, 255], 0.2);
  for (let x = 0; x < P.w; x++) { P.set(x, 0, Fd); P.set(x, P.h - 1, Fd); P.set(x, 1, Fl, 0.6); P.set(x, P.h - 2, Fl, 0.6); }
  for (let y = 0; y < P.h; y++) { P.set(0, y, Fd); P.set(P.w - 1, y, Fd); P.set(1, y, Fl, 0.6); P.set(P.w - 2, y, Fl, 0.6); }
  for (const [x, y] of [[1, 1], [P.w - 4, 1], [1, P.h - 4], [P.w - 4, P.h - 4]]) P.rect(x, y, 3, 3, hex("#e0b84a"));
}
