/**
 * A column whose only content is one link to an .mp4 file (subsidiary-home
 * "We're in your community" panel) plays that video inline, as on the source.
 * Columns with any other content are left unchanged.
 * @param {Element} col The column cell
 */
function decorateVideoColumn(col) {
  const links = col.querySelectorAll('a[href]');
  if (links.length !== 1 || col.querySelector('picture, img, video')) return;
  const link = links[0];
  let url;
  try {
    url = new URL(link.href, window.location.href);
  } catch (e) {
    return;
  }
  if (!/\.mp4$/i.test(url.pathname)) return;
  if (col.textContent.trim() !== link.textContent.trim()) return;

  const video = document.createElement('video');
  video.setAttribute('controls', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', 'metadata');
  const source = document.createElement('source');
  source.setAttribute('src', url.href);
  source.setAttribute('type', 'video/mp4');
  video.append(source);
  col.replaceChildren(video);
  col.classList.add('columns-minimal-dark-img-col', 'columns-minimal-dark-video-col');
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-minimal-dark-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      decorateVideoColumn(col);
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-minimal-dark-img-col');
        }
      }
    });
  });
}
