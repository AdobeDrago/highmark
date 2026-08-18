/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: highmark section boundaries + section metadata (topic-hub-landing).
 *
 * The topic-hub-landing content region (div.page__par > section) holds five
 * sibling section wrappers (verified in migration-work/cleaned.html:1803-1963,
 * all direct <div> children of the same <section>). This transformer inserts a
 * section break (<hr>) before every section after the first and adds a
 * Section Metadata block for the two styled bands.
 *
 * page-templates.json for this project carries section styling on blocks[].section
 * rather than a top-level template.sections array, so the sections are defined
 * here from the DOM-verified boundaries in page-structure.json:
 *   3. div.onecard1colpanel.section                          -> style: highlight (light-pink glossary band)
 *   4. div.newcardscomponent-variations.section:nth-of-type(4) -> style: accent   (light-blue columns band)
 *
 * Follows the reference before/after hook + marker pattern: breaks are inserted
 * in beforeTransform (while every section element still exists, before block
 * parsers can replace them), and Section Metadata is inserted in afterTransform
 * anchored to the marker <hr> (or the surviving original element).
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

// Boundaries verified in migration-work/cleaned.html (see page-structure.json).
const SECTIONS = [
  { id: 'section-1', selector: 'div.hero.responsivegrid.section' },
  { id: 'section-2', selector: 'div.card-block.responsivegrid.section' },
  { id: 'section-3', selector: 'div.onecard1colpanel.section', style: 'highlight' },
  { id: 'section-4', selector: 'div.newcardscomponent-variations.section:nth-of-type(4)', style: 'accent' },
  { id: 'section-5', selector: 'div.newcardscomponent-variations.section:nth-of-type(5)' },
];

export default function transform(hookName, element, payload) {
  const sections = SECTIONS;

  if (hookName === 'beforeTransform') {
    // Insert section breaks now, before parsers can replace any section element.
    // Reverse order so each pending section stays where querySelector found it.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break
      const sectionEl = element.querySelector(section.selector);
      if (!sectionEl) continue; // selector didn't match on this page — skip, never guess

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers may have replaced section elements. Anchor each styled section's
    // Section Metadata block to whichever survives: the marker <hr> above, or
    // the original element.
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
