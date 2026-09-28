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
import { QuestManager } from "./quest.js";
import { NPCManager } from "./npc/npcs.js";
import { NPC_DEFS, MENTOR_OF, summonerIdFor } from "./npc/roster.js";
import { getDialogue, npcName } from "./dialogue.js";
import { DialogBox, QuestHud } from "./dialog.js";
import { Avatar } from "./avatar/avatar.js";
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
const viewportEl = document.getElementById("viewport");
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
  viewportEl.style.setProperty("--s", scale);  // laki ng HTML overlay (dialogue, quest)

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

// Kuwento: quest, mga NPC ng lore, dialogue box
const quest = new QuestManager();
const npcManager = new NPCManager(stage);
const dialog = new DialogBox(viewportEl);
const questHud = new QuestHud(viewportEl);
const summonerName = () => (npcManager.summonerId ? npcName(npcManager.summonerId) : "");
quest.onChange = () => {
  npcManager.applyQuest(quest);
  if (player) questHud.toast(quest.text(player, summonerName()).goal);
  saveGame();
};

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
    quest: quest.serialize(),
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
    quest.load(data.quest, player);

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
  npcManager.build(summonerIdFor(player.avatarConfig));
  npcManager.applyQuest(quest);
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

// ==================== JOB AWAKENING (Act IV: audience dais ng Imperial Citadel) ====================
// Nagsisimula pagkatapos kausapin ang tagapagtawag sa Citadel (quest step 3).
function canAwaken(p) {
  return p && p.heroData.id === "novice" && quest.step === 3;
}

function startAwakening() {
  controller.clearAll();
  selectScene.setMode("awakening");
  gameState = "SELECT";
  Sound.stopGameplayBGM();
  if (Sound.playHolyBurst) Sound.playHolyBurst();
}

// Pinapalitan ang Novice ng napiling class; dala ang level, exp, gold, stats at pangalan
function awaken(chosenHero) {
  const old = player;
  const p = new Player(old.x, old.y, chosenHero);
  ["level", "exp", "expNext", "gold", "statPoints", "bonusHp", "bonusDamage",
    "bonusDefense", "bonusSpeed", "bonusCrit", "bonusCooldown", "heroName", "avatarConfig"].forEach((k) => { p[k] = old[k]; });
  applyDerivedStats(p);
  p.hp = p.maxHp;
  if (chosenHero.id === "archer") p.falconCompanion = new FalconCompanion(p.x, p.y);
  player = p;

  controller.clearAll();
  gameState = "PLAYING";
  if (fx.spawnHitSparks) fx.spawnHitSparks(p.x + 10, p.y + 10, "#ffd166", 28);
  if (Sound.playHolyBurst) Sound.playHolyBurst();
  if (gameConfig.music) Sound.startGameplayBGM();
  quest.advance(4);

  // Ibinibigay ng tagapagtawag ang sandata at ang titulong Field Commander
  const summoner = npcManager.find(npcManager.summonerId);
  const d = getDialogue(npcManager.summonerId, { step: quest.step, cls: p.heroData.id, met: quest.met, justAwakened: true });
  dialog.start(npcManager.summonerId, summoner && summoner.avatar, d.lines);
}

