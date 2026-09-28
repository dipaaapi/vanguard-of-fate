import { npcName } from "./dialogue.js";
import { getLang, onLangChange } from "./i18n.js";

// ==================== BOTTOM TRAY: ADVENTURE LOG ====================
// Below the game screen (as wide as the canvas). Logs every NPC line,
// hits taken, loot picked up and gear equipped/unequipped; the newest is
// at the bottom. Repeated identical events (e.g. 3 hits from the same wolf) merge
// into one line so the log doesn't flood. At most MAX lines.

const MAX = 150;
const MERGE_MS = 2500;   // how long identical events keep merging

// Tag on the left for each kind of event
const TAGS = { hit: "⚔", loot: "✦", equip: "⛨", exp: "★", level: "▲", info: "·" };

export class ChatLog {
  constructor(root) {
    this.root = root;
    this.head = root.querySelector(".log-head");
    this.list = root.querySelector(".log-list");
    this.count = 0;
    this.last = null;        // last line that can still be merged into
    this.renderHead();
    onLangChange(() => this.renderHead());
  }

  renderHead() {
    const fil = getLang() === "fil";
    this.head.innerHTML = `<b>${fil ? "TALAAN NG PAKIKIPAGSAPALARAN" : "ADVENTURE LOG"}</b><span>${fil ? "Mag-scroll para bumalik" : "Scroll to look back"}</span>`;
    if (!this.count) this.list.innerHTML = `<p class="log-empty">${fil ? "Wala pang naitala. Makipag-usap, lumaban at mamulot — lahat ay itatala rito." : "Nothing logged yet. Talk, fight and loot — it all shows up here."}</p>`;
  }

  // NPC line: id = who is speaking (for the name)
  add(id, line, time = "") {
    if (!line) return;
    this.push("npc", npcName(id), line, time);
  }

  // A game event. merge = { key, value, format(n, total) }: merged into the last line
  // when the key matches and it was recent; otherwise text is shown.
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
