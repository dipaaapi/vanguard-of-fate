#!/usr/bin/env node
/**
 * playtest — boots Vanguard of Fate in headless Chromium, drives it with keys, and reports console errors
 * plus screenshots. Use it instead of asking the user to "open the browser and check".
 *
 *   node .claude/skills/playtest/playtest.mjs                       # title screen boot: errors + screenshot
 *   node .claude/skills/playtest/playtest.mjs --flow newgame        # title → New Expedition → prologue → creator → summoned into the world
 *   node .claude/skills/playtest/playtest.mjs --keys "Enter,wait:500,KeyD*30,shot"   # your own key script
 *   node .claude/skills/playtest/playtest.mjs --save my.json        # put a save in localStorage first, then Continue
 *   node .claude/skills/playtest/playtest.mjs --lang fil            # Filipino UI
 *   node .claude/skills/playtest/playtest.mjs --flow newgame --debug --keys-after "eval:__vof.travelTo('ash'),wait:800,shot"
 *
 * Key script: comma-separated steps. "Enter" taps a key (KeyboardEvent.code or key name), "KeyD*30" holds it
 * for 30 frames (~0.5 s), "wait:800" waits ms, "shot" or "shot:name" saves a screenshot, "eval:<js>" runs JS in
 * the page and prints the result (e.g. eval:document.querySelector('#hudText').textContent).
 *
 * Needs Playwright (`npm i -D playwright` or a global install) and a Chromium it can launch. Serves the repo
 * with Node's own http module on a free port; nothing else is installed.
 */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };

// ── Playwright, wherever it is installed ─────────────────────────────────────
function findPlaywright() {
  const require = createRequire(import.meta.url);
  const roots = [ROOT, process.env.NODE_PATH, "/opt/node22/lib/node_modules", path.join(path.dirname(process.execPath), "../lib/node_modules")].filter(Boolean);
  for (const r of roots) { try { return require(require.resolve("playwright", { paths: [r] })); } catch { /* next */ } }
  return null;
}
const pw = findPlaywright();
if (!pw) { console.error("Playwright not found. Install it once: npm i -D playwright && npx playwright install chromium"); process.exit(2); }

// ── Static server ────────────────────────────────────────────────────────────
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".md": "text/markdown; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(ROOT, url === "/" ? "index.html" : url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

// ── Flows ────────────────────────────────────────────────────────────────────
// Kept as key scripts so they are easy to adjust when menus change (see js/title.js, prologue.js, creator.js).
const FLOWS = {
  boot: "wait:1500,shot:title",
  newgame: "wait:1200,Enter,wait:400,Enter,wait:1500,shot:creator,Enter,wait:1500,shot:prologue,Escape,wait:2500,shot:arrival,Enter,wait:400,Enter,wait:400,Enter,wait:400,Enter,wait:400,Enter,wait:400,KeyD*45,wait:300,shot:world",
  continue: "wait:1200,Enter,wait:600,Enter,wait:2000,shot:continue,KeyD*40,shot:world"
};
const script = [opt("--keys", null) || FLOWS[opt("--flow", opt("--save", null) ? "continue" : "boot")], opt("--keys-after", null)].filter(Boolean).join(",");
if (!script) { console.error(`unknown flow; flows: ${Object.keys(FLOWS).join(", ")}`); process.exit(1); }

const outDir = opt("--out", path.join(os.tmpdir(), "vof-playtest"));
fs.mkdirSync(outDir, { recursive: true });
const errors = [], warnings = [], failed = [];
// Expected 404s: js/lore.js probes each Act banner as .jpeg, .jpg, .png, .webp (BANNER_EXTS) until one loads
const EXPECTED_404 = [/\/assets\/banner\/act-\d+\.\w+$/];
const expected = (url) => EXPECTED_404.some((re) => re.test(url));

const exe = ["/opt/pw-browsers/chromium", process.env.CHROMIUM_PATH].find((p) => p && fs.existsSync(p) && fs.statSync(p).isFile());
const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
const [VW, VH] = (opt("--viewport", "960x600")).split("x").map(Number);
const page = await browser.newPage({ viewport: { width: VW, height: VH } });
page.on("console", (m) => {
  // External resources (Google Fonts) can fail offline or behind a proxy; that is not a game error
  const src = (m.location() && m.location().url) || "";
  if (m.type() === "error" && /Failed to load resource/.test(m.text()) && src && (!src.startsWith(base) || expected(src))) return;
  if (m.type() === "error") errors.push(m.text()); else if (m.type() === "warning" && !/AudioContext was not allowed/.test(m.text())) warnings.push(m.text());
});
page.on("pageerror", (e) => errors.push(`uncaught: ${e.message}`));
page.on("requestfailed", (r) => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) failed.push(`${r.failure() && r.failure().errorText} ${r.url()}`); });
page.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(base) && !expected(r.url())) failed.push(`${r.status()} ${r.url().slice(base.length - 1)}`); });

const save = opt("--save", null);
const lang = opt("--lang", null);
await page.addInitScript(([s, l]) => {
  if (s) localStorage.setItem("vanguard_savegame", s);
  if (l) localStorage.setItem("vanguard_lang", l);
}, [save ? fs.readFileSync(path.resolve(save), "utf8") : null, lang]);

await page.goto(argv.includes("--debug") ? `${base}?debug` : base, { waitUntil: "load" });   // --debug exposes window.__vof (js/main.js)
const shots = [];
for (const raw of script.split(",").map((s) => s.trim()).filter(Boolean)) {
  const [step, arg] = raw.split(/:(.*)/);
  if (step === "wait") await page.waitForTimeout(parseInt(arg, 10) || 300);
  else if (step === "shot") {
    const f = path.join(outDir, `${String(shots.length + 1).padStart(2, "0")}-${arg || "shot"}.png`);
    await page.screenshot({ path: f });
    shots.push(f);
  } else if (step === "eval") console.log(`eval ${arg} → ${JSON.stringify(await page.evaluate(arg))}`);
  else {
    const [key, hold] = step.split("*");
    if (hold) { await page.keyboard.down(key); await page.waitForTimeout(Math.round((parseInt(hold, 10) * 1000) / 60)); await page.keyboard.up(key); }
    else await page.keyboard.press(key);
    await page.waitForTimeout(80);
  }
}
const state = await page.evaluate(() => ({
  title: document.title,
  hud: (document.getElementById("hudText") || {}).textContent || "",
  save: Boolean(localStorage.getItem("vanguard_savegame"))
}));
await browser.close();
server.close();

console.log(`screenshots (${outDir}):\n  ${shots.map((s) => path.basename(s)).join("\n  ") || "(none)"}`);
console.log(`page: ${state.title}${state.hud ? ` · hud "${state.hud.trim().slice(0, 80)}"` : ""} · save in localStorage: ${state.save}`);
if (failed.length) console.log(`failed requests (${failed.length}):\n  ${[...new Set(failed)].join("\n  ")}`);
if (warnings.length) console.log(`console warnings (${warnings.length}):\n  ${[...new Set(warnings)].slice(0, 10).join("\n  ")}`);
console.log(errors.length ? `console errors (${errors.length}):\n  ${[...new Set(errors)].join("\n  ")}` : "console errors: none");
process.exitCode = errors.length || failed.length ? 1 : 0;
