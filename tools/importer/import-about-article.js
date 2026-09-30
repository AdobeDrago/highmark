/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsMinimalLightSidenavParser from './parsers/cards-minimal-light-sidenav.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-minimal-light-sidenav': cardsMinimalLightSidenavParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "about-article",
  "description": "About / Corporate Responsibility article: left section navigation, long-form article (headings, paragraphs, lists, images) and an optional right-rail callout",
  "urls": [
    "https://www.highmark.com/about/our-story",
    "https://www.highmark.com/about/our-story/mission-vision",
    "https://www.highmark.com/about/our-story/our-businesses",
    "https://www.highmark.com/about/corporate-responsibility",
    "https://www.highmark.com/about/corporate-responsibility/valuing-our-people",
    "https://www.highmark.com/about/corporate-responsibility/social-determinants-of-health",
    "https://www.highmark.com/about/corporate-responsibility/sustainability"
  ],
  "blocks": [
    {
      "name": "cards-minimal-light-sidenav",
      "instances": [
        "div.d-none.d-lg-block.col-lg-3 div.nav-container:has(.sidenav)",
        "div.d-none.d-lg-block.col-lg-3 div.nav-container"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "sidenav",
      "selector": [
        "div.d-none.d-lg-block.col-lg-3 div.nav-container:has(.sidenav)",
        "div.d-none.d-lg-block.col-lg-3 div.nav-container"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-light-sidenav"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "article",
      "selector": [
        "div.col-lg-9 > div.row > div.col-lg-9 div.page__par",
        "div.col-lg-9 div.page__par"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "right-rail",
      "selector": [
        "div.rightRail"
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
    // with the source label, and template=about-article (body class scoping).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    meta.template = 'about-article';
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
