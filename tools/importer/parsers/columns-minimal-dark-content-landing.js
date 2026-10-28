/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-minimal-dark (content-landing template). Base: columns.
 * Source: https://www.highmark.com/podcast (also https://www.highmark.com/public-policy)
 * Generated: 2026-10-05
 *
 * Emits the existing `columns-minimal-dark` block; registered by the content-landing
 * import script as parsers['columns-minimal-dark'] (the shared columns-minimal-dark.js
 * parser expects .text-area/.image-area markup that these pages do not have).
 *
 * Block library structure (Columns convention: 2 columns, 1 content row):
 *   Row 1: block name
 *   Row 2: [ image | content ]
 *
 * Instances (page-templates.json, content-landing):
 *   1. div.d-none.d-lg-block.col-lg-3 aside:has(img.image-comp-img)
 *      Left-rail cover image. The H1 + intro copy live in the sibling content column
 *      (div.row > div.col-lg-9 div.page__par): the cmp-text holding the first h1 and
 *      its following cmp-text siblings, up to the first cmp-text whose first heading is
 *      h2-h6 ("Episodes") or a non-cmp-text component. Those nodes are MOVED into the
 *      content cell so they are not duplicated in default content.
 *      (Spacers/<hr> were already removed by highmark-content-landing-cleanup.js.)
 *   2. div.gridcontrol:has(.hmk-home_cardwrapper)
 *      "Meet our host" card: [ headshot | name, title, Read Bio link, quote ].
 */

const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

function hasContent(nodes) {
  return nodes.some((n) => clean(n.textContent) !== '' || (n.querySelector && n.querySelector('img, picture')));
}

/** Instance 1: aside with cover image + H1/intro from the sibling content column. */
function parseRailImage(element, document) {
  const image = element.querySelector('img.image-comp-img') || element.querySelector('picture, img');

  const contentCell = [];
  const row = element.closest('div.row');
  const par = row ? row.querySelector('div.page__par') : null;
  const h1 = par ? par.querySelector('.cmp-text h1') : null;
  const startCmp = h1 ? h1.closest('.cmp-text') : null;

  if (startCmp) {
    const parts = [startCmp];
    let next = startCmp.nextElementSibling;
    while (next) {
      if (!next.classList.contains('cmp-text')) {
        // skip stray non-component nodes (link/script) left between components
        if (['LINK', 'SCRIPT', 'STYLE', 'META'].includes(next.tagName)) {
          next = next.nextElementSibling;
          continue;
        }
        break;
      }
      const firstHeading = next.querySelector('h1, h2, h3, h4, h5, h6');
      if (firstHeading && firstHeading.tagName !== 'H1') break;
      parts.push(next);
      next = next.nextElementSibling;
    }
    parts.forEach((cmp) => {
      cmp.querySelectorAll('link, script, style').forEach((n) => n.remove());
      // move the component's content nodes; the emptied wrapper is removed
      contentCell.push(...Array.from(cmp.children));
      cmp.remove();
    });
  }

  if (!image && !hasContent(contentCell)) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[image ? [image] : [''], contentCell.length ? contentCell : ['']]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-minimal-dark', cells });
  element.replaceWith(block);
}

/** Instance 2: gridcontrol host card + sibling quote. */
function parseHostCard(element, document) {
  const image = element.querySelector('img.card-wrapper-img') || element.querySelector('picture, img');

  const contentCell = [];
  const nameEl = element.querySelector('p.hmk-homecardheadertext');
  if (nameEl && clean(nameEl.textContent)) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = clean(nameEl.textContent);
    p.append(strong);
    contentCell.push(p);
  }
  const descEl = element.querySelector('p.hmk-homecarddesc');
  if (descEl && clean(descEl.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(descEl.textContent);
    contentCell.push(p);
  }
  const cta = element.querySelector('a.textButton[href]');
  if (cta && clean(cta.textContent)) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = cta.getAttribute('href');
    a.textContent = clean(cta.textContent);
    p.append(a);
    contentCell.push(p);
  }
  // quote: sibling .cmp-text inside the same gridcontrol (outside the card wrapper)
  const quoteCmp = Array.from(element.querySelectorAll('.cmp-text'))
    .find((c) => !c.closest('.hmk-home_cardwrapper'));
  if (quoteCmp) {
    Array.from(quoteCmp.querySelectorAll('p'))
      .filter((p) => clean(p.textContent))
      .forEach((p) => contentCell.push(p));
  }

  if (!image && !hasContent(contentCell)) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // the source headshot has no alt text: use the host's name
  if (image && !(image.getAttribute('alt') || '').trim() && nameEl && clean(nameEl.textContent)) {
    image.setAttribute('alt', clean(nameEl.textContent));
  }

  const cells = [[image ? [image] : [''], contentCell.length ? contentCell : ['']]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-minimal-dark', cells });
  element.replaceWith(block);
}

export default function parse(element, { document }) {
  if (element.matches('aside') || element.querySelector('img.image-comp-img')) {
    parseRailImage(element, document);
  } else {
    parseHostCard(element, document);
  }
}
