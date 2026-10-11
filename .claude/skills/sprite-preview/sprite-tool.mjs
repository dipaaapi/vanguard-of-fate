#!/usr/bin/env node
/**
 * sprite-tool — render Vanguard of Fate's pixel-art characters, monsters and item icons to PNG headless,
 * with the game's own drawing code (Pix buffers), so a look can be checked without opening the browser.
 *
 *   node .claude/skills/sprite-preview/sprite-tool.mjs list                       # every subject key
 *   node .claude/skills/sprite-preview/sprite-tool.mjs render <subject> [opts]    # sheet: rows = down/dside/side/uside/up, columns = frames
 *   node .claude/skills/sprite-preview/sprite-tool.mjs render monster:wolf --anim walk --dir side
 *   node .claude/skills/sprite-preview/sprite-tool.mjs render npc:brakka --before HEAD   # left: HEAD, right: working tree
 *
 * Subjects: class:<novice|knight|mage|priest|archer|fighter>, npc:<id>, merc:<axe|crossbow|greatsword|wand>,
 *           monster:<key>, boss:<key>, icon:<itemId> (e.g. icon:mail@3, icon:card:wolf).
 * Options:  --anim idle,walk   (default: every animation)   --dir down,side   (default: all five views)
 *           --scale 4 (default)   --out <file.png> (default: <tmp>/vof-sprites/<subject>.png)
 *           --before <git ref>  render the same subject from that commit on the left, for before/after checks
 *           --config '<json>'   Character Creator look for class:* (default: DEFAULT_CONFIG)
 *
 * Read the PNG it prints with the Read tool to look at it. Plain Node (zlib), no dependencies.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { load, ROOT } = await import(pathToFileURL(path.join(HERE, "../../../scripts/headless.mjs")).href);

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const [cmd, subject] = argv;

// ── Loading subjects (from the working tree or a git revision) ─────────────────

async function api(root) {
  const L = (rel) => load(rel, root);
  const avatar = await L("js/avatar/avatar.js");
  const options = await L("js/avatar/options.js");
  const bestiary = await L("js/bestiary.js");
  const roster = await L("js/npc/roster.js");
  const job = await L("js/classes/job.js");
  const novice = await L("js/classes/novice.js");
  const items = await L("js/items/itemdb.js");
  const icons = await L("js/items/icons.js");
  const classes = {
    knight: (await L("js/classes/knight.js")).KnightClass, mage: (await L("js/classes/mage.js")).MageClass,
    priest: (await L("js/classes/priest.js")).PriestClass, archer: (await L("js/classes/archer.js")).ArcherClass,
    fighter: (await L("js/classes/fighter.js")).FighterClass
  };
  const mercs = {
    axe: (await L("js/mercenary/axe.js")).AxeMercenary, crossbow: (await L("js/mercenary/crossbow.js")).CrossbowMercenary,
    greatsword: (await L("js/mercenary/greatsword.js")).GreatswordMercenary, wand: (await L("js/mercenary/wand.js")).WandMercenary
  };
  return { avatar, options, bestiary, roster, job, novice, items, icons, classes, mercs };
}

function list(A) {
  return {
    class: ["novice", ...Object.keys(A.classes)],
    npc: Object.keys(A.roster.NPC_DEFS),
    merc: Object.keys(A.mercs),
    monster: Object.keys(A.bestiary.MONSTERS),
    boss: Object.keys(A.bestiary.BOSSES),
    icon: ["<any item id, e.g. mail@3, salve, card:wolf, u:<unique>>"]
  };
}

/** Returns { sprite, anims } where sprite.frame(dir, anim, i) gives a canvas, or { icon: canvas }. */
function resolve(A, subj) {
  const [kind, ...rest] = subj.split(":");
  const key = rest.join(":");
  const avatarAnims = { idle: 2, walk: 4, run: 4, attack: 2, skill: 6 };
  const config = opt("--config", null) ? JSON.parse(opt("--config")) : A.options.DEFAULT_CONFIG;
  if (kind === "class") {
    const def = key === "novice" ? A.novice.getNovice(config) : A.classes[key] && A.job.equipJob(A.classes[key], config);
    if (!def) throw new Error(`unknown class "${key}"`);
    return { sprite: def.avatar, anims: avatarAnims };
  }
  if (kind === "npc") {
    const d = A.roster.NPC_DEFS[key];
    if (!d) throw new Error(`unknown NPC "${key}"`);
    return { sprite: new A.avatar.Avatar(d.look), anims: avatarAnims };
  }
  if (kind === "merc") {
    const m = A.mercs[key];
    if (!m || !m.look) throw new Error(`unknown mercenary "${key}"`);
    return { sprite: new A.avatar.Avatar(m.look), anims: avatarAnims };
  }
  if (kind === "monster" || kind === "boss") {
    const d = (kind === "boss" ? A.bestiary.BOSSES : A.bestiary.MONSTERS)[key];
    if (!d) throw new Error(`unknown ${kind} "${key}"`);
    const s = d.sprite;
    if (!s.frames) return { sprite: s, anims: avatarAnims };
    // drawn animations plus the ones built from them (run from walk, skill from attack)
    const extra = ["run", "skill"].filter((a) => !s.frames[a] && s.has && s.has(a));
    return { sprite: s, anims: { ...s.frames, ...Object.fromEntries(extra.map((a) => [a, s.count("down", a)])) } };
  }
  if (kind === "icon") {
    const item = A.items.describe({ id: key });
    if (!item) throw new Error(`unknown item "${key}"`);
    return { icon: A.icons.iconCanvas(item) };
  }
  throw new Error(`unknown subject kind "${kind}" (class, npc, merc, monster, boss, icon)`);
}

