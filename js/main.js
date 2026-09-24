import { KnightClass } from "./classes/knight.js";
import { MageClass } from "./classes/mage.js";
import { PriestClass, angelIdle } from "./classes/priest.js";
import { ArcherClass } from "./classes/archer.js";
import { FighterClass } from "./classes/fighter.js";
import { Player } from "./player.js";
import { Camera } from "./camera.js";
import { FXManager } from "./fx.js";
import { EnemyManager } from "./enemy.js";
import { ProjectileManager } from "./projectiles.js";
import { UIManager } from "./ui.js";
import { LootManager } from "./loot.js";
import { Sound } from "./audio.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const hudText = document.getElementById("hudText");

const ROSTER = [
    KnightClass,
    MageClass,
    PriestClass,
    ArcherClass,
    FighterClass
];

const WORLD = { width: 768, height: 720 };
const bounds = { minX: 8, maxX: WORLD.width - 32, minY: 8, maxY: WORLD.height - 32 };

const camera = new Camera(canvas.width, canvas.height, WORLD.width, WORLD.height);
const fx = new FXManager();
const enemyManager = new EnemyManager(WORLD.width, WORLD.height);
const projectileManager = new ProjectileManager(WORLD.width, WORLD.height);
const ui = new UIManager();
const lootManager = new LootManager();

let gameState = "SELECT";
let selectedIndex = 0;
let player = null;
let selectAnimTick = 0;
const keys = {};

window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Space") e.preventDefault();

    Sound.init();

    if (gameState === "SELECT") {
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
            selectedIndex = (selectedIndex - 1 + ROSTER.length) % ROSTER.length;
            Sound.playSelectMove();
        }
        if (e.code === "ArrowRight" || e.code === "KeyD") {
            selectedIndex = (selectedIndex + 1) % ROSTER.length;
            Sound.playSelectMove();
        }
        if (e.code === "Enter" || e.code === "Space" || e.code === "KeyJ") {
            Sound.playSelectConfirm();
            startGame();
        }
        return;
    }

    if (gameState === "GAMEOVER" && e.code === "Enter") {
        Sound.playSelectConfirm();
        startGame();
        return;
    }

    if (e.code === "Escape" || e.code === "KeyP") {
        if (gameState === "PLAYING") {
            gameState = "PAUSED";
            Sound.stopBGM();
        } else if (gameState === "PAUSED") {
            gameState = "PLAYING";
            Sound.startBGM();
        }
        return;
    }

    if (gameState === "PAUSED" && e.code === "KeyM") {
        gameState = "SELECT";
        player = null;
        fx.reset();
        enemyManager.clear();
        projectileManager.clear();
        lootManager.clear();
        Sound.stopBGM();
        hudText.innerHTML = `<span>A / D o Arrows</span>: Pumili ng Hero &nbsp;|&nbsp; <span>ENTER / SPACE / J</span>: Start`;
    }
});

window.addEventListener("keyup", (e) => (keys[e.code] = false));

function startGame() {
    player = new Player(120, 120, ROSTER[selectedIndex]);
    player.angels = [];
    gameState = "PLAYING";
    fx.reset();
    enemyManager.init();
    projectileManager.clear();
    lootManager.clear();
    Sound.startBGM();
    hudText.innerHTML = `<span>WASD</span> Maglakbay &nbsp;|&nbsp; <span>J</span> Atake / Heal &nbsp;|&nbsp; <span>SPACE</span> Skill / Summon &nbsp;|&nbsp; <span>ESC / P</span> Pause`;
}

function drawSpriteMatrix(ctx, x, y, spriteGrid, flashWhite = false) {
    const size = spriteGrid.length;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const color = spriteGrid[r][c];
            if (color) {
                ctx.fillStyle = flashWhite ? "#ffffff" : color;
                ctx.fillRect(Math.floor(x) + c, Math.floor(y) + r, 1, 1);
            }
        }
    }
}

