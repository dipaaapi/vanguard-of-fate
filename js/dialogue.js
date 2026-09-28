import { getLang, t } from "./i18n.js";

// ==================== DIALOGUE NG MGA TAUHAN (Acts I–IV) ====================
// getDialogue(id, ctx) → { lines, action }
//   ctx.step   = kasalukuyang hakbang ng main quest (tingnan ang js/quest.js)
//   ctx.cls    = class ng player ("novice", "knight", ...)
//   action     = "shop" | "merc" | "awaken" | null (ginagawa pagkatapos ng huling linya)

const NAMES = {
  en: {
    aurelia: "Princess Aurelia", kenneth: "Prince Kenneth", king: "The King", royalGuard: "Royal Guard",
    ronald: "Captain Ronald", edgar: "Edgar the Apothecary",
    arthur: "Arthur \"Art\" Ramirez", lyra: "Lyra Vance", julian: "Dr. Julian Alcantara",
    sam: "Samantha \"Sam\" Chen", renzo: "Renzo \"Striker\" Cruz", elvenMatriarch: "Elven Matriarch"
  },
  fil: {
    aurelia: "Prinsesa Aurelia", kenneth: "Prinsipe Kenneth", king: "Ang Hari", royalGuard: "Bantay ng Hari",
    ronald: "Kapitan Ronald", edgar: "Edgar ang Apothecary",
    arthur: "Arthur \"Art\" Ramirez", lyra: "Lyra Vance", julian: "Dr. Julian Alcantara",
    sam: "Samantha \"Sam\" Chen", renzo: "Renzo \"Striker\" Cruz", elvenMatriarch: "Matriarka ng mga Elf"
  }
};

export function npcName(id) {
  return (NAMES[getLang()] || NAMES.en)[id] || NAMES.en[id] || id;
}

