import { PLAYABLES } from "./playables.js";
import { getLang } from "./i18n.js";
import { Keybinds } from "./keybinds.js";
import { memberName, partyText } from "./party.js";

// ==================== PARTY HUD (top-right of the game screen) ====================
// The hero card's portrait shows the head of whoever is on the field (js/hudbar.js sets the name);
// under the card, one row per party member: switch key, head, name and HP, the active one lit.
// Heads are drawn from each member's Avatar portrait (Avatar.drawPortrait) once, then cached.
// The DOM is only touched when something changed.

const PORTRAIT_W = 24, PORTRAIT_H = 22;   // Avatar.drawPortrait at 1:1 (head and shoulders)
const HEAD = 16;                          // party row head: the face cropped out of the portrait

const portraits = new Map();   // Avatar → 24×22 canvas
function portraitOf(avatar) {
  if (!avatar) return null;
  let c = portraits.get(avatar);
  if (!c) {
    c = document.createElement("canvas");
    c.width = PORTRAIT_W; c.height = PORTRAIT_H;
    avatar.drawPortrait(c.getContext("2d"), PORTRAIT_W, PORTRAIT_H);
    portraits.set(avatar, c);
  }
  return c;
}

export class PartyHud {
  constructor() {
    this.root = document.getElementById("partyHud");
    this.portrait = document.getElementById("hbPortrait");
    this.initial = document.getElementById("hbInitial");
    this.hero = document.getElementById("heroHud");
    if (this.portrait) { this.portrait.width = PORTRAIT_W; this.portrait.height = PORTRAIT_H; }
    this.rows = [];
    this.sig = "";
    this.cache = {};
    this.shownAvatar = null;
    Keybinds.onChange(() => { this.sig = ""; });
  }

  // Draw the head of the member on the field into the hero card
  drawPortrait(avatar) {
    if (!this.portrait || avatar === this.shownAvatar) return;
    this.shownAvatar = avatar;
    const ctx = this.portrait.getContext("2d");
    ctx.clearRect(0, 0, PORTRAIT_W, PORTRAIT_H);
    const src = portraitOf(avatar);
    if (src) ctx.drawImage(src, 0, 0);
    if (this.initial) this.initial.classList.toggle("has-face", Boolean(src));
  }

  build(party, player) {
    this.root.textContent = "";
    this.rows = party.members.map((id, i) => {
      const row = document.createElement("div");
      row.className = "pt-row";
      const key = document.createElement("kbd");
      key.className = "pt-key";
      key.textContent = Keybinds.label(`party${i + 1}`);
      const face = document.createElement("canvas");
      face.className = "pt-head";
      face.width = HEAD; face.height = HEAD - 1;
      const src = portraitOf(party.avatarOf(id, player));
      if (src) face.getContext("2d").drawImage(src, 4, 0, HEAD, HEAD - 1, 0, 0, HEAD, HEAD - 1);
      const info = document.createElement("div");
      info.className = "pt-info";
      const name = document.createElement("span");
      name.className = "pt-name";
      name.textContent = id === "hero" ? (player.heroName || partyText("hero")) : memberName(id);
      const bar = document.createElement("div");
      bar.className = "pt-bar";
      const fillEl = document.createElement("i");
      bar.appendChild(fillEl);
      info.append(name, bar);
      row.append(key, face, info);
      this.root.appendChild(row);
      return { id, row, fill: fillEl, name };
    });
  }

  update(party, player) {
    if (!this.root || !party || !player) return;
    this.drawPortrait(party.avatarOf(party.activeId, player));
    const show = party.size > 1;
    if (this.cache.show !== show) { this.cache.show = show; this.root.classList.toggle("on", show); }
    if (!show) return;
    // Sit just under the hero card (its height changes with status icons and the screen scale)
    if (this.hero && (this.tick = (this.tick || 0) + 1) % 30 === 1) {
      const top = `${this.hero.offsetTop + this.hero.offsetHeight + 2}px`;
      if (this.cache.top !== top) { this.cache.top = top; this.root.style.top = top; }
    }
    const sig = `${party.members.join(",")}|${player.heroName}|${getLang()}|${player.heroData.avatar ? player.heroData.id : ""}`;
    if (sig !== this.sig) { this.sig = sig; this.cache = { show }; this.tick = 0; this.build(party, player); }
    this.rows.forEach((r, i) => {
      const hp = party.hpOf(r.id, player), ratio = Math.max(0, Math.min(1, hp / player.maxHp));
      const w = `${(ratio * 100).toFixed(1)}%`;
      if (this.cache[`w${i}`] !== w) { this.cache[`w${i}`] = w; r.fill.style.width = w; }
      const cls = `pt-row${i === party.active ? " on" : ""}${hp <= 0 ? " down" : ""}${ratio > 0 && ratio <= 0.25 ? " low" : ""}${party.cooldown > 0 && i !== party.active ? " wait" : ""}`;
      if (this.cache[`c${i}`] !== cls) { this.cache[`c${i}`] = cls; r.row.className = cls; }
    });
  }
}

// Subtitle on the hero card for a playable NPC on the field ("Aethelgard royal envoy")
export function roleOf(id) {
  const d = PLAYABLES[id];
  return d ? (d.role[getLang()] || d.role.en) : "";
}
