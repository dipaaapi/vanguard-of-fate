import { getLang } from "../i18n.js";
import { FISH_POOLS } from "../items/cooking.js";

// ==================== FISHING ====================
// Stand at the edge of water (sea, swamp, ice pools, lava, void: the tilemap's liquid tiles) and press E
// when nothing else is in reach. The line is cast, a fish bites after a few seconds — the bobber dips
// and "!" shows — and pressing E again within the window lands it. Moving or pressing too early reels
// in empty. What bites depends on the place (FISH_POOLS in js/items/cooking.js).

const TILE = 16;
const REACH = 30;              // how far from the feet the bobber can land (px)
const WAIT = [150, 330];       // frames until a bite
const BITE = 42;               // frames to react once it bites
const RESULT = 70;             // frames the catch / miss stays shown

export class Fishing {
  constructor() {
    this.s = null;             // { phase: "wait" | "bite" | "caught" | "miss", t, x, y, px, py, pool, fish }
    this.onCatch = null;       // (fishId) => void
    this.onMiss = null;        // () => void
  }

  get active() { return Boolean(this.s && (this.s.phase === "wait" || this.s.phase === "bite")); }

  // The water point nearest the hero's feet, or null (no fishing water, or riding the boat)
  spot(player, stage) {
    const tm = stage && stage.tilemap;
    const pool = FISH_POOLS[(stage && (stage.theme || stage.id)) || "hub"];
    if (!tm || !tm.liquid || !pool || player.inBoat) return null;
    const fx = player.x + 10, fy = player.y + 18;
    let best = null, bd = REACH;
    const r = Math.ceil(REACH / TILE);
    const tx0 = Math.floor(fx / TILE), ty0 = Math.floor(fy / TILE);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const tx = tx0 + dx, ty = ty0 + dy;
      if (!tm.inBounds(tx, ty) || !tm.liquid[tm.idx(tx, ty)]) continue;
      const cx = Math.max(tx * TILE + 3, Math.min(tx * TILE + TILE - 3, fx)), cy = Math.max(ty * TILE + 3, Math.min(ty * TILE + TILE - 3, fy));
      const d = Math.hypot(cx - fx, cy - fy);
      if (d < bd) { bd = d; best = { x: cx, y: cy, pool }; }
    }
    return best;
  }

  // E near water: cast, hook a biting fish, or reel in early. Returns true when E was used for fishing
  press(player, stage) {
    if (this.s && this.s.phase === "bite") {
      const fish = this.roll(this.s.pool);
      this.s = { ...this.s, phase: "caught", t: RESULT, fish };
      if (this.onCatch) this.onCatch(fish);
      return true;
    }
    if (this.s && this.s.phase === "wait") { this.s = { ...this.s, phase: "miss", t: RESULT / 2 }; return true; }
    const at = this.spot(player, stage);
    if (!at) return false;
    this.s = { phase: "wait", t: WAIT[0] + Math.floor(Math.random() * (WAIT[1] - WAIT[0])), x: at.x, y: at.y, px: player.x, py: player.y, pool: at.pool };
    player.facing = at.x < player.x + 10 ? "left" : "right";
    return true;
  }

  roll(pool) {
    const total = pool.reduce((n, [, w]) => n + w, 0);
    let r = Math.random() * total;
    for (const [id, w] of pool) { r -= w; if (r <= 0) return id; }
    return pool[0][0];
  }

  update(player) {
    const s = this.s;
    if (!s) return;
    if ((s.phase === "wait" || s.phase === "bite") && (Math.hypot(player.x - s.px, player.y - s.py) > 3 || player.hp <= 0)) { this.s = null; return; }
    if (--s.t > 0) return;
    if (s.phase === "wait") { s.phase = "bite"; s.t = BITE; }
    else if (s.phase === "bite") { s.phase = "miss"; s.t = RESULT; if (this.onMiss) this.onMiss(); }
    else this.s = null;
  }

  // Line, bobber and the prompt (world coordinates)
  draw(ctx, player, stage, canPrompt) {
    const fil = getLang() === "fil";
    const s = this.s;
    if (s && (s.phase === "wait" || s.phase === "bite")) {
      const now = performance.now() / 1000;
      const dip = s.phase === "bite" ? 2 + Math.sin(now * 30) * 1.5 : Math.sin(now * 3) * 0.6;
      const hx = player.x + (player.facing === "left" ? 2 : 18), hy = player.y + 4;
      ctx.strokeStyle = "rgba(226, 232, 240, 0.75)";
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo((hx + s.x) / 2, Math.min(hy, s.y) - 10, s.x, s.y + dip - 1); ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath(); ctx.ellipse(s.x, s.y + 1, 4 + (now * 4) % 3, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ef4444"; ctx.fillRect(s.x - 1, s.y + dip - 3, 3, 2);
      ctx.fillStyle = "#f8fafc"; ctx.fillRect(s.x - 1, s.y + dip - 1, 3, 1);
      if (s.phase === "bite") {
        ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
        ctx.fillStyle = "#facc15"; ctx.fillText("!", s.x, s.y - 6);
        this.label(ctx, player.x + 10, player.y - 14, fil ? "[E] Hilahin!" : "[E] Reel in!", "#facc15");
      }
      return;
    }
    if (s && (s.phase === "caught" || s.phase === "miss")) return;
    if (canPrompt && this.spot(player, stage)) this.label(ctx, player.x + 10, player.y - 14, fil ? "[E] Mangisda" : "[E] Fish", "#7dd3fc");
  }

  label(ctx, x, y, text, color) {
    ctx.font = "bold 5px monospace";
    ctx.textAlign = "center";
    const tw = ctx.measureText(text).width + 6;
    ctx.fillStyle = "rgba(3, 6, 17, 0.85)";
    ctx.fillRect(x - tw / 2, y - 5, tw, 7);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
}
