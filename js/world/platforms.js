// ==================== MGA PLATFORM NG KAMPANYA (LORE Acts VII–XII) ====================
// Bawat Act ay may sariling lugar, halimaw, boss at quest item:
//   canopy  VII  Whispering Canopy        (EAST gateway)   boss: Malakor      → Blighted Heartstone
//   coast   VIII Cerulean Abyss            (WEST gateway)   boss: Leviathan    → Abyssal Helm Shard
//   frost   IX   Frostfang Precipice       (NORTH gateway)  boss: Cryonix      → Cryonix Core
//   ash     X    Ashfall Wastelands        (SOUTH gateway)  boss: Ignis        → Hellforge Reactor Core
//   siege   XI   Siege of the Citadel      (gate ng Citadel) boss: Commander   → Imperial Crest
//   maw     XII  Maw of Damnation          (lamat sa trono ng kinubkob na Citadel) boss: Satan → Astral Ash
// Ang mapa ay 1280x960 (80x60 tiles). Ang (x, y) ng camp, arena at gate ay pixel.
// Sa dialogue: {s} = pangalan ng tagapagtawag, {h} = pangalan ng bayani.

const W = 1280, H = 960;

// ---------- helper sa pagguhit ng landmark ----------
function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function ring(ctx, x, y, rx, ry, color, w = 1, dash = null) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}
function glow(ctx, x, y, r, color, alpha = 0.35) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, color.replace(")", `, ${alpha})`).replace("rgb(", "rgba("));
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

