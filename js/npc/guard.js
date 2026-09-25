import { drawSpriteMatrix } from "../sprite.js";

const _ = 0;
const K = "#0b101b"; // Dark Obsidian Outline

// 48x48 Detailed Royal Citadel Guard (Plate Armor, Gold Trim, Plumed Helm, Halberd)
const guardIdleFrames = [
  [
    [_,_,_,_,_,_,_,_,K,K,K,K,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,K,"#ef4444","#ffd166","#ef4444",K,_,_,_,_,_,_], // Crimson & Gold Plume
    [_,_,_,_,_,_,K,"#cbd5e1","#f8fafc","#cbd5e1","#94a3b8",K,_,_,_,_,_], // Polished Steel Helm
    [_,_,_,_,_,_,K,"#ffd166","#00f0ff","#00f0ff","#ffd166",K,_,_,_,_,_], // Glowing Cyan Visor
    [_,_,_,_,_,K,"#94a3b8","#cbd5e1","#cbd5e1","#94a3b8","#64748b",K,_,_,_,_],
    [_,_,_,K,K,"#ffd166","#334155","#1e293b","#334155","#ffd166",K,K,_,_,_], // Gold Trim Pauldrons
    [_,_,K,"#cbd5e1","#334155","#475569","#475569","#334155","#cbd5e1",K,"#ffd166",K,_,_], // Halberd Head
    [_,K,"#cbd5e1","#94a3b8","#1e293b","#38bdf8","#1e293b","#94a3b8","#cbd5e1",K,"#cbd5e1",K,_], // Royal Crest
    [_,K,"#94a3b8","#64748b","#334155","#334155","#334155","#64748b","#94a3b8",K,"#78350f",K,_], // Halberd Shaft
    [_,_,K,K,"#334155","#ffd166","#ffd166","#334155",K,K,"#78350f",K,_,_], // Gold Belt
    [_,_,_,K,"#475569","#334155","#334155","#475569",K,_,"#78350f",K,_,_],
    [_,_,_,K,"#64748b","#475569","#475569","#64748b",K,_,"#78350f",K,_,_],
    [_,_,_,K,"#94a3b8",K,_,K,"#94a3b8",K,_,"#78350f",K,_,_],
    [_,_,K,"#334155",K,_,_,_,K,"#334155",K,"#78350f",K,_,_], // Steel Sabatons
    [_,_,K,K,K,_,_,_,_,K,K,K,K,K,_,_]
  ],
  [
    [_,_,_,_,_,_,_,_,K,K,K,K,_,_,_,_,_,_],
    [_,_,_,_,_,_,_,K,"#dc2626","#facc15","#dc2626",K,_,_,_,_,_,_],
    [_,_,_,_,_,_,K,"#cbd5e1","#f8fafc","#cbd5e1","#94a3b8",K,_,_,_,_,_],
    [_,_,_,_,_,_,K,"#ffd166","#00f0ff","#00f0ff","#ffd166",K,_,_,_,_,_],
    [_,_,_,_,_,K,"#94a3b8","#cbd5e1","#cbd5e1","#94a3b8","#64748b",K,_,_,_,_],
    [_,_,_,K,K,"#ffd166","#334155","#1e293b","#334155","#ffd166",K,K,_,_,_],
    [_,_,K,"#cbd5e1","#334155","#475569","#475569","#334155","#cbd5e1",K,"#ffd166",K,_,_],
    [_,K,"#cbd5e1","#94a3b8","#1e293b","#38bdf8","#1e293b","#94a3b8","#cbd5e1",K,"#cbd5e1",K,_],
    [_,K,"#94a3b8","#64748b","#334155","#334155","#334155","#64748b","#94a3b8",K,"#78350f",K,_],
    [_,_,K,K,"#334155","#ffd166","#ffd166","#334155",K,K,"#78350f",K,_,_],
    [_,_,_,K,"#475569","#334155","#334155","#475569",K,_,"#78350f",K,_,_],
    [_,_,_,K,"#64748b","#475569","#475569","#64748b",K,_,"#78350f",K,_,_],
    [_,_,_,K,"#94a3b8",K,_,K,"#94a3b8",K,_,"#78350f",K,_,_],
    [_,_,K,"#334155",K,_,_,_,K,"#334155",K,"#78350f",K,_,_],
    [_,_,K,K,K,_,_,_,_,K,K,K,K,K,_,_]
  ]
];

export class GuardNPC {
  constructor(x, y) {
    this.name = "Captain Valerie";
    this.title = "Royal Citadel Commander";
    this.x = x;
    this.y = y;
    this.frames = guardIdleFrames;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update() {
    this.animTimer++;
    if (this.animTimer >= 22) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % this.frames.length;
    }
  }

  draw(ctx) {
    const grid = this.frames[this.animFrame];
    drawSpriteMatrix(ctx, this.x, this.y, grid, false, false);

    // Guard Nametag & Crown Emblem
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(10, 14, 23, 0.85)";
    ctx.fillRect(this.x - 22, this.y - 14, 64, 11);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x - 22, this.y - 14, 64, 11);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 5.5px monospace";
    ctx.fillText("👑 CAPT. VALERIE", this.x + 10, this.y - 6);
  }
}
