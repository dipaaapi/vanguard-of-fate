import { Sound } from "./audio.js";
import { loadImage, drawCover } from "./background.js";
import { t, onLangChange } from "./i18n.js";

// ========================================================
// EARTHBOUND SOULS: ISEKAI LORE DATABASE
// ========================================================
const ISEKAI_LORE = {
  knight: {
    realName: "Arthur 'Art' Ramirez",
    earthRole: "Demolition Supervisor & Site Engineer",
    origin: "Manila, Philippines",
    summonEvent: "Crushed while shielding a rookie from falling steel beams.",
    trait: "Impenetrable Work Ethics",
    loreDesc: "Sanay sa pagbuhat ng bakal at pagprotekta sa tauhan. Ang kanyang pagka-engineer ay naging Bastion Forcefield na walang kayang tumibag."
  },
  archer: {
    realName: "Lyra Vance",
    earthRole: "Wildlife Biologist & Olympic Archer",
    origin: "Vancouver, Canada",
    summonEvent: "Froze in a blizzard while saving an injured mountain hawk.",
    trait: "Predator's Eye & Empathy",
    loreDesc: "Tahimik na tagapagtanggol ng kakahuyan. Muling nabuhay sa katawan ng Elf kasama ang kaluluwa ng agilang kanyang iniligtas bilang Falcon."
  },
  priest: {
    realName: "Dr. Julian Alcantara",
    earthRole: "ER Trauma Head Surgeon",
    origin: "Public General Hospital",
    summonEvent: "Heart failure after a grueling 36-hour surgical triage shift.",
    trait: "Death-Defying Triage",
    loreDesc: "Isang doktor na sumumpang walang pasyenteng mamamatay sa kanyang harapan. Ang kanyang triage ay naging Banal na Salamangka."
  },
  mage: {
    realName: "Samantha 'Sam' Chen",
    earthRole: "Astrophysicist & Satellite Radar Analyst",
    origin: "Atacama Observatory",
    summonEvent: "Enveloped by anomalous cosmic gamma pulse during a sky scan.",
    trait: "Orbital Mechanics Mastery",
    loreDesc: "Kabisado ang celestial mechanics at orbital trajectories. Ang dating equations ng mga bulalakaw ay naging nagliliyab na Meteor Swarm."
  },
  fighter: {
    realName: "Renzo 'Striker' Cruz",
    earthRole: "Undefeated Underground MMA Champion",
    origin: "Concrete Street Arenas",
    summonEvent: "Killed defending a helpless pedestrian from armed robbers.",
    trait: "Indomitable Ki Mastery",
    loreDesc: "Lumaki sa magulong lansangan kung saan tanging kamao ang panangga. Dinala ang kanyang disiplina upang patunayang kayang durugin ng suntok ang halimaw."
  }
};

export class SelectScene {
  // dom = { picker, dossier }: ang hero picker (ibaba) at dossier (kanan) ay HTML na
  constructor(roster, onHeroSelected, drawMatrixFn, dom = {}) {
    this.roster = roster;
    this.onHeroSelected = onHeroSelected;
    this.drawMatrixFn = drawMatrixFn;
    this.selectedIndex = 0;
    this.animTick = 0;
    this.bg = loadImage("assets/bg/portal_bg.jpg");

    this.pickerEl = dom.picker || null;
    this.dossierEl = dom.dossier || null;
    this.mode = "select";   // "select" | "awakening" (Job Awakening ng Novice sa Lv 10)
    this.renderDom();
    onLangChange(() => this.renderDom());
  }

  setMode(mode) {
    this.mode = mode;
    this.renderDom();
  }

  getLore(hero) {
    return ISEKAI_LORE[hero.id] || {
      realName: "Unknown",
      earthRole: "Wanderer",
      origin: "Earth",
      summonEvent: "Summoned via dimensional anomaly.",
      trait: "Latent Power",
      loreDesc: "A mysterious soul chosen to fight."
    };
  }

  // ---------- HTML (ibaba at kanan) ----------
  renderDom() {
    if (this.pickerEl) {
      this.pickerEl.innerHTML = "";
      this.roster.forEach((hero, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "menu-btn";

        const name = document.createElement("span");
        name.textContent = hero.name.toUpperCase();
        btn.appendChild(name);

        const sub = document.createElement("span");
        sub.className = "sub";
        sub.textContent = hero.title || "";
        btn.appendChild(sub);

        btn.addEventListener("mousedown", (e) => e.preventDefault());
        btn.addEventListener("click", () => {
          Sound.init();
          this.setIndex(i);
        });
        this.pickerEl.appendChild(btn);
      });

      const go = document.createElement("button");
      go.type = "button";
      go.className = "menu-btn embark";
      go.textContent = this.mode === "awakening" ? t("awakenBtn") : t("embarkBtn");
      go.addEventListener("mousedown", (e) => e.preventDefault());
      go.addEventListener("click", () => { Sound.init(); this.confirm(); });
      this.pickerEl.appendChild(go);
    }
    this.syncDom();
  }

