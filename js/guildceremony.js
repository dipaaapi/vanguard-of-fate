import { guildText as T, guildRoleName } from "./guilddata.js";
import { guildImage } from "./world/guildhall.js";
export class GuildCeremony {
  constructor() { this.open = false; }
  start(player, result) { this.player = player; this.result = result; this.open = true; this.started = performance.now(); this.scene = 0; }
  close() { this.open = false; }
  handleInput(e) {
    if (e.repeat) return;
    if (e.code === "Backspace") this.close();
    else if (["Enter", "Space", "KeyE"].includes(e.code)) { if (++this.scene >= 4) this.close(); this.started = performance.now(); }
    e.preventDefault();
  }
  draw(ctx) {
    const elapsed = (performance.now() - this.started) / 1000;
    if (elapsed > 6) { this.scene++; this.started = performance.now(); if (this.scene >= 4) { this.close(); return; } }
    ctx.save(); ctx.fillStyle = "#070f1c"; ctx.fillRect(0, 0, 480, 270);
    const img = guildImage("hall"), pulse = (Math.sin(elapsed * 2) + 1) / 2;
    const zoom = 1 + Math.min(1, elapsed / 6) * .12;
    ctx.translate(240, 106); ctx.scale(zoom, zoom);
    if (img.complete && img.naturalWidth) ctx.drawImage(img, -140, -85);
    ctx.restore(); ctx.save();
    const master = guildImage("guildMaster"); if (master.complete && master.naturalWidth) ctx.drawImage(master, 166, 126, 32, 48);
    this.player.kit?.avatar?.draw(ctx, 265, 174, "down", "idle", 0, false);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = i % 2 ? "#4dd7bb" : "#f8dc94";
      const angle = i * 2.399 + elapsed * .4, r = 34 + (i % 7) * 8;
      ctx.fillRect(240 + Math.cos(angle) * r, 145 + Math.sin(angle) * r * .5, 2, 2);
    }
    if (this.scene >= 1) {
      ctx.fillStyle = `rgba(77,215,187,${.4 + pulse * .4})`; ctx.fillRect(221, 79, 38, 38);
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 16px monospace"; ctx.textAlign = "center"; ctx.fillText(this.result.rank, 240, 105);
    }
    if (this.scene >= 2) { const plate = guildImage("plate"); if (plate.complete && plate.naturalWidth) ctx.drawImage(plate, 228, 120); }
    ctx.fillStyle = "rgba(5,10,20,.95)"; ctx.fillRect(12, 183, 456, 75);
    ctx.textAlign = "center"; ctx.fillStyle = "#4dd7bb"; ctx.font = "bold 9px monospace"; ctx.fillText(T("title"), 240, 197);
    ctx.font = "8px monospace"; ctx.fillStyle = "#edf5ef";
    const line = T(`ceremony${this.scene + 1}`, { role: guildRoleName(this.result.role), rank: this.result.rank });
    const words = line.slice(0, Math.floor(elapsed * 45)).split(" "); let row = "", y = 212;
    for (const word of words) { if (ctx.measureText(`${row} ${word}`).width > 422) { ctx.fillText(row, 240, y); y += 11; row = word; } else row += (row ? " " : "") + word; }
    ctx.fillText(row, 240, y); ctx.font = "6px monospace"; ctx.fillStyle = "#cbd5e1"; ctx.fillText(T("continue"), 240, 250);
    ctx.restore();
  }
}
