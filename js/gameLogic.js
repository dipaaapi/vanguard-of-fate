import { Sound } from "./audio.js";

export class GameEngine {
  constructor(stage, camera, fx, enemyManager, projectileManager, lootManager) {
    this.stage = stage;
    this.camera = camera;
    this.fx = fx;
    this.enemyManager = enemyManager;
    this.projectileManager = projectileManager;
    this.lootManager = lootManager;
    this.barracksHealTick = 0;
  }

  update(player, controller, onGameOver, config = { weather: true }, isShopOpen = false) {
    if (!player) return;

    // 1. Camera & Weather
    this.camera.update(player.x, player.y);
    if (this.fx && this.fx.updateEnvironment) {
      this.fx.updateEnvironment(config.weather);
    }

    const isInBarracks = this.stage && this.stage.isInsideSafeZone ? this.stage.isInsideSafeZone(player.x, player.y) : false;

    // 2. Enemies & Loots
    if (this.enemyManager) {
      this.enemyManager.update(player, this.camera, this.fx);
    }
    if (this.lootManager) {
      this.lootManager.update(player, this.fx);
    }

    if (player.hp <= 0) {
      if (onGameOver) onGameOver();
      return;
    }

    // 3. Safe Zone Healing
    if (isInBarracks) {
      this.barracksHealTick++;
      if (this.barracksHealTick >= 30) {
        this.barracksHealTick = 0;
        if (player.hp < player.maxHp) {
          player.hp = Math.min(player.maxHp, player.hp + Math.max(2, Math.round(player.maxHp * 0.05)));
          if (this.fx) {
            this.fx.spawnDamagePopup(player.x + 12, player.y - 8, "+HP", true);
            this.fx.spawnHitSparks(player.x + 12, player.y + 12, "#38b000", 3);
          }
        }
      }
    } else {
      this.barracksHealTick = 0;
    }

    // 4. Safe Zone Monster Repulsion
    if (this.stage && this.stage.safeZone && this.enemyManager) {
      const sz = this.stage.safeZone;
      this.enemyManager.enemies.forEach((e) => {
        if (e.isAlive && this.stage.isInsideSafeZone(e.x, e.y)) {
          const cx = sz.x + sz.w / 2;
          const cy = sz.y + sz.h / 2;
          const angle = Math.atan2(e.y + 12 - cy, e.x + 12 - cx);
          e.x = cx + Math.cos(angle) * (sz.w / 2 + 18);
          e.y = cy + Math.sin(angle) * (sz.h / 2 + 18);
          e.actionState = "CHASING";
        }
      });
    }

    // 5. Controls & Movement Lock
    if (isShopOpen) {
      player.isMoving = false;
      player.isSprinting = false;
      player.state = "idle";
    } else {
      const closestEnemy = this.enemyManager ? this.enemyManager.getClosest(player.x, player.y) : null;
      const dmgMultiplier = player.buffs && player.buffs.damage > 0 ? 1.75 : 1.0;

      // Update Player
      player.update(
        controller,
        this.stage ? this.stage.bounds : { minX: 32, maxX: 1200, minY: 32, maxY: 900 },
        closestEnemy,
        (proj) => {
          if (this.projectileManager) this.projectileManager.add(proj);
        },
        (critDmg, isCrit) => {
          if (closestEnemy && closestEnemy.isAlive && !isInBarracks && this.enemyManager) {
            const hitAngle = Math.atan2(closestEnemy.y + 12 - (player.y + 12), closestEnemy.x + 12 - (player.x + 12));
            const totalDmg = Math.round(((critDmg || 20) + (player.bonusDamage || 0)) * dmgMultiplier);
            this.enemyManager.damage(closestEnemy, totalDmg, hitAngle, isCrit, this.fx, this.lootManager, 14, false, player);
            closestEnemy.isMarkedCritical = false;
          }
        },
        (detonateX, detonateY, radius, baseDamage) => {
          if (isInBarracks || !this.enemyManager) return;
          this.enemyManager.enemies.forEach((e) => {
            if (e.isAlive) {
              const dist = Math.hypot(e.x + 12 - detonateX, e.y + 12 - detonateY);
              if (dist <= radius) {
                const pushAngle = Math.atan2(e.y + 12 - detonateY, e.x + 12 - detonateX);
                const totalDmg = Math.round((baseDamage + (player.bonusDamage || 0)) * dmgMultiplier);
                this.enemyManager.damage(e, totalDmg, pushAngle, true, this.fx, this.lootManager, 20, false, player);
              }
            }
          });
        },
        isInBarracks,
        this.fx
      );

      // Knight Lance Charge Pierce Contact
      if (player.isChargingLance && !isInBarracks && this.enemyManager) {
        this.enemyManager.enemies.forEach((e) => {
          if (e.isAlive && !player.piercedEnemies.has(e.id)) {
            const dist = Math.hypot(e.x + 12 - (player.x + 12), e.y + 12 - (player.y + 12));
            if (dist < 26) {
              player.piercedEnemies.add(e.id);
              const pushAngle = Math.atan2(player.chargeVy, player.chargeVx);
              const totalDmg = Math.round((55 + (player.bonusDamage || 0)) * dmgMultiplier);
              this.enemyManager.damage(e, totalDmg, pushAngle, true, this.fx, this.lootManager, 18, false, player);
              Sound.playCriticalHit();
              if (this.fx) {
                this.fx.addScreenShake(5);
                this.fx.spawnDamagePopup(e.x + 12, e.y - 8, `PIERCE ${totalDmg}!`, true);
                this.fx.spawnHitSparks(e.x + 12, e.y + 12, "#ffd166", 10);
              }
            }
          }
        });
      }

      // Portal Warping
      if (player.portalCooldown > 0) {
        player.portalCooldown--;
      } else if (this.stage && this.stage.checkPortalWarp) {
        this.stage.checkPortalWarp(player, (portal) => {
          Sound.playDash();
          if (this.fx) {
            this.fx.spawnHitSparks(player.x + 12, player.y + 12, portal.color || "#00f0ff", 16);
            this.fx.spawnDamagePopup(player.x + 12, player.y - 10, "WARPED!", true);
          }
        });
      }

      // ==================== ARCHER FALCON COMPANION AI ====================
      if (player.falcon) {
        const f = player.falcon;
        f.wingTimer = (f.wingTimer + 1) % 12;

        const homeX = player.x + (player.facing === "right" ? -14 : 22);
        const homeY = player.y - 12;

        if (f.state === "HOVERING") {
          // Lumulutang sa tabi ng Archer
          f.x += (homeX - f.x) * 0.15;
          f.y += (homeY - f.y) * 0.15;
        } else if (f.state === "STRIKING") {
          // Lumilipad patungo sa kalaban
          const destX = f.target && f.target.isAlive ? f.target.x + 12 : f.targetX;
          const destY = f.target && f.target.isAlive ? f.target.y + 12 : f.targetY;
          const dx = destX - f.x;
          const dy = destY - f.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 10) {
            f.x += (dx / dist) * f.speed;
            f.y += (dy / dist) * f.speed;
          } else {
            // Tumama na ang Falcon Strike
            if (!f.damageDealt && f.target && f.target.isAlive && this.enemyManager) {
              const talonDmg = Math.round(34 * dmgMultiplier);
              this.enemyManager.damage(f.target, talonDmg, Math.atan2(dy, dx), true, this.fx, this.lootManager, 14, false, player);
              f.damageDealt = true;
              if (this.fx) {
                this.fx.spawnHitSparks(f.target.x + 12, f.target.y + 12, "#ffd166", 10);
                this.fx.spawnDamagePopup(f.target.x + 12, f.target.y - 8, `TALON ${talonDmg}!`, true);
              }
            }
            f.state = "RETURNING";
          }
        } else if (f.state === "RETURNING") {
          // Lilipad pabalik sa balikat ng Archer
          const dx = homeX - f.x;
          const dy = homeY - f.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 8) {
            f.x += (dx / dist) * (f.speed * 1.15);
            f.y += (dy / dist) * (f.speed * 1.15);
          } else {
            f.state = "HOVERING";
          }
        }
      }

