// Auto-scrolling lore panel (loop). Binabasa ang LORE.md sa project root.
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

// Isang beses lang kinukuha ang LORE.md (ginagamit ng side panel at ng Chronicles)
let lorePromise = null;
export function loadLore() {
  if (!lorePromise) {
    lorePromise = fetch("LORE.md", { cache: "no-cache" })
      .then((res) => (res.ok ? res.text() : FALLBACK))
      .catch(() => FALLBACK);
  }
  return lorePromise;
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

export async function startLore(panelEl, speed = 0.45) {
  const view = panelEl.querySelector(".lore-view");
  const track = panelEl.querySelector(".lore-track");
  if (!view || !track) return;

  const md = await loadLore();
  const first = buildCopy(md);
  track.append(first, first.cloneNode(true)); // dalawang kopya para seamless ang loop

  let y = 0;
  let paused = false;

  view.addEventListener("mouseenter", () => { paused = true; });
  view.addEventListener("mouseleave", () => { paused = false; });
  view.addEventListener("wheel", (e) => {
    e.preventDefault();
    y += e.deltaY;
  }, { passive: false });

  function step() {
    const h = first.offsetHeight;
    if (h > 0 && view.offsetParent !== null) {
      if (!paused) y += speed;
      y = ((y % h) + h) % h;
      track.style.transform = `translateY(${-y}px)`;
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}