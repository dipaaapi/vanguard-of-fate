---
name: autoplay
description: Let a bot play the real Vanguard of Fate game headless for a while and report kills/min, EXP/min, level gain, lowest HP, potions, deaths, stuck count and console errors, per class and area. Use to compare classes in the actual game loop (after balance-sim), to check an Act is beatable at its level, or as a soak test for errors in long sessions.
---

# Autoplay (bot playtest)

```
A=.claude/skills/autoplay/autoplay.mjs
node $A                                                    # new Novice, 60 s in the hub
node $A --class mage --level 25 --area ash --seconds 90
node $A --class knight,mage,priest,archer,fighter --level 30 --area frost   # class spread, one run each
node $A --save my.json --seconds 300 --immortal           # soak test a save
node $A ... --json                                        # machine-readable
```

The bot (in `scripts/gamebrowser.mjs`, shared with the vof-game MCP server) walks to the nearest monster it can actually reach (breadth-first over the tile grid, so it goes around walls and water), holds J in range, taps K / L when they are ready, drinks from quick slot 1 below 40% HP and clicks through dialogs. It leaves elites, bosses and monsters 5+ levels above the hero alone unless they are on top of it (`--hunt` attacks them too). `--immortal` refills HP at 25% and counts a death, so long runs keep going. `--no-skills`, `--no-potions`.

Setup uses the debug handle: `--level` adds EXP, `--class` runs Job Awakening, `--area` travels (`hub`, `canopy`, `coast`, `frost`, `ash`, `strand`, `ossuary`, `siege`, `chainspire`, `maw`). Start/end screenshots go to `<tmp>/vof-autoplay/`.

## Reading the numbers

- A bot is not a player: it doesn't dodge, kite or pick skills. Compare classes or builds against each other in the same area and length, not against human expectations.
- Runs vary (spawns, elites, wandering). For a class comparison use 60 s+ and repeat when two classes are within ~20%.
- `balance-sim` first (seconds, deterministic, explains why); autoplay second (confirms it in the game loop, catches AI/pathing/skill bugs the model can't).
- Any console error during the run makes the exit code 1.
