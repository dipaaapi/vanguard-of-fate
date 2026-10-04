import { Avatar } from "./avatar/avatar.js";
import { SlimeSprite, WolfSprite } from "./avatar/creature.js";
import {
  SporelingSprite, DrakeSprite, CrabSprite, SerpentSprite, BruteSprite,
  ImpSprite, SpecterSprite, TreantSprite, LeviathanSprite
} from "./avatar/beasts.js";

// ==================== BESTIARY ====================
// Every monster, following LORE.md and each Act's banner.
//   speed/hpMult/dmg — base values (grow with level)   barY — height of the HP bar/name above e.y
//   reach — attack reach     debuff — miasma blight (LORE Act I: Seven Anomaly Blights)
//   scale — drawing size     flying — airborne (small shadow)

const skeletonLook = {
  body: "male", skin: "#e9e4d4", eyes: "#1b1b2f", hairStyle: "none", face: "skull",
  outfit: "tunic", outfitColor: "#4a4550", gloves: "none", legs: "shorts", legColor: "#3b3f4a",
  boots: "shoes", bootColor: "#5a5048", weapon: "lance"
};

export const MONSTERS = {
  // ==================== AETHELGARD (Acts I–VI) ====================
  // Land
  slime: { name: { en: "Forest Slime", fil: "Slime ng Gubat" }, sprite: new SlimeSprite(), speed: 0.52, hpMult: 1.0, dmg: 8, barY: -2, medium: "land" },
  wolf: { name: { en: "Dire Wolf", fil: "Mabangis na Lobo" }, sprite: new WolfSprite(), speed: 0.72, hpMult: 1.25, dmg: 14, barY: -8, medium: "land", debuff: { type: "bleeding", chance: 0.2, time: 240 } },
  skeleton: { name: { en: "Skeleton Lancer", fil: "Kalansay na Lancer" }, sprite: new Avatar(skeletonLook), speed: 0.58, hpMult: 1.4, dmg: 16, barY: -21, medium: "land", debuff: { type: "curse", chance: 0.12, time: 240 } },
  goblinScout: { name: { en: "Goblin Raider", fil: "Gobling Mananalakay" },
    sprite: new Avatar({ body: "male", skin: "#558b2f", eyes: "#ffb300", hairStyle: "spiky", hairColor: "#33691e", ears: "elf", outfit: "tunic", outfitColor: "#6d4c41", legColor: "#3e2723", weapon: "dagger" }),
    speed: 0.68, hpMult: 1.15, dmg: 12, barY: -21, medium: "land", debuff: { type: "bleeding", chance: 0.18, time: 200 } },
  forestBear: { name: { en: "Plains Ursath", fil: "Ursath ng Kapatagan" },
    sprite: new BruteSprite({ fur: "#4e342e", furD: "#271610", furL: "#6d4c41", face: "#3e2723", eye: "#ffb74d" }),
    speed: 0.52, hpMult: 1.6, dmg: 18, reach: 20, barY: -32, medium: "land", debuff: { type: "bleeding", chance: 0.22, time: 220 } },
  voidSlime: { name: { en: "Void Slime", fil: "Slime ng Void" }, sprite: new SlimeSprite({ base: "#9d4edd", dark: "#6a2c9e", deep: "#3c096c", light: "#e0aaff", core: "#c77dff", eye: "#10002b" }),
    speed: 0.55, hpMult: 1.1, dmg: 10, barY: -2, medium: "land", debuff: { type: "poison", chance: 0.2, time: 240 } },
  // Sky
  windFalcon: { name: { en: "Sky Storm Harrier", fil: "Lawin ng Bagyo" },
    sprite: new DrakeSprite({ body: "#64748b", bodyD: "#334155", bodyL: "#94a3b8", belly: "#f1f5f9", wing: "#475569", wingD: "#1e293b", eye: "#38bdf8", horn: "#e2e8f0" }, true),
    speed: 0.84, hpMult: 1.2, dmg: 15, barY: -22, flying: true, medium: "sky", debuff: { type: "blind", chance: 0.2, time: 180 } },
  bloodBat: { name: { en: "Dusk Bat", fil: "Paniki ng Takipsilim" },
    sprite: new ImpSprite({ body: "#3f2b96", bodyD: "#1e144a", bodyL: "#6047c8", wing: "#1e144a", wingD: "#0f0a25", eye: "#ef4444" }),
    speed: 0.82, hpMult: 1.05, dmg: 13, barY: -10, flying: true, medium: "sky", debuff: { type: "silence", chance: 0.2, time: 200 } },
  skyGargoyle: { name: { en: "Granite Gargoyle", fil: "Gargoyle na Bato" },
    sprite: new DrakeSprite({ body: "#475569", bodyD: "#1e293b", bodyL: "#64748b", belly: "#94a3b8", wing: "#334155", wingD: "#0f172a", eye: "#eab308", horn: "#cbd5e1" }, true),
    speed: 0.74, hpMult: 1.45, dmg: 17, barY: -22, flying: true, medium: "sky", debuff: { type: "curse", chance: 0.2, time: 220 } },
  // Sea / Water
  riverCrab: { name: { en: "Moat Pincher", fil: "Alimango ng Moat" },
    sprite: new CrabSprite({ shell: "#0284c7", shellD: "#0369a1", shellL: "#38bdf8", leg: "#075985", eye: "#fde047" }),
    speed: 0.62, hpMult: 1.3, dmg: 14, barY: -4, aquatic: true, medium: "sea", debuff: { type: "electrified", chance: 0.15, time: 160 } },
  riverNaga: { name: { en: "River Siren", fil: "Sirena ng Ilog" },
    sprite: new SerpentSprite({ body: "#0d9488", bodyD: "#115e59", bodyL: "#2dd4bf", belly: "#ccfbf1", fin: "#f43f5e", eye: "#fbbf24" }),
    speed: 0.72, hpMult: 1.35, dmg: 16, barY: -8, aquatic: true, medium: "sea", debuff: { type: "silence", chance: 0.25, time: 220 } },
  marshLurker: { name: { en: "Marsh Lurker", fil: "Lurker ng Latian" },
    sprite: new SlimeSprite({ base: "#059669", dark: "#065f46", deep: "#064e3b", light: "#34d399", core: "#6ee7b7", eye: "#022c22" }),
    speed: 0.58, hpMult: 1.25, dmg: 12, barY: -2, aquatic: true, medium: "sea", debuff: { type: "poison", chance: 0.3, time: 240 } },

  // ==================== ACT VII: WHISPERING CANOPY ====================
  // Land
  sporeling: { name: { en: "Blight Sporeling", fil: "Sporeling ng Salot" }, sprite: new SporelingSprite(), speed: 0.55, hpMult: 1.0, dmg: 11, barY: -8, medium: "land", debuff: { type: "poison", chance: 0.35, time: 300 } },
  beastman: { name: { en: "Corrupted Beastman", fil: "Bulok na Beastman" },
    sprite: new Avatar({ body: "male", skin: "#6b4a3a", eyes: "#ffb000", hairStyle: "spiky", hairColor: "#2b1d14", beard: true, ears: "elf",
      outfit: "vest", outfitColor: "#3f3a2a", legs: "shorts", legColor: "#2b2b1f", boots: "sandals", bootColor: "#3a2616", gloves: "wraps", headgear: "horns", weapon: "axe" }),
    speed: 0.62, hpMult: 1.4, dmg: 17, barY: -21, medium: "land", debuff: { type: "bleeding", chance: 0.25, time: 240 } },
  mossTreant: { name: { en: "Briar Ancient", fil: "Sinaunang Tinik" },
    sprite: new BruteSprite({ fur: "#2e3b23", furD: "#192213", furL: "#455934", face: "#1c2616", eye: "#a3e635", crystal: "#84cc16" }, { crystals: true }),
    speed: 0.46, hpMult: 1.85, dmg: 21, reach: 22, barY: -32, medium: "land", debuff: { type: "poison", chance: 0.35, time: 260 } },
  // Sky
  shadowDrake: { name: { en: "Shadow Drake", fil: "Drake ng Anino" }, sprite: new DrakeSprite(), speed: 0.7, hpMult: 1.35, dmg: 16, barY: -14, flying: true, medium: "sky", debuff: { type: "blind", chance: 0.2, time: 240 } },
  blightHarpy: { name: { en: "Blight Harpy", fil: "Harpy ng Salot" },
    sprite: new DrakeSprite({ body: "#4c1d95", bodyD: "#2e1065", bodyL: "#6d28d9", belly: "#a78bfa", wing: "#3b0764", wingD: "#1e0338", eye: "#f43f5e", horn: "#ddd6fe" }, true),
    speed: 0.82, hpMult: 1.3, dmg: 18, barY: -22, flying: true, medium: "sky", debuff: { type: "blind", chance: 0.28, time: 240 } },
  sporeHornet: { name: { en: "Miasma Hornet", fil: "Pukyutan ng Miasma" },
    sprite: new ImpSprite({ body: "#65a30d", bodyD: "#3f6212", bodyL: "#84cc16", wing: "#365314", wingD: "#1a2e05", eye: "#ec4899" }),
    speed: 0.86, hpMult: 1.1, dmg: 15, barY: -10, flying: true, medium: "sky", debuff: { type: "poison", chance: 0.4, time: 260 } },
  // Sea / Bog
  bogSerpent: { name: { en: "Venom Mire Serpent", fil: "Serpent ng Lusak" },
    sprite: new SerpentSprite({ body: "#4d7c0f", bodyD: "#365314", bodyL: "#65a30d", belly: "#bef264", fin: "#9333ea", eye: "#ec4899" }),
    speed: 0.74, hpMult: 1.35, dmg: 17, barY: -8, aquatic: true, medium: "sea", debuff: { type: "poison", chance: 0.35, time: 260 } },
  swampCrab: { name: { en: "Bog Shell Crab", fil: "Alimango ng Putikan" },
    sprite: new CrabSprite({ shell: "#3f6212", shellD: "#1a2e05", shellL: "#65a30d", leg: "#142203", eye: "#facc15" }),
    speed: 0.6, hpMult: 1.35, dmg: 15, barY: -4, aquatic: true, medium: "sea", debuff: { type: "poison", chance: 0.25, time: 220 } },

  // ==================== ACT VIII: CERULEAN ABYSS ====================
  // Land / Shore
  reefCrab: { name: { en: "Abyssal Crab", fil: "Alimango ng Kailaliman" }, sprite: new CrabSprite(), speed: 0.6, hpMult: 1.3, dmg: 14, barY: -4, medium: "land", debuff: { type: "electrified", chance: 0.15, time: 140 } },
  mariner: { name: { en: "Drowned Mariner", fil: "Nalunod na Mandaragat" },
    sprite: new Avatar({ ...skeletonLook, skin: "#a8c5c0", outfit: "coat", outfitColor: "#1f4f5a", legColor: "#23333a", headgear: "hood", weapon: "lance" }),
    speed: 0.56, hpMult: 1.45, dmg: 17, barY: -21, medium: "land", debuff: { type: "silence", chance: 0.2, time: 240 } },
  coralGolem: { name: { en: "Coral Golem", fil: "Golem na Bahura" },
    sprite: new BruteSprite({ fur: "#0284c7", furD: "#0369a1", furL: "#38bdf8", face: "#075985", eye: "#f43f5e", crystal: "#fb7185" }, { crystals: true }),
    speed: 0.48, hpMult: 1.9, dmg: 22, reach: 22, barY: -32, medium: "land", debuff: { type: "electrified", chance: 0.25, time: 180 } },
  // Sky
  stormPetrel: { name: { en: "Thunder Skimmer", fil: "Wyvern ng Bagyo" },
    sprite: new DrakeSprite({ body: "#0369a1", bodyD: "#0c4a6e", bodyL: "#38bdf8", belly: "#e0f2fe", wing: "#075985", wingD: "#082f49", eye: "#fde047", horn: "#ffffff" }, true),
    speed: 0.85, hpMult: 1.35, dmg: 18, barY: -22, flying: true, medium: "sky", debuff: { type: "electrified", chance: 0.3, time: 180 } },
  drownedSpecter: { name: { en: "Abyssal Banshee", fil: "Banshee ng Kailaliman" },
    sprite: new SpecterSprite({ body: "#0891b2", bodyD: "#155e75", bodyL: "#22d3ee", eye: "#67e8f9" }),
    speed: 0.76, hpMult: 1.35, dmg: 19, barY: -16, flying: true, medium: "sky", debuff: { type: "silence", chance: 0.35, time: 260 }, elite: true },
  // Sea / Ocean
  tideSlime: { name: { en: "Brine Slime", fil: "Slime ng Alat" }, sprite: new SlimeSprite({ base: "#2a9d8f", dark: "#1f7a70", deep: "#134e4a", light: "#a8e6cf", core: "#5eead4", eye: "#082f2c" }),
    speed: 0.55, hpMult: 1.05, dmg: 10, barY: -2, aquatic: true, medium: "sea" },
  tideSerpent: { name: { en: "Tide Serpent", fil: "Serpent ng Alon" }, sprite: new SerpentSprite(), speed: 0.74, hpMult: 1.3, dmg: 16, barY: -8, aquatic: true, medium: "sea", debuff: { type: "poison", chance: 0.25, time: 240 } },
  siren: { name: { en: "Tidecaller Siren", fil: "Sirena ng Taob" },
    sprite: new Avatar({ body: "female", skin: "#67e8f9", eyes: "#f43f5e", hairStyle: "long", hairColor: "#0284c7", ears: "elf", outfit: "gown", outfitColor: "#0891b2", legColor: "#0e7490", weapon: "staff" }),
    speed: 0.65, hpMult: 1.4, dmg: 18, barY: -21, aquatic: true, medium: "sea", debuff: { type: "silence", chance: 0.3, time: 240 }, elite: true },
  deepKraken: { name: { en: "Kraken Hatchling", fil: "Munting Kraken" },
    sprite: new CrabSprite({ shell: "#0f766e", shellD: "#134e4a", shellL: "#14b8a6", leg: "#042f2e", eye: "#f59e0b" }, true),
    speed: 0.72, hpMult: 1.5, dmg: 19, barY: -4, aquatic: true, medium: "sea", debuff: { type: "poison", chance: 0.3, time: 240 } },

  // ==================== ACT IX: FROSTFANG PRECIPICE ====================
  // Land
  yeti: { name: { en: "Frostbitten Yeti", fil: "Yeti ng Yelo" }, sprite: new BruteSprite({}, {}), speed: 0.6, hpMult: 1.7, dmg: 20, barY: -32, reach: 22, medium: "land", debuff: { type: "freeze", chance: 0.2, time: 150 } },
  iceGolem: { name: { en: "Ice Golem", fil: "Golem na Yelo" },
    sprite: new BruteSprite({ fur: "#9fd8f5", furD: "#5aa9d6", furL: "#e6f7ff", face: "#3d8fc0", eye: "#ffffff", crystal: "#ffffff" }, { crystals: true }),
    speed: 0.45, hpMult: 2.0, dmg: 22, barY: -32, reach: 22, medium: "land", debuff: { type: "freeze", chance: 0.3, time: 180 } },
  frostStalker: { name: { en: "Glacier Wolf", fil: "Lobo ng Glosyer" },
    sprite: new WolfSprite({ body: "#93c5fd", bodyD: "#60a5fa", bodyL: "#e0f2fe", eye: "#38bdf8" }),
    speed: 0.78, hpMult: 1.35, dmg: 17, barY: -8, medium: "land", debuff: { type: "freeze", chance: 0.25, time: 160 } },
  // Sky
  wyvern: { name: { en: "Frost Wyvern", fil: "Wyvern ng Yelo" },
    sprite: new DrakeSprite({ body: "#6d8fb3", bodyD: "#465f7d", bodyL: "#a8c5e0", belly: "#dbe8f5", wing: "#3d5573", wingD: "#26374d", eye: "#5ee7ff", horn: "#e6f0ff" }, true),
    speed: 0.82, hpMult: 1.3, dmg: 17, barY: -22, flying: true, medium: "sky", debuff: { type: "freeze", chance: 0.15, time: 120 } },
  blizzardHawk: { name: { en: "Ice Griffin", fil: "Griffin ng Niyebe" },
    sprite: new DrakeSprite({ body: "#7dd3fc", bodyD: "#38bdf8", bodyL: "#e0f2fe", belly: "#f0f9ff", wing: "#0284c7", wingD: "#0369a1", eye: "#ffffff", horn: "#e0f2fe" }, true),
    speed: 0.86, hpMult: 1.3, dmg: 18, barY: -22, flying: true, medium: "sky", debuff: { type: "freeze", chance: 0.25, time: 150 } },
  frostGargoyle: { name: { en: "Permafrost Gargoyle", fil: "Gargoyle ng Yelo" },
    sprite: new DrakeSprite({ body: "#bae6fd", bodyD: "#7dd3fc", bodyL: "#f0f9ff", belly: "#ffffff", wing: "#38bdf8", wingD: "#0284c7", eye: "#0369a1", horn: "#ffffff" }, true),
    speed: 0.76, hpMult: 1.55, dmg: 20, barY: -22, flying: true, medium: "sky", debuff: { type: "freeze", chance: 0.3, time: 180 }, elite: true },
  // Sea / Glacial Pools
  frostSerpent: { name: { en: "Glacial Serpent", fil: "Serpent ng Glosyer" },
    sprite: new SerpentSprite({ body: "#38bdf8", bodyD: "#0284c7", bodyL: "#bae6fd", belly: "#f0f9ff", fin: "#93c5fd", eye: "#ffffff" }),
    speed: 0.74, hpMult: 1.45, dmg: 18, barY: -8, aquatic: true, medium: "sea", debuff: { type: "freeze", chance: 0.3, time: 180 }, elite: true },
  frozenCrab: { name: { en: "Icebound Scuttler", fil: "Alimangong Yelo" },
    sprite: new CrabSprite({ shell: "#7dd3fc", shellD: "#0284c7", shellL: "#e0f2fe", leg: "#0369a1", eye: "#ffffff" }),
    speed: 0.6, hpMult: 1.4, dmg: 16, barY: -4, aquatic: true, medium: "sea", debuff: { type: "freeze", chance: 0.25, time: 160 } },

  // ==================== ACT X: ASHFALL WASTELANDS & HELLFORGE ====================
  // Land
  obsidianGolem: { name: { en: "Obsidian Golem", fil: "Golem na Obsidian" },
    sprite: new BruteSprite({ fur: "#2b2b33", furD: "#15151b", furL: "#4a4a58", face: "#1a1a20", eye: "#ff7a1a", crack: "#ff7a1a" }, { cracks: true }),
    speed: 0.44, hpMult: 2.1, dmg: 23, barY: -32, reach: 22, medium: "land", debuff: { type: "burn", chance: 0.3, time: 240 } },
  demonKnight: { name: { en: "Demon Knight", fil: "Kabalyerong Demonyo" },
    sprite: new Avatar({ body: "male", skin: "#7a1f1b", eyes: "#ffd166", hairStyle: "none", outfit: "armor", outfitColor: "#3a0f0f", legColor: "#2b2b33",
      boots: "boots", bootColor: "#15151b", gloves: "leather", headgear: "horns", weapon: "greatsword", cape: "#3a0f0f" }),
    speed: 0.6, hpMult: 1.7, dmg: 21, barY: -21, reach: 18, medium: "land", debuff: { type: "bleeding", chance: 0.25, time: 240 } },
  hellHound: { name: { en: "Hellforge Hound", fil: "Aso ng Hellforge" },
    sprite: new WolfSprite({ body: "#7f1d1d", bodyD: "#450a0a", bodyL: "#b91c1c", eye: "#f59e0b" }),
    speed: 0.8, hpMult: 1.4, dmg: 19, barY: -8, medium: "land", debuff: { type: "burn", chance: 0.35, time: 240 } },
  // Sky
  imp: { name: { en: "Hellforge Imp", fil: "Imp ng Hellforge" }, sprite: new ImpSprite(), speed: 0.8, hpMult: 0.95, dmg: 13, barY: -10, flying: true, medium: "sky", debuff: { type: "burn", chance: 0.25, time: 240 } },
  magmaDrake: { name: { en: "Magma Drake", fil: "Drake ng Magma" },
    sprite: new DrakeSprite({ body: "#5a1a10", bodyD: "#3a0f08", bodyL: "#8a2c1a", belly: "#ff9a3c", wing: "#3a0f08", wingD: "#1f0704", eye: "#ffd166", horn: "#2b2b33", fire: "#ff7a1a" }),
    speed: 0.7, hpMult: 1.6, dmg: 20, barY: -14, flying: true, medium: "sky", debuff: { type: "burn", chance: 0.35, time: 240 } },
  fireGargoyle: { name: { en: "Brimstone Gargoyle", fil: "Gargoyle ng Asupre" },
    sprite: new DrakeSprite({ body: "#7c2d12", bodyD: "#431407", bodyL: "#9a3412", belly: "#fdba74", wing: "#451a03", wingD: "#291004", eye: "#facc15", horn: "#1c1917", fire: "#ea580c" }, true),
    speed: 0.76, hpMult: 1.6, dmg: 21, barY: -22, flying: true, medium: "sky", debuff: { type: "burn", chance: 0.35, time: 240 }, elite: true },
  // Sea / Lava
  lavaSerpent: { name: { en: "Magma Serpent", fil: "Serpent ng Magma" },
    sprite: new SerpentSprite({ body: "#991b1b", bodyD: "#7f1d1d", bodyL: "#dc2626", belly: "#fed7aa", fin: "#f97316", eye: "#fde047" }),
    speed: 0.75, hpMult: 1.5, dmg: 20, barY: -8, aquatic: true, medium: "sea", debuff: { type: "burn", chance: 0.4, time: 240 }, elite: true },
  lavaCrab: { name: { en: "Cinder Crab", fil: "Alimangong Baga" },
    sprite: new CrabSprite({ shell: "#9a3412", shellD: "#431407", shellL: "#ea580c", leg: "#291004", eye: "#fbbf24" }),
    speed: 0.62, hpMult: 1.45, dmg: 18, barY: -4, aquatic: true, medium: "sea", debuff: { type: "burn", chance: 0.35, time: 240 } },

  // ==================== ACT XI: SIEGE OF THE IMPERIAL CITADEL ====================
  // Land
  shockTrooper: { name: { en: "Demon Shock Trooper", fil: "Demonyong Shock Trooper" },
    sprite: new Avatar({ body: "male", skin: "#8a2c2c", eyes: "#ffd166", hairStyle: "none", outfit: "vest", outfitColor: "#2b1a1a", legColor: "#1f1414",
      boots: "boots", bootColor: "#15151b", gloves: "wraps", headgear: "horns", weapon: "axe" }),
    speed: 0.66, hpMult: 1.5, dmg: 19, barY: -21, medium: "land", debuff: { type: "bleeding", chance: 0.25, time: 240 } },
  voidSpider: { name: { en: "Miasma Spider", fil: "Gagamba ng Miasma" }, sprite: new CrabSprite({ shell: "#3c1f5c", shellD: "#1f0f33", shellL: "#6a3fa0", leg: "#1a0b2a", eye: "#ff3b6b" }, true),
    speed: 0.78, hpMult: 1.15, dmg: 15, barY: -4, medium: "land", debuff: { type: "confusion", chance: 0.3, time: 200 } },
  abyssalJuggernaut: { name: { en: "Siege Dreadnought", fil: "Kuta ng Pagkawasak" },
    sprite: new BruteSprite({ fur: "#1e1b4b", furD: "#0f0d2b", furL: "#312e81", face: "#1e1b4b", eye: "#ef4444", horn: "#374151", crack: "#ec4899" }, { horns: true, hammer: true, cracks: true }),
    speed: 0.48, hpMult: 2.2, dmg: 25, reach: 24, barY: -32, medium: "land", debuff: { type: "bleeding", chance: 0.35, time: 260 }, elite: true },
  // Sky
  chaosGargoyle: { name: { en: "Chaos Gargoyle", fil: "Gargoyle ng Kaguluhan" },
    sprite: new DrakeSprite({ body: "#312e81", bodyD: "#1e1b4b", bodyL: "#4338ca", belly: "#818cf8", wing: "#1e1b4b", wingD: "#0f0d2b", eye: "#ef4444", horn: "#4b5563" }, true),
    speed: 0.8, hpMult: 1.55, dmg: 21, barY: -22, flying: true, medium: "sky", debuff: { type: "curse", chance: 0.3, time: 240 } },
  specter: { name: { en: "Spectral Horror", fil: "Multong Kakila-kilabot" }, sprite: new SpecterSprite(), speed: 0.7, hpMult: 1.4, dmg: 20, barY: -16,
    flying: true, medium: "sky", debuff: { type: "curse", chance: 0.3, time: 300 } },
  // Sea / Moat
  voidSerpent: { name: { en: "Void Serpent", fil: "Serpent ng Void" },
    sprite: new SerpentSprite({ body: "#312e81", bodyD: "#1e1b4b", bodyL: "#4f46e5", belly: "#c7d2fe", fin: "#ec4899", eye: "#ef4444" }),
    speed: 0.76, hpMult: 1.5, dmg: 21, barY: -8, aquatic: true, medium: "sea", debuff: { type: "curse", chance: 0.3, time: 240 } },
  corruptedCrab: { name: { en: "Corrupted Moat Crab", fil: "Bulok na Alimango" },
    sprite: new CrabSprite({ shell: "#3730a3", shellD: "#1e1b4b", shellL: "#6366f1", leg: "#1e1b4b", eye: "#ef4444" }),
    speed: 0.64, hpMult: 1.45, dmg: 18, barY: -4, aquatic: true, medium: "sea", debuff: { type: "curse", chance: 0.25, time: 220 } },

  // ==================== MAP ROSTERS: 5 REGULAR + 4 ELITE KINDS PER MAP ====================
  // elite: true → the kind only appears as an Elite (gold ✦, its own name, a regular minion), never at random.
  // Each map's roster is in js/world/areas.js (Aethelgard), js/world/platforms.js and js/world/frontiers.js.

  // ---- Aethelgard plains: elites ----
  goblinWarchief: { name: { en: "Goblin Warchief", fil: "Pinunong Goblin" },
    sprite: new Avatar({ body: "male", skin: "#4d7c0f", eyes: "#ffb300", hairStyle: "spiky", hairColor: "#1a2e05", ears: "elf", outfit: "armor", outfitColor: "#5a3d2b",
      legColor: "#3e2723", boots: "boots", bootColor: "#3a2616", gloves: "leather", headgear: "horns", weapon: "axe", cape: "#8a2c2c" }),
    speed: 0.62, hpMult: 1.5, dmg: 15, barY: -21, medium: "land", elite: true, debuff: { type: "bleeding", chance: 0.25, time: 220 } },
  ironpeltAlpha: { name: { en: "Ironpelt Alpha", fil: "Alphang Bakal-Balahibo" },
    sprite: new WolfSprite({ body: "#6b7280", bodyD: "#374151", bodyL: "#d1d5db", eye: "#f87171" }),
    speed: 0.76, hpMult: 1.45, dmg: 16, barY: -8, medium: "land", elite: true, debuff: { type: "bleeding", chance: 0.3, time: 240 } },
  thunderRoc: { name: { en: "Thunderbeak Roc", fil: "Roc ng Kulog" },
    sprite: new DrakeSprite({ body: "#a16207", bodyD: "#713f12", bodyL: "#eab308", belly: "#fef3c7", wing: "#854d0e", wingD: "#422006", eye: "#38bdf8", horn: "#fef9c3" }, true),
    speed: 0.84, hpMult: 1.4, dmg: 16, barY: -22, flying: true, medium: "sky", elite: true, debuff: { type: "electrified", chance: 0.25, time: 160 } },
  bramblecrownSlime: { name: { en: "Bramblecrown Slime", fil: "Slime na Koronang-Tinik" },
    sprite: new SlimeSprite({ base: "#65a30d", dark: "#3f6212", deep: "#1a2e05", light: "#bef264", core: "#facc15", eye: "#1a2e05" }),
    speed: 0.5, hpMult: 1.6, dmg: 12, barY: -2, medium: "land", elite: true, debuff: { type: "poison", chance: 0.3, time: 240 } },

  // ---- Greyhorn Badlands (frontier, Acts IV–VI) ----
  rubbleCrawler: { name: { en: "Rubble Crawler", fil: "Gumagapang na Guho" },
    sprite: new CrabSprite({ shell: "#78716c", shellD: "#44403c", shellL: "#a8a29e", leg: "#292524", eye: "#fbbf24" }),
    speed: 0.6, hpMult: 1.3, dmg: 13, barY: -4, medium: "land" },
  badlandBrigand: { name: { en: "Badland Brigand", fil: "Tulisan ng Kabatuhan" },
    sprite: new Avatar({ body: "male", skin: "#c68642", eyes: "#4a3222", hairStyle: "short", hairColor: "#2b1d14", outfit: "vest", outfitColor: "#7d5a3c",
      legs: "pants", legColor: "#3b3f4a", boots: "boots", bootColor: "#3a2616", gloves: "wraps", headgear: "hood", weapon: "sword" }),
    speed: 0.66, hpMult: 1.3, dmg: 14, barY: -21, medium: "land", debuff: { type: "bleeding", chance: 0.2, time: 200 } },
  dustJackal: { name: { en: "Dust Jackal", fil: "Asong-Ligaw ng Alikabok" },
    sprite: new WolfSprite({ body: "#c2a878", bodyD: "#8a7350", bodyL: "#e7d7b0", eye: "#f97316" }),
    speed: 0.8, hpMult: 1.15, dmg: 13, barY: -8, medium: "land", debuff: { type: "blind", chance: 0.15, time: 160 } },
  quarryColossus: { name: { en: "Quarry Colossus", fil: "Higante ng Tibagan" },
    sprite: new BruteSprite({ fur: "#78716c", furD: "#44403c", furL: "#a8a29e", face: "#57534e", eye: "#fde047", crystal: "#fbbf24" }, { crystals: true, hammer: true }),
    speed: 0.44, hpMult: 2.0, dmg: 19, reach: 22, barY: -32, medium: "land", elite: true, debuff: { type: "blind", chance: 0.2, time: 180 } },
  brigandWarlord: { name: { en: "Brigand Warlord", fil: "Panginoon ng mga Tulisan" },
    sprite: new Avatar({ body: "male", skin: "#8d5524", eyes: "#b3312b", hairStyle: "long", hairColor: "#2b1d14", beard: true, outfit: "armor", outfitColor: "#5e3b1a",
      legColor: "#2b2b33", boots: "boots", bootColor: "#2b2b33", gloves: "leather", headgear: "headband", weapon: "greatsword", cape: "#7d2b2b" }),
    speed: 0.62, hpMult: 1.6, dmg: 18, reach: 18, barY: -21, medium: "land", elite: true, debuff: { type: "bleeding", chance: 0.3, time: 240 } },
  boneMarshal: { name: { en: "Bone Marshal", fil: "Kalansay na Mariskal" },
    sprite: new Avatar({ ...skeletonLook, outfit: "armor", outfitColor: "#3b3f4a", legColor: "#2b2b33", boots: "boots", bootColor: "#2b2b33", headgear: "helmet", weapon: "greatsword", cape: "#4a4550" }),
    speed: 0.56, hpMult: 1.7, dmg: 18, reach: 18, barY: -21, medium: "land", elite: true, debuff: { type: "curse", chance: 0.25, time: 260 } },
  cliffWyvern: { name: { en: "Cliffcrest Wyvern", fil: "Wyvern ng Bangin" },
    sprite: new DrakeSprite({ body: "#9a6a2b", bodyD: "#5e3b1a", bodyL: "#c9a063", belly: "#f1dfb5", wing: "#7a5230", wingD: "#3a2616", eye: "#fde047", horn: "#e8e2d0" }, true),
    speed: 0.82, hpMult: 1.5, dmg: 17, barY: -22, flying: true, medium: "sky", elite: true, debuff: { type: "bleeding", chance: 0.2, time: 200 } },

  // ---- Whispering Canopy: elites ----
  rotheartDryad: { name: { en: "Rotheart Dryad", fil: "Dryad na Bulok ang Puso" },
    sprite: new Avatar({ body: "female", skin: "#6b8f4e", eyes: "#c77dff", hairStyle: "long", hairColor: "#3b0764", ears: "elf", outfit: "gown", outfitColor: "#2f4d36",
      legColor: "#1c2616", headgear: "tiara", weapon: "staff" }),
    speed: 0.6, hpMult: 1.55, dmg: 20, barY: -21, medium: "land", elite: true, debuff: { type: "poison", chance: 0.4, time: 300 } },
  beastmanChieftain: { name: { en: "Beastman Chieftain", fil: "Pinuno ng mga Beastman" },
    sprite: new Avatar({ body: "male", skin: "#4a2f1b", eyes: "#facc15", hairStyle: "long", hairColor: "#1a120c", beard: true, ears: "elf", outfit: "armor", outfitColor: "#3f3a2a",
      legs: "shorts", legColor: "#2b2b1f", boots: "sandals", bootColor: "#3a2616", gloves: "wraps", headgear: "horns", weapon: "greatsword", cape: "#5a3d2b" }),
    speed: 0.62, hpMult: 1.65, dmg: 21, reach: 18, barY: -21, medium: "land", elite: true, debuff: { type: "bleeding", chance: 0.3, time: 240 } },
  thornbackBehemoth: { name: { en: "Thornback Behemoth", fil: "Behemoth na Tinik ang Likod" },
    sprite: new BruteSprite({ fur: "#3b2f4a", furD: "#1f1829", furL: "#5b4a70", face: "#1f1829", eye: "#a3e635", crystal: "#c77dff" }, { crystals: true, horns: true }),
    speed: 0.44, hpMult: 2.0, dmg: 22, reach: 22, barY: -32, medium: "land", elite: true, debuff: { type: "poison", chance: 0.35, time: 260 } },
  miasmaHiveQueen: { name: { en: "Miasma Hive Queen", fil: "Reyna ng Pugad ng Miasma" },
    sprite: new ImpSprite({ skin: "#84cc16", skinD: "#3f6212", skinL: "#d9f99d", horn: "#581c87", eye: "#ec4899", wing: "#a21caf" }),
    speed: 0.8, hpMult: 1.45, dmg: 19, barY: -10, flying: true, medium: "sky", elite: true, debuff: { type: "poison", chance: 0.45, time: 280 } },

  // ---- Gloomwater Fens (frontier, Acts VII–VIII) ----
  mireGhoul: { name: { en: "Mire Ghoul", fil: "Ghoul ng Lusak" },
    sprite: new Avatar({ ...skeletonLook, skin: "#7c9a6b", eyes: "#d9f99d", outfit: "robe", outfitColor: "#2f3a26", legColor: "#1c2616", headgear: "hood", weapon: "none" }),
    speed: 0.58, hpMult: 1.4, dmg: 17, barY: -21, medium: "land", debuff: { type: "poison", chance: 0.3, time: 260 } },
  peatHulk: { name: { en: "Peat Hulk", fil: "Halimaw na Pit" },
    sprite: new BruteSprite({ fur: "#4a3b28", furD: "#2a2016", furL: "#6b5a3e", face: "#2a2016", eye: "#a3e635", crystal: "#4d7c0f" }, { crystals: true }),
    speed: 0.46, hpMult: 1.85, dmg: 20, reach: 22, barY: -32, medium: "land", debuff: { type: "poison", chance: 0.25, time: 240 } },
  fenMoth: { name: { en: "Gloom Moth", fil: "Gamugamo ng Dilim" },
    sprite: new ImpSprite({ skin: "#a8a29e", skinD: "#57534e", skinL: "#e7e5e4", horn: "#3f3f46", eye: "#bef264", wing: "#65a30d" }),
    speed: 0.84, hpMult: 1.1, dmg: 15, barY: -10, flying: true, medium: "sky", debuff: { type: "blind", chance: 0.3, time: 220 } },
  gloomwaterHag: { name: { en: "Gloomwater Hag", fil: "Mangkukulam ng Gloomwater" },
    sprite: new Avatar({ body: "female", skin: "#8aa37a", eyes: "#f43f5e", hairStyle: "long", hairColor: "#d6d3d1", outfit: "robe", outfitColor: "#3f4a2c",
      legColor: "#1c2616", headgear: "hood", weapon: "wand", cape: "#1c2616" }),
    speed: 0.6, hpMult: 1.55, dmg: 21, barY: -21, medium: "land", elite: true, debuff: { type: "curse", chance: 0.35, time: 280 } },
  mireHydra: { name: { en: "Mire Hydra", fil: "Hydra ng Lusak" },
    sprite: new SerpentSprite({ body: "#365314", bodyD: "#1a2e05", bodyL: "#4d7c0f", belly: "#d9f99d", fin: "#7c2d12", eye: "#f43f5e" }),
    speed: 0.74, hpMult: 1.7, dmg: 21, barY: -8, aquatic: true, medium: "sea", elite: true, debuff: { type: "poison", chance: 0.4, time: 280 } },
  bogTitan: { name: { en: "Bog Titan", fil: "Titan ng Putikan" },
    sprite: new BruteSprite({ fur: "#3f4a2c", furD: "#1c2616", furL: "#5b6b3f", face: "#1c2616", eye: "#facc15", crack: "#84cc16" }, { cracks: true, horns: true, hammer: true }),
    speed: 0.42, hpMult: 2.1, dmg: 23, reach: 24, barY: -32, medium: "land", elite: true, debuff: { type: "poison", chance: 0.3, time: 260 } },
  plagueMothMatriarch: { name: { en: "Plague Moth Matriarch", fil: "Inang Gamugamo ng Salot" },
    sprite: new ImpSprite({ skin: "#d6d3d1", skinD: "#78716c", skinL: "#fafaf9", horn: "#3f6212", eye: "#ef4444", wing: "#4d7c0f" }),
    speed: 0.82, hpMult: 1.45, dmg: 19, barY: -10, flying: true, medium: "sky", elite: true, debuff: { type: "poison", chance: 0.45, time: 300 } },

  // ---- Cerulean Abyss: elites (with the Tidecaller Siren and the Abyssal Banshee) ----
  drownedCaptain: { name: { en: "Drowned Captain", fil: "Nalunod na Kapitan" },
    sprite: new Avatar({ ...skeletonLook, skin: "#9fc2bd", outfit: "coat", outfitColor: "#123b45", legColor: "#1a262b", boots: "boots", bootColor: "#2b2b33", headgear: "hat", weapon: "sword", cape: "#0e2a33" }),
    speed: 0.58, hpMult: 1.65, dmg: 20, barY: -21, medium: "land", elite: true, debuff: { type: "silence", chance: 0.3, time: 240 } },
  abyssalKraken: { name: { en: "Abyssal Kraken", fil: "Kraken ng Kailaliman" },
    sprite: new CrabSprite({ shell: "#134e4a", shellD: "#042f2e", shellL: "#2dd4bf", leg: "#022c22", eye: "#f43f5e" }, true),
    speed: 0.7, hpMult: 1.75, dmg: 21, barY: -4, aquatic: true, medium: "sea", elite: true, debuff: { type: "electrified", chance: 0.3, time: 180 } },

  // ---- Frostfang Precipice: elites (with the Permafrost Gargoyle and the Glacial Serpent) ----
  rimeJotun: { name: { en: "Rime Jotun", fil: "Jotun ng Hamog-Yelo" },
    sprite: new BruteSprite({ fur: "#cbd5e1", furD: "#64748b", furL: "#f8fafc", face: "#475569", eye: "#38bdf8", horn: "#e0f2fe" }, { horns: true, hammer: true }),
    speed: 0.48, hpMult: 2.1, dmg: 23, reach: 24, barY: -32, medium: "land", elite: true, debuff: { type: "freeze", chance: 0.3, time: 180 } },
  glacierWitch: { name: { en: "Glacier Witch", fil: "Bruha ng Glosyer" },
    sprite: new Avatar({ body: "female", skin: "#dbeafe", eyes: "#0ea5e9", hairStyle: "long", hairColor: "#e0f2fe", outfit: "robe", outfitColor: "#1e3a5f",
      legColor: "#0f172a", headgear: "hood", weapon: "wand", cape: "#93c5fd" }),
    speed: 0.6, hpMult: 1.55, dmg: 22, barY: -21, medium: "land", elite: true, debuff: { type: "freeze", chance: 0.35, time: 180 } },

  // ---- Stormcrown Highlands (frontier, Act IX) ----
  highlandLynx: { name: { en: "Highland Lynx", fil: "Lynx ng Kabundukan" },
    sprite: new WolfSprite({ body: "#b45309", bodyD: "#78350f", bodyL: "#fcd34d", eye: "#22d3ee" }),
    speed: 0.82, hpMult: 1.35, dmg: 18, barY: -8, medium: "land", debuff: { type: "bleeding", chance: 0.25, time: 200 } },
  graniteTroll: { name: { en: "Granite Troll", fil: "Trolong Granite" },
    sprite: new BruteSprite({ fur: "#6b7a5a", furD: "#3f4a33", furL: "#8f9f7a", face: "#3f4a33", eye: "#fbbf24" }, {}),
    speed: 0.5, hpMult: 1.9, dmg: 22, reach: 22, barY: -32, medium: "land", debuff: { type: "blind", chance: 0.2, time: 160 } },
  galeHarpy: { name: { en: "Gale Harpy", fil: "Harpy ng Unos" },
    sprite: new DrakeSprite({ body: "#64748b", bodyD: "#334155", bodyL: "#cbd5e1", belly: "#f1f5f9", wing: "#7c3aed", wingD: "#4c1d95", eye: "#facc15", horn: "#e2e8f0" }, true),
    speed: 0.88, hpMult: 1.3, dmg: 19, barY: -22, flying: true, medium: "sky", debuff: { type: "electrified", chance: 0.25, time: 160 } },
  highlandRaider: { name: { en: "Highland Raider", fil: "Mananalakay ng Kabundukan" },
    sprite: new Avatar({ body: "male", skin: "#e0ac69", eyes: "#2f6db5", hairStyle: "ponytail", hairColor: "#8a3b24", beard: true, outfit: "coat", outfitColor: "#2f6b3f",
      legColor: "#3b3f4a", boots: "boots", bootColor: "#3a2616", gloves: "leather", weapon: "axe" }),
    speed: 0.64, hpMult: 1.5, dmg: 19, barY: -21, medium: "land", debuff: { type: "bleeding", chance: 0.25, time: 220 } },
  stormcrownGriffin: { name: { en: "Stormcrown Griffin", fil: "Griffin ng Stormcrown" },
    sprite: new DrakeSprite({ body: "#ca8a04", bodyD: "#854d0e", bodyL: "#fde047", belly: "#fefce8", wing: "#f8fafc", wingD: "#94a3b8", eye: "#0ea5e9", horn: "#fef9c3" }, true),
    speed: 0.86, hpMult: 1.6, dmg: 21, barY: -22, flying: true, medium: "sky", elite: true, debuff: { type: "electrified", chance: 0.3, time: 180 } },
  avalancheGolem: { name: { en: "Avalanche Golem", fil: "Golem ng Guho-Niyebe" },
    sprite: new BruteSprite({ fur: "#94a3b8", furD: "#475569", furL: "#f1f5f9", face: "#334155", eye: "#7dd3fc", crystal: "#e2e8f0" }, { crystals: true }),
    speed: 0.44, hpMult: 2.15, dmg: 23, reach: 22, barY: -32, medium: "land", elite: true, debuff: { type: "freeze", chance: 0.25, time: 160 } },
  peakShaman: { name: { en: "Peak Shaman", fil: "Shaman ng Tuktok" },
    sprite: new Avatar({ body: "male", skin: "#c68642", eyes: "#facc15", hairStyle: "long", hairColor: "#dfe6ee", beard: true, outfit: "robe", outfitColor: "#3b4a8a",
      legColor: "#1e293b", boots: "sandals", bootColor: "#5e3b1a", headgear: "horns", weapon: "scepter", cape: "#facc15" }),
    speed: 0.6, hpMult: 1.55, dmg: 22, barY: -21, medium: "land", elite: true, debuff: { type: "electrified", chance: 0.35, time: 180 } },
  elderTroll: { name: { en: "Elder Troll", fil: "Matandang Trolo" },
    sprite: new BruteSprite({ fur: "#4b5a3c", furD: "#2a331f", furL: "#6b7a5a", face: "#2a331f", eye: "#ef4444", horn: "#d6d3d1" }, { horns: true, hammer: true }),
    speed: 0.48, hpMult: 2.2, dmg: 24, reach: 24, barY: -32, medium: "land", elite: true, debuff: { type: "bleeding", chance: 0.3, time: 240 } },

  // ---- Ashfall Wastelands: elites (with the Brimstone Gargoyle and the Magma Serpent) ----
  hellforgeOverseer: { name: { en: "Hellforge Overseer", fil: "Tagabantay ng Hellforge" },
    sprite: new Avatar({ body: "male", skin: "#7a1f1b", eyes: "#ffd166", hairStyle: "none", beard: true, outfit: "armor", outfitColor: "#292524",
      legColor: "#1c1917", boots: "boots", bootColor: "#15151b", gloves: "leather", headgear: "helmet", weapon: "axe", cape: "#7c2d12" }),
    speed: 0.58, hpMult: 1.75, dmg: 23, barY: -21, medium: "land", elite: true, debuff: { type: "burn", chance: 0.35, time: 240 } },
  cinderBehemoth: { name: { en: "Cinder Behemoth", fil: "Behemoth ng Baga" },
    sprite: new BruteSprite({ fur: "#44403c", furD: "#1c1917", furL: "#78716c", face: "#1c1917", eye: "#fde047", horn: "#15151b", crack: "#f97316" }, { horns: true, cracks: true }),
    speed: 0.44, hpMult: 2.2, dmg: 24, reach: 24, barY: -32, medium: "land", elite: true, debuff: { type: "burn", chance: 0.4, time: 260 } },

  // ---- Sunscorch Dunes (frontier, Act X) ----
  duneScarab: { name: { en: "Dune Scarab", fil: "Salagubang ng Buhangin" },
    sprite: new CrabSprite({ shell: "#b45309", shellD: "#78350f", shellL: "#f59e0b", leg: "#451a03", eye: "#22d3ee" }),
    speed: 0.64, hpMult: 1.4, dmg: 18, barY: -4, medium: "land", debuff: { type: "poison", chance: 0.25, time: 220 } },
  duneHyena: { name: { en: "Dune Hyena", fil: "Hyena ng Buhangin" },
    sprite: new WolfSprite({ body: "#d6b77a", bodyD: "#9a7b45", bodyL: "#f1e2bd", eye: "#dc2626" }),
    speed: 0.82, hpMult: 1.35, dmg: 19, barY: -8, medium: "land", debuff: { type: "bleeding", chance: 0.3, time: 220 } },
  sunDriedRevenant: { name: { en: "Sun-Dried Revenant", fil: "Tuyong Revenant" },
    sprite: new Avatar({ ...skeletonLook, skin: "#d6c7a1", outfit: "robe", outfitColor: "#e8e2d0", legColor: "#c9b98f", boots: "sandals", bootColor: "#c9a063", headgear: "headband", weapon: "lance" }),
    speed: 0.54, hpMult: 1.6, dmg: 21, barY: -21, medium: "land", debuff: { type: "curse", chance: 0.3, time: 260 } },
  sandWyrm: { name: { en: "Sand Wyrm", fil: "Wyrm ng Buhangin" },
    sprite: new SerpentSprite({ body: "#c2a878", bodyD: "#8a7350", bodyL: "#e7d7b0", belly: "#fef3c7", fin: "#b45309", eye: "#dc2626" }),
    speed: 0.76, hpMult: 1.5, dmg: 21, barY: -8, aquatic: true, medium: "sea", debuff: { type: "bleeding", chance: 0.25, time: 220 } },
  carrionVulture: { name: { en: "Carrion Vulture", fil: "Buwitre ng Bangkay" },
    sprite: new DrakeSprite({ body: "#57534e", bodyD: "#292524", bodyL: "#a8a29e", belly: "#fca5a5", wing: "#44403c", wingD: "#1c1917", eye: "#fde047", horn: "#e7e5e4" }, true),
    speed: 0.86, hpMult: 1.3, dmg: 19, barY: -22, flying: true, medium: "sky", debuff: { type: "blind", chance: 0.25, time: 200 } },
  scarabMonarch: { name: { en: "Scarab Monarch", fil: "Haring Salagubang" },
    sprite: new CrabSprite({ shell: "#ca8a04", shellD: "#713f12", shellL: "#fde047", leg: "#422006", eye: "#06b6d4" }, true),
    speed: 0.66, hpMult: 1.85, dmg: 22, barY: -4, medium: "land", elite: true, debuff: { type: "poison", chance: 0.35, time: 260 } },
  tombKing: { name: { en: "Sunken Tomb King", fil: "Hari ng Lubog na Libingan" },
    sprite: new Avatar({ ...skeletonLook, skin: "#d6c7a1", eyes: "#22d3ee", outfit: "gown", outfitColor: "#c9a063", legColor: "#8a7350", headgear: "crown", weapon: "scepter", cape: "#1e3a8a" }),
    speed: 0.54, hpMult: 1.75, dmg: 23, barY: -21, medium: "land", elite: true, debuff: { type: "curse", chance: 0.4, time: 280 } },
  sandstormWraith: { name: { en: "Sandstorm Wraith", fil: "Wraith ng Bagyong Buhangin" },
    sprite: new SpecterSprite({ robe: "#a16207", robeD: "#713f12", robeL: "#eab308", eye: "#fef08a", claw: "#fef3c7" }),
    speed: 0.78, hpMult: 1.5, dmg: 22, barY: -16, flying: true, medium: "sky", elite: true, debuff: { type: "blind", chance: 0.35, time: 240 } },
  duneColossus: { name: { en: "Dune Colossus", fil: "Higante ng Buhangin" },
    sprite: new BruteSprite({ fur: "#c2a878", furD: "#8a7350", furL: "#e7d7b0", face: "#6b5a3e", eye: "#22d3ee", crack: "#f59e0b" }, { cracks: true, hammer: true }),
    speed: 0.44, hpMult: 2.2, dmg: 24, reach: 24, barY: -32, medium: "land", elite: true, debuff: { type: "bleeding", chance: 0.3, time: 240 } },

  // ---- Siege of the Obsidian Citadel: elites (with the Siege Dreadnought) ----
  hellfireWarlock: { name: { en: "Hellfire Warlock", fil: "Warlock ng Apoy-Impiyerno" },
    sprite: new Avatar({ body: "male", skin: "#5a0f0f", eyes: "#facc15", hairStyle: "long", hairColor: "#15151b", outfit: "robe", outfitColor: "#1a0505",
      legColor: "#15151b", boots: "boots", bootColor: "#0b0b0f", headgear: "horns", weapon: "book", cape: "#7f1d1d" }),
    speed: 0.6, hpMult: 1.7, dmg: 25, barY: -21, medium: "land", elite: true, debuff: { type: "burn", chance: 0.4, time: 260 } },
  obsidianSentinel: { name: { en: "Obsidian Sentinel", fil: "Bantay na Obsidian" },
    sprite: new Avatar({ body: "male", skin: "#2b2b33", eyes: "#ef4444", hairStyle: "none", outfit: "armor", outfitColor: "#15151b",
      legColor: "#0b0b0f", boots: "boots", bootColor: "#0b0b0f", gloves: "leather", headgear: "helmet", weapon: "lance", shield: "tower", cape: "#3a0f0f" }),
    speed: 0.54, hpMult: 2.0, dmg: 24, reach: 20, barY: -21, medium: "land", elite: true, debuff: { type: "bleeding", chance: 0.3, time: 240 } },
  infernalWyvern: { name: { en: "Infernal Wyvern", fil: "Wyvern ng Impiyerno" },
    sprite: new DrakeSprite({ body: "#7f1d1d", bodyD: "#450a0a", bodyL: "#dc2626", belly: "#fdba74", wing: "#1c1917", wingD: "#0c0a09", eye: "#fde047", horn: "#d6d3d1", fire: "#f97316" }, true),
    speed: 0.84, hpMult: 1.7, dmg: 24, barY: -22, flying: true, medium: "sky", elite: true, debuff: { type: "burn", chance: 0.35, time: 240 } },

  // ---- Maw of Damnation ----
  voidHusk: { name: { en: "Void Husk", fil: "Hungkag ng Void" },
    sprite: new Avatar({ ...skeletonLook, skin: "#b9a5d6", eyes: "#ff7a1a", outfit: "robe", outfitColor: "#2a1f40", legColor: "#171026", weapon: "greatsword" }),
    speed: 0.6, hpMult: 1.65, dmg: 23, barY: -21, medium: "land", debuff: { type: "curse", chance: 0.3, time: 260 } },
  fallenSeraph: { name: { en: "Fallen Seraph", fil: "Nahulog na Seraph" },
    sprite: new Avatar({ body: "female", skin: "#c4b5fd", eyes: "#ff7a1a", hairStyle: "long", hairColor: "#171026", outfit: "gown", outfitColor: "#2a1f40",
      legColor: "#171026", headgear: "halo", weapon: "sword", wings: "#3f3650" }),
    speed: 0.66, hpMult: 1.8, dmg: 26, barY: -21, medium: "land", elite: true, debuff: { type: "silence", chance: 0.35, time: 260 } },
  abyssBehemoth: { name: { en: "Abyss Behemoth", fil: "Behemoth ng Kalaliman" },
    sprite: new BruteSprite({ fur: "#2a1f40", furD: "#171026", furL: "#4b3f72", face: "#171026", eye: "#ff7a1a", horn: "#d8d0c0", crack: "#c77dff" }, { horns: true, cracks: true, hammer: true }),
    speed: 0.46, hpMult: 2.3, dmg: 27, reach: 24, barY: -32, medium: "land", elite: true, debuff: { type: "curse", chance: 0.35, time: 260 } },
  abyssWyrm: { name: { en: "Abyssal Wyrm", fil: "Wyrm ng Kalaliman" },
    sprite: new SerpentSprite({ body: "#3b0764", bodyD: "#1e0338", bodyL: "#7e22ce", belly: "#e9d5ff", fin: "#ff7a1a", eye: "#fde047" }),
    speed: 0.78, hpMult: 1.8, dmg: 25, barY: -8, aquatic: true, medium: "sea", elite: true, debuff: { type: "curse", chance: 0.3, time: 240 } },
  wraithLord: { name: { en: "Wraith Lord", fil: "Panginoon ng mga Wraith" },
    sprite: new SpecterSprite({ robe: "#450a0a", robeD: "#1c0505", robeL: "#991b1b", eye: "#ff7a1a", claw: "#fecaca" }),
    speed: 0.76, hpMult: 1.7, dmg: 25, barY: -16, flying: true, medium: "sky", elite: true, debuff: { type: "curse", chance: 0.4, time: 300 } }
};

