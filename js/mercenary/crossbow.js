const _ = 0;
const K = "#11141a"; // Dark Outline
const G1 = "#1b4332"; // Dark Forest Cowl
const G2 = "#2d6a4f"; // Forest Green Tunic
const G3 = "#52b788"; // Bright Leaf Trim
const S1 = "#f8d5b8"; // Skin Light
const S2 = "#cf966c"; // Skin Shadow
const B1 = "#582f0e"; // Leather Harness
const B2 = "#2b170e"; // Boots
const W1 = "#d4a373"; // Crossbow Polished Wood
const M1 = "#ced4da"; // Steel Bow Limbs
const W2 = "#ffffff"; // Bolt Glint

export const CrossbowMercenary = {
  type: "crossbow",
  name: "Sharpshooter Scout",
  maxHp: 150,
  speed: 1.5,
  attackRange: 160,
  attackCooldownMax: 45,
  skillCooldownMax: 240,
  color: "#52b788",
  sprites: {
    idle: [
      [
        [_,_,_,_,_,G1,G1,G2,G2,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,G1,G2,G2,G3,G2,G1,_,_,_,_,_,_,_,_],
        [_,_,_,G1,G2,G3,G3,G2,G2,G1,_,_,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,K,S1,K,S2,K,_,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,S1,S1,S2,K,_,_,_,_,_,_,_,_],
        [_,_,G1,G2,G2,G2,G2,G2,G2,G1,_,M1,M1,M1,_,_,_,_],
        [_,G1,G2,B1,B1,B1,B1,B1,G2,G1,W1,W1,W2,W1,M1,_,_,_],
        [_,K,S2,B1,G3,G3,G3,B1,S2,K,_,_,W1,_,_,_,_,_],
        [_,K,S1,S2,B1,B1,B1,S2,S1,K,_,_,W1,_,_,_,_,_],
        [_,_,K,G1,G2,G2,G2,G1,K,_,_,_,_,_,_,_,_,_],
        [_,_,K,B1,B1,B1,B1,B1,K,_,_,_,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,_,S1,S2,K,_,_,_,_,_,_,_,_],
        [_,_,_,K,B2,B2,_,B2,B2,K,_,_,_,_,_,_,_,_],
        [_,_,_,K,K,K,_,_,K,K,K,_,_,_,_,_,_,_,_]
      ],
      [
        [_,_,_,_,_,G1,G1,G2,G2,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,G1,G2,G2,G3,G2,G1,_,_,_,_,_,_,_,_],
        [_,_,_,G1,G2,G3,G3,G2,G2,G1,_,_,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,K,S1,K,S2,K,_,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,S1,S1,S2,K,_,_,_,_,_,_,_,_],
        [_,_,G1,G2,G2,G2,G2,G2,G2,G1,_,M1,M1,M1,_,_,_,_],
        [_,G1,G2,B1,B1,B1,B1,B1,G2,G1,W1,W1,W2,W1,M1,_,_,_],
        [_,K,S2,B1,G3,G3,G3,B1,S2,K,_,_,W1,_,_,_,_,_],
        [_,K,S1,S2,B1,B1,B1,S2,S1,K,_,_,W1,_,_,_,_,_],
        [_,_,K,G1,G2,G2,G2,G1,K,_,_,_,_,_,_,_,_,_],
        [_,_,K,B1,B1,B1,B1,B1,K,_,_,_,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,_,S1,S2,K,_,_,_,_,_,_,_,_],
        [_,_,K,B2,B2,_,_,B2,B2,K,_,_,_,_,_,_,_,_],
        [_,_,K,K,K,_,_,_,K,K,K,_,_,_,_,_,_,_,_]
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
        vx: Math.cos(angle) * 6.5,
        vy: Math.sin(angle) * 6.5,
        damage: 28,
        angle: angle
      });
    }
  },
  onSkill(merc, enemies, enemyManager, fx, spawnProj) {
    // 3-Way Crossbow Heavy Volley
    const baseAngle = merc.aimAngle || 0;
    [-0.22, 0, 0.22].forEach((offset) => {
      if (spawnProj) {
        spawnProj({
          type: "arrow",
          x: merc.x + 8,
          y: merc.y + 6,
          vx: Math.cos(baseAngle + offset) * 7.2,
          vy: Math.sin(baseAngle + offset) * 7.2,
          damage: 35,
          angle: baseAngle + offset,
          isHeavyKnockback: true
        });
      }
    });
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(merc.x + 8, merc.y - 10, "TRIPLE BARRAGE!", true, "#52b788");
  }
};