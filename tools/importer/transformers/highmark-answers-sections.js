/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section boundaries + section metadata (tabbed-answers-landing).
 *
 * The /resources/answers landing page and its siblings stack these blocks under
 * the content region: hero (tinted band), icon quick-nav bar, FAQ accordion,
 * a tinted glossary CTA band, a 3-up cards grid, and two image/text promo
 * sections. Each block must land in its own EDS section so the parsers each
 * receive a discrete element; two bands carry background styling.
 *
 * Content-distinguishing selectors (verified live). Selectors that don't match
 * on a given page are skipped — never guessed. Breaks are inserted in
 * beforeTransform (before block parsers replace elements); Section Metadata is
 * anchored in afterTransform to the surviving marker <hr> or original element.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

const SECTIONS = [
  { id: 'section-hero', selector: 'section.new-hmk-brand-fifteenpercent-splash' },
  { id: 'section-iconnav', selector: '.quick-link-list-container.bg-blue' },
  { id: 'section-accordion', selector: '.accordianTable' },
  { id: 'section-glossary', selector: '.one-card-one-col-panel.new-hmk-brand-darkblue', style: 'highlight' },
  { id: 'section-cards', selector: '.newcardscomponent-variations .cards-variation' },
  { id: 'section-promo', selector: '.side-card-panel.new-hmk-brand-blush-twnetyfive', style: 'accent' },
  { id: 'section-community', selector: '.newcardscomponent-variations:last-of-type .side-card-panel' },
];

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Insert breaks before each matched section (skip a leading break only for
    // the hero when it's the first content element). Reverse per selector so
    // insertions don't shift later matches.
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
    // Anchor Section Metadata for styled bands to the surviving marker or element.
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
