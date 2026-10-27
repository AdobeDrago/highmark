/*
 * Callout: a tinted box in an article (highmark.com's colour-band containers inside a
 * page's text).
 *
 * Authoring: one cell holding the box's content (paragraphs, headings, lists, links).
 * - Callout (light-blue): the source's 15% splash box, inset from the text column
 *   (Highmark Delaware BluePrints' report lists).
 * - Callout (grey): the source's grey garden band, the full width of the text column,
 *   its text in the middle ten twelfths (What You Can Do's cleaning-recipes note).
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'callout-content';
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      // a cell holding a single paragraph arrives without its <p> (the pipeline unwraps it)
      if (cell.textContent.trim() && !cell.querySelector(':scope > :is(p, ul, ol, h1, h2, h3, h4, h5, h6, div, picture, table)')) {
        const p = document.createElement('p');
        p.append(...cell.childNodes);
        cell.append(p);
      }
      content.append(...cell.childNodes);
    });
  });
  block.replaceChildren(content);
}
