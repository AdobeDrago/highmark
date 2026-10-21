/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsMinimalLightSidenavParser from './parsers/cards-minimal-light-sidenav.js';
import accordionMinimalLightParser from './parsers/accordion-minimal-light.js';
import tableMinimalDarkCompareParser from './parsers/table-minimal-dark-compare.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/highmark-cleanup.js';
import sectionsTransformer, { spacerHeights, spaceStyle } from './transformers/highmark-faq-topic-sections.js';

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
  name: 'employer-plan',
  description: 'Employer plan pages (/employer/solutions/{small,large}-business/<region>/medical-plans/<plan>, and Western PA\'s balanced-funding and pharmacy): breadcrumbs with Print / Share, the region\'s plans as a left nav, the article (headings, text, images, buttons) and a grey "Get more info" right rail. The same sections as the FAQ topic pages (transformers/highmark-faq-topic-sections.js, Template faq, employer-plan).',
  urls: [
    'https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/choice-blue',
    'https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/epo-blue-easy',
    'https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/lehigh-valley-flex-blue',
    'https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/performance-blue',
    'https://www.highmark.com/employer/solutions/large-business/cpa/medical-plans/performance-blue-flex',
    'https://www.highmark.com/employer/solutions/large-business/de/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/de/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/large-business/neny/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/neny/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/epo-blue-easy',
    'https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/lehigh-valley-flex-blue',
    'https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/performance-blue',
    'https://www.highmark.com/employer/solutions/large-business/nepa/medical-plans/performance-blue-flex',
    'https://www.highmark.com/employer/solutions/large-business/sepa/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/sepa/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/large-business/sepa/medical-plans/epo-blue',
    'https://www.highmark.com/employer/solutions/large-business/wny/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/wny/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/epo-blue-easy',
    'https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/performance-blue',
    'https://www.highmark.com/employer/solutions/large-business/wpa/medical-plans/performance-blue-flex',
    'https://www.highmark.com/employer/solutions/large-business/wv/medical-plans/copay-go',
    'https://www.highmark.com/employer/solutions/large-business/wv/medical-plans/copay-go-hdhp',
    'https://www.highmark.com/employer/solutions/small-business/cpa/medical-plans/choice-blue',
    'https://www.highmark.com/employer/solutions/small-business/cpa/medical-plans/lehigh-valley-flex-blue',
    'https://www.highmark.com/employer/solutions/small-business/nepa/medical-plans/lehigh-valley-flex-blue',
    'https://www.highmark.com/employer/solutions/small-business/wpa/medical-plans/together-blue',
    'https://www.highmark.com/employer/solutions/large-business/wpa/balanced-funding',
    'https://www.highmark.com/employer/solutions/large-business/wpa/pharmacy',
    'https://www.highmark.com/employer/solutions/small-business/wpa/balanced-funding',
    'https://www.highmark.com/employer/solutions/small-business/wpa/pharmacy',
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
    // The employer header and footer (the site's own header and footer are used)
    WebImporter.DOMUtils.remove(main, [
      '.newheaderbar', '.newmainnavigation', '.empmobilenav',
      '.experiencefragment:has(.global-footer)',
      '.conf-extra-links-container',
      '.wrapper-header-container',
      '.global-footer',
      '.iedetect',
    ]);
    // A link whose text sits inside the source's external-link span (Surprise Billing: <a>
    // <span.global-clr_externallink><b>FAIR HEALTH CONSUMER</b></span></a>): the text goes
    // before the span, which the sections transformer replaces with the :external-link: icon.
    main.querySelectorAll('a .global-clr_externallink').forEach((span) => {
      span.before(...[...span.childNodes].filter((n) => !(n.nodeType === 1 && n.matches('i, em'))));
    });
    // The source's lead text (span.p1, a whole paragraph: the formulary pages' plan-type
    // lines) -> an H5, which is how the other lead lines here are authored; the sections
    // transformer would make it an all-bold paragraph, and on these pages those are
    // plain bold labels ("Emergency services").
    main.querySelectorAll('p span.p1').forEach((span) => {
      const p = span.closest('p');
      if (p.textContent.trim() !== span.textContent.trim()) return;
      const h5 = document.createElement('h5');
      h5.append(...span.childNodes);
      p.replaceWith(h5);
    });
    // The light-blue band below the article (Find a Pharmacy's "Log in to your member
    // portal", outside the source's <main>): its own section, Style light-blue (the
    // sections transformer turns the marker into Section Metadata, as its own).
    main.querySelectorAll('section.new-hmk-brand-fifteenpercent-splash').forEach((band) => {
      if (!band.textContent.trim()) return;
      const hr = document.createElement('hr');
      hr.setAttribute('data-excat-section-id', 'light-blue');
      band.before(hr);
    });
    // the source's PDF icon (a Material Icons ligature, "picture_as_pdf") -> the :pdf: icon
    main.querySelectorAll('a i[class*="material-icons"]').forEach((i) => {
      if (i.textContent.trim() === 'picture_as_pdf') i.replaceWith(document.createTextNode(':pdf: '));
    });
    // Without a left nav the page is a plain article: Template legal (and employer-plan).
    const navEl = main.querySelector('div.col-lg-3 div.nav-container:has(.sidenav, .sidenav-item-list)');
    const hasNav = !!navEl;
    // The spacers that close the text column: the
    // sections transformer keeps spacers only ahead of content, so they become an empty
    // section with their space-* style, between the text and the "Questions?" box / band.
    const h1 = main.querySelector('h1');
    if (h1 && hasNav) {
      let column = h1;
      while (column.parentElement && column.parentElement !== main
        && !column.parentElement.contains(navEl)) column = column.parentElement;
      const leaves = [...column.querySelectorAll('.aem-GridColumn')].filter((el) => !el.querySelector('.aem-GridColumn')
        && !el.closest('.rightrail-container, .rightRail, div.one-card-one-col-panel') && !el.querySelector('.rightrail-container, div.one-card-one-col-panel'));
      const lastContent = leaves.findLastIndex((el) => !el.matches('.spacing'));
      const trailing = leaves.slice(lastContent + 1).map(spacerHeights)
        .reduce((sum, h) => sum.map((v, j) => v + h[j]), [0, 0, 0]);
      if (lastContent >= 0 && trailing.some(Boolean)) {
        const hr = document.createElement('hr');
        hr.setAttribute('data-excat-section-id', spaceStyle(trailing));
        leaves[lastContent].after(hr);
      }
    }

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

    // 5. Page metadata: the source meta tags, the faq template with employer-plan (legal
    // without a left nav) and breadcrumbs (with the source label; the breadcrumbs block
    // brings Print / Share).
    const hr = document.createElement('hr');
    main.appendChild(hr);
    const meta = WebImporter.Blocks.getMetadata(document) || {};
    meta.Template = hasNav ? 'faq, employer-plan' : 'legal, employer-plan';
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
