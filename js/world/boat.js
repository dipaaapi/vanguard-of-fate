import { Sound } from "../audio.js";
import { getLang } from "../i18n.js";

// ==================== BOAT SAILING & SEA MONOLITH SYSTEM ====================
// Nagbibigay-daan sa bayani na sumakay sa bangka sa dulo ng batong daan ng Cerulean Abyss,
// maglayag sa malawak na karagatan, makipaglaban sa mga halimaw sa tubig, talunin ang
// Sea MVP Boss (Leviathan Overlord), at i-activate ang Sunken Monolith upang buksan ang
// Celestial Portal patungo sa Ikalawang Kontinente: Ang Dark Continent!
// Ang lokasyon ng pier, bangka, monolith at portal ay nasa def.boat ng platform (js/world/platforms.js).

export class BoatSystem {
  constructor(stage, spots) {
    this.stage = stage;
    this.tick = 0;

    // Pier at nakadaong na Bangka
    this.pier = { w: 26, h: 18, ...spots.pier };
    this.dockedBoat = { ...spots.dockedBoat };

    // Sinaunang Monolith sa Karagatan
    this.monolith = { ...spots.monolith, radius: 26, activated: false, pulseTick: 0 };

    // Portal patungo sa Dark Continent (bubukas kapag na-activate ang monolith)
    this.seaPortal = { ...spots.seaPortal, active: false, radius: 20 };

    // MVP Sea Boss tracking
    this.mvpSpawned = false;
    this.mvpDefeated = false;
    this.mvpEnemy = null;

    // Wake particle trail habang naglalayag
    this.wakes = [];
  }

  // Sinusuri kung ang posisyon ay nasa tubig/karagatan
  isWaterAt(px, py) {
    if (!this.stage) return false;
    if (this.stage.tilemap && this.stage.tilemap.liquid) {
      const tx = Math.floor(px / 16), ty = Math.floor(py / 16);
      const idx = ty * this.stage.tilemap.cols + tx;
      return Boolean(this.stage.tilemap.liquid[idx]);
    }
    return false;
  }

  // Sa tubig lang puwede ang bangka: kapag tumama sa lupa, dumudulas sa baybayin o ibinabalik
  // sa huling posisyon sa tubig (sinusuri ang gitna ng katawan ng bangka)
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

