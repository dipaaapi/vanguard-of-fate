import { parseSprite } from "../sprite.js";
import { Sound } from "../audio.js";

// ==================== 1. CLERIC/PRIEST SPRITES ====================
const priestIdle = [
    parseSprite([
        "..........1111..........",
        "........11HHHH11........",
        ".......1HHHHHHHH1.......",
        ".......1H111111H1.......",
        ".......111SOOS111.......",
        "........11SOOS11........",
        "........11111111........",
        ".......1HHJJJJHH1.......",
        "......1HHHJJJJHHH1......",
        ".....1HHHHJJJJHHHH1.J...",
        ".....1HHHH1JJ1HHHH1JJJ..",
        ".....1HHHH1JJ1HHHH1.J...",
        ".....1HHHH1JJ1HHHH1.1...",
        "......1HHH1JJ1HHH1..1...",
        "......1HHHHJJHHHH1......",
        "......1HHHHHHHHHH1......",
        "......1HHHHHHHHHH1......",
        "......1IIIIIIIIII1......",
        ".......1111..1111.......",
        "........121..121........",
        "........11....11........",
        "........................",
        "........................",
        "........................"
    ]),
    parseSprite([
        "..........1111..........",
        "........11HHHH11........",
        ".......1HHHHHHHH1.......",
        ".......1H111111H1.......",
        ".......111SOOS111.......",
        "........11SOOS11........",
        "........11111111........",
        ".......1HHJJJJHH1.......",
        "......1HHHJJJJHHH1......",
        ".....1HHHHJJJJHHHH1.J...",
        ".....1HHHH1JJ1HHHH1JJJ..",
        ".....1HHHH1JJ1HHHH1.J...",
        ".....1HHHH1JJ1HHHH1.1...",
        "......1HHH1JJ1HHH1..1...",
        "......1HHHHJJHHHH1......",
        "......1HHHHHHHHHH1......",
        "......1HHHHHHHHHH1......",
        "......1IIIIIIIIII1......",
        ".......1111..1111.......",
        "........121..121........",
        "........11....11........",
        "........................",
        "........................",
        "........................"
    ])
];

const priestHeal = [
    parseSprite([
        "..........1111..........",
        "........11HHHH11........",
        ".......1HHHHHHHH1.......",
        ".......1H111111H1.......",
        ".......111SOOS111...JJ..",
        "........11SOOS11...JJJJ.",
        "........11111111....JJ..",
        ".......1HHJJJJHH1...1...",
        "......1HHHJJJJHHH1..1...",
        ".....1HHHHJJJJHHHH111...",
        ".....1HHHH1JJ1HHHH1.....",
        ".....1HHHH1JJ1HHHH1.....",
        "......1HHH1JJ1HHH1......",
        "......1HHHHJJHHHH1......",
        "......1HHHHHHHHHH1......",
        "......1IIIIIIIIII1......",
        ".......1111..1111.......",
        "........121..121........",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................"
    ]),
    priestIdle[0]
];

const priestSummon = [
    parseSprite([
        "..........1111..........",
        "........11HHHH11........",
        ".......1HHHHHHHH1.......",
        ".......1H111111H1..55...",
        ".......111SOOS111.5555..",
        "........11SOOS11...55...",
        "........11111111....1...",
        ".......1HHJJJJHH1..11...",
        "......1HHHJJJJHHH11JJ1..",
        ".....1HHHHJJJJHHHH1JJJ1.",
        ".....1HHHH1JJ1HHHH1.J...",
        ".....1HHHH1JJ1HHHH1.....",
        "......1HHH1JJ1HHH1......",
        "......1HHHHJJHHHH1......",
        "......1HHHHHHHHHH1......",
        "......1IIIIIIIIII1......",
        ".......1111..1111.......",
        "........121..121........",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................"
    ]),
    priestIdle[0]
];

