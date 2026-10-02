/*
 * What the visitor's ZIP/county selection changes on a page.
 *
 * - Tokens, in a link URL (or in text, though the DA editor drops {{…}} from text):
 *   {{zip}}, {{county}}, {{state}}, {{region}} and {{region-code}} from the selection,
 *   plus any column of the region's row in the regions sheet ("Marketplace" becomes
 *   {{marketplace}}, "Spanish Brochure" becomes {{spanish-brochure}}, ...). A line
 *   (paragraph, heading, list item) holding a token stays hidden until every token in
 *   it has a value, so raw {{tokens}} or half-built links never show.
 * - The location line: a section styled `zip-location` starts with
 *   "<County> County, <ST> <ZIP>".
 * - Region-only content: anything with a `Regions` section metadata list.
 */

import {
  DEFAULT_REGIONS_PATH, fetchSheet, getStoredZip, regionFor,
} from './zip-store.js';

const TOKEN_RE = /\{\{\s*([a-z0-9-]+)\s*\}\}/gi;
const HAS_TOKEN_RE = /\{\{\s*[a-z0-9-]+\s*\}\}/i;

// Filled from the stored selection alone; any other token needs the regions sheet.
const STORED_TOKENS = ['zip', 'county', 'state', 'region', 'region-code'];

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
 * Builds the token values for a stored selection: every non-empty column of the
 * region's row in the regions sheet, plus the selection itself.
 * @param {Object|null} stored selection from getStoredZip()
 * @param {Object[]} [regionRows=[]] regions sheet rows
 * @returns {Object<string, string>}
 */
export function tokenValues(stored, regionRows = []) {
  const values = {};
  if (!stored?.zipCode) return values;
  const row = regionFor(regionRows, stored.regionCode);
  if (row) {
    Object.entries(row).forEach(([column, value]) => {
      const text = String(value ?? '').trim();
      if (text) values[toKey(column)] = text;
    });
  }
  values.zip = stored.zipCode;
  values['region-code'] = stored.regionCode;
  if (stored.county) values.county = stored.county;
  if (stored.state) values.state = stored.state;
  if (stored.region && !values.region) values.region = stored.region;
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
 * Shows region-only content: an element with `data-regions` (a section's `Regions`
 * metadata, e.g. "SEPA" or "WPA, NEPA") shows only when the visitor's region is in
 * the list; "none" stands for a visitor who hasn't entered a ZIP yet.
 * @param {Element} [root=document.body]
 * @param {Object|null} [stored] selection; read from storage when omitted
 */
export function applyRegionVisibility(root = document.body, stored = getStoredZip()) {
  const code = (stored?.regionCode || 'none').toUpperCase();
  root.querySelectorAll('[data-regions]').forEach((el) => {
    const codes = el.dataset.regions.split(',').map((c) => c.trim().toUpperCase());
    el.hidden = !codes.includes(code);
  });
}

/**
 * Starts each `zip-location` section's first paragraph with "<County> County, <ST>
 * <ZIP>", replacing any authored text before its first link or line break, and keeps
 * the line hidden until there is a selection. Built here rather than from {{tokens}},
 * which the DA editor drops from text.
 * @param {Element} root
 * @param {Object|null} stored selection
 */
function fillLocations(root, stored) {
  root.querySelectorAll('.zip-location').forEach((section) => {
    const p = section.querySelector('p');
    if (!p) return;
    // a paragraph holding only the "Change area" link gets button styling; keep it a link
    p.classList.remove('button-container');
    p.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
    let place = p.querySelector('.zip-location-place');
    if (!place) {
      while (p.firstChild && !['A', 'BR'].includes(p.firstChild.nodeName)) p.firstChild.remove();
      place = document.createElement('span');
      place.className = 'zip-location-place';
      p.prepend(place);
      if (place.nextSibling?.nodeName !== 'BR') place.after(document.createElement('br'));
    }
    const ready = Boolean(stored?.county);
    place.textContent = ready ? `${stored.county} County, ${stored.state} ${stored.zipCode}` : '';
    p.classList.add('zip-token-line');
    p.classList.toggle('zip-token-ready', ready);
  });
}

/**
 * Fills {{tokens}} in text and link URLs under root.
 * @param {Element} root
 * @param {Object|null} stored selection
 * @param {Object[]|null} regionRows regions sheet rows; fetched when needed and omitted
 */
async function fillTokens(root, stored, regionRows) {
  const { nodes, links } = collect(root);
  if (!nodes.length && !links.length) return;

  const templates = [
    ...nodes.map((n) => textTemplates.get(n)),
    ...links.map((a) => hrefTemplates.get(a)),
  ];
  let rows = regionRows;
  if (!rows && stored && needsSheet(templates)) rows = await fetchSheet(DEFAULT_REGIONS_PATH);
  const values = tokenValues(stored, rows || []);

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

/**
 * Applies the stored selection to the page: region-only content, tokens and the
 * location line. Safe to call multiple times.
 * @param {Element} [root=document.body] scope to scan
 * @param {Object[]} [regionRows] regions sheet rows; fetched when needed and omitted
 */
export default async function applyZipTokens(root = document.body, regionRows = null) {
  if (!root) return;
  const stored = getStoredZip();
  applyRegionVisibility(root, stored);
  await fillTokens(root, stored, regionRows);
  fillLocations(root, stored);
}
