// ==================== FIGHTER (Brawler) ====================
// Ang itsura ay ang Avatar ng player na may vest, headband at balot sa kamao (js/classes/job.js).
export const FighterClass = {
    id: "fighter",
    name: "Fighter",
    title: "Brawler",
    range: 170,          // abot ng Force Sphere
    speed: 1.55,
    attackCooldown: 30, // 0.5 segundo bago makapaghagis muli ng Force Sphere
    cooldown: 180,       // 3 seconds para sa Flying Kick

    onAttack(player, target, spawnProjectile) {
        const spawnX = player.x + 12;
        const spawnY = player.y + 12;
        const cos = Math.cos(player.aimAngle);
        const sin = Math.sin(player.aimAngle);

        spawnProjectile({
            type: "force_sphere",
            x: spawnX,
            y: spawnY,
            vx: cos * 4.0,
            vy: sin * 4.0,
            angle: player.aimAngle
        });
    },

    // KEY K: Flying Dropkick — lumilipad pasulong; ×2 pinsala sa kalabang minarkahan ng Force Sphere
    onSkill(player, target, spawnProjectile) {
        const angle = player.aimAngle;
        player.kickTimer = 16;
        player.kickVx = Math.cos(angle) * 5.6;
        player.kickVy = Math.sin(angle) * 5.6;
        spawnProjectile({ type: "follow", owner: player, angle, offset: 12, radius: 16, life: 17, damage: 34, markBonus: 2, hit: new Set(), color: "#ff0055", push: 20 });
        return true;
    },

    // KEY L: Ki Explosion — pagsabog ng Ki sa paligid; natitigilan ang mga tinamaan
    cooldown2: 300,
    onSkill2(player, target, spawnProjectile) {
        spawnProjectile({ type: "shockwave", x: player.x + 10, y: player.y + 14, r: 6, max: 44, grow: 4, damage: 36, hit: new Set(), color: "#c4b5fd", push: 22, elem: "ghost", stun: 70 });
        return true;
    },

    onUpdate(player) {
        if (player.kickTimer > 0) {
            player.kickTimer--;
            player.x += player.kickVx;
            player.y += player.kickVy;
        }
    }
};
