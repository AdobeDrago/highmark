/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-minimal-dark-withimg. Base: hero.
 * Source: https://www.highmark.com/resources (div.hero.responsivegrid.section)
 * Generated: 2026-08-17
 *
 * Block library structure (1 column, 3 rows):
 *   Row 1: block name
 *   Row 2: Background image (optional)
 *   Row 3: Title (heading) + Subheading + optional CTA
 *
 * Source note: the hero renders duplicate desktop (.d-lg-block) and mobile
 * (.d-lg-none) content wrappers with the same heading/subheading. We select a
 * single content wrapper (desktop preferred) to avoid duplicated text.
 */
export default function parse(element, { document }) {
  // --- Background image (Row 2, optional) ---
  const bgImage = element.querySelector('picture img, img[class*="image"], img');

  // --- Content: prefer the desktop wrapper, fall back to any content wrapper ---
  const contentWrapper = element.querySelector('.left-content.d-lg-block .content-wrapper')
    || element.querySelector('.left-content .content-wrapper')
    || element.querySelector('.content-wrapper')
    || element;

  const heading = contentWrapper.querySelector('h1, h2, .banner-heading, [class*="banner-heading"]');
  const subheading = contentWrapper.querySelector('h2.banner-sub-heading-sub, h3.banner-sub-heading-sub, .banner-sub-heading-sub, [class*="sub-heading"]');
  const ctaLinks = Array.from(contentWrapper.querySelectorAll('a.button, a.cta, a[class*="cta"], a[class*="button"]'));

  // Empty-block guard
  if (!heading && !subheading && !bgImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image
  if (bgImage) {
    cells.push([bgImage]);
  }

  // Row 3: single cell holding title + subheading + CTA(s)
  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (subheading) contentCell.push(subheading);
  contentCell.push(...ctaLinks);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-minimal-dark-withimg', cells });
  element.replaceWith(block);
}
