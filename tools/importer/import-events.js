/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import pressReleaseListParser from './parsers/press-release-list.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {
  'press-release-list': pressReleaseListParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "events",
  "description": "About > Events: h1, the press-release-list (events) block (keyword search, Region/Date filters, result count, load more) rendering every event from the /about/events-data.json sheet, then the right-rail callout (h3, description, CTA) as default content",
  "urls": [
    "https://www.highmark.com/about/events"
  ],
  "blocks": [
    {
      "name": "press-release-list",
      "instances": [
        "div.events.aem-GridColumn"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "events-listing",
      "selector": [
        "main.container"
      ],
      "style": null,
      "blocks": [
        "press-release-list"
      ],
      "defaultContent": [
        ".rightrail-container"
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

    // Right-rail callout (South Park play list): plain h3 + description + CTA link, so it
    // imports as default content after the block. Its <hr class="breakLine"> (the blue
    // rule under the title, drawn by CSS here) would otherwise become a section break.
    main.querySelectorAll('.rightrail-container').forEach((rail) => {
      const title = rail.querySelector('.rightrail-title h3, h3');
      const desc = rail.querySelector('.rightrail-description');
      const cta = rail.querySelector('.hmk-brand-buttons a[href], a[href]');
      const out = [];
      if (title) {
        const h3 = document.createElement('h3');
        h3.textContent = title.textContent.replace(/\s+/g, ' ').trim();
        out.push(h3);
      }
      if (desc) {
        const p = document.createElement('p');
        p.textContent = desc.textContent.replace(/\s+/g, ' ').trim();
        out.push(p);
      }
      if (cta) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = cta.getAttribute('href');
        a.textContent = cta.textContent.replace(/\s+/g, ' ').trim();
        p.append(a);
        out.push(p);
      }
      rail.replaceWith(...out);
    });

    // 1. beforeTransform (cleanup + section breaks)
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced by a prior parser.
    // press-release-list (events) replaces the whole listing (incl. its heading, kept as the h1).
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
    // with the source label, and template=events (body class scoping).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    if (!meta.Title) {
      const h1 = main.querySelector('h1');
      if (h1) meta.Title = h1.textContent.replace(/\s+/g, ' ').trim();
    }
    meta.template = 'events';
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
