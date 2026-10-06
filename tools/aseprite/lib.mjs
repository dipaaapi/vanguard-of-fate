// Shared helpers for the Aseprite tools: find the Aseprite executable, read the game's creature
// sprites headless, and write PNGs (plain Node, no dependencies).
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const SRC_DIR = path.join(ROOT, "aseprite");               // aseprite/<kind>/<key>.aseprite
export const OUT_DIR = path.join(ROOT, "assets", "sprites");      // assets/sprites/<kind>/<key>.png + .json

/** Path to the Aseprite executable: $ASEPRITE, then PATH, then the usual Windows/macOS/Linux installs. */
export function findAseprite() {
  const candidates = [
    process.env.ASEPRITE,
    "aseprite",
    "C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe",
    "C:/Program Files/Steam/steamapps/common/Aseprite/Aseprite.exe",
    "C:/Program Files/Aseprite/Aseprite.exe",
    "/Applications/Aseprite.app/Contents/MacOS/aseprite",
    `${process.env.HOME}/Library/Application Support/Steam/steamapps/common/Aseprite/Aseprite.app/Contents/MacOS/aseprite`,
    `${process.env.HOME}/.steam/steam/steamapps/common/Aseprite/aseprite`
  ].filter(Boolean);
  for (const exe of candidates) {
    try {
      execFileSync(exe, ["-b", "--version"], { stdio: "pipe" });
      return exe;
    } catch { /* try the next one */ }
  }
  throw new Error("Aseprite not found. Install it or set ASEPRITE to the executable's path.");
}

/**
 * The game sprite a sheet key replaces, with its size and code-drawn animations ({ w, h, frames } and
 * frame()): "monster/<key>", "boss/<key>", "npc/<id>", "merc/<axe|crossbow|greatsword|wand>",
 * "summon/<slime|hound|owl|fox|falcon|angel>". Avatars (humanoids) get their size and animations
 * (idle, walk, run, attack, skill) attached. Null when the key matches nothing.
 */
export async function codeSprite(key) {
  const { load } = await import(pathToFileURL(path.join(ROOT, "scripts/headless.mjs")).href);
  const [kind, name] = key.split("/");
  const A = await load("js/avatar/avatar.js");
  const human = (av) => Object.assign(av, { w: A.FRAME_W, h: A.FRAME_H, frames: { idle: 2, walk: 4, run: 4, attack: 2, skill: 6 } });
  if (kind === "npc") {
    const { NPC_DEFS } = await load("js/npc/roster.js");
    return NPC_DEFS[name] ? human(new A.Avatar(NPC_DEFS[name].look)) : null;
  }
  if (kind === "merc") {
    const file = { axe: "axe", crossbow: "crossbow", greatsword: "greatsword", wand: "wand" }[name];
    if (!file) return null;
    const mod = await load(`js/mercenary/${file}.js`);
    const cls = Object.values(mod).find((v) => v && v.look);
    return cls ? human(new A.Avatar(cls.look)) : null;
  }
  if (kind === "summon") {
    if (name === "angel") {
      const { LOOK } = await import(pathToFileURL(path.join(ROOT, "tools/aseprite/paint/angel.mjs")).href);
      return human(new A.Avatar({ ...LOOK }));
    }
    if (name === "falcon") return new (await load("js/avatar/creature.js")).FalconSprite();
    const { FAMILIARS } = await load("js/summons/familiar.js");
    return FAMILIARS[name] ? FAMILIARS[name].sprite : null;
  }
  const { MONSTERS, BOSSES } = await load("js/bestiary.js");
  const def = (kind === "monster" ? MONSTERS : kind === "boss" ? BOSSES : {})[name];
  if (!def) return null;
  if (!def.sprite.frames) return human(def.sprite);
  // creature: drawn animations plus the ones built from them (run, skill)
  const s = def.sprite, frames = { ...s.frames };
  for (const a of ["run", "skill"]) if (!frames[a] && s.has(a)) frames[a] = s.count("down", a);
  return { w: s.w, h: s.h, frames, frame: (dir, anim, i) => s.frame(dir, anim, i) };
}

/** Encode RGBA pixels as a PNG file. */
export function writePng(file, w, h, rgba) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
}

/** Decode an 8-bit RGBA or RGB PNG (non-interlaced) → { w, h, rgba }. */
export function readPng(file) {
  const b = fs.readFileSync(file);
  let off = 8, w = 0, h = 0, type = 6;
  const idat = [];
  while (off < b.length) {
    const len = b.readUInt32BE(off), t = b.toString("latin1", off + 4, off + 8), d = b.subarray(off + 8, off + 8 + len);
    if (t === "IHDR") {
      w = d.readUInt32BE(0); h = d.readUInt32BE(4); type = d[9];
      if (d[8] !== 8 || (type !== 6 && type !== 2) || d[12]) throw new Error(`${file}: only 8-bit RGB/RGBA non-interlaced PNGs`);
    } else if (t === "IDAT") idat.push(d);
    off += 12 + len;
  }
  const bpp = type === 6 ? 4 : 3, stride = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0, up = y ? px[(y - 1) * stride + x] : 0, c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      px[y * stride + x] = v & 0xff;
    }
  }
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let j = 0; j < w * h; j++) { rgba[j * 4] = px[j * bpp]; rgba[j * 4 + 1] = px[j * bpp + 1]; rgba[j * 4 + 2] = px[j * bpp + 2]; rgba[j * 4 + 3] = bpp === 4 ? px[j * bpp + 3] : 255; }
  return { w, h, rgba };
}

/** The Aseprite executable, or null when it isn't installed (the tools then use asefile.mjs). */
export function tryAseprite() {
  try { return findAseprite(); } catch { return null; }
}
