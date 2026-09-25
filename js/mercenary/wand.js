const _ = 0;
const K = "#14171d";
const P1 = "#7209b7";
const W1 = "#4cc9f0";

export const WandMercenary = {
  type: "wand",
  name: "Mage Apprentice",
  maxHp: 120,
  speed: 1.25,
  attackRange: 130,
  attackCooldownMax: 55,
  skillCooldownMax: 320,
  color: "#4cc9f0",
  sprites: {
    idle: [
      [
        [_,_,_,K,P1,K,_,_,_,_,_],
        [_,_,K,"#f3c5a5","#f3c5a5",K,_,_,_,_,_],
        [_,_,K,P1,P1,K,_,W1,_,_,_],
        [_,K,P1,P1,P1,K,K,"#8a5a36",_,_,_],
        [_,K,P1,P1,P1,K,_,K,_,_,_],
        [_,_,K,"#2b2d42",K,_,_,_,_,_,_],
        [_,_,K,K,K,K,_,_,_,_,_]
      ]
    ]
  },
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