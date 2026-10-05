// Detailed Guardian Angel (44×44, feet at 22,42 = the Avatar's 16,34 on a bigger canvas):
// the game's own Avatar body (gown, halo, sword) without its small wings, plus large feathered wings
// that beat with each animation, a glowing halo, holy light and sparkles.
// idle 4, walk 6, run 6, attack 4, skill 6 (sword raised in a pillar of light) per direction.
import { Canvas, hex, fromGame } from "./kit.mjs";

export const W = 44, H = 44;
const OX = 6, OY = 8;      // where the 32×36 Avatar frame sits
export const FRAMES = { idle: 4, walk: 6, run: 6, attack: 4, skill: 6 };
export const DURATIONS = { idle: 0.18, walk: 0.1, run: 0.08, attack: 0.1, skill: 0.09 };

export const LOOK = {
  body: "female", skin: "#ffe8d6", eyes: "#2f6db5", hairStyle: "long", hairColor: "#ece0b8",
  outfit: "gown", outfitColor: "#ffffff", legColor: "#ffffff", gloves: "none", legs: "pants",
  boots: "sandals", bootColor: "#e0b44c", headgear: "halo", weapon: "sword"
};
const C = {
  f0: hex("#ffffff"), f1: hex("#eef4ff"), f2: hex("#d4e2f7"), f3: hex("#a9bede"), f4: hex("#7f98bf"),
  outline: hex("#3a4766"), gold: hex("#ffd166"), goldL: hex("#fff3c4"), light: hex("#fffbe6"), cyan: hex("#a5f3fc")
};

// Wing raise per frame (radians; + = up) and spread (feather length scale)
const FLAP = {
  idle: [[0.15, 1], [0.05, 1], [-0.05, 0.98], [0.05, 1]],
  walk: [[0.5, 1], [0.25, 1.05], [-0.1, 1.05], [-0.35, 1], [-0.1, 1], [0.25, 1]],
  run: [[0.7, 1.05], [0.3, 1.1], [-0.25, 1.1], [-0.55, 1], [-0.2, 1.05], [0.35, 1.1]],
  attack: [[0.6, 1.1], [-0.2, 1.15], [-0.3, 1.1], [0.1, 1]],
  skill: [[0.3, 1], [0.5, 1.05], [0.7, 1.1], [0.9, 1.15], [0.95, 1.2], [0.6, 1.1]]
};

/** One wing: a fan of feathers from the root; side = -1 (left) or 1 (right). */
function wing(f, rx, ry, side, raise, spread, compact = 1) {
  const feathers = 7;
  for (let k = feathers - 1; k >= 0; k--) {
    const u = k / (feathers - 1);                       // 0 = top (leading) feather, 1 = lowest
    const a = (-1.25 + u * 1.8 - raise * (1 - u * 0.5));   // angle below horizontal
    const len = (17 - Math.abs(u - 0.3) * 9) * spread * compact;
    const tx = rx + side * Math.cos(a) * len, ty = ry + Math.sin(a) * len;
    const col = (t) => (t < 0.35 ? C.f0 : t < 0.65 ? C.f1 : t < 0.85 ? C.f2 : C.f3);
    f.line(rx, ry, tx, ty, k < 2 ? 3 : 2, col);
    f.set(tx, ty, C.f4);
  }
  // coverts: a soft white patch over the feather roots
  f.blob(rx + side * 3 * compact, ry - 2 - raise * 2, 3.5 * compact, 2.5, [C.f2, C.f1, C.f0, C.f0]);
}

export async function prepare() {
  const { load } = await import(new URL("../../../scripts/headless.mjs", import.meta.url).href);
  const { Avatar } = await load("js/avatar/avatar.js");
  const body = new Avatar(LOOK);
  return {
    paint(dir, anim, i) {
      const f = new Canvas(W, H);
      const [raise, spread] = FLAP[anim][i];
      const src = {
        idle: ["idle", i % 2], walk: ["walk", Math.floor(i * 4 / 6)], run: ["run", Math.floor(i * 4 / 6)],
        attack: ["attack", [0, 1, 1, 0][i]], skill: ["attack", 0]
      }[anim];
      const fig = fromGame(body.frame(dir, src[0], src[1]));
      const sy = OY + 16;                                   // shoulder row
      const glow = anim === "skill" ? i : 0;

      // holy pillar behind everything while the skill builds
      if (anim === "skill" && i >= 2) {
        // light rays falling around her: thin broken columns that widen as the skill builds
        const w = Math.min(9, 3 + i * 1.5);
        [-w, -w / 2, w / 2, w].forEach((x, r) => {
          for (let y = (i * 3 + r * 5) % 4; y < H - 4; y += 4) { f.spark(22 + x, y, r % 3 ? C.goldL : C.light); f.spark(22 + x, y + 1, C.light); }
        });
      }
      // wings behind the body (down / side); in front for the back view
      const wings = () => {
        if (dir === "side") {
          wing(f, OX + 13, sy - 3, -1, raise + 0.15, spread * 0.85, 0.9);   // far wing, higher
          wing(f, OX + 10, sy - 1, -1, raise, spread, 1);                 // near wing sweeps back
        } else {
          wing(f, OX + 12, sy - 2, -1, raise, spread);
          wing(f, OX + 19, sy - 2, 1, raise, spread);
        }
      };
      if (dir !== "up") wings();
      if (dir === "up") f.blit(fig, OX, OY);
      if (dir === "up") wings();
      else f.blit(fig, OX, OY);
      f.outline(C.outline);
      // re-draw the figure's own pixels over the wing outline where they overlap
      if (dir !== "up") f.blit(fig, OX, OY);

      // halo glow (the Avatar's halo sits about 2px above the head)
      const hy = OY - 1, hx = OX + 16;
      for (let x = -5; x <= 5; x += 2) if (!f.get(hx + x, hy - 1)) f.spark(hx + x, hy - 1 - (Math.abs(x) > 3 ? 0 : 1), (x + i) % 4 ? C.goldL : C.gold);
      // sparkles drifting off the wings
      const n = anim === "idle" ? 2 : anim === "skill" ? 4 + i : 3;
      for (let j = 0; j < n; j++) {
        const x = 4 + ((j * 13 + i * 5) % 36), y = 6 + ((j * 7 + i * 3) % 30);
        if (!f.get(x, y)) f.spark(x, y, j % 2 ? C.goldL : C.cyan);
      }
      if (anim === "attack" && i === 1) {   // flash where the sword lands
        const x = dir === "side" ? 38 : dir === "down" ? 33 : 11, y = 30;
        [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, -2], [-2, 2]].forEach(([dx, dy]) => f.spark(x + dx, y + dy, C.light));
      }
      if (anim === "skill" && i === 5) for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) f.spark(22 + Math.cos(a) * 18, 26 + Math.sin(a) * 6, C.gold, true);
      if (glow >= 3) for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) f.spark(22 + Math.cos(a + i) * 12, 18 + Math.sin(a + i) * 12, C.goldL);
      return f;
    }
  };
}
