#!/usr/bin/env node
/**
 * render.mjs — paints the procedural scene art in headless Chromium and writes the PNGs into assets/.
 *
 *   node tools/art/render.mjs                 # every scene in tools/art/scenes/index.js
 *   node tools/art/render.mjs act-7 title     # only keys starting with these prefixes
 *   node tools/art/render.mjs --list          # keys and output paths
 *   node tools/art/render.mjs act-7 --preview # write to <tmp>/vof-art/ instead of assets/ (for checking)
 *
 * Each scene is painted at native pixel size (480×270 for banners) and upscaled with nearest-neighbour
 * by its `scale`, so the pixels stay crisp in the game's smooth-scaled panels. When ImageMagick is
 * installed, PNGs with 256 colours or fewer are stored as palette PNGs (lossless, much smaller).
 * Needs Playwright with Chromium (cloud sessions have it; else `npm i -D playwright`).
 */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const only = argv.filter((a) => !a.startsWith("--"));

function findPlaywright() {
  const require = createRequire(import.meta.url);
  const roots = [ROOT, process.env.NODE_PATH, "/opt/node22/lib/node_modules", path.join(path.dirname(process.execPath), "../lib/node_modules")].filter(Boolean);
  for (const r of roots) { try { return require(require.resolve("playwright", { paths: [r] })); } catch { /* next */ } }
  return null;
}
const pw = findPlaywright();
if (!pw) { console.error("Playwright not found. Install it once: npm i -D playwright && npx playwright install chromium"); process.exit(2); }

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(ROOT, url);
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
page.on("response", (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) errors.push(`${r.status()} ${r.url()}`); });
await page.goto(base + "tools/art/studio.html");
await page.waitForFunction(() => window.studioReady === true, null, { timeout: 20000 }).catch(() => {});
if (errors.length) { console.error(errors.join("\n")); await browser.close(); server.close(); process.exit(1); }

const all = await page.evaluate(() => window.sceneList());
const match = (s, o) => (all.some((a) => a.key === o) ? s.key === o : s.key.startsWith(o));
const list = all.filter((s) => !only.length || only.some((o) => match(s, o)));
if (flags.has("--list")) {
  for (const s of list) console.log(`${s.key.padEnd(24)} ${s.w}×${s.h} ×${s.scale} → ${s.out}`);
  await browser.close(); server.close(); process.exit(0);
}

let hasMagick = false;
try { execFileSync("convert", ["-version"], { stdio: "ignore" }); hasMagick = true; } catch { /* optional */ }

const previewDir = path.join(os.tmpdir(), "vof-art");
let failed = 0;
for (const s of list) {
  const t0 = Date.now();
  let url;
  try { url = await page.evaluate((k) => window.renderScene(k), s.key); }
  catch (e) { console.error(`✗ ${s.key}: ${e.message.split("\n")[0]}`); failed++; continue; }
  const file = flags.has("--preview") ? path.join(previewDir, path.basename(s.out)) : path.join(ROOT, s.out);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
  if (hasMagick) {
    try {
      const colors = parseInt(execFileSync("identify", ["-format", "%k", file]).toString(), 10);
      if (colors <= 256) execFileSync("convert", [file, "-define", "png:compression-level=9", `PNG8:${file}`]);
    } catch { /* keep the RGBA PNG */ }
  }
  console.log(`✓ ${s.key.padEnd(24)} ${path.relative(ROOT, file)}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB  ${Date.now() - t0} ms`);
}
if (errors.length) console.error(errors.join("\n"));
await browser.close();
server.close();
process.exit(failed || errors.length ? 1 : 0);
