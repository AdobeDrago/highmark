/*
 * ZIP token substitution.
 *
 * Authors place tokens like {{region}} or {{zip}} in the document (e.g. above
 * and below the hero). Once the visitor submits the ZIP/county modal, those
 * tokens are replaced with the stored values. Lines that contain a token are
 * hidden until a value is available so raw {{region}} never flashes on screen.
 */

const STORAGE_KEY = 'shop-zip-county';
const TOKEN_RE = /\{\{\s*(region|zip)\s*\}\}/gi;

// Remember each token-bearing element's original template so re-runs (and
// changing the value later) always substitute from the source, not from
// already-substituted text.
const templates = new WeakMap();

function getStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function tokenValues(stored) {
  return {
    region: stored?.region || '',
    zip: stored?.zipCode || '',
  };
}

/**
 * Applies stored ZIP/region values to any {{region}}/{{zip}} tokens on the page.
 * Safe to call multiple times.
 * @param {Element} [root=document.body] scope to scan
 */
export default function applyZipTokens(root = document.body) {
  if (!root) return;
  const stored = getStored();
  const values = tokenValues(stored);
  const hasValue = Boolean(stored && (values.region || values.zip));

  // Find text nodes that contain a token; walk from cached templates when present.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node = walker.nextNode();
  while (node) {
    const template = templates.get(node);
    if (template !== undefined) {
      nodes.push(node);
    } else if (TOKEN_RE.test(node.nodeValue)) {
      TOKEN_RE.lastIndex = 0;
      templates.set(node, node.nodeValue);
      nodes.push(node);
    }
    node = walker.nextNode();
  }

  nodes.forEach((textNode) => {
    const template = templates.get(textNode);
    textNode.nodeValue = template.replace(
      TOKEN_RE,
      (_, key) => values[key.toLowerCase()] || '',
    );

    // Hide the nearest block ancestor until we have a value, so placeholder
    // lines don't show empty or with raw tokens.
    const block = textNode.parentElement?.closest('p, h1, h2, h3, h4, h5, h6, li, div');
    if (block) {
      block.classList.add('zip-token-line');
      block.classList.toggle('zip-token-ready', hasValue);
    }
  });
}
