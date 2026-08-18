/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroMinimalDarkWithimgParser from './parsers/hero-minimal-dark-withimg.js';
import cardsMinimalDarkWithimgParser from './parsers/cards-minimal-dark-withimg.js';
import cardsMinimalDarkWithimg2Parser from './parsers/cards-minimal-dark-withimg-2.js';
import columnsMinimalDarkParser from './parsers/columns-minimal-dark.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-sections.js';

// PARSER REGISTRY - Map block variant names to parser functions.
// Section-style entries (section-*) have no parser — the sections transformer
// applies their styling via Section Metadata, so they are intentionally absent here.
const parsers = {
  'hero-minimal-dark-withimg': heroMinimalDarkWithimgParser,
  'cards-minimal-dark-withimg': cardsMinimalDarkWithimgParser,
  'cards-minimal-dark-withimg-2': cardsMinimalDarkWithimg2Parser,
  'columns-minimal-dark': columnsMinimalDarkParser,
};

// TRANSFORMER REGISTRY - cleanup runs first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'topic-hub-landing',
  description: 'Landing page with full-width hero banner, centered intro, a three-up card grid of topic links, a tinted CTA band, and alternating image/text promo sections above the footer',
  urls: [
    'https://www.highmark.com/resources',
    'https://www.highmark.com/resources/mental-health-services',
    'https://www.highmark.com/resources/mental-health-services/anxiety',
    'https://www.highmark.com/resources/mental-health-services/depression',
    'https://www.highmark.com/resources/mental-health-services/eating-disorders',
    'https://www.highmark.com/resources/spending-accounts',
  ],
  blocks: [
    {
      name: 'hero-minimal-dark-withimg',
      instances: ['div.hero.responsivegrid.section'],
    },
    {
      name: 'cards-minimal-dark-withimg',
      instances: ['div.card-block.responsivegrid.section'],
    },
    {
      name: 'section-glossary-highlight',
      instances: ['div.onecard1colpanel.section'],
      section: 'highlight',
    },
    {
      name: 'section-columns-accent',
      instances: ['div.newcardscomponent-variations.section:nth-of-type(4)'],
      section: 'accent',
    },
    {
      name: 'columns-minimal-dark',
      instances: ['div.newcardscomponent-variations.section:nth-of-type(4)'],
    },
    {
      name: 'cards-minimal-dark-withimg-2',
      instances: ['div.newcardscomponent-variations.section:nth-of-type(5)'],
    },
  ],
};

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all block instances on the page based on the embedded template.
 * Skips section-* entries (no parser — handled by the sections transformer).
 * @param {Document} document
 * @param {Object} template
 * @returns {Array}
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    // Section-style markers are applied by the sections transformer, not parsed.
    if (blockDef.name.startsWith('section-')) return;

    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block. Skip elements already replaced by a prior parser.
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

    // 4. afterTransform (final cleanup + section breaks/metadata)
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
