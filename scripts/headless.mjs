// ==================== HEADLESS LOADER ====================
// Lets Node import the game's own modules (no browser, no dependencies), so tools and tests use the
// real formulas instead of copies. Stubs only what modules touch at import time: document, window,
// localStorage, canvas 2D contexts, Image, fetch and Web Audio. Drawing calls do nothing.
//
//   import { load } from "./headless.mjs";
//   const { Player } = await load("js/player.js");
//
// Optional seeded randomness: seedRandom(42) replaces Math.random for repeatable runs.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// A 2D context that accepts every call and property, and returns blank image data when asked
function fakeContext(canvas) {
  const target = {
    canvas,
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    measureText: (s) => ({ width: String(s).length * 6 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createPattern: () => ({}),
    getLineDash: () => [],
    // Pixel art is built in a Pix buffer and written with putImageData; keep those pixels on the canvas
    // (canvas._rgba, width × height × 4) so tools can save sprites and icons as PNG
    putImageData(img, dx = 0, dy = 0) {
      const w = canvas.width || img.width, h = canvas.height || img.height;
      if (!canvas._rgba || canvas._rgba.length !== w * h * 4) canvas._rgba = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const tx = x + dx, ty = y + dy;
          if (tx < 0 || ty < 0 || tx >= w || ty >= h) continue;
          const si = (y * img.width + x) * 4, ti = (ty * w + tx) * 4;
          for (let k = 0; k < 4; k++) canvas._rgba[ti + k] = img.data[si + k];
        }
      }
    }
  };
  return new Proxy(target, {
    get: (t, p) => (p in t ? t[p] : typeof p === "string" ? () => undefined : undefined),
    set: (t, p, v) => { t[p] = v; return true; }
  });
}

function fakeElement(tag = "div") {
  const el = {
    tagName: String(tag).toUpperCase(), style: {}, dataset: {}, children: [], width: 0, height: 0,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    appendChild(c) { this.children.push(c); return c; }, append() {}, prepend() {}, remove() {}, removeChild() {},
    setAttribute() {}, getAttribute: () => null, addEventListener() {}, removeEventListener() {},
    querySelector: () => fakeElement(), querySelectorAll: () => [], getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    focus() {}, blur() {}, click() {}, textContent: "", innerHTML: "", value: ""
  };
  el.getContext = () => el._ctx || (el._ctx = fakeContext(el));
  el.toDataURL = () => "data:image/png;base64,";
  return el;
}

let installed = false;
export function installStubs() {
  if (installed) return;
  installed = true;
  const store = {};
  const g = globalThis;
  g.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; }, clear: () => {} };
  g.document = {
    documentElement: fakeElement("html"), body: fakeElement("body"), head: fakeElement("head"),
    createElement: fakeElement, getElementById: () => fakeElement(), querySelector: () => fakeElement(), querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {}, fonts: { ready: Promise.resolve() }, hidden: false
  };
  g.window = g;
  g.addEventListener = () => {};
  g.removeEventListener = () => {};
  g.requestAnimationFrame = () => 0;
  g.Image = class { constructor() { this.complete = false; } set src(v) { this._src = v; } get src() { return this._src; } };
  g.fetch = async () => ({ ok: false, status: 404, json: async () => ({}), text: async () => "" });
  g.AudioContext = g.webkitAudioContext = undefined;   // audio.js creates its context lazily on first sound
  if (!g.navigator) g.navigator = { userAgent: "node" };
}

/** Import a game module by repo-relative path, e.g. load("js/bestiary.js"). `root` loads from another checkout. */
export async function load(rel, root = ROOT) {
  installStubs();
  return import(pathToFileURL(path.join(root, rel)).href);
}

/** Replace Math.random with a seeded generator (mulberry32) for repeatable runs. */
export function seedRandom(seed = 1) {
  let a = seed >>> 0;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
