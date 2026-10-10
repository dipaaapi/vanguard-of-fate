import { AutoAdventure } from "./autoadventure.js";
import { GuildBook } from "./guild.js";
import { GuildField } from "./guildfield.js";
import { autoSummonDefence } from "./summons/automation.js";
import { GuildPanel } from "./guildpanel.js";
import { GuildCeremony } from "./guildceremony.js";
import { GUILD_NPCS, guildText } from "./guilddata.js";
import { setGuildHallOpen } from "./world/guildhall.js";
import { KnightClass } from "./classes/knight.js";
import { MageClass } from "./classes/mage.js";
import { PriestClass } from "./classes/priest.js";
import { ArcherClass } from "./classes/archer.js";
import { FighterClass } from "./classes/fighter.js";
import { Player, expFor } from "./player.js";
import { InputController } from "./controller.js";
import { GamepadInput } from "./gamepad.js";
import { PanelNav } from "./padnav.js";
import { Camera } from "./camera.js";
import { LoadingScreen } from "./loading.js";
import { regression, RegressionModal, serializeRegression, loadRegression, resetRegression, markCleared, jobAllowance, difficultyName, DIFFICULTIES } from "./regression.js";
import { FXManager } from "./fx.js";
import { EnemyManager } from "./enemy.js";
import { ProjectileManager } from "./projectiles.js";
import { UIManager } from "./ui.js";
import { LootManager, findNearestWalkableSpot } from "./loot.js";
import { MercenaryManager, MERC_CLASSES } from "./mercenaryManager.js";
import { Sound } from "./audio.js";
import { Stage } from "./stage.js";
import { TitleScene } from "./title.js";
import { CodexScene } from "./scenes/codexScene.js";
import { PrologueScene } from "./prologue.js";
import { getNovice } from "./classes/novice.js";
import { summonedGarb, normalizeConfig } from "./avatar/options.js";
import { DevTools, devEnabled } from "./devtools.js";
import { equipJob, refreshLook } from "./classes/job.js";
import { Platform } from "./world/platform.js";
import { PLATFORMS, PLATFORM_ORDER, SEAL_STONES, DARK_CONTINENT } from "./world/platforms.js";
import { FRONTIERS } from "./world/frontiers.js";
import { areaDef, areaName } from "./world/areas.js";
import { drawSites } from "./sidequest.js";
import { QuestManager, MENTOR_BY_CLASS, FINAL_STEP } from "./quest.js";
import { NPCManager } from "./npc/npcs.js";
import { summonerIdFor } from "./npc/roster.js";
import { getDialogue, npcName } from "./dialogue.js";
import { DialogBox, QuestHud } from "./dialog.js";
import { ChatLog } from "./chatlog.js";
import { ServiceMenu } from "./services.js";
import { Codex } from "./codex.js";
import { getItem, SETS } from "./items/itemdb.js";
import { SET_SLOTS, recipeCost, forgePiece } from "./items/forge.js";
import { wear, WEAR_WEAPON, WEAR_ARMOR, ARMOR_SLOTS } from "./items/durability.js";
import { needsPick } from "./world/mining.js";
import { Fishing } from "./world/fishing.js";
import { Workshop } from "./workshop.js";
import { SHOPS, buyPrice, Market as EconMarket, formatCoins } from "./items/economy.js";
import { hasRunnerKind, isAway, updateErrand, serializeErrand, loadErrand, errandText, runnerName } from "./errand.js";
import { Avatar } from "./avatar/avatar.js";
import { loadSpriteSheets } from "./avatar/sheets.js";
import { ActIntro } from "./actintro.js";
import { createLorePanel } from "./lore.js";
import { HudBar } from "./hudbar.js";
import { Party, partyText, memberName } from "./party.js";
import { PartyHud, roleOf } from "./partyhud.js";
import { Keybinds } from "./keybinds.js";
import { ActionPanel } from "./actionpanel.js";
import { WorldMap } from "./worldmap.js";
import { ActReader } from "./actreader.js";
import { InventoryPanel } from "./inventory.js";
import { DayNight } from "./daynight.js";
import { CharacterPanel } from "./charpanel.js";
import { t, onLangChange, getLang } from "./i18n.js";
import { loadConfig, GFX, SettingsPanel, toggleFullscreen } from "./settings.js";
import { Market, marketText } from "./market.js";
import { SkillSlots } from "./skillslots.js";

import { FalconCompanion } from "./summons/falcon.js";
import { GuardianAngelCompanion } from "./summons/angel.js";
import { syncFamiliar } from "./summons/familiar.js";
import { PATH_IDS, SLOT_KEYS, assignSlot } from "./skillpaths.js";
import { AUTO_MODES, loadSkillPoints } from "./skills.js";
import "./saveSecurity.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
// Labels (names, prompts, gateways) measure the same text every frame: remember the widths per font
{
  const measure = ctx.measureText.bind(ctx), widths = new Map();
  ctx.measureText = (text) => {
    const key = `${ctx.font}|${text}`;
    let m = widths.get(key);
    if (!m) {
      if (widths.size > 4000) widths.clear();
      m = measure(text);
      widths.set(key, m);
    }
    return m;
  };
}

// ==================== DISPLAY / RESOLUTION ====================
// Logical game size (16:9). All game code works in these units.
const VIEW_W = 480;
const VIEW_H = 270;

// Takes the remaining space (lore panel on the right, bar below)
// and picks the largest INTEGER scale that fits.
const stageEl = document.getElementById("stage");
const viewportEl = document.getElementById("viewport");
const barEl = document.getElementById("bar");

// While playing: room below for the bottom tray (hotbar + adventure log)
const TRAY_RESERVE = 150;
const chatLogEl = document.getElementById("chatLog");

