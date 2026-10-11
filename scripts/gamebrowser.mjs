// ==================== GAME BROWSER DRIVER ====================
// One headless-Chromium driver shared by the playtest / autoplay / visual-review skills and the
// vof-game MCP server (tools/mcp/vof-game-mcp.mjs): serves the repo, boots the game, runs key
// scripts, reads a state summary through window.__vof (?debug) and plays with a simple bot.
//
//   import { startGame, runSteps, readState, autoplay, FLOWS } from "./gamebrowser.mjs";
//   const g = await startGame({ debug: true });
//   await runSteps(g, FLOWS.newgame);
//   console.log(await readState(g)); await g.close();
//
// Needs Playwright (global install is fine) and a Chromium it can launch; cloud sessions have both.
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Kept as key scripts so they are easy to adjust when menus change (see js/title.js, prologue.js, scenes/codexScene.js).
export const FLOWS = {
  boot: "wait:1500,shot:title",
  newgame: "wait:1200,Enter,wait:400,Enter,wait:1500,shot:creator,Enter,wait:1500,shot:prologue,Backspace,wait:2500,shot:arrival,Enter,wait:400,Enter,wait:400,Enter,wait:400,Enter,wait:400,Enter,wait:400,KeyD*45,wait:300,shot:world",
  continue: "wait:1200,Enter,wait:600,Enter,wait:2000,shot:continue,KeyD*40,shot:world"
};

// ── Playwright, wherever it is installed ─────────────────────────────────────
export function findPlaywright() {
  const require = createRequire(import.meta.url);
  const roots = [ROOT, process.env.NODE_PATH, "/opt/node22/lib/node_modules", path.join(path.dirname(process.execPath), "../lib/node_modules"), path.join(path.dirname(process.execPath), "node_modules")].filter(Boolean);
  for (const r of roots) { try { return require(require.resolve("playwright", { paths: [r] })); } catch { /* next */ } }
  return null;
}

// The pre-installed Chromium of cloud sessions, or CHROMIUM_PATH; otherwise Playwright's own download
export function chromiumPath() {
  return ["/opt/pw-browsers/chromium", process.env.CHROMIUM_PATH].find((p) => p && fs.existsSync(p) && fs.statSync(p).isFile()) || null;
}

// ── Static server ────────────────────────────────────────────────────────────
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".md": "text/markdown; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp", ".mp3": "audio/mpeg" };
export async function serve(root = ROOT, port = 0) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(root, url === "/" ? "index.html" : url);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r, j) => { server.once("error", j); server.listen(port, "127.0.0.1", r); });
  return { server, base: `http://127.0.0.1:${server.address().port}/` };
}

// Expected 404s: js/lore.js probes each Act banner as .jpeg, .jpg, .png, .webp (BANNER_EXTS) until one loads
const EXPECTED_404 = [/\/assets\/banner\/act-\d+\.\w+$/];
const expected = (url) => EXPECTED_404.some((re) => re.test(url));

/**
 * Boots the game. Options: debug (window.__vof), save (JSON text for vanguard_savegame), lang ("en"/"fil"),
 * viewport ("960x600"), root (a checkout to serve, default this repo), outDir (screenshots), seed (seeded Math.random).
 * Returns { page, browser, base, logs: { errors, warnings, failed }, outDir, shots, close() }.
 */
