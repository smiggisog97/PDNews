// Fills `image_url` for entries that have none, from the og:image (or
// twitter:image) of their links, in order. Entries with no usable preview stay
// null and the site shows the section cover instead.
//
// Usage:
//   node scripts/fill-images.mjs                 every brief
//   node scripts/fill-images.mjs content/2026-11-22.json
//   node scripts/fill-images.mjs --force ...     re-check entries that already have one
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const force = args.includes('--force');
const DIR = new URL('../content/', import.meta.url).pathname;
const files = args.filter((a) => !a.startsWith('--'));
const targets = files.length ? files : readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => join(DIR, f));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const LINKS_TO_TRY = 3;

async function get(url, ms = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,image/*;q=0.8,*/*;q=0.5' } });
  } finally { clearTimeout(t); }
}

function metaImage(html, base) {
  const head = html.slice(0, 200_000);
  const tags = head.match(/<meta\b[^>]*>/gi) || [];
  const want = ['og:image:secure_url', 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src'];
  const found = {};
  for (const tag of tags) {
    const key = (tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i) || [])[1];
    const val = (tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (key && val && want.includes(key.toLowerCase()) && !found[key.toLowerCase()]) found[key.toLowerCase()] = val;
  }
  for (const k of want) {
    if (!found[k]) continue;
    try {
      const u = new URL(found[k].replace(/&amp;/g, '&'), base);
      if (u.protocol === 'https:' || u.protocol === 'http:') return u.href.replace(/^http:/, 'https:');
    } catch {}
  }
  return null;
}

async function isImage(url) {
  try {
    const r = await get(url, 8000);
    const ok = r.ok && (r.headers.get('content-type') || '').startsWith('image/');
    r.body?.cancel();
    return ok;
  } catch { return false; }
}

// Site-wide fallbacks and logos say nothing about the story; a cover does better.
const GENERIC = /(default|placeholder|fallback|logo|favicon|site-image)[^/]*$/i;

// Only the story's own sources: links[0], then links cited in the summary.
// Links in "For:", takeaways or steps point at other things (an editor the
// reader might use, say) and their previews would mislabel the card.
function candidates(entry) {
  const urls = [];
  if (entry.links[0]) urls.push(entry.links[0].url);
  for (const m of entry.summary.matchAll(/\]\((https?:[^)\s]+)\)/g)) urls.push(m[1]);
  return [...new Set(urls)].slice(0, LINKS_TO_TRY);
}

async function previewFor(entry) {
  for (const url of candidates(entry)) {
    try {
      const r = await get(url);
      const type = r.headers.get('content-type') || '';
      if (!r.ok || !type.includes('html')) { r.body?.cancel(); continue; }
      const img = metaImage(await r.text(), r.url);
      if (img && !GENERIC.test(new URL(img).pathname) && (await isImage(img))) return img;
    } catch {}
  }
  return null;
}

for (const file of targets) {
  const issue = JSON.parse(readFileSync(file, 'utf8'));
  const todo = issue.entries.filter((e) => force || !e.image_url);
  let found = 0;
  await Promise.all(todo.map(async (e) => {
    const img = await previewFor(e);
    if (img) { e.image_url = img; found++; }
    else if (force) e.image_url = null;
  }));
  writeFileSync(file, JSON.stringify(issue, null, 2) + '\n');
  console.log(`${file}: ${found}/${todo.length} previews found, the rest use section covers.`);
}
