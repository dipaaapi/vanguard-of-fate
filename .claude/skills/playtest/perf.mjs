#!/usr/bin/env node
/**
 * perf — frame-time profile of Vanguard of Fate in headless Chromium.
 *
 *   node .claude/skills/playtest/perf.mjs                 # title, creator, prologue, hub (day/night) and every platform
 *   node .claude/skills/playtest/perf.mjs --cpu 4         # emulate a 4× slower CPU (default 4: a mid-range phone)
 *   node .claude/skills/playtest/perf.mjs --areas hub,ash --secs 4 --json out.json --viewport 960x600 --profile
 *
 * For each scene it walks the hero in a circle and records how long each requestAnimationFrame callback takes
 * (update + draw = the game's own work per frame) and how many frames the browser delivered per second.
 * Headless Chromium is not locked to vsync, so fps above 60 is headroom; a large window (default 1920×1080)
 * makes the canvas draw at a 4× scale, which is where compositing, not JS, decides the frame rate.
 * Compare runs with --json before/after a change; numbers vary ±10% between runs, so look at big moves.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const CPU = Number(opt("--cpu", 4));
const SECS = Number(opt("--secs", 3));
const AREAS = (opt("--areas", "title,creator,prologue,hub,hub-night,canopy,coast,frost,ash,siege,maw")).split(",");

const require = createRequire(import.meta.url);
const pw = [ROOT, "/opt/node22/lib/node_modules"].map((r) => { try { return require(require.resolve("playwright", { paths: [r] })); } catch { return null; } }).find(Boolean);
if (!pw) { console.error("Playwright not found"); process.exit(2); }

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".md": "text/markdown; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(ROOT, url === "/" ? "index.html" : url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/?debug`;

const exe = ["/opt/pw-browsers/chromium", process.env.CHROMIUM_PATH].find((p) => p && fs.existsSync(p));
const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
const [VW, VH] = opt("--viewport", "1920x1080").split("x").map(Number);
const page = await browser.newPage({ viewport: { width: VW, height: VH } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
// Time every rAF callback: that is the game's whole per-frame work (fixed-step updates + drawing)
await page.addInitScript(() => {
  const raf = window.requestAnimationFrame.bind(window);
  window.__frames = [];
  window.requestAnimationFrame = (cb) => raf((t) => { const s = performance.now(); cb(t); window.__frames.push(performance.now() - s); });
});
const cdp = await page.context().newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU });

const press = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(250); } };
const PROFILE = argv.includes("--profile");
async function sample(name) {
  await page.evaluate(() => { window.__frames = []; window.__t0 = performance.now(); });
  if (PROFILE) { await cdp.send("Profiler.enable"); await cdp.send("Profiler.start"); }
  // walk in a square so the camera scrolls and enemies react
  for (const k of ["KeyD", "KeyS", "KeyA", "KeyW"]) { await page.keyboard.down(k); await page.waitForTimeout(SECS * 250); await page.keyboard.up(k); }
  const { f, ms, cw } = await page.evaluate(() => ({ f: window.__frames.slice(), ms: performance.now() - window.__t0, cw: document.getElementById("gameCanvas").width }));
  if (PROFILE) {
    // top self-time functions in the game's own code
    const { profile } = await cdp.send("Profiler.stop");
    const self = new Map(), dt = new Map();
    profile.samples.forEach((id, i) => dt.set(id, (dt.get(id) || 0) + (profile.timeDeltas[i] || 0)));
    let total = 0;
    for (const n of profile.nodes) {
      const t = (dt.get(n.id) || 0) / 1000; total += t;
      const cf = n.callFrame; if (cf.functionName === "(idle)" || cf.functionName === "(program)") continue;
      const key = `${cf.functionName || "(anon)"} ${cf.url.replace(/^.*?\/js\//, "js/")}:${cf.lineNumber + 1}`;
      self.set(key, (self.get(key) || 0) + t);
    }
    profiles[name] = [...self].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }
  f.sort((a, b) => a - b);
  const avg = f.reduce((a, b) => a + b, 0) / (f.length || 1);
  const p95 = f[Math.floor(f.length * 0.95)] || 0;
  // fps = frames the browser actually delivered (headless is not locked to vsync, so >60 means headroom);
  // the ms columns are the game's own JS per frame, which leaves out compositing the canvas to the screen
  const row = { area: name, scale: +(cw / 480).toFixed(2), fps: Math.round(f.length / (ms / 1000)), avg: +avg.toFixed(2), p95: +p95.toFixed(2), worst: +(f[f.length - 1] || 0).toFixed(1) };
  console.log(`${name.padEnd(10)} fps ${String(row.fps).padStart(4)}   js avg ${row.avg.toFixed(2).padStart(6)} ms   p95 ${row.p95.toFixed(2).padStart(6)} ms   worst ${row.worst.toFixed(1).padStart(6)} ms   canvas ×${row.scale}`);
  return row;
}

console.log(`CPU throttle ×${CPU}, ${SECS} s per area, window ${VW}×${VH}`);
await page.goto(base, { waitUntil: "load" });
await page.waitForTimeout(1500);
const rows = [];
const profiles = {};
if (AREAS.includes("title")) rows.push(await sample("title"));
await press("Enter"); await page.waitForTimeout(400); await press("Enter"); await page.waitForTimeout(1500);
if (AREAS.includes("creator")) rows.push(await sample("creator"));
await press("Enter"); await page.waitForTimeout(1200);
if (AREAS.includes("prologue")) rows.push(await sample("prologue"));
await press("Escape"); await page.waitForTimeout(2500);
await press("Enter", 5);
const world = AREAS.filter((a) => !["title", "creator", "prologue"].includes(a));
for (const a of world) {
  const id = a.replace("-night", "");
  await page.evaluate(([id, night]) => {
    const v = window.__vof;
    if (v.stage.id !== id) v.travelTo(id);
    v.player.hp = v.player.maxHp = 99999;   // stay alive while sampling
    if (v.dayNight) v.dayNight.forced = night ? "NIGHT" : null;
  }, [id, a.endsWith("-night")]);
  await page.waitForTimeout(300);
  for (let i = 0; i < 8 && await page.evaluate(() => window.__vof.dialog.open); i++) await press("Enter");   // close the arrival dialogue
  rows.push(await sample(a));
}
await browser.close();
server.close();
for (const [a, top] of Object.entries(profiles)) console.log(`\n${a} — top self time (ms):\n  ${top.map(([k, t]) => `${t.toFixed(0).padStart(5)}  ${k}`).join("\n  ")}`);
if (errors.length) console.log(`page errors:\n  ${[...new Set(errors)].join("\n  ")}`);
const out = opt("--json", null);
if (out) fs.writeFileSync(out, JSON.stringify({ cpu: CPU, rows }, null, 2));
