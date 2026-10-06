import { getLang } from "./i18n.js";
import { npcName } from "./dialogue.js";
import { NPC_DEFS } from "./npc/roster.js";
import { MONSTERS, BOSSES, NIGHT_KINDS } from "./bestiary.js";
import { BOOK_ONE_AREAS, areaDef } from "./world/areas.js";
import { PLATFORMS, PLATFORM_ORDER } from "./world/platforms.js";
import { codexItems, getItem, statText, skillText, slotName, SETS, setThresholds, RARITY } from "./items/itemdb.js";
import { iconURL } from "./items/icons.js";
import { elementName, raceName, sizeName, ELEMENTS } from "./elements.js";
import { statusName } from "./status.js";
import { livesFor } from "./monsterTiers.js";
import { Avatar } from "./avatar/avatar.js";

// ==================== CODEX (N): data and detail panels ====================
// The encyclopedia's content: NPCs · Monsters & MVPs · Weapons · Equipment · Accessories · Others
// (consumables, upgrade materials, cards, quest items). NPCs are revealed once met and monsters once
// defeated (the rest show as "???", so later Acts are not spoiled); the item lists are a full reference.
// Progress (kills per monster, NPCs met) is saved with the game. It is shown by the Codex scene
// (js/scenes/codexScene.js), which also serves the Character Creator and the Job Awakening.

const L = () => (getLang() === "fil" ? "fil" : "en");
const TEXT = {
  en: {
    title: "Codex", unknown: "???", undiscovered: "Not yet discovered.", kills: "Defeated", habitat: "Habitat",
    element: "Element", race: "Race", size: "Size", hp: "HP", lives: "Life bars", dmg: "Damage", blight: "Inflicts", drop: "Drops", arena: "Lair",
    night: "Night only", role: "Role", where: "Found at", classes: "Classes", any: "Any class", hands2: "Two-handed",
    stats: "Base stats", grows: "Stats grow with grade (Aethelgard → Sovereign) and refining.", price: "Value", setBonus: "Set bonuses",
    pieces: "Pieces: weapon, head, armor, gloves, boots (built for your class)",
    craftedPieces: (lv) => `Crafted at any safe zone (G). Requires Lv ${lv}. Pieces: weapon, off-hand, head, armor, garment, gloves, boots, amulet, rings (built for your class)`, mvp: "MVP", threat: "Threat", normal: "Common", elite: "Elite", close: "N / Esc — close · ←/→ tabs · ↑/↓ entries",
    tabs: { npc: "NPCs", monsters: "Monsters & MVP", weapons: "Weapons", equipment: "Equipment", accessories: "Accessories", others: "Others" },
    groups: { consume: "Consumables", material: "Upgrade Materials", card: "Cards", quest: "Quest Items", unique: "Unique", set: "Set", mvp: "MVP Bosses", monsters: "Monsters" }
  },
  fil: {
    title: "Codex", unknown: "???", undiscovered: "Hindi pa natutuklasan.", kills: "Natalo", habitat: "Tirahan",
    element: "Elemento", race: "Lahi", size: "Laki", hp: "HP", lives: "Bilang ng buhay", dmg: "Pinsala", blight: "Nagdudulot", drop: "Nahuhulog", arena: "Pugad",
    night: "Gabi lamang", role: "Tungkulin", where: "Matatagpuan sa", classes: "Mga class", any: "Kahit anong class", hands2: "Dalawang kamay",
    stats: "Batayang stats", grows: "Lumalaki ang stats ayon sa grado (Aethelgard → Sovereign) at pag-refine.", price: "Halaga", setBonus: "Bonus ng set",
    pieces: "Piyesa: sandata, ulo, baluti, guwantes, bota (ginawa para sa iyong class)",
    craftedPieces: (lv) => `Ginagawa sa anumang ligtas na lugar (G). Kailangan ang Lv ${lv}. Piyesa: sandata, kabilang kamay, ulo, baluti, balabal, guwantes, bota, kuwintas, singsing (ginawa para sa iyong class)`, mvp: "MVP", threat: "Banta", normal: "Karaniwan", elite: "Elite", close: "N / Esc — isara · ←/→ tab · ↑/↓ entry",
    tabs: { npc: "Mga NPC", monsters: "Halimaw at MVP", weapons: "Sandata", equipment: "Kagamitan", accessories: "Aksesorya", others: "Iba pa" },
    groups: { consume: "Nagagamit", material: "Pang-upgrade", card: "Card", quest: "Quest Item", unique: "Unique", set: "Set", mvp: "MVP Boss", monsters: "Halimaw" }
  }
};
const tx = () => TEXT[L()];

