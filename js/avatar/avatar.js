import { normalizeConfig } from "./options.js";

// ==================== MODULAR AVATAR RENDERER ====================
// Ang karakter ay binubuo mula sa magkakahiwalay na bahagi (layer):
//   kapa → buhok sa likod → binti → paa → katawan/kasuotan → braso/kamay → hawak
//   → ulo → mukha → balbas/salamin → buhok sa harap → headgear
// Bawat bahagi ay may sariling estilo at kulay; ang anino/liwanag ay kinukuha sa base color,
// at ang outline ay awtomatikong idinadagdag (selective outline). Isang beses lang nire-render
// bawat frame at naka-cache bilang canvas — mabilis i-drawImage sa laro.
//
// Frame: 32x36 (mga 2 tile ang taas sa 16px na tile). Anchor = gitna ng paa (16, 34).
// Direksyon: down (harap), up (likod), side (nakaharap pakanan; i-flip para pakaliwa).
//
// Dagdag na piyesa para sa mga NPC (hindi nasa Character Creator):
//   outfit: gown | armor | coat      headgear: crown | tiara | helmet | headband
//   cape: kulay ng kapa              beard / glasses: true      ears: "elf"
//   weapon: novice | staff | lance | scepter | bow | sword | flask | book | none

export const FRAME_W = 32;
export const FRAME_H = 36;
export const ANCHOR_X = 16;
export const ANCHOR_Y = 34;
export const DIRS = ["down", "side", "up"];
export const FRAMES = { idle: 2, walk: 4, attack: 2 };

// ---------- KULAY ----------
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
// Anino: papunta sa malamig na lila; liwanag: papunta sa mainit na krema (hue shift, mas buhay)
export function shade(hex, amt) {
  return amt < 0 ? mix(hex, "#1a1030", -amt) : mix(hex, "#fff4d6", amt);
}

const FIXED = {
  shirt: "#e8e2d0",
  belt: "#3a2616",
  buckle: "#e0b44c",
  metal: "#dbe4ee",
  metalD: "#8a99ab",
  wood: "#8a5a2b",
  woodD: "#5e3b1a",
  gold: "#e0b44c",
  goldD: "#a8782a",
  tie: "#d94f4f",
  white: "#ffffff",
  blush: "#ff8a9a",
  steel: "#b5c4d4",
  steelD: "#7d8c9e",
  steelL: "#e3ebf3",
  crystal: "#5ee7ff",
  crystalD: "#2a9fd0",
  gem: "#e63946",
  plume: "#c62f3a",
  frame: "#2b2b33",
  glass: "#7fdc8f",
  glassD: "#3f9a55",
  book: "#6b2b2b"
};

function palette(cfg) {
  const glove = cfg.gloves === "leather" ? "#6b4a2b" : cfg.gloves === "wraps" ? "#e8e2d0" : cfg.skin;
  const c = {
    ...FIXED,
    skin: cfg.skin, skinD: shade(cfg.skin, -0.22), skinDD: shade(cfg.skin, -0.4),
    hair: cfg.hairColor, hairD: shade(cfg.hairColor, -0.32), hairL: shade(cfg.hairColor, 0.3),
    eye: cfg.eyes, eyeD: shade(cfg.eyes, -0.35), lash: "#1b1b2f",
    cloth: cfg.outfitColor, clothD: shade(cfg.outfitColor, -0.28), clothL: shade(cfg.outfitColor, 0.22),
    legs: cfg.legColor, legsD: shade(cfg.legColor, -0.28), legsDD: shade(cfg.legColor, -0.45),
    boot: cfg.bootColor, bootD: shade(cfg.bootColor, -0.35), bootL: shade(cfg.bootColor, 0.25),
    glove, gloveD: shade(glove, -0.25),
    shirtD: shade(FIXED.shirt, -0.2),
    cape: cfg.cape || "#8a2c2c", capeD: shade(cfg.cape || "#8a2c2c", -0.3), capeL: shade(cfg.cape || "#8a2c2c", 0.18),
    tabard: cfg.outfitColor
  };
  // Baluti: bakal ang katawan at manggas; ang outfitColor ay nagiging tabard sa gitna
  if (cfg.outfit === "armor") {
    c.cloth = FIXED.steel;
    c.clothD = FIXED.steelD;
    c.clothL = FIXED.steelL;
  }
  return c;
}

// ---------- PIXEL BUFFER ----------
class Pix {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Array(w * h).fill(null);
  }
  set(x, y, c) {
    if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c;
  }
  get(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.d[y * this.w + x] : null;
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  // Hilera: [y, x0, x1] (kasama ang x1)
  rows(list, c, dy = 0) {
    list.forEach(([y, x0, x1]) => { for (let x = x0; x <= x1; x++) this.set(x, y + dy, c); });
  }
  // Selective outline: bawat bakanteng pixel na katabi ng kulay ay nagiging mas madilim na bersyon nito
  outline() {
    const src = this.d.slice();
    const at = (x, y) => (x >= 0 && y >= 0 && x < this.w && y < this.h ? src[y * this.w + x] : null);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (src[y * this.w + x]) continue;
        const n = at(x, y - 1) || at(x, y + 1) || at(x - 1, y) || at(x + 1, y);
        if (n) this.d[y * this.w + x] = shade(n, -0.62);
      }
    }
  }
  toCanvas() {
    const c = document.createElement("canvas");
    c.width = this.w;
    c.height = this.h;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(this.w, this.h);
    this.d.forEach((col, i) => {
      if (!col) return;
      const [r, g, b] = hexToRgb(col);
      img.data.set([r, g, b, 255], i * 4);
    });
    ctx.putImageData(img, 0, 0);
    return c;
  }
}

// ---------- GALAW (gait) ----------
function gait(anim, i) {
  if (anim === "walk") {
    return [
      { bob: 0, lLift: 0, rLift: 1, lArm: 1, rArm: -1, stride: 1 },
      { bob: 1, lLift: 0, rLift: 0, lArm: 0, rArm: 0, stride: 0 },
      { bob: 0, lLift: 1, rLift: 0, lArm: -1, rArm: 1, stride: -1 },
      { bob: 1, lLift: 0, rLift: 0, lArm: 0, rArm: 0, stride: 0 }
    ][i % 4];
  }
  const base = { bob: 0, lLift: 0, rLift: 0, lArm: 0, rArm: 0, stride: 0 };
  if (anim === "idle") return { ...base, bob: i % 2 };
  if (anim === "attack") return { ...base, attack: (i % 2) + 1 };
  return base;
}

