---
name: game-control
description: Play Vanguard of Fate step by step as an agent through the vof-game MCP server (boot a new game or save, press and hold keys, see the screen, read hero/monster/quest state, travel, set level and class, run the autoplay bot, collect console errors), or drive the HTML overlays with the Playwright MCP server. Use when a task needs interactive play, exploring a bug by hand, checking how something feels, or clicking through menus, rather than a one-shot playtest script.
---

# Game control (MCP)

Two MCP servers are registered in `.mcp.json` and enabled in `.claude/settings.json`. Both run headless in cloud sessions (they use the pre-installed Chromium in `/opt/pw-browsers`) and on a desktop with Playwright installed. They load when a session starts; a session that started before they existed won't have them, so use the CLIs below instead.

## vof-game (tools/mcp/vof-game-mcp.mjs)

Game-aware, no dependencies beyond Playwright, built on `scripts/gamebrowser.mjs`. One game at a time; screenshots come back as images.

| tool | what it does |
| --- | --- |
| `game_start` | boot with `?debug`; `flow`: `title`, `newgame` (default), `continue` + `save_path`; optional `level`, `cls`, `area` setup |
| `game_input` | key script: `Enter`, `KeyD*45` (hold 45 frames), `wait:500`, `shot:name`, `click:<css>`, `drag:<a>>><b>`, `eval:<js>` |
| `game_hold` | hold several keys together for N frames (walk diagonally while attacking) |
| `game_state` | hero (class, level, EXP, HP, stamina, gold, attack, defense, x/y), area, safe zone, quest step, nearest monsters, open panels |
| `game_screenshot` / `game_eval` / `game_logs` / `game_stop` | look, read anything on `window.__vof`, console errors and failed requests |
| `game_travel` | jump to `hub` or a platform (`canopy coast frost ash strand ossuary siege chainspire maw`), set `level` / `cls` |
| `game_autoplay` | the bot plays N seconds: kills/min, EXP/min, lowest HP, potions, deaths, stuck count, errors (`immortal`, `hunt`) |

Controls: WASD move, J attack, K / L skills, Space sprint, E talk, Q quests, I inventory, C character, M map, N codex, Esc pause, 1–4 quick slots. `window.__vof` (debug only) is listed at the end of `js/main.js`.

Typical loop: `game_start {flow:"newgame"}` → `game_state` → `game_input` / `game_hold` → screenshot → `game_logs`. Prefer `game_state` over screenshots when a number answers the question; screenshots cost far more tokens.

## playwright (tools/mcp/playwright-mcp.mjs)

The official `@playwright/mcp` (pinned) for generic browser work: accessibility snapshots of the DOM overlays (`browser_snapshot`), `browser_click` by element, `browser_console_messages`, `browser_network_requests`, `browser_evaluate`. The wrapper also serves the repo on `http://127.0.0.1:5173/` (or reuses whatever is there), so start with `browser_navigate` to `http://127.0.0.1:5173/?debug`. Use it for menus, forms and layout; use vof-game for play.

## Same thing without MCP

```
node .claude/skills/playtest/playtest.mjs --flow newgame --debug --keys-after "…"   # one-shot key script
node .claude/skills/autoplay/autoplay.mjs --class mage --level 25 --area ash        # the bot
node .claude/skills/visual-review/review.mjs --before HEAD                           # before/after screenshots
```

Not added: an Aseprite MCP server needs the Aseprite app, which cloud sessions don't have; `tools/aseprite/` already reads and writes `.aseprite` in Node.
