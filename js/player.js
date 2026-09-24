export class Player {
    constructor(x, y, heroData) {
        this.x = x;
        this.y = y;
        this.heroData = heroData;
        this.baseSpeed = heroData.speed || 1.4;
        this.speed = this.baseSpeed;
        this.facing = "right";
        this.aimAngle = 0;
        this.state = "idle";
        this.animTimer = 0;
        this.animFrame = 0;
        this.isHomingKick = false;

        // HEALTH STATS
        this.maxHp = heroData.maxHp || 100;
        this.hp = this.maxHp;
        this.invincibleTimer = 0;

        // COOLDOWN STATS
        this.skillCooldownMax = heroData.cooldown || 240;
        this.skillCooldownTimer = 0;
        this.attackCooldownMax = heroData.attackCooldown || 30;
        this.attackCooldownTimer = 0;

        // ACTIVE BUFF TIMERS
        this.buffs = {
            damage: 0,    // Red Shard
            atkSpeed: 0,  // Yellow Shard
            moveSpeed: 0, // Blue Shard
            invis: 0      // Purple Shard
        };

        // Archer Reload Mechanics
        this.arrowCount = 5;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.reloadMax = heroData.reloadDuration || 90;

        // Falcon Companion
        this.falcon = null;
        if (heroData.id === "archer") {
            this.falcon = {
                x: x - 12,
                y: y - 14,
                wingTimer: 0,
                hoverOffset: 0,
                state: "HOVERING",
                target: null,
                targetX: 0,
                targetY: 0,
                speed: 6.8,
                damageDealt: false
            };
        }
    }

    takeDamage(amount, knockAngle) {
        // Hindi masasaktan kung may invincibility o habang invisible
        if (this.invincibleTimer > 0 || this.hp <= 0 || this.buffs.invis > 0) return false;

        this.hp -= amount;
        this.invincibleTimer = 40;
        this.x += Math.cos(knockAngle) * 8;
        this.y += Math.sin(knockAngle) * 8;

        if (this.hp <= 0) this.hp = 0;
        return true;
    }

    update(keys, bounds, target, onSpawnProjectile, onCritImpact) {
        if (this.hp <= 0) return;

        if (this.invincibleTimer > 0) this.invincibleTimer--;
        if (this.skillCooldownTimer > 0) this.skillCooldownTimer--;
        if (this.attackCooldownTimer > 0) this.attackCooldownTimer--;

        // 1. UPDATE BUFF TIMERS & ATTRIBUTES
        if (this.buffs.damage > 0) this.buffs.damage--;
        if (this.buffs.atkSpeed > 0) this.buffs.atkSpeed--;
        if (this.buffs.invis > 0) this.buffs.invis--;

        if (this.buffs.moveSpeed > 0) {
            this.buffs.moveSpeed--;
            this.speed = this.baseSpeed * 1.8; // +80% Speed Boost
        } else {
            this.speed = this.baseSpeed;
        }

        // Archer Reload Progress
        if (this.isReloading) {
            this.reloadTimer--;
            if (this.reloadTimer <= 0) {
                this.isReloading = false;
                this.arrowCount = 5;
                this.state = "idle";
            }
        }

        // 2. Aim Angle & Orientation
        if (target) {
            const dx = (target.x + 12) - (this.x + 12);
            const dy = (target.y + 12) - (this.y + 12);
            this.aimAngle = Math.atan2(dy, dx);
            if (!this.isHomingKick) {
                this.facing = dx >= 0 ? "right" : "left";
            }
        }

        // 3. Input Triggers with Attack Speed Buff check
        if (this.state !== "slashing" && this.state !== "bashing" && !this.isReloading) {
            if (keys["KeyJ"]) {
                if (this.attackCooldownTimer === 0) {
                    this.state = "slashing";
                    this.animTimer = 0;
                    this.animFrame = 0;

                    // Haste Buff: 3x faster attack rate
                    const baseAtkCd = this.heroData.attackCooldown || 30;
                    this.attackCooldownTimer = this.buffs.atkSpeed > 0 ? Math.floor(baseAtkCd * 0.35) : baseAtkCd;

                    if (this.heroData.onAttack) {
                        this.heroData.onAttack(this, target, onSpawnProjectile);
                    }
                }
            } else if (keys["Space"]) {
                if (this.skillCooldownTimer === 0) {
                    this.state = "bashing";
                    this.animTimer = 0;
                    this.animFrame = 0;
                    this.skillCooldownTimer = this.heroData.cooldown || 240;

                    if (this.heroData.onSkill) {
                        this.heroData.onSkill(this, target, onSpawnProjectile);
                    }
                }
            }
        }

        // 4. Animation & Locomotion
        if (this.state === "slashing") {
            this.animTimer++;
            const slashLimit = this.buffs.atkSpeed > 0 ? 3 : 6;
            if (this.animTimer >= slashLimit) {
                this.animTimer = 0;
                this.animFrame++;
                if (this.animFrame >= this.heroData.sprites.slash.length) {
                    if (!this.isReloading) this.state = "idle";
                    this.animFrame = 0;
                }
            }
        } else if (this.state === "bashing") {
            if (this.heroData.onSkillUpdate) {
                this.heroData.onSkillUpdate(this, target, onCritImpact);
            }

            if (this.isHomingKick) {
                this.animFrame = 1;
            } else {
                this.animTimer++;
                if (this.animTimer >= 8) {
                    this.animTimer = 0;
                    this.animFrame++;
                    if (this.animFrame >= this.heroData.sprites.bash.length) {
                        this.state = "idle";
                        this.animFrame = 0;
                    }
                }
            }
        } else if (!this.isReloading) {
            let isMoving = false;
            if (keys["ArrowUp"] || keys["KeyW"]) { this.y -= this.speed; isMoving = true; }
            if (keys["ArrowDown"] || keys["KeyS"]) { this.y += this.speed; isMoving = true; }
            if (keys["ArrowLeft"] || keys["KeyA"]) { this.x -= this.speed; this.facing = "left"; isMoving = true; }
            if (keys["ArrowRight"] || keys["KeyD"]) { this.x += this.speed; this.facing = "right"; isMoving = true; }

            this.state = isMoving ? "running" : "idle";
            this.animTimer++;
            if (this.animTimer >= (isMoving ? 7 : 24)) {
                this.animTimer = 0;
                this.animFrame++;
            }
        }

        this.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.x));
        this.y = Math.max(bounds.minY, Math.min(bounds.maxY, this.y));

        // Falcon Update
        if (this.falcon) {
            const f = this.falcon;
            f.wingTimer = (f.wingTimer + 1) % 12;
            f.hoverOffset = Math.sin(Date.now() / 200) * 3;

            if (f.state === "HOVERING") {
                const targetSideX = this.facing === "right" ? this.x - 14 : this.x + 22;
                const targetSideY = this.y - 12 + f.hoverOffset;

                f.x += (targetSideX - f.x) * 0.15;
                f.y += (targetSideY - f.y) * 0.15;
            }
        }
    }

    getCurrentFrame() {
        const sp = this.heroData.sprites;
        if (this.state === "slashing") return sp.slash[this.animFrame];
        if (this.state === "bashing") return sp.bash[this.animFrame];
        if (this.state === "running") return sp.run[this.animFrame % sp.run.length];
        return sp.idle[this.animFrame % sp.idle.length];
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
            return;
        }

        ctx.save();

        // INVISIBILITY BUFF: Ghost Transparency & Purple Aura
        if (this.buffs.invis > 0) {
            ctx.globalAlpha = 0.35; // Translucent
        }

        // SPEED / DAMAGE BUFF GLOW AURA SA PAA
        if (this.buffs.damage > 0 || this.buffs.moveSpeed > 0) {
            ctx.fillStyle = this.buffs.damage > 0 ? "rgba(255, 50, 50, 0.4)" : "rgba(0, 240, 255, 0.4)";
            ctx.beginPath();
            ctx.arc(this.x + 12, this.y + 14, 14, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = "rgba(10, 12, 16, 0.45)";
        ctx.beginPath();
        ctx.ellipse(this.x + 12, this.y + 22, this.state === "bashing" ? 9 : 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.isHomingKick) {
            ctx.fillStyle = "rgba(0, 240, 255, 0.45)";
            const trailX = this.facing === "right" ? this.x - 8 : this.x + 16;
            ctx.fillRect(trailX, this.y + 6, 10, 4);
        }

        const spriteGrid = this.getCurrentFrame();
        if (!spriteGrid) {
            ctx.restore();
            return;
        }

        const size = spriteGrid.length;
        const flip = this.facing === "left";

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const color = spriteGrid[r][c];
                if (color) {
                    ctx.fillStyle = color;
                    const drawCol = flip ? size - 1 - c : c;
                    ctx.fillRect(Math.floor(this.x) + drawCol, Math.floor(this.y) + r, 1, 1);
                }
            }
        }

        ctx.restore();
    }
}