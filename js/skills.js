import { getLang } from "./i18n.js";
import { PATH_TREES, PATH_TREE_IDS, RESONANCE, styleOf } from "./skillpaths.js";

// ==================== STAT BUILDER + SKILL TREE (Ragnarok Online style, with an isekai twist) ====================
// STATS: STR AGI VIT INT DEX LUK — start at 1. Raising one costs more as it grows
// (Ragnarok): from x → x+1 costs floor((x − 1) / 10) + 2 stat points.
// Primary stat per class (extra ATK): Novice/Knight/Fighter = STR, Archer = DEX, Mage/Priest = INT.
//
// SKILL TREE: the Novice and every job have their own tree, and every hero can also learn the
// Might / Finesse / Arcana paths (js/skillpaths.js). One skill point per level.
// Novice skills stay after the Job Awakening (as in Ragnarok).
// Each skill has a max level, a required skill (req) and an effect per level:
//   dmg (+% damage) · kcd (−% K cooldown) · atk · def · hpPct · dmgReduce (%) · crit (%) · move (%)
//   cdr (%) · aspd (%) · stamina · regen (HP every 3s) · exp (%) · heal (% heal power) · lcd (−% L cooldown)
//   str/agi/vit/int/dex/luk (extra stat)

export const STATS = ["str", "agi", "vit", "int", "dex", "luk"];
export const PRIMARY = { novice: "str", knight: "str", fighter: "str", archer: "dex", mage: "int", priest: "int" };

const N = (en, fil) => ({ en, fil: fil || en });

export const STAT_INFO = {
  str: N("Strength — physical ATK for Novice, Knight and Fighter.", "Lakas — pisikal na ATK ng Novice, Knight at Fighter."),
  agi: N("Agility — attack speed, move speed and stamina.", "Liksi — bilis ng atake, bilis ng lakad at stamina."),
  vit: N("Vitality — max HP, DEF and stamina.", "Sigla — max HP, DEF at stamina."),
  int: N("Intelligence — spell ATK for Mage and Priest, cooldown reduction.", "Talino — ATK ng spell ng Mage at Priest, bawas sa cooldown."),
  dex: N("Dexterity — ranged ATK for Archer, attack speed and crit.", "Galing — ATK ng Archer, bilis ng atake at crit."),
  luk: N("Luck — critical chance and critical damage. Fortune favors the summoned.", "Suwerte — tsansa at lakas ng critical hit. Pinapaboran ng tadhana ang tinawag.")
};

// Cost of raising a stat from its current value
export const statCost = (v) => Math.floor((v - 1) / 10) + 2;
export const STAT_MAX = 99;

