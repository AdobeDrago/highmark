/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import glossaryTransformer from './transformers/highmark-glossary-sections.js';

// TRANSFORMER REGISTRY — cleanup first, then the glossary's sections. The
// transformer builds the hero block itself, so there are no parsers.
const transformers = [
  cleanupTransformer,
  glossaryTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'glossary',
  description: 'Health Insurance Glossary: breadcrumbs with Print / Share, a hero with the H1 and a lead intro, an A–Z bar, and one group per letter (letter badge, terms, Back to Top)',
  urls: [
    'https://www.highmark.com/resources/answers/health-insurance-glossary',
  ],
  blocks: [
    { name: 'hero-minimal-light', instances: ['section.new-hmk-brand-fifteenpercent-splash'] },
    { name: 'section-glossary-letters', instances: ['div.glossary .glossary-name-list'], section: 'glossary-letters' },
    { name: 'section-glossary', instances: ['div.glossary .glossary-list'], section: 'glossary' },
  ],
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

export default {
  /**
   * Non-breaking spaces in text keep the source's line breaks, but the importer drops
   * them (see import-faq-topic.js): on the live page each becomes U+E000, which
   * upload-to-da.mjs turns back into &nbsp;. Text that is only spaces is left alone.
   */
  onLoad: ({ document }) => {
    const walker = document.createTreeWalker(document.body, 4 /* NodeFilter.SHOW_TEXT */);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.filter((t) => t.nodeValue.includes('\u00a0') && /[^\s\u00a0]/.test(t.nodeValue)).forEach((t) => {
      t.nodeValue = t.nodeValue.replace(/\u00a0/g, '\ue000');
    });
  },

  transform: (payload) => {
    const {
      document, url, params,
    } = payload;

    const main = document.body;

    // Source breadcrumb label, read before cleanup removes the breadcrumb row.
    const crumb = document.querySelector('ol.breadcrumb-list li.active');
    const crumbLabel = (crumb?.textContent || '').replace(/\s+/g, ' ').trim();

    executeTransformers('beforeTransform', main, payload);
    executeTransformers('afterTransform', main, payload);

    // Page metadata: the source meta tags, the glossary template, and breadcrumbs
    // (with the source label); the breadcrumbs block brings Print / Share.
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    meta.Template = 'glossary';
    meta.breadcrumbs = 'true';
    if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
    main.append(WebImporter.Blocks.getMetadataBlock(document, meta));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

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
        blocks: ['hero-minimal-light'],
      },
    }];
  },
};
