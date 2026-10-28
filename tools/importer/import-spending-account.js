/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsMinimalDarkIconnavParser from './parsers/cards-minimal-dark-iconnav.js';
import columnsMinimalDarkParser from './parsers/columns-minimal-dark.js';
import tableMinimalDarkCompareParser from './parsers/table-minimal-dark-compare.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-spending-sections.js';

/**
 * Text-card grid (div.card-block: a centred heading and intro over cards that are a
 * heading and text, with a photo on top on some pages: Commuter Benefits) -> the
 * heading and intro as default content, then a `Cards` block with one card per row
 * ([photo |] text).
 */
function textCardsParser(element, { document }) {
  const title = element.querySelector('.cardBlockTitleContainer');
  const nodes = title ? [...title.querySelectorAll(':scope > h2, :scope > .cardDescription > *')] : [];
  const cells = [...element.querySelectorAll('.cardBlock')].map((card) => {
    const text = card.querySelector('.cardText');
    const img = card.querySelector('img');
    return img ? [img, [...text.children]] : [[...text.children]];
  });
  if (!cells.length) return;
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', cells });
  element.replaceWith(...nodes, block);
}

// PARSER REGISTRY
const parsers = {
  'cards-minimal-dark-iconnav': cardsMinimalDarkIconnavParser,
  'columns-minimal-dark': columnsMinimalDarkParser,
  'table-minimal-dark-compare': tableMinimalDarkCompareParser,
  cards: textCardsParser,
};

// TRANSFORMER REGISTRY - cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'spending-account',
  description: 'Spending-account page: a light-blue title band, the account quick-link bar, a centred intro, side panels (text and a photo, alternating sides), text-card grids, data tables and footnotes',
  urls: [
    'https://www.highmark.com/resources/spending-accounts/health-saving-account-hsa',
    'https://www.highmark.com/resources/spending-accounts/health-reimbursement-arrangement-hra',
  ],
  blocks: [
    // the FSA / commuter / HSA limits and savings tables: the table block's "data" variant
    { name: 'table-minimal-dark-compare', instances: ['.dynamic-table-container'] },
    { name: 'cards-minimal-dark-iconnav', instances: ['div.quicklinks.section'] },
    { name: 'columns-minimal-dark', instances: ['div.newcardscomponent-variations.section:has(.side-card-panel)'] },
    { name: 'cards', instances: ['div.card-block.section:has(.cardBlock)'] },
  ],
};

/** Execute all page transformers for a hook. */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/** Find all block instances on the page; an element is claimed once. */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const claimed = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (claimed.has(element)) return;
        claimed.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  // A side panel's empty spacer paragraph (one line above "WATCH VIDEO") is kept as a
  // zero-width space, on the live page: the importer copies the page before the
  // transform, and the pipeline drops a blank paragraph.
  // Each spacing component's height on the live page (the importer's desktop width)
  // is kept for the sections transformer: its classes give tablet and phone heights
  // (tab-/mob-*-padding) but not always the desktop one.
  onLoad: ({ document }) => {
    document.querySelectorAll('.spacing section').forEach((s) => {
      s.setAttribute('data-space', Math.round(s.getBoundingClientRect().height));
    });
    document.querySelectorAll('.side-card-panel p').forEach((p) => {
      if (!p.querySelector('img, br, a') && !p.textContent.replace(/[\s\u00a0]/g, '')) p.textContent = '\u200b';
    });
  },

  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // Source breadcrumb label for this page, read before cleanup removes the
    // breadcrumb row; pages without a source breadcrumb don't get one either.
    const crumb = document.querySelector('ol.breadcrumb-list li.active');
    const crumbLabel = (crumb?.textContent || '').replace(/\s+/g, ' ').trim();

    // Screen-reader-only text inside links is not copy.
    main.querySelectorAll('a .sr-only, a .visually-hidden, a .hmk-visually-hidden, a [class*="screen-reader"]').forEach((el) => el.remove());
    main.querySelectorAll('a em, a span').forEach((el) => {
      if (/^opens (in )?a new (tab|window)( or (tab|window))?\.?$/i.test(el.textContent.trim())) el.remove();
    });

    // Empty button placeholders (a.textButton holding only screen-reader text) go.
    main.querySelectorAll('a').forEach((a) => {
      if (!(a.getAttribute('href') || '').trim() && !a.textContent.trim() && !a.querySelector('img')) a.remove();
    });
    main.querySelectorAll('.hmk-brand-buttons').forEach((el) => { if (!el.textContent.trim()) el.remove(); });

    // A bold link sharing its paragraph ("WATCH VIDEO", then "See disclaimer below¹")
    // stays in the text: the bold moves inside the link, so the columns parser doesn't
    // take it for a CTA and move it after the copy.
    main.querySelectorAll('p > b > a[href], p > strong > a[href]').forEach((a) => {
      const bold = a.parentElement;
      const p = bold.parentElement;
      if (bold.childNodes.length !== 1 || p.textContent.trim() === a.textContent.trim()) return;
      const strong = document.createElement('strong');
      strong.append(...a.childNodes);
      a.append(strong);
      bold.replaceWith(a);
    });

    // Data tables (limits, savings) are the table block's "data" variant.
    main.querySelectorAll('.dynamic-table-container').forEach((el) => el.setAttribute('data-block-variant', 'data'));

    // 1. beforeTransform (cleanup + section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced by a prior parser.
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      try {
        parser(block.element, { document, url, params });
      } catch (e) {
        console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
      }
    });

    // 4. afterTransform (final cleanup + section metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules; page metadata: the source's meta tags, the
    // template, and breadcrumbs with the source's label.
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    meta.Template = 'spending-account';
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
