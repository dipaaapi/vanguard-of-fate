import { Sound } from "./audio.js";
import { drawSpriteMatrix } from "./sprite.js";
import { EquipmentManager, EQUIPMENT_DB } from "./equipment.js";

export class Player {
  constructor(x, y, heroData, playerName = "VANGUARD") {
    this.x = x;
    this.y = y;
    this.heroData = heroData;
    this.playerName = playerName;

    this.level = 1;
    this.exp = 0;
    this.expNext = 80;
    this.gold = 150;
    this.statPoints = 0;
    this.upgradeStones = 5;

    this.bonusHp = 0;
    this.bonusDamage = 0;
    this.bonusDefense = 0;
    this.bonusSpeed = 0;
    this.bonusCrit = 0;
    this.bonusCooldown = 0;

    this.baseMaxHp = heroData.maxHp || 100;
    this.baseSpeed = heroData.speed || 1.4;

    // Equipment & Inventory Slots
    this.equipment = {
      weapon: null,
      armor: null,
      accessory: null
    };
    this.inventory = [];

    // Equip Starter Gear based on chosen class
    const heroPrefix = (heroData && heroData.id) ? heroData.id.charAt(0) : "k";
    const starterWpn = EquipmentManager.createItemInstance(heroPrefix + "_wpn_1", 0);
    const starterArm = EquipmentManager.createItemInstance(heroPrefix + "_arm_1", 0);
    if (starterWpn) this.equipment.weapon = starterWpn;
    if (starterArm) this.equipment.armor = starterArm;

    this.maxHp = this.baseMaxHp;
    this.hp = this.maxHp;
    this.maxMana = 100;
    this.mana = 100;
    this.maxFatigue = 100;
    this.fatigue = 100;
    this.speed = this.baseSpeed;
    this.defense = 0;

    this.facing = "right";
    this.dir8 = "E"; // 8-Directional State: N, NE, E, SE, S, SW, W, NW
    this.state = "idle";
    this.animFrame = 0;
    this.animTimer = 0;
    this.aimAngle = 0;

    // ========================================================
    // EVASIVE DASH & AFTERIMAGE GHOSTING (PHASE 1)
    // ========================================================
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDuration = 10;
    this.dashCooldownTimer = 0;
    this.dashCooldownMax = 38;
    this.dashVx = 0;
    this.dashVy = 0;
    this.dashSpeed = 3.6;
    this.afterimages = [];

    this.attackCooldownTimer = 0;
    this.skill1CooldownTimer = 0;
    this.skill2CooldownTimer = 0;
    this.skill3CooldownTimer = 0;
    this.skillCooldownTimer = 0;
    this.hitFlashTimer = 0;
    this.portalCooldown = 0;

    this.buffs = { damage: 0, atkSpeed: 0, moveSpeed: 0, invis: 0 };
    this.debuffs = { bleeding: 0, silence: 0, poison: 0, electrified: 0, burn: 0, freeze: 0, blind: 0 };

    this.falconCompanion = null;
    this.angelCompanions = [];

    if (this.heroData && this.heroData.onInit) {
      this.heroData.onInit(this);
    }

    this.recalculateStats();
  }

