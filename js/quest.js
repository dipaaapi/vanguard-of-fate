import { getLang } from "./i18n.js";
import { PLATFORMS, PLATFORM_ORDER } from "./world/platforms.js";
import { BOSSES } from "./bestiary.js";
import { getItem } from "./items/itemdb.js";

// ==================== MAIN QUEST: ACTS II–VI (batay sa LORE.md) ====================
// Bawat hakbang ay may: act (numero ng kabanata sa LORE.md), lugar, at mga tauhang kasangkot.
//
// step  act   lugar                 tauhan                     layunin
//  0    II    Barracks Sanctuary    tagapagtawag               kausapin ang tagapagtawag (sinalubong ka niya)
//  1    II    Barracks Sanctuary    Kapitan Ronald, Edgar      kilalanin ang dalawa
//  2    III   Barracks Sanctuary    Art, Lyra, Julian, Sam,    kilalanin ang limang naunang tinawag mula sa Daigdig
//                                   Renzo
//  3    IV    Kaparangan            (mga halimaw)              Novice's Path: umabot sa Lv 10
//  4    IV    Citadel audience dais tagapagtawag (+ Hari)      Royal Job Awakening sa altar ni Astraea
//  5    V     Barracks Sanctuary    mentor ng napiling class   Dual Equipment Matrix: ihanda ang loadout
//  6    VI    Barracks courtyard    tagapagtawag               Royal Covenant: bumaba siya mula sa Citadel
//
// Acts VII–XII (js/world/platforms.js): tatlong hakbang bawat platform k (0..5), simula sa 7 + 3k:
//  +0   pumasok sa Warp Gateway ng platform
//  +1   talunin ang boss at pulutin ang quest item nito
//  +2   dalhin ang quest item sa tagapagtawag sa kampo ng platform
// 25    XII✔  ang Sovereign Dawn (tapos ang kuwento)

export const AWAKEN_LEVEL = 10;
export const CAMPAIGN_START = 7;
export const FINAL_STEP = CAMPAIGN_START + PLATFORM_ORDER.length * 3;
export const QUEST_VERSION = 2;

// Paraan ng pagpasok sa bawat platform (para sa teksto ng layunin)
const ENTRY = {
  en: { EAST: "the EAST Warp Gateway", WEST: "the WEST Warp Gateway", NORTH: "the NORTH Warp Gateway", SOUTH: "the SOUTH Warp Gateway",
    CITADEL: "the gate of the Imperial Citadel", RIFT: "the rift behind the throne of the besieged Citadel" },
  fil: { EAST: "ang SILANGANG Warp Gateway", WEST: "ang KANLURANG Warp Gateway", NORTH: "ang HILAGANG Warp Gateway", SOUTH: "ang TIMOG na Warp Gateway",
    CITADEL: "ang gate ng Imperial Citadel", RIFT: "ang lamat sa likod ng trono ng kinubkob na Citadel" }
};
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

// Teksto ng mga hakbang ng Acts VII–XII
function campaignText(L) {
  const act = [], goal = [];
  PLATFORM_ORDER.forEach((id) => {
    const p = PLATFORMS[id], name = p.name[L], boss = BOSSES[p.boss].name[L];
    const head = `Act ${ROMAN[p.act]} · ${name}`;
    act.push(head, head, head);
    goal.push(
      () => (L === "fil" ? `Pumasok sa ${name} sa pamamagitan ng ${ENTRY[L][p.hubGate]}` : `Enter the ${name} through ${ENTRY[L][p.hubGate]}`),
      () => (L === "fil" ? `Talunin si ${boss} sa ${p.arenaName[L]} at kunin ang ${getItem(p.item).name}` : `Defeat ${boss} at the ${p.arenaName[L]} and claim the ${getItem(p.item).name}`),
      (q) => (L === "fil" ? `Dalhin ang ${getItem(p.item).name} kay ${q.summonerName} sa kampo` : `Bring the ${getItem(p.item).name} to ${q.summonerName} at the camp`)
    );
  });
  act.push(L === "fil" ? "Tapos ang Act XII · Ang Sovereign Dawn" : "Act XII complete · The Sovereign Dawn");
  goal.push(() => (L === "fil" ? "Malaya na ang Aethelgard. Salamat, Kampeon." : "Aethelgard is free. Thank you, Champion."));
  return { act, goal };
}

export const SOULS = ["arthur", "lyra", "julian", "sam", "renzo"];
export const MENTOR_BY_CLASS = { knight: "arthur", archer: "lyra", priest: "julian", mage: "sam", fighter: "renzo" };

// Aling kabanata ng LORE.md ang kasalukuyang hakbang (para sa lore panel at banner sa kanan)
const STEP_ACT = [2, 2, 3, 4, 4, 5, 6, ...PLATFORM_ORDER.flatMap((id) => [PLATFORMS[id].act, PLATFORMS[id].act, PLATFORMS[id].act]), 12];

