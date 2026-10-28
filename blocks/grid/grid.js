/*
 * Grid: highmark.com's grid control in an article (a row of equal columns: the Blue Fund
 * pages' "Quick guide" link lists, Corporate Giving Contact's region cards).
 *
 * Authoring: one row, one cell per column (paragraphs, headings, lists, links).
 * - Grid: the columns side by side from 768px, stacked on phones.
 * - Grid (grey): on the source's grey band (#f2f5f7, global-grey_garden).
 * - pad-<n> / pad-tablet-<n> / pad-mobile-<n>: the band's spacers above the columns.
 * - space-<n> / space-tablet-<n> / space-mobile-<n>: the spacers before the band.
 */
export default function decorate(block) {
  const cells = [];
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const col = document.createElement('div');
      col.className = 'grid-cell';
      // a cell holding a single paragraph arrives without its <p> (the pipeline unwraps it)
      if (cell.textContent.trim() && !cell.querySelector(':scope > :is(p, ul, ol, h1, h2, h3, h4, h5, h6, div, picture, table)')) {
        const p = document.createElement('p');
        p.append(...cell.childNodes);
        cell.append(p);
      }
      col.append(...cell.childNodes);
      cells.push(col);
    });
  });
  block.replaceChildren(...cells);
}
