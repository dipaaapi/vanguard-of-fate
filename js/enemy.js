import { Sound } from "./audio.js";
import { facingFrom } from "./avatar/creature.js";
import { MONSTERS, BOSSES, BLIGHTS, NIGHT_KINDS } from "./bestiary.js";
import { TIERS, MODS, rollTier, applyTier, tierName, has, modName, damageTakenMult, damageDealtMult, windupFor, modBlight, applyLives, totalMaxHp, hpFrac } from "./monsterTiers.js";
import { ELEMENTS, elementMult, raceBonus, sizeMod, rollVariant, variantPrefix, elementName, raceName, sizeName } from "./elements.js";
import { getLang } from "./i18n.js";
import { STATUS, statusName } from "./status.js";
import { around, mix, hitPose, attackPose, windupPose, breathPose, spawnPose, REST } from "./juice.js";
import { GFX } from "./settings.js";
import { HUB_KINDS, HUB_ELITES } from "./world/areas.js";
import { confine, steer, trackGoal } from "./world/nav.js";

// ========================================================
// ENEMIES
// ========================================================
// (e.x, e.y) is the top-left of the old 20px box; the feet are at (e.x + 10, e.y + 17).
//
// LEVEL: every place has a FIXED level band (it does not follow the hero): Aethelgard 1–8
// (+3 at night), Act VII 10–17, VIII 15–22 … XII 35–42. Out-level a place and it becomes easy
// (and gives little EXP); walk in too early and it is deadly. The name colour tells how strong
// it is compared to you and whether it is aggressive:
//   grey   (≤ −3)  weak, won't attack unless provoked
//   green  (−2..−1) weaker, won't attack unless provoked
//   yellow (0..+1)  even — AGGRESSIVE
//   orange (+2..+3) stronger — AGGRESSIVE
//   red    (≥ +4)   dangerous — AGGRESSIVE
//   purple BOSS
// Passive monsters wander; aggressive ones chase you when you get close.

// Every map has 5 regular kinds (random spawns) and 4 elite kinds (always Elite, one of each roams the map
// and comes back a while after it falls). Rosters: js/world/areas.js, platforms.js and frontiers.js.
export { HUB_KINDS, HUB_ELITES };
const ELITE_RESPAWN = 60 * 40;   // frames before a slain elite kind returns
const WALK_TICKS = 10;
const IDLE_TICKS = 30;
const RUN_TICKS = 6;      // per frame of a sheet's "run" (chasing)
const SKILL_TICKS = 4;    // per frame of a sheet's "skill" (charging a strike)
const SPAWN_POP = 14;     // frames a new monster takes to rise out of the ground
const DEATH_T = 26;       // frames of the death dissolve
const WINDUP_SHOW = 14;   // from here on the attack windup is shown
const MAX_ADDS = 4;
const REGEN_DELAY = 300;     // 5 seconds without being hit before HP regenerates
const BOSS_ATTACK_RANGE = 260;
const ORB_RANGE = 220;

// One life bar: the current bar in front, the next one (dimmer) behind it while lives remain, and a
// row of pips underneath, one per life (lit = left, dark = broken)
function drawLifeBar(ctx, e, x, y, w, h, color) {
  const lives = e.lives || 1, left = e.livesLeft || 1;
  ctx.fillStyle = "#111";
  ctx.fillRect(x, y, w, h);
  if (left > 1) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, (e.hp / e.maxHp) * w), h);
  if (lives < 2) return;
  const pw = w / lives, ph = h > 3 ? 1.5 : 1, gap = h > 3 ? 1.6 : 0.6;   // the boss bar has a frame to clear
  for (let i = 0; i < lives; i++) {
    ctx.fillStyle = i < left ? color : "#3f3f46";
    ctx.fillRect(x + i * pw, y + h + gap, Math.max(0.6, pw - 0.6), ph);
  }
}

const lang = () => (getLang() === "fil" ? "fil" : "en");
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

function levelColor(diff, boss = false) {
  if (boss) return "#c084fc";
  if (diff <= -3) return "#9ca3af";
  if (diff < 0) return "#4ade80";
  if (diff <= 1) return "#facc15";
  if (diff <= 3) return "#fb923c";
  return "#ef4444";
}

export class EnemyManager {
  constructor(worldW, worldH) {
    this.worldW = worldW;
    this.worldH = worldH;
    this.enemies = [];
    this.spawnTimer = 0;
    this.kinds = HUB_KINDS;
    this.elites = HUB_ELITES;
    this.eliteTimer = 0;
    this.tier = 0;
    this.stage = null;
    this.player = null;
    this.loot = null;              // LootManager (set by main.js)
    this.hazards = [];             // the boss's warning circles (explode afterwards)
    this.orbs = [];                // orbs thrown by the boss
    this.corpses = [];             // dying monsters still dissolving ({ e, t })
    this.onBossDefeated = null;    // (enemy) => void
    this.maxAlive = 16;
    this.night = 0;                // 0 = day, 1 = night (set by main.js from DayNight)
    this.targetId = null;          // the hero's current target (has an info tag)
    this.allies = [];              // mercenaries (can be attacked and can provoke)
    this.sparks = [];              // wind-element lightning (for drawing)
    this.hitSource = null;         // overrides who a damage() call is credited to (chain lightning)
    this.onKill = null;            // (enemy, byPlayer, exp) => void — for the bottom tray log
    this.onHeroHit = null;         // () => void — the hero landed a hit (wears the weapon)
  }

  // Is there water (sea/moat/liquid) in the current place?
  hasWaterNearby() {
    if (!this.stage) return false;
    if (this.stage.tilemap && this.stage.tilemap.liquidTiles && this.stage.tilemap.liquidTiles.size > 0) return true;
    if (["coast", "canopy", "frost", "ash", "maw"].includes(this.stage.theme)) return true;
    return false;
  }

  // Change place (Aethelgard or an Act platform)
  // levels: [min, max] for a frontier map (otherwise from the tier)
  setArea(stage, kinds = HUB_KINDS, tier = 0, elites = HUB_ELITES, levels = null) {
    this.stage = stage;
    this.kinds = kinds;
    this.elites = elites || [];
    this.eliteTimer = 0;
    this.tier = tier;
    // Act level floor: VII 10 · VIII 15 · IX 20 · X 25 · XI 30 · XII 35 (Aethelgard has none)
    this.levelFloor = levels ? levels[0] : tier >= 2 ? tier * 5 : 1;
    this.levelCap = levels ? levels[1] : this.levelFloor + 7;
    this.enemies = [];
    this.corpses = [];
    this.hazards = [];
    this.orbs = [];
    this.spawnTimer = 0;
    this.maxAlive = 16;
  }

