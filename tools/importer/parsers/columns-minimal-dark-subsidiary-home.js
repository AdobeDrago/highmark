/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-minimal-dark (subsidiary-home template). Base: columns.
 * Source: https://www.highmark.com/health-options-de (also https://www.highmark.com/wholecare)
 *   (div.newcardscomponent-variations.section:has(.side-card-panel))
 * Generated: 2026-10-05
 *
 * Emits the existing `columns-minimal-dark` block; registered by the subsidiary-home
 * import script as parsers['columns-minimal-dark'].
 *
 * Block library structure (Columns convention: 2 columns, 1 content row):
 *   Row 1: block name
 *   Row 2: [ content | image ] or [ image | content ]
 *
 * - Side panels WITHOUT a video (image-area + text-area, e.g. "Real support for
 *   real-life") are delegated unchanged to the shared columns-minimal-dark.js parser.
 * - Side panels whose media column is a video
 *   (.side-card-panel .youtube-container video > source[src="/content/dam/...mp4"],
 *   e.g. "We're in your community") are built here:
 *     [ video link | heading + .text-area direct <div> blocks + CTA links ]
 *   The video sits on the left (.youtube-container.left-content renders with order:1).
 *   The video cell is <p><a href="{mp4}">{mp4}</a></p>; the src is kept relative —
 *   highmark-cleanup.js makes /content/dam/ links absolute later.
 *   The bold "WATCH THE VIDEO TO LEARN MORE" link stays inline in its body paragraph.
 *   Label-less a.textButton placeholders were already removed by
 *   highmark-template-sections.js beforeTransform; href-less anchors are skipped here too.
 */
import sharedParse from './columns-minimal-dark.js';

const clean = (text) => (text || '').replace(/\s+/g, ' ').trim();

function hasContent(node) {
  return clean(node.textContent) !== '' || !!(node.querySelector && node.querySelector('img, picture, video'));
}

function parseVideoPanel(element, document, video) {
  const container = video.closest('.youtube-container');
  const textArea = element.querySelector('.text-area') || element;

  // Video cell: first <source src>, else video[src]
  const sourceEl = video.querySelector('source[src]');
  const src = clean((sourceEl && sourceEl.getAttribute('src')) || video.getAttribute('src'));
  const videoCell = [];
  if (src) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', src);
    a.textContent = src;
    p.append(a);
    videoCell.push(p);
  }

  // Content cell: same logic as the shared parser
  const heading = textArea.querySelector('h1, h2, h3, h4');
  const bodyBlocks = Array.from(textArea.querySelectorAll(':scope > div')).filter(hasContent);
  const ctas = Array.from(textArea.querySelectorAll('a.textButton, a.button, a[class*="button"]'))
    .filter((a) => clean(a.getAttribute('href')))
    .filter((a) => !bodyBlocks.some((b) => b.contains(a)));

  // Empty-block guard
  if (!src && !heading && bodyBlocks.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const contentCell = [];
  if (heading) contentCell.push(heading);
  contentCell.push(...bodyBlocks);
  contentCell.push(...ctas);

  const videoCol = videoCell.length ? videoCell : [''];
  const contentCol = contentCell.length ? contentCell : [''];
  const videoRight = !!(container && container.classList.contains('right-content'));
  const cells = [videoRight ? [contentCol, videoCol] : [videoCol, contentCol]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-minimal-dark', cells });
  element.replaceWith(block);
}

export default function parse(element, { document }) {
  const video = element.querySelector('.side-card-panel .youtube-container video')
    || element.querySelector('.youtube-container video');
  if (!video) {
    sharedParse(element, { document });
    return;
  }
  parseVideoPanel(element, document, video);
}
