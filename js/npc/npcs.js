import { Avatar } from "../avatar/avatar.js";
import { NPC_DEFS } from "./roster.js";
import { npcName } from "../dialogue.js";
import { qt } from "../quest.js";

// ==================== MGA NPC SA MUNDO ====================
// Ang posisyon (x, y) ng NPC ay ang gitna ng paa, katulad ng anchor ng Avatar.
// Ang paa ng player ay nasa (player.x + 10, player.y + 21).

const TALK_RANGE = 26;
const FACE_RANGE = 70;

class NPC {
  constructor(id, x, y, dir = "down") {
    this.id = id;
    this.x = x;
    this.y = y;
    this.homeDir = dir;
    this.dir = dir;
    this.flip = false;
    this.visible = true;
    this.avatar = new Avatar(NPC_DEFS[id].look);
    this.tick = Math.floor(Math.random() * 60);
  }

  // Humarap sa player kapag malapit
  update(px, py) {
    this.tick++;
    const dx = px - this.x, dy = py - this.y;
    if (Math.hypot(dx, dy) < FACE_RANGE) {
      if (Math.abs(dx) > Math.abs(dy)) { this.dir = "side"; this.flip = dx < 0; }
      else this.dir = dy < 0 ? "up" : "down";
    } else {
      this.dir = this.homeDir;
      this.flip = false;
    }
  }

  draw(ctx) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(this.x, this.y - 1, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    this.avatar.draw(ctx, this.x, this.y, this.dir, "idle", Math.floor(this.tick / 40), this.flip);
  }
}

export class NPCManager {
  constructor(stage) {
    this.stage = stage;
    this.npcs = [];
    this.nearest = null;
    this.marked = null;     // layunin ng quest (may kumikislap na "!")
  }

  // Inilalagay ang lahat ng tauhan. summonerId = "aurelia" o "kenneth" (batay sa player)
  build(summonerId) {
    const sz = this.stage.safeZone;
    const gate = this.stage.castle.gatePortal;
    const bx = sz.x, by = sz.y;
    const gx = gate.x, gy = gate.y;

    this.summonerId = summonerId;
    this.npcs = [
      // Barracks Sanctuary
      new NPC("ronald", bx + 58, by + 72),
      new NPC("edgar", bx + 238, by + 72),
      // Tagapagtawag: sa Barracks (Act II) at sa Citadel (Act IV) — isa lang ang nakikita
      Object.assign(new NPC(summonerId, bx + 150, by + 52), { tag: "summonerBarracks" }),
      Object.assign(new NPC(summonerId, gx - 22, gy + 42), { tag: "summonerCitadel" }),
      // Imperial Citadel: audience dais sa harap ng gate
      new NPC("king", gx + 22, gy + 40),
      new NPC("royalGuard", gx - 62, gy + 36),
      new NPC("royalGuard", gx + 62, gy + 36),
      // Ang limang mentor (Act III)
      new NPC("arthur", gx - 72, gy + 92),
      new NPC("lyra", gx - 36, gy + 96),
      new NPC("julian", gx, gy + 98),
      new NPC("sam", gx + 36, gy + 96),
      new NPC("renzo", gx + 72, gy + 92)
    ];
  }

  // Aling NPC ang ipapakita batay sa quest
  applyQuest(quest) {
    const atCitadel = quest.summonerAtCitadel();
    this.npcs.forEach((n) => {
      if (n.tag === "summonerBarracks") n.visible = !atCitadel;
      if (n.tag === "summonerCitadel") n.visible = atCitadel;
    });
    this.marked = quest.targetNpc(this.summonerId);
  }

  update(player) {
    const px = player.x + 10, py = player.y + 21;
    let best = null, bestD = TALK_RANGE;
    this.npcs.forEach((n) => {
      if (!n.visible) return;
      n.update(px, py);
      const d = Math.hypot(px - n.x, py - n.y);
      if (d < bestD) { best = n; bestD = d; }
    });
    this.nearest = best;
  }

  isNear(id) {
    return Boolean(this.nearest && this.nearest.id === id);
  }

  find(id) {
    return this.npcs.find((n) => n.visible && n.id === id) || null;
  }

  // Y-sort: ang mga NPC sa likod ng player (mas mataas ang y) ay iginuguhit muna
  drawLayer(ctx, playerFootY, front) {
    this.npcs.forEach((n) => {
      if (!n.visible) return;
      if ((n.y > playerFootY) === front) n.draw(ctx);
    });
  }

  // Pangalan, "!" ng quest at "[E] Kausapin" (nasa ibabaw ng lahat)
  drawLabels(ctx, player) {
    const px = player.x + 10, py = player.y + 21;
    ctx.textAlign = "center";
    this.npcs.forEach((n) => {
      if (!n.visible) return;
      const near = Math.hypot(px - n.x, py - n.y) < FACE_RANGE;
      const top = n.y - 38;
      if (n.id === this.marked) {
        const bob = Math.sin(n.tick / 8) * 1.5;
        ctx.font = "bold 10px monospace";
        ctx.fillStyle = "#000";
        ctx.fillText("!", n.x + 1, top - 5 + bob + 1);
        ctx.fillStyle = "#ffd166";
        ctx.fillText("!", n.x, top - 5 + bob);
      }
      if (near) {
        ctx.font = "bold 5px monospace";
        const name = npcName(n.id).toUpperCase();
        const w = ctx.measureText(name).width + 6;
        ctx.fillStyle = "rgba(3, 6, 17, 0.7)";
        ctx.fillRect(n.x - w / 2, top - 1, w, 7);
        ctx.fillStyle = "#ffd166";
        ctx.fillText(name, n.x, top + 4);
      }
    });
    if (this.nearest) {
      const n = this.nearest;
      const label = `[E] ${qt("talk")}`;
      ctx.font = "bold 5px monospace";
      const w = ctx.measureText(label).width + 6;
      ctx.fillStyle = "rgba(255, 209, 102, 0.9)";
      ctx.fillRect(n.x - w / 2, n.y + 3, w, 7);
      ctx.fillStyle = "#030611";
      ctx.fillText(label, n.x, n.y + 8);
    }
  }
}
