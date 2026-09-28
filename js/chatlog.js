import { npcName } from "./dialogue.js";
import { getLang, onLangChange } from "./i18n.js";

// ==================== BOTTOM TRAY: TALAAN NG PAKIKIPAGSAPALARAN ====================
// Nasa ilalim ng screen ng laro (kapantay ng canvas). Itinatala rito ang bawat linya ng NPC,
// ang tama ng kalaban, ang napulot na loot at ang isinuot/hinubad na kagamitan; ang pinakabago ay
// nasa ibaba. Ang magkakasunod na kaparehong pangyayari (hal. 3 tama ng iisang lobo) ay pinagsasama
// sa isang linya para hindi bumaha ang talaan. Hanggang MAX na linya lang.

const MAX = 150;
const MERGE_MS = 2500;   // gaano katagal pinagsasama ang magkaparehong pangyayari

// Tatak sa kaliwa ng bawat uri ng pangyayari
const TAGS = { hit: "⚔", loot: "✦", equip: "⛨" };

export class ChatLog {
  constructor(root) {
    this.root = root;
    this.head = root.querySelector(".log-head");
    this.list = root.querySelector(".log-list");
    this.count = 0;
    this.last = null;        // huling linya na puwedeng pagsamahan
    this.renderHead();
    onLangChange(() => this.renderHead());
  }

  renderHead() {
    const fil = getLang() === "fil";
    this.head.innerHTML = `<b>${fil ? "TALAAN NG PAKIKIPAGSAPALARAN" : "ADVENTURE LOG"}</b><span>${fil ? "Mag-scroll para bumalik" : "Scroll to look back"}</span>`;
    if (!this.count) this.list.innerHTML = `<p class="log-empty">${fil ? "Wala pang naitala. Makipag-usap, lumaban at mamulot — lahat ay itatala rito." : "Nothing logged yet. Talk, fight and loot — it all shows up here."}</p>`;
  }

  // Linya ng NPC: id = sino ang nagsasalita (para sa pangalan)
  add(id, line, time = "") {
    if (!line) return;
    this.push("npc", npcName(id), line, time);
  }

  // Pangyayari sa laro. merge = { key, value, format(n, total) }: pinagsasama sa huling linya
  // kapag pareho ang key at kamakailan lang; kung wala, text ang ipinapakita.
  event(kind, text, time = "", merge = null, color = "") {
    const now = performance.now();
    const l = this.last;
    if (merge && l && l.key === merge.key && now - l.at < MERGE_MS && l.row === this.list.lastElementChild) {
      l.n++;
      l.total += merge.value || 0;
      l.at = now;
      l.textEl.textContent = merge.format(l.n, l.total);
      l.timeEl.textContent = time;
      return;
    }
    const row = this.push(kind, TAGS[kind] || "•", merge ? merge.format(1, merge.value || 0) : text, time, color);
    this.last = merge ? { key: merge.key, n: 1, total: merge.value || 0, at: now, row, textEl: row.lastChild, timeEl: row.firstChild } : null;
  }

  push(kind, tag, text, time, color = "") {
    if (!this.count) this.list.innerHTML = "";
    this.count++;
    const stick = this.list.scrollTop + this.list.clientHeight >= this.list.scrollHeight - 8;
    const row = document.createElement("p");
    row.className = `log-row log-${kind}`;
    const t = document.createElement("time");
    t.textContent = time;
    const who = document.createElement("b");
    who.textContent = tag;
    const body = document.createElement("span");
    body.textContent = text;
    if (color) body.style.color = color;
    row.append(t, who, body);
    this.list.appendChild(row);
    while (this.list.children.length > MAX) this.list.firstChild.remove();
    if (stick) this.list.scrollTop = this.list.scrollHeight;
    if (kind === "npc") this.last = null;
    return row;
  }

  clear() {
    this.count = 0;
    this.last = null;
    this.renderHead();
  }
}
