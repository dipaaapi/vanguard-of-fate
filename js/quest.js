import { getLang } from "./i18n.js";

// ==================== MAIN QUEST: ACTS I–IV ====================
// 0  Act II  — kausapin ang tagapagtawag sa Barracks
// 1  Act II  — kilalanin sina Kapitan Ronald at Edgar
// 2  Act IV  — Novice's Path: umabot sa Lv 10
// 3  Act IV  — Royal Job Awakening: pumunta sa audience dais ng Citadel
// 4  Tapos ang Act IV — Field Commander (susunod: Gateway Frontier)

export const AWAKEN_LEVEL = 10;
export const FINAL_STEP = 4;

const TEXT = {
  en: {
    act: ["Act II · The Earthbound Summoning", "Act II · Haven of the Barracks", "Act IV · The Novice's Path",
      "Act IV · The Royal Job Awakening", "Act IV complete · Field Commander"],
    goal: [
      (q) => `Speak with ${q.summonerName} in the Barracks`,
      (q) => `Meet Captain Ronald ${q.met.ronald ? "✔" : "○"} and Edgar the Apothecary ${q.met.edgar ? "✔" : "○"}`,
      (q) => `Grow stronger in the grassland: Lv ${Math.min(q.level, AWAKEN_LEVEL)} / ${AWAKEN_LEVEL}`,
      (q) => `Go to the Imperial Citadel and speak with ${q.summonerName} at the audience dais`,
      () => "The Gateway Frontier awaits (next chapter)"
    ],
    title: "Main Quest",
    log: "Quest Log",
    close: "Q / Esc  Close",
    done: "Done",
    current: "Current",
    locked: "Locked",
    talk: "Talk",
    newStep: "New objective"
  },
  fil: {
    act: ["Act II · Ang Pagtawag mula sa Daigdig", "Act II · Kanlungan ng Barracks", "Act IV · Landas ng Novice",
      "Act IV · Ang Royal Job Awakening", "Tapos ang Act IV · Field Commander"],
    goal: [
      (q) => `Kausapin si ${q.summonerName} sa Barracks`,
      (q) => `Kilalanin si Kapitan Ronald ${q.met.ronald ? "✔" : "○"} at si Edgar ang Apothecary ${q.met.edgar ? "✔" : "○"}`,
      (q) => `Magpalakas sa kaparangan: Lv ${Math.min(q.level, AWAKEN_LEVEL)} / ${AWAKEN_LEVEL}`,
      (q) => `Pumunta sa Imperial Citadel at kausapin si ${q.summonerName} sa audience dais`,
      () => "Naghihintay ang Gateway Frontier (susunod na kabanata)"
    ],
    title: "Main Quest",
    log: "Talaan ng Quest",
    close: "Q / Esc  Isara",
    done: "Tapos",
    current: "Kasalukuyan",
    locked: "Nakakandado",
    talk: "Kausapin",
    newStep: "Bagong layunin"
  }
};

export function qt(key) {
  return (TEXT[getLang()] || TEXT.en)[key];
}

export class QuestManager {
  constructor() {
    this.onChange = null;   // tinatawag kapag lumipat ng hakbang (para sa HUD toast)
    this.reset();
  }

  reset() {
    this.step = 0;
    this.met = { ronald: false, edgar: false };
  }

  // Galing sa save. Lumang save na walang quest: Novice → simula; may class na → tapos ang Act IV
  load(data, player) {
    this.reset();
    if (data && Number.isInteger(data.step)) {
      this.step = Math.max(0, Math.min(FINAL_STEP, data.step));
      this.met = { ronald: Boolean(data.met && data.met.ronald), edgar: Boolean(data.met && data.met.edgar) };
    } else if (player && player.heroData.id !== "novice") {
      this.step = FINAL_STEP;
      this.met = { ronald: true, edgar: true };
    }
  }

  serialize() {
    return { step: this.step, met: { ...this.met } };
  }

  advance(to) {
    const next = to ?? this.step + 1;
    if (next <= this.step) return;
    this.step = Math.min(FINAL_STEP, next);
    if (this.onChange) this.onChange(this.step);
  }

  // Pagkatapos makipag-usap sa isang NPC
  onTalk(id, summonerId) {
    if (this.step === 0 && id === summonerId) this.advance(1);
    if (id === "ronald") this.met.ronald = true;
    if (id === "edgar") this.met.edgar = true;
    if (this.step === 1 && this.met.ronald && this.met.edgar) this.advance(2);
  }

  // Tinatawag bawat frame
  update(player) {
    if (this.step === 2 && player.level >= AWAKEN_LEVEL) this.advance(3);
    // Kung nakalevel na bago pa kilalanin ang mga kakampi, hindi na kailangang maghintay
    if (this.step === 1 && player.level >= AWAKEN_LEVEL && this.met.ronald && this.met.edgar) this.advance(3);
  }

  // Nasaan ang tagapagtawag: Barracks (Act II) o Citadel (Act IV)
  summonerAtCitadel() {
    return this.step >= 3;
  }

  // Aling NPC ang layunin ngayon (para sa marker sa screen)
  targetNpc(summonerId) {
    if (this.step === 0 || this.step === 3) return summonerId;
    if (this.step === 1) return !this.met.ronald ? "ronald" : !this.met.edgar ? "edgar" : null;
    return null;
  }

  text(player, summonerName) {
    const T = TEXT[getLang()] || TEXT.en;
    const q = { summonerName, met: this.met, level: player ? player.level : 1 };
    return { act: T.act[this.step], goal: T.goal[this.step](q) };
  }

  // Lahat ng hakbang para sa Quest Log
  entries(player, summonerName) {
    const T = TEXT[getLang()] || TEXT.en;
    const q = { summonerName, met: this.met, level: player ? player.level : 1 };
    return T.act.map((act, i) => ({
      act,
      goal: T.goal[i](q),
      state: i < this.step ? "done" : i === this.step ? "current" : "locked"
    }));
  }
}
