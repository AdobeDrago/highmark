/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroMinimalDarkWithimgParser from './parsers/hero-minimal-dark-withimg.js';
import columnsMinimalDarkParser from './parsers/columns-minimal-dark.js';
import cardsMinimalDarkListParser from './parsers/cards-minimal-dark-list.js';
import cardsMinimalDarkWithimg2Parser from './parsers/cards-minimal-dark-withimg-2.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-minimal-dark-withimg': heroMinimalDarkWithimgParser,
  'columns-minimal-dark': columnsMinimalDarkParser,
  'cards-minimal-dark-list': cardsMinimalDarkListParser,
  'cards-minimal-dark-withimg-2': cardsMinimalDarkWithimg2Parser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "blue-neighbors",
  "description": "Blue Neighbors volunteer program: secondary banner, centered polar intro with logo, request/become-a-volunteer side panels, monthly event text cards, wide help cards and compliance code",
  "urls": [
    "https://www.highmark.com/plans/medicare/blue-neighbors"
  ],
  "blocks": [
    {
      "name": "hero-minimal-dark-withimg",
      "instances": [
        "div.secondary-banner.responsivegrid"
      ]
    },
    {
      "name": "columns-minimal-dark",
      "instances": [
        "section#request div.newcardscomponent-variations:has(.side-card-panel)"
      ]
    },
    {
      "name": "cards-minimal-dark-list",
      "instances": [
        "div.newcardscomponent-variations.section:has(ul.gridcardsul):not(:has(.listWideImg))"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg-2",
      "instances": [
        "div.newcardscomponent-variations.section:has(.listWideImg)"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "banner",
      "selector": [
        "div.secondary-banner.responsivegrid"
      ],
      "style": null,
      "blocks": [
        "hero-minimal-dark-withimg"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "intro",
      "selector": [
        "div.onecard1colpanel.section"
      ],
      "style": "light, center",
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "request-volunteer",
      "selector": [
        "section#request div.newcardscomponent-variations:first-child"
      ],
      "style": null,
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "4",
      "name": "become-volunteer",
      "selector": [
        "section#request div.newcardscomponent-variations:nth-child(2)"
      ],
      "style": "light",
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "5",
      "name": "events",
      "selector": [
        "div.newcardscomponent-variations.section:has(ul.gridcardsul):not(:has(.listWideImg))"
      ],
      "style": "center",
      "blocks": [
        "cards-minimal-dark-list"
      ],
      "defaultContent": []
    },
    {
      "id": "6",
      "name": "questions",
      "selector": [
        "div.newcardscomponent-variations.section:has(.listWideImg)"
      ],
      "style": "light",
      "blocks": [
        "cards-minimal-dark-withimg-2"
      ],
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

    // "LEARN MORE" points at the source wrapper #request, which doesn't survive the
    // import; point it at the "Request a Volunteer" heading id instead.
    main.querySelectorAll('a[href="#request"]').forEach((a) => a.setAttribute('href', '#request-a-volunteer'));

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
    // with the source label, and template=blue-neighbors (body class scoping).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    meta.template = 'blue-neighbors';
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
