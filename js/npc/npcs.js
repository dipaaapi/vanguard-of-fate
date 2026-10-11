import { Avatar } from "../avatar/avatar.js";
import { around, attackPose, drawSwing } from "../juice.js";
import { tickBehavior, behaviorPose, drawBehaviorEmote } from "../behavior.js";
import { NPC_DEFS } from "./roster.js";
import { npcName } from "../dialogue.js";
import { qt } from "../quest.js";
import { PLATFORMS, PLATFORM_ORDER } from "../world/platforms.js";
import { GUILD_NPCS } from "../guilddata.js";
import { drawGuildNpc } from "../world/guildhall.js";
import { Sound } from "../audio.js";
import { getLang } from "../i18n.js";
import { GFX } from "../settings.js";
import { totalMaxHp } from "../monsterTiers.js";

// ==================== NPCs IN THE WORLD ====================
// An NPC's position (x, y) is the middle of its feet, like the Avatar's anchor.
// The player's feet are at (player.x + 10, player.y + 21).

const TALK_RANGE = 26;
const FACE_RANGE = 70;

// Async loader for external rich lore conversation dataset (10+ dialogues per NPC)
let NPC_CONVERSATIONS_DATA = null;
fetch("data/npc_conversations.json")
  .then((res) => (res.ok ? res.json() : null))
  .then((data) => {
    if (data) NPC_CONVERSATIONS_DATA = data;
  })
  .catch(() => {});

const AMBIENT_CHATS = [
  {
    pair: ["arthur", "ronald"],
    lines: [
      { speaker: "arthur", en: "Lance balance feels solid today.", fil: "Matibay ang balanse ng sibat ngayon." },
      { speaker: "ronald", en: "Keep your stance grounded, Ramirez!", fil: "Panatilihing matatag ang tindig mo!" }
    ]
  },
  {
    pair: ["edgar", "julian"],
    lines: [
      { speaker: "edgar", en: "Fresh herbs ready for the salves.", fil: "Sariwa ang mga halaman para sa gamot." },
      { speaker: "julian", en: "The triage beds are prepared, Edgar.", fil: "Handa na ang mga higaan sa pagamutan." }
    ]
  },
  {
    pair: ["lyra", "sam"],
    lines: [
      { speaker: "lyra", en: "My falcon spotted strange shadows.", fil: "May kakaibang aninong nakita ang lawin." },
      { speaker: "sam", en: "Mana density is spiking on my radar.", fil: "Tumataas ang kuryente ng mana sa radar." }
    ]
  },
  {
    pair: ["renzo", "arthur"],
    lines: [
      { speaker: "renzo", en: "Ready for another sparring round, Art?", fil: "Handa na sa isa pang round ng ensayo, Art?" },
      { speaker: "arthur", en: "Don't break my shield this time!", fil: "Huwag mo namang basagin ang kalasag ko!" }
    ]
  },
  {
    pair: ["royalGuard", "royalGuard"],
    lines: [
      { speaker: "royalGuard", en: "All quiet at the perimeter.", fil: "Payapa ang paligid ng moog." },
      { speaker: "royalGuard", en: "Eyes sharp. For the King!", fil: "Maging alerto. Para sa Hari!" }
    ]
  },
  {
    pair: ["king", "royalGuard"],
    lines: [
      { speaker: "king", en: "Stand firm, brave sentinels.", fil: "Manatiling matatag, mga bantay." },
      { speaker: "royalGuard", en: "With our lives, Your Majesty.", fil: "Alang-alang sa inyong buhay, Mahal na Hari." }
    ]
  },
  {
    generic: true,
    lines: [
      { en: "Astraea protect our realm.", fil: "Nawa'y gabayan tayo ni Astraea." },
      { en: "The wind carries a strange chill.", fil: "Malamig ang simoy ng hangin ngayon." },
      { en: "Check your potion pouches!", fil: "Suriin ang inyong mga gamot!" },
      { en: "The Fated Vanguard will prevail.", fil: "Magtatagumpay ang ating hukbo." },
      { en: "Keep your weapons sharp.", fil: "Panatilihing matalim ang inyong sandata." },
      { en: "The skies feel ominous today.", fil: "Kakaiba ang dilim ng ulap ngayon." }
    ]
  }
];

