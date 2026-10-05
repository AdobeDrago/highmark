export default function decorate(block) {
  /* Text/list-only cards (e.g. Do / Don't): each row = one card holding a
     heading, a bulleted list, and a read-more link. No images. */
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      div.className = 'cards-minimal-dark-list-card-body';
      li.querySelectorAll('h3').forEach((h3) => {
        const hr = document.createElement('hr');
        hr.className = 'cards-minimal-dark-list-title-underline';
        h3.after(hr);
      });
    });
    ul.append(li);
  });

  block.replaceChildren(ul);
}