// ==================== 2. GUARDIAN ANGEL SPRITES ====================
export const angelIdle = [
    parseSprite([
        "..........5555..........",
        ".........55..55.........",
        "..........5555..........",
        "........11111111........",
        "........11SOOS11........",
        "........11SOOS11...4....",
        "........11111111...4....",
        "...55..11HHHHHH11..4....",
        "..55551HHHHHHHHHH1.4....",
        "..55551HHHJJJJHHH1.4....",
        "...55.1HHHHHHHHHH1AABAA.",
        "......1HHHHHHHHHH1.11...",
        "......1HHHHHHHHHH1......",
        ".......1HHHHHHHH1.......",
        "........1HHHHHH1........",
        ".........1HHHH1.........",
        "..........1II1..........",
        "...........11...........",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................"
    ]),
    parseSprite([
        "..........5555..........",
        ".........55..55.........",
        "..........5555..........",
        "........11111111........",
        "........11SOOS11........",
        "........11SOOS11...4....",
        "........11111111...4....",
        "....55.11HHHHHH11..4....",
        "...5551HHHHHHHHHH1.4....",
        "...5551HHHJJJJHHH1.4....",
        "....551HHHHHHHHHH1AABAA.",
        "......1HHHHHHHHHH1.11...",
        "......1HHHHHHHHHH1......",
        ".......1HHHHHHHH1.......",
        "........1HHHHHH1........",
        ".........1HHHH1.........",
        "..........1II1..........",
        "...........11...........",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................"
    ])
];

// ==================== 3. PRIEST CLASS MECHANICS ====================
export const PriestClass = {
    id: "priest",
    name: "Priest",
    title: "Holy Patriarch",
    speed: 1.35,
    maxHp: 110,
    attackCooldown: 55, // ~0.9s delay sa heal
    cooldown: 240,       // 4s cooldown pag nag-summon
    sprites: {
        idle: priestIdle,
        run: priestIdle,
        slash: priestHeal,
        bash: priestSummon
    },

    // KEY J: SINGLE TARGET HEAL
    // 10% ng Max HP sa Priest (+11 HP) | 50% nun sa Angel (+5 HP)
    onAttack(player, target, spawnSpell) {
        if (!player.angels) player.angels = [];

        const candidates = [
            { entity: player, hp: player.hp, maxHp: player.maxHp, isAngel: false }
        ];

        player.angels.forEach(a => {
            if (a.isAlive) {
                candidates.push({ entity: a, hp: a.hp, maxHp: a.maxHp, isAngel: true });
            }
        });

        // Piliin kung sino ang may pinakamababang porsyento ng HP
        candidates.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
        const chosen = candidates[0];

        // FORMULA NG HEAL:
        // Priest = 10% ng 110 Max HP = +11 HP
        // Angel = 50% ng lakas ng heal ng Priest = +5 HP
        const healAmount = chosen.isAngel ? 5 : Math.round(player.maxHp * 0.10);

        const oldHp = chosen.entity.hp;
        chosen.entity.hp = Math.min(chosen.maxHp, chosen.entity.hp + healAmount);

        Sound.playHolyBurst();

        if (spawnSpell) {
            spawnSpell({
                type: "heal_effect",
                x: chosen.entity.x + 12,
                y: chosen.entity.y + 12,
                radius: 3,
                maxRadius: 18,
                amount: Math.round(chosen.entity.hp - oldHp)
            });
        }
    },

    // KEY SPACE: SUMMON FLOATING ANGEL (50% HP ng Priest = 55 HP, may 12-second lifespan)
    onSkill(player, target, spawnSpell) {
        if (!player.angels) player.angels = [];

        player.angels = player.angels.filter(a => a.isAlive);

        // Limit hanggang 2 Angels lang
        if (player.angels.length >= 2) return;

        const slotIndex = player.angels.length;
        const offsetX = slotIndex === 0 ? -24 : 24;

        const angelMaxHp = Math.round(player.maxHp * 0.5); // Eksaktong 55 HP

        const newAngel = {
            id: Math.random(),
            x: player.x + offsetX,
            y: player.y - 12,
            maxHp: angelMaxHp,
            hp: angelMaxHp,
            lifespan: 720,      // 12 seconds existence limit (720 ticks @ 60 FPS)
            maxLifespan: 720,
            damage: 15,
            attackCooldown: 0,
            animTimer: 0,
            animFrame: 0,
            bobTimer: Math.random() * Math.PI,
            isAlive: true,
            hitTimer: 0
        };

        player.angels.push(newAngel);
        Sound.playHolyBurst();

        if (spawnSpell) {
            spawnSpell({
                type: "holy_burst",
                x: newAngel.x + 12,
                y: newAngel.y + 12,
                radius: 4,
                maxRadius: 24,
                color: "#ffffff",
                alpha: 1.0
            });
        }
    },

    onSkillUpdate() { }
};