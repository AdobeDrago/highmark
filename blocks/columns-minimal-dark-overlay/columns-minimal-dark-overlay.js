export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-minimal-dark-overlay-${cols.length}-cols`);

  // check if parent section has highlight class
  const isHighlight = block.closest('.highlight');

  // setup image and content overlay
  [...block.children].forEach((row) => {
    let imageColIndex = -1;
    let contentColIndex = -1;

    // identify image and content columns
    [...row.children].forEach((col, index) => {
      const pic = col.querySelector('picture');
      if (pic && col.children.length === 1) {
        // image-only column
        col.classList.add('columns-minimal-dark-overlay-img-col');
        imageColIndex = index;
      } else if (!pic) {
        // content column
        col.classList.add('columns-minimal-dark-overlay-content-col');
        contentColIndex = index;
      }
    });

    // determine alignment based on column order
    // if content comes after image, align right
    if (contentColIndex > imageColIndex) {
      block.classList.add('columns-minimal-dark-overlay-right');
    }

    // position content absolutely over image only if NOT in highlight section
    if (!isHighlight) {
      row.style.position = 'relative';
    }
  });
}
