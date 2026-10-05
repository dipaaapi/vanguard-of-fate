// Safe-zone painters: the Fated Vanguard camps (one per platform / frontier map, themed), the hub's
// Barracks Sanctuary with its longhouses, the Imperial Citadel with its audience dais, and Emberhold.
// Each one is painted on layers (ground, buildings, props, fire) over FRAMES frames and saved as
// aseprite/zone/<key>.aseprite with one looping "down-idle" tag. Placement and solid footprints
// come from js/world/zonesprites.js, the table the game uses, so art and collisions agree.
import { writeAse } from "../asefile.mjs";
import { SRC_DIR } from "../lib.mjs";
import * as K from "./scenery.mjs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const { FRAMES, Img, rgb, ramp, mix, shade, withA, pick, hash, dither, ph, flagstones, clearing, shingles, timberWall, windowLit, shadow, flames, glow,
  smoke, brazier, flagPole, hangingBanner, crate, barrel, sack, weaponRack, dummy, bedroll, campfire, pavilion, ridgeTent } = K;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const zs = await import(pathToFileURL(path.join(ROOT, "js/world/zonesprites.js")).href);
const LAYERS = ["ground", "buildings", "props", "fire"];
const INK = rgb("#160f1c");
const DURATION = 0.12;

const newLayers = (w, h) => Object.fromEntries(LAYERS.map((n) => [n, new Img(w, h)]));

/** Paint FRAMES frames with paint(layers, f) and save aseprite/zone/<key>.aseprite. */
function save(key, w, h, paint) {
  const frames = [];
  for (let f = 0; f < FRAMES; f++) {
    const L = newLayers(w, h);
    paint(L, f);
    L.buildings.outline(INK);
    L.props.outline(INK);
    frames.push({ duration: DURATION, cels: Object.fromEntries(LAYERS.map((n) => [n, L[n].d])) });
  }
  const out = path.join(SRC_DIR, "zone", `${key}.aseprite`);
  writeAse(out, { w, h, layers: LAYERS, frames, tags: [{ name: "down-idle", from: 0, to: FRAMES - 1 }] });
  console.log(`aseprite/zone/${key}.aseprite  ${w}×${h}, ${FRAMES} frames, layers ${LAYERS.join("/")}`);
  return frames;
}

// ==================== CAMPS ====================
const WOOD = ramp("#3b2414", "#5e3b1a", "#7a5230", "#9c6b3c", "#b8864f");
const STONE = ramp("#3d3a36", "#5a5650", "#7c776f", "#9c968c");
const VANGUARD = ramp("#4a1219", "#7a1f2a", "#a3303a", "#c94a4a");
const GOLD = ramp("#8a6a1a", "#c9a227", "#f2d16b");

export const CAMP_THEMES = {
  canopy: { ground: ramp("#2a2016", "#3a2c1d", "#4b3a26", "#5e4a31"), tent: VANGUARD, supply: ramp("#2e3b1f", "#41552b", "#587339", "#6f8f48"), extra: "mushrooms" },
  coast: { ground: ramp("#9c7f52", "#b39567", "#c9ab7c", "#ddc395"), tent: ramp("#1e3a5f", "#2f5d8a", "#4a86b8", "#7fb3d9"), supply: ramp("#9c917c", "#bdb29b", "#d9d0bb", "#efe8d6"), extra: "nets", stripes: true },
  frost: { ground: ramp("#7f93a8", "#9cb0c4", "#bccbdb", "#dce7f1"), tent: VANGUARD, supply: ramp("#4a3524", "#664a33", "#836146", "#a07c5c"), extra: "snow", snow: true, metal: "#4b5563" },
  siege: { ground: ramp("#231e1e", "#332b2b", "#443a39", "#574b49"), tent: ramp("#2b2d33", "#41444d", "#5b5f6b", "#7a7f8c"), supply: ramp("#4a3f2f", "#62543f", "#7d6c52", "#988667"), extra: "sandbags", pennant: rgb("#ef4444") },
  maw: { ground: ramp("#170e20", "#22152f", "#30203f", "#412b55"), tent: ramp("#2a1240", "#43205f", "#5f2f85", "#8547b0"), supply: ramp("#1f1b2e", "#2f2945", "#433b5f", "#5b5180"), extra: "crystals", metal: "#2a2340" },
  rocky: { ground: ramp("#5a3d26", "#6e4c31", "#86603f", "#9f7550"), tent: ramp("#6b5333", "#8f7149", "#b39261", "#d1b27e"), supply: VANGUARD, extra: "ore" },
  swamp: { ground: ramp("#26291b", "#323623", "#3f452c", "#4e5536"), tent: ramp("#2e3b1f", "#41552b", "#587339", "#6f8f48"), supply: VANGUARD, extra: "reeds", deck: true },
  mountain: { ground: ramp("#3c4a30", "#4b5b3c", "#5d6f4a", "#72865b"), tent: ramp("#1f3550", "#2d4d72", "#3f6894", "#5d8ab5"), supply: VANGUARD, extra: "cairn" },
  strand: { ground: ramp("#4a5563", "#5b6878", "#6f7d8f", "#8593a6"), tent: ramp("#1e2f4a", "#2c4468", "#3f5f8c", "#6489b5"), supply: ramp("#5b4a3a", "#78624d", "#947b62", "#b09779"), extra: "tearpools" },
  ossuary: { ground: ramp("#3a3530", "#4a443d", "#5c554c", "#706860"), tent: ramp("#3f3a36", "#57514b", "#736b63", "#958c82"), supply: VANGUARD, extra: "bones", pennant: rgb("#e7e5e4") },
  chainspire: { ground: ramp("#1c1416", "#2a1d20", "#3a282c", "#4d3539"), tent: ramp("#4a1219", "#6b1a26", "#8f2433", "#b83347"), supply: ramp("#2b2d33", "#41444d", "#5b5f6b", "#7a7f8c"), extra: "chains", metal: "#3f3f46" },
  desert: { ground: ramp("#a8773f", "#bd8a4f", "#cf9d61", "#e0b477"), tent: ramp("#7a1f1f", "#a32a2a", "#c94a3a", "#e07a5a"), supply: ramp("#a8977a", "#c4b293", "#dccbab", "#f0e2c4"), extra: "pots", stripes: true }
};