// ── Sheet assembly ───────────────────────────────────────────────────────────

const pixelsOf = (c) => ({ w: c.width, h: c.height, d: c._rgba || new Uint8ClampedArray(c.width * c.height * 4) });

function sheet(res) {
  if (res.icon) return [[pixelsOf(res.icon)]];
  const dirs = (opt("--dir", "down,dside,side,uside,up")).split(",");
  const want = opt("--anim", null);
  const anims = Object.entries(res.anims).filter(([a]) => !want || want.split(",").includes(a));
  return dirs.map((dir) => anims.flatMap(([a, n]) => Array.from({ length: n }, (_, i) => pixelsOf(res.sprite.frame(dir, a, i)))));
}

/** Lays out grids side by side (before | after), scaled, on a checkerboard so outlines stay visible. */
function compose(grids, scale) {
  const cellW = Math.max(...grids.flat(2).map((p) => p.w)), cellH = Math.max(...grids.flat(2).map((p) => p.h));
  const gap = 2, sep = 8;
  const gw = grids.map((g) => Math.max(...g.map((row) => row.length)) * (cellW + gap));
  const W = (gw.reduce((a, b) => a + b, 0) + sep * (grids.length - 1)) * scale;
  const H = Math.max(...grids.map((g) => g.length)) * (cellH + gap) * scale;
  const out = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = ((x >> 3) + (y >> 3)) & 1 ? 54 : 44;
    out.set([c, c, c + 8, 255], (y * W + x) * 4);
  }
  let ox = 0;
  grids.forEach((g, gi) => {
    g.forEach((row, r) => row.forEach((p, col) => {
      const bx = ox + col * (cellW + gap), by = r * (cellH + gap);
      for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
        const i = (y * p.w + x) * 4;
        if (!p.d[i + 3]) continue;
        for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
          const o = (((by + y) * scale + sy) * W + (bx + x) * scale + sx) * 4;
          out.set([p.d[i], p.d[i + 1], p.d[i + 2], 255], o);
        }
      }
    }));
    ox += gw[gi] + sep;
    if (gi < grids.length - 1) for (let y = 0; y < H; y++) for (let x = (ox - sep / 2) * scale; x < (ox - sep / 2 + 1) * scale; x++) out.set([255, 209, 102, 255], (y * W + x) * 4);
  });
  return { W, H, out };
}

function png(W, H, rgba) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; Buffer.from(rgba.buffer, y * W * 4, W * 4).copy(raw, y * (W * 4 + 1) + 1); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

/** Exports js/ at a git revision into a temp dir so it can be imported next to the working tree. */
function checkoutRev(ref) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vof-rev-"));
  const tar = execFileSync("git", ["archive", ref, "js", "data"], { cwd: ROOT, maxBuffer: 1 << 28 });
  execFileSync("tar", ["-x", "-C", dir], { input: tar });
  return dir;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

if (cmd === "list") {
  const A = await api(ROOT);
  for (const [k, v] of Object.entries(list(A))) console.log(`${k}: ${v.join(", ")}`);
} else if (cmd === "render" && subject) {
  const grids = [];
  const before = opt("--before", null);
  if (before) {
    try { grids.push(sheet(resolve(await api(checkoutRev(before)), subject))); }
    catch (e) { console.error(`before (${before}): ${e.message}; rendering the working tree only`); }
  }
  grids.push(sheet(resolve(await api(ROOT), subject)));
  const scale = parseInt(opt("--scale", subject.startsWith("icon:") ? "8" : "4"), 10);
  const { W, H, out } = compose(grids, scale);
  const file = opt("--out", path.join(os.tmpdir(), "vof-sprites", `${subject.replace(/[^\w@.-]+/g, "_")}${before ? "-vs-" + before.replace(/\W+/g, "_") : ""}.png`));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, png(W, H, out));
  console.log(`${file}  (${W}×${H}${before ? `, left = ${before}, right = working tree` : ""}; rows = ${opt("--dir", "down,dside,side,uside,up")})`);
} else {
  console.error("usage: list | render <class:|npc:|merc:|monster:|boss:|icon:><key> [--anim a,b] [--dir d,e] [--scale n] [--before <ref>] [--out file]");
  process.exit(1);
}
