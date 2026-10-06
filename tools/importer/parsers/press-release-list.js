/* eslint-disable */
/* global WebImporter */
/**
 * Parser for press-release-list.
 * Source: https://www.highmark.com/newsroom/press-releases (.page__par .press-release)
 * Generated: 2026-10-06
 *
 * The source listing (keyword search, Location/Year filters, mobile filter drawer,
 * result count, the first 10 client-rendered releases, LOAD MORE, and the hidden
 * release-detail view) is replaced by the press-release-list block, which renders all
 * releases from the /newsroom/press-releases-data.json sheet
 * (tools/press-releases/build-press-releases-data.mjs). The listing's heading
 * ("Press Releases", an h2 on the source) is kept before the block as the page's h1.
 *
 * Block table (1 column, 1 row):
 *   | press-release-list                       |
 *   | <a> /newsroom/press-releases-data.json   |
 */

const DATA_SHEET = '/newsroom/press-releases-data.json';

export default function parse(element, { document }) {
  const heading = element.querySelector('#release-results h2');
  const title = (heading?.textContent || 'Press Releases').replace(/\s+/g, ' ').trim();

  const a = document.createElement('a');
  a.href = DATA_SHEET;
  a.textContent = DATA_SHEET;
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'press-release-list',
    cells: [[a]],
  });

  const h1 = document.createElement('h1');
  h1.textContent = title;
  element.replaceWith(h1, block);
}
