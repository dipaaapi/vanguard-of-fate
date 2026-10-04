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

Key script steps (comma-separated): `Enter` / `KeyJ` / `ArrowDown` tap a key (`KeyboardEvent.code`), `KeyD*45` holds it for 45 frames, `wait:800` waits ms, `shot` or `shot:name` saves a screenshot, `eval:<js>` prints a value from the page. Screenshots go to `<tmp>/vof-playtest/` (960×600). Look at them with the Read tool, one at a time, only the ones you need.

The run exits 1 on any console error, uncaught exception or failed same-origin request. It ignores Google Fonts failures (offline/proxy) and the Act banner extension probes in `js/lore.js`.

## Notes

- Needs Playwright with a Chromium it can launch (`npm i -D playwright && npx playwright install chromium` on a new machine). Cloud sessions already have it. The page is served by Node's own `http` module on a free port.
- Flows are plain key scripts at the top of `playtest.mjs`. When a menu changes (`js/title.js`, `js/creator.js`, `js/prologue.js`), fix the flow there.
- Game state lives in module scope (`js/main.js`), not on `window`; read it through the DOM (`#hudText`, panels) or `localStorage.vanguard_savegame` after a save.
- Prefer the headless tools first (`codemap verify`, `content-check`, `balance-sim`, `sprite-tool`): they take under a second. Use playtest when the change is about flow, DOM/UI, input or timing.