function campExtras(L, kind, c, T, f) {
  const g = L.ground, p = L.props;
  const side = c.far ? -1 : 1;     // props on the open half: +1 below the tents
  if (kind === "mushrooms") {
    [[c.cx + 62, c.cy + 18 * side], [c.cx - 72, c.cy + 14 * side], [c.cx + 50, c.cy + 30 * side]].forEach(([x, y], k) => {
      p.rect(x, y - 2, 1, 3, rgb("#e7e5e4"));
      p.ellipse(x + 0.5, y - 3, 2.5, 1.6, (px, py) => (py < y - 3 ? rgb(k % 2 ? "#f87171" : "#c084fc") : rgb(k % 2 ? "#b91c1c" : "#7e22ce")));
      p.put(x - 1, y - 4, rgb("#fef3c7"));
    });
  } else if (kind === "nets") {
    const x = c.cx + 46, y = c.cy + 26 * side;
    for (let i = 0; i < 16; i++) for (let j = 0; j < 7; j++) if ((i + j) % 3 === 0 || (i - j + 30) % 3 === 0) g.put(x + i, y + j, withA(rgb("#d6c7a1"), 200));
    p.line(c.cx - 74, c.cy + 20 * side, c.cx - 58, c.cy + 23 * side, rgb("#8b7355"), 2);   // driftwood
    p.put(c.cx - 66, c.cy + 20 * side, rgb("#a89070"));
  } else if (kind === "sandbags") {
    for (let k = 0; k < 6; k++) {
      const x = c.cx + 38 + (k % 3) * 7 + (k > 2 ? 3 : 0), y = c.cy + 22 * side - (k > 2 ? 4 : 0);
      p.ellipse(x, y, 3.8, 2.3, (px, py) => pick(ramp("#5c4a33", "#7d6648", "#9c845f", "#b9a079"), py < y ? 0.85 : 0.4, px, py));
    }
    p.line(c.cx - 74, c.cy + 24 * side, c.cx - 62, c.cy + 12 * side, rgb("#57534e"), 1);  // spears in the ground
    p.line(c.cx - 70, c.cy + 24 * side, c.cx - 64, c.cy + 10 * side, rgb("#57534e"), 1);
  } else if (kind === "crystals") {
    [[c.cx + 56, c.cy + 22 * side, 4], [c.cx - 70, c.cy + 18 * side, 3], [c.cx + 64, c.cy + 14 * side, 2]].forEach(([x, y, s], k) => {
      p.poly([[x - s, y], [x, y - s * 3], [x + s, y]], (px, py) => pick(ramp("#5b21b6", "#8b5cf6", "#c4b5fd", "#f5f3ff"), 0.9 - (px - x + s) / (2 * s), px, py));
      glow(L.fire, x, y, 10 + s, rgb("#a855f7"), 26 + Math.round(10 * Math.sin(ph(f) + k * 2)));
    });
  } else if (kind === "ore") {
    const x = c.cx + 44, y = c.cy + 24 * side;
    shadow(g, x + 6, y + 4, 9, 2);
    p.rect(x, y - 6, 13, 7, (px, py) => pick(WOOD, 0.7 - (px - x) / 16, px, py));
    [[x + 3, y - 7], [x + 7, y - 8], [x + 10, y - 7]].forEach(([ox, oy]) => p.ellipse(ox, oy, 2, 1.5, (px, py) => pick(ramp("#44403c", "#78716c", "#d97706", "#fbbf24"), py < oy ? 0.9 : 0.3, px, py)));
    p.ellipse(x + 2, y + 1, 1.6, 1.6, rgb("#292524")); p.ellipse(x + 11, y + 1, 1.6, 1.6, rgb("#292524"));
    p.line(x - 10, y, x - 3, y - 7, rgb("#7a5230")); p.line(x - 5, y - 9, x - 1, y - 5, rgb("#94a3b8"));   // pickaxe
  } else if (kind === "reeds") {
    [[c.cx - 70, c.cy + 18 * side], [c.cx + 68, c.cy + 18 * side]].forEach(([x, y], k) => {     // lanterns on posts
      p.rect(x, y - 14, 2, 14, WOOD[1]); p.rect(x - 1, y - 18, 4, 4, rgb("#3f3a44"));
      L.fire.rect(x, y - 17, 2, 2, rgb("#fde68a"));
      glow(L.fire, x + 1, y - 4, 14, rgb("#fde68a"), 26 + Math.round(6 * Math.sin(ph(f) + k)));
    });
  } else if (kind === "cairn") {
    const x = c.cx + 56, y = c.cy + 24 * side;
    shadow(g, x, y, 7, 2);
    [[0, 0, 5], [-1, -4, 4], [1, -7, 3], [0, -10, 2]].forEach(([dx, dy, r]) => p.ellipse(x + dx, y + dy, r, r * 0.6, (px, py) => pick(STONE, py < y + dy ? 0.9 : 0.35, px, py)));
  } else if (kind === "pots") {
    [[c.cx + 50, c.cy + 24 * side], [c.cx + 58, c.cy + 26 * side], [c.cx - 70, c.cy + 20 * side]].forEach(([x, y]) => {
      shadow(g, x, y, 4, 1.5);
      p.ellipse(x, y - 3, 3.5, 3.5, (px, py) => pick(ramp("#7c2d12", "#9a3412", "#c2410c", "#ea8a4a"), 0.85 - (px - x + 3) / 8, px, py));
      p.rect(x - 1, y - 8, 3, 2, rgb("#9a3412"));
    });
  } else if (kind === "tearpools") {
    [[c.cx + 54, c.cy + 22 * side, 9], [c.cx - 66, c.cy + 18 * side, 7]].forEach(([x, y, r], k) => {   // still pools of tears
      g.ellipse(x, y, r, r * 0.45, (px, py) => pick(ramp("#1e3a5f", "#2f6390", "#5fa8d3", "#bfe6ff"), 0.75 - (py - y) / (r * 0.9), px, py));
      glow(L.fire, x, y, r + 6, rgb("#7dd3fc"), 18 + Math.round(6 * Math.sin(ph(f) + k * 2)));
    });
    p.line(c.cx + 30, c.cy + 30 * side, c.cx + 44, c.cy + 27 * side, rgb("#6b5a48"), 2);     // driftwood from the wreck
  } else if (kind === "bones") {
    [[c.cx + 50, c.cy + 24 * side], [c.cx + 60, c.cy + 20 * side], [c.cx - 68, c.cy + 20 * side]].forEach(([x, y], k) => {
      p.line(x - 4, y, x + 4, y - (k % 2 ? 2 : -1), rgb("#d6d3d1"), 1);
      p.ellipse(x - 4, y, 1.2, 1.2, rgb("#e7e5e4")); p.ellipse(x + 4, y - (k % 2 ? 2 : -1), 1.2, 1.2, rgb("#e7e5e4"));
    });
    const x = c.cx + 64, y = c.cy + 30 * side;      // a skull on a cairn
    shadow(g, x, y, 5, 1.5);
    p.ellipse(x, y - 2, 4, 2.4, (px, py) => pick(STONE, py < y - 2 ? 0.8 : 0.3, px, py));
    p.ellipse(x, y - 6, 2.4, 2.2, rgb("#e7e5e4")); p.put(x - 1, y - 6, rgb("#292524")); p.put(x + 1, y - 6, rgb("#292524"));
  } else if (kind === "chains") {
    [[c.cx + 52, c.cy + 24 * side], [c.cx - 68, c.cy + 20 * side]].forEach(([x, y], k) => {   // chain posts
      shadow(g, x, y, 4, 1.5);
      p.rect(x - 1, y - 14, 3, 14, rgb("#3f3f46")); p.rect(x - 2, y - 15, 5, 2, rgb("#71717a"));
      for (let i = 0; i < 5; i++) p.ellipse(x + 3 + i * 3, y - 12 + i * 2 + (i > 2 ? -(i - 2) * 2 : 0), 1.4, 1, rgb(i % 2 ? "#a1a1aa" : "#71717a"));
      glow(L.fire, x, y - 8, 10, rgb("#f43f5e"), 16 + Math.round(6 * Math.sin(ph(f) + k)));
    });
  } else if (kind === "snow") {
    for (let k = 0; k < 40; k++) {
      const x = c.cx - 90 + hash(k, 3, 9) * 180, y = c.cy - 60 + hash(k, 4, 9) * 120;
      g.put(x, y, withA(rgb("#ffffff"), 200));
    }
  }
}

