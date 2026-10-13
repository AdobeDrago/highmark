/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-minimal-dark. Base: columns.
 * Source: https://www.highmark.com/resources
 *   (div.newcardscomponent-variations.section:nth-of-type(4))
 * Generated: 2026-08-17
 *
 * Block library structure (2 columns, 1 content row):
 *   Row 1: block name
 *   Row 2: [ heading + paragraph(s) + CTA link | image ]
 *
 * Per authoring analysis the content column comes first, image column second.
 *
 * Also verified (no code change) on https://www.highmark.com/plans/individual-families
 * section 7 (.side-card-panel, incl. the state/date bullet list).
 */
/**
 * Leadership bio header (https://www.highmark.com/about/our-story/leadership-team-board/*,
 * section.flex-container): one row, two columns [ photo | name (h1) + job title + one
 * link per paragraph ], as the source shows them side by side.
 * Links: LinkedIn (icon-only on the source, so it gets a text label), "Request Interview"
 * -> the shared /modals/request-interview popup on every bio (on the source 6 bios have no
 * popup behind their link, so it is a dead "#"; decided 2026-10-13 to link them all), and
 * "View as a PDF". Broken LinkedIn hrefs ("#", empty, not http) are dropped and stray
 * encoded spaces trimmed.
 */
function parseBio(element, document) {
  const img = element.querySelector('.div-bio-images img, img');
  const header = element.querySelector('.div-bio-header') || element;
  const name = header.querySelector('h1, h2, h3, h4');
  const title = header.querySelector('p');

  const content = [];
  if (name) {
    const h1 = document.createElement('h1');
    h1.textContent = name.textContent.replace(/\s+/g, ' ').trim();
    content.push(h1);
  }
  if (title) {
    const p = document.createElement('p');
    p.textContent = title.textContent.replace(/\s+/g, ' ').trim();
    content.push(p);
  }
  const linkPara = (href, text) => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    p.append(a);
    return p;
  };
  header.querySelectorAll('a').forEach((a) => {
    const raw = (a.getAttribute('href') || '').trim();
    const href = raw.replace(/(%20|\s)+$/i, '');
    const label = a.textContent.replace(/\s+/g, ' ').trim();
    if (/linkedin\.com/i.test(href)) {
      if (/^https?:\/\//i.test(href)) content.push(linkPara(href, 'LinkedIn'));
    } else if (a.id === 'bio-modal' || /request interview/i.test(label)) {
      content.push(linkPara('/modals/request-interview', 'Request Interview'));
    } else if (/\.pdf$/i.test(href)) {
      content.push(linkPara(href, 'View as a PDF'));
    } else if (href && href !== '#') {
      content.push(linkPara(href, label || href));
    }
  });

  const cells = [[img ? [img] : '', content]];
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'columns-minimal-dark', cells }));
}

export default function parse(element, { document }) {
  if (element.matches('section.flex-container') && element.querySelector('.div-bio-header')) {
    parseBio(element, document);
    return;
  }

  const textArea = element.querySelector('.text-area') || element;
  const imageArea = element.querySelector('.image-area') || element;

  const image = imageArea.querySelector('picture, img');
  const heading = textArea.querySelector('h1, h2, h3, h4');
  // Body copy: text-area direct <div> blocks (excludes the button wrapper section)
  const bodyBlocks = Array.from(textArea.querySelectorAll(':scope > div'));
  // CTA links; skip placeholder anchors with no href (get-help side panels carry an
  // empty a.textButton) so they don't become empty links.
  // CTAs (button-classed or bold-wrapped links: <p><b><a>TALK TO A SPECIALIST</a></b>)
  // are appended after the copy. Plain links inside running text stay inline
  // (blue-neighbors "Visit highmark.findhelp.com, or call…").
  const isCta = (a) => a.matches('a.textButton, a.button, a[class*="button"]') || !!a.closest('b, strong');
  const links = Array.from(textArea.querySelectorAll('a.textButton, a.button, a[class*="button"], a[href]'))
    .filter((a) => (a.getAttribute('href') || '').trim())
    .filter((a) => isCta(a) || !bodyBlocks.some((b) => b.contains(a)));

  // Empty-block guard
  if (!heading && bodyBlocks.length === 0 && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const contentCell = [];
  if (heading) contentCell.push(heading);
  contentCell.push(...bodyBlocks);
  contentCell.push(...links);

  const imageCell = image ? [image] : [''];

  // Single 2-column row: [ content | image ], or [ image | content ] when the
  // source places the image on the left (.image-area.left-content, e.g.
  // mental-health-resources "Break the stigma"). The block renders DOM order on desktop.
  const imageLeft = !!element.querySelector('.image-area.left-content');
  const cells = [imageLeft ? [imageCell, contentCell] : [contentCell, imageCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-minimal-dark', cells });
  element.replaceWith(block);
}
