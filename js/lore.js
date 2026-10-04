import { getLang, onLangChange } from "./i18n.js";

// Auto-scrolling lore panel (loop). Reads LORE.md / LORE_FIL.md from the project root.
const FALLBACK = `# Vanguard of Fate

## The Sundered Dominion of Aethelgard

Long before the skies bled amethyst and obsidian, the continent of Aethelgard flourished under the radiant benediction of Astraea.

Then the Eclipse of the Abyss came, and Demon Lord Satan woke from his slumber.

The Crown Heir and the King ratified an ancient, forbidden doctrine: to draw forth resilient souls from Earth and form the Fated Vanguard.`;

function cleanInline(s) {
  return s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`(.+?)`/g, "$1");
}

// Strips the emoji at the start of a heading (it looks different on every OS)
function cleanHeading(s) {
  return cleanInline(s).replace(/^[^\p{L}\p{N}]+/u, "");
}

// Caches LORE.md (English) and LORE_FIL.md (Filipino)
const loreCache = {};
export function loadLore(lang = getLang()) {
  const l = lang === "fil" ? "fil" : "en";
  if (!loreCache[l]) {
    const file = l === "fil" ? "LORE_FIL.md" : "LORE.md";
    loreCache[l] = fetch(file, { cache: "no-cache" })
      .then((res) => {
        if (!res.ok) throw new Error("Lore file not found");
        return res.text();
      })
      .catch(() => {
        if (l === "fil") return loadLore("en");
        return FALLBACK;
      });
  }
  return loreCache[l];
}

// Splits the lore into chapters (each "## " heading) for the Chronicles screen.
// "Act I: The Sundered Dominion" → { tab: "Act I", title: "The Sundered Dominion" }
export function parseChapters(md) {
  const chapters = [];
  let cur = null;
  md.replace(/\r\n/g, "\n").split(/\n{2,}/).forEach((block) => {
    const text = block.trim();
    if (!text || /^-{3,}$/.test(text) || text.startsWith("# ")) return;
    if (text.startsWith("## ")) {
      const heading = cleanHeading(text.slice(3));
      const colon = heading.indexOf(":");
      cur = {
        tab: colon > 0 ? heading.slice(0, colon) : heading,
        title: colon > 0 ? heading.slice(colon + 1).trim() : heading,
        paragraphs: []
      };
      chapters.push(cur);
    } else if (cur) {
      cur.paragraphs.push(cleanInline(text));
    }
  });
  return chapters;
}

function buildCopy(md) {
  const copy = document.createElement("div");
  copy.className = "lore-copy";

  md.replace(/\r\n/g, "\n").split(/\n{2,}/).forEach((block) => {
    const text = block.trim();
    if (!text || /^-{3,}$/.test(text)) return;

    if (text.startsWith("## ")) {
      const h = document.createElement("h3");
      h.textContent = cleanHeading(text.slice(3));
      copy.appendChild(h);
    } else if (text.startsWith("# ")) {
      const h = document.createElement("h2");
      h.textContent = cleanHeading(text.slice(2));
      copy.appendChild(h);
    } else {
      const p = document.createElement("p");
      p.textContent = cleanInline(text);
      copy.appendChild(p);
    }
  });

  return copy;
}

// "Act II" → 2 (to match a chapter with the quest's Act number and the act-N.png banner)
const ROMAN = { I: 1, V: 5, X: 10, L: 50 };
export function actNumber(tab) {
  const m = /Act\s+([IVXL]+)/i.exec(tab || "");
  if (!m) return 0;
  const r = m[1].toUpperCase();
  let n = 0;
  for (let i = 0; i < r.length; i++) {
    const v = ROMAN[r[i]], next = ROMAN[r[i + 1]] || 0;
    n += v < next ? -v : v;
  }
  return n;
}

// Banner key of a chapter heading: the Act number, or "prophecy" / "ledger" / "heralds" for the
// three reference chapters (EN and FIL headings), or 0 when the chapter has no banner
export function chapterKey(tab) {
  const act = actNumber(tab);
  if (act) return act;
  if (/Prophecy|Propesiya/i.test(tab || "")) return "prophecy";
  if (/Ledger/i.test(tab || "")) return "ledger";
  if (/Herald/i.test(tab || "")) return "heralds";
  return 0;
}

