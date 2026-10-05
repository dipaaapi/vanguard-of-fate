// Dependency-free reader and writer for the .aseprite / .ase format (plain Node), so the paint and
// export tools also work where Aseprite isn't installed. Format:
// https://github.com/aseprite/aseprite/blob/main/docs/ase-file-specs.md
//
// writeAse(file, { w, h, frames: [{ rgba, duration }], tags: [{ name, from, to }], layer })
//   → one visible layer (default "art"), RGBA (32-bit), zlib-compressed cels cropped to their
//     painted pixels, sRGB colour profile, tags; durations in seconds.
// readAse(file) → { w, h, depth, frames: [{ duration (ms), rgba (composited) }], tags: [{ name, from, to, direction }], layers }
//   Handles RGBA files with any number of layers: hidden layers (and children of hidden groups) are
//   skipped, visible ones composited bottom-to-top with normal blending, layer and cel opacity; raw,
//   linked and compressed cels (types 0, 1, 2). Other chunks are ignored. Grayscale / indexed files
//   are also composited (indexed through the palette chunk).
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const DIRECTIONS = ["forward", "reverse", "pingpong", "pingpong_reverse"];

// ---------- writing ----------

class Out {
  constructor() { this.parts = []; }
  u8(v) { const b = Buffer.alloc(1); b.writeUInt8(v & 0xff); this.parts.push(b); }
  u16(v) { const b = Buffer.alloc(2); b.writeUInt16LE(v & 0xffff); this.parts.push(b); }
  i16(v) { const b = Buffer.alloc(2); b.writeInt16LE(v); this.parts.push(b); }
  u32(v) { const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0); this.parts.push(b); }
  zeros(n) { this.parts.push(Buffer.alloc(n)); }
  str(s) { const b = Buffer.from(s, "utf8"); this.u16(b.length); this.parts.push(b); }
  bytes(b) { this.parts.push(Buffer.from(b)); }
  buf() { return Buffer.concat(this.parts); }
}

function chunk(type, body) {
  const o = new Out();
  o.u32(body.length + 6); o.u16(type); o.bytes(body);
  return o.buf();
}

/** Bounding box of the non-transparent pixels, or null when the frame is empty. */
function bbox(rgba, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (rgba[(y * w + x) * 4 + 3]) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * Write an RGBA .aseprite. frames[i].rgba = w*h*4 bytes, frames[i].duration in seconds (default 0.1).
 * tags = [{ name, from, to }] (0-based, inclusive).
 */
export function writeAse(file, { w, h, frames, tags = [], layer = "art" }) {
  const frameBufs = frames.map((fr, i) => {
    const chunks = [];
    if (i === 0) {
      // colour profile: sRGB
      const cp = new Out(); cp.u16(1); cp.u16(0); cp.u32(0); cp.zeros(8);
      chunks.push(chunk(0x2007, cp.buf()));
      // a one-entry palette (RGB sprites don't need more)
      const pal = new Out(); pal.u32(1); pal.u32(0); pal.u32(0); pal.zeros(8); pal.u16(0); pal.u8(0); pal.u8(0); pal.u8(0); pal.u8(255);
      chunks.push(chunk(0x2019, pal.buf()));
      // the layer: visible + editable, normal, opaque
      const ly = new Out(); ly.u16(3); ly.u16(0); ly.u16(0); ly.u16(0); ly.u16(0); ly.u16(0); ly.u8(255); ly.zeros(3); ly.str(layer);
      chunks.push(chunk(0x2004, ly.buf()));
      if (tags.length) {
        const tg = new Out(); tg.u16(tags.length); tg.zeros(8);
        for (const t of tags) {
          tg.u16(t.from); tg.u16(t.to); tg.u8(Math.max(0, DIRECTIONS.indexOf(t.direction || "forward"))); tg.u16(0); tg.zeros(6);
          tg.u8(0); tg.u8(0); tg.u8(0); tg.u8(0); tg.str(t.name);
        }
        chunks.push(chunk(0x2018, tg.buf()));
      }
    }
    const rgba = fr.rgba, box = bbox(rgba, w, h);
    if (box) {
      const px = Buffer.alloc(box.w * box.h * 4);
      for (let y = 0; y < box.h; y++) Buffer.from(rgba.buffer, rgba.byteOffset + ((box.y + y) * w + box.x) * 4, box.w * 4).copy(px, y * box.w * 4);
      const cel = new Out();
      cel.u16(0); cel.i16(box.x); cel.i16(box.y); cel.u8(255); cel.u16(2); cel.i16(0); cel.zeros(5);
      cel.u16(box.w); cel.u16(box.h); cel.bytes(zlib.deflateSync(px));
      chunks.push(chunk(0x2005, cel.buf()));
    }
    const body = Buffer.concat(chunks);
    const hd = new Out();
    hd.u32(body.length + 16); hd.u16(0xf1fa); hd.u16(Math.min(chunks.length, 0xffff));
    hd.u16(Math.round((fr.duration ?? 0.1) * 1000)); hd.zeros(2); hd.u32(chunks.length);
    return Buffer.concat([hd.buf(), body]);
  });
  const all = Buffer.concat(frameBufs);
  const hd = new Out();
  hd.u32(all.length + 128); hd.u16(0xa5e0); hd.u16(frames.length); hd.u16(w); hd.u16(h); hd.u16(32);
  hd.u32(1);                                      // layer opacity is valid
  hd.u16(100); hd.u32(0); hd.u32(0); hd.u8(0); hd.zeros(3); hd.u16(1);
  hd.u8(1); hd.u8(1); hd.i16(0); hd.i16(0); hd.u16(16); hd.u16(16); hd.zeros(84);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.concat([hd.buf(), all]));
}

