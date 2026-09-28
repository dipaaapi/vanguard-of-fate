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
import { CreatorScene } from "./creator.js";
import { getNovice } from "./classes/novice.js";
import { startLore } from "./lore.js";
import { t, onLangChange } from "./i18n.js";

import { FalconCompanion } from "./summons/falcon.js";
import { GuardianAngelCompanion } from "./summons/angel.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ==================== DISPLAY / RESOLUTION ====================
// Logical size ng game (16:9). Lahat ng game code ay gumagamit nito.
const VIEW_W = 480;
const VIEW_H = 270;

// Kinukuha ang natitirang espasyo (ekstrang lore panel sa kanan at bar sa ibaba)
// tapos pinipili ang pinakamalaking INTEGER scale na kasya.
const stageEl = document.getElementById("stage");
const barEl = document.getElementById("bar");

function fitCanvas() {
  const availW = stageEl.clientWidth;
  const availH = window.innerHeight - barEl.offsetHeight;
  const raw = Math.min(availW / VIEW_W, availH / VIEW_H);
  const scale = Math.max(1, Math.floor(raw));

  canvas.width = VIEW_W * scale;
  canvas.height = VIEW_H * scale;
  canvas.style.width = canvas.width + "px";
  canvas.style.height = canvas.height + "px";
  barEl.style.width = canvas.width + "px";   // kapantay ng canvas ang menu

  // Nare-reset kapag binago ang canvas.width, kaya i-set ulit dito
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

// "title" | "select" | "play": pareho ang layout (screen + bottom bar + right panel),
// iba lang ang laman ng bar at panel bawat scene.
let layoutMode = "";
function setLayoutMode(mode) {
  if (mode === layoutMode) return;
  layoutMode = mode;
  document.body.dataset.mode = mode;

  refreshLabels();
  fitCanvas();
}

// Side panel title at control hints (sumusunod sa napiling wika)
function refreshLabels() {
  const head = document.getElementById("sideHead");
  if (head) head.textContent = layoutMode === "select" ? t("sideDossier") : t("sideLore");
  const selectHint = selectScene && selectScene.mode === "awakening" ? t("awakenHint") : t("selectHint");
  hudText.innerHTML = layoutMode === "select" ? selectHint : (layoutMode === "play" ? t("playHint") : "");
}
onLangChange(refreshLabels);

window.addEventListener("resize", fitCanvas);

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
const camera = new Camera(VIEW_W, VIEW_H, stage.width, stage.height);
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
    name: player.heroName || "",
    avatar: player.avatarConfig || null,   // itsura mula sa Character Creator
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
          alert(t("invalidSave"));
          return;
        }
        localStorage.setItem("vanguard_savegame", JSON.stringify(json));
        titleScene.refreshSaveStatus();
        loadGame();
      } catch (err) {
        alert(t("badSave"));
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

    const foundHero = data.heroId === "novice"
      ? getNovice(data.avatar, data.name)
      : ROSTER.find((h) => h.id === data.heroId) || ROSTER[0];
    player = new Player(data.x || stage.width / 2, data.y || stage.height / 2, foundHero);
    player.heroName = data.name || "";
    player.avatarConfig = data.avatar || null;

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

    applyDerivedStats(player);
    player.hp = Math.min(player.maxHp, data.hp || player.maxHp);

    if (foundHero.id === "archer") {
      player.falconCompanion = new FalconCompanion(player.x, player.y);
    }

    beginPlaying();
    return true;
  } catch (e) {
    return false;
  }
}

// Max HP = base ng class + bonus mula sa stat points + 12 bawat level (katulad ng addExp)
function applyDerivedStats(p) {
  p.maxHp = p.baseMaxHp + p.bonusHp + (p.level - 1) * 12;
  p.defense = p.bonusDefense;
  p.speed = p.baseSpeed + p.bonusSpeed;
}

