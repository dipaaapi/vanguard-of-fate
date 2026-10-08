import { GFX } from "../settings.js";

// ==================== CAMPAIGN PLATFORMS (LORE Acts VII–XV) ====================
// Each Act has its own place, monsters (5 regular + 4 elite kinds), sites to scout, boss and quest item:
//   canopy  VII  Whispering Canopy        (EAST gateway)   boss: Malakor      → Blighted Heartstone
//   coast   VIII Cerulean Abyss            (WEST gateway)   boss: Leviathan    → Abyssal Helm Shard
//   frost   IX   Frostfang Precipice       (NORTH gateway)  boss: Cryonix      → Cryonix Core
//   ash     X    Ashfall Wastelands        (SOUTH gateway)  boss: Ignis        → Hellforge Reactor Core
//   strand  XI   The Lamenting Strand      (Dark Continent, via the Celestial Monolith) boss: Dolora → Urn of Black Tears
//   ossuary XII  The Ossuary Fields        (road east from the Strand)       boss: Morgrave    → Lantern Knight's Visor
//   siege   XIII Siege of the Obsidian Citadel (war road north from the Ossuary) boss: Commander → Imperial Crest
//   chainspire XIV The Chainspire Descent  (rift behind the Obsidian throne) boss: Vorgath     → Warden's Key
//   maw     XV   Maw of Damnation          (the last gate at the foot of the Chainspire) boss: Satan → Astral Ash
// A `rift` (dest = the next platform) opens once the next Act is unlocked; `road: true` draws it as a road.
// The map is 1280x960 (80x60 tiles). Camp, arena and gate (x, y) are in pixels.
// In dialogue: {s} = the summoner's name, {h} = the hero's name.

const W = 1280, H = 960;

// ---------- landmark drawing helpers ----------
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
  if (!GFX.glow) return;     // Options → Glow & Light
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, color.replace(")", `, ${alpha})`).replace("rgb(", "rgba("));
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

// Seal Stones needed by the Celestial Monolith (dropped by the bosses of Acts VII–X)
export const SEAL_STONES = ["sylvanSeal", "tideSeal", "frostSeal", "emberSeal"];

