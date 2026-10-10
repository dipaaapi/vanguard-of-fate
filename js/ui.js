import { formatCoins } from "./items/economy.js";
import { getLang, t } from "./i18n.js";
import { getItem } from "./items/itemdb.js";
import { iconCanvas } from "./items/icons.js";
import { STATUS, STATUS_KEYS } from "./status.js";
import { drawBackdrop, drawFrame, drawBorder, openEase, keyChip } from "./uiframe.js";

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];

// The current Act's banner (assets/banner/act-N.png), loaded on first use, for the pause and game over panels
const banners = new Map();
function bannerOf(act) {
  if (!act) return null;
  if (!banners.has(act)) { const img = new Image(); img.src = `assets/banner/act-${act}.png`; banners.set(act, img); }
  const img = banners.get(act);
  return img.complete && img.naturalWidth ? img : null;
}
// A centred crop of an image into a box (object-fit: cover)
function cover(ctx, img, x, y, w, h, focusY = 0.45) {
  const k = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / k, sh = h / k;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, Math.max(0, Math.min(img.naturalHeight - sh, img.naturalHeight * focusY - sh / 2)), sw, sh, x, y, w, h);
}

// Edgar the Apothecary's wares (go into the bag)
const SHOP = ["salve", "panacea", "tonic", "elixir"];

export class UIManager {
  constructor() {
    this.buttons = {
      pause: { x: 406, y: 7, w: 14, h: 14 }
    };
    this.unlockBanners = [];   // queued celebration banners (showUnlockBanner), shown one at a time
  }

  // ==================== UNLOCK BANNER ====================
  // A centred celebration card for level-ups, Legendary/Mythic drops and awakenings: it pops in with
  // an ease-out bounce (0.3 s), holds (1.2 s), then drifts up and fades (0.5 s). Banners that arrive
  // together queue instead of stacking; the queue keeps at most three waiting.
  showUnlockBanner(rarity = "LEGENDARY", title = "", subtitle = "") {
    if (this.unlockBanners.length >= 4) this.unlockBanners.splice(1, 1);
    this.unlockBanners.push({ rarity, title, subtitle, start: 0 });
  }

  drawUnlockBanner(ctx, W, H) {
    const b = this.unlockBanners[0];
    if (!b) return;
    const now = performance.now();
    if (!b.start) b.start = now;
    const t = (now - b.start) / 1000;
    const IN = 0.3, HOLD = 1.2, OUT = 0.5;
    if (t >= IN + HOLD + OUT) { this.unlockBanners.shift(); return; }

    // easeOutBack: overshoots a little, then settles at full size
    const easeOutBack = (k) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
    const scale = t < IN ? Math.max(0.01, easeOutBack(t / IN)) : 1;
    const out = t > IN + HOLD ? (t - IN - HOLD) / OUT : 0;
    const alpha = 1 - out;
    const mythic = b.rarity === "MYTHIC";
    const accent = mythic ? `hsl(${(now / 8) % 360}, 90%, 72%)` : "#ffd166";

    const bw = 230, bh = 42, cx = W / 2, cy = Math.round(H * 0.27 - out * 18);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // panel with a pulsing glow behind the border
    const pulse = 0.6 + 0.4 * Math.sin(t * 9);
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10 * pulse;
    ctx.fillStyle = "rgba(10, 8, 20, 0.86)";
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.shadowBlur = 0;
    // ribbon fade across the panel
    const rib = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    rib.addColorStop(0, "rgba(255, 209, 102, 0)");
    rib.addColorStop(0.5, `rgba(255, 209, 102, ${0.18 * pulse})`);
    rib.addColorStop(1, "rgba(255, 209, 102, 0)");
    ctx.fillStyle = rib;
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    drawBorder(ctx, -bw / 2, -bh / 2, bw, bh, mythic ? accent : "#ffd166");
    // a light sweep that runs across the border once while it holds
    const sweep = (t - IN) / HOLD;
    if (sweep > 0 && sweep < 1) {
      const sx = -bw / 2 + sweep * bw;
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillRect(Math.round(sx), -bh / 2 - 1, 6, 1);
      ctx.fillRect(Math.round(-sx - 6), bh / 2, 6, 1);
    }

    // bold retro title with a dual-tone drop shadow
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 14px monospace";
    const ty = b.subtitle ? -6 : 0;
    ctx.fillStyle = "#2a0a3d"; ctx.fillText(b.title, 2, ty + 2);
    ctx.fillStyle = "#b45309"; ctx.fillText(b.title, 1, ty + 1);
    const tg = ctx.createLinearGradient(0, ty - 7, 0, ty + 7);
    tg.addColorStop(0, "#ffffff");
    tg.addColorStop(0.55, mythic ? accent : "#ffd166");
    tg.addColorStop(1, "#f59e0b");
    ctx.fillStyle = tg;
    ctx.fillText(b.title, 0, ty);

    if (b.subtitle) {
      ctx.font = "bold 7px monospace";
      ctx.fillStyle = "#000000"; ctx.fillText(b.subtitle, 1, 12);
      ctx.fillStyle = "#fff3d6"; ctx.fillText(b.subtitle, 0, 11);
    }
    ctx.restore();
  }

