/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsMinimalLightSidenavParser from './parsers/cards-minimal-light-sidenav.js';
import accordionMinimalLightParser from './parsers/accordion-minimal-light.js';
import tableMinimalDarkCompareParser from './parsers/table-minimal-dark-compare.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer from './transformers/highmark-faq-topic-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-minimal-light-sidenav': cardsMinimalLightSidenavParser,
  'accordion-minimal-light': accordionMinimalLightParser,
  'table-minimal-dark-compare': tableMinimalDarkCompareParser,
};

// TRANSFORMER REGISTRY — cleanup first, then section boundaries.
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION — embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'faq-topic',
  description: 'FAQ landing and topic pages: breadcrumbs with Print / Share, a left nav listing every FAQ topic, an H1 + intro, FAQ accordion groups each followed by Back to Top, and on some pages a right-rail callout and a blush CTA band',
  urls: [
    'https://www.highmark.com/resources/answers/faq',
    'https://www.highmark.com/resources/answers/faq/aca-plans',
    'https://www.highmark.com/resources/answers/faq/behavioral-health-medication',
    'https://www.highmark.com/resources/answers/faq/western-ny-blue-fund',
    'https://www.highmark.com/resources/answers/faq/northeastern-ny-blue-fund',
    'https://www.highmark.com/resources/answers/faq/breast-cancer',
    'https://www.highmark.com/resources/answers/faq/cervical-cancer',
    'https://www.highmark.com/resources/answers/faq/chip',
    'https://www.highmark.com/resources/answers/faq/colorectal-cancer',
    'https://www.highmark.com/resources/answers/faq/covid',
    'https://www.highmark.com/resources/answers/faq/ebill-help',
    'https://www.highmark.com/resources/answers/faq/ebill-terms',
    'https://www.highmark.com/resources/answers/faq/explanation-of-benefits',
    'https://www.highmark.com/resources/answers/faq/high-blood-pressure',
    'https://www.highmark.com/resources/answers/faq/home-prescription-delivery',
    'https://www.highmark.com/resources/answers/faq/insurance-terms',
    'https://www.highmark.com/resources/answers/faq/measles',
    'https://www.highmark.com/resources/answers/faq/medicare',
    'https://www.highmark.com/resources/answers/faq/member-account-login',
    'https://www.highmark.com/resources/answers/faq/preventive-diagnostic-screening',
    'https://www.highmark.com/resources/answers/faq/spending-accounts',
  ],
  blocks: [
    { name: 'cards-minimal-light-sidenav', instances: ['div.col-lg-3 div.nav-container:has(.sidenav, .sidenav-item-list)'] },
    { name: 'accordion-minimal-light', instances: ['div.accordianTable'] },
    // source div.comparisontable, rebuilt as a plain table by the sections transformer
    { name: 'table-minimal-dark-compare', instances: ['div.faq-compare-table'] },
    { name: 'section-right-rail', instances: ['.rightrail-container'], section: 'right-rail' },
    { name: 'section-cta-highlight', instances: ['div.one-card-one-col-panel.new-hmk-brand-blush-twnetyfive'], section: 'highlight' },
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

/** Find all block instances on the page. */
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
        claimed.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  /**
   * Non-breaking spaces in text ("(ACA)&nbsp;FAQ") keep the source's line breaks,
   * but the importer drops them: it copies the page before the transform, and the
   * Markdown round trip turns any left (and &nbsp; entities) into plain spaces. So,
   * on the live page, each becomes U+E000, a private-use character no step treats as
   * whitespace, and upload-to-da.mjs turns it back into &nbsp;. Other text that is
   * only spaces is left alone.
   *
   * In the answers the source spaces blocks with empty paragraphs (<p>&nbsp;</p>),
   * one line high, and only some blocks have one (a paragraph is followed by its
   * list without a gap). They're kept as a paragraph holding a zero-width space
   * (the pipeline drops a paragraph holding only &nbsp; as blank); faq.css gives
   * answer paragraphs no margins.
   */
  onLoad: ({ document }) => {
    document.querySelectorAll('.collapsible-item-description > p').forEach((p) => {
      if (!p.querySelector('img, br') && !p.textContent.replace(/[\s\u00a0]/g, '')) p.textContent = '\u200b';
    });
    const walker = document.createTreeWalker(document.body, 4 /* NodeFilter.SHOW_TEXT */);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.filter((t) => t.nodeValue.includes('\u00a0') && /[^\s\u00a0]/.test(t.nodeValue)).forEach((t) => {
      t.nodeValue = t.nodeValue.replace(/\u00a0/g, '\ue000');
    });
  },

  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // Source breadcrumb label for this page ("ACA", "WNY Blue Fund"), read before
    // cleanup removes the breadcrumb row.
    const crumb = document.querySelector('ol.breadcrumb-list li.active');
    const crumbLabel = (crumb?.textContent || '').replace(/\s+/g, ' ').trim();

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

    // 5. Page metadata: the source meta tags, the faq template, and breadcrumbs
    // (with the source label); the breadcrumbs block brings Print / Share.
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    meta.Template = 'faq';
    meta.breadcrumbs = 'true';
    if (crumbLabel) meta['Breadcrumb Title'] = crumbLabel;
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
