import { isBroken } from "./durability.js";
import { SETS, setThresholds } from "./itemdb.js";
import { startMeal } from "./cooking.js";
import { describe, canEquip, upgradeCost, refineChance, slotsFor, SLOTS, MAX_PLUS, CLASS_KIT } from "./itemdb.js";

// ==================== BAG + EQUIPMENT ====================
// slots: instances in the bag { id, qty, plus, rarity, affixes, sockets, cards }.
// STACKING: identical items share one slot — potions, materials, cards, quest items,
// and even equipment that is exactly the same (same id, refine, rarity, affixes, sockets and cards).
// Maximum per slot: 999 (usable) · 20 (equipment).
// equip: { weapon, offhand, head, armor, garment, gloves, boots, amulet, ring1, ring2 } → instance | null

export const BAG_SIZE = 40;
const POTION_CD = 150;   // 2.5s shared cooldown between healing items
const STACK_MAX = { equip: 20, other: 999 };

// Item signature: equal only when every property is exactly the same
export function signature(s) {
  return [s.id, s.plus | 0, s.rarity || "normal", s.sockets | 0, (s.cards || []).join(","),
    JSON.stringify((s.affixes || []).map((a) => [a.k, a.v])), s.rareName || "", s.dur === undefined ? "" : Math.ceil(s.dur),
    s.set || "", s.temper | 0].join("|");
}
const TYPE_ORDER = { quest: 0, equip: 1, card: 2, consume: 3, material: 4 };

const clean = (s) => ({
  id: s.id, qty: Math.max(1, s.qty | 0), plus: Math.max(0, Math.min(MAX_PLUS, s.plus | 0)),
  rarity: s.rarity || "normal", affixes: Array.isArray(s.affixes) ? s.affixes : [],
  sockets: Math.max(0, Math.min(3, s.sockets | 0)), cards: Array.isArray(s.cards) ? s.cards.slice(0, 3) : [],
  ...(s.rareName ? { rareName: s.rareName } : {}),
  ...(s.at ? { at: s.at } : {}),         // when the stack was last added to (for "Recent" sorting)
  ...(s.dur !== undefined ? { dur: Math.max(0, +s.dur) } : {}),  // durability (missing = new)
  ...(s.set ? { set: s.set } : {}),       // mineral set id (see SETS)
  ...(s.temper ? { temper: s.temper | 0 } : {})   // times tempered with minerals (max 3)
});

export class Bag {
  constructor() {
    this.slots = [];
    this.equip = Object.fromEntries(SLOTS.map((s) => [s, null]));
    this.onChange = null;     // (equipChanged) — to refresh the look and stats
    this.onEquip = null;      // (item, on) — equipped (true) or unequipped (false); for the bottom tray log
  }

  changed(equipChanged = false) {
    if (this.onChange) this.onChange(equipChanged);
  }

  count(id) {
    return this.slots.filter((s) => s.id === id).reduce((n, s) => n + s.qty, 0);
  }

  has(id) {
    return this.count(id) > 0;
  }

  maxStack(item) {
    return item.type === "equip" ? STACK_MAX.equip : STACK_MAX.other;
  }

  // Adds an item (id or instance), stacking onto an identical one; false when the bag is full
  add(idOrInst, qty = 1) {
    const inst = typeof idOrInst === "string" ? { id: idOrInst, qty } : { ...idOrInst, qty: idOrInst.qty || qty };
    const item = describe(inst);
    if (!item) return false;
    const max = this.maxStack(item);
    const sig = signature(inst);
    let left = inst.qty || 1;
    // 1) fill identical stacks first
    const now = Date.now();
    this.slots.forEach((s) => {
      if (left > 0 && signature(s) === sig && s.qty < max) {
        const n = Math.min(left, max - s.qty);
        s.qty += n;
        s.at = now;
        left -= n;
      }
    });
    // 2) new slots for the rest
    while (left > 0) {
      if (this.slots.length >= BAG_SIZE) { this.changed(); return false; }
      const n = Math.min(left, max);
      this.slots.push(clean({ ...inst, qty: n, at: inst.at || now }));
      left -= n;
    }
    this.changed();
    return true;
  }