function paintCamp(L, f, camp, gate, T, seed) {
  const c = zs.campLayout(camp, gate);
  const g = L.ground, p = L.props;
  const rx = camp.w / 2, ry = camp.h / 2;
  if (T.deck) {     // swamp: a boardwalk platform on stilts instead of trodden earth
    const x0 = c.cx - rx + 4, y0 = c.cy - ry + 6, w = camp.w - 8, h = camp.h - 12;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const cut = (x - x0 < 6 || x0 + w - x <= 6) && (y - y0 < 6 || y0 + h - y <= 6) && Math.hypot(Math.max(x0 + 6 - x, x - (x0 + w - 7), 0), Math.max(y0 + 6 - y, y - (y0 + h - 7), 0)) > 6;
      if (cut) continue;
      const plank = Math.floor((y - y0) / 4), j = (y - y0) % 4, seam = (x + plank * 13) % 23 === 0;
      g.put(x, y, j === 3 || seam ? WOOD[0] : pick(WOOD, 0.45 + (hash(x >> 2, plank, seed) - 0.5) * 0.35 + (j === 0 ? 0.15 : 0), x, y));
    }
    for (let x = x0 + 2; x < x0 + w; x += 24) g.rect(x, y0 + h, 3, 4, WOOD[0]);          // stilts
  } else clearing(g, c.cx, c.cy, rx, ry, T.ground, seed);
  // the sanctuary ring: inlaid gold-and-stone dashes just inside the edge
  for (let k = 0; k < 64; k++) {
    if (k % 2) continue;
    const a = (k / 64) * Math.PI * 2, x = c.cx + Math.cos(a) * (rx - 7), y = c.cy + Math.sin(a) * (ry - 6);
    g.put(x, y, withA(GOLD[1], 170)); g.put(x + 1, y, withA(GOLD[0], 140));
  }

  // braziers at the corners (behind the ring)
  c.braziers.forEach(([x, y], k) => brazier(L, x + 2, y + 5, (f + k * 2) % FRAMES, k * 1.3, T.metal));

  // tents, banner, stores
  const cmd = c.command, sup = c.supply;
  pavilion(L, cmd.x, cmd.y, cmd.w, cmd.h, f, T.tent, GOLD, { snow: T.snow, stripes: T.stripes, pennant: T.pennant });
  ridgeTent(L, sup.x, sup.y, sup.w - 12, sup.h, f, T.supply, { snow: T.snow });
  flagPole(L, c.banner.x, c.banner.y, f, { height: 34, swallow: true });
  crate(p, c.crates.x - 2, c.crates.y - 8, 8, WOOD); crate(p, c.crates.x + 5, c.crates.y - 6, 6, WOOD);
  shadow(g, c.crates.x + 4, c.crates.y, 8, 2);
  barrel(p, c.barrels.x, c.barrels.y - 9, 7, 8, WOOD); barrel(p, c.barrels.x + 7, c.barrels.y - 7, 6, 7, WOOD);
  shadow(g, c.barrels.x + 6, c.barrels.y, 7, 2);
  sack(p, c.barrels.x - 6, c.barrels.y - 7, ramp("#8b7355", "#b49a74", "#d6c09a"));
  bedroll(g, c.bedroll.x, c.bedroll.y, T.supply);
  weaponRack(L, c.rack.x, c.rack.y, WOOD);
  campfire(L, c.fire.x, c.fire.y, f, STONE, seed % 7);
  campExtras(L, T.extra, c, T, f);
}

async function campDefs() {
  const { load } = await import(pathToFileURL(path.join(ROOT, "scripts/headless.mjs")).href);
  const { PLATFORMS } = await load("js/world/platforms.js");
  const { FRONTIERS } = await load("js/world/frontiers.js");
  return { ...PLATFORMS, ...FRONTIERS };
}

// ==================== HUB: BARRACKS SANCTUARY ====================
const SLATE = ramp("#1c2333", "#28324a", "#36435f", "#475778", "#5d6f94");
const PLAZA = { mortar: rgb("#121826"), stone: ramp("#1f2937", "#2b3648", "#36455a", "#44546b", "#53647c") };

function longhouse(L, x, by, w, f, opts) {
  const b = L.buildings, wallH = 24, roofH = 30, eave = by - 8 - wallH;
  shadow(L.ground, x + w / 2 + 4, by - 2, w / 2 + 4, 5, 90);
  // stone footing
  b.rect(x, by - 8, w, 8, (px, py) => pick(STONE, 0.5 + (hash(px >> 2, py >> 2, 11) - 0.5) * 0.5 - (px - x) / w * 0.2 + (py === by - 8 ? 0.2 : 0), px, py));
  // timber-framed walls, two lit windows and a door
  timberWall(b, x, eave, w, wallH, ramp("#9c8f7a", "#bfb29a", "#d9cdb4", "#ece2cc"), WOOD, 7);
  const door = opts.door;
  b.rect(x + door, eave + 6, 12, wallH + 2, (px, py) => pick(WOOD, 0.35 + ((px - x - door) % 4 === 0 ? -0.15 : 0) + (py === eave + 6 ? 0.3 : 0), px, py));
  b.rect(x + door, eave + 4, 12, 2, WOOD[0]);
  b.put(x + door + 9, eave + 18, rgb("#ffd166"));
  opts.windows.forEach((wx, k) => windowLit(b, x + wx, eave + 7, 8, 7, WOOD[0], Math.sin(ph(f) + k * 2) * 0.5 + 0.5));
  // crest over the door: crossed swords on a shield
  const sx = x + door + 6, sy = eave - 1;
  b.poly([[sx - 4, sy - 5], [sx + 4, sy - 5], [sx + 4, sy], [sx, sy + 3], [sx - 4, sy]], (px, py) => pick(ramp("#1e3a8a", "#2563eb", "#60a5fa"), 0.8 - (px - sx + 4) / 9, px, py));
  b.line(sx - 3, sy - 4, sx + 3, sy + 1, rgb("#f1f5f9")); b.line(sx + 3, sy - 4, sx - 3, sy + 1, rgb("#f1f5f9"));
  // slate roof: front slope from the ridge to the eave, with an overhang
  shingles(b, x - 4, x + w + 4, eave - roofH, eave + 1, SLATE, 21 + x, { inset: 6, rowH: 4, sw: 7 });
  b.rect(x - 6 + 6, eave - roofH - 2, w + 12 - 12, 2, (px) => pick(SLATE, 0.95, px, 0));    // ridge cap
  b.rect(x - 4, eave, w + 8, 1, shade(SLATE[0], -0.3));
  // chimney with smoke
  const chx = x + opts.chimney;
  b.rect(chx, eave - roofH - 8, 8, 16, (px, py) => pick(STONE, 0.75 - (px - chx) / 9 + ((py - eave) % 3 === 0 ? -0.2 : 0), px, py));
  b.rect(chx - 1, eave - roofH - 9, 10, 2, STONE[1]);
  smoke(L.fire, chx + 3, eave - roofH - 12, f, 24, x, "#94a3b8");
  // warm light spilling from the windows onto the ground
  opts.windows.forEach((wx) => glow(L.fire, x + wx + 4, by + 3, 10, rgb("#ffb347"), 18));
  // lean-to: firewood stack or barrels against the side
  if (opts.firewood) {
    const fx = x + w - 20;
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4 - (r ? 1 : 0); k++) {
      const lx = fx + k * 4 + r * 2, ly = by - 3 - r * 3;
      L.props.ellipse(lx, ly, 2, 1.6, (px, py) => (Math.hypot(px - lx, py - ly) < 0.9 ? rgb("#d6a35c") : WOOD[2]));
    }
  } else { barrel(L.props, x + 4, by - 8, 6, 7, WOOD); barrel(L.props, x + 11, by - 7, 6, 6, WOOD); }
}

