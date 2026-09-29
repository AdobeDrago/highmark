/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section boundaries + section metadata + page-specific cleanup
 * for the "plans" template (https://www.highmark.com/plans/individual-families).
 *
 * Sections come from payload.template.sections (page-templates.json "plans",
 * 11 sections). Each section.selector is an array of DOM-verified candidates
 * (migration-work/cleaned.html) tried in order; the first match wins.
 *
 * Follows the reference before/after hook + marker pattern: breaks are inserted
 * in beforeTransform (while every section element still exists, before block
 * parsers replace them); Section Metadata is inserted in afterTransform anchored
 * to the marker <hr> (or the surviving original element).
 *
 * Plans-only cleanup (beforeTransform, so parsers see the cleaned DOM):
 *  - Mobile duplicates: the hero (.left-content.d-block.d-lg-none, cleaned.html:1841)
 *    and onecard1colpanel bands (h2/.body-text.d-block.d-lg-none, cleaned.html:1868,
 *    1874, 1951, 1957, 2260, 2266) repeat the desktop (.d-none.d-lg-block) copy.
 *    Mobile copies are removed; the hero parser prefers
 *    `.left-content.d-lg-block .content-wrapper`, which is kept.
 *  - ZIP-gated CTAs: <a> without href in the content area (e.g.
 *    a#special-enrollment-period cleaned.html:1922, a#doctors-and-drugs :2016,
 *    a#how-to-pick-a-plan :2090, a#shop-individual-family-plans :2273) get
 *    href="/modals/zip-county" so they open the ZIP modal. Matching is by text
 *    and scoped to the page content (.page__par) because the global nav reuses
 *    the same ids. Anchors that already have an href are never touched.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';
const ZIP_MODAL_HREF = '/modals/zip-county';

// Normalized (lowercase, collapsed whitespace) CTA texts that are ZIP-gated on source.
const ZIP_GATED_CTA_TEXTS = [
  'special enrollment eligibility',
  'find a doctor or hospital',
  'learn how to pick a plan',
  'learn about aca plans',
];

function normalize(text) {
  return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

// section.selector is an array of candidate selectors — try each in order, first match wins.
function querySection(root, selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
    if (!sel) continue;
    let el = null;
    try {
      el = root.querySelector(sel);
    } catch (e) {
      el = null;
    }
    if (el) return el;
  }
  return null;
}

function contentRoot(element) {
  // .page__par holds all authorable content (cleaned.html:1812); fall back to <main>.
  return element.querySelector('.page__par') || element.querySelector('main') || element;
}

function removeMobileDuplicates(root) {
  WebImporter.DOMUtils.remove(root, [
    // hero mobile content wrapper (cleaned.html:1841)
    '.hero.responsivegrid .sub-hero-content-container .left-content.d-block.d-lg-none',
    // onecard1colpanel color bands: mobile h2 + body-text (sections 2 and 10)
    '.onecard1colpanel .one-card-content-center-container > .d-block.d-lg-none',
    // onecard1colpanel image banner: mobile h2 + body-text (section 4)
    '.onecard1colpanel .one-card-content-left-container > .d-block.d-lg-none',
  ]);
}

function linkZipGatedCtas(root) {
  root.querySelectorAll('a:not([href])').forEach((a) => {
    if (ZIP_GATED_CTA_TEXTS.includes(normalize(a.textContent))) {
      a.setAttribute('href', ZIP_MODAL_HREF);
    }
  });
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    const root = contentRoot(element);
    removeMobileDuplicates(root);
    linkZipGatedCtas(root);

    // Insert section breaks now, before parsers can replace any section element.
    // Reverse order so each pending section stays where querySelector found it.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break
      const sectionEl = querySection(element, section.selector);
      if (!sectionEl) continue; // no selector matched — skip, never guess

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
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }
  }
}