// Lumang save (v1, 5 hakbang: 0 summoner, 1 allies, 2 Lv10, 3 dais, 4 tapos) → bagong hakbang
const V1_TO_V2 = [0, 1, 2, 4, 5];

const TEXT = {
  en: {
    act: [
      "Act II · The Earthbound Summoning",
      "Act II · Haven of the Barracks",
      "Act III · The Five Disciplines",
      "Act IV · The Novice's Path",
      "Act IV · The Royal Job Awakening",
      "Act V · The Dual Equipment Matrix",
      "Act VI · The Royal Covenant"
    ],
    goal: [
      (q) => `Speak with ${q.summonerName} in the Barracks Sanctuary`,
      (q) => `Meet Captain Ronald ${q.met.ronald ? "✔" : "○"} and Edgar the Apothecary ${q.met.edgar ? "✔" : "○"}`,
      (q) => `Meet the five Earthbound souls in the Barracks (${q.souls} / 5)`,
      (q) => `Grow stronger in the grassland: Lv ${Math.min(q.level, AWAKEN_LEVEL)} / ${AWAKEN_LEVEL}`,
      (q) => `Go to the Imperial Citadel and speak with ${q.summonerName} at the audience dais`,
      (q) => `Return to the Barracks and prepare your loadout with ${q.mentorName}`,
      (q) => `${q.summonerName} awaits you in the Barracks courtyard`
    ],
    title: "Main Quest",
    log: "Quest Log",
    close: "Q / Esc  Close",
    done: "Done",
    current: "Current",
    locked: "Locked",
    talk: "Talk",
    newStep: "New objective",
    yourMentor: "your mentor"
  },
  fil: {
    act: [
      "Act II · Ang Pagtawag mula sa Daigdig",
      "Act II · Kanlungan ng Barracks",
      "Act III · Ang Limang Disiplina",
      "Act IV · Landas ng Novice",
      "Act IV · Ang Royal Job Awakening",
      "Act V · Ang Dual Equipment Matrix",
      "Act VI · Ang Maharlikang Tipan"
    ],
    goal: [
      (q) => `Kausapin si ${q.summonerName} sa Barracks Sanctuary`,
      (q) => `Kilalanin si Kapitan Ronald ${q.met.ronald ? "✔" : "○"} at si Edgar ang Apothecary ${q.met.edgar ? "✔" : "○"}`,
      (q) => `Kilalanin ang limang kaluluwang taga-Daigdig sa Barracks (${q.souls} / 5)`,
      (q) => `Magpalakas sa kaparangan: Lv ${Math.min(q.level, AWAKEN_LEVEL)} / ${AWAKEN_LEVEL}`,
      (q) => `Pumunta sa Imperial Citadel at kausapin si ${q.summonerName} sa audience dais`,
      (q) => `Bumalik sa Barracks at ihanda ang iyong loadout kasama si ${q.mentorName}`,
      (q) => `Hinihintay ka ni ${q.summonerName} sa looban ng Barracks`
    ],
    title: "Main Quest",
    log: "Talaan ng Quest",
    close: "Q / Esc  Isara",
    done: "Tapos",
    current: "Kasalukuyan",
    locked: "Nakakandado",
    talk: "Kausapin",
    newStep: "Bagong layunin",
    yourMentor: "iyong mentor"
  }
};

export function qt(key) {
  return (TEXT[getLang()] || TEXT.en)[key];
}

// Lahat ng hakbang (Acts II–VI + ang kampanya ng Acts VII–XII) sa kasalukuyang wika
function stepsText() {
  const L = getLang() === "fil" ? "fil" : "en";
  const T = TEXT[L];
  const c = campaignText(L);
  return { T, act: [...T.act, ...c.act], goal: [...T.goal, ...c.goal] };
}

function emptyMet() {
  return { ronald: false, edgar: false, arthur: false, lyra: false, julian: false, sam: false, renzo: false };
}

export class QuestManager {
  constructor() {
    this.onChange = null;   // tinatawag kapag lumipat ng hakbang (para sa HUD toast at lore panel)
    this.reset();
  }

  reset() {
    this.step = 0;
    this.met = emptyMet();
  }

  // Galing sa save. Inaayos din ang lumang save (v1) at save na walang quest.
  load(data, player) {
    this.reset();
    const isNovice = !player || player.heroData.id === "novice";
    if (data && Number.isInteger(data.step)) {
      let step = data.step;
      if (data.v !== QUEST_VERSION) step = V1_TO_V2[Math.max(0, Math.min(V1_TO_V2.length - 1, step))];
      this.step = Math.max(0, Math.min(FINAL_STEP, step));
      const m = data.met || {};
      Object.keys(this.met).forEach((k) => { this.met[k] = Boolean(m[k]); });
    } else if (!isNovice) {
      this.step = 5;
    }
    // Ang may class na ay tapos na sa Acts II–IV
    if (!isNovice && this.step < 5) this.step = 5;
    if (this.step >= 2) { this.met.ronald = true; this.met.edgar = true; }
    if (this.step >= 3) SOULS.forEach((id) => { this.met[id] = true; });
  }