function paintBarracks(L, f) {
  const W = 300, top = 76, H = 296, g = L.ground;
  // plaza: slate flagstones, a darker border band with a gilded inner trim, curb gaps at the four exits
  flagstones(g, 0, top, W, H - top, PLAZA, 31, { moss: rgb("#2f4a3a") });
  const gapN = [W / 2 - 22, W / 2 + 22], gapW = [top + 110 - 22, top + 110 + 22];
  for (let y = top; y < H; y++) for (let x = 0; x < W; x++) {
    const e = Math.min(x, W - 1 - x, y - top, H - 1 - y);
    const inGap = ((x > gapN[0] && x < gapN[1]) && (y - top < 8 || H - 1 - y < 8)) || ((y > gapW[0] && y < gapW[1]) && (x < 8 || W - 1 - x < 8));
    if (e < 6 && !inGap) g.put(x, y, pick(STONE, (e === 0 ? 0.2 : e === 1 ? 0.95 : 0.55) + (hash(x >> 2, y >> 2, 3) - 0.5) * 0.3 + ((x + y) % 7 === 0 && e > 1 ? -0.25 : 0), x, y));
    if (e === 7 && !inGap) g.put(x, y, withA(GOLD[(x + y) % 3 ? 1 : 2], 210));
  }
  // centre sigil: inlaid gold ring and an eight-point star, glowing cyan
  const cx = W / 2, cy = top + 110;
  for (let y = cy - 36; y <= cy + 36; y++) for (let x = cx - 36; x <= cx + 36; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy), a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx);
    if (d > 33 && d < 35.5) g.put(x, y, pick(GOLD, d < 34.2 ? 0.95 : 0.4, x, y));
    else if (d > 29 && d < 30.5) g.put(x, y, GOLD[0]);
    else if (d < 29) {
      const star = 18 + 9 * Math.pow(Math.abs(Math.cos(a * 4)), 6);
      if (Math.abs(d - star) < 0.8) g.put(x, y, rgb("#67e8f9"));
      else if (d < star && d > 6) g.put(x, y, pick(ramp("#155e75", "#0e7490", "#0891b2"), 0.4 + Math.cos(a * 8) * 0.2, x, y));
      if (Math.abs(d - 6) < 0.7) g.put(x, y, GOLD[2]);
    }
  }
  const pulse = 0.5 + 0.5 * Math.sin(ph(f));
  glow(L.fire, cx, cy, 40, rgb("#22d3ee"), 14 + Math.round(pulse * 14), 1);
  for (let k = 0; k < 8; k++) {                       // rune studs around the ring, lighting in turn
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8, x = cx + Math.cos(a) * 31.7, y = cy + Math.sin(a) * 31.7;
    L.fire.rect(Math.round(x) - 1, Math.round(y) - 1, 2, 2, k % FRAMES === f || (k + 3) % FRAMES === f ? rgb("#cffafe") : rgb("#22d3ee"));
  }
  // longhouses behind the north edge
  longhouse(L, 8, top - 2, 114, f, { door: 74, windows: [14, 40], chimney: 20, firewood: false });
  longhouse(L, 178, top - 2, 114, f, { door: 26, windows: [62, 88], chimney: 84, firewood: true });
  // banners flanking the north exit, braziers in the corners
  flagPole(L, W / 2 - 30, top + 6, f, { height: 40, fw: 14, fh: 11, swallow: true });
  flagPole(L, W / 2 + 26, top + 6, (f + 3) % FRAMES, { height: 40, fw: 14, fh: 11, swallow: true, cloth: ramp("#1e3a8a", "#1d4ed8", "#2563eb", "#60a5fa") });
  [[14, top + 14], [W - 14, top + 14], [14, H - 14], [W - 14, H - 14]].forEach(([x, y], k) => brazier(L, x, y + 5, (f + k) % FRAMES, k, "#2a3347"));
  // training corner and stores along the side walls (clear of where the souls wander)
  weaponRack(L, 12, top + 66, WOOD);
  weaponRack(L, W - 30, top + 66, WOOD);
  dummy(L, 20, top + 150);
  dummy(L, W - 22, top + 150);
  crate(L.props, W - 26, H - 40, 8, WOOD); crate(L.props, W - 18, H - 36, 6, WOOD); shadow(g, W - 18, H - 30, 9, 2);
  barrel(L.props, 16, H - 42, 7, 8, WOOD); barrel(L.props, 23, H - 39, 6, 7, WOOD); shadow(g, 22, H - 31, 8, 2);
}

// ==================== HUB: IMPERIAL CITADEL ====================
const CSTONE = ramp("#1a2030", "#252d40", "#323c52", "#414c64", "#536079", "#6b7891");
const ROOF = ramp("#14213d", "#1d2f57", "#274172", "#33558f", "#4a6fae");

function bricks(img, x0, y0, w, h, seed, light = (x) => 0, rows = 5, bw = 9, pal = CSTONE) {
  for (let y = y0; y < y0 + h; y++) {
    const r = Math.floor((y - y0) / rows), j = (y - y0) % rows;
    for (let x = x0; x < x0 + w; x++) {
      const off = r % 2 ? Math.floor(bw / 2) : 0, k = Math.floor((x - x0 + off) / bw), i = (x - x0 + off) % bw;
      let v = 0.45 + (hash(k, r, seed) - 0.5) * 0.25 + light(x, y);
      if (j === rows - 1 || i === bw - 1) v -= 0.32;
      else if (j === 0) v += 0.1;
      img.put(x, y, pick(pal, v, x, y));
    }
  }
}

