// ==================== FRONTIER MAPS (Book I side regions) ====================
// Four wild regions beside the campaign platforms. They have no boss: they hold side quests,
// five regular and four elite monster kinds each, and places to scout (sites).
//   rocky     Greyhorn Badlands     Acts IV–VI   from Aethelgard (the south-west Wayfarer's Gate)
//   swamp     Gloomwater Fens       Acts VII–VIII from the Whispering Canopy (east trail)
//   mountain  Stormcrown Highlands  Act IX       from the Frostfang Precipice (east trail)
//   desert    Sunscorch Dunes       Act X        from the Ashfall Wastelands (south trail)
// Same shape as a PLATFORMS entry where js/world/platform.js reads it (camp, gate, arena, theme, ambient,
// seed, terrain, landmark, pathTargets), plus: frontier, from (the map the gate returns to), levels
// [min, max], acts (whose side quests can send you here), unlockAct and the text shown on arrival.
// The map is 1280x960 (80x60 tiles); camp, arena, gate and sites (x, y) are in pixels.

const fill = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
const disc = (ctx, x, y, rx, ry, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };

export const FRONTIERS = {
  // ==================== GREYHORN BADLANDS (rocky) ====================
  rocky: {
    id: "rocky", frontier: true, from: "hub", acts: [4, 5, 6], unlockAct: 4, levels: [4, 11], tier: 1,
    theme: "rocky", ambient: "dust", seed: 4404, color: "#d6a35c",
    name: { en: "Greyhorn Badlands", fil: "Greyhorn Badlands" },
    camp: { x: 990, y: 410, w: 170, h: 120 }, gate: { x: 1196, y: 470, dir: "vertical" },
    arena: { x: 150, y: 620, w: 320, h: 220 },
    arenaName: { en: "Shattered Quarry", fil: "Basag na Tibagan" },
    monsters: ["skeleton", "skyGargoyle", "rubbleCrawler", "badlandBrigand", "dustJackal"],
    elites: ["quarryColossus", "brigandWarlord", "boneMarshal", "cliffWyvern"],
    sites: [
      { x: 640, y: 280, name: { en: "Rusted Watchtower", fil: "Kinalawang na Bantayan" } },
      { x: 300, y: 180, name: { en: "Fossil Gully", fil: "Bangin ng mga Fossil" } },
      { x: 820, y: 780, name: { en: "Hollow Mesa", fil: "Hungkag na Mesa" } }
    ],
    pathTargets: [[310, 730]],
    terrain(tx, ty, cols, rows, noise) {
      return noise(tx * 0.1, ty * 0.1) > 0.66 ? "wall" : null;                  // mesa cliffs
    },
    landmark(ctx, t) {
      // The Shattered Quarry: stepped terraces, a toppled crane and a cart of ore
      const a = this.arena, cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      for (let k = 3; k >= 0; k--) disc(ctx, cx, cy, 70 + k * 26, 36 + k * 14, k % 2 ? "#6b5a41" : "#7b6a4e");
      disc(ctx, cx, cy, 52, 26, "#4f4331");
      fill(ctx, "#5e3b1a", cx + 60, cy - 50, 4, 48);                       // crane mast
      fill(ctx, "#5e3b1a", cx + 20, cy - 50, 44, 3);
      fill(ctx, "#94a3b8", cx + 22, cy - 47, 1, 14 + Math.sin(t) * 2);      // swaying chain
      fill(ctx, "#475569", cx + 18, cy - 33 + Math.sin(t) * 2, 9, 5);
      fill(ctx, "#3a2616", cx - 60, cy + 6, 22, 10);                       // ore cart
      fill(ctx, "#fbbf24", cx - 57, cy + 3, 6, 4);
      fill(ctx, "#a8a29e", cx - 49, cy + 2, 7, 5);
      fill(ctx, "#1c1917", cx - 58, cy + 16, 5, 4); fill(ctx, "#1c1917", cx - 45, cy + 16, 5, 4);
    },
    text: {
      en: { arrive: "The Greyhorn Badlands: mesas, brigands and the bones of an old quarry. Lv 4–11." },
      fil: { arrive: "Ang Greyhorn Badlands: mga mesa, tulisan at kalansay ng lumang tibagan. Lv 4–11." }
    }
  },

  // ==================== GLOOMWATER FENS (swamp) ====================
  swamp: {
    id: "swamp", frontier: true, from: "canopy", acts: [7, 8], unlockAct: 7, levels: [12, 19], tier: 2,
    theme: "swamp", ambient: "fenmist", seed: 7717, color: "#84cc16",
    name: { en: "Gloomwater Fens", fil: "Gloomwater Fens" },
    camp: { x: 120, y: 410, w: 170, h: 120 }, gate: { x: 84, y: 470, dir: "vertical" },
    arena: { x: 840, y: 330, w: 300, h: 250 },
    arenaName: { en: "Drowned Shrine", fil: "Lubog na Dambana" },
    monsters: ["mireGhoul", "peatHulk", "fenMoth", "bogSerpent", "swampCrab"],
    elites: ["gloomwaterHag", "mireHydra", "bogTitan", "plagueMothMatriarch"],
    sites: [
      { x: 620, y: 150, name: { en: "Sunken Bell Tower", fil: "Lubog na Kampanaryo" } },
      { x: 640, y: 800, name: { en: "Witchlight Hollow", fil: "Lungga ng Witchlight" } },
      { x: 720, y: 470, name: { en: "Rotting Boardwalk", fil: "Bulok na Daanang-Kahoy" } }
    ],
    pathTargets: [[990, 455]],
    terrain(tx, ty, cols, rows, noise) {
      return noise(tx * 0.1, ty * 0.1) > 0.6 ? "liquid" : null;                 // black fen water
    },
    landmark(ctx, t) {
      // The Drowned Shrine: a half-sunken stone ring, mossy pillars and will-o'-wisps
      const a = this.arena, cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      disc(ctx, cx, cy, 96, 56, "#2b3324");
      disc(ctx, cx, cy, 70, 40, "#1f2a2a");
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2, x = cx + Math.cos(ang) * 84, y = cy + Math.sin(ang) * 48;
        fill(ctx, "#57534e", x - 4, y - 18 + (k % 3) * 4, 8, 18 - (k % 3) * 4);
        fill(ctx, "#4d7c0f", x - 4, y - 18 + (k % 3) * 4, 8, 3);
      }
      for (let k = 0; k < 5; k++) {
        const wx = cx + Math.cos(t * 0.7 + k * 1.3) * 50, wy = cy - 6 + Math.sin(t * 0.9 + k) * 22;
        disc(ctx, wx, wy, 3, 3, "rgba(190, 242, 100, 0.35)");
        fill(ctx, "#ecfccb", wx, wy, 1, 1);
      }
    },
    text: {
      en: { arrive: "The Gloomwater Fens: black water, rotting boardwalks and lights that lead travellers astray. Lv 12–19." },
      fil: { arrive: "Ang Gloomwater Fens: itim na tubig, bulok na daanang-kahoy at mga ilaw na nagliligaw sa manlalakbay. Lv 12–19." }
    }
  },

  // ==================== STORMCROWN HIGHLANDS (mountain) ====================
  mountain: {
    id: "mountain", frontier: true, from: "frost", acts: [9], unlockAct: 9, levels: [22, 29], tier: 4,
    theme: "highland", ambient: "gale", seed: 9919, color: "#86efac",
    name: { en: "Stormcrown Highlands", fil: "Stormcrown Highlands" },
    camp: { x: 120, y: 410, w: 170, h: 120 }, gate: { x: 84, y: 470, dir: "vertical" },
    arena: { x: 860, y: 100, w: 300, h: 210 },
    arenaName: { en: "Thunder Aerie", fil: "Pugad ng Kulog" },
    monsters: ["highlandLynx", "graniteTroll", "galeHarpy", "highlandRaider", "blizzardHawk"],
    elites: ["stormcrownGriffin", "avalancheGolem", "peakShaman", "elderTroll"],
    sites: [
      { x: 620, y: 180, name: { en: "Windworn Shrine", fil: "Dambanang Inukit ng Hangin" } },
      { x: 1080, y: 760, name: { en: "Eagle's Saddle", fil: "Siyahan ng Agila" } },
      { x: 480, y: 780, name: { en: "Hermit's Cairn", fil: "Bunton ng Ermitanyo" } }
    ],
    pathTargets: [[1010, 205]],
    terrain(tx, ty, cols, rows, noise) {
      if (noise(tx * 0.09, ty * 0.09) > 0.64) return "wall";                    // granite cliffs
      if (noise(tx * 0.16, ty * 0.16, 5) > 0.84) return "liquid";               // mountain tarns
      return null;
    },
    landmark(ctx, t) {
      // The Thunder Aerie: a crown of standing stones on a peak, a giant nest and a lightning rod
      const a = this.arena, cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      disc(ctx, cx, cy + 6, 110, 60, "#4b5a3c");
      disc(ctx, cx, cy, 90, 48, "#5f6f4c");
      for (let k = 0; k < 7; k++) {
        const ang = (k / 7) * Math.PI * 2 - Math.PI / 2, x = cx + Math.cos(ang) * 74, y = cy + Math.sin(ang) * 38;
        fill(ctx, "#6b7280", x - 5, y - 22, 10, 22);
        fill(ctx, "#9ca3af", x - 5, y - 22, 10, 2);
      }
      disc(ctx, cx, cy + 4, 26, 12, "#78350f");                             // nest
      disc(ctx, cx, cy + 2, 18, 7, "#451a03");
      fill(ctx, "#fef3c7", cx - 6, cy, 5, 4); fill(ctx, "#fef3c7", cx + 2, cy - 1, 5, 4);
      fill(ctx, "#94a3b8", cx + 40, cy - 46, 2, 40);                        // lightning rod
      if (Math.sin(t * 3) > 0.92) { fill(ctx, "#fef08a", cx + 38, cy - 70, 6, 24); fill(ctx, "#ffffff", cx + 40, cy - 66, 2, 18); }
    },
    text: {
      en: { arrive: "The Stormcrown Highlands: granite peaks where thunder nests and griffins hunt. Lv 22–29." },
      fil: { arrive: "Ang Stormcrown Highlands: mga taluktok na granite kung saan pumupugad ang kulog at nangangaso ang mga griffin. Lv 22–29." }
    }
  },

  // ==================== SUNSCORCH DUNES (desert) ====================
  desert: {
    id: "desert", frontier: true, from: "ash", acts: [10], unlockAct: 10, levels: [27, 34], tier: 5,
    theme: "desert", ambient: "sandstorm", seed: 10120, color: "#fbbf24",
    name: { en: "Sunscorch Dunes", fil: "Sunscorch Dunes" },
    camp: { x: 560, y: 50, w: 160, h: 110 }, gate: { x: 640, y: 66 },
    arena: { x: 470, y: 640, w: 340, h: 230 },
    arenaName: { en: "Buried Sun Temple", fil: "Nakabaong Templo ng Araw" },
    monsters: ["duneScarab", "duneHyena", "sunDriedRevenant", "sandWyrm", "carrionVulture"],
    elites: ["scarabMonarch", "tombKing", "sandstormWraith", "duneColossus"],
    sites: [
      { x: 200, y: 320, name: { en: "Bleached Colossus", fil: "Pinaputing Kolosso" } },
      { x: 1080, y: 380, name: { en: "Mirage Oasis", fil: "Oasis ng Mirahe" } },
      { x: 1060, y: 820, name: { en: "Glass Crater", fil: "Bunganga ng Salamin" } }
    ],
    pathTargets: [[640, 740]],
    terrain(tx, ty, cols, rows, noise) {
      if (noise(tx * 0.12, ty * 0.12) > 0.76) return "liquid";                  // quicksand
      if (noise(tx * 0.08, ty * 0.08, 7) > 0.8) return "wall";                  // sandstone ridges
      return null;
    },
    landmark(ctx, t) {
      // The Buried Sun Temple: a sand-choked stepped roof, two half-buried statues and a sun disc
      const a = this.arena, cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      disc(ctx, cx, cy + 10, 150, 70, "#c9a86a");
      for (let k = 0; k < 4; k++) fill(ctx, k % 2 ? "#a8844a" : "#b8925a", cx - 90 + k * 14, cy - 40 + k * 10, 180 - k * 28, 10);
      fill(ctx, "#5a4630", cx - 10, cy - 4, 20, 18);                         // doorway
      [-120, 120].forEach((dx) => {
        fill(ctx, "#b8925a", cx + dx - 8, cy - 26, 16, 30);
        fill(ctx, "#8a6a3a", cx + dx - 8, cy - 26, 16, 3);
        fill(ctx, "#22d3ee", cx + dx - 4, cy - 20, 2, 2); fill(ctx, "#22d3ee", cx + dx + 2, cy - 20, 2, 2);
      });
      const glowA = 0.55 + Math.sin(t * 1.5) * 0.25;
      disc(ctx, cx, cy - 58, 14, 14, `rgba(251, 191, 36, ${glowA})`);
      disc(ctx, cx, cy - 58, 8, 8, "#fde68a");
    },
    text: {
      en: { arrive: "The Sunscorch Dunes: a sea of sand south of the Hellforge, hiding a temple older than the crown. Lv 27–34." },
      fil: { arrive: "Ang Sunscorch Dunes: dagat ng buhangin sa timog ng Hellforge, nagtatago ng templong mas matanda pa sa korona. Lv 27–34." }
    }
  }
};

export const FRONTIER_ORDER = ["rocky", "swamp", "mountain", "desert"];