// Bosses (one per platform). hp = hpBase × (35 + level × 12). The drop is a quest item.
export const BOSSES = {
  malakor: {
    name: { en: "Malakor the Blight Herald", fil: "Malakor, ang Tagapagbalita ng Salot" },
    sprite: new TreantSprite(), scale: 1, hpBase: 16, dmg: 24, speed: 0.35, reach: 30, barY: -62, hitR: 22, hitUp: 30,
    debuff: { type: "poison", chance: 0.5, time: 360 }, drop: "heartstone",
    attacks: { hazard: { color: "#6a2c9e", label: "roots", radius: 22 }, orb: { color: "#b8f2e6", speed: 1.6 }, summon: ["sporeling", "sporeling"] }
  },
  leviathan: {
    name: { en: "Leviathan Regent", fil: "Leviathan Regent" },
    sprite: new LeviathanSprite(), scale: 1, hpBase: 18, dmg: 26, speed: 0.3, reach: 32, barY: -54, hitR: 24, hitUp: 30, static: true,
    debuff: { type: "electrified", chance: 0.4, time: 150 }, drop: "abyssHelm",
    attacks: { hazard: { color: "#38bdf8", label: "tide", radius: 24 }, orb: { color: "#5ee7ff", speed: 2 }, summon: ["tideSerpent", "reefCrab"] }
  },
  cryonix: {
    name: { en: "Frost Empress Cryonix", fil: "Frost Empress Cryonix" },
    sprite: new Avatar({ body: "female", skin: "#cfe8f7", eyes: "#5ee7ff", hairStyle: "long", hairColor: "#f0f8ff", outfit: "gown", outfitColor: "#9fd8f5",
      legColor: "#9fd8f5", headgear: "crown", cape: "#5aa9d6", weapon: "staff", wings: "#e6f7ff" }),
    scale: 2, hpBase: 20, dmg: 28, speed: 0.4, reach: 28, barY: -56, hitR: 16, hitUp: 30,
    debuff: { type: "freeze", chance: 0.45, time: 150 }, drop: "cryoCore",
    attacks: { hazard: { color: "#bfe9ff", label: "ice lance", radius: 20 }, orb: { color: "#e6f7ff", speed: 2.2 }, summon: ["iceGolem"] }
  },
  ignis: {
    name: { en: "Ignis the Iron Lord", fil: "Ignis, ang Panginoong Bakal" },
    sprite: new BruteSprite({ fur: "#3a2a24", furD: "#1f1512", furL: "#5a4034", face: "#2b1a14", eye: "#ffd166", horn: "#15151b", crack: "#ff7a1a" }, { horns: true, hammer: true, cracks: true }),
    scale: 2, hpBase: 22, dmg: 30, speed: 0.4, reach: 36, barY: -80, hitR: 24, hitUp: 40,
    debuff: { type: "burn", chance: 0.5, time: 300 }, drop: "forgeCore",
    attacks: { slam: { radius: 60, color: "#ff7a1a" }, hazard: { color: "#ff5500", label: "geyser", radius: 22 }, summon: ["imp", "imp"] }
  },
  commander: {
    name: { en: "Demon Commander", fil: "Heneral ng mga Demonyo" },
    sprite: new Avatar({ body: "male", skin: "#5a0f0f", eyes: "#ffd166", hairStyle: "long", hairColor: "#15151b", outfit: "armor", outfitColor: "#1a0505",
      legColor: "#15151b", boots: "boots", bootColor: "#0b0b0f", gloves: "leather", headgear: "horns", weapon: "greatsword", cape: "#3a0f0f" }),
    scale: 2, hpBase: 24, dmg: 32, speed: 0.55, reach: 30, barY: -56, hitR: 16, hitUp: 30,
    debuff: { type: "bleeding", chance: 0.5, time: 300 }, drop: "imperialCrest",
    attacks: { slam: { radius: 52, color: "#ef4444" }, orb: { color: "#ff3b3b", speed: 2.2 }, summon: ["shockTrooper", "imp"] }
  },
  satan: {
    name: { en: "Demon Lord Satan", fil: "Demon Lord Satan" },
    sprite: new BruteSprite({ fur: "#2a1f40", furD: "#171026", furL: "#4b3f72", face: "#1a1026", eye: "#ff7a1a", horn: "#d8d0c0", crack: "#ff7a1a", wing: "#1f1633", wingD: "#0f0a1a" },
      { horns: true, wings: true, cracks: true }),
    scale: 2, hpBase: 30, dmg: 36, speed: 0.45, reach: 36, barY: -80, hitR: 26, hitUp: 40,
    debuff: { type: "all", chance: 0.5, time: 240 }, drop: "astralAsh",
    attacks: { slam: { radius: 64, color: "#c77dff" }, hazard: { color: "#9d4edd", label: "miasma", radius: 26 }, orb: { color: "#ff7a1a", speed: 2.4 }, summon: ["specter", "imp"] }
  }
};