function fitCanvas() {
  const availW = stageEl.clientWidth;
  const availH = window.innerHeight - barEl.offsetHeight - (layoutMode === "play" ? TRAY_RESERVE : 0);
  const raw = Math.min(availW / VIEW_W, availH / VIEW_H);
  const scale = Math.max(1, Math.floor(raw));
  // Drawing resolution: on big screens the canvas draws at up to 2× (Balanced) and the browser
  // enlarges it pixel-perfect; drawing every pixel at 3–4× cost up to half the frame rate (perf.mjs)
  const render = Math.min(scale, RENDER_CAP[gameConfig.quality] || scale);

  canvas.width = VIEW_W * render;
  canvas.height = VIEW_H * render;
  canvas.style.width = VIEW_W * scale + "px";
  canvas.style.height = VIEW_H * scale + "px";
  barEl.style.width = VIEW_W * scale + "px";   // the menu is as wide as the canvas
  chatLogEl.style.width = VIEW_W * scale + "px";
  viewportEl.style.setProperty("--s", scale);  // size of the HTML overlays (dialogue, quest)

  // Reset whenever canvas.width changes, so set it again here
  ctx.setTransform(render, 0, 0, render, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

// "title" | "select" | "play": same layout (screen + bottom bar + right panel);
// only the contents of the bar and panel change per scene.
let layoutMode = "";
function setLayoutMode(mode) {
  if (mode === layoutMode) return;
  layoutMode = mode;
  document.body.dataset.mode = mode;

  refreshLabels();
  fitCanvas();
}

// Side panel title and control hints (follow the chosen language)
function refreshLabels() {
  const head = document.getElementById("sideHead");
  if (head) head.textContent = layoutMode === "select" ? t("sideDossier") : t("sideLore");
  const more = document.getElementById("loreMore");
  if (more) more.textContent = `${t("readMore")} ▸`;
  hudText.innerHTML = layoutMode === "select" ? t("awakenHint") : (layoutMode === "play" ? t("playHint") : "");
}
onLangChange(refreshLabels);

window.addEventListener("resize", fitCanvas);

const hudText = document.getElementById("hudText");
const fileInput = document.getElementById("saveFileInput");
const ROSTER = [KnightClass, MageClass, PriestClass, ArcherClass, FighterClass];

// Options → Quality: the largest drawing scale (0 = always the full screen scale)
const RENDER_CAP = { sharp: 0, balanced: 2, fast: 1 };

// Settings (js/settings.js): title Options and the in-game Settings panel (O) share this object
const gameConfig = loadConfig();
Sound.musicEnabled = gameConfig.music;
Sound.sfxEnabled = gameConfig.sfx;

// Applies a changed setting (key) or all of them (no key)
function applyConfig(key) {
  const all = !key;
  if (all || key === "quality") fitCanvas();
  if (all || key === "musicVol" || key === "sfxVol") Sound.setVolumes(gameConfig.musicVol, gameConfig.sfxVol);
  if (all || key === "brightness") canvas.style.filter = gameConfig.brightness === 100 ? "" : `brightness(${gameConfig.brightness / 100})`;
  GFX.shadows = gameConfig.shadows;
  GFX.glow = gameConfig.glow;
  if (key === "music" && layoutMode === "play") {
    Sound.musicEnabled = gameConfig.music;
    if (gameConfig.music && gameState === "PLAYING") Sound.startGameplayBGM();
  }
  if (key === "sfx") Sound.sfxEnabled = gameConfig.sfx;
}

// The plains of Aethelgard (hub) and the Act VII–XV platforms (built on first entry).
// Same size (1280x960), so one camera, enemy and projectile manager serve all of them.
const hub = new Stage(1280, 960);
let stage = hub;
const platformCache = {};
function platformById(id) {
  if (id === "hub" || !(PLATFORMS[id] || FRONTIERS[id])) return hub;
  if (!platformCache[id]) {
    platformCache[id] = new Platform(id);
    if (savedShip && platformCache[id].boatSystem) platformCache[id].boatSystem.load(savedShip);
  }
  return platformCache[id];
}
// The Cerulean Abyss ship from the save (where it is moored, or sailing with the hero aboard)
let savedShip = null;
function shipState() {
  const p = Object.values(platformCache).find((c) => c.boatSystem);
  return p ? p.boatSystem.serialize(stage === p ? player : null) : savedShip;
}

const camera = new Camera(VIEW_W, VIEW_H, hub.width, hub.height);
const fx = new FXManager();
const enemyManager = new EnemyManager(hub.width, hub.height);
const projectileManager = new ProjectileManager(hub.width, hub.height);
const ui = new UIManager();
const lootManager = new LootManager();
const mercManager = new MercenaryManager();
const controller = new InputController();
const autoAdventure = new AutoAdventure();
const guildBook = new GuildBook();
const guildField = new GuildField(guildBook);
const guildCeremony = new GuildCeremony();
const guildContext = () => ({ quest, stage });
const guildPanel = new GuildPanel(document.getElementById("viewport"), guildBook,
  () => { player.allocateAutomatically(); saveGame(); },
  result => { controller.clearAll(); guildCeremony.start(player, result); });
guildBook.onReady = () => { questHud.toast(guildText("ready")); saveGame(); };
// Gamepad (DS4 / DualSense / Joy-Con / Xbox): translated into the same key events as the keyboard.
// Gameplay bindings apply only while the hero is free to move; otherwise the pad navigates menus.
const gamepad = new GamepadInput(() => {
  try {
    return Boolean(player) && gameState === "PLAYING" && !dialog.open && !actReader.open && !serviceMenu.open &&
      !showShopModal && !showMercModal && !inventory.open && !worldMap.open && !charPanel.open &&
      !questHud.logOpen && !market.open && !settingsPanel.open && !codexScene.open && !regressionModal.open && !guildPanel.open && !guildCeremony.open;
  } catch (_) { return false; }   // still booting
}, () => {
  // something in reach of E: an NPC, an ore vein or the boat → the pad's A button talks / uses
  try {
    return Boolean(player) && (Boolean(npcManager.nearest) ||
      Boolean(stage.ore && stage.ore.nearest(player)) ||
      Boolean(stage.boatSystem && stage.boatSystem.canToggle(player)));
  } catch (_) { return false; }
});
// Pad buttons that aren't a keyboard key: party switch (gameplay) and full screen (bindable in the Controller guide)
gamepad.onPad.partyNext = () => { if (gameState === "PLAYING" && !guildPanel.open && !guildCeremony.open) switchMember(-1); };
gamepad.onPad.fullscreen = () => toggleFullscreen();
const panelNav = new PanelNav();   // arrows / D-pad + Enter inside the Inventory and Character panels (js/padnav.js)
onLangChange(() => gamepad.refresh());
enemyManager.loot = lootManager;
// Day and night (js/daynight.js): affects monsters and the hero
const dayNight = new DayNight();
let lastPhase = "";
enemyManager.setArea(hub);

// Story: quest, lore NPCs, dialogue box
const quest = new QuestManager();
const npcManager = new NPCManager(hub);
const dialog = new DialogBox(viewportEl);
const questHud = new QuestHud(viewportEl);
// Bottom tray: every NPC line is logged with the in-game time
const chatLog = new ChatLog(chatLogEl);
dialog.onLine = (id, line) => chatLog.add(id, line, dayNight.label());
const summonerName = () => (npcManager.summonerId ? npcName(npcManager.summonerId) : "");
const playerClass = () => (player ? player.heroData.id : "novice");
// Name of the mentor of the player's class (Act V); null while still a Novice
const mentorName = () => (MENTOR_BY_CLASS[playerClass()] ? npcName(MENTOR_BY_CLASS[playerClass()]) : null);

// Lore panel on the right: follows the Act of the current quest step (text + banner)
let lorePanel = null;
function syncLoreAct() {
  if (lorePanel) lorePanel.setAct(player ? quest.act() : 0);
}

// "Read more": full text of finished acts and the current one (the next is locked)
const actReader = new ActReader(document.getElementById("actReader"));
function openActReader() {
  if (!player || gameState !== "PLAYING") return;
  controller.clearAll();
  if (questHud.logOpen) questHud.closeLog();
  inventory.close();
  showShopModal = false;
  showMercModal = false;
  actReader.show(quest.act(), quest.step >= FINAL_STEP);
}

// Inventory (I): equipment, stats, gold and active buffs. The game is paused while it is open.
const inventory = new InventoryPanel(document.getElementById("inventory"));
function toggleInventory() {
  if (!player || gameState !== "PLAYING" || dialog.open || actReader.open || serviceMenu.open || showShopModal || showMercModal) return;
  controller.clearAll();
  if (questHud.logOpen) questHud.closeLog();
  worldMap.close();
  charPanel.close();
  inventory.toggle(player, inventoryCtx());
}

// Refine / repair: the inventory opened as an NPC service (see js/services.js and the NPC menus below)
function openService(service, opts) {
  controller.clearAll();
  worldMap.close();
  charPanel.close();
  inventory.show(player, { ...inventoryCtx(), service, ...opts });
}

// NPC service menus. Ronald: mercenaries, safe refines up to +4, and field repairs at double the dwarves' price.
const serviceMenu = new ServiceMenu(document.getElementById("serviceMenu"));

// Workshop (G, safe zones only): craft gear from materials, auto-craft, cook, transmute (js/workshop.js)
const workshop = new Workshop({
  menu: serviceMenu, fx, sound: Sound,
  log: (kind, text, color) => chatLog.event(kind, text, dayNight.label(), null, color),
  onChange: () => { inventory.dirty = true; }
});
function openWorkshop() {
  if (!player || gameState !== "PLAYING" || dialog.open || serviceMenu.open || showShopModal || showMercModal) return;
  if (!stage.isInsideSafeZone(player.x + 10, player.y + 17)) {
    fx.spawnDamagePopup(player.x + 10, player.y - 10, lang() === "fil" ? "Sa ligtas na lugar lang ang talyer" : "Workshop: safe zones only", false, "#94a3b8");
    return;
  }
  controller.clearAll();
  inventory.close();
  charPanel.close();
  worldMap.close();
  workshop.open(player);
}

// Fishing (E at the water's edge): what bites depends on the place (js/world/fishing.js)
const fishing = new Fishing();
fishing.onCatch = (id) => {
  const it = getItem(id), fil = lang() === "fil";
  if (!player.bag.add(id, 1)) lootManager.drop({ x: player.x + 10, y: player.y + 22 }, { id, qty: 1 });
  fx.spawnDamagePopup(player.x + 10, player.y - 18, `+1 ${it.name}`, true, it.tint);
  if (Sound.playLootPickup) Sound.playLootPickup();
  chatLog.event("loot", "", dayNight.label(), { key: `fish:${id}`, value: 1, format: (n, total) => (fil ? `Nakahuli ng ${it.name} ×${total}` : `Caught ${it.name} ×${total}`) }, it.tint);
};
fishing.onMiss = () => fx.spawnDamagePopup(player.x + 10, player.y - 18, lang() === "fil" ? "Nakatakas!" : "It got away!", false, "#94a3b8");

// Codex (N): encyclopedia of NPCs, monsters, MVPs and items; progress is saved with the game
// Safe-zone Market (B) and Settings (O): HTML overlays; the game waits while one is open.
// Prices come from js/items/economy.js (safe-zone markup, sell rates, market saturation); the Market
// pays the gold itself, so it records the sale instead of calling sell(). Outside a safe zone B opens
// the same panel as a summon errand order (js/errand.js).
const market = new Market(document.getElementById("market"), {
  stock: () => SHOPS.safezone.stock,
  buyPrice: (id, it) => buyPrice("safezone", id, it),
  sellQuote: (it, n) => (player.market ||= new EconMarket()).quote(it, n),
  onSold: (it, n) => player.market.record(it, n),
  tabs: [{ id: "workshop", label: () => (lang() === "fil" ? "Talyer" : "Workshop"), open: () => openWorkshop() }],
  onTrade: (text) => {
    chatLog.event("loot", text, dayNight.label());
    if (Sound.playCoin) Sound.playCoin();
  },
  onErrand: (text) => {
    chatLog.event("info", text, dayNight.label());
    if (fx.spawnHitSparks) fx.spawnHitSparks(player.x - 10, player.y + 10, "#ffd166", 14);
    if (Sound.playPortal) Sound.playPortal(player.x, player.y);
    inventory.dirty = true;
  },
  onFail: () => { if (Sound.playUiClose) Sound.playUiClose(); }
});
function toggleMarket() {
  if (!player || gameState !== "PLAYING" || dialog.open || actReader.open) return;
  if (market.open) { market.close(); panelSound(false); return; }
  // Outside a safe zone: send the summon on an errand instead (if the hero has one)
  const errand = !stage.isInsideSafeZone(player.x + 10, player.y + 17);
  if (errand && !hasRunnerKind(player)) {
    fx.spawnDamagePopup(player.x + 10, player.y - 8, "⚖ ✖", false, "#f87171");
    chatLog.event("info", marketText("closed"), dayNight.label());
    return;
  }
  closeOverlays();
  market.show(player, errand ? "errand" : "shop");
  panelSound(true);
}
const settingsPanel = new SettingsPanel(document.getElementById("settings"), gameConfig, (key) => applyConfig(key));
settingsPanel.onPadGuide = () => gamepad.show();   // Settings → Controls → Controller Guide
function toggleSettings() {
  if (!player || (gameState !== "PLAYING" && gameState !== "PAUSED") || dialog.open || actReader.open) return;
  if (!settingsPanel.open) closeOverlays();
  settingsPanel.toggle();
  panelSound(settingsPanel.open);
}
// Closes the side panels (inventory, character, quest log, map, shops) before another opens
function closeOverlays() {
  controller.clearAll();
  if (questHud.logOpen) questHud.closeLog();
  inventory.close();
  charPanel.close();
  if (codexScene.open) codexScene.close();
  worldMap.close();
  market.close();
  settingsPanel.close();
  showShopModal = false;
  showMercModal = false;
}
const codex = new Codex();   // progress and detail panels; shown by codexScene (js/scenes/codexScene.js)
function toggleCodex() {
  if (!player || gameState !== "PLAYING" || dialog.open || serviceMenu.open) return;
  controller.clearAll();
  if (questHud.logOpen) questHud.closeLog();
  inventory.close();
  charPanel.close();
  worldMap.close();
  if (codexScene.open) codexScene.close();
  else codexScene.show("codex");
}
function openRonaldMenu() {
  const fil = lang() === "fil", who = npcName("ronald");
  serviceMenu.show(who, [
    { label: fil ? "Umupa ng mercenary" : "Hire mercenaries", hint: `${formatCoins(MercenaryManager.cost(player.level))}`, onPick: () => { showMercModal = true; } },
    { label: fil ? "Mag-refine (hanggang +4)" : "Refine gear (up to +4)", hint: fil ? "Ang dwarf na panday sa Ashfall ang lampas +4" : "Beyond +4 needs the dwarf smith of Ashfall",
      onPick: () => openService("refine", { maxPlus: 4, serviceName: who }) },
    { label: fil ? "Field repair (dobleng halaga)" : "Field repair (double cost)", hint: fil ? "Mas mura sa dwarf sa Ashfall" : "Cheaper with the dwarves of Ashfall",
      onPick: () => openService("repair", { repairMult: 2, serviceName: who }) }
  ]);
}

// Emberhold (Ashfall Wastelands): the dwarves' services
function openSmithMenu() {
  const fil = lang() === "fil", who = npcName("brakka");
  serviceMenu.show(who, [
    { label: fil ? "Mag-refine (hanggang +10)" : "Refine gear (up to +10)", hint: fil ? "Monster Shard, Kristal ng Void at ginto" : "Monster Shards, Void Crystals and gold",
      onPick: () => openService("refine", { serviceName: who }) },
    { label: fil ? "Mag-forge ng set" : "Forge a set piece", hint: fil ? "Mga mineral mula sa minahan" : "From mined minerals", onPick: openForgeSets },
    { label: fil ? "Patibayin gamit ang mineral" : "Temper with minerals", hint: fil ? "Hanggang 3 beses bawat hindi-set na gamit" : "Up to 3 times on any non-set gear",
      onPick: () => openService("temper", { serviceName: who }) }
  ]);
}

// Forging: pick a set, then a slot; each option shows its mineral cost
const costText = (cost) => Object.entries(cost).map(([id, n]) => (id === "gold" ? `${formatCoins(n)}` : `${getItem(id).name} ${player.bag.count(id)}/${n}`)).join(" · ");
function openForgeSets() {
  const fil = lang() === "fil";
  serviceMenu.show(fil ? "Pumili ng set" : "Choose a set", Object.entries(SETS).filter(([, set]) => set.mineral).map(([id, set]) => ({
    label: `${set.name[lang()]} · ${fil ? "Grado" : "Grade"} ${set.grade}`,
    hint: `5: ${set.passive[lang()]}`,
    onPick: () => openForgeSlots(id)
  })));
}
function openForgeSlots(setId) {
  const fil = lang() === "fil", set = SETS[setId];
  const SLOT_NAME = { weapon: fil ? "Sandata" : "Weapon", head: fil ? "Ulo" : "Head", armor: fil ? "Baluti" : "Armor", gloves: fil ? "Guwantes" : "Gloves", boots: fil ? "Bota" : "Boots" };
  serviceMenu.show(`${set.name[lang()]} · ◆ ${formatCoins(player.gold)}`, SET_SLOTS.map((slot) => ({
    label: SLOT_NAME[slot],
    hint: costText(recipeCost(setId, slot)),
    onPick: () => {
      const err = forgePiece(player, setId, slot);
      if (err) {
        const why = { gold: fil ? "Kulang ang ginto" : "Not enough gold", minerals: fil ? "Kulang ang mineral" : "Not enough minerals", full: fil ? "Puno ang bag" : "Bag is full" }[err];
        fx.spawnDamagePopup(player.x + 10, player.y - 10, why, false, "#ef4444");
      } else {
        fx.spawnHitSparks(player.x + 10, player.y + 6, set.color, 24);
        if (Sound.playHolyBurst) Sound.playHolyBurst();
        chatLog.event("loot", fil ? `Na-forge: ${set.name.fil} ${SLOT_NAME[slot]}` : `Forged: ${set.name.en} ${SLOT_NAME[slot]}`, dayNight.label(), null, set.color);
        inventory.dirty = true;
      }
      openForgeSlots(setId);
    }
  })));
}

// Thane Durgrim's charge: slay Ashfall beasts, receive the Dwarven Pickaxe, mining unlocked
const MINING_KILLS = 15;
function openNobleMenu() {
  const fil = lang() === "fil", who = npcName("durgrim");
  if (quest.mining === 0) {
    serviceMenu.show(who, [{
      label: fil ? "Tanggapin: Ang Tungkulin ng Thane" : "Accept: The Thane's Charge",
      hint: fil ? `Pumatay ng ${MINING_KILLS} halimaw sa Ashfall; kapalit ang piko at karapatang magmina` : `Slay ${MINING_KILLS} beasts in the Ashfall; earn a pickaxe and the right to mine`,
      onPick: () => {
        quest.mining = 1;
        quest.miningKills = 0;
        questHud.toast(fil ? `Tungkulin ng Thane: pumatay ng ${MINING_KILLS} halimaw sa Ashfall Wastelands` : `The Thane's Charge: slay ${MINING_KILLS} beasts in the Ashfall Wastelands`);
        chatLog.event("info", fil ? "Tinanggap ang Tungkulin ng Thane" : "Accepted the Thane's Charge", dayNight.label());
        saveGame();
      }
    }]);
  } else if (quest.mining === 1) {
    const done = quest.miningKills >= MINING_KILLS;
    serviceMenu.show(who, [{
      label: done ? (fil ? "Mag-ulat kay Thane Durgrim" : "Report to Thane Durgrim") : `${fil ? "Tungkulin ng Thane" : "The Thane's Charge"}: ${quest.miningKills}/${MINING_KILLS}`,
      hint: done ? (fil ? "Tanggapin ang Dwarven Pickaxe" : "Receive the Dwarven Pickaxe") : (fil ? "Ipagpatuloy ang pangangaso sa Ashfall" : "Keep hunting in the Ashfall"),
      disabled: !done,
      onPick: () => {
        quest.mining = 2;
        player.bag.add("dwarvenPickaxe", 1);
        syncPlatformFlags();
        if (Sound.playHolyBurst) Sound.playHolyBurst();
        questHud.toast(fil ? "Nabuksan ang pagmimina! Hanapin ang mga ugat ng mineral sa Ashfall at sa Siege." : "Mining unlocked! Look for ore veins in the Ashfall and the Siege.");
        chatLog.event("loot", fil ? "Natanggap ang Dwarven Pickaxe — maaari ka nang magmina" : "Received the Dwarven Pickaxe — you can now mine", dayNight.label());
        saveGame();
      }
    }]);
  } else {
    serviceMenu.show(who, [{
      label: fil ? "Tungkol sa pagmimina" : "About mining",
      hint: fil ? "Emberite at Obsidian sa Ashfall · Aethersilver at Starsteel sa Siege · dalhin kay Brakka" : "Emberite & Obsidian in the Ashfall · Aethersilver & Starsteel in the Siege · take them to Brakka",
      onPick: () => {}
    }]);
  }
}

// Mining: one pickaxe strike on the vein beside the hero
function mineVein(v) {
  const fil = lang() === "fil";
  if (quest.mining !== 2 && needsPick(v.kind)) {
    fx.spawnDamagePopup(player.x + 10, player.y - 10, fil ? "Kailangan ang piko ni Thane Durgrim" : "Needs Thane Durgrim's pickaxe", false, "#94a3b8");
    return;
  }
  const r = stage.ore.strike(v);
  fx.spawnHitSparks(v.x, v.y - 8, getItem(v.kind).tint, r.broke ? 20 : 8);
  if (Sound.playSlash) Sound.playSlash();
  if (!r.broke) return;
  if (r.salt && !player.bag.add("rockSalt", r.salt)) lootManager.drop({ x: v.x + 8, y: v.y + 6 }, { id: "rockSalt", qty: r.salt });
  if (!player.bag.add(r.id, r.qty)) {
    lootManager.drop({ x: v.x, y: v.y + 6 }, { id: r.id, qty: r.qty });   // bag full: leave it on the ground
  } else {
    fx.spawnDamagePopup(v.x, v.y - 18, `+${r.qty} ${getItem(r.id).name}`, true, getItem(r.id).tint);
    chatLog.event("loot", "", dayNight.label(), {
      key: `mine:${r.id}`, value: r.qty,
      format: (n, total) => (fil ? `Namina ang ${getItem(r.id).name} ×${total}` : `Mined ${getItem(r.id).name} ×${total}`)
    }, getItem(r.id).tint);
  }
}

// Pip's stall: buy one at a time; the menu reopens after each purchase with the gold left
const DWARF_STOCK = [["monsterShard", 15], ["voidCrystal", 80], ["elixir", 45], ["tonic", 18], ["panacea", 22]];
let pipHasMushroom = false;       // rolled each time the hero arrives in the Ashfall (30%)
function openDwarfShop() {
  const fil = lang() === "fil";
  const stock = pipHasMushroom ? [...DWARF_STOCK, ["mushroom", 3000]] : DWARF_STOCK;
  serviceMenu.show(`${npcName("pip")} · ◆ ${formatCoins(player.gold)}`, stock.map(([id, price]) => ({
    label: `${getItem(id).name} — ${formatCoins(price)}`,
    hint: getItem(id).desc,
    disabled: player.gold < price,
    onPick: () => {
      if (player.gold < price || !player.bag.add(id, 1)) {
        fx.spawnDamagePopup(player.x + 10, player.y - 10, fil ? "HINDI MAKABILI" : "CAN'T BUY", false, "#ef4444");
      } else {
        player.gold -= price;
        chatLog.event("loot", fil ? `Binili ang ${getItem(id).name} (−${formatCoins(price)})` : `Bought ${getItem(id).name} (−${formatCoins(price)})`, dayNight.label());
        if (id === "mushroom") pipHasMushroom = false;   // one per visit
        if (Sound.playLootPickup) Sound.playLootPickup();
      }
      openDwarfShop();
    }
  })));
}

function inventoryCtx() {
  return {
    fx,
    // Selling happens only in a sanctuary (Barracks, the Citadel dais or a platform camp)
    inSanctuary: () => Boolean(player && stage.isInsideSafeZone(player.x + 10, player.y + 17)),
    // A dropped item lands on the ground in front of the hero
    onDrop: (inst) => {
      lootManager.drop({ x: player.x + 10 + (player.facing === "left" ? -18 : 18), y: player.y + 14 }, inst);
      const it = lootManager.items[lootManager.items.length - 1];
      if (it) it.blocked = 240;     // don't pick it up again right away
    },
    onRepair: (n, cost) => chatLog.event("equip", lang() === "fil" ? `Naayos ang ${n} kagamitan (−${formatCoins(cost)})` : `Repaired ${n} item${n > 1 ? "s" : ""} (−${formatCoins(cost)})`, dayNight.label())
  };
}

// Durability: wear the worn piece(s) and warn in the log when one runs low or breaks
function wearGear(slots, amount) {
  if (!player) return;
  const fil = lang() === "fil";
  slots.forEach((slot) => {
    const inst = player.bag.equip[slot];
    const ev = wear(inst, amount);
    if (!ev) return;
    const name = player.bag.equippedItem(slot).name;
    if (ev === "broken") {
      player.recalc();
      fx.spawnDamagePopup(player.x + 10, player.y - 16, fil ? `SIRA: ${name}!` : `${name} BROKE!`, true, "#f87171");
      chatLog.event("hit", fil ? `Nasira ang ${name} — walang stats hangga't hindi naaayos` : `${name} broke — it gives no stats until repaired`, dayNight.label());
    } else {
      chatLog.event("equip", fil ? `Halos sira na ang ${name} — ipaayos agad` : `${name} is badly worn — get it repaired soon`, dayNight.label());
    }
    inventory.dirty = true;
  });
}
enemyManager.onHeroHit = () => wearGear(["weapon"], WEAR_WEAPON);

// Character (C): stat builder and skill tree (Ragnarok Online style). The game is paused while it is open.
const charPanel = new CharacterPanel(document.getElementById("character"), () => {
  if (!guildBook.at(player, guildContext(), "guildRepresentative")) { questHud.toast(guildText("resetAt")); return; }
  charPanel.close(); guildPanel.show("guildRepresentative", player, guildContext());
});
function toggleCharacter() {
  if (!player || gameState !== "PLAYING" || dialog.open || actReader.open || showShopModal || showMercModal) return;
  controller.clearAll();
  if (questHud.logOpen) questHud.closeLog();
  worldMap.close();
  inventory.close();
  charPanel.toggle(player);
}

// Hooks up the player's bag: when worn gear changes, refresh the look and stats
function attachBag(p) {
  p.bag.onJobScroll = () => openJobChange();
  p.bag.onChange = (equipChanged) => {
    if (equipChanged) refreshLook(p);
    p.recalc();
    inventory.dirty = true;
  };
  // Bottom tray: equipped/unequipped gear and hits taken
  p.bag.onEquip = (item, on) => {
    const fil = lang() === "fil";
    const verb = on ? (fil ? "Isinuot ang" : "Equipped") : (fil ? "Hinubad ang" : "Unequipped");
    chatLog.event("equip", `${verb} ${item.name}`, dayNight.label());
  };
  p.onLevelUp = (level) => {
    // Every 10th level is a milestone: the full Mythic ceremony
    const big = level % 10 === 0;
    celebrate(p, big ? "MYTHIC" : "LEVEL", big ? t("cerLevelMilestone", level) : t("cerLevel"), t("cerLevelSub", level));
    chatLog.event("level", lang() === "fil" ? `Umakyat ka sa Level ${level}! +stat at +skill point` : `Level up! You are now Lv ${level} (+stat & skill points)`, dayNight.label());
  };
  p.onHurt = (dmg, src) => {
    wearGear(ARMOR_SLOTS, WEAR_ARMOR);
    const fil = lang() === "fil";
    const name = src ? enemyManager.displayName(src) : "";
    chatLog.event("hit", "", dayNight.label(), {
      key: `hit:${src ? src.id : "-"}`,
      value: dmg,
      format: (n, total) => {
        const times = n > 1 ? ` ×${n}` : "";
        if (!name) return fil ? `Nasaktan ka${times} (−${total} HP)` : `You were hurt${times} (−${total} HP)`;
        return fil ? `Tinamaan ka ng ${name}${times} (−${total} HP)` : `${name} hit you${times} (−${total} HP)`;
      }
    });
  };
  p.onSkillMastered = (s) => celebrate(p, "LEGENDARY", t("cerSkill"), t("cerSkillSub", `${s.icon} ${s.name[lang()]}`));
  refreshLook(p);
  p.recalc();
}

// Unlock ceremony: pillar of light + rings + sparks (fx), sub-bass and chime (Sound), and the banner (ui).
// at = the hero (or anything with x/y at its top-left) or a ground point { x, y, point: true }.
function celebrate(at, rarity, title, subtitle = "") {
  const x = at.point ? at.x : at.x + 10, y = at.point ? at.y : at.y + 20;
  fx.triggerUnlockCeremony(x, y, rarity, title);
  if (Sound.playUnlockCeremony) Sound.playUnlockCeremony(rarity);
  ui.showUnlockBanner(rarity, title, subtitle);
}

// ==================== TARGET LOCK (Shift) ====================
// Each Shift press: the next foe within attack reach, nearest first.
// J/K/L aim at the locked target until it dies or moves away.
let lockedTarget = null;
function cycleTarget() {
  if (!player) return;
  const range = (player.heroData.range || 200) + 40;
  const list = enemyManager.enemies
    .filter((e) => e.isAlive && Math.hypot(e.x - player.x, e.y - player.y) <= range)
    .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
  if (!list.length) {
    lockedTarget = null;
    fx.spawnDamagePopup(player.x + 10, player.y - 14, getLang() === "fil" ? "WALANG TARGET" : "NO TARGET", false, "#94a3b8");
    return;
  }
  lockedTarget = list[(list.indexOf(lockedTarget) + 1) % list.length];
  fx.spawnDamagePopup(lockedTarget.x + 10, lockedTarget.y - 22 - (lockedTarget.hitUp || 0), `🎯 ${enemyManager.displayName(lockedTarget)}`, false, "#ef4444");
  if (Sound.playSelectMove) Sound.playSelectMove();
}

// Quick slot (1–4): the item assigned to the slot (set in the Inventory)
const QUICK = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
function quickUse(slot) {
  if (!player || typeof slot !== "number") return false;
  const id = player.belt[slot];
  if (!id || !player.bag.has(id)) {
    fx.spawnDamagePopup(player.x + 10, player.y - 6, "—", false, "#64748b");
    return true;
  }
  player.bag.useById(id, player, fx);
  return true;
}

// Auto-potion (Ragnarok/Diablo style): drinks automatically when HP drops below the set percentage,
// uses Panacea when blighted and Tonic when tired. One second between uses.
const HEAL_ORDER = ["salve", "elixir", "herb"];
const HARMFUL = ["poison", "bleeding", "burn", "freeze", "electrified", "silence", "blind", "curse", "confusion"];
function autoPotion() {
  const p = player, a = p.autoPot;
  if (p.autoPotTimer > 0) { p.autoPotTimer--; return; }
  const use = (id) => { if (p.bag.has(id) && p.bag.useById(id, p, fx)) { p.autoPotTimer = 60; return true; } return false; };
  if (a.hp && p.hp / p.maxHp * 100 < a.hp) {
    // a stronger potion when a lot of HP is missing
    const order = p.maxHp - p.hp > 120 ? ["elixir", "salve", "herb"] : HEAL_ORDER;
    if (order.some(use)) return;
  }
  if (a.cure && HARMFUL.some((k) => p.debuffs[k] > 0) && use("panacea")) return;
  if (a.stamina && p.exhausted) use("tonic");
}
document.getElementById("loreMore").addEventListener("mousedown", (e) => e.preventDefault());
// Mouse wheel zooms the world map while it is open
canvas.addEventListener("wheel", (e) => { if (worldMap.open) { e.preventDefault(); worldMap.wheel(e.deltaY); } }, { passive: false });
document.getElementById("loreMore").addEventListener("click", () => { Sound.init(); openActReader(); });

// Pause / resume (Esc or the side-panel button)
function togglePause() {
  if (gameState === "PLAYING") {
    gameState = "PAUSED";
    saveGame();
    Sound.stopGameplayBGM();
  } else if (gameState === "PAUSED") {
    gameState = "PLAYING";
    if (gameConfig.music) Sound.startGameplayBGM();
  }
}

// Right panel, middle: profile, quest and field state
const hudBar = new HudBar();

// Map of the whole world (M). The game is paused while it is open.
const worldMap = new WorldMap(stage);
function toggleMap() {
  if (!player || gameState !== "PLAYING" || dialog.open || actReader.open) return;
  controller.clearAll();
  if (questHud.logOpen) questHud.closeLog();
  inventory.close();
  showShopModal = false;
  showMercModal = false;
  worldMap.toggle();
}

// Back to the title (saved first)
function exitToTitle() {
  saveGame();
  controller.clearAll();
  if (questHud.logOpen) questHud.closeLog();
  inventory.close();
  charPanel.close();
  showShopModal = false;
  showMercModal = false;
  actIntro.close();
  actIntroShown = null;
  gameState = "TITLE";
  player = null;
  syncLoreAct();
  Sound.stopGameplayBGM();
  if (gameConfig.music) Sound.startTitleBGM();
  titleScene.refreshSaveStatus();
}

// Right panel, bottom: skills (J, K, L, Space, E) and options (Q, I, C, M, N, Esc, H)
function toggleAutoAttack() {
  if (!["PLAYING", "PAUSED", "SELECT"].includes(gameState) || !player) return;
  const on = player.toggleAutoAttack();
  autoAdventure.reset();
  if (on && (dialog.open || gameState === "SELECT" && codexScene.mode === "awaken")) {
    autoAdventure.dialogOwned = true; autoAdventure.dialogAt = Date.now();
  }
  questHud.toast(t(on ? "autoAdventureOn" : player.autoAttackTime() > 0 ? "autoAdventureOff" : "autoAdventureExpired"));
  saveGame();
}

const actionPanel = new ActionPanel({
  autoAttack: toggleAutoAttack,
  quests: () => {
    Sound.init();
    if (gameState === "PLAYING" && !dialog.open && !actReader.open && !showShopModal && !showMercModal) {
      inventory.close();
      questHud.toggleLog(quest, player, summonerName(), mentorName());
    }
  },
  inventory: () => { Sound.init(); toggleInventory(); panelSound(inventory.open); },
  character: () => { Sound.init(); toggleCharacter(); panelSound(charPanel.open); },
  quick: (i) => { Sound.init(); if (gameState === "PLAYING" && !dialog.open) quickUse(i); },
  pause: () => {
    Sound.init();
    if (dialog.open || actReader.open) return;
    if (questHud.logOpen) questHud.closeLog();
    inventory.close();
    togglePause();
  },
  menu: () => {
    Sound.init();
    if (dialog.open || actReader.open || !player) return;
    worldMap.close();
    exitToTitle();
  },
  map: () => { Sound.init(); toggleMap(); panelSound(worldMap.open); },
  codex: () => { Sound.init(); toggleCodex(); panelSound(codexScene.open); },
  workshop: () => { Sound.init(); openWorkshop(); },
  settings: () => { Sound.init(); toggleSettings(); },
  market: () => { Sound.init(); toggleMarket(); },
  fullscreen: () => { Sound.init(); toggleFullscreen(); },
  slotsChanged: () => { if (Sound.playSelectMove) Sound.playSelectMove(); saveGame(); }
});

// Soft page-turn when a side panel opens or closes
function panelSound(open) {
  if (open) { if (Sound.playUiOpen) Sound.playUiOpen(); } else if (Sound.playUiClose) Sound.playUiClose();
}

// Act intro cinematic: plays when the story moves on to a new Act during play (not on loading a save)
const actIntro = new ActIntro();
let actIntroShown = null;
let pendingToast = null;
function maybeActIntro() {
  if (!player) return;
  const a = quest.act();
  if (actIntroShown !== null && a > actIntroShown) {
    const label = quest.text(player, summonerName(), mentorName()).act || "";
    actIntro.start(a, label.includes("·") ? label.split("·").slice(1).join("·").trim() : label);
    controller.clearAll();
  }
  actIntroShown = a;
}

quest.onChange = () => {
  maybeActIntro();
  npcManager.applyQuest(quest, playerClass());
  syncLoreAct();
  syncPlatformFlags();
  syncBoss();
  if (player) {
    const goal = quest.text(player, summonerName(), mentorName()).goal;
    if (actIntro.open) pendingToast = goal;   // shown when the Act intro ends
    else questHud.toast(goal);
    if (Sound.playQuest) Sound.playQuest();
  }
  saveGame();
};

// ==================== TRAVELLING BETWEEN PLATFORMS (Acts VII–XV) ====================
const lang = () => (getLang() === "fil" ? "fil" : "en");
const fillNames = (lines) => lines.map((s) => s.replace(/\{s\}/g, summonerName()).replace(/\{h\}/g, (player && player.heroName) || "Champion"));

// Platform flags from the quest: boss defeated, rift to the Maw open
function syncPlatformFlags() {
  Object.values(platformCache).forEach((p) => {
    p.cleared = quest.cleared(p.id);
    if (p.def.rift) p.riftOpen = quest.unlocked(p.def.rift.dest);
    p.miningUnlocked = quest.mining === 2;
    if (p.trail) p.trailSealed = !quest.unlocked(p.trail.dest);
    // Celestial Monolith: chained until the Leviathan Regent falls; awakened once the Seal Stones are placed
    if (p.boatSystem) {
      p.boatSystem.chained = !p.cleared;
      p.boatSystem.monolith.activated = quest.monolith;
      p.boatSystem.seaPortal.active = quest.monolith;
    }
  });
}

// A cleared Act VII–X platform whose Seal Stone the player lacks (e.g. an older save, or a dropped stone)
// gets the stone back in its boss arena, so the monolith can never become impossible to awaken.
function restoreSealStone() {
  const def = stage === hub ? null : stage.def;
  if (!def || !def.seal || quest.monolith || !quest.cleared(def.id)) return;
  if (player.bag.has(def.seal) || lootManager.items.some((it) => it.id === def.seal)) return;
  lootManager.drop({ x: def.arena.x + def.arena.w / 2, y: def.arena.y + def.arena.h / 2 }, { id: def.seal, qty: 1 }, true);
}

// The boss appears when it is the quest objective and its quest item isn't found yet
function syncBoss() {
  if (!player || stage === hub) return;
  const def = stage.def;
  if (!quest.wantsBoss(stage.id) || enemyManager.boss()) return;
  if (player.bag.has(def.item) || lootManager.items.some((it) => it.id === def.item)) return;
  enemyManager.spawnBoss(def.boss, def.bossSpawn.x, def.bossSpawn.y, player.level);
}

// Everyone travelling with the hero, who boards the ship with them: mercenaries, summons, and any
// pet or familiar listed in player.companions (entities with x / y; flying: true perches in the rigging)
function crewOf() {
  if (!player) return [];
  const away = (c) => (c === player.falconCompanion && isAway(player, "falcon")) || (c === player.familiar && isAway(player, "familiar"));
  return [...mercManager.mercenaries, player.falconCompanion, ...(player.angelCompanions || []), ...(player.companions || [])].filter((c) => c && !away(c));
}

// Move to another place. at = { x, y } (player pixels) or nothing for the default arrival.
// Portal travel behind the loading screen (js/loading.js): the old place is torn down and the new
// one built while the screen shows, then play resumes. Loading a save, dev tools and tests use
// travelTo directly.
const loadingScreen = new LoadingScreen();
function warpTo(id) {
  const def = PLATFORMS[id] || FRONTIERS[id];
  gameState = "LOADING";
  loadingScreen.start(def ? def.name[lang()] : t("placeHub"), () => travelTo(id));
}

// A platform left behind is torn down (its baked map canvases are 10–15 MB each); it is rebuilt from
// its seed on the next visit and its flags come back from the quest. The ship's mooring is kept.
function teardownPlatform(p) {
  if (!p || p === hub || p === stage) return;
  if (p.boatSystem) savedShip = p.boatSystem.serialize(null);
  if (p.destroy) p.destroy();
  Object.keys(platformCache).forEach((k) => { if (platformCache[k] === p) delete platformCache[k]; });
}

function travelTo(id, at = null) {
  const from = stage.id;
  const leaving = stage;
  lockedTarget = null;
  // Leaving at sea (the Celestial Monolith's portal): the hero crosses alone and the ship sails
  // itself back to its berth at the pier, where the hero can walk to it on the way back
  if (player.inBoat && stage.boatSystem) stage.boatSystem.returnToPier();
  stage = platformById(id);
  teardownPlatform(leaving);
  syncPlatformFlags();
  let spot = at || (stage === hub ? hub.arrivalFrom(from) : stage.arrivalFrom(from));
  // Arriving on foot: the ship stays behind in the Cerulean Abyss
  player.inBoat = false;
  crewOf().forEach((c) => { c.aboard = false; });
  // A saved spot in the water or inside an obstacle (an old save made at sea): the nearest dry ground
  if (at) {
    const dry = findNearestWalkableSpot(spot.x + 10, spot.y + 20, stage);
    spot = { x: dry.x - 10, y: dry.y - 20 };
  }
  // A ship moored where no shore can be walked to sails back to the pier
  if (stage.boatSystem) stage.boatSystem.checkMooring();
  player.x = spot.x;
  player.y = spot.y;
  player.portalCooldown = 75;
  camera.update(player.x, player.y);

  npcManager.setPlatform(stage.id);
  npcManager.applyQuest(quest, playerClass());
  dayNight.setPlace(stage.id);
  worldMap.stage = stage;
  worldMap.close();
  const def = stage === hub ? null : stage.def;
  enemyManager.setArea(stage, def ? def.monsters : undefined, def ? def.tier : 0, def ? def.elites : undefined, def ? def.levels : null);
  enemyManager.init(player.level);
  projectileManager.clear();
  lootManager.clear();
  // Mercenaries and summons follow
  mercManager.mercenaries.forEach((m, k) => { m.x = player.x - 16 + k * 10; m.y = player.y + 14; });
  if (player.falconCompanion) { player.falconCompanion.x = player.x - 22; player.falconCompanion.y = player.y - 18; }
  if (player.familiar) player.familiar.place(player);
  (player.angelCompanions || []).forEach((a, k) => { a.x = player.x + (k ? 30 : -30); a.y = player.y - 16; });

  if (fx.spawnHitSparks) fx.spawnHitSparks(player.x + 10, player.y + 10, def ? def.color : "#ffd166", 22);
  if (Sound.playPortal) Sound.playPortal();

  // A frontier map: its name and level band in the log
  if (def && def.frontier) {
    fx.spawnDamagePopup(player.x + 10, player.y - 14, def.name[lang()].toUpperCase(), true, def.color);
    chatLog.event("info", def.text[lang()].arrive, dayNight.label());
  }
  // First arrival on the current Act's platform: the summoner greets the hero
  if (def && !def.frontier && quest.step === quest.baseStep(id)) {
    quest.onArrive(id);
    const s = npcManager.find(npcManager.summonerId);
    if (player.autoAttack.until) { autoAdventure.dialogOwned = true; autoAdventure.dialogAt = Date.now(); }
    dialog.start(npcManager.summonerId, s && s.avatar, fillNames(def.text[lang()].arrive));
  }
  syncBoss();
  restoreSealStone();
  if (id === "ash") pipHasMushroom = Math.random() < 0.3;
  saveGame();
}

// Entering a gateway / gate / rift / the sea portal
function handlePortal(portal) {
  if (!player) return;
  const dest = portal.dest;
  if (portal.id === "RETURN") return warpTo(portal.dest || "hub");
  if (portal.id === "DARK_CONTINENT_PORTAL" || dest === "dark_continent") {
    // The Celestial Monolith portal is the only way to the Dark Continent (Acts XI–XV); it opens onto
    // the furthest Dark Continent Act reached so far
    const open = DARK_CONTINENT.filter((pid) => quest.unlocked(pid));
    if (!open.length) {
      fx.spawnDamagePopup(player.x + 10, player.y - 10, lang() === "fil" ? "SELYADO · ACT XI" : "SEALED · ACT XI", false, "#94a3b8");
      return;
    }
    warpTo(open[open.length - 1]);
    if (fx && fx.spawnDamagePopup) {
      fx.spawnDamagePopup(player.x + 10, player.y - 12, lang() === "fil" ? "🌌 DARK CONTINENT" : "🌌 THE DARK CONTINENT", true, "#9d4edd");
    }
    return;
  }
  if (portal.id === "CITADEL_GATE") {
    // The Citadel gate is only a shortcut back to the Barracks (the Dark Continent is reached by sea)
    player.x = hub.safeZone.x + hub.safeZone.w / 2 - 10;
    player.y = hub.safeZone.y + hub.safeZone.h - 30;
    if (fx.spawnHitSparks) fx.spawnHitSparks(player.x + 10, player.y + 10, "#38bdf8", 16);
    if (Sound.playPortal) Sound.playPortal();
    return;
  }
  if (dest && dest !== "hub" && areaDef(dest)) {
    if (!quest.unlocked(dest)) {
      const act = FRONTIERS[dest] ? FRONTIERS[dest].unlockAct : PLATFORMS[dest].act;
      fx.spawnDamagePopup(player.x + 10, player.y - 10, lang() === "fil" ? `SELYADO · ACT ${act}` : `SEALED · ACT ${act}`, false, "#94a3b8");
      return;
    }
    warpTo(dest);
  }
}

// Labels of the hub's Warp Gateways (and the Wayfarer's Gate): the place's name, sealed until its Act
hub.portals.stateOf = (p) => ({
  sealed: !quest.unlocked(p.dest),
  label: areaDef(p.dest) ? areaName(p.dest, lang()).toUpperCase() : ""
});

// ==================== SIDE QUESTS (Book I, js/sidequest.js) ====================
// Progress messages, rewards, and the main quest resuming once the Act's side quests are all done
function sideProgress(results) {
  if (!results.length || !player) return;
  const side = quest.side;
  let finished = false;
  results.forEach(({ q, trophy, finished: done }) => {
    if (trophy && !done) {
      chatLog.event("loot", side.message("trophyGot", { monster: side.monsterName(q), have: q.have, n: q.n }), dayNight.label());
    }
    if (!done) return;
    finished = true;
    const r = side.reward(q);
    player.addExp(r.exp);
    player.gold += r.gold;
    questHud.toast(`${side.message("done")}: ${side.text(q, false)}`);
    chatLog.event("exp", `${side.message("done")} · ${side.message("reward", r)}`, dayNight.label());
    if (Sound.playJingle) Sound.playJingle("quest");
  });
  if (!finished) return;
  if (side.complete()) {
    questHud.toast(side.message("all"));
    npcManager.applyQuest(quest, playerClass());
    syncBoss();
  }
  saveGame();
}

// Where the arrow points while the main quest waits: the site to scout, or the gate toward the side quest's map
function sideQuestPoint() {
  const q = quest.side.current();
  if (!q) return null;
  if (q.area === stage.id) {
    const s = quest.side.site(q);
    return s ? { x: s.x, y: s.y } : null;
  }
  if (stage === hub) {
    const f = FRONTIERS[q.area];
    const g = hub.portals.portals.find((p) => p.dest === q.area) || (f && hub.portals.portals.find((p) => p.dest === f.from));
    return g ? { x: g.x, y: g.y } : null;
  }
  if (stage.trail && stage.trail.dest === q.area) return { x: stage.trail.x, y: stage.trail.y };
  return { x: stage.gate.x, y: stage.gate.y };
}

// Boss defeated: pick up the quest item
enemyManager.onBossDefeated = (e) => {
  party.onBossDefeated(stage.id).forEach((id) => chatLog.event("info", party.progressText(id, player.bag), dayNight.label()));
  const item = stage.def && stage.def.item;
  questHud.toast(lang() === "fil" ? `Natalo si ${e.kind.name.fil}! Pulutin ang iniwan niya.` : `${e.kind.name.en} has fallen! Claim what was left behind.`);
  if (item) fx.spawnDamagePopup(e.x + 10, e.y - 40, "✦ QUEST ITEM ✦", true, "#facc15");
  // Acts VII–X bosses also leave one of the four Seal Stones for the Celestial Monolith
  const seal = stage.def && stage.def.seal;
  if (seal && !quest.monolith && !player.bag.has(seal)) lootManager.drop({ x: e.x + 22, y: e.y + 12 }, { id: seal, qty: 1 }, true);
};
lootManager.onQuestItem = (id) => {
  quest.onQuestItem(id);
  // Satan's Astral Ash: the end of Book I — Continue, or Regress one difficulty harder
  if (id === "astralAsh") { saveGame(); setTimeout(() => { if (player && player.hp > 0) regressionModal.show(); }, 900); }
};
// Bottom tray: EXP from the hero's kills (merged while chaining kills), or a note when an ally took the last hit
enemyManager.onKill = (e, byPlayer, exp) => {
  if (byPlayer && player) guildBook.progress(player, stage.id, e);
  if (byPlayer && player) guildField.onKill(player, stage, e, lootManager);
  codex.recordKill(e.key);
  if (e.elite) party.onEliteKill(stage.id).forEach((id) => chatLog.event("info", party.progressText(id, player.bag), dayNight.label()));
  sideProgress(quest.side.onKill(e, stage.id));
  const fil = lang() === "fil";
  const name = enemyManager.displayName(e);
  if (!byPlayer) {
    chatLog.event("info", "", dayNight.label(), {
      key: "allykill", value: 1,
      format: (n) => (n > 1
        ? (fil ? `Kakampi ang huling tumama sa ${n} halimaw — walang EXP o samsam` : `Allies landed the last hit on ${n} foes — no EXP or loot`)
        : (fil ? `Kakampi ang huling tumama kay ${name} — walang EXP o samsam` : `An ally landed the last hit on ${name} — no EXP or loot`))
    });
    return;
  }
  if (quest.mining === 1 && stage.id === "ash" && quest.miningKills < MINING_KILLS) {
    quest.miningKills++;
    if (quest.miningKills === MINING_KILLS) {
      questHud.toast(fil ? "Tapos ang Tungkulin ng Thane — bumalik kay Thane Durgrim" : "The Thane's Charge is done — return to Thane Durgrim");
      saveGame();
    } else if (quest.miningKills % 5 === 0) {
      chatLog.event("info", fil ? `Tungkulin ng Thane: ${quest.miningKills}/${MINING_KILLS}` : `The Thane's Charge: ${quest.miningKills}/${MINING_KILLS}`, dayNight.label());
    }
  }
  chatLog.event("exp", "", dayNight.label(), {
    key: "exp", value: exp,
    format: (n, total) => (n > 1
      ? (fil ? `+${total} EXP mula sa ${n} halimaw` : `+${total} EXP from ${n} kills`)
      : (fil ? `+${total} EXP — natalo si ${name}` : `+${total} EXP — defeated ${name}`))
  });
};
// A monster dropped a Unique (Legendary) or Set piece (Mythic): the pillar marks where it fell
lootManager.onRareDrop = (pos, it, rarity) => celebrate({ ...pos, point: true }, rarity, t(rarity === "MYTHIC" ? "cerMythic" : "cerLegendary"), it.name);
// Bottom tray: gold and items picked up (consecutive identical pickups merge)
lootManager.onCollect = (it) => {
  if (player && it.guildSource) guildBook.collect(player, stage.id, it.id, it.guildSource, it.qty);
  const fil = lang() === "fil";
  if (it.gold) {
    chatLog.event("loot", "", dayNight.label(), {
      key: "gold", value: it.gold,
      format: (n, total) => (fil ? `Napulot ang ${formatCoins(total)}` : `Picked up ${formatCoins(total)}`)
    });
    return;
  }
  if (SEAL_STONES.includes(it.id) && !quest.monolith && SEAL_STONES.every((id) => player.bag.has(id))) {
    questHud.toast(fil ? "Kumpleto ang apat na Seal Stone! Dalhin sa Celestial Monolith sa Cerulean Abyss." : "All four Seal Stones! Take them to the Celestial Monolith in the Cerulean Abyss.");
  }
  chatLog.event("loot", "", dayNight.label(), {
    key: `loot:${it.name}`, value: it.qty,
    format: (n, total) => (fil ? `Napulot ang ${it.name}${total > 1 ? ` ×${total}` : ""}` : `Picked up ${it.name}${total > 1 ? ` ×${total}` : ""}`)
  }, it.color);
};

// Talking to the summoner at a platform camp
function talkField(npc) {
  const def = PLATFORMS[npc.platform];
  const T = def.text[lang()];
  if (quest.canDeliver(def.id) && player.bag.has(def.item)) {
    dialog.start(npc.id, npc.avatar, fillNames(T.deliver), () => {
      player.bag.take(def.item, 1);
      quest.onDeliver(def.id);
      if (fx.spawnHitSparks) fx.spawnHitSparks(npc.x, npc.y - 20, "#ffd166", 30);
    });
    return;
  }
  const lines = quest.cleared(def.id) ? [T.deliver[0]] : quest.wantsBoss(def.id) ? T.hint : [T.arrive[0]];
  dialog.start(npc.id, npc.avatar, fillNames(lines));
}

let gameState = "TITLE";
let player = null;
let party = new Party();   // hero + recruited playable NPCs; one is on the field (js/party.js)
const partyHud = new PartyHud();
let showShopModal = false;
let showMercModal = false;

// ========================================================
// SECURE EXPORT & IMPORT SAVE SYSTEM (.VOF SECURE FORMAT)
// ========================================================
function getSavePayload() {
  if (!player || player.hp <= 0) return null;
  return {
    game: "Vanguard of Fate",
    version: "2.5.0",
    savedAt: new Date().toISOString(),
    heroId: player.heroData.id,
    name: player.heroName || "",
    avatar: player.avatarConfig || null,   // look from the Character Creator
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
    party: party.serialize(player),         // members, who is on the field, each one's HP (js/party.js)
    playables: party.book.serialize(),      // recruitment trials of the playable NPCs
    bag: player.bag.serialize(),            // bag and worn equipment
    stats: { ...player.stats },             // STR/AGI/VIT/INT/DEX/LUK
    skills: { ...player.skillLevels },
    autoAttack: { ...player.autoAttack },
    autoAdventureClass: player.autoAdventureClass,
    skillPoints: player.skillPoints,
    pathPoints: player.pathPoints,
    pathSlots: [...(player.pathSlots || [])],   // path actives on T / Y / U
    style: { ...player.style },                    // play-style affinity (js/skillpaths.js)
    autoStat: player.autoStat || "off",
    autoSkill: Boolean(player.autoSkill),
    autoPath: player.autoPath || "off",
    guild: guildBook.state(player),
    belt: [...player.belt],
    skillKeys: SkillSlots.serialize(),      // J/K/L arrangement on the hotbar (skill book, P)
    autoPot: { ...player.autoPot },
    life: Workshop.serialize(player),       // craft target, active meal, market saturation
    errand: serializeErrand(player),        // a summon away on a market errand (js/errand.js)
    codex: codex.serialize(),
    regression: serializeRegression(),      // difficulty, cleared difficulties, learned jobs (js/regression.js)
    earth: player.earthLook || null,        // the Earth clothes from the Character Creator (a regression restarts in them)
    dayTick: dayNight.serialize(),
    platform: stage.id,                     // "hub" or an Act platform
    ship: shipState(),                      // the Cerulean Abyss ship: mooring, heading, hero aboard
    x: player.x,
    y: player.y
  };
}

// Skill paths from a save: slots only take learned actives, style values must be finite numbers
function loadPaths(p, data) {
  if (data.style) PATH_IDS.forEach((k) => { const v = Number(data.style[k]); p.style[k] = Number.isFinite(v) && v > 0 ? Math.min(v, 1e4) : 0; });
  if (Array.isArray(data.pathSlots)) SLOT_KEYS.forEach((_, i) => assignSlot(p, i, typeof data.pathSlots[i] === "string" ? data.pathSlots[i] : null));
  p.autoStat = AUTO_MODES.includes(data.autoStat) ? data.autoStat : "off";
  p.autoSkill = data.autoSkill === true;
  p.autoPath = AUTO_MODES.includes(data.autoPath) ? data.autoPath : "off";
}

function saveGame() {
  const data = getSavePayload();
  if (!data) return;
  try {
    localStorage.setItem("vanguard_savegame", JSON.stringify(data));
    titleScene.refreshSaveStatus();
  } catch (e) {}
}

// 1. Export as Encrypted .vof (Vanguard of Fate Protected Save)
function exportSaveFile() {
  const payload = getSavePayload();
  if (!payload) return;
  saveGame();

  try {
    const secureContent = SaveSecurity.exportSecureSave(payload);
    const blob = new Blob([secureContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeHero = (player.heroName || "hero").replace(/[^a-zA-Z0-9_-]/g, "_");
    a.download = `vanguard_save_${safeHero}_${Date.now()}.vof`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (fx && fx.spawnDamagePopup) {
      fx.spawnDamagePopup(player.x + 10, player.y - 12, "🔒 ENCRYPTED SAVE EXPORTED (.VOF)", true, "#4ade80");
    }
  } catch (err) {
    console.error("Export save failed:", err);
    alert(lang() === "fil" ? "Pumalya ang pag-export ng secure save file." : "Failed to export secure save file.");
  }
}

// 2. Import via .vof / .json File Dialog with Cryptographic & Anti-Tamper Verification
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
        const fileContent = event.target.result;
        const result = SaveSecurity.importSecureSave(fileContent);

        if (!result.success) {
          alert(result.error || (lang() === "fil" ? "Hindi ligtas o binago ang nilalaman ng save file!" : "Invalid or tampered save file!"));
          return;
        }

        const json = result.data;
        if (!json.heroId || !json.level) {
          alert(t("invalidSave"));
          return;
        }

        localStorage.setItem("vanguard_savegame", JSON.stringify(json));
        titleScene.refreshSaveStatus();
        loadGame();

        if (result.isLegacy) {
          console.log("[SaveSecurity] Upgraded legacy save to encrypted format.");
        }
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
      : equipJob(ROSTER.find((h) => h.id === data.heroId) || ROSTER[0], data.avatar);
    player = new Player(data.x || hub.width / 2, data.y || hub.height / 2, foundHero);
    player.heroName = data.name || "";
    player.avatarConfig = data.avatar || foundHero.avatarConfig || null;

    player.level = data.level || 1;
    player.exp = data.exp || 0;
    player.expNext = expFor(player.level);          // new EXP curve (not the old one from the save)
    player.exp = Math.min(player.exp, player.expNext - 1);
    player.gold = Number.isFinite(data.gold) ? Math.max(0, data.gold) : 150;
    player.statPoints = data.statPoints || 0;
    player.bonusHp = data.bonusHp || 0;
    player.bonusDamage = data.bonusDamage || 0;
    player.bonusDefense = data.bonusDefense || 0;
    player.bonusSpeed = data.bonusSpeed || 0;
    player.bonusCrit = data.bonusCrit || 0;
    player.bonusCooldown = data.bonusCooldown || 0;

    // Stat builder and skill tree. Old save (no stats): refund the points to rebuild
    if (data.stats) {
      Object.keys(player.stats).forEach((k) => { player.stats[k] = Math.max(1, Math.min(99, data.stats[k] | 0 || 1)); });
      player.skillLevels = { ...(data.skills || {}) };
      loadSkillPoints(player, data);
      loadPaths(player, data);
    } else {
      player.statPoints = (data.statPoints || 0) + 10 + (player.level - 1) * 3;
      player.skillPoints = player.level - 1;
      player.pathPoints = player.level - 1;
    }
    player.autoAdventureClass = ["knight", "mage", "archer", "priest", "fighter"].includes(data.autoAdventureClass) ? data.autoAdventureClass : "knight";
    guildBook.load(player, data.guild);
    autoAdventure.reset();
    if (data.autoAttack && typeof data.autoAttack === "object") {
      const a = data.autoAttack;
      player.autoAttack = {
        remainingMs: Number.isFinite(a.remainingMs) ? Math.max(0, a.remainingMs) : 0,
        until: Number.isFinite(a.until) ? Math.max(0, a.until) : 0
      };
      player.autoAttackTime();
    }
    dayNight.load(data.dayTick);
    codex.load(data.codex);
    if (Array.isArray(data.belt)) player.belt = data.belt.slice(0, 4).map((x) => x || null);
    SkillSlots.load(data.skillKeys);
    if (data.autoPot) player.autoPot = { hp: data.autoPot.hp | 0, cure: Boolean(data.autoPot.cure), stamina: Boolean(data.autoPot.stamina) };
    // Bag: an old save without a bag → the class's default gear
    if (data.bag) player.bag.load(data.bag);
    else starterKit(player);
    attachBag(player);
    Workshop.load(player, data.life);
    loadErrand(player, data.errand);
    player.hp = Math.min(player.maxHp, data.hp || player.maxHp);
    party = new Party(data.party, data.playables);
    party.apply(player);
    quest.load(data.quest, player);
    loadRegression(data.regression);
    if (data.earth && typeof data.earth === "object") player.earthLook = normalizeConfig(data.earth);
    // A hero who already awakened has at least that calling on record
    if (player.heroData.id !== "novice" && !regression.jobs.includes(player.heroData.id)) regression.jobs.unshift(player.heroData.id);
    grantScroll();

    if (foundHero.id === "archer") {
      player.falconCompanion = new FalconCompanion(player.x, player.y);
    }

    beginPlaying();
    // Return to the platform where the game was saved (if the quest still allows it)
    const saved = data.platform && data.platform !== "hub" && areaDef(data.platform) && quest.unlocked(data.platform) ? data.platform : null;
    savedShip = data.ship && typeof data.ship === "object" ? data.ship : null;
    Object.values(platformCache).forEach((c) => { if (c.boatSystem && !c.boatSystem.load(savedShip)) c.boatSystem.returnToPier(); });
    if (saved) travelTo(saved, { x: player.x, y: player.y });
    // Saved at sea: back at the helm where the ship was
    if (saved && stage.boatSystem && savedShip && savedShip.aboard === true && stage.boatSystem.load(savedShip)) stage.boatSystem.embark(player, crewOf());
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

// Starting gear: the class kit (tier 1 once there is a class) + some potions
function starterKit(p) {
  const cls = p.heroData.id;
  p.bag.giveKit(cls, cls === "novice" ? 0 : 1);
  p.bag.add("salve", 3);
  p.bag.add("tonic", 1);
}

// Common reset when entering the game (new game or load)
function beginPlaying() {
  guildPanel.close(); guildCeremony.close(); setGuildHallOpen(hub, guildBook.available(quest));
  controller.clearAll();
  chatLog.clear();
  stage = hub;
  worldMap.stage = hub;
  dayNight.setPlace("hub");
  npcManager.build(summonerIdFor(player.avatarConfig));
  npcManager.setPlatform("hub");
  syncPartyNpcs();
  npcManager.applyQuest(quest, playerClass());
  syncLoreAct();
  syncPlatformFlags();
  gameState = "PLAYING";
  showShopModal = false;
  showMercModal = false;
  fx.reset();
  enemyManager.setArea(hub);
  enemyManager.player = player;
  enemyManager.init(player.level);
  projectileManager.clear();
  lootManager.clear();
  Sound.stopTitleBGM();
  if (gameConfig.music) Sound.startGameplayBGM();
}

function backToTitle() {
  guildPanel.close(); guildCeremony.close(); guildPanel.tracker.hidden = true;
  controller.clearAll();
  actIntro.close();
  actIntroShown = null;
  gameState = "TITLE";
  player = null;
  syncLoreAct();
  Sound.stopGameplayBGM();
  if (gameConfig.music) Sound.startTitleBGM();
  titleScene.refreshSaveStatus();
}

// ==================== JOB AWAKENING (Act IV: the Imperial Citadel's audience dais) ====================
// Starts after talking to the summoner at the Citadel (quest step 4).
function canAwaken(p) {
  return p && p.heroData.id === "novice" && quest.step === 4 && quest.gateOpen();
}

function startAwakening() {
  controller.clearAll();
  // Preview: the player wearing each class's gear
  codexScene.show("awaken");
  gameState = "SELECT";
  Sound.stopGameplayBGM();
  if (Sound.playHolyBurst) Sound.playHolyBurst();
}

// Replaces the Novice with the chosen class; keeps level, exp, gold and name.
// Stats and skills are reset with every point refunded, so the new job is built from scratch.
function awaken(chosenHero) {
  const old = player;
  party.heroOnField(old);
  // Same look from the Character Creator; the class provides the new gear
  const p = new Player(old.x, old.y, equipJob(chosenHero, old.avatarConfig));
  ["level", "exp", "expNext", "gold", "statPoints", "bonusHp", "bonusDamage",
    "bonusDefense", "bonusSpeed", "bonusCrit", "bonusCooldown", "heroName", "avatarConfig",
    "stats", "skillLevels", "skillPoints", "pathPoints", "autoAttack", "autoAdventureClass", "belt", "autoPot", "style", "pathSlots", "autoStat", "autoSkill", "autoPath", "guild"].forEach((k) => { p[k] = old[k]; });
  // Keeps the bag; the summoner hands over the class's custom-forged weapon (LORE Act IV)
  p.bag = old.bag;
  p.bag.giveKit(chosenHero.id, 1);
  attachBag(p);
  if (!regression.jobs.includes(chosenHero.id)) regression.jobs.push(chosenHero.id);
  p.respec();
  p.hp = p.maxHp;
  if (chosenHero.id === "archer") p.falconCompanion = new FalconCompanion(p.x, p.y);
  player = p;

  controller.clearAll();
  gameState = "PLAYING";
  if (fx.spawnHitSparks) fx.spawnHitSparks(p.x + 10, p.y + 10, "#ffd166", 28);
  if (Sound.playAwakening) Sound.playAwakening();
  celebrate(p, "MYTHIC", t("cerJob"), t("cerJobSub", chosenHero.name));
  if (gameConfig.music) Sound.startGameplayBGM();
  quest.advance(5);   // Act V: Dual Equipment Matrix

  // The summoner gives the weapon and the title of Field Commander
  const summoner = npcManager.find(npcManager.summonerId);
  const d = getDialogue(npcManager.summonerId, {
    step: quest.step, cls: p.heroData.id, met: quest.met, summoner: npcManager.summonerId, justAwakened: true
  });
  dialog.start(npcManager.summonerId, summoner && summoner.avatar, d.lines);
}

// ==================== PARTY (playable NPCs, js/party.js) ====================
const partyName = (id) => memberName(id, player ? player.heroName || partyText("hero") : "");

// Recruited members leave their post in the world while they travel with the party
function syncPartyNpcs() {
  npcManager.setParty(party.members.filter((id) => id !== "hero"), party.activeId);
}

// i = member index, or -1 for the next one standing
function switchMember(i) {
  if (!player || party.size < 2) return;
  const id = i < 0 ? party.next(player) : party.switchTo(i, player);
  if (!id) return;
  lockedTarget = null;
  if (fx.spawnHitSparks) fx.spawnHitSparks(player.x + 10, player.y + 10, "#a5f3fc", 16);
  if (Sound.playSelectConfirm) Sound.playSelectConfirm();
  chatLog.event("info", partyText("switched", { name: partyName(id) }), dayNight.label());
  syncPartyNpcs();
}

function onRecruited(id) {
  syncPartyNpcs();
  questHud.toast(partyText("joined", { name: partyName(id), key: Keybinds.label("partyNext") }));
  if (Sound.playQuestComplete) Sound.playQuestComplete();
  saveGame();
}

// Talking to an NPC (E). After the last line: quest + the NPC's service
function talkTo(npc, automated = false) {
  if (automated && npc.id === "guildClerk" && guildBook.state(player).active?.have >= (guildBook.objective(player)?.n || Infinity)) {
    const result = guildBook.claim(player, guildContext());
    questHud.toast(guildText(result.error || "ok"));
    if (result.error) player.toggleAutoAttack();
    saveGame(); return;
  }
  const supply = guildField.supply(player, stage, npc);
  if (supply) { questHud.toast(guildText(supply)); saveGame(); return; }
  if (GUILD_NPCS[npc.id]) { controller.clearAll(); guildPanel.show(npc.id, player, guildContext()); return; }
  autoAdventure.dialogOwned = automated;
  if (automated) autoAdventure.dialogAt = Date.now();
  codex.meet(npc.id);
  if (npc.tag === "field") return talkField(npc);
  const place = npc.platform, pdef = PLATFORMS[place];
  const d = getDialogue(npc.id, {
    step: quest.step, cls: playerClass(), met: quest.met, summoner: npcManager.summonerId,
    // for the guides: Maren's recap, Isolde's sea advice, Veyra's and Aldric's camp lines
    act: quest.act(), goal: quest.text(player, summonerName(), mentorName()).goal, done: quest.step >= FINAL_STEP,
    place, boss: pdef && pdef.boss, cleared: Boolean(pdef && quest.cleared(place)),
    sealsReady: quest.monolith || SEAL_STONES.every((s) => player.bag.has(s))
  });
  // Playable NPCs: their recruitment trial (offer → progress → joining the party) follows their own lines
  const trial = party.talk(npc.id, player.bag);
  if (trial && trial.joined) onRecruited(npc.id);
  const lines = [...fillNames(d.lines), ...(trial ? trial.lines : [])];
  dialog.start(npc.id, npc.avatar, lines, () => {
    quest.onTalk(npc.id, npcManager.summonerId, playerClass());
    npcManager.applyQuest(quest, playerClass());
    saveGame();   // records who has been spoken to
    if (autoAdventure.dialogOwned && player.autoAttack.until > 0 && d.action !== "awaken") return;
    if (d.action === "shop") { showShopModal = true; showMercModal = false; }
    else if (d.action === "merc") { showShopModal = false; openRonaldMenu(); }
    else if (d.action === "smith") openSmithMenu();
    else if (d.action === "repair") openService("repair", { repairMult: 1, serviceName: npcName("hilde") });
    else if (d.action === "dwarfShop") openDwarfShop();
    else if (d.action === "noble") openNobleMenu();
    else if (d.action === "awaken" && canAwaken(player)) startAwakening();
  });
}

const titleScene = new TitleScene(
  () => {
    controller.clearAll();
    codexScene.show("create");
    gameState = "CREATE";
  },
  () => {
    controller.clearAll();
    if (!loadGame()) {
      codexScene.show("create");
      gameState = "CREATE";
    }
  },
  exportSaveFile,
  importSaveFile,
  gameConfig,
  document.getElementById("title")
);
// Options → Quality changes the drawing scale right away
titleScene.onConfigChange = (key) => applyConfig(key);

// New expedition: Character Creator → Act I Prologue → Novice in the Barracks
const prologueScene = new PrologueScene(
  document.getElementById("prologue"),
  () => {
    titleScene.flash();
    beginPlaying();
    saveGame();
  }
);

// One entity viewer for the Character Creator, the Job Awakening and the Codex (N)
const codexScene = new CodexScene(document.getElementById("codexScene"), {
  codex,
  roster: ROSTER,
  getPlayer: () => player,
  getAct: () => (player ? quest.act() : 1),
  hasSave: () => Boolean(localStorage.getItem("vanguard_savegame")),
  // New expedition: Character Creator → Act I Prologue → Novice in the Barracks
  onBegin: (config, name) => {
    codexScene.close();
    // Earth clothes in the prologue; the summoning gives the Novice's garb, dagger and buckler
    player = new Player(hub.width / 2, hub.height / 2, getNovice(summonedGarb(config), name));
    player.heroName = name;
    player.avatarConfig = player.heroData.avatarConfig;
    player.earthLook = { ...config };
    party = new Party();
    starterKit(player);
    SkillSlots.reset();
    attachBag(player);
    quest.reset();
    codex.reset();
    resetRegression();      // a new soul: Easy, nothing cleared
    prologueScene.start(name, config);
  },
  onContinue: () => {
    controller.clearAll();
    codexScene.close();
    if (!loadGame()) codexScene.show("create");
  },
  onSaves: () => { codexScene.close(); controller.clearAll(); gameState = "TITLE"; titleScene.goTo("options", "export"); },
  onSettings: () => {
    if (codexScene.mode === "codex") { codexScene.close(); toggleSettings(); return; }
    codexScene.close(); controller.clearAll(); gameState = "TITLE"; titleScene.goTo("options", "music");
  },
  onBack: () => { codexScene.close(); controller.clearAll(); gameState = "TITLE"; },
  onClose: () => { codexScene.close(); panelSound(false); if (gameState === "SELECT") gameState = "PLAYING"; },
  // The Job Awakening (Lv 10): the chosen calling
  onAwaken: (chosenHero) => {
    if (codexScene.opts && codexScene.opts.jobChange) { codexScene.close(); changeJob(chosenHero); return; }
    if (canAwaken(player)) { codexScene.close(); awaken(chosenHero); }
  }
});

setLayoutMode("title");
loadSpriteSheets();   // Aseprite art over the code-drawn sprites, when exported
lorePanel = createLorePanel(document.getElementById("lore"));

// Play the title BGM right away, before any key press, if enabled in the settings
if (gameConfig.music) {
  Sound.startTitleBGM();
}

// When the browser's autoplay policy blocks it, play on the first interaction/movement
const unlockAudio = () => {
  if (Sound.ctx && Sound.ctx.state === "suspended") {
    Sound.ctx.resume().catch(() => {});
  }
  if (gameState === "TITLE" && gameConfig.music && !Sound.titleBgmInterval) {
    Sound.startTitleBGM();
  }
};
["pointerdown", "pointermove", "keydown", "touchstart", "focus"].forEach((evt) => {
  window.addEventListener(evt, unlockAudio, { passive: true });
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    e.preventDefault();
    if (e.repeat) return;
  }
  Sound.init();
  if (devTools && devTools.handleKey(e)) return;   // F9 panel: its keys never reach the game
  if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target?.tagName)) return;
  // Stop or resume automation even while reviewing a guild service or ceremony.
  if (e.code === "KeyZ" && !e.repeat && player && ["PLAYING", "PAUSED", "SELECT"].includes(gameState)) {
    toggleAutoAttack(); e.preventDefault(); return;
  }
  if (guildCeremony.open) { guildCeremony.handleInput(e); return; }
  if (guildPanel.open) {
    if (e.code === "Escape" || e.code === "F3") { guildPanel.close(); panelNav.reset(); }
    else panelNav.handle(guildPanel.el, e);
    e.preventDefault(); return;
  }
  if (e.code === "F3" && gameState === "PLAYING" && player && !dialog.open) {
    controller.clearAll(); guildPanel.show("guildClerk", player, guildContext()); e.preventDefault(); return;
  }
  if (e.code === "F2") { stage.tilemap.debug = !stage.tilemap.debug; e.preventDefault(); }

  if (regressionModal.open) { regressionModal.handleInput(e); return; }
  if (actIntro.open && gameState === "PLAYING") {
    actIntro.handleInput(e);
  } else if (prologueScene.open) {
    prologueScene.handleInput(e);
  } else if (gameState === "TITLE") {
    titleScene.handleInput(e);
  } else if (gameState === "CREATE" || gameState === "SELECT") {
    codexScene.handleInput(e);
  } else if (gameState === "GAMEOVER" && e.code === "Enter") {
    Sound.playSelectConfirm();
    backToTitle();
  } else if (actReader.open) {
    actReader.handleInput(e);
  } else if (settingsPanel.open) {
    settingsPanel.handleInput(e);
    if (!settingsPanel.open) panelSound(false);
  } else if (gameState === "PLAYING" && market.open) {
    market.handleInput(e);
    if (!market.open) panelSound(false);
  } else if (worldMap.open) {
    if (e.code === "KeyM" || e.code === "Escape") worldMap.close();
    else worldMap.handleKey(e);                              // Tab: Kontinente / Rehiyon · zoom, pan, panel
    e.preventDefault();
  } else if (gameState === "PLAYING" && dialog.open) {
    dialog.handleInput(e);
  } else if (gameState === "PLAYING" && serviceMenu.open) {
    serviceMenu.handleInput(e);
  } else if (gameState === "PLAYING" && codexScene.open) {
    codexScene.handleInput(e);
  } else if (gameState === "PLAYING" && questHud.logOpen) {
    if (e.code === "KeyQ" || e.code === "Escape") questHud.closeLog();
  } else if (gameState === "PLAYING" && inventory.open) {
    if (e.code === "KeyI" || e.code === "Escape") { inventory.close(); panelNav.reset(); }
    else panelNav.handle(document.getElementById("inventory"), e);
  } else if (gameState === "PLAYING" && charPanel.open) {
    if (e.code === "KeyC" || e.code === "Escape") { charPanel.close(); panelNav.reset(); }
    else panelNav.handle(document.getElementById("character"), e);
  } else if (gameState === "PLAYING" && actionPanel.editing && e.code === "Escape") {
    actionPanel.setEditing(false);
  } else if (gameState === "PLAYING" || gameState === "PAUSED") {
    // Shop / Mercenary modals: arrows (D-pad) choose, Enter (pad A) buys / hires
    if (gameState === "PLAYING" && (showShopModal || showMercModal)) {
      const prevK = showShopModal ? ["ArrowUp", "KeyW"] : ["ArrowLeft", "KeyA"];
      const nextK = showShopModal ? ["ArrowDown", "KeyS"] : ["ArrowRight", "KeyD"];
      const key = showShopModal ? "shopSel" : "mercSel";
      if (prevK.includes(e.code) || nextK.includes(e.code)) {
        ui[key] = ((ui[key] || 0) + (nextK.includes(e.code) ? 1 : -1) + 4) % 4;
        if (Sound.playSelectMove) Sound.playSelectMove();
        e.preventDefault();
        return;
      }
      if (e.code === "Enter" && !e.repeat) {
        const n = (ui[key] || 0) + 1;
        if (showShopModal) ui.buyShopItem(String(n), player, fx);
        else { mercManager.hire(["axe", "wand", "crossbow", "greatsword"][n - 1], player, fx); showMercModal = false; }
        e.preventDefault();
        return;
      }
    }
    // R = the lore panel's "Read more" (keyboard shortcut)
    if (e.code === "KeyR" && gameState === "PLAYING" && !showShopModal && !showMercModal) {
      openActReader();
      return;
    }

    if (e.code === "KeyI" && gameState === "PLAYING") {
      toggleInventory();
      return;
    }

    if (e.code === "KeyC" && gameState === "PLAYING") {
      toggleCharacter();
      return;
    }

    if (e.code === "KeyN" && gameState === "PLAYING") {
      toggleCodex();
      return;
    }

    // B = Market (inside a safe zone), O = Settings, F = full screen, P = arrange the skill slots
    if (e.code === "KeyB" && gameState === "PLAYING" && !showShopModal && !showMercModal && !e.repeat) {
      toggleMarket();
      return;
    }
    if (e.code === "KeyO" && !e.repeat) {
      toggleSettings();
      return;
    }
    if (Keybinds.matches("fullscreen", e) && !e.repeat) {
      toggleFullscreen();
      return;
    }
    // Party: next member (V) or member 1–6 (Shift+1–6), rebindable in Settings → Controls
    const partyKey = gameState === "PLAYING" && !e.repeat ? Keybinds.actionOf(e) : null;
    if (partyKey && partyKey !== "fullscreen") {
      switchMember(partyKey === "partyNext" ? -1 : Number(partyKey.slice(5)) - 1);
      e.preventDefault();
      return;
    }
    if (e.code === "KeyP" && gameState === "PLAYING" && !e.repeat) {
      actionPanel.setEditing(!actionPanel.editing);
      return;
    }

    if (e.code === "KeyQ" && gameState === "PLAYING" && !showShopModal && !showMercModal) {
      questHud.toggleLog(quest, player, summonerName(), mentorName());
      return;
    }

    // Export save shortcut (X while paused)
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
      } else if (stage.boatSystem && stage.boatSystem.canToggle(player)) {
        stage.boatSystem.toggleBoard(player, fx, crewOf());
      } else if (stage.boatSystem && Math.hypot(player.x - stage.boatSystem.monolith.x, player.y - stage.boatSystem.monolith.y) < 65) {
        stage.boatSystem.activateMonolith(player, fx, () => {
          quest.monolith = true;
          saveGame();
          questHud.toast(lang() === "fil" ? "Bukas na ang lagusan patungo sa Dark Continent!" : "Celestial Portal to the Dark Continent is open!");
        });
      } else if (gameState === "PLAYING" && fishing.active) {
        fishing.press(player, stage);
      } else if (gameState === "PLAYING" && stage.ore && stage.ore.nearest(player)) {
        mineVein(stage.ore.nearest(player));
      } else if (gameState === "PLAYING" && npcManager.nearest) {
        talkTo(npcManager.nearest);
      } else if (gameState === "PLAYING") {
        fishing.press(player, stage);
      }
      return;
    }

    // G = the safe-zone Workshop (B is the Market) (craft, cook, transmute)
    if (e.code === "KeyG" && gameState === "PLAYING") {
      openWorkshop();
      return;
    }

    // M = map of the whole world (Ronald's mercenaries are hired by talking to him, E)
    if (e.code === "KeyM" && gameState === "PLAYING" && !showShopModal && !showMercModal) {
      toggleMap();
      return;
    }

    // H while paused = back to the Main Menu
    if (e.code === "KeyH" && gameState === "PAUSED") {
      exitToTitle();
      return;
    }

    // J/K/L read as the ability placed in that hotbar slot
    const skillCode = SkillSlots.logical(e.code);

    // Space: hold = sprint; tap = lock/unlock the sprint (see the keyup below)
    if (e.code === "Space" && !e.repeat && gameState === "PLAYING") {
      spaceDownAt = performance.now();
    }

    // Shift: switch the locked target
    if ((e.code === "ShiftLeft" || e.code === "ShiftRight") && gameState === "PLAYING" && !e.repeat) {
      cycleTarget();
      return;
    }

    // 1–4: quick-use potions (when no shop is open)
    if (gameState === "PLAYING" && !showShopModal && !showMercModal && QUICK[e.code] !== undefined && !e.repeat) {
      quickUse(QUICK[e.code]);
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

    if (skillCode === "KeyK" && player.heroData.id === "priest" && !stage.isInsideSafeZone(player.x, player.y)) {
      if (!player.angelCompanions) player.angelCompanions = [];
      player.angelCompanions = player.angelCompanions.filter(a => a.isAlive);
      // One Angel fewer while another is away on a market errand
      if (player.angelCompanions.length < (isAway(player, "angel") ? 1 : 2) && player.skillCooldownTimer <= 0) {
        const angelHp = Math.round(player.maxHp * 0.5);
        player.angelCompanions.push(new GuardianAngelCompanion(player.x + (player.angelCompanions.length === 0 ? -30 : 30), player.y - 16, angelHp));
        player.skillCooldownTimer = 180;
        if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();
      }
    }

    if (e.code === "KeyK" && player.heroData.id === "archer" && player.falconCompanion && isAway(player, "falcon")) {
      if (fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 10, player.y - 14, errandText("busy", { name: runnerName("falcon") }), false, "#ffd166");
    } else if (e.code === "KeyK" && player.heroData.id === "archer" && player.falconCompanion && player.falconCompanion.aboard) {
      // Flyers can't leave the ship while the crew is aboard
      if (fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 10, player.y - 14, t("falconAboard"), false, "#38bdf8");
    } else if (e.code === "KeyK" && player.heroData.id === "archer" && player.falconCompanion && player.skillCooldownTimer <= 0 && !stage.isInsideSafeZone(player.x, player.y)) {
      // Falcon reach: 240px
      const closestEnemy = enemyManager.enemies
        .filter((en) => en.isAlive && Math.hypot(en.x - player.x, en.y - player.y) <= 240)
        .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0] || null;

      player.falconCompanion.triggerStrike(
        closestEnemy,
        closestEnemy ? closestEnemy.x : player.x + (player.facing === "right" ? 140 : -140),
        closestEnemy ? closestEnemy.y : player.y
      );
      player.skillCooldownTimer = 220;
    }

    // Only Esc pauses/resumes (no longer P)
    if (e.code === "Escape") {
      if (showShopModal) { showShopModal = false; return; }
      if (showMercModal) { showMercModal = false; return; }

      togglePause();
      return;
    }
  }
});

