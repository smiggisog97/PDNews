// Checks every brief in /content against the schema in README.md.
// Run before committing a new brief: `npm run validate`. The build runs it too,
// so a malformed file fails the deploy instead of shipping a broken page.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SECTION_BY_NAME } from './sections.mjs';

const DIR = new URL('../content/', import.meta.url).pathname;
const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isUrl = (v) => typeof v === 'string' && /^https?:\/\/\S+$/.test(v);
const ISSUE_KEYS = new Set(['date', 'title', 'doc_url', 'highlights', 'section_notes', 'entries', 'dont_miss', 'footnote']);
const ENTRY_KEYS = new Set(['id', 'section', 'headline', 'kicker', 'summary', 'why_it_matters', 'why_label', 'takeaway', 'audience', 'steps', 'links', 'image_url', 'tool_rating', 'date', 'lead']);

const files = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
if (files.length === 0) fail('content', 'no briefs found');

for (const file of files) {
  const at = `content/${file}`;
  const m = file.match(/^(\d{4}-\d{2}-\d{2})\.json$/);
  if (!m) { fail(at, 'file name must be YYYY-MM-DD.json'); continue; }

  let issue;
  try { issue = JSON.parse(readFileSync(join(DIR, file), 'utf8')); }
  catch (e) { fail(at, `not valid JSON (${e.message})`); continue; }

  for (const k of Object.keys(issue)) if (!ISSUE_KEYS.has(k)) fail(at, `unknown top-level key "${k}"`);
  if (issue.date !== m[1]) fail(at, `date "${issue.date}" must match the file name`);
  if (!isStr(issue.title)) fail(at, 'title is required');
  if (issue.doc_url != null && !isUrl(issue.doc_url)) fail(at, 'doc_url must be a URL or null');
  if (issue.footnote != null && !isStr(issue.footnote)) fail(at, 'footnote must be text');
  if (issue.dont_miss != null && !(Array.isArray(issue.dont_miss) && issue.dont_miss.every(isStr))) fail(at, 'dont_miss must be a list of text');
  if (issue.section_notes != null) {
    for (const [k, v] of Object.entries(issue.section_notes)) {
      if (!SECTION_BY_NAME[k]) fail(at, `section_notes: unknown section "${k}"`);
      if (!isStr(v)) fail(at, `section_notes["${k}"] must be text`);
    }
  }

  if (!Array.isArray(issue.entries) || issue.entries.length === 0) { fail(at, 'entries must be a non-empty list'); continue; }
  const ids = new Set();
  let leads = 0;
  issue.entries.forEach((e, i) => {
    const w = `${at} entries[${i}]${e && e.id ? ` (${e.id})` : ''}`;
    if (!e || typeof e !== 'object') return fail(w, 'must be an object');
    for (const k of Object.keys(e)) if (!ENTRY_KEYS.has(k)) fail(w, `unknown key "${k}"`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id || '')) fail(w, 'id must be a lowercase-hyphen slug');
    else if (ids.has(e.id)) fail(w, 'id is used twice in this issue');
    ids.add(e.id);
    if (!SECTION_BY_NAME[e.section]) fail(w, `section "${e.section}" is not one of: ${Object.keys(SECTION_BY_NAME).join(', ')}`);
    if (!isStr(e.headline)) fail(w, 'headline is required');
    if (!isStr(e.summary)) fail(w, 'summary is required');
    if (e.why_it_matters !== null && !isStr(e.why_it_matters)) fail(w, 'why_it_matters must be text or null');
    if (e.why_label != null && !isStr(e.why_label)) fail(w, 'why_label must be text');
    if (e.kicker != null && !isStr(e.kicker)) fail(w, 'kicker must be text');
    if (e.audience != null && !isStr(e.audience)) fail(w, 'audience must be text');
    if (e.takeaway != null && !(isStr(e.takeaway.label) && isStr(e.takeaway.text))) fail(w, 'takeaway needs label and text');
    if (e.steps != null && !(Array.isArray(e.steps) && e.steps.every((s) => isStr(s.label) && isStr(s.text)))) fail(w, 'steps must be a list of { label, text }');
    if (!Array.isArray(e.links) || !e.links.every((l) => l && isStr(l.label) && isUrl(l.url))) fail(w, 'links must be a list of { label, url }');
    if (e.image_url !== null && !isUrl(e.image_url)) fail(w, 'image_url must be a URL or null');
    if (e.tool_rating !== null && !(Number.isInteger(e.tool_rating) && e.tool_rating >= 1 && e.tool_rating <= 10)) fail(w, 'tool_rating must be a whole number 1 to 10, or null');
    if (e.section === 'New AI Tools' && e.tool_rating === null) fail(w, 'New AI Tools entries need a tool_rating');
    if (e.date !== issue.date) fail(w, `date "${e.date}" must equal the issue date`);
    if (e.lead != null && typeof e.lead !== 'boolean') fail(w, 'lead must be true or false');
    if (e.lead) leads++;
  });
  if (leads > 1) fail(at, 'only one entry can be the lead');

  if (issue.highlights != null) {
    if (!Array.isArray(issue.highlights)) fail(at, 'highlights must be a list');
    else issue.highlights.forEach((h, i) => {
      if (!isStr(h.headline) || !isStr(h.summary)) fail(`${at} highlights[${i}]`, 'needs headline and summary');
      if (h.ref != null && !ids.has(h.ref)) fail(`${at} highlights[${i}]`, `ref "${h.ref}" is not an entry id`);
    });
  }
}

if (errors.length) {
  console.error(`Content check failed (${errors.length}):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log(`Content OK: ${files.length} brief${files.length === 1 ? '' : 's'}.`);