// ==================== MGA BAHAGI ====================

// ---- PAA at BINTI ----
function footHeight(style) {
  return style === "boots" ? 5 : 2;
}

function drawFoot(p, c, cfg, x, bottom, w, dark) {
  const h = footHeight(cfg.boots);
  const top = bottom - h + 1;
  if (cfg.boots === "sandals") {
    p.rect(x, top, w, h, dark ? c.skinD : c.skin);
    p.rect(x, top, w, 1, dark ? c.bootD : c.boot);        // strap
    p.rect(x, bottom, w, 1, c.bootD);                       // suwelas
    return top;
  }
  p.rect(x, top, w, h, dark ? c.bootD : c.boot);
  if (h > 2) p.rect(x, top, w, 1, dark ? c.boot : c.bootL); // tupi ng bota
  p.rect(x, bottom, w, 1, dark ? shade(c.boot, -0.5) : c.bootD);
  return top;
}

// Kulay ng binti sa isang hilera (pantalon / shorts / balat)
function legColorAt(c, cfg, y, dark) {
  if (cfg.legs === "pants") return dark ? c.legsD : c.legs;
  if (cfg.legs === "shorts" && y <= 27) return dark ? c.legsD : c.legs;
  return dark ? c.skinD : c.skin;
}

function drawLegFront(p, c, cfg, x0, lift) {
  const bottom = 34 - lift;
  const footTop = bottom - footHeight(cfg.boots) + 1;
  for (let y = 24; y < footTop; y++) {
    p.set(x0, y, legColorAt(c, cfg, y, false));
    p.set(x0 + 1, y, legColorAt(c, cfg, y, false));
    p.set(x0 + 2, y, legColorAt(c, cfg, y, true));
  }
  drawFoot(p, c, cfg, x0 - (x0 < 16 ? 1 : 0), bottom, 4, false);
}

function drawLegSide(p, c, cfg, x0, lift, dark) {
  const bottom = 34 - lift;
  const footTop = bottom - footHeight(cfg.boots) + 1;
  for (let y = 24; y < footTop; y++) {
    p.set(x0, y, legColorAt(c, cfg, y, true));
    p.set(x0 + 1, y, legColorAt(c, cfg, y, dark));
    p.set(x0 + 2, y, legColorAt(c, cfg, y, dark));
  }
  drawFoot(p, c, cfg, x0, bottom, 5, dark);  // mas mahaba pasulong ang paa
}

// ---- PALDA / ROBE / GOWN / COAT (ibabang bahagi ng kasuotan) ----
function drawSkirt(p, c, cfg, dy, side) {
  const col = c.legs, colD = c.legsD;
  const rows = side
    ? [[24, 11, 20], [25, 11, 20], [26, 10, 21], [27, 10, 21], [28, 10, 21]]
    : [[24, 11, 20], [25, 10, 21], [26, 10, 21], [27, 9, 22], [28, 9, 22]];
  rows.forEach(([y, x0, x1]) => {
    for (let x = x0; x <= x1; x++) p.set(x, y + dy, (x - x0) % 3 === 2 ? colD : col); // mga tupi
  });
}

function drawRobeSkirt(p, c, dy, side, trim) {
  const rows = side
    ? [[24, 11, 20], [25, 11, 20], [26, 10, 20], [27, 10, 21], [28, 10, 21], [29, 10, 21]]
    : [[24, 11, 20], [25, 10, 21], [26, 10, 21], [27, 10, 21], [28, 9, 22], [29, 9, 22]];
  rows.forEach(([y, x0, x1]) => {
    for (let x = x0; x <= x1; x++) p.set(x, y + dy, x >= x1 - 1 ? c.clothD : c.cloth);
  });
  if (trim) for (let y = 24; y <= 29; y++) { p.set(15, y + dy, c.clothL); p.set(16, y + dy, c.clothL); }
  rows.forEach(([y, x0, x1]) => { if (y === 29) for (let x = x0; x <= x1; x++) p.set(x, y + dy, c.clothD); });
}

// Mahabang gown hanggang paa, may gintong laylayan
function drawGownSkirt(p, c, dy, side) {
  const rows = side
    ? [[24, 11, 20], [25, 11, 20], [26, 10, 21], [27, 10, 21], [28, 10, 22], [29, 9, 22], [30, 9, 22], [31, 9, 23], [32, 9, 23], [33, 9, 23]]
    : [[24, 11, 20], [25, 10, 21], [26, 10, 21], [27, 9, 22], [28, 9, 22], [29, 8, 23], [30, 8, 23], [31, 8, 23], [32, 7, 24], [33, 7, 24]];
  rows.forEach(([y, x0, x1]) => {
    for (let x = x0; x <= x1; x++) {
      let col = (x - x0) % 4 === 3 ? c.clothD : c.cloth;          // mga tupi
      if (x >= x1 - 1) col = c.clothD;
      if (x === x0 + 1 && y > 25) col = c.clothL;
      p.set(x, y + (y >= 33 ? 0 : dy), col);
    }
  });
  const hem = rows[rows.length - 1];
  for (let x = hem[1]; x <= hem[2]; x++) p.set(x, hem[0], x % 2 ? c.gold : c.goldD);
}

// Mga buntot ng coat (hati sa gitna, kita ang binti)
function drawCoatTails(p, c, dy, side) {
  if (side) {
    for (let y = 24; y <= 29; y++) for (let x = 10; x <= 14 - (y > 27 ? 1 : 0); x++) p.set(x, y + dy, x <= 11 ? c.clothD : c.cloth);
    return;
  }
  for (let y = 24; y <= 29; y++) {
    for (let x = 10; x <= 13; x++) p.set(x, y + dy, x === 10 ? c.clothL : c.cloth);
    for (let x = 18; x <= 21; x++) p.set(x, y + dy, x >= 20 ? c.clothD : c.cloth);
    p.set(14, y + dy, c.gold); p.set(17, y + dy, c.gold);
  }
  for (let x = 10; x <= 21; x++) if (x < 14 || x > 17) p.set(x, 29 + dy, c.gold);
}

