// Isometric hairline illustrations, after Editorial Taste's iso.py
// (github.com/iamshakibali/editorial-taste, MIT), ported to TypeScript so the
// build draws them. True 30 degree isometric: x runs down-right, y down-left,
// z up. Colours come from CSS (--iso-*), so the drawings follow the theme.

export type Block = {
  x?: number; y?: number; z?: number;
  w?: number; d?: number; h?: number;
  label?: string; leds?: number; active?: boolean; signal?: boolean;
};
export type IsoPath = { points: [number, number, number][]; dashed?: boolean; above?: boolean };
export type Spec = { title: string; unit?: number; aspect?: number; padding?: number; blocks: Block[]; paths?: IsoPath[] };

const C30 = Math.cos(Math.PI / 6);
const S30 = 0.5;
let seq = 0;

const proj = (x: number, y: number, z: number, u: number): [number, number] => [(x - y) * C30 * u, (x + y) * S30 * u - z * u];
const f = (v: number) => {
  const s = v.toFixed(2).replace(/\.?0+$/, '');
  return s === '-0' || s === '' ? '0' : s;
};
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function poly(points: [number, number, number][], u: number, cls: string) {
  const pts = points.map((p) => proj(...p, u)).map(([a, b]) => `${f(a)},${f(b)}`).join(' ');
  return `<polygon class="iso-face ${cls}" points="${pts}"/>`;
}

function blockSvg(b: Block, u: number, i: number, labels: boolean) {
  const { x = 0, y = 0, z = 0, w = 4, d = 4, h = 1 } = b;
  const top = z + h;
  const out = [`<g class="iso-block${b.active ? ' is-active' : ''}" style="--d:${i * 120}ms">`];
  out.push(poly([[x, y + d, top], [x + w, y + d, top], [x + w, y + d, z], [x, y + d, z]], u, 'iso-left'));
  out.push(poly([[x + w, y, top], [x + w, y + d, top], [x + w, y + d, z], [x + w, y, z]], u, 'iso-right'));
  out.push(poly([[x, y, top], [x + w, y, top], [x + w, y + d, top], [x, y + d, top]], u, 'iso-top'));

  // Vertex dots, inset from the top-face corners: the signature detail.
  const k = Math.min(0.3, w / 6, d / 6);
  for (const [cx, cy] of [[x + k, y + k], [x + w - k, y + k], [x + w - k, y + d - k], [x + k, y + d - k]]) {
    const [px, py] = proj(cx, cy, top, u);
    out.push(`<circle class="iso-vertex" cx="${f(px)}" cy="${f(py)}" r="2"/>`);
  }

  // Label and status LEDs lie on the left face.
  const faceH = h * u;
  const leds = b.leds ?? 0;
  if ((labels && b.label && faceH >= 18) || (leds && faceH >= 22)) {
    const [ox, oy] = proj(x, y + d, top, u);
    out.push(`<g transform="matrix(${f(C30)} ${f(S30)} 0 1 ${f(ox)} ${f(oy)})">`);
    const hasLabel = labels && b.label && faceH >= 18;
    const base = Math.min(18, faceH * 0.5 + 4);
    if (hasLabel) out.push(`<text class="iso-label" x="${f(0.35 * u)}" y="${f(base)}">${esc(b.label!.toUpperCase())}</text>`);
    const ledY = hasLabel ? base + 11 : Math.min(faceH * 0.5, 14);
    if (leds && (!hasLabel || faceH >= 34)) {
      for (let n = 0; n < leds; n++) out.push(`<circle class="iso-led" cx="${f(0.35 * u + 3 + n * 9)}" cy="${f(ledY)}" r="2.4"/>`);
    }
    out.push('</g>');
  }

  if (b.signal) {
    const [cx, cy] = proj(x + w / 2, y + d / 2, top, u);
    const r = Math.min(w, d) * 0.18 * Math.SQRT2;
    const rx = f(r * C30 * u);
    const ry = f(r * S30 * u);
    out.push(`<ellipse class="iso-ring" cx="${f(cx)}" cy="${f(cy)}" rx="${rx}" ry="${ry}"/>`);
    out.push(`<ellipse class="iso-pulse" cx="${f(cx)}" cy="${f(cy)}" rx="${rx}" ry="${ry}"/>`);
    out.push(`<ellipse class="iso-signal" cx="${f(cx)}" cy="${f(cy)}" rx="5.6" ry="3.4"/>`);
  }
  out.push('</g>');
  return out.join('');
}