  takeDamage(amount, fx) {
    if (this.hp <= 0) return;
    if (this.hitFlashTimer > 0) return;

    // Invulnerability Frames during Evasive Dash
    if (this.isDashing) {
      if (fx && fx.spawnDamagePopup) {
        fx.spawnDamagePopup(this.x + 10, this.y - 6, "DODGE!", false, "#38bdf8");
      }
      return;
    }

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

  recalculateStats() {
    let eqAtk = 0;
    let eqDef = 0;
    let eqHp = 0;
    let eqCrit = 0;
    let eqSpeed = 0;

    for (const slot of ["weapon", "armor", "accessory"]) {
      const item = this.equipment[slot];
      if (item) {
        const stats = EquipmentManager.getCalculatedStats(item);
        eqAtk += stats.atk;
        eqDef += stats.def;
        eqHp += stats.hp;
        eqCrit += stats.crit;
        eqSpeed += stats.speed;
      }
    }

    // Base level scaling (Levels 1 to 100)
    const levelHpBonus = (this.level - 1) * 14;
    const levelAtkBonus = (this.level - 1) * 3;
    const levelDefBonus = Math.floor((this.level - 1) * 0.8);

    this.maxHp = this.baseMaxHp + this.bonusHp + levelHpBonus + eqHp;
    if (this.hp > this.maxHp) this.hp = this.maxHp;
    this.maxMana = 100 + (this.level - 1) * 4;
    if (this.mana > this.maxMana) this.mana = this.maxMana;
    this.maxFatigue = 100;
    if (this.fatigue > this.maxFatigue) this.fatigue = this.maxFatigue;
    this.maxMana = 100 + (this.level - 1) * 4;
    if (this.mana > this.maxMana) this.mana = this.maxMana;
    this.maxFatigue = 100;
    if (this.fatigue > this.maxFatigue) this.fatigue = this.maxFatigue;

    this.defense = this.bonusDefense + levelDefBonus + eqDef;
    this.speed = Number((this.baseSpeed + this.bonusSpeed + eqSpeed).toFixed(2));
    this.totalAtk = (this.heroData.damage || 14) + this.bonusDamage + levelAtkBonus + eqAtk;
    this.totalCrit = Number(((this.heroData.critChance || 0.05) + this.bonusCrit + (eqCrit / 100)).toFixed(2));
  }

  equipItem(item) {
    if (!item) return false;
    const slot = item.type;
    if (!this.equipment.hasOwnProperty(slot)) return false;

    if (item.classReq !== "all" && item.classReq !== this.heroData.id) {
      return false;
    }

    if (this.level < (item.levelReq || 1)) {
      return false;
    }

    const idx = this.inventory.findIndex(i => i.uid === item.uid);
    if (idx !== -1) {
      this.inventory.splice(idx, 1);
    }

    const oldItem = this.equipment[slot];
    if (oldItem) {
      this.inventory.push(oldItem);
    }

    this.equipment[slot] = item;
    this.recalculateStats();
    if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
    return true;
  }

  unequipItem(slot) {
    const item = this.equipment[slot];
    if (!item) return false;
    this.equipment[slot] = null;
    this.inventory.push(item);
    this.recalculateStats();
    return true;
  }

  useConsumable(itemUid, fx = null) {
    const idx = this.inventory.findIndex(i => i.uid === itemUid);
    if (idx === -1) return false;
    const item = this.inventory[idx];

    if (item.id === "con_hp_potion") {
      this.hp = Math.min(this.maxHp, this.hp + 60);
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(this.x + 10, this.y - 6, "+60 HP", true, "#22c55e");
    } else if (item.id === "con_mana_elixir") {
      this.skill1CooldownTimer = 0;
      this.skill2CooldownTimer = 0;
      this.skill3CooldownTimer = 0;
      this.skillCooldownTimer = 0;
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(this.x + 10, this.y - 6, "SKILLS RESET!", true, "#00f0ff");
    } else if (item.id === "con_speed_tonic") {
      this.buffs.moveSpeed = 720;
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(this.x + 10, this.y - 6, "SWIFTSTRIDE!", true, "#ffd166");
    } else if (item.id === "con_cure_salve") {
      if (!this.hasAnyDebuff()) {
        if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(this.x + 10, this.y - 6, "NO ABNORMAL STATUS!", false, "#ef4444");
        return false;
      }
      this.cureAllDebuffs();
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(this.x + 10, this.y - 6, "PURIFIED!", true, "#4ade80");
    }

    this.inventory.splice(idx, 1);
    if (Sound && Sound.playLootPickup) Sound.playLootPickup();
    return true;
  }

  gainExp(amount, fx = null) {
    this.addExp(amount, fx);
  }

  addExp(amount, fx = null) {
    if (this.level >= 100) return;
    this.exp += amount;
    while (this.exp >= this.expNext && this.level < 100) {
      this.exp -= this.expNext;
      this.level++;
      this.expNext = Math.round(this.expNext * 1.30);
      this.statPoints += 4;
      this.recalculateStats();
      this.hp = this.maxHp;

      if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
      if (fx && fx.spawnDamagePopup) {
        fx.spawnDamagePopup(this.x + 10, this.y - 14, `LEVEL UP! LV.${this.level}`, true, "#ffd166");
      }
    }
  }

  upgradeStat(type) {
    if (this.statPoints <= 0) return;
    this.statPoints--;
    if (type === "hp") {
      this.bonusHp += 25;
    } else if (type === "damage") {
      this.bonusDamage += 5;
    } else if (type === "defense") {
      this.bonusDefense += 3;
    } else if (type === "speed") {
      this.bonusSpeed += 0.15;
    } else if (type === "crit") {
      this.bonusCrit += 0.05;
    } else if (type === "cooldown") {
      this.bonusCooldown += 15;
    }
    this.recalculateStats();
  }

  update(input, bounds, spawnProjectile, closestEnemy, isInSafeZone = false, fx = null, enemyManager = null) {
    if (this.hp <= 0) return;
    this.isInSafeZone = isInSafeZone;

    // Natural Mana & Fatigue (Stamina) Regeneration
    if (this.mana < this.maxMana) this.mana = Math.min(this.maxMana, this.mana + 0.25);
        if (this.hitFlashTimer > 0) this.hitFlashTimer--;
    if (this.portalCooldown > 0) this.portalCooldown--;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer--;

    // Update and fade ghost afterimages
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].alpha -= 0.09;
      if (this.afterimages[i].alpha <= 0) {
        this.afterimages.splice(i, 1);
      }
    }

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

