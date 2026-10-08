/*
 * Flip cards, as ShopX's special-enrollment event selector: each card shows an icon and
 * a title; its arrow turns the card over to a description, and a Select button under the
 * card follows the card's link.
 *
 * One row per card: icon | title | description (back of the card) | link (Select).
 */
import { createOptimizedPicture } from '../../scripts/aem.js';

const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16.17 13H4v-2h12.17l-5.59-5.59L12 4l8 8-8 8-1.41-1.41z"/></svg>';

function element(tag, className, ...children) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.append(...children);
  return el;
}

function flipButton(label, back) {
  const button = element('button', `flip-cards-flip${back ? ' flip-cards-flip-back' : ''}`);
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.innerHTML = ARROW;
  return button;
}

export default function decorate(block) {
  const list = element('ul', 'flip-cards-list');

  [...block.children].forEach((row) => {
    const [imageCell, titleCell, textCell, linkCell] = [...row.children];
    const title = titleCell?.textContent.trim() || '';
    const link = linkCell?.querySelector('a');

    const picture = imageCell?.querySelector('picture');
    const img = picture?.querySelector('img');
    // icons are SVGs: keep the original rather than a raster rendition
    const icon = img && !/\.svg(\?|$)/i.test(new URL(img.src, window.location.href).pathname)
      ? createOptimizedPicture(img.src, img.alt, false, [{ width: '500' }])
      : picture;

    const toBack = flipButton(`About ${title}`);
    const toFront = flipButton(`Back to ${title}`, true);
    const front = element(
      'div',
      'flip-cards-front',
      element('div', 'flip-cards-image', ...(icon ? [icon] : [])),
      element('div', 'flip-cards-bar', element('p', 'flip-cards-title', title), toBack),
    );
    const back = element(
      'div',
      'flip-cards-back',
      element('div', 'flip-cards-text', ...(textCell ? [...textCell.childNodes] : [])),
      element('div', 'flip-cards-bar', toFront),
    );
    back.inert = true;
    const card = element('div', 'flip-cards-card', front, back);

    const setFlipped = (flipped) => {
      card.classList.toggle('flipped', flipped);
      front.inert = flipped;
      back.inert = !flipped;
      (flipped ? toFront : toBack).focus({ preventScroll: true });
    };
    toBack.addEventListener('click', () => setFlipped(true));
    toFront.addEventListener('click', () => setFlipped(false));

    const item = element('li', 'flip-cards-item', card);
    if (link) {
      link.className = 'flip-cards-select';
      link.setAttribute('aria-label', `${link.textContent.trim()}: ${title}`);
      item.append(element('p', 'flip-cards-select-wrapper', link));
    }
    list.append(item);
  });

  block.replaceChildren(list);
}
