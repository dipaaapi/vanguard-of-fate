// ==================== EFFECT SPRITES (Aseprite) ====================
// Skill and hit effects drawn from aseprite/fx/<name>.aseprite (exported to assets/sprites/fx/,
// one "down-play" tag). drawFx returns false when the sheet isn't loaded, so callers keep their
// code-drawn effect as the fallback. "Tint" sheets are painted in greys and coloured here, so one
// slash or bolt serves every element; tinted copies are cached per frame and colour.
import { sheetCount, sheetFrame } from "./avatar/sheets.js";

const tints = new Map();

function tinted(img, color, key) {
  const k = `${key}|${color}`;
  let c = tints.get(k);
  if (!c) {
    c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = "source-atop";
    g.globalAlpha = 0.65;
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    tints.set(k, c);
  }
  return c;
}

/** Frames in an effect (0 = not loaded). */
export const fxFrames = (name) => sheetCount(`fx/${name}`, "down", "play");

/**
 * Draw frame `i` of effect `name` at (x, y). o: rot (radians), w / h or scale (size), ax / ay (anchor,
 * 0..1 of the image; default centre), alpha, tint (colour), once (hold the last frame instead of looping).
 */
export function drawFx(ctx, name, i, x, y, o = {}) {
  const n = fxFrames(name);
  if (!n) return false;
  const k = o.once ? Math.max(0, Math.min(n - 1, Math.floor(i))) : ((Math.floor(i) % n) + n) % n;
  let img = sheetFrame(`fx/${name}`, "down", "play", k);
  if (!img) return false;
  if (o.tint) img = tinted(img, o.tint, `${name}|${k}`);
  const s = o.scale || 1;
  const w = o.w || (o.h ? (o.h * img.width) / img.height : img.width * s);
  const h = o.h || (o.w ? (o.w * img.height) / img.width : img.height * s);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (o.rot) ctx.rotate(o.rot);
  if (o.alpha != null) ctx.globalAlpha *= Math.max(0, Math.min(1, o.alpha));
  ctx.drawImage(img, -w * (o.ax ?? 0.5), -h * (o.ay ?? 0.5), w, h);
  ctx.restore();
  return true;
}
