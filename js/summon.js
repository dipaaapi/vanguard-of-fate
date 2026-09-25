// ========================================================
// SUMMON COMPANION ENGINE (FALCON & GUARDIAN ANGELS)
// ========================================================

export function drawFalcon(ctx, falcon, facingRight) {
  if (!falcon) return;
  const fx = Math.floor(falcon.x);
  const fy = Math.floor(falcon.y);

  ctx.save();
  // Drop Shadow sa lupa
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(fx + 6, fy + 24, 7, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();

  const isWingUp = Math.floor(falcon.wingTimer / 4) % 2 === 0;

  if (!facingRight) {
    ctx.translate(fx + 14, fy);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(fx, fy);
  }

  // Kulay ng Falcon
  const C_BROWN_DARK = "#4a2810";
  const C_BROWN_MID  = "#7d4822";
  const C_FEATHER    = "#a66838";
  const C_WHITE      = "#ffffff";
  const C_BEAK       = "#fca311";
  const C_TALON      = "#e5e5e5";

  // Katawan
  ctx.fillStyle = C_BROWN_MID;
  ctx.fillRect(4, 5, 6, 4);

  // Ulo at Leeg
  ctx.fillStyle = C_WHITE;
  ctx.fillRect(7, 3, 4, 3);
  ctx.fillStyle = "#111111"; // Mata
  ctx.fillRect(9, 4, 1, 1);

  // Matulis na Curved Hunting Beak
  ctx.fillStyle = C_BEAK;
  ctx.fillRect(11, 4, 2, 2);
  ctx.fillRect(12, 5, 1, 1);

  // Pakpak (Flapping Cycle: Pataas at Pababa)
  if (isWingUp) {
    ctx.fillStyle = C_FEATHER;
    ctx.fillRect(3, 1, 3, 5);
    ctx.fillRect(6, 0, 3, 5);
    ctx.fillStyle = C_BROWN_DARK;
    ctx.fillRect(4, 0, 2, 2);
  } else {
    ctx.fillStyle = C_FEATHER;
    ctx.fillRect(0, 6, 5, 2);
    ctx.fillRect(4, 7, 6, 2);
    ctx.fillStyle = C_BROWN_DARK;
    ctx.fillRect(1, 8, 4, 1);
  }

  // Buntot (Tail Feathers)
  ctx.fillStyle = C_BROWN_DARK;
  ctx.fillRect(1, 8, 4, 2);

  // Talons / Kuko kapag sumusugod
  if (falcon.state === "STRIKING") {
    ctx.fillStyle = C_TALON;
    ctx.fillRect(7, 9, 2, 2);
    ctx.fillRect(10, 9, 2, 2);
  }

  ctx.restore();
}