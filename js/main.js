import { KnightClass } from "./classes/knight.js";
import { MageClass } from "./classes/mage.js";
import { PriestClass } from "./classes/priest.js";
import { ArcherClass } from "./classes/archer.js";
import { FighterClass } from "./classes/fighter.js";
import { Player, expFor } from "./player.js";
import { InputController } from "./controller.js";
import { Camera } from "./camera.js";
import { FXManager } from "./fx.js";
import { EnemyManager } from "./enemy.js";
import { ProjectileManager } from "./projectiles.js";
import { UIManager } from "./ui.js";
import { LootManager } from "./loot.js";
import { MercenaryManager, MERC_CLASSES } from "./mercenaryManager.js";
import { Sound } from "./audio.js";
import { Stage } from "./stage.js";
import { TitleScene } from "./title.js";
import { SelectScene } from "./select.js";
import { CreatorScene } from "./creator.js";
import { PrologueScene } from "./prologue.js";
import { getNovice } from "./classes/novice.js";
import { equipJob, refreshLook } from "./classes/job.js";
import { Platform } from "./world/platform.js";
import { PLATFORMS, PLATFORM_ORDER, SEAL_STONES } from "./world/platforms.js";
import { QuestManager, MENTOR_BY_CLASS, FINAL_STEP } from "./quest.js";
import { NPCManager } from "./npc/npcs.js";
import { NPC_DEFS, MENTOR_OF, summonerIdFor } from "./npc/roster.js";
import { getDialogue, npcName } from "./dialogue.js";
import { DialogBox, QuestHud } from "./dialog.js";
import { ChatLog } from "./chatlog.js";
import { ServiceMenu } from "./services.js";
import { Codex } from "./codex.js";
import { getItem, SETS } from "./items/itemdb.js";
import { SET_SLOTS, recipeCost, forgePiece } from "./items/forge.js";
import { wear, WEAR_WEAPON, WEAR_ARMOR, ARMOR_SLOTS } from "./items/durability.js";
import { Avatar } from "./avatar/avatar.js";
import { ActIntro } from "./actintro.js";
import { createLorePanel } from "./lore.js";
import { HudBar } from "./hudbar.js";
import { ActionPanel } from "./actionpanel.js";
import { WorldMap } from "./worldmap.js";
import { ActReader } from "./actreader.js";
import { InventoryPanel } from "./inventory.js";
import { DayNight } from "./daynight.js";
import { CharacterPanel } from "./charpanel.js";
import { t, onLangChange, getLang } from "./i18n.js";

import { FalconCompanion } from "./summons/falcon.js";
import { GuardianAngelCompanion } from "./summons/angel.js";
import { syncFamiliar } from "./summons/familiar.js";
import { PATH_IDS, SLOT_KEYS, assignSlot } from "./skillpaths.js";
import { AUTO_MODES } from "./skills.js";
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

// While playing: room below for the bottom tray (adventure log)
const TRAY_RESERVE = 104;
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
  const selectHint = selectScene && selectScene.mode === "awakening" ? t("awakenHint") : t("selectHint");
  hudText.innerHTML = layoutMode === "select" ? selectHint : (layoutMode === "play" ? t("playHint") : "");
}
onLangChange(refreshLabels);

window.addEventListener("resize", fitCanvas);

const hudText = document.getElementById("hudText");
const fileInput = document.getElementById("saveFileInput");
const ROSTER = [KnightClass, MageClass, PriestClass, ArcherClass, FighterClass];

const CONFIG_KEY = "vanguard_config";
// Options → Quality: the largest drawing scale (0 = always the full screen scale)
const RENDER_CAP = { sharp: 0, balanced: 2, fast: 1 };
function loadGameConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        music: parsed.music !== undefined ? Boolean(parsed.music) : true,
        sfx: parsed.sfx !== undefined ? Boolean(parsed.sfx) : true,
        blood: parsed.blood !== undefined ? Boolean(parsed.blood) : true,
        weather: parsed.weather !== undefined ? Boolean(parsed.weather) : true,
        quality: RENDER_CAP[parsed.quality] !== undefined ? parsed.quality : "balanced",
        fps: Boolean(parsed.fps)
      };
    }
  } catch (_) {}
  return { music: true, sfx: true, blood: true, weather: true, quality: "balanced", fps: false };
}

const gameConfig = loadGameConfig();
Sound.musicEnabled = gameConfig.music;
Sound.sfxEnabled = gameConfig.sfx;