const LINES = {
  en: {
    summonerAllies: [
      "Captain Ronald drills our auxiliaries, and Edgar brews panaceas against the seven blights.",
      "Speak with them both. You will need their help beyond these walls."
    ],
    summonerTrial: [
      "The grassland is overrun with slimes, wild drakes and corrupted beasts.",
      "Grow stronger out there. When you reach level 10, come to the Imperial Citadel.",
      "I will await you at the audience dais, before the altar of Astraea."
    ],
    summonerAudience: [
      "You came. Look at you… no longer the frightened soul who woke on my seal.",
      "Kneel before the altar of Astraea and drink from the celestial font.",
      "Your true calling will awaken. Choose the path that is truly yours."
    ],
    summonerAwakened: [
      "It is done. Rise, Field Commander of the Grand Slaying Corps.",
      "Take this weapon, forged for you by the Royal Armory.",
      "Beyond the four Warp Gateways the frontier still burns. When the Corps marches, we march together."
    ],
    summonerLater: [
      "The Corps is preparing to march on the Gateway Frontier.",
      "Rest while you can, Commander. …I am glad it was you who answered my seal."
    ],

    kingEarly: [
      "So you are the soul my heir called across the stars.",
      "Aethelgard has little left to offer you but its gratitude… and its hope.",
      "When you are ready, my heir will await you here at the audience dais."
    ],
    kingAudience: ["The altar of Astraea is prepared. Go. My heir is waiting for you."],
    kingLater: ["Field Commander. The realm's fate now rests with you and my heir. Guard them well."],

    guardEarly: [
      "Halt! …Ah, the Earthbound one. Forgive me.",
      "The audience dais is reserved for the Job Awakening. Grow stronger first, Novice."
    ],
    guardLater: ["The Citadel stands with you, Commander!"],

    ronaldFirst: [
      "Captain Ronald, Mercenary Commander. So you're the one the Princess risked the seal for.",
      "Out there the miasma turns beasts into monsters. Don't go alone if you don't have to.",
      "For 10 gold I'll lend you one of my auxiliaries for ten minutes. Axemen, apprentices, crossbowmen, knights."
    ],
    ronaldAgain: ["Need a blade at your side? 10 gold, ten minutes."],

    edgarFirst: [
      "Edgar, apothecary of the Barracks. Mind the bubbling flasks.",
      "Bleeding, Silence, Poison, Electrify, Burn, Freeze, Blindness: the seven blights of the miasma.",
      "My panaceas purge them all. Come to me whenever the wilds leave their mark."
    ],
    edgarAgain: ["What will it be? My shelves are stocked."],

    arthur: [
      "Arthur Ramirez. I was a site engineer in Manila, until a crane line snapped.",
      "Here they call me the Vanguard Lancer. My Bastion Forcefield holds any line.",
      "If you choose the Knight's path at your Awakening, I'll teach you to stand like a wall."
    ],
    lyra: [
      "Lyra Vance. Wildlife biologist, archer… and apparently an elf now.",
      "The falcon I tried to save crossed over with me. We hunt as one.",
      "Choose the Archer's path, and I'll show you how to read the wind."
    ],
    julian: [
      "Dr. Julian Alcantara. Thirty-six hours of triage, and then this.",
      "Here my triage became prayer. My heal finds whoever is closest to death.",
      "Choose the Priest's path, and no comrade will fall while you stand."
    ],
    sam: [
      "Sam Chen, astrophysicist. Magic here is orbital mechanics with better branding.",
      "Meteor Fall is a trajectory. A Thunderstorm is just ionization with attitude.",
      "Choose the Mage's path and I'll teach you the mathematics of the sky."
    ],
    renzo: [
      "Renzo \"Striker\" Cruz. Undefeated, until a knife in an alley.",
      "Ki is adrenaline you can aim. Force Spheres mark them; the dropkick finishes them.",
      "Choose the Fighter's path and I'll put you through training camp."
    ],
    mentorMine: ["You chose my path. Make it count, Commander."],
    mentorOther: ["Every path leads to the same enemy. Good luck, Commander."],

    elvenMatriarch: ["The Whispering Canopy weeps black sap. When you come, come quickly."]
  },

  fil: {
    summonerAllies: [
      "Si Kapitan Ronald ang nagsasanay sa aming mga auxiliary, at si Edgar ang gumagawa ng panlunas sa pitong sumpa.",
      "Kausapin mo silang dalawa. Kakailanganin mo ang tulong nila sa labas ng mga pader na ito."
    ],
    summonerTrial: [
      "Pinamumugaran ang kaparangan ng mga slime, mababangis na drake at nilamong halimaw.",
      "Magpalakas ka roon. Kapag umabot ka na sa level 10, pumunta ka sa Imperial Citadel.",
      "Hihintayin kita sa audience dais, sa harap ng altar ni Astraea."
    ],
    summonerAudience: [
      "Dumating ka. Tingnan mo ang sarili mo… hindi ka na ang takot na kaluluwang nagising sa aking selyo.",
      "Lumuhod ka sa harap ng altar ni Astraea at uminom mula sa celestial font.",
      "Magigising ang iyong tunay na tungkulin. Piliin mo ang landas na tunay na sa iyo."
    ],
    summonerAwakened: [
      "Tapos na. Tumayo ka, Field Commander ng Grand Slaying Corps.",
      "Tanggapin mo ang sandatang ito, hinulma para sa iyo ng Royal Armory.",
      "Lampas sa apat na Warp Gateway ay nagliliyab pa ang hangganan. Kapag lumakad ang Corps, sabay tayong lalakad."
    ],
    summonerLater: [
      "Naghahanda ang Corps na sumalakay sa Gateway Frontier.",
      "Magpahinga ka habang may pagkakataon, Commander. …Masaya akong ikaw ang tumugon sa aking selyo."
    ],

    kingEarly: [
      "Kung gayon, ikaw ang kaluluwang tinawag ng aking tagapagmana mula sa kabila ng mga bituin.",
      "Kaunti na lang ang maibibigay ng Aethelgard sa iyo kundi ang pasasalamat nito… at pag-asa.",
      "Kapag handa ka na, hihintayin ka ng aking tagapagmana dito sa audience dais."
    ],
    kingAudience: ["Handa na ang altar ni Astraea. Humayo ka. Naghihintay sa iyo ang aking tagapagmana."],
    kingLater: ["Field Commander. Nasa iyo at sa aking tagapagmana na ang kapalaran ng kaharian. Ingatan mo siya."],

    guardEarly: [
      "Tigil! …Ah, ang taga-Daigdig. Patawad.",
      "Para lamang sa Job Awakening ang audience dais. Magpalakas ka muna, Novice."
    ],
    guardLater: ["Kasama mo ang Citadel, Commander!"],

    ronaldFirst: [
      "Kapitan Ronald, Mercenary Commander. Ikaw pala ang dahilan kung bakit isinugal ng Prinsesa ang selyo.",
      "Sa labas, ginagawang halimaw ng miasma ang mga hayop. Huwag kang mag-isa kung hindi kailangan.",
      "Sa halagang 10 gold, ipahihiram ko sa iyo ang isa sa aking mga auxiliary nang sampung minuto."
    ],
    ronaldAgain: ["Kailangan mo ng kasama sa laban? 10 gold, sampung minuto."],

    edgarFirst: [
      "Edgar, apothecary ng Barracks. Ingat sa mga kumukulong prasko.",
      "Pagdurugo, Silence, Lason, Kuryente, Paso, Yelo, Pagkabulag: ang pitong sumpa ng miasma.",
      "Kayang linisin lahat iyan ng aking mga panlunas. Lumapit ka sa akin kapag may iniwang marka ang kagubatan."
    ],
    edgarAgain: ["Ano ang kailangan mo? Puno ang aking mga estante."],

    arthur: [
      "Arthur Ramirez. Site engineer ako sa Maynila, hanggang sa naputol ang kable ng crane.",
      "Dito, tinatawag nila akong Vanguard Lancer. Walang linyang hindi kayang hawakan ng aking Bastion Forcefield.",
      "Kung pipiliin mo ang landas ng Knight sa iyong Awakening, tuturuan kitang tumayo na parang pader."
    ],
    lyra: [
      "Lyra Vance. Wildlife biologist, mamamana… at mukhang elf na rin ngayon.",
      "Tumawid kasama ko ang falcon na sinubukan kong iligtas. Sabay kaming nangangaso.",
      "Piliin mo ang landas ng Archer, at ituturo ko sa iyo kung paano basahin ang hangin."
    ],
    julian: [
      "Dr. Julian Alcantara. Tatlumpu't anim na oras ng triage, at pagkatapos ay ito.",
      "Dito, naging panalangin ang aking triage. Hinahanap ng aking lunas ang pinakamalapit sa kamatayan.",
      "Piliin mo ang landas ng Priest, at walang kasamang babagsak habang nakatayo ka."
    ],
    sam: [
      "Sam Chen, astrophysicist. Ang mahika rito ay orbital mechanics lang na mas maganda ang pangalan.",
      "Trajectory lang ang Meteor Fall. Ang Thunderstorm ay ionization na may ugali.",
      "Piliin mo ang landas ng Mage at ituturo ko sa iyo ang matematika ng langit."
    ],
    renzo: [
      "Renzo \"Striker\" Cruz. Hindi natalo, hanggang sa isang kutsilyo sa eskinita.",
      "Ang Ki ay adrenaline na kayang itutok. Minamarkahan sila ng Force Sphere; tinatapos ng dropkick.",
      "Piliin mo ang landas ng Fighter at isasabak kita sa training camp."
    ],
    mentorMine: ["Pinili mo ang aking landas. Pagbutihin mo, Commander."],
    mentorOther: ["Iisa lang ang kalaban sa dulo ng bawat landas. Good luck, Commander."],

    elvenMatriarch: ["Lumuluha ng itim na dagta ang Whispering Canopy. Kapag darating ka, bilisan mo."]
  }
};

