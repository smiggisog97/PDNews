// Page furniture: theme switch, the product bento under the mark, the drawer.
import './motion';

const root = document.documentElement;

/* ------------------------------------------------------------- theme ---
 * A plain switch: the colours change on the spot, nothing animates. */
const toggles = [...document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')];
const label = () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  toggles.forEach((t) => t.setAttribute('aria-label', `Switch to ${next} theme`));
};
label();
toggles.forEach((toggle) =>
  toggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('pdn-theme', root.dataset.theme); } catch {}
    label();
  }),
);

/* -------------------------------------------------------------- menu ---
 * Hovering the mark opens every Pathao Design product right under it, as
 * in the hub. Pointer only; on touch the mark just links home. Keyboard
 * focus on the mark opens it too. */
const brand = document.querySelector<HTMLAnchorElement>('[data-brand]');
const panel = document.querySelector<HTMLElement>('[data-menu]');
if (brand && panel && matchMedia('(hover: hover)').matches) {
  let openTimer: number | undefined;
  let closeTimer: number | undefined;
  let suppress = false;
  const place = () => {
    const b = brand.getBoundingClientRect();
    panel.style.left = `${Math.max(10, b.left - 10)}px`;
    panel.style.top = `${b.bottom + 15}px`;
  };
  const open = (now = false) => {
    clearTimeout(closeTimer);
    if (panel.classList.contains('is-open')) return;
    const go = () => { place(); panel.classList.add('is-open'); };
    if (now) go(); else openTimer = window.setTimeout(go, 120);
  };
  const close = (now = false) => {
    clearTimeout(openTimer);
    closeTimer = window.setTimeout(() => panel.classList.remove('is-open'), now ? 0 : 220);
  };
  [brand, panel].forEach((el) => {
    el.addEventListener('mouseenter', () => open());
    el.addEventListener('mouseleave', () => close());
  });
  brand.addEventListener('focus', () => { if (!suppress) open(true); });
  const leave = (e: FocusEvent) => {
    const to = e.relatedTarget as Node | null;
    if (!to || (!panel.contains(to) && to !== brand)) close(true);
  };
  brand.addEventListener('blur', leave);
  panel.addEventListener('focusout', leave);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !panel.classList.contains('is-open')) return;
    if (panel.contains(document.activeElement)) { suppress = true; brand.focus(); suppress = false; }
    close(true);
  });
  addEventListener('scroll', () => close(true), { passive: true });
} else if (panel) {
  panel.remove();
}

/* ------------------------------------------------------------ drawer --- */
const menuBtn = document.querySelector<HTMLButtonElement>('[data-drawer-toggle]');
const drawer = document.querySelector<HTMLElement>('[data-drawer]');
if (menuBtn && drawer) {
  const set = (open: boolean) => {
    drawer.classList.toggle('is-open', open);
    drawer.toggleAttribute('inert', !open);
    document.body.classList.toggle('drawer-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) requestAnimationFrame(() => requestAnimationFrame(() => drawer.querySelector<HTMLElement>('a')?.focus()));
  };
  drawer.toggleAttribute('inert', true);
  menuBtn.addEventListener('click', () => set(!drawer.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) { set(false); menuBtn.focus(); } });
}

/* ------------------------------------------------------------- cover ---
 * Over a full-bleed cover the nav is clear with white type; once the cover
 * has scrolled away it turns solid again. */
const overNav = document.querySelector<HTMLElement>('.nav[data-over]');
const cover = document.querySelector<HTMLElement>('.cover');
if (overNav && cover) {
  let frame = 0;
  const update = () => {
    frame = 0;
    overNav.classList.toggle('is-over', cover.getBoundingClientRect().bottom > overNav.offsetHeight + 10);
  };
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  update();
}