// Pakikipag-usap sa NPC (E). Pagkatapos ng huling linya: quest + shop/merc/awakening
function talkTo(npc) {
  const d = getDialogue(npc.id, { step: quest.step, cls: player.heroData.id, met: quest.met });
  dialog.start(npc.id, npc.avatar, d.lines, () => {
    quest.onTalk(npc.id, npcManager.summonerId);
    npcManager.applyQuest(quest);
    saveGame();   // naitala kung sino na ang nakausap
    if (d.action === "shop") { showShopModal = true; showMercModal = false; }
    else if (d.action === "merc") { showMercModal = true; showShopModal = false; }
    else if (d.action === "awaken" && canAwaken(player)) startAwakening();
  });
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
    quest.reset();
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

// Sa Job Awakening, ang bawat class ay ipinapakita kasama ang mentor nito (Act III)
selectScene.mentorAvatars = Object.fromEntries(
  Object.entries(MENTOR_OF).map(([cls, id]) => [cls, new Avatar(NPC_DEFS[id].look)])
);

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
  } else if (gameState === "PLAYING" && dialog.open) {
    dialog.handleInput(e);
  } else if (gameState === "PLAYING" && questHud.logOpen) {
    if (e.code === "KeyQ" || e.code === "Escape") questHud.closeLog();
  } else if (gameState === "PLAYING" || gameState === "PAUSED") {
    if (e.code === "KeyQ" && gameState === "PLAYING" && !showShopModal && !showMercModal) {
      questHud.toggleLog(quest, player, summonerName());
      return;
    }

    // Export save shortcut (Key X habang paused)
    if (e.code === "KeyX" && gameState === "PAUSED") {
      saveGame();
      exportSaveFile();
      return;
    }

    if (e.code === "KeyE") {
      if (showShopModal) {
        showShopModal = false;
      } else if (showMercModal) {
        showMercModal = false;
      } else if (gameState === "PLAYING" && npcManager.nearest) {
        talkTo(npcManager.nearest);
      }
      return;
    }

    if (e.code === "KeyM" && gameState === "PLAYING") {
      if (npcManager.isNear("ronald")) {
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
  if (gameState !== "PLAYING" || !player || showShopModal || showMercModal || dialog.open || questHud.logOpen) return;

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

  quest.update(player);
  npcManager.update(player);

  mercManager.update(player, enemyManager, lootManager, fx, (proj) => projectileManager.add(proj), stage);
  projectileManager.update(enemyManager.enemies, enemyManager, fx, lootManager, player);
  lootManager.update(player, fx);
}

// Gintong palaso sa gilid ng screen na nakaturo sa layunin ng quest (kapag wala sa screen)
function drawObjectiveArrow() {
  const target = npcManager.find(quest.targetNpc(npcManager.summonerId));
  if (!target) return;
  const sx = target.x - camera.x, sy = target.y - 18 - camera.y;
  const m = 14;
  if (sx > m && sx < VIEW_W - m && sy > m && sy < VIEW_H - m) return;
  const cx = VIEW_W / 2, cy = VIEW_H / 2;
  const a = Math.atan2(sy - cy, sx - cx);
  const k = Math.min((VIEW_W / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (VIEW_H / 2 - m) / Math.abs(Math.sin(a) || 1e-6));
  const ax = cx + Math.cos(a) * k, ay = cy + Math.sin(a) * k;
  const pulse = 0.7 + Math.sin(performance.now() / 220) * 0.3;
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(a);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = "#030611";
  ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ffd166";
  ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -4.5); ctx.lineTo(-4, 4.5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function renderGameWorld() {
  const { offsetX, offsetY } = fx.getShakeOffsets();
  ctx.save();
  ctx.translate(Math.round(-camera.x + offsetX), Math.round(-camera.y + offsetY));

  stage.draw(ctx);
  const footY = player ? player.y + 21 : 0;
  npcManager.drawLayer(ctx, footY, false);   // mga NPC sa likod ng player
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
  npcManager.drawLayer(ctx, footY, true);    // mga NPC sa harap ng player

  stage.drawOverlay(ctx);   // canopy ng mga puno, nasa ibabaw ng mga karakter
  if (player && gameState !== "GAMEOVER") npcManager.drawLabels(ctx, player);
  fx.updateAndDraw(ctx, gameConfig);
  ctx.restore();

  const isInBarracks = player ? stage.isInsideSafeZone(player.x, player.y) : false;
  ui.drawHUD(
    ctx, player, enemyManager, lootManager, stage,
    VIEW_W, gameState === "PAUSED",
    fx.timeOfDay, fx.weatherType, isInBarracks
  );

  if (gameState === "PLAYING") drawObjectiveArrow();

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
  dialog.update();
  questHud.setVisible(layoutMode === "play" && Boolean(player) && gameState !== "GAMEOVER");
  if (player && layoutMode === "play") questHud.update(quest, player, summonerName());
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