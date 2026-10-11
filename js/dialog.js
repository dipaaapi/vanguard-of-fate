import { Sound } from "./audio.js";
import { npcName } from "./dialogue.js";
import { t } from "./i18n.js";
import { PLAYABLES } from "./playables.js";
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
    } else if (c === "Backspace") {
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
    this.tab = "main";
    this.logOpen = false;
    this.last = "";
    this.toastTimer = null;
  }

  setVisible(v) {
    this.tracker.classList.toggle("show", v);
    if (!v) this.closeLog();
  }

  update(quest, player, summonerName, mentorName) {
    let { act, goal } = quest.text(player, summonerName, mentorName);
    const active=this.context?.guildBook.state(player).active;
    const contract=active?.priority!==false && active ? this.context.guildBook.objective(player) : null;
    const selected=quest.side.selectedTask();
    const party=this.context?.party?.(), npcQuest=party?.selectedQuest();
    if(npcQuest){act=t("questNpc");goal=party.progressText(npcQuest,player.bag);}
    else if(contract){
      act=t("questGuild");
      goal=`${this.context.guildPanel.objective(contract)} · ${active.have}/${contract.n}`;
    }else if(selected){
      act=`${t(selected.boat?"questBoat":"questSide")} · ${act}`;
      goal=`${quest.side.title(selected)}: ${quest.side.text(selected)}`;
    }else if(quest.side.mainPriority){
      const story=quest.entries(player,summonerName,mentorName).find(e=>e.state==="current");
      act=`${t("questMain")} · ${act}`;
      if(story)goal=story.goal;
      if(quest.gated())goal+=` · ${quest.side.hudLine()}`;
    }
    const key = act + "|" + goal;
    const details=JSON.stringify([quest.side.serialize(),this.context?.guildBook.state(player).active,this.context?.party?.().book.serialize()]);
    if (key === this.last && details===this.detailKey) return;
    this.detailKey=details;
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
    side.tasks().forEach((q) => {
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
    const scroll=this.logEl.scrollTop;
    this.logEl.textContent="";
    const add=(parent,tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;parent.appendChild(e);return e;};
    add(this.logEl,"h3","",t("questTypes"));
    add(this.logEl,"p","ql-sub",t("questChooseHint"));
    const tabs=add(this.logEl,"nav","ql-tabs");tabs.setAttribute("role","tablist");
    for(const [id,key] of [["main","questMain"],["side","questSide"],["guild","questGuild"],["boat","questBoat"],["npc","questNpc"]]){
      const b=add(tabs,"button",this.tab===id?"selected":"",t(key));b.type="button";b.setAttribute("role","tab");b.setAttribute("aria-selected",String(this.tab===id));b.onclick=()=>{this.tab=id;this.renderLog(quest,player,summonerName,mentorName);};
    }
    const content=add(this.logEl,"div","ql-cards");content.setAttribute("role","tabpanel");
    const party=this.context?.party?.();
    const refresh=()=>{this.context?.changed();this.last="";this.renderLog(quest,player,summonerName,mentorName);};
    const card=(title,goal,state,selected,action,progress)=>{
      const row=add(content,"article",`ql-card ${state}${selected?" selected":""}`);
      add(row,"div","ql-act",title);add(row,"p","ql-goal",goal);
      if(progress){const meter=add(row,"progress","ql-progress");meter.max=progress.n;meter.value=progress.have;meter.setAttribute("aria-label",`${progress.have}/${progress.n}`);add(row,"small","",`${progress.have}/${progress.n}`);}
      if(action){const b=add(row,"button","ql-select",t(selected?"questFollowing":"questFollow"));b.type="button";b.onclick=()=>{action();refresh();};}
    };
    const active=this.context?.guildBook.state(player).active;
    if(this.tab==="main")for(const e of quest.entries(player,summonerName,mentorName))card(e.act,e.state==="locked"?qt("locked"):e.goal,e.state,e.state==="current"&&!party?.selectedQuest()&&!quest.side.selectedTask()&&!active?.priority,e.state==="current"?()=>{party?.clearQuestPriority();quest.side.selected=null;quest.side.mainPriority=true;if(active)active.priority=false;}:null);
    if(this.tab==="side"||this.tab==="boat")for(const q of (this.tab==="boat"?quest.side.boat.list:quest.side.list)){
      const available=q.area==="hub" || quest.unlocked(q.area);
      card(quest.side.title(q),quest.side.text(q),q.have>=q.n?"done":available?"current":"locked",quest.side.selectedTask()===q,q.have<q.n&&available?()=>{party?.clearQuestPriority();quest.side.select(q);if(active)active.priority=false;}:null,q);
    }
    if(this.tab==="guild"&&this.context){
      const c=this.context.guildBook.objective(player);
      if(c)card(t("questGuild"),this.context.guildPanel.objective(c),"current",active.priority!==false,()=>{party?.clearQuestPriority();active.priority=true;quest.side.selected=null;quest.side.mainPriority=false;},{have:active.have,n:c.n});
      const b=add(content,"button","ql-select",t("questBrowseGuild"));b.type="button";b.onclick=()=>{this.closeLog();this.context.guildPanel.show("guildClerk",player,this.context.guildContext());};
    }
    if(this.tab==="npc" && party)for(const [id,def] of Object.entries(PLAYABLES)){
      const q=party.book.state[id];if(!q.started && !q.recruited)continue;
      card(def.label[0],party.progressText(id,player.bag),q.recruited?"done":"current",party.selectedQuest()===id,!q.recruited?()=>{party.selectQuest(id);quest.side.selected=null;quest.side.mainPriority=false;if(active)active.priority=false;}:null,{have:q.progress,n:Math.max(1,def.required)});
    }
    if(!content.children.length)add(content,"p","ql-empty",t("questEmpty"));
    add(this.logEl,"div","ql-foot",qt("close"));
    this.logEl.scrollTop=scroll;
  }
}
