import { getLang } from "./i18n.js";
import { PLATFORMS } from "./world/platforms.js";
import { FRONTIERS } from "./world/frontiers.js";
import { areaLevels } from "./world/areas.js";
import { Avatar } from "./avatar/avatar.js";
import { NPC_DEFS } from "./npc/roster.js";

// ==================== DUAL-CONTINENT WORLD MAP (Book I) ====================
// The world of Vanguard of Fate is made of two great continents:
// 1. THE CONTINENT OF AETHELGARD (realm of High King Alden, blessed by Astraea), with the plains,
//    the four campaign platforms of Acts VII–X and the four frontier maps beside them
// 2. THE DARK CONTINENT (Nox Aeterna / empire of Demon Lord Satan): Acts XI–XII
// The two continents do not touch: open sea lies between them. The only crossing is the portal of the
// Celestial Monolith in the Cerulean Abyss, drawn as a sea route around the south of Aethelgard.
// Roads run from the plains to every gateway; trails lead from a platform to its frontier.
// Far to the north-east, an island still under cloud waits for Book II.

const LANDS = [
  // ---- 1. AETHELGARD ----
  { id: "hub", x: 0.26, y: 0.48, act: 1, color: "#ffd166", icon: "castle", name: { en: "Imperial Citadel & Barracks", fil: "Imperial Citadel at Barracks" } },
  { id: "frost", x: 0.24, y: 0.17, color: "#bfe9ff", icon: "peak" },
  { id: "mountain", x: 0.385, y: 0.15, color: "#86efac", icon: "crag" },
  { id: "canopy", x: 0.40, y: 0.40, color: "#c77dff", icon: "tree" },
  { id: "swamp", x: 0.475, y: 0.58, color: "#84cc16", icon: "reeds", name: { en: "Beastkin Swamp Island", fil: "Pulo ng Latian ng Beastkin" } },
  { id: "underworks", x: 0.52, y: 0.69, color: "#67e8f9", icon: "monolith", name: { en: "The Underworks", fil: "Ang Ilalim na Pasilidad" } },
  { id: "lost", x: 0.55, y: 0.24, color: "#67e8f9", icon: "crag", name: { en: "Ancient Floating Continent", fil: "Sinaunang Lumulutang na Kontinente" } },
  { id: "coast", x: 0.085, y: 0.50, color: "#38bdf8", icon: "ship", name: { en: "Cerulean Coast & Pier", fil: "Baybayin at Pier ng Cerulean" } },
  { id: "port", x: 0.16, y: 0.60, color: "#38bdf8", icon: "anchor" },
  { id: "rocky", x: 0.13, y: 0.71, color: "#d6a35c", icon: "mesa" },
  { id: "ash", x: 0.29, y: 0.73, color: "#ff7a1a", icon: "volcano" },
  { id: "desert", x: 0.34, y: 0.89, color: "#fbbf24", icon: "dune" },

  // ---- 2. THE CELESTIAL MONOLITH (in the Cerulean Abyss, just off the west coast) ----
  { id: "monolith", x: 0.035, y: 0.80, act: 8, color: "#00f0ff", icon: "monolith", name: { en: "Celestial Monolith", fil: "Celestial Monolith" } },

  // ---- 3. THE DARK CONTINENT (east, across the open sea) ----
  { id: "darkShore", x: 0.70, y: 0.76, order: 10.5, color: "#6366f1", icon: "anchor", name: { en: "Obsidian Harbor", fil: "Pintuang Obsidian ng Dagat" } },
  { id: "siege", x: 0.81, y: 0.36, color: "#ef4444", icon: "fortress" },
  { id: "maw", x: 0.86, y: 0.62, color: "#9d4edd", icon: "vortex" }
];

// Roads from the plains to the gateways and trails to the frontiers: [from, to, colour]
const ROADS = [
  ["hub", "frost", "#ffd166"], ["hub", "canopy", "#ffd166"], ["hub", "coast", "#ffd166"], ["hub", "ash", "#ffd166"],
  ["hub", "rocky", "#d6a35c"], ["frost", "mountain", "#d6a35c"], ["canopy", "swamp", "#d6a35c"], ["ash", "desert", "#d6a35c"]
];

const BOOK_TWO = { x: 0.70, y: 0.12, name: { en: "Book II · Coming soon", fil: "Aklat II · Malapit na" } };

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function rng(seed) {
  let a = seed;
  return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
}

const landById = (id) => LANDS.find((l) => l.id === id);

