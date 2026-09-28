// ==================== MGA TITULO NG MAHARLIKA AT DUKADO NG AETHELGARD ====================
// Ang buong kontinente ng Aethelgard ay pinamumunuan ng Kataas-taasang Hari (High King Alden)
// mula sa Imperial Citadel. Sa ilalim ng kanyang kapangyarihan at utos ay ang mga dakilang
// angkan (Noble Houses), arkiduke, duke, margrabe, konde, biskonde, baron, at mga kabalyero
// na namamahala sa iba't ibang teritoryo ng kontinente.

export const NOBLE_RANKS = {
  highKing: {
    key: "highKing",
    en: "High King of Aethelgard",
    fil: "Kataas-taasang Hari ng Aethelgard",
    shortEn: "King",
    shortFil: "Hari",
    addressEn: "Your Majesty",
    addressFil: "Mahal na Hari",
    prestige: 10,
    badge: "👑"
  },
  crownPrincess: {
    key: "crownPrincess",
    en: "Crown Princess & Grand Archon",
    fil: "Prinsesa ng Korona at Dakilang Arkon",
    shortEn: "Princess",
    shortFil: "Prinsesa",
    addressEn: "Your Royal Highness",
    addressFil: "Mahal na Prinsesa",
    prestige: 9,
    badge: "✨"
  },
  crownPrince: {
    key: "crownPrince",
    en: "Crown Prince & Grand Archon",
    fil: "Prinsipe ng Korona at Dakilang Arkon",
    shortEn: "Prince",
    shortFil: "Prinsipe",
    addressEn: "Your Royal Highness",
    addressFil: "Mahal na Prinsipe",
    prestige: 9,
    badge: "✨"
  },
  archduke: {
    key: "archduke",
    en: "Archduke of the Boreal Reach",
    fil: "Arkiduke ng Hilagang Boreal",
    shortEn: "Archduke",
    shortFil: "Arkiduke",
    addressEn: "Your Imperial Grace",
    addressFil: "Kagalang-galang na Arkiduke",
    prestige: 8,
    badge: "❄️"
  },
  grandDuchess: {
    key: "grandDuchess",
    en: "Grand Duchess of the Sylvan Canopy",
    fil: "Dakilang Dukesa ng Sylvan Canopy",
    shortEn: "Grand Duchess",
    shortFil: "Dakilang Dukesa",
    addressEn: "Your Grace",
    addressFil: "Mahal na Dukesa",
    prestige: 7,
    badge: "🌿"
  },
  grandMarshal: {
    key: "grandMarshal",
    en: "Grand Marshal & High Constable",
    fil: "Dakilang Mariskal ng Hukbo",
    shortEn: "Lord Marshal",
    shortFil: "Panginoong Mariskal",
    addressEn: "Lord Marshal",
    addressFil: "Panginoong Mariskal",
    prestige: 7,
    badge: "⚔️"
  },
  duke: {
    key: "duke",
    en: "High Duke of the Coast",
    fil: "Mataas na Duke ng Baybayin",
    shortEn: "Duke",
    shortFil: "Duke",
    addressEn: "Your Grace",
    addressFil: "Kanyang Kadakilaan",
    prestige: 6,
    badge: "🌊"
  },
  cinderDuke: {
    key: "cinderDuke",
    en: "High Duke of the Cinder Bastion",
    fil: "Mataas na Duke ng Cinder Bastion",
    shortEn: "High Duke",
    shortFil: "Mataas na Duke",
    addressEn: "Your Grace",
    addressFil: "Kanyang Kadakilaan",
    prestige: 6,
    badge: "🔥"
  },
  chancellor: {
    key: "chancellor",
    en: "Grand Alchemical Chancellor",
    fil: "Dakilang Alchemical Chancellor",
    shortEn: "Lord Chancellor",
    shortFil: "Panginoong Kansilyer",
    addressEn: "Lord Chancellor",
    addressFil: "Panginoong Kansilyer",
    prestige: 6,
    badge: "🧪"
  },
  margravine: {
    key: "margravine",
    en: "Margravine of the Siren Crags",
    fil: "Margrabina ng Siren Crags",
    shortEn: "Margravine",
    shortFil: "Margrabina",
    addressEn: "My Lady Margravine",
    addressFil: "Kagalang-galang na Margrabina",
    prestige: 5,
    badge: "⚓"
  },
  marquis: {
    key: "marquis",
    en: "Marquis of the Abyssal Wardens",
    fil: "Markes ng mga Bantay ng Kalaliman",
    shortEn: "Marquis",
    shortFil: "Markes",
    addressEn: "My Lord Marquis",
    addressFil: "Mahal na Markes",
    prestige: 5,
    badge: "🛡️"
  },
  count: {
    key: "count",
    en: "Count of the Verdant Marches",
    fil: "Konde ng Luntiang Marches",
    shortEn: "Count",
    shortFil: "Konde",
    addressEn: "My Lord Count",
    addressFil: "Mahal na Konde",
    prestige: 4,
    badge: "🍃"
  },
  countess: {
    key: "countess",
    en: "Countess of the Molten Rift",
    fil: "Kondesa ng Molten Rift",
    shortEn: "Countess",
    shortFil: "Kondesa",
    addressEn: "My Lady Countess",
    addressFil: "Mahal na Kondesa",
    prestige: 4,
    badge: "🌋"
  },
  viscount: {
    key: "viscount",
    en: "Viscount of the Iron Gate",
    fil: "Biskonde ng Pintuang Bakal",
    shortEn: "Viscount",
    shortFil: "Biskonde",
    addressEn: "My Lord Viscount",
    addressFil: "Mahal na Biskonde",
    prestige: 3,
    badge: "🏰"
  },
  baron: {
    key: "baron",
    en: "Baron of the Ice Spire",
    fil: "Baron ng Toreng Yelo",
    shortEn: "Baron",
    shortFil: "Baron",
    addressEn: "My Lord Baron",
    addressFil: "Mahal na Baron",
    prestige: 2,
    badge: "🏔️"
  },
  knightBanneret: {
    key: "knightBanneret",
    en: "Knight Banneret of the Royal Guard",
    fil: "Kabalyero Banneret ng Tanod-Hari",
    shortEn: "Sir Knight",
    shortFil: "Ginoong Kabalyero",
    addressEn: "Sir Knight",
    addressFil: "Ginoong Kabalyero",
    prestige: 2,
    badge: "🛡️"
  }
};

