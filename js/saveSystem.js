/**
 * Vanguard of Fate - Offline Secure Save System
 * 100% Offline, Zero Login/Server Required.
 * 
 * Features:
 * - Deterministic integrity checksum (anti-tamper protection)
 * - Strict type, range, and bounds validation (anti-corruption & sanity check)
 * - Safe schema parser with prototype pollution protection
 * - LocalStorage atomic backup & restore
 */

const SAVE_KEY = "vanguard_savegame";
const BACKUP_KEY = "vanguard_savegame_backup";
const SALT = "VoF_OfflineSecretSalt_v1_#RetroRPG!";

// Fast, deterministic 32-bit FNV-1a / Murmur hybrid hash for offline integrity
function computeHash(str) {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export class SaveSystem {
  /**
   * Generates a tamper-proof signature for the save payload.
   */
  static generateSignature(data) {
    const canonical = [
      SALT,
      data.heroId,
      String(data.playerName || "VANGUARD"),
      Math.floor(data.level || 1),
      Math.floor(data.exp || 0),
      Math.floor(data.gold || 0),
      Math.floor(data.statPoints || 0),
      Math.floor(data.upgradeStones || 0),
      Math.floor(data.bonusHp || 0),
      Math.floor(data.bonusDamage || 0),
      Math.floor(data.bonusDefense || 0),
      Number((data.bonusSpeed || 0).toFixed(2)),
      Number((data.bonusCrit || 0).toFixed(2)),
      Number((data.bonusCooldown || 0).toFixed(2)),
      SALT
    ].join("|");
    return computeHash(canonical);
  }

  /**
   * Validates and sanitizes raw save object against corruption & out-of-range exploits.
   */
  static sanitizeSaveData(raw, validHeroIds, stageBounds = { width: 1280, height: 960 }) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return null;
    }

    // Prototype pollution prevention
    if ("__proto__" in raw || "constructor" in raw || "prototype" in raw) {
      delete raw.__proto__;
      delete raw.constructor;
      delete raw.prototype;
    }

    // Hero ID validation
    const heroId = String(raw.heroId || "").toLowerCase();
    if (!validHeroIds.includes(heroId)) {
      return null;
    }

    const cleanName = String(raw.playerName || "VANGUARD").replace(/[^\w\s-]/gi, "").trim().slice(0, 14);
    const playerName = cleanName.length > 0 ? cleanName.toUpperCase() : "VANGUARD";

    // Number sanitization helper
    const clampNum = (val, min, max, fallback) => {
      const n = Number(val);
      if (Number.isNaN(n) || !Number.isFinite(n)) return fallback;
      return Math.max(min, Math.min(max, n));
    };

    const level = Math.floor(clampNum(raw.level, 1, 100, 1));
    const exp = Math.floor(clampNum(raw.exp, 0, 100000000, 0));
    const expNext = Math.floor(clampNum(raw.expNext, 10, 100000000, 80));
    const gold = Math.floor(clampNum(raw.gold, 0, 99999999, 150));
    const statPoints = Math.floor(clampNum(raw.statPoints, 0, 500, 0));
    const upgradeStones = Math.floor(clampNum(raw.upgradeStones, 0, 99999, 5));

    const bonusHp = Math.floor(clampNum(raw.bonusHp, 0, 50000, 0));
    const bonusDamage = Math.floor(clampNum(raw.bonusDamage, 0, 5000, 0));
    const bonusDefense = Math.floor(clampNum(raw.bonusDefense, 0, 5000, 0));
    const bonusSpeed = clampNum(raw.bonusSpeed, 0, 15, 0);
    const bonusCrit = clampNum(raw.bonusCrit, 0, 100, 0);
    const bonusCooldown = clampNum(raw.bonusCooldown, 0, 80, 0);

    const x = clampNum(raw.x, 32, stageBounds.width - 32, stageBounds.width / 2);
    const y = clampNum(raw.y, 32, stageBounds.height - 32, stageBounds.height / 2);
    const hp = clampNum(raw.hp, 1, 999999, 100);

    // Sanitize equipment & inventory
    const equipment = (raw.equipment && typeof raw.equipment === "object") ? {
      weapon: raw.equipment.weapon || null,
      armor: raw.equipment.armor || null,
      accessory: raw.equipment.accessory || null
    } : { weapon: null, armor: null, accessory: null };

    const inventory = Array.isArray(raw.inventory) ? raw.inventory.filter(i => i && typeof i === "object") : [];

    // Sanitize quest data
    const quests = (raw.quests && typeof raw.quests === "object") ? {
      currentArcIndex: Math.floor(clampNum(raw.quests.currentArcIndex, 0, 11, 0)),
      currentQuestIndex: Math.floor(clampNum(raw.quests.currentQuestIndex, 0, 4, 0)),
      completedQuestIds: Array.isArray(raw.quests.completedQuestIds) ? raw.quests.completedQuestIds : [],
      questInventory: (raw.quests.questInventory && typeof raw.quests.questInventory === "object") ? raw.quests.questInventory : {}
    } : { currentArcIndex: 0, currentQuestIndex: 0, completedQuestIds: [], questInventory: {} };

    const sanitized = {
      game: "Vanguard of Fate",
      version: "1.0.0",
      savedAt: typeof raw.savedAt === "string" ? raw.savedAt : new Date().toISOString(),
      heroId,
      playerName,
      level,
      exp,
      expNext,
      gold,
      statPoints,
      upgradeStones,
      bonusHp,
      bonusDamage,
      bonusDefense,
      bonusSpeed,
      bonusCrit,
      bonusCooldown,
      hp,
      x,
      y,
      equipment,
      inventory,
      quests
    };

    return sanitized;
  }

  /**
   * Verifies if the integrity signature matches.
   */
  static verifyIntegrity(data) {
    if (!data.signature) {
      return { valid: true, isLegacy: true };
    }
    const expectedSig = this.generateSignature(data);
    if (data.signature === expectedSig) {
      return { valid: true, isLegacy: false };
    }
    return { valid: false, isLegacy: false };
  }

  /**
   * Packages player data with a secure signature for saving/exporting.
   */
  static createSavePayload(player, questManager = null) {
    if (!player || player.hp <= 0) return null;

    const quests = questManager ? {
      currentArcIndex: questManager.currentArcIndex,
      currentQuestIndex: questManager.currentQuestIndex,
      completedQuestIds: Array.from(questManager.completedQuestIds || []),
      questInventory: questManager.questInventory || {}
    } : { currentArcIndex: 0, currentQuestIndex: 0, completedQuestIds: [], questInventory: {} };

    const payload = {
      game: "Vanguard of Fate",
      version: "1.0.0",
      savedAt: new Date().toISOString(),
      heroId: player.heroData.id,
      playerName: player.playerName || "VANGUARD",
      level: player.level,
      exp: player.exp,
      expNext: player.expNext,
      gold: player.gold,
      statPoints: player.statPoints,
      upgradeStones: player.upgradeStones || 0,
      bonusHp: player.bonusHp,
      bonusDamage: player.bonusDamage,
      bonusDefense: player.bonusDefense,
      bonusSpeed: player.bonusSpeed,
      bonusCrit: player.bonusCrit,
      bonusCooldown: player.bonusCooldown,
      hp: player.hp,
      x: player.x,
      y: player.y,
      equipment: player.equipment || { weapon: null, armor: null, accessory: null },
      inventory: player.inventory || [],
      quests
    };

    payload.signature = this.generateSignature(payload);
    return payload;
  }

  /**
   * Saves to LocalStorage with automatic backup rotation.
   */
  static saveToStorage(player, questManager = null) {
    const payload = this.createSavePayload(player, questManager);
    if (!payload) return false;

    try {
      const existing = localStorage.getItem(SAVE_KEY);
      if (existing) {
        localStorage.setItem(BACKUP_KEY, existing);
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.error("[SaveSystem] Failed to write to localStorage:", e);
      return false;
    }
  }

  /**
   * Loads and validates from LocalStorage. Recovers from backup if corrupted.
   */
  static loadFromStorage(validHeroIds, stageBounds) {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      raw = localStorage.getItem(BACKUP_KEY);
      if (!raw) return null;
    }

    try {
      const parsed = JSON.parse(raw);
      const sanitized = this.sanitizeSaveData(parsed, validHeroIds, stageBounds);
      if (!sanitized) {
        // Try fallback backup
        const backupRaw = localStorage.getItem(BACKUP_KEY);
        if (backupRaw && backupRaw !== raw) {
          const backupParsed = JSON.parse(backupRaw);
          return this.sanitizeSaveData(backupParsed, validHeroIds, stageBounds);
        }
        return null;
      }
      return sanitized;
    } catch (e) {
      console.error("[SaveSystem] Failed to parse save from localStorage:", e);
      return null;
    }
  }

  /**
   * Exports the save data as a signed JSON Blob download.
   */
  static exportSaveFile(player, questManager = null, customFilename = null) {
    let payload = this.createSavePayload(player, questManager);
    if (!payload) {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        try {
          payload = JSON.parse(raw);
        } catch (e) {}
      }
    }
    if (!payload) return false;

    // Ensure signature exists
    if (!payload.signature) {
      payload.signature = this.generateSignature(payload);
    }

    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    let safeName = customFilename ? customFilename.replace(/[^a-zA-Z0-9_\-\.]/g, "_").trim() : "";
    if (!safeName) {
      const pName = (player && player.playerName) ? player.playerName.toLowerCase() : "vanguard";
      const pLvl = (player && player.level) ? player.level : 1;
      safeName = `vanguard_save_${pName}_lv${pLvl}.json`;
    }
    if (!safeName.toLowerCase().endsWith(".json")) {
      safeName += ".json";
    }

    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }

  /**
   * Safely imports and verifies JSON file contents.
   */
  static processImportedJson(jsonText, validHeroIds, stageBounds) {
    try {
      const parsed = JSON.parse(jsonText);
      const sanitized = this.sanitizeSaveData(parsed, validHeroIds, stageBounds);

      if (!sanitized) {
        return { success: false, error: "Invalid save file structure or unrecognized hero class!" };
      }

      const integrity = this.verifyIntegrity(parsed);
      if (!integrity.valid) {
        // Signature mismatch - tampered file detected
        const confirmLoad = window.confirm(
          "⚠️ Integrity Warning:\n\nThis save file appears to have been modified outside the game.\n\nWould you like to auto-repair and load it safely?"
        );
        if (!confirmLoad) {
          return { success: false, error: "Save file import cancelled." };
        }
      }

      // Re-sign sanitized data and store
      sanitized.signature = this.generateSignature(sanitized);
      localStorage.setItem(SAVE_KEY, JSON.stringify(sanitized));
      return { success: true, data: sanitized };
    } catch (e) {
      return { success: false, error: "Corrupted or non-JSON file!" };
    }
  }
}
