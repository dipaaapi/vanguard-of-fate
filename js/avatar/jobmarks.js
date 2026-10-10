import { shade } from "./avatar.js";

// ==================== JOB MARKS (signature details of each class) ====================
// The five callings each have a splash identity: a colour and a sigil from the Royal Job
// Awakening (Act IV: shield = Knight, bow = Archer, prayer = Priest, star = Mage, fist = Fighter)
// and the Earthbound mentor behind it (js/npc/roster.js, data/codex_entries.json). `job` in an
// Avatar look adds those details on top of the plain outfit, so the in-game sprite reads as the
// same hero as the art: the Knight's gold-trimmed pauldrons and shield crest, the Archer's
// hooded mantle and falcon feather, the Priest's golden stole and circlet, the Mage's starry
// night cloak and star hat, the Fighter's open gi, black belt and flying headband.
//
// Layers (called from renderPix in avatar.js):
//   behind — before the legs (things that hang behind the body)
//   body   — right after the torso, under the arms (chest crests, stoles, belts)
//   over   — after the arms and the back cape, before the held weapon (mantles, back crests)
//   head   — after the headgear (circlets, feathers, hat stars, headband tails)
// view = "down" | "side" | "up"; i = frame index (small flutters); dy = idle/walk bob.

export const JOBS = ["knight", "archer", "priest", "mage", "fighter"];

const STAR = "#ffe9a0";
const STAR_W = "#ffffff";
const HOOD = "#1f4330";
const BELT_BLACK = "#1b1b22";

// Palette tweaks before anything is drawn
export function jobPalette(c, cfg) {
  if (cfg.job === "fighter") {
    // Open gi: the "shirt" under the vest is bare skin (chest and arms)
    c.shirt = c.skin;
    c.shirtD = c.skinD;
    c.belt = BELT_BLACK;
    c.buckle = BELT_BLACK;
  } else if (cfg.job === "knight") {
    c.belt = "#2b2b33";
  }
}

export function drawJob(layer, p, c, cfg, dy, view, i = 0) {
  const fn = JOB_DRAW[cfg.job];
  if (fn) fn(layer, p, c, cfg, dy, view, i);
}

// ---------- KNIGHT (Aegis Lancer): blue and gold, the shield sigil ----------
function knight(layer, p, c, cfg, dy, view) {
  const G = c.gold, GD = c.goldD;
  const female = cfg.body === "female";
  if (layer === "body") {
    if (view === "down") {
      const l = female ? 10 : 9, r = female ? 21 : 22;
      // Gold rims under the pauldrons and a raised steel gorget
      p.rows([[17, l, l + 3]], G, dy);
      p.rows([[17, r - 3, r]], GD, dy);
      p.rows([[15, 14, 17]], c.steelL, dy);
      // Shield crest on the tabard (gold rim, white field, blue cross)
      p.rows([[17, 14, 17]], G, dy);
      p.rows([[18, 14, 14], [18, 17, 17], [19, 14, 14], [19, 17, 17]], G, dy);
      p.rows([[18, 15, 16], [19, 15, 16]], c.steelL, dy);
      p.set(15, 18 + dy, cfg.outfitColor); p.set(15, 19 + dy, cfg.outfitColor); p.set(16, 18 + dy, cfg.outfitColor);
      p.rows([[20, 15, 16]], GD, dy);
      p.rows([[23, 14, 17]], G, dy);                       // gold hem of the tabard
    } else if (view === "side") {
      p.rows([[17, 13, 17]], G, dy);                       // pauldron rim
      p.set(18, 18 + dy, G); p.set(19, 18 + dy, GD); p.set(18, 19 + dy, c.steelL); p.set(19, 19 + dy, G);
      p.rows([[23, 18, 19]], G, dy);
    }
  } else if (layer === "over") {
    if (view === "up") {
      // The cape's gold hem and the shield crest across the back
      p.rows([[31, 9, 22]], G, dy);
      p.rows([[30, 8, 8], [30, 23, 23]], GD, dy);
      p.rows([[18, 13, 18]], G, dy);
      for (let y = 19; y <= 22; y++) { p.set(13 + (y > 21 ? 1 : 0), y + dy, G); p.set(18 - (y > 21 ? 1 : 0), y + dy, GD); }
      p.rows([[23, 15, 16]], GD, dy);
      for (let y = 19; y <= 22; y++) for (let x = 14 + (y > 21 ? 1 : 0); x <= 17 - (y > 21 ? 1 : 0); x++) p.set(x, y + dy, c.steelL);
      p.rows([[19, 15, 16], [20, 14, 17], [21, 15, 16], [22, 15, 16]], cfg.outfitColor, dy);
      p.rows([[15, 10, 21]], c.steelL, dy);                // pauldrons over the cape
      p.rows([[16, 9, 11], [16, 20, 22]], c.steelD, dy);
      p.rows([[17, 9, 11]], G, dy); p.rows([[17, 20, 22]], GD, dy);
    } else if (view === "down") {
      p.rows([[30, 8, 10], [30, 21, 23]], G, dy);           // cape hem peeking out at the sides
    } else {
      p.rows([[30, 8, 11]], G, dy);
    }
  }
}