// NPCs shown in the Codex: role and where to find them
const NPCS = {
  aurelia: { en: ["Crown Princess · your summoner", "Barracks Sanctuary, and at the camp of every campaign platform"], fil: ["Prinsesang Tagapagmana · iyong tagapagtawag", "Barracks Sanctuary, at sa kampo ng bawat platform"] },
  kenneth: { en: ["Crown Prince · your summoner", "Barracks Sanctuary, and at the camp of every campaign platform"], fil: ["Prinsipeng Tagapagmana · iyong tagapagtawag", "Barracks Sanctuary, at sa kampo ng bawat platform"] },
  king: { en: ["King of Aethelgard", "Audience dais of the Imperial Citadel"], fil: ["Hari ng Aethelgard", "Audience dais ng Imperial Citadel"] },
  royalGuard: { en: ["Guards the King", "Audience dais of the Imperial Citadel"], fil: ["Bantay ng Hari", "Audience dais ng Imperial Citadel"] },
  ronald: { en: ["Mercenary Commander · hires mercenaries, refines to +4, field repairs", "Barracks Sanctuary"], fil: ["Kumander ng Mercenary · umuupa ng mercenary, nagre-refine hanggang +4, field repair", "Barracks Sanctuary"] },
  edgar: { en: ["Apothecary · potions and cures", "Barracks Sanctuary, and a field apothecary on the Lamenting Strand"], fil: ["Apothecary · mga potion at lunas", "Barracks Sanctuary, at may pansamantalang botika sa Dalampasigan ng Panaghoy"] },
  arthur: { en: ["Earthbound soul · Knight mentor", "Barracks Sanctuary"], fil: ["Kaluluwang taga-Daigdig · mentor ng Knight", "Barracks Sanctuary"] },
  lyra: { en: ["Earthbound soul · Archer mentor", "Barracks Sanctuary"], fil: ["Kaluluwang taga-Daigdig · mentor ng Archer", "Barracks Sanctuary"] },
  julian: { en: ["Earthbound soul · Priest mentor", "Barracks Sanctuary"], fil: ["Kaluluwang taga-Daigdig · mentor ng Priest", "Barracks Sanctuary"] },
  sam: { en: ["Earthbound soul · Mage mentor", "Barracks Sanctuary"], fil: ["Kaluluwang taga-Daigdig · mentor ng Mage", "Barracks Sanctuary"] },
  renzo: { en: ["Earthbound soul · Fighter mentor", "Barracks Sanctuary"], fil: ["Kaluluwang taga-Daigdig · mentor ng Fighter", "Barracks Sanctuary"] },
  brakka: { en: ["Master smith · refines to +10, forges mineral sets, tempers gear", "Emberhold, Ashfall Wastelands"], fil: ["Punong panday · refine hanggang +10, forge ng set, pagpapatibay", "Emberhold, Ashfall Wastelands"] },
  hilde: { en: ["Repairs weapons and armor", "Emberhold, Ashfall Wastelands"], fil: ["Nag-aayos ng sandata at baluti", "Emberhold, Ashfall Wastelands"] },
  durgrim: { en: ["Thane of Emberhold · grants the right to mine", "Emberhold, Ashfall Wastelands"], fil: ["Thane ng Emberhold · nagbibigay ng karapatang magmina", "Emberhold, Ashfall Wastelands"] },
  pip: { en: ["Shopkeeper · materials and potions", "Emberhold, Ashfall Wastelands"], fil: ["Tindero · mga materyales at potion", "Emberhold, Ashfall Wastelands"] },
  elvenMatriarch: { en: ["Elder of the elves · tells how to fight Malakor", "Camp of the Whispering Canopy"], fil: ["Nakatatanda ng mga elf · nagtuturo kung paano labanan si Malakor", "Kampo ng Whispering Canopy"] },
  maren: { en: ["Archivist of the Chronicles · recaps your story and tells you where to go next", "Barracks Sanctuary"], fil: ["Arkibista ng mga Kronika · nagbubuod ng iyong kuwento at nagsasabi kung saan susunod", "Barracks Sanctuary"] },
  isolde: { en: ["Ship's captain · advice on the sea, the Seal Stones and the Monolith", "Cerulean Abyss camp, Lamenting Strand camp"], fil: ["Kapitana ng barko · payo tungkol sa dagat, mga Seal Stone at Monolith", "Kampo ng Cerulean Abyss, kampo ng Dalampasigan ng Panaghoy"] },
  veyra: { en: ["Half-demon scout · briefs you on each Dark Continent boss", "Every camp on the Dark Continent"], fil: ["Kalahating-demonyong batyaw · nagpapaliwanag ng bawat boss ng Dark Continent", "Bawat kampo sa Dark Continent"] },
  aldric: { en: ["Last monk of the Order of the Lantern · the Lantern Knight and the First War", "Camp of the Ossuary Fields"], fil: ["Huling monghe ng Orden ng Lantern · ang Lantern Knight at ang Unang Digmaan", "Kampo ng Kaparangan ng mga Buto"] }
};

