export default function decorate(block) {
  /* Image beside text. Mark the image cell and the copy cell so CSS can size
     them; authors can put the image on either side. */
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic && col.children.length === 1) col.classList.add('columns-media-img');
      else col.classList.add('columns-media-copy');
    });
  });
}
