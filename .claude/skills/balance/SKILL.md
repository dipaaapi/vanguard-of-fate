---
name: balance
description: Measure and tune Vanguard of Fate's combat balance and class fairness (monster HP/damage per Act, class DPS and survivability, boss fights, EXP pace, gear grades) with a headless simulator that runs the game's own code. Use before and after any change to stats, skills, class kits, monsters, bosses, tiers, elements, items, EXP or level bands, and whenever the user asks whether something is fair, too hard, too easy or overpowered.
---

# Balance (measure first, tune second)

Balance questions usually cost a lot of reading: the numbers live in a dozen files (`player.js` recalc/takeDamage, `enemy.js` spawn/damage/kill, `skills.js`, `monsterTiers.js`, `elements.js`, `bestiary.js`, `items/itemdb.js`, every `classes/*.js` kit, `projectiles.js`). Don't read them to estimate. Run the simulator, which imports those modules headless and measures:

```
B=.claude/skills/balance/balance-sim.mjs
node $B                          # every class × every area (hub + Acts VII–XII): one summary table each (~0.5 s)
node $B --area frost             # one area, one row per monster + the boss, with each hero's full stat line
node $B --level +3               # heroes over-levelled (or -3 under-levelled)
node $B --gear kit               # only the class kit + starter clothes (worst case gear)
node $B --build class            # stats spent by the in-game auto stat path (str | dex | int | class)
node $B --familiar 5             # Novice/Knight/Mage/Fighter add their familiar at skill Lv 5 (js/summons/familiar.js)
node $B --out reports/balance-report.md
```

Areas: `hub`, `canopy`, `coast`, `frost`, `ash`, `siege`, `maw`.

## What the columns mean

- **J dmg**: one use of the basic attack on one same-band monster, after element/race/size, ATK, crit chance.
- **DPS**: J + K + L each used on cooldown (attack speed and CDR applied), all projectile ticks counted. AoE is counted on one target.
- **TTK s**: seconds to kill one normal monster. **Hits to die / TTD**: same monster hitting the hero through DEF and guard.
- **Fights/life**: TTD ÷ TTK. Above ~3 is comfortable; under 1 the hero loses a straight 1 v 1. The **class spread** line under each table is the fairness number: how many times safer the best class is than the worst.
- **Kills/Lv**: same-level normal kills for the next level (`expFor` vs `EnemyManager.kill`).
- **Boss TTK / hits to die**: the Act boss 1 v 1 (patterns, hazards and summons not simulated).

Not modelled (say so when you quote numbers): Priest angels and heals, Archer quiver reload, the falcon, mercenaries, potions, skill-tree points (only the familiar, with `--familiar`), path actives on T/Y/U, night (+20% monster damage), Champion/Elite tiers (×2 / ×3.5 HP), monster movement and patterns. The baseline today: Priest has by far the lowest solo kill speed because its J is a heal and its angels aren't counted. Read Priest rows with that in mind.

## Workflow

1. **Baseline:** run `node $B` (or `--area <id>`) before touching anything and keep the output.
2. **Find the lever** with `/codemap` (`where <symbol>`), not by reading files: monster numbers in `bestiary.js` (`hpMult`, `dmg`) and `EnemyManager.spawn` (`35 + lvl*12` HP, `dmg + lvl*1.6`); bands in `EnemyManager.setArea`; hero curves in `Player.recalc` / `takeDamage` / `expFor`; skill damage in each kit's `onAttack/onSkill/onSkill2` and `projectiles.js`; gear in `itemdb.js` (`EQUIP`, grade scaling).
3. **Change one lever**, rerun the same command, compare. Prefer changing a table value over a formula.
4. **Fairness:** aim to narrow the class spread without flattening class identity (Knight tanky, Mage glass cannon). Report before → after numbers for the affected areas.
5. Run `node .claude/skills/codemap/codemap.mjs verify` and `node .claude/skills/content/content-check.mjs`. For feel, run `/playtest`.

If a mechanic the simulator ignores becomes the subject (angels, quiver, night), extend `balance-sim.mjs` with the real module rather than estimating by hand, and update the "Not modelled" list above.
