// Auto-scrolling lore panel (loop). Binabasa ang LORE.md sa project root.
const FALLBACK = `# Vanguard of Fate

## The Sundered Dominion of Aethelgard

Long before the skies bled amethyst and obsidian, the continent of Aethelgard flourished under the radiant benediction of Astraea.

Then the Eclipse of the Abyss came, and Demon Lord Satan woke from his slumber.

The Crown Heir and the King ratified an ancient, forbidden doctrine: to draw forth resilient souls from Earth and form the Grand Slaying Corps.`;

function cleanInline(s) {
  return s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`(.+?)`/g, "$1");
}

function buildCopy(md) {
  const copy = document.createElement("div");
  copy.className = "lore-copy";

  md.replace(/\r\n/g, "\n").split(/\n{2,}/).forEach((block) => {
    const text = block.trim();
    if (!text || /^-{3,}$/.test(text)) return;

    if (text.startsWith("## ")) {
      const h = document.createElement("h3");
      h.textContent = cleanInline(text.slice(3));
      copy.appendChild(h);
    } else if (text.startsWith("# ")) {
      const h = document.createElement("h2");
      h.textContent = cleanInline(text.slice(2));
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

  let md = FALLBACK;
  try {
    const res = await fetch("LORE.md", { cache: "no-cache" });
    if (res.ok) md = await res.text();
  } catch (_) { /* gumamit ng fallback */ }

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