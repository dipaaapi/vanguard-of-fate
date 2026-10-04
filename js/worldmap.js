import { getLang } from "./i18n.js";
import { ContinentMap } from "./continent.js";

// ==================== WORLD MAP (M) ====================
// The whole world at a glance: land, Barracks, Citadel, coast, the 4 Warp Gateways,
// the player, NPCs, foes, loot and the current quest objective.
// Drawn over the game canvas (480x270 logical). The game is paused while it is open.

const TEXT = {
  en: {
    title: "WORLD MAP", you: "You", objective: "Quest target", npc: "Ally", foe: "Foe", loot: "Loot",
    barracks: "Barracks Sanctuary", citadel: "Imperial Citadel", coast: "Cerulean Coast",
    gate: "Warp Gateway", grass: "Grassland", close: "[M / ESC] Close", legend: "LEGEND", places: "PLACES",
    goal: "OBJECTIVE", camp: "Vanguard Camp", back: "Return Gateway",
    continent: "CONTINENT OF AETHELGARD", region: "REGION", lands: "LANDS", tab: "[TAB] Continent / Region",
    sealed: "Sealed", open: "Open", freed: "Freed", here: "You are here"
  },
  fil: {
    title: "MAPA NG MUNDO", you: "Ikaw", objective: "Layunin", npc: "Kakampi", foe: "Kalaban", loot: "Samsam",
    barracks: "Barracks Sanctuary", citadel: "Imperial Citadel", coast: "Baybayin ng Cerulean",
    gate: "Warp Gateway", grass: "Kaparangan", close: "[M / ESC] Isara", legend: "PALATANDAAN", places: "MGA LUGAR",
    goal: "LAYUNIN", camp: "Kampo ng Fated Vanguard", back: "Pabalik na Gateway",
    continent: "KONTINENTE NG AETHELGARD", region: "REHIYON", lands: "MGA LUPAIN", tab: "[TAB] Kontinente / Rehiyon",
    sealed: "Selyado", open: "Bukas", freed: "Napalaya", here: "Narito ka"
  }
};
const tx = (k) => (TEXT[getLang()] || TEXT.en)[k];

// Wrap long text into lines that fit the width
function wrap(ctx, text, maxW) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let cur = "";
  words.forEach((w) => {
    const next = cur ? cur + " " + w : w;
    if (ctx.measureText(next).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = next;
  });
  if (cur) lines.push(cur);
  return lines;
}

export class WorldMap {
  constructor(stage) {
    this.stage = stage;
    this.open = false;
    this.base = null;
    this.tick = 0;
    this.view = "region";          // "region" (current place) | "continent" (the whole world)
    this.continent = new ContinentMap();
  }

  toggleView() {
    this.view = this.view === "region" ? "continent" : "region";
  }

