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

  update(enemies, enemyManager, fx, lootManager, player, questManager = null) {
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
                  enemyManager.damage(e, 42, pushAngle, true, fx, lootManager, 16, false, player, questManager);
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
            enemyManager.damage(hitEnemy, 18, strikeAngle, false, fx, lootManager, 8, false, player, questManager);

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
              enemyManager.damage(e, 14, hitAngle, false, fx, lootManager, 10, false, player, questManager);
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

              enemyManager.damage(e, 22, hitAngle, false, fx, lootManager, pushDist, isStun, player, questManager);
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
          // Blazing Fireball & Smoke Trail
          const smokeGrad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 16);
          smokeGrad.addColorStop(0, "rgba(255, 200, 50, 0.9)");
          smokeGrad.addColorStop(0.4, "rgba(255, 80, 0, 0.6)");
          smokeGrad.addColorStop(1, "rgba(50, 20, 10, 0)");
          ctx.fillStyle = smokeGrad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
          ctx.fill();

          // Magma Core
          ctx.fillStyle = "#ffcc00";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(p.x - 1, p.y - 1, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Massive Scorching Shockwave Ring
          const alpha = Math.max(0, 1 - (p.explosionRadius / p.maxExplosionRadius));
          ctx.strokeStyle = `rgba(255, 85, 0, ${alpha})`;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(p.targetX, p.targetY, p.explosionRadius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = `rgba(255, 220, 100, ${alpha * 0.8})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.targetX, p.targetY, Math.max(2, p.explosionRadius - 4), 0, Math.PI * 2);
          ctx.stroke();

          // Core ground scorch glow
          ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.4})`;
          ctx.beginPath();
          ctx.arc(p.targetX, p.targetY, p.explosionRadius * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (p.type === "thunderstorm") {
        // Atmospheric Cloud Vortex
        const stormGrad = ctx.createRadialGradient(p.centerX, p.centerY, 10, p.centerX, p.centerY, p.radius);
        stormGrad.addColorStop(0, "rgba(10, 25, 50, 0.45)");
        stormGrad.addColorStop(0.7, "rgba(0, 240, 255, 0.15)");
        stormGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = stormGrad;
        ctx.beginPath();
        ctx.arc(p.centerX, p.centerY, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.centerX, p.centerY, p.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Multi-segmented Branching Electric Lightning Bolts
        p.activeBolts.forEach((b) => {
          ctx.strokeStyle = "#00f0ff";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(b.x - 8, b.y - 45);
          ctx.lineTo(b.x + 4, b.y - 28);
          ctx.lineTo(b.x - 3, b.y - 14);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(b.x - 8, b.y - 45);
          ctx.lineTo(b.x + 4, b.y - 28);
          ctx.lineTo(b.x - 3, b.y - 14);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          // Ground electric impact sparks
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(b.x - 4, b.y - 2, 8, 3);
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(b.x - 6, b.y - 1, 12, 1);
        });
      } else if (p.type === "holy_burst") {
        const rad = Math.max(1, p.radius);
        const alpha = Math.max(0, p.alpha);

        // Radiant Sacred Mandala Ring
        ctx.strokeStyle = `rgba(255, 209, 102, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, rad - 3), 0, Math.PI * 2);
        ctx.stroke();

        // Radiating 4-Point Star Rays
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.fillRect(p.x - 1, p.y - rad, 2, rad * 2);
        ctx.fillRect(p.x - rad, p.y - 1, rad * 2, 2);
      } else if (p.type === "force_sphere") {
        // Ki Aura Outer Glow
        const kiGrad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 9);
        kiGrad.addColorStop(0, "#ffffff");
        kiGrad.addColorStop(0.4, "#00f0ff");
        kiGrad.addColorStop(0.8, "rgba(0, 119, 182, 0.6)");
        kiGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = kiGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.fill();

        // High-Energy Core
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Speed Streak Trail
        ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
        ctx.stroke();
      } else if (p.type === "arrow") {
        const ang = p.angle || Math.atan2(p.vy, p.vx);
        ctx.translate(p.x, p.y);
        ctx.rotate(ang);

        // Motion Streak
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(0, 0);
        ctx.stroke();

        // Wooden Shaft
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(-8, -1, 10, 2);

        // Fletching Feathers (White/Cyan)
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(-10, -2.5, 3, 5);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(-8, -1.5, 2, 3);

        // Razor Broadhead Steel Tip
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(1, -2.5);
        ctx.lineTo(1, 2.5);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === "magic_missile") {
        ctx.fillStyle = "#a855f7";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }
}