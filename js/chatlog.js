import { npcName } from "./dialogue.js";
import { getLang, onLangChange } from "./i18n.js";

// ==================== BOTTOM TRAY: TALAAN NG USAPAN ====================
// Nasa ilalim ng screen ng laro (kapantay ng canvas). Bawat linyang sinasabi ng NPC sa DialogBox
// ay itinatala rito para mabasa muli; ang pinakabago ay nasa ibaba. Hanggang MAX na linya lang.

const MAX = 150;

export class ChatLog {
  constructor(root) {
    this.root = root;
    this.head = root.querySelector(".log-head");
    this.list = root.querySelector(".log-list");
    this.count = 0;
    this.renderHead();
    onLangChange(() => this.renderHead());
  }

  renderHead() {
    const fil = getLang() === "fil";
    this.head.innerHTML = `<b>${fil ? "TALAAN NG USAPAN" : "CONVERSATION LOG"}</b><span>${fil ? "Mag-scroll para bumalik" : "Scroll to look back"}</span>`;
    if (!this.count) this.list.innerHTML = `<p class="log-empty">${fil ? "Wala pang usapan. Lumapit sa isang tauhan at pindutin ang E." : "No conversations yet. Approach someone and press E."}</p>`;
  }

  // id: sino ang nagsasalita (para sa pangalan), line: ang buong linya, time: label ng oras sa laro
  add(id, line, time = "") {
    if (!line) return;
    if (!this.count) this.list.innerHTML = "";
    this.count++;
    const stick = this.list.scrollTop + this.list.clientHeight >= this.list.scrollHeight - 8;
    const row = document.createElement("p");
    row.className = "log-row";
    const t = document.createElement("time");
    t.textContent = time;
    const who = document.createElement("b");
    who.textContent = npcName(id);
    const text = document.createElement("span");
    text.textContent = line;
    row.append(t, who, text);
    this.list.appendChild(row);
    while (this.list.children.length > MAX) this.list.firstChild.remove();
    if (stick) this.list.scrollTop = this.list.scrollHeight;
  }

  clear() {
    this.count = 0;
    this.renderHead();
  }
}
