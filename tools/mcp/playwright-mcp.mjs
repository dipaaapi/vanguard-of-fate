#!/usr/bin/env node
/**
 * Starts the Playwright MCP server (@playwright/mcp, pinned) for free-form browser work on the game:
 * accessibility snapshots of the HTML overlays, clicks by element, console messages, network, screenshots.
 *
 * Also serves this repo on http://127.0.0.1:5173/ (unless something already listens there), so the agent
 * can browser_navigate to http://127.0.0.1:5173/?debug right away. Uses the cloud session's pre-installed
 * Chromium (/opt/pw-browsers) or CHROMIUM_PATH when present, headless unless VOF_HEADED=1.
 */
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { serve, chromiumPath } from "../../scripts/gamebrowser.mjs";

const VERSION = "0.0.83";
const PORT = Number(process.env.VOF_PORT || 5173);

let server = null;
try { ({ server } = await serve(undefined, PORT)); }
catch { process.stderr.write(`playwright-mcp: port ${PORT} is busy; using whatever serves it\n`); }

const args = ["-y", `@playwright/mcp@${VERSION}`, "--isolated", "--viewport-size", "960,600", "--output-dir", path.join(os.tmpdir(), "playwright-mcp")];
if (process.env.VOF_HEADED !== "1") args.push("--headless");
const exe = chromiumPath();
if (exe) args.push("--executable-path", exe);
// Containers run as root, where Chromium refuses its sandbox
if (process.getuid && process.getuid() === 0) args.push("--no-sandbox");

const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", args, { stdio: "inherit", shell: process.platform === "win32" });
const stop = () => { child.kill(); if (server) server.close(); };
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
child.on("exit", (code) => { if (server) server.close(); process.exit(code ?? 0); });
