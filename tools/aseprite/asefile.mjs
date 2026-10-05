// Read and write .aseprite files in plain Node (no Aseprite needed), so the tools also work where the
// app isn't installed (cloud sessions, CI). Format: https://github.com/aseprite/aseprite/blob/main/docs/ase-file-specs.md
//
//   writeAse(file, { w, h, layers: ["ground", "props"], frames: [{ duration: 0.12, cels: { ground: rgba, … } }],
//                    tags: [{ name: "down-idle", from: 0, to: 5 }] })
//     RGBA sprite; each layer gets one compressed cel per frame (a frame identical to the one before is
//     stored as a linked cel). The palette lists the colours used, so they are at hand when editing.
//   readAse(file) → { w, h, frames: [{ duration, rgba }], tags, layers, warnings }
//     Flattens the visible layers (normal blending, layer and cel opacity) of RGBA, grayscale and
//     indexed files, including linked cels and groups. Other blend modes are drawn as normal (warned).
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const CHUNK = { OLD_PALETTE: 0x0004, OLD_PALETTE2: 0x0011, LAYER: 0x2004, CEL: 0x2005, PROFILE: 0x2007, TAGS: 0x2018, PALETTE: 0x2019 };

class Out {
  constructor() { this.parts = []; }
  byte(v) { this.parts.push(Buffer.from([v & 255])); return this; }
  word(v) { const b = Buffer.alloc(2); b.writeUInt16LE(v & 0xffff); this.parts.push(b); return this; }
  short(v) { const b = Buffer.alloc(2); b.writeInt16LE(v); this.parts.push(b); return this; }
  dword(v) { const b = Buffer.alloc(4); b.writeUInt32LE(v >>> 0); this.parts.push(b); return this; }
  zeros(n) { this.parts.push(Buffer.alloc(n)); return this; }
  str(s) { const b = Buffer.from(s, "utf8"); this.word(b.length); this.parts.push(b); return this; }
  bytes(b) { this.parts.push(Buffer.from(b)); return this; }
  done() { return Buffer.concat(this.parts); }
}
const chunk = (type, body) => new Out().dword(body.length + 6).word(type).bytes(body).done();

/** The distinct opaque colours of some RGBA buffers, most used first (at most `max`). */
function paletteOf(buffers, max = 256) {
  const count = new Map();
  for (const px of buffers) for (let j = 0; j < px.length; j += 4) {
    if (!px[j + 3]) continue;
    const k = (px[j] << 16) | (px[j + 1] << 8) | px[j + 2];
    count.set(k, (count.get(k) || 0) + 1);
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([k]) => [k >> 16, (k >> 8) & 255, k & 255]);
}

const same = (a, b) => a && b && a.length === b.length && Buffer.compare(Buffer.from(a.buffer, a.byteOffset, a.byteLength), Buffer.from(b.buffer, b.byteOffset, b.byteLength)) === 0;

/** Bounding box of the non-transparent pixels, or null when empty. */
function bbox(px, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3]) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

