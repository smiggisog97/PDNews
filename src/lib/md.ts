// The brief's text fields carry a little Markdown: [label](url) links and
// **bold**. This renders exactly that, escaping everything else.
const LINK = /\[([^\]]+)\]\((https?:[^)\s]+)\)/g;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const strong = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

export function inline(md: string | null | undefined): string {
  if (!md) return '';
  let out = '';
  let last = 0;
  for (const m of md.matchAll(LINK)) {
    out += strong(esc(md.slice(last, m.index)));
    out += `<a href="${esc(m[2])}" target="_blank" rel="noopener">${strong(esc(m[1]))}</a>`;
    last = (m.index ?? 0) + m[0].length;
  }
  return out + strong(esc(md.slice(last)));
}

/** Text with the Markdown removed, for search, meta tags and clamped previews. */
export function plain(md: string | null | undefined): string {
  return (md || '').replace(LINK, '$1').replace(/\*\*/g, '');
}
