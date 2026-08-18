/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-minimal-light. Base: accordion.
 * Source: https://www.highmark.com/resources/answers/faq/aca-plans
 *         (div.col-lg-9 div.accordianTable — FAQ accordion group)
 * Generated: 2026-08-17
 *
 * Block library structure (Accordion — 2 columns, N rows):
 *   Row 1: block name
 *   Each accordion item row: [ title | content ]
 *     - title cell: the question text (from button.accordion-trigger)
 *     - content cell: the answer body (inner HTML of
 *       div.collapsible-item-description — paragraphs, lists, links preserved)
 *
 * Source note: div.accordianTable contains an H2 group heading (h2.maintitle)
 * followed by repeated div.collapsible-item. Each item has a
 * button.accordion-trigger holding the question (inside
 * span.collapsible-item-heading) and a div.collapsible-item-description
 * holding the answer. A trailing "Back to Top" link (.hmk-brand-buttons) is
 * chrome and is intentionally not emitted into the block.
 *
 * The group heading (h2.maintitle) is emitted as LEADING DEFAULT CONTENT
 * before the block so it renders as a section heading above the accordion.
 */
export default function parse(element, { document }) {
  // --- Leading default content: group heading ---
  const leadingEls = [];
  const heading = element.querySelector('h2.maintitle, .maintitle, h2');
  if (heading) leadingEls.push(heading);

  // --- Accordion items ---
  const items = Array.from(element.querySelectorAll('div.collapsible-item, .collapsible-item'));

  // Empty-block guard.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  items.forEach((item) => {
    // Question: prefer the heading span so we exclude the decorative icon span.
    const trigger = item.querySelector('button.accordion-trigger, .accordion-trigger');
    const headingSpan = item.querySelector(
      'span.collapsible-item-heading, .collapsible-item-heading',
    );
    let titleEl;
    if (headingSpan) {
      titleEl = document.createElement('p');
      titleEl.textContent = (headingSpan.textContent || '').replace(/\s+/g, ' ').trim();
    } else if (trigger) {
      titleEl = document.createElement('p');
      titleEl.textContent = (trigger.textContent || '').replace(/\s+/g, ' ').trim();
    } else {
      titleEl = document.createElement('p');
    }

    // Answer: the full description body, preserving inner HTML (p / ul / a).
    const desc = item.querySelector(
      'div.collapsible-item-description, .collapsible-item-description',
    );
    const contentCell = [];
    if (desc) {
      // Move the description's child nodes so paragraphs, lists, and links are
      // preserved as structured elements rather than flattened text.
      contentCell.push(...Array.from(desc.childNodes));
    }

    // 2-column row: [ title | content ]. Pad content if empty.
    cells.push([titleEl, contentCell.length ? contentCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'accordion-minimal-light',
    cells,
  });
  element.replaceWith(...leadingEls, block);
}
