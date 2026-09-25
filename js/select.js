import { Sound } from "./audio.js";

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
  constructor(roster, onHeroSelected, drawMatrixFn) {
    this.roster = roster;
    this.onHeroSelected = onHeroSelected;
    this.drawMatrixFn = drawMatrixFn;
    this.selectedIndex = 0;
    this.animTick = 0;
  }

  handleInput(e) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      this.selectedIndex = (this.selectedIndex - 1 + this.roster.length) % this.roster.length;
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      this.selectedIndex = (this.selectedIndex + 1) % this.roster.length;
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
    }
    if (e.code === "Enter" || e.code === "Space" || e.code === "KeyJ") {
      if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
      this.onHeroSelected(this.roster[this.selectedIndex]);
    }
  }

  // CLEAN, ELEGANT, SOLID 48x48 PEDESTAL (WALANG MAKULIT NA FLOATING PARTICLES)
  drawCleanPedestal(ctx, px, py) {
    // 1. Soft Floor Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.beginPath();
    ctx.ellipse(px, py + 12, 42, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Solid Chiseled Stone Base (Lower Tier)
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(px, py + 7, 36, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(px - 36, py + 6, 72, 3);

    // 3. Polished Upper Slate Tier
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.ellipse(px, py, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Subtle Gold Edge Trim
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(px, py, 30, 8, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Calm Inner Ring
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(px, py, 20, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  draw(ctx, width, height) {
    this.animTick++;

    // 1. Solid Clean Dark Slate Background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    // Subtle Outer Frame
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // 2. Minimalist Header
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SELECT YOUR EARTHBOUND VANGUARD", width / 2, 20);

    ctx.fillStyle = "#64748b";
    ctx.font = "6.5px monospace";
    ctx.fillText("CHOOSE A REINCARNATED SOUL TO EMBARK ON AETHELGARD", width / 2, 29);

    // 3. Selection Tabs (Top Centered)
    const cardW = 34;
    const cardH = 30;
    const gap = 8;
    const totalW = this.roster.length * cardW + (this.roster.length - 1) * gap;
    const startX = Math.round(width / 2 - totalW / 2);
    const startY = 38;

    this.roster.forEach((hero, i) => {
      const cx = startX + i * (cardW + gap);
      const isSelected = i === this.selectedIndex;

      ctx.fillStyle = isSelected ? "#1e293b" : "#0d131f";
      ctx.fillRect(cx, startY, cardW, cardH);

      ctx.strokeStyle = isSelected ? "#ffd166" : "#243247";
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.strokeRect(cx, startY, cardW, cardH);

      ctx.fillStyle = isSelected ? "#ffd166" : "#64748b";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(hero.name[0], cx + cardW / 2, startY + 19);
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

    // ========================================================
    // 4. LEFT: CALM PEDESTAL & HERO PREVIEW
    // ========================================================
    const pedX = 100;
    const pedY = 162;

    this.drawCleanPedestal(ctx, pedX, pedY);

    if (activeHero.sprites && activeHero.sprites.idle) {
      const frames = activeHero.sprites.idle;
      const previewIdx = Math.floor(this.animTick / 26) % frames.length;
      this.drawMatrixFn(ctx, pedX - 12, pedY - 24, frames[previewIdx]);
    }

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(activeHero.name.toUpperCase(), pedX, 186);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 6.8px monospace";
    ctx.fillText(`"${lore.realName}"`, pedX, 196);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "6.2px monospace";
    ctx.fillText(activeHero.title, pedX, 206);

    // ========================================================
    // 5. RIGHT: CLEAN COMPACT DOSSIER BOX
    // ========================================================
    const loreBoxX = 186;
    const loreBoxY = 76;
    const loreBoxW = 228;
    const loreBoxH = 142;

    ctx.fillStyle = "rgba(13, 19, 33, 0.95)";
    ctx.fillRect(loreBoxX, loreBoxY, loreBoxW, loreBoxH);

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.strokeRect(loreBoxX, loreBoxY, loreBoxW, loreBoxH);

    ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
    ctx.fillRect(loreBoxX + 1, loreBoxY + 1, loreBoxW - 2, 14);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "left";
    ctx.fillText("📂 EARTHBOUND REINCARNATION DOSSIER", loreBoxX + 8, loreBoxY + 10);

    ctx.font = "6.5px monospace";

    ctx.fillStyle = "#94a3b8";
    ctx.fillText("PAST OCCUPATION :", loreBoxX + 8, loreBoxY + 26);
    ctx.fillStyle = "#f8fafc";
    ctx.fillText(lore.earthRole, loreBoxX + 84, loreBoxY + 26);

    ctx.fillStyle = "#94a3b8";
    ctx.fillText("EARTH ORIGIN    :", loreBoxX + 8, loreBoxY + 38);
    ctx.fillStyle = "#ffd166";
    ctx.fillText(lore.origin, loreBoxX + 84, loreBoxY + 38);

    ctx.fillStyle = "#94a3b8";
    ctx.fillText("ISEKAI CATALYST :", loreBoxX + 8, loreBoxY + 50);
    ctx.fillStyle = "#f87171";

    if (lore.summonEvent.length > 25) {
      const words = lore.summonEvent.split(" ");
      const mid = Math.ceil(words.length / 2);
      ctx.fillText(words.slice(0, mid).join(" "), loreBoxX + 84, loreBoxY + 50);
      ctx.fillText(words.slice(mid).join(" "), loreBoxX + 84, loreBoxY + 59);
    } else {
      ctx.fillText(lore.summonEvent, loreBoxX + 84, loreBoxY + 50);
    }

    ctx.strokeStyle = "#1e293b";
    ctx.beginPath();
    ctx.moveTo(loreBoxX + 6, loreBoxY + 71);
    ctx.lineTo(loreBoxX + loreBoxW - 6, loreBoxY + 71);
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 6.8px monospace";
    ctx.fillText(`TRANSMUTED ABILITY : ${lore.trait.toUpperCase()}`, loreBoxX + 8, loreBoxY + 84);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "6.2px monospace";
    this.drawWrappedText(ctx, lore.loreDesc, loreBoxX + 8, loreBoxY + 96, loreBoxW - 16, 9.5);

    // Footer Hint
    ctx.fillStyle = "#64748b";
    ctx.font = "6.5px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PRESS [A / D] NAVIGATE  •  [ENTER / SPACE] CONFIRM", width / 2, height - 8);
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