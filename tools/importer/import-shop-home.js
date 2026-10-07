/* eslint-disable */
/* global WebImporter */

/**
 * Import script: ShopX home (https://shop.highmark.com/home.html) -> DA /shop/index
 * (served at /shop/).
 *
 * The source is an Angular SPA whose main region is empty until a ZIP + county is
 * entered, so this script runs against the static capture made by
 * tools/importer/snapshots/capture-shop-home.mjs (default ZIP 15222 / Allegheny,
 * Western PA), served locally, e.g.:
 *   npx http-server tools/importer/snapshots -p 8765
 *   urls file: http://localhost:8765/shop/index.html
 *
 * Output, in the blocks the existing /shop/ page uses (template shop-home):
 *   1. hero-minimal-dark-withimg: the hero's background illustration + its heading (h1)
 *   2. ZIP location line + "Change area" (opens /modals/zip-county)  | Style: zip-location
 *   3. cards (shop): one row per plan card - image | h2, text, SHOP PLANS link
 *      (the source renders the links in a second grid, matched to the cards by position)
 *   4. Special Enrollment: h2, h5s, Get Started                       | Style: blue, center
 *   5. Learn More: h2, brochure h3, illustration                       | Style: learn-more
 *   Metadata: Title, Description, Template shop-home
 *
 * Links and the brochure are the captured region's (fixed URLs, not {{tokens}}).
 */

const SECTION_BREAK = 'hr';

function sectionMetadata(document, style) {
  return WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: { Style: style },
  });
}

function img(document, src, alt = '') {
  const el = document.createElement('img');
  el.src = src;
  el.alt = alt;
  return el;
}

function cleanText(el) {
  // drop &nbsp; runs and trailing <br>s that the AEM rich text leaves behind
  el.querySelectorAll('br').forEach((br) => {
    if (!br.nextSibling || (br.nextSibling.nodeType === 3 && !br.nextSibling.textContent.trim() && !br.nextSibling.nextSibling)) br.remove();
  });
  el.innerHTML = el.innerHTML.replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ');
  return el;
}

function plainLink(document, a) {
  const link = document.createElement('a');
  link.href = a.getAttribute('href');
  link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
  // the source's link titles (SHOP PLANS links name their card's plan)
  if (a.getAttribute('title')) link.title = a.getAttribute('title');
  const p = document.createElement('p');
  p.append(link);
  return p;
}

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const source = document.querySelector('main') || document.body;
    const out = document.createElement('div');
    const blocks = [];

    // 1. Hero: the blue section with the background illustration and the headline
    const heroSection = source.querySelector('section.global-highmark_blue');
    const heroHeading = heroSection?.querySelector('h1, h2');
    if (heroSection && heroHeading) {
      const h1 = document.createElement('h1');
      h1.textContent = heroHeading.textContent.replace(/\s+/g, ' ').trim();
      const bg = heroSection.getAttribute('data-bg');
      const cells = [];
      if (bg) cells.push([img(document, bg)]);
      cells.push([h1]);
      out.append(WebImporter.Blocks.createBlock(document, { name: 'hero-minimal-dark-withimg', cells }));
      blocks.push('hero-minimal-dark-withimg');
    }

    // 2. ZIP location line (source: <sxe-zip-county-modal-trigger>): the location text is
    // filled at runtime by zip-tokens.js; "Change area" opens our ZIP/county modal.
    if (source.querySelector('.zip-county-modal, sxe-zip-county-modal-trigger')) {
      out.append(document.createElement(SECTION_BREAK));
      const p = document.createElement('p');
      p.append(document.createElement('br'));
      const a = document.createElement('a');
      a.href = '/modals/zip-county';
      a.textContent = 'Change area';
      p.append(a);
      out.append(p, sectionMetadata(document, 'zip-location'));
    }

    // 3. Plan cards: first grid = image + text per card, second grid = SHOP PLANS links
    const grids = [...source.querySelectorAll('.gridcontrol .aem-hmk-row')];
    const cardCols = grids[0] ? [...grids[0].children] : [];
    const linkCols = grids[1] ? [...grids[1].children] : [];
    if (cardCols.length) {
      out.append(document.createElement(SECTION_BREAK));
      const rows = cardCols.map((col, i) => {
        const image = col.querySelector('img');
        const text = col.querySelector('.cmp-text');
        const content = [];
        text?.querySelectorAll('h1, h2, h3, h4, p').forEach((el) => content.push(cleanText(el.cloneNode(true))));
        const link = linkCols[i]?.querySelector('a[href]');
        if (link) content.push(plainLink(document, link));
        return [image ? img(document, image.getAttribute('src'), image.getAttribute('alt') || '') : '', content];
      });
      out.append(WebImporter.Blocks.createBlock(document, { name: 'Cards (shop)', cells: rows }));
      blocks.push('cards');
    }

    // 4. Special Enrollment band (pastel-blue section)
    const se = source.querySelector('section.global-pastel_blue');
    if (se) {
      out.append(document.createElement(SECTION_BREAK));
      se.querySelectorAll('.cmp-text').forEach((t) => {
        t.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach((el) => out.append(cleanText(el.cloneNode(true))));
      });
      const cta = se.querySelector('#button-component a[href], .button a[href]');
      if (cta) out.append(plainLink(document, cta));
      out.append(sectionMetadata(document, 'blue, center'));
    }

    // 5. Learn More: the text + image components after the Special Enrollment band
    const learnHeading = [...source.querySelectorAll('.cmp-text h2')].find((h) => /learn more/i.test(h.textContent));
    if (learnHeading) {
      out.append(document.createElement(SECTION_BREAK));
      const text = learnHeading.closest('.cmp-text');
      text.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach((el) => {
        const clone = cleanText(el.cloneNode(true));
        clone.querySelectorAll('a').forEach((a) => {
          a.removeAttribute('target');
          a.removeAttribute('rel');
          a.removeAttribute('aria-description');
          a.textContent = a.textContent.trim();
        });
        if (clone.textContent.trim()) out.append(clone);
      });
      // the illustration is the next .image grid column after the text column
      let imageCmp = text.nextElementSibling;
      while (imageCmp && !imageCmp.matches('.image')) imageCmp = imageCmp.nextElementSibling;
      const image = imageCmp?.querySelector('img');
      if (image) out.append(img(document, image.getAttribute('src'), image.getAttribute('alt') || ''));
      out.append(sectionMetadata(document, 'learn-more'));
    }

    // Metadata (same values as the authored page)
    out.append(document.createElement(SECTION_BREAK));
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const meta = { Title: document.title || 'Shop | Home' };
    if (description) meta.Description = description;
    meta.Template = 'shop-home';
    out.append(WebImporter.Blocks.getMetadataBlock(document, meta));

    // The capture is served from localhost; the document is /shop/index (served at /shop/).
    return [{
      element: out,
      path: '/shop/index',
      report: {
        title: document.title,
        template: 'shop-home',
        blocks,
        captured: document.querySelector('meta[name="captured"]')?.getAttribute('content') || '',
      },
    }];
  },
};
