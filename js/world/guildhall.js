import { GUILD_SITE, GUILD_ZONE, GUILD_NPCS, guildText } from "../guilddata.js";
import { around } from "../juice.js";
import { behaviorPose, drawBehaviorEmote } from "../behavior.js";
const images = new Map();
export function guildImage(key) {
  if (!images.has(key)) { const img = new Image(); img.src = `assets/ui/guild_${key}.png`; images.set(key, img); }
  return images.get(key);
}
for (const key of ["hall", "plate", ...Object.keys(GUILD_NPCS)]) guildImage(key);
export const GUILD_SOLIDS = [
  { x: GUILD_SITE.x + 20, y: GUILD_SITE.y + 72, w: 100, h: 86 },
  { x: GUILD_SITE.x + 160, y: GUILD_SITE.y + 72, w: 100, h: 86 }
];
export function setGuildHallOpen(stage, open) {
  if (stage.guildOpen === open) return;
  stage.guildOpen = open; stage.guildSolids = open ? GUILD_SOLIDS : [];
  stage.safeZones = [stage.safeZone, stage.dais, ...(open ? [GUILD_ZONE] : [])];
  stage.navRevision = (stage.navRevision || 0) + 1;
  stage.navGrid = null;
}
export function drawGuildHall(ctx, stage) {
  if (!stage.guildOpen) return;
  const img = guildImage("hall");
  if (img.complete && img.naturalWidth) ctx.drawImage(img, GUILD_SITE.x, GUILD_SITE.y);
  else { ctx.fillStyle = "#354d50"; ctx.fillRect(GUILD_SITE.x, GUILD_SITE.y + 70, GUILD_SITE.w, 95); }
  ctx.font = "bold 6px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#d6f8e8";
  ctx.fillText(guildText("title"), GUILD_SITE.x + GUILD_SITE.w / 2, GUILD_SITE.y + 179);
}
export function drawGuildNpc(ctx, npc) {
  if (!GUILD_NPCS[npc.id]) return false;
  const img = guildImage(npc.id);
  if (!img.complete || !img.naturalWidth) return false;
  around(ctx, npc.x, npc.y, behaviorPose(npc), () => ctx.drawImage(img, Math.round(npc.x - 16), Math.round(npc.y - 43)));
  drawBehaviorEmote(ctx, npc, npc.x, npc.y - 45);
  return true;
}
