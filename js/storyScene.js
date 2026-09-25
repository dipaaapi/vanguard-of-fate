import { Sound } from "./audio.js";
import { drawSpriteMatrix } from "./sprite.js";

export class StoryScene {
  constructor(onStartGameplay, onCancelToSelect, onReturnHome) {
    this.onStartGameplay = onStartGameplay;
    this.onCancelToSelect = onCancelToSelect;
    this.onReturnHome = onReturnHome;

    this.hero = null;
    this.playerName = "";
    this.animTick = 0;

    this.bgImage = new Image();
    this.bgImage.src = "assets/portal_bg.jpg";

    this.textProgress = 0;
    this.fullText = "";
    this.paragraphs = [];
    this.storyTitle = "";

    this.hoveredBtn = null; // 'START', 'SKIP', 'CANCEL', 'HOME'
    this.buttons = {
      start:  { x: 310, y: 202, w: 98, h: 24, label: "BEGIN DESTINY", primary: true },
      skip:   { x: 232, y: 202, w: 70, h: 24, label: "FAST SKIP", primary: false },
      cancel: { x: 126, y: 202, w: 98, h: 24, label: "BACK TO HEROES", primary: false },
      home:   { x: 18,  y: 202, w: 100, h: 24, label: "RETURN HOME", primary: false }
    };
  }

  setHero(hero, playerName, lore) {
    this.hero = hero;
    this.playerName = playerName || (lore ? lore.realName : hero.name);
    this.animTick = 0;
    this.textProgress = 0;

    this.storyTitle = `AWAKENING OF THE ${hero.name.toUpperCase()}`;
    this.paragraphs = [
      `Through the dimensional tear of the Ancient Gate, the soul of ${this.playerName} emerges into the shattered realm of Aethelgard.`,
      `In a former life: ${lore.earthRole} from ${lore.origin}. Catalyst: ${lore.summonEvent}`,
      `Bound by destiny, the Vanguard awakens with ancient powers—prepared to conquer the tides and purge the encroaching abyss.`
    ];
    this.fullText = this.paragraphs.join(" \n\n ");

    if (Sound && Sound.playStoryChime) Sound.playStoryChime();
    if (Sound && Sound.startStoryBGM) Sound.startStoryBGM();
  }

  handlePointerMove(clickX, clickY) {
    let found = null;
    for (const key in this.buttons) {
      const b = this.buttons[key];
      if (clickX >= b.x && clickX <= b.x + b.w && clickY >= b.y && clickY <= b.y + b.h) {
        found = key;
        break;
      }
    }
    if (found !== this.hoveredBtn) {
      this.hoveredBtn = found;
      if (found && Sound && Sound.playSelectHover) Sound.playSelectHover();
    }
  }

  handlePointerDown(clickX, clickY) {
    for (const key in this.buttons) {
      const b = this.buttons[key];
      if (clickX >= b.x && clickX <= b.x + b.w && clickY >= b.y && clickY <= b.y + b.h) {
        if (key === "start") {
          if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
          this.onStartGameplay();
          return;
        }
        if (key === "skip") {
          if (Sound && Sound.playSelectMove) Sound.playSelectMove();
          this.textProgress = this.fullText.length;
          return;
        }
        if (key === "cancel") {
          if (Sound && Sound.playSelectMove) Sound.playSelectMove();
          this.onCancelToSelect();
          return;
        }
        if (key === "home") {
          if (Sound && Sound.playSelectMove) Sound.playSelectMove();
          this.onReturnHome();
          return;
        }
      }
    }
  }

  handleInput(e) {
    if (e.code === "Enter" || e.code === "Space") {
      if (this.textProgress < this.fullText.length) {
        this.textProgress = this.fullText.length;
      } else {
        if (Sound && Sound.playSelectConfirm) Sound.playSelectConfirm();
        this.onStartGameplay();
      }
    } else if (e.code === "Escape") {
      this.onCancelToSelect();
    }
  }