  // Place start-up: one of each of the place's elite kinds (with a minion) and a handful of regulars
  init(playerLevel = 1) {
    this.enemies = [];
    this.maxAlive = 16;
    this.eliteTimer = 0;
    this.elites.forEach((k) => {
      if (!MONSTERS[k]) return;
      const spot = this.randomSpot(MONSTERS[k]);
      this.spawn(k, playerLevel, spot.x, spot.y, rint(1, 3), "elite");
    });
    for (let i = 0; i < 6; i++) this.spawnRandomEnemy(playerLevel);
  }

  // A slain elite kind comes back after a while (so side quests that hunt it can always be finished)
  respawnElites(playerLevel) {
    if (++this.eliteTimer < ELITE_RESPAWN) return;
    this.eliteTimer = 0;
    const alive = new Set(this.enemies.filter((e) => e.isAlive && e.elite).map((e) => e.key));
    const k = this.elites.find((key) => MONSTERS[key] && !alive.has(key));
    if (!k) return;
    const spot = this.randomSpot(MONSTERS[k]);
    this.spawn(k, playerLevel, spot.x, spot.y, rint(1, 3), "elite");
  }

  // Regular kinds of the place (night adds the night prowlers on the plains); elite kinds never spawn at random
  regularPool() {
    const pool = this.stage && this.stage.id === "hub" && this.night > 0.5 ? [...this.kinds, ...NIGHT_KINDS] : this.kinds;
    return pool.filter((k) => MONSTERS[k] && !MONSTERS[k].elite);
  }

  // A spot that suits the monster (Land, Sky or Sea)
  randomSpot(forKind = null) {
    const st = this.stage;
    const b = st ? st.bounds : { minX: 140, maxX: this.worldW - 140, minY: 140, maxY: this.worldH - 140 };

    // Sea creatures: on the shore, sea or liquid tiles
    if (forKind && (forKind.aquatic || forKind.medium === "sea")) {
      if (st && st.tilemap) {
        for (let k = 0; k < 40; k++) {
          const x = b.minX + 30 + Math.random() * (b.maxX - b.minX - 60);
          const y = b.minY + 30 + Math.random() * (b.maxY - b.minY - 60);
          if (st.safeZoneAt && st.safeZoneAt(x + 10, y + 17)) continue;
          if (this.player && Math.hypot(x - this.player.x, y - this.player.y) < 140) continue;
          if (st.tilemap.isLiquidAt && st.tilemap.isLiquidAt(x + 10, y + 20)) return { x, y };
        }
      }
    }

    // Flyers (Sky): may hover anywhere, even over water or cliffs
    if (forKind && (forKind.flying || forKind.medium === "sky")) {
      for (let k = 0; k < 35; k++) {
        const x = b.minX + 30 + Math.random() * (b.maxX - b.minX - 60);
        const y = b.minY + 30 + Math.random() * (b.maxY - b.minY - 60);
        if (st && st.safeZoneAt && st.safeZoneAt(x + 10, y + 17)) continue;
        if (this.player && Math.hypot(x - this.player.x, y - this.player.y) < 140) continue;
        return { x, y };
      }
    }

    // Land creatures: solid, walkable ground
    for (let k = 0; k < 45; k++) {
      const x = b.minX + 40 + Math.random() * (b.maxX - b.minX - 80);
      const y = b.minY + 40 + Math.random() * (b.maxY - b.minY - 80);
      if (st && st.safeZoneAt && st.safeZoneAt(x + 10, y + 17)) continue;
      if (st && st.tilemap && (st.tilemap.isSolidAt(x + 10, y + 20) || (st.tilemap.isLiquidAt && st.tilemap.isLiquidAt(x + 10, y + 20)) || (st.tilemap.isReachable && !st.tilemap.isReachable(x + 10, y + 20)))) continue;
      if (this.player && Math.hypot(x - this.player.x, y - this.player.y) < 150) continue;
      return { x, y };
    }
    return { x: 140 + Math.random() * (this.worldW - 280), y: 140 + Math.random() * (this.worldH - 280) };
  }

  // A level from the place's fixed band (night in Aethelgard is 3 levels harder)
  rollLevel() {
    const nightBonus = this.stage && this.stage.id === "hub" && this.night > 0.5 ? 3 : 0;
    return rint(this.levelFloor || 1, this.levelCap || 8) + nightBonus;
  }

  spawnRandomEnemy(playerLevel) {
    const pool = this.regularPool();
    if (!pool.length) return null;
    const key = pool[Math.floor(Math.random() * pool.length)];
    const def = MONSTERS[key];
    const { x, y } = this.randomSpot(def);
    return this.spawn(key, playerLevel, x, y);
  }

  // levelOffset: added to the rolled band level · fixedLevel: exact level (minions)
  // forceTier: "normal" for minions (never champion/elite)
  spawn(key, playerLevel, x, y, levelOffset = null, forceTier = null, fixedLevel = null) {
    const kind = MONSTERS[key];
    if (!kind) return null;
    const lvl = Math.max(1, fixedLevel ?? this.rollLevel() + (levelOffset || 0));
    const hp = Math.round((35 + lvl * 12) * kind.hpMult);
    const e = {
      id: Math.random(), key, type: key, kind, level: lvl,
      maxHp: hp, hp, speed: kind.speed, damage: Math.round(kind.dmg + lvl * 1.6), reach: kind.reach || 16,
      x, y, homeX: x, homeY: y, isAlive: true, facing: "left",
      anim: "idle", dir: "down", flip: false, animTimer: 0, strikeTimer: 0,
      hitTimer: 0, stunTimer: 0, windupTimer: 0, spawnT: 0,
      provoked: false, engaged: false, wanderX: x, wanderY: y, wanderTimer: rint(20, 120),
      element: kind.element || "neutral", variant: null, champion: false
    };
    // Elemental variant (Blazing, Frozen, …) and tier: Champion / Elite (Diablo II)
    const v = rollVariant(this.stage ? this.stage.id : "hub");
    if (v && v !== e.element) { e.variant = v; e.element = v; }
    // An elite kind is always an Elite; a regular kind is never forced into one by accident
    applyTier(e, kind.elite ? (forceTier === "normal" ? "elite" : forceTier || "elite") : forceTier || rollTier());
    applyLives(e);     // stacked HP bars by level and tier (js/monsterTiers.js)
    this.enemies.push(e);
    // Elites bring minions: an elite kind brings one regular of its medium, a lucky regular Elite two of its own kind
    if (e.elite) {
      const medium = kind.medium || "land";
      const same = kind.elite ? this.kinds.filter((k) => MONSTERS[k] && !MONSTERS[k].elite && (MONSTERS[k].medium || "land") === medium) : [];
      const n = kind.elite ? 1 : TIERS.elite.minions;
      for (let k = 0; k < n; k++) {
        const mk = kind.elite ? (same.length ? same[Math.floor(Math.random() * same.length)] : null) : key;
        if (!mk) break;
        const m = this.spawn(mk, playerLevel, x + (k ? 18 : -18), y + 10, null, "normal", lvl - 1);
        if (m) { m.minionOf = e.id; m.homeX = x; m.homeY = y; }
      }
    }
    return e;
  }

