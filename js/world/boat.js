import { Sound } from "../audio.js";
import { getLang, t as tr } from "../i18n.js";

// ==================== BOAT SAILING & SEA MONOLITH SYSTEM ====================
// Lets the hero board a boat at the end of the Cerulean Abyss causeway, sail the open sea and reach
// the Celestial Monolith. The Leviathan Regent's defeat breaks the chains around the monolith;
// placing all four Seal Stones then awakens it and opens the only portal to the Dark Continent.
// Pier, boat, monolith and portal positions come from the platform's def.boat (js/world/platforms.js).
//
// The ship is about 90 px long and faces the way it sails: east or west (side view, the hero at the
// helm in the stern, the bow ahead), north (seen from astern, the hero at the helm nearest the camera)
// or south (seen from ahead, the hero at the bow nearest the camera). Moving diagonally keeps the
// current heading if it is one of the two. Side-view ship-local coordinates: u along the deck from the
// helm toward the bow, v down the screen from the hero's feet. Facing north or south the hull lies
// above the hero's feet, so (x, y) offsets are used. The crew (mercenaries, summons, pets, familiars:
// anything with x / y, optional flying, footX / footY) take the posts below while the hero sails.

const HULL_SAMPLES = [-12, 10, 32, 54, 74];                       // u of the hull points that must float
const DECK_POSTS = [[20, -3], [36, -1], [52, -3], [12, -1], [62, -1], [28, -4], [44, -4], [6, -4]];
const AIR_POSTS = [[28, -57], [-8, -30], [60, -26], [12, -44]];   // crow's nest, over the stern, over the bow, yard
const LAND_SPOTS = [[-16, 6], [16, 6], [-8, 14], [8, 14], [-24, -2], [24, -2], [0, 18], [-28, 12]];

// Facing north / south: hull sample points, deck and air posts as (x, y) from the hero's feet
const UPRIGHT = {
  N: {
    hull: [[-10, 6], [10, 6], [-11, -14], [11, -14], [-11, -34], [11, -34], [-6, -52], [6, -52], [0, -62]],
    deck: [[-8, -6], [8, -6], [-8, -13], [8, -13], [-8, -20], [8, -20], [0, -24], [0, -14]],
    air: [[0, -66], [-16, -34], [16, -34], [0, -86]]
  },
  S: {
    hull: [[-6, 10], [6, 10], [-11, -6], [11, -6], [-11, -26], [11, -26], [-10, -46], [10, -46], [0, -52]],
    deck: [[-6, -10], [6, -10], [-8, -17], [8, -17], [-8, -24], [8, -24], [0, -20], [0, -27]],
    air: [[0, -60], [-16, -30], [16, -30], [0, -80]]
  }
};
const HEADINGS = ["E", "W", "N", "S"];
const sideOf = (h) => (h === "E" ? 1 : h === "W" ? -1 : 0);
const headingOf = (b) => (HEADINGS.includes(b.heading) ? b.heading : b.dir === 1 ? "E" : "W");
const TURN_GAP = 10;     // frames between two turns, so a diagonal course doesn't flicker

