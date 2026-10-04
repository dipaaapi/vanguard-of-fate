// UI text in English and Filipino. English is the default; the choice is saved in localStorage.
const STRINGS = {
  en: {
    subtitle: "Summoned Across Worlds · The Pentagram Prophecy",
    tagline: "© 2026 EdMaster28 · All Rights Reserved",
    pressAnyKey: "Press any key",

    continue: "Continue",
    newGame: "New Expedition",
    chronicles: "Chronicles",
    options: "Options",
    back: "Back",

    music: "Music",
    sfx: "Sound Effects",
    blood: "Blood Effects",
    weather: "Rain & Weather",
    quality: "Quality",
    qualitySharp: "SHARP",
    qualityBalanced: "BALANCED",
    qualityFast: "FAST",
    fpsCounter: "FPS Counter",
    language: "Language",
    saveData: "Save Data",
    exportSave: "Export Save (.json)",
    importSave: "Import Save (.json)",

    justNow: "just now",
    minutesAgo: (n) => `${n}m ago`,
    hoursAgo: (n) => `${n}h ago`,
    daysAgo: (n) => `${n}d ago`,

    chroniclesTitle: "Chronicles of Aethelgard",
    loreNote: "",

    titleHint: "<span>↑ ↓</span> Select &nbsp;·&nbsp; <span>Enter</span> Confirm &nbsp;·&nbsp; <span>Esc</span> Main Menu",
    optionsHint: "<span>↑ ↓</span> Select &nbsp;·&nbsp; <span>Enter / ← →</span> Change &nbsp;·&nbsp; <span>Esc</span> Back",
    chroniclesHint: "<span>← →</span> Chapter &nbsp;·&nbsp; <span>↑ ↓</span> Scroll &nbsp;·&nbsp; <span>Esc</span> Close",
    credits: "Credits",
    creditsHint: "<span>↑ ↓</span> Scroll &nbsp;·&nbsp; <span>Esc</span> Close",
    credCreator: "Created & Directed by",
    credCreatorRole: "Game design, world building and art direction",
    credStory: "Story & Lore",
    credStoryRole: "The Chronicles of Aethelgard — twelve acts of the Fated Vanguard",
    credCode: "Programming",
    credCodeRole: "Built together with Claude, an AI coding assistant, in Claude Code",
    credTech: "Technology",
    credTechCanvas: "the entire game world, drawn frame by frame",
    credTechJs: "no engine, no framework — plain modules",
    credTechCss: "menus, panels and the title screen",
    credTechAudio: "procedural music and sound effects",
    credTechSave: "saves, export and import",
    credTechPixel: "Procedural pixel art",
    credTechPixelSub: "every hero, monster, item and tile is generated in code",
    credTechClaude: "AI pair programming",
    credInspired: "Inspired by",
    credIsekai: "the isekai genre",
    credLang: "Languages",
    credThanks: "And to you, Champion — thank you for answering the summons.",
    selectHint: "<span>A / D</span> Choose hero &nbsp;|&nbsp; <span>Enter / Space</span> Embark &nbsp;|&nbsp; or click a hero below",
    playHint: "<span>WASD</span> Move &nbsp;|&nbsp; <span>Space</span> Sprint &nbsp;|&nbsp; <span>J</span> Attack &nbsp;|&nbsp; <span>K</span> <span>L</span> Skills &nbsp;|&nbsp; <span>Shift</span> Target &nbsp;|&nbsp; <span>E</span> Talk &nbsp;|&nbsp; <span>Q</span> Quests &nbsp;|&nbsp; <span>I</span> Inventory &nbsp;|&nbsp; <span>C</span> Character &nbsp;|&nbsp; <span>1-4</span> Potions &nbsp;|&nbsp; <span>M</span> Map &nbsp;|&nbsp; <span>Esc</span> Pause",
    mentorLabel: "YOUR MENTOR",

    sideLore: "CHRONICLES OF AETHELGARD",
    sideDossier: "EARTHBOUND DOSSIER",

    // ---- Bottom bar (HUD outside the screen) + Act reader ----
    hbFoes: "Foes",
    hbLoot: "Loot",
    hbSanctuary: "Sanctuary",
    hbOutlands: "Outlands",
    hbQuests: "Quests",
    hbPause: "Pause",
    hbResume: "Resume",
    readMore: "Read more",
    readerTitle: "Chronicles of Aethelgard",
    actDone: "Finished",
    actActive: "Active",
    actLocked: "Locked",
    readerHint: "<span>← →</span> Act &nbsp;·&nbsp; <span>↑ ↓</span> Scroll &nbsp;·&nbsp; <span>Esc</span> Close",

    invalidSave: "Invalid save file format!",
    badSave: "Failed to load secure save file (.vof / .json) — file may be corrupted or tampered!",

    // ---- Act 1: Summoning ----
    male: "Male",
    female: "Female",
    summonedBy: (name) => `Summoned by ${name}`,
    princess: "Princess Aurelia",
    prince: "Prince Kenneth",
    welcome: (name, rank) => [
      "It worked… the seal held. Can you hear me, traveler from Earth?",
      `I am ${name}, ${rank} of Aethelgard and Supreme Commander of the Imperial Magic & Research Corps.`,
      "Forgive me for tearing you from your world. Demon Lord Satan has awakened, and our steel alone cannot hold back his miasma.",
      "You arrive as a Novice — no calling yet, only a dagger, a buckler, and the courage that drew the seal to you.",
      "Focus your will and a golden panel only you can read will open: the Covenant Ledger. Every soul I have called sees one.",
      "The grassland beyond the Barracks is overrun. Grow stronger there, reach level 10, then come to me at the audience dais of the Imperial Citadel. At the altar of Astraea, your true calling will awaken.",
      "Past the Warp Gateways the corruption only deepens, and at its heart waits Satan himself. …I will be with you until then."
    ],
    rankPrincess: "Crown Princess",
    rankPrince: "Crown Prince",

    // ---- Job Awakening ----
    awakenTitle: "JOB AWAKENING",
    awakenSub: "CHOOSE YOUR TRUE CALLING AT THE ALTAR OF ASTRAEA",
    awakenBtn: "AWAKEN ▶",
    embarkBtn: "EMBARK ▶",
    awakenHint: "<span>A / D</span> Choose calling &nbsp;|&nbsp; <span>Enter / Space</span> Awaken &nbsp;|&nbsp; or click below",

    // ---- Character Creator ----
    crTitle: "Create Your Novice",
    crSub: "The Pentagram Seal will call this soul to Aethelgard",
    crName: "Name",
    crNamePh: "Novice",
    crWalk: "Walk",
    crIdle: "Idle",
    crRun: "Dash",
    crHome: "Main Menu",
    crFull: "Full Screen",
    crRestore: "Normal Screen",
    crFront: "Front",
    crRight: "Right",
    crBackView: "Back",
    crLeft: "Left",
    crRandom: "Random",
    crBegin: "Begin ▶",
    crHint: "<span>↑ ↓</span> Select &nbsp;·&nbsp; <span>← →</span> Change &nbsp;·&nbsp; <span>Q / E</span> Rotate &nbsp;·&nbsp; <span>V</span> Idle/Walk/Dash &nbsp;·&nbsp; <span>F</span> Full Screen &nbsp;·&nbsp; <span>R</span> Random &nbsp;·&nbsp; <span>Enter</span> Begin &nbsp;·&nbsp; <span>Esc</span> Back",
    crBody: "Body",
    crHair: "Hair",
    crOutfit: "Outfit",
    crLegs: "Legs & Feet",
    cr_body: "Body type",
    cr_skin: "Skin",
    cr_eyes: "Eyes",
    cr_hairStyle: "Style",
    cr_hairColor: "Color",
    cr_outfit: "Top",
    cr_outfitColor: "Color",
    cr_gloves: "Hands",
    cr_legs: "Bottom",
    cr_legColor: "Color",
    cr_boots: "Feet",
    cr_bootColor: "Color",
    opt_male: "Male",
    opt_female: "Female",
    opt_short: "Short",
    opt_spiky: "Spiky",
    opt_long: "Long",
    opt_ponytail: "Ponytail",
    opt_bob: "Bob",
    opt_twintails: "Twin tails",
    opt_buzz: "Buzz cut",
    opt_tunic: "Leather tunic",
    opt_vest: "Traveler vest",
    opt_robe: "Apprentice robe",
    opt_none: "Bare hands",
    opt_leather: "Leather gloves",
    opt_wraps: "Cloth wraps",
    opt_pants: "Trousers",
    opt_shorts: "Shorts",
    opt_skirt: "Skirt",
    opt_boots: "Boots",
    opt_shoes: "Shoes",
    opt_sandals: "Sandals"
  },

  fil: {
    subtitle: "Tinawag Mula sa Ibang Daigdig · Ang Propesiya ng Limang sulok ng Selyo",
    tagline: "© 2026 Nilikha ni EdMaster28 · Lahat ng Karapatan ay Nakareserba",
    pressAnyKey: "Pindutin ang kahit anong button",

    continue: "Ipagpatuloy",
    newGame: "Bagong Ekspedisyon",
    chronicles: "Mga Salaysay",
    options: "Mga Setting",
    back: "Bumalik",

    music: "Musika",
    sfx: "Sound Effects",
    blood: "Dugo",
    weather: "Ulan at Panahon",
    quality: "Kalidad",
    qualitySharp: "MATALAS",
    qualityBalanced: "BALANSE",
    qualityFast: "MABILIS",
    fpsCounter: "FPS Counter",
    language: "Wika",
    saveData: "Save Data",
    exportSave: "I-export ang Save (.json)",
    importSave: "Mag-import ng Save (.json)",

    justNow: "ngayon lang",
    minutesAgo: (n) => `${n} minuto na`,
    hoursAgo: (n) => `${n} oras na`,
    daysAgo: (n) => `${n} araw na`,

    chroniclesTitle: "Mga Salaysay ng Aethelgard",
    loreNote: "",

    titleHint: "<span>↑ ↓</span> Pumili &nbsp;·&nbsp; <span>Enter</span> Kumpirmahin &nbsp;·&nbsp; <span>Esc</span> Main Menu",
    optionsHint: "<span>↑ ↓</span> Pumili &nbsp;·&nbsp; <span>Enter / ← →</span> Baguhin &nbsp;·&nbsp; <span>Esc</span> Bumalik",
    chroniclesHint: "<span>← →</span> Kabanata &nbsp;·&nbsp; <span>↑ ↓</span> Mag-scroll &nbsp;·&nbsp; <span>Esc</span> Isara",
    credits: "Mga Gumawa",
    creditsHint: "<span>↑ ↓</span> Mag-scroll &nbsp;·&nbsp; <span>Esc</span> Isara",
    credCreator: "Nilikha at Idinirehe ni",
    credCreatorRole: "Disenyo ng laro, paglikha ng mundo at direksyon ng sining",
    credStory: "Kuwento at Lore",
    credStoryRole: "Ang mga Salaysay ng Aethelgard — labindalawang act ng Fated Vanguard",
    credCode: "Programming",
    credCodeRole: "Binuo kasama si Claude, isang AI coding assistant, sa Claude Code",
    credTech: "Teknolohiya",
    credTechCanvas: "ang buong mundo ng laro, iginuguhit bawat frame",
    credTechJs: "walang engine, walang framework — purong module",
    credTechCss: "mga menu, panel at title screen",
    credTechAudio: "musika at tunog na nililikha ng code",
    credTechSave: "pag-save, export at import",
    credTechPixel: "Procedural na pixel art",
    credTechPixelSub: "bawat bayani, halimaw, item at tile ay nililikha ng code",
    credTechClaude: "AI na katuwang sa programming",
    credInspired: "Hango sa",
    credIsekai: "ang isekai na genre",
    credLang: "Mga Wika",
    credThanks: "At sa iyo, Kampeon — salamat sa pagsagot sa pagtawag.",
    selectHint: "<span>A / D</span> Pumili ng Hero &nbsp;|&nbsp; <span>Enter / Space</span> Sumabak &nbsp;|&nbsp; o i-click ang hero sa ibaba",
    playHint: "<span>WASD</span> Lakad &nbsp;|&nbsp; <span>Space</span> Sprint &nbsp;|&nbsp; <span>J</span> Atake &nbsp;|&nbsp; <span>K</span> <span>L</span> Skill &nbsp;|&nbsp; <span>Shift</span> Target &nbsp;|&nbsp; <span>E</span> Kausapin &nbsp;|&nbsp; <span>Q</span> Quest &nbsp;|&nbsp; <span>I</span> Imbentaryo &nbsp;|&nbsp; <span>C</span> Karakter &nbsp;|&nbsp; <span>1-4</span> Gamot &nbsp;|&nbsp; <span>M</span> Mapa &nbsp;|&nbsp; <span>Esc</span> Pause",
    mentorLabel: "IYONG MENTOR",

    sideLore: "MGA SALAYSAY NG AETHELGARD",
    sideDossier: "TALAAN NG MGA BAYANI",

    // ---- Bottom bar (HUD outside the screen) + Act reader ----
    hbFoes: "Kalaban",
    hbLoot: "Samsam",
    hbSanctuary: "Santuwaryo",
    hbOutlands: "Kaparangan",
    hbQuests: "Quest",
    hbPause: "Pause",
    hbResume: "Ituloy",
    readMore: "Magbasa pa",
    readerTitle: "Mga Salaysay ng Aethelgard",
    actDone: "Tapos",
    actActive: "Kasalukuyan",
    actLocked: "Nakakandado",
    readerHint: "<span>← →</span> Act &nbsp;·&nbsp; <span>↑ ↓</span> Mag-scroll &nbsp;·&nbsp; <span>Esc</span> Isara",

    invalidSave: "Mali ang format ng save file!",
    badSave: "Hindi mabasa o nabago ang ligtas na save file (.vof / .json)!",

    // ---- Act 1: Summoning ----
    male: "Lalaki",
    female: "Babae",
    summonedBy: (name) => `Tinawag ni ${name}`,
    princess: "Prinsesa Aurelia",
    prince: "Prinsipe Kenneth",
    welcome: (name, rank) => [
      "Gumana… tumibay ang selyo. Naririnig mo ba ako, manlalakbay mula sa Daigdig?",
      `Ako si ${name}, ${rank} ng Aethelgard at Pinakamataas na Komandante ng Imperial Magic & Research Corps.`,
      "Patawarin mo ako sa paghila sa iyo mula sa iyong mundo. Nagising na ang Demon Lord na si Satan, at hindi sapat ang aming bakal laban sa kanyang miasma.",
      "Dumating ka bilang isang Novice — wala pang tungkulin, punyal at kalasag lamang, at ang tapang na humila sa selyo patungo sa iyo.",
      "Ituon mo ang iyong loob at bubukas ang isang gintong panel na ikaw lamang ang makababasa: ang Covenant Ledger. Nakikita ito ng bawat kaluluwang tinawag ko.",
      "Pinamumugaran ng halimaw ang kaparangan sa labas ng Barracks. Magpalakas ka roon, umabot sa level 10, saka puntahan mo ako sa audience dais ng Imperial Citadel. Sa altar ni Astraea, magigising ang iyong tunay na tungkulin.",
      "Sa kabila ng mga Warp Gateway ay lalong lumalalim ang kadiliman, at sa puso nito naghihintay si Satan mismo. …Kasama mo ako hanggang doon."
    ],
    rankPrincess: "Prinsesa",
    rankPrince: "Prinsipe",

    // ---- Job Awakening ----
    awakenTitle: "JOB AWAKENING",
    awakenSub: "PILIIN ANG IYONG TUNAY NA TUNGKULIN SA ALTAR NI ASTRAEA",
    awakenBtn: "GISINGIN ▶",
    embarkBtn: "SUMABAK ▶",
    awakenHint: "<span>A / D</span> Pumili ng tungkulin &nbsp;|&nbsp; <span>Enter / Space</span> Gisingin &nbsp;|&nbsp; o i-click sa ibaba",

    // ---- Character Creator ----
    crTitle: "Likhain ang Iyong Novice",
    crSub: "Tatawagin ng Pentagram Seal ang kaluluwang ito sa Aethelgard",
    crName: "Pangalan",
    crNamePh: "Novice",
    crWalk: "Lakad",
    crIdle: "Tayo",
    crRun: "Takbo",
    crHome: "Main Menu",
    crFull: "Full Screen",
    crRestore: "Normal na Screen",
    crFront: "Harap",
    crRight: "Kanan",
    crBackView: "Likod",
    crLeft: "Kaliwa",
    crRandom: "Random",
    crBegin: "Simulan ▶",
    crHint: "<span>↑ ↓</span> Pumili &nbsp;·&nbsp; <span>← →</span> Baguhin &nbsp;·&nbsp; <span>Q / E</span> Iikot &nbsp;·&nbsp; <span>V</span> Tayo/Lakad/Takbo &nbsp;·&nbsp; <span>F</span> Full Screen &nbsp;·&nbsp; <span>R</span> Random &nbsp;·&nbsp; <span>Enter</span> Simulan &nbsp;·&nbsp; <span>Esc</span> Bumalik",
    crBody: "Katawan",
    crHair: "Buhok",
    crOutfit: "Kasuotan",
    crLegs: "Binti at Paa",
    cr_body: "Uri ng katawan",
    cr_skin: "Balat",
    cr_eyes: "Mata",
    cr_hairStyle: "Estilo",
    cr_hairColor: "Kulay",
    cr_outfit: "Pang-itaas",
    cr_outfitColor: "Kulay",
    cr_gloves: "Kamay",
    cr_legs: "Pang-ibaba",
    cr_legColor: "Kulay",
    cr_boots: "Paa",
    cr_bootColor: "Kulay",
    opt_male: "Lalaki",
    opt_female: "Babae",
    opt_short: "Maikli",
    opt_spiky: "Nakatayo",
    opt_long: "Mahaba",
    opt_ponytail: "Nakapusod",
    opt_bob: "Bob",
    opt_twintails: "Dalawang pusod",
    opt_buzz: "Semi-kalbo",
    opt_tunic: "Tunikang katad",
    opt_vest: "Tsalekong panlakbay",
    opt_robe: "Balabal ng baguhan",
    opt_none: "Walang guwantes",
    opt_leather: "Guwantes na katad",
    opt_wraps: "Balot na tela",
    opt_pants: "Pantalon",
    opt_shorts: "Shorts",
    opt_skirt: "Palda",
    opt_boots: "Bota",
    opt_shoes: "Sapatos",
    opt_sandals: "Sandalyas"
  }
};

const KEY = "vanguard_lang";
let lang = "en";
try {
  const saved = localStorage.getItem(KEY);
  if (saved && STRINGS[saved]) lang = saved;
} catch (_) { /* default: English */ }

const listeners = [];

export function getLang() {
  return lang;
}

export function setLang(next) {
  if (!STRINGS[next] || next === lang) return;
  lang = next;
  try { localStorage.setItem(KEY, lang); } catch (_) { /* not saved; that is fine */ }
  document.documentElement.setAttribute("data-game-lang", lang);
  listeners.forEach((fn) => fn(lang));
}

export function toggleLang() {
  setLang(lang === "en" ? "fil" : "en");
}

export function onLangChange(fn) {
  listeners.push(fn);
}

// t("minutesAgo", 5) → "5m ago"
export function t(key, ...args) {
  const v = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  return typeof v === "function" ? v(...args) : v;
}

document.documentElement.setAttribute("data-game-lang", lang);
