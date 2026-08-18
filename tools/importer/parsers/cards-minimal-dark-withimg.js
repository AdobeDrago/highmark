/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-minimal-dark-withimg. Base: cards.
 * Source: https://www.highmark.com/resources (div.card-block.responsivegrid.section)
 * Generated: 2026-08-17
 *
 * Block library structure (2 columns, N rows):
 *   Row 1: block name
 *   Each card row: [ image | heading + description + CTA link ]
 *
 * Source note: the matched section also contains a centered intro
 * (H2 "How can we help?" + description) that is default content, not part of
 * the cards block. It is preserved as default content emitted before the block.
 */
export default function parse(element, { document }) {
  // --- Leading default content (intro heading + description) ---
  const introEls = [];
  const introContainer = element.querySelector('.cardBlockTitleContainer');
  if (introContainer) {
    const introHeading = introContainer.querySelector('h1, h2, h3');
    const introDesc = introContainer.querySelector('.cardDescription, p');
    if (introHeading) introEls.push(introHeading);
    if (introDesc) introEls.push(introDesc);
  }

  // --- Cards ---
  const cards = Array.from(element.querySelectorAll('.card.cardBlock, .cardBlock, .card'));

  // Empty-block guard
  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // A card heading is sometimes wrapped in a non-navigating anchor
  // (source uses <a class="headNoLink"> with no href as a plain-text label).
  // EDS would serialize that as <a href=""> — a broken/empty link. Unwrap any
  // heading anchor that lacks a usable href so the heading stays plain text.
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
    const heading = card.querySelector('h1, h2, h3, h4, [class*="title"]');
    unwrapDeadHeadingLinks(heading);
    const paragraphs = Array.from(card.querySelectorAll('.cardText > p, p'));
    // Exclude anchors with no usable href (non-navigating heading labels).
    const links = Array.from(card.querySelectorAll('a.textButton, a.button, a[class*="button"], a'))
      .filter((a) => {
        const href = (a.getAttribute('href') || '').trim();
        return href && href !== '#';
      });

    const contentCell = [];
    if (heading) contentCell.push(heading);
    contentCell.push(...paragraphs);
    contentCell.push(...links);

    // 2-column row: [ image | content ]
    cells.push([image || '', contentCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-minimal-dark-withimg', cells });
  element.replaceWith(...introEls, block);
}
