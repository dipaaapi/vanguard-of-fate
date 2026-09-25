/**
 * Vanguard of Fate - 12 Story Arcs & 60-Quest Progression Engine
 * Spans Levels 1 to 100 with Delivery, Subjugation, Locating, and NPC dialogue quests.
 */

import { Sound } from "./audio.js";
import { EQUIPMENT_DB, EquipmentManager } from "./equipment.js";

export const QUEST_ARCS = [
  {
    id: 1,
    title: "Arc I: Awakening in Aethelgard",
    levelRange: "Lv. 1 - 10",
    desc: "Recover from your dimensional summoning and secure the sanctuary perimeter.",
    quests: [
      { id: "q1", title: "First Steps", type: "talking", targetNpc: "edgar", progress: 0, maxProgress: 1, desc: "Speak with Edgar the Shopkeeper in the barracks.", expReward: 80, goldReward: 50, stonesReward: 2, itemReward: "con_hp_potion", countReward: 3 },
      { id: "q2", title: "Sanctuary Perimeter", type: "locating", targetX: 640, targetY: 480, radius: 90, progress: 0, maxProgress: 1, desc: "Scout the ancient summoning stone in the barracks courtyard.", expReward: 120, goldReward: 60, stonesReward: 2, itemReward: "mat_stone", countReward: 3 },
      { id: "q3", title: "Pest Extermination", type: "subjugation", targetName: "Wild Monster", progress: 0, maxProgress: 5, desc: "Slay 5 woodland monsters outside the safe zone.", expReward: 180, goldReward: 80, stonesReward: 3, itemReward: "class_wpn_1" },
      { id: "q4", title: "Herb Gathering", type: "delivery", itemType: "herb", progress: 0, maxProgress: 3, desc: "Collect 3 Medicinal Herbs from fallen foes.", expReward: 240, goldReward: 100, stonesReward: 3, itemReward: "class_arm_1" },
      { id: "q5", title: "Guild Registration", type: "talking", targetNpc: "cedric", progress: 0, maxProgress: 1, desc: "Report to Mercenary Captain Cedric to complete initiation.", expReward: 350, goldReward: 150, stonesReward: 4, itemReward: "acc_1", statReward: 2 }
    ]
  },
  {
    id: 2,
    title: "Arc II: The Howling Wilds",
    levelRange: "Lv. 11 - 20",
    desc: "Venture into the untamed outer plains and pacify aggressive predator packs.",
    quests: [
      { id: "q6", title: "Northern Ridge Scout", type: "locating", targetX: 280, targetY: 180, radius: 90, progress: 0, maxProgress: 1, desc: "Scout the rocky ridge overlooking the northern wilderness.", expReward: 450, goldReward: 180, stonesReward: 3 },
      { id: "q7", title: "Predator Subjugation", type: "subjugation", targetName: "Wild Monster", progress: 0, maxProgress: 8, desc: "Slay 8 aggressive beasts roaming the tall grass.", expReward: 600, goldReward: 220, stonesReward: 4, itemReward: "con_speed_tonic", countReward: 3 },
      { id: "q8", title: "Beast Trophies", type: "delivery", itemType: "loot_fang", progress: 0, maxProgress: 4, desc: "Harvest 4 Beast Fangs from defeated predators.", expReward: 800, goldReward: 280, stonesReward: 4, itemReward: "acc_2" },
      { id: "q9", title: "Alpha Stalker Hunt", type: "subjugation", targetName: "Wild Monster", progress: 0, maxProgress: 12, desc: "Eliminate 12 fierce predators in the outer forest.", expReward: 1100, goldReward: 350, stonesReward: 5, itemReward: "class_wpn_2" },
      { id: "q10", title: "Wilderness Report", type: "talking", targetNpc: "cedric", progress: 0, maxProgress: 1, desc: "Brief Cedric on the pacified northern frontier.", expReward: 1500, goldReward: 450, stonesReward: 6, statReward: 3 }
    ]
  },
  {
    id: 3,
    title: "Arc III: Forgotten Catacombs",
    levelRange: "Lv. 21 - 30",
    desc: "Descend into ancient burial grounds where fallen souls rise in unrest.",
    quests: [
      { id: "q11", title: "Crypt Entrance", type: "locating", targetX: 1080, targetY: 220, radius: 90, progress: 0, maxProgress: 1, desc: "Locate the overgrown stone mausoleum in the eastern ruins.", expReward: 1800, goldReward: 500, stonesReward: 5 },
      { id: "q12", title: "Skeletal Incursion", type: "subjugation", targetName: "Undead Ghoul", progress: 0, maxProgress: 12, desc: "Purge 12 reanimated ghouls and skeleton warriors.", expReward: 2300, goldReward: 600, stonesReward: 6, itemReward: "con_cure_salve", countReward: 4 },
      { id: "q13", title: "Bone Dust Cleansing", type: "delivery", itemType: "loot_bone", progress: 0, maxProgress: 5, desc: "Collect 5 Ancient Bone Dust to sanctify the burial site.", expReward: 2900, goldReward: 700, stonesReward: 6, itemReward: "class_arm_2" },
      { id: "q14", title: "Crypt Purge", type: "subjugation", targetName: "Undead Ghoul", progress: 0, maxProgress: 16, desc: "Vanquish 16 vengeful spirits haunting the crypts.", expReward: 3600, goldReward: 850, stonesReward: 7, itemReward: "con_mana_elixir", countReward: 3 },
      { id: "q15", title: "Consecration Rite", type: "talking", targetNpc: "edgar", progress: 0, maxProgress: 1, desc: "Deliver purified bone dust to Edgar for sanctuary rituals.", expReward: 4500, goldReward: 1000, stonesReward: 8, statReward: 4 }
    ]
  },
  {
    id: 4,
    title: "Arc IV: Sunken Shoals & Sirens",
    levelRange: "Lv. 31 - 40",
    desc: "Defend coastal shipping routes against siren raiders and sea leviathans.",
    quests: [
      { id: "q16", title: "Shoal Reconnaissance", type: "locating", targetX: 1150, targetY: 780, radius: 90, progress: 0, maxProgress: 1, desc: "Scout the southern ocean cliffs and siren shoals.", expReward: 5500, goldReward: 1100, stonesReward: 7 },
      { id: "q17", title: "Tidal Raiders", type: "subjugation", targetName: "Tidal Raider", progress: 0, maxProgress: 15, desc: "Defeat 15 raiders threatening the coastal harbor.", expReward: 6800, goldReward: 1300, stonesReward: 8, itemReward: "acc_3" },
      { id: "q18", title: "Salvaged Iron", type: "delivery", itemType: "loot_ore", progress: 0, maxProgress: 5, desc: "Gather 5 Dark Iron Chunks from sunken wreckage.", expReward: 8200, goldReward: 1500, stonesReward: 8, itemReward: "con_hp_potion", countReward: 5 },
      { id: "q19", title: "Deep Sea Scourge", type: "subjugation", targetName: "Tidal Raider", progress: 0, maxProgress: 20, desc: "Slay 20 aquatic horrors surging from the waves.", expReward: 10000, goldReward: 1800, stonesReward: 9 },
      { id: "q20", title: "Harbor Restoration", type: "talking", targetNpc: "cedric", progress: 0, maxProgress: 1, desc: "Report successful maritime defense to Captain Cedric.", expReward: 12500, goldReward: 2200, stonesReward: 10, statReward: 5 }
    ]
  },
  {
    id: 5,
    title: "Arc V: Cursed Iron Mines",
    levelRange: "Lv. 41 - 50",
    desc: "Reclaim the deep mining shafts corrupted by subterranean shadow veins.",
    quests: [
      { id: "q21", title: "Collapsed Shaft", type: "locating", targetX: 180, targetY: 780, radius: 90, progress: 0, maxProgress: 1, desc: "Locate the barricaded entrance of the deep iron mines.", expReward: 15000, goldReward: 2500, stonesReward: 9 },
      { id: "q22", title: "Iron Smelting", type: "delivery", itemType: "loot_ore", progress: 0, maxProgress: 7, desc: "Mine and gather 7 Dark Iron Chunks for weapon forging.", expReward: 18000, goldReward: 2900, stonesReward: 10, itemReward: "class_wpn_3" },
      { id: "q23", title: "Mining Golem Rampage", type: "subjugation", targetName: "Corrupted Miner", progress: 0, maxProgress: 20, desc: "Destroy 20 corrupted mining beasts in the dark caverns.", expReward: 22000, goldReward: 3400, stonesReward: 11 },
      { id: "q24", title: "Deep Core Excavation", type: "subjugation", targetName: "Corrupted Miner", progress: 0, maxProgress: 24, desc: "Purge 24 subterranean horrors from the lower tunnels.", expReward: 27000, goldReward: 4000, stonesReward: 12, itemReward: "class_arm_3" },
      { id: "q25", title: "Blacksmith's Gratitude", type: "talking", targetNpc: "edgar", progress: 0, maxProgress: 1, desc: "Present the high-grade dark iron ingots to Edgar.", expReward: 33000, goldReward: 4800, stonesReward: 14, statReward: 6 }
    ]
  },
  {
    id: 6,
    title: "Arc VI: Whispering Fen",
    levelRange: "Lv. 51 - 60",
    desc: "Traverse the toxic marshland where dark hydras and venom witches lurk.",
    quests: [
      { id: "q26", title: "Sunken Bog", type: "locating", targetX: 520, targetY: 820, radius: 90, progress: 0, maxProgress: 1, desc: "Scout the stagnant heart of the Whispering Fen.", expReward: 40000, goldReward: 5500, stonesReward: 12 },
      { id: "q27", title: "Venom Extraction", type: "delivery", itemType: "loot_venom", progress: 0, maxProgress: 6, desc: "Harvest 6 Venom Glands from marsh crawlers.", expReward: 48000, goldReward: 6400, stonesReward: 13, itemReward: "con_cure_salve", countReward: 6 },
      { id: "q28", title: "Swamp Fiends", type: "subjugation", targetName: "Fen Stalker", progress: 0, maxProgress: 25, desc: "Eliminate 25 venomous stalkers in the murky depths.", expReward: 58000, goldReward: 7500, stonesReward: 15 },
      { id: "q29", title: "Hydra Brood Cull", type: "subjugation", targetName: "Fen Stalker", progress: 0, maxProgress: 30, desc: "Cull 30 giant swamp horrors to stop toxic contagion.", expReward: 70000, goldReward: 8800, stonesReward: 16, itemReward: "acc_4" },
      { id: "q30", title: "Herbalist Sanctuary", type: "talking", targetNpc: "cedric", progress: 0, maxProgress: 1, desc: "Inform Cedric of the cleared swamp supply routes.", expReward: 85000, goldReward: 10500, stonesReward: 18, statReward: 7 }
    ]
  },
  {
    id: 7,
    title: "Arc VII: Ashen Caldera",
    levelRange: "Lv. 61 - 70",
    desc: "Scale the active volcano and harvest primal elemental embers.",
    quests: [
      { id: "q31", title: "Volcanic Ridge", type: "locating", targetX: 860, targetY: 150, radius: 90, progress: 0, maxProgress: 1, desc: "Scout the scorched caldera ridge overlooking lava pools.", expReward: 100000, goldReward: 12000, stonesReward: 15 },
      { id: "q32", title: "Magma Embers", type: "delivery", itemType: "loot_ember", progress: 0, maxProgress: 7, desc: "Harvest 7 Volcanic Embers from searing fire elementals.", expReward: 120000, goldReward: 14000, stonesReward: 16 },
      { id: "q33", title: "Flame Golem Vanguard", type: "subjugation", targetName: "Magma Golem", progress: 0, maxProgress: 28, desc: "Shatter 28 magma elementals roaming the lava fields.", expReward: 145000, goldReward: 16500, stonesReward: 18, itemReward: "con_mana_elixir", countReward: 5 },
      { id: "q34", title: "Caldera Heart", type: "subjugation", targetName: "Magma Golem", progress: 0, maxProgress: 32, desc: "Defeat 32 raging flame behemoths at the volcanic core.", expReward: 175000, goldReward: 19500, stonesReward: 20 },
      { id: "q35", title: "War Council Summon", type: "talking", targetNpc: "edgar", progress: 0, maxProgress: 1, desc: "Deliver the forged flame cores to Master Edgar.", expReward: 210000, goldReward: 23000, stonesReward: 22, statReward: 8 }
    ]
  },
  {
    id: 8,
    title: "Arc VIII: Frozen Citadel of Frost",
    levelRange: "Lv. 71 - 80",
    desc: "Endure sub-zero blizzards to conquer the frost revenants and giant ice colossi.",
    quests: [
      { id: "q36", title: "Glacial Spire", type: "locating", targetX: 130, targetY: 130, radius: 90, progress: 0, maxProgress: 1, desc: "Reach the frozen mountain summit and survey the blizzard.", expReward: 250000, goldReward: 27000, stonesReward: 18 },
      { id: "q37", title: "Permafrost Shards", type: "delivery", itemType: "loot_frost", progress: 0, maxProgress: 7, desc: "Collect 7 Permafrost Shards from ancient ice beasts.", expReward: 300000, goldReward: 31000, stonesReward: 20, itemReward: "class_wpn_4" },
      { id: "q38", title: "Frost Revenant Scourge", type: "subjugation", targetName: "Frost Revenant", progress: 0, maxProgress: 30, desc: "Purge 30 icy phantoms haunting the frozen fortress.", expReward: 360000, goldReward: 36000, stonesReward: 22 },
      { id: "q39", title: "Blizzard Colossi", type: "subjugation", targetName: "Frost Revenant", progress: 0, maxProgress: 35, desc: "Slay 35 frost giants to break the eternal winter curse.", expReward: 430000, goldReward: 42000, stonesReward: 25 },
      { id: "q40", title: "Inquisitor Briefing", type: "talking", targetNpc: "cedric", progress: 0, maxProgress: 1, desc: "Report the thawing of the northern citadel to Cedric.", expReward: 520000, goldReward: 50000, stonesReward: 28, statReward: 10 }
    ]
  },
  {
    id: 9,
    title: "Arc IX: The Shadow Citadel",
    levelRange: "Lv. 81 - 90",
    desc: "Infiltrate the fallen citadel swallowed by the Void Abyss.",
    quests: [
      { id: "q41", title: "Dread Gateway", type: "locating", targetX: 990, targetY: 890, radius: 90, progress: 0, maxProgress: 1, desc: "Locate the dark rift gate tearing through the citadel walls.", expReward: 620000, goldReward: 60000, stonesReward: 22 },
      { id: "q42", title: "Void Essence Containment", type: "delivery", itemType: "loot_essence", progress: 0, maxProgress: 8, desc: "Harvest 8 Void Essences from dread abyss fiends.", expReward: 740000, goldReward: 72000, stonesReward: 25, itemReward: "acc_5" },
      { id: "q43", title: "Dreadknight Legion", type: "subjugation", targetName: "Dread Knight", progress: 0, maxProgress: 35, desc: "Eliminate 35 armored dreadknights defending the void rift.", expReward: 880000, goldReward: 85000, stonesReward: 28 },
      { id: "q44", title: "Abyssal Incursion", type: "subjugation", targetName: "Dread Knight", progress: 0, maxProgress: 40, desc: "Vanquish 40 high-tier shadow horrors.", expReward: 1050000, goldReward: 100000, stonesReward: 32 },
      { id: "q45", title: "Grand Marshal Council", type: "talking", targetNpc: "edgar", progress: 0, maxProgress: 1, desc: "Deliver captured void cores to Edgar to reinforce town wards.", expReward: 1250000, goldReward: 120000, stonesReward: 35, statReward: 12 }
    ]
  },
  {
    id: 10,
    title: "Arc X: Astral Highlands",
    levelRange: "Lv. 91 - 95",
    desc: "Ascend past the mortal cloud layer into the starlight heavens.",
    quests: [
      { id: "q46", title: "Starfall Ridge", type: "locating", targetX: 640, targetY: 180, radius: 90, progress: 0, maxProgress: 1, desc: "Reach the pinnacle altar where falling stars converge.", expReward: 1500000, goldReward: 140000, stonesReward: 30 },
      { id: "q47", title: "Celestial Cores", type: "delivery", itemType: "loot_core", progress: 0, maxProgress: 8, desc: "Gather 8 Astral Celestial Cores from cosmic sentinels.", expReward: 1800000, goldReward: 170000, stonesReward: 35 },
      { id: "q48", title: "Archon Vanguard", type: "subjugation", targetName: "Astral Archon", progress: 0, maxProgress: 38, desc: "Defeat 38 celestial sentinels testing your worthiness.", expReward: 2200000, goldReward: 200000, stonesReward: 40 },
      { id: "q49", title: "Stargate Cleansing", type: "subjugation", targetName: "Astral Archon", progress: 0, maxProgress: 44, desc: "Cleanse 44 chaotic astral entities.", expReward: 2700000, goldReward: 240000, stonesReward: 45 },
      { id: "q50", title: "Astral Sage Attunement", type: "talking", targetNpc: "cedric", progress: 0, maxProgress: 1, desc: "Receive cosmic enlightenment from Captain Cedric.", expReward: 3300000, goldReward: 290000, stonesReward: 50, statReward: 15 }
    ]
  },
  {
    id: 11,
    title: "Arc XI: Abyssal Nexus",
    levelRange: "Lv. 96 - 98",
    desc: "Descend into the heart of the void fracture where reality unravels.",
    quests: [
      { id: "q51", title: "Core Catalyst", type: "locating", targetX: 640, targetY: 720, radius: 90, progress: 0, maxProgress: 1, desc: "Reach the pulsating core of the abyssal fracture.", expReward: 4000000, goldReward: 350000, stonesReward: 40 },
      { id: "q52", title: "Abyssal Extraction", type: "delivery", itemType: "loot_essence", progress: 0, maxProgress: 10, desc: "Gather 10 concentrated Void Essences from chaotic rifts.", expReward: 4800000, goldReward: 420000, stonesReward: 50 },
      { id: "q53", title: "Heralds of Chaos", type: "subjugation", targetName: "Chaos Herald", progress: 0, maxProgress: 42, desc: "Slay 42 heralds of the abyss.", expReward: 5800000, goldReward: 500000, stonesReward: 60 },
      { id: "q54", title: "Rift Collapse", type: "subjugation", targetName: "Chaos Herald", progress: 0, maxProgress: 48, desc: "Destroy 48 void aberrations to seal the planar fissure.", expReward: 7000000, goldReward: 600000, stonesReward: 70 },
      { id: "q55", title: "High Council Convening", type: "talking", targetNpc: "edgar", progress: 0, maxProgress: 1, desc: "Prepare the final stand with Master Edgar.", expReward: 8500000, goldReward: 750000, stonesReward: 80, statReward: 18 }
    ]
  },
  {
    id: 12,
    title: "Arc XII: Vanguard of Fate (Transcendent Era)",
    levelRange: "Lv. 99 - 100",
    desc: "Ascend as the immortal savior of Aethelgard and conquer the Primordial Void.",
    quests: [
      { id: "q56", title: "Final Gate Alignment", type: "locating", targetX: 640, targetY: 480, radius: 90, progress: 0, maxProgress: 1, desc: "Stand in the center of the Ancient Portal to synchronize fate.", expReward: 10000000, goldReward: 900000, stonesReward: 60 },
      { id: "q57", title: "Primordial Essence", type: "delivery", itemType: "loot_core", progress: 0, maxProgress: 10, desc: "Deliver 10 Astral Celestial Cores to awaken the world tree.", expReward: 12500000, goldReward: 1100000, stonesReward: 80 },
      { id: "q58", title: "Wrath of the Void God", type: "subjugation", targetName: "Primordial Fiend", progress: 0, maxProgress: 50, desc: "Slay 50 cataclysmic primordial beasts.", expReward: 15000000, goldReward: 1400000, stonesReward: 100 },
      { id: "q59", title: "The Last Bastion", type: "subjugation", targetName: "Primordial Fiend", progress: 0, maxProgress: 60, desc: "Purge 60 ancient horrors to seal the world's fate forever.", expReward: 20000000, goldReward: 1800000, stonesReward: 150 },
      { id: "q60", title: "Ascension to Legend", type: "talking", targetNpc: "cedric", progress: 0, maxProgress: 1, desc: "Receive the crown of the ultimate Vanguard of Fate.", expReward: 30000000, goldReward: 2500000, stonesReward: 200, statReward: 25 }
    ]
  }
];