function drawSpeechBubble(ctx, x, y, text) {
  ctx.save();
  ctx.font = "bold 5.5px sans-serif";
  const textW = ctx.measureText(text).width;
  const padX = 6;
  const bw = Math.max(30, textW + padX * 2);
  const bh = 11;
  const bx = x - bw / 2;
  const by = y - bh;

  // Subtle Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(bx + 1, by + 1, bw, bh, 3);
    ctx.fill();
  } else {
    ctx.fillRect(bx + 1, by + 1, bw, bh);
  }

  // Bubble Background & Border
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 3);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);
  }

  // Downward Pointer Tail to Head
  ctx.beginPath();
  ctx.moveTo(x - 3, by + bh);
  ctx.lineTo(x, by + bh + 3.5);
  ctx.lineTo(x + 3, by + bh);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.stroke();

  // Cover seam above tail
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x - 2, by + bh - 1, 4, 1.5);

  // Text
  ctx.fillStyle = "#0f172a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, by + bh / 2);
  ctx.restore();
}

class NPC {
  constructor(id, x, y, dir = "down", platform = "hub", opts = {}) {
    this.id = id;
    this.platform = platform;     // "hub" (Aethelgard) or the id of an Act platform
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.homeDir = dir;
    this.dir = dir;
    this.flip = false;
    this.visible = true;
    this.avatar = new Avatar(NPC_DEFS[id].look);
    if (id !== "nimaFen" && id !== "eirene" && id !== "templar") this.avatar.sheetKey = `npc/${id}`;   // Signature recruit designs use procedural parts.
    this.squash = NPC_DEFS[id].dwarf ? 0.8 : 1;   // dwarves stand shorter
    this.tick = Math.floor(Math.random() * 120);

    // AI & Autonomous Movement parameters
    this.guard = Boolean(opts.guard);
    this.wanderRadius = opts.wanderRadius ?? (this.guard ? 14 : 38 + Math.floor(Math.random() * 22));
    this.speed = opts.speed ?? (0.32 + Math.random() * 0.18);

    this.state = "idle"; // "idle" | "walk" | "attack"
    this.stateTimer = 40 + Math.floor(Math.random() * 120);
    this.targetX = x;
    this.targetY = y;
    this.vx = 0;
    this.vy = 0;
    this.walkAnimTick = Math.floor(Math.random() * 60);

    // Combat & Self-Defense attributes
    this.attackAnimTimer = 0;
    this.attackCooldown = 0;

    // Combat profile based on character definition
    const def = NPC_DEFS[id] || {};
    const look = def.look || {};
    const weapon = look.weapon || "none";

    this.isRanged = ["bow", "staff", "scepter", "flask"].includes(weapon);
    if (this.isRanged) {
      this.detectRange = 115;
      this.combatRange = weapon === "bow" ? 95 : weapon === "staff" ? 90 : weapon === "flask" ? 75 : 82;
      this.combatSpeed = 0.65;
    } else {
      this.detectRange = (this.guard || id === "royalGuard" || id === "king") ? 130 : 90;
      this.combatRange = weapon === "lance" ? 28 : weapon === "sword" ? 26 : 22;
      this.combatSpeed = id === "renzo" ? 0.95 : 0.82;
    }

    // Ambient speech bubble
    this.bubbleText = "";
    this.bubbleTimer = 0;
  }

  say(text, duration = 120) {
    this.bubbleText = text;
    this.bubbleTimer = duration;
  }

  // Face the player when close; patrol, or attack any foe to keep everyone safe
  update(px, py, enemyManager = null, fx = null, king = null, heir = null) {
    this.tick++;
    if (this.attackAnimTimer > 0) this.attackAnimTimer--;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.bubbleTimer > 0) {
      this.bubbleTimer--;
      if (this.bubbleTimer <= 0) this.bubbleText = "";
    }

    const dx = px - this.x, dy = py - this.y;
    const distToPlayer = Math.hypot(dx, dy);

    // ==========================================================
    // AUTONOMOUS DEFENSIVE COMBAT AI (PROTECT SELF & ALLIES)
    // Attacks any approaching foe without hesitation
    // ==========================================================
    let threatEnemy = null;
    let minThreatDist = Infinity;

