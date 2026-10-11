import { getLang } from "./i18n.js";
import { Sound } from "./audio.js";

// ==================== REGRESSION (New Game+) ====================
// After Satan falls the hero may Continue, or Regress: the world starts over from Act I with the same
// soul, one difficulty harder. Enemy HP (1× → 2.2×) and damage (1× → 1.75×), plus the COMBAT escalation below, rise from Easy to Mythical, and so does EXP (1× → 1.8×). Cleared difficulties are recorded in the save ("regression"), and each
// one cleared lets the hero learn one more job with the Scroll of Callings (jobScroll, after the Job
// Awakening). Before regressing the modal offers to save: the cleared difficulty is written into the
// save, the .vof file downloads, then the new run begins.

const N = (en, fil) => ({ en, fil });
// Calibrated with /balance: survivability falls with HP × damage, so HP rises faster than damage and the
// weakest class keeps about one fight per life on Mythical. EXP rises to pay for the longer kills.
export const DIFFICULTIES = [
  { id: "easy", hpMultiplier: 1, damageMultiplier: 1, expMultiplier: 1, mercenaryCostMultiplier: 1, name: N("Easy", "Madali") },
  { id: "normal", hpMultiplier: 1.25, damageMultiplier: 1.15, expMultiplier: 1.15, mercenaryCostMultiplier: 2, name: N("Normal", "Karaniwan") },
  { id: "hard", hpMultiplier: 1.45, damageMultiplier: 1.3, expMultiplier: 1.3, mercenaryCostMultiplier: 3, name: N("Hard", "Mahirap") },
  { id: "epic", hpMultiplier: 1.7, damageMultiplier: 1.45, expMultiplier: 1.45, mercenaryCostMultiplier: 4, name: N("Epic", "Epiko") },
  { id: "champion", hpMultiplier: 1.95, damageMultiplier: 1.6, expMultiplier: 1.6, mercenaryCostMultiplier: 5, name: N("Champion", "Kampeon") },
  { id: "mythical", hpMultiplier: 2.2, damageMultiplier: 1.75, expMultiplier: 1.8, mercenaryCostMultiplier: 6, name: N("Mythical", "Mitikal") }
];


const lang = () => (getLang() === "fil" ? "fil" : "en");

// The hero's Regression record (saved with the game)
export const regression = { level: 0, cleared: [], jobs: [] };

export function resetRegression() { regression.level = 0; regression.cleared = []; regression.jobs = []; }
export function serializeRegression() { return { level: regression.level, cleared: [...regression.cleared], jobs: [...regression.jobs] }; }
export function loadRegression(d) {
  resetRegression();
  if (!d || typeof d !== "object") return;
  const lv = Number(d.level) | 0;
  regression.level = Math.max(0, Math.min(DIFFICULTIES.length - 1, lv));
  const ids = DIFFICULTIES.map((x) => x.id);
  if (Array.isArray(d.cleared)) regression.cleared = [...new Set(d.cleared.filter((x) => ids.includes(x)))];
  if (Array.isArray(d.jobs)) regression.jobs = [...new Set(d.jobs.filter((x) => typeof x === "string"))].slice(0, 6);
}

export const difficulty = () => DIFFICULTIES[regression.level];
export const difficultyName = (i = regression.level) => DIFFICULTIES[i].name[lang()];
// Combat escalation per difficulty (every monster, boss and hostile humanoid):
//   levelBonus   added to every spawned level (stronger, but also more EXP through the level gap)
//   spawnRate    respawn speed (× faster) · extraAlive more foes on the field at once
//   miss / crit / splash   chance a blow misses · lands a critical (×1.5) · also hits allies beside the target (50%)
//   counter      chance to strike back at once when hit (fight back)
//   callRadius / callCount   a struck or engaged foe rallies this many kin within the radius (gang up)
//   surround     ganging foes spread around the target instead of queueing behind each other (gank)
export const COMBAT = {
  easy:     { levelBonus: 0, spawnRate: 1,    extraAlive: 0,  miss: 0.12, crit: 0.03, splash: 0,    counter: 0,    callRadius: 0,   callCount: 0, surround: false },
  normal:   { levelBonus: 0, spawnRate: 1.15, extraAlive: 2,  miss: 0.10, crit: 0.05, splash: 0.05, counter: 0.08, callRadius: 70,  callCount: 1, surround: false },
  hard:     { levelBonus: 1, spawnRate: 1.3,  extraAlive: 4,  miss: 0.08, crit: 0.07, splash: 0.10, counter: 0.14, callRadius: 100, callCount: 2, surround: true },
  epic:     { levelBonus: 1, spawnRate: 1.5,  extraAlive: 6,  miss: 0.06, crit: 0.09, splash: 0.15, counter: 0.20, callRadius: 130, callCount: 3, surround: true },
  champion: { levelBonus: 2, spawnRate: 1.7,  extraAlive: 8,  miss: 0.045, crit: 0.11, splash: 0.20, counter: 0.26, callRadius: 160, callCount: 4, surround: true },
  mythical: { levelBonus: 3, spawnRate: 2,    extraAlive: 10, miss: 0.03, crit: 0.13, splash: 0.25, counter: 0.33, callRadius: 200, callCount: 6, surround: true }
};
export const combat = () => COMBAT[difficulty().id];
export const enemyHpMult = () => difficulty().hpMultiplier;
export const enemyDamageMult = () => difficulty().damageMultiplier;
export const expMult = () => difficulty().expMultiplier;
// Combined pressure (HP × damage), used for the "+N% foes" label
export const enemyMult = () => enemyHpMult() * enemyDamageMult();
// Jobs the hero may hold: the first calling + one per cleared difficulty
export const jobAllowance = () => 1 + regression.cleared.length;
export function markCleared() {
  const id = difficulty().id;
  if (!regression.cleared.includes(id)) regression.cleared.push(id);
}
export const canRegress = () => regression.level < DIFFICULTIES.length - 1;

