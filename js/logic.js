import { Sound } from "./audio.js";

export class GameEngine {
    constructor(stage, camera, fx, enemyManager, projectileManager, lootManager) {
        this.stage = stage;
        this.camera = camera;
        this.fx = fx;
        this.enemyManager = enemyManager;
        this.projectileManager = projectileManager;
        this.lootManager = lootManager;
    }

    update(player, keys, onGameOver) {
        if (!player) return;

        this.camera.update(player.x, player.y);
        this.enemyManager.update(player, this.camera, this.fx);
        this.lootManager.update(player, this.fx);

        if (player.hp <= 0) {
            onGameOver();
            return;
        }

        const closestEnemy = this.enemyManager.getClosest(player.x, player.y);
        const dmgMultiplier = player.buffs.damage > 0 ? 1.75 : 1.0;

        // 1. Player Update & Attack Resolution
        player.update(
            keys, this.stage.bounds, closestEnemy,
            (proj) => this.projectileManager.add(proj),
            (critDmg, isCrit) => {
                if (closestEnemy && closestEnemy.isAlive) {
                    const hitAngle = Math.atan2((closestEnemy.y + 12) - (player.y + 12), (closestEnemy.x + 12) - (player.x + 12));
                    this.enemyManager.damage(closestEnemy, Math.round(critDmg * dmgMultiplier), hitAngle, isCrit, this.fx, this.lootManager);
                    closestEnemy.isMarkedCritical = false;
                }
            }
        );

        // 2. Guardian Angels Logic (Priest)
        if (player.angels && player.angels.length > 0) {
            player.angels.forEach((angel, idx) => {
                if (!angel.isAlive) return;

                angel.lifespan--;
                if (angel.lifespan <= 0) {
                    angel.isAlive = false;
                    this.fx.spawnHitSparks(angel.x + 12, angel.y + 12, "#ffffff", 14);
                    this.fx.spawnDamagePopup(angel.x + 12, angel.y - 8, "EXPIRED", false);
                    return;
                }

                angel.bobTimer += 0.08;
                angel.animTimer++;
                if (angel.animTimer >= 22) {
                    angel.animTimer = 0;
                    angel.animFrame = (angel.animFrame + 1) % 2;
                }

                if (angel.hitTimer > 0) angel.hitTimer--;
                if (angel.attackCooldown > 0) angel.attackCooldown--;

                const flankTargetX = player.x + (idx === 0 ? -26 : 26);
                const flankTargetY = player.y - 12 + Math.sin(angel.bobTimer) * 4;
                const angelTarget = this.enemyManager.getClosest(angel.x, angel.y, 140);

                if (angelTarget && angelTarget.isAlive) {
                    const adx = (angelTarget.x + 12) - (angel.x + 12);
                    const ady = (angelTarget.y + 12) - (angel.y + 12);
                    const aDist = Math.hypot(adx, ady);
                    if (aDist > 20) {
                        angel.x += (adx / aDist) * 1.5;
                        angel.y += (ady / aDist) * 1.5;
                    } else if (angel.attackCooldown === 0) {
                        angel.attackCooldown = 55;
                        Sound.playSlash();
                        this.enemyManager.damage(angelTarget, Math.round(angel.damage * dmgMultiplier), Math.atan2(ady, adx), false, this.fx, this.lootManager);
                    }
                } else {
                    angel.x += (flankTargetX - angel.x) * 0.12;
                    angel.y += (flankTargetY - angel.y) * 0.12;
                }
            });
            player.angels = player.angels.filter(a => a.isAlive);
        }

        // 3. Melee Attack Hitbox (Knight)
        if (!player.isHomingKick && ((player.state === "slashing" && player.animFrame === 1) || (player.state === "bashing" && player.animFrame === 1))) {
            this.enemyManager.enemies.forEach(e => {
                if (e.isAlive && e.hitTimer === 0 && Math.hypot((e.x + 12) - (player.x + 12), (e.y + 12) - (player.y + 12)) < 32) {
                    const hitAngle = Math.atan2((e.y + 12) - (player.y + 12), (e.x + 12) - (player.x + 12));
                    this.enemyManager.damage(e, Math.round((player.state === "bashing" ? 25 : 15) * dmgMultiplier), hitAngle, false, this.fx, this.lootManager);
                }
            });
        }

        // 4. Falcon Dive AI (Archer)
        if (player.falcon && player.falcon.state !== "HOVERING") {
            const f = player.falcon;
            const destX = f.state === "STRIKING" ? (f.target && f.target.isAlive ? f.target.x + 12 : f.targetX) : player.x + (player.facing === "right" ? -14 : 22);
            const destY = f.state === "STRIKING" ? (f.target && f.target.isAlive ? f.target.y + 12 : f.targetY) : player.y - 12;
            const dx = destX - f.x;
            const dy = destY - f.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 8) {
                f.x += (dx / dist) * (f.state === "STRIKING" ? f.speed : f.speed * 1.15);
                f.y += (dy / dist) * (f.state === "STRIKING" ? f.speed : f.speed * 1.15);
            } else {
                if (f.state === "STRIKING") {
                    if (!f.damageDealt && f.target && f.target.isAlive) {
                        this.enemyManager.damage(f.target, Math.round(34 * dmgMultiplier), Math.atan2(dy, dx), true, this.fx, this.lootManager);
                        f.damageDealt = true;
                    }
                    f.state = "RETURNING";
                } else {
                    f.state = "HOVERING";
                }
            }
        }

        // 5. Projectiles
        this.projectileManager.update(this.enemyManager.enemies, this.enemyManager, this.fx, this.lootManager);
    }
}