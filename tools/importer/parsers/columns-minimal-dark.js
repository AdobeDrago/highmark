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
 */
export default function parse(element, { document }) {
  const textArea = element.querySelector('.text-area') || element;
  const imageArea = element.querySelector('.image-area') || element;

  const image = imageArea.querySelector('picture, img');
  const heading = textArea.querySelector('h1, h2, h3, h4');
  // Body copy: text-area direct <div> blocks (excludes the button wrapper section)
  const bodyBlocks = Array.from(textArea.querySelectorAll(':scope > div'));
  const links = Array.from(textArea.querySelectorAll('a.textButton, a.button, a[class*="button"], a[href]'));

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

  // Single 2-column row: [ content | image ]
  const cells = [[contentCell, imageCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-minimal-dark', cells });
  element.replaceWith(block);
}
