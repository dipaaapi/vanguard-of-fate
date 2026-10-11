import { formatCoins, renderCoinWallet } from "./items/economy.js";
import { WEATHER_POWER } from "./world/weather.js";
import { t, getLang, onLangChange } from "./i18n.js";
import { STATUS, STATUS_KEYS, statusName } from "./status.js";

// ==================== BOTTOM BAR HUD ====================
// The player's info (name, level, HP, EXP, gold), the quest objective,
// the field state (foes, loot, weather, zone) and the buttons (Quest, Pause)
// sit outside the game screen instead of on top of the game.
// The DOM is only touched when something changed (no layout thrash every frame).

const WEATHER_ICON = { STORM: "ϟ", RAIN: "☂", FOG: "≋", CLEAR: "☀", OVERCAST: "☁", BLIZZARD: "❄", HEAT: "♨", GALE: "彡", SANDSTORM: "⟡", SPORES: "✺" };

export class HudBar {
  constructor({ onQuest, onPause } = {}) {
    const $ = (id) => document.getElementById(id);
    this.el = {
      name: $("hbName"), cls: $("hbClass"), level: $("hbLevel"),
      hp: $("hbHp"), hpTrail: $("hbHpTrail"), hpText: $("hbHpText"), xp: $("hbXp"), xpText: $("hbXpText"), gold: $("hbGold"), difficulty: $("hbDifficulty"), difficultyLabel: $("hbDifficultyLabel"),
      cash: $("hbCash"), st: $("hbSt"), stBox: $("hbStBox"), status: $("hbStatus"),
      foesK: $("hbFoesK"), foes: $("hbFoes"), lootK: $("hbLootK"), loot: $("hbLoot"),
      weather: $("hbWeather"), weatherIcon: $("hbWeatherIcon"), weatherName: $("hbWeatherName"), weatherEffect: $("hbWeatherEffect"), infected: $("hbInfected"), infectedK: $("hbInfectedK"), zone: $("hbZone"),
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
    if(this.el.infectedK)this.el.infectedK.textContent=t("hbInfected");
    if (questBtn) questBtn.innerHTML = `${t("hbQuests")} <kbd>Q</kbd>`;
    this.setPaused(this.paused, true);
  }

  setPaused(paused, force = false) {
    if (!force && paused === this.paused) return;
    this.paused = paused;
    const b = this.el.pauseBtn;
    if (!b) return;
    b.innerHTML = paused ? `▶ ${t("hbResume")} <kbd>Backspace</kbd>` : `❚❚ ${t("hbPause")} <kbd>Backspace</kbd>`;
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
    this.set("cls", e.cls, cls);
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
    this.set("cash", e.cash, `₱${(p.premium?.cash || 0).toLocaleString("en-PH", { maximumFractionDigits: 2 })}`);
    // Current difficulty mode (Easy → Mythical), at the end of the wallet; re-added when the wallet rebuilds
    const diff = e.difficulty;
    e.difficultyLabel.textContent = t("difficultyLabel");
    const dk = `${s.difficultyId}|${s.difficulty}`;
    if (diff.dataset.k !== dk) {
      diff.dataset.k = dk;
      diff.className = `hb-difficulty diff-${s.difficultyId || "easy"}`;
      diff.textContent = s.difficulty || "";
      diff.title = s.difficulty || "";
    }

    this.set("foes", e.foes, String(s.foes));
    this.set("loot", e.loot, String(s.loot));
    const w = WEATHER_POWER[s.weather] ? s.weather : "CLEAR", power=WEATHER_POWER[w];
    const field=e.zone.closest(".hb-field");
    field.dataset.zone=s.inSanctuary?"safe":"wild";
    if(this.cache.weatherType!==w){field.dataset.weather=w.toLowerCase();field.style.setProperty("--weather-color",power.color);this.cache.weatherType=w;}
    this.set("weather",e.weather,s.time||"");
    this.set("weatherIcon",e.weatherIcon,WEATHER_ICON[w]);
    this.set("weatherName",e.weatherName,power[getLang()==="fil"?"fil":"en"]);
    this.set("weatherTitle",e.weatherName,s.weatherPower||"","title");
    this.set("infected",e.infected,String(s.infected||0));
    this.set("infectedTitle",e.infected,t("hbInfectedHint"),"title");
    this.set("weatherEffect",e.weatherEffect,s.weatherPower||"");
    this.set("zone", e.zone, s.inSanctuary ? `🛡️ ${t("hbSanctuary")}` : `⚔️ ${t("hbOutlands")}`);
    this.set("zoneCls", e.zone, s.inSanctuary ? "hb-zone safe" : "hb-zone", "className");

    this.setPaused(Boolean(s.paused));
  }
}
