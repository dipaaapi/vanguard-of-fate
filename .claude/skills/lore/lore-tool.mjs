#!/usr/bin/env node
/**
 * lore-tool — find and check Vanguard of Fate's story text without reading whole files.
 * Ported from IsoChronicle's lore tool; EN/FIL instead of EN/TL.
 *
 *   node .claude/skills/lore/lore-tool.mjs sources                 # where narrative text lives (+ sizes)
 *   node .claude/skills/lore/lore-tool.mjs sections                # LORE.md / LORE_FIL.md headings side by side
 *   node .claude/skills/lore/lore-tool.mjs section <n|heading>     # one LORE Act, EN + FIL
 *   node .claude/skills/lore/lore-tool.mjs find <term> [--max 40]  # text strings mentioning <term>, file:line
 *   node .claude/skills/lore/lore-tool.mjs entity <name>           # one entity's text fields only (monsters, items, platforms…)
 *   node .claude/skills/lore/lore-tool.mjs check                   # EN/FIL gaps and Act mismatches
 *
 * Plain Node, no dependencies.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const read = (p) => fs.readFileSync(p, 'utf8');

const LORE_EN = path.join(ROOT, 'LORE.md');
const LORE_FIL = path.join(ROOT, 'LORE_FIL.md');
const walk = (dir, re) => {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name), re) : re.test(e.name) ? [path.join(abs, e.name)] : []);
};
// Files that carry player-facing text: the LORE pair, data/*.json, and every module with Filipino text
const SOURCES = [
  LORE_EN,
  LORE_FIL,
  ...walk('data', /\.json$/),
  ...walk('js', /\.js$/).filter((f) => /\bfil\s*:/.test(read(f))),
].filter((f) => fs.existsSync(f));

/** Keys whose values are prose (names, descriptions, dialogue, translations). */
const TEXT_KEY = /["']?\b(name|title|subtitle|desc|description|text|lore|flavor|bio|story|label|hint|line|lines|quote|tagline|objective|en|fil|n)["']?\s*:\s*(?:["'`{[]|N\()/;
const isMarkdown = (f) => f.endsWith('.md');
const clip = (s, n = 220) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const inString = (line, t) => {
  for (const m of line.matchAll(/(["'`])((?:\\.|(?!\1).)*)\1/g)) if (m[2].toLowerCase().includes(t)) return true;
  return false;
};

// ── LORE sections ────────────────────────────────────────────────────────────

function sections(file) {
  const lines = read(file).split('\n');
  const out = [];
  lines.forEach((l, i) => {
    if (l.startsWith('## ')) out.push({ title: l.slice(3).trim(), start: i + 1 });
  });
  out.forEach((s, i) => (s.end = i + 1 < out.length ? out[i + 1].start - 1 : lines.length));
  return { lines, list: out };
}

function printSection(file, s, lines) {
  console.log(`── ${rel(file)}:${s.start}-${s.end}`);
  console.log(lines.slice(s.start - 1, s.end).join('\n').replace(/\n-{3,}\s*$/, '').trim());
}

// ── Commands ─────────────────────────────────────────────────────────────────

function cmdSources() {
  for (const f of SOURCES) {
    const text = read(f);
    const hits = isMarkdown(f) ? text.split('\n').filter((l) => l.trim()).length
      : text.split('\n').filter((l) => TEXT_KEY.test(l)).length;
    console.log(`${rel(f).padEnd(34)} ${String(Math.round(text.length / 1024)).padStart(3)} KB  ${hits} text lines`);
  }
}

function cmdSections() {
  const en = sections(LORE_EN).list, fil = sections(LORE_FIL).list;
  const n = Math.max(en.length, fil.length);
  const short = (s) => clip(s.title, 52);
  for (let i = 0; i < n; i++) {
    console.log(`${String(i + 1).padStart(2)}. ${(en[i] ? `${short(en[i])} (${en[i].start}-${en[i].end})` : '—').padEnd(64)} │ ${fil[i] ? `${short(fil[i])} (${fil[i].start}-${fil[i].end})` : '—'}`);
  }
}

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv'];