export async function startGame(o = {}) {
  const pw = findPlaywright();
  if (!pw) throw new Error("Playwright not found. Install it once: npm i -D playwright && npx playwright install chromium");
  const { server, base } = await serve(o.root || ROOT);
  const exe = chromiumPath();
  const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
  const [VW, VH] = (o.viewport || "960x600").split("x").map(Number);
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  const logs = { errors: [], warnings: [], failed: [] };
  page.on("console", (m) => {
    // External resources (Google Fonts) can fail offline or behind a proxy; that is not a game error
    const src = (m.location() && m.location().url) || "";
    if (m.type() === "error" && /Failed to load resource/.test(m.text()) && src && (!src.startsWith(base) || expected(src))) return;
    if (m.type() === "error") logs.errors.push(m.text()); else if (m.type() === "warning" && !/AudioContext was not allowed/.test(m.text())) logs.warnings.push(m.text());
  });
  page.on("pageerror", (e) => logs.errors.push(`uncaught: ${e.message}`));
  page.on("requestfailed", (r) => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) logs.failed.push(`${r.failure() && r.failure().errorText} ${r.url()}`); });
  page.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(base) && !expected(r.url())) logs.failed.push(`${r.status()} ${r.url().slice(base.length - 1)}`); });
  await page.addInitScript(([s, l, seed]) => {
    if (s) localStorage.setItem("vanguard_savegame", s);
    if (l) localStorage.setItem("vanguard_lang", l);
    // Seeded Math.random (mulberry32) for repeatable spawns and maps, e.g. before/after screenshots
    if (seed) { let a = seed >>> 0; Math.random = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  }, [o.save || null, o.lang || null, o.seed || 0]);
  await page.goto(o.debug ? `${base}?debug` : base, { waitUntil: o.waitUntil || "load" });
  const outDir = o.outDir || path.join(os.tmpdir(), "vof-playtest");
  fs.mkdirSync(outDir, { recursive: true });
  const g = { page, browser, base, logs, outDir, shots: [], held: new Set() };
  g.close = async () => { await browser.close().catch(() => {}); server.close(); };
  return g;
}

/**
 * Runs a key script: comma-separated steps. "Enter" taps a key (KeyboardEvent.code), "KeyD*45" holds it
 * for 45 frames, "wait:800" waits ms, "shot" / "shot:name" saves a screenshot, "eval:<js>" returns a value,
 * "click:<selector>" clicks, "drag:<from>>><to>" drags with the mouse. Also accepts an array of steps
 * (lets eval steps contain commas). Returns { shots: [paths], evals: [{ js, value }] }.
 */
export async function runSteps(g, script, { log = null } = {}) {
  const { page } = g;
  const steps = Array.isArray(script) ? script : String(script || "").split(",");
  const out = { shots: [], evals: [] };
  for (const raw of steps.map((s) => s.trim()).filter(Boolean)) {
    const [step, arg] = raw.split(/:(.*)/);
    if (step === "wait") await page.waitForTimeout(parseInt(arg, 10) || 300);
    else if (step === "shot") {
      const f = path.join(g.outDir, `${String(g.shots.length + 1).padStart(2, "0")}-${(arg || "shot").replace(/[^\w-]/g, "_")}.png`);
      await page.screenshot({ path: f });
      g.shots.push(f); out.shots.push(f);
    } else if (step === "eval") {
      const value = await page.evaluate(arg).catch((e) => `error: ${e.message}`);
      out.evals.push({ js: arg, value });
      if (log) log(`eval ${arg} → ${JSON.stringify(value)}`);
    } else if (step === "click") { await page.click(arg); await page.waitForTimeout(80); }
    else if (step === "drag") {
      const [from, to] = arg.split(">>").map((x) => x.trim());
      const a = await page.locator(from).first().boundingBox(), b = await page.locator(to).first().boundingBox();
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
      await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(80);
    } else {
      const [key, hold] = step.split("*");
      if (hold) { await page.keyboard.down(key); await page.waitForTimeout(Math.round((parseInt(hold, 10) * 1000) / 60)); await page.keyboard.up(key); }
      else await page.keyboard.press(key);
      await page.waitForTimeout(80);
    }
  }
  return out;
}

