# Pathao Design News

The daily AI + Product Design morning brief as a website for the Pathao design
team. Static Astro site, deployed on Vercel. Every push to `main` redeploys.

- **Home** (`/`): the latest issue as a front page, earlier issues, sections.
- **Issue** (`/issue/YYYY-MM-DD/`): one day's brief, every story anchored by id.
- **Archive** (`/archive/`): every story, with section and date filters and search.
  Filters live in the URL, e.g. `/archive/?section=tools&q=figma`.
- **Tools** (`/tools/`): every rated tool, best first.

## Run it

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # validates content, checks for em dashes, builds to dist/
```

## Adding a brief

One brief is one file: `content/YYYY-MM-DD.json`. The scheduled morning task
writes it; a person can too.

1. Write `content/YYYY-MM-DD.json` following the schema below.
2. `node scripts/fill-images.mjs content/YYYY-MM-DD.json` fills `image_url`
   from each story's own source (its og:image). Stories with no usable preview
   keep `null` and show their section cover, so no card is ever empty.
3. `npm run validate` and `node scripts/check-dashes.mjs content` must both pass.
4. Commit `content/YYYY-MM-DD.json` alone and push to `main`.

The build runs the same checks, so a malformed brief fails the deploy and the
previous version stays live.

## Content schema

```jsonc
{
  "date": "2026-11-21",                       // must match the file name
  "title": "AI + Product Design Morning Brief",
  "doc_url": "https://docs.google.com/...",   // the matching Google Doc, or null
  "highlights": [                             // "01 / Executive Summary", 5 items
    { "headline": "...", "summary": "...", "ref": "entry-id" }   // ref is optional
  ],
  "section_notes": { "New AI Tools": "..." }, // optional italic note under a section
  "entries": [ /* see below */ ],
  "dont_miss": ["...", "...", "..."],         // "Don't Miss These Today"
  "footnote": "Sourced from ..."              // the closing sourcing note
}
```

Each entry:

| Field | Type | Notes |
|---|---|---|
| `id` | string | lowercase-hyphen slug, unique within the issue; the anchor in the URL |
| `section` | string | exactly one of the sections below |
| `headline` | string | the story headline, or the tool, repo or resource name |
| `kicker` | string, optional | small label: a release date ("Nov 18"), a source ("Hacker News"), a kind ("Video"), a duration ("25 minutes") |
| `summary` | string | what happened, or what the thing is |
| `why_it_matters` | string or null | the brief's "Why it matters" |
| `why_label` | string, optional | relabels the line above: "Practical value", "Why it works", "Why now" |
| `takeaway` | `{ label, text }`, optional | e.g. `{ "label": "For builders", "text": "..." }` or `{ "label": "Learn", ... }` |
| `audience` | string, optional | the tools section's "For:" line |
| `steps` | `[{ label, text }]`, optional | Today's Experiment steps, e.g. `{ "label": "Step 1 (8 min)", ... }` |
| `links` | `[{ label, url }]` | every link in the entry; **the first is the story's own source** |
| `image_url` | string or null | article preview image; leave `null` and run `fill-images` |
| `tool_rating` | integer 1 to 10, or null | required for New AI Tools, null elsewhere |
| `date` | string | the issue date |
| `lead` | true, optional | the lead story (at most one); defaults to the first entry |

Text fields may use `[label](https://url)` links and `**bold**`, nothing else.

Sections, in print order (the number shown in an issue is in brackets):

`AI Industry News` (02), `Product Design & UX` (03), `New AI Tools` (04),
`Trends to Watch` (05), `Product Design Inspiration` (06),
`GitHub & Open Source` (07), `Social Buzz` (08), `Learning Corner` (09),
`Opportunities` (10), `Today's Experiment` (11).

Mapping from the brief: "What happened" goes in `summary`; "Why it matters" in
`why_it_matters`; "For builders" or "For designers" in `takeaway`; "Practical
value", "Why it works" and "Why now" in `why_it_matters` with `why_label`;
"Learn" in `takeaway`. See `content/2026-11-21.json` for a complete example.

## Design

The site is set in **Editorial Taste** (github.com/iamshakibali/editorial-taste,
MIT): monochrome, editorial, photography-led. Geist for words, Geist Mono for
buttons, labels and eyebrows, a 5px spacing rhythm, hairlines and glass
instead of shadows, and motion on one expo-out curve (Lenis smooth scroll,
masked headline reveals, image unmasks, the word-by-word statement).

- `src/styles/tokens.css` holds the system's tokens unchanged, plus this
  site's dark theme, which inverts the same ramps.
- `src/scripts/motion.ts` is a TypeScript port of the system's `motion.js`.
- No accent colours. Colour lives in the article photographs, the Pathao mark,
  and one signal dot in the experiment drawing.

**No em dashes, anywhere.** `scripts/check-dashes.mjs` runs before and after
every build and fails it on a single one. Use a comma, a colon, or two sentences.

### Pictures and drawings

Every story shows its article's own preview image (`image_url`). When there is
none, or it fails to load, the card shows its section's **isometric hairline
drawing** instead, so no frame is ever empty. `src/lib/iso.ts` draws them at
build time (a port of the system's `iso.py`); one composition per section, in
`SECTION_ISO`. Today's Experiment gets a full drawing whose numbered blocks
match its steps.
