---
name: visual-review
description: Screenshot a fixed tour of Vanguard of Fate (title, creator, hub, all nine campaign platforms, inventory, character, world map) and compare it with any git commit as before | after | changed-pixels sheets with a percent changed per scene. Use after any change to art, tiles, lighting, UI, CSS, fonts or effects, to review how it looks before committing or to show the user, and to catch accidental visual regressions in scenes the change wasn't meant to touch.
---

# Visual review (before/after screenshots)

```
R=.claude/skills/visual-review/review.mjs
node $R --list                                   # scene names
node $R --before HEAD                            # working tree vs last commit, every scene
node $R --before origin/main --scenes hub,ash,inventory
node $R --scenes frost,maw                       # just screenshots, no comparison
```

`--before <ref>` checks the commit out in a temporary git worktree, runs the same tour there and removes it afterwards. Sheets go to `<tmp>/vof-review/<scene>.png` (before | after | diff, changed pixels in magenta over a dimmed after-image). Look at the sheets with the Read tool, only the scenes whose number moved.

- `Math.random` is seeded (`--seed`, default 7), so maps and spawns repeat; animations still differ by timing, so expect ~0.5–2% noise on busy scenes. A real change shows up as a solid magenta shape, noise as speckle.
- Platform scenes set a level and class through the debug handle so the hero and HUD look like mid-campaign.
- For one sprite or icon, `/sprite-preview` (no browser, under a second) is cheaper. For frame rate after a visual change, `node .claude/skills/playtest/perf.mjs`.
- Exit code 1 when any scene logs a console error.
