export class GrasslandSystem {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    // Seeded multi-tone grass blades & wild flora
    this.flora = [];
    for (let x = 32; x < this.width - 32; x += 48) {
      for (let y = 32; y < this.height - 32; y += 48) {
        this.flora.push({
          x: x + (Math.sin(x * 13 + y) * 16),
          y: y + (Math.cos(y * 17 + x) * 16),
          type: (x + y) % 5 === 0 ? "flower" : "blade",
          color: (x + y) % 3 === 0 ? "#ffd166" : "#06d6a0",
          swayOffset: Math.random() * Math.PI * 2
        });
      }
    }
    this.animTick = 0;
  }

  update() {
    this.animTick += 0.04;
  }

  draw(ctx) {
    // 1. Deep Turf Base
    ctx.fillStyle = "#1b4332";
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Midtone Grass Mounds
    ctx.fillStyle = "#2d6a4f";
    for (let x = 20; x < this.width; x += 64) {
      for (let y = 20; y < this.height; y += 64) {
        ctx.fillRect(x, y, 14, 5);
        ctx.fillRect(x + 22, y + 18, 10, 4);
      }
    }

    // 3. Animated Swaying Blades & Wildflowers
    this.flora.forEach((f) => {
      const sway = Math.sin(this.animTick + f.swayOffset) * 1.5;
      if (f.type === "flower") {
        ctx.fillStyle = "#52b788";
        ctx.fillRect(f.x, f.y + 2, 2, 4);
        ctx.fillStyle = f.color;
        ctx.fillRect(f.x - 1 + sway, f.y, 4, 3);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(f.x + sway, f.y + 1, 2, 1);
      } else {
        ctx.fillStyle = "#40916c";
        ctx.fillRect(f.x, f.y, 2, 4);
        ctx.fillRect(f.x + 1 + sway, f.y - 2, 1, 3);
      }
    });
  }
}