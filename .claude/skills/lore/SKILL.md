---
name: lore
description: Write or edit Vanguard of Fate's story, lore and flavour text (LORE.md / LORE_FIL.md, prologue, NPC dialogue and chatter, quest text, monster / boss / item / platform names and descriptions) without analysing the whole project. Use for any task that creates or changes story text, character backstories, new Acts, places or bosses, or EN/FIL translations of narrative text.
---

# Lore & story writing (token-lean)

Most of the cost of a lore task comes from reading the project to learn the setting. You don't need to: the **canon sheet** below is the setting in brief, and `lore-tool.mjs` pulls exact text from any file on demand. LORE.md alone is 32 KB; never read it whole.

```
L=.claude/skills/lore/lore-tool.mjs
node $L sections                 # LORE.md │ LORE_FIL.md headings with line ranges
node $L section <n|roman|word>   # one Act, EN + FIL (e.g. `section 9`, `section ix`, `section frostfang`)
node $L entity <name>            # one entity's text fields only: name, desc, hint, lines (EN + FIL)
node $L find <term> [--max 40]   # every text string mentioning <term>, as file:line
node $L sources                  # which files hold player-facing text, and how much
node $L check                    # EN/FIL gaps: LORE section/paragraph mismatches, {en, fil} pairs, en/fil string tables
```

## Token rules

1. **Start from the canon sheet.** Don't read README, LORE.md, `dialogue.js` or `bestiary.js` whole. Pull only the Act or entity you are touching.
2. **Before naming something new, check for conflicts with `find <name>`.** That's cheaper than reading the tables.
3. **Edit by line number** (from `section` / `entity` / `find`) with targeted `Edit` calls. Never rewrite a whole file to change a paragraph.
4. **Don't read game code to check a mechanic.** The canon sheet lists the hard facts. If a claim isn't covered there, `find` the term once. Only read code if the mechanic itself is changing.
5. **Write the EN version and the FIL version in the same pass.** Translating later costs a second read of the same text.
6. **Finish with `check`.** Don't re-read the files to verify.

## Canon sheet (keep in sync with LORE.md)

**Premise:** The continent of **Aethelgard**, blessed by the goddess **Astraea**, falls when the **Eclipse of the Abyss** frees **Demon Lord Satan**. His **Void Miasma** mutates wildlife into night-prowling abominations and spreads the **Seven Anomaly Blights**: Bleeding, Silence, Poison, Electrified, Burn, Frost Freeze, Blindness (`js/status.js`). The aging **King** and his heir, **Princess Aurelia** or **Prince Kenneth** (the player picks; Supreme Commander of the Imperial Magic & Research Corps), summon resilient souls from **Earth (2026)** to form the **Grand Slaying Corps**.

**The summoned (Act III), all from Earth, each died saving someone:**

| Class | Earthbound soul | Signature |
|---|---|---|
| Knight (Vanguard / Aegis Lancer) | Arthur "Art" Ramirez, demolition engineer, Manila | Bastion Forcefield, Piercing Lance Charge |
| Elven Archer | Lyra Vance, biologist and Olympic archer, Vancouver | Quiver shots with timed reload, ethereal falcon |
| Priest (Holy Shepherd) | Dr. Julian Alcantara, trauma surgeon | Smart Priority Heal, twin Guardian Angels |
| Mage (Arcane Sage) | Samantha "Sam" Chen, astrophysicist, Atacama | Meteor Fall, Thunderstorm chain lightning |
| Fighter (Indomitable Brawler) | Renzo "Striker" Cruz, MMA brawler | Ki Force Spheres, homing flying dropkick |

**The player's path:** the hero is made in the Character Creator and starts as a **Novice** (dagger + wooden buckler). The **Job Awakening** at the Imperial Citadel's audience dais (Lv 10, Act IV) grants one of the five classes, and the summoned soul of that class becomes the mentor. The **Dual Equipment Matrix** (Act V): two-handed weapons lock the offhand; 1H + offhand pairs trade power for utility. **Act VI** is the slow-burn bond and romance between the hero and the royal summoner.

