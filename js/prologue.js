import { getLang } from "./i18n.js";
import { Sound } from "./audio.js";
import { Avatar } from "./avatar/avatar.js";
import { NPC_DEFS, summonerIdFor } from "./npc/roster.js";
import { npcName } from "./dialogue.js";

// ==================== ACT I PROLOGUE CUTSCENE ====================
// An animated pixel-art cutscene (480x270, the game's own style) explaining how the hero
// reached Aethelgard: the golden age → the Eclipse and Satan → the Seven Blights →
// the King and the summoner decide (the Lantern Knight, the Pentagram Prophecy) → Earth (2026), swallowed by the rift → the crossing → the ritual beneath
// the Citadel → waking in the Barracks Sanctuary with the summoner.
// The hero is the one made in the Character Creator; the summoner is Aurelia or Kenneth.
// Enter/Space/E: finish the line or continue · Esc: skip everything.

const W = 480;
const H = 270;

// ---------- Small seeded random so the scenes are always the same ----------
function rng(seed) {
  let s = seed % 2147483647;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => v * v * (3 - 2 * v);
// Part [a, b] of the progress p, 0..1
const span = (p, a, b) => clamp01((p - a) / (b - a));

function fillGrad(ctx, stops, y0 = 0, y1 = H) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([k, c]) => g.addColorStop(k, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, y1 - y0);
}

