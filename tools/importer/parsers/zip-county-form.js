/* eslint-disable */
/* global WebImporter */
/**
 * Parser for zip-county-form.
 * Source: https://www.highmark.com/zipcode-gate-login (main .aem-Grid > div.input:has(#txt-zipcode))
 * Generated: 2026-10-05
 *
 * The source ZIP code gate (input#txt-zipcode + sibling div.button with
 * a#btn-zipcode-enter "Let's get started") is replaced by the project's existing
 * sheet-driven zip-county-form block, which builds its own fields from the form
 * sheet. Source label/button text are therefore NOT carried over.
 *
 * Block table (identical to content/modals/zip-county.plain.html):
 *   | Form     | /shop/zip-county-form.json |
 *   | Counties | /shop/zip-counties.json    |
 *   | Regions  | /shop/regions.json         |
 */
export default function parse(element, { document }) {
  // Remove the nearest following sibling div.button holding #btn-zipcode-enter
  // so the "Let's get started" link does not survive as stray default content.
  let sibling = element.nextElementSibling;
  while (sibling) {
    if (sibling.matches && sibling.matches('div.button') && sibling.querySelector('#btn-zipcode-enter')) {
      sibling.remove();
      break;
    }
    sibling = sibling.nextElementSibling;
  }

  const cells = [
    ['Form', '/shop/zip-county-form.json'],
    ['Counties', '/shop/zip-counties.json'],
    ['Regions', '/shop/regions.json'],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'zip-county-form', cells });
  element.replaceWith(block);
}