    if (enemyManager && enemyManager.enemies && enemyManager.enemies.length > 0) {
      const protector = this.id === "templar" ? heir : king;
      const anchorX = (this.guard && protector) ? protector.x : this.x;
      const anchorY = (this.guard && protector) ? protector.y : this.y;

      for (const e of enemyManager.enemies) {
        if (!e.isAlive) continue;
        const dToNpc = Math.hypot(e.x - this.x, e.y - this.y);
        const dToAnchor = Math.hypot(e.x - anchorX, e.y - anchorY);

        if (dToNpc <= this.detectRange || (this.guard && dToAnchor <= 130)) {
          if (dToNpc < minThreatDist) {
            minThreatDist = dToNpc;
            threatEnemy = e;
          }
        }
      }
    }

    if (threatEnemy) {
      this.bubbleText = ""; // Cancel ambient chat during a fight
      const edx = threatEnemy.x - this.x;
      const edy = threatEnemy.y - this.y;
      const eDist = Math.hypot(edx, edy);
      const ang = Math.atan2(edy, edx);

      // Face the foe at once
      if (Math.abs(edx) > Math.abs(edy)) {
        this.dir = "side";
        this.flip = edx < 0;
      } else {
        this.dir = edy < 0 ? "up" : "down";
        this.flip = false;
      }

      // Close in on the foe when not yet in combat range
      if (eDist > this.combatRange) {
        this.x += (edx / eDist) * this.combatSpeed;
        this.y += (edy / eDist) * this.combatSpeed;
        this.state = "walk";
        this.walkAnimTick++;
      } else {
        this.vx = 0;
        this.vy = 0;
      }

      // Attack the foe without hesitation
      if (eDist <= this.combatRange + 6 && this.attackCooldown <= 0) {
        this.attackCooldown = 32 + Math.floor(Math.random() * 12);
        this.attackAnimTimer = 14;
        this.atkAngle = Math.atan2(threatEnemy.y + 10 - (this.y - 10), threatEnemy.x + 10 - this.x);
        this.state = "attack";
        this.vx = 0;
        this.vy = 0;

        if (Sound.playSlash) Sound.playSlash(this.x, this.y);

        // Different element and spark effects per NPC
        let element = "physical";
        let sparkColor = "#ffffff";
        // A share of the target's max HP: NPC allies help at any level but rarely take the last hit
        let dmg = Math.max(3, Math.round(totalMaxHp(threatEnemy) * (0.1 + Math.random() * 0.06)));
        let knockback = 14;

        switch (this.id) {
          case "lyra":
            element = "wind";
            sparkColor = "#4ade80";
            knockback = 12;
            break;
          case "sam":
            element = Math.random() < 0.5 ? "fire" : "lightning";
            sparkColor = element === "fire" ? "#f97316" : "#38bdf8";
            knockback = 11;
            break;
          case "julian":
            element = "holy";
            sparkColor = "#ffd166";
            knockback = 10;
            break;
          case "aurelia":
          case "kenneth":
            element = "holy";
            sparkColor = "#c084fc";
            knockback = 13;
            break;
          case "king":
            element = "holy";
            sparkColor = "#ffd700";
            knockback = 18;
            dmg += 15;
            break;
          case "edgar":
            element = "earth";
            sparkColor = "#22c55e";
            knockback = 10;
            break;
          case "arthur":
          case "royalGuard":
            element = "holy";
            sparkColor = "#ffd166";
            knockback = 16;
            break;
          case "ronald":
            element = "physical";
            sparkColor = "#cbd5e1";
            knockback = 15;
            break;
          case "renzo":
            element = "physical";
            sparkColor = "#ef4444";
            knockback = 16;
            break;
          default:
            element = "physical";
            sparkColor = "#ffd166";
            break;
        }
        this.swingColor = sparkColor;

        const isCrit = Math.random() < 0.28;
        enemyManager.damage(threatEnemy, dmg, ang, isCrit, fx, null, knockback, false, null, element);

        if (fx && fx.spawnHitSparks) {
          fx.spawnHitSparks(threatEnemy.x + 10, threatEnemy.y + 10, sparkColor, 15);
        }
      }
      return;
    }