// ---------- reading ----------

/** Read an .aseprite / .ase file and composite every frame's visible layers. */
export function readAse(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt16LE(4) !== 0xa5e0) throw new Error(`${file}: not an Aseprite file`);
  const nFrames = b.readUInt16LE(6), w = b.readUInt16LE(8), h = b.readUInt16LE(10), depth = b.readUInt16LE(12);
  const flags = b.readUInt32LE(14), opacityValid = !!(flags & 1), transparent = b.readUInt8(28);
  const bpp = depth / 8;
  const layers = [], tags = [], frames = [];
  let palette = [];
  const cels = [];         // per frame: [{ layer, x, y, opacity, z, w, h, px | link }]
  let off = 128;
  for (let f = 0; f < nFrames; f++) {
    const size = b.readUInt32LE(off);
    if (b.readUInt16LE(off + 4) !== 0xf1fa) throw new Error(`${file}: bad frame magic in frame ${f}`);
    const old = b.readUInt16LE(off + 6), duration = b.readUInt16LE(off + 8), nNew = b.readUInt32LE(off + 12);
    const nChunks = nNew || old;
    const list = [];
    let c = off + 16;
    for (let k = 0; k < nChunks && c < off + size; k++) {
      const csize = b.readUInt32LE(c), type = b.readUInt16LE(c + 4), d = c + 6;
      if (type === 0x2004) {
        const nameLen = b.readUInt16LE(d + 16);
        layers.push({
          flags: b.readUInt16LE(d), type: b.readUInt16LE(d + 2), level: b.readUInt16LE(d + 4),
          blend: b.readUInt16LE(d + 10), opacity: opacityValid ? b.readUInt8(d + 12) : 255,
          name: b.toString("utf8", d + 18, d + 18 + nameLen)
        });
      } else if (type === 0x2005) {
        const cel = { layer: b.readUInt16LE(d), x: b.readInt16LE(d + 2), y: b.readInt16LE(d + 4), opacity: b.readUInt8(d + 6), z: b.readInt16LE(d + 9) };
        const ct = b.readUInt16LE(d + 7);
        if (ct === 1) cel.link = b.readUInt16LE(d + 16);
        else if (ct === 0 || ct === 2) {
          cel.w = b.readUInt16LE(d + 16); cel.h = b.readUInt16LE(d + 18);
          const data = b.subarray(d + 20, c + csize);
          cel.px = ct === 0 ? data : zlib.inflateSync(data);
        } else { c += csize; continue; }      // tilemap cels: not supported, skipped
        list.push(cel);
      } else if (type === 0x2018) {
        const n = b.readUInt16LE(d);
        let t = d + 10;
        for (let j = 0; j < n; j++) {
          const from = b.readUInt16LE(t), to = b.readUInt16LE(t + 2), dirn = b.readUInt8(t + 4);
          const nameLen = b.readUInt16LE(t + 17);
          tags.push({ name: b.toString("utf8", t + 19, t + 19 + nameLen), from, to, direction: DIRECTIONS[dirn] || "forward" });
          t += 19 + nameLen;
        }
      } else if (type === 0x2019) {
        const first = b.readUInt32LE(d + 4), last = b.readUInt32LE(d + 8);
        let t = d + 20;
        for (let j = first; j <= last; j++) {
          const ef = b.readUInt16LE(t);
          palette[j] = [b[t + 2], b[t + 3], b[t + 4], b[t + 5]];
          t += 6;
          if (ef & 1) t += 2 + b.readUInt16LE(t);
        }
      } else if (type === 0x0004 && !palette.length) {
        // old palette chunk (only if there's no new one)
        const packets = b.readUInt16LE(d);
        let t = d + 2, idx = 0;
        for (let p = 0; p < packets; p++) {
          idx += b[t]; let n = b[t + 1] || 256; t += 2;
          for (let j = 0; j < n; j++, t += 3) palette[idx++] = [b[t], b[t + 1], b[t + 2], 255];
        }
      }
      c += csize;
    }
    cels.push(list);
    frames.push({ duration });
    off += size;
  }

  // visibility: a layer is shown when it and every parent group are visible
  const visible = [], stack = [];
  layers.forEach((l, i) => {
    stack.length = l.level;
    const parentsVisible = stack.every((v) => v);
    visible[i] = parentsVisible && !!(l.flags & 1) && l.type !== 2;
    stack[l.level] = parentsVisible && !!(l.flags & 1);
  });
  // a group's opacity multiplies into its children
  const effOpacity = [], ostack = [];
  layers.forEach((l, i) => {
    ostack.length = l.level;
    const parent = ostack.reduce((a, v) => a * v, 1);
    effOpacity[i] = parent * (l.opacity / 255);
    ostack[l.level] = l.opacity / 255;
  });

  const pixel = (px, j) => {
    if (bpp === 4) return [px[j * 4], px[j * 4 + 1], px[j * 4 + 2], px[j * 4 + 3]];
    if (bpp === 2) return [px[j * 2], px[j * 2], px[j * 2], px[j * 2 + 1]];
    const idx = px[j];
    if (idx === transparent) return [0, 0, 0, 0];
    return palette[idx] || [0, 0, 0, 0];
  };

  frames.forEach((fr, f) => {
    const out = new Uint8ClampedArray(w * h * 4);
    const resolved = cels[f].map((cel) => {
      if (cel.link == null) return cel;
      const src = cels[cel.link]?.find((s) => s.layer === cel.layer && s.link == null);
      return src ? { ...src, opacity: cel.opacity, z: cel.z } : null;
    }).filter(Boolean);
    // order: layer index + z-index (ties: the higher z-index on top)
    resolved.sort((a, b) => (a.layer + a.z) - (b.layer + b.z) || a.z - b.z);
    for (const cel of resolved) {
      const l = layers[cel.layer];
      if (!l || !visible[cel.layer] || l.type === 1) continue;
      const op = (cel.opacity / 255) * effOpacity[cel.layer];
      if (op <= 0) continue;
      for (let y = 0; y < cel.h; y++) {
        const ty = cel.y + y;
        if (ty < 0 || ty >= h) continue;
        for (let x = 0; x < cel.w; x++) {
          const tx = cel.x + x;
          if (tx < 0 || tx >= w) continue;
          const [r, g, bb, a0] = pixel(cel.px, y * cel.w + x);
          const sa = Math.round(a0 * op);
          if (!sa) continue;
          const o = (ty * w + tx) * 4, da = out[o + 3];
          if (sa === 255 || !da) { out[o] = r; out[o + 1] = g; out[o + 2] = bb; out[o + 3] = sa; continue; }
          // normal blending (straight alpha)
          const ra = sa + da - Math.round(da * sa / 255);
          out[o] = Math.round(out[o] + (r - out[o]) * sa / ra);
          out[o + 1] = Math.round(out[o + 1] + (g - out[o + 1]) * sa / ra);
          out[o + 2] = Math.round(out[o + 2] + (bb - out[o + 2]) * sa / ra);
          out[o + 3] = ra;
        }
      }
    }
    fr.rgba = out;
  });
  return { w, h, depth, frames, tags, layers: layers.map((l, i) => ({ name: l.name, visible: visible[i], type: l.type })) };
}