/** A compact state summary. Full detail needs ?debug (startGame({ debug: true })); without it only DOM facts. */
export async function readState(g) {
  return g.page.evaluate(() => {
    const v = window.__vof;
    const base = { title: document.title, hud: ((document.getElementById("hudText") || {}).textContent || "").trim().slice(0, 120), save: Boolean(localStorage.getItem("vanguard_savegame")), debug: Boolean(v) };
    if (!v || !v.player) return { ...base, state: v ? v.state : undefined };
    const p = v.player, st = v.stage, em = v.enemyManager;
    const cx = p.x + 10, cy = p.y + 10;
    const foes = (em.enemies || []).filter((e) => e.isAlive).map((e) => ({ key: e.key, lvl: e.level, hp: Math.round(e.hp), maxHp: Math.round(e.maxHp), boss: Boolean(e.boss), elite: Boolean(e.elite), d: Math.round(Math.hypot(e.x + 10 - cx, e.y + 10 - cy)) })).sort((a, b) => a.d - b.d);
    const open = ["dialog", "inventory", "charPanel", "codexScene", "regressionModal", "actIntro", "market", "settingsPanel"].filter((k) => v[k] && v[k].open);
    return {
      ...base, state: v.state, area: st.id || "hub", inSafeZone: Boolean(st.isInsideSafeZone && st.isInsideSafeZone(p.x, p.y)),
      hero: { name: p.heroName, cls: p.heroData && p.heroData.id, level: p.level, exp: `${p.exp}/${p.expNext}`, hp: `${Math.round(p.hp)}/${p.maxHp}`, stamina: Math.round(p.stamina), gold: p.gold, attack: p.attack, defense: p.defense, x: Math.round(p.x), y: Math.round(p.y) },
      quest: { step: v.quest.step },
      enemies: { alive: foes.length, nearest: foes.slice(0, 5) },
      open
    };
  });
}

/**
 * A simple bot: walks to the nearest live monster, holds J (attack) in range, taps K/L when ready,
 * taps quick slot 1 (potions) below 40% HP, clicks through dialogs. It skips elites, bosses and monsters
 * 5+ levels above the hero unless they are much closer (hunt: true attacks them like anything else).
 * Options: seconds, immortal (tops HP up and counts the would-be deaths, for soak tests), skills and
 * potions (default true), hunt. Returns a report: kills, EXP, levels, gold, lowest HP %, deaths,
 * stuck count, console errors during the run.
 */
