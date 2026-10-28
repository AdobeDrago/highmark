export default function decorate(block) {
  /* Text/list-only cards (e.g. Do / Don't): each row = one card holding a
     heading, a bulleted list, and a read-more link. No images. */
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      div.className = 'cards-minimal-dark-list-card-body';
    });
    ul.append(li);
  });

  block.replaceChildren(ul);
}
