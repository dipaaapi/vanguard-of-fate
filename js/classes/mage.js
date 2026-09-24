import { parseSprite } from "../sprite.js";

const mageIdle = [
    parseSprite([
        "..........DD............", ".........DDEE...........", "........DDDEED..........",
        ".......DDDDEEDD.........", "......1111111111........", "........1SOOS1....F.....",
        "........1SOOS1...FFF....", "........111111....1.....", ".......1CCCCCC1..1N1....",
        "......1CDDDDDEC1.1N1....", ".....1CDDDDDDDEC1.1.....", ".....1CDDDDDDDEC1.1.....",
        ".....1CDDDDDDDEC1.1.....", ".....1CCCCCCCCEC1.1.....", "......1111111111..1.....",
        "......1CCCCCCCC1..1.....", "......1DDDDDDDDC1.1.....", "......1DDDDDDDDC1.......",
        "......1CCCCCCCC1........", "......1CCCCCCCC1........", ".......111..111.........",
        ".......121..121.........", "........................", "........................"
    ]),
    parseSprite([
        "..........DD............", ".........DDEE...........", "........DDDEED..........",
        ".......DDDDEEDD.........", "......1111111111........", "........1SOOS1...FFF....",
        "........1SOOS1....F.....", "........111111....1.....", ".......1CCCCCC1..1N1....",
        "......1CDDDDDEC1.1N1....", ".....1CDDDDDDDEC1.1.....", ".....1CDDDDDDDEC1.1.....",
        ".....1CDDDDDDDEC1.1.....", ".....1CCCCCCCCEC1.1.....", "......1111111111..1.....",
        "......1CCCCCCCC1..1.....", "......1DDDDDDDDC1.1.....", "......1DDDDDDDDC1.......",
        "......1CCCCCCCC1........", "......1CCCCCCCC1........", ".......111..111.........",
        ".......121..121.........", "........................", "........................"
    ])
];

const mageCast = [
    parseSprite([
        "..........DD............", ".........DDEE...........", "........DDDEED..........",
        ".......DDDDEEDD.........", "......1111111111........", "........1SOOS1....F.....",
        "........1SOOS1...FFF....", "........111111....1.....", ".......1CCCCCC1..1N1....",
        "......1CDDDDDEC11NFN1...", ".....1CDDDDDDDEC1.1.....", ".....1CDDDDDDDEC1.......",
        "......1111111111........", "......1CCCCCCCC1........", "......1DDDDDDDDC1.......",
        ".......111..111.........", ".......121..121.........", "........................",
        "........................", "........................", "........................",
        "........................", "........................", "........................"
    ]),
    mageIdle[0]
];

export const MageClass = {
    id: "mage",
    name: "Mage",
    title: "Arcane Sage",
    speed: 1.3,
    attackCooldown: 110, // ~1.8 seconds cooldown para sa Big Meteor (Key J)
    cooldown: 360,       // 6 seconds cooldown para sa Thunderstorm (Key Space)
    sprites: {
        idle: mageIdle,
        run: mageIdle,
        slash: mageCast,
        bash: mageCast
    },

    onAttack(player, target, spawnSpell) {
        const targetX = target && target.isAlive ? target.x + 12 : player.x + (player.facing === "right" ? 70 : -70);
        const targetY = target && target.isAlive ? target.y + 12 : player.y;

        spawnSpell({
            type: "meteor",
            targetX: targetX,
            targetY: targetY,
            x: targetX - 50,
            y: -40,
            speedX: 2.5,
            speedY: 4.5,
            exploded: false,
            explosionRadius: 2,
            maxExplosionRadius: 38,
            damageDealt: false
        });
    },

    onSkill(player, target, spawnSpell) {
        const stormCenterX = target && target.isAlive ? target.x + 12 : player.x + 20;
        const stormCenterY = target && target.isAlive ? target.y + 12 : player.y;

        spawnSpell({
            type: "thunderstorm",
            centerX: stormCenterX,
            centerY: stormCenterY,
            radius: 55,
            duration: 300,
            strikeInterval: 14,
            strikeTimer: 0,
            activeBolts: []
        });
    },

    onSkillUpdate() { }
};