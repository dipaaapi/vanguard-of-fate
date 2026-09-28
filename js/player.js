import { Sound } from "./audio.js";
import { Bag } from "./items/bag.js";
import { STATS, PRIMARY, statCost, STAT_MAX, skillBonus, canLearn, findSkill } from "./skills.js";
import { STATUS_KEYS, tickStatuses, resistChance, blocksRegen } from "./status.js";

// Stamina (parang Diablo): nauubos habang nag-i-sprint, bumabalik kapag naglalakad o nakatayo.
// Kapag naubos, "pagod" hanggang umabot ulit sa EXHAUST_RECOVER.
const STAMINA_DRAIN = 0.55;
const STAMINA_REGEN = 0.4;
const STAMINA_DELAY = 24;       // frames bago magsimulang bumalik
const EXHAUST_RECOVER = 35;

// EXP para umakyat mula sa level na ito (quadratic, hindi exponential):
// Lv1 70 · Lv10 790 · Lv20 2540 · Lv30 5290 · Lv40 9040 — mga 8 hanggang 26 na kapantay na halimaw bawat level
export const expFor = (level) => Math.round(40 + 25 * level + 5 * level * level);

export class Player {
  constructor(x, y, heroData) {
    this.x = x;
    this.y = y;
    this.heroData = heroData;

    this.level = 1;
    this.exp = 0;
    this.expNext = expFor(1);
    this.gold = 150;
    this.statPoints = 10;     // panimulang puntos para sa STR/AGI/VIT/INT/DEX/LUK

    // Stat builder at skill tree (parang Ragnarok Online) — tingnan ang js/skills.js
    this.stats = { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 };
    this.skillLevels = {};
    this.skillPoints = 0;
    this.sk = {};             // kabuuang epekto ng mga skill (kinukuwenta sa recalc)
    this.aspd = 0;            // bilis ng atake (0..0.5)
    this.dmgMult = 1;         // dagdag na % pinsala mula sa skill
    this.dmgReduce = 0;       // bawas sa natatanggap na pinsala (0..0.5)
    this.regenTimer = 0;

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
    this.attack = 0;          // dagdag na pinsala (stat points + kagamitan)
    this.crit = 0;            // tsansa ng critical (0..1)
    this.cdr = 0;             // bawas sa cooldown (0..0.5)

    // Stamina / pagod
    this.maxStamina = 100;
    this.stamina = this.maxStamina;
    this.exhausted = false;
    this.staminaDelay = 0;
    this.freshTimer = 0;      // Stamina Tonic: walang pagod habang > 0

    // Bag at suot na kagamitan (tingnan ang js/items)
    this.bag = new Bag();
    // Quick slot (1–4), parang F-key ng Ragnarok / belt ng Diablo II
    this.belt = ["salve", "tonic", "panacea", "herb"];
    // Auto-potion: hp = porsyento ng HP (0 = off); cure = auto-Panacea; stamina = auto-Tonic kapag pagod
    this.autoPot = { hp: 0, cure: false, stamina: false };
    this.autoPotTimer = 0;

    this.facing = "right";
    this.dir = "down";        // down | up | side (para sa 4-direksyong Avatar)
    this.state = "idle";
    this.animFrame = 0;
    this.animTimer = 0;
    this.aimAngle = 0;

    this.attackCooldownTimer = 0;
    this.skillCooldownTimer = 0;
    this.skill2CooldownTimer = 0;   // pangatlong skill (L)
    this.hitFlashTimer = 0;
    this.portalCooldown = 0;

    this.buffs = { damage: 0, atkSpeed: 0, moveSpeed: 0, invis: 0 };
    this.debuffs = Object.fromEntries(STATUS_KEYS.map((k) => [k, 0]));   // tingnan ang js/status.js
    this.paralyzed = false;

    this.angels = [];

    // Sprint: diinan ang Space, o i-tap para i-lock (sprintLock). May alikabok sa paa.
    this.sprintLock = false;
    this.sprinting = false;
    this.dust = [];           // { x, y, life, max, r }
    this.rollGhosts = [];     // mga bakas ng Dodge Roll (afterimage)

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

  // Kabuuang STR/AGI/… = base + kagamitan (affix, card) + skill
  totalStat(k) {
    return (this.stats[k] || 1) + (this.gearStats ? this.gearStats[k] || 0 : 0) + (this.sk[k] || 0);
  }

  // Muling kinukuwenta ang lahat: base ng class + level + STR/AGI/… + kagamitan + skill
  recalc() {
    const g = this.bag.stats();
    this.gearStats = g;
    const w = this.bag.equippedItem("weapon");
    this.weaponIcon = w ? w.icon : "knuckle";     // para sa size modifier (js/elements.js)
    this.sk = skillBonus(this);
    const sk = this.sk;
    const S = Object.fromEntries(STATS.map((k) => [k, this.totalStat(k)]));
    const primary = S[PRIMARY[this.heroData.id] || "str"];
    const secondary = PRIMARY[this.heroData.id] === "str" ? S.dex : S.str;

    this.maxHp = Math.round((this.baseMaxHp + this.bonusHp + (this.level - 1) * 12 + g.hp + S.vit * 6) * (1 + S.vit * 0.01 + (sk.hpPct || 0) / 100));
    this.defense = this.bonusDefense + g.def + Math.floor(S.vit / 2) + (sk.def || 0);
    this.speed = (this.baseSpeed + this.bonusSpeed + g.spd + S.agi * 0.004) * (1 + (sk.move || 0) / 100);
    this.attack = Math.round(this.bonusDamage + g.atk + primary * 1.5 + secondary * 0.3 + (sk.atk || 0));
    this.crit = Math.min(0.75, this.bonusCrit + (g.crit + S.luk * 0.3 + S.dex * 0.1 + (sk.crit || 0)) / 100);
    this.cdr = Math.min(0.5, (g.cdr + S.int * 0.25 + (sk.cdr || 0)) / 100);
    this.aspd = Math.min(0.5, (g.aspd + S.agi * 0.6 + S.dex * 0.2 + (sk.aspd || 0)) / 100);
    this.dmgMult = 1 + (sk.dmg || 0) / 100;
    this.dmgReduce = Math.min(0.5, (sk.dmgReduce || 0) / 100);
    this.healMult = 1 + (sk.heal || 0) / 100;
    this.maxStamina = Math.round(100 + S.vit + S.agi * 0.5 + (sk.stamina || 0));
    this.stamina = Math.min(this.stamina, this.maxStamina);
    this.hp = Math.min(this.hp, this.maxHp);
  }

  // Stat builder: itaas ang STR/AGI/… (tumataas ang gastos, tulad sa Ragnarok)
  raiseStat(k) {
    const v = this.stats[k];
    if (v === undefined || v >= STAT_MAX) return false;
    const cost = statCost(v);
    if (this.statPoints < cost) return false;
    this.statPoints -= cost;
    this.stats[k] = v + 1;
    const before = this.maxHp;
    this.recalc();
    this.hp = Math.min(this.maxHp, this.hp + Math.max(0, this.maxHp - before));
    return true;
  }

  // Skill tree: dagdagan ang level ng skill
  learnSkill(id) {
    const s = findSkill(id);
    if (!s || !canLearn(this, s)) return false;
    this.skillPoints--;
    this.skillLevels[id] = (this.skillLevels[id] || 0) + 1;
    this.recalc();
    return true;
  }

  // source: ang kalabang tumama (opsyonal, para sa talaan sa bottom tray)
  takeDamage(amount, fx, source = null) {
    if (this.hp <= 0) return;
    if (this.hitFlashTimer > 0) return;
    if (this.invulnTimer > 0) return;   // hal. Dodge Roll ng Novice

    const guard = (this.guardTimer > 0 ? 0.65 : 1) * (this.mercGuard || 1);   // Bastion Forcefield (−35%) · Guardian Aura (−15%)
    const netDmg = Math.max(1, Math.round(amount * guard * (1 - (this.dmgReduce || 0))) - this.defense);
    this.hp -= netDmg;
    this.hitFlashTimer = 16;
    if (this.onHurt) this.onHurt(netDmg, source);

    if (Sound && Sound.playPlayerHurt) Sound.playPlayerHurt();
    if (fx && fx.spawnDamagePopup) {
      fx.spawnDamagePopup(this.x + 10, this.y - 6, `-${netDmg}`, false, "#ff4d6d");
      fx.addScreenShake(3);
    }

    if (this.hp <= 0) {
      this.hp = 0;
    }
  }

  // Ibinabalik ang true kapag tumalab (maaaring pigilan ng VIT/INT/LUK, tulad sa Ragnarok)
  inflictDebuff(type, duration) {
    if (!this.debuffs || this.debuffs[type] === undefined) return false;
    if (Math.random() < resistChance(this, type)) return false;
    this.debuffs[type] = Math.max(this.debuffs[type], duration);
    return true;
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
    this.exp += Math.round(amount * (1 + (this.sk.exp || 0) / 100));
    while (this.exp >= this.expNext) {
      this.exp -= this.expNext;
      this.level++;
      this.expNext = expFor(this.level);
      // Ragnarok: mas maraming stat point habang tumataas ang level; 1 skill point bawat level
      this.statPoints += 3 + Math.floor(this.level / 5);
      this.skillPoints += 1;
      this.recalc();
      this.hp = this.maxHp;
      if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
      if (this.onLevelUp) this.onLevelUp(this.level);
    }
  }

  upgradeStat(type) {
    if (this.statPoints <= 0) return;
    this.statPoints--;
    if (type === "hp") {
      this.bonusHp += 20;
      this.hp += 20;
    } else if (type === "damage") {
      this.bonusDamage += 4;
    } else if (type === "defense") {
      this.bonusDefense += 2;
    } else if (type === "speed") {
      this.bonusSpeed += 0.15;
    } else if (type === "crit") {
      this.bonusCrit += 0.05;
    } else if (type === "cooldown") {
      this.bonusCooldown += 15;
    }
    this.recalc();
  }

  // Stamina bawat frame. wantSprint = diniinan ang Space / naka-lock ang sprint habang gumagalaw
  updateStamina(wantSprint) {
    if (this.freshTimer > 0) this.freshTimer--;
    const canSprint = wantSprint && !this.exhausted && this.debuffs.freeze <= 0;
    if (canSprint) {
      if (this.freshTimer <= 0) this.stamina = Math.max(0, this.stamina - STAMINA_DRAIN);
      this.staminaDelay = STAMINA_DELAY;
      if (this.stamina <= 0) {
        this.exhausted = true;
        this.sprintLock = false;
      }
    } else if (this.staminaDelay > 0) {
      this.staminaDelay--;
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + STAMINA_REGEN);
    }
    if (this.exhausted && this.stamina >= EXHAUST_RECOVER) this.exhausted = false;
    return canSprint;
  }

