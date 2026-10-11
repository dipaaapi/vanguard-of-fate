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
aseprite/zone/barracks.aseprite   → the hub's Barracks Sanctuary and its two longhouses (300×296)
aseprite/zone/castle.aseprite     → the Imperial Citadel and its audience dais (320×340; the gate portal stays code-drawn)
aseprite/zone/<map id>.aseprite   → that map's safe zone: a Fated Vanguard camp, or Emberhold for `ash`
aseprite/ui/<key>.aseprite        → an interface frame (css/hud.css, css/title.css): exported to assets/ui/<key>.png, one image
aseprite/tiles/<theme>.aseprite   → a terrain tile set (js/world/terrain.js): one per map theme, 256×96, 8 frames
```

## Tile style

Everything that stands on the terrain tile sets is drawn in their look (`js/avatar/tilestyle.js`, the same
formulas as `tools/aseprite/paint/tiles.mjs`): saturated ramps whose shadows drift to blue-violet and whose
highlights drift to warm yellow, light from the upper left, a soft grain, a darker foot row, and a 1 px outline
that is a deep hue-shifted shade of the colour it wraps (never one flat ink). 1 art pixel = 1 game pixel, the
tiles' density; detail comes from bigger canvases, not from a finer grid.

- Monsters and code-drawn bosses: `node tools/aseprite/paint/monsters.mjs [keys…] [--family Brute] [--preview]`
  paints every one with its family painter (`tools/aseprite/paint/monsters/*.mjs`); humanoid monsters are seeded
  from their code frames. Monster sheets are listed under `lazy` in `manifest.json` and load the first time the
  game asks for them.
- Code-drawn sprites without a sheet (mercenaries, humanoid monsters, the angel's body) get the same pass at
  runtime (`style: "tile"` on the Avatar, `tileStyle()` in `CreatureSprite`).
- Hand-finished single-frame art: `node tools/aseprite/paint/restyle.mjs <kind/key>` grades it and swaps the
  flat outline for the hue-shifted one in place (run it once per file).
- Check anything against the tiles with `node tools/tilemap/lineup.mjs <theme> monster:<k> zone:<k> …`.

## Safe zones

Each zone file has one looping `down-idle` tag and four layers: `ground` (paving, earth, shadows),
`buildings`, `props` and `fire` (flames, glows, smoke). `js/world/zonesprites.js` says where the canvas sits
(`ZONE_ART`: the Barracks canvas starts 76 px above the plaza, the castle's 20 px above `castle.y`, a camp's
8 px left of and 22 px above the camp) and which footprints are solid: the longhouses, Emberhold's buildings
and each camp's two tents block the hero and monsters while their art is shown. Camps keep their tents on the
side away from the gateway (`campLayout`). If you move a building or tent in Aseprite, move its footprint there too.

`node tools/aseprite/paint/paint.mjs zone` repaints them all from `tools/aseprite/paint/zones.mjs` (themes per
map in `CAMP_THEMES`; overwrites hand edits). A new map gets a camp by adding its theme there and repainting;
until then it keeps the code-drawn camp.

Without a file, everything still has detailed art from code: every character and monster gets a
volume-shading and texture pass (`Pix.detail` in js/avatar/avatar.js), and `run` / `skill` animations
built from the walk and attack. `seed.mjs` starts a file from exactly that, for any key above
(`node tools/aseprite/seed.mjs npc/brakka`, `monster/wolf`, `merc/axe`, `boss/malakor`). The hero's
look comes from the Character Creator, so the hero stays code-drawn.

Effects: `meteor`, `blast`, `lightning`, `holy`, `sphere`, `slash`, `wave`, `bolt`, `arrow`, `arrowfall`,
`bite`, `claw`, `arcane`, and for the Dark Continent bosses `tear` (Dolora's black tear, 16×24),
`bonespike` (Morgrave's bone lances, 24×28), `chain` (Vorgath's chain lash, 40×12) and `shockring`
(Vorgath's ground shockwave, 64×32). Heading effects point right (the game rotates them); `slash`, `wave`,
`bolt`, `bite` and `chain` are painted in greys and tinted per skill.

Bosses with sheets (twice the size of their 2×-scaled code sprite, feet where the game anchors them):
`boss/dolora` 64×72 (feet 32,68; she floats ~4px above them), `boss/morgrave` 96×104 (feet 48,100) and
`boss/vorgath` 112×112 (feet 56,108), each with idle 4, walk 6, run 6, attack 4 and skill 6 frames per
view (five views; the three-quarter ones are the front / back turned by `turnFinished`).

## Terrain tile sets

`aseprite/tiles/<theme>.aseprite` holds one map theme's terrain (meadow plus every theme in `js/world/tileset.js`) on a
16 px grid, laid out as `TILESHEET` in `js/world/terrain.js`:

```
(0,0)    64×64 liquid texture, seamless, animated       layer liquid
(64,0)   16 ground tiles, index = corner mask            layer ground   (TL 1, TR 2, BL 4, BR 8 = which corners are ground)
(128,0)  16 path tiles, same masks                       layer path
(192,0)  16 shore tiles: foam, waves, shallows, shadow   layer foam     (animated)
(0,64)   8 plain-ground variants · (128,64) 4 plain-path variants
(0,80)   16 decorations: 0-5 small, 6-11 large, 12-15 theme specials   layer decor
```

The map is a grid of cells (liquid, ground, path) and every drawn tile sits where four cells meet, so these 16
tiles cover any shape: coasts, single cells, diagonals, lakes inside islands. A ground cell over liquid shows its
cliff face in its lower 10 px (`CLIFF_H`). Keep tile edges where they are when you repaint (a tile's edge must meet
its neighbours'); textures, colours, cliffs, foam and decorations are free to change. Only `liquid` and `foam`
differ between frames. `node tools/aseprite/paint/paint.mjs tiles` repaints them all from
`tools/aseprite/paint/tiles.mjs` (overwrites hand edits), `node tools/aseprite/export.mjs tiles/<theme>` exports one,
and `node tools/tilemap/preview.mjs` renders every set on its layout (`js/world/layouts.js`). Tile sets load on
demand, so they are left out of `manifest.json`.

## Interface frames (HD)

`aseprite/ui/` holds the frames of the hero card, party list, meters, key chips and side menu, painted at twice the
game's pixel density (one art pixel = half a game pixel over the game screen, one CSS pixel in the side menu) on three
layers: `fill`, `frame`, `gems`. The CSS uses each one as a 9-slice `border-image`; the slice sizes are listed at the
top of `css/hud.css`. `node tools/aseprite/paint/paint.mjs ui` repaints them from `tools/aseprite/paint/ui.mjs`
(overwrites hand edits), and `node tools/aseprite/export.mjs ui/<key>` writes `assets/ui/<key>.png`.

## Workflow

1. Start from the current art (optional): `node tools/aseprite/seed.mjs monster/wolf`
2. Paint in Aseprite. Keep one tag per view + animation named `<down|dside|side|uside|up>-<anim>`
   (`side-walk`, `dside-run`, `up-attack`, …). Five views give eight directions: `down` and `up` face
   the camera / away, `side` faces right, `dside` and `uside` are the right three-quarter views
   (down-right, up-right); the game mirrors the right-facing ones for left (`js/avatar/facing.js`).
   A sheet without `dside` / `uside` uses `side` for the diagonals.
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
- Faces: `idle` has 8 frames with the eyes shut on the last (a blink); `run`, `attack` and `skill` show
  the angry face (lowered brows, open mouth). The painters register eye colours with `eyeCol()`
  (`paint/monsterkit.mjs`), which draws both. Humanoids (the Avatar) do the same in code: a blink while
  idle or walking, a set jaw while running or winding up, a shout on the strike and a wince while hit.
- A missing tag falls back to the code-drawn frames, so a sheet can be partial (e.g. only `side-walk`).
- Hidden layers are not exported, so a hidden reference or sketch layer is fine.
- The game draws its own outline only on code-drawn frames; draw the outline in Aseprite.
- `/sprite-preview` still shows the code-drawn art; check sheets in the game.

Set `ASEPRITE` to the executable if the tools can't find it (they look on PATH, then in the Steam and
standard install folders). Without Aseprite, `export.mjs` reads the files itself (`tools/aseprite/asefile.mjs`:
visible layers, Normal blending; it matches Aseprite's own export pixel for pixel) and lays the frames out in a
grid instead of packed, which the game reads the same way. `--node` forces that path.

The files here were painted procedurally as detailed starting points for hand edits
(`node tools/aseprite/paint/paint.mjs <key>` recreates one, overwriting it, so don't run it on edited art):
the Forest Slime and Pocket Slime (32×24), War Hound and Spirit Fox (40×28), falcon and Arcane Owl
(36×28, side view), Guardian Angel (44×44) and the bosses Dolora, Morgrave and Vorgath (`paint/boss.mjs`),
with idle 8 (4 for the bosses), walk 6, run 6, attack 4 and skill 6 frames in five views (birds: side only).

## Coins, consumables and the wallet

`node tools/aseprite/paint/economy.mjs` creates four minted coin icons, all consumable icons (including Soulstone and cooked food), and matching wallet/quick-slot frames. Sources are `aseprite/ui/coin_<denomination>.aseprite`, `item_<id>.aseprite`, `wallet.aseprite`, and `consumable_slot.aseprite`. Each icon is 24 by 24 with a transparent background. Edit these sources in Aseprite, then export their `ui/<key>` with `node tools/aseprite/export.mjs ui/<key>`. Do not repaint after making hand edits. The inventory, Market, quick slots and ground drops share these exported images.

Gold remains the save-compatible numeric unit. Each coin reward is split into platinum, gold, silver and bronze piles without losing bronze precision. The wallet shows all four amounts, using the agreed 100:1 exchange rates.

## Guild hall, staff and membership plate

`aseprite/ui/guild_*.aseprite` holds ten sources: the 280×180 hall, five 32×48 guild staff portraits, a 24×24 plate, a 48×40 caravan, and 24×24 herb/stone resources. `node tools/aseprite/paint/guild.mjs` paints the hall in the tile style (scenery kit, like the safe zones); the other nine are hand-finished and were given the tile style with `restyle.mjs`. Export with `node tools/aseprite/export.mjs ui/guild_hall ui/guild_plate ui/guild_guildMaster ui/guild_guildRepresentative ui/guild_guildClerk ui/guild_guildScout ui/guild_guildInflictionist ui/guild_caravan ui/guild_herb ui/guild_stone`. The game places staff and hall in the hub, uses the hall and plate in the joining ceremony, and draws the caravan and resources during contracts. `assets/ui/guild.json` lists the exported keys. Edit the Aseprite sources and export them; do not rerun the painter on the hall after hand edits.
