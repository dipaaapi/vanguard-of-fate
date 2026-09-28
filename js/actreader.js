import { loadLore, parseChapters, actNumber, bannerSrc, BANNER_EXTS } from "./lore.js";
import { t, onLangChange, getLang } from "./i18n.js";

// ==================== ACT READER ("Read more") ====================
// Full text of each Act from LORE.md, with its banner.
//   Finished act    → readable (✔)
//   Current act     → readable (▸)
//   Next act        → locked (🔒) until it becomes active
// Act I is history from before the player arrived, so it always counts as finished.

export class ActReader {
  constructor(root) {
    this.root = root;
    this.titleEl = root.querySelector("#arTitle");
    this.tabsEl = root.querySelector("#arTabs");
    this.bodyEl = root.querySelector("#arBody");
    this.hintEl = root.querySelector("#arHint");
    this.open = false;
    this.chapters = null;
    this.activeAct = 0;
    this.completed = false;
    this.selected = 0;

    root.querySelector("#arClose").addEventListener("click", () => this.close());
    root.querySelector("#arClose").addEventListener("mousedown", (e) => e.preventDefault());
    // Clicking outside the panel closes it
    root.addEventListener("mousedown", (e) => { if (e.target === root) this.close(); });
    onLangChange(async (lang) => {
      const md = await loadLore(lang);
      this.chapters = parseChapters(md).filter((c) => actNumber(c.tab) > 0);
      if (this.open) this.render();
    });

    loadLore(getLang()).then((md) => {
      this.chapters = parseChapters(md).filter((c) => actNumber(c.tab) > 0);
      if (this.open) this.render();
    });
  }

  // "done" | "active" | "locked"
  stateOf(n) {
    if (n < this.activeAct || (n === this.activeAct && this.completed)) return "done";
    if (n === this.activeAct) return "active";
    return "locked";
  }

  unlocked(n) {
    return this.stateOf(n) !== "locked";
  }

  // activeAct = the current quest's Act; completed = that act is finished
  show(activeAct, completed = false) {
    this.activeAct = activeAct;
    this.completed = completed;
    this.selected = activeAct;
    this.open = true;
    this.root.classList.add("open");
    this.render();
  }

  close() {
    this.open = false;
    this.root.classList.remove("open");
  }

  select(n) {
    if (!this.unlocked(n) || n === this.selected) return;
    this.selected = n;
    this.render();
    this.bodyEl.scrollTop = 0;
  }

  // ← →: move to the neighbouring unlocked act
  step(dir) {
    if (!this.chapters) return;
    const acts = this.chapters.map((c) => actNumber(c.tab)).filter((n) => this.unlocked(n));
    const i = acts.indexOf(this.selected);
    const next = acts[i + dir];
    if (next) this.select(next);
  }

  handleInput(e) {
    const c = e.code;
    if (c === "Escape" || c === "Backspace" || c === "KeyR") { this.close(); return; }
    if (c === "ArrowLeft" || c === "KeyA") this.step(-1);
    else if (c === "ArrowRight" || c === "KeyD") this.step(1);
    else if (c === "ArrowUp" || c === "KeyW") this.bodyEl.scrollBy({ top: -80, behavior: "smooth" });
    else if (c === "ArrowDown" || c === "KeyS") this.bodyEl.scrollBy({ top: 80, behavior: "smooth" });
    e.preventDefault();
  }

  render() {
    this.titleEl.textContent = t("readerTitle");
    this.hintEl.innerHTML = t("readerHint");
    if (!this.chapters) return;

    this.tabsEl.innerHTML = "";
    this.chapters.forEach((ch) => {
      const n = actNumber(ch.tab);
      const state = this.stateOf(n);
      const tab = document.createElement("button");
      tab.type = "button";
      tab.tabIndex = -1;
      tab.className = `ar-tab ${state}` + (n === this.selected ? " on" : "");
      tab.innerHTML = `<span class="ar-mark">${state === "done" ? "✔" : state === "active" ? "▸" : "🔒"}</span>${ch.tab.replace(/^Act\s+/i, "")}`;
      tab.title = `${ch.tab} · ${state === "done" ? t("actDone") : state === "active" ? t("actActive") : t("actLocked")}`;
      tab.disabled = state === "locked";
      tab.addEventListener("mousedown", (e) => e.preventDefault());
      tab.addEventListener("click", () => this.select(n));
      this.tabsEl.appendChild(tab);
    });

    const ch = this.chapters.find((c) => actNumber(c.tab) === this.selected);
    this.bodyEl.innerHTML = "";
    if (!ch) return;
    const state = this.stateOf(this.selected);

    const fig = document.createElement("figure");
    fig.className = "ar-banner";
    const img = document.createElement("img");
    img.alt = "";
    let ext = 0;
    img.addEventListener("error", () => {
      if (ext < BANNER_EXTS.length - 1) img.src = bannerSrc(this.selected, ++ext);
      else fig.remove();
    });
    img.src = bannerSrc(this.selected, 0);
    fig.appendChild(img);
    this.bodyEl.appendChild(fig);

    const badge = document.createElement("div");
    badge.className = `ar-badge ${state}`;
    badge.textContent = `${ch.tab} · ${state === "done" ? t("actDone") : t("actActive")}`;
    this.bodyEl.appendChild(badge);

    const h = document.createElement("h3");
    h.textContent = ch.title;
    this.bodyEl.appendChild(h);
    ch.paragraphs.forEach((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      this.bodyEl.appendChild(p);
    });
  }
}