function L(key) {
  return (LINES[getLang()] || LINES.en)[key] || LINES.en[key] || [];
}

const MENTOR_CLASS = { arthur: "knight", lyra: "archer", julian: "priest", sam: "mage", renzo: "fighter" };

// ctx: { step, cls, summoner, met: { ronald, edgar } }
export function getDialogue(id, ctx) {
  const step = ctx.step;

  if (id === "aurelia" || id === "kenneth") {
    if (step === 0) {
      const rank = id === "aurelia" ? t("rankPrincess") : t("rankPrince");
      const name = id === "aurelia" ? "Aurelia" : "Kenneth";
      return { lines: t("welcome", name, rank), action: null };
    }
    if (step === 1) return { lines: L("summonerAllies"), action: null };
    if (step === 2) return { lines: L("summonerTrial"), action: null };
    if (step === 3) return { lines: L("summonerAudience"), action: "awaken" };
    if (ctx.justAwakened) return { lines: L("summonerAwakened"), action: null };
    return { lines: L("summonerLater"), action: null };
  }

  if (id === "king") {
    if (step === 3) return { lines: L("kingAudience"), action: null };
    return { lines: step >= 4 ? L("kingLater") : L("kingEarly"), action: null };
  }
  if (id === "royalGuard") return { lines: step >= 4 ? L("guardLater") : L("guardEarly"), action: null };

  if (id === "ronald") return { lines: ctx.met.ronald ? L("ronaldAgain") : L("ronaldFirst"), action: "merc" };
  if (id === "edgar") return { lines: ctx.met.edgar ? L("edgarAgain") : L("edgarFirst"), action: "shop" };

  if (MENTOR_CLASS[id]) {
    if (ctx.cls === "novice") return { lines: L(id), action: null };
    return { lines: ctx.cls === MENTOR_CLASS[id] ? L("mentorMine") : L("mentorOther"), action: null };
  }

  return { lines: L(id), action: null };
}
