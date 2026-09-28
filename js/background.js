// Helpers for background images (assets/bg/)
export function loadImage(src) {
  const holder = { img: new Image(), ready: false };
  holder.img.onload = () => { holder.ready = true; };
  holder.img.src = src;
  return holder;
}

// "Cover" fit: fills the whole screen without changing the aspect ratio.
// Uses smoothing here (it is a painting, not a sprite) so it stays clean at non-integer sizes.
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