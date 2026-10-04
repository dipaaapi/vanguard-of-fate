import { Sound } from "./audio.js";
import { npcName } from "./dialogue.js";
import { qt, bookText } from "./quest.js";

// ==================== DIALOGUE BOX + QUEST TRACKER + QUEST LOG ====================
// HTML overlay above the game canvas (#viewport), so the text stays crisp at any scale.

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
    this.onLine = null;      // (id, line): called for each new line (for the log in the bottom tray)

    this.box.addEventListener("pointerdown", (e) => { e.preventDefault(); this.next(); });
  }

  // avatar: the speaker's Avatar (for the portrait); id: for the name
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
    if (this.onLine) this.onLine(id, this.current());
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

  // Called every frame (typewriter)
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
      this.shown = len;             // finish the line at once
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
    if (this.onLine) this.onLine(this.id, this.current());
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
      // Skip the remaining lines (but still run the action)
      this.index = this.lines.length - 1;
      this.shown = this.current().length;
      this.next();
    }
  }
}

export class QuestHud {
  constructor(root) {
    // The quest tracker lives in the side panel (outside the game screen)
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

  renderSide(side) {
    const box = document.createElement("div");
    box.className = "ql-side";
    const p = side.progress();
    const h = document.createElement("div");
    h.className = "ql-side-h";
    h.textContent = `${side.logTitle()} · ${p.done}/${p.total}`;
    box.appendChild(h);
    side.list.forEach((q) => {
      const done = q.have >= q.n;
      const row = document.createElement("div");
      row.className = "ql-row side " + (done ? "done" : "current");
      const mark = document.createElement("span");
      mark.className = "ql-mark";
      mark.textContent = done ? "✔" : "○";
      const body = document.createElement("div");
      const a = document.createElement("div");
      a.className = "ql-act";
      a.textContent = side.title(q);
      const g = document.createElement("div");
      g.className = "ql-goal";
      g.textContent = side.text(q);
      body.append(a, g);
      row.append(mark, body);
      box.appendChild(row);
    });
    this.logEl.appendChild(box);
  }

  renderLog(quest, player, summonerName, mentorName) {
    this.logEl.innerHTML = "";
    const h = document.createElement("h3");
    h.textContent = qt("log");
    this.logEl.appendChild(h);
    const sub = document.createElement("div");
    sub.className = "ql-sub";
    sub.textContent = `${bookText("one")} · ${qt("title")}`;
    this.logEl.appendChild(sub);

    const side = quest.side;
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
      // The current Act's side quests, under the current step (the main quest waits for them)
      if (e.state === "current" && side && side.list.length) this.renderSide(side);
    });
    const next = document.createElement("div");
    next.className = "ql-book";
    next.textContent = bookText("two");
    this.logEl.appendChild(next);
    const foot = document.createElement("div");
    foot.className = "ql-foot";
    foot.textContent = qt("close");
    this.logEl.appendChild(foot);
  }
}