  syncDom() {
    if (this.pickerEl) {
      Array.from(this.pickerEl.children).forEach((el, i) => {
        el.classList.toggle("selected", i === this.selectedIndex);
      });
    }

    if (this.dossierEl) {
      const hero = this.roster[this.selectedIndex];
      const lore = this.getLore(hero);
      const el = this.dossierEl;
      el.innerHTML = "";

      const add = (tag, cls, text) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        n.textContent = text;
        el.appendChild(n);
        return n;
      };

      add("div", "dz-name", hero.name.toUpperCase());
      // Sa awakening, ang Earth profile ay ng mentor ng class (isa sa limang naunang tinawag, Act III)
      const awakening = this.mode === "awakening";
      if (awakening) add("div", "dz-label dz-mentor", t("mentorLabel"));
      add("div", "dz-real", `"${lore.realName}"`);
      if (hero.title) add("div", "dz-title", hero.title);

      const rows = [
        ["PAST OCCUPATION", lore.earthRole, "c-white"],
        ["EARTH ORIGIN", lore.origin, "c-gold"],
        ["ISEKAI CATALYST", lore.summonEvent, "c-red"]
      ];
      rows.forEach(([label, value, cls]) => {
        add("div", "dz-label", label);
        add("div", "dz-value " + cls, value);
      });

      el.appendChild(document.createElement("hr"));
      add("div", "dz-label", "TRANSMUTED ABILITY");
      add("div", "dz-ability", lore.trait.toUpperCase());
      add("p", "dz-desc", lore.loreDesc);
    }
  }

  setIndex(i, playSound = true) {
    const n = this.roster.length;
    const next = ((i % n) + n) % n;
    if (next !== this.selectedIndex && playSound && Sound && Sound.playSelectMove) Sound.playSelectMove();
    this.selectedIndex = next;
    this.syncDom();
  }

  confirm() {
    if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
    this.onHeroSelected(this.roster[this.selectedIndex]);
  }

  handleInput(e) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") this.setIndex(this.selectedIndex - 1);
    else if (e.code === "ArrowRight" || e.code === "KeyD") this.setIndex(this.selectedIndex + 1);
    else if (e.code === "Enter" || e.code === "Space" || e.code === "KeyJ") {
      e.preventDefault();
      this.confirm();
    }
  }

  shadowText(ctx, text, x, y, color) {
    ctx.fillStyle = "#000000";
    ctx.fillText(text, x + 0.7, y + 0.7);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  // ---------- CANVAS: background + hero sa harap ng portal ----------
  draw(ctx, width, height) {
    this.animTick++;

    if (!drawCover(ctx, this.bg, width, height)) {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.fillStyle = "rgba(3, 6, 17, 0.15)";
    ctx.fillRect(0, 0, width, height);

    // Pulsing glow ng portal
    const px = width * 0.605;
    const py = height * 0.46;
    const pulse = 1 + Math.sin(this.animTick / 20) * 0.10;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(px, py, 4, px, py, 70 * pulse);
    glow.addColorStop(0, "rgba(140, 110, 255, 0.28)");
    glow.addColorStop(0.55, "rgba(56, 189, 248, 0.10)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(px - 80, py - 80, 160, 160);
    ctx.restore();

    const top = ctx.createLinearGradient(0, 0, 0, 40);
    top.addColorStop(0, "rgba(3, 6, 17, 0.8)");
    top.addColorStop(1, "rgba(3, 6, 17, 0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, width, 40);

    ctx.textAlign = "center";
    ctx.font = "bold 10px monospace";
    const awakening = this.mode === "awakening";
    this.shadowText(ctx, awakening ? t("awakenTitle") : "SELECT YOUR EARTHBOUND VANGUARD", width / 2, 18, "#ffd166");
    ctx.font = "6.5px monospace";
    this.shadowText(ctx, awakening ? t("awakenSub") : "CHOOSE A REINCARNATED SOUL TO EMBARK ON AETHELGARD", width / 2, 27, "#94a3b8");

    // Hero (3x laki) nakatayo sa harap ng portal
    const hero = this.roster[this.selectedIndex];
    const lore = this.getLore(hero);
    const heroX = Math.round(width * 0.605);
    const heroY = 206;

    const bottom = ctx.createLinearGradient(0, heroY - 6, 0, height);
    bottom.addColorStop(0, "rgba(3, 6, 17, 0)");
    bottom.addColorStop(1, "rgba(3, 6, 17, 0.75)");
    ctx.fillStyle = bottom;
    ctx.fillRect(0, heroY - 6, width, height - heroY + 6);

    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.beginPath();
    ctx.ellipse(heroX, heroY + 1, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const mentor = awakening && this.mentorAvatars && this.mentorAvatars[hero.id];
    if (mentor) {
      mentor.draw(ctx, heroX, heroY, "down", "idle", Math.floor(this.animTick / 40), false, false, 3);
    } else if (hero.sprites && hero.sprites.idle) {
      const frames = hero.sprites.idle;
      const idx = Math.floor(this.animTick / 26) % frames.length;
      ctx.save();
      ctx.translate(heroX, heroY);
      ctx.scale(3, 3);
      this.drawMatrixFn(ctx, -12, -24, frames[idx]);
      ctx.restore();
    }

    ctx.textAlign = "center";
    ctx.font = "bold 9px monospace";
    this.shadowText(ctx, hero.name.toUpperCase(), heroX, heroY + 16, "#ffd166");
    ctx.font = "bold 6.8px monospace";
    this.shadowText(ctx, `"${lore.realName}"`, heroX, heroY + 25, "#38bdf8");
    ctx.font = "6.2px monospace";
    this.shadowText(ctx, hero.title || "", heroX, heroY + 34, "#cbd5e1");
  }
}