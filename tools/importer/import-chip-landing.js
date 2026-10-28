/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroMinimalDarkWithimgParser from './parsers/hero-minimal-dark-withimg.js';
import cardsMinimalDarkIconnavParser from './parsers/cards-minimal-dark-iconnav.js';
import cardsMinimalDarkWithimgIconsParser from './parsers/cards-minimal-dark-withimg-icons.js';
import columnsMinimalDarkParser from './parsers/columns-minimal-dark.js';
import cardsMinimalDarkWithimg2Parser from './parsers/cards-minimal-dark-withimg-2.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-chip-landing-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-minimal-dark-withimg': heroMinimalDarkWithimgParser,
  'cards-minimal-dark-iconnav': cardsMinimalDarkIconnavParser,
  'cards-minimal-dark-withimg-icons': cardsMinimalDarkWithimgIconsParser,
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
  "name": "chip-landing",
  "description": "Western PA CHIP landing page: photo hero, navy icon quick-link bar, colour bands with centred CTAs, small-icon card list, image/text support panel, two wide help cards",
  "urls": [
    "https://www.highmark.com/western-pennsylvania/chip?zg=false"
  ],
  "blocks": [
    {
      "name": "hero-minimal-dark-withimg",
      "instances": [
        "div.hero.responsivegrid.section"
      ]
    },
    {
      "name": "cards-minimal-dark-iconnav",
      "instances": [
        "div.quicklinks.section"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg-icons",
      "instances": [
        "section.container-fluid-fullwidth.section:has(li.listSmlImg)"
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
      "name": "quicklinks",
      "selector": [
        "div.quicklinks.section"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-dark-iconnav"
      ],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "understanding-band",
      "selector": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-fifteenpercent-splash)"
      ],
      "style": "light-blue, center",
      "blocks": [],
      "defaultContent": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-fifteenpercent-splash) h2",
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-fifteenpercent-splash) p",
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-fifteenpercent-splash) a"
      ]
    },
    {
      "id": "4",
      "name": "get-care",
      "selector": [
        "section.container-fluid-fullwidth.section:has(li.listSmlImg)"
      ],
      "style": "center",
      "blocks": [
        "cards-minimal-dark-withimg-icons"
      ],
      "defaultContent": [
        "section.container-fluid-fullwidth.section:has(li.listSmlImg) h2.cardsTitle",
        "section.container-fluid-fullwidth.section:has(li.listSmlImg) p.cardsPara"
      ]
    },
    {
      "id": "5",
      "name": "renew-band",
      "selector": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive)"
      ],
      "style": "highlight, center",
      "blocks": [],
      "defaultContent": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive) h2",
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive) p",
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive) a"
      ]
    },
    {
      "id": "6",
      "name": "enhanced-supports",
      "selector": [
        "div.newcardscomponent-variations.section:has(.side-card-panel)"
      ],
      "style": "light",
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "7",
      "name": "promo-cards",
      "selector": [
        "div.newcardscomponent-variations.section:has(.cards-variation)"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-dark-withimg-2"
      ],
      "defaultContent": []
    },
    {
      "id": "8",
      "name": "get-covered-cta",
      "selector": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-polar)"
      ],
      "style": "light, center",
      "blocks": [],
      "defaultContent": [
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-polar) h2",
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-polar) p",
        "div.onecard1colpanel.section:has(.one-card-one-col-panel.new-hmk-brand-polar) a"
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
    // Page metadata: source meta tags + breadcrumbs, with the short label the
    // child CHIP pages show for this page in their breadcrumb trail.
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    meta.breadcrumbs = 'true';
    meta['Breadcrumb Title'] = 'CHIP - Highmark Healthy Kids';
    // body.chip-landing scopes this page's landing-specific styles
    meta.template = 'chip-landing';
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
