import { GrasslandSystem } from "./world/grassland.js";
import { BarracksSystem } from "./world/barracks.js";
import { CastleSystem } from "./world/castle.js";
import { PortalSystem } from "./world/portal.js";
import { WeatherSystem } from "./world/weather.js";
import { TileMap } from "./world/tilemap.js";

// Ang kaparangan ng Aethelgard (Acts I–VI): Barracks, Citadel at ang 4 na Warp Gateway.
// Ang bangka at dagat ay nasa Cerulean Abyss (platform na "coast").
// Ang mga platform ng Acts VII–XII ay nasa js/world/platform.js (parehong interface).
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

    // Shortcut para sa gameplay safe zone checks
    this.safeZone = this.barracks.bounds;

    // Audience dais sa harap ng Citadel gate: walang puno o bato (dito ang Hari, tagapagtawag at mga mentor)
    const gate = this.castle.gatePortal;
    this.dais = { x: gate.x - 110, y: gate.y - 4, w: 220, h: 128 };
    this.clearAreas = [this.dais];

    // Mga sagradong lugar na hindi mapapasok ng halimaw: Barracks at ang audience dais ng Citadel
    this.safeZones = [this.safeZone, this.dais];

    // Tile-based na lupa (damo, landas, puno, bato). Huling ginagawa dahil binabasa nito
    // kung saan nakaguhit ang castle, barracks at portals.
    this.tilemap = new TileMap(this);
  }

  // Hindi madaanan na tiles (puno, bato)
  resolveTileCollision(entity) {
    if (this.tilemap) this.tilemap.resolveCollision(entity);
  }

  // Canopy ng mga puno: tinatawag SA IBABAW ng mga karakter
  drawOverlay(ctx) {
    if (this.tilemap) this.tilemap.drawOverlay(ctx);
  }

  // Aling sanctuary ang kinaroroonan ng punto (o null)
  safeZoneAt(px, py) {
    return this.safeZones.find((s) => px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) || null;
  }

  isInsideSafeZone(px, py) {
    return Boolean(this.safeZoneAt(px, py));
  }

  // Kung saan lalabas ang player pagbalik mula sa isang platform
  arrivalFrom(platformId) {
    if (platformId === "siege") return { x: this.castle.gatePortal.x - 10, y: this.castle.gatePortal.y + 40 };
    const gate = this.portals.portals.find((p) => p.dest === platformId);
    return gate ? this.portals.exitPoint(gate.id) : { x: this.safeZone.x + this.safeZone.w / 2 - 10, y: this.safeZone.y + this.safeZone.h - 30 };
  }

  update(player, onWarp, enemyManager = null, fx = null) {
    // 1. Environment Updates
    this.grassland.update();
    this.barracks.update();
    this.castle.update();
    this.portals.update(player, onWarp);
    this.weather.update();

    // 2. Solid Castle Physics
    if (player && this.castle) {
      this.castle.resolveCollision(player);

      // Gate ng Citadel: sa main.js ang pasya (Barracks, o ang kinubkob na Citadel sa Act XI)
      const gp = this.castle.gatePortal;
      const d = Math.hypot(player.x + 10 - gp.x, player.y + 18 - gp.y);
      if (d < 18 && (!player.portalCooldown || player.portalCooldown <= 0)) {
        player.portalCooldown = 75;
        if (onWarp) onWarp({ id: "CITADEL_GATE", dest: "siege", color: "#38bdf8" });
      }
    }
  }

  draw(ctx, player = null) {
    // 1. Base Natural Ground (tile-based)
    this.tilemap.drawGround(ctx);

    // 2. Corner Landmark (Fortress Citadel)
    this.castle.draw(ctx);

    // 3. Central Sanctuary Platform
    this.barracks.draw(ctx);

    // 4. 4-Way Warp Portals
    this.portals.draw(ctx);

    // 5. Sky Layers, Weather Shifts, & Mist Borders
    this.weather.drawSkyClouds(ctx);
    this.weather.drawWeatherOverlay(ctx);
    this.weather.drawCloudBorders(ctx);
  }
}