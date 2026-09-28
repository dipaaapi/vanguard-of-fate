// Helper para sa mga background image (assets/bg/)
export function loadImage(src) {
  const holder = { img: new Image(), ready: false };
  holder.img.onload = () => { holder.ready = true; };
  holder.img.src = src;
  return holder;
}

// "Cover" fit: pinupuno ang buong screen, hindi nababago ang aspect ratio.
// Smoothing ang ginagamit dito (painting ito, hindi sprite) para hindi magulo sa non-integer na resize.
export function drawCover(ctx, holder, w, h) {
  const img = holder.img;
  if (!holder.ready || !img.naturalWidth) return false;

  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;

  const prev = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  ctx.imageSmoothingEnabled = prev;
  return true;
}