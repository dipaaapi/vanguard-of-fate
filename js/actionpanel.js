import { getLang, onLangChange } from "./i18n.js";
import { getItem } from "./items/itemdb.js";
import { iconURL } from "./items/icons.js";
import { SkillSlots, SLOT_KEYS, ABILITIES } from "./skillslots.js";

// ==================== HOTBAR (bottom tray) & OPTIONS (right panel) ====================
// Each button: icon + name + shortcut key.
//   Hotbar, above the adventure log:
//     Skills  (J, K, L, Space, E): press and hold = like holding the key (hold works).
//             Cooldown overlay, and "SAFE" inside a sanctuary. ✎ (P) opens the skill book:
//             drag a skill onto a slot (or one slot onto another) to rearrange J/K/L.
//     Quick slots 1–4, then Market (B, safe zones only) and Full Screen (F).
//   Options (Q, I, C, M, N, O, Esc, H) in the right panel: call the handler from main.js.
//   (Act lore is read through the lore panel's "Read more", so it has no button here.)
// The J/K/L names follow the player's class (LORE.md, Acts III–IV).

const SKILLS = {
  novice:  { J: ["🗡️", "Dagger Jab"],        K: ["🌀", "Dodge Roll"],            L: ["🪨", "Throw Stone"] },
  knight:  { J: ["🛡️", "Bastion Forcefield"], K: ["⚡", "Piercing Lance Charge"], L: ["🌙", "Brandish Spear"] },
  archer:  { J: ["🏹", "Quiver Shot"],        K: ["🦅", "Falcon Dive"],           L: ["🌧️", "Arrow Shower"] },
  priest:  { J: ["✚", "Priority Heal"],       K: ["👼", "Guardian Angels"],       L: ["🌟", "Holy Light"] },
  mage:    { J: ["☄️", "Meteor Fall"],        K: ["🌩️", "Thunderstorm"],          L: ["🧊", "Frost Diver"] },
  fighter: { J: ["🔵", "Force Sphere"],       K: ["🦶", "Flying Dropkick"],       L: ["💢", "Ki Explosion"] }
};

const TEXT = {
  en: {
    skills: "Skills", options: "Options", attack: "Attack", skill: "Skill", belt: "Quick slots", auto: "AUTO",
    sprint: "Sprint", talk: "Talk", quests: "Quests", inventory: "Inventory", character: "Character",
    pause: "Pause", resume: "Resume", menu: "Main Menu", map: "World Map", codex: "Codex", safe: "Safe zone", nobody: "No one nearby",
    settings: "Settings", market: "Market", full: "Full Screen", window: "Window", tools: "Shortcuts",
    edit: "Arrange skills", book: "Drag a skill onto J, K or L · drag slot to slot to swap · P to finish",
    marketShut: "Markets open in a safe zone"
  },
  fil: {
    skills: "Mga Skill", options: "Mga Opsyon", attack: "Atake", skill: "Skill", belt: "Mabilisang gamit", auto: "AUTO",
    sprint: "Takbo", talk: "Kausapin", quests: "Quest", inventory: "Imbentaryo", character: "Karakter",
    pause: "Pause", resume: "Ituloy", menu: "Main Menu", map: "Mapa ng Mundo", codex: "Codex", safe: "Ligtas na lugar", nobody: "Walang malapit",
    settings: "Settings", market: "Palengke", full: "Full Screen", window: "Window", tools: "Shortcut",
    edit: "Ayusin ang skill", book: "I-drag ang skill sa J, K o L · i-drag ang slot sa slot para magpalit · P para matapos",
    marketShut: "Bukas ang palengke sa ligtas na lugar"
  }
};
const tx = (k) => (TEXT[getLang()] || TEXT.en)[k];

function keyLabel(code) {
  if (code === "Space") return "SPACE";
  if (code === "Escape") return "ESC";
  return code.replace("Key", "");
}

