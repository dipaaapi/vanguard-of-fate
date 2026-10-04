import { Sound } from "./audio.js";
import { Bag } from "./items/bag.js";
import { STATS, PRIMARY, statCost, STAT_MAX, skillBonus, canLearn, findSkill, autoAllocate } from "./skills.js";
import { SLOT_KEYS, noteStyle, slotNewActive, tickActives, styleOf } from "./skillpaths.js";
import { STATUS_KEYS, tickStatuses, resistChance, blocksRegen } from "./status.js";
import { around, mix, hitPose, attackPose, breathPose, drawSwing } from "./juice.js";

// Stamina (Diablo style): drains while sprinting, refills when walking or standing.
// When empty, "tired" until it climbs back to EXHAUST_RECOVER.
const STAMINA_DRAIN = 0.55;
const STAMINA_REGEN = 0.4;
const STAMINA_DELAY = 24;       // frames before it starts refilling
const EXHAUST_RECOVER = 35;

// EXP to level up from this level (quadratic, not exponential):
// Lv1 70 · Lv10 790 · Lv20 2540 · Lv30 5290 · Lv40 9040 — about 8 to 26 same-level monsters per level
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
    this.statPoints = 10;     // starting points for STR/AGI/VIT/INT/DEX/LUK

    // Stat builder and skill tree (Ragnarok Online style) — see js/skills.js
    this.stats = { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 };
    this.skillLevels = {};
    this.skillPoints = 0;
    this.sk = {};             // combined skill effects (computed in recalc)
    this.aspd = 0;            // attack speed (0..0.5)
    this.dmgMult = 1;         // extra % damage from skills
    this.dmgReduce = 0;       // reduction of damage taken (0..0.5)
    this.regenTimer = 0;
    // Skill paths (js/skillpaths.js): play-style affinity, active skill slots (T/Y/U) and their cooldowns
    this.style = { str: 0, dex: 0, int: 0 };
    this.pathSlots = SLOT_KEYS.map(() => null);
    this.activeCd = {};
    this.wardT = 0;           // Unbreakable / Mana Shield: frames left
    this.wardPct = 0;         // share of damage they stop
    this.styleCheck = 0;
    this.styleNow = null;
    this.autoStat = "off";    // auto stat path: off | str | dex | int | style (js/skills.js autoAllocate)

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
    this.attack = 0;          // extra damage (stat points + equipment)
    this.crit = 0;            // critical chance (0..1)
    this.cdr = 0;             // cooldown reduction (0..0.5)

    // Stamina / pagod
    this.maxStamina = 100;
    this.stamina = this.maxStamina;
    this.exhausted = false;
    this.staminaDelay = 0;
    this.freshTimer = 0;      // Stamina Tonic: no fatigue while > 0
    this.atkT = 0;            // frames into the current attack pose (0 = none)
    this.atkMax = 0;
    this.atkAngle = 0;
    this.hurtT = 0;           // hurt recoil (counts down)
    this.hurtDir = 0;
    this.potionCd = 0;        // shared healing cooldown (frames) — healing is a decision, not a spam button
    this.bossFight = false;   // set by main.js while an Act boss is engaged

    // Bag and worn equipment (see js/items)
    this.bag = new Bag();
    // Quick slots (1–4), like Ragnarok's F-keys / Diablo II's belt
    this.belt = ["salve", "tonic", "panacea", "herb"];
    // Auto-potion: hp = HP percentage (0 = off); cure = auto-Panacea; stamina = auto-Tonic when tired
    this.autoPot = { hp: 0, cure: false, stamina: false };
    this.autoPotTimer = 0;

    this.facing = "right";
    this.dir = "down";        // down | up | side (for the 4-direction Avatar)
    this.state = "idle";
    this.animFrame = 0;
    this.animTimer = 0;
    this.aimAngle = 0;

    this.attackCooldownTimer = 0;
    this.skillCooldownTimer = 0;
    this.skill2CooldownTimer = 0;   // third skill (L)
    this.hitFlashTimer = 0;
    this.portalCooldown = 0;

    this.buffs = { damage: 0, atkSpeed: 0, moveSpeed: 0, invis: 0 };
    this.debuffs = Object.fromEntries(STATUS_KEYS.map((k) => [k, 0]));   // see js/status.js
    this.paralyzed = false;

    this.angels = [];

    // Sprint: hold Space, or tap it to lock (sprintLock). Dust at the feet.
    this.sprintLock = false;
    this.sprinting = false;
    this.dust = [];           // { x, y, life, max, r }
    this.rollGhosts = [];     // Dodge Roll trails (afterimages)

    // ========================================================
    // FALCON COMPANION INITIALIZATION FOR THE ARCHER
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

  // Total STR/AGI/… = base + equipment (affixes, cards) + skills
  totalStat(k) {
    return (this.stats[k] || 1) + (this.gearStats ? this.gearStats[k] || 0 : 0) + (this.sk[k] || 0);
  }

  // Recomputes everything: class base + level + STR/AGI/… + equipment + skills
  recalc() {
    const g = this.bag.stats();
    this.gearStats = g;
    const w = this.bag.equippedItem("weapon");
    this.weaponIcon = w ? w.icon : "knuckle";     // for the size modifier (js/elements.js)
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

  // Oblivion Mushroom: every stat back to 1 and every skill forgotten; all points are refunded
  respec() {
    Object.keys(this.stats).forEach((k) => {
      for (let v = 1; v < this.stats[k]; v++) this.statPoints += statCost(v);
      this.stats[k] = 1;
    });
    this.skillPoints += Object.values(this.skillLevels).reduce((n, lv) => n + lv, 0);
    this.skillLevels = {};
    this.pathSlots = SLOT_KEYS.map(() => null);
    this.recalc();
    this.hp = Math.min(this.hp, this.maxHp);
  }

  // Stat builder: raise STR/AGI/… (costs rise, as in Ragnarok)
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

  // Skill tree: raise a skill's level
  learnSkill(id) {
    const s = findSkill(id);
    if (!s || !canLearn(this, s)) return false;
    this.skillPoints--;
    this.skillLevels[id] = (this.skillLevels[id] || 0) + 1;
    slotNewActive(this, id);
    this.recalc();
    return true;
  }

  // source: the foe that hit (optional, for the bottom tray log)
  takeDamage(amount, fx, source = null) {
    if (this.hp <= 0) return;
    if (this.hitFlashTimer > 0) return;
    if (this.invulnTimer > 0) return;   // e.g. the Novice's Dodge Roll

    const guard = (this.guardTimer > 0 ? 0.65 : 1) * (this.mercGuard || 1)   // Bastion Forcefield (−35%) · Guardian Aura (−15%)
      * (this.wardT > 0 ? 1 - this.wardPct : 1);                             // Unbreakable / Mana Shield
    // DEF mitigates a share of each hit: DEF / (DEF + 20 + 4 × level). Flat subtraction made heavy gear
    // nearly immune and let the hero grow tankier every level; this keeps survival steady (~13–15 same-level hits).
    const mitigation = this.defense / (this.defense + 20 + 4 * this.level);
    const netDmg = Math.max(1, Math.round(amount * guard * (1 - (this.dmgReduce || 0)) * (1 - mitigation)));
    this.hp -= netDmg;
    this.hitFlashTimer = 16;
    this.hurtT = 12;
    noteStyle(this, "str", 0.3);   // standing your ground counts toward Might
    this.hurtDir = source && typeof source.x === "number" ? Math.sign(source.x - this.x) : 0;
    // A heavy blow (≥ 12% of max HP) stops the fight for a beat so you feel it
    if (fx && fx.hitStop && netDmg >= this.maxHp * 0.12) fx.hitStop(4);
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

  // A hit the hero landed (js/enemy.js damage): up close counts toward Might, from range toward Finesse;
  // casters' hits are counted when they cast instead
  noteHit(enemy, isCrit) {
    if (this.heroData.id === "mage" || this.heroData.id === "priest") return;
    const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
    noteStyle(this, d < 56 ? "str" : "dex", 0.6);
    if (isCrit) noteStyle(this, "dex", 0.3);
  }

  // Returns true when it takes hold (VIT/INT/LUK may resist, as in Ragnarok)
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
      // Ragnarok: more stat points at higher levels; 1 skill point per level
      this.statPoints += 3 + Math.floor(this.level / 5);
      this.skillPoints += 1;
      this.recalc();
      // A level-up restores a quarter of max HP (no longer a free full heal mid-fight)
      this.hp = Math.min(this.maxHp, this.hp + Math.round(this.maxHp * 0.25));
      if (Sound && Sound.playLevelUp) Sound.playLevelUp();
      if (this.onLevelUp) this.onLevelUp(this.level);
    }
    if (this.autoStat && this.autoStat !== "off" && this.statPoints > 0 && autoAllocate(this)) this.recalc();
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

  // Stamina per frame. wantSprint = Space held / sprint locked while moving
  updateStamina(wantSprint) {
    if (this.freshTimer > 0) this.freshTimer--;
    if (this.potionCd > 0) this.potionCd--;
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
    // Only target within the class's reach (e.g. arrows 220px, dagger 60px); beyond that, straight ahead
    const range = (this.heroData && this.heroData.range) || 200;
    if (closestEnemy && Math.hypot(closestEnemy.x - this.x, closestEnemy.y - this.y) > range) closestEnemy = null;
    this.target = closestEnemy;

    if (this.hitFlashTimer > 0) this.hitFlashTimer--;
    if (this.hurtT > 0) this.hurtT--;
    if (this.atkT > 0 && ++this.atkT >= this.atkMax) this.atkT = 0;
    // First Aid / Thirty-Six Hour Shift: HP every 3 seconds (blocked by poison and bleeding)
    if (this.sk.regen && this.hp < this.maxHp && !blocksRegen(this) && ++this.regenTimer >= 180) {
      this.regenTimer = 0;
      this.hp = Math.min(this.maxHp, this.hp + this.sk.regen);
    }
    if (this.portalCooldown > 0) this.portalCooldown--;
    if (this.invulnTimer > 0) this.invulnTimer--;
    // Once a second: a new resonant path changes which passives get the bonus
    if (++this.styleCheck >= 60) {
      this.styleCheck = 0;
      const style = styleOf(this);
      if (style !== this.styleNow) { this.styleNow = style; this.recalc(); }
    }

    for (const b in this.buffs) {
      if (this.buffs[b] > 0) this.buffs[b]--;
    }

    // Miasma blights: damage, paralysis (stun) and more (js/status.js)
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

    // Confusion: reversed controls · Stun: cannot move
    if (this.debuffs.confusion > 0) { vx = -vx; vy = -vy; }
    if (this.paralyzed) { vx = 0; vy = 0; }
    const moving = vx !== 0 || vy !== 0;
    // Stamina: only drains while actually running fast
    const wantSprint = moving && !this.isReloading && (isPressed("Space") || this.sprintLock);
    this.sprinting = this.updateStamina(wantSprint);
    if (moving && !this.isReloading) {
      const len = Math.hypot(vx, vy);
      const sprintMult = this.sprinting ? 1.6 : 1.0;
      // Dust behind the feet while running fast
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

    // Dodge Roll: an afterimage every 2 frames + dust at the start and end
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
      // No foe in reach: aim straight ahead (including up/down)
      this.aimAngle = this.dir === "up" ? -Math.PI / 2 : this.dir === "down" ? Math.PI / 2 : this.facing === "right" ? 0 : Math.PI;
    }

    // Key J (Attack / Reload)
    const caster = this.heroData.id === "mage" || this.heroData.id === "priest";
    if (isPressed("KeyJ") && this.attackCooldownTimer <= 0 && !isInSafeZone && !this.paralyzed && !(caster && this.debuffs.silence > 0)) {
      if (this.heroData && this.heroData.onAttack) {
        const ok = this.heroData.onAttack(this, closestEnemy, spawnProjectile);
        if (ok !== false) {
          if (caster) noteStyle(this, "int", 1);
          this.faceAim();
          this.state = "slash";
          this.animFrame = 0;
          this.startAttackPose(14);
          const rapid = this.buffs.atkSpeed > 0 ? 0.5 : 1.0;
          const chill = this.debuffs.freeze > 0 ? 1.5 : 1;   // Diablo: cold slows attacks
          this.attackCooldownTimer = Math.round((this.heroData.attackCooldown || 22) * rapid * chill * (1 - this.aspd) * (1 - this.cdr * 0.5));
        }
      }
    }

    // Key K (special skill: Falcon Strike for the Archer)
    if (isPressed("KeyK") && this.skillCooldownTimer <= 0 && !isInSafeZone && this.debuffs.silence <= 0 && !this.paralyzed) {
      if (this.heroData && this.heroData.onSkill) {
        const ok = this.heroData.onSkill(this, closestEnemy, spawnProjectile);
        if (ok !== false) {
          noteStyle(this, this.rollTimer ? "dex" : "int", 1);   // the Novice's K is a dodge roll
          // Job: face the target while casting (the Novice's Dodge Roll follows the movement)
          if (this.heroData.animMap) this.faceAim();
          this.state = "bash";
          this.animFrame = 0;
          if (!this.rollTimer) this.startAttackPose(20);
          this.skillCooldownTimer = Math.round((this.heroData.cooldown || 180) * Math.max(0.3, 1 - this.cdr - (this.sk.kcd || 0) / 100));
        }
      }
    }

    // Key L (the class's third skill)
    if (isPressed("KeyL") && this.skill2CooldownTimer <= 0 && !isInSafeZone && this.debuffs.silence <= 0 && !this.paralyzed) {
      if (this.heroData && this.heroData.onSkill2) {
        const ok = this.heroData.onSkill2(this, closestEnemy, spawnProjectile);
        if (ok !== false) {
          this.faceAim();
          this.state = "slash";
          this.animFrame = 0;
          this.startAttackPose(18);
          noteStyle(this, "int", 1);
          this.skill2CooldownTimer = Math.round((this.heroData.cooldown2 || 120) * Math.max(0.3, 1 - this.cdr - (this.sk.lcd || 0) / 100));
        }
      }
    }

    // Path actives on the skill slots (T / Y / U), plus their cooldowns, ward and dash
    tickActives(this, isPressed, { target: closestEnemy, spawn: spawnProjectile, fx, safe: isInSafeZone });

    this.animTimer++;
    const spriteObj = this.heroData ? this.heroData.sprites : null;
    const frames = (spriteObj && spriteObj[this.state]) || (spriteObj && spriteObj.idle) || [];

    // Faster steps while sprinting, to match the movement speed
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

  // Novice Dodge Roll: spins (left/right) or tumbles (up/down),
  // body tucked with a small hop. p = 0..1 (roll progress).
  drawRolling(ctx, avatar, x, y, p, flash) {
    const cx = x + 10, cy = y + 13;            // middle of the body
    const hop = Math.sin(p * Math.PI) * 3;     // slight lift
    ctx.save();
    ctx.translate(cx, cy - hop);
    if (this.dir === "side") {
      const sign = this.facing === "left" ? -1 : 1;
      ctx.rotate(sign * p * Math.PI * 2);
      ctx.scale(0.85, 0.85);                   // tucked
    } else {
      // Forward/backward tumble: squash the height so it looks like a flip
      const c = Math.cos(p * Math.PI * 2);
      ctx.scale(0.9, Math.sign(c || 1) * Math.max(0.2, Math.abs(c)) * 0.9);
    }
    avatar.draw(ctx, 0, 8, this.dir, "walk", Math.floor(p * 4) % 4, this.facing === "left", flash);
    ctx.restore();
  }

  // Begin the anticipation → strike → recover pose (and the swing trail for melee heroes)
  startAttackPose(frames) {
    this.atkT = 1;
    this.atkMax = frames;
    this.atkAngle = this.aimAngle;
  }

  isMelee() {
    return ((this.heroData && this.heroData.range) || 200) <= 60;
  }

  // Face the attack direction (for the 4-direction Avatar)
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

    // Modular Avatar (Novice and every job, from the Character Creator): feet at (x+10, y+21)
    const avatar = this.heroData && this.heroData.avatar;
    if (avatar) {
      const map = { run: this.sprinting ? "run" : "walk", slash: "attack", bash: "walk", ...(this.heroData.animMap || {}) };
      const anim = map[this.state] || "idle";
      const frame = anim === "idle" ? Math.floor(this.animFrame / 4) : this.animFrame;
      if (rolling) {
        const total = this.rollDuration || 14;
        const baseAlpha = ctx.globalAlpha;
        // Afterimages (older ones fainter)
        this.rollGhosts.forEach((g) => {
          ctx.globalAlpha = baseAlpha * (g.life / 10) * 0.28;
          this.drawRolling(ctx, avatar, g.x, g.y, 1 - g.t / total, false);
        });
        ctx.globalAlpha = baseAlpha;
        this.drawRolling(ctx, avatar, this.x, this.y, 1 - this.rollTimer / total, this.hitFlashTimer > 0);
        ctx.restore();
        return;
      }
      const p = this.atkT > 0 ? this.atkT / this.atkMax : 0;
      const pose = mix(
        hitPose(this.hurtT, 12, this.hurtDir),
        attackPose(p, Math.cos(this.atkAngle), Math.sin(this.atkAngle), this.isMelee() ? 3 : 1.5),
        anim === "idle" && !p ? breathPose(this.idleTick = (this.idleTick || 0) + 1) : null
      );
      around(ctx, this.x + 10, this.y + 21, pose, () =>
        avatar.draw(ctx, this.x + 10, this.y + 21, this.dir, anim, frame, this.facing === "left", this.hitFlashTimer > 0));
      // Melee: a crescent follows the blade through the strike
      if (p && this.isMelee()) drawSwing(ctx, this.x + 10, this.y + 12, this.atkAngle, 13, (p - 0.3) / 0.7, "#e2e8f0");
    }
    ctx.restore();
  }
}