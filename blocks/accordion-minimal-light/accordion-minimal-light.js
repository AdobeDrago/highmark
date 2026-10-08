/*
 * Accordion Block - minimal light variant
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 *
 * Light-styled FAQ accordion used by the sidebar-listing FAQ pages
 * (white background, light-blue tinted open answer panels, dark-blue text).
 * Authoring model: one row per Q&A item. Cell 1 = question label,
 * cell 2 = answer body (paragraphs, bulleted lists, inline links).
 */

export default function decorate(block) {
  // CHIP article accordions (template=chip -> body.chip) and the answers landing's FAQ
  // (template=answers-landing) open the first item by default, matching the source;
  // sidebar FAQ pages keep all closed.
  const openFirst = ['chip', 'answers-landing'].some((t) => document.body.classList.contains(t));
  [...block.children].forEach((row, index) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-minimal-light-item-label';
    summary.append(...label.childNodes);
    // decorate accordion item body
    const body = row.children[1];
    body.className = 'accordion-minimal-light-item-body';
    // decorate accordion item
    const details = document.createElement('details');
    details.className = 'accordion-minimal-light-item';
    if (openFirst && index === 0) details.open = true;
    details.append(summary, body);
    row.replaceWith(details);
  });
}
