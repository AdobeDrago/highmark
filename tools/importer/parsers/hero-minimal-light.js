/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-minimal-light. Base: hero.
 * Source: https://www.highmark.com/resources/answers (section.new-hmk-brand-fifteenpercent-splash)
 * Generated: 2026-08-17
 *
 * Block library structure (1 column, up to 3 rows):
 *   Row 1: block name
 *   Row 2: Background Image (optional) — omitted here (this hero has no image)
 *   Row 3: Title (heading) + Subheading + optional CTA — here: title + intro paragraph
 *
 * Source note: the simplest hero — a light-tinted band with a centered H1
 * ("Highmark Answers") and a centered intro paragraph. No background image and
 * no CTA buttons. Content lives in sibling .cmp-text grid columns rather than a
 * single content wrapper, so we query the whole element for the heading and
 * paragraph.
 */
export default function parse(element, { document }) {
  // --- Background image (Row 2, optional) — none in this variant, but kept for resilience ---
  const bgImage = element.querySelector('picture img, img[class*="image"]');

  // --- Content: heading + intro paragraph (Row 3) ---
  const heading = element.querySelector('h1, h2, .banner-heading, [class*="banner-heading"]');
  const paragraph = element.querySelector('p');

  // Empty-block guard
  if (!heading && !paragraph && !bgImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (only if present)
  if (bgImage) {
    cells.push([bgImage]);
  }

  // Row 3: single cell holding title + intro paragraph
  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (paragraph) contentCell.push(paragraph);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-minimal-light', cells });
  element.replaceWith(block);
}
