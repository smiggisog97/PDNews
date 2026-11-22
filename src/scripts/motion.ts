// Motion, after Editorial Taste's motion.js (github.com/iamshakibali/editorial-taste, MIT).
// Page-head reveal, masked headings, statement words,
// nav hide and show, button label roll. Progressive: without JS or with
// reduced motion, everything is simply visible in its final state.
//
//   .reveal               fade and rise
//   data-reveal="text"    words rise out of masks
//   data-reveal="image"   frame unmasks upward while the picture settles
//   data-reveal="iso"     drawing builds in, back to front
//   data-stagger="80"     children reveal in sequence (ms step, capped at 400)
//   data-words            statement: words light up at the reading line
//   style="--d: .3s"      extra delay for one element

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const nav = document.querySelector<HTMLElement>('.nav');

/* 1. Native scrolling. In-page anchors jump straight to the target (CSS
   scroll-margin keeps it clear of the nav) and move focus there. */
document.addEventListener('click', (e) => {
  const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!link) return;
  const hash = link.getAttribute('href')!;
  let target: HTMLElement | null = null;
  try { target = hash.length > 1 ? document.querySelector(hash) : null; } catch { return; }
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
  history.pushState(null, '', hash);
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});

/* 2. Word splitting; screen readers keep the original sentence */
type Word = { outer: HTMLElement; inner: HTMLElement };
function splitWords(el: HTMLElement, make: (t: string) => Word) {
  if (el.dataset.split) return [] as HTMLElement[];
  el.dataset.split = 'true';
  const label = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  const words: HTMLElement[] = [];
  const walk = (from: Node, into: Node) => {
    from.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        (node.textContent ?? '').split(/([ \t\n\r]+)/).forEach((part) => {
          if (!part) return;
          if (/^[ \t\n\r]+$/.test(part)) { into.appendChild(document.createTextNode(' ')); return; }
          const w = make(part);
          words.push(w.inner);
          into.appendChild(w.outer);
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const shell = node.cloneNode(false);
        into.appendChild(shell);
        walk(node, shell);
      }
    });
  };
  walk(el, visual);
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = label;
  el.replaceChildren(sr, visual);
  return words;
}
const masked = (text: string): Word => {
  const outer = document.createElement('span'); outer.className = 'tw';
  const inner = document.createElement('span'); inner.className = 'tw__i'; inner.textContent = text;
  outer.appendChild(inner);
  return { outer, inner };
};
const plainWord = (text: string): Word => {
  const s = document.createElement('span'); s.className = 'w'; s.textContent = text;
  return { outer: s, inner: s };
};
const ms = (el: Element) => {
  const v = getComputedStyle(el).getPropertyValue('--d').trim();
  return v.endsWith('ms') ? parseFloat(v) : v.endsWith('s') ? parseFloat(v) * 1000 : 0;
};

/* 3. Statement: words light up as they cross the reading line */
document.querySelectorAll<HTMLElement>('[data-words]').forEach((el) => {
  const words = splitWords(el, plainWord);
  if (reduced) { words.forEach((w) => w.classList.add('is-on')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('is-on', e.boundingClientRect.top < innerHeight * 0.62));
  }, { rootMargin: '0px 0px -38% 0px' });
  words.forEach((w) => io.observe(w));
});

/* 4. Nav slides away on the way down, returns on the way up */
if (nav && !reduced) {
  let last = scrollY;
  let ticking = false;
  const update = () => {
    const y = scrollY;
    if (Math.abs(y - last) > 6) {
      const hide = y > last && y > innerHeight * 0.6 && !document.body.classList.contains('drawer-open') && !nav.matches(':focus-within') && !document.querySelector('.hub-menu.is-open');
      nav.classList.toggle('is-hidden', hide);
      last = y;
    }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
}

/* 5. Button and nav labels roll up on hover (fine pointers) */
if (finePointer && !reduced) {
  document.querySelectorAll<HTMLElement>('.btn:not(.btn--tertiary), .nav__link').forEach((btn) => {
    const text = [...btn.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
    if (!text) return;
    const label = text.textContent!.trim();
    const roll = document.createElement('span');
    roll.className = 'roll';
    const a = document.createElement('span'); a.textContent = label;
    const b = document.createElement('span'); b.textContent = label; b.setAttribute('aria-hidden', 'true');
    roll.append(a, b);
    btn.replaceChild(roll, text);
  });
}

/* 6. Reveals, once fonts are in */
function initReveals() {
  document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
    const step = parseFloat(group.dataset.stagger!) || 80;
    [...group.children].forEach((child, i) => {
      (child as HTMLElement).style.setProperty('--d', `${ms(child) + Math.min(i * step, 400)}ms`);
    });
  });
  document.querySelectorAll<HTMLElement>('[data-reveal="text"]').forEach((el) => {
    const base = ms(el);
    splitWords(el, masked).forEach((w, i) => w.style.setProperty('--d', `${base + Math.min(i * 40, 600)}ms`));
  });

  const targets = [...document.querySelectorAll<HTMLElement>('.reveal, [data-reveal]')];
  if (reduced || !('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('is-in')); return; }
  const pending = new Set(targets);
  const reveal = (t: HTMLElement) => { if (pending.delete(t)) t.classList.add('is-in'); };
  // A fully clipped element is invisible to IntersectionObserver: watch its parent.
  const watched = (t: HTMLElement) => (t.matches('[data-reveal="image"]') ? t.parentElement! : t);
  const owners = new Map<Element, HTMLElement[]>();
  targets.forEach((t) => { const w = watched(t); owners.set(w, [...(owners.get(w) ?? []), t]); });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      (owners.get(e.target) ?? []).forEach(reveal);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  owners.forEach((_, w) => io.observe(w));
  // Catch up after jumps (End key, history restore, reload mid-page).
  const sweep = () => pending.forEach((t) => { if (watched(t).getBoundingClientRect().top < innerHeight * 0.88) reveal(t); });
  let timer: number | undefined;
  addEventListener('scroll', () => { clearTimeout(timer); timer = window.setTimeout(sweep, 120); }, { passive: true });
  sweep();
}

const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(() => {
  initReveals();
  requestAnimationFrame(() => root.classList.add('is-loaded'));
});