// row/col = position in the tree (grid)
export const TREES = {
  novice: [
    { id: "adapt", icon: "🌐", max: 5, row: 0, col: 1, name: N("Isekai Adaptation", "Pag-angkop sa Ibang Mundo"),
      desc: N("Your body attunes to Aethelgard: +10 max stamina and +2% EXP per level.", "Nasasanay ang katawan sa Aethelgard: +10 max stamina at +2% EXP bawat level."),
      fx: (l) => ({ stamina: 10 * l, exp: 2 * l }) },
    { id: "jab", icon: "🗡️", max: 5, row: 1, col: 0, req: { adapt: 1 }, name: N("Dagger Jab", "Saksak ng Punyal"),
      desc: N("J: +6% damage per level.", "J: +6% pinsala bawat level."), fx: (l) => ({ dmg: 6 * l }) },
    { id: "roll", icon: "🌀", max: 5, row: 1, col: 2, req: { adapt: 1 }, name: N("Dodge Roll", "Dodge Roll"),
      desc: N("K: −6% skill cooldown per level.", "K: −6% cooldown ng skill bawat level."), fx: (l) => ({ kcd: 6 * l }) },
    { id: "firstaid", icon: "🩹", max: 3, row: 2, col: 1, req: { adapt: 3 }, name: N("First Aid", "First Aid"),
      desc: N("Regenerate 1 HP every 3s per level.", "Nagbabalik ng 1 HP bawat 3s bawat level."), fx: (l) => ({ regen: l }) },
    { id: "grit", icon: "🧱", max: 5, row: 3, col: 0, req: { firstaid: 1 }, name: N("Earthly Grit", "Tibay mula sa Daigdig"),
      desc: N("Memories of a hard life on Earth: +3% max HP per level.", "Alaala ng mahirap na buhay sa Daigdig: +3% max HP bawat level."), fx: (l) => ({ hpPct: 3 * l }) },
    { id: "truck", icon: "🍀", max: 1, row: 3, col: 2, req: { grit: 3, jab: 3 }, name: N("Second-Life Luck", "Suwerte ng Ikalawang Buhay"),
      desc: N("The luck that carried you across the veil still follows you: +5% crit and +5% move speed.", "Ang suwerteng nagdala sa iyo patawid sa tabing ay sumusunod pa rin sa iyo: +5% crit at +5% bilis."),
      fx: (l) => ({ crit: 5 * l, move: 5 * l }) },
    { id: "stone", icon: "🪨", max: 5, row: 4, col: 1, req: { jab: 1 }, name: N("Throw Stone", "Paghagis ng Bato"),
      desc: N("L: −8% cooldown per level.", "L: −8% cooldown bawat level."), fx: (l) => ({ lcd: 8 * l }) },
    { id: "petpal", icon: "🟢", max: 5, row: 4, col: 2, req: { adapt: 2 }, kind: "summon", fx: () => ({}), familiar: "slime", name: N("Pocket Slime", "Alagang Slime"),
      desc: N("Summon: a pet slime follows you and bites nearby foes; stronger per level. For heroes with no summon of their own (Novice, Knight, Mage, Fighter).", "Summon: may alagang slime na sumusunod at kumakagat sa kalapit na kalaban; lumalakas bawat level. Para sa walang sariling summon (Novice, Knight, Mage, Fighter).") }
  ],
  knight: [
    { id: "bastion", icon: "🛡️", max: 10, row: 0, col: 0, name: N("Bastion Forcefield", "Bastion Forcefield"),
      desc: N("J: +4% damage per level.", "J: +4% pinsala bawat level."), fx: (l) => ({ dmg: 4 * l }) },
    { id: "lancecharge", icon: "⚡", max: 10, row: 0, col: 2, name: N("Piercing Lance Charge", "Piercing Lance Charge"),
      desc: N("K: −4% cooldown per level.", "K: −4% cooldown bawat level."), fx: (l) => ({ kcd: 4 * l }) },
    { id: "spear", icon: "🔱", max: 10, row: 1, col: 0, req: { bastion: 1 }, name: N("Spear Mastery", "Spear Mastery"),
      desc: N("+2 ATK per level.", "+2 ATK bawat level."), fx: (l) => ({ atk: 2 * l }) },
    { id: "faith", icon: "⛪", max: 10, row: 1, col: 2, name: N("Faith of Steel", "Pananampalatayang Bakal"),
      desc: N("+2 DEF and +1% max HP per level.", "+2 DEF at +1% max HP bawat level."), fx: (l) => ({ def: 2 * l, hpPct: l }) },
    { id: "engineer", icon: "🏗️", max: 5, row: 2, col: 2, req: { faith: 5 }, name: N("Engineer's Resolve", "Tibay ng Inhinyero"),
      desc: N("Art's site-engineer instincts: −2% damage taken per level.", "Likas na galing ni Art bilang inhinyero: −2% pinsalang natatanggap bawat level."), fx: (l) => ({ dmgReduce: 2 * l }) },
    { id: "demolition", icon: "💥", max: 5, row: 2, col: 0, req: { spear: 5, lancecharge: 5 }, name: N("Demolition Expert", "Dalubhasa sa Demolisyon"),
      desc: N("+3% crit per level.", "+3% crit bawat level."), fx: (l) => ({ crit: 3 * l }) },
    { id: "brandish", icon: "🌙", max: 10, row: 3, col: 1, req: { bastion: 3, lancecharge: 3 }, name: N("Crescent Sweep", "Hagupit ng Gasuklay"),
      desc: N("L: −4% cooldown per level.", "L: −4% cooldown bawat level."), fx: (l) => ({ lcd: 4 * l }) },
    { id: "hound", icon: "🐺", max: 10, row: 4, col: 1, req: { faith: 3 }, kind: "summon", fx: () => ({}), familiar: "hound", name: N("War Hound", "Asong Pandigma"),
      desc: N("Summon: an armoured hound fights beside you; every fourth bite stuns. Replaces the Pocket Slime.", "Summon: asong may baluti na lumalaban sa tabi mo; nakakatulala ang bawat ikaapat na kagat. Papalit sa Alagang Slime.") }
  ],
  archer: [
    { id: "quiver", icon: "🏹", max: 10, row: 0, col: 0, name: N("Quiver Shot", "Quiver Shot"),
      desc: N("J: +4% damage per level.", "J: +4% pinsala bawat level."), fx: (l) => ({ dmg: 4 * l }) },
    { id: "falcon", icon: "🦅", max: 10, row: 0, col: 2, name: N("Falcon Dive", "Falcon Dive"),
      desc: N("K: −4% cooldown per level.", "K: −4% cooldown bawat level."), fx: (l) => ({ kcd: 4 * l }) },
    { id: "owl", icon: "🦉", max: 10, row: 1, col: 0, req: { quiver: 1 }, name: N("Steady Aim", "Matatag na Asinta"),
      desc: N("+1 DEX per level.", "+1 DEX bawat level."), fx: (l) => ({ dex: l }) },
    { id: "vulture", icon: "👁️", max: 10, row: 1, col: 2, name: N("Falconer's Sight", "Paningin ng Falconer"),
      desc: N("+1% crit and +1% damage per level.", "+1% crit at +1% pinsala bawat level."), fx: (l) => ({ crit: l, dmg: l }) },
    { id: "biologist", icon: "🌿", max: 5, row: 2, col: 0, req: { owl: 5 }, name: N("Biologist's Instinct", "Kutob ng Biyologo"),
      desc: N("Lyra's field-research legs: +3% move speed per level.", "Mga paang sanay sa field research ni Lyra: +3% bilis bawat level."), fx: (l) => ({ move: 3 * l }) },
    { id: "olympian", icon: "🥇", max: 5, row: 2, col: 2, req: { vulture: 5, falcon: 5 }, name: N("Olympic Form", "Anyong Olympian"),
      desc: N("+3% attack speed per level.", "+3% bilis ng atake bawat level."), fx: (l) => ({ aspd: 3 * l }) },
    { id: "shower", icon: "🌧️", max: 10, row: 3, col: 1, req: { quiver: 3, falcon: 3 }, name: N("Skyfall Volley", "Palasong Mula sa Langit"),
      desc: N("L: −4% cooldown per level.", "L: −4% cooldown bawat level."), fx: (l) => ({ lcd: 4 * l }) }
  ],
  priest: [
    { id: "heal", icon: "✚", max: 10, row: 0, col: 0, name: N("Priority Heal", "Priority Heal"),
      desc: N("J: +6% heal power per level.", "J: +6% lakas ng heal bawat level."), fx: (l) => ({ heal: 6 * l }) },
    { id: "angels", icon: "👼", max: 10, row: 0, col: 2, name: N("Guardian Angels", "Guardian Angels"),
      desc: N("K: −4% cooldown per level.", "K: −4% cooldown bawat level."), fx: (l) => ({ kcd: 4 * l }) },
    { id: "protection", icon: "🕊️", max: 10, row: 1, col: 0, name: N("Divine Protection", "Banal na Proteksyon"),
      desc: N("+2 DEF and −1% damage taken per level.", "+2 DEF at −1% pinsalang natatanggap bawat level."), fx: (l) => ({ def: 2 * l, dmgReduce: l }) },
    { id: "blessing", icon: "🙏", max: 10, row: 1, col: 2, name: N("Blessing", "Basbas"),
      desc: N("+1 INT and +1 VIT per level.", "+1 INT at +1 VIT bawat level."), fx: (l) => ({ int: l, vit: l }) },
    { id: "triage", icon: "🩺", max: 5, row: 2, col: 0, req: { heal: 5 }, name: N("Triage Protocol", "Protocol ng Triage"),
      desc: N("Dr. Julian's ER discipline: +3% cooldown reduction per level.", "Disiplina ni Dr. Julian sa ER: +3% bawas sa cooldown bawat level."), fx: (l) => ({ cdr: 3 * l }) },
    { id: "shift", icon: "⏱️", max: 5, row: 2, col: 2, req: { blessing: 5, angels: 5 }, name: N("Thirty-Six Hour Shift", "Tatlumpu't Anim na Oras na Duty"),
      desc: N("+1 HP regen and +10 stamina per level.", "+1 HP regen at +10 stamina bawat level."), fx: (l) => ({ regen: l, stamina: 10 * l }) },
    { id: "holylight", icon: "🌟", max: 10, row: 3, col: 1, req: { heal: 3, angels: 3 }, name: N("Holy Light", "Banal na Liwanag"),
      desc: N("L: −4% cooldown per level.", "L: −4% cooldown bawat level."), fx: (l) => ({ lcd: 4 * l }) }
  ],
  mage: [
    { id: "meteor", icon: "☄️", max: 10, row: 0, col: 0, name: N("Meteor Fall", "Meteor Fall"),
      desc: N("J: +4% damage per level.", "J: +4% pinsala bawat level."), fx: (l) => ({ dmg: 4 * l }) },
    { id: "storm", icon: "🌩️", max: 10, row: 0, col: 2, name: N("Thunderstorm", "Thunderstorm"),
      desc: N("K: −4% cooldown per level.", "K: −4% cooldown bawat level."), fx: (l) => ({ kcd: 4 * l }) },
    { id: "orbital", icon: "🛰️", max: 10, row: 1, col: 0, req: { meteor: 1 }, name: N("Orbital Calculus", "Orbital Calculus"),
      desc: N("Sam's astrophysics: +1 INT per level.", "Astrophysics ni Sam: +1 INT bawat level."), fx: (l) => ({ int: l }) },
    { id: "energycoat", icon: "🔮", max: 10, row: 1, col: 2, name: N("Mana Veil", "Tabing ng Mana"),
      desc: N("−1.5% damage taken per level.", "−1.5% pinsalang natatanggap bawat level."), fx: (l) => ({ dmgReduce: 1.5 * l }) },
    { id: "telemetry", icon: "📡", max: 5, row: 2, col: 0, req: { orbital: 5 }, name: N("Telemetry Lock", "Telemetry Lock"),
      desc: N("+3% crit per level.", "+3% crit bawat level."), fx: (l) => ({ crit: 3 * l }) },
    { id: "gamma", icon: "✴️", max: 5, row: 2, col: 2, req: { meteor: 5, storm: 5 }, name: N("Gamma Burst", "Gamma Burst"),
      desc: N("The anomaly that took you from Earth: +4% damage per level.", "Ang anomalyang kumuha sa iyo mula sa Daigdig: +4% pinsala bawat level."), fx: (l) => ({ dmg: 4 * l }) },
    { id: "frostdiver", icon: "🧊", max: 10, row: 3, col: 1, req: { meteor: 3, storm: 3 }, name: N("Glacial Lance", "Sibat ng Yelo"),
      desc: N("L: −4% cooldown per level.", "L: −4% cooldown bawat level."), fx: (l) => ({ lcd: 4 * l }) },
    { id: "starowl", icon: "🦉", max: 10, row: 4, col: 1, req: { energycoat: 3 }, kind: "summon", fx: () => ({}), familiar: "owl", name: N("Arcane Owl", "Kuwagong Arkano"),
      desc: N("Summon: a star owl circles you and fires arcane bolts at foes in range. Replaces the Pocket Slime.", "Summon: kuwagong bituin na umiikot sa iyo at bumabaril ng kidlat na arkano. Papalit sa Alagang Slime.") }
  ],
  fighter: [
    { id: "sphere", icon: "🔵", max: 10, row: 0, col: 0, name: N("Force Sphere", "Force Sphere"),
      desc: N("J: +4% damage per level.", "J: +4% pinsala bawat level."), fx: (l) => ({ dmg: 4 * l }) },
    { id: "dropkick", icon: "🦶", max: 10, row: 0, col: 2, name: N("Flying Dropkick", "Flying Dropkick"),
      desc: N("K: −4% cooldown per level.", "K: −4% cooldown bawat level."), fx: (l) => ({ kcd: 4 * l }) },
    { id: "ironfist", icon: "👊", max: 10, row: 1, col: 0, name: N("Iron Fist", "Kamaong Bakal"),
      desc: N("+2 ATK per level.", "+2 ATK bawat level."), fx: (l) => ({ atk: 2 * l }) },
    { id: "kibody", icon: "🧘", max: 10, row: 1, col: 2, name: N("Ki Body", "Katawang Ki"),
      desc: N("+1 VIT and +1 DEF per level.", "+1 VIT at +1 DEF bawat level."), fx: (l) => ({ vit: l, def: l }) },
    { id: "street", icon: "🏙️", max: 5, row: 2, col: 2, req: { kibody: 5 }, name: N("Street Instinct", "Kutob ng Lansangan"),
      desc: N("Renzo's alley reflexes: +3% move speed and +1% crit per level.", "Reflex ni Renzo sa eskinita: +3% bilis at +1% crit bawat level."), fx: (l) => ({ move: 3 * l, crit: l }) },
    { id: "champion", icon: "🏆", max: 5, row: 2, col: 0, req: { ironfist: 5, dropkick: 5 }, name: N("Undefeated Champion", "Kampeong Walang Talo"),
      desc: N("+3% attack speed and +2% crit per level.", "+3% bilis ng atake at +2% crit bawat level."), fx: (l) => ({ aspd: 3 * l, crit: 2 * l }) },
    { id: "kiexplosion", icon: "💢", max: 10, row: 3, col: 1, req: { sphere: 3, dropkick: 3 }, name: N("Ki Explosion", "Pagsabog ng Ki"),
      desc: N("L: −4% cooldown per level.", "L: −4% cooldown bawat level."), fx: (l) => ({ lcd: 4 * l }) },
    { id: "spiritfox", icon: "🦊", max: 10, row: 4, col: 1, req: { kibody: 3 }, kind: "summon", fx: () => ({}), familiar: "fox", name: N("Spirit Fox", "Espiritung Soro"),
      desc: N("Summon: a quick ki fox darts between foes; each bite restores a little stamina. Replaces the Pocket Slime.", "Summon: mabilis na sorong ki na lumilipat-lipat sa mga kalaban; bawat kagat ay nagbabalik ng kaunting stamina. Papalit sa Alagang Slime.") }
  ],
  ...PATH_TREES
};