function roundTower(L, x, top, w, bottom, f, flagCol, seed) {
  const b = L.buildings, cx = x + w / 2;
  const lit = (px) => { const u = (px - x) / w; return 0.28 - Math.abs(u - 0.3) * 0.75; };
  bricks(b, x, top, w, bottom - top, seed, (px) => lit(px), 5, 8);
  // curved base
  b.ellipse(cx, bottom, w / 2, 4, (px, py) => (py >= bottom ? pick(CSTONE, 0.3 + lit(px), px, py) : null));
  // corbelled gallery under the roof
  b.rect(x - 3, top, w + 6, 6, (px, py) => pick(CSTONE, 0.62 + lit(px) + (py === top ? 0.2 : 0) - ((px - x) % 6 === 0 ? 0.25 : 0), px, py));
  for (let px = x - 2; px < x + w + 2; px += 6) b.rect(px, top + 6, 3, 3, (qx, qy) => pick(CSTONE, 0.4 + lit(qx), qx, qy));
  // windows: arrow slits and one lit window
  [[cx - 10, top + 40], [cx + 8, top + 40], [cx - 1, top + 78]].forEach(([wx, wy]) => {
    b.rect(wx, wy, 3, 11, rgb("#05070d")); b.rect(wx - 1, wy - 1, 5, 1, CSTONE[4]);
  });
  windowLit(b, cx - 4, top + 112, 8, 10, CSTONE[0], 0.5 + 0.5 * Math.sin(ph(f) + seed));
  // ivy
  const IVY = ramp("#0f3d22", "#14532d", "#166534", "#15803d", "#4ade80");
  for (let v = 0; v < 3; v++) {
    let px = x + 3 + v * 6 + Math.floor(hash(v, 0, seed) * 4), py = bottom - 1;
    const len = 30 + Math.floor(hash(v, 1, seed) * 50);
    for (let k = 0; k < len; k++) {
      py--; px += hash(k, v, seed) < 0.3 ? 1 : hash(k, v, seed) > 0.75 ? -1 : 0;
      b.put(px, py, IVY[1]);
      if (k % 3 === 0) { b.put(px - 1, py, IVY[3]); b.put(px + 1, py + 1, IVY[2]); }
      if (k % 5 === 2) { b.put(px + 1, py - 1, IVY[4]); b.put(px - 1, py + 1, IVY[2]); }
    }
  }
  // conical slate roof with eaves, a gold finial and a pennant
  const eaveY = top, apexY = top - 38, ov = 6;
  for (let y = apexY; y <= eaveY; y++) {
    const t = (y - apexY) / (eaveY - apexY), half = (w / 2 + ov) * Math.pow(t, 0.9);
    const row = Math.floor((y - apexY) / 4), j = (y - apexY) % 4;
    for (let px = Math.round(cx - half); px < Math.round(cx + half); px++) {
      const u = (px - (cx - half)) / Math.max(1, half * 2);
      let v = 0.75 - Math.abs(u - 0.3) * 0.9 - j * 0.07;
      if (j === 3) v -= 0.25;
      if (((px + row * 3) % 6) === 0) v -= 0.12;
      b.put(px, y, pick(ROOF, v, px, y));
    }
  }
  b.rect(Math.round(cx - w / 2 - ov), eaveY, w + ov * 2, 1, shade(ROOF[0], -0.3));
  b.rect(Math.round(cx) - 1, apexY - 3, 2, 3, GOLD[2]);
  b.rect(Math.round(cx), apexY - 12, 1, 9, rgb("#ffd166"));
  for (let i = 0; i < 12; i++) {
    const wv = Math.round(Math.sin(ph(f) - i * 0.6) * (i / 12) * 2);
    const hh = 6 - Math.floor(i / 2.4);
    for (let j = 0; j < hh; j++) L.props.put(Math.round(cx) + 1 + i, apexY - 12 + j + wv + Math.floor((6 - hh) / 2), pick(flagCol, 0.75 + Math.cos(ph(f) - i * 0.6) * 0.25 - j * 0.05, i, j));
  }
}

function battlements(img, x, y, w, seed) {
  img.rect(x, y + 4, w, 4, (px, py) => pick(CSTONE, 0.6 + (py === y + 4 ? 0.25 : 0), px, py));
  for (let px = x; px < x + w; px += 10) img.rect(px, y - 2, 6, 6, (qx, qy) => pick(CSTONE, 0.7 - (qx - px) / 10 + (qy === y - 2 ? 0.3 : 0), qx, qy));
}

