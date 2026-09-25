import { Sound } from "./audio.js";
import { drawSpriteMatrix } from "./sprite.js";

// ========================================================
// EARTHBOUND SOULS: ISEKAI LORE DATABASE (NO EMOJIS)
// ========================================================
export const ISEKAI_LORE = {
  knight: {
    realName: "Arthur Ramirez",
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
    realName: "Julian Alcantara",
    earthRole: "ER Trauma Head Surgeon",
    origin: "Public General Hospital",
    summonEvent: "Heart failure after a grueling 36-hour surgical triage shift.",
    trait: "Death-Defying Triage",
    loreDesc: "Isang doktor na sumumpang walang pasyenteng mamamatay sa kanyang harapan. Ang kanyang triage ay naging Banal na Salamangka."
  },
  mage: {
    realName: "Samantha Chen",
    earthRole: "Astrophysicist & Satellite Radar Analyst",
    origin: "Atacama Observatory",
    summonEvent: "Enveloped by anomalous cosmic gamma pulse during a sky scan.",
    trait: "Orbital Mechanics Mastery",
    loreDesc: "Kabisado ang celestial mechanics at orbital trajectories. Ang dating equations ng mga bulalakaw ay naging nagliliyab na Meteor Swarm."
  },
  fighter: {
    realName: "Renzo Cruz",
    earthRole: "Undefeated Underground MMA Champion",
    origin: "Concrete Street Arenas",
    summonEvent: "Killed defending a helpless pedestrian from armed robbers.",
    trait: "Indomitable Ki Mastery",
    loreDesc: "Lumaki sa magulong lansangan kung saan tanging kamao ang panangga. Dinala ang kanyang disiplina upang patunayang kayang durugin ng suntok ang halimaw."
  }
};

export class SelectScene {
  constructor(roster, onHeroChosen, onReturnHome) {
    this.roster = roster;
    this.onHeroChosen = onHeroChosen;
    this.onReturnHome = onReturnHome;
    this.selectedIndex = 0;
    this.animTick = 0;

    // Use uploaded portal background artwork
    this.bgImage = new Image();
    this.bgImage.src = "assets/portal_bg.jpg";

    // Player Custom Name Input
    this.playerName = "VANGUARD";
    this.isEditingName = false;
    this.isNamingModalOpen = false;
    this.inputNameBuffer = "VANGUARD";
    this.cursorBlink = 0;

    // Mouse Hitboxes
    this.cardHitboxes = [];
    this.hoveredIndex = -1;
    this.hoveredBtn = null; // 'CONFIRM', 'HOME', 'NAME'

    this.buttons = {
      confirm: { x: 310, y: 214, w: 104, h: 20, label: "SUMMON & AWAKEN" },
      home:    { x: 12,  y: 214, w: 86,  h: 20, label: "MAIN MENU" }
    };
    this.nameBox = { x: 194, y: 214, w: 108, h: 20 };
  }

  handlePointerMove(clickX, clickY) {
    // Check card tabs
    let cardHover = -1;
    for (let i = 0; i < this.cardHitboxes.length; i++) {
      const box = this.cardHitboxes[i];
      if (clickX >= box.x && clickX <= box.x + box.w && clickY >= box.y && clickY <= box.y + box.h) {
        cardHover = i;
        break;
      }
    }

    if (cardHover !== this.hoveredIndex) {
      this.hoveredIndex = cardHover;
      if (cardHover !== -1 && Sound && Sound.playSelectHover) Sound.playSelectHover();
    }

    // Check action buttons
    let btnHover = null;
    if (clickX >= this.buttons.confirm.x && clickX <= this.buttons.confirm.x + this.buttons.confirm.w &&
        clickY >= this.buttons.confirm.y && clickY <= this.buttons.confirm.y + this.buttons.confirm.h) {
      btnHover = "CONFIRM";
    } else if (clickX >= this.buttons.home.x && clickX <= this.buttons.home.x + this.buttons.home.w &&
               clickY >= this.buttons.home.y && clickY <= this.buttons.home.y + this.buttons.home.h) {
      btnHover = "HOME";
    } else if (clickX >= this.nameBox.x && clickX <= this.nameBox.x + this.nameBox.w &&
               clickY >= this.nameBox.y && clickY <= this.nameBox.y + this.nameBox.h) {
      btnHover = "NAME";
    }

    if (btnHover !== this.hoveredBtn) {
      this.hoveredBtn = btnHover;
      if (btnHover && Sound && Sound.playSelectHover) Sound.playSelectHover();
    }
  }

