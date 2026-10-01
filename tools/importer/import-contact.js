/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS


// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-template-sections.js';

// PARSER REGISTRY
const parsers = {

};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries/metadata.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "contact",
  "description": "Contact Us: intro, Members / Providers / Reporting Fraud guidance, mailing address, blush warning callout (the source contact form is not migrated)",
  "urls": [
    "https://www.highmark.com/contact"
  ],
  "blocks": [],
  "sections": [
    {
      "id": "1",
      "name": "intro-and-guidance",
      "selector": [
        "main .page__par > section > .parent-width > section > .aem-Grid > .cmp-text"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "warning-callout",
      "selector": [
        "main .page__par > section > .parent-width > section > .aem-Grid > section.container-fluid-fullwidth"
      ],
      "style": "highlight",
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

    // The contact form is not migrated (it posts through a reCAPTCHA bound to highmark.com):
    // drop the required-fields note first (its selector depends on the form's position), then the form.
    WebImporter.DOMUtils.remove(main, ['main .page__par > section > .parent-width > section > .aem-Grid > .cmp-text:has(+ .form-container)']);
    WebImporter.DOMUtils.remove(main, [
      'main .page__par > section > .parent-width > section > .aem-Grid > .form-container', 'form#contact-form', 'form.customFormContainer',
      '.grecaptcha-badge', 'iframe[src*="recaptcha"]', 'textarea[name="g-recaptcha-response"]',
      'main .page__par .spacing',
    ]);
    // "form below" jumped to the form (#contact), which no longer exists: keep the text, drop the link.
    main.querySelectorAll('a[href="#contact"]').forEach((a) => a.replaceWith(...a.childNodes));
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
    // with the source label, and template=contact (body class scoping).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    if (crumb) {
      meta.breadcrumbs = 'true';
      if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    }
    meta.template = 'contact';
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
