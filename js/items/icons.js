import { Pix, shade } from "../avatar/avatar.js";

// ==================== ITEM PIXEL ICONS (16x16) ====================
// Same style as the Avatar: pixel buffer + selective outline. Cached per (kind + colour).
// iconCanvas(item) → canvas (for the ground); iconURL(item) → data URL (for the bag in HTML).

const METAL = "#cbd5e1", METAL_D = "#7d8c9e", METAL_L = "#f1f5f9";
const WOOD = "#8a5a2b", WOOD_D = "#5e3b1a";
const GOLD = "#e0b44c", GOLD_D = "#a8782a";
const LEATHER = "#7a4f30", LEATHER_D = "#553520";

function line(p, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let k = 0; k <= n; k++) p.set(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), c);
}
function disc(p, cx, cy, r, c, cD, cL) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    if (x * x + y * y > r * r + r * 0.6) continue;
    p.set(cx + x, cy + y, x + y > r * 0.6 ? cD : x + y < -r * 0.6 ? cL : c);
  }
}

// Drawing per kind (t = tint)
const DRAW = {
  dagger(p) { line(p, 4, 12, 11, 5, METAL); line(p, 5, 12, 12, 5, METAL_D); p.set(12, 4, METAL_L); line(p, 2, 11, 5, 14, GOLD); p.rect(2, 13, 2, 2, LEATHER); },
  sword(p) { line(p, 3, 13, 12, 4, METAL); line(p, 4, 13, 13, 4, METAL_D); p.set(13, 3, METAL_L); line(p, 2, 10, 6, 14, GOLD); p.rect(1, 13, 3, 2, LEATHER); },
  greatsword(p) { for (let k = 0; k < 11; k++) { p.set(3 + k, 12 - k, METAL); p.set(4 + k, 12 - k, METAL); p.set(4 + k, 13 - k, METAL_D); } p.set(14, 1, METAL_L); line(p, 1, 10, 6, 15, GOLD); p.rect(0, 13, 3, 3, LEATHER); },
  lance(p) { line(p, 2, 14, 11, 5, WOOD); line(p, 3, 14, 12, 5, WOOD_D); p.rows([[2, 13, 14], [3, 12, 14], [4, 11, 13]], METAL); p.set(14, 1, METAL_L); p.rows([[6, 12, 13], [7, 13, 13]], "#c62f3a"); },
  staff(p) { line(p, 3, 15, 10, 5, WOOD); line(p, 4, 15, 11, 5, WOOD_D); disc(p, 11, 3, 2, "#5ee7ff", "#2a9fd0", "#ffffff"); },
  wand(p) { line(p, 4, 13, 10, 7, WOOD_D); line(p, 5, 13, 11, 7, WOOD); disc(p, 11, 5, 1, "#c084fc", "#7e22ce", "#ffffff"); p.set(13, 2, "#ffffff"); p.set(14, 5, "#ffffff"); },
  scepter(p) { line(p, 4, 14, 10, 6, GOLD); line(p, 5, 14, 11, 6, GOLD_D); disc(p, 11, 4, 2, "#e63946", "#9b1c24", "#ffc2cf"); p.set(11, 1, GOLD); },
  mace(p) { line(p, 3, 14, 9, 8, WOOD); disc(p, 10, 6, 3, METAL, METAL_D, METAL_L); [[10, 2], [14, 6], [10, 10], [6, 6]].forEach(([x, y]) => p.set(x, y, METAL_D)); },
  bow(p) { for (let k = 0; k < 13; k++) { const x = 4 + Math.round(Math.sin((k / 12) * Math.PI) * 6); p.set(x, 1 + k, k % 4 ? WOOD : WOOD_D); p.set(x + 1, 1 + k, WOOD_D); } line(p, 4, 1, 4, 13, "#e8e2d0"); },
  crossbow(p) { line(p, 2, 8, 13, 8, WOOD); line(p, 2, 9, 13, 9, WOOD_D); for (let k = -5; k <= 5; k++) p.set(11 + (Math.abs(k) > 3 ? -1 : 0), 8 + k, METAL); p.set(14, 8, METAL_L); p.rect(3, 10, 2, 3, WOOD_D); },
  claws(p) { [[3, 12, 12, 3], [5, 13, 14, 4]].forEach(([a, b, c2, d]) => { line(p, a, b, c2, d, METAL); }); p.rect(2, 12, 4, 3, LEATHER); p.rect(4, 13, 4, 2, LEATHER_D); p.set(12, 3, METAL_L); p.set(14, 4, METAL_L); },
  knuckle(p) { p.rect(3, 5, 10, 6, LEATHER); p.rect(3, 5, 10, 2, "#b45309"); [4, 7, 10].forEach((x) => p.rect(x, 4, 2, 2, METAL)); p.rect(3, 11, 6, 3, LEATHER_D); },
  buckler(p) { disc(p, 8, 8, 6, WOOD, WOOD_D, "#b07a45"); disc(p, 8, 8, 2, METAL, METAL_D, METAL_L); for (let k = 0; k < 360; k += 30) { const a = (k * Math.PI) / 180; p.set(8 + Math.round(Math.cos(a) * 6), 8 + Math.round(Math.sin(a) * 6), GOLD); } },
  tower(p, t) { for (let y = 1; y < 15; y++) { const w = y > 11 ? 5 - (y - 11) : 5; for (let x = 8 - w; x <= 7 + w; x++) p.set(x, y, x === 8 - w || x === 7 + w || y === 1 ? GOLD : x > 8 ? shade("#2c4f8a", -0.2) : "#2c4f8a"); } line(p, 7, 3, 7, 12, GOLD); line(p, 4, 6, 11, 6, GOLD); },
  book(p) { p.rect(3, 2, 10, 12, "#6b2b2b"); p.rect(3, 2, 2, 12, "#4a1c1c"); p.rect(12, 3, 1, 10, "#f5ecd7"); p.rect(6, 5, 4, 4, GOLD); p.set(7, 6, "#5ee7ff"); p.set(8, 7, "#5ee7ff"); },
  traps(p) { disc(p, 8, 10, 4, METAL_D, "#4b5563", METAL); for (let x = 3; x <= 13; x += 2) p.set(x, 5, METAL); line(p, 3, 6, 13, 6, METAL_D); p.rect(7, 1, 2, 4, LEATHER); },
  talisman(p) { p.rect(5, 2, 6, 12, "#f5ecd7"); p.rect(5, 2, 6, 1, "#c62f3a"); p.rect(5, 13, 6, 1, "#c62f3a"); line(p, 8, 4, 8, 11, "#c62f3a"); line(p, 6, 6, 10, 6, "#c62f3a"); line(p, 6, 9, 10, 9, "#c62f3a"); },
  bandana(p) { for (let x = 2; x < 14; x++) for (let y = 5; y < 9; y++) p.set(x, y, (x + y) % 4 ? "#c62f3a" : "#f5ecd7"); p.rows([[9, 11, 13], [10, 12, 14], [11, 13, 14]], "#9b1c24"); },
  helm(p) { for (let y = 3; y < 13; y++) { const w = y < 6 ? 3 + (y - 3) : 6; for (let x = 8 - w; x <= 7 + w; x++) p.set(x, y, x > 9 ? METAL_D : METAL); } p.rect(3, 8, 10, 1, "#1e293b"); line(p, 8, 1, 8, 3, "#c62f3a"); p.set(7, 2, "#c62f3a"); },
  hat(p) { p.rect(1, 12, 14, 2, "#3b1f5c"); for (let y = 3; y < 12; y++) { const w = Math.round((y - 2) * 0.55); for (let x = 8 - w; x <= 8 + w; x++) p.set(x, y, x > 8 ? "#4c2a78" : "#5a3d91"); } p.rect(4, 10, 9, 1, GOLD); line(p, 8, 3, 11, 1, "#5a3d91"); },
  circlet(p) { for (let x = 2; x < 14; x++) p.set(x, 9 + (Math.abs(x - 8) > 4 ? -1 : 0), GOLD); p.rect(2, 10, 12, 1, GOLD_D); disc(p, 8, 7, 1, "#5ee7ff", "#2a9fd0", "#ffffff"); p.set(4, 8, GOLD); p.set(11, 8, GOLD); },
  bunny(p) { p.rect(2, 11, 12, 2, "#f1f5f9"); [[4, 2], [10, 2]].forEach(([x]) => { p.rect(x, 2, 3, 9, "#f1f5f9"); p.rect(x + 1, 3, 1, 7, "#f9a8d4"); }); },
  tunic(p) { for (let y = 3; y < 14; y++) for (let x = 3; x < 13; x++) if (!(y < 6 && x > 5 && x < 10)) p.set(x, y, x > 9 ? LEATHER_D : LEATHER); p.rect(3, 9, 10, 1, "#3a2616"); p.set(8, 9, GOLD); p.rect(1, 4, 2, 5, LEATHER); p.rect(13, 4, 2, 5, LEATHER_D); },
  mail(p) { for (let y = 3; y < 14; y++) for (let x = 3; x < 13; x++) if (!(y < 5 && x > 5 && x < 10)) p.set(x, y, (x + y) % 2 ? METAL : METAL_D); p.rect(1, 4, 2, 5, METAL_D); p.rect(13, 4, 2, 5, METAL_D); },
  plate(p) { for (let y = 3; y < 14; y++) for (let x = 3; x < 13; x++) if (!(y < 5 && x > 5 && x < 10)) p.set(x, y, x > 9 ? METAL_D : x < 5 ? METAL_L : METAL); p.rect(0, 3, 4, 3, METAL_L); p.rect(12, 3, 4, 3, METAL_D); line(p, 8, 5, 8, 13, GOLD); },
  robe(p) { for (let y = 2; y < 15; y++) { const w = 3 + Math.floor(y / 4); for (let x = 8 - w; x <= 7 + w; x++) if (!(y < 4 && Math.abs(x - 8) < 2)) p.set(x, y, x > 9 ? "#4c2a78" : "#5a3d91"); } line(p, 8, 4, 8, 14, GOLD); },
  cloak(p) { for (let y = 2; y < 15; y++) { const w = 2 + Math.floor(y / 2.5); for (let x = 8 - w; x <= 7 + w; x++) p.set(x, y, x > 9 ? "#5a1a1a" : "#8a2c2c"); } p.rect(6, 2, 4, 2, GOLD); },
  gloves(p) { p.rect(4, 5, 7, 8, LEATHER); p.rect(4, 5, 7, 2, "#b45309"); [4, 6, 8].forEach((x) => p.rect(x, 2, 2, 3, LEATHER)); p.rect(11, 7, 2, 4, LEATHER_D); },
  gauntlet(p) { p.rect(4, 5, 7, 8, METAL); p.rect(4, 11, 7, 2, METAL_D); [4, 6, 8].forEach((x) => p.rect(x, 2, 2, 3, METAL_D)); p.rect(11, 7, 2, 4, METAL_D); p.set(5, 6, METAL_L); },
  boots(p) { p.rect(4, 2, 5, 10, LEATHER); p.rect(4, 11, 9, 3, LEATHER_D); p.rect(4, 2, 5, 2, "#b45309"); },
  greaves(p) { p.rect(4, 2, 5, 10, METAL); p.rect(4, 11, 9, 3, METAL_D); p.rect(4, 5, 5, 1, METAL_D); p.set(5, 3, METAL_L); },
  amulet(p) { for (let k = 0; k < 9; k++) { p.set(3 + k, 2 + Math.round(Math.sin((k / 8) * Math.PI) * 5), GOLD); } disc(p, 8, 10, 2, "#e63946", "#9b1c24", "#ffc2cf"); },
  brooch(p) { disc(p, 8, 8, 5, GOLD, GOLD_D, "#fde68a"); disc(p, 8, 8, 2, "#2a9d8f", "#134e4a", "#a8e6cf"); },
  ring(p) { for (let a = 0; a < 360; a += 20) { const r = (a * Math.PI) / 180; p.set(8 + Math.round(Math.cos(r) * 4), 9 + Math.round(Math.sin(r) * 4), GOLD); } disc(p, 8, 4, 2, "#5ee7ff", "#2a9fd0", "#ffffff"); },
  earring(p) { line(p, 8, 2, 8, 6, GOLD); disc(p, 8, 9, 3, "#c084fc", "#7e22ce", "#f5d0fe"); },
  rosary(p) { for (let a = 0; a < 360; a += 30) { const r = (a * Math.PI) / 180; p.set(8 + Math.round(Math.cos(r) * 5), 6 + Math.round(Math.sin(r) * 4), "#e8e2d0"); } line(p, 8, 10, 8, 15, GOLD); line(p, 6, 12, 10, 12, GOLD); },
  potion(p, t) { p.rect(6, 2, 4, 2, WOOD); p.rect(7, 4, 2, 2, "#e2e8f0"); disc(p, 8, 10, 4, t, shade(t, -0.35), shade(t, 0.5)); p.set(6, 8, "#ffffff"); },
  herb(p) { line(p, 8, 14, 8, 6, "#2d6a4f"); [[5, 4], [11, 5], [6, 9], [11, 10]].forEach(([x, y]) => disc(p, x, y, 2, "#52b788", "#2d6a4f", "#b7e4c7")); },
  shard(p, t) { for (let y = 2; y < 14; y++) { const w = y < 8 ? Math.floor((y - 1) / 2) : Math.floor((14 - y) / 2); for (let x = 8 - w; x <= 8 + w; x++) p.set(x, y, x > 8 ? shade(t, -0.3) : x < 8 ? shade(t, 0.35) : t); } },
  ore(p, t) { disc(p, 8, 9, 5, t, shade(t, -0.35), shade(t, 0.4)); p.set(6, 7, "#ffffff"); p.set(10, 11, shade(t, -0.5)); },
  crystal(p, t) { [[5, 12, 6], [9, 13, 5], [7, 14, 10]].forEach(([x, bot, h]) => { for (let y = bot - h; y <= bot; y++) { p.set(x, y, t); p.set(x + 1, y, shade(t, -0.3)); } p.set(x, bot - h - 1, "#ffffff"); }); },
  card(p, t) { p.rect(3, 1, 10, 14, "#f5ecd7"); p.rect(3, 1, 10, 2, t); p.rect(4, 4, 8, 6, "#1e293b"); disc(p, 8, 7, 2, t, shade(t, -0.4), "#ffffff"); p.rect(4, 11, 8, 1, "#94a3b8"); p.rect(4, 13, 6, 1, "#94a3b8"); },
  heart(p, t) { disc(p, 6, 6, 3, t, shade(t, -0.35), shade(t, 0.5)); disc(p, 10, 6, 3, t, shade(t, -0.35), shade(t, 0.5)); for (let y = 7; y < 14; y++) for (let x = 3 + (y - 7); x <= 13 - (y - 7); x++) p.set(x, y, x > 8 ? shade(t, -0.25) : t); p.set(5, 5, "#ffffff"); },
  shell(p, t) { for (let y = 4; y < 13; y++) { const w = Math.round((y - 3) * 0.7); for (let x = 8 - w; x <= 8 + w; x++) p.set(x, y, (x + 8) % 3 === 0 ? shade(t, -0.35) : t); } p.rect(6, 13, 5, 1, shade(t, -0.4)); },
  crest(p, t) { disc(p, 8, 8, 6, t, shade(t, -0.35), shade(t, 0.4)); line(p, 5, 5, 11, 11, "#8a2c2c"); line(p, 11, 5, 5, 11, "#8a2c2c"); disc(p, 8, 8, 1, "#ffffff", "#e2e8f0", "#ffffff"); },
  // crafting materials and cooking (js/items/craftsets.js, js/items/cooking.js)
  core(p, t) { disc(p, 8, 8, 5, shade(t, -0.25), shade(t, -0.5), t); disc(p, 8, 8, 2, "#ffffff", t, "#ffffff"); [[8, 1], [8, 15], [1, 8], [15, 8]].forEach(([x, y]) => p.set(x, y, t)); },
  essence(p, t) { p.rect(7, 1, 2, 2, "#e2e8f0"); p.rect(6, 3, 4, 1, WOOD); for (let y = 4; y < 15; y++) { const w = y < 7 ? 1 : y < 13 ? 3 : 2; for (let x = 8 - w; x < 8 + w; x++) p.set(x, y, y > 8 ? t : "#cbd5e1"); } p.set(6, 10, "#ffffff"); p.set(9, 12, shade(t, -0.4)); },
  fish(p, t) { for (let x = 3; x < 13; x++) { const h = Math.round(Math.sin(((x - 2) / 10) * Math.PI) * 3); for (let y = 8 - h; y <= 8 + h; y++) p.set(x, y, y > 8 ? shade(t, -0.3) : y < 8 ? shade(t, 0.3) : t); } [[13, 5], [13, 6], [14, 5], [13, 10], [13, 11], [14, 11], [13, 8]].forEach(([x, y]) => p.set(x, y, shade(t, -0.2))); p.set(4, 7, "#0f172a"); },
  meat(p, t) { disc(p, 7, 7, 5, t, shade(t, -0.35), shade(t, 0.3)); disc(p, 7, 7, 2, "#fca5a5", t, "#fecaca"); line(p, 10, 10, 14, 14, "#f5f5f4"); p.set(14, 13, "#f5f5f4"); p.set(13, 14, "#f5f5f4"); },
  spice(p, t) { line(p, 4, 14, 9, 4, "#84cc16"); line(p, 9, 14, 12, 6, t); disc(p, 11, 5, 2, "#dc2626", "#991b1b", "#f87171"); disc(p, 5, 11, 2, "#ca8a04", "#a16207", "#fde047"); },
  salt(p, t) { [[5, 10, 3], [10, 9, 3], [8, 5, 2]].forEach(([x, y, r]) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r + Math.abs(dy); dx <= r - Math.abs(dy); dx++) p.set(x + dx, y + dy, dx + dy > 0 ? "#cbd5e1" : t); }); },
  dish(p, t) { for (let x = 2; x < 14; x++) p.set(x, 9, "#e2e8f0"); for (let y = 10; y < 14; y++) for (let x = 3 + (y - 10); x < 13 - (y - 10); x++) p.set(x, y, y === 10 ? "#f8fafc" : "#94a3b8"); disc(p, 8, 7, 4, t, shade(t, -0.3), shade(t, 0.4)); [[6, 2], [9, 1], [11, 3]].forEach(([x, y]) => p.set(x, y, "#f1f5f9")); },
  ash(p, t) { [[5, 10], [8, 7], [11, 10], [7, 12], [10, 5]].forEach(([x, y], k) => disc(p, x, y, k % 2 ? 1 : 2, t, shade(t, -0.3), "#ffffff")); }
};

const cache = new Map();

function build(icon, tint) {
  const p = new Pix(16, 16);
  (DRAW[icon] || DRAW.ore)(p, tint || "#94a3b8");
  p.outline();
  return p.toCanvas();
}

export function iconCanvas(item) {
  if (!item) return null;
  const key = `${item.icon}|${item.tint || ""}`;
  if (!cache.has(key)) cache.set(key, { canvas: build(item.icon, item.tint), url: null });
  return cache.get(key).canvas;
}

export function iconURL(item) {
  const c = iconCanvas(item);
  const entry = cache.get(`${item.icon}|${item.tint || ""}`);
  if (!entry.url) entry.url = c.toDataURL ? c.toDataURL() : "";
  return entry.url;
}
