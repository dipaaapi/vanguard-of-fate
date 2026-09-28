// Look: modular Avatar (see js/avatar/avatar.js)
export const GreatswordMercenary = {
  type: "greatsword",
  name: "Vanguard Knight",
  maxHp: 240,
  speed: 1.15,
  attackRange: 32,
  attackCooldownMax: 50,
  skillCooldownMax: 300,
  color: "#ffd166",
  look: {
    body: "male", skin: "#f1c27d", eyes: "#4a3222", hairStyle: "short", hairColor: "#7a5230",
    outfit: "armor", outfitColor: "#c9a063", gloves: "leather", legs: "pants", legColor: "#7d8c9e",
    boots: "boots", bootColor: "#2b2b33", headgear: "helmet", cape: "#c9a063", weapon: "greatsword"
  },
  // Provoke (draws the monsters' attention) and Guardian Aura (passive: −15% damage to the hero when close)
  skills: [
    { id: "provoke", name: { en: "Provoke", fil: "Hamon" }, cd: 900,
      ready: (m, c) => c.foes.some((e) => e.engaged),
      use: (m, c) => {
        c.foes.forEach((e) => { if (!e.boss && Math.hypot(e.x - m.x, e.y - m.y) < 110) e.taunt = { merc: m, t: 240 }; });
        if (c.fx.spawnDamagePopup) c.fx.spawnDamagePopup(m.x + 8, m.y - 22, "PROVOKE!", true, "#ffd166");
      } }
  ],
  passive: { en: "Guardian Aura: you take 15% less damage nearby", fil: "Guardian Aura: −15% pinsala sa iyo kapag malapit" },
  guardAura: true,
  onAttack(merc, target, enemyManager, fx) {
    const angle = Math.atan2(target.y - merc.y, target.x - merc.x);
    enemyManager.damage(target, 30, angle, false, fx, null, 14);
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(target.x + 8, target.y + 8, "#ffd166", 12);
  },
  onSkill(merc, enemies, enemyManager, fx) {
    // Heavy Earthshatter
    enemies.forEach((e) => {
      if (e.isAlive && Math.hypot(e.x - merc.x, e.y - merc.y) < 56) {
        enemyManager.damage(e, 55, Math.atan2(e.y - merc.y, e.x - merc.x), true, fx, null, 22, true);
      }
    });
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(merc.x + 8, merc.y + 8, "#ffd166", 24);
  }
};