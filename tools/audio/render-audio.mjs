#!/usr/bin/env node
/**
 * render-audio.mjs — renders the game's synthesised music and sound effects offline (headless Chromium,
 * OfflineAudioContext, the real js/audio.js) to WAV files, and prints peak / loudness per sound so a
 * change can be checked for clipping or silence without listening.
 *
 *   node tools/audio/render-audio.mjs                  # every track (one loop) and every effect
 *   node tools/audio/render-audio.mjs music            # tracks only   (or: sfx, jingles, or names: hub boss playSlash)
 *   node tools/audio/render-audio.mjs --out <dir>      # default <tmp>/vof-audio
 *   node tools/audio/render-audio.mjs --mp3            # also convert to MP3 with ffmpeg when installed
 */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const outDir = opt("--out", path.join(os.tmpdir(), "vof-audio"));
const wants = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--out");

function findPlaywright() {
  const require = createRequire(import.meta.url);
  for (const r of [ROOT, process.env.NODE_PATH, "/opt/node22/lib/node_modules"].filter(Boolean)) { try { return require(require.resolve("playwright", { paths: [r] })); } catch { /* next */ } }
  return null;
}
const pw = findPlaywright();
if (!pw) { console.error("Playwright not found (npm i -D playwright)"); process.exit(2); }

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/__audio.html") { res.writeHead(200, { "Content-Type": "text/html" }); res.end("<!doctype html><meta charset=utf-8><body>"); return; }
  const file = path.join(ROOT, url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": file.endsWith(".js") ? "text/javascript" : "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;
const exe = ["/opt/pw-browsers/chromium", process.env.CHROMIUM_PATH].find((p) => p && fs.existsSync(p) && fs.statSync(p).isFile());
const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(base + "__audio.html");

const SFX = ["playSelectMove", "playSelectConfirm", "playUiOpen", "playUiClose", "playSlash", "playHitEnemy", "playCriticalHit", "playHitPlayer", "playGuard", "playDash", "playDodge",
  "playForceSphere", "playMeteorCast", "playMeteorExplosion", "playThunder", "playArrowShoot", "playFalconScreech", "playHolyBurst", "playHeal", "playForcefield", "playDarkCast",
  "playEnemyDeath", "playBossRoar", "playBossCast", "playBossDeath", "playLootPickup", "playCoin", "playPortal"];
const jobs = await page.evaluate(async () => {
  const { TRACKS, JINGLES } = await import("/js/music.js");
  return { tracks: Object.keys(TRACKS), jingles: Object.keys(JINGLES) };
});
const list = [
  ...jobs.tracks.map((n) => ({ kind: "music", name: n })),
  ...jobs.jingles.map((n) => ({ kind: "jingles", name: n })),
  ...SFX.map((n) => ({ kind: "sfx", name: n }))
].filter((j) => !wants.length || wants.includes(j.kind) || wants.includes(j.name));

fs.mkdirSync(outDir, { recursive: true });
let bad = 0;
for (const job of list) {
  const r = await page.evaluate(async ({ kind, name }) => {
    const { Sound } = await import("/js/audio.js");
    const { TRACKS, compileTrack } = await import("/js/music.js");
    const sr = 44100;
    let dur = 2.5;
    if (kind === "music") { const t = compileTrack(TRACKS[name]); dur = (t.length / (t.steps / 4)) * (60 / t.bpm) + 2; }
    if (kind === "jingles") dur = 4;
    const ctx = new OfflineAudioContext(2, Math.ceil(sr * dur), sr);
    // fresh engine state on the offline context
    Sound.ctx = ctx; Sound.build(); Sound.current = null; Sound.lastPlayed = {}; Sound.jingleUntil = 0; Sound.isMuted = false; Sound.sfxEnabled = true; Sound._musicEnabled = true;
    Sound.listenerX = Sound.listenerY = Sound.camX = Sound.camY = null;
    if (kind === "music") {
      Sound.playTrack(name);
      clearInterval(Sound.timer); Sound.timer = null;
      Sound.current.gain.gain.cancelScheduledValues(0); Sound.current.gain.gain.setValueAtTime(TRACKS[name].gain || 1, 0);
      Sound.current.time = 0.05;
      Sound.schedule(dur - 2);
    } else if (kind === "jingles") Sound.playJingle(name);
    else Sound[name]();
    const buf = await ctx.startRendering();
    Sound.current = null;
    // stats + 16-bit WAV
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    let peak = 0, sum = 0;
    for (let i = 0; i < L.length; i++) { const v = Math.max(Math.abs(L[i]), Math.abs(R[i])); peak = Math.max(peak, v); sum += L[i] * L[i]; }
    const rms = Math.sqrt(sum / L.length);
    const n = L.length, data = new DataView(new ArrayBuffer(44 + n * 4));
    const w = (o, s) => [...s].forEach((ch, i) => data.setUint8(o + i, ch.charCodeAt(0)));
    w(0, "RIFF"); data.setUint32(4, 36 + n * 4, true); w(8, "WAVEfmt "); data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 2, true);
    data.setUint32(24, sr, true); data.setUint32(28, sr * 4, true); data.setUint16(32, 4, true); data.setUint16(34, 16, true); w(36, "data"); data.setUint32(40, n * 4, true);
    for (let i = 0; i < n; i++) { data.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); data.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
    const bytes = new Uint8Array(data.buffer);
    let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { b64: btoa(bin), peak, rms, dur };
  }, job).catch((e) => ({ error: e.message.split("\n")[0] }));
  if (r.error) { console.log(`✗ ${job.kind}/${job.name}: ${r.error}`); bad++; continue; }
  const file = path.join(outDir, `${job.kind}-${job.name}.wav`);
  fs.writeFileSync(file, Buffer.from(r.b64, "base64"));
  const db = (v) => (v > 0 ? (20 * Math.log10(v)).toFixed(1) : "-inf");
  const flag = r.peak >= 0.999 ? "  CLIPS" : r.peak < 0.01 ? "  SILENT" : "";
  if (flag) bad++;
  console.log(`${flag ? "!" : "✓"} ${`${job.kind}/${job.name}`.padEnd(30)} ${r.dur.toFixed(1).padStart(5)} s  peak ${db(r.peak).padStart(6)} dB  rms ${db(r.rms).padStart(6)} dB${flag}`);
  if (argv.includes("--mp3")) { try { execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-b:a", "128k", file.replace(/\.wav$/, ".mp3")]); } catch { /* optional */ } }
}
if (errors.length) console.error(errors.join("\n"));
await browser.close();
server.close();
process.exit(bad || errors.length ? 1 : 0);
