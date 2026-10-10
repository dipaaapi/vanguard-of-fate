import { AdventureNavigator } from "../autoadventure.js";
import { confine } from "../world/nav.js";
import { isAway } from "../errand.js";

export const summonAutoEnabled = p => p.hp > 0 && p.autoAttackTime() > 0 && p.autoAttack.until > 0;
export function summonThreat(p, enemies, radius = 120) {
  const near = e => e.isAlive && e.minionOf !== "summon" && Math.hypot(e.x - p.x, e.y - p.y) <= radius;
  if (p.target && near(p.target)) return p.target;
  return enemies.filter(near).sort((a, b) => Number(Boolean(b.engaged || b.guildEscortTarget)) - Number(Boolean(a.engaged || a.guildEscortTarget)) || Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0] || null;
}

export function autoSummonDefence(p, manager, stage, Angel, loot = null) {
  if (!summonAutoEnabled(p) || p.paralyzed || p.debuffs?.silence > 0 || stage.isInsideSafeZone(p.x + 10, p.y + 17)) return;
  const target = summonThreat(p, manager.enemies, 240);
  const pickup = loot?.items.some(i => Math.hypot(i.x - p.x - 10, i.y - p.y - 20) <= 180);
  if ((!target && !pickup) || p.skillCooldownTimer > 0) return;
  const falcon = p.falconCompanion;
  if (target && falcon && !falcon.aboard && !isAway(p, "falcon") && !["ATTACKING", "RETURNING"].includes(falcon.state)) {
    falcon.triggerStrike(target, target.x, target.y); p.skillCooldownTimer = 220;
  }
  if (p.heroData.id === "priest" && !p.inBoat) {
    p.angelCompanions = (p.angelCompanions || []).filter(a => a.isAlive);
    if (p.angelCompanions.length < (isAway(p, "angel") ? 1 : 2)) {
      p.angelCompanions.push(new Angel(p.x + (p.angelCompanions.length ? 30 : -30), p.y - 16, Math.round(p.maxHp * .5)));
      p.skillCooldownTimer = 180;
    }
  }
}

// Pickups go through the normal loot manager, preserving capacity, coins and quest callbacks.
// Walkers use their own path field; flyers may cross obstacles but never collect unsettled drops.
export function autoSummonLoot(pet, p, manager, loot, fx, stage, { x = 10, y = 20, fly = false, speed = 2.5 } = {}) {
  if (!summonAutoEnabled(p) || pet.aboard || pet.isAlive === false || pet.hp === 0 || !stage || !loot || summonThreat(p, manager.enemies)) {
    pet.autoLootTarget = null; return false;
  }
  const candidates = loot.items.filter(i => !(i.blocked > 0) && i.targetSlideX === undefined && Math.hypot(i.x - p.x - 10, i.y - p.y - 20) <= 180);
  candidates.sort((a, b) => Number(Boolean(b.quest)) - Number(Boolean(a.quest)) || Math.hypot(a.x - pet.x - x, a.y - pet.y - y) - Math.hypot(b.x - pet.x - x, b.y - pet.y - y));
  const nav = pet.autoLootNavigator ||= new AdventureNavigator();
  const actor = { x: pet.x + x - 10, y: pet.y + y - 20 };
  if (!fly) nav.build(stage, actor, performance.now());
  let item, dir;
  for (const candidate of candidates) {
    const dx = candidate.x - pet.x - x, dy = candidate.y - pet.y - y, d = Math.hypot(dx, dy);
    const direction = fly ? [dx / (d || 1), dy / (d || 1)] : nav.direction(actor, candidate, 10);
    if (direction) { item = candidate; dir = direction; break; }
  }
  pet.autoLootTarget = item || null;
  if (!item) return false;
  pet.target = null;
  const distance = Math.hypot(item.x - pet.x - x, item.y - pet.y - y);
  if (distance <= 14) {
    if (!loot.pickUp(p, item, fx)) item.blocked = 90;
    return true;
  }
  const step = Math.min(speed, distance - 10);
  pet.x += dir[0] * step; pet.y += dir[1] * step;
  if (!fly) confine(stage, pet, x, y);
  pet.anim = "walk"; pet.state = "HOVERING";
  return true;
}
