/**
 * Vanguard of Fate - Equipment & +15 Enhancement Engine
 * Supports class-specific Weapons, Armors, Accessories, Consumables, and Upgrade Stones.
 */

export const EQUIPMENT_SLOTS = ["weapon", "armor", "accessory"];

export const SUCCESS_RATES = {
  0: 1.00,  // +0 -> +1 (100%)
  1: 1.00,  // +1 -> +2 (100%)
  2: 1.00,  // +2 -> +3 (100%)
  3: 0.85,  // +3 -> +4 (85%)
  4: 0.75,  // +4 -> +5 (75%)
  5: 0.70,  // +5 -> +6 (70%)
  6: 0.55,  // +6 -> +7 (55%)
  7: 0.48,  // +7 -> +8 (48%)
  8: 0.40,  // +8 -> +9 (40%)
  9: 0.32,  // +9 -> +10 (32%)
  10: 0.28, // +10 -> +11 (28%)
  11: 0.22, // +11 -> +12 (22%)
  12: 0.16, // +12 -> +13 (16%)
  13: 0.11, // +13 -> +14 (11%)
  14: 0.08  // +14 -> +15 (8%)
};

export const ENHANCE_COSTS = {
  0: { gold: 30, stones: 1 },
  1: { gold: 50, stones: 1 },
  2: { gold: 80, stones: 1 },
  3: { gold: 120, stones: 2 },
  4: { gold: 180, stones: 2 },
  5: { gold: 260, stones: 2 },
  6: { gold: 380, stones: 3 },
  7: { gold: 520, stones: 3 },
  8: { gold: 700, stones: 4 },
  9: { gold: 950, stones: 4 },
  10: { gold: 1300, stones: 5 },
  11: { gold: 1800, stones: 6 },
  12: { gold: 2500, stones: 7 },
  13: { gold: 3600, stones: 8 },
  14: { gold: 5000, stones: 10 }
};

export function getEnhanceMultiplier(plus) {
  if (!plus || plus <= 0) return 1.0;
  return 1.0 + (plus * 0.14) + (plus >= 10 ? (plus - 9) * 0.08 : 0);
}