export class QuestManager {
  constructor() {
    this.currentArcIndex = 0;
    this.selectedArcIndex = 0;
    this.maxUnlockedArcIndex = 0;
    this.currentQuestIndex = 0;
    this.completedQuestIds = new Set();
    this.questInventory = {}; // { itemType: count }
    this.tab = "QUESTS";
    this.achievements = QUEST_ARCS.map(arc => ({
      id: arc.id,
      title: "Conqueror of " + (arc.title.split(':')[1] || arc.title).trim(),
      arcName: arc.title,
      levelRange: arc.levelRange,
      unlocked: false,
      unlockDate: null
    }));
  }

  getCurrentQuest() {
    const arc = QUEST_ARCS[this.currentArcIndex];
    if (!arc) return null;
    return arc.quests[this.currentQuestIndex] || null;
  }

  getCurrentArc() {
    return QUEST_ARCS[this.currentArcIndex] || null;
  }

  onMonsterKill(monsterType, player, fx) {
    const q = this.getCurrentQuest();
    if (!q || q.type !== "subjugation" || q.progress >= q.maxProgress) return;
    q.progress = Math.min(q.maxProgress, q.progress + 1);
    if (q.progress >= q.maxProgress && !q.notifiedReady) {
      q.notifiedReady = true;
      this.triggerReadyToClaim(q, fx, player);
    }
  }