export const NOBLE_HOUSES = {
  houseAethelgard: {
    id: "houseAethelgard",
    name: { en: "House Aethelgard", fil: "Angkang Aethelgard" },
    seat: { en: "Imperial Citadel (Central Heartland)", fil: "Imperial Citadel (Pusod ng Kontinente)" },
    sigil: { en: "Crowned Golden Griffin on Crimson", fil: "Ginintuang Griffin na may Korona sa Pula" },
    motto: { en: "By Sovereign Light We Prevail", fil: "Sa Liwanag ng Hari Kami Magwawagi" },
    overlord: "King Alden of Aethelgard"
  },
  houseGoldspire: {
    id: "houseGoldspire",
    name: { en: "House Goldspire", fil: "Angkang Goldspire" },
    seat: { en: "Citadel High Treasury & Bastion", fil: "Moog at Kabang-Yaman ng Citadel" },
    sigil: { en: "Twin Golden Scepters over Ashlar Stone", fil: "Kambal na Setrong Ginto sa Ibabaw ng Bato" },
    motto: { en: "Wealth and Steel Unshaken", fil: "Kayamanan at Bakal na Walang Patid" },
    overlord: "King Alden of Aethelgard"
  },
  houseFrostgale: {
    id: "houseFrostgale",
    name: { en: "House Frostgale", fil: "Angkang Frostgale" },
    seat: { en: "Boreal Hold (Frostfang Mountains)", fil: "Moog ng Boreal (Bundok ng Frostfang)" },
    sigil: { en: "Silver Blizzard Wolf on Azure", fil: "Pilak na Lobong Niyebe sa Bughaw" },
    motto: { en: "Unbroken as Glacial Iron", fil: "Matatag na Parang Bakal ng Yelo" },
    overlord: "King Alden of Aethelgard"
  },
  houseSylvancrest: {
    id: "houseSylvancrest",
    name: { en: "House Sylvancrest", fil: "Angkang Sylvancrest" },
    seat: { en: "Sylvan Sanctum (Whispering Canopy)", fil: "Sylvan Sanctum (Whispering Canopy)" },
    sigil: { en: "Emerald Ironwood Blossom with Crescent Moon", fil: "Luntiang Bulaklak ng Ironwood at Gasang Buwan" },
    motto: { en: "The Forest Never Sleeps", fil: "Hindi Natutulog ang Gubat" },
    overlord: "King Alden of Aethelgard"
  },
  houseStormhaven: {
    id: "houseStormhaven",
    name: { en: "House Stormhaven", fil: "Angkang Stormhaven" },
    seat: { en: "Siren Bastion (Cerulean Coast)", fil: "Bantayan ng Siren (Baybaying Cerulean)" },
    sigil: { en: "Golden Trident over Sapphire Waves", fil: "Gintong Setrong Salapang sa Maalong Dagat" },
    motto: { en: "Rulers of the High Tides", fil: "Panginoon ng Nagngangalit na Alon" },
    overlord: "King Alden of Aethelgard"
  },
  houseAshforged: {
    id: "houseAshforged",
    name: { en: "House Ashforged", fil: "Angkang Ashforged" },
    seat: { en: "Cinder Keep (Ashfall Basin)", fil: "Moog ng Abo (Lunas ng Ashfall)" },
    sigil: { en: "Flaming Anvil on Obsidian Field", fil: "Liyab na Pandayan sa Itim na Bato" },
    motto: { en: "Forged in Fire, Bound in Loyalty", fil: "Pinanday sa Apoy, Nakatali sa Katapatan" },
    overlord: "King Alden of Aethelgard"
  },
  houseDarkbane: {
    id: "houseDarkbane",
    name: { en: "House Darkbane", fil: "Angkang Darkbane" },
    seat: { en: "Obsidian Gatehouse (Underground & Breach Front)", fil: "Pintuang Obsidian (Bantay sa Ilalim ng Lupa)" },
    sigil: { en: "Radiant Sun piercing Black Void", fil: "Sumisikat na Araw sa Dilim ng Impiyerno" },
    motto: { en: "Till the Abyss is Sealed", fil: "Hanggang Muling Maselyuhan ang Impiyerno" },
    overlord: "King Alden of Aethelgard"
  }
};

