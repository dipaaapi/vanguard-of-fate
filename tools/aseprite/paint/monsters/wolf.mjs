// Four-legged family (WolfSprite: wolves, hounds, jackals, hyenas, lynxes, stalkers): the detailed
// quadruped from tools/aseprite/paint/beast.mjs (the War Hound and Spirit Fox familiars), with each
// monster's own fur colours turned into tile ramps and the tile outline. Colours from the code sprite:
// fur/furD/furDD/furL (or body/bodyD/bodyL, which some monsters set instead), belly, eye.
// Code sprite 34×24 (feet 17,22) → painted 40×28 (feet 20,26), the same canvas as the familiars.
import * as beast from "../beast.mjs";
import { grade, mixHex, finish, eyeCol, rgb } from "../monsterkit.mjs";
import { tileShade, hexRgb, rgbHex } from "../../../../js/avatar/tilestyle.js";

export const SIZE = { W: beast.W, H: beast.H };
const S = (h, k) => rgbHex(tileShade(hexRgb(h), k));

function palette(key, c) {
  const fur = grade(c.body || c.fur), dark = grade(c.bodyD || c.furD), light = grade(c.bodyL || c.furL);
  const belly = grade(c.body ? mixHex(c.bodyL, "#f5f5f4", 0.4) : c.belly);
  const eye = c.eye || "#ff0055";
  return {
    fur, furD: dark, furDD: S(dark, -0.45), furL: light, hi: S(light, 0.35), belly, bellyD: S(belly, -0.25),
    eye, nose: S(dark, -0.7), fang: "#ffffff", outline: null, mouth: S(fur, -0.75),
    aura: eye, spark: S(eye, 0.6),
    ears: /jackal|lynx|hyena|stalker/i.test(key) ? "big" : "pointy",
    earTip: S(dark, -0.5),
    tail: /hound|hyena|lynx/i.test(key) ? "short" : "bushy", tip: /alpha|wolf|stalker/i.test(key) ? S(light, 0.3) : light,
    ...(/hell|barrow/i.test(key) ? { collar: "#3f3f46", stud: eye } : {}),
    ...(/alpha|iron/i.test(key) ? { plate: "#94a3b8", plateL: "#e2e8f0", plateD: "#334155" } : {})
  };
}

export function paint(sprite, def, dir, anim, i) {
  if (anim === "idle") i %= 4;   // the shared painter breathes over four frames; the sheet repeats them (blink last)
  if (!beast.KINDS[`monster:${def.key}`]) beast.KINDS[`monster:${def.key}`] = palette(def.key, sprite.c);
  const k = beast.KINDS[`monster:${def.key}`];
  eyeCol(rgb(k.eye)); eyeCol(rgb(k.spark));
  return finish(beast.paintBeast(`monster:${def.key}`, dir, anim, i));
}
