# Aseprite sources

Hand-drawn creature art. A file here replaces that creature's code-drawn frames in the game;
everything without a file keeps the procedural sprite from `js/avatar/creature.js` / `beasts.js`.

```
aseprite/monster/<key>.aseprite   → MONSTERS[<key>] in js/bestiary.js
aseprite/boss/<key>.aseprite      → BOSSES[<key>]
```

## Workflow

1. Start from the current art (optional): `node tools/aseprite/seed.mjs monster/wolf`
2. Paint in Aseprite. Keep the canvas size, and keep one tag per direction + animation named
   `<down|side|up>-<anim>` (`side-walk`, `up-attack`, …). The side view faces right; the game mirrors it.
3. Export: `node tools/aseprite/export.mjs` (or `… export.mjs monster/wolf`). It runs `aseprite -b`,
   writes `assets/sprites/<kind>/<key>.png` + `.json`, updates `assets/sprites/manifest.json`, and warns
   about wrong tag names, sizes or frame counts.
4. Reload the game. Commit the `.aseprite` and the exported files together.

Rules the game relies on:

- The anchor is the code sprite's (e.g. the slime's feet at 12,16 on a 24×18 canvas), so the canvas size
  must match; a sheet of another size is ignored with a console warning.
- A missing tag, or missing frames at the end of a tag, fall back to the code-drawn frames, so a
  sheet can be partial (e.g. only `side-walk`).
- Hidden layers are not exported, so a hidden reference or sketch layer is fine.
- The game draws its own outline only on code-drawn frames; draw the outline in Aseprite.
- `/sprite-preview` still shows the code-drawn art; check sheets in the game.

Set `ASEPRITE` to the executable if the tools can't find it (they look on PATH, then in the Steam and
standard install folders).

`monster/slime.aseprite` was seeded from the code art, so the game looks the same until it is repainted.