  // The platform boss: fixed, 2 levels above the top of the Act's band
  spawnBoss(key, x, y, playerLevel) {
    const def = BOSSES[key];
    if (!def || this.boss()) return null;
    const lvl = (this.levelCap || 8) + 2;
    const hp = Math.round((35 + lvl * 12) * def.hpBase);
    const e = {
      id: Math.random(), key, type: key, kind: def, boss: true, level: lvl,
      maxHp: hp, hp, speed: def.speed, damage: Math.round(def.dmg + lvl * 1.8), reach: def.reach, tier: "mvp",
      hitR: def.hitR, hitUp: def.hitUp,
      x, y, homeX: x, homeY: y, isAlive: true, facing: "left",
      anim: "idle", dir: "down", flip: false, animTimer: 0, strikeTimer: 0,
      hitTimer: 0, stunTimer: 0, windupTimer: 0, spawnT: 0, provoked: true, engaged: false,
      bossTimer: 60, pattern: 0, castTimer: 0, enraged: false, element: def.element || "neutral"
    };
    applyLives(e);
    this.enemies.push(e);
    if (Sound && Sound.playBossRoar) Sound.playBossRoar();
    return e;
  }

  boss() {
    return this.enemies.find((e) => e.boss && e.isAlive) || null;
  }

  displayName(e) {
    const base = e.kind.name[lang()];
    const pre = e.variant ? `${variantPrefix(e.variant)} ` : "";
    if (e.elite) return `${tierName(e)} (${pre}${base})`;
    return `${e.champion ? `${tierName(e)} ` : ""}${pre}${base}`;
  }

  update(player, fx, lootManager, stage) {
    this.player = player;
    this.corpses = this.corpses.filter((c) => ++c.t < DEATH_T);
    if (stage) this.stage = stage;
    // Walkers find their way to the hero around obstacles (js/world/nav.js)
    if (this.stage) trackGoal(this.stage, player.x + 10, player.y + 20);
    this.spawnTimer++;
    const alive = this.enemies.filter((e) => e.isAlive && !e.boss).length;
    // More of them, spawning more often, at night
    if (this.spawnTimer > 200 - 60 * this.night && alive < this.maxAlive + Math.round(3 * this.night)) {
      this.spawnTimer = 0;
      this.spawnRandomEnemy(player.level);
    }
    this.respawnElites(player.level);

    this.enemies.forEach((e) => {
      if (!e.isAlive) return;
      if (e.hitTimer > 0) e.hitTimer--;
      if (e.spawnT < SPAWN_POP) e.spawnT++;
      this.regen(e, fx);
      this.tickElement(e, fx);
      if (!e.isAlive) return;
      if (e.stunTimer > 0) {
        e.stunTimer--;
        return;
      }

      // Pushed out of sanctuaries (Barracks, the Citadel dais, platform camps)
      const zone = this.stage && this.stage.safeZoneAt ? this.stage.safeZoneAt(e.x + 10, e.y + 17) : null;
      if (zone) {
        const px = e.x + 10 > zone.x + zone.w / 2 ? 1.5 : -1.5;
        const py = e.y + 17 > zone.y + zone.h / 2 ? 1.5 : -1.5;
        e.x += px;
        e.y += py;
        e.engaged = false;
        this.animate(e, px, py, true);
        return;
      }

      if (e.boss) this.updateBoss(e, player, fx);
      else this.updateMonster(e, player, fx);

      // Soft separation between enemies so they don't stack
      for (let j = 0; j < this.enemies.length; j++) {
        const other = this.enemies[j];
        if (other === e || !other.isAlive) continue;
        const sepDx = e.x - other.x;
        const sepDy = e.y - other.y;
        const sepDist = Math.hypot(sepDx, sepDy);
        if (sepDist < 22 && sepDist > 0.01) {
          const push = ((22 - sepDist) / 22) * 0.5;
          e.x += (sepDx / sepDist) * push;
          e.y += (sepDy / sepDist) * push;
        }
      }
    });

    // Nobody leaves the map or ends up inside a tree, a rock, water or a wall (knockback, separation,
    // teleports included); flyers and bosses only keep to the map's bounds
    this.enemies.forEach((e) => { if (e.isAlive) confine(this.stage, e, 10, 20, Boolean(e.boss || e.kind.flying)); });

    this.updateHazards(player, fx);
    this.enemies = this.enemies.filter((e) => e.isAlive);
  }

  // ---------- ELEMENT EFFECTS ON ENEMIES ----------
  // fire → burn (DoT) · water → chill (−50% speed; a second chill = frozen) · wind → chain lightning
  // earth → stagger · poison → poison (DoT) · shadow → curse (−20% damage)
  applyElement(e, elem, dealt, fx) {
    if (!elem || !e.isAlive) return;
    e.st = e.st || {};
    const r = Math.random();
    if (elem === "fire" && r < 0.35) { e.st.burn = 180; e.st.burnDmg = Math.max(1, Math.round(dealt * 0.08)); }
    else if (elem === "water" && r < 0.4) {
      if (e.st.chill > 0 && !e.boss) { e.stunTimer = Math.max(e.stunTimer, 80); e.frozen = 80; }
      e.st.chill = 150;
    }
    else if (elem === "wind" && r < 0.3) {
      const next = this.enemies.find((o) => o !== e && o.isAlive && Math.hypot(o.x - e.x, o.y - e.y) < 70);
      if (next) {
        // chain lightning is credited to whoever landed the original hit
        this.hitSource = e.lastHitBy || "player";
        this.damage(next, Math.round(dealt * 0.35), 0, false, fx, null, 2);
        this.hitSource = null;
        this.sparks.push({ x0: e.x + 10, y0: e.y + 8, x1: next.x + 10, y1: next.y + 8, t: 10 });
      }
    }
    else if (elem === "earth" && r < 0.18 && !e.boss) e.stunTimer = Math.max(e.stunTimer, 30);
    else if (elem === "poison" && r < 0.35) { e.st.poison = 240; e.st.poisonDmg = Math.max(1, Math.round(totalMaxHp(e) * 0.01)); }
    else if (elem === "shadow" && r < 0.3) e.st.curse = 240;
  }

  tickElement(e, fx) {
    const s = e.st;
    if (!s) return;
    if (e.frozen > 0) e.frozen--;
    ["burn", "chill", "poison", "curse"].forEach((k) => { if (s[k] > 0) s[k]--; });
    if (s.burn > 0 && s.burn % 30 === 0) this.dot(e, s.burnDmg, "#f97316", fx);
    if (s.poison > 0 && s.poison % 45 === 0) this.dot(e, s.poisonDmg, "#4ade80", fx);
  }

