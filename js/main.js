import { KnightClass } from "./classes/knight.js";
import { MageClass } from "./classes/mage.js";
import { PriestClass } from "./classes/priest.js";
import { ArcherClass } from "./classes/archer.js";
import { FighterClass } from "./classes/fighter.js";
import { Player } from "./player.js";
import { InputController } from "./controller.js";
import { Camera } from "./camera.js";
import { FXManager } from "./fx.js";
import { EnemyManager } from "./enemy.js";
import { ProjectileManager } from "./projectiles.js";
import { UIManager } from "./ui.js";
import { LootManager } from "./loot.js";
import { MercenaryManager } from "./mercenaryManager.js";
import { Sound } from "./audio.js";
import { Stage } from "./stage.js";
import { TitleScene } from "./title.js";
import { SelectScene } from "./select.js";

import { FalconCompanion } from "./summons/falcon.js";
import { GuardianAngelCompanion } from "./summons/angel.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const hudText = document.getElementById("hudText");
const fileInput = document.getElementById("saveFileInput");
const ROSTER = [KnightClass, MageClass, PriestClass, ArcherClass, FighterClass];

const gameConfig = {
  music: true,
  sfx: true,
  blood: true,
  weather: true
};

const stage = new Stage(1280, 960);
const camera = new Camera(canvas.width, canvas.height, stage.width, stage.height);
const fx = new FXManager();
const enemyManager = new EnemyManager(stage.width, stage.height);
const projectileManager = new ProjectileManager(stage.width, stage.height);
const ui = new UIManager();
const lootManager = new LootManager();
const mercManager = new MercenaryManager();
const controller = new InputController();

function drawSpriteMatrix(targetCtx, x, y, spriteGrid, flashWhite = false) {
  if (!spriteGrid) return;
  const numRows = spriteGrid.length;
  for (let r = 0; r < numRows; r++) {
    const row = spriteGrid[r];
    const numCols = row.length;
    for (let c = 0; c < numCols; c++) {
      const color = row[c];
      if (color && color !== 0) {
        targetCtx.fillStyle = flashWhite ? "#ffffff" : color;
        targetCtx.fillRect(Math.floor(x) + c, Math.floor(y) + r, 1, 1);
      }
    }
  }
}

let gameState = "TITLE";
let player = null;
let showShopModal = false;
let showMercModal = false;

// ========================================================
// EXPORT & IMPORT SAVE SYSTEM (.JSON FILE & LOCALSTORAGE)
// ========================================================
function getSavePayload() {
  if (!player || player.hp <= 0) return null;
  return {
    game: "Vanguard of Fate",
    version: "1.0.0",
    savedAt: new Date().toISOString(),
    heroId: player.heroData.id,
    level: player.level,
    exp: player.exp,
    expNext: player.expNext,
    gold: player.gold,
    statPoints: player.statPoints,
    bonusHp: player.bonusHp,
    bonusDamage: player.bonusDamage,
    bonusDefense: player.bonusDefense,
    bonusSpeed: player.bonusSpeed,
    bonusCrit: player.bonusCrit,
    bonusCooldown: player.bonusCooldown,
    hp: player.hp,
    x: player.x,
    y: player.y
  };
}

function saveGame() {
  const data = getSavePayload();
  if (!data) return;
  try {
    localStorage.setItem("vanguard_savegame", JSON.stringify(data));
    titleScene.refreshSaveStatus();
  } catch (e) {}
}

// 1. Export as .json File Download
function exportSaveFile() {
  let raw = localStorage.getItem("vanguard_savegame");
  if (!raw && player) {
    saveGame();
    raw = localStorage.getItem("vanguard_savegame");
  }
  if (!raw) return;

  const blob = new Blob([raw], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vanguard_savegame_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 2. Import via .json File Dialog
function importSaveFile() {
  if (!fileInput) return;
  fileInput.value = "";
  fileInput.click();
}

if (fileInput) {
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!json.heroId || !json.level) {
          alert("Invalid Save File format!");
          return;
        }
        localStorage.setItem("vanguard_savegame", JSON.stringify(json));
        titleScene.refreshSaveStatus();
        loadGame();
      } catch (err) {
        alert("Failed to parse .json save file!");
      }
    };
    reader.readAsText(file);
  });
}

