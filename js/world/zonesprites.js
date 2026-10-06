// ==================== SAFE-ZONE ART (Aseprite) ====================
// The sanctuaries' buildings and grounds can come from Aseprite: aseprite/zone/<key>.aseprite, exported
// to assets/sprites/zone/<key>.png by tools/aseprite/export.mjs and loaded with the other sheets
// (js/avatar/sheets.js). Each file has one looping "down-idle" tag (braziers, banners, smoke).
//   zone/barracks   the Barracks Sanctuary on the hub plains, with its two longhouses behind it
//   zone/castle     the Imperial Citadel and its audience dais (the gate portal stays code-drawn)
//   zone/<map id>   a platform's or frontier's camp (zone/ash is Emberhold, the dwarven village)
// Without a sheet the code-drawn art is used (barracks.js, castle.js, Platform.drawCamp).
// The table below is shared with the painter (tools/aseprite/paint/zones.mjs): where the canvas sits
// relative to the zone and which parts are solid, so the drawing and the collisions always agree.
import { sheetFrame, sheetCount, sheetDurations } from "../avatar/sheets.js";

// at: canvas offset from the zone's rectangle (Barracks bounds, castle x/y, camp); solid: [x, y, w, h]
// footprints in canvas pixels that the hero and monsters can't walk through.
export const ZONE_ART = {
  barracks: { at: [0, -76], solid: [[8, 26, 114, 46], [178, 26, 114, 46]] },
  castle: { at: [0, -20], solid: [] },
  ash: { at: [0, -24], solid: [[16, 52, 70, 36], [120, 50, 96, 34], [246, 72, 60, 10], [244, 140, 56, 40]] }
};
// Every other camp: the canvas is the camp plus this margin; tents and props come from campLayout()
export const CAMP_PAD = { x: 8, top: 22, bottom: 8 };

/** Which side of the camp its gateway is on: "top" | "bottom" | "left" | "right". */
export function gateSide(camp, gate) {
  if (gate.dir === "vertical") return gate.x < camp.x + camp.w / 2 ? "left" : "right";
  return gate.y < camp.y + camp.h / 2 ? "top" : "bottom";
}

/**
 * Tents and props of a Fated Vanguard camp, in canvas pixels. They stand on the side away from the
 * gateway (and its arrival point), and the centre stays open for the summoner and the hero.
 */
export function campLayout(camp, gate) {
  const P = CAMP_PAD, W = camp.w + P.x * 2, H = camp.h + P.top + P.bottom;
  const cx = P.x + camp.w / 2, cy = P.top + camp.h / 2;
  const far = gateSide(camp, gate) === "top";       // gate on top: the tents go to the bottom
  const base = far ? cy + 30 : cy - 4;               // ground line of the tents
  const fire = { x: cx - 30, y: far ? cy - 20 : cy + 22 };
  return {
    W, H, cx, cy, far,
    command: { x: cx - 60, y: base, w: 46, h: 34 },  // big tent (x, ground line y, width, height)
    supply: { x: cx + 26, y: base - 2, w: 32, h: 24 },
    banner: { x: cx + 18, y: base },
    crates: { x: far ? cx + 2 : cx + 62, y: base + 2 },
    barrels: { x: far ? cx - 10 : cx - 76, y: base + 2 },
    bedroll: { x: cx - 52, y: far ? base - 34 : base + 10 },
    rack: { x: cx + 34, y: far ? base - 44 : base + 18 },
    fire,
    braziers: [[P.x + 12, P.top + 12], [P.x + camp.w - 16, P.top + 12], [P.x + 12, P.top + camp.h - 16], [P.x + camp.w - 16, P.top + camp.h - 16]],
    solid: [[cx - 58, base - 12, 42, 12], [cx + 28, base - 12, 28, 10]]
  };
}

/** The art entry for a zone key (camps get theirs from the layout). */
function artFor(name, camp, gate) {
  if (ZONE_ART[name]) return ZONE_ART[name];
  if (!camp || !gate) return null;
  const L = campLayout(camp, gate);
  return { at: [-CAMP_PAD.x, -CAMP_PAD.top], solid: L.solid };
}

/** Is there exported art for zone/<name>? */
export const hasZoneArt = (name) => sheetCount(`zone/${name}`, "down", "idle") > 0;

/**
 * Draw zone/<name> with its top-left at the zone rectangle's (x, y) plus the art's offset; `tick` in
 * simulation frames (60 per second). Returns false (and draws nothing) when there is no sheet.
 */
export function drawZoneArt(ctx, name, x, y, tick, camp = null, gate = null) {
  const key = `zone/${name}`, n = sheetCount(key, "down", "idle");
  const art = n ? artFor(name, camp, gate) : null;
  if (!art) return false;
  const dur = sheetDurations(key, "down", "idle");
  const total = dur.reduce((a, b) => a + b, 0) || n * 100;
  let t = ((tick * 1000) / 60) % total, i = 0;
  while (i < n - 1 && t >= (dur[i] || 100)) t -= dur[i++] || 100;
  const img = sheetFrame(key, "down", "idle", i);
  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(x + art.at[0]), Math.round(y + art.at[1]));
  ctx.imageSmoothingEnabled = prev;
  return true;
}

/** Solid footprints of zone/<name> in world pixels ({ x, y, w, h }), placed like drawZoneArt. */
export function zoneSolids(name, x, y, camp = null, gate = null) {
  const art = artFor(name, camp, gate);
  if (!art) return [];
  return art.solid.map(([sx, sy, w, h]) => ({ x: x + art.at[0] + sx, y: y + art.at[1] + sy, w, h }));
}

/** Push an entity's feet (x + 10, y + 18, radius 7) out of the boxes it overlaps. */
export function pushOutOf(entity, boxes) {
  if (!entity || !boxes.length) return;
  const r = 7;
  for (const b of boxes) {
    const fx = entity.x + 10, fy = entity.y + 18;
    if (fx + r <= b.x || fx - r >= b.x + b.w || fy + r <= b.y || fy - r >= b.y + b.h) continue;
    const dl = fx + r - b.x, dr = b.x + b.w - (fx - r), dt = fy + r - b.y, db = b.y + b.h - (fy - r);
    const m = Math.min(dl, dr, dt, db);
    if (m === dl) entity.x -= dl;
    else if (m === dr) entity.x += dr;
    else if (m === dt) entity.y -= dt;
    else entity.y += db;
  }
}
