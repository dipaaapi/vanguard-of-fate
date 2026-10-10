import { getLang } from "./i18n.js";
import { getItem, describe, SETS, slotName, statText, skillText } from "./items/itemdb.js";
import { CRAFT_TIERS, PATHS, PATH_ORDER, recipeFor } from "./items/craftsets.js";
import { craftSlots, craftCheck, craftPiece, ownedPieces, autoCraft, recommendedPath, tierForLevel, setIdFor, TRANSMUTES, transmute, pieceFor } from "./items/crafting.js";
import { DISHES, cook, cookCheck } from "./items/cooking.js";
import { Market, formatCoins } from "./items/economy.js";

// ==================== SAFE-ZONE WORKSHOP (G) ====================
// Opens in any safe zone (Barracks, the Citadel dais, a platform camp). Uses the NPC service menu.
//   Craft gear  — tier (Lv 10–100) → path (STR / DEX / INT; ★ = the path your build leans to) → piece
//   Auto-craft  — pick a target set; the next missing piece is crafted whenever you are in a safe zone
//                 with the materials (update() runs every frame from main.js)
//   Cook        — the 15 dishes (js/items/cooking.js); eat them from the bag
//   Transmute   — trade materials up a tier or swap essences
// Also saves/loads the hero's life-skill state (craft target, active meal, market saturation).

const TEXT = {
  en: {
    title: "Workshop", craft: "Craft gear", craftHint: "Ore, cores and essence from monsters and veins",
    auto: (on, name) => `Auto-craft: ${on ? "ON" : "OFF"}${name ? ` · ${name}` : ""}`, autoHint: "Crafts the next missing piece of your target set in safe zones",
    cook: "Cook", cookHint: "Fish, meat, spice and salt into buff meals", transmute: "Transmute", transmuteHint: "Trade materials up a tier or swap essences",
    tier: (lv, you) => `Lv ${lv} sets${you ? " · your tier" : ""}`, tierHint: (g) => `Grade ${g} pieces · 2 / 4 / 6-piece bonuses and a skill boost`,
    path: (name, rec) => `${name}${rec ? " ★ your build" : ""}`, back: "« Back",
    target: (name) => `Make "${name}" the auto-craft target`, isTarget: "★ Auto-craft target",
    have: (n) => `owned ${n}`, needLv: (lv) => `wear at Lv ${lv}`,
    errs: { gold: "Not enough gold", materials: "Not enough materials", full: "Bag is full", slot: "Can't craft that", level: "Level too low", ingredients: "Missing ingredients" },
    crafted: (name) => `Crafted: ${name}`, autoCrafted: (name) => `Auto-crafted at the safe zone: ${name}`,
    cooked: (name) => `Cooked: ${name}`, transmuted: (a, b) => `Transmuted ${a} → ${b}`,
    ores: "Ore and cores", essences: "Essences", lvl: (lv) => `needs Lv ${lv}`, safeOnly: "The workshop is only open in a safe zone"
  },
  fil: {
    title: "Talyer", craft: "Gumawa ng gamit", craftHint: "Mineral, core at diwa mula sa halimaw at ugat",
    auto: (on, name) => `Kusang paggawa: ${on ? "BUKAS" : "SARADO"}${name ? ` · ${name}` : ""}`, autoHint: "Ginagawa ang susunod na kulang na piraso ng target na set sa ligtas na lugar",
    cook: "Magluto", cookHint: "Isda, karne, pampalasa at asin para sa pagkaing may buff", transmute: "Transmute", transmuteHint: "Ipagpalit ang materyales pataas o ang diwa",
    tier: (lv, you) => `Mga set na Lv ${lv}${you ? " · antas mo" : ""}`, tierHint: (g) => `Gradong ${g} · bonus sa 2 / 4 / 6 piraso at skill boost`,
    path: (name, rec) => `${name}${rec ? " ★ ayon sa build mo" : ""}`, back: "« Bumalik",
    target: (name) => `Gawing target ng kusang paggawa ang "${name}"`, isTarget: "★ Target ng kusang paggawa",
    have: (n) => `mayroon ${n}`, needLv: (lv) => `maisusuot sa Lv ${lv}`,
    errs: { gold: "Kulang ang ginto", materials: "Kulang ang materyales", full: "Puno ang bag", slot: "Hindi magagawa", level: "Kulang ang level", ingredients: "Kulang ang sangkap" },
    crafted: (name) => `Nagawa: ${name}`, autoCrafted: (name) => `Kusang nagawa sa ligtas na lugar: ${name}`,
    cooked: (name) => `Naluto: ${name}`, transmuted: (a, b) => `Na-transmute ${a} → ${b}`,
    ores: "Mineral at core", essences: "Mga diwa", lvl: (lv) => `kailangan ang Lv ${lv}`, safeOnly: "Bukas lang ang talyer sa ligtas na lugar"
  }
};
const L = () => (getLang() === "fil" ? "fil" : "en");
const tx = () => TEXT[L()];
const AUTO_EVERY = 90;        // frames between auto-craft attempts in a safe zone

