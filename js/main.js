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
import { StoryScene } from "./storyScene.js";
import { FalconCompanion } from "./summons/falcon.js";
import { SaveSystem } from "./saveSystem.js";
import { QuestManager } from "./quest.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// High-DPI Retina Supersampling
const VIRTUAL_W = 426;
const VIRTUAL_H = 240;
const DPR = Math.min(3, Math.max(2, window.devicePixelRatio || 2));
canvas.width = Math.round(VIRTUAL_W * DPR);
canvas.height = Math.round(VIRTUAL_H * DPR);
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
const camera = new Camera(VIRTUAL_W, VIRTUAL_H, stage.width, stage.height);
const fx = new FXManager();
const enemyManager = new EnemyManager(stage.width, stage.height);
const projectileManager = new ProjectileManager(stage.width, stage.height);
const ui = new UIManager();
const lootManager = new LootManager();
const mercManager = new MercenaryManager();
const controller = new InputController();
const questManager = new QuestManager();

let gameState = "TITLE"; // TITLE, SELECT, STORY, PLAYING, PAUSED, GAMEOVER
let player = null;
let showShopModal = false;
let showMercModal = false;
let showQuestModal = false;
let showExportModal = false;
let showInventoryModal = false;
let showLoreModal = false;
let showGuardModal = false;
let exportFilename = "vanguard_save.json";
let pendingHero = null;
let pendingPlayerName = "VANGUARD";
const VALID_HERO_IDS = ROSTER.map((h) => h.id);
const HUD_PLAYING_HINT = `<span>WASD/Arrows</span> Move &nbsp;|&nbsp; <span>L-Click/J</span> Attack &nbsp;|&nbsp; <span>SPACE</span> Dash &nbsp;|&nbsp; <span>SHIFT</span> Sprint &nbsp;|&nbsp; <span>1/2/3</span> Skills &nbsp;|&nbsp; <span>E/Click</span> Talk &nbsp;|&nbsp; <span>I</span> Gear &nbsp;|&nbsp; <span>Q</span> Quests &nbsp;|&nbsp; <span>L</span> Lore &nbsp;|&nbsp; <span>P</span> Pause`;

// ========================================================
// SAVE & LOAD MANAGEMENT
// ========================================================
function saveGame() {
  if (!player || player.hp <= 0) return;
  const success = SaveSystem.saveToStorage(player, questManager);
  if (success && titleScene) {
    titleScene.refreshSaveStatus();
  }
}

function openExportModal() {
  if (player && player.hp > 0) {
    saveGame();
    exportFilename = `vanguard_save_${(player.playerName || "hero").toLowerCase()}_lv${player.level}.json`;
  } else {
    exportFilename = `vanguard_save_${Date.now()}.json`;
  }
  showExportModal = true;
}

function exportSaveFile() {
  openExportModal();
}

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
      const result = SaveSystem.processImportedJson(
        event.target.result,
        VALID_HERO_IDS,
        { width: stage.width, height: stage.height }
      );

      if (!result.success) {
        alert("Save Import Notice: " + (result.error || "Failed to load save file!"));
        return;
      }

      titleScene.refreshSaveStatus();
      loadGame();
    };
    reader.readAsText(file);
  });
}

function loadGame() {
  try {
    const data = SaveSystem.loadFromStorage(VALID_HERO_IDS, {
      width: stage.width,
      height: stage.height
    });
    if (!data) return false;

    const foundHero = ROSTER.find((h) => h.id === data.heroId) || ROSTER[0];
    player = new Player(data.x, data.y, foundHero, data.playerName);

    player.level = data.level;
    player.exp = data.exp;
    player.expNext = data.expNext;
    player.gold = data.gold;
    player.statPoints = data.statPoints;
    player.upgradeStones = data.upgradeStones || 0;
    player.bonusHp = data.bonusHp;
    player.bonusDamage = data.bonusDamage;
    player.bonusDefense = data.bonusDefense;
    player.bonusSpeed = data.bonusSpeed;
    player.bonusCrit = data.bonusCrit;
    player.bonusCooldown = data.bonusCooldown;

    if (data.equipment) player.equipment = data.equipment;
    if (data.inventory) player.inventory = data.inventory;

    player.recalculateStats();
    player.hp = Math.min(player.maxHp, data.hp);

    // Restore Quests
    if (data.quests) {
      questManager.currentArcIndex = data.quests.currentArcIndex || 0;
      questManager.currentQuestIndex = data.quests.currentQuestIndex || 0;
      questManager.completedQuestIds = new Set(data.quests.completedQuestIds || []);
      questManager.questInventory = data.quests.questInventory || {};
    }

    if (foundHero.id === "archer" && !player.falconCompanion) {
      player.falconCompanion = new FalconCompanion(player.x, player.y);
    }

    gameState = "PLAYING";
    showShopModal = false;
    showMercModal = false;
    showQuestModal = false;
    fx.damagePopups = [];
    fx.hitParticles = [];
    enemyManager.init(player.level);
    projectileManager.clear();
    lootManager.clear();

    Sound.stopAllBGM();
    if (gameConfig.music) Sound.startGameplayBGM();

    hudText.innerHTML = HUD_PLAYING_HINT;
    return true;
  } catch (e) {
    console.error("[Game] Failed to load game state:", e);
    return false;
  }
}