    // When the player is close (talking or looking), stop and face them
    if (distToPlayer < TALK_RANGE + 6) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.dir = "side";
        this.flip = dx < 0;
      } else {
        this.dir = dy < 0 ? "up" : "down";
        this.flip = false;
      }
      this.vx = 0;
      this.vy = 0;
      return;
    }

    // Autonomous wandering state machine
    this.stateTimer--;
    if (this.stateTimer <= 0) {
      this.pickNextAction();
    }

    if (this.state === "walk") {
      this.x += this.vx;
      this.y += this.vy;
      this.walkAnimTick++;

      // Direction from the movement speed
      if (Math.abs(this.vx) > Math.abs(this.vy)) {
        this.dir = "side";
        this.flip = this.vx < 0;
      } else {
        this.dir = this.vy < 0 ? "up" : "down";
        this.flip = false;
      }

      // Check whether the target is reached or the radius exceeded
      const dTarget = Math.hypot(this.targetX - this.x, this.targetY - this.y);
      const dHome = Math.hypot(this.x - this.homeX, this.y - this.homeY);

      if (dTarget < 3 || dHome > this.wanderRadius + 4) {
        this.state = "idle";
        this.vx = 0;
        this.vy = 0;
        this.stateTimer = 90 + Math.floor(Math.random() * 160);
      }
    }
  }

  // Pick the next natural action (walk, pause, look around)
  pickNextAction() {
    const dHome = Math.hypot(this.x - this.homeX, this.y - this.homeY);
    const roll = Math.random();

    // Walk toward a new point
    if (roll < (this.guard ? 0.35 : 0.55)) {
      let ang;
      // When a bit far from home, drift back a little
      if (dHome > this.wanderRadius * 0.7) {
        ang = Math.atan2(this.homeY - this.y, this.homeX - this.x) + (Math.random() - 0.5) * 1.2;
      } else {
        ang = Math.random() * Math.PI * 2;
      }

      const dist = 12 + Math.random() * (this.wanderRadius * 0.85);
      this.targetX = this.homeX + Math.cos(ang) * Math.min(dist, this.wanderRadius);
      this.targetY = this.homeY + Math.sin(ang) * Math.min(dist, this.wanderRadius * 0.75);

      const wdx = this.targetX - this.x;
      const wdy = this.targetY - this.y;
      const len = Math.hypot(wdx, wdy);

      if (len > 4) {
        this.state = "walk";
        this.vx = (wdx / len) * this.speed;
        this.vy = (wdy / len) * this.speed;
        this.stateTimer = Math.floor(len / this.speed) + 20;
        return;
      }
    }

    // Idle / stop and look around
    this.state = "idle";
    this.vx = 0;
    this.vy = 0;
    this.stateTimer = 70 + Math.floor(Math.random() * 170);

    // Sometimes turn to look elsewhere while standing (not robotic)
    if (Math.random() < 0.45) {
      const dirs = ["down", "side", "up"];
      this.dir = dirs[Math.floor(Math.random() * dirs.length)];
      if (this.dir === "side") this.flip = Math.random() < 0.5;
    }
  }

  draw(ctx) {
    if (drawGuildNpc(ctx, this)) return;
    if (GFX.shadows) { ctx.fillStyle = "rgba(0, 0, 0, 0.28)"; ctx.beginPath(); ctx.ellipse(this.x, this.y - 1, 8, 3, 0, 0, Math.PI * 2); ctx.fill(); }

    if (this.attackAnimTimer > 0) {
      const frame = this.attackAnimTimer > 7 ? 0 : 1;
      const p = 1 - this.attackAnimTimer / 14;
      const a = this.atkAngle || 0;
      around(ctx, this.x, this.y, attackPose(p, Math.cos(a), Math.sin(a), 3), () =>
        this.avatar.draw(ctx, this.x, this.y, this.dir, "attack", frame, this.flip, false, 1, this.squash));
      drawSwing(ctx, this.x, this.y - 10, a, 13, (p - 0.3) / 0.7, this.swingColor || "#ffd166");
    } else if (this.state === "walk" && (Math.abs(this.vx) > 0.01 || Math.abs(this.vy) > 0.01)) {
      const frame = Math.floor(this.walkAnimTick / 8) % 4;
      this.avatar.draw(ctx, this.x, this.y, this.dir, "walk", frame, this.flip, false, 1, this.squash);
    } else {
      const frame = Math.floor(this.tick / 35) % 2;
      around(ctx, this.x, this.y, behaviorPose(this), () =>
        this.avatar.draw(ctx, this.x, this.y, this.dir, "idle", frame, this.flip, false, 1, this.squash));
      drawBehaviorEmote(ctx, this, this.x, this.y - 27);
    }
  }
}

export class NPCManager {
  constructor(stage) {
    this.stage = stage;
    this.npcs = [];
    this.nearest = null;
    this.marked = null;     // quest objective (with a blinking "!")
    this.platformId = "hub";
    this.chatCooldown = 120;
    this.activeChat = null;
    this.partyNpcs = [];
  }

