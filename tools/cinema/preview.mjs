#!/usr/bin/env node
/**
 * preview.mjs — renders frames of the HD cinematics (js/cinema/) headless with the game's own code.
 *
 *   node tools/cinema/preview.mjs pro:earth@0.5 pro:ritual@0.4     # prologue shot at progress 0..1
 *   node tools/cinema/preview.mjs act:10@300 act:7@120              # Act intro at frame t (0..450)
 *   node tools/cinema/preview.mjs act:all@260 --sheet               # every Act; one contact sheet
 *   node tools/cinema/preview.mjs pro:all@0.6 --sheet --w 1280      # every prologue shot
 *
 * Writes PNGs to <tmp>/vof-cinema/ (or --out dir) and prints the paths; --sheet also writes
 * sheet.png (needs ImageMagick's montage). Default size 1920×1080 (--w changes the width).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { serve, findPlaywright, chromiumPath, ROOT } from "../../scripts/gamebrowser.mjs";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const W = Number(opt("--w", 1920));
const out = opt("--out", path.join(os.tmpdir(), "vof-cinema"));
const PRO = ["golden-age", "eclipse", "blights", "throne", "earth", "crossing", "ritual", "sanctuary", "omen"];
const TITLES = { 1: "The Sundered Dominion", 7: "The Corrupted Sylvan Frontier", 10: "The Hellforge of Emberhold" };
const jobs = [];
for (const a of argv.filter((x) => /^(pro|act):/.test(x))) {
  const [kind, rest] = a.split(":");
  const [id, at] = rest.split("@");
  const ids = id === "all" ? (kind === "pro" ? PRO : Array.from({ length: 15 }, (_, i) => String(i + 1))) : [id];
  for (const i of ids) jobs.push({ kind, id: i, at: Number(at ?? (kind === "pro" ? 0.5 : 260)) });
}
if (!jobs.length) { console.error("usage: preview.mjs pro:<id>@<p> | act:<n>@<frame> … [--sheet] [--w 1920] [--out dir]"); process.exit(2); }

const pw = findPlaywright();
const { server, base } = await serve(ROOT);
const exe = chromiumPath();
const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: W, height: Math.round((W * 9) / 16) }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|fonts\.g/.test(m.text())) errors.push(m.text()); });
await page.goto(`${base}tools/cinema/harness.html?w=${W}`);
await page.waitForFunction(() => window.harnessReady === true, null, { timeout: 20000 });
fs.mkdirSync(out, { recursive: true });
const files = [];
for (const j of jobs) {
  const t0 = Date.now();
  try {
    const url = j.kind === "pro"
      ? await page.evaluate(([id, p]) => window.renderPro(id, p), [j.id, j.at])
      : await page.evaluate(([n, t, title]) => window.renderAct(n, t, title), [Number(j.id), j.at, TITLES[j.id] || `The Title of Act ${j.id}`]);
    const file = path.join(out, `${j.kind}-${j.id}@${j.at}.png`);
    fs.writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
    files.push(file);
    console.log(`✓ ${j.kind}:${j.id}@${j.at}  ${file}  ${Date.now() - t0} ms`);
  } catch (e) { console.error(`✗ ${j.kind}:${j.id}: ${e.message.split("\n")[0]}`); }
}
if (argv.includes("--sheet") && files.length) {
  const sheet = path.join(out, "sheet.png");
  execFileSync("montage", [...files, "-tile", "2x", "-geometry", "960x540+4+4", "-background", "#222", sheet]);
  console.log(`sheet: ${sheet}`);
}
if (errors.length) console.error(errors.join("\n"));
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
