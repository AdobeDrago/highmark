/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsMinimalLightSidenavParser from './parsers/cards-minimal-light-sidenav.js';
import accordionMinimalLightParser from './parsers/accordion-minimal-light.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-listing-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-minimal-light-sidenav': cardsMinimalLightSidenavParser,
  'accordion-minimal-light': accordionMinimalLightParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'sidebar-listing',
  description: 'Two-column layout with a left-hand section navigation sidebar and a main content column showing a heading, intro, and a list of linked items (or an FAQ accordion on faq/* pages)',
  urls: [
    'https://www.highmark.com/resources/answers/articles',
    'https://www.highmark.com/resources/answers/community-assistance-resources',
    'https://www.highmark.com/resources/answers/faq',
    'https://www.highmark.com/resources/answers/faq/aca-plans',
    'https://www.highmark.com/resources/answers/faq/chip',
    'https://www.highmark.com/resources/answers/faq/covid',
    'https://www.highmark.com/resources/answers/faq/ebill-help',
    'https://www.highmark.com/resources/answers/faq/ebill-terms',
    'https://www.highmark.com/resources/answers/faq/explanation-of-benefits',
    'https://www.highmark.com/resources/answers/faq/insurance-terms',
    'https://www.highmark.com/resources/answers/faq/measles',
    'https://www.highmark.com/resources/answers/faq/medicare-reservations',
    'https://www.highmark.com/resources/answers/faq/member-account-login',
    'https://www.highmark.com/resources/answers/faq/spending-accounts',
  ],
  blocks: [
    { name: 'cards-minimal-light-sidenav', instances: ['div.d-none.d-lg-block.col-lg-3 div.nav-container'] },
    { name: 'accordion-minimal-light', instances: ['div.col-lg-9 div.accordianTable'] },
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

/** Find all block instances on the page. */
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

    // 4. afterTransform (final cleanup)
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
