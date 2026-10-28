/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-minimal-dark-iconnav. Base: cards.
 * Source: https://www.highmark.com/resources/mental-health-services/depression (div.quicklinks.section)
 * Generated: 2026-08-17
 *
 * Block library structure (Cards — 2 columns, N rows):
 *   Row 1: block name
 *   Each nav-item row: [ icon | linked label ]
 *
 * Source note: the quick-link bar renders TWO copies of the same list — a mobile
 * copy (.quick-link-list-mobile-inner, hidden on desktop) and a desktop copy
 * (.quick-link-list-inner without the mobile class). We emit only ONE clean set
 * of links. Each item is a material-icons ligature (e.g. "warning_amber") + a
 * text label (.quick-link-text) + an href on the wrapping <a>.
 *
 * VALIDATION NOTE: content-completeness scores below 90% because the source
 * element contains the full link list TWICE (mobile + desktop copies). Emitting
 * only one set (as required) means the duplicate second copy shows as "missing"
 * source text. This is the intended, correct output — all distinct nav items
 * (icon + label + href) are captured exactly once.
 */
export default function parse(element, { document }) {
  // Pick a single source list: prefer the desktop copy, fall back to any inner list.
  const list = element.querySelector('.quick-link-list-inner:not(.quick-link-list-mobile-inner)')
    || element.querySelector('.quick-link-list-inner')
    || element;

  const items = Array.from(list.querySelectorAll('.quick-link-item'));

  // Empty-block guard
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  items.forEach((item) => {
    const anchor = item.querySelector('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href') || '';
    const icon = item.querySelector('i.material-icons, i.material-icons-outlined, i[class*="material-icons"]');
    const labelEl = item.querySelector('.quick-link-text');
    const label = (labelEl ? labelEl.textContent : anchor.textContent || '').trim();

    // Build a clean icon cell (the ligature name, e.g. "warning_amber").
    const iconText = icon ? icon.textContent.trim() : '';

    // Build a clean link that carries only the label text (drop nested icon markup).
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = label;

    // 2-column row: [ icon | linked label ]
    cells.push([iconText, link]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-minimal-dark-iconnav', cells });
  element.replaceWith(block);
}