// A Space tap (shorter than 220ms) toggles the sprint lock
let spaceDownAt = 0;
window.addEventListener("keyup", (e) => {
  if (e.code !== "Space" || !spaceDownAt) return;
  const tapped = performance.now() - spaceDownAt < 220;
  spaceDownAt = 0;
  if (tapped && player && gameState === "PLAYING" && !dialog.open) player.sprintLock = !player.sprintLock;
});

// Drive only game-owned story conversations; user-opened panels suspend movement.
function updateAutoAdventureStory() {
  if (!player) return;
  if (guildPanel.open || guildCeremony.open) return;
  const enabled = player.autoAttackTime() > 0 && player.autoAttack.until > 0;
  if (!enabled) { autoAdventure.dialogOwned = false; player.autoAdventureStatus = player.autoAttackTime() ? "off" : "expired"; return; }
  if (quest.step >= FINAL_STEP && !dialog.open && !guildBook.state(player).active) {
    player.toggleAutoAttack(); autoAdventure.reset();
    player.autoAdventureStatus = "complete";
    questHud.toast(t("autoAdventureComplete")); saveGame(); return;
  }
  if (gameState === "PAUSED" || (devTools && devTools.open)) return;
  if (actIntro.open && gameState === "PLAYING" && actIntro.t > 90) actIntro.close();
  if (!autoAdventure.dialogOwned) return;
  const now = Date.now();
  if (dialog.open) {
    player.autoAdventureStatus = "dialogue";
    if (now - autoAdventure.dialogAt >= 1000) { autoAdventure.dialogAt = now; dialog.next(); }
    return;
  }
  // Quest NPC services open after the final line. Dismiss the menu without spending gold.
  if (showShopModal) showShopModal = false;
  if (showMercModal) showMercModal = false;
  if (serviceMenu.open) serviceMenu.close();
  if (gameState === "SELECT" && codexScene.mode === "awaken") {
    const chosen = ROSTER.find(h => h.id === (player.autoAdventureClass || "knight"));
    if (chosen) { codexScene.close(); awaken(chosen); autoAdventure.dialogAt = now; }
    return;
  }
  autoAdventure.dialogOwned = false;
  saveGame();
}

