import { Sound } from "./audio.js";

export class Player {
  constructor(x, y, heroData) {
    this.x = x;
    this.y = y;
    this.heroData = heroData;

    this.level = 1;
    this.exp = 0;
    this.expNext = 60;
    this.gold = 150;
    this.statPoints = 0;

    this.bonusHp = 0;
    this.bonusDamage = 0;
    this.bonusDefense = 0;
    this.bonusSpeed = 0;
    this.bonusCrit = 0;
    this.bonusCooldown = 0;

    this.baseMaxHp = heroData.maxHp || 100;
    this.maxHp = this.baseMaxHp;
    this.hp = this.maxHp;
    this.baseSpeed = heroData.speed || 1.4;
    this.speed = this.baseSpeed;
    this.defense = 0;

    this.facing = "right";
    this.state = "idle";
    this.animFrame = 0;
    this.animTimer = 0;
    this.aimAngle = 0;

    this.attackCooldownTimer = 0;
    this.skillCooldownTimer = 0;
    this.hitFlashTimer = 0;
    this.portalCooldown = 0;

    this.buffs = { damage: 0, atkSpeed: 0, moveSpeed: 0, invis: 0 };
    this.debuffs = { bleeding: 0, silence: 0, poison: 0, electrified: 0, burn: 0, freeze: 0, blind: 0 };

    this.angels = [];

    // ========================================================
    // FALCON COMPANION INITIALIZATION PARA SA ARCHER
    // ========================================================
    this.falcon = null;
    if (this.heroData && this.heroData.id === "archer") {
      this.arrowCount = 5;
      this.isReloading = false;
      this.reloadTimer = 0;
      this.falcon = {
        x: x - 18,
        y: y - 16,
        wingTimer: 0,
        state: "HOVERING", // HOVERING, STRIKING, RETURNING
        target: null,
        targetX: 0,
        targetY: 0,
        speed: 6.5,
        damageDealt: false
      };
    }

    if (this.heroData && this.heroData.onInit) {
      this.heroData.onInit(this);
    }
  }

  takeDamage(amount, fx) {
    if (this.hp <= 0) return;
    if (this.hitFlashTimer > 0) return;

    const netDmg = Math.max(1, amount - this.defense);
    this.hp -= netDmg;
    this.hitFlashTimer = 16;

    if (Sound && Sound.playPlayerHurt) Sound.playPlayerHurt();
    if (fx && fx.spawnDamagePopup) {
      fx.spawnDamagePopup(this.x + 10, this.y - 6, `-${netDmg}`, false, "#ff4d6d");
      fx.addScreenShake(3);
    }

    if (this.hp <= 0) {
      this.hp = 0;
    }
  }

  inflictDebuff(type, duration) {
    if (this.debuffs && this.debuffs[type] !== undefined) {
      this.debuffs[type] = Math.max(this.debuffs[type], duration);
    }
  }

  hasAnyDebuff() {
    if (!this.debuffs) return false;
    return Object.values(this.debuffs).some((d) => d > 0);
  }

  cureAllDebuffs() {
    for (const d in this.debuffs) {
      this.debuffs[d] = 0;
    }
  }

  addExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expNext) {
      this.exp -= this.expNext;
      this.level++;
      this.expNext = Math.round(this.expNext * 1.35);
      this.statPoints += 3;
      this.maxHp += 12;
      this.hp = this.maxHp;
      if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
    }
  }

  upgradeStat(type) {
    if (this.statPoints <= 0) return;
    this.statPoints--;
    if (type === "hp") {
      this.bonusHp += 20;
      this.maxHp += 20;
      this.hp += 20;
    } else if (type === "damage") {
      this.bonusDamage += 4;
    } else if (type === "defense") {
      this.bonusDefense += 2;
      this.defense = this.bonusDefense;
    } else if (type === "speed") {
      this.bonusSpeed += 0.15;
      this.speed = this.baseSpeed + this.bonusSpeed;
    } else if (type === "crit") {
      this.bonusCrit += 0.05;
    } else if (type === "cooldown") {
      this.bonusCooldown += 15;
    }
  }

  update(input, bounds, spawnProjectile, closestEnemy, isInSafeZone = false, fx = null) {
    if (this.hp <= 0) return;

    if (this.hitFlashTimer > 0) this.hitFlashTimer--;
    if (this.portalCooldown > 0) this.portalCooldown--;

    for (const b in this.buffs) {
      if (this.buffs[b] > 0) this.buffs[b]--;
    }

    for (const d in this.debuffs) {
      if (this.debuffs[d] > 0) {
        this.debuffs[d]--;
        if ((d === "bleeding" || d === "burn") && this.debuffs[d] % 45 === 0) {
          this.hp = Math.max(0, this.hp - 3);
          if (fx && fx.spawnDamagePopup) {
            fx.spawnDamagePopup(this.x + 10, this.y - 4, "-3", false, d === "burn" ? "#ff5500" : "#d90429");
          }
        }
      }
    }

    if (this.attackCooldownTimer > 0) this.attackCooldownTimer--;
    if (this.skillCooldownTimer > 0) this.skillCooldownTimer--;

    // Archer Channelled Reload Progress
    if (this.isReloading) {
      this.reloadTimer--;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        this.arrowCount = 5;
        this.state = "idle";
      }
    }

    if (this.heroData && this.heroData.onUpdate) {
      this.heroData.onUpdate(this);
    }

    const isPressed = (code) => {
      if (!input) return false;
      if (typeof input.isDown === "function") return input.isDown(code);
      return Boolean(input[code]);
    };

    // Movement Controls
    let vx = 0;
    let vy = 0;
    if (isPressed("KeyW") || isPressed("ArrowUp")) vy -= 1;
    if (isPressed("KeyS") || isPressed("ArrowDown")) vy += 1;
    if (isPressed("KeyA") || isPressed("ArrowLeft")) vx -= 1;
    if (isPressed("KeyD") || isPressed("ArrowRight")) vx += 1;

    const moving = vx !== 0 || vy !== 0;
    if (moving && !this.isReloading) {
      const len = Math.hypot(vx, vy);
      const isSprinting = isPressed("Space");
      const sprintMult = isSprinting ? 1.4 : 1.0;
      const freezeMult = this.debuffs.freeze > 0 ? 0.45 : 1.0;
      const curSpeed = this.speed * sprintMult * freezeMult * (this.buffs.moveSpeed > 0 ? 1.5 : 1);

      this.x += (vx / len) * curSpeed;
      this.y += (vy / len) * curSpeed;

      if (vx > 0) this.facing = "right";
      if (vx < 0) this.facing = "left";

      if (this.state !== "slash" && this.state !== "bash") {
        this.state = "run";
      }
    } else {
      if (this.state === "run") this.state = "idle";
    }

    if (bounds) {
      this.x = Math.max(bounds.minX || 12, Math.min(bounds.maxX || 1200, this.x));
      this.y = Math.max(bounds.minY || 12, Math.min(bounds.maxY || 900, this.y));
    }

    if (closestEnemy && closestEnemy.isAlive) {
      this.aimAngle = Math.atan2((closestEnemy.y + 8) - (this.y + 10), (closestEnemy.x + 8) - (this.x + 10));
    } else {
      this.aimAngle = this.facing === "right" ? 0 : Math.PI;
    }

    // Key J (Attack / Reload)
    if (isPressed("KeyJ") && this.attackCooldownTimer <= 0 && !isInSafeZone) {
      if (this.heroData && this.heroData.onAttack) {
        const ok = this.heroData.onAttack(this, closestEnemy, spawnProjectile);
        if (ok !== false) {
          this.state = "slash";
          this.animFrame = 0;
          const rapid = this.buffs.atkSpeed > 0 ? 0.5 : 1.0;
          this.attackCooldownTimer = Math.round((this.heroData.attackCooldown || 22) * rapid);
        }
      }
    }

    // Key K (Special Skill: Falcon Strike para sa Archer)
    if (isPressed("KeyK") && this.skillCooldownTimer <= 0 && !isInSafeZone && this.debuffs.silence <= 0) {
      if (this.heroData && this.heroData.onSkill) {
        const ok = this.heroData.onSkill(this, closestEnemy, spawnProjectile);
        if (ok !== false) {
          this.state = "bash";
          this.animFrame = 0;
          this.skillCooldownTimer = this.heroData.cooldown || 180;
        }
      }
    }

    this.animTimer++;
    const spriteObj = this.heroData ? this.heroData.sprites : null;
    const frames = (spriteObj && spriteObj[this.state]) || (spriteObj && spriteObj.idle) || [];

    if (frames.length > 0 && this.animTimer >= 8) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % frames.length;
      if (this.state === "slash" || this.state === "bash") {
        if (this.animFrame === 0) {
          this.state = "idle";
        }
      }
    }
  }

  draw(ctx) {
    if (this.hp <= 0) return;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(this.x + 10, this.y + 20, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.buffs.invis > 0) ctx.globalAlpha = 0.35;

    const spriteObj = this.heroData ? this.heroData.sprites : null;
    const frames = (spriteObj && spriteObj[this.state]) || (spriteObj && spriteObj.idle);

    if (frames && frames.length > 0) {
      const grid = frames[this.animFrame % frames.length];
      if (grid) {
        const isFacingLeft = this.facing === "left";
        if (isFacingLeft) {
          ctx.translate(Math.floor(this.x) + 20, Math.floor(this.y));
          ctx.scale(-1, 1);
        } else {
          ctx.translate(Math.floor(this.x), Math.floor(this.y));
        }

        const numRows = grid.length;
        for (let r = 0; r < numRows; r++) {
          const row = grid[r];
          const numCols = row.length;
          for (let c = 0; c < numCols; c++) {
            const color = row[c];
            if (color && color !== 0) {
              ctx.fillStyle = this.hitFlashTimer > 0 ? "#ffffff" : color;
              ctx.fillRect(c, r, 1, 1);
            }
          }
        }
      }
    }

    ctx.restore();
  }
}