export const EQUIPMENT_DB = {
  // === KNIGHT WEAPONS & ARMOR ===
  "k_wpn_1": { id: "k_wpn_1", name: "Iron Vanguard Blade", type: "weapon", classReq: "knight", levelReq: 1, baseAtk: 8, baseDef: 2, price: 60, icon: "⚔️", desc: "Standard iron broadsword forged for new recruits." },
  "k_wpn_2": { id: "k_wpn_2", name: "Sunsteel Claymore", type: "weapon", classReq: "knight", levelReq: 20, baseAtk: 24, baseDef: 6, price: 320, icon: "⚔️", desc: "Gleaming greatsword infused with radiant solar light." },
  "k_wpn_3": { id: "k_wpn_3", name: "Aegisbreaker Greatsword", type: "weapon", classReq: "knight", levelReq: 50, baseAtk: 68, baseDef: 18, price: 1200, icon: "⚔️", desc: "Ancient blade capable of sundering abyssal barriers." },
  "k_wpn_4": { id: "k_wpn_4", name: "Fate's Vanguard Excalibur", type: "weapon", classReq: "knight", levelReq: 85, baseAtk: 160, baseDef: 45, price: 4800, icon: "⚔️", desc: "The legendary transcendent blade of the High Guardian." },

  "k_arm_1": { id: "k_arm_1", name: "Reinforced Chainmail", type: "armor", classReq: "knight", levelReq: 1, baseDef: 6, baseHp: 30, price: 50, icon: "🛡️", desc: "Sturdy interlocking steel mail for infantry." },
  "k_arm_2": { id: "k_arm_2", name: "Radiant Paladin Plate", type: "armor", classReq: "knight", levelReq: 25, baseDef: 22, baseHp: 110, price: 450, icon: "🛡️", desc: "Blessed plate armor that reflects chaotic strikes." },
  "k_arm_3": { id: "k_arm_3", name: "Dreadnought Bastion Cuirass", type: "armor", classReq: "knight", levelReq: 60, baseDef: 60, baseHp: 320, price: 1800, icon: "🛡️", desc: "Heavy titanic armor forged from fallen mountain cores." },

  // === FIGHTER WEAPONS & ARMOR ===
  "f_wpn_1": { id: "f_wpn_1", name: "Spiked Leather Wraps", type: "weapon", classReq: "fighter", levelReq: 1, baseAtk: 10, baseCrit: 3, price: 60, icon: "🥊", desc: "Reinforced knuckle wraps studded with hardened iron." },
  "f_wpn_2": { id: "f_wpn_2", name: "Dragon Claw Cestus", type: "weapon", classReq: "fighter", levelReq: 20, baseAtk: 28, baseCrit: 7, price: 320, icon: "🥊", desc: "Bladed gauntlets forged from volcanic drake talons." },
  "f_wpn_3": { id: "f_wpn_3", name: "Thunder God Gauntlets", type: "weapon", classReq: "fighter", levelReq: 50, baseAtk: 78, baseCrit: 14, price: 1200, icon: "🥊", desc: "Crackles with tempestuous kinetic shockwaves." },
  "f_wpn_4": { id: "f_wpn_4", name: "Asura's Fist of Oblivion", type: "weapon", classReq: "fighter", levelReq: 85, baseAtk: 185, baseCrit: 25, price: 4800, icon: "🥊", desc: "Mythic fist weapons that rupture space with every punch." },

  "f_arm_1": { id: "f_arm_1", name: "Brawler's Martial Gi", type: "armor", classReq: "fighter", levelReq: 1, baseDef: 4, baseHp: 25, baseSpeed: 0.1, price: 50, icon: "🥋", desc: "Lightweight tunic granting unhindered agility." },
  "f_arm_2": { id: "f_arm_2", name: "Tiger-Stripe Battle Tunic", type: "armor", classReq: "fighter", levelReq: 25, baseDef: 16, baseHp: 90, baseSpeed: 0.25, price: 450, icon: "🥋", desc: "Tough hide vest woven with beast spirit threads." },
  "f_arm_3": { id: "f_arm_3", name: "Grandmaster's Chi Robe", type: "armor", classReq: "fighter", levelReq: 60, baseDef: 48, baseHp: 260, baseSpeed: 0.5, price: 1800, icon: "🥋", desc: "Embroidered silk that channels inner life-force." },

  // === MAGE WEAPONS & ARMOR ===
  "m_wpn_1": { id: "m_wpn_1", name: "Apprentice Oak Wand", type: "weapon", classReq: "mage", levelReq: 1, baseAtk: 9, baseCrit: 2, price: 60, icon: "🪄", desc: "Carved from elder wood to focus early mana." },
  "m_wpn_2": { id: "m_wpn_2", name: "Staff of Astral Resonance", type: "weapon", classReq: "mage", levelReq: 20, baseAtk: 26, baseCrit: 6, price: 320, icon: "🪄", desc: "A glowing staff crowned with an uncut mana crystal." },
  "m_wpn_3": { id: "m_wpn_3", name: "Cataclysmic Arch-Staff", type: "weapon", classReq: "mage", levelReq: 50, baseAtk: 72, baseCrit: 12, price: 1200, icon: "🪄", desc: "Summons concentrated starlight and apocalyptic meteors." },
  "m_wpn_4": { id: "m_wpn_4", name: "Chronos Cosmic Scepter", type: "weapon", classReq: "mage", levelReq: 85, baseAtk: 172, baseCrit: 22, price: 4800, icon: "🪄", desc: "Artifact staff bending time and celestial ether." },

  "m_arm_1": { id: "m_arm_1", name: "Manaweave Vestment", type: "armor", classReq: "mage", levelReq: 1, baseDef: 3, baseHp: 20, price: 50, icon: "🔮", desc: "Cloth woven with enchanted silver threads." },
  "m_arm_2": { id: "m_arm_2", name: "Starlight Sorcerer Robes", type: "armor", classReq: "mage", levelReq: 25, baseDef: 14, baseHp: 80, price: 450, icon: "🔮", desc: "Glimmers with celestial warding runes." },
  "m_arm_3": { id: "m_arm_3", name: "Archmage's Void Cloak", type: "armor", classReq: "mage", levelReq: 60, baseDef: 42, baseHp: 240, price: 1800, icon: "🔮", desc: "Shrouds the wearer in deep cosmic protection." },

  // === ARCHER WEAPONS & ARMOR ===
  "a_wpn_1": { id: "a_wpn_1", name: "Recurve Hunting Bow", type: "weapon", classReq: "archer", levelReq: 1, baseAtk: 9, baseCrit: 4, price: 60, icon: "🏹", desc: "Flexible yew bow designed for swift hunting." },
  "a_wpn_2": { id: "a_wpn_2", name: "Eagle-Eye Composite Bow", type: "weapon", classReq: "archer", levelReq: 20, baseAtk: 27, baseCrit: 8, price: 320, icon: "🏹", desc: "Reinforced with horn and sinew for piercing power." },
  "a_wpn_3": { id: "a_wpn_3", name: "Tempest Gale Longbow", type: "weapon", classReq: "archer", levelReq: 50, baseAtk: 75, baseCrit: 15, price: 1200, icon: "🏹", desc: "Fires arrows coated in razor-sharp wind blades." },
  "a_wpn_4": { id: "a_wpn_4", name: "Celestial Star Bow Artemis", type: "weapon", classReq: "archer", levelReq: 85, baseAtk: 178, baseCrit: 26, price: 4800, icon: "🏹", desc: "Legendary bow shooting beams of concentrated starlight." },

  "a_arm_1": { id: "a_arm_1", name: "Scout's Camo Leather", type: "armor", classReq: "archer", levelReq: 1, baseDef: 4, baseHp: 22, baseSpeed: 0.15, price: 50, icon: "🎯", desc: "Supple leather made for silent movement." },
  "a_arm_2": { id: "a_arm_2", name: "Windrunner's Garb", type: "armor", classReq: "archer", levelReq: 25, baseDef: 15, baseHp: 85, baseSpeed: 0.35, price: 450, icon: "🎯", desc: "Infused with breeze spirits to hasten every step." },
  "a_arm_3": { id: "a_arm_3", name: "Shadowfang Stalker Vest", type: "armor", classReq: "archer", levelReq: 60, baseDef: 45, baseHp: 250, baseSpeed: 0.6, price: 1800, icon: "🎯", desc: "Master hunter garb that blends seamlessly with the mist." },

  // === PRIEST WEAPONS & ARMOR ===
  "p_wpn_1": { id: "p_wpn_1", name: "Novice Blessing Wand", type: "weapon", classReq: "priest", levelReq: 1, baseAtk: 8, baseHp: 15, price: 60, icon: "✨", desc: "A consecrated silver wand for channelers." },
  "p_wpn_2": { id: "p_wpn_2", name: "Scepter of Divine Grace", type: "weapon", classReq: "priest", levelReq: 20, baseAtk: 25, baseHp: 45, price: 320, icon: "✨", desc: "Radiates holy sanctuary energy to purify evil." },
  "p_wpn_3": { id: "p_wpn_3", name: "Archon Holy Reliquary", type: "weapon", classReq: "priest", levelReq: 50, baseAtk: 70, baseHp: 140, price: 1200, icon: "✨", desc: "Houses sacred celestial embers of ancient angels." },
  "p_wpn_4": { id: "p_wpn_4", name: "Seraphim Judgement Staff", type: "weapon", classReq: "priest", levelReq: 85, baseAtk: 165, baseHp: 380, price: 4800, icon: "✨", desc: "Commands divine judgement and angelic resurrection." },

  "p_arm_1": { id: "p_arm_1", name: "Acolyte Robes", type: "armor", classReq: "priest", levelReq: 1, baseDef: 4, baseHp: 25, price: 50, icon: "🕊️", desc: "Simple woven white cloth blessed by the sanctuary." },
  "p_arm_2": { id: "p_arm_2", name: "Sanctified Habit", type: "armor", classReq: "priest", levelReq: 25, baseDef: 18, baseHp: 100, price: 450, icon: "🕊️", desc: "Holy garment that continually purges foul toxins." },
  "p_arm_3": { id: "p_arm_3", name: "High Seraph's Regalia", type: "armor", classReq: "priest", levelReq: 60, baseDef: 50, baseHp: 300, price: 1800, icon: "🕊️", desc: "Blessed celestial vestment woven with golden angel wings." },

  // === ACCESSORIES (ALL CLASSES) ===
  "acc_1": { id: "acc_1", name: "Copper Signet Ring", type: "accessory", classReq: "all", levelReq: 1, baseAtk: 3, baseHp: 15, price: 40, icon: "💍", desc: "A simple copper band giving courage to recruits." },
  "acc_2": { id: "acc_2", name: "Amulet of the Swift Wind", type: "accessory", classReq: "all", levelReq: 15, baseSpeed: 0.3, baseCrit: 4, price: 200, icon: "📿", desc: "Light pendant that lightens the bearer's footsteps." },
  "acc_3": { id: "acc_3", name: "Ruby Heart Talisman", type: "accessory", classReq: "all", levelReq: 35, baseHp: 120, baseDef: 12, price: 650, icon: "💎", desc: "Pulsing blood gem bolstering health pool." },
  "acc_4": { id: "acc_4", name: "Abyssal Void Band", type: "accessory", classReq: "all", levelReq: 65, baseAtk: 35, baseCrit: 12, price: 2200, icon: "💍", desc: "Forged in twilight darkness to amplify destructive impact." },
  "acc_5": { id: "acc_5", name: "Pinnacle Crown of Fate", type: "accessory", classReq: "all", levelReq: 90, baseAtk: 60, baseDef: 25, baseHp: 250, baseCrit: 15, baseSpeed: 0.5, price: 6000, icon: "👑", desc: "Transcendent relic of the ultimate Vanguard." },

  // === CONSUMABLES & UPGRADE MATERIALS ===
  "mat_stone": { id: "mat_stone", name: "Upgrade Stone", type: "material", price: 40, sellPrice: 20, icon: "🪨", desc: "Refined celestial ore required to forge weapons and armor up to +15." },
  "con_hp_potion": { id: "con_hp_potion", name: "Greater Health Potion", type: "consumable", price: 20, sellPrice: 10, icon: "🧪", desc: "Instantly restores 60 HP upon consumption." },
  "con_mana_elixir": { id: "con_mana_elixir", name: "Elixir of Focus", type: "consumable", price: 35, sellPrice: 18, icon: "🧴", desc: "Instantly resets all skill cooldowns." },
  "con_speed_tonic": { id: "con_speed_tonic", name: "Swiftstride Tonic", type: "consumable", price: 30, sellPrice: 15, icon: "🍷", desc: "Grants +40% movement speed for 12 seconds." },
  "con_cure_salve": { id: "con_cure_salve", name: "Purification Salve", type: "consumable", price: 15, sellPrice: 8, icon: "🌿", desc: "Cures all bleeding, burn, poison, and abnormal status." }
};