export async function autoplay(g, o = {}) {
  const { page } = g;
  const seconds = o.seconds || 60, immortal = Boolean(o.immortal), useSkills = o.skills !== false;
  const ok = await page.evaluate(() => Boolean(window.__vof && window.__vof.player));
  if (!ok) throw new Error("autoplay needs a running game with ?debug (startGame({ debug: true }) and a new game or a save)");
  const errors0 = g.logs.errors.length;
  const start = await page.evaluate(() => { const p = __vof.player; return { level: p.level, gold: p.gold }; });
  // Kills: count the isAlive → false transitions the page sees (hooked once per page)
  await page.evaluate(() => {
    if (window.__botKills !== undefined) return;
    window.__botKills = 0; window.__botExp = 0;
    const em = __vof.enemyManager, prev = em.onKill;
    em.onKill = function (e, byPlayer, exp) {
      if (byPlayer) { window.__botKills++; window.__botExp += exp || 0; }
      return prev ? prev.call(this, e, byPlayer, exp) : undefined;
    };
  });
  const [kills0, exp0] = await page.evaluate(() => [window.__botKills, window.__botExp]);
  const keys = ["KeyW", "KeyA", "KeyS", "KeyD", "KeyJ"];
  const want = new Set();
  const setKeys = async (next) => {
    for (const k of keys) {
      if (next.has(k) && !want.has(k)) { await page.keyboard.down(k); want.add(k); }
      else if (!next.has(k) && want.has(k)) { await page.keyboard.up(k); want.delete(k); }
    }
  };
  let deaths = 0, stuck = 0, potions = 0, lastPot = 0, minHp = 1, last = null, still = 0, detour = 0, detourKeys = new Set();
  const end = Date.now() + seconds * 1000;
  while (Date.now() < end) {
    const s = await page.evaluate(([imm, hunt]) => {
      const v = __vof, p = v.player;
      if (v.state === "GAMEOVER") return { over: true };
      const blocking = ["dialog", "actIntro", "codexScene"].find((k) => v[k] && v[k].open);
      const r = { over: false, blocking, hp: p.hp / p.maxHp, x: p.x, y: p.y, range: (p.heroData && p.heroData.range) || 40, k: p.skillCooldownTimer <= 0, l: p.skill2CooldownTimer <= 0 };
      if (imm && p.hp < p.maxHp * 0.25) { p.hp = p.maxHp; r.saved = true; }
      const cx = p.x + 10, cy = p.y + 10, fx = p.x + 10, fy = p.y + 20;
      // Walking distance over the tile grid (breadth-first from the hero's feet), so a monster across
      // water or behind a wall is not "near" and the hero walks around obstacles instead of into them
      const tm = v.stage.tilemap;
      let dist = null, prev = null, T = 16, cols = 0, rows = 0;
      const tileOf = (x, y) => [Math.floor(x / T), Math.floor(y / T)];
      if (tm && tm.solid) {
        T = tm.tile || 16; cols = tm.cols; rows = tm.rows;
        const block = (v.stage.navGrid && v.stage.navGrid.block) || tm.solid;
        const [sx, sy] = tileOf(fx, fy);
        if (sx >= 0 && sy >= 0 && sx < cols && sy < rows) {
          dist = new Int32Array(cols * rows).fill(-1); prev = new Int32Array(cols * rows).fill(-1);
          const q = new Int32Array(cols * rows); let h = 0, t = 0;
          const s0 = sy * cols + sx; dist[s0] = 0; q[t++] = s0;
          while (h < t) {
            const i = q[h++], x = i % cols, y = (i - x) / cols;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
              const nx = x + dx, ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
              const j = ny * cols + nx;
              if (dist[j] !== -1 || block[j]) continue;
              if (dx && dy && (block[y * cols + nx] || block[ny * cols + x])) continue;
              dist[j] = dist[i] + 1; prev[j] = i; q[t++] = j;
            }
          }
        }
      }
      const walk = (e) => {
        const d = Math.hypot(e.x + 10 - cx, e.y + 10 - cy);
        if (!dist || d < 40) return d;
        const [tx, ty] = tileOf(e.x + 10, e.y + 20);
        if (tx < 0 || ty < 0 || tx >= cols || ty >= rows) return Infinity;
        const w = dist[ty * cols + tx];
        return w < 0 ? Infinity : w * T;
      };
      // Nearest fair fight first: whatever is already on the hero, then normal monsters; elites, bosses
      // and monsters 5+ levels up only when close (unless hunting)
      let best = null, bd = Infinity;
      for (const e of v.enemyManager.enemies || []) {
        if (!e.isAlive) continue;
        const w = walk(e);
        if (w === Infinity) continue;
        const tough = (e.elite || e.boss || (e.level || 0) > p.level + 4) && !hunt && w > 50;
        const score = tough ? w + 400 : w;
        if (score < bd) { bd = score; best = e; }
      }
      if (best) {
        r.dx = best.x + 10 - cx; r.dy = best.y + 10 - cy; r.d = Math.hypot(r.dx, r.dy);
        r.mx = r.dx; r.my = r.dy;
        // Off a straight line: head for the path tile a few steps ahead
        if (dist && r.d >= 40) {
          const [tx, ty] = tileOf(best.x + 10, best.y + 20);
          let i = ty * cols + tx; const path = [];
          while (i >= 0 && dist[i] > 0) { path.push(i); i = prev[i]; }
          const way = path[Math.max(0, path.length - 3)];
          if (way !== undefined) { const wx = way % cols, wy = (way - wx) / cols; r.mx = wx * T + T / 2 - fx; r.my = wy * T + T / 2 - fy; }
        }
      }
      return r;
    }, [immortal, Boolean(o.hunt)]);
    if (s.over) { deaths++; break; }
    if (s.blocking) { await setKeys(new Set()); await page.keyboard.press(s.blocking === "dialog" ? "Enter" : "Backspace"); await page.waitForTimeout(150); continue; }
    if (s.saved) deaths++;
    minHp = Math.min(minHp, s.hp);
    // Quick slot 1 holds the potions on a new hero; the game's own potion cooldown limits the taps
    if (o.potions !== false && s.hp < 0.4 && Date.now() - lastPot > 1500) { await page.keyboard.press("Digit1"); lastPot = Date.now(); potions++; }
    const next = new Set();
    if (detour > 0) { detour--; detourKeys.forEach((k) => next.add(k)); }
    else if (s.d !== undefined) {
      const near = s.d < Math.max(24, s.range * 0.8);
      if (!near) {
        const m = Math.hypot(s.mx, s.my) || 1;
        if (s.mx / m > 0.38) next.add("KeyD"); else if (s.mx / m < -0.38) next.add("KeyA");
        if (s.my / m > 0.38) next.add("KeyS"); else if (s.my / m < -0.38) next.add("KeyW");
      }
      if (s.d < s.range + 12) next.add("KeyJ");
      // Stuck against a wall or water: sidestep for ~1 s
      const moved = last ? Math.hypot(s.x - last.x, s.y - last.y) : 9;
      still = !near && moved < 0.5 ? still + 1 : 0;
      if (still > 12) {
        stuck++; still = 0; detour = 10;
        const side = Math.random() < 0.5;
        detourKeys = new Set(Math.abs(s.dx) > Math.abs(s.dy) ? [side ? "KeyW" : "KeyS"] : [side ? "KeyA" : "KeyD"]);
      }
      if (useSkills && s.d < s.range + 30) {
        if (s.k) await page.keyboard.press("KeyK");
        else if (s.l) await page.keyboard.press("KeyL");
      }
    } else {
      // Nothing alive nearby: wander so the spawner has room to work
      next.add(["KeyW", "KeyA", "KeyS", "KeyD"][Math.floor(Date.now() / 2500) % 4]);
    }
    await setKeys(next);
    last = s;
    await page.waitForTimeout(90);
  }
  await setKeys(new Set());
  const fin = await page.evaluate(() => { const p = __vof.player; return { level: p.level, exp: p.exp, gold: p.gold, hp: `${Math.round(p.hp)}/${p.maxHp}`, kills: window.__botKills, expKills: window.__botExp, state: __vof.state, area: __vof.stage.id || "hub" }; });
  return {
    seconds, area: fin.area, kills: fin.kills - kills0, killsPerMin: +(((fin.kills - kills0) * 60) / seconds).toFixed(1),
    level: `${start.level} → ${fin.level}`, expFromKills: fin.expKills - exp0, expPerMin: Math.round(((fin.expKills - exp0) * 60) / seconds), gold: fin.gold - start.gold,
    lowestHp: `${Math.round(minHp * 100)}%`, deaths: immortal ? `${deaths} (immortal: HP refilled at 25%)` : deaths,
    potionTaps: potions, stuck, endState: fin.state, hp: fin.hp, newErrors: g.logs.errors.slice(errors0)
  };
}