const WEAPON_SLOTS = ["weapon"];
const EQUIP_SLOTS = ["offhand", "head", "armor", "garment", "gloves", "boots"];
const ACC_SLOTS = ["amulet", "ring"];
export const TAB_KEYS = ["npc", "monsters", "weapons", "equipment", "accessories", "others"];
export const ITEM_TABS = ["weapons", "equipment", "accessories", "others"];
export const codexText = () => tx();

export class Codex {
  constructor() {
    this.reset();
    this.avatars = {};
  }

  // ---------- progress (saved with the game) ----------
  reset() {
    this.kills = {};             // monster/boss key → times defeated
    this.met = new Set();        // NPC ids met
  }

  serialize() {
    return { k: { ...this.kills }, n: [...this.met] };
  }

  load(data) {
    this.reset();
    if (!data) return;
    Object.entries(data.k || {}).forEach(([k, v]) => { if (MONSTERS[k] || BOSSES[k]) this.kills[k] = v | 0; });
    (data.n || []).forEach((id) => { if (NPCS[id]) this.met.add(id); });
  }

  recordKill(key) { this.kills[key] = (this.kills[key] || 0) + 1; }
  meet(id) { if (NPCS[id]) this.met.add(id); }

  // ---------- entries per tab ----------
  entries(tab = "npc") {
    const T = tx(), out = [];
    const head = (label) => out.push({ header: label });
    if (tab === "npc") {
      Object.keys(NPCS).forEach((id) => out.push({ kind: "npc", id, known: this.met.has(id), name: npcName(id) }));
    } else if (tab === "monsters") {
      head(T.groups.mvp);
      Object.keys(BOSSES).forEach((id) => out.push({ kind: "boss", id, known: Boolean(this.kills[id]), name: BOSSES[id].name[L()] }));
      head(T.groups.monsters);
      Object.keys(MONSTERS).forEach((id) => out.push({ kind: "monster", id, known: Boolean(this.kills[id]), name: MONSTERS[id].name[L()] }));
    } else {
      const items = codexItems();
      const slots = { weapons: WEAPON_SLOTS, equipment: EQUIP_SLOTS, accessories: ACC_SLOTS }[tab];
      if (slots) {
        slots.forEach((slot) => {
          const list = items.equip.filter((it) => it.slot === slot);
          if (!list.length) return;
          head(slotName(slot));
          list.forEach((it) => out.push({ kind: "item", item: it, known: true, name: it.name }));
        });
        const uniq = items.uniques.filter((it) => slots.includes(it.slot));
        if (uniq.length) { head(T.groups.unique); uniq.forEach((it) => out.push({ kind: "item", item: it, known: true, name: it.name })); }
        if (tab !== "accessories") { head(T.groups.set); items.sets.forEach((id) => out.push({ kind: "set", id, known: true, name: SETS[id].name[L()] })); }
      } else {
        ["consume", "material", "quest"].forEach((type) => {
          head(T.groups[type]);
          items.other.filter((it) => it.type === type).forEach((it) => out.push({ kind: "item", item: it, known: true, name: it.name }));
          if (type === "material") { head(T.groups.card); items.cards.forEach((it) => out.push({ kind: "item", item: it, known: true, name: it.name })); }
        });
      }
    }
    return out;
  }

  selectable(list) { return list.map((e, i) => (e.header ? -1 : i)).filter((i) => i >= 0); }

  portrait(parent, add, draw) {
    if (this.noPortrait) return;
    const cv = add(parent, "canvas", "cx-portrait");
    cv.width = 72;
    cv.height = 72;
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    draw(c, cv.width, cv.height);
  }

