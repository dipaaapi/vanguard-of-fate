import { formatCoins, renderCoinWallet } from "./items/economy.js";
import { t, onLangChange } from "./i18n.js";
import { STATUS, STATUS_KEYS, statusName } from "./status.js";

// ==================== BOTTOM BAR HUD ====================
// The player's info (name, level, HP, EXP, gold), the quest objective,
// the field state (foes, loot, weather, zone) and the buttons (Quest, Pause)
// sit outside the game screen instead of on top of the game.
// The DOM is only touched when something changed (no layout thrash every frame).

const WEATHER_ICON = { STORM: "⛈️", RAIN: "🌧️", FOG: "🌫️", CLEAR: "☀️" };

export class HudBar {
  constructor({ onQuest, onPause } = {}) {
    const $ = (id) => document.getElementById(id);
    this.el = {
      name: $("hbName"), cls: $("hbClass"), level: $("hbLevel"),
      hp: $("hbHp"), hpTrail: $("hbHpTrail"), hpText: $("hbHpText"), xp: $("hbXp"), xpText: $("hbXpText"), gold: $("hbGold"),
      st: $("hbSt"), stBox: $("hbStBox"), status: $("hbStatus"),
      foesK: $("hbFoesK"), foes: $("hbFoes"), lootK: $("hbLootK"), loot: $("hbLoot"),
      weather: $("hbWeather"), zone: $("hbZone"),
      questBtn: $("hbQuestBtn"), pauseBtn: $("hbPauseBtn")
    };
    this.cache = {};
    this.paused = false;

    // Buttons don't take focus, so Space/Enter never double-trigger
    [this.el.questBtn, this.el.pauseBtn].forEach((b) => b && b.addEventListener("mousedown", (e) => e.preventDefault()));
    if (this.el.questBtn && onQuest) this.el.questBtn.addEventListener("click", () => onQuest());
    if (this.el.pauseBtn && onPause) this.el.pauseBtn.addEventListener("click", () => onPause());

    this.renderLabels();
    onLangChange(() => { this.cache = {}; this.renderLabels(); });
  }

  renderLabels() {
    const { foesK, lootK, questBtn } = this.el;
    if (foesK) foesK.textContent = t("hbFoes");
    if (lootK) lootK.textContent = t("hbLoot");
    if (questBtn) questBtn.innerHTML = `${t("hbQuests")} <kbd>Q</kbd>`;
    this.setPaused(this.paused, true);
  }

  setPaused(paused, force = false) {
    if (!force && paused === this.paused) return;
    this.paused = paused;
    const b = this.el.pauseBtn;
    if (!b) return;
    b.innerHTML = paused ? `▶ ${t("hbResume")} <kbd>P</kbd>` : `❚❚ ${t("hbPause")} <kbd>P</kbd>`;
    b.classList.toggle("on", paused);
  }

  set(key, el, value, prop = "textContent") {
    if (!el || this.cache[key] === value) return;
    this.cache[key] = value;
    if (prop === "width") el.style.width = value;
    else el[prop] = value;
  }

  update(s) {
    const p = s.player;
    if (!p) return;
    const e = this.el;
    // The member on the field: the hero, or a playable NPC switched in (head drawn by js/partyhud.js)
    const displayName = (p.activeName || p.heroName || p.heroData.name || "").toUpperCase();
    this.set("name", e.name, displayName);
    // A Novice's heroData.name is the hero's own name, so show the class instead; a recruit shows their role
    const cls = s.role || (p.heroData.id === "novice" ? "Novice" : p.heroData.name);
    this.set("cls", e.cls, s.difficulty ? `${cls} · ${s.difficulty}` : cls);   // Regression difficulty (above Easy)
    this.set("level", e.level, `LV.${p.level}`);

    const hpRatio = Math.max(0, Math.min(1, p.hp / p.maxHp));
    const hpW = `${(hpRatio * 100).toFixed(1)}%`;
    this.set("hp", e.hp, hpW, "width");
    this.set("hpTrail", e.hpTrail, hpW, "width");   // CSS delays the trail, so lost HP flashes white
    this.set("hpCls", e.hp, hpRatio > 0.5 ? "" : hpRatio > 0.25 ? "mid" : "low", "className");
    this.set("hpText", e.hpText, `${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`);
    // Stamina (sprint); flashes red when exhausted
    const stRatio = Math.max(0, Math.min(1, p.stamina / p.maxStamina));
    this.set("st", e.st, `${(stRatio * 100).toFixed(1)}%`, "width");
    this.set("stCls", e.stBox, p.exhausted ? "hb-meter st tired" : "hb-meter st", "className");
    // Active blights with the seconds left
    const active = STATUS_KEYS.filter((k) => p.debuffs[k] > 0);
    const sig = active.map((k) => `${k}${Math.ceil(p.debuffs[k] / 60)}`).join(",");
    if (e.status && this.cache.status !== sig) {
      this.cache.status = sig;
      e.status.innerHTML = "";
      active.forEach((k) => {
        const b = document.createElement("span");
        b.style.background = STATUS[k].color;
        b.textContent = `${STATUS[k].icon} ${statusName(k)} ${Math.ceil(p.debuffs[k] / 60)}s`;
        e.status.appendChild(b);
      });
    }
    const xpRatio = Math.max(0, Math.min(1, p.exp / p.expNext));
    this.set("xp", e.xp, `${(xpRatio * 100).toFixed(1)}%`, "width");
    this.set("xpText", e.xpText, `EXP ${(xpRatio * 100).toFixed(1)}%`);
    renderCoinWallet(e.gold, p.gold);

    this.set("foes", e.foes, String(s.foes));
    this.set("loot", e.loot, String(s.loot));
    // Time of day + weather (weather only in Aethelgard)
    const w = s.weather;
    this.set("weather", e.weather, `${s.time || ""}${w ? ` · ${WEATHER_ICON[w] || ""} ${w}` : ""}`);
    this.set("zone", e.zone, s.inSanctuary ? `🛡️ ${t("hbSanctuary")}` : `⚔️ ${t("hbOutlands")}`);
    this.set("zoneCls", e.zone, s.inSanctuary ? "hb-zone safe" : "hb-zone", "className");

    this.setPaused(Boolean(s.paused));
  }
}