  // Sumakay o bumaba sa bangka
  toggleBoard(player, fx = null) {
    if (!player) return;

    if (player.inBoat) {
      // Mag-disembark: subukang bumaba sa pinakamalapit na tuyong lupa / pier
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
      // Sumakay sa bangka
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

  // Pag-activate sa Monolith pagkatapos mapatay ang MVP Sea Boss
  activateMonolith(player, fx = null, onOpenDarkContinent = null) {
    if (this.monolith.activated) return false;
    const lang = getLang() === "fil" ? "fil" : "en";

    if (!this.mvpDefeated) {
      if (fx && fx.spawnDamagePopup) {
        const msg = lang === "fil"
          ? "🔒 Selyado! Talunin muna ang MVP Leviathan Overlord!"
          : "🔒 Sealed! Slay the MVP Leviathan Overlord first!";
        fx.spawnDamagePopup(this.monolith.x, this.monolith.y - 20, msg, false, "#ef4444");
      }
      return false;
    }

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

  update(player, enemyManager, fx, onWarp) {
    this.tick++;

    // 1. Spawning ng Sea MVP Boss (Leviathan Overlord) kapag malapit sa Monolith
    if (!this.mvpSpawned && !this.mvpDefeated && enemyManager && player) {
      const dToMonolith = Math.hypot(player.x - this.monolith.x, player.y - this.monolith.y);
      if (dToMonolith < 220) {
        this.mvpSpawned = true;
        // Mag-spawn ng MVP Sea Boss
        if (enemyManager.spawnAt) {
          this.mvpEnemy = enemyManager.spawnAt("leviathan", this.monolith.x + 35, this.monolith.y - 15, "mvp");
          if (this.mvpEnemy) {
            this.mvpEnemy.isMVP = true;
            this.mvpEnemy.customTitle = {
              en: "✦ MVP LEVIATHAN OVERLORD ✦",
              fil: "✦ MVP PANGINOON NG KALALIMAN ✦"
            };
            if (fx && fx.spawnDamagePopup) {
              const lang = getLang() === "fil" ? "fil" : "en";
              const alert = lang === "fil"
                ? "⚠️ NAGISING ANG MVP LEVIATHAN OVERLORD!"
                : "⚠️ MVP LEVIATHAN OVERLORD AWAKENED!";
              fx.spawnDamagePopup(this.mvpEnemy.x + 10, this.mvpEnemy.y - 25, alert, true, "#ef4444");
            }
          }
        }
      }
    }

    // 2. Pagsubaybay kung napatay na ang MVP
    if (this.mvpSpawned && !this.mvpDefeated) {
      if (this.mvpEnemy && !this.mvpEnemy.isAlive) {
        this.mvpDefeated = true;
        const lang = getLang() === "fil" ? "fil" : "en";
        if (fx && fx.spawnDamagePopup) {
          const msg = lang === "fil"
            ? "👑 NATALO ANG MVP! Maaari nang buksan ang Monolith!"
            : "👑 MVP DEFEATED! The Ancient Monolith can now be activated!";
          const px = player ? player.x + 10 : this.monolith.x;
          const py = player ? player.y - 15 : this.monolith.y - 15;
          fx.spawnDamagePopup(px, py, msg, true, "#4ade80");
        }
      }
    }

    // 3. Bangka wake trail kapag naglalayag
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

  // Pagguhit ng Pier, Bangka, Monolith, at Sea Portal
  draw(ctx, player) {
    ctx.save();
    const t = this.tick;
    const lang = getLang() === "fil" ? "fil" : "en";

    // 1. WAKES SA TUBIG
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

    // 3. DOCKED BOAT (kapag hindi sakay ng player)
    if (player && !player.inBoat) {
      this.drawBoatSprite(ctx, this.dockedBoat.x, this.dockedBoat.y, 0, false);
      // Prompt kapag malapit sa nakadaong na bangka o pier
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
      this.drawBoatSprite(ctx, player.x, player.y + 2 + bob, player.dir === "side" ? (player.facing === "left" ? -1 : 1) : 0, true);

      // Prompt para bumaba sa bangka kapag malapit sa baybayin/pier
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

    // 5. PROMPT NG CELESTIAL MONOLITH
    // Ang haligi mismo ay iginuguhit ng landmark ng platform (js/world/platforms.js, coast);
    // dito ang prompt at ang Sea Portal lamang.
    {
      const m = this.monolith;

      // Monolith Label & Prompt (sa itaas ng hilig na tuktok ng haligi)
      if (player) {
        const dMon = Math.hypot(player.x - m.x, player.y - m.y);
        if (dMon < 60) {
          ctx.font = "bold 5px monospace";
          ctx.textAlign = "center";
          let promptText = "";
          let promptColor = "#ffd166";

          if (!this.mvpDefeated) {
            promptText = lang === "fil" ? "⚔️ Talunin ang MVP Leviathan Overlord!" : "⚔️ Defeat MVP Leviathan Overlord!";
            promptColor = "#ef4444";
          } else if (!m.activated) {
            promptText = `[E] ${lang === "fil" ? "I-activate ang Monolith" : "Activate Monolith"}`;
            promptColor = "#38bdf8";
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

      // 6. CELESTIAL SEA PORTAL (KAPAG NAKABUKAS NA)
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

  // Pagguhit ng Wood Skiff / Boat Sprite
  drawBoatSprite(ctx, x, y, facingSign = 0, withSails = false) {
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