      // Guardian Angels AI
      if (player.angels && player.angels.length > 0) {
        player.angels.forEach((angel, idx) => {
          if (!angel.isAlive) return;

          angel.lifespan--;
          if (angel.lifespan <= 0 || angel.hp <= 0) {
            angel.isAlive = false;
            if (this.fx) this.fx.spawnHitSparks(angel.x + 12, angel.y + 12, "#ffd166", 8);
            return;
          }

          angel.bobTimer += 0.08;
          angel.animTimer++;
          if (angel.animTimer >= 18) {
            angel.animTimer = 0;
            angel.animFrame = (angel.animFrame + 1) % 2;
          }

          if (angel.hitTimer > 0) angel.hitTimer--;
          if (angel.attackCooldown > 0) angel.attackCooldown--;

          const flankX = player.x + (idx === 0 ? -26 : 26);
          const flankY = player.y - 14 + Math.sin(angel.bobTimer) * 4;

          let target = null;
          if (this.enemyManager && !isInBarracks) {
            target = this.enemyManager.getClosest(angel.x, angel.y, 140);
            if (target && this.stage && this.stage.isInsideSafeZone(target.x, target.y)) {
              target = null;
            }
          }

          if (target && target.isAlive) {
            const tX = target.x + 12;
            const tY = target.y + 12;
            const dx = tX - (angel.x + 12);
            const dy = tY - (angel.y + 12);
            const dist = Math.hypot(dx, dy);

            if (dist > 18) {
              angel.x += (dx / dist) * 1.65;
              angel.y += (dy / dist) * 1.65;
            } else if (angel.attackCooldown === 0) {
              angel.attackCooldown = 50;
              Sound.playSlash();
              const hitAngle = Math.atan2(dy, dx);
              const angelDmg = Math.round(angel.damage * dmgMultiplier);

              this.enemyManager.damage(target, angelDmg, hitAngle, false, this.fx, this.lootManager, 14, false, player);
              if (this.fx) {
                this.fx.spawnHitSparks(target.x + 12, target.y + 12, "#ffd166", 8);
                this.fx.spawnDamagePopup(target.x + 12, target.y - 8, `SLASH ${angelDmg}`, false);
              }
            }
          } else {
            angel.x += (flankX - angel.x) * 0.12;
            angel.y += (flankY - angel.y) * 0.12;
          }
        });

        player.angels = player.angels.filter((a) => a.isAlive);
      }
    }

    // 6. Projectiles Update
    if (this.projectileManager && this.enemyManager) {
      this.projectileManager.update(this.enemyManager.enemies, this.enemyManager, this.fx, this.lootManager, player);
    }
  }
}