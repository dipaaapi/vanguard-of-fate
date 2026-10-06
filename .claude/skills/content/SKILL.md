---
name: content
description: Add or change Vanguard of Fate game content (a monster, boss, item, card, set, NPC, dialogue, chatter, quest step or campaign platform) by following its recipe, then verify every cross-reference headless. Use for any task that adds or renames game data, and run its check after any data edit.
---

# Content recipes + cross-check

Adding one monster touches four files; adding an NPC touches four more. Searching for "everywhere this needs to go" costs more than the change itself. Use the recipes below, then let the checker confirm:

```
node .claude/skills/content/content-check.mjs            # broken references fail (exit 1); content gaps are listed as notes
node .claude/skills/content/content-check.mjs --list     # plus how many of each thing were checked
node .claude/skills/content/content-check.mjs --strict   # notes fail too
```

It loads the real modules headless and checks: monsters/bosses (en/fil name, sprite, race/element/size, known debuff, drop item, summons, card), that every monster spawns somewhere, platforms (boss, quest item, seal, monsters, en/fil text with the same line counts), every item's en/fil name and icon drawing, `CLASS_KIT` bases, NPC names in both languages and placement, `data/npc_conversations.json` speakers, and every quest step's text in both languages (a bad boss key crashes the whole quest log).

Known gaps today (notes, not failures): 31 monsters have no card, `riverCrab`/`riverNaga`/`marshLurker` never spawn since the Aethelgard ocean was removed, and the `elvenMatriarch` has dialogue but is never placed.

## Recipes

Use `/codemap outline <file>` to jump to the named table, `/lore` for names and EN/FIL text, `/sprite-preview` for looks.

**Monster** (normal)
1. `js/bestiary.js` `MONSTERS.<key>`: `name: { en, fil }`, `sprite`, `speed`, `hpMult`, `dmg`, `barY`, `medium` (`land`/`sky`/`sea`, sea needs `aquatic: true`), optional `debuff: { type, chance, time }` (a `js/status.js` key).
2. Same file `TRAITS.<key>: [race, element, size]` (`js/elements.js` tables).
3. Sprite: an existing `CreatureSprite` subclass in `js/avatar/beasts.js` / `creature.js`, or `new Avatar(look)` for humanoids. New sprite → `/sprite-preview`.
4. Make it spawn: `PLATFORMS.<id>.monsters`, `HUB_KINDS` (`js/enemy.js`), `NIGHT_KINDS`, or a boss's `attacks.summon`.
5. Card: `CARDS.<key>` in `js/items/itemdb.js` (`n: N(en, fil)`, `stats`).
6. Codex picks it up from `MONSTERS` automatically.

**Boss**: `BOSSES.<key>` (as above plus `hpBase`, `drop`, `attacks: { hazard, orb, summon }`), `TRAITS`, a card with `boss: true`, the quest item in `OTHER`, and `PLATFORMS.<id>.boss` / `.item`. Level = Act cap + 2 (`spawnBoss`).

**Item**: `js/items/itemdb.js`: equipment in `EQUIP` (`slot`, `hands`, `cls`, `icon`, `stats`, `sockets`, `name: N(en, fil)`), consumables/materials/quest items in `OTHER`, uniques in `UNIQUES`, sets in `SETS`. The `icon` must exist in `DRAW` in `js/items/icons.js` (check with `sprite-tool render icon:<id>`). Shops: Edgar's wares in `js/ui.js`, dwarf/forge menus in `js/main.js` (`openDwarfShop`, `openForgeSets`).

**NPC**: look in `js/npc/roster.js` `NPC_DEFS` (`dwarf: true` squashes, `mentor: <class>`), names in `js/dialogue.js` `NAMES.en` + `NAMES.fil`, lines in `LINES.en/fil` (or `getDialogue` for quest-aware talk), placement in `NPCManager.build` (`js/npc/npcs.js`) or `PLATFORMS.<id>.villagers`, optional chatter in `data/npc_conversations.json` (`{ speaker, en, fil }`), service menu in `js/main.js` (`openService`, `serviceMenu.show`).

**Quest step / platform**: Acts II–VI steps are `TEXT.en/fil.act` + `goal` in `js/quest.js` (keep `STEP_ACT` and the step table comment in sync). A platform is a `PLATFORMS` entry (`act`, `tier` = level band, `theme`, `ambient`, `seed`, `hubGate`, `camp`, `arena`, `bossSpawn`, `boss`, `item`, `monsters`, `text.en/fil`) plus its id in `PLATFORM_ORDER`; quest steps for it are generated (three per platform). New theme → `js/world/tileset.js` `THEMES`; ambience → `js/world/ambient.js`; story → LORE.md + LORE_FIL.md via `/lore`.

## Finish

`content-check.mjs`, then `node .claude/skills/lore/lore-tool.mjs check` for EN/FIL, then `codemap.mjs verify`. Use `/balance --area <id>` if the content has stats, and `/playtest` to see it in game.