export const MONSTER_LOOT_TABLE = {
  "loot_fang": { id: "loot_fang", name: "Beast Fang", price: 12, icon: "🦷", desc: "Sharp predator canine. Valued by craftsmen." },
  "loot_pelt": { id: "loot_pelt", name: "Thick Fur Pelt", price: 18, icon: "🦊", desc: "Warm monster fur harvested from the wild." },
  "loot_bone": { id: "loot_bone", name: "Ancient Bone Dust", price: 25, icon: "💀", desc: "Crypt residue infused with dark lingering mana." },
  "loot_ore": { id: "loot_ore", name: "Dark Iron Chunk", price: 35, icon: "⛏️", desc: "Heavy subterranean iron sought after by smiths." },
  "loot_venom": { id: "loot_venom", name: "Venom Gland", price: 45, icon: "🧪", desc: "Toxic gland from marsh crawlers." },
  "loot_ember": { id: "loot_ember", name: "Volcanic Ember", price: 60, icon: "🔥", desc: "Searing magma crystal from the Ashen Caldera." },
  "loot_frost": { id: "loot_frost", name: "Permafrost Shard", price: 80, icon: "❄️", desc: "Never-melting crystalline ice from the Frozen Citadel." },
  "loot_essence": { id: "loot_essence", name: "Void Essence", price: 110, icon: "🌌", desc: "Condensed shadowy core of abyssal fiends." },
  "loot_core": { id: "loot_core", name: "Astral Celestial Core", price: 150, icon: "⭐", desc: "Radiant starlight essence of supreme monsters." }
};

