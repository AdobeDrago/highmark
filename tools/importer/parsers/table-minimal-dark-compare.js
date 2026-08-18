/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table-minimal-dark-compare. Base: table.
 * Source: https://www.highmark.com/resources/spending-accounts/... (.dynamic-table-container table)
 * Generated: 2026-08-17
 *
 * Block library structure (Table — N columns, M rows):
 *   Row 1: block name
 *   Each subsequent row mirrors a source table row; cells hold the individual
 *   data points/labels.
 *
 * Source note: an HTML <table> with a header row (empty first cell + HSA / HRA /
 * FSA column headers) followed by feature rows (feature label + Yes/No/text value
 * per column). Column order HSA, HRA, FSA is preserved. Each source <tr> becomes
 * one block row; each <th>/<td> becomes one cell, faithfully mirroring the table.
 *
 * VALIDATION NOTE: the comparison table only appears on spending-accounts pages,
 * not on every page in the topic-hub-subnav template. When the validator's test
 * URL has no table, the selector correctly matches nothing ("No results found"),
 * which is expected — the parser is exercised only where a table is present.
 */
export default function parse(element, { document }) {
  const table = element.querySelector('table');

  // Empty-block guard
  if (!table) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const rows = Array.from(table.querySelectorAll(':scope > tbody > tr, :scope > tr'));
  if (rows.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Determine column count from the widest source row so every block row is padded evenly.
  let colCount = 0;
  rows.forEach((row) => {
    const c = row.querySelectorAll(':scope > th, :scope > td').length;
    if (c > colCount) colCount = c;
  });

  const cells = [];
  rows.forEach((row) => {
    const rowCells = Array.from(row.querySelectorAll(':scope > th, :scope > td'));
    const outRow = rowCells.map((cell) => {
      // Prefer the inner content nodes (h3/p/etc.); fall back to trimmed text.
      const inner = Array.from(cell.children);
      if (inner.length > 0) return inner;
      const text = (cell.textContent || '').trim();
      return text;
    });
    // Pad short rows so the table stays rectangular.
    while (outRow.length < colCount) outRow.push('');
    cells.push(outRow);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-minimal-dark-compare', cells });
  element.replaceWith(block);
}
