import { getMetadata } from '../../scripts/aem.js';

/**
 * Fetch the footer fragment. Dual-fetch: localhost / `aem up` serves the plain
 * file at /content/footer.plain.html; DA/EDS serves it at `${footerPath}.plain.html`.
 */
async function fetchFooter() {
  try {
    let resp = await fetch('/content/footer.plain.html');
    if (!resp.ok) {
      const footerMeta = getMetadata('footer');
      const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
      resp = await fetch(`${footerPath}.plain.html`);
    }
    if (!resp.ok) return null;
    const html = await resp.text();
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Footer fragment failed to load', e);
    return null;
  }
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  // Source order: [0] brand + social + phone, [1..3] link columns, [last] legal.
  const brandSection = sections[0];
  const columnSections = sections.slice(1, sections.length - 1);
  const legalSection = sections[sections.length - 1];

  // Upper (navy) band: brand block + link columns.
  const upper = document.createElement('div');
  upper.className = 'footer-main';

  const inner = document.createElement('div');
  inner.className = 'footer-inner';

  if (brandSection) {
    brandSection.className = 'footer-brand';
    const socialUl = brandSection.querySelector(':scope > ul');
    if (socialUl) socialUl.classList.add('footer-social');
    inner.append(brandSection);
  }

  const isMobile = window.matchMedia('(max-width: 899px)');
  const columns = document.createElement('div');
  columns.className = 'footer-columns';
  columnSections.forEach((col) => {
    col.className = 'footer-column';
    // Mobile: the column heading toggles its link list (accordion).
    const heading = col.querySelector(':scope > p');
    if (heading) {
      heading.addEventListener('click', () => {
        if (!isMobile.matches) return;
        col.classList.toggle('open');
      });
    }
    columns.append(col);
  });
  inner.append(columns);
  upper.append(inner);

  // Lower (light) band: legal disclaimer.
  const lower = document.createElement('div');
  lower.className = 'footer-legal';
  if (legalSection) {
    const legalInner = document.createElement('div');
    legalInner.className = 'footer-legal-inner';
    while (legalSection.firstElementChild) legalInner.append(legalSection.firstElementChild);
    lower.append(legalInner);
  }

  const footer = document.createElement('div');
  footer.className = 'footer-wrapper';
  footer.append(upper, lower);
  block.append(footer);
}