function updateGame() {
  if (player) setGuildHallOpen(hub, guildBook.available(quest));
  if (guildPanel.open || guildCeremony.open) return;
  updateAutoAdventureStory();
  if (player && actIntroShown === null) actIntroShown = quest.act();
  if (gameState !== "PLAYING" || !player || (devTools && devTools.open) || regressionModal.open || actIntro.open || showShopModal || showMercModal || dialog.open || serviceMenu.open || codexScene.open || questHud.logOpen || inventory.open || charPanel.open || actReader.open || worldMap.open || market.open || settingsPanel.open) return;

  // The member on the field fell: the next one standing steps in; game over only when all are down
  if (player.hp <= 0) {
    const r = party.rescue(player);
    if (r) {
      questHud.toast(partyText("fell", { name: partyName(r.fallen), next: partyName(r.id) }));
      if (fx.spawnHitSparks) fx.spawnHitSparks(player.x + 10, player.y + 10, "#e0f2fe", 18);
      syncPartyNpcs();
    }
  }
  if (player.hp <= 0) {
    gameState = "GAMEOVER";
    Sound.stopGameplayBGM();
    if (Sound.playGameOver) Sound.playGameOver();
    return;
  }

  const isInBarracks = stage.isInsideSafeZone(player.x, player.y);
  const activeBoss = enemyManager.boss();
  player.bossFight = Boolean(activeBoss && activeBoss.engaged);

  // Day and night: monster strength, class bonuses, a notice when it changes
  dayNight.update();
  enemyManager.night = dayNight.night();
  player.timeMods = dayNight.heroMods(player.heroData.id);
  const phase = dayNight.phase();
  if (phase !== lastPhase) {
    if (lastPhase && (phase === "NIGHT" || phase === "DAY")) {
      questHud.toast(phase === "NIGHT"
        ? (getLang() === "fil" ? "Sumapit ang gabi — mas mabagsik ang mga halimaw (+30% EXP)" : "Night falls — monsters grow fiercer (+30% EXP)")
        : (getLang() === "fil" ? "Sumikat ang araw sa Aethelgard" : "Dawn breaks over Aethelgard"));
    }
    lastPhase = phase;
  }

  // Update the listener position for spatial/positional combat sound filtering
  if (player && Sound && Sound.setListener) {
    Sound.setListener(player.x + 10, player.y + 21);
  }
  // Music follows the place, the night and an engaged boss (switches only when one of them changes)
  if (Sound.setScene) Sound.setScene(stage.id, dayNight.night() > 0.5, player.bossFight ? activeBoss.key : null);

  // Warp Gateway, Citadel gate, Return Gateway, rift or sea portal (may change platform)
  const before = stage;
  stage.update(player, handlePortal);
  if (stage !== before) return;

  if (stage.castle) {
    stage.castle.resolveCollision(player);
  }
  stage.resolveTileCollision(player);

  let adventure = null;
  const autoEnabled = player.autoAttackTime() > 0 && player.autoAttack.until > 0;
  const manualMovement = controller.getMovementVector().isMoving;
  player.suspendAutoAttack = autoEnabled && manualMovement;
  if (autoEnabled && !manualMovement) {
    if (player.hp < player.maxHp * 0.6 && player.potionCd <= 0) {
      const potion = player.hp < player.maxHp * 0.4 && player.bag.has("elixir") ? "elixir" : "salve";
      if (player.bag.has(potion)) player.bag.useById(potion, player, fx);
    }
    if (player.hasAnyDebuff() && player.bag.has("panacea")) player.bag.useById("panacea", player, fx);
    adventure = autoAdventure.update({ player, stage, quest, npcs: npcManager, enemies: enemyManager.enemies,
      loot: lootManager, hub, finalStep: FINAL_STEP, guildGoal: guildField.goal(player, stage, enemyManager, npcManager, lootManager) });
    player.autoAdventureStatus = adventure.status;
    if (adventure.done || adventure.halted || adventure.status === "bagFull") {
      player.toggleAutoAttack();
      questHud.toast(t(adventure.done ? "autoAdventureComplete" : adventure.halted ? "autoAdventureBlocked" : "autoAdventureBagFull"));
      saveGame(); return;
    }
    if (adventure.npc && Math.hypot(player.x + 10 - adventure.npc.x, player.y + 10 - adventure.npc.y) < 38 && Date.now() - autoAdventure.lastTalk > 1000) {
      autoAdventure.lastTalk = Date.now(); talkTo(adventure.npc, true); return;
    }
    if (adventure.action === "board" && stage.boatSystem.canToggle(player)) {
      stage.boatSystem.toggleBoard(player, fx, crewOf()); return;
    }
    if (adventure.action === "monolith" && Math.hypot(player.x - stage.boatSystem.monolith.x, player.y - stage.boatSystem.monolith.y) < 65) {
      stage.boatSystem.activateMonolith(player, fx, () => { quest.monolith = true; saveGame(); });
    }
  } else if (autoEnabled) player.autoAdventureStatus = "manual";

  let closestEnemy = enemyManager.enemies
    .filter((e) => e.isAlive)
    .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0] || null;
  // Locked target (Shift): kept while alive and in reach
  if (lockedTarget) {
    const range = (player.heroData.range || 200) * 1.3;
    if (lockedTarget.isAlive && enemyManager.enemies.includes(lockedTarget) && Math.hypot(lockedTarget.x - player.x, lockedTarget.y - player.y) <= range) closestEnemy = lockedTarget;
    else lockedTarget = null;
  }
  if (adventure) closestEnemy = adventure.enemy || null;
  enemyManager.lockedId = closestEnemy && adventure ? closestEnemy.id : lockedTarget ? lockedTarget.id : null;

  autoSummonDefence(player, enemyManager, stage, GuardianAngelCompanion, lootManager);
  player.update(
    adventure ? { isDown: code => controller.isDown(code) || adventure.keys.has(code) } : controller,
    stage.bounds,
    (proj) => projectileManager.add(proj),
    closestEnemy,
    isInBarracks,
    fx
  );

  autoPotion();
  summonerHeal();
  party.update(player, isInBarracks);
  const repaired = party.checkConsoles(stage, player);   // Eirene's trial: the Lost Sky Continent's consoles
  if (repaired) { questHud.toast(repaired); if (Sound.playQuestComplete) Sound.playQuestComplete(); saveGame(); }

  // A summon away on a market errand doesn't fight until it's back (js/errand.js)
  updateErrand(player, {
    fx, sound: Sound,
    log: (text) => { chatLog.event("loot", text, dayNight.label()); inventory.dirty = true; },
    drop: (inst) => lootManager.drop({ x: player.x + 10, y: player.y + 22 }, inst)
  });

  if (player.falconCompanion && !isAway(player, "falcon")) {
    player.falconCompanion.update(player, enemyManager, fx, lootManager);
  }

  const familiar = syncFamiliar(player);   // pet / familiar from the skill tree
  if (familiar && !isAway(player, "familiar")) familiar.update(player, enemyManager, fx, lootManager, isInBarracks, stage);

  if (player.angelCompanions && player.angelCompanions.length > 0) {
    player.angelCompanions.forEach((angel, idx) => {
      angel.update(player, enemyManager, fx, lootManager, idx, isInBarracks);
    });
    player.angelCompanions = player.angelCompanions.filter(a => a.isAlive);
  }

  camera.update(player.x, player.y);

  enemyManager.allies = mercManager.mercenaries;
  guildField.update(player, stage, enemyManager);
  enemyManager.update(player, fx, lootManager, stage);
  if (stage.castle) {
    enemyManager.enemies.forEach((enemy) => {
      if (enemy.isAlive) stage.castle.resolveCollision(enemy);
    });
  }
  enemyManager.enemies.forEach((enemy) => {
    if (enemy.isAlive && !enemy.kind.flying) stage.resolveTileCollision(enemy);
  });

  quest.update(player);
  sideProgress(quest.side.onMove(stage.id, player.x + 10, player.y + 18));
  guildBook.progress(player, stage.id, null, { x: player.x + 10, y: player.y + 18 });
  npcManager.update(player, enemyManager, fx);

  mercManager.update(player, enemyManager, lootManager, fx, (proj) => projectileManager.add(proj), stage);
  // At sea the crew keep their posts on the ship
  if (stage.boatSystem) stage.boatSystem.carry(player, crewOf());
  projectileManager.update(enemyManager.enemies, enemyManager, fx, lootManager, player);
  lootManager.update(player, fx);
  workshop.update(player, stage.isInsideSafeZone(player.x + 10, player.y + 17));
  fishing.update(player);
}

