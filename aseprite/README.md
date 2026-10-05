# Aseprite sources

Hand-drawn creature art. A file here replaces that creature's code-drawn frames in the game;
everything without a file keeps the procedural sprite from `js/avatar/creature.js` / `beasts.js`.

```
aseprite/monster/<key>.aseprite   → MONSTERS[<key>] in js/bestiary.js
aseprite/boss/<key>.aseprite      → BOSSES[<key>]
```

## Workflow

1. Start from the current art (optional): `node tools/aseprite/seed.mjs monster/wolf`
2. Paint in Aseprite. Keep one tag per direction + animation named `<down|side|up>-<anim>`
   (`side-walk`, `up-attack`, …). The side view faces right; the game mirrors it.
3. Export: `node tools/aseprite/export.mjs` (or `… export.mjs monster/wolf`). It runs `aseprite -b`,
   writes `assets/sprites/<kind>/<key>.png` + `.json`, updates `assets/sprites/manifest.json`, and warns
   about wrong tag names, sizes or frame counts.
4. Reload the game. Commit the `.aseprite` and the exported files together.

Rules the game relies on:

- Monsters play `idle`, `walk` (wandering) and `attack` (the strike: first frame = ready, the rest
  spread over the hit), plus two that only sheets add: `run` while chasing the hero and `skill` while
  charging a strike. Tags can have any number of frames.
- The feet stay where the code sprite has them (e.g. the slime's at 12,16 on 24×18). A bigger canvas is
  fine: the extra width is split evenly left/right and the extra height goes on top, so the
  32×24 slime has its feet at 16,22. Keep the width difference even.
- A missing tag falls back to the code-drawn frames, so a sheet can be partial (e.g. only `side-walk`).
- Hidden layers are not exported, so a hidden reference or sketch layer is fine.
- The game draws its own outline only on code-drawn frames; draw the outline in Aseprite.
- `/sprite-preview` still shows the code-drawn art; check sheets in the game.

Set `ASEPRITE` to the executable if the tools can't find it (they look on PATH, then in the Steam and
standard install folders).

`monster/slime.aseprite` is the detailed Forest Slime (32×24, 78 frames: idle 4, walk 6, run 6,
attack 4, skill 6 in each direction), painted procedurally as a starting point for hand edits.
