import { Sound } from "../audio.js";

// ==================== FIGHTER (Brawler) ====================
// The look is the player's Avatar with a vest, headband and fist wraps (js/classes/job.js).
export const FighterClass = {
    id: "fighter",
    name: "Fighter",
    title: "Brawler",
    range: 170,          // Force Sphere reach
    speed: 1.55,
    attackCooldown: 30, // 0.5 seconds before another Force Sphere
    cooldown: 180,       // 3 seconds for Flying Kick

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
        if (Sound.playForceSphere) Sound.playForceSphere();
    },

    // KEY K: Flying Dropkick — flies forward; ×2 damage to foes marked by Force Sphere
    onSkill(player, target, spawnProjectile) {
        const angle = player.aimAngle;
        player.kickTimer = 16;
        player.kickVx = Math.cos(angle) * 5.6;
        player.kickVy = Math.sin(angle) * 5.6;
        spawnProjectile({ type: "follow", owner: player, angle, offset: 12, radius: 16, life: 17, damage: 34, markBonus: 2, hit: new Set(), color: "#ff0055", push: 20 });
        if (Sound.playDash) Sound.playDash();
        return true;
    },

    // KEY L: Ki Explosion — a burst of Ki all around; stuns whoever it hits
    cooldown2: 300,
    onSkill2(player, target, spawnProjectile) {
        spawnProjectile({ type: "shockwave", x: player.x + 10, y: player.y + 14, r: 6, max: 44, grow: 4, damage: 36, hit: new Set(), color: "#c4b5fd", push: 22, elem: "ghost", stun: 70 });
        if (Sound.playGuard) Sound.playGuard();
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
