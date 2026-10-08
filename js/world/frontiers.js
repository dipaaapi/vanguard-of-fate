// ==================== FRONTIER MAPS (Book I side regions) ====================
// Frontier and story maps beside the campaign platforms. The wilderness maps hold side quests,
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
  // The upper-western harbor connects Aethelgard's sea trade to the isolated marsh clans.
  port: {
    id: "port", frontier: true, from: "coast", acts: [], unlockAct: 8, levels: [12, 18], tier: 2,
    theme: "coast", ambient: "storm", seed: 8809, color: "#38bdf8",
    name: { en: "Tidemark Trading Port", fil: "Daungan ng Tidemark" },
    camp: { x: 140, y: 410, w: 190, h: 135 }, gate: { x: 125, y: 470, dir: "vertical" },
    arena: { x: 850, y: 320, w: 270, h: 220 }, monsters: ["reefCrab", "mariner", "coralGolem", "stormPetrel", "tideSlime"],
    arenaName: { en: "Saltwind Breakwater", fil: "Haranggang Saltwind" },
    elites: ["siren", "drownedSpecter", "drownedCaptain", "abyssalKraken"],
    sites: [{x: 230,y:190,name:{en:"Beastkin Exchange",fil:"Palitan ng Beastkin"}},{x:640,y:720,name:{en:"Salt Market",fil:"Pamilihan ng Asin"}},{x:1010,y:180,name:{en:"North Pier",fil:"Hilagang Pantalan"}}],
    trail: { x: 1180, y: 470, dir: "vertical", dest: "lost" },
    exits: [{ x: 660, y: 120, dir: "horizontal", dest: "swamp", label: { en: "Gloomwater Fen Isle", fil: "Pulo ng Gloomwater" } }],
    pathTargets: [[640,720],[1180,470],[660,120]],
    terrain(tx,ty,cols,rows,noise) { return tx < 7 || noise(tx*.12,ty*.12)>0.87 ? "liquid" : null; },
    landmark(ctx,t,_cleared,_rift,platform) {
      ctx.fillStyle="#704b32"; ctx.fillRect(80,330,210,10); ctx.fillRect(90,350,190,5);
      ctx.fillStyle="#d6b36a"; ctx.fillRect(125,300,62,32); ctx.fillStyle="#f1d8a2"; ctx.fillRect(132,288,48,12);
      if (platform?.tradeRouteOpen) {
        const x=224, y=500;
        ctx.fillStyle="#493626"; ctx.fillRect(x-25,y-15,42,3); ctx.fillRect(x-21,y-12,4,12); ctx.fillRect(x+10,y-12,4,12);
        ctx.fillStyle="#8b5e35"; ctx.fillRect(x-19,y-10,31,8); ctx.fillStyle="#d6a35c"; ctx.fillRect(x-19,y-12,31,2);
        ctx.fillStyle="#332a25"; ctx.fillRect(x-18,y-2,7,7); ctx.fillRect(x+4,y-2,7,7);
        ctx.fillStyle="#cbd5e1"; ctx.fillRect(x-17,y,4,3); ctx.fillRect(x+5,y,4,3);
        ctx.fillStyle="#facc15"; ctx.fillRect(x-13,y-8,7,5); ctx.fillStyle="#38bdf8"; ctx.fillRect(x-3,y-8,8,5);
      }
    }
    ,text:{en:{arrive:"Tidemark Port thrives on sea harvests and trade with the isolated Beastkin marsh. The market and cooking fires are open to travelers. Lv 12–18."},fil:{arrive:"Masigla ang Daungan ng Tidemark sa ani ng dagat at kalakalan sa mga nakabukod na Beastkin. Bukas sa mga manlalakbay ang pamilihan at lutuan. Lv 12–18."}}
  },
  // Eirene is the sole resident: peaceful, hungry flyers are encountered as wildlife, not enemies.
  lost: {
    id: "lost", frontier: true, from: "port", acts: [], unlockAct: 8, levels: [1, 1], tier: 1,
    theme: "highland", ambient: "gale", seed: 9912, color: "#67e8f9",
    name: { en: "The Lost Sky Continent", fil: "Nawawalang Kontinenteng-Langit" },
    camp: { x: 120, y: 400, w: 190, h: 145 }, gate: { x: 84, y: 470, dir: "vertical" },
    arena: { x: 500, y: 360, w: 300, h: 230 }, monsters: [], elites: [], sites: [
      {x:540,y:180,name:{en:"The Researcher's Observatory",fil:"Obserbatoryo ng Mananaliksik"}},
      {x:980,y:250,name:{en:"Dormant Wind Engines",fil:"Mga Natutulog na Makina ng Hangin"}},
      {x:800,y:760,name:{en:"The Caretaker Archive",fil:"Sinupan ng Tagapangalaga"}}
    ], pathTargets:[[540,180],[980,250],[800,760]],
    arenaName: { en: "Caretaker's Core", fil: "Ubod ng Tagapag-alaga" },
    terrain(tx,ty,cols,rows,noise) {
      const dx=(tx-40)/37, dy=(ty-30)/27;
      return dx*dx+dy*dy>1 || noise(tx*.1,ty*.1)>0.94 ? "wall" : null;
    },
    landmark(ctx,t,_cleared,_rift,platform) {
      const pulse=.5+Math.sin(t/24)*.12;
      ctx.fillStyle="#475569"; ctx.fillRect(620,375,90,60); ctx.fillRect(638,345,54,30);
      ctx.fillStyle=`rgba(103,232,249,${pulse})`; ctx.fillRect(658,355,14,14); ctx.fillRect(675,380,4,28);
      const systems=platform?.eireneSystems || {};
      [[540,180,"habitat"],[980,250,"lift"],[800,760,"caretaker"]].forEach(([x,y,id])=>{
        ctx.fillStyle="#334155"; ctx.fillRect(x-9,y-7,18,14);
        ctx.fillStyle=systems[id] ? "#67e8f9" : "#64748b"; ctx.fillRect(x-4,y-4,8,8);
        if(systems[id]) { ctx.fillStyle="#ecfeff"; ctx.fillRect(x-1,y-3,2,2); }
      });
      // Peaceful food-seeking flyers: small pixel silhouettes, never spawned as enemies.
      for (let i=0;i<3;i++) {
        const x=390+i*185+Math.sin(t*.7+i*2)*12, y=235+i%2*72+Math.sin(t*1.3+i)*5;
        ctx.fillStyle="#26364a"; ctx.fillRect(x-5,y,10,3); ctx.fillRect(x-2,y-1,4,2);
        ctx.fillStyle="#bfefff"; ctx.fillRect(x-10,y-2+(Math.sin(t*2+i)>0?0:2),5,2); ctx.fillRect(x+5,y-2+(Math.sin(t*2+i)>0?0:2),5,2);
        ctx.fillStyle="#fde68a"; ctx.fillRect(x+3,y,1,1);
      }
    }
    ,text:{en:{arrive:"A quiet continent floats above the cloudline. Eirene, a caretaker robot left by the late royal researcher, protects its old technology. Hungry flying creatures visit for food, not war."},fil:{arrive:"Tahimik na lumulutang sa ulap ang kontinenteng ito. Si Eirene, robot na tagapag-alaga na iniwan ng yumaong mananaliksik ng hari, ang nag-iingat sa lumang teknolohiya. Dumadapo rito ang mga gutom na lumilipad na nilalang para maghanap ng pagkain, hindi makipagdigma."}}
  },
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
    trail: { x: 1180, y: 470, dir: "vertical", dest: "port" },
    exits: [{ x: 640, y: 800, dir: "horizontal", dest: "underworks", label: { en: "Hidden Research Passage", fil: "Nakatagong Lagusan ng Pananaliksik" } }],
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
      if (Math.hypot(tx - 40, ty - 50) < 5) return null;                          // dry path to Witchlight Hollow
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

  // The late royal researcher's buried laboratory, reached through the revealed Beastkin marsh passage.
  underworks: {
    id: "underworks", frontier: true, from: "swamp", acts: [], unlockAct: 8, levels: [1, 1], tier: 1,
    theme: "rocky", ambient: "spores", seed: 8118, color: "#67e8f9",
    name: { en: "The Underworks", fil: "Ang Ilalim na Pasilidad" },
    camp: { x: 92, y: 400, w: 170, h: 120 }, gate: { x: 84, y: 470, dir: "vertical" },
    arena: { x: 390, y: 300, w: 500, h: 360 }, arenaName: { en: "Researcher's Transit Chamber", fil: "Silid ng Paglalakbay ng Mananaliksik" },
    monsters: [], elites: [],
    sites: [
      { x: 300, y: 230, name: { en: "Geothermal Power Vault", fil: "Imbakan ng Init sa Ilalim ng Lupa" } },
      { x: 980, y: 230, name: { en: "Aether Navigation Archive", fil: "Sinupan ng Aether Navigation" } },
      { x: 640, y: 700, name: { en: "Containment Safeguards", fil: "Mga Pananggalang sa Pasilidad" } }
    ],
    exits: [{ x: 640, y: 470, dir: "horizontal", dest: "lost", label: { en: "Unknown Teleportation Device", fil: "Di-kilalang Teleportation Device" } }],
    pathTargets: [[300,230],[980,230],[640,700],[640,470]],
    terrain(tx, ty, cols, rows, noise) {
      if (Math.hypot(tx - 40, ty - 30) < 8 || Math.hypot(tx - 40, ty - 58) < 7) return null;
      return tx < 3 || tx > cols - 4 || ty < 3 || ty > rows - 4 || noise(tx * 0.16, ty * 0.16) > 0.96 ? "wall" : null;
    },
    landmark(ctx, t, _cleared, _rift, platform) {
      const block = (x,y,w,h,c) => { ctx.fillStyle=c; ctx.fillRect(x,y,w,h); };
      block(505,350,270,250,"#263344"); block(520,365,240,220,"#334155");
      block(590,390,100,140,"#111827"); block(605,405,70,110,"#0b1220");
      block(625,420,30,65,platform?.lostDeviceOn ? "#22d3ee" : "#475569");
      ctx.strokeStyle=platform?.lostDeviceOn ? "#67e8f9" : "#64748b"; ctx.lineWidth=2;
      ctx.beginPath(); ctx.ellipse(640,455,50+Math.sin(t*2)*2,74,0,0,Math.PI*2); ctx.stroke();
      const records=platform?.lostRouteData || {};
      [[300,230,"power"],[980,230,"navigation"],[640,700,"safety"]].forEach(([x,y,id])=>{
        block(x-10,y-8,20,16,"#1e293b"); block(x-5,y-5,10,10,records[id]?"#67e8f9":"#64748b");
        block(x-3,y-3,6,6,records[id]?"#ecfeff":"#1f2937");
      });
      block(220,210,8,120,"#475569"); block(220,210,160,6,"#475569");
      block(895,210,8,120,"#475569"); block(895,210,145,6,"#475569");
    },
    text: {
      en: { arrive: "Beneath Witchlight Hollow, the late royal researcher hid a vast underground laboratory and an unregistered teleportation device. Restore its three systems before attempting activation." },
      fil: { arrive: "Sa ilalim ng Witchlight Hollow, itinago ng yumaong mananaliksik ng hari ang malawak na pasilidad sa ilalim ng lupa at isang hindi rehistradong teleportation device. Ayusin muna ang tatlong sistema nito bago ito buhayin." }
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
