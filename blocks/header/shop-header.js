/*
 * Shop header, laid out like ShopX (shop.highmark.com): the logo with Language Assistance
 * and Contact Us, the "Shop Individual & Family Plans" title with the visitor's region,
 * and the shop nav. On phones a menu button opens a panel with the nav, the utility links
 * and the region.
 *
 * The nav fragment's sections say what they hold with a section style: shop-brand,
 * shop-utility, shop-title, shop-nav. A section can be limited to some regions with
 * `Regions` section metadata (zip-tokens.js), e.g. the Blue Shield logo for CPA, SEPA and
 * NENY, or the "Find a Doctor or RX" nav for visitors without a ZIP ("none"). A
 * `no-region` shop-title section hides the region (product headers such as "Shop Dental
 * Plans", whose pages use their own nav fragment via `nav` metadata).
 */
import { loadCSS } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { getStoredZip } from '../zip-modal/zip-store.js';

const isDesktop = window.matchMedia('(min-width: 992px)');

function element(tag, className, ...children) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.append(...children);
  return el;
}

/**
 * @param {Element} block the header block
 * @param {string} path the nav fragment's path
 */
export default async function decorate(block, path) {
  const [fragment] = await Promise.all([
    loadFragment(path),
    loadCSS(`${window.hlx.codeBasePath}/blocks/header/shop-header.css`),
  ]);
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.querySelectorAll(':scope > .section')];
  const pick = (style) => sections.filter((section) => section.classList.contains(style));

  const toggle = element('button', 'shop-header-toggle', element('span', 'shop-header-toggle-icon'));
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', 'shop-header-panel');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open menu');

  const utility = pick('shop-utility');
  const regionLabels = [element('p', 'shop-header-region'), element('p', 'shop-header-region')];
  const top = element(
    'div',
    'shop-header-top',
    toggle,
    element('div', 'shop-header-brand', ...pick('shop-brand')),
    element('div', 'shop-header-utility', ...utility),
  );
  const title = element('div', 'shop-header-title', ...pick('shop-title'), regionLabels[0]);
  // phones: the menu panel also lists the utility links and the region, as on ShopX
  const extras = element(
    'div',
    'shop-header-panel-extras',
    ...utility.map((section) => section.cloneNode(true)),
    regionLabels[1],
  );
  const panel = element('div', 'shop-header-panel', ...pick('shop-nav'), extras);
  panel.id = 'shop-header-panel';

  const nav = element('nav', 'shop-header', top, title, panel);
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');
  block.append(element('div', 'shop-header-wrapper', nav));

  // product headers (e.g. "Shop Dental Plans") don't show the region: style `no-region`
  const regionShown = !pick('shop-title').some((section) => section.classList.contains('no-region'));
  const showRegion = () => {
    const region = regionShown ? getStoredZip()?.region || '' : '';
    regionLabels.forEach((label) => {
      label.textContent = region;
      label.hidden = !region;
    });
  };
  showRegion();
  // the ZIP modal re-applies tokens and region sections to the whole page itself
  document.addEventListener('zip-county-submit', showRegion);

  const setOpen = (open) => {
    nav.classList.toggle('shop-header-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('shop-header-open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('shop-header-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) setOpen(false);
  });
  isDesktop.addEventListener('change', () => setOpen(false));

  // region-only sections and {{tokens}} (e.g. the region's Find a Doctor link)
  const { default: applyZipTokens } = await import('../zip-modal/zip-tokens.js');
  await applyZipTokens(nav);
}
