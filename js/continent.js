import { getLang } from "./i18n.js";
import { PLATFORMS } from "./world/platforms.js";

// ==================== DUAL-CONTINENT WORLD MAP ====================
// Ang buong mundo ng Vanguard of Fate ay binubuo ng dalawang dakilang kontinente:
// 1. KONTINENTE NG AETHELGARD (Soberanya ni Haring Alden at Basbas ni Astraea)
// 2. ANG DARK CONTINENT (Nox Aeterna / Imperyo ni Demon Lord Satan)
// Sa pagitan nila ay ang Dagat ng Cerulean at ang Sinaunang Sunken Monolith Portal.

export const CONTINENTS = {
  aethelgard: {
    id: "aethelgard",
    name: { en: "Aethelgard Continent", fil: "Kontinente ng Aethelgard" },
    subtitle: { en: "Sovereign Realm of High King Alden", fil: "Kaharian ng Kataas-taasang Haring Alden" },
    color: "#ffd166"
  },
  dark_continent: {
    id: "dark_continent",
    name: { en: "The Dark Continent (Nox Aeterna)", fil: "Ang Dark Continent (Nox Aeterna)" },
    subtitle: { en: "Corrupted Empire of Demon Lord Satan", fil: "Imperyo ng Kadiliman ni Demon Lord Satan" },
    color: "#9d4edd"
  }
};

const LANDS = [
  // ---- 1. AETHELGARD CONTINENT (KANLURAN / GITNA) ----
  { id: "hub", continent: "aethelgard", x: 0.28, y: 0.48, act: 1, color: "#ffd166", icon: "castle", name: { en: "Imperial Citadel & Barracks", fil: "Imperial Citadel at Barracks" } },
  { id: "frost", continent: "aethelgard", x: 0.28, y: 0.16, color: "#bfe9ff", icon: "peak" },
  { id: "canopy", continent: "aethelgard", x: 0.44, y: 0.42, color: "#c77dff", icon: "tree" },
  { id: "coast", continent: "aethelgard", x: 0.11, y: 0.58, color: "#38bdf8", icon: "ship", name: { en: "Cerulean Coast & Pier", fil: "Baybayin at Pier ng Cerulean" } },
  { id: "ash", continent: "aethelgard", x: 0.32, y: 0.82, color: "#ff7a1a", icon: "volcano" },

  // ---- 2. CELESTIAL ABYSSAL DIVIDE (SINAUNANG MONOLITH AT SEA PORTAL) ----
  { id: "monolith", continent: "sea", x: 0.50, y: 0.65, act: 8, color: "#00f0ff", icon: "monolith", name: { en: "Sunken Monolith Portal", fil: "Lagusan ng Sunken Monolith" } },

  // ---- 3. THE DARK CONTINENT (SILANGAN / TIMOG-SILANGAN) ----
  { id: "darkShore", continent: "dark_continent", x: 0.66, y: 0.55, act: 10, color: "#6366f1", icon: "anchor", name: { en: "Obsidian Harbor", fil: "Pintuang Obsidian ng Dagat" } },
  { id: "siege", continent: "dark_continent", x: 0.78, y: 0.38, color: "#ef4444", icon: "fortress" },
  { id: "maw", continent: "dark_continent", x: 0.82, y: 0.68, color: "#9d4edd", icon: "vortex" }
];

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function rng(seed) {
  let a = seed;
  return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
}

export class ContinentMap {
  constructor() {
    this.base = null;
    this.size = [0, 0];
    this.activeContinent = "all"; // "all" | "aethelgard" | "dark_continent"
  }

  // Pagguhit ng dalawang kontinente at karagatan sa background canvas
  buildBase(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    const r = rng(4242);

    // 1. Karagatan (Abyssal Sea Divide)
    g.fillStyle = "#071b2d";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(125, 211, 252, 0.16)";
    for (let k = 0; k < 80; k++) {
      const x = r() * w, y = r() * h;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4, y - 2, x + 8, y); g.stroke();
    }

