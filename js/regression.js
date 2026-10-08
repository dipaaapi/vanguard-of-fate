import { getLang } from "./i18n.js";
import { Sound } from "./audio.js";

// ==================== REGRESSION (New Game+) ====================
// After Satan falls the hero may Continue, or Regress: the world starts over from Act I with the same
// soul, one difficulty harder. Each difficulty adds +20% monster HP and damage over the last
// (Easy +0% … Mythical +100%). Cleared difficulties are recorded in the save ("regression"), and each
// one cleared lets the hero learn one more job with the Scroll of Callings (jobScroll, after the Job
// Awakening). Before regressing the modal offers to save: the cleared difficulty is written into the
// save, the .vof file downloads, then the new run begins.

const N = (en, fil) => ({ en, fil });
export const DIFFICULTIES = [
  { id: "easy", name: N("Easy", "Madali") },
  { id: "normal", name: N("Normal", "Karaniwan") },
  { id: "hard", name: N("Hard", "Mahirap") },
  { id: "epic", name: N("Epic", "Epiko") },
  { id: "champion", name: N("Champion", "Kampeon") },
  { id: "mythical", name: N("Mythical", "Mitikal") }
];
const STEP = 0.2;   // +20% per difficulty

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
export const enemyMult = () => 1 + STEP * regression.level;
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
    cont: "Continue the Journey", regress: (d, p) => `Regress → ${d} (+${p}% foes)`, maxed: "Every trial is cleared: Mythical conquered.",
    saveTitle: "Before you regress…",
    saveBody: (d) => `Time will fold back to the summoning. Save your chronicle first: the save records that you cleared ${d}, and the file downloads to keep it safe. Your next run gains one more calling for the Scroll of Callings.`,
    saveGo: "Save, Download & Regress", noSave: "Regress without the file", back: "Back",
    saving: "Saving your chronicle…", saved: "Saved ✓ — the world folds back…"
  },
  fil: {
    title: "Bumagsak ang Demon Lord",
    body: (d) => `Wala na si Satan, at buo na ang bituin. Natapos mo ang Book I sa ${d}.`,
    cont: "Ipagpatuloy ang Paglalakbay", regress: (d, p) => `Bumalik → ${d} (+${p}% kalaban)`, maxed: "Natapos ang lahat ng pagsubok: nalupig ang Mitikal.",
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
      if (next) btn(row, T.regress(next, Math.round(STEP * 100 * (regression.level + 1))), "primary", () => { this.step = "save"; this.render(); });
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
    if (e.code === "Escape" && this.step === "save") { this.step = "congrats"; this.render(); }
  }
}