  update(input, bounds, spawnProjectile, closestEnemy, isInSafeZone = false, fx = null) {
    if (this.hp <= 0) return;
    // Target lang kapag abot ng class (hal. palaso 220px, punyal 60px); lampas diyan = diretso sa harap
    const range = (this.heroData && this.heroData.range) || 200;
    if (closestEnemy && Math.hypot(closestEnemy.x - this.x, closestEnemy.y - this.y) > range) closestEnemy = null;
    this.target = closestEnemy;

    if (this.hitFlashTimer > 0) this.hitFlashTimer--;
    // First Aid / Thirty-Six Hour Shift: HP bawat 3 segundo (pinipigilan ng lason at pagdurugo)
    if (this.sk.regen && this.hp < this.maxHp && !blocksRegen(this) && ++this.regenTimer >= 180) {
      this.regenTimer = 0;
      this.hp = Math.min(this.maxHp, this.hp + this.sk.regen);
    }
    if (this.portalCooldown > 0) this.portalCooldown--;
    if (this.invulnTimer > 0) this.invulnTimer--;

    for (const b in this.buffs) {
      if (this.buffs[b] > 0) this.buffs[b]--;
    }

    // Mga sumpa ng miasma: pinsala, paralisis (stun) at iba pa (js/status.js)
    this.paralyzed = tickStatuses(this, fx).paralyzed;

    if (this.attackCooldownTimer > 0) this.attackCooldownTimer--;
    if (this.skillCooldownTimer > 0) this.skillCooldownTimer--;
    if (this.skill2CooldownTimer > 0) this.skill2CooldownTimer--;

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

    // Confusion: baligtad ang kontrol · Stun: hindi makagalaw
    if (this.debuffs.confusion > 0) { vx = -vx; vy = -vy; }
    if (this.paralyzed) { vx = 0; vy = 0; }
    const moving = vx !== 0 || vy !== 0;
    // Stamina: nauubos lang habang talagang tumatakbo nang mabilis
    const wantSprint = moving && !this.isReloading && (isPressed("Space") || this.sprintLock);
    this.sprinting = this.updateStamina(wantSprint);
    if (moving && !this.isReloading) {
      const len = Math.hypot(vx, vy);
      const sprintMult = this.sprinting ? 1.6 : 1.0;
      // Alikabok sa likod ng paa habang tumatakbo nang mabilis
      if (this.sprinting && this.animTimer % 3 === 0) {
        this.spawnDust(this.x + 10 - (vx / len) * 6, this.y + 20 - (vy / len) * 3, 1);
      }
      const freezeMult = (this.debuffs.freeze > 0 ? 0.45 : 1.0) * (this.debuffs.curse > 0 ? 0.85 : 1.0);
      const curSpeed = this.speed * sprintMult * freezeMult * (this.buffs.moveSpeed > 0 ? 1.5 : 1);

      this.x += (vx / len) * curSpeed;
      this.y += (vy / len) * curSpeed;

      if (vx > 0) this.facing = "right";
      if (vx < 0) this.facing = "left";
      if (this.state !== "slash") this.dir = vx !== 0 ? "side" : (vy < 0 ? "up" : "down");

      if (this.state !== "slash" && this.state !== "bash") {
        this.state = "run";
      }
    } else {
      if (this.state === "run") this.state = "idle";
    }

    // Dodge Roll: afterimage bawat 2 frame + alikabok sa simula at dulo
    if (this.rollTimer > 0) {
      if (this.rollTimer % 2 === 0) this.rollGhosts.push({ x: this.x, y: this.y, t: this.rollTimer, life: 10 });
      if (this.rollTimer === 13 || this.rollTimer === 1) this.spawnDust(this.x + 10, this.y + 20, 4);
    }
    this.rollGhosts.forEach((g) => { g.life--; });
    this.rollGhosts = this.rollGhosts.filter((g) => g.life > 0);
    this.dust.forEach((d) => { d.life--; d.y -= 0.12; d.r += 0.08; });
    this.dust = this.dust.filter((d) => d.life > 0);

    if (bounds) {
      this.x = Math.max(bounds.minX || 12, Math.min(bounds.maxX || 1200, this.x));
      this.y = Math.max(bounds.minY || 12, Math.min(bounds.maxY || 900, this.y));
    }

    if (closestEnemy && closestEnemy.isAlive) {
      this.aimAngle = Math.atan2((closestEnemy.y + 8) - (this.y + 10), (closestEnemy.x + 8) - (this.x + 10));
    } else {
      // Walang abot na kalaban: tumutok sa harap (kasama ang pataas/pababa)
      this.aimAngle = this.dir === "up" ? -Math.PI / 2 : this.dir === "down" ? Math.PI / 2 : this.facing === "right" ? 0 : Math.PI;
    }

    // Key J (Attack / Reload)
    const caster = this.heroData.id === "mage" || this.heroData.id === "priest";
    if (isPressed("KeyJ") && this.attackCooldownTimer <= 0 && !isInSafeZone && !this.paralyzed && !(caster && this.debuffs.silence > 0)) {
      if (this.heroData && this.heroData.onAttack) {
        const ok = this.heroData.onAttack(this, closestEnemy, spawnProjectile);
        if (ok !== false) {
          this.faceAim();
          this.state = "slash";
          this.animFrame = 0;
          const rapid = this.buffs.atkSpeed > 0 ? 0.5 : 1.0;
          const chill = this.debuffs.freeze > 0 ? 1.5 : 1;   // Diablo: pinababagal ng lamig ang atake
          this.attackCooldownTimer = Math.round((this.heroData.attackCooldown || 22) * rapid * chill * (1 - this.aspd) * (1 - this.cdr * 0.5));
        }
      }
    }

    // Key K (Special Skill: Falcon Strike para sa Archer)
    if (isPressed("KeyK") && this.skillCooldownTimer <= 0 && !isInSafeZone && this.debuffs.silence <= 0 && !this.paralyzed) {
      if (this.heroData && this.heroData.onSkill) {
        const ok = this.heroData.onSkill(this, closestEnemy, spawnProjectile);
        if (ok !== false) {
          // Job: humarap sa target habang nagka-cast (ang Dodge Roll ng Novice ay sumusunod sa galaw)
          if (this.heroData.animMap) this.faceAim();
          this.state = "bash";
          this.animFrame = 0;
          this.skillCooldownTimer = Math.round((this.heroData.cooldown || 180) * Math.max(0.3, 1 - this.cdr - (this.sk.kcd || 0) / 100));
        }
      }
    }

    // Key L (pangatlong skill ng class)
    if (isPressed("KeyL") && this.skill2CooldownTimer <= 0 && !isInSafeZone && this.debuffs.silence <= 0 && !this.paralyzed) {
      if (this.heroData && this.heroData.onSkill2) {
        const ok = this.heroData.onSkill2(this, closestEnemy, spawnProjectile);
        if (ok !== false) {
          this.faceAim();
          this.state = "slash";
          this.animFrame = 0;
          this.skill2CooldownTimer = Math.round((this.heroData.cooldown2 || 120) * Math.max(0.3, 1 - this.cdr - (this.sk.lcd || 0) / 100));
        }
      }
    }

    this.animTimer++;
    const spriteObj = this.heroData ? this.heroData.sprites : null;
    const frames = (spriteObj && spriteObj[this.state]) || (spriteObj && spriteObj.idle) || [];

    // Mas mabilis ang hakbang kapag nag-i-sprint para tugma sa bilis ng galaw
    const frameTicks = this.state === "run" && this.sprinting ? 5 : 8;
    if (frames.length > 0 && this.animTimer >= frameTicks) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % frames.length;
      if (this.state === "slash" || this.state === "bash") {
        if (this.animFrame === 0) {
          this.state = "idle";
        }
      }
    }
  }

  spawnDust(x, y, n) {
    for (let i = 0; i < n; i++) {
      this.dust.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 2,
        life: 16 + Math.floor(Math.random() * 8),
        max: 24,
        r: 1.2 + Math.random() * 1.2
      });
    }
    if (this.dust.length > 40) this.dust.splice(0, this.dust.length - 40);
  }

  drawDust(ctx) {
    this.dust.forEach((d) => {
      ctx.fillStyle = `rgba(214, 196, 160, ${Math.max(0, d.life / d.max) * 0.55})`;
      ctx.fillRect(Math.round(d.x - d.r), Math.round(d.y - d.r), Math.ceil(d.r * 2), Math.ceil(d.r * 2));
    });
  }

  // Dodge Roll ng Novice: umiikot (pakaliwa/pakanan) o bumabaligtad (pataas/pababa),
  // nakatiklop ang katawan at may maliit na talon. p = 0..1 (progreso ng roll).
  drawRolling(ctx, avatar, x, y, p, flash) {
    const cx = x + 10, cy = y + 13;            // gitna ng katawan
    const hop = Math.sin(p * Math.PI) * 3;     // bahagyang pag-angat
    ctx.save();
    ctx.translate(cx, cy - hop);
    if (this.dir === "side") {
      const sign = this.facing === "left" ? -1 : 1;
      ctx.rotate(sign * p * Math.PI * 2);
      ctx.scale(0.85, 0.85);                   // nakatiklop
    } else {
      // Pasulong/paatras na tumbling: pinipiga ang taas para magmukhang bumabaligtad
      const c = Math.cos(p * Math.PI * 2);
      ctx.scale(0.9, Math.sign(c || 1) * Math.max(0.2, Math.abs(c)) * 0.9);
    }
    avatar.draw(ctx, 0, 8, this.dir, "walk", Math.floor(p * 4) % 4, this.facing === "left", flash);
    ctx.restore();
  }

  // Humarap sa direksyon ng atake (para sa Avatar na may 4 na direksyon)
  faceAim() {
    const a = this.aimAngle;
    const cx = Math.cos(a), cy = Math.sin(a);
    if (Math.abs(cx) >= Math.abs(cy)) {
      this.dir = "side";
      this.facing = cx >= 0 ? "right" : "left";
    } else {
      this.dir = cy < 0 ? "up" : "down";
    }
  }

  draw(ctx) {
    if (this.hp <= 0) return;

    ctx.save();
    this.drawDust(ctx);
    const rolling = this.rollTimer > 0;
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(this.x + 10, this.y + 20, rolling ? 6 : 8, rolling ? 2 : 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.buffs.invis > 0) ctx.globalAlpha = 0.35;

    // Modular Avatar (Novice at lahat ng job, mula sa Character Creator): paa ay nasa (x+10, y+21)
    const avatar = this.heroData && this.heroData.avatar;
    if (avatar) {
      const map = { run: this.sprinting ? "run" : "walk", slash: "attack", bash: "walk", ...(this.heroData.animMap || {}) };
      const anim = map[this.state] || "idle";
      const frame = anim === "idle" ? Math.floor(this.animFrame / 4) : this.animFrame;
      if (rolling) {
        const total = this.rollDuration || 14;
        const baseAlpha = ctx.globalAlpha;
        // Afterimage (mas malabo ang mas luma)
        this.rollGhosts.forEach((g) => {
          ctx.globalAlpha = baseAlpha * (g.life / 10) * 0.28;
          this.drawRolling(ctx, avatar, g.x, g.y, 1 - g.t / total, false);
        });
        ctx.globalAlpha = baseAlpha;
        this.drawRolling(ctx, avatar, this.x, this.y, 1 - this.rollTimer / total, this.hitFlashTimer > 0);
        ctx.restore();
        return;
      }
      avatar.draw(ctx, this.x + 10, this.y + 21, this.dir, anim, frame, this.facing === "left", this.hitFlashTimer > 0);
    }
    ctx.restore();
  }
}