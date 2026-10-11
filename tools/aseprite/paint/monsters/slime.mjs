// Slime family (SlimeSprite: slimes, the marsh lurker): the glossy jelly from
// tools/aseprite/paint/slime.mjs (the Forest Slime and Pocket Slime), with each monster's own colours
// turned into tile ramps and the tile outline. Colours from the code sprite: base, dark, deep, light, core, eye.
// Code sprite 24×18 (feet 12,16) → painted 32×24 (feet 16,22).
import * as slime from "../slime.mjs";
import { grade, mixHex, finish } from "../monsterkit.mjs";
import { tileShade, hexRgb, rgbHex } from "../../../../js/avatar/tilestyle.js";

export const SIZE = { W: slime.W, H: slime.H };
const S = (h, k) => rgbHex(tileShade(hexRgb(h), k));
const cache = new Map();

function palette(c) {
  const base = grade(c.base), dark = grade(c.dark), deep = grade(c.deep), light = grade(c.light), core = grade(c.core);
  return {
    deep, dark, mid: mixHex(dark, base, 0.5), base, light, hi: S(light, 0.35), spec: S(light, 0.75),
    core, coreD: S(core, -0.25), eye: c.eye, mouth: S(deep, -0.5), tongue: S(dark, -0.2), glow: S(core, 0.5),
    spark: S(light, 0.8), blush: S(base, -0.15)
  };
}

export function paint(sprite, def, dir, anim, i) {
  if (!cache.has(def.key)) cache.set(def.key, palette(sprite.c));
  return finish(slime.paintSlime(dir, anim, i, cache.get(def.key)));
}
