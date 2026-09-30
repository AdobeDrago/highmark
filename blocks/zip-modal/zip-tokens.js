/*
 * ZIP token substitution.
 *
 * Authors place tokens in a shop document, in text or inside a link URL:
 * {{zip}} and {{region}} from the stored selection, plus any column of the
 * ZIP → region sheet for that ZIP ("Region Code" becomes {{region-code}},
 * "Marketplace" becomes {{marketplace}}, ...). Once the visitor submits the
 * ZIP/county modal, the tokens are filled in. A line (paragraph, heading, list
 * item) holding a token stays hidden until every token in it has a value, so
 * raw {{tokens}} or half-built links never show.
 */

import { getStoredZip, fetchRegions, findRegion } from './zip-store.js';

const TOKEN_RE = /\{\{\s*([a-z0-9-]+)\s*\}\}/gi;
const HAS_TOKEN_RE = /\{\{\s*[a-z0-9-]+\s*\}\}/i;

// Filled from the stored selection alone; any other token needs the sheet row.
const STORED_TOKENS = ['zip', 'region'];

// Remember each token-bearing text node's / link's original template so re-runs
// (and changing the ZIP later) always substitute from the authored source, not
// from already-substituted values.
const textTemplates = new WeakMap();
const hrefTemplates = new WeakMap();

const toKey = (name) => String(name).trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// The pipeline percent-encodes braces in link URLs ({{x}} arrives as %7B%7Bx%7D%7D).
function decodeHref(href) {
  try {
    return decodeURI(href);
  } catch (e) {
    return href;
  }
}

/**
 * Builds the token values for a stored selection: every non-empty column of
 * the ZIP's sheet row, plus {{zip}} and {{region}}.
 * @param {{zipCode: string, region: string}|null} stored
 * @param {Object[]} [rows=[]] ZIP → region sheet rows
 * @returns {Object<string, string>}
 */
export function tokenValues(stored, rows = []) {
  const values = {};
  if (!stored?.zipCode) return values;
  const row = findRegion(rows, stored.zipCode);
  if (row) {
    Object.entries(row).forEach(([column, value]) => {
      const text = String(value ?? '').trim();
      if (text) values[toKey(column)] = text;
    });
  }
  values.zip = stored.zipCode;
  if (stored.region) values.region = stored.region;
  return values;
}

function fill(template, values) {
  let complete = true;
  const result = template.replace(TOKEN_RE, (_, key) => {
    const value = values[key.toLowerCase()];
    if (!value) complete = false;
    return value || '';
  });
  return { result, complete };
}

// A filled-in link that leaves highmark.com, or opens a PDF, opens in a new tab
// (as the source's marketplace and plan-brochure links do).
function setLinkTarget(a) {
  let url;
  try {
    url = new URL(a.href);
  } catch (e) {
    return;
  }
  const offSite = url.origin !== window.location.origin
    && !/(^|\.)highmark\.com$/i.test(url.hostname);
  if (offSite || /\.pdf$/i.test(url.pathname)) {
    a.target = '_blank';
    a.rel = 'noopener';
  } else {
    a.removeAttribute('target');
    a.removeAttribute('rel');
  }
}

function collect(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (!textTemplates.has(node) && HAS_TOKEN_RE.test(node.nodeValue)) {
      textTemplates.set(node, node.nodeValue);
    }
    if (textTemplates.has(node)) nodes.push(node);
    node = walker.nextNode();
  }

  const links = [...root.querySelectorAll('a[href]')].filter((a) => {
    if (!hrefTemplates.has(a)) {
      const href = decodeHref(a.getAttribute('href'));
      if (HAS_TOKEN_RE.test(href)) hrefTemplates.set(a, href);
    }
    return hrefTemplates.has(a);
  });

  return { nodes, links };
}

const needsSheet = (templates) => templates.some((template) => [...template.matchAll(TOKEN_RE)]
  .some(([, key]) => !STORED_TOKENS.includes(key.toLowerCase())));

/**
 * Fills ZIP tokens on the page from the stored selection and its sheet row.
 * Safe to call multiple times.
 * @param {Element} [root=document.body] scope to scan
 * @param {Object[]} [rows] ZIP → region sheet rows; fetched when needed and omitted
 */
export default async function applyZipTokens(root = document.body, rows = null) {
  if (!root) return;
  const { nodes, links } = collect(root);
  if (!nodes.length && !links.length) return;

  const stored = getStoredZip();
  const templates = [
    ...nodes.map((n) => textTemplates.get(n)),
    ...links.map((a) => hrefTemplates.get(a)),
  ];
  let sheetRows = rows;
  if (!sheetRows && stored?.zipCode && needsSheet(templates)) sheetRows = await fetchRegions();
  const values = tokenValues(stored, sheetRows || []);

  // A line is ready only when every token in it (text and link) is filled.
  const lines = new Map();
  const track = (el, complete) => {
    const line = el?.closest('p, h1, h2, h3, h4, h5, h6, li, div');
    if (line) lines.set(line, (lines.get(line) ?? true) && complete);
  };

  nodes.forEach((textNode) => {
    const { result, complete } = fill(textTemplates.get(textNode), values);
    textNode.nodeValue = result;
    track(textNode.parentElement, complete);
  });

  links.forEach((a) => {
    const { result, complete } = fill(hrefTemplates.get(a), values);
    if (complete) {
      a.setAttribute('href', result);
      setLinkTarget(a);
    }
    track(a, complete);
  });

  lines.forEach((ready, line) => {
    line.classList.add('zip-token-line');
    line.classList.toggle('zip-token-ready', ready);
  });
}