// ---- KAPA (sa likod ng katawan sa harap/gilid; sa ibabaw ng likod kapag nakatalikod) ----
function drawCape(p, c, dy, view) {
  if (view === "down") {
    for (let y = 15; y <= 30; y++) {
      const spread = y > 24 ? 1 : 0;
      for (let x = 9 - spread; x <= 22 + spread; x++) p.set(x, y + dy, x >= 20 ? c.capeD : c.cape);
    }
  } else if (view === "side") {
    for (let y = 15; y <= 30; y++) {
      const back = y > 22 ? 2 : y > 18 ? 1 : 0;
      for (let x = 10 - back; x <= 13; x++) p.set(x, y + dy, x <= 10 - back + 1 ? c.capeD : c.cape);
    }
  } else {
    for (let y = 15; y <= 31; y++) {
      const spread = y > 24 ? 1 : 0;
      for (let x = 9 - spread; x <= 22 + spread; x++) {
        let col = x >= 20 ? c.capeD : c.cape;
        if ((x === 12 || x === 18) && y > 18) col = c.capeD;  // mga tupi
        if (x === 10 && y < 26) col = c.capeL;
        p.set(x, y + dy, col);
      }
    }
    p.rows([[15, 10, 21]], c.capeD, dy);
  }
}

// ---- KATAWAN (torso) ----
function torsoRows(cfg, side) {
  const female = cfg.body === "female";
  if (side) {
    return female
      ? [[15, 12, 19], [16, 12, 19], [17, 12, 20], [18, 12, 20], [19, 12, 19], [20, 12, 19], [21, 12, 19], [22, 12, 19], [23, 12, 19]]
      : [[15, 12, 19], [16, 12, 19], [17, 12, 19], [18, 12, 19], [19, 12, 19], [20, 12, 19], [21, 12, 19], [22, 12, 19], [23, 12, 19]];
  }
  return female
    ? [[15, 11, 20], [16, 11, 20], [17, 11, 20], [18, 11, 20], [19, 12, 19], [20, 12, 19], [21, 11, 20], [22, 11, 20], [23, 11, 20]]
    : [[15, 10, 21], [16, 10, 21], [17, 11, 20], [18, 11, 20], [19, 11, 20], [20, 11, 20], [21, 11, 20], [22, 11, 20], [23, 11, 20]];
}

function drawTorso(p, c, cfg, dy, view) {
  const side = view === "side";
  const back = view === "up";
  const rows = torsoRows(cfg, side);

  rows.forEach(([y, x0, x1]) => {
    for (let x = x0; x <= x1; x++) {
      let col = c.cloth;
      if (cfg.outfit === "vest" && !back) {
        // Bukas na tsaleko: kamiseta sa gitna (harap) o sa harapang bahagi (gilid)
        const open = side ? x >= x1 - 2 : x >= 14 && x <= 17;
        if (open) col = x === (side ? x1 : 17) ? c.shirtD : c.shirt;
      }
      if (x >= x1 - 1 && col === c.cloth) col = c.clothD;       // anino sa kanan
      if (x === x0 && col === c.cloth && y >= 16 && y <= 19) col = c.clothL;
      p.set(x, y + dy, col);
    }
  });

  // Baluti: pauldron sa balikat at tabard sa gitna
  if (cfg.outfit === "armor") {
    if (!side) {
      p.rows([[15, rows[0][1] - 1, rows[0][1] + 2], [16, rows[0][1] - 1, rows[0][1] + 2]], c.steelL, dy);
      p.rows([[15, rows[0][2] - 2, rows[0][2] + 1], [16, rows[0][2] - 2, rows[0][2] + 1]], c.steelD, dy);
      if (!back) for (let y = 17; y <= 23; y++) for (let x = 14; x <= 17; x++) p.set(x, y + dy, x === 17 ? shade(c.tabard, -0.3) : c.tabard);
    } else {
      p.rows([[15, 13, 17], [16, 13, 17]], c.steelL, dy);
      for (let y = 17; y <= 23; y++) { p.set(18, y + dy, c.tabard); p.set(19, y + dy, shade(c.tabard, -0.3)); }
    }
  }

  // Leeg + neckline (harap lang)
  if (view === "down") {
    if (cfg.outfit === "tunic") {
      p.rows([[15, 14, 17], [16, 15, 16]], c.skin, dy);
    } else if (cfg.outfit === "robe") {
      p.rows([[15, 15, 16]], c.skin, dy);
      for (let y = 16; y <= 23; y++) { p.set(15, y + dy, c.clothL); p.set(16, y + dy, c.clothL); }
    } else if (cfg.outfit === "gown") {
      p.rows([[15, 13, 18], [16, 14, 17]], c.skin, dy);
      p.rows([[17, 13, 18]], c.gold, dy);
    } else if (cfg.outfit === "coat") {
      p.rows([[15, 14, 17]], c.shirt, dy);
      for (let y = 15; y <= 23; y++) { p.set(15, y + dy, c.gold); p.set(16, y + dy, y % 2 ? c.gold : c.goldD); }
    }
  }

  // Sinturon
  const beltY = 21 + dy;
  const plainBelt = cfg.outfit === "robe" || cfg.outfit === "gown";
  rows.forEach(([y, x0, x1]) => {
    if (y + dy !== beltY) return;
    for (let x = x0; x <= x1; x++) p.set(x, beltY, cfg.outfit === "gown" ? c.gold : plainBelt ? c.clothD : c.belt);
    if (view === "down" && !plainBelt) { p.set(15, beltY, c.buckle); p.set(16, beltY, c.buckle); }
    if (side && !plainBelt) p.set(x1 - 1, beltY, c.buckle);
  });

  // Laylayan ng tunic/baluti (natatakpan ang itaas ng binti)
  if (cfg.outfit === "tunic" || cfg.outfit === "armor") {
    const hem = side ? [[24, 12, 19]] : [[24, 11, 20]];
    hem.forEach(([y, x0, x1]) => { for (let x = x0; x <= x1; x++) p.set(x, y + dy, x >= x1 - 1 ? c.clothD : c.cloth); });
  }
}

// Balakang (nagdudugtong sa dalawang binti)
function drawPelvis(p, c, cfg, side) {
  if (cfg.legs === "skirt") return;
  const [x0, x1] = side ? [13, 18] : [12, 19];
  for (let x = x0; x <= x1; x++) p.set(x, 24, x >= x1 - 1 ? c.legsD : c.legs);
}

