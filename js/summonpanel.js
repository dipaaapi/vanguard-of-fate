import { getLang } from "./i18n.js";
import { describe } from "./items/itemdb.js";
import { summonCfg, ATTACK_MODES, RANGES, SPEND, EVERY, STOCK_ITEMS, STOCK_MAX } from "./summons/summoncfg.js";

// ==================== SUMMON PANEL (F6 · Options → Summon) ====================
// One place to set what the hero's summons do on their own: Auto Attack (free: aggressive / defensive /
// passive and its range), and the premium Auto Defend, Auto Loot, Auto Sell and Auto Buy (on/off plus
// their rules). Skills not yet owned show a link to the Premium Shop. Styled by css/premium.css + css/summon.css.
// deps = { onChange(), openShop(), onClose() }

const WORDS = {
  title: ["SUMMON COMMAND", "UTOS SA SUMMON"], eyebrow: ["VANGUARD OF FATE · COMPANIONS", "VANGUARD OF FATE · MGA KASAMA"],
  intro: ["Choose how your summons fight and run errands for you. Settings are saved and kept through Regression.", "Piliin kung paano lumaban at mag-utos ang iyong mga summon. Naise-save ang mga setting at nananatili sa Regression."],
  noSummon: ["No summon is with you right now: errands and attacks start once one is.", "Wala kang kasamang summon ngayon: magsisimula ang mga utos kapag mayroon na."],
  autoAttack: ["Auto Attack", "Kusang Atake"], autoDefend: ["Auto Defend", "Kusang Depensa"], autoLoot: ["Auto Loot", "Kusang Loot"],
  autoSell: ["Auto Sell", "Kusang Benta"], autoBuy: ["Auto Buy", "Kusang Bili"],
  attackHint: ["Free for every summon. How eagerly they go after foes.", "Libre sa bawat summon. Gaano kasabik silang humabol ng kalaban."],
  defendHint: ["Your summon shields you when a foe attacks, even with adventure mode off.", "Ipinagtatanggol ka ng summon kapag may umatake, kahit patay ang adventure mode."],
  lootHint: ["Your summon gathers drops around you.", "Pinupulot ng summon ang mga nahulog sa paligid mo."],
  sellHint: ["Your summon sells spare gear. Refined, socketed, set and unique gear is always kept.", "Ibinebenta ng summon ang sobrang gamit. Laging itinatabi ang may refine, socket, set at unique."],
  buyHint: ["Your summon keeps these potions stocked.", "Pinapanatili ng summon ang mga potion na ito."],
  aggressive: ["Aggressive", "Agresibo"], defensive: ["Defensive", "Depensibo"], passive: ["Passive", "Pasibo"],
  range: ["Range", "Abot"], on: ["ON", "BUKAS"], off: ["OFF", "SARADO"], locked: ["Get it in the Premium Shop (F4)", "Kunin sa Premium Shop (F4)"],
  normal: ["Sell plain gear", "Ibenta ang karaniwang gamit"], magic: ["Sell magic gear", "Ibenta ang magic na gamit"],
  magicWhenFull: ["Magic gear only when the bag is nearly full", "Magic lamang kapag halos puno ang bag"], onlyWhenFull: ["Wait until the bag is nearly full", "Hintaying halos mapuno ang bag"],
  spend: ["Spend at most", "Gumastos nang hanggang"], ofGold: ["of your gold per errand", "ng iyong ginto bawat lakad"],
  every: ["Errand every", "Lakad tuwing"], seconds: ["s", "s"], close: ["F6 / Backspace · Close", "F6 / Backspace · Isara"]
};
const tx = (k) => (WORDS[k] || [k, k])[getLang() === "fil" ? 1 : 0];
function el(tag, parent, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; parent?.appendChild(n); return n; }
const button = (parent, label, fn, cls = "") => { const b = el("button", parent, cls, label); b.type = "button"; b.onclick = fn; return b; };

export class SummonPanel {
  constructor(root, deps) {
    this.root = root; this.deps = deps; this.open = false;
    this.panel = el("div", root, "premium-modal summon-modal"); this.panel.hidden = true;
    this.panel.setAttribute("role", "dialog"); this.panel.setAttribute("aria-modal", "true");
    this.panel.addEventListener("click", (e) => { if (e.target === this.panel) this.close(); });
  }
  show(player, hasSummon = true) { this.player = player; this.hasSummon = hasSummon; this.open = true; this.panel.hidden = false; this.render(); }
  close() { this.open = false; this.panel.hidden = true; this.deps.onClose?.(); }
  toggle(player, hasSummon) { if (this.open) this.close(); else this.show(player, hasSummon); }
  handleInput(e) { if (e.code === "Backspace" || e.code === "F6" || e.code === "Escape") { e.preventDefault(); this.close(); } }
  changed() { this.deps.onChange?.(); this.render(); }

