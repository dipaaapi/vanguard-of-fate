// Look: modular Avatar (see js/avatar/avatar.js)
export const AxeMercenary = {
  type: "axe",
  name: "Axeman",
  maxHp: 180,
  speed: 1.35,
  attackRange: 26,
  attackCooldownMax: 45,
  skillCooldownMax: 240, // 4s Whirlwind
  color: "#e63946",
  look: {
    body: "male", skin: "#e0ac69", eyes: "#4a3222", hairStyle: "spiky", hairColor: "#8a3b24", beard: true,
    outfit: "vest", outfitColor: "#8a2c2c", gloves: "leather", legs: "pants", legColor: "#3b3f4a",
    boots: "boots", bootColor: "#3a2616", headgear: "headband", weapon: "axe"
  },
  // Skills (besides the attack and Whirlwind): War Cry and Bloodlust (passive)
  skills: [
    { id: "warcry", name: { en: "War Cry", fil: "Sigaw ng Digmaan" }, cd: 1200,
      ready: (m, c) => c.foes.length >= 2,
      use: (m, c) => {
        c.player.buffs.damage = Math.max(c.player.buffs.damage, 360);
        if (c.fx.spawnDamagePopup) c.fx.spawnDamagePopup(m.x + 8, m.y - 22, "WAR CRY! +50% DMG", true, "#e63946");
      } }
  ],
  passive: { en: "Bloodlust: heals on every hit", fil: "Bloodlust: gumagaling sa bawat tama" },
  onAttack(merc, target, enemyManager, fx) {
    const angle = Math.atan2(target.y - merc.y, target.x - merc.x);
    enemyManager.damage(target, 24, angle, false, fx, null, 12);
    merc.hp = Math.min(merc.maxHp, merc.hp + Math.round(merc.maxHp * 0.03));   // Bloodlust
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(target.x + 8, target.y + 8, "#e63946", 10);
  },
  onSkill(merc, enemies, enemyManager, fx) {
    // Whirlwind 360 Spin
    enemies.forEach((e) => {
      if (e.isAlive && Math.hypot(e.x - merc.x, e.y - merc.y) < 48) {
        const ang = Math.atan2(e.y - merc.y, e.x - merc.x);
        enemyManager.damage(e, 42, ang, true, fx, null, 16);
      }
    });
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(merc.x + 8, merc.y + 8, "#ff0055", 18);
  }
};