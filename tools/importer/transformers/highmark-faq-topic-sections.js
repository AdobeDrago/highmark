/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: section boundaries + section metadata for the FAQ topic pages
 * (/resources/answers/faq/*, template `faq`).
 *
 * Source layout: a left section nav (div.col-lg-3 div.nav-container, every FAQ
 * topic), then the content column: an H1 + intro, one or more FAQ groups
 * (div.accordianTable: an H2, the questions, and usually a "Back to Top" link),
 * sometimes closing default content. Some pages add a right-rail callout box
 * (.rightrail-container, "Contact Us") and a blush CTA band below the content.
 *
 * Sections produced, in order:
 *   1. the left nav (cards-minimal-light-sidenav)
 *   2. the right-rail callout, when present (Style: right-rail), moved ahead of
 *      the content so it can float beside it, as on the source
 *   3. the H1 + intro
 *   4. one section per FAQ group, its "Back to Top" link kept as a paragraph
 *      after the accordion (link to #top: the top of the page)
 *   5. the CTA band, when present (Style: highlight)
 *
 * Selectors that don't match on a page are skipped — never guessed. Breaks are
 * inserted in beforeTransform; Section Metadata is anchored in afterTransform to
 * the surviving marker <hr>.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';
const NAV = 'div.col-lg-3 div.nav-container:has(.sidenav, .sidenav-item-list)';
const RAIL = '.rightrail-container';
const GROUP = 'div.accordianTable';
const CTA = 'div.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive';

const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

function marker(document, id) {
  const hr = document.createElement('hr');
  if (id) hr.setAttribute(SECTION_MARKER_ATTR, id);
  return hr;
}

/** The right-rail callout as plain heading / text / link. */
function railContent(document, rail) {
  const els = [];
  const title = rail.querySelector('.rightrail-title h3, h3');
  if (title) {
    const h3 = document.createElement('h3');
    h3.textContent = clean(title.textContent);
    els.push(h3);
  }
  const desc = rail.querySelector('.rightrail-description');
  if (desc) {
    const p = document.createElement('p');
    p.innerHTML = desc.innerHTML.trim();
    els.push(p);
  }
  rail.querySelectorAll('.hmk-brand-buttons a[href]').forEach((a) => {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = clean(a.textContent);
    p.append(link);
    els.push(p);
  });
  return els;
}

const isBackToTop = (a) => /^back to top$/i.test(clean(a.textContent));

/**
 * The group's heading when it sits outside the group, just before it (the
 * Medicare page: each H2 is its own text component above the accordion): the
 * last H2 between the previous group (or the H1) and this one.
 */
function headingBefore(group, h1) {
  if (group.querySelector('h2')) return null;
  let prev = null;
  const walker = group.ownerDocument.createTreeWalker(group.ownerDocument.body, 1);
  for (let node = walker.nextNode(); node && node !== group; node = walker.nextNode()) {
    if (node.matches(GROUP) || node === h1) prev = null;
    else if (node.tagName === 'H2' && !node.closest(GROUP)) prev = node;
  }
  return prev;
}

/**
 * A source comparison table (div.comparisontable: header cells in <thead>,
 * text wrapped in several divs, a mobile "scroll to view all columns" hint)
 * as a plain text table that the table-minimal-dark-compare parser reads.
 */
function plainTable(document, source) {
  const table = document.createElement('table');
  const body = document.createElement('tbody');
  source.querySelectorAll('tr').forEach((tr) => {
    const row = document.createElement('tr');
    tr.querySelectorAll(':scope > th, :scope > td').forEach((cell) => {
      cell.querySelectorAll('.swipemessage').forEach((el) => el.remove());
      const td = document.createElement('td');
      td.textContent = clean(cell.textContent);
      row.append(td);
    });
    body.append(row);
  });
  table.append(body);
  const wrapper = document.createElement('div');
  wrapper.className = 'faq-compare-table';
  wrapper.append(table);
  return wrapper;
}

export default function transform(hookName, element, payload) {
  const { document } = payload;

  if (hookName === 'beforeTransform') {
    // the source's script adds a screen-reader hint to new-tab links
    // (<em>opens a new tab or window</em>); it would import as visible text
    element.querySelectorAll('a *').forEach((el) => {
      if (/^opens a new tab or window$/i.test(clean(el.textContent))) el.remove();
    });

    const nav = element.querySelector(NAV);
    const h1 = element.querySelector('h1');

    // 1. left nav
    if (nav) nav.before(marker(document));

    // 3. H1 + intro (and 2. the right rail, moved ahead of it)
    if (h1) {
      const rail = element.querySelector(RAIL);
      if (rail) {
        const content = railContent(document, rail);
        rail.closest('.col-lg-3')?.remove();
        rail.remove();
        if (content.length) h1.before(marker(document, 'right-rail'), ...content);
      }
      h1.before(marker(document));
    }

    // comparison tables (High Blood Pressure) as plain tables for the parser
    element.querySelectorAll('div.comparisontable:has(table)').forEach((source) => {
      source.replaceWith(plainTable(document, source.querySelector('table')));
    });

    // 4. FAQ groups (with their heading when it sits just above), each with its
    // Back to Top link after the accordion
    element.querySelectorAll(GROUP).forEach((group) => {
      (headingBefore(group, h1) || group).before(marker(document));
      const back = [...group.querySelectorAll('a')].find(isBackToTop);
      if (!back) return;
      (back.closest('.hmk-brand-buttons') || back).remove();
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = '#top';
      link.textContent = 'Back to Top';
      p.append(link);
      group.after(p);
    });

    // 5. CTA band
    element.querySelectorAll(CTA).forEach((cta) => cta.before(marker(document, 'highlight')));
  }

  if (hookName === 'afterTransform') {
    element.querySelectorAll(`[${SECTION_MARKER_ATTR}]`).forEach((hr) => {
      const style = hr.getAttribute(SECTION_MARKER_ATTR);
      hr.removeAttribute(SECTION_MARKER_ATTR);
      hr.after(WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style },
      }));
    });
  }
}
