/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-minimal-dark-withimg on the campaign-landing template
 * (/because-life, /health-options-wv, /ventures). Base: cards.
 *
 * Block library structure (Cards: 2 columns, N rows):
 *   Row 1: block name, plus optional variants in parenthesis (see below)
 *   Each card row: [ image (mandatory) | title heading + description + CTA link ]
 *
 * /health-options-wv's plan cards (.cardBlockRowWide > .wideCardWrapper > .cardBlock)
 * draw a short rule under each card title (<hr class="titleUnderline">: 51x4px,
 * #0078c1, 1px top border, 2px radius, 10px below the title) and centre their CTA
 * below 992px (.hmk-brand-buttons.mobile-brand-center-content); /because-life's
 * photo cards (.cardBlockRow, no rule, .mobile-brand-right-content) do neither.
 * Both are styling, so they become variants (styles/templates/campaign-landing.css)
 * rather than content:
 *   - `underline`: the title rule
 *   - `mobile-center`: CTA centred below 992px (right-aligned from 992px)
 * The <hr>s no longer exist when the parsers run, so the wide card row is the
 * signal for the rule. The intro default content and the card rows are the shared
 * parser's (./cards-minimal-dark-withimg.js) output, unchanged.
 */
import parseCards from './cards-minimal-dark-withimg.js';

function variantsFor(element) {
  const variants = [];
  if (element.querySelector('.cardBlock hr.titleUnderline, .cardBlockRowWide .cardBlock')) variants.push('underline');
  if (element.querySelector('.cardBlock .hmk-brand-buttons.mobile-brand-center-content')) variants.push('mobile-center');
  return variants.join(', ');
}

export default function parse(element, { document, url, params }) {
  const variants = variantsFor(element);
  if (!variants) {
    parseCards(element, { document, url, params });
    return;
  }

  // Run the shared parser on a detached copy: it yields the intro default content
  // followed by the block table.
  const scratch = document.createElement('div');
  scratch.append(element.cloneNode(true));
  parseCards(scratch.firstElementChild, { document, url, params });
  const table = scratch.querySelector('table');
  if (!table) {
    parseCards(element, { document, url, params });
    return;
  }
  const intro = [...scratch.childNodes].filter((n) => n !== table && !(n.nodeType === 1 && n.contains(table)));

  // Card rows: [ image | title + description + CTA ] (skip Row 1, the block name)
  const cells = [...table.querySelectorAll('tr')].slice(1).map((tr) => {
    const [imageCell, textCell] = tr.querySelectorAll('td');
    return [
      imageCell ? [...imageCell.childNodes] : '',
      textCell ? [...textCell.childNodes] : '',
    ];
  });

  element.replaceWith(
    ...intro,
    WebImporter.Blocks.createBlock(document, { name: `cards-minimal-dark-withimg (${variants})`, cells }),
  );
}
