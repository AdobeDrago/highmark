/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import formMinimalLightParser from './parsers/form-minimal-light.js';
import cardsMinimalLightSidenavParser from './parsers/cards-minimal-light-sidenav.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {
  'form-minimal-light': formMinimalLightParser,
  'cards-minimal-light-sidenav': cardsMinimalLightSidenavParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json. One script for the
// Health Care Fraud Form and the confirmation pages the fraud and contact forms redirect to.
const TEMPLATES = {
  "/fraud/fraud-form": {
  "name": "fraud-form",
  "description": "Fraud Prevention > Health Care Fraud Form: Fraud Prevention side nav, h1, intro, required-fields note, then the form-minimal-light block (fields from /fraud/fraud-form-fields.json, built by tools/forms/build-fraud-form-fields.mjs)",
  "urls": [
    "https://www.highmark.com/fraud/fraud-form"
  ],
  "blocks": [
    {
      "name": "cards-minimal-light-sidenav",
      "instances": [
        "div.d-none.d-lg-block.col-lg-3 div.nav-container"
      ]
    },
    {
      "name": "form-minimal-light",
      "instances": [
        "form#fraud-form"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "fraud-form",
      "selector": [
        "main.container"
      ],
      "style": null,
      "blocks": [
        "cards-minimal-light-sidenav",
        "form-minimal-light"
      ],
      "defaultContent": [
        "div.page__par div.cmp-text"
      ]
    }
  ]
},
  "/fraud-thank-you": {
  "name": "fraud-thank-you",
  "description": "The Health Care Fraud Form confirmation page (the form redirects here): h1 + one paragraph",
  "urls": [
    "https://www.highmark.com/fraud-thank-you"
  ],
  "blocks": [],
  "sections": [
    {
      "id": "1",
      "name": "thank-you",
      "selector": [
        "main"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "div.cmp-text"
      ]
    }
  ]
},
};
// The Contact Us form's confirmation page has the same content and template.
TEMPLATES['/contact-thank-you'] = TEMPLATES['/fraud-thank-you'];
let PAGE_TEMPLATE = TEMPLATES['/fraud/fraud-form'];

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

    // Which page: the form, or its confirmation page.
    const pagePath = new URL(params.originalURL).pathname.replace(/\.html?$/, '').replace(/\/$/, '');
    PAGE_TEMPLATE = TEMPLATES[pagePath] || TEMPLATES['/fraud/fraud-form'];

    // Empty (&nbsp;) spacer paragraphs.
    main.querySelectorAll('.cmp-text p').forEach((p) => {
      // String#trim() also strips U+00A0 (&nbsp;).
      if (!p.textContent.trim() && !p.querySelector('img, picture')) p.remove();
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
    // with the source label, and template=legal (as the other /fraud pages). The
    // confirmation page has no source breadcrumb, so no breadcrumbs.
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    meta.template = 'legal';
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
