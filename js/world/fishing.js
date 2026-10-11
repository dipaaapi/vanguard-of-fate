import { combatWeather } from "./weather.js";
import { getLang } from "../i18n.js";
import { FISH, fishPool } from "../items/cooking.js";

// ==================== FISHING ====================
// Stand at the edge of water (sea, swamp, ice pools, lava, void: the tilemap's liquid tiles) and press E
// when nothing else is in reach. The line is cast, a fish bites after a few seconds — the bobber dips
// and "!" shows — and pressing E again within the window lands it. Moving or pressing too early reels
// in empty. What bites depends on the place (FISH_POOLS in js/items/cooking.js).

const TILE = 16;
const REACH = 30;              // how far from the feet the bobber can land (px)
const WAIT = [100, 210];       // frames until a bite
const BITE = 72;               // frames to react once it bites
const RESULT = 70;             // frames the catch / miss stays shown

export class Fishing {
  constructor() {
    this.s = null;
    this.streak = 0;             // { phase: "wait" | "bite" | "caught" | "miss", t, x, y, px, py, pool, fish }
    this.onCatch = null;       // (fishId) => void
    this.onMiss = null;        // () => void
  }

  get active() { return Boolean(this.s && (this.s.phase === "wait" || this.s.phase === "bite" || this.s.phase === "reel")); }

  // The water point nearest the hero's feet, or null (no fishing water, or riding the boat)
  spot(player, stage) {
    const tm = stage && stage.tilemap;
    const pool = fishPool(stage);
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
    if (this.active && (this.s.stage !== stage || Math.hypot(player.x - this.s.px, player.y - this.s.py) > 3 || player.hp <= 0)) { this.s = null; this.streak = 0; return false; }
    if (this.s?.phase === "bite") {
      this.s.phase = "reel"; this.s.t = 360; this.s.elapsed = 0; this.s.hits = 0; this.s.mistakes = 0;
      this.s.required = FISH[this.s.fish]?.rare ? 3 : 2;
      return true;
    }
    if (this.s?.phase === "reel") {
      const hit = Math.abs(this.needle() - this.s.center) <= this.s.width / 2;
      if (hit) {
        this.s.hits++; this.s.center = .25 + Math.random() * .5;
        if (this.s.hits >= this.s.required) {
          const qty = this.s.mistakes === 0 ? 2 : 1;
          this.streak = Math.min(5, this.streak + 1);
          this.s.phase = "caught"; this.s.t = RESULT; this.s.qty = qty;
          if (this.onCatch) this.onCatch(this.s.fish, { qty, perfect: this.s.mistakes === 0, rare: Boolean(FISH[this.s.fish]?.rare), streak: this.streak });
        }
      } else if (++this.s.mistakes >= 3) this.miss();
      // Prevent repeated E input from hitting the same timing window.
      this.s.elapsed += 13;
      return true;
    }
    if (this.s?.phase === "wait") { this.miss(); return true; }
    if (this.s?.phase === "caught" || this.s?.phase === "miss") return true;
    const at = this.spot(player, stage);
    if (!at || player.hp <= 0) return false;
    const wet = ["RAIN", "STORM"].includes(combatWeather(stage));
    const fish = this.roll(at.pool);
    this.s = { phase: "wait", t: Math.round((WAIT[0] + Math.random() * (WAIT[1] - WAIT[0])) * (wet ? .8 : 1) * (1 - this.streak * .06)),
      x: at.x, y: at.y, px: player.x, py: player.y, pool: at.pool, fish, stage, center: .5, width: FISH[fish]?.rare ? .24 : .34 };
    player.facing = at.x < player.x + 10 ? "left" : "right";
    return true;
  }

  roll(pool) {
    pool = pool.map(([id,w]) => [id,w * (FISH[id]?.rare ? 1 + this.streak * .15 : 1)]);
    const total = pool.reduce((n, [, w]) => n + w, 0);
    let r = Math.random() * total;
    for (const [id, w] of pool) { r -= w; if (r <= 0) return id; }
    return pool[0][0];
  }

  needle() { return .5 + Math.sin((this.s?.elapsed || 0) * .085) * .48; }
  miss() { this.streak = 0; this.s.phase = "miss"; this.s.t = RESULT; this.onMiss?.(); }

  // Nearest reachable dry shoreline for an Auto fishing contract.
  bank(player, stage, navigator) {
    if (!fishPool(stage) || !stage.tilemap?.liquid) return null;
    const tm = stage.tilemap, options = [];
    for (let ty = 1; ty < tm.rows - 1; ty++) for (let tx = 1; tx < tm.cols - 1; tx++) {
      if (tm.liquid[tm.idx(tx,ty)]) continue;
      if (![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => tm.liquid[tm.idx(tx+dx,ty+dy)])) continue;
      const point = { x: tx*TILE+8, y: ty*TILE+8 };
      if (navigator.blocked(point.x,point.y) || stage.isInsideSafeZone?.(point.x,point.y)) continue;
      options.push(point);
    }
    options.sort((a,b)=>Math.hypot(a.x-player.x-10,a.y-player.y-20)-Math.hypot(b.x-player.x-10,b.y-player.y-20));
    return options.find(point=>navigator.endpoint(point,0) && this.spot({x:point.x-10,y:point.y-20},stage)) || null;
  }

