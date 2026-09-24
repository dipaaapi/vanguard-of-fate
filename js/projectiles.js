export class ProjectileManager {
    constructor(worldWidth, worldHeight) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.projectiles = [];
    }

    add(proj) {
        this.projectiles.push(proj);
    }

    update(enemies, enemyManager, fx, lootManager) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            // 1. MAGE: METEOR STRIKE (AOE)
            if (p.type === "meteor") {
                if (!p.exploded) {
                    p.x += p.speedX;
                    p.y += p.speedY;
                    if (p.y >= p.targetY) {
                        p.exploded = true;
                        if (fx) {
                            fx.addScreenShake(7);
                            fx.spawnHitSparks(p.targetX, p.targetY, "#ff3700", 14);
                        }
                    }
                } else {
                    p.explosionRadius += 2.5;
                    if (!p.damageDealt) {
                        enemies.forEach(e => {
                            if (e.isAlive) {
                                const dist = Math.hypot(p.targetX - (e.x + 12), p.targetY - (e.y + 12));
                                if (dist < p.maxExplosionRadius) {
                                    const hitAngle = Math.atan2((e.y + 12) - p.targetY, (e.x + 12) - p.targetX);
                                    enemyManager.damage(e, 40, hitAngle, true, fx, lootManager);
                                }
                            }
                        });
                        p.damageDealt = true;
                    }
                    if (p.explosionRadius >= p.maxExplosionRadius) {
                        this.projectiles.splice(i, 1);
                        continue;
                    }
                }
            }

            // 2. MAGE: THUNDERSTORM WITH CHAIN LIGHTNING
            else if (p.type === "thunderstorm") {
                p.duration--;
                for (let b = p.activeBolts.length - 1; b >= 0; b--) {
                    p.activeBolts[b].life--;
                    if (p.activeBolts[b].life <= 0) p.activeBolts.splice(b, 1);
                }

                p.strikeTimer++;
                if (p.strikeTimer >= p.strikeInterval) {
                    p.strikeTimer = 0;
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * p.radius;
                    const groundX = p.centerX + Math.cos(angle) * dist;
                    const groundY = p.centerY + Math.sin(angle) * dist;

                    const strike = {
                        startX: groundX + (Math.random() * 20 - 10),
                        startY: groundY - 200,
                        midX: groundX + (Math.random() * 16 - 8),
                        midY: groundY - 100,
                        endX: groundX,
                        endY: groundY,
                        chainToX: null,
                        chainToY: null,
                        life: 5
                    };

                    enemies.forEach(e => {
                        if (e.isAlive) {
                            const d = Math.hypot((e.x + 12) - groundX, (e.y + 12) - groundY);
                            if (d < 40) {
                                strike.chainToX = e.x + 12;
                                strike.chainToY = e.y + 12;
                                const hitAngle = Math.atan2((e.y + 12) - groundY, (e.x + 12) - groundX);
                                enemyManager.damage(e, 14, hitAngle, false, fx, lootManager);
                            }
                        }
                    });
                    p.activeBolts.push(strike);
                }

                if (p.duration <= 0) {
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            // 3. PRIEST: HOLY BURST
            else if (p.type === "holy_burst") {
                p.radius += 2.0;
                p.alpha -= 0.05;
                enemies.forEach(e => {
                    if (e.isAlive && e.hitTimer === 0) {
                        const dist = Math.hypot(p.x - (e.x + 12), p.y - (e.y + 12));
                        if (dist < p.radius + 6) {
                            const hitAngle = Math.atan2((e.y + 12) - p.y, (e.x + 12) - p.x);
                            enemyManager.damage(e, 25, hitAngle, false, fx, lootManager);
                        }
                    }
                });
                if (p.radius >= p.maxRadius || p.alpha <= 0) {
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            // 4. ARCHER (ARROW) & FIGHTER (FORCE SPHERE)
            else {
                p.x += p.vx;
                p.y += p.vy;
                let hit = false;

                for (let e of enemies) {
                    if (e.isAlive) {
                        const dist = Math.hypot(p.x - (e.x + 12), p.y - (e.y + 12));
                        if (dist < 12) {
                            const hitAngle = Math.atan2(p.vy, p.vx);

                            if (p.type === "force_sphere") {
                                enemyManager.damage(e, 8, hitAngle, false, fx, lootManager);
                                e.isMarkedCritical = true;
                                e.critMarkTimer = 260; // Critical target lock
                            } else if (p.type === "arrow") {
                                enemyManager.damage(e, 18, hitAngle, false, fx, lootManager);
                            }

                            hit = true;
                            break;
                        }
                    }
                }

                // Alisin ang bala pag tumama o lumabas sa mapa
                if (hit || p.x < 0 || p.x > this.worldWidth || p.y < 0 || p.y > this.worldHeight) {
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }
        }
    }

    draw(ctx) {
        this.projectiles.forEach(p => {
            // Meteor Visual
            if (p.type === "meteor") {
                if (!p.exploded) {
                    ctx.fillStyle = "rgba(255, 68, 0, 0.5)";
                    ctx.beginPath();
                    ctx.arc(p.x - 6, p.y - 6, 6, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = "#ffdd00";
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);

                    ctx.fillStyle = "rgba(255, 80, 0, 0.35)";
                    ctx.beginPath();
                    ctx.ellipse(p.targetX, p.targetY, 12, 5, 0, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.strokeStyle = "#ff3700";
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(p.targetX, p.targetY, p.explosionRadius, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.strokeStyle = "#ffdd00";
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(p.targetX, p.targetY, Math.max(1, p.explosionRadius - 8), 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
            // Thunderstorm Visual
            else if (p.type === "thunderstorm") {
                ctx.save();
                ctx.strokeStyle = "rgba(56, 182, 255, 0.4)";
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.arc(p.centerX, p.centerY, p.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();

                p.activeBolts.forEach(b => {
                    ctx.strokeStyle = "#ffffff";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(b.startX, b.startY);
                    ctx.lineTo(b.midX, b.midY);
                    ctx.lineTo(b.endX, b.endY);
                    ctx.stroke();

                    if (b.chainToX !== null) {
                        ctx.strokeStyle = "#ffe600";
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(b.endX, b.endY);
                        ctx.lineTo(b.chainToX, b.chainToY);
                        ctx.stroke();
                    }
                });
            }
            // Holy Burst Visual
            else if (p.type === "holy_burst") {
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            // Arrow & Force Sphere Visuals
            else {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);

                if (p.type === "force_sphere") {
                    ctx.fillStyle = "#00f0ff";
                    ctx.fillRect(-3, -3, 6, 6);
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(-2, -2, 4, 4);
                } else if (p.type === "arrow") {
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(-5, -1, 10, 2);
                    ctx.fillStyle = "#8b5a2b";
                    ctx.fillRect(-6, -1, 2, 2);
                    ctx.fillStyle = "#cccccc";
                    ctx.fillRect(4, -2, 2, 4);
                }
                ctx.restore();
            }
        });
    }

    clear() {
        this.projectiles = [];
    }
}