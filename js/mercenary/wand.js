const _ = 0;
const K = "#0b0c10"; // Dark Outline
const P1 = "#3a0ca3"; // Robe Dark Violet
const P2 = "#7209b7"; // Robe Mid Violet
const P3 = "#b5179e"; // Robe Bright Velvet
const G1 = "#ffd166"; // Gold Rune Trim
const S1 = "#f8d5b8"; // Skin Fair
const S2 = "#cf966c"; // Skin Shadow
const W1 = "#4cc9f0"; // Mana Cyan Core
const W2 = "#ffffff"; // Mana Specular Glint
const T1 = "#4a2810"; // Staff Wood

export const WandMercenary = {
  type: "wand",
  name: "Arcane Apprentice",
  maxHp: 135,
  speed: 1.3,
  attackRange: 140,
  attackCooldownMax: 50,
  skillCooldownMax: 280,
  color: "#4cc9f0",
  sprites: {
    idle: [
      [
        [_,_,_,_,_,P2,P3,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,P1,P2,P2,P3,_,_,_,_,_,_,_,_],
        [_,_,_,P1,P1,P2,P2,P3,_,_,_,W2,W1,_,_,_],
        [_,_,_,G1,G1,G1,G1,G1,_,_,W1,W2,W1,_,_,_],
        [_,_,_,K,S1,S1,S1,K,_,_,_,W1,_,_,_,_],
        [_,_,_,K,S2,S1,S2,K,_,_,_,T1,_,_,_,_],
        [_,_,P1,P2,G1,G1,P2,P1,_,_,T1,T1,_,_,_,_],
        [_,P1,P2,P2,P2,P2,P2,P2,P1,_,_,T1,_,_,_,_],
        [_,P1,P2,G1,P3,P3,G1,P2,P1,_,T1,T1,_,_,_,_],
        [_,P1,P1,P2,P2,P2,P2,P1,P1,_,_,T1,_,_,_,_],
        [_,_,P1,P1,P1,P1,P1,P1,_,_,_,T1,_,_,_,_],
        [_,_,K,P1,P1,P1,P1,K,_,_,_,_,T1,_,_,_],
        [_,_,K,K,_,_,K,K,_,_,_,_,_,_,_,_]
      ],
      [
        [_,_,_,_,_,P2,P3,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,P1,P2,P2,P3,_,_,_,_,_,_,_,_],
        [_,_,_,P1,P1,P2,P2,P3,_,_,_,W1,W2,_,_,_],
        [_,_,_,G1,G1,G1,G1,G1,_,_,W2,W1,W2,_,_,_],
        [_,_,_,K,S1,S1,S1,K,_,_,_,W1,_,_,_,_],
        [_,_,_,K,S2,S1,S2,K,_,_,_,T1,_,_,_,_],
        [_,_,P1,P2,G1,G1,P2,P1,_,_,T1,T1,_,_,_,_],
        [_,P1,P2,P2,P2,P2,P2,P2,P1,_,_,T1,_,_,_,_],
        [_,P1,P2,G1,P3,P3,G1,P2,P1,_,T1,T1,_,_,_,_],
        [_,P1,P1,P2,P2,P2,P2,P1,P1,_,_,T1,_,_,_,_],
        [_,_,P1,P1,P1,P1,P1,P1,_,_,_,T1,_,_,_,_],
        [_,_,K,P1,P1,P1,P1,K,_,_,_,_,T1,_,_,_],
        [_,_,K,K,_,_,K,K,_,_,_,_,_,_,_,_]
      ]
    ]
  },
  onAttack(merc, target, enemyManager, fx, spawnProj, player, lootManager) {
    const angle = Math.atan2(target.y - merc.y, target.x - merc.x);
    if (spawnProj) {
      spawnProj({
        type: "force_sphere",
        x: merc.x + 8,
        y: merc.y + 6,
        vx: Math.cos(angle) * 4.6,
        vy: Math.sin(angle) * 4.6,
        damage: 26
      });
    }
  },
  onSkill(merc, enemies, enemyManager, fx, spawnProj, player, lootManager) {
    // Arcane Shockwave Surge
    enemies.forEach((e) => {
      if (e.isAlive && Math.hypot(e.x - merc.x, e.y - merc.y) < 75) {
        enemyManager.damage(e, 40, Math.atan2(e.y - merc.y, e.x - merc.x), true, fx, lootManager, 16, false, player);
      }
    });
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(merc.x + 8, merc.y + 8, "#4cc9f0", 20);
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(merc.x + 6, merc.y - 10, "ASTRAL SURGE! ⚡", true, "#4cc9f0");
  }
};