  // Terrain thumbnail of a place at 1/8 scale, built once per place (ground + tree canopy)
  terrainOf(stage) {
    if (!this.terrain) this.terrain = new Map();
    const key = stage.id || "hub";
    if (!this.terrain.has(key) && stage.tilemap && stage.tilemap.groundCanvas) {
      const c = document.createElement("canvas");
      c.width = Math.ceil(stage.width / 8);
      c.height = Math.ceil(stage.height / 8);
      const g = c.getContext("2d");
      g.imageSmoothingEnabled = true;
      g.save();
      g.scale(c.width / stage.width, c.height / stage.height);
      stage.tilemap.paintMap(g);   // ground, trees and stones, edge canopy
      g.restore();
      // a touch darker so the markers stand out
      g.fillStyle = "rgba(6, 10, 24, 0.28)";
      g.fillRect(0, 0, c.width, c.height);
      this.terrain.set(key, c);
    }
    return this.terrain.get(key) || null;
  }

  // Live minimap: a window of the terrain around the hero with foes, loot, allies, gateways, the
  // quest objective (pinned to the edge when it is out of view) and the hero's heading.
  // Drawn in the right panel's World Map box (main.js drawSideMap passes extra.rect); without a
  // rect it draws at the top right of the game screen.
  // extra: { objective: {x, y}, npcs: [...], placeName, night, rect: { X, Y, W, H, view } }
  drawHUD(ctx, player, enemyManager, lootManager, stage, screenWidth, isPaused, timeOfDay, weatherType, isInBarracks, extra = {}) {
    if (!player || !stage) return;
    const R = extra.rect;
    const W = R ? R.W : 76, H = R ? R.H : 56;
    const X = R ? R.X : screenWidth - W - 6, Y = R ? R.Y : 7;
    const VIEW = Math.min(stage.width, R && R.view ? R.view : 640);   // world pixels across the window
    const k = W / VIEW;
    const cx = player.x + 10, cy = player.y + 12;
    // window origin in world space, kept inside the map
    const ox = Math.max(0, Math.min(stage.width - VIEW, cx - VIEW / 2));
    const oy = Math.max(0, Math.min(stage.height - H / k, cy - H / k / 2));
    const M = (wx, wy) => [X + (wx - ox) * k, Y + (wy - oy) * k];
    const t = performance.now() / 1000;

    ctx.save();
    // frame: dark rim, gold line, corner studs
    ctx.fillStyle = "#030611";
    ctx.fillRect(X - 2, Y - 2, W + 4, H + 4);
    ctx.beginPath();
    ctx.rect(X, Y, W, H);
    ctx.clip();
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(X, Y, W, H);
    const terr = this.terrainOf(stage);
    if (terr) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(terr, ox / 8, oy / 8, VIEW / 8, H / k / 8, X, Y, W, H);
      ctx.imageSmoothingEnabled = false;
    }
    if (extra.night) { ctx.fillStyle = `rgba(5, 8, 30, ${0.35 * extra.night})`; ctx.fillRect(X, Y, W, H); }