function loadGame() {
  try {
    const raw = localStorage.getItem("vanguard_savegame");
    if (!raw) return false;
    const data = JSON.parse(raw);

    const foundHero = ROSTER.find((h) => h.id === data.heroId) || ROSTER[0];
    player = new Player(data.x || stage.width / 2, data.y || stage.height / 2, foundHero);

    player.level = data.level || 1;
    player.exp = data.exp || 0;
    player.expNext = data.expNext || 60;
    player.gold = data.gold || 150;
    player.statPoints = data.statPoints || 0;
    player.bonusHp = data.bonusHp || 0;
    player.bonusDamage = data.bonusDamage || 0;
    player.bonusDefense = data.bonusDefense || 0;
    player.bonusSpeed = data.bonusSpeed || 0;
    player.bonusCrit = data.bonusCrit || 0;
    player.bonusCooldown = data.bonusCooldown || 0;

    player.maxHp = player.baseMaxHp + player.bonusHp;
    player.hp = Math.min(player.maxHp, data.hp || player.maxHp);
    player.defense = player.bonusDefense;
    player.speed = player.baseSpeed + player.bonusSpeed;

    if (foundHero.id === "archer") {
      player.falconCompanion = new FalconCompanion(player.x, player.y);
    }

    gameState = "PLAYING";
    showShopModal = false;
    showMercModal = false;
    fx.reset();
    enemyManager.init(player.level);
    projectileManager.clear();
    lootManager.clear();

    Sound.stopTitleBGM();
    if (gameConfig.music) Sound.startGameplayBGM();

    hudText.innerHTML = `<span>WASD</span> Lakad &nbsp;|&nbsp; <span>SPACE</span> Sprint &nbsp;|&nbsp; <span>J</span> Atake &nbsp;|&nbsp; <span>K</span> Skill &nbsp;|&nbsp; <span>E</span> Shop &nbsp;|&nbsp; <span>M</span> Hire Merc (10G) &nbsp;|&nbsp; <span>P</span> Pause`;
    return true;
  } catch (e) {
    return false;
  }
}

const titleScene = new TitleScene(
  () => {
    controller.clearAll();
    gameState = "SELECT";
  },
  () => {
    controller.clearAll();
    if (!loadGame()) gameState = "SELECT";
  },
  exportSaveFile,
  importSaveFile,
  gameConfig
);

const selectScene = new SelectScene(ROSTER, (chosenHero) => {
  controller.clearAll();
  player = new Player(stage.width / 2, stage.height / 2, chosenHero);

  if (chosenHero.id === "archer") {
    player.falconCompanion = new FalconCompanion(player.x, player.y);
  }

  gameState = "PLAYING";
  showShopModal = false;
  showMercModal = false;
  fx.reset();
  enemyManager.init(player.level);
  projectileManager.clear();
  lootManager.clear();

  saveGame();

  hudText.innerHTML = `<span>WASD</span> Lakad &nbsp;|&nbsp; <span>SPACE</span> Sprint &nbsp;|&nbsp; <span>J</span> Atake &nbsp;|&nbsp; <span>K</span> Skill &nbsp;|&nbsp; <span>E</span> Shop &nbsp;|&nbsp; <span>M</span> Hire Merc (10G) &nbsp;|&nbsp; <span>P</span> Pause`;
}, drawSpriteMatrix);

canvas.addEventListener("pointerdown", (e) => {
  Sound.init();

  if (gameState === "PLAYING" || gameState === "PAUSED") {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const pb = ui.buttons.pause;
    if (clickX >= pb.x && clickX <= pb.x + pb.w && clickY >= pb.y && clickY <= pb.y + pb.h) {
      if (gameState === "PLAYING") {
        gameState = "PAUSED";
        saveGame();
        Sound.stopGameplayBGM();
      } else {
        gameState = "PLAYING";
        if (gameConfig.music) Sound.startGameplayBGM();
      }
    }
  }
});