    // 8-Directional Vector Calculation
    let vx = 0;
    let vy = 0;
    if (isPressed("KeyW") || isPressed("ArrowUp"))    vy -= 1;
    if (isPressed("KeyS") || isPressed("ArrowDown"))  vy += 1;
    if (isPressed("KeyA") || isPressed("ArrowLeft"))  vx -= 1;
    if (isPressed("KeyD") || isPressed("ArrowRight")) vx += 1;

    const moving = vx !== 0 || vy !== 0;

    // Cooldown management
    if (this.hitFlashTimer > 0) this.hitFlashTimer--;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer--;
    if (this.attackCooldownTimer > 0) this.attackCooldownTimer--;
    if (this.skill1CooldownTimer > 0) this.skill1CooldownTimer--;
    if (this.skill2CooldownTimer > 0) this.skill2CooldownTimer--;
    if (this.skill3CooldownTimer > 0) this.skill3CooldownTimer--;
    if (this.portalCooldown > 0) this.portalCooldown--;

    if (this.heroData && this.heroData.onUpdate) {
      this.heroData.onUpdate(this);
    }

    if (this.heroData && this.heroData.onSkillUpdate) {
      this.heroData.onSkillUpdate(this, closestEnemy, null, enemyManager, fx);
    }

    // Determine 8-Directional Facing
    if (vx > 0 && vy === 0)       this.dir8 = "E";
    else if (vx > 0 && vy < 0)    this.dir8 = "NE";
    else if (vx === 0 && vy < 0)  this.dir8 = "N";
    else if (vx < 0 && vy < 0)    this.dir8 = "NW";
    else if (vx < 0 && vy === 0)  this.dir8 = "W";
    else if (vx < 0 && vy > 0)    this.dir8 = "SW";
    else if (vx === 0 && vy > 0)  this.dir8 = "S";
    else if (vx > 0 && vy > 0)    this.dir8 = "SE";

    if (vx < 0) this.facing = "left";
    else if (vx > 0) this.facing = "right";

    const spriteObj = this.heroData ? this.heroData.sprites : null;
    const frames = (spriteObj && spriteObj[this.state]) || (spriteObj && spriteObj.idle) || [];

    // ========================================================
    // 1. EVASIVE DASH [SPACE] & SPRINT [HOLD SHIFT]
    // ========================================================
    const triggerDash = isPressed("Space") && this.dashCooldownTimer <= 0 && !this.isDashing && !this.isReloading && !isInSafeZone && this.fatigue >= 15;
    if (triggerDash) {
      this.isDashing = true;
      this.dashTimer = this.dashDuration;
      this.dashCooldownTimer = this.dashCooldownMax;
      this.fatigue = Math.max(0, this.fatigue - 20);
      
      const baseMoveSpeed = this.speed * 1.45;

      if (moving) {
        const len = Math.hypot(vx, vy);
        this.dashVx = (vx / len) * baseMoveSpeed * this.dashSpeed;
        this.dashVy = (vy / len) * baseMoveSpeed * this.dashSpeed;
      } else {
        const facingDir = this.facing === "left" ? -1 : 1;
        this.dashVx = facingDir * baseMoveSpeed * this.dashSpeed;
        this.dashVy = 0;
      }

      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
    }