function glow(ctx, x, y, r, rgb, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb}, ${a})`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// Mountain/hill ridge with pixel steps
function ridge(ctx, baseY, amp, step, color, seed, shift = 0) {
  const r = rng(seed);
  const hs = Array.from({ length: Math.ceil(W / step) + 4 }, () => r());
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let i = 0; i < hs.length; i++) {
    const x = i * step - (shift % step) - step;
    const k = Math.floor(shift / step) + i;
    const h = hs[((k % hs.length) + hs.length) % hs.length];
    ctx.lineTo(x, Math.round(baseY - h * amp));
    ctx.lineTo(x + step, Math.round(baseY - h * amp));
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

// Silhouette of the Imperial Citadel (used in scenes 1 and 2)
function citadel(ctx, cx, baseY, stone, shade, t, bannerA = "#8a2c2c", bannerB = "#ffd166") {
  const towers = [[-58, 46, 10], [-34, 62, 12], [-8, 84, 16], [20, 62, 12], [44, 46, 10]];
  ctx.fillStyle = stone;
  ctx.fillRect(cx - 64, baseY - 30, 128, 30);                    // pader
  for (let x = cx - 64; x < cx + 64; x += 6) ctx.fillRect(x, baseY - 33, 3, 3);   // crenel
  towers.forEach(([dx, h, w]) => {
    const x = cx + dx;
    ctx.fillStyle = stone;
    ctx.fillRect(x, baseY - h, w, h);
    ctx.fillStyle = shade;
    ctx.fillRect(x + w - 3, baseY - h, 3, h);
    ctx.fillStyle = stone;
    for (let k = 0; k < w; k += 4) ctx.fillRect(x + k, baseY - h - 3, 2, 3);
    // waving banner
    const wave = Math.round(Math.sin(t / 8 + dx) * 1.5);
    ctx.fillStyle = "#3a2616";
    ctx.fillRect(x + (w >> 1), baseY - h - 14, 1, 11);
    ctx.fillStyle = bannerA;
    ctx.fillRect(x + (w >> 1) + 1, baseY - h - 14, 7, 3 + wave);
    ctx.fillStyle = bannerB;
    ctx.fillRect(x + (w >> 1) + 3, baseY - h - 13, 2, 1);
  });
  // gate and window
  ctx.fillStyle = shade;
  ctx.fillRect(cx - 5, baseY - 14, 10, 14);
  ctx.fillStyle = "#1a1420";
  ctx.fillRect(cx - 4, baseY - 12, 8, 12);
}

// ==================== SCENES ====================
// Each scene: dur (frames at 60fps) for the animation, a sound cue, lines (with or without a speaker),
// and draw(ctx, p, f, s) — p = 0..1 progress, f = frame, s = the PrologueScene.
const SCENES = [
  // 1. THE GOLDEN AGE
  {
    dur: 520,
    card: { en: ["ACT I", "The Sundered Dominion"], fil: ["ACT I", "Ang Nahating Kaharian"] },
    sound: "holy",
    lines: [
      { en: "Long ago, the continent of Aethelgard flourished beneath the light of the goddess Astraea.",
        fil: "Noong unang panahon, masaganang namukadkad ang kontinente ng Aethelgard sa ilalim ng liwanag ng diyosang si Astraea." },
      { en: "Four Celestial Gateways bound the land to the Imperial Citadel, and for generations there was peace.",
        fil: "Apat na Celestial Gateway ang nagbubuklod sa lupain at sa Imperial Citadel, at sa loob ng maraming salinlahi ay may kapayapaan." }
    ],
    draw(ctx, p, f) {
      fillGrad(ctx, [[0, "#2f4f8f"], [0.55, "#e89f6b"], [0.78, "#ffd9a0"]], 0, 200);
      const sunY = 96 - ease(p) * 16;
      glow(ctx, 360, sunY, 70, "255, 220, 150", 0.55);
      ctx.fillStyle = "#fff2c9";
      ctx.beginPath(); ctx.arc(360, sunY, 14, 0, Math.PI * 2); ctx.fill();
      const pan = f * 0.08;
      ridge(ctx, 178, 26, 18, "#7a8fb8", 11, pan * 0.3);
      citadel(ctx, 240, 186, "#e8e2d0", "#b9b2a0", f);
      ridge(ctx, 204, 16, 14, "#4e7a45", 23, pan * 0.6);
      // Four pulsing Celestial Gateways
      [[62, 200], [150, 206], [330, 206], [418, 200]].forEach(([x, y], k) => {
        const a = 0.35 + Math.sin(f / 20 + k * 1.7) * 0.25;
        ctx.fillStyle = `rgba(120, 230, 255, ${a * 0.5})`;
        ctx.fillRect(x - 1, 0, 3, y - 16);
        glow(ctx, x, y - 14, 16, "120, 230, 255", a);
        ctx.fillStyle = "#6b7280"; ctx.fillRect(x - 3, y - 18, 7, 18);
        ctx.fillStyle = "#a5f3fc"; ctx.fillRect(x - 1, y - 15, 3, 3);
      });
      ridge(ctx, 236, 12, 10, "#3f6b37", 37, pan);
      fillGrad(ctx, [[0, "#35602f"], [1, "#24401f"]], 236, H);
      // swaying grass
      const r = rng(5);
      ctx.fillStyle = "#6fa05a";
      for (let i = 0; i < 90; i++) {
        const x = Math.round((r() * W + pan * 1.4) % W), y = 236 + Math.round(r() * 34);
        const sway = Math.round(Math.sin(f / 18 + i) * 1);
        ctx.fillRect(x + sway, y - 3, 1, 3);
      }
      // birds
      ctx.fillStyle = "#3b3244";
      for (let i = 0; i < 5; i++) {
        const bx = ((f * (0.5 + i * 0.07) + i * 90) % (W + 40)) - 20, by = 50 + i * 11 + Math.sin(f / 15 + i) * 3;
        const wing = Math.floor(f / 10 + i) % 2;
        ctx.fillRect(Math.round(bx) - 3, Math.round(by) - wing, 3, 1);
        ctx.fillRect(Math.round(bx) + 1, Math.round(by) - wing, 3, 1);
        ctx.fillRect(Math.round(bx), Math.round(by), 1, 1);
      }
    }
  },

  // 2. THE ECLIPSE OF THE ABYSS
  {
    dur: 600,
    sound: "thunder",
    lines: [
      { en: "Then came the Eclipse of the Abyss. The ancient seals beneath the earth shattered...",
        fil: "Pagkatapos ay dumating ang Eklipse ng Kalaliman. Nawasak ang mga sinaunang selyo sa ilalim ng lupa..." },
      { en: "...and Demon Lord Satan rose from the pit, exhaling the Void Miasma across the land.",
        fil: "...at bumangon mula sa hukay ang Demon Lord na si Satan, ibinuga ang Void Miasma sa buong lupain." }
    ],
    draw(ctx, p, f, s) {
      const dark = ease(span(p, 0, 0.35));
      fillGrad(ctx, [[0, mix("#2f4f8f", "#0b0614", dark)], [0.6, mix("#e89f6b", "#2a0f2e", dark)], [0.8, mix("#ffd9a0", "#4a1030", dark)]], 0, 200);
      // the moon covering the sun
      const cover = ease(span(p, 0, 0.3));
      const sx = 360, sy = 80;
      if (cover > 0.95) {
        glow(ctx, sx, sy, 40, "255, 240, 220", 0.5 + Math.sin(f / 9) * 0.1);
        ctx.strokeStyle = "#fff6e0"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(sx, sy, 15, 0, Math.PI * 2); ctx.stroke();
      } else {
        glow(ctx, sx, sy, 60, "255, 220, 150", 0.5 * (1 - cover));
        ctx.fillStyle = "#fff2c9";
        ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = "#07040c";
      ctx.beginPath(); ctx.arc(sx - 34 + cover * 34, sy, 14, 0, Math.PI * 2); ctx.fill();

      // Satan: a giant silhouette behind the Citadel
      const rise = ease(span(p, 0.45, 0.85));
      if (rise > 0) {
        const by = 250 - rise * 150;
        ctx.fillStyle = "#12071a";
        ctx.beginPath();
        ctx.moveTo(150, H); ctx.lineTo(170, by + 60); ctx.lineTo(200, by + 30); ctx.lineTo(206, by);
        ctx.lineTo(196, by - 40); ctx.lineTo(214, by - 8); ctx.lineTo(240, by - 14);          // left horn
        ctx.lineTo(266, by - 8); ctx.lineTo(284, by - 40); ctx.lineTo(274, by);                // right horn
        ctx.lineTo(280, by + 30); ctx.lineTo(310, by + 60); ctx.lineTo(330, H);
        ctx.closePath(); ctx.fill();
        const blink = Math.floor(f / 90) % 7 === 0 && f % 90 < 6 ? 0 : 1;
        if (blink) {
          glow(ctx, 228, by + 12, 12, "255, 40, 40", 0.8 * rise);
          glow(ctx, 252, by + 12, 12, "255, 40, 40", 0.8 * rise);
          ctx.fillStyle = "#ff3b3b";
          ctx.fillRect(224, by + 11, 8, 2); ctx.fillRect(248, by + 11, 8, 2);
        }
      }
      ridge(ctx, 178, 26, 18, mix("#7a8fb8", "#1c1026", dark), 11, 40);
      citadel(ctx, 240, 186, mix("#e8e2d0", "#3a3346", dark), mix("#b9b2a0", "#221c2c", dark), f);
      ridge(ctx, 204, 16, 14, mix("#4e7a45", "#1a1a22", dark), 23, 70);
      fillGrad(ctx, [[0, mix("#35602f", "#15121c", dark)], [1, "#0a0810"]], 226, H);

      // A crack in the ground with red light
      const crack = span(p, 0.3, 0.45);
      if (crack > 0) {
        if (!s.flag.crack) { s.flag.crack = true; s.shake = 14; if (Sound.playDarkCast) Sound.playDarkCast(); }
        const r = rng(77);
        ctx.fillStyle = "#ff4a1c";
        let x = 240, y = 230;
        for (let i = 0; i < 26 * crack; i++) {
          x += Math.round((r() - 0.5) * 10); y += 1;
          ctx.fillRect(x - 1, y, 3, 2);
          ctx.fillRect(480 - x - 1, 460 - y, 3, 2);
        }
        glow(ctx, 240, 236, 90, "255, 60, 20", 0.35 * crack);
        // rising Void Miasma
        if (f % 2 === 0) s.spawn({ x: 200 + Math.random() * 80, y: 236, vx: (Math.random() - 0.5) * 1.2, vy: -0.4 - Math.random() * 0.6, life: 160, r: 2 + Math.random() * 3, c: Math.random() < 0.7 ? "140, 60, 200" : "60, 20, 90" });
      }
      // Lightning
      if (p > 0.3 && Math.random() < 0.012) { s.flash = 0.8; if (Sound.playThunder) Sound.playThunder(); }
    }
  },

  // 3. THE SEVEN BLIGHTS
  {
    dur: 460,
    sound: "dark",
    lines: [
      { en: "Forests withered. Beasts twisted into nocturnal abominations with crimson eyes.",
        fil: "Nalanta ang mga gubat. Naging mababangis na halimaw ng gabi ang mga hayop, may mga matang pula." },
      { en: "And those who breathed the miasma fell to the Seven Blights. Garrisons crumbled, one after another.",
        fil: "At ang mga nakalanghap ng miasma ay tinamaan ng Pitong Sumpa. Isa-isang bumagsak ang mga garison." }
    ],
    draw(ctx, p, f, s) {
      fillGrad(ctx, [[0, "#07040c"], [0.7, "#1c0d24"], [1, "#3b1520"]], 0, H);
      // a village burning in the distance
      glow(ctx, 380, 190, 120, "255, 110, 40", 0.35 + Math.sin(f / 7) * 0.05);
      ridge(ctx, 196, 20, 12, "#1a1024", 91, 0);
      // dead trees
      const r = rng(19);
      for (let i = 0; i < 14; i++) {
        const x = Math.round(r() * W), h = 50 + r() * 70, base = 210 + r() * 40;
        ctx.fillStyle = i % 2 ? "#0e0914" : "#150d1d";
        ctx.fillRect(x, base - h, 4, h);
        ctx.fillRect(x - 8, base - h * 0.7, 10, 2); ctx.fillRect(x - 8, base - h * 0.7 - 6, 2, 6);
        ctx.fillRect(x + 4, base - h * 0.5, 9, 2); ctx.fillRect(x + 11, base - h * 0.5 - 8, 2, 8);
      }
      // drifting fog
      for (let k = 0; k < 3; k++) {
        const y = 200 + k * 22, off = (f * (0.3 + k * 0.2)) % 160;
        for (let x = -160 + off; x < W; x += 160) glow(ctx, x + 80, y, 70, "120, 60, 160", 0.12);
      }
      // eyes glowing in the dark
      const eyes = rng(41);
      for (let i = 0; i < 12; i++) {
        const x = Math.round(eyes() * (W - 40) + 20), y = Math.round(150 + eyes() * 100), ph = eyes() * 200;
        const on = (f + ph) % 200 < 150 && p > i / 16;
        if (!on) continue;
        const col = i % 3 ? "#ff3b3b" : "#c084fc";
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 2, 1); ctx.fillRect(x + 5, y, 2, 1);
      }
      // a monstrous wolf prowling in front
      const wx = -60 + ease(span(p, 0.2, 0.9)) * 600;
      const leg = Math.floor(f / 6) % 2;
      ctx.fillStyle = "#050308";
      ctx.fillRect(wx, 236, 34, 10);                 // body
      ctx.fillRect(wx + 30, 230, 10, 9);             // head
      ctx.fillRect(wx + 38, 234, 5, 3);              // nguso
      ctx.fillRect(wx + 31, 227, 2, 4); ctx.fillRect(wx + 36, 227, 2, 4);   // ears
      ctx.fillRect(wx - 8, 236, 9, 3);               // buntot
      ctx.fillRect(wx + 2 + leg * 3, 246, 3, 8); ctx.fillRect(wx + 24 - leg * 3, 246, 3, 8);
      ctx.fillStyle = "#ff3b3b"; ctx.fillRect(wx + 36, 232, 2, 1);
      if (f % 3 === 0) s.spawn({ x: Math.random() * W, y: H, vx: 0, vy: -0.5 - Math.random() * 0.5, life: 200, r: 1, c: "255, 140, 60" });
    }
  },

  // 4. THE DECISION OF THE KING AND THE HEIR
  {
    dur: 560,
    sound: "move",
    lines: [
      { speaker: "king", en: "Steel alone can no longer hold back the dark. Our garrisons are ash.",
        fil: "Hindi na kaya ng bakal lamang ang dilim. Abo na ang ating mga garison." },
      { speaker: "summoner", en: "Then we invoke the forbidden covenant, Father. We reach across the veil — and call a soul from Earth.",
        fil: "Kung gayon, gamitin natin ang ipinagbabawal na tipan, Ama. Tatawirin natin ang tabing — at tatawag tayo ng kaluluwa mula sa Daigdig." },
      { speaker: "king", en: "The last soul this crown called was the Lantern Knight. They sealed the demon with their own life, and never went home.",
        fil: "Ang huling kaluluwang tinawag ng koronang ito ay ang Lantern Knight. Ibinuklod nila ang demonyo gamit ang sariling buhay, at hindi na nakauwi." },
      { speaker: "summoner", en: "Five souls have already answered the Pentagram Seal. The prophecy asks for one more: a sixth, to stand at the heart of the star. And this time, we bring them all home.",
        fil: "Lima nang kaluluwa ang tumugon sa Pentagram Seal. Isa pa ang hinihingi ng propesiya: ang ikaanim, na tatayo sa puso ng bituin. At ngayon, iuuwi natin silang lahat." }
    ],
    draw(ctx, p, f, s) {
      fillGrad(ctx, [[0, "#1b1626"], [1, "#2a2336"]], 0, 190);
      // stained-glass window and shafts of light
      const wx = 216;
      ctx.fillStyle = "#0e0b16"; ctx.fillRect(wx - 2, 20, 52, 110);
      const panes = ["#8a2c2c", "#2c4f8a", "#ffd166", "#5a3d91", "#2f6b3f"];
      for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) {
        ctx.fillStyle = panes[(x + y * 2) % panes.length];
        ctx.globalAlpha = 0.7 + Math.sin(f / 30 + x + y) * 0.1;
        ctx.fillRect(wx + 2 + x * 16, 24 + y * 21, 14, 19);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255, 220, 160, 0.07)";
      ctx.beginPath(); ctx.moveTo(wx, 30); ctx.lineTo(wx + 48, 30); ctx.lineTo(wx + 150, 250); ctx.lineTo(wx - 40, 250); ctx.closePath(); ctx.fill();
      // pillars
      [40, 120, 340, 420].forEach((x) => {
        ctx.fillStyle = "#3a3346"; ctx.fillRect(x, 10, 22, 180);
        ctx.fillStyle = "#4a4258"; ctx.fillRect(x, 10, 4, 180);
        ctx.fillStyle = "#2a2433"; ctx.fillRect(x - 3, 184, 28, 8); ctx.fillRect(x - 3, 10, 28, 6);
        // torch
        glow(ctx, x + 11, 100, 22, "255, 160, 60", 0.4 + Math.sin(f / 5 + x) * 0.08);
        ctx.fillStyle = "#ffb347"; ctx.fillRect(x + 9, 96 - (Math.floor(f / 6 + x) % 2), 4, 4);
      });
      // floor, carpet, throne
      fillGrad(ctx, [[0, "#3a3140"], [1, "#221c28"]], 190, H);
      ctx.fillStyle = "#6e1f24"; ctx.fillRect(222, 190, 36, 80);
      ctx.fillStyle = "#ffd166"; ctx.fillRect(222, 190, 1, 80); ctx.fillRect(257, 190, 1, 80);
      ctx.fillStyle = "#4a4258"; ctx.fillRect(196, 176, 88, 16);           // dais
      ctx.fillStyle = "#8a6a2c"; ctx.fillRect(228, 120, 24, 58);           // throne back
      ctx.fillStyle = "#ffd166"; ctx.fillRect(236, 114, 8, 6);
      ctx.fillStyle = "#6e1f24"; ctx.fillRect(232, 128, 16, 40);

      s.king.draw(ctx, 240, 186, "down", "idle", Math.floor(f / 30), false, false, 2);
      // The summoner approaches and faces the King
      const walk = ease(span(p, 0, 0.3));
      const sxp = 380 - walk * 70;
      const moving = walk > 0 && walk < 1;
      s.summoner.draw(ctx, sxp, 214, "side", moving ? "walk" : "idle", Math.floor(f / (moving ? 8 : 30)), true, false, 2);
      // A rune circle lights up on the floor: a hint of the ritual
      const rune = span(p, 0.7, 1);
      if (rune > 0) runeCircle(ctx, 240, 232, 70, 16, f, rune);
    }
  },

  // 5. EARTH, 2026
  {
    dur: 700,
    sound: "none",
    lines: [
      { en: "Earth, 2026. A total eclipse turned noon into dusk across the whole world.",
        fil: "Daigdig, 2026. Ginawang takipsilim ng isang ganap na eklipse ang tanghali sa buong mundo." },
      { en: "{h} was doing what the brave always do — holding the line for others — when the sky tore open.",
        fil: "Ginagawa ni {h} ang laging ginagawa ng matatapang — ang ipagtanggol ang iba — nang biglang napunit ang langit." }
    ],
    draw(ctx, p, f, s) {
      fillGrad(ctx, [[0, "#141a26"], [0.7, "#2c3446"], [1, "#46404a"]], 0, 200);
      // eklipse
      glow(ctx, 110, 60, 46, "255, 250, 235", 0.35 + Math.sin(f / 11) * 0.05);
      ctx.strokeStyle = "#fffaf0"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(110, 60, 13, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#07090e"; ctx.beginPath(); ctx.arc(110, 60, 12, 0, Math.PI * 2); ctx.fill();
      // buildings with lit windows
      s.buildings.forEach((b) => {
        ctx.fillStyle = b.c; ctx.fillRect(b.x, 200 - b.h, b.w, b.h);
        b.win.forEach(([wx, wy, on]) => {
          if (!on) return;
          ctx.fillStyle = (Math.floor(f / 120) + wx) % 17 === 0 ? "#2a2f3a" : "#ffd98a";
          ctx.fillRect(b.x + wx, 200 - b.h + wy, 2, 2);
        });
      });
      // road and pavement
      ctx.fillStyle = "#23262e"; ctx.fillRect(0, 200, W, 70);
      ctx.fillStyle = "#3a3e48"; ctx.fillRect(0, 200, W, 16);
      ctx.fillStyle = "#c9b458";
      for (let x = (-f * 0) % 40; x < W; x += 40) ctx.fillRect(x, 244, 20, 2);
      // street lamps
      [60, 300, 440].forEach((x) => {
        ctx.fillStyle = "#15171d"; ctx.fillRect(x, 150, 2, 60); ctx.fillRect(x, 150, 10, 2);
        glow(ctx, x + 9, 154, 34, "255, 220, 150", 0.3);
      });
      // ulan
      ctx.fillStyle = "rgba(170, 190, 220, 0.35)";
      for (let i = 0; i < 70; i++) {
        const x = (i * 53 + f * 3) % (W + 20) - 10, y = (i * 97 + f * 7) % H;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 4);
      }

      // The hero walks, stops, looks up
      const walkP = span(p, 0, 0.3);
      const hx = 150 + ease(walkP) * 90, hy = 222;
      const tear = span(p, 0.4, 0.62);
      const dissolve = span(p, 0.65, 0.95);
      // The rift in the sky
      if (tear > 0) {
        if (!s.flag.tear) { s.flag.tear = true; s.shake = 10; if (Sound.playThunder) Sound.playThunder(); }
        const len = ease(tear) * 110;
        glow(ctx, hx, 90, 60 + tear * 40, "150, 240, 255", 0.4 * tear);
        const r = rng(303);
        ctx.fillStyle = "#e0fbff";
        let x = hx;
        for (let y = 90 - len / 2; y < 90 + len / 2; y += 2) { x += Math.round((r() - 0.5) * 4); ctx.fillRect(x - 1, Math.round(y), 3, 2); }
        ctx.fillStyle = `rgba(160, 240, 255, ${0.25 * tear})`;
        ctx.fillRect(hx - 12 * tear, 90 + len / 2, 24 * tear, hy - 90 - len / 2);
      }
      if (dissolve < 1) {
        const dir = walkP < 1 ? "side" : "up";
        const anim = walkP > 0 && walkP < 1 ? "walk" : "idle";
        ctx.globalAlpha = 1 - dissolve;
        s.hero.draw(ctx, hx, hy, dir, anim, Math.floor(f / (anim === "walk" ? 8 : 30)), false, tear > 0.6 && f % 10 < 5, 2);
        ctx.globalAlpha = 1;
      }
      // The body turns into light, drawn up by the rift
      if (dissolve > 0 && dissolve < 1) {
        if (!s.flag.dissolve) { s.flag.dissolve = true; if (Sound.playHolyBurst) Sound.playHolyBurst(); }
        for (let i = 0; i < 3; i++) {
          s.spawn({ x: hx - 16 + Math.random() * 32, y: hy - 60 + Math.random() * 60, vx: (hx - 0) * 0 + (Math.random() - 0.5) * 0.6, vy: -1.2 - Math.random() * 1.4, life: 90, r: 1 + Math.random() * 1.5, c: Math.random() < 0.6 ? "160, 240, 255" : "255, 220, 140", pull: { x: hx, y: 90 } });
        }
      }
    }
  },

  // 6. THE CROSSING BETWEEN WORLDS
  {
    dur: 320,
    sound: "holy",
    lines: [
      { en: "Body became light. Light was pulled across the veil between worlds...",
        fil: "Naging liwanag ang katawan. Hinila ang liwanag patawid sa tabing sa pagitan ng mga mundo..." }
    ],
    draw(ctx, p, f, s) {
      ctx.fillStyle = "#03020a"; ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      // star streaks flowing out from the centre (tunnel)
      s.streaks.forEach((st) => {
        const d = ((st.d + f * st.v) % 300);
        const x1 = cx + Math.cos(st.a) * d, y1 = cy + Math.sin(st.a) * d * 0.6;
        const x2 = cx + Math.cos(st.a) * (d + 6 + d * 0.15), y2 = cy + Math.sin(st.a) * (d + 6 + d * 0.15) * 0.6;
        ctx.strokeStyle = `rgba(${p < 0.5 ? "140, 220, 255" : "255, 220, 150"}, ${Math.min(1, d / 120)})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      });
      glow(ctx, cx, cy, 40 + Math.sin(f / 6) * 6 + p * 30, p < 0.5 ? "160, 240, 255" : "255, 230, 170", 0.8);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx - 2, cy - 2, 4, 4);
      // whiteout at the end
      s.fade = Math.max(s.fade, span(p, 0.85, 1) * 0.9);
    }
  },

  // 7. THE RITUAL BENEATH THE CITADEL
  {
    dur: 720,
    sound: "none",
    lines: [
      { speaker: "summoner", en: "By Astraea's light and the blood of kings — hear me, soul of Earth. Answer!",
        fil: "Sa liwanag ni Astraea at sa dugo ng mga hari — dinggin mo ako, kaluluwa ng Daigdig. Sumagot ka!" },
      { en: "Light wove itself back into sinew and breath upon the stone pedestal. {h} drew a first breath in a new world...",
        fil: "Muling hinabi ng liwanag ang laman at hininga sa ibabaw ng batong pedestal. Unang hininga ni {h} sa bagong mundo..." },
      { en: "...and collapsed.", fil: "...at bumagsak." }
    ],
    draw(ctx, p, f, s) {
      fillGrad(ctx, [[0, "#0a0e1c"], [1, "#141a2c"]], 0, H);
      // stone walls
      ctx.fillStyle = "#1c2238";
      for (let y = 0; y < 170; y += 12) for (let x = (y / 12) % 2 ? 0 : -12; x < W; x += 24) ctx.fillRect(x + 1, y + 1, 22, 10);
      ctx.fillStyle = "#101426"; ctx.fillRect(0, 170, W, 100);
      [70, 410].forEach((x) => { ctx.fillStyle = "#252c46"; ctx.fillRect(x, 0, 18, 175); ctx.fillStyle = "#313a5a"; ctx.fillRect(x, 0, 3, 175); });
      const cx = 240, cy = 214;
      const charge = span(p, 0, 0.35), strike = span(p, 0.35, 0.45), form = span(p, 0.45, 0.62);
      runeCircle(ctx, cx, cy, 120, 30, f, 0.5 + charge * 0.5);
      runeCircle(ctx, cx, cy, 80, 20, -f * 1.6, 0.4 + charge * 0.6);
      runeCircle(ctx, cx, cy, 44, 11, f * 2.4, 0.3 + charge * 0.7);
      // floating mana crystals
      for (let k = 0; k < 4; k++) {
        const a = f / 90 + k * Math.PI / 2;
        const x = cx + Math.cos(a) * 110, y = 150 + Math.sin(a) * 18 + Math.sin(f / 20 + k) * 4;
        glow(ctx, x, y, 16, "120, 230, 255", 0.4 + charge * 0.4);
        ctx.fillStyle = "#7ee8fa";
        ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 4, y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#e0fbff"; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 4, 1, 3);
      }
      // pedestal
      ctx.fillStyle = "#3a4466"; ctx.fillRect(cx - 22, cy - 6, 44, 10);
      ctx.fillStyle = "#4e5a82"; ctx.fillRect(cx - 22, cy - 6, 44, 2);
      // the summoner chanting
      s.summoner.draw(ctx, 110, 222, "side", p < 0.62 ? "attack" : "idle", Math.floor(f / 14), false, false, 2);
      if (p < 0.62) glow(ctx, 138, 186, 14, "160, 240, 255", 0.5 + Math.sin(f / 4) * 0.2);
      // The beam strikes from above
      if (strike > 0 && form < 1) {
        if (!s.flag.strike) { s.flag.strike = true; s.shake = 16; s.flash = 1; if (Sound.playHolyBurst) Sound.playHolyBurst(); }
        const wBeam = 10 + Math.sin(f / 2) * 3;
        ctx.fillStyle = "rgba(160, 240, 255, 0.35)"; ctx.fillRect(cx - wBeam * 1.8, 0, wBeam * 3.6, cy);
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; ctx.fillRect(cx - wBeam / 2, 0, wBeam, cy);
        glow(ctx, cx, cy - 10, 60, "200, 250, 255", 0.7);
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 60;
          s.spawn({ x: cx + Math.cos(a) * d, y: cy - 30 + Math.sin(a) * d * 0.5, vx: 0, vy: 0, life: 50, r: 1.2, c: Math.random() < 0.5 ? "160, 240, 255" : "255, 220, 140", pull: { x: cx, y: cy - 30 }, pullK: 0.08 });
        }
      }
      // The hero takes form: white first, then coloured; then sways and collapses
      if (form > 0) {
        const fall = span(p, 0.8, 0.95);
        const sway = fall > 0 ? Math.sin(f / 5) * 2 * (1 - fall) : 0;
        if (fall < 1) {
          ctx.globalAlpha = Math.min(1, form * 1.5);
          s.hero.draw(ctx, cx + sway, cy - 4, "down", "idle", 0, false, form < 0.7, 2);
          ctx.globalAlpha = 1;
        }
      }
      s.fade = Math.max(s.fade, span(p, 0.88, 1));
    }
  },

  // 8. WAKING IN THE BARRACKS SANCTUARY
  {
    dur: 760,
    sound: "move",
    fadeIn: true,
    lines: [
      { en: "Three days later — the Barracks Sanctuary, a consecrated haven the Void can never cross.",
        fil: "Makalipas ang tatlong araw — ang Barracks Sanctuary, isang banal na kanlungang hindi kailanman matatawid ng Void." },
      { en: "A pale gold panel flickered before {h}'s eyes, a page only they could read: Level 1 · Job: none. Then it faded.",
        fil: "Isang maputlang gintong panel ang kumislap sa harap ng mga mata ni {h}, isang pahinang siya lamang ang makababasa: Level 1 · Job: wala. Saka ito naglaho." },
      { speaker: "summoner", en: "You're awake. Welcome to Aethelgard, {h}. I'm the one who called you here — and I owe you the truth.",
        fil: "Gising ka na. Maligayang pagdating sa Aethelgard, {h}. Ako ang tumawag sa iyo rito — at utang ko sa iyo ang katotohanan." }
    ],
    draw(ctx, p, f, s) {
      fillGrad(ctx, [[0, "#5b7fb8"], [1, "#a8c4e0"]], 0, 60);
      // Barracks walls
      ctx.fillStyle = "#6b6358"; ctx.fillRect(0, 40, W, 40);
      ctx.fillStyle = "#7d7568";
      for (let x = 0; x < W; x += 16) ctx.fillRect(x, 36, 10, 6);
      ctx.fillStyle = "#8a2c2c"; [100, 240, 380].forEach((x) => { ctx.fillRect(x - 8, 46, 16, 26); ctx.fillStyle = "#ffd166"; ctx.fillRect(x - 2, 54, 4, 4); ctx.fillStyle = "#8a2c2c"; });
      // runic cobblestones
      fillGrad(ctx, [[0, "#8c8374"], [1, "#6e665a"]], 80, H);
      ctx.fillStyle = "#7a7264";
      for (let y = 84; y < H; y += 10) for (let x = (y / 10) % 2 ? 0 : -8; x < W; x += 16) ctx.fillRect(x + 1, y + 1, 14, 8);
      runeCircle(ctx, 240, 190, 150, 44, f * 0.3, 0.35);
      // four braziers
      [[40, 110], [440, 110], [40, 250], [440, 250]].forEach(([x, y], k) => {
        glow(ctx, x, y - 10, 30, "255, 150, 60", 0.45 + Math.sin(f / 5 + k) * 0.08);
        ctx.fillStyle = "#3a2f3f"; ctx.fillRect(x - 5, y - 6, 10, 8);
        ctx.fillStyle = "#ff7a1a"; ctx.fillRect(x - 3, y - 12 - (Math.floor(f / 6 + k) % 2), 6, 6);
        ctx.fillStyle = "#ffd166"; ctx.fillRect(x - 1, y - 10, 2, 3);
      });
      // Ronald and Edgar in the background
      s.ronald.draw(ctx, 96, 118, "down", "idle", Math.floor(f / 30), false, false, 1);
      s.edgar.draw(ctx, 384, 118, "down", "idle", Math.floor(f / 34), false, false, 1);
      // higaan
      const bx = 180, by = 180;
      ctx.fillStyle = "#5e3b1a"; ctx.fillRect(bx - 30, by - 4, 64, 12);
      ctx.fillStyle = "#e8e2d0"; ctx.fillRect(bx - 28, by - 8, 60, 8);
      ctx.fillStyle = "#c9c0a8"; ctx.fillRect(bx + 20, by - 10, 12, 6);
      // The hero gets up (lying → standing)
      const rise = ease(span(p, 0.25, 0.4));
      ctx.save();
      ctx.translate(bx + 30 - rise * 20, by - 4 + rise * 30);
      ctx.rotate(-Math.PI / 2 * (1 - rise));
      s.hero.draw(ctx, 0, 0, "down", "idle", rise < 1 ? 0 : Math.floor(f / 30), false, false, 2);
      ctx.restore();
      // The summoner walks in from the right
      const walk = ease(span(p, 0.4, 0.6));
      const moving = walk > 0 && walk < 1;
      s.summoner.draw(ctx, 520 - walk * 250, 216, "side", moving ? "walk" : "idle", Math.floor(f / (moving ? 8 : 30)), true, false, 2);
      s.fade = p < 0.12 ? Math.max(s.fade, 1 - p / 0.12) : s.fade;
    }
  }
];

