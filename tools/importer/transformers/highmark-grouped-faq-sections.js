/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section boundaries + section metadata (sidebar-grouped-faq).
 *
 * These pages are a two-column layout: a left section-nav sidebar and a main
 * column with an H1 + intro, a right-side "Contact Us" callout box, multiple
 * grouped FAQ accordions (div.accordianTable), and a tinted pink CTA band below
 * the content. The sidebar and each accordion group need their own EDS section
 * so the parsers each receive a discrete element; the CTA band carries styling.
 *
 * Selectors that don't match on a page are skipped — never guessed. Breaks are
 * inserted in beforeTransform; Section Metadata is anchored in afterTransform to
 * the surviving marker <hr> or original element.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

const SECTIONS = [
  { id: 'section-sidenav', selector: 'div.d-none.d-lg-block.col-lg-3 div.nav-container' },
  { id: 'section-accordion', selector: 'div.col-lg-9 div.accordianTable' },
  { id: 'section-cta', selector: 'div.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive', style: 'highlight' },
];

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    SECTIONS.forEach((section) => {
      const matches = element.querySelectorAll(section.selector);
      for (let i = matches.length - 1; i >= 0; i -= 1) {
        const el = matches[i];
        const hr = document.createElement('hr');
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        el.before(hr);
      }
    });
  }

  if (hookName === 'afterTransform') {
    SECTIONS.forEach((section) => {
      if (!section.style) return;
      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || element.querySelector(section.selector);
      if (!anchor) return;
      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);
      if (marker) marker.removeAttribute(SECTION_MARKER_ATTR);
    });
  }
}