/**
 * Write what `aseprite -b <file> --sheet <png> --data <json> --format json-array --list-tags` would:
 * every frame in a grid, plus the json-array data (frames, meta.frameTags, meta.size).
 */
export function exportSheet(src, png, json, writePng) {
  const ase = readAse(src);
  const n = ase.frames.length, cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
  const W = cols * ase.w, H = rows * ase.h, sheet = new Uint8ClampedArray(W * H * 4);
  const base = path.basename(src).replace(/\.(aseprite|ase)$/i, "");
  const frames = ase.frames.map((fr, i) => {
    const fx = (i % cols) * ase.w, fy = Math.floor(i / cols) * ase.h;
    for (let y = 0; y < ase.h; y++) sheet.set(fr.rgba.subarray(y * ase.w * 4, (y + 1) * ase.w * 4), ((fy + y) * W + fx) * 4);
    return {
      filename: `${base} ${i}.aseprite`, frame: { x: fx, y: fy, w: ase.w, h: ase.h }, rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: ase.w, h: ase.h }, sourceSize: { w: ase.w, h: ase.h }, duration: fr.duration
    };
  });
  writePng(png, W, H, sheet);
  const data = {
    frames,
    meta: {
      app: "tools/aseprite/asefile.mjs", version: "1", image: path.basename(png), format: "RGBA8888",
      size: { w: W, h: H }, scale: "1",
      frameTags: ase.tags.map((t) => ({ name: t.name, from: t.from, to: t.to, direction: t.direction, color: "#000000ff" }))
    }
  };
  fs.writeFileSync(json, JSON.stringify(data, null, 1) + "\n");
  return data;
}
