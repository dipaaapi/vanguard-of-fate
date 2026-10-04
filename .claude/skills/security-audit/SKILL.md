---
name: security-audit
description: Security audit for Vanguard of Fate — save import/export (.vof / legacy .json), localStorage hydration, untrusted strings reaching innerHTML, fetched data files, page config and the local dev server. Use when the user asks to audit, harden or "secure" the game, before a release, or when a change touches saving/loading, js/saveSecurity.js, index.html or the way text is put into the DOM.
---

# Vanguard of Fate security audit

Vanguard of Fate is a static browser game: plain ES modules served as files, no backend, no accounts, no npm dependencies at runtime. Its attack surface is small but real:

1. **Save files are untrusted input.** Players share `.vof` / `.json` saves; a crafted save goes through `importSaveFile` → `SaveSecurity.importSecureSave` → `localStorage["vanguard_savegame"]` → `loadGame`, and from there into every system.
2. **localStorage is untrusted on load.** `vanguard_savegame`, `vanguard_config` and the language key can be edited in devtools or left over from an old version; `loadGame`, `loadGameConfig` and `getLang` must treat them like an imported save.
3. **Anything rendered from a save** (hero name, creator look, item ids, quest state) can reach `innerHTML`, Canvas `fillText` or a CSS value.
4. **Fetched files**: `data/npc_conversations.json` (`js/npc/npcs.js`) and `LORE.md` / `LORE_FIL.md` (`js/lore.js`) are first-party, but how they are rendered matters.
5. **The page and dev server**: `index.html` (Google Fonts, no CSP), `.claude/launch.json` (`npx http-server`).

Cheating in a single-player offline game (editing your own gold) is **not** a vulnerability, and `SaveSecurity`'s salt/"HMAC" lives in client code, so it is tamper *detection*, never real protection. Don't report that as a finding; do report anything that lets a crafted save **run script, crash, soft-lock, or corrupt other saves**, plus prototype pollution and denial of service (huge numbers, huge arrays, NaN/Infinity).

## Workflow

Work through each section below. Use `node .claude/skills/codemap/codemap.mjs outline <file>` and read only the functions named. For each finding record: file:line, what input triggers it, what happens (crash, XSS, soft-lock, corrupted save), severity (critical / high / medium / low), and a minimal fix. Then present findings ranked by severity and ask before fixing anything non-trivial. Never weaken a check to make something pass.

### 1. Save import & load

Files: `js/main.js` (`getSavePayload`, `saveGame`, `exportSaveFile`, `importSaveFile`, `loadGame`, `beginPlaying`), `js/saveSecurity.js` (`importSecureSave`, `sanitizeAndAudit`, `exportSecureSave`), `js/items/bag.js` (bag restore), `js/avatar/options.js` (`normalizeConfig`), `js/quest.js` (quest restore).

Check that:
- File size is capped before `FileReader.readAsText` / `JSON.parse` (a 500 MB file freezes the tab).
- Every field is type-checked, not just truthy-checked. `data.x || default` and `{ ...DEFAULTS, ...data.x }` accept wrong types (a string level, an array where an object is expected, `gold: "1e999"`).
- Numbers are finite and clamped (`Number.isFinite`, ≥ 0, sane upper bounds): gold, level, EXP, stats, item `plus`/`dur`/`qty`, cooldowns, positions. NaN/Infinity can break formulas, loops sized by a level, and rendering.
- Arrays (bag slots, equipment, discovered codex entries, quest flags) have a max length and each element is validated: unknown item id / monster id / class id / platform id is dropped, not passed to `getItem` or `PLATFORMS[id]` lookups that then throw.
- Enum fields (class id, platform id, language, summoner `aurelia`/`kenneth`, weather, rarity, slot) are checked against the tables they index.
- Spreading untrusted objects cannot pollute prototypes: reject or strip `__proto__`, `constructor`, `prototype` keys; prefer copying only known keys.
- Player position from a save lands inside the current stage bounds and not inside a solid hitbox.
- `loadGame` validates exactly like `importSaveFile`, ideally both through `SaveSecurity.sanitizeAndAudit` or one shared sanitizer.
- A rejected or broken save shows an error and leaves the existing save intact (no half-written `vanguard_savegame`).

Probe by writing malformed saves to the scratchpad and running them through `SaveSecurity` and the restore helpers in Node (stub `window`, `localStorage` and `document`; import the modules with `await import()`): wrong types, negative/NaN/huge numbers, 1e6-element arrays, unknown ids, `{"__proto__": {"polluted": true}}`, missing fields. A good fix comes with a `scripts/test-save-import.mjs` that keeps these cases passing.

### 2. Untrusted strings in the DOM and canvas

- Grep `js/` for `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`, `new Function`, string `setTimeout(`, and `src=` / `href=` / `style` built from state. Most current `innerHTML` uses are static templates or `t()` strings (i18n values contain `<span>`/`<kbd>` on purpose); the risk is any template that interpolates the hero name, an NPC name from a save, an item id or other save data. Those must use `textContent` or an escape helper. Any hit fed by save data is high severity.
- The hero name from the Character Creator: length limit and character set enforced on input **and** on load; rendered as text.
- `js/lore.js` / `js/actreader.js` / `js/title.js` Chronicles: confirm LORE markdown is rendered as text (or through a renderer that cannot emit raw HTML).
- `js/chatlog.js` and `js/dialog.js`: dialogue templates substitute `{s}` / `{h}`; the substituted names must not be treated as markup.

### 3. Page config

Files: `index.html`, `.claude/launch.json`.
- `index.html` has no Content-Security-Policy. Recommend a CSP meta tag that fits the game (`default-src 'self'`; `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`; `font-src https://fonts.gstatic.com`; `img-src 'self' data: blob:` for the item icon data URLs). Verify in the browser that the title screen, creator, game and save import still work and the console is clean before recommending a final policy.
- Google Fonts is the only third-party request. Note it (privacy, offline play); self-hosting the two fonts removes it.
- No secrets, tokens or private notes anywhere in `js/`, `assets/`, `data/` or git history (`git log -p -S <string>`). The SaveSecurity salt is intentionally public; don't flag it as a leaked secret.

### 4. Dev server

- `.claude/launch.json` runs `npx -y http-server -p 5173 -c-1`. `npx -y` fetches the latest `http-server` unpinned on every run; recommend pinning a version (`http-server@14`). It binds all interfaces by default; on shared Wi-Fi the game files are reachable from the LAN. `-a 127.0.0.1` keeps it local.

### 5. Robustness checks that double as security

- The day/night clock, quest step and platform travel must not soft-lock on an out-of-range value from a save (`syncPlatformFlags`, `travelTo`, `restoreSealStone`).
- Any loop whose bound comes from state (level, bag size, number of mercenaries or summons) has a hard cap.
- `fetch("data/npc_conversations.json")` failing (offline, file:// protocol) must fall back quietly.

## Validation

After any fix:
- `node .claude/skills/codemap/codemap.mjs verify` passes.
- Run the game in the browser (`npx http-server -p 5173 -c-1`, or the `run` skill): new game, save, export, import the exported save, import a malformed save (should show the error, not crash), reload the page (localStorage load). Console must be clean.

## Report format

A table ranked by severity: `severity | file:line | trigger | impact | fix`. Then a short list of what was checked and found fine, so the next audit can skip it.
