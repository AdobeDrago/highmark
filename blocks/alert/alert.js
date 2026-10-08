export default function decorate(block) {
  /* Single row: optional icon cell + message cell (heading, copy, CTA). */
  const row = block.firstElementChild;
  if (!row) return;
  block.setAttribute('role', 'note');

  [...row.children].forEach((col) => {
    const pic = col.querySelector('picture');
    if (pic && col.children.length === 1) {
      col.classList.add('alert-icon');
      const img = pic.querySelector('img');
      if (img) img.alt = '';
    } else {
      col.classList.add('alert-body');
    }
  });
}