// ---- BRASO at KAMAY ----
function sleeveColor(c, cfg, rowFromShoulder, dark) {
  if (cfg.outfit === "robe" || cfg.outfit === "gown" || cfg.outfit === "coat" || cfg.outfit === "armor") {
    if (cfg.outfit === "coat" && rowFromShoulder >= 5) return c.gold;          // gintong puños
    return dark ? c.clothD : c.cloth;
  }
  if (cfg.outfit === "vest") return dark ? c.shirtD : c.shirt;
  if (rowFromShoulder <= 2) return dark ? c.clothD : c.cloth;   // maikling manggas ng tunic
  return dark ? c.skinD : c.skin;
}

// Braso sa harap/likod na view: patayong 2px na kolum
function drawArmFront(p, c, cfg, x, dy, swing, outerDark) {
  const top = 16 + dy;
  for (let r = 0; r < 7; r++) {
    const y = top + r + (r >= 4 ? swing : 0);
    p.set(x, y, sleeveColor(c, cfg, r, outerDark === 0));
    p.set(x + 1, y, sleeveColor(c, cfg, r, outerDark === 1));
    if ((cfg.outfit === "robe" || cfg.outfit === "gown") && r >= 5) p.set(outerDark === 0 ? x - 1 : x + 2, y, c.clothD); // maluwang na manggas
  }
  const hy = top + 7 + swing;
  p.rect(x, hy, 2, 2, c.glove);
  p.set(outerDark === 1 ? x + 1 : x, hy + 1, c.gloveD);
  return { hx: x, hy };
}

// Braso sa gilid na view: umuugoy pasulong/paatras
function drawArmSide(p, c, cfg, dy, swing, dark) {
  const top = 16 + dy;
  const x = 15;
  for (let r = 0; r < 7; r++) {
    const off = r >= 3 ? swing : 0;
    p.set(x + off, top + r, sleeveColor(c, cfg, r, dark));
    p.set(x + 1 + off, top + r, sleeveColor(c, cfg, r, dark));
  }
  const hx = x + swing;
  const hy = top + 7;
  p.rect(hx, hy, 2, 2, dark ? c.gloveD : c.glove);
  return { hx, hy };
}

// ---- MGA HAWAK ----
function drawBuckler(p, c, cx, cy) {
  const mask = [
    "..###..",
    ".#ooo#.",
    "#ooooo#",
    "#oo*oo#",
    "#ooooo#",
    ".#ooo#.",
    "..###.."
  ];
  mask.forEach((row, j) => row.split("").forEach((ch, i) => {
    const x = cx - 3 + i, y = cy - 3 + j;
    if (ch === "#") p.set(x, y, c.gold);
    else if (ch === "o") p.set(x, y, i >= 4 ? c.woodD : c.wood);
    else if (ch === "*") p.set(x, y, c.metal);
  }));
}

// Punyal/espada: dir = "down" | "up" | "right"
function drawBlade(p, c, x, y, dir, len = 4) {
  if (dir === "right") {
    p.set(x, y, c.woodD);
    p.set(x + 1, y - 1, c.gold); p.set(x + 1, y, c.gold); p.set(x + 1, y + 1, c.gold);
    for (let i = 0; i < len; i++) p.set(x + 2 + i, y, i === len - 1 ? c.white : c.metal);
    return;
  }
  const s = dir === "down" ? 1 : -1;
  p.set(x, y, c.woodD);
  p.set(x - 1, y + s, c.gold); p.set(x, y + s, c.gold); p.set(x + 1, y + s, c.gold);
  for (let i = 0; i < len; i++) p.set(x, y + s * (2 + i), i === len - 1 ? c.white : c.metal);
}

// Patayong hawakan (staff / lance / scepter) na dumadaan sa kamay; hindi tinatakpan ang kamay
function drawPole(p, c, x, top, bottom, hand, col, colD) {
  for (let y = top; y <= bottom; y++) {
    if (hand && y >= hand.hy && y <= hand.hy + 1) continue;
    p.set(x, y, y % 5 === 0 ? colD : col);
  }
}

function drawHeld(p, c, cfg, view, weapon, shield, g) {
  const held = cfg.weapon || "none";
  const up = view === "up";

  if (held === "novice") {
    if (view === "side") {
      if (g.attack === 2) drawBlade(p, c, 23, 18 + g.bob, "right", 5);
      else if (g.attack === 1) drawBlade(p, c, weapon.hx, weapon.hy - 1, "up", 4);
      else drawBlade(p, c, weapon.hx + 1, weapon.hy + 1, "down", 4);
      return;
    }
    if (g.attack === 1) drawBlade(p, c, weapon.hx + 1, weapon.hy - 1, "up", 4);
    else drawBlade(p, c, weapon.hx + 1, weapon.hy + 1, "down", g.attack === 2 ? 6 : 4);
    drawBuckler(p, c, shield.hx + (shield.hx < 16 ? -1 : 2), shield.hy - 3);
    return;
  }

  const x = weapon.hx + (view === "side" ? 1 : weapon.hx < 16 ? 0 : 1);
  if (held === "staff") {
    drawPole(p, c, x, 9, 33, weapon, c.wood, c.woodD);
    p.rows([[6, x, x], [7, x - 1, x + 1], [8, x, x]], c.crystal);
    p.set(x, 7, c.white);
    p.set(x + 1, 7, c.crystalD);
  } else if (held === "lance") {
    drawPole(p, c, x, 4, 33, weapon, c.woodD, c.belt);
    p.rows([[0, x, x], [1, x, x + 1], [2, x - 1, x + 1], [3, x - 1, x + 1]], c.metal);
    p.set(x - 1, 3, c.metalD);
    if (!up) p.rows([[5, x + 1, x + 3], [6, x + 1, x + 2], [7, x + 1, x + 1]], c.plume);   // bandila
  } else if (held === "scepter") {
    drawPole(p, c, x, weapon.hy - 6, weapon.hy + 3, weapon, c.gold, c.goldD);
    p.rows([[weapon.hy - 8, x, x + 1], [weapon.hy - 7, x, x + 1]], c.gem);
    p.set(x, weapon.hy - 8, c.white);
  } else if (held === "sword") {
    drawBlade(p, c, weapon.hx + 1, weapon.hy + 1, "down", 7);
  } else if (held === "flask") {
    const fx = weapon.hx, fy = weapon.hy + 2;
    p.set(fx, fy, c.wood);
    p.rect(fx - 1, fy + 1, 3, 3, c.glass);
    p.set(fx + 1, fy + 2, c.glassD); p.set(fx + 1, fy + 3, c.glassD);
    p.set(fx - 1, fy + 1, c.white);
  } else if (held === "book") {
    const bx = shield.hx + (shield.hx < 16 ? -3 : 1), by = shield.hy - 3;
    p.rect(bx, by, 4, 5, c.book);
    p.rect(bx, by, 4, 1, c.gold);
    p.set(bx + 3, by + 2, c.gold);
  } else if (held === "bow" && view !== "side") {
    // Busog sa kabilang kamay: kurbadong kahoy + tali
    const sx = shield.hx + (shield.hx < 16 ? -1 : 2);
    const dir = shield.hx < 16 ? -1 : 1;
    const curve = [0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0];
    curve.forEach((o, j) => {
      p.set(sx + dir * o, 13 + j + g.bob, j % 6 === 0 ? c.woodD : c.wood);
      p.set(sx, 13 + j + g.bob, j === 0 || j === curve.length - 1 ? c.wood : c.shirt);
    });
  }
}

