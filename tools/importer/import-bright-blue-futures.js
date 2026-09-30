/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroMinimalDarkWithimgParser from './parsers/hero-minimal-dark-withimg.js';
import columnsMinimalDarkParser from './parsers/columns-minimal-dark.js';
import cardsMinimalDarkWithimgIconsParser from './parsers/cards-minimal-dark-withimg-icons.js';
import cardsMinimalDarkWithimg2Parser from './parsers/cards-minimal-dark-withimg-2.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-minimal-dark-withimg': heroMinimalDarkWithimgParser,
  'columns-minimal-dark': columnsMinimalDarkParser,
  'cards-minimal-dark-withimg-icons': cardsMinimalDarkWithimgIconsParser,
  'cards-minimal-dark-withimg-2': cardsMinimalDarkWithimg2Parser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "bright-blue-futures",
  "description": "Bright Blue Futures corporate-giving landing: photo hero, logo, alternating white/polar side panels, illustration cards, blush report CTA, wide program cards, splash CTA band, video disclaimer footnote.",
  "urls": [
    "https://www.highmark.com/about/corporate-responsibility/bright-blue-futures"
  ],
  "blocks": [
    {
      "name": "hero-minimal-dark-withimg",
      "instances": [
        "div.hero.responsivegrid.section"
      ]
    },
    {
      "name": "columns-minimal-dark",
      "instances": [
        "div.newcardscomponent-variations.section:has(.side-card-panel)"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg-icons",
      "instances": [
        "div.newcardscomponent-variations.section:has(li.listSmlImg)"
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
      "id": "hero",
      "name": "Hero",
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
      "id": "logo",
      "name": "Logo",
      "selector": [
        "section.container-fluid-fullwidth.section:has(img.image-comp-img)"
      ],
      "style": "center",
      "blocks": [],
      "defaultContent": [
        "img.image-comp-img"
      ]
    },
    {
      "id": "side-panel-white",
      "name": "Side panel (white)",
      "selector": [
        "div.newcardscomponent-variations.section:has(.side-card-panel:not(.new-hmk-brand-polar))"
      ],
      "style": null,
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": [],
      "repeat": true
    },
    {
      "id": "side-panel-polar",
      "name": "Side panel (polar band)",
      "selector": [
        "div.newcardscomponent-variations.section:has(.side-card-panel.new-hmk-brand-polar)"
      ],
      "style": "light",
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": [],
      "repeat": true
    },
    {
      "id": "focus-areas",
      "name": "Focus areas cards",
      "selector": [
        "div.newcardscomponent-variations.section:has(li.listSmlImg)"
      ],
      "style": "center",
      "blocks": [
        "cards-minimal-dark-withimg-icons"
      ],
      "defaultContent": [
        "div.newcardscomponent-variations.section:has(li.listSmlImg) h2.cardsTitle",
        "div.newcardscomponent-variations.section:has(li.listSmlImg) p.cardsPara"
      ]
    },
    {
      "id": "impact-report",
      "name": "Community Impact Report (blush)",
      "selector": [
        "section.container-fluid-fullwidth.section:has(.new-hmk-brand-blush-twnetyfive)"
      ],
      "style": "highlight, center",
      "blocks": [],
      "defaultContent": [
        ".one-card-content-center-container h2.d-lg-block",
        ".one-card-content-center-container .body-text.d-lg-block",
        ".hmk-brand-buttons a"
      ]
    },
    {
      "id": "program-cards",
      "name": "Program wide cards",
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
      "id": "blue-fund",
      "name": "Introducing Blue Fund (splash)",
      "selector": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-fifteenpercent-splash)"
      ],
      "style": "light-blue, center",
      "blocks": [],
      "defaultContent": [
        ".one-card-content-center-container h2.d-lg-block",
        ".one-card-content-center-container .body-text.d-lg-block",
        ".hmk-brand-buttons a"
      ]
    },
    {
      "id": "footnotes",
      "name": "Video disclaimer footnote",
      "selector": [
        "section.container-fluid-fullwidth.section:has(> div.container):has(.cmp-text)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".cmp-text p"
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
    // with the source label, and template=bright-blue-futures (body class scoping).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    meta.template = 'bright-blue-futures';
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
