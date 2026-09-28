// ==================== JUICE: COMBAT ANIMATION HELPERS ====================
// Shared "game feel" for every fighter (hero, enemies, mercenaries, summons, NPCs):
//   · poses       — squash & stretch computed from the timers each entity already has
//   · around()    — draws any sprite through a pose, pivoting on its feet
//   · drawSwing() — a fading crescent that follows a melee swing
//   · hit-stop    — freezes the simulation for a few frames on heavy impacts (see FXManager)
// A pose is { sx, sy, ox, oy }: scale X/Y about the feet and an offset in pixels.

export const REST = Object.freeze({ sx: 1, sy: 1, ox: 0, oy: 0 });

const ease = (t) => 1 - (1 - t) * (1 - t);

// Struck: flattens and widens at once, then springs back (t counts down from max)
export function hitPose(t, max, dirX = 0) {
  if (t <= 0) return REST;
  const k = t / max;
  const wob = Math.sin((1 - k) * Math.PI * 2.5) * k;   // a quick spring, not a single dip
  return { sx: 1 + 0.2 * wob, sy: 1 - 0.18 * wob, ox: -dirX * 2 * k, oy: 0 };
}

// Attack in three beats: anticipation (lean back, crouch) → strike (lunge, stretch) → recover.
// p runs 0 → 1 over the attack; (dx, dy) is the unit direction of the attack.
export function attackPose(p, dx = 1, dy = 0, reach = 3) {
  if (p <= 0 || p >= 1) return REST;
  if (p < 0.35) {
    const k = ease(p / 0.35);
    return { sx: 1 + 0.08 * k, sy: 1 - 0.1 * k, ox: -dx * 1.5 * k, oy: -dy * 1.5 * k };
  }
  if (p < 0.6) {
    const k = Math.sin(((p - 0.35) / 0.25) * Math.PI);
    return { sx: 1 - 0.08 * k, sy: 1 + 0.12 * k, ox: dx * reach * k, oy: dy * reach * k };
  }
  const k = 1 - ease((p - 0.6) / 0.4);
  return { sx: 1 + 0.03 * k, sy: 1 - 0.03 * k, ox: 0, oy: 0 };
}

// Winding up a telegraphed attack: a crouch that deepens, with a shiver near the end
export function windupPose(t, max, tick = 0) {
  if (t <= 0) return REST;
  const k = Math.min(1, t / max);
  const shiver = k > 0.6 ? Math.sin(tick * 1.7) * 0.6 : 0;
  return { sx: 1 + 0.1 * k, sy: 1 - 0.12 * k, ox: shiver, oy: 0 };
}

// Idle breathing (tiny, so pixel art stays crisp)
export function breathPose(tick, speed = 0.06, amt = 0.025) {
  const s = Math.sin(tick * speed);
  return { sx: 1 - s * amt * 0.5, sy: 1 + s * amt, ox: 0, oy: 0 };
}

// Spawning: pops up out of the ground (t counts up to max)
export function spawnPose(t, max) {
  if (t >= max) return REST;
  const k = t / max;
  const over = Math.sin(k * Math.PI) * 0.15;   // overshoot, then settle
  return { sx: 0.6 + 0.4 * k - over * 0.5, sy: 0.3 + 0.7 * k + over, ox: 0, oy: 0 };
}

// Combine poses (scales multiply, offsets add)
export function mix(...poses) {
  const out = { sx: 1, sy: 1, ox: 0, oy: 0 };
  poses.forEach((p) => { if (!p) return; out.sx *= p.sx; out.sy *= p.sy; out.ox += p.ox; out.oy += p.oy; });
  return out;
}

// Draw through a pose, pivoting on the feet (fx, fy)
export function around(ctx, fx, fy, pose, fn) {
  if (!pose || pose === REST || (pose.sx === 1 && pose.sy === 1 && !pose.ox && !pose.oy)) { fn(); return; }
  ctx.save();
  ctx.translate(fx + pose.ox, fy + pose.oy);
  ctx.scale(pose.sx, pose.sy);
  ctx.translate(-fx, -fy);
  fn();
  ctx.restore();
}

// Melee swing trail: a crescent sweeping across `arc` radians, centred on `angle`.
// p runs 0 → 1; the leading edge is bright, the tail fades.
export function drawSwing(ctx, x, y, angle, radius, p, color = "#ffffff", arc = 2.2, width = 3) {
  if (p <= 0 || p >= 1) return;
  const lead = -arc / 2 + arc * ease(Math.min(1, p * 1.6));
  const tail = Math.max(-arc / 2, lead - arc * 0.7);
  const fade = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
  ctx.save();
  ctx.lineCap = "round";
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    const a0 = tail + ((lead - tail) * i) / steps;
    const a1 = tail + ((lead - tail) * (i + 1)) / steps;
    ctx.globalAlpha = fade * (0.15 + 0.75 * ((i + 1) / steps));
    ctx.strokeStyle = i === steps - 1 ? "#ffffff" : color;
    ctx.lineWidth = Math.max(1, width * ((i + 1) / steps));
    ctx.beginPath();
    ctx.arc(x, y, radius, angle + a0, angle + a1);
    ctx.stroke();
  }
  ctx.restore();
}
