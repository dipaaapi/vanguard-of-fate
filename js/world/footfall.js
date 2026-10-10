// ==================== FOOTFALL (water and grass underfoot) ====================
// Every frame main.js hands over who walks and what flies; this turns it into feedback:
// - a stride (every STRIDE pixels walked) on the wet shore: a small splash, and for the hero a
//   wet step; in tall grass and flowers the hero's step brushes through it;
// - a shot that ends over the water (an arrow, a bolt, a meteor, a boss orb): a full splash.
// Only real water splashes (js/world/ocean.js decides which liquids are water).

const STRIDE = 14;
// Projectiles that land at one point (area spells such as the thunderstorm or arrow rain don't splash)
const SHOTS = new Set(["arrow", "bolt", "crossbow", "wand", "axe", "meteor"]);

export class Footfall {
  constructor() {
    this.walked = new WeakMap();   // actor → { x, y, d }
    this.flying = new Set();       // shots alive last frame
  }

  reset() {
    this.walked = new WeakMap();
    this.flying = new Set();
  }

  // walkers: [{ ref, x, y, hero }] (x, y = the feet); shots: player/mercenary projectiles; orbs: boss orbs
  update(stage, walkers, shots, orbs, fx, sound, onScreen) {
    const tm = stage && stage.tilemap;
    const ocean = tm && tm.ocean, grass = tm && tm.grass;
    if (!ocean || !grass) return;

    for (const w of walkers) {
      let s = this.walked.get(w.ref);
      if (!s) { this.walked.set(w.ref, { x: w.x, y: w.y, d: 0 }); continue; }
      const step = Math.hypot(w.x - s.x, w.y - s.y);
      s.x = w.x; s.y = w.y;
      if (step > 24) { s.d = 0; continue; }   // teleported, warped or knocked far: not a step
      s.d += step;
      if (s.d < STRIDE) continue;
      s.d = 0;
      if (ocean.isShoreAt(w.x, w.y)) {
        if (onScreen(w.x, w.y)) fx.spawnWaterSplash(w.x, w.y, true);
        if (w.hero && sound.playWaterStep) sound.playWaterStep(w.x, w.y);
      } else if (w.hero && grass.isFloraAt(w.x, w.y) && sound.playGrassBrush) {
        sound.playGrassBrush(w.x, w.y);
      }
    }

    // Shots that disappeared since last frame: did they come down on the water?
    if (!ocean.enabled) { this.flying.clear(); return; }
    const now = new Set();
    for (const p of shots) if (SHOTS.has(p.type)) now.add(p);
    for (const o of orbs) if (o.life > 0) now.add(o);
    for (const p of this.flying) {
      if (now.has(p)) continue;
      const x = p.type === "meteor" ? p.targetX : p.x, y = p.type === "meteor" ? p.targetY : p.y;
      if (typeof x !== "number" || !ocean.isWaterAt(x, y) || !onScreen(x, y)) continue;
      fx.spawnWaterSplash(x, y);
      if (sound.playWaterSplash) sound.playWaterSplash(x, y);
    }
    this.flying = now;
  }
}
