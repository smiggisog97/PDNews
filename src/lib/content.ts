import { SECTIONS, SECTION_BY_NAME } from '../../scripts/sections.mjs';

export type Link = { label: string; url: string };
export type Entry = {
  id: string;
  section: string;
  headline: string;
  kicker?: string;
  summary: string;
  why_it_matters: string | null;
  why_label?: string;
  takeaway?: { label: string; text: string };
  audience?: string;
  steps?: { label: string; text: string }[];
  links: Link[];
  image_url: string | null;
  tool_rating: number | null;
  date: string;
  lead?: boolean;
};
export type Highlight = { headline: string; summary: string; ref?: string };
export type Issue = {
  date: string;
  title: string;
  doc_url?: string | null;
  highlights?: Highlight[];
  section_notes?: Record<string, string>;
  entries: Entry[];
  dont_miss?: string[];
  footnote?: string;
};
export type Section = { name: string; title: string; slug: string; short: string };

const files = import.meta.glob<Issue>('../../content/*.json', { eager: true, import: 'default' });

/** Every issue, newest first. */
export const issues: Issue[] = Object.values(files).sort((a, b) => b.date.localeCompare(a.date));

/** Issue numbers count up from the first brief. */
const numbers = new Map([...issues].reverse().map((i, n) => [i.date, n + 1]));
export const issueNo = (date: string) => String(numbers.get(date) ?? 0).padStart(3, '0');

export const sections: Section[] = SECTIONS;
export const sectionOf = (name: string): Section => SECTION_BY_NAME[name] ?? { name, title: name, slug: 'industry', short: name };
export const sectionIndex = (name: string) => SECTIONS.findIndex((s) => s.name === name);

/** Display number for a section inside an issue. 01 is "In brief". */
export const sectionNo = (name: string) => String(sectionIndex(name) + 2).padStart(2, '0');

export const leadOf = (issue: Issue): Entry => issue.entries.find((e) => e.lead) ?? issue.entries[0];

/** Entries of an issue grouped in print order, empty sections dropped. */
export function grouped(issue: Issue) {
  return SECTIONS.map((s) => ({ section: s, entries: issue.entries.filter((e) => e.section === s.name) })).filter(
    (g) => g.entries.length > 0,
  );
}

export const entryHref = (e: Entry) => `/issue/${e.date}/#${e.id}`;
export const issueHref = (date: string) => `/issue/${date}/`;
export const primaryUrl = (e: Entry) => e.links[0]?.url ?? null;

/** Every entry across every issue, newest issue first, print order within. */
export const allEntries: Entry[] = issues.flatMap((i) => grouped(i).flatMap((g) => g.entries));

/** Rated tools, one per link (the most recent mention wins), best first. */
export function ratedTools(): Entry[] {
  const seen = new Set<string>();
  const out: Entry[] = [];
  for (const e of allEntries) {
    if (e.tool_rating == null) continue;
    const key = primaryUrl(e) ?? e.headline.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out.sort((a, b) => b.tool_rating! - a.tool_rating! || b.date.localeCompare(a.date));
}

/** Open-source projects, one per link (the most recent mention wins), newest first. */
export function openSource(): Entry[] {
  const seen = new Set<string>();
  return allEntries.filter((e) => {
    if (e.section !== 'GitHub & Open Source') return false;
    const key = primaryUrl(e) ?? e.headline.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const at = (date: string) => new Date(`${date}T00:00:00Z`);
export const fmtLong = (date: string) =>
  at(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const fmtDay = (date: string) =>
  at(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const fmtShort = (date: string) =>
  at(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Sentence-start capital for brief fragments like "this is the clearest...". */
export const cap = (s: string) => s.replace(/^([a-z])/, (c) => c.toUpperCase());

export const fmtWeekday = (date: string) => at(date).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
