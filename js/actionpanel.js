import { getLang, onLangChange } from "./i18n.js";
import { getItem } from "./items/itemdb.js";
import { iconURL } from "./items/icons.js";
import { SkillSlots, SLOT_KEYS, ABILITIES } from "./skillslots.js";
import { SLOT_KEYS as PATH_KEYS, SKILL_DRAG_TYPE, activeSkill, activeSkillsOf, assignSlot, activeCooldown } from "./skillpaths.js";
import { skillText } from "./skills.js";

// ==================== HOTBAR (bottom tray) & OPTIONS (right panel) ====================
// Each button: icon + name + shortcut key.
//   Skills  (J, K, L, Space, E): press and hold = like holding the key (hold works).
//   Path slots (T, Y, U): the path actives set in Character → Paths (js/skillpaths.js); empty slots are dimmed.
//                             Cooldown overlay, and "SAFE" inside a sanctuary.
//   Options (Q, I, C, M, N, G, Esc, H): call the handler from main.js (G = Workshop, safe zones only).
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
    pause: "Pause", resume: "Resume", menu: "Main Menu", map: "World Map", codex: "Codex", workshop: "Workshop", safe: "Safe zone", nobody: "No one nearby",
    settings: "Settings", market: "Market", full: "Full Screen", window: "Window", tools: "Shortcuts",
    edit: "Arrange skills", book: "Drag a skill onto J, K or L · drag slot to slot to swap · P to finish",
    marketShut: "Markets open in a safe zone"
  },
  fil: {
    skills: "Mga Skill", options: "Mga Opsyon", attack: "Atake", skill: "Skill", belt: "Mabilisang gamit", auto: "AUTO",
    sprint: "Takbo", talk: "Kausapin", quests: "Quest", inventory: "Imbentaryo", character: "Karakter",
    pause: "Pause", resume: "Ituloy", menu: "Main Menu", map: "Mapa ng Mundo", codex: "Codex", workshop: "Talyer", safe: "Ligtas na lugar", nobody: "Walang malapit",
    settings: "Settings", market: "Palengke", full: "Full Screen", window: "Window", tools: "Shortcut",
    edit: "Ayusin ang skill", book: "I-drag ang skill sa J, K o L · i-drag ang slot sa slot para magpalit · P para matapos",
    marketShut: "Bukas ang palengke sa ligtas na lugar"
  }
};
const tx = (k) => (TEXT[getLang()] || TEXT.en)[k];
const classOf = (p) => (p && SKILLS[p.heroData.id] ? p.heroData.id : "novice");

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
    // Slot group: { id, keys: [key codes], list(player) → [{ id, icon, name }], current(player) → [id | null]
    //   per key, assign(player, slot, id) → true when changed, cooldown(player, id) → 0..1 }
    this.groups = [{
      id: "class",
      keys: SLOT_KEYS,
      list: (p) => ABILITIES.map((a) => { const [icon, name] = SKILLS[classOf(p)][a]; return { id: a, icon, name }; }),
      current: () => SkillSlots.slots,
      assign: (p, i, id) => SkillSlots.assign(i, id),
      cooldown: (p, id) => {
        const hd = p.heroData;
        if (id === "J") return hd.attackCooldown ? p.attackCooldownTimer / hd.attackCooldown : 0;
        if (id === "K") return hd.cooldown ? p.skillCooldownTimer / hd.cooldown : 0;
        return hd.cooldown2 ? p.skill2CooldownTimer / hd.cooldown2 : 0;
      }
    }, {
      id: "path",
      keys: PATH_KEYS,
      dropType: SKILL_DRAG_TYPE,           // native drags from the Character panel's path nodes
      list: (p) => activeSkillsOf(p).map((sk) => ({ id: sk.id, icon: sk.icon, name: skillText(sk).name })),
      current: (p) => p.pathSlots || [],
      assign: (p, i, id) => assignSlot(p, i, id),
      cooldown: (p, id) => {
        const sk = activeSkill(id);
        return sk && p.activeCd ? (p.activeCd[id] || 0) / activeCooldown(p, sk) : 0;
      }
    }];
    this.cls = null;
    this.cache = {};
    this.buttons = {};
    this.build();
    onLangChange(() => { this.cls = null; this.build(); });
    SkillSlots.onChange(() => { this.cls = null; this.cache = {}; if (this.editing) this.renderBook(); });
    // Any element with data-skill="<id>" (and data-group="<group id>", default "class") can be dragged
    // onto a slot of its group: the skill book's cards, the slots themselves while arranging, and skill
    // entries elsewhere (e.g. the Character panel) that opt in
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

    // Skill slots, group by group: J/K/L (the class abilities) first, then any group added with
    // addSlotGroup. Each slot shows (and casts) the skill placed in it.
    this.groups.forEach((g) => {
      g.buttons = g.keys.map((code, i) => {
        const b = this.holdButton(code);
        b.dataset.slot = String(i);
        b.dataset.group = g.id;
        if (g.dropType) {
          b.addEventListener("dragover", (e) => { if (e.dataTransfer.types.includes(g.dropType)) e.preventDefault(); });
          b.addEventListener("drop", (e) => {
            e.preventDefault();
            if (this.player && g.assign(this.player, i, e.dataTransfer.getData(g.dropType))) {
              this.cls = null;
              if (this.editing) this.renderBook();
              if (this.handlers.slotsChanged) this.handlers.slotsChanged();
            }
          });
        }
        return b;
      });
    });
    [this.buttons.J, this.buttons.K, this.buttons.L] = this.groups[0].buttons;
    this.groups.slice(1).forEach((g) => g.buttons.forEach((b, i) => { this.buttons[`${g.id}${i}`] = b; }));
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
      workshop: this.clickButton("workshop", "KeyG", h.workshop),
      settings: this.clickButton("settings", "KeyO", h.settings),
      pause: this.clickButton("pause", "Escape", h.pause),
      menu: this.clickButton("menu", "KeyH", h.menu)
    };

    this.set(this.options.quests, "❗", tx("quests"));
    this.set(this.options.inventory, "🎒", tx("inventory"));
    this.set(this.options.character, "📜", tx("character"));
    this.set(this.options.map, "🗺️", tx("map"));
    this.set(this.options.codex, "📖", tx("codex"));
    this.set(this.options.workshop, "⚒️", tx("workshop"));
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

  // ---------- SLOT GROUPS ----------
  // More skills on the hotbar (e.g. the skill-path actives): their slots appear after J/K/L and their
  // skills in the skill book; drag and drop works within a group.
  addSlotGroup(group) {
    this.groups = this.groups.filter((g) => g.id !== group.id).concat(group);
    this.cls = null;
    this.build();
  }

  allSlots() { return this.groups.flatMap((g) => g.buttons || []); }
  groupOf(el) { return this.groups.find((g) => g.id === el.dataset.group); }

  // ---------- ARRANGING SKILLS (drag and drop) ----------
  setEditing(on) {
    this.editing = Boolean(on);
    this.dragCancel();
    this.skillsEl.classList.toggle("editing", this.editing);
    this.editBtn.classList.toggle("on", this.editing);
    if (this.bookEl) this.bookEl.classList.toggle("open", this.editing);
    this.markSlots();
    if (this.editing) this.renderBook();
  }

  // While arranging, a slot can be dragged as the skill it holds
  markSlots() {
    this.groups.forEach((g) => (g.buttons || []).forEach((b, i) => {
      const id = this.editing && this.player ? (g.current(this.player) || [])[i] : null;
      if (id) b.dataset.skill = id;
      else delete b.dataset.skill;
    }));
  }

  // The skill book: every skill of every group as a draggable card, with the key it sits on
  renderBook() {
    if (!this.bookEl || !this.player) return;
    this.markSlots();
    const p = this.player;
    this.bookEl.textContent = "";
    this.groups.forEach((g) => {
      const cur = g.current(p) || [];
      g.list(p).forEach((sk) => {
        const card = document.createElement("span");
        card.className = "sb-card";
        card.dataset.skill = sk.id;
        card.dataset.group = g.id;
        const ic = document.createElement("i");
        ic.textContent = sk.icon;
        const nm = document.createElement("span");
        nm.textContent = sk.name;
        card.append(ic, nm);
        const at = cur.indexOf(sk.id);
        if (at >= 0) {
          const k = document.createElement("kbd");
          k.textContent = keyLabel(g.keys[at]);
          card.appendChild(k);
        }
        this.bookEl.appendChild(card);
      });
    });
    const hint = document.createElement("span");
    hint.className = "sb-hint";
    hint.textContent = tx("book");
    this.bookEl.appendChild(hint);
  }

  dragStart(e) {
    const src = e.target.closest && e.target.closest("[data-skill]");
    if (!src || !this.player) return;
    if (src.dataset.slot !== undefined && !this.editing) return;
    const g = this.groups.find((x) => x.id === (src.dataset.group || "class"));
    const sk = g && g.list(this.player).find((x) => x.id === src.dataset.skill);
    if (!sk) return;
    e.preventDefault();
    this.drag = { group: g, skill: sk, x: e.clientX, y: e.clientY, ghost: null, src };
  }

  dragMove(e) {
    const d = this.drag;
    if (!d) return;
    if (!d.ghost) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4) return;
      d.ghost = document.createElement("div");
      d.ghost.className = "sb-ghost";
      d.ghost.textContent = `${d.skill.icon} ${d.skill.name}`;
      document.body.appendChild(d.ghost);
      d.src.classList.add("dragging");
    }
    d.ghost.style.left = `${e.clientX + 8}px`;
    d.ghost.style.top = `${e.clientY + 8}px`;
    const over = this.slotAt(e.clientX, e.clientY, d.group);
    this.allSlots().forEach((b) => b.classList.toggle("drop", b === over));
  }

  dragEnd(e) {
    const d = this.drag;
    if (!d) return;
    const target = d.ghost ? this.slotAt(e.clientX, e.clientY, d.group) : null;
    this.dragCancel();
    if (target && this.player && d.group.assign(this.player, Number(target.dataset.slot), d.skill.id)) {
      this.cls = null;
      if (this.editing) this.renderBook();
      if (this.handlers.slotsChanged) this.handlers.slotsChanged();
    }
  }

  dragCancel() {
    const d = this.drag;
    this.drag = null;
    if (d && d.ghost) d.ghost.remove();
    if (d && d.src) d.src.classList.remove("dragging");
    this.allSlots().forEach((b) => b.classList.remove("drop"));
  }

  // The slot under the pointer, only in the dragged skill's group
  slotAt(x, y, group) {
    const el = document.elementFromPoint(x, y);
    const b = el && el.closest && el.closest("[data-slot]");
    return b && group.buttons && group.buttons.includes(b) ? b : null;
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
    // Slot labels follow the class and what each slot holds; an empty slot is dimmed
    const sig = classOf(p) + "|" + this.groups.map((g) => (g.current(p) || []).join(",")).join("|");
    if (sig !== this.cls) {
      this.cls = sig;
      this.groups.forEach((g) => {
        const list = g.list(p), cur = g.current(p) || [];
        g.buttons.forEach((b, i) => {
          const sk = list.find((x) => x.id === cur[i]);
          this.set(b, sk ? sk.icon : "·", sk ? sk.name : "—");
          b.classList.toggle("empty", !sk);
        });
      });
      if (this.editing) this.renderBook();
    }
    this.groups.forEach((g) => {
      const cur = g.current(p) || [];
      g.buttons.forEach((b, i) => this.setCooldown(b, `cd${g.id}${i}`, cur[i] ? g.cooldown(p, cur[i]) : 0));
    });
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
    this.toggle(this.options.workshop, "workshop", "on", safe);     // the Workshop opens only in a safe zone
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
