const _ = 0;
const K = "#14171d"; // Outline
const H1 = "#582f0e"; // Hat / Coat Brown
const H2 = "#8a5a36";
const S1 = "#f3c5a5"; // Skin Tone
const G1 = "#52b788"; // Potion Flask Green
const B1 = "#2b2d42"; // Boots

export class ShopkeeperNPC {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.roamTimer = 0;
    this.speed = 0.42;
    this.facing = "right";
    this.animTimer = 0;
    this.animFrame = 0;

    this.sprites = [
      [
        [_,_,_,K,H1,H1,K,_,_,_],
        [_,_,K,H2,H2,H2,H1,K,_,_],
        [_,K,H1,S1,K,S1,H1,K,_,_],
        [_,K,H1,S1,S1,S1,H1,K,_,_],
        [K,H2,H1,H1,H1,H1,H2,K,_,_],
        [K,H2,H1,G1,G1,H1,H2,K,_,_], // Hawak na Potion Flask
        [_,K,H1,H1,H1,H1,H1,K,_,_],
        [_,_,K,B1,_,B1,K,_,_,_],
        [_,_,K,K,_,K,K,_,_,_]
      ],
      [
        [_,_,_,K,H1,H1,K,_,_,_],
        [_,_,K,H2,H2,H2,H1,K,_,_],
        [_,K,H1,S1,K,S1,H1,K,_,_],
        [_,K,H1,S1,S1,S1,H1,K,_,_],
        [K,H2,H1,H1,H1,H1,H2,K,_,_],
        [K,H2,H1,G1,G1,H1,H2,K,_,_],
        [_,K,H1,H1,H1,H1,H1,K,_,_],
        [_,_,_,K,B1,B1,K,_,_,_],
        [_,_,_,K,K,K,K,_,_,_]
      ]
    ];
  }

  update(safeZone) {
    this.roamTimer++;
    this.animTimer++;
    if (this.animTimer >= 16) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % this.sprites.length;
    }

    if (this.roamTimer > 200) {
      this.roamTimer = 0;
      this.targetX = safeZone.x + 40 + Math.random() * (safeZone.w - 80);
      this.targetY = safeZone.y + 40 + Math.random() * (safeZone.h - 80);
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 3) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
      this.facing = dx >= 0 ? "right" : "left";
    }
  }

  draw(ctx, drawMatrixFn) {
    // Anino
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(this.x + 5, this.y + 16, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    if (this.facing === "left") {
      ctx.translate(Math.floor(this.x) + 12, Math.floor(this.y));
      ctx.scale(-1, 1);
      drawMatrixFn(ctx, 0, 0, this.sprites[this.animFrame]);
    } else {
      drawMatrixFn(ctx, this.x, this.y, this.sprites[this.animFrame]);
    }
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillText("EDGAR [E]", this.x + 5, this.y - 6);
  }
}