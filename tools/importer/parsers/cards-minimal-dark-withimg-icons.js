/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-minimal-dark-withimg-icons. Base: cards.
 * Source: https://www.highmark.com/plans/individual-families
 *   Instances: div.card-block.responsivegrid.section:has(.cardWrapper.ghostMode)
 *   (plans sections 3 "lost coverage", 6 "ACA basics", 8 "benefits").
 * Generated: 2026-09-29
 *
 * Block library structure (Cards, 2 columns, N rows):
 *   Row 1: block name
 *   Each card row: [ icon image | h3 + description + optional CTA link ]
 *
 * Source DOM (validated against migration-work/cleaned.html):
 *   .cardBlockContent
 *     .cardBlockTitleContainer > h2 + .cardDescription      -> default content BEFORE block
 *     .cardBlockRow > .cardWrapper.ghostMode > .card.cardBlock
 *        > img + .cardText > h3, hr.titleUnderline, p, div .hmk-brand-buttons a.textButton
 *     div > .hmk-brand-buttons.brand-center-content a       -> default content AFTER block
 *
 * Iteration is keyed on div.card.cardBlock (block-level div, iterationSafe).
 * ZIP-gated CTAs get href="/modals/zip-county" from highmark-plans-sections.js
 * (beforeTransform); those links are kept like any other.
 */
export default function parse(element, { document }) {
  const hasHref = (a) => {
    const href = (a.getAttribute('href') || '').trim();
    return !!href && href !== '#';
  };

  // Dead heading anchors (no href) would serialize as empty links — unwrap them.
  const unwrapDeadAnchors = (root) => {
    if (!root) return;
    root.querySelectorAll('a').forEach((a) => {
      if (!hasHref(a)) a.replaceWith(...a.childNodes);
    });
  };

  // --- Cards (collected first so the CTA/intro queries below can exclude them) ---
  let cards = Array.from(element.querySelectorAll('.cardWrapper > .card.cardBlock'));
  if (!cards.length) cards = Array.from(element.querySelectorAll('.card.cardBlock, .cardBlock'));

  // Empty-block guard
  if (!cards.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // --- Leading default content (intro heading + description) ---
  const introEls = [];
  const introContainer = element.querySelector('.cardBlockTitleContainer');
  if (introContainer) {
    const introHeading = introContainer.querySelector('h1, h2, h3');
    if (introHeading) {
      unwrapDeadAnchors(introHeading);
      introEls.push(introHeading);
    }
    const introDesc = introContainer.querySelector('.cardDescription');
    if (introDesc) {
      const descParas = Array.from(introDesc.querySelectorAll(':scope > p'));
      if (descParas.length) {
        introEls.push(...descParas);
      } else if (introDesc.textContent.trim()) {
        // Description is bare text inside the div — wrap it in a paragraph.
        const p = document.createElement('p');
        p.append(...introDesc.childNodes);
        introEls.push(p);
      }
    } else {
      const p = introContainer.querySelector('p');
      if (p) introEls.push(p);
    }
  }

  // --- Trailing default content (centered CTA outside the cards) ---
  const trailingEls = [];
  Array.from(element.querySelectorAll('.hmk-brand-buttons.brand-center-content a'))
    .filter((a) => !a.closest('.card, .cardBlock, .cardWrapper'))
    .forEach((a) => {
      const p = document.createElement('p');
      if (hasHref(a)) {
        p.append(a);
      } else {
        // No usable href (not ZIP-gated by the transformer) — keep the label as text.
        p.append(...a.childNodes);
      }
      trailingEls.push(p);
    });

  // --- Card rows ---
  const cells = [];
  cards.forEach((card) => {
    const image = card.querySelector('picture, img');
    const textRoot = card.querySelector('.cardText') || card;

    const heading = textRoot.querySelector('h1, h2, h3, h4, h5, h6');
    unwrapDeadAnchors(heading);

    // Description paragraphs (superscripts and inline links are kept inside the <p>).
    let paragraphs = Array.from(textRoot.querySelectorAll(':scope > p'));
    if (!paragraphs.length) {
      paragraphs = Array.from(textRoot.querySelectorAll('p'))
        .filter((p) => !p.closest('.hmk-brand-buttons'));
    }

    // CTA links (button-styled). Keep only anchors with an href — this includes the
    // ZIP-gated ones the sections transformer points at /modals/zip-county.
    const ctas = Array.from(textRoot.querySelectorAll('.hmk-brand-buttons a, a.textButton'))
      .filter((a, i, arr) => arr.indexOf(a) === i)
      .filter((a) => !paragraphs.some((p) => p.contains(a)));

    const contentCell = [];
    if (heading) contentCell.push(heading);
    contentCell.push(...paragraphs);
    ctas.forEach((a) => {
      const p = document.createElement('p');
      if (hasHref(a)) {
        p.append(a);
      } else {
        p.append(...a.childNodes);
      }
      contentCell.push(p);
    });

    // 2-column row: [ image | content ]
    cells.push([image || '', contentCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-minimal-dark-withimg-icons', cells });
  element.replaceWith(...introEls, block, ...trailingEls);
}