// ---------- ARCHER (Elven Archer): forest green, the bow sigil, the falcon ----------
function archer(layer, p, c, cfg, dy, view, i) {
  const H = HOOD, HD = shade(HOOD, -0.3), HL = shade(HOOD, 0.22);
  if (layer === "behind" && view === "side") {
    // Hood bunched behind the neck
    p.rows([[12, 9, 12], [13, 8, 12], [14, 8, 12], [15, 9, 11], [16, 9, 10]], HD, dy);
    p.rows([[12, 10, 11], [13, 9, 11]], H, dy);
  }
  if (layer !== "over") return;
  if (view === "down") {
    // Short hooded mantle over the shoulders, fastened with a gold leaf clasp
    p.rows([[14, 11, 20]], HD, dy);
    p.rows([[15, 9, 22], [16, 8, 23]], H, dy);
    p.rows([[17, 8, 11], [17, 20, 23], [18, 8, 10], [18, 21, 23], [19, 8, 9], [19, 22, 23]], H, dy);
    p.rows([[15, 9, 10], [16, 8, 9], [17, 8, 8]], HL, dy);
    p.rows([[16, 21, 23], [17, 22, 23], [18, 23, 23], [19, 23, 23]], HD, dy);
    p.rows([[15, 14, 17]], c.shirt, dy);                  // the collar opens at the throat
    p.set(15, 16 + dy, c.gold); p.set(16, 16 + dy, c.goldD); p.set(15, 17 + dy, "#7fdc8f");
    p.rows([[17, 12, 12], [17, 19, 19], [18, 11, 11], [18, 20, 20], [19, 10, 10], [19, 21, 21]], c.goldD, dy);   // leaf-gold edge
  } else if (view === "up") {
    // The mantle across the back with the hood hanging in a point
    p.rows([[14, 10, 21], [15, 9, 22], [16, 8, 23], [17, 8, 23], [18, 9, 22]], H, dy);
    p.rows([[19, 11, 20], [20, 12, 19], [21, 13, 18], [22, 14, 17], [23, 15, 16]], H, dy);
    p.rows([[15, 9, 10], [16, 8, 9]], HL, dy);
    p.rows([[16, 22, 23], [17, 21, 23], [18, 21, 22]], HD, dy);
    for (let y = 15; y <= 22; y++) { p.set(15, y + dy, HD); }          // hood seam
    p.rows([[14, 13, 18]], HD, dy);
  } else {
    // Side: the mantle drapes over the near shoulder
    p.rows([[15, 12, 18], [16, 11, 19], [17, 12, 18]], H, dy);
    p.rows([[18, 13, 17]], HD, dy);
    p.rows([[15, 12, 14]], HL, dy);
    p.set(18, 15 + dy, c.gold);
    p.rows([[14, 12, 16]], HD, dy);
  }
}