  onLootPickup(itemType, count = 1, player, fx) {
    this.questInventory[itemType] = (this.questInventory[itemType] || 0) + count;
    const q = this.getCurrentQuest();
    if (!q || q.type !== "delivery" || q.progress >= q.maxProgress) return;
    if (q.itemType === itemType || (q.itemType === "herb" && itemType === "herb")) {
      q.progress = Math.min(q.maxProgress, (this.questInventory[itemType] || 0));
      if (q.progress >= q.maxProgress && !q.notifiedReady) {
        q.notifiedReady = true;
        this.triggerReadyToClaim(q, fx, player);
      }
    }
  }

  checkLocation(playerX, playerY, fx, player) {
    const q = this.getCurrentQuest();
    if (!q || q.type !== "locating" || q.progress >= q.maxProgress) return;
    const dist = Math.hypot(playerX - q.targetX, playerY - q.targetY);
    if (dist <= q.radius) {
      q.progress = 1;
      q.notifiedReady = true;
      this.triggerReadyToClaim(q, fx, player);
    }
  }

  onNpcTalk(npcId, player, fx) {
    const q = this.getCurrentQuest();
    if (!q || q.type !== "talking") return false;
    if (q.targetNpc.toLowerCase() === npcId.toLowerCase()) {
      q.progress = 1;
      this.completeCurrentQuest(player, fx);
      return true;
    }
    return false;
  }