function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (sh) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

// Rotating rune circle (an ellipse with dots and dashes)
function runeCircle(ctx, cx, cy, rx, ry, f, a) {
  ctx.save();
  ctx.strokeStyle = `rgba(120, 230, 255, ${a})`;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, cy, rx - 5, ry - 2, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = `rgba(190, 250, 255, ${a})`;
  const n = Math.max(8, Math.round(rx / 5));
  for (let i = 0; i < n; i++) {
    const t = f / 120 + (i / n) * Math.PI * 2;
    const x = cx + Math.cos(t) * (rx - 2.5), y = cy + Math.sin(t) * (ry - 1);
    ctx.fillRect(Math.round(x), Math.round(y), i % 3 ? 1 : 2, 1);
  }
  ctx.restore();
}

export class PrologueScene {
  constructor(root, onComplete) {
    this.root = root;
    this.onComplete = onComplete;
    this.open = false;
    this.canvas = root.querySelector("#prologueCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.stageEl = root.querySelector("#proStage");
    this.cardEl = root.querySelector("#proCard");
    this.subEl = root.querySelector("#proSub");
    this.speakerEl = root.querySelector("#proSpeaker");
    this.lineEl = root.querySelector("#proLine");
    this.hintEl = root.querySelector("#proHint");

    // Fixed scene details
    const r = rng(2026);
    this.buildings = [];
    for (let x = -10; x < W + 10;) {
      const w = 30 + Math.floor(r() * 40), h = 60 + Math.floor(r() * 110);
      const win = [];
      for (let wy = 6; wy < h - 6; wy += 7) for (let wx = 4; wx < w - 4; wx += 6) win.push([wx, wy, r() < 0.45]);
      this.buildings.push({ x, w, h, win, c: r() < 0.5 ? "#1a1f2b" : "#20263a" });
      x += w + 2;
    }
    this.streaks = Array.from({ length: 140 }, () => ({ a: r() * Math.PI * 2, d: r() * 300, v: 2 + r() * 4 }));

    this.stageEl.addEventListener("pointerdown", () => this.next());
    window.addEventListener("resize", () => { if (this.open) this.fit(); });
    this.loop = this.loop.bind(this);
  }

  start(heroName = "", avatarConfig = null) {
    const lang = getLang() === "fil" ? "fil" : "en";
    this.heroName = heroName || (lang === "fil" ? "Bayani" : "Champion");
    const sid = summonerIdFor(avatarConfig);
    this.summonerId = sid;
    this.hero = new Avatar(avatarConfig || {});
    this.summoner = new Avatar(NPC_DEFS[sid].look);
    this.king = new Avatar(NPC_DEFS.king.look);
    this.ronald = new Avatar(NPC_DEFS.ronald.look);
    this.edgar = new Avatar(NPC_DEFS.edgar.look);

    this.open = true;
    this.root.classList.add("active");
    this.root.focus();
    Sound.init();
    this.hintEl.innerHTML = lang === "fil"
      ? "<b>Enter</b> Susunod &nbsp;·&nbsp; <b>Esc</b> Laktawan"
      : "<b>Enter</b> Next &nbsp;·&nbsp; <b>Esc</b> Skip";
    this.fit();
    this.goTo(0);
    this.last = performance.now();
    requestAnimationFrame(this.loop);
  }

  // Largest integer scale that fits the screen (pixel-perfect)
  fit() {
    const s = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H)));
    this.canvas.width = W * s;
    this.canvas.height = H * s;
    this.canvas.style.width = `${W * s}px`;
    this.canvas.style.height = `${H * s}px`;
    this.stageEl.style.setProperty("--s", s);
    this.scale = s;
  }

  goTo(i) {
    this.index = i;
    this.frame = 0;
    this.lineIdx = 0;
    this.chars = 0;
    this.hold = 0;
    this.parts = [];
    this.flag = {};
    this.shake = 0;
    this.flash = 0;
    this.fade = 0;
    const sc = SCENES[i];
    if (sc.sound === "holy" && Sound.playHolyBurst) Sound.playHolyBurst();
    else if (sc.sound === "thunder" && Sound.playThunder) Sound.playThunder();
    else if (sc.sound === "dark" && Sound.playDarkCast) Sound.playDarkCast();
    else if (sc.sound === "move" && Sound.playSelectMove) Sound.playSelectMove();

    const lang = getLang() === "fil" ? "fil" : "en";
    if (sc.card) {
      this.cardEl.innerHTML = `<span class="pro-card-act">${sc.card[lang][0]}</span><span class="pro-card-title">${sc.card[lang][1]}</span>`;
      this.cardEl.classList.remove("show");
      void this.cardEl.offsetWidth;
      this.cardEl.classList.add("show");
    }
    this.showLine();
  }

  line() {
    const sc = SCENES[this.index];
    return sc.lines[this.lineIdx];
  }

  lineText() {
    const lang = getLang() === "fil" ? "fil" : "en";
    return this.line()[lang].replace(/\{h\}/g, this.heroName);
  }

  showLine() {
    const ln = this.line();
    this.chars = 0;
    this.hold = 0;
    const who = ln.speaker === "summoner" ? npcName(this.summonerId) : ln.speaker ? npcName(ln.speaker) : "";
    this.speakerEl.textContent = who;
    this.subEl.classList.toggle("spoken", Boolean(who));
    this.lineEl.textContent = "";
  }

  spawn(pt) {
    if (this.parts.length < 400) this.parts.push(pt);
  }

  // Enter / Space / E / click: finish typing → next line → next scene
  next() {
    if (!this.open) return;
    const text = this.lineText();
    if (this.chars < text.length) { this.chars = text.length; return; }
    const sc = SCENES[this.index];
    if (this.lineIdx < sc.lines.length - 1) {
      this.lineIdx++;
      this.showLine();
      if (Sound.playSelectMove) Sound.playSelectMove();
    } else if (this.index < SCENES.length - 1) {
      this.goTo(this.index + 1);
    } else {
      this.finish();
    }
  }

  update() {
    const sc = SCENES[this.index];
    this.frame++;
    const text = this.lineText();
    if (this.chars < text.length) {
      this.chars = Math.min(text.length, this.chars + 0.7);
    } else {
      this.hold++;
      // auto-advance: time to read; the last line also waits for the animation
      const last = this.lineIdx === sc.lines.length - 1;
      const wait = 110 + text.length * 1.2;
      if (this.hold > wait && (!last || this.frame >= sc.dur)) this.next();
    }
    this.lineEl.textContent = text.slice(0, Math.floor(this.chars));

    this.parts.forEach((q) => {
      if (q.pull) {
        const k = q.pullK || 0.02;
        q.vx += (q.pull.x - q.x) * k * 0.05;
        q.vy += (q.pull.y - q.y) * k * 0.05;
      }
      q.x += q.vx; q.y += q.vy; q.life--;
    });
    this.parts = this.parts.filter((q) => q.life > 0);
    if (this.shake > 0) this.shake *= 0.9;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - 0.04);
  }

  draw() {
    const ctx = this.ctx, s = this.scale;
    const sc = SCENES[this.index];
    const p = Math.min(1, this.frame / sc.dur);
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (this.shake > 0.5) ctx.translate(Math.round((Math.random() - 0.5) * this.shake), Math.round((Math.random() - 0.5) * this.shake));
    this.fade = 0;
    sc.draw(ctx, p, this.frame, this);
    this.parts.forEach((q) => {
      ctx.fillStyle = `rgba(${q.c}, ${Math.min(1, q.life / 40)})`;
      ctx.fillRect(Math.round(q.x), Math.round(q.y), Math.ceil(q.r), Math.ceil(q.r));
    });
    ctx.restore();
    if (this.flash > 0) { ctx.fillStyle = `rgba(255, 255, 255, ${this.flash})`; ctx.fillRect(0, 0, W, H); }
    if (this.fade > 0) { ctx.fillStyle = `rgba(255, 255, 255, ${this.fade})`; ctx.fillRect(0, 0, W, H); }
    // Fade in from black at the start of each scene
    const inA = 1 - Math.min(1, this.frame / 30);
    if (inA > 0 && !sc.fadeIn) { ctx.fillStyle = `rgba(3, 2, 10, ${inA})`; ctx.fillRect(0, 0, W, H); }
    // cinematic letterbox
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, 14);
    ctx.fillRect(0, H - 14, W, 14);
  }

  loop(now) {
    if (!this.open) return;
    let steps = Math.min(4, Math.round((now - this.last) / (1000 / 60)));
    if (steps > 0) this.last = now;
    while (steps-- > 0 && this.open) this.update();
    if (!this.open) return;
    this.draw();
    requestAnimationFrame(this.loop);
  }

  finish() {
    if (!this.open) return;
    this.open = false;
    this.root.classList.remove("active");
    if (Sound.playHolyBurst) Sound.playHolyBurst();
    if (this.onComplete) this.onComplete();
  }

  handleInput(e) {
    if (!this.open) return;
    const c = e.code;
    if (c === "Space" || c === "Enter" || c === "KeyE") {
      e.preventDefault();
      if (!e.repeat) this.next();
    } else if (c === "Escape") {
      e.preventDefault();
      this.finish();
    }
  }
}