**Hub (Acts I–VI):** the plains of Aethelgard: **Barracks Sanctuary** (safe zone; **Captain Ronald** drills mercenaries, **Edgar the Apothecary** sells cures, **Archivist Maren** (`maren`) keeps the Chronicles, recaps the story and points the hero to the next goal), the **Imperial Citadel**, four **Celestial Warp Gateways**. Other NPCs: Royal Guards, **Brakka** (Emberhold Forge), **Hilde**, **Thane Durgrim** (mining quest), **Pip**, the **Elven Matriarch** (see `js/npc/roster.js`). Campaign NPCs: **Captain Isolde Wavecrest** (`isolde`, captain of the crewed ship; Cerulean Abyss camp, then the Lamenting Strand camp; explains sailing, the Monolith and the Seal Stones), **Veyra the Ashen Scout** (`veyra`, half-demon deserter of Satan's legion; Dark Continent camps, Acts XI–XV; briefs the hero on each Dark Continent boss), **Brother Aldric of the Lantern** (`aldric`, last monk of the Order of the Lantern; Ossuary Fields camp, Act XII; the Lantern Knight, the First War and the worn carvings of a sealed "queen of sorrows", never named in Book I).

**Campaign platforms (Acts VII–XV, `js/world/platforms.js`):**

| Act | Place | Reached by | Boss | Quest item |
|---|---|---|---|---|
| VII | Whispering Canopy | East gateway | Malakor | Blighted Heartstone |
| VIII | Cerulean Abyss | West gateway | Leviathan Regent | Abyssal Helm Shard |
| IX | Frostfang Precipice | North gateway | Frost Empress Cryonix | Cryonix Core |
| X | Ashfall Wastelands | South gateway | Ignis | Hellforge Reactor Core |
| XI | The Lamenting Strand (Dark Continent) | Celestial Monolith, by boat | Dolora, the Weeping Matron | Urn of Black Tears |
| XII | The Ossuary Fields | road from the Strand | Morgrave, the Ossuary Warlord | Lantern Knight's Visor |
| XIII | Siege of the Obsidian Citadel | march from the Ossuary Fields | Demon Commander | Imperial Crest |
| XIV | The Chainspire Descent | rift behind the Obsidian throne | Vorgath, the Chained Warden | Warden's Key |
| XV | Maw of Damnation | the last gate at the foot of the Chainspire | Satan | Astral Ash |

The bosses of Acts VII–X drop the Seal Stones that open the Celestial Monolith. FIL names: Dalampasigan ng Panaghoy / Dolora, ang Lumuluhang Matrona / Urna ng Itim na Luha; Kaparangan ng mga Buto / Morgrave, ang Panginoong-Digma ng mga Buto / Visor ng Lantern Knight; Ang Pagbaba sa Toreng Kadena / Vorgath, ang Nakakadenang Bantay / Susi ng Bantay. Dolora, Morgrave and Vorgath are Satan's servants outside the five Heralds. The Visor's message: the gate home opens once, for the first dawn after the star is whole; at the end of Act XV the hero sees home, stays with the Sovereign, hides their grief, and something beneath the Ossuary Fields stirs (Book II: The Witch of Darkness Misery's Revenge). Ore veins exist only on Ashfall and the Obsidian Citadel.

**Book I and side quests:** Acts I–XV are **Book I · The Fated Vanguard** (FIL *Aklat I*); **Book II** is "coming soon". From Act II on, each Act's main quest waits at a gate step until the Act's 5–10 side quests (seeded per save; `js/sidequest.js`) are done: hunts, trophies, scouting named sites, purges, flyers, and (Act V on) elite and champion bounties posted by the war camps.

**Frontier maps (`js/world/frontiers.js`, no boss, each with a war camp, a named arena and three scouting sites):**

| Acts | Place (FIL) | Reached by | Arena | Elites |
|---|---|---|---|---|
| IV–VI | Greyhorn Badlands (rocky) | hub south-west trail | Shattered Quarry / Basag na Tibagan | Quarry Colossus, Brigand Warlord, Bone Marshal, Cliff Wyvern |
| VII–VIII | Gloomwater Fens (swamp; old elven rice terraces) | Canopy east trail | Drowned Shrine / Lubog na Dambana | Gloomwater Hag, Mire Hydra, Bog Titan, Plague Moth Matriarch |
| IX | Stormcrown Highlands (mountain) | Frostfang east trail | Thunder Aerie / Pugad ng Kulog | Stormcrown Griffin, Avalanche Golem, Peak Shaman, Elder Troll |
| X | Sunscorch Dunes (desert, south of the Hellforge) | Ashfall south trail | Buried Sun Temple / Nakabaong Templo ng Araw | Scarab Monarch, Tomb King, Sandstorm Wraith, Dune Colossus |

Every map (hub, platforms, frontiers) has 5 regular kinds and 4 elite kinds (`elite: true`, always Elite tier, one of each on the map, respawning).

**Systems with lore names:** monster tiers Normal / Champion / Elite / MVP; Ragnarok-style race, element and size; stats STR/AGI/VIT/INT/DEX/LUK; mercenaries (axe, crossbow, greatsword, wand) hired from Captain Ronald; day/night cycle where night monsters prowl with crimson and violet eyes.

**Tone & style**
- Heroic isekai high fantasy, earnest and a little romantic. Earth skills reinterpreted as magic (engineering → forcefields, triage → smart heals, orbital physics → meteors).
- LORE.md is long-form prose: each Act is `##` heading + 4 paragraphs, separated by `---`. Keep LORE_FIL.md with the **same Acts in the same order and the same paragraph count** (the Act reader and the lore panel parse `##` sections).
- `{s}` = the summoner's name and `{h}` = the hero's name in dialogue templates.
- Never contradict a hard fact above without changing the game too.

## Where text lives

| What | File | Format |
|---|---|---|
| Lore (title → Chronicles, Act reader, lore panel) | `LORE.md` + `LORE_FIL.md` | `##` Acts, paragraphs; same structure in both |
| UI strings | `js/i18n.js` | `STRINGS.en` / `STRINGS.fil` tables, `t(key)`; some values are functions or contain `<span>`/`<kbd>` markup |
| Story dialogue (Acts II–VI) | `js/dialogue.js` | `en: {…}` / `fil: {…}` tables per NPC and quest step |
| Ambient NPC chatter | `data/npc_conversations.json` | `solo` lines and `pairs`, each line `{ speaker, en, fil }` |
| Prologue cutscene | `js/prologue.js` | per-scene `{ en, fil }` cards and captions |
| Quest steps | `js/quest.js` | `qt()` text per step |
| Monsters, bosses | `js/bestiary.js` | `name: { en, fil }` |
| Platforms, arenas, hints | `js/world/platforms.js` | `name: { en, fil }`, `text: { en: {…}, fil: {…} }` |
| Items, cards, sets | `js/items/itemdb.js` | `N("English", "Filipino")` helper |
| Skills, statuses, elements, tiers | `js/skills.js`, `js/status.js`, `js/elements.js`, `js/monsterTiers.js` | `{ en, fil }` or `N(en, fil)` |

FIL style: natural Filipino, keeping English for game terms players know (HP, Lv, MVP, class names, skill names, place names like Cerulean Abyss). Match the register of the existing FIL lines; check one with `section` or `entity` if unsure.

## Workflow

1. Read only the canon sheet, then `sections`, `section <act>` or `entity <name>` for the part you are changing.
2. Draft EN and FIL together, and check new names with `find`.
3. Edit by line number.
4. If the change alters canon (a new character, place, boss or Act), update **LORE.md, LORE_FIL.md and the canon sheet above** in the same commit.
5. Run `node $L check`, and `node .claude/skills/codemap/codemap.mjs verify` if you touched any `.js` file.