function renderWorldMap() {
    ctx.fillStyle = "#2d6330";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    ctx.fillStyle = "#5c432d";
    ctx.fillRect(80, 0, 96, WORLD.height);
    ctx.fillRect(80, 320, 500, 80);
    ctx.fillRect(500, 320, 80, 400);

    ctx.fillStyle = "#735438";
    ctx.fillRect(86, 0, 84, WORLD.height);
    ctx.fillRect(86, 326, 488, 68);
    ctx.fillRect(506, 326, 68, 394);

    ctx.fillStyle = "#1e4420";
    for (let tx = 30; tx < WORLD.width; tx += 90) {
        for (let ty = 40; ty < WORLD.height; ty += 110) {
            if (Math.abs(tx - 120) > 60 && Math.abs(ty - 360) > 60) {
                ctx.fillStyle = "#4a2e18";
                ctx.fillRect(tx + 4, ty + 12, 4, 6);
                ctx.fillStyle = "#1e4420";
                ctx.fillRect(tx, ty + 6, 12, 6);
                ctx.fillRect(tx + 2, ty + 2, 8, 4);
                ctx.fillRect(tx + 4, ty - 2, 4, 4);
            }
        }
    }
}

function renderSelectScreen() {
    selectAnimTick++;
    ctx.fillStyle = "#101318";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fcd168";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText("VANGUARD OF FATE", canvas.width / 2, 34);

    ctx.fillStyle = "#7d8c9e";
    ctx.font = "9px monospace";
    ctx.fillText("SELECT YOUR HERO", canvas.width / 2, 48);

    ROSTER.forEach((hero, i) => {
        const cardX = 26 + i * 42;
        const cardY = 66;
        const isSelected = i === selectedIndex;

        ctx.fillStyle = isSelected ? "#242e3b" : "#161b22";
        ctx.fillRect(cardX, cardY, 36, 42);

        ctx.strokeStyle = isSelected ? "#fcd168" : "#2d3748";
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(cardX, cardY, 36, 42);

        ctx.fillStyle = isSelected ? "#fcd168" : "#5a6878";
        ctx.font = "bold 13px monospace";
        ctx.fillText(hero.name[0], cardX + 18, cardY + 26);
    });

    const activeHero = ROSTER[selectedIndex];
    const previewFrameIdx = Math.floor(selectAnimTick / 25) % activeHero.sprites.idle.length;
    drawSpriteMatrix(ctx, canvas.width / 2 - 12, 132, activeHero.sprites.idle[previewFrameIdx]);

    ctx.fillStyle = "#fcd168";
    ctx.font = "bold 12px monospace";
    ctx.fillText(activeHero.name.toUpperCase(), canvas.width / 2, 175);

    ctx.fillStyle = "#8a9aa8";
    ctx.font = "9px monospace";
    ctx.fillText(activeHero.title, canvas.width / 2, 189);

    ctx.fillStyle = "#4a5568";
    ctx.font = "8px monospace";
    ctx.fillText("Press ENTER or SPACE to Embark", canvas.width / 2, 218);
}

