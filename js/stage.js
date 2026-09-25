import { GuardNPC } from './npc/guard.js';
import { GrasslandSystem } from "./world/grassland.js";
import { BarracksSystem } from "./world/barracks.js";
import { OceanSystem } from "./world/ocean.js";
import { CastleSystem } from "./world/castle.js";
import { PortalSystem } from "./world/portal.js";
import { WeatherSystem } from "./world/weather.js";
import { ShopkeeperNPC } from "./npc/shopkeeper.js";
import { RecruiterNPC } from "./npc/recruiter.js";

export class Stage {
  constructor(width = 1280, height = 960) {
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
    this.ocean = new OceanSystem(this.width, this.height);
    this.castle = new CastleSystem(this.width, this.height);
    this.portals = new PortalSystem(this.width, this.height);
    this.weather = new WeatherSystem(this.width, this.height);

    // Shortcut para sa gameplay safe zone checks
    this.safeZone = this.barracks.bounds;

    // NPCs sa loob ng Barracks
    this.shopkeeper = new ShopkeeperNPC(this.width / 2 - 30, this.height / 2 - 20);
    this.mercCaptain = new RecruiterNPC(this.safeZone.x + 50, this.safeZone.y + 55);
    this.castleGuard = new GuardNPC(this.castle.x + 124, this.castle.y + 192);
  }

  isInsideSafeZone(px, py) {
    const s = this.safeZone;
    return px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h;
  }

  isNearNPC(px, py) {
    return Math.hypot(px - this.shopkeeper.x, py - this.shopkeeper.y) < 38;
  }

  isNearCastleGuard(px, py) {
    return Math.hypot(px - this.castleGuard.x, py - this.castleGuard.y) < 42;
  }

  isNearMercenaryNPC(px, py) {
    return Math.hypot(px - this.mercCaptain.x, py - this.mercCaptain.y) < 38;
  }

  update(player, onWarp) {
    // 1. Environment Updates
    this.grassland.update();
    this.barracks.update();
    this.ocean.update();
    this.castle.update();
    this.portals.update(player, onWarp);
    this.weather.update();

    // 2. Solid Castle Physics
    if (player && this.castle) {
      this.castle.resolveCollision(player);

      // Gate Portal Warp Check
      const gp = this.castle.gatePortal;
      const d = Math.hypot(player.x + 10 - gp.x, player.y + 18 - gp.y);
      if (d < 18 && (!player.portalCooldown || player.portalCooldown <= 0)) {
        player.x = this.safeZone.x + this.safeZone.w / 2 - 10;
        player.y = this.safeZone.y + this.safeZone.h - 30;
        player.portalCooldown = 75;
        if (onWarp) onWarp({ id: "CITADEL_GATE", color: "#38bdf8" });
      }
    }

    // 3. NPCs
    this.shopkeeper.update(this.safeZone);
    this.mercCaptain.update();
    this.castleGuard.update();
  }

  draw(ctx) {
    // 1. Base Natural Ground
    this.grassland.draw(ctx);

    // 2. Corner Landmarks (Coastline at Fortress Citadel)
    this.ocean.draw(ctx);
    this.castle.draw(ctx);

    // 3. Central Sanctuary Platform
    this.barracks.draw(ctx);

    // 4. Inhabitant NPCs
    this.shopkeeper.draw(ctx);
    this.mercCaptain.draw(ctx);
    this.castleGuard.draw(ctx);

    // 5. 4-Way Warp Portals
    this.portals.draw(ctx);

    // 6. Sky Layers, Weather Shifts, & Mist Borders
    this.weather.drawSkyClouds(ctx);
    this.weather.drawWeatherOverlay(ctx);
    this.weather.drawCloudBorders(ctx);
  }
}