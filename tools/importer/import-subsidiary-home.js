/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
// Both card types and the help cards reuse the shared parsers unchanged. The hero uses a
// template wrapper around the shared hero parser that keeps the source's desktop, tablet
// and mobile renditions. The side panels use a template wrapper that delegates to the
// shared columns-minimal-dark parser, except for the health-options-de video panel
// (<video> in .youtube-container), which it emits as [ .mp4 link | content ] in the same block.
import heroMinimalDarkWithimgParser from './parsers/hero-minimal-dark-withimg-subsidiary-home.js';
import cardsMinimalDarkWithimgParser from './parsers/cards-minimal-dark-withimg.js';
import columnsMinimalDarkParser from './parsers/columns-minimal-dark-subsidiary-home.js';
import cardsMinimalDarkWithimg2Parser from './parsers/cards-minimal-dark-withimg-2.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import subsidiaryHomeCleanupTransformer from './transformers/highmark-subsidiary-home-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-minimal-dark-withimg': heroMinimalDarkWithimgParser,
  'cards-minimal-dark-withimg': cardsMinimalDarkWithimgParser,
  'columns-minimal-dark': columnsMinimalDarkParser,
  'cards-minimal-dark-withimg-2': cardsMinimalDarkWithimg2Parser,
};

// TRANSFORMER REGISTRY — site cleanup, subsidiary-brand chrome (own header/footer XFs)
// and hidden help-card line, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  subsidiaryHomeCleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "subsidiary-home",
  "description": "Subsidiary-brand home page (Highmark Health Options Delaware, Highmark Wholecare): landing photo hero, navy intro band, two plan cards (wide card-block or small-image card list), light-blue/blush CTA bands, image/video side panels, photo banner with CTA, and two help cards with phone numbers",
  "urls": [
    "https://www.highmark.com/health-options-de",
    "https://www.highmark.com/wholecare"
  ],
  "blocks": [
    {
      "name": "hero-minimal-dark-withimg",
      "instances": [
        "div.hero.responsivegrid.section",
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.image)"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg",
      "instances": [
        "div.card-block.responsivegrid.section:has(.cardBlock)",
        "div.newcardscomponent-variations.section:has(li.cardThree)"
      ]
    },
    {
      "name": "columns-minimal-dark",
      "instances": [
        "div.newcardscomponent-variations.section:has(.side-card-panel)"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg-2",
      "instances": [
        "div.newcardscomponent-variations.section:has(li.listWideImg)"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "hero",
      "selector": [
        "div.hero.responsivegrid.section"
      ],
      "style": null,
      "blocks": [
        "hero-minimal-dark-withimg"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "navy-intro",
      "selector": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-togatherblue)"
      ],
      "style": "dark, center",
      "blocks": [],
      "defaultContent": [
        ".one-card-content-center-container h2.d-lg-block",
        ".one-card-content-center-container .body-text.d-lg-block p"
      ]
    },
    {
      "id": "3",
      "name": "plan-cards",
      "selector": [
        "div.card-block.responsivegrid.section:has(.cardBlock)",
        "div.newcardscomponent-variations.section:has(li.cardThree)"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-dark-withimg"
      ],
      "defaultContent": [
        ".cardBlockTitleContainer h2",
        ".cardBlockTitleContainer .cardDescription p",
        "h2.cardsTitle",
        "p.cardsPara"
      ]
    },
    {
      "id": "4",
      "name": "find-care-band",
      "selector": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-fifteenpercent-splash)"
      ],
      "style": "light-blue, center",
      "blocks": [],
      "defaultContent": [
        ".one-card-content-center-container h2.d-lg-block",
        ".one-card-content-center-container .body-text.d-lg-block p",
        ".one-card-content-center-container .hmk-brand-buttons a"
      ]
    },
    {
      "id": "5",
      "name": "side-panel-white",
      "selector": [
        "div.newcardscomponent-variations.section:has(.side-card-panel):not(:has(.new-hmk-brand-fifteenpercent-splash)):not(:has(.global-helionlightblue))"
      ],
      "style": null,
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "6",
      "name": "photo-banner",
      "selector": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.image)"
      ],
      "style": null,
      "blocks": [
        "hero-minimal-dark-withimg"
      ],
      "defaultContent": []
    },
    {
      "id": "7",
      "name": "video-panel-light-blue",
      "selector": [
        "div.newcardscomponent-variations.section:has(.side-card-panel.new-hmk-brand-fifteenpercent-splash)"
      ],
      "style": "light-blue",
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "7b",
      "name": "side-panel-light",
      "selector": [
        "div.newcardscomponent-variations.section:has(.side-card-panel.global-helionlightblue)"
      ],
      "style": "light",
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "8",
      "name": "help-cards",
      "selector": [
        "div.newcardscomponent-variations.section:has(li.listWideImg)"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-dark-withimg-2"
      ],
      "defaultContent": []
    },
    {
      "id": "9",
      "name": "find-doctor-blush-band",
      "selector": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive)"
      ],
      "style": "highlight, center",
      "blocks": [],
      "defaultContent": [
        ".one-card-content-center-container h2.d-lg-block",
        ".one-card-content-center-container .body-text.d-lg-block p",
        ".one-card-content-center-container .hmk-brand-buttons a"
      ]
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
    // with the source label, and template=subsidiary-home (body class scoping).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    meta.template = 'subsidiary-home';
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