  dot(e, amt, color, fx) {
    e.hp -= amt;
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(e.x + 10, e.y - 4, amt, false, color);
    if (e.hp <= 0) this.fall(e, fx);
  }

  // After 5 seconds without a hit, HP regenerates (1% of all bars every 0.5s; bosses 0.5%), but only
  // up to the top of the current bar: a broken life stays broken
  regen(e, fx) {
    e.sinceHit = (e.sinceHit || 0) + 1;
    if (e.sinceHit < REGEN_DELAY || e.hp >= e.maxHp) return;
    if (e.sinceHit % 30 === 0) {
      const amt = Math.min(e.maxHp - e.hp, Math.max(1, Math.round(totalMaxHp(e) * (e.boss ? 0.005 : 0.01))));
      e.hp = Math.min(e.maxHp, e.hp + amt);
      if (e.sinceHit % 90 === 0 && fx && fx.spawnDamagePopup) fx.spawnDamagePopup(e.x + 10, e.y + (e.kind.barY || 0) - 4, `+${amt * 3}`, false, "#4ade80");
      if (e.livesLeft === e.lives && e.hp >= e.maxHp && !e.boss && !e.engaged) e.provoked = false;   // it has forgotten you
    }
  }

  // Aggressive at the same or a higher level, or when provoked
  isAggressive(e, player) {
    return e.boss || e.provoked || e.level - player.level >= 0;
  }

  updateMonster(e, player, fx) {
    const aggressive = this.isAggressive(e, player);

    // Target: the Priest's Guardian Angels first, if any
    let target = player;
    const angels = player.angelCompanions || player.angels;
    if (aggressive && angels && angels.length) {
      const a = angels.find((x) => x.isAlive);
      if (a) target = a;
    }
    // A mercenary blocking (closer than the hero) or provoking
    const blocker = this.allies.find((m) => m.isAlive && Math.hypot(m.x - e.x, m.y - e.y) < 22);
    if (aggressive && blocker && Math.hypot(blocker.x - e.x, blocker.y - e.y) < Math.hypot(target.x - e.x, target.y - e.y)) target = blocker;
    if (e.taunt && e.taunt.t > 0 && e.taunt.merc.isAlive) { e.taunt.t--; target = e.taunt.merc; e.provoked = true; }
    const dx = target.x - e.x, dy = target.y - e.y;
    const dist = Math.hypot(dx, dy);
    const diff = e.level - player.level;
    const aggroR = 120 + Math.max(0, diff) * 12 + 60 * this.night;     // sees farther at night

    let mx = 0, my = 0;
    const spd = e.speed * (1 + 0.15 * this.night) * (e.st && e.st.chill > 0 ? 0.5 : 1);
    if (aggressive && (e.engaged ? dist < 320 : dist < aggroR) && !(this.stage && this.stage.isInsideSafeZone(player.x + 10, player.y + 17))) {
      e.engaged = true;
      if (dist > e.reach * 0.6) {
        const [ux, uy] = steer(this.stage, e.x + 10, e.y + 20, target.x + 10, target.y + 20, target === player && !e.kind.flying);
        mx = ux * spd; my = uy * spd;
      }
    } else {
      e.engaged = false;
      // Wanders around its home
      e.wanderTimer--;
      if (e.wanderTimer <= 0) {
        if (Math.random() < 0.55) {
          const a = Math.random() * Math.PI * 2, r = 20 + Math.random() * 60;
          e.wanderX = e.homeX + Math.cos(a) * r;
          e.wanderY = e.homeY + Math.sin(a) * r;
        } else {
          e.wanderX = e.x; e.wanderY = e.y;
        }
        e.wanderTimer = rint(90, 220);
      }
      const wx = e.wanderX - e.x, wy = e.wanderY - e.y, wd = Math.hypot(wx, wy);
      if (wd > 2) { mx = (wx / wd) * e.speed * 0.5; my = (wy / wd) * e.speed * 0.5; }
    }
    e.x += mx;
    e.y += my;
    if (mx) e.facing = mx >= 0 ? "right" : "left";
    // Teleporter: appears beside the hero every ~5 seconds
    if (has(e, "teleporter") && e.engaged && dist > 60 && (e.tpTimer = (e.tpTimer || 0) + 1) > 300) {
      e.tpTimer = 0;
      if (fx && fx.spawnHitSparks) fx.spawnHitSparks(e.x + 10, e.y + 10, MODS.teleporter.color, 12);
      e.x = player.x + (Math.random() < 0.5 ? -22 : 22);
      e.y = player.y + 4;
      if (fx && fx.spawnHitSparks) fx.spawnHitSparks(e.x + 10, e.y + 10, MODS.teleporter.color, 12);
    }

    // Atake
    if (e.engaged && dist <= e.reach) {
      e.windupTimer++;
      if (e.windupTimer > windupFor(e, 36)) {
        e.windupTimer = 0;
        e.strikeTimer = e.strikeMax = 12;
        this.hitTarget(e, target, player, fx, e.damage);
      }
    } else {
      e.windupTimer = 0;
    }

    const moved = Math.hypot(mx, my) > 0.01;
    this.animate(e, e.engaged ? dx : mx, e.engaged ? dy : my, moved);
  }

  hitTarget(e, target, player, fx, dmg) {
    dmg = Math.round(dmg * (1 + 0.2 * this.night) * (e.st && e.st.curse > 0 ? 0.8 : 1) * damageDealtMult(e));   // night · curse · berserk
    // Vampiric: heals for 30% of the damage
    if (has(e, "vampiric")) e.hp = Math.min(e.maxHp, e.hp + Math.round(dmg * 0.3));
    if (target === player) {
      const before = player.hp;
      player.takeDamage(dmg, fx, e);
      const ELEM_BLIGHT = { fire: "burn", water: "freeze", poison: "poison", shadow: "curse", wind: "electrified", undead: "curse", ghost: "confusion" };
      const d = modBlight(e) || e.kind.debuff || (ELEM_BLIGHT[e.element] ? { type: ELEM_BLIGHT[e.element], chance: e.variant ? 0.2 : 0.08, time: 180 } : null);
      if (d && player.hp < before && Math.random() < d.chance) {
        const type = d.type === "all" ? BLIGHTS[Math.floor(Math.random() * BLIGHTS.length)] : d.type;
        const hit = player.inflictDebuff(type, d.time);
        if (fx && fx.spawnDamagePopup) {
          fx.spawnDamagePopup(player.x + 10, player.y - 14, hit ? statusName(type).toUpperCase() : "RESIST!", false, hit ? (STATUS[type] || {}).color || "#c084fc" : "#94a3b8");
        }
      }
    } else {
      target.hp -= dmg;
      target.hitTimer = 16;
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(target.x + 8, target.y - 6, `-${dmg}`, false, "#ffd166");
    }
  }