function archerHead(p, c, cfg, dy, view, i) {
  // Falcon feather tucked in the hair (white with a slate tip) — the alpine falcon's
  const W = "#f4f1ea", T = "#5d6b7e";
  if (view === "down") {
    p.set(21, 1 + dy, T); p.set(22, 2 + dy, W); p.set(21, 3 + dy, W); p.set(22, 3 + dy, "#d8d4ca"); p.set(21, 4 + dy, W);
  } else if (view === "side") {
    p.set(7, 2 + dy, T); p.set(8, 3 + dy, W); p.set(9, 3 + dy, W); p.set(9, 4 + dy, "#d8d4ca"); p.set(10, 4 + dy, W);
  } else {
    p.set(10, 1 + dy, T); p.set(9, 2 + dy, W); p.set(10, 3 + dy, W); p.set(10, 4 + dy, W);
  }
}

// ---------- PRIEST: white and gold, the prayer sigil ----------
function priest(layer, p, c, cfg, dy, view) {
  const G = c.gold, GD = c.goldD;
  if (layer === "body") {
    if (view === "down") {
      // Golden stole from the shoulders to below the hem, with small white crosses
      for (let y = 15; y <= 30; y++) {
        const yy = y <= 29 ? y + dy : y;
        p.set(13, yy, G); p.set(18, yy, GD);
      }
      p.set(13, 26 + dy, STAR_W); p.set(18, 26 + dy, STAR_W);
      p.set(13, 30, GD); p.set(18, 30, GD);
      // Sun medallion on the chest
      p.rows([[18, 15, 16]], G, dy); p.rows([[19, 15, 16]], GD, dy);
      p.set(15, 18 + dy, "#fff4b0");
      // Gold hem of the robe
      p.rows([[29, 9, 22]], G, dy);
    } else if (view === "side") {
      for (let y = 15; y <= 29; y++) p.set(19, y + dy, G);
      p.set(19, 26 + dy, STAR_W);
      p.rows([[29, 10, 21]], G, dy);
    } else {
      p.rows([[29, 9, 22]], G, dy);
    }
  } else if (layer === "over") {
    if (view === "up") {
      // The mantle's gold border and a cross across the back
      p.rows([[31, 9, 22]], G, dy);
      for (let y = 17; y <= 26; y++) { p.set(15, y + dy, G); p.set(16, y + dy, GD); }
      p.rows([[20, 12, 19]], G, dy); p.rows([[21, 12, 19]], GD, dy);
      p.rows([[15, 10, 21]], G, dy);                        // shoulder trim
    } else if (view === "down") {
      p.rows([[30, 8, 10], [30, 21, 23]], G, dy);
    } else {
      p.rows([[30, 8, 11]], G, dy);
    }
  }
}

function priestHead(p, c, cfg, dy, view) {
  if (cfg.headgear) return;
  // Thin gold circlet with a white-gold gem
  if (view === "down") {
    p.rows([[5, 9, 22]], c.gold, dy);
    p.rows([[5, 21, 22]], c.goldD, dy);
    p.set(15, 5 + dy, "#fff4b0"); p.set(16, 5 + dy, STAR_W); p.set(15, 4 + dy, c.gold); p.set(16, 4 + dy, c.goldD);
  } else if (view === "side") {
    p.rows([[5, 10, 21]], c.gold, dy);
    p.set(20, 5 + dy, "#fff4b0");
  } else {
    p.rows([[5, 9, 22]], c.goldD, dy);
  }
}

