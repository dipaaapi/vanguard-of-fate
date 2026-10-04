import { getLang } from "./i18n.js";
import { ContinentMap } from "./continent.js";
import { drawBackdrop, drawBorder, drawFrame, openEase, keyChip } from "./uiframe.js";
import { areaDef, areaLevels } from "./world/areas.js";

// ==================== WORLD MAP (M) ====================
// Full-screen map of the current place (region) or of both continents (Tab). The game is paused while it is open.
// Region view: zoom (+ / − or the mouse wheel, 1× to 3×) and pan (arrows / WASD; 0 re-centres on the hero),
// the hero, NPCs, foes (elites as gold diamonds), loot, gates and trails, sites to scout, the route to the
// current objective, and a side panel (L hides it) with the objective, this map's side quests and a legend.
// Drawn over the game canvas (480x270 logical).

const TEXT = {
  en: {
    title: "WORLD MAP", you: "You", objective: "Objective", npc: "Ally", foe: "Foe", elite: "Elite", loot: "Loot", site: "Site to scout",
    barracks: "Barracks Sanctuary", citadel: "Imperial Citadel", gate: "Warp Gateway", grass: "Grassland",
    legend: "LEGEND", goal: "OBJECTIVE", camp: "Camp", back: "Return Gateway", lv: "Lv",
    continent: "BOOK I · THE WORLD", lands: "LANDS", side: "SIDE QUESTS HERE", none: "None on this map",
    sealed: "Sealed", open: "Open", freed: "Freed", here: "You are here",
    keys: [["M", "Close"], ["Tab", "Continent"], ["+/−", "Zoom"], ["←↑→↓", "Pan"], ["L", "Panel"]],
    keysC: [["M", "Close"], ["Tab", "Region"], ["L", "Panel"]]
  },
  fil: {
    title: "MAPA NG MUNDO", you: "Ikaw", objective: "Layunin", npc: "Kakampi", foe: "Kalaban", elite: "Elite", loot: "Samsam", site: "Sisiyasatin",
    barracks: "Barracks Sanctuary", citadel: "Imperial Citadel", gate: "Warp Gateway", grass: "Kaparangan",
    legend: "PALATANDAAN", goal: "LAYUNIN", camp: "Kampo", back: "Pabalik na Gateway", lv: "Lv",
    continent: "AKLAT I · ANG MUNDO", lands: "MGA LUPAIN", side: "SIDE QUEST DITO", none: "Wala sa mapang ito",
    sealed: "Selyado", open: "Bukas", freed: "Napalaya", here: "Narito ka",
    keys: [["M", "Isara"], ["Tab", "Kontinente"], ["+/−", "Zoom"], ["←↑→↓", "Galaw"], ["L", "Panel"]],
    keysC: [["M", "Isara"], ["Tab", "Rehiyon"], ["L", "Panel"]]
  }
};
const tx = (k) => (TEXT[getLang()] || TEXT.en)[k];
const ZOOMS = [1, 1.5, 2, 3];
const PANEL_W = 122;

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
    this.zoomIndex = 0;
    this.center = null;            // world point at the middle of the map (null = follow the hero)
    this.panel = true;
  }

  toggleView() {
    this.view = this.view === "region" ? "continent" : "region";
  }

  // Keys while the map is open. Returns true when the key was used.
  handleKey(e) {
    const c = e.code;
    if (c === "Tab") { this.toggleView(); return true; }
    if (c === "KeyL") { this.panel = !this.panel; return true; }
    if (this.view !== "region") return false;
    if (c === "Equal" || c === "NumpadAdd" || c === "KeyX" || c === "PageUp") { this.zoomBy(1); return true; }
    if (c === "Minus" || c === "NumpadSubtract" || c === "KeyZ" || c === "PageDown") { this.zoomBy(-1); return true; }
    if (c === "Digit0" || c === "Numpad0" || c === "Home") { this.center = null; return true; }
    const step = 120 / ZOOMS[this.zoomIndex];
    const d = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] }[c];
    if (d) {
      const cur = this.center || this.heroPoint();
      this.center = { x: cur.x + d[0] * step, y: cur.y + d[1] * step };
      return true;
    }
    return false;
  }

  // Mouse wheel over the canvas
  wheel(dy) {
    if (!this.open || this.view !== "region") return;
    this.zoomBy(dy < 0 ? 1 : -1);
  }

  zoomBy(dir) {
    this.zoomIndex = Math.max(0, Math.min(ZOOMS.length - 1, this.zoomIndex + dir));
  }

  heroPoint() {
    const p = this.lastPlayer;
    return p ? { x: p.x + 10, y: p.y + 16 } : { x: this.stage.width / 2, y: this.stage.height / 2 };
  }

  // Once per opening: draw the whole place into an offscreen canvas
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
      // A platform or frontier: ground, landmark, camp and gateways
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
    this.openT = 0;
    this.center = null;
  }

  close() {
    this.open = false;
  }

  toggle() {
    if (this.open) this.close();
    else this.show();
  }

  // s: { player, npcs, targetId, enemies, loot, goal, act, quest, stageId, objective: {x, y} | null }
  draw(ctx, W, H, s) {
    if (!this.open || !this.base) return;
    this.tick++;
    this.lastPlayer = s.player;
    if (this.view === "continent" && s.quest) return this.drawContinent(ctx, W, H, s);
    const st = this.stage;
    const L = getLang() === "fil" ? "fil" : "en";
    const ease = openEase(this.openT = (this.openT || 0) + 1);
    const pulse = 0.5 + Math.sin(this.tick / 6) * 0.5;

    ctx.save();
    drawBackdrop(ctx, W, H, ease, "3, 6, 17", 0.94);
    ctx.globalAlpha = ease;

    // ---- Header: title, place, level band, zoom ----
    const def = areaDef(st.id);
    const [lo, hi] = areaLevels(st.id);
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 8px monospace";
    ctx.fillText(tx("title"), 6, 11);
    const placeName = st.id === "hub" ? (def ? def.name[L] : "") : st.name();
    ctx.font = "bold 6px monospace";
    ctx.fillStyle = def && def.color ? def.color : "#e2e8f0";
    const tw = ctx.measureText(tx("title")).width;
    ctx.fillText(`· ${placeName.toUpperCase()}  ${tx("lv")} ${lo}–${hi}`, 6 + tw + 14, 11);
    ctx.textAlign = "right";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`${ZOOMS[this.zoomIndex]}×`, W - 6, 11);

    // ---- Map viewport (full width; the side panel floats over the right edge) ----
    const vx = 6, vy = 16, vw = W - 12, vh = H - vy - 14;
    const mw = this.panel ? vw - PANEL_W - 4 : vw;    // the part of the viewport not under the side panel
    const fit = Math.min(mw / st.width, vh / st.height);
    const k = fit * ZOOMS[this.zoomIndex];
    const want = this.center || this.heroPoint();
    // keep the map filling the viewport where it can
    const half = (span, view) => (span * k > view ? [view / 2 / k, span - view / 2 / k] : [span / 2, span / 2]);
    const [cx0, cx1] = half(st.width, mw), [cy0, cy1] = half(st.height, vh);
    const cx = Math.max(cx0, Math.min(cx1, want.x)), cy = Math.max(cy0, Math.min(cy1, want.y));
    if (this.center) this.center = { x: cx, y: cy };
    const ox = vx + mw / 2 - cx * k, oy = vy + vh / 2 - cy * k;
    const P = (x, y) => [ox + x * k, oy + y * k];

    ctx.fillStyle = "#0b1220";
    ctx.fillRect(vx, vy, vw, vh);
    ctx.save();
    ctx.beginPath(); ctx.rect(vx, vy, vw, vh); ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.base, ox, oy, st.width * k, st.height * k);
    ctx.imageSmoothingEnabled = false;
    // vignette and a survey grid with coordinates (A–H × 1–6)
    const vg = ctx.createRadialGradient(vx + vw / 2, vy + vh / 2, Math.min(vw, vh) * 0.4, vx + vw / 2, vy + vh / 2, Math.max(vw, vh) * 0.7);
    vg.addColorStop(0, "rgba(3, 6, 17, 0)");
    vg.addColorStop(1, "rgba(3, 6, 17, 0.5)");
    ctx.fillStyle = vg;
    ctx.fillRect(vx, vy, vw, vh);
    ctx.font = "4px monospace";
    ctx.textAlign = "left";
    for (let gx = 0; gx < 8; gx++) {
      const [x] = P((st.width * gx) / 8, 0);
      ctx.fillStyle = "rgba(255, 209, 102, 0.08)";
      if (gx) ctx.fillRect(Math.round(x), vy, 1, vh);
      ctx.fillStyle = "rgba(255, 209, 102, 0.45)";
      ctx.fillText(String.fromCharCode(65 + gx), Math.round(x) + 2, vy + 5);
    }
    for (let gy = 0; gy < 6; gy++) {
      const [, y] = P(0, (st.height * gy) / 6);
      ctx.fillStyle = "rgba(255, 209, 102, 0.08)";
      if (gy) ctx.fillRect(vx, Math.round(y), vw, 1);
      ctx.fillStyle = "rgba(255, 209, 102, 0.45)";
      ctx.fillText(String(gy + 1), vx + 2, Math.round(y) + 10);
    }

    // Place names
    const label = (text, wx, wy, color = "#f8fafc", size = 5) => {
      const [x0, y] = P(wx, wy);
      ctx.font = `bold ${size}px monospace`;
      ctx.textAlign = "center";
      const w = ctx.measureText(text).width + 4;
      const x = Math.max(vx + w / 2 + 1, Math.min(vx + vw - w / 2 - 1, x0));   // keep it inside the frame
      ctx.fillStyle = "rgba(3, 6, 17, 0.78)";
      ctx.fillRect(x - w / 2, y - size, w, size + 2);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };
    const sz = st.safeZone;
    if (st.id !== "hub") {
      label(`⛺ ${tx("camp")}`, sz.x + sz.w / 2, sz.y - 6, "#ffd166");
      label(st.def.arenaName[L], st.arena.x + st.arena.w / 2, st.arena.y + st.arena.h + 10, st.def.frontier ? "#fbbf24" : "#c084fc");
      const back = st.gate.dest === "hub" ? tx("back") : `${tx("back")} · ${areaDef(st.gate.dest).name[L]}`;
      label(back, st.gate.x, st.gate.y + (st.gate.dir === "vertical" ? -36 : st.gate.y < st.height / 2 ? 22 : -14), "#c4b5fd");
      if (st.trail) {
        const f = areaDef(st.trail.dest);
        label(`${st.trailSealed ? "🔒" : "→"} ${f.name[L]}`, st.trail.x + (st.trail.x > st.width / 2 ? -40 : 40), st.trail.y - 34, st.trailSealed ? "#94a3b8" : f.color);
      }
    } else {
      label(tx("barracks"), sz.x + sz.w / 2, sz.y - 6, "#ffd166");
      const cs = st.castle;
      label(tx("citadel"), cs.x + cs.width / 2, cs.y + cs.height + 26, "#ffd166");
      label(tx("grass"), 260, 300, "#86efac");
      (st.portals && st.portals.portals || []).forEach((pt) => {
        const dx = pt.id === "WEST" ? 34 : pt.id === "EAST" ? -34 : 0;
        const dy = pt.id === "NORTH" ? 26 : pt.id === "SOUTH" || pt.id === "BADLANDS" ? -22 : -14;
        const ps = st.portals.stateOf(pt) || {};
        label(`${ps.sealed ? "🔒 " : ""}${ps.label || `${tx("gate")} ${pt.id[0]}`}`, pt.x + dx, pt.y + dy, ps.sealed ? "#94a3b8" : "#c4b5fd");
      });
    }

    // Sites: the ones still to scout glow gold, the rest are quiet grey cairns
    const pending = new Set((s.sites || []).map((p) => `${p.x},${p.y}`));
    ((def && def.sites) || []).forEach((site) => {
      const [x, y] = P(site.x, site.y);
      const todo = pending.has(`${site.x},${site.y}`);
      ctx.fillStyle = todo ? "#ffd166" : "#64748b";
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 5, 1, 5);
      ctx.fillRect(Math.round(x), Math.round(y) - 5, 3, 2);
      if (todo) {
        ctx.strokeStyle = `rgba(255, 209, 102, ${0.35 + pulse * 0.5})`;
        ctx.beginPath(); ctx.arc(x, y - 2, 4 + pulse * 2, 0, Math.PI * 2); ctx.stroke();
      }
      if (todo || ZOOMS[this.zoomIndex] >= 1.5) label(site.name[L], site.x, site.y + 12 / k, todo ? "#fde68a" : "#94a3b8", 4);
    });

    // Loot and foes (elites are gold diamonds, the boss a pulsing purple ring)
    (s.loot || []).forEach((it) => {
      const [x, y] = P(it.x, it.y);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(x - 1, y - 1, 2, 2);
    });
    (s.enemies || []).forEach((e) => {
      if (!e.isAlive) return;
      const [x, y] = P(e.x + 8, e.y + 8);
      if (e.boss) {
        ctx.strokeStyle = `rgba(192, 132, 252, ${0.5 + pulse * 0.5})`;
        ctx.beginPath(); ctx.arc(x, y, 4 + pulse * 2, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#c084fc";
        ctx.fillRect(x - 2, y - 2, 4, 4);
      } else if (e.elite) {
        ctx.fillStyle = "#030611";
        ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 3); ctx.lineTo(x - 3, y); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = e.champion ? "#60a5fa" : "#ef4444";
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
    });

    // NPCs (the quest objective blinks)
    (s.npcs || []).forEach((n) => {
      if (!n.visible) return;
      const [x, y] = P(n.x, n.y - 6);
      if (n.id === s.targetId) {
        ctx.strokeStyle = `rgba(255, 209, 102, ${0.4 + pulse * 0.6})`;
        ctx.beginPath(); ctx.arc(x, y, 4 + pulse * 2, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#ffd166";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        ctx.fillText("!", x, y - 6);
      }
      ctx.fillStyle = n.id === s.targetId ? "#ffd166" : "#e2e8f0";
      ctx.fillRect(x - 1, y - 1, 2.5, 2.5);
    });

    // Route: a marching dotted line from the hero to the objective (an NPC, a site, a gate)
    const target = (s.npcs || []).find((n) => n.id === s.targetId && n.visible);
    const goalPt = target ? { x: target.x, y: target.y - 6 } : s.objective;
    if (s.player && goalPt) {
      const [ax, ay] = P(s.player.x + 10, s.player.y + 16), [bx, by] = P(goalPt.x, goalPt.y);
      ctx.save();
      ctx.strokeStyle = "rgba(255, 209, 102, 0.8)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.lineDashOffset = -this.tick / 4;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      ctx.restore();
      if (!target) {
        ctx.strokeStyle = `rgba(255, 209, 102, ${0.4 + pulse * 0.6})`;
        ctx.beginPath(); ctx.arc(bx, by, 3 + pulse * 2, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // Player: a dot with a facing tick
    if (s.player) {
      const [x, y] = P(s.player.x + 10, s.player.y + 16);
      ctx.fillStyle = "#030611";
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#00f0ff";
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
      const fd = s.player.dir === "up" ? [0, -1] : s.player.dir === "down" ? [0, 1] : [s.player.facing === "left" ? -1 : 1, 0];
      ctx.fillStyle = "#e0f2fe";
      ctx.fillRect(Math.round(x + fd[0] * 4) - 1, Math.round(y + fd[1] * 4) - 1, 2, 2);
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.3 + pulse * 0.5})`;
      ctx.beginPath(); ctx.arc(x, y, 5 + pulse * 2, 0, Math.PI * 2); ctx.stroke();
    }

    // compass rose (lower left)
    {
      const ccx = vx + 14, ccy = vy + vh - 14;
      ctx.fillStyle = "rgba(3, 6, 17, 0.7)";
      ctx.beginPath(); ctx.arc(ccx, ccy, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255, 209, 102, 0.6)";
      ctx.beginPath(); ctx.arc(ccx, ccy, 9, 0, Math.PI * 2); ctx.stroke();
      [[0, -1, "#ffd166"], [0, 1, "#94a3b8"], [1, 0, "#94a3b8"], [-1, 0, "#94a3b8"]].forEach(([dx, dy, c]) => {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.moveTo(ccx + dx * 7, ccy + dy * 7); ctx.lineTo(ccx + dy * 2, ccy - dx * 2); ctx.lineTo(ccx - dy * 2, ccy + dx * 2); ctx.closePath(); ctx.fill();
      });
    }
    ctx.restore();   // end of the viewport clip
    drawBorder(ctx, vx, vy, vw, vh);

    // ---- Side panel (floats over the right of the map) ----
    if (this.panel) {
      const px0 = W - 6 - PANEL_W, py0 = vy + 4, ph = vh - 8;
      drawFrame(ctx, px0, py0, PANEL_W, ph, { fill: "rgba(13, 20, 36, 0.9)" });
      const rx = px0 + 7, rw = PANEL_W - 14;
      let y = py0 + 10;
      ctx.textAlign = "left";
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 5px monospace";
      ctx.fillText(tx("goal"), rx, y);
      y += 7;
      ctx.fillStyle = "#ffd166";
      wrap(ctx, s.act, rw).slice(0, 2).forEach((ln) => { ctx.fillText(ln, rx, y); y += 6; });
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "5px monospace";
      wrap(ctx, s.goal, rw).slice(0, 4).forEach((ln) => { ctx.fillText(ln, rx, y); y += 6; });

      // This map's open side quests
      y += 4;
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 5px monospace";
      ctx.fillText(tx("side"), rx, y);
      y += 7;
      const here = s.quest && s.quest.side ? s.quest.side.list.filter((q) => q.area === st.id && q.have < q.n) : [];
      ctx.font = "4.5px monospace";
      if (!here.length) { ctx.fillStyle = "#64748b"; ctx.fillText(tx("none"), rx, y); y += 6; }
      here.slice(0, 4).forEach((q) => {
        ctx.fillStyle = "#fbbf24";
        ctx.fillText("○", rx, y);
        ctx.fillStyle = "#cbd5e1";
        wrap(ctx, s.quest.side.text(q).replace(/ (in the|sa) .*?( \(|$)/, "$2"), rw - 6).slice(0, 2).forEach((ln) => { ctx.fillText(ln, rx + 6, y); y += 5.5; });
      });

      // Legend
      y += 4;
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 5px monospace";
      ctx.fillText(tx("legend"), rx, y);
      y += 7;
      const row = (color, text, shape = "sq") => {
        if (y > py0 + ph - 4) return;
        ctx.fillStyle = color;
        if (shape === "dot") { ctx.beginPath(); ctx.arc(rx + 2, y - 2, 2, 0, Math.PI * 2); ctx.fill(); }
        else if (shape === "dia") { ctx.beginPath(); ctx.moveTo(rx + 2, y - 5); ctx.lineTo(rx + 5, y - 2); ctx.lineTo(rx + 2, y + 1); ctx.lineTo(rx - 1, y - 2); ctx.closePath(); ctx.fill(); }
        else ctx.fillRect(rx, y - 4, 4, 4);
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "5px monospace";
        ctx.fillText(text, rx + 9, y);
        y += 7;
      };
      row("#00f0ff", tx("you"), "dot");
      row("#ffd166", tx("objective"));
      row("#e2e8f0", tx("npc"));
      row("#ef4444", tx("foe"));
      row("#f59e0b", tx("elite"), "dia");
      row("#22c55e", tx("loot"));
      row("#fde68a", tx("site"));
    }

    this.drawKeys(ctx, W, H, tx("keys"));
    ctx.restore();
  }

  // Key hints along the bottom edge
  drawKeys(ctx, W, H, keys) {
    let x = 7;
    keys.forEach(([key, what]) => {
      x += keyChip(ctx, x, H - 7, key, what, "#94a3b8") + 10;
    });
  }

  // Whole world: both continents, every land and frontier, roads, open side quests and Book II
  drawContinent(ctx, W, H, s) {
    const ease = openEase(this.openT = (this.openT || 0) + 1);
    ctx.save();
    drawBackdrop(ctx, W, H, ease, "3, 6, 17", 0.95);
    ctx.globalAlpha = ease;
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "left";
    ctx.fillText(tx("continent"), 6, 11);
    const vx = 6, vy = 16, vw = W - 12, vh = H - vy - 14;
    const mw = this.panel ? vw - PANEL_W - 4 : vw;
    const side = s.quest && s.quest.side ? s.quest.side.openByArea() : {};
    const lands = this.continent.draw(ctx, vx, vy, mw, vh, { ...s, sideOpen: side }, this.tick);
    drawBorder(ctx, vx, vy, mw, vh);

    if (this.panel) {
      const px0 = W - 6 - PANEL_W, py0 = vy + 4, ph = vh - 8;
      drawFrame(ctx, px0, py0, PANEL_W, ph, { fill: "rgba(13, 20, 36, 0.9)" });
      const rx = px0 + 7, rw = PANEL_W - 14;
      let y = py0 + 10;
      ctx.textAlign = "left";
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 5px monospace";
      ctx.fillText(tx("goal"), rx, y);
      y += 7;
      ctx.fillStyle = "#ffd166";
      wrap(ctx, s.act, rw).slice(0, 2).forEach((ln) => { ctx.fillText(ln, rx, y); y += 6; });
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "5px monospace";
      wrap(ctx, s.goal, rw).slice(0, 3).forEach((ln) => { ctx.fillText(ln, rx, y); y += 6; });
      y += 3;
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 5px monospace";
      ctx.fillText(tx("lands"), rx, y);
      y += 7;
      lands.forEach((l) => {
        if (y > py0 + ph - 3) return;
        ctx.fillStyle = l.open ? l.color : "#475569";
        ctx.fillRect(rx + (l.frontier ? 3 : 0), y - 4, 3, 3);
        ctx.font = "4.5px monospace";
        ctx.fillStyle = l.here ? "#00f0ff" : l.open ? "#cbd5e1" : "#64748b";
        const nm = l.name.length > 17 ? `${l.name.slice(0, 16)}…` : l.name;
        ctx.fillText(nm, rx + (l.frontier ? 8 : 5), y);
        ctx.textAlign = "right";
        ctx.fillStyle = l.side ? "#fbbf24" : !l.open ? "#64748b" : l.cleared ? "#4ade80" : "#94a3b8";
        const state = l.side ? `!${l.side}` : !l.open ? tx("sealed") : l.cleared ? tx("freed") : l.levels ? `${l.levels[0]}–${l.levels[1]}` : tx("open");
        ctx.fillText(state, rx + rw, y);
        ctx.textAlign = "left";
        y += 6;
      });
    }
    this.drawKeys(ctx, W, H, tx("keysC"));
    ctx.restore();
  }
}