  // Change place: only that place's NPCs are visible
  setPlatform(id) {
    this.platformId = id;
    this.nearest = null;
    this.activeChat = null;
    this.partyNpcs.forEach(n => { n.platform = id; });
  }

  // ids: recruited party members, who leave their post in the world (shown()); follow: also walk
  // the off-field ones behind the player (off by default: off-field members are away, Genshin-style)
  setParty(ids = [], activeId = null, follow = false) {
    this.activePlayable = activeId;
    this.partyIds = new Set(ids);
    const keep = follow ? ids.filter(id => id !== activeId) : [];
    this.partyNpcs = keep.map((id, i) => {
      const n = new NPC(id, 0, 0, "down", this.platformId, { guard: true, wanderRadius: 0, speed: 0.72 });
      n.isPartyFollower = true;
      n.formationIndex = i;
      return n;
    });
  }

  // Is the NPC visible in the current place?
  shown(n) {
    return n.visible && n.platform === this.platformId && (n.isPartyFollower || !(this.activePlayable === n.id || this.partyIds?.has(n.id)));
  }

  // Places every character. summonerId = "aurelia" or "kenneth" (from the player)
  build(summonerId) {
    const sz = this.stage.safeZone;
    const gate = this.stage.castle.gatePortal;
    const bx = sz.x, by = sz.y;
    const gx = gate.x, gy = gate.y;

    this.summonerId = summonerId;
    this.npcs = [
      ...Object.entries(GUILD_NPCS).map(([id, pos]) => Object.assign(new NPC(id, pos.x, pos.y, "down", "hub", { wanderRadius: 0, speed: 0 }), { tag: "guild", visible: false })),
      // Barracks Sanctuary (Act II): where the summoner welcomed the souls from Earth
      new NPC("ronald", bx + 58, by + 72, "down", "hub", { wanderRadius: 42, speed: 0.38 }),
      new NPC("edgar", bx + 238, by + 72, "down", "hub", { wanderRadius: 36, speed: 0.32 }),
      // Summoner: Barracks (Acts II–III, VI) or Citadel (Acts IV–V) — only one is visible
      Object.assign(new NPC(summonerId, bx + 150, by + 52, "down", "hub", { wanderRadius: 32, speed: 0.30 }), { tag: "summonerBarracks" }),
      Object.assign(new NPC(summonerId, gx - 22, gy + 42, "down", "hub", { wanderRadius: 18, speed: 0.25 }), { tag: "summonerCitadel" }),
      Object.assign(new NPC("templar", bx + 170, by + 86, "down", "hub", { guard: true, wanderRadius: 8, speed: 0.32 }), { tag: "templarBarracks" }),
      Object.assign(new NPC("templar", gx - 40, gy + 58, "down", "hub", { guard: true, wanderRadius: 8, speed: 0.32 }), { tag: "templarCitadel" }),
      // The five earlier souls (Act III): each has a designated area and wanders the Barracks
      new NPC("arthur", bx + 60, by + 164, "down", "hub", { wanderRadius: 44, speed: 0.36 }),
      new NPC("lyra", bx + 105, by + 188, "down", "hub", { wanderRadius: 48, speed: 0.40 }),
      new NPC("julian", bx + 150, by + 164, "down", "hub", { wanderRadius: 40, speed: 0.32 }),
      new NPC("sam", bx + 195, by + 188, "down", "hub", { wanderRadius: 45, speed: 0.34 }),
      new NPC("renzo", bx + 240, by + 164, "down", "hub", { wanderRadius: 50, speed: 0.42 }),
      // Imperial Citadel: audience dais in front of the gate (Act IV: Royal Job Awakening)
      new NPC("king", gx + 22, gy + 40, "down", "hub", { guard: true, wanderRadius: 14, speed: 0.22 }),
      new NPC("royalGuard", gx - 62, gy + 36, "down", "hub", { guard: true, wanderRadius: 16, speed: 0.30 }),
      new NPC("royalGuard", gx + 62, gy + 36, "down", "hub", { guard: true, wanderRadius: 16, speed: 0.30 })
    ];
    this.npcs.push(new NPC("cerynVoss", bx + 280, by + 188, "down", "hub", { guard: true, wanderRadius: 18, speed: 0.28 }));

    // Acts VII–XV: the summoner accompanies the hero at each platform's camp
    PLATFORM_ORDER.forEach((pid) => {
      const c = PLATFORMS[pid].camp;
      this.npcs.push(Object.assign(new NPC(summonerId, c.x + c.w / 2 + 18, c.y + c.h / 2 + 8, "down", pid, { wanderRadius: 30, speed: 0.32 }), { tag: "field" }));
      this.npcs.push(Object.assign(new NPC("templar", c.x + c.w / 2 - 16, c.y + c.h / 2 + 12, "down", pid, { guard: true, wanderRadius: 8, speed: 0.32 }), { tag: "templarField" }));
      // Village residents (Emberhold in the Ashfall Wastelands)
      Object.entries(PLATFORMS[pid].villagers || {}).forEach(([id, [x, y]]) => {
        this.npcs.push(new NPC(id, x, y, "down", pid, { guard: true, wanderRadius: 10, speed: 0.22 }));
      });
    });
    // Guides and allies posted along the campaign (each place's camp; see js/npc/roster.js for their jobs)
    const at = (pid, dx, dy) => { const c = PLATFORMS[pid].camp; return [c.x + c.w / 2 + dx, c.y + c.h / 2 + dy]; };
    const post = (id, pid, dx, dy, o = { wanderRadius: 22, speed: 0.3 }) => this.npcs.push(new NPC(id, ...at(pid, dx, dy), "down", pid, o));
    this.npcs.push(new NPC("maren", bx + 280, by + 112, "down", "hub", { wanderRadius: 20, speed: 0.25 }));   // the Chronicles desk
    post("elvenMatriarch", "canopy", -50, -10);
    post("lyra", "canopy", 50, 14);
    post("isolde", "coast", -46, -12);
    post("sam", "frost", -48, 10);
    // the Dark Continent: Veyra scouts every camp; Isolde's fleet and Edgar's field apothecary hold the beachhead
    ["strand", "ossuary", "siege", "chainspire", "maw"].forEach((pid) => post("veyra", pid, -52, -8));
    post("isolde", "strand", 52, -12);
    post("edgar", "strand", 40, 22, { guard: true, wanderRadius: 10, speed: 0.25 });
    post("aldric", "ossuary", 50, -14, { guard: true, wanderRadius: 12, speed: 0.22 });
    post("julian", "ossuary", 30, 26);
    post("arthur", "siege", 54, 18);
    post("renzo", "chainspire", 50, 16);
    // Act XIII: Captain Ronald and the Royal Guard help hold the breach
    const sc = PLATFORMS.siege.camp;
    this.npcs.push(new NPC("vaelThorn", sc.x + 96, sc.y + 28, "down", "siege", { guard: true, wanderRadius: 12, speed: 0.25 }));
    this.npcs.push(new NPC("ronald", sc.x + 36, sc.y + sc.h / 2 + 10, "up", "siege", { wanderRadius: 28, speed: 0.35 }));
    this.npcs.push(new NPC("royalGuard", sc.x + sc.w - 30, sc.y + 30, "up", "siege", { guard: true, wanderRadius: 16, speed: 0.30 }));
    this.npcs.push(new NPC("royalGuard", sc.x + 30, sc.y + 30, "up", "siege", { guard: true, wanderRadius: 16, speed: 0.30 }));
    this.npcs.push(new NPC("nimaFen", 185, 510, "down", "swamp", { wanderRadius: 22, speed: 0.3 }));
    this.npcs.push(Object.assign(new NPC("nimaFen", 246, 495, "down", "port", { guard: true, wanderRadius: 0, speed: 0 }), { tag: "tradeCaravan" }));
    this.npcs.push(new NPC("selaMoss", 215, 455, "down", "swamp", { wanderRadius: 20, speed: 0.22 }));
    this.npcs.push(new NPC("taviReed", 245, 495, "down", "swamp", { wanderRadius: 24, speed: 0.32 }));
    this.npcs.push(new NPC("eirene", 190, 480, "down", "lost", { guard: true, wanderRadius: 8, speed: 0.2 }));
    this.npcs.push(new NPC("tidemarkTrader", 230, 480, "down", "port", { wanderRadius: 10, speed: 0.2 }));
  }

