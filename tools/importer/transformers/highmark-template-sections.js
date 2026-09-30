/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section boundaries + section metadata driven by the page template
 * (payload.template.sections), shared by the templates migrated from the main
 * navigation's Plans / Member pages: state-plans (plans/d-snp, plans/medicaid),
 * get-help, learn-about-medicare, blue-neighbors and find-care.
 *
 * Each section.selector is an array of candidate selectors tried in order; the
 * first match wins. Sections whose selectors match nothing are skipped (never
 * guessed). Same before/after hook + marker pattern as
 * highmark-chip-landing-sections.js: <hr> breaks go in beforeTransform (while every
 * section element still exists), Section Metadata in afterTransform, anchored to
 * the marker <hr> (or the surviving original element).
 *
 * Shared cleanup for these pages (beforeTransform, so parsers see the cleaned DOM):
 *  - heading links without an href (a.headNoLink) are unwrapped to plain text
 *  - hidden placeholder phone links (a[href="tel:"]) are removed
 *  - wide help cards (li.listWideImg): the desktop rendition
 *    (<source media="(min-width: 992px)">) is promoted onto the <img>
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

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

function sharedCleanup(root) {
  root.querySelectorAll('a.headNoLink:not([href]), a.headNoLink[href=""]').forEach((a) => {
    a.replaceWith(...a.childNodes);
  });
  root.querySelectorAll('a[href="tel:"]').forEach((a) => a.remove());
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
    sharedCleanup(element);

    // Reverse order so each pending section stays where querySelector found it.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break
      const sectionEl = querySection(element, section.selector);
      if (!sectionEl) continue;

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue;

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