    // sanctuaries
    ctx.fillStyle = "rgba(255, 209, 102, 0.25)";
    ctx.strokeStyle = "rgba(255, 209, 102, 0.7)";
    ctx.lineWidth = 0.5;
    (stage.safeZones || (stage.safeZone ? [stage.safeZone] : [])).forEach((z) => {
      const [zx, zy] = M(z.x, z.y);
      ctx.fillRect(zx, zy, z.w * k, z.h * k);
      ctx.strokeRect(zx + 0.25, zy + 0.25, z.w * k - 0.5, z.h * k - 0.5);
    });
    // gateways: the hub's four Warp Gateways or a platform's Return Gateway
    const gates = stage.portals && stage.portals.portals ? stage.portals.portals : stage.gate ? [stage.gate] : [];
    gates.forEach((g) => {
      const [gx, gy] = M(g.x, g.y);
      ctx.fillStyle = g.color || "#ffd166";
      ctx.globalAlpha = 0.6 + Math.sin(t * 3 + gx) * 0.3;
      ctx.fillRect(gx - 1.5, gy - 1.5, 3, 3);
      ctx.globalAlpha = 1;
    });
    // allies
    ctx.fillStyle = "#e2e8f0";
    (extra.npcs || []).forEach((n) => { const [nx, ny] = M(n.x + 10, n.y + 12); ctx.fillRect(nx - 0.5, ny - 0.5, 1.5, 1.5); });
    // loot
    if (lootManager && lootManager.items) {
      lootManager.items.forEach((it) => {
        const [lx, ly] = M(it.x, it.y);
        ctx.fillStyle = it.quest ? "#ffd166" : "#4ade80";
        ctx.fillRect(lx - 0.5, ly - 0.5, it.quest ? 2 : 1.5, it.quest ? 2 : 1.5);
      });
    }
    // foes (a boss is a pulsing purple diamond)
    if (enemyManager) {
      enemyManager.enemies.forEach((e) => {
        if (!e.isAlive) return;
        const [ex, ey] = M(e.x + 10, e.y + 12);
        if (e.boss) {
          const r = 2.5 + Math.sin(t * 5) * 0.8;
          ctx.fillStyle = "#c084fc";
          ctx.beginPath(); ctx.moveTo(ex, ey - r); ctx.lineTo(ex + r, ey); ctx.lineTo(ex, ey + r); ctx.lineTo(ex - r, ey); ctx.closePath(); ctx.fill();
        } else {
          ctx.fillStyle = e.elite || e.champion ? "#fb923c" : "#ef4444";
          ctx.fillRect(ex - 0.75, ey - 0.75, 1.75, 1.75);
        }
      });
    }
    // quest objective: a gold diamond, pinned to the edge (with a pointer) when out of view
    const obj = extra.objective;
    if (obj) {
      let [qx, qy] = M(obj.x, obj.y);
      const inside = qx > X + 3 && qx < X + W - 3 && qy > Y + 3 && qy < Y + H - 3;
      qx = Math.max(X + 3, Math.min(X + W - 3, qx));
      qy = Math.max(Y + 3, Math.min(Y + H - 3, qy));
      const r = inside ? 2.5 + Math.sin(t * 4) * 0.7 : 2;
      ctx.fillStyle = "#030611";
      ctx.beginPath(); ctx.moveTo(qx, qy - r - 1); ctx.lineTo(qx + r + 1, qy); ctx.lineTo(qx, qy + r + 1); ctx.lineTo(qx - r - 1, qy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ffd166";
      ctx.beginPath(); ctx.moveTo(qx, qy - r); ctx.lineTo(qx + r, qy); ctx.lineTo(qx, qy + r); ctx.lineTo(qx - r, qy); ctx.closePath(); ctx.fill();
    }
    // the hero: a cyan arrow pointing where they aim
    const [hx, hy] = M(cx, cy);
    const a = Number.isFinite(player.aimAngle) ? player.aimAngle : (player.facing === "left" ? Math.PI : 0);
    ctx.translate(hx, hy);
    ctx.rotate(a);
    ctx.fillStyle = "#030611";
    ctx.beginPath(); ctx.moveTo(4.5, 0); ctx.lineTo(-3, -3.2); ctx.lineTo(-1.5, 0); ctx.lineTo(-3, 3.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#5ee7ff";
    ctx.beginPath(); ctx.moveTo(3.5, 0); ctx.lineTo(-2.2, -2.3); ctx.lineTo(-1, 0); ctx.lineTo(-2.2, 2.3); ctx.closePath(); ctx.fill();
    ctx.restore();

    // gold border, corner studs and the compass N
    ctx.save();
    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 1;
    ctx.strokeRect(X - 0.5, Y - 0.5, W + 1, H + 1);
    ctx.fillStyle = "#ffd166";
    [[X - 2, Y - 2], [X + W - 1, Y - 2], [X - 2, Y + H - 1], [X + W - 1, Y + H - 1]].forEach(([sx, sy]) => ctx.fillRect(sx, sy, 3, 3));
    ctx.font = "bold 5px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#030611";
    ctx.fillRect(X + W / 2 - 3, Y - 4, 6, 6);
    ctx.fillStyle = "#ffd166";
    ctx.fillText("N", X + W / 2, Y - 0.5);
    // place name under the map
    if (extra.placeName) {
      ctx.font = "bold 4px monospace";
      const label = extra.placeName.toUpperCase();
      const tw = Math.min(W + 4, ctx.measureText(label).width + 6);
      ctx.fillStyle = "rgba(3, 6, 17, 0.85)";
      ctx.fillRect(X + W / 2 - tw / 2, Y + H + 2, tw, 7);
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(label, X + W / 2, Y + H + 5.8, W + 2);
    }
    ctx.restore();
  }

  // Layer 7 (js/world/layers.js): a soft vignette along the screen's edges. One cached image; only
  // its four border bands are drawn, so it costs a fraction of a full-screen fill.
  drawScreenOverlay(ctx, w, h) {
    const b = Math.round(h * 0.18);
    if (!this.vignette || this.vignette.width !== w || this.vignette.height !== h) {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const g = c.getContext("2d");
      if (!g || !g.createLinearGradient) return;
      const band = (x0, y0, x1, y1, rx, ry, rw, rh) => {
        const gr = g.createLinearGradient(x0, y0, x1, y1);
        gr.addColorStop(0, "rgba(5, 7, 12, 0.3)");
        gr.addColorStop(1, "rgba(5, 7, 12, 0)");
        g.fillStyle = gr;
        g.fillRect(rx, ry, rw, rh);
      };
      band(0, 0, 0, b, 0, 0, w, b);
      band(0, h, 0, h - b, 0, h - b, w, b);
      band(0, 0, b, 0, 0, 0, b, h);
      band(w, 0, w - b, 0, w - b, 0, b, h);
      this.vignette = c;
    }
    const v = this.vignette;
    ctx.drawImage(v, 0, 0, w, b, 0, 0, w, b);
    ctx.drawImage(v, 0, h - b, w, b, 0, h - b, w, b);
    ctx.drawImage(v, 0, b, b, h - 2 * b, 0, b, b, h - 2 * b);
    ctx.drawImage(v, w - b, b, b, h - 2 * b, w - b, b, b, h - 2 * b);
  }

  drawInWorldUI(ctx, player) {
    if (!player) return;

    // Overhead Cooldown Bar
    if (player.skillCooldownTimer > 0 && player.heroData.cooldown) {
      const barW = 16;
      const progress = (player.skillCooldownTimer / player.heroData.cooldown) * barW;
      ctx.fillStyle = "#111";
      ctx.fillRect(player.x + 2, player.y - 7, barW, 2);
      ctx.fillStyle = "#00f0ff";
      ctx.fillRect(player.x + 2, player.y - 7, barW - progress, 2);
    }

    // Stamina under the feet (shown only when not full); "TIRED" when empty
    if (player.stamina < player.maxStamina) {
      const w = 16;
      ctx.fillStyle = "rgba(17, 17, 17, 0.8)";
      ctx.fillRect(player.x + 2, player.y + 25, w, 1.5);
      ctx.fillStyle = player.exhausted ? "#ef4444" : "#facc15";
      ctx.fillRect(player.x + 2, player.y + 25, (player.stamina / player.maxStamina) * w, 1.5);
      if (player.exhausted) {
        ctx.font = "bold 4px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ef4444";
        ctx.fillText(getLang() === "fil" ? "PAGOD" : "EXHAUSTED", player.x + 10, player.y + 31);
      }
    }

    // A coloured dot above the head for each active blight
    const active = STATUS_KEYS.filter((k) => player.debuffs[k] > 0);
    active.forEach((k, i) => {
      ctx.fillStyle = "#030611";
      ctx.fillRect(player.x + 10 - active.length * 2.5 + i * 5 - 0.5, player.y - 17.5, 4, 4);
      ctx.fillStyle = STATUS[k].color;
      ctx.fillRect(player.x + 10 - active.length * 2.5 + i * 5, player.y - 17, 3, 3);
    });
    if (player.paralyzed) {
      ctx.font = "bold 5px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#facc15";
      ctx.fillText("⚡ STUN", player.x + 10, player.y - 20);
    }

    // Archer Arrow Dots
    if (player.heroData.id === "archer" && player.arrowCount !== undefined) {
      const dotY = player.y - 11;
      const n = player.maxArrows || 6;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = i < player.arrowCount ? "#52b788" : "#444";
        ctx.fillRect(player.x + 10 - (n * 3 - 1) / 2 + i * 3, dotY, 2, 2.5);
      }
    }
  }