function cmdSection(q) {
  const en = sections(LORE_EN), fil = sections(LORE_FIL);
  const ql = q.toLowerCase();
  let idx = /^\d+$/.test(q) ? parseInt(q, 10) - 1 : -1;
  if (idx < 0 && ROMAN.includes(ql)) idx = en.list.findIndex((s) => new RegExp(`\\bact ${ql}\\b`, 'i').test(s.title));
  if (idx < 0) idx = en.list.findIndex((s) => s.title.toLowerCase().includes(ql));
  if (idx < 0) idx = fil.list.findIndex((s) => s.title.toLowerCase().includes(ql));
  if (idx < 0 || !en.list[idx]) fail(`No section "${q}". Run "sections".`);
  printSection(LORE_EN, en.list[idx], en.lines);
  if (fil.list[idx]) printSection(LORE_FIL, fil.list[idx], fil.lines);
}

function cmdFind(term, max) {
  const t = term.toLowerCase();
  let shown = 0, total = 0;
  for (const f of SOURCES) {
    read(f).split('\n').forEach((l, i) => {
      if (!l.toLowerCase().includes(t)) return;
      if (!isMarkdown(f) && !inString(l, t)) return;
      total++;
      if (shown < max) { console.log(`${rel(f)}:${i + 1}  ${clip(l.trim())}`); shown++; }
    });
  }
  if (total > shown) console.log(`… ${total - shown} more (raise --max or narrow the term)`);
  if (!total) console.log('no text matches');
}

/**
 * Every object block (JS or JSON) that mentions <term> in a text field, printed
 * with only its text fields: one entity's EN + FIL name, description, lines.
 */
