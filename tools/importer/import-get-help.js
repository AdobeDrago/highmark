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
  "name": "get-help",
  "description": "Plan specialist help page: secondary banner, navy intro band, advisor side panels, optional photo banner, icon cards, two help cards (schedule / call) and a light-blue member CTA",
  "urls": [
    "https://www.highmark.com/plans/medicare/get-help",
    "https://www.highmark.com/plans/individual-families/get-help"
  ],
  "blocks": [
    {
      "name": "hero-minimal-dark-withimg",
      "instances": [
        "div.secondary-banner.responsivegrid",
        "div.onecard1colpanel:has(.one-card-one-col-panel.image)"
      ]
    },
    {
      "name": "columns-minimal-dark",
      "instances": [
        "div.newcardscomponent-variations:has(.side-card-panel)"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg-icons",
      "instances": [
        "div.card-block.responsivegrid:has(.cardWrapper.ghostMode)"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg-2",
      "instances": [
        "div.newcardscomponent-variations:has(.cards-variation):not(:has(.side-card-panel))"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "hero",
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
      "name": "navy-intro",
      "selector": [
        "div.onecard1colpanel:has(.one-card-one-col-panel.new-hmk-brand-togatherblue)"
      ],
      "style": "dark, center",
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "advisor-panel",
      "selector": [
        "div.newcardscomponent-variations:has(.side-card-panel.new-hmk-brand-polar)"
      ],
      "style": "light",
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "4",
      "name": "photo-banner",
      "selector": [
        "div.onecard1colpanel:has(.one-card-one-col-panel.image)"
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
        "div.card-block.responsivegrid:has(.cardWrapper.ghostMode)"
      ],
      "style": "center",
      "blocks": [
        "cards-minimal-dark-withimg-icons"
      ],
      "defaultContent": []
    },
    {
      "id": "6",
      "name": "blush-panel",
      "selector": [
        "div.newcardscomponent-variations:has(.side-card-panel.new-hmk-brand-blush-twnetyfive)"
      ],
      "style": "highlight",
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "7",
      "name": "help-cards",
      "selector": [
        "div.newcardscomponent-variations:has(.cards-variation):not(:has(.side-card-panel))"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-dark-withimg-2"
      ],
      "defaultContent": []
    },
    {
      "id": "8",
      "name": "member-cta",
      "selector": [
        "section.container-fluid-fullwidth.aem-GridColumn:has(.new-hmk-brand-fifteenpercent-splash)"
      ],
      "style": "light-blue, center",
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "9",
      "name": "footnotes",
      "selector": [
        "section.container-fluid-fullwidth.aem-GridColumn:not(:has(.new-hmk-brand-fifteenpercent-splash)):has(.cmp-text)"
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
    // with the source label, and template=get-help (body class scoping).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    meta.template = 'get-help';
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