  // Panels count frames since they opened, for the open animation
  opened(key) {
    if (this.openKey !== key) { this.openKey = key; this.openT = 0; }
    return openEase(++this.openT);
  }

  // Pause: the current Act's banner, the Act name and the keys. info: { act, actTitle }
  drawPause(ctx, W, H, info = {}) {
    const k = this.opened("pause");
    drawBackdrop(ctx, W, H, k);
    const bw = 220, bh = 132, bx = Math.round(W / 2 - bw / 2), by = Math.round(H / 2 - bh / 2);
    drawFrame(ctx, bx, by, bw, bh, { title: t("pauseTitle"), k });
    ctx.save();
    ctx.globalAlpha = k;
    const img = bannerOf(info.act);
    const ix = bx + 8, iy = by + 12, iw = bw - 16, ih = 56;
    if (img) {
      cover(ctx, img, ix, iy, iw, ih);
      const g = ctx.createLinearGradient(0, iy + ih * 0.45, 0, iy + ih);
      g.addColorStop(0, "rgba(13, 20, 36, 0)");
      g.addColorStop(1, "rgba(13, 20, 36, 0.95)");
      ctx.fillStyle = g;
      ctx.fillRect(ix, iy, iw, ih);
    } else {
      ctx.fillStyle = "#111a2e";
      ctx.fillRect(ix, iy, iw, ih);
    }
    drawBorder(ctx, ix, iy, iw, ih);
    ctx.textAlign = "center";
    if (info.actTitle) {
      ctx.font = "bold 6px monospace";
      ctx.fillStyle = "#ffd166";
      ctx.fillText(info.actTitle, W / 2, iy + ih - 5, iw - 8);
    }
    const ky = iy + ih + 14;
    keyChip(ctx, bx + 20, ky, "ESC", t("pauseResume"), "#7dd3fc");
    keyChip(ctx, bx + 20, ky + 13, "H", t("pauseMenu"), "#fca5a5");
    keyChip(ctx, bx + 20, ky + 26, "X", t("pauseExport"), "#fde68a");
    ctx.font = "5px monospace";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    ctx.fillText(t("pauseSaved"), W / 2, by + bh - 5);
    ctx.restore();
  }

