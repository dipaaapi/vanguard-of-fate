export class ItemManager {
    constructor(worldWidth, worldHeight) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.items = []; // { x, y, type: "apple" | "herb", bobTimer, life }

        // Dalawang magkapares na Teleportation Portals
        this.portals = [
            { id: "A", x: 120, y: 120, targetX: 620, targetY: 580, color: "#7000ff" },
            { id: "B", x: 620, y: 580, targetX: 120, targetY: 120, color: "#00f0ff" }
        ];
        this.portalCooldown = 0; // Proteksyon para hindi pabalik-balik agad
        this.portalAngle = 0;
    }

    // Tumatawag kapag napatay ang isang kalaban
    spawnLoot(x, y) {
        const roll = Math.random();
        if (roll < 0.35) {
            // 35% chance na mag-drop ng Apple (HP Regen)
            this.items.push({
                type: "apple",
                x: x + 6,
                y: y + 6,
                bobTimer: Math.random() * Math.PI,
                life: 600 // Tumatagal ng 10 segundo bago maglaho
            });
        } else if (roll < 0.60) {
            // 25% chance na mag-drop ng Herb Leaf (Cooldown Reset)
            this.items.push({
                type: "herb",
                x: x + 6,
                y: y + 6,
                bobTimer: Math.random() * Math.PI,
                life: 600
            });
        }
    }

    update(player, fx) {
        if (this.portalCooldown > 0) this.portalCooldown--;
        this.portalAngle += 0.04;

        // 1. ITEMS PICKUP CHECK
        for (let i = this.items.length - 1; i >= 0; i--) {
            const it = this.items[i];
            it.bobTimer += 0.08;
            it.life--;

            const dist = Math.hypot((player.x + 12) - it.x, (player.y + 12) - it.y);

            // Napulot ng Player
            if (dist < 18) {
                if (it.type === "apple") {
                    const healAmount = 30;
                    player.hp = Math.min(player.maxHp, player.hp + healAmount);
                    if (fx) {
                        fx.spawnDamagePopup(player.x + 12, player.y - 8, `+${healAmount} HP`, true);
                        fx.spawnHitSparks(player.x + 12, player.y + 12, "#38b000", 12);
                    }
                } else if (it.type === "herb") {
                    player.skillCooldownTimer = 0; // Instant cooldown reset
                    if (fx) {
                        fx.spawnDamagePopup(player.x + 12, player.y - 8, "SKILL READY!", true);
                        fx.spawnHitSparks(player.x + 12, player.y + 12, "#00f0ff", 14);
                    }
                }
                this.items.splice(i, 1);
                continue;
            }

            if (it.life <= 0) {
                this.items.splice(i, 1);
            }
        }

        // 2. PORTAL TELEPORTATION CHECK
        if (this.portalCooldown <= 0) {
            for (let p of this.portals) {
                const pDist = Math.hypot((player.x + 12) - p.x, (player.y + 12) - p.y);
                if (pDist < 16) {
                    player.x = p.targetX - 12;
                    player.y = p.targetY - 12;
                    this.portalCooldown = 90; // 1.5s cooldown bago magamit muli

                    if (fx) {
                        fx.addScreenShake(6);
                        fx.spawnHitSparks(p.x, p.y, p.color, 16);
                        fx.spawnHitSparks(p.targetX, p.targetY, p.color, 16);
                        fx.spawnDamagePopup(player.x + 12, player.y - 10, "WARPED!", true);
                    }
                    break;
                }
            }
        }
    }

    draw(ctx) {
        // 1. DRAW MYSTIC PORTALS
        this.portals.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);

            // Outer Glow Aura
            ctx.fillStyle = "rgba(10, 14, 20, 0.4)";
            ctx.beginPath();
            ctx.ellipse(0, 8, 14, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Spinning Magical Rings
            ctx.rotate(this.portalAngle);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.stroke();

            // Core Energy
            ctx.fillStyle = p.color;
            ctx.fillRect(-2, -2, 4, 4);

            ctx.restore();
        });

        // 2. DRAW LOOT ITEMS (Apple & Herb)
        this.items.forEach(it => {
            const floatY = it.y + Math.sin(it.bobTimer) * 2.5;

            // Small shadow
            ctx.fillStyle = "rgba(10, 14, 20, 0.35)";
            ctx.beginPath();
            ctx.ellipse(it.x, it.y + 7, 5, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            if (it.type === "apple") {
                // Red Apple Sprite (6x6 pixels)
                ctx.fillStyle = "#e63946";
                ctx.fillRect(it.x - 3, floatY - 3, 6, 5);
                ctx.fillRect(it.x - 2, floatY - 4, 4, 1);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(it.x - 1, floatY - 2, 1, 2); // Highlight
                ctx.fillStyle = "#70e000";
                ctx.fillRect(it.x, floatY - 5, 2, 2);     // Green Leaf stalk
            } else if (it.type === "herb") {
                // Mystic Herb Leaf Sprite (Bright Cyan/Green)
                ctx.fillStyle = "#00f0ff";
                ctx.fillRect(it.x - 2, floatY - 3, 4, 6);
                ctx.fillStyle = "#38b000";
                ctx.fillRect(it.x - 4, floatY - 1, 8, 2);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(it.x - 1, floatY - 2, 2, 2);
            }
        });
    }

    clear() {
        this.items = [];
        this.portalCooldown = 0;
    }
}