    // Active Dash Motion & Phantom Afterimages
    if (this.isDashing) {
      this.dashTimer--;
      this.x += this.dashVx;
      this.y += this.dashVy;

      const curGrid = frames && frames.length > 0 ? frames[this.animFrame % frames.length] : null;
      if (curGrid && this.dashTimer % 2 === 0) {
        this.afterimages.push({
          x: this.x,
          y: this.y,
          grid: curGrid,
          facing: this.facing,
          alpha: 0.7,
          color: this.heroData.accentColor || "#38bdf8"
        });
      }

      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else if (moving && !this.isReloading) {
      const len = Math.hypot(vx, vy);
      const isShiftSprinting = isPressed("ShiftLeft") || isPressed("ShiftRight");
      let sprintMult = 1.0;

      if (isShiftSprinting && this.fatigue > 0) {
        this.fatigue = Math.max(0, this.fatigue - 0.45);
        sprintMult = 1.6; // Sprint 1.6x speed
      } else if (!isShiftSprinting) {
        if (this.fatigue < this.maxFatigue) this.fatigue = Math.min(this.maxFatigue, this.fatigue + 0.35);
      }

      const freezeMult = this.debuffs.freeze > 0 ? 0.45 : 1.0;
      const curSpeed = this.speed * sprintMult * freezeMult * (this.buffs.moveSpeed > 0 ? 1.5 : 1);

      this.x += (vx / len) * curSpeed;
      this.y += (vy / len) * curSpeed;

      if (this.state !== "slash" && this.state !== "bash") {
        this.state = "run";
      }
    } else {
      if (this.state === "run") this.state = "idle";
      if (this.fatigue < this.maxFatigue) this.fatigue = Math.min(this.maxFatigue, this.fatigue + 0.4);
    }

    if (bounds) {
      this.x = Math.max(bounds.minX || 12, Math.min(bounds.maxX || 1200, this.x));
      this.y = Math.max(bounds.minY || 12, Math.min(bounds.maxY || 900, this.y));
    }

    // 8-Directional Combat Aiming
    if (closestEnemy && closestEnemy.isAlive) {
      this.aimAngle = Math.atan2((closestEnemy.y + 8) - (this.y + 10), (closestEnemy.x + 8) - (this.x + 10));
    } else {
      const dirMap = {
        E: 0,
        SE: Math.PI / 4,
        S: Math.PI / 2,
        SW: (3 * Math.PI) / 4,
        W: Math.PI,
        NW: (-3 * Math.PI) / 4,
        N: -Math.PI / 2,
        NE: -Math.PI / 4
      };
      this.aimAngle = dirMap[this.dir8] !== undefined ? dirMap[this.dir8] : (this.facing === "right" ? 0 : Math.PI);
    }

    // ========================================================
    // 2. NORMAL / MICRO ATTACK [SPACEBAR]
    // ========================================================
    if (isPressed("Space") && this.attackCooldownTimer <= 0 && !isInSafeZone) {
      if (this.heroData && this.heroData.onAttack) {
        const ok = this.heroData.onAttack(this, closestEnemy, spawnProjectile, fx, enemyManager, spawnProjectile);
        if (ok !== false) {
          this.state = "slash";
          this.animFrame = 0;
          const rapid = this.buffs.atkSpeed > 0 ? 0.5 : 1.0;
          this.attackCooldownTimer = Math.round((this.heroData.attackCooldown || 16) * rapid);
        }
      }
    }

    // ========================================================
    // 3. SKILL 1 [KEY J / 1]
    // ========================================================
    if ((isPressed("KeyJ") || isPressed("Digit1")) && this.skill1CooldownTimer <= 0 && !isInSafeZone && this.debuffs.silence <= 0) {
      const fn = (this.heroData && (this.heroData.onSkill1 || this.heroData.onSkill)) || null;
      if (fn) {
        const ok = fn(this, closestEnemy, spawnProjectile, fx, enemyManager, spawnProjectile);
        if (ok !== false) {
          this.state = "bash";
          this.animFrame = 0;
          this.skill1CooldownTimer = this.heroData.skill1Cooldown || this.heroData.cooldown || 180;
        }
      }
    }

    // ========================================================
    // 4. SKILL 2 [KEY K / 2]
    // ========================================================
    if ((isPressed("KeyK") || isPressed("Digit2")) && this.skill2CooldownTimer <= 0 && !isInSafeZone && this.debuffs.silence <= 0) {
      const fn = (this.heroData && (this.heroData.onSkill2 || this.heroData.onSkill)) || null;
      if (fn) {
        const ok = fn(this, closestEnemy, spawnProjectile, fx, enemyManager, spawnProjectile);
        if (ok !== false) {
          this.state = "bash";
          this.animFrame = 0;
          this.skill2CooldownTimer = this.heroData.skill2Cooldown || 240;
        }
      }
    }

    // ========================================================
    // 5. SKILL 3 [KEY L / 3]
    // ========================================================
    if ((isPressed("KeyL") || isPressed("Digit3")) && this.skill3CooldownTimer <= 0 && !isInSafeZone && this.debuffs.silence <= 0) {
      const fn = (this.heroData && (this.heroData.onSkill3 || this.heroData.onSkill)) || null;
      if (fn) {
        const ok = fn(this, closestEnemy, spawnProjectile, fx, enemyManager, spawnProjectile);
        if (ok !== false) {
          this.state = "slash";
          this.animFrame = 0;
          this.skill3CooldownTimer = this.heroData.skill3Cooldown || 300;
        }
      }
    }

    this.animTimer++;
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

    // 1. Draw Ghost Afterimages (Evasive Dash Trail)
    if (this.afterimages && this.afterimages.length > 0) {
      for (const ghost of this.afterimages) {
        ctx.save();
        ctx.globalAlpha = ghost.alpha * (this.buffs.invis > 0 ? 0.25 : 0.6);
        drawSpriteMatrix(ctx, ghost.x, ghost.y, ghost.grid, false, ghost.facing === "left");
        ctx.restore();
      }
    }

    ctx.save();

    // 2. High-Readability Dual-Layer Contact Ground Shadow
    // Ambient Soft Shadow
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(Math.floor(this.x) + 10, Math.floor(this.y) + 21, 10, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Core Contact Occlusion
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.beginPath();
    ctx.ellipse(Math.floor(this.x) + 10, Math.floor(this.y) + 20.5, 6, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dash ready / cooldown aura
    if (this.isDashing) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(Math.floor(this.x) + 10, Math.floor(this.y) + 12, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    // High +10 to +15 Enhancement Radiant Aura
    const weaponPlus = (this.equipment.weapon && this.equipment.weapon.plus) || 0;
    const armorPlus = (this.equipment.armor && this.equipment.armor.plus) || 0;
    const highestPlus = Math.max(weaponPlus, armorPlus);
    if (highestPlus >= 10) {
      const auraColor = highestPlus >= 15 ? "rgba(255, 215, 0, 0.55)" : (highestPlus >= 13 ? "rgba(168, 85, 247, 0.45)" : "rgba(56, 189, 248, 0.4)");
      ctx.strokeStyle = auraColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(Math.floor(this.x) + 10, Math.floor(this.y) + 12, 15 + Math.sin(Date.now() * 0.006) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.buffs.invis > 0) ctx.globalAlpha = 0.35;

    // 3. Player Sprite Matrix Rendering
    const spriteObj = this.heroData ? this.heroData.sprites : null;
    const frames = (spriteObj && spriteObj[this.state]) || (spriteObj && spriteObj.idle);

    if (frames && frames.length > 0) {
      const grid = frames[this.animFrame % frames.length];
      if (grid) {
        drawSpriteMatrix(ctx, this.x, this.y, grid, this.hitFlashTimer > 0, this.facing === "left");
      }
    }

    ctx.restore();

    // 4. Subtle 8-Directional Aim Pip (Combat Reticle)
    if (!this.isInSafeZone && this.state !== "idle") {
      const aimDist = 18;
      const ax = Math.floor(this.x) + 10 + Math.cos(this.aimAngle) * aimDist;
      const ay = Math.floor(this.y) + 10 + Math.sin(this.aimAngle) * aimDist;
      ctx.fillStyle = "rgba(255, 209, 102, 0.6)";
      ctx.fillRect(Math.floor(ax) - 1, Math.floor(ay) - 1, 2, 2);
    }
  }
}