export function writeAse(file, { w, h, layers, frames, tags = [] }) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const allCels = frames.flatMap((f) => Object.values(f.cels).filter(Boolean));
  const pal = paletteOf(allCels);
  const out = [];
  frames.forEach((f, fi) => {
    const chunks = [];
    if (fi === 0) {
      chunks.push(chunk(CHUNK.PROFILE, new Out().word(1).word(0).dword(0).zeros(8).done()));   // sRGB
      if (pal.length) {
        const p = new Out().dword(pal.length).dword(0).dword(pal.length - 1).zeros(8);
        pal.forEach(([r, g, b]) => p.word(0).byte(r).byte(g).byte(b).byte(255));
        chunks.push(chunk(CHUNK.PALETTE, p.done()));
      }
      layers.forEach((name) => {
        chunks.push(chunk(CHUNK.LAYER, new Out().word(3).word(0).word(0).word(0).word(0).word(0).byte(255).zeros(3).str(name).done()));
      });
      if (tags.length) {
        const t = new Out().word(tags.length).zeros(8);
        tags.forEach((tag) => t.word(tag.from).word(tag.to).byte(0).word(0).zeros(6).byte(0).byte(0).byte(0).byte(0).str(tag.name));
        chunks.push(chunk(CHUNK.TAGS, t.done()));
      }
    }
    layers.forEach((name, li) => {
      const px = f.cels[name];
      if (!px) return;
      const prev = fi > 0 ? frames[fi - 1].cels[name] : null;
      // linked cel: point at the first frame of the run of identical images
      if (same(px, prev)) {
        let link = fi - 1;
        while (link > 0 && same(frames[link - 1].cels[name], px)) link--;
        chunks.push(chunk(CHUNK.CEL, new Out().word(li).short(0).short(0).byte(255).word(1).short(0).zeros(5).word(link).done()));
        return;
      }
      const box = bbox(px, w, h);
      if (!box) return;
      const crop = Buffer.alloc(box.w * box.h * 4);
      for (let y = 0; y < box.h; y++) Buffer.from(px.buffer, px.byteOffset + ((box.y + y) * w + box.x) * 4, box.w * 4).copy(crop, y * box.w * 4);
      chunks.push(chunk(CHUNK.CEL, new Out().word(li).short(box.x).short(box.y).byte(255).word(2).short(0).zeros(5)
        .word(box.w).word(box.h).bytes(zlib.deflateSync(crop)).done()));
    });
    const body = Buffer.concat(chunks);
    const head = new Out().dword(16 + body.length).word(0xf1fa).word(Math.min(chunks.length, 0xffff)).word(Math.round((f.duration || 0.1) * 1000)).zeros(2).dword(chunks.length).done();
    out.push(head, body);
  });
  const frameBytes = Buffer.concat(out);
  const header = new Out().dword(128 + frameBytes.length).word(0xa5e0).word(frames.length).word(w).word(h).word(32)
    .dword(1).word(100).dword(0).dword(0).byte(0).zeros(3).word(pal.length > 255 ? 0 : pal.length || 1).byte(1).byte(1)
    .short(0).short(0).word(16).word(16).zeros(84).done();
  fs.writeFileSync(file, Buffer.concat([header, frameBytes]));
}