/** Puts a debug game in shape for a bot or a screenshot: level, class (Awakening), area. */
export async function setupHero(g, { level, cls, area } = {}) {
  return g.page.evaluate(async ([lv, c, a]) => {
    const v = __vof;
    // Level-ups past 10 open the Job Awakening (codexScene "awaken") and quest steps an Act title card;
    // setup closes those and any dialog so the camera shows the world
    const settle = () => ["codexScene", "dialog", "actIntro"].forEach((k) => { if (v[k] && v[k].open && v[k].close) v[k].close(); });
    if (lv && v.player.level < lv) { let n = 0; while (v.player.level < lv && n++ < 500) v.player.addExp(v.player.expNext - v.player.exp); }
    settle();
    if (c && (!v.player.heroData || v.player.heroData.id !== c)) {
      const hero = v.ROSTER.find((h) => h.id === c);
      if (!hero) return `unknown class ${c}; classes: ${v.ROSTER.map((h) => h.id).join(", ")}`;
      v.awaken(hero);
      settle();
    }
    if (a) v.travelTo(a);
    await new Promise((r) => setTimeout(r, 600));
    settle();
    const p = v.player;
    return `hero ${p.heroData && p.heroData.id} Lv ${p.level} in ${v.stage.id || "hub"}`;
  }, [level || 0, cls || null, area || null]);
}
