# ⚔️ Vanguard of Fate

A browser-based, pure-coded retro 32-bit Action RPG / Adventure game powered by HTML5 Canvas and Vanilla JavaScript (ES Modules). Features real-time top-down combat, camera scrolling, modular character classes, synthesized chiptune audio, and dynamic enemy AI.

---

## 📖 Story

When the Eclipse of the Abyss cracks the old seal beneath Aethelgard, Demon Lord Satan wakes and his five Heralds carry off the Seal Stones that once held him. Three centuries ago the crown summoned one soul from Earth, the Lantern Knight, who sealed the demon with their own life and never went home. Now the Crown Heir draws the forbidden Pentagram Seal again: five souls from Earth light the points of the star, and you arrive as the sixth, a Novice with an empty Job line in the Covenant Ledger (the status screen only the summoned can see), free to walk any of the five paths.

The full story lives in [LORE.md](LORE.md) (Filipino: [LORE_FIL.md](LORE_FIL.md)), which the game loads into the Chronicles screen: twelve Acts that follow the main quest, plus three reference chapters on the Pentagram Prophecy, the rules of the Covenant Ledger and Satan's Heralds. The setting borrows only broad isekai genre tropes (summoning, a status screen, job awakening, a demon lord); every name, character and place is original.

---

## 🎮 Features

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
- **Original Procedural Art:**
  - Every banner, background, vista, portrait and relic image is painted by code in `tools/art/` (no third-party assets). `node tools/art/render.mjs --list` lists them, `node tools/art/render.mjs <key>` re-renders one, and `data/art_manifest.json` holds the EN/FIL caption for each file.
  - `node tools/audio/render-audio.mjs --mp3` renders the music and sound effects offline for a listen and a level check.

---

## 🕹️ Controls

| Key | Action |
| :--- | :--- |
| **W, A, S, D** / **Arrow Keys** | Move / Navigate Character Select |
| **J** | Primary Attack / Timed Arrow Reload (Archer) / Smart Heal (Priest) |
| **Space** | Special Skill / Falcon Strike / Summon Angel / Embark (Menu) |
| **Enter** | Confirm / Start Game / Resurrect after Game Over |
| **Esc / P** | Pause / Resume Game |
| **M** | Return to Hero Selection (from Pause Menu) |

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