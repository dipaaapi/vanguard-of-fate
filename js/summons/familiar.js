import { Sound } from "../audio.js";
import { SlimeSprite, WolfSprite, FalconSprite, facingFrom } from "../avatar/creature.js";

// ==================== FAMILIARS (pets for heroes with no summon of their own) ====================
// Learned in the skill tree (js/skills.js, kind "summon"): the Novice's Pocket Slime, the Knight's
// War Hound, the Mage's Arcane Owl and the Fighter's Spirit Fox. The job familiar replaces the slime.
// A familiar follows the hero, picks foes near the hero and bites (or, for the owl, shoots) on its own
// cooldown. It can't be hurt and doesn't fight inside a safe zone. Its hits are credited to the hero
// (EXP and loot) but don't add the hero's ATK or crit, so it stays a helper, not a second hero:
//   damage = (4 + 1.1 × hero level) × kind mult × (0.7 + 0.06 × skill level)

export const FAMILIARS = {
  slime: { skill: "petpal", mult: 0.8, cd: 70, reach: 16, speed: 1.9, elem: "earth", spark: "#9ef01a",
    sprite: new SlimeSprite() },
  hound: { skill: "hound", mult: 1.0, cd: 64, reach: 20, speed: 2.3, elem: "neutral", spark: "#cbd5e1", stunEvery: 4,
    sprite: new WolfSprite({ fur: "#64748b", furD: "#475569", furDD: "#1e293b", furL: "#94a3b8", belly: "#e2e8f0", eye: "#38bdf8" }) },
  owl: { skill: "starowl", mult: 0.85, cd: 80, ranged: 140, speed: 2.6, fly: true, elem: "ghost", spark: "#c4b5fd",
    sprite: new FalconSprite({ body: "#4c1d95", bodyD: "#2e1065", wing: "#6d28d9", wingD: "#3b0764", breast: "#c4b5fd", head: "#ddd6fe", mask: "#4c1d95", eye: "#fde047", beak: "#fbbf24", talon: "#fbbf24" }) },
  fox: { skill: "spiritfox", mult: 0.9, cd: 46, reach: 16, speed: 2.6, elem: "fire", spark: "#fb923c", stamina: 4, scale: 0.8,
    sprite: new WolfSprite({ fur: "#f97316", furD: "#c2410c", furDD: "#7c2d12", furL: "#fdba74", belly: "#fff7ed", eye: "#fde047" }) }
};
// Aseprite sheets (aseprite/summon/<kind>.aseprite) replace the code-drawn frames when exported
for (const [kind, def] of Object.entries(FAMILIARS)) def.sprite.sheetKey = `summon/${kind}`;
const JOB_FAMILIAR = { knight: "hound", mage: "owl", fighter: "fox" };
const NO_FAMILIAR = ["priest", "archer"];   // they have Guardian Angels / the falcon
const LEASH = 120;        // foes farther than this from the hero are left alone
const TELEPORT = 260;     // the familiar catches up instantly beyond this

// Which familiar the hero should have now (kind) and its skill level, or null
export function familiarFor(player) {
  const cls = player.heroData.id;
  if (NO_FAMILIAR.includes(cls)) return null;
  const job = JOB_FAMILIAR[cls];
  if (job && player.skillLevels[FAMILIARS[job].skill] > 0) return { kind: job, lv: player.skillLevels[FAMILIARS[job].skill] };
  const lv = player.skillLevels.petpal || 0;
  return lv ? { kind: "slime", lv } : null;
}

// Per-hit damage for a familiar of `kind` at skill level `lv` (also used by the balance simulator)
export const familiarDamage = (kind, heroLevel, lv) => Math.round((4 + 1.1 * heroLevel) * FAMILIARS[kind].mult * (0.7 + 0.06 * lv));

// Keeps player.familiar in step with the skill tree; call every frame (cheap)
// When the ship's crew list (player.companions) exists, the familiar is kept in it so it can board.
export function syncFamiliar(player) {
  const want = familiarFor(player);
  const f = player.familiar;
  if (!want) player.familiar = null;
  else if (!f || f.kind !== want.kind) player.familiar = new Familiar(want.kind, player.x - 20, player.y + 6);
  if (player.familiar) player.familiar.lv = want.lv;
  const crew = player.companions;
  if (Array.isArray(crew) && player.familiar !== f) {
    if (f) { const i = crew.indexOf(f); if (i >= 0) crew.splice(i, 1); }
    if (player.familiar) crew.push(player.familiar);
  }
  return player.familiar;
}

export class Familiar {
  constructor(kind, x, y) {
    this.kind = kind;
    this.k = FAMILIARS[kind];
    this.x = x;
    this.y = y;
    this.lv = 1;
    this.cd = 30;
    this.bites = 0;
    this.target = null;
    this.face = { dir: "down", flip: false };
    this.anim = "idle";
    this.t = 0;
    this.atkT = 0;
    this.beam = null;          // owl: { x1, y1, t } line to the foe it hit
    this.flying = Boolean(this.k.fly);   // ship crew: a flyer perches in the rigging
    this.aboard = false;                 // seated on the ship (the ship moves it)
  }

  // Put next to the hero (travel, load)
  place(player) {
    this.x = player.x - 20;
    this.y = player.y + 6;
    this.target = null;
  }

