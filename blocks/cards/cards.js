import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });

  // replace images with optimized versions
  ul.querySelectorAll('picture > img').forEach((img) => {
    const picture = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    // shop: flat illustrations stay PNG, as lossy WebP blotches their pale shapes
    if (block.classList.contains('shop')) picture.querySelectorAll('source[type="image/webp"]').forEach((s) => s.remove());
    img.closest('picture').replaceWith(picture);
  });

  block.replaceChildren(ul);
}
