import { t, onLangChange } from "./i18n.js";
import { STATUS, STATUS_KEYS, statusName } from "./status.js";

// ==================== BOTTOM BAR HUD ====================
// Ang impormasyon ng player (pangalan, level, HP, EXP, gold), ang layunin ng quest,
// ang estado ng field (kalaban, samsam, panahon, zone) at ang mga button (Quest, Pause)
// ay nasa ibaba na ng game screen, hindi na nakapatong sa laro.
// Binabago lang ang DOM kapag may nagbago (walang layout thrash bawat frame).

const WEATHER_ICON = { STORM: "⛈️", RAIN: "🌧️", FOG: "🌫️", CLEAR: "☀️" };

export class HudBar {
  constructor({ onQuest, onPause } = {}) {
    const $ = (id) => document.getElementById(id);
    this.el = {
      initial: $("hbInitial"), name: $("hbName"), cls: $("hbClass"), level: $("hbLevel"),
      hp: $("hbHp"), hpText: $("hbHpText"), xp: $("hbXp"), gold: $("hbGold"),
      st: $("hbSt"), stBox: $("hbStBox"), status: $("hbStatus"),
      foesK: $("hbFoesK"), foes: $("hbFoes"), lootK: $("hbLootK"), loot: $("hbLoot"),
      weather: $("hbWeather"), zone: $("hbZone"),
      questBtn: $("hbQuestBtn"), pauseBtn: $("hbPauseBtn")
    };
    this.cache = {};
    this.paused = false;

    // Hindi kinukuha ng button ang focus para hindi mag-double trigger ang Space/Enter
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
    const displayName = (p.heroName || p.heroData.name || "").toUpperCase();
    this.set("initial", e.initial, (displayName[0] || "?"));
    this.set("name", e.name, displayName);
    this.set("cls", e.cls, p.heroData.name);
    this.set("level", e.level, `LV.${p.level}`);

    const hpRatio = Math.max(0, Math.min(1, p.hp / p.maxHp));
    this.set("hp", e.hp, `${Math.round(hpRatio * 100)}%`, "width");
    this.set("hpCls", e.hp, hpRatio > 0.5 ? "" : hpRatio > 0.25 ? "mid" : "low", "className");
    this.set("hpText", e.hpText, `${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`);
    // Stamina (sprint); kumikislap na pula kapag pagod
    const stRatio = Math.max(0, Math.min(1, p.stamina / p.maxStamina));
    this.set("st", e.st, `${Math.round(stRatio * 100)}%`, "width");
    this.set("stCls", e.stBox, p.exhausted ? "hb-meter st tired" : "hb-meter st", "className");
    // Mga aktibong sumpa na may natitirang segundo
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
    this.set("xp", e.xp, `${Math.round(xpRatio * 100)}%`, "width");
    this.set("gold", e.gold, `🪙 ${p.gold}G`);

    this.set("foes", e.foes, String(s.foes));
    this.set("loot", e.loot, String(s.loot));
    // Oras ng araw + panahon (ang panahon ay sa Aethelgard lang)
    const w = s.weather;
    this.set("weather", e.weather, `${s.time || ""}${w ? ` · ${WEATHER_ICON[w] || ""} ${w}` : ""}`);
    this.set("zone", e.zone, s.inSanctuary ? `🛡️ ${t("hbSanctuary")}` : `⚔️ ${t("hbOutlands")}`);
    this.set("zoneCls", e.zone, s.inSanctuary ? "hb-zone safe" : "hb-zone", "className");

    this.setPaused(Boolean(s.paused));
  }
}
