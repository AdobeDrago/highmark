/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-minimal-dark-withimg on the subsidiary-home template
 * (/wholecare, /health-options-de). Base: hero.
 *
 * Block library structure (1 column, 3 rows):
 *   Row 1: block name
 *   Row 2: Background image - here the source's three art-directed renditions,
 *          in order desktop, tablet, mobile
 *   Row 3: Title (heading) + Subheading + optional CTA
 *
 * The source hero <picture> has three crops:
 *   <source media="(min-width: 769px)">                         desktop (1500x500)
 *   <source media="(min-width: 429px) and (max-width: 768px)">  tablet (768x460)
 *   <source media="(max-width: 428px)">                         mobile (375x460)
 * The shared parser (./hero-minimal-dark-withimg.js) keeps only the desktop
 * <img>; Row 3 is taken from its output unchanged. blocks/hero-minimal-dark-withimg.js
 * turns a background cell with three images into one art-directed <picture>.
 */
import parseHero from './hero-minimal-dark-withimg.js';

const ORIGIN = 'https://www.highmark.com';

function sourceFor(picture, test) {
  const source = [...picture.querySelectorAll('source[media][srcset]')]
    .find((s) => test(s.getAttribute('media')));
  if (!source) return null;
  const src = source.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0];
  return src ? new URL(src, ORIGIN).href : null;
}

function image(document, src, alt) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  return img;
}

export default function parse(element, { document, url, params }) {
  const picture = element.querySelector('picture');
  const desktopImg = picture?.querySelector('img');
  const alt = desktopImg?.getAttribute('alt') || '';
  const desktop = desktopImg && new URL(desktopImg.getAttribute('src'), ORIGIN).href;
  const tablet = picture && sourceFor(picture, (m) => /max-width:\s*768px/.test(m) && /min-width/.test(m));
  const mobile = picture && sourceFor(picture, (m) => /max-width:\s*428px/.test(m));

  // Without all three renditions, the shared parser's output is the block.
  if (!desktop || !tablet || !mobile) {
    parseHero(element, { document, url, params });
    return;
  }

  // Row 3: run the shared parser on a detached copy and take its content cell.
  const scratch = document.createElement('div');
  scratch.append(element.cloneNode(true));
  parseHero(scratch.firstElementChild, { document, url, params });
  const rows = [...scratch.querySelectorAll('tr')];
  const contentCell = rows[rows.length - 1]?.querySelector('td');
  const content = contentCell ? [...contentCell.childNodes] : [];

  const cells = [
    // Row 2: background image renditions (desktop, tablet, mobile)
    [[image(document, desktop, alt), image(document, tablet, alt), image(document, mobile, alt)]],
    // Row 3: title + subheading + CTA
    [content],
  ];
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'hero-minimal-dark-withimg', cells }));
}