  // Which NPCs to show depending on the quest
  applyQuest(quest, cls) {
    const atCitadel = quest.summonerAtCitadel();
    this.npcs.forEach((n) => {
      if (n.tag === "guild") n.visible = quest.step >= 5 || quest.unlocked("canopy");   // Act V: guild registration
      if (n.tag === "summonerBarracks") n.visible = !atCitadel;
      if (n.tag === "summonerCitadel") n.visible = atCitadel;
      if (n.tag === "tradeCaravan") n.visible = quest.unlocked("port") && quest.unlocked("swamp") && quest.unlocked("siege");
      if (n.id === "king") n.visible = !quest.kingDead;
      if (n.tag === "templarBarracks") n.visible = !atCitadel;
      if (n.tag === "templarCitadel") n.visible = atCitadel;
      if (n.tag === "templarField") n.visible = true;
    });
    this.marked = quest.targetNpc(this.summonerId, cls);
  }

  // Autonomous ambient conversation between NPCs
  updateAmbientChat() {
    const lang = getLang() === "fil" ? "fil" : "en";

    // Sequence progress
    if (this.activeChat) {
      this.activeChat.timer--;
      if (this.activeChat.timer <= 0) {
        if (this.activeChat.step === 0 && this.activeChat.line2) {
          this.activeChat.step = 1;
          this.activeChat.timer = 120;
          this.activeChat.speaker2.say(this.activeChat.line2[lang] || this.activeChat.line2.en);
        } else {
          this.activeChat = null;
          this.chatCooldown = 180 + Math.floor(Math.random() * 260);
        }
      }
      return;
    }

    this.chatCooldown--;
    if (this.chatCooldown > 0) return;

    const visibleNpcs = this.npcs.filter((n) => this.shown(n));
    if (visibleNpcs.length < 2) return;

    // Find two NPCs close to each other (< 55px)
    for (let i = 0; i < visibleNpcs.length; i++) {
      for (let j = i + 1; j < visibleNpcs.length; j++) {
        const n1 = visibleNpcs[i];
        const n2 = visibleNpcs[j];
        const d = Math.hypot(n1.x - n2.x, n1.y - n2.y);

        if (d < 55 && n1.state !== "attack" && n2.state !== "attack") {
          let line1 = null;
          let line2 = null;

          // Try the loaded external JSON first (npc_conversations.json)
          if (NPC_CONVERSATIONS_DATA && Array.isArray(NPC_CONVERSATIONS_DATA.pairs)) {
            const pairData = NPC_CONVERSATIONS_DATA.pairs.find((p) =>
              p.pair && (
                (p.pair[0] === n1.id && p.pair[1] === n2.id) ||
                (p.pair[1] === n1.id && p.pair[0] === n2.id)
              )
            );
            // each pair has `lines` (one exchange); `conversations` (several exchanges) is also accepted
            const conv = pairData && (Array.isArray(pairData.conversations) && pairData.conversations.length
              ? pairData.conversations[Math.floor(Math.random() * pairData.conversations.length)] : pairData.lines);
            if (Array.isArray(conv) && conv.length >= 2) {
              line1 = conv[0];
              line2 = conv[1];
            }
          }

          // Fall back to the internal AMBIENT_CHATS while the fetch is pending
          if (!line1) {
            const match = AMBIENT_CHATS.find((c) =>
              c.pair && (
                (c.pair[0] === n1.id && c.pair[1] === n2.id) ||
                (c.pair[1] === n1.id && c.pair[0] === n2.id)
              )
            );
            if (match && match.lines) {
              line1 = match.lines[0];
              line2 = match.lines[1];
            }
          }

          if (line1 && Math.random() < 0.6) {
            // Face each other and stop
            n1.state = "idle";
            n2.state = "idle";
            n1.stateTimer = 240;
            n2.stateTimer = 240;
            n1.dir = "side";
            n1.flip = n2.x < n1.x;
            n2.dir = "side";
            n2.flip = n1.x < n2.x;

            const s1 = line1.speaker === n1.id ? n1 : n2;
            const s2 = s1 === n1 ? n2 : n1;

            s1.say(line1[lang] || line1.en, 120);

            this.activeChat = {
              speaker1: s1,
              speaker2: s2,
              line1: line1,
              line2: line2,
              step: 0,
              timer: 120
            };
            return;
          }
        }
      }
    }

    // Single random ambient lore murmur (from the NPC's 10+ lore/environment lines in the JSON)
    if (Math.random() < 0.40) {
      const speaker = visibleNpcs[Math.floor(Math.random() * visibleNpcs.length)];
      if (speaker && speaker.state !== "attack") {
        let textToSay = null;

        if (NPC_CONVERSATIONS_DATA && NPC_CONVERSATIONS_DATA.solo && Array.isArray(NPC_CONVERSATIONS_DATA.solo[speaker.id])) {
          const lines = NPC_CONVERSATIONS_DATA.solo[speaker.id];
          if (lines.length > 0) {
            const pick = lines[Math.floor(Math.random() * lines.length)];
            textToSay = pick[lang] || pick.en;
          }
        }

        if (!textToSay) {
          const gen = AMBIENT_CHATS.find((c) => c.generic);
          if (gen && gen.lines) {
            const line = gen.lines[Math.floor(Math.random() * gen.lines.length)];
            textToSay = line[lang] || line.en;
          }
        }

        if (textToSay) {
          speaker.say(textToSay, 135);
          this.chatCooldown = 200 + Math.floor(Math.random() * 220);
        }
      }
    } else {
      this.chatCooldown = 140;
    }
  }