// ========================================================
// SCENE INITIALIZATION & TRANSITION FLOW
// ========================================================
function startGameplay(hero, chosenName) {
  controller.clearAll();
  player = new Player(stage.width / 2, stage.height / 2, hero, chosenName);

  if (hero.id === "archer" && !player.falconCompanion) {
    player.falconCompanion = new FalconCompanion(player.x, player.y);
  }

  // Reset quest progress for fresh run
  questManager.currentArcIndex = 0;
  questManager.currentQuestIndex = 0;
  questManager.completedQuestIds = new Set();
  questManager.questInventory = {};

  gameState = "PLAYING";
  showShopModal = false;
  showMercModal = false;
  showQuestModal = false;
  fx.damagePopups = [];
  fx.hitParticles = [];
  enemyManager.init(player.level);
  projectileManager.clear();
  lootManager.clear();

  saveGame();
  Sound.stopAllBGM();
  if (gameConfig.music) Sound.startGameplayBGM();
  hudText.innerHTML = HUD_PLAYING_HINT;
}

const titleScene = new TitleScene(
  () => {
    controller.clearAll();
    gameState = "SELECT";
    Sound.stopAllBGM();
    if (gameConfig.music) Sound.startCharacterCreationBGM();
  },
  () => {
    controller.clearAll();
    if (!loadGame()) {
      gameState = "SELECT";
      Sound.stopAllBGM();
      if (gameConfig.music) Sound.startCharacterCreationBGM();
    }
  },
  exportSaveFile,
  importSaveFile,
  gameConfig
);

const storyScene = new StoryScene(
  () => {
    if (pendingHero) {
      startGameplay(pendingHero, pendingPlayerName);
    }
  },
  () => {
    gameState = "SELECT";
    Sound.stopAllBGM();
    if (gameConfig.music) Sound.startCharacterCreationBGM();
  },
  () => {
    gameState = "TITLE";
    Sound.stopAllBGM();
    if (gameConfig.music) Sound.startTitleBGM();
  }
);

const selectScene = new SelectScene(
  ROSTER,
  (chosenHero, chosenName, lore) => {
    pendingHero = chosenHero;
    pendingPlayerName = chosenName;
    gameState = "STORY";
    storyScene.setHero(chosenHero, chosenName, lore);
  },
  () => {
    gameState = "TITLE";
    Sound.stopAllBGM();
    if (gameConfig.music) Sound.startTitleBGM();
  }
);

// ========================================================
// INPUT & MOUSE INTERACTION HANDLING
// ========================================================
canvas.addEventListener("pointermove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = VIRTUAL_W / rect.width;
  const scaleY = VIRTUAL_H / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;

  if (gameState === "SELECT") {
    selectScene.handlePointerMove(mouseX, mouseY);
  } else if (gameState === "STORY") {
    storyScene.handlePointerMove(mouseX, mouseY);
  }
});