  // Edgar the Apothecary: four wares with their icons, price, what they do and how many you carry
  drawShopModal(ctx, player, W, H) {
    const k = this.opened("shop");
    drawBackdrop(ctx, W, H, k, "3, 6, 17", 0.6);
    const bw = 250, bh = 136, bx = Math.round(W / 2 - bw / 2), by = Math.round(H / 2 - bh / 2);
    drawFrame(ctx, bx, by, bw, bh, { title: t("shopTitle"), k });
    ctx.save();
    ctx.globalAlpha = k;
    SHOP.forEach((id, i) => {
      const it = getItem(id);
      const have = player.bag ? player.bag.count(id) : 0;
      const afford = player.gold >= it.price;
      const ry = by + 14 + i * 26;
      ctx.fillStyle = i % 2 ? "rgba(148, 163, 184, 0.05)" : "rgba(148, 163, 184, 0.09)";
      ctx.fillRect(bx + 8, ry, bw - 16, 23);
      if (i === (this.shopSel || 0)) {   // pad / arrow cursor
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 8.5, ry + 0.5, bw - 17, 22);
      }
      // key, icon, name and effect
      keyChip(ctx, bx + 12, ry + 11.5, String(i + 1), "");
      const ic = iconCanvas(it);
      if (ic) { ctx.fillStyle = "#030611"; ctx.fillRect(bx + 28, ry + 2, 19, 19); ctx.drawImage(ic, bx + 29, ry + 3, 17, 17); }
      ctx.textAlign = "left";
      ctx.font = "bold 6px monospace";
      ctx.fillStyle = afford ? "#f8fafc" : "#64748b";
      ctx.fillText(it.name, bx + 52, ry + 9);
      ctx.font = "5px monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(it.desc || "", bx + 52, ry + 17, 130);
      ctx.textAlign = "right";
      ctx.font = "bold 6px monospace";
      ctx.fillStyle = afford ? "#ffd166" : "#ef4444";
      ctx.fillText(`${formatCoins(it.price)}`, bx + bw - 14, ry + 9);
      ctx.font = "5px monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(t("shopOwned", have), bx + bw - 14, ry + 17);
    });
    ctx.textAlign = "left";
    ctx.font = "bold 6px monospace";
    ctx.fillStyle = "#ffd166";
    ctx.fillText(`🪙 ${formatCoins(player.gold)}`, bx + 12, by + bh - 5);
    ctx.textAlign = "right";
    ctx.font = "5px monospace";
    ctx.fillStyle = "#64748b";
    ctx.fillText(`${t("shopNote")} · 1-4 / ↑↓ Enter ${t("shopBuy")} · ESC ${t("close")}`, bx + bw - 10, by + bh - 5);
    ctx.restore();
  }

  // Mercenary Guild: four cards with the mercenary's portrait, skills and passive. mercs: [{ key, data }]
  drawMercModal(ctx, player, W, H, mercs, cost) {
    const k = this.opened("merc");
    drawBackdrop(ctx, W, H, k, "3, 6, 17", 0.6);
    const bw = 300, bh = 142, bx = Math.round(W / 2 - bw / 2), by = Math.round(H / 2 - bh / 2);
    drawFrame(ctx, bx, by, bw, bh, { title: t("mercTitle"), k });
    ctx.save();
    ctx.globalAlpha = k;
    const L = getLang() === "fil" ? "fil" : "en";
    const cw = (bw - 16 - 9) / 4;
    mercs.forEach(({ data, sprite }, i) => {
      const cx = Math.round(bx + 8 + i * (cw + 3)), cy = by + 12;
      ctx.fillStyle = "rgba(148, 163, 184, 0.08)";
      ctx.fillRect(cx, cy, cw, 100);
      if (i === (this.mercSel || 0)) {   // pad / arrow cursor
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 1;
        ctx.strokeRect(cx + 0.5, cy + 0.5, cw - 1, 99);
      }
      ctx.fillStyle = data.color || "#ffd166";
      ctx.fillRect(cx, cy, cw, 2);
      // portrait on a small spotlight
      const g = ctx.createRadialGradient(cx + cw / 2, cy + 30, 2, cx + cw / 2, cy + 30, 26);
      g.addColorStop(0, "rgba(255, 209, 102, 0.25)");
      g.addColorStop(1, "rgba(255, 209, 102, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx, cy + 4, cw, 48);
      if (sprite) sprite.draw(ctx, cx + cw / 2, cy + 46, "down", "idle", Math.floor(this.openT / 12), false, false, 1);
      keyChip(ctx, cx + 3, cy + 9, String(i + 1), "");
      ctx.textAlign = "center";
      ctx.font = "bold 6px monospace";
      ctx.fillStyle = "#f8fafc";
      ctx.fillText(data.name, cx + cw / 2, cy + 58, cw - 4);
      ctx.font = "5px monospace";
      let ly = cy + 68;
      (data.skills || []).forEach((sk) => {
        ctx.fillStyle = "#7dd3fc";
        ctx.fillText(`✦ ${sk.name[L]}`, cx + cw / 2, ly, cw - 4);
        ly += 8;
      });
      if (data.passive) {
        const [name, ...rest] = data.passive[L].split(":");
        ctx.fillStyle = "#fde68a";
        ctx.fillText(name, cx + cw / 2, ly, cw - 4);
        ctx.fillStyle = "#94a3b8";
        const text = rest.join(":").trim();
        // wrap the passive's effect into two short lines
        const words = text.split(" "); let line = ""; let n = 0;
        for (const w of words) {
          if (ctx.measureText(`${line} ${w}`).width > cw - 6 && line) { ctx.fillText(line, cx + cw / 2, ly + 8 + n * 7); line = w; n++; if (n > 2) break; }
          else line = line ? `${line} ${w}` : w;
        }
        if (n <= 2 && line) ctx.fillText(line, cx + cw / 2, ly + 8 + n * 7);
      }
    });
    const afford = player.gold >= cost;
    ctx.textAlign = "left";
    ctx.font = "bold 6px monospace";
    ctx.fillStyle = afford ? "#ffd166" : "#ef4444";
    ctx.fillText(`🪙 ${formatCoins(player.gold)} · ${t("mercCost", formatCoins(cost))}`, bx + 10, by + bh - 14);
    ctx.font = "5px monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(t("mercScale", player.level), bx + 10, by + bh - 6);
    ctx.textAlign = "right";
    ctx.fillStyle = "#64748b";
    ctx.fillText(`1-4 / ←→ Enter ${t("mercHire")} · ESC ${t("close")}`, bx + bw - 10, by + bh - 6);
    ctx.restore();
  }

  buyShopItem(index, player, fx) {
    if (!player) return;
    const id = SHOP[Number(index) - 1];
    const it = id && getItem(id);
    if (!it) return;
    const pop = (text, color) => fx && fx.spawnDamagePopup && fx.spawnDamagePopup(player.x + 10, player.y - 6, text, false, color);
    if (player.gold < it.price) { pop(getLang() === "fil" ? "KULANG ANG GINTO!" : "NOT ENOUGH GOLD!", "#ef4444"); return; }
    if (!player.bag.add(id, 1)) { pop("BAG FULL!", "#ef4444"); return; }
    player.gold -= it.price;
    pop(`+ ${it.name}`, "#4ade80");
  }

  // Game over: the world fades to deep red over the current Act's banner. info: { act, level }
  drawGameOver(ctx, W, H, info = {}) {
    const k = this.opened("over");
    const fade = Math.min(1, this.openT / 50);
    ctx.save();
    ctx.fillStyle = `rgba(8, 0, 4, ${0.55 + 0.35 * fade})`;
    ctx.fillRect(0, 0, W, H);
    const img = bannerOf(info.act);
    if (img) {
      ctx.globalAlpha = 0.28 * fade;
      cover(ctx, img, 0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(90, 0, 10, ${0.45 * fade})`;
      ctx.fillRect(0, 0, W, H);
    }
    const vg = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.6);
    vg.addColorStop(0, "rgba(0, 0, 0, 0)");
    vg.addColorStop(1, `rgba(0, 0, 0, ${0.8 * fade})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    // the title drops in and settles
    const drop = (1 - k) * -12;
    ctx.textAlign = "center";
    ctx.font = "bold 18px monospace";
    ctx.fillStyle = "#1a0005";
    ctx.fillText(t("overTitle"), W / 2 + 1, H / 2 - 12 + drop + 1);
    ctx.fillStyle = "#ef4444";
    ctx.fillText(t("overTitle"), W / 2, H / 2 - 12 + drop);
    ctx.fillStyle = "rgba(252, 165, 165, 0.5)";
    ctx.fillRect(W / 2 - 70 * k, H / 2 - 4, 140 * k, 1);
    ctx.globalAlpha = fade;
    ctx.font = "6px monospace";
    ctx.fillStyle = "#fecaca";
    ctx.fillText(t("overLine"), W / 2, H / 2 + 8);
    if (info.level) {
      ctx.font = "bold 6px monospace";
      ctx.fillStyle = "#fca5a5";
      ctx.fillText(t("overStats", info.level, ROMAN[info.act] || info.act || "I"), W / 2, H / 2 + 19);
    }
    if (this.openT > 40) {
      ctx.globalAlpha = 0.6 + Math.sin(this.openT / 10) * 0.4;
      ctx.font = "bold 6px monospace";
      const label = t("overRestart");
      const w = ctx.measureText(label).width + 22;
      keyChip(ctx, Math.round(W / 2 - w / 2), H / 2 + 38, "ENTER", label, "#ffd166");
    }
    ctx.restore();
  }
}