/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section boundaries + section metadata + page-specific cleanup
 * for the "chip-landing" template
 * (https://www.highmark.com/western-pennsylvania/chip?zg=false).
 *
 * Sections come from payload.template.sections (page-templates.json
 * "chip-landing", 8 sections). Each section.selector is an array of
 * DOM-verified candidates (migration-work/cleaned.html) tried in order; the
 * first match wins.
 *
 * Follows the reference before/after hook + marker pattern: breaks are inserted
 * in beforeTransform (while every section element still exists, before block
 * parsers replace them); Section Metadata is inserted in afterTransform anchored
 * to the marker <hr> (or the surviving original element).
 *
 * Chip-landing-only cleanup (beforeTransform, so parsers see the cleaned DOM):
 *  - Mobile duplicates:
 *    - hero: `.left-content.d-block.d-lg-none` (cleaned.html:1809) repeats the
 *      desktop `.left-content.d-none.d-lg-block` (:1795). The hero parser
 *      prefers `.left-content.d-lg-block .content-wrapper`, which is kept.
 *    - quick links: `.quick-link-list-inner.quick-link-list-mobile-inner`
 *      (d-flex d-md-none, :1829) repeats the desktop `.quick-link-list-inner`
 *      (d-none d-md-flex, :1885). The iconnav parser prefers the non-mobile
 *      list, which is kept.
 *    - onecard1colpanel bands: mobile h2 / body-text `.d-block.d-lg-none`
 *      inside `.one-card-content-center-container` (sections 3, 5, 8).
 *  - Empty ZIP-gate placeholder `div.zipcodegate.section` (:2190).
 *
 * No Font Awesome external-link glyphs exist in page content (only in the
 * global header nav, removed by highmark-cleanup.js), so no preprocess hook
 * is needed for this template.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

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
  // .page__par holds all authorable content (cleaned.html:1779); fall back to <main>.
  return element.querySelector('.page__par') || element.querySelector('main') || element;
}

function removeMobileDuplicates(root) {
  // Only drop the mobile quick-link list when the desktop list is present.
  root.querySelectorAll('.quicklinks .quick-link-list-container').forEach((container) => {
    const desktop = container.querySelector('.quick-link-list-inner:not(.quick-link-list-mobile-inner)');
    if (!desktop) return;
    container.querySelectorAll('.quick-link-list-inner.quick-link-list-mobile-inner')
      .forEach((el) => el.remove());
  });

  WebImporter.DOMUtils.remove(root, [
    // hero mobile content wrapper (cleaned.html:1809)
    '.hero.responsivegrid .sub-hero-content-container .left-content.d-block.d-lg-none',
    // onecard1colpanel color bands: mobile h2 + body-text
    '.onecard1colpanel .one-card-content-center-container > .d-block.d-lg-none',
  ]);
}

// Chip-landing-only hints for the shared parsers (other templates are unaffected):
//  - quick links use <img class="quicklinks-img whiteimage"> icons, not material-icons
//    ligatures: opt the iconnav parser into image icons via a data attribute.
//  - wide help cards (li.listWideImg): the authoring analysis calls for the 200x200
//    desktop rendition (<source media="(min-width: 992px)">); the <img> fallback is
//    the 300x120 tablet one. Promote the desktop srcset onto the <img>.
function prepareSharedParsers(root) {
  root.querySelectorAll('div.quicklinks.section').forEach((el) => {
    el.setAttribute('data-iconnav-image-icons', '');
  });

  root.querySelectorAll('li.listWideImg picture').forEach((picture) => {
    const img = picture.querySelector('img');
    const desktop = picture.querySelector('source[media*="992"][srcset]');
    const src = desktop && desktop.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0];
    if (img && src) img.setAttribute('src', src);
  });
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    const root = contentRoot(element);
    removeMobileDuplicates(root);
    prepareSharedParsers(root);
    // Empty ZIP-gate placeholder (cleaned.html:2190)
    WebImporter.DOMUtils.remove(root, ['div.zipcodegate.section']);

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
