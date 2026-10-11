import { premiumSkill } from "../premium.js";
import { summonCfg } from "./summoncfg.js";
import { AdventureNavigator } from "../autoadventure.js";
import { confine } from "../world/nav.js";
import { isAway } from "../errand.js";

export const summonAutoEnabled = p => p.hp > 0 && p.autoAttackTime() > 0 && p.autoAttack.until > 0;
export const summonLootEnabled = p => p.premium?.skills.autoLoot ? premiumSkill(p, "autoLoot") : summonAutoEnabled(p);
export const summonDefenceEnabled = p => p.premium?.skills.autoDefend ? premiumSkill(p, "autoDefend") : summonAutoEnabled(p);
// The foe a summon goes after, as chosen in the Summon panel: aggressive / defensive / passive, within its range
export function summonTarget(p, enemies, radius = 180) {
  const c = summonCfg(p);
  if (c.attack === "passive") return null;
  return summonThreat(p, enemies, Math.min(radius + 80, c.range), c.attack === "defensive");
}
export function summonThreat(p, enemies, radius = 180, defensiveOnly = false) {
  let best = null, bestScore = Infinity;
  for (const e of enemies) {
    if (!e.isAlive || e.minionOf === "summon") continue;
    const distance = Math.hypot(e.x - p.x, e.y - p.y);
    if (distance > radius) continue;
    const dangerous = Boolean(e.engaged || e.provoked || e.guildEscortTarget || e.windupTimer > 0);
    if (defensiveOnly && !dangerous && distance > 48) continue;
    // An attacker on the hero always outranks the hero's distant selected foe.
    const score = distance - (dangerous ? 300 : 0) - (e === p.target ? 30 : 0);
    if (score < bestScore) { best = e; bestScore = score; }
  }
  return best;
}

const lootClaims = new WeakMap();
function releaseLoot(pet) {
  if (pet.autoLootTarget && lootClaims.get(pet.autoLootTarget)?.pet === pet) lootClaims.delete(pet.autoLootTarget);
  pet.autoLootTarget = null;
}

export function autoSummonDefence(p, manager, stage, Angel, loot = null) {
  const canDefend = summonDefenceEnabled(p), canLoot = summonLootEnabled(p);
  const safe = stage.isInsideSafeZone(p.x + 10, p.y + 17);
  if ((!canDefend && !canLoot) || p.paralyzed || p.debuffs?.silence > 0) return;
  const selected = p.target?.isAlive && manager.enemies.includes(p.target) && Math.hypot(p.target.x - p.x, p.target.y - p.y) <= 240 ? p.target : null;
  const target = canDefend && !safe && summonCfg(p).attack !== "passive" ? summonThreat(p, manager.enemies, Math.max(240, summonCfg(p).range), true) || selected : null;
  const pickup = canLoot && loot?.items.some(i => !(i.blocked > 0) && i.targetSlideX === undefined &&
    Math.hypot(i.x - p.x - 10, i.y - p.y - 20) <= 240);
  if ((!target && !pickup) || p.skillCooldownTimer > 0) return;
  const falcon = p.falconCompanion;
  if (target && falcon && !falcon.aboard && !isAway(p, "falcon") && !["ATTACKING", "RETURNING"].includes(falcon.state)) {
    falcon.triggerStrike(target, target.x, target.y); p.skillCooldownTimer = 220;
  }
  if (p.heroData.id === "priest" && !p.inBoat) {
    p.angelCompanions = (p.angelCompanions || []).filter(a => a.isAlive);
    p.angels = p.angelCompanions;
    if (p.angelCompanions.length < (isAway(p, "angel") ? 1 : 2)) {
      const guardian = new Angel(p.x + (p.angelCompanions.length ? 30 : -30), p.y - 16, Math.round(p.maxHp * .5));
      guardian.lootOnly = !canDefend;
      p.angelCompanions.push(guardian);
      p.skillCooldownTimer = 180;
    }
  }
}

// Pickups go through the normal loot manager, preserving capacity, coins and quest callbacks.
// Walkers use their own path field; flyers may cross obstacles but never collect unsettled drops.
export function autoSummonLoot(pet, p, manager, loot, fx, stage, { x = 10, y = 20, fly = false, speed = 2.5 } = {}) {
  if (!summonLootEnabled(p) || pet.aboard || pet.isAlive === false || pet.hp === 0 || !stage || !loot || summonThreat(p, manager.enemies, 180, true)) {
    releaseLoot(pet); return false;
  }
  const now = performance.now();
  const current = pet.autoLootTarget;
  const candidates = loot.items.filter(i => !(i.blocked > 0) && i.targetSlideX === undefined && Math.hypot(i.x - p.x - 10, i.y - p.y - 20) <= (i === current ? 320 : 240) &&
    (!lootClaims.has(i) || lootClaims.get(i).pet === pet || lootClaims.get(i).until < now));
  if (!candidates.length) { releaseLoot(pet); return false; }
  candidates.sort((a, b) => Number(Boolean(b.quest)) - Number(Boolean(a.quest)) || Number(b === current) - Number(a === current) || Math.hypot(a.x - pet.x - x, a.y - pet.y - y) - Math.hypot(b.x - pet.x - x, b.y - pet.y - y));
  const nav = pet.autoLootNavigator ||= new AdventureNavigator();
  const actor = { x: pet.x + x - 10, y: pet.y + y - 20 };
  if (!fly) nav.build(stage, actor, now);
  let item, dir;
  for (const candidate of candidates) {
    const dx = candidate.x - pet.x - x, dy = candidate.y - pet.y - y, d = Math.hypot(dx, dy);
    const direction = fly ? [dx / (d || 1), dy / (d || 1)] : nav.direction(actor, candidate, 10);
    if (direction) { item = candidate; dir = direction; break; }
  }
  if (pet.autoLootTarget !== item) releaseLoot(pet);
  pet.autoLootTarget = item || null;
  if (item) lootClaims.set(item, { pet, until: now + 500 });
  if (!item) return false;
  pet.target = null;
  const distance = Math.hypot(item.x - pet.x - x, item.y - pet.y - y);
  if (distance <= 14) {
    if (!loot.pickUp(p, item, fx)) item.blocked = 90;
    releaseLoot(pet);
    return true;
  }
  const step = Math.min(speed, distance - 10);
  pet.x += dir[0] * step; pet.y += dir[1] * step;
  if (!fly) confine(stage, pet, x, y);
  pet.anim = "walk"; pet.state = "HOVERING";
  return true;
}