export class EquipmentManager {
  static createItemInstance(templateId, plus = 0) {
    const template = EQUIPMENT_DB[templateId];
    if (!template) return null;
    return {
      ...template,
      uid: "item_" + Math.random().toString(36).substring(2, 9),
      plus: Math.max(0, Math.min(15, plus))
    };
  }

  static getCalculatedStats(item) {
    if (!item) return { atk: 0, def: 0, hp: 0, crit: 0, speed: 0 };
    const mult = getEnhanceMultiplier(item.plus || 0);
    return {
      atk: Math.round((item.baseAtk || 0) * mult),
      def: Math.round((item.baseDef || 0) * mult),
      hp: Math.round((item.baseHp || 0) * mult),
      crit: Number(((item.baseCrit || 0) * (1 + (item.plus || 0) * 0.05)).toFixed(1)),
      speed: Number(((item.baseSpeed || 0) * (1 + (item.plus || 0) * 0.03)).toFixed(2))
    };
  }

  static enhanceItem(item, player) {
    if (!item || item.plus >= 15) {
      return { success: false, newPlus: item ? item.plus : 0, message: "ALREADY MAX ENHANCEMENT (+15)!" };
    }

    const currentPlus = item.plus || 0;
    const cost = ENHANCE_COSTS[currentPlus] || { gold: 100, stones: 1 };
    const rate = SUCCESS_RATES[currentPlus] || 0.10;

    const playerStones = player.upgradeStones || 0;
    if (player.gold < cost.gold || playerStones < cost.stones) {
      return {
        success: false,
        newPlus: currentPlus,
        message: "INSUFFICIENT RESOURCES! Need " + cost.gold + "G and " + cost.stones + " Stones."
      };
    }

    player.gold -= cost.gold;
    player.upgradeStones -= cost.stones;

    const roll = Math.random();
    if (roll <= rate) {
      item.plus = currentPlus + 1;
      return {
        success: true,
        newPlus: item.plus,
        message: "FORGING SUCCESS! " + item.name + " is now +" + item.plus + "!",
        lostRank: false
      };
    } else {
      let lostRank = false;
      if (currentPlus >= 7) {
        if (Math.random() < 0.40) {
          item.plus = Math.max(0, currentPlus - 1);
          lostRank = true;
        }
      }
      return {
        success: false,
        newPlus: item.plus,
        message: lostRank ? ("FORGE FAILED! Item dropped to +" + item.plus + "!") : ("FORGE FAILED! Item level retained (+" + item.plus + ")."),
        lostRank: lostRank
      };
    }
  }
}