const TEXT = {
  en: {
    title: "The Demon Lord Has Fallen",
    body: (d) => `Satan is no more, and the star is whole. You have completed Book I on ${d}.`,
    cont: "Continue the Journey", regress: (d, p) => `Regress → ${d} (foes +${p}% HP)`, maxed: "Every trial is cleared: Mythical conquered.",
    saveTitle: "Before you regress…",
    saveBody: (d) => `Time will fold back to the summoning. Save your chronicle first: the save records that you cleared ${d}, and the file downloads to keep it safe. Your next run gains one more calling for the Scroll of Callings.`,
    saveGo: "Save, Download & Regress", noSave: "Regress without the file", back: "Back",
    saving: "Saving your chronicle…", saved: "Saved ✓ — the world folds back…"
  },
  fil: {
    title: "Bumagsak ang Demon Lord",
    body: (d) => `Wala na si Satan, at buo na ang bituin. Natapos mo ang Book I sa ${d}.`,
    cont: "Ipagpatuloy ang Paglalakbay", regress: (d, p) => `Bumalik → ${d} (+${p}% HP ng kalaban)`, maxed: "Natapos ang lahat ng pagsubok: nalupig ang Mitikal.",
    saveTitle: "Bago ka bumalik…",
    saveBody: (d) => `Babalik ang panahon sa pagtawag. I-save muna ang iyong kronika: itatala ng save na natapos mo ang ${d}, at mada-download ang file para ingatan ito. Sa susunod na takbo, may isa pang tungkulin para sa Scroll of Callings.`,
    saveGo: "I-save, I-download at Bumalik", noSave: "Bumalik nang walang file", back: "Bumalik sa menu",
    saving: "Sine-save ang iyong kronika…", saved: "Na-save ✓ — tumitiklop pabalik ang mundo…"
  }
};

// The modal: deps = { onContinue(), onSaveAndRegress() → Promise, onRegress() }
export class RegressionModal {
  constructor(root, deps) {
    this.root = root;
    this.deps = deps;
    this.open = false;
  }

  show() {
    this.open = true;
    this.step = "congrats";
    this.root.classList.add("open");
    this.render();
  }

  close() {
    this.open = false;
    this.root.classList.remove("open");
  }

  render() {
    const T = TEXT[lang()], r = this.root;
    r.textContent = "";
    const box = document.createElement("div");
    box.className = "rg-box";
    r.appendChild(box);
    const add = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; box.appendChild(n); return n; };
    const btn = (parent, text, cls, fn) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "rg-btn " + cls; b.textContent = text; b.tabIndex = -1;
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.addEventListener("click", () => { Sound.init(); if (!b.disabled) fn(); });
      parent.appendChild(b);
      return b;
    };
    const cur = difficultyName(), next = canRegress() ? difficultyName(regression.level + 1) : null;
    if (this.step === "congrats") {
      add("div", "rg-crest", "✦");
      add("h2", "", T.title);
      add("p", "", T.body(cur));
      const row = add("div", "rg-row");
      btn(row, T.cont, "", () => { this.close(); this.deps.onContinue(); });
      if (next) btn(row, T.regress(next, Math.round((DIFFICULTIES[regression.level + 1].hpMultiplier - 1) * 100)), "primary", () => { this.step = "save"; this.render(); });
      else add("p", "rg-note", T.maxed);
    } else if (this.step === "save") {
      add("h2", "", T.saveTitle);
      add("p", "", T.saveBody(cur));
      const row = add("div", "rg-row");
      btn(row, T.back, "", () => { this.step = "congrats"; this.render(); });
      btn(row, T.noSave, "", () => { this.close(); this.deps.onRegress(); });
      btn(row, T.saveGo, "primary", () => {
        this.step = "saving"; this.render();
        Promise.resolve(this.deps.onSaveAndRegress()).then(() => {
          this.step = "saved"; this.render();
          setTimeout(() => { this.close(); this.deps.onRegress(); }, 1200);
        }).catch(() => { this.step = "save"; this.render(); });
      });
    } else {
      add("div", "rg-crest spin", "✦");
      add("p", "", this.step === "saving" ? T.saving : T.saved);
    }
  }

  handleInput(e) {
    if (e.code !== "Backspace" || this.step === "saving" || this.step === "saved") return;
    this.close();
    this.deps.onContinue();
  }
}