function paintCastle(L, f) {
  const g = L.ground, b = L.buildings;
  const R = (y) => y + 20;   // castle-relative y → canvas y
  // ---- audience dais (castle-relative x 50..270, y 191..319): marble paving, a royal carpet, steps ----
  const dx0 = 50, dy0 = R(191), dw = 220, dh = 128;
  const MARBLE = { mortar: rgb("#6b6457"), stone: ramp("#8f877a", "#a59d8f", "#bbb3a4", "#d1c9b9", "#e4ddcf") };
  flagstones(g, dx0, dy0, dw, dh, MARBLE, 77, { rowH: 8, minW: 12, varW: 6 });
  for (let y = dy0; y < dy0 + dh; y++) for (let x = dx0; x < dx0 + dw; x++) {
    const e = Math.min(x - dx0, dx0 + dw - 1 - x, y - dy0, dy0 + dh - 1 - y);
    if (e < 4) g.put(x, y, pick(CSTONE, e === 0 ? 0.1 : 0.55 + (hash(x >> 2, y >> 1, 5) - 0.5) * 0.3, x, y));
    else if (e === 5) g.put(x, y, GOLD[1]);
  }
  for (let s = 0; s < 3; s++) g.rect(dx0 + 8 + s * 4, dy0 + dh - 4 + s * 0 - (2 - s) * 0, dw - 16 - s * 8, 1, CSTONE[1]);
  // carpet from the gate to the dais' front steps
  const kx = 146, kw = 28;
  g.rect(kx, R(186), kw, dy0 + dh - 6 - R(186), (x, y) => {
    if (x === kx || x === kx + kw - 1) return GOLD[0];
    if (x === kx + 1 || x === kx + kw - 2) return GOLD[2];
    const d = Math.abs(x - (kx + kw / 2 - 0.5)), motif = (y - R(186)) % 16;
    if (d < 2.5 && (motif === 7 || motif === 8) || (d < 1 && motif > 5 && motif < 10)) return GOLD[1];
    return pick(ramp("#5b0f1a", "#7f1d2a", "#9f2433", "#b9323f"), 0.55 - d / 30 + (hash(x, y, 9) - 0.5) * 0.1, x, y);
  });
  // planters with clipped hedges along the dais sides
  [[60, R(250)], [60, R(282)], [250, R(250)], [250, R(282)]].forEach(([x, y]) => {
    shadow(g, x + 5, y + 6, 9, 2);
    L.props.rect(x - 2, y, 14, 6, (px, py) => pick(CSTONE, 0.75 - (px - x) / 16 + (py === y ? 0.2 : 0), px, py));
    L.props.ellipse(x + 5, y - 3, 7, 5, (px, py) => pick(ramp("#14532d", "#166534", "#15803d", "#22c55e"), 0.8 - (px - x) / 16 - (py - y + 6) / 16 + (hash(px, py, 4) - 0.5) * 0.25, px, py));
  });
  // braziers on pedestals at the dais' top corners
  [[66, R(216)], [254, R(216)]].forEach(([x, y], k) => {
    L.props.rect(x - 4, y - 4, 9, 6, (px, py) => pick(CSTONE, 0.7 - (px - x + 4) / 10 + (py === y - 4 ? 0.25 : 0), px, py));
    brazier(L, x, y - 4, (f + k * 3) % FRAMES, k, "#2a3347");
  });

  // ---- shadow of the whole fortress ----
  g.ellipse(160, R(185), 156, 16, (x, y) => [6, 8, 18, dither(x, y) < 0.9 ? 110 : 0]);

  // ---- rear keep with a hipped slate roof, battlements and the rose window ----
  bricks(b, 80, R(18), 160, 112, 41, (x) => -(x - 80) / 160 * 0.18);
  shingles(b, 76, 244, R(-2), R(12), ROOF, 51, { inset: 18, rowH: 4, sw: 8 });
  b.rect(98, R(-4), 124, 2, ROOF[3]);
  // dormer windows in the roof
  [118, 194].forEach((x) => {
    b.poly([[x - 6, R(11)], [x, R(1)], [x + 6, R(11)]], (px, py) => pick(ROOF, 0.8 - (px - x + 6) / 14, px, py));
    windowLit(b, x - 2, R(5), 4, 5, CSTONE[0], 0.6);
  });
  battlements(b, 80, R(12), 160, 61);
  // main flag on the ridge
  b.rect(159, R(-19), 2, 16, rgb("#ffd166"));
  for (let i = 0; i < 22; i++) {
    const wv = Math.round(Math.sin(ph(f) - i * 0.45) * (i / 22) * 3);
    const hh = 12 - Math.floor(i / 2.2);
    for (let j = 0; j < hh; j++) {
      const ex = i - 7, ey = j - 5 + Math.floor((12 - hh) / 2);
      const gold = (Math.abs(ex) <= 1 && Math.abs(ey) <= 3) || (Math.abs(ey) <= 0 && Math.abs(ex) <= 3);
      L.props.put(161 + i, R(-18) + j + wv + Math.floor((12 - hh) / 2), gold ? GOLD[2] : pick(VANGUARD, 0.7 + Math.cos(ph(f) - i * 0.45) * 0.3 - j * 0.03, i, j));
    }
  }
  // rose window
  const rcx = 160, rcy = R(66), pulse = 0.5 + 0.5 * Math.sin(ph(f));
  b.ellipse(rcx, rcy, 16, 16, CSTONE[4]);
  b.ellipse(rcx, rcy, 14, 14, rgb("#05070d"));
  for (let y = rcy - 13; y <= rcy + 13; y++) for (let x = rcx - 13; x <= rcx + 13; x++) {
    const d = Math.hypot(x + 0.5 - rcx, y + 0.5 - rcy), a = Math.atan2(y + 0.5 - rcy, x + 0.5 - rcx);
    if (d > 12.6) continue;
    const spoke = Math.abs(Math.sin(a * 4)) < 0.16 || Math.abs(d - 6) < 0.6 || d < 2;
    const petal = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 8) % 2;
    b.put(x, y, spoke ? GOLD[1] : mix(rgb(petal ? (d < 6 ? "#e63946" : "#2563eb") : (d < 6 ? "#f59e0b" : "#7c3aed")), rgb("#e0f2fe"), Math.max(0, 0.2 - d / 40 + pulse * 0.25)));
  }
  glow(L.fire, rcx, rcy, 22, rgb("#38bdf8"), 12 + Math.round(pulse * 12), 1);
  // banners hanging from the keep beside the rose window
  [[110, R(40)], [196, R(40)]].forEach(([x, y], k) => hangingBanner(b, x, y, 14, 34, (f + k * 3) % FRAMES, VANGUARD, GOLD[2], "crown"));

  // ---- twin round towers ----
  roundTower(L, 16, R(36), 64, R(185), f, ramp("#1e3a8a", "#2563eb", "#3b82f6", "#93c5fd"), 3);
  roundTower(L, 240, R(36), 64, R(185), (f + 2) % FRAMES, ramp("#7f1d1d", "#b91c1c", "#e63946", "#fca5a5"), 9);

  // ---- front curtain wall and the gatehouse ----
  bricks(b, 80, R(118), 160, 67, 71, (x) => -(x - 80) / 160 * 0.15 + 0.05);
  battlements(b, 80, R(110), 160, 81);
  // gate arch: voussoirs, raised portcullis, darkness inside
  const gx = 160, gy = R(185), gr = 24;
  for (let y = gy - gr - 34; y < gy; y++) for (let x = gx - gr - 6; x <= gx + gr + 6; x++) {
    const archTop = gy - 14;
    const dx = x + 0.5 - gx, dy = Math.min(0, y + 0.5 - archTop), d = Math.hypot(dx, dy);
    const inner = y >= archTop ? Math.abs(dx) < gr : d < gr;
    const ring = y >= archTop ? Math.abs(dx) >= gr && Math.abs(dx) < gr + 5 : d >= gr && d < gr + 5;
    if (inner) {
      const t = (y - (archTop - gr)) / (gr + 14);
      b.put(x, y, mix(rgb("#020409"), rgb("#1b2440"), Math.max(0, t - 0.55) * 1.2));
    } else if (ring) {
      const seg = y >= archTop ? Math.floor((y - archTop) / 5) : Math.floor(Math.atan2(dy, dx) / -0.26);
      b.put(x, y, pick(CSTONE, (seg % 2 ? 0.85 : 0.6) - (x > gx ? 0.15 : 0), x, y));
    }
  }
  b.rect(gx - 3, gy - 14 - gr - 6, 6, 7, GOLD[1]); b.rect(gx - 2, gy - 14 - gr - 5, 4, 1, GOLD[2]);   // keystone
  for (let k = -3; k <= 3; k++) {                                  // portcullis teeth, raised
    const x = gx + k * 6;
    const yTop = gy - 14 - Math.round(Math.sqrt(Math.max(0, gr * gr - (k * 6) ** 2)));
    b.rect(x, yTop, 1, gy - 38 - yTop + 14, rgb("#4b5563")); b.put(x, gy - 24, rgb("#9ca3af"));
  }
  b.rect(gx - gr + 2, gy - 30, gr * 2 - 4, 1, rgb("#4b5563"));
  // torches beside the gate
  [gx - 36, gx + 34].forEach((x, k) => {
    b.rect(x, gy - 22, 3, 6, rgb("#3a2f3f")); b.rect(x - 1, gy - 23, 5, 2, rgb("#57534e"));
    flames(L.fire, x + 1, gy - 24, 5, 7, (f + k * 3) % FRAMES, k);
    glow(L.fire, x + 1, gy - 18, 14, rgb("#ff9a3c"), 22, 1);
  });
  // wall banners either side
  [[92, R(122)], [214, R(122)]].forEach(([x, y], k) => hangingBanner(b, x, y, 14, 32, (f + k * 2) % FRAMES, ramp("#1e3a8a", "#1d4ed8", "#2563eb", "#60a5fa"), GOLD[2], "sword"));
  // steps down from the gate to the dais
  for (let s = 0; s < 3; s++) g.rect(gx - 30 + s * 0, gy + s * 2, 60, 2, (x, y) => pick(CSTONE, 0.75 - s * 0.15 + (y % 2 ? -0.2 : 0), x, y));
}