// Karaniwang reset kapag papasok sa laro (bagong laro o load)
function beginPlaying() {
  controller.clearAll();
  gameState = "PLAYING";
  showShopModal = false;
  showMercModal = false;
  fx.reset();
  enemyManager.init(player.level);
  projectileManager.clear();
  lootManager.clear();
  Sound.stopTitleBGM();
  if (gameConfig.music) Sound.startGameplayBGM();
}

function backToTitle() {
  controller.clearAll();
  gameState = "TITLE";
  player = null;
  Sound.stopGameplayBGM();
  if (gameConfig.music) Sound.startTitleBGM();
  titleScene.refreshSaveStatus();
}

// ==================== JOB AWAKENING (Lv 10 na Novice, sa loob ng Barracks) ====================
const AWAKEN_LEVEL = 10;

function canAwaken(p) {
  return p && p.heroData.id === "novice" && p.level >= AWAKEN_LEVEL;
}

// Pinapalitan ang Novice ng napiling class; dala ang level, exp, gold, stats at pangalan
function awaken(chosenHero) {
  const old = player;
  const p = new Player(old.x, old.y, chosenHero);
  ["level", "exp", "expNext", "gold", "statPoints", "bonusHp", "bonusDamage",
    "bonusDefense", "bonusSpeed", "bonusCrit", "bonusCooldown", "heroName"].forEach((k) => { p[k] = old[k]; });
  applyDerivedStats(p);
  p.hp = p.maxHp;
  if (chosenHero.id === "archer") p.falconCompanion = new FalconCompanion(p.x, p.y);
  player = p;

  controller.clearAll();
  gameState = "PLAYING";
  if (fx.spawnHitSparks) fx.spawnHitSparks(p.x + 10, p.y + 10, "#ffd166", 28);
  if (Sound.playHolyBurst) Sound.playHolyBurst();
  if (gameConfig.music) Sound.startGameplayBGM();
  saveGame();
}

const titleScene = new TitleScene(
  () => {
    controller.clearAll();
    creatorScene.reset();
    gameState = "CREATE";
  },
  () => {
    controller.clearAll();
    if (!loadGame()) {
      creatorScene.reset();
      gameState = "CREATE";
    }
  },
  exportSaveFile,
  importSaveFile,
  gameConfig,
  document.getElementById("title")
);

// Bagong expedition: Character Creator → Novice sa Barracks
const creatorScene = new CreatorScene(
  document.getElementById("creator"),
  (config, name) => {
    player = new Player(stage.width / 2, stage.height / 2, getNovice(config, name));
    player.heroName = name;
    player.avatarConfig = player.heroData.avatarConfig;
    titleScene.flash();
    beginPlaying();
    saveGame();
  },
  () => {
    controller.clearAll();
    gameState = "TITLE";
  }
);

// Ang hero select ay para na lang sa Job Awakening
const selectScene = new SelectScene(ROSTER, (chosenHero) => {
  if (canAwaken(player)) awaken(chosenHero);
}, drawSpriteMatrix, {
  picker: document.getElementById("picker"),
  dossier: document.getElementById("dossier")
});

setLayoutMode("title");
startLore(document.getElementById("lore"));

