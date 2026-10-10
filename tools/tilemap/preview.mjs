#!/usr/bin/env node
/**
 * preview.mjs — renders the terrain tile sets (assets/sprites/tiles/, from aseprite/tiles/) on their layouts
 * in headless Chromium and writes PNGs: one 480×270 game view per theme, a contact sheet of all of them,
 * and the hand-made maps in data/tilemaps.json.
 *
 *   node tools/tilemap/preview.mjs                          # everything, into <tmp>/vof-terrain/
 *   node tools/tilemap/preview.mjs coast frost --scale 3    # only these themes
 *   node tools/tilemap/preview.mjs --layout river --seed 9  # every theme on one layout
 *   node tools/tilemap/preview.mjs --out shots/ --tick 40
 *
 * Paint and re-export the tile sets first: node tools/aseprite/paint/paint.mjs tiles && node tools/aseprite/export.mjs
 * tools/tilemap/viewer.html is the interactive version (theme, layout, seed, paint cells by hand).
 * Needs Playwright with Chromium (cloud sessions have it).
 */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf("--" + name); return i >= 0 ? argv[i + 1] : def; };
const valued = new Set(["--scale", "--out", "--tick", "--layout", "--seed"]);
const only = argv.filter((a, i) => !a.startsWith("--") && !valued.has(argv[i - 1]));
const scale = +opt("scale", 2), tick = +opt("tick", 0), layout = opt("layout", null), seed = +opt("seed", 3);
const out = path.resolve(opt("out", path.join(os.tmpdir(), "vof-terrain")));

const require = createRequire(import.meta.url);
let pw = null;
for (const r of [ROOT, process.env.NODE_PATH, "/opt/node22/lib/node_modules", path.join(path.dirname(process.execPath), "../lib/node_modules")].filter(Boolean)) {
  try { pw = require(require.resolve("playwright", { paths: [r] })); break; } catch { /* next */ }
}
if (!pw) { console.error("Playwright not found: npm i -D playwright && npx playwright install chromium"); process.exit(2); }

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const exe = ["/opt/pw-browsers/chromium", process.env.CHROMIUM_PATH].find((p) => p && fs.existsSync(p) && fs.statSync(p).isFile());
const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });

fs.mkdirSync(out, { recursive: true });
await page.goto(`${base}tools/tilemap/viewer.html`);
await page.waitForFunction(() => window.terrainReady === true, null, { timeout: 20000 });
const save = (name, url) => { const f = path.join(out, name); fs.writeFileSync(f, Buffer.from(url.split(",")[1], "base64")); console.log(f); };

const shots = await page.evaluate(async ([only, layout, seed, scale, tick]) => {
  const { TerrainMap } = await import("/js/world/terrain.js");
  const { makeLayout } = await import("/js/world/layouts.js");
  const { TILE_THEMES, data } = window.terrain;
  const VW = 480, VH = 270, base = "/assets/sprites/tiles/";
  const up = (c, s) => { const b = document.createElement("canvas"); b.width = c.width * s; b.height = c.height * s;
    const g = b.getContext("2d"); g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, b.width, b.height); return b; };
  const view = (map) => { const c = document.createElement("canvas"); c.width = VW; c.height = VH;
    map.draw(c.getContext("2d"), (map.width - VW) / 2, (map.height - VH) / 2, VW, VH, tick); return c; };
  const res = { themes: [], maps: [] }, views = [];
  for (const theme of TILE_THEMES.filter((t) => !only.length || only.includes(t))) {
    const kind = layout || data.themeLayouts[theme] || "islands";
    const { cells, cols, rows } = makeLayout(kind, 40, 24, seed + theme.length);
    const map = new TerrainMap(cells, cols, rows, { theme, seed, sheetBase: base });
    await map.ready;
    const v = view(map);
    views.push([theme, kind, v]);
    res.themes.push([theme, kind, up(v, scale).toDataURL("image/png")]);
  }
  // contact sheet: 3 columns, label under each view
  const cols = 3, lab = 14, sheet = document.createElement("canvas");
  sheet.width = cols * VW; sheet.height = Math.ceil(views.length / cols) * (VH + lab);
  const g = sheet.getContext("2d");
  g.fillStyle = "#0b1020"; g.fillRect(0, 0, sheet.width, sheet.height);
  g.font = "10px monospace"; g.fillStyle = "#e2e8f0";
  views.forEach(([t, k, v], i) => { const x = (i % cols) * VW, y = Math.floor(i / cols) * (VH + lab); g.drawImage(v, x, y); g.fillText(`${t} · ${k}`, x + 4, y + VH + 10); });
  res.sheet = up(sheet, Math.max(1, scale - 1)).toDataURL("image/png");
  if (!only.length) for (const [key, m] of Object.entries(data.maps)) {
    const map = TerrainMap.fromRows(m.rows, { theme: m.theme, seed: m.seed, sheetBase: base });
    await map.ready;
    const c = document.createElement("canvas"); c.width = map.width; c.height = map.height;
    map.draw(c.getContext("2d"), 0, 0, c.width, c.height, tick);
    res.maps.push([key, up(c, scale + 2).toDataURL("image/png")]);
  }
  return res;
}, [only, layout, seed, scale, tick]);
for (const [t, k, url] of shots.themes) save(`terrain-${t}.png`, url);
save("terrain-all.png", shots.sheet);
for (const [k, url] of shots.maps) save(`map-${k}.png`, url);
await browser.close();
server.close();
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
