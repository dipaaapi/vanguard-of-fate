import { getLang } from "../i18n.js";
import { getItem } from "../items/itemdb.js";

// ==================== ORE VEINS (mining) ====================
// Only the Ashfall Wastelands and the Siege of the Obsidian Citadel (Dark Continent) have ore (def.ore on the platform).
// Mining is unlocked by Thane Durgrim's quest; each vein takes a few pickaxe strikes (E), yields
// minerals, then regrows after a while. Vein positions come from the platform seed, so they are stable.

const TILE = 16;
const STRIKES = 3;              // pickaxe strikes to break a vein
const REGROW = 60 * 90;         // frames until a broken vein regrows (90 s)
export const MINE_RANGE = 26;

function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export class OreVeins {
  // cfg = { count, kinds: [[mineralId, weight], ...] }
  constructor(platform, cfg) {
    this.cfg = cfg;
    this.veins = [];
    const tm = platform.tilemap, r = rng(platform.def.seed * 7 + 13);
    const avoid = [platform.camp, platform.arena].filter(Boolean).map((a) => ({ x: a.x - 40, y: a.y - 40, w: a.w + 80, h: a.h + 80 }));
    const inRect = (x, y, a) => x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h;
    const blocked = (x, y) => {
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const i = (ty + dy) * tm.cols + (tx + dx);
        if (tm.solid[i] || tm.liquid[i]) return true;
      }
      return false;
    };
    const b = platform.bounds;
    for (let tries = 0; this.veins.length < cfg.count && tries < 800; tries++) {
      const x = b.minX + 30 + r() * (b.maxX - b.minX - 60), y = b.minY + 40 + r() * (b.maxY - b.minY - 70);
      if (blocked(x, y) || avoid.some((a) => inRect(x, y, a))) continue;
      if (platform.gate && Math.hypot(x - platform.gate.x, y - platform.gate.y) < 90) continue;
      if (this.veins.some((v) => Math.hypot(v.x - x, v.y - y) < 80)) continue;
      this.veins.push({ x: Math.round(x), y: Math.round(y), kind: this.pickKind(r()), hits: 0, regrow: 0, shake: 0 });
    }
  }

  pickKind(roll) {
    const total = this.cfg.kinds.reduce((n, [, w]) => n + w, 0);
    let acc = 0;
    for (const [id, w] of this.cfg.kinds) { acc += w / total; if (roll <= acc) return id; }
    return this.cfg.kinds[0][0];
  }

  update() {
    this.veins.forEach((v) => {
      if (v.regrow > 0 && --v.regrow === 0) { v.hits = 0; v.kind = this.pickKind(Math.random()); }
      if (v.shake > 0) v.shake--;
    });
  }

  // The unbroken vein the hero is standing next to (feet at player.x + 10, player.y + 18)
  nearest(player) {
    const px = player.x + 10, py = player.y + 18;
    return this.veins.find((v) => !v.regrow && Math.hypot(v.x - px, v.y - py) < MINE_RANGE) || null;
  }

  // One pickaxe strike. Returns { broke, id, qty } (qty only when the vein breaks).
  strike(v) {
    v.hits++;
    v.shake = 8;
    if (v.hits < STRIKES) return { broke: false, id: v.kind, qty: 0 };
    v.regrow = REGROW;
    const qty = v.kind === "starsteel" ? 1 : 1 + (Math.random() < 0.5 ? 1 : 0);
    return { broke: true, id: v.kind, qty };
  }

  draw(ctx, player, unlocked) {
    const fil = getLang() === "fil";
    this.veins.forEach((v) => {
      const tint = getItem(v.kind).tint;
      const sx = v.shake ? Math.round(Math.sin(v.shake * 2) * 1.5) : 0;
      const x = v.x + sx, y = v.y;
      if (v.regrow) {
        // rubble while it regrows
        ctx.fillStyle = "rgba(68, 64, 60, 0.9)";
        ctx.fillRect(x - 8, y - 2, 5, 3); ctx.fillRect(x - 1, y - 3, 6, 4); ctx.fillRect(x + 6, y - 1, 4, 2);
        return;
      }
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath(); ctx.ellipse(x, y + 1, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#44403c";
      ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 8, y - 10); ctx.lineTo(x - 1, y - 14); ctx.lineTo(x + 7, y - 11); ctx.lineTo(x + 12, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#57534e";
      ctx.beginPath(); ctx.moveTo(x - 8, y - 10); ctx.lineTo(x - 1, y - 14); ctx.lineTo(x - 2, y - 6); ctx.closePath(); ctx.fill();
      // crystals of the mineral, fewer as the vein is struck
      const glint = 0.75 + Math.sin((performance.now() / 300) + v.x) * 0.25;
      ctx.fillStyle = tint;
      [[-5, -7], [2, -9], [6, -4], [-1, -3]].slice(0, 4 - v.hits).forEach(([dx, dy]) => {
        ctx.globalAlpha = glint;
        ctx.fillRect(x + dx, y + dy - 2, 2, 4);
        ctx.fillRect(x + dx - 1, y + dy - 1, 4, 2);
      });
      ctx.globalAlpha = 1;
      // prompt
      if (player && Math.hypot(v.x - (player.x + 10), v.y - (player.y + 18)) < MINE_RANGE + 10) {
        const label = unlocked
          ? `[E] ${fil ? "Magmina" : "Mine"} ${getItem(v.kind).name} (${v.hits}/${STRIKES})`
          : (fil ? "⛏ Kailangan ang piko ni Thane Durgrim" : "⛏ Needs Thane Durgrim's pickaxe");
        ctx.font = "bold 5px monospace";
        ctx.textAlign = "center";
        const tw = ctx.measureText(label).width + 6;
        ctx.fillStyle = "rgba(3, 6, 17, 0.85)";
        ctx.fillRect(x - tw / 2, y - 25, tw, 7);
        ctx.fillStyle = unlocked ? tint : "#94a3b8";
        ctx.fillText(label, x, y - 20);
      }
    });
  }
}
