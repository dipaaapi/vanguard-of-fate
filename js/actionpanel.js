import { getLang, onLangChange } from "./i18n.js";
import { getItem } from "./items/itemdb.js";
import { iconURL } from "./items/icons.js";

// ==================== SKILLS & OPTIONS (lower part of the right panel) ====================
// Each button: icon + name + shortcut key.
//   Skills  (J, K, L, Space, E): press and hold = like holding the key (hold works).
//                             Cooldown overlay, and "SAFE" inside a sanctuary.
//   Options (Q, I, C, M, N, B, Esc, H): call the handler from main.js (B = Workshop, safe zones only).
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
    pause: "Pause", resume: "Resume", menu: "Main Menu", map: "World Map", codex: "Codex", workshop: "Workshop", safe: "Safe zone", nobody: "No one nearby"
  },
  fil: {
    skills: "Mga Skill", options: "Mga Opsyon", attack: "Atake", skill: "Skill", belt: "Mabilisang gamit", auto: "AUTO",
    sprint: "Takbo", talk: "Kausapin", quests: "Quest", inventory: "Imbentaryo", character: "Karakter",
    pause: "Pause", resume: "Ituloy", menu: "Main Menu", map: "Mapa ng Mundo", codex: "Codex", workshop: "Talyer", safe: "Ligtas na lugar", nobody: "Walang malapit"
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
    this.cls = null;
    this.cache = {};
    this.buttons = {};
    this.build();
    onLangChange(() => { this.cls = null; this.build(); });
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
      if (held || b.disabled) return;
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

    this.buttons.J = this.holdButton("KeyJ");
    this.buttons.K = this.holdButton("KeyK");
    this.buttons.L = this.holdButton("KeyL");
    this.buttons.Space = this.holdButton("Space");
    this.buttons.E = this.holdButton("KeyE");
    this.set(this.buttons.Space, "💨", tx("sprint"));
    this.set(this.buttons.E, "💬", tx("talk"));
    Object.values(this.buttons).forEach((b) => this.skillsEl.appendChild(b));

    const h = this.handlers;
    this.options = {
      quests: this.clickButton("quests", "KeyQ", h.quests),
      inventory: this.clickButton("inventory", "KeyI", h.inventory),
      character: this.clickButton("character", "KeyC", h.character),
      map: this.clickButton("map", "KeyM", h.map),
      codex: this.clickButton("codex", "KeyN", h.codex),
      workshop: this.clickButton("workshop", "KeyB", h.workshop),
      pause: this.clickButton("pause", "Escape", h.pause),
      menu: this.clickButton("menu", "KeyH", h.menu)
    };

    this.set(this.options.quests, "❗", tx("quests"));
    this.set(this.options.inventory, "🎒", tx("inventory"));
    this.set(this.options.character, "📜", tx("character"));
    this.set(this.options.map, "🗺️", tx("map"));
    this.set(this.options.codex, "📖", tx("codex"));
    this.set(this.options.workshop, "⚒️", tx("workshop"));
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
    this.cache = {};
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
    const cls = SKILLS[p.heroData.id] ? p.heroData.id : "novice";
    if (cls !== this.cls) {
      this.cls = cls;
      const [ji, jn] = SKILLS[cls].J, [ki, kn] = SKILLS[cls].K, [li, ln] = SKILLS[cls].L;
      this.set(this.buttons.J, ji, jn);
      this.set(this.buttons.K, ki, kn);
      this.set(this.buttons.L, li, ln);
    }

    const hd = p.heroData;
    this.setCooldown(this.buttons.J, "cdJ", hd.attackCooldown ? p.attackCooldownTimer / hd.attackCooldown : 0);
    this.setCooldown(this.buttons.K, "cdK", hd.cooldown ? p.skillCooldownTimer / hd.cooldown : 0);
    this.setCooldown(this.buttons.L, "cdL", hd.cooldown2 ? p.skill2CooldownTimer / hd.cooldown2 : 0);

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