// ==================== ASHFALL: EMBERHOLD ====================
const DWARF = ramp("#1f1916", "#2c2420", "#3a302a", "#4a3d34", "#5c4c40", "#706052");
const BASALT = { mortar: rgb("#1a1412"), stone: ramp("#2a2320", "#352d29", "#40372f", "#4d433a") };

function paintEmberhold(L, f, camp, gate) {
  const g = L.ground, b = L.buildings, p = L.props, O = 24;   // camp-relative y → canvas y = y + O
  const W = camp.w, H = camp.h;
  flagstones(g, 0, O, W, H, BASALT, 88, { rowH: 8, minW: 9, varW: 6 });
  // ember cracks glowing between some cobbles
  for (let k = 0; k < 30; k++) {
    const x = 20 + Math.floor(hash(k, 1, 88) * (W - 40)), y = O + 20 + Math.floor(hash(k, 2, 88) * (H - 40));
    for (let i = 0; i < 6; i++) g.put(x + i, y + Math.round(Math.sin(i + k) * 1), withA(rgb("#ff7a1a"), 120 + (i % 2) * 60));
  }
  // central square: an ember rune that breathes
  const rcx = 178, rcy = O + 112, pulse = 0.5 + 0.5 * Math.sin(ph(f));
  for (let y = rcy - 20; y <= rcy + 20; y++) for (let x = rcx - 42; x <= rcx + 42; x++) {
    const d1 = Math.hypot((x + 0.5 - rcx) / 40, (y + 0.5 - rcy) / 18), d2 = Math.hypot((x + 0.5 - rcx) / 26, (y + 0.5 - rcy) / 11);
    if (Math.abs(d1 - 1) < 0.04 || Math.abs(d2 - 1) < 0.06) L.fire.put(x, y, withA(rgb(pulse > 0.5 ? "#fdba74" : "#fb923c"), 200));
    else if (d2 < 0.2) L.fire.put(x, y, withA(rgb("#ff7a1a"), 150));
  }
  glow(L.fire, rcx, rcy, 34, rgb("#ff7a1a"), 10 + Math.round(pulse * 10));
  // low stone wall with the gate gap
  const gL = gate.x - camp.x - 38, gR = gate.x - camp.x + 38;
  const wall = (x, y, w, h) => b.rect(x, y, w, h, (px, py) => pick(STONE, 0.55 + (hash(px >> 2, py >> 1, 6) - 0.5) * 0.45 + (py === y ? 0.3 : 0) - ((px + (py >> 2) * 3) % 8 === 0 ? 0.25 : 0), px, py));
  wall(0, O, W, 6); wall(0, O, 6, H); wall(W - 6, O, 6, H); wall(0, O + H - 6, gL, 6); wall(gR, O + H - 6, W - gR, 6);
  [gL - 4, gR].forEach((x) => { b.rect(x, O + H - 14, 6, 14, (px, py) => pick(STONE, 0.8 - (px - x) / 8 + (py === O + H - 14 ? 0.2 : 0), px, py)); });

  // smithy (Brakka): stone walls, tiled roof, chimney smoke, a roaring furnace and the anvil
  const TILE = ramp("#3f1810", "#5c2416", "#7c3220", "#9c4229", "#b85636");
  shadow(g, 52, O + 64, 40, 5, 100);
  bricks(b, 16, O + 28, 70, 36, 91, (x) => 0.12 - (x - 16) / 70 * 0.25, 5, 7, DWARF);
  shingles(b, 10, 92, O + 8, O + 29, TILE, 92, { inset: 8, rowH: 4, sw: 6 });
  b.rect(64, O - 14, 12, 34, (px, py) => pick(STONE, 0.7 - (px - 64) / 12 + ((py - O) % 4 === 0 ? -0.2 : 0), px, py));
  b.rect(63, O - 16, 14, 3, STONE[1]);
  smoke(L.fire, 70, O - 20, f, 26, 1, "#78716c");
  smoke(L.fire, 68, O - 26, (f + 3) % FRAMES, 20, 2, "#57534e");
  b.rect(24, O + 40, 26, 24, rgb("#1c1917"));
  b.rect(26, O + 42, 22, 22, rgb("#0c0a09"));
  flames(L.fire, 37, O + 63, 18, 13 + Math.round(Math.sin(ph(f)) * 2), f, 3);
  glow(L.fire, 37, O + 68, 26, rgb("#ff7a1a"), 40 + Math.round(10 * Math.sin(ph(f))));
  b.rect(56, O + 38, 18, 26, (px, py) => pick(WOOD, 0.3 + ((px - 56) % 4 === 0 ? -0.15 : 0), px, py));
  b.rect(56, O + 36, 18, 2, STONE[0]);
  shadow(g, 62, O + 84, 10, 2);
  p.rect(52, O + 72, 20, 4, (px, py) => pick(ramp("#27272a", "#3f3f46", "#71717a", "#a1a1aa"), py === O + 72 ? 0.95 : 0.55 - (px - 52) / 40, px, py));
  p.rect(49, O + 72, 4, 2, rgb("#71717a"));
  p.rect(57, O + 76, 10, 7, rgb("#3f3f46"));
  if (f % 3 === 0) { L.fire.put(60 + f, O + 70, rgb("#fde047")); L.fire.put(63, O + 68 - f, rgb("#fb923c")); }

  // thane's hall (Durgrim): wide hall, gold-trimmed roof, banners and steps
  shadow(g, 168, O + 62, 54, 6, 100);
  bricks(b, 120, O + 26, 96, 34, 93, (x) => 0.1 - (x - 120) / 96 * 0.22, 5, 9, DWARF);
  shingles(b, 112, 224, O + 2, O + 27, TILE, 94, { inset: 10, rowH: 4, sw: 7 });
  b.rect(112, O + 26, 112, 1, GOLD[1]);
  b.rect(122, O + 1, 92, 1, GOLD[2]);
  b.poly([[158, O + 60], [158, O + 40], [168, O + 33], [178, O + 40], [178, O + 60]], (px, py) => pick(WOOD, 0.3 + ((px - 158) % 5 === 0 ? -0.15 : 0), px, py));
  b.rect(167, O + 46, 2, 2, GOLD[2]);
  [[152, O + 60, 32], [148, O + 63, 40]].forEach(([x, y, w], k) => b.rect(x, y, w, 3, (px, py) => pick(STONE, (k ? 0.45 : 0.7) + (py === y ? 0.2 : 0), px, py)));
  [[128, O + 32], [196, O + 32]].forEach(([x, y], k) => hangingBanner(b, x, y, 11, 22, (f + k * 3) % FRAMES, ramp("#450a0a", "#7f1d1d", "#991b1b", "#dc2626"), GOLD[2], "hammer"));

  // repair bench (Hilde): workbench, tool rack and a spinning grindstone
  shadow(g, 36, O + 154, 20, 3);
  p.rect(16, O + 138, 34, 6, (px, py) => pick(WOOD, py === O + 138 ? 0.9 : 0.55 - (px - 16) / 50, px, py));
  p.rect(18, O + 144, 3, 9, WOOD[1]); p.rect(45, O + 144, 3, 9, WOOD[1]);
  b.rect(16, O + 120, 34, 2, WOOD[2]);
  [[20, 3, 8], [26, 2, 10], [32, 5, 3], [40, 2, 7]].forEach(([x, w, h]) => b.rect(x, O + 122, w, h, ramp("#94a3b8", "#cbd5e1")[x % 2]));
  const a = (f / FRAMES) * Math.PI * 2;
  p.ellipse(66, O + 146, 7, 7, (px, py) => pick(ramp("#44403c", "#57534e", "#78716c", "#a8a29e"), 0.8 - (px - 59) / 18 - (py - O - 139) / 22, px, py));
  p.line(66, O + 146, Math.round(66 + Math.cos(a) * 6), Math.round(O + 146 + Math.sin(a) * 6), rgb("#292524"));
  p.rect(64, O + 152, 5, 4, WOOD[1]);
  if (f % 2 === 0) { L.fire.put(74, O + 143, rgb("#fde047")); L.fire.put(76, O + 141, rgb("#fb923c")); }

  // Pip's stall: striped awning, counter of potions, crates and sacks
  shadow(g, 278, O + 62, 34, 4);
  for (let k = 0; k < 8; k++) for (let j = 0; j < 10; j++) {
    const x0 = 244 + k * 8;
    for (let i = 0; i < 8; i++) b.put(x0 + i, O + 20 + j + Math.round(Math.sin(ph(f) + (x0 + i) * 0.2) * (j / 10)), pick(k % 2 ? ramp("#a8a29e", "#d6d3d1", "#f5f5f4") : ramp("#7f1d1d", "#b91c1c", "#ef4444"), 0.85 - j / 14, x0 + i, j));
  }
  for (let x = 244; x < 308; x += 4) b.rect(x, O + 30, 3, 2, rgb("#7f1d1d"));
  b.rect(246, O + 32, 3, 28, WOOD[1]); b.rect(303, O + 32, 3, 28, WOOD[1]);
  p.rect(246, O + 50, 60, 10, (px, py) => pick(WOOD, py === O + 50 ? 0.95 : 0.5 - (px - 246) / 100 + ((px - 246) % 10 === 0 ? -0.2 : 0), px, py));
  [["#38bdf8", 254], ["#a855f7", 264], ["#ef4444", 274], ["#22c55e", 284], ["#facc15", 294]].forEach(([c, x]) => {
    p.rect(x, O + 45, 5, 5, (px, py) => pick(ramp(c, c), 0.5, px, py));
    p.rect(x + 1, O + 45, 1, 2, rgb("#ffffff")); p.rect(x + 1, O + 43, 3, 2, WOOD[3]);
  });
  crate(p, 286, O + 62, 10, WOOD); sack(p, 270, O + 64, ramp("#a8a29e", "#d6d3d1", "#f5f5f4"));

  // dwarf hut: stone walls, turf roof, round door, lantern
  shadow(g, 274, O + 158, 32, 4, 100);
  bricks(b, 244, O + 122, 56, 36, 97, (x) => 0.1 - (x - 244) / 56 * 0.2, 5, 7, DWARF);
  b.ellipse(272, O + 122, 32, 12, (px, py) => (py <= O + 124 ? pick(ramp("#3f2d1d", "#57534e", "#6b7f3a", "#86a34a"), 0.9 - (py - O - 110) / 16 - (px - 240) / 90 + (hash(px, py, 4) - 0.5) * 0.3, px, py) : null));
  b.ellipse(272, O + 146, 8, 8, (px, py) => (py <= O + 146 ? rgb("#1c1917") : null));
  b.rect(264, O + 146, 16, 12, rgb("#1c1917"));
  b.ellipse(272, O + 147, 6, 6, (px, py) => (py <= O + 147 ? pick(WOOD, 0.4 + ((px - 266) % 3 === 0 ? -0.15 : 0), px, py) : null));
  b.rect(266, O + 147, 12, 11, (px, py) => pick(WOOD, 0.4 + ((px - 266) % 3 === 0 ? -0.15 : 0), px, py));
  b.put(275, O + 152, GOLD[2]);
  b.rect(286, O + 130, 4, 6, rgb("#3f3a44"));
  L.fire.rect(287, O + 132, 2, 3, mix(rgb("#fde047"), rgb("#fff7d6"), 0.5 + 0.5 * Math.sin(ph(f))));
  glow(L.fire, 288, O + 140, 14, rgb("#fde68a"), 22);

  // braziers inside the wall
  [[14, 94], [W - 20, 94], [14, H - 22], [W - 20, H - 22]].forEach(([x, y], k) => brazier(L, x + 3, O + y + 6, (f + k * 2) % FRAMES, k + 2));
}

// ==================== REGISTRY ====================
export async function zoneSubjects() {
  const defs = await campDefs();
  const out = {
    "zone/barracks": () => save("barracks", 300, 296, paintBarracks),
    "zone/castle": () => save("castle", 320, 340, paintCastle)
  };
  for (const [id, def] of Object.entries(defs)) {
    if (!def.camp || !def.gate) continue;
    if (def.village) {
      out[`zone/${id}`] = () => save(id, def.camp.w, def.camp.h - zs.ZONE_ART[id].at[1], (L, f) => paintEmberhold(L, f, def.camp, def.gate));
      continue;
    }
    const T = CAMP_THEMES[id] || CAMP_THEMES[def.theme];
    if (!T) continue;     // a new map: add its theme above (falls back to the code-drawn camp until then)
    const c = zs.campLayout(def.camp, def.gate);
    out[`zone/${id}`] = () => save(id, c.W, c.H, (L, f) => paintCamp(L, f, def.camp, def.gate, T, def.seed || 1));
  }
  return out;
}
