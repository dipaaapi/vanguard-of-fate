// ==================== DEVELOPER TOOLS (admin / developer panel) ====================
// Enabled with ?dev in the URL (or localStorage "vof_dev" = "1"); F9 or the DEV badge opens it.
// Three tabs:
//   SAVE     — read, validate, edit and apply the save; backups before every write; .json/.vof files
//   CHEATS   — level, gold, points, items, god mode, one-hit kills, travel, spawn monsters
//   BALANCE  — live hero numbers, session analytics (EXP/min, damage, deaths, potions) and a
//              monster table for the current area; export everything with the design notes
//
// It hooks the game from the outside (wrapping damage/kill/potion/hurt) so the game code stays clean.
// While the panel is open the game is paused and keys go to the panel, not the hero.

import { Player, expFor } from "./player.js";
import { Bag } from "./items/bag.js";
import { MONSTERS } from "./bestiary.js";
import { getItem, codexItems } from "./items/itemdb.js";
import { PLATFORMS } from "./world/platforms.js";

const SAVE_KEY = "vanguard_savegame";
const BACKUP_KEY = "vanguard_dev_backups";
const NOTES_KEY = "vanguard_dev_notes";
const MAX_BACKUPS = 8;
const HERO_IDS = ["novice", "knight", "mage", "priest", "archer", "fighter"];
const STAT_KEYS = ["str", "agi", "vit", "int", "dex", "luk"];

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }
};

export function devEnabled() {
  return new URLSearchParams(location.search).has("dev") || store.get("vof_dev") === "1";
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (n, d = 0) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }) : "—");

function download(name, text, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Save validation: errors block Apply, warnings only inform ----------
export function validateSave(data) {
  const errors = [], warnings = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) return { errors: ["The save must be a JSON object { … }"], warnings };
  if (!HERO_IDS.includes(data.heroId)) errors.push(`heroId must be one of: ${HERO_IDS.join(", ")}`);
  if (!Number.isInteger(data.level) || data.level < 1 || data.level > 999) errors.push("level must be a whole number from 1 to 999");
  if (data.gold !== undefined && (!Number.isFinite(data.gold) || data.gold < 0)) errors.push("gold must be 0 or more");
  if (data.hp !== undefined && (!Number.isFinite(data.hp) || data.hp < 0)) errors.push("hp must be 0 or more");
  ["statPoints", "skillPoints", "pathPoints", "exp"].forEach((k) => {
    if (data[k] !== undefined && (!Number.isFinite(data[k]) || data[k] < 0)) errors.push(`${k} must be 0 or more`);
  });
  if (data.stats) {
    STAT_KEYS.forEach((k) => {
      const v = data.stats[k];
      if (v !== undefined && (!Number.isInteger(v) || v < 1 || v > 99)) warnings.push(`stats.${k} = ${v} will be clamped to 1–99 on load`);
    });
  }
  if (data.platform && data.platform !== "hub" && !PLATFORMS[data.platform]) errors.push(`platform "${data.platform}" does not exist (use "hub" or ${Object.keys(PLATFORMS).join(", ")})`);
  if (data.bag !== undefined && (typeof data.bag !== "object" || data.bag === null)) errors.push("bag must be an object");
  if (data.belt !== undefined && !Array.isArray(data.belt)) errors.push("belt must be an array");
  if (data.level > 60) warnings.push("level is above the last Act's range (35–42 + boss 44); the game will be trivial");
  if (data.gold > 1e7) warnings.push("gold above 10,000,000 removes the economy entirely");
  return { errors, warnings };
}

export class DevTools {
  constructor(api) {
    this.api = api;            // { getPlayer, getStage, getState, enemyManager, quest, fx, controller, getSavePayload, saveGame, loadGame, travelTo }
    this.open = false;
    this.tab = "save";
    this.god = false;
    this.oneHit = false;
    this.resetSession();
    this.hook();
    this.build();
    this.tick = this.tick.bind(this);
    requestAnimationFrame(this.tick);
    // Another tab (or the game's autosave in another window) changed the save
    window.addEventListener("storage", (e) => {
      if (e.key === SAVE_KEY && this.open) this.status("⚠ The save was changed in another tab. Press “Read stored save” before applying.", "warn");
    });
  }