// ---- ULO at MUKHA ----
const HEAD_FRONT = [[3, 11, 20], [4, 10, 21], [5, 9, 22], [6, 9, 22], [7, 9, 22], [8, 9, 22], [9, 9, 22], [10, 9, 22], [11, 9, 22], [12, 10, 21], [13, 11, 20]];
const HEAD_SIDE = [[3, 12, 19], [4, 11, 20], [5, 10, 21], [6, 10, 21], [7, 10, 21], [8, 10, 21], [9, 10, 21], [10, 10, 21], [11, 10, 21], [12, 11, 20], [13, 12, 19]];

function drawHead(p, c, cfg, dy, view) {
  const rows = view === "side" ? HEAD_SIDE : HEAD_FRONT;
  rows.forEach(([y, x0, x1]) => {
    for (let x = x0; x <= x1; x++) p.set(x, y + dy, x >= x1 - 1 && view !== "side" ? c.skinD : c.skin);
  });
  // leeg
  const nx = view === "side" ? 14 : 15;
  p.set(nx, 14 + dy, c.skinD); p.set(nx + 1, 14 + dy, c.skinD);
  // baba (anino)
  if (view !== "side") for (let x = 12; x <= 19; x++) p.set(x, 13 + dy, c.skinD);

  if (view === "down") {
    // tainga
    p.set(8, 8 + dy, c.skin); p.set(8, 9 + dy, c.skinD);
    p.set(23, 8 + dy, c.skinD); p.set(23, 9 + dy, c.skinDD);
    // kilay
    p.rows([[7, 12, 13], [7, 18, 19]], c.hairD, dy);
    // mata: pilik, iris na may kislap, ibabang anino
    [[12, 13], [18, 19]].forEach(([a, b]) => {
      p.set(a, 8 + dy, c.lash); p.set(b, 8 + dy, c.lash);
      p.set(a, 9 + dy, c.eye); p.set(b, 9 + dy, c.white);
      p.set(a, 10 + dy, c.eyeD); p.set(b, 10 + dy, c.eye);
    });
    if (cfg.body === "female") { p.set(11, 8 + dy, c.lash); p.set(20, 8 + dy, c.lash); }
    // ilong at bibig
    p.set(16, 10 + dy, c.skinD);
    const mouth = cfg.body === "female" ? mix(c.skin, "#c2506e", 0.4) : c.skinDD;
    p.set(15, 12 + dy, mouth); p.set(16, 12 + dy, mouth);
    if (cfg.body === "female") {
      p.set(11, 11 + dy, mix(c.skin, c.blush, 0.45));
      p.set(20, 11 + dy, mix(c.skin, c.blush, 0.45));
    }
  } else if (view === "up") {
    p.set(8, 8 + dy, c.skin); p.set(8, 9 + dy, c.skinD);
    p.set(23, 8 + dy, c.skinD); p.set(23, 9 + dy, c.skinDD);
  } else {
    // gilid: isang mata, ilong, bibig, tainga
    p.rows([[7, 18, 19]], c.hairD, dy);
    p.set(18, 8 + dy, c.lash); p.set(19, 8 + dy, c.lash);
    p.set(18, 9 + dy, c.white); p.set(19, 9 + dy, c.eye);
    p.set(19, 10 + dy, c.eyeD);
    if (cfg.body === "female") p.set(20, 8 + dy, c.lash);
    p.set(22, 9 + dy, c.skin); p.set(22, 10 + dy, c.skinD);          // ilong
    p.set(20, 12 + dy, c.skinDD);                                      // bibig
    p.set(14, 8 + dy, c.skinD); p.set(14, 9 + dy, c.skinDD);          // tainga
    if (cfg.body === "female") p.set(20, 11 + dy, mix(c.skin, c.blush, 0.45));
  }
}

// Balbas (kulay ng buhok) at salamin
function drawFaceExtras(p, c, cfg, dy, view) {
  if (cfg.beard && view !== "up") {
    const B = c.hair, D = c.hairD;
    if (view === "down") {
      for (let y = 8; y <= 11; y++) { p.set(9, y + dy, B); p.set(22, y + dy, D); }
      p.rows([[11, 13, 18]], B, dy);                                   // bigote
      p.rows([[12, 10, 14], [12, 17, 21], [13, 11, 20], [14, 13, 18]], B, dy);
      p.set(20, 12 + dy, D); p.set(21, 12 + dy, D); p.set(19, 13 + dy, D); p.set(20, 13 + dy, D);
      p.set(15, 12 + dy, c.skinDD); p.set(16, 12 + dy, c.skinDD);    // bibig
    } else {
      for (let y = 8; y <= 10; y++) p.set(16, y + dy, B);
      p.rows([[11, 16, 21], [12, 16, 19], [13, 16, 20], [14, 17, 19]], B, dy);
      p.set(16, 12 + dy, D); p.set(20, 12 + dy, c.skinDD);
    }
  }
  if (cfg.glasses && view !== "up") {
    const F = c.frame;
    if (view === "down") {
      p.rows([[8, 11, 14], [8, 17, 20], [10, 11, 11], [10, 14, 14], [10, 17, 17], [10, 20, 20]], F, dy);
      p.set(11, 9 + dy, F); p.set(14, 9 + dy, F); p.set(17, 9 + dy, F); p.set(20, 9 + dy, F);
      p.set(15, 9 + dy, F); p.set(16, 9 + dy, F);
    } else {
      p.rows([[8, 17, 20], [10, 17, 20]], F, dy);
      p.set(17, 9 + dy, F); p.set(20, 9 + dy, F);
      p.rows([[9, 14, 16]], F, dy);
    }
  }
}

