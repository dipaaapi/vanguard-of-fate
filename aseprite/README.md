# Aseprite sources

Hand-drawn creature art. A file here replaces that creature's code-drawn frames in the game;
everything without a file keeps the procedural sprite from `js/avatar/creature.js` / `beasts.js`.

```
aseprite/monster/<key>.aseprite   → MONSTERS[<key>] in js/bestiary.js
aseprite/boss/<key>.aseprite      → BOSSES[<key>]
aseprite/summon/slime|hound|owl|fox.aseprite → the familiars (js/summons/familiar.js)
aseprite/summon/falcon.aseprite   → the Archer's falcon (side view only: fly, dive, taunt)
aseprite/summon/angel.aseprite    → the Priest's Guardian Angel (an Avatar: 32×36 base, feet at 16,34)
aseprite/npc/<id>.aseprite        → an NPC (NPC_DEFS in js/npc/roster.js), Avatar-sized
aseprite/merc/<axe|crossbow|greatsword|wand>.aseprite → a mercenary
aseprite/fx/<name>.aseprite       → a skill or hit effect (one "down-play" tag, any size; js/fxsprites.js)
```

Without a file, everything still has detailed art from code: every character and monster gets a
volume-shading and texture pass (`Pix.detail` in js/avatar/avatar.js), and `run` / `skill` animations
built from the walk and attack. `seed.mjs` starts a file from exactly that, for any key above
(`node tools/aseprite/seed.mjs npc/brakka`, `monster/wolf`, `merc/axe`, `boss/malakor`). The hero's
look comes from the Character Creator, so the hero stays code-drawn.

Effects: `meteor`, `blast`, `lightning`, `holy`, `sphere`, `slash`, `wave`, `bolt`, `arrow`, `arrowfall`,
`bite`, `claw`, `arcane`. Heading effects point right (the game rotates them); `slash`, `wave`, `bolt`
and `bite` are painted in greys and tinted per skill.

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
- Familiars play `idle`, `walk`, `run` (chasing a foe or catching up), `attack` (one bite) and
  `skill` (every 4th bite; the hound's stunning bite). Birds play `fly` and `taunt` (the owl's spell),
  and the falcon also `dive`. The angel plays `idle`, `walk`, `attack` and `skill` (its taunt).
- The feet stay where the code sprite has them (e.g. the slime's at 12,16 on 24×18). A bigger canvas is
  fine: the extra width is split evenly left/right and the extra height goes on top, so the
  32×24 slime has its feet at 16,22. Keep the width difference even.
- A missing tag falls back to the code-drawn frames, so a sheet can be partial (e.g. only `side-walk`).
- Hidden layers are not exported, so a hidden reference or sketch layer is fine.
- The game draws its own outline only on code-drawn frames; draw the outline in Aseprite.
- `/sprite-preview` still shows the code-drawn art; check sheets in the game.

Set `ASEPRITE` to the executable if the tools can't find it (they look on PATH, then in the Steam and
standard install folders).

The files here were painted procedurally as detailed starting points for hand edits
(`node tools/aseprite/paint/paint.mjs <key>` recreates one, overwriting it, so don't run it on edited art):
the Forest Slime and Pocket Slime (32×24), War Hound and Spirit Fox (40×28), falcon and Arcane Owl
(36×28, side view) and Guardian Angel (44×44), with idle 4, walk 6, run 6, attack 4 and skill 6 frames.