export class Workshop {
  // deps: { menu (ServiceMenu), fx, log(kind, text, color), sound, onChange() }
  constructor(deps) {
    this.d = deps;
    this.timer = 0;
  }

  // ---------- menus ----------
  open(player) {
    const T = tx(), d = this.d;
    this.player = player;
    if (!player.craft.target) player.craft.target = setIdFor(recommendedPath(player), Math.max(1, tierForLevel(player.level)));
    const target = SETS[player.craft.target];
    d.menu.show(`${T.title} · ◆ ${formatCoins(player.gold)}`, [
      { label: T.craft, hint: T.craftHint, onPick: () => this.tiers() },
      { label: T.auto(player.craft.auto, target && target.name[L()]), hint: T.autoHint,
        onPick: () => { player.craft.auto = !player.craft.auto; this.open(player); } },
      { label: T.cook, hint: T.cookHint, onPick: () => this.cookPaths() },
      { label: T.transmute, hint: T.transmuteHint, onPick: () => this.transmuteMenu() }
    ]);
  }

  tiers() {
    const T = tx(), p = this.player, mine = Math.max(1, tierForLevel(p.level));
    this.d.menu.show(T.craft, [
      ...CRAFT_TIERS.map((c) => ({ label: T.tier(c.level, c.tier === mine), hint: T.tierHint(c.grade), onPick: () => this.paths(c.tier) })),
      { label: T.back, onPick: () => this.open(p) }
    ]);
  }

  paths(tier) {
    const T = tx(), p = this.player, rec = recommendedPath(p);
    this.d.menu.show(T.tier(CRAFT_TIERS[tier - 1].level), [
      ...PATH_ORDER.map((path) => {
        const set = SETS[setIdFor(path, tier)];
        const top = set.skill[6] ? Object.entries(set.skill[6]).map(([k, v]) => skillText(k, v)).join(", ") : "";
        return { label: `${T.path(PATHS[path].name[L()], path === rec)} — ${set.name[L()]}`, hint: `6: ${set.passive[L()]} · ${top}`, onPick: () => this.pieces(setIdFor(path, tier)) };
      }),
      { label: T.back, onPick: () => this.tiers() }
    ]);
  }

  pieces(setId) {
    const T = tx(), p = this.player, set = SETS[setId], cls = p.heroData.id, have = ownedPieces(p, setId);
    const cost = (r) => Object.entries(r).map(([id, n]) => (id === "gold" ? `${formatCoins(n)}` : `${getItem(id).name} ${p.bag.count(id)}/${n}`)).join(" · ");
    this.d.menu.show(`${set.name[L()]} · ${T.needLv(set.level)} · ◆ ${formatCoins(p.gold)}`, [
      p.craft.target === setId
        ? { label: T.isTarget, disabled: true, onPick: () => {} }
        : { label: T.target(set.name[L()]), onPick: () => { p.craft.target = setId; p.craft.auto = true; this.pieces(setId); } },
      ...craftSlots(cls).map((slot) => {
        const it = describe(pieceFor(cls, setId, slot));
        const stats = Object.entries(it.stats).map(([k, v]) => statText(k, v)).join(" ");
        return {
          label: `${slotName(slot)}: ${it.name}${have[slot] ? ` (${T.have(have[slot])})` : ""}`,
          hint: `${cost(recipeFor(setId, slot))} — ${stats}`,
          disabled: Boolean(craftCheck(p, setId, slot)),
          onPick: () => {
            const err = craftPiece(p, setId, slot);
            if (err) this.say(T.errs[err], "#ef4444");
            else this.done(T.crafted(it.name), set.color);
            this.pieces(setId);
          }
        };
      }),
      { label: T.back, onPick: () => this.paths(set.tier) }
    ]);
  }

  cookPaths() {
    const T = tx(), p = this.player;
    this.d.menu.show(T.cook, [
      ...PATH_ORDER.map((path) => ({ label: PATHS[path].name[L()], onPick: () => this.dishes(path) })),
      { label: T.back, onPick: () => this.open(p) }
    ]);
  }

