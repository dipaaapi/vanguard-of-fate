import { parseSprite } from "../sprite.js";

// ==================== 1. FEMALE ELF ARCHER SPRITES (24x24) ====================
// G = Golden Blonde Hair, O = Fair Skin, L = Forest Tunic, N = Wooden Bow, B = Gold Crown/Feather
const elfIdle = [
    parseSprite([
        "..........GGG...........",
        "........GGGGGG..........",
        ".......GGGGGGGG.........",
        "......O11GGGG11O........", // O = Long pointed elf ears
        "......OO1SOOS1OO........", // Long ears extended outward
        ".......11SOOS11.........",
        "........111111..........",
        ".......GGLLLLGG.........", // Flowing blonde hair over shoulders
        "......G1LLLLLL1G..N.....",
        ".....GG1LLLLLL1GGN.N....",
        ".....G1888888881GN.N....", // Leather corset & bow
        "......18LLLLLL81.N......",
        "......1LLLLLLLL1.N......",
        ".......18888881.11N1....",
        ".......1LLLLLL1..N......",
        ".......1LLLLLL1.N.N.....",
        "........18..81...N......",
        "........18..81..........",
        "........12..21..........",
        "........12..21..........",
        ".......112..211.........",
        "........................",
        "........................",
        "........................"
    ]),
    parseSprite([
        "..........GGG...........",
        "........GGGGGG..........",
        ".......GGGGGGGG.........",
        "......O11GGGG11O........",
        "......OO1SOOS1OO........",
        ".......11SOOS11.........",
        "........111111..........",
        ".......GGLLLLGG.........",
        "......G1LLLLLL1G..N.....",
        ".....GG1LLLLLL1GGN.N....",
        ".....G1888888881GN.N....",
        "......18LLLLLL81.N......",
        "......1LLLLLLLL1.N......",
        ".......18888881.11N1....",
        ".......1LLLLLL1..N......",
        ".......1LLLLLL1.N.N.....",
        "........18..81...N......",
        "........12..21..........",
        "........12..21..........",
        "........13..31..........",
        ".......112..211.........",
        "........................",
        "........................",
        "........................"
    ])
];

const elfShoot = [
    parseSprite([
        "..........GGG...........",
        "........GGGGGG..........",
        ".......GGGGGGGG.........",
        "......O11GGGG11O........",
        "......OO1SOOS1OO........",
        ".......11SOOS11.........",
        "........111111..........",
        ".......GGLLLLGG...N.....",
        "......G1LLLLLL1G.N55555.", // Bow drawn with gleaming arrow tip
        ".....GG1LLLLLL1GG.N.....",
        ".....G1888888881G111....",
        "......18LLLLLL81........",
        "......1LLLLLLLL1........",
        ".......18888881.........",
        ".......1LLLLLL1.........",
        "........18..81..........",
        "........12..21..........",
        ".......112..211.........",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................"
    ]),
    elfIdle[0]
];

const elfReload = [
    parseSprite([
        "..........GGG...........",
        "........GGGGGG..........",
        ".......GGGGGGGG.........",
        "......O11GGGG11O........",
        "......OO1SOOS1OO........",
        ".......11SOOS11.........",
        "........111111..........",
        ".......GGLLLLGG.........",
        "......G1LLLLLL1G........",
        ".....GG1LLLLLL1GG.......",
        ".....G1888888881G.......",
        "......18LLLLLL81.888....", // Quiver reach behind
        "......1LLLLLLLL1.8N8....",
        ".......18888881...N.....",
        ".......1LLLLLL1.........",
        "........18..81..........",
        "........12..21..........",
        ".......112..211.........",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................",
        "........................"
    ]),
    elfIdle[0]
];

// ==================== 2. ARCHER MECHANICS ====================
export const ArcherClass = {
    id: "archer",
    name: "Archer",
    title: "Elven Huntress",
    speed: 1.55,
    attackCooldown: 20, // Short interval between arrows
    cooldown: 240,       // 4s cooldown para sa Falcon strike
    maxArrows: 5,
    reloadDuration: 90,  // 1.5 seconds (90 frames @ 60fps) reload wait
    sprites: {
        idle: elfIdle,
        run: elfIdle,
        slash: elfShoot,
        bash: elfReload
    },

    onAttack(player, target, spawnProjectile) {
        if (player.arrowCount === undefined) player.arrowCount = 5;

        // Kung kasalukuyang nagre-reload, huwag pabarilin
        if (player.isReloading) return;

        // Kung ubos na ang bala: Simulan ang Timed Reloading
        if (player.arrowCount <= 0) {
            player.isReloading = true;
            player.reloadTimer = this.reloadDuration;
            player.state = "slashing"; // Reload animation stance
            return;
        }

        // Kung may bala: Magpakawala ng arrow
        player.arrowCount--;
        const spawnX = player.x + 12;
        const spawnY = player.y + 12;
        const cos = Math.cos(player.aimAngle);
        const sin = Math.sin(player.aimAngle);

        spawnProjectile({
            type: "arrow",
            x: spawnX,
            y: spawnY,
            vx: cos * 5.2,
            vy: sin * 5.2,
            angle: player.aimAngle
        });
    },

    onSkill(player, target) {
        // I-command ang Falcon na lumusob kung nakatambay ito sa tabi
        if (player.falcon && player.falcon.state === "HOVERING") {
            player.falcon.state = "STRIKING";
            player.falcon.damageDealt = false;
            player.falcon.target = target && target.isAlive ? target : null;
            player.falcon.targetX = target && target.isAlive ? target.x + 12 : player.x + (player.facing === "right" ? 110 : -110);
            player.falcon.targetY = target && target.isAlive ? target.y + 12 : player.y;
        }
    },

    onSkillUpdate() { }
};