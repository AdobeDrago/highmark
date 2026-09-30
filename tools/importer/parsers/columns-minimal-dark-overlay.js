/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-minimal-dark-overlay. Base: columns.
 * Source: https://www.highmark.com/resources/mental-health-services/substance-use-disorders
 *   (div.onecard1colpanel.section:has(.one-card-one-col-panel.image) — "Emily's story")
 * Generated: 2026-09-30
 *
 * Same source component as the homepage promo bands ("Support for your mental
 * health"), whose authored content this matches.
 *
 * Block library structure (2 columns, 1 content row):
 *   Row 1: block name
 *   Row 2: [ heading + paragraph(s) + CTA link | full-width image ]
 *
 * Source DOM:
 *   .one-card-one-col-panel.image > .one-card-one-inner
 *     > div > picture (source[media="(min-width: 992px)"] = 1500px desktop image,
 *             img.mobile-logo-image = 375px mobile image)
 *     > .one-card-content-left ... > h2.header, .body-text p, .buttonGroup a
 * The desktop/mobile duplicate h2 and copy are removed by highmark-cleanup.js;
 * the first remaining heading/copy is used either way.
 */
export default function parse(element, { document }) {
  const panel = element.querySelector('.one-card-one-col-panel.image') || element;
  const picture = panel.querySelector('picture');
  const img = panel.querySelector('picture img, img');

  const textRoot = panel.querySelector('.one-card-content-left, [class*="one-card-content"]') || panel;
  const heading = textRoot.querySelector('h1, h2, h3');
  const bodyText = textRoot.querySelector('.body-text');
  const paragraphs = bodyText ? Array.from(bodyText.querySelectorAll('p')) : [];
  const links = Array.from(textRoot.querySelectorAll('.buttonGroup a, .hmk-brand-buttons a'))
    .filter((a, i, arr) => arr.indexOf(a) === i)
    .filter((a) => {
      const href = (a.getAttribute('href') || '').trim();
      return href && href !== '#';
    });

  // Empty-block guard
  if (!heading && !paragraphs.length && !img) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Image column: prefer the desktop rendition (the band spans the full page width at >= 992px).
  let image = '';
  if (img) {
    const desktop = picture && Array.from(picture.querySelectorAll('source'))
      .find((s) => /min-width:\s*992px/.test(s.getAttribute('media') || '') && s.getAttribute('srcset'));
    image = document.createElement('img');
    image.setAttribute('src', desktop ? desktop.getAttribute('srcset').split(/\s+/)[0] : img.getAttribute('src'));
    image.setAttribute('alt', img.getAttribute('alt') || '');
  }

  // Content column: heading, copy, CTA
  const contentCell = [];
  if (heading) contentCell.push(heading);
  contentCell.push(...paragraphs);
  links.forEach((a) => {
    const p = document.createElement('p');
    p.append(a);
    contentCell.push(p);
  });

  // One row, two columns: [ content | image ]
  const cells = [[contentCell, image]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-minimal-dark-overlay', cells });
  element.replaceWith(block);
}
