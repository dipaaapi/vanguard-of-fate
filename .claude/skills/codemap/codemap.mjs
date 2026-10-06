#!/usr/bin/env node
/**
 * codemap — navigate Vanguard of Fate's source without reading whole files.
 * Ported from IsoChronicle's codemap and adapted to plain ES modules (no build step).
 *
 *   node .claude/skills/codemap/codemap.mjs build              # regenerate CODEMAP.md (run after adding/removing files)
 *   node .claude/skills/codemap/codemap.mjs check              # files missing from purposes.json / stale entries
 *   node .claude/skills/codemap/codemap.mjs outline <file>     # top-level declarations + class/object members with line ranges
 *   node .claude/skills/codemap/codemap.mjs where <symbol>     # where it is defined and which files import it
 *   node .claude/skills/codemap/codemap.mjs changed [ref]      # files changed since ref (default: last commit) with their purpose
 *   node .claude/skills/codemap/codemap.mjs verify             # syntax-check every module + check every relative import/export
 *
 * Purposes are one line each in purposes.json (hand-written, keyed by path).
 * Exports and sizes are read from the source on every run. Plain Node, no dependencies.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const PURPOSES = path.join(HERE, 'purposes.json');
const OUT = path.join(HERE, 'CODEMAP.md');
const SCAN = ['index.html', 'js', 'css', 'data', 'scripts', 'tools'];
const EXT = /\.(js|mjs|cjs|json|css|html)$/;
const CODE = /\.(js|mjs)$/;

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const read = (p) => fs.readFileSync(p, 'utf8');
const loadPurposes = () => (fs.existsSync(PURPOSES) ? JSON.parse(read(PURPOSES)) : {});

function walk(entry) {
  const abs = path.join(ROOT, entry);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return EXT.test(entry) ? [entry] : [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => walk(path.join(entry, e.name).split(path.sep).join('/')));
}
const allFiles = () => SCAN.flatMap(walk).sort();

// ── Exports & outline ────────────────────────────────────────────────────────

function exportsOf(file) {
  if (!CODE.test(file)) return [];
  const names = [];
  for (const l of read(path.join(ROOT, file)).split('\n')) {
    let m = l.match(/^export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/);
    if (m) { names.push(m[1]); continue; }
    m = l.match(/^export\s+default\s+([A-Za-z_$][\w$]*)/);
    if (m) names.push(`default ${m[1]}`);
    m = l.match(/^export\s*\{([^}]*)\}/);
    if (m) names.push(...m[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop()).filter(Boolean));
  }
  return [...new Set(names)];
}

/** Indent unit of a file: 2 spaces, or 4 when no line is indented by exactly 2 (camera.js and a few others). */
function indentUnit(lines) {
  return lines.filter((l) => /^  \S/.test(l)).length >= 3 ? 2 : 4;
}

/** Declarations at column 0 plus class / exported-object members one indent deep, each with its line range. */
function outline(file) {
  const lines = read(path.join(ROOT, file)).split('\n');
  const ind = ' '.repeat(indentUnit(lines));
  const decl = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/;
  const member = new RegExp(`^${ind}(?:(?:static|async|get|set)\\s+)*\\*?([A-Za-z_$#][\\w$]*)\\s*\\([^)]*\\)\\s*\\{`);
  const prop = new RegExp(`^${ind}([A-Za-z_$][\\w$]*)\\s*:\\s*(?:async\\s*)?(?:function\\b|\\([^)]*\\)\\s*=>|[A-Za-z_$][\\w$]*\\s*=>)`);
  const skip = ['if', 'for', 'while', 'switch', 'return', 'catch', 'function', 'super'];
  const items = [];
  lines.forEach((l, i) => {
    const m = l.match(decl);
    if (m) { items.push({ line: i + 1, depth: 0, kind: m[1], name: m[2] }); return; }
    // Section banners ("// ==== NAME ====", "// ---- NAME ----") at top level or one indent deep
    const banner = l.match(/^(\s*)(?:\/\/|\/\*)\s*[=─━-]{3,}\s*(.*?[A-Za-z].*?)\s*[=─━-]{3,}/);
    if (banner && banner[1].length <= ind.length) { items.push({ line: i + 1, depth: /^\S/.test(l) ? 0 : 1, kind: 'section', name: banner[2] }); return; }
    const k = l.match(member);
    const name = k && k[1];
    if (name && !skip.includes(name)) { items.push({ line: i + 1, depth: 1, kind: 'method', name }); return; }
    const p = l.match(prop);
    if (p) items.push({ line: i + 1, depth: 1, kind: 'fn', name: p[1] });
  });
  // A range ends right before the next item of the same or lower depth
  items.forEach((it, i) => {
    const next = items.slice(i + 1).find((n) => n.depth <= it.depth);
    let end = (next ? next.line : lines.length + 1) - 1;
    while (end > it.line && !lines[end - 1].trim()) end--;
    it.end = end;
  });
  return { items, total: lines.length };
}

