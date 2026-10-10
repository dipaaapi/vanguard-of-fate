#!/usr/bin/env node
/**
 * vof-game — an MCP server (stdio, no dependencies) that lets an agent play Vanguard of Fate in headless
 * Chromium step by step: boot a flow, press and hold keys, look at the screen, read the game state, run the
 * autoplay bot, travel, and collect console errors. Registered in .mcp.json; see .claude/skills/game-control.
 *
 * Built on scripts/gamebrowser.mjs (the same driver as the playtest/autoplay skills). One game at a time;
 * game_start replaces the running one. Screenshots come back as images (and are saved to <tmp>/vof-mcp/).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { startGame, runSteps, readState, autoplay, setupHero, FLOWS, ROOT } from "../../scripts/gamebrowser.mjs";

let game = null;
const OUT = path.join(os.tmpdir(), "vof-mcp");

const image = async (scale) => {
  const buf = await game.page.screenshot({ type: "png", scale: scale === "device" ? "device" : "css" });
  return { type: "image", data: buf.toString("base64"), mimeType: "image/png" };
};
const text = (v) => ({ type: "text", text: typeof v === "string" ? v : JSON.stringify(v, null, 2) });
const need = () => { if (!game) throw new Error("No game running; call game_start first."); };
const logsSince = (n) => ({ errors: game.logs.errors.slice(n.e), failedRequests: game.logs.failed.slice(n.f) });
const mark = () => ({ e: game.logs.errors.length, f: game.logs.failed.length });

const TOOLS = [
  {
    name: "game_start",
    description: "Boot Vanguard of Fate in headless Chromium (with the ?debug state handle) and run a flow: 'title' (stop at the title screen), 'newgame' (title → creator → prologue → summoned into the Barracks hub), or 'continue' (needs save_path). Optional setup after the flow: level, cls (knight|mage|priest|archer|fighter, via Job Awakening) and area (hub or a platform id such as canopy, coast, frost, ash, strand, ossuary, siege, chainspire, maw). Returns the state summary and a screenshot.",
    inputSchema: { type: "object", properties: {
      flow: { type: "string", enum: ["title", "newgame", "continue"], default: "newgame" },
      save_path: { type: "string", description: "Save JSON file (relative to the repo) put in localStorage before boot" },
      lang: { type: "string", enum: ["en", "fil"] },
      viewport: { type: "string", default: "960x600" },
      level: { type: "integer" }, cls: { type: "string" }, area: { type: "string" }
    } }
  },
  {
    name: "game_input",
    description: "Run a key script on the running game and return a screenshot. Steps are comma-separated or an array: 'Enter' taps a key (KeyboardEvent.code: KeyW/KeyA/KeyS/KeyD move, KeyJ attack, KeyK/KeyL skills, Space sprint, KeyE talk, KeyI inventory, KeyC character, KeyM map, Escape), 'KeyD*45' holds a key 45 frames (60 = 1 s), 'wait:500' waits ms, 'shot:name' also saves a file, 'click:<css selector>', 'drag:<from>>><to>', 'eval:<js>'. Movement keys can be held together, e.g. ['KeyD*30', ...] runs in sequence.",
    inputSchema: { type: "object", properties: { keys: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] }, screenshot: { type: "boolean", default: true } }, required: ["keys"] }
  },
  {
    name: "game_hold",
    description: "Hold several keys at once for a number of frames (e.g. ['KeyD','KeyS','KeyJ'] to walk diagonally while attacking), then release them. Returns a screenshot.",
    inputSchema: { type: "object", properties: { keys: { type: "array", items: { type: "string" } }, frames: { type: "integer", default: 30 }, screenshot: { type: "boolean", default: true } }, required: ["keys"] }
  },
  { name: "game_screenshot", description: "Screenshot the running game (960×600 by default).", inputSchema: { type: "object", properties: {} } },
  {
    name: "game_state",
    description: "Compact JSON state: scene, area, safe zone, hero (class, level, EXP, HP, stamina, gold, attack, defense, position), quest step, nearest live monsters (key, level, HP, distance, elite/boss), open panels, HUD text.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "game_eval",
    description: "Evaluate a JavaScript expression in the page and return its JSON value. With the debug handle, window.__vof exposes player, stage, state, quest, enemyManager, lootManager, mercManager, npcManager, inventory, travelTo(id), warpTo(id), awaken(hero), ROSTER, saveGame(), dialog and more (js/main.js, end of file).",
    inputSchema: { type: "object", properties: { js: { type: "string" } }, required: ["js"] }
  },
  {
    name: "game_autoplay",
    description: "Let the built-in bot play for N seconds: walks to the nearest fair fight, holds attack in range, uses K/L skills, drinks from quick slot 1 below 40% HP, clicks through dialogs. Returns kills/min, EXP/min, level change, gold, lowest HP, potion taps, deaths, stuck count, console errors, and a final screenshot. immortal refills HP at 25% (soak tests); hunt also attacks elites and bosses.",
    inputSchema: { type: "object", properties: { seconds: { type: "integer", default: 30 }, immortal: { type: "boolean" }, hunt: { type: "boolean" }, skills: { type: "boolean", default: true } } }
  },
  {
    name: "game_travel",
    description: "Move the hero to an area (hub or a platform id) and/or set level and class, like game_start's setup. Returns the state summary and a screenshot.",
    inputSchema: { type: "object", properties: { area: { type: "string" }, level: { type: "integer" }, cls: { type: "string" } } }
  },
  { name: "game_logs", description: "Console errors, warnings and failed requests since the game started.", inputSchema: { type: "object", properties: {} } },
  { name: "game_stop", description: "Close the browser.", inputSchema: { type: "object", properties: {} } }
];

const HANDLERS = {
  async game_start(a) {
    if (game) { await game.close(); game = null; }
    const save = a.save_path ? fs.readFileSync(path.resolve(ROOT, a.save_path), "utf8") : null;
    game = await startGame({ debug: true, save, lang: a.lang, viewport: a.viewport, outDir: OUT });
    const flow = a.flow === "title" ? FLOWS.boot : a.flow === "continue" || (!a.flow && save) ? FLOWS.continue : FLOWS.newgame;
    await runSteps(game, flow);
    const setup = a.level || a.cls || a.area ? await setupHero(game, a) : null;
    return [text({ setup, state: await readState(game), errors: game.logs.errors, failedRequests: game.logs.failed }), await image()];
  },
  async game_input(a) {
    need(); const m = mark();
    const r = await runSteps(game, a.keys);
    const out = [text({ evals: r.evals, saved: r.shots, ...logsSince(m) })];
    if (a.screenshot !== false) out.push(await image());
    return out;
  },
  async game_hold(a) {
    need(); const m = mark();
    for (const k of a.keys) await game.page.keyboard.down(k);
    await game.page.waitForTimeout(Math.round(((a.frames || 30) * 1000) / 60));
    for (const k of a.keys) await game.page.keyboard.up(k);
    const out = [text(logsSince(m))];
    if (a.screenshot !== false) out.push(await image());
    return out;
  },
  async game_screenshot() { need(); return [await image()]; },
  async game_state() { need(); return [text(await readState(game))]; },
  async game_eval(a) {
    need();
    const v = await game.page.evaluate(`(() => { const v = (${a.js}); try { return JSON.parse(JSON.stringify(v === undefined ? null : v)); } catch { return String(v); } })()`);
    return [text(v)];
  },
  async game_autoplay(a) { need(); const r = await autoplay(game, a); return [text(r), await image()]; },
  async game_travel(a) { need(); const s = await setupHero(game, a); return [text({ setup: s, state: await readState(game) }), await image()]; },
  async game_logs() { need(); return [text(game.logs)]; },
  async game_stop() { if (game) await game.close(); game = null; return [text("stopped")]; }
};

// ── JSON-RPC over stdio (newline-delimited) ──────────────────────────────────
const send = (msg) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...msg }) + "\n");
async function handle(msg) {
  const { id, method, params = {} } = msg;
  if (method === "initialize") {
    return send({ id, result: { protocolVersion: params.protocolVersion || "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "vof-game", version: "1.0.0" } } });
  }
  if (method === "ping") return send({ id, result: {} });
  if (method === "tools/list") return send({ id, result: { tools: TOOLS } });
  if (method === "tools/call") {
    const fn = HANDLERS[params.name];
    if (!fn) return send({ id, error: { code: -32602, message: `unknown tool ${params.name}` } });
    try { return send({ id, result: { content: await fn(params.arguments || {}) } }); }
    catch (e) { return send({ id, result: { content: [text(`error: ${e.message}`)], isError: true } }); }
  }
  if (id !== undefined) send({ id, error: { code: -32601, message: `method not found: ${method}` } });
}

let buf = "", queue = Promise.resolve();
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buf += chunk;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    let msg; try { msg = JSON.parse(line); } catch { send({ id: null, error: { code: -32700, message: "parse error" } }); continue; }
    queue = queue.then(() => handle(msg)).catch((e) => process.stderr.write(`vof-game: ${e.stack}\n`));   // one call at a time
  }
});
const quit = async () => { if (game) await game.close(); process.exit(0); };
process.stdin.on("end", quit);
process.on("SIGTERM", quit);
process.on("SIGINT", quit);
