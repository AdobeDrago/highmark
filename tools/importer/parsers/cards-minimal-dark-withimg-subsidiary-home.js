/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-minimal-dark-withimg on the subsidiary-home template
 * (/wholecare, /health-options-de). Base: cards.
 *
 * Block library structure (2 columns, N rows):
 *   Row 1: block name, plus variants in parenthesis (see below)
 *   Each card row: [ image | heading + description + CTA link ]
 *
 * Both pages' plan cards draw a short rule under each card title (51x4px,
 * #0078c1, 1px top border): /wholecare's small-image cards (li.cardThree,
 * <hr class="breakLine">) and /health-options-de's wide cards (.cardBlock,
 * <hr class="titleUnderline">). The rules are styling, so they become variants
 * (styles/templates/subsidiary-home.css) rather than content:
 *   - `underline`: the title rule (both pages)
 *   - `compact`: the small-image card list, whose intro is a 60%-wide column and
 *     whose rule sits 13px below the title (/wholecare)
 * The <hr>s no longer exist when the parsers run, so the card type is the signal.
 * The intro default content and the card rows are the shared parser's
 * (./cards-minimal-dark-withimg.js) output, unchanged.
 */
import parseCards from './cards-minimal-dark-withimg.js';

function variantsFor(element) {
  if (element.querySelector('li.cardThree .typeThreeTxt, hr.breakLine')) return 'underline, compact';
  if (element.querySelector('.cardBlock, hr.titleUnderline')) return 'underline';
  return '';
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

  // Card rows: [ image | heading + description + CTA ] (skip Row 1, the block name)
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