window.addEventListener("keydown", (e) => {
  Sound.init();

  if (gameState === "TITLE") {
    titleScene.handleInput(e);
  } else if (gameState === "SELECT") {
    selectScene.handleInput(e);
  } else if (gameState === "GAMEOVER" && e.code === "Enter") {
    Sound.playSelectConfirm();
    controller.clearAll();
    gameState = "SELECT";
  } else if (gameState === "PLAYING" || gameState === "PAUSED") {
    // Export save shortcut (Key X habang paused)
    if (e.code === "KeyX" && gameState === "PAUSED") {
      saveGame();
      exportSaveFile();
      return;
    }

    if (e.code === "KeyE") {
      if (showShopModal) {
        showShopModal = false;
      } else if (stage.isNearNPC(player.x, player.y)) {
        showShopModal = true;
        showMercModal = false;
      }
      return;
    }

    if (e.code === "KeyM" && gameState === "PLAYING") {
      if (stage.isNearMercenaryNPC(player.x, player.y)) {
        showMercModal = !showMercModal;
        showShopModal = false;
        return;
      }
    }

    if (e.code === "KeyM" && gameState === "PAUSED") {
      saveGame();
      controller.clearAll();
      gameState = "TITLE";
      player = null;
      Sound.stopGameplayBGM();
      if (gameConfig.music) Sound.startTitleBGM();
      titleScene.refreshSaveStatus();
      hudText.innerHTML = `<span>W / S o Arrows</span>: Navigate Menu &nbsp;|&nbsp; <span>ENTER / SPACE</span>: Select`;
      return;
    }

    if (showMercModal) {
      const typeMap = { Digit1: "axe", Digit2: "wand", Digit3: "crossbow", Digit4: "greatsword" };
      if (typeMap[e.code]) {
        mercManager.hire(typeMap[e.code], player, fx);
        showMercModal = false;
        return;
      }
    }

    if (showShopModal) {
      const shopMap = { Digit1: "1", Digit2: "2", Digit3: "3", Digit4: "4" };
      if (shopMap[e.code]) {
        ui.buyShopItem(shopMap[e.code], player, fx);
        return;
      }
    }

    if (e.code === "KeyK" && player.heroData.id === "priest" && !stage.isInsideSafeZone(player.x, player.y)) {
      if (!player.angelCompanions) player.angelCompanions = [];
      player.angelCompanions = player.angelCompanions.filter(a => a.isAlive);
      if (player.angelCompanions.length < 2 && player.skillCooldownTimer <= 0) {
        const angelHp = Math.round(player.maxHp * 0.5);
        player.angelCompanions.push(new GuardianAngelCompanion(player.x + (player.angelCompanions.length === 0 ? -30 : 30), player.y - 16, angelHp));
        player.skillCooldownTimer = 180;
        if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();
      }
    }

    if (e.code === "KeyK" && player.heroData.id === "archer" && player.falconCompanion && player.skillCooldownTimer <= 0 && !stage.isInsideSafeZone(player.x, player.y)) {
      const closestEnemy = enemyManager.enemies
        .filter((en) => en.isAlive)
        .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0] || null;

      player.falconCompanion.triggerStrike(
        closestEnemy,
        closestEnemy ? closestEnemy.x : player.x + (player.facing === "right" ? 140 : -140),
        closestEnemy ? closestEnemy.y : player.y
      );
      player.skillCooldownTimer = 220;
    }

    if (e.code === "Escape" || e.code === "KeyP") {
      if (showShopModal) { showShopModal = false; return; }
      if (showMercModal) { showMercModal = false; return; }

      if (gameState === "PLAYING") {
        gameState = "PAUSED";
        saveGame();
        Sound.stopGameplayBGM();
      } else if (gameState === "PAUSED") {
        gameState = "PLAYING";
        if (gameConfig.music) Sound.startGameplayBGM();
      }
      return;
    }
  }
});

