/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroMinimalDarkWithimgParser from './parsers/hero-minimal-dark-withimg.js';
import cardsMinimalDarkWithimgIconsParser from './parsers/cards-minimal-dark-withimg-icons.js';
import columnsMinimalDarkParser from './parsers/columns-minimal-dark.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-minimal-dark-withimg': heroMinimalDarkWithimgParser,
  'cards-minimal-dark-withimg-icons': cardsMinimalDarkWithimgIconsParser,
  'columns-minimal-dark': columnsMinimalDarkParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "employer-landing",
  "description": "Employer landing page: landing hero, business-size icon cards, alternating photo/text side panels, blush CTA band",
  "urls": [
    "https://www.highmark.com/employer"
  ],
  "blocks": [
    {
      "name": "hero-minimal-dark-withimg",
      "instances": [
        "div.hero.responsivegrid.section"
      ]
    },
    {
      "name": "cards-minimal-dark-withimg-icons",
      "instances": [
        "div.newcardscomponent-variations.section:has(li.listSmlImg)"
      ]
    },
    {
      "name": "columns-minimal-dark",
      "instances": [
        "section.container-fluid-fullwidth.section:has(.side-card-panel)",
        "div.newcardscomponent-variations.section:has(.side-card-panel)"
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
      "name": "business-size",
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
      "id": "3",
      "name": "enhancing-experience",
      "selector": [
        "section.container-fluid-fullwidth.section:has(.side-card-panel)"
      ],
      "style": "light",
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "4",
      "name": "managing-cost",
      "selector": [
        "div.newcardscomponent-variations.section:has(.side-card-panel:not(.new-hmk-brand-polar))"
      ],
      "style": null,
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "5",
      "name": "improving-outcomes",
      "selector": [
        "div.newcardscomponent-variations.section:has(.side-card-panel.new-hmk-brand-polar)"
      ],
      "style": "light",
      "blocks": [
        "columns-minimal-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "6",
      "name": "find-plan-callout",
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

    // Hero "Discover How" jumps to the source wrapper #anchor, which doesn't survive the
    // import; point it at the first side panel's heading id instead.
    main.querySelectorAll('a[href="#anchor"]').forEach((a) => a.setAttribute('href', '#enhancing-the-experience'));
    // Business-size cards are ZIP-gated href="#" links on the source; use the regional pages.
    [['small-group-plans-link', '/employer/solutions/small-business'],
      ['large-group-plans-link', '/employer/solutions/large-business'],
      ['national-group-plans-link', '/employer/solutions/national-business']].forEach(([id, href]) => {
      main.querySelectorAll(`a#${id}[href="#"]`).forEach((a) => a.setAttribute('href', href));
    });

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
    // with the source label, and template=employer-landing (body class scoping).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    meta['Breadcrumb Title'] = 'Employer';
    meta.template = 'employer-landing';
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
