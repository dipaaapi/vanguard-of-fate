import { Sound } from "./audio.js";

// Centre and extra hitbox size of an enemy (a boss's body is bigger and taller)
const cx = (e) => e.x + 12;
const cy = (e) => e.y + 12 - (e.hitUp || 0);
const hr = (e) => e.hitR || 0;

// Farthest reach of flying attacks (player, mercenary): they no longer cross the whole map
const RANGE = { arrow: 220, force_sphere: 170 };

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
            Sound.playMeteorExplosion(p.targetX, p.targetY);
            if (fx) {
              fx.addScreenShake(6);
              fx.spawnHitSparks(p.targetX, p.targetY, "#ff5500", 18);
              // BURN EFFECT: glowing fire and smoke at ground zero
              fx.spawnBurnFlames(p.targetX, p.targetY, p.maxExplosionRadius, 16);
            }
          }
        } else {
          p.explosionRadius += 2.0;

          if (!p.damageDealt) {
            enemies.forEach((e) => {
              if (e.isAlive) {
                const dist = Math.hypot(cx(e) - p.targetX, cy(e) - p.targetY) - hr(e);
                if (dist <= p.maxExplosionRadius) {
                  const pushAngle = Math.atan2(e.y + 12 - p.targetY, e.x + 12 - p.targetX);
                  enemyManager.damage(e, 42, pushAngle, true, fx, lootManager, 16, false, player, "fire");
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
          Sound.playThunder(p.centerX, p.centerY);

          const activeFoes = enemies.filter((e) => e.isAlive && Math.hypot(cx(e) - p.centerX, cy(e) - p.centerY) - hr(e) <= p.radius);
          if (activeFoes.length > 0) {
            const hitEnemy = activeFoes[Math.floor(Math.random() * activeFoes.length)];
            const strikeAngle = Math.random() * Math.PI * 2;
            enemyManager.damage(hitEnemy, 12, strikeAngle, false, fx, lootManager, 8, false, player, "wind");

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
      // 5. Dagger Slash (Novice J): a short arc, hits each foe once
      else if (p.type === "dagger_slash") {
        for (let e of enemies) {
          if (e.isAlive && !p.hit.has(e) && Math.hypot(cx(e) - p.x, cy(e) - p.y) <= p.radius + 8 + hr(e)) {
            p.hit.add(e);
            enemyManager.damage(e, p.damage, p.angle, false, fx, lootManager, 6, false, player);
          }
        }
        p.life--;
        if (p.life <= 0) {
          this.projectiles.splice(i, 1);
          continue;
        }
      }
      // 6. Shockwave (Knight J: Bastion Forcefield) — a growing ring, one hit per foe
      else if (p.type === "shockwave") {
        p.r += p.grow || 3;
        for (let e of enemies) {
          if (e.isAlive && !p.hit.has(e) && Math.hypot(cx(e) - p.x, cy(e) - p.y) <= p.r + hr(e)) {
            p.hit.add(e);
            if (!p.damage) continue;                       // visual only
            if (p.stun && !e.boss) e.stunTimer = Math.max(e.stunTimer, p.stun);
            enemyManager.damage(e, p.damage, Math.atan2(cy(e) - p.y, cx(e) - p.x), false, fx, lootManager, p.push || 12, false, player, p.elem || null);
          }
        }
        if (p.r >= p.max) {
          this.projectiles.splice(i, 1);
          continue;
        }
      }
      // 8. Bolt (Throw Stone, Holy Light, Frost Diver, path actives) — a flying shot with an element; crit: always critical
      else if (p.type === "bolt") {
        p.x += p.vx;
        p.y += p.vy;
        p.travel = (p.travel || 0) + Math.hypot(p.vx, p.vy);
        let hit = false;
        for (let e of enemies) {
          if (e.isAlive && Math.hypot(cx(e) - p.x, cy(e) - p.y) <= 12 + hr(e)) {
            hit = true;
            enemyManager.damage(e, p.crit ? Math.round(p.damage * 1.8) : p.damage, Math.atan2(p.vy, p.vx), Boolean(p.crit), fx, lootManager, 6, false, player, p.elem);
            if (p.freeze && !e.boss) { e.stunTimer = Math.max(e.stunTimer, p.freeze); e.frozen = p.freeze; }
            if (fx) fx.spawnHitSparks(cx(e), cy(e), p.color, 10);
            break;
          }
        }
        if (hit || p.travel > (p.range || 200)) {
          this.projectiles.splice(i, 1);
          continue;
        }
      }
      // 9. Rain (Arrow Shower) — several waves of hits on one spot
      else if (p.type === "rain") {
        p.timer++;
        if (p.timer % p.every === 1) {
          enemies.forEach((e) => {
            if (e.isAlive && Math.hypot(cx(e) - p.x, cy(e) - p.y) <= p.radius + hr(e)) {
              enemyManager.damage(e, p.damage, Math.PI / 2, false, fx, lootManager, 2, false, player, p.elem);
            }
          });
          p.waves--;
        }
        if (p.waves <= 0 && p.timer % p.every > 8) {
          this.projectiles.splice(i, 1);
          continue;
        }
      }
      // 7. Follow (Knight K: Lance Charge, Fighter K: Flying Dropkick) — a hitbox that moves with the hero
      else if (p.type === "follow") {
        const o = p.owner;
        p.x = o.x + 10 + Math.cos(p.angle) * (p.offset || 14);
        p.y = o.y + 12 + Math.sin(p.angle) * (p.offset || 14);
        for (let e of enemies) {
          if (e.isAlive && !p.hit.has(e) && Math.hypot(cx(e) - p.x, cy(e) - p.y) <= p.radius + hr(e)) {
            p.hit.add(e);
            const bonus = p.markBonus && e.isMarkedCritical ? p.markBonus : 1;   // Fighter: bonus against a marked foe
            enemyManager.damage(e, Math.round(p.damage * bonus), p.angle, bonus > 1, fx, lootManager, p.push || 16, false, player, p.elem || null);
            if (bonus > 1) e.isMarkedCritical = false;
            if (fx) fx.spawnHitSparks(cx(e), cy(e), p.color || "#ffd166", 10);
          }
        }
        p.life--;
        if (p.life <= 0) {
          this.projectiles.splice(i, 1);
          continue;
        }
      }
      // 4. Force Sphere (Fighter J) & Arrows (Archer J)
      else if (p.type === "force_sphere" || p.type === "arrow") {
        p.x += p.vx;
        p.y += p.vy;
        p.travel = (p.travel || 0) + Math.hypot(p.vx, p.vy);

        let hit = false;
        for (let e of enemies) {
          if (e.isAlive && Math.hypot(cx(e) - p.x, cy(e) - p.y) <= 18 + hr(e)) {
            hit = true;
            const hitAngle = Math.atan2(p.vy, p.vx);

            if (p.type === "force_sphere") {
              // TARGET LOCKED EFFECT
              e.isMarkedCritical = true;
              if (p.merc) enemyManager.damage(e, Math.round((p.damage || 22) * p.power), hitAngle, false, fx, lootManager, 10, false, null, "ghost");
              else enemyManager.damage(e, 22, hitAngle, false, fx, lootManager, 10, false, player, "ghost");
              if (fx) {
                fx.spawnDamagePopup(e.x + 12, e.y - 12, "TARGET LOCKED!", true);
                fx.spawnHitSparks(e.x + 12, e.y + 12, "#ff0055", 10);
              }
            } else if (p.type === "arrow") {
              const isStun = Math.random() < 0.28;
              const pushDist = Math.random() < 0.4 ? 18 : 8;

              if (isStun && !e.boss) {
                e.isStunned = true;
                e.stunTimer = 75; // Concussive stun duration
              }

              if (p.merc) enemyManager.damage(e, Math.round((p.damage || 22) * p.power), hitAngle, false, fx, lootManager, pushDist, isStun, null);
              else enemyManager.damage(e, p.damage || 22, hitAngle, false, fx, lootManager, pushDist, isStun, player);   // the kit's arrow damage (was a fixed 22)
            }
            break;
          }
        }

        const outOfRange = p.travel > (p.range || RANGE[p.type] || 220);
        if (hit || outOfRange || p.x < 0 || p.x > this.worldWidth || p.y < 0 || p.y > this.worldHeight) {
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
      } else if (p.type === "dagger_slash") {
        ctx.globalAlpha = Math.max(0, p.life / 8);
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x - Math.cos(p.angle) * 6, p.y - Math.sin(p.angle) * 6, p.radius, p.angle - 0.9, p.angle + 0.9);
        ctx.stroke();
      } else if (p.type === "shockwave") {
        ctx.globalAlpha = Math.max(0, 1 - p.r / p.max);
        ctx.strokeStyle = p.color || "#5ee7ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.7, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === "bolt") {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(Math.round(p.x - 1), Math.round(p.y - 1), 2, 2);
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
        ctx.stroke();
      } else if (p.type === "rain") {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius, p.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.8;
        for (let k = 0; k < 10; k++) {
          const ax = p.x + Math.cos(k * 2.4 + p.timer) * p.radius * 0.8 * ((k % 3) / 3 + 0.3);
          const ay = p.y + Math.sin(k * 1.7 + p.timer) * p.radius * 0.5 * ((k % 3) / 3 + 0.3);
          const fall = (p.timer * 4 + k * 7) % 20;
          ctx.beginPath();
          ctx.moveTo(ax, ay - 20 + fall);
          ctx.lineTo(ax + 1, ay - 14 + fall);
          ctx.stroke();
        }
      } else if (p.type === "follow") {
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = p.color || "#ffd166";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 0.7, p.angle - 1, p.angle + 1);
        ctx.stroke();
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