// ==================== SKILL SLOTS (drag and drop on the bottom tray) ====================
// The hotbar has one slot per skill key (J, K, L). Each slot holds an ability; the class code reads
// abilities as the keys they were written for ("KeyJ" = first ability, …), so a key press is
// translated to the ability in that slot before it reaches the controller (logical()).
// The arrangement is saved with the hero (save payload: skillKeys).

export const SLOT_KEYS = ["KeyJ", "KeyK", "KeyL"];
export const ABILITIES = ["J", "K", "L"];

const listeners = [];

export const SkillSlots = {
  slots: [...ABILITIES],

  reset() { this.set([...ABILITIES]); },

  // Accepts a saved arrangement only when it is a full permutation of the known abilities
  load(saved) {
    const ok = Array.isArray(saved) && saved.length === ABILITIES.length &&
      ABILITIES.every((a) => saved.filter((s) => s === a).length === 1);
    this.set(ok ? [...saved] : [...ABILITIES]);
  },

  serialize() { return [...this.slots]; },

  // Physical key → the key code of the ability in that slot (other keys pass through)
  logical(code) {
    const i = SLOT_KEYS.indexOf(code);
    return i < 0 ? code : `Key${this.slots[i]}`;
  },

  // Slot index that holds an ability
  slotOf(ability) { return this.slots.indexOf(ability); },

  // Put an ability into a slot; the ability already there moves to where the dragged one was
  assign(slot, ability) {
    if (slot < 0 || slot >= this.slots.length || !ABILITIES.includes(ability)) return false;
    const next = [...this.slots];
    const from = next.indexOf(ability);
    if (from === slot) return false;
    if (from >= 0) next[from] = next[slot];
    next[slot] = ability;
    this.set(next);
    return true;
  },

  set(next) {
    this.slots = next;
    listeners.forEach((fn) => fn(this.slots));
  },

  onChange(fn) { listeners.push(fn); }
};
