import { FalconSprite } from "../avatar/creature.js";

// Iisang sprite para sa lahat ng falcon (naka-cache ang mga frame)
const SPRITE = new FalconSprite();

export class FalconCompanion {
  constructor(ownerX, ownerY) {
    this.x = ownerX - 22;
    this.y = ownerY - 18;
    this.vx = 0;              // aktwal na galaw bawat frame (para sa direksyon at pagsisid)
    this.vy = 0;
    this.wingTimer = 0;
    this.state = "HOVERING"; // HOVERING, ATTACKING, RETURNING, TAUNTING
    this.stateTimer = 0;

    // Taunt timer (mag-ra-random taunt tuwing ~7-10 segundo kapag nakatigil)
    this.tauntCooldown = 420 + Math.floor(Math.random() * 240);

    this.target = null;
    this.targetX = 0;
    this.targetY = 0;
    this.speed = 6.8;
    this.damageDealt = false;
  }

  triggerStrike(target, targetX, targetY) {
    this.state = "ATTACKING";
    this.target = target;
    this.targetX = targetX;
    this.targetY = targetY;
    this.damageDealt = false;
  }

  update(player, enemyManager, fx, lootManager) {
    const ox = this.x, oy = this.y;
    this.step(player, enemyManager, fx, lootManager);
    this.vx = this.x - ox;
    this.vy = this.y - oy;
  }

  step(player, enemyManager, fx, lootManager) {
    this.wingTimer++;
    this.stateTimer++;

    // 1. ATTACKING / DIVE STANCE
    if (this.state === "ATTACKING") {
      const destX = this.target && this.target.isAlive ? this.target.x + 10 : this.targetX;
      const destY = this.target && this.target.isAlive ? this.target.y + 10 : this.targetY;
      const dx = destX - this.x;
      const dy = destY - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 10) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      } else {
        if (!this.damageDealt) {
          this.damageDealt = true;
          if (this.target && this.target.isAlive) {
            enemyManager.damage(this.target, 38, Math.atan2(dy, dx), true, fx, lootManager, 14, false, player, "wind");
            if (fx && fx.spawnHitSparks) fx.spawnHitSparks(this.x + 12, this.y + 12, "#ffd166", 16);
          }
        }
        this.state = "RETURNING";
      }
      return;
    }

    // 2. RETURNING TO ARCHER
    if (this.state === "RETURNING") {
      const returnX = player.x + (player.facing === "right" ? -22 : 28);
      const returnY = player.y - 18;
      const rdx = returnX - this.x;
      const rdy = returnY - this.y;
      const rDist = Math.hypot(rdx, rdy);

      if (rDist > 10) {
        this.x += (rdx / rDist) * (this.speed * 1.3);
        this.y += (rdy / rDist) * (this.speed * 1.3);
      } else {
        this.state = "HOVERING";
      }
      return;
    }

    // 3. RANDOM TAUNT ANIMATION (Screech & Talon Flex)
    if (this.state === "TAUNTING") {
      if (this.stateTimer > 75) { // 1.25 seconds taunt
        this.state = "HOVERING";
        this.tauntCooldown = 450 + Math.floor(Math.random() * 300);
      }
      return;
    }

    // 4. IDLE HOVERING SA BALIKAT
    const hoverX = player.x + (player.facing === "right" ? -22 : 28);
    const hoverY = player.y - 18 + Math.sin(Date.now() / 200) * 4;
    this.x += (hoverX - this.x) * 0.14;
    this.y += (hoverY - this.y) * 0.14;

    // Check Random Taunt
    this.tauntCooldown--;
    if (this.tauntCooldown <= 0 && player.state === "idle") {
      this.state = "TAUNTING";
      this.stateTimer = 0;
      if (fx && fx.spawnDamagePopup) {
        fx.spawnDamagePopup(this.x + 8, this.y - 8, "SCREECH! 🦅", false, "#fcd168");
      }
    }
  }

  // facingRight = direksyon ng player; ginagamit kapag halos nakatigil ang falcon
  draw(ctx, facingRight) {
    const cx = Math.floor(this.x) + 16;
    const cy = Math.floor(this.y) + 14;

    // Anino sa lupa
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.beginPath();
    ctx.ellipse(cx, Math.floor(this.y) + 36, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Humarap sa direksyon ng lipad; kapag nakalutang, sa direksyon ng player
    const flying = Math.abs(this.vx) > 0.35;
    const left = flying ? this.vx < 0 : !facingRight;

    if (this.state === "ATTACKING") {
      // Pagsisid: nakaturo ang tuka sa direksyon ng galaw
      const rot = left ? Math.atan2(-this.vy, -this.vx) : Math.atan2(this.vy, this.vx);
      SPRITE.draw(ctx, cx, cy, "side", "dive", 0, left, false, 1, rot);
    } else if (this.state === "TAUNTING") {
      SPRITE.draw(ctx, cx, cy, "side", "taunt", Math.floor(this.stateTimer / 10), left);
    } else {
      // Mas mabilis ang pagaspas kapag bumabalik nang mabilis
      const rate = this.state === "RETURNING" ? 3 : 5;
      SPRITE.draw(ctx, cx, cy, "side", "fly", Math.floor(this.wingTimer / rate), left);
    }
  }
}
