#!/usr/bin/env node
/**
 * preview.mjs — renders the island tile maps in data/islands.json to PNG in headless Chromium.
 *
 *   node tools/tilemap/preview.mjs                      # every map, scale 3, into <tmp>/vof-islands/
 *   node tools/tilemap/preview.mjs sample --scale 4 --out shots/ --tick 40
 *
 * The page is tools/tilemap/viewer.html (open it on the dev server to paint islands by hand).
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
const valued = new Set(["--scale", "--out", "--tick"]);
const only = argv.filter((a, i) => !a.startsWith("--") && !valued.has(argv[i - 1]));
const scale = +opt("scale", 3), tick = +opt("tick", 0);
const out = path.resolve(opt("out", path.join(os.tmpdir(), "vof-islands")));

const require = createRequire(import.meta.url);
let pw = null;
for (const r of [ROOT, process.env.NODE_PATH, "/opt/node22/lib/node_modules", path.join(path.dirname(process.execPath), "../lib/node_modules")].filter(Boolean)) {
  try { pw = require(require.resolve("playwright", { paths: [r] })); break; } catch { /* next */ }
}
if (!pw) { console.error("Playwright not found: npm i -D playwright && npx playwright install chromium"); process.exit(2); }

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json" };
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

const maps = Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, "data/islands.json"), "utf8"))).filter((k) => !k.startsWith("_"));
fs.mkdirSync(out, { recursive: true });
for (const key of maps.filter((k) => !only.length || only.includes(k))) {
  await page.goto(`${base}tools/tilemap/viewer.html?map=${key}`);
  await page.waitForFunction(() => window.islandReady === true, null, { timeout: 15000 });
  const url = await page.evaluate(([s, t]) => {
    const map = window.islandMap(), pad = 32;
    const c = document.createElement("canvas");
    c.width = map.width + pad * 2; c.height = map.height + pad * 2;
    map.draw(c.getContext("2d"), -pad, -pad, c.width, c.height, t);
    const big = document.createElement("canvas");
    big.width = c.width * s; big.height = c.height * s;
    const g = big.getContext("2d");
    g.imageSmoothingEnabled = false;
    g.drawImage(c, 0, 0, big.width, big.height);
    return big.toDataURL("image/png");
  }, [scale, tick]);
  const file = path.join(out, `island-${key}.png`);
  fs.writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
  console.log(file);
}
await browser.close();
server.close();
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