  // ---------- BOSS ----------
  updateBoss(e, player, fx) {
    const def = e.kind;
    const px = player.x + 10, py = player.y + 17;
    const bx = e.x + 10, by = e.y + 17;
    const dx = px - bx, dy = py - by;
    const dist = Math.hypot(dx, dy);
    const playerSafe = this.stage && this.stage.isInsideSafeZone(px, py);
    e.engaged = !playerSafe && dist < 360;

    if (!e.enraged && hpFrac(e) < 0.5) {
      e.enraged = true;
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(bx, by - 60, lang() === "fil" ? "NAGNGINGITNGIT!" : "ENRAGED!", true, "#ef4444");
      if (fx && fx.addScreenShake) fx.addScreenShake(6);
    }
    // MVP desperation (25%): summons minions at once and attacks faster
    if (!e.desperate && hpFrac(e) < 0.25) {
      e.desperate = true;
      e.speed *= 1.2;
      e.bossTimer = 20;
      e.pattern = Object.keys(def.attacks).indexOf("summon");
      if (e.pattern < 0) e.pattern = 0;
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(bx, by - 70, lang() === "fil" ? "HULING LAKAS!" : "DESPERATION!", true, "#f59e0b");
      if (fx && fx.addScreenShake) fx.addScreenShake(8);
    }

    // Movement: approaches the player but never leaves the arena
    let mx = 0, my = 0;
    const home = Math.hypot(e.x - e.homeX, e.y - e.homeY);
    if (e.castTimer > 0) {
      e.castTimer--;
    } else if (!def.static && e.engaged && dist > e.reach * 0.8 && home < 230) {
      mx = (dx / dist) * e.speed * (e.enraged ? 1.3 : 1);
      my = (dy / dist) * e.speed * (e.enraged ? 1.3 : 1);
    } else if (!def.static && (!e.engaged || home >= 230) && home > 4) {
      mx = ((e.homeX - e.x) / home) * e.speed;
      my = ((e.homeY - e.y) / home) * e.speed;
    }
    e.x += mx;
    e.y += my;

    // Punch/slam when close
    if (e.engaged && dist <= e.reach) {
      e.windupTimer++;
      if (e.windupTimer > 45) {
        e.windupTimer = 0;
        e.strikeTimer = e.strikeMax = 14;
        this.hitTarget(e, player, player, fx, Math.round(e.damage * 0.85));
      }
    } else e.windupTimer = 0;

    // Special attacks
    if (e.engaged && dist < BOSS_ATTACK_RANGE) {
      e.bossTimer--;
      if (e.bossTimer <= 0) {
        e.bossTimer = e.desperate ? 75 : e.enraged ? 95 : 150;
        this.bossAttack(e, player, fx, dist);
      }
    }

    this.animate(e, dx, dy, Math.hypot(mx, my) > 0.01);
    if (e.castTimer > 0 && e.strikeTimer <= 0) e.anim = "attack";
  }

  bossAttack(e, player, fx, dist) {
    const a = e.kind.attacks;
    const list = Object.keys(a);
    const pick = list[e.pattern++ % list.length];
    const bx = e.x + 10, by = e.y + 17;
    const px = player.x + 10, py = player.y + 17;
    e.castTimer = 40;

    if (pick === "slam") {
      // Player far away: move to the next attack (a boss always has an attack besides its slam)
      if (dist > a.slam.radius + 30) return this.bossAttack(e, player, fx, dist);
      this.hazards.push({ x: bx, y: by, r: a.slam.radius, t: 50, max: 50, color: a.slam.color, dmg: Math.round(e.damage * 1.3), src: e });
    } else if (pick === "hazard") {
      const n = e.enraged ? 5 : 3;
      for (let k = 0; k < n; k++) {
        const ang = Math.random() * Math.PI * 2, r = k === 0 ? 0 : 30 + Math.random() * 50;
        this.hazards.push({ x: px + Math.cos(ang) * r, y: py + Math.sin(ang) * r, r: a.hazard.radius, t: 55 + k * 8, max: 55 + k * 8, color: a.hazard.color, dmg: e.damage, src: e });
      }
    } else if (pick === "orb") {
      const n = e.enraged ? 5 : 3;
      const base = Math.atan2(py - (by - 20), px - bx);
      for (let k = 0; k < n; k++) {
        const ang = base + (k - (n - 1) / 2) * 0.28;
        this.orbs.push({ x: bx, y: by - 20, vx: Math.cos(ang) * a.orb.speed, vy: Math.sin(ang) * a.orb.speed, life: Math.round(ORB_RANGE / a.orb.speed), color: a.orb.color, dmg: Math.round(e.damage * 0.7), src: e });
      }
      if (Sound && Sound.playBossCast) Sound.playBossCast(bx, by);
    } else if (pick === "summon") {
      const adds = this.enemies.filter((x) => x.isAlive && x.summoned).length;
      if (adds >= MAX_ADDS) return;
      a.summon.forEach((key, k) => {
        const m = this.spawn(key, player.level, bx - 40 + k * 60, by + 20, null, "normal", e.level - 4 + rint(-1, 1));
        if (m) { m.summoned = true; m.provoked = true; }
      });
      if (fx && fx.spawnHitSparks) fx.spawnHitSparks(bx, by, "#c084fc", 20);
    }
  }

  updateHazards(player, fx) {
    const px = player.x + 10, py = player.y + 17;
    this.hazards.forEach((h) => {
      h.t--;
      if (h.t === 0) {
        if (Math.hypot(px - h.x, (py - h.y) * 1.6) <= h.r) this.hitTarget(h.src, player, player, fx, h.dmg);
        if (fx && fx.spawnHitSparks) fx.spawnHitSparks(h.x, h.y, h.color, 12);
        if (fx && fx.addScreenShake) fx.addScreenShake(3);
      }
    });
    this.hazards = this.hazards.filter((h) => h.t > -10);

    this.orbs.forEach((o) => {
      o.x += o.vx;
      o.y += o.vy;
      o.life--;
      if (Math.hypot(px - o.x, py - 8 - o.y) < 9) {
        this.hitTarget(o.src, player, player, fx, o.dmg);
        o.life = 0;
      }
      // Crosses water/lava/void but stops at walls and trees
      const tm = this.stage && this.stage.tilemap;
      if (tm) {
        const tx = Math.floor(o.x / 16), ty = Math.floor(o.y / 16);
        if (tm.inBounds(tx, ty) && tm.solid[tm.idx(tx, ty)] && !tm.liquid[tm.idx(tx, ty)]) o.life = 0;
      }
    });
    this.orbs = this.orbs.filter((o) => o.life > 0);
  }

