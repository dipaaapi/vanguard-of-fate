// ==================== AETHELGARD WEATHER ====================
// Clear / rain / storm / fog cycle. Clouds are pixel-art cumulus (pre-rendered once per cloud from
// overlapping puffs on a 2 px grid, four tones) that drift above the characters and cast soft shadows
// on the ground; they thin out around the hero so they never hide the action. The map edges are
// banked with the same clouds.

const PIX = 2;   // cloud pixel size in world pixels
// Tones per weather: rim highlight, body, shade, underside
const CLOUD_TONES = {
  CLEAR: ["#ffffff", "#eef4fb", "#cfdcec", "#a9bad3"],
  RAIN: ["#d5dde7", "#aab6c5", "#8794a6", "#66728a"],
  STORM: ["#9aa5b8", "#5d6779", "#474f60", "#333a49"],
  FOG: ["#f1f5f9", "#dbe3ec", "#c3cedb", "#aab6c5"]
};

function rand(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// A cloud mask: a row of small base puffs under two to four big top bumps (scalloped cumulus
// silhouette) with a flattened base. Each cell remembers which puff it belongs to, for shading.
function cloudMask(w, h, seed) {
  const gw = Math.ceil(w / PIX), gh = Math.ceil(h / PIX), r = rand(seed);
  const puffs = [];
  const nBase = 5 + Math.floor(r() * 3);
  for (let i = 0; i < nBase; i++) {
    const k = i / (nBase - 1);
    puffs.push({ x: gw * (0.1 + k * 0.8) + (r() - 0.5) * 2, y: gh * 0.66, r: gh * (0.2 + r() * 0.08) });
  }
  const nTop = 2 + Math.floor(r() * 3);
  for (let i = 0; i < nTop; i++) {
    const k = nTop === 1 ? 0.5 : i / (nTop - 1);
    const rad = gh * (0.3 + r() * 0.12) * (1 - Math.abs(k - 0.5) * 0.5);
    puffs.push({ x: gw * (0.28 + k * 0.44) + (r() - 0.5) * 4, y: gh * 0.66 - rad * 0.75, r: rad });
  }
  const base = Math.floor(gh * 0.86);
  const m = new Uint8Array(gw * gh), owner = new Int8Array(gw * gh).fill(-1);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    if (y > base) continue;
    // the puff whose surface is furthest outside wins (so bumps shade as separate rounds)
    let best = -1, bestV = Infinity;
    puffs.forEach((p, i) => {
      const v = ((x - p.x) ** 2 + (y - p.y) ** 2) / (p.r * p.r);
      if (v <= 1 && p.y - p.r < bestV) { bestV = p.y - p.r; best = i; }
    });
    if (best >= 0) { m[y * gw + x] = 1; owner[y * gw + x] = best; }
  }
  return { m, owner, puffs, gw, gh, base };
}

// Paint a mask with the four tones (or one flat colour for the ground shadow)
function paintCloud(mask, tones) {
  const { m, owner, puffs, gw, gh, base } = mask;
  const c = document.createElement("canvas");
  c.width = gw * PIX;
  c.height = gh * PIX;
  const g = c.getContext("2d");
  const at = (x, y) => (x >= 0 && y >= 0 && x < gw && y < gh ? m[y * gw + x] : 0);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    if (!at(x, y)) continue;
    let col;
    if (typeof tones === "string") col = tones;
    else {
      const p = puffs[owner[y * gw + x]];
      const dy = (y - p.y) / p.r, dx = (x - p.x) / p.r;
      const edgeBelow = !at(x, y + 1) || !at(x + 1, y) && dy > 0;
      if (edgeBelow || y >= base) col = tones[3];                          // dark rim along the underside
      else if (!at(x, y - 1) || dy + dx * 0.3 < -0.55) col = tones[0];     // lit top of each bump
      else if (dy > 0.35 || y > base - 3) col = tones[2];                  // shaded lower half
      else col = tones[1];
    }
    g.fillStyle = col;
    g.fillRect(x * PIX, y * PIX, PIX, PIX);
  }
  return c;
}

export class WeatherSystem {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.animTick = 0;

    this.weatherType = "CLEAR"; // CLEAR, RAIN, STORM, FOG
    this.weatherTimer = 0;
    this.weatherDuration = 2400; // ~40 seconds per change

    // Drifting pixel cumulus (sprites are rendered lazily in cloudSprite)
    this.skyClouds = [];
    for (let c = 0; c < 8; c++) {
      this.skyClouds.push({
        x: Math.random() * this.worldWidth,
        y: 40 + Math.random() * (this.worldHeight - 160),
        w: 84 + Math.round(Math.random() * 70),
        h: 40 + Math.round(Math.random() * 22),
        seed: 101 + c * 977,
        speed: 0.12 + Math.random() * 0.16,
        sprites: {}
      });
    }
    // Cloud banks along the four map edges
    this.borderClouds = [];
    const edge = (x, y, k) => this.borderClouds.push({ x, y, w: 110, h: 56, seed: 5003 + k * 131, sprites: {}, phase: k * 0.7 });
    let k = 0;
    for (let x = -60; x < this.worldWidth + 60; x += 80) { edge(x, -30, k++); edge(x, this.worldHeight - 26, k++); }
    for (let y = 20; y < this.worldHeight - 20; y += 60) { edge(-70, y, k++); edge(this.worldWidth - 40, y, k++); }

