export class FalconCompanion {
  constructor(ownerX, ownerY) {
    this.x = ownerX - 22;
    this.y = ownerY - 18;
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
            enemyManager.damage(this.target, 38, Math.atan2(dy, dx), true, fx, lootManager, 14, false, player);
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

  // 64x64 HIGH-FIDELITY RENDERER
  draw(ctx, facingRight) {
    ctx.save();
    const fxPos = Math.floor(this.x);
    const fyPos = Math.floor(this.y);

    // Dynamic Contact Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.beginPath();
    ctx.ellipse(fxPos + 16, fyPos + 36, 14, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!facingRight) {
      ctx.translate(fxPos + 32, fyPos);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(fxPos, fyPos);
    }

    const flapState = Math.floor(this.wingTimer / 4) % 4;

    // STANCE ADJUSTMENTS
    if (this.state === "ATTACKING") {
      ctx.rotate(0.5); // Dive tilt
    } else if (this.state === "TAUNTING") {
      ctx.rotate(-0.25); // Puffed chest screech
    }

    // 1. Shaded Tail Feathers
    ctx.fillStyle = "#2b170e";
    ctx.fillRect(2, 14, 8, 6);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(2, 18, 3, 2);

    // 2. 64x64 Multi-Tone Raptor Body (Deep Mahogany, Tawny Brown, at Ochre)
    ctx.fillStyle = "#3d200c";
    ctx.fillRect(8, 8, 16, 12);
    ctx.fillStyle = "#5c3315";
    ctx.fillRect(10, 10, 12, 8);
    ctx.fillStyle = "#d4b895"; // Speckled breast plumage
    ctx.fillRect(12, 12, 3, 3);
    ctx.fillRect(16, 14, 3, 3);

    // 3. Crown & Head
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(18, 4, 10, 9);
    ctx.fillStyle = "#2b170e"; // Dark raptor mask
    ctx.fillRect(20, 6, 8, 3);
    ctx.fillStyle = "#ffd166"; // Sharp Amber Eye
    ctx.fillRect(23, 6, 3, 3);
    ctx.fillStyle = "#000000";
    ctx.fillRect(25, 7, 1.5, 1.5);

    // 4. Curved Hook Beak
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(28, 7, 5, 4);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(32, 9, 2, 4);

    // 5. FLAPPING WINGS (IDLE, SPREAD, DIVE, TAUNT)
    if (this.state === "ATTACKING") {
      // Razor Dive Wings
      ctx.fillStyle = "#3d200c";
      ctx.fillRect(4, 3, 16, 6);
      ctx.fillStyle = "#7c441b";
      ctx.fillRect(6, 1, 12, 5);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(14, 0, 4, 2);
    } else if (this.state === "TAUNTING") {
      // Full Wingspan Flex
      ctx.fillStyle = "#3d200c";
      ctx.fillRect(4, -8, 8, 18);
      ctx.fillRect(12, -10, 8, 20);
      ctx.fillStyle = "#8a5024";
      ctx.fillRect(7, -8, 5, 15);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(14, -12, 5, 3);
    } else if (flapState === 0 || flapState === 2) {
      // Wings Up
      ctx.fillStyle = "#3d200c";
      ctx.fillRect(6, -5, 8, 14);
      ctx.fillRect(12, -8, 8, 16);
      ctx.fillStyle = "#7c441b";
      ctx.fillRect(9, -6, 6, 12);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(14, -10, 5, 3);
    } else {
      // Wings Down
      ctx.fillStyle = "#3d200c";
      ctx.fillRect(0, 11, 14, 7);
      ctx.fillRect(8, 12, 14, 6);
      ctx.fillStyle = "#7c441b";
      ctx.fillRect(3, 12, 10, 4);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(18, 14, 5, 3);
    }

    // 6. Talons
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(14, 18, 4, 6);
    ctx.fillRect(20, 18, 4, 6);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(16, 23, 2, 3);
    ctx.fillRect(22, 23, 2, 3);

    ctx.restore();
  }
}