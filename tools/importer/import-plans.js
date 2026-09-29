/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroMinimalDarkWithimgParser from './parsers/hero-minimal-dark-withimg.js';
import cardsMinimalDarkWithimgIconsParser from './parsers/cards-minimal-dark-withimg-icons.js';
import cardsMinimalDarkWithimgParser from './parsers/cards-minimal-dark-withimg.js';
import columnsMinimalDarkParser from './parsers/columns-minimal-dark.js';
import cardsMinimalDarkWithimg2Parser from './parsers/cards-minimal-dark-withimg-2.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-plans-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-minimal-dark-withimg': heroMinimalDarkWithimgParser,
  'cards-minimal-dark-withimg-icons': cardsMinimalDarkWithimgIconsParser,
  'cards-minimal-dark-withimg': cardsMinimalDarkWithimgParser,
  'columns-minimal-dark': columnsMinimalDarkParser,
  'cards-minimal-dark-withimg-2': cardsMinimalDarkWithimg2Parser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "plans",
  "description": "Plans landing page: full-bleed hero, navy intro band, icon feature card rows, photo banner, image card grid on grey, image/text columns on light blue, wide help cards, blush CTA band and footnotes",
  "urls": [
    "https://www.highmark.com/plans/individual-families"
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
      "name": "cards-minimal-dark-withimg-icons",
      "instances": [
        "div.card-block.responsivegrid.section:has(.cardWrapper.ghostMode)"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg",
      "instances": [
        "section.container-fluid-fullwidth.section:has(.new-hmk-brand-papergrey) .card-block.responsivegrid"
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
        "div.newcardscomponent-variations.section:has(.cards-variation)"
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
      "name": "intro-navy",
      "selector": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-togatherblue)"
      ],
      "style": "dark, center",
      "blocks": [],
      "defaultContent": [
        ".one-card-content-center-container h2.d-lg-block",
        ".one-card-content-center-container .body-text.d-lg-block"
      ]
    },
    {
      "id": "3",
      "name": "lost-coverage",
      "selector": [
        "div.card-block.responsivegrid.section:has(.wideCardWrapper)"
      ],
      "style": "center",
      "blocks": [
        "cards-minimal-dark-withimg-icons"
      ],
      "defaultContent": [
        ".cardBlockTitleContainer h2",
        ".cardBlockTitleContainer .cardDescription"
      ]
    },
    {
      "id": "4",
      "name": "comparison-tool-banner",
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
      "id": "5",
      "name": "why-highmark",
      "selector": [
        "section.container-fluid-fullwidth.section:has(.new-hmk-brand-papergrey)"
      ],
      "style": "grey",
      "blocks": [
        "cards-minimal-dark-withimg"
      ],
      "defaultContent": [
        ".cardBlockTitleContainer h2",
        ".cardBlockTitleContainer .cardDescription"
      ]
    },
    {
      "id": "6",
      "name": "aca-basics",
      "selector": [
        "div.card-block.responsivegrid.section:has(.cardWrapper.ghostMode):not(:has(.wideCardWrapper)):not(:has(.cardWrapper:nth-of-type(4)))"
      ],
      "style": "center",
      "blocks": [
        "cards-minimal-dark-withimg-icons"
      ],
      "defaultContent": [
        ".cardBlockTitleContainer h2",
        ".cardBlockTitleContainer .cardDescription",
        ".hmk-brand-buttons.brand-center-content a"
      ]
    },
    {
      "id": "7",
      "name": "open-enrollment",
      "selector": [
        "div.newcardscomponent-variations.section:has(.side-card-panel)"
      ],
      "style": "blue",
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "8",
      "name": "benefits",
      "selector": [
        "div.card-block.responsivegrid.section:has(.cardWrapper.ghostMode):not(:has(.wideCardWrapper)):has(.cardWrapper:nth-of-type(4))"
      ],
      "style": "center",
      "blocks": [
        "cards-minimal-dark-withimg-icons"
      ],
      "defaultContent": [
        ".cardBlockTitleContainer h2",
        ".cardBlockTitleContainer .cardDescription",
        ".hmk-brand-buttons.brand-center-content a"
      ]
    },
    {
      "id": "9",
      "name": "help-cards",
      "selector": [
        "div.newcardscomponent-variations.section:has(.cards-variation)"
      ],
      "style": "light",
      "blocks": [
        "cards-minimal-dark-withimg-2"
      ],
      "defaultContent": []
    },
    {
      "id": "10",
      "name": "closing-cta",
      "selector": [
        "div.onecard1colpanel.section:has(.new-hmk-brand-blush-twnetyfive)"
      ],
      "style": "highlight",
      "blocks": [],
      "defaultContent": [
        ".one-card-content-center-container h2.d-lg-block",
        ".one-card-content-center-container .body-text.d-lg-block",
        ".hmk-brand-buttons.brand-center-content a"
      ]
    },
    {
      "id": "11",
      "name": "footnotes",
      "selector": [
        "section.container-fluid-fullwidth.section:has(.cmp-text):not(:has(.card-block))"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".cmp-text p"
      ]
    }
  ]
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
    // Page metadata: source meta tags + theme=shop (auto-opens the ZIP modal)
    // and breadcrumbs=true, both read by scripts/scripts.js.
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    meta.theme = 'shop';
    meta.breadcrumbs = 'true';
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
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