// ---------- MAGE (Arcane Sage): violet night sky, the star sigil ----------
const ROBE_STARS_FRONT = [[11, 18], [19, 17], [12, 22], [19, 23], [11, 26], [20, 25], [13, 28], [18, 27]];
const ROBE_STARS_SIDE = [[13, 18], [17, 22], [12, 25], [19, 27], [15, 28]];
const CAPE_STARS = [[11, 17], [19, 18], [13, 21], [17, 24], [10, 26], [21, 22], [14, 28], [20, 29], [12, 30], [16, 19]];

function mage(layer, p, c, cfg, dy, view, i) {
  const G = c.gold, GD = c.goldD;
  if (layer === "body") {
    if (view === "down") {
      ROBE_STARS_FRONT.forEach(([x, y], k) => { if (x < 15 || x > 16) p.set(x, y + dy, k % 3 ? STAR : STAR_W); });
      p.rows([[29, 9, 22]], G, dy);                         // gold hem
      p.rows([[28, 9, 22]], GD, dy);
      p.rows([[21, 11, 20]], G, dy);                        // gold sash with a star-crystal buckle
      p.set(15, 21 + dy, c.crystal); p.set(16, 21 + dy, c.crystalD);
      p.rows([[15, 13, 14], [15, 17, 18]], G, dy);          // high gold collar
    } else if (view === "side") {
      ROBE_STARS_SIDE.forEach(([x, y], k) => p.set(x, y + dy, k % 2 ? STAR : STAR_W));
      p.rows([[29, 10, 21]], G, dy); p.rows([[28, 10, 21]], GD, dy);
      p.rows([[21, 12, 19]], G, dy);
      p.set(19, 15 + dy, G); p.set(18, 15 + dy, G);
    } else {
      p.rows([[29, 9, 22]], G, dy);
    }
  } else if (layer === "over") {
    if (view === "up") {
      // Night-sky cloak full of stars
      CAPE_STARS.forEach(([x, y], k) => p.set(x, y + dy, k % 3 ? STAR : STAR_W));
      p.rows([[31, 9, 22]], G, dy);
      p.rows([[15, 10, 21]], G, dy);
    } else if (view === "down") {
      p.set(9, 27 + dy, STAR); p.set(22, 24 + dy, STAR_W); p.set(9, 20 + dy, STAR_W);
      p.rows([[30, 8, 9], [30, 22, 23]], G, dy);
    } else {
      p.set(9, 22 + dy, STAR); p.set(8, 27 + dy, STAR_W);
    }
  }
}

function mageHead(p, c, cfg, dy, view, i) {
  if (cfg.headgear === "hat") {
    // A golden star on the hat
    if (view === "down") {
      p.set(15, 1 + dy, STAR); p.rows([[2, 14, 16]], STAR, dy); p.set(15, 3 + dy, G_D(c));
      p.set(15, 2 + dy, STAR_W);
    } else if (view === "side") {
      p.set(14, 2 + dy, STAR); p.rows([[3, 13, 15]], STAR, dy); p.set(14, 3 + dy, STAR_W);
    }
  }
  // A small star orbiting the sage (two positions, so it twinkles across the idle frames)
  if (view !== "up") {
    const [x, y] = i % 2 ? [26, 9] : [27, 7];
    if (!p.get(x, y + dy)) { p.set(x, y + dy, STAR_W); p.set(x - 1, y + dy, STAR); p.set(x + 1, y + dy, STAR); p.set(x, y - 1 + dy, STAR); p.set(x, y + 1 + dy, STAR); }
  }
}
const G_D = (c) => c.goldD;

