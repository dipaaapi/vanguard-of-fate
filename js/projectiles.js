import { Sound } from "./audio.js";

export class ProjectileManager {
  constructor(worldWidth = 1280, worldHeight = 960) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.projectiles = [];
  }

  add(proj) {
    if (proj) this.projectiles.push(proj);
  }

  clear() {
    this.projectiles = [];
  }

  update(enemies, enemyManager, fx, lootManager, player) {
    if (!enemies || !enemyManager) return;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      // 1. Meteor Logic (Mage J + BURN EFFECT)
      if (p.type === "meteor") {
        if (!p.exploded) {
          p.x += p.speedX;
          p.y += p.speedY;

          if (p.y >= p.targetY) {
            p.exploded = true;
            Sound.playMeteorExplosion();
            if (fx) {
              fx.addScreenShake(6);
              fx.spawnHitSparks(p.targetX, p.targetY, "#ff5500", 18);
              // BURN EFFECT: Nagbabagang apoy at usok sa ground zero
              fx.spawnBurnFlames(p.targetX, p.targetY, p.maxExplosionRadius, 16);
            }
          }
        } else {
          p.explosionRadius += 2.0;

          if (!p.damageDealt) {
            enemies.forEach((e) => {
              if (e.isAlive) {
                const dist = Math.hypot(e.x + 12 - p.targetX, e.y + 12 - p.targetY);
                if (dist <= p.maxExplosionRadius) {
                  const pushAngle = Math.atan2(e.y + 12 - p.targetY, e.x + 12 - p.targetX);
                  enemyManager.damage(e, 42, pushAngle, true, fx, lootManager, 16, false, player);
                  if (fx) fx.spawnBurnFlames(e.x + 12, e.y + 12, 12, 6);
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
      // 2. Thunderstorm Logic (Mage K)
      else if (p.type === "thunderstorm") {
        p.duration--;
        p.strikeTimer++;

        if (p.strikeTimer >= p.strikeInterval) {
          p.strikeTimer = 0;
          Sound.playThunder();

          const activeFoes = enemies.filter((e) => e.isAlive && Math.hypot(e.x + 12 - p.centerX, e.y + 12 - p.centerY) <= p.radius);
          if (activeFoes.length > 0) {
            const hitEnemy = activeFoes[Math.floor(Math.random() * activeFoes.length)];
            const strikeAngle = Math.random() * Math.PI * 2;
            enemyManager.damage(hitEnemy, 18, strikeAngle, false, fx, lootManager, 8, false, player);

            p.activeBolts.push({
              x: hitEnemy.x + 12,
              y: hitEnemy.y + 12,
              life: 10
            });
          }
        }

        for (let b = p.activeBolts.length - 1; b >= 0; b--) {
          p.activeBolts[b].life--;
          if (p.activeBolts[b].life <= 0) p.activeBolts.splice(b, 1);
        }

        if (p.duration <= 0) {
          this.projectiles.splice(i, 1);
          continue;
        }
      }
      // 3. Holy Burst Ring
      else if (p.type === "holy_burst") {
        p.radius += 1.6;
        p.alpha -= 0.04;
        if (p.radius >= p.maxRadius || p.alpha <= 0) {
          this.projectiles.splice(i, 1);
          continue;
        }
      }
      // 4. Force Sphere (Fighter J) & Arrows (Archer J)
      else if (p.type === "force_sphere" || p.type === "arrow") {
        p.x += p.vx;
        p.y += p.vy;

        let hit = false;
        for (let e of enemies) {
          if (e.isAlive && Math.hypot(e.x + 12 - p.x, e.y + 12 - p.y) <= 18) {
            hit = true;
            const hitAngle = Math.atan2(p.vy, p.vx);

            if (p.type === "force_sphere") {
              // TARGET LOCKED EFFECT
              e.isMarkedCritical = true;
              enemyManager.damage(e, 14, hitAngle, false, fx, lootManager, 10, false, player);
              if (fx) {
                fx.spawnDamagePopup(e.x + 12, e.y - 12, "TARGET LOCKED!", true);
                fx.spawnHitSparks(e.x + 12, e.y + 12, "#ff0055", 10);
              }
            } else if (p.type === "arrow") {
              const isStun = Math.random() < 0.28;
              const pushDist = Math.random() < 0.4 ? 18 : 8;

              if (isStun) {
                e.isStunned = true;
                e.stunTimer = 75; // Concussive stun duration
              }

              enemyManager.damage(e, 22, hitAngle, false, fx, lootManager, pushDist, isStun, player);
            }
            break;
          }
        }

        if (hit || p.x < 0 || p.x > this.worldWidth || p.y < 0 || p.y > this.worldHeight) {
          this.projectiles.splice(i, 1);
          continue;
        }
      }
    }
  }

  draw(ctx) {
    this.projectiles.forEach((p) => {
      ctx.save();
      if (p.type === "meteor") {
        if (!p.exploded) {
          ctx.fillStyle = "#ff7700";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = "#ff3300";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(p.targetX, p.targetY, p.explosionRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (p.type === "thunderstorm") {
        ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.centerX, p.centerY, p.radius, 0, Math.PI * 2);
        ctx.stroke();

        p.activeBolts.forEach((b) => {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(b.x - 4, b.y - 30);
          ctx.lineTo(b.x + 2, b.y - 15);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        });
      } else if (p.type === "holy_burst") {
        ctx.strokeStyle = p.color || "#ffd166";
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === "force_sphere") {
        ctx.fillStyle = "#00f0ff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "arrow") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(p.x, p.y, 6, 2);
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(p.x - 2, p.y, 2, 2);
      }
      ctx.restore();
    });
  }
}