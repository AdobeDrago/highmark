/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroMinimalLightParser from './parsers/hero-minimal-light.js';
import cardsMinimalDarkWithimgParser from './parsers/cards-minimal-dark-withimg.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-minimal-light': heroMinimalLightParser,
  'cards-minimal-dark-withimg': cardsMinimalDarkWithimgParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "learn-about-medicare",
  "description": "Medicare article hub: light-blue intro hero, 3-up grid of 18 article image cards, blush \"Understand your Medicare options\" CTA band and disclaimers",
  "urls": [
    "https://www.highmark.com/plans/medicare/learn-about-medicare"
  ],
  "blocks": [
    {
      "name": "hero-minimal-light",
      "instances": [
        "section.container-fluid-fullwidth.section:has(.new-hmk-brand-fifteenpercent-splash)"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg",
      "instances": [
        "div.newcardscomponent-variations.section:has(ul.gridcardsul):has(.cardThree img)"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "intro",
      "selector": [
        "section.container-fluid-fullwidth.section:has(.new-hmk-brand-fifteenpercent-splash)"
      ],
      "style": null,
      "blocks": [
        "hero-minimal-light"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "article-cards",
      "selector": [
        "div.newcardscomponent-variations.section:has(ul.gridcardsul):has(.cardThree img)"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-dark-withimg"
      ],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "options-cta",
      "selector": [
        "section.container-fluid-fullwidth.section:has(.new-hmk-brand-blush-twnetyfive)"
      ],
      "style": "highlight, center",
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "4",
      "name": "disclaimers",
      "selector": [
        "section.container-fluid-fullwidth.section:has(> div.container)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": []
    }
  ]
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
 * Find all block instances on the page. An element already claimed by an earlier
 * block definition is not re-collected by a later, broader selector.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const claimed = new Set();
  template.blocks.forEach((blockDef) => {
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

    // Source breadcrumb label for this page, read before cleanup removes the
    // breadcrumb row; pages without a source breadcrumb don't get one either.
    const crumb = document.querySelector('ol.breadcrumb-list li.active');
    const crumbLabel = (crumb?.textContent || '').replace(/\s+/g, ' ').trim();

    // Global nav / search bar and the breadcrumb + print/share row, on layouts
    // without a <header> element (highmark-cleanup.js removes <header> only).
    WebImporter.DOMUtils.remove(main, [
      '.experiencefragment:has(.main-search-bar)',
      '.experiencefragment:has(.footer-list)',
      'div.breadcrumb',
    ]);

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

    // 5. Page metadata: source meta tags, breadcrumbs (when the source has them)
    // with the source label, and template=learn-about-medicare (body class scoping).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    meta.template = 'learn-about-medicare';
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
