import { Sound } from "../audio.js";
import { getLang } from "../i18n.js";

// ==================== BOAT SAILING & SEA MONOLITH SYSTEM ====================
// Lets the hero board a boat at the end of the Cerulean Abyss causeway, sail the open sea and reach
// the Celestial Monolith. The Leviathan Regent's defeat breaks the chains around the monolith;
// placing all four Seal Stones then awakens it and opens the only portal to the Dark Continent.
// Pier, boat, monolith and portal positions come from the platform's def.boat (js/world/platforms.js).

export class BoatSystem {
  constructor(stage, spots) {
    this.stage = stage;
    this.tick = 0;

    // Pier and the moored boat
    this.pier = { w: 26, h: 18, ...spots.pier };
    this.dockedBoat = { ...spots.dockedBoat };

    // The ancient monolith in the sea
    this.monolith = { ...spots.monolith, radius: 26, activated: false, pulseTick: 0 };

    // Portal to the Dark Continent (opens once the monolith is awakened)
    this.seaPortal = { ...spots.seaPortal, active: false, radius: 20 };

    // Chained until the Leviathan Regent falls (synced from the quest by main.js)
    this.chained = true;
    // Seal Stone item ids required to awaken the monolith
    this.seals = spots.seals || [];

    // Wake particle trail while sailing
    this.wakes = [];
  }

  // Whether a position is on water
  isWaterAt(px, py) {
    if (!this.stage) return false;
    if (this.stage.tilemap && this.stage.tilemap.liquid) {
      const tx = Math.floor(px / 16), ty = Math.floor(py / 16);
      const idx = ty * this.stage.tilemap.cols + tx;
      return Boolean(this.stage.tilemap.liquid[idx]);
    }
    return false;
  }

  // The boat only floats on water: hitting land it slides along the shore or is put back
  // at its last position on water (checks the middle of the hull)
  keepAfloat(p) {
    const wet = (x, y) => this.isWaterAt(x + 10, y + 20);
    if (wet(p.x, p.y)) {
      this.lastWet = { x: p.x, y: p.y };
      return;
    }
    const l = this.lastWet || this.dockedBoat;
    if (wet(p.x, l.y)) p.y = l.y;
    else if (wet(l.x, p.y)) p.x = l.x;
    else { p.x = l.x; p.y = l.y; }
  }

  // Board or leave the boat
  toggleBoard(player, fx = null) {
    if (!player) return;

    if (player.inBoat) {
      // Disembark: try to step onto the nearest dry land / pier
      const checkSpots = [
        { x: this.pier.x + 8, y: this.pier.y + 8 },
        { x: player.x + 18, y: player.y - 18 },
        { x: player.x - 18, y: player.y - 18 },
        { x: player.x, y: player.y - 24 },
        { x: player.x + 24, y: player.y }
      ];

      let landingSpot = checkSpots.find((s) => !this.isWaterAt(s.x, s.y));
      if (!landingSpot) landingSpot = { x: this.pier.x + 10, y: this.pier.y + 10 };

      player.inBoat = false;
      player.x = landingSpot.x;
      player.y = landingSpot.y;
      this.dockedBoat.x = player.x - 12;
      this.dockedBoat.y = player.y + 18;

      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      if (fx && fx.spawnDamagePopup) {
        const lang = getLang() === "fil" ? "fil" : "en";
        const msg = lang === "fil" ? "Bumaba sa Lupa" : "Disembarked";
        fx.spawnDamagePopup(player.x + 10, player.y - 10, msg, false, "#38bdf8");
      }
    } else {
      // Board the boat
      player.inBoat = true;
      player.x = this.dockedBoat.x;
      player.y = this.dockedBoat.y;
      this.lastWet = { x: player.x, y: player.y };

      if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();
      if (fx && fx.spawnDamagePopup) {
        const lang = getLang() === "fil" ? "fil" : "en";
        const msg = lang === "fil" ? "⛵ Naglayag sa Karagatan!" : "⛵ Setting Sail!";
        fx.spawnDamagePopup(player.x + 10, player.y - 10, msg, false, "#00f0ff");
      }
    }
  }

  // How many of the required Seal Stones the player carries
  sealsHeld(player) {
    return this.seals.filter((id) => player && player.bag && player.bag.has(id)).length;
  }