canvas.addEventListener("pointerdown", (e) => {
  Sound.init();

  const rect = canvas.getBoundingClientRect();
  const scaleX = VIRTUAL_W / rect.width;
  const scaleY = VIRTUAL_H / rect.height;
  const clickX = (e.clientX - rect.left) * scaleX;
  const clickY = (e.clientY - rect.top) * scaleY;

  if (gameState === "TITLE") {
    titleScene.handlePointerDown(clickX, clickY);
    return;
  } else if (gameState === "SELECT") {
    selectScene.handlePointerDown(clickX, clickY);
    return;
  } else if (gameState === "STORY") {
    storyScene.handlePointerDown(clickX, clickY);
    return;
  }

  // Handle Inventory Modal clicks
  if (showInventoryModal && player) {
    const res = ui.handleInventoryModalClick(clickX, clickY, player, fx, VIRTUAL_W, VIRTUAL_H);
    if (res.close) showInventoryModal = false;
    return;
  }

  // Handle Export Save Modal
  if (showExportModal) {
    const boxW = 260;
    const boxH = 130;
    const boxX = Math.round(canvas.width / 2 - boxW / 2);
    const boxY = Math.round(canvas.height / 2 - boxH / 2);

    const btnAcceptX = boxX + 18;
    const btnCancelX = boxX + 137;
    const btnY = boxY + 88;
    const btnW = 105;
    const btnH = 24;

    if (clickX >= btnAcceptX && clickX <= btnAcceptX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
      if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
      SaveSystem.exportSaveFile(player, questManager, exportFilename);
      showExportModal = false;
      return;
    }
    if (clickX >= btnCancelX && clickX <= btnCancelX + btnW && clickY >= btnY && clickY <= btnY + btnH) {
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      showExportModal = false;
      return;
    }
    return;
  }

  // Handle Shop Modal clicks
  if (showShopModal) {
    const res = ui.handleShopModalClick(clickX, clickY, player, fx, VIRTUAL_W, VIRTUAL_H);
    if (res.close) showShopModal = false;
    return;
  }

  // Handle Mercenary Modal clicks
  if (showMercModal) {
    const res = ui.handleMercenaryModalClick(clickX, clickY, player, fx, mercManager, VIRTUAL_W, VIRTUAL_H);
    if (res.close) showMercModal = false;
    return;
  }

  // Handle Quest Log Modal clicks
  if (showQuestModal) {
    const res = ui.handleQuestLogModalClick(clickX, clickY, questManager, player, fx, VIRTUAL_W, VIRTUAL_H);
    if (res.close) showQuestModal = false;
    return;
  }

  // Handle Pause Menu clicks
  if (gameState === "PAUSED") {
    const pauseAction = ui.handlePauseModalClick(clickX, clickY, VIRTUAL_W, VIRTUAL_H);
    if (pauseAction === "RESUME") {
      gameState = "PLAYING";
      if (gameConfig.music) Sound.startGameplayBGM();
      return;
    } else if (pauseAction === "EXPORT") {
      openExportModal();
      return;
    } else if (pauseAction === "TITLE") {
      saveGame();
      controller.clearAll();
      gameState = "TITLE";
      player = null;
      Sound.stopGameplayBGM();
      if (gameConfig.music) Sound.startTitleBGM();
      titleScene.refreshSaveStatus();
      return;
    }
  }

  if (gameState === "PLAYING" || gameState === "PAUSED") {
    
    // Lore Button [📜] in HUD
    const lb = ui.buttons.lore;
    if (clickX >= lb.x && clickX <= lb.x + lb.w && clickY >= lb.y && clickY <= lb.y + lb.h) {
      showLoreModal = !showLoreModal;
      showInventoryModal = false;
      showQuestModal = false;
      showShopModal = false;
      showMercModal = false;
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      return;
    }
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
      return;
    }

    // 1. Character Profile Card Click (Opens Inventory & Attributes)
    if (clickX >= 6 && clickX <= 134 && clickY >= 6 && clickY <= 62) {
      showInventoryModal = !showInventoryModal;
      showShopModal = false;
      showMercModal = false;
      showQuestModal = false;
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      return;
    }

    // 2. Quest Tracker Box Click (Supports 1-click claim & modal toggle)
    const qBoxW = 102;
    const qBoxH = 34;
    const qBoxX = VIRTUAL_W - qBoxW - 8;
    const qBoxY = 48;
    if (clickX >= qBoxX && clickX <= qBoxX + qBoxW && clickY >= qBoxY && clickY <= qBoxY + qBoxH) {
      const curQ = questManager ? questManager.getCurrentQuest() : null;
      if (curQ && curQ.progress >= curQ.maxProgress) {
        questManager.completeCurrentQuest(player, fx);
        saveGame();
      } else {
        showQuestModal = !showQuestModal;
        showShopModal = false;
        showMercModal = false;
        showInventoryModal = false;
        showGuardModal = false;
        if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      }
      return;
    }

    // World Click Interactivity (NPCs & Attack Target)
    if (gameState === "PLAYING" && player && !showShopModal && !showMercModal && !showQuestModal) {
      const worldClickX = clickX + camera.x;
      const worldClickY = clickY + camera.y;

      const isInBarracks = stage.isInsideSafeZone(player.x, player.y);
      if (isInBarracks) {
        
        // Check Castle Guard Captain Valerie click
        const distGuard = Math.hypot(worldClickX - stage.castleGuard.x, worldClickY - stage.castleGuard.y);
        if (distGuard < 38 && stage.isNearCastleGuard(player.x, player.y)) {
          showGuardModal = true;
          showShopModal = false;
          showMercModal = false;
          showQuestModal = false;
          showLoreModal = false;
          showInventoryModal = false;
          if (Sound && Sound.playGuardTalk) Sound.playGuardTalk();
          questManager.onNpcTalk("valerie", player, fx);
          return;
        }
        // Check Shopkeeper Edgar click
        const distEdgar = Math.hypot(worldClickX - stage.shopkeeper.x, worldClickY - stage.shopkeeper.y);
        if (distEdgar < 32 && stage.isNearNPC(player.x, player.y)) {
          showShopModal = true;
          showMercModal = false;
          showQuestModal = false;
          questManager.onNpcTalk("edgar", player, fx);
          return;
        }

        // Check Recruiter Cedric click
        const distCedric = Math.hypot(worldClickX - stage.mercCaptain.x, worldClickY - stage.mercCaptain.y);
        if (distCedric < 32 && stage.isNearMercenaryNPC(player.x, player.y)) {
          showMercModal = true;
          showShopModal = false;
          showQuestModal = false;
          questManager.onNpcTalk("cedric", player, fx);
          return;
        }
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
  } else if (gameState === "STORY") {
    storyScene.handleInput(e);
  } else if (gameState === "GAMEOVER" && e.code === "Enter") {
    Sound.playSelectConfirm();
    controller.clearAll();
    gameState = "SELECT";
    Sound.stopAllBGM();
    if (gameConfig.music) Sound.startCharacterCreationBGM();
  } else if (showGuardModal) { showGuardModal = false; return; }
    if (showLoreModal) {
    if (e.code === "Escape" || e.code === "KeyL") {
      showLoreModal = false;
      return;
    }
    if (e.code === "Digit1") { ui.loreTab = "HEROES"; return; }
    if (e.code === "Digit2") { ui.loreTab = "ARCS"; return; }
    if (e.code === "ArrowLeft") {
      if (ui.loreTab === "ARCS") ui.loreArcIdx = (ui.loreArcIdx - 1 + 12) % 12;
      else ui.loreHeroIdx = (ui.loreHeroIdx - 1 + 5) % 5;
      return;
    }
    if (e.code === "ArrowRight") {
      if (ui.loreTab === "ARCS") ui.loreArcIdx = (ui.loreArcIdx + 1) % 12;
      else ui.loreHeroIdx = (ui.loreHeroIdx + 1) % 5;
      return;
    }
    return;
  } else if (showExportModal) {
    if (e.code === "Enter") {
      if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
      SaveSystem.exportSaveFile(player, questManager, exportFilename);
      showExportModal = false;
      return;
    }
    if (e.code === "Escape") {
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      showExportModal = false;
      return;
    }
    if (e.code === "Backspace") {
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      exportFilename = exportFilename.slice(0, -1);
      return;
    }
    if (e.key && e.key.length === 1 && /^[a-zA-Z0-9_\-\.]*$/.test(e.key) && exportFilename.length < 32) {
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      exportFilename += e.key;
      return;
    }
    return;
  } else if (gameState === "PLAYING" || gameState === "PAUSED") {
    
    // Ergonomic Skill Hotkeys (1/2/3 + K/L/U)
    if (gameState === "PLAYING" && player && !showShopModal && !showMercModal && !showQuestModal && !showInventoryModal && !showLoreModal && !showGuardModal) {
      const targetEnemy = (enemyManager && enemyManager.enemies)
        ? enemyManager.enemies
            .filter(en => en.isAlive)
            .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0] || null
        : null;

      if (e.code === "Digit1" || e.code === "KeyK") {
        if (player.heroData && player.heroData.onSkill1) player.heroData.onSkill1(player, targetEnemy, (p) => projectileManager.add(p), enemyManager, fx);
      } else if (e.code === "Digit2") {
        if (player.heroData && player.heroData.onSkill2) player.heroData.onSkill2(player, targetEnemy, (p) => projectileManager.add(p), enemyManager, fx);
      } else if (e.code === "Digit3" || e.code === "KeyU") {
        if (player.heroData && player.heroData.onSkill3) player.heroData.onSkill3(player, targetEnemy, (p) => projectileManager.add(p), enemyManager, fx);
      }
    }
    // Export save shortcut (Key X while paused)
    if (e.code === "KeyX" && gameState === "PAUSED") {
      saveGame();
      openExportModal();
      return;
    }

    
    // Toggle Lore Modal ([L] Key)
    if (e.code === "KeyL" && gameState === "PLAYING") {
      showLoreModal = !showLoreModal;
      showInventoryModal = false;
      showQuestModal = false;
      showShopModal = false;
      showMercModal = false;
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      return;
    }
    // Toggle Inventory Modal ([I] / [C] Key)
    if ((e.code === "KeyI" || e.code === "KeyC") && gameState === "PLAYING") {
      showInventoryModal = !showInventoryModal;
      showQuestModal = false;
      showShopModal = false;
      showMercModal = false;
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      return;
    }

    // Toggle Quest Log Modal ([Q] Key)
    if (e.code === "KeyQ" && gameState === "PLAYING") {
      showQuestModal = !showQuestModal;
      showShopModal = false;
      showMercModal = false;
      showInventoryModal = false;
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      return;
    }

    if (showQuestModal) {
      if (e.code === "Digit1") { questManager.tab = "QUESTS"; return; }
      if (e.code === "Digit2") { questManager.tab = "ACHIEVEMENTS"; return; }
      if (e.code === "Escape" || e.code === "KeyQ") {
        showQuestModal = false;
        return;
      }
      if (e.code === "Enter" || e.code === "Space") {
        questManager.completeCurrentQuest(player, fx);
        return;
      }
      return;
    }

    if (showInventoryModal) {
      if (e.code === "Escape" || e.code === "KeyI" || e.code === "KeyC") {
        showInventoryModal = false;
        return;
      }
      return;
    }

    if (e.code === "KeyE" && gameState === "PLAYING") {
      if (showShopModal || showMercModal || showGuardModal) {
        showShopModal = false;
        showMercModal = false;
        showGuardModal = false;
      } else if (stage.isNearCastleGuard(player.x, player.y)) {
        showGuardModal = true;
        showShopModal = false;
        showMercModal = false;
        showQuestModal = false;
        questManager.onNpcTalk("valerie", player, fx);
      } else if (stage.isNearNPC(player.x, player.y)) {
        showShopModal = true;
        showMercModal = false;
        showQuestModal = false;
        showGuardModal = false;
        questManager.onNpcTalk("edgar", player, fx);
      } else if (stage.isNearMercenaryNPC(player.x, player.y)) {
        showMercModal = true;
        showShopModal = false;
        showQuestModal = false;
        showGuardModal = false;
        questManager.onNpcTalk("cedric", player, fx);
      }
      return;
    }

    if (e.code === "KeyM" && gameState === "PLAYING") {
      if (stage.isNearMercenaryNPC(player.x, player.y)) {
        showMercModal = !showMercModal;
        showShopModal = false;
        showQuestModal = false;
        questManager.onNpcTalk("cedric", player, fx);
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
      hudText.innerHTML = `<span>W / S or Arrows</span>: Navigate Menu &nbsp;|&nbsp; <span>ENTER / SPACE</span>: Select`;
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
      if (e.code === "Digit1") { ui.shopTab = "BUY"; return; }
      if (e.code === "Digit2") { ui.shopTab = "FORGE"; return; }
      if (e.code === "Digit3") { ui.shopTab = "SELL"; return; }

      const digitNum = e.code.replace("Digit", "");
      if (["4", "5", "6", "7", "8", "9"].includes(digitNum)) {
        ui.buyShopItem(digitNum, player, fx);
        return;
      }
    }

    if (e.code === "Escape" || e.code === "KeyP") {
      if (showInventoryModal) { showInventoryModal = false; return; }
      if (showQuestModal) { showQuestModal = false; return; }
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

// ========================================================
// GAME LOOP & LOGIC STEP
// ========================================================
function updateGame() {
  if (gameState !== "PLAYING" || !player || showShopModal || showMercModal || showQuestModal || showInventoryModal || showExportModal || showLoreModal || showGuardModal) return;

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
    fx,
    enemyManager
  );

  // Check quest location exploration
  questManager.checkLocation(player.x, player.y, fx, player);

  if (player.falconCompanion) {
    player.falconCompanion.update(player, enemyManager, fx, lootManager);
  }

  if (player.angelCompanions && player.angelCompanions.length > 0) {
    player.angelCompanions.forEach((angel, idx) => {
      angel.update(player, enemyManager, fx, lootManager, idx, isInBarracks);
    });
    player.angelCompanions = player.angelCompanions.filter((a) => a.isAlive);
  }

  camera.update(player.x, player.y);

  enemyManager.update(player, fx, lootManager, stage, questManager ? questManager.currentArcIndex : 0);
  if (stage.castle) {
    enemyManager.enemies.forEach((enemy) => {
      if (enemy.isAlive) stage.castle.resolveCollision(enemy);
    });
  }

  mercManager.update(player, enemyManager, lootManager, fx, (proj) => projectileManager.add(proj), stage);
  projectileManager.update(enemyManager.enemies, enemyManager, fx, lootManager, player, questManager);
  lootManager.update(player, fx, questManager, stage);
}

function renderGameWorld() {
  const { offsetX, offsetY } = fx.getShakeOffsets();
  ctx.save();
  ctx.translate(Math.round(-camera.x + offsetX), Math.round(-camera.y + offsetY));

  stage.draw(ctx);
  lootManager.draw(ctx);
  mercManager.draw(ctx);
  enemyManager.draw(ctx);
  projectileManager.draw(ctx);

  if (player && player.hp > 0) {
    player.draw(ctx);

    if (player.falconCompanion) {
      player.falconCompanion.draw(ctx, player.facing === "right");
    }

    if (player.angelCompanions && player.angelCompanions.length > 0) {
      player.angelCompanions.forEach((angel) => {
        angel.draw(ctx);
      });
    }

    ui.drawInWorldUI(ctx, player, questManager);
  }

  fx.updateAndDraw(ctx, gameConfig);
  ctx.restore();

  const isInBarracks = player ? stage.isInsideSafeZone(player.x, player.y) : false;
  ui.drawHUD(
    ctx, player, enemyManager, lootManager, stage,
    VIRTUAL_W, gameState === "PAUSED",
    fx.timeOfDay, fx.weatherType, isInBarracks,
    questManager
  );

  if (showShopModal && player) {
    ui.drawShopModal(ctx, player, VIRTUAL_W, VIRTUAL_H);
  }

  if (showMercModal && player) {
    ui.drawMercenaryModal(ctx, player, VIRTUAL_W, VIRTUAL_H);
  }

  if (showExportModal) {
    ui.drawExportSaveModal(ctx, exportFilename, VIRTUAL_W, VIRTUAL_H);
  }

  if (showInventoryModal && player) {
    ui.drawInventoryModal(ctx, player, VIRTUAL_W, VIRTUAL_H);
  }

  if (showQuestModal && player) {
    ui.drawQuestLogModal(ctx, questManager, player, VIRTUAL_W, VIRTUAL_H);
  }

  
  if (showGuardModal && player) {
    ui.drawGuardModal(ctx, player, questManager, VIRTUAL_W, VIRTUAL_H);
  }
  if (showLoreModal && player) {
    ui.drawLoreModal(ctx, player, VIRTUAL_W, VIRTUAL_H);
  }

  if (gameState === "PAUSED" && !showShopModal && !showMercModal && !showQuestModal && !showExportModal && !showInventoryModal && !showLoreModal) {
    ui.drawPause(ctx, VIRTUAL_W, VIRTUAL_H);
  }

  if (gameState === "GAMEOVER") {
    ui.drawGameOver(ctx, VIRTUAL_W, VIRTUAL_H);
  }
}

// ========================================================
// TIMESTEP ACCUMULATOR GAME LOOP
// ========================================================
let lastTimestamp = 0;
const TIME_STEP = 1000 / 60; // 60 FPS fixed physics/logic step
let accumulator = 0;

function gameLoop(timestamp = 0) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  let elapsed = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (elapsed > 100) elapsed = 100;
  accumulator += elapsed;

  while (accumulator >= TIME_STEP) {
    updateGame();
    accumulator -= TIME_STEP;
  }

  ctx.save();
  ctx.scale(DPR, DPR);

  if (gameState === "TITLE") {
    titleScene.draw(ctx, VIRTUAL_W, VIRTUAL_H);
  } else if (gameState === "SELECT") {
    selectScene.draw(ctx, VIRTUAL_W, VIRTUAL_H);
  } else if (gameState === "STORY") {
    storyScene.draw(ctx, VIRTUAL_W, VIRTUAL_H);
  } else {
    renderGameWorld();
  }

  ctx.restore();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