// Matulis na tainga ng elf (nakausli sa buhok)
function drawElfEars(p, c, dy, view) {
  if (view === "down" || view === "up") {
    p.set(7, 6 + dy, c.skin); p.set(7, 7 + dy, c.skin); p.set(8, 7 + dy, c.skin); p.set(8, 8 + dy, c.skin); p.set(8, 9 + dy, c.skinD);
    p.set(24, 6 + dy, c.skinD); p.set(24, 7 + dy, c.skinD); p.set(23, 7 + dy, c.skinD); p.set(23, 8 + dy, c.skinD); p.set(23, 9 + dy, c.skinDD);
  } else {
    p.set(12, 5 + dy, c.skin); p.set(13, 6 + dy, c.skin); p.set(13, 7 + dy, c.skin); p.set(14, 8 + dy, c.skinD); p.set(14, 9 + dy, c.skinDD);
  }
}

// ---- BUHOK ----
// Likod na layer (nasa likod ng katawan sa harap/gilid na view)
function drawHairBack(p, c, cfg, dy, view) {
  const H = c.hair, D = c.hairD;
  const st = cfg.hairStyle;
  if (view === "down") {
    if (st === "long") {
      for (let y = 5; y <= 22; y++) for (let x = 8; x <= 23; x++) p.set(x, y + dy, x >= 21 ? D : H);
      p.rows([[23, 10, 21]], D, dy);
    } else if (st === "bob") {
      for (let y = 5; y <= 13; y++) for (let x = 8; x <= 23; x++) p.set(x, y + dy, x >= 21 ? D : H);
    } else if (st === "twintails") {
      drawTail(p, c, 5, 7, dy, false);
      drawTail(p, c, 25, 7, dy, true);
    } else if (st === "ponytail") {
      for (let y = 9; y <= 17; y++) { p.set(23, y + dy, H); p.set(24, y + dy, D); }
    }
  } else if (view === "side") {
    if (st === "long") {
      for (let y = 5; y <= 21; y++) for (let x = 7; x <= 14; x++) p.set(x, y + dy, x <= 8 ? D : H);
    } else if (st === "bob") {
      for (let y = 5; y <= 13; y++) for (let x = 8; x <= 14; x++) p.set(x, y + dy, x <= 9 ? D : H);
    } else if (st === "ponytail") {
      for (let y = 5; y <= 16; y++) {
        const x = 7 + (y > 11 ? -1 : 0);
        p.set(x, y + dy, H); p.set(x + 1, y + dy, H); p.set(x + 2, y + dy, D);
      }
      p.set(10, 5 + dy, c.tie); p.set(10, 6 + dy, c.tie);
    } else if (st === "twintails") {
      drawTail(p, c, 8, 7, dy, false);
    }
  }
}

function drawTail(p, c, cx, top, dy, right) {
  const widths = [2, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1];
  widths.forEach((w, j) => {
    for (let i = 0; i < w; i++) {
      const x = right ? cx - 1 + i : cx - w + 2 + i;
      p.set(x, top + j + dy, i === w - 1 ? c.hairD : c.hair);
    }
  });
  p.set(cx, top - 1 + dy, c.tie);
  p.set(cx + (right ? -1 : 1), top - 1 + dy, c.tie);
}

// Harapang layer (nasa ibabaw ng ulo)
function drawHairFront(p, c, cfg, dy, view) {
  const H = c.hair, D = c.hairD, L = c.hairL;
  const st = cfg.hairStyle;

  if (view === "up") {
    // Likod ng ulo: buong buhok
    if (st === "buzz") {
      HEAD_FRONT.forEach(([y, x0, x1]) => { if (y <= 10) for (let x = x0; x <= x1; x++) p.set(x, y + dy, D); });
    } else {
      HEAD_FRONT.forEach(([y, x0, x1]) => { for (let x = x0; x <= x1; x++) p.set(x, y + dy, x >= x1 - 1 ? D : H); });
      p.rows([[1, 12, 19], [2, 10, 21]], H, dy);
      p.rows([[3, 12, 15]], L, dy);
      if (st === "spiky") [11, 14, 17, 20].forEach((x) => p.set(x, 0 + dy, H));
    }
    if (st === "long") {
      for (let y = 10; y <= 22; y++) for (let x = 9; x <= 22; x++) p.set(x, y + dy, x >= 21 ? D : H);
      p.rows([[23, 11, 20]], D, dy);
    } else if (st === "bob") {
      for (let y = 10; y <= 14; y++) for (let x = 8; x <= 23; x++) p.set(x, y + dy, x >= 21 ? D : H);
    } else if (st === "ponytail") {
      p.set(15, 8 + dy, c.tie); p.set(16, 8 + dy, c.tie);
      for (let y = 9; y <= 19; y++) { p.set(15, y + dy, H); p.set(16, y + dy, y > 16 ? D : H); if (y < 16) p.set(14, y + dy, H); }
    } else if (st === "twintails") {
      drawTail(p, c, 6, 7, dy, false);
      drawTail(p, c, 25, 7, dy, true);
    }
    return;
  }

  if (view === "side") {
    if (st === "buzz") {
      p.rows([[2, 12, 19], [3, 11, 20], [4, 10, 20]], D, dy);
      for (let y = 5; y <= 8; y++) for (let x = 10; x <= 13; x++) p.set(x, y + dy, D);
      return;
    }
    p.rows([[1, 12, 18], [2, 10, 20], [3, 9, 21], [4, 9, 21], [5, 9, 21]], H, dy);
    p.rows([[2, 13, 16], [3, 12, 14]], L, dy);
    for (let y = 6; y <= 10; y++) for (let x = 9; x <= 13; x++) p.set(x, y + dy, x <= 10 ? D : H);
    p.rows([[6, 16, 16], [7, 16, 16], [8, 16, 16]], H, dy);                 // patilya
    p.rows([[6, 19, 21], [7, 21, 21]], H, dy);                              // bangs sa harap
    p.set(21, 6 + dy, D);
    if (st === "spiky") {
      [11, 14, 17].forEach((x) => p.set(x, 0 + dy, H));
      p.set(8, 3 + dy, H); p.set(8, 6 + dy, D); p.set(22, 5 + dy, H);
    }
    if (st === "long" || st === "bob") for (let y = 6; y <= 12; y++) p.set(15, y + dy, H);
    return;
  }

  // ---- harap (down) ----
  if (st === "buzz") {
    p.rows([[2, 12, 19], [3, 10, 21], [4, 9, 22]], D, dy);
    for (let y = 5; y <= 7; y++) { p.set(9, y + dy, D); p.set(22, y + dy, D); }
    return;
  }
  p.rows([[1, 12, 19], [2, 10, 21], [3, 9, 22], [4, 9, 22], [5, 9, 22]], H, dy);
  p.rows([[2, 12, 15], [3, 11, 13]], L, dy);
  for (let y = 3; y <= 5; y++) { p.set(21, y + dy, D); p.set(22, y + dy, D); }
  // bangs na may hugis
  [9, 10, 12, 13, 16, 19, 21, 22].forEach((x) => p.set(x, 6 + dy, x >= 21 ? D : H));
  [9, 10, 13, 21, 22].forEach((x) => p.set(x, 7 + dy, D));
  // gilid
  const sideLen = st === "long" || st === "bob" ? 12 : 8;
  for (let y = 6; y <= sideLen; y++) {
    p.set(9, y + dy, H); p.set(22, y + dy, D);
    if (sideLen > 8) { p.set(8, y + dy, H); p.set(23, y + dy, D); }
  }
  if (st === "bob") { p.set(10, 13 + dy, H); p.set(21, 13 + dy, D); }
  if (st === "spiky") {
    [11, 14, 17, 20].forEach((x) => p.set(x, 0 + dy, H));
    p.rows([[1, 10, 21]], H, dy);
    p.set(8, 3 + dy, H); p.set(23, 3 + dy, D);
    [11, 14, 18].forEach((x) => p.set(x, 7 + dy, H));
  }
  if (st === "twintails") { p.set(8, 7 + dy, c.tie); p.set(23, 7 + dy, c.tie); }
}

