import { TileMap } from "./tilemap.js";
import { Ambient } from "./ambient.js";
import { drawGateway } from "./portal.js";
import { BoatSystem } from "./boat.js";
import { PLATFORMS, PLATFORM_SIZE } from "./platforms.js";
import { getLang } from "../i18n.js";

// ==================== PLATFORM (isang Act ng kampanya) ====================
// Kaparehong interface ng Stage (js/stage.js) para magamit ng camera, kalaban, NPC at world map:
//   width/height, bounds, safeZone(s), safeZoneAt(), isInsideSafeZone(), resolveTileCollision(),
//   update(player, onPortal), draw(ctx), drawOverlay(ctx), tilemap.
// Ang kampo (camp) ay sanctuary na may Return Gateway pabalik sa Aethelgard.

export class Platform {
  constructor(id) {
    const def = PLATFORMS[id];
    this.def = def;
    this.id = id;
    this.theme = def.theme;
    this.width = PLATFORM_SIZE.w;
    this.height = PLATFORM_SIZE.h;
    this.bounds = { minX: 42, maxX: this.width - 58, minY: 42, maxY: this.height - 58 };

    this.camp = def.camp;
    this.arena = def.arena;
    this.safeZone = def.camp;
    this.safeZones = [def.camp];
    this.clearAreas = [def.camp, def.arena];
    this.pathTargets = def.pathTargets;
    this.gate = { id: "RETURN", dir: def.gate.dir || "horizontal", x: def.gate.x, y: def.gate.y, w: def.gate.dir === "vertical" ? 22 : 58, h: def.gate.dir === "vertical" ? 58 : 22, color: "#ffd166", dest: "hub" };
    this.castle = null;
    this.tick = 0;
    this.cleared = false;     // natalo na ang boss (itinatakda ng main.js mula sa quest)
    this.riftOpen = false;    // Siege: bukas ang lamat patungo sa Maw

    this.terrain = (...a) => def.terrain.apply(def, a);
    // Ang kampo ay "coverage" para walang puno o bato sa loob nito
    this.coverageSystems = [{ draw: (c) => this.drawCamp(c) }];
    this.ambient = new Ambient(def.ambient);
    this.tilemap = new TileMap(this, def.seed);
    // Bangka at Sunken Monolith (Cerulean Abyss lang)
    this.boatSystem = def.boat ? new BoatSystem(this, def.boat) : null;
  }

  name() {
    return this.def.name[getLang() === "fil" ? "fil" : "en"];
  }

  resolveTileCollision(entity) {
    // Habang nasa bangka: libreng makapaglayag sa tubig, huwag i-block ng liquid mask
    if (entity && entity.inBoat) return;
    this.tilemap.resolveCollision(entity);
  }

  safeZoneAt(px, py) {
    return this.safeZones.find((s) => px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) || null;
  }

  isInsideSafeZone(px, py) {
    return Boolean(this.safeZoneAt(px, py));
  }

  // Punto sa tabi ng Return Gateway (pagdating sa platform)
  arrival() {
    const g = this.gate;
    return g.dir === "vertical" ? { x: g.x - 60, y: g.y - 12 } : { x: g.x - 10, y: g.y - 58 };
  }

  update(player, onPortal, enemyManager = null, effects = null) {
    this.tick++;
    this.ambient.update();
    if (this.boatSystem) this.boatSystem.update(player, enemyManager, effects, onPortal);
    if (!player || player.portalCooldown > 0) return;
    const fx = player.x + 10, fy = player.y + 18;
    const g = this.gate;
    if (Math.abs(fx - g.x) < g.w / 2 + 4 && Math.abs(fy - g.y) < g.h / 2 + 6) {
      player.portalCooldown = 75;
      if (onPortal) onPortal({ id: "RETURN", dest: "hub", from: this.id });
      return;
    }
    const rift = this.def.rift;
    if (rift && this.riftOpen && Math.hypot(fx - rift.x, fy - rift.y) < 16) {
      player.portalCooldown = 75;
      if (onPortal) onPortal({ id: "RIFT", dest: rift.dest, from: this.id });
    }
  }

  // Kampo ng Slaying Corps: runic na bilog, apat na brazier, tolda at bandila
  drawCamp(ctx) {
    const c = this.camp, cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    const t = this.tick / 10;
    ctx.save();
    ctx.fillStyle = "rgba(20, 16, 12, 0.55)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 209, 102, 0.55)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, c.w / 2 - 6, c.h / 2 - 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // tolda
    ctx.fillStyle = "#8a2c2c";
    ctx.beginPath(); ctx.moveTo(cx - 44, cy - 4); ctx.lineTo(cx - 28, cy - 30); ctx.lineTo(cx - 12, cy - 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#5a1a1a"; ctx.fillRect(cx - 31, cy - 14, 6, 10);
    ctx.fillStyle = "#ffd166"; ctx.fillRect(cx - 29, cy - 32, 2, 4);
    // bandila ng Slaying Corps
    ctx.fillStyle = "#5e3b1a"; ctx.fillRect(cx + 30, cy - 34, 2, 30);
    ctx.fillStyle = "#8a2c2c"; ctx.fillRect(cx + 32, cy - 34, 12, 8);
    ctx.fillStyle = "#ffd166"; ctx.fillRect(cx + 36, cy - 32, 3, 3);
    // apat na brazier
    [[c.x + 12, c.y + 12], [c.x + c.w - 16, c.y + 12], [c.x + 12, c.y + c.h - 16], [c.x + c.w - 16, c.y + c.h - 16]].forEach(([x, y], k) => {
      ctx.fillStyle = "#3a2f3f"; ctx.fillRect(x, y, 5, 5);
      ctx.fillStyle = "#ff7a1a"; ctx.fillRect(x + 1, y - 3 - ((Math.floor(t) + k) % 2), 3, 3);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(x + 2, y - 2, 1, 1);
    });
    ctx.restore();
  }

  draw(ctx, player = null) {
    this.tilemap.drawGround(ctx);
    this.def.landmark.call(this.def, ctx, this.tick / 20, this.cleared, this.riftOpen, this);
    this.drawCamp(ctx);
    if (this.boatSystem) this.boatSystem.draw(ctx, player);
    const L = getLang() === "fil" ? "fil" : "en";
    drawGateway(ctx, this.gate, this.tick * 0.08, false, L === "fil" ? "PABALIK SA AETHELGARD" : "RETURN TO AETHELGARD");
  }

  drawOverlay(ctx) {
    this.tilemap.drawOverlay(ctx);
    this.ambient.draw(ctx);
  }
}