  dishes(path) {
    const T = tx(), p = this.player;
    this.d.menu.show(`${T.cook} · ${PATHS[path].name[L()]}`, [
      ...Object.entries(DISHES).filter(([, dsh]) => dsh.path === path).map(([id, dsh]) => {
        const err = cookCheck(p.bag, p.level, id);
        const ing = Object.entries(dsh.ing).map(([k, n]) => `${getItem(k).name} ${p.bag.count(k)}/${n}`).join(" · ");
        const fx = [...Object.entries(dsh.stats).map(([k, v]) => statText(k, v)), ...Object.entries(dsh.skill).map(([k, v]) => skillText(k, v))].join(", ");
        return {
          label: `${dsh.name[L()]}${err === "level" ? ` (${T.lvl(dsh.level)})` : ""}${p.bag.count(id) ? ` (${T.have(p.bag.count(id))})` : ""}`,
          hint: `${ing} — ${fx}`, disabled: Boolean(err),
          onPick: () => {
            const e = cook(p.bag, p.level, id);
            if (e) this.say(T.errs[e], "#ef4444");
            else this.done(T.cooked(dsh.name[L()]), dsh.tint);
            this.dishes(path);
          }
        };
      }),
      { label: T.back, onPick: () => this.cookPaths() }
    ]);
  }

  transmuteMenu(group = null) {
    const T = tx(), p = this.player;
    if (!group) {
      this.d.menu.show(T.transmute, [
        { label: T.ores, onPick: () => this.transmuteMenu("ore") },
        { label: T.essences, onPick: () => this.transmuteMenu("essence") },
        { label: T.back, onPick: () => this.open(p) }
      ]);
      return;
    }
    const rules = TRANSMUTES.filter((r) => (group === "essence") === r.from.endsWith("Essence"));
    this.d.menu.show(`${T.transmute} · ◆ ${formatCoins(p.gold)}`, [
      ...rules.map((r) => ({
        label: `${r.qty} ${getItem(r.from).name} → 1 ${getItem(r.to).name}`,
        hint: `${getItem(r.from).name} ${p.bag.count(r.from)}/${r.qty} · ${formatCoins(r.gold)}`,
        disabled: p.bag.count(r.from) < r.qty || p.gold < r.gold,
        onPick: () => {
          const err = transmute(p, r);
          if (err) this.say(T.errs[err], "#ef4444");
          else this.done(T.transmuted(getItem(r.from).name, getItem(r.to).name), getItem(r.to).tint);
          this.transmuteMenu(group);
        }
      })),
      { label: T.back, onPick: () => this.transmuteMenu() }
    ]);
  }

  // ---------- auto-craft (every frame while playing) ----------
  update(player, inSafeZone) {
    if (!inSafeZone) { this.timer = 0; return; }
    this.player = player;
    if (++this.timer < AUTO_EVERY) return;
    this.timer = 0;
    const r = autoCraft(player);
    if (r) this.done(tx().autoCrafted(r.item.name), SETS[r.setId].color);
  }

  say(text, color) {
    const p = this.player || {};
    if (this.d.fx && this.d.fx.spawnDamagePopup && p.x !== undefined) this.d.fx.spawnDamagePopup(p.x + 10, p.y - 10, text, false, color);
  }

  done(text, color) {
    const p = this.player;
    if (this.d.fx && p && this.d.fx.spawnHitSparks) this.d.fx.spawnHitSparks(p.x + 10, p.y + 6, color, 18);
    if (this.d.sound && this.d.sound.playLootPickup) this.d.sound.playLootPickup();
    if (this.d.log) this.d.log("loot", text, color);
    if (this.d.onChange) this.d.onChange();
  }

  // ---------- save ----------
  static serialize(player) {
    return {
      craft: { target: player.craft.target, auto: Boolean(player.craft.auto) },
      meal: player.meal && DISHES[player.meal.id] ? { id: player.meal.id, t: Math.max(0, player.meal.t | 0) } : null,
      market: player.market ? player.market.serialize() : {}
    };
  }

  static load(player, data) {
    if (!data || typeof data !== "object") return;
    const c = data.craft || {};
    player.craft = { target: SETS[c.target] && SETS[c.target].crafted ? c.target : null, auto: c.auto !== false };
    const m = data.meal;
    player.meal = m && DISHES[m.id] ? { id: m.id, t: Math.max(0, Math.min(DISHES[m.id].time, m.t | 0)) } : null;
    player.market = new Market(data.market);
    player.recalc();
  }
}