// ── Commands ─────────────────────────────────────────────────────────────────

function cmdBuild() {
  const purposes = loadPurposes();
  const files = allFiles();
  const byDir = new Map();
  for (const f of files) {
    const dir = path.posix.dirname(f);
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir).push(f);
  }
  const out = [
    '# CODEMAP',
    '',
    'Generated by `node .claude/skills/codemap/codemap.mjs build`. Do not edit by hand; edit `purposes.json` and rebuild.',
    'Format: `file` (KB, lines) — purpose · exports. Read this instead of opening files to find where something lives;',
    'then `outline <file>` and read only the line range you need.',
    '',
  ];
  let missing = 0;
  for (const [dir, list] of byDir) {
    out.push(`## ${dir === '.' ? '(root)' : `${dir}/`}`, '');
    for (const f of list) {
      const text = read(path.join(ROOT, f));
      const kb = (text.length / 1024).toFixed(text.length < 10240 ? 1 : 0);
      const n = text.split('\n').length;
      const purpose = purposes[f] ?? (missing++, '(no purpose yet)');
      const ex = exportsOf(f);
      const exText = ex.length ? ` · ${ex.slice(0, 8).join(', ')}${ex.length > 8 ? ` +${ex.length - 8}` : ''}` : '';
      out.push(`- \`${path.posix.basename(f)}\` (${kb} KB, ${n}) — ${purpose}${exText}`);
    }
    out.push('');
  }
  fs.writeFileSync(OUT, out.join('\n'));
  console.log(`${rel(OUT)}: ${files.length} files${missing ? `, ${missing} without a purpose (run "check")` : ''}`);
}

function cmdCheck() {
  const purposes = loadPurposes();
  const files = new Set(allFiles());
  const missing = [...files].filter((f) => !purposes[f]);
  const stale = Object.keys(purposes).filter((f) => !files.has(f));
  for (const f of missing) console.log(`missing purpose: ${f}`);
  for (const f of stale) console.log(`stale entry:     ${f}`);
  console.log(missing.length || stale.length ? 'Fix purposes.json, then run "build".' : 'purposes.json covers every file');
  if (missing.length || stale.length) process.exitCode = 1;
}

function resolveFile(arg) {
  if (fs.existsSync(path.join(ROOT, arg)) && fs.statSync(path.join(ROOT, arg)).isFile()) return arg;
  const hits = allFiles().filter((f) => f.endsWith(`/${arg}`) || path.posix.basename(f, path.posix.extname(f)) === arg);
  if (hits.length === 1) return hits[0];
  fail(hits.length ? `Ambiguous: ${hits.join(', ')}` : `No file "${arg}"`);
}

function cmdOutline(arg) {
  const file = resolveFile(arg);
  const { items, total } = outline(file);
  const purpose = loadPurposes()[file];
  console.log(`${file} (${total} lines)${purpose ? ` — ${purpose}` : ''}`);
  for (const it of items) {
    const size = it.end - it.line + 1;
    console.log(`${'  '.repeat(it.depth)}${String(it.line).padStart(5)}-${String(it.end).padEnd(5)} ${it.kind.padEnd(8)} ${it.name}${size > 80 ? `  (${size} lines)` : ''}`);
  }
}