// Banners are the procedural pixel art from tools/art (PNG); other formats are still accepted
// in this order, so a hand-made act-N.webp or .jpeg can replace one without code changes
export const BANNER_EXTS = ["png", "webp", "jpeg", "jpg"];
export function bannerSrc(act, i = 0) {
  return `assets/banner/${typeof act === "number" ? `act-${act}` : act}.${BANNER_EXTS[i]}`;
}

// A single chapter (the quest's current Act)
function buildChapterCopy(ch) {
  const copy = document.createElement("div");
  copy.className = "lore-copy";
  // The title is already in the banner caption, so only the text here
  ch.paragraphs.forEach((text) => {
    const p = document.createElement("p");
    p.textContent = text;
    copy.appendChild(p);
  });
  return copy;
}

// Lore panel on the right. setAct(n): shows the banner and text of Act n from LORE.md
// (follows the quest). setAct(0): the whole LORE.md (no game in progress).
// When an Act has no banner, only the text and title show.
export function createLorePanel(panelEl, speed = 0.45) {
  const view = panelEl.querySelector(".lore-view");
  const track = panelEl.querySelector(".lore-track");
  if (!view || !track) return { setAct() {} };

  const banner = document.createElement("figure");
  banner.className = "lore-banner";
  const img = document.createElement("img");
  img.alt = "";
  img.decoding = "async";
  const cap = document.createElement("figcaption");
  const capAct = document.createElement("div");
  capAct.className = "lb-act";
  const capTitle = document.createElement("div");
  capTitle.className = "lb-title";
  cap.append(capAct, capTitle);
  banner.append(img, cap);
  view.parentNode.insertBefore(banner, view);   // above the text, inside the lore section

  let extIndex = 0;   // which extension is being tried now
  img.addEventListener("load", () => banner.classList.remove("no-img"));
  img.addEventListener("error", () => {
    // Try the next extension before giving up (e.g. act-2.jpg instead of act-2.jpeg)
    if (act > 0 && extIndex < BANNER_EXTS.length - 1) {
      extIndex++;
      img.src = bannerSrc(act, extIndex);
    } else {
      banner.classList.add("no-img");
    }
  });

  let md = null;
  let chapters = [];
  let act = 0;
  let first = null;
  let y = 0;
  let paused = false;

  function render() {
    if (md === null) return;
    const ch = act > 0 ? chapters.find((c) => actNumber(c.tab) === act) : null;
    track.innerHTML = "";
    y = 0;

    if (ch) {
      banner.classList.add("show");
      capAct.textContent = ch.tab;
      capTitle.textContent = ch.title;
      if (!(img.getAttribute("src") || "").startsWith(`assets/banner/act-${act}.`)) {
        extIndex = 0;
        banner.classList.remove("no-img");
        img.src = bannerSrc(act, 0);
      }
      first = buildChapterCopy(ch);
    } else {
      banner.classList.remove("show");
      first = buildCopy(md);
    }
    track.append(first, first.cloneNode(true)); // two copies so the loop is seamless
  }

  function reloadLore() {
    loadLore(getLang()).then((text) => {
      md = text;
      chapters = parseChapters(text);
      render();
    });
  }

  onLangChange(() => reloadLore());
  reloadLore();

  view.addEventListener("mouseenter", () => { paused = true; });
  view.addEventListener("mouseleave", () => { paused = false; });
  view.addEventListener("wheel", (e) => {
    e.preventDefault();
    y += e.deltaY;
  }, { passive: false });

  // Height of one copy and whether the panel is shown, re-read only when they change: reading
  // offsetHeight every frame forced a page layout per frame next to the HUD updates
  let h = 0, shown = false;
  const measure = () => { h = first ? first.offsetHeight : 0; shown = view.offsetParent !== null; };
  if (window.ResizeObserver) new ResizeObserver(measure).observe(track);
  let lastFirst = null, frames = 0;
  function step() {
    if (first !== lastFirst || !window.ResizeObserver || ++frames % 30 === 0) { lastFirst = first; measure(); }
    if (h > 0 && shown) {
      if (!paused) y += speed;
      y = ((y % h) + h) % h;
      track.style.transform = `translateY(${-y}px)`;
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  return {
    setAct(n) {
      const next = Number(n) || 0;
      if (next === act) return;
      act = next;
      render();
    }
  };
}