  handlePointerDown(clickX, clickY) {
    // 1. Click on Hero Card Tabs
    for (let i = 0; i < this.cardHitboxes.length; i++) {
      const box = this.cardHitboxes[i];
      if (clickX >= box.x && clickX <= box.x + box.w && clickY >= box.y && clickY <= box.y + box.h) {
        if (this.selectedIndex !== i) {
          this.selectedIndex = i;
          if (Sound && Sound.playSelectMove) Sound.playSelectMove();
          const activeHero = this.roster[this.selectedIndex];
          const lore = ISEKAI_LORE[activeHero.id];
          if (lore && this.playerName === "VANGUARD") {
            this.playerName = lore.realName.split(" ")[0].toUpperCase();
          }
        }
        return;
      }
    }

    // If Naming Modal is Open, handle modal clicks
    if (this.isNamingModalOpen) {
      const boxW = 240;
      const boxH = 126;
      const boxX = Math.round(426 / 2 - boxW / 2);
      const boxY = Math.round(240 / 2 - boxH / 2);

      const acceptBtn = { x: boxX + 18, y: boxY + 86, w: 96, h: 24 };
      const cancelBtn = { x: boxX + 126, y: boxY + 86, w: 96, h: 24 };

      if (clickX >= acceptBtn.x && clickX <= acceptBtn.x + acceptBtn.w &&
          clickY >= acceptBtn.y && clickY <= acceptBtn.y + acceptBtn.h) {
        if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
        const clean = this.inputNameBuffer.replace(/[^\w\s-]/gi, "").trim().slice(0, 12);
        this.playerName = clean.length > 0 ? clean.toUpperCase() : "VANGUARD";
        this.isNamingModalOpen = false;
        return;
      }

      if (clickX >= cancelBtn.x && clickX <= cancelBtn.x + cancelBtn.w &&
          clickY >= cancelBtn.y && clickY <= cancelBtn.y + cancelBtn.h) {
        if (Sound && Sound.playSelectMove) Sound.playSelectMove();
        this.isNamingModalOpen = false;
        return;
      }

      return;
    }

    // 2. Click on Name Edit Box (Opens In-Canvas Modal)
    if (clickX >= this.nameBox.x && clickX <= this.nameBox.x + this.nameBox.w &&
        clickY >= this.nameBox.y && clickY <= this.nameBox.y + this.nameBox.h) {
      if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
      this.isNamingModalOpen = true;
      this.inputNameBuffer = this.playerName;
      return;
    }

    // 3. Click on Confirm Button
    if (clickX >= this.buttons.confirm.x && clickX <= this.buttons.confirm.x + this.buttons.confirm.w &&
        clickY >= this.buttons.confirm.y && clickY <= this.buttons.confirm.y + this.buttons.confirm.h) {
      if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
      const hero = this.roster[this.selectedIndex];
      const lore = ISEKAI_LORE[hero.id];
      this.onHeroChosen(hero, this.playerName, lore);
      return;
    }

    // 4. Click on Return Home Button
    if (clickX >= this.buttons.home.x && clickX <= this.buttons.home.x + this.buttons.home.w &&
        clickY >= this.buttons.home.y && clickY <= this.buttons.home.y + this.buttons.home.h) {
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      if (this.onReturnHome) this.onReturnHome();
      return;
    }
  }