  update(player, enemyManager, fx, lootManager, safe = false) {
    const k = this.k;
    this.t++;
    if (this.cd > 0) this.cd--;
    if (this.atkT > 0) this.atkT--;
    if (this.beam && --this.beam.t <= 0) this.beam = null;
    if (this.aboard) { this.anim = "idle"; this.target = null; return; }
    if (Math.hypot(player.x - this.x, player.y - this.y) > TELEPORT) this.place(player);

    // Pick the closest foe near the hero
    const near = (e) => e.isAlive && Math.hypot(e.x - player.x, e.y - player.y) <= LEASH;
    if (safe || player.hp <= 0) this.target = null;
    else if (!this.target || !near(this.target)) {
      this.target = null;
      let best = Infinity;
      for (const e of enemyManager.enemies) {
        if (!near(e)) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < best) { best = d; this.target = e; }
      }
    }

    // Where to go: next to the foe (or in range for the owl), else beside the hero
    let gx, gy, stop;
    const e = this.target;
    if (e) {
      gx = e.x + (this.x < e.x ? -12 : 12);
      gy = e.y + (k.fly ? -14 : 4);
      stop = k.ranged ? k.ranged * 0.7 : 6;
    } else {
      gx = player.x + (player.facing === "right" ? -20 : 22);
      gy = player.y + (k.fly ? -18 + Math.sin(this.t / 14) * 3 : 6);
      stop = k.fly ? 2 : 14;
    }
    const dx = gx - this.x, dy = gy - this.y, dist = Math.hypot(dx, dy);
    let mx = 0, my = 0;
    if (dist > stop) {
      const sp = Math.min(dist - stop, k.speed * (e ? 1 : dist > 60 ? 1.3 : 0.8));
      mx = (dx / dist) * sp; my = (dy / dist) * sp;
      this.x += mx; this.y += my;
    }
    this.face = facingFrom(e && dist <= stop ? e.x - this.x : mx, e && dist <= stop ? e.y - this.y : my, this.face);
    const moving = Math.hypot(mx, my) > 0.2;
    this.anim = this.atkT > 0 ? (this.special && k.sprite.has("skill", this.face.dir) ? "skill" : "attack")
      : moving ? ((e || dist > 60) && k.sprite.has("run", this.face.dir) ? "run" : "walk") : "idle";

    // Attack
    if (!e || this.cd > 0) return;
    const reach = k.ranged || k.reach;
    if (Math.hypot(e.x - this.x, e.y - this.y) > reach + 8) return;
    this.cd = k.cd;
    this.bites++;
    const stun = Boolean(k.stunEvery && this.bites % k.stunEvery === 0);
    // Every 4th hit (the hound's stunning bite) shows the skill animation; damage is unchanged
    this.special = stun || this.bites % (k.stunEvery || 4) === 0;
    this.atkT = this.special && k.sprite.has("skill", this.face.dir) ? 24 : 12;
    const angle = Math.atan2(e.y - this.y, e.x - this.x);
    // Credited to the hero (EXP, loot) without adding the hero's ATK or crit
    const prev = enemyManager.hitSource;
    enemyManager.hitSource = "player";
    enemyManager.damage(e, familiarDamage(this.kind, player.level, this.lv), angle, false, fx, lootManager, k.ranged ? 3 : 6, stun, null, k.elem);
    enemyManager.hitSource = prev;
    if (k.ranged) this.beam = { x1: e.x + 12, y1: e.y + 10, t: 8 };
    if (k.stamina) player.stamina = Math.min(player.maxStamina, player.stamina + k.stamina);
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(e.x + 12, e.y + 12, k.spark, 6);
    if (Sound.playHitEnemy && !k.ranged) Sound.playHitEnemy(false, e.x, e.y);
  }

  draw(ctx) {
    const k = this.k, s = k.scale || 1;
    const x = Math.floor(this.x) + 12, y = Math.floor(this.y) + 20;
    // Shadow (a flyer's sits lower, on the ground)
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(x, k.fly ? y + 14 : y, 8 * s, 2.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    if (this.beam) {
      ctx.save();
      ctx.globalAlpha = this.beam.t / 8;
      ctx.strokeStyle = k.spark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 4, y - 6);
      ctx.lineTo(this.beam.x1, this.beam.y1);
      ctx.stroke();
      ctx.restore();
    }
    if (k.fly) {
      const anim = this.atkT > 0 ? "taunt" : "fly";
      k.sprite.draw(ctx, x, y - 4, "side", anim, Math.floor(this.t / (anim === "fly" ? 5 : 8)), this.face.flip);
    } else {
      // attack / skill play once over the strike; the others loop
      const n = k.sprite.count(this.face.dir, this.anim);
      const max = this.anim === "skill" ? 24 : 12;
      const i = this.anim === "attack" || this.anim === "skill" ? (n <= 2 ? Math.floor(this.t / 16) : Math.min(n - 1, Math.floor((1 - this.atkT / max) * n)))
        : Math.floor(this.t / ({ walk: 6, run: 4 }[this.anim] || (n > 2 ? 10 : 16)));
      k.sprite.draw(ctx, x, y, this.face.dir, this.anim, i, this.face.flip, false, s);
    }
  }
}