    // 2. KONTINENTE 1: AETHELGARD (Luntiang Lupa sa Kaliwa)
    const pts1 = [];
    const N1 = 40;
    const cx1 = w * 0.28, cy1 = h * 0.48;
    for (let k = 0; k < N1; k++) {
      const a = (k / N1) * Math.PI * 2;
      const rad = 0.25 + Math.sin(a * 3 + 1) * 0.03 + Math.sin(a * 5) * 0.02 + (r() - 0.5) * 0.025;
      pts1.push([cx1 + Math.cos(a) * w * rad * 1.05, cy1 + Math.sin(a) * h * rad * 1.2]);
    }
    const drawLand = (pts, fill, stroke) => {
      g.beginPath();
      pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
      g.fillStyle = fill;
      g.fill();
      if (stroke) {
        g.strokeStyle = stroke;
        g.lineWidth = 1.5;
        g.stroke();
      }
    };

    // Shadow & Land 1
    g.save(); g.translate(2, 3); drawLand(pts1, "rgba(0, 0, 0, 0.4)"); g.restore();
    drawLand(pts1, "#365314", "#ca8a04");

    // Detalye ng Aethelgard:
    g.save();
    g.clip();
    // Frostfang sa Hilaga
    g.fillStyle = "rgba(224, 242, 254, 0.9)";
    g.beginPath(); g.ellipse(w * 0.28, h * 0.16, w * 0.16, h * 0.10, 0, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 7; k++) {
      const x = w * (0.18 + k * 0.03), y = h * (0.15 + (k % 2) * 0.03);
      g.fillStyle = "#64748b"; g.beginPath(); g.moveTo(x - 5, y + 5); g.lineTo(x, y - 5); g.lineTo(x + 5, y + 5); g.fill();
      g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(x - 2, y); g.lineTo(x, y - 5); g.lineTo(x + 2, y); g.fill();
    }
    // Whispering Canopy sa Silangan
    g.fillStyle = "rgba(19, 78, 74, 0.85)";
    g.beginPath(); g.ellipse(w * 0.44, h * 0.42, w * 0.09, h * 0.16, 0, 0, Math.PI * 2); g.fill();
    // Ashfall sa Timog
    g.fillStyle = "rgba(41, 37, 36, 0.95)";
    g.beginPath(); g.ellipse(w * 0.32, h * 0.82, w * 0.12, h * 0.10, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#ff7a1a"; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(w * 0.24, h * 0.80); g.bezierCurveTo(w * 0.30, h * 0.86, w * 0.36, h * 0.76, w * 0.40, h * 0.84); g.stroke();
    g.restore();

    // 3. KONTINENTE 2: THE DARK CONTINENT (Itim/Lilaw na Lupa sa Silangan)
    const pts2 = [];
    const N2 = 36;
    const cx2 = w * 0.77, cy2 = h * 0.52;
    for (let k = 0; k < N2; k++) {
      const a = (k / N2) * Math.PI * 2;
      const rad = 0.20 + Math.sin(a * 4 + 2) * 0.03 + (r() - 0.5) * 0.025;
      pts2.push([cx2 + Math.cos(a) * w * rad * 1.05, cy2 + Math.sin(a) * h * rad * 1.3]);
    }
    g.save(); g.translate(2, 3); drawLand(pts2, "rgba(0, 0, 0, 0.45)"); g.restore();
    drawLand(pts2, "#1e102a", "#9333ea");

    // Detalye ng Dark Continent
    g.save();
    g.clip();
    // Void Cracks & Blood Marshes
    g.strokeStyle = "rgba(239, 68, 68, 0.75)";
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(w * 0.68, h * 0.44); g.lineTo(w * 0.76, h * 0.50); g.lineTo(w * 0.84, h * 0.46);
    g.moveTo(w * 0.73, h * 0.58); g.lineTo(w * 0.81, h * 0.65);
    g.stroke();
    // Maw of Damnation Swirl sa Gitna ng Dark Continent
    g.fillStyle = "rgba(15, 7, 26, 0.95)";
    g.beginPath(); g.ellipse(w * 0.82, h * 0.68, w * 0.07, h * 0.08, 0, 0, Math.PI * 2); g.fill();
    g.restore();

    // 4. CELESTIAL SEA ROUTE & MONOLITH ISLAND SA PAGITAN NG DALAWANG KONTINENTE
    // Monolith Reef Island
    g.fillStyle = "#1e293b";
    g.beginPath(); g.ellipse(w * 0.50, h * 0.65, 12, 7, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#38bdf8"; g.lineWidth = 1; g.stroke();

    // Sea Route Dotted Line (Mula Coast -> Monolith -> Dark Continent Harbor)
    g.setLineDash([2, 3]);
    g.strokeStyle = "rgba(56, 189, 248, 0.75)";
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(w * 0.11, h * 0.58);
    g.quadraticCurveTo(w * 0.32, h * 0.68, w * 0.50, h * 0.65);
    g.stroke();

    g.strokeStyle = "rgba(168, 85, 247, 0.75)";
    g.beginPath();
    g.moveTo(w * 0.50, h * 0.65);
    g.quadraticCurveTo(w * 0.58, h * 0.60, w * 0.66, h * 0.55);
    g.stroke();
    g.setLineDash([]);

    // 5. Compass Rose
    const rx = w * 0.94, ry = h * 0.90;
    g.strokeStyle = "#ffd166"; g.fillStyle = "#ffd166"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(rx, ry - 9); g.lineTo(rx + 2.5, ry); g.lineTo(rx, ry + 9); g.lineTo(rx - 2.5, ry); g.closePath(); g.fill();
    g.font = "bold 5px serif"; g.textAlign = "center"; g.fillText("N", rx, ry - 11);

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
    } else if (kind === "peak") {
      ctx.beginPath(); ctx.moveTo(x - 7, y + 5); ctx.lineTo(x, y - 7); ctx.lineTo(x + 7, y + 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (kind === "tree") {
      ctx.beginPath(); ctx.arc(x, y - 2, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#3b2618"; ctx.fillRect(x - 1, y + 3, 2, 4);
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

  draw(ctx, x, y, w, h, s, tick) {
    if (!this.base || this.size[0] !== w || this.size[1] !== h) this.buildBase(w, h);
    ctx.drawImage(this.base, x, y);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);

    const L = getLang() === "fil" ? "fil" : "en";
    const q = s.quest;
    const pulse = 0.5 + Math.sin(tick / 6) * 0.5;
    const list = [];

    // Header Labels sa ibabaw ng dalawang kontinente
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd166";
    ctx.fillText(L === "fil" ? "KONTINENTE NG AETHELGARD" : "AETHELGARD CONTINENT", x + w * 0.28, y + 12);
    ctx.fillStyle = "#c084fc";
    ctx.fillText(L === "fil" ? "ANG DARK CONTINENT" : "THE DARK CONTINENT", x + w * 0.77, y + 12);

    LANDS.forEach((land) => {
      const def = PLATFORMS[land.id];
      const act = def ? def.act : land.act;
      const name = def ? def.name[L] : (land.name ? land.name[L] : land.id);
      const open = land.id === "hub" || (q && q.unlocked && q.unlocked(land.id)) || land.id === "coast" || land.id === "monolith";
      const cleared = def && q && q.cleared ? q.cleared(land.id) : false;
      const px = x + w * land.x, py = y + h * land.y;
      const here = s.stageId === land.id || (land.id === "coast" && s.player && s.player.inBoat);

      this.icon(ctx, land.icon, px, py, open ? land.color : "#475569");

      if (here) {
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 + pulse * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(px, py, 11 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
      }

      // Pangalan at kalagayan
      const status = !open ? "🔒" : cleared ? "✔" : def ? "⚔" : "";
      const label = `${status} ${land.id === "hub" || !act ? name : `Act ${ROMAN[act]} · ${name}`}`.trim();
      ctx.font = "bold 4.5px monospace";
      ctx.textAlign = "center";
      const tw = ctx.measureText(label).width + 4;
      const ly = py + 12;
      ctx.fillStyle = "rgba(3, 6, 17, 0.85)";
      ctx.fillRect(px - tw / 2, ly - 5, tw, 6.5);
      ctx.fillStyle = !open ? "#64748b" : here ? "#00f0ff" : cleared ? "#4ade80" : land.color;
      ctx.fillText(label, px, ly);

      list.push({ act: act || 1, name, open, cleared, color: land.color, here });
    });

    return list.sort((a, b) => a.act - b.act);
  }
}