function renderGameWorld() {
    if (gameState === "PLAYING" && player) {
        camera.update(player.x, player.y);
        enemyManager.update(player, camera, fx);
        lootManager.update(player, fx);

        if (player.hp <= 0) {
            gameState = "GAMEOVER";
            Sound.stopBGM();
        }

        const closestEnemy = enemyManager.getClosest(player.x, player.y);
        const dmgMultiplier = player.buffs.damage > 0 ? 1.75 : 1.0;

        // Player Update
        player.update(
            keys, bounds, closestEnemy,
            (proj) => projectileManager.add(proj),
            (critDmg, isCrit) => {
                if (closestEnemy && closestEnemy.isAlive) {
                    const hitAngle = Math.atan2((closestEnemy.y + 12) - (player.y + 12), (closestEnemy.x + 12) - (player.x + 12));
                    enemyManager.damage(closestEnemy, Math.round(critDmg * dmgMultiplier), hitAngle, isCrit, fx, lootManager);
                    closestEnemy.isMarkedCritical = false;
                }
            }
        );

        // ==================== GUARDIAN ANGEL AI & TIMED LIFESPAN ====================
        if (player.angels && player.angels.length > 0) {
            player.angels.forEach((angel, idx) => {
                if (!angel.isAlive) return;

                // 1. TIMED EXISTENCE (12 seconds)
                angel.lifespan--;
                if (angel.lifespan <= 0) {
                    angel.isAlive = false;
                    fx.spawnHitSparks(angel.x + 12, angel.y + 12, "#ffffff", 14);
                    fx.spawnDamagePopup(angel.x + 12, angel.y - 8, "EXPIRED", false);
                    return;
                }

                angel.bobTimer += 0.08;
                angel.animTimer++;
                if (angel.animTimer >= 22) {
                    angel.animTimer = 0;
                    angel.animFrame = (angel.animFrame + 1) % angelIdle.length;
                }

                if (angel.hitTimer > 0) angel.hitTimer--;
                if (angel.attackCooldown > 0) angel.attackCooldown--;

                const sideOffsetX = idx === 0 ? -26 : 26;
                const flankTargetX = player.x + sideOffsetX;
                const flankTargetY = player.y - 12 + Math.sin(angel.bobTimer) * 4;

                const angelTarget = enemyManager.getClosest(angel.x, angel.y, 140);

                if (angelTarget && angelTarget.isAlive) {
                    const adx = (angelTarget.x + 12) - (angel.x + 12);
                    const ady = (angelTarget.y + 12) - (angel.y + 12);
                    const aDist = Math.hypot(adx, ady);

                    if (aDist > 20) {
                        angel.x += (adx / aDist) * 1.5;
                        angel.y += (ady / aDist) * 1.5;
                    } else if (angel.attackCooldown === 0) {
                        angel.attackCooldown = 55;
                        Sound.playSlash();
                        const strikeAngle = Math.atan2(ady, adx);
                        enemyManager.damage(angelTarget, Math.round(angel.damage * dmgMultiplier), strikeAngle, false, fx, lootManager);
                    }
                } else {
                    angel.x += (flankTargetX - angel.x) * 0.12;
                    angel.y += (flankTargetY - angel.y) * 0.12;
                }
            });

            player.angels = player.angels.filter(a => a.isAlive);
        }

        // Knight Melee Attack
        if (!player.isHomingKick &&
            ((player.state === "slashing" && player.animFrame === 1) ||
                (player.state === "bashing" && player.animFrame === 1))) {
            enemyManager.enemies.forEach(e => {
                if (e.isAlive && e.hitTimer === 0) {
                    const dist = Math.hypot((e.x + 12) - (player.x + 12), (e.y + 12) - (player.y + 12));
                    if (dist < 32) {
                        const hitAngle = Math.atan2((e.y + 12) - (player.y + 12), (e.x + 12) - (player.x + 12));
                        const baseDmg = player.state === "bashing" ? 25 : 15;
                        enemyManager.damage(e, Math.round(baseDmg * dmgMultiplier), hitAngle, false, fx, lootManager);
                    }
                }
            });
        }

        // Falcon Strike Flight
        if (player.falcon && player.falcon.state !== "HOVERING") {
            const f = player.falcon;
            if (f.state === "STRIKING") {
                const destX = f.target && f.target.isAlive ? f.target.x + 12 : f.targetX;
                const destY = f.target && f.target.isAlive ? f.target.y + 12 : f.targetY;
                const dx = destX - f.x;
                const dy = destY - f.y;
                const dist = Math.hypot(dx, dy);

                if (dist > 8) {
                    f.x += (dx / dist) * f.speed;
                    f.y += (dy / dist) * f.speed;
                } else {
                    if (!f.damageDealt && f.target && f.target.isAlive) {
                        enemyManager.damage(f.target, Math.round(34 * dmgMultiplier), Math.atan2(dy, dx), true, fx, lootManager);
                        f.damageDealt = true;
                    }
                    f.state = "RETURNING";
                }
            } else if (f.state === "RETURNING") {
                const destX = player.x + (player.facing === "right" ? -14 : 22);
                const destY = player.y - 12;
                const dx = destX - f.x;
                const dy = destY - f.y;
                const dist = Math.hypot(dx, dy);

                if (dist > 8) {
                    f.x += (dx / dist) * (f.speed * 1.15);
                    f.y += (dy / dist) * (f.speed * 1.15);
                } else {
                    f.state = "HOVERING";
                }
            }
        }

        projectileManager.update(enemyManager.enemies, enemyManager, fx, lootManager);
    }

    // Camera Shake & Render
    const { offsetX, offsetY } = fx.getShakeOffsets();
    ctx.save();
    ctx.translate(Math.round(-camera.x + offsetX), Math.round(-camera.y + offsetY));

    renderWorldMap();
    lootManager.draw(ctx);
    enemyManager.draw(ctx, drawSpriteMatrix);
    projectileManager.draw(ctx);

    if (player) {
        player.draw(ctx);

        // ==================== DRAW GUARDIAN ANGELS ====================
        if (player.angels && player.angels.length > 0) {
            player.angels.forEach(angel => {
                if (!angel.isAlive) return;

                // Shadow
                ctx.fillStyle = "rgba(10, 12, 16, 0.35)";
                ctx.beginPath();
                ctx.ellipse(angel.x + 12, angel.y + 22, 6, 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Angel Sprite Draw
                drawSpriteMatrix(ctx, angel.x, angel.y, angelIdle[angel.animFrame], angel.hitTimer > 0);

                // Angel Mini HP Bar (55 Max HP)
                const aBarW = 14;
                const aHpRem = Math.max(0, (angel.hp / angel.maxHp) * aBarW);
                ctx.fillStyle = "#111";
                ctx.fillRect(angel.x + 5, angel.y - 4, aBarW, 2);
                ctx.fillStyle = "#ffd166";
                ctx.fillRect(angel.x + 5, angel.y - 4, aHpRem, 2);

                // Angel Remaining Lifespan Timer Bar (Blue line sa ilalim ng HP)
                const aLifeRem = Math.max(0, (angel.lifespan / angel.maxLifespan) * aBarW);
                ctx.fillStyle = "#00f0ff";
                ctx.fillRect(angel.x + 5, angel.y - 2, aLifeRem, 1);
            });
        }

        // Falcon Draw
        if (player.falcon) {
            const f = player.falcon;
            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.fillStyle = "rgba(10, 12, 16, 0.35)";
            ctx.fillRect(-2, 14, 5, 2);
            ctx.fillStyle = "#6b4423";
            ctx.fillRect(-2, -2, 5, 4);
            ctx.fillStyle = "#ffd166";
            ctx.fillRect(player.facing === "right" ? 3 : -3, -1, 2, 2);
            ctx.fillStyle = "#4a2e18";
            if (f.wingTimer < 6) {
                ctx.fillRect(-5, -5, 10, 2);
                ctx.fillRect(-3, -3, 6, 2);
            } else {
                ctx.fillRect(-6, 0, 12, 2);
                ctx.fillRect(-4, 2, 8, 2);
            }
            ctx.restore();
        }

        // Archer Ammo Bar
        if (player.heroData.id === "archer") {
            const startDotX = player.x + 3;
            const dotY = player.y - 8;
            if (player.isReloading) {
                const relProgress = ((player.reloadMax - player.reloadTimer) / player.reloadMax) * 20;
                ctx.fillStyle = "#111";
                ctx.fillRect(player.x + 2, dotY, 20, 3);
                ctx.fillStyle = "#ffb703";
                ctx.fillRect(player.x + 2, dotY, relProgress, 3);
                ctx.font = "bold 6px monospace";
                ctx.textAlign = "center";
                ctx.fillText("RELOADING...", player.x + 12, dotY - 3);
            } else {
                for (let d = 0; d < 5; d++) {
                    ctx.fillStyle = d < player.arrowCount ? "#52b788" : "#444";
                    ctx.fillRect(startDotX + d * 4, dotY, 2, 3);
                }
                if (player.arrowCount === 0) {
                    ctx.fillStyle = "#e63946";
                    ctx.font = "bold 6px monospace";
                    ctx.textAlign = "center";
                    ctx.fillText("J: RELOAD", player.x + 12, dotY - 2);
                }
            }
        }
    }

    fx.updateAndDraw(ctx);
    ctx.restore();

    // Screen HUD
    ui.draw(ctx, player, enemyManager.enemies.length, canvas.width);
    fx.drawVignette(ctx, canvas.width, canvas.height);

    if (gameState === "GAMEOVER") {
        ui.drawGameOver(ctx, canvas.width, canvas.height);
    }

    if (gameState === "PAUSED") {
        ctx.fillStyle = "rgba(10, 14, 20, 0.75)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#161b22";
        ctx.fillRect(48, 83, 160, 74);
        ctx.strokeStyle = "#fcd168";
        ctx.strokeRect(48, 83, 160, 74);
        ctx.fillStyle = "#fcd168";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", canvas.width / 2, 105);
        ctx.fillStyle = "#a0aec0";
        ctx.font = "8px monospace";
        ctx.fillText("ESC / P : Resume Game", canvas.width / 2, 125);
        ctx.fillText("M : Return to Hero Select", canvas.width / 2, 139);
    }
}

function gameLoop() {
    if (gameState === "SELECT") {
        renderSelectScreen();
    } else {
        renderGameWorld();
    }
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);