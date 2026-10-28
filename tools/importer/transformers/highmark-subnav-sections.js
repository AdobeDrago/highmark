/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section boundaries + section metadata (topic-hub-subnav).
 *
 * Sub-topic detail pages (depression, anxiety, eating-disorders, spending-accounts)
 * place their content blocks as sibling wrappers under div.page__par > section.
 * Unlike topic-hub-landing, these pages have divergent section structures, so we
 * identify each section by a content-distinguishing selector (the same :has()
 * selectors used for block mapping) rather than nth-of-type position. Selectors
 * that don't match on a given page are simply skipped — never guessed.
 *
 * The only styled band on these pages is the tinted callout/intro band
 * (div.onecard1colpanel.section -> style: highlight), used for the crisis callout
 * (depression) and the "Spending Account Types" intro (spending-accounts).
 *
 * Follows the reference before/after hook + marker pattern: <hr> breaks are
 * inserted in beforeTransform (while every section element still exists), and
 * Section Metadata is inserted in afterTransform anchored to the marker <hr>
 * (or the surviving original element).
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

// Content-distinguishing selectors (verified live against both template pages).
// Order matches the visual top-to-bottom flow shared across subnav pages.
const SECTIONS = [
  { id: 'section-hero', selector: 'div.hero.responsivegrid.section' },
  { id: 'section-iconnav', selector: 'div.quicklinks.section' },
  { id: 'section-video-cards', selector: 'section.container-fluid-fullwidth.section:has(.cardText)' },
  { id: 'section-columns', selector: 'div.newcardscomponent-variations.section:has(.side-card-panel)' },
  { id: 'section-crisis', selector: 'div.onecard1colpanel.section', style: 'highlight' },
  { id: 'section-table', selector: '.dynamic-table-container' },
  { id: 'section-cards-img', selector: 'div.newcardscomponent-variations.section:has(ul.gridcardsul):has(.cardThree img)' },
  { id: 'section-cards-list', selector: 'div.newcardscomponent-variations.section:has(ul.gridcardsul):not(:has(picture)):not(:has(img))' },
  { id: 'section-cards-wide', selector: 'div.newcardscomponent-variations.section:has(.listWideImg)' },
];

export default function transform(hookName, element, payload) {
  const sections = SECTIONS;

  if (hookName === 'beforeTransform') {
    // Insert section breaks before parsers can replace any section element.
    // querySelectorAll handles multiple matches (e.g. two columns panels on a page).
    // Reverse order so each pending section stays where it was found.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const matches = element.querySelectorAll(section.selector);
      if (!matches.length) continue; // not on this page — skip, never guess

      // Break before each matched instance (except the very first section on the page).
      for (let m = matches.length - 1; m >= 0; m -= 1) {
        const sectionEl = matches[m];
        // Skip a leading break only for the hero when it is the page's first child.
        if (section.id === 'section-hero' && !sectionEl.previousElementSibling) continue;
        const hr = document.createElement('hr');
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers may have replaced section elements. Anchor each styled section's
    // Section Metadata to the surviving marker <hr> (or the original element).
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || element.querySelector(section.selector);
      if (!anchor) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) marker.removeAttribute(SECTION_MARKER_ATTR);
    }
  }
}
