/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section boundaries + section metadata driven by the page template
 * (payload.template.sections), shared by the templates migrated from the main
 * navigation's Plans / Member pages: state-plans (plans/d-snp, plans/medicaid),
 * get-help, learn-about-medicare, blue-neighbors and find-care.
 *
 * Each section.selector is an array of candidate selectors tried in order; the
 * first match wins. With `repeat: true` every element matched by any of the
 * selectors becomes its own section (employer sub-pages repeat 1-4 side panels,
 * each styled from its own band). Sections whose selectors match nothing are
 * skipped (never guessed). A break with no content before it (the page opens
 * with that section) is dropped, so no empty first section is created. Same before/after hook + marker pattern as
 * highmark-chip-landing-sections.js: <hr> breaks go in beforeTransform (while every
 * section element still exists), Section Metadata in afterTransform, anchored to
 * the marker <hr> (or the surviving original element).
 *
 * Shared cleanup for these pages (beforeTransform, so parsers see the cleaned DOM):
 *  - heading links without an href (a.headNoLink) are unwrapped to plain text
 *  - hidden placeholder phone links (a[href="tel:"]) and label-less a.textButton
 *    CTAs are removed
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

function queryAll(root, selectors) {
  const found = [];
  (Array.isArray(selectors) ? selectors : [selectors]).forEach((sel) => {
    if (!sel) return;
    try {
      root.querySelectorAll(sel).forEach((el) => { if (!found.includes(el)) found.push(el); });
    } catch (e) {
      // invalid selector: skip
    }
  });
  return found;
}

// true when any text or image precedes `node` inside `root` (document order)
function hasContentBefore(node, root) {
  const range = root.ownerDocument.createRange();
  range.setStart(root, 0);
  range.setEndBefore(node);
  const frag = range.cloneContents();
  return !!(frag.textContent.trim() || frag.querySelector('img, picture'));
}

function sharedCleanup(root) {
  root.querySelectorAll('a.headNoLink:not([href]), a.headNoLink[href=""]').forEach((a) => {
    a.replaceWith(...a.childNodes);
  });
  root.querySelectorAll('a[href="tel:"]').forEach((a) => a.remove());
  // hidden placeholder CTAs with no label (bright-blue-futures panels end with an
  // empty a.textButton) would become empty links
  root.querySelectorAll('a.textButton').forEach((a) => {
    if (!a.textContent.trim() && !a.querySelector('img, picture')) a.remove();
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
    sharedCleanup(element);

    // Reverse order so each pending section stays where querySelector found it.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const targets = section.repeat
        ? queryAll(element, section.selector)
        : [querySection(element, section.selector)].filter(Boolean);
      targets.reverse().forEach((sectionEl) => {
        const hr = document.createElement('hr');
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      });
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      let anchors = [...element.querySelectorAll(`[${SECTION_MARKER_ATTR}="${section.id}"]`)];
      if (!anchors.length) {
        const el = querySection(element, section.selector);
        anchors = el ? [el] : [];
      }
      anchors.forEach((anchor) => {
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        anchor.after(metadataBlock);
        if (anchor.tagName === 'HR') anchor.removeAttribute(SECTION_MARKER_ATTR);
      });
    }

    // Breaks with nothing before them (the page opens with that section; site chrome
    // was removed by highmark-cleanup.js) would create an empty first section.
    let first = element.querySelector('hr');
    while (first && !hasContentBefore(first, element)) {
      first.remove();
      first = element.querySelector('hr');
    }
  }
}