  resetSession() {
    this.s = {
      started: new Date().toISOString(), playMs: 0, kills: { normal: 0, champion: 0, elite: 0, mvp: 0 }, allyKills: 0,
      exp: 0, dealt: 0, hits: 0, bigHit: 0, taken: 0, hurts: 0, deaths: 0, potions: {}, levelUps: 0, killLog: []
    };
    this.lastHp = null;
  }

  // ---------- hooks (wrap, never replace, the game's own behaviour) ----------
  hook() {
    const dev = this;
    const em = this.api.enemyManager;

    const prevKill = em.onKill;
    em.onKill = (e, byPlayer, exp) => {
      if (prevKill) prevKill(e, byPlayer, exp);
      if (!byPlayer) { dev.s.allyKills++; return; }
      const tier = e.boss ? "mvp" : e.tier || "normal";
      dev.s.kills[tier] = (dev.s.kills[tier] || 0) + 1;
      dev.s.exp += exp || 0;
      dev.s.killLog.push({ t: Math.round(dev.s.playMs / 1000), key: e.key, level: e.level, tier, exp });
      if (dev.s.killLog.length > 500) dev.s.killLog.shift();
    };

    const origDamage = em.damage.bind(em);
    em.damage = (enemy, amount, angle, isCrit, fx, loot, push, stun, player, elem) => {
      if (!enemy || !enemy.isAlive) return origDamage(enemy, amount, angle, isCrit, fx, loot, push, stun, player, elem);
      if (dev.oneHit && player) enemy.hp = 1;
      const before = enemy.hp;
      const r = origDamage(enemy, amount, angle, isCrit, fx, loot, push, stun, player, elem);
      if (player && !dev.oneHit) {
        const dealt = Math.max(0, before - Math.max(0, enemy.hp));
        dev.s.dealt += dealt; dev.s.hits++; dev.s.bigHit = Math.max(dev.s.bigHit, dealt);
      }
      return r;
    };

    const origHurt = Player.prototype.takeDamage;
    Player.prototype.takeDamage = function (amount, fx, source) {
      if (dev.god) return;
      const before = this.hp;
      origHurt.call(this, amount, fx, source);
      const lost = before - this.hp;
      if (lost > 0) { dev.s.taken += lost; dev.s.hurts++; }
    };

    const origUse = Bag.prototype.use;
    Bag.prototype.use = function (i, player, fx) {
      const item = this.itemAt ? this.itemAt(i) : null;
      const used = origUse.call(this, i, player, fx);
      if (used && item) dev.s.potions[item.id || used] = (dev.s.potions[item.id || used] || 0) + 1;
      return used;
    };

    const origExp = Player.prototype.addExp;
    Player.prototype.addExp = function (amount) {
      const lv = this.level;
      origExp.call(this, amount);
      dev.s.levelUps += Math.max(0, this.level - lv);
    };
  }

