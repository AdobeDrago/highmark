/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-minimal-dark-withimg-2. Base: cards.
 * Source: https://www.highmark.com/resources
 *   (div.newcardscomponent-variations.section:nth-of-type(5))
 * Generated: 2026-08-17
 *
 * Block library structure (2 columns, N rows):
 *   Row 1: block name
 *   Each card row: [ image | heading + description + CTA link ]
 *
 * Source note: each card is an <li.listWideImg>. The card title is wrapped in
 * an <a class="headNoLink"> WITHOUT an href (plain text), so CTA selection is
 * scoped to real buttons (a.textButton / a[href]) to avoid selecting the title
 * anchor as a link.
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('li.listWideImg, .listWideImg, .cardul > li'));

  // Empty-block guard
  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // The card title is wrapped in <a class="headNoLink"> WITHOUT an href — a
  // plain-text label. Left intact, EDS serializes it as <a href=""> (a broken
  // empty link). Unwrap any heading anchor lacking a usable href.
  const unwrapDeadHeadingLinks = (heading) => {
    if (!heading) return;
    heading.querySelectorAll('a').forEach((a) => {
      const href = (a.getAttribute('href') || '').trim();
      if (!href || href === '#') {
        a.replaceWith(...a.childNodes);
      }
    });
  };

  const cells = [];
  cards.forEach((card) => {
    const image = card.querySelector('picture, img');
    const heading = card.querySelector('h1, h2, h3, h4, [class*="titleHead"]');
    unwrapDeadHeadingLinks(heading);
    const paragraphs = Array.from(card.querySelectorAll('.wideCardText p, .type2Txt p, p'));
    // CTA: real button links only (title anchor has no href)
    const links = Array.from(card.querySelectorAll('a.textButton, a.button, a[class*="button"], a[href]'));

    const contentCell = [];
    if (heading) contentCell.push(heading);
    contentCell.push(...paragraphs);
    contentCell.push(...links);

    // 2-column row: [ image | content ]
    cells.push([image || '', contentCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-minimal-dark-withimg-2', cells });
  element.replaceWith(block);
}
