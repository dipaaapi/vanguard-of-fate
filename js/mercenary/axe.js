const _ = 0;
const K = "#11141a"; // Dark Outline
const H1 = "#495057"; // Iron Helm Horns
const H2 = "#6c757d"; // Steel Helm Light
const S1 = "#f8d5b8"; // Skin Light
const S2 = "#cf966c"; // Skin Shadow & Muscle
const R1 = "#b00020"; // Crimson Tunic Shadow
const R2 = "#e63946"; // Crimson Tunic Bright
const F1 = "#6f4520"; // Fur Trim Dark
const F2 = "#a37042"; // Fur Trim Light
const B1 = "#4a2810"; // Leather Belt & Boots
const B2 = "#212529"; // Dark Leather
const M1 = "#ced4da"; // Steel Axe Blade
const M2 = "#f8f9fa"; // Axe Gleam Edge
const W1 = "#582f0e"; // Axe Wood Shaft

export const AxeMercenary = {
  type: "axe",
  name: "Berserker Axeman",
  maxHp: 210,
  speed: 1.4,
  attackRange: 28,
  attackCooldownMax: 42,
  skillCooldownMax: 220, // Whirlwind
  color: "#e63946",
  sprites: {
    idle: [
      [
        [_,_,_,_,_,K,K,K,K,_,_,_,_,_,_,_,_,_],
        [_,_,_,H1,K,H2,H2,H2,H2,K,H1,_,_,_,_,_,_,_],
        [_,_,H1,H2,K,S1,S1,S1,S1,K,H2,H1,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,K,S1,K,S2,K,_,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,S1,S1,S2,K,_,_,_,_,_,_,_,_],
        [_,_,F2,F1,K,K,K,K,K,K,F1,F2,_,_,M2,M1,K,_],
        [_,F2,F1,R2,R2,R2,R2,R1,R1,R1,F1,F2,_,M1,M2,M1,K],
        [_,K,S2,R2,R2,R2,R2,R2,R1,R1,S2,K,_,M1,M1,M1,K],
        [_,K,S1,S2,B1,B1,B1,B1,B1,S2,S1,K,_,_,W1,K,_,_],
        [_,_,K,S2,B2,B2,B2,B2,B2,S2,K,_,_,_,W1,_,_,_],
        [_,_,K,R1,R1,R1,R1,R1,R1,R1,K,_,_,_,W1,_,_,_],
        [_,_,_,K,S2,S1,_,S1,S2,K,_,_,_,_,W1,_,_,_],
        [_,_,_,K,B1,B1,_,B1,B1,K,_,_,_,_,K,_,_,_],
        [_,_,_,K,B2,B2,_,B2,B2,K,_,_,_,_,_,_,_,_],
        [_,_,_,K,K,K,_,_,K,K,K,_,_,_,_,_,_,_,_]
      ],
      [
        [_,_,_,_,_,K,K,K,K,_,_,_,_,_,_,_,_,_],
        [_,_,_,H1,K,H2,H2,H2,H2,K,H1,_,_,_,_,_,_,_],
        [_,_,H1,H2,K,S1,S1,S1,S1,K,H2,H1,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,K,S1,K,S2,K,_,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,S1,S1,S2,K,_,_,_,_,_,_,_,_],
        [_,_,F2,F1,K,K,K,K,K,K,F1,F2,_,_,M2,M1,K,_],
        [_,F2,F1,R2,R2,R2,R2,R1,R1,R1,F1,F2,_,M1,M2,M1,K],
        [_,K,S2,R2,R2,R2,R2,R2,R1,R1,S2,K,_,M1,M1,M1,K],
        [_,K,S1,S2,B1,B1,B1,B1,B1,S2,S1,K,_,_,W1,K,_,_],
        [_,_,K,S2,B2,B2,B2,B2,B2,S2,K,_,_,_,W1,_,_,_],
        [_,_,K,R1,R1,R1,R1,R1,R1,R1,K,_,_,_,W1,_,_,_],
        [_,_,_,K,S2,S1,_,S1,S2,K,_,_,_,_,W1,_,_,_],
        [_,_,_,K,B1,B1,_,B1,B1,K,_,_,_,_,K,_,_,_],
        [_,_,K,B2,B2,_,_,B2,B2,K,_,_,_,_,_,_,_,_],
        [_,_,K,K,K,_,_,_,K,K,K,_,_,_,_,_,_,_,_]
      ]
    ]
  },
  onAttack(merc, target, enemyManager, fx, spawnProj, player, lootManager) {
    const angle = Math.atan2(target.y - merc.y, target.x - merc.x);
    enemyManager.damage(target, 32, angle, false, fx, lootManager, 14, false, player);
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(target.x + 8, target.y + 8, "#ff3366", 12);
    if (fx && fx.spawnBloodSplatter) fx.spawnBloodSplatter(target.x + 8, target.y + 8, 8, true);
  },
  onSkill(merc, enemies, enemyManager, fx, spawnProj, player, lootManager) {
    // Whirlwind 360 Spin Attack with red slash shockwave
    enemies.forEach((e) => {
      if (e.isAlive && Math.hypot(e.x - merc.x, e.y - merc.y) < 55) {
        const ang = Math.atan2(e.y - merc.y, e.x - merc.x);
        enemyManager.damage(e, 48, ang, true, fx, lootManager, 18, false, player);
      }
    });
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(merc.x + 8, merc.y + 8, "#ff0055", 22);
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(merc.x + 8, merc.y - 12, "CYCLONE CLEAVE!", true, "#ff4d6d");
  }
};