  // Sort & Stack: merge identical items and order by type, slot and grade
  compact() {
    const all = this.slots;
    this.slots = [];
    all.forEach((s) => {
      const item = describe(s);
      const max = this.maxStack(item);
      let left = s.qty;
      this.slots.forEach((t) => {
        if (left > 0 && signature(t) === signature(s) && t.qty < max) { const n = Math.min(left, max - t.qty); t.qty += n; t.at = Math.max(t.at || 0, s.at || 0); left -= n; }
      });
      if (left > 0) this.slots.push({ ...s, qty: left });
    });
    this.slots.sort((a, b) => {
      const A = describe(a), Bi = describe(b);
      return (TYPE_ORDER[A.type] - TYPE_ORDER[Bi.type]) || String(A.slot || "").localeCompare(String(Bi.slot || "")) ||
        (Bi.grade || 0) - (A.grade || 0) || A.name.localeCompare(Bi.name);
    });
    this.changed();
  }

  // Split one off a stack (to refine a single piece)
  splitOne(i) {
    const s = this.slots[i];
    if (!s || s.qty <= 1) return s || null;
    if (this.slots.length >= BAG_SIZE) return null;
    s.qty--;
    const one = { ...s, qty: 1, cards: [...(s.cards || [])], affixes: [...(s.affixes || [])] };
    this.slots.push(one);
    return one;
  }

  take(id, qty = 1) {
    if (this.count(id) < qty) return false;
    for (let i = this.slots.length - 1; i >= 0 && qty > 0; i--) {
      const s = this.slots[i];
      if (s.id !== id) continue;
      const n = Math.min(qty, s.qty);
      s.qty -= n;
      qty -= n;
      if (s.qty <= 0) this.slots.splice(i, 1);
    }
    this.changed();
    return true;
  }

  removeAt(i, qty = 1) {
    const s = this.slots[i];
    if (!s) return;
    s.qty -= qty;
    if (s.qty <= 0) this.slots.splice(i, 1);
    this.changed();
  }

  itemAt(i) {
    return describe(this.slots[i]);
  }

  equippedItem(slot) {
    return describe(this.equip[slot]);
  }

  // A worn 2H weapon locks the off-hand (LORE Act V)
  offhandLocked() {
    const w = this.equippedItem("weapon");
    return Boolean(w && w.hands === 2);
  }

  // Equip from the bag. Returns "" (ok) or the reason it failed. level = the hero's level (crafted sets)
  equipFrom(i, cls, level = Infinity) {
    const s = this.slots[i];
    const item = describe(s);
    if (!item || item.type !== "equip") return "type";
    if (!canEquip(item, cls)) return "class";
    if (level < (item.reqLevel || 0)) return "level";
    if (item.slot === "offhand" && this.offhandLocked()) return "locked";
    const options = slotsFor(item);
    const slot = options.find((o) => !this.equip[o]) || options[0];

    // Only one is taken from the stack
    if (s.qty > 1) s.qty--;
    else this.slots.splice(i, 1);
    const prev = this.equip[slot];
    this.equip[slot] = { ...s, qty: 1 };
    if (prev) this.add({ ...prev, qty: 1 });
    if (slot === "weapon" && item.hands === 2 && this.equip.offhand) {
      this.add({ ...this.equip.offhand, qty: 1 });
      this.equip.offhand = null;
    }
    this.changed(true);
    if (this.onEquip) this.onEquip(item, true);
    return "";
  }

  unequip(slot) {
    const e = this.equip[slot];
    if (!e) return false;
    if (!this.add({ ...e, qty: 1 })) return false;      // stacks onto an identical one if there is one
    this.equip[slot] = null;
    this.changed(true);
    if (this.onEquip) this.onEquip(describe(e), false);
    return true;
  }

  // Total bonus of worn gear (including STR/AGI/… from affixes and cards)
  stats() {
    const out = { atk: 0, def: 0, hp: 0, spd: 0, crit: 0, cdr: 0, aspd: 0, str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 };
    SLOTS.forEach((slot) => {
      const it = this.equippedItem(slot);
      if (!it || isBroken(this.equip[slot])) return;
      Object.entries(it.stats).forEach(([k, v]) => { out[k] = +((out[k] || 0) + v).toFixed(2); });
    });
    // set bonuses (2 / 4 / 5 or 2 / 4 / 6 pieces; broken pieces don't count)
    Object.entries(this.setCounts()).forEach(([id, n]) => {
      setThresholds(SETS[id]).filter((k) => n >= k).forEach((k) => {
        Object.entries(SETS[id].bonus[k]).forEach(([s, v]) => { out[s] = +((out[s] || 0) + v).toFixed(2); });
      });
    });
    return out;
  }

