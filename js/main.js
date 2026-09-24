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
import { Stage } from "./stage.js";
import { TitleScene } from "./title.js";
import { SelectScene } from "./select.js";
import { GameEngine } from "./gameLogic.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const hudText = document.getElementById("hudText");
const ROSTER = [KnightClass, MageClass, PriestClass, ArcherClass, FighterClass];

// 1. Initialize Modular Systems
const stage = new Stage(768, 720);
const camera = new Camera(canvas.width, canvas.height, stage.width, stage.height);
const fx = new FXManager();
const enemyManager = new EnemyManager(stage.width, stage.height);
const projectileManager = new ProjectileManager(stage.width, stage.height);
const ui = new UIManager();
const lootManager = new LootManager();

// 2. Initialize Game Engine (Mechanics & Logic)
const gameEngine = new GameEngine(stage, camera, fx, enemyManager, projectileManager, lootManager);

function drawSpriteMatrix(targetCtx, x, y, spriteGrid, flashWhite = false) {
    if (!spriteGrid) return;
    const size = spriteGrid.length;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const color = spriteGrid[r][c];
            if (color) {
                targetCtx.fillStyle = flashWhite ? "#ffffff" : color;
                targetCtx.fillRect(Math.floor(x) + c, Math.floor(y) + r, 1, 1);
            }
        }
    }
}

let gameState = "TITLE";
let player = null;
const keys = {};

// Scenes
const titleScene = new TitleScene(() => {
    gameState = "SELECT";
    hudText.innerHTML = `<span>A / D o Arrows</span>: Pumili ng Hero &nbsp;|&nbsp; <span>ENTER / SPACE / J</span>: Start`;
});

const selectScene = new SelectScene(ROSTER, (chosenHero) => {
    player = new Player(120, 120, chosenHero);
    player.angels = [];
    gameState = "PLAYING";
    fx.reset();
    enemyManager.init();
    projectileManager.clear();
    lootManager.clear();
    Sound.startBGM();
    hudText.innerHTML = `<span>WASD</span> Maglakbay &nbsp;|&nbsp; <span>J</span> Atake / Heal / Reload &nbsp;|&nbsp; <span>SPACE</span> Skill &nbsp;|&nbsp; <span>ESC / P</span> Pause`;
}, drawSpriteMatrix);

window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Space") e.preventDefault();
    Sound.init();

    if (gameState === "TITLE") {
        titleScene.handleInput(e);
    } else if (gameState === "SELECT") {
        selectScene.handleInput(e);
    } else if (gameState === "GAMEOVER" && e.code === "Enter") {
        Sound.playSelectConfirm();
        gameState = "SELECT";
    } else if (e.code === "Escape" || e.code === "KeyP") {
        if (gameState === "PLAYING") {
            gameState = "PAUSED";
            Sound.stopBGM();
        } else if (gameState === "PAUSED") {
            gameState = "PLAYING";
            Sound.startBGM();
        }
    } else if (gameState === "PAUSED" && e.code === "KeyM") {
        gameState = "TITLE";
        player = null;
        Sound.stopBGM();
        hudText.innerHTML = `<span>W / S o Arrows</span>: Navigate Menu &nbsp;|&nbsp; <span>ENTER / SPACE</span>: Select`;
    }
});

window.addEventListener("keyup", (e) => (keys[e.code] = false));

// RENDER GAMEPASS
function renderGameWorld() {
    const { offsetX, offsetY } = fx.getShakeOffsets();
    ctx.save();
    ctx.translate(Math.round(-camera.x + offsetX), Math.round(-camera.y + offsetY));

    stage.draw(ctx);
    lootManager.draw(ctx);
    enemyManager.draw(ctx, drawSpriteMatrix);
    projectileManager.draw(ctx);

    if (player) {
        player.draw(ctx);

        // Angels
        if (player.angels) {
            player.angels.forEach(angel => {
                if (!angel.isAlive) return;
                drawSpriteMatrix(ctx, angel.x, angel.y, angelIdle[angel.animFrame], angel.hitTimer > 0);
                const aBarW = 14;
                ctx.fillStyle = "#111";
                ctx.fillRect(angel.x + 5, angel.y - 4, aBarW, 2);
                ctx.fillStyle = "#ffd166";
                ctx.fillRect(angel.x + 5, angel.y - 4, Math.max(0, (angel.hp / angel.maxHp) * aBarW), 2);
                ctx.fillStyle = "#00f0ff";
                ctx.fillRect(angel.x + 5, angel.y - 2, Math.max(0, (angel.lifespan / angel.maxLifespan) * aBarW), 1);
            });
        }

        // Falcon
        if (player.falcon) {
            const f = player.falcon;
            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.fillStyle = "#6b4423";
            ctx.fillRect(-2, -2, 5, 4);
            ctx.fillStyle = "#ffd166";
            ctx.fillRect(player.facing === "right" ? 3 : -3, -1, 2, 2);
            ctx.fillStyle = "#4a2e18";
            if (f.wingTimer < 6) ctx.fillRect(-5, -5, 10, 2);
            else ctx.fillRect(-6, 0, 12, 2);
            ctx.restore();
        }

        // In-world UI (Overhead Cooldown Bar & Archer Ammo)
        ui.drawInWorldUI(ctx, player);
    }

    // FX: Damage numbers & Sparks
    fx.updateAndDraw(ctx);
    ctx.restore();

    // Screen HUD & Frame
    ui.drawHUD(ctx, player, enemyManager.enemies.length, canvas.width);
    fx.drawVignette(ctx, canvas.width, canvas.height);

    if (gameState === "GAMEOVER") ui.drawGameOver(ctx, canvas.width, canvas.height);
    if (gameState === "PAUSED") ui.drawPause(ctx, canvas.width, canvas.height);
}

// FIXED 60FPS TIME-STEP LOOP
let lastTime = performance.now();
const timeStep = 1000 / 60;
let accumulator = 0;

function gameLoop(currentTime) {
    const delta = currentTime - lastTime;
    lastTime = currentTime;
    accumulator += Math.min(delta, 100);

    while (accumulator >= timeStep) {
        if (gameState === "PLAYING") {
            gameEngine.update(player, keys, () => {
                gameState = "GAMEOVER";
                Sound.stopBGM();
            });
        }
        accumulator -= timeStep;
    }

    if (gameState === "TITLE") {
        titleScene.draw(ctx, canvas.width, canvas.height);
    } else if (gameState === "SELECT") {
        selectScene.draw(ctx, canvas.width, canvas.height);
    } else {
        renderGameWorld();
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame((time) => {
    lastTime = time;
    requestAnimationFrame(gameLoop);
});