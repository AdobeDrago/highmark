/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section boundaries + section metadata (home).
 *
 * The Highmark home page stacks these regions under the content area:
 *   1. hero banner (bg image + heading + CTA)
 *   2. icon quick-nav bar (PLANS / FIND CARE / MEMBER LOGIN / GET HELP)
 *   3. "Highmark gives you…" 2-up image cards        — polar band  (accent)
 *   4. "Support for your mental health" image/text panel — polar band (accent)
 *   5. "My Highmark app" 3-up icon feature cards
 *   6. "Find the care you need" image/text panel     — blush band  (highlight)
 *   7. "Building health care…" 3-up image cards
 *   8. "Group health insurance plans" image/text panel — polar band (accent)
 *
 * Each region must land in its own EDS section so the block parsers each
 * receive a discrete element. We insert an <hr> before each region; the tinted
 * bands additionally carry a Section Metadata style. Content-distinguishing
 * selectors (verified live) — selectors that don't match on a page are skipped,
 * never guessed. Breaks are inserted in beforeTransform (before block parsers
 * replace elements); Section Metadata is anchored in afterTransform to the
 * surviving marker <hr> or the original element.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

const SECTIONS = [
  { id: 'section-hero', selector: 'div.hero.responsivegrid.section' },
  { id: 'section-iconnav', selector: 'div.quicklinks.section' },
  { id: 'section-cards2', selector: '.card-block.responsivegrid:has(.wideCardWrapper)', style: 'accent' },
  { id: 'section-mentalhealth', selector: 'div.one-card-one-col-panel.image.new-hmk-brand-polar:has(a[href*="mental-health"])', style: 'accent' },
  { id: 'section-app', selector: '.card-block.responsivegrid:has(.cardWrapper.ghostMode)' },
  { id: 'section-findcare', selector: '.side-card-panel', style: 'highlight' },
  { id: 'section-building', selector: '.card-block.responsivegrid:not(:has(.wideCardWrapper)):not(:has(.ghostMode))' },
  { id: 'section-group', selector: 'div.one-card-one-col-panel.image.new-hmk-brand-polar:has(a[href*="employer"])', style: 'accent' },
];

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    SECTIONS.forEach((section) => {
      let matches;
      try {
        matches = element.querySelectorAll(section.selector);
      } catch (e) {
        return;
      }
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
      let anchor = marker;
      if (!anchor) {
        try {
          anchor = element.querySelector(section.selector);
        } catch (e) {
          anchor = null;
        }
      }
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
