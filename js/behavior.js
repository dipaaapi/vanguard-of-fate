// ==================== IDLE BEHAVIORS (every living creature) ====================
// Anything alive that stands still for a while (the hero included, no exemptions) rolls a random
// behavior from its pool: a short body pose (juice.js format) plus an optional emote glyph above the
// head. Moving, fighting or getting hurt cancels it at once; the pause before the next roll is random.
//
//   tickBehavior(actor, idle, pool)  — once per simulation step; returns the active behavior or null
//   behaviorPose(actor)              — pose to mix() into the actor's draw (null when none)
//   drawBehaviorEmote(ctx, actor, x, y) — glyph above the head (x, y = top centre of the sprite)

// Pools: [id, weight, duration in frames (60 = 1 s), emote glyph or null]
export const BEHAVIOR_POOLS = {
  hero: [["stretch", 3, 70, null], ["look", 4, 90, "?"], ["yawn", 2, 80, "…"], ["sit", 2, 150, null], ["hum", 3, 120, "♪"], ["hop", 2, 40, null], ["sigh", 1, 70, "…"]],
  humanoid: [["stretch", 3, 70, null], ["look", 4, 90, "?"], ["yawn", 2, 80, "…"], ["hum", 3, 120, "♪"], ["wave", 2, 60, "!"], ["sit", 1, 150, null], ["laugh", 2, 60, "♥"]],
  beast: [["sniff", 4, 80, "?"], ["sleep", 2, 220, "z"], ["scratch", 3, 60, null], ["call", 2, 50, "!"], ["hop", 2, 40, null], ["groom", 2, 90, null], ["look", 3, 90, null]],
  boss: [["look", 3, 90, null], ["call", 2, 60, "!"], ["stretch", 1, 80, null]]
};

const PAUSE_MIN = 240, PAUSE_MAX = 720;   // 4–12 s of standing still before a behavior
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

function roll(pool) {
  const list = BEHAVIOR_POOLS[pool] || BEHAVIOR_POOLS.beast;
  let w = Math.random() * list.reduce((s, b) => s + b[1], 0);
  for (const b of list) if ((w -= b[1]) <= 0) return b;
  return list[0];
}

export function tickBehavior(a, idle, pool) {
  const s = a.bhv || (a.bhv = { wait: rnd(PAUSE_MIN / 2, PAUSE_MAX), cur: null, t: 0, max: 0, glyph: null });
  if (!idle) { s.cur = null; if (s.wait < PAUSE_MIN / 2) s.wait = rnd(PAUSE_MIN / 2, PAUSE_MAX); return null; }
  if (s.cur) {
    if (++s.t >= s.max) { s.cur = null; s.wait = rnd(PAUSE_MIN, PAUSE_MAX); }
    return s.cur;
  }
  if (--s.wait > 0) return null;
  const [id, , dur, glyph] = roll(pool);
  Object.assign(s, { cur: id, t: 0, max: rnd(Math.round(dur * 0.8), Math.round(dur * 1.25)), glyph });
  return id;
}

// Shape of each behavior over k = 0 → 1 (eased in and out by env)
export function behaviorPose(a) {
  const s = a && a.bhv;
  if (!s || !s.cur) return null;
  const k = s.t / s.max, env = Math.sin(Math.min(1, k) * Math.PI), t = s.t;
  switch (s.cur) {
    case "stretch": return { sx: 1 - 0.06 * env, sy: 1 + 0.1 * env, ox: 0, oy: 0 };
    case "yawn": return { sx: 1 + 0.03 * env, sy: 1 + 0.05 * env * Math.sin(t * 0.1), ox: 0, oy: 0 };
    case "sigh": return { sx: 1 + 0.04 * env, sy: 1 - 0.05 * env, ox: 0, oy: 0 };
    case "sit": case "sleep": return { sx: 1 + 0.08 * env, sy: 1 - 0.16 * env + (s.cur === "sleep" ? Math.sin(t * 0.05) * 0.02 * env : 0), ox: 0, oy: 0 };
    case "look": return { sx: 1, sy: 1, ox: Math.sign(Math.sin(k * Math.PI * 3)) * env, oy: 0 };
    case "hum": return { sx: 1, sy: 1 + Math.sin(t * 0.2) * 0.03 * env, ox: Math.sin(t * 0.1) * env, oy: 0 };
    case "laugh": return { sx: 1, sy: 1 + Math.abs(Math.sin(t * 0.5)) * 0.06 * env, ox: 0, oy: 0 };
    case "wave": return { sx: 1, sy: 1, ox: Math.sin(t * 0.4) * 0.8 * env, oy: 0 };
    case "hop": return { sx: 1 - 0.05 * Math.sin(k * Math.PI), sy: 1 + 0.08 * Math.sin(k * Math.PI), ox: 0, oy: -5 * Math.sin(k * Math.PI) };
    case "call": return { sx: 1 - 0.04 * env, sy: 1 + 0.12 * env, ox: 0, oy: -1 * env };
    case "sniff": return { sx: 1 + 0.04 * env, sy: 1 - 0.06 * env, ox: Math.sin(t * 0.35) * 1.2 * env, oy: 0 };
    case "scratch": return { sx: 1, sy: 1, ox: Math.sin(t * 1.3) * 1 * env, oy: 0 };
    case "groom": return { sx: 1 + 0.03 * env, sy: 1 - 0.07 * env, ox: Math.sin(t * 0.25) * 0.6 * env, oy: 0 };
  }
  return null;
}

// 5×5 pixel glyphs, so the emote stays crisp at any scale
const GLYPHS = {
  "?": ["01110", "10001", "00110", "00000", "00100"],
  "!": ["00100", "00100", "00100", "00000", "00100"],
  "z": ["11111", "00010", "00100", "01000", "11111"],
  "♪": ["00110", "00101", "00100", "11100", "11100"],
  "♥": ["01010", "11111", "11111", "01110", "00100"],
  "…": ["00000", "00000", "00000", "00000", "10101"]
};
const GLYPH_COLOR = { "?": "#facc15", "!": "#f87171", "z": "#93c5fd", "♪": "#86efac", "♥": "#f9a8d4", "…": "#e2e8f0" };

export function drawBehaviorEmote(ctx, a, x, y) {
  const s = a && a.bhv;
  if (!s || !s.cur || !s.glyph || !GLYPHS[s.glyph]) return;
  const k = s.t / s.max;
  const rows = GLYPHS[s.glyph];
  const gx = Math.round(x - 3 + (s.glyph === "z" ? k * 4 : 0)), gy = Math.round(y - 9 - k * 3);
  ctx.save();
  ctx.globalAlpha *= Math.min(1, Math.sin(Math.min(1, k) * Math.PI) * 2.5);
  ctx.fillStyle = "rgba(15,23,42,0.75)";
  ctx.fillRect(gx - 1, gy - 1, 7, 7);
  ctx.fillStyle = GLYPH_COLOR[s.glyph];
  rows.forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === "1") ctx.fillRect(gx + i, gy + j, 1, 1); });
  ctx.restore();
}
