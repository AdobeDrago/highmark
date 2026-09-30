/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsMinimalLightSidenavParser from './parsers/cards-minimal-light-sidenav.js';
import tableMinimalDarkCompareParser from './parsers/table-minimal-dark-compare.js';
import accordionMinimalLightParser from './parsers/accordion-minimal-light.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-chip-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-minimal-light-sidenav': cardsMinimalLightSidenavParser,
  'table-minimal-dark-compare': tableMinimalDarkCompareParser,
  'accordion-minimal-light': accordionMinimalLightParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "chip",
  "description": "Western PA CHIP article page: left CHIP section nav, main article (headings, lists, pricing tables or an FAQ accordion on some pages), a small grey right-rail callout, and on some pages a light-blue centered CTA band",
  "urls": [
    "https://www.highmark.com/western-pennsylvania/chip/chip-eligibility-and-costs",
    "https://www.highmark.com/western-pennsylvania/chip/chip-resources",
    "https://www.highmark.com/western-pennsylvania/chip/doctors-drugs",
    "https://www.highmark.com/western-pennsylvania/chip/what-is-chip"
  ],
  "blocks": [
    {
      "name": "cards-minimal-light-sidenav",
      "instances": [
        "div.d-none.d-lg-block.col-lg-3 div.nav-container:has(.sidenav)"
      ]
    },
    {
      "name": "table-minimal-dark-compare",
      "instances": [
        ".dynamic-table-container:has(table.d-md-table)"
      ]
    },
    {
      "name": "accordion-minimal-light",
      "instances": [
        "div.col-lg-9 > div.row > div.col-lg-9 div.page__par .accordianTable"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "sidenav",
      "selector": [
        "div.d-none.d-lg-block.col-lg-3 div.nav-container:has(.sidenav)"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-light-sidenav"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "main-content",
      "selector": [
        "div.col-lg-9 > div.row > div.col-lg-9 div.page__par"
      ],
      "style": null,
      "blocks": [
        "table-minimal-dark-compare",
        "accordion-minimal-light"
      ],
      "defaultContent": [
        "div.col-lg-9 > div.row > div.col-lg-9 div.page__par h1",
        "div.col-lg-9 > div.row > div.col-lg-9 div.page__par h2",
        "div.col-lg-9 > div.row > div.col-lg-9 div.page__par h3",
        "div.col-lg-9 > div.row > div.col-lg-9 div.page__par h5",
        "div.col-lg-9 > div.row > div.col-lg-9 div.page__par p",
        "div.col-lg-9 > div.row > div.col-lg-9 div.page__par ul",
        "div.col-lg-9 > div.row > div.col-lg-9 div.page__par img"
      ]
    },
    {
      "id": "3",
      "name": "right-rail-callout",
      "selector": [
        "div.rightRail .rightrail-container"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "div.rightRail .rightrail-container h2, div.rightRail .rightrail-container h3",
        "div.rightRail .rightrail-container p",
        "div.rightRail .rightrail-container a"
      ]
    },
    {
      "id": "4",
      "name": "cta-band",
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
  // Runs before helix-importer's preProcess() (which strips empty inline
  // elements, e.g. Font Awesome <i> icons) — see highmark-chip-sections.js.
  preprocess: (payload) => {
    executeTransformers('preprocess', payload.document.body, payload);
  },

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
    // Page metadata: source meta tags + breadcrumbs=true (read by scripts/scripts.js)
    // and template=chip (body.chip scopes the CHIP three-column layout).
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    meta.breadcrumbs = 'true';
    meta.template = 'chip';
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
