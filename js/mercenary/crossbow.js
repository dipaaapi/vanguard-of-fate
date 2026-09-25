const _ = 0;
const K = "#14171d";
const G1 = "#2d6a4f";
const W1 = "#d4a373";

export const CrossbowMercenary = {
  type: "crossbow",
  name: "Crossbowman",
  maxHp: 135,
  speed: 1.45,
  attackRange: 150,
  attackCooldownMax: 48,
  skillCooldownMax: 260,
  color: "#52b788",
  sprites: {
    idle: [
      [
        [_,_,_,K,K,K,_,_,_,_,_],
        [_,_,K,"#f3c5a5","#f3c5a5",K,_,_,_,_,_],
        [_,_,K,G1,G1,K,W1,W1,W1,_,_],
        [_,K,G1,G1,G1,K,K,K,_,_,_],
        [_,K,"#582f0e","#582f0e",K,_,_,_,_,_,_],
        [_,_,K,"#333",K,_,_,_,_,_,_],
        [_,_,K,K,K,K,_,_,_,_,_]
      ]
    ]
  },
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
          damage: 32
        });
      }
    });
  }
};