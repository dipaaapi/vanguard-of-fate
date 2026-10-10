---
name: playtest
description: Boot Vanguard of Fate in headless Chromium, drive it with key scripts (new game, continue a save, walk, open panels), and get console errors plus screenshots. Use to confirm a change works in the real game, to reproduce a bug report, or to check a screen, instead of asking the user to test in their browser.
---

# Playtest (headless browser)

```
P=.claude/skills/playtest/playtest.mjs
node $P                               # boot to the title screen: console errors + 1 screenshot
node $P --flow newgame                # title → creator → Act I prologue (skipped) → summoned into the Barracks → walk
node $P --save save.json              # load a save into localStorage, then Continue
node $P --lang fil                    # Filipino UI
node $P --keys "wait:1200,Enter,wait:400,Enter,wait:1500,shot:creator,KeyR,shot:random"
```

Key script steps (comma-separated): `Enter` / `KeyJ` / `ArrowDown` tap a key (`KeyboardEvent.code`), `KeyD*45` holds it for 45 frames, `wait:800` waits ms, `shot` or `shot:name` saves a screenshot, `eval:<js>` prints a value from the page, `click:<selector>` clicks an element, `drag:<from>>><to>` drags one element onto another with the mouse (selectors without commas). Screenshots go to `<tmp>/vof-playtest/` (960×600). Look at them with the Read tool, one at a time, only the ones you need.

The run exits 1 on any console error, uncaught exception or failed same-origin request. It ignores Google Fonts failures (offline/proxy) and the Act banner extension probes in `js/lore.js`.

## Frame rate

```
node .claude/skills/playtest/perf.mjs                       # every scene at 1920×1080 with a 4× slower CPU
node .claude/skills/playtest/perf.mjs --areas hub-night,ash --viewport 2560x1440 --profile
```

`fps` is frames delivered per second (headless is not locked to vsync, so above 60 is headroom); the `js` columns are the game's own work per frame, and `--profile` lists the functions with the most self time. Compare before/after a change with `--json`; runs vary about ±10%.

## Notes

- Needs Playwright with a Chromium it can launch (`npm i -D playwright && npx playwright install chromium` on a new machine). Cloud sessions already have it. The page is served by Node's own `http` module on a free port.
- The browser driver (server, flows, key scripts, state summary, bot) is `scripts/gamebrowser.mjs`, shared with `/autoplay`, `/visual-review` and the vof-game MCP server (`/game-control`). Flows are plain key scripts at its top. When a menu changes (`js/title.js`, `js/creator.js`, `js/prologue.js`), fix the flow there.
- Game state lives in module scope (`js/main.js`), not on `window`; with `--debug` read it through `window.__vof` (listed at the end of `js/main.js`), otherwise through the DOM or `localStorage.vanguard_savegame`.
- Step-by-step play, with the screen and state after every move: `/game-control` (MCP). A bot that fights for N seconds: `/autoplay`. Before/after screenshots of every scene: `/visual-review`.
- Prefer the headless tools first (`codemap verify`, `content-check`, `balance-sim`, `sprite-tool`): they take under a second. Use playtest when the change is about flow, DOM/UI, input or timing.
