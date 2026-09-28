// Mga teksto ng UI sa English at Filipino. English ang default; naka-save ang pinili sa localStorage.
const STRINGS = {
  en: {
    subtitle: "Isekai Rebirth · Chronicles of Aethelgard",
    tagline: "Summoned from Earth · Five souls bound by prophecy",
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

    titleHint: "<span>↑ ↓</span> Select &nbsp;·&nbsp; <span>Enter</span> Confirm &nbsp;·&nbsp; <span>Esc</span> Back",
    optionsHint: "<span>↑ ↓</span> Select &nbsp;·&nbsp; <span>Enter / ← →</span> Change &nbsp;·&nbsp; <span>Esc</span> Back",
    chroniclesHint: "<span>← →</span> Chapter &nbsp;·&nbsp; <span>↑ ↓</span> Scroll &nbsp;·&nbsp; <span>Esc</span> Close",
    selectHint: "<span>A / D</span> Choose hero &nbsp;|&nbsp; <span>Enter / Space</span> Embark &nbsp;|&nbsp; or click a hero below",
    playHint: "<span>WASD</span> Move &nbsp;|&nbsp; <span>Space</span> Sprint &nbsp;|&nbsp; <span>J</span> Attack &nbsp;|&nbsp; <span>K</span> Skill &nbsp;|&nbsp; <span>E</span> Shop &nbsp;|&nbsp; <span>M</span> Hire Merc (10G) &nbsp;|&nbsp; <span>P</span> Pause",

    sideLore: "CHRONICLES OF AETHELGARD",
    sideDossier: "EARTHBOUND DOSSIER",

    invalidSave: "Invalid save file format!",
    badSave: "Failed to read the .json save file!",

    // ---- Act 1: Summoning ----
    genderTitle: "Who answers the summons?",
    male: "Male",
    female: "Female",
    summonedBy: (name) => `Summoned by ${name}`,
    princess: "Princess Aurelia",
    prince: "Prince Kenneth",
    genderHint: "<span>← →</span> Choose &nbsp;·&nbsp; <span>Enter</span> Confirm &nbsp;·&nbsp; <span>Esc</span> Back",
    cutsceneHint: "<span>Enter</span> Next &nbsp;·&nbsp; <span>Esc</span> Skip",
    narration: [
      "Year 2026. A total eclipse darkens the skies of Earth…",
      "…and in another world, a royal summoner begins a forbidden rite.",
      "The Pentagram Seal awakens."
    ],
    welcome: (name, rank) => [
      "It worked… the seal held. Can you hear me, traveler from Earth?",
      `I am ${name}, ${rank} of Aethelgard and Commander of the Royal Magic Corps.`,
      "Forgive me for tearing you from your world. Demon Lord Satan has awakened, and our steel alone cannot hold back his miasma.",
      "You arrive as a Novice — no calling yet, only a dagger, a buckler, and the courage that drew the seal to you.",
      "Beyond the Barracks lie twelve platforms, each more corrupted than the last. Grow stronger, reach level 10, and the next gateway will open.",
      "Prove yourself on the first platform, then return to me. At the altar of Astraea, your true calling will awaken.",
      "On the last platform waits Satan himself. …I will be with you until then."
    ],
    rankPrincess: "Crown Princess",
    rankPrince: "Crown Prince",

    // ---- Job Awakening ----
    awakenReady: "✦ JOB AWAKENING READY — RETURN TO THE BARRACKS ✦",
    awakenTitle: "JOB AWAKENING",
    awakenSub: "CHOOSE YOUR TRUE CALLING AT THE ALTAR OF ASTRAEA",
    awakenBtn: "AWAKEN ▶",
    embarkBtn: "EMBARK ▶",
    awakenHint: "<span>A / D</span> Choose calling &nbsp;|&nbsp; <span>Enter / Space</span> Awaken &nbsp;|&nbsp; or click below",
    gameOverRestart: "PRESS ENTER TO RETURN TO TITLE"
  },

  fil: {
    subtitle: "Isekai Rebirth · Mga Salaysay ng Aethelgard",
    tagline: "Tinawag mula sa Daigdig · Limang kaluluwang itinakda ng propesiya",
    pressAnyKey: "Pindutin ang kahit anong key",

    continue: "Ipagpatuloy",
    newGame: "Bagong Ekspedisyon",
    chronicles: "Mga Salaysay",
    options: "Mga Setting",
    back: "Bumalik",

    music: "Musika",
    sfx: "Sound Effects",
    blood: "Dugo",
    weather: "Ulan at Panahon",
    language: "Wika",
    saveData: "Save Data",
    exportSave: "I-export ang Save (.json)",
    importSave: "Mag-import ng Save (.json)",

    justNow: "ngayon lang",
    minutesAgo: (n) => `${n} minuto na`,
    hoursAgo: (n) => `${n} oras na`,
    daysAgo: (n) => `${n} araw na`,

    chroniclesTitle: "Mga Salaysay ng Aethelgard",
    loreNote: "Nasa Ingles pa ang teksto ng salaysay.",

    titleHint: "<span>↑ ↓</span> Pumili &nbsp;·&nbsp; <span>Enter</span> Kumpirmahin &nbsp;·&nbsp; <span>Esc</span> Bumalik",
    optionsHint: "<span>↑ ↓</span> Pumili &nbsp;·&nbsp; <span>Enter / ← →</span> Baguhin &nbsp;·&nbsp; <span>Esc</span> Bumalik",
    chroniclesHint: "<span>← →</span> Kabanata &nbsp;·&nbsp; <span>↑ ↓</span> Mag-scroll &nbsp;·&nbsp; <span>Esc</span> Isara",
    selectHint: "<span>A / D</span> Pumili ng Hero &nbsp;|&nbsp; <span>Enter / Space</span> Sumabak &nbsp;|&nbsp; o i-click ang hero sa ibaba",
    playHint: "<span>WASD</span> Lakad &nbsp;|&nbsp; <span>Space</span> Sprint &nbsp;|&nbsp; <span>J</span> Atake &nbsp;|&nbsp; <span>K</span> Skill &nbsp;|&nbsp; <span>E</span> Shop &nbsp;|&nbsp; <span>M</span> Umupa ng Merc (10G) &nbsp;|&nbsp; <span>P</span> Pause",

    sideLore: "MGA SALAYSAY NG AETHELGARD",
    sideDossier: "TALAAN NG MGA BAYANI",

    invalidSave: "Mali ang format ng save file!",
    badSave: "Hindi mabasa ang .json na save file!",

    // ---- Act 1: Summoning ----
    genderTitle: "Sino ang tutugon sa pagtawag?",
    male: "Lalaki",
    female: "Babae",
    summonedBy: (name) => `Tinawag ni ${name}`,
    princess: "Prinsesa Aurelia",
    prince: "Prinsipe Kenneth",
    genderHint: "<span>← →</span> Pumili &nbsp;·&nbsp; <span>Enter</span> Kumpirmahin &nbsp;·&nbsp; <span>Esc</span> Bumalik",
    cutsceneHint: "<span>Enter</span> Susunod &nbsp;·&nbsp; <span>Esc</span> Laktawan",
    narration: [
      "Taong 2026. Isang ganap na eklipse ang bumalot sa kalangitan ng Daigdig…",
      "…at sa ibang mundo, sinimulan ng isang maharlikang tagapagtawag ang ipinagbabawal na ritwal.",
      "Nagising ang Pentagram Seal."
    ],
    welcome: (name, rank) => [
      "Gumana… tumibay ang selyo. Naririnig mo ba ako, manlalakbay mula sa Daigdig?",
      `Ako si ${name}, ${rank} ng Aethelgard at Komandante ng Royal Magic Corps.`,
      "Patawarin mo ako sa paghila sa iyo mula sa iyong mundo. Nagising na ang Demon Lord na si Satan, at hindi sapat ang aming bakal laban sa kanyang miasma.",
      "Dumating ka bilang isang Novice — wala pang tungkulin, punyal at kalasag lamang, at ang tapang na humila sa selyo patungo sa iyo.",
      "Sa labas ng Barracks ay may labindalawang plataporma, bawat isa'y mas nilamon ng kadiliman. Magpalakas ka, umabot sa level 10, at bubukas ang susunod na lagusan.",
      "Patunayan mo ang sarili sa unang plataporma, saka bumalik ka sa akin. Sa altar ni Astraea, magigising ang iyong tunay na tungkulin.",
      "Sa huling plataporma naghihintay si Satan mismo. …Kasama mo ako hanggang doon."
    ],
    rankPrincess: "Prinsesa",
    rankPrince: "Prinsipe",

    // ---- Job Awakening ----
    awakenReady: "✦ HANDA NA ANG JOB AWAKENING — BUMALIK SA BARRACKS ✦",
    awakenTitle: "JOB AWAKENING",
    awakenSub: "PILIIN ANG IYONG TUNAY NA TUNGKULIN SA ALTAR NI ASTRAEA",
    awakenBtn: "GISINGIN ▶",
    embarkBtn: "SUMABAK ▶",
    awakenHint: "<span>A / D</span> Pumili ng tungkulin &nbsp;|&nbsp; <span>Enter / Space</span> Gisingin &nbsp;|&nbsp; o i-click sa ibaba",
    gameOverRestart: "PINDUTIN ANG ENTER PARA BUMALIK SA TITLE"
  }
};

export const LANGS = [
  { id: "en", label: "EN" },
  { id: "fil", label: "FIL" }
];

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
  try { localStorage.setItem(KEY, lang); } catch (_) { /* hindi na-save, ayos lang */ }
  document.documentElement.lang = lang === "fil" ? "fil" : "en";
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

document.documentElement.lang = lang === "fil" ? "fil" : "en";
