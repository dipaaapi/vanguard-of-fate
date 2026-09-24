import { slimeIdle } from "./sprite.js";
import { Sound } from "./audio.js";

export class EnemyManager {
    constructor(worldWidth, worldHeight) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.enemies = [];
        this.spawnTick = 0;
    }

    init() {
        this.enemies = [
            this.createEnemy(240, 180),
            this.createEnemy(420, 320),
            this.createEnemy(180, 500),
            this.createEnemy(580, 200)
        ];
    }

    createEnemy(x, y) {
        return {
            id: Math.random(),
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            maxHp: 90,
            hp: 90,
            hitTimer: 0,
            animTimer: Math.floor(Math.random() * 20),
            animFrame: 0,
            isAlive: true,
            isMarkedCritical: false,
            critMarkTimer: 0,
            actionState: "CHASING",
            stateTimer: 0,
            attackCooldown: 60 + Math.floor(Math.random() * 60)
        };
    }

    spawn(camera, player, forceAmbush, fx) {
        if (this.enemies.length >= 7) return;

        let spawnX, spawnY;
        if (forceAmbush && player) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 45 + Math.random() * 35;
            spawnX = player.x + Math.cos(angle) * dist;
            spawnY = player.y + Math.sin(angle) * dist;
        } else {
            const side = Math.floor(Math.random() * 4);
            if (side === 0) {
                spawnX = camera.x + Math.random() * camera.viewWidth;
                spawnY = camera.y - 20;
            } else if (side === 1) {
                spawnX = camera.x + Math.random() * camera.viewWidth;
                spawnY = camera.y + camera.viewHeight + 20;
            } else if (side === 2) {
                spawnX = camera.x - 20;
                spawnY = camera.y + Math.random() * camera.viewHeight;
            } else {
                spawnX = camera.x + camera.viewWidth + 20;
                spawnY = camera.y + Math.random() * camera.viewHeight;
            }
        }

        spawnX = Math.max(30, Math.min(this.worldWidth - 50, spawnX));
        spawnY = Math.max(30, Math.min(this.worldHeight - 50, spawnY));

        this.enemies.push(this.createEnemy(spawnX, spawnY));

        if (forceAmbush && fx) {
            fx.spawnHitSparks(spawnX + 12, spawnY + 12, "#70e000", 10);
            fx.spawnDamagePopup(spawnX + 12, spawnY - 6, "AMBUSH!", true);
        }
    }

    damage(enemy, amount, knockAngle, isCritical, fx, lootManager = null) {
        if (!enemy.isAlive) return;

        enemy.hp -= amount;
        enemy.hitTimer = 7;

        enemy.actionState = "CHASING";
        enemy.stateTimer = 0;
        enemy.attackCooldown = 50;

        const knockDist = isCritical ? 16 : 6;
        enemy.x += Math.cos(knockAngle) * knockDist;
        enemy.y += Math.sin(knockAngle) * knockDist;

        const hitCenterX = enemy.x + 12;
        const hitCenterY = enemy.y + 12;

        Sound.playHitEnemy(isCritical);

        if (fx) {
            fx.spawnDamagePopup(hitCenterX, hitCenterY - 6, isCritical ? `CRIT ${amount}!` : `${amount}`, isCritical);
            fx.spawnHitSparks(hitCenterX, hitCenterY, isCritical ? "#ff0055" : "#ffe600", isCritical ? 12 : 6);
            fx.addScreenShake(isCritical ? 5 : 2);
        }

        if (enemy.hp <= 0) {
            enemy.isAlive = false;
            Sound.playEnemyDeath();
            if (fx) {
                fx.spawnHitSparks(hitCenterX, hitCenterY, "#70e000", 18);
                fx.addScreenShake(5);
            }
            if (lootManager) {
                lootManager.spawnDrop(hitCenterX, hitCenterY);
            }
        }
    }

    update(player, camera, fx) {
        this.spawnTick++;

        if (this.spawnTick % 220 === 0) {
            this.spawn(camera, player, false, fx);
        }
        if (player.state === "idle" && this.spawnTick % 360 === 0 && Math.random() < 0.6) {
            this.spawn(camera, player, true, fx);
        }

        const isPlayerStealthed = player.buffs && player.buffs.invis > 0;

        this.enemies.forEach(e => {
            if (!e.isAlive) return;

            if (e.attackCooldown > 0) e.attackCooldown--;

            // ==================== PRIORITY TARGET: ANGELS FIRST ====================
            let targetEntity = player;
            let livingAngels = (player.angels || []).filter(a => a.isAlive);

            if (livingAngels.length > 0) {
                // Hanapin ang pinakamalapit na Angel sa kalaban
                let closestAngel = livingAngels[0];
                let minDist = Math.hypot((closestAngel.x + 12) - (e.x + 12), (closestAngel.y + 12) - (e.y + 12));

                for (let i = 1; i < livingAngels.length; i++) {
                    let d = Math.hypot((livingAngels[i].x + 12) - (e.x + 12), (livingAngels[i].y + 12) - (e.y + 12));
                    if (d < minDist) {
                        minDist = d;
                        closestAngel = livingAngels[i];
                    }
                }
                targetEntity = closestAngel; // Angel ang uunahing targetin!
            }

            const isTargetAngel = targetEntity !== player;
            const dx = (targetEntity.x + 12) - (e.x + 12);
            const dy = (targetEntity.y + 12) - (e.y + 12);
            const dist = Math.hypot(dx, dy);

            if (e.actionState === "CHASING") {
                if (!isPlayerStealthed && dist < 140 && dist > 18) {
                    e.x += (dx / dist) * 0.55;
                    e.y += (dy / dist) * 0.55;
                } else if (!isPlayerStealthed && dist <= 24 && e.attackCooldown <= 0) {
                    e.actionState = "WINDUP";
                    e.stateTimer = 25; // Babala bago umatake
                } else {
                    e.x += e.vx;
                    e.y += e.vy;
                    if (Math.random() < 0.02) {
                        e.vx = (Math.random() - 0.5) * 0.8;
                        e.vy = (Math.random() - 0.5) * 0.8;
                    }
                }
            }
            else if (e.actionState === "WINDUP") {
                e.stateTimer--;
                if (e.stateTimer <= 0) {
                    e.actionState = "ATTACKING";
                    e.stateTimer = 12;
                }
            }
            else if (e.actionState === "ATTACKING") {
                e.x += (dx / dist) * 1.8;
                e.y += (dy / dist) * 1.8;
                e.stateTimer--;

                // AKTIBONG PAGTAMA SA TARGET (Angel o Player)
                if (dist <= 18 && targetEntity.hp > 0 && !isPlayerStealthed) {
                    const attackAngle = Math.atan2(dy, dx);

                    if (isTargetAngel) {
                        // TAMA SA ANGEL
                        targetEntity.hp -= 12;
                        targetEntity.hitTimer = 20;
                        Sound.playHitPlayer();

                        if (fx) {
                            fx.spawnDamagePopup(targetEntity.x + 12, targetEntity.y - 6, "-12", false);
                            fx.spawnHitSparks(targetEntity.x + 12, targetEntity.y + 12, "#ffd166", 8);
                            fx.addScreenShake(3);
                        }

                        if (targetEntity.hp <= 0) {
                            targetEntity.isAlive = false;
                            if (fx) {
                                fx.spawnHitSparks(targetEntity.x + 12, targetEntity.y + 12, "#ffffff", 14);
                                fx.spawnDamagePopup(targetEntity.x + 12, targetEntity.y - 8, "ANGEL LOST", false);
                            }
                        }
                    } else {
                        // TAMA SA PRIEST KUNG WALANG ANGELS
                        const hitSuccess = player.takeDamage(12, attackAngle);
                        if (hitSuccess) {
                            Sound.playHitPlayer();
                            if (fx) {
                                fx.spawnDamagePopup(player.x + 12, player.y - 6, "-12", false);
                                fx.spawnHitSparks(player.x + 12, player.y + 12, "#e63946", 8);
                                fx.addScreenShake(4);
                            }
                        }
                    }

                    e.actionState = "CHASING";
                    e.attackCooldown = 75;
                }

                if (e.stateTimer <= 0) {
                    e.actionState = "CHASING";
                    e.attackCooldown = 60;
                }
            }

            e.animTimer++;
            if (e.animTimer >= 20) {
                e.animTimer = 0;
                e.animFrame = (e.animFrame + 1) % slimeIdle.length;
            }

            if (e.hitTimer > 0) e.hitTimer--;
            if (e.isMarkedCritical) {
                e.critMarkTimer--;
                if (e.critMarkTimer <= 0) e.isMarkedCritical = false;
            }
        });

        this.enemies = this.enemies.filter(e => e.isAlive);
    }

    getClosest(playerX, playerY, maxDistance = 220) {
        let closest = null;
        let closestDist = Infinity;
        this.enemies.forEach(e => {
            if (e.isAlive) {
                const d = Math.hypot((e.x + 12) - (playerX + 12), (e.y + 12) - (playerY + 12));
                if (d < closestDist && d < maxDistance) {
                    closestDist = d;
                    closest = e;
                }
            }
        });
        return closest;
    }

    draw(ctx, drawMatrixFn) {
        this.enemies.forEach(e => {
            if (!e.isAlive) return;

            ctx.fillStyle = "rgba(10, 12, 16, 0.4)";
            ctx.beginPath();
            ctx.ellipse(e.x + 12, e.y + 19, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            const isPreparingAttack = e.actionState === "WINDUP" && Math.floor(e.stateTimer / 4) % 2 === 0;
            drawMatrixFn(ctx, e.x, e.y, slimeIdle[e.animFrame], e.hitTimer > 0 || isPreparingAttack);

            if (e.actionState === "WINDUP") {
                ctx.fillStyle = "#ff0055";
                ctx.font = "bold 8px monospace";
                ctx.textAlign = "center";
                ctx.fillText("!", e.x + 12, e.y - 4);
            }

            ctx.fillStyle = "#111";
            ctx.fillRect(e.x + 3, e.y + 4, 18, 3);
            ctx.fillStyle = "#e63946";
            ctx.fillRect(e.x + 3, e.y + 4, Math.max(0, (e.hp / e.maxHp) * 18), 3);

            if (e.isMarkedCritical) {
                const markX = e.x + 12;
                const markY = e.y - 2;
                ctx.strokeStyle = "#ff0055";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(markX, markY, 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = "#ff0055";
                ctx.font = "bold 6px monospace";
                ctx.textAlign = "center";
                ctx.fillText("LOCK!", markX, markY - 6);
            }
        });
    }

    clear() {
        this.enemies = [];
        this.spawnTick = 0;
    }
}