// ---- HEADGEAR ----
function drawHeadgear(p, c, cfg, dy, view) {
  const hg = cfg.headgear;
  if (!hg) return;
  const side = view === "side";

  if (hg === "crown") {
    const [x0, x1] = side ? [10, 20] : [10, 21];
    p.rows([[2, x0, x1], [3, x0, x1]], c.gold, dy);
    p.rows([[3, x1 - 1, x1]], c.goldD, dy);
    const points = side ? [10, 14, 18] : [10, 13, 18, 21];
    points.forEach((x) => { p.set(x, 1 + dy, c.gold); p.set(x, 0 + dy, c.gold); });
    if (!side) { p.set(15, 2 + dy, c.gem); p.set(16, 2 + dy, c.gem); }
    else p.set(17, 2 + dy, c.gem);
  } else if (hg === "tiara") {
    const [x0, x1] = side ? [13, 20] : [12, 19];
    p.rows([[4, x0, x1]], c.gold, dy);
    if (!side && view !== "up") { p.set(15, 3 + dy, c.crystal); p.set(16, 3 + dy, c.crystal); p.set(15, 2 + dy, c.white); }
    if (side) p.set(19, 3 + dy, c.crystal);
  } else if (hg === "helmet") {
    const S = c.steel, D = c.steelD, L = c.steelL;
    if (view === "up") {
      HEAD_FRONT.forEach(([y, x0, x1]) => { for (let x = x0; x <= x1; x++) p.set(x, y + dy, x >= x1 - 1 ? D : S); });
      p.rows([[1, 11, 20], [2, 10, 21]], S, dy);
    } else if (side) {
      p.rows([[1, 11, 19], [2, 10, 20], [3, 9, 21], [4, 9, 21], [5, 9, 21], [6, 9, 21], [7, 9, 17]], S, dy);
      for (let y = 8; y <= 12; y++) for (let x = 9; x <= 15; x++) p.set(x, y + dy, x <= 10 ? D : S);
      p.rows([[3, 12, 15]], L, dy);
      p.rows([[7, 18, 21]], D, dy);                              // visor rim
    } else {
      p.rows([[1, 11, 20], [2, 10, 21], [3, 9, 22], [4, 9, 22], [5, 9, 22], [6, 9, 22]], S, dy);
      p.rows([[7, 9, 22]], D, dy);                                // visor rim
      for (let y = 8; y <= 11; y++) { p.set(9, y + dy, S); p.set(10, y + dy, S); p.set(21, y + dy, D); p.set(22, y + dy, D); }
      for (let y = 7; y <= 9; y++) { p.set(15, y + dy, S); p.set(16, y + dy, D); } // nose guard
      p.rows([[2, 12, 15], [3, 11, 13]], L, dy);
      for (let y = 2; y <= 6; y++) { p.set(21, y + dy, D); p.set(22, y + dy, D); }
    }
    // pulang plumahe
    if (side) p.rows([[0, 10, 15], [1, 8, 10], [2, 7, 9]], c.plume, dy);
    else p.rows([[0, 13, 18]], c.plume, dy);
  } else if (hg === "headband") {
    if (side) {
      p.rows([[5, 9, 21]], c.tie, dy);
      p.rows([[5, 7, 8], [6, 6, 8], [7, 7, 7]], c.tie, dy);
    } else {
      p.rows([[5, 9, 22]], c.tie, dy);
      if (view === "up") { for (let y = 6; y <= 9; y++) { p.set(15, y + dy, c.tie); p.set(16, y + dy, y > 7 ? shade(c.tie, -0.3) : c.tie); } }
      else p.rows([[5, 23, 24], [6, 23, 25], [7, 24, 25]], shade(c.tie, -0.2), dy);
    }
  }
}

