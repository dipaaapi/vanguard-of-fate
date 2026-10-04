---
name: sprite-preview
description: Render Vanguard of Fate's pixel-art characters (hero classes, NPCs, mercenaries), monsters, bosses and item icons to PNG headless with the game's own drawing code, including before/after against a git commit. Use whenever a task changes a look (js/avatar/*, js/classes/job.js, NPC looks in roster.js, beasts/creature sprites, items/icons.js) or asks how something looks, instead of opening the browser.
---

# Sprite preview (look without the browser)

The Avatar, creature sprites and item icons are drawn into `Pix` buffers. `sprite-tool.mjs` runs that code in Node and writes a PNG sheet you can open with the Read tool. A sheet is cheap to look at; reading `avatar.js` (49 KB) to imagine the result is not.

```
S=.claude/skills/sprite-preview/sprite-tool.mjs
node $S list                                         # every subject key
node $S render npc:brakka                            # rows = down / side / up, columns = idle, walk, run, attack frames
node $S render monster:wolf --anim walk --dir side   # only what you need (smaller image, fewer tokens)
node $S render class:mage --config '{"body":"female","hairColor":"#ece0b8"}'
node $S render icon:mail@3                           # item icon (any item id, card:<key>, u:<unique>)
node $S render boss:malakor --before HEAD            # left: HEAD, right: your working tree, gold line between
```

Subjects: `class:<novice|knight|mage|priest|archer|fighter>`, `npc:<id>`, `merc:<axe|crossbow|greatsword|wand>`, `monster:<key>`, `boss:<key>`, `icon:<itemId>`. Output goes to `<tmp>/vof-sprites/` unless `--out` is given; the path is printed.

## How to work

1. Render the subject **before** editing (or use `--before HEAD` afterwards) so you have a baseline.
2. Find the drawing code with `/codemap`: humanoid parts in `js/avatar/avatar.js` (`outline avatar`, each part is a function), Creator choices in `js/avatar/options.js`, class outfits in `js/classes/job.js` (`lookFor`), NPC looks in `js/npc/roster.js`, monsters in `js/avatar/beasts.js` / `creature.js`, icons in `DRAW` in `js/items/icons.js`.
3. Edit, then render with `--before HEAD`, limited to the animation and direction you changed (`--anim`, `--dir`).
4. Check all three directions and every frame of the animation you touched before calling it done; an edit to one part often shifts another in the side or back view.
5. Things the sheet does not show: the dwarf squash (`dwarf: true`, drawn at 0.8 height in game), the hit flash, scale and the falcon's rotation. Use `/playtest` with a `shot` for those.
