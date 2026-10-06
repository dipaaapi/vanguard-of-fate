import { PLATFORMS, PLATFORM_ORDER } from "./platforms.js";
import { FRONTIERS, FRONTIER_ORDER } from "./frontiers.js";

// ==================== AREAS: every map of Book I in one table ====================
// hub (the plains of Aethelgard), the nine campaign platforms (Acts VII–XV) and the four frontier maps.
// Each has: name, monsters (5 regular kinds), elites (4 elite-only kinds), sites (places to scout),
// a level band and the Acts whose side quests can send the hero there (js/sidequest.js).

// The plains of Aethelgard (Acts II–VI)
export const HUB_KINDS = ["slime", "wolf", "goblinScout", "forestBear", "windFalcon"];
export const HUB_ELITES = ["goblinWarchief", "ironpeltAlpha", "thunderRoc", "bramblecrownSlime"];
export const HUB_AREA = {
  id: "hub", color: "#ffd166", levels: [1, 8],
  name: { en: "Plains of Aethelgard", fil: "Kaparangan ng Aethelgard" },
  monsters: HUB_KINDS, elites: HUB_ELITES,
  sites: [
    { x: 260, y: 220, name: { en: "Old Watchtower", fil: "Lumang Bantayan" } },
    { x: 1040, y: 760, name: { en: "Shepherd's Spring", fil: "Bukal ng Pastol" } },
    { x: 400, y: 760, name: { en: "Fallen Waystone", fil: "Gumuhong Batong-Gabay" } }
  ],
  // the Wayfarer's Gate to the Greyhorn Badlands (js/world/portal.js)
  trail: { x: 220, y: 914, dest: "rocky" }
};

export const BOOK_ONE_AREAS = ["hub", ...PLATFORM_ORDER, ...FRONTIER_ORDER];

// The definition of any map (null for an unknown id)
export function areaDef(id) {
  if (id === "hub") return HUB_AREA;
  return PLATFORMS[id] || FRONTIERS[id] || null;
}

export const isFrontier = (id) => Boolean(FRONTIERS[id]);

export function areaName(id, L = "en") {
  const d = areaDef(id);
  return d ? d.name[L] || d.name.en : id;
}

// Level band [min, max] of normal monsters (the platform boss is max + 2). Same rule as EnemyManager.setArea.
export function areaLevels(id) {
  const d = areaDef(id);
  if (!d) return [1, 8];
  if (d.levels) return d.levels;
  const floor = d.tier >= 2 ? d.tier * 5 : 1;
  return [floor, floor + 7];
}

// Which maps an Act's side quests use: the Act's own map plus the frontier beside it
export function actAreas(act) {
  const out = [];
  if (act >= 2 && act <= 6) out.push("hub");
  PLATFORM_ORDER.forEach((id) => { if (PLATFORMS[id].act === act) out.push(id); });
  FRONTIER_ORDER.forEach((id) => { if (FRONTIERS[id].acts.includes(act)) out.push(id); });
  return out;
}