  update(player, stage = this.s?.stage) {
    const s = this.s;
    if (!s) return;
    if ((s.phase === "wait" || s.phase === "bite" || s.phase === "reel") && (stage !== s.stage || Math.hypot(player.x - s.px, player.y - s.py) > 3 || player.hp <= 0)) { this.s = null; this.streak = 0; return; }
    if (s.phase === "reel") s.elapsed++;
    if (--s.t > 0) return;
    if (s.phase === "wait") { s.phase = "bite"; s.t = BITE; }
    else if (s.phase === "bite" || s.phase === "reel") this.miss();
    else this.s = null;
  }

  // Line, bobber and the prompt (world coordinates)
  draw(ctx, player, stage, canPrompt) {
    const fil = getLang() === "fil";
    const s = this.s;
    if (s && (s.phase === "wait" || s.phase === "bite" || s.phase === "reel")) {
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
      if (s.phase === "wait") this.label(ctx, player.x + 10, player.y - 14, fil ? "Hintayin ang kagat…" : "Wait for a bite…", "#7dd3fc");
      if (s.phase === "reel") {
        const x = player.x - 24, y = player.y - 28, w = 68;
        ctx.fillStyle = "#0f172a"; ctx.fillRect(x-2,y-2,w+4,10);
        ctx.fillStyle = "#22c55e"; ctx.fillRect(x+(s.center-s.width/2)*w,y,s.width*w,6);
        ctx.fillStyle = "#fff"; ctx.fillRect(x+this.needle()*w-1,y-2,2,10);
        this.label(ctx,player.x+10,y-6,`[E] ${fil ? "Hilahin" : "Reel"} ${s.hits}/${s.required} · ${fil ? "Tensyon" : "Tension"} ${s.mistakes}/3`,"#facc15");
      }
      return;
    }
    if (s?.phase === "caught") {
      const name=FISH[s.fish]?.name[getLang()] || s.fish;
      this.label(ctx,player.x+10,player.y-24,`${s.mistakes===0 ? (fil ? "PERPEKTO! " : "PERFECT! ") : ""}+${s.qty} ${name}`,FISH[s.fish]?.tint || "#facc15");
      return;
    }
    if (s && (s.phase === "caught" || s.phase === "miss")) return;
    const spot = canPrompt && this.spot(player, stage);
    if (spot) {
      this.label(ctx, player.x + 10, player.y - 14, `${fil ? "[E] Mangisda" : "[E] Fish"}${this.streak ? ` · ${this.streak} STREAK` : ""}`, "#7dd3fc");
      const names=spot.pool.map(([id])=>FISH[id]?.name[getLang()] || id).join(" · ");
      this.label(ctx,player.x+10,player.y-25,names,"#cbd5e1");
    }
  }

  drawPanel(ctx, width, height) {
    const s=this.s;if(!s)return;
    const fil=getLang()==="fil",w=Math.min(230,width-16),h=48,x=(width-w)/2,y=height-h-8;
    const fish=FISH[s.fish],color=fish?.rare ? "#e879f9" : "#67e8f9";
    ctx.save();ctx.fillStyle="rgba(6,12,26,.94)";ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=color;ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);
    ctx.font="bold 7px monospace";ctx.textAlign="center";ctx.fillStyle=color;
    ctx.fillText(s.phase==="wait" ? (fil?"PANGINGISDA · Hintayin ang kagat":"FISHING · Wait for a bite") : `${fish?.name[getLang()] || s.fish}${fish?.rare ? " ★" : ""}`,width/2,y+11);
    ctx.font="6px monospace";ctx.fillStyle="#f8fafc";
    if(s.phase==="reel"){
      ctx.fillText(`${fil?"[E] Hilahin sa berde":"[E] Pull in the green"} · ${s.hits}/${s.required} · ${fil?"Tensyon":"Tension"} ${s.mistakes}/3`,width/2,y+22);
      const bx=x+15,by=y+29,bw=w-30;
      ctx.fillStyle="#334155";ctx.fillRect(bx,by,bw,9);
      ctx.fillStyle="#22c55e";ctx.fillRect(bx+(s.center-s.width/2)*bw,by,s.width*bw,9);
      ctx.fillStyle="#fff";ctx.fillRect(bx+this.needle()*bw-1,by-2,2,13);
    }else{
      const text=s.phase==="bite" ? (fil?"[E] KAGAT! Ikabit ang kawit!":"[E] BITE! Set the hook!") : s.phase==="caught" ? `${s.mistakes===0 ? (fil?"PERPEKTO!":"PERFECT!"): (fil?"NAHULI!":"CAUGHT!")} +${s.qty} · ${this.streak} STREAK` : s.phase==="miss" ? (fil?"Nakatakas — subukan muli":"It escaped — try again") : (fil?"Ulan at sunod-sunod na huli: mas mabilis ang kagat":"Rain and catch streaks bring quicker bites");
      ctx.fillText(text,width/2,y+25);
      const pulse=.5+Math.sin(performance.now()/180)*.3;
      ctx.fillStyle=color;ctx.globalAlpha=pulse;ctx.fillRect(x+12,y+h-10,(w-24)*(s.phase==="bite"?s.t/BITE:.5+.5*Math.sin(performance.now()/550)),3);
    }
    ctx.restore();
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