  // ---------- DOM ----------
  build() {
    const badge = (this.badge = document.createElement("button"));
    badge.className = "dev-badge";
    badge.textContent = "DEV · F9";
    badge.title = "Developer tools (F9)";
    badge.addEventListener("click", () => this.toggle());
    document.body.appendChild(badge);

    const root = (this.root = document.createElement("aside"));
    root.className = "dev-panel";
    root.hidden = true;
    root.innerHTML = `
      <header class="dev-head">
        <strong>Developer Tools</strong>
        <span class="dev-sub">game paused while open</span>
        <button class="dev-x" data-act="close" title="Close (F9 / Backspace)">✕</button>
      </header>
      <nav class="dev-tabs">
        <button data-tab="save">Save</button><button data-tab="cheats">Cheats</button><button data-tab="balance">Balance</button>
      </nav>
      <div class="dev-status" role="status"></div>
      <section class="dev-body"></section>`;
    document.body.appendChild(root);
    this.body = root.querySelector(".dev-body");
    this.statusEl = root.querySelector(".dev-status");

    // Keys typed into the panel never reach the game
    ["keydown", "keyup"].forEach((t) => root.addEventListener(t, (e) => {
      if (e.code === "F9" || (e.code === "Backspace" && t === "keydown" && e.target.tagName !== "TEXTAREA")) return;
      e.stopPropagation();
    }));
    root.addEventListener("click", (e) => {
      const tab = e.target.closest("[data-tab]");
      if (tab) { this.tab = tab.dataset.tab; this.render(); return; }
      const act = e.target.closest("[data-act]");
      if (act) this.action(act.dataset.act, act);
    });
    root.addEventListener("change", (e) => {
      if (e.target.dataset.toggle) { this[e.target.dataset.toggle] = e.target.checked; this.status(`${e.target.dataset.toggle === "god" ? "God mode" : "One-hit kills"} ${e.target.checked ? "ON" : "off"}`); }
    });
    root.addEventListener("input", (e) => { if (e.target.id === "devNotes") store.set(NOTES_KEY, e.target.value); });

    // Item ids for the "give item" box
    const ci = codexItems();
    this.itemIds = [...ci.other, ...ci.equip, ...ci.uniques, ...ci.cards].filter(Boolean).map((d) => ({ id: d.id, name: d.name }));
  }

  // Returns true when the key was for the panel (main.js then ignores it)
  handleKey(e) {
    if (e.code === "F9") { e.preventDefault(); this.toggle(); return true; }
    if (!this.open) return false;
    if (e.code === "Backspace") { this.toggle(false); e.preventDefault(); }
    return true;
  }

  toggle(force) {
    this.open = force ?? !this.open;
    this.root.hidden = !this.open;
    this.badge.classList.toggle("on", this.open);
    if (this.api.controller && this.api.controller.clearAll) this.api.controller.clearAll();   // no stuck keys
    if (this.open) this.render();
  }

  status(msg, kind = "ok") {
    this.statusEl.textContent = msg;
    this.statusEl.dataset.kind = kind;
  }

