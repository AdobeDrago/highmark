/*
 * Shop footer, laid out like ShopX (shop.highmark.com): a light band with the logo, social
 * icons and update date, three link columns, then the legal links and legal text.
 *
 * The footer fragment's sections say what they hold with a section style:
 *   shop-footer-logo, shop-footer-social   first column
 *   shop-footer-explore                    second column (Discover, Medicare, Shop)
 *   shop-footer-care                       third column (Find a Doctor, Find a Pharmacy)
 *   shop-footer-links                      fourth column (Additional Links)
 *   shop-footer-legal-links                the row of legal links ("piped" adds | between)
 *   shop-footer-legal                      the legal text
 * Most of them differ by region: each variant is its own section with `Regions` section
 * metadata (zip-tokens.js), and region links come from {{tokens}} such as
 * {{find-a-doctor}} or {{customer-service}}.
 */
import { loadCSS } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function element(tag, className, ...children) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.append(...children);
  return el;
}

/**
 * @param {Element} block the footer block
 * @param {string} path the footer fragment's path
 */
export default async function decorate(block, path) {
  const [fragment] = await Promise.all([
    loadFragment(path),
    loadCSS(`${window.hlx.codeBasePath}/blocks/footer/shop-footer.css`),
  ]);
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.querySelectorAll(':scope > .section')];
  const pick = (style) => sections.filter((section) => section.classList.contains(style));

  const columns = element(
    'div',
    'shop-footer-columns',
    element('div', 'shop-footer-column shop-footer-brand', ...pick('shop-footer-logo'), ...pick('shop-footer-social')),
    element('div', 'shop-footer-column', ...pick('shop-footer-explore')),
    element('div', 'shop-footer-column', ...pick('shop-footer-care')),
    element('div', 'shop-footer-column', ...pick('shop-footer-links')),
  );
  const legal = element('div', 'shop-footer-legal-text', ...pick('shop-footer-legal-links'), ...pick('shop-footer-legal'));
  const footer = element('div', 'shop-footer', element('div', 'shop-footer-inner', columns, legal));

  // Explore and social links that leave the site open in a new tab, as on ShopX (the
  // region's Find a Doctor / Pharmacy links get theirs when their tokens are filled)
  footer.querySelectorAll('.shop-footer-explore a[href], .shop-footer-social a[href]').forEach((a) => {
    if (new URL(a.href, window.location.href).origin !== window.location.origin) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });

  block.append(footer);

  // region-only sections and {{tokens}} (Find a Doctor, Customer Service, ...)
  const { default: applyZipTokens } = await import('../zip-modal/zip-tokens.js');
  await applyZipTokens(footer);
}