export const skillText = (s) => {
  const L = getLang() === "fil" ? "fil" : "en";
  return { name: s.name[L], desc: s.desc[L] };
};

// Trees available to the class: the Novice tree is always included
export function treesFor(cls) {
  return cls === "novice" ? ["novice"] : ["novice", cls];
}

// Every tree whose skills count for the hero: class trees plus the Might / Finesse / Arcana paths
export const allTreesFor = (cls) => treesFor(cls).concat(PATH_TREE_IDS);

// Classes with a summon of their own (Guardian Angels, the falcon) don't get a familiar
export const OWN_SUMMON = ["priest", "archer"];

export function findSkill(id) {
  for (const t of Object.values(TREES)) { const s = t.find((x) => x.id === id); if (s) return s; }
  return null;
}

// Why a skill can't be raised (other than points): "lv" (hero level), "style" (path must resonate),
// "summon" (class has its own summon), "req" (required skills) — or null
export function learnBlock(player, s) {
  if (s.minLv && player.level < s.minLv) return "lv";
  if (s.familiar && OWN_SUMMON.includes(player.heroData.id)) return "summon";
  if (!Object.entries(s.req || {}).every(([id, need]) => (player.skillLevels[id] || 0) >= need)) return "req";
  if (s.style && !(player.skillLevels[s.id] > 0) && styleOf(player) !== s.path) return "style";
  return null;
}