  update(player, enemyManager = null, fx = null) {
    const px = player.x + 10, py = player.y + 21;
    let best = null, bestD = TALK_RANGE;
    const king = this.find("king");
    const heir = this.find(this.summonerId);

    this.npcs.forEach((n) => {
      if (!this.shown(n)) return;
      n.update(px, py, enemyManager, fx, king, heir);
      tickBehavior(n, n.state !== "walk" && !(n.attackAnimTimer > 0), "humanoid");   // idle behaviors (js/behavior.js)
      const d = Math.hypot(px - n.x, py - n.y);
      if (d < bestD) { best = n; bestD = d; }
    });
    this.partyNpcs.forEach(n => {
      const i = n.formationIndex + 1;
      if (n.x === 0 && n.y === 0) { n.x = px - 18 * i; n.y = py + 8 + (i % 2) * 12; }
      const targetX = px - 18 * i, targetY = py + 8 + (i % 2) * 12;
      const dx = targetX - n.x, dy = targetY - n.y, d = Math.hypot(dx, dy);
      if (d > 5) {
        const step = Math.min(d, n.speed * Math.min(2.2, d / 10));
        n.x += dx / d * step; n.y += dy / d * step;
        n.dir = Math.abs(dx) > Math.abs(dy) ? "side" : dy < 0 ? "up" : "down";
        n.flip = dx < 0; n.state = "walk"; n.walkAnimTick++;
      } else n.state = "idle";
      tickBehavior(n, n.state === "idle", "humanoid");
      n.tick++;
    });
    this.nearest = best;

    // When the player talks to or approaches an NPC, cancel its ambient chat
    if (this.nearest) {
      this.nearest.bubbleText = "";
    }

    this.updateAmbientChat();
  }