  // E at the monolith: chained → hint; missing stones → count; all four → consume them and open the portal
  activateMonolith(player, fx = null, onOpenDarkContinent = null) {
    if (this.monolith.activated) return false;
    const fil = getLang() === "fil", lang = fil ? "fil" : "en";
    const say = (msg, color) => { if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(this.monolith.x, this.monolith.y - 60, msg, false, color); };

    if (this.chained) {
      say(fil ? "⛓ Nakagapos! Talunin muna ang Leviathan Regent." : "⛓ Chained! Defeat the Leviathan Regent first.", "#ef4444");
      return false;
    }
    const held = this.sealsHeld(player);
    if (held < this.seals.length) {
      say(fil ? `Kulang ang Seal Stone (${held}/${this.seals.length})` : `Seal Stones ${held}/${this.seals.length}`, "#facc15");
      return false;
    }
    this.seals.forEach((id) => player.bag.take(id, 1));

    this.monolith.activated = true;
    this.seaPortal.active = true;

    if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();
    if (fx) {
      if (fx.spawnHitSparks) fx.spawnHitSparks(this.monolith.x, this.monolith.y, "#38bdf8", 40);
      if (fx.addScreenShake) fx.addScreenShake(6);
      if (fx.spawnDamagePopup) {
        const msg = lang === "fil"
          ? "🌌 NABUKSAN ANG LAGUSAN PATUNGO SA DARK CONTINENT!"
          : "🌌 CELESTIAL PORTAL TO THE DARK CONTINENT OPENED!";
        fx.spawnDamagePopup(this.monolith.x, this.monolith.y - 25, msg, true, "#ffd166");
      }
    }

    if (onOpenDarkContinent) onOpenDarkContinent();
    return true;
  }

  update(player, onWarp) {
    this.tick++;

    // Wake trail while sailing
    if (player && player.inBoat) {
      this.keepAfloat(player);
      if (this.tick % 4 === 0 && (player.state === "run" || player.sprinting)) {
        this.wakes.push({
          x: player.x + 10,
          y: player.y + 22,
          radius: 3,
          maxRadius: 10,
          alpha: 0.75,
          life: 25
        });
      }

      // Sea Portal Collision
      if (this.seaPortal.active && onWarp) {
        const dPortal = Math.hypot(player.x + 10 - this.seaPortal.x, player.y + 18 - this.seaPortal.y);
        if (dPortal < 22 && (!player.portalCooldown || player.portalCooldown <= 0)) {
          player.portalCooldown = 90;
          onWarp({ id: "DARK_CONTINENT_PORTAL", dest: "dark_continent", color: "#9d4edd" });
        }
      }
    }

    // Update wakes
    this.wakes.forEach((w) => {
      w.radius += 0.28;
      w.alpha -= 0.03;
      w.life--;
    });
    this.wakes = this.wakes.filter((w) => w.life > 0 && w.alpha > 0);
  }