  // Direction and animation from the enemy's actual movement
  animate(e, dx, dy, moved) {
    const f = facingFrom(dx, dy, e);
    e.dir = f.dir;
    e.flip = f.flip;
    const len = Math.hypot(dx, dy);
    if (len > 0.001) { e.aimX = dx / len; e.aimY = dy / len; }   // for the lunge
    if (e.strikeTimer > 0) e.strikeTimer--;

    let anim = e.strikeTimer > 0 || e.windupTimer > WINDUP_SHOW ? "attack" : moved ? "walk" : "idle";
    // Sprites that have them (Aseprite sheets): "skill" while charging a strike, "run" while chasing
    const sp = e.kind.sprite;
    if (sp.has && anim === "attack" && e.strikeTimer <= 0 && sp.has("skill", e.dir)) anim = "skill";
    else if (sp.has && anim === "walk" && e.engaged && sp.has("run", e.dir)) anim = "run";
    if (anim !== e.anim) {
      e.anim = anim;
      e.animTimer = 0;
    }
    e.animTimer++;
  }

  // Squash & stretch from the monster's timers: rising in, recoiling, winding up, lunging, breathing
  poseOf(e) {
    const scale = e.kind.scale || 1;
    const spawn = e.spawnT < SPAWN_POP ? spawnPose(e.spawnT, SPAWN_POP) : REST;
    const hit = hitPose(e.hitTimer, e.hitMax || 8, e.hitDir || 0);
    if (e.frozen > 0 || e.stunTimer > 0) return mix(spawn, hit);
    let act = REST;
    if (e.strikeTimer > 0) {
      const max = e.strikeMax || 12;
      act = attackPose(0.35 + 0.65 * (1 - e.strikeTimer / max), e.aimX || 0, e.aimY || 0, 4 * scale);
    } else if (e.windupTimer > WINDUP_SHOW) {
      act = windupPose(e.windupTimer - WINDUP_SHOW, (e.boss ? 45 : windupFor(e, 36)) - WINDUP_SHOW, e.animTimer);
    } else if (e.anim === "idle") {
      act = breathPose(e.animTimer + ((e.id * 1000) | 0));
    }
    return mix(spawn, hit, act);
  }

  frameOf(e) {
    // n = frames in this animation (more when an Aseprite sheet has them); 2-frame attacks and the
    // code-drawn idle/walk timing are unchanged
    const n = e.kind.sprite.count ? e.kind.sprite.count(e.dir, e.anim) : 2;
    if (e.anim === "attack") {                                    // 0 = handa, 1… = tama
      if (e.strikeTimer <= 0) return 0;
      const p = 1 - e.strikeTimer / (e.strikeMax || 12);
      return n <= 2 ? 1 : Math.min(n - 1, 1 + Math.floor(p * (n - 1)));
    }
    if (e.anim === "skill") return Math.min(n - 1, Math.floor(e.animTimer / SKILL_TICKS));   // charge, hold the last pose
    if (e.anim === "run") return Math.floor(e.animTimer / RUN_TICKS);
    const base = e.anim === "walk" ? WALK_TICKS * 4 : IDLE_TICKS * 2;   // one cycle, spread over the frames
    return Math.floor(e.animTimer / Math.max(4, Math.round(base / Math.max(2, n))));
  }

  // player = the attacker (extra damage and crit from stats and equipment)
  // elem = the attack's element (e.g. Meteor's "fire"). player = the attacker (stats, equipment, class)
  damage(enemy, amount, angle, isCrit, fx, lootManager, pushDist = 8, isStun = false, player = null, elem = null) {
    if (!enemy || !enemy.isAlive) return;

    // Element, race and size tables (Ragnarok)
    const em = elementMult(elem || "neutral", enemy.element || "neutral");
    let mod = em;
    if (player && player.heroData) {
      mod *= raceBonus(player.heroData.id, enemy.kind.race) * sizeMod(player.weaponIcon, enemy.kind.size);
      mod *= (player.timeMods && player.timeMods.dmg) || 1;
    }
    amount *= mod * damageTakenMult(enemy);
    // Lightning Enchanted: sparks at a nearby hero when hit
    const pl = this.player;
    if (has(enemy, "lightning") && pl && Math.random() < 0.2 && Math.hypot(pl.x - enemy.x, pl.y - enemy.y) < 70) {
      pl.takeDamage(Math.round(enemy.damage * 0.3), fx, enemy);
      this.sparks.push({ x0: enemy.x + 10, y0: enemy.y + 8, x1: pl.x + 10, y1: pl.y + 10, t: 10 });
    }
    if (fx && fx.spawnDamagePopup && em !== 1) {
      fx.spawnDamagePopup(enemy.x + 10, enemy.y - 16 - (enemy.hitUp || 0), em > 1 ? "WEAK!" : "RESIST", false, em > 1 ? "#facc15" : "#94a3b8");
    }

    if (player && typeof player.attack === "number") {
      const d = player.debuffs || {};
      amount = (amount + player.attack) * (player.dmgMult || 1) * (player.buffs && player.buffs.damage > 0 ? 1.5 : 1) * (d.curse > 0 ? 0.75 : 1);
      // No criticals while blind or cursed
      const canCrit = !(d.blind > 0 || d.curse > 0);
      if (!isCrit && canCrit && Math.random() < (player.crit || 0)) { isCrit = true; amount *= 1.8; }
      amount = Math.round(amount);
      if (!this.hitSource && player.noteHit) player.noteHit(enemy, isCrit);   // play style (js/skillpaths.js)
    } else amount = Math.round(amount);   // allies and familiars: whole numbers after element/tier

    enemy.hp -= amount;
    // Last-hit rule: only a kill landed by the hero (or the hero's summons) earns EXP and loot.
    // Hero attacks pass `player`; mercenaries and NPC allies do not.
    enemy.lastHitBy = this.hitSource || (player ? "player" : "ally");
    if (player && !this.hitSource && this.onHeroHit) this.onHeroHit();
    enemy.hitTimer = enemy.hitMax = isCrit ? 12 : 8;
    enemy.hitDir = -Math.cos(angle);   // recoil away from the blow
    if (isCrit && player && fx && fx.hitStop) fx.hitStop(3);
    enemy.sinceHit = 0;       // delays HP regeneration
    enemy.provoked = true;
    enemy.engaged = true;
    const push = enemy.boss ? pushDist * 0.1 : pushDist;
    enemy.x += Math.cos(angle) * push;
    enemy.y += Math.sin(angle) * push;

    if (isStun && !enemy.boss) enemy.stunTimer = 65;

    if (fx && fx.spawnDamagePopup) {
      fx.spawnDamagePopup(enemy.x + 8, enemy.y - 6 - (enemy.hitUp || 0), amount, isCrit);
    }

    if (Sound && Sound.playHitEnemy) Sound.playHitEnemy(isCrit, enemy.x, enemy.y);

    if (enemy.hp <= 0) this.fall(enemy, fx, elem, amount);
    else this.applyElement(enemy, elem, amount, fx);
  }

