// ==================== CANVAS UI FRAME ====================
// One look for every in-canvas panel (world map, pause, shop, mercenary guild, game over):
// a dark slate panel with a gold double border, diamond studs at the corners and an
// optional title ribbon. Coordinates are game pixels (480×270).

const GOLD = "#c9a227", GOLD_L = "#ffd166", RIM = "#030611";

// Dims the world behind a panel; k (0–1) fades it in
export function drawBackdrop(ctx, W, H, k = 1, color = "3, 6, 17", alpha = 0.82) {
  ctx.fillStyle = `rgba(${color}, ${alpha * k})`;
  ctx.fillRect(0, 0, W, H);
}

function stud(ctx, x, y, c = GOLD_L) {
  ctx.fillStyle = RIM;
  ctx.beginPath(); ctx.moveTo(x, y - 3.5); ctx.lineTo(x + 3.5, y); ctx.lineTo(x, y + 3.5); ctx.lineTo(x - 3.5, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = c;
  ctx.beginPath(); ctx.moveTo(x, y - 2.5); ctx.lineTo(x + 2.5, y); ctx.lineTo(x, y + 2.5); ctx.lineTo(x - 2.5, y); ctx.closePath(); ctx.fill();
}

// Border only (for framing a map or picture): dark rim, gold line, studs
export function drawBorder(ctx, x, y, w, h, accent = GOLD) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = RIM;
  ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
  ctx.strokeStyle = accent;
  ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
  [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([sx, sy]) => stud(ctx, sx, sy));
  ctx.restore();
}

// Full panel. opts: { title, accent, fill, k (open animation 0–1) }
export function drawFrame(ctx, x, y, w, h, opts = {}) {
  const k = opts.k === undefined ? 1 : opts.k;
  const accent = opts.accent || GOLD;
  ctx.save();
  if (k < 1) {
    // grows from its centre while it opens
    const s = 0.92 + 0.08 * k;
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(s, s);
    ctx.translate(-(x + w / 2), -(y + h / 2));
    ctx.globalAlpha = k;
  }
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  // drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(x + 3, y + 4, w, h);
  // body: slate with a lighter top band
  ctx.fillStyle = opts.fill || "#0d1424";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(148, 163, 184, 0.06)";
  ctx.fillRect(x, y, w, Math.min(18, h / 4));
  // borders: dark rim, gold, inner hairline
  ctx.lineWidth = 1;
  ctx.strokeStyle = RIM;
  ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
  ctx.strokeStyle = accent;
  ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
  ctx.strokeStyle = "rgba(255, 209, 102, 0.22)";
  ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
  [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([sx, sy]) => stud(ctx, sx, sy));
  if (opts.title) {
    // ribbon across the top edge
    ctx.font = "bold 7px monospace";
    const tw = Math.round(ctx.measureText(opts.title).width + 16);
    const rx = Math.round(x + w / 2 - tw / 2), ry = y - 6;
    ctx.fillStyle = RIM;
    ctx.fillRect(rx - 1, ry - 1, tw + 2, 13);
    ctx.fillStyle = "#3b2a0e";
    ctx.fillRect(rx, ry, tw, 11);
    ctx.fillStyle = "rgba(255, 209, 102, 0.18)";
    ctx.fillRect(rx, ry, tw, 4);
    ctx.strokeStyle = accent;
    ctx.strokeRect(rx + 0.5, ry + 0.5, tw - 1, 10);
    ctx.fillStyle = GOLD_L;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.title, x + w / 2, ry + 6);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
}

// Ease for an opening panel: frames since it opened → 0–1
export const openEase = (frames, length = 10) => {
  const t = Math.min(1, Math.max(0, frames / length));
  return 1 - (1 - t) * (1 - t);
};

// A key hint chip: "[ESC] Resume" style, returns its width
export function keyChip(ctx, x, y, key, label, color = "#e2e8f0") {
  ctx.save();
  ctx.font = "bold 6px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const kw = Math.round(ctx.measureText(key).width + 6);
  ctx.fillStyle = RIM;
  ctx.fillRect(x - 1, y - 5, kw + 2, 10);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(x, y - 4, kw, 8);
  ctx.strokeStyle = GOLD;
  ctx.strokeRect(x + 0.5, y - 3.5, kw - 1, 7);
  ctx.fillStyle = GOLD_L;
  ctx.fillText(key, x + 3, y + 0.5);
  ctx.font = "6px monospace";
  ctx.fillStyle = color;
  ctx.fillText(label, x + kw + 4, y + 0.5);
  const w = kw + 4 + ctx.measureText(label).width;
  ctx.restore();
  return w;
}
