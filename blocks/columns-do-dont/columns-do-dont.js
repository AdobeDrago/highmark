export default function decorate(block) {
  /* One row, two cells: first cell is the "Do" list, second the "Don't" list.
     Each cell holds a heading, a bulleted list and an optional link. */
  [...block.children].forEach((row) => {
    const [doCol, dontCol] = row.children;
    if (doCol) doCol.classList.add('columns-do-dont-do');
    if (dontCol) dontCol.classList.add('columns-do-dont-dont');
  });
}