  // HP reached 0: break a life if any are left (the overflow carries into the next bar), else die
  fall(e, fx, elem = null, amount = 0) {
    let broke = 0;
    while (e.hp <= 0 && (e.livesLeft || 1) > 1) {
      e.livesLeft--;
      e.hp += e.maxHp;
      broke++;
    }
    if (e.hp <= 0) { this.kill(e, fx); return; }
    this.breakLife(e, fx, broke);
    if (elem) this.applyElement(e, elem, amount, fx);
  }

  // A life bar shattered: a stagger (not on bosses), a burst in the tier colour and "×N" lives left
  breakLife(e, fx, broke) {
    const col = e.boss ? "#c084fc" : e.elite ? TIERS.elite.color : e.champion ? TIERS.champion.color : "#e2e8f0";
    const top = e.y + (e.kind.barY || 0);
    if (!e.boss) { e.stunTimer = Math.max(e.stunTimer, 12); e.windupTimer = 0; }
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(e.x + 10, top + 2, col, e.boss ? 18 : 8);
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(e.x + 10, top - 10, `${broke > 1 ? "−" + broke + " " : ""}×${e.livesLeft}`, e.boss, col);
    if (e.boss && fx && fx.addScreenShake) fx.addScreenShake(3);
    if (fx && fx.hitStop) fx.hitStop(e.boss ? 4 : 2);
  }

  kill(e, fx) {
    e.isAlive = false;
    const p = this.player;
    const diff = p ? e.level - p.level : 0;
    const tierExp = e.boss ? 12 : e.tier && TIERS[e.tier] ? TIERS[e.tier].exp : 1;
    const mult = Math.max(0.25, Math.min(1.8, 1 + diff * 0.12)) * (1 + 0.3 * this.night) * tierExp;
    const byPlayer = e.lastHitBy !== "ally";
    const exp = byPlayer ? Math.round((25 + e.level * 8) * mult) : 0;
    if (exp && p && typeof p.addExp === "function") p.addExp(exp);
    if (this.onKill) this.onKill(e, byPlayer, exp);
    // Death: the body dissolves (drawn from this.corpses), a burst in its colour, and a beat of hit-stop
    this.corpses.push({ e, t: 0 });
    if (Sound) {
      if (e.boss) { if (Sound.playBossDeath) Sound.playBossDeath(); if (Sound.playVictory) Sound.playVictory(); }
      else if (Sound.playEnemyDeath) Sound.playEnemyDeath(e.x, e.y);
    }
    if (fx && fx.spawnDeathBurst) {
      const col = e.elite ? TIERS.elite.color : e.champion ? TIERS.champion.color : e.variant ? ELEMENTS[e.variant].color : "#e2e8f0";
      fx.spawnDeathBurst(e.x + 10, e.y + 12, e.boss ? "#c084fc" : col, e.boss ? 2.4 : e.elite ? 1.5 : 1);
    }
    if (byPlayer && fx && fx.hitStop) fx.hitStop(e.boss ? 16 : e.elite ? 6 : e.champion ? 4 : 2);
    // Fire Enchanted: explodes on death
    if (has(e, "fire") && p && Math.hypot(p.x - e.x, p.y - e.y) < 42) {
      p.takeDamage(Math.round(e.damage * 0.8), fx, e);
      p.inflictDebuff("burn", 180);
    }
    if (has(e, "fire") && fx && fx.spawnHitSparks) fx.spawnHitSparks(e.x + 10, e.y + 10, "#f97316", 24);
    if (this.loot && !byPlayer && e.boss && e.kind.drop) {
      // an ally's last hit forfeits the rewards, but a boss still leaves its quest item
      this.loot.drop({ x: e.x + 10, y: e.y + 12 }, { id: e.kind.drop, qty: 1 }, true);
    } else if (this.loot && byPlayer) {
      this.loot.spawnLoot(e.x + 10, e.y + 12, {
        grade: this.tier, level: e.level, cls: p ? p.heroData.id : "novice", key: e.key,
        boss: Boolean(e.boss), drop: e.boss ? e.kind.drop : null,
        tier: e.boss ? "mvp" : e.tier || "normal", diff, element: e.element, race: e.kind.race,
        extra: Math.random() < 0.3 * this.night ? 1 : 0     // night: extra loot
      });
    }
    if (e.boss) {
      this.hazards = [];
      this.orbs = [];
      this.enemies.forEach((m) => { if (m.summoned) m.isAlive = false; });
      if (fx && fx.addScreenShake) fx.addScreenShake(10);
      if (fx && fx.spawnHitSparks) { fx.spawnHitSparks(e.x + 10, e.y - 10, "#ffd166", 40); fx.spawnHitSparks(e.x + 10, e.y - 30, "#ffffff", 30); }
      if (this.onBossDefeated) this.onBossDefeated(e);
    }
  }