  triggerReadyToClaim(q, fx, player) {
    if (Sound && Sound.playStoryChime) Sound.playStoryChime();
    if (fx && fx.spawnDamagePopup) {
      fx.spawnDamagePopup(player.x + 10, player.y - 12, "QUEST READY TO CLAIM! [Q]", true, "#ffd166");
    }
  }

  completeCurrentQuest(player, fx) {
    const q = this.getCurrentQuest();
    if (!q || q.progress < q.maxProgress) return false;

    // Deduct delivery items
    if (q.type === "delivery" && q.itemType) {
      this.questInventory[q.itemType] = Math.max(0, (this.questInventory[q.itemType] || 0) - q.maxProgress);
    }

    this.completedQuestIds.add(q.id);

    // Grant Rewards
    if (q.expReward && player.gainExp) {
      player.gainExp(q.expReward, fx);
    }
    if (q.goldReward) {
      player.gold = (player.gold || 0) + q.goldReward;
    }
    if (q.stonesReward) {
      player.upgradeStones = (player.upgradeStones || 0) + q.stonesReward;
    }
    if (q.statReward) {
      player.statPoints = (player.statPoints || 0) + q.statReward;
    }

    // Class tailored item reward
    if (q.itemReward) {
      let rewardItemKey = q.itemReward;
      if (rewardItemKey.startsWith("class_")) {
        const heroPrefix = (player.heroData && player.heroData.id) ? player.heroData.id.charAt(0) : "k";
        const suffix = rewardItemKey.replace("class_", ""); // e.g. "wpn_1" -> "k_wpn_1"
        rewardItemKey = heroPrefix + "_" + suffix;
      }
      const instance = EquipmentManager.createItemInstance(rewardItemKey);
      if (instance && player.inventory) {
        player.inventory.push(instance);
        if (fx && fx.spawnDamagePopup) {
          fx.spawnDamagePopup(player.x + 10, player.y - 20, "+" + instance.name, true, "#38bdf8");
        }
      }
    }

    if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();
    if (fx && fx.spawnDamagePopup) {
      fx.spawnDamagePopup(player.x + 10, player.y - 8, "QUEST COMPLETE! +" + q.expReward + " EXP", true, "#4ade80");
    }

    // Advance to next sub-quest or next arc
    const currentArc = QUEST_ARCS[this.currentArcIndex];
    this.currentQuestIndex++;

    if (this.currentQuestIndex >= currentArc.quests.length) {
      // 🏆 COMPLETED CURRENT ACT / ARC!
      if (this.achievements && this.achievements[this.currentArcIndex]) {
        this.achievements[this.currentArcIndex].unlocked = true;
        this.achievements[this.currentArcIndex].unlockDate = new Date().toLocaleDateString();
      }

      // Trigger grand achievement animation & fanfare
      if (fx && fx.triggerArcCelebration) {
        fx.triggerArcCelebration(currentArc.title, currentArc.id);
      }

      this.currentQuestIndex = 0;
      const nextArcIndex = Math.min(QUEST_ARCS.length - 1, this.currentArcIndex + 1);
      this.maxUnlockedArcIndex = Math.max(this.maxUnlockedArcIndex || 0, nextArcIndex);
      this.currentArcIndex = nextArcIndex;
      this.selectedArcIndex = nextArcIndex;

      const newArc = QUEST_ARCS[this.currentArcIndex];
      if (newArc && fx && fx.spawnDamagePopup) {
        fx.spawnDamagePopup(player.x + 10, player.y - 28, "🌟 BEGAN " + newArc.title + "!", true, "#facc15");
      }
    }
    return true;
  }
}