export const NOBLE_NPCS = {
  // Central Heartland (Citadel & Barracks)
  king: {
    rankKey: "highKing",
    houseKey: "houseAethelgard",
    name: { en: "King Alden of Aethelgard", fil: "Haring Alden ng Aethelgard" },
    title: { en: "High Sovereign of the Continent of Aethelgard", fil: "Kataas-taasang Pinuno ng Kontinente ng Aethelgard" },
    territory: "hub",
    isNoble: true
  },
  aurelia: {
    rankKey: "crownPrincess",
    houseKey: "houseAethelgard",
    name: { en: "Princess Aurelia of Aethelgard", fil: "Prinsesa Aurelia ng Aethelgard" },
    title: { en: "Crown Princess & Supreme Commander of Magic", fil: "Prinsesa ng Korona at Pinuno ng Magic Corps" },
    territory: "hub",
    isNoble: true
  },
  kenneth: {
    rankKey: "crownPrince",
    houseKey: "houseAethelgard",
    name: { en: "Prince Kenneth of Aethelgard", fil: "Prinsipe Kenneth ng Aethelgard" },
    title: { en: "Crown Prince & Supreme Commander of Arcana", fil: "Prinsipe ng Korona at Pinuno ng Arcane Corps" },
    territory: "hub",
    isNoble: true
  },
  dukeValerius: {
    rankKey: "duke",
    houseKey: "houseGoldspire",
    name: { en: "Duke Valerius Goldspire", fil: "Duke Valerius Goldspire" },
    title: { en: "Lord High Chancellor of the Imperial Treasury", fil: "Mataas na Kansilyer ng Kabang-Yaman ng Imperyo" },
    territory: "hub",
    isNoble: true,
    look: {
      body: "male", skin: "#f1c27d", hairStyle: "short", hairColor: "#ece0b8", beard: true,
      outfit: "coat", outfitColor: "#c9a063", legColor: "#2b2b33", bootColor: "#3a2616", headgear: "coronet", cape: "#8a2c2c", weapon: "scepter",
      gloves: "leather", eyes: "#2f6db5"
    }
  },
  ronald: {
    rankKey: "grandMarshal",
    houseKey: "houseAethelgard",
    name: { en: "Lord Marshal Ronald Vance", fil: "Panginoong Mariskal Ronald Vance" },
    title: { en: "Grand Marshal of the Slaying Corps Auxiliaries", fil: "Dakilang Mariskal ng Sandatahang Lakas" },
    territory: "hub",
    isNoble: true
  },
  edgar: {
    rankKey: "chancellor",
    houseKey: "houseAethelgard",
    name: { en: "Lord Edgar Thorne", fil: "Panginoong Edgar Thorne" },
    title: { en: "Grand Alchemical Chancellor of Aethelgard", fil: "Dakilang Alchemical Chancellor ng Aethelgard" },
    territory: "hub",
    isNoble: true
  },

  // Whispering Canopy (Act VII)
  elvenMatriarch: {
    rankKey: "grandDuchess",
    houseKey: "houseSylvancrest",
    name: { en: "Grand Duchess Maeve Sylvancrest", fil: "Dakilang Dukesa Maeve Sylvancrest" },
    title: { en: "High Sovereign of the Whispering Canopy", fil: "Mataas na Pinuno ng Whispering Canopy" },
    territory: "canopy",
    isNoble: true
  },
  countCedric: {
    rankKey: "count",
    houseKey: "houseSylvancrest",
    name: { en: "Count Cedric Greenbriar", fil: "Konde Cedric Greenbriar" },
    title: { en: "Warden of the Verdant Marches", fil: "Bantay ng Luntiang Marches" },
    territory: "canopy",
    isNoble: true,
    look: {
      body: "male", skin: "#f7d9c4", hairStyle: "short", hairColor: "#dfe6ee", ears: "elf",
      outfit: "vest", outfitColor: "#2f6b4f", legColor: "#3b3f4a", bootColor: "#5e3b1a", headgear: "headband", cape: "#2f6b3f", weapon: "bow",
      gloves: "leather", eyes: "#3a8a4a"
    }
  },

  // Cerulean Abyss / Coast (Act VIII)
  dukeRoderick: {
    rankKey: "duke",
    houseKey: "houseStormhaven",
    name: { en: "Duke Roderick Stormhaven", fil: "Duke Roderick Stormhaven" },
    title: { en: "Lord High Admiral of the Cerulean Coast", fil: "Mataas na Almirante ng Baybaying Cerulean" },
    territory: "coast",
    isNoble: true,
    look: {
      body: "male", skin: "#e0ac69", hairStyle: "short", hairColor: "#4a2f1b", beard: true,
      outfit: "armor", outfitColor: "#2c4f8a", legColor: "#7d8c9e", bootColor: "#2b2b33", headgear: "coronet", cape: "#38bdf8", weapon: "sword",
      gloves: "leather", eyes: "#2f6db5"
    }
  },
  margravineGenevieve: {
    rankKey: "margravine",
    houseKey: "houseStormhaven",
    name: { en: "Margravine Genevieve Stormwatch", fil: "Margrabina Genevieve Stormwatch" },
    title: { en: "Keeper of the Siren Crags & Sea Fortresses", fil: "Bantay ng Siren Crags at mga Moog sa Dagat" },
    territory: "coast",
    isNoble: true,
    look: {
      body: "female", skin: "#f7d9c4", hairStyle: "long", hairColor: "#ece0b8",
      outfit: "gown", outfitColor: "#38bdf8", legColor: "#2c4f8a", bootColor: "#2b2b33", headgear: "tiara", cape: "#2c4f8a", weapon: "staff",
      gloves: "none", eyes: "#38bdf8"
    }
  },

  // Frostfang Mountains (Act IX)
  archdukeNicholas: {
    rankKey: "archduke",
    houseKey: "houseFrostgale",
    name: { en: "Archduke Nicholas Frostgale", fil: "Arkiduke Nicholas Frostgale" },
    title: { en: "High Warden of the Northern Boreal Ridge", fil: "Mataas na Bantay ng Hilagang Boreal" },
    territory: "frost",
    isNoble: true,
    look: {
      body: "male", skin: "#f1c27d", hairStyle: "short", hairColor: "#dfe6ee", beard: true,
      outfit: "armor", outfitColor: "#64748b", legColor: "#334155", bootColor: "#1e293b", headgear: "coronet", cape: "#bfe9ff", weapon: "lance",
      gloves: "leather", eyes: "#38bdf8"
    }
  },
  baronGregory: {
    rankKey: "baron",
    houseKey: "houseFrostgale",
    name: { en: "Baron Gregory Winterguard", fil: "Baron Gregory Winterguard" },
    title: { en: "Commander of the Ice Spire Watch", fil: "Kumander ng Bantay sa Toreng Yelo" },
    territory: "frost",
    isNoble: true,
    look: {
      body: "male", skin: "#e0ac69", hairStyle: "buzz", hairColor: "#94a3b8",
      outfit: "coat", outfitColor: "#475569", legColor: "#1e293b", bootColor: "#0f172a", headgear: "helmet", cape: "#94a3b8", weapon: "sword",
      gloves: "leather", eyes: "#334155"
    }
  },

  // Ashfall Caldera (Act X)
  dukeIgnis: {
    rankKey: "cinderDuke",
    houseKey: "houseAshforged",
    name: { en: "High Duke Ignis Ashforged", fil: "Mataas na Duke Ignis Ashforged" },
    title: { en: "Lord Master of the Magma Foundries", fil: "Panginoong Panday ng mga Bulkan sa Timog" },
    territory: "ash",
    isNoble: true,
    look: {
      body: "male", skin: "#c68642", hairStyle: "spiky", hairColor: "#7a2b1d", beard: true,
      outfit: "armor", outfitColor: "#8a2c2c", legColor: "#3a1d1d", bootColor: "#1e1e1e", headgear: "coronet", cape: "#ff7a1a", weapon: "sword",
      gloves: "wraps", eyes: "#ff7a1a"
    }
  },
  countessBeatrix: {
    rankKey: "countess",
    houseKey: "houseAshforged",
    name: { en: "Countess Beatrix Lavacrest", fil: "Kondesa Beatrix Lavacrest" },
    title: { en: "Governor of the Cinder March", fil: "Gobernadora ng Lupaing Abo" },
    territory: "ash",
    isNoble: true,
    look: {
      body: "female", skin: "#f1c27d", hairStyle: "bob", hairColor: "#4a1d1d",
      outfit: "gown", outfitColor: "#ff7a1a", legColor: "#5a2020", bootColor: "#2b1d14", headgear: "tiara", cape: "#8a2c2c", weapon: "staff",
      gloves: "leather", eyes: "#ff7a1a"
    }
  },

  // Siege / Maw Front (Acts XI–XII)
  marquisZachary: {
    rankKey: "marquis",
    houseKey: "houseDarkbane",
    name: { en: "Marquis Zachary Darkbane", fil: "Markes Zachary Darkbane" },
    title: { en: "Lord Inquisitor of the Abyssal Breach", fil: "Panginoong Tagasiyasat ng Butas sa Impiyerno" },
    territory: "siege",
    isNoble: true,
    look: {
      body: "male", skin: "#c68642", hairStyle: "short", hairColor: "#1f1a24",
      outfit: "armor", outfitColor: "#3b3f4a", legColor: "#1e293b", bootColor: "#0f172a", headgear: "helmet", cape: "#9d4edd", weapon: "lance",
      gloves: "leather", eyes: "#9d4edd"
    }
  },
  viscountDamian: {
    rankKey: "viscount",
    houseKey: "houseDarkbane",
    name: { en: "Viscount Damian Shadowward", fil: "Biskonde Damian Shadowward" },
    title: { en: "Captain of the Void Barrier Gate", fil: "Kapitan ng Pintuang Harang ng Dilim" },
    territory: "siege",
    isNoble: true,
    look: {
      body: "male", skin: "#e0ac69", hairStyle: "short", hairColor: "#2b1d14",
      outfit: "coat", outfitColor: "#5a3d91", legColor: "#2b2b33", bootColor: "#1f1a24", headgear: "headband", cape: "#8a2c2c", weapon: "flask",
      gloves: "leather", eyes: "#f1c27d"
    }
  }
};