  serialize() {
    return { v: QUEST_VERSION, step: this.step, met: { ...this.met } };
  }

  // Numero ng Act sa LORE.md para sa kasalukuyang hakbang
  act() {
    return STEP_ACT[this.step] || STEP_ACT[STEP_ACT.length - 1];
  }

  soulsMet() {
    return SOULS.filter((id) => this.met[id]).length;
  }

  advance(to) {
    const next = to ?? this.step + 1;
    if (next <= this.step) return;
    this.step = Math.min(FINAL_STEP, next);
    if (this.onChange) this.onChange(this.step);
  }

  // Pagkatapos makipag-usap sa isang NPC
  onTalk(id, summonerId, cls) {
    if (id in this.met) this.met[id] = true;

    if (this.step === 0 && id === summonerId) this.advance(1);
    if (this.step === 1 && this.met.ronald && this.met.edgar) this.advance(2);
    if (this.step === 2 && this.soulsMet() === SOULS.length) this.advance(3);
    // Act V: ang mentor ng napiling class ang naghahanda ng loadout
    if (this.step === 5 && id === MENTOR_BY_CLASS[cls]) this.advance(6);
    // Act VI: ang tagapagtawag sa looban ng Barracks
    if (this.step === 6 && id === summonerId) this.advance(7);
  }

  // Tinatawag bawat frame
  update(player) {
    if (this.step === 3 && player.level >= AWAKEN_LEVEL) this.advance(4);
  }

  // ---------- KAMPANYA (Acts VII–XII) ----------
  // Unang hakbang ng platform (pagpasok)
  baseStep(platformId) {
    return CAMPAIGN_START + PLATFORM_ORDER.indexOf(platformId) * 3;
  }

  // Aling platform ang kasalukuyang hakbang (o null)
  currentPlatform() {
    if (this.step < CAMPAIGN_START || this.step >= FINAL_STEP) return null;
    return PLATFORM_ORDER[Math.floor((this.step - CAMPAIGN_START) / 3)];
  }

  unlocked(platformId) {
    return PLATFORM_ORDER.includes(platformId) && this.step >= this.baseStep(platformId);
  }

  // Natalo na ang boss (nakuha na ang quest item)
  cleared(platformId) {
    return this.step >= this.baseStep(platformId) + 2;
  }

  wantsBoss(platformId) {
    return this.step === this.baseStep(platformId) + 1;
  }

  canDeliver(platformId) {
    return this.step === this.baseStep(platformId) + 2;
  }

  onArrive(platformId) {
    if (PLATFORM_ORDER.includes(platformId) && this.step === this.baseStep(platformId)) this.advance();
  }

  onQuestItem(itemId) {
    const id = this.currentPlatform();
    if (id && this.wantsBoss(id) && PLATFORMS[id].item === itemId) this.advance();
  }

  onDeliver(platformId) {
    if (this.canDeliver(platformId)) this.advance();
  }

  // Nasaan ang tagapagtawag: Barracks (Acts II–III, VI) o Citadel (Act IV–V)
  summonerAtCitadel() {
    return this.step === 4 || this.step === 5;
  }

  // Aling NPC ang layunin ngayon (para sa "!" marker at palaso sa screen)
  targetNpc(summonerId, cls) {
    if (this.step === 0 || this.step === 4 || this.step === 6) return summonerId;
    if (this.step === 1) return !this.met.ronald ? "ronald" : !this.met.edgar ? "edgar" : null;
    if (this.step === 2) return SOULS.find((id) => !this.met[id]) || null;
    if (this.step === 5) return MENTOR_BY_CLASS[cls] || null;
    const p = this.currentPlatform();
    if (p && this.canDeliver(p)) return summonerId;
    return null;
  }

  ctx(player, summonerName, mentorName) {
    const T = TEXT[getLang()] || TEXT.en;
    return {
      summonerName,
      mentorName: mentorName || T.yourMentor,
      met: this.met,
      souls: this.soulsMet(),
      level: player ? player.level : 1
    };
  }

  text(player, summonerName, mentorName) {
    const S = stepsText();
    const q = this.ctx(player, summonerName, mentorName);
    return { act: S.act[this.step], goal: S.goal[this.step](q) };
  }

  // Lahat ng hakbang para sa Quest Log
  entries(player, summonerName, mentorName) {
    const S = stepsText();
    const q = this.ctx(player, summonerName, mentorName);
    return S.act.map((act, i) => ({
      act,
      goal: S.goal[i](q),
      state: i < this.step || this.step >= FINAL_STEP ? "done" : i === this.step ? "current" : "locked"
    }));
  }
}
