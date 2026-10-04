---
name: codemap
description: Find where things live in Vanguard of Fate and read only the code you need, instead of analysing the whole project. Use at the start of every session and before any code change, bug hunt or question about how the game works. Also use after adding, removing or renaming source files, to keep the map current, and before committing to catch broken imports.
---

# Codemap (token-lean project navigation)

`js/` is about 850 KB (roughly 210k tokens) across ~76 ES modules; `main.js` alone is 69 KB and `avatar.js`, `enemy.js`, `prologue.js`, `itemdb.js` are 30–50 KB each. Reading "the whole project" costs more than most tasks need. Use this instead:

```
C=.claude/skills/codemap/codemap.mjs
cat .claude/skills/codemap/CODEMAP.md     # ~13 KB: every file, its size, one-line purpose and exports
node $C outline <file>                     # declarations, class / exported-object methods, section banners + line ranges
node $C where <symbol>                     # where it is declared and which files import it
node $C changed [ref]                      # files changed since ref (default HEAD~1), each with its purpose
node $C verify                             # node --check every module + every relative import resolves to a real export
node $C check                              # files missing from purposes.json / stale entries
node $C build                              # regenerate CODEMAP.md
```

`<file>` can be a path or just a base name (`main`, `enemy`, `platforms`).

## How to work

1. **Session start:** read `CLAUDE.md` (already loaded) and `CODEMAP.md`. If you've worked here before, run `git log --oneline -15` and `node $C changed <last-known-commit>` instead of re-reading code. That is enough to explain the project and propose next steps.
2. **Find the code:** pick the files from CODEMAP. If unsure, use `where <symbol>` or a Grep with a narrow `glob`, never a read of every candidate.
3. **Read narrowly:** run `outline <file>`, then `Read` with `offset`/`limit` on just the range you need. Read a whole file only when it is small (under ~300 lines) or you are changing most of it. `main.js` is never small: outline it and read only the function you need (`updateGame`, `renderGameWorld`, `loadGame`, `handlePortal`, …).
4. **Follow dependencies on demand:** when the code calls something unfamiliar, run `where` on it and read that one declaration. Don't read the whole file it lives in.
5. **Data before code:** for balance or text questions, the tables usually hold the answer: `js/bestiary.js` (monsters/bosses), `js/world/platforms.js` (Acts VII–XII), `js/items/itemdb.js` (items, sets, cards), `js/skills.js` (stats, skill trees), `js/monsterTiers.js`, `js/elements.js`, `js/status.js`. Use `/lore` for story text.
6. **Validate cheaply:** there is no bundler, so a wrong import name only shows up as a blank page. Run `node $C verify` after every code change; it takes about a second and replaces opening the browser to catch syntax and import errors.
7. **Keep the map current:** after adding, removing or renaming files, or changing what a file is for, edit `purposes.json` (one line per file: what it does, not how), then run `check` and `build`. Commit `CODEMAP.md` with the change.

## When a full read is justified

- A refactor that moves logic across many files, or a review the user asked to be thorough. Even then, go directory by directory using CODEMAP, not file by file blindly.
- The user explicitly asks you to read everything.