// Can the skill be raised?
export const pointPoolFor = (s) => s.path ? "pathPoints" : "skillPoints";

// Restore independent balances; old saves spent both kinds from skillPoints.
export function loadSkillPoints(player, data) {
  const pathSpent = Object.entries(player.skillLevels).reduce((n, [id, lv]) =>
    n + (findSkill(id)?.path ? lv : 0), 0);
  player.skillPoints = data.skillPoints || 0;
  if (data.pathPoints === undefined) {
    player.skillPoints += pathSpent;
    player.pathPoints = Math.max(0, player.level - 1 - pathSpent);
  } else {
    player.pathPoints = data.pathPoints;
  }
}

export function canLearn(player, s) {
  const lv = player.skillLevels[s.id] || 0;
  if (!(player[pointPoolFor(s)] > 0) || lv >= s.max) return false;
  return !learnBlock(player, s);
}

// Combined effect of every learned skill. The resonant path's passives are RESONANCE (20%) stronger.
export function skillBonus(player) {
  const out = {};
  const style = styleOf(player);
  allTreesFor(player.heroData.id).forEach((t) => TREES[t].forEach((s) => {
    const lv = player.skillLevels[s.id] || 0;
    if (!lv) return;
    const m = s.path && s.path === style ? 1 + RESONANCE : 1;
    Object.entries(s.fx(lv)).forEach(([k, v]) => { out[k] = (out[k] || 0) + v * m; });
  }));
  // Whole stat points only (STR/AGI/…)
  STATS.forEach((k) => { if (out[k]) out[k] = Math.floor(out[k]); });
  return out;
}

