// ==================== LORE CHARACTERS (LORE.md) ====================
// Every NPC is drawn with the modular Avatar. Names and dialogue live in
// js/dialogue.js (English and Filipino). `mentor` = the class they teach at the Job Awakening.

const base = { gloves: "none", legs: "pants", boots: "boots", eyes: "#4a3222" };

export const NPC_DEFS = {
  // ---- Royal family ----
  aurelia: {
    look: { ...base, body: "female", skin: "#f7d9c4", eyes: "#2f6db5", hairStyle: "long", hairColor: "#ece0b8",
      outfit: "gown", outfitColor: "#f2ecf8", legColor: "#f2ecf8", headgear: "tiara", cape: "#3b3f9a", weapon: "staff" }
  },
  kenneth: {
    look: { ...base, body: "male", skin: "#f1c27d", eyes: "#3a8a4a", hairStyle: "short", hairColor: "#2b1d14",
      outfit: "coat", outfitColor: "#2c4f8a", legColor: "#e8e2d0", bootColor: "#2b2b33", headgear: "tiara", cape: "#8a2c2c", weapon: "staff" }
  },
  king: {
    look: { ...base, body: "male", skin: "#f1c27d", hairStyle: "short", hairColor: "#c8ccd4", beard: true,
      outfit: "robe", outfitColor: "#8a2c2c", legColor: "#5a2020", bootColor: "#3a2616", headgear: "crown", cape: "#5a3d91", weapon: "scepter" }
  },
  royalGuard: {
    look: { ...base, body: "male", skin: "#e0ac69", hairStyle: "short", hairColor: "#4a2f1b",
      outfit: "armor", outfitColor: "#8a2c2c", legColor: "#7d8c9e", bootColor: "#2b2b33", headgear: "helmet", cape: "#8a2c2c", weapon: "lance" }
  },

  // ---- Barracks Sanctuary ----
  ronald: {
    look: { ...base, body: "male", skin: "#e0ac69", hairStyle: "short", hairColor: "#7a5230", beard: true, gloves: "leather",
      outfit: "armor", outfitColor: "#2c4f8a", legColor: "#3b3f4a", bootColor: "#3a2616", cape: "#8a2c2c", weapon: "sword" }
  },
  edgar: {
    look: { ...base, body: "male", skin: "#f1c27d", hairStyle: "buzz", hairColor: "#9aa0a8", glasses: true,
      outfit: "robe", outfitColor: "#2f6b3f", legColor: "#3b3f4a", bootColor: "#5e3b1a", weapon: "flask" }
  },

  // ---- Emberhold, the Dwarven Village of the Ashfall Wastelands (Act X) ----
  brakka: {   // master smith: refines to the maximum (and forges mineral sets)
    dwarf: true,
    look: { ...base, body: "male", skin: "#e0ac69", hairStyle: "buzz", hairColor: "#b45309", beard: true, gloves: "leather",
      outfit: "coat", outfitColor: "#7c2d12", legColor: "#3b2a1a", bootColor: "#2b1d14", weapon: "axe" }
  },
  hilde: {    // repairs weapons and armor
    dwarf: true,
    look: { ...base, body: "female", skin: "#f1c27d", hairStyle: "twintails", hairColor: "#c2410c", gloves: "wraps",
      outfit: "vest", outfitColor: "#57534e", legColor: "#44403c", bootColor: "#3a2616", weapon: "none" }
  },
  durgrim: {  // thane of Emberhold: gives the mining quest
    dwarf: true,
    look: { ...base, body: "male", skin: "#c68642", hairStyle: "short", hairColor: "#dfe6ee", beard: true,
      outfit: "robe", outfitColor: "#1e3a5f", legColor: "#1e293b", bootColor: "#2b2b33", headgear: "crown", cape: "#991b1b", weapon: "scepter" }
  },
  pip: {      // shopkeeper
    dwarf: true,
    look: { ...base, body: "male", skin: "#f1c27d", hairStyle: "spiky", hairColor: "#7a5230", beard: true,
      outfit: "tunic", outfitColor: "#a16207", legColor: "#57534e", bootColor: "#5e3b1a", headgear: "hat", weapon: "flask" }
  },

  // ---- The five Earthbound souls: class mentors ----
  arthur: {
    mentor: "knight",
    look: { ...base, body: "male", skin: "#c68642", eyes: "#2b1d14", hairStyle: "short", hairColor: "#2b1d14", gloves: "leather",
      outfit: "armor", outfitColor: "#c9a063", legColor: "#7d8c9e", bootColor: "#2b2b33", cape: "#8a2c2c", weapon: "lance" }
  },
  lyra: {
    mentor: "archer",
    look: { ...base, body: "female", skin: "#f7d9c4", eyes: "#3a8a4a", hairStyle: "long", hairColor: "#e0c068", ears: "elf",
      outfit: "vest", outfitColor: "#2f6b3f", legColor: "#4a3a28", bootColor: "#5e3b1a", gloves: "leather", weapon: "bow" }
  },
  julian: {
    mentor: "priest",
    look: { ...base, body: "male", skin: "#c68642", eyes: "#3b2a1d", hairStyle: "short", hairColor: "#2b1d14", glasses: true,
      outfit: "robe", outfitColor: "#f2ecf8", legColor: "#c9a063", bootColor: "#c9a063", cape: "#c9a063", weapon: "scepter" }
  },
  sam: {
    mentor: "mage",
    look: { ...base, body: "female", skin: "#f1c27d", eyes: "#3b2a1d", hairStyle: "bob", hairColor: "#1f1a24", glasses: true,
      outfit: "robe", outfitColor: "#5a3d91", legColor: "#2b2b33", bootColor: "#2b2b33", weapon: "staff" }
  },
  renzo: {
    mentor: "fighter",
    look: { ...base, body: "male", skin: "#c68642", eyes: "#2b1d14", hairStyle: "spiky", hairColor: "#1f1a24", headgear: "headband",
      outfit: "vest", outfitColor: "#c73e3a", legColor: "#2b2b33", legs: "pants", bootColor: "#2b2b33", gloves: "wraps", weapon: "none" }
  },

  // ---- Act VII (for the next platform) ----
  elvenMatriarch: {
    look: { ...base, body: "female", skin: "#f7d9c4", eyes: "#7a3fb0", hairStyle: "long", hairColor: "#dfe6ee", ears: "elf",
      outfit: "gown", outfitColor: "#2f6b4f", legColor: "#2f6b4f", headgear: "tiara", cape: "#e8e2d0", weapon: "staff" }
  },

  // ---- Playable NPC art starters: five regional recruits ----
  eirene: {
    look: { ...base, body: "female", robot: true, skin: "#d8ddd9", eyes: "#43e0dc", hairStyle: "none", hairColor: "#dfe6ee",
      outfit: "gown", outfitColor: "#e8e2d0", legColor: "#536b75", bootColor: "#334c57", headgear: "headband", cape: "#2a7a80", weapon: "none" }
  },
  templar: {
    look: { ...base, body: "female", skin: "#f1c27d", eyes: "#e2c66f", hairStyle: "ponytail", hairColor: "#6b432b", gloves: "leather",
      outfit: "armor", outfitColor: "#e8e2d0", legColor: "#34465c", bootColor: "#3b3f4a", headgear: "headband", cape: "#8a2c2c", shield: "tower", weapon: "lance" }
  },
  cerynVoss: {
    look: { ...base, body: "female", skin: "#e0ac69", eyes: "#7a3fb0", hairStyle: "ponytail", hairColor: "#8a3b24", gloves: "leather",
      outfit: "armor", outfitColor: "#2c4f8a", legColor: "#3b3f4a", bootColor: "#c9a063", headgear: "headband", cape: "#8a2c2c", weapon: "book" }
  },
  vaelThorn: {
    look: { ...base, body: "male", skin: "#8d5524", eyes: "#8ee0d5", hairStyle: "long", hairColor: "#1f1a24", gloves: "leather",
      outfit: "coat", outfitColor: "#3b3f4a", legColor: "#242638", bootColor: "#2b2b33", cape: "#5a3d91", weapon: "none" }
  },
  nimaFen: {
    look: { ...base, body: "female", beastkin: true, furColor: "#385b3a", earInner: "#d59a83", tailTip: "#d6a35c", muzzleColor: "#d9d0a8", noseColor: "#30252b",
      skin: "#a8b883", eyes: "#f2c45c", hairStyle: "twintails", hairColor: "#2f6b4f", gloves: "wraps",
      outfit: "vest", outfitColor: "#2f6b4f", legColor: "#8a6b3d", bootColor: "#5e3b1a", weapon: "flask" }
  },
  tidemarkTrader: {
    look: { ...base, body: "female", skin: "#f1c27d", eyes: "#38bdf8", hairStyle: "braid", hairColor: "#5e3b1a", outfit: "vest", outfitColor: "#256d85", legColor: "#8a6b3d", weapon: "flask" }
  },
  selaMoss: {
    look: { ...base, body: "female", skin: "#86a878", eyes: "#d6e88f", hairStyle: "long", hairColor: "#385b3a", outfit: "gown", outfitColor: "#486b43", legColor: "#344c35", cape: "#79905a", weapon: "staff" }
  },
  taviReed: {
    look: { ...base, body: "male", skin: "#78966d", eyes: "#e2c66e", hairStyle: "spiky", hairColor: "#294c36", outfit: "tunic", outfitColor: "#6e8c4c", legColor: "#634b2f", bootColor: "#3c3526", weapon: "none" }
  }
};

// Each class's mentor (for the Job Awakening screen)
export const MENTOR_OF = Object.fromEntries(
  Object.entries(NPC_DEFS).filter(([, d]) => d.mentor).map(([id, d]) => [d.mentor, id])
);

// The summoner depends on the player's body: male → Princess Aurelia, female → Prince Kenneth
export function summonerIdFor(avatarConfig) {
  return avatarConfig && avatarConfig.body === "female" ? "kenneth" : "aurelia";
}
