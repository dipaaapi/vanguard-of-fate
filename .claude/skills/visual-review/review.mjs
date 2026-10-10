#!/usr/bin/env node
/**
 * visual-review — screenshots a fixed tour of the game (title, creator, hub, every campaign platform, the main
 * panels) and, with --before <git ref>, the same tour on that commit, then writes one contact sheet per scene
 * (before | after | changed pixels in magenta) and a summary with the share of pixels that changed.
 *
 *   node .claude/skills/visual-review/review.mjs                          # tour of the working tree → sheet.png
 *   node .claude/skills/visual-review/review.mjs --before HEAD            # uncommitted changes vs HEAD
 *   node .claude/skills/visual-review/review.mjs --before origin/main --scenes hub,ash,inventory
 *   node .claude/skills/visual-review/review.mjs --list                   # scene names
 *
 * Math.random is seeded (--seed, default 7) so maps and spawns repeat; animation timing still adds a little
 * noise (a few % on busy scenes), so look at the sheet, not only the number. Output: <tmp>/vof-review/.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { startGame, runSteps, setupHero, FLOWS, ROOT, findPlaywright, chromiumPath } from "../../../scripts/gamebrowser.mjs";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };

// Each scene: setup on a fresh new game (level/class/area through the debug handle), then a key script
const AREAS = ["canopy", "coast", "frost", "ash", "strand", "ossuary", "siege", "chainspire", "maw"];
const SCENES = {
  title: { flow: "boot" },
  creator: { keys: "wait:1200,Enter,wait:400,Enter,wait:1500" },
  hub: {},
  inventory: { after: "KeyI,wait:500" },
  character: { after: "KeyC,wait:500" },
  worldmap: { after: "KeyM,wait:600" },
  ...Object.fromEntries(AREAS.map((a, i) => [a, { setup: { area: a, level: 12 + i * 6, cls: ["knight", "mage", "priest", "archer", "fighter"][i % 5] }, after: "wait:900" }]))
};
if (argv.includes("--list")) { console.log(Object.keys(SCENES).join(", ")); process.exit(0); }
const names = (opt("--scenes", "") || Object.keys(SCENES).join(",")).split(",").filter((n) => SCENES[n]);
const seed = parseInt(opt("--seed", "7"), 10);
const OUT = path.join(os.tmpdir(), "vof-review");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

async function tour(root, tag) {
  const files = {};
  for (const n of names) {
    const sc = SCENES[n];
    const g = await startGame({ debug: true, root, seed, outDir: path.join(OUT, tag) });
    try {
      if (sc.keys) await runSteps(g, sc.keys);
      else if (sc.flow === "boot") await runSteps(g, "wait:1500");
      else {
        await runSteps(g, FLOWS.newgame.replace(/,?shot:[\w-]+/g, ""));
        if (sc.setup) await setupHero(g, sc.setup);
        await runSteps(g, sc.after || "wait:300");
      }
      const f = path.join(OUT, tag, `${n}.png`);
      await g.page.screenshot({ path: f });
      files[n] = { file: f, errors: [...new Set(g.logs.errors)] };
    } finally { await g.close(); }
  }
  return files;
}

// Git ref → a throwaway worktree of that commit (assets included)
const ref = opt("--before", null);
let beforeRoot = null;
if (ref) {
  beforeRoot = path.join(os.tmpdir(), `vof-review-${process.pid}`);
  execFileSync("git", ["worktree", "add", "--detach", beforeRoot, ref], { cwd: ROOT, stdio: "ignore" });
}
try {
  const after = await tour(ROOT, "after");
  const before = beforeRoot ? await tour(beforeRoot, "before") : null;

  // Compose the sheets in the browser (canvas does the PNG decoding and diffing; no image library needed)
  const pw = findPlaywright(), exe = chromiumPath();
  const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage();
  const rows = [];
  for (const n of names) {
    const a = fs.readFileSync(after[n].file).toString("base64");
    const b = before ? fs.readFileSync(before[n].file).toString("base64") : null;
    const res = await page.evaluate(async ([a, b]) => {
      const load = (d) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = `data:image/png;base64,${d}`; });
      const A = await load(a), B = b ? await load(b) : null;
      const w = A.width, h = A.height, cols = B ? 3 : 1, gap = 8;
      const c = document.createElement("canvas"); c.width = w * cols + gap * (cols - 1); c.height = h;
      const x = c.getContext("2d");
      x.fillStyle = "#111"; x.fillRect(0, 0, c.width, c.height);
      let changed = 0;
      if (B) {
        x.drawImage(B, 0, 0); x.drawImage(A, w + gap, 0);
        const t = document.createElement("canvas"); t.width = w; t.height = h; const tx = t.getContext("2d");
        tx.drawImage(A, 0, 0); const da = tx.getImageData(0, 0, w, h);
        tx.drawImage(B, 0, 0); const db = tx.getImageData(0, 0, w, h);
        const out = tx.createImageData(w, h);
        for (let i = 0; i < da.data.length; i += 4) {
          const d = Math.abs(da.data[i] - db.data[i]) + Math.abs(da.data[i + 1] - db.data[i + 1]) + Math.abs(da.data[i + 2] - db.data[i + 2]);
          const g = (da.data[i] + da.data[i + 1] + da.data[i + 2]) / 9;
          if (d > 48) { changed++; out.data[i] = 255; out.data[i + 1] = 0; out.data[i + 2] = 255; }
          else { out.data[i] = out.data[i + 1] = out.data[i + 2] = g; }
          out.data[i + 3] = 255;
        }
        tx.putImageData(out, 0, 0);
        x.drawImage(t, (w + gap) * 2, 0);
      } else x.drawImage(A, 0, 0);
      return { png: c.toDataURL("image/png").split(",")[1], changed: B ? changed / (w * h) : null };
    }, [a, b]);
    const sheet = path.join(OUT, `${n}.png`);
    fs.writeFileSync(sheet, Buffer.from(res.png, "base64"));
    rows.push({ scene: n, changed: res.changed, sheet, errors: after[n].errors, errorsBefore: before ? before[n].errors : [] });
  }
  await browser.close();

  console.log(before ? `scene        changed   (sheets: before | after | diff)` : "scene        (screenshots of the working tree)");
  for (const r of rows) {
    const pct = r.changed === null ? "" : `${(r.changed * 100).toFixed(1).padStart(5)}%`;
    console.log(`  ${r.scene.padEnd(11)} ${pct.padEnd(8)} ${r.sheet}${r.errors.length ? `  ⚠ ${r.errors.length} console error(s): ${r.errors[0]}` : ""}`);
  }
  if (rows.some((r) => r.errors.length)) process.exitCode = 1;
} finally {
  if (beforeRoot) execFileSync("git", ["worktree", "remove", "--force", beforeRoot], { cwd: ROOT, stdio: "ignore" });
}