canvas.addEventListener("pointerdown", (e) => {
  Sound.init();

  if (gameState === "PLAYING" || gameState === "PAUSED") {
    const rect = canvas.getBoundingClientRect();
    const scaleX = VIEW_W / rect.width;
    const scaleY = VIEW_H / rect.height;
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
  if (e.code === "F2") { stage.tilemap.debug = !stage.tilemap.debug; e.preventDefault(); }

  if (gameState === "TITLE") {
    titleScene.handleInput(e);
  } else if (gameState === "CREATE") {
    creatorScene.handleInput(e);
  } else if (gameState === "SELECT") {
    selectScene.handleInput(e);
  } else if (gameState === "GAMEOVER" && e.code === "Enter") {
    Sound.playSelectConfirm();
    backToTitle();
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

  // Lv 10 na Novice na pumasok sa Barracks → Job Awakening
  if (canAwaken(player) && isInBarracks) {
    controller.clearAll();
    selectScene.setMode("awakening");
    gameState = "SELECT";
    Sound.stopGameplayBGM();
    if (Sound.playHolyBurst) Sound.playHolyBurst();
    return;
  }

  stage.update(player, (portal) => {
    if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();
    if (fx && fx.spawnHitSparks) fx.spawnHitSparks(player.x + 10, player.y + 10, portal.color, 16);
  });

  if (stage.castle) {
    stage.castle.resolveCollision(player);
  }
  stage.resolveTileCollision(player);

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
  enemyManager.enemies.forEach((enemy) => {
    if (enemy.isAlive) stage.resolveTileCollision(enemy);
  });

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

  stage.drawOverlay(ctx);   // canopy ng mga puno, nasa ibabaw ng mga karakter
  fx.updateAndDraw(ctx, gameConfig);
  ctx.restore();

  const isInBarracks = player ? stage.isInsideSafeZone(player.x, player.y) : false;
  ui.drawHUD(
    ctx, player, enemyManager, lootManager, stage,
    VIEW_W, gameState === "PAUSED",
    fx.timeOfDay, fx.weatherType, isInBarracks
  );

  // Paalala: handa na ang Job Awakening
  if (canAwaken(player) && gameState === "PLAYING") {
    const pulse = 0.75 + Math.sin(performance.now() / 260) * 0.25;
    ctx.fillStyle = "rgba(3, 6, 17, 0.75)";
    ctx.fillRect(VIEW_W / 2 - 150, 40, 300, 14);
    ctx.fillStyle = `rgba(255, 209, 102, ${pulse})`;
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "center";
    ctx.fillText(t("awakenReady"), VIEW_W / 2, 50);
  }

  if (showShopModal && player) {
    ui.drawShopModal(ctx, player, VIEW_W, VIEW_H);
  }

  if (showMercModal && player) {
    ctx.fillStyle = "rgba(10, 14, 20, 0.85)";
    ctx.fillRect(40, 40, VIEW_W - 80, VIEW_H - 80);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, VIEW_W - 80, VIEW_H - 80);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("⚔️ BARRACKS MERCENARY GUILD (10G EACH - 10 MINS) ⚔️", VIEW_W / 2, 60);

    ctx.fillStyle = "#ffffff";
    ctx.font = "7px monospace";
    ctx.fillText("[1] AXEMAN (Whirlwind AOE) - 10G", VIEW_W / 2, 85);
    ctx.fillText("[2] MAGE APPRENTICE (Arcane Blast) - 10G", VIEW_W / 2, 105);
    ctx.fillText("[3] CROSSBOWMAN (3-Way Volley) - 10G", VIEW_W / 2, 125);
    ctx.fillText("[4] VANGUARD KNIGHT (Earthshatter Slam) - 10G", VIEW_W / 2, 145);
    ctx.fillText("Press 1-4 to Hire | ESC to Close", VIEW_W / 2, 175);
  }

  if (gameState === "PAUSED" && !showShopModal && !showMercModal) {
    ui.drawPause(ctx, VIEW_W, VIEW_H);
    // Shortcut hint para sa Export
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillText("[ X ]   EXPORT SAVE FILE (.JSON)", VIEW_W / 2, VIEW_H / 2 + 32);
  }

  if (gameState === "GAMEOVER") {
    ui.drawGameOver(ctx, VIEW_W, VIEW_H);
  }
}

function gameLoop() {
  updateGame();
  const MODES = { TITLE: "title", SELECT: "select", CREATE: "create" };
  setLayoutMode(MODES[gameState] || "play");
  if (gameState === "TITLE") {
    titleScene.draw();
  } else if (gameState === "CREATE") {
    creatorScene.draw();
  } else if (gameState === "SELECT") {
    selectScene.draw(ctx, VIEW_W, VIEW_H);
  } else {
    renderGameWorld();
  }
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);