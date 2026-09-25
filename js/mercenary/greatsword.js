const _ = 0;
const K = "#11141a"; // Dark Outline
const S1 = "#dee2e6"; // Steel Plate Highlight
const S2 = "#adb5bd"; // Steel Plate Midtone
const S3 = "#495057"; // Steel Plate Shadow
const G1 = "#ffd166"; // Gold Plume & Visor Trim
const G2 = "#e0a926"; // Polished Brass Engraving
const C1 = "#2b2d42"; // Dark Under-Armor
const B1 = "#1a1c23"; // Plate Soles
const W1 = "#f8f9fa"; // Claymore Blade Shimmer
const W2 = "#ced4da"; // Claymore Steel

export const GreatswordMercenary = {
  type: "greatsword",
  name: "Vanguard Paladin",
  maxHp: 260,
  speed: 1.2,
  attackRange: 34,
  attackCooldownMax: 48,
  skillCooldownMax: 280,
  color: "#ffd166",
  sprites: {
    idle: [
      [
        [_,_,_,_,_,G1,G1,G1,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,S2,S1,S1,S1,S2,_,_,_,_,_,_,_,_,_],
        [_,_,_,S3,S2,G2,G1,G2,S2,S3,_,_,_,W1,_,_,_,_],
        [_,_,_,K,S3,S2,S2,S2,S3,K,_,_,_,W1,W1,_,_,_],
        [_,_,S2,S1,K,K,K,K,K,S1,S2,_,_,W2,W1,_,_,_],
        [_,S3,S2,S1,S2,G1,G1,S2,S1,S2,S3,_,W2,W1,_,_,_],
        [_,K,S2,S2,S3,G2,G2,S3,S2,S2,K,_,W2,W1,_,_,_],
        [_,K,S3,S2,S2,S2,S2,S2,S2,S3,K,_,_,G1,_,_,_,_],
        [_,_,K,S3,C1,C1,C1,C1,S3,K,_,_,_,G1,G1,_,_,_],
        [_,_,K,S3,S2,S2,S2,S2,S3,K,_,_,_,_,B1,_,_,_],
        [_,_,_,K,S2,S1,_,S1,S2,K,_,_,_,_,_,_,_,_],
        [_,_,_,K,S3,S2,_,S2,S3,K,_,_,_,_,_,_,_,_],
        [_,_,_,K,B1,B1,_,B1,B1,K,_,_,_,_,_,_,_,_],
        [_,_,_,K,K,K,_,_,K,K,K,_,_,_,_,_,_,_,_]
      ],
      [
        [_,_,_,_,_,G1,G1,G1,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,S2,S1,S1,S1,S2,_,_,_,_,_,_,_,_,_],
        [_,_,_,S3,S2,G2,G1,G2,S2,S3,_,_,_,W1,_,_,_,_],
        [_,_,_,K,S3,S2,S2,S2,S3,K,_,_,_,W1,W1,_,_,_],
        [_,_,S2,S1,K,K,K,K,K,S1,S2,_,_,W2,W1,_,_,_],
        [_,S3,S2,S1,S2,G1,G1,S2,S1,S2,S3,_,W2,W1,_,_,_],
        [_,K,S2,S2,S3,G2,G2,S3,S2,S2,K,_,W2,W1,_,_,_],
        [_,K,S3,S2,S2,S2,S2,S2,S2,S3,K,_,_,G1,_,_,_,_],
        [_,_,K,S3,C1,C1,C1,C1,S3,K,_,_,_,G1,G1,_,_,_],
        [_,_,K,S3,S2,S2,S2,S2,S3,K,_,_,_,_,B1,_,_,_],
        [_,_,_,K,S2,S1,_,S1,S2,K,_,_,_,_,_,_,_,_],
        [_,_,K,S3,S2,_,_,S2,S3,K,_,_,_,_,_,_,_,_],
        [_,_,K,B1,B1,_,_,B1,B1,K,_,_,_,_,_,_,_,_],
        [_,_,K,K,K,_,_,_,K,K,K,_,_,_,_,_,_,_,_]
      ]
    ]
  },
  onAttack(merc, target, enemyManager, fx, spawnProj, player, lootManager) {
    const angle = Math.atan2(target.y - merc.y, target.x - merc.x);
    enemyManager.damage(target, 40, angle, false, fx, lootManager, 16, false, player);
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(target.x + 8, target.y + 8, "#ffd166", 14);
  },
  onSkill(merc, enemies, enemyManager, fx, spawnProj, player, lootManager) {
    // Heavy Earthshatter Concussion
    enemies.forEach((e) => {
      if (e.isAlive && Math.hypot(e.x - merc.x, e.y - merc.y) < 64) {
        enemyManager.damage(e, 62, Math.atan2(e.y - merc.y, e.x - merc.x), true, fx, lootManager, 24, true, player);
      }
    });
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(merc.x + 8, merc.y + 8, "#ffd166", 26);
    if (fx && fx.addScreenShake) fx.addScreenShake(4);
    if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(merc.x + 8, merc.y - 12, "EARTHSHATTER! 💥", true, "#ffd166");
  }
};