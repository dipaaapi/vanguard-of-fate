// ==================== CELESTIAL WARP GATEWAYS (LORE Act I) ====================
// Apat na sinaunang gateway sa kaparangan ng Aethelgard. Bawat isa ay patungo sa isang
// platform ng kampanya (Acts VII–X); nakasara (sealed) hangga't hindi pa umaabot ang kuwento.
// Hindi na nagte-teleport ang system mismo: tinatawag lang ang handler, at ang main.js ang
// nagpapasya (lumipat ng platform o ipakitang nakasara).

// Iginuguhit ang isang gateway. dir: "vertical" | "horizontal"; sealed = madilim na may kandado
export function drawGateway(ctx, p, t, sealed = false, label = "") {
  ctx.save();
  const pulse = sealed ? 0 : Math.sin(t * 1.8) * 3;
  const color = sealed ? "#475569" : p.color;
  const vertical = p.dir !== "horizontal";

  ctx.fillStyle = "#090d16";
  if (vertical) ctx.fillRect(p.x - 9, p.y - 30, 18, 60);
  else ctx.fillRect(p.x - 30, p.y - 9, 60, 18);
  ctx.strokeStyle = sealed ? "#64748b" : "#ffd166";
  ctx.lineWidth = 1.5;
  if (vertical) ctx.strokeRect(p.x - 9, p.y - 30, 18, 60);
  else ctx.strokeRect(p.x - 30, p.y - 9, 60, 18);

  const grad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 26 + pulse);
  grad.addColorStop(0, sealed ? "#94a3b8" : "#ffffff");
  grad.addColorStop(0.3, color);
  grad.addColorStop(0.8, "rgba(10, 15, 30, 0.7)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.globalAlpha = sealed ? 0.45 : 1;
  ctx.beginPath();
  if (vertical) ctx.ellipse(p.x, p.y, 14, 26 + pulse, 0, 0, Math.PI * 2);
  else ctx.ellipse(p.x, p.y, 26 + pulse, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = sealed ? "#64748b" : "#ffffff";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  if (vertical) ctx.ellipse(p.x, p.y, 5, 18, sealed ? 0 : t * 0.6, 0, Math.PI * 2);
  else ctx.ellipse(p.x, p.y, 18, 5, sealed ? 0 : t * 0.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (sealed) {
    // kandado
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(p.x - 3, p.y - 1, 6, 5);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y - 1, 2, Math.PI, 0);
    ctx.stroke();
  }

  if (label) {
    ctx.font = "bold 5px monospace";
    ctx.textAlign = "center";
    const ly = vertical ? p.y - 36 : p.y - 16;
    const w = ctx.measureText(label).width + 6;
    ctx.fillStyle = "rgba(3, 6, 17, 0.75)";
    ctx.fillRect(p.x - w / 2, ly - 5, w, 7);
    ctx.fillStyle = sealed ? "#94a3b8" : "#ffd166";
    ctx.fillText(label, p.x, ly);
  }
  ctx.restore();
}

export class PortalSystem {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.animTick = 0;

    // 4 Celestial Warp Gateways. dest = id ng platform (tingnan ang js/world/platforms.js)
    this.portals = [
      { id: "NORTH", dest: "frost", dir: "horizontal", x: Math.round(this.worldWidth / 2), y: 46, w: 58, h: 22, color: "#bfe9ff" },
      { id: "SOUTH", dest: "ash", dir: "horizontal", x: Math.round(this.worldWidth / 2), y: this.worldHeight - 46, w: 58, h: 22, color: "#ff7a1a" },
      { id: "WEST", dest: "coast", dir: "vertical", x: 48, y: Math.round(this.worldHeight / 2), w: 22, h: 58, color: "#38bdf8" },
      { id: "EAST", dest: "canopy", dir: "vertical", x: this.worldWidth - 48, y: Math.round(this.worldHeight / 2), w: 22, h: 58, color: "#c77dff" }
    ];
    // Itinatakda ng main.js bawat frame: (portal) => { sealed, label }
    this.stateOf = () => ({ sealed: false, label: "" });
  }

  // Punto sa harap ng gateway (dito lumalabas ang player pagbalik)
  exitPoint(id) {
    const p = this.portals.find((q) => q.id === id);
    if (!p) return { x: this.worldWidth / 2, y: this.worldHeight / 2 };
    const inward = { NORTH: [0, 44], SOUTH: [0, -56], WEST: [44, -10], EAST: [-60, -10] }[p.id];
    return { x: p.x + inward[0] - 10, y: p.y + inward[1] - 12 };
  }

  update(player, onEnter) {
    this.animTick += 0.08;

    if (!player || player.portalCooldown > 0) return;

    for (let p of this.portals) {
      const halfW = p.w / 2;
      const halfH = p.h / 2;
      if (
        player.x + 18 >= p.x - halfW &&
        player.x + 4 <= p.x + halfW &&
        player.y + 22 >= p.y - halfH &&
        player.y + 2 <= p.y + halfH
      ) {
        player.portalCooldown = 75; // 1.25s cooldown
        if (onEnter) onEnter(p);
        break;
      }
    }
  }

  draw(ctx) {
    this.portals.forEach((p) => {
      const s = this.stateOf(p) || {};
      drawGateway(ctx, p, this.animTick, s.sealed, s.label);
    });
  }
}
