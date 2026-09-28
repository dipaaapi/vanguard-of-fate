import { Sound } from "./audio.js";
import { npcName } from "./dialogue.js";
import { qt } from "./quest.js";

// ==================== DIALOGUE BOX + QUEST TRACKER + QUEST LOG ====================
// HTML overlay sa ibabaw ng game canvas (#viewport), para malinaw ang teksto sa kahit anong scale.

const CHARS_PER_FRAME = 1.6;

export class DialogBox {
  constructor(root) {
    this.root = root;
    this.box = root.querySelector("#dialog");
    this.nameEl = root.querySelector("#dlgName");
    this.textEl = root.querySelector("#dlgText");
    this.nextEl = root.querySelector("#dlgNext");
    this.portrait = root.querySelector("#dlgPortrait");
    this.portrait.width = 48;
    this.portrait.height = 44;
    this.open = false;
    this.lines = [];
    this.index = 0;
    this.shown = 0;
    this.onEnd = null;

    this.box.addEventListener("pointerdown", (e) => { e.preventDefault(); this.next(); });
  }

  // avatar: Avatar ng nagsasalita (para sa portrait); id: para sa pangalan
  start(id, avatar, lines, onEnd) {
    this.id = id;
    this.lines = lines && lines.length ? lines : ["…"];
    this.index = 0;
    this.shown = 0;
    this.onEnd = onEnd || null;
    this.open = true;
    this.box.classList.add("open");
    this.nameEl.textContent = npcName(id);
    const ctx = this.portrait.getContext("2d");
    if (avatar) avatar.drawPortrait(ctx, this.portrait.width, this.portrait.height);
    else ctx.clearRect(0, 0, this.portrait.width, this.portrait.height);
    this.render();
    if (Sound.playSelectMove) Sound.playSelectMove();
  }

  current() {
    return this.lines[this.index] || "";
  }

  render() {
    const line = this.current();
    this.textEl.textContent = line.slice(0, Math.floor(this.shown));
    this.nextEl.classList.toggle("ready", this.shown >= line.length);
  }

  // Tinatawag bawat frame (typewriter)
  update() {
    if (!this.open) return;
    const len = this.current().length;
    if (this.shown < len) {
      this.shown = Math.min(len, this.shown + CHARS_PER_FRAME);
      this.render();
    }
  }

  next() {
    if (!this.open) return;
    const len = this.current().length;
    if (this.shown < len) {
      this.shown = len;             // tapusin agad ang linya
      this.render();
      return;
    }
    this.index++;
    this.shown = 0;
    if (this.index >= this.lines.length) {
      this.close();
      return;
    }
    if (Sound.playSelectMove) Sound.playSelectMove();
    this.render();
  }

  close() {
    this.open = false;
    this.box.classList.remove("open");
    const cb = this.onEnd;
    this.onEnd = null;
    if (cb) cb();
  }

  handleInput(e) {
    if (e.repeat) return;
    const c = e.code;
    if (c === "Enter" || c === "Space" || c === "KeyE" || c === "KeyJ") {
      e.preventDefault();
      this.next();
    } else if (c === "Escape") {
      // Laktawan ang natitirang linya (pero gawin pa rin ang action)
      this.index = this.lines.length - 1;
      this.shown = this.current().length;
      this.next();
    }
  }
}

export class QuestHud {
  constructor(root) {
    // Ang quest tracker ay nasa bottom bar na (labas ng game screen)
    this.tracker = document.getElementById("questTracker");
    this.actEl = document.getElementById("qtAct");
    this.goalEl = document.getElementById("qtGoal");
    this.toastEl = root.querySelector("#questToast");
    this.logEl = root.querySelector("#questLog");
    this.logOpen = false;
    this.last = "";
    this.toastTimer = null;
  }

  setVisible(v) {
    this.tracker.classList.toggle("show", v);
    if (!v) this.closeLog();
  }

  update(quest, player, summonerName, mentorName) {
    const { act, goal } = quest.text(player, summonerName, mentorName);
    const key = act + "|" + goal;
    if (key === this.last) return;
    this.last = key;
    this.actEl.textContent = act;
    this.goalEl.textContent = goal;
    if (this.logOpen) this.renderLog(quest, player, summonerName, mentorName);
  }

  toast(text) {
    this.toastEl.textContent = `${qt("newStep")}: ${text}`;
    this.toastEl.classList.remove("show");
    void this.toastEl.offsetWidth;
    this.toastEl.classList.add("show");
  }

  toggleLog(quest, player, summonerName, mentorName) {
    if (this.logOpen) this.closeLog();
    else {
      this.logOpen = true;
      this.renderLog(quest, player, summonerName, mentorName);
      this.logEl.classList.add("open");
    }
  }

  closeLog() {
    this.logOpen = false;
    this.logEl.classList.remove("open");
  }

  renderLog(quest, player, summonerName, mentorName) {
    this.logEl.innerHTML = "";
    const h = document.createElement("h3");
    h.textContent = qt("log");
    this.logEl.appendChild(h);
    const sub = document.createElement("div");
    sub.className = "ql-sub";
    sub.textContent = qt("title");
    this.logEl.appendChild(sub);

    quest.entries(player, summonerName, mentorName).forEach((e) => {
      const row = document.createElement("div");
      row.className = "ql-row " + e.state;
      const mark = document.createElement("span");
      mark.className = "ql-mark";
      mark.textContent = e.state === "done" ? "✔" : e.state === "current" ? "▸" : "·";
      const body = document.createElement("div");
      const a = document.createElement("div");
      a.className = "ql-act";
      a.textContent = e.act;
      const g = document.createElement("div");
      g.className = "ql-goal";
      g.textContent = e.state === "locked" ? qt("locked") : e.goal;
      body.append(a, g);
      row.append(mark, body);
      this.logEl.appendChild(row);
    });
    const foot = document.createElement("div");
    foot.className = "ql-foot";
    foot.textContent = qt("close");
    this.logEl.appendChild(foot);
  }
}
