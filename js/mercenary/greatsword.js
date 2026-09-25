const _ = 0;
const K = "#14171d";
const S1 = "#adb5bd";
const S2 = "#495057";

export const GreatswordMercenary = {
  type: "greatsword",
  name: "Vanguard Knight",
  maxHp: 240,
  speed: 1.15,
  attackRange: 32,
  attackCooldownMax: 50,
  skillCooldownMax: 300,
  color: "#ffd166",
  sprites: {
    idle: [
      [
        [_,_,_,K,S1,K,_,_,_,_,_],
        [_,_,K,"#f3c5a5","#f3c5a5",K,_,_,_,_,_],
        [_,_,K,S1,S1,K,S1,_,_,_,_],
        [_,K,S2,S1,S2,K,S1,_,_,_,_],
        [_,K,S2,S2,S2,K,S1,_,_,_,_],
        [_,_,K,S2,K,_,S2,_,_,_,_],
        [_,_,K,K,K,K,_,_,_,_,_]
      ]
    ]
  },
  onAttack(merc, target, enemyManager, fx) {
    const angle = Math.atan2(target.y - merc.y, target.x - merc.x);
    enemyManager.damage(target, 36, angle, false, fx, null, 14);
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