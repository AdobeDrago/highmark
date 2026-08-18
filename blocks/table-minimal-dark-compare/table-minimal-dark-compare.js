/*
 * Table (Minimal Dark Compare)
 * Comparison table: a header row of column labels (e.g. HSA / HRA / FSA) followed
 * by feature rows (feature label in the first column, values per column).
 * https://www.hlx.live/developer/block-collection/table
 */

function buildCell(rowIndex) {
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

export default async function decorate(block) {
  const rows = [...block.children];

  // Drop the import artifact row: some imports emit a leading row whose first
  // cell holds the block/label name and whose remaining cells are empty and
  // that contains no headings. That is not real content — remove it so the
  // real column-label row (HSA / HRA / FSA) becomes the header.
  if (rows.length > 1) {
    const first = rows[0];
    const cells = [...first.children];
    const hasHeading = !!first.querySelector('h1, h2, h3, h4, h5, h6');
    const trailingEmpty = cells.slice(1).every((c) => c.textContent.trim() === '');
    if (!hasHeading && cells.length > 1 && trailingEmpty && cells[0].textContent.trim() !== '') {
      first.remove();
      rows.shift();
    }
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const header = !block.classList.contains('no-header');
  if (header) table.append(thead);
  table.append(tbody);

  rows.forEach((child, i) => {
    const row = document.createElement('tr');
    if (header && i === 0) thead.append(row);
    else tbody.append(row);
    [...child.children].forEach((col) => {
      const cell = buildCell(header ? i : i + 1);
      cell.innerHTML = col.innerHTML;
      row.append(cell);
    });
  });
  block.innerHTML = '';
  block.append(table);
}