// The plains of Aethelgard (hub) and the Act VII–XII platforms (built on first entry).
// Same size (1280x960), so one camera, enemy and projectile manager serve all of them.
const hub = new Stage(1280, 960);
let stage = hub;
const platformCache = {};
function platformById(id) {
  if (id === "hub" || !PLATFORMS[id]) return hub;
  if (!platformCache[id]) platformCache[id] = new Platform(id);
  return platformCache[id];
}

const camera = new Camera(VIEW_W, VIEW_H, hub.width, hub.height);
const fx = new FXManager();
const enemyManager = new EnemyManager(hub.width, hub.height);
const projectileManager = new ProjectileManager(hub.width, hub.height);
const ui = new UIManager();
const lootManager = new LootManager();
const mercManager = new MercenaryManager();
const controller = new InputController();
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

// Codex (N): encyclopedia of NPCs, monsters, MVPs and items; progress is saved with the game
const codex = new Codex(document.getElementById("codex"));
function toggleCodex() {
  if (!player || gameState !== "PLAYING" || dialog.open || serviceMenu.open) return;
  controller.clearAll();
  if (questHud.logOpen) questHud.closeLog();
  inventory.close();
  charPanel.close();
  worldMap.close();
  codex.toggle();
}
function openRonaldMenu() {
  const fil = lang() === "fil", who = npcName("ronald");
  serviceMenu.show(who, [
    { label: fil ? "Umupa ng mercenary" : "Hire mercenaries", hint: `${MercenaryManager.cost(player.level)}G`, onPick: () => { showMercModal = true; } },
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
    { label: fil ? "Mag-refine (hanggang +10)" : "Refine gear (up to +10)", hint: fil ? "Phracon, Oridecon at ginto" : "Phracon, Oridecon and gold",
      onPick: () => openService("refine", { serviceName: who }) },
    { label: fil ? "Mag-forge ng set" : "Forge a set piece", hint: fil ? "Mga mineral mula sa minahan" : "From mined minerals", onPick: openForgeSets },
    { label: fil ? "Patibayin gamit ang mineral" : "Temper with minerals", hint: fil ? "Hanggang 3 beses bawat hindi-set na gamit" : "Up to 3 times on any non-set gear",
      onPick: () => openService("temper", { serviceName: who }) }
  ]);
}

// Forging: pick a set, then a slot; each option shows its mineral cost
const costText = (cost) => Object.entries(cost).map(([id, n]) => (id === "gold" ? `${n}G` : `${getItem(id).name} ${player.bag.count(id)}/${n}`)).join(" · ");
function openForgeSets() {
  const fil = lang() === "fil";
  serviceMenu.show(fil ? "Pumili ng set" : "Choose a set", Object.entries(SETS).map(([id, set]) => ({
    label: `${set.name[lang()]} · ${fil ? "Grado" : "Grade"} ${set.grade}`,
    hint: `5: ${set.passive[lang()]}`,
    onPick: () => openForgeSlots(id)
  })));
}
function openForgeSlots(setId) {
  const fil = lang() === "fil", set = SETS[setId];
  const SLOT_NAME = { weapon: fil ? "Sandata" : "Weapon", head: fil ? "Ulo" : "Head", armor: fil ? "Baluti" : "Armor", gloves: fil ? "Guwantes" : "Gloves", boots: fil ? "Bota" : "Boots" };
  serviceMenu.show(`${set.name[lang()]} · ◆ ${player.gold}G`, SET_SLOTS.map((slot) => ({
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
      hint: fil ? "Emberite at Obsidian sa Ashfall · Mythril at Starsteel sa Siege · dalhin kay Brakka" : "Emberite & Obsidian in the Ashfall · Mythril & Starsteel in the Siege · take them to Brakka",
      onPick: () => {}
    }]);
  }
}

