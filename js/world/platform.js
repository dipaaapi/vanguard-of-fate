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

  update(player, onPortal) {
    this.tick++;
    this.ambient.update();
    if (this.boatSystem) this.boatSystem.update(player, onPortal);
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

  // Emberhold, the dwarven village that replaces the Ashfall camp: basalt paving inside a low stone wall
  // (gap at the Return Gateway), the smithy with its anvil and furnace, Hilde's repair bench, the
  // thane's hall, Pip's stall, a hut and four braziers. Also drawn into the tilemap's coverage mask,
  // so the whole rectangle stays clear of trees, rocks and lava.
  drawVillage(ctx) {
    const v = this.camp, t = this.tick;
    const X = (dx) => v.x + dx, Y = (dy) => v.y + dy;
    const block = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    ctx.save();

    // ground: dark basalt cobbles
    block(v.x, v.y, v.w, v.h, "#2b2522");
    for (let y = 0; y < v.h; y += 8) {
      for (let x = (y / 8) % 2 ? 0 : -6; x < v.w; x += 12) block(X(Math.max(0, x) + 1), Y(y + 1), Math.min(10, v.w - Math.max(0, x) - 1), 6, (x + y) % 3 ? "#3a3330" : "#342d2a");
    }
    // central square with an ember rune
    ctx.strokeStyle = `rgba(255, 122, 26, ${0.35 + Math.sin(t / 20) * 0.1})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(X(178), Y(112), 40, 18, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(X(178), Y(112), 26, 11, 0, 0, Math.PI * 2); ctx.stroke();

    // low stone wall with the gate gap at the bottom (Return Gateway)
    const gateL = this.gate.x - v.x - 38, gateR = this.gate.x - v.x + 38;
    const wall = (x, y, w, h) => { block(X(x), Y(y), w, h, "#57534e"); block(X(x), Y(y), w, 2, "#78716c"); };
    wall(0, 0, v.w, 6);
    wall(0, 0, 6, v.h);
    wall(v.w - 6, 0, 6, v.h);
    wall(0, v.h - 6, gateL, 6);
    wall(gateR, v.h - 6, v.w - gateR, 6);

    // smithy (Brakka): stone walls, sloped roof, chimney smoke, glowing furnace, anvil out front
    block(X(16), Y(24), 70, 40, "#4a4038");
    block(X(12), Y(14), 78, 12, "#6b2f1f");
    block(X(12), Y(14), 78, 2, "#8a3b24");
    block(X(66), Y(2), 10, 16, "#44403c");
    for (let k = 0; k < 3; k++) {
      const ph = ((t / 3 + k * 20) % 60) / 60;
      ctx.fillStyle = `rgba(120, 113, 108, ${0.5 * (1 - ph)})`;
      ctx.beginPath(); ctx.arc(X(71 + Math.sin(ph * 6 + k) * 3), Y(2 - ph * 22), 3 + ph * 4, 0, Math.PI * 2); ctx.fill();
    }
    const flick = 0.75 + Math.sin(t / 4) * 0.15;
    block(X(26), Y(40), 22, 20, "#1c1917");
    block(X(29), Y(46), 16, 14, `rgba(255, ${Math.round(110 + flick * 60)}, 30, ${flick})`);
    block(X(56), Y(38), 18, 26, "#292524");                    // door
    block(X(52), Y(72), 20, 5, "#78716c");                     // anvil
    block(X(56), Y(77), 10, 6, "#57534e");
    block(X(50), Y(72), 4, 3, "#78716c");

    // thane's hall (Durgrim): wider, gold-trimmed roof, banner with the hammer emblem, steps
    block(X(120), Y(22), 96, 38, "#57534e");
    block(X(114), Y(10), 108, 14, "#7c2d12");
    block(X(114), Y(10), 108, 2, "#facc15");
    block(X(158), Y(34), 20, 26, "#1c1917");
    block(X(152), Y(60), 32, 4, "#78716c");
    block(X(148), Y(64), 40, 3, "#57534e");
    [[128, 30], [196, 30]].forEach(([bx, by], k) => {
      const wave = Math.round(Math.sin(t / 12 + k) * 1.5);
      block(X(bx), Y(by), 10, 16 + wave, "#991b1b");
      block(X(bx + 3), Y(by + 5), 4, 2, "#facc15");               // hammer head
      block(X(bx + 4), Y(by + 7), 2, 5, "#facc15");               // handle
    });

    // repair bench (Hilde): workbench, tool rack, spinning grindstone
    block(X(16), Y(138), 34, 8, "#7a5230");
    block(X(18), Y(146), 4, 8, "#4a2f1b");
    block(X(44), Y(146), 4, 8, "#4a2f1b");
    block(X(20), Y(132), 3, 6, "#94a3b8");
    block(X(27), Y(130), 2, 8, "#94a3b8");
    block(X(33), Y(133), 5, 2, "#94a3b8");
    const a = t / 6;
    ctx.fillStyle = "#78716c";
    ctx.beginPath(); ctx.arc(X(66), Y(146), 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#44403c";
    ctx.beginPath(); ctx.moveTo(X(66), Y(146)); ctx.lineTo(X(66) + Math.cos(a) * 7, Y(146) + Math.sin(a) * 7); ctx.stroke();
    if (Math.floor(t / 5) % 3 === 0) block(X(73), Y(143), 2, 1, "#fde047");   // sparks

    // Pip's stall: striped awning, counter, crates and sacks
    for (let k = 0; k < 8; k++) block(X(244 + k * 8), Y(20), 8, 10, k % 2 ? "#e7e5e4" : "#b91c1c");
    block(X(244), Y(30), 64, 2, "#7f1d1d");
    block(X(246), Y(32), 3, 28, "#4a2f1b");
    block(X(303), Y(32), 3, 28, "#4a2f1b");
    block(X(246), Y(50), 60, 10, "#7a5230");
    block(X(246), Y(50), 60, 2, "#a16207");
    block(X(254), Y(44), 6, 6, "#38bdf8");
    block(X(264), Y(45), 5, 5, "#a855f7");
    block(X(274), Y(44), 6, 6, "#ef4444");
    block(X(286), Y(62), 12, 10, "#78350f");
    block(X(270), Y(64), 10, 9, "#d6d3d1");

    // dwarf hut: round door and a lantern
    block(X(244), Y(122), 56, 36, "#4a4038");
    block(X(240), Y(112), 64, 12, "#57534e");
    ctx.fillStyle = "#1c1917";
    ctx.beginPath(); ctx.arc(X(272), Y(146), 8, Math.PI, 0); ctx.fill();
    block(X(264), Y(146), 16, 12, "#1c1917");
    block(X(286), Y(132), 3, 4, `rgba(253, 224, 71, ${0.7 + Math.sin(t / 7) * 0.3})`);

    // four braziers inside the wall
    [[14, 94], [v.w - 20, 94], [14, v.h - 22], [v.w - 20, v.h - 22]].forEach(([bx, by], k) => {
      block(X(bx), Y(by), 6, 6, "#3a2f3f");
      block(X(bx + 1), Y(by - 4 - ((Math.floor(t / 10) + k) % 2)), 4, 4, "#ff7a1a");
      block(X(bx + 2), Y(by - 3), 2, 2, "#ffd166");
    });

    // sign above the gate
    const L = getLang() === "fil" ? "fil" : "en";
    const label = `⚒ ${this.def.village}${L === "fil" ? " · Nayon ng mga Dwarf" : " · Dwarven Village"}`;
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    const tw = ctx.measureText(label).width + 8;
    block(this.gate.x - tw / 2, Y(v.h - 30), tw, 9, "rgba(28, 25, 23, 0.9)");
    ctx.fillStyle = "#fb923c";
    ctx.fillText(label, this.gate.x, Y(v.h - 23));
    ctx.restore();
  }

  // Kampo ng Slaying Corps: runic na bilog, apat na brazier, tolda at bandila
  drawCamp(ctx) {
    if (this.def.village) return this.drawVillage(ctx);
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