    // Dynamic Raindrop Particles
    this.rainDrops = [];
    for (let r = 0; r < 75; r++) {
      this.rainDrops.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        speedY: 7.5 + Math.random() * 4,
        speedX: -1.6,
        len: 8 + Math.random() * 7
      });
    }

    this.lightningFlash = 0;
  }

  update() {
    this.animTick++;

    // 1. Drifting Sky Clouds
    this.skyClouds.forEach((cloud) => {
      cloud.x += cloud.speed;
      if (cloud.x - cloud.w > this.worldWidth) {
        cloud.x = -cloud.w;
        cloud.y = 60 + Math.random() * (this.worldHeight - 200);
      }
    });

    // 2. Weather Engine Cycle
    this.weatherTimer++;
    if (this.weatherTimer >= this.weatherDuration) {
      this.weatherTimer = 0;
      const sequence = ["CLEAR", "CLEAR", "RAIN", "STORM", "FOG"];
      this.weatherType = sequence[Math.floor(Math.random() * sequence.length)];
    }

    // 3. Rain & Storm Physics
    if (this.weatherType === "RAIN" || this.weatherType === "STORM") {
      this.rainDrops.forEach((d) => {
        d.y += d.speedY * (this.weatherType === "STORM" ? 1.45 : 1.0);
        d.x += d.speedX;
        if (d.y > this.worldHeight) {
          d.y = -10;
          d.x = Math.random() * this.worldWidth;
        }
      });

      if (this.weatherType === "STORM" && Math.random() < 0.006) {
        this.lightningFlash = 4;
      }
    }
  }

  // Sprite for a cloud in the current weather (built once per weather type), plus its ground shadow
  cloudSprite(c, kind) {
    if (!c.mask) c.mask = cloudMask(c.w, c.h, c.seed);
    if (!c.sprites[kind]) c.sprites[kind] = kind === "shadow" ? paintCloud(c.mask, "#0b1a2b") : paintCloud(c.mask, CLOUD_TONES[kind]);
    return c.sprites[kind];
  }

  // Ground layer: soft shadows of the clouds overhead (offset as if lit from the upper left)
  drawCloudShadows(ctx) {
    if (this.weatherType === "FOG") return;
    ctx.save();
    ctx.globalAlpha = this.weatherType === "CLEAR" ? 0.12 : 0.08;
    this.skyClouds.forEach((c) => ctx.drawImage(this.cloudSprite(c, "shadow"), Math.round(c.x + 26), Math.round(c.y + 70)));
    ctx.restore();
  }

  // Above the characters: the clouds themselves; they thin out where the hero stands
  drawSkyClouds(ctx, player = null) {
    if (this.weatherType === "FOG") return;
    const kind = this.weatherType;
    const flash = this.weatherType === "STORM" && this.lightningFlash > 0;
    const px = player ? player.x + 10 : -9999, py = player ? player.y + 10 : -9999;
    ctx.save();
    this.skyClouds.forEach((c) => {
      const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
      const d = Math.hypot((px - cx) / (c.w * 0.7), (py - cy) / (c.h * 0.9));
      const base = kind === "CLEAR" ? 0.8 : 0.85;
      ctx.globalAlpha = base * Math.min(1, 0.25 + Math.max(0, d - 0.6) * 0.9);
      ctx.drawImage(this.cloudSprite(c, flash ? "CLEAR" : kind), Math.round(c.x), Math.round(c.y));
    });
    ctx.restore();
  }

  // Weather Screen Overlay
  drawWeatherOverlay(ctx) {
    ctx.save();
    if (this.weatherType === "RAIN" || this.weatherType === "STORM") {
      ctx.strokeStyle = this.weatherType === "STORM" ? "rgba(186, 230, 253, 0.7)" : "rgba(147, 197, 253, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      this.rainDrops.forEach((d) => {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.speedX * 2, d.y + d.len);
      });
      ctx.stroke();

      ctx.fillStyle = this.weatherType === "STORM" ? "rgba(10, 18, 32, 0.38)" : "rgba(15, 23, 42, 0.2)";
      ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

      if (this.lightningFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.12})`;
        ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);
        this.lightningFlash--;
      }
    } else if (this.weatherType === "FOG") {
      ctx.fillStyle = "rgba(203, 213, 225, 0.24)";
      ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);
    }
    ctx.restore();
  }

  // Cloud banks hiding the edges of the map (gently bobbing)
  drawCloudBorders(ctx) {
    const kind = this.weatherType === "FOG" ? "FOG" : this.weatherType;
    const t = this.animTick * 0.02;
    ctx.save();
    ctx.globalAlpha = 0.95;
    this.borderClouds.forEach((c) => {
      ctx.drawImage(this.cloudSprite(c, kind), Math.round(c.x + Math.sin(t + c.phase) * 3), Math.round(c.y + Math.cos(t * 0.8 + c.phase) * 2));
    });
    ctx.restore();
  }
}