  isNear(id) {
    return Boolean(this.nearest && this.nearest.id === id);
  }

  find(id) {
    return this.npcs.find((n) => this.shown(n) && n.id === id) || null;
  }

  // Y-sort: NPCs behind the player (smaller y) are drawn first
  drawLayer(ctx, playerFootY, front) {
    [...this.npcs, ...this.partyNpcs].forEach((n) => {
      if (!this.shown(n)) return;
      if ((n.y > playerFootY) === front) n.draw(ctx);
    });
  }

  // Names, speech bubbles, the quest "!" and "[E] Talk" (above everything)
  drawLabels(ctx, player) {
    const px = player.x + 10, py = player.y + 21;
    ctx.textAlign = "center";

    this.npcs.forEach((n) => {
      if (!this.shown(n)) return;
      const near = Math.hypot(px - n.x, py - n.y) < FACE_RANGE;
      const top = n.y - (n.squash < 1 ? 31 : 38);   // dwarves are shorter

      // Quest exclamation mark
      if (n.id === this.marked) {
        const bob = Math.sin(n.tick / 8) * 1.5;
        ctx.font = "bold 10px monospace";
        ctx.fillStyle = "#000";
        ctx.fillText("!", n.x + 1, top - 5 + bob + 1);
        ctx.fillStyle = "#ffd166";
        ctx.fillText("!", n.x, top - 5 + bob);
      }

      // Speech bubble while saying something
      if (n.bubbleText && n.bubbleTimer > 0 && (!this.nearest || this.nearest !== n)) {
        const floatY = n.y - 42 + Math.sin(n.tick / 10) * 1.2;
        drawSpeechBubble(ctx, n.x, floatY, n.bubbleText);
      } else if (near) {
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