export function readAse(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt16LE(4) !== 0xa5e0) throw new Error(`${file}: not an Aseprite file`);
  const nFrames = buf.readUInt16LE(6), w = buf.readUInt16LE(8), h = buf.readUInt16LE(10), depth = buf.readUInt16LE(12);
  const opacityValid = buf.readUInt32LE(14) & 1, transparentIndex = buf[28];
  const bpp = depth / 8;
  const warnings = new Set();
  const layers = [], tags = [], frames = [];
  let palette = [];
  const rawCels = [];   // per frame: Map(layer → { x, y, w, h, opacity, z, px (RGBA) })
  let off = 128;
  const toRgba = (data, n) => {
    const px = new Uint8ClampedArray(n * 4);
    for (let j = 0; j < n; j++) {
      if (bpp === 4) px.set(data.subarray(j * 4, j * 4 + 4), j * 4);
      else if (bpp === 2) { px[j * 4] = px[j * 4 + 1] = px[j * 4 + 2] = data[j * 2]; px[j * 4 + 3] = data[j * 2 + 1]; }
      else { const i = data[j]; if (i !== transparentIndex && palette[i]) px.set(palette[i], j * 4); }
    }
    return px;
  };
  for (let fi = 0; fi < nFrames; fi++) {
    const fBytes = buf.readUInt32LE(off), oldN = buf.readUInt16LE(off + 6), dur = buf.readUInt16LE(off + 8), newN = buf.readUInt32LE(off + 12);
    const n = newN || oldN;
    const cels = new Map();
    let p = off + 16;
    for (let c = 0; c < n; c++) {
      const size = buf.readUInt32LE(p), type = buf.readUInt16LE(p + 4), d = p + 6;
      if (type === CHUNK.LAYER) {
        const flags = buf.readUInt16LE(d), ltype = buf.readUInt16LE(d + 2), level = buf.readUInt16LE(d + 4), blend = buf.readUInt16LE(d + 10), opacity = buf[d + 12];
        const nameLen = buf.readUInt16LE(d + 16);
        layers.push({ name: buf.toString("utf8", d + 18, d + 18 + nameLen), visible: Boolean(flags & 1), type: ltype, level, blend, opacity: opacityValid ? opacity : 255 });
      } else if (type === CHUNK.CEL) {
        const li = buf.readUInt16LE(d), x = buf.readInt16LE(d + 2), y = buf.readInt16LE(d + 4), opacity = buf[d + 6], ctype = buf.readUInt16LE(d + 7), z = buf.readInt16LE(d + 9);
        const body = d + 16;
        if (ctype === 1) cels.set(li, { link: buf.readUInt16LE(body) });
        else if (ctype === 0 || ctype === 2) {
          const cw = buf.readUInt16LE(body), ch = buf.readUInt16LE(body + 2);
          const data = ctype === 0 ? buf.subarray(body + 4, p + size) : zlib.inflateSync(buf.subarray(body + 4, p + size));
          cels.set(li, { x, y, w: cw, h: ch, opacity, z, px: toRgba(data, cw * ch) });
        } else warnings.add("tilemap cels are not supported (left out)");
      } else if (type === CHUNK.PALETTE) {
        const first = buf.readUInt32LE(d + 4), last = buf.readUInt32LE(d + 8);
        let q = d + 20;
        for (let i = first; i <= last; i++) {
          const flags = buf.readUInt16LE(q);
          palette[i] = [buf[q + 2], buf[q + 3], buf[q + 4], buf[q + 5]];
          q += 6;
          if (flags & 1) q += 2 + buf.readUInt16LE(q);
        }
      } else if ((type === CHUNK.OLD_PALETTE || type === CHUNK.OLD_PALETTE2) && !palette.length) {
        const packets = buf.readUInt16LE(d);
        let q = d + 2, i = 0;
        for (let k = 0; k < packets; k++) {
          i += buf[q]; let cnt = buf[q + 1] || 256; q += 2;
          for (; cnt > 0; cnt--, i++, q += 3) {
            const s = type === CHUNK.OLD_PALETTE2 ? 4 : 1;
            palette[i] = [Math.min(255, buf[q] * s), Math.min(255, buf[q + 1] * s), Math.min(255, buf[q + 2] * s), 255];
          }
        }
      } else if (type === CHUNK.TAGS) {
        const nt = buf.readUInt16LE(d);
        let q = d + 10;
        for (let k = 0; k < nt; k++) {
          const from = buf.readUInt16LE(q), to = buf.readUInt16LE(q + 2), dir = buf[q + 4], len = buf.readUInt16LE(q + 17);
          tags.push({ name: buf.toString("utf8", q + 19, q + 19 + len), from, to, direction: ["forward", "reverse", "pingpong", "pingpong_reverse"][dir] || "forward" });
          q += 19 + len;
        }
      }
      p += size;
    }
    rawCels.push(cels);
    frames.push({ duration: dur / 1000 });
    off += fBytes;
  }

  // Visibility through groups: a layer shows only when it and every parent group are visible
  const shown = [], parents = [];
  layers.forEach((l, i) => {
    parents.length = l.level;
    const parentOk = parents.every((v) => v !== false);
    shown[i] = parentOk && l.visible && l.type !== 1;
    parents[l.level] = parentOk && l.visible;
    if (shown[i] && l.blend !== 0) warnings.add(`layer "${l.name}" uses a blend mode other than Normal (drawn as Normal)`);
  });
  frames.forEach((f, fi) => {
    const px = new Uint8ClampedArray(w * h * 4);
    const order = layers.map((l, i) => i).filter((i) => shown[i]).map((i) => {
      let cel = rawCels[fi].get(i);
      if (cel && cel.link != null) cel = rawCels[cel.link].get(i);
      return cel && cel.px ? { i, cel } : null;
    }).filter(Boolean).sort((a, b) => (a.i + a.cel.z) - (b.i + b.cel.z) || a.cel.z - b.cel.z);
    for (const { i, cel } of order) {
      const k = (layers[i].opacity / 255) * (cel.opacity / 255);
      for (let y = 0; y < cel.h; y++) {
        const ty = cel.y + y;
        if (ty < 0 || ty >= h) continue;
        for (let x = 0; x < cel.w; x++) {
          const tx = cel.x + x;
          if (tx < 0 || tx >= w) continue;
          const s = (y * cel.w + x) * 4, dst = (ty * w + tx) * 4;
          const a = (cel.px[s + 3] / 255) * k;
          if (!a) continue;
          const da = px[dst + 3] / 255, oa = a + da * (1 - a);
          for (let ch = 0; ch < 3; ch++) px[dst + ch] = Math.round((cel.px[s + ch] * a + px[dst + ch] * da * (1 - a)) / oa);
          px[dst + 3] = Math.round(oa * 255);
        }
      }
    }
    f.rgba = px;
  });
  return { w, h, frames, tags, layers: layers.map((l) => l.name), warnings: [...warnings] };
}