/**
 * Nagbibigay ng kumpletong titulong pinarangalan batay sa wika
 */
export function getFullNobleTitle(npcId, lang = "en") {
  const n = NOBLE_NPCS[npcId];
  if (!n) return null;
  const l = lang === "fil" ? "fil" : "en";
  const rank = NOBLE_RANKS[n.rankKey];
  const house = NOBLE_HOUSES[n.houseKey];
  const rankStr = rank ? (rank[l] || rank.en) : "";
  const houseStr = house ? (house.name[l] || house.name.en) : "";
  const nameStr = n.name[l] || n.name.en;
  return `${rank ? rank.badge + " " : ""}${nameStr} (${rankStr} — ${houseStr})`;
}

/**
 * Lumilikha ng bagong custom na Maharlikang NPC para sa anumang lugar sa kontinente
 */
export function createCustomNoble(config) {
  const {
    id,
    rankKey = "baron",
    houseKey = "houseAethelgard",
    name = { en: "Lord Noble", fil: "Panginoong Maharlika" },
    title = { en: "Lord of the Realm", fil: "Panginoon ng Lupain" },
    territory = "hub",
    look = {}
  } = config;

  return {
    id,
    rankKey,
    houseKey,
    name,
    title,
    territory,
    isNoble: true,
    look: {
      body: "male",
      skin: "#f1c27d",
      hairStyle: "short",
      hairColor: "#2b1d14",
      outfit: "coat",
      outfitColor: "#2c4f8a",
      legColor: "#7d8c9e",
      bootColor: "#2b2b33",
      headgear: "coronet",
      cape: "#8a2c2c",
      weapon: "sword",
      gloves: "leather",
      eyes: "#2f6db5",
      ...look
    }
  };
}