export const PLATFORMS = {
  // ==================== ACT VII ====================
  canopy: {
    id: "canopy", act: 7, tier: 2, theme: "canopy", ambient: "spores", seed: 7707, hubGate: "EAST", color: "#c77dff", seal: "sylvanSeal",
    name: { en: "Whispering Canopy", fil: "Whispering Canopy" },
    camp: { x: 560, y: 780, w: 160, h: 110 }, gate: { x: 640, y: 878 },
    arena: { x: 470, y: 100, w: 340, h: 230 }, bossSpawn: { x: 630, y: 190 }, boss: "malakor", item: "heartstone",
    arenaName: { en: "Heartwood Grove", fil: "Heartwood Grove" },
    monsters: ["sporeling", "beastman", "mossTreant", "blightHarpy", "sporeHornet"],
    elites: ["rotheartDryad", "beastmanChieftain", "thornbackBehemoth", "miasmaHiveQueen"],
    sites: [{ x: 180, y: 300, name: { en: "Hollow Ironwood", fil: "Hungkag na Ironwood" } }, { x: 1080, y: 280, name: { en: "Dryad Ring", fil: "Bilog ng mga Dryad" } }, { x: 1000, y: 700, name: { en: "Spore Hollow", fil: "Lungga ng mga Spore" } }],
    trail: { x: 1196, y: 470, dir: "vertical", dest: "swamp" },   // gate to the frontier map (js/world/frontiers.js)
    pathTargets: [[640, 215], [70, 470], [1210, 470]],
    terrain(tx, ty, cols, rows, noise) {
      return noise(tx * 0.12, ty * 0.12) > 0.72 ? "liquid" : null;      // black pools of sap
    },
    landmark(ctx, t, cleared) {
      const a = this.arena, cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      // A ring of giant roots around the Heartwood Grove
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
          "The elven matriarchs have pledged their trails and armories to the Vanguard.",
          "...{h}. Your survival has become more vital to this kingdom — and to my own heart — than the crown itself."]
      },
      fil: {
        arrive: ["Ang Whispering Canopy... umiiyak ng itim na dagta ang mga ironwood, {h}. Pati ang mga dryad ay nabago na.",
          "Nag-ugat si Malakor, ang Tagapagbalita ng Salot, sa Heartwood Grove sa hilaga. Basagin mo ang kanyang heartstone at muling hihinga ang gubat."],
        hint: ["Naghihintay si Malakor sa Heartwood Grove, hilaga ng ating kampo. Mag-ingat sa kanyang mga sporeling at magdala ng panacea ni Edgar."],
        deliver: ["Nabasag mo... ang heartstone ni Malakor. Tingnan mo, {h}: kumikinang na ang canopy sa unang pagkakataon sa loob ng maraming dekada.",
          "Nangako na ang mga elven matriarch ng kanilang mga daanan at armory sa Vanguard.",
          "...{h}. Mas mahalaga na sa kaharian — at sa aking puso — ang iyong kaligtasan kaysa sa korona mismo."]
      }
    }
  },

  // ==================== ACT VIII ====================
  coast: {
    id: "coast", act: 8, tier: 3, theme: "coast", ambient: "storm", seed: 8808, hubGate: "WEST", color: "#38bdf8", seal: "tideSeal",
    name: { en: "Cerulean Abyss", fil: "Cerulean Abyss" },
    camp: { x: 990, y: 410, w: 170, h: 120 }, gate: { x: 1196, y: 470, dir: "vertical" },
    arena: { x: 290, y: 370, w: 270, h: 220 }, bossSpawn: { x: 300, y: 470 }, boss: "leviathan", item: "abyssHelm",
    arenaName: { en: "Sunken Altar", fil: "Lubog na Altar" },
    monsters: ["reefCrab", "mariner", "coralGolem", "stormPetrel", "tideSlime"],
    elites: ["siren", "drownedSpecter", "drownedCaptain", "abyssalKraken"],
    sites: [{ x: 820, y: 200, name: { en: "Wrecked Galleon", fil: "Nawasak na Galyon" } }, { x: 1100, y: 120, name: { en: "Lighthouse Ruin", fil: "Guho ng Parola" } }, { x: 760, y: 720, name: { en: "Pearl Shoals", fil: "Bahura ng Perlas" } }],
    pathTargets: [[425, 480], [700, 60], [700, 900]],
    // The boat waits at the end of the stone causeway heading south (path to [700, 900]).
    // The boat's monolith is the landmark's Celestial Monolith itself (x 120, y 210) in the western sea.
    boat: {
      pier: { x: 664, y: 882 }, dockedBoat: { x: 634, y: 868 },
      monolith: { x: 120, y: 210 }, seaPortal: { x: 185, y: 260 }, seals: SEAL_STONES
    },
    terrain(tx, ty, cols, rows, noise) {
      if (tx < 15 + noise(0, ty * 0.1) * 6) return "liquid";                 // sea to the west
      if (ty > rows - 7 - noise(tx * 0.1, 0, 3) * 4) return "liquid";         // shore to the south
      if (noise(tx * 0.15, ty * 0.15, 5) > 0.8) return "liquid";              // tide pools
      return null;
    },
    landmark(ctx, t, cleared, riftOpen, plat) {
      // The Celestial Monolith in the western sea (styled after the Act VIII banner): a slanted stone slab
      // with a rune target on its face, a halo and rune circles on the water.
      // States: chained (Leviathan Regent alive) → unchained, dim (waiting for the Seal Stones) → lit (awakened).
      const x = 120, y = 210, base = y + 30, fy = y - 8;   // fy = centre of the runes on the face
      const lit = Boolean(plat && plat.boatSystem && plat.boatSystem.monolith.activated);
      const on = lit ? 0.75 + Math.sin(t * 2) * 0.2 : cleared ? 0.35 + Math.sin(t * 1.5) * 0.12 : 0.18;
      const cyan = (a) => `rgba(94, 231, 255, ${a})`;

      // 1. Rune circles on the water (glyphs orbit on the outer ring)
      if (lit) glow(ctx, x, base, 80, "rgb(94, 231, 255)", 0.25);
      ring(ctx, x, base, 58, 15, cyan(on * 0.9), 1.5);
      ring(ctx, x, base, 50, 12, cyan(on * 0.6), 1);
      ring(ctx, x, base, 32, 8, cyan(on * 0.8), 1.5);
      ring(ctx, x, base, 18, 4.5, cyan(on * 0.6), 1);
      ctx.fillStyle = cyan(on);
      for (let i = 0; i < 18; i++) {
        const a = t * 0.15 + (i / 18) * Math.PI * 2;
        const gx = Math.round(x + Math.cos(a) * 54), gy = Math.round(base + Math.sin(a) * 13.5);
        if (i % 3 === 0) ctx.fillRect(gx - 1, gy, 3, 1);
        else if (i % 3 === 1) { ctx.fillRect(gx, gy - 1, 1, 3); ctx.fillRect(gx + 1, gy, 1, 1); }
        else { ctx.fillRect(gx - 1, gy - 1, 1, 1); ctx.fillRect(gx + 1, gy + 1, 1, 1); ctx.fillRect(gx, gy, 1, 1); }
      }

      // 2. Broken rocks at the foot (right and left)
      ctx.fillStyle = "#3c4858";
      ctx.beginPath();
      ctx.moveTo(x + 9, base); ctx.lineTo(x + 12, base - 18); ctx.lineTo(x + 17, base - 24); ctx.lineTo(x + 22, base - 10); ctx.lineTo(x + 24, base);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#566478";
      ctx.fillRect(x + 13, base - 18, 2, 14);
      ctx.fillStyle = "#34404f";
      ctx.beginPath();
      ctx.moveTo(x - 20, base); ctx.lineTo(x - 17, base - 7); ctx.lineTo(x - 12, base - 9); ctx.lineTo(x - 10, base);
      ctx.closePath(); ctx.fill();

      // 3. The main slab: slanted top, higher on the right
      ctx.fillStyle = "#1e2733";
      ctx.beginPath();
      ctx.moveTo(x - 14, base + 1); ctx.lineTo(x - 13, y - 26); ctx.lineTo(x - 5, y - 33); ctx.lineTo(x + 7, y - 44);
      ctx.lineTo(x + 12, y - 38); ctx.lineTo(x + 14, base + 1);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#5b6b7e";
      ctx.beginPath();
      ctx.moveTo(x - 12, base); ctx.lineTo(x - 11, y - 25); ctx.lineTo(x - 4, y - 31); ctx.lineTo(x + 7, y - 41);
      ctx.lineTo(x + 11, y - 37); ctx.lineTo(x + 12, base);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#7a8aa0";                                   // lit left edge
      ctx.fillRect(x - 11, y - 24, 3, base - (y - 24));
      ctx.fillStyle = "#44526a";                                   // shaded right edge
      ctx.fillRect(x + 8, y - 36, 4, base - (y - 36));
      ctx.fillStyle = "#4a586c";                                   // cracks
      ctx.fillRect(x - 6, y - 20, 1, 6); ctx.fillRect(x - 5, y - 14, 1, 4);
      ctx.fillRect(x + 4, y + 8, 1, 7); ctx.fillRect(x + 3, y + 15, 1, 5);

      // 4. Rune target on the face, with light running down to the water
      if (lit) glow(ctx, x, fy, 34, "rgb(94, 231, 255)", 0.45);
      ring(ctx, x, fy, 8, 8, cyan(on), 1.5);
      ring(ctx, x, fy, 4.5, 4.5, cyan(on), 1.5);
      ctx.fillStyle = cyan(on);
      ctx.fillRect(x - 1, fy - 1, 2, 2);
      ctx.fillStyle = cyan(on * 0.5);
      ctx.fillRect(x - 7, fy + 10, 1, base - fy - 12);
      ctx.fillRect(x + 6, fy + 10, 1, base - fy - 12);
      // Halo around the slab once awakened
      if (lit) {
        ring(ctx, x, fy, 22 + Math.sin(t * 2) * 1.5, 22 + Math.sin(t * 2) * 1.5, cyan(0.55), 1);
        ring(ctx, x, fy, 26, 26, cyan(0.2), 1);
      }

      // 5. Surf foam at the foot
      ctx.fillStyle = "rgba(230, 250, 255, 0.85)";
      for (let i = 0; i < 9; i++) {
        const fx = x - 20 + i * 5 + Math.round(Math.sin(t * 3 + i) * 1.5);
        ctx.fillRect(fx, base - (i % 2), 3, 1);
      }

      // 6. Chains of the Leviathan Regent: two diagonal chains crossing the slab plus a band,
      //    anchored to the sea floor on both sides. They vanish once the Regent is defeated.
      if (!cleared) {
        const link = (x0, y0, x1, y1) => {
          const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4);
          for (let i = 0; i <= n; i++) {
            const k = i / n, lx = Math.round(x0 + (x1 - x0) * k), ly = Math.round(y0 + (y1 - y0) * k);
            ctx.fillStyle = "#2a2f38";
            if (i % 2) ctx.fillRect(lx - 2, ly - 1, 4, 3); else ctx.fillRect(lx - 1, ly - 2, 3, 4);
            ctx.fillStyle = "#8a93a3";
            if (i % 2) ctx.fillRect(lx - 1, ly - 1, 2, 1); else ctx.fillRect(lx, ly - 1, 1, 2);
          }
        };
        link(x - 26, base + 2, x + 10, y - 30);
        link(x + 26, base + 2, x - 10, y - 26);
        link(x - 15, y + 2, x + 15, y + 2);
        // rusted anchor rings where the chains meet the water
        [[x - 26, base + 2], [x + 26, base + 2]].forEach(([ax, ay]) => {
          ctx.fillStyle = "#5a3d2e"; ctx.fillRect(ax - 2, ay - 1, 5, 3);
          ctx.fillStyle = "#9a6b4a"; ctx.fillRect(ax - 1, ay - 1, 3, 1);
        });
        // a faint red pulse of the Regent's binding
        glow(ctx, x, fy, 30, "rgb(239, 68, 68)", 0.12 + Math.sin(t * 2) * 0.05);
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
    id: "frost", act: 9, tier: 4, theme: "frost", ambient: "blizzard", seed: 9909, hubGate: "NORTH", color: "#bfe9ff", seal: "frostSeal",
    name: { en: "Frostfang Precipice", fil: "Frostfang Precipice" },
    camp: { x: 100, y: 760, w: 180, h: 110 }, gate: { x: 190, y: 878 },
    arena: { x: 880, y: 90, w: 300, h: 210 }, bossSpawn: { x: 1020, y: 170 }, boss: "cryonix", item: "cryoCore",
    arenaName: { en: "Glacial Crest", fil: "Glacial Crest" },
    monsters: ["yeti", "iceGolem", "frostStalker", "wyvern", "frozenCrab"],
    elites: ["frostGargoyle", "frostSerpent", "rimeJotun", "glacierWitch"],
    sites: [{ x: 300, y: 240, name: { en: "Frozen Shrine", fil: "Nagyelong Dambana" } }, { x: 640, y: 640, name: { en: "Mammoth Graveyard", fil: "Libingan ng mga Mammoth" } }, { x: 900, y: 520, name: { en: "Icefall Bridge", fil: "Tulay ng Talong-Yelo" } }],
    trail: { x: 1196, y: 820, dir: "vertical", dest: "mountain" },   // gate to the frontier map (js/world/frontiers.js)
    pathTargets: [[1030, 200], [640, 470], [1210, 820], [640, 60]],
    terrain(tx, ty, cols, rows, noise) {
      if (noise(tx * 0.09, ty * 0.09) > 0.7) return "wall";                     // cliffs
      if (noise(tx * 0.14, ty * 0.14, 5) > 0.8) return "liquid";                // frozen lake
      return null;
    },
    landmark(ctx, t, cleared) {
      // The Glacial Crest watchtower and Cryonix's ice spire
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
    id: "ash", act: 10, tier: 5, theme: "ash", ambient: "embers", seed: 10110, hubGate: "SOUTH", color: "#ff7a1a", seal: "emberSeal",
    name: { en: "Ashfall Wastelands", fil: "Ashfall Wastelands" },
    // The camp is Emberhold, a walled dwarven village (safe zone); see Platform.drawVillage
    camp: { x: 880, y: 680, w: 320, h: 196 }, gate: { x: 1070, y: 878 }, village: "Emberhold",
    villagers: { brakka: [942, 778], hilde: [934, 842], durgrim: [1040, 752], pip: [1152, 774] },
    ore: { count: 10, kinds: [["emberite", 0.6], ["obsidianOre", 0.4]] },   // mining (js/world/mining.js)
    arena: { x: 110, y: 110, w: 330, h: 220 }, bossSpawn: { x: 260, y: 200 }, boss: "ignis", item: "forgeCore",
    arenaName: { en: "Hellforge", fil: "Hellforge" },
    monsters: ["obsidianGolem", "hellHound", "imp", "magmaDrake", "lavaCrab"],
    elites: ["fireGargoyle", "lavaSerpent", "hellforgeOverseer", "cinderBehemoth"],
    sites: [{ x: 700, y: 220, name: { en: "Slag Heaps", fil: "Bunton ng Slag" } }, { x: 520, y: 600, name: { en: "Brimstone Vent", fil: "Butas ng Asupre" } }, { x: 1150, y: 300, name: { en: "Charred Watchpost", fil: "Sunog na Bantayan" } }],
    trail: { x: 300, y: 878, dest: "desert" },   // gate to the frontier map (js/world/frontiers.js)
    pathTargets: [[275, 220], [640, 90], [1210, 420], [300, 860]],
    terrain(tx, ty, cols, rows, noise) {
      const center = rows * 0.5 + Math.sin(tx * 0.11) * 6 - (tx - cols / 2) * 0.25;
      if (Math.abs(ty - center) < 2.2 + noise(tx * 0.2, 0, 7) * 1.5) return "liquid";   // river of lava
      if (noise(tx * 0.15, ty * 0.15, 9) > 0.8) return "liquid";                          // pools of magma
      return null;
    },
    landmark(ctx, t, cleared) {
      // The Hellforge wall behind the arena and the fire pit
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
  strand: {
    id: "strand", act: 11, tier: 6, theme: "strand", ambient: "lament", seed: 11311, hubGate: "MONOLITH", color: "#7dd3fc", dark: true,
    name: { en: "The Lamenting Strand", fil: "Dalampasigan ng Panaghoy" },
    camp: { x: 600, y: 770, w: 170, h: 110 }, gate: { x: 685, y: 870 },
    arena: { x: 470, y: 90, w: 340, h: 220 }, bossSpawn: { x: 630, y: 180 }, boss: "dolora", item: "tearUrn",
    arenaName: { en: "Cradle of Tears", fil: "Duyan ng mga Luha" },
    monsters: ["tearSlime", "wreckGhoul", "sorrowWisp", "strandCrab", "mourningEel"],
    elites: ["keeningBanshee", "hollowPaladin", "brinewingDrake", "weepingColossus"],
    sites: [{ x: 330, y: 640, name: { en: "Wreck of the Dawnstar", fil: "Wasak na Dawnstar" } }, { x: 1010, y: 300, name: { en: "Bone Willow Grove", fil: "Kakahuyan ng Butong Willow" } }, { x: 930, y: 640, name: { en: "The Tear Pools", fil: "Mga Lawa ng Luha" } }],
    pathTargets: [[640, 200], [1186, 470], [640, 900]],
    // Road east to the Ossuary Fields (opens once Dolora's urn is delivered)
    rift: { x: 1186, y: 470, dest: "ossuary", road: true },
    terrain(tx, ty, cols, rows, noise) {
      if (tx < 12 + noise(0, ty * 0.1) * 6) return "liquid";                     // the black sea to the west
      if (ty > rows - 6 - noise(tx * 0.1, 0, 3) * 3 && tx < 30) return "liquid"; // south-west shallows
      if (noise(tx * 0.16, ty * 0.16, 7) > 0.79) return "liquid";                // pools of black tears
      return null;
    },
    landmark(ctx, t, cleared, riftOpen) {
      const a = this.arena, cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      // the Cradle of Tears: a ring of weeping stones round a black pool
      ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
      ctx.beginPath(); ctx.ellipse(cx, cy, 70, 40, 0, 0, Math.PI * 2); ctx.fill();
      ring(ctx, cx, cy, 70, 40, `rgba(125, 211, 252, ${0.35 + Math.sin(t) * 0.1})`, 1);
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2, sx = cx + Math.cos(ang) * 120, sy = cy + Math.sin(ang) * 72;
        ctx.fillStyle = "#3f3f46"; ctx.fillRect(sx - 4, sy - 16, 8, 18);
        ctx.fillStyle = "#71717a"; ctx.fillRect(sx - 4, sy - 16, 3, 18);
        const drop = (t * 12 + k * 7) % 16;
        ctx.fillStyle = "#0f172a"; ctx.fillRect(sx, sy - 10 + drop, 1, 2);
      }
      // the Dawnstar's broken hull on the shore
      const wx = this.sites[0].x, wy = this.sites[0].y;
      ctx.fillStyle = "#3b2a1d"; ctx.beginPath(); ctx.moveTo(wx - 40, wy); ctx.lineTo(wx + 34, wy - 6); ctx.lineTo(wx + 24, wy + 12); ctx.lineTo(wx - 30, wy + 14); ctx.fill();
      ctx.fillStyle = "#5e3b1a"; ctx.fillRect(wx - 4, wy - 40, 3, 38);
      ctx.fillStyle = "#e2e8f0"; ctx.fillRect(wx - 1, wy - 36, 14, 10);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(wx + 4, wy - 33, 3, 3);
      if (riftOpen) {
        const r = this.rift;
        glow(ctx, r.x, r.y, 46, "rgb(125, 211, 252)", 0.4);
        ctx.fillStyle = "#57534e"; ctx.fillRect(r.x - 30, r.y - 10, 60, 20);
        ctx.fillStyle = "#e7e5e4"; ctx.fillRect(r.x - 2, r.y - 26, 4, 18);
        ctx.fillStyle = "#7dd3fc"; ctx.fillRect(r.x - 8, r.y - 26, 16, 5);
      }
      if (cleared) glow(ctx, cx, cy, 90, "rgb(186, 230, 253)", 0.25);
    },
    text: {
      en: {
        arrive: ["The Dark Continent... black sand, and the sea behind us is quiet as a funeral.",
          "Father would not wait. He has sailed on along the coast toward the Obsidian Citadel with Captain Ronald and the Royal Guard. We hold this beach, {h}, and then we follow.",
          "Those pools are not seawater. Veyra says they are tears, and that something called the Weeping Matron gathers them in the Cradle to the north."],
        hint: ["Dolora, the Weeping Matron, drifts above the Cradle of Tears to the north. She blinks out of reach, rains black tears in rings around you and her wail silences spells. Keep moving, {h}."],
        deliver: ["The urn is sealed. Listen... the tide pools have gone quiet.",
          "She said she only gathers the grief, and that someone who drinks it is still asleep. I don't like that, {h}.",
          "Veyra has found the road east. It runs inland to the old battlefield: the Ossuary Fields. Father's trail goes the same way."]
      },
      fil: {
        arrive: ["Ang Dark Continent... itim na buhangin, at kasingtahimik ng libing ang dagat sa likod natin.",
          "Hindi naghintay si Ama. Naglayag na siya sa baybayin patungong Obsidian Citadel kasama si Kapitan Ronald at ang Royal Guard. Hawakan natin ang dalampasigang ito, {h}, saka tayo susunod.",
          "Hindi tubig-dagat ang mga lawang iyan. Sabi ni Veyra, mga luha iyan, at may tinatawag na Lumuluhang Matrona na nag-iipon ng mga iyon sa Duyan sa hilaga."],
        hint: ["Lumulutang si Dolora, ang Lumuluhang Matrona, sa itaas ng Duyan ng mga Luha sa hilaga. Bigla siyang naglalaho, nagpapaulan ng itim na luha nang paikot sa iyo at pinatatahimik ng kanyang panaghoy ang mga spell. Huwag kang titigil sa paggalaw, {h}."],
        deliver: ["Selyado na ang urna. Pakinggan mo... tumahimik na ang mga lawa.",
          "Sabi niya, nag-iipon lang daw siya ng dalamhati, at may umiinom nito na natutulog pa. Hindi ko iyon gusto, {h}.",
          "Nakita na ni Veyra ang daan pasilangan. Papasok ito sa lumang larangan ng digmaan: ang Kaparangan ng mga Buto. Doon din dumaan si Ama."]
      }
    }
  },

  // ==================== ACT XII ====================
  ossuary: {
    id: "ossuary", act: 12, tier: 7, theme: "ossuary", ambient: "grave", seed: 12412, hubGate: "ROAD", color: "#e7e5e4", dark: true,
    name: { en: "The Ossuary Fields", fil: "Kaparangan ng mga Buto" },
    camp: { x: 70, y: 420, w: 170, h: 120 }, gate: { x: 84, y: 480, dir: "vertical" },
    arena: { x: 860, y: 340, w: 330, h: 260 }, bossSpawn: { x: 1020, y: 460 }, boss: "morgrave", item: "lanternVisor",
    arenaName: { en: "The Warlord's Barrow", fil: "Puntod ng Panginoong-Digma" },
    monsters: ["boneLegionnaire", "barrowHound", "cryptGhoul", "graveCrow", "ossuaryCrawler"],
    elites: ["bannerWraith", "boneColossus", "lichAdjutant", "boneDrake"],
    sites: [{ x: 420, y: 220, name: { en: "The Lantern Knight's Cairn", fil: "Bunton ng Lantern Knight" } }, { x: 560, y: 760, name: { en: "Field of Broken Banners", fil: "Parang ng mga Baling Bandila" } }, { x: 700, y: 420, name: { en: "The Charnel Well", fil: "Balon ng mga Bangkay" } }],
    pathTargets: [[1025, 470], [640, 70], [640, 890]],
    // The war road north to the Obsidian Citadel (opens once the Visor is delivered)
    rift: { x: 640, y: 70, dest: "siege", road: true },
    terrain(tx, ty, cols, rows, noise) {
      if (noise(tx * 0.14, ty * 0.14, 11) > 0.8) return "wall";                 // heaps of bones
      if (noise(tx * 0.1, ty * 0.1, 13) > 0.83) return "liquid";                // flooded grave pits
      return null;
    },
    landmark(ctx, t, cleared, riftOpen) {
      const a = this.arena, cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      // the barrow: a ring of bone spears around a mound
      ctx.fillStyle = "#57534e"; ctx.beginPath(); ctx.ellipse(cx, cy, 60, 34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#78716c"; ctx.beginPath(); ctx.ellipse(cx, cy - 4, 46, 24, 0, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 12; k++) {
        const ang = (k / 12) * Math.PI * 2, sx = cx + Math.cos(ang) * 130, sy = cy + Math.sin(ang) * 90;
        ctx.fillStyle = "#e7e5e4"; ctx.fillRect(sx - 1, sy - 18, 2, 18);
        ctx.fillStyle = "#fafaf9"; ctx.fillRect(sx - 2, sy - 20, 4, 3);
      }
      // the Lantern Knight's cairn with its lantern still burning
      const s = this.sites[0];
      ctx.fillStyle = "#a8a29e"; ctx.beginPath(); ctx.moveTo(s.x - 16, s.y + 8); ctx.lineTo(s.x, s.y - 18); ctx.lineTo(s.x + 16, s.y + 8); ctx.fill();
      glow(ctx, s.x, s.y - 22, 22, "rgb(255, 209, 102)", 0.5 + Math.sin(t * 2) * 0.15);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(s.x - 2, s.y - 25, 4, 5);
      // torn banners on the field
      [[540, 740], [590, 780], [520, 790]].forEach(([x, y], k) => {
        ctx.fillStyle = "#44403c"; ctx.fillRect(x, y - 24, 2, 24);
        ctx.fillStyle = k % 2 ? "#7f1d1d" : "#1e3a8a"; ctx.fillRect(x + 2, y - 24 + Math.round(Math.sin(t + k)), 9, 7);
      });
      if (riftOpen) {
        const r = this.rift;
        glow(ctx, r.x, r.y, 46, "rgb(239, 68, 68)", 0.35);
        ctx.fillStyle = "#57534e"; ctx.fillRect(r.x - 30, r.y - 10, 60, 20);
        ctx.fillStyle = "#e7e5e4"; ctx.fillRect(r.x - 2, r.y - 26, 4, 18);
        ctx.fillStyle = "#ef4444"; ctx.fillRect(r.x - 8, r.y - 26, 16, 5);
      }
      if (cleared) glow(ctx, cx, cy, 90, "rgb(255, 220, 140)", 0.25);
    },
    text: {
      en: {
        arrive: ["The Ossuary Fields... humans, elves, dwarves, beastfolk. Every race that stood with the Lantern Knight three hundred years ago is buried here.",
          "Brother Aldric keeps vigil at the Lantern Knight's Cairn. He says the dead have been walking again since the Eclipse, and that their old enemy walks with them."],
        hint: ["Morgrave, the Ossuary Warlord, holds his barrow on the east side of the field. He marches, then charges in a straight line, and bone lances erupt toward you. Step aside from the line, {h}."],
        deliver: ["The Lantern Knight's Visor... Aldric says it still holds the Knight's last words.",
          "'The way home opens once, at the first dawn after the star is whole, and only for that dawn.' {h}... that means you could go home, when this is over.",
          "...We'll talk about it after. The war road north leads to the Obsidian Citadel. Father is already there."]
      },
      fil: {
        arrive: ["Ang Kaparangan ng mga Buto... mga tao, elf, dwarf at beastfolk. Nakalibing dito ang bawat lahing tumayo kasama ng Lantern Knight tatlong daang taon na ang nakararaan.",
          "Nagbabantay si Kapatid na Aldric sa Bunton ng Lantern Knight. Sabi niya, naglalakad muli ang mga patay mula nang dumating ang Eclipse, at kasama nilang naglalakad ang dati nilang kaaway."],
        hint: ["Hawak ni Morgrave, ang Panginoong-Digma ng mga Buto, ang kanyang puntod sa silangang bahagi ng parang. Nagmamartsa siya, saka sumusugod nang tuwid, at may mga sibat na buto na sumisibol patungo sa iyo. Umiwas ka sa linya, {h}."],
        deliver: ["Ang Visor ng Lantern Knight... sabi ni Aldric, taglay pa nito ang huling salita ng Knight.",
          "'Minsan lang bubukas ang daan pauwi, sa unang bukang-liwayway matapos mabuo ang bituin, at sa liwayway lamang na iyon.' {h}... ibig sabihin, makauuwi ka kapag natapos na ito.",
          "...Saka na natin pag-usapan. Patungo sa Obsidian Citadel ang daan ng digmaan sa hilaga. Naroon na si Ama."]
      }
    }
  },

  // ==================== ACT XIII ====================
  siege: {
    ore: { count: 8, kinds: [["mythril", 0.7], ["obsidianOre", 0.15], ["starsteel", 0.15]] },
    id: "siege", act: 13, tier: 8, theme: "siege", ambient: "siege", seed: 11111, hubGate: "MARCH", color: "#ef4444", dark: true,
    name: { en: "Siege of the Obsidian Citadel", fil: "Pagkubkob sa Obsidian Citadel" },
    camp: { x: 560, y: 790, w: 160, h: 110 }, gate: { x: 640, y: 878 },
    arena: { x: 470, y: 90, w: 340, h: 210 }, bossSpawn: { x: 630, y: 170 }, boss: "commander", item: "imperialCrest",
    arenaName: { en: "Obsidian Throne Hall", fil: "Bulwagan ng Obsidian na Trono" },
    monsters: ["shockTrooper", "voidSpider", "demonKnight", "chaosGargoyle", "corruptedCrab"],
    elites: ["abyssalJuggernaut", "hellfireWarlock", "obsidianSentinel", "infernalWyvern"],
    sites: [{ x: 300, y: 600, name: { en: "Broken Ballista", fil: "Sirang Ballista" } }, { x: 980, y: 600, name: { en: "Fallen Banner", fil: "Bumagsak na Bandila" } }, { x: 640, y: 420, name: { en: "Gatehouse Rubble", fil: "Guho ng Bantayang-Pinto" } }],
    pathTargets: [[640, 200], [170, 500], [1110, 500]],
    // Rift behind the throne, down the Chainspire (opens once the Crest is delivered)
    rift: { x: 640, y: 150, dest: "chainspire" },
    terrain(tx, ty, cols) {
      const breach = (tx >= 37 && tx <= 42) || (tx >= 17 && tx <= 20) || (tx >= 58 && tx <= 61);
      if ((ty === 21 || ty === 22) && tx >= 8 && tx <= cols - 9 && !breach) return "wall";        // outer wall
      if ((tx === 8 || tx === 9 || tx === cols - 10 || tx === cols - 9) && ty >= 21 && ty <= 50 && !(ty >= 34 && ty <= 38)) return "wall";
      return null;
    },
    landmark(ctx, t, cleared, riftOpen) {
      const a = this.arena, cx = a.x + a.w / 2;
      // red carpet and throne
      ctx.fillStyle = "#6b1a24"; ctx.fillRect(cx - 14, a.y + 30, 28, a.h + 40);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(cx - 14, a.y + 30, 2, a.h + 40); ctx.fillRect(cx + 12, a.y + 30, 2, a.h + 40);
      ctx.fillStyle = "#5e3b1a"; ctx.fillRect(cx - 12, a.y - 6, 24, 30);
      ctx.fillStyle = "#8a2c2c"; ctx.fillRect(cx - 8, a.y, 16, 16);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(cx - 12, a.y - 10, 24, 4);
      [[-80, 0], [80, 0], [-150, 20], [150, 20]].forEach(([dx, dy]) => {
        ctx.fillStyle = "#8a2c2c"; ctx.fillRect(cx + dx - 6, a.y + dy - 20, 12, 26);
        ctx.fillStyle = "#ffd166"; ctx.fillRect(cx + dx - 2, a.y + dy - 12, 4, 6);
      });
      // burning braziers and catapults outside the wall
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
        arrive: ["There it stands at the end of the war road, the Obsidian Citadel. Every siege engine that burned our lands was forged behind those walls.",
          "My father sailed ahead of us with Captain Ronald and the Royal Guard. The Demon Commander holds the Obsidian Throne Hall — and my father is still fighting in there!"],
        hint: ["The Demon Commander is in the Obsidian Throne Hall, north past the breached gates. Hurry, {h}!"],
        deliver: ["Father... he held the Throne Hall until we came. His last words passed the Imperial Crest to me.",
          "Then let it be done. Before the nobles, the generals and every survivor of the Vanguard, I name you Supreme Sovereign Champion — and true partner of the throne.",
          "A rift has torn open behind the throne, and a cold wind rattles up out of it like chains. Veyra says it leads down the Chainspire to the Maw of Damnation."]
      },
      fil: {
        arrive: ["Naroon sa dulo ng daan ng digmaan ang Obsidian Citadel. Bawat siege engine na sumunog sa ating lupain ay hinubog sa likod ng mga pader na iyan.",
          "Nauna nang naglayag ang aking ama kasama si Kapitan Ronald at ang Royal Guard. Hawak ng Heneral ng mga Demonyo ang Bulwagan ng Obsidian na Trono — at lumalaban pa roon ang aking ama!"],
        hint: ["Nasa Bulwagan ng Obsidian na Trono ang Heneral ng mga Demonyo, sa hilaga lampas sa nabutas na gate. Bilisan mo, {h}!"],
        deliver: ["Ama... hinawakan niya ang Bulwagan ng Trono hanggang sa dumating tayo. Sa kanyang huling salita, ipinasa niya sa akin ang Imperial Crest.",
          "Kung gayon, gawin na natin. Sa harap ng mga maharlika, heneral at lahat ng nakaligtas sa Vanguard, itinatalaga kitang Supreme Sovereign Champion — at tunay na katuwang ng trono.",
          "May lamat na bumukas sa likod ng trono, at umiihip mula rito ang malamig na hanging kumakalansing na parang kadena. Sabi ni Veyra, pababa ito sa Toreng Kadena patungong Maw of Damnation."]
      }
    }
  },

  // ==================== ACT XIV ====================
  chainspire: {
    id: "chainspire", act: 14, tier: 9, theme: "chainspire", ambient: "chains", seed: 14414, hubGate: "RIFT", color: "#f43f5e", dark: true,
    name: { en: "The Chainspire Descent", fil: "Ang Pagbaba sa Toreng Kadena" },
    camp: { x: 560, y: 790, w: 160, h: 100 }, gate: { x: 640, y: 874 },
    arena: { x: 460, y: 110, w: 360, h: 240 }, bossSpawn: { x: 630, y: 200 }, boss: "vorgath", item: "wardensKey",
    arenaName: { en: "The Warden's Landing", fil: "Plataporma ng Bantay" },
    monsters: ["shackledSoul", "chainImp", "ironGaoler", "hookCrawler", "miseryLeech"],
    elites: ["tormentGolem", "hollowExecutioner", "shackleDrake", "chainWraith"],
    sites: [{ x: 250, y: 520, name: { en: "The Hanging Cages", fil: "Mga Nakabiting Kulungan" } }, { x: 1030, y: 520, name: { en: "The Anvil of Oaths", fil: "Palihan ng mga Sumpa" } }, { x: 640, y: 560, name: { en: "The Weeping Chains", fil: "Mga Lumuluhang Kadena" } }],
    pathTargets: [[640, 230], [250, 520], [1030, 520], [640, 560], [640, 70]],
    // The last gate, at the foot of the spire, down into the Maw (opens with the Warden's Key)
    rift: { x: 640, y: 70, dest: "maw" },
    // a spiral of iron landings over the abyss
    islands: [[640, 840, 160, 90], [640, 230, 280, 190], [250, 520, 160, 110], [1030, 520, 160, 110], [640, 560, 150, 90], [640, 70, 70, 40]],
    terrain(tx, ty, cols, rows, noise) {
      const x = tx * 16 + 8, y = ty * 16 + 8;
      const wob = (noise(tx * 0.25, ty * 0.25) - 0.5) * 0.4;
      const land = this.islands.some(([cx, cy, rx, ry]) => inEllipse(x, y, cx, cy, rx * (1 + wob), ry * (1 + wob)));
      // chain bridges between the landings
      const bridge = (Math.abs(x - 640) < 22 && y > 90 && y < 820) || (Math.abs(y - 520) < 20 && x > 250 && x < 1030);
      return land || bridge ? null : "liquid";                                  // the abyss
    },
    landmark(ctx, t, cleared, riftOpen) {
      const a = this.arena, cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      // the Warden's anchor: four great chain posts round the landing
      [[-130, -60], [130, -60], [-130, 70], [130, 70]].forEach(([dx, dy], k) => {
        const x = cx + dx, y = cy + dy;
        ctx.fillStyle = "#27272a"; ctx.fillRect(x - 6, y - 26, 12, 30);
        ctx.fillStyle = "#52525b"; ctx.fillRect(x - 6, y - 26, 3, 30);
        if (!cleared) {
          ctx.strokeStyle = "#71717a"; ctx.lineWidth = 2; ctx.setLineDash([3, 2]);
          ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.quadraticCurveTo((x + cx) / 2, (y + cy) / 2 + 12 + Math.sin(t + k) * 3, cx, cy - 10); ctx.stroke();
          ctx.setLineDash([]);
        }
      });
      // glowing chains over the bridges
      for (let y = 120; y < 800; y += 24) { ctx.fillStyle = (y / 24 + Math.floor(t * 2)) % 4 ? "#3f3f46" : "#f43f5e"; ctx.fillRect(626, y, 3, 8); ctx.fillRect(651, y + 12, 3, 8); }
      if (riftOpen) {
        const r = this.rift, rr = 14 + Math.sin(t * 2) * 2;
        glow(ctx, r.x, r.y, 60, "rgb(157, 78, 221)", 0.5);
        ring(ctx, r.x, r.y, rr, rr * 1.4, "#c77dff", 2);
        ring(ctx, r.x, r.y, rr * 0.5, rr * 0.8, "#ffffff", 1, [2, 2]);
      }
      if (cleared) glow(ctx, cx, cy, 120, "rgb(254, 205, 211)", 0.25);
    },
    text: {
      en: {
        arrive: ["Chains... a whole spire of them, down and down into the dark. And there are people on them, {h}. Souls of every race.",
          "Father would have known what to do. I keep reaching for his voice and finding only mine.",
          "...Thank you for staying beside me. The Warden waits on the great landing above. Veyra says he guards the last gate to the Maw."],
        hint: ["Vorgath, the Chained Warden, is anchored on the great landing to the north. His chains sweep wide and pull you in, and his slams send out rings: cross them as they pass. At half strength he breaks free, {h}."],
        deliver: ["The Warden's Key... look, the chains are falling. The souls are rising out of the dark.",
          "You looked strange on the bridge, {h}. As if you saw something in the chains. ...You don't have to tell me.",
          "The last gate is open at the foot of the spire. Satan waits below, in the Maw of Damnation."]
      },
      fil: {
        arrive: ["Mga kadena... isang buong tore ng mga ito, pababa nang pababa sa dilim. At may mga tao sa mga ito, {h}. Mga kaluluwa ng bawat lahi.",
          "Alam sana ni Ama ang gagawin. Hinahanap ko ang kanyang tinig pero sarili ko lang ang naririnig ko.",
          "...Salamat sa pananatili sa tabi ko. Naghihintay ang Bantay sa malaking plataporma sa itaas. Sabi ni Veyra, siya ang nagbabantay sa huling tarangkahan patungong Maw."],
        hint: ["Nakakadena si Vorgath, ang Nakakadenang Bantay, sa malaking plataporma sa hilaga. Malawak ang hampas ng kanyang mga kadena at hinihila ka nito palapit, at naglalabas ng mga singsing ang kanyang mga bagsak: tawirin mo ang mga ito habang dumaraan. Sa kalahati ng lakas, makakawala siya, {h}."],
        deliver: ["Ang Susi ng Bantay... tingnan mo, nahuhulog ang mga kadena. Umaakyat ang mga kaluluwa mula sa dilim.",
          "Kakaiba ang tingin mo sa tulay kanina, {h}. Para bang may nakita ka sa mga kadena. ...Hindi mo kailangang sabihin sa akin.",
          "Bukas na ang huling tarangkahan sa paanan ng tore. Naghihintay si Satan sa ibaba, sa Maw of Damnation."]
      }
    }
  },

  // ==================== ACT XV ====================
  maw: {
    id: "maw", act: 15, tier: 10, theme: "maw", ambient: "void", seed: 12121, hubGate: "DEPTHS", color: "#9d4edd", dark: true,
    name: { en: "Maw of Damnation", fil: "Maw of Damnation" },
    camp: { x: 560, y: 790, w: 160, h: 100 }, gate: { x: 640, y: 874 },
    arena: { x: 460, y: 170, w: 360, h: 230 }, bossSpawn: { x: 630, y: 270 }, boss: "satan", item: "astralAsh",
    arenaName: { en: "Obsidian Dais", fil: "Obsidian Dais" },
    monsters: ["voidHusk", "specter", "magmaDrake", "voidSerpent", "deepKraken"],
    elites: ["fallenSeraph", "abyssBehemoth", "abyssWyrm", "wraithLord"],
    sites: [{ x: 240, y: 560, name: { en: "Shattered Altar", fil: "Basag na Altar" } }, { x: 1040, y: 560, name: { en: "Ember Isle", fil: "Pulo ng Baga" } }, { x: 640, y: 600, name: { en: "Weeping Spire", fil: "Umiiyak na Tore" } }],
    pathTargets: [[640, 290], [240, 560], [1040, 560], [640, 600]],
    islands: [[640, 840, 150, 90], [640, 290, 280, 190], [240, 560, 150, 110], [1040, 560, 150, 110], [640, 600, 110, 70]],
    terrain(tx, ty, cols, rows, noise) {
      const x = tx * 16 + 8, y = ty * 16 + 8;
      const wob = (noise(tx * 0.25, ty * 0.25) - 0.5) * 0.5;
      const land = this.islands.some(([cx, cy, rx, ry]) => inEllipse(x, y, cx, cy, rx * (1 + wob), ry * (1 + wob)));
      return land ? null : "liquid";                                            // endless void
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
          "The Celestial Portals chime... it's the dawn the Visor promised, {h}. The way back to Earth is open, but only until the sun is up. Your family is on the other side.",
          "...You're staying? Then take my hand. Together we will lead Aethelgard into an age of unbroken peace.",
          "The portals are dimming... they're only a flicker now. {h}, are you all right? ...You're smiling. Good. Then so am I."]
      },
      fil: {
        arrive: ["Ang Maw of Damnation... wala na ang langit.",
          "Naghihintay si Demon Lord Satan sa obsidian dais sa puso ng ipu-ipo. Anuman ang mangyari, {h} — nasa tabi mo ako."],
        hint: ["Naghihintay si Satan sa malaking obsidian dais sa hilaga. Ilalabas niya ang pitong sumpa. Aawit ako para sa iyo — humayo ka!"],
        deliver: ["Tapos na... nalulusaw na ang miasma. Tingnan mo — isang tunay na bukang-liwayway sa Aethelgard.",
          "Tumutunog ang mga Celestial Portal... ito ang liwayway na ipinangako ng Visor, {h}. Bukas ang daan pabalik sa Daigdig, pero hanggang sa pagsikat lang ng araw. Nasa kabila ang iyong pamilya.",
          "...Mananatili ka? Kung gayon, hawakan mo ang aking kamay. Magkasama nating pamumunuan ang Aethelgard sa panahon ng walang patid na kapayapaan.",
          "Lumalabo na ang mga portal... kisap na lang sila ngayon. {h}, ayos ka lang ba? ...Nakangiti ka. Mabuti. Kung gayon, ako rin."]
      }
    }
  }
};

export const PLATFORM_ORDER = ["canopy", "coast", "frost", "ash", "strand", "ossuary", "siege", "chainspire", "maw"];
// The Dark Continent, reached through the Celestial Monolith (Acts XI–XV)
export const DARK_CONTINENT = PLATFORM_ORDER.filter((id) => PLATFORMS[id].dark);
export const PLATFORM_SIZE = { w: W, h: H };
