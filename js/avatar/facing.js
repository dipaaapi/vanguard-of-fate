// ==================== 8-WAY FACING ====================
// Sprites face eight ways from five drawn views, the right-facing ones mirrored for the left:
//   down · dside (toward the viewer, three-quarter) · side · uside (away, three-quarter) · up
// `dir` stays the 3-way facing the game logic uses (down | side | up: aim, hitboxes, rolls); `view` is
// only for drawing. A sprite without a diagonal view (an older sheet or a code-drawn creature) shows its
// side view on the diagonals, so nothing ever goes missing.

export const VIEWS = ["down", "dside", "side", "uside", "up"];
const DIAGONAL = new Set(["dside", "uside"]);
export const isDiagonal = (v) => DIAGONAL.has(v);
/** Views that are drawn facing right and mirrored for the left. */
export const sideways = (v) => v === "side" || v === "dside" || v === "uside";

// sector edges in degrees below (+) / above (-) the horizontal, with a little hysteresis so a
// creature moving along a sector edge doesn't flicker between two views
const SECTOR = { up: [-90, -67.5], uside: [-67.5, -22.5], side: [-22.5, 22.5], dside: [22.5, 67.5], down: [67.5, 90] };
const STICK = 8;

/**
 * Facing for a move or aim (dx, dy): { dir, flip, view }. prev is the actor's last facing (keeps the
 * mirror on straight up/down moves and the view near a sector edge).
 */
export function facing8(dx, dy, prev = { dir: "down", flip: false, view: "down" }) {
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return { dir: prev.dir || "down", flip: !!prev.flip, view: prev.view || prev.dir || "down" };
  const a = Math.atan2(dy, Math.abs(dx)) * 180 / Math.PI;           // -90 (up) … 90 (down)
  let view = Object.keys(SECTOR).find((k) => a >= SECTOR[k][0] && a <= SECTOR[k][1]) || "side";
  const p = prev.view && SECTOR[prev.view];
  if (p && view !== prev.view && a >= p[0] - STICK && a <= p[1] + STICK) view = prev.view;
  const dir = Math.abs(dx) >= Math.abs(dy) * 0.8 ? "side" : dy < 0 ? "up" : "down";
  const flip = Math.abs(dx) < 0.01 ? !!prev.flip : dx < 0;
  return { dir, flip, view };
}

/** Store a facing8 result on an actor (dir, flip, and the view with the dir it belongs to). */
export function applyFacing(a, f) {
  a.dir = f.dir; a.flip = f.flip; a.view = f.view; a.viewDir = f.dir;
  return a;
}
/** The view to draw an actor in: its 8-way view, unless something set its dir directly since. */
export const drawView = (a) => (a.view && a.viewDir === a.dir ? a.view : a.dir);