  draw(ctx, width, height) {
    this.animTick++;
    if (this.textProgress < this.fullText.length) {
      this.textProgress += 0.85;
    }

    // 1. Draw Background
    if (this.bgImage && this.bgImage.complete && this.bgImage.naturalWidth !== 0) {
      ctx.drawImage(this.bgImage, 0, 0, width, height);

      // Deep atmospheric shade
      ctx.fillStyle = "rgba(4, 7, 15, 0.78)";
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = "#070b14";
      ctx.fillRect(0, 0, width, height);
    }

    // Outer framing border
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // 2. Story Card Container
    const boxX = 18;
    const boxY = 18;
    const boxW = width - 36;
    const boxH = 176;

    ctx.fillStyle = "rgba(10, 15, 26, 0.92)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Header Title
    ctx.fillStyle = "rgba(255, 209, 102, 0.12)";
    ctx.fillRect(boxX + 1, boxY + 1, boxW - 2, 22);

    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(this.storyTitle, width / 2, boxY + 15);

    // Left Hero Portrait Box
    const pX = boxX + 12;
    const pY = boxY + 32;
    const pW = 68;
    const pH = 90;

    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(pX, pY, pW, pH);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.strokeRect(pX, pY, pW, pH);

    if (this.hero && this.hero.sprites && this.hero.sprites.idle) {
      const frames = this.hero.sprites.idle;
      const previewIdx = Math.floor(this.animTick / 20) % frames.length;
      const frame = frames[previewIdx];
      if (frame) {
        const fRows = frame.length;
        const fCols = frame[0] ? frame[0].length : 0;
        const scale = fRows <= 24 ? 2 : 1;
        const drawStartX = Math.floor(pX + pW / 2 - (fCols * scale) / 2);
        const drawStartY = Math.floor(pY + pH / 2 - (fRows * scale) / 2 - 4);
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

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 6.5px monospace";
    ctx.textAlign = "center";
    ctx.fillText(this.playerName.toUpperCase(), pX + pW / 2, pY + pH - 6);

    // Right Typewriter Narrative Text
    const textX = pX + pW + 14;
    const textY = pY + 10;
    const maxTextW = boxW - pW - 36;

    const visibleCharCount = Math.floor(this.textProgress);
    const visibleText = this.fullText.slice(0, visibleCharCount);

    ctx.textAlign = "left";
    ctx.fillStyle = "#f8fafc";
    ctx.font = "6.5px monospace";

    this.drawFormattedText(ctx, visibleText, textX, textY, maxTextW, 11);

    // 3. Action Buttons (RETURN HOME, BACK TO HEROES, FAST SKIP, BEGIN DESTINY)
    for (const key in this.buttons) {
      const b = this.buttons[key];
      const isHovered = this.hoveredBtn === key;

      if (b.primary) {
        ctx.fillStyle = isHovered ? "#38bdf8" : "#ffd166";
      } else {
        ctx.fillStyle = isHovered ? "rgba(56, 189, 248, 0.25)" : "rgba(15, 23, 42, 0.85)";
      }
      ctx.fillRect(b.x, b.y, b.w, b.h);

      ctx.strokeStyle = isHovered ? "#ffffff" : (b.primary ? "#ffd166" : "#475569");
      ctx.lineWidth = isHovered ? 1.5 : 1;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      ctx.fillStyle = b.primary ? "#0f172a" : (isHovered ? "#ffffff" : "#cbd5e1");
      ctx.font = "bold 6.8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 2.5);
    }
  }

  drawFormattedText(ctx, text, x, y, maxWidth, lineHeight) {
    const rawParagraphs = text.split("\n\n");
    let curY = y;

    for (let p of rawParagraphs) {
      const words = p.split(" ");
      let line = "";

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
      curY += lineHeight + 5;
    }
  }
}
