import { GrasslandSystem } from "./world/grassland.js";
import { BarracksSystem } from "./world/barracks.js";
import { CastleSystem } from "./world/castle.js";
import { PortalSystem } from "./world/portal.js";
import { WeatherSystem } from "./world/weather.js";
import { TileMap } from "./world/tilemap.js";

// The plains of Aethelgard (Acts I–VI): Barracks, Citadel and the 4 Warp Gateways.
// The boat and the sea are in the Cerulean Abyss (the "coast" platform).
// The platforms of Acts VII–XII live in js/world/platform.js (same interface).
export class Stage {
  constructor(width = 1280, height = 960) {
    this.id = "hub";
    this.theme = "aethelgard";
    this.width = width;
    this.height = height;

    this.bounds = {
      minX: 42,
      maxX: this.width - 58,
      minY: 42,
      maxY: this.height - 58
    };

    // Subsystems
    this.grassland = new GrasslandSystem(this.width, this.height);
    this.barracks = new BarracksSystem(this.width, this.height);
    this.castle = new CastleSystem(this.width, this.height);
    this.portals = new PortalSystem(this.width, this.height);
    this.weather = new WeatherSystem(this.width, this.height);

    // Shortcut for gameplay safe-zone checks
    this.safeZone = this.barracks.bounds;

    // Audience dais in front of the Citadel gate: no trees or rocks (the King, summoner and mentors stand here)
    const gate = this.castle.gatePortal;
    this.dais = { x: gate.x - 110, y: gate.y - 4, w: 220, h: 128 };
    this.clearAreas = [this.dais];

    // Sacred places monsters cannot enter: the Barracks and the Citadel's audience dais
    this.safeZones = [this.safeZone, this.dais];

    // Tile-based ground (grass, paths, trees, rocks). Built last because it reads
    // where the castle, barracks and portals are drawn.
    this.tilemap = new TileMap(this);
  }

  // Impassable tiles (trees, rocks)
  resolveTileCollision(entity) {
    if (this.tilemap) this.tilemap.resolveCollision(entity);
  }

  // Tree canopy: drawn ABOVE the characters
  drawOverlay(ctx, player = null) {
    if (this.tilemap) this.tilemap.drawOverlay(ctx);
    // Weather above everything on the ground: clouds, rain/fog tint, and the cloud banks at the map edges
    this.weather.drawSkyClouds(ctx, player);
    this.weather.drawWeatherOverlay(ctx);
    this.weather.drawCloudBorders(ctx);
  }

  // Which sanctuary contains the point (or null)
  safeZoneAt(px, py) {
    return this.safeZones.find((s) => px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) || null;
  }

  isInsideSafeZone(px, py) {
    return Boolean(this.safeZoneAt(px, py));
  }

  // Where the player comes out when returning from a platform
  arrivalFrom(platformId) {
    if (platformId === "siege") return { x: this.castle.gatePortal.x - 10, y: this.castle.gatePortal.y + 40 };
    const gate = this.portals.portals.find((p) => p.dest === platformId);
    return gate ? this.portals.exitPoint(gate.id) : { x: this.safeZone.x + this.safeZone.w / 2 - 10, y: this.safeZone.y + this.safeZone.h - 30 };
  }

  update(player, onWarp) {
    // 1. Environment Updates
    this.grassland.update();
    this.barracks.update();
    this.castle.update();
    this.portals.update(player, onWarp);
    this.weather.update();

    // 2. Solid Castle Physics
    if (player && this.castle) {
      this.castle.resolveCollision(player);

      // Citadel gate: main.js decides (it is a shortcut back to the Barracks)
      const gp = this.castle.gatePortal;
      const d = Math.hypot(player.x + 10 - gp.x, player.y + 18 - gp.y);
      if (d < 18 && (!player.portalCooldown || player.portalCooldown <= 0)) {
        player.portalCooldown = 75;
        if (onWarp) onWarp({ id: "CITADEL_GATE", dest: "siege", color: "#38bdf8" });
      }
    }
  }

  draw(ctx) {
    // 1. Base Natural Ground (tile-based)
    this.tilemap.drawGround(ctx);

    // 2. Corner Landmark (Fortress Citadel)
    this.castle.draw(ctx);

    // 3. Central Sanctuary Platform
    this.barracks.draw(ctx);

    // 4. 4-Way Warp Portals
    this.portals.draw(ctx);

    // 5. Cloud shadows on the ground (the clouds themselves are drawn above the characters)
    this.weather.drawCloudShadows(ctx);
  }
}