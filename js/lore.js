import { getLang, onLangChange } from "./i18n.js";

// Auto-scrolling lore panel (loop). Binabasa ang LORE.md / LORE_FIL.md sa project root.
const FALLBACK = `# Vanguard of Fate

## The Sundered Dominion of Aethelgard

Long before the skies bled amethyst and obsidian, the continent of Aethelgard flourished under the radiant benediction of Astraea.

Then the Eclipse of the Abyss came, and Demon Lord Satan woke from his slumber.

The Crown Heir and the King ratified an ancient, forbidden doctrine: to draw forth resilient souls from Earth and form the Grand Slaying Corps.`;

function cleanInline(s) {
  return s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`(.+?)`/g, "$1");
}

// Tinatanggal ang emoji sa unahan ng heading (iba-iba ang itsura bawat OS)
function cleanHeading(s) {
  return cleanInline(s).replace(/^[^\p{L}\p{N}]+/u, "");
}

// Caching ng LORE.md (English) at LORE_FIL.md (Filipino)
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

// Hinahati ang lore sa mga kabanata (bawat "## " heading) para sa Chronicles screen.
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

// "Act II" → 2 (para itugma ang kabanata sa numero ng Act ng quest at sa banner na act-N.jpeg)
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

// Tinatanggap ang .jpeg, .jpg, .png at .webp (sinusubukan sa ganitong ayos)
export const BANNER_EXTS = ["jpeg", "jpg", "png", "webp"];
export function bannerSrc(act, i = 0) {
  return `assets/banner/act-${act}.${BANNER_EXTS[i]}`;
}

// Isang kabanata lang (ang kasalukuyang Act ng quest)
function buildChapterCopy(ch) {
  const copy = document.createElement("div");
  copy.className = "lore-copy";
  // Ang pamagat ay nasa caption ng banner na, kaya teksto na lang dito
  ch.paragraphs.forEach((text) => {
    const p = document.createElement("p");
    p.textContent = text;
    copy.appendChild(p);
  });
  return copy;
}

// Lore panel sa kanan. setAct(n): ipinapakita ang banner at teksto ng Act n ng LORE.md
// (sumusunod sa quest). setAct(0): buong LORE.md (walang aktibong laro).
// Kapag wala pang banner ang isang Act (hal. act-10.jpeg), teksto at pamagat lang ang lalabas.
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
  view.parentNode.insertBefore(banner, view);   // nasa itaas ng teksto, sa loob ng lore section

  let extIndex = 0;   // aling extension ang sinusubukan ngayon
  img.addEventListener("load", () => banner.classList.remove("no-img"));
  img.addEventListener("error", () => {
    // Subukan ang susunod na extension bago sumuko (hal. act-2.jpg sa halip na act-2.jpeg)
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
    track.append(first, first.cloneNode(true)); // dalawang kopya para seamless ang loop
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

  function step() {
    const h = first ? first.offsetHeight : 0;
    if (h > 0 && view.offsetParent !== null) {
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