export class ActionPanel {
  // handlers: { quests(), inventory(), character(), map(), pause(), menu() }
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.skillsEl = document.getElementById("saSkills");
    this.optionsEl = document.getElementById("saOptions");
    this.skillsLabel = document.getElementById("saSkillsLabel");
    this.optionsLabel = document.getElementById("saOptionsLabel");
    this.beltEl = document.getElementById("saBelt");
    this.beltLabel = document.getElementById("saBeltLabel");
    this.utilEl = document.getElementById("trayUtil");
    this.utilLabel = document.getElementById("trayUtilLabel");
    this.bookEl = document.getElementById("skillBook");
    this.editing = false;
    this.drag = null;
    this.cls = null;
    this.cache = {};
    this.buttons = {};
    this.build();
    onLangChange(() => { this.cls = null; this.build(); });
    SkillSlots.onChange(() => { this.cls = null; this.cache = {}; if (this.editing) this.renderBook(); });
    // Any element with data-skill="J|K|L" can be dragged onto a hotbar slot (the skill book's cards,
    // the slots themselves while arranging, and skill entries elsewhere that opt in)
    document.addEventListener("pointerdown", (e) => this.dragStart(e));
    window.addEventListener("pointermove", (e) => this.dragMove(e));
    window.addEventListener("pointerup", (e) => this.dragEnd(e));
    window.addEventListener("pointercancel", () => this.dragCancel());
  }

  // A button that mimics a key (keydown while held, keyup on release)
  holdButton(code) {
    const b = document.createElement("button");
    b.type = "button";
    b.tabIndex = -1;
    b.className = "sa-btn skill";
    b.innerHTML = `<span class="sa-cd"></span><span class="sa-icon"></span><span class="sa-name"></span><kbd>${keyLabel(code)}</kbd>`;
    let held = false;
    const send = (type) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true }));
    const down = (e) => {
      e.preventDefault();
      if (held || b.disabled || (this.editing && b.dataset.slot !== undefined)) return;
      held = true;
      b.classList.add("held");
      send("keydown");
    };
    const up = () => {
      if (!held) return;
      held = false;
      b.classList.remove("held");
      send("keyup");
    };
    b.addEventListener("pointerdown", down);
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, up));
    return b;
  }

  clickButton(id, code, fn) {
    const b = document.createElement("button");
    b.type = "button";
    b.tabIndex = -1;
    b.className = "sa-btn option";
    b.dataset.id = id;
    b.innerHTML = `<span class="sa-icon"></span><span class="sa-name"></span><kbd>${keyLabel(code)}</kbd>`;
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", () => fn && fn());
    return b;
  }

  build() {
    this.skillsLabel.textContent = tx("skills");
    this.optionsLabel.textContent = tx("options");
    this.skillsEl.innerHTML = "";
    this.optionsEl.innerHTML = "";

    // J/K/L are slots: each shows (and casts) the ability placed in it
    this.slotButtons = SLOT_KEYS.map((code, i) => {
      const b = this.holdButton(code);
      b.dataset.slot = String(i);
      return b;
    });
    [this.buttons.J, this.buttons.K, this.buttons.L] = this.slotButtons;
    this.buttons.Space = this.holdButton("Space");
    this.buttons.E = this.holdButton("KeyE");
    this.set(this.buttons.Space, "💨", tx("sprint"));
    this.set(this.buttons.E, "💬", tx("talk"));
    Object.values(this.buttons).forEach((b) => this.skillsEl.appendChild(b));
    // ✎ = arrange the skills (P)
    this.editBtn = this.clickButton("edit", "KeyP", () => this.setEditing(!this.editing));
    this.editBtn.classList.add("edit");
    this.set(this.editBtn, "✎", tx("edit"));
    this.skillsEl.appendChild(this.editBtn);

    const h = this.handlers;
    this.options = {
      quests: this.clickButton("quests", "KeyQ", h.quests),
      inventory: this.clickButton("inventory", "KeyI", h.inventory),
      character: this.clickButton("character", "KeyC", h.character),
      map: this.clickButton("map", "KeyM", h.map),
      codex: this.clickButton("codex", "KeyN", h.codex),
      settings: this.clickButton("settings", "KeyO", h.settings),
      pause: this.clickButton("pause", "Escape", h.pause),
      menu: this.clickButton("menu", "KeyH", h.menu)
    };

    this.set(this.options.quests, "❗", tx("quests"));
    this.set(this.options.inventory, "🎒", tx("inventory"));
    this.set(this.options.character, "📜", tx("character"));
    this.set(this.options.map, "🗺️", tx("map"));
    this.set(this.options.codex, "📖", tx("codex"));
    this.set(this.options.settings, "⚙️", tx("settings"));
    this.set(this.options.pause, "❚❚", tx("pause"));
    this.set(this.options.menu, "🏠", tx("menu"));
    Object.values(this.options).forEach((b) => this.optionsEl.appendChild(b));

    // Quick slots 1–4 (click or press the number)
    this.belt = [];
    if (this.beltEl) {
      this.beltEl.innerHTML = "";
      for (let i = 0; i < 4; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.tabIndex = -1;
        b.className = "sa-belt";
        b.innerHTML = `<kbd>${i + 1}</kbd><img alt=""><span class="n"></span>`;
        b.addEventListener("mousedown", (e) => e.preventDefault());
        b.addEventListener("click", () => h.quick && h.quick(i));
        this.beltEl.appendChild(b);
        this.belt.push(b);
      }
    }
    // Shortcuts on the tray: Market (B) and Full Screen (F)
    if (this.utilEl) {
      this.utilEl.innerHTML = "";
      this.utilLabel.textContent = tx("tools");
      this.util = {
        market: this.clickButton("market", "KeyB", h.market),
        full: this.clickButton("full", "KeyF", h.fullscreen)
      };
      this.set(this.util.market, "⚖️", tx("market"));
      this.set(this.util.full, "⛶", document.fullscreenElement ? tx("window") : tx("full"));
      Object.values(this.util).forEach((b) => this.utilEl.appendChild(b));
      if (!this.fsBound) {
        this.fsBound = true;
        document.addEventListener("fullscreenchange", () => this.set(this.util.full, "⛶", document.fullscreenElement ? tx("window") : tx("full")));
      }
    }
    if (this.editing) this.renderBook();
    this.cache = {};
  }

  // ---------- ARRANGING SKILLS (drag and drop) ----------
  setEditing(on) {
    this.editing = Boolean(on);
    this.dragCancel();
    this.skillsEl.classList.toggle("editing", this.editing);
    this.editBtn.classList.toggle("on", this.editing);
    if (this.bookEl) this.bookEl.classList.toggle("open", this.editing);
    this.slotButtons.forEach((b, i) => {
      if (this.editing) b.dataset.skill = SkillSlots.slots[i];
      else delete b.dataset.skill;
    });
    if (this.editing) this.renderBook();
  }

  // The skill book: every ability of the class as a draggable card
  renderBook() {
    if (!this.bookEl) return;
    this.slotButtons.forEach((b, i) => { if (this.editing) b.dataset.skill = SkillSlots.slots[i]; });
    const cls = this.player && SKILLS[this.player.heroData.id] ? this.player.heroData.id : "novice";
    this.bookEl.textContent = "";
    const hint = document.createElement("span");
    hint.className = "sb-hint";
    hint.textContent = tx("book");
    ABILITIES.forEach((a) => {
      const [icon, name] = SKILLS[cls][a];
      const card = document.createElement("span");
      card.className = "sb-card";
      card.dataset.skill = a;
      const ic = document.createElement("i");
      ic.textContent = icon;
      const nm = document.createElement("span");
      nm.textContent = name;
      const k = document.createElement("kbd");
      k.textContent = SLOT_KEYS[SkillSlots.slotOf(a)].replace("Key", "");
      card.append(ic, nm, k);
      this.bookEl.appendChild(card);
    });
    this.bookEl.appendChild(hint);
  }

  dragStart(e) {
    const src = e.target.closest && e.target.closest("[data-skill]");
    if (!src || !ABILITIES.includes(src.dataset.skill)) return;
    if (src.dataset.slot !== undefined && !this.editing) return;
    e.preventDefault();
    this.drag = { ability: src.dataset.skill, x: e.clientX, y: e.clientY, ghost: null, src };
  }

  dragMove(e) {
    const d = this.drag;
    if (!d) return;
    if (!d.ghost) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4) return;
      const cls = this.player && SKILLS[this.player.heroData.id] ? this.player.heroData.id : "novice";
      d.ghost = document.createElement("div");
      d.ghost.className = "sb-ghost";
      d.ghost.textContent = `${SKILLS[cls][d.ability][0]} ${SKILLS[cls][d.ability][1]}`;
      document.body.appendChild(d.ghost);
      d.src.classList.add("dragging");
    }
    d.ghost.style.left = `${e.clientX + 8}px`;
    d.ghost.style.top = `${e.clientY + 8}px`;
    const over = this.slotAt(e.clientX, e.clientY);
    this.slotButtons.forEach((b) => b.classList.toggle("drop", b === over));
  }

  dragEnd(e) {
    const d = this.drag;
    if (!d) return;
    const target = d.ghost ? this.slotAt(e.clientX, e.clientY) : null;
    this.dragCancel();
    if (target) {
      SkillSlots.assign(Number(target.dataset.slot), d.ability);
      if (this.handlers.slotsChanged) this.handlers.slotsChanged();
    }
  }

  dragCancel() {
    const d = this.drag;
    this.drag = null;
    if (d && d.ghost) d.ghost.remove();
    if (d && d.src) d.src.classList.remove("dragging");
    (this.slotButtons || []).forEach((b) => b.classList.remove("drop"));
  }

  slotAt(x, y) {
    const el = document.elementFromPoint(x, y);
    const b = el && el.closest && el.closest("[data-slot]");
    return b && this.slotButtons.includes(b) ? b : null;
  }

  set(btn, icon, name) {
    btn.querySelector(".sa-icon").textContent = icon;
    btn.querySelector(".sa-name").textContent = name;
    btn.title = name;
  }

  // Cooldown overlay: 0 = ready, 1 = just used
  setCooldown(btn, key, ratio) {
    const v = Math.max(0, Math.min(1, ratio || 0));
    const pct = `${Math.round(v * 100)}%`;
    if (this.cache[key] === pct) return;
    this.cache[key] = pct;
    btn.querySelector(".sa-cd").style.height = pct;
    btn.classList.toggle("cooling", v > 0);
  }

  toggle(btn, key, cls, on) {
    if (this.cache[key] === on) return;
    this.cache[key] = on;
    btn.classList.toggle(cls, on);
  }

  // s: { player, inSanctuary, paused, canTalk }
  update(s) {
    const p = s.player;
    if (!p) return;
    this.player = p;
    const cls = SKILLS[p.heroData.id] ? p.heroData.id : "novice";
    if (cls !== this.cls) {
      this.cls = cls;
      this.slotButtons.forEach((b, i) => {
        const [icon, name] = SKILLS[cls][SkillSlots.slots[i]];
        this.set(b, icon, name);
      });
      if (this.editing) this.renderBook();
    }

    const hd = p.heroData;
    const cd = {
      J: hd.attackCooldown ? p.attackCooldownTimer / hd.attackCooldown : 0,
      K: hd.cooldown ? p.skillCooldownTimer / hd.cooldown : 0,
      L: hd.cooldown2 ? p.skill2CooldownTimer / hd.cooldown2 : 0
    };
    this.slotButtons.forEach((b, i) => this.setCooldown(b, `cd${i}`, cd[SkillSlots.slots[i]]));
    if (this.util) {
      this.toggle(this.util.market, "marketOff", "off", !s.inSanctuary);
      this.util.market.title = s.inSanctuary ? tx("market") : tx("marketShut");
      this.toggle(this.util.market, "marketOn", "on", Boolean(s.marketOpen));
    }

    // J/K cannot be used inside a sanctuary
    const safe = Boolean(s.inSanctuary);
    this.toggle(this.buttons.J, "safeJ", "safe", safe);
    this.toggle(this.buttons.K, "safeK", "safe", safe);
    this.toggle(this.buttons.L, "safeL", "safe", safe);
    if (this.cache.safeTitle !== safe) {
      this.cache.safeTitle = safe;
      this.buttons.J.dataset.note = safe ? tx("safe") : "";
      this.buttons.K.dataset.note = safe ? tx("safe") : "";
      this.buttons.L.dataset.note = safe ? tx("safe") : "";
    }
    this.toggle(this.buttons.E, "talk", "ready", Boolean(s.canTalk));
    this.toggle(this.buttons.Space, "sprint", "ready", Boolean(s.sprinting));
    this.toggle(this.options.map, "map", "on", Boolean(s.mapOpen));
    this.toggle(this.options.inventory, "inv", "on", Boolean(s.inventoryOpen));
    this.toggle(this.options.character, "char", "on", Boolean(s.charOpen));
    this.toggle(this.options.settings, "set", "on", Boolean(s.settingsOpen));
    // Unspent stat/skill points
    this.toggle(this.options.character, "charAlert", "alert", Boolean(s.pointsAvailable));

    // Quick slot: icon and count of each item; "AUTO" when auto-potion is on
    if (this.belt.length && p.belt) {
      const sig = p.belt.map((id) => `${id}:${id ? p.bag.count(id) : 0}`).join("|") + (p.autoPot ? p.autoPot.hp : "");
      if (this.cache.belt !== sig) {
        this.cache.belt = sig;
        p.belt.forEach((id, i) => {
          const b = this.belt[i];
          const it = id && getItem(id);
          const n = id ? p.bag.count(id) : 0;
          b.querySelector("img").src = it ? iconURL(it) : "";
          b.querySelector("img").style.visibility = it ? "visible" : "hidden";
          b.querySelector(".n").textContent = it ? String(n) : "";
          b.classList.toggle("empty", !n);
          b.title = it ? it.name : "";
        });
        const a = p.autoPot || {};
        const on = [a.hp ? `HP<${a.hp}%` : "", a.cure ? "CURE" : "", a.stamina ? "ST" : ""].filter(Boolean).join(" ");
        this.beltLabel.innerHTML = "";
        this.beltLabel.append(tx("belt"));
        if (on) { const sp = document.createElement("span"); sp.className = "auto"; sp.textContent = `${tx("auto")} ${on}`; this.beltLabel.appendChild(sp); }
      }
    }

    if (this.cache.paused !== s.paused) {
      this.cache.paused = s.paused;
      this.set(this.options.pause, s.paused ? "▶" : "❚❚", s.paused ? tx("resume") : tx("pause"));
      this.options.pause.classList.toggle("on", Boolean(s.paused));
    }
  }
}