function cmdWhere(symbol) {
  const s = symbol.replace(/[$]/g, '\\$');
  const re = new RegExp(`\\b${s}\\b`);
  const defs = [], importers = [];
  for (const f of allFiles().filter((x) => CODE.test(x))) {
    const lines = read(path.join(ROOT, f)).split('\n');
    lines.forEach((l, i) => {
      if (!re.test(l)) return;
      if (new RegExp(`^(?:export\\s+)?(?:default\\s+)?(?:async\\s+)?(?:function\\*?|class|const|let|var)\\s+${s}\\b`).test(l)
        || new RegExp(`^\\s{2,4}(?:(?:static|async|get|set)\\s+)*${s}\\s*(?:\\([^)]*\\)\\s*\\{|:\\s*(?:function|\\())`).test(l)) defs.push(`${f}:${i + 1}  ${l.trim().slice(0, 140)}`);
    });
    if (new RegExp(`import[^;]*\\b${s}\\b[^;]*from`, 's').test(lines.join('\n'))) importers.push(f);
  }
  console.log(defs.length ? `defined:\n  ${defs.join('\n  ')}` : 'defined: (not found as a declaration)');
  console.log(importers.length ? `imported by (${importers.length}):\n  ${importers.join('\n  ')}` : 'imported by: none');
}

function cmdChanged(ref) {
  const purposes = loadPurposes();
  let out;
  try {
    out = execFileSync('git', ['diff', '--stat=200', ref || 'HEAD~1', '--', ...SCAN, 'LORE.md', 'LORE_FIL.md'], { cwd: ROOT }).toString();
  } catch (e) { fail(`git diff failed: ${e.message}`); }
  for (const l of out.split('\n')) {
    const m = l.match(/^\s*(\S+)\s*\|\s*(.*)$/);
    if (m) console.log(`${m[1]}  ${m[2]}${purposes[m[1]] ? `\n    ${purposes[m[1]]}` : ''}`);
    else if (l.trim()) console.log(l.trim());
  }
}

/**
 * There is no bundler, so a typo in an import only shows up as a blank page in the browser.
 * This catches it headless: `node --check` on every module, then every relative
 * `import { a, b } from "./x.js"` must resolve to a file that exports a and b.
 */
function cmdVerify() {
  const files = allFiles().filter((x) => CODE.test(x));
  let problems = 0;
  for (const f of files) {
    try { execFileSync(process.execPath, ['--check', path.join(ROOT, f)], { stdio: 'pipe' }); }
    catch (e) { problems++; console.log(`syntax: ${f}\n  ${String(e.stderr).trim().split('\n').slice(0, 5).join('\n  ')}`); }
  }
  const importRe = /import\s+([\s\S]*?)\s+from\s+["'](\.{1,2}\/[^"']+)["']|import\s+["'](\.{1,2}\/[^"']+)["']/g;
  for (const f of files) {
    // Blank out comments (keeping line numbers) so example imports in them are not checked
    const text = read(path.join(ROOT, f))
      .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
      .replace(/^\s*\/\/.*$/gm, '');
    for (const m of text.matchAll(importRe)) {
      const spec = m[2] || m[3];
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(f), spec));
      const line = text.slice(0, m.index).split('\n').length;
      if (!fs.existsSync(path.join(ROOT, target))) { problems++; console.log(`missing module: ${f}:${line} → ${spec}`); continue; }
      if (!m[1]) continue;
      const ex = new Set(exportsOf(target).map((e) => e.replace(/^default /, '')));
      const hasDefault = exportsOf(target).some((e) => e.startsWith('default'));
      const clause = m[1].trim();
      const named = clause.match(/\{([^}]*)\}/);
      if (named) {
        for (const part of named[1].split(',').map((p) => p.trim()).filter(Boolean)) {
          const name = part.split(/\s+as\s+/)[0].trim();
          if (name !== 'default' && !ex.has(name)) { problems++; console.log(`missing export: ${f}:${line} imports "${name}" from ${target}`); }
        }
      }
      const def = clause.replace(/\{[^}]*\}/, '').replace(/\*\s+as\s+\w+/, '').replace(/,/g, '').trim();
      if (def && !hasDefault) { problems++; console.log(`missing default export: ${f}:${line} imports default "${def}" from ${target}`); }
    }
  }
  console.log(problems ? `${problems} problem(s) in ${files.length} modules` : `${files.length} modules: syntax and imports OK`);
  if (problems) process.exitCode = 1;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function fail(msg) { console.error(msg); process.exit(1); }

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'build') cmdBuild();
else if (cmd === 'check') cmdCheck();
else if (cmd === 'outline') { if (!arg) fail('usage: outline <file>'); cmdOutline(arg); }
else if (cmd === 'where') { if (!arg) fail('usage: where <symbol>'); cmdWhere(arg); }
else if (cmd === 'changed') cmdChanged(arg);
else if (cmd === 'verify') cmdVerify();
else fail('commands: build | check | outline <file> | where <symbol> | changed [ref] | verify');
