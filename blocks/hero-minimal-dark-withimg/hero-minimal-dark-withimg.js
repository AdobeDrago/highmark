/**
 * hero-minimal-dark-withimg — full-bleed background photo (row 1) with heading +
 * subheading (row 2) overlaid on the left. Styling is in CSS.
 *
 * Art direction: when the background cell holds three images (desktop, tablet,
 * mobile, as on /wholecare and /health-options-de), they become one <picture>
 * that switches at the source site's breakpoints (<= 428px mobile, <= 768px
 * tablet, desktop above), and the block gets the `art-directed` class so its
 * height follows the rendition shown instead of cropping it. A single image is
 * left as it is.
 */

const MEDIA = {
  mobile: '(max-width: 428px)',
  tablet: '(max-width: 768px)',
};

function rendition(src, width, format) {
  const url = new URL(src, window.location.href);
  url.search = '';
  url.searchParams.set('width', width);
  url.searchParams.set('format', format);
  url.searchParams.set('optimize', 'medium');
  return url.pathname + url.search;
}

function buildArtDirectedPicture(imgs) {
  const [desktop, tablet, mobile] = imgs;
  const picture = document.createElement('picture');
  [
    [mobile, MEDIA.mobile, 750],
    [tablet, MEDIA.tablet, 1500],
  ].forEach(([img, media, width]) => {
    ['webply', 'jpg'].forEach((format) => {
      const source = document.createElement('source');
      source.media = media;
      if (format === 'webply') source.type = 'image/webp';
      source.srcset = rendition(img.src, width, format);
      picture.append(source);
    });
  });
  const webp = document.createElement('source');
  webp.type = 'image/webp';
  webp.srcset = rendition(desktop.src, 2000, 'webply');
  picture.append(webp);

  const img = document.createElement('img');
  img.src = rendition(desktop.src, 2000, 'jpg');
  img.alt = desktop.alt;
  img.loading = desktop.loading || 'eager';
  if (desktop.width && desktop.height) {
    img.width = desktop.width;
    img.height = desktop.height;
  }
  picture.append(img);
  return picture;
}

export default function decorate(block) {
  const imageCell = block.querySelector(':scope > div:first-child > div');
  const imgs = imageCell ? [...imageCell.querySelectorAll('img')] : [];
  if (imgs.length < 3) return;
  const picture = buildArtDirectedPicture(imgs);
  imageCell.replaceChildren(picture);
  block.classList.add('art-directed');
}
