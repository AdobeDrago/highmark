/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroMinimalDarkWithimgParser from './parsers/hero-minimal-dark-withimg.js';
import cardsMinimalDarkIconnavParser from './parsers/cards-minimal-dark-iconnav.js';
import columnsMinimalDarkParser from './parsers/columns-minimal-dark.js';
import cardsMinimalDarkWithimgParser from './parsers/cards-minimal-dark-withimg.js';
import cardsMinimalDarkListParser from './parsers/cards-minimal-dark-list.js';
import cardsMinimalDarkWithimg2Parser from './parsers/cards-minimal-dark-withimg-2.js';
import tableMinimalDarkCompareParser from './parsers/table-minimal-dark-compare.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-subnav-sections.js';

// PARSER REGISTRY — section-* entries have no parser (styled via the sections transformer).
const parsers = {
  'hero-minimal-dark-withimg': heroMinimalDarkWithimgParser,
  'cards-minimal-dark-iconnav': cardsMinimalDarkIconnavParser,
  'columns-minimal-dark': columnsMinimalDarkParser,
  'cards-minimal-dark-withimg': cardsMinimalDarkWithimgParser,
  'cards-minimal-dark-list': cardsMinimalDarkListParser,
  'cards-minimal-dark-withimg-2': cardsMinimalDarkWithimg2Parser,
  'table-minimal-dark-compare': tableMinimalDarkCompareParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'topic-hub-subnav',
  description: 'Sub-topic detail page: full-bleed hero, an icon quick-nav bar linking to child topics, alternating image/text info sections, promo cards, and (on some pages) a comparison table and video call-to-actions.',
  urls: [
    'https://www.highmark.com/resources/mental-health-services/anxiety',
    'https://www.highmark.com/resources/mental-health-services/depression',
    'https://www.highmark.com/resources/mental-health-services/eating-disorders',
    'https://www.highmark.com/resources/spending-accounts',
  ],
  blocks: [
    { name: 'hero-minimal-dark-withimg', instances: ['div.hero.responsivegrid.section'] },
    { name: 'cards-minimal-dark-iconnav', instances: ['div.quicklinks.section'] },
    {
      name: 'columns-minimal-dark',
      instances: [
        'div.newcardscomponent-variations.section:has(.side-card-panel)',
        'section.container-fluid-fullwidth.section:has(.side-card-panel)',
      ],
    },
    {
      name: 'cards-minimal-dark-withimg',
      instances: [
        'div.newcardscomponent-variations.section:has(ul.gridcardsul):has(.cardThree picture)',
        'div.newcardscomponent-variations.section:has(ul.gridcardsul):has(.cardThree img)',
        'section.container-fluid-fullwidth.section:has(.cardText)',
      ],
    },
    {
      name: 'cards-minimal-dark-list',
      instances: ['div.newcardscomponent-variations.section:has(ul.gridcardsul):not(:has(picture)):not(:has(img))'],
    },
    { name: 'cards-minimal-dark-withimg-2', instances: ['div.newcardscomponent-variations.section:has(.listWideImg)'] },
    {
      name: 'table-minimal-dark-compare',
      instances: ['.dynamic-table-container', 'section.container-fluid-fullwidth.section:has(table)'],
    },
    { name: 'section-crisis-highlight', instances: ['div.onecard1colpanel.section'], section: 'highlight' },
  ],
};

/**
 * Execute all page transformers for a hook.
 */
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

/**
 * Find all block instances on the page. Skips section-* markers (no parser).
 * Guards against double-matching: an element already claimed by an earlier
 * block definition is not re-collected by a later, broader selector.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const claimed = new Set();

  template.blocks.forEach((blockDef) => {
    if (blockDef.name.startsWith('section-')) return;

    blockDef.instances.forEach((selector) => {
      let elements;
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for ${blockDef.name}: ${selector}`, e);
        return;
      }
      elements.forEach((element) => {
        if (claimed.has(element)) return; // already claimed by an earlier block
        claimed.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (cleanup + section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced by a prior parser.
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (map root URL to /index to avoid empty-path crash)
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
