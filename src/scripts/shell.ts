// Page furniture: theme switch, the drawer, the nav over the cover.
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
