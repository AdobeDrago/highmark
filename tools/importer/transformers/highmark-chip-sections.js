/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section boundaries + section metadata + page-specific cleanup
 * for the "chip" template (/western-pennsylvania/chip/*).
 *
 * Sections come from payload.template.sections (page-templates.json "chip",
 * 4 sections: sidenav, main-content, right-rail-callout, cta-band). Each
 * section.selector is an array of DOM-verified candidates tried in order; the
 * first match wins. Sections whose selectors do not match on a page (e.g. the
 * cta-band, which only exists on doctors-drugs) are skipped.
 *
 * Follows the reference before/after hook + marker pattern: breaks are inserted
 * in beforeTransform (while every section element still exists, before block
 * parsers replace them); Section Metadata is inserted in afterTransform anchored
 * to the marker <hr> (or the surviving original element).
 *
 * CHIP-only cleanup (beforeTransform, so parsers see the cleaned DOM). Line
 * refs: E = migration-work/cleaned.html (eligibility), D =
 * migration-work/gaps/doctors-drugs/cleaned.html.
 *  - Mobile duplicate pricing tables: each dynamictable renders a mobile
 *    `.dynamic-table-container > table.d-table.d-md-none#mobile-dynamic-table`
 *    (E:1992, E:2214) next to a desktop
 *    `.dynamic-table-container > table.d-none.d-md-table#dynamic-table`
 *    (E:2083, E:2359). Mobile containers are removed; a container is never
 *    removed if it also holds a d-md-table.
 *  - Mobile duplicate CTA-band copy: the onecard1colpanel band repeats h2 and
 *    body-text as `.d-block.d-lg-none` (D:2171, D:2177) next to the desktop
 *    `.d-none.d-lg-block` copy (D:2168, D:2174). Mobile copies are removed.
 *  - Right-rail callout (`div.rightRail .rightrail-container`, E:2542) sits in a
 *    `d-none d-lg-block col-lg-3` column; it is kept as default content in its
 *    own section. Its decorative `hr.breakLine` (E:2544) is removed so it does
 *    not become a stray section break, and relative CTA hrefs (e.g.
 *    href="apply-for-chip", E:2551) are resolved against the source URL.
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

function removeMobileTables(root) {
  root.querySelectorAll('.dynamic-table-container').forEach((container) => {
    const tables = [...container.children].filter((c) => c.tagName === 'TABLE');
    const hasMobile = tables.some((t) => t.classList.contains('d-md-none'));
    const hasDesktop = container.querySelector('table.d-md-table');
    if (hasMobile && !hasDesktop) container.remove();
  });
}

function removeMobileCopies(root) {
  WebImporter.DOMUtils.remove(root, [
    // onecard1colpanel CTA band: mobile h2 + body-text (D:2171, D:2177)
    '.onecard1colpanel .one-card-content-center-container > .d-block.d-lg-none',
  ]);
}

function resolveHref(href, baseUrl) {
  if (!href || !baseUrl) return href;
  if (/^(\/|#|[a-z][a-z0-9+.-]*:)/i.test(href)) return href; // already root-relative/absolute
  try {
    return new URL(href, baseUrl).pathname;
  } catch (e) {
    return href;
  }
}

function cleanRightRail(root, baseUrl) {
  root.querySelectorAll('div.rightRail .rightrail-container').forEach((rail) => {
    rail.querySelectorAll('hr.breakLine').forEach((hr) => hr.remove());
    rail.querySelectorAll('a[href]').forEach((a) => {
      a.setAttribute('href', resolveHref(a.getAttribute('href'), baseUrl));
    });
  });
}

// Font Awesome external-link icons inside content links (e.g. chip-resources
// "LEARN MORE", doctors-drugs findcare "GET STARTED") -> EDS icon token
// ` :external-link:` (rendered from /icons/external-link.svg). Scoped to the
// main article and the right rail; header/footer are removed by cleanup.
const CONTENT_SCOPES = [
  'div.col-lg-9 > div.row > div.col-lg-9 div.page__par',
  'div.rightRail .rightrail-container',
];
const EXTERNAL_ICON_SELECTOR = 'a i.fa-external-link-alt, a i.fa-external-link';

function replaceExternalLinkIcons(root) {
  const icons = new Set();
  CONTENT_SCOPES.forEach((scope) => {
    root.querySelectorAll(scope).forEach((container) => {
      container.querySelectorAll(EXTERNAL_ICON_SELECTOR).forEach((i) => icons.add(i));
    });
  });
  icons.forEach((i) => {
    i.replaceWith(document.createTextNode(' :external-link:'));
  });
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];

  // 'preprocess' runs before helix-importer's own preProcess(), which drops
  // empty inline elements such as <i class="fa ..."></i> — so the icon swap
  // must happen here, not in beforeTransform (by then the <i> is gone).
  if (hookName === 'preprocess') {
    replaceExternalLinkIcons(element);
  }

  if (hookName === 'beforeTransform') {
    const baseUrl = (payload && payload.params && payload.params.originalURL)
      || (payload && payload.url) || null;
    removeMobileTables(element);
    removeMobileCopies(element);
    cleanRightRail(element, baseUrl);

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