  // Skill boosts of worn crafted sets (4 and 6 pieces): { dmg, kcd, lcd, heal, ... } (see js/items/craftsets.js)
  skillBoost() {
    const out = {};
    Object.entries(this.setCounts()).forEach(([id, n]) => {
      Object.entries(SETS[id].skill || {}).forEach(([k, boost]) => {
        if (n >= +k) Object.entries(boost).forEach(([s, v]) => { out[s] = (out[s] || 0) + v; });
      });
    });
    return out;
  }

  // How many working pieces of each set are worn: { ember: 3, str10: 4, ... }
  setCounts() {
    const n = {};
    SLOTS.forEach((slot) => {
      const inst = this.equip[slot];
      if (inst && inst.set && SETS[inst.set] && !isBroken(inst)) n[inst.set] = (n[inst.set] || 0) + 1;
    });
    return n;
  }

  // Avatar parts from worn gear (weapon/offhand)
  look() {
    const look = {};
    ["weapon", "offhand"].forEach((slot) => {
      const it = this.equippedItem(slot);
      if (it && it.look) Object.assign(look, it.look);
    });
    if (!this.equip.weapon) look.weapon = "none";
    return look;
  }

  // ---------- CARD (Ragnarok) ----------
  // Insert a card (at bag index i) into the worn item in the slot
  insertCard(i, slot) {
    const card = this.slots[i];
    const target = this.equip[slot];
    if (!card || !String(card.id).startsWith("card:") || !target) return false;
    if ((target.cards || []).length >= (target.sockets || 0)) return false;
    target.cards = [...(target.cards || []), card.id];
    this.removeAt(i, 1);
    this.changed(true);
    return true;
  }

  // Worn items with a free socket
  openSockets() {
    return SLOTS.filter((s) => this.equip[s] && (this.equip[s].cards || []).length < (this.equip[s].sockets || 0));
  }

  // Use the consumable at index i
  use(i, player, fx) {
    const item = this.itemAt(i);
    if (!item || !item.effect) return "";
    // Scroll of Callings: opens the job change (main.js sets onJobScroll); not used up
    if (item.effect.jobScroll) { if (this.onJobScroll) this.onJobScroll(); return ""; }
    if (item.type !== "consume") return "";
    const e = item.effect;
    const pop = (text, color) => { if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 10, player.y - 6, text, true, color); };
    if (e.cure && !(player.hasAnyDebuff && player.hasAnyDebuff())) { pop("NO BLIGHT", "#94a3b8"); return ""; }
    if (e.heal && !e.resetSkill && player.hp >= player.maxHp) { pop("HP FULL", "#94a3b8"); return ""; }
    // Every healing item shares one cooldown (2.5s), auto-potion included
    if (e.heal && player.potionCd > 0) { pop("WAIT", "#94a3b8"); return ""; }
    // Astraea's Leaf cannot refresh a skill while a boss is engaged
    if (e.resetSkill && player.bossFight && player.hp >= player.maxHp) { pop("STIFLED", "#a855f7"); return ""; }

