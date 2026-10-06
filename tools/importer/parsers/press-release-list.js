/* eslint-disable */
/* global WebImporter */
/**
 * Parser for press-release-list.
 * Sources:
 *   https://www.highmark.com/newsroom/press-releases (.page__par .press-release)
 *   https://www.highmark.com/about/events (div.events) -> option "events"
 * Generated: 2026-10-06
 *
 * The source listing (keyword search, Location/Region and Year/Date filters, mobile filter
 * drawer, result count, the client-rendered results, LOAD MORE, and the hidden detail view)
 * is replaced by the press-release-list block, which renders every item from the data sheet
 * (tools/press-releases/build-press-releases-data.mjs, tools/events/build-events-data.mjs).
 * The listing's heading ("Press Releases" / "Events", an h2 on the source) is kept before
 * the block as the page's h1.
 *
 * Block table (1 column, 1 row):
 *   | press-release-list            |   | press-release-list (events) |
 *   | <a> <data sheet>              |   | <a> /about/events-data.json |
 */

const SOURCES = {
  releases: {
    name: 'press-release-list',
    sheet: '/newsroom/press-releases-data.json',
    heading: '#release-results h2',
    title: 'Press Releases',
  },
  events: {
    name: 'press-release-list (events)',
    sheet: '/about/events-data.json',
    heading: '#event-results h2',
    title: 'Events',
  },
};

export default function parse(element, { document }) {
  const isEvents = element.matches('.events') || !!element.querySelector('#events-filter, #event-results');
  const source = isEvents ? SOURCES.events : SOURCES.releases;
  const heading = element.querySelector(source.heading);
  const title = (heading?.textContent || source.title).replace(/\s+/g, ' ').trim();

  const a = document.createElement('a');
  a.href = source.sheet;
  a.textContent = source.sheet;
  const block = WebImporter.Blocks.createBlock(document, {
    name: source.name,
    cells: [[a]],
  });

  const h1 = document.createElement('h1');
  h1.textContent = title;
  element.replaceWith(h1, block);
}