function updateGame() {
  if (gameState !== "PLAYING" || !player || showShopModal || showMercModal) return;

  if (player.hp <= 0) {
    gameState = "GAMEOVER";
    Sound.stopGameplayBGM();
    return;
  }

  const isInBarracks = stage.isInsideSafeZone(player.x, player.y);

  stage.update(player, (portal) => {
    if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(player.x + 10, player.y + 10, portal.color, 16);
  });

  if (stage.castle) {
    stage.castle.resolveCollision(player);
  }

  const closestEnemy = enemyManager.enemies
    .filter((e) => e.isAlive)
    .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0] || null;

  player.update(
    controller,
    stage.bounds,
    (proj) => projectileManager.add(proj),
    closestEnemy,
    isInBarracks,
    fx
  );

  if (player.falconCompanion) {
    player.falconCompanion.update(player, enemyManager, fx, lootManager);
  }

  if (player.angelCompanions && player.angelCompanions.length > 0) {
    player.angelCompanions.forEach((angel, idx) => {
      angel.update(player, enemyManager, fx, lootManager, idx, isInBarracks);
    });
    player.angelCompanions = player.angelCompanions.filter(a => a.isAlive);
  }

  camera.update(player.x, player.y);

  enemyManager.update(player, fx, lootManager, stage);
  if (stage.castle) {
    enemyManager.enemies.forEach((enemy) => {
      if (enemy.isAlive) stage.castle.resolveCollision(enemy);
    });
  }

  mercManager.update(player, enemyManager, lootManager, fx, (proj) => projectileManager.add(proj), stage);
  projectileManager.update(enemyManager.enemies, enemyManager, fx, lootManager, player);
  lootManager.update(player, fx);
}

function renderGameWorld() {
  const { offsetX, offsetY } = fx.getShakeOffsets();
  ctx.save();
  ctx.translate(Math.round(-camera.x + offsetX), Math.round(-camera.y + offsetY));

  stage.draw(ctx, drawSpriteMatrix);
  lootManager.draw(ctx);
  mercManager.draw(ctx, drawSpriteMatrix);
  enemyManager.draw(ctx, drawSpriteMatrix);
  projectileManager.draw(ctx);

  if (player && player.hp > 0) {
    player.draw(ctx);

    if (player.falconCompanion) {
      player.falconCompanion.draw(ctx, player.facing === "right");
    }

    if (player.angelCompanions) {
      player.angelCompanions.forEach((angel) => {
        angel.draw(ctx);
      });
    }

    ui.drawInWorldUI(ctx, player);
  }

  fx.updateAndDraw(ctx, gameConfig);
  ctx.restore();

  const isInBarracks = player ? stage.isInsideSafeZone(player.x, player.y) : false;
  ui.drawHUD(
    ctx, player, enemyManager, lootManager, stage,
    canvas.width, gameState === "PAUSED",
    fx.timeOfDay, fx.weatherType, isInBarracks
  );

  if (showShopModal && player) {
    ui.drawShopModal(ctx, player, canvas.width, canvas.height);
  }

  if (showMercModal && player) {
    ctx.fillStyle = "rgba(10, 14, 20, 0.85)";
    ctx.fillRect(40, 40, canvas.width - 80, canvas.height - 80);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("⚔️ BARRACKS MERCENARY GUILD (10G EACH - 10 MINS) ⚔️", canvas.width / 2, 60);

    ctx.fillStyle = "#ffffff";
    ctx.font = "7px monospace";
    ctx.fillText("[1] AXEMAN (Whirlwind AOE) - 10G", canvas.width / 2, 85);
    ctx.fillText("[2] MAGE APPRENTICE (Arcane Blast) - 10G", canvas.width / 2, 105);
    ctx.fillText("[3] CROSSBOWMAN (3-Way Volley) - 10G", canvas.width / 2, 125);
    ctx.fillText("[4] VANGUARD KNIGHT (Earthshatter Slam) - 10G", canvas.width / 2, 145);
    ctx.fillText("Press 1-4 to Hire | ESC to Close", canvas.width / 2, 175);
  }

  if (gameState === "PAUSED" && !showShopModal && !showMercModal) {
    ui.drawPause(ctx, canvas.width, canvas.height);
    // Shortcut hint para sa Export
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillText("[ X ]   EXPORT SAVE FILE (.JSON)", canvas.width / 2, canvas.height / 2 + 32);
  }

  if (gameState === "GAMEOVER") {
    ui.drawGameOver(ctx, canvas.width, canvas.height);
  }
}

function gameLoop() {
  updateGame();
  if (gameState === "TITLE") {
    titleScene.draw(ctx, canvas.width, canvas.height);
  } else if (gameState === "SELECT") {
    selectScene.draw(ctx, canvas.width, canvas.height);
  } else {
    renderGameWorld();
  }
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);