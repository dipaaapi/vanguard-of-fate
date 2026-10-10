# ⚔️ Vanguard of Fate

A browser-based, pure-coded retro 32-bit Action RPG / Adventure game powered by HTML5 Canvas and Vanilla JavaScript (ES Modules). Features real-time top-down combat, camera scrolling, modular character classes, synthesized chiptune audio, and dynamic enemy AI.

---

## 📖 Story

When the Eclipse of the Abyss cracks the old seal beneath Aethelgard, Demon Lord Satan wakes and his five Heralds carry off the Seal Stones that once held him. Three centuries ago the crown summoned one soul from Earth, the Lantern Knight, who sealed the demon with their own life and never went home. Now the Crown Heir draws the forbidden Pentagram Seal again: five souls from Earth light the points of the star, and you arrive as the sixth, a Novice with an empty Job line in the Covenant Ledger (the status screen only the summoned can see), free to walk any of the five paths.

The full story lives in [LORE.md](LORE.md) (Filipino: [LORE_FIL.md](LORE_FIL.md)), which the game loads into the Chronicles screen: fifteen Acts that follow the main quest, plus three reference chapters on the Pentagram Prophecy, the rules of the Covenant Ledger and Satan's Heralds. The setting borrows only broad isekai genre tropes (summoning, a status screen, job awakening, a demon lord); every name, character and place is original.

---

## 🎮 Features

- **Auto-adventure (Z):** autonomous quest movement, scouting, objective combat, quest loot collection and NPC conversations through the Book I campaign. Manual steering takes priority. The allowance starts at five real-world minutes; using a Soulstone adds ten minutes. Automated awakening defaults to Knight. Turning it off preserves remaining time; enabled time runs through pauses and offline time.
- **Summon automation (Z):** available pets collect nearby ground drops, including coins and quest items, while prioritizing defence against nearby threats. Walking familiars navigate around obstacles; falcons and guardian angels fly to pickups. Z triggers defensive falcon strikes and summons replacement guardian angels using normal cooldowns. Summons aboard ships or away on errands keep their existing restrictions, and full bags leave drops on the ground.
- **Meridian Guild:** the hall in southwest Aethelgard opens when Whispering Canopy is unlocked. Speak to Guild Master Oren to register (2P, plate included), Clerk Tessa for independent G–SSS contracts, and Representative Mira for resets (1P per service; 0.5P while a guild contract is active) and lost plates (twice their last issue price). F3 opens the contract ledger; services require the corresponding staff member nearby. Guild contracts award coins, items, independent point pools, EXP, class-appropriate sets, accessories and Epic/Legendary/Mythical tier weapons. Joining plays a four-scene animated ceremony.
- **Guild contract formats:** red hunt orders distinguish normal enemies, elites/champions and MVPs; green gathering orders identify herbs, stones, enemy drops or supplies from Guild Scout Bram; blue escort orders guide an NPC caravan between three survey sites through ambush waves. Gathered supplies are consumed on delivery. Caravans wait for nearby guides, display HP and defence gauges, and retain their condition on save/reload. A destroyed caravan requires abandoning and accepting its contract again. Auto-adventure follows accepted guild orders and returns to the clerk for rewards.
- **Automatic allocation:** Character → Stats, Skills and Paths each have their own automatic allocation controls. Learning observes prerequisites, level and resonance; each point pool stays independent. Paid resets refund the chosen pool and disable its automation. Guild Master reassessments use developed abilities and completed contracts for promotion. Arthur is an S Frontliner, Lyra an A Rear, Julian an SS Support, Samantha an S Damage Dealer and Renzo an A Damage Dealer.

- **Classic Retro Aesthetic:** Rendered on a native low-res canvas (`256x240`) upscaled via crisp nearest-neighbor pixel smoothing.
- **Top-Down Adventure World:** 
  - Dynamic camera tracking and smooth scrolling across an expanded map (`768x720`).
  - Roaming enemies and random ambush events from the wilderness.
- **5 Distinct Playable Classes:**
  - 🛡️ **Knight:** Durable melee tank with high stagger sword slashes and shield bashes.
  - 🔮 **Mage:** Arcane caster who calls down destructive screen-shaking Meteors (`J`) and area-of-effect Thunderstorms (`Space`).
  - ✝️ **Priest:** Holy commander who summons up to two sword-wielding Guardian Angels (`Space`) with separate HP and duration, and casts single-target smart priority heals (`J`).
  - 🏹 **Elven Archer:** Agile ranged hunter featuring quiver capacity (5 arrows), timed quiver reload channels, and a persistent hunting falcon companion (`Space`).
  - 🥊 **Fighter:** Hand-to-hand brawler with ranged Ki Force Spheres (`J`), lock-on target tracking, and homing flying dropkicks (`Space`).
- **Engaging Combat & Juice:**
  - Screen shake, floating damage numbers, white arcade hit flashes, and dynamic particle bursts.
  - Telegraphing enemy attack states (`!` windup warning and active lunges) with player counter-stagger mechanics.
- **Magnetic Loot System:**
  - Slimes drop floating items upon defeat (Herb Leaves for +30 HP & CD Reset; Monster Shards for Damage, Attack Speed, Movement Speed, or Stealth/Invisibility).
  - Floating items are magnetically pulled toward the player when within proximity.
