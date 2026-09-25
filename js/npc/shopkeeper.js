import { drawSpriteMatrix } from "../sprite.js";

const _ = 0;
const K = "#11141a"; // Dark Outline
const H1 = "#4a2810"; // Leather Hat Dark
const H2 = "#7a431d"; // Leather Hat Mid
const H3 = "#b56f3e"; // Leather Trim
const F1 = "#e63946"; // Feather Glint
const S1 = "#f8d5b8"; // Skin Light
const S2 = "#cf966c"; // Skin Shadow
const C1 = "#264653"; // Merchant Apron Dark Teal
const C2 = "#2a9d8f"; // Merchant Apron Bright Teal
const G1 = "#ffd166"; // Gold Buckles & Coins
const P1 = "#e63946"; // Ruby Healing Elixir
const P2 = "#00f0ff"; // Mana Potion Cyan
const B1 = "#1a1c23"; // Dark Leather Shoes

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
        [_,_,_,_,_,F1,F1,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,H1,H2,H3,H3,H2,H1,_,_,_,_,_,_],
        [_,_,_,H1,H2,H3,H3,H3,H3,H2,H1,_,_,_,_,_],
        [_,_,H1,H1,H1,H1,H1,H1,H1,H1,H1,H1,_,_,_,_],
        [_,_,_,K,S2,S1,K,S1,K,S2,K,_,_,_,_,_],
        [_,_,_,K,S2,S1,S1,S1,S2,K,_,_,_,_,_,_],
        [_,_,C1,C2,C2,C2,C2,C2,C2,C1,_,_,_,_,_,_],
        [_,C1,C2,S2,G1,G1,G1,S2,C2,C1,P1,P1,_,_,_,_],
        [_,K,S1,S2,C1,G1,G1,C1,S2,S1,K,P1,_,_,_,_],
        [_,_,K,C1,C2,C2,C2,C2,C1,K,P2,P2,_,_,_,_],
        [_,_,K,H1,H1,H1,H1,H1,H1,K,K,P2,_,_,_,_],
        [_,_,_,K,S2,S1,_,S1,S2,K,_,_,_,_,_,_],
        [_,_,_,K,B1,B1,_,B1,B1,K,_,_,_,_,_,_],
        [_,_,_,K,K,K,_,_,K,K,K,_,_,_,_,_,_]
      ],
      [
        [_,_,_,_,_,F1,F1,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,H1,H2,H3,H3,H2,H1,_,_,_,_,_,_],
        [_,_,_,H1,H2,H3,H3,H3,H3,H2,H1,_,_,_,_,_],
        [_,_,H1,H1,H1,H1,H1,H1,H1,H1,H1,H1,_,_,_,_],
        [_,_,_,K,S2,S1,K,S1,K,S2,K,_,_,_,_,_],
        [_,_,_,K,S2,S1,S1,S1,S2,K,_,_,_,_,_,_],
        [_,_,C1,C2,C2,C2,C2,C2,C2,C1,_,_,_,_,_,_],
        [_,C1,C2,S2,G1,G1,G1,S2,C2,C1,P1,P1,_,_,_,_],
        [_,K,S1,S2,C1,G1,G1,C1,S2,S1,K,P1,_,_,_,_],
        [_,_,K,C1,C2,C2,C2,C2,C1,K,P2,P2,_,_,_,_],
        [_,_,K,H1,H1,H1,H1,H1,H1,K,K,P2,_,_,_,_],
        [_,_,_,K,S2,S1,_,S1,S2,K,_,_,_,_,_,_],
        [_,_,K,B1,B1,_,_,B1,B1,K,_,_,_,_,_,_],
        [_,_,K,K,K,_,_,_,K,K,K,_,_,_,_,_,_]
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

  draw(ctx) {
    // Dual Ground Occlusion Contact Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.beginPath();
    ctx.ellipse(this.x + 8, this.y + 17, 9, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(this.x + 8, this.y + 16.5, 5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    drawSpriteMatrix(ctx, this.x, this.y, this.sprites[this.animFrame], false, this.facing === "left");

    // Gilded Name Tag
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillText("EDGAR [E]", this.x + 8, this.y - 5);
  }
}