function pathSvg(p: IsoPath, u: number) {
  const pts = p.points.map((pt) => proj(...pt, u)).map(([a, b]) => `${f(a)},${f(b)}`).join(' ');
  return `<polyline class="iso-path${p.dashed === false ? '' : ' is-dashed'}" points="${pts}"/>`;
}

/** Render a spec to an inline SVG. `labels: false` drops face labels (for small covers). */
export function iso(spec: Spec, { labels = true, signal = true }: { labels?: boolean; signal?: boolean } = {}) {
  const u = spec.unit ?? 40;
  const uid = `iso${++seq}`;
  const blocks = spec.blocks.map((b) => ({ ...b, signal: signal && b.signal }));
  const paths = spec.paths ?? [];

  const pts: [number, number][] = [];
  for (const { x = 0, y = 0, z = 0, w = 4, d = 4, h = 1 } of blocks)
    for (const cx of [x, x + w]) for (const cy of [y, y + d]) for (const cz of [z, z + h]) pts.push(proj(cx, cy, cz, u));
  for (const p of paths) for (const pt of p.points) pts.push(proj(...pt, u));
  const pad = spec.padding ?? 1.2 * u;
  let minx = Math.min(...pts.map((p) => p[0])) - pad;
  let miny = Math.min(...pts.map((p) => p[1])) - pad;
  let vw = Math.max(...pts.map((p) => p[0])) + pad - minx;
  let vh = Math.max(...pts.map((p) => p[1])) + pad - miny;
  const aspect = spec.aspect;
  if (aspect && vw / vh < aspect) { const extra = vh * aspect - vw; minx -= extra / 2; vw += extra; }
  else if (aspect && vw / vh > aspect) { const extra = vw / aspect - vh; miny -= extra / 2; vh += extra; }

  // Ground grid over the whole view, faded to the edges.
  const span = Math.floor(Math.max(vw, vh) / (u * S30)) + 4;
  const gx = blocks.reduce((s, b) => s + (b.x ?? 0) + (b.w ?? 4) / 2, 0) / blocks.length;
  const gy = blocks.reduce((s, b) => s + (b.y ?? 0) + (b.d ?? 4) / 2, 0) / blocks.length;
  const lines: string[] = [];
  for (let i = -span; i <= span; i++) {
    let a = proj(Math.floor(gx) + i, gy - span, 0, u);
    let b = proj(Math.floor(gx) + i, gy + span, 0, u);
    lines.push(`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/>`);
    a = proj(gx - span, Math.floor(gy) + i, 0, u);
    b = proj(gx + span, Math.floor(gy) + i, 0, u);
    lines.push(`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/>`);
  }

  const ordered = [...blocks].sort((a, b) => (a.x ?? 0) + (a.y ?? 0) - ((b.x ?? 0) + (b.y ?? 0)) || (a.z ?? 0) - (b.z ?? 0));
  const vb = `${f(minx)} ${f(miny)} ${f(vw)} ${f(vh)}`;
  return [
    `<svg class="iso" xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" role="img" aria-labelledby="${uid}-t">`,
    `<title id="${uid}-t">${esc(spec.title)}</title>`,
    `<defs><radialGradient id="${uid}-fade" cx="50%" cy="50%" r="55%"><stop offset="0" stop-color="#fff"/><stop offset=".65" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
    `<mask id="${uid}-mask"><rect x="${f(minx)}" y="${f(miny)}" width="${f(vw)}" height="${f(vh)}" fill="url(#${uid}-fade)"/></mask></defs>`,
    `<g class="iso-grid" mask="url(#${uid}-mask)">${lines.join('')}</g>`,
    ...paths.filter((p) => !p.above).map((p) => pathSvg(p, u)),
    ...ordered.map((b, i) => blockSvg(b, u, i, labels)),
    ...paths.filter((p) => p.above).map((p) => pathSvg(p, u)),
    '</svg>',
  ].join('');
}

/* ------------------------------------------------------- section drawings ---
 * One composition per section, so a card without a photo still says what
 * kind of story it is. Covers use them without labels or the signal dot; the
 * signal stays for the one full illustration on a page. */
export const SECTION_ISO: Record<string, Spec> = {
  industry: {
    title: 'A grid of nine blocks, the centre one raised',
    aspect: 1.6,
    blocks: [0, 2.5, 5].flatMap((y) => [0, 2.5, 5].map((x) => ({ x, y, w: 2, d: 2, h: x === 2.5 && y === 2.5 ? 1.3 : 0.6, active: x === 2.5 && y === 2.5, signal: x === 2.5 && y === 2.5 }))),
  },
  'design-ux': {
    title: 'Four modules on a grid, one active',
    aspect: 1.6,
    blocks: [
      { x: 0, y: 0, w: 4, d: 4, h: 1.1, active: true, signal: true, label: 'Module #1' },
      { x: 4.6, y: 0, w: 4, d: 4, h: 1.1, leds: 5, label: 'Module #2' },
      { x: 0, y: 4.6, w: 4, d: 4, h: 1.1, leds: 5, label: 'Module #3' },
      { x: 4.6, y: 4.6, w: 4, d: 4, h: 1.1, leds: 5, label: 'Module #4' },
    ],
  },
  tools: {
    title: 'One unit with its status lights',
    aspect: 1.6,
    padding: 70,
    blocks: [{ x: 0, y: 0, w: 5, d: 5, h: 1.6, leds: 6, active: true, signal: true, label: 'Unit 01' }],
  },
  trends: {
    title: 'Three steps rising in sequence',
    aspect: 1.6,
    blocks: [
      { x: 0, y: 0, w: 3, d: 3, h: 0.6, label: 'Step 01' },
      { x: 5, y: 0, w: 3, d: 3, h: 1.2, leds: 3, label: 'Step 02' },
      { x: 10, y: 0, w: 3, d: 3, h: 1.9, leds: 3, active: true, signal: true, label: 'Step 03' },
    ],
    paths: [{ points: [[3, 1.5, 0], [5, 1.5, 0]] }, { points: [[8, 1.5, 0], [10, 1.5, 0]] }],
  },
  inspiration: {
    title: 'A tall block beside two low slabs',
    aspect: 1.6,
    blocks: [
      { x: 0, y: 0, w: 3, d: 3, h: 2.6, leds: 4, active: true, signal: true, label: 'Idea 01' },
      { x: 3.6, y: 0, w: 3, d: 3, h: 0.5 },
      { x: 0, y: 3.6, w: 3, d: 3, h: 0.5 },
    ],
  },
  'open-source': {
    title: 'Three layers stacked and connected',
    aspect: 1.6,
    padding: 36,
    blocks: [
      { x: 0, y: 0, z: 0, w: 6, d: 6, h: 0.7, leds: 6, label: 'Layer 01' },
      { x: 0, y: 0, z: 1.6, w: 6, d: 6, h: 0.7, leds: 4, label: 'Layer 02' },
      { x: 0, y: 0, z: 3.2, w: 6, d: 6, h: 0.7, active: true, signal: true, label: 'Layer 03' },
    ],
    paths: [0.7, 2.3].flatMap((z) => [[0, 6], [6, 6], [6, 0]].map(([x, y]) => ({ points: [[x, y, z], [x, y, z + 0.9]] as [number, number, number][] }))),
  },
  social: {
    title: 'Four nodes joined in a ring',
    aspect: 1.6,
    blocks: [
      { x: 0, y: 0, w: 2.5, d: 2.5, h: 0.8 },
      { x: 5, y: 0, w: 2.5, d: 2.5, h: 0.8 },
      { x: 0, y: 5, w: 2.5, d: 2.5, h: 0.8 },
      { x: 5, y: 5, w: 2.5, d: 2.5, h: 1.2, active: true, signal: true },
    ],
    paths: [
      { points: [[2.5, 1.25, 0], [5, 1.25, 0]] },
      { points: [[1.25, 2.5, 0], [1.25, 5, 0]] },
      { points: [[6.25, 2.5, 0], [6.25, 5, 0]] },
      { points: [[2.5, 6.25, 0], [5, 6.25, 0]] },
    ],
  },
  learning: {
    title: 'Three slabs stepping up',
    aspect: 1.6,
    padding: 60,
    blocks: [
      { x: 0, y: 0, z: 0, w: 6, d: 6, h: 0.5 },
      { x: 0.75, y: 0.75, z: 0.5, w: 4.5, d: 4.5, h: 0.5 },
      { x: 1.5, y: 1.5, z: 1, w: 3, d: 3, h: 0.9, leds: 3, active: true, signal: true },
    ],
  },
  opportunities: {
    title: 'Three slabs and an open slot, its block waiting above',
    aspect: 1.6,
    blocks: [
      { x: 0, y: 0, w: 2.6, d: 2.6, h: 0.6 },
      { x: 3.2, y: 0, w: 2.6, d: 2.6, h: 0.6 },
      { x: 0, y: 3.2, w: 2.6, d: 2.6, h: 0.6 },
      { x: 3.2, y: 3.2, z: 1.4, w: 2.6, d: 2.6, h: 0.8, active: true, signal: true },
    ],
    paths: [[3.2, 3.2], [5.8, 3.2], [5.8, 5.8], [3.2, 5.8]].map(([x, y]) => ({ points: [[x, y, 0], [x, y, 1.4]] as [number, number, number][] })),
  },
  experiment: {
    title: 'Four steps on a grid, joined in order, the last one active',
    aspect: 1.5,
    blocks: [
      { x: 0, y: 0, w: 4, d: 4, h: 1.1, leds: 4, label: 'Step 01' },
      { x: 4.8, y: 0, w: 4, d: 4, h: 1.1, leds: 4, label: 'Step 02' },
      { x: 0, y: 4.8, w: 4, d: 4, h: 1.1, leds: 4, label: 'Step 03' },
      { x: 4.8, y: 4.8, w: 4, d: 4, h: 1.1, active: true, signal: true, label: 'Step 04' },
    ],
    paths: [
      { points: [[4, 2, 0], [4.8, 2, 0]] },
      { points: [[6.8, 4, 0], [6.8, 4.8, 0]] },
      { points: [[2, 4, 0], [2, 4.8, 0]] },
    ],
  },
};

/** A section's drawing as a cover: no labels, no signal dot. */
export const sectionCover = (slug: string) => iso(SECTION_ISO[slug] ?? SECTION_ISO.industry, { labels: false, signal: false });

/** Numbered steps on a grid, joined in reading order (left to right, then
 *  back), the last one active. Labels match the step list beside it. */
export function stepsIso(n: number): Spec {
  const count = Math.max(1, Math.min(n, 6));
  const blocks: Block[] = [];
  const at: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 2);
    const col = row % 2 === 0 ? i % 2 : 1 - (i % 2);
    const x = col * 4.8;
    const y = row * 4.8;
    at.push([x, y]);
    const last = i === count - 1;
    blocks.push({ x, y, w: 4, d: 4, h: 1.1, leds: last ? 0 : 4, active: last, signal: last, label: `Step ${String(i + 1).padStart(2, '0')}` });
  }
  const paths: IsoPath[] = [];
  for (let i = 0; i < count - 1; i++) {
    const [ax, ay] = at[i];
    const [bx, by] = at[i + 1];
    if (ay === by) {
      const y = ay + 2;
      paths.push({ points: [[Math.min(ax, bx) + 4, y, 0], [Math.max(ax, bx), y, 0]] });
    } else {
      const x = ax + 2;
      paths.push({ points: [[x, ay + 4, 0], [x, by, 0]] });
    }
  }
  return { title: `${count} steps on a grid, joined in order, the last one active`, aspect: 1.5, blocks, paths };
}

