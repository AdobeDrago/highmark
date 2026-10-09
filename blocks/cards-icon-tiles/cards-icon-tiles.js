export default function decorate(block) {
  /* Topic tiles: each row = one tile (icon image + linked label).
     The whole tile becomes a single link. */
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const anchor = row.querySelector('a');
    const link = document.createElement('a');
    link.className = 'cards-icon-tiles-link';
    link.href = anchor ? anchor.getAttribute('href') : '#';

    const picture = row.querySelector('picture');
    if (picture) {
      const icon = document.createElement('span');
      icon.className = 'cards-icon-tiles-icon';
      const img = picture.querySelector('img');
      if (img) img.alt = '';
      icon.append(picture);
      link.append(icon);
    }

    const label = document.createElement('span');
    label.className = 'cards-icon-tiles-label';
    label.textContent = (anchor || row).textContent.trim();
    link.append(label);

    li.append(link);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
