// House rule from the Pathao design system: no em dashes, anywhere.
// Usage: node scripts/check-dashes.mjs <dir|file> [...]
// Exits 1 and lists every hit. The patterns are built from char codes so this
// file never trips its own check.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const EM = String.fromCharCode(0x2014);
const PATTERNS = [EM, '&' + 'mdash;', '&#' + '8212;', '&#x' + '2014;', '\\' + 'u2014'];
const TEXT = new Set(['.json', '.astro', '.ts', '.js', '.mjs', '.css', '.md', '.html', '.svg', '.xml', '.txt']);
const SKIP = new Set(['node_modules', '.git', '.astro', '.vercel']);

const hits = [];
function walk(p) {
  const s = statSync(p);
  if (s.isDirectory()) {
    for (const name of readdirSync(p)) if (!SKIP.has(name)) walk(join(p, name));
    return;
  }
  if (!TEXT.has(extname(p))) return;
  const lines = readFileSync(p, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (PATTERNS.some((pat) => line.includes(pat))) hits.push(`${p}:${i + 1}`);
  });
}

const targets = process.argv.slice(2);
for (const t of targets.length ? targets : ['.']) {
  try { walk(t); } catch (e) { if (e.code !== 'ENOENT') throw e; }
}

if (hits.length) {
  console.error(`Em dash found (${hits.length}). Use a comma, a colon, or two sentences:\n  ` + hits.join('\n  '));
  process.exit(1);
}
console.log(`No em dashes in ${targets.join(', ') || '.'}.`);
