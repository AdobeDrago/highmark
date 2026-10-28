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

/*
 * /because-life/south-park-activities: small-image activity cards
 *   div.newcardscomponent-variations > .cards-variation > .container-sm-img
 *     > ul.cardul.gridcardsul > li.cardThree.listSmlImg
 *       > img.smallImage + div.typeThreeTxt > h3.titleHead, hr.breakLineNone,
 *         span.cardsText (ul of activities + address <p>), .hmk-brand-buttons a.textButton
 * The shared parser keeps only a card's <p>s, so the activity lists would be lost.
 * Rows: [ image | title + list + address + DIRECTIONS link ]. The `small-image`
 * variant carries the source's 3-up 370px grid (styles/templates/campaign-landing.css).
 * The other campaign-landing pages have no li.cardThree, so their output is unchanged.
 */
function parseSmallImageCards(element, document) {
  const items = [...element.querySelectorAll('li.cardThree.listSmlImg')];
  if (!items.length) return false;
  const cells = items.map((li) => {
    const img = li.querySelector('img');
    const text = [];
    const title = li.querySelector('h1, h2, h3, h4');
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title.textContent.replace(/\s+/g, ' ').trim();
      text.push(h3);
    }
    const body = li.querySelector('.cardsText');
    if (body) text.push(...[...body.children].filter((el) => /^(UL|OL|P)$/.test(el.tagName)));
    li.querySelectorAll('.hmk-brand-buttons a[href]').forEach((a) => {
      const label = a.textContent.replace(/\s+/g, ' ').trim();
      if (!label) return;
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href'));
      link.textContent = label;
      p.append(link);
      text.push(p);
    });
    return [img || '', text];
  });
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'cards-minimal-dark-withimg (small-image)', cells }));
  return true;
}

export default function parse(element, { document, url, params }) {
  if (parseSmallImageCards(element, document)) return;
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