  handleInput(e) {
    if (this.isNamingModalOpen) {
      if (e.code === "Enter") {
        if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
        const clean = this.inputNameBuffer.replace(/[^\w\s-]/gi, "").trim().slice(0, 12);
        this.playerName = clean.length > 0 ? clean.toUpperCase() : "VANGUARD";
        this.isNamingModalOpen = false;
        return;
      }
      if (e.code === "Escape") {
        if (Sound && Sound.playSelectMove) Sound.playSelectMove();
        this.isNamingModalOpen = false;
        return;
      }
      if (e.code === "Backspace") {
        if (Sound && Sound.playSelectMove) Sound.playSelectMove();
        this.inputNameBuffer = this.inputNameBuffer.slice(0, -1);
        return;
      }
      if (e.key && e.key.length === 1 && /^[a-zA-Z0-9_\-\s]$/.test(e.key) && this.inputNameBuffer.length < 12) {
        if (Sound && Sound.playSelectMove) Sound.playSelectMove();
        this.inputNameBuffer += e.key.toUpperCase();
        return;
      }
      return;
    }

    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      this.selectedIndex = (this.selectedIndex - 1 + this.roster.length) % this.roster.length;
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      const activeHero = this.roster[this.selectedIndex];
      const lore = ISEKAI_LORE[activeHero.id];
      if (lore && this.playerName === "VANGUARD") {
        this.playerName = lore.realName.split(" ")[0].toUpperCase();
      }
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      this.selectedIndex = (this.selectedIndex + 1) % this.roster.length;
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      const activeHero = this.roster[this.selectedIndex];
      const lore = ISEKAI_LORE[activeHero.id];
      if (lore && this.playerName === "VANGUARD") {
        this.playerName = lore.realName.split(" ")[0].toUpperCase();
      }
    }
    if (e.code === "KeyN") {
      this.isNamingModalOpen = true;
      this.inputNameBuffer = this.playerName;
      return;
    }
    if (e.code === "Enter" || e.code === "Space" || e.code === "KeyJ") {
      if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
      const hero = this.roster[this.selectedIndex];
      const lore = ISEKAI_LORE[hero.id];
      this.onHeroChosen(hero, this.playerName, lore);
    }
  }

  // HIGH-FIDELITY ILLUMINATED RUNIC PEDESTAL
  drawCleanPedestal(ctx, px, py, accentColor = "#ffd166") {
    const t = this.animTick * 0.05;

    // 1. Floor Glow & Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.beginPath();
    ctx.ellipse(px, py + 12, 44, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Chiseled Obsidian Base
    ctx.fillStyle = "#0a0f1d";
    ctx.beginPath();
    ctx.ellipse(px, py + 7, 36, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(px - 36, py + 6, 72, 3);

    // 3. Polished Slate Tier
    ctx.fillStyle = "#1e2433";
    ctx.beginPath();
    ctx.ellipse(px, py, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Gold / Class Accent Trim
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(px, py, 30, 8, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Pulsing Inner Runic Ring
    const pulse = 0.4 + Math.sin(t) * 0.25;
    ctx.strokeStyle = `rgba(56, 189, 248, ${pulse})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(px, py, 20, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  draw(ctx, width, height) {
    this.animTick++;

    // 1. Draw Portal Background Image
    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth !== 0) {
      ctx.drawImage(this.bgImage, 0, 0, width, height);

      ctx.fillStyle = "rgba(5, 8, 16, 0.82)";
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, width, height);
    }

    // Outer Frame Border
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.strokeRect(5, 5, width - 10, height - 10);

    // 2. Header
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SUMMONING GATE: CHOOSE YOUR EARTHBOUND VANGUARD", width / 2, 16);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "6.2px monospace";
    ctx.fillText("Click character tab or buttons to customize name and begin expedition", width / 2, 24);

    // 3. Mouse-Clickable Selection Tabs (Top Centered)
    const cardW = 38;
    const cardH = 26;
    const gap = 8;
    const totalW = this.roster.length * cardW + (this.roster.length - 1) * gap;
    const startX = Math.round(width / 2 - totalW / 2);
    const startY = 28;

    this.cardHitboxes = [];

    this.roster.forEach((hero, i) => {
      const cx = startX + i * (cardW + gap);
      const isSelected = i === this.selectedIndex;
      const isHovered = i === this.hoveredIndex;

      this.cardHitboxes.push({ x: cx, y: startY, w: cardW, h: cardH });

      if (isSelected) {
        ctx.fillStyle = "rgba(30, 41, 59, 0.96)";
      } else if (isHovered) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
      } else {
        ctx.fillStyle = "rgba(13, 19, 31, 0.85)";
      }
      ctx.fillRect(cx, startY, cardW, cardH);

      ctx.strokeStyle = isSelected ? "#ffd166" : (isHovered ? "#38bdf8" : "#243247");
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.strokeRect(cx, startY, cardW, cardH);

      // Hero icon / letter badge
      ctx.fillStyle = isSelected ? "#ffd166" : "#64748b";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(hero.name[0], cx + cardW / 2, startY + 13);

      ctx.fillStyle = isSelected ? "#38bdf8" : "#475569";
      ctx.font = "bold 5.5px monospace";
      ctx.fillText(hero.name.toUpperCase().slice(0, 6), cx + cardW / 2, startY + 22);
    });

    const activeHero = this.roster[this.selectedIndex];
    const lore = ISEKAI_LORE[activeHero.id] || {
      realName: "Unknown",
      earthRole: "Wanderer",
      origin: "Earth",
      summonEvent: "Summoned via dimensional anomaly.",
      trait: "Latent Power",
      loreDesc: "A mysterious soul chosen to fight."
    };

    // 4. LEFT: CALM PEDESTAL & HERO PREVIEW
    const pedX = 85;
    const pedY = 138;

    this.drawCleanPedestal(ctx, pedX, pedY);

    if (activeHero.sprites && activeHero.sprites.idle) {
      const frames = activeHero.sprites.idle;
      const previewIdx = Math.floor(this.animTick / 26) % frames.length;
      const frame = frames[previewIdx];
      if (frame) {
        const fRows = frame.length;
        const fCols = frame[0] ? frame[0].length : 0;
        const scale = fRows <= 24 ? 2 : 1;
        const drawStartX = Math.floor(pedX - (fCols * scale) / 2);
        const drawStartY = Math.floor(pedY - (fRows * scale) + 4);
        for (let r = 0; r < fRows; r++) {
          const row = frame[r];
          for (let c = 0; c < row.length; c++) {
            const color = row[c];
            if (color && color !== 0) {
              ctx.fillStyle = color;
              ctx.fillRect(drawStartX + c * scale, drawStartY + r * scale, scale, scale);
            }
          }
        }
      }
    }

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(activeHero.name.toUpperCase(), pedX, 160);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 6.5px monospace";
    ctx.fillText(lore.realName, pedX, 170);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "6px monospace";
    ctx.fillText(activeHero.title, pedX, 179);

    // HP & SPEED GAUGE
    ctx.textAlign = "left";
    ctx.font = "5.8px monospace";
    ctx.fillStyle = "#ef4444";
    ctx.fillText(`HP: ${activeHero.maxHp}`, pedX - 35, 191);
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`SPD: ${activeHero.speed}x`, pedX + 4, 191);

    // 5. RIGHT: CLEAN COMPACT DOSSIER & 3 SKILLS SHOWCASE
    const loreBoxX = 162;
    const loreBoxY = 58;
    const loreBoxW = 252;
    const loreBoxH = 148;

    ctx.fillStyle = "rgba(10, 15, 26, 0.94)";
    ctx.fillRect(loreBoxX, loreBoxY, loreBoxW, loreBoxH);

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.strokeRect(loreBoxX, loreBoxY, loreBoxW, loreBoxH);

    ctx.fillStyle = "rgba(56, 189, 248, 0.1)";
    ctx.fillRect(loreBoxX + 1, loreBoxY + 1, loreBoxW - 2, 13);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 6.8px monospace";
    ctx.textAlign = "left";
    ctx.fillText("REINCARNATION DOSSIER & 3 UNIQUE SKILLS", loreBoxX + 6, loreBoxY + 10);

    ctx.font = "6px monospace";

    ctx.fillStyle = "#94a3b8";
    ctx.fillText("PAST ROLE :", loreBoxX + 6, loreBoxY + 23);
    ctx.fillStyle = "#f8fafc";
    ctx.fillText(lore.earthRole, loreBoxX + 68, loreBoxY + 23);

    ctx.fillStyle = "#94a3b8";
    ctx.fillText("ORIGIN    :", loreBoxX + 6, loreBoxY + 33);
    ctx.fillStyle = "#ffd166";
    ctx.fillText(lore.origin, loreBoxX + 68, loreBoxY + 33);

    ctx.fillStyle = "#94a3b8";
    ctx.fillText("CATALYST  :", loreBoxX + 6, loreBoxY + 43);
    ctx.fillStyle = "#f87171";
    ctx.fillText(lore.summonEvent, loreBoxX + 68, loreBoxY + 43);

    // 3 Unique Skills Breakdown
    ctx.strokeStyle = "#334155";
    ctx.beginPath();
    ctx.moveTo(loreBoxX + 6, loreBoxY + 52);
    ctx.lineTo(loreBoxX + loreBoxW - 6, loreBoxY + 52);
    ctx.stroke();

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 6.2px monospace";
    ctx.fillText("3 COMBAT TECHNIQUES & CONTROLS:", loreBoxX + 6, loreBoxY + 61);

    const skillsMap = {
      knight: [
        { key: "[SPACE] ATTACK", desc: "Lance Thrust with Knockback" },
        { key: "[J / 1] SKILL 1", desc: "Bastion Fortress (80% Dmg Cut & Shock)" },
        { key: "[K / 2] SKILL 2", desc: "Lance Blitz (Piercing Rush & Stun)" },
        { key: "[L / 3] SKILL 3", desc: "Judgement Vortex (360 Cleave)" }
      ],
      fighter: [
        { key: "[SPACE] ATTACK", desc: "Rapid 2-Hit Punch Combo" },
        { key: "[J / 1] SKILL 1", desc: "Hadouken Ki Force Sphere Blast" },
        { key: "[K / 2] SKILL 2", desc: "Dragon Flying Kick (Homing Concussion)" },
        { key: "[L / 3] SKILL 3", desc: "Sonic Tremor (8-Way Ground Shockwave)" }
      ],
      mage: [
        { key: "[SPACE] ATTACK", desc: "Arcane Mana Dart Bolt" },
        { key: "[J / 1] SKILL 1", desc: "Magma Meteor Strike (AoE Explosion)" },
        { key: "[K / 2] SKILL 2", desc: "Thunderstorm Tempest (Lightning Field)" },
        { key: "[L / 3] SKILL 3", desc: "Blizzard Frost Nova (Radial Freeze)" }
      ],
      archer: [
        { key: "[SPACE] ATTACK", desc: "Broadhead Arrow Shot (6-Quiver)" },
        { key: "[J / 1] SKILL 1", desc: "Falcon Talon Dive Strike" },
        { key: "[K / 2] SKILL 2", desc: "Triple Arrow Fan Volley" },
        { key: "[L / 3] SKILL 3", desc: "Gale Windstrider Snipe (Full Screen)" }
      ],
      priest: [
        { key: "[SPACE] ATTACK", desc: "Holy Wand Radiant Smite" },
        { key: "[J / 1] SKILL 1", desc: "Priority Triage Heal (+22% HP)" },
        { key: "[K / 2] SKILL 2", desc: "Summon Guardian Angel Companion" },
        { key: "[L / 3] SKILL 3", desc: "Celestial Pillar of Retribution" }
      ]
    };

    const heroSkills = skillsMap[activeHero.id] || [];
    heroSkills.forEach((sk, sIdx) => {
      const sy = loreBoxY + 73 + sIdx * 11;
      ctx.fillStyle = sIdx === 0 ? "#f87171" : (sIdx === 1 ? "#ffd166" : (sIdx === 2 ? "#4ade80" : "#c084fc"));
      ctx.font = "bold 5.6px monospace";
      ctx.fillText(sk.key, loreBoxX + 6, sy);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "5.6px monospace";
      ctx.fillText(sk.desc, loreBoxX + 78, sy);
    });

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 5.6px monospace";
    ctx.fillText("DODGE: [HOLD SHIFT] EVASIVE DASH ROLL", loreBoxX + 6, loreBoxY + 120);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "5.4px monospace";
    this.drawWrappedText(ctx, lore.loreDesc, loreBoxX + 6, loreBoxY + 130, loreBoxW - 12, 7.2);

    // 6. BOTTOM ACTION BAR: [MAIN MENU] | [NAME INPUT BOX] | [SUMMON & AWAKEN]
    // Home Button
    const hb = this.buttons.home;
    const isHomeHovered = this.hoveredBtn === "HOME";
    ctx.fillStyle = isHomeHovered ? "rgba(56, 189, 248, 0.3)" : "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(hb.x, hb.y, hb.w, hb.h);
    ctx.strokeStyle = isHomeHovered ? "#38bdf8" : "#475569";
    ctx.lineWidth = isHomeHovered ? 1.5 : 1;
    ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
    ctx.fillStyle = isHomeHovered ? "#ffffff" : "#94a3b8";
    ctx.font = "bold 6.5px monospace";
    ctx.textAlign = "center";
    ctx.fillText(hb.label, hb.x + hb.w / 2, hb.y + hb.h / 2 + 2.5);

    // Name Input Box
    const nb = this.nameBox;
    const isNameHovered = this.hoveredBtn === "NAME";
    ctx.fillStyle = isNameHovered ? "rgba(30, 41, 59, 0.95)" : "rgba(10, 15, 26, 0.95)";
    ctx.fillRect(nb.x, nb.y, nb.w, nb.h);
    ctx.strokeStyle = isNameHovered ? "#ffd166" : "#38bdf8";
    ctx.lineWidth = isNameHovered ? 1.5 : 1;
    ctx.strokeRect(nb.x, nb.y, nb.w, nb.h);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 6px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`NAME: ${this.playerName}`, nb.x + nb.w / 2, nb.y + nb.h / 2 + 2.5);

    // Confirm Button
    const cb = this.buttons.confirm;
    const isConfirmHovered = this.hoveredBtn === "CONFIRM";
    ctx.fillStyle = isConfirmHovered ? "#38bdf8" : "#ffd166";
    ctx.fillRect(cb.x, cb.y, cb.w, cb.h);
    ctx.strokeStyle = isConfirmHovered ? "#ffffff" : "#ffd166";
    ctx.lineWidth = isConfirmHovered ? 1.5 : 1;
    ctx.strokeRect(cb.x, cb.y, cb.w, cb.h);
    ctx.fillStyle = "#090d16";
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "center";
    ctx.fillText(cb.label, cb.x + cb.w / 2, cb.y + cb.h / 2 + 2.5);

    // 8. Interactive Hero Naming Modal
    if (this.isNamingModalOpen) {
      this.cursorBlink++;
      ctx.fillStyle = "rgba(4, 8, 18, 0.85)";
      ctx.fillRect(0, 0, width, height);

      const boxW = 240;
      const boxH = 126;
      const boxX = Math.round(width / 2 - boxW / 2);
      const boxY = Math.round(height / 2 - boxH / 2);

      // Modal Background & Frame
      ctx.fillStyle = "rgba(15, 23, 42, 0.98)";
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Modal Header
      ctx.fillStyle = "#ffd166";
      ctx.font = "bold 8.5px monospace";
      ctx.textAlign = "center";
      ctx.fillText("✦ RENAME YOUR VANGUARD HERO ✦", width / 2, boxY + 18);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "5.5px monospace";
      ctx.fillText("Type with keyboard • Letters & Numbers • Max 12 Chars", width / 2, boxY + 30);

      // Text Input Box
      const inpW = 190;
      const inpH = 24;
      const inpX = Math.round(width / 2 - inpW / 2);
      const inpY = boxY + 44;

      ctx.fillStyle = "#090d16";
      ctx.fillRect(inpX, inpY, inpW, inpH);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(inpX, inpY, inpW, inpH);

      // Render Typed Text + Cursor
      const showCursor = (this.cursorBlink % 40) < 22;
      const displayText = this.inputNameBuffer + (showCursor ? "|" : " ");
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(displayText, width / 2, inpY + 16);

      // Action Buttons
      const btnAcceptX = boxX + 18;
      const btnCancelX = boxX + 126;
      const btnY = boxY + 86;
      const btnW = 96;
      const btnH = 24;

      // Accept Button
      ctx.fillStyle = "#15803d";
      ctx.fillRect(btnAcceptX, btnY, btnW, btnH);
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 1;
      ctx.strokeRect(btnAcceptX, btnY, btnW, btnH);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 6.5px monospace";
      ctx.fillText("ACCEPT / OK [ENTER]", btnAcceptX + btnW / 2, btnY + 15);

      // Cancel Button
      ctx.fillStyle = "#334155";
      ctx.fillRect(btnCancelX, btnY, btnW, btnH);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.strokeRect(btnCancelX, btnY, btnW, btnH);

      ctx.fillStyle = "#ffffff";
      ctx.fillText("CANCEL [ESC]", btnCancelX + btnW / 2, btnY + 15);
    }
  }

  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let curY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, curY);
        line = words[n] + " ";
        curY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, curY);
  }
}