  // ---------- DRAW ----------
  draw(ctx) {
    // Boss warnings (on the ground, before the characters)
    this.hazards.forEach((h) => {
      const k = 1 - Math.max(0, h.t) / h.max;
      ctx.save();
      ctx.globalAlpha = h.t > 0 ? 0.25 + k * 0.35 : 0.8;
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, h.r * (h.t > 0 ? k : 1), h.r * 0.6 * (h.t > 0 ? k : 1), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, h.r, h.r * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // Dying: a white flash, then the body flattens and fades (flyers drop to the ground)
    this.corpses.forEach(({ e, t }) => {
      const k = t / DEATH_T;
      const scale = e.kind.scale || 1;
      const fy = e.y + 17;
      const pose = { sx: 1 + 0.35 * k, sy: Math.max(0.1, 1 - 0.85 * k * k), ox: 0, oy: e.kind.flying ? k * 7 : 0 };
      ctx.save();
      ctx.globalAlpha = 1 - k * k;
      around(ctx, e.x + 10, fy, pose, () => e.kind.sprite.draw(ctx, e.x + 10, fy, e.dir, e.anim, this.frameOf(e), e.flip, t < 4, scale));
      ctx.restore();
    });

    const pl = this.player;
    // Y-sort so they overlap correctly
    [...this.enemies].filter((e) => e.isAlive).sort((a, b) => a.y - b.y).forEach((e) => {
      const k = e.kind;
      const scale = k.scale || 1;
      const fy = e.y + 17;

      // Shadow (small and far when flying)
      if (GFX.shadows) { ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.beginPath(); ctx.ellipse(e.x + 10, fy - 1, (k.flying ? 6 : 9) * (e.boss ? 2.2 : 1), (k.flying ? 2 : 3.5) * (e.boss ? 1.6 : 1), 0, 0, Math.PI * 2); ctx.fill(); }

      // Aura of the elemental variant and the Champion ring
      if (e.variant || e.champion || e.elite) {
        const pulse = 0.5 + Math.sin(e.animTimer / 8) * 0.25;
        ctx.save();
        ctx.globalAlpha = pulse * 0.6;
        ctx.strokeStyle = e.elite ? TIERS.elite.color : e.champion ? TIERS.champion.color : ELEMENTS[e.variant].color;
        ctx.lineWidth = e.champion || e.elite ? 1.5 : 1;
        ctx.beginPath();
        ctx.ellipse(e.x + 10, fy - 1, 11 * (e.boss ? 2 : 1), 4 * (e.boss ? 1.6 : 1), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      around(ctx, e.x + 10, fy, this.poseOf(e), () => k.sprite.draw(ctx, e.x + 10, fy, e.dir, e.anim, this.frameOf(e), e.flip, e.hitTimer > 0, scale));
      // Frozen: blue ice on top
      if (e.frozen > 0) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = "#bfe9ff";
        ctx.fillRect(e.x + 2, fy - 18 * scale, 16 * scale, 18 * scale);
        ctx.restore();
      }

      // HP bar + "Lv N Name" coloured by level
      const diff = pl ? e.level - pl.level : 0;
      const color = levelColor(diff, e.boss);
      const by = e.y + k.barY;
      if (!e.boss) drawLifeBar(ctx, e, e.x, by, 20, 2.5, color);
      ctx.font = "bold 4px monospace";
      ctx.textAlign = "center";
      const mark = e.boss ? "☠ MVP " : e.elite ? `${TIERS.elite.mark} ` : e.champion ? `${TIERS.champion.mark} ` : "";
      const label = `${mark}Lv${e.level} ${this.displayName(e)}`;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(3, 6, 17, 0.6)";
      ctx.fillRect(e.x + 10 - tw / 2 - 1, by - 6, tw + 2, 5);
      ctx.fillStyle = e.elite ? TIERS.elite.color : e.champion ? TIERS.champion.color : color;
      ctx.fillText(label, e.x + 10, by - 2);
      // the level colour sits in a small bar underneath so the warning isn't lost
      if (e.elite || e.champion) { ctx.fillStyle = color; ctx.fillRect(e.x + 10 - tw / 2, by - 0.5, tw, 0.8); }
      // red dot = aggressive
      if (pl && this.isAggressive(e, pl) && !e.boss) {
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(e.x + 10 - tw / 2 - 3, by - 5, 1.5, 1.5);
      }
      // Dot for the element effect on the enemy
      if (e.st) {
        const dots = [["burn", "#f97316"], ["chill", "#7dd3fc"], ["poison", "#4ade80"], ["curse", "#a855f7"]].filter(([s]) => e.st[s] > 0);
        dots.forEach(([, c], i) => { ctx.fillStyle = c; ctx.fillRect(e.x + 10 + tw / 2 + 2 + i * 3, by - 5, 2, 2); });
      }
      // Locked target (Shift): a red pointer above
      if (e.id === this.lockedId) {
        const ly = by - 14 + Math.sin(e.animTimer / 6);
        ctx.fillStyle = "#ef4444";
        ctx.beginPath(); ctx.moveTo(e.x + 10, ly + 4); ctx.lineTo(e.x + 7, ly); ctx.lineTo(e.x + 13, ly); ctx.closePath(); ctx.fill();
      }
      // The hero's target: race · size · element (like Ragnarok's monster info)
      if (e.id === this.targetId) {
        const el = ELEMENTS[e.element] || ELEMENTS.neutral;
        const info = `${raceName(e.kind.race)} · ${sizeName(e.kind.size)} · ${elementName(e.element)}${e.mods ? ` · ${e.mods.map(modName).join(", ")}` : ""}`;
        ctx.font = "3.6px monospace";
        const iw = ctx.measureText(info).width;
        ctx.fillStyle = "rgba(3, 6, 17, 0.7)";
        ctx.fillRect(e.x + 10 - iw / 2 - 1, by - 11, iw + 2, 4.5);
        ctx.fillStyle = el.color;
        ctx.fillText(info, e.x + 10, by - 7.6);
        ctx.strokeStyle = e.id === this.lockedId ? "rgba(239, 68, 68, 0.95)" : "rgba(255, 209, 102, 0.8)";
        ctx.lineWidth = e.id === this.lockedId ? 1 : 0.6;
        ctx.beginPath();
        ctx.ellipse(e.x + 10, fy - 1, 12 * (e.boss ? 2 : 1), 4.5 * (e.boss ? 1.6 : 1), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Wind lightning jumping to a nearby enemy
    this.sparks.forEach((s) => {
      s.t--;
      ctx.strokeStyle = `rgba(190, 242, 100, ${s.t / 10})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x0, s.y0);
      ctx.lineTo((s.x0 + s.x1) / 2 + (Math.random() - 0.5) * 8, (s.y0 + s.y1) / 2 + (Math.random() - 0.5) * 8);
      ctx.lineTo(s.x1, s.y1);
      ctx.stroke();
    });
    this.sparks = this.sparks.filter((s) => s.t > 0);

    // Boss orbs
    this.orbs.forEach((o) => {
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.arc(o.x, o.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(Math.round(o.x - 1), Math.round(o.y - 1), 2, 2);
    });
  }

  // The boss's big HP bar at the top of the screen (screen space)
  drawBossBar(ctx, W) {
    const e = this.boss();
    if (!e || !e.engaged) return;
    const w = 220, x = Math.round(W / 2 - w / 2), y = 16;
    ctx.save();
    ctx.fillStyle = "rgba(3, 6, 17, 0.85)";
    ctx.fillRect(x - 3, y - 9, w + 6, (e.lives || 1) > 1 ? 18 : 16);
    ctx.fillStyle = "#1f1026";
    ctx.fillRect(x, y, w, 4);
    drawLifeBar(ctx, e, x, y, w, 4, e.enraged ? "#ef4444" : "#c084fc");
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 0.6;
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, 5);
    if ((e.lives || 1) > 1) {
      ctx.font = "bold 5px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffd166";
      ctx.fillText(`×${e.livesLeft}`, x + w + 4, y + 4);
    }
    ctx.font = "bold 5px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd166";
    ctx.fillText(`☠ ${this.displayName(e)} · Lv${e.level}${e.enraged ? "  ⚠" : ""}`, W / 2, y - 3);
    ctx.restore();
  }
}
