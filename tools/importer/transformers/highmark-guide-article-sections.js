/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section boundaries + section metadata (sidebar-guide-article).
 *
 * These pages are a two-column layout: a left section-nav sidebar
 * (div.nav-container in .col-lg-3) and a main content column holding an H1 +
 * intro, an in-page jump-link guide, and multiple article subsections. Below
 * the content — outside the two columns — sits a light-blue "splash" CTA band
 * (div.one-card-one-col-panel.new-hmk-brand-fifteenpercent-splash).
 *
 * The sidebar block and the CTA band must each land in their own EDS section so
 * the parsers receive a discrete element. We insert an <hr> before the sidebar
 * and before the CTA band; the CTA band carries a light-blue Section Metadata
 * style. Selectors that don't match on a page are skipped — never guessed.
 * Breaks are inserted in beforeTransform (before block parsers replace
 * elements); Section Metadata is anchored in afterTransform to the surviving
 * marker <hr> or the original element.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

const SECTIONS = [
  { id: 'section-sidenav', selector: 'div.d-none.d-lg-block.col-lg-3 div.nav-container' },
  { id: 'section-cta', selector: 'div.one-card-one-col-panel.new-hmk-brand-fifteenpercent-splash', style: 'light-blue' },
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