// The summoner (Prince/Princess) heals the hero, but only inside a sanctuary and only when they are
// there too: 15% of max HP every 1.5 s, with a golden beam from the summoner to the hero.
const SUMMONER_HEAL_EVERY = 90;
let summonerHealTimer = 0;
let healBeam = null;          // { npc, t } while the beam is visible
function summonerHeal() {
  if (healBeam && --healBeam.t <= 0) healBeam = null;
  if (summonerHealTimer > 0) summonerHealTimer--;
  const zone = stage.safeZoneAt(player.x + 10, player.y + 17);
  if (!zone || player.hp >= player.maxHp || summonerHealTimer > 0) return;
  const inZone = (n) => n.x >= zone.x && n.x <= zone.x + zone.w && n.y >= zone.y && n.y <= zone.y + zone.h;
  const npc = npcManager.npcs.find((n) => n.id === npcManager.summonerId && npcManager.shown(n) && inZone(n));
  if (!npc) return;
  summonerHealTimer = SUMMONER_HEAL_EVERY;
  const amount = Math.min(player.maxHp - player.hp, Math.max(8, Math.round(player.maxHp * 0.15)));
  player.hp += amount;
  healBeam = { npc, t: 24 };
  fx.spawnDamagePopup(player.x + 10, player.y - 10, `+${amount}`, false, "#4ade80");
  if (fx.spawnHitSparks) fx.spawnHitSparks(player.x + 10, player.y + 8, "#fde68a", 10);
  const fil = lang() === "fil";
  chatLog.event("level", "", dayNight.label(), {
    key: "summonerHeal", value: amount,
    format: (n, total) => (fil ? `Pinagaling ka ni ${npcName(npc.id)} (+${total} HP)` : `${npcName(npc.id)} healed you (+${total} HP)`)
  });
}

