/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroMinimalLightParser from './parsers/hero-minimal-light.js';
import cardsMinimalDarkIconnavParser from './parsers/cards-minimal-dark-iconnav.js';
import accordionMinimalLightParser from './parsers/accordion-minimal-light.js';
import cardsMinimalDarkListParser from './parsers/cards-minimal-dark-list.js';
import columnsMinimalDarkParser from './parsers/columns-minimal-dark.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-answers-sections.js';

// PARSER REGISTRY — section-* entries are styled by the sections transformer.
const parsers = {
  'hero-minimal-light': heroMinimalLightParser,
  'cards-minimal-dark-iconnav': cardsMinimalDarkIconnavParser,
  'accordion-minimal-light': accordionMinimalLightParser,
  'cards-minimal-dark-list': cardsMinimalDarkListParser,
  'columns-minimal-dark': columnsMinimalDarkParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'tabbed-answers-landing',
  description: 'Landing page with hero banner, an icon tab/quick-nav bar, an FAQ accordion section, a three-up card grid, and alternating image/text promo and resource sections',
  urls: [
    'https://www.highmark.com/resources/answers',
    'https://www.highmark.com/resources/answers/health-insurance-glossary',
    'https://www.highmark.com/resources/spending-accounts/commuter-benefits-account',
    'https://www.highmark.com/resources/spending-accounts/flexible-spending-account-fsa',
    'https://www.highmark.com/resources/spending-accounts/health-saving-account-hsa',
    'https://www.highmark.com/resources/spending-accounts/health-reimbursement-arrangement-hra',
  ],
  blocks: [
    { name: 'hero-minimal-light', instances: ['section.new-hmk-brand-fifteenpercent-splash'] },
    { name: 'cards-minimal-dark-iconnav', instances: ['div.quicklinks.section', '.quick-link-list-container.bg-blue'] },
    { name: 'accordion-minimal-light', instances: ['div.col-lg-9 div.accordianTable', '.accordianTable'] },
    { name: 'cards-minimal-dark-list', instances: ['.newcardscomponent-variations:has(.cards-variation) .cards-variation'] },
    {
      name: 'columns-minimal-dark',
      instances: ['.side-card-panel.new-hmk-brand-blush-twnetyfive', '.newcardscomponent-variations:last-of-type .side-card-panel'],
    },
    { name: 'section-glossary-highlight', instances: ['.one-card-one-col-panel.new-hmk-brand-darkblue'], section: 'highlight' },
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

/** Find all block instances on the page. Skips section-* markers. */
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
        if (claimed.has(element)) return;
        // Skip an element already contained by (or containing) a claimed one to
        // avoid a broad fallback selector double-claiming a nested block.
        for (const c of claimed) {
          if (c.contains(element) || element.contains(c)) return;
        }
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
