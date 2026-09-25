const _ = 0;
const K = "#14171d";
const B1 = "#8a5a36";
const M1 = "#adb5bd";
const M2 = "#495057";

export const AxeMercenary = {
  type: "axe",
  name: "Axeman",
  maxHp: 180,
  speed: 1.35,
  attackRange: 26,
  attackCooldownMax: 45,
  skillCooldownMax: 240, // 4s Whirlwind
  color: "#e63946",
  sprites: {
    idle: [
      [
        [_,_,_,K,K,K,_,_,_,_,_],
        [_,_,K,"#f3c5a5","#f3c5a5",K,_,_,_,_,_],
        [_,_,K,"#e63946","#e63946",K,M1,M1,_,_,_],
        [_,K,"#e63946","#e63946","#e63946",K,B1,_,_,_,_],
        [_,K,"#2b2d42","#2b2d42","#2b2d42",K,B1,_,_,_,_],
        [_,_,K,B1,_,B1,K,_,_,_,_],
        [_,_,K,K,_,K,K,_,_,_,_]
      ]
    ]
  },
  onAttack(merc, target, enemyManager, fx) {
    const angle = Math.atan2(target.y - merc.y, target.x - merc.x);
    enemyManager.damage(target, 28, angle, false, fx, null, 12);
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