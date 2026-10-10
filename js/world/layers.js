// ==================== WORLD RENDER LAYERS ====================
// main.js renderGameWorld draws the world strictly in this order, every frame:
//   0 OCEAN      deep-water gradient, sea currents, bedrock floor           (js/world/ocean.js)
//   1 GROUND     terrain, turf blades, sand shoreline, landmarks, camps     (tilemap, js/world/grassland.js)
//   2 SHADOWS    contact shadows of props along the sun vector, cloud shade (js/world/props.js)
//   3 PROPS      trees, stones and every character, by the Y of their feet  (js/world/props.js + managers)
//   4 SURFACE    shoreline foam crests and water glints                     (js/world/ocean.js)
//   5 PARTICLES  combat particles, sparks, splashes, damage numbers         (js/fx.js)
//   6 SKY        canopy of the map edge, ambience, weather, mist borders    (js/world/weather.js, ambient.js, edges.js)
//   7 SCREEN     screen-space night, blindness and vignette                 (js/ui.js)
// The static parts of layers 0 and 1 are baked once into the tile map's ground canvas, in layer
// order; their moving parts are drawn only on their own tiles, so the result is the same as
// drawing every layer from scratch at a fraction of the cost.
export const LAYER = Object.freeze({ OCEAN: 0, GROUND: 1, SHADOWS: 2, PROPS: 3, SURFACE: 4, PARTICLES: 5, SKY: 6, SCREEN: 7 });

// Global sun: light from the upper left at 45°, so shadows fall toward the lower right
export const SUN = Object.freeze({ dx: Math.SQRT1_2, dy: Math.SQRT1_2 });
export const SHADOW_COLOR = "rgba(10, 14, 22, 0.45)";

// The world rectangle on screen (from the canvas transform), grown by pad pixels
export function viewOf(ctx, pad = 0) {
  const t = ctx.getTransform ? ctx.getTransform() : { a: 1, d: 1, e: 0, f: 0 };
  const x = -t.e / t.a, y = -t.f / t.d;
  return { x: x - pad, y: y - pad, w: ctx.canvas.width / t.a + pad * 2, h: ctx.canvas.height / t.d + pad * 2 };
}

// Visible tile range of a view (inclusive, clamped to the map)
export function tileSpan(view, tile, cols, rows) {
  return {
    tx0: Math.max(0, Math.floor(view.x / tile)), ty0: Math.max(0, Math.floor(view.y / tile)),
    tx1: Math.min(cols - 1, Math.floor((view.x + view.w) / tile)), ty1: Math.min(rows - 1, Math.floor((view.y + view.h) / tile))
  };
}

// Cheap integer hash → [0, 1) for per-tile variation that never changes between frames
export function hashTile(tx, ty, salt = 0) {
  let h = Math.imul(tx, 374761393) ^ Math.imul(ty, 668265263) ^ Math.imul(salt + 7, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Pixel-stepped ellipse on a small canvas (crisp at any integer scale, unlike an anti-aliased arc)
export function pixelEllipse(rx, ry, color) {
  const w = rx * 2 + 1, h = Math.ceil(ry * 2) + 1;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  if (!g) return c;
  g.fillStyle = color;
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let y = 0; y < h; y++) {
    const dy = (y - cy) / (ry + 0.5);
    const half = Math.round(Math.sqrt(Math.max(0, 1 - dy * dy)) * (rx + 0.5));
    if (half > 0) g.fillRect(Math.round(cx - half) + 1, y, half * 2 - 1, 1);
  }
  return c;
}
