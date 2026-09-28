import { FalconSprite } from "../avatar/creature.js";

// One sprite for every falcon (frames are cached)
const SPRITE = new FalconSprite();

export class FalconCompanion {
  constructor(ownerX, ownerY) {
    this.x = ownerX - 22;
    this.y = ownerY - 18;
    this.vx = 0;              // actual movement per frame (for direction and diving)
    this.vy = 0;
    this.wingTimer = 0;
    this.state = "HOVERING"; // HOVERING, ATTACKING, RETURNING, TAUNTING
    this.stateTimer = 0;

    // Taunt timer (a random taunt every ~7–10 seconds while idle)
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
    // Afterimages of the dive (the last few positions)
    this.trail = this.trail || [];
    if (this.state === "ATTACKING") this.trail.push({ x: this.x, y: this.y, vx: this.vx, vy: this.vy });
    if (this.trail.length > 5 || (this.state !== "ATTACKING" && this.trail.length)) this.trail.shift();
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

    // 4. IDLE HOVERING AT THE SHOULDER
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

  // facingRight = the player's direction; used when the falcon is nearly still
  draw(ctx, facingRight) {
    const cx = Math.floor(this.x) + 16;
    const cy = Math.floor(this.y) + 14;

    // Shadow on the ground
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.beginPath();
    ctx.ellipse(cx, Math.floor(this.y) + 36, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Face the direction of flight; when hovering, the player's direction
    const flying = Math.abs(this.vx) > 0.35;
    const left = flying ? this.vx < 0 : !facingRight;

    if (this.state === "ATTACKING") {
      // Diving: the beak points along the movement
      const rot = left ? Math.atan2(-this.vy, -this.vx) : Math.atan2(this.vy, this.vx);
      (this.trail || []).forEach((g, i, arr) => {
        ctx.save();
        ctx.globalAlpha = 0.12 + 0.3 * (i / arr.length);
        SPRITE.draw(ctx, Math.floor(g.x) + 16, Math.floor(g.y) + 14, "side", "dive", 0, left, true, 1, rot);
        ctx.restore();
      });
      // Stretched along the dive for speed
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.atan2(this.vy, this.vx));
      ctx.scale(1.2, 0.85);
      ctx.rotate(-Math.atan2(this.vy, this.vx));
      ctx.translate(-cx, -cy);
      SPRITE.draw(ctx, cx, cy, "side", "dive", 0, left, false, 1, rot);
      ctx.restore();
    } else if (this.state === "TAUNTING") {
      SPRITE.draw(ctx, cx, cy, "side", "taunt", Math.floor(this.stateTimer / 10), left);
    } else {
      // Faster wing beats when flying back quickly
      const rate = this.state === "RETURNING" ? 3 : 5;
      SPRITE.draw(ctx, cx, cy, "side", "fly", Math.floor(this.wingTimer / rate), left);
    }
  }
}