function drawHealBeam() {
  if (!healBeam || !player) return;
  const a = healBeam.t / 24, n = healBeam.npc;
  const x0 = n.x, y0 = n.y - 20, x1 = player.x + 10, y1 = player.y + 6;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = "rgba(253, 230, 138, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.fillStyle = "rgba(253, 230, 138, 0.35)";
  ctx.beginPath(); ctx.ellipse(x1, player.y + 20, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Golden arrow at the screen edge pointing to the quest objective (when off screen)
// Where the objective is in the current place: an NPC, a boss, or the way to the next platform
function objectivePoint() {
  if (quest.gated()) return sideQuestPoint();
  const npc = npcManager.find(quest.targetNpc(npcManager.summonerId, playerClass()));
  if (npc) return { x: npc.x, y: npc.y - 18 };
  const boss = enemyManager.boss();
  if (boss) return { x: boss.x + 10, y: boss.y - 10 };
  const next = quest.currentPlatform();
  if (!next || quest.step !== quest.baseStep(next)) {
    // An unclaimed quest item lies on the platform
    const drop = stage !== hub && lootManager.items.find((it) => it.quest);
    return drop ? { x: drop.x, y: drop.y } : null;
  }
  // The next platform must be reached
  // Act XI: first fetch any missing Seal Stone (it waits in its boss arena), then the monolith
  const dark = PLATFORMS[next].dark;
  const missingSeal = dark && !quest.monolith
    ? PLATFORM_ORDER.find((pid) => PLATFORMS[pid].seal && !player.bag.has(PLATFORMS[pid].seal)) : null;
  if (missingSeal) {
    if (stage === hub) {
      const g = hub.portals.portals.find((p) => p.dest === missingSeal);
      return g ? { x: g.x, y: g.y } : null;
    }
    if (stage.id === missingSeal) return { x: stage.def.arena.x + stage.def.arena.w / 2, y: stage.def.arena.y + stage.def.arena.h / 2 };
    return { x: stage.gate.x, y: stage.gate.y };
  }
  if (stage === hub) {
    // Act XI is reached through the Cerulean Abyss (WEST gateway), where the monolith stands
    const gate = hub.portals.portals.find((p) => p.dest === (dark ? "coast" : next));
    return gate ? { x: gate.x, y: gate.y } : null;
  }
  // the road / rift onward (on the Dark Continent it leads on towards the current Act)
  if (stage.def.rift && stage.riftOpen && (stage.def.rift.dest === next || stage.def.dark)) return { x: stage.def.rift.x, y: stage.def.rift.y };
  // On the coast, Act XI points at the monolith (or its open portal)
  if (dark && stage.boatSystem) {
    const b = stage.boatSystem;
    return b.seaPortal.active ? { x: b.seaPortal.x, y: b.seaPortal.y } : { x: b.monolith.x, y: b.monolith.y - 20 };
  }
  return { x: stage.gate.x, y: stage.gate.y };
}

function drawObjectiveArrow() {
  const target = objectivePoint();
  if (!target) return;
  const sx = target.x - camera.x, sy = target.y - camera.y;
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

// Mercenary Guild cards: each class's data and a portrait Avatar (built once)
let mercCardList = null;
function mercCards() {
  if (!mercCardList) mercCardList = ["axe", "wand", "crossbow", "greatsword"].map((key) => ({ key, data: MERC_CLASSES[key], sprite: new Avatar(MERC_CLASSES[key].look) }));
  return mercCardList;
}

function renderGameWorld() {
  const { offsetX, offsetY } = fx.getShakeOffsets();
  ctx.save();
  ctx.translate(Math.round(-camera.x + offsetX), Math.round(-camera.y + offsetY));

  stage.draw(ctx, player);
  if (player) {
    const cur = quest.side.current();
    drawSites(ctx, quest.side.pendingSites(stage.id), performance.now() / 16, cur && cur.area === stage.id ? quest.side.site(cur) : null);
  }
  const footY = player ? player.y + 21 : 0;
  npcManager.drawLayer(ctx, footY, false);   // NPCs behind the player
  lootManager.draw(ctx);
  guildField.draw(ctx, player, stage);
  mercManager.draw(ctx);
  enemyManager.draw(ctx);
  projectileManager.draw(ctx);

  enemyManager.targetId = player && player.target ? player.target.id : null;
  if (player && player.hp > 0) {
    player.draw(ctx);

    if (player.falconCompanion && !isAway(player, "falcon")) {
      player.falconCompanion.draw(ctx, player.facing === "right");
    }
    if (player.familiar && !isAway(player, "familiar")) player.familiar.draw(ctx);

    if (player.angelCompanions) {
      player.angelCompanions.forEach((angel) => {
        angel.draw(ctx);
      });
    }

    ui.drawInWorldUI(ctx, player);
    drawHealBeam();
    fishing.draw(ctx, player, stage, gameState === "PLAYING" && !npcManager.nearest && !(stage.ore && stage.ore.nearest(player)));
  }
  npcManager.drawLayer(ctx, footY, true);    // NPCs in front of the player

  stage.drawOverlay(ctx, player);   // tree canopy and the weather above the characters
  if (player && gameState !== "GAMEOVER") npcManager.drawLabels(ctx, player);
  // The fx rain/storm is for Aethelgard only; each platform has its own ambience
  fx.updateAndDraw(ctx, stage === hub ? gameConfig : { ...gameConfig, weather: false });
  ctx.restore();
  // Night: darkness with light around the hero (the Archer sees farther)
  if (player) {
    const mods = dayNight.heroMods(player.heroData.id);
    dayNight.draw(ctx, VIEW_W, VIEW_H, player.x + 10 - camera.x, player.y + 10 - camera.y, mods.sight, stage.id === "siege");
  }
  // Blind: darkness around the hero
  if (player && player.debuffs.blind > 0) {
    const px = player.x + 10 - camera.x, py = player.y + 10 - camera.y;
    const g = ctx.createRadialGradient(px, py, 26, px, py, 110);
    g.addColorStop(0, "rgba(0, 0, 0, 0)");
    g.addColorStop(1, "rgba(0, 0, 0, 0.92)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  // Unlock ceremonies draw over the night/blind darkness so the pillar shines through it
  fx.drawUnlockCeremonies(ctx, { x: camera.x - offsetX, y: camera.y - offsetY, w: VIEW_W, h: VIEW_H });
  enemyManager.drawBossBar(ctx, VIEW_W);


  if (gameState === "PLAYING" && !worldMap.open) drawObjectiveArrow();
  // Unlock ceremony banner (waits while the world map covers the screen)
  if (!worldMap.open) ui.drawUnlockBanner(ctx, VIEW_W, VIEW_H);

  if (worldMap.open && player) {
    const tq = quest.text(player, summonerName(), mentorName());
    worldMap.draw(ctx, VIEW_W, VIEW_H, {
      player,
      npcs: npcManager.npcs.filter((n) => npcManager.shown(n)),
      targetId: quest.targetNpc(npcManager.summonerId, playerClass()),
      enemies: enemyManager.enemies,
      loot: lootManager.items || [],
      act: tq.act,
      goal: tq.goal,
      quest,
      stageId: stage.id,
      objective: objectivePoint(),
      sites: quest.side.pendingSites(stage.id)
    });
  }

  if (showShopModal && player) {
    ui.drawShopModal(ctx, player, VIEW_W, VIEW_H);
  }

  // Inventory / Character panel cursor (arrows / D-pad): re-attach after each re-render
  if (guildPanel.open) panelNav.mark(guildPanel.el);
  else if (inventory.open) panelNav.mark(document.getElementById("inventory"));
  else if (charPanel.open) panelNav.mark(document.getElementById("character"));
  else if (panelNav.root) panelNav.reset();

  if (showMercModal && player) {
    ui.drawMercModal(ctx, player, VIEW_W, VIEW_H, mercCards(), MercenaryManager.cost(player.level));
  }

  if (gameState === "PAUSED" && !showShopModal && !showMercModal) {
    ui.drawPause(ctx, VIEW_W, VIEW_H, { act: quest.act(), actTitle: player ? quest.text(player, summonerName(), mentorName()).act : "" });
  }

  if (gameState === "GAMEOVER") {
    ui.drawGameOver(ctx, VIEW_W, VIEW_H, { act: quest.act(), level: player ? player.level : 0 });
  }
}

// Right panel World Map: the live minimap, drawn in the side panel instead of over the game screen.
// 180×100 map pixels on a 360×200 canvas; redrawn every other frame. Click (or M) opens the full map.
const sideMapEl = document.getElementById("sideMap");
const sideMapCtx = sideMapEl.getContext("2d");
const SIDE_MAP = { X: 4, Y: 5, W: 172, H: 84, view: 900 };
let sideMapTick = 0;
document.getElementById("sideMapBox").addEventListener("click", () => { Sound.init(); toggleMap(); panelSound(worldMap.open); });
function drawSideMap() {
  if (!player || (sideMapTick++ & 1)) return;
  const c = sideMapCtx;
  c.setTransform(2, 0, 0, 2, 0, 0);
  c.imageSmoothingEnabled = false;
  c.fillStyle = "#070c16";
  c.fillRect(0, 0, 180, 100);
  ui.drawHUD(
    c, player, enemyManager, lootManager, stage,
    180, gameState === "PAUSED",
    fx.timeOfDay, fx.weatherType, stage.isInsideSafeZone(player.x, player.y),
    {
      objective: objectivePoint(),
      npcs: npcManager.npcs.filter((n) => npcManager.shown(n)),
      placeName: stage === hub ? t("placeHub") : stage.def.name[lang()],
      night: dayNight.night(),
      rect: SIDE_MAP
    }
  );
}
const sideMapLabel = document.getElementById("sideMapLabel");
const syncSideMapLabel = () => { sideMapLabel.textContent = t("set_worldMap"); };
syncSideMapLabel();
onLangChange(syncSideMapLabel);

// Options → FPS Counter: frames the screen received in the last second (top left of the canvas)
const fpsMeter = { frames: 0, since: 0, fps: 0 };
function drawFpsMeter(now) {
  fpsMeter.frames++;
  if (now - fpsMeter.since >= 1000) {
    fpsMeter.fps = Math.round((fpsMeter.frames * 1000) / (now - fpsMeter.since));
    fpsMeter.frames = 0;
    fpsMeter.since = now;
  }
  if (!gameConfig.fps) return;
  const f = fpsMeter.fps;
  ctx.save();
  ctx.fillStyle = "rgba(3, 6, 17, 0.75)";
  ctx.fillRect(3, 3, 30, 9);
  ctx.font = "bold 6px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = f >= 55 ? "#4ade80" : f >= 40 ? "#facc15" : "#ef4444";
  ctx.fillText(`${f} FPS`, 5, 8);
  ctx.restore();
}

// Fixed timestep: always 60 updates per second even on 120/144 Hz monitors
// (everything used to run twice as fast on fast screens). Drawing follows the screen.
const STEP = 1000 / 60;
let lastTime = performance.now();
let acc = 0;

let lastDraw = 0;
// One error in a frame used to stop requestAnimationFrame for good (a frozen game that never saved again).
// Now the loop always reschedules, the first error of each kind is logged (and kept in
// localStorage "vanguard_lasterror" for bug reports), and the hero is saved right away.
const loopErrors = new Set();
function gameLoop(now = performance.now()) {
  try {
    frame(now);
  } catch (err) {
    const key = String(err && err.message);
    if (!loopErrors.has(key)) {
      loopErrors.add(key);
      console.error("[gameLoop]", err);
      try { localStorage.setItem("vanguard_lasterror", JSON.stringify({ at: new Date().toISOString(), place: stage && stage.id, msg: key, stack: String(err && err.stack).slice(0, 1500) })); } catch (e) {}
      if (player && player.hp > 0) { try { saveGame(); } catch (e) {} }
    }
    lastTime = performance.now(); acc = 0;   // don't replay the failed steps
  }
  requestAnimationFrame(gameLoop);
}

// Autosave: every 30 s of play, and whenever the tab is hidden or closed
const AUTOSAVE_STEPS = 30 * 60;
let autosaveIn = AUTOSAVE_STEPS;
function autosave() {
  if (player && player.hp > 0 && (gameState === "PLAYING" || gameState === "PAUSED")) saveGame();
}
document.addEventListener("visibilitychange", () => { if (document.hidden) autosave(); });
window.addEventListener("pagehide", autosave);

function frame(now) {
  acc += Math.min(250, now - lastTime);      // don't catch up too much after a tab switch
  lastTime = now;
  // Options → FPS Limit: the simulation keeps its 60 steps; only drawing skips frames
  const cap = gameConfig.fpsCap;
  const drawNow = !cap || now - lastDraw >= 1000 / cap - 1;
  while (acc >= STEP) {
    // Hit-stop: a heavy blow freezes the fight for a few steps (drawing carries on)
    if (!(gameState === "PLAYING" && fx.consumeHitStop())) updateGame();
    acc -= STEP;
    if (gameState === "LOADING" && loadingScreen.update()) gameState = "PLAYING";
    if (gameState === "PLAYING" && --autosaveIn <= 0) { autosaveIn = AUTOSAVE_STEPS; autosave(); }
  }
  const MODES = { TITLE: "title", SELECT: "select", CREATE: "create" };
  setLayoutMode(MODES[gameState] || "play");
  dialog.update();
  document.getElementById("viewport").classList.toggle("guild-ceremony", guildCeremony.open);
  questHud.setVisible(layoutMode === "play" && Boolean(player) && gameState !== "GAMEOVER" && !actIntro.open);
  if (player && layoutMode === "play") {
    questHud.update(quest, player, summonerName(), mentorName());
    hudBar.update({
      player,
      foes: enemyManager.enemies.filter((en) => en.isAlive).length,
      loot: lootManager.items ? lootManager.items.length : 0,
      weather: stage === hub ? fx.weatherType : "",
      time: dayNight.label(),
      inSanctuary: stage.isInsideSafeZone(player.x, player.y),
      paused: gameState === "PAUSED",
      difficulty: regression.level ? difficultyName() : "",
      role: party.activeId === "hero" ? "" : roleOf(party.activeId)
    });
    partyHud.update(party, player);
    actionPanel.update({
      player,
      inSanctuary: stage.isInsideSafeZone(player.x, player.y),
      paused: gameState === "PAUSED",
      canTalk: Boolean(npcManager.nearest),
      canErrand: hasRunnerKind(player) && !player.errand,   // B outside a safe zone sends the summon
      sprinting: Boolean(player.sprinting || player.sprintLock),
      mapOpen: worldMap.open,
      inventoryOpen: inventory.open,
      charOpen: charPanel.open,
      marketOpen: market.open,
      settingsOpen: settingsPanel.open,
      pointsAvailable: player.statPoints > 0 || player.skillPoints > 0 || player.pathPoints > 0
    });
  }
  if (inventory.open && (gameState !== "PLAYING" || !player)) inventory.close();
  guildPanel.update(gameState === "PLAYING" ? player : null, guildContext());
  if (guildPanel.open && (gameState !== "PLAYING" || !player)) guildPanel.close();
  if (charPanel.open && (gameState !== "PLAYING" || !player)) charPanel.close();
  inventory.update();
  if (actReader.open && (layoutMode !== "play" || !player)) actReader.close();
  if (worldMap.open && (gameState !== "PLAYING" || !player)) worldMap.close();
  if (serviceMenu.open && (gameState !== "PLAYING" || !player)) serviceMenu.close();
  if (codexScene.open && codexScene.mode === "codex" && (gameState !== "PLAYING" || !player)) codexScene.close();
  if (market.open && (gameState !== "PLAYING" || !player || (market.mode === "shop" && !stage.isInsideSafeZone(player.x + 10, player.y + 17)))) market.close();
  if (settingsPanel.open && (layoutMode !== "play" || !player || gameState === "GAMEOVER")) settingsPanel.close();
  if (actionPanel.editing && (layoutMode !== "play" || !player)) actionPanel.setEditing(false);
  if (!drawNow) return;
  lastDraw = now;
  if (gameState === "TITLE") {
    titleScene.draw();
  } else if (gameState === "CREATE" || gameState === "SELECT") {
    codexScene.draw();
  } else if (gameState === "LOADING") {
    loadingScreen.draw(ctx, VIEW_W, VIEW_H);
  } else {
    renderGameWorld();
  }
  if (codexScene.open && gameState !== "CREATE" && gameState !== "SELECT") codexScene.draw();   // the Codex (N) over the game
  if (guildCeremony.open && gameState === "PLAYING") guildCeremony.draw(ctx);
  if (actIntro.open && gameState === "PLAYING") actIntro.draw(ctx, VIEW_W, VIEW_H);
  if (pendingToast && !actIntro.open) { questHud.toast(pendingToast); pendingToast = null; }
  if (layoutMode === "play") drawSideMap();
  drawFpsMeter(now);
}

// ==================== REGRESSION (New Game+, js/regression.js) ====================
const regressionModal = new RegressionModal(document.getElementById("regression"), {
  onContinue: () => { panelSound(false); },
  // The cleared difficulty goes into the save, then the .vof downloads
  onSaveAndRegress: () => new Promise((resolve) => { markCleared(); exportSaveFile(); setTimeout(resolve, 700); }),
  onRegress: () => regress()
});

// Once a difficulty is cleared the hero carries the Scroll of Callings
function grantScroll() {
  if (player && regression.cleared.length && !player.bag.has("jobScroll")) player.bag.add("jobScroll", 1);
}

// The world folds back to the summoning: same soul (name, Earth look), one difficulty harder.
// Level, items and quests start over; the Codex and the Regression record are kept.
function regress() {
  if (!player) return;
  markCleared();
  regression.level = Math.min(DIFFICULTIES.length - 1, regression.level + 1);
  const name = player.heroName || "";
  const earth = player.earthLook || player.avatarConfig;
  Object.keys(platformCache).forEach((k) => { if (platformCache[k].destroy) platformCache[k].destroy(); delete platformCache[k]; });
  savedShip = null;
  stage = hub;
  player = new Player(hub.width / 2, hub.height / 2, getNovice(summonedGarb(earth), name));
  player.heroName = name;
  player.avatarConfig = player.heroData.avatarConfig;
  player.earthLook = { ...earth };
  party = new Party();   // a new soul: the recruits' trials start over with the story
  starterKit(player);
  SkillSlots.reset();
  attachBag(player);
  quest.reset();
  grantScroll();
  controller.clearAll();
  gameState = "CREATE";
  Sound.stopGameplayBGM();
  prologueScene.start(name, earth);
}

// Scroll of Callings: the job picker (after the Job Awakening)
function openJobChange() {
  if (!player || gameState !== "PLAYING") return;
  const fil = lang() === "fil";
  if (player.heroData.id === "novice") { questHud.toast(fil ? "Magagamit lamang pagkatapos ng Job Awakening." : "Usable only after the Job Awakening."); return; }
  closeOverlays();
  controller.clearAll();
  codexScene.show("awaken", { jobChange: true, owned: [...regression.jobs], allowance: jobAllowance(), current: player.heroData.id });
  gameState = "SELECT";
}

// Switch to a learned calling, or learn a new one while the allowance has room
function changeJob(def) {
  const fil = lang() === "fil";
  gameState = "PLAYING";
  if (def.id === player.heroData.id) return;
  const known = regression.jobs.includes(def.id);
  if (!known && regression.jobs.length >= jobAllowance()) {
    questHud.toast(fil ? "Wala nang puwang para sa bagong tungkulin — tapusin ang mas mahirap na antas." : "No room for another calling — clear a harder difficulty.");
    return;
  }
  const old = player;
  party.heroOnField(old);
  const p = new Player(old.x, old.y, equipJob(def, old.avatarConfig));
  ["level", "exp", "expNext", "gold", "statPoints", "bonusHp", "bonusDamage", "bonusDefense", "bonusSpeed", "bonusCrit",
    "bonusCooldown", "heroName", "avatarConfig", "earthLook", "stats", "skillLevels", "skillPoints", "pathPoints", "autoAttack", "autoAdventureClass", "belt", "autoPot", "style", "pathSlots", "autoStat", "autoSkill", "autoPath", "guild"].forEach((k) => { p[k] = old[k]; });
  p.bag = old.bag;
  if (!known) { p.bag.giveKit(def.id, 1); regression.jobs.push(def.id); }
  attachBag(p);
  p.respec();
  p.hp = p.maxHp;
  if (def.id === "archer") p.falconCompanion = new FalconCompanion(p.x, p.y);
  player = p;
  enemyManager.player = p;
  if (fx.spawnHitSparks) fx.spawnHitSparks(p.x + 10, p.y + 10, "#c084fc", 28);
  if (Sound.playAwakening) Sound.playAwakening();
  celebrate(p, "MYTHIC", t("cerJob"), t("cerJobSub", def.name));
  questHud.toast(fil ? `Bagong tungkulin: ${def.name}` : `Calling changed: ${def.name}`);
  saveGame();
}

// Frustum culling: the managers skip drawing (and idle monsters most thinking) off-screen
[enemyManager, mercManager, lootManager, projectileManager].forEach((m) => { m.camera = camera; });
applyConfig();
requestAnimationFrame(gameLoop);
// Developer tools (admin panel): only with ?dev in the URL — F9 opens it
const devTools = devEnabled() ? new DevTools({
  getPlayer: () => player, getStage: () => stage, getState: () => gameState,
  enemyManager, quest, fx, controller, getSavePayload, saveGame, loadGame, travelTo
}) : null;

// Debug handle for automated testing: only active with ?debug in the URL
if (new URLSearchParams(location.search).has("debug")) {
  window.__vof = {
    get player() { return player; }, get stage() { return stage; }, get state() { return gameState; },
    get party() { return party; }, talkTo, switchMember,
    quest, autoAdventure, guildBook, guildField, guildPanel, guildCeremony, enemyManager, lootManager, projectileManager, mercManager, npcManager, inventory, charPanel, travelTo, warpTo, saveGame, awaken, ROSTER, dayNight, dialog,
    openShop() { showShopModal = true; }, openMerc() { showMercModal = true; }, actIntro, codexScene, regressionModal, regression, openJobChange, market, settingsPanel, actionPanel, gameConfig, SkillSlots, fishing, workshop
  };
}