function cmdEntity(term, max) {
  const t = term.toLowerCase();
  const indent = (l) => l.match(/^\s*/)[0].length;
  const strip = (x) => x.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '').replace(/\/\/.*$/, '');
  const seen = new Set();
  let shown = 0;
  for (const f of SOURCES.filter((x) => !isMarkdown(x))) {
    const lines = read(f).split('\n');
    for (let i = 0; i < lines.length && shown < max; i++) {
      const l = lines[i];
      if (!inString(l, t) && !new RegExp(`^\\s*["']?${t.replace(/\W/g, '')}["']?\\s*:\\s*\\{`, 'i').test(l)) continue;
      // Walk up by brace depth to the enclosing block, then on to its entry at the top of the table (indent ≤ 4)
      let start = i, depth = 0;
      const oneLine = indent(l) <= 4 && /^\s*["']?[\w$]+["']?\s*:\s*\{.*\}\s*,?\s*$/.test(l);
      if (!oneLine && (!/\{\s*$/.test(strip(l)) || indent(l) > 4)) {
        for (let j = i; j >= 0; j--) {
          const code = strip(lines[j]);
          for (let c = code.length - 1; c >= 0; c--) {
            if (code[c] === '}' || code[c] === ']') depth++;
            else if (code[c] === '{' || code[c] === '[') depth--;
          }
          if (depth < 0) { start = j; depth = 0; if (indent(lines[j]) <= 4) break; }
        }
      }
      const key = `${f}:${start}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const base = indent(lines[start]);
      let end = start + 1;
      if (/\}\s*,?\s*$/.test(strip(lines[start])) && !/\{\s*$/.test(strip(lines[start]))) end = start; // one-line entry
      else while (end < lines.length && !(indent(lines[end]) <= base && /^\s*[}\]]/.test(lines[end]))) end++;
      console.log(`── ${rel(f)}:${start + 1}-${end + 1}  ${clip(lines[start].trim(), 260)}`);
      for (let k = start + 1; k < end; k++) if (TEXT_KEY.test(lines[k])) console.log(`${String(k + 1).padStart(5)}  ${clip(lines[k].trim(), 260)}`);
      shown++;
      i = Math.max(i, end);
    }
  }
  if (!shown) console.log('no entity found; try "find"');
}

function cmdCheck() {
  let issues = 0;
  const warn = (m) => { issues++; console.log(m); };

  // 1. LORE.md vs LORE_FIL.md structure
  const en = sections(LORE_EN), fil = sections(LORE_FIL);
  if (en.list.length !== fil.list.length) warn(`LORE: ${en.list.length} EN sections vs ${fil.list.length} FIL sections`);
  en.list.forEach((s, i) => {
    const o = fil.list[i];
    if (!o) return;
    const count = (sec, lines, re) => lines.slice(sec.start - 1, sec.end).filter((l) => re.test(l)).length;
    const bE = count(s, en.lines, /^\s*[-*] /), bF = count(o, fil.lines, /^\s*[-*] /);
    const pE = count(s, en.lines, /^[^-*#\s]/), pF = count(o, fil.lines, /^[^-*#\s]/);
    if (bE !== bF || pE !== pF) warn(`LORE §${i + 1} "${clip(s.title, 50)}": EN ${pE}¶/${bE} bullets vs FIL ${pF}¶/${bF} bullets`);
  });

  // 2. JSON {en, fil} pairs with a missing or empty side
  for (const f of SOURCES.filter((x) => x.endsWith('.json'))) {
    let data;
    try { data = JSON.parse(read(f)); } catch { warn(`${rel(f)}: invalid JSON`); continue; }
    const visit = (node, p) => {
      if (!node || typeof node !== 'object') return;
      const keys = Object.keys(node);
      if ((keys.includes('en') || keys.includes('fil')) && (!node.en || !node.fil)) warn(`${rel(f)}: ${p || '(root)'} missing ${!node.en ? 'en' : 'fil'}`);
      for (const k of keys) visit(node[k], p ? `${p}.${k}` : k);
    };
    visit(data, '');
  }

  // 3. JS: inline { en: "…", fil: "…" } pairs missing a side
  for (const f of SOURCES.filter((x) => x.endsWith('.js'))) {
    const lines = read(f).split('\n');
    lines.forEach((l, i) => {
      if (/\ben\s*:\s*["'`]/.test(l) && !/\bfil\s*:/.test(lines.slice(i, i + 3).join('\n'))) warn(`${rel(f)}:${i + 1} en without fil`);
      if (/\bfil\s*:\s*["'`]/.test(l) && !/\ben\s*:/.test(lines.slice(Math.max(0, i - 2), i + 1).join('\n'))) warn(`${rel(f)}:${i + 1} fil without en`);
    });

    // 4. JS: `en: {` / `fil: {` string tables (i18n.js, dialogue.js) with keys missing on one side
    const blockKeys = (start) => {
      const base = lines[start].match(/^\s*/)[0].length;
      const keys = new Set();
      for (let k = start + 1; k < lines.length; k++) {
        const ind = lines[k].match(/^\s*/)[0].length;
        if (lines[k].trim() && ind <= base) break;
        const m = ind === base + 2 && lines[k].match(/^\s*["']?([\w$]+)["']?\s*:/);
        if (m) keys.add(m[1]);
      }
      return keys;
    };
    lines.forEach((l, i) => {
      const m = l.match(/^(\s*)en\s*:\s*\{\s*$/);
      if (!m) return;
      const j = lines.findIndex((x, k) => k > i && new RegExp(`^${m[1]}fil\\s*:\\s*\\{\\s*$`).test(x));
      if (j < 0) { warn(`${rel(f)}:${i + 1} en table without a fil table`); return; }
      const a = blockKeys(i), b = blockKeys(j);
      for (const k of a) if (!b.has(k)) warn(`${rel(f)}:${j + 1} fil table missing "${k}"`);
      for (const k of b) if (!a.has(k)) warn(`${rel(f)}:${i + 1} en table missing "${k}"`);
    });
  }

  console.log(issues ? `${issues} issue(s)` : 'EN/FIL text looks consistent');
  if (issues) process.exitCode = 1;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function fail(msg) { console.error(msg); process.exit(1); }

const [cmd, ...args] = process.argv.slice(2);
const maxIdx = args.indexOf('--max');
const max = maxIdx >= 0 ? parseInt(args[maxIdx + 1], 10) || 40 : 40;
const term = args.filter((_, i) => maxIdx < 0 || (i !== maxIdx && i !== maxIdx + 1)).join(' ');

if (cmd === 'sources') cmdSources();
else if (cmd === 'sections') cmdSections();
else if (cmd === 'section') { if (!term) fail('usage: section <n|act roman|heading>'); cmdSection(term); }
else if (cmd === 'find') { if (!term) fail('usage: find <term> [--max 40]'); cmdFind(term, max); }
else if (cmd === 'entity') { if (!term) fail('usage: entity <name> [--max 40]'); cmdEntity(term, max); }
else if (cmd === 'check') cmdCheck();
else fail('commands: sources | sections | section <n|heading> | find <term> [--max 40] | entity <name> | check');