  // Once per opening: draw the whole world into an offscreen canvas
  buildBase() {
    const st = this.stage;
    if (!this.base) {
      this.base = document.createElement("canvas");
      this.base.width = st.width;
      this.base.height = st.height;
    }
    const c = this.base.getContext("2d");
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, st.width, st.height);
    if (st.id !== "hub") {
      // An Act platform: ground, landmark, camp and Return Gateway
      st.draw(c);
      if (st.tilemap.overlayCanvas) c.drawImage(st.tilemap.overlayCanvas, 0, 0);
      return;
    }
    if (st.tilemap && st.tilemap.groundCanvas) c.drawImage(st.tilemap.groundCanvas, 0, 0);
    [st.castle, st.barracks, st.portals].forEach((sys) => {
      try { if (sys && sys.draw) sys.draw(c); } catch (_) { /* skip */ }
    });
    if (st.tilemap && st.tilemap.overlayCanvas) c.drawImage(st.tilemap.overlayCanvas, 0, 0);
  }

  show() {
    this.buildBase();
    this.open = true;
  }

  close() {
    this.open = false;
  }

  toggle() {
    if (this.open) this.close();
    else this.show();
  }

  // s: { player, npcs, targetId, enemies, loot, goal, act }
  draw(ctx, W, H, s) {
    if (!this.open || !this.base) return;
    this.tick++;
    if (this.view === "continent" && s.quest) return this.drawContinent(ctx, W, H, s);
    const st = this.stage;

    ctx.save();
    ctx.fillStyle = "rgba(3, 6, 17, 0.92)";
    ctx.fillRect(0, 0, W, H);

    // ---- Map (left) ----
    const pad = 10, top = 20;
    const mapH = H - top - pad;
    const k = Math.min((W * 0.66) / st.width, mapH / st.height);
    const mw = Math.round(st.width * k), mh = Math.round(st.height * k);
    const mx = pad, my = top;
    const P = (x, y) => [mx + x * k, my + y * k];

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(tx("title"), mx, 13);

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.base, mx, my, mw, mh);
    ctx.imageSmoothingEnabled = false;
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1;
    ctx.strokeRect(mx - 0.5, my - 0.5, mw + 1, mh + 1);

    // Place names
    const label = (text, wx, wy, color = "#f8fafc") => {
      const [x, y] = P(wx, wy);
      ctx.font = "bold 5px monospace";
      ctx.textAlign = "center";
      const w = ctx.measureText(text).width + 4;
      ctx.fillStyle = "rgba(3, 6, 17, 0.75)";
      ctx.fillRect(x - w / 2, y - 5, w, 7);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };
    const sz = st.safeZone;
    if (st.id !== "hub") {
      const L = getLang() === "fil" ? "fil" : "en";
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 6px monospace";
      ctx.textAlign = "left";
      ctx.fillText(st.name().toUpperCase(), mx + 70, 13);
      label(tx("camp"), sz.x + sz.w / 2, sz.y - 6, "#ffd166");
      label(st.def.arenaName[L], st.arena.x + st.arena.w / 2, st.arena.y + st.arena.h + 10, "#c084fc");
      label(tx("back"), st.gate.x, st.gate.y + (st.gate.dir === "vertical" ? -36 : -14), "#c4b5fd");
    } else {
      label(tx("barracks"), sz.x + sz.w / 2, sz.y - 6, "#ffd166");
      const cs = st.castle;
      label(tx("citadel"), cs.x + cs.width / 2, cs.y + cs.height + 26, "#ffd166");
      label(tx("coast"), 150, st.height - 60, "#7dd3fc");
      label(tx("grass"), 260, 300, "#86efac");
      (st.portals && st.portals.portals || []).forEach((pt) => {
        const dx = pt.id === "WEST" ? 34 : pt.id === "EAST" ? -34 : 0;
        const dy = pt.id === "NORTH" ? 26 : pt.id === "SOUTH" ? -22 : -14;
        const s = st.portals.stateOf(pt) || {};
        label(`${s.sealed ? "🔒 " : ""}${s.label || `${tx("gate")} ${pt.id[0]}`}`, pt.x + dx, pt.y + dy, s.sealed ? "#94a3b8" : "#c4b5fd");
      });
    }

    // Loot and foes
    (s.loot || []).forEach((it) => {
      const [x, y] = P(it.x, it.y);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(x - 1, y - 1, 2, 2);
    });
    (s.enemies || []).forEach((e) => {
      if (!e.isAlive) return;
      const [x, y] = P(e.x + 8, e.y + 8);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    });

    // NPCs (the quest objective blinks)
    const pulse = 0.5 + Math.sin(this.tick / 6) * 0.5;
    (s.npcs || []).forEach((n) => {
      if (!n.visible) return;
      const [x, y] = P(n.x, n.y - 6);
      if (n.id === s.targetId) {
        ctx.strokeStyle = `rgba(255, 209, 102, ${0.4 + pulse * 0.6})`;
        ctx.beginPath();
        ctx.arc(x, y, 4 + pulse * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#ffd166";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        ctx.fillText("!", x, y - 6);
      }
      ctx.fillStyle = n.id === s.targetId ? "#ffd166" : "#e2e8f0";
      ctx.fillRect(x - 1, y - 1, 2.5, 2.5);
    });

    // Player
    if (s.player) {
      const [x, y] = P(s.player.x + 10, s.player.y + 16);
      ctx.fillStyle = "#030611";
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#00f0ff";
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.3 + pulse * 0.5})`;
      ctx.beginPath(); ctx.arc(x, y, 5 + pulse * 2, 0, Math.PI * 2); ctx.stroke();
    }

    // ---- Right column: objective + legend ----
    const rx = mx + mw + 12, rw = W - rx - pad;
    let y = my + 4;
    ctx.textAlign = "left";
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 5px monospace";
    ctx.fillText(tx("goal"), rx, y);
    y += 8;
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 5px monospace";
    wrap(ctx, s.act, rw).forEach((ln) => { ctx.fillText(ln, rx, y); y += 7; });
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "6px monospace";
    wrap(ctx, s.goal, rw).forEach((ln) => { ctx.fillText(ln, rx, y); y += 8; });

    y += 8;
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 5px monospace";
    ctx.fillText(tx("legend"), rx, y);
    y += 9;
    const row = (color, text, shape = "sq") => {
      ctx.fillStyle = color;
      if (shape === "dot") { ctx.beginPath(); ctx.arc(rx + 2, y - 2, 2.5, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(rx, y - 4, 4, 4);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "6px monospace";
      ctx.fillText(text, rx + 9, y);
      y += 9;
    };
    row("#00f0ff", tx("you"), "dot");
    row("#ffd166", tx("objective"));
    row("#e2e8f0", tx("npc"));
    row("#ef4444", tx("foe"));
    row("#22c55e", tx("loot"));

    ctx.fillStyle = "#64748b";
    ctx.font = "5px monospace";
    ctx.fillText(tx("tab"), rx, H - pad - 8);
    ctx.fillText(tx("close"), rx, H - pad);
    ctx.restore();
  }

  // Whole continent: every land, its state (sealed / open / freed) and where you are
  drawContinent(ctx, W, H, s) {
    ctx.save();
    ctx.fillStyle = "rgba(3, 6, 17, 0.94)";
    ctx.fillRect(0, 0, W, H);
    const pad = 10, top = 20;
    const mw = Math.round(W * 0.64), mh = H - top - pad;
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(tx("continent"), pad, 13);
    const lands = this.continent.draw(ctx, pad, top, mw, mh, s, this.tick);
    ctx.textAlign = "left";

    // Right column: objective and the list of lands
    const rx = pad + mw + 12, rw = W - rx - pad;
    let y = top + 4;
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 5px monospace";
    ctx.fillText(tx("goal"), rx, y);
    y += 8;
    ctx.fillStyle = "#ffd166";
    wrap(ctx, s.act, rw).forEach((ln) => { ctx.fillText(ln, rx, y); y += 7; });
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "6px monospace";
    wrap(ctx, s.goal, rw).forEach((ln) => { ctx.fillText(ln, rx, y); y += 8; });
    y += 6;
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 5px monospace";
    ctx.fillText(tx("lands"), rx, y);
    y += 8;
    lands.forEach((l) => {
      ctx.fillStyle = l.open ? l.color : "#475569";
      ctx.fillRect(rx, y - 4, 4, 4);
      ctx.font = "5px monospace";
      ctx.fillStyle = l.here ? "#00f0ff" : "#cbd5e1";
      ctx.fillText(`${l.name}`, rx + 7, y);
      ctx.fillStyle = !l.open ? "#64748b" : l.cleared ? "#4ade80" : "#facc15";
      ctx.textAlign = "right";
      ctx.fillText(l.here ? tx("here") : !l.open ? tx("sealed") : l.cleared ? tx("freed") : tx("open"), W - pad, y);
      ctx.textAlign = "left";
      y += 8;
    });
    ctx.fillStyle = "#64748b";
    ctx.font = "5px monospace";
    ctx.fillText(tx("tab"), rx, H - pad - 8);
    ctx.fillText(tx("close"), rx, H - pad);
    ctx.restore();
  }
}
