// Look: modular Avatar (see js/avatar/avatar.js)
export const WandMercenary = {
  type: "wand",
  name: "Mage Apprentice",
  maxHp: 160,
  speed: 1.25,
  attackRange: 130,
  attackCooldownMax: 55,
  skillCooldownMax: 320,
  color: "#4cc9f0",
  look: {
    body: "female", skin: "#f7d9c4", eyes: "#2f6db5", hairStyle: "ponytail", hairColor: "#3b4a8a",
    outfit: "robe", outfitColor: "#5a3d91", gloves: "none", legs: "pants", legColor: "#2b2b33",
    boots: "shoes", bootColor: "#2b2b33", headgear: "hat", weapon: "wand"
  },
  // Heal Ally (when the hero's HP is low) and Frost Nova (freezes nearby foes)
  skills: [
    { id: "heal", name: { en: "Heal Ally", fil: "Pagalingin ang Kakampi" }, cd: 720,
      ready: (m, c) => c.player.hp < c.player.maxHp * 0.6,
      use: (m, c) => {
        const amt = Math.round(c.player.maxHp * 0.12 * Math.min(1.25, 0.8 + (m.power || 1) * 0.1));
        c.player.hp = Math.min(c.player.maxHp, c.player.hp + amt);
        if (c.fx.spawnDamagePopup) c.fx.spawnDamagePopup(c.player.x + 10, c.player.y - 14, `+${amt} HEAL`, true, "#4cc9f0");
        if (c.fx.spawnHitSparks) c.fx.spawnHitSparks(c.player.x + 10, c.player.y + 8, "#4cc9f0", 12);
      } },
    { id: "nova", name: { en: "Frost Nova", fil: "Frost Nova" }, cd: 660,
      ready: (m, c) => c.foes.some((e) => Math.hypot(e.x - m.x, e.y - m.y) < 60),
      use: (m, c) => {
        c.foes.forEach((e) => {
          if (Math.hypot(e.x - m.x, e.y - m.y) < 60 && !e.boss) e.stunTimer = Math.max(e.stunTimer, 90);
          if (Math.hypot(e.x - m.x, e.y - m.y) < 60) c.em.damage(e, 12, Math.atan2(e.y - m.y, e.x - m.x), false, c.fx, null, 4, false, null, "water");
        });
        if (c.fx.spawnHitSparks) c.fx.spawnHitSparks(m.x + 8, m.y + 8, "#bfe9ff", 22);
      } }
  ],
  onAttack(merc, target, enemyManager, fx, spawnProj) {
    const angle = Math.atan2(target.y - merc.y, target.x - merc.x);
    if (spawnProj) {
      spawnProj({
        type: "force_sphere",
        x: merc.x + 8,
        y: merc.y + 6,
        vx: Math.cos(angle) * 4.2,
        vy: Math.sin(angle) * 4.2,
        damage: 22
      });
    }
  },
  onSkill(merc, enemies, enemyManager, fx) {
    // Arcane Wave Blast
    enemies.forEach((e) => {
      if (e.isAlive && Math.hypot(e.x - merc.x, e.y - merc.y) < 70) {
        enemyManager.damage(e, 35, Math.atan2(e.y - merc.y, e.x - merc.x), true, fx, null, 14);
      }
    });
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(merc.x + 6, merc.y - 8, "ARCANE SURGE!", true, "#4cc9f0");
  }
};