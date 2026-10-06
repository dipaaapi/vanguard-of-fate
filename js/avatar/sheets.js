// ==================== ASEPRITE SPRITE SHEETS ====================
// Hand-drawn art from Aseprite, used in place of the code-drawn frames when a sheet exists.
// `node tools/aseprite/export.mjs` turns every aseprite/<kind>/<key>.aseprite into
// assets/sprites/<kind>/<key>.png + .json and lists it in assets/sprites/manifest.json.
//
// Each Aseprite tag is one direction + animation, named "<dir>-<anim>" (e.g. "side-walk"),
// and its frames are that animation's frames in order. A tag can have more frames than the code
// sprite, and can add animations the code sprite lacks ("run", "skill"). A missing tag falls back
// to the code-drawn sprite, so a sheet can be partial.
// The canvas may be larger than the code sprite: it is centred on the same feet, i.e. the extra
// width is split evenly left/right and the extra height goes on top (see CreatureSprite.draw).

const BASE = "assets/sprites/";
const sheets = new Map();   // key ("monster/slime") → Map("dir|anim" → [canvas, …])
let version = 0;            // bumps when sheets arrive, so cached flash frames are rebuilt

export const sheetsVersion = () => version;

/** Number of frames in the sheet's `dir`/`anim` tag (0 = no such tag). */
export function sheetCount(key, dir, anim) {
  return sheets.get(key)?.get(`${dir}|${anim}`)?.length || 0;
}

/** Frame `i` of `dir`/`anim` from the sheet for `key`, or null when there is none. */
export function sheetFrame(key, dir, anim, i) {
  const tag = sheets.get(key)?.get(`${dir}|${anim}`);
  return tag && i < tag.length ? tag[i] : null;
}

/** Frame durations (ms) of the sheet's `dir`/`anim` tag, as set in Aseprite (empty = no such tag). */
export function sheetDurations(key, dir, anim) {
  return sheets.get(key)?.get(`${dir}|${anim}`)?.durations || [];
}

/** Cut an exported sheet into one canvas per frame, grouped by tag. */
function slice(img, data) {
  const frames = Array.isArray(data.frames) ? data.frames : Object.values(data.frames);
  const tags = new Map();
  for (const tag of data.meta?.frameTags || []) {
    const m = /^(down|side|up)-(\w+)$/.exec(tag.name);
    if (!m) continue;
    const list = [];
    for (let f = tag.from; f <= tag.to; f++) {
      const r = frames[f].frame;
      const c = document.createElement("canvas");
      c.width = r.w;
      c.height = r.h;
      c.getContext("2d").drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
      list.push(c);
    }
    list.durations = frames.slice(tag.from, tag.to + 1).map((f) => f.duration || 100);
    tags.set(`${m[1]}|${m[2]}`, list);
  }
  return tags;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

/** Load every sheet in the manifest. Never throws: without sheets the game keeps the code-drawn art. */
export async function loadSpriteSheets() {
  try {
    const res = await fetch(BASE + "manifest.json");
    if (!res.ok) return;
    const { sheets: keys = [] } = await res.json();
    await Promise.all(keys.map(async (key) => {
      try {
        const [data, img] = await Promise.all([
          fetch(`${BASE}${key}.json`).then((r) => r.json()),
          loadImage(`${BASE}${key}.png`)
        ]);
        sheets.set(key, slice(img, data));
        version++;
      } catch (e) {
        console.warn(`sprite sheet ${key}: ${e.message}`);
      }
    }));
  } catch (e) {
    console.warn(`sprite sheets: ${e.message}`);
  }
}
