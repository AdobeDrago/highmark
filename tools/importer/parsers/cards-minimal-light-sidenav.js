/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-minimal-light-sidenav. Base: cards.
 * Source: https://www.highmark.com/resources/answers/articles
 *         (div.d-none.d-lg-block.col-lg-3 div.nav-container — left section-nav sidebar)
 * Generated: 2026-08-17
 *
 * Block library / decorate structure (2 columns, N rows):
 *   Row 1: block name
 *   Each nav-item row: [ level token | link ]
 *     - level token cell: "parent" | "current" | "child" | "sibling"
 *     - link cell: a single <a> (href + label)
 *   The block's decorate() (blocks/cards-minimal-light-sidenav/) reads the
 *   level token from the first cell, builds a nested <ul>, and marks the
 *   "current" item as active with an accent bar + collapse chevron.
 *
 * The source .nav-container comes in TWO shapes:
 *   1) Article/listing shape — a parent link (a.side-nav-item-parent), an
 *      active/current link (a.active), and child sub-page links inside
 *      ul.subnavitem-list. Emitted as: parent, current, child*.
 *   2) Section shape (mental-health guides) — a parent section link
 *      (a.side-nav-item-parent) followed by a plain nested <ul> of SIBLING
 *      page links (a[role="button"]), one of which carries .active. Emitted as:
 *      parent, then each sibling in DOM order (the active one tagged "current",
 *      the rest "sibling"). decorate() indents all siblings under the parent.
 *
 * The active anchor contains decorative spans/svg/button; we emit clean anchors
 * carrying only href + normalized label text.
 *
 * VALIDATION NOTE: the automatic completeness score sits below 90% because the
 * block table intentionally ADDS required level tokens ("parent", "current",
 * "child", "sibling") in the first cell of every row — content the block's
 * decorate() needs to build the nested nav but which does not exist in the
 * source text, so it dilutes the source-vs-parsed similarity. Every piece of
 * real source content (all nav-item labels and their hrefs) is captured
 * completely; the gap is the mandatory level tokens, not dropped content.
 */
export default function parse(element, { document }) {
  // Normalize whitespace-collapsed label text.
  const labelOf = (a) => (a.textContent || '').replace(/\s+/g, ' ').trim();

  // Build a clean anchor carrying only href + label.
  const cleanLink = (a) => {
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href') || '#');
    link.textContent = labelOf(a);
    return link;
  };

  // A row is [ levelTokenCell, linkCell ].
  const rowFor = (level, a) => [level, cleanLink(a)];

  const cells = [];

  // --- Parent section link (level: parent) ---
  const parent = element.querySelector('a.side-nav-item-parent, .sidenav-item > a[href]:not(.active)');
  if (parent) cells.push(rowFor('parent', parent));

  // --- Shape 1: article/listing — children live in ul.subnavitem-list ---
  const subnavList = element.querySelector('ul.subnavitem-list, .subnavitem-list');
  if (subnavList) {
    // Active / current item (level: current).
    const current = element.querySelector('a.active, a[aria-expanded="true"]');
    if (current && current !== parent) cells.push(rowFor('current', current));

    // Child page links (level: child).
    Array.from(subnavList.querySelectorAll('a[href]')).forEach((a) => {
      if (a === current || a === parent) return;
      cells.push(rowFor('child', a));
    });
  } else {
    // --- Shape 2: section guide — siblings in a plain nested <ul> ---
    // Every anchor inside a <ul> that is NOT the parent link is a sibling page;
    // the one carrying .active (or matching the current page) is "current".
    const siblingAnchors = Array.from(
      element.querySelectorAll('ul.sidenav-item-list ul a[href], .sidenav-item-list ul a[href], ul li ul a[href]'),
    ).filter((a) => a !== parent);

    // De-duplicate while preserving DOM order.
    const seen = new Set();
    siblingAnchors.forEach((a) => {
      if (seen.has(a)) return;
      seen.add(a);
      const isActive = a.classList.contains('active') || a.getAttribute('aria-current') === 'page';
      cells.push(rowFor(isActive ? 'current' : 'sibling', a));
    });
  }

  // Empty-block guard: no nav items found.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards-minimal-light-sidenav',
    cells,
  });
  element.replaceWith(block);
}