  render() {
    const p = this.player; if (!p || !p.premium) return;
    const s = p.premium, c = summonCfg(p);
    this.panel.replaceChildren();
    const box = el("div", this.panel, "premium-box summon-box");
    const header = el("header", box, "premium-header");
    const brand = el("div", header, "premium-brand");
    el("span", brand, "premium-eyebrow", tx("eyebrow")); el("h2", brand, "", tx("title"));
    button(header, "✕", () => this.close()).setAttribute("aria-label", tx("close"));
    el("p", box, "premium-promise", tx("intro"));
    if (!this.hasSummon) el("p", box, "summon-warn", tx("noSummon"));
    const body = el("div", box, "premium-body summon-body");

    // Auto Attack (free)
    const atk = this.card(body, "⚔", "autoAttack", "attackHint");
    const modes = el("div", atk, "summon-choices");
    for (const m of ATTACK_MODES) this.choice(modes, tx(m), c.attack === m, () => { c.attack = m; this.changed(); });
    el("span", atk, "summon-label", tx("range"));
    const ranges = el("div", atk, "summon-choices");
    for (const r of RANGES) this.choice(ranges, `${r}`, c.range === r, () => { c.range = r; this.changed(); });

    // Premium skills
    this.card(body, "🛡", "autoDefend", "defendHint", true);
    this.card(body, "✧", "autoLoot", "lootHint", true);
    const sell = this.card(body, "⚖", "autoSell", "sellHint", true);
    if (s.skills.autoSell) for (const k of ["normal", "magic", "magicWhenFull", "onlyWhenFull"]) this.check(sell, tx(k), c.sell[k], (v) => { c.sell[k] = v; this.changed(); });
    const buy = this.card(body, "⚗", "autoBuy", "buyHint", true);
    if (s.skills.autoBuy) {
      for (const id of STOCK_ITEMS) {
        const row = el("div", buy, "summon-stock");
        const it = describe({ id, qty: 1 });
        el("span", row, "", it ? it.name : id);
        button(row, "−", () => { c.stock[id] = Math.max(0, c.stock[id] - 1); this.changed(); }, "summon-step");
        el("strong", row, "", String(c.stock[id]));
        button(row, "+", () => { c.stock[id] = Math.min(STOCK_MAX, c.stock[id] + 1); this.changed(); }, "summon-step");
      }
      el("span", buy, "summon-label", `${tx("spend")} … ${tx("ofGold")}`);
      const spend = el("div", buy, "summon-choices");
      for (const v of SPEND) this.choice(spend, `${Math.round(v * 100)}%`, c.spend === v, () => { c.spend = v; this.changed(); });
    }
    if (s.skills.autoSell || s.skills.autoBuy) {
      el("span", buy, "summon-label", tx("every"));
      const every = el("div", buy, "summon-choices");
      for (const v of EVERY) this.choice(every, `${v}${tx("seconds")}`, c.every === v, () => { c.every = v; this.changed(); });
    }
    el("p", box, "summon-foot", tx("close"));
  }

  card(body, glyph, key, hint, premium = false) {
    const s = this.player.premium;
    const card = el("section", body, `premium-card summon-card${premium && !s.skills[key] ? " locked" : ""}`);
    const head = el("div", card, "summon-head");
    el("span", head, "summon-glyph", glyph); el("h3", head, "", tx(key));
    el("p", card, "", tx(hint));
    if (premium) {
      if (s.skills[key]) {
        const on = s.enabled[key];
        button(card, on ? tx("on") : tx("off"), () => { s.enabled[key] = !s.enabled[key]; this.changed(); }, `summon-switch${on ? " on" : ""}`);
      } else button(card, tx("locked"), () => { this.close(); this.deps.openShop?.(); }, "summon-buy");
    }
    return card;
  }
  choice(parent, label, selected, fn) { const b = button(parent, label, fn, "summon-choice"); b.classList.toggle("selected", selected); b.setAttribute("aria-pressed", String(selected)); return b; }
  check(parent, label, value, fn) {
    const l = el("label", parent, "summon-check");
    const i = el("input", l); i.type = "checkbox"; i.checked = value; i.onchange = () => fn(i.checked);
    el("span", l, "", label);
  }
}
