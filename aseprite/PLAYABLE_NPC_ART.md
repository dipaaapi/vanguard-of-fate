# Playable NPC sprite production standard

This brief covers the five playable NPC recruits established in `LORE.md`: Eirene (Lost Continent), Ceryn Voss (Aethelgard), Vael Thorn (Dark Continent), Nima Fen (Beastkin swamp), and Dame Serelle (royal Templar). They are full player characters, not alternate hero outfits. Their sprites, expressions, skill effects, and animation must make each recruit recognizable at game scale and more visually developed than the standard hero and town NPC sprites.

## Character sheets

Create dedicated sprite sheets for each character. Keep the game's pixel-art language, but give recruits more bespoke silhouette design, costume layers, material highlights, facial pixels, and signature-color accents than the shared modular Avatar. Do not achieve detail by adding noisy pixels: important shapes and expressions must remain legible at native game scale.

Each sheet must include:

- Eight directions: front, front-diagonals, sides, back-diagonals, and back.
- Idle, walk, run, basic attack, hit, dodge/recovery, and interaction poses, with enough frames for clean loops and readable anticipation/recovery.
- Dedicated animations for every active skill, including windup, release, and recovery. Give every projectile its own launch, travel, and impact frames/effects.
- Readable body-language differences between neutral, alert, confident, worried, angry, joyful, and hurt states.
- Separate close-up portraits for neutral, speaking, joyful, worried, angry, and determined expressions. A portrait must change the eyes and mouth/brow pixels, not merely tint or rotate the head.

## Character-specific visual identity

- **Eirene:** precise maid silhouette with unmistakably mechanical joints, porcelain/metal face details, luminous protocol indicators, and a high-contrast Lost Continent palette. Her face display and posture should show calm service, diagnostic focus, alarm, and relief. Animate her Maintenance Protocol transitions, scanning drones, wind/lift redirection, and mechanical barriers as distinct actions. Any autonomous drone that fights or follows her needs its own readable idle, movement, scan/attack, projectile, and impact sprites.
- **Ceryn Voss:** Aethelgard royal envoy whose layered field uniform, oath seals, and command pennants distinguish her from the royal family and the five class mentors. Her expression set should show diplomatic composure, doubt, resolve, and hard-won confidence. Animate Oathmark placement and the resulting command cues clearly enough that players can read which order is active.
- **Vael Thorn:** Dark Continent survivor and guide with a broken-in travel silhouette, practical protective layers, and controlled Umbral Anchor motifs. His face and posture should communicate vigilance, grief, distrust, and earned trust. Animate anchor throws, tethers, position swaps, and their endpoints as separate readable beats.
- **Nima Fen:** Beastkin marsh guide with tall animal ears, a furred muzzle, a brush tail, layered wetland gear, gathering tools, and vivid Bogcraft colors. Her expression and posture should move from guarded caution to curiosity and confidence. Animate reagent gathering, concoction preparation, decoys, terrain growth, and traps as separate actions.
- **Dame Serelle:** the heir's ever-present royal Templar, in ivory and crimson plate with a clear lance silhouette and a visible mourning token for the King. Her expressions should show dutiful composure, shock, guilt, and eventual acceptance. Animate Last Vow, her fast pursuit charge, and the protective ward of Heir's Sanctuary as distinct skill actions.

## Summons, deployables, and effects

No separate familiar is assigned to these five characters in the current story draft. If a recruit later receives a summon, create a dedicated summon sheet rather than reusing a monster or another recruit's art. It needs its own idle, movement, attack, skill, projectile, hit/impact, mockery/taunt, and expression/body-language poses in all usable directions. Animate facial features where the creature has a face; otherwise communicate expression through eyes, mouthparts, ears, wings, tail, or stance.

Any summoned projectile or autonomous support actor—including Eirene's drones when they act independently—also needs bespoke sprites for launch/spawn, travel or movement, attack, and impact/despawn. Skill effects must use the recruit's palette and silhouette language without hiding the actor or target.

## Review gate

Review every direction and frame at native game scale and at integer enlargement. Check facial readability in dialogue portraits, animation loops, silhouette recognition against the hero, and effect visibility over light and dark backgrounds. Do not call a recruit's art complete while any required animation, expression, skill, projectile, or applicable summon state is represented only by a reused hero/NPC frame or a static placeholder.