export const PLATFORMS = {
  // ==================== ACT VII ====================
  canopy: {
    id: "canopy", act: 7, tier: 2, theme: "canopy", ambient: "spores", seed: 7707, hubGate: "EAST", color: "#c77dff",
    name: { en: "Whispering Canopy", fil: "Whispering Canopy" },
    camp: { x: 560, y: 780, w: 160, h: 110 }, gate: { x: 640, y: 878 },
    arena: { x: 470, y: 100, w: 340, h: 230 }, bossSpawn: { x: 630, y: 190 }, boss: "malakor", item: "heartstone",
    arenaName: { en: "Heartwood Grove", fil: "Heartwood Grove" },
    monsters: ["sporeling", "beastman", "mossTreant", "shadowDrake", "blightHarpy", "sporeHornet", "bogSerpent", "swampCrab"],
    pathTargets: [[640, 215], [70, 470], [1210, 470]],
    terrain(tx, ty, cols, rows, noise) {
      return noise(tx * 0.12, ty * 0.12) > 0.72 ? "liquid" : null;      // itim na lusak ng dagta
    },
    landmark(ctx, t, cleared) {
      const a = this.arena, cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      // Singsing ng dambuhalang ugat sa paligid ng Heartwood Grove
      for (let k = 0; k < 14; k++) {
        const ang = (k / 14) * Math.PI * 2;
        const x = cx + Math.cos(ang) * (a.w / 2 + 6), y = cy + Math.sin(ang) * (a.h / 2 + 4);
        ctx.fillStyle = "#3b2618";
        ctx.beginPath();
        ctx.ellipse(x, y, 16, 6, ang, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#5a3d2b";
        ctx.fillRect(x - 6, y - 3, 12, 2);
        circle(ctx, x + 8, y - 5, 2, k % 2 ? "#7fffd4" : "#c77dff");
      }
      if (cleared) { glow(ctx, cx, cy, 120, "rgb(180, 220, 255)", 0.25); ring(ctx, cx, cy, 70 + Math.sin(t) * 3, 40, "rgba(200, 235, 255, 0.5)", 1, [3, 3]); }
    },
    text: {
      en: {
        arrive: ["The Whispering Canopy... the ironwood weeps black sap, {h}. Even the dryads have turned.",
          "Malakor the Blight Herald roots himself in the Heartwood Grove to the north. Break his heartstone and the forest will breathe again."],
        hint: ["Malakor waits in the Heartwood Grove, north of our camp. Beware his sporelings, and carry Edgar's panaceas."],
        deliver: ["You shattered it... the heartstone of Malakor. Look, {h}: the canopy glows for the first time in decades.",
          "The elven matriarchs have pledged their trails and armories to the Corps.",
          "...{h}. Your survival has become more vital to this kingdom — and to my own heart — than the crown itself."]
      },
      fil: {
        arrive: ["Ang Whispering Canopy... umiiyak ng itim na dagta ang mga ironwood, {h}. Pati ang mga dryad ay nabago na.",
          "Nag-ugat si Malakor, ang Tagapagbalita ng Salot, sa Heartwood Grove sa hilaga. Basagin mo ang kanyang heartstone at muling hihinga ang gubat."],
        hint: ["Naghihintay si Malakor sa Heartwood Grove, hilaga ng ating kampo. Mag-ingat sa kanyang mga sporeling at magdala ng panacea ni Edgar."],
        deliver: ["Nabasag mo... ang heartstone ni Malakor. Tingnan mo, {h}: kumikinang na ang canopy sa unang pagkakataon sa loob ng maraming dekada.",
          "Nangako na ang mga elven matriarch ng kanilang mga daanan at armory sa Corps.",
          "...{h}. Mas mahalaga na sa kaharian — at sa aking puso — ang iyong kaligtasan kaysa sa korona mismo."]
      }
    }
  },

  // ==================== ACT VIII ====================
  coast: {
    id: "coast", act: 8, tier: 3, theme: "coast", ambient: "storm", seed: 8808, hubGate: "WEST", color: "#38bdf8",
    name: { en: "Cerulean Abyss", fil: "Cerulean Abyss" },
    camp: { x: 990, y: 410, w: 170, h: 120 }, gate: { x: 1196, y: 470, dir: "vertical" },
    arena: { x: 290, y: 370, w: 270, h: 220 }, bossSpawn: { x: 300, y: 470 }, boss: "leviathan", item: "abyssHelm",
    arenaName: { en: "Sunken Altar", fil: "Lubog na Altar" },
    monsters: ["reefCrab", "mariner", "coralGolem", "stormPetrel", "drownedSpecter", "tideSlime", "tideSerpent", "siren", "deepKraken"],
    pathTargets: [[425, 480], [700, 60], [700, 900]],
    terrain(tx, ty, cols, rows, noise) {
      if (tx < 15 + noise(0, ty * 0.1) * 6) return "liquid";                 // dagat sa kanluran
      if (ty > rows - 7 - noise(tx * 0.1, 0, 3) * 4) return "liquid";         // baybayin sa timog
      if (noise(tx * 0.15, ty * 0.15, 5) > 0.8) return "liquid";              // tide pools
      return null;
    },
    landmark(ctx, t, cleared) {
      // Ang nakalimutang celestial monolith sa gitna ng dagat (lumilitaw ang liwanag pagkatalo sa Leviathan)
      const x = 120, y = 210;
      ctx.fillStyle = "#2f3e4a";
      ctx.beginPath();
      ctx.moveTo(x - 12, y + 30); ctx.lineTo(x - 9, y - 26); ctx.lineTo(x + 4, y - 34); ctx.lineTo(x + 12, y + 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#46586a";
      ctx.fillRect(x - 8, y - 24, 3, 50);
      const on = cleared ? 1 : 0.25;
      ring(ctx, x, y, 7, 7, `rgba(94, 231, 255, ${on})`, 1.5);
      ring(ctx, x, y, 3, 3, `rgba(94, 231, 255, ${on})`, 1.5);
      if (cleared) {
        ring(ctx, x, y + 34, 50 + Math.sin(t) * 4, 14, "rgba(94, 231, 255, 0.6)", 1.5, [4, 3]);
        ring(ctx, x, y + 34, 30, 8, "rgba(94, 231, 255, 0.4)", 1);
        glow(ctx, x, y, 90, "rgb(94, 231, 255)", 0.3);
      }
    },
    text: {
      en: {
        arrive: ["The Cerulean Abyss. Abyssal rifts poison the brine, and drowned mariners walk the tide again.",
          "The Leviathan Regent rules from the Sunken Altar on the western sandbar. End its hold on the tides, {h}."],
        hint: ["The Leviathan Regent rises from the sea by the Sunken Altar, west of camp. Its tidal magic stuns — keep moving."],
        deliver: ["The sea has parted... and a celestial monolith stands where the Regent fell. The currents are calm again.",
          "Come here, {h}. The wind is cold — share this cloak with me.",
          "Whatever the cost, we end this war side by side... or we fall together. That is my vow."]
      },
      fil: {
        arrive: ["Ang Cerulean Abyss. Nilalason ng mga abyssal rift ang alat ng dagat, at muling naglalakad ang mga nalunod na mandaragat.",
          "Naghahari ang Leviathan Regent mula sa Lubog na Altar sa kanlurang sandbar. Tapusin mo ang hawak nito sa alon, {h}."],
        hint: ["Umaahon ang Leviathan Regent mula sa dagat malapit sa Lubog na Altar, kanluran ng kampo. Nakakakuryente ang mahika nito — huwag tumigil sa paggalaw."],
        deliver: ["Nahati ang dagat... at may celestial monolith kung saan bumagsak ang Regent. Tahimik na muli ang agos.",
          "Halika, {h}. Malamig ang hangin — pagsaluhan natin ang balabal na ito.",
          "Anuman ang kapalit, tatapusin natin ang digmaang ito nang magkasama... o sabay tayong babagsak. Iyan ang aking panata."]
      }
    }
  },

  // ==================== ACT IX ====================
  frost: {
    id: "frost", act: 9, tier: 4, theme: "frost", ambient: "blizzard", seed: 9909, hubGate: "NORTH", color: "#bfe9ff",
    name: { en: "Frostfang Precipice", fil: "Frostfang Precipice" },
    camp: { x: 100, y: 760, w: 180, h: 110 }, gate: { x: 190, y: 878 },
    arena: { x: 880, y: 90, w: 300, h: 210 }, bossSpawn: { x: 1020, y: 170 }, boss: "cryonix", item: "cryoCore",
    arenaName: { en: "Glacial Crest", fil: "Glacial Crest" },
    monsters: ["yeti", "iceGolem", "frostStalker", "wyvern", "blizzardHawk", "frostGargoyle", "frostSerpent", "frozenCrab"],
    pathTargets: [[1030, 200], [640, 470], [1210, 820], [640, 60]],
    terrain(tx, ty, cols, rows, noise) {
      if (noise(tx * 0.09, ty * 0.09) > 0.7) return "wall";                     // bangin
      if (noise(tx * 0.14, ty * 0.14, 5) > 0.8) return "liquid";                // nagyelong lawa
      return null;
    },
    landmark(ctx, t, cleared) {
      // Watchtower ng Glacial Crest at ang ice spire ni Cryonix
      const x = 1120, y = 70;
      ctx.fillStyle = "#44566b"; ctx.fillRect(x - 14, y - 10, 28, 46);
      ctx.fillStyle = "#6b819a"; ctx.fillRect(x - 14, y - 10, 28, 3);
      for (let k = 0; k < 4; k++) { ctx.fillStyle = "#44566b"; ctx.fillRect(x - 14 + k * 8, y - 16, 5, 6); }
      ctx.fillStyle = "#8a2c2c"; ctx.fillRect(x - 4, y + 4, 8, 14);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(x - 1, y + 8, 2, 4);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 15, y - 11, 30, 2);
      if (!cleared) {
        const sx = 960, sy = 110;
        ctx.fillStyle = "#bfe9ff";
        ctx.beginPath(); ctx.moveTo(sx - 12, sy + 40); ctx.lineTo(sx, sy - 30); ctx.lineTo(sx + 12, sy + 40); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#ffffff"; ctx.fillRect(sx - 2, sy - 20, 2, 50);
        glow(ctx, sx, sy, 50, "rgb(191, 233, 255)", 0.3);
      } else {
        glow(ctx, 1030, 190, 110, "rgb(255, 214, 150)", 0.18);
      }
    },
    text: {
      en: {
        arrive: ["The Frostfang Range. Satan's lieutenants hold the alpine watchtowers — they mean to bury the lowlands in eternal winter.",
          "Frost Empress Cryonix waits at the Glacial Crest, northeast. Stay near the braziers, {h}. Frost freeze kills slowly."],
        hint: ["Cryonix holds the Glacial Crest to the northeast. Dodge her ice lances and break free of the frost quickly."],
        deliver: ["The blizzard is breaking... the northern rivers will flow again.",
          "My hands... no, it's only frostbite. Stay by the hearth with me a while.",
          "Tell me about Earth again, {h} — your cities, your towers of glass. In your arms I have found a home."]
      },
      fil: {
        arrive: ["Ang Frostfang Range. Hawak ng mga tenyente ni Satan ang mga alpine watchtower — balak nilang ibaon ang kapatagan sa walang hanggang taglamig.",
          "Naghihintay si Frost Empress Cryonix sa Glacial Crest, hilagang-silangan. Manatili malapit sa mga brazier, {h}. Dahan-dahang pumapatay ang lamig."],
        hint: ["Hawak ni Cryonix ang Glacial Crest sa hilagang-silangan. Iwasan ang kanyang mga ice lance at kumawala agad sa yelo."],
        deliver: ["Humuhupa na ang bagyo ng niyebe... muling dadaloy ang mga ilog sa hilaga.",
          "Ang mga kamay ko... hindi, lamig lang ito. Manatili ka muna sa tabi ko, sa harap ng apoy.",
          "Ikuwento mo ulit ang Daigdig, {h} — ang inyong mga lungsod at gusaling salamin. Sa iyong mga bisig, natagpuan ko ang tahanan."]
      }
    }
  },

  // ==================== ACT X ====================
  ash: {
    id: "ash", act: 10, tier: 5, theme: "ash", ambient: "embers", seed: 10110, hubGate: "SOUTH", color: "#ff7a1a",
    name: { en: "Ashfall Wastelands", fil: "Ashfall Wastelands" },
    camp: { x: 980, y: 770, w: 180, h: 110 }, gate: { x: 1070, y: 878 },
    arena: { x: 110, y: 110, w: 330, h: 220 }, bossSpawn: { x: 260, y: 200 }, boss: "ignis", item: "forgeCore",
    arenaName: { en: "Hellforge", fil: "Hellforge" },
    monsters: ["obsidianGolem", "demonKnight", "hellHound", "imp", "magmaDrake", "fireGargoyle", "lavaSerpent", "lavaCrab"],
    pathTargets: [[275, 220], [640, 90], [1210, 420], [300, 860]],
    terrain(tx, ty, cols, rows, noise) {
      const center = rows * 0.5 + Math.sin(tx * 0.11) * 6 - (tx - cols / 2) * 0.25;
      if (Math.abs(ty - center) < 2.2 + noise(tx * 0.2, 0, 7) * 1.5) return "liquid";   // ilog ng lava
      if (noise(tx * 0.15, ty * 0.15, 9) > 0.8) return "liquid";                          // lawa ng magma
      return null;
    },
    landmark(ctx, t, cleared) {
      // Pader ng Hellforge sa likod ng arena at ang hukay ng apoy
      const a = this.arena;
      ctx.fillStyle = "#15101a"; ctx.fillRect(a.x - 10, a.y - 70, a.w + 20, 60);
      for (let k = 0; k < 12; k++) { ctx.fillStyle = "#15101a"; ctx.fillRect(a.x - 10 + k * 30, a.y - 80, 16, 12); }
      for (let k = 0; k < 6; k++) { ctx.fillStyle = "#8a2c2c"; ctx.fillRect(a.x + 20 + k * 52, a.y - 60, 8, 22); ctx.fillStyle = "#ffd166"; ctx.fillRect(a.x + 23 + k * 52, a.y - 54, 2, 4); }
      const fx = a.x + a.w / 2, fy = a.y + a.h / 2;
      ring(ctx, fx, fy, 60, 30, "#2b2b33", 6);
      if (!cleared) {
        glow(ctx, fx, fy, 80, "rgb(255, 122, 26)", 0.45);
        ring(ctx, fx, fy, 56, 27, `rgba(255, 170, 60, ${0.6 + Math.sin(t * 2) * 0.3})`, 2);
      } else {
        ctx.fillStyle = "rgba(120, 120, 120, 0.25)";
        for (let k = 0; k < 5; k++) circle(ctx, fx - 30 + k * 15, fy - 10 - ((t * 10 + k * 7) % 30), 5, "rgba(130,130,130,0.25)");
      }
    },
    text: {
      en: {
        arrive: ["The Ashfall Wastelands. The air burns the throat — drink Edgar's tinctures and keep your buckler high.",
          "Ignis the Iron Lord guards the Hellforge to the northwest. Destroy its reactor and Satan's legion loses its steel."],
        hint: ["The Hellforge lies northwest, across the lava river. Ignis's hammer sends fire through the ground — keep your distance when he raises it."],
        deliver: ["Four of Satan's bastions have fallen to our united will, {h}.",
          "You're covered in soot... and so am I. Come here.",
          "Only one terrible march remains. Whatever waits at the capital, I face it with you."]
      },
      fil: {
        arrive: ["Ang Ashfall Wastelands. Sinusunog ng hangin ang lalamunan — inumin ang tincture ni Edgar at itaas ang iyong buckler.",
          "Binabantayan ni Ignis, ang Panginoong Bakal, ang Hellforge sa hilagang-kanluran. Wasakin ang reactor nito at mawawalan ng bakal ang hukbo ni Satan."],
        hint: ["Nasa hilagang-kanluran ang Hellforge, lampas sa ilog ng lava. Nagpapadala ng apoy sa lupa ang martilyo ni Ignis — lumayo kapag itinaas niya ito."],
        deliver: ["Apat sa mga kuta ni Satan ang bumagsak sa ating nagkakaisang loob, {h}.",
          "Puno ka ng uling... ako rin. Halika rito.",
          "Isang kakila-kilabot na martsa na lang ang natitira. Anuman ang naghihintay sa kabisera, haharapin ko ito kasama ka."]
      }
    }
  },

  // ==================== ACT XI ====================
  siege: {
    id: "siege", act: 11, tier: 6, theme: "siege", ambient: "siege", seed: 11111, hubGate: "CITADEL", color: "#ef4444",
    name: { en: "Siege of the Imperial Citadel", fil: "Pagkubkob sa Imperial Citadel" },
    camp: { x: 560, y: 790, w: 160, h: 110 }, gate: { x: 640, y: 878 },
    arena: { x: 470, y: 90, w: 340, h: 210 }, bossSpawn: { x: 630, y: 170 }, boss: "commander", item: "imperialCrest",
    arenaName: { en: "Throne Hall", fil: "Bulwagan ng Trono" },
    monsters: ["shockTrooper", "voidSpider", "demonKnight", "abyssalJuggernaut", "shadowDrake", "chaosGargoyle", "specter", "voidSerpent", "corruptedCrab"],
    pathTargets: [[640, 200], [170, 500], [1110, 500]],
    // Lamat patungo sa Maw of Damnation (bumubukas pagkatapos matalo ang Commander)
    rift: { x: 640, y: 150, dest: "maw" },
    terrain(tx, ty, cols) {
      const breach = (tx >= 37 && tx <= 42) || (tx >= 17 && tx <= 20) || (tx >= 58 && tx <= 61);
      if ((ty === 21 || ty === 22) && tx >= 8 && tx <= cols - 9 && !breach) return "wall";        // panlabas na pader
      if ((tx === 8 || tx === 9 || tx === cols - 10 || tx === cols - 9) && ty >= 21 && ty <= 50 && !(ty >= 34 && ty <= 38)) return "wall";
      return null;
    },
    landmark(ctx, t, cleared, riftOpen) {
      const a = this.arena, cx = a.x + a.w / 2;
      // pulang karpet at trono
      ctx.fillStyle = "#6b1a24"; ctx.fillRect(cx - 14, a.y + 30, 28, a.h + 40);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(cx - 14, a.y + 30, 2, a.h + 40); ctx.fillRect(cx + 12, a.y + 30, 2, a.h + 40);
      ctx.fillStyle = "#5e3b1a"; ctx.fillRect(cx - 12, a.y - 6, 24, 30);
      ctx.fillStyle = "#8a2c2c"; ctx.fillRect(cx - 8, a.y, 16, 16);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(cx - 12, a.y - 10, 24, 4);
      [[-80, 0], [80, 0], [-150, 20], [150, 20]].forEach(([dx, dy]) => {
        ctx.fillStyle = "#8a2c2c"; ctx.fillRect(cx + dx - 6, a.y + dy - 20, 12, 26);
        ctx.fillStyle = "#ffd166"; ctx.fillRect(cx + dx - 2, a.y + dy - 12, 4, 6);
      });
      // mga nasusunog na brazier at tirador sa labas ng pader
      [[140, 420], [1140, 420], [300, 640], [980, 640]].forEach(([x, y], k) => {
        ctx.fillStyle = "#5e3b1a"; ctx.fillRect(x - 10, y, 20, 6); ctx.fillRect(x - 2, y - 18, 3, 18);
        ctx.strokeStyle = "#5e3b1a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x + (k % 2 ? -14 : 14), y - 26); ctx.stroke();
        circle(ctx, x + (k % 2 ? -14 : 14), y - 27, 3, "#3a2f3f");
      });
      if (riftOpen) {
        const r = 16 + Math.sin(t * 2) * 2;
        glow(ctx, this.rift.x, this.rift.y, 60, "rgb(157, 78, 221)", 0.5);
        ring(ctx, this.rift.x, this.rift.y, r, r * 1.4, "#c77dff", 2);
        ring(ctx, this.rift.x, this.rift.y, r * 0.5, r * 0.8, "#ffffff", 1, [2, 2]);
      }
      if (cleared) glow(ctx, cx, a.y + 10, 70, "rgb(255, 209, 102)", 0.2);
    },
    text: {
      en: {
        arrive: ["The capital burns... siege engines hurl miasmic boulders at the ramparts. We hold the breach here, {h}!",
          "Captain Ronald and the Royal Guard stand with us. A demon commander has breached the Throne Hall — my father is in there!"],
        hint: ["The Demon Commander is in the Throne Hall, north past the broken gates. Hurry, {h}!"],
        deliver: ["Father... his last words passed the Imperial Crest to me.",
          "Then let it be done. Before the nobles, the generals and every survivor of the Corps, I name you Supreme Sovereign Champion — and true partner of the throne.",
          "A rift has torn open behind the throne. It leads to the Maw of Damnation. Satan awaits us there."]
      },
      fil: {
        arrive: ["Nasusunog ang kabisera... bumabato ang mga siege engine ng mga batong may miasma sa mga pader. Dito natin ipagtanggol ang lamat, {h}!",
          "Kasama natin si Kapitan Ronald at ang Royal Guard. May heneral ng mga demonyo na nakapasok sa Bulwagan ng Trono — naroon ang aking ama!"],
        hint: ["Nasa Bulwagan ng Trono ang Heneral ng mga Demonyo, sa hilaga lampas sa sirang gate. Bilisan mo, {h}!"],
        deliver: ["Ama... sa kanyang huling salita, ipinasa niya sa akin ang Imperial Crest.",
          "Kung gayon, gawin na natin. Sa harap ng mga maharlika, heneral at lahat ng nakaligtas sa Corps, itinatalaga kitang Supreme Sovereign Champion — at tunay na katuwang ng trono.",
          "May lamat na bumukas sa likod ng trono. Patungo ito sa Maw of Damnation. Naghihintay doon si Satan."]
      }
    }
  },

  // ==================== ACT XII ====================
  maw: {
    id: "maw", act: 12, tier: 7, theme: "maw", ambient: "void", seed: 12121, hubGate: "RIFT", color: "#9d4edd",
    name: { en: "Maw of Damnation", fil: "Maw of Damnation" },
    camp: { x: 560, y: 790, w: 160, h: 100 }, gate: { x: 640, y: 874 },
    arena: { x: 460, y: 170, w: 360, h: 230 }, bossSpawn: { x: 630, y: 270 }, boss: "satan", item: "astralAsh",
    arenaName: { en: "Obsidian Dais", fil: "Obsidian Dais" },
    monsters: ["demonKnight", "obsidianGolem", "abyssalJuggernaut", "specter", "magmaDrake", "chaosGargoyle", "voidSerpent", "deepKraken", "bogSerpent"],
    pathTargets: [[640, 290], [240, 560], [1040, 560], [640, 600]],
    islands: [[640, 840, 150, 90], [640, 290, 280, 190], [240, 560, 150, 110], [1040, 560, 150, 110], [640, 600, 110, 70]],
    terrain(tx, ty, cols, rows, noise) {
      const x = tx * 16 + 8, y = ty * 16 + 8;
      const wob = (noise(tx * 0.25, ty * 0.25) - 0.5) * 0.5;
      const land = this.islands.some(([cx, cy, rx, ry]) => inEllipse(x, y, cx, cy, rx * (1 + wob), ry * (1 + wob)));
      return land ? null : "liquid";                                            // walang hanggang void
    },
    landmark(ctx, t, cleared) {
      const a = this.arena, cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      ring(ctx, cx, cy, 120, 70, "rgba(157, 78, 221, 0.6)", 2);
      ring(ctx, cx, cy, 90, 52, "rgba(255, 122, 26, 0.5)", 1, [5, 4]);
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2 + t * 0.1;
        circle(ctx, cx + Math.cos(ang) * 105, cy + Math.sin(ang) * 61, 2, "#ff7a1a");
      }
      if (cleared) glow(ctx, cx, cy, 200, "rgb(255, 220, 140)", 0.35);
    },
    text: {
      en: {
        arrive: ["The Maw of Damnation... the sky has ceased to exist.",
          "Demon Lord Satan waits upon the obsidian dais at the heart of the vortex. Whatever happens, {h} — I am at your side."],
        hint: ["Satan waits on the great obsidian dais to the north. He will unleash all seven blights. I will chant for you — go!"],
        deliver: ["It's over... the miasma is unraveling. Look — a true dawn over Aethelgard.",
          "The Celestial Portals chime... the way back to Earth is open, {h}. Your old life is waiting.",
          "...You're staying? Then take my hand. Together we will lead Aethelgard into an age of unbroken peace."]
      },
      fil: {
        arrive: ["Ang Maw of Damnation... wala na ang langit.",
          "Naghihintay si Demon Lord Satan sa obsidian dais sa puso ng ipu-ipo. Anuman ang mangyari, {h} — nasa tabi mo ako."],
        hint: ["Naghihintay si Satan sa malaking obsidian dais sa hilaga. Ilalabas niya ang pitong sumpa. Aawit ako para sa iyo — humayo ka!"],
        deliver: ["Tapos na... nalulusaw na ang miasma. Tingnan mo — isang tunay na bukang-liwayway sa Aethelgard.",
          "Tumutunog ang mga Celestial Portal... bukas na ang daan pabalik sa Daigdig, {h}. Naghihintay ang dati mong buhay.",
          "...Mananatili ka? Kung gayon, hawakan mo ang aking kamay. Magkasama nating pamumunuan ang Aethelgard sa panahon ng walang patid na kapayapaan."]
      }
    }
  }
};

export const PLATFORM_ORDER = ["canopy", "coast", "frost", "ash", "siege", "maw"];
export const PLATFORM_SIZE = { w: W, h: H };