// ==================== BUONG FRAME ====================
function renderFrame(cfg, dir, anim, i) {
  const p = new Pix(FRAME_W, FRAME_H);
  const c = palette(cfg);
  const g = gait(anim, i);
  const dy = g.bob;
  const helmet = cfg.headgear === "helmet";
  const drawLowerOutfit = (side, trim) => {
    if (cfg.outfit === "robe") drawRobeSkirt(p, c, dy, side, trim);
    else if (cfg.outfit === "coat") drawCoatTails(p, c, dy, side);
  };

  if (dir === "down" || dir === "up") {
    const back = dir === "up";
    const female = cfg.body === "female";
    const lx = female ? 9 : 8, rx = female ? 21 : 22;

    if (cfg.cape && !back) drawCape(p, c, dy, "down");
    if (!back && !helmet) drawHairBack(p, c, cfg, dy, "down");

    // Binti at paa
    drawLegFront(p, c, cfg, 12, g.lLift);
    drawLegFront(p, c, cfg, 17, g.rLift);
    drawPelvis(p, c, cfg, false);
    if (cfg.legs === "skirt") drawSkirt(p, c, cfg, 0, false);
    drawLowerOutfit(false, !back);
    if (cfg.outfit === "gown") drawGownSkirt(p, c, dy, false);

    drawTorso(p, c, cfg, dy, dir);

    // Braso: sa likod na view, magkabaligtad ang kamay (kanang kamay nasa kanan ng screen)
    let weaponArm, shieldArm;
    if (g.attack) {
      const wx = back ? lx : rx;
      const sx = back ? rx : lx;
      shieldArm = drawArmFront(p, c, cfg, sx, dy, 0, back ? 1 : 0);
      weaponArm = drawArmFront(p, c, cfg, wx, dy, g.attack === 1 ? -3 : 3, back ? 0 : 1);
    } else {
      const a = drawArmFront(p, c, cfg, lx, dy, g.lArm, 0);
      const b = drawArmFront(p, c, cfg, rx, dy, g.rArm, 1);
      weaponArm = back ? a : b;
      shieldArm = back ? b : a;
    }

    if (cfg.cape && back) drawCape(p, c, dy, "up");
    drawHeld(p, c, cfg, dir, weaponArm, shieldArm, g);

    drawHead(p, c, cfg, dy, dir);
    drawFaceExtras(p, c, cfg, dy, dir);
    if (back && !helmet) drawHairFront(p, c, cfg, dy, "up");
    if (!back && !helmet) drawHairFront(p, c, cfg, dy, "down");
    if (cfg.ears === "elf") drawElfEars(p, c, dy, dir);
    drawHeadgear(p, c, cfg, dy, dir);
  } else {
    // ---- GILID (nakaharap pakanan) ----
    const s = g.stride;
    if (cfg.cape) drawCape(p, c, dy, "side");
    if (!helmet) drawHairBack(p, c, cfg, dy, "side");

    // likod na braso (madilim) sa likod ng katawan
    const farArm = drawArmSide(p, c, cfg, dy, g.attack ? 0 : -s, true);
    if (cfg.weapon === "novice") drawBuckler(p, c, farArm.hx - 2, farArm.hy - 4);

    // binti: malayong binti muna (madilim), tapos malapit
    drawLegSide(p, c, cfg, 14 - 2 * s, s < 0 ? 1 : 0, true);
    drawLegSide(p, c, cfg, 14 + 2 * s, 0, false);
    drawPelvis(p, c, cfg, true);
    if (cfg.legs === "skirt") drawSkirt(p, c, cfg, 0, true);
    drawLowerOutfit(true, false);
    if (cfg.outfit === "gown") drawGownSkirt(p, c, dy, true);

    drawTorso(p, c, cfg, dy, "side");

    let arm;
    if (g.attack === 1) {
      arm = drawArmSide(p, c, cfg, dy, -3, false);
    } else if (g.attack === 2) {
      // tulak pasulong nang pahalang
      const y = 18 + dy;
      for (let x = 15; x <= 21; x++) {
        p.set(x, y, sleeveColor(c, cfg, x - 15, false));
        p.set(x, y + 1, sleeveColor(c, cfg, x - 15, true));
      }
      p.rect(22, y, 2, 2, c.glove);
      arm = { hx: 22, hy: y };
    } else {
      arm = drawArmSide(p, c, cfg, dy, s, false);
    }
    drawHeld(p, c, cfg, "side", arm, farArm, g);

    drawHead(p, c, cfg, dy, "side");
    drawFaceExtras(p, c, cfg, dy, "side");
    if (!helmet) drawHairFront(p, c, cfg, dy, "side");
    if (cfg.ears === "elf") drawElfEars(p, c, dy, "side");
    drawHeadgear(p, c, cfg, dy, "side");
  }

  p.outline();
  return p.toCanvas();
}

// Puting silhouette (para sa hit flash)
function whiteOf(canvas) {
  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(canvas, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

// ==================== PUBLIC API ====================
export class Avatar {
  constructor(config) {
    this.config = normalizeConfig(config);
    this.cache = new Map();
  }

  frame(dir, anim, i) {
    const n = FRAMES[anim] || 1;
    const idx = ((i % n) + n) % n;
    const key = `${dir}|${anim}|${idx}`;
    if (!this.cache.has(key)) this.cache.set(key, renderFrame(this.config, dir, anim, idx));
    return this.cache.get(key);
  }

  flashFrame(dir, anim, i) {
    const key = `w|${dir}|${anim}|${i}`;
    if (!this.cache.has(key)) this.cache.set(key, whiteOf(this.frame(dir, anim, i)));
    return this.cache.get(key);
  }

  // (x, y) = posisyon ng paa sa mundo. flip = nakaharap pakaliwa (side lang)
  draw(ctx, x, y, dir, anim, i, flip = false, flash = false, scale = 1) {
    const img = flash ? this.flashFrame(dir, anim, i) : this.frame(dir, anim, i);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (flip && dir === "side") ctx.scale(-1, 1);
    ctx.drawImage(img, -ANCHOR_X * scale, -ANCHOR_Y * scale, FRAME_W * scale, FRAME_H * scale);
    ctx.restore();
  }

  // Close-up ng ulo at balikat (para sa dialogue portrait)
  drawPortrait(ctx, w, h) {
    const img = this.frame("down", "idle", 0);
    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    // bahaging x 4..28, y 0..22 (ulo hanggang dibdib)
    ctx.drawImage(img, 4, 0, 24, 22, 0, 0, w, h);
  }
}