  // Draws the pier, boat, monolith prompt and sea portal
  draw(ctx, player) {
    ctx.save();
    const t = this.tick;
    const lang = getLang() === "fil" ? "fil" : "en";

    // 1. WAKES ON THE WATER
    this.wakes.forEach((w) => {
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, w.alpha)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(w.x, w.y, w.radius * 1.6, w.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 2. PIER / WOODEN DOCK
    {
      const p = this.pier;
      // Wooden Pilings
      ctx.fillStyle = "#3e2723";
      ctx.fillRect(p.x, p.y + p.h - 4, 4, 10);
      ctx.fillRect(p.x + p.w - 4, p.y + p.h - 4, 4, 10);

      // Wooden Deck
      ctx.fillStyle = "#795548";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = "#4e342e";
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      // Wood Planks detail
      ctx.fillStyle = "#5d4037";
      for (let i = 4; i < p.w; i += 6) {
        ctx.fillRect(p.x + i, p.y, 1, p.h);
      }

      // Mooring Post
      ctx.fillStyle = "#3e2723";
      ctx.fillRect(p.x + 2, p.y + p.h - 8, 4, 8);
      ctx.fillStyle = "#d7ccc8";
      ctx.fillRect(p.x + 1, p.y + p.h - 6, 6, 2); // Mooring rope
    }

    // 3. DOCKED BOAT (when the player is not aboard)
    if (player && !player.inBoat) {
      this.drawBoatSprite(ctx, this.dockedBoat.x, this.dockedBoat.y, false);
      // Prompt when close to the moored boat or the pier
      const dPier = Math.hypot(player.x + 10 - this.pier.x, player.y + 18 - this.pier.y);
      const dBoat = Math.hypot(player.x - this.dockedBoat.x, player.y - this.dockedBoat.y);
      if (dPier < 36 || dBoat < 36) {
        ctx.font = "bold 5px monospace";
        ctx.textAlign = "center";
        const prompt = `[E] ${lang === "fil" ? "Sumakay sa Bangka ⛵" : "Board Boat ⛵"}`;
        const tw = ctx.measureText(prompt).width + 6;
        ctx.fillStyle = "rgba(3, 6, 17, 0.85)";
        ctx.fillRect(this.dockedBoat.x + 10 - tw / 2, this.dockedBoat.y - 18, tw, 7);
        ctx.fillStyle = "#00f0ff";
        ctx.fillText(prompt, this.dockedBoat.x + 10, this.dockedBoat.y - 13);
      }
    }

    // 4. PLAYER IN BOAT
    if (player && player.inBoat) {
      const bob = Math.sin(t * 0.08) * 1.5;
      this.drawBoatSprite(ctx, player.x, player.y + 2 + bob, true);

      // Prompt to disembark when close to the shore/pier
      const dPier = Math.hypot(player.x + 10 - this.pier.x, player.y + 18 - this.pier.y);
      if (dPier < 45) {
        ctx.font = "bold 5px monospace";
        ctx.textAlign = "center";
        const prompt = `[E] ${lang === "fil" ? "Bumaba sa Lupa" : "Disembark"}`;
        const tw = ctx.measureText(prompt).width + 6;
        ctx.fillStyle = "rgba(3, 6, 17, 0.85)";
        ctx.fillRect(player.x + 10 - tw / 2, player.y - 24, tw, 7);
        ctx.fillStyle = "#ffd166";
        ctx.fillText(prompt, player.x + 10, player.y - 19);
      }
    }

    // 5. CELESTIAL MONOLITH PROMPT
    // The pillar itself (with its chains) is drawn by the coast platform's landmark (js/world/platforms.js);
    // only the prompt and the Sea Portal are drawn here.
    {
      const m = this.monolith;

      // Prompt above the slanted top of the pillar
      if (player) {
        const dMon = Math.hypot(player.x - m.x, player.y - m.y);
        if (dMon < 60) {
          ctx.font = "bold 5px monospace";
          ctx.textAlign = "center";
          let promptText = "";
          let promptColor = "#ffd166";
          const held = this.sealsHeld(player), need = this.seals.length;

          if (this.chained) {
            promptText = lang === "fil" ? "⛓ Nakagapos — talunin ang Leviathan Regent" : "⛓ Chained — defeat the Leviathan Regent";
            promptColor = "#ef4444";
          } else if (!m.activated) {
            promptText = held < need
              ? (lang === "fil" ? `Seal Stones ${held}/${need} — hanapin ang iba` : `Seal Stones ${held}/${need} — find the rest`)
              : `[E] ${lang === "fil" ? "Ilagay ang apat na Seal Stone" : "Place the four Seal Stones"}`;
            promptColor = held < need ? "#facc15" : "#38bdf8";
          } else {
            promptText = lang === "fil" ? "✨ Bukas ang Portal sa Dark Continent" : "✨ Dark Continent Portal Active";
            promptColor = "#4ade80";
          }

          const tw = ctx.measureText(promptText).width + 6;
          ctx.fillStyle = "rgba(3, 6, 17, 0.85)";
          ctx.fillRect(m.x - tw / 2, m.y - 56, tw, 7);
          ctx.fillStyle = promptColor;
          ctx.fillText(promptText, m.x, m.y - 51);
        }
      }

      // 6. CELESTIAL SEA PORTAL (ONCE OPEN)
      if (this.seaPortal.active) {
        const sp = this.seaPortal;
        const spPulse = 0.5 + Math.sin(t * 0.1) * 0.5;

        // Swirling Portal Aura
        const g = ctx.createRadialGradient(sp.x, sp.y, 2, sp.x, sp.y, 18 + spPulse * 4);
        g.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        g.addColorStop(0.3, "rgba(56, 189, 248, 0.75)");
        g.addColorStop(0.7, "rgba(157, 78, 221, 0.55)");
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 20 + spPulse * 4, 0, Math.PI * 2);
        ctx.fill();

        // Rings
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.6 + spPulse * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(sp.x, sp.y, 14, 8 + spPulse * 2, t * 0.05, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = "bold 5px monospace";
        ctx.fillStyle = "#ffd166";
        ctx.textAlign = "center";
        ctx.fillText(lang === "fil" ? "DARK CONTINENT" : "DARK CONTINENT", sp.x, sp.y - 16);
      }
    }

    ctx.restore();
  }

  // Draws the wooden skiff sprite
  drawBoatSprite(ctx, x, y, withSails = false) {
    ctx.save();
    const bx = x + 10, by = y + 16;

    // Boat Shadow
    ctx.fillStyle = "rgba(0, 20, 40, 0.4)";
    ctx.beginPath();
    ctx.ellipse(bx, by + 4, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden Hull
    ctx.fillStyle = "#5c3d2e";
    ctx.beginPath();
    ctx.moveTo(bx - 14, by - 2);
    ctx.quadraticCurveTo(bx, by + 9, bx + 14, by - 2);
    ctx.lineTo(bx + 11, by - 5);
    ctx.quadraticCurveTo(bx, by - 3, bx - 11, by - 5);
    ctx.closePath();
    ctx.fill();

    // Hull Trim & Gunwale
    ctx.strokeStyle = "#8d5b4c";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Inner Hull Floor
    ctx.fillStyle = "#3e2723";
    ctx.beginPath();
    ctx.ellipse(bx, by - 3, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Small Mast & Sail
    if (withSails) {
      // Wooden Mast
      ctx.fillStyle = "#4e342e";
      ctx.fillRect(bx - 1, by - 16, 2, 13);

      // White Canvas Sail
      const billow = Math.sin(this.tick * 0.1) * 2;
      ctx.fillStyle = "rgba(245, 245, 240, 0.9)";
      ctx.beginPath();
      ctx.moveTo(bx, by - 15);
      ctx.quadraticCurveTo(bx + 8 + billow, by - 10, bx, by - 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#d7ccc8";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Golden Crest on Sail
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(bx + 2 + billow * 0.5, by - 11, 2, 2);
    }

    ctx.restore();
  }
}