export class BoatSystem {
  constructor(stage, spots) {
    this.stage = stage;
    this.tick = 0;

    // Pier and the moored boat
    this.pier = { w: 26, h: 18, ...spots.pier };
    this.dockedBoat = { dir: -1, ...spots.dockedBoat };
    this.dockedBoat.heading = headingOf(this.dockedBoat);
    this.home = { ...this.dockedBoat };        // its berth at the pier
    this.heading = this.dockedBoat.heading;    // the sailing ship's heading: E, W, N or S
    this.turnWait = 0;
    this.landing = null;                // where E steps ashore while sailing (refreshed by carry)
    this.crewCount = 0;

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

  // Whether a position is on open water the ship can sail (not the fog or smoke at the map's edge)
  isWaterAt(px, py) {
    const tm = this.stage && this.stage.tilemap;
    if (!tm || !tm.liquid) return false;
    const tx = Math.floor(px / 16), ty = Math.floor(py / 16);
    if (tx < 0 || ty < 0 || tx >= tm.cols || ty >= tm.rows) return false;
    const i = ty * tm.cols + tx;
    return Boolean(tm.liquid[i]) && !(tm.edge && tm.edge[i]);
  }

  // Dry ground the hero can stand on (not water, not a wall)
  isLandAt(px, py) {
    const tm = this.stage && this.stage.tilemap;
    if (!tm || !tm.liquid) return false;
    const tx = Math.floor(px / 16), ty = Math.floor(py / 16);
    if (tx < 0 || ty < 0 || tx >= tm.cols || ty >= tm.rows) return false;
    const i = ty * tm.cols + tx;
    return !tm.liquid[i] && !(tm.solid && tm.solid[i]);
  }

  // The points of the hull that must be on water, with the hero's feet (fx, fy) at the helm
  hullPoints(fx, fy, heading) {
    const d = sideOf(heading);
    if (d) return HULL_SAMPLES.flatMap((u) => [[fx + d * u, fy - 5], [fx + d * u, fy + 8]]);
    return UPRIGHT[heading].hull.map(([x, y]) => [fx + x, fy + y]);
  }

  hullWet(fx, fy, heading) {
    return this.hullPoints(fx, fy, heading).every(([x, y]) => this.isWaterAt(x, y));
  }

  // Middle of the hull (the ship turns about it when it can't turn about the helm)
  hullCenter(fx, fy, heading) {
    const d = sideOf(heading);
    return d ? [fx + d * 31, fy + 1] : [fx, fy - 24];
  }

  // The heading the hero is steering: the axis they move along (a diagonal keeps the current heading)
  wantedHeading(dx, dy) {
    const h = Math.abs(dx) > 0.2 ? (dx > 0 ? "E" : "W") : null;
    const v = Math.abs(dy) > 0.2 ? (dy > 0 ? "S" : "N") : null;
    if (!h && !v) return this.heading;
    if (this.heading === h || this.heading === v) return this.heading;
    if (!h) return v;
    if (!v) return h;
    return Math.abs(dy) > Math.abs(dx) ? v : h;
  }

  // Turn to a new heading: about the helm if the hull fits there, otherwise about the middle of the
  // hull (the hero walks to the new helm). Returns false when there is no room to swing the ship.
  turn(p, want) {
    const fx = p.x + 10, fy = p.y + 21;
    if (this.hullWet(fx, fy, want)) { this.heading = want; return true; }
    const [cx, cy] = this.hullCenter(fx, fy, this.heading);
    const [nx, ny] = this.hullCenter(0, 0, want);
    for (const [ox, oy] of [[0, 0], [0, -8], [0, 8], [-8, 0], [8, 0]]) {
      const hx = cx - nx + ox, hy = cy - ny + oy;
      if (this.hullWet(hx, hy, want)) {
        p.x = hx - 10;
        p.y = hy - 21;
        this.heading = want;
        return true;
      }
    }
    return false;
  }

  // The ship only floats on water: it turns to face the way it sails when there is room to swing,
  // and running aground it slides along the shore or is put back at its last position on water.
  keepAfloat(p) {
    const last = this.lastWet || { x: p.x, y: p.y };
    if (this.turnWait > 0) this.turnWait--;
    const want = this.wantedHeading(p.x - last.x, p.y - last.y);
    if (want !== this.heading && !this.turnWait && this.turn(p, want)) this.turnWait = TURN_GAP;
    const fx = p.x + 10, fy = p.y + 21;
    if (this.hullWet(fx, fy, this.heading)) {
      this.lastWet = { x: p.x, y: p.y };
      return;
    }
    if (this.hullWet(fx, last.y + 21, this.heading)) p.y = last.y;
    else if (this.hullWet(last.x + 10, fy, this.heading)) p.x = last.x;
    else { p.x = last.x; p.y = last.y; }
  }

  // Nearest dry spot beside the ship to step ashore (hero coordinates), or null out at sea
  findLanding(p) {
    const fx = p.x + 10, fy = p.y + 21;
    const pier = this.pier;
    if (Math.hypot(fx - pier.x, fy - pier.y) < 55) {
      // The pier leads onto the causeway: land at the first dry tile past it
      for (let d = 0; d <= 64; d += 8) {
        if (this.isLandAt(pier.x + pier.w + d, pier.y + pier.h / 2)) return { x: pier.x + pier.w + d - 10, y: pier.y + pier.h / 2 - 21 };
      }
      return { x: pier.x + 8 - 10, y: pier.y + 8 - 21 };
    }
    // Around the helm first, then along the whole hull
    const [cx, cy] = this.hullCenter(fx, fy, this.heading);
    for (const [ax, ay] of [[fx, fy], [cx, cy]]) {
      for (const r of [20, 30, 42]) {
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2;
          const x = ax + Math.cos(a) * r, y = ay + Math.sin(a) * r * 0.8;
          if (this.isLandAt(x, y) && this.isLandAt(x, y - 6)) return { x: x - 10, y: y - 21 };
        }
      }
    }
    return null;
  }

  // Land the hero can walk from (not a pocket cut off by water or cliffs); true when unknown
  reachable(x, y) {
    const tm = this.stage && this.stage.tilemap;
    return !tm || !tm.isReachable || tm.isReachable(x, y);
  }

  // E works next to the moored ship or the pier (boarding), or near any shore while sailing (landing)
  canToggle(player) {
    if (!player) return false;
    if (player.inBoat) return Boolean(this.landing);
    const fx = player.x + 10, fy = player.y + 21;
    if (Math.hypot(fx - this.pier.x, fy - this.pier.y) < 45) return true;
    return this.nearDockedShip(fx, fy);
  }

