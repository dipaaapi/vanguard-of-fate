export class GrasslandSystem {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    // Seeded multi-tone grass blades, wild flora, & stepping stones
    this.flora = [];
    for (let x = 32; x < this.width - 32; x += 36) {
      for (let y = 32; y < this.height - 32; y += 36) {
        const randSeed = (x * 37 + y * 73) % 100;
        this.flora.push({
          x: x + (Math.sin(x * 13 + y) * 14),
          y: y + (Math.cos(y * 17 + x) * 14),
          type: randSeed < 25 ? "flower" : (randSeed < 35 ? "stone" : "blade"),
          color: randSeed % 4 === 0 ? "#ffd166" : (randSeed % 4 === 1 ? "#ff70a6" : (randSeed % 4 === 2 ? "#38bdf8" : "#ffffff")),
          swayOffset: Math.random() * Math.PI * 2
        });
      }
    }

    // Natural Dirt / Pebble Trails
    this.pathStones = [];
    for (let i = 0; i < 45; i++) {
      this.pathStones.push({
        x: 80 + Math.random() * (this.width - 160),
        y: 80 + Math.random() * (this.height - 160),
        w: 4 + Math.random() * 6,
        h: 3 + Math.random() * 4,
        color: Math.random() > 0.5 ? "#334155" : "#475569"
      });
    }

    this.animTick = 0;
  }

  update() {
    this.animTick += 0.04;
  }

  draw(ctx) {
    // 1. Deep Rich Forest Turf Base
    ctx.fillStyle = "#143628";
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Multi-Tone Grass Canopy Shading (Dense Meadow Patches)
    ctx.fillStyle = "#1e4d38";
    for (let x = 16; x < this.width; x += 48) {
      for (let y = 16; y < this.height; y += 48) {
        const w = 18 + ((x * y) % 12);
        const h = 10 + ((x + y) % 8);
        ctx.fillRect(x, y, w, h);
      }
    }

    ctx.fillStyle = "#2d6a4f";
    for (let x = 28; x < this.width; x += 56) {
      for (let y = 28; y < this.height; y += 56) {
        ctx.fillRect(x, y, 12, 6);
        ctx.fillRect(x + 14, y + 8, 8, 4);
      }
    }

    // 3. Natural Stepping Stones & Pebbles
    this.pathStones.forEach((st) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(st.x + 1, st.y + 1, st.w, st.h);
      ctx.fillStyle = st.color;
      ctx.fillRect(st.x, st.y, st.w, st.h);
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(st.x, st.y, st.w - 1, 1);
    });

    // 4. Animated Swaying Blades & Wildflower Clusters
    this.flora.forEach((f) => {
      const sway = Math.sin(this.animTick + f.swayOffset) * 1.5;

      if (f.type === "flower") {
        // Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(f.x - 1, f.y + 5, 4, 2);
        // Stalk
        ctx.fillStyle = "#40916c";
        ctx.fillRect(f.x, f.y + 2, 2, 4);
        // Petals
        ctx.fillStyle = f.color;
        ctx.fillRect(f.x - 1 + sway, f.y, 4, 3);
        ctx.fillStyle = "#fffbeb";
        ctx.fillRect(f.x + sway, f.y + 1, 2, 1);
      } else if (f.type === "blade") {
        // Multi-blade grass tuft
        ctx.fillStyle = "#40916c";
        ctx.fillRect(f.x, f.y, 2, 5);
        ctx.fillStyle = "#52b788";
        ctx.fillRect(f.x + 1 + sway, f.y - 3, 1, 4);
        ctx.fillRect(f.x - 1 + sway * 0.7, f.y - 1, 1, 3);
      } else if (f.type === "stone") {
        ctx.fillStyle = "#334155";
        ctx.fillRect(f.x, f.y, 4, 3);
        ctx.fillStyle = "#64748b";
        ctx.fillRect(f.x, f.y, 3, 1);
      }
    });
  }
}