  render() {
    this.root.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === this.tab));
    this.body.innerHTML = this.tab === "save" ? this.saveHtml() : this.tab === "cheats" ? this.cheatsHtml() : this.balanceHtml();
    if (this.tab === "save") {
      // Keep what is in the editor across redraws; only the first visit reads the save
      this.editor = this.body.querySelector("#devSave");
      this.editor.addEventListener("input", () => { this.editorText = this.editor.value; });
      if (this.editorText == null) this.loadEditor(this.api.getPlayer() && this.api.getState() !== "TITLE" ? "live" : "stored");
      else this.editor.value = this.editorText;
    }
  }

  // ---------- SAVE tab ----------
  saveHtml() {
    const backups = this.backups();
    return `
      <p class="dev-note">Edit the JSON, then <b>Apply</b>: it is checked, the current save is backed up, and the game reloads from it — so the running game and the saved file never disagree.</p>
      <div class="dev-row">
        <button data-act="readLive">Read live game</button>
        <button data-act="readStored">Read stored save</button>
        <button data-act="validate">Validate</button>
        <button data-act="apply" class="dev-primary">Apply &amp; reload</button>
      </div>
      <textarea id="devSave" class="dev-json" spellcheck="false"></textarea>
      <div class="dev-row">
        <button data-act="dlJson">Download .json</button>
        <button data-act="dlVof">Download .vof (signed)</button>
        <button data-act="openFile">Open .json / .vof…</button>
      </div>
      <h4>Backups <small>(made automatically before every Apply)</small></h4>
      <ul class="dev-list">${backups.length ? backups.map((b, i) => `
        <li><span>${esc(new Date(b.at).toLocaleString())} · Lv ${esc(b.data.level)} ${esc(b.data.heroId)} · ${esc(fmt(b.data.gold))}g <em>${esc(b.reason)}</em></span>
        <span><button data-act="peekBackup" data-i="${i}">View</button><button data-act="restoreBackup" data-i="${i}">Restore</button></span></li>`).join("") : "<li><span>No backups yet.</span></li>"}
      </ul>`;
  }

  loadEditor(which) {
    let data = null;
    if (which === "live") data = this.api.getSavePayload();
    if (!data) {
      const raw = store.get(SAVE_KEY);
      try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
      which = "stored";
    }
    this.editor.value = this.editorText = data ? JSON.stringify(data, null, 2) : "";
    this.status(data ? `Loaded the ${which === "live" ? "live game state" : "stored save"}.` : "No save found — start a game first.", data ? "ok" : "warn");
  }

  parseEditor() {
    try { return { data: JSON.parse(this.editor.value) }; } catch (err) { return { error: `JSON error: ${err.message}` }; }
  }

  backups() {
    try { return JSON.parse(store.get(BACKUP_KEY) || "[]"); } catch { return []; }
  }

  pushBackup(reason) {
    const raw = store.get(SAVE_KEY);
    if (!raw) return;
    let data; try { data = JSON.parse(raw); } catch { return; }
    const list = [{ at: Date.now(), reason, data }, ...this.backups()].slice(0, MAX_BACKUPS);
    store.set(BACKUP_KEY, JSON.stringify(list));
  }

  // Write a save and reload the game from it (the single path every edit takes)
  writeSave(data, reason) {
    const { errors, warnings } = validateSave(data);
    if (errors.length) { this.status(`Not applied — ${errors.length} error(s): ${errors.join(" · ")}`, "err"); return false; }
    this.pushBackup(reason);
    if (!store.set(SAVE_KEY, JSON.stringify(data))) { this.status("Could not write to browser storage.", "err"); return false; }
    const ok = this.api.loadGame();
    this.editorText = JSON.stringify(data, null, 2);
    this.status(ok ? `Applied and reloaded.${warnings.length ? " Warnings: " + warnings.join(" · ") : ""}` : "Saved, but the game could not load it — restore a backup.", ok ? (warnings.length ? "warn" : "ok") : "err");
    return ok;
  }

  openFile() {
    const input = Object.assign(document.createElement("input"), { type: "file", accept: ".json,.vof,.txt" });
    input.addEventListener("change", () => {
      const f = input.files[0];
      if (!f) return;
      f.text().then((text) => {
        text = text.trim();
        let data = null;
        if (text.startsWith("{")) {
          try { data = JSON.parse(text); } catch (err) { this.status(`File is not valid JSON: ${err.message}`, "err"); return; }
        } else if (window.SaveSecurity) {
          const r = window.SaveSecurity.importSecureSave(text);
          if (!r.success) { this.status(r.error, "err"); return; }
          data = r.data;
        }
        this.editorText = JSON.stringify(data, null, 2);
        this.tab = "save"; this.render();
        this.status(`Opened ${f.name}. Review it, then Apply.`);
      });
    });
    input.click();
  }

  // ---------- CHEATS tab ----------
  cheatsHtml() {
    const p = this.api.getPlayer();
    if (!p || this.api.getState() === "TITLE") return `<p class="dev-note">Start or continue a game to use cheats.</p>`;
    const stage = this.api.getStage();
    const places = ["hub", ...Object.keys(PLATFORMS)];
    const kinds = Object.keys(MONSTERS);
    return `
      <p class="dev-note">Cheats change the running game. They are saved the next time the game saves (pause, travel, or “Save now”).</p>
      <div class="dev-grid">
        <label>Level <input id="devLevel" type="number" min="1" max="999" value="${p.level}"></label><button data-act="setLevel">Set</button>
        <label>Gold <input id="devGold" type="number" min="0" value="${p.gold}"></label><button data-act="setGold">Set</button>
        <label>Stat points <input id="devStat" type="number" min="0" value="${p.statPoints}"></label><button data-act="setStat">Set</button>
        <label>Skill points <input id="devSkill" type="number" min="0" value="${p.skillPoints}"></label><button data-act="setSkill">Set</button>
        <label>Path points <input id="devPath" type="number" min="0" value="${p.pathPoints}"></label><button data-act="setPath">Set</button>
      </div>
      <div class="dev-row">
        <button data-act="heal">Full heal &amp; cure</button>
        <button data-act="killAll">Kill all monsters</button>
        <button data-act="saveNow" class="dev-primary">Save now</button>
      </div>
      <div class="dev-row">
        <label class="dev-check"><input type="checkbox" data-toggle="god" ${this.god ? "checked" : ""}> God mode (no damage)</label>
        <label class="dev-check"><input type="checkbox" data-toggle="oneHit" ${this.oneHit ? "checked" : ""}> One-hit kills</label>
      </div>
      <h4>Give item</h4>
      <div class="dev-row">
        <input id="devItem" list="devItems" placeholder="item id, e.g. elixir" class="dev-grow">
        <input id="devQty" type="number" min="1" value="1" class="dev-num">
        <button data-act="give">Give</button>
      </div>
      <datalist id="devItems">${this.itemIds.map((i) => `<option value="${esc(i.id)}">${esc(i.name)}</option>`).join("")}</datalist>
      <h4>Travel <small>(now: ${esc(stage.id)})</small></h4>
      <div class="dev-row">
        <select id="devPlace">${places.map((id) => `<option value="${id}" ${id === stage.id ? "selected" : ""}>${id === "hub" ? "Aethelgard (hub)" : `Act ${PLATFORMS[id].act} · ${id}`}</option>`).join("")}</select>
        <button data-act="travel">Go</button>
      </div>
      <h4>Spawn monster</h4>
      <div class="dev-row">
        <select id="devKind">${kinds.map((k) => `<option value="${k}">${esc(MONSTERS[k].name.en)}</option>`).join("")}</select>
        <select id="devTier"><option value="normal">Normal</option><option value="champion">Champion</option><option value="elite">Elite</option></select>
        <input id="devSpawnLv" type="number" min="1" placeholder="Lv (area)" class="dev-num">
        <button data-act="spawn">Spawn</button>
      </div>`;
  }

  // ---------- BALANCE tab ----------
  balanceHtml() {
    const p = this.api.getPlayer();
    const em = this.api.enemyManager;
    const s = this.s;
    const mins = Math.max(1 / 60, s.playMs / 60000);
    const kills = Object.values(s.kills).reduce((a, b) => a + b, 0);
    const avgHit = s.hits ? s.dealt / s.hits : NaN;
    const notes = esc(store.get(NOTES_KEY) || "");
    let hero = "<p class=\"dev-note\">Start a game to see live numbers.</p>", table = "";
    if (p && this.api.getState() !== "TITLE") {
      const mit = p.defense / (p.defense + 20 + 4 * p.level);
      const floor = em.levelFloor || 1, cap = em.levelCap || 8;
      hero = `
        <div class="dev-stats">
          ${[["Level", p.level], ["HP", `${fmt(p.hp)} / ${fmt(p.maxHp)}`], ["ATK", fmt(p.attack)], ["DEF", `${fmt(p.defense)} (−${fmt(mit * 100)}%)`],
             ["Crit", `${fmt(p.crit * 100)}%`], ["Atk speed", `+${fmt(p.aspd * 100)}%`], ["Area levels", `${floor}–${cap}`], ["EXP to next", fmt(p.expNext - p.exp)]]
            .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}
        </div>`;
      // Monster table for this area: how the fight looks at the bottom and top of the band
      const kinds = [...new Set(em.kinds || [])];
      const row = (k, lvl) => {
        const d = MONSTERS[k];
        if (!d) return "";
        const hp = Math.round((35 + lvl * 12) * d.hpMult);
        const dmg = Math.round(d.dmg + lvl * 1.6);
        const net = Math.max(1, Math.round(dmg * (1 - mit)));
        const diff = lvl - p.level;
        const exp = Math.round((25 + lvl * 8) * Math.max(0.25, Math.min(1.8, 1 + diff * 0.12)));
        return `<tr><td>${esc(d.name.en)}</td><td>${lvl}</td><td>${fmt(hp)}</td><td>${Number.isFinite(avgHit) ? Math.ceil(hp / avgHit) : "—"}</td><td>${fmt(net)}</td><td>${Math.ceil(p.hp / net)}</td><td>${fmt(exp)}</td><td>${Math.ceil((p.expNext - p.exp) / exp)}</td></tr>`;
      };
      table = `
        <h4>This area's monsters <small>(at the bottom and top of the ${floor}–${cap} band)</small></h4>
        <div class="dev-scroll"><table class="dev-table">
          <thead><tr><th>Monster</th><th>Lv</th><th>HP</th><th title="Your hits to kill it, from your average hit this session">Your hits</th><th title="Damage per hit after your DEF">Hits you for</th><th title="Its hits to kill you from your current HP">Hits to KO</th><th>EXP</th><th title="Kills to your next level">Kills/lv</th></tr></thead>
          <tbody>${kinds.map((k) => row(k, floor) + row(k, cap)).join("")}</tbody>
        </table></div>`;
    }
    return `
      ${hero}
      <h4>This session <small>(since ${esc(new Date(s.started).toLocaleTimeString())} · ${fmt(mins, 1)} min played)</small></h4>
      <div class="dev-stats">
        ${[["Kills", `${kills} (${s.kills.champion}★ ${s.kills.elite}✦ ${s.kills.mvp} MVP)`], ["Ally last-hits", s.allyKills], ["EXP / min", fmt(s.exp / mins)],
           ["Levels gained", s.levelUps], ["Avg hit", fmt(avgHit)], ["Biggest hit", fmt(s.bigHit)], ["Damage dealt / min", fmt(s.dealt / mins)],
           ["Damage taken / min", fmt(s.taken / mins)], ["Deaths", s.deaths], ["Items used", Object.entries(s.potions).map(([k, v]) => `${k}×${v}`).join(", ") || "none"]]
          .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}
      </div>
      ${table}
      <h4>Design notes <small>(kept in this browser, included in the export)</small></h4>
      <textarea id="devNotes" class="dev-notes" placeholder="Ideas, balance observations, bugs…">${notes}</textarea>
      <div class="dev-row">
        <button data-act="exportSession" class="dev-primary">Export session report (.json)</button>
        <button data-act="resetSession">Reset session</button>
      </div>`;
  }

  // ---------- actions ----------
  action(act, el) {
    const p = this.api.getPlayer();
    const em = this.api.enemyManager;
    const val = (id) => this.body.querySelector(`#${id}`).value;
    const num = (id) => Math.max(0, Math.floor(Number(val(id)) || 0));
    switch (act) {
      case "close": return this.toggle(false);
      case "readLive": return this.loadEditor("live");
      case "readStored": return this.loadEditor("stored");
      case "validate": {
        const r = this.parseEditor();
        if (r.error) return this.status(r.error, "err");
        const { errors, warnings } = validateSave(r.data);
        return this.status(errors.length ? `${errors.length} error(s): ${errors.join(" · ")}` : warnings.length ? `Valid, with warnings: ${warnings.join(" · ")}` : "Valid ✓", errors.length ? "err" : warnings.length ? "warn" : "ok");
      }
      case "apply": {
        const r = this.parseEditor();
        if (r.error) return this.status(r.error, "err");
        if (this.writeSave(r.data, "before manual edit")) this.render();
        return;
      }
      case "dlJson": {
        const r = this.parseEditor();
        if (r.error) return this.status(r.error, "err");
        return download(`vanguard_save_${r.data.name || r.data.heroId}_${Date.now()}.json`, JSON.stringify(r.data, null, 2));
      }
      case "dlVof": {
        const r = this.parseEditor();
        if (r.error) return this.status(r.error, "err");
        if (!window.SaveSecurity) return this.status("SaveSecurity is not loaded.", "err");
        return download(`vanguard_save_${r.data.name || r.data.heroId}_${Date.now()}.vof`, window.SaveSecurity.exportSecureSave(r.data), "text/plain");
      }
      case "openFile": return this.openFile();
      case "peekBackup": {
        const b = this.backups()[+el.dataset.i];
        this.editor.value = this.editorText = JSON.stringify(b.data, null, 2);
        return this.status("Backup shown in the editor (not applied). Press Apply to use it.");
      }
      case "restoreBackup": {
        const b = this.backups()[+el.dataset.i];
        if (this.writeSave(b.data, "before restoring a backup")) this.render();
        return;
      }
      case "setLevel": {
        const lv = Math.min(999, Math.max(1, num("devLevel")));
        p.level = lv; p.exp = 0; p.expNext = expFor(lv); p.recalc(); p.hp = p.maxHp;
        return this.status(`Level set to ${lv}.`);
      }
      case "setGold": p.gold = num("devGold"); return this.status(`Gold set to ${fmt(p.gold)}.`);
      case "setStat": p.statPoints = num("devStat"); return this.status(`Stat points: ${p.statPoints}.`);
      case "setPath": p.pathPoints = num("devPath"); return this.status(`Path points: ${p.pathPoints}.`);
      case "setSkill": p.skillPoints = num("devSkill"); return this.status(`Skill points: ${p.skillPoints}.`);
      case "heal": p.hp = p.maxHp; if (p.cureAllDebuffs) p.cureAllDebuffs(); p.stamina = p.maxStamina; return this.status("Healed and cured.");
      case "killAll": {
        const list = em.enemies.filter((e) => e.isAlive && !e.boss);
        list.forEach((e) => { e.lastHitBy = "player"; e.hp = 0; em.kill(e, this.api.fx); });
        return this.status(`Killed ${list.length} monster(s) (bosses spared).`);
      }
      case "saveNow": this.api.saveGame(); return this.status("Saved.");
      case "give": {
        const id = val("devItem").trim();
        const qty = Math.max(1, num("devQty"));
        const item = id && getItem(id);
        if (!item || !item.name) return this.status(`Unknown item id "${id}".`, "err");
        const added = p.bag.add(id, qty);
        return this.status(added === false ? "Bag is full." : `Gave ${qty} × ${item.name}.`, added === false ? "warn" : "ok");
      }
      case "travel": {
        this.api.travelTo(val("devPlace"));
        this.render();
        return this.status(`Travelled to ${val("devPlace")}.`);
      }
      case "spawn": {
        const lv = num("devSpawnLv") || null;
        const e = em.spawn(val("devKind"), p.level, p.x + 44, p.y, null, val("devTier"), lv);
        return this.status(e ? `Spawned Lv ${e.level} ${em.displayName(e)} beside you.` : "Could not spawn.", e ? "ok" : "err");
      }
      case "exportSession": {
        const report = { game: "Vanguard of Fate", exportedAt: new Date().toISOString(), session: this.s, notes: store.get(NOTES_KEY) || "",
          hero: p ? { level: p.level, maxHp: p.maxHp, attack: p.attack, defense: p.defense, crit: p.crit, place: this.api.getStage().id } : null };
        return download(`vanguard_session_${Date.now()}.json`, JSON.stringify(report, null, 2));
      }
      case "resetSession": this.resetSession(); this.render(); return this.status("Session counters reset.");
    }
  }

  // Counts play time and deaths; refreshes the Balance tab while it is open
  tick(now = performance.now()) {
    const p = this.api.getPlayer();
    const dt = Math.min(250, now - (this.lastNow || now));   // real time (not frames: monitors differ)
    this.lastNow = now;
    if (this.api.getState() === "PLAYING" && !this.open) this.s.playMs += dt;
    if (p) {
      if (this.lastHp > 0 && p.hp <= 0) this.s.deaths++;
      this.lastHp = p.hp;
    }
    if (this.open && this.tab === "balance" && (this.refresh = (this.refresh || 0) + 1) % 30 === 0) {
      const notes = this.body.querySelector("#devNotes");
      const typing = notes && document.activeElement === notes;
      if (!typing) { const y = this.body.scrollTop; this.render(); this.body.scrollTop = y; }
    }
    requestAnimationFrame(this.tick);
  }
}
