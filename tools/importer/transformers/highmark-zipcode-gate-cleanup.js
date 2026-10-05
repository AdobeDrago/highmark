/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Highmark ZIP code gate page (template zipcode-gate-login,
 * e.g. https://www.highmark.com/zipcode-gate-login).
 *
 * Runs after highmark-cleanup.js and before highmark-template-sections.js.
 * The content lives in one AEM grid (the .aem-Grid that contains #txt-zipcode),
 * verified in migration-work/cleaned.html:
 *  - fixed-height spacer columns (div.spacing > section.spacing-transparent)
 *  - the intro line marked up as div.cmp-text > h5 right after the H1
 *  - a single-item accordion (div.accordiontable) explaining
 *    "employer-sponsored health insurance"
 *  - paragraphs ending with "&nbsp;"
 *
 * The ZIP input (div.input) and button (div.button) are left untouched; the
 * zip-county-form block parser replaces them.
 *
 * Everything is scoped to that grid, so pages without #txt-zipcode are untouched.
 */

const NBSP = /\u00a0/g;

function isBlankText(node) {
  return node.nodeType === 3 && !node.textContent.replace(NBSP, ' ').trim();
}

function trimTrailing(p) {
  let node = p.lastChild;
  while (node) {
    if (node.nodeName === 'BR' || isBlankText(node)) {
      const prev = node.previousSibling;
      node.remove();
      node = prev;
    } else if (node.nodeType === 3) {
      node.textContent = node.textContent.replace(/[\s\u00a0]+$/, '');
      break;
    } else {
      break;
    }
  }
}

export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;

  const zip = element.querySelector('#txt-zipcode');
  if (!zip) return;
  const grid = zip.closest('.aem-Grid');
  if (!grid) return;
  const doc = element.ownerDocument || document;

  // 1. Fixed spacer columns.
  WebImporter.DOMUtils.remove(grid, ['.spacing']);

  // 2. Intro line h5 -> paragraph (avoids skipping heading levels after the H1).
  grid.querySelectorAll('.cmp-text > h5').forEach((h5) => {
    const p = doc.createElement('p');
    p.innerHTML = h5.innerHTML;
    h5.replaceWith(p);
  });

  // 3. Single-item accordion -> bold question paragraph + answer paragraph(s).
  grid.querySelectorAll('.accordiontable').forEach((acc) => {
    const nodes = [];
    acc.querySelectorAll('.collapsible-item').forEach((item) => {
      const heading = item.querySelector('.collapsible-item-heading');
      const question = heading ? heading.textContent.trim() : '';
      if (question) {
        const p = doc.createElement('p');
        const strong = doc.createElement('strong');
        strong.textContent = question;
        p.append(strong);
        nodes.push(p);
      }
      item.querySelectorAll('.collapsible-item-description p').forEach((answer) => {
        nodes.push(answer.cloneNode(true));
      });
    });
    if (nodes.length) {
      acc.replaceWith(...nodes);
    } else {
      acc.remove();
    }
  });

  // 4. Trailing &nbsp; / whitespace / <br> at paragraph ends; normalise &nbsp; inside bold runs.
  grid.querySelectorAll('p').forEach((p) => {
    p.querySelectorAll('b, strong').forEach((b) => {
      b.childNodes.forEach((n) => {
        if (n.nodeType === 3) n.textContent = n.textContent.replace(NBSP, ' ');
      });
    });
    trimTrailing(p);
  });
}
