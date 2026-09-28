import { getLang, t } from "./i18n.js";
import { MENTOR_BY_CLASS } from "./quest.js";

// ==================== CHARACTER DIALOGUE (Acts II–VI) ====================
// getDialogue(id, ctx) → { lines, action }
//   ctx.step     = current main-quest step (see js/quest.js)
//   ctx.cls      = the player's class ("novice", "knight", ...)
//   ctx.summoner = "aurelia" | "kenneth" (for {Heir} in the lines)
//   action     = "shop" | "merc" | "awaken" | … | null (runs after the last line)

const NAMES = {
  en: {
    aurelia: "Princess Aurelia", kenneth: "Prince Kenneth", king: "The King", royalGuard: "Royal Guard",
    ronald: "Captain Ronald", edgar: "Edgar the Apothecary",
    arthur: "Arthur \"Art\" Ramirez", lyra: "Lyra Vance", julian: "Dr. Julian Alcantara",
    sam: "Samantha \"Sam\" Chen", renzo: "Renzo \"Striker\" Cruz", elvenMatriarch: "Elven Matriarch",
    brakka: "Brakka Emberforge", hilde: "Hilde Rivetmend", durgrim: "Thane Durgrim Ashenhelm", pip: "Pip Gildbarrow"
  },
  fil: {
    aurelia: "Prinsesa Aurelia", kenneth: "Prinsipe Kenneth", king: "Ang Hari", royalGuard: "Bantay ng Hari",
    ronald: "Kapitan Ronald", edgar: "Edgar ang Apothecary",
    arthur: "Arthur \"Art\" Ramirez", lyra: "Lyra Vance", julian: "Dr. Julian Alcantara",
    sam: "Samantha \"Sam\" Chen", renzo: "Renzo \"Striker\" Cruz", elvenMatriarch: "Matriarka ng mga Elf",
    brakka: "Brakka Emberforge", hilde: "Hilde Rivetmend", durgrim: "Thane Durgrim Ashenhelm", pip: "Pip Gildbarrow"
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
    summonerSouls: [
      "You are not the first soul to cross the veil. Five answered the seal before you.",
      "An engineer, an archer, a surgeon, an astrophysicist and a street fighter. Each carries a discipline from Earth.",
      "They wait here in the Barracks. Speak with all five; at your Awakening, one of their paths will become yours."
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
      "Your calling has unsealed the Dual Equipment Matrix. Return to the Barracks: {mentor} will help you choose your armaments."
    ],
    summonerArmory: [
      "Two hands on one great weapon, or a blade with an offhand beside it. Every loadout has its price.",
      "{mentor} is waiting in the Barracks. Inspect your gear before the Corps departs."
    ],
    summonerCovenant: [
      "Commander. I came down from the observatory… the casualty reports can wait a little longer.",
      "The miasma thins wherever the Corps has marched. Your shard yields alone have fed the Research Corps for a month.",
      "…I tore you from your world and placed ours on your shoulders. I have not forgiven myself for that.",
      "Tell me about Earth sometime. I want to know what I took from you. And I promise: we will see an uncorrupted dawn together."
    ],
    summonerLater: [
      "The scouts report black sap weeping from the Whispering Canopy. The Corps marches on the forest next.",
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
      "Captain Ronald, Mercenary Commander. So you're the one the {Heir} risked the seal for.",
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

    brakka: [
      "Hah! A surface-walker who survived the ash. Welcome to Emberhold's forge.",
      "Your captain can nudge a blade to +4. Past that, steel needs dwarven fire. Bring me your gear."
    ],
    brakkaAgain: ["The anvil's hot. What are we refining?"],
    hilde: [
      "Hilde Rivetmend. You swing, it dents; you get hit, it cracks. That's where I come in.",
      "Half the price your Barracks captain charges, and twice the care."
    ],
    hildeAgain: ["Let's see how badly you've treated that armor this time."],
    durgrim: [
      "I am Durgrim Ashenhelm, Thane of Emberhold. We held these halls while the Hellforge burned around us.",
      "You and {Heir} are welcome under our roof. Rest here; the ash cannot follow."
    ],
    durgrimAgain: ["Emberhold stands. So long as it does, you have a home in the wastes."],
    pip: [
      "Pip Gildbarrow, finest stall this side of the lava river! Shards, Oridecon, potions — fair prices, mostly.",
      "Everything's hauled in by cart past the magma drakes, so don't haggle too hard."
    ],
    pipAgain: ["Back for more? Coin first, then goods!"],

    arthur: [
      "Arthur Ramirez. I was a site engineer in Manila, until a crane line snapped.",
      "Here they call me the Vanguard Lancer. My Bastion Forcefield holds any line.",
      "If you choose the Knight's path at your Awakening, I'll teach you to stand like a wall."
    ],
    lyra: [
      "Lyra Vance. Wildlife biologist, Olympic recurve archer… and apparently an elf now.",
      "The alpine falcon I sheltered in the blizzard crossed over with me. We hunt as one.",
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
    armoryKnight: [
      "Knight's doctrine, Commander. Two hands on the Heavy Lance and you become a battering ram. Thrusts that pierce whole columns.",
      "Or a broadsword and a Tower Shield: less reach, but you hold inside the Bastion Forcefield and blow the horde back.",
      "Remember: a two-handed weapon locks your offhand slot. Choose before you leave these walls."
    ],
    armoryArcher: [
      "A Recurve Longbow with a strapped Quiver: long-range piercing shots, as long as you time your reloads.",
      "Or an automatic Crossbow with Trapper Tools: close skirmishes, snares, and the falcon diving where you point.",
      "Two hands on the bow means no offhand. Read the wind, then read your loadout."
    ],
    armoryPriest: [
      "The Grand Scepter takes both hands, but its sacred shockwaves break dark rituals wide open.",
      "The Holy Rosary with a Grimoire shortens your triage cooldowns and keeps the Guardian Angels standing longer.",
      "Triage is choosing. So is this. Choose before we march."
    ],
    armoryMage: [
      "Great Staff: two hands, planetary leylines, bigger meteors. Entire battalions, gone.",
      "Wand plus an Arcane Grimoire or Focus Shield: faster incantations, and something between you and a flanker.",
      "A two-handed staff locks the offhand. That's not a rule, it's physics."
    ],
    armoryFighter: [
      "Dual Claws take both hands. Relentless flurries that tear through demon carapace.",
      "Brawler Gloves with a Qi Talisman: guided spirit blasts, then the flying finisher kick.",
      "Two-handed means no offhand. Pick your stance before you walk out of this camp."
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
    summonerSouls: [
      "Hindi ka ang unang kaluluwang tumawid sa tabing. Lima ang naunang tumugon sa selyo.",
      "Isang inhinyero, isang mamamana, isang siruhano, isang astrophysicist at isang mandirigma ng lansangan. Bawat isa'y may dalang disiplina mula sa Daigdig.",
      "Naghihintay sila rito sa Barracks. Kausapin mo silang lima; sa iyong Awakening, magiging iyo ang isa sa kanilang landas."
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
      "Nabuksan ng iyong tungkulin ang Dual Equipment Matrix. Bumalik ka sa Barracks: tutulungan ka ni {mentor} na pumili ng sandata."
    ],
    summonerArmory: [
      "Dalawang kamay sa isang malaking sandata, o talim na may offhand sa tabi. May kapalit ang bawat loadout.",
      "Naghihintay si {mentor} sa Barracks. Suriin mo ang iyong gamit bago umalis ang Corps."
    ],
    summonerCovenant: [
      "Commander. Bumaba ako mula sa obserbatoryo… makapaghihintay muna ang mga ulat ng nasawi.",
      "Numinipis ang miasma saanman dumaan ang Corps. Ang mga shard na nakuha mo ay nagpakain sa Research Corps nang isang buwan.",
      "…Hinila kita mula sa iyong mundo at ipinasan sa iyo ang amin. Hindi ko pa napapatawad ang sarili ko.",
      "Ikuwento mo sa akin ang Daigdig balang araw. Gusto kong malaman kung ano ang kinuha ko sa iyo. At pangako: sabay nating makikita ang malinis na bukang-liwayway."
    ],
    summonerLater: [
      "Ayon sa mga scout, lumuluha ng itim na dagta ang Whispering Canopy. Ang kagubatan ang susunod na sasalakayin ng Corps.",
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
      "Kapitan Ronald, Mercenary Commander. Ikaw pala ang dahilan kung bakit isinugal ng {Heir} ang selyo.",
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

    brakka: [
      "Hah! Isang taga-ibabaw na nakaligtas sa abo. Maligayang pagdating sa pandayan ng Emberhold.",
      "Hanggang +4 lang ang kaya ng inyong kapitan. Lampas doon, kailangan ng apoy ng dwarf. Dalhin mo rito ang gamit mo."
    ],
    brakkaAgain: ["Mainit ang palihan. Ano ang ire-refine natin?"],
    hilde: [
      "Hilde Rivetmend. Hahampas ka, mayuyupi; tatamaan ka, mabibitak. Diyan ako papasok.",
      "Kalahati ng singil ng kapitan ninyo sa Barracks, at doble ang ingat."
    ],
    hildeAgain: ["Tingnan natin kung gaano mo na naman sinira ang baluting iyan."],
    durgrim: [
      "Ako si Durgrim Ashenhelm, Thane ng Emberhold. Hinawakan namin ang mga bulwagang ito habang nasusunog ang Hellforge.",
      "Malugod kayong tinatanggap ni {Heir} sa ilalim ng aming bubong. Magpahinga kayo; hindi makakasunod ang abo."
    ],
    durgrimAgain: ["Nakatayo pa ang Emberhold. Hangga't nakatayo ito, may tahanan ka sa disyerto ng abo."],
    pip: [
      "Pip Gildbarrow, pinakamagandang puwesto sa tabi ng ilog ng lava! Shard, Oridecon, potion — patas ang presyo, kadalasan.",
      "Lahat ay hinahakot sakay ng kariton, lampas sa mga magma drake, kaya huwag masyadong tumawad."
    ],
    pipAgain: ["Bumalik ka? Bayad muna, saka paninda!"],

    arthur: [
      "Arthur Ramirez. Site engineer ako sa Maynila, hanggang sa naputol ang kable ng crane.",
      "Dito, tinatawag nila akong Vanguard Lancer. Walang linyang hindi kayang hawakan ng aking Bastion Forcefield.",
      "Kung pipiliin mo ang landas ng Knight sa iyong Awakening, tuturuan kitang tumayo na parang pader."
    ],
    lyra: [
      "Lyra Vance. Wildlife biologist, Olympic recurve archer… at mukhang elf na rin ngayon.",
      "Tumawid kasama ko ang alpine falcon na kinanlong ko sa gitna ng blizzard. Sabay kaming nangangaso.",
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
    armoryKnight: [
      "Doktrina ng Knight, Commander. Dalawang kamay sa Heavy Lance at magiging battering ram ka. Tusok na tumatagos sa buong hanay.",
      "O broadsword at Tower Shield: mas maikli ang abot, pero matibay ka sa loob ng Bastion Forcefield at maitataboy mo ang kawan.",
      "Tandaan: kapag two-handed ang sandata, sarado ang offhand slot. Pumili ka bago lumabas sa mga pader na ito."
    ],
    armoryArcher: [
      "Recurve Longbow at Quiver: malayuang palasong tumatagos, basta tama ang tiyempo ng reload.",
      "O awtomatikong Crossbow at Trapper Tools: labanang malapitan, mga bitag, at ang falcon na sumisisid kung saan mo ituro.",
      "Dalawang kamay sa pana, walang offhand. Basahin mo ang hangin, saka ang iyong loadout."
    ],
    armoryPriest: [
      "Dalawang kamay ang Grand Scepter, pero binabasag ng banal nitong shockwave ang madidilim na ritwal.",
      "Ang Holy Rosary at Grimoire ay nagpapaikli ng cooldown ng triage at nagpapatibay sa mga Guardian Angel.",
      "Ang triage ay pagpili. Ganoon din ito. Pumili ka bago tayo lumakad."
    ],
    armoryMage: [
      "Great Staff: dalawang kamay, leyline ng planeta, mas malalaking bulalakaw. Buong batalyon, wala na.",
      "Wand at Arcane Grimoire o Focus Shield: mas mabilis na orasyon, at may pananggalang laban sa sumasalakay sa gilid.",
      "Sarado ang offhand kapag two-handed ang staff. Hindi iyan patakaran, physics iyan."
    ],
    armoryFighter: [
      "Dalawang kamay ang Dual Claws. Walang tigil na sunod-sunod na atake na pumupunit sa baluti ng demonyo.",
      "Brawler Gloves at Qi Talisman: ginagabayang spirit blast, saka ang lumilipad na finisher kick.",
      "Two-handed, walang offhand. Piliin mo ang tindig bago ka lumabas ng kampo."
    ],
    mentorMine: ["Pinili mo ang aking landas. Pagbutihin mo, Commander."],
    mentorOther: ["Iisa lang ang kalaban sa dulo ng bawat landas. Good luck, Commander."],

    elvenMatriarch: ["Lumuluha ng itim na dagta ang Whispering Canopy. Kapag darating ka, bilisan mo."]
  }
};

// Tokens in lines: {Heir} = Princess/Prince, {mentor} = name of the mentor of the player's class
const HEIR = { en: { aurelia: "Princess", kenneth: "Prince" }, fil: { aurelia: "Prinsesa", kenneth: "Prinsipe" } };

function L(key, ctx = {}) {
  const lines = (LINES[getLang()] || LINES.en)[key] || LINES.en[key] || [];
  const heir = (HEIR[getLang()] || HEIR.en)[ctx.summoner] || (HEIR[getLang()] || HEIR.en).aurelia;
  const mentorId = MENTOR_BY_CLASS[ctx.cls];
  const mentor = mentorId ? npcName(mentorId) : npcName("ronald");
  return lines.map((ln) => ln.replace(/\{Heir\}/g, heir).replace(/\{mentor\}/g, mentor));
}

const MENTOR_CLASS = { arthur: "knight", lyra: "archer", julian: "priest", sam: "mage", renzo: "fighter" };
const ARMORY = { knight: "armoryKnight", archer: "armoryArcher", priest: "armoryPriest", mage: "armoryMage", fighter: "armoryFighter" };

// Quest steps (see js/quest.js):
// 0 Act II summoner · 1 Act II Ronald+Edgar · 2 Act III five souls · 3 Act IV Lv 10
// 4 Act IV Awakening at the dais · 5 Act V loadout with the mentor · 6 Act VI summoner in the Barracks · 7 done
// ctx: { step, cls, summoner, met, justAwakened }
export function getDialogue(id, ctx) {
  const step = ctx.step;

  if (id === "aurelia" || id === "kenneth") {
    if (ctx.justAwakened) return { lines: L("summonerAwakened", ctx), action: null };
    if (step === 0) {
      const rank = id === "aurelia" ? t("rankPrincess") : t("rankPrince");
      const name = id === "aurelia" ? "Aurelia" : "Kenneth";
      return { lines: t("welcome", name, rank), action: null };
    }
    if (step === 1) return { lines: L("summonerAllies", ctx), action: null };
    if (step === 2) return { lines: L("summonerSouls", ctx), action: null };
    if (step === 3) return { lines: L("summonerTrial", ctx), action: null };
    if (step === 4) return { lines: L("summonerAudience", ctx), action: "awaken" };
    if (step === 5) return { lines: L("summonerArmory", ctx), action: null };
    if (step === 6) return { lines: L("summonerCovenant", ctx), action: null };
    return { lines: L("summonerLater", ctx), action: null };
  }

  if (id === "king") {
    if (step === 4) return { lines: L("kingAudience", ctx), action: null };
    return { lines: step >= 5 ? L("kingLater", ctx) : L("kingEarly", ctx), action: null };
  }
  if (id === "royalGuard") return { lines: step >= 5 ? L("guardLater", ctx) : L("guardEarly", ctx), action: null };

  if (id === "ronald") return { lines: ctx.met.ronald ? L("ronaldAgain", ctx) : L("ronaldFirst", ctx), action: "merc" };
  if (id === "edgar") return { lines: ctx.met.edgar ? L("edgarAgain", ctx) : L("edgarFirst", ctx), action: "shop" };

  // The five souls from Earth (Act III) → class mentors (Act V)
  if (MENTOR_CLASS[id]) {
    if (ctx.cls === "novice") return { lines: L(id, ctx), action: null };
    if (ctx.cls === MENTOR_CLASS[id]) {
      return { lines: step === 5 ? L(ARMORY[ctx.cls], ctx) : L("mentorMine", ctx), action: null };
    }
    return { lines: L("mentorOther", ctx), action: null };
  }

  // Emberhold: first visit plays the introduction, later visits a short greeting, then the service opens
  if (DWARF_ACTION[id] !== undefined) {
    const again = dwarvesMet.has(id);
    dwarvesMet.add(id);
    return { lines: L(again ? `${id}Again` : id, ctx), action: DWARF_ACTION[id] };
  }
  return { lines: L(id, ctx), action: null };
}

// Which service each dwarf of Emberhold opens after talking (null = conversation only)
const DWARF_ACTION = { brakka: "smith", hilde: "repair", pip: "dwarfShop", durgrim: "noble" };
const dwarvesMet = new Set();   // introductions already heard this session
