// ==================== MGA TAUHAN NG LORE (LORE.md) ====================
// Bawat NPC ay ginuguhit gamit ang modular Avatar. Ang pangalan at dialogue ay nasa
// js/dialogue.js (English at Filipino). `mentor` = class na itinuturo sa Job Awakening.

const base = { gloves: "none", legs: "pants", boots: "boots", eyes: "#4a3222" };

export const NPC_DEFS = {
  // ---- Maharlikang pamilya ----
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

  // ---- Ang limang Earthbound soul: mga mentor ng class ----
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

  // ---- Act VII (para sa susunod na platform) ----
  elvenMatriarch: {
    look: { ...base, body: "female", skin: "#f7d9c4", eyes: "#7a3fb0", hairStyle: "long", hairColor: "#dfe6ee", ears: "elf",
      outfit: "gown", outfitColor: "#2f6b4f", legColor: "#2f6b4f", headgear: "tiara", cape: "#e8e2d0", weapon: "staff" }
  }
};

// Ang mentor bawat class (para sa Job Awakening screen)
export const MENTOR_OF = Object.fromEntries(
  Object.entries(NPC_DEFS).filter(([, d]) => d.mentor).map(([id, d]) => [d.mentor, id])
);

// Ang tagapagtawag ay batay sa katawan ng player: lalaki → Prinsesa Aurelia, babae → Prinsipe Kenneth
export function summonerIdFor(avatarConfig) {
  return avatarConfig && avatarConfig.body === "female" ? "kenneth" : "aurelia";
}