  // opts.portrait = false: the Codex scene shows the entity on its turntable instead
  renderDetail(det, e, add, opts = {}) {
    const T = tx(), Lg = L();
    if (!e || e.header) return;
    this.noPortrait = opts.portrait === false;
    const row = (k, v) => { const r = add(det, "div", "cx-row"); add(r, "span", "cx-k", k); add(r, "b", "cx-v", v); };
    if (!e.known) {
      this.portrait(det, add, (c, w, h) => { c.fillStyle = "#1e293b"; c.font = "bold 36px monospace"; c.textAlign = "center"; c.fillText("?", w / 2, h / 2 + 12); });
      add(det, "div", "cx-name", T.unknown);
      add(det, "div", "cx-desc", T.undiscovered);
      return;
    }
    if (e.kind === "npc") {
      const av = this.avatars[e.id] || (this.avatars[e.id] = new Avatar(NPC_DEFS[e.id].look));
      const squash = NPC_DEFS[e.id].dwarf ? 0.8 : 1;
      this.portrait(det, add, (c, w, h) => av.draw(c, w / 2, h - 4, "down", "idle", 0, false, false, 1.8, squash));
      add(det, "div", "cx-name", e.name);
      row(T.role, NPCS[e.id][Lg][0]);
      row(T.where, NPCS[e.id][Lg][1]);
    } else if (e.kind === "monster" || e.kind === "boss") {
      const k = e.kind === "boss" ? BOSSES[e.id] : MONSTERS[e.id];
      this.portrait(det, add, (c, w, h) => k.sprite.draw(c, w / 2, h - 6, "down", "idle", 0, false, false, e.kind === "boss" ? 1 : 1.6));
      add(det, "div", "cx-name" + (e.kind === "boss" ? " mvp" : ""), `${e.kind === "boss" ? `${T.mvp} · ` : ""}${e.name}`);
      row(T.threat, e.kind === "boss" ? T.mvp : k.elite ? T.elite : T.normal);
      const el = k.element || "neutral";
      row(T.element, `${(ELEMENTS[el] || {}).icon || ""} ${elementName(el)}`);
      if (k.race) row(T.race, raceName(k.race));
      if (k.size) row(T.size, sizeName(k.size));
      row(T.hp, `×${e.kind === "boss" ? k.hpBase : k.hpMult}`);
      row(T.dmg, String(k.dmg));
      if (k.debuff) row(T.blight, k.debuff.type === "all" ? "★" : `${statusName(k.debuff.type)} (${Math.round(k.debuff.chance * 100)}%)`);
      if (e.kind === "boss") {
        const plat = PLATFORM_ORDER.map((id) => PLATFORMS[id]).find((p) => p.boss === e.id);
        if (plat) {
          row(T.arena, `Act ${plat.act} · ${plat.arenaName[Lg]}`);
          const lv = (plat.levels ? plat.levels[1] : plat.tier * 5 + 7) + 2;   // EnemyManager.spawnBoss
          row(T.lives, `×${livesFor({ boss: true, level: lv })}`);
        }
        if (k.drop) row(T.drop, getItem(k.drop).name);
      } else {
        // Every map that has it as a regular or an elite kind ("Elite" is the tier name in both languages)
        const where = BOOK_ONE_AREAS.map(areaDef).filter((d) => d.monsters.includes(e.id) || (d.elites || []).includes(e.id))
          .map((d) => `${d.name[Lg]}${(d.elites || []).includes(e.id) ? " (Elite)" : ""}`);
        if (NIGHT_KINDS.includes(e.id)) where.push(`${areaDef("hub").name[Lg]} (${T.night})`);
        row(T.habitat, where.join(" · ") || "—");
      }
      row(T.kills, String(this.kills[e.id] || 0));
    } else if (e.kind === "set") {
      const set = SETS[e.id];
      add(det, "div", "cx-name", set.name[Lg]).style.color = set.color;
      add(det, "div", "cx-desc", set.crafted ? T.craftedPieces(set.level) : T.pieces);
      row(T.stats, Object.entries(set.piece).map(([s, v]) => statText(s, v)).join("  "));
      add(det, "div", "cx-sub", T.setBonus);
      const steps = setThresholds(set), top = steps[steps.length - 1];
      steps.forEach((n) => row(`(${n})`, `${n === top ? `${set.passive[Lg]}: ` : ""}${[
        ...Object.entries(set.bonus[n]).map(([s, v]) => statText(s, v)),
        ...Object.entries((set.skill && set.skill[n]) || {}).map(([s, v]) => skillText(s, v))].join("  ")}`));
    } else {
      const it = e.item;
      this.portrait(det, add, (c, w, h) => { const img = new Image(); img.onload = () => c.drawImage(img, 12, 12, w - 24, h - 24); img.src = iconURL(it); });
      add(det, "div", "cx-name", it.name).style.color = it.color;
      if (it.type === "equip") {
        add(det, "div", "cx-meta", `${RARITY[it.rarity][Lg]} · ${slotName(it.slot)}${it.hands === 2 ? ` · ${T.hands2}` : ""}`);
        row(T.classes, it.cls ? it.cls.map((k) => k[0].toUpperCase() + k.slice(1)).join(", ") : T.any);
        row(T.stats, Object.entries(it.stats).map(([s, v]) => statText(s, v)).join("  "));
        add(det, "div", "cx-desc", T.grows);
      } else {
        if (it.type === "card") row(T.stats, Object.entries(it.stats).map(([s, v]) => statText(s, v)).join("  "));
        if (it.desc) add(det, "div", "cx-desc", it.desc);
      }
      if (it.price) row(T.price, `${it.price}G`);
    }
  }
}
