import { drawSpriteMatrix } from "../sprite.js";

const _ = 0;
const K = "#11141a"; // Dark Outline
const A1 = "#dee2e6"; // Officer Steel Plate
const A2 = "#6c757d"; // Steel Plate Shadow
const S1 = "#f8d5b8"; // Skin Tone
const S2 = "#cf966c"; // Skin Shadow
const R1 = "#b00020"; // Royal Cloak Crimson Shadow
const R2 = "#e63946"; // Royal Cloak Crimson Bright
const G1 = "#ffd166"; // Gold Aiguillette & Crest
const G2 = "#e0a926"; // Brass Buckle
const B1 = "#1a1c23"; // Dark Plate Boots

export class RecruiterNPC {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.animTimer = 0;
    this.animFrame = 0;

    this.sprites = [
      [
        [_,_,_,_,_,G1,G1,G1,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,A1,A1,A1,A1,A2,_,_,_,_,_,_,_,_,_],
        [_,_,_,A2,A1,G1,G1,A1,A2,K,_,_,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,K,S1,K,S2,K,_,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,S1,S1,S2,K,_,_,_,_,_,_,_,_],
        [_,_,G1,G1,A1,A1,A1,A1,G1,G1,_,_,_,_,_,_,_,_],
        [_,R1,R2,A1,G1,G1,G1,A1,R2,R1,_,_,_,_,_,_,_],
        [_,R1,R2,S2,A2,A1,A2,S2,R2,R1,_,_,_,_,_,_,_],
        [_,K,S1,S2,G2,G2,G2,S2,S1,K,_,_,_,_,_,_,_,_],
        [_,_,K,A2,A1,A1,A1,A2,K,_,_,_,_,_,_,_,_,_],
        [_,_,K,R1,R1,R1,R1,R1,K,_,_,_,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,_,S1,S2,K,_,_,_,_,_,_,_,_],
        [_,_,_,K,B1,B1,_,B1,B1,K,_,_,_,_,_,_,_,_],
        [_,_,_,K,K,K,_,_,K,K,K,_,_,_,_,_,_,_,_]
      ],
      [
        [_,_,_,_,_,G1,G1,G1,_,_,_,_,_,_,_,_,_,_],
        [_,_,_,_,A1,A1,A1,A1,A2,_,_,_,_,_,_,_,_,_],
        [_,_,_,A2,A1,G1,G1,A1,A2,K,_,_,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,K,S1,K,S2,K,_,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,S1,S1,S2,K,_,_,_,_,_,_,_,_],
        [_,_,G1,G1,A1,A1,A1,A1,G1,G1,_,_,_,_,_,_,_,_],
        [_,R1,R2,A1,G1,G1,G1,A1,R2,R1,_,_,_,_,_,_,_],
        [_,R1,R2,S2,A2,A1,A2,S2,R2,R1,_,_,_,_,_,_,_],
        [_,K,S1,S2,G2,G2,G2,S2,S1,K,_,_,_,_,_,_,_,_],
        [_,_,K,A2,A1,A1,A1,A2,K,_,_,_,_,_,_,_,_,_],
        [_,_,K,R1,R1,R1,R1,R1,K,_,_,_,_,_,_,_,_,_],
        [_,_,_,K,S2,S1,_,S1,S2,K,_,_,_,_,_,_,_,_],
        [_,_,K,B1,B1,_,_,B1,B1,K,_,_,_,_,_,_,_,_],
        [_,_,K,K,K,_,_,_,K,K,K,_,_,_,_,_,_,_,_]
      ]
    ];
  }

  update() {
    this.animTimer++;
    if (this.animTimer >= 22) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % this.sprites.length;
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

    drawSpriteMatrix(ctx, this.x, this.y, this.sprites[this.animFrame]);

    // Gilded Name Tag
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillText("CAPT. RONALD [M]", this.x + 8, this.y - 5);
  }
}