// Mining: one pickaxe strike on the vein beside the hero
function mineVein(v) {
  const fil = lang() === "fil";
  if (quest.mining !== 2) {
    fx.spawnDamagePopup(player.x + 10, player.y - 10, fil ? "Kailangan ang piko ni Thane Durgrim" : "Needs Thane Durgrim's pickaxe", false, "#94a3b8");
    return;
  }
  const r = stage.ore.strike(v);
  fx.spawnHitSparks(v.x, v.y - 8, getItem(v.kind).tint, r.broke ? 20 : 8);
  if (Sound.playSlash) Sound.playSlash();
  if (!r.broke) return;
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
  serviceMenu.show(`${npcName("pip")} · ◆ ${player.gold}G`, stock.map(([id, price]) => ({
    label: `${getItem(id).name} — ${price}G`,
    hint: getItem(id).desc,
    disabled: player.gold < price,
    onPick: () => {
      if (player.gold < price || !player.bag.add(id, 1)) {
        fx.spawnDamagePopup(player.x + 10, player.y - 10, fil ? "HINDI MAKABILI" : "CAN'T BUY", false, "#ef4444");
      } else {
        player.gold -= price;
        chatLog.event("loot", fil ? `Binili ang ${getItem(id).name} (−${price}G)` : `Bought ${getItem(id).name} (−${price}G)`, dayNight.label());
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
    onRepair: (n, cost) => chatLog.event("equip", lang() === "fil" ? `Naayos ang ${n} kagamitan (−${cost}G)` : `Repaired ${n} item${n > 1 ? "s" : ""} (−${cost}G)`, dayNight.label())
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
const charPanel = new CharacterPanel(document.getElementById("character"));
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
  refreshLook(p);
  p.recalc();
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
const actionPanel = new ActionPanel({
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
  codex: () => { Sound.init(); toggleCodex(); panelSound(codex.open); }
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

// ==================== TRAVELLING BETWEEN PLATFORMS (Acts VII–XII) ====================
const lang = () => (getLang() === "fil" ? "fil" : "en");
const fillNames = (lines) => lines.map((s) => s.replace(/\{s\}/g, summonerName()).replace(/\{h\}/g, (player && player.heroName) || "Champion"));

// Platform flags from the quest: boss defeated, rift to the Maw open
function syncPlatformFlags() {
  Object.values(platformCache).forEach((p) => {
    p.cleared = quest.cleared(p.id);
    if (p.def.rift) p.riftOpen = quest.unlocked(p.def.rift.dest);
    p.miningUnlocked = quest.mining === 2;
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
  return [...mercManager.mercenaries, player.falconCompanion, ...(player.angelCompanions || []), ...(player.companions || [])].filter(Boolean);
}

// Move to another place. at = { x, y } (player pixels) or nothing for the default arrival.
function travelTo(id, at = null) {
  const from = stage.id;
  lockedTarget = null;
  stage = platformById(id);
  syncPlatformFlags();
  const spot = at || (stage === hub ? hub.arrivalFrom(from) : stage.arrival());
  // Arriving on foot: the ship stays behind in the Cerulean Abyss
  player.inBoat = false;
  crewOf().forEach((c) => { c.aboard = false; });
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
  enemyManager.setArea(stage, def ? def.monsters : undefined, def ? def.tier : 0);
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

  // First arrival on the current Act's platform: the summoner greets the hero
  if (def && quest.step === quest.baseStep(id)) {
    quest.onArrive(id);
    const s = npcManager.find(npcManager.summonerId);
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
  if (portal.id === "RETURN") return travelTo("hub");
  if (portal.id === "DARK_CONTINENT_PORTAL" || dest === "dark_continent") {
    // The Celestial Monolith portal is the only way to the Dark Continent (Acts XI–XII)
    if (!quest.unlocked("siege")) {
      fx.spawnDamagePopup(player.x + 10, player.y - 10, lang() === "fil" ? "SELYADO · ACT XI" : "SEALED · ACT XI", false, "#94a3b8");
      return;
    }
    travelTo("siege");
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
  if (dest && PLATFORMS[dest]) {
    if (!quest.unlocked(dest)) {
      const act = PLATFORMS[dest].act;
      fx.spawnDamagePopup(player.x + 10, player.y - 10, lang() === "fil" ? `SELYADO · ACT ${act}` : `SEALED · ACT ${act}`, false, "#94a3b8");
      return;
    }
    travelTo(dest);
  }
}

// Labels of the hub's 4 Warp Gateways: the platform name, sealed until its Act
hub.portals.stateOf = (p) => ({
  sealed: !quest.unlocked(p.dest),
  label: PLATFORMS[p.dest] ? PLATFORMS[p.dest].name[lang()].toUpperCase() : ""
});

// Boss defeated: pick up the quest item
enemyManager.onBossDefeated = (e) => {
  const item = stage.def && stage.def.item;
  questHud.toast(lang() === "fil" ? `Natalo si ${e.kind.name.fil}! Pulutin ang iniwan niya.` : `${e.kind.name.en} has fallen! Claim what was left behind.`);
  if (item) fx.spawnDamagePopup(e.x + 10, e.y - 40, "✦ QUEST ITEM ✦", true, "#facc15");
  // Acts VII–X bosses also leave one of the four Seal Stones for the Celestial Monolith
  const seal = stage.def && stage.def.seal;
  if (seal && !quest.monolith && !player.bag.has(seal)) lootManager.drop({ x: e.x + 22, y: e.y + 12 }, { id: seal, qty: 1 }, true);
};
lootManager.onQuestItem = (id) => quest.onQuestItem(id);
// Bottom tray: EXP from the hero's kills (merged while chaining kills), or a note when an ally took the last hit
enemyManager.onKill = (e, byPlayer, exp) => {
  codex.recordKill(e.key);
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
// Bottom tray: gold and items picked up (consecutive identical pickups merge)
lootManager.onCollect = (it) => {
  const fil = lang() === "fil";
  if (it.gold) {
    chatLog.event("loot", "", dayNight.label(), {
      key: "gold", value: it.gold,
      format: (n, total) => (fil ? `Napulot ang ${total}G` : `Picked up ${total}G`)
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
    bag: player.bag.serialize(),            // bag and worn equipment
    stats: { ...player.stats },             // STR/AGI/VIT/INT/DEX/LUK
    skills: { ...player.skillLevels },
    skillPoints: player.skillPoints,
    pathSlots: [...(player.pathSlots || [])],   // path actives on T / Y / U
    style: { ...player.style },                    // play-style affinity (js/skillpaths.js)
    autoStat: player.autoStat || "off",
    belt: [...player.belt],
    autoPot: { ...player.autoPot },
    codex: codex.serialize(),
    dayTick: dayNight.serialize(),
    platform: stage.id,                     // "hub" or an Act platform
    x: player.x,
    y: player.y
  };
}

// Skill paths from a save: slots only take learned actives, style values must be finite numbers
function loadPaths(p, data) {
  if (data.style) PATH_IDS.forEach((k) => { const v = Number(data.style[k]); p.style[k] = Number.isFinite(v) && v > 0 ? Math.min(v, 1e4) : 0; });
  if (Array.isArray(data.pathSlots)) SLOT_KEYS.forEach((_, i) => assignSlot(p, i, typeof data.pathSlots[i] === "string" ? data.pathSlots[i] : null));
  p.autoStat = AUTO_MODES.includes(data.autoStat) ? data.autoStat : "off";
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
    player.gold = data.gold || 150;
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
      player.skillPoints = data.skillPoints || 0;
      loadPaths(player, data);
    } else {
      player.statPoints = (data.statPoints || 0) + 10 + (player.level - 1) * 3;
      player.skillPoints = player.level - 1;
    }
    dayNight.load(data.dayTick);
    codex.load(data.codex);
    if (Array.isArray(data.belt)) player.belt = data.belt.slice(0, 4).map((x) => x || null);
    if (data.autoPot) player.autoPot = { hp: data.autoPot.hp | 0, cure: Boolean(data.autoPot.cure), stamina: Boolean(data.autoPot.stamina) };
    // Bag: an old save without a bag → the class's default gear
    if (data.bag) player.bag.load(data.bag);
    else starterKit(player);
    attachBag(player);
    player.hp = Math.min(player.maxHp, data.hp || player.maxHp);
    quest.load(data.quest, player);

    if (foundHero.id === "archer") {
      player.falconCompanion = new FalconCompanion(player.x, player.y);
    }

    beginPlaying();
    // Return to the platform where the game was saved (if the quest still allows it)
    const saved = data.platform && PLATFORMS[data.platform] && quest.unlocked(data.platform) ? data.platform : null;
    if (saved) travelTo(saved, { x: player.x, y: player.y });
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
  controller.clearAll();
  chatLog.clear();
  stage = hub;
  worldMap.stage = hub;
  dayNight.setPlace("hub");
  npcManager.build(summonerIdFor(player.avatarConfig));
  npcManager.setPlatform("hub");
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
  return p && p.heroData.id === "novice" && quest.step === 4;
}

function startAwakening() {
  controller.clearAll();
  // Preview: the player wearing each class's gear
  selectScene.jobAvatars = Object.fromEntries(ROSTER.map((h) => [h.id, equipJob(h, player.avatarConfig).avatar]));
  selectScene.setMode("awakening");
  gameState = "SELECT";
  Sound.stopGameplayBGM();
  if (Sound.playHolyBurst) Sound.playHolyBurst();
}

// Replaces the Novice with the chosen class; keeps level, exp, gold, stats and name
function awaken(chosenHero) {
  const old = player;
  // Same look from the Character Creator; the class provides the new gear
  const p = new Player(old.x, old.y, equipJob(chosenHero, old.avatarConfig));
  ["level", "exp", "expNext", "gold", "statPoints", "bonusHp", "bonusDamage",
    "bonusDefense", "bonusSpeed", "bonusCrit", "bonusCooldown", "heroName", "avatarConfig",
    "stats", "skillLevels", "skillPoints", "belt", "autoPot", "style", "pathSlots", "autoStat"].forEach((k) => { p[k] = old[k]; });
  // Keeps the bag; the summoner hands over the class's custom-forged weapon (LORE Act IV)
  p.bag = old.bag;
  p.bag.giveKit(chosenHero.id, 1);
  attachBag(p);
  p.hp = p.maxHp;
  if (chosenHero.id === "archer") p.falconCompanion = new FalconCompanion(p.x, p.y);
  player = p;

  controller.clearAll();
  gameState = "PLAYING";
  if (fx.spawnHitSparks) fx.spawnHitSparks(p.x + 10, p.y + 10, "#ffd166", 28);
  if (Sound.playAwakening) Sound.playAwakening();
  if (gameConfig.music) Sound.startGameplayBGM();
  quest.advance(5);   // Act V: Dual Equipment Matrix

  // The summoner gives the weapon and the title of Field Commander
  const summoner = npcManager.find(npcManager.summonerId);
  const d = getDialogue(npcManager.summonerId, {
    step: quest.step, cls: p.heroData.id, met: quest.met, summoner: npcManager.summonerId, justAwakened: true
  });
  dialog.start(npcManager.summonerId, summoner && summoner.avatar, d.lines);
}

// Talking to an NPC (E). After the last line: quest + the NPC's service
function talkTo(npc) {
  codex.meet(npc.id);
  if (npc.tag === "field") return talkField(npc);
  const d = getDialogue(npc.id, { step: quest.step, cls: playerClass(), met: quest.met, summoner: npcManager.summonerId });
  dialog.start(npc.id, npc.avatar, d.lines, () => {
    quest.onTalk(npc.id, npcManager.summonerId, playerClass());
    npcManager.applyQuest(quest, playerClass());
    saveGame();   // records who has been spoken to
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
// Options → Quality changes the drawing scale right away
titleScene.onConfigChange = (key) => { if (key === "quality") fitCanvas(); };

// New expedition: Character Creator → Act I Prologue → Novice in the Barracks
const prologueScene = new PrologueScene(
  document.getElementById("prologue"),
  () => {
    titleScene.flash();
    beginPlaying();
    saveGame();
  }
);

const creatorScene = new CreatorScene(
  document.getElementById("creator"),
  (config, name) => {
    player = new Player(hub.width / 2, hub.height / 2, getNovice(config, name));
    player.heroName = name;
    player.avatarConfig = player.heroData.avatarConfig;
    starterKit(player);
    attachBag(player);
    quest.reset();
    codex.reset();
    prologueScene.start(name, player.avatarConfig);
  },
  () => {
    controller.clearAll();
    gameState = "TITLE";
  }
);

// The hero select is only used for the Job Awakening now
const selectScene = new SelectScene(ROSTER, (chosenHero) => {
  if (canAwaken(player)) awaken(chosenHero);
}, {
  picker: document.getElementById("picker"),
  dossier: document.getElementById("dossier")
});

// At the Job Awakening, each class is shown with its mentor (Act III)
selectScene.mentorAvatars = Object.fromEntries(
  Object.entries(MENTOR_OF).map(([cls, id]) => [cls, new Avatar(NPC_DEFS[id].look)])
);

setLayoutMode("title");
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
  Sound.init();
  if (e.code === "F2") { stage.tilemap.debug = !stage.tilemap.debug; e.preventDefault(); }

  if (actIntro.open && gameState === "PLAYING") {
    actIntro.handleInput(e);
  } else if (prologueScene.open) {
    prologueScene.handleInput(e);
  } else if (gameState === "TITLE") {
    titleScene.handleInput(e);
  } else if (gameState === "CREATE") {
    creatorScene.handleInput(e);
  } else if (gameState === "SELECT") {
    selectScene.handleInput(e);
  } else if (gameState === "GAMEOVER" && e.code === "Enter") {
    Sound.playSelectConfirm();
    backToTitle();
  } else if (actReader.open) {
    actReader.handleInput(e);
  } else if (worldMap.open) {
    if (e.code === "KeyM" || e.code === "Escape") worldMap.close();
    else if (e.code === "Tab") worldMap.toggleView();         // Kontinente / Rehiyon
    e.preventDefault();
  } else if (gameState === "PLAYING" && dialog.open) {
    dialog.handleInput(e);
  } else if (gameState === "PLAYING" && serviceMenu.open) {
    serviceMenu.handleInput(e);
  } else if (gameState === "PLAYING" && codex.open) {
    codex.handleInput(e);
  } else if (gameState === "PLAYING" && questHud.logOpen) {
    if (e.code === "KeyQ" || e.code === "Escape") questHud.closeLog();
  } else if (gameState === "PLAYING" && inventory.open) {
    if (e.code === "KeyI" || e.code === "Escape") inventory.close();
  } else if (gameState === "PLAYING" && charPanel.open) {
    if (e.code === "KeyC" || e.code === "Escape") charPanel.close();
  } else if (gameState === "PLAYING" || gameState === "PAUSED") {
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
      } else if (gameState === "PLAYING" && stage.ore && stage.ore.nearest(player)) {
        mineVein(stage.ore.nearest(player));
      } else if (gameState === "PLAYING" && npcManager.nearest) {
        talkTo(npcManager.nearest);
      }
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

    if (e.code === "KeyK" && player.heroData.id === "archer" && player.falconCompanion && player.falconCompanion.aboard) {
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

function updateGame() {
  if (player && actIntroShown === null) actIntroShown = quest.act();
  if (gameState !== "PLAYING" || !player || actIntro.open || showShopModal || showMercModal || dialog.open || serviceMenu.open || codex.open || questHud.logOpen || inventory.open || charPanel.open || actReader.open || worldMap.open) return;

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

  let closestEnemy = enemyManager.enemies
    .filter((e) => e.isAlive)
    .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0] || null;
  // Locked target (Shift): kept while alive and in reach
  if (lockedTarget) {
    const range = (player.heroData.range || 200) * 1.3;
    if (lockedTarget.isAlive && enemyManager.enemies.includes(lockedTarget) && Math.hypot(lockedTarget.x - player.x, lockedTarget.y - player.y) <= range) closestEnemy = lockedTarget;
    else lockedTarget = null;
  }
  enemyManager.lockedId = lockedTarget ? lockedTarget.id : null;

  player.update(
    controller,
    stage.bounds,
    (proj) => projectileManager.add(proj),
    closestEnemy,
    isInBarracks,
    fx
  );

  autoPotion();
  summonerHeal();

  if (player.falconCompanion) {
    player.falconCompanion.update(player, enemyManager, fx, lootManager);
  }

  const familiar = syncFamiliar(player);   // pet / familiar from the skill tree
  if (familiar) familiar.update(player, enemyManager, fx, lootManager, isInBarracks);

  if (player.angelCompanions && player.angelCompanions.length > 0) {
    player.angelCompanions.forEach((angel, idx) => {
      angel.update(player, enemyManager, fx, lootManager, idx, isInBarracks);
    });
    player.angelCompanions = player.angelCompanions.filter(a => a.isAlive);
  }

  camera.update(player.x, player.y);

  enemyManager.allies = mercManager.mercenaries;
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
  npcManager.update(player, enemyManager, fx);

  mercManager.update(player, enemyManager, lootManager, fx, (proj) => projectileManager.add(proj), stage);
  // At sea the crew keep their posts on the ship
  if (stage.boatSystem) stage.boatSystem.carry(player, crewOf());
  projectileManager.update(enemyManager.enemies, enemyManager, fx, lootManager, player);
  lootManager.update(player, fx);
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
  const missingSeal = next === "siege" && !quest.monolith
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
    const gate = hub.portals.portals.find((p) => p.dest === (next === "siege" ? "coast" : next));
    return gate ? { x: gate.x, y: gate.y } : null;
  }
  if (stage.def.rift && stage.def.rift.dest === next) return { x: stage.def.rift.x, y: stage.def.rift.y };
  // On the coast, Act XI points at the monolith (or its open portal)
  if (next === "siege" && stage.boatSystem) {
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
  const footY = player ? player.y + 21 : 0;
  npcManager.drawLayer(ctx, footY, false);   // NPCs behind the player
  lootManager.draw(ctx);
  mercManager.draw(ctx);
  enemyManager.draw(ctx);
  projectileManager.draw(ctx);

  enemyManager.targetId = player && player.target ? player.target.id : null;
  if (player && player.hp > 0) {
    player.draw(ctx);

    if (player.falconCompanion) {
      player.falconCompanion.draw(ctx, player.facing === "right");
    }
    if (player.familiar) player.familiar.draw(ctx);

    if (player.angelCompanions) {
      player.angelCompanions.forEach((angel) => {
        angel.draw(ctx);
      });
    }

    ui.drawInWorldUI(ctx, player);
    drawHealBeam();
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
  enemyManager.drawBossBar(ctx, VIEW_W);

  const isInBarracks = player ? stage.isInsideSafeZone(player.x, player.y) : false;
  ui.drawHUD(
    ctx, player, enemyManager, lootManager, stage,
    VIEW_W, gameState === "PAUSED",
    fx.timeOfDay, fx.weatherType, isInBarracks,
    {
      objective: player ? objectivePoint() : null,
      npcs: npcManager.npcs.filter((n) => npcManager.shown(n)),
      placeName: stage === hub ? t("placeHub") : stage.def.name[lang()],
      night: dayNight.night()
    }
  );

  if (gameState === "PLAYING" && !worldMap.open) drawObjectiveArrow();

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
      stageId: stage.id
    });
  }

  if (showShopModal && player) {
    ui.drawShopModal(ctx, player, VIEW_W, VIEW_H);
  }

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

function gameLoop(now = performance.now()) {
  acc += Math.min(250, now - lastTime);      // don't catch up too much after a tab switch
  lastTime = now;
  while (acc >= STEP) {
    // Hit-stop: a heavy blow freezes the fight for a few steps (drawing carries on)
    if (!(gameState === "PLAYING" && fx.consumeHitStop())) updateGame();
    acc -= STEP;
  }
  const MODES = { TITLE: "title", SELECT: "select", CREATE: "create" };
  setLayoutMode(MODES[gameState] || "play");
  dialog.update();
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
      paused: gameState === "PAUSED"
    });
    actionPanel.update({
      player,
      inSanctuary: stage.isInsideSafeZone(player.x, player.y),
      paused: gameState === "PAUSED",
      canTalk: Boolean(npcManager.nearest),
      sprinting: Boolean(player.sprinting || player.sprintLock),
      mapOpen: worldMap.open,
      inventoryOpen: inventory.open,
      charOpen: charPanel.open,
      pointsAvailable: player.statPoints > 0 || player.skillPoints > 0
    });
  }
  if (inventory.open && (gameState !== "PLAYING" || !player)) inventory.close();
  if (charPanel.open && (gameState !== "PLAYING" || !player)) charPanel.close();
  inventory.update();
  if (actReader.open && (layoutMode !== "play" || !player)) actReader.close();
  if (worldMap.open && (gameState !== "PLAYING" || !player)) worldMap.close();
  if (serviceMenu.open && (gameState !== "PLAYING" || !player)) serviceMenu.close();
  if (codex.open && (gameState !== "PLAYING" || !player)) codex.close();
  if (gameState === "TITLE") {
    titleScene.draw();
  } else if (gameState === "CREATE") {
    creatorScene.draw();
  } else if (gameState === "SELECT") {
    selectScene.draw(ctx, VIEW_W, VIEW_H);
  } else {
    renderGameWorld();
  }
  if (actIntro.open && gameState === "PLAYING") actIntro.draw(ctx, VIEW_W, VIEW_H);
  if (pendingToast && !actIntro.open) { questHud.toast(pendingToast); pendingToast = null; }
  drawFpsMeter(now);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
// Debug handle for automated testing: only active with ?debug in the URL
if (new URLSearchParams(location.search).has("debug")) {
  window.__vof = {
    get player() { return player; }, get stage() { return stage; }, get state() { return gameState; },
    quest, enemyManager, lootManager, projectileManager, mercManager, npcManager, inventory, charPanel, travelTo, saveGame, awaken, ROSTER, dayNight, dialog,
    openShop() { showShopModal = true; }, openMerc() { showMercModal = true; }, actIntro
  };
}
