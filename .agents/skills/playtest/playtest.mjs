#!/usr/bin/env node
/**
 * playtest — boots Vanguard of Fate in headless Chromium, drives it with keys, and reports console errors
 * plus screenshots. Use it instead of asking the user to "open the browser and check".
 *
 *   node .claude/skills/playtest/playtest.mjs                       # title screen boot: errors + screenshot
 *   node .claude/skills/playtest/playtest.mjs --flow newgame        # title → New Expedition → creator (codex scene) → prologue → summoned into the world
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
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { startGame, runSteps, readState, FLOWS } from "../../../scripts/gamebrowser.mjs";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };

// Flows live in scripts/gamebrowser.mjs (shared with autoplay, visual-review and the vof-game MCP server)
const script = [opt("--keys", null) || FLOWS[opt("--flow", opt("--save", null) ? "continue" : "boot")], opt("--keys-after", null)].filter(Boolean).join(",");
if (!script) { console.error(`unknown flow; flows: ${Object.keys(FLOWS).join(", ")}`); process.exit(1); }

const save = opt("--save", null);
const outDir = opt("--out", path.join(os.tmpdir(), "vof-playtest"));
let g;
try {
  g = await startGame({ debug: argv.includes("--debug"), save: save ? fs.readFileSync(path.resolve(save), "utf8") : null, lang: opt("--lang", null), viewport: opt("--viewport", "960x600"), outDir });   // --debug exposes window.__vof (js/main.js)
} catch (e) { console.error(e.message); process.exit(2); }
const { logs } = g;
await runSteps(g, script, { log: console.log });
const state = await readState(g);
await g.close();

console.log(`screenshots (${outDir}):\n  ${g.shots.map((s) => path.basename(s)).join("\n  ") || "(none)"}`);
console.log(`page: ${state.title}${state.hud ? ` · hud "${state.hud.slice(0, 80)}"` : ""} · save in localStorage: ${state.save}`);
if (logs.failed.length) console.log(`failed requests (${logs.failed.length}):\n  ${[...new Set(logs.failed)].join("\n  ")}`);
if (logs.warnings.length) console.log(`console warnings (${logs.warnings.length}):\n  ${[...new Set(logs.warnings)].slice(0, 10).join("\n  ")}`);
console.log(logs.errors.length ? `console errors (${logs.errors.length}):\n  ${[...new Set(logs.errors)].join("\n  ")}` : "console errors: none");
process.exitCode = logs.errors.length || logs.failed.length ? 1 : 0;
