/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "because-life-article",
  "description": "Because Life article (because-life/proactive-care): one centred column with breadcrumb, title, photo and short H3 sections, a light-blue \"Explore your benefits\" CTA box (section style splash) and a footnote. Authored with Template: legal, whose column and type match the source's",
  "urls": [
    "https://www.highmark.com/because-life/proactive-care"
  ],
  "blocks": [],
  "sections": [
    {
      "id": "1",
      "name": "article",
      "selector": [
        "main .page__par h1"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "cta-box",
      "selector": [
        "main .page__par section.new-hmk-brand-fifteenpercent-splash"
      ],
      "style": "splash",
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "footnote",
      "selector": [
        "main .page__par section.container-fluid-fullwidth:has(sub):not(:has(h1, h2))"
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

    // The source's spacing components have no EDS equivalent (the template's margins do
    // their work).
    WebImporter.DOMUtils.remove(main, ['main .page__par .spacing']);
    // The source's filled button (a.brand-button-normal, "Get Started") -> a bold link, which
    // the site makes a button (the splash box fills it, as on the source).
    main.querySelectorAll('.hmk-brand-buttons a.brand-button-normal').forEach((a) => {
      const strong = document.createElement('strong');
      a.replaceWith(strong);
      strong.append(a);
    });
    // External-link glyph next to (not inside) the link -> the site's :external-link: icon token.
    // (the source adds the <i> glyph at runtime to links wrapped in span.global-clr_externallink)
    main.querySelectorAll('span.global-clr_externallink').forEach((span) => {
      span.querySelectorAll('i.fa-external-link-alt').forEach((i) => i.remove());
      const link = span.querySelector('a');
      if (link && !link.textContent.includes(':external-link:')) link.append(' :external-link:');
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
    // with the source label, and template=legal (its column and type are the source's).
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
