/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section boundaries for the sidebar-listing template.
 *
 * These pages are a two-column layout: a left section-nav sidebar
 * (div.nav-container in .col-lg-3) and a main content column (.col-lg-9)
 * holding an H1 + intro and then either an article listing (default content)
 * or one-or-more FAQ accordion groups (div.accordianTable).
 *
 * The sidebar block and each accordion group must land in their own EDS
 * sections so the block parsers each receive a discrete element. We insert an
 * <hr> before the sidebar and before each accordion group. No styled section
 * bands exist on these pages, so no Section Metadata is added.
 *
 * Selectors that don't match on a given page are skipped — never guessed.
 * Runs in beforeTransform so breaks are placed while every source element
 * still exists (before block parsers replace them).
 */

const SECTIONS = [
  { id: 'section-sidenav', selector: 'div.d-none.d-lg-block.col-lg-3 div.nav-container' },
  { id: 'section-accordion', selector: 'div.col-lg-9 div.accordianTable' },
];

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;

  SECTIONS.forEach((section) => {
    const matches = element.querySelectorAll(section.selector);
    // Reverse so each insertion doesn't shift the next match's position.
    for (let i = matches.length - 1; i >= 0; i -= 1) {
      const el = matches[i];
      const hr = document.createElement('hr');
      el.before(hr);
    }
  });
}