  nearDockedShip(fx, fy) {
    const b = this.dockedBoat, sx = b.x + 10, sy = b.y + 21, h = headingOf(b), d = sideOf(h);
    if (!d) {
      // Facing north / south: distance to the keel line above the helm
      const y = Math.max(sy - 62, Math.min(sy + 10, fy));
      return Math.hypot(fx - sx, fy - y) < 26;
    }
    // distance to the deck line from the stern to the bow
    const u = Math.max(-14, Math.min(76, (fx - sx) * d));
    return Math.hypot(fx - (sx + u * d), fy - sy) < 30;
  }

  // The ship goes back to the pier (after the hero leaves the Cerulean Abyss by the sea portal, or when
  // it is moored somewhere the hero can no longer walk to)
  returnToPier() {
    this.dockedBoat = { ...this.home };
    this.heading = headingOf(this.dockedBoat);
  }

  // Arriving on foot (main.js travelTo): a ship moored where no shore can be walked to sails home
  checkMooring() {
    const b = this.dockedBoat;
    if (b.x === this.home.x && b.y === this.home.y) return;
    const fx = b.x + 10, fy = b.y + 21;
    for (const r of [20, 30, 42]) {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const x = fx + Math.cos(a) * r, y = fy + Math.sin(a) * r * 0.8;
        if (this.isLandAt(x, y) && this.reachable(x, y)) return;
      }
    }
    this.returnToPier();
  }

  // Board or leave the ship. crew = every companion travelling with the hero (mercenaries, summons,
  // pets, familiars): they board and land together with the hero.
  toggleBoard(player, fx = null, crew = []) {
    if (!player) return;
    const pop = (key, color) => {
      if (fx && fx.spawnDamagePopup) fx.spawnDamagePopup(player.x + 10, player.y - 10, tr(key), false, color);
    };

    if (player.inBoat) {
      const spot = this.landing || this.findLanding(player);
      if (!spot) return;
      // The ship stays moored where the hero left it
      this.dockedBoat = { x: player.x, y: player.y, heading: this.heading };
      player.inBoat = false;
      player.x = spot.x;
      player.y = spot.y;
      this.landing = null;
      this.landCrew(player, crew);
      if (Sound && Sound.playSelectMove) Sound.playSelectMove();
      pop("boatAshore", "#38bdf8");
    } else {
      this.embark(player, crew);
      if (Sound && Sound.playHolyBurst) Sound.playHolyBurst();
      pop("boatSetSail", "#00f0ff");
    }
  }

  // The hero takes the helm of the moored ship (boarding, or a save made at sea)
  embark(player, crew = []) {
    player.inBoat = true;
    player.x = this.dockedBoat.x;
    player.y = this.dockedBoat.y;
    this.heading = headingOf(this.dockedBoat);
    this.lastWet = { x: player.x, y: player.y };
    this.turnWait = 0;
    this.carry(player, crew);
  }

  // Ship state for the save: where it is moored (or sailing) and its heading
  serialize(player) {
    const b = player && player.inBoat ? { x: player.x, y: player.y, heading: this.heading } : this.dockedBoat;
    return { x: Math.round(b.x), y: Math.round(b.y), heading: headingOf(b), aboard: Boolean(player && player.inBoat) };
  }

  // From a save: only a spot on open water inside the map is accepted (the pier otherwise)
  load(data) {
    if (!data || !Number.isFinite(data.x) || !Number.isFinite(data.y)) return false;
    const heading = HEADINGS.includes(data.heading) ? data.heading : "W";
    if (!this.hullWet(data.x + 10, data.y + 21, heading)) { this.returnToPier(); return false; }
    this.dockedBoat = { x: data.x, y: data.y, heading };
    this.heading = heading;
    return true;
  }

  // Crew step off around the hero; flyers are free again
  landCrew(player, crew) {
    let g = 0;
    crew.forEach((c) => {
      c.aboard = false;
      const [ox, oy] = c.flying ? [-18 + (g % 2) * 36, -18] : LAND_SPOTS[g % LAND_SPOTS.length];
      if (!c.flying) g++;
      this.place(c, player.x + 10 + ox, player.y + 21 + oy);
    });
  }

  // Puts an entity's feet (or a flyer's perch point) at (wx, wy)
  place(c, wx, wy) {
    c.x = wx - (c.footX ?? 8);
    c.y = wy - (c.footY ?? 15);
  }

  // A crew post (deck or rigging) as a point on the map, for the current heading
  post(fx, fy, k, flying) {
    const d = sideOf(this.heading);
    if (d) {
      const [u, v] = flying ? AIR_POSTS[k % AIR_POSTS.length] : DECK_POSTS[k % DECK_POSTS.length];
      return [fx + d * u, fy + v];
    }
    const set = UPRIGHT[this.heading][flying ? "air" : "deck"];
    const [x, y] = set[k % set.length];
    return [fx + x, fy + y];
  }

  // Every frame while sailing (after everyone has moved): the ship stays afloat and the crew keep
  // their posts on deck. Flyers perch on the rigging: they can't leave the ship while the crew is aboard.
  carry(player, crew = []) {
    if (!player || !player.inBoat) return;
    this.keepAfloat(player);
    const fx = player.x + 10, fy = player.y + 21;
    let g = 0, a = 0;
    crew.forEach((c) => {
      if (!c) return;
      const [wx, wy] = c.flying ? this.post(fx, fy, a++, true) : this.post(fx, fy, g++, false);
      c.aboard = true;
      this.place(c, wx, wy);
      if ("vx" in c) { c.vx = 0; c.vy = 0; }
    });
    this.crewCount = crew.length;
    this.landing = this.findLanding(player);
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

    if (player && player.inBoat) {
      const last = this.prev || player;
      const speed = Math.hypot(player.x - last.x, player.y - last.y);
      this.prev = { x: player.x, y: player.y };
      this.speed = speed;
      // Wake behind the stern and spray off the bow while under way
      if (speed > 0.3 && this.tick % 3 === 0) {
        const fx = player.x + 10, fy = player.y + 21;
        const d = sideOf(this.heading), r = Math.random();
        if (d) {
          this.wakes.push({ x: fx - d * 14, y: fy + 12, radius: 3, alpha: 0.7, life: 30 });
          this.wakes.push({ x: fx + d * (70 + r * 6), y: fy + 8 + r * 4, radius: 1.5, alpha: 0.6, life: 14 });
        } else {
          // Wake off the stern and spray at the bow: astern is nearest the camera facing north
          const [stern, bow] = this.heading === "N" ? [fy + 16, fy - 64] : [fy - 56, fy + 18];
          this.wakes.push({ x: fx - 4 + r * 8, y: stern, radius: 3, alpha: 0.7, life: 30 });
          this.wakes.push({ x: fx - 3 + r * 6, y: bow, radius: 1.5, alpha: 0.6, life: 14 });
        }
      }

      // Sea Portal Collision
      if (this.seaPortal.active && onWarp) {
        const dPortal = Math.hypot(player.x + 10 - this.seaPortal.x, player.y + 18 - this.seaPortal.y);
        if (dPortal < 22 && (!player.portalCooldown || player.portalCooldown <= 0)) {
          player.portalCooldown = 90;
          onWarp({ id: "DARK_CONTINENT_PORTAL", dest: "dark_continent", color: "#9d4edd" });
        }
      }
    } else {
      this.prev = null;
      this.speed = 0;
    }

    this.wakes.forEach((w) => {
      w.radius += 0.3;
      w.alpha -= 0.025;
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

    // 3. THE SHIP (moored with its sails furled, or under sail with the hero at the helm).
    //    Back half here; the near bulwark, hull side and prompts in drawFront, after the characters.
    this.drawShipBack(ctx, this.shipPose(player));

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

  // Where the ship is: at the hero's feet while sailing, otherwise where it is moored
  shipPose(player) {
    if (player && player.inBoat) return { fx: player.x + 10, fy: player.y + 21, heading: this.heading, dir: sideOf(this.heading), sailing: true };
    const b = this.dockedBoat, heading = headingOf(b);
    return { fx: b.x + 10, fy: b.y + 21, heading, dir: sideOf(heading), sailing: false };
  }

  // Far bulwark, deck, stern cabin, helm, mast, rigging and sails (behind the crew)
  drawShipBack(ctx, pose) {
    if (!pose.dir) { this.drawUprightBack(ctx, pose); return; }
    const { fx, fy, dir, sailing } = pose;
    const t = this.tick;
    ctx.save();
    ctx.translate(Math.round(fx), Math.round(fy));
    ctx.scale(dir, 1);
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const poly = (pts, c) => { ctx.fillStyle = c; tracePath(ctx, pts); ctx.fill(); };
    const line = (pts, c, w = 1) => {
      ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    };

    // Shadow on the water
    ctx.fillStyle = "rgba(0, 18, 40, 0.38)";
    ctx.beginPath();
    ctx.ellipse(32, 15, 54, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Far bulwark (its inside face), rising at the stern and the bow
    poly([[-16, -14], [-2, -11], [60, -11], [80, -8], [78, -3], [62, -7], [-14, -7]], "#4a2c1a");
    line([[-16, -14.5], [-2, -11.5], [60, -11.5], [80, -8.5]], "#b07d4f");

    // Deck planks
    const deck = [[-14, -7], [62, -7], [78, -3], [62, 4], [-14, 4]];
    poly(deck, "#9a7350");
    ctx.save();
    tracePath(ctx, deck);
    ctx.clip();
    for (let y = -6, row = 0; y < 4; y += 2, row++) {
      R(-14, y, 94, 1, "#86613f");
      for (let u = -12 + (row % 2) * 7; u < 78; u += 14) R(u, y - 1, 1, 2, "#73502f");
    }
    ctx.restore();
    // Cargo hatch
    R(38, -5, 11, 5, "#5c3d24");
    R(39, -4, 9, 3, "#2e1d10");
    for (let u = 41; u < 48; u += 3) R(u, -4, 1, 3, "#5c3d24");

    // Stern cabin behind the helm, its windows lit
    R(-19, -26, 16, 2, "#3e2716");
    R(-18, -24, 14, 17, "#6b4428");
    R(-18, -24, 14, 1, "#8a5a34");
    R(-18, -16, 14, 1, "#5a3820");
    const lit = 0.75 + 0.25 * Math.sin(t * 0.13);
    ctx.globalAlpha = lit;
    R(-16, -21, 3, 3, "#ffd166");
    R(-10, -21, 3, 3, "#ffd166");
    ctx.globalAlpha = 1;
    R(-13, -14, 4, 7, "#2e1d10");
    // Stern lantern on its post, with a warm halo
    R(-21, -33, 1, 10, "#3e2716");
    R(-23, -31, 5, 5, "#8a6a2a");
    R(-22, -30, 3, 3, "#ffe9a8");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const halo = ctx.createRadialGradient(-20.5, -28.5, 1, -20.5, -28.5, 12);
    halo.addColorStop(0, `rgba(255, 200, 110, ${0.35 * lit})`);
    halo.addColorStop(1, "rgba(255, 200, 110, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(-33, -41, 25, 25);
    ctx.restore();

    // Ship's wheel beside the helm
    R(5, -9, 2, 6, "#4a2c1a");
    ctx.strokeStyle = "#7a5232";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(6, -11, 3.5, 0, Math.PI * 2);
    ctx.stroke();
    R(6, -16, 1, 10, "#7a5232");
    R(1, -11, 10, 1, "#7a5232");

    // Mast, crow's nest, yard and stays
    R(27, -66, 3, 62, "#5a3a22");
    R(27, -66, 1, 62, "#7a5232");
    line([[28, -64], [-20, -32]], "rgba(36, 24, 14, 0.85)");
    line([[29, -64], [92, -13]], "rgba(36, 24, 14, 0.85)");
    line([[27, -52], [8, -8]], "rgba(36, 24, 14, 0.6)");
    line([[30, -52], [50, -8]], "rgba(36, 24, 14, 0.6)");
    R(12, -51, 34, 2, "#4a2c1a");
    // Bowsprit and a gilded figurehead
    line([[72, -4], [93, -14]], "#5a3a22", 2);
    R(77, -7, 3, 4, "#e0b44c");
    R(78, -8, 2, 1, "#fde68a");

    if (sailing) {
      // Jib between the forestay and the bowsprit
      const jb = Math.sin(t * 0.09) * 1.5;
      poly([[32, -60], [88, -14], [54 + jb, -15]], "#e9dfc6");
      line([[32, -60], [54 + jb, -15]], "#cbbd98");
      // Main sail, bellied toward the bow by the wind
      const b = 3 + Math.sin(t * 0.08) * 1.5;
      const sail = new Path2D();
      sail.moveTo(13, -49);
      sail.lineTo(45, -49);
      sail.quadraticCurveTo(45 + b * 2, -34, 45, -19);
      sail.lineTo(13, -19);
      sail.quadraticCurveTo(13 + b, -34, 13, -49);
      ctx.fillStyle = "#efe6cf";
      ctx.fill(sail);
      ctx.save();
      ctx.clip(sail);
      for (let u = 19; u < 50; u += 6) R(u, -49, 1, 30, "#ddd0ae");
      R(10, -24, 46, 5, "rgba(150, 120, 80, 0.18)");
      R(10, -49, 46, 2, "rgba(255, 255, 255, 0.4)");
      ctx.restore();
      // The Vanguard crest: a blue shield with a golden star
      poly([[24, -42], [35, -42], [35, -33], [29.5, -28], [24, -33]], "#e0b44c");
      poly([[25, -41], [34, -41], [34, -33.5], [29.5, -29.5], [25, -33.5]], "#1e3a8a");
      R(29, -39, 1, 7, "#ffd166");
      R(26, -36, 7, 1, "#ffd166");
      R(28, -37, 3, 3, "#ffd166");
      R(13, -19, 32, 1, "#4a2c1a");
    } else {
      // Sails furled on the yard
      R(13, -50, 32, 4, "#e0d6bc");
      R(13, -47, 32, 1, "#c4b48c");
      for (let u = 17; u < 44; u += 7) R(u, -50, 1, 4, "#8a6a40");
    }
    // Crow's nest (drawn over the sails' top so a perched flyer sits in it)
    R(23, -58, 11, 4, "#6b4428");
    R(23, -58, 11, 1, "#b07d4f");
    R(24, -55, 9, 1, "#4a2c1a");

    // Pennant at the masthead, streaming back over the stern
    const wave = Math.round(Math.sin(t * (sailing ? 0.22 : 0.08)) * 1.5);
    poly([[29, -71], [29, -66], [17, -68 + wave], [13, -69 + wave]], "#dc2626");
    poly([[29, -71], [29, -69], [17, -69 + wave]], "#ffd166");
    R(28, -72, 2, 2, "#e0b44c");

    ctx.restore();
  }

  // Near bulwark, hull side and waterline over the crew's feet, then the prompts
  drawFront(ctx, player) {
    const pose = this.shipPose(player);
    if (pose.dir) this.drawSideFront(ctx, pose);
    else this.drawUprightFront(ctx, pose);
    const { fx, fy } = pose;

    // Prompts
    if (!player) return;
    if (player.inBoat) {
      if (this.landing) this.prompt(ctx, fx, fy - (pose.dir ? 46 : 96), `[E] ${tr("boatGoAshore")}`, "#ffd166");
    } else if (this.canToggle(player)) {
      const [cx] = this.hullCenter(fx, fy, pose.heading);
      this.prompt(ctx, cx, fy - (pose.dir ? 80 : 98), `[E] ${tr("boatBoard")}`, "#00f0ff");
    }
  }

  // Side view (east / west): near bulwark, hull side and waterline over the crew's feet
  drawSideFront(ctx, { fx, fy, dir, sailing }) {
    const t = this.tick;
    ctx.save();
    ctx.translate(Math.round(fx), Math.round(fy));
    ctx.scale(dir, 1);
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const poly = (pts, c) => { ctx.fillStyle = c; tracePath(ctx, pts); ctx.fill(); };

    // Water lapping against the hull below the waterline
    poly([[-14, 11], [66, 11], [74, 8], [70, 16], [-10, 17]], "rgba(30, 90, 160, 0.5)");

    // Hull side: gilded wale, painted band, planks and lit portholes
    poly([[-15, 4], [64, 4], [83, -2], [80, 4], [66, 13], [-9, 15], [-15, 10]], "#5a3820");
    R(-15, 4, 79, 1, "#e0b44c");
    R(-15, 6, 77, 2, "#1e3a5f");
    R(-14, 11, 76, 1, "#4a2c1a");
    for (const u of [4, 20, 36, 52]) {
      R(u, 8, 3, 3, "#2a1a10");
      R(u + 1, 9, 1, 1, "#ffd166");
    }
    R(-15, 4, 2, 7, "#7a5232");

    // Near bulwark: hides the crew's feet so they stand inside the ship
    poly([[-16, -4], [-2, -2], [62, -2], [81, -7], [83, -2], [64, 4], [-15, 4]], "#6b4428");
    ctx.strokeStyle = "#c08a58";
    ctx.lineWidth = 1;
    tracePath(ctx, [[-16, -4.5], [-2, -2.5], [62, -2.5], [81, -7.5]], false);
    ctx.stroke();
    for (let u = 0; u < 60; u += 6) R(u, -1, 1, 4, "#4a2c1a");

    // Foam along the waterline; a bow wave while under way
    const moving = sailing && this.speed > 0.3;
    for (let u = -12; u < 66; u += 5) {
      const k = Math.floor(t / 6 + u / 5) % 4;
      if (k === 0) continue;
      R(u + (k === 2 ? 1 : 0), 14 - (u > 56 ? 1 : 0) + (k === 3 ? 1 : 0), 3, 1, "rgba(220, 240, 255, 0.65)");
    }
    if (moving) {
      for (let k = 0; k < 4; k++) {
        const s = (t + k * 5) % 20;
        R(76 + s * 0.6, 4 + k * 2 - (s >> 2), 2, 1, `rgba(235, 248, 255, ${0.8 - s / 25})`);
      }
    }
    ctx.restore();
  }

  // Facing north (seen from astern) or south (seen from ahead): deck, far end, mast and sail behind
  // the crew. The hull lies above the hero's feet, so the hero at the near end is never hidden.
  drawUprightBack(ctx, { fx, fy, heading, sailing }) {
    const t = this.tick, north = heading === "N";
    ctx.save();
    ctx.translate(Math.round(fx), Math.round(fy));
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const poly = (pts, c) => { ctx.fillStyle = c; tracePath(ctx, pts); ctx.fill(); };
    const rim = north
      ? [[-12, 8], [12, 8], [14, -6], [14, -34], [10, -52], [0, -66], [-10, -52], [-14, -34], [-14, -6]]
      : [[-12, -54], [12, -54], [14, -40], [14, -14], [10, 2], [0, 16], [-10, 2], [-14, -14], [-14, -40]];
    const deck = north
      ? [[-10, 6], [10, 6], [12, -6], [12, -34], [8, -50], [0, -62], [-8, -50], [-12, -34], [-12, -6]]
      : [[-10, -52], [10, -52], [12, -40], [12, -14], [8, 0], [0, 12], [-8, 0], [-12, -14], [-12, -40]];

    // Shadow on the water, then the bulwark seen from above with its gilded rail
    ctx.fillStyle = "rgba(0, 18, 40, 0.38)";
    ctx.beginPath();
    ctx.ellipse(0, -22, 19, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    poly(rim, "#6b4428");
    ctx.strokeStyle = "#c08a58";
    ctx.lineWidth = 1;
    tracePath(ctx, rim);
    ctx.stroke();

    // Deck planks along the keel
    poly(deck, "#9a7350");
    ctx.save();
    tracePath(ctx, deck);
    ctx.clip();
    for (let x = -12, col = 0; x < 13; x += 3, col++) {
      R(x, -66, 1, 84, "#86613f");
      for (let y = -64 + (col % 2) * 7; y < 16; y += 14) R(x - 1, y, 2, 1, "#73502f");
    }
    ctx.restore();
    // Cargo hatch ahead of the mast
    const hy = north ? -44 : -12;
    R(-5, hy, 10, 6, "#5c3d24");
    R(-4, hy + 1, 8, 4, "#2e1d10");
    for (let x = -3; x < 4; x += 3) R(x, hy + 1, 1, 4, "#5c3d24");

    if (north) {
      // Bowsprit and figurehead far ahead
      R(-1, -76, 2, 12, "#5a3a22");
      R(-1, -66, 2, 3, "#e0b44c");
    } else {
      // Stern cabin at the far end, its lit windows and door facing the camera
      R(-10, -66, 20, 2, "#3e2716");
      R(-9, -64, 18, 12, "#6b4428");
      R(-9, -64, 18, 1, "#8a5a34");
      const lit = 0.75 + 0.25 * Math.sin(t * 0.13);
      ctx.globalAlpha = lit;
      R(-7, -61, 3, 3, "#ffd166");
      R(4, -61, 3, 3, "#ffd166");
      ctx.globalAlpha = 1;
      R(-2, -59, 4, 7, "#2e1d10");
      // Stern lantern on its post
      R(11, -70, 1, 12, "#3e2716");
      R(9, -72, 5, 5, "#8a6a2a");
      R(10, -71, 3, 3, "#ffe9a8");
    }

    // Ship's wheel just ahead of the helm, seen face-on
    R(-1, -10, 2, 6, "#4a2c1a");
    ctx.strokeStyle = "#7a5232";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -12, 3.5, 0, Math.PI * 2);
    ctx.stroke();
    R(0, -17, 1, 10, "#7a5232");
    R(-5, -12, 10, 1, "#7a5232");

    // Mast, yard and crow's nest
    const base = north ? -30 : -26, top = base - 52, yard = base - 30;
    R(-1, top, 3, base - top, "#5a3a22");
    R(-1, top, 1, base - top, "#7a5232");
    R(-20, yard, 40, 2, "#4a2c1a");
    if (sailing) {
      // The main sail: from astern its shaded back bellies away; from ahead its face shows the crest
      const b = 2 + Math.sin(t * 0.08) * 1.5;
      const sail = new Path2D();
      sail.moveTo(-19, yard + 1);
      sail.lineTo(19, yard + 1);
      sail.lineTo(18, yard + 20);
      sail.quadraticCurveTo(0, yard + 20 + (north ? -b : b), -18, yard + 20);
      sail.closePath();
      ctx.fillStyle = north ? "#d9cfb4" : "#efe6cf";
      ctx.fill(sail);
      ctx.save();
      ctx.clip(sail);
      for (let x = -15; x < 19; x += 6) R(x, yard, 1, 24, north ? "#c4b896" : "#ddd0ae");
      R(-20, yard + 1, 40, 2, "rgba(255, 255, 255, 0.35)");
      ctx.restore();
      if (!north) {
        const cy = yard + 5;
        poly([[-5, cy], [6, cy], [6, cy + 8], [0.5, cy + 13], [-5, cy + 8]], "#e0b44c");
        poly([[-4, cy + 1], [5, cy + 1], [5, cy + 7.5], [0.5, cy + 11.5], [-4, cy + 7.5]], "#1e3a8a");
        R(0, cy + 2, 1, 7, "#ffd166");
        R(-3, cy + 4, 7, 1, "#ffd166");
      }
    } else {
      // Sails furled on the yard
      R(-18, yard - 2, 36, 4, "#e0d6bc");
      R(-18, yard + 1, 36, 1, "#c4b48c");
      for (let x = -14; x < 18; x += 7) R(x, yard - 2, 1, 4, "#8a6a40");
    }
    R(-5, top + 8, 11, 4, "#6b4428");
    R(-5, top + 8, 11, 1, "#b07d4f");

    // Pennant at the masthead, streaming to one side
    const wave = Math.round(Math.sin(t * (sailing ? 0.22 : 0.08)) * 1.5);
    poly([[2, top - 5], [2, top], [12, top - 1 + wave], [15, top - 2 + wave]], "#dc2626");
    poly([[2, top - 5], [2, top - 3], [12, top - 2 + wave]], "#ffd166");
    R(0, top - 6, 2, 2, "#e0b44c");
    ctx.restore();
  }

  // Facing north / south: the near end of the hull (the stern transom, or the bow and its figurehead)
  // and the waterline, drawn over the crew's feet
  drawUprightFront(ctx, { fx, fy, heading, sailing }) {
    const t = this.tick, north = heading === "N";
    ctx.save();
    ctx.translate(Math.round(fx), Math.round(fy));
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const poly = (pts, c) => { ctx.fillStyle = c; tracePath(ctx, pts); ctx.fill(); };
    const moving = sailing && this.speed > 0.3;
    if (north) {
      // Stern transom: gilded rail, painted band, lit stern windows and a lantern at each quarter
      poly([[-13, 18], [13, 18], [12, 22], [-12, 22]], "rgba(30, 90, 160, 0.5)");
      poly([[-12, 8], [12, 8], [11, 18], [-11, 18]], "#5a3820");
      R(-12, 8, 24, 1, "#e0b44c");
      R(-12, 10, 24, 2, "#1e3a5f");
      const lit = 0.75 + 0.25 * Math.sin(t * 0.13);
      ctx.globalAlpha = lit;
      R(-8, 13, 3, 2, "#ffd166");
      R(-1, 13, 3, 2, "#ffd166");
      R(5, 13, 3, 2, "#ffd166");
      ctx.globalAlpha = 1;
      for (const x of [-13, 12]) { R(x, 0, 1, 8, "#3e2716"); R(x - 1, -2, 3, 3, "#ffe9a8"); }
      for (let x = -11; x < 12; x += 4) {
        const k = Math.floor(t / 6 + x / 4) % 4;
        if (k) R(x + (k === 2 ? 1 : 0), 18 + (k === 3 ? 1 : 0), 3, 1, "rgba(220, 240, 255, 0.65)");
      }
    } else {
      // The bow seen from ahead: the hull narrowing to the stem, a gilded figurehead and the bowsprit
      poly([[-11, 4], [11, 4], [3, 24], [-3, 24]], "rgba(30, 90, 160, 0.5)");
      poly([[-10, 2], [10, 2], [8, 10], [0, 22], [-8, 10]], "#5a3820");
      poly([[-10, 2], [10, 2], [9.5, 4], [-9.5, 4]], "#e0b44c");
      R(-8, 6, 16, 2, "#1e3a5f");
      R(-1, 10, 2, 16, "#5a3a22");
      R(-2, 12, 4, 4, "#e0b44c");
      R(-1, 11, 2, 1, "#fde68a");
      for (let x = -9; x < 10; x += 4) {
        const k = Math.floor(t / 6 + x / 4) % 4;
        if (k) R(x + (k === 2 ? 1 : 0), 20 - Math.abs(x) / 2 + (k === 3 ? 1 : 0), 3, 1, "rgba(220, 240, 255, 0.65)");
      }
    }
    if (moving) {
      // Bow wave: at the far end facing north, under the stem facing south
      for (let k = 0; k < 4; k++) {
        const s = (t + k * 5) % 20, side = k % 2 ? 1 : -1;
        const y = north ? -64 + s * 0.4 : 22 + s * 0.3;
        R(side * (3 + s * 0.5), y, 2, 1, `rgba(235, 248, 255, ${0.8 - s / 25})`);
      }
    }
    ctx.restore();
  }

  prompt(ctx, x, y, text, color) {
    ctx.save();
    ctx.font = "bold 5px monospace";
    ctx.textAlign = "center";
    const tw = ctx.measureText(text).width + 6;
    ctx.fillStyle = "rgba(3, 6, 17, 0.85)";
    ctx.fillRect(Math.round(x - tw / 2), y - 5, tw, 7);
    ctx.fillStyle = color;
    ctx.fillText(text, Math.round(x), y);
    ctx.restore();
  }
}

// Outline a polygon (closed unless close = false)
function tracePath(ctx, pts, close = true) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (close) ctx.closePath();
}