// ---------- FIGHTER (Brawler): crimson gi, the fist sigil, ki ----------
function fighter(layer, p, c, cfg, dy, view, i) {
  const B = BELT_BLACK, BL = "#3a3a46";
  const lapel = shade(cfg.outfitColor || "#c73e3a", -0.35);
  if (layer === "body") {
    if (view === "down") {
      // Open gi with dark lapels, chest and abs, black belt with a knot and two tails
      for (let y = 15; y <= 20; y++) { p.set(13, y + dy, lapel); p.set(18, y + dy, lapel); }
      if (cfg.body === "female") p.rows([[16, 14, 17], [17, 14, 17], [18, 14, 17], [19, 14, 17]], B, dy);   // chest wrap
      else { p.rows([[17, 15, 16]], c.skinD, dy); p.set(15, 19 + dy, c.skinD); p.set(16, 20 + dy, c.skinD); }
      p.rows([[21, 11, 20]], B, dy);
      p.rows([[21, 15, 16]], BL, dy);
      const sway = i % 2;
      p.set(14, 22 + dy, B); p.set(14 - sway, 23 + dy, B); p.set(14 - sway, 24 + dy, BL);
      p.set(17, 22 + dy, B); p.set(17 + sway, 23 + dy, B); p.set(17 + sway, 24 + dy, BL);
    } else if (view === "side") {
      p.rows([[21, 12, 19]], B, dy);
      for (let y = 15; y <= 20; y++) p.set(17, y + dy, lapel);
      if (cfg.body === "female") p.rows([[16, 18, 20], [17, 18, 20], [18, 18, 20], [19, 18, 19]], B, dy);
    } else {
      p.rows([[21, 11, 20]], B, dy);
    }
  } else if (layer === "behind" && view === "side") {
    // Belt tails trailing behind
    const f = i % 2;
    p.set(11, 21 + dy, B); p.set(10, 22 + dy + f, B); p.set(9, 23 + dy + f, BL);
    p.set(11, 22 + dy, B); p.set(10, 23 + dy, BL);
  } else if (layer === "over" && view === "up") {
    // Gold fist crest on the back of the gi
    p.rows([[17, 14, 17], [18, 14, 17], [19, 14, 17]], c.gold, dy);
    p.rows([[17, 14, 14], [18, 14, 14]], c.goldD, dy);
    p.set(17, 16 + dy, c.gold); p.set(15, 18 + dy, c.goldD); p.set(16, 18 + dy, c.goldD);
    p.rows([[20, 15, 17]], c.goldD, dy);
    // Belt knot tails at the back
    p.set(15, 22 + dy, B); p.set(16, 22 + dy, B); p.set(15, 23 + dy, BL); p.set(16, 23 + dy, BL);
  }
}

function fighterHead(p, c, cfg, dy, view, i) {
  if (cfg.headgear !== "headband") return;
  // Long headband tails that stream out behind (they flutter between frames)
  const T = c.tie, TD = shade(c.tie, -0.3);
  const f = i % 2;
  if (view === "side") {
    p.rows([[5, 4, 8]], T, dy);
    p.rows([[6, 2 + f, 6]], TD, dy);
    p.set(3 - f, 4 + dy + f, T); p.set(2, 7 + dy - f, TD);
  } else if (view === "down") {
    p.rows([[6, 24, 26], [7, 25, 27]], TD, dy);
    p.set(27, 8 + dy - f, TD);
  } else {
    for (let y = 10; y <= 13; y++) { p.set(15 - (y > 11 ? f : 0), y + dy, T); p.set(16 + (y > 11 ? f : 0), y + dy, TD); }
  }
}

const JOB_DRAW = {
  knight,
  archer: (layer, p, c, cfg, dy, view, i) => layer === "head" ? archerHead(p, c, cfg, dy, view, i) : archer(layer, p, c, cfg, dy, view, i),
  priest: (layer, p, c, cfg, dy, view, i) => layer === "head" ? priestHead(p, c, cfg, dy, view, i) : priest(layer, p, c, cfg, dy, view, i),
  mage: (layer, p, c, cfg, dy, view, i) => layer === "head" ? mageHead(p, c, cfg, dy, view, i) : mage(layer, p, c, cfg, dy, view, i),
  fighter: (layer, p, c, cfg, dy, view, i) => layer === "head" ? fighterHead(p, c, cfg, dy, view, i) : fighter(layer, p, c, cfg, dy, view, i)
};