- **Dedicated Modular UI & Audio:**
  - Dynamic gilded retro HUD with class portraits, health bars, and cooldown trackers.
  - 100% synthesized Web Audio API sound effects and music (no audio files): eleven tracks that change with the place, the night and boss fights, five fanfares and 30+ effects, all mixed through one compressor and reverb.
- **Cinematic presentation:** each new Act opens with a short intro over its banner; a terrain minimap with the quest objective, a framed world map with a route line, and matching pause, shop, mercenary and game over panels.
- **Settings (title Options or O in game):** music and sound volume, FPS limit (30 / 60 / 120 / max), FPS counter, brightness, shadows, glow and light, Quality (Sharp / Balanced / Fast caps the drawing scale on big screens), blood, weather and language.
- **Hotbar and Market:** the bottom tray holds the skills, quick slots and shortcuts above the adventure log; skills can be rearranged by drag and drop (P), and the Market (B) buys and sells anywhere inside a safe zone. The live map sits in the right panel.
- **Original Procedural Art:**
  - Every banner, background, vista, portrait and relic image is painted by code in `tools/art/` (no third-party assets). `node tools/art/render.mjs --list` lists them, `node tools/art/render.mjs <key>` re-renders one, and `data/art_manifest.json` holds the EN/FIL caption for each file.
  - `node tools/audio/render-audio.mjs --mp3` renders the music and sound effects offline for a listen and a level check.

---

## 🕹️ Controls

| Key | Action |
| :--- | :--- |
| **W, A, S, D** / **Arrow Keys** | Move |
| **J, K, L** | The skills in the hotbar's three slots (attack and two class skills; rearrange them with **P**) |
| **Space** | Hold to sprint, tap to lock the sprint |
| **Shift** | Switch the locked target |
| **E** | Talk / board the boat / mine an ore vein |
| **1–4** | Quick slots (potions) |
| **Q / I / C / N** | Quest log / Inventory / Character / Codex |
| **M** | World map (also the live map in the right panel; click it) |
| **B** | Market: buy and sell from anywhere inside a safe zone |
| **P** | Arrange skills: drag a skill from the skill book onto J, K, L (class skills) or T, Y, U (path skills), or drag one slot onto another |
| **O** | Settings: music and sound volume, FPS limit, FPS counter, brightness, shadows, glow, quality, blood, weather, language |
| **F** | Full screen on/off |
| **Esc** | Pause / Resume (close any open panel) |
| **H** / **X** | Main menu / export a secure save (while paused) |

--- | :--- |
| **W, A, S, D** / **Arrow Keys** | Move / Navigate Character Select |
| **J** | Primary Attack / Timed Arrow Reload (Archer) / Smart Heal (Priest) |
| **Space** | Special Skill / Falcon Strike / Summon Angel / Embark (Menu) |
| **Enter** | Confirm / Start Game / Resurrect after Game Over |
| **Esc / P** | Pause / Resume Game |
| **M** | Return to Hero Selection (from Pause Menu) |

---

## 🛠️ Developer Tools (admins & developers)

Open the game with `?dev` at the end of the address (for example `http://localhost/vanguard-of-fate/index.html?dev`), then press **F9** or click the **DEV** badge. The game pauses while the panel is open, and keys typed into it never reach the hero.

| Tab | What it does |
| :--- | :--- |
| **Save** | Shows the save as editable JSON. **Apply & reload** validates it, backs up the current save (the last 8 are kept) and reloads the game from the edited save, so the running game and the stored save always match. Download as `.json` or a signed `.vof`, open either kind of file, view or restore backups. |
| **Cheats** | Set level, gold, stat and skill points; full heal; god mode; one-hit kills; give any item by id; travel to any Act; spawn a Normal, Champion or Elite monster at any level; kill all monsters; save now. |
| **Balance** | Live hero numbers, session analytics (EXP/min, damage dealt and taken per minute, kills by tier, deaths, items used) and a table of this area's monsters at the bottom and top of its level range (HP, your hits to kill, hits to KO you, EXP, kills per level). Write design notes and export everything as a `.json` report. |

Without `?dev` none of this is loaded. Note: `?dev` only hides the tools; it is not a password. Real admin accounts need a server.

---

## 📁 Project Structure

```text
vanguard-of-fate/
├── index.html              # Main HTML entry point and canvas setup
├── css/
│   └── style.css           # Retro pixelated canvas styling and layout
├── js/
│   ├── main.js             # Game loop, state routing, and module coordinator
│   ├── player.js           # Player entity, movement, inputs, and stats
│   ├── enemy.js            # Slime AI, ambush logic, and state machines
│   ├── camera.js           # World coordinate tracking and viewport clamping
│   ├── ui.js               # Portraits, health bars, HUD, and game over overlays
│   ├── fx.js               # Screen shake, damage popups, sparks, and vignette
│   ├── audio.js            # Web Audio engine: sequencer, instruments, SFX
│   ├── music.js            # Music score (tracks, jingles) as data
│   ├── loot.js             # Magnetic floating item drops and temporary buff logic
│   ├── sprite.js           # Pixel matrix parser and shared environment sprites
│   └── classes/
│       ├── knight.js       # Knight class definition & sprite matrices
│       ├── mage.js         # Mage class definition & sprite matrices
│       ├── priest.js       # Priest & Guardian Angel sprites & abilities
│       ├── archer.js       # Elven Archer sprites & quiver reload mechanics
│       └── fighter.js      # Fighter sprites & flying dropkick logic
└── README.md