    if (e.heal) { player.hp = Math.min(player.maxHp, player.hp + Math.max(e.heal, Math.round(player.maxHp * (e.healPct || 0)))); player.potionCd = POTION_CD; }
    if (e.resetSkill && !player.bossFight) player.skillCooldownTimer = 0;
    if (e.cure && player.cureAllDebuffs) player.cureAllDebuffs();
    if (e.stamina) { player.stamina = player.maxStamina; player.exhausted = false; }
    if (e.fresh) player.freshTimer = e.fresh;
    if (e.buff && player.buffs) player.buffs[e.buff] = Math.max(player.buffs[e.buff] || 0, e.time);
    if (e.respec && player.respec) player.respec();
    if (e.autoAttackMs) player.extendAutoAttack(e.autoAttackMs);
    if (e.meal) startMeal(player, e.meal);
    this.removeAt(i, 1);
    pop(item.name.toUpperCase(), item.color);
    return item.name;
  }

  useById(id, player, fx) {
    const i = this.slots.findIndex((s) => s.id === id);
    return i >= 0 ? this.use(i, player, fx) : "";
  }

  // ---------- REFINE (Ragnarok) ----------
  // split = split one piece off a stack (when it is really being refined)
  upgradeTarget(where, split = false) {
    if (where.slot) return this.equip[where.slot];
    const s = this.slots[where.index];
    return s && s.qty > 1 && split ? this.splitOne(where.index) : s || null;
  }

  canUpgrade(where, gold) {
    const t = this.upgradeTarget(where);
    const item = describe(t);
    if (!item || item.type !== "equip") return { ok: false, reason: "type" };
    if (item.plus >= MAX_PLUS) return { ok: false, reason: "max" };
    const cost = upgradeCost(item);
    if (this.count("monsterShard") < cost.shards) return { ok: false, reason: "shards", cost };
    if (this.count("voidCrystal") < cost.crystals) return { ok: false, reason: "crystals", cost };
    if (gold < cost.gold) return { ok: false, reason: "gold", cost };
    return { ok: true, cost, chance: refineChance(item.plus) };
  }

  // Returns { ok, success, reason, cost }. On failure the materials are lost but not the item.
  upgrade(where, player, rnd = Math.random) {
    const check = this.canUpgrade(where, player.gold);
    if (!check.ok) return check;
    const t = this.upgradeTarget(where, true);
    if (!t) return { ok: false, reason: "full" };
    this.take("monsterShard", check.cost.shards);
    if (check.cost.crystals) this.take("voidCrystal", check.cost.crystals);
    player.gold -= check.cost.gold;
    const success = rnd() < check.chance;
    if (success) t.plus = (t.plus || 0) + 1;
    this.changed(Boolean(where.slot));
    return { ...check, success };
  }

  // Each class's default gear (grade 0 = Novice, 1 = custom-forged at the Job Awakening)
  giveKit(cls, grade = 0) {
    const kit = CLASS_KIT[cls] || CLASS_KIT.novice;
    ["weapon", "offhand"].forEach((slot) => {
      const old = this.equip[slot];
      if (old && this.slots.length < BAG_SIZE) this.slots.push({ ...old, qty: 1 });
      this.equip[slot] = kit[slot] ? clean({ id: `${kit[slot]}@${grade}`, qty: 1, sockets: 1 }) : null;
    });
    kit.extra.forEach((base) => this.add({ id: `${base}@${grade}`, qty: 1, sockets: 1 }));
    if (!this.equip.armor) this.equip.armor = clean({ id: "tunic@0", qty: 1 });
    if (!this.equip.boots) this.equip.boots = clean({ id: "sandals@0", qty: 1 });
    this.changed(true);
  }

  serialize() {
    return { v: 2, slots: this.slots.map((s) => ({ ...s })), equip: { ...this.equip } };
  }

  load(data) {
    this.slots = [];
    this.equip = Object.fromEntries(SLOTS.map((s) => [s, null]));
    if (!data) return;
    // Old bag (v1): renamed items → replace with the new ids
    const RENAME = { dagger: "knife", buckler: "guard", gloves: "knuckle", wand: "rod", rosary: "mace", vestment: "robe", cap: "bandana", charm: "brooch" };
    const fix = (s) => {
      if (!s) return null;
      if (data.v !== 2) {
        const [base, g] = String(s.id).split("@");
        if (RENAME[base]) s = { ...s, id: `${RENAME[base]}${g !== undefined ? `@${g}` : ""}` };
      }
      return describe(s) ? clean(s) : null;
    };
    (data.slots || []).forEach((s) => { const c = fix(s); if (c && this.slots.length < BAG_SIZE) this.slots.push(c); });
    const eq = data.equip || {};
    if (eq.charm && !eq.amulet) eq.amulet = eq.charm;           // v1: charm → amulet
    SLOTS.forEach((slot) => { this.equip[slot] = fix(eq[slot]); });
    // merge identical items from an old save
    const loaded = this.slots;
    this.slots = [];
    const cb = this.onChange;
    this.onChange = null;
    loaded.forEach((s) => this.add(s));
    this.onChange = cb;
  }
}