// Race, element and size of every monster and boss (js/elements.js)
const TRAITS = {
  // Aethelgard
  slime: ["formless", "water", "small"], wolf: ["brute", "earth", "medium"], skeleton: ["undead", "undead", "medium"],
  goblinScout: ["demihuman", "earth", "small"], forestBear: ["brute", "earth", "large"], voidSlime: ["formless", "shadow", "small"],
  windFalcon: ["brute", "wind", "medium"], bloodBat: ["brute", "shadow", "small"], skyGargoyle: ["formless", "wind", "medium"],
  riverCrab: ["fish", "water", "small"], riverNaga: ["fish", "water", "medium"], marshLurker: ["formless", "water", "small"],

  // Canopy
  sporeling: ["plant", "poison", "small"], shadowDrake: ["dragon", "shadow", "medium"], beastman: ["demihuman", "earth", "medium"],
  mossTreant: ["plant", "earth", "large"], blightHarpy: ["demon", "wind", "medium"], sporeHornet: ["insect", "poison", "small"],
  bogSerpent: ["fish", "poison", "medium"], swampCrab: ["fish", "poison", "small"],

  // Coast
  tideSlime: ["formless", "water", "small"], reefCrab: ["fish", "water", "small"], mariner: ["undead", "undead", "medium"],
  coralGolem: ["brute", "water", "large"], stormPetrel: ["dragon", "wind", "medium"], drownedSpecter: ["undead", "water", "medium"],
  tideSerpent: ["fish", "water", "medium"], siren: ["fish", "water", "medium"], deepKraken: ["fish", "water", "large"],

  // Frost
  yeti: ["brute", "water", "large"], iceGolem: ["formless", "water", "large"], frostStalker: ["brute", "water", "medium"],
  wyvern: ["dragon", "wind", "medium"], blizzardHawk: ["brute", "wind", "medium"], frostGargoyle: ["formless", "water", "medium"],
  frostSerpent: ["fish", "water", "medium"], frozenCrab: ["fish", "water", "small"],

  // Ash
  imp: ["demon", "fire", "small"], obsidianGolem: ["formless", "earth", "large"], demonKnight: ["demon", "shadow", "medium"],
  hellHound: ["demon", "fire", "medium"], magmaDrake: ["dragon", "fire", "medium"], fireGargoyle: ["demon", "fire", "medium"],
  lavaSerpent: ["dragon", "fire", "medium"], lavaCrab: ["formless", "fire", "small"],

  // Siege & Maw
  shockTrooper: ["demon", "fire", "medium"], voidSpider: ["insect", "poison", "small"], abyssalJuggernaut: ["demon", "shadow", "large"],
  chaosGargoyle: ["demon", "shadow", "medium"], specter: ["undead", "ghost", "medium"], voidSerpent: ["shadow", "water", "medium"],
  corruptedCrab: ["undead", "water", "small"],

  // Bosses
  // map rosters (5 regular + 4 elite kinds per map)
  goblinWarchief: ["demihuman", "earth", "medium"], ironpeltAlpha: ["brute", "earth", "medium"], thunderRoc: ["brute", "wind", "large"],
  bramblecrownSlime: ["formless", "earth", "medium"],
  rubbleCrawler: ["formless", "earth", "small"], badlandBrigand: ["demihuman", "neutral", "medium"], dustJackal: ["brute", "earth", "small"],
  quarryColossus: ["formless", "earth", "large"], brigandWarlord: ["demihuman", "neutral", "medium"], boneMarshal: ["undead", "undead", "medium"],
  cliffWyvern: ["dragon", "wind", "medium"],
  rotheartDryad: ["plant", "poison", "medium"], beastmanChieftain: ["demihuman", "earth", "medium"], thornbackBehemoth: ["plant", "earth", "large"],
  miasmaHiveQueen: ["insect", "poison", "medium"],
  mireGhoul: ["undead", "poison", "medium"], peatHulk: ["plant", "earth", "large"], fenMoth: ["insect", "wind", "small"],
  gloomwaterHag: ["demihuman", "shadow", "medium"], mireHydra: ["dragon", "poison", "large"], bogTitan: ["plant", "water", "large"],
  plagueMothMatriarch: ["insect", "poison", "medium"],
  drownedCaptain: ["undead", "water", "medium"], abyssalKraken: ["fish", "water", "large"],
  rimeJotun: ["brute", "water", "large"], glacierWitch: ["demihuman", "water", "medium"],
  highlandLynx: ["brute", "earth", "medium"], graniteTroll: ["brute", "earth", "large"], galeHarpy: ["demon", "wind", "medium"],
  highlandRaider: ["demihuman", "neutral", "medium"], stormcrownGriffin: ["brute", "wind", "large"], avalancheGolem: ["formless", "water", "large"],
  peakShaman: ["demihuman", "wind", "medium"], elderTroll: ["brute", "earth", "large"],
  hellforgeOverseer: ["demon", "fire", "medium"], cinderBehemoth: ["demon", "fire", "large"],
  duneScarab: ["insect", "earth", "small"], duneHyena: ["brute", "earth", "medium"], sunDriedRevenant: ["undead", "undead", "medium"],
  sandWyrm: ["dragon", "earth", "large"], carrionVulture: ["brute", "wind", "medium"], scarabMonarch: ["insect", "earth", "large"],
  tombKing: ["undead", "undead", "medium"], sandstormWraith: ["undead", "wind", "medium"], duneColossus: ["formless", "earth", "large"],
  hellfireWarlock: ["demon", "fire", "medium"], obsidianSentinel: ["demon", "shadow", "medium"], infernalWyvern: ["dragon", "fire", "medium"],
  voidHusk: ["undead", "shadow", "medium"], fallenSeraph: ["demon", "holy", "medium"], abyssBehemoth: ["demon", "shadow", "large"],
  abyssWyrm: ["dragon", "shadow", "large"], wraithLord: ["undead", "ghost", "medium"],

  malakor: ["plant", "earth", "large"], leviathan: ["fish", "water", "large"], cryonix: ["demon", "water", "large"],
  ignis: ["demon", "fire", "large"], commander: ["demon", "shadow", "large"], satan: ["demon", "shadow", "large"]
};
Object.entries(TRAITS).forEach(([k, [race, element, size]]) => Object.assign(MONSTERS[k] || BOSSES[k], { race, element, size }));

// Night creatures of the plains (LORE Act I: "nocturnal abominations")
export const NIGHT_KINDS = ["voidSlime", "shadowDrake", "specter", "bloodBat", "chaosGargoyle"];

export const BLIGHTS = ["bleeding", "silence", "poison", "electrified", "burn", "freeze", "blind", "curse", "confusion"];