// ==================== AUTO STAT PATH ====================
// player.autoStat: "off" | "str" | "dex" | "int" | "style" (follows the resonant path, or the class's
// main stat while undecided). Points are spent towards a ratio per path; the cheapest stat behind its
// share goes first, so costs rising every 10 points keep the build in shape.
export const AUTO_RATIOS = {
  str: { str: 3, vit: 2, agi: 1 },
  dex: { dex: 3, vit: 1, agi: 1, luk: 1 },
  int: { int: 3, vit: 2, dex: 1 }
};
export const AUTO_MODES = ["off", "str", "dex", "int", "style"];

export function autoPathFor(player) {
  const m = player.autoStat;
  if (!m || m === "off") return null;
  if (m !== "style") return AUTO_RATIOS[m] ? m : null;
  return styleOf(player) || PRIMARY[player.heroData.id] || "str";
}

// Spends stat points by the auto path (or `path`). Returns the points spent.
export function autoAllocate(player, path = autoPathFor(player)) {
  const ratio = AUTO_RATIOS[path];
  if (!ratio) return 0;
  const start = player.statPoints;
  for (;;) {
    const k = Object.keys(ratio)
      .filter((s) => player.stats[s] < STAT_MAX)
      .sort((a, b) => (player.stats[a] - 1) / ratio[a] - (player.stats[b] - 1) / ratio[b])[0];
    if (!k || statCost(player.stats[k]) > player.statPoints) break;
    if (!player.raiseStat(k)) break;
  }
  return start - player.statPoints;
}

// Independent automatic learning; points wait when level/style prerequisites are not met.
export function autoLearn(player, kind) {
  const paths = kind === "paths";
  const mode = paths ? player.autoPath : player.autoSkill;
  if (!mode || mode === "off") return 0;
  const pool = paths ? "pathPoints" : "skillPoints", before = player[pool];
  const path = mode === "style" ? styleOf(player) || PRIMARY[player.heroData.id] || "str" : mode;
  const candidates = paths ? Object.values(TREES).flat().filter(s => s.path === path)
    : treesFor(player.heroData.id).flatMap(t => TREES[t]);
  while (player[pool] > 0) {
    const next = candidates.filter(s => canLearn(player, s)).sort((a, b) =>
      (player.skillLevels[a.id] || 0) - (player.skillLevels[b.id] || 0) || a.row - b.row)[0];
    if (!next || !player.learnSkill(next.id)) break;
    if (paths && next.kind === "active" && !(player.pathSlots || []).includes(next.id)) {
      const empty = player.pathSlots.findIndex(id => !id);
      if (empty >= 0) player.pathSlots[empty] = next.id;
    }
  }
  return before - player[pool];
}