export class ContinentMap {
  constructor() {
    this.caravanRider = new Avatar(NPC_DEFS.nimaFen.look);
    this.base = null;
    this.size = [0, 0];
  }

  // Paints both continents, the sea, the biomes, roads and the Book II island into the background canvas
  buildBase(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    const r = rng(4242);
    const P = (fx, fy) => [w * fx, h * fy];
    const blob = (fx, fy, rx, ry, fill, n = 22, jag = 0.12) => {
      g.fillStyle = fill;
      g.beginPath();
      for (let k = 0; k <= n; k++) {
        const a = (k / n) * Math.PI * 2, j = 1 + (r() - 0.5) * jag;
        const x = w * fx + Math.cos(a) * w * rx * j, y = h * fy + Math.sin(a) * h * ry * j;
        k ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath();
      g.fill();
    };

    // 1. Sea: deep in the middle, lighter near the coasts, with wave marks
    const sea = g.createLinearGradient(0, 0, w, 0);
    sea.addColorStop(0, "#0b2a44"); sea.addColorStop(0.55, "#061626"); sea.addColorStop(1, "#0b2238");
    g.fillStyle = sea;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(125, 211, 252, 0.14)";
    g.lineWidth = 1;
    for (let k = 0; k < 140; k++) {
      const x = r() * w, y = r() * h;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y - 2, x + 6, y); g.stroke();
    }

    // 2. AETHELGARD: a large landmass, shallow-water rim, coast line
    const shape = (cx, cy, rx, ry, N, wob) => {
      const pts = [];
      for (let k = 0; k < N; k++) {
        const a = (k / N) * Math.PI * 2;
        const rad = 1 + Math.sin(a * 3 + 1) * wob + Math.sin(a * 5) * wob * 0.6 + (r() - 0.5) * wob * 0.8;
        pts.push([w * cx + Math.cos(a) * w * rx * rad, h * cy + Math.sin(a) * h * ry * rad]);
      }
      return pts;
    };
    const path = (pts) => { g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    const pts1 = shape(0.28, 0.52, 0.255, 0.43, 48, 0.08);
    g.save(); g.translate(0, 0); path(pts1); g.lineWidth = 7; g.strokeStyle = "rgba(56, 189, 248, 0.18)"; g.stroke(); g.restore();
    g.save(); g.translate(2, 3); path(pts1); g.fillStyle = "rgba(0, 0, 0, 0.4)"; g.fill(); g.restore();
    path(pts1); g.fillStyle = "#3f6b24"; g.fill();

    g.save();
    path(pts1); g.clip();
    // plains texture
    for (let k = 0; k < 260; k++) { g.fillStyle = r() < 0.5 ? "#4d7c2a" : "#365e1f"; g.fillRect(r() * w * 0.6, r() * h, 2, 1); }
    // Frostfang (north): snowfield and peaks
    blob(0.24, 0.15, 0.13, 0.11, "rgba(226, 240, 252, 0.92)");
    for (let k = 0; k < 8; k++) {
      const [x, y] = P(0.15 + k * 0.024, 0.13 + (k % 2) * 0.035);
      g.fillStyle = "#64748b"; g.beginPath(); g.moveTo(x - 5, y + 5); g.lineTo(x, y - 6); g.lineTo(x + 5, y + 5); g.fill();
      g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(x - 2, y); g.lineTo(x, y - 6); g.lineTo(x + 2, y); g.fill();
    }
    // Stormcrown Highlands (north-east): green-grey ridges
    blob(0.385, 0.15, 0.08, 0.09, "rgba(92, 112, 76, 0.95)");
    for (let k = 0; k < 6; k++) {
      const [x, y] = P(0.345 + k * 0.016, 0.12 + (k % 3) * 0.03);
      g.fillStyle = "#4b5563"; g.beginPath(); g.moveTo(x - 4, y + 4); g.lineTo(x, y - 5); g.lineTo(x + 4, y + 4); g.fill();
      g.fillStyle = "#9ca3af"; g.fillRect(x - 1, y - 4, 2, 2);
    }
    // Whispering Canopy (east): dark forest dotted with trees
    blob(0.40, 0.40, 0.075, 0.15, "rgba(19, 78, 74, 0.9)");
    for (let k = 0; k < 40; k++) {
      const x = w * (0.34 + r() * 0.12), y = h * (0.27 + r() * 0.27);
      g.fillStyle = r() < 0.5 ? "#0f3f3a" : "#1f6b5c"; g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill();
    }
    // Gloomwater Fens (south-east): murky olive with pools
    blob(0.475, 0.58, 0.06, 0.1, "rgba(63, 74, 44, 0.95)");
    for (let k = 0; k < 14; k++) { g.fillStyle = "rgba(31, 46, 38, 0.95)"; g.beginPath(); g.ellipse(w * (0.44 + r() * 0.07), h * (0.5 + r() * 0.16), 2.5, 1.2, 0, 0, Math.PI * 2); g.fill(); }
    // Cerulean coast (west): sand rim
    g.strokeStyle = "rgba(233, 213, 161, 0.7)"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(...P(0.05, 0.36)); g.quadraticCurveTo(...P(0.02, 0.5), ...P(0.06, 0.64)); g.stroke();
    // Greyhorn Badlands (south-west): tan mesas
    blob(0.13, 0.71, 0.07, 0.09, "rgba(170, 128, 82, 0.95)");
    for (let k = 0; k < 6; k++) { const [x, y] = P(0.09 + k * 0.016, 0.68 + (k % 2) * 0.04); g.fillStyle = "#9a6a3a"; g.fillRect(x - 3, y - 3, 6, 4); g.fillStyle = "#c88a52"; g.fillRect(x - 3, y - 3, 6, 1); }
    // Ashfall (south): soot and a lava river
    blob(0.29, 0.73, 0.1, 0.09, "rgba(41, 37, 36, 0.95)");
    g.strokeStyle = "#ff7a1a"; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(...P(0.21, 0.72)); g.bezierCurveTo(...P(0.26, 0.78), ...P(0.32, 0.68), ...P(0.38, 0.76)); g.stroke();
    // Sunscorch Dunes (far south): sand with dune lines
    blob(0.34, 0.89, 0.09, 0.07, "rgba(217, 184, 122, 0.97)");
    g.strokeStyle = "rgba(168, 131, 76, 0.8)"; g.lineWidth = 1;
    for (let k = 0; k < 5; k++) { g.beginPath(); const [x, y] = P(0.27 + k * 0.025, 0.86 + (k % 2) * 0.04); g.moveTo(x, y); g.quadraticCurveTo(x + 4, y - 3, x + 8, y); g.stroke(); }
    // a river from Frostfang to the plains
    g.strokeStyle = "rgba(125, 211, 252, 0.7)"; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(...P(0.22, 0.22)); g.bezierCurveTo(...P(0.18, 0.32), ...P(0.30, 0.38), ...P(0.24, 0.47)); g.stroke();
    g.restore();
    path(pts1); g.lineWidth = 1.5; g.strokeStyle = "#ca8a04"; g.stroke();

    // 3. THE DARK CONTINENT
    const pts2 = shape(0.82, 0.52, 0.16, 0.36, 36, 0.09);
    g.save(); g.translate(2, 3); path(pts2); g.fillStyle = "rgba(0, 0, 0, 0.45)"; g.fill(); g.restore();
    path(pts2); g.fillStyle = "#1e102a"; g.fill();
    g.save(); path(pts2); g.clip();
    g.strokeStyle = "rgba(239, 68, 68, 0.75)"; g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(...P(0.72, 0.44)); g.lineTo(...P(0.79, 0.50)); g.lineTo(...P(0.86, 0.46));
    g.moveTo(...P(0.75, 0.56)); g.lineTo(...P(0.82, 0.62));
    g.stroke();
    blob(0.86, 0.62, 0.05, 0.07, "rgba(15, 7, 26, 0.95)");
    for (let k = 0; k < 30; k++) { g.fillStyle = r() < 0.5 ? "#2a1640" : "#3b1d57"; g.fillRect(w * (0.68 + r() * 0.28), h * (0.2 + r() * 0.65), 2, 1); }
    g.restore();
    path(pts2); g.lineWidth = 1.5; g.strokeStyle = "#9333ea"; g.stroke();

    // 4. Book II: an island far to the north-east, still under cloud
    const [bx, by] = P(BOOK_TWO.x, BOOK_TWO.y);
    g.fillStyle = "#273449"; g.beginPath(); g.ellipse(bx, by, w * 0.05, h * 0.06, 0, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 9; k++) {
      g.fillStyle = `rgba(203, 213, 225, ${0.5 + r() * 0.3})`;
      g.beginPath(); g.arc(bx + (r() - 0.5) * w * 0.1, by + (r() - 0.5) * h * 0.1, 4 + r() * 5, 0, Math.PI * 2); g.fill();
    }

    // 5. The only crossing: Cerulean Abyss → Celestial Monolith (by boat) → portal → Obsidian Harbor
    const [mx, my] = P(0.035, 0.80);
    g.fillStyle = "#1e293b"; g.beginPath(); g.ellipse(mx, my, 8, 5, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#38bdf8"; g.lineWidth = 1; g.stroke();
    g.setLineDash([2, 3]); g.lineWidth = 1.2;
    g.strokeStyle = "rgba(56, 189, 248, 0.75)";
    g.beginPath(); g.moveTo(...P(0.085, 0.5)); g.quadraticCurveTo(...P(0.0, 0.66), ...P(0.035, 0.80)); g.stroke();
    g.strokeStyle = "rgba(168, 85, 247, 0.75)";
    g.beginPath(); g.moveTo(...P(0.035, 0.80)); g.bezierCurveTo(...P(0.16, 1.04), ...P(0.52, 1.02), ...P(0.70, 0.76)); g.stroke();
    g.setLineDash([]);

    // 6. Compass rose
    const [rx, ry] = P(0.95, 0.9);
    g.fillStyle = "#ffd166";
    g.beginPath(); g.moveTo(rx, ry - 9); g.lineTo(rx + 2.5, ry); g.lineTo(rx, ry + 9); g.lineTo(rx - 2.5, ry); g.closePath(); g.fill();
    g.fillStyle = "#94a3b8";
    g.beginPath(); g.moveTo(rx - 9, ry); g.lineTo(rx, ry + 2.5); g.lineTo(rx + 9, ry); g.lineTo(rx, ry - 2.5); g.closePath(); g.fill();
    g.fillStyle = "#ffd166"; g.font = "bold 5px serif"; g.textAlign = "center"; g.fillText("N", rx, ry - 11);

    this.base = c;
    this.size = [w, h];
  }

  icon(ctx, kind, x, y, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = "#030611";
    ctx.lineWidth = 1;

    if (kind === "castle") {
      ctx.fillRect(x - 7, y - 4, 14, 8); ctx.strokeRect(x - 7, y - 4, 14, 8);
      [-7, -1, 5].forEach((dx) => { ctx.fillRect(x + dx, y - 8, 3, 4); });
      ctx.fillStyle = "#8a2c2c"; ctx.fillRect(x - 1, y, 3, 4);
    } else if (kind === "peak" || kind === "crag") {
      ctx.beginPath(); ctx.moveTo(x - 7, y + 5); ctx.lineTo(x - (kind === "crag" ? 2 : 0), y - 7); ctx.lineTo(x + 7, y + 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (kind === "crag") { ctx.fillStyle = "#facc15"; ctx.fillRect(x + 2, y - 6, 1, 4); ctx.fillRect(x + 1, y - 3, 2, 1); }
    } else if (kind === "tree") {
      ctx.beginPath(); ctx.arc(x, y - 2, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#3b2618"; ctx.fillRect(x - 1, y + 3, 2, 4);
    } else if (kind === "reeds") {
      ctx.beginPath(); ctx.ellipse(x, y + 3, 7, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#3f6212"; [-3, 0, 3].forEach((dx, k) => ctx.fillRect(x + dx, y - 6 + k, 1, 8));
      ctx.fillStyle = "#5e3b1a"; ctx.fillRect(x - 3, y - 6, 1, 3); ctx.fillRect(x + 3, y - 4, 1, 3);
    } else if (kind === "mesa") {
      ctx.fillRect(x - 7, y - 3, 14, 7); ctx.strokeRect(x - 7, y - 3, 14, 7);
      ctx.fillRect(x - 4, y - 7, 8, 4); ctx.strokeRect(x - 4, y - 7, 8, 4);
    } else if (kind === "dune") {
      ctx.beginPath(); ctx.moveTo(x - 8, y + 4); ctx.quadraticCurveTo(x - 2, y - 7, x + 3, y + 1); ctx.quadraticCurveTo(x + 6, y - 3, x + 8, y + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fde68a"; ctx.beginPath(); ctx.arc(x + 4, y - 6, 2, 0, Math.PI * 2); ctx.fill();
    } else if (kind === "ship") {
      ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.quadraticCurveTo(x, y + 5, x + 7, y); ctx.lineTo(x + 5, y - 3); ctx.lineTo(x - 5, y - 3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 1, y - 8, 2, 6);
    } else if (kind === "monolith") {
      ctx.fillRect(x - 3, y - 8, 6, 14); ctx.strokeRect(x - 3, y - 8, 6, 14);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 1, y - 5, 2, 3);
    } else if (kind === "volcano") {
      ctx.beginPath(); ctx.moveTo(x - 8, y + 5); ctx.lineTo(x - 2, y - 5); ctx.lineTo(x + 2, y - 5); ctx.lineTo(x + 8, y + 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffd166"; ctx.fillRect(x - 1, y - 8, 2, 3);
    } else if (kind === "anchor") {
      ctx.beginPath(); ctx.arc(x, y - 4, 3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillRect(x - 1, y - 1, 2, 7);
      ctx.beginPath(); ctx.arc(x, y + 2, 5, 0, Math.PI); ctx.stroke();
    } else if (kind === "fortress") {
      ctx.fillRect(x - 6, y - 5, 12, 10); ctx.strokeRect(x - 6, y - 5, 12, 10);
      ctx.fillStyle = "#ef4444"; ctx.fillRect(x - 2, y - 8, 4, 3);
    } else if (kind === "vortex") {
      for (let k = 3; k > 0; k--) {
        ctx.strokeStyle = k % 2 ? color : "#030611";
        ctx.beginPath(); ctx.ellipse(x, y, k * 3.5, k * 2.2, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }

  // s: { quest, stageId, player, sideOpen: { areaId: open side quests } }. Returns the lands for the list.
  draw(ctx, x, y, w, h, s, tick) {
    if (!this.base || this.size[0] !== w || this.size[1] !== h) this.buildBase(w, h);
    ctx.drawImage(this.base, x, y);

    const L = getLang() === "fil" ? "fil" : "en";
    const q = s.quest;
    const pulse = 0.5 + Math.sin(tick / 6) * 0.5;
    const list = [];
    const isOpen = (id) => id === "hub" || Boolean(q && q.unlocked && q.unlocked(id));

    // Roads and trails (solid once open, faint while sealed)
    ROADS.forEach(([a, b, col]) => {
      const A = landById(a), B = landById(b);
      const open = isOpen(b);
      ctx.save();
      ctx.strokeStyle = open ? col : "rgba(100, 116, 139, 0.5)";
      ctx.globalAlpha = open ? 0.7 : 0.45;
      ctx.lineWidth = 1;
      ctx.setLineDash(col === "#ffd166" ? [3, 2] : [1, 2]);
      ctx.beginPath(); ctx.moveTo(x + w * A.x, y + h * A.y); ctx.lineTo(x + w * B.x, y + h * B.y); ctx.stroke();
      ctx.restore();
    });

    // Nima leads the sea-trade circuit once Aethelgard, the Beastkin island and the Dark
    // Continent are all reachable. The moving caravan makes the unlocked connection visible.
    const routeOpen = Boolean(q && q.unlocked && q.unlocked("port") && q.unlocked("swamp") && q.unlocked("siege"));
    if (routeOpen) {
      const stops = ["port", "swamp", "darkShore"].map(landById);
      ctx.save();
      ctx.strokeStyle = "rgba(250, 204, 21, 0.78)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      stops.forEach((stop, i) => i ? ctx.lineTo(x + w * stop.x, y + h * stop.y) : ctx.moveTo(x + w * stop.x, y + h * stop.y));
      ctx.closePath(); ctx.stroke(); ctx.restore();

      const phase = (tick / 150) % stops.length;
      const i = Math.floor(phase), f = phase - i;
      const a = stops[i], b = stops[(i + 1) % stops.length];
      const cx = x + w * (a.x + (b.x - a.x) * f), cy = y + h * (a.y + (b.y - a.y) * f);
      ctx.fillStyle = "#493626"; ctx.fillRect(cx - 6, cy + 2, 13, 2);
      ctx.fillStyle = "#d6a35c"; ctx.fillRect(cx - 5, cy - 2, 11, 4);
      ctx.fillStyle = "#263238"; ctx.fillRect(cx - 5, cy + 3, 3, 3); ctx.fillRect(cx + 3, cy + 3, 3, 3);
      ctx.fillStyle = "#cbd5e1"; ctx.fillRect(cx - 4, cy + 4, 1, 1); ctx.fillRect(cx + 4, cy + 4, 1, 1);
      this.caravanRider.draw(ctx, cx, cy + 2, "down", "idle", Math.floor(tick / 24) % 2, false, false, 0.28);
      ctx.fillStyle = "#fef3c7"; ctx.fillRect(cx - 1, cy - 10, 2, 2);
      ctx.fillStyle = "rgba(3, 6, 17, 0.82)";
      ctx.fillRect(x + w * 0.37, y + h - 9, 84, 7);
      ctx.fillStyle = "#fde68a"; ctx.font = "bold 4px monospace"; ctx.textAlign = "center";
      ctx.fillText(L === "fil" ? "CARAVAN NI NIMA · BUKAS NA RUTA" : "NIMA'S CARAVAN · TRADE ROUTE OPEN", x + w * 0.37 + 42, y + h - 4);
    }

    // Headers over the two continents and the Book II island
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd166";
    ctx.fillText(L === "fil" ? "KONTINENTE NG AETHELGARD" : "AETHELGARD CONTINENT", x + w * 0.28, y + 8);
    ctx.fillStyle = "#c084fc";
    ctx.fillText(L === "fil" ? "ANG DARK CONTINENT" : "THE DARK CONTINENT", x + w * 0.82, y + h * 0.2);
    ctx.font = "bold 4.5px monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(BOOK_TWO.name[L].toUpperCase(), x + w * BOOK_TWO.x, y + h * (BOOK_TWO.y + 0.1));
    ctx.font = "bold 7px monospace";
    ctx.fillStyle = `rgba(226, 232, 240, ${0.5 + pulse * 0.4})`;
    ctx.fillText("?", x + w * BOOK_TWO.x, y + h * BOOK_TWO.y + 3);

    LANDS.forEach((land) => {
      const def = PLATFORMS[land.id] || FRONTIERS[land.id];
      const frontier = Boolean(FRONTIERS[land.id]);
      const act = def ? (frontier ? def.unlockAct : def.act) : land.act;
      const name = def ? def.name[L] : (land.name ? land.name[L] : land.id);
      const awake = Boolean(q && q.monolith);
      const open = isOpen(land.id) || (land.id === "monolith" && isOpen("coast")) || (land.id === "darkShore" && awake);
      const cleared = def && !frontier && q && q.cleared ? q.cleared(land.id) : false;
      const px = x + w * land.x, py = y + h * land.y;
      const here = s.stageId === land.id || (land.id === "coast" && s.player && s.player.inBoat);
      const sideOpen = (s.sideOpen || {})[land.id] || 0;

      this.icon(ctx, land.icon, px, py, open ? land.color : "#475569");

      if (here) {
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 + pulse * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(px, py, 11 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
      }
      // Open side quests on this land: a gold badge
      if (sideOpen) {
        ctx.fillStyle = "#030611";
        ctx.beginPath(); ctx.arc(px + 9, py - 7, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255, 209, 102, ${0.7 + pulse * 0.3})`;
        ctx.beginPath(); ctx.arc(px + 9, py - 7, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#030611";
        ctx.font = "bold 4.5px monospace";
        ctx.textAlign = "center";
        ctx.fillText(String(sideOpen), px + 9, py - 5.5);
      }

      // Name and state
      const status = !open ? "🔒" : cleared ? "✔" : frontier ? "⛰" : def ? "⚔" : land.id === "monolith" ? (awake ? "✦" : "⛓") : "";
      const label = `${status} ${land.id === "hub" || !act ? name : frontier ? name : `Act ${ROMAN[act]} · ${name}`}`.trim();
      ctx.font = "bold 4.5px monospace";
      ctx.textAlign = "center";
      const tw = ctx.measureText(label).width + 4;
      const ly = py + 12;
      ctx.fillStyle = "rgba(3, 6, 17, 0.85)";
      const lx = Math.max(x + tw / 2 + 2, Math.min(x + w - tw / 2 - 2, px));   // keep labels inside the map frame
      ctx.fillRect(lx - tw / 2, ly - 5, tw, 6.5);
      ctx.fillStyle = !open ? "#64748b" : here ? "#00f0ff" : cleared ? "#4ade80" : land.color;
      ctx.fillText(label, lx, ly);

      const lv = def || land.id === "hub" ? areaLevels(land.id) : null;
      list.push({ act: land.order || act || 1, sub: frontier ? 0.5 : 0, id: land.id, name, open, cleared, frontier, color: land.color, here, levels: lv, side: sideOpen });
    });

    return list.sort((a, b) => a.act - b.act || a.sub - b.sub);
  }
}
