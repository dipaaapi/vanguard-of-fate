# CLAUDE.md

## Working preferences

- Before making changes, get the project overview from `.claude/skills/codemap/CODEMAP.md` (every file's purpose and exports) and read only the code the task needs (`/codemap`: `outline <file>`, `where <symbol>`). Don't read the whole project unless the task truly needs it. `js/main.js` (~1,700 lines) is never worth reading whole; outline it and read one function.
- If already familiar with the project, check what's been updated or added since last time (`git log`, `node .claude/skills/codemap/codemap.mjs changed <ref>`, `git status`) instead of re-reading everything.
- When adding, removing or renaming source files, update `.claude/skills/codemap/purposes.json` and run `codemap.mjs build`.
- After any code change, run `node .claude/skills/codemap/codemap.mjs verify` (syntax + every import resolves). There is no bundler, so this is the cheapest way to catch the error that would otherwise only show up as a blank page.
- At the start of a session, briefly explain what's in the project and propose what to do next.
- Story, dialogue and EN/FIL text: use `/lore` (canon sheet + `lore-tool.mjs`) instead of reading LORE.md or the dialogue tables whole.
- Measure, don't estimate: balance or fairness questions go through `/balance` (headless sim on the real code), new or renamed game data through `/content` (recipes + cross-check), looks through `/sprite-preview` (PNG of the real sprite), and flow/UI checks through `/playtest` (headless browser). Each tool takes seconds and replaces reading many files or asking the user to test.
- Repetitive, reusable text (NPC chatter, message wording, EN/FIL pairs, lookup tables) goes in a `.json` file under `data/` or an existing table module and is referenced by key, not hardcoded inline. Example: `data/npc_conversations.json`.

## Project overview

Vanguard of Fate is a browser action RPG / isekai adventure in plain HTML5 Canvas + vanilla JavaScript ES modules. The player creates a hero in the Character Creator, is summoned from Earth to Aethelgard as a Novice, awakens one of five classes (Knight, Mage, Priest, Archer, Fighter) at Lv 10, and follows twelve Acts from the hub plains through six campaign platforms to Satan. See [README.md](README.md) for features and controls (its project-structure section is out of date; CODEMAP is current) and [LORE.md](LORE.md) / [LORE_FIL.md](LORE_FIL.md) for the setting. Both LORE files are fetched at runtime and split on `##` Acts by `js/lore.js`; keep them in sync.

No backend and no build step: the game is static files. State persists in `localStorage` (`vanguard_savegame`, `vanguard_config`, language), with `.vof` save export/import through `js/saveSecurity.js`.

## Commands

- `npx -y http-server -p 5173 -c-1` — serve the game at <http://localhost:5173> (same as `.claude/launch.json`). ES modules and `fetch` don't work from `file://`.
- `node .claude/skills/codemap/codemap.mjs verify && node .claude/skills/content/content-check.mjs` — syntax, imports and data cross-references (main validation, ~1 s).
- `/codemap` — project map: `CODEMAP.md` plus `codemap.mjs outline|where|changed|verify|check|build`.
- `/lore` — story/lore/flavour text: canon sheet in `.claude/skills/lore/SKILL.md` plus `lore-tool.mjs sections|section|entity|find|check` (check verifies EN/FIL pairs).
- `/balance` — `node .claude/skills/balance/balance-sim.mjs [--area <id>] [--level ±n] [--gear kit]`: class × Act DPS, survivability, fights per life, boss fights, EXP pace, class spread.
- `/content` — `node .claude/skills/content/content-check.mjs`: cross-checks monsters, bosses, platforms, items, NPCs, chatter and quest text; SKILL.md has the add-a-monster/item/NPC/platform recipes.
- `/sprite-preview` — `node .claude/skills/sprite-preview/sprite-tool.mjs render <class:|npc:|merc:|monster:|boss:|icon:><key> [--before HEAD]`: PNG sheet of the real sprite.
- `/playtest` — `node .claude/skills/playtest/playtest.mjs [--flow newgame] [--keys …] [--debug --keys-after …]`: headless Chromium run with console errors and screenshots.
- `node .claude/skills/playtest/perf.mjs [--areas hub,ash] [--viewport 2560x1440] [--profile]` — frame rate and per-frame JS time in each scene with a 4× slower CPU; run it before and after anything that draws more.
- `/security-audit` — audit save import, localStorage loading, innerHTML use, page config and the dev server.
- `node tools/art/render.mjs [keys…] [--list] [--preview]` — re-render the procedural art (headless Chromium; exact key or prefix, e.g. `act-3`, `portrait-`).
- `node tools/aseprite/export.mjs [kind/key…]` — export `aseprite/**/*.aseprite` with `aseprite -b` to `assets/sprites/` (sheet + JSON + manifest); `node tools/aseprite/seed.mjs monster/<key>` starts a file from the code art. See `aseprite/README.md`.
- `node tools/audio/render-audio.mjs [music|jingles|sfx|<name>…] [--mp3]` — offline render of music/SFX with peak/RMS checks; run it after changing `audio.js` or `music.js`.
- `scripts/headless.mjs` — lets any Node script `load("js/<module>.js")` with browser stubs; build new tools and tests on it instead of copying formulas.

## Architecture

- `index.html` — page shell; loads `js/main.js` as the only module script.
- `js/main.js` — coordinator: scene routing (`TITLE` → prologue → `CREATE` → playing), all managers, service menus, platform travel (`travelTo`, `handlePortal`), save/load, Job Awakening, `updateGame` / `renderGameWorld`, and the fixed-step `gameLoop`.
- Scenes: `title.js`, `prologue.js` (Act I cutscene), `creator.js` (Character Creator), `select.js`.
- World: `stage.js` (hub plains, 1280×960) and `world/platform.js` (one Act's map) share one interface (bounds, safe zones, `resolveTile…`), so camera, enemies, NPCs and map work on both. Campaign data in `world/platforms.js`; tiles in `world/tileset.js` + `world/tilemap.js`; `world/weather.js`, `world/ambient.js`, `world/portal.js`, `world/boat.js`, `world/mining.js`.
- Actors: `player.js`, `enemy.js` (all monster AI), `mercenaryManager.js` + `mercenary/*`, `npc/npcs.js` + `npc/roster.js`, `summons/*`, `projectiles.js`. Class kits in `classes/*` (`novice.js`, `job.js` for the post-Awakening look).
- Rendering: `avatar/avatar.js` (modular pixel Avatar used by the hero, NPCs, mercenaries and humanoid monsters), `avatar/creature.js` + `avatar/beasts.js` (non-human sprites), `items/icons.js`, `fx.js`, `juice.js` (shared combat poses).
- Rules & tables: `skills.js`, `status.js`, `elements.js`, `monsterTiers.js`, `bestiary.js`, `items/itemdb.js`, `items/bag.js`, `items/durability.js`, `items/forge.js`, `quest.js`, `dialogue.js`.
- UI: HTML overlays (`dialog.js`, `hudbar.js`, `actionpanel.js`, `charpanel.js`, `inventory.js`, `codex.js`, `services.js`, `chatlog.js`, `actreader.js`) styled by `css/*.css`; in-canvas `ui.js` (minimap), `worldmap.js`, `continent.js`.
- `audio.js` — procedural Web Audio engine (buses, synth instruments, sequencer, SFX); the score lives in `music.js` (`TRACKS`, `AREA_TRACK`, `JINGLES`). `main.js` calls `Sound.setScene(place, night, bossKey)` every frame and the track crossfades when one changes. No audio files.
- Images in `assets/banner/`, `assets/bg/` and `assets/art/` (vistas, portraits, relics) are all generated by `tools/art/` (registry `tools/art/scenes/index.js`, captions `data/art_manifest.json`). Edit the painter and re-render instead of editing PNGs.

## Conventions

- The canvas renders at 480×270 game pixels and is scaled by an integer factor (`fitCanvas` in `main.js`; CSS `--s` is that scale). Don't draw HTML overlays in canvas pixels without `--s`. The drawing scale is capped by Options → Quality (`RENDER_CAP`: Balanced = 2×) and CSS enlarges the rest pixel-perfect, so avoid extra full-screen fills: on big screens fill area, not JS, sets the frame rate.
- The simulation runs at a fixed 60 steps per second (`STEP` in `main.js`); durations and cooldowns are in frames (60 = 1 s).
- Language: `getLang()` returns `"en"` or `"fil"`. Every player-visible string needs both: UI strings in `js/i18n.js` (`t(key)`), data tables as `{ en, fil }` or `N(en, fil)`, chatter in `data/npc_conversations.json`. Run `lore-tool.mjs check` after adding text.
- Put text into the DOM with `textContent`; use `innerHTML` only for static templates or `t()` strings that carry markup, never for names or other values that can come from a save.
- Characters are drawn with the modular Avatar (or a `CreatureSprite`) and cached frames; new humanoids reuse Avatar parts rather than new sprite code.
- Creature art can come from Aseprite: `aseprite/<monster|boss>/<key>.aseprite`, exported to `assets/sprites/` and loaded by `js/avatar/sheets.js`; the code-drawn sprite stays as the fallback for anything without a sheet (or a missing tag). Edit the `.aseprite` and re-export instead of editing the exported PNG.
- Commit messages use Conventional Commit prefixes (`feat:`, `fix:`, `docs:`).
- Some code comments are in Filipino/Taglish; keep them as-is.
