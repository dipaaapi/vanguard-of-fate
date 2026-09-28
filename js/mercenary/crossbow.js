// Look: modular Avatar (see js/avatar/avatar.js)
export const CrossbowMercenary = {
  type: "crossbow",
  name: "Crossbowman",
  maxHp: 135,
  speed: 1.45,
  attackRange: 150,
  attackCooldownMax: 48,
  skillCooldownMax: 260,
  color: "#52b788",
  look: {
    body: "male", skin: "#c68642", eyes: "#2b1d14", hairStyle: "short", hairColor: "#2b1d14",
    outfit: "vest", outfitColor: "#2d6a4f", gloves: "leather", legs: "pants", legColor: "#4a3a28",
    boots: "boots", bootColor: "#5e3b1a", headgear: "hood", quiver: true, weapon: "crossbow"
  },
  // Snare Trap (roots the nearest foe) and Eagle Eye (passive: +15% damage)
  skills: [
    { id: "snare", name: { en: "Snare Trap", fil: "Bitag" }, cd: 600,
      ready: (m, c) => c.foes.length > 0,
      use: (m, c) => {
        const t = c.foes.slice().sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))[0];
        if (!t.boss) t.stunTimer = Math.max(t.stunTimer, 100);
        if (c.fx.spawnDamagePopup) c.fx.spawnDamagePopup(t.x + 10, t.y - 10, "SNARED!", false, "#52b788");
      } }
  ],
  passive: { en: "Eagle Eye: +15% damage", fil: "Eagle Eye: +15% pinsala" },
  powerBonus: 1.15,
  onAttack(merc, target, enemyManager, fx, spawnProj) {
    const angle = Math.atan2(target.y - merc.y, target.x - merc.x);
    if (spawnProj) {
      spawnProj({
        type: "arrow",
        x: merc.x + 8,
        y: merc.y + 6,
        vx: Math.cos(angle) * 6.2,
        vy: Math.sin(angle) * 6.2,
        damage: 26
      });
    }
  },
  onSkill(merc, enemies, enemyManager, fx, spawnProj) {
    // 3-Way Crossbow Spread
    const baseAngle = merc.aimAngle || 0;
    [-0.25, 0, 0.25].forEach((offset) => {
      if (spawnProj) {
        spawnProj({
          type: "arrow",
          x: merc.x + 8,
          y: merc.y + 6,
          vx: Math.cos(baseAngle + offset) * 6.8,
          vy: Math.sin(baseAngle + offset) * 6.8,
          damage: 20
        });
      }
    });
  }
};