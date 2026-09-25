const _ = 0;
const K = "#14171d";
const A1 = "#adb5bd";
const A2 = "#495057";
const S1 = "#f3c5a5";
const R1 = "#e63946";
const G1 = "#ffd166";

export class RecruiterNPC {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.animTimer = 0;
    this.animFrame = 0;

    this.sprites = [
      [
        [_,_,K,A1,A1,K,_,_,_],
        [_,K,A1,G1,G1,A1,K,_,_],
        [_,K,A2,S1,K,S1,A2,K,_],
        [K,R1,A1,A1,A1,A1,R1,K],
        [K,R1,A2,A1,A1,A2,R1,K],
        [K,R1,A2,A2,A2,A2,R1,K],
        [_,K,R1,R1,R1,R1,R1,K],
        [_,_,K,A2,_,A2,K,_],
        [_,_,K,K,_,K,K,_]
      ],
      [
        [_,_,K,A1,A1,K,_,_,_],
        [_,K,A1,G1,G1,A1,K,_,_],
        [_,K,A2,S1,K,S1,A2,K,_],
        [K,R1,A1,A1,A1,A1,R1,K],
        [K,R1,A2,A1,A1,A2,R1,K],
        [K,R1,A2,A2,A2,A2,R1,K],
        [_,K,R1,R1,R1,R1,R1,K],
        [_,_,K,A2,_,A2,K,_],
        [_,_,K,K,_,K,K,_]
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

  draw(ctx, drawMatrixFn) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(this.x + 5, this.y + 16, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    drawMatrixFn(ctx, this.x, this.y, this.sprites[this.animFrame]);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillText("CAPT. RONALD [M]", this.x + 5, this.